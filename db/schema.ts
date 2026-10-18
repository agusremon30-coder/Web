import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  float,
  boolean,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  penName: varchar("penName", { length: 100 }),
  bio: text("bio"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ---------- Genres ----------
export const genres = mysqlTable("genres", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 60 }).notNull().unique(),
  slug: varchar("slug", { length: 60 }).notNull().unique(),
  description: varchar("description", { length: 255 }),
});

export type Genre = typeof genres.$inferSelect;

// ---------- Novels ----------
export const novels = mysqlTable(
  "novels",
  {
    id: serial("id").primaryKey(),
    authorId: bigint("authorId", { mode: "number", unsigned: true }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull().unique(),
    synopsis: text("synopsis"),
    coverKey: varchar("coverKey", { length: 255 }),
    // Generated typographic cover styling (fallback / seed covers)
    coverStyle: varchar("coverStyle", { length: 40 }).notNull().default("ember"),
    status: mysqlEnum("status", ["ongoing", "completed", "hiatus"])
      .default("ongoing")
      .notNull(),
    isPublished: boolean("isPublished").default(true).notNull(),
    isFeatured: boolean("isFeatured").default(false).notNull(),
    ratingAvg: float("ratingAvg").default(0).notNull(),
    ratingCount: int("ratingCount").default(0).notNull(),
    viewCount: int("viewCount").default(0).notNull(),
    bookmarkCount: int("bookmarkCount").default(0).notNull(),
    chapterCount: int("chapterCount").default(0).notNull(),
    wordCount: int("wordCount").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  },
  (t) => ({
    authorIdx: index("novel_author_idx").on(t.authorId),
    publishedIdx: index("novel_published_idx").on(t.isPublished, t.publishedAt),
    viewIdx: index("novel_view_idx").on(t.viewCount),
  })
);

export type Novel = typeof novels.$inferSelect;
export type InsertNovel = typeof novels.$inferInsert;

// ---------- Novel <-> Genre ----------
export const novelGenres = mysqlTable(
  "novel_genres",
  {
    novelId: bigint("novelId", { mode: "number", unsigned: true }).notNull(),
    genreId: bigint("genreId", { mode: "number", unsigned: true }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.novelId, t.genreId] }),
    genreIdx: index("ng_genre_idx").on(t.genreId),
  })
);

// ---------- Chapters ----------
export const chapters = mysqlTable(
  "chapters",
  {
    id: serial("id").primaryKey(),
    novelId: bigint("novelId", { mode: "number", unsigned: true }).notNull(),
    number: int("number").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    content: text("content"),
    wordCount: int("wordCount").default(0).notNull(),
    status: mysqlEnum("status", ["draft", "published"])
      .default("published")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  },
  (t) => ({
    novelNumberUnique: uniqueIndex("chapter_novel_number_unique").on(
      t.novelId,
      t.number
    ),
    novelIdx: index("chapter_novel_idx").on(t.novelId),
  })
);

export type Chapter = typeof chapters.$inferSelect;
export type InsertChapter = typeof chapters.$inferInsert;

// ---------- Ratings / Reviews ----------
export const ratings = mysqlTable(
  "ratings",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    novelId: bigint("novelId", { mode: "number", unsigned: true }).notNull(),
    score: int("score").notNull(), // 1..5
    review: text("review"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    userNovelUnique: uniqueIndex("rating_user_novel_unique").on(
      t.userId,
      t.novelId
    ),
    novelIdx: index("rating_novel_idx").on(t.novelId),
  })
);

export type Rating = typeof ratings.$inferSelect;

// ---------- Comments ----------
export const comments = mysqlTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    novelId: bigint("novelId", { mode: "number", unsigned: true }).notNull(),
    chapterId: bigint("chapterId", { mode: "number", unsigned: true }),
    parentId: bigint("parentId", { mode: "number", unsigned: true }),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({
    novelIdx: index("comment_novel_idx").on(t.novelId),
    chapterIdx: index("comment_chapter_idx").on(t.chapterId),
  })
);

export type Comment = typeof comments.$inferSelect;

// ---------- Library / Bookmarks ----------
export const libraryItems = mysqlTable(
  "library_items",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    novelId: bigint("novelId", { mode: "number", unsigned: true }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({
    userNovelUnique: uniqueIndex("library_user_novel_unique").on(
      t.userId,
      t.novelId
    ),
    userIdx: index("library_user_idx").on(t.userId),
  })
);

export type LibraryItem = typeof libraryItems.$inferSelect;

// ---------- Reading progress ----------
export const readingProgress = mysqlTable(
  "reading_progress",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    novelId: bigint("novelId", { mode: "number", unsigned: true }).notNull(),
    chapterId: bigint("chapterId", { mode: "number", unsigned: true }).notNull(),
    chapterNumber: int("chapterNumber").notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    userNovelUnique: uniqueIndex("progress_user_novel_unique").on(
      t.userId,
      t.novelId
    ),
    userIdx: index("progress_user_idx").on(t.userId),
  })
);

export type ReadingProgress = typeof readingProgress.$inferSelect;

// ---------- Follows (reader -> author) ----------
export const follows = mysqlTable(
  "follows",
  {
    id: serial("id").primaryKey(),
    followerId: bigint("followerId", { mode: "number", unsigned: true }).notNull(),
    authorId: bigint("authorId", { mode: "number", unsigned: true }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({
    unique: uniqueIndex("follow_unique").on(t.followerId, t.authorId),
    authorIdx: index("follow_author_idx").on(t.authorId),
  })
);

export type Follow = typeof follows.$inferSelect;
