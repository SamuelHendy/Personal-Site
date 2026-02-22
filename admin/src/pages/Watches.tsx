import { useState, useEffect, useCallback } from 'react'
import { Plus, Clock, Pencil, Trash2, Star, X, Loader2, Settings, Image, Eye, EyeOff } from 'lucide-react'
import { api, fetchWithAuth } from '../config/api'
import ImageManagementModal from '../components/ImageManagementModal'

// Fields that can be toggled for display on the public site
const DISPLAY_FIELDS = [
  { key: 'Dial_Colour', label: 'Dial Colour' },
  { key: 'Case_Width', label: 'Case Width' },
  { key: 'Movement_Type', label: 'Movement Type' },
  { key: 'Movement_Name', label: 'Movement Name' },
  { key: 'Manufactured_Year', label: 'Manufactured Year' },
  { key: 'Obtained_Date', label: 'Obtained Date' },
  { key: 'Description', label: 'Description' },
  { key: 'Purchase_Price', label: 'Purchase Price' },
  { key: 'Acquired_From', label: 'Acquired From' },
  { key: 'Beats_Per_Hour', label: 'Beats Per Hour' },
  { key: 'Glass', label: 'Glass' },
  { key: 'Case_Material', label: 'Case Material' },
  { key: 'Caseback_Window', label: 'Caseback Window' },
  { key: 'Lug_Width', label: 'Lug Width' },
  { key: 'Acquired_Condition', label: 'Acquired Condition' },
] as const

type DisplayConfig = Record<string, boolean>

interface Watch {
  Brand: string
  Model: string
  Dial_Colour?: string
  Case_Width?: number
  Movement_Type?: string
  Movement_Name?: string
  Manufactured_Year?: string
  Obtained_Date?: string
  Description?: string
  Purchase_Price?: string | number
  Acquired_From?: string
  Beats_Per_Hour?: number
  Glass?: string
  Case_Material?: string
  Caseback_Window?: boolean
  Lug_Width?: number
  Acquired_Condition?: string
  Is_Favourite?: boolean
  Enabled?: boolean
}

const emptyWatch: Partial<Watch> = {
  Brand: '',
  Model: '',
  Dial_Colour: '',
  Case_Width: undefined,
  Movement_Type: '',
  Movement_Name: '',
  Manufactured_Year: '',
  Obtained_Date: '',
  Description: '',
  Purchase_Price: '',
  Acquired_From: '',
  Beats_Per_Hour: undefined,
  Glass: '',
  Case_Material: '',
  Caseback_Window: false,
  Lug_Width: undefined,
  Acquired_Condition: '',
  Is_Favourite: false,
  Enabled: true,
}

