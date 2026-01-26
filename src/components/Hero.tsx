import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

export default function Hero() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  })
  
  // Move text box down as user scrolls (parallax effect)
  const y = useTransform(scrollYProgress, [0, 1], [0, 200])
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0])

  const handleScrollDown = () => {
    // Scroll to next section (1 viewport height) - absolute position
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    })
  }

  return (
    <section ref={ref} className="relative flex items-center justify-center overflow-hidden" style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}>
      <div className="relative w-full max-w-full md:max-w-[66%]">
        
        {/* Image - Placeholder for testing */}
        <div className="relative aspect-[4/3] md:aspect-[16/9] overflow-hidden">
          <img 
            src="/images/hero/IMG_8015_web.webp" 
            alt="Hero"
            className="bg-image w-full h-full object-cover scale-125 md:scale-100"
          />
        </div>
        
        {/* Text Box - Top Left with Parallax */}
        <motion.div 
          style={{ y, opacity }}
          className="rough-border absolute -top-25 -left-[10px] md:top-0 md:-left-[17%] border border-[var(--color-text-primary)] p-[var(--spacing-md)] md:p-[var(--spacing-lg)] mt-0 md:mt-[var(--spacing-2xl)] ml-0 md:ml-[var(--spacing-md)] bg-transparent dark:bg-[rgba(0,0,0,0.25)]"
        >
          <h1 className="text-2xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-[var(--spacing-sm)] text-printed">
            Samuel Hendy
          </h1>
          <h2 className="text-base md:text-xl text-[var(--color-text-secondary)] mb-2 text-printed">
            Software/DevOps Engineer
          </h2>
          <h2 className="text-base md:text-xl text-[var(--color-text-secondary)] text-printed">
            Professional Project Starter
          </h2>
        </motion.div>
      </div>

      {/* Scroll Down Button - Now positioned relative to section */}
      <button
        onClick={handleScrollDown}
        className="rough-border absolute bottom-[6vh] md:bottom-32 left-1/2 -translate-x-1/2 w-16 h-16 border border-[var(--color-text-primary)] bg-transparent hover:bg-[var(--color-text-primary)] hover:text-[var(--color-background)] transition-colors flex items-center justify-center text-xl rotate-90"
        style={{ fontFamily: 'monospace' }}
        aria-label="Scroll down"
      >
        &gt;
      </button>
    </section>
  )
}
