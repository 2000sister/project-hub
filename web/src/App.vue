<template>
  <div class="app" v-if="sessionStore.session.ready && sessionStore.session.authed">
    <header class="topbar">
      <div class="logo"><span class="dot"></span>项目连接信息卡</div>
      <nav class="seg">
        <RouterLink to="/" :class="{ active: route.name === 'projects' }">
          <Icon name="nav-projects" :size="14" /> 项目页
        </RouterLink>
        <RouterLink to="/entries" :class="{ active: route.name === 'entries' }">
          <Icon name="nav-entries" :size="14" /> 全部条目页
        </RouterLink>
      </nav>
      <div class="search">
        <span class="ic"><Icon name="search" :size="14" /></span>
        <input
          v-model="query"
          placeholder="搜索项目、条目、地址…"
          title="空格分词（多词需全部命中），Enter 直达第一个结果，Esc 清空"
          @keydown.esc.prevent="query = ''"
          @keydown.enter.prevent="searchEnter"
        />
        <button v-if="query" class="clear" title="清空" @click="query = ''">✕</button>
      </div>
      <div class="top-actions">
        <button class="btn icon-btn" title="导出备份" aria-label="导出备份" @click="doExport">
          <Icon name="download" :size="15" />
        </button>
        <button
          v-if="canEdit"
          class="btn icon-btn"
          title="导入"
          aria-label="导入"
          @click="importInput?.click()"
        >
          <Icon name="upload" :size="15" />
        </button>
        <input
          ref="importInput"
          type="file"
          accept=".json"
          style="display:none"
          @change="doImport"
        />

        <span class="sep" aria-hidden="true"></span>

        <button v-if="canEdit" class="btn primary" @click="startCreate">
          <Icon name="plus" :size="14" :stroke-width="2" /> 新建项目
        </button>

        <span v-if="canEdit" class="sep" aria-hidden="true"></span>

        <button v-if="canEdit" class="btn" @click="doChangePw">
          <Icon name="key" :size="13" /> 改口令
        </button>
        <button class="btn logout" @click="doLogout">退出</button>
      </div>
    </header>

    <div v-if="dataStore.migration" class="migrate-bar">
      <span class="migrate-msg"><Icon name="info" :size="14" /> 检测到本浏览器存有 V1 数据（{{ dataStore.migration.projects.length }} 个项目），服务端当前为空。</span>
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
import Icon from '@/components/Icon.vue'
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

/* 顶栏：半透明纸面 + 毛玻璃，滚动内容从下方穿过时保持层次 */
.topbar{
  /* 顶栏控件统一基线：搜索框 / 导航签 / 按钮都吃这一个高度。
     之前三类控件各自用 padding 凑高度，一行里出现 39 / 36 / 32 三种高度，右半边像贴歪了 */
  --ctl-h:34px;
  display:flex;align-items:center;gap:14px;padding:11px 24px;
  background:oklch(99.3% 0.004 85 / .82);
  backdrop-filter:blur(12px) saturate(1.1);
  border-bottom:1px solid var(--line);
  box-shadow:0 1px 3px oklch(30% 0.02 70 / .05);
  flex-shrink:0;position:relative;z-index:20;
}

.logo{
  font-family:var(--serif);font-weight:700;font-size:17px;letter-spacing:.015em;
  display:flex;align-items:center;gap:10px;white-space:nowrap;
}

/* 印章：悬停时轻微抬起并加深外阴影，模拟纸张上的印章压痕 */
.logo .dot{
  width:27px;height:27px;border-radius:5px;background:var(--accent);
  color:#fff;display:inline-flex;align-items:center;justify-content:center;
  font-family:var(--serif);font-size:14px;line-height:1;
  box-shadow:inset 0 0 0 1.5px oklch(100% 0 0 / .32),
             0 2px 6px oklch(40% 0.08 180 / .22);
  transition:transform var(--dur-2) var(--spring),box-shadow var(--dur-2) var(--ease);
}
.logo .dot::before{content:"录"}
.logo:hover .dot{
  transform:rotate(-2deg);
  box-shadow:inset 0 0 0 1.5px oklch(100% 0 0 / .32),
             0 4px 12px oklch(40% 0.08 180 / .28);
}

/* ---------- 搜索 ---------- */
.search{flex:1 1 200px;min-width:0;max-width:440px;position:relative}
.search input{
  width:100%;height:var(--ctl-h);padding:0 32px 0 34px;
  border:1px solid var(--line-strong);
  border-radius:var(--radius);
  font-size:13.5px;background:var(--paper);color:var(--txt);
  min-width:0;
  outline:none;font-family:inherit;
  transition:border-color var(--dur-2) var(--ease),
             background var(--dur-2) var(--ease),
             box-shadow var(--dur-2) var(--ease);
}
.search input::placeholder{color:var(--sub);opacity:.7}
.search input:focus{
  border-color:var(--accent);
  background:var(--card);
  box-shadow:0 0 0 3px var(--accent-soft), var(--shadow-1);
}
.search .ic{
  position:absolute;left:12px;top:50%;transform:translateY(-50%);
  color:var(--sub);display:flex;align-items:center;
  pointer-events:none;
  transition:color var(--dur-2) var(--ease);
}
.search:focus-within .ic{color:var(--accent)}
.search .clear{
  position:absolute;right:8px;top:50%;transform:translateY(-50%);
  border:none;background:none;cursor:pointer;color:var(--sub);font-size:13px;
  padding:3px 6px;border-radius:99px;line-height:1;
  transition:color var(--dur-1) var(--ease),background var(--dur-1) var(--ease);
}
.search .clear:hover{color:var(--danger);background:var(--danger-soft)}

