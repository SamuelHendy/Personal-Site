import { createContext, useState, useEffect, type ReactNode } from 'react'
import { api } from '../config/api'

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

export function PageEnabledProvider({ children }: { children: ReactNode }) {
  const [pageEnabled, setPageEnabled] = useState<PageEnabledConfig>({})
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    fetch(api.config('page_enabled', 'root'))
      .then(res => res.json())
      .then(data => {
        delete data.ConfigType
        delete data.ConfigKey
        delete data.message
        setPageEnabled(data)
        setIsLoaded(true)
      })
      .catch(() => {
        setPageEnabled({})
        setIsLoaded(true)
      })
  }, [])

  return (
    <PageEnabledContext.Provider value={{ pageEnabled, isLoaded }}>
      {children}
    </PageEnabledContext.Provider>
  )
}
