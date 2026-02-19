import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import AlbumCard from '../components/AlbumCard'
import { api } from '../config/api'

interface Album {
  name: string
  thumbnail: string
  img_count: number
  last_updated: string
}

export default function Albums() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(api.albums)
      .then(response => response.json())
      .then(data => {
        setAlbums(data)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching albums:', error)
        setLoading(false)
      })
  }, [])

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
