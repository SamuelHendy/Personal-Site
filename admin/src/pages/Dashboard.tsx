import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Fish, Image, TrendingUp, Users, Eye, AlertTriangle, Gauge, BarChart3, Check, X, Minus, Power } from 'lucide-react'
import { api, fetchWithAuth } from '../config/api'

type ContentStatus = 'active' | 'partial' | 'empty' | 'disabled'

interface ContentCardProps {
  title: string
  description: string
  icon: React.ReactNode
  iconBgClass: string
  pageEnabled: boolean
  status: ContentStatus
  itemCount: number
  itemLabel: string
  manageLink: string
  btnClass: string
  countClass: string
  onToggle: () => void
}

function ContentStatusBadge({ status }: { status: ContentStatus }) {
  switch (status) {
    case 'active':
      return (
        <div className="badge badge-success gap-1">
          <Check className="w-3 h-3" />
          Active
        </div>
      )
    case 'partial':
      return (
        <div className="badge badge-info gap-1">
          <Minus className="w-3 h-3" />
          Partial
        </div>
      )
    case 'empty':
      return (
        <div className="badge badge-warning gap-1">
          <Minus className="w-3 h-3" />
          Empty
        </div>
      )
    case 'disabled':
      return (
        <div className="badge badge-error gap-1">
          <X className="w-3 h-3" />
          Disabled
        </div>
      )
  }
}

function ContentCard({ title, description, icon, iconBgClass, pageEnabled, status, itemCount, itemLabel, manageLink, btnClass, countClass, onToggle }: ContentCardProps) {
  return (
    <div className={`card bg-base-100 shadow-xl ${!pageEnabled ? 'opacity-60' : ''}`}>
      <div className="card-body p-4">
        <div className="flex items-center gap-3">
          <div className={`${iconBgClass} p-2 rounded-lg`}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-xs text-base-content/60">{description}</p>
          </div>
          <ContentStatusBadge status={status} />
          <button 
            onClick={onToggle}
            className={`btn btn-sm btn-square btn-ghost ${pageEnabled ? 'text-success' : 'text-error'}`}
            title={pageEnabled ? 'Disable page' : 'Enable page'}
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
        <div className="divider my-2"></div>
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className={`font-medium ${countClass}`}>{itemCount}</span>
            <span className="text-base-content/60"> {itemLabel}</span>
          </div>
          <Link to={manageLink} className={`btn btn-sm ${btnClass}`}>Manage</Link>
        </div>
      </div>
    </div>
  )
}

interface PageEnabledConfig {
  watches?: boolean
  fishtank?: boolean
  albums?: boolean
}

interface MetricsSummary {
  pageViews: number
  uniqueVisitors: number
  errors24h: number
  avgResponseMs: number
}

