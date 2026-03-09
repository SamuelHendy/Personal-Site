const BASE_URL = import.meta.env.VITE_API_URL || '/api'
const CDN_URL = import.meta.env.VITE_CDN_URL || '/cdn'

export const cdn = {
  albums: (path: string) => `${CDN_URL}/albums/${path}`,
  watches: (path: string) => `${CDN_URL}/watches/${path}`,
  fishtank: (path: string) => `${CDN_URL}/fishtank/${path}`,
}

export const api = {
  health: `${BASE_URL}/health`,
  albums: `${BASE_URL}/albums`,
  album: (name: string) => `${BASE_URL}/albums/${name}`,
  recentlyUpdated: (limit?: number) => `${BASE_URL}/recently-updated${limit ? `?limit=${limit}` : ''}`,
  funStuff: `${BASE_URL}/fun-stuff`,
  watches: `${BASE_URL}/watches`,
  watchDetail: (brand: string, model: string) => `${BASE_URL}/watches/${brand}/${model}`,
  fishtankResidents: (type: 'fish' | 'plant') => `${BASE_URL}/fishtank/residents?type=${type}`,
  fishtankTimeline: `${BASE_URL}/fishtank/timeline`,
  fishtankHero: `${BASE_URL}/fishtank/hero`,
  config: (configType: string, configKey: string) => `${BASE_URL}/config/${configType}/${configKey}`,
}
