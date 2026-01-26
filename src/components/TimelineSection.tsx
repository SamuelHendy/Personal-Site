import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TimelineModal from './TimelineModal'
import MobileTimelineModal from './MobileTimelineModal'

interface TimelineEvent {
  id: string
  date: string
  title: string
  blurb: string
  description: string
  images: string[]
}

export default function TimelineSection() {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // TODO: Replace with actual data
  const events: TimelineEvent[] = [
    {
      id: '1',
      date: '2020-05-01',
      title: 'Tank Setup',
      blurb: 'Started the aquarium journey with initial setup',
      description: 'Started the aquarium journey with initial setup and cycling. Spent weeks researching the nitrogen cycle and ensuring water parameters were stable before adding any livestock. Set up filtration, lighting, and basic hardscape. The process began with thoroughly cleaning the tank and all equipment with dechlorinated water. I carefully positioned the substrate, creating a gentle slope from back to front to add depth and improve the visual appeal. The hardscape was arranged using natural materials, including carefully selected pieces of driftwood and smooth river rocks. Each piece was positioned to create natural-looking caves and hiding spots for future inhabitants. The filtration system was installed with biological, mechanical, and chemical media to ensure optimal water quality. I chose a high-quality LED lighting system with adjustable spectrum and intensity to support future plant growth. The cycling process took approximately six weeks, during which I regularly tested ammonia, nitrite, and nitrate levels. I added beneficial bacteria supplements and monitored the temperature daily to maintain stability. Throughout this period, I documented water parameters in a detailed log and made adjustments as needed. The patience during this initial phase proved crucial for the long-term success of the aquarium.',
      images: ['https://placehold.co/1200x800/2563eb/ffffff?text=Tank+Setup+1', 'https://placehold.co/1200x800/2563eb/ffffff?text=Tank+Setup+2']
    },
    {
      id: '2',
      date: '2020-08-15',
      title: 'First Fish',
      blurb: 'Added the first inhabitants after successful cycling',
      description: 'Added the first inhabitants after successful cycling. Started with hardy species to ensure the biological filtration was fully established. Monitored water parameters daily and performed regular water changes to maintain stability.',
      images: ['https://placehold.co/1200x800/059669/ffffff?text=First+Fish']
    },
    {
      id: '3',
      date: '2021-03-20',
      title: 'Major Rescape',
      blurb: 'Complete redesign with new hardscape and plants',
      description: 'Complete redesign with new hardscape and plant layout. Removed all existing decorations and replanted with a focus on creating natural-looking aquascapes. Added driftwood and rocks to create hiding spots and visual interest.',
      images: ['https://placehold.co/1200x800/dc2626/ffffff?text=Rescape+1', 'https://placehold.co/1200x800/dc2626/ffffff?text=Rescape+2', 'https://placehold.co/1200x800/dc2626/ffffff?text=Rescape+3']
    },
    {
      id: '4',
      date: '2022-01-10',
      title: 'Equipment Upgrade',
      blurb: 'Upgraded to canister filter and LED lighting',
      description: 'Upgraded to canister filter and LED lighting system. The new equipment provided better filtration capacity and more control over the lighting spectrum. This upgrade significantly improved plant growth and water clarity.',
      images: ['https://placehold.co/1200x800/7c3aed/ffffff?text=Equipment+Upgrade']
    },
    {
      id: '5',
      date: '2023-06-05',
      title: 'Community Expansion',
      blurb: 'Added new species to create a diverse community',
      description: 'Added new species to create a diverse community tank. Carefully selected compatible species that occupy different levels of the aquarium. The community now includes schooling fish, bottom dwellers, and centerpiece fish that coexist peacefully.',
      images: ['https://placehold.co/1200x800/ea580c/ffffff?text=Community+1', 'https://placehold.co/1200x800/ea580c/ffffff?text=Community+2']
    }
  ]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  }

  return (
    <>
      <section className="px-[var(--spacing-md)] md:px-[var(--spacing-lg)] py-[var(--spacing-xl)]">
        <div className="w-full max-w-[85%] mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-[var(--spacing-lg)] text-printed">
            Tank Timeline
          </h2>

          {/* Timeline */}
          <div className="relative">
            {/* Timeline line - solid for visible events */}
            <div className="absolute left-4 md:left-1/2 top-0 w-0.5 bg-[var(--color-text-primary)] rough-border" 
                 style={{ 
                   transform: 'translateX(-50%)',
                   height: '100%'
                 }}></div>

            {/* Timeline events */}
            <div className="space-y-[var(--spacing-xl)]">
              <AnimatePresence initial={false}>
              {events.slice(0, isExpanded ? events.length : 1).map((event, index) => {
                const isLeft = index % 2 === 0

                return (
                  <motion.div
                    key={event.id}
                    className={`relative flex ${isLeft ? 'md:justify-end' : 'md:justify-start'} justify-start`}
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 'var(--spacing-xl)' }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="group contents">
                      {/* Timeline stamp (button) */}
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="absolute left-4 md:left-1/2 top-0 rough-border w-8 h-8 border-2 border-[var(--color-text-primary)] bg-[var(--color-background)] group-hover:bg-[var(--color-text-primary)] group-hover:scale-110 transition-all z-10 flex items-center justify-center origin-center -translate-x-1/2"
                        aria-label={`View ${event.title}`}
                      >
                        <div className="w-3 h-3 bg-[var(--color-text-primary)] group-hover:bg-[var(--color-background)] transition-colors"></div>
                      </button>

                      {/* Connecting line */}
                      <div 
                        className={`absolute top-4 h-0.5 bg-[var(--color-text-primary)] hidden md:block rough-border`}
                        style={{
                          left: isLeft ? 'auto' : 'calc(50% + 1.5rem)',
                          right: isLeft ? 'calc(50% + 1.5rem)' : 'auto',
                          width: '1rem',
                          transform: 'translateY(-50%)',
                        }}
                      ></div>

                      {/* Event card */}
                      <div className={`ml-16 md:ml-0 ${isLeft ? 'md:mr-[calc(50%+3rem)]' : 'md:ml-[calc(50%+3rem)]'} w-full md:w-auto md:max-w-[500px]`}>
                        <button
                          onClick={() => setSelectedEvent(event)}
                          className="rough-border w-full border border-[var(--color-text-primary)] bg-[var(--color-surface)] p-[var(--spacing-md)] group-hover:bg-[var(--color-background)] transition-colors text-left"
                        >
                        <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                          {formatDate(event.date)}
                        </p>
                        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                          {event.title}
                        </h3>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          {event.blurb.length > 100 ? `${event.blurb.substring(0, 100)}...` : event.blurb}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-3 italic">
                          Click to view photos →
                        </p>
                      </button>
                    </div>
                    </div>
                  </motion.div>
                )
              })}
              </AnimatePresence>
            </div>

            {/* Expand/Collapse button */}
            <div className="relative -mt-6" style={{ height: '48px' }}>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute left-4 md:left-1/2 top-0 rough-border w-12 h-12 border-2 border-[var(--color-text-primary)] bg-[var(--color-background)] hover:bg-[var(--color-text-primary)] hover:scale-110 transition-all flex items-center justify-center group z-10 origin-center -translate-x-1/2 md:-translate-x-1/2"
                aria-label={isExpanded ? "Collapse timeline" : "Expand full timeline"}
              >
                <svg 
                  className="w-6 h-6 text-[var(--color-text-primary)] group-hover:text-[var(--color-background)] transition-colors" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  {isExpanded ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Modal */}
      <AnimatePresence>
        {selectedEvent && (
          isMobile ? (
            <MobileTimelineModal
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
            />
          ) : (
            <TimelineModal
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
            />
          )
        )}
      </AnimatePresence>
    </>
  )
}
