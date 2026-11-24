<template>
  <main class="main">
    <!-- 左侧：项目列表 -->
    <aside class="list">
      <template v-if="!filtered.length">
        <div class="empty">
          <template v-if="terms.length">
            <Icon name="search" :size="16" /><br />
            没有匹配的项目<br />换个关键词，或按 Esc 清空搜索
          </template>
          <template v-else-if="canEdit">还没有项目<br />点右上角「新建项目」开始</template>
          <template v-else>暂无项目<br />维护者尚未录入任何项目信息</template>
        </div>
      </template>
      <template v-else>
        <div class="list-head">
          {{ terms.length ? '命中 ' + filtered.length + ' 个项目' : '共 ' + filtered.length + ' 个项目' }}
        </div>
        <div
          v-for="p in filtered"
          :key="p.id"
          :class="['proj-item', p.id === dataStore.currentId ? 'active' : '']"
          @click="select(p.id)"
        >
          <div class="name">
            <span v-html="hl(p.name, terms)"></span>
            <span class="time">{{ fmtTime(p.updatedAt) }}</span>
          </div>
          <div class="tagrow">
            <span v-for="t in typeLabels(p)" :key="t" class="tag">{{ t }}</span>
            <span v-if="p.entries.length" class="tag">{{ p.entries.length }} 条目</span>
          </div>
          <div v-if="matchHint(p)" class="match-hint">匹配：{{ matchHint(p) }}</div>
        </div>
      </template>
    </aside>

    <!-- 右侧：详情或编辑器 -->
    <section class="detail content-col">
      <!-- 编辑器 -->
      <template v-if="editing && draft">
        <div class="d-head">
          <h1 class="sm">{{ isNew ? '新建项目' : '编辑项目' }}</h1>
          <div class="actions">
            <button class="btn" @click="cancelEdit">取消</button>
            <button class="btn primary" title="Ctrl / ⌘ + S" @click="saveEdit">
              <Icon name="save" :size="13" /> 保存
            </button>
          </div>
        </div>

        <div class="edit-sec">
          <h3>基本信息</h3>
          <div class="egrid">
            <div class="fld">
              <label>项目名称 *</label>
              <input v-model="draft.name" placeholder="如：电商中台" />
            </div>
            <div class="fld">
              <label>别名 / 搜索词（逗号分隔）</label>
              <input v-model="draft.alias" placeholder="如：shop, 商城" />
            </div>
            <div class="fld full">
              <label>标签（逗号分隔）</label>
              <input v-model="tagsText" placeholder="如：生产, 测试" />
            </div>
            <div class="fld full">
              <label>项目备注</label>
              <textarea v-model="draft.note" placeholder="项目整体说明…"></textarea>
            </div>
          </div>
        </div>

        <div class="edit-sec">
          <h3>连接条目（{{ draft.entries.length }}）</h3>
          <div v-for="(e, ei) in draft.entries" :key="e.id" class="entry-edit">
            <div class="etop">
              <select :value="e.type" @change="changeType(e, $event)">
                <option v-for="(t, k) in TYPES" :key="k" :value="k">{{ t.label }}</option>
              </select>
              <input
                v-model="e.name"
                class="inp vl"
                placeholder="条目名称，如：生产环境后台"
              />
              <button class="btn sm" title="上移" @click="moveIn(draft.entries, ei, -1)"><Icon name="arrow-up" :size="12" /></button>
              <button class="btn sm" title="下移" @click="moveIn(draft.entries, ei, 1)"><Icon name="arrow-down" :size="12" /></button>
              <button class="btn sm danger" @click="removeEntry(ei)">删除条目</button>
            </div>
            <div v-for="(f, fi) in e.fields" :key="fi" class="efield-row">
              <input v-model="f.label" class="inp lb" placeholder="字段名" />
              <input
                v-model="f.value"
                :class="['inp', 'vl', { mono: f.secret }]"
                :type="f.secret ? 'password' : 'text'"
                placeholder="值"
              />
              <label class="chk">
                <input v-model="f.secret" type="checkbox" />敏感
              </label>
              <button class="btn sm" title="上移" @click="moveIn(e.fields, fi, -1)"><Icon name="arrow-up" :size="12" /></button>
              <button class="btn sm" title="下移" @click="moveIn(e.fields, fi, 1)"><Icon name="arrow-down" :size="12" /></button>
              <button class="btn sm" title="删除字段" @click="e.fields.splice(fi, 1)"><Icon name="x" :size="12" /></button>
            </div>
            <button class="btn sm add-field" @click="e.fields.push({ label: '', value: '', secret: false })">
              <Icon name="plus" :size="12" /> 添加资源字段
            </button>

            <div class="fnote-wrap">
              <input
                v-model="e.note"
                class="inp fnote"
                placeholder="资源备注：用途、访问方式、注意事项…"
              />
            </div>

            <div class="creds-sec">
              <div class="creds-head">
                <span>账号密码（{{ e.creds.length }}）</span>
              </div>
              <CredEditor
                v-for="(c, ci) in e.creds"
                :key="c.id"
                :cred="c"
                :is-first="ci === 0"
                :is-last="ci === e.creds.length - 1"
                @move="(dir) => moveIn(e.creds, ci, dir)"
                @remove="e.creds.splice(ci, 1)"
              />
              <div v-if="!e.creds.length" class="creds-empty">
                该条目暂无账号，点下方「添加账号」录入
              </div>
              <button class="btn sm add-cred" @click="e.creds.push(mkCred())">
                <Icon name="plus" :size="12" /> 添加账号
              </button>
            </div>
          </div>
          <div v-if="!draft.entries.length" class="empty" style="padding:12px 0">
            还没有条目，从下方添加 ↓
          </div>
          <div class="etypebtns">
            <button
              v-for="(t, k) in TYPES"
              :key="k"
              class="etypebtn"
              @click="draft.entries.push(mkEntry(k))"
            >
              <Icon :name="iconName(t.icon)" :size="13" />
              {{ t.label }}
            </button>
          </div>
        </div>
      </template>

      <!-- 详情：档案抬头（标题 + 元数据带） → 备注 → 条目卡 -->
      <template v-else-if="current">
        <header class="d-head">
          <h1 v-html="hl(current.name, terms)"></h1>
          <div class="actions">
            <button class="btn" @click="shareOpen = true">
              <Icon name="link" :size="13" /> 分享
            </button>
            <button v-if="canEdit" class="btn" @click="startEdit(current.id)">
              <Icon name="edit" :size="13" /> 编辑
            </button>
            <button v-if="canEdit" class="btn danger" @click="remove(current.id)">删除</button>
          </div>
        </header>

        <dl class="d-band">
          <div v-if="current.alias">
            <dt>别名</dt>
            <dd v-html="hl(current.alias, terms)"></dd>
          </div>
          <div v-if="current.tags?.length">
            <dt>标签</dt>
            <dd class="band-tags">
              <span v-for="t in current.tags" :key="t" class="tag">{{ t }}</span>
            </dd>
          </div>
          <div>
            <dt>最近更新</dt>
            <dd>{{ fmtTime(current.updatedAt) }}</dd>
          </div>
          <div>
            <dt>连接条目</dt>
            <dd class="num">{{ current.entries.length }}</dd>
          </div>
        </dl>

        <div v-if="current.note" class="d-note" v-html="hl(current.note, terms)"></div>

        <EntryCard v-for="e in current.entries" :key="e.id" :entry="e" />
        <div v-if="!current.entries.length" class="empty">
          {{ canEdit ? '暂无连接条目，点「编辑」添加' : '该项目暂未录入连接信息' }}
        </div>

        <ShareDialog v-if="shareOpen" :project="current" @close="shareOpen = false" />
      </template>

      <template v-else>
        <div class="empty">
          <Icon name="arrow-left" :size="16" /><br />
          从左侧选择一个项目查看连接信息
          <template v-if="canEdit"><br /><br />提示：数据保存在服务端（data/data.json），可用「导出备份」保存 JSON 文件。</template>
        </div>
      </template>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import EntryCard from '@/components/EntryCard.vue'
