<template>
  <main class="main">
    <!-- 左侧：项目列表 -->
    <aside class="list">
      <template v-if="!filtered.length">
        <div class="empty">
          <template v-if="terms.length">🔍 没有匹配的项目<br />换个关键词，或按 Esc 清空搜索</template>
          <template v-else-if="canEdit">还没有项目<br />点右上角「＋ 新建项目」开始</template>
          <template v-else>暂无项目<br />维护者尚未录入任何项目信息</template>
        </div>
      </template>
      <template v-else>
        <div class="list-head">
          共 {{ filtered.length }} 个项目{{ terms.length ? '（多关键词需全部命中）' : '' }}
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
          <h1>{{ isNew ? '新建项目' : '编辑项目' }}</h1>
          <div class="actions">
            <button class="btn" @click="cancelEdit">取消</button>
            <button class="btn primary" title="Ctrl / ⌘ + S" @click="saveEdit">💾 保存</button>
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
                <option v-for="(t, k) in TYPES" :key="k" :value="k">{{ t.icon }} {{ t.label }}</option>
              </select>
              <input
                v-model="e.name"
                class="inp vl"
                placeholder="条目名称，如：生产环境后台"
              />
              <button class="btn sm" @click="move(ei, -1)">↑</button>
              <button class="btn sm" @click="move(ei, 1)">↓</button>
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
              <button class="btn sm" @click="e.fields.splice(fi, 1)">✕</button>
            </div>
            <div class="fnote-wrap">
              <input
                v-model="e.note"
                class="inp fnote"
                placeholder="备注：想存的一切说明（用途、注意事项、有效期…）"
              />
            </div>
            <button class="btn sm add-field" @click="e.fields.push({ label: '', value: '', secret: false })">
              ＋ 添加字段
            </button>
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
            >{{ t.icon }} ＋{{ t.label }}</button>
          </div>
        </div>
      </template>

      <!-- 详情 -->
      <template v-else-if="current">
        <div class="d-head">
          <h1 v-html="hl(current.name, terms)"></h1>
          <div class="actions">
            <button v-if="canEdit" class="btn" @click="startEdit(current.id)">✏️ 编辑</button>
            <button v-if="canEdit" class="btn danger" @click="remove(current.id)">删除</button>
          </div>
        </div>
        <div v-if="current.alias" class="d-meta">别名：<span v-html="hl(current.alias, terms)"></span></div>
        <div v-if="current.tags?.length" class="tagrow" style="margin-bottom:8px">
          <span v-for="t in current.tags" :key="t" class="tag">{{ t }}</span>
        </div>
        <div v-if="current.note" class="d-note" v-html="hl(current.note, terms)"></div>
        <div class="d-meta">
          更新于 {{ fmtTime(current.updatedAt) }} · {{ current.entries.length }} 个连接条目
        </div>
        <EntryCard v-for="e in current.entries" :key="e.id" :entry="e" />
        <div v-if="!current.entries.length" class="empty">
          {{ canEdit ? '暂无连接条目，点「编辑」添加' : '该项目暂未录入连接信息' }}
        </div>
      </template>

      <template v-else>
        <div class="empty">
          👈 从左侧选择一个项目查看连接信息
          <template v-if="canEdit"><br /><br />提示：数据保存在服务端（data/data.json），可用「导出备份」保存 JSON 文件。</template>
        </div>
      </template>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import EntryCard from '@/components/EntryCard.vue'
import { TYPES, mkEntry } from '@/api/types'
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
    if (matchAll(e.name, terms.value)) return `${tn} · ${e.name}`
    for (const f of e.fields) {
      if (matchAll(`${f.label} ${f.value}`, terms.value)) return `${tn} · ${e.name} · ${f.label}`
    }
    if (matchAll(e.note || '', terms.value)) return `${tn} · ${e.name} · 备注`
  }
  if (matchAll(p.note || '', terms.value)) return '项目备注'
  if (matchAll(p.alias || '', terms.value)) return '别名'
  if (matchAll((p.tags || []).join(' '), terms.value)) return '标签'
  return ''
}

function select(pid: string): void {
  editing.value = false
  draft.value = null
  dataStore.currentId = pid
}

const current = computed<Project | undefined>(() =>
  dataStore.projects.find((p) => p.id === dataStore.currentId)
)

/* ---------- 编辑 ---------- */
const editing = ref(false)
const draft = ref<Project | null>(null)
const isNew = computed(() => !!draft.value && !current.value)

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
function changeType(e: Entry, ev: Event): void {
  const type = (ev.target as HTMLSelectElement).value
  const t = TYPES[type]
  if (!t || type === e.type) return
  if (window.confirm(`切换类型将重置该条目字段为「${t.label}」默认字段，确定？`)) {
    e.type = type
    e.fields = t.fields.map((f) => ({ label: f.label, value: '', secret: f.secret }))
  }
  // 取消时不改 e.type，:value 保持原值，select 显示自动恢复
}

function removeEntry(ei: number): void {
  if (!draft.value) return
  if (window.confirm('删除该条目？')) draft.value.entries.splice(ei, 1)
}

