/** 会话状态：口令验证 / 登录登出 / 编辑模式门控（PRD FR-01/02/12/15） */
import { computed, reactive } from 'vue'
import { api } from '@/api/client'
import { toast } from './toast'

type AuthMode = 'login' | 'setup'

export const session = reactive({
  /** 初始化是否完成（决定首屏 loading） */
  ready: false,
  authed: false,
  level: 'view' as 'view' | 'edit',
  authVisible: false,
  authMode: 'login' as AuthMode
})

/** 编辑模式门控：所有写操作 UI 与动作均以此为准 */
export const canEdit = computed(() => session.authed && session.level === 'edit')

async function init(): Promise<void> {
  const s = await api.state()
  if (s.setup) {
    showAuth('setup')
  } else if (!s.authed) {
    showAuth('login')
  } else {
    session.authed = true
    session.level = s.level ?? 'view'
    session.ready = true
  }
}

function showAuth(mode: AuthMode): void {
  session.authVisible = true
  session.authMode = mode
  session.authed = false
}

async function submitSetup(viewPassword: string, editPassword: string): Promise<boolean> {
  const r = await api.setup(viewPassword, editPassword)
  session.authVisible = false
  session.authed = true
  session.level = r.level
  session.ready = true
  return true
}

async function submitLogin(password: string): Promise<boolean> {
  const r = await api.login(password)
  session.authVisible = false
  session.authed = true
  session.level = r.level
  session.ready = true
  return true
}

async function logout(): Promise<void> {
  await api.logout()
  showAuth('login')
}

/** FR-15：修改口令后全部会话失效，需重新登录 */
async function changePasswords(viewPassword: string, editPassword: string): Promise<void> {
  await api.passwords(viewPassword, editPassword)
  toast('口令已修改，所有会话已失效，请重新登录')
  showAuth('login')
}

/** 401 统一处理：任何接口返回未认证即弹出登录 */
function handleUnauth(): void {
  showAuth('login')
}

export const sessionStore = {
  session, canEdit, init, showAuth,
  submitSetup, submitLogin, logout, changePasswords, handleUnauth
}
