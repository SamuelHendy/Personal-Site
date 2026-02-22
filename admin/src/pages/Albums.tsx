import { useState, useEffect, useCallback } from 'react'
import { Plus, Image, Pencil, Trash2, X, Loader2, Eye, EyeOff } from 'lucide-react'
import { api, fetchWithAuth } from '../config/api'

interface Album {
  AlbumName: string
  DisplayName?: string | null
  Description?: string | null
  IsHidden?: boolean
  ImageCount?: number
  LastUpdated?: string
  Thumbnail?: string
}

const emptyAlbum: Partial<Album> = {
  AlbumName: '',
  DisplayName: '',
  Description: '',
  IsHidden: false,
}

export default function Albums() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAlbum, setEditingAlbum] = useState<Partial<Album> | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const fetchAlbums = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetchWithAuth(api.admin.albums)
      if (!res.ok) throw new Error('Failed to fetch albums')
      const data = await res.json()
      setAlbums(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAlbums()
  }, [fetchAlbums])

  const handleAddAlbum = () => {
    setEditingAlbum({ ...emptyAlbum })
    setIsModalOpen(true)
  }

  const handleEditAlbum = (album: Album) => {
    setEditingAlbum({ ...album })
    setIsModalOpen(true)
  }

  const handleDeleteClick = (album: Album) => {
    setAlbumToDelete(album)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!albumToDelete) return
    
    try {
      setIsSaving(true)
      const res = await fetchWithAuth(api.admin.album(albumToDelete.AlbumName), {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete album')
      setAlbums(albums.filter(a => a.AlbumName !== albumToDelete.AlbumName))
      setIsDeleteModalOpen(false)
      setAlbumToDelete(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleHidden = async (album: Album) => {
    try {
      const res = await fetchWithAuth(api.admin.album(album.AlbumName), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ IsHidden: !album.IsHidden }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setAlbums(albums.map(a => 
        a.AlbumName === album.AlbumName 
          ? { ...a, IsHidden: !a.IsHidden } 
          : a
      ))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  const handleSaveAlbum = async () => {
    if (!editingAlbum?.AlbumName) return
    
    const isNew = !albums.some(a => a.AlbumName === editingAlbum.AlbumName)
    
    try {
      setIsSaving(true)
      
      if (isNew) {
        // Create new
        const res = await fetchWithAuth(api.admin.albums, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingAlbum),
        })
        if (!res.ok) throw new Error('Failed to create album')
        setAlbums([...albums, editingAlbum as Album])
      } else {
        // Update existing
        const res = await fetchWithAuth(api.admin.album(editingAlbum.AlbumName), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingAlbum),
        })
        if (!res.ok) throw new Error('Failed to update album')
        setAlbums(albums.map(a => 
          a.AlbumName === editingAlbum.AlbumName 
            ? editingAlbum as Album 
            : a
        ))
      }
      
      setIsModalOpen(false)
      setEditingAlbum(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const isNewAlbum = editingAlbum && !albums.some(a => a.AlbumName === editingAlbum.AlbumName)

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Albums</h1>
          <p className="text-base-content/60 mt-1">Manage photo albums</p>
        </div>
        <button className="btn btn-primary gap-2" onClick={handleAddAlbum}>
          <Plus className="w-5 h-5" />
          Add Album
        </button>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="bg-base-200">
                  <th>Album Name</th>
                  <th>Display Name</th>
                  <th className="text-center">Images</th>
                  <th className="text-center">Last Updated</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex flex-col items-center justify-center py-12 text-base-content/60">
                        <Loader2 className="w-12 h-12 mb-4 animate-spin opacity-50" />
                        <p className="font-medium">Loading albums...</p>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex flex-col items-center justify-center py-12 text-error">
                        <p className="font-medium">Error loading albums</p>
                        <p className="text-sm">{error}</p>
                        <button className="btn btn-sm btn-ghost mt-2" onClick={fetchAlbums}>Retry</button>
                      </div>
                    </td>
                  </tr>
                ) : albums.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex flex-col items-center justify-center py-12 text-base-content/60">
                        <Image className="w-12 h-12 mb-4 opacity-50" />
                        <p className="font-medium">No albums yet</p>
                        <p className="text-sm">Create your first album to organize photos</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  albums.map((album) => (
                    <tr key={album.AlbumName} className={album.IsHidden ? 'opacity-50' : ''}>
                      <td className="font-medium">{album.AlbumName}</td>
                      <td className="text-base-content/70">{album.DisplayName || '—'}</td>
                      <td className="text-center">{album.ImageCount ?? 0}</td>
                      <td className="text-center text-sm">{album.LastUpdated || '—'}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <button 
                            className={`btn btn-ghost btn-sm btn-square border-0 ${album.IsHidden ? 'text-base-content/30' : 'text-success'}`}
                            onClick={() => handleToggleHidden(album)}
                            title={album.IsHidden ? 'Hidden - click to show' : 'Visible - click to hide'}
                          >
                            {album.IsHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm btn-square border-0"
                            onClick={() => handleEditAlbum(album)}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm btn-square border-0 text-error"
                            onClick={() => handleDeleteClick(album)}
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

      {/* Add/Edit Modal */}
      <dialog className={`modal ${isModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">
              {isNewAlbum ? 'Add Album' : 'Edit Album'}
            </h3>
            <button 
              className="btn btn-ghost btn-sm btn-square"
              onClick={() => { setIsModalOpen(false); setEditingAlbum(null) }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {editingAlbum && (
            <div className="space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Album Name (folder name) *</span></label>
                <input 
                  type="text" 
                  className="input input-bordered" 
                  value={editingAlbum.AlbumName || ''}
                  onChange={(e) => setEditingAlbum({ ...editingAlbum, AlbumName: e.target.value })}
                  disabled={!isNewAlbum}
                  placeholder="e.g., Japan_2024"
                />
                {isNewAlbum && (
                  <label className="label">
                    <span className="label-text-alt text-base-content/60">This will be the S3 folder name. Use underscores instead of spaces.</span>
                  </label>
                )}
              </div>
              
              <div className="form-control">
                <label className="label"><span className="label-text">Display Name</span></label>
                <input 
                  type="text" 
                  className="input input-bordered" 
                  value={editingAlbum.DisplayName || ''}
                  onChange={(e) => setEditingAlbum({ ...editingAlbum, DisplayName: e.target.value || null })}
                  placeholder="e.g., Japan Trip 2024"
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60">Friendly name shown on the site. Leave empty to use album name.</span>
                </label>
              </div>
              
              <div className="form-control">
                <label className="label"><span className="label-text">Description</span></label>
                <textarea 
                  className="textarea textarea-bordered h-24" 
                  value={editingAlbum.Description || ''}
                  onChange={(e) => setEditingAlbum({ ...editingAlbum, Description: e.target.value || null })}
                  placeholder="Optional description for the album"
                />
              </div>
              
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input 
                    type="checkbox" 
                    className="toggle toggle-error" 
                    checked={editingAlbum.IsHidden ?? false}
                    onChange={(e) => setEditingAlbum({ ...editingAlbum, IsHidden: e.target.checked })}
                  />
                  <span className="label-text">Hidden from public site</span>
                </label>
              </div>

              {!isNewAlbum && (
                <div className="bg-base-200 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-sm">Album Info</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-base-content/60">Images:</span>
                      <span className="ml-2 font-medium">{editingAlbum.ImageCount ?? 0}</span>
                    </div>
                    <div>
                      <span className="text-base-content/60">Last Updated:</span>
                      <span className="ml-2 font-medium">{editingAlbum.LastUpdated || '—'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-base-content/60">Thumbnail:</span>
                      <span className="ml-2 font-medium text-xs">{editingAlbum.Thumbnail || '—'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="modal-action">
            <button 
              className="btn btn-ghost"
              onClick={() => { setIsModalOpen(false); setEditingAlbum(null) }}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleSaveAlbum}
              disabled={isSaving || !editingAlbum?.AlbumName}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isNewAlbum ? 'Create Album' : 'Save Changes'}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => { setIsModalOpen(false); setEditingAlbum(null) }}>close</button>
        </form>
      </dialog>

      {/* Delete Confirmation Modal */}
      <dialog className={`modal ${isDeleteModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg">Delete Album</h3>
          <p className="py-4">
            Are you sure you want to delete <strong>{albumToDelete?.AlbumName}</strong>?
            <br />
            <span className="text-warning text-sm">This only removes the database record. S3 files will remain.</span>
          </p>
          <div className="modal-action">
            <button 
              className="btn btn-ghost"
              onClick={() => { setIsDeleteModalOpen(false); setAlbumToDelete(null) }}
            >
              Cancel
            </button>
            <button 
              className="btn btn-error"
              onClick={handleDeleteConfirm}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Delete
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => { setIsDeleteModalOpen(false); setAlbumToDelete(null) }}>close</button>
        </form>
      </dialog>
    </div>
  )
}
