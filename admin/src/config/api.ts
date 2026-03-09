import { getIdToken } from '../lib/auth'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'
const CDN_URL = import.meta.env.VITE_CDN_URL || '/cdn'

export const cdn = {
  albums: (path: string) => `${CDN_URL}/albums/${path}`,
  watches: (path: string) => `${CDN_URL}/watches/${path}`,
  fishtank: (path: string) => `${CDN_URL}/fishtank/${path}`,
}

export const api = {
  // Public APIs (same as frontend)
  albums: `${BASE_URL}/albums`,
  album: (name: string) => `${BASE_URL}/albums/${name}`,
  albumWithThumbnail: (name: string) => `${BASE_URL}/albums/${name}?include_thumbnail=true`,
  watches: `${BASE_URL}/watches`,
  watchDetail: (brand: string, model: string) => `${BASE_URL}/watches/${brand}/${model}`,
  
  // Admin APIs
  admin: {
    watches: `${BASE_URL}/admin/watches`,
    watch: (brand: string, model: string) => `${BASE_URL}/admin/watches/${encodeURIComponent(brand)}/${encodeURIComponent(model)}`,
    albums: `${BASE_URL}/admin/albums`,
    album: (albumName: string) => `${BASE_URL}/admin/albums/${encodeURIComponent(albumName)}`,
    config: (configType: string, configKey: string) => `${BASE_URL}/admin/config/${encodeURIComponent(configType)}/${encodeURIComponent(configKey)}`,
    imageUpload: `${BASE_URL}/admin/images/upload`,
    imageStatus: (path: string) => `${BASE_URL}/admin/images/status/${path}`,
    imageDelete: `${BASE_URL}/admin/images/delete`,
    metrics: `${BASE_URL}/admin/metrics`,
    metricsTraffic: (days: number) => `${BASE_URL}/admin/metrics?type=traffic&days=${days}`,
    metricsPages: `${BASE_URL}/admin/metrics?type=pages`,
    metricsApi: `${BASE_URL}/admin/metrics?type=api`,
  },
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getIdToken()
  
  const headers = new Headers(options.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  
  return fetch(url, {
    ...options,
    headers,
  })
}
