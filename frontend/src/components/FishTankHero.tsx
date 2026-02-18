import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'

export default function FishTankHero() {
  const [headerHeight, setHeaderHeight] = useState(0)
  const [maxScroll, setMaxScroll] = useState(0)
  const headerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const specsRef = useRef<HTMLDivElement>(null)
  const [imageTransform, setImageTransform] = useState({ marginTop: 0, translateX: 0 })
  const [isAnimating, setIsAnimating] = useState(false)
  const [specsSpacing, setSpecsSpacing] = useState(0)

  useEffect(() => {
    // Measure header height
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight)
    }
    
    // Calculate maxScroll after component mounts
    if (imageRef.current) {
      const viewportWidth = window.innerWidth
      const imageWidth = imageRef.current.scrollWidth || viewportWidth * 3
      setMaxScroll(imageWidth - viewportWidth)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (!imageRef.current) return

      const scrollY = window.scrollY
      const viewportWidth = window.innerWidth
      const imageWidth = imageRef.current.scrollWidth // Full width of the image (300% of viewport)
      
      // Calculate when animation should start and end
      const animationStart = headerHeight
      const maxScroll = imageWidth - viewportWidth // How much we need to scroll to see the full image
      const animationEnd = animationStart + maxScroll

      if (scrollY < animationStart) {
        // Before animation starts - image in normal flow
        setImageTransform({ marginTop: 0, translateX: 0 })
        setIsAnimating(false)
      } else if (scrollY >= animationStart && scrollY < animationEnd) {
        // During animation - translate to pan
        const scrollProgress = scrollY - animationStart
        setImageTransform({ 
          marginTop: scrollProgress, 
          translateX: -scrollProgress 
        })
        setIsAnimating(true)
      } else {
        // After animation ends - keep final position
        setImageTransform({ 
          marginTop: maxScroll, 
          translateX: -maxScroll 
        })
        setIsAnimating(false)
      }

      // Calculate scissor animation for specs
      if (specsRef.current) {
        const specsRect = specsRef.current.getBoundingClientRect()
        const specsCenterY = specsRect.top + specsRect.height / 2
        const viewportCenterY = window.innerHeight / 2
        
        // Only animate when section is above center (approaching from top)
        // Once centered or below, keep items at center (offset = 0)
        if (specsCenterY > viewportCenterY) {
          // Section is above center - calculate distance
          const distanceFromCenter = (specsCenterY - viewportCenterY) / (window.innerHeight / 2)
          const normalizedDistance = Math.max(0, Math.min(1, distanceFromCenter))
          
          // Scissor effect: items slide from sides to center
          // Movement is 20% of viewport width, at 1/2 scroll speed
          const viewportWidth = window.innerWidth
          const maxOffset = (viewportWidth * 0.2) / 2 // 20% of page width, divided by 2 for half-scroll speed
          const offset = maxOffset * normalizedDistance
          setSpecsSpacing(offset)
        } else {
          // Section is at or below center - keep items centered
          setSpecsSpacing(0)
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial calculation
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [headerHeight])

  return (
    <>
      {/* Header - separate from hero */}
      <div ref={headerRef} className="px-[var(--spacing-md)] md:px-[var(--spacing-lg)] pt-[var(--spacing-xl)]">
        {/* Back button */}
        <Link to="/" className="rough-border flex items-center gap-2 border border-transparent text-[var(--color-text-primary)] hover:text-[var(--color-text-secondary)] transition-colors w-fit mb-[var(--spacing-md)]">
          <ChevronRight size={24} className="rotate-180 -translate-y-0.5" />
          <span className="font-bold">Back to Home</span>
        </Link>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-bold text-[var(--color-text-primary)] mb-[var(--spacing-lg)] text-printed">
          My Aquarium
        </h1>
      </div>

      {/* Hero Section */}
      <section>
        {/* Spacer before image - pushes content down when not animating */}
        {!isAnimating && imageTransform.marginTop > 0 && (
          <div style={{ height: `${imageTransform.marginTop}px` }}></div>
        )}

        {/* Hero Image with horizontal scroll animation (mobile only) */}
        <div 
          ref={imageRef}
          className="overflow-hidden aspect-[11/5]"
          style={{ 
            height: window.innerWidth >= 768 ? 'auto' : '100vh',
            width: '100vw',
            position: window.innerWidth >= 768 ? 'relative' : (isAnimating ? 'sticky' : 'relative'),
            top: window.innerWidth >= 768 ? 'auto' : (isAnimating ? 0 : 'auto')
          }}
        >
          <div 
            className="h-full bg-gradient-to-r from-green-600 via-blue-500 to-orange-400"
            style={{ 
              width: window.innerWidth >= 768 ? '100%' : '300%',
              transform: window.innerWidth >= 768 ? 'none' : `translateX(${imageTransform.translateX}px)`
            }}
          >
          </div>
        </div>

        {/* Spacer for scroll distance during animation (mobile only) */}
        {isAnimating && window.innerWidth < 768 && <div style={{ height: `${maxScroll}px` }}></div>}

        <div className="px-[var(--spacing-md)] md:px-[var(--spacing-lg)] py-[var(--spacing-xl)] flex items-center justify-center">
          <div ref={specsRef} className="w-full max-w-[85%] mx-auto">
            {/* Tank Specifications - Vertical on mobile, horizontal on desktop */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-[var(--spacing-md)] md:gap-[var(--spacing-xl)] text-rough">
              <div 
                className="text-center py-[var(--spacing-md)]"
                style={{ transform: window.innerWidth >= 768 ? 'none' : `translateX(-${specsSpacing}px)` }}
              >
                <h3 className="text-sm text-[var(--color-text-secondary)] mb-1">Tank Size</h3>
                <p className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)]">240L</p>
              </div>
              
              <div 
                className="text-center py-[var(--spacing-md)]"
                style={{ transform: window.innerWidth >= 768 ? 'none' : `translateX(${specsSpacing}px)` }}
              >
                <h3 className="text-sm text-[var(--color-text-secondary)] mb-1">Water Type</h3>
                <p className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)]">Freshwater</p>
              </div>
              
              <div 
                className="text-center py-[var(--spacing-md)]"
                style={{ transform: window.innerWidth >= 768 ? 'none' : `translateX(-${specsSpacing}px)` }}
              >
                <h3 className="text-sm text-[var(--color-text-secondary)] mb-1">Tank Type</h3>
                <p className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)]">Community</p>
              </div>
              
              <div 
                className="text-center py-[var(--spacing-md)]"
                style={{ transform: window.innerWidth >= 768 ? 'none' : `translateX(${specsSpacing}px)` }}
              >
                <h3 className="text-sm text-[var(--color-text-secondary)] mb-1">Started</h3>
                <p className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)]">2020</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
