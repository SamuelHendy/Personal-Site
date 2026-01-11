import { Link } from 'react-router-dom'
import { DirectionAwareHover } from './ui/direction-aware-hover'

interface AlbumCardProps {
  name: string
  thumbnail: string
  img_count: number
  last_updated?: string
  onClick?: () => void
}

export default function AlbumCard({ name, thumbnail, img_count, last_updated }: AlbumCardProps) {
  const imageUrl = `https://shendy-albums.s3.eu-west-2.amazonaws.com/${thumbnail}`
  
  return (
    <Link to={`/albums/${name}`} className="block">
      <div className="rough-border border border-[var(--color-text-primary)] p-2 hover:bg-[var(--color-surface)] transition-colors cursor-pointer">
        <DirectionAwareHover
          imageUrl={imageUrl}
          overlayImageUrl={imageUrl}
          className="aspect-square"
          showGradient={true}
          showLastUpdated={true}
          lastUpdated={last_updated}
          alwaysShowText={true}
        >
          <p className="text-sm font-bold">{name.replace(/_/g, ' ')}</p>
          <p className="text-xs opacity-80">{img_count} photos</p>
        </DirectionAwareHover>
      </div>
    </Link>
  )
}
