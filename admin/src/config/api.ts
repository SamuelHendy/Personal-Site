import { getIdToken } from '../lib/auth'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const api = {
  admin: {
    watches: `${BASE_URL}/admin/watches`,
    watch: (brand: string, model: string) => `${BASE_URL}/admin/watches/${encodeURIComponent(brand)}/${encodeURIComponent(model)}`,
    config: (configType: string, configKey: string) => `${BASE_URL}/admin/config/${encodeURIComponent(configType)}/${encodeURIComponent(configKey)}`,
    imageUpload: `${BASE_URL}/admin/images/upload`,
    imageStatus: (path: string) => `${BASE_URL}/admin/images/status/${path}`,
  },
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getIdToken()
  
  const headers = new Headers(options.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  
  return fetch(url, {
    ...options,
    headers,
  })
}
