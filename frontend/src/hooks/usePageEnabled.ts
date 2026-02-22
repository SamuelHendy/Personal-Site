import { useContext } from 'react'
import { PageEnabledContext } from '../types/pageEnabled'

export function usePageEnabled() {
  return useContext(PageEnabledContext)
}
