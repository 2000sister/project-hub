<template>
  <div class="app" v-if="sessionStore.session.ready && sessionStore.session.authed">
    <header class="topbar">
      <div class="logo"><span class="dot"></span>项目连接信息卡</div>
      <nav class="seg">
        <RouterLink to="/" :class="{ active: route.name === 'projects' }">🗂 项目页</RouterLink>
        <RouterLink to="/entries" :class="{ active: route.name === 'entries' }">🔎 全部条目页</RouterLink>
      </nav>
      <div class="search">
        <span class="ic">🔍</span>
        <input
          v-model="query"
          placeholder="搜索项目 / 别名 / 条目 / 地址 / 备注…（空格分隔多个词，回车直达，Esc 清空）"
          @keydown.esc.prevent="query = ''"
          @keydown.enter.prevent="searchEnter"
        />
        <button v-if="query" class="clear" title="清空" @click="query = ''">✕</button>
      </div>
      <div class="spacer"></div>
      <button class="btn sm" @click="doExport">导出备份</button>
      <button v-if="canEdit" class="btn sm" @click="importInput?.click()">导入</button>
      <input
        ref="importInput"
        type="file"
        accept=".json"
        style="display:none"
        @change="doImport"
      />
      <button v-if="canEdit" class="btn primary" @click="startCreate">＋ 新建项目</button>
      <button v-if="canEdit" class="btn sm" @click="doChangePw">🔑 改口令</button>
      <button class="btn sm" @click="doLogout">退出</button>
    </header>

    <div v-if="dataStore.migration" class="migrate-bar">
      <span>💡 检测到本浏览器存有 V1 数据（{{ dataStore.migration.projects.length }} 个项目），服务端当前为空。</span>
      <button class="btn sm primary" @click="dataActions.runMigration()">一键迁移到服务端</button>
      <button class="btn sm" @click="dataStore.migration = null">忽略</button>
    </div>

    <RouterView />
    <div :class="['toast', toastState.show ? 'show' : '']">{{ toastState.msg }}</div>
  </div>

  <AuthOverlay v-else-if="sessionStore.session.authVisible" :mode="sessionStore.session.authMode" />
  <div v-else class="empty" style="padding-top:40vh">加载中…</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router'
import AuthOverlay from '@/components/AuthOverlay.vue'
import { sessionStore, canEdit } from '@/stores/session'
import { dataStore, dataActions } from '@/stores/data'
import { toastState, toast } from '@/stores/toast'
import { query, terms, firstMatchProject } from '@/utils/search'
import type { Project } from '@/api/types'

const route = useRoute()
const router = useRouter()
const importInput = ref<HTMLInputElement>()

onMounted(async () => {
  await sessionStore.init()
  if (sessionStore.session.authed) await dataActions.load()
})

/** 搜索回车：直达第一个匹配项目（PRD FR-08） */
function searchEnter(): void {
  if (!terms.value.length) return
  const first = firstMatchProject(dataStore.projects, terms.value)
  if (!first) {
    toast('没有匹配的项目')
    return
  }
  dataStore.currentId = first.id
  if (route.name !== 'projects') router.push('/')
  toast('已打开第一个结果')
}

function startCreate(): void {
  // 新建：置空选中项 → 跳项目页 → ProjectsView 监听 createRequest 打开编辑器
  dataStore.currentId = null
  dataStore.createRequest++
  if (route.name !== 'projects') router.push('/')
}

