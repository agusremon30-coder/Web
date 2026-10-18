import { authRouter } from "./auth-router";
import { createRouter, publicQuery } from "./middleware";
import { novelRouter } from "./novelRouter";
import { chapterRouter } from "./chapterRouter";
import { socialRouter } from "./socialRouter";
import { profileRouter, storageRouter } from "./profileRouter";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  novel: novelRouter,
  chapter: chapterRouter,
  social: socialRouter,
  profile: profileRouter,
  storage: storageRouter,
});

export type AppRouter = typeof appRouter;
