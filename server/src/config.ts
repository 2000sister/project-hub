/** 全局配置（PRD-ProjectHub v1.1：技术栈 Koa+TS） */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** 布尔环境变量的接受写法：字符串字面量查表，未收录的取值一律报错 */
const ENV_FLAG_BY_VALUE: Record<string, boolean | undefined> = {
  '1': true,
  true: true,
  on: true,
  yes: true,
  '0': false,
  false: false,
  off: false,
  no: false
}

/**
 * 布尔环境变量：1/true/on/yes 为真，0/false/off/no 为假，未设置或空串为假。
 * 其它取值直接抛错——避免 `HUB_TRUST_PROXY=true` 这类写法被静默当成 false。
 */
function envFlag(name: string): boolean {
  const raw = (process.env[name] ?? '').trim().toLowerCase()
  if (!raw) return false
  const known = Object.hasOwn(ENV_FLAG_BY_VALUE, raw)
  if (!known) {
    throw new Error(
      `${name} 取值无效：${JSON.stringify(process.env[name])}，可用 1/true/on/yes 或 0/false/off/no`
    )
  }
  return ENV_FLAG_BY_VALUE[raw] === true
}

export const config = {
  /** 服务端口（环境变量 HUB_PORT 可覆盖） */
  port: Number(process.env.HUB_PORT || 5218),
  /** 项目根目录（project-hub/） */
  rootDir: path.resolve(__dirname, '../..'),
  /** 数据目录与文件（与 V2 legacy 版格式完全兼容） */
  dataDir: path.resolve(__dirname, '../../data'),
  dataFile: path.resolve(__dirname, '../../data/data.json'),
  /** 前端构建产物目录（npm run build 后生成） */
  webDist: path.resolve(__dirname, '../../web/dist'),
  /** FR-12：会话有效期 24h（估算，可配置） */
  sessionTtlMs: 24 * 3600 * 1000,
  /** FR-13：连续错误 5 次锁定 10 分钟 */
  lockLimit: 5,
  lockMs: 10 * 60 * 1000,
  /** FR-14：操作日志保留条数（估算值） */
  logMax: 500,
  /**
   * 是否部署在反向代理之后（HUB_TRUST_PROXY=true/1/on/yes）。
   * 开启后客户端 IP 取代理写入的 X-Real-IP / X-Forwarded-For，
   * 否则一律用 socket 地址——防止客户端伪造头绕过按 IP 的登录锁定。
   */
  trustProxy: envFlag('HUB_TRUST_PROXY'),
  /** 请求体大小上限 */
  bodyLimitBytes: 5 * 1024 * 1024,
  /** 首次启动 setup 时是否写入示例项目（可编辑删除） */
  seedOnSetup: true
} as const