function doExport(): void {
  const blob = new Blob([JSON.stringify(dataStore.projects, null, 2)], {
    type: 'application/json'
  })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `project-hub-备份-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
  toast('已导出 ✓')
}

async function doImport(ev: Event): Promise<void> {
  const target = ev.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  try {
    const parsed = JSON.parse(await file.text()) as unknown
    const arr = Array.isArray(parsed) ? parsed : (parsed as { projects?: Project[] }).projects
    if (!Array.isArray(arr)) throw new Error()
    if (dataStore.projects.length && !window.confirm('导入将覆盖当前全部数据（服务端），确定？')) {
      target.value = ''
      return
    }
    const n = await dataActions.importProjects(arr as Project[])
    if (n !== null) {
      dataStore.currentId = null
      toast(`导入成功 ✓（${n} 个项目）`)
    }
  } catch {
    toast('文件格式不正确，导入失败')
  }
  target.value = ''
}

async function doChangePw(): Promise<void> {
  const v = window.prompt('新的查看口令（同事用，留空则不修改）：') || ''
  const e = window.prompt('新的编辑口令（自己用，留空则不修改）：') || ''
  if (!v && !e) return
  await sessionStore.changePasswords(v, e)
}

async function doLogout(): Promise<void> {
  await sessionStore.logout()
}
</script>

<style scoped>
/* ---------- 应用外壳与顶栏（报头） ---------- */
.app{display:flex;flex-direction:column;height:100vh}

.topbar{
  display:flex;align-items:center;gap:14px;padding:10px 24px;
  background:var(--card);border-bottom:1px solid var(--line-strong);flex-shrink:0;
}

.logo{
  font-family:var(--serif);font-weight:700;font-size:17px;letter-spacing:.02em;
  display:flex;align-items:center;gap:10px;white-space:nowrap;
}
/* 印章式标志 */
.logo .dot{
  width:26px;height:26px;border-radius:5px;background:var(--accent);
  color:#fff;display:inline-flex;align-items:center;justify-content:center;
  font-family:var(--serif);font-size:14px;line-height:1;
  box-shadow:inset 0 0 0 1.5px oklch(100% 0 0 / .35);
}
.logo .dot::before{content:"录"}

/* ---------- 搜索 ---------- */
.search{flex:1;max-width:540px;position:relative}
.search input{
  width:100%;padding:8px 30px 8px 34px;border:1px solid var(--line-strong);
  border-radius:var(--radius);font-size:13.5px;background:var(--bg);
  outline:none;transition:border-color .18s var(--ease),background .18s var(--ease);
  font-family:inherit;color:var(--txt);
}
.search input::placeholder{color:var(--sub);opacity:.75}
.search input:focus{
  border-color:var(--accent);background:var(--card);box-shadow:0 0 0 3px var(--accent-soft);
}
.search .ic{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--sub);font-size:13px}
.search .clear{
  position:absolute;right:8px;top:50%;transform:translateY(-50%);
  border:none;background:none;cursor:pointer;color:var(--sub);font-size:13px;
  padding:2px 6px;border-radius:5px;transition:color .15s,background .15s;
}
.search .clear:hover{color:var(--danger);background:var(--danger-soft)}

.topbar .spacer{flex:1}

/* ---------- 导航：文字页签，激活下划线 ---------- */
.seg{display:flex;gap:2px;flex-shrink:0}
.seg a{
  text-decoration:none;display:block;padding:8px 14px;font-size:13.5px;
  cursor:pointer;color:var(--sub);position:relative;
  border-radius:var(--radius) var(--radius) 0 0;
  transition:color .18s var(--ease),background .18s var(--ease);
}
.seg a::after{
  content:"";position:absolute;left:14px;right:14px;bottom:-11px;height:2px;
  background:transparent;transition:background .18s var(--ease);
}
.seg a:hover{color:var(--txt);background:var(--accent-soft)}
.seg a.active{color:var(--accent-deep);font-weight:600}
.seg a.active::after{background:var(--accent)}

/* ---------- V1 迁移提示条 ---------- */
.migrate-bar{
  background:oklch(96% 0.04 90);border:1px solid oklch(85% 0.06 90);
  border-radius:var(--radius);padding:10px 14px;margin:14px 24px 0;font-size:13px;
  display:flex;align-items:center;gap:10px;flex-wrap:wrap;
}

/* ---------- toast ---------- */
.toast{
  position:fixed;bottom:30px;left:50%;transform:translateX(-50%) translateY(16px) scale(.97);
  background:var(--txt);color:var(--bg);padding:10px 22px;border-radius:var(--radius);
  font-size:13px;opacity:0;pointer-events:none;z-index:99;
  transition:opacity .28s var(--ease),transform .28s var(--ease);
}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}

/* ---------- 窄屏 ---------- */
@media (max-width:900px){
  .topbar{flex-wrap:wrap;row-gap:8px}
  .topbar .spacer{display:none}
  .search{max-width:none;order:10;flex-basis:100%}
}
</style>
