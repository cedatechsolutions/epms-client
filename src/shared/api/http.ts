import axios from 'axios'
import { AxiosHeaders } from 'axios'
import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import {
  clearStoredTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
  setStoredTokens,
} from '@/features/auth/lib/tokenStorage'

export type ApiValidationErrors = Record<string, string[]>

export type ApiErrorPayload = {
  code?: string
  message?: string
  fields?: ApiValidationErrors
}

export class ApiError extends Error {
  status: number
  code: string | null
  fields: ApiValidationErrors | null
  data: ApiErrorPayload | null

  constructor(
    message: string,
    status: number,
    data: ApiErrorPayload | null = null,
    code: string | null = null,
    fields: ApiValidationErrors | null = null,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
    this.code = code
    this.fields = fields
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api').replace(/\/+$/, '')

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
})

let unauthorizedHandler: (() => void) | null = null

export function registerUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler

  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null
    }
  }
}

function applyAuthorizationHeader(config: InternalAxiosRequestConfig, accessToken: string) {
  if (config.headers && typeof config.headers.set === 'function') {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
    return config
  }

  config.headers = AxiosHeaders.from(config.headers)
  config.headers.set('Authorization', `Bearer ${accessToken}`)
  return config
}

apiClient.interceptors.request.use((config) => {
  const accessToken = getStoredAccessToken()
  if (!accessToken) {
    return config
  }
  return applyAuthorizationHeader(config, accessToken)
})

// --- Rotating-refresh handling -------------------------------------------------
// The access token is short-lived (15 min). On a 401 we attempt a single refresh
// (deduped across concurrent requests), then retry the original request once.

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean }

let refreshPromise: Promise<string | null> | null = null

function isAuthEndpoint(url: string | undefined): boolean {
  return Boolean(url && url.includes('/auth/'))
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) {
    return null
  }

  try {
    // Bare axios call so this request does not recurse through the interceptors.
    const response = await axios.post<{ accessToken: string; refreshToken: string }>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { headers: { Accept: 'application/json' } },
    )
    setStoredTokens(response.data.accessToken, response.data.refreshToken)
    return response.data.accessToken
  } catch {
    clearStoredTokens()
    return null
  }
}

function requestRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error)
    }

    const originalRequest = error.config as RetriableRequestConfig | undefined

    // Do not try to refresh for auth calls (login/refresh/reset) or after one attempt.
    if (!originalRequest || originalRequest._retry || isAuthEndpoint(originalRequest.url)) {
      clearStoredTokens()
      unauthorizedHandler?.()
      return Promise.reject(error)
    }

    const newAccessToken = await requestRefresh()
    if (!newAccessToken) {
      clearStoredTokens()
      unauthorizedHandler?.()
      return Promise.reject(error)
    }

    originalRequest._retry = true
    applyAuthorizationHeader(originalRequest, newAccessToken)
    return apiClient(originalRequest)
  },
)

type ApiRequestConfig<TData = unknown> = Omit<AxiosRequestConfig<TData>, 'baseURL' | 'url' | 'method'>

function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError<unknown>(error)) {
    const status = error.response?.status ?? 500
    const body = error.response?.data as { error?: ApiErrorPayload } & ApiErrorPayload | undefined

    // New envelope: {error:{code,message,fields}}. Fall back to legacy {message,errors}.
    const envelope = body?.error ?? body
    const code = envelope?.code ?? null
    const fields = envelope?.fields ?? (body as { errors?: ApiValidationErrors } | undefined)?.errors ?? null
    const message = envelope?.message ?? error.message ?? 'Request failed'

    return new ApiError(message, status, envelope ?? null, code, fields)
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 500, null)
  }

  return new ApiError('Request failed', 500, null)
}

async function request<TResponse, TData = unknown>(
  method: NonNullable<AxiosRequestConfig<TData>['method']>,
  path: string,
  data?: TData,
  config: ApiRequestConfig<TData> = {},
): Promise<TResponse> {
  try {
    const response = await apiClient.request<TResponse, AxiosResponse<TResponse>, TData>({
      ...config,
      url: path,
      method,
      data,
    })

    return response.data
  } catch (error) {
    throw normalizeApiError(error)
  }
}

export function getRequest<TResponse>(path: string, config: ApiRequestConfig = {}): Promise<TResponse> {
  return request<TResponse>('GET', path, undefined, config)
}

export function getBlobRequest(path: string, config: ApiRequestConfig = {}): Promise<Blob> {
  return request<Blob>('GET', path, undefined, {
    ...config,
    responseType: 'blob',
  })
}

export function postRequest<TResponse, TData = unknown>(
  path: string,
  data?: TData,
  config: ApiRequestConfig<TData> = {},
): Promise<TResponse> {
  return request<TResponse, TData>('POST', path, data, config)
}

export function putRequest<TResponse, TData = unknown>(
  path: string,
  data?: TData,
  config: ApiRequestConfig<TData> = {},
): Promise<TResponse> {
  return request<TResponse, TData>('PUT', path, data, config)
}

export function patchRequest<TResponse, TData = unknown>(
  path: string,
  data?: TData,
  config: ApiRequestConfig<TData> = {},
): Promise<TResponse> {
  return request<TResponse, TData>('PATCH', path, data, config)
}

export function deleteRequest<TResponse = void>(
  path: string,
  config: ApiRequestConfig = {},
): Promise<TResponse> {
  return request<TResponse>('DELETE', path, undefined, config)
}
