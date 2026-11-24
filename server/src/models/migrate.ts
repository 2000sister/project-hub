/** 存量结构迁移：旧条目把账号密码混在 fields 里，这里拆成 creds（与前端 api/migrate.ts 规则一致） */
import type { Credential, Entry, Field, Project } from '../types.js'

/** 资源自身属性：无论名字如何都保留在 entry.fields */
const RESOURCE_LABELS: Record<string, true> = {
  '地址': true, '端口': true, '库名': true, '类型': true,
  '设备ID/地址': true, '验证码': true, '内容': true
}
const USER_ROLES = ['账号', '帐号', '用户名', '用户', 'username', 'account']
const PASS_ROLES = ['密码/Token', '密码/token', '密码', '口令', '密钥', 'password', 'passwd', 'pwd']

const uid = (): string => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

interface Role {
  kind: 'user' | 'pass'
  /** 用途名：字段名去掉角色词后的剩余文字 */
  prefix: string
}

/** 识别账号类字段；非账号字段返回 null。数字后缀（账号1/密码1）编号即用途名 */
function roleOf(label: string): Role | null {
  const l = label.trim()
  if (RESOURCE_LABELS[l]) return null
  const numbered = /^(.*?)(账号|帐号|用户名|密码|口令|密钥)(\d+)$/.exec(l)
  if (numbered) {
    const isUser = /账号|帐号|用户名/.test(numbered[2])
    return { kind: isUser ? 'user' : 'pass', prefix: (numbered[1] ? numbered[1] + '-' : '') + numbered[3] }
  }
  for (const word of USER_ROLES) {
    if (l.toLowerCase().endsWith(word.toLowerCase())) {
      return { kind: 'user', prefix: l.slice(0, l.length - word.length).replace(/[.\s]+$/, '') }
    }
  }
  for (const word of PASS_ROLES) {
    if (l.toLowerCase().endsWith(word.toLowerCase())) {
      return { kind: 'pass', prefix: l.slice(0, l.length - word.length).replace(/[.\s]+$/, '') }
    }
  }
  return null
}

/** 拆字段：资源字段保留，账号/密码按用途名前缀配对成账号块 */
export function splitFields(fields: Field[]): { fields: Field[]; creds: Credential[] } {
  const kept: Field[] = []
  const blocks = new Map<string, { username: string; password: string }>()

  for (const f of fields) {
    const role = roleOf(f.label)
    if (!role) {
      kept.push(f)
      continue
    }
    const block = blocks.get(role.prefix) ?? { username: '', password: '' }
    if (role.kind === 'user') block.username = f.value
    else block.password = f.value
    blocks.set(role.prefix, block)
  }

  const creds: Credential[] = []
  for (const [prefix, v] of blocks) {
    if (!v.username && !v.password) continue
    creds.push({ id: uid(), label: prefix, username: v.username, password: v.password, note: '' })
  }
  return { fields: kept, creds }
}

/** 迁移单个条目：已有 creds 则原样返回（幂等） */
export function migrateEntry(entry: Entry): Entry {
  if (Array.isArray(entry.creds) && entry.creds.length) return entry
  const split = splitFields(entry.fields ?? [])
  return { ...entry, fields: split.fields, creds: split.creds }
}

/** 迁移项目列表；返回新数组，不改入参。用于保存/导入时接住老客户端提交的旧结构 */
export function migrateProjects(projects: Project[]): Project[] {
  return projects.map((p) => ({ ...p, entries: (p.entries ?? []).map(migrateEntry) }))
}
