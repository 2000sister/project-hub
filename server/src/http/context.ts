/** HTTP 边界的类型约定：全项目只有这一处引用 koa 的 Context */
import type Koa from 'koa'
import type { Session } from '../types.js'

/** 中间件写入 ctx.state，controller 读取 */
export interface AppState {
  /** 已认证会话；由 sessionGuard 中间件写入 */
  session?: Session
}

export type AppContext = Koa.ParameterizedContext<AppState>

/** 请求体按 JSON 对象读取（非对象一律视为空对象，交给 controller 报字段错误） */
export function bodyOf(ctx: AppContext): Record<string, unknown> {
  const body = ctx.request.body
  return body && typeof body === 'object' && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {}
}

/** 守卫路由专用：sessionGuard 保证已写入会话，缺失即装配错误，直接抛出让兜底暴露 */
export function sessionOf(ctx: AppContext): Session {
  const session = ctx.state.session
  if (!session) throw new Error('路由缺少 sessionGuard 中间件')
  return session
}
