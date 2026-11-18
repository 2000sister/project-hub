/** 会话 cookie 读写（HTTP 细节集中在此，模型层只认 token / level） */
import type { AppContext } from './context.js'
import { config } from '../config.js'
import { createSession, destroySession, findSession } from '../models/session.js'
import type { Level, Session } from '../types.js'

const COOKIE = 'hub_session'

export function sessionFromCookie(ctx: AppContext): Session | null {
  const token = ctx.cookies.get(COOKIE)
  return token ? findSession(token) : null
}

export function startSession(ctx: AppContext, level: Level): void {
  const session = createSession(level)
  ctx.cookies.set(COOKIE, session.token, {
    httpOnly: true,
    path: '/',
    maxAge: config.sessionTtlMs,
    sameSite: 'lax'
  })
}

export function endSession(ctx: AppContext): void {
  const token = ctx.cookies.get(COOKIE)
  if (token) destroySession(token)
  ctx.cookies.set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
}

/**
 * 客户端 IP（用于登录失败锁定与操作日志）。
 * 直连部署取 socket 地址；信任代理时取代理写入的 X-Real-IP / X-Forwarded-For 首项，
 * 否则反向代理之后所有请求都会算成同一个 IP，锁定会变成全站共享。
 */
export function remoteIp(ctx: AppContext): string {
  const realIp = config.trustProxy ? ctx.get('X-Real-IP') : ''
  const firstForwarded = config.trustProxy ? ctx.get('X-Forwarded-For').split(',')[0].trim() : ''
  const forwarded = realIp || firstForwarded
  return (forwarded || ctx.socket.remoteAddress || 'unknown').replace('::ffff:', '')
}
