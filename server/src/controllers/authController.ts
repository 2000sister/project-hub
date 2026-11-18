/** 认证用例：初始化口令、登录登出、修改口令（FR-01/02/12/13/15） */
import { config } from '../config.js'
import { bodyOf, type AppContext } from '../http/context.js'
import { fail, ok } from '../http/respond.js'
import { endSession, remoteIp, sessionFromCookie, startSession } from '../http/session.js'
import { mutate, readDb, stamp } from '../models/db.js'
import { appendLog } from '../models/log.js'
import { clearFailures, lockRemainingMs, recordFailure } from '../models/lockout.js'
import { createCredentials, updateCredentials, verifyPassword } from '../models/password.js'
import { seedProjects } from '../models/project.js'
import { destroyAllSessions } from '../models/session.js'

/** 读取可选口令字段：非字符串一律当未提供 */
function passwordField(body: Record<string, unknown>, key: string): string | undefined {
  const value = body[key]
  return typeof value === 'string' ? value : undefined
}

/** 状态与登录无需会话，前端据此决定进入设置向导 / 登录页 */
export function getState(ctx: AppContext): void {
  const session = sessionFromCookie(ctx)
  ctx.body = {
    setup: !readDb().auth,
    authed: !!session,
    level: session ? session.level : null,
    lockRemaining: lockRemainingMs(remoteIp(ctx))
  }
}

export function postSetup(ctx: AppContext): void {
  if (readDb().auth) {
    fail(ctx, 400, '口令已设置，请直接登录')
    return
  }
  const body = bodyOf(ctx)
  const viewPassword = passwordField(body, 'viewPassword')
  const editPassword = passwordField(body, 'editPassword')
  if (!viewPassword || !editPassword) {
    fail(ctx, 400, '两套口令均不能为空')
    return
  }
  mutate((draft) => {
    draft.auth = createCredentials(viewPassword, editPassword)
    if (config.seedOnSetup && !draft.projects.length) draft.projects = seedProjects()
    stamp(draft)
    appendLog(draft, 'system', '初始化口令', 'setup')
  })
  startSession(ctx, 'edit')
  ok(ctx, { level: 'edit' })
}

export function postLogin(ctx: AppContext): void {
  const auth = readDb().auth
  if (!auth) {
    fail(ctx, 400, '请先完成口令设置')
    return
  }
  const ip = remoteIp(ctx)
  const locked = lockRemainingMs(ip)
  if (locked) {
    fail(ctx, 429, `尝试次数过多，已锁定，剩余 ${Math.ceil(locked / 1000)} 秒`, {
      lockRemaining: locked
    })
    return
  }
  const level = verifyPassword(auth, passwordField(bodyOf(ctx), 'password') ?? '')
  if (!level) {
    const remain = recordFailure(ip)
    fail(ctx, 401, `口令错误（剩余尝试次数 ${remain}）`)
    return
  }
  clearFailures(ip)
  startSession(ctx, level)
  mutate((draft) => appendLog(draft, level, '登录', ip))
  ok(ctx, { level })
}

export function postLogout(ctx: AppContext): void {
  endSession(ctx)
  ok(ctx)
}

/** FR-15：改口令后所有会话失效（含改口令者自己），前端会跳回登录页 */
export function postPasswords(ctx: AppContext): void {
  const body = bodyOf(ctx)
  const viewPassword = passwordField(body, 'viewPassword')
  const editPassword = passwordField(body, 'editPassword')
  if (!viewPassword && !editPassword) {
    fail(ctx, 400, '至少提供一套新口令')
    return
  }
  const auth = readDb().auth
  if (!auth) {
    fail(ctx, 400, '口令未设置')
    return
  }
  mutate((draft) => {
    draft.auth = updateCredentials(auth, viewPassword, editPassword)
    appendLog(draft, 'edit', '修改口令', 'auth')
  })
  destroyAllSessions()
  ok(ctx)
}
