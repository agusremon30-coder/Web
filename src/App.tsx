import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"
import Browse from "./pages/Browse"
import Rankings from "./pages/Rankings"
import NovelDetail from "./pages/NovelDetail"
import Reader from "./pages/Reader"
import Studio from "./pages/Studio"
import NewNovel from "./pages/NewNovel"
import StudioNovel from "./pages/StudioNovel"
import ChapterEditor from "./pages/ChapterEditor"
import Library from "./pages/Library"
import Profile from "./pages/Profile"
import { Layout } from "./components/Layout"
import { Toaster } from "@/components/ui/sonner"

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/jelajah" element={<Browse />} />
          <Route path="/peringkat" element={<Rankings />} />
          <Route path="/novel/:slug" element={<NovelDetail />} />
          <Route path="/novel/:slug/bab/:number" element={<Reader />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/studio/baru" element={<NewNovel />} />
          <Route path="/studio/:id" element={<StudioNovel />} />
          <Route path="/studio/:id/bab/:chapterId" element={<ChapterEditor />} />
          <Route path="/pustaka" element={<Library />} />
          <Route path="/penulis/:id" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster richColors position="top-center" />
    </>
  )
}
