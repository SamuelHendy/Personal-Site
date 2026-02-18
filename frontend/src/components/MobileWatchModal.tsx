import { motion } from 'framer-motion'
import { X, Star, GripHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Watch {
  Model_Id: string
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
}

interface MobileWatchModalProps {
  watch: Watch
  onClose: () => void
}

export default function MobileWatchModal({ watch, onClose }: MobileWatchModalProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight)
  const [imageSrc, setImageSrc] = useState(imageUrl)
  
  // Calculate image height based on 3:4 aspect ratio
  const imageHeight = (window.innerWidth * 4) / 3
  // When collapsed, show only the portion below the image
  const collapsedHeight = viewportHeight - imageHeight
  // When expanded, show 85vh of content
  const expandedHeight = viewportHeight * 0.85

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

      {/* Image - 3:4 aspect ratio at top, stays fixed */}
      <div className="w-full bg-[var(--color-surface)] overflow-hidden flex-shrink-0" style={{ aspectRatio: '3/4' }} onClick={onClose}>
        <img
          src={imageSrc}
          alt={`${watch.Brand} ${watch.Model}`}
          className="w-full h-full object-cover"
          onError={() => setImageSrc(`https://placehold.co/600x800/e5e5e5/525252?text=${watch.Model}`)}
        />
      </div>

      {/* Content area - overlays image when expanded */}
      <motion.div 
        className="absolute left-0 right-0 bottom-0 flex flex-col bg-[var(--color-background)]"
        style={{ 
          height: isExpanded ? `${expandedHeight}px` : `${collapsedHeight}px`
        }}
        onClick={(e) => e.stopPropagation()}
        animate={{ 
          height: isExpanded ? `${expandedHeight}px` : `${collapsedHeight}px`
        }}
        transition={{ type: "spring", damping: 30, stiffness: 500 }}
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
      >
        {/* Drag handle bar */}
        <div className="flex-shrink-0 py-3 flex items-center justify-center border-b border-[var(--color-text-primary)]/20 cursor-grab active:cursor-grabbing">
          <GripHorizontal size={24} className="text-[var(--color-text-secondary)]" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header with Favourite star */}
        <div className="relative">
          {watch.Is_Favourite && (
            <div className="absolute -top-2 -right-2">
              <Star size={24} fill="currentColor" className="text-yellow-500" />
            </div>
          )}
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2" style={{ filter: 'url(#roughen)', letterSpacing: '0.03em' }}>{watch.Brand}</h2>
          <p className="text-xl text-[var(--color-text-secondary)]" style={{ filter: 'url(#roughen)', letterSpacing: '0.03em' }}>{watch.Model}</p>
        </div>

        {/* Specifications */}
        <div>
          <h3 className="text-sm font-bold uppercase text-[var(--color-text-secondary)] mb-3" style={{ filter: 'url(#roughen)', letterSpacing: '0.03em' }}>Specifications</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-t border-[var(--color-text-primary)]/20">
              <span className="text-[var(--color-text-secondary)]">Movement Type:</span>
              <span className="font-semibold text-[var(--color-text-primary)]">{watch.Movement_Type}</span>
            </div>
            {watch.Movement_Name && (
              <div className="flex justify-between py-2 border-t border-[var(--color-text-primary)]/20">
                <span className="text-[var(--color-text-secondary)]">{watch.Movement_Type === 'Quartz' ? 'Module:' : 'Calibre:'}</span>
                <span className="font-semibold text-[var(--color-text-primary)]">{watch.Movement_Name}</span>
              </div>
            )}
            {watch.Beats_Per_Hour && (
              <div className="flex justify-between py-2 border-t border-[var(--color-text-primary)]/20">
                <span className="text-[var(--color-text-secondary)]">Frequency:</span>
                <span className="font-semibold text-[var(--color-text-primary)]">{watch.Beats_Per_Hour.toLocaleString()} BPH ({(watch.Beats_Per_Hour / 3600).toFixed(1)} Hz)</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t border-[var(--color-text-primary)]/20">
              <span className="text-[var(--color-text-secondary)]">Case Width:</span>
              <span className="font-semibold text-[var(--color-text-primary)]">{watch.Case_Width}mm</span>
            </div>
            {watch.Case_Material && (
              <div className="flex justify-between py-2 border-t border-[var(--color-text-primary)]/20">
                <span className="text-[var(--color-text-secondary)]">Case Material:</span>
                <span className="font-semibold text-[var(--color-text-primary)]">{watch.Case_Material}</span>
              </div>
            )}
            {watch.Lug_Width && (
              <div className="flex justify-between py-2 border-t border-[var(--color-text-primary)]/20">
                <span className="text-[var(--color-text-secondary)]">Lug Width:</span>
                <span className="font-semibold text-[var(--color-text-primary)]">{watch.Lug_Width}mm</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t border-[var(--color-text-primary)]/20">
              <span className="text-[var(--color-text-secondary)]">Dial Colour:</span>
              <span className="font-semibold text-[var(--color-text-primary)]">{watch.Dial_Colour}</span>
            </div>
            {watch.Glass && (
              <div className="flex justify-between py-2 border-t border-[var(--color-text-primary)]/20">
                <span className="text-[var(--color-text-secondary)]">Glass:</span>
                <span className="font-semibold text-[var(--color-text-primary)]">{watch.Glass}</span>
              </div>
            )}
            {watch.Caseback_Window !== undefined && (
              <div className="flex justify-between py-2 border-t border-[var(--color-text-primary)]/20">
                <span className="text-[var(--color-text-secondary)]">Caseback Window:</span>
                <span className="font-semibold text-[var(--color-text-primary)]">{watch.Caseback_Window ? 'Yes' : 'No'}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t border-[var(--color-text-primary)]/20">
              <span className="text-[var(--color-text-secondary)]">Year:</span>
              <span className="font-semibold text-[var(--color-text-primary)]">{watch.Manufactured_Year}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {watch.Description && (
          <div>
            <h3 className="text-sm font-bold uppercase text-[var(--color-text-secondary)] mb-2" style={{ filter: 'url(#roughen)', letterSpacing: '0.03em' }}>Description</h3>
            <p className="text-[var(--color-text-primary)]" style={{ filter: 'url(#roughen)', letterSpacing: '0.03em' }}>{watch.Description}</p>
          </div>
        )}

        {/* Acquisition Details */}
        <div>
          <h3 className="text-sm font-bold uppercase text-[var(--color-text-secondary)] mb-3" style={{ filter: 'url(#roughen)', letterSpacing: '0.03em' }}>Acquisition</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-t border-[var(--color-text-primary)]/20">
              <span className="text-[var(--color-text-secondary)]">Obtained:</span>
              <span className="font-semibold text-[var(--color-text-primary)]">{watch.Obtained_Date}</span>
            </div>
            {watch.Acquired_From && (
              <div className="flex justify-between py-2 border-t border-[var(--color-text-primary)]/20">
                <span className="text-[var(--color-text-secondary)]">From:</span>
                <span className="font-semibold text-[var(--color-text-primary)]">{watch.Acquired_From}</span>
              </div>
            )}
            {watch.Acquired_Condition && (
              <div className="flex justify-between py-2 border-t border-[var(--color-text-primary)]/20">
                <span className="text-[var(--color-text-secondary)]">Condition:</span>
                <span className="font-semibold text-[var(--color-text-primary)]">{watch.Acquired_Condition}</span>
              </div>
            )}
            {watch.Purchase_Price && (
              <div className="flex justify-between py-2 border-t border-[var(--color-text-primary)]/20">
                <span className="text-[var(--color-text-secondary)]">Price:</span>
                <span className="font-semibold text-[var(--color-text-primary)]">£{watch.Purchase_Price}</span>
              </div>
            )}
          </div>
        </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
