/** 会话模型：内存会话表（FR-12；服务重启后需重新登录） */
import { config } from '../config.js'
import type { Level, Session } from '../types.js'
import { randomHex } from '../utils/crypto.js'

const sessions = new Map<string, Session>()

export function createSession(level: Level): Session {
  const token = randomHex()
  const session: Session = { token, level, exp: Date.now() + config.sessionTtlMs }
  sessions.set(token, session)
  return session
}

/** 过期会话顺带清理；token 不存在返回 null */
export function findSession(token: string): Session | null {
  const session = sessions.get(token)
  if (!session) return null
  if (session.exp < Date.now()) {
    sessions.delete(token)
    return null
  }
  return session
}

export function destroySession(token: string): void {
  sessions.delete(token)
}

/** FR-15：修改口令后全部会话失效 */
export function destroyAllSessions(): void {
  sessions.clear()
}
