import Hero from '../components/Hero'
import MainNav from '../components/MainNav'
import Feature from '../components/Feature'

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Hero />
      <MainNav />
      <Feature />
    </div>
  )
}
