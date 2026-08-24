import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center px-[var(--spacing-md)] md:px-[var(--spacing-lg)]">
      <div className="w-full text-center">
        <h1 className="text-8xl md:text-9xl font-bold text-[var(--color-text-primary)] mb-[var(--spacing-md)] text-printed">
          404
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-[var(--spacing-sm)] text-printed">
          Page Not Found
        </h2>
        <p className="text-lg text-[var(--color-text-secondary)] mb-[var(--spacing-xl)]">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link 
          to="/" 
          className="relative inline-flex items-center gap-2 bg-[var(--color-background)] hover:bg-[var(--color-text-primary)] hover:text-[var(--color-background)] transition-colors px-6 py-3"
        >
          <span
            className="rough-border absolute inset-0 border border-[var(--color-text-primary)] pointer-events-none"
            aria-hidden="true"
          />
          <ChevronRight size={24} className="relative rotate-180 -translate-y-0.5" />
          <span className="relative font-bold">Back to Home</span>
        </Link>
      </div>
    </div>
  )
}
