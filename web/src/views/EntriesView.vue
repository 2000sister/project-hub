<template>
  <main class="main">
    <section class="detail content-col entries-page">
      <!-- 筛选栏：项目标签（多选任一命中）+ 条目类型（PRD FR-09） -->
      <div class="filterbar">
        <div class="fb-head">
          <span class="fb-title">筛选</span>
          <span class="fb-note">共 {{ rows.length }} 个连接条目{{ terms.length ? '（含搜索过滤）' : '' }}</span>
        </div>
        <div class="chiprow">
          <span class="lbl">项目标签</span>
          <template v-if="allTags.length">
            <span
              v-for="t in allTags"
              :key="t.name"
              :class="['chip', selTags.has(t.name) ? 'on' : '']"
              @click="toggle(selTags, t.name)"
            >{{ t.name }}<span class="n">{{ t.count }}</span></span>
          </template>
          <span v-else class="muted-note">
            {{ canEdit ? '暂无标签，在编辑项目时可添加' : '暂无标签' }}
          </span>
          <span v-if="selTags.size" class="chip" @click="selTags.clear()">清除</span>
        </div>
        <div class="chiprow">
          <span class="lbl">条目类型</span>
          <span
            v-for="t in allTypes"
            :key="t.name"
            :class="['chip', selTypes.has(t.name) ? 'on' : '', !t.count ? 'zero' : '']"
            @click="toggle(selTypes, t.name)"
          >
            <Icon :name="iconName(TYPES[t.name].icon)" :size="12" />
            {{ TYPES[t.name].label }}<span class="n">{{ t.count }}</span>
          </span>
          <span v-if="selTypes.size" class="chip" @click="selTypes.clear()">清除</span>
        </div>
      </div>

      <EntryCard v-for="r in rows" :key="r.entry.id" :entry="r.entry" :project="r.project" />
      <div v-if="!rows.length" class="empty">没有符合条件的条目<br />试试清除筛选或更换关键词</div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import EntryCard from '@/components/EntryCard.vue'
import { TYPES } from '@/api/types'
import Icon from '@/components/Icon.vue'
import { iconName } from '@/components/icons'
import type { Project } from '@/api/types'
import { dataStore } from '@/stores/data'
import { canEdit } from '@/stores/session'
import { terms, matchAll } from '@/utils/search'

interface NamedCount { name: string; count: number }

const selTags = reactive(new Set<string>())
const selTypes = reactive(new Set<string>())

function toggle(set: Set<string>, v: string): void {
  set.has(v) ? set.delete(v) : set.add(v)
}

const allTags = computed<NamedCount[]>(() => {
  const map = new Map<string, number>()
  dataStore.projects.forEach((p) => (p.tags || []).forEach((t) => map.set(t, (map.get(t) || 0) + 1)))
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})

const allTypes = computed<NamedCount[]>(() => {
  const keys = Object.keys(TYPES)
  return keys.map((k) => ({
    name: k,
    count: dataStore.projects.reduce(
      (s, p) => s + p.entries.filter((e) => e.type === k).length, 0
    )
  }))
})

type EntryT = Project['entries'][number]
interface Row { project: Project; entry: EntryT }

const rows = computed<Row[]>(() => {
  const ts = terms.value
  const out: Row[] = []
  dataStore.projects.forEach((p) => {
    // 标签筛选：多选 OR（任一命中）
    if (selTags.size && !(p.tags || []).some((t) => selTags.has(t))) return
    const projectHay = [p.name, p.alias || '', (p.tags || []).join(' '), p.note || ''].join(' ')
    const projectMatch = !ts.length || matchAll(projectHay, ts)
    p.entries.forEach((e) => {
      if (selTypes.size && !selTypes.has(e.type)) return
      const entryHay = [e.name, e.note, ...e.fields.map((f) => `${f.label} ${f.value}`)].join(' ')
      if (ts.length && !projectMatch && !matchAll(entryHay, ts)) return
      out.push({ project: p, entry: e })
    })
  })
  return out
})
</script>

<style scoped>
/* 全部条目页：内容区撑满，信息块由 .content-col 限宽居中；这里只补顶部留白 */
.entries-page{padding-top:30px}

/* ============ 筛选栏 ============
   页面级控件不画卡片：详情页面上只应有一种卡片（条目卡），
   筛选直接落在纸面上，用一条横线收尾，比一张大卡轻得多 */
.filterbar{
  padding:0 0 12px;margin-bottom:14px;
  border-bottom:1px solid var(--line-strong);
}
.fb-head{
  display:flex;align-items:baseline;justify-content:space-between;gap:12px;
  margin-bottom:9px;
}
.fb-title{font-size:11.5px;font-weight:600;color:var(--sub);letter-spacing:.06em}
.fb-note{font-size:11.5px;color:var(--sub);font-variant-numeric:tabular-nums}

.chiprow{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:10px}
.chiprow:last-child{margin-bottom:0}
.chiprow .lbl{
  font-size:11.5px;color:var(--sub);width:62px;flex-shrink:0;letter-spacing:.04em;
}

.chip{
  display:inline-flex;align-items:center;gap:4px;
  border:1px solid var(--line-strong);background:var(--card);border-radius:3px;
  padding:3px 10px;font-size:12px;cursor:pointer;color:var(--sub);font-family:inherit;
  user-select:none;line-height:1.7;
  transition:border-color var(--dur-1) var(--ease),color var(--dur-1) var(--ease),
             background var(--dur-1) var(--ease),box-shadow var(--dur-1) var(--ease);
}
.chip:hover{border-color:var(--accent-line);color:var(--accent-deep);background:var(--accent-soft)}
.chip.zero{opacity:.45}          /* 没有条目的类型不必抢同一档视觉重量 */
.chip.zero:hover{opacity:.7;background:var(--card);border-color:var(--line-strong);color:var(--sub)}
.chip.on{
  background:var(--accent-soft);border-color:var(--accent);color:var(--accent-deep);
  font-weight:600;box-shadow:inset 0 0 0 1px var(--accent);
}
.chip .n{opacity:.7;font-size:11px;margin-left:3px;font-variant-numeric:tabular-nums}

.muted-note{font-size:11.5px;color:var(--sub);opacity:.75}
</style>
