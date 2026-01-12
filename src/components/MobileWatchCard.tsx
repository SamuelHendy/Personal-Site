interface MobileWatchCardProps {
  modelId: string
  onClick?: () => void
}

export default function MobileWatchCard({
  modelId,
  onClick
}: MobileWatchCardProps) {
  const imageUrl = `https://placehold.co/600x800/e5e5e5/525252?text=Watch`

  return (
    <div 
      className="rough-border border border-[var(--color-text-primary)] bg-[var(--color-background)] overflow-hidden flex flex-col relative group h-[90%] cursor-pointer"
      style={{ aspectRatio: '0.75' }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      data-watch-id={modelId}
    >
      {/* Image */}
      <div className="bg-[var(--color-surface)] overflow-hidden w-full h-full relative">
        <img
          src={imageUrl}
          alt="Watch"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
      </div>
    </div>
  )
}
