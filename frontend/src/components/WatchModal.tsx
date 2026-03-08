import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import type { DisplayConfig } from '../contexts/DisplayConfigContext'
import { cdn, api } from '../config/api'

interface Watch {
  Brand: string
  Model: string
  Dial_Colour: string
  Case_Width: number
  Movement_Type: string
  Movement_Name?: string
  Manufactured_Year: string
  Obtained_Date: string
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
  Thumbnail?: string | null
  Images?: string[]
}

interface WatchModalProps {
  watch: Watch
  onClose: () => void
  thumbnailRect?: DOMRect
  displayConfig: DisplayConfig
}

// Helper to check if a field should be shown (defaults to false)
const show = (config: DisplayConfig, field: keyof DisplayConfig): boolean => config[field] ?? false

export default function WatchModal({ watch, onClose, thumbnailRect, displayConfig }: WatchModalProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [images, setImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageLoadError, setImageLoadError] = useState(false)
  
  const placeholderUrl = `https://placehold.co/900x1200/e5e5e5/525252?text=${encodeURIComponent(watch.Brand)}`

  // Prevent page scrolling when modal is open, but allow content scrolling
  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    // Intercept wheel events - allow scrolling only inside content div
    const handleWheel = (e: WheelEvent) => {
      if (contentRef.current?.contains(e.target as Node)) {
        // Allow scrolling inside content - don't prevent default
        e.stopPropagation()
      } else {
        // Block scrolling outside content
        e.preventDefault()
        e.stopPropagation()
      }
    }

    // Use capture phase to intercept before Watches page handler
    window.addEventListener('wheel', handleWheel, { capture: true, passive: false })

    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
      window.removeEventListener('wheel', handleWheel, { capture: true })
    }
  }, [])

  useEffect(() => {
    // Close modal on Escape key press
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Fetch full watch details including hero image
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch(api.watchDetail(watch.Brand, watch.Model))
        if (res.ok) {
          const data = await res.json()
          // Priority: Hero image > Other images > Thumbnail
          const imageList: string[] = []
          
          // Add hero image first if available (high-res for expanded view)
          if (data.Hero) {
            imageList.push(cdn.watches(data.Hero))
          }
          
          // Add other images
          if (data.Images && data.Images.length > 0) {
            imageList.push(...data.Images.map((img: string) => cdn.watches(img)))
          }
          
          // Fallback to thumbnail if no other images
          if (imageList.length === 0 && watch.Thumbnail) {
            imageList.push(cdn.watches(watch.Thumbnail))
          }
          
          setImages(imageList)
        }
      } catch {
        // If fetch fails, try thumbnail
        if (watch.Thumbnail) {
          setImages([cdn.watches(watch.Thumbnail)])
        }
      }
    }
    fetchImages()
  }, [watch.Brand, watch.Model, watch.Thumbnail])

  const goToNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const goToPreviousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  // Current image URL with fallback to placeholder
  const currentImageUrl = images.length > 0 && !imageLoadError 
    ? images[currentImageIndex] 
    : placeholderUrl

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
      onWheel={(e) => e.preventDefault()}
      onTouchMove={(e) => e.preventDefault()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop with blur */}
      <motion.div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      
      {/* Close button */}
      <motion.button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-12 h-12 flex items-center justify-center bg-[var(--color-background)] border border-[var(--color-text-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-text-primary)] hover:text-[var(--color-background)] transition-colors rough-border"
        aria-label="Close"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ delay: 0.1 }}
      >
        <X size={24} />
      </motion.button>

      {/* Container for both boxes */}
      <div className="relative w-full h-full flex items-center justify-center gap-8 px-8">
        {/* Left box - Image with white border */}
        <motion.div 
          className="relative flex items-center justify-center"
          style={{ maxWidth: '600px', maxHeight: '80vh' }}
          onClick={(e) => e.stopPropagation()}
          initial={thumbnailRect ? {
            x: thumbnailRect.left + thumbnailRect.width / 2 - window.innerWidth * 0.25,
            y: thumbnailRect.top + thumbnailRect.height / 2 - window.innerHeight / 2,
            scale: Math.min(thumbnailRect.width / 800, thumbnailRect.height / 800),
          } : { scale: 0.9, opacity: 0 }}
          animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          exit={thumbnailRect ? {
            x: thumbnailRect.left + thumbnailRect.width / 2 - window.innerWidth * 0.25,
            y: thumbnailRect.top + thumbnailRect.height / 2 - window.innerHeight / 2,
            scale: Math.min(thumbnailRect.width / 800, thumbnailRect.height / 800),
          } : { scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <img
            src={currentImageUrl}
            alt={`${watch.Brand} ${watch.Model}`}
            className="max-w-full max-h-full w-auto h-auto object-contain border-[12px] border-white"
            onError={() => setImageLoadError(true)}
          />
          
          {/* Navigation arrows - only show if multiple images */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPreviousImage}
                className="rough-border absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-12 border border-[var(--color-text-primary)] bg-black/60 backdrop-blur-sm hover:bg-[var(--color-text-primary)] hover:text-[var(--color-background)] transition-colors flex items-center justify-center text-white z-20"
                aria-label="Previous image"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={goToNextImage}
                className="rough-border absolute -right-6 top-1/2 -translate-y-1/2 w-12 h-12 border border-[var(--color-text-primary)] bg-black/60 backdrop-blur-sm hover:bg-[var(--color-text-primary)] hover:text-[var(--color-background)] transition-colors flex items-center justify-center text-white z-20"
                aria-label="Next image"
              >
                <ChevronRight size={24} />
              </button>

              {/* Dot indicators */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentImageIndex 
                        ? 'bg-white w-6' 
                        : 'bg-white/50 w-2'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </motion.div>

        {/* Right box - Content */}
        <motion.div 
          className="relative overflow-hidden"
          style={{ width: '600px', maxWidth: '600px', maxHeight: '80vh' }}
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300, delay: 0.1 }}
        >
          {/* Rough border div - sibling approach */}
          <div className="rough-border absolute inset-0 border border-[var(--color-text-primary)] bg-[var(--color-background)] pointer-events-none" />
          
          {/* Content div */}
          <div ref={contentRef} className="relative p-8 pb-12 overflow-y-auto max-h-[80vh] overscroll-contain text-rough">
            {/* Favourite star icon */}
            {watch.Is_Favourite && (
              <div className="absolute top-4 right-4">
                <Star size={24} fill="currentColor" className="text-yellow-500" />
              </div>
            )}
            
            <div className="text-[var(--color-text-primary)] space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-3xl font-bold mb-2">{watch.Brand}</h2>
              <p className="text-xl text-[var(--color-text-secondary)]">{watch.Model}</p>
            </div>

            {/* Description */}
            {show(displayConfig, 'Description') && watch.Description && (
              <div>
                <h3 className="text-sm font-bold uppercase text-[var(--color-text-secondary)] mb-2">Description</h3>
                <p className="text-[var(--color-text-primary)]">{watch.Description}</p>
              </div>
            )}

            {/* Specifications */}
            <div>
              <h3 className="text-sm font-bold uppercase text-[var(--color-text-secondary)] mb-3">Specifications</h3>
              <div className="space-y-2 text-sm">
                {show(displayConfig, 'Movement_Type') && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Movement Type:</span>
                    <span className="font-semibold">{watch.Movement_Type}</span>
                  </div>
                )}
                {show(displayConfig, 'Movement_Name') && watch.Movement_Name && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">{watch.Movement_Type === 'Quartz' ? 'Module:' : 'Calibre:'}</span>
                    <span className="font-semibold">{watch.Movement_Name}</span>
                  </div>
                )}
                {show(displayConfig, 'Beats_Per_Hour') && watch.Beats_Per_Hour && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Frequency:</span>
                    <span className="font-semibold">{watch.Beats_Per_Hour.toLocaleString()} BPH ({(watch.Beats_Per_Hour / 3600).toFixed(1)} Hz)</span>
                  </div>
                )}
                {show(displayConfig, 'Case_Width') && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Case Width:</span>
                    <span className="font-semibold">{watch.Case_Width}mm</span>
                  </div>
                )}
                {show(displayConfig, 'Dial_Colour') && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Dial Colour:</span>
                    <span className="font-semibold">{watch.Dial_Colour}</span>
                  </div>
                )}
                {show(displayConfig, 'Manufactured_Year') && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Year:</span>
                    <span className="font-semibold">{watch.Manufactured_Year}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Acquisition Details */}
            <div>
              <h3 className="text-sm font-bold uppercase text-[var(--color-text-secondary)] mb-3">Acquisition</h3>
              <div className="space-y-2 text-sm">
                {show(displayConfig, 'Obtained_Date') && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Obtained:</span>
                    <span className="font-semibold">{watch.Obtained_Date}</span>
                  </div>
                )}
                {show(displayConfig, 'Acquired_From') && watch.Acquired_From && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">From:</span>
                    <span className="font-semibold">{watch.Acquired_From}</span>
                  </div>
                )}
                {show(displayConfig, 'Purchase_Price') && watch.Purchase_Price && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Price:</span>
                    <span className="font-semibold">£{watch.Purchase_Price}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
