import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql, like, inArray, or, count } from "drizzle-orm";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  novels,
  novelGenres,
  genres,
  chapters,
  users,
  ratings,
  libraryItems,
  comments,
  readingProgress,
} from "../db/schema";
import { storage } from "./lib/storage";

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 180);
}

export function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Attach short-lived cover URLs for a list of novels (coverKey -> coverUrl). */
async function attachCoverUrls<T extends { coverKey: string | null }>(rows: T[]) {
  const keys = [...new Set(rows.map((r) => r.coverKey).filter(Boolean))] as string[];
  if (keys.length === 0) return rows.map((r) => ({ ...r, coverUrl: null as string | null }));
  try {
    const { urls } = await storage.getPresignedUrls({ keys });
    const map = new Map(urls.map((u) => [u.key, u.url]));
    return rows.map((r) => ({
      ...r,
      coverUrl: r.coverKey ? (map.get(r.coverKey) ?? null) : null,
    }));
  } catch {
    return rows.map((r) => ({ ...r, coverUrl: null as string | null }));
  }
}

const novelCardSelect = {
  id: novels.id,
  title: novels.title,
  slug: novels.slug,
  synopsis: novels.synopsis,
  coverKey: novels.coverKey,
  coverStyle: novels.coverStyle,
  status: novels.status,
  isPublished: novels.isPublished,
  isFeatured: novels.isFeatured,
  ratingAvg: novels.ratingAvg,
  ratingCount: novels.ratingCount,
  viewCount: novels.viewCount,
  bookmarkCount: novels.bookmarkCount,
  chapterCount: novels.chapterCount,
  wordCount: novels.wordCount,
  publishedAt: novels.publishedAt,
  updatedAt: novels.updatedAt,
  authorId: novels.authorId,
  authorName: users.name,
  authorPenName: users.penName,
};

async function genresOf(novelIds: number[]) {
  if (novelIds.length === 0) return new Map<number, { id: number; name: string; slug: string }[]>();
  const rows = await getDb()
    .select({ novelId: novelGenres.novelId, id: genres.id, name: genres.name, slug: genres.slug })
    .from(novelGenres)
    .innerJoin(genres, eq(genres.id, novelGenres.genreId))
    .where(inArray(novelGenres.novelId, novelIds));
  const map = new Map<number, { id: number; name: string; slug: string }[]>();
  for (const r of rows) {
    const list = map.get(r.novelId) ?? [];
    list.push({ id: r.id, name: r.name, slug: r.slug });
    map.set(r.novelId, list);
  }
  return map;
}

