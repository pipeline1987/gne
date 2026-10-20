import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { About } from './pages/About'
import { Archive } from './pages/Archive'
import { ArticlePage } from './pages/Article'
import { AuthorPage } from './pages/Author'
import { Home } from './pages/Home'
import { NotFound } from './pages/NotFound'
import { TopicPage } from './pages/Topic'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="archive" element={<Archive />} />
          <Route path="article/:slug" element={<ArticlePage />} />
          <Route path="author/:slug" element={<AuthorPage />} />
          <Route path="topic/:slug" element={<TopicPage />} />
          <Route path="about" element={<About />} />
          <Route path="newsroom" element={<Navigate to="/about" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
