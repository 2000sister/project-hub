/** 搜索工具：全局查询、多关键词 AND、命中高亮（V1 逻辑迁移，TS 化） */
import { computed, ref } from 'vue'

export const query = ref('')

/** 多关键词（空格分隔，AND 语义） */
export const terms = computed(() =>
  query.value.trim().toLowerCase().split(/\s+/).filter(Boolean)
)

export function matchAll(hay: string, ts: string[]): boolean {
  const low = (hay || '').toLowerCase()
  return ts.length > 0 && ts.every((t) => low.includes(t))
}

function escHtml(s: string): string {
  return (s || '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  )
}

function escRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 命中高亮：返回 HTML（配合 v-html 使用，已做转义防注入） */
export function hl(text: string, ts: string[]): string {
  if (!text || !ts.length) return escHtml(text)
  const re = new RegExp(`(${ts.map(escRe).join('|')})`, 'gi')
  return text
    .split(re)
    .map((seg, i) => (i % 2 ? `<mark>${escHtml(seg)}</mark>` : escHtml(seg)))
    .join('')
}

export function fmtTime(ts?: number): string {
  if (!ts) return ''
  const diff = (Date.now() - ts) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} 天前`
  const d = new Date(ts)
  return `${d.getMonth() + 1}-${d.getDate()}`
}

import type { Project } from '@/api/types'

/** 项目级搜索（多关键词 AND）：返回匹配的项目集合 */
export function filterProjects(projects: Project[], ts: string[]): Project[] {
  if (!ts.length) return projects
  return projects.filter((p) => {
    const hay = [
      p.name, p.alias || '', (p.tags || []).join(' '), p.note || '',
      ...p.entries.flatMap((e) => [e.name, e.note, ...e.fields.map((f) => `${f.label} ${f.value}`)])
    ].join(' ')
    return matchAll(hay, ts)
  })
}

/** 回车直达：第一个匹配项目 */
export function firstMatchProject(projects: Project[], ts: string[]): Project | undefined {
  return filterProjects(projects, ts)[0]
}
