/** 分享 / 复制文本生成：纯函数（无 Vue 依赖），条目整条复制与分享面板共用同一格式 */
import { TYPES } from '@/api/types'
import type { Credential, Entry, Project } from '@/api/types'

export interface TextOptions {
  includeSecrets: boolean
  includeNotes: boolean
}

const SECRET_PLACEHOLDER = '••••'

/** 项目标题：带标签时附在括号里，复制到聊天窗口后能看清属于哪个项目 */
function projectTitle(project: Project): string {
  return project.tags?.length
    ? `${project.name}（${project.tags.join(' / ')}）`
    : project.name
}

/** 条目标题：名称与类型名重复时只保留一份（新建条目默认 name = 类型名）
 *  不拼 t.icon —— 那是给 Icon 组件用的 id（如 type-web），落到剪贴板里是噪音 */
function entryTitle(e: Entry): string {
  const t = TYPES[e.type] ?? TYPES.custom
  return e.name && e.name !== t.label ? `${e.name}（${t.label}）` : t.label
}

/** 账号块一行：`【用途】账号 / 密码`；单账号时省略用途名 */
function credLine(c: Credential, opts: TextOptions): string | null {
  if (!c.username && !c.password) return null
  const pwd = c.password && !opts.includeSecrets ? SECRET_PLACEHOLDER : c.password
  const head = c.label ? `【${c.label}】` : ''
  return `  ${head}账号：${c.username || '（空）'}   密码：${pwd || '（空）'}`
}

/** 条目正文：资源字段 + 账号块 + 备注 */
function entryBody(e: Entry, opts: TextOptions): string[] {
  const lines: string[] = []
  for (const f of e.fields) {
    if (!f.value) continue
    const value = f.secret && !opts.includeSecrets ? SECRET_PLACEHOLDER : f.value
    lines.push(`  ${f.label}：${value}`)
  }
  for (const c of e.creds) {
    const line = credLine(c, opts)
    if (line) lines.push(line)
    if (opts.includeNotes && c.note) lines.push(`    备注：${c.note}`)
  }
  if (opts.includeNotes && e.note) lines.push(`  备注：${e.note}`)
  return lines
}

/** 单条目文本：详情卡「整条复制」用；传 project 时首行带项目名作上下文 */
export function buildEntryText(e: Entry, opts: TextOptions, project?: Project): string {
  const head = project ? [projectTitle(project), ''] : []
  return [...head, entryTitle(e), ...entryBody(e, opts)].join('\n')
}

/** 多条目文本：分享面板用；entryIds 顺序无关，输出顺序始终按项目内条目顺序 */
export function buildShareText(
  project: Project,
  entryIds: readonly string[],
  opts: TextOptions
): string {
  const picked = project.entries.filter((e) => entryIds.includes(e.id))
  const lines: string[] = [projectTitle(project)]
  if (opts.includeNotes && project.note) lines.push(`备注：${project.note}`)
  for (const e of picked) {
    lines.push('', entryTitle(e), ...entryBody(e, opts))
  }
  return lines.join('\n')
}
