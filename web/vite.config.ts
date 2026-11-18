import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// 开发时 /api 代理到本地 Koa 服务；生产由 Koa/nginx 托管 dist
// 容器内开发时 VITE_API_TARGET 指向 server 服务名，未设置则保持本机默认
const apiTarget = process.env.VITE_API_TARGET ?? 'http://localhost:5218'
// Windows/macOS 宿主目录挂载进容器时收不到 inotify 事件，需轮询才能触发热更新
// 布尔取值与 server 端 envFlag 保持一致：1/true/on/yes 开，0/false/off/no 关，未设置为关，其它直接报错
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

function envFlag(name: string): boolean {
  const raw = (process.env[name] ?? '').trim().toLowerCase()
  if (!raw) return false
  if (!Object.hasOwn(ENV_FLAG_BY_VALUE, raw)) {
    throw new Error(`${name} 取值无效：${JSON.stringify(process.env[name])}，可用 1/true/on/yes 或 0/false/off/no`)
  }
  return ENV_FLAG_BY_VALUE[raw] === true
}

const usePolling = envFlag('VITE_USE_POLLING')

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  server: {
    port: 5219,
    watch: usePolling ? { usePolling: true, interval: 300 } : undefined,
    // xfwd：代理透传 X-Forwarded-For，服务端才能区分真实客户端 IP（登录锁定按 IP 计数）
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true, xfwd: true }
    }
  },
  build: { outDir: 'dist' }
})
