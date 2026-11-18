/** API 客户端：统一错误处理，401 自动跳登录 */
import type { AuthState, DataResp, Level, Project } from './types'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function request<T>(url: string, body?: unknown, method?: string): Promise<T> {
  const opt: RequestInit = { method: method ?? (body ? 'POST' : 'GET') }
  if (body) {
    opt.headers = { 'Content-Type': 'application/json' }
    opt.body = JSON.stringify(body)
  }
  const r = await fetch(url, opt)
  let j: Record<string, unknown> = {}
  try { j = await r.json() } catch { /* 空响应体 */ }
  if (!r.ok) throw new ApiError(r.status, (j.error as string) || `请求失败(${r.status})`)
  return j as T
}

export const api = {
  state: () => request<AuthState>('/api/state'),
  setup: (viewPassword: string, editPassword: string) =>
    request<{ level: Level }>('/api/setup', { viewPassword, editPassword }),
  login: (password: string) => request<{ level: Level }>('/api/login', { password }),
  logout: () => request<unknown>('/api/logout', {}),
  data: () => request<DataResp>('/api/data'),
  save: (projects: Project[], baseVersion: number, force = false) =>
    request<{ version: number }>('/api/save', { projects, baseVersion, force }),
  import: (projects: Project[]) =>
    request<{ version: number; count: number }>('/api/import', { projects }),
  passwords: (viewPassword: string, editPassword: string) =>
    request<unknown>('/api/passwords', { viewPassword, editPassword })
}
