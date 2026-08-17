import { Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { ListPage } from './routes/ListPage'
import { BoardPage } from './routes/BoardPage'
import { StatsPage } from './routes/StatsPage'
import { NotFoundPage } from './routes/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<ListPage />} />
        <Route path="board" element={<BoardPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
