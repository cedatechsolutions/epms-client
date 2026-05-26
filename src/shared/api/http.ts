import axios from 'axios'
import { AxiosHeaders } from 'axios'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import { clearStoredAccessToken, getStoredAccessToken } from '@/features/auth/lib/tokenStorage'

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

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api').replace(/\/+$/, '')

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
})

let unauthorizedHandler: (() => void) | null = null

apiClient.interceptors.request.use((config) => {
  const accessToken = getStoredAccessToken()

  if (!accessToken) {
    return config
  }

  if (config.headers && typeof config.headers.set === 'function') {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
    return config
  }

  config.headers = AxiosHeaders.from(config.headers)
  config.headers.set('Authorization', `Bearer ${accessToken}`)

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearStoredAccessToken()
      unauthorizedHandler?.()
    }

    return Promise.reject(error)
  },
)

export function registerUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler

  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null
    }
  }
}

type ApiRequestConfig<TData = unknown> = Omit<AxiosRequestConfig<TData>, 'baseURL' | 'url' | 'method'>

function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const status = error.response?.status ?? 500
    const data = error.response?.data ?? null
    const message = data?.message ?? error.message ?? 'Request failed'
    return new ApiError(message, status, data)
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
