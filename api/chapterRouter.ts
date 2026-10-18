import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, eq, sql } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { chapters, novels, readingProgress } from "../db/schema";
import { countWords } from "./novelRouter";

async function refreshNovelStats(novelId: number) {
  const db = getDb();
  const published = await db
    .select({ id: chapters.id, wordCount: chapters.wordCount })
    .from(chapters)
    .where(and(eq(chapters.novelId, novelId), eq(chapters.status, "published")));
  await db
    .update(novels)
    .set({
      chapterCount: published.length,
      wordCount: published.reduce((s, c) => s + c.wordCount, 0),
    })
    .where(eq(novels.id, novelId));
}

export const chapterRouter = createRouter({
  /** Read a chapter by novel slug + chapter number. Increments view count. */
  read: publicQuery
    .input(z.object({ slug: z.string(), number: z.number().int().min(1) }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const [novel] = await db.select().from(novels).where(eq(novels.slug, input.slug)).limit(1);
      if (!novel) throw new TRPCError({ code: "NOT_FOUND", message: "Novel tidak ditemukan" });
      const isOwner = ctx.user?.id === novel.authorId;
      if (!novel.isPublished && !isOwner)
        throw new TRPCError({ code: "NOT_FOUND", message: "Novel tidak ditemukan" });
      const [chapter] = await db
        .select()
        .from(chapters)
        .where(and(eq(chapters.novelId, novel.id), eq(chapters.number, input.number)))
        .limit(1);
      if (!chapter || (chapter.status !== "published" && !isOwner))
        throw new TRPCError({ code: "NOT_FOUND", message: "Bab tidak ditemukan" });
      // view counter (once per request, cheap)
      await db
        .update(novels)
        .set({ viewCount: sql`${novels.viewCount} + 1` })
        .where(eq(novels.id, novel.id));
      const neighbors = await db
        .select({ number: chapters.number, title: chapters.title })
        .from(chapters)
        .where(
          isOwner
            ? eq(chapters.novelId, novel.id)
            : and(eq(chapters.novelId, novel.id), eq(chapters.status, "published"))
        )
        .orderBy(asc(chapters.number));
      const idx = neighbors.findIndex((n) => n.number === input.number);
      // persist reading progress for logged-in users
      if (ctx.user) {
        await db
          .insert(readingProgress)
          .values({
            userId: ctx.user.id,
            novelId: novel.id,
            chapterId: chapter.id,
            chapterNumber: chapter.number,
          })
          .onDuplicateKeyUpdate({
            set: { chapterId: chapter.id, chapterNumber: chapter.number, updatedAt: new Date() },
          });
      }
      return {
        novel: {
          id: novel.id,
          title: novel.title,
          slug: novel.slug,
          authorId: novel.authorId,
        },
        chapter,
        prev: idx > 0 ? neighbors[idx - 1] : null,
        next: idx >= 0 && idx < neighbors.length - 1 ? neighbors[idx + 1] : null,
        totalChapters: neighbors.length,
        isOwner,
      };
    }),

  create: authedQuery
    .input(
      z.object({
        novelId: z.number().int(),
        title: z.string().trim().min(1).max(200),
        content: z.string().trim().min(10),
        status: z.enum(["draft", "published"]).default("published"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [novel] = await db.select().from(novels).where(eq(novels.id, input.novelId)).limit(1);
      if (!novel || novel.authorId !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN", message: "Bukan novel milikmu" });
      const last = await db
        .select({ number: chapters.number })
        .from(chapters)
        .where(eq(chapters.novelId, input.novelId))
        .orderBy(sql`${chapters.number} DESC`)
        .limit(1);
      const number = (last[0]?.number ?? 0) + 1;
      const [{ id }] = await db
        .insert(chapters)
        .values({
          novelId: input.novelId,
          number,
          title: input.title,
          content: input.content,
          wordCount: countWords(input.content),
          status: input.status,
        })
        .$returningId();
      await refreshNovelStats(input.novelId);
      await db.update(novels).set({ updatedAt: new Date() }).where(eq(novels.id, input.novelId));
      return { id, number };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number().int(),
        title: z.string().trim().min(1).max(200).optional(),
        content: z.string().trim().min(10).optional(),
        status: z.enum(["draft", "published"]).optional(),
        number: z.number().int().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [chapter] = await db.select().from(chapters).where(eq(chapters.id, input.id)).limit(1);
      if (!chapter) throw new TRPCError({ code: "NOT_FOUND" });
      const [novel] = await db.select().from(novels).where(eq(novels.id, chapter.novelId)).limit(1);
      if (!novel || novel.authorId !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN", message: "Bukan novel milikmu" });
      const patch: Partial<typeof chapters.$inferInsert> = {};
      if (input.title !== undefined) patch.title = input.title;
      if (input.status !== undefined) patch.status = input.status;
      if (input.number !== undefined) patch.number = input.number;
      if (input.content !== undefined) {
        patch.content = input.content;
        patch.wordCount = countWords(input.content);
      }
      await db.update(chapters).set(patch).where(eq(chapters.id, input.id));
      await refreshNovelStats(chapter.novelId);
      return { ok: true };
    }),

  remove: authedQuery
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [chapter] = await db.select().from(chapters).where(eq(chapters.id, input.id)).limit(1);
      if (!chapter) throw new TRPCError({ code: "NOT_FOUND" });
      const [novel] = await db.select().from(novels).where(eq(novels.id, chapter.novelId)).limit(1);
      if (!novel || novel.authorId !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN", message: "Bukan novel milikmu" });
      const { comments, readingProgress } = await import("../db/schema");
      await db.delete(comments).where(eq(comments.chapterId, input.id));
      await db.delete(readingProgress).where(eq(readingProgress.chapterId, input.id));
      await db.delete(chapters).where(eq(chapters.id, input.id));
      await refreshNovelStats(chapter.novelId);
      return { ok: true };
    }),

  /** Get a chapter for editing (owner only) */
  forEdit: authedQuery
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const [chapter] = await db.select().from(chapters).where(eq(chapters.id, input.id)).limit(1);
      if (!chapter) throw new TRPCError({ code: "NOT_FOUND" });
      const [novel] = await db.select().from(novels).where(eq(novels.id, chapter.novelId)).limit(1);
      if (!novel || novel.authorId !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN", message: "Bukan novel milikmu" });
      return { chapter, novel: { id: novel.id, title: novel.title, slug: novel.slug } };
    }),
});
