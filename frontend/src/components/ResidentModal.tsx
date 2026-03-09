import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import FadeImage from './FadeImage'

interface Resident {
  id: string
  name: string
  scientificName?: string
  images: string[]
  dateAdded: string
  dateRemoved?: string
  status: 'current' | 'past'
  notes?: string
}

interface ResidentModalProps {
  resident: Resident
  onClose: () => void
}

export default function ResidentModal({ resident, onClose }: ResidentModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  const placeholderUrl = `https://placehold.co/1200x800/e5e5e5/525252?text=${encodeURIComponent(resident.name)}`
  const images = resident.images.length > 0 ? resident.images : [placeholderUrl]

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    // Prevent scrolling when modal is open
    document.body.style.overflow = 'hidden'
    
    // Re-enable scrolling when modal closes
    return () => {
      window.removeEventListener('resize', checkMobile)
      document.body.style.overflow = 'unset'
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

  const goToNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const goToPreviousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center md:p-8"
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
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {isMobile ? (
          /* Mobile: Scroll carousel */
          <div className="relative w-full h-full">
            <div className="relative w-full h-full overflow-hidden">
              <motion.div
                className="flex h-full"
                drag="x"
                dragConstraints={{ 
                  left: -(images.length - 1) * window.innerWidth, 
                  right: 0 
                }}
                dragElastic={0.1}
                onDragEnd={(_, info) => {
                  const offset = info.offset.x
                  const velocity = info.velocity.x
                  const swipeThreshold = 50
                  
                  let newIndex = currentImageIndex
                  
                  if (Math.abs(velocity) > 500) {
                    newIndex = velocity > 0 
                      ? Math.max(0, currentImageIndex - 1)
                      : Math.min(images.length - 1, currentImageIndex + 1)
                  } else if (Math.abs(offset) > swipeThreshold) {
                    newIndex = offset > 0
                      ? Math.max(0, currentImageIndex - 1)
                      : Math.min(images.length - 1, currentImageIndex + 1)
                  }
                  
                  setCurrentImageIndex(newIndex)
                }}
                animate={{ x: -currentImageIndex * window.innerWidth }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {images.map((image, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 h-full"
                    style={{ width: window.innerWidth }}
                  >
                    <FadeImage
                      src={image}
                      alt={`${resident.name} - Image ${index + 1}`}
                      className="w-full h-full object-contain border-[12px] border-white"
                      duration={300}
                    />
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Dot indicators - mobile only */}
            {images.length > 1 && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentImageIndex(index)
                    }}
                    className={`h-2 rounded-full transition-all ${
                      index === currentImageIndex 
                        ? 'bg-white w-6' 
                        : 'bg-white/50 w-2'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Desktop: Simple single image */
          <div className="relative w-full h-full flex items-center justify-center">
            <FadeImage
              key={currentImageIndex}
              src={images[currentImageIndex]}
              alt={`${resident.name} - Image ${currentImageIndex + 1}`}
              className="max-w-full max-h-[90vh] w-auto h-auto object-contain border-[12px] border-white"
              duration={300}
            />

            {/* Navigation arrows - desktop only */}
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

                {/* Dot indicators - desktop */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation()
                        setCurrentImageIndex(index)
                      }}
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
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