/* ---------- 顶栏操作组：文件工具 │ 主操作 │ 会话
   高度吃顶栏的 --ctl-h —— 原 sm 按钮只有 22px，比旁边的搜索框矮一整截，看着像贴了一排小纸屑。
   次要按钮只描「透明边」，悬停才浮出纸面：五个同权描边方片连排等于没有主次，全是噪声。
   整栏唯一实心按钮仍是「新建项目」，内容区的 .btn 描边规则不受影响 */
.top-actions{
  display:flex;align-items:center;gap:2px;
  margin-left:auto;flex-shrink:0;
}
.top-actions .btn{
  height:var(--ctl-h);padding:0 11px;gap:6px;
  font-size:12.5px;border-radius:5px;
}
.top-actions .btn:not(.primary){
  background:transparent;border-color:transparent;box-shadow:none;color:var(--sub);
}
.top-actions .btn:not(.primary):hover{
  background:var(--card);border-color:var(--line-strong);
  color:var(--accent-deep);box-shadow:var(--shadow-1);
}
.top-actions .btn:not(.primary):active{background:var(--accent-soft);box-shadow:none}

/* 文件工具：跟按钮同高的方形热区，纯图形。文字留给有语义歧义的动作 */
.top-actions .icon-btn{width:var(--ctl-h);padding:0}

/* 主操作：唯一实心块，两侧用竖线切开，不会混进工具按钮的排里 */
.top-actions .btn.primary{
  height:var(--ctl-h);padding:0 14px;font-weight:600;letter-spacing:.02em;
}

/* 退出：默认与次要按钮同色，悬停才转警示色 —— 平时不抢注意，误点前三秒能反悔 */
.top-actions .btn.logout:hover{
  background:var(--danger-soft);border-color:oklch(86% 0.04 28);
  color:var(--danger);box-shadow:none;
}
/* 按下也留在警示色系；否则会被上面的幽灵态 active 规则抢成青色 */
.top-actions .btn.logout:active{
  background:var(--danger-soft);border-color:oklch(86% 0.04 28);
  color:var(--danger);
}

/* 组间竖线：分组靠线的位置，不靠空隙大小 */
.top-actions .sep{
  width:1px;height:18px;flex-shrink:0;margin:0 6px;
  background:var(--line-strong);opacity:.75;
}

/* ---------- 导航：档案索引签 ----------
   方角、无底色，激活靠底部一条青线 —— 胶囊样式留给「类型印章」，
   两者读起来必须是两种东西：一个指位置，一个指数据类型 */
.seg{display:flex;gap:2px;flex-shrink:0}
.seg a{
  position:relative;
  text-decoration:none;display:flex;align-items:center;gap:5px;
  height:var(--ctl-h);padding:0 12px;font-size:13.5px;
  cursor:pointer;color:var(--sub);
  border-radius:var(--radius-sm, 4px);
  transition:color var(--dur-1) var(--ease),background var(--dur-1) var(--ease);
}
.seg a:hover{color:var(--txt);background:var(--card-2)}
.seg a.active{color:var(--accent-deep);font-weight:600;background:none}
.seg a.active::after{
  content:"";position:absolute;left:6px;right:6px;bottom:0;height:2px;
  background:var(--accent);border-radius:2px 2px 0 0;
}

/* ---------- V1 迁移提示条 ---------- */
.migrate-msg{display:inline-flex;align-items:center;gap:6px}
.migrate-bar{
  background:oklch(97% 0.035 92);
  border:1px solid oklch(88% 0.055 92);
  border-radius:var(--radius);
  padding:11px 15px;margin:14px 24px 0;font-size:13px;
  display:flex;align-items:center;gap:10px;flex-wrap:wrap;
  box-shadow:var(--shadow-1);
  animation:rise var(--dur-2) var(--ease) both;
}

/* ---------- toast：从底部浮起，带轻微回弹 ---------- */
.toast{
  position:fixed;bottom:32px;left:50%;
  transform:translateX(-50%) translateY(18px) scale(.96);
  background:oklch(28% 0.02 68 / .96);
  color:oklch(98% 0.004 85);
  padding:11px 22px;border-radius:99px;
  font-size:13px;letter-spacing:.01em;
  opacity:0;pointer-events:none;z-index:99;
  box-shadow:var(--shadow-3);
  backdrop-filter:blur(6px);
  transition:opacity var(--dur-2) var(--ease),
             transform var(--dur-3) var(--spring);
}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}

/* ---------- 窄屏 ----------
   两行：① 印章 + 搜索撑满 ② 页签 + 操作组（操作组横向滚动，不换行堆高） */
@media (max-width:900px){
  .topbar{flex-wrap:wrap;row-gap:8px;column-gap:8px;padding:9px 12px}
  .logo{font-size:15px}
  .logo .dot{width:23px;height:23px;border-radius:5px;font-size:12px}
  .search{order:1;flex:1 1 120px;min-width:0;max-width:none}
  .seg{order:2}
  .top-actions{
    order:3;flex:1 1 0;min-width:0;margin-left:0;
    justify-content:flex-start;overflow-x:auto;
    scrollbar-width:none;
  }
  .top-actions::-webkit-scrollbar{display:none}
}
</style>
