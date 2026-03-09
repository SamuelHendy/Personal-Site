import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import ResidentSection from '../components/ResidentSection'
import TimelineSection from '../components/TimelineSection'
import FishTankHero from '../components/FishTankHero'
import { usePageEnabled } from '../hooks/usePageEnabled'

export default function FishTank() {
  const { pageEnabled } = usePageEnabled()

  if (pageEnabled.fishtank === false) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] px-[var(--spacing-md)] md:px-[var(--spacing-lg)] py-[var(--spacing-xl)]">
        <Link to="/" className="rough-border inline-flex items-center gap-2 border border-transparent text-[var(--color-text-primary)] hover:text-[var(--color-text-secondary)] transition-colors mb-8 w-fit">
          <ChevronRight size={24} className="rotate-180 -translate-y-0.5" />
          <span className="font-bold">Back to Home</span>
        </Link>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4 text-printed">Coming Soon</h1>
            <p className="text-[var(--color-text-secondary)]">The fishtank section is currently being prepared. Check back later!</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Hero Section */}
      <FishTankHero />

      {/* Timeline Section */}
      <TimelineSection />

      {/* Inhabitants Section */}
      <ResidentSection 
        title="Inhabitants"
        type="fish"
      />

      {/* Plants Section */}
      <ResidentSection 
        title="Plants"
        type="plants"
      />

      {/* Future Plans Section */}
      {/* <FuturePlansSection /> */}
    </div>
  )
}
