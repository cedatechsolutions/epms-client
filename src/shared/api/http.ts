export type ApiValidationErrors = Record<string, string[]>

export type ApiErrorPayload = {
  message?: string
  errors?: ApiValidationErrors
}

export class ApiError extends Error {
  status: number
  data: ApiErrorPayload | null

  constructor(message: string, status: number, data: ApiErrorPayload | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function isFormData(body: BodyInit | null | undefined): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData
}

export async function httpRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')

  if (init.body && !isFormData(init.body) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  })

  const contentType = response.headers.get('content-type')
  const hasJson = contentType?.includes('application/json')
  const payload = hasJson ? await response.json() : null

  if (!response.ok) {
    const errorPayload = (payload ?? null) as ApiErrorPayload | null
    const message = errorPayload?.message ?? response.statusText ?? 'Request failed'
    throw new ApiError(message, response.status, errorPayload)
  }

  return payload as T
}
