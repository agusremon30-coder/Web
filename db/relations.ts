import { relations } from "drizzle-orm";
import {
  users,
  novels,
  chapters,
  genres,
  novelGenres,
  ratings,
  comments,
  libraryItems,
  readingProgress,
  follows,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  novels: many(novels),
  ratings: many(ratings),
  comments: many(comments),
  libraryItems: many(libraryItems),
  readingProgress: many(readingProgress),
  followers: many(follows, { relationName: "authorFollowers" }),
  following: many(follows, { relationName: "userFollowing" }),
}));

export const novelsRelations = relations(novels, ({ one, many }) => ({
  author: one(users, { fields: [novels.authorId], references: [users.id] }),
  chapters: many(chapters),
  novelGenres: many(novelGenres),
  ratings: many(ratings),
  comments: many(comments),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  novel: one(novels, { fields: [chapters.novelId], references: [novels.id] }),
  comments: many(comments),
}));

export const genresRelations = relations(genres, ({ many }) => ({
  novelGenres: many(novelGenres),
}));

export const novelGenresRelations = relations(novelGenres, ({ one }) => ({
  novel: one(novels, { fields: [novelGenres.novelId], references: [novels.id] }),
  genre: one(genres, { fields: [novelGenres.genreId], references: [genres.id] }),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  novel: one(novels, { fields: [ratings.novelId], references: [novels.id] }),
  user: one(users, { fields: [ratings.userId], references: [users.id] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  novel: one(novels, { fields: [comments.novelId], references: [novels.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  chapter: one(chapters, { fields: [comments.chapterId], references: [chapters.id] }),
}));

export const libraryItemsRelations = relations(libraryItems, ({ one }) => ({
  novel: one(novels, { fields: [libraryItems.novelId], references: [novels.id] }),
  user: one(users, { fields: [libraryItems.userId], references: [users.id] }),
}));

export const readingProgressRelations = relations(readingProgress, ({ one }) => ({
  novel: one(novels, { fields: [readingProgress.novelId], references: [novels.id] }),
  user: one(users, { fields: [readingProgress.userId], references: [users.id] }),
  chapter: one(chapters, { fields: [readingProgress.chapterId], references: [chapters.id] }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: "userFollowing",
  }),
  author: one(users, {
    fields: [follows.authorId],
    references: [users.id],
    relationName: "authorFollowers",
  }),
}));
