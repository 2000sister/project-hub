/** API 路由表：只做 URL → controller 映射，访问控制以中间件声明（契约与 legacy V2 一致） */
import Router from '@koa/router'
import type { AppContext, AppState } from './http/context.js'
import { editGuard, sessionGuard } from './middlewares/authGuard.js'
import {
  getState, postLogin, postLogout, postPasswords, postSetup
} from './controllers/authController.js'
import { getData, getLogs, postImport, postSave } from './controllers/dataController.js'

const router = new Router<AppState>({ prefix: '/api' })

/* ---------- 状态与登录（无需会话） ---------- */
router.get('/state', (ctx: AppContext) => getState(ctx))
router.post('/setup', (ctx: AppContext) => postSetup(ctx))
router.post('/login', (ctx: AppContext) => postLogin(ctx))
router.post('/logout', (ctx: AppContext) => postLogout(ctx))

/* ---------- 数据读写 ---------- */
router.get('/data', sessionGuard, (ctx: AppContext) => getData(ctx))
router.post('/save', sessionGuard, editGuard, (ctx: AppContext) => postSave(ctx))
router.post('/import', sessionGuard, editGuard, (ctx: AppContext) => postImport(ctx))

/* ---------- 口令管理（FR-15） ---------- */
router.post('/passwords', sessionGuard, editGuard, (ctx: AppContext) => postPasswords(ctx))

/* ---------- 操作日志（FR-14，仅编辑会话可看） ---------- */
router.get('/logs', sessionGuard, editGuard, (ctx: AppContext) => getLogs(ctx))

export default router
