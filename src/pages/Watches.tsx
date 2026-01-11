import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Search, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import WatchCard from '../components/WatchCard'
import WatchModal from '../components/WatchModal'

interface Watch {
  Brand: string
  Model: string
  Model_Id: string
  Dial_Colour: string
  Case_Width: number
  Movement_Type: string
  Movement_Name?: string
  Manufactured_Year: string
  Obtained_Date: string
  Dark_Name: boolean
  Description?: string
  Purchase_Price?: string | number
  Aquired_From?: string
  Beats_Per_Hour?: number
  Glass?: string
  Case_Material?: string
  Caseback_Window?: boolean
  Lug_Width?: number
  Aquired_Condition?: string
  parsedDate: Date
  Is_Favourite?: boolean
  pull_pile: {
    vertical: number
    tilt: number
  }
  place_pile: {
    vertical: number
    tilt: number
  }
}

export default function Watches() {
  const [watches, setWatches] = useState<Watch[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [scrollPosition, setScrollPosition] = useState(0)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSnappingRef = useRef(false)
  
  // Debug mode - set to true to show position and pile data on cards
  const DEBUG_MODE = false

  // Modal state
  const [selectedWatch, setSelectedWatch] = useState<Watch | null>(null)
  const [thumbnailRect, setThumbnailRect] = useState<DOMRect | undefined>(undefined)

  // Navigation functions
  const scrollToNext = () => {
    const currentCard = Math.round(scrollPosition / 800)
    const nextScroll = (currentCard + 1) * 800
    const maxScroll = (filteredWatches.length - 4) * 800
    if (nextScroll <= maxScroll) {
      window.scrollTo({ top: nextScroll, behavior: 'smooth' })
    }
  }

  const scrollToPrevious = () => {
    const currentCard = Math.round(scrollPosition / 800)
    const prevScroll = (currentCard - 1) * 800
    if (prevScroll >= 0) {
      window.scrollTo({ top: prevScroll, behavior: 'smooth' })
    }
  }

  // Reset scroll position when search or filter changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [searchQuery, selectedFilter])

  // Track scroll position and handle snapping
  useEffect(() => {
    const scrollPerCard = 800

    const handleScroll = () => {
      // Update scroll position
      if (!isSnappingRef.current) {
        setScrollPosition(window.scrollY)
      }

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      // Set new timeout for snapping
      scrollTimeoutRef.current = setTimeout(() => {
        if (isSnappingRef.current) return

        const currentScroll = window.scrollY
        const currentCardProgress = currentScroll / scrollPerCard
        const nearestCard = Math.round(currentCardProgress)
        const targetScroll = nearestCard * scrollPerCard

        // Only snap if we're not already at a snap point
        if (Math.abs(currentScroll - targetScroll) > 5) {
          isSnappingRef.current = true
          window.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
          })
          
          // Reset snapping flag after animation completes
          setTimeout(() => {
            isSnappingRef.current = false
            setScrollPosition(targetScroll)
          }, 500)
        }
      }, 50) // Wait 50ms after user stops scrolling
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    fetch('https://3y8jxev5y3.execute-api.eu-west-2.amazonaws.com/api/watches')
      .then(response => response.json())
      .then(data => {
        // Parse dates and add random pile data to each watch
        const watchesWithDates = data.map((watch: any) => {
          const [day, month, year] = watch.Obtained_Date.split('/')
          
          // Generate random values for pull and place piles
          const randomVertical = () => Math.floor(Math.random() * 21) - 10 // -10 to +10
          const randomTilt = () => Math.floor(Math.random() * 13) - 6 // -6 to +6
          
          return {
            ...watch,
            parsedDate: new Date(parseInt(year), parseInt(month) - 1, parseInt(day)),
            pull_pile: {
              vertical: randomVertical(),
              tilt: randomTilt()
            },
            place_pile: {
              vertical: randomVertical(),
              tilt: randomTilt()
            },
            Is_Favourite: true // TESTING: Set all watches as favourites
          }
        })
        
        // Sort by parsed date (newest first)
        const sortedData = watchesWithDates.sort((a: Watch, b: Watch) => {
          return b.parsedDate.valueOf() - a.parsedDate.valueOf()
        })
        
        setWatches(sortedData)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching watches:', error)
        setLoading(false)
      })
  }, [])

  // Filter watches based on selected filter and search query
  const filteredWatches = watches.filter(watch => {
    // Apply movement type filter or favourites filter
    let matchesFilter = false
    if (selectedFilter === 'All') {
      matchesFilter = true
    } else if (selectedFilter === 'Favourites') {
      matchesFilter = watch.Is_Favourite === true
    } else {
      matchesFilter = watch.Movement_Type === selectedFilter
    }
    
    // Apply search query - search through all fields including description
    const matchesSearch = searchQuery === '' || 
      Object.values(watch).some(value => 
        value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    
    return matchesFilter && matchesSearch
  })

  const filters = ['All', 'Favourites', 'Automatic', 'Quartz', 'Manual']

  // Calculate card position based on scroll and index
  const getCardPositionFromScroll = (cardIndex: number) => {
    // Scroll distance to move one card through the sequence
    const scrollPerCard = 800 // 800px of scroll per card transition (slower animations)
    
    // Each card starts moving when previous card completes its transition
    // First 4 cards start at positions 0, 1, 2, 3 (offset by -3)
    const scrollOffset = scrollPosition / scrollPerCard
    const cardScrollTurn = cardIndex * 1.0 // Card N starts after previous card completes (no overlap)
    let rawPosition = 3 - (scrollOffset - cardScrollTurn) - 3 // Offset by -3 so first card starts at position 0
    
    // Apply easing to create brief pauses at positions 1 and 2
    // This slows down the progression near these key positions
    const applyPauseEasing = (pos: number) => {
      // Create "sticky" zones around positions 1 and 2
      const pauseStrength = 0.3 // How much to slow down (0-1)
      const pauseWidth = 0.15 // Width of the pause zone
      
      // Check if near position 2 (center-right at 55%)
      if (Math.abs(pos - 2) < pauseWidth) {
        const distFromCenter = Math.abs(pos - 2) / pauseWidth
        const slowdown = 1 - (pauseStrength * (1 - distFromCenter))
        return 2 + (pos - 2) * slowdown
      }
      
      // Check if near position 1 (center-left at -55%)
      if (Math.abs(pos - 1) < pauseWidth) {
        const distFromCenter = Math.abs(pos - 1) / pauseWidth
        const slowdown = 1 - (pauseStrength * (1 - distFromCenter))
        return 1 + (pos - 1) * slowdown
      }
      
      return pos
    }
    
    const currentPosition = applyPauseEasing(rawPosition)
    
    // Position mapping:
    // -1 or less: hidden left (exited)
    // 0-2: transitioning/left side
    // 3: right pile (starting position)
    // 4+: not yet started moving (still in pile)
    
    if (currentPosition < -10) return null // Exited left (larger buffer to show more cards in place pile)
    if (currentPosition > 15) return null // Show all cards in pile with buffer for easing
    
    return currentPosition
  }

  // Convert horizontal scroll to vertical scroll
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Check if there's horizontal scroll (deltaX)
      if (Math.abs(e.deltaX) > 0) {
        // Prevent default horizontal scroll
        e.preventDefault()
        // Scroll the page vertically by the horizontal delta amount (1:1 mapping)
        window.scrollBy({
          top: e.deltaX,
          behavior: 'auto'
        })
      }
    }

    // Add event listener with passive: false to allow preventDefault
    window.addEventListener('wheel', handleWheel, { passive: false })
    
    return () => {
      window.removeEventListener('wheel', handleWheel)
    }
  }, [])

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, white, #888888)' }}>
      {/* Fixed content that follows scroll */}
      <div className="fixed inset-0 text-[var(--color-text-primary)] py-[var(--spacing-xl)] overflow-hidden">
        {/* Header */}
        <div className="mb-8 px-[var(--spacing-md)] md:px-[var(--spacing-lg)]">
          <Link to="/" className="rough-border flex items-center gap-2 border border-transparent text-[var(--color-text-primary)] hover:text-[var(--color-text-secondary)] transition-colors w-fit mb-4">
            <ChevronRight size={24} className="rotate-180 -translate-y-0.5" />
            <span className="font-bold">Back to Home</span>
          </Link>
          <div className="rough-border border border-transparent block w-fit">
            <h1 className="text-4xl font-bold text-printed">Watches</h1>
          </div>
        </div>

        {/* Filters and Search - Single Line */}
        <div className="mb-6 space-y-3 px-[var(--spacing-md)] md:px-[var(--spacing-lg)]">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Search Box - First */}
          <div className="rough-border relative flex-1 min-w-[400px] max-w-2xl border border-[var(--color-text-primary)] bg-[var(--color-background)]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-primary)] z-10 pointer-events-none -translate-y-[calc(50%+2px)]" size={20} />
            <input
              type="text"
              placeholder="Search watches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-transparent text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-0 relative z-0 font-medium text-base border-0"
              style={{ color: 'var(--color-text-primary)' }}
            />
          </div>

          {/* Quick Filters - Second */}
          <div className="flex flex-wrap gap-3">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`rough-border px-4 py-2 border border-[var(--color-text-primary)] transition-colors flex items-center gap-2 ${
                  selectedFilter === filter
                    ? 'bg-[var(--color-text-primary)] text-[var(--color-background)]'
                    : 'bg-[var(--color-background)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
                }`}
              >
                {filter === 'Favourites' && <Star size={16} className="-translate-y-0.5" />}
                <span className="font-semibold">{filter}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-[var(--color-text-secondary)]">
          Showing {filteredWatches.length} of {watches.length} watches
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <span className="text-2xl text-[var(--color-text-secondary)]">Loading watches...</span>
        </div>
      ) : filteredWatches.length === 0 ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <span className="text-xl text-[var(--color-text-secondary)]">No watches found</span>
        </div>
      ) : (
        <div className="relative h-[calc(100vh-320px)] flex items-center justify-center">
          {/* Navigation Buttons */}
          <button
            onClick={scrollToPrevious}
            disabled={scrollPosition <= 0}
            className="rough-border absolute left-4 z-[2000] w-12 h-12 border border-[var(--color-text-primary)] bg-[var(--color-background)] hover:bg-[var(--color-text-primary)] hover:text-[var(--color-background)] transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[var(--color-background)] disabled:hover:text-[var(--color-text-primary)]"
            aria-label="Previous card"
          >
            <ChevronRight size={24} className="rotate-180" />
          </button>
          
          <button
            onClick={scrollToNext}
            disabled={scrollPosition >= (filteredWatches.length - 4) * 800}
            className="rough-border absolute right-4 z-[2000] w-12 h-12 border border-[var(--color-text-primary)] bg-[var(--color-background)] hover:bg-[var(--color-text-primary)] hover:text-[var(--color-background)] transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[var(--color-background)] disabled:hover:text-[var(--color-text-primary)]"
            aria-label="Next card"
          >
            <ChevronRight size={24} />
          </button>

          {filteredWatches.map((watch, index) => {
            const position = getCardPositionFromScroll(index)
            
            if (position === null) return null
            
            // Calculate visual properties based on position
            // Animation sequence: 
            // Position 3+: Start at 165% with pull_pile twist
            // Position 2.8-3: Straighten card
            // Position 2-2.8: Move to 55%
            // Position 1-2: Move from 55% to -55%
            // Position 0-1: Move from -55% to -165%
            // Position <0: At -165% with place_pile twist
            
            let xOffset = '0%'
            let yOffset = 0
            let rotation = 0
            let scale = 1
            let opacity = 1
            let zIndex = 0
            
            if (position < -0.2) {
              // Final position - left side with full place_pile offsets
              // First cards to arrive should be on bottom, later cards on top
              xOffset = '-160%'
              yOffset = watch.place_pile.vertical
              rotation = watch.place_pile.tilt
              scale = 1
              opacity = 1
              zIndex = index // Cards stack in order: first card (0) on bottom, later cards on top
            } else if (position >= -0.2 && position < 0) {
              // Applying place_pile twist as card settles into final position
              const progress = (position + 0.2) / 0.2 // 1 at pos 0, 0 at pos -0.2
              xOffset = '-160%'
              yOffset = watch.place_pile.vertical * (1 - progress)
              rotation = watch.place_pile.tilt * (1 - progress)
              scale = 1
              opacity = 1
              zIndex = index
            } else if (position >= 0 && position < 1) {
              // Moving from -55% to -165% (no twist during movement)
              const progress = position // 0 to 1
              xOffset = `${-160 + (progress * 107.5)}%` // -160% to -52.5%
              yOffset = 0
              rotation = 0
              scale = 1
              opacity = 1
              zIndex = 1000 + index
            } else if (position >= 1 && position < 2) {
              // Moving from 55% to -55%
              const progress = position - 1 // 0 to 1
              xOffset = `${-52.5 + (progress * 105)}%` // -52.5% to 52.5%
              yOffset = 0
              rotation = 0
              scale = 1
              opacity = 1
              zIndex = 1000 + index
            } else if (position >= 2 && position < 3) {
              // Moving from 165% to 55% (straightened)
              const progress = (position - 2) / 1.0 // 0 to 1
              xOffset = `${52.5 + (progress * 107.5)}%` // 52.5% to 160%
              yOffset = 0
              rotation = 0
              scale = 1
              opacity = 1
              zIndex = 1000 + index
            } else if (position >= 3 && position < 3.2) {
              // Straightening at 165% - card loses twist as it approaches position 3
              // At position 3.2: full twist, At position 3: no twist
              const progress = (3.2 - position) / 0.2 // 0 at pos 3.2, 1 at pos 3
              xOffset = '160%'
              yOffset = watch.pull_pile.vertical * (1 - progress)
              rotation = watch.pull_pile.tilt * (1 - progress)
              scale = 1
              opacity = 1
              zIndex = filteredWatches.length - index
            } else {
              // Right pile - starting position with pull_pile offsets
              // Cards keep their original twist throughout
              xOffset = '160%'
              yOffset = watch.pull_pile.vertical
              rotation = watch.pull_pile.tilt
              scale = 1
              opacity = 1
              zIndex = filteredWatches.length - index
            }
            
            return (
              <motion.div
                key={`${watch.Model_Id}-${index}`}
                data-watch-id={watch.Model_Id}
                className="absolute"
                animate={{
                  x: xOffset,
                  y: yOffset,
                  rotate: rotation,
                  scale: scale,
                  opacity: opacity,
                  zIndex: zIndex,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }}
              >
                <WatchCard
                  brand={watch.Brand}
                  model={watch.Model}
                  modelId={watch.Model_Id}
                  dialColour={watch.Dial_Colour}
                  caseWidth={watch.Case_Width}
                  movementType={watch.Movement_Type}
                  manufacturedYear={watch.Manufactured_Year}
                  obtainedDate={watch.Obtained_Date}
                  darkName={watch.Dark_Name}
                  pullPile={watch.pull_pile}
                  placePile={watch.place_pile}
                  debugPosition={DEBUG_MODE ? position : undefined}
                  debugMode={DEBUG_MODE}
                  isClickable={position >= 0 && position <= 3}
                  onClick={() => {
                    if (position >= 0 && position <= 3) {
                      const cardElement = document.querySelector(`[data-watch-id="${watch.Model_Id}"]`)
                      if (cardElement) {
                        setThumbnailRect(cardElement.getBoundingClientRect())
                      }
                      setSelectedWatch(watch)
                    }
                  }}
                />
              </motion.div>
            )
          })}
        </div>
      )}
      </div>

      {/* Blank space for scroll - calculated so last card stops at position 3 */}
      {/* rawPosition = cardScrollTurn - scrollOffset */}
      {/* For last card (index N-1) at position 3: (N-1) - scrollOffset = 3, so scrollOffset = N-4 */}
      {/* maxScroll = (N-4) * 800 */}
      <div style={{ height: `${(filteredWatches.length - 4) * 800 + 500}px` }}></div>

      {/* Watch Modal */}
      <AnimatePresence>
        {selectedWatch && (
          <WatchModal
            watch={selectedWatch}
            imageUrl={`https://shendy-albums.s3.eu-west-2.amazonaws.com/Watches/${selectedWatch.Model_Id}.jpg`}
            onClose={() => setSelectedWatch(null)}
            thumbnailRect={thumbnailRect}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
