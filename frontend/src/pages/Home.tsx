import Hero from '../components/Hero'
import MainNav from '../components/MainNav'
import Feature from '../components/Feature'
import QRCodeModal from '../components/QRCodeModal'
import { usePageEnabled } from '../hooks/usePageEnabled'

export default function Home() {
  const { pageEnabled } = usePageEnabled()

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <QRCodeModal instagramHandle="sam.hendy_" linkedinHandle="samuel-hendy-958773179" />
      <Hero />
      <MainNav pageEnabled={pageEnabled} />
      <Feature pageEnabled={pageEnabled} />
    </div>
  )
}
