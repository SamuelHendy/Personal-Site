import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import ImageModal from '../components/ImageModal'

export default function AlbumDetail() {
  const { albumName } = useParams<{ albumName: string }>()
  const [imagePaths, setImagePaths] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [thumbnailRect, setThumbnailRect] = useState<DOMRect | null>(null)
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!albumName) return

    const apiUrl = `https://3y8jxev5y3.execute-api.eu-west-2.amazonaws.com/api/album/${albumName}`
    console.log('Fetching album:', albumName)
    console.log('API URL:', apiUrl)

    fetch(apiUrl)
      .then(response => {
        console.log('Response status:', response.status)
        if (!response.ok) {
          throw new Error('Album not found')
        }
        return response.json()
      })
      .then(data => {
        console.log('Album data received:', data)
        // API returns an array of image path strings
        setImagePaths(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching album:', error)
        setError(error.message)
        setLoading(false)
      })
  }, [albumName])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] px-[var(--spacing-md)] md:px-[var(--spacing-lg)] py-[var(--spacing-xl)]">
        <div className="flex items-center justify-center min-h-[50vh]">
          <span className="text-2xl text-[var(--color-text-secondary)]">Loading album...</span>
        </div>
      </div>
    )
  }

  if (error || imagePaths.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] px-[var(--spacing-md)] md:px-[var(--spacing-lg)] py-[var(--spacing-xl)]">
        <Link to="/albums" className="rough-border inline-flex items-center gap-2 border border-transparent text-[var(--color-text-primary)] hover:text-[var(--color-text-secondary)] transition-colors mb-8 w-fit">
          <ChevronRight size={24} className="rotate-180 -translate-y-0.5" />
          <span className="font-bold">Back to Albums</span>
        </Link>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4 text-printed">Album not found</h1>
            <p className="text-[var(--color-text-secondary)]">{error || 'The album you are looking for does not exist.'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] px-[var(--spacing-md)] md:px-[var(--spacing-lg)] py-[var(--spacing-xl)]">
      {/* Back button and title */}
      <div className="mb-8">
        <Link to="/albums" className="rough-border flex items-center gap-2 border border-transparent text-[var(--color-text-primary)] hover:text-[var(--color-text-secondary)] transition-colors w-fit mb-4">
          <ChevronRight size={24} className="rotate-180 -translate-y-0.5" />
          <span className="font-bold">Back to Albums</span>
        </Link>
        <div className="rough-border border border-transparent block w-fit">
          <h1 className="text-4xl font-bold text-printed">{albumName?.replace(/_/g, ' ')}</h1>
        </div>
        <p className="text-[var(--color-text-secondary)] mt-4">{imagePaths.length} photos</p>
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {imagePaths.map((imagePath: string, index: number) => {
          const imageUrl = `https://shendy-albums.s3.eu-west-2.amazonaws.com/${imagePath}`
          return (
            <div
              key={index}
              className="rough-border aspect-square border border-[var(--color-text-primary)] bg-[var(--color-surface)] overflow-hidden hover:scale-105 transition-transform cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                setThumbnailRect(rect)
                setSelectedImage(imageUrl)
              }}
            >
              <motion.img
                src={imageUrl}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                initial={{ opacity: 0 }}
                animate={{ opacity: loadedImages.has(index) ? 1 : 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                onLoad={() => {
                  setLoadedImages(prev => new Set(prev).add(index))
                }}
              />
            </div>
          )
        })}
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <ImageModal
            imageUrl={selectedImage}
            onClose={() => setSelectedImage(null)}
            thumbnailRect={thumbnailRect || undefined}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
