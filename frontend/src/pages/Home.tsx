import Hero from '../components/Hero'
import MainNav from '../components/MainNav'
import Feature from '../components/Feature'
import { usePageEnabled } from '../contexts/PageEnabledContext'

export default function Home() {
  const { pageEnabled } = usePageEnabled()

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Hero />
      <MainNav pageEnabled={pageEnabled} />
      <Feature pageEnabled={pageEnabled} />
    </div>
  )
}
