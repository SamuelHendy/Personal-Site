export default function FuturePlansSection() {
  return (
    <section className="min-h-screen flex items-center justify-center px-[var(--spacing-md)] md:px-[var(--spacing-lg)] py-[var(--spacing-xl)]">
      <div className="w-full max-w-[85%] mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-[var(--spacing-lg)] text-printed">
          Future Plans
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--spacing-lg)]">
          {/* Plan 1 */}
          <div className="rough-border border border-[var(--color-text-primary)] bg-[var(--color-surface)] overflow-hidden">
            <div className="aspect-video overflow-hidden">
              <img 
                src="/images/fishtank/future-1.jpg" 
                alt="Future plan"
                className="bg-image w-full h-full object-cover"
              />
            </div>
            <div className="p-[var(--spacing-md)]">
              <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                Aquascape Redesign
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Planning a complete rescape with hardscape and carpet plants
              </p>
            </div>
          </div>

          {/* Plan 2 */}
          <div className="rough-border border border-[var(--color-text-primary)] bg-[var(--color-surface)] overflow-hidden">
            <div className="aspect-video overflow-hidden">
              <img 
                src="/images/fishtank/future-2.jpg" 
                alt="Future plan"
                className="bg-image w-full h-full object-cover"
              />
            </div>
            <div className="p-[var(--spacing-md)]">
              <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                New Species
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Adding a school of ember tetras to the community
              </p>
            </div>
          </div>

          {/* Plan 3 */}
          <div className="rough-border border border-[var(--color-text-primary)] bg-[var(--color-surface)] overflow-hidden">
            <div className="aspect-video overflow-hidden">
              <img 
                src="/images/fishtank/future-3.jpg" 
                alt="Future plan"
                className="bg-image w-full h-full object-cover"
              />
            </div>
            <div className="p-[var(--spacing-md)]">
              <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                CO2 System
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Installing pressurized CO2 for better plant growth
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