export default function Dashboard() {
  const [watchCount, setWatchCount] = useState<number | null>(null)
  const [albumCount, setAlbumCount] = useState<number | null>(null)
  const [pageEnabled, setPageEnabled] = useState<PageEnabledConfig>({})
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(true)

  useEffect(() => {
    // Fetch watch count
    fetchWithAuth(api.admin.watches)
      .then(res => res.json())
      .then(data => setWatchCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setWatchCount(0))

    // Fetch album count
    fetchWithAuth(api.admin.albums)
      .then(res => res.json())
      .then(data => setAlbumCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setAlbumCount(0))

    // Fetch page enabled config (auto-create if empty)
    fetchWithAuth(api.admin.config('page_enabled', 'root'))
      .then(res => res.json())
      .then(data => {
        delete data.ConfigType
        delete data.ConfigKey
        // If empty, create default record with all pages disabled
        if (Object.keys(data).length === 0) {
          const defaults: PageEnabledConfig = { watches: false, fishtank: false, albums: false }
          fetchWithAuth(api.admin.config('page_enabled', 'root'), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(defaults),
          })
          setPageEnabled(defaults)
        } else {
          setPageEnabled(data)
        }
      })
      .catch(() => setPageEnabled({}))

    // Fetch analytics metrics
    fetchWithAuth(api.admin.metrics)
      .then(res => res.json())
      .then(data => {
        setMetrics(data)
        setMetricsLoading(false)
      })
      .catch(() => {
        setMetrics(null)
        setMetricsLoading(false)
      })
  }, [])

  const handleToggle = async (page: keyof PageEnabledConfig) => {
    const currentValue = pageEnabled[page] ?? false
    const newValue = !currentValue

    // Optimistic update
    setPageEnabled(prev => ({ ...prev, [page]: newValue }))

    try {
      const res = await fetchWithAuth(api.admin.config('page_enabled', 'root'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...pageEnabled, [page]: newValue }),
      })
      if (!res.ok) throw new Error('Failed to update')
    } catch {
      // Revert on error
      setPageEnabled(prev => ({ ...prev, [page]: currentValue }))
      alert('Failed to update page status')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-base-content/60 mt-1">Site analytics and content management</p>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left side - Analytics (2/3) */}
        <div className="lg:w-2/3 space-y-6">
          {/* Quick stats row */}
          <div className="stats shadow w-full">
            <div className="stat">
              <div className="stat-figure text-primary">
                <Eye className="w-6 h-6" />
              </div>
              <div className="stat-title">Page Views</div>
              <div className="stat-value text-primary text-2xl">
                {metricsLoading ? '...' : (metrics?.pageViews ?? '--')}
              </div>
              <div className="stat-desc">Today</div>
            </div>
            <div className="stat">
              <div className="stat-figure text-secondary">
                <Users className="w-6 h-6" />
              </div>
              <div className="stat-title">Unique Visitors</div>
              <div className="stat-value text-secondary text-2xl">
                {metricsLoading ? '...' : (metrics?.uniqueVisitors ?? '--')}
              </div>
              <div className="stat-desc">Today</div>
            </div>
            <div className="stat">
              <div className="stat-figure text-error">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="stat-title">Errors</div>
              <div className="stat-value text-error text-2xl">
                {metricsLoading ? '...' : (metrics?.errors24h ?? '--')}
              </div>
              <div className="stat-desc">Last 24h</div>
            </div>
            <div className="stat">
              <div className="stat-figure text-success">
                <Gauge className="w-6 h-6" />
              </div>
              <div className="stat-title">Avg Response</div>
              <div className="stat-value text-success text-2xl">
                {metricsLoading ? '...' : (metrics?.avgResponseMs ?? '--')}
              </div>
              <div className="stat-desc">ms</div>
            </div>
          </div>

          {/* Traffic over time chart placeholder */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h2 className="card-title text-lg">
                  <TrendingUp className="w-5 h-5" />
                  Traffic Over Time
                </h2>
                <select className="select select-bordered select-sm">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                </select>
              </div>
              <div className="h-48 bg-base-200 rounded-lg flex items-center justify-center">
                <div className="text-center text-base-content/40">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Analytics coming soon</p>
                  <p className="text-xs">CloudFront logs → Athena</p>
                </div>
              </div>
            </div>
          </div>

          {/* Two column charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Page popularity */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-lg">
                  <BarChart3 className="w-5 h-5" />
                  Popular Pages
                </h2>
                <div className="h-40 bg-base-200 rounded-lg flex items-center justify-center">
                  <div className="text-center text-base-content/40">
                    <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* API Performance */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-lg">
                  <Gauge className="w-5 h-5" />
                  API Performance
                </h2>
                <div className="h-40 bg-base-200 rounded-lg flex items-center justify-center">
                  <div className="text-center text-base-content/40">
                    <Gauge className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Content Management (1/3) */}
        <div className="lg:w-1/3 space-y-4">
          <h2 className="text-lg font-semibold">Content Management</h2>
          
          <ContentCard
            title="Albums"
            description="Photo gallery"
            icon={<Image className="w-5 h-5 text-accent" />}
            iconBgClass="bg-accent/10"
            pageEnabled={pageEnabled.albums ?? false}
            status={pageEnabled.albums ? (albumCount ? 'active' : 'empty') : 'disabled'}
            itemCount={albumCount ?? 0}
            itemLabel="albums"
            manageLink="/albums"
            btnClass="btn-accent"
            countClass="text-accent"
            onToggle={() => handleToggle('albums')}
          />

          <ContentCard
            title="Watches"
            description="Collection page"
            icon={<Clock className="w-5 h-5 text-primary" />}
            iconBgClass="bg-primary/10"
            pageEnabled={pageEnabled.watches ?? false}
            status={pageEnabled.watches ? (watchCount ? 'active' : 'empty') : 'disabled'}
            itemCount={watchCount ?? 0}
            itemLabel="watches"
            manageLink="/watches"
            btnClass="btn-primary"
            countClass="text-primary"
            onToggle={() => handleToggle('watches')}
          />

          <ContentCard
            title="Fishtank"
            description="Aquarium page"
            icon={<Fish className="w-5 h-5 text-secondary" />}
            iconBgClass="bg-secondary/10"
            pageEnabled={pageEnabled.fishtank ?? false}
            status={pageEnabled.fishtank ? 'partial' : 'disabled'}
            itemCount={4}
            itemLabel="residents"
            manageLink="/fishtank"
            btnClass="btn-secondary"
            countClass="text-secondary"
            onToggle={() => handleToggle('fishtank')}
          />
        </div>
      </div>
    </div>
  )
}
