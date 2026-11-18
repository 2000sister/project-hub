/** 入口：加载数据 → 装配应用 → 监听并在控制台打印访问方式 */
import fs from 'node:fs'
import { createApp } from './app.js'
import { config } from './config.js'
import { loadDb } from './models/db.js'
import { listShareableAddresses } from './utils/network.js'

function printBanner(): void {
  const shareable = listShareableAddresses()
  console.log('==========================================')
  console.log('  Project Hub 服务已启动（Vue3 + TS + Koa）')
  console.log(`  本机访问:   http://localhost:${config.port}`)
  shareable.forEach((ip) => {
    console.log(`  局域网访问: http://${ip}:${config.port}  ← 分发给同事`)
  })
  if (!shareable.length) console.log('  未检测到可分享的局域网地址：当前仅本机可访问')
  if (!fs.existsSync(config.webDist)) {
    console.log('  ⚠ 前端未构建：请先在 web/ 执行 npm run build，或开发模式用 web/ npm run dev')
  }
  console.log('  按 Ctrl+C 停止服务')
  console.log('==========================================')
}

loadDb()
createApp().listen(config.port, '0.0.0.0', printBanner)
