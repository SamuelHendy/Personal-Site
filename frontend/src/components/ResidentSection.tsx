import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import ResidentCard from './ResidentCard'
import ResidentModal from './ResidentModal'

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

interface ResidentSectionProps {
  title: string
  type: 'fish' | 'plants'
}

export default function ResidentSection({ title, type }: ResidentSectionProps) {
  const [showPast, setShowPast] = useState(false)
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null)

  // TODO: Replace with actual data fetching
  const mockResidents: Resident[] = [
    {
      id: '1',
      name: 'Neon Tetra',
      scientificName: 'Paracheirodon innesi',
      images: [
        'https://placehold.co/1200x800/3b82f6/ffffff?text=Neon+Tetra+1',
        'https://placehold.co/1200x800/2563eb/ffffff?text=Neon+Tetra+2'
      ],
      dateAdded: '2020-06-15',
      status: 'current',
      notes: 'School of 10, very active and colorful'
    },
    {
      id: '2',
      name: 'Java Fern',
      scientificName: 'Microsorum pteropus',
      images: ['https://placehold.co/1200x800/10b981/ffffff?text=Java+Fern'],
      dateAdded: '2020-05-20',
      status: 'current',
      notes: 'Low light, easy care plant'
    },
    {
      id: '3',
      name: 'Guppy',
      scientificName: 'Poecilia reticulata',
      images: [
        'https://placehold.co/1200x800/f59e0b/ffffff?text=Guppy+1',
        'https://placehold.co/1200x800/ea580c/ffffff?text=Guppy+2',
        'https://placehold.co/1200x800/dc2626/ffffff?text=Guppy+3'
      ],
      dateAdded: '2019-08-10',
      dateRemoved: '2021-03-15',
      status: 'past',
      notes: 'Colorful and active, bred successfully'
    }
  ]

  // First filter by type
  const residentsByType = mockResidents.filter(resident => {
    if (type === 'fish') {
      return resident.scientificName?.includes('Paracheirodon') || resident.scientificName?.includes('Poecilia')
    } else {
      return resident.scientificName?.includes('Microsorum')
    }
  })

  // Then filter by current/past based on toggle
  const filteredResidents = residentsByType.filter(resident => {
    if (showPast) {
      return true
    }
    return resident.status === 'current'
  })

  // Count current and past for this specific type
  const currentCount = residentsByType.filter(r => r.status === 'current').length
  const pastCount = residentsByType.filter(r => r.status === 'past').length

  return (
    <section className="flex items-center justify-center px-[var(--spacing-md)] md:px-[var(--spacing-lg)] py-[var(--spacing-lg)]">
      <div className="w-full max-w-[85%] mx-auto">
        {/* Header with toggle */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-[var(--spacing-lg)] gap-4">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] text-printed">
            {title}
          </h2>
          
          <div className="flex items-center gap-4 justify-end md:justify-start">
            <p className="text-sm text-[var(--color-text-secondary)]">
              {showPast ? `${currentCount} current, ${pastCount} past` : `${currentCount} current`}
            </p>
            <button
              onClick={() => setShowPast(!showPast)}
              className={`rough-border px-4 py-2 border border-[var(--color-text-primary)] transition-colors ${
                showPast
                  ? 'bg-[var(--color-text-primary)] text-[var(--color-background)]'
                  : 'bg-[var(--color-background)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
              }`}
            >
              <span className="font-semibold">{showPast ? 'Hide Past' : 'Show Past'}</span>
            </button>
          </div>
        </div>

        {/* Residents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--spacing-lg)]">
          {filteredResidents.map((resident) => (
            <ResidentCard
              key={resident.id}
              resident={resident}
              onClick={() => setSelectedResident(resident)}
            />
          ))}
        </div>

        {filteredResidents.length === 0 && (
          <div className="text-center py-[var(--spacing-xl)]">
            <p className="text-xl text-[var(--color-text-secondary)]">
              No {showPast ? 'past' : 'current'} {title.toLowerCase()} to display
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedResident && (
          <ResidentModal
            resident={selectedResident}
            onClose={() => setSelectedResident(null)}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
