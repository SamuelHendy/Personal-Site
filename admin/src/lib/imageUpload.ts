const EXT_TO_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
}

/** Browsers sometimes leave file.type empty; infer from extension for the upload API. */
export function inferImageContentType(file: File): string {
  if (file.type.startsWith('image/')) return file.type
  const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? ''
  return EXT_TO_MIME[ext] ?? 'image/jpeg'
}

export async function uploadApiError(res: Response, fallback: string): Promise<Error> {
  try {
    const body = await res.json()
    if (typeof body?.error === 'string' && body.error) {
      return new Error(body.error)
    }
  } catch {
    // Response may not be JSON
  }
  return new Error(fallback)
}