export default function Watches() {
  const [watches, setWatches] = useState<Watch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWatch, setEditingWatch] = useState<Partial<Watch> | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [watchToDelete, setWatchToDelete] = useState<Watch | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Image management modal state
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [imageModalWatch, setImageModalWatch] = useState<Watch | null>(null)
  
  // Processing status per watch: { "Brand/Model": ["file1.jpg", "file2.png"] }
  const [processingStatus, setProcessingStatus] = useState<Record<string, string[]>>({})

  // Display config state
  const [displayConfig, setDisplayConfig] = useState<DisplayConfig>({})
  const [displayConfigLoading, setDisplayConfigLoading] = useState(true)

  // Fetch processing status for all watches
  const fetchAllProcessingStatus = async (watchList: Watch[]) => {
    const statusMap: Record<string, string[]> = {}
    await Promise.all(
      watchList.map(async (watch) => {
        try {
          const path = `watches/${watch.Brand}/${watch.Model}`
          const res = await fetchWithAuth(api.admin.imageStatus(path))
          if (res.ok) {
            const data = await res.json()
            if (data.pendingFiles && data.pendingFiles.length > 0) {
              statusMap[`${watch.Brand}/${watch.Model}`] = data.pendingFiles
            }
          }
        } catch {
          // Ignore errors for individual watches
        }
      })
    )
    setProcessingStatus(statusMap)
  }

  const fetchWatches = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetchWithAuth(api.admin.watches)
      if (!res.ok) throw new Error('Failed to fetch watches')
      const data = await res.json()
      setWatches(data)
      // Also fetch processing status for all watches
      fetchAllProcessingStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDisplayConfig = async () => {
    try {
      setDisplayConfigLoading(true)
      const res = await fetchWithAuth(api.admin.config('display_config', 'watches'))
      if (!res.ok) throw new Error('Failed to fetch display config')
      const data = await res.json()
      // Extract just the field booleans (exclude ConfigType and ConfigKey)
      delete data.ConfigType
      delete data.ConfigKey
      
      // If empty, create default record with all fields disabled
      if (Object.keys(data).length === 0) {
        const defaults: DisplayConfig = {}
        DISPLAY_FIELDS.forEach(({ key }) => { defaults[key] = false })
        await fetchWithAuth(api.admin.config('display_config', 'watches'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(defaults),
        })
        setDisplayConfig(defaults)
      } else {
        setDisplayConfig(data)
      }
    } catch (err) {
      console.error('Failed to load display config:', err)
      setDisplayConfig({})
    } finally {
      setDisplayConfigLoading(false)
    }
  }

  // Fetch watches and display config on mount
  useEffect(() => {
    fetchWatches()
    fetchDisplayConfig()
  }, [fetchWatches])

  const handleToggleDisplayField = async (fieldKey: string) => {
    const currentValue = displayConfig[fieldKey] ?? false
    const newValue = !currentValue
    
    // Optimistic update
    setDisplayConfig(prev => ({ ...prev, [fieldKey]: newValue }))
    
    try {
      const res = await fetchWithAuth(api.admin.config('display_config', 'watches'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...displayConfig, [fieldKey]: newValue }),
      })
      if (!res.ok) throw new Error('Failed to update display config')
    } catch {
      // Revert on error
      setDisplayConfig(prev => ({ ...prev, [fieldKey]: currentValue }))
      alert('Failed to update display config')
    }
  }

  const handleAddWatch = () => {
    setEditingWatch({ ...emptyWatch })
    setIsModalOpen(true)
  }

  const handleEditWatch = (watch: Watch) => {
    setEditingWatch({ ...watch })
    setIsModalOpen(true)
  }

  const handleDeleteClick = (watch: Watch) => {
    setWatchToDelete(watch)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!watchToDelete) return
    
    try {
      setIsSaving(true)
      const res = await fetchWithAuth(api.admin.watch(watchToDelete.Brand, watchToDelete.Model), {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete watch')
      setWatches(watches.filter(w => !(w.Brand === watchToDelete.Brand && w.Model === watchToDelete.Model)))
      setIsDeleteModalOpen(false)
      setWatchToDelete(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleEnabled = async (watch: Watch) => {
    try {
      const res = await fetchWithAuth(api.admin.watch(watch.Brand, watch.Model), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Enabled: !watch.Enabled }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setWatches(watches.map(w => 
        w.Brand === watch.Brand && w.Model === watch.Model 
          ? { ...w, Enabled: !w.Enabled } 
          : w
      ))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  const handleToggleFavourite = async (watch: Watch) => {
    try {
      const res = await fetchWithAuth(api.admin.watch(watch.Brand, watch.Model), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Is_Favourite: !watch.Is_Favourite }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setWatches(watches.map(w => 
        w.Brand === watch.Brand && w.Model === watch.Model 
          ? { ...w, Is_Favourite: !w.Is_Favourite } 
          : w
      ))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  const handleSaveWatch = async () => {
    if (!editingWatch?.Brand || !editingWatch?.Model) return
    
    const isNew = !watches.some(
      w => w.Brand === editingWatch.Brand && w.Model === editingWatch.Model
    )
    
    try {
      setIsSaving(true)
      
      if (isNew) {
        // Create new
        const res = await fetchWithAuth(api.admin.watches, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingWatch),
        })
        if (!res.ok) throw new Error('Failed to create watch')
        setWatches([...watches, editingWatch as Watch])
      } else {
        // Update existing
        const res = await fetchWithAuth(api.admin.watch(editingWatch.Brand, editingWatch.Model), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingWatch),
        })
        if (!res.ok) throw new Error('Failed to update watch')
        setWatches(watches.map(w => 
          w.Brand === editingWatch.Brand && w.Model === editingWatch.Model 
            ? editingWatch as Watch 
            : w
        ))
      }
      
      setIsModalOpen(false)
      setEditingWatch(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const isNewWatch = editingWatch && !watches.some(
    w => w.Brand === editingWatch.Brand && w.Model === editingWatch.Model
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Watches</h1>
          <p className="text-base-content/60 mt-1">Manage your watch collection</p>
        </div>
        <button className="btn btn-primary gap-2" onClick={handleAddWatch}>
          <Plus className="w-5 h-5" />
          Add Watch
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left side - Watches Table (2/3) */}
        <div className="lg:w-2/3">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body p-0">
              <div className="overflow-x-auto">
                <table className="table">
              <thead>
                <tr className="bg-base-200">
                  <th>Brand</th>
                  <th>Model</th>
                  <th className="text-center">Favourite</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="flex flex-col items-center justify-center py-12 text-base-content/60">
                        <Loader2 className="w-12 h-12 mb-4 animate-spin opacity-50" />
                        <p className="font-medium">Loading watches...</p>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="flex flex-col items-center justify-center py-12 text-error">
                        <p className="font-medium">Error loading watches</p>
                        <p className="text-sm">{error}</p>
                        <button className="btn btn-sm btn-ghost mt-2" onClick={fetchWatches}>Retry</button>
                      </div>
                    </td>
                  </tr>
                ) : watches.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="flex flex-col items-center justify-center py-12 text-base-content/60">
                        <Clock className="w-12 h-12 mb-4 opacity-50" />
                        <p className="font-medium">No watches yet</p>
                        <p className="text-sm">Add your first watch to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  watches.map((watch) => (
                    <tr key={`${watch.Brand}-${watch.Model}`} className={!(watch.Enabled ?? false) ? 'opacity-50' : ''}>
                      <td className="font-medium">{watch.Brand}</td>
                      <td>{watch.Model}</td>
                      <td className="text-center">
                        <button 
                          className={`btn btn-ghost btn-sm btn-square border-0 ${watch.Is_Favourite ? 'text-warning' : 'text-base-content/30'}`}
                          onClick={() => handleToggleFavourite(watch)}
                        >
                          <Star className={`w-5 h-5 ${watch.Is_Favourite ? 'fill-current' : ''}`} />
                        </button>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          {/* Processing spinner - shows when watch has pending files */}
                          {processingStatus[`${watch.Brand}/${watch.Model}`]?.length > 0 && (
                            <span 
                              className="w-8 h-8 flex items-center justify-center text-info tooltip tooltip-left before:whitespace-pre-line before:text-left" 
                              data-tip={processingStatus[`${watch.Brand}/${watch.Model}`].map(f => `• ${f}`).join('\n')}
                            >
                              <Loader2 className="w-4 h-4 animate-spin" />
                            </span>
                          )}
                          <button 
                            className={`btn btn-ghost btn-sm btn-square border-0 ${(watch.Enabled ?? false) ? 'text-success' : 'text-base-content/30'}`}
                            onClick={() => handleToggleEnabled(watch)}
                            title={(watch.Enabled ?? false) ? 'Enabled - click to disable' : 'Disabled - click to enable'}
                          >
                            {(watch.Enabled ?? false) ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm btn-square border-0"
                            onClick={() => {
                              setImageModalWatch(watch)
                              setIsImageModalOpen(true)
                            }}
                            title="Manage images"
                          >
                            <Image className="w-4 h-4" />
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm btn-square border-0"
                            onClick={() => handleEditWatch(watch)}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm btn-square border-0 text-error"
                            onClick={() => handleDeleteClick(watch)}
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

        {/* Right side - Display Config (1/3) */}
        <div className="lg:w-1/3">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5" />
                <h2 className="card-title text-lg">Field Visibility</h2>
              </div>
              <p className="text-sm text-base-content/60 mb-4">
                Control which fields are shown on the public site
              </p>
              
              {displayConfigLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {DISPLAY_FIELDS.map(({ key, label }) => (
                    <label key={key} className="flex items-center justify-between cursor-pointer py-1">
                      <span className="text-sm">{label}</span>
                      <input 
                        type="checkbox" 
                        className="toggle toggle-sm toggle-primary" 
                        checked={displayConfig[key] ?? false}
                        onChange={() => handleToggleDisplayField(key)}
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <dialog className={`modal ${isModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">
              {isNewWatch ? 'Add Watch' : 'Edit Watch'}
            </h3>
            <button 
              className="btn btn-ghost btn-sm btn-square"
              onClick={() => { setIsModalOpen(false); setEditingWatch(null) }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {editingWatch && (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left column - Details */}
              <div className="lg:w-2/3 space-y-4">
                <h4 className="font-medium text-sm text-base-content/60 uppercase tracking-wide">Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label"><span className="label-text">Brand *</span></label>
                    <input 
                      type="text" 
                      className="input input-bordered" 
                      value={editingWatch.Brand || ''}
                      onChange={(e) => setEditingWatch({ ...editingWatch, Brand: e.target.value })}
                      disabled={!isNewWatch}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Model *</span></label>
                    <input 
                      type="text" 
                      className="input input-bordered" 
                      value={editingWatch.Model || ''}
                      onChange={(e) => setEditingWatch({ ...editingWatch, Model: e.target.value })}
                      disabled={!isNewWatch}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Dial Colour</span></label>
                    <input 
                      type="text" 
                      className="input input-bordered" 
                      value={editingWatch.Dial_Colour || ''}
                      onChange={(e) => setEditingWatch({ ...editingWatch, Dial_Colour: e.target.value })}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Case Width (mm)</span></label>
                    <input 
                      type="number" 
                      className="input input-bordered" 
                      value={editingWatch.Case_Width || ''}
                      onChange={(e) => setEditingWatch({ ...editingWatch, Case_Width: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Movement Type</span></label>
                    <select 
                      className="select select-bordered"
                      value={editingWatch.Movement_Type || ''}
                      onChange={(e) => setEditingWatch({ ...editingWatch, Movement_Type: e.target.value })}
                    >
                      <option value="">Select...</option>
                      <option value="Automatic">Automatic</option>
                      <option value="Manual">Manual</option>
                      <option value="Quartz">Quartz</option>
                      <option value="Solar">Solar</option>
                      <option value="Spring Drive">Spring Drive</option>
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Movement Name</span></label>
                    <input 
                      type="text" 
                      className="input input-bordered" 
                      value={editingWatch.Movement_Name || ''}
                      onChange={(e) => setEditingWatch({ ...editingWatch, Movement_Name: e.target.value })}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Manufactured Year</span></label>
                    <input 
                      type="text" 
                      className="input input-bordered" 
                      value={editingWatch.Manufactured_Year || ''}
                      onChange={(e) => setEditingWatch({ ...editingWatch, Manufactured_Year: e.target.value })}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Obtained Date</span></label>
                    <input 
                      type="date" 
                      className="input input-bordered" 
                      value={editingWatch.Obtained_Date || ''}
                      onChange={(e) => setEditingWatch({ ...editingWatch, Obtained_Date: e.target.value })}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Glass</span></label>
                    <select 
                      className="select select-bordered"
                      value={editingWatch.Glass || ''}
                      onChange={(e) => setEditingWatch({ ...editingWatch, Glass: e.target.value })}
                    >
                      <option value="">Select...</option>
                      <option value="Sapphire">Sapphire</option>
                      <option value="Mineral">Mineral</option>
                      <option value="Hardlex">Hardlex</option>
                      <option value="Acrylic">Acrylic</option>
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Case Material</span></label>
                    <input 
                      type="text" 
                      className="input input-bordered" 
                      value={editingWatch.Case_Material || ''}
                      onChange={(e) => setEditingWatch({ ...editingWatch, Case_Material: e.target.value })}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Lug Width (mm)</span></label>
                    <input 
                      type="number" 
                      className="input input-bordered" 
                      value={editingWatch.Lug_Width || ''}
                      onChange={(e) => setEditingWatch({ ...editingWatch, Lug_Width: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Beats Per Hour</span></label>
                    <select 
                      className="select select-bordered"
                      value={editingWatch.Beats_Per_Hour || ''}
                      onChange={(e) => setEditingWatch({ ...editingWatch, Beats_Per_Hour: e.target.value ? Number(e.target.value) : undefined })}
                    >
                      <option value="">Select...</option>
                      <option value="18000">18,000 (2.5Hz)</option>
                      <option value="19800">19,800 (2.75Hz)</option>
                      <option value="21600">21,600 (3Hz)</option>
                      <option value="25200">25,200 (3.5Hz)</option>
                      <option value="28800">28,800 (4Hz)</option>
                      <option value="36000">36,000 (5Hz)</option>
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Acquired From</span></label>
                    <input 
                      type="text" 
                      className="input input-bordered" 
                      value={editingWatch.Acquired_From || ''}
                      onChange={(e) => setEditingWatch({ ...editingWatch, Acquired_From: e.target.value })}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Acquired Condition</span></label>
                    <select 
                      className="select select-bordered"
                      value={editingWatch.Acquired_Condition || ''}
                      onChange={(e) => setEditingWatch({ ...editingWatch, Acquired_Condition: e.target.value })}
                    >
                      <option value="">Select...</option>
                      <option value="New">New</option>
                      <option value="Like New">Like New</option>
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Purchase Price</span></label>
                    <input 
                      type="text" 
                      className="input input-bordered" 
                      value={editingWatch.Purchase_Price || ''}
                      onChange={(e) => setEditingWatch({ ...editingWatch, Purchase_Price: e.target.value })}
                    />
                  </div>
                  <div className="form-control justify-end">
                    <label className="label cursor-pointer justify-start gap-3 h-12">
                      <input 
                        type="checkbox" 
                        className="checkbox" 
                        checked={editingWatch.Caseback_Window ?? false}
                        onChange={(e) => setEditingWatch({ ...editingWatch, Caseback_Window: e.target.checked })}
                      />
                      <span className="label-text">Caseback Window</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right column - Description & Settings */}
              <div className="lg:w-1/3 space-y-2">
                <h4 className="font-medium text-sm text-base-content/60 uppercase tracking-wide">Description</h4>
                <div className="form-control">
                  <textarea 
                    className="textarea textarea-bordered h-40" 
                    placeholder="Notes about this watch..."
                    value={editingWatch.Description || ''}
                    onChange={(e) => setEditingWatch({ ...editingWatch, Description: e.target.value })}
                  />
                </div>

                <h4 className="font-medium text-sm text-base-content/60 uppercase tracking-wide pt-2">Settings</h4>
                <div className="space-y-1">
                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-3 py-1">
                      <input 
                        type="checkbox" 
                        className="toggle toggle-success toggle-sm" 
                        checked={editingWatch.Enabled ?? true}
                        onChange={(e) => setEditingWatch({ ...editingWatch, Enabled: e.target.checked })}
                      />
                      <div className="flex items-center gap-2">
                        {(editingWatch.Enabled ?? true) ? <Eye className="w-4 h-4 text-success" /> : <EyeOff className="w-4 h-4 text-base-content/30" />}
                        <div>
                          <span className="label-text">Visible</span>
                          <p className="text-xs text-base-content/50">Show on public site</p>
                        </div>
                      </div>
                    </label>
                  </div>
                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-3 py-1">
                      <input 
                        type="checkbox" 
                        className="toggle toggle-warning toggle-sm" 
                        checked={editingWatch.Is_Favourite ?? false}
                        onChange={(e) => setEditingWatch({ ...editingWatch, Is_Favourite: e.target.checked })}
                      />
                      <div className="flex items-center gap-2">
                        <Star className={`w-4 h-4 ${(editingWatch.Is_Favourite ?? false) ? 'text-warning fill-current' : 'text-base-content/30'}`} />
                        <div>
                          <span className="label-text">Favourite</span>
                          <p className="text-xs text-base-content/50">Highlight in collection</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="modal-action">
            <button 
              className="btn btn-ghost"
              onClick={() => { setIsModalOpen(false); setEditingWatch(null) }}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleSaveWatch}
              disabled={!editingWatch?.Brand || !editingWatch?.Model || isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isNewWatch ? 'Add' : 'Save'}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => { setIsModalOpen(false); setEditingWatch(null) }}>close</button>
        </form>
      </dialog>

      {/* Delete Confirmation Modal */}
      <dialog className={`modal ${isDeleteModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg">Delete Watch</h3>
          <p className="py-4">
            Are you sure you want to delete <strong>{watchToDelete?.Brand} {watchToDelete?.Model}</strong>? 
            This action cannot be undone.
          </p>
          <div className="modal-action">
            <button 
              className="btn btn-ghost"
              onClick={() => { setIsDeleteModalOpen(false); setWatchToDelete(null) }}
            >
              Cancel
            </button>
            <button 
              className="btn btn-error"
              onClick={handleDeleteConfirm}
            >
              Delete
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => { setIsDeleteModalOpen(false); setWatchToDelete(null) }}>close</button>
        </form>
      </dialog>

      {/* Image Management Modal */}
      {imageModalWatch && (
        <ImageManagementModal
          isOpen={isImageModalOpen}
          onClose={() => {
            setIsImageModalOpen(false)
            setImageModalWatch(null)
          }}
          brand={imageModalWatch.Brand}
          model={imageModalWatch.Model}
          onStatusChange={(pendingFiles) => {
            const key = `${imageModalWatch.Brand}/${imageModalWatch.Model}`
            setProcessingStatus(prev => {
              if (pendingFiles.length === 0) {
                const newStatus = { ...prev }
                delete newStatus[key]
                return newStatus
              }
              return { ...prev, [key]: pendingFiles }
            })
          }}
        />
      )}
    </div>
  )
}
