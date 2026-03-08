import { cdn } from '../config/api'

interface MobileWatchCardProps {
  modelId: string
  thumbnail?: string | null
  onClick?: () => void
}

export default function MobileWatchCard({
  modelId,
  thumbnail,
  onClick
}: MobileWatchCardProps) {
  // Generate a placeholder color based on modelId for visual distinction
  const colors = [
    'ef4444/ffffff', // red
    '3b82f6/ffffff', // blue
    '10b981/ffffff', // green
    'f59e0b/ffffff', // amber
    '8b5cf6/ffffff', // purple
    'ec4899/ffffff', // pink
    '06b6d4/ffffff', // cyan
    'f97316/ffffff', // orange
  ]
  const colorIndex = modelId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
  const imageUrl = thumbnail
    ? cdn.watches(thumbnail)
    : `https://placehold.co/900x1200/${colors[colorIndex]}?text=${modelId}`

  return (
    <div 
      className="relative group h-[90%] cursor-pointer transition-all duration-300"
      style={{ aspectRatio: '0.75' }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      data-watch-id={modelId}
    >
      {/* Rough border div - sibling approach */}
      <div className="rough-border absolute inset-0 border border-[var(--color-text-primary)] bg-[var(--color-background)] pointer-events-none" />
      
      {/* Content div */}
      <div className="relative overflow-hidden flex flex-col h-full">
        {/* Image */}
        <div className="w-full h-full relative p-2">
          <div className="w-full h-full overflow-hidden">
            <img
              src={imageUrl}
              alt="Watch"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
