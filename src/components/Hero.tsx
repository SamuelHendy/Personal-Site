export default function Hero() {
  return (
    <section className="min-h-screen flex justify-center px-[var(--spacing-lg)] pb-[var(--spacing-lg)]">
      <div className="relative w-full max-w-[66%]">
        {/* Image */}
        <div className="relative aspect-[16/9] bg-[var(--color-surface)] overflow-hidden">
          {/* Add your hero image to: /public/images/hero/main.jpg */}
          <img 
            src="/images/hero/main.jpg" 
            alt="Hero"
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Text Box - Top Left */}
        <div className="absolute top-0 left-0 bg-[var(--color-surface-elevated)]/90 backdrop-blur-sm border-2 border-[var(--color-text-primary)] p-[var(--spacing-lg)] m-[var(--spacing-md)]">
          <h1 className="text-[var(--font-size-4xl)] font-bold text-[var(--color-text-primary)] mb-[var(--spacing-xs)]">
            Samuel Hendy
          </h1>
          <h2 className="text-[var(--font-size-xl)] text-[var(--color-text-secondary)] mb-1">
            Amateur Software Dev
          </h2>
          <h2 className="text-[var(--font-size-xl)] text-[var(--color-text-secondary)]">
            Professional Project Starter
          </h2>
        </div>
      </div>
    </section>
  )
}
