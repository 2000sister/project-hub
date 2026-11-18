/** 随机数与哈希工具：只做 crypto 封装，不含业务语义 */
import crypto from 'node:crypto'

export function randomHex(bytes = 24): string {
  return crypto.randomBytes(bytes).toString('hex')
}

/** 与 legacy V2 参数一致：scrypt 64 字节 → 旧 data.json 直接可用 */
export function scryptHex(pw: string, salt: string): string {
  return crypto.scryptSync(String(pw), salt, 64).toString('hex')
}
