import { useContext, useEffect } from 'react'
import { DataContext } from '../types/data'

export function useAlbums() {
  const context = useContext(DataContext)
  
  useEffect(() => {
    if (!context.albumsLoaded && !context.albumsLoading) {
      context.fetchAlbums()
    }
  }, [context])
  
  return {
    albums: context.albums,
    isLoading: context.albumsLoading,
    isLoaded: context.albumsLoaded
  }
}

export function useRecentAlbums() {
  const context = useContext(DataContext)
  
  useEffect(() => {
    if (!context.recentAlbumsLoaded && !context.recentAlbumsLoading) {
      context.fetchRecentAlbums()
    }
  }, [context])
  
  return {
    recentAlbums: context.recentAlbums,
    isLoading: context.recentAlbumsLoading,
    isLoaded: context.recentAlbumsLoaded
  }
}

export function useWatches() {
  const context = useContext(DataContext)
  
  useEffect(() => {
    if (!context.watchesLoaded && !context.watchesLoading) {
      context.fetchWatches()
    }
  }, [context])
  
  return {
    watches: context.watches,
    isLoading: context.watchesLoading,
    isLoaded: context.watchesLoaded
  }
}
