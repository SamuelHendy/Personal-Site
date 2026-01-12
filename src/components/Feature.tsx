import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { ChevronRight } from 'lucide-react'
import { DirectionAwareHover } from './ui/direction-aware-hover'

interface Album {
  name: string
  thumbnail: string
  img_count: number
  last_updated: string
}

export default function Feature() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  })

  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('https://3y8jxev5y3.execute-api.eu-west-2.amazonaws.com/api/recently_updated')
      .then(response => response.json())
      .then(data => {
        setAlbums(data)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching albums:', error)
        setLoading(false)
      })
  }, [])

  // Right image moves up and down
  const rightImageY = useTransform(scrollYProgress, [0, 1], [50, -50])
  
  // Button moves out to the right (starts hidden behind card)
  const buttonX = useTransform(scrollYProgress, [0, 0.5, 1], [-100, 0, 0])
  
  // Left image moves left to right
  const leftImageX = useTransform(scrollYProgress, [0, 1], [-30, 30])

  return (
    <section ref={ref} className="min-h-screen md:h-screen flex flex-col justify-center px-[var(--spacing-md)] md:px-[var(--spacing-lg)] relative overflow-visible py-[var(--spacing-xl)] md:py-0">
      <div className="w-full max-w-full md:max-w-[85%] mx-auto flex flex-col" style={{ minHeight: '80vh' }}>
        
        {/* Title */}
        <div className="mb-[var(--spacing-sm)] md:mb-[var(--spacing-md)]">
          <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)] text-printed">
            Recently Updated Albums
          </h2>
        </div>

        {/* Top - Album Icons */}
        <div className="flex-none grid grid-cols-2 md:flex md:items-end md:justify-start gap-[var(--spacing-md)] md:gap-[var(--spacing-2xl)] relative z-10">
          {loading ? (
            // Loading placeholders
            [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rough-border aspect-square w-full max-w-[250px] border border-[var(--color-text-primary)] bg-[var(--color-surface)] relative overflow-hidden"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl text-[var(--color-text-secondary)]">...</span>
                </div>
              </div>
            ))
          ) : (
            albums.map((album) => (
              <Link
                key={album.name}
                to={`/albums/${album.name}`}
                className="w-full md:max-w-[250px] rough-border border border-[var(--color-text-primary)] p-2"
              >
                <DirectionAwareHover
                  imageUrl={`https://shendy-albums.s3.eu-west-2.amazonaws.com/${album.thumbnail}`}
                  overlayImageUrl={`https://shendy-albums.s3.eu-west-2.amazonaws.com/${album.thumbnail}`}
                  className="aspect-square"
                  enableSepia={true}
                >
                  <p className="text-sm font-bold">{album.name.replace(/_/g, ' ')}</p>
                  <p className="text-xs opacity-80">{album.img_count} photos</p>
                </DirectionAwareHover>
              </Link>
            ))
          )}
        </div>

        {/* Bottom - Image, Card, and Button */}
        <div className="flex-1 flex flex-col md:flex-row items-center mt-[var(--spacing-lg)] md:mt-[var(--spacing-2xl)] relative gap-[var(--spacing-md)]">
          {/* Left Image - Landscape */}
          <motion.div 
            style={{ x: leftImageX, willChange: 'transform' }}
            className="w-full md:w-1/2 aspect-[3/2] bg-gradient-to-br from-purple-400 to-purple-600 overflow-hidden"
          >
            {/* <img 
              src="/images/featured/IMG_7765.jpg" 
              alt="Featured"
              className="bg-image w-full h-full object-cover"
            /> */}
          </motion.div>

          {/* Card and Button */}
          <div className="w-full md:w-[60%] ml-0 md:-ml-[35%] flex items-center gap-[var(--spacing-md)] z-10">
            {/* Card - Landscape, overlapping 1/3 into photo */}
            <div className="flex-1 rough-border border border-[var(--color-text-primary)] bg-[var(--color-background)] min-h-[200px] md:min-h-[250px] flex flex-col md:flex-row md:max-w-[66vw]">
              <div className="flex-1 p-[var(--spacing-md)] md:p-[var(--spacing-xl)] flex flex-col justify-center">
                <h3 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-[var(--spacing-sm)] md:mb-[var(--spacing-md)] text-printed">
                  Featured Project
                </h3>
                <p className="text-sm md:text-base text-[var(--color-text-secondary)]">
                  Project description goes here...
                </p>
              </div>
              <div className="w-full md:w-1/3 h-48 md:h-full bg-gradient-to-br from-orange-400 to-orange-600 overflow-hidden">
                {/* <img 
                  src="/images/featured/IMG_7976.jpg" 
                  alt="Project detail"
                  className="bg-image w-full h-full object-cover"
                /> */}
              </div>
            </div>

            {/* Right Button - Narrow, matches card height */}
            <motion.div style={{ x: buttonX, willChange: 'transform' }} className="hidden md:block self-stretch -z-10">
              <Link
                to="/albums"
                className="rough-border h-full w-16 border border-[var(--color-text-primary)] bg-[var(--color-background)] hover:bg-[var(--color-text-primary)] hover:text-[var(--color-background)] transition-colors flex flex-col items-center justify-center gap-2"
                aria-label="View more"
              >
                <span className="text-base font-bold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>See</span>
                <ChevronRight size={24} />
                <span className="text-base font-bold" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>More</span>
              </Link>
            </motion.div>
          </div>
        </div>

      </div>

      {/* Right Image - Portrait, positioned behind everything */}
      <motion.div 
        style={{ y: rightImageY, willChange: 'transform' }}
        className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-[30%] aspect-[3/4] bg-gradient-to-br from-pink-400 to-pink-600 overflow-hidden z-1"
      >
        {/* <img 
          src="/images/featured/IMG_8628-2.jpg" 
          alt="Featured detail"
          className="bg-image w-full h-full object-cover"
        /> */}
      </motion.div>

    </section>
  )
}
