import { createContext } from 'react'

export interface Album {
  name: string
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
  parsedDate: Date
  pull_pile: { vertical: number; tilt: number }
  place_pile: { vertical: number; tilt: number }
}

export interface DataContextType {
  // Albums
  albums: Album[]
  albumsLoading: boolean
  albumsLoaded: boolean
  fetchAlbums: () => Promise<void>
  
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
  albumsLoaded: false,
  fetchAlbums: async () => {},
  
  recentAlbums: [],
  recentAlbumsLoading: false,
  recentAlbumsLoaded: false,
  fetchRecentAlbums: async () => {},
  
  watches: [],
  watchesLoading: false,
  watchesLoaded: false,
  fetchWatches: async () => {}
})
