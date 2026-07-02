import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { queryClient } from './services/queryClient'
import { Admin } from './pages/Admin'
import { FarmDetails } from './pages/FarmDetails'
import { Login } from './pages/Login'
import { NotFound } from './pages/NotFound'
import { SeasonCalendar } from './pages/SeasonCalendar'
import { WeekendPicks } from './pages/WeekendPicks'
import { HarvestRadarPage } from './components/HarvestRadarPage'
import { MapPage } from './components/MapPage'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HarvestRadarPage />} />
            <Route path="farms" element={<MapPage />} />
            <Route path="farms/:farmId" element={<FarmDetails />} />
            <Route path="season-calendar" element={<SeasonCalendar />} />
            <Route path="weekend-picks" element={<WeekendPicks />} />
            <Route path="admin" element={<Admin />} />
            <Route path="login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
