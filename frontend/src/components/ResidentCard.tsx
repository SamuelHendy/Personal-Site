interface Resident {
  id: string
  name: string
  scientificName?: string
  images: string[]
  dateAdded: string
  dateRemoved?: string
  status: 'current' | 'past'
  notes?: string
}

interface ResidentCardProps {
  resident: Resident
  onClick: () => void
}

export default function ResidentCard({ resident, onClick }: ResidentCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  }

  return (
    <div 
      onClick={onClick}
      role="button"
      tabIndex={0}
      className="relative bg-[var(--color-surface)] overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Rough border overlay */}
      <div className="rough-border absolute inset-0 border border-[var(--color-text-primary)] pointer-events-none z-10" />
      
      {/* Image */}
      <div className="aspect-video overflow-hidden relative">
        <img 
          src={resident.images[0]} 
          alt={resident.name}
          className="w-full h-full object-cover"
        />
        {resident.status === 'past' && (
          <div className="absolute top-2 right-2 rough-border bg-[var(--color-background)] border border-[var(--color-text-primary)] px-2 py-1 z-10">
            <span className="text-xs font-bold text-[var(--color-text-secondary)]">Past</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative p-[var(--spacing-md)] text-rough">
        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">
          {resident.name}
        </h3>
        {resident.scientificName && (
          <p className="text-sm italic text-[var(--color-text-secondary)] mb-3">
            {resident.scientificName}
          </p>
        )}
        
        {resident.notes && (
          <p className="text-sm text-[var(--color-text-secondary)] mb-3">
            {resident.notes}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
          <span>Added: {formatDate(resident.dateAdded)}</span>
          {resident.dateRemoved && (
            <>
              <span>•</span>
              <span>Removed: {formatDate(resident.dateRemoved)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
