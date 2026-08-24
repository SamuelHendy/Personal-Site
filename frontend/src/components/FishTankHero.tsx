import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useRef, useEffect, useState, useMemo } from 'react'
import { api, cdn } from '../config/api'
import FadeImage from './FadeImage'

const MOBILE_HERO_ASPECT = 11 / 5

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mq.matches)
    mq.addEventListener('change', update)
    update()
    return () => mq.removeEventListener('change', update)
  }, [])

  return isMobile
}

function measureRenderedImageWidth(img: HTMLImageElement, containerHeight: number): number {
  if (img.naturalWidth > 0 && img.naturalHeight > 0 && containerHeight > 0) {
    return (img.naturalWidth / img.naturalHeight) * containerHeight
  }
  return img.getBoundingClientRect().width
}

export default function FishTankHero() {
  const isMobile = useIsMobile()
  const [viewportWidth, setViewportWidth] = useState(
    () => (typeof window !== 'undefined' ? window.innerWidth : 0)
  )
  const panTrackRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const specsRef = useRef<HTMLDivElement>(null)
  const [translateX, setTranslateX] = useState(0)
  const [specsSpacing, setSpecsSpacing] = useState(0)
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [heroLoaded, setHeroLoaded] = useState(false)
  const [heroLoading, setHeroLoading] = useState(true)
  const [renderedImageWidth, setRenderedImageWidth] = useState(0)

  const panDistance = useMemo(() => {
    if (!isMobile) return 0

    const containerHeight = imageRef.current?.clientHeight ?? 0
    const imageWidth = renderedImageWidth > 0
      ? renderedImageWidth
      : containerHeight > 0
        ? containerHeight * MOBILE_HERO_ASPECT
        : viewportWidth * MOBILE_HERO_ASPECT

    return Math.max(0, imageWidth - viewportWidth)
  }, [isMobile, renderedImageWidth, viewportWidth, heroLoaded])

  useEffect(() => {
    const fetchHero = async () => {
      try {
        const res = await fetch(api.fishtankHero)
        if (res.ok) {
          const data = await res.json()
          if (data?.url) {
            setHeroImageUrl(cdn.fishtank(data.url))
          } else {
            setHeroLoading(false)
            setHeroLoaded(true)
          }
        } else {
          setHeroLoading(false)
          setHeroLoaded(true)
        }
      } catch (err) {
        console.error('Failed to fetch hero:', err)
        setHeroLoading(false)
        setHeroLoaded(true)
      }
    }
    fetchHero()
  }, [])

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!isMobile) {
      setTranslateX(0)
      return
    }

    const handleScroll = () => {
      const track = panTrackRef.current
      if (!track || panDistance === 0) {
        setTranslateX(0)
        return
      }

      const scrolledIntoTrack = Math.min(
        Math.max(-track.getBoundingClientRect().top, 0),
        panDistance
      )
      setTranslateX(-scrolledIntoTrack)

      if (specsRef.current) {
        const specsRect = specsRef.current.getBoundingClientRect()
        const specsCenterY = specsRect.top + specsRect.height / 2
        const viewportCenterY = window.innerHeight / 2

        if (specsCenterY > viewportCenterY) {
          const distanceFromCenter = (specsCenterY - viewportCenterY) / (window.innerHeight / 2)
          const normalizedDistance = Math.max(0, Math.min(1, distanceFromCenter))
          const maxOffset = (window.innerWidth * 0.2) / 2
          setSpecsSpacing(maxOffset * normalizedDistance)
        } else {
          setSpecsSpacing(0)
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [panDistance, isMobile])

  const mobilePanWidth = renderedImageWidth > 0
    ? `${renderedImageWidth}px`
    : `calc(100dvh * ${MOBILE_HERO_ASPECT})`

  return (
    <>
      <div className="px-[var(--spacing-md)] md:px-[var(--spacing-lg)] pt-[var(--spacing-xl)]">
        <Link to="/" className="rough-border flex items-center gap-2 border border-transparent text-[var(--color-text-primary)] hover:text-[var(--color-text-secondary)] transition-colors w-fit mb-[var(--spacing-md)]">
          <ChevronRight size={24} className="rotate-180 -translate-y-0.5" />
          <span className="font-bold">Back to Home</span>
        </Link>

        <h1 className="text-4xl md:text-6xl font-bold text-[var(--color-text-primary)] mb-[var(--spacing-lg)] text-printed">
          My Aquarium
        </h1>
      </div>

      <section>
        {/* Pan track: its height creates scroll room; sticky hero pans inside it */}
        <div
          ref={panTrackRef}
          style={{ height: isMobile && panDistance > 0 ? `${panDistance}px` : undefined }}
        >
          <div
            ref={imageRef}
            className="overflow-hidden bg-[var(--color-background)] md:aspect-[11/5] md:relative sticky top-0"
            style={{
              height: isMobile ? '100dvh' : 'auto',
              width: '100vw',
            }}
          >
            {heroImageUrl && !imageError ? (
              <FadeImage
                src={heroImageUrl}
                alt="Aquarium hero"
                duration={500}
                className="block max-w-none"
                style={{
                  height: '100%',
                  width: isMobile ? mobilePanWidth : '100%',
                  objectFit: 'cover',
                  objectPosition: 'left center',
                  transform: isMobile ? `translateX(${translateX}px)` : undefined,
                  willChange: isMobile ? 'transform' : undefined,
                }}
                onError={() => setImageError(true)}
                onLoad={(e) => {
                  const img = e.currentTarget as HTMLImageElement
                  const containerHeight = imageRef.current?.clientHeight ?? 0
                  setRenderedImageWidth(measureRenderedImageWidth(img, containerHeight))
                  setHeroLoading(false)
                  setHeroLoaded(true)
                }}
              />
            ) : !heroLoading ? (
              <div
                className="h-full bg-gradient-to-r from-green-600 via-blue-500 to-orange-400 transition-opacity duration-500"
                style={{
                  width: isMobile ? mobilePanWidth : '100%',
                  transform: isMobile ? `translateX(${translateX}px)` : undefined,
                  opacity: heroLoaded ? 1 : 0,
                }}
              />
            ) : null}
          </div>
        </div>

        <div className="px-[var(--spacing-md)] md:px-[var(--spacing-lg)] py-[var(--spacing-xl)] flex items-center justify-center">
          <div ref={specsRef} className="w-full max-w-[85%] mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-center gap-[var(--spacing-md)] md:gap-[var(--spacing-xl)] text-rough">
              <div
                className="text-center py-[var(--spacing-md)]"
                style={{ transform: isMobile ? `translateX(-${specsSpacing}px)` : undefined }}
              >
                <h3 className="text-sm text-[var(--color-text-secondary)] mb-1">Tank Size</h3>
                <p className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)]">240L</p>
              </div>

              <div
                className="text-center py-[var(--spacing-md)]"
                style={{ transform: isMobile ? `translateX(${specsSpacing}px)` : undefined }}
              >
                <h3 className="text-sm text-[var(--color-text-secondary)] mb-1">Water Type</h3>
                <p className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)]">Freshwater</p>
              </div>

              <div
                className="text-center py-[var(--spacing-md)]"
                style={{ transform: isMobile ? `translateX(-${specsSpacing}px)` : undefined }}
              >
                <h3 className="text-sm text-[var(--color-text-secondary)] mb-1">Tank Type</h3>
                <p className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)]">Community</p>
              </div>

              <div
                className="text-center py-[var(--spacing-md)]"
                style={{ transform: isMobile ? `translateX(${specsSpacing}px)` : undefined }}
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
