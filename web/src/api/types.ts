/** 领域类型（与后端 data.json 结构一一对应） */

export interface Field {
  label: string
  value: string
  secret: boolean
}

/** 账号密码块：挂在资源（entry）下的更小单元，一个资源可有多组 */
export interface Credential {
  id: string
  /** 用途 / 归属，如「超级管理员」「惠南用户」；单账号时为空 */
  label: string
  username: string
  password: string
  note: string
}

export interface Entry {
  id: string
  type: string
  name: string
  note: string
  /** 资源自身的属性字段（地址、端口、库名…），不含账号密码 */
  fields: Field[]
  /** 账号密码块 */
  creds: Credential[]
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

/** 连接条目类型模板：fields 只含资源自身属性，账号密码统一走 creds */
export interface TypeTemplate {
  label: string
  /** Icon 组件的图形名；纯文本输出（分享）不带图形 */
  icon: string
  fields: { label: string; secret: boolean }[]
  /** 新建时默认生成一组空白账号块（纯账号类记录为 true，无登录概念的为 false） */
  defaultCred: boolean
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
  web: { label: '网页地址', icon: 'type-web', defaultCred: true, fields: [{ label: '地址', secret: false }] },
  remote: { label: '远程桌面/向日葵', icon: 'type-remote', defaultCred: true, fields: [{ label: '设备ID/地址', secret: false }, { label: '验证码', secret: true }] },
  jump: { label: '跳板机', icon: 'type-jump', defaultCred: true, fields: [{ label: '地址', secret: false }, { label: '端口', secret: false }] },
  jenkins: { label: 'Jenkins', icon: 'type-jenkins', defaultCred: true, fields: [{ label: '地址', secret: false }] },
  db: { label: '数据库', icon: 'type-db', defaultCred: true, fields: [{ label: '类型', secret: false }, { label: '地址', secret: false }, { label: '端口', secret: false }, { label: '库名', secret: false }] },
  ssh: { label: 'SSH', icon: 'type-ssh', defaultCred: true, fields: [{ label: '地址', secret: false }, { label: '端口', secret: false }] },
  custom: { label: '自定义', icon: 'type-custom', defaultCred: false, fields: [{ label: '内容', secret: false }] }
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

/** 新建账号块 */
export function mkCred(label = ''): Credential {
  return { id: uid(), label, username: '', password: '', note: '' }
}

/** 新建条目：按类型模板生成资源字段，需要登录的类型默认带一组空账号块 */
export function mkEntry(type: string, name = ''): Entry {
  const t = TYPES[type] ?? TYPES.custom
  return {
    id: uid(), type, name: name || t.label, note: '',
    fields: t.fields.map((f) => ({ label: f.label, value: '', secret: f.secret })),
    creds: t.defaultCred ? [mkCred()] : []
  }
}