import ShareDialog from '@/components/ShareDialog.vue'
import CredEditor from '@/components/CredEditor.vue'
import Icon from '@/components/Icon.vue'
import { iconName } from '@/components/icons'
import { TYPES, mkEntry, mkCred } from '@/api/types'
import type { Entry, Project } from '@/api/types'
import { uid } from '@/api/types'
import { dataStore } from '@/stores/data'
import { dataActions } from '@/stores/data'
import { sessionStore, canEdit } from '@/stores/session'
import { toast } from '@/stores/toast'
import { hl, terms, matchAll, fmtTime } from '@/utils/search'

/* ---------- 列表 ---------- */
const filtered = computed(() => {
  const ts = terms.value
  if (!ts.length) return dataStore.projects
  return dataStore.projects.filter((p) => {
    const hay = [
      p.name, p.alias || '', (p.tags || []).join(' '), p.note || '',
      ...p.entries.flatMap((e) => [e.name, e.note, ...e.fields.map((f) => `${f.label} ${f.value}`)])
    ].join(' ')
    return matchAll(hay, ts)
  })
})

function typeLabels(p: Project): string[] {
  return [...new Set(p.entries.map((e) => (TYPES[e.type] ? TYPES[e.type].label : e.type)))].slice(0, 4)
}

function matchHint(p: Project): string {
  if (!terms.value.length) return ''
  for (const e of p.entries) {
    const tn = TYPES[e.type] ? TYPES[e.type].label : e.type
    if (matchAll(e.name, terms.value)) return `${tn} › ${e.name}`
    for (const f of e.fields) {
      if (matchAll(`${f.label} ${f.value}`, terms.value)) return `${tn} › ${e.name} › ${f.label}`
    }
    if (matchAll(e.note || '', terms.value)) return `${tn} › ${e.name} › 备注`
  }
  if (matchAll(p.note || '', terms.value)) return '项目备注'
  if (matchAll(p.alias || '', terms.value)) return '别名'
  if (matchAll((p.tags || []).join(' '), terms.value)) return '标签'
  return ''
}

