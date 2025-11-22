import { Link, useLocation } from 'react-router-dom'
import { cn } from '../lib/utils'

export default function Navigation() {
  const location = useLocation()
  
  const links = [
    { path: '/', label: 'Home' },
    { path: '/albums', label: 'Albums' },
    { path: '/watches', label: 'Watches' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-background)]/80 backdrop-blur-sm border-b border-[var(--color-border)]">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-[var(--color-text-primary)]">
            SH
          </Link>
          <div className="flex gap-6">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-lg transition-colors hover:text-[var(--color-text-primary)]",
                  location.pathname === link.path
                    ? "text-[var(--color-text-primary)] font-semibold"
                    : "text-[var(--color-text-secondary)]"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
