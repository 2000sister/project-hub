/** 统一响应形状：成功 { ok: true, ...data } / 失败 { error: string, ...extra } */
import type { AppContext } from './context.js'

export function ok(ctx: AppContext, data: Record<string, unknown> = {}): void {
  ctx.body = { ok: true, ...data }
}

export function fail(
  ctx: AppContext,
  status: number,
  error: string,
  extra: Record<string, unknown> = {}
): void {
  ctx.status = status
  ctx.body = { error, ...extra }
}
