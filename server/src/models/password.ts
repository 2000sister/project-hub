/** 口令模型：加盐 scrypt 哈希、创建/更新/校验（FR-01/02/15） */
import type { Auth, Level } from '../types.js'
import { randomHex, scryptHex } from '../utils/crypto.js'

export const SALT_BYTES = 16

/** 首次设置：两套口令共用同一 salt */
export function createCredentials(viewPassword: string, editPassword: string): Auth {
  const salt = randomHex(SALT_BYTES)
  return {
    salt,
    viewHash: scryptHex(viewPassword, salt),
    editHash: scryptHex(editPassword, salt)
  }
}

/**
 * 修改口令：未提供的一套沿用原哈希 —— 必须复用原 salt，
 * 否则旧哈希是按旧 salt 算的，那套口令会永久失效。
 */
export function updateCredentials(current: Auth, viewPassword?: string, editPassword?: string): Auth {
  return {
    salt: current.salt,
    viewHash: viewPassword ? scryptHex(viewPassword, current.salt) : current.viewHash,
    editHash: editPassword ? scryptHex(editPassword, current.salt) : current.editHash
  }
}

/** 先判编辑口令，再判查看口令；都不匹配返回 null */
export function verifyPassword(auth: Auth, password: string): Level | null {
  const hash = scryptHex(password, auth.salt)
  if (hash === auth.editHash) return 'edit'
  if (hash === auth.viewHash) return 'view'
  return null
}
