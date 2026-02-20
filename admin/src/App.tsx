import { Routes, Route } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import Dashboard from './pages/Dashboard'
import Watches from './pages/Watches'
import Fishtank from './pages/Fishtank'
import Albums from './pages/Albums'

function App() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="watches" element={<Watches />} />
        <Route path="fishtank" element={<Fishtank />} />
        <Route path="albums" element={<Albums />} />
      </Route>
    </Routes>
  )
}

export default App
