import { createContext } from 'react'

export interface Album {
  name: string
  display_name?: string | null
  thumbnail: string
  img_count: number
  last_updated: string
}

export interface Watch {
  Brand: string
  Model: string
  Dial_Colour: string
  Case_Width: number
  Movement_Type: string
  Movement_Name?: string
  Manufactured_Year: string
  Obtained_Date: string
  Description?: string
  Purchase_Price?: string | number
  Acquired_From?: string
  Beats_Per_Hour?: number
  Glass?: string
  Case_Material?: string
  Caseback_Window?: boolean
  Lug_Width?: number
  Acquired_Condition?: string
  Is_Favourite?: boolean
  Thumbnail?: string | null
  parsedDate: Date
  pull_pile: { vertical: number; tilt: number }
  place_pile: { vertical: number; tilt: number }
}

export interface DataContextType {
  // Albums (paginated)
  albums: Album[]
  albumsLoading: boolean
  albumsHasMore: boolean
  fetchAlbums: () => Promise<void>
  fetchMoreAlbums: () => Promise<void>
  resetAlbums: () => void
  
  // Recent Albums
  recentAlbums: Album[]
  recentAlbumsLoading: boolean
  recentAlbumsLoaded: boolean
  fetchRecentAlbums: () => Promise<void>
  
  // Watches
  watches: Watch[]
  watchesLoading: boolean
  watchesLoaded: boolean
  fetchWatches: () => Promise<void>
}

export const DataContext = createContext<DataContextType>({
  albums: [],
  albumsLoading: false,
  albumsHasMore: true,
  fetchAlbums: async () => {},
  fetchMoreAlbums: async () => {},
  resetAlbums: () => {},
  
  recentAlbums: [],
  recentAlbumsLoading: false,
  recentAlbumsLoaded: false,
  fetchRecentAlbums: async () => {},
  
  watches: [],
  watchesLoading: false,
  watchesLoaded: false,
  fetchWatches: async () => {}
})
