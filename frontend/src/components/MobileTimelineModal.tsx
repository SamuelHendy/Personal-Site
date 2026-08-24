import { motion } from 'framer-motion'
import { X, GripHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import FadeImage from './FadeImage'

interface TimelineEvent {
  id: string
  date: string
  title: string
  description: string
  images: string[]
}

interface MobileTimelineModalProps {
  event: TimelineEvent
  onClose: () => void
}

export default function MobileTimelineModal({ event, onClose }: MobileTimelineModalProps) {
  const [isExpanded, setIsExpanded] = useState(event.images.length === 0) // Start expanded if no images
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight)
  
  const hasImages = event.images.length > 0
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  // Calculate image height based on 3:4 aspect ratio
  const imageHeight = hasImages ? (window.innerWidth * 4) / 3 : 0
  // When collapsed, show only the portion below the image
  const collapsedHeight = hasImages ? viewportHeight - imageHeight : viewportHeight
  // When expanded, show 85vh of content (or full height if no images)
  const expandedHeight = hasImages ? viewportHeight * 0.85 : viewportHeight 

  // Track viewport height changes
  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Lock scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-[var(--color-background)] flex flex-col"
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-[var(--color-background)] border border-[var(--color-text-primary)] rough-border hover:bg-[var(--color-text-primary)] hover:text-[var(--color-background)] transition-colors"
        aria-label="Close"
      >
        <X size={20} />
      </button>

      {/* Image carousel - 3:4 aspect ratio at top, stays fixed (only if images exist) */}
      {hasImages && (
      <div className="w-full bg-[var(--color-surface)] flex-shrink-0 relative" style={{ aspectRatio: '3/4' }}>
        <motion.div
          className="flex h-full"
          drag="x"
          dragConstraints={{ left: -(event.images.length - 1) * window.innerWidth, right: 0 }}
          dragElastic={0.1}
          onDragEnd={(_, info) => {
            const offset = info.offset.x
            const velocity = info.velocity.x
            const swipeThreshold = 50
            
            let newIndex = currentImageIndex
            
            if (Math.abs(velocity) > 500) {
              // Fast swipe
              newIndex = velocity > 0 
                ? Math.max(0, currentImageIndex - 1)
                : Math.min(event.images.length - 1, currentImageIndex + 1)
            } else if (Math.abs(offset) > swipeThreshold) {
              // Slow drag
              newIndex = offset > 0
                ? Math.max(0, currentImageIndex - 1)
                : Math.min(event.images.length - 1, currentImageIndex + 1)
            }
            
            setCurrentImageIndex(newIndex)
          }}
          animate={{ x: -currentImageIndex * window.innerWidth }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {event.images.map((image, index) => (
            <div
              key={index}
              className="flex-shrink-0 h-full"
              style={{ width: window.innerWidth }}
            >
              <FadeImage
                src={image}
                alt={`${event.title} - Image ${index + 1}`}
                className="w-full h-full object-cover"
                duration={300}
              />
            </div>
          ))}
        </motion.div>
        
        {/* Dot indicators - only show if multiple images */}
        {event.images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
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
        )}
      </div>
      )}

      {/* Content area - draggable, overlays image when expanded */}
      <motion.div 
        className="absolute left-0 right-0 bottom-0 flex flex-col bg-[var(--color-background)]"
        style={{ 
          height: isExpanded ? `${expandedHeight}px` : `${collapsedHeight}px`
        }}
        onClick={(e) => e.stopPropagation()}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
        onDragEnd={(_, info) => {
          // Snap to expanded if dragging up, collapsed if dragging down
          if (info.velocity.y < -50 || info.offset.y < -50) {
            setIsExpanded(true)
          } else if (info.velocity.y > 50 || info.offset.y > 50) {
            setIsExpanded(false)
          } else {
            // If minimal movement, stay in current state
            setIsExpanded(isExpanded)
          }
        }}
        animate={{ 
          height: isExpanded ? `${expandedHeight}px` : `${collapsedHeight}px`
        }}
        transition={{ type: "spring", damping: 30, stiffness: 500 }}
      >
        {/* Drag handle bar */}
        <div className="flex-shrink-0 py-3 flex items-center justify-center border-b border-[var(--color-text-primary)]/20 cursor-grab active:cursor-grabbing">
          <GripHorizontal size={24} className="text-[var(--color-text-secondary)]" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-rough">
          {/* Header */}
          <div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">
              {formatDate(event.date)}
            </p>
            <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
              {event.title}
            </h2>
          </div>

          {/* Description */}
          <div>
            <p className="text-[var(--color-text-primary)]">{event.description}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
