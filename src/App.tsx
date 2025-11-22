import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Albums from './pages/Albums'
import Watches from './pages/Watches'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/albums" element={<Albums />} />
          <Route path="/watches" element={<Watches />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
