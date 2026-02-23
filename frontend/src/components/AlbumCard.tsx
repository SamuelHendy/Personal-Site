import { Link } from 'react-router-dom'
import { DirectionAwareHover } from './ui/direction-aware-hover'
import { cdn } from '../config/api'

interface AlbumCardProps {
  name: string
  display_name?: string | null
  thumbnail: string
  img_count: number
  last_updated?: string
  onClick?: () => void
}

export default function AlbumCard({ name, display_name, thumbnail, img_count, last_updated }: AlbumCardProps) {
  const imageUrl = cdn.albums(thumbnail)
  
  return (
    <Link to={`/albums/${name}`} className="block max-w-[400px] w-full">
      <div className="hover:bg-[var(--color-surface)] transition-colors cursor-pointer">
        {/* Border div with rough effect */}
        <div className="rough-border border border-[var(--color-text-primary)] p-2 aspect-square"></div>
        {/* Image content div overlaid on top with negative margin */}
        <div className="-mt-[100%] p-2">
          <DirectionAwareHover
            imageUrl={imageUrl}
            overlayImageUrl={imageUrl}
            className="aspect-square"
            showGradient={true}
            showLastUpdated={true}
            lastUpdated={last_updated}
            alwaysShowText={true}
          >
            <p className="text-sm font-bold text-rough">{(display_name || name)}</p>
            <p className="text-xs opacity-80 text-rough">{img_count} photos</p>
          </DirectionAwareHover>
        </div>
      </div>
    </Link>
  )
}
