import { useState, useEffect, useCallback, useRef } from 'react'
import { X, Upload, Trash2, Image, List, Grid, Loader2 } from 'lucide-react'
import { api, fetchWithAuth } from '../config/api'

interface ImageManagementModalProps {
  isOpen: boolean
  onClose: () => void
  brand: string
  model: string
  onStatusChange?: (pendingFiles: string[]) => void
}

interface ImageFile {
  name: string
  key: string
}

export default function ImageManagementModal({ isOpen, onClose, brand, model, onStatusChange }: ImageManagementModalProps) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [pendingFiles, setPendingFiles] = useState<string[]>([])
  const [images, setImages] = useState<ImageFile[]>([])
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const onStatusChangeRef = useRef(onStatusChange)

  // Keep ref updated
  onStatusChangeRef.current = onStatusChange

  const path = `watches/${brand}/${model}`

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

  // Fetch existing images from watch detail API
  const fetchImages = useCallback(async () => {
    try {
      // Use the public watch detail API to get images
      const baseUrl = import.meta.env.VITE_API_URL || '/api'
      const res = await fetch(`${baseUrl}/watches/${encodeURIComponent(brand)}/${encodeURIComponent(model)}`)
      if (res.ok) {
        const data = await res.json()
        // Check for thumbnail
        if (data.Thumbnail) {
          setThumbnail(data.Thumbnail)
        }
        // Map images to our format
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
  }, [brand, model])

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
            // Processing complete - refresh images and stop polling
            await fetchImages()
            if (pollingRef.current) {
              clearInterval(pollingRef.current)
              pollingRef.current = null
            }
          }
        }, 5000) // Poll every 5 seconds
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
        // Get presigned URL
        const res = await fetchWithAuth(api.admin.imageUpload, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path,
            filename: file.name,
            contentType: file.type,
            isThumbnail
          })
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to get upload URL')
        }

        const { uploadUrl } = await res.json()

        // Upload directly to S3
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type }
        })

        if (!uploadRes.ok) {
          throw new Error('Failed to upload file')
        }
      }

      // Refresh status to show pending files
      await fetchStatus()

      // Start polling if not already
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

  // Handle drag and drop
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

  const processingCount = pendingFiles.length
  const thumbnailExists = thumbnail !== null
  
  // Tooltip content for pending files (bullet list format)
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
            <p className="text-sm text-base-content/60">{brand} {model}</p>
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

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-base-content/50" />
          </div>
        ) : (
          <>
            {/* Thumbnail Section */}
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
                {thumbnailExists ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-base-200 rounded flex items-center justify-center">
                        <Image className="w-8 h-8 text-base-content/30" />
                      </div>
                      <div>
                        <p className="font-medium">thumbnail.webp</p>
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

        {/* Additional Images Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm text-base-content/60 uppercase tracking-wide">Additional Images</h4>
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
                  No additional images
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
                                  <Image className="w-4 h-4 text-base-content/30 flex-shrink-0" />
                                  <span className="font-mono text-sm truncate">{image.name}</span>
                                </div>
                                <button className="btn btn-ghost btn-xs btn-square text-error flex-shrink-0">
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
            <div className="grid grid-cols-3 gap-2">
              {images.map((image, index) => (
                <div key={index} className="relative group aspect-square bg-base-200 rounded-lg flex items-center justify-center">
                  <Image className="w-8 h-8 text-base-content/30" />
                  <button className="absolute top-1 right-1 btn btn-xs btn-square btn-error opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <span className="absolute bottom-1 left-1 text-xs font-mono bg-black/50 text-white px-1 rounded">
                    {image.name}
                  </span>
                </div>
              ))}
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
