export default function TallImageSection() {
  return (
    <section className="min-h-screen flex items-center px-[var(--spacing-lg)] py-[var(--spacing-xl)]">
      <div className="w-full max-w-[66%] mx-auto">
        
        {/* Wide horizontal image - 60% width, floated left */}
        <div className="w-[60%] float-left">
          <div className="aspect-[21/9] bg-[var(--color-surface)]">
            <img 
              src="/images/tall-section/main.jpg" 
              alt="Wide image"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Content area on the right (40% remaining space) */}
        <div className="ml-[60%] p-[var(--spacing-lg)]">
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-[var(--spacing-md)]">
            Section Title
          </h2>
          <p className="text-[var(--color-text-secondary)]">
            Content goes here...
          </p>
        </div>

        {/* Clear float */}
        <div className="clear-both"></div>

      </div>
    </section>
  )
}
