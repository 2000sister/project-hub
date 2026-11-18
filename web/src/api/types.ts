/** 领域类型（与后端 data.json 结构一一对应） */

export interface Field {
  label: string
  value: string
  secret: boolean
}

export interface Entry {
  id: string
  type: string
  name: string
  note: string
  fields: Field[]
}

export interface Project {
  id: string
  name: string
  alias?: string
  tags?: string[]
  note?: string
  entries: Entry[]
  updatedAt: number
}

/** 连接条目类型模板（六类 + 自定义） */
export interface TypeTemplate {
  label: string
  icon: string
  fields: { label: string; secret: boolean }[]
}

export type Level = 'view' | 'edit'

export interface AuthState {
  setup: boolean
  authed: boolean
  level: Level | null
  lockRemaining: number
}

export interface DataResp {
  version: number
  projects: Project[]
  level: Level
}

export const TYPES: Record<string, TypeTemplate> = {
  web: { label: '网页地址', icon: '🌐', fields: [{ label: '地址', secret: false }, { label: '账号', secret: false }, { label: '密码', secret: true }] },
  remote: { label: '远程桌面/向日葵', icon: '🖥️', fields: [{ label: '设备ID/地址', secret: false }, { label: '连接密码', secret: true }, { label: '验证码', secret: true }] },
  jump: { label: '跳板机', icon: '🛰️', fields: [{ label: '地址', secret: false }, { label: '端口', secret: false }, { label: '账号', secret: false }, { label: '密码', secret: true }] },
  jenkins: { label: 'Jenkins', icon: '🤖', fields: [{ label: '地址', secret: false }, { label: '账号', secret: false }, { label: '密码/Token', secret: true }] },
  ssh: { label: 'SSH', icon: '🔑', fields: [{ label: '地址', secret: false }, { label: '端口', secret: false }, { label: '账号', secret: false }, { label: '密码/密钥', secret: true }] },
  custom: { label: '自定义', icon: '📌', fields: [{ label: '内容', secret: false }, { label: '密码/口令', secret: true }] }
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

/** 新建条目：按类型模板生成默认字段 */
export function mkEntry(type: string, name = ''): Entry {
  const t = TYPES[type] ?? TYPES.custom
  return {
    id: uid(), type, name: name || t.label, note: '',
    fields: t.fields.map((f) => ({ label: f.label, value: '', secret: f.secret }))
  }
}
