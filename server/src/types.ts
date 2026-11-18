/** 数据与领域类型（data.json 格式与 legacy V2 完全一致） */

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


