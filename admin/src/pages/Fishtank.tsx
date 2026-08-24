import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Fish, Calendar, Pencil, Trash2, Loader2, X, Leaf, Image, Eye, EyeOff, ImageIcon, Upload } from 'lucide-react'
import { api, fetchWithAuth, cdn } from '../config/api'
import ImageManagementModalGeneric from '../components/ImageManagementModal.generic'

interface HeroImage {
  key: string
  filename: string
  displayName: string
  isActive: boolean
  lastModified: string
  size: number
}

interface Resident {
  Type: string
  Id: string
  Name?: string
  ScientificName?: string
  AddedDate?: string
  IsActive?: boolean  // Visibility: true = show on public site (finished), false = WIP/hidden
  Status?: 'current' | 'past'  // Whether resident is currently in the tank
  Quantity?: number
  Notes?: string
  Images?: string[]
}

interface TimelineEvent {
  Id: string
  Date: string
  Title: string
  Description?: string
  EventType?: string
  IsHidden?: boolean
  Images?: string[]
}

const emptyResident: Partial<Resident> = {
  Type: 'fish',  // 'fish' = inhabitants (fish, snails, shrimp), 'plant' = plants
  Id: '',
  Name: '',
  ScientificName: '',
  AddedDate: new Date().toISOString().split('T')[0],
  IsActive: true,
  Status: 'current',
  Quantity: 1,
  Notes: '',
}

const emptyEvent: Partial<TimelineEvent> = {
  Id: '',
  Date: new Date().toISOString().split('T')[0],
  Title: '',
  Description: '',
  EventType: 'other',
  IsHidden: false,
}

const EVENT_TYPES = [
  { value: 'addition', label: 'New Addition' },
  { value: 'departure', label: 'Departure' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'upgrade', label: 'Upgrade' },
  { value: 'other', label: 'Other' },
]

