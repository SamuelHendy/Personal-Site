import { useState } from 'react'

interface FadeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  duration?: number
}

export default function FadeImage({ 
  className = '', 
  duration = 300,
  onLoad,
  onError,
  ...props 
}: FadeImageProps) {
  const [loaded, setLoaded] = useState(false)

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setLoaded(true)
    onLoad?.(e)
  }

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setLoaded(true) // Still show (or hide) on error
    onError?.(e)
  }

  return (
    <img
      {...props}
      className={`${className} transition-opacity`}
      style={{ 
        ...props.style,
        opacity: loaded ? 1 : 0,
        transitionDuration: `${duration}ms`
      }}
      onLoad={handleLoad}
      onError={handleError}
    />
  )
}
