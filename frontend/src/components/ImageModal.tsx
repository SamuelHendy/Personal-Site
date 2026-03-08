import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import exifr from 'exifr'

interface ExifData {
  ISO?: number
  ExposureTime?: number
  FNumber?: number
  FocalLength?: number
  LensModel?: string
  Model?: string
  Make?: string
  DateTimeOriginal?: Date
}

interface ImageModalProps {
  imageUrl: string
  onClose: () => void
  thumbnailRect?: DOMRect
  // Optional: for gallery navigation
  images?: string[]
  currentIndex?: number
  onNavigate?: (index: number) => void
}

export default function ImageModal({ imageUrl, onClose, thumbnailRect, images, currentIndex, onNavigate }: ImageModalProps) {
  const [exifData, setExifData] = useState<ExifData | null>(null)
  const [exifError, setExifError] = useState<boolean>(false)
  const [exifDismissed, setExifDismissed] = useState<boolean>(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Navigation helpers
  const canNavigate = images && images.length > 1 && onNavigate && currentIndex !== undefined
  const canGoPrev = canNavigate && currentIndex > 0
  const canGoNext = canNavigate && currentIndex < images.length - 1

  const goToPrev = useCallback(() => {
    if (canGoPrev && onNavigate) {
      onNavigate(currentIndex - 1)
    }
  }, [canGoPrev, currentIndex, onNavigate])

  const goToNext = useCallback(() => {
    if (canGoNext && onNavigate) {
      onNavigate(currentIndex + 1)
    }
  }, [canGoNext, currentIndex, onNavigate])

  useEffect(() => {
    // Prevent scrolling when modal is open
    document.body.style.overflow = 'hidden'
    
    // Re-enable scrolling when modal closes
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  useEffect(() => {
    // Extract EXIF data from image, with fallback to JSON sidecar
    const loadExif = async () => {
      // First try to get EXIF from the image itself
      try {
        const data = await exifr.parse(imageUrl)
        if (data && Object.keys(data).length > 0) {
          setExifData(data)
          setExifError(false)
          return
        }
      } catch {
        // exifr failed (common for WebP), continue to JSON fallback
      }
      
      // Fallback: try to fetch JSON sidecar
      try {
        const jsonUrl = imageUrl.replace(/\.[^.]+$/, '_exif.json')
        const response = await fetch(jsonUrl)
        if (response.ok) {
          const jsonData = await response.json()
          // Convert EXIF date string format "YYYY:MM:DD HH:MM:SS" to Date
          if (jsonData.DateTimeOriginal && typeof jsonData.DateTimeOriginal === 'string') {
            const dateStr = jsonData.DateTimeOriginal.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')
            jsonData.DateTimeOriginal = new Date(dateStr)
          }
          // Map ISOSpeedRatings to ISO for consistency
          if (jsonData.ISOSpeedRatings && !jsonData.ISO) {
            jsonData.ISO = jsonData.ISOSpeedRatings
          }
          setExifData(jsonData)
          setExifError(false)
        } else {
          // No EXIF data available
          setExifData(null)
          setExifError(false)
        }
      } catch (error) {
        console.log('Error fetching EXIF sidecar:', error)
        setExifData(null)
        setExifError(true)
      }
    }
    loadExif()
  }, [imageUrl])

  useEffect(() => {
    // Handle keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        goToPrev()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, goToPrev, goToNext])

  // Swipe gesture handling
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe) {
      goToNext()
    } else if (isRightSwipe) {
      goToPrev()
    }
  }

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      onClick={onClose}
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

      {/* Navigation buttons - hidden on mobile (swipe instead) */}
      {canGoPrev && (
        <motion.button
          onClick={(e) => { e.stopPropagation(); goToPrev(); }}
          className="rough-border absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 hidden md:flex items-center justify-center border border-[var(--color-text-primary)] bg-black/60 backdrop-blur-sm hover:bg-[var(--color-text-primary)] hover:text-[var(--color-background)] transition-colors text-white"
          aria-label="Previous image"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ delay: 0.1 }}
        >
          <ChevronLeft size={24} />
        </motion.button>
      )}
      {canGoNext && (
        <motion.button
          onClick={(e) => { e.stopPropagation(); goToNext(); }}
          className="rough-border absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 hidden md:flex items-center justify-center border border-[var(--color-text-primary)] bg-black/60 backdrop-blur-sm hover:bg-[var(--color-text-primary)] hover:text-[var(--color-background)] transition-colors text-white"
          aria-label="Next image"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ delay: 0.1 }}
        >
          <ChevronRight size={24} />
        </motion.button>
      )}

      {/* Image counter */}
      {canNavigate && (
        <motion.div
          className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/50 text-white text-sm rounded-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {currentIndex + 1} / {images.length}
        </motion.div>
      )}

      {/* Image container */}
      <motion.div 
        className="relative max-w-full max-h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        initial={thumbnailRect ? {
          x: thumbnailRect.left + thumbnailRect.width / 2 - window.innerWidth / 2,
          y: thumbnailRect.top + thumbnailRect.height / 2 - window.innerHeight / 2,
          scale: Math.min(thumbnailRect.width / 800, thumbnailRect.height / 800),
        } : { scale: 0.8 }}
        animate={{ x: 0, y: 0, scale: 1 }}
        exit={thumbnailRect ? {
          x: thumbnailRect.left + thumbnailRect.width / 2 - window.innerWidth / 2,
          y: thumbnailRect.top + thumbnailRect.height / 2 - window.innerHeight / 2,
          scale: Math.min(thumbnailRect.width / 800, thumbnailRect.height / 800),
        } : { scale: 0.8 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <img
          src={imageUrl}
          alt="Full size"
          className="max-w-full max-h-[90vh] w-auto h-auto object-contain border-[12px] border-white"
        />
      </motion.div>

      {/* EXIF Data Display */}
      {exifError && !exifDismissed && (
        <motion.div
          className="absolute bottom-8 right-8 text-white text-sm space-y-1 text-left bg-black/60 backdrop-blur-sm px-4 py-3 rounded"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setExifDismissed(true); }}
            className="absolute top-1 right-1 text-white/60 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
          <div className="text-gray-300 italic">Unable to load image details</div>
        </motion.div>
      )}
      {exifData && !exifError && !exifDismissed && (
        <motion.div
          className="absolute bottom-8 right-8 text-white text-sm space-y-1 text-left bg-black/60 backdrop-blur-sm px-4 py-3 rounded"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setExifDismissed(true); }}
            className="absolute top-1 right-1 text-white/60 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
          {exifData.DateTimeOriginal && (
            <div className="font-semibold mb-2">
              {new Date(exifData.DateTimeOriginal).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          )}
          {exifData.Make && exifData.Model && (
            <div className="font-semibold">{exifData.Make} {exifData.Model}</div>
          )}
          {exifData.LensModel && (
            <div>{exifData.LensModel}</div>
          )}
          {exifData.FocalLength && (
            <div>{exifData.FocalLength}mm</div>
          )}
          {exifData.FNumber && (
            <div>f/{exifData.FNumber}</div>
          )}
          {exifData.ExposureTime && (
            <div>{exifData.ExposureTime < 1 ? `1/${Math.round(1/exifData.ExposureTime)}s` : `${exifData.ExposureTime}s`}</div>
          )}
          {exifData.ISO && (
            <div>ISO {exifData.ISO}</div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
