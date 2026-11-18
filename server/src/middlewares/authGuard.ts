/** 访问控制中间件：会话守卫与编辑权限守卫（FR-03，前端隐藏入口仅为体验） */
import type { Middleware } from 'koa'
import type { AppState } from '../http/context.js'
import { fail } from '../http/respond.js'
import { sessionFromCookie } from '../http/session.js'
import { mutate } from '../models/db.js'
import { appendLog } from '../models/log.js'

/** 需要登录：写入 ctx.state.session，未认证直接 401 */
export const sessionGuard: Middleware<AppState> = async (ctx, next) => {
  const session = sessionFromCookie(ctx)
  if (!session) {
    fail(ctx, 401, '会话无效或已过期')
    return
  }
  ctx.state.session = session
  await next()
}

/**
 * 需要编辑口令：必须叠在 sessionGuard 之后。
 * 越权写入留审计日志（与日志同事务落盘，便于事后核查）
 */
export const editGuard: Middleware<AppState> = async (ctx, next) => {
  const session = ctx.state.session
  if (!session) throw new Error('editGuard 必须叠在 sessionGuard 之后')
  if (session.level !== 'edit') {
    mutate((draft) => appendLog(draft, 'view', '越权写入被拒', ctx.path.replace('/api/', '')))
    fail(ctx, 403, '权限不足：需要编辑口令')
    return
  }
  await next()
}
