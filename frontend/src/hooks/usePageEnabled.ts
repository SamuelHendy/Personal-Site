import { useContext } from 'react'
import { PageEnabledContext } from '../contexts/PageEnabledContext'

export function usePageEnabled() {
  return useContext(PageEnabledContext)
}
