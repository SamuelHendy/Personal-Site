import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TimelineModal from './TimelineModal'
import MobileTimelineModal from './MobileTimelineModal'
import { api, cdn } from '../config/api'

interface TimelineEvent {
  id: string
  date: string
  title: string
  blurb: string
  description: string
  images: string[]
  eventType?: string
}

interface ApiTimelineEvent {
  Id: string
  Date: string
  Title: string
  Description?: string
  EventType?: string
  IsHidden?: boolean
  Images?: string[]
  Thumbnail?: string
}

export default function TimelineSection() {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const res = await fetch(api.fishtankTimeline)
        if (!res.ok) throw new Error('Failed to fetch')
        const data: ApiTimelineEvent[] = await res.json()
        
        // Transform API data, filter hidden events, sort by date descending
        const transformed: TimelineEvent[] = data
          .filter(e => !e.IsHidden)
          .map(e => ({
            id: e.Id,
            date: e.Date,
            title: e.Title,
            blurb: e.Description?.substring(0, 100) || '',
            description: e.Description || '',
            images: (e.Images || []).map(img => cdn.fishtank(img)),
            eventType: e.EventType,
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        
        setEvents(transformed)
      } catch (err) {
        console.error('Failed to fetch timeline:', err)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchTimeline()
  }, [])

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
          {loading ? (
            <div className="text-center py-[var(--spacing-xl)]">
              <p className="text-xl text-[var(--color-text-secondary)]">Loading...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-[var(--spacing-xl)]">
              <p className="text-xl text-[var(--color-text-secondary)]">No timeline events yet</p>
            </div>
          ) : (
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
                          {event.images.length > 0 ? 'Click to view photos →' : 'Read more →'}
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
          )}
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
