/** 登录锁定模型：按 IP 记录口令尝试次数（FR-13） */
import { config } from '../config.js'

interface Attempt {
  count: number
  until: number
}

const attempts = new Map<string, Attempt>()

export function lockRemainingMs(ip: string): number {
  const a = attempts.get(ip)
  return a && a.until > Date.now() ? a.until - Date.now() : 0
}

/** 记一次失败，返回剩余尝试次数；达到上限则锁定并重置计数 */
export function recordFailure(ip: string): number {
  const a = attempts.get(ip) ?? { count: 0, until: 0 }
  a.count += 1
  if (a.count >= config.lockLimit) {
    a.until = Date.now() + config.lockMs
    a.count = 0
  }
  attempts.set(ip, a)
  return config.lockLimit - a.count
}

export function clearFailures(ip: string): void {
  attempts.delete(ip)
}
