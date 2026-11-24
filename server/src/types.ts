/** 数据与领域类型（data.json 格式与 legacy V2 完全一致） */

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

export interface Auth {
  salt: string
  viewHash: string
  editHash: string
}

export interface LogItem {
  time: number
  level: string
  action: string
  target: string
}

export interface Db {
  version: number
  updatedAt: number
  projects: Project[]
  auth: Auth | null
  logs: LogItem[]
}

/** 口令级别：查看 / 编辑 */
export type Level = 'view' | 'edit'

export interface Session {
  token: string
  level: Level
  exp: number
}