export default function Fishtank() {
  const [activeTab, setActiveTab] = useState<'residents' | 'timeline' | 'hero'>('residents')
  const [residentType, setResidentType] = useState<'inhabitant' | 'plant'>('inhabitant')
  const [residentFilter, setResidentFilter] = useState<'all' | 'current' | 'past'>('all')
  
  // Residents state
  const [residents, setResidents] = useState<Resident[]>([])
  const [residentsLoading, setResidentsLoading] = useState(true)
  const [residentsError, setResidentsError] = useState<string | null>(null)
  
  // Timeline state
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [timelineLoading, setTimelineLoading] = useState(true)
  const [timelineError, setTimelineError] = useState<string | null>(null)
  
  // Hero state
  const [heroImages, setHeroImages] = useState<HeroImage[]>([])
  const [heroLoading, setHeroLoading] = useState(true)
  const [heroError, setHeroError] = useState<string | null>(null)
  const [heroUploading, setHeroUploading] = useState(false)
  const heroFileInputRef = useRef<HTMLInputElement>(null)
  
  // Modal state
  const [isResidentModalOpen, setIsResidentModalOpen] = useState(false)
  const [editingResident, setEditingResident] = useState<Partial<Resident> | null>(null)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Partial<TimelineEvent> | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ type: 'resident' | 'event', item: Resident | TimelineEvent } | null>(null)
  const [nameManuallyEdited, setNameManuallyEdited] = useState(false)
  
  // Image modal state
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [imageModalItem, setImageModalItem] = useState<{ type: 'resident' | 'event', item: Resident | TimelineEvent } | null>(null)

  // Fetch residents (using admin API to get all fields)
  const fetchResidents = useCallback(async (type: 'inhabitant' | 'plant') => {
    try {
      setResidentsLoading(true)
      setResidentsError(null)
      const res = await fetchWithAuth(api.admin.fishtankResidents)
      if (!res.ok) throw new Error('Failed to fetch residents')
      const data: Resident[] = await res.json()
      // Filter by type - API uses 'fish' for inhabitants
      const apiType = type === 'inhabitant' ? 'fish' : 'plant'
      const filtered = data.filter((r: Resident) => r.Type === apiType)
      // Sort alphabetically by name
      filtered.sort((a: Resident, b: Resident) => (a.Name || a.Id).localeCompare(b.Name || b.Id))
      setResidents(filtered)
    } catch (err) {
      setResidentsError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setResidentsLoading(false)
    }
  }, [])

  // Fetch timeline (using admin API to get all fields including IsHidden)
  const fetchTimeline = useCallback(async () => {
    try {
      setTimelineLoading(true)
      setTimelineError(null)
      const res = await fetchWithAuth(api.admin.fishtankTimeline)
      if (!res.ok) throw new Error('Failed to fetch timeline')
      const data = await res.json()
      // Sort by date (oldest first - chronological)
      data.sort((a: TimelineEvent, b: TimelineEvent) => new Date(a.Date || '').getTime() - new Date(b.Date || '').getTime())
      setTimeline(data)
    } catch (err) {
      setTimelineError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setTimelineLoading(false)
    }
  }, [])

  // Fetch hero images
  const fetchHeroImages = useCallback(async () => {
    try {
      setHeroLoading(true)
      setHeroError(null)
      const res = await fetchWithAuth(api.admin.fishtankHero)
      if (!res.ok) throw new Error('Failed to fetch hero images')
      const data = await res.json()
      setHeroImages(data)
    } catch (err) {
      setHeroError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setHeroLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchResidents(residentType)
  }, [fetchResidents, residentType])

  useEffect(() => {
    if (activeTab === 'timeline') {
      fetchTimeline()
    }
  }, [activeTab, fetchTimeline])

  useEffect(() => {
    if (activeTab === 'hero') {
      fetchHeroImages()
    }
  }, [activeTab, fetchHeroImages])

  // Hero handlers
  const handleSetActiveHero = async (filename: string) => {
    try {
      const res = await fetchWithAuth(api.admin.fishtankHeroItem(filename), {
        method: 'PUT',
      })
      if (!res.ok) throw new Error('Failed to set active hero')
      fetchHeroImages()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to set active')
    }
  }

  const handleDeleteHero = async (filename: string) => {
    if (!confirm('Are you sure you want to delete this hero image?')) return
    try {
      const res = await fetchWithAuth(api.admin.fishtankHeroItem(filename), {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete hero image')
      fetchHeroImages()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const handleHeroUpload = async (files: FileList) => {
    if (files.length === 0) return
    setHeroUploading(true)
    try {
      for (const file of Array.from(files)) {
        const res = await fetchWithAuth(api.admin.imageUpload, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: 'fishtank/hero',
            filename: file.name,
            contentType: file.type,
            isThumbnail: false,
            lossless: false
          })
        })
        if (!res.ok) throw new Error('Failed to get upload URL')
        const { uploadUrl } = await res.json()
        
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type }
        })
        if (!uploadRes.ok) throw new Error('Failed to upload file')
      }
      // Wait a moment for processing, then refresh
      setTimeout(() => fetchHeroImages(), 2000)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setHeroUploading(false)
    }
  }

  // Resident handlers
  const handleAddResident = () => {
    setEditingResident({ ...emptyResident, Type: residentType === 'inhabitant' ? 'fish' : 'plant' })
    setNameManuallyEdited(false)
    setIsResidentModalOpen(true)
  }

  const handleEditResident = (resident: Resident) => {
    setEditingResident({ ...resident })
    setNameManuallyEdited(true)  // For existing residents, assume name was set intentionally
    setIsResidentModalOpen(true)
  }

  const handleDeleteResidentClick = (resident: Resident) => {
    setItemToDelete({ type: 'resident', item: resident })
    setIsDeleteModalOpen(true)
  }

  const handleSaveResident = async () => {
    if (!editingResident?.Id || !editingResident?.Type) return
    
    const isNew = !residents.some(r => r.Type === editingResident.Type && r.Id === editingResident.Id)
    
    try {
      setIsSaving(true)
      
      if (isNew) {
        const res = await fetchWithAuth(api.admin.fishtankResidents, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingResident),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to create resident')
        }
      } else {
        const res = await fetchWithAuth(api.admin.fishtankResident(editingResident.Type, editingResident.Id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingResident),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to update resident')
        }
      }
      
      setIsResidentModalOpen(false)
      setEditingResident(null)
      fetchResidents(residentType)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  // Event handlers
  const handleAddEvent = () => {
    setEditingEvent({ ...emptyEvent })
    setIsEventModalOpen(true)
  }

  const handleEditEvent = (event: TimelineEvent) => {
    setEditingEvent({ ...event })
    setIsEventModalOpen(true)
  }

  const handleDeleteEventClick = (event: TimelineEvent) => {
    setItemToDelete({ type: 'event', item: event })
    setIsDeleteModalOpen(true)
  }

  const handleSaveEvent = async () => {
    if (!editingEvent?.Title || !editingEvent?.Date) return
    
    // Generate ID if new
    if (!editingEvent.Id) {
      editingEvent.Id = `${editingEvent.Date}-${editingEvent.Title.toLowerCase().replace(/\s+/g, '-')}`
    }
    
    const isNew = !timeline.some(e => e.Id === editingEvent.Id)
    
    try {
      setIsSaving(true)
      
      if (isNew) {
        const res = await fetchWithAuth(api.admin.fishtankTimeline, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingEvent),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to create event')
        }
      } else {
        const res = await fetchWithAuth(api.admin.fishtankTimelineEvent(editingEvent.Id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingEvent),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to update event')
        }
      }
      
      setIsEventModalOpen(false)
      setEditingEvent(null)
      fetchTimeline()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return
    
    try {
      setIsSaving(true)
      
      if (itemToDelete.type === 'resident') {
        const resident = itemToDelete.item as Resident
        const res = await fetchWithAuth(api.admin.fishtankResident(resident.Type, resident.Id), {
          method: 'DELETE',
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to delete resident')
        }
        fetchResidents(residentType)
      } else {
        const event = itemToDelete.item as TimelineEvent
        const res = await fetchWithAuth(api.admin.fishtankTimelineEvent(event.Id), {
          method: 'DELETE',
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to delete event')
        }
        fetchTimeline()
      }
      
      setIsDeleteModalOpen(false)
      setItemToDelete(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setIsSaving(false)
    }
  }

  const isNewResident = editingResident && !residents.some(
    r => r.Type === editingResident.Type && r.Id === editingResident.Id
  )

  const isNewEvent = editingEvent && !timeline.some(e => e.Id === editingEvent.Id)

  // Inline toggle for resident active status (visibility)
  const handleToggleResidentActive = async (resident: Resident) => {
    try {
      const res = await fetchWithAuth(api.admin.fishtankResident(resident.Type, resident.Id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ IsActive: !(resident.IsActive ?? true) }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setResidents(residents.map(r => 
        r.Type === resident.Type && r.Id === resident.Id 
          ? { ...r, IsActive: !(r.IsActive ?? true) } 
          : r
      ))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  // Inline toggle for resident status (current/past)
  const handleChangeResidentStatus = async (resident: Resident, newStatus: 'current' | 'past') => {
    try {
      const res = await fetchWithAuth(api.admin.fishtankResident(resident.Type, resident.Id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setResidents(residents.map(r => 
        r.Type === resident.Type && r.Id === resident.Id 
          ? { ...r, Status: newStatus } 
          : r
      ))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  // Inline toggle for timeline event visibility
  const handleToggleEventHidden = async (event: TimelineEvent) => {
    try {
      const res = await fetchWithAuth(api.admin.fishtankTimelineEvent(event.Id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ IsHidden: !event.IsHidden }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setTimeline(timeline.map(e => 
        e.Id === event.Id 
          ? { ...e, IsHidden: !e.IsHidden } 
          : e
      ))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Fishtank</h1>
          <p className="text-base-content/60 mt-1">Manage residents, timeline, and hero images</p>
        </div>
        {activeTab !== 'hero' && (
          <button 
            className="btn btn-primary gap-2"
            onClick={activeTab === 'residents' ? handleAddResident : handleAddEvent}
          >
            <Plus className="w-5 h-5" />
            {activeTab === 'residents' ? 'Add Resident' : 'Add Event'}
          </button>
        )}
      </div>
      
      <div role="tablist" className="tabs tabs-boxed mb-6 w-fit">
        <button 
          role="tab" 
          className={`tab ${activeTab === 'residents' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('residents')}
        >
          Residents
        </button>
        <button 
          role="tab" 
          className={`tab ${activeTab === 'timeline' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          Timeline
        </button>
        <button 
          role="tab" 
          className={`tab ${activeTab === 'hero' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('hero')}
        >
          Hero
        </button>
      </div>

      {/* Residents Tab */}
      {activeTab === 'residents' && (
        <div className="space-y-4">
          {/* Inhabitants/Plants toggle */}
          <div className="flex gap-2">
            <button
              className={`btn btn-sm gap-2 ${residentType === 'inhabitant' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setResidentType('inhabitant')}
            >
              <Fish className="w-4 h-4" />
              Inhabitants
            </button>
            <button
              className={`btn btn-sm gap-2 ${residentType === 'plant' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setResidentType('plant')}
            >
              <Leaf className="w-4 h-4" />
              Plants
            </button>
            <div className="divider divider-horizontal mx-2"></div>
            <button
              className={`btn btn-sm ${residentFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setResidentFilter('all')}
            >
              All
            </button>
            <button
              className={`btn btn-sm ${residentFilter === 'current' ? 'btn-success' : 'btn-ghost'}`}
              onClick={() => setResidentFilter('current')}
            >
              Current
            </button>
            <button
              className={`btn btn-sm ${residentFilter === 'past' ? 'btn-neutral' : 'btn-ghost'}`}
              onClick={() => setResidentFilter('past')}
            >
              Past
            </button>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body p-0">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr className="bg-base-200">
                      <th>Name</th>
                      <th>Scientific Name</th>
                      {residentType === 'inhabitant' && <th>Qty</th>}
                      <th>Added</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {residentsLoading ? (
                      <tr>
                        <td colSpan={residentType === 'inhabitant' ? 6 : 5}>
                          <div className="flex flex-col items-center justify-center py-12 text-base-content/60">
                            <Loader2 className="w-12 h-12 mb-4 animate-spin opacity-50" />
                            <p className="font-medium">Loading {residentType === 'inhabitant' ? 'inhabitants' : 'plants'}...</p>
                          </div>
                        </td>
                      </tr>
                    ) : residentsError ? (
                      <tr>
                        <td colSpan={residentType === 'inhabitant' ? 6 : 5}>
                          <div className="flex flex-col items-center justify-center py-12 text-error">
                            <p className="font-medium">Error loading residents</p>
                            <p className="text-sm">{residentsError}</p>
                            <button className="btn btn-sm btn-ghost mt-2" onClick={() => fetchResidents(residentType)}>Retry</button>
                          </div>
                        </td>
                      </tr>
                    ) : residents.filter(r => residentFilter === 'all' ? true : (r.Status ?? 'current') === residentFilter).length === 0 ? (
                      <tr>
                        <td colSpan={residentType === 'inhabitant' ? 6 : 5}>
                          <div className="flex flex-col items-center justify-center py-12 text-base-content/60">
                            {residentType === 'inhabitant' ? <Fish className="w-12 h-12 mb-4 opacity-50" /> : <Leaf className="w-12 h-12 mb-4 opacity-50" />}
                            <p className="font-medium">No {residentFilter === 'all' ? '' : residentFilter + ' '}{residentType === 'inhabitant' ? 'inhabitants' : 'plants'}</p>
                            <p className="text-sm">{residentFilter === 'past' ? 'No past residents' : 'Add your first resident'}</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      residents
                        .filter(r => residentFilter === 'all' ? true : (r.Status ?? 'current') === residentFilter)
                        .map((resident) => (
                        <tr key={`${resident.Type}-${resident.Id}`} className={(resident.IsActive ?? true) ? '' : 'opacity-60'}>
                          <td className="font-medium">{resident.Name || resident.Id}</td>
                          <td><span className="italic text-base-content/60">{resident.ScientificName || '-'}</span></td>
                          {residentType === 'inhabitant' && <td>{resident.Quantity || 1}</td>}
                          <td>{resident.AddedDate || '-'}</td>
                          <td>
                            <select 
                              className={`select select-sm select-bordered w-24 ${(resident.Status ?? 'current') === 'current' ? 'select-success' : ''}`}
                              value={resident.Status ?? 'current'}
                              onChange={(e) => handleChangeResidentStatus(resident, e.target.value as 'current' | 'past')}
                            >
                              <option value="current">Current</option>
                              <option value="past">Past</option>
                            </select>
                          </td>
                          <td>
                            <div className="flex justify-end gap-1">
                              <button 
                                className={`btn btn-ghost btn-sm btn-square border-0 ${(resident.IsActive ?? true) ? 'text-success' : 'text-base-content/30'}`}
                                onClick={() => handleToggleResidentActive(resident)}
                                title={(resident.IsActive ?? true) ? 'Visible - click to hide' : 'Hidden - click to show'}
                              >
                                {(resident.IsActive ?? true) ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </button>
                              <button 
                                className="btn btn-ghost btn-sm btn-square border-0"
                                onClick={() => {
                                  setImageModalItem({ type: 'resident', item: resident })
                                  setIsImageModalOpen(true)
                                }}
                                title="Manage images"
                              >
                                <Image className="w-4 h-4" />
                              </button>
                              <button 
                                className="btn btn-ghost btn-sm btn-square border-0"
                                onClick={() => handleEditResident(resident)}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button 
                                className="btn btn-ghost btn-sm btn-square border-0 text-error"
                                onClick={() => handleDeleteResidentClick(resident)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === 'timeline' && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-0">
            {timelineLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-base-content/60">
                <Loader2 className="w-12 h-12 mb-4 animate-spin opacity-50" />
                <p className="font-medium">Loading timeline...</p>
              </div>
            ) : timelineError ? (
              <div className="flex flex-col items-center justify-center py-12 text-error">
                <p className="font-medium">Error loading timeline</p>
                <p className="text-sm">{timelineError}</p>
                <button className="btn btn-sm btn-ghost mt-2" onClick={fetchTimeline}>Retry</button>
              </div>
            ) : timeline.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-base-content/60">
                <Calendar className="w-12 h-12 mb-4 opacity-50" />
                <p className="font-medium">No timeline events yet</p>
                <p className="text-sm">Add your first event to track fishtank history</p>
              </div>
            ) : (
              <div className="divide-y">
                {timeline.map((event) => (
                  <div key={event.Id} className={`p-4 flex items-start gap-4 ${event.IsHidden ? 'opacity-50' : ''}`}>
                    <div className="text-sm text-base-content/60 w-24 shrink-0">
                      {event.Date}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{event.Title}</span>
                        {event.EventType && (
                          <span className="badge badge-sm badge-outline">
                            {EVENT_TYPES.find(t => t.value === event.EventType)?.label || event.EventType}
                          </span>
                        )}
                        {event.IsHidden && (
                          <span className="badge badge-sm badge-ghost">Hidden</span>
                        )}
                      </div>
                      {event.Description && (
                        <p className="text-sm text-base-content/60 mt-1">{event.Description}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button 
                        className={`btn btn-ghost btn-sm btn-square border-0 ${!event.IsHidden ? 'text-success' : 'text-base-content/30'}`}
                        onClick={() => handleToggleEventHidden(event)}
                        title={!event.IsHidden ? 'Visible - click to hide' : 'Hidden - click to show'}
                      >
                        {!event.IsHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button 
                        className="btn btn-ghost btn-sm btn-square border-0"
                        onClick={() => {
                          setImageModalItem({ type: 'event', item: event })
                          setIsImageModalOpen(true)
                        }}
                        title="Manage images"
                      >
                        <Image className="w-4 h-4" />
                      </button>
                      <button 
                        className="btn btn-ghost btn-sm btn-square border-0"
                        onClick={() => handleEditEvent(event)}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        className="btn btn-ghost btn-sm btn-square border-0 text-error"
                        onClick={() => handleDeleteEventClick(event)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hero Tab */}
      {activeTab === 'hero' && (
        <div className="space-y-4">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Hero Images</h3>
                <div>
                  <input
                    ref={heroFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files && handleHeroUpload(e.target.files)}
                  />
                  <button 
                    className="btn btn-primary btn-sm gap-2"
                    onClick={() => heroFileInputRef.current?.click()}
                    disabled={heroUploading}
                  >
                    {heroUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Upload Image
                  </button>
                </div>
              </div>

              {heroLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-base-content/60">
                  <Loader2 className="w-12 h-12 mb-4 animate-spin opacity-50" />
                  <p className="font-medium">Loading hero images...</p>
                </div>
              ) : heroError ? (
                <div className="flex flex-col items-center justify-center py-12 text-error">
                  <p className="font-medium">Error loading hero images</p>
                  <p className="text-sm">{heroError}</p>
                  <button className="btn btn-sm btn-ghost mt-2" onClick={fetchHeroImages}>Retry</button>
                </div>
              ) : heroImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-base-content/60">
                  <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
                  <p className="font-medium">No hero images yet</p>
                  <p className="text-sm">Upload your first hero image</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr className="bg-base-200">
                        <th className="w-20">Preview</th>
                        <th>Filename</th>
                        <th>Uploaded</th>
                        <th className="text-center">Active</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {heroImages.map((hero) => (
                        <tr key={hero.key} className={hero.isActive ? 'bg-success/10' : ''}>
                          <td>
                            <img 
                              src={cdn.fishtank(hero.key)} 
                              alt={hero.displayName}
                              className="w-16 h-10 object-cover rounded"
                            />
                          </td>
                          <td className="font-mono text-sm">{hero.displayName}</td>
                          <td className="text-sm text-base-content/60">
                            {new Date(hero.lastModified).toLocaleDateString()}
                          </td>
                          <td className="text-center">
                            <input 
                              type="radio" 
                              name="active-hero" 
                              className="radio radio-success"
                              checked={hero.isActive}
                              onChange={() => !hero.isActive && handleSetActiveHero(hero.displayName)}
                            />
                          </td>
                          <td className="text-right">
                            <button 
                              className="btn btn-ghost btn-sm btn-square border-0 text-error"
                              onClick={() => handleDeleteHero(hero.displayName)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Resident Modal */}
      <dialog className={`modal ${isResidentModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">
              {isNewResident ? 'Add' : 'Edit'} {editingResident?.Type === 'plant' ? 'Plant' : 'Inhabitant'}
            </h3>
            <button 
              className="btn btn-ghost btn-sm btn-square"
              onClick={() => { setIsResidentModalOpen(false); setEditingResident(null) }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {editingResident && (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left column - Details */}
              <div className="lg:w-2/3 space-y-4">
                <h4 className="font-medium text-sm text-base-content/60 uppercase tracking-wide">Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label"><span className="label-text">Type *</span></label>
                    <select 
                      className="select select-bordered"
                      value={editingResident.Type || 'fish'}
                      onChange={(e) => setEditingResident({ ...editingResident, Type: e.target.value })}
                      disabled={!isNewResident}
                    >
                      <option value="fish">Inhabitant</option>
                      <option value="plant">Plant</option>
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">ID *</span></label>
                    <input 
                      type="text" 
                      className="input input-bordered" 
                      placeholder="e.g. neon-tetra"
                      value={editingResident.Id || ''}
                      onChange={(e) => {
                        const sanitized = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                        const updates: Partial<Resident> = { Id: sanitized }
                        // Auto-sync display name if not manually edited
                        if (!nameManuallyEdited) {
                          updates.Name = sanitized
                            ? sanitized
                                .split('-')
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ')
                            : ''
                        }
                        setEditingResident({ ...editingResident, ...updates })
                      }}
                      disabled={!isNewResident}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Display Name</span></label>
                    <input 
                      type="text" 
                      className="input input-bordered" 
                      placeholder="e.g. Neon Tetra"
                      value={editingResident.Name || ''}
                      onChange={(e) => {
                        setNameManuallyEdited(true)
                        setEditingResident({ ...editingResident, Name: e.target.value })
                      }}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Scientific Name</span></label>
                    <input 
                      type="text" 
                      className="input input-bordered italic" 
                      placeholder="e.g. Paracheirodon innesi"
                      value={editingResident.ScientificName || ''}
                      onChange={(e) => setEditingResident({ ...editingResident, ScientificName: e.target.value })}
                    />
                  </div>
                  {editingResident.Type === 'fish' && (
                    <div className="form-control">
                      <label className="label"><span className="label-text">Quantity</span></label>
                      <input 
                        type="number" 
                        className="input input-bordered" 
                        min="1"
                        value={editingResident.Quantity || 1}
                        onChange={(e) => setEditingResident({ ...editingResident, Quantity: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  )}
                  <div className="form-control">
                    <label className="label"><span className="label-text">Added Date</span></label>
                    <input 
                      type="date" 
                      className="input input-bordered" 
                      value={editingResident.AddedDate || ''}
                      onChange={(e) => setEditingResident({ ...editingResident, AddedDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Right column - Notes & Settings */}
              <div className="lg:w-1/3 space-y-4">
                <h4 className="font-medium text-sm text-base-content/60 uppercase tracking-wide">Notes</h4>
                <div className="form-control">
                  <textarea 
                    className="textarea textarea-bordered h-32" 
                    placeholder="Any additional notes..."
                    value={editingResident.Notes || ''}
                    onChange={(e) => setEditingResident({ ...editingResident, Notes: e.target.value })}
                  />
                </div>

                <h4 className="font-medium text-sm text-base-content/60 uppercase tracking-wide pt-2">Settings</h4>
                <div className="form-control">
                  <label className="label"><span className="label-text">Status</span></label>
                  <select 
                    className="select select-bordered select-sm"
                    value={editingResident.Status ?? 'current'}
                    onChange={(e) => setEditingResident({ ...editingResident, Status: e.target.value as 'current' | 'past' })}
                  >
                    <option value="current">Current (in tank)</option>
                    <option value="past">Past (no longer in tank)</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3 py-1">
                    <input 
                      type="checkbox" 
                      className="toggle toggle-success toggle-sm" 
                      checked={editingResident.IsActive ?? true}
                      onChange={(e) => setEditingResident({ ...editingResident, IsActive: e.target.checked })}
                    />
                    <div className="flex items-center gap-2">
                      {(editingResident.IsActive ?? true) ? <Eye className="w-4 h-4 text-success" /> : <EyeOff className="w-4 h-4 text-base-content/30" />}
                      <div>
                        <span className="label-text">Visible</span>
                        <p className="text-xs text-base-content/50">Show on public site</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
          
          <div className="modal-action">
            <button 
              className="btn btn-ghost"
              onClick={() => { setIsResidentModalOpen(false); setEditingResident(null) }}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleSaveResident}
              disabled={!editingResident?.Id || isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isNewResident ? 'Add' : 'Save'}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => { setIsResidentModalOpen(false); setEditingResident(null) }}>close</button>
        </form>
      </dialog>

      {/* Add/Edit Event Modal */}
      <dialog className={`modal ${isEventModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">
              {isNewEvent ? 'Add' : 'Edit'} Timeline Event
            </h3>
            <button 
              className="btn btn-ghost btn-sm btn-square"
              onClick={() => { setIsEventModalOpen(false); setEditingEvent(null) }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {editingEvent && (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left column - Details */}
              <div className="lg:w-1/2 space-y-4">
                <h4 className="font-medium text-sm text-base-content/60 uppercase tracking-wide">Details</h4>
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label"><span className="label-text">Title *</span></label>
                    <input 
                      type="text" 
                      className="input input-bordered" 
                      placeholder="e.g. Added new fish"
                      value={editingEvent.Title || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, Title: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label"><span className="label-text">Date *</span></label>
                      <input 
                        type="date" 
                        className="input input-bordered" 
                        value={editingEvent.Date || ''}
                        onChange={(e) => setEditingEvent({ ...editingEvent, Date: e.target.value })}
                      />
                    </div>
                    <div className="form-control">
                      <label className="label"><span className="label-text">Event Type</span></label>
                      <select 
                        className="select select-bordered"
                        value={editingEvent.EventType || 'other'}
                        onChange={(e) => setEditingEvent({ ...editingEvent, EventType: e.target.value })}
                      >
                        {EVENT_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column - Description & Settings */}
              <div className="lg:w-1/2 space-y-4">
                <h4 className="font-medium text-sm text-base-content/60 uppercase tracking-wide">Description</h4>
                <div className="form-control">
                  <textarea 
                    className="textarea textarea-bordered h-24" 
                    placeholder="What happened..."
                    value={editingEvent.Description || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, Description: e.target.value })}
                  />
                </div>

                <h4 className="font-medium text-sm text-base-content/60 uppercase tracking-wide pt-2">Settings</h4>
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3 py-1">
                    <input 
                      type="checkbox" 
                      className="toggle toggle-success toggle-sm" 
                      checked={!editingEvent.IsHidden}
                      onChange={(e) => setEditingEvent({ ...editingEvent, IsHidden: !e.target.checked })}
                    />
                    <div className="flex items-center gap-2">
                      {!editingEvent.IsHidden ? <Eye className="w-4 h-4 text-success" /> : <EyeOff className="w-4 h-4 text-base-content/30" />}
                      <div>
                        <span className="label-text">Visible</span>
                        <p className="text-xs text-base-content/50">Show on public site</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
          
          <div className="modal-action">
            <button 
              className="btn btn-ghost"
              onClick={() => { setIsEventModalOpen(false); setEditingEvent(null) }}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleSaveEvent}
              disabled={!editingEvent?.Title || !editingEvent?.Date || isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isNewEvent ? 'Add' : 'Save'}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => { setIsEventModalOpen(false); setEditingEvent(null) }}>close</button>
        </form>
      </dialog>

      {/* Delete Confirmation Modal */}
      <dialog className={`modal ${isDeleteModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg">Delete {itemToDelete?.type === 'resident' ? 'Resident' : 'Event'}</h3>
          <p className="py-4">
            Are you sure you want to delete{' '}
            <strong>
              {itemToDelete?.type === 'resident' 
                ? (itemToDelete.item as Resident).Id 
                : (itemToDelete?.item as TimelineEvent)?.Title}
            </strong>? 
            This action cannot be undone.
          </p>
          <div className="modal-action">
            <button 
              className="btn btn-ghost"
              onClick={() => { setIsDeleteModalOpen(false); setItemToDelete(null) }}
            >
              Cancel
            </button>
            <button 
              className="btn btn-error"
              onClick={handleDeleteConfirm}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => { setIsDeleteModalOpen(false); setItemToDelete(null) }}>close</button>
        </form>
      </dialog>

      {/* Image Management Modal */}
      {imageModalItem && (
        <ImageManagementModalGeneric
          isOpen={isImageModalOpen}
          onClose={() => {
            setIsImageModalOpen(false)
            setImageModalItem(null)
          }}
          contentType="fishtank"
          identifier={
            imageModalItem.type === 'resident'
              ? `residents/${(imageModalItem.item as Resident).Type}/${(imageModalItem.item as Resident).Id}`
              : `timeline/${(imageModalItem.item as TimelineEvent).Id}`
          }
          displayName={
            imageModalItem.type === 'resident'
              ? (imageModalItem.item as Resident).Name || (imageModalItem.item as Resident).Id
              : (imageModalItem.item as TimelineEvent).Title
          }
        />
      )}
    </div>
  )
}
