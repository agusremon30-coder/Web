import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { desc, eq, sql, count } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, novels, novelGenres, genres, follows } from "../db/schema";
import { storage } from "./lib/storage";

export const profileRouter = createRouter({
  /** Public author/user profile */
  byId: publicQuery
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const [u] = await db
        .select({
          id: users.id,
          name: users.name,
          penName: users.penName,
          bio: users.bio,
          avatar: users.avatar,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, input.id))
        .limit(1);
      if (!u) throw new TRPCError({ code: "NOT_FOUND", message: "Pengguna tidak ditemukan" });
      const works = await db
        .select({
          id: novels.id,
          title: novels.title,
          slug: novels.slug,
          synopsis: novels.synopsis,
          coverStyle: novels.coverStyle,
          coverKey: novels.coverKey,
          status: novels.status,
          ratingAvg: novels.ratingAvg,
          ratingCount: novels.ratingCount,
          viewCount: novels.viewCount,
          chapterCount: novels.chapterCount,
          publishedAt: novels.publishedAt,
        })
        .from(novels)
        .where(eq(novels.authorId, input.id))
        .orderBy(desc(novels.publishedAt));
      const gmap = new Map<number, { id: number; name: string; slug: string }[]>();
      if (works.length > 0) {
        const rows = await db
          .select({ novelId: novelGenres.novelId, id: genres.id, name: genres.name, slug: genres.slug })
          .from(novelGenres)
          .innerJoin(genres, eq(genres.id, novelGenres.genreId));
        for (const r of rows) {
          const list = gmap.get(r.novelId) ?? [];
          list.push({ id: r.id, name: r.name, slug: r.slug });
          gmap.set(r.novelId, list);
        }
      }
      const [{ followerCount }] = await db
        .select({ followerCount: count() })
        .from(follows)
        .where(eq(follows.authorId, input.id));
      let isFollowing = false;
      if (ctx.user) {
        const [f2] = await db
          .select({ id: follows.id })
          .from(follows)
          .where(sql`${follows.followerId} = ${ctx.user.id} AND ${follows.authorId} = ${input.id}`)
          .limit(1);
        isFollowing = !!f2;
      }
      return {
        user: u,
        works: works.map((w) => ({ ...w, genres: gmap.get(w.id) ?? [] })),
        followerCount,
        isFollowing,
        isMe: ctx.user?.id === input.id,
      };
    }),

  updateMe: authedQuery
    .input(
      z.object({
        penName: z.string().trim().min(2).max(100).optional(),
        bio: z.string().trim().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.update(users).set(input).where(eq(users.id, ctx.user.id));
      return { ok: true };
    }),

  /** Stats for the writer dashboard */
  myStats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const myNovels = await db
      .select({
        viewCount: novels.viewCount,
        bookmarkCount: novels.bookmarkCount,
        ratingCount: novels.ratingCount,
        wordCount: novels.wordCount,
        chapterCount: novels.chapterCount,
      })
      .from(novels)
      .where(eq(novels.authorId, ctx.user.id));
    const [{ followerCount }] = await db
      .select({ followerCount: count() })
      .from(follows)
      .where(eq(follows.authorId, ctx.user.id));
    return {
      novelCount: myNovels.length,
      totalViews: myNovels.reduce((s, n) => s + n.viewCount, 0),
      totalBookmarks: myNovels.reduce((s, n) => s + n.bookmarkCount, 0),
      totalWords: myNovels.reduce((s, n) => s + n.wordCount, 0),
      totalChapters: myNovels.reduce((s, n) => s + n.chapterCount, 0),
      followerCount,
    };
  }),
});

export const storageRouter = createRouter({
  uploadCover: authedQuery
    .input(
      z.object({
        novelId: z.number().int(),
        name: z.string().max(200),
        contentBase64: z.string().max(14_000_000), // ~10MB base64
        contentType: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [novel] = await db.select().from(novels).where(eq(novels.id, input.novelId)).limit(1);
      if (!novel || novel.authorId !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN", message: "Bukan novel milikmu" });
      const bytes = Uint8Array.from(Buffer.from(input.contentBase64, "base64"));
      const safeName = `covers/${ctx.user.id}/${input.name.replace(/[^\w.\-]+/g, "_")}`;
      const saved = await storage.uploadFile({
        fileContent: bytes,
        fileName: safeName,
        contentType: input.contentType,
      });
      await db.update(novels).set({ coverKey: saved.key }).where(eq(novels.id, input.novelId));
      return { key: saved.key, size: saved.size };
    }),
});
