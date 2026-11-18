/** 异常兜底：4xx（如请求体超限）按原状态码返回，其余统一 500 */
import type { Middleware } from 'koa'
import type { AppState } from '../http/context.js'

/** koa-bodyparser 等基于 http-errors 抛出的异常会带 status */
function httpStatusOf(e: unknown): number | null {
  if (!e || typeof e !== 'object' || !('status' in e)) return null
  const { status } = e
  return typeof status === 'number' && status >= 400 && status < 500 ? status : null
}

export const errorHandler: Middleware<AppState> = async (ctx, next) => {
  try {
    await next()
  } catch (e) {
    const message = (e as Error).message
    const status = httpStatusOf(e)
    if (!status) console.error('[server]', ctx.path, message)
    ctx.status = status ?? 500
    ctx.body = { error: status ? message : '服务内部错误' }
  }
}
