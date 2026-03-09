import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import ResidentCard from './ResidentCard'
import ResidentModal from './ResidentModal'
import { api, cdn } from '../config/api'

interface Resident {
  id: string
  name: string
  scientificName?: string
  images: string[]
  dateAdded: string
  dateRemoved?: string
  status: 'current' | 'past'
  quantity?: number
  notes?: string
}

interface ApiResident {
  Type: string
  Id: string
  Name?: string
  ScientificName?: string
  AddedDate?: string
  IsActive?: boolean
  Status?: 'current' | 'past'
  Quantity?: number
  Notes?: string
  Images?: string[]
  Thumbnail?: string
}

interface ResidentSectionProps {
  title: string
  type: 'fish' | 'plants'
}

export default function ResidentSection({ title, type }: ResidentSectionProps) {
  const [showPast, setShowPast] = useState(false)
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null)
  const [residents, setResidents] = useState<Resident[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const apiType = type === 'fish' ? 'fish' : 'plant'
        const res = await fetch(api.fishtankResidents(apiType))
        if (!res.ok) throw new Error('Failed to fetch')
        const data: ApiResident[] = await res.json()
        
        // Transform API data to component format, filter to only visible (IsActive)
        const transformed: Resident[] = data
          .filter(r => r.IsActive !== false)
          .map(r => ({
            id: r.Id,
            name: r.Name || r.Id,
            scientificName: r.ScientificName,
            images: (r.Images || []).map(img => cdn.fishtank(img)),
            dateAdded: r.AddedDate || '',
            status: r.Status || 'current',
            quantity: r.Quantity,
            notes: r.Notes,
          }))
        
        // Sort: inhabitants by quantity (descending), plants alphabetically
        if (apiType === 'fish') {
          transformed.sort((a, b) => (b.quantity || 1) - (a.quantity || 1))
        } else {
          transformed.sort((a, b) => a.name.localeCompare(b.name))
        }
        
        setResidents(transformed)
      } catch (err) {
        console.error('Failed to fetch residents:', err)
        setResidents([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchResidents()
  }, [type])

  // Filter by current/past based on toggle
  const filteredResidents = residents.filter(resident => {
    if (showPast) {
      return true
    }
    return resident.status === 'current'
  })

  // Count current and past
  const currentCount = residents.filter(r => r.status === 'current').length
  const pastCount = residents.filter(r => r.status === 'past').length

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
        {loading ? (
          <div className="text-center py-[var(--spacing-xl)]">
            <p className="text-xl text-[var(--color-text-secondary)]">Loading...</p>
          </div>
        ) : (
          <>
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
          </>
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
