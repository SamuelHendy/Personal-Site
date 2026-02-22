import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Search, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import WatchCard from '../components/WatchCard'
import WatchModal from '../components/WatchModal'
import MobileWatchCard from '../components/MobileWatchCard'
import MobileWatchModal from '../components/MobileWatchModal'
import { api } from '../config/api'
import type { DisplayConfig } from '../contexts/DisplayConfigContext'
import { usePageEnabled } from '../contexts/PageEnabledContext'

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
  const isSnappingRef = useRef(false)
  
  // Debug mode - set to true to show position and pile data on cards
  const DEBUG_MODE = false

  // Modal state
  const [selectedWatch, setSelectedWatch] = useState<Watch | null>(null)
  const [thumbnailRect, setThumbnailRect] = useState<DOMRect | undefined>(undefined)
  
  // Cache for watch details (keyed by Model)
  const [watchDetailsCache, setWatchDetailsCache] = useState<Record<string, Watch>>({})
  
  // Display config for field visibility
  const [displayConfig, setDisplayConfig] = useState<DisplayConfig>({})
  
  // Page enabled from context
  const { pageEnabled, isLoaded: pageEnabledLoaded } = usePageEnabled()

  // Mobile carousel state
  const [mobileCardIndex, setMobileCardIndex] = useState(0)
  const [mobileModalWatch, setMobileModalWatch] = useState<Watch | null>(null)
  const [animatingCardIndex, setAnimatingCardIndex] = useState<number | null>(null)

  // Mobile navigation functions
  const goToNextCard = () => {
    if (mobileCardIndex < filteredWatches.length - 1) {
      // When swiping forward, the NEW card (next index) should be on top
      setAnimatingCardIndex(mobileCardIndex + 1)
      setMobileCardIndex(mobileCardIndex + 1)
      // Clear animating card after animation completes
      setTimeout(() => setAnimatingCardIndex(null), 600)
    }
  }

  const goToPreviousCard = () => {
    if (mobileCardIndex > 0) {
      // When swiping backward, the CURRENT card should be on top
      setAnimatingCardIndex(mobileCardIndex)
      setMobileCardIndex(mobileCardIndex - 1)
      // Clear animating card after animation completes
      setTimeout(() => setAnimatingCardIndex(null), 600)
    }
  }

  // Desktop navigation functions
  const scrollToNext = () => {
    if (isSnappingRef.current) return // Prevent clicks during animation
    
    const currentCard = Math.round(scrollPosition / 800)
    const nextScroll = (currentCard + 1) * 800
    const maxScroll = (filteredWatches.length - 4) * 800
    if (nextScroll <= maxScroll) {
      isSnappingRef.current = true
      window.scrollTo({ top: nextScroll, behavior: 'smooth' })
      setScrollPosition(nextScroll)
      
      setTimeout(() => {
        isSnappingRef.current = false
      }, 500)
    }
  }

  const scrollToPrevious = () => {
    if (isSnappingRef.current) return // Prevent clicks during animation
    
    const currentCard = Math.round(scrollPosition / 800)
    const prevScroll = (currentCard - 1) * 800
    if (prevScroll >= 0) {
      isSnappingRef.current = true
      window.scrollTo({ top: prevScroll, behavior: 'smooth' })
      setScrollPosition(prevScroll)
      
      setTimeout(() => {
        isSnappingRef.current = false
      }, 500)
    }
  }

  // Fetch watch details with caching
  const fetchWatchDetails = async (watch: Watch): Promise<Watch> => {
    const cacheKey = watch.Model
    
    // Return cached details if available
    if (watchDetailsCache[cacheKey]) {
      return watchDetailsCache[cacheKey]
    }
    
    // Fetch details from API
    try {
      const response = await fetch(api.watchDetail(watch.Brand, watch.Model.replace(/ /g, '_')))
      const details = await response.json()
      const fullWatch = { ...watch, ...details }
      
      // Cache the details
      setWatchDetailsCache(prev => ({ ...prev, [cacheKey]: fullWatch }))
      
      return fullWatch
    } catch (error) {
      console.error('Error fetching watch details:', error)
      return watch
    }
  }

  // Handle opening watch modal (desktop)
  const handleOpenWatchModal = async (watch: Watch, cardElement: HTMLElement | null) => {
    if (cardElement) {
      setThumbnailRect(cardElement.getBoundingClientRect())
    }
    setSelectedWatch(watch)
    
    // Fetch details in background and update modal
    const watchWithDetails = await fetchWatchDetails(watch)
    setSelectedWatch(watchWithDetails)
  }

  // Handle opening mobile watch modal
  const handleOpenMobileModal = async (watch: Watch) => {
    setMobileModalWatch(watch)
    
    // Fetch details in background and update modal
    const watchWithDetails = await fetchWatchDetails(watch)
    setMobileModalWatch(watchWithDetails)
  }

  // Hide scrollbar on body element
  useEffect(() => {
    document.body.classList.add('hide-scrollbar')
    return () => {
      document.body.classList.remove('hide-scrollbar')
    }
  }, [])

  // Reset scroll position when search or filter changes (but not on initial mount)
  const isInitialMount = useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // Use requestAnimationFrame to defer setState outside the effect's synchronous execution
    requestAnimationFrame(() => {
      setScrollPosition(0)
    })
  }, [searchQuery, selectedFilter])

  // Track scroll position and handle immediate snapping (scroll hijacking)
  useEffect(() => {
    const scrollPerCard = 800
    const scrollAccumulator = { value: 0 }
    const SCROLL_THRESHOLD = 50
    
    // Calculate filtered count inside useEffect
    const filteredCount = watches.filter(watch => {
      const matchesFilter = selectedFilter === 'All' || 
        (selectedFilter === 'Favourites' ? watch.Is_Favourite === true : watch.Movement_Type === selectedFilter)
      const matchesSearch = searchQuery === '' || 
        Object.values(watch).some(value => value?.toString().toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesFilter && matchesSearch
    }).length

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      if (isSnappingRef.current) return
      
      // Accumulate both vertical and horizontal scroll (horizontal at 0.5x speed)
      // Horizontal swipe left = positive deltaX = next card
      scrollAccumulator.value += e.deltaY + (e.deltaX * 0.5)
      
      if (Math.abs(scrollAccumulator.value) >= SCROLL_THRESHOLD) {
        const currentCard = Math.round(scrollPosition / scrollPerCard)
        // Stop when last card reaches pos 3 (right pile visible)
        const maxCards = Math.max(0, filteredCount - 4)
        
        if (scrollAccumulator.value > 0 && currentCard < maxCards) {
          // Scroll down/right - next card
          const targetScroll = (currentCard + 1) * scrollPerCard
          isSnappingRef.current = true
          scrollAccumulator.value = 0
          
          window.scrollTo({ top: targetScroll, behavior: 'smooth' })
          setScrollPosition(targetScroll)
          
          setTimeout(() => {
            isSnappingRef.current = false
          }, 500)
        } else if (scrollAccumulator.value < 0 && currentCard > 0) {
          // Scroll up/left - previous card
          const targetScroll = (currentCard - 1) * scrollPerCard
          isSnappingRef.current = true
          scrollAccumulator.value = 0
          
          window.scrollTo({ top: targetScroll, behavior: 'smooth' })
          setScrollPosition(targetScroll)
          
          setTimeout(() => {
            isSnappingRef.current = false
          }, 500)
        }
      }
    }
    
    const handleScroll = () => {
      if (!isSnappingRef.current) {
        setScrollPosition(window.scrollY)
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [scrollPosition, watches, selectedFilter, searchQuery])

  useEffect(() => {
    // Don't fetch until we know if page is enabled
    if (!pageEnabledLoaded) return
    
    // If page is disabled, don't fetch watches
    if (pageEnabled.watches === false) {
      setLoading(false)
      return
    }

    fetch(api.watches)
      .then(response => response.json())
      .then(data => {
        // Parse dates and add random pile data to each watch
        const watchesWithDates = data.map((watch: Watch) => {
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
            }
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
    
    // Fetch display config
    fetch(api.config('display_config', 'watches'))
      .then(res => res.json())
      .then(data => {
        delete data.ConfigType
        delete data.ConfigKey
        setDisplayConfig(data)
      })
      .catch(() => setDisplayConfig({}))
  }, [pageEnabledLoaded, pageEnabled.watches])

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
    // At scroll 0: card 0 at position 0, card 1 at 1, card 2 at 2, card 3 at 3 (right pile)
    // As we scroll, positions decrease (cards move left through the sequence)
    const scrollOffset = scrollPosition / scrollPerCard
    const rawPosition = cardIndex - scrollOffset
    
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

  if (pageEnabled.watches === false) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] px-[var(--spacing-md)] md:px-[var(--spacing-lg)] py-[var(--spacing-xl)]">
        <Link to="/" className="rough-border inline-flex items-center gap-2 border border-transparent text-[var(--color-text-primary)] hover:text-[var(--color-text-secondary)] transition-colors mb-8 w-fit">
          <ChevronRight size={24} className="rotate-180 -translate-y-0.5" />
          <span className="font-bold">Back to Home</span>
        </Link>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4 text-printed">Coming Soon</h1>
            <p className="text-[var(--color-text-secondary)]">The watches section is currently being prepared. Check back later!</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] hide-scrollbar">
      
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
        <div className="mb-16 md:mb-6 space-y-3 px-[var(--spacing-md)] md:px-[var(--spacing-lg)]">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Search Box - First */}
          <div className="rough-border relative w-full md:flex-1 md:min-w-[400px] md:max-w-2xl border border-[var(--color-text-primary)] bg-[var(--color-background)]">
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

        {/* Results count - Desktop only, mobile version is in carousel */}
        <p className="hidden md:block text-sm text-[var(--color-text-secondary)] md:pb-8">
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
        <div className="hidden md:flex relative h-[calc(100vh-320px)] items-center justify-center">
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
              zIndex = 1000 + Math.round(position * 100) // Higher position = higher z-index
            } else if (position >= 1 && position < 2) {
              // Moving from 55% to -55%
              const progress = position - 1 // 0 to 1
              xOffset = `${-52.5 + (progress * 105)}%` // -52.5% to 52.5%
              yOffset = 0
              rotation = 0
              scale = 1
              opacity = 1
              zIndex = 1000 + Math.round(position * 100) // Higher position = higher z-index
            } else if (position >= 2 && position < 3) {
              // Moving from 165% to 55% (straightened)
              const progress = (position - 2) / 1.0 // 0 to 1
              xOffset = `${52.5 + (progress * 107.5)}%` // 52.5% to 160%
              yOffset = 0
              rotation = 0
              scale = 1
              opacity = 1
              zIndex = 1000 + Math.round(position * 100) // Higher position = higher z-index
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
                key={`${watch.Model}-${index}`}
                data-watch-id={watch.Model}
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
                  dialColour={watch.Dial_Colour}
                  caseWidth={watch.Case_Width}
                  movementType={watch.Movement_Type}
                  manufacturedYear={watch.Manufactured_Year}
                  obtainedDate={watch.Obtained_Date}
                  pullPile={watch.pull_pile}
                  placePile={watch.place_pile}
                  debugPosition={DEBUG_MODE ? position : undefined}
                  debugMode={DEBUG_MODE}
                  isClickable={position >= 0 && position <= 3}
                  onClick={() => {
                    if (position >= 0 && position <= 3) {
                      const cardElement = document.querySelector(`[data-watch-id="${watch.Model}"]`)
                      handleOpenWatchModal(watch, cardElement as HTMLElement | null)
                    }
                  }}
                />
              </motion.div>
            )
          })}
        </div>
      )}
      </div>

      {/* Mobile Carousel - Visible only on mobile */}
      {!loading && filteredWatches.length > 0 && (
        <div className="md:hidden fixed top-[375px] bottom-0 left-0 right-0 flex flex-col overflow-hidden">
          {/* Header with count, tap hint, and swipe indicator */}
          <div className="relative flex items-center justify-between pl-8 pr-6 py-4">
            <p className="text-sm text-[var(--color-text-secondary)]">
              {mobileCardIndex + 1} of {filteredWatches.length}
            </p>
            <p className="absolute left-1/2 -translate-x-1/2 text-xs text-[var(--color-text-secondary)]">
              Tap to view
            </p>
            <div className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1">
              <span className="text-lg text-[var(--color-text-primary)] -translate-y-0.5">←</span>
              <span>Swipe</span>
              <span className="text-lg text-[var(--color-text-primary)] -translate-y-0.5">→</span>
            </div>
          </div>
          
          <motion.div 
            className="relative flex-1 w-full flex items-center justify-center touch-pan-y"
            onPanEnd={(_, info) => {
              if (info.offset.x < -50) {
                // Swipe left - bring new card from right stack to center stack
                goToNextCard()
              } else if (info.offset.x > 50) {
                // Swipe right - move current card back to right stack
                goToPreviousCard()
              }
            }}
          >
            {/* Render all cards with position-based animations */}
            {filteredWatches.map((watch, index) => {
              const placePile = watch.place_pile || { vertical: 0, tilt: 0 }
              const pullPile = watch.pull_pile || { vertical: 0, tilt: 0 }
              
              let x = 0
              let y = 0
              let rotate = 0
              let zIndex = 0
              let opacity = 1
              
              // Check if this card is currently animating
              const isAnimating = animatingCardIndex === index
              
              if (index < mobileCardIndex) {
                // Viewed cards - on-screen stack (center) with place_pile transformations
                // Use 1000+ range so always above off-screen stack
                x = 0
                y = placePile.vertical
                rotate = placePile.tilt
                zIndex = isAnimating ? 3000 : 1000 + index
                opacity = 1
              } else if (index === mobileCardIndex) {
                // Current card - on top of everything
                x = 0
                y = 0
                rotate = 0
                zIndex = 2000
                opacity = 1
              } else {
                // Unviewed cards - off-screen stack (right) with pull_pile transformations
                // Use 0-500 range so always below on-screen stack
                // Cards closer to current (lower index) should be on top
                x = window.innerWidth * 0.6 + (window.innerWidth * 0.6)
                y = pullPile.vertical
                rotate = pullPile.tilt
                zIndex = isAnimating ? 3000 : 500 - (index - mobileCardIndex)
                opacity = 1
              }
              
              return (
                <motion.div
                  key={watch.Model}
                  className="absolute w-[70%] h-full flex items-center justify-center"
                  animate={{
                    x,
                    y,
                    rotate,
                    zIndex,
                    opacity
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  style={{ pointerEvents: index === mobileCardIndex ? 'auto' : 'none' }}
                >
                  <MobileWatchCard
                    modelId={watch.Model}
                    onClick={index === mobileCardIndex ? () => handleOpenMobileModal(watch) : undefined}
                  />
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      )}

      {/* Blank space for scroll - calculated so last card stops at position 3 */}
      <div className="hidden md:block" style={{ height: `${(filteredWatches.length - 4) * 800 + 500}px` }}></div>

      {/* Watch Modal - Desktop */}
      <AnimatePresence>
        {selectedWatch && (
          <WatchModal
            watch={selectedWatch}
            onClose={() => setSelectedWatch(null)}
            thumbnailRect={thumbnailRect}
            displayConfig={displayConfig}
          />
        )}
      </AnimatePresence>

      {/* Watch Modal - Mobile */}
      <AnimatePresence>
        {mobileModalWatch && (
          <MobileWatchModal
            watch={mobileModalWatch}
            onClose={() => setMobileModalWatch(null)}
            displayConfig={displayConfig}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
