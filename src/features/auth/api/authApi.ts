import { getRequest, postRequest } from '@/shared/api/http'
import type {
  AuthResponse,
  AuthUser,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  ResetPasswordPayload,
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
