import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { api } from '../config/api'
import { DataContext, type Album, type Watch } from '../types/data'

// Stale time in milliseconds (5 minutes)
const STALE_TIME = 5 * 60 * 1000

export function DataProvider({ children }: { children: ReactNode }) {
  // Albums state
  const [albums, setAlbums] = useState<Album[]>([])
  const [albumsLoading, setAlbumsLoading] = useState(false)
  const [albumsLoaded, setAlbumsLoaded] = useState(false)
  const albumsFetchedAt = useRef<number>(0)

  // Recent Albums state
  const [recentAlbums, setRecentAlbums] = useState<Album[]>([])
  const [recentAlbumsLoading, setRecentAlbumsLoading] = useState(false)
  const [recentAlbumsLoaded, setRecentAlbumsLoaded] = useState(false)
  const recentAlbumsFetchedAt = useRef<number>(0)

  // Watches state
  const [watches, setWatches] = useState<Watch[]>([])
  const [watchesLoading, setWatchesLoading] = useState(false)
  const [watchesLoaded, setWatchesLoaded] = useState(false)
  const watchesFetchedAt = useRef<number>(0)

  const fetchAlbums = useCallback(async () => {
    if (albumsLoaded || albumsLoading) return

    setAlbumsLoading(true)
    try {
      const response = await fetch(api.albums)
      const data = await response.json()
      
      // Sort by last_updated (newest first), then alphabetically
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
      setAlbumsLoaded(true)
      albumsFetchedAt.current = Date.now()
    } catch (error) {
      console.error('Error fetching albums:', error)
    } finally {
      setAlbumsLoading(false)
    }
  }, [albumsLoaded, albumsLoading])

  const fetchRecentAlbums = useCallback(async () => {
    if (recentAlbumsLoaded || recentAlbumsLoading) return

    setRecentAlbumsLoading(true)
    try {
      const limit = window.innerWidth >= 2000 ? 5 : 4
      const response = await fetch(api.recentlyUpdated(limit))
      const data = await response.json()
      setRecentAlbums(data)
      setRecentAlbumsLoaded(true)
      recentAlbumsFetchedAt.current = Date.now()
    } catch (error) {
      console.error('Error fetching recent albums:', error)
    } finally {
      setRecentAlbumsLoading(false)
    }
  }, [recentAlbumsLoaded, recentAlbumsLoading])

  const fetchWatches = useCallback(async () => {
    if (watchesLoaded || watchesLoading) return

    setWatchesLoading(true)
    try {
      const response = await fetch(api.watches)
      const data = await response.json()
      
      const watchesWithDates = data.map((watch: Omit<Watch, 'parsedDate' | 'pull_pile' | 'place_pile'>) => {
        const [day, month, year] = watch.Obtained_Date.split('/')
        const randomVertical = () => Math.floor(Math.random() * 21) - 10
        const randomTilt = () => Math.floor(Math.random() * 13) - 6
        
        return {
          ...watch,
          parsedDate: new Date(parseInt(year), parseInt(month) - 1, parseInt(day)),
          pull_pile: { vertical: randomVertical(), tilt: randomTilt() },
          place_pile: { vertical: randomVertical(), tilt: randomTilt() }
        }
      })
      
      const sortedData = watchesWithDates.sort((a: Watch, b: Watch) => {
        return b.parsedDate.valueOf() - a.parsedDate.valueOf()
      })
      
      setWatches(sortedData)
      setWatchesLoaded(true)
      watchesFetchedAt.current = Date.now()
    } catch (error) {
      console.error('Error fetching watches:', error)
    } finally {
      setWatchesLoading(false)
    }
  }, [watchesLoaded, watchesLoading])

  // Refetch stale data when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now()
        
        // Check if albums data is stale and was previously loaded
        if (albumsLoaded && now - albumsFetchedAt.current > STALE_TIME) {
          setAlbumsLoaded(false)
        }
        
        // Check if recent albums data is stale
        if (recentAlbumsLoaded && now - recentAlbumsFetchedAt.current > STALE_TIME) {
          setRecentAlbumsLoaded(false)
        }
        
        // Check if watches data is stale
        if (watchesLoaded && now - watchesFetchedAt.current > STALE_TIME) {
          setWatchesLoaded(false)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [albumsLoaded, recentAlbumsLoaded, watchesLoaded])

  return (
    <DataContext.Provider value={{
      albums,
      albumsLoading,
      albumsLoaded,
      fetchAlbums,
      recentAlbums,
      recentAlbumsLoading,
      recentAlbumsLoaded,
      fetchRecentAlbums,
      watches,
      watchesLoading,
      watchesLoaded,
      fetchWatches
    }}>
      {children}
    </DataContext.Provider>
  )
}
