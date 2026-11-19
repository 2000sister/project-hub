/** 入口：加载数据 → 装配应用 → 监听并在控制台打印访问方式 */
import { createApp } from './app.js'
import { config } from './config.js'
import { loadDb } from './models/db.js'
import { listShareableAddresses } from './utils/network.js'

function printBanner(): void {
  const shareable = listShareableAddresses()
  console.log('==========================================')
  console.log('  Project Hub 服务已启动')
  console.log(`  本机访问:   http://localhost:${config.port}`)
  console.log('  按 Ctrl+C 停止服务')
  console.log('==========================================')
}

loadDb()
createApp().listen(config.port, '0.0.0.0', printBanner)