function select(pid: string): void {
  editing.value = false
  draft.value = null
  shareOpen.value = false
  dataStore.currentId = pid
}

const current = computed<Project | undefined>(() =>
  dataStore.projects.find((p) => p.id === dataStore.currentId)
)

/* ---------- 编辑 ---------- */
const editing = ref(false)
const draft = ref<Project | null>(null)
const isNew = computed(() => !!draft.value && !current.value)
/** 分享面板开关（仅详情态可用） */
const shareOpen = ref(false)

const tagsText = computed({
  get: () => draft.value?.tags?.join(', ') ?? '',
  set: (v: string) => {
    if (draft.value) draft.value.tags = v.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
  }
})

function startEdit(pid: string): void {
  if (!canEdit.value) {
    toast('当前口令无修改权限')
    return
  }
  const p = dataStore.projects.find((x) => x.id === pid)
  if (!p) return
  draft.value = JSON.parse(JSON.stringify(p)) as Project
  editing.value = true
}

function startCreate(): void {
  if (!canEdit.value) return
  draft.value = {
    id: uid(), name: '', alias: '', tags: [], note: '', entries: [], updatedAt: Date.now()
  }
  editing.value = true
  dataStore.currentId = null
}

watch(
  () => dataStore.createRequest,
  () => { if (dataStore.createRequest > 0) startCreate() }
)

function cancelEdit(): void {
  editing.value = false
  draft.value = null
}

