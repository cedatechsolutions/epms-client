import {
  deleteRequest,
  getBlobRequest,
  getRequest,
  postRequest,
  putRequest,
} from '@/shared/api/http'
import type {
  AuthResponse,
  AuthUser,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  ResetPasswordPayload,
  UpdateProfilePayload,
} from '../types'

type MessageResponse = {
  message: string
}

export function login(payload: LoginPayload): Promise<AuthResponse> {
  return postRequest<AuthResponse, LoginPayload>('/auth/login', payload)
}

export function getCurrentUser(): Promise<AuthUser> {
  return getRequest<AuthUser>('/users/me')
}

export function logout(): Promise<MessageResponse> {
  return postRequest<MessageResponse>('/auth/logout')
}

export function requestPasswordReset(payload: ForgotPasswordPayload): Promise<MessageResponse> {
  return postRequest<MessageResponse, ForgotPasswordPayload>('/auth/forgot-password', payload)
}

export function resetPassword(payload: ResetPasswordPayload): Promise<MessageResponse> {
  return postRequest<MessageResponse, ResetPasswordPayload>('/auth/reset-password', payload)
}

export function changePassword(payload: ChangePasswordPayload): Promise<MessageResponse> {
  return postRequest<MessageResponse, ChangePasswordPayload>('/auth/change-password', payload)
}

// --- self-service profile (the signed-in user's own account) ---

export function updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
  return putRequest<AuthUser, UpdateProfilePayload>('/users/me', payload)
}

export function uploadAvatar(file: File): Promise<AuthUser> {
  const formData = new FormData()
  formData.append('file', file)
  return postRequest<AuthUser, FormData>('/users/me/avatar', formData)
}

export function deleteAvatar(): Promise<AuthUser> {
  return deleteRequest<AuthUser>('/users/me/avatar')
}

/**
 * The photo is served behind the bearer token like every other upload, so it cannot be pointed at
 * from an `<img src>` directly — callers fetch the bytes and wrap them in an object URL.
 */
export function getAvatarBlob(): Promise<Blob> {
  return getBlobRequest('/users/me/avatar')
}
