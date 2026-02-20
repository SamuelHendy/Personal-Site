import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api } from '../config/api'

export interface DisplayConfig {
  Dial_Colour?: boolean
  Case_Width?: boolean
  Movement_Type?: boolean
  Movement_Name?: boolean
  Manufactured_Year?: boolean
  Obtained_Date?: boolean
  Description?: boolean
  Purchase_Price?: boolean
  Acquired_From?: boolean
  Beats_Per_Hour?: boolean
  Glass?: boolean
  Case_Material?: boolean
  Caseback_Window?: boolean
  Lug_Width?: boolean
  Acquired_Condition?: boolean
}

interface DisplayConfigContextType {
  watchesConfig: DisplayConfig
  isLoading: boolean
}

const DisplayConfigContext = createContext<DisplayConfigContextType | null>(null)

export function DisplayConfigProvider({ children }: { children: ReactNode }) {
  const [watchesConfig, setWatchesConfig] = useState<DisplayConfig>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch(api.config('display_config', 'watches'))
      .then(res => res.json())
      .then(data => {
        delete data.ConfigType
        delete data.ConfigKey
        setWatchesConfig(data)
      })
      .catch(() => setWatchesConfig({}))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <DisplayConfigContext.Provider value={{ watchesConfig, isLoading }}>
      {children}
    </DisplayConfigContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDisplayConfig() {
  const context = useContext(DisplayConfigContext)
  if (!context) {
    throw new Error('useDisplayConfig must be used within a DisplayConfigProvider')
  }
  return context
}

// Helper to check if a field should be shown (defaults to false)
// eslint-disable-next-line react-refresh/only-export-components
export function shouldShowField(config: DisplayConfig, field: keyof DisplayConfig): boolean {
  return config[field] ?? false
}
