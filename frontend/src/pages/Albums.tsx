import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import AlbumCard from '../components/AlbumCard'
import { api } from '../config/api'
import { usePageEnabled } from '../hooks/usePageEnabled'

interface Album {
  name: string
  thumbnail: string
  img_count: number
  last_updated: string
}

export default function Albums() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const { pageEnabled, isLoaded } = usePageEnabled()

  useEffect(() => {
    // Don't fetch until we know if page is enabled
    if (!isLoaded) return
    
    // If page is disabled, don't fetch albums
    if (pageEnabled.albums === false) return

    fetch(api.albums)
      .then(response => response.json())
      .then(data => {
        // Sort by last_updated (newest first), then alphabetically - date format is DD/MM/YYYY
        const sorted = data.sort((a: Album, b: Album) => {
          const [dayA, monthA, yearA] = a.last_updated.split('/')
          const [dayB, monthB, yearB] = b.last_updated.split('/')
          const dateA = new Date(parseInt(yearA), parseInt(monthA) - 1, parseInt(dayA))
          const dateB = new Date(parseInt(yearB), parseInt(monthB) - 1, parseInt(dayB))
          const dateDiff = dateB.getTime() - dateA.getTime()
          if (dateDiff !== 0) return dateDiff
          return a.name.localeCompare(b.name)
        })
        setAlbums(sorted)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching albums:', error)
        setLoading(false)
      })
  }, [isLoaded, pageEnabled.albums])

  if (pageEnabled.albums === false) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] px-[var(--spacing-md)] md:px-[var(--spacing-lg)] py-[var(--spacing-xl)]">
        <Link to="/" className="rough-border inline-flex items-center gap-2 border border-transparent text-[var(--color-text-primary)] hover:text-[var(--color-text-secondary)] transition-colors mb-8 w-fit">
          <ChevronRight size={24} className="rotate-180 -translate-y-0.5" />
          <span className="font-bold">Back to Home</span>
        </Link>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4 text-printed">Coming Soon</h1>
            <p className="text-[var(--color-text-secondary)]">The albums section is currently being prepared. Check back later!</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] px-[var(--spacing-md)] md:px-[var(--spacing-lg)] py-[var(--spacing-xl)]">
      <div className="mb-8">
        <Link to="/" className="rough-border flex items-center gap-2 border border-transparent text-[var(--color-text-primary)] hover:text-[var(--color-text-secondary)] transition-colors w-fit mb-4">
          <ChevronRight size={24} className="rotate-180 -translate-y-0.5" />
          <span className="font-bold">Back to Home</span>
        </Link>
        <div className="rough-border border border-transparent block w-fit">
          <h1 className="text-4xl font-bold text-printed">Albums</h1>
        </div>
      </div>
      <div className="max-w-[2000px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          // Loading placeholders
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rough-border aspect-square border border-[var(--color-text-primary)] bg-[var(--color-surface)] relative overflow-hidden"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl text-[var(--color-text-secondary)]">...</span>
              </div>
            </div>
          ))
        ) : (
          albums.map((album) => (
            <AlbumCard
              key={album.name}
              name={album.name}
              thumbnail={album.thumbnail}
              img_count={album.img_count}
              last_updated={album.last_updated}
            />
          ))
        )}
        </div>
      </div>
    </div>
  )
}
