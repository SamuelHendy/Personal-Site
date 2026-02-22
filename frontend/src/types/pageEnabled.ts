import { createContext } from 'react'

export interface PageEnabledConfig {
  watches?: boolean
  fishtank?: boolean
  albums?: boolean
}

export interface PageEnabledContextType {
  pageEnabled: PageEnabledConfig
  isLoaded: boolean
}

export const PageEnabledContext = createContext<PageEnabledContextType>({
  pageEnabled: {},
  isLoaded: false
})
