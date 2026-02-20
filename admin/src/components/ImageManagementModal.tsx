import { useState } from 'react'
import { X, Upload, Trash2, Image, List, Grid, Loader2 } from 'lucide-react'

interface ImageManagementModalProps {
  isOpen: boolean
  onClose: () => void
  brand: string
  model: string
}

export default function ImageManagementModal({ isOpen, onClose, brand, model }: ImageManagementModalProps) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  
  // Hardcoded for now - will be replaced with real data
  const processingCount = 3
  const thumbnailExists = true
  const images = Array.from({ length: 15 }, (_, i) => ({
    name: `${i + 1}.webp`,
    url: '/placeholder'
  }))

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
          <div className="alert alert-info mb-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing {processingCount} file{processingCount !== 1 ? 's' : ''}...</span>
          </div>
        )}

        {/* Thumbnail Section */}
        <div className="mb-6">
          <h4 className="font-medium text-sm text-base-content/60 uppercase tracking-wide mb-2">Thumbnail</h4>
          <div className="border border-dashed border-base-300 rounded-lg p-4">
            {thumbnailExists ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-base-200 rounded flex items-center justify-center">
                    <Image className="w-8 h-8 text-base-content/30" />
                  </div>
                  <div>
                    <p className="font-medium">thumbnail.webp</p>
                    <p className="text-sm text-base-content/60">Current thumbnail</p>
                  </div>
                </div>
                <button className="btn btn-sm btn-outline">
                  <Upload className="w-4 h-4" />
                  Replace
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-base-content/60">
                <Upload className="w-8 h-8 mb-2" />
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
          <div className="mt-4 border border-dashed border-base-300 rounded-lg p-4">
            <div className="flex flex-col items-center justify-center py-2 text-base-content/60">
              <Upload className="w-6 h-6 mb-1" />
              <p className="text-sm font-medium">Drop images here to add</p>
              <p className="text-xs">or click to browse</p>
            </div>
          </div>
        </div>

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
