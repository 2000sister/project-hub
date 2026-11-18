/** 操作日志模型（FR-14：不含口令值与字段明文） */
import { config } from '../config.js'
import type { Db } from '../types.js'

/** 只能在写事务内调用：日志与业务变更一并落盘 */
export function appendLog(draft: Db, level: string, action: string, target: unknown): void {
  draft.logs.unshift({ time: Date.now(), level, action, target: String(target ?? '') })
  if (draft.logs.length > config.logMax) draft.logs.length = config.logMax
}