export const novelRouter = createRouter({
  genres: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .select({ id: genres.id, name: genres.name, slug: genres.slug, count: count(novelGenres.novelId) })
      .from(genres)
      .leftJoin(novelGenres, eq(novelGenres.genreId, genres.id))
      .groupBy(genres.id)
      .orderBy(genres.name);
    return rows;
  }),

  browse: publicQuery
    .input(
      z.object({
        q: z.string().trim().max(120).optional(),
        genre: z.string().optional(),
        status: z.enum(["ongoing", "completed", "hiatus"]).optional(),
        sort: z.enum(["latest", "popular", "topRated", "bookmarked"]).default("latest"),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(24).default(12),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conds = [eq(novels.isPublished, true)];
      if (input.q) {
        conds.push(
          or(like(novels.title, `%${input.q}%`), like(novels.synopsis, `%${input.q}%`))!
        );
      }
      if (input.status) conds.push(eq(novels.status, input.status));
      if (input.genre) {
        const [g] = await db.select().from(genres).where(eq(genres.slug, input.genre)).limit(1);
        if (!g) return { items: [], total: 0, page: input.page, pageSize: input.pageSize };
        const ids = await db
          .select({ novelId: novelGenres.novelId })
          .from(novelGenres)
          .where(eq(novelGenres.genreId, g.id));
        const idList = ids.map((r) => r.novelId);
        if (idList.length === 0) return { items: [], total: 0, page: input.page, pageSize: input.pageSize };
        conds.push(inArray(novels.id, idList));
      }
      const where = and(...conds);
      const [{ total }] = await db.select({ total: count() }).from(novels).where(where);
      const orderBy =
        input.sort === "popular"
          ? desc(novels.viewCount)
          : input.sort === "topRated"
            ? desc(novels.ratingAvg)
            : input.sort === "bookmarked"
              ? desc(novels.bookmarkCount)
              : desc(novels.publishedAt);
      const rows = await db
        .select(novelCardSelect)
        .from(novels)
        .innerJoin(users, eq(users.id, novels.authorId))
        .where(where)
        .orderBy(orderBy)
        .limit(input.pageSize)
        .offset((input.page - 1) * input.pageSize);
      const withCovers = await attachCoverUrls(rows);
      const gmap = await genresOf(rows.map((r) => r.id));
      return {
        items: withCovers.map((r) => ({ ...r, genres: gmap.get(r.id) ?? [] })),
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  home: publicQuery.query(async () => {
    const db = getDb();
    const base = () =>
      db.select(novelCardSelect).from(novels).innerJoin(users, eq(users.id, novels.authorId));
    const featured = await base()
      .where(and(eq(novels.isPublished, true), eq(novels.isFeatured, true)))
      .orderBy(desc(novels.viewCount))
      .limit(5);
    const trending = await base()
      .where(eq(novels.isPublished, true))
      .orderBy(desc(novels.viewCount))
      .limit(10);
    const latest = await base()
      .where(eq(novels.isPublished, true))
      .orderBy(desc(novels.publishedAt))
      .limit(10);
    const topRated = await base()
      .where(and(eq(novels.isPublished, true), sql`${novels.ratingCount} >= 2`))
      .orderBy(desc(novels.ratingAvg))
      .limit(10);
    const all = [...featured, ...trending, ...latest, ...topRated];
    const gmap = await genresOf([...new Set(all.map((r) => r.id))]);
    const pack = async (rows: typeof featured) =>
      (await attachCoverUrls(rows)).map((r) => ({ ...r, genres: gmap.get(r.id) ?? [] }));
    return {
      featured: await pack(featured),
      trending: await pack(trending),
      latest: await pack(latest),
      topRated: await pack(topRated),
    };
  }),

  bySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const [row] = await db
        .select({ novel: novels, authorName: users.name, authorPenName: users.penName, authorAvatar: users.avatar })
        .from(novels)
        .innerJoin(users, eq(users.id, novels.authorId))
        .where(eq(novels.slug, input.slug))
        .limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Novel tidak ditemukan" });
      if (!row.novel.isPublished && row.novel.authorId !== ctx.user?.id)
        throw new TRPCError({ code: "NOT_FOUND", message: "Novel tidak ditemukan" });
      const glist = await db
        .select({ id: genres.id, name: genres.name, slug: genres.slug })
        .from(novelGenres)
        .innerJoin(genres, eq(genres.id, novelGenres.genreId))
        .where(eq(novelGenres.novelId, row.novel.id));
      const chapterRows = await db
        .select({
          id: chapters.id,
          number: chapters.number,
          title: chapters.title,
          wordCount: chapters.wordCount,
          status: chapters.status,
          publishedAt: chapters.publishedAt,
        })
        .from(chapters)
        .where(
          row.novel.authorId === ctx.user?.id
            ? eq(chapters.novelId, row.novel.id)
            : and(eq(chapters.novelId, row.novel.id), eq(chapters.status, "published"))
        )
        .orderBy(chapters.number);
      let myRating: number | null = null;
      let inLibrary = false;
      let myProgress: { chapterNumber: number } | null = null;
      if (ctx.user) {
        const [r] = await db
          .select({ score: ratings.score })
          .from(ratings)
          .where(and(eq(ratings.userId, ctx.user.id), eq(ratings.novelId, row.novel.id)))
          .limit(1);
        myRating = r?.score ?? null;
        const [lib] = await db
          .select({ id: libraryItems.id })
          .from(libraryItems)
          .where(and(eq(libraryItems.userId, ctx.user.id), eq(libraryItems.novelId, row.novel.id)))
          .limit(1);
        inLibrary = !!lib;
        const prog = await db.query.readingProgress.findFirst({
          where: (p, { and: a, eq: e }) =>
            a(e(p.userId, ctx.user!.id), e(p.novelId, row.novel.id)),
        });
        myProgress = prog ? { chapterNumber: prog.chapterNumber } : null;
      }
      const [cover] = await attachCoverUrls([row.novel]);
      return {
        ...cover,
        authorName: row.authorName,
        authorPenName: row.authorPenName,
        authorAvatar: row.authorAvatar,
        genres: glist,
        chapters: chapterRows,
        myRating,
        inLibrary,
        myProgress,
        isOwner: ctx.user?.id === row.novel.authorId,
      };
    }),

  create: authedQuery
    .input(
      z.object({
        title: z.string().trim().min(3).max(200),
        synopsis: z.string().trim().min(20).max(5000),
        genreIds: z.array(z.number().int()).min(1).max(3),
        status: z.enum(["ongoing", "completed", "hiatus"]).default("ongoing"),
        coverStyle: z.string().max(40).default("ember"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      let slug = slugify(input.title);
      if (!slug) slug = `novel-${Date.now()}`;
      // ensure unique slug
      const existing = await db
        .select({ slug: novels.slug })
        .from(novels)
        .where(like(novels.slug, `${slug}%`));
      if (existing.some((e) => e.slug === slug)) slug = `${slug}-${Date.now().toString(36)}`;
      const [{ id }] = await db
        .insert(novels)
        .values({
          authorId: ctx.user.id,
          title: input.title,
          slug,
          synopsis: input.synopsis,
          status: input.status,
          coverStyle: input.coverStyle,
        })
        .$returningId();
      await db.insert(novelGenres).values(input.genreIds.map((genreId) => ({ novelId: id, genreId })));
      return { id, slug };
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number().int(),
        title: z.string().trim().min(3).max(200).optional(),
        synopsis: z.string().trim().min(20).max(5000).optional(),
        genreIds: z.array(z.number().int()).min(1).max(3).optional(),
        status: z.enum(["ongoing", "completed", "hiatus"]).optional(),
        coverStyle: z.string().max(40).optional(),
        isPublished: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [novel] = await db.select().from(novels).where(eq(novels.id, input.id)).limit(1);
      if (!novel || novel.authorId !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN", message: "Bukan novel milikmu" });
      const { id, genreIds, ...patch } = input;
      if (Object.keys(patch).length > 0) await db.update(novels).set(patch).where(eq(novels.id, id));
      if (genreIds) {
        await db.delete(novelGenres).where(eq(novelGenres.novelId, id));
        await db.insert(novelGenres).values(genreIds.map((genreId) => ({ novelId: id, genreId })));
      }
      return { ok: true };
    }),

  remove: authedQuery
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [novel] = await db.select().from(novels).where(eq(novels.id, input.id)).limit(1);
      if (!novel || novel.authorId !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN", message: "Bukan novel milikmu" });
      const chRows = await db.select({ id: chapters.id }).from(chapters).where(eq(chapters.novelId, input.id));
      const chIds = chRows.map((c) => c.id);
      if (chIds.length > 0) {
        await db.delete(comments).where(inArray(comments.chapterId, chIds));
      }
      await db.delete(comments).where(eq(comments.novelId, input.id));
      await db.delete(ratings).where(eq(ratings.novelId, input.id));
      await db.delete(libraryItems).where(eq(libraryItems.novelId, input.id));
      await db.delete(readingProgress).where(eq(readingProgress.novelId, input.id));
      await db.delete(novelGenres).where(eq(novelGenres.novelId, input.id));
      await db.delete(chapters).where(eq(chapters.novelId, input.id));
      await db.delete(novels).where(eq(novels.id, input.id));
      return { ok: true };
    }),

  mine: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select(novelCardSelect)
      .from(novels)
      .innerJoin(users, eq(users.id, novels.authorId))
      .where(eq(novels.authorId, ctx.user.id))
      .orderBy(desc(novels.updatedAt));
    const gmap = await genresOf(rows.map((r) => r.id));
    return (await attachCoverUrls(rows)).map((r) => ({ ...r, genres: gmap.get(r.id) ?? [] }));
  }),
});
