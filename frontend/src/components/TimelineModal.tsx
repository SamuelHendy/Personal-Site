import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface TimelineEvent {
  id: string
  date: string
  title: string
  description: string
  images: string[]
}

interface TimelineModalProps {
  event: TimelineEvent
  onClose: () => void
}

export default function TimelineModal({ event, onClose }: TimelineModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    // Prevent scrolling when modal is open
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    
    // Re-enable scrolling when modal closes
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const goToNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % event.images.length)
  }

  const goToPreviousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + event.images.length) % event.images.length)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
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
      <div className="relative w-full h-full flex items-center justify-center px-8">
        <div className="flex items-start gap-8">
        {/* Left box - Image carousel */}
        <motion.div
          className="relative flex items-center justify-center"
          style={{ maxWidth: '1200px', maxHeight: '80vh' }}
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={event.images[currentImageIndex]}
              alt={`${event.title} - Image ${currentImageIndex + 1}`}
              className="max-w-full max-h-full w-auto h-auto object-contain border-[12px] border-white"
            />

            {/* Navigation arrows - only show if multiple images */}
            {event.images.length > 1 && (
              <>
                <button
                  onClick={goToPreviousImage}
                  className="rough-border absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-12 border border-[var(--color-text-primary)] bg-black/60 backdrop-blur-sm hover:bg-[var(--color-text-primary)] hover:text-[var(--color-background)] transition-colors flex items-center justify-center text-white"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={goToNextImage}
                  className="rough-border absolute -right-6 top-1/2 -translate-y-1/2 w-12 h-12 border border-[var(--color-text-primary)] bg-black/60 backdrop-blur-sm hover:bg-[var(--color-text-primary)] hover:text-[var(--color-background)] transition-colors flex items-center justify-center text-white"
                  aria-label="Next image"
                >
                  <ChevronRight size={24} />
                </button>

                {/* Dot indicators */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                  {event.images.map((_, index) => (
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
        </motion.div>

        {/* Right box - Content */}
        <motion.div
          className="relative"
          style={{ width: '600px', maxWidth: '600px', maxHeight: '80vh' }}
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.1 }}
        >
          {/* Rough border div - sibling approach */}
          <div className="rough-border absolute inset-0 border border-[var(--color-text-primary)] bg-[var(--color-background)] pointer-events-none" />

          {/* Content div */}
          <div className="relative p-8 overflow-y-auto h-full overscroll-contain text-rough">
            <div className="text-[var(--color-text-primary)] space-y-6">
              {/* Header */}
              <div>
                <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                  {formatDate(event.date)}
                </p>
                <h2 className="text-3xl font-bold mb-2">{event.title}</h2>
              </div>

              {/* Description */}
              <div>
                <p className="text-[var(--color-text-primary)]">{event.description}</p>
              </div>
            </div>
          </div>
        </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
