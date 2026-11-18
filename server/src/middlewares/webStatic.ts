/** 前端静态资源托管：web/dist + SPA 回退（生产模式） */
import fs from 'node:fs'
import path from 'node:path'
import type { Middleware } from 'koa'
import { config } from '../config.js'

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.map': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

/** 目录穿越防护：解析结果必须落在 dist 目录内，且命中真实文件 */
function resolveTarget(rel: string): string {
  const file = path.resolve(config.webDist, rel)
  const inside = file.startsWith(config.webDist) && fs.existsSync(file) && fs.statSync(file).isFile()
  return inside ? file : path.resolve(config.webDist, 'index.html')
}

export const webStatic: Middleware = async (ctx, next) => {
  if (ctx.path.startsWith('/api/')) return next()
  if (ctx.method !== 'GET' && ctx.method !== 'HEAD') return next()
  if (!fs.existsSync(config.webDist)) {
    ctx.status = 503
    ctx.body = '前端尚未构建：请先执行 cd web && npm run build（开发模式请用 npm run dev 走 Vite 5219 端口）'
    return
  }
  const rel = ctx.path === '/' ? 'index.html' : ctx.path.replace(/^\/+/, '')
  const target = resolveTarget(rel)
  ctx.type = MIME[path.extname(target).toLowerCase()] ?? 'application/octet-stream'
  ctx.body = fs.createReadStream(target)
}