/** 编辑态快捷键：Ctrl / ⌘ + S 保存（避免长表单回顶） */
function onKeydown(e: KeyboardEvent): void {
  if (!editing.value) return
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    void saveEdit()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

async function saveEdit(): Promise<void> {
  const d = draft.value
  if (!d) return
  d.name = d.name.trim()
  if (!d.name) {
    toast('请填写项目名称')
    return
  }
  // 全空的账号块（新建后没填任何内容）不入库，否则详情页会出现「默认账号 / 未填写」的空壳
  for (const e of d.entries) {
    if (!e.creds) {
      e.creds = []
      continue
    }
    for (let i = e.creds.length - 1; i >= 0; i--) {
      const c = e.creds[i]
      if (!c.label && !c.username && !c.password && !c.note) e.creds.splice(i, 1)
    }
  }
  d.updatedAt = Date.now()
  const idx = dataStore.projects.findIndex((x) => x.id === d.id)
  if (idx >= 0) dataStore.projects[idx] = d
  else dataStore.projects.unshift(d)
  dataStore.currentId = d.id
  if (await dataActions.saveAll()) {
    editing.value = false
    draft.value = null
    toast('已保存 ✓')
  }
}

function remove(pid: string): void {
  if (!canEdit.value) {
    toast('当前口令无删除权限')
    return
  }
  const p = dataStore.projects.find((x) => x.id === pid)
  if (!p) return
  if (!window.confirm(`确定删除项目「${p.name}」？\n此操作不可恢复，建议先「导出备份」。`)) return
  dataStore.projects = dataStore.projects.filter((x) => x.id !== pid)
  if (dataStore.currentId === pid) dataStore.currentId = null
  dataActions.saveAll().then((ok) => {
    if (ok) toast('已删除')
  })
}

/* ---------- 条目编辑辅助 ---------- */
/** 切换类型：只重置资源属性字段，账号块保持不变（账号是资源下的独立维度） */
function changeType(e: Entry, ev: Event): void {
  const type = (ev.target as HTMLSelectElement).value
  const t = TYPES[type]
  if (!t || type === e.type) return
  if (window.confirm(`切换类型将重置「${t.label}」的资源字段（地址/端口等），已录入的账号保持不变。确定？`)) {
    e.type = type
    e.fields = t.fields.map((f) => ({ label: f.label, value: '', secret: f.secret }))
  }
  // 取消时不改 e.type，:value 保持原值，select 显示自动恢复
}

function removeEntry(ei: number): void {
  if (!draft.value) return
  if (window.confirm('删除该条目？')) draft.value.entries.splice(ei, 1)
}

/** 就地交换数组中相邻两项：条目与字段行共用（不重建数组，保持 v-for 的 DOM 与输入焦点） */
function moveIn<T>(arr: T[], i: number, dir: number): void {
  const j = i + dir
  if (j < 0 || j >= arr.length) return
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
}
</script>

<style scoped>
/* ============ 左栏：索引抽屉 ============
   抽屉底色比详情纸深一档，靠底色分出两栏；行与行之间用发丝线排成索引，
   不做「每项一张浮起卡片」——那会让 20 个项目的列表变成一叠发票 */
.list{
  width:296px;flex-shrink:0;
  background:var(--rail);
  border-right:1px solid var(--line-strong);
  overflow-y:auto;
  padding:0 0 20px;
}
.list-head{
  position:sticky;top:0;z-index:2;
  padding:13px 16px 9px;
  font-size:11.5px;color:var(--sub);
  background:var(--rail);
  border-bottom:1px solid var(--line-strong);
  font-variant-numeric:tabular-nums;
}

.proj-item{
  position:relative;
  padding:10px 16px 11px;
  cursor:pointer;
  border-bottom:1px solid var(--line);
  transition:background var(--dur-1) var(--ease);
}
.proj-item:hover{background:var(--card-2)}
.proj-item.active{background:var(--card)}
/* 激活竖条：常驻左边缘，贴满整行高度，读起来像抽屉里的分隔标签 */
.proj-item::before{
  content:"";position:absolute;left:0;top:0;bottom:0;width:3px;
  background:transparent;
  transition:background var(--dur-1) var(--ease);
}
.proj-item.active::before{background:var(--accent)}

.proj-item .name{
  display:flex;align-items:baseline;justify-content:space-between;gap:8px;
  font-size:13.5px;font-weight:600;line-height:1.45;
}
.proj-item.active .name{color:var(--accent-deep)}
.proj-item .name .time{
  font-size:10.5px;color:var(--sub);font-weight:400;white-space:nowrap;
  font-variant-numeric:tabular-nums;letter-spacing:.01em;
}
.proj-item .tagrow{margin-top:6px}

.match-hint{
  margin-top:5px;font-size:11px;color:var(--accent-deep);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}

/* ============ 详情：档案抬头 ============ */
.d-head{
  display:flex;align-items:flex-start;gap:14px;
  margin-bottom:14px;
  animation:rise var(--dur-2) var(--ease) both;
}
.d-head h1.sm{
  font-family:var(--serif);
  font-size:21px;font-weight:700;line-height:1.3;color:var(--txt-soft);
}
.d-head h1{
  flex:1 1 auto;min-width:0;
  font-family:var(--serif);
  font-size:28px;font-weight:700;
  line-height:1.22;letter-spacing:.004em;
  color:var(--txt);
  -webkit-text-stroke:.2px currentColor;   /* 中文衬线粗体在 Windows 上偏细，描 0.2px 补重量 */
  padding-bottom:2px;
}
.d-head .actions{
  flex:0 0 auto;
  display:flex;gap:6px;padding-top:4px;
}

/* 元数据带：标题下一条横贯的表格化信息区
   ① 各项等宽铺满整行（不许挤在左边留半行白）；
   ② 横线走容器线（与卡片框对齐），项内文字走内容线（与卡片内文字对齐） */
.d-band{
  display:flex;flex-wrap:wrap;
  /* 只写纵向 margin-block：写 `margin:0 0 16px` 会把 margin-inline 也置 0，
     覆盖 .content-col > * 的 auto 居中，整条带就贴左而卡片居中（宽屏差 141px） */
  margin-block:0 16px;
  padding:9px 0;
  border-top:1px solid var(--line-strong);
  border-bottom:1px solid var(--line);
}
.d-band > div{
  display:flex;align-items:baseline;gap:7px;
  flex:1 1 0;min-width:0;
  padding:0 15px;
  border-right:1px solid var(--line);
}
.d-band > div:first-child{padding-left:0}
.d-band > div:last-child{border-right:none}
.d-band dt{
  font-size:10.5px;color:var(--sub);letter-spacing:.06em;white-space:nowrap;
}
.d-band dd{margin:0;font-size:12.5px;color:var(--txt-soft);line-height:1.5}
.d-band dd.num{font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:13px}
.d-band dd.band-tags{display:flex;gap:4px;flex-wrap:wrap}

/* 项目备注：做成和条目卡同构的「说明卡」
   裸文本做不到两全——贴 340 就和卡片里的文字差 17px，贴 357 就和卡片框差 17px。
   装进同样 1px 边框 + 16px 内距的卡之后，框落在容器线 340、文字落在内容线 357，两条线一次到位 */
.d-note{
  margin-block:0 14px;     /* 同 .d-band：横向居中由 .content-col 的 auto margin 负责 */
  padding:11px 16px 12px;
  background:var(--card);
  border:1px solid var(--line-strong);
  border-radius:var(--radius-lg);
  box-shadow:var(--shadow-1);
  font-size:12.5px;line-height:1.75;color:var(--sub);
  white-space:pre-wrap;
}

/* ============ 编辑表单 ============ */
.edit-sec{
  background:var(--card);
  border:1px solid var(--line-strong);
  border-radius:var(--radius-lg);
  padding:16px 16px 18px;     /* 1px 边框 + 16 内距 = 内容线 357，与标题/描述同线 */
  margin-bottom:12px;
  box-shadow:var(--shadow-1);
}
/* 分区标题：小字 + 一条延伸到底的发丝线，是结构而非装饰 */
.edit-sec h3{
  display:flex;align-items:center;gap:10px;
  margin:0 0 14px;
  font-size:12px;font-weight:600;color:var(--sub);letter-spacing:.04em;
}
.edit-sec h3::after{
  content:"";flex:1;height:1px;background:var(--line);
}

.egrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.fld label{display:block;font-size:11.5px;color:var(--sub);margin-bottom:5px;letter-spacing:.02em}
.fld input,.fld textarea,.fld select{
  width:100%;padding:7px 10px;
  border:1px solid var(--line-strong);border-radius:var(--radius);
  font-size:13px;outline:none;font-family:inherit;
  background:var(--paper);color:var(--txt);
  box-shadow:inset 0 1px 1px oklch(28% 0.02 70 / .04);
  transition:border-color var(--dur-1) var(--ease),box-shadow var(--dur-1) var(--ease),
             background var(--dur-1) var(--ease);
}
.fld input:focus,.fld textarea:focus,.fld select:focus{
  border-color:var(--accent);background:var(--card);
  box-shadow:0 0 0 3px var(--accent-soft);
}
.fld.full{grid-column:1/-1}
.fld textarea{resize:vertical;min-height:62px;line-height:1.65}

/* 单条目编辑块：与条目卡同构（抬头 + 字段行 + 账号区） */
.entry-edit{
  border:1px solid var(--line-strong);border-radius:var(--radius);
  padding:12px 14px;margin-bottom:10px;
  background:var(--card-2);
}
.entry-edit .etop{display:flex;gap:7px;align-items:center;margin-bottom:9px}
.entry-edit .etop select{
  padding:6px 8px;border:1px solid var(--line-strong);border-radius:var(--radius);
  font-size:12.5px;background:var(--card);color:var(--txt);outline:none;font-family:inherit;
}

/* 输入框统一基类：不依赖 input[type=...] 属性选择器（未写 type 的 input 匹配不到） */
.inp{
  padding:6px 9px;border:1px solid var(--line-strong);border-radius:var(--radius);
  font-size:12.5px;font-family:inherit;background:var(--paper);color:var(--txt);
  outline:none;min-width:0;
  box-shadow:inset 0 1px 1px oklch(28% 0.02 70 / .04);
  transition:border-color var(--dur-1) var(--ease),box-shadow var(--dur-1) var(--ease),
             background var(--dur-1) var(--ease);
}
.inp::placeholder{color:var(--sub);opacity:.6}
.inp:focus{border-color:var(--accent);background:var(--card);box-shadow:0 0 0 3px var(--accent-soft)}
.inp.vl{flex:1}
.inp.mono{font-family:var(--mono)}

.efield-row{display:flex;gap:7px;align-items:center;margin-bottom:7px}
.efield-row .lb{width:104px;flex-shrink:0}
.chk{display:flex;align-items:center;gap:4px;font-size:11.5px;color:var(--sub);white-space:nowrap;cursor:pointer}
.chk input{accent-color:var(--accent)}

.fnote-wrap{margin-top:5px}
.fnote{width:100%;font-size:12px}
.add-field{margin-top:7px}

/* ============ 账号密码块（编辑态） ============ */
.creds-sec{
  margin-top:12px;padding-top:10px;border-top:1px solid var(--line-strong);
}
.creds-head{
  display:flex;align-items:center;gap:8px;margin-bottom:9px;
  font-size:11.5px;color:var(--sub);font-weight:600;letter-spacing:.04em;
}
.creds-empty{
  font-size:12px;color:var(--sub);opacity:.6;padding:3px 0 7px;
}
.add-cred{display:block;margin-top:2px}

/* 新增条目类型按钮：虚线框 + 图标，位置固定在条目区末尾 */
.etypebtns{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.etypebtn{
  display:inline-flex;align-items:center;gap:5px;
  border:1px dashed var(--line-strong);background:none;border-radius:var(--radius);
  padding:6px 12px;cursor:pointer;font-size:12.5px;color:var(--sub);font-family:inherit;
  transition:border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease),
             background var(--dur-1) var(--ease),border-style var(--dur-1) var(--ease);
}
.etypebtn:hover{
  border-style:solid;border-color:var(--accent);color:var(--accent-deep);
  background:var(--accent-soft);
}

/* ============ 窄屏 ============ */
@media (max-width:900px){
  .list{width:100%;max-height:34vh;border-right:none;border-bottom:1px solid var(--line-strong)}
  .list-head{position:static;padding:11px 14px 8px}
  .egrid{grid-template-columns:1fr}
  .d-head{flex-wrap:wrap}
  .d-head .actions{margin-left:0;padding-top:0}
  .d-band > div:first-child{padding-left:0}
}
@media (max-width:620px){
  .d-head h1{flex:1 1 100%;font-size:23px}
  .d-band > div{flex:1 1 45%;border-right:none;padding:2px 10px 2px 0}
}
</style>
