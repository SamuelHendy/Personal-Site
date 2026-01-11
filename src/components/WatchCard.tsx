interface WatchCardProps {
  brand: string
  model: string
  modelId: string
  dialColour: string
  caseWidth: number
  movementType: string
  manufacturedYear: string
  obtainedDate: string
  darkName: boolean
  pullPile?: {
    vertical: number
    tilt: number
  }
  placePile?: {
    vertical: number
    tilt: number
  }
  debugPosition?: number
  debugMode?: boolean
  onClick?: () => void
  isClickable?: boolean
}

export default function WatchCard({
  brand,
  model,
  modelId,
  dialColour,
  caseWidth,
  movementType,
  manufacturedYear,
  obtainedDate,
  darkName,
  pullPile,
  placePile,
  debugPosition,
  debugMode,
  onClick,
  isClickable
}: WatchCardProps) {
  const imageUrl = `https://shendy-albums.s3.eu-west-2.amazonaws.com/Watches/${modelId}.jpg`

  return (
    <div 
      className={`rough-border border border-[var(--color-text-primary)] bg-[var(--color-background)] overflow-hidden h-full flex flex-col relative ${isClickable ? 'group' : ''}`}
      style={{ width: '320px' }}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {/* Debug Display */}
      {debugMode && (
        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 font-bold text-sm z-50 rounded space-y-1">
          {debugPosition !== undefined && (
            <div>Pos: {debugPosition.toFixed(2)}</div>
          )}
          {pullPile && (
            <div className="text-xs">
              Pull: V{pullPile.vertical} T{pullPile.tilt}
            </div>
          )}
          {placePile && (
            <div className="text-xs">
              Place: V{placePile.vertical} T{placePile.tilt}
            </div>
          )}
        </div>
      )}
      
      {/* Image */}
      <div className="bg-[var(--color-surface)] overflow-hidden" style={{ width: '320px', height: '400px' }}>
        <img
          src={imageUrl}
          alt={`${brand} ${model}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
      </div>
      
      {/* Info */}
      <div className="flex-none p-4 space-y-2">
        <div>
          <h3 className={`text-xl font-bold ${darkName ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-primary)]'}`}>
            {brand}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">{model}</p>
        </div>
        
        <div className="text-xs text-[var(--color-text-secondary)] space-y-1">
          <div className="flex justify-between">
            <span>Acquired:</span>
            <span className="font-semibold">{obtainedDate}</span>
          </div>
          <div className="flex justify-between">
            <span>Dial:</span>
            <span className="font-semibold">{dialColour}</span>
          </div>
          <div className="flex justify-between">
            <span>Case:</span>
            <span className="font-semibold">{caseWidth}mm</span>
          </div>
          <div className="flex justify-between">
            <span>Movement Type:</span>
            <span className="font-semibold">{movementType}</span>
          </div>
          <div className="flex justify-between">
            <span>Year:</span>
            <span className="font-semibold">{manufacturedYear}</span>
          </div>
        </div>
        
        {/* Pile data for testing - only show in debug mode */}
        {debugMode && pullPile && placePile && (
          <div className="mt-3 pt-3 border-t border-[var(--color-text-primary)] text-xs">
            <div className="font-bold mb-1">Pull Pile:</div>
            <div className="flex gap-3 mb-2">
              <span>V: {pullPile.vertical}</span>
              <span>T: {pullPile.tilt}</span>
            </div>
            <div className="font-bold mb-1">Place Pile:</div>
            <div className="flex gap-3">
              <span>V: {placePile.vertical}</span>
              <span>T: {placePile.tilt}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
