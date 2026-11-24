/** 存量数据迁移：把旧条目里的「X账号 / X密码」字段对拆成 creds 账号块（纯函数） */
import type { Credential, Entry, Field } from './types'
import { uid } from './types'

/** 资源自身属性：无论名字如何都保留在 entry.fields */
const RESOURCE_LABELS: Record<string, true> = {
  '地址': true, '端口': true, '库名': true, '类型': true,
  '设备ID/地址': true, '验证码': true, '内容': true
}
/** 账号角色词：作为字段名结尾时代表账号块的一部分；前面的文字即用途名 */
const USER_ROLES = ['账号', '帐号', '用户名', '用户', 'username', 'account']
const PASS_ROLES = ['密码/Token', '密码/token', '密码', '口令', '密钥', 'password', 'passwd', 'pwd']

interface Role {
  kind: 'user' | 'pass'
  /** 用途名：字段名去掉角色词后的剩余文字，如「惠南」取自「惠南用户账号」 */
  prefix: string
}

/** 识别账号类字段；非账号字段返回 null。数字后缀（账号1/密码1）也计入用途名 */
function roleOf(label: string): Role | null {
  const l = label.trim()
  if (RESOURCE_LABELS[l]) return null
  // 「账号1」「密码2」这类编号后缀：编号视作用途名，保证 账号1 与 密码1 配对
  const numbered = /^(.*?)(账号|帐号|用户名|密码|口令|密钥)(\d+)$/.exec(l)
  if (numbered) {
    const base = numbered[1]
    const isUser = /账号|帐号|用户名/.test(numbered[2])
    return { kind: isUser ? 'user' : 'pass', prefix: (base ? base + '-' : '') + numbered[3] }
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

/**
 * 拆字段：资源字段保留，账号/密码按用途名前缀配对成账号块。
 * 裸「账号 / 密码」前缀为空，归为一块；只配到一端（如只有账号没密码）也独立成块，另一端留空。
 * 输出顺序按首次出现的顺序，保证迁移结果可预测。
 */
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

/** 迁移单个条目：已有 creds 则原样返回（幂等），否则把旧字段拆分 */
export function migrateEntry(entry: Entry): Entry {
  if (entry.creds?.length) return entry
  const split = splitFields(entry.fields ?? [])
  return { ...entry, fields: split.fields, creds: split.creds }
}

/** 迁移整个项目；返回新对象，不改入参 */
export function migrateProject<T extends { entries: Entry[] }>(project: T): T {
  return { ...project, entries: project.entries.map(migrateEntry) }
}