function move(ei: number, dir: number): void {
  if (!draft.value) return
  const arr = draft.value.entries
  const nj = ei + dir
  if (nj < 0 || nj >= arr.length) return
  ;[arr[ei], arr[nj]] = [arr[nj], arr[ei]]
}
</script>

<style scoped>
/* ============ 左侧项目列表 ============ */
.list{
  width:324px;border-right:1px solid var(--line-strong);
  background:var(--card);overflow-y:auto;flex-shrink:0;
}
.list-head{padding:14px 18px 8px;font-size:12px;color:var(--sub);letter-spacing:.03em}

.proj-item{
  padding:13px 18px;cursor:pointer;border-bottom:1px solid var(--line);
  border-left:3px solid transparent;
  transition:background .15s var(--ease),border-color .15s var(--ease);
}
.proj-item:hover{background:var(--accent-soft)}
.proj-item.active{background:var(--accent-soft);border-left-color:var(--accent)}
.proj-item .name{
  font-weight:600;margin-bottom:5px;display:flex;justify-content:space-between;
  align-items:baseline;gap:8px;
}
.proj-item .name .time{font-size:11px;color:var(--sub);font-weight:400;white-space:nowrap}

.match-hint{
  font-size:11px;color:var(--accent-deep);margin-top:5px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.match-hint::before{content:"→ ";opacity:.6}

/* ============ 详情 ============ */
.d-head{
  display:flex;align-items:flex-start;gap:12px;margin-bottom:6px;
  padding-bottom:12px;border-bottom:2px solid var(--txt);
}
.d-head h1{font-family:var(--serif);font-size:24px;font-weight:700;letter-spacing:.01em;line-height:1.3}
.d-head .actions{margin-left:auto;display:flex;gap:8px;padding-top:4px}
.d-note{
  color:var(--sub);line-height:1.7;white-space:pre-wrap;
  margin-top:10px;margin-bottom:4px;   /* 只设纵向，横向交给 .content-col 居中 */
}
.d-meta{font-size:12px;color:var(--sub);margin-bottom:20px;letter-spacing:.02em}

/* ============ 编辑表单 ============ */
.edit-sec{
  background:var(--card);border:1px solid var(--line-strong);
  border-radius:var(--radius);padding:18px 22px;margin-bottom:16px;
}
.edit-sec h3{
  font-size:13px;margin-bottom:14px;color:var(--sub);font-weight:600;
  letter-spacing:.06em;text-transform:uppercase;
}
.edit-sec h3::before{content:"§ ";color:var(--accent)}

.egrid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.fld label{display:block;font-size:12px;color:var(--sub);margin-bottom:5px}
.fld input,.fld textarea,.fld select{
  width:100%;padding:8px 11px;border:1px solid var(--line-strong);
  border-radius:var(--radius);font-size:13px;outline:none;font-family:inherit;
  background:var(--card);color:var(--txt);
  transition:border-color .18s var(--ease),box-shadow .18s var(--ease);
}
.fld input:focus,.fld textarea:focus,.fld select:focus{
  border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft);
}
.fld.full{grid-column:1/-1}
.fld textarea{resize:vertical;min-height:64px}

/* 单条目编辑块 */
.entry-edit{
  border:1px solid var(--line);border-radius:var(--radius);
  padding:14px 16px;margin-bottom:12px;background:var(--card-2);
}
.entry-edit .etop{display:flex;gap:8px;align-items:center;margin-bottom:10px}
.entry-edit select{
  padding:7px 9px;border:1px solid var(--line-strong);border-radius:var(--radius);
  font-size:13px;background:var(--card);color:var(--txt);outline:none;font-family:inherit;
}

/* 输入框统一基类：不依赖 input[type=...] 属性选择器（未写 type 的 input 匹配不到） */
.inp{
  padding:7px 10px;border:1px solid var(--line-strong);border-radius:var(--radius);
  font-size:13px;font-family:inherit;background:var(--card);color:var(--txt);
  outline:none;min-width:0;
  transition:border-color .18s var(--ease),box-shadow .18s var(--ease);
}
.inp::placeholder{color:var(--sub);opacity:.7}
.inp:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.inp.vl{flex:1}
.inp.mono{font-family:var(--mono)}

.efield-row{display:flex;gap:8px;align-items:center;margin-bottom:8px}
.efield-row .lb{width:112px;flex-shrink:0}
.chk{display:flex;align-items:center;gap:4px;font-size:12px;color:var(--sub);white-space:nowrap;cursor:pointer}

.fnote-wrap{margin-top:6px}
.fnote{width:100%;font-size:12px}
.add-field{margin-top:8px}

/* 新增条目类型按钮 */
.etypebtns{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.etypebtn{
  border:1px dashed var(--line-strong);background:none;border-radius:var(--radius);
  padding:7px 14px;cursor:pointer;font-size:13px;color:var(--sub);font-family:inherit;
  transition:border-color .18s var(--ease),color .18s var(--ease),background .18s var(--ease);
}
.etypebtn:hover{
  border-style:solid;border-color:var(--accent);color:var(--accent-deep);background:var(--accent-soft);
}

/* ============ 窄屏 ============ */
@media (max-width:900px){
  .list{width:100%;max-height:38vh;border-right:none;border-bottom:1px solid var(--line-strong)}
  .egrid{grid-template-columns:1fr}
}
</style>
