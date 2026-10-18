import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql, count } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  comments,
  ratings,
  novels,
  users,
  libraryItems,
  readingProgress,
  follows,
  chapters,
} from "../db/schema";

export const socialRouter = createRouter({
  // ---------- Comments ----------
  comments: publicQuery
    .input(
      z.object({
        novelId: z.number().int(),
        chapterId: z.number().int().optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conds = [eq(comments.novelId, input.novelId)];
      if (input.chapterId) conds.push(eq(comments.chapterId, input.chapterId));
      else conds.push(sql`${comments.chapterId} IS NULL`);
      const rows = await db
        .select({
          id: comments.id,
          content: comments.content,
          createdAt: comments.createdAt,
          parentId: comments.parentId,
          userId: users.id,
          userName: users.name,
          userAvatar: users.avatar,
          userPenName: users.penName,
        })
        .from(comments)
        .innerJoin(users, eq(users.id, comments.userId))
        .where(and(...conds))
        .orderBy(desc(comments.createdAt))
        .limit(input.pageSize)
        .offset((input.page - 1) * input.pageSize);
      const [{ total }] = await db
        .select({ total: count() })
        .from(comments)
        .where(and(...conds));
      return { items: rows, total };
    }),

  addComment: authedQuery
    .input(
      z.object({
        novelId: z.number().int(),
        chapterId: z.number().int().optional(),
        parentId: z.number().int().optional(),
        content: z.string().trim().min(1).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [{ id }] = await db
        .insert(comments)
        .values({
          userId: ctx.user.id,
          novelId: input.novelId,
          chapterId: input.chapterId ?? null,
          parentId: input.parentId ?? null,
          content: input.content,
        })
        .$returningId();
      return { id };
    }),

  deleteComment: authedQuery
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [c] = await db.select().from(comments).where(eq(comments.id, input.id)).limit(1);
      if (!c) throw new TRPCError({ code: "NOT_FOUND" });
      const isCommenter = c.userId === ctx.user.id;
      const [novel] = await db.select().from(novels).where(eq(novels.id, c.novelId)).limit(1);
      const isNovelOwner = novel?.authorId === ctx.user.id;
      if (!isCommenter && !isNovelOwner && ctx.user.role !== "admin")
        throw new TRPCError({ code: "FORBIDDEN" });
      await db.delete(comments).where(eq(comments.id, input.id));
      return { ok: true };
    }),

  // ---------- Ratings ----------
  rate: authedQuery
    .input(
      z.object({
        novelId: z.number().int(),
        score: z.number().int().min(1).max(5),
        review: z.string().trim().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [novel] = await db.select().from(novels).where(eq(novels.id, input.novelId)).limit(1);
      if (!novel) throw new TRPCError({ code: "NOT_FOUND" });
      if (novel.authorId === ctx.user.id)
        throw new TRPCError({ code: "BAD_REQUEST", message: "Tidak bisa menilai karya sendiri" });
      await db
        .insert(ratings)
        .values({
          userId: ctx.user.id,
          novelId: input.novelId,
          score: input.score,
          review: input.review ?? null,
        })
        .onDuplicateKeyUpdate({
          set: { score: input.score, review: input.review ?? null, updatedAt: new Date() },
        });
      const agg = await db
        .select({ avg: sql<number>`AVG(${ratings.score})`, n: count() })
        .from(ratings)
        .where(eq(ratings.novelId, input.novelId));
      await db
        .update(novels)
        .set({
          ratingAvg: Math.round((agg[0]?.avg ?? 0) * 100) / 100,
          ratingCount: agg[0]?.n ?? 0,
        })
        .where(eq(novels.id, input.novelId));
      return { ok: true };
    }),

  reviews: publicQuery
    .input(z.object({ novelId: z.number().int(), page: z.number().int().min(1).default(1) }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select({
          id: ratings.id,
          score: ratings.score,
          review: ratings.review,
          createdAt: ratings.createdAt,
          userId: users.id,
          userName: users.name,
          userPenName: users.penName,
          userAvatar: users.avatar,
        })
        .from(ratings)
        .innerJoin(users, eq(users.id, ratings.userId))
        .where(and(eq(ratings.novelId, input.novelId), sql`${ratings.review} IS NOT NULL`))
        .orderBy(desc(ratings.createdAt))
        .limit(10)
        .offset((input.page - 1) * 10);
      return rows;
    }),

  // ---------- Library ----------
  toggleLibrary: authedQuery
    .input(z.object({ novelId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [existing] = await db
        .select()
        .from(libraryItems)
        .where(and(eq(libraryItems.userId, ctx.user.id), eq(libraryItems.novelId, input.novelId)))
        .limit(1);
      if (existing) {
        await db.delete(libraryItems).where(eq(libraryItems.id, existing.id));
        await db
          .update(novels)
          .set({ bookmarkCount: sql`GREATEST(${novels.bookmarkCount} - 1, 0)` })
          .where(eq(novels.id, input.novelId));
        return { inLibrary: false };
      }
      await db.insert(libraryItems).values({ userId: ctx.user.id, novelId: input.novelId });
      await db
        .update(novels)
        .set({ bookmarkCount: sql`${novels.bookmarkCount} + 1` })
        .where(eq(novels.id, input.novelId));
      return { inLibrary: true };
    }),

  myLibrary: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select({
        id: novels.id,
        title: novels.title,
        slug: novels.slug,
        coverKey: novels.coverKey,
        coverStyle: novels.coverStyle,
        status: novels.status,
        ratingAvg: novels.ratingAvg,
        chapterCount: novels.chapterCount,
        authorName: users.name,
        authorPenName: users.penName,
        addedAt: libraryItems.createdAt,
        progressChapter: readingProgress.chapterNumber,
      })
      .from(libraryItems)
      .innerJoin(novels, eq(novels.id, libraryItems.novelId))
      .innerJoin(users, eq(users.id, novels.authorId))
      .leftJoin(
        readingProgress,
        and(
          eq(readingProgress.novelId, novels.id),
          eq(readingProgress.userId, ctx.user.id)
        )
      )
      .where(eq(libraryItems.userId, ctx.user.id))
      .orderBy(desc(libraryItems.createdAt));
    return rows;
  }),

  /** Continue-reading shelf: recent reading progress with novel info */
  continueReading: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select({
        novelId: novels.id,
        title: novels.title,
        slug: novels.slug,
        coverStyle: novels.coverStyle,
        coverKey: novels.coverKey,
        chapterCount: novels.chapterCount,
        chapterNumber: readingProgress.chapterNumber,
        chapterTitle: chapters.title,
        updatedAt: readingProgress.updatedAt,
      })
      .from(readingProgress)
      .innerJoin(novels, eq(novels.id, readingProgress.novelId))
      .innerJoin(chapters, eq(chapters.id, readingProgress.chapterId))
      .where(eq(readingProgress.userId, ctx.user.id))
      .orderBy(desc(readingProgress.updatedAt))
      .limit(10);
  }),

  // ---------- Follows ----------
  toggleFollow: authedQuery
    .input(z.object({ authorId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      if (input.authorId === ctx.user.id)
        throw new TRPCError({ code: "BAD_REQUEST", message: "Tidak bisa mengikuti diri sendiri" });
      const db = getDb();
      const [existing] = await db
        .select()
        .from(follows)
        .where(and(eq(follows.followerId, ctx.user.id), eq(follows.authorId, input.authorId)))
        .limit(1);
      if (existing) {
        await db.delete(follows).where(eq(follows.id, existing.id));
        return { following: false };
      }
      await db.insert(follows).values({ followerId: ctx.user.id, authorId: input.authorId });
      return { following: true };
    }),
});
