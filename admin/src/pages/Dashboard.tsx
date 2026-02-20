import { Link } from 'react-router-dom'
import { Clock, Fish, Image } from 'lucide-react'

export default function Dashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-base-content/60 mt-1">Manage your personal site content</p>
      </div>
      
      <div className="stats shadow w-full mb-8">
        <div className="stat">
          <div className="stat-figure text-primary">
            <Clock className="w-8 h-8" />
          </div>
          <div className="stat-title">Watches</div>
          <div className="stat-value text-primary">0</div>
          <div className="stat-desc">In collection</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-secondary">
            <Fish className="w-8 h-8" />
          </div>
          <div className="stat-title">Fishtank Residents</div>
          <div className="stat-value text-secondary">0</div>
          <div className="stat-desc">Active</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-accent">
            <Image className="w-8 h-8" />
          </div>
          <div className="stat-title">Albums</div>
          <div className="stat-value text-accent">0</div>
          <div className="stat-desc">Published</div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
          <div className="card-body">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h2 className="card-title">Watches</h2>
            </div>
            <p className="text-base-content/60">Add, edit, or remove watches from your collection</p>
            <div className="card-actions justify-end mt-4">
              <Link to="/watches" className="btn btn-primary btn-sm">Manage</Link>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
          <div className="card-body">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-secondary/10 p-3 rounded-lg">
                <Fish className="w-6 h-6 text-secondary" />
              </div>
              <h2 className="card-title">Fishtank</h2>
            </div>
            <p className="text-base-content/60">Manage residents and timeline events</p>
            <div className="card-actions justify-end mt-4">
              <Link to="/fishtank" className="btn btn-secondary btn-sm">Manage</Link>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
          <div className="card-body">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-accent/10 p-3 rounded-lg">
                <Image className="w-6 h-6 text-accent" />
              </div>
              <h2 className="card-title">Albums</h2>
            </div>
            <p className="text-base-content/60">Upload and organize photo albums</p>
            <div className="card-actions justify-end mt-4">
              <Link to="/albums" className="btn btn-accent btn-sm">Manage</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
