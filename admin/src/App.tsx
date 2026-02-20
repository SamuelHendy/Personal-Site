import { Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AdminLayout from './layouts/AdminLayout'
import Dashboard from './pages/Dashboard'
import Watches from './pages/Watches'
import Fishtank from './pages/Fishtank'
import Albums from './pages/Albums'
import Login from './pages/Login'
import { Loader2 } from 'lucide-react'

function AuthenticatedApp() {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (status !== 'authenticated') {
    return <Login />
  }

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

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  )
}

export default App
