import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './pages/Home'
import Albums from './pages/Albums'
import AlbumDetail from './pages/AlbumDetail'
import Watches from './pages/Watches'
import FishTank from './pages/FishTank'
import NotFound from './pages/NotFound'
import ScrollToTop from './components/ScrollToTop'
import { PageEnabledProvider } from './contexts/PageEnabledContext'
import { DataProvider } from './contexts/DataContext'

function App() {
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }
    
    setVH()
    window.addEventListener('resize', setVH)
    window.addEventListener('orientationchange', setVH)
    
    return () => {
      window.removeEventListener('resize', setVH)
      window.removeEventListener('orientationchange', setVH)
    }
  }, [])

  return (
    <PageEnabledProvider>
      <DataProvider>
        <Router>
          <ScrollToTop />
          <div className="min-h-screen bg-black">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/albums" element={<Albums />} />
              <Route path="/albums/:albumName" element={<AlbumDetail />} />
              <Route path="/watches" element={<Watches />} />
              <Route path="/fishtank" element={<FishTank />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Router>
      </DataProvider>
    </PageEnabledProvider>
  )
}

export default App
