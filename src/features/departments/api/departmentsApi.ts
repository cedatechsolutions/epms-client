import { getRequest, patchRequest, postRequest } from '@/shared/api/http'
import type { Department } from '@/features/auth/types'

const DEPARTMENTS_ENDPOINT = '/departments'

export type DepartmentPayload = {
  code: string
  name: string
  active?: boolean
}

/**
 * Active departments for pickers and labels. `includeInactive` only takes effect for the admin;
 * the server ignores it for everyone else.
 */
export async function listDepartments(includeInactive = false): Promise<Department[]> {
  return getRequest<Department[]>(DEPARTMENTS_ENDPOINT, {
    params: includeInactive ? { includeInactive: true } : undefined,
  })
}

export async function createDepartment(payload: DepartmentPayload): Promise<Department> {
  return postRequest<Department, DepartmentPayload>(DEPARTMENTS_ENDPOINT, payload)
}

export async function updateDepartment(id: string, payload: DepartmentPayload): Promise<Department> {
  return patchRequest<Department, DepartmentPayload>(`${DEPARTMENTS_ENDPOINT}/${id}`, payload)
}
