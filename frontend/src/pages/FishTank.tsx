import ResidentSection from '../components/ResidentSection'
import TimelineSection from '../components/TimelineSection'
import FishTankHero from '../components/FishTankHero'

export default function FishTank() {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Hero Section */}
      <FishTankHero />

      {/* Timeline Section */}
      <TimelineSection />

      {/* Fish Section */}
      <ResidentSection 
        title="Fish"
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
