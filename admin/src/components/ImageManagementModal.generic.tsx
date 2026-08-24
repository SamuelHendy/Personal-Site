import { useState, useEffect, useCallback, useRef } from 'react'
import { X, Upload, Trash2, List, Grid, Loader2 } from 'lucide-react'
import { api, cdn, fetchWithAuth } from '../config/api'
import { inferImageContentType, uploadApiError } from '../lib/imageUpload'

export type ContentType = 'watches' | 'albums' | 'fishtank'

interface ImageManagementModalProps {
  isOpen: boolean
  onClose: () => void
  contentType: ContentType
  // For watches: brand/model, for albums: albumName
  identifier: string
  displayName: string
  onStatusChange?: (pendingFiles: string[]) => void
}

interface ImageFile {
  name: string
  key: string
}

export default function ImageManagementModal({ 
  isOpen, 
  onClose, 
  contentType,
  identifier,
  displayName,
  onStatusChange 
}: ImageManagementModalProps) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [pendingFiles, setPendingFiles] = useState<string[]>([])
  const [images, setImages] = useState<ImageFile[]>([])
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [useLossless, setUseLossless] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const onStatusChangeRef = useRef(onStatusChange)

  // Keep ref updated
  onStatusChangeRef.current = onStatusChange

  // Path for uploads: watches/Brand/Model or albums/AlbumName
  const path = `${contentType}/${identifier}`

  // Fetch processing status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetchWithAuth(api.admin.imageStatus(path))
      if (res.ok) {
        const data = await res.json()
        const files = data.pendingFiles || []
        setPendingFiles(files)
        onStatusChangeRef.current?.(files)
        return files.length > 0
      }
    } catch (err) {
      console.error('Failed to fetch status:', err)
    }
    return false
  }, [path])

  // Fetch existing images from detail API
  // Both watches and albums now return { Thumbnail, Images } format
  // Fishtank uses S3 directly via the public API
  const fetchImages = useCallback(async () => {
    try {
      let url: string
      
      if (contentType === 'watches') {
        // Watches: identifier is "Brand/Model"
        const [brand, model] = identifier.split('/')
        url = api.watchDetail(brand, model)
      } else if (contentType === 'fishtank') {
        // Fishtank: identifier is "residents/type/id" or "timeline/id"
        // Fetch from public API and find the specific item
        const BASE_URL = import.meta.env.VITE_API_URL || '/api'
        const parts = identifier.split('/')
        
        if (parts[0] === 'residents' && parts.length === 3) {
          // residents/fish/neon-tetra -> fetch /fishtank/residents?type=fish
          const [, type, id] = parts
          const res = await fetch(`${BASE_URL}/fishtank/residents?type=${type}`)
          if (res.ok) {
            const data = await res.json()
            const item = data.find((r: { Id: string }) => r.Id === id)
            if (item) {
              setThumbnail(item.Thumbnail || null)
              setImages((item.Images || []).map((key: string) => ({
                name: key.split('/').pop() || key,
                key
              })))
              return
            }
          }
        } else if (parts[0] === 'timeline' && parts.length === 2) {
          // timeline/event-id -> fetch /fishtank/timeline
          const [, id] = parts
          const res = await fetch(`${BASE_URL}/fishtank/timeline`)
          if (res.ok) {
            const data = await res.json()
            const item = data.find((e: { Id: string }) => e.Id === id)
            if (item) {
              setThumbnail(item.Thumbnail || null)
              setImages((item.Images || []).map((key: string) => ({
                name: key.split('/').pop() || key,
                key
              })))
              return
            }
          }
        }
        
        // Fallback: no images found
        setThumbnail(null)
        setImages([])
        return
      } else {
        // Albums: identifier is album name, use include_thumbnail=true
        url = api.albumWithThumbnail(identifier)
      }
      
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        
        // All APIs return { Thumbnail, Images } or just Images array
        if (data.Thumbnail) {
          setThumbnail(data.Thumbnail)
        } else {
          setThumbnail(null)
        }
        
        if (data.Images && data.Images.length > 0) {
          setImages(data.Images.map((key: string) => ({
            name: key.split('/').pop() || key,
            key
          })))
        } else {
          setImages([])
        }
      }
    } catch (err) {
      console.error('Failed to fetch images:', err)
    }
  }, [contentType, identifier])

  // Initial load and polling setup
  useEffect(() => {
    if (!isOpen) return

    const init = async () => {
      setLoading(true)
      const [hasPending] = await Promise.all([fetchStatus(), fetchImages()])
      setLoading(false)

      // Start polling if there are pending files
      if (hasPending && !pollingRef.current) {
        pollingRef.current = setInterval(async () => {
          const stillPending = await fetchStatus()
          if (!stillPending) {
            await fetchImages()
            if (pollingRef.current) {
              clearInterval(pollingRef.current)
              pollingRef.current = null
            }
          }
        }, 5000)
      }
    }
    init()

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [isOpen, fetchStatus, fetchImages])

  // Handle file upload
  const handleUpload = async (files: FileList, isThumbnail: boolean) => {
    if (files.length === 0) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const contentType = inferImageContentType(file)
        const res = await fetchWithAuth(api.admin.imageUpload, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path,
            filename: file.name,
            contentType,
            isThumbnail,
            lossless: useLossless
          })
        })

        if (!res.ok) {
          throw await uploadApiError(res, 'Failed to get upload URL')
        }

        const { uploadUrl } = await res.json()

        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': contentType }
        })

        if (!uploadRes.ok) {
          throw new Error('Failed to upload file')
        }
      }

      await fetchStatus()

      if (!pollingRef.current) {
        pollingRef.current = setInterval(async () => {
          const stillPending = await fetchStatus()
          if (!stillPending) {
            await fetchImages()
            if (pollingRef.current) {
              clearInterval(pollingRef.current)
              pollingRef.current = null
            }
          }
        }, 3000)
      }
    } catch (err) {
      console.error('Upload failed:', err)
      alert(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent, isThumbnail: boolean) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      if (isThumbnail && files.length > 1) {
        alert('Only one thumbnail allowed')
        return
      }
      handleUpload(files, isThumbnail)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Handle image deletion
  const handleDelete = async (imageKey: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return
    
    try {
      // The key needs to include the content type prefix for the API
      const fullKey = `${contentType}/${imageKey}`
      
      const res = await fetchWithAuth(api.admin.imageDelete, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: fullKey })
      })
      
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete image')
      }
      
      // Remove from local state
      setImages(prev => prev.filter(img => img.key !== imageKey))
    } catch (err) {
      console.error('Delete failed:', err)
      alert(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const processingCount = pendingFiles.length
  const thumbnailExists = thumbnail !== null
  
  // Timeline doesn't need thumbnails - only main images
  const showThumbnailSection = !identifier.startsWith('timeline/')
  
  // Get CDN URL helper for this content type
  const getCdnUrl = (path: string) => {
    if (contentType === 'watches') return cdn.watches(path)
    if (contentType === 'fishtank') return cdn.fishtank(path)
    return cdn.albums(path)
  }
  
  const pendingFilesTooltip = pendingFiles.length > 0 
    ? pendingFiles.map(f => `• ${f}`).join('\n') 
    : 'No files processing'

  if (!isOpen) return null

  return (
    <dialog className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg">Manage Images</h3>
            <p className="text-sm text-base-content/60">{displayName}</p>
          </div>
          <button 
            className="btn btn-ghost btn-sm btn-square"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Processing Status Banner */}
        {processingCount > 0 && (
          <div className="alert alert-info mb-4 tooltip tooltip-bottom before:whitespace-pre-line before:text-left" data-tip={pendingFilesTooltip}>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing {processingCount} file{processingCount !== 1 ? 's' : ''}...</span>
          </div>
        )}

        {/* Lossless Toggle */}
        <div className="form-control mb-4">
          <label className="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              className="toggle toggle-primary toggle-sm"
              checked={useLossless}
              onChange={(e) => setUseLossless(e.target.checked)}
            />
            <span className="label-text">
              <span className="font-medium">Lossless compression</span>
              <span className="text-base-content/60 ml-2">(larger files, no quality loss)</span>
            </span>
          </label>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-base-content/50" />
          </div>
        ) : (
          <>
            {/* Thumbnail Section - not shown for timeline */}
            {showThumbnailSection && (
            <div className="mb-6">
              <h4 className="font-medium text-sm text-base-content/60 uppercase tracking-wide mb-2">Thumbnail</h4>
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && handleUpload(e.target.files, true)}
              />
              <div 
                className="border border-dashed border-base-300 rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
                onDrop={(e) => handleDrop(e, true)}
                onDragOver={handleDragOver}
                onClick={() => thumbnailInputRef.current?.click()}
              >
                {thumbnailExists && thumbnail ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        src={getCdnUrl(thumbnail)} 
                        alt="Thumbnail" 
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium">{thumbnail.split('/').pop()}</p>
                        <p className="text-sm text-base-content/60">Click or drop to replace</p>
                      </div>
                    </div>
                    {uploading && <Loader2 className="w-5 h-5 animate-spin" />}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-base-content/60">
                    {uploading ? (
                      <Loader2 className="w-8 h-8 mb-2 animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 mb-2" />
                    )}
                    <p className="font-medium">Drop thumbnail here</p>
                    <p className="text-sm">or click to browse</p>
                  </div>
                )}
              </div>
            </div>
            )}

            {/* Images Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm text-base-content/60 uppercase tracking-wide">
                  {contentType === 'albums' ? 'Album Images' : 'Additional Images'} ({images.length})
                </h4>
                <div className="flex items-center gap-2">
                  <div className="btn-group">
                    <button 
                      className={`btn btn-xs ${viewMode === 'list' ? 'btn-active' : ''}`}
                      onClick={() => setViewMode('list')}
                    >
                      <List className="w-3 h-3" />
                    </button>
                    <button 
                      className={`btn btn-xs ${viewMode === 'grid' ? 'btn-active' : ''}`}
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Images List/Grid */}
              {viewMode === 'list' ? (
                <div className="border border-base-300 rounded-lg max-h-64 overflow-y-auto">
                  {images.length === 0 ? (
                    <div className="p-4 text-center text-base-content/60">
                      No images yet
                    </div>
                  ) : (
                    <table className="table table-xs w-full">
                      <tbody>
                        {Array.from({ length: Math.ceil(images.length / 2) }, (_, rowIndex) => (
                          <tr key={rowIndex}>
                            {[0, 1].map((colIndex) => {
                              const imageIndex = rowIndex * 2 + colIndex
                              const image = images[imageIndex]
                              if (!image) return <td key={colIndex} className="border-l border-base-300 first:border-l-0"></td>
                              return (
                                <td key={colIndex} className="border-l border-base-300 first:border-l-0">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <img 
                                        src={getCdnUrl(image.key)} 
                                        alt={image.name}
                                        className="w-8 h-8 object-cover rounded flex-shrink-0"
                                      />
                                      <span className="font-mono text-sm truncate">{image.name}</span>
                                    </div>
                                    <button 
                                      className="btn btn-ghost btn-xs btn-square text-error flex-shrink-0"
                                      onClick={() => handleDelete(image.key)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                  {images.length === 0 ? (
                    <div className="col-span-4 p-4 text-center text-base-content/60">
                      No images yet
                    </div>
                  ) : (
                    images.map((image, index) => (
                      <div key={index} className="relative group aspect-square bg-base-200 rounded-lg overflow-hidden">
                        <img 
                          src={getCdnUrl(image.key)} 
                          alt={image.name}
                          className="w-full h-full object-cover"
                        />
                        <button 
                          className="absolute top-1 right-1 btn btn-xs btn-square btn-error opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDelete(image.key)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <span className="absolute bottom-1 left-1 right-1 text-xs font-mono bg-black/50 text-white px-1 rounded truncate">
                          {image.name}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Upload Zone */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleUpload(e.target.files, false)}
              />
              <div 
                className="mt-4 border border-dashed border-base-300 rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
                onDrop={(e) => handleDrop(e, false)}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center justify-center py-2 text-base-content/60">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 mb-1 animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6 mb-1" />
                  )}
                  <p className="text-sm font-medium">Drop images here to add</p>
                  <p className="text-xs">or click to browse</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  )
}
