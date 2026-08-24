import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Fish, Image, TrendingUp, Users, Eye, AlertTriangle, Gauge, BarChart3, Check, X, Minus, Power } from 'lucide-react'
import { api, fetchWithAuth } from '../config/api'
import QRCodeModal from '../components/QRCodeModal'

type ContentStatus = 'active' | 'partial' | 'empty' | 'disabled'

interface ContentCardProps {
  title: string
  description: string
  icon: React.ReactNode
  iconBgClass: string
  pageEnabled: boolean
  status: ContentStatus
  itemCount: number
  itemLabel: React.ReactNode
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
          <div className="text-sm capitalize">
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

interface TrafficData {
  date: string
  views: number
  visitors: number
}

interface PageData {
  page: string
  views: number
}

interface ApiData {
  endpoint: string
  requests: number
  avg_ms: number
  max_ms: number
}

export default function Dashboard() {
  const [watchCount, setWatchCount] = useState<number | null>(null)
  const [albumCount, setAlbumCount] = useState<number | null>(null)
  const [residentCount, setResidentCount] = useState<number | null>(null)
  const [timelineCount, setTimelineCount] = useState<number | null>(null)
  const [pageEnabled, setPageEnabled] = useState<PageEnabledConfig>({})
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [trafficData, setTrafficData] = useState<TrafficData[]>([])
  const [trafficDays, setTrafficDays] = useState(7)
  const [trafficLoading, setTrafficLoading] = useState(true)
  const [pagesData, setPagesData] = useState<PageData[]>([])
  const [pagesLoading, setPagesLoading] = useState(true)
  const [apiData, setApiData] = useState<ApiData[]>([])
  const [apiLoading, setApiLoading] = useState(true)

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

    // Fetch fishtank resident count
    fetchWithAuth(api.admin.fishtankResidents)
      .then(res => res.json())
      .then(data => setResidentCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setResidentCount(0))

    // Fetch fishtank timeline count
    fetchWithAuth(api.admin.fishtankTimeline)
      .then(res => res.json())
      .then(data => setTimelineCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setTimelineCount(0))

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

    // Fetch popular pages
    fetchWithAuth(api.admin.metricsPages)
      .then(res => res.json())
      .then(data => {
        setPagesData(Array.isArray(data) ? data : [])
        setPagesLoading(false)
      })
      .catch(() => {
        setPagesData([])
        setPagesLoading(false)
      })

    // Fetch API performance
    fetchWithAuth(api.admin.metricsApi)
      .then(res => res.json())
      .then(data => {
        setApiData(Array.isArray(data) ? data : [])
        setApiLoading(false)
      })
      .catch(() => {
        setApiData([])
        setApiLoading(false)
      })
  }, [])

  // Fetch traffic data when days change
  useEffect(() => {
    setTrafficLoading(true)
    fetchWithAuth(api.admin.metricsTraffic(trafficDays))
      .then(res => res.json())
      .then(data => {
        setTrafficData(Array.isArray(data) ? data : [])
        setTrafficLoading(false)
      })
      .catch(() => {
        setTrafficData([])
        setTrafficLoading(false)
      })
  }, [trafficDays])

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
      <QRCodeModal />
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
                {metricsLoading ? '...' : (metrics?.pageViews ?? 0)}
              </div>
              <div className="stat-desc">Today</div>
            </div>
            <div className="stat">
              <div className="stat-figure text-secondary">
                <Users className="w-6 h-6" />
              </div>
              <div className="stat-title">Unique Visitors</div>
              <div className="stat-value text-secondary text-2xl">
                {metricsLoading ? '...' : (metrics?.uniqueVisitors ?? 0)}
              </div>
              <div className="stat-desc">Today</div>
            </div>
            <div className="stat">
              <div className="stat-figure text-error">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="stat-title">Server Errors</div>
              <div className="stat-value text-error text-2xl">
                {metricsLoading ? '...' : (metrics?.errors24h ?? 0)}
              </div>
              <div className="stat-desc">5xx, last 24h</div>
            </div>
            <div className="stat">
              <div className="stat-figure text-success">
                <Gauge className="w-6 h-6" />
              </div>
              <div className="stat-title">Avg Response</div>
              <div className="stat-value text-success text-2xl">
                {metricsLoading ? '...' : (metrics?.avgResponseMs ?? 0)}
              </div>
              <div className="stat-desc">ms</div>
            </div>
          </div>

          {/* Traffic over time chart */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h2 className="card-title text-lg">
                  <TrendingUp className="w-5 h-5" />
                  Traffic Over Time
                </h2>
                <select 
                  className="select select-bordered select-sm"
                  value={trafficDays}
                  onChange={(e) => setTrafficDays(Number(e.target.value))}
                >
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                </select>
              </div>
              <div className="h-48">
                {trafficLoading ? (
                  <div className="h-full bg-base-200 rounded-lg flex items-center justify-center">
                    <span className="loading loading-spinner loading-md"></span>
                  </div>
                ) : trafficData.length === 0 ? (
                  <div className="h-full bg-base-200 rounded-lg flex items-center justify-center">
                    <div className="text-center text-base-content/40">
                      <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No traffic data yet</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    {/* Stacked bar chart */}
                    <div className="flex-1 flex items-end gap-1 px-1">
                      {trafficData.map((day, i) => {
                        const maxViews = Math.max(...trafficData.map(d => d.views), 1)
                        const viewsHeight = (day.views / maxViews) * 100
                        const visitorsHeight = (day.visitors / maxViews) * 100
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center group relative">
                            {/* Tooltip */}
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-base-300 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                              {day.views} views / {day.visitors} visitors
                            </div>
                            {/* Stacked bar */}
                            <div className="w-full h-28 flex flex-col justify-end">
                              <div 
                                className="w-full bg-primary/30 rounded-t transition-all group-hover:bg-primary/40 relative"
                                style={{ height: `${Math.max(viewsHeight, 3)}%` }}
                              >
                                {/* Visitors portion (darker, stacked inside) */}
                                <div 
                                  className="absolute bottom-0 left-0 right-0 bg-primary rounded-t transition-all"
                                  style={{ height: `${(visitorsHeight / viewsHeight) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* X-axis labels */}
                    <div className="flex justify-between text-[10px] text-base-content/60 px-1 mt-1">
                      {trafficData.length <= 7 ? (
                        trafficData.map((d, i) => (
                          <span key={i} className="flex-1 text-center">{new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        ))
                      ) : (
                        <>
                          <span>{new Date(trafficData[0]?.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                          <span className="flex-1 text-center">{new Date(trafficData[Math.floor(trafficData.length / 2)]?.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                          <span>{new Date(trafficData[trafficData.length - 1]?.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        </>
                      )}
                    </div>
                    
                    {/* Legend */}
                    <div className="flex gap-4 justify-center text-xs mt-1">
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-primary rounded"></span> Visitors
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-primary/30 rounded"></span> Views
                      </span>
                    </div>
                  </div>
                )}
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
                <div className="h-40">
                  {pagesLoading ? (
                    <div className="h-full bg-base-200 rounded-lg flex items-center justify-center">
                      <span className="loading loading-spinner loading-md"></span>
                    </div>
                  ) : pagesData.length === 0 ? (
                    <div className="h-full bg-base-200 rounded-lg flex items-center justify-center">
                      <div className="text-center text-base-content/40">
                        <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No page data yet</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 overflow-y-auto h-full pr-2">
                      {pagesData.slice(0, 5).map((page, i) => {
                        const maxViews = Math.max(...pagesData.map(p => p.views), 1)
                        const widthPercent = (page.views / maxViews) * 100
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs truncate mb-1" title={page.page}>
                                {page.page === '/' ? 'Home' : page.page}
                              </div>
                              <div className="h-4 bg-base-200 rounded overflow-hidden">
                                <div 
                                  className="h-full bg-accent/80 rounded"
                                  style={{ width: `${widthPercent}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-xs font-medium w-12 text-right">{page.views}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
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
                <div className="h-40">
                  {apiLoading ? (
                    <div className="h-full bg-base-200 rounded-lg flex items-center justify-center">
                      <span className="loading loading-spinner loading-md"></span>
                    </div>
                  ) : apiData.length === 0 ? (
                    <div className="h-full bg-base-200 rounded-lg flex items-center justify-center">
                      <div className="text-center text-base-content/40">
                        <Gauge className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No API data yet</p>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto h-full">
                      <table className="table table-xs">
                        <thead>
                          <tr>
                            <th>Endpoint</th>
                            <th className="text-right">Reqs</th>
                            <th className="text-right">Avg</th>
                            <th className="text-right">Max</th>
                          </tr>
                        </thead>
                        <tbody>
                          {apiData.slice(0, 5).map((endpoint, i) => (
                            <tr key={i}>
                              <td className="truncate max-w-[120px]" title={endpoint.endpoint}>
                                {endpoint.endpoint.replace('/api/', '')}
                              </td>
                              <td className="text-right">{endpoint.requests}</td>
                              <td className="text-right">{endpoint.avg_ms}ms</td>
                              <td className="text-right text-warning">{endpoint.max_ms}ms</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
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
            status={pageEnabled.fishtank ? ((residentCount ?? 0) > 0 ? 'active' : 'empty') : 'disabled'}
            itemCount={residentCount ?? 0}
            itemLabel={<>residents &nbsp; <span className="text-secondary font-medium">{timelineCount ?? 0}</span> events</>}
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
