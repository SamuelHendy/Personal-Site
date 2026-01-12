import { Link } from 'react-router-dom'
import { Linkedin, Github, Instagram, Music, Camera, ChevronRight } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

export default function MainNav() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })

  const handleScrollDown = () => {
    // Scroll one viewport height down with slower speed
    window.scrollBy({ top: window.innerHeight, behavior: 'smooth' })
  }
  
  // Parallax transforms
  const albumsX = useTransform(scrollYProgress, [0, 1], [-30, 30])
  const watchesX = useTransform(scrollYProgress, [0, 1], [-60, 60])
  const socialY = useTransform(scrollYProgress, [0, 1], [50, -50])
  const photoX = useTransform(scrollYProgress, [0, 1], [0, -40])
  const panoramicX = useTransform(scrollYProgress, [0, 1], [-40, 40])

  return (
    <section ref={ref} className="min-h-screen flex flex-col justify-center px-[var(--spacing-md)] md:px-[var(--spacing-lg)] pt-[var(--spacing-lg)] pb-[var(--spacing-xl)] relative">
      <div className="relative max-w-[384px] md:max-w-none mx-auto w-full">
      <div className="w-full md:max-w-[85%] md:mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-32">
        
        {/* Left Side - Navigation Buttons */}
        <div className="flex flex-col gap-[var(--spacing-md)] justify-center order-2 md:order-1">
          <motion.div style={{ x: albumsX }}>
            <Link 
              to="/albums"
              className="rough-border border border-[var(--color-text-primary)] p-[var(--spacing-md)] text-[var(--color-text-primary)] hover:bg-[var(--color-text-primary)] hover:text-[var(--color-background)] transition-colors block flex items-center justify-between"
            >
              <h2 className="text-2xl font-bold">View all Albums</h2>
              <ChevronRight size={24} />
            </Link>
          </motion.div>
          
          <motion.div style={{ x: watchesX }} className="w-full md:w-2/3">
            <Link 
              to="/watches"
              className="rough-border border border-[var(--color-text-primary)] p-[var(--spacing-md)] text-[var(--color-text-primary)] hover:bg-[var(--color-text-primary)] hover:text-[var(--color-background)] transition-colors block flex items-center justify-between"
            >
              <h2 className="text-2xl font-bold">Watches</h2>
              <ChevronRight size={24} />
            </Link>
          </motion.div>
        </div>

        {/* Right Side - Photo with Social Icons */}
        <div className="relative order-1 md:order-2 w-full md:w-auto md:ml-auto">
          {/* Photo - Mobile version with offset to counteract parallax */}
          <motion.div 
            style={{ x: photoX }}
            className="aspect-[2/1] bg-gradient-to-br from-blue-400 to-blue-600 md:hidden translate-x-[20px]"
          >
            {/* <img 
              src="/images/main-nav/IMG_8647.jpg" 
              alt="Profile"
              className="bg-image w-full h-full object-cover"
            /> */}
          </motion.div>
          {/* Photo - Desktop version with full parallax */}
          <motion.div 
            style={{ x: photoX }}
            className="aspect-[2/1] bg-gradient-to-br from-blue-400 to-blue-600 ml-8 hidden md:block"
          >
            {/* <img 
              src="/images/main-nav/IMG_8647.jpg" 
              alt="Profile"
              className="bg-image w-full h-full object-cover"
            /> */}
          </motion.div>

          {/* Social Icons Box - Overlapping bottom left */}
          <motion.div 
            style={{ y: socialY }}
            className="rough-border absolute -top-[60vh] md:-top-135 md:top-auto md:bottom-0 md:left-0 md:right-auto -right-[10px] md:right-auto -translate-x-0 md:-translate-x-[20%] translate-y-0 md:translate-y-[20%] border border-[var(--color-text-primary)] p-[var(--spacing-sm)] md:p-[var(--spacing-md)]"
          >
            <div className="grid grid-cols-3 gap-[var(--spacing-sm)]">
              {/* Row 1 - 3 icons */}
              {/* LinkedIn */}
              <a 
                href="https://linkedin.com/in/your-profile" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-[var(--color-background)] border border-[var(--color-text-primary)] flex items-center justify-center hover:bg-[#0A66C2] hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
              {/* GitHub */}
              <a 
                href="https://github.com/SamuelHendy" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-[var(--color-background)] border border-[var(--color-text-primary)] flex items-center justify-center hover:bg-[#24292e] hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github size={20} />
              </a>
              {/* Instagram */}
              <a 
                href="https://instagram.com/your-profile" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-[var(--color-background)] border border-[var(--color-text-primary)] flex items-center justify-center hover:bg-gradient-to-br hover:from-[#833AB4] hover:via-[#FD1D1D] hover:to-[#F77737] hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              
              {/* Row 2 - 2 icons (centered) */}
              {/* Unsplash */}
              <a 
                href="https://unsplash.com/@your-profile" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-[var(--color-background)] border border-[var(--color-text-primary)] flex items-center justify-center hover:bg-black dark:hover:bg-[#F5F5F5] hover:text-white dark:hover:text-black transition-colors col-start-1"
                aria-label="Unsplash"
              >
                <Camera size={20} />
              </a>
              {/* Spotify */}
              <a 
                href="https://open.spotify.com/user/your-profile" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-[var(--color-background)] border border-[var(--color-text-primary)] flex items-center justify-center hover:bg-[#1DB954] hover:text-white transition-colors col-start-2"
                aria-label="Spotify"
              >
                <Music size={20} />
              </a>
            </div>
          </motion.div>
        </div>

      </div>

      {/* Extra wide image - 80% width, moved left and down */}
      <div className="w-full md:max-w-[85%] md:mx-auto mt-8 md:mt-40">
        <motion.div 
          style={{ x: panoramicX }}
          className="w-full md:w-[80%] ml-0 md:-ml-[8%]"
        >
          <div className="aspect-[2/1] md:aspect-[9/1] bg-gradient-to-r from-green-400 to-green-600">
            {/* <img 
              src="/images/main-nav/IMG_7916.jpg" 
              alt="Wide panoramic"
              className="bg-image w-full h-full object-cover"
              style={{ objectPosition: 'center 37%' }}
            /> */}
          </div>
        </motion.div>
      </div>

      </div>

      {/* Scroll Down Button - Positioned at bottom of MainNav section */}
      <button
        onClick={handleScrollDown}
        className="rough-border absolute bottom-[5.5%] md:bottom-32 left-1/2 -translate-x-1/2 w-16 h-16 border border-[var(--color-text-primary)] bg-transparent hover:bg-[var(--color-text-primary)] hover:text-[var(--color-background)] transition-colors flex items-center justify-center text-xl rotate-90"
        style={{ fontFamily: 'monospace' }}
        aria-label="Scroll down"
      >
        &gt;
      </button>

    </section>
  )
}
