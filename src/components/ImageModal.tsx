import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
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
}

export default function ImageModal({ imageUrl, onClose, thumbnailRect }: ImageModalProps) {
  const [exifData, setExifData] = useState<ExifData | null>(null)
  const [exifError, setExifError] = useState<boolean>(false)

  useEffect(() => {
    // Prevent scrolling when modal is open
    document.body.style.overflow = 'hidden'
    
    // Re-enable scrolling when modal closes
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  useEffect(() => {
    // Extract EXIF data from image
    const loadExif = async () => {
      try {
        const data = await exifr.parse(imageUrl)
        console.log('EXIF data:', data)
        if (data) {
          setExifData(data)
          setExifError(false)
        } else {
          // No EXIF data but no error - just don't show anything
          setExifData(null)
          setExifError(false)
        }
      } catch (error) {
        console.log('Error fetching EXIF data:', error)
        // Actual error (likely CORS) - show error message
        setExifData(null)
        setExifError(true)
      }
    }
    loadExif()
  }, [imageUrl])

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

      {/* Image container */}
      <motion.div 
        className="relative max-w-full max-h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
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
      {exifError && (
        <motion.div
          className="absolute bottom-8 right-8 text-white text-sm space-y-1 text-left bg-black/60 backdrop-blur-sm px-4 py-3 rounded"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-gray-300 italic">Unable to load EXIF data (CORS error)</div>
        </motion.div>
      )}
      {exifData && !exifError && (
        <motion.div
          className="absolute bottom-8 right-8 text-white text-sm space-y-1 text-left bg-black/60 backdrop-blur-sm px-4 py-3 rounded"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
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
