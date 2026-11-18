/** 文档存储模型：加载 / 单次写事务 / 原子落盘（EX-04 崩溃恢复） */
import fs from 'node:fs'
import { config } from '../config.js'
import type { Db } from '../types.js'

let db: Db | null = null

function emptyDb(): Db {
  return { version: 1, updatedAt: Date.now(), projects: [], auth: null, logs: [] }
}

function parseFile(file: string): Db | null {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as Db
  } catch {
    return null
  }
}

export function loadDb(): Db {
  db = parseFile(config.dataFile)
  if (db) {
    console.log('[data] 已加载数据文件，项目数:', db.projects.length)
    return db
  }
  db = parseFile(`${config.dataFile}.bak`)
  if (db) {
    console.log('[data] data.json 解析失败，已从 data.json.bak 恢复')
    return db
  }
  db = emptyDb()
  console.log('[data] 初始化空数据（首次启动将进入口令设置）')
  return db
}

/** 只读视图：未被事务包裹的代码不得修改返回值 */
export function readDb(): Db {
  return db ?? loadDb()
}

/** 数据变更版本号与时间戳（项目数据每次写入必调） */
export function stamp(draft: Db): void {
  draft.version += 1
  draft.updatedAt = Date.now()
}

/** 写事务：fn 内改动在 fn 正常返回后一次性落盘；抛错则整体丢弃 */
export function mutate<T>(fn: (draft: Db) => T): T {
  const draft = readDb()
  const result = fn(draft)
  persist(draft)
  return result
}

/** FR-04：原子落盘（写临时文件 + rename），写前留 .bak */
function persist(draft: Db): void {
  if (!fs.existsSync(config.dataDir)) fs.mkdirSync(config.dataDir, { recursive: true })
  try {
    if (fs.existsSync(config.dataFile)) fs.copyFileSync(config.dataFile, `${config.dataFile}.bak`)
  } catch {
    /* .bak 失败不阻断主流程 */
  }
  const tmp = `${config.dataFile}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(draft, null, 2))
  fs.renameSync(tmp, config.dataFile)
}
