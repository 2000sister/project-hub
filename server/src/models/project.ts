/** 项目模型：结构校验与种子数据（EX-06 导入格式防护） */
import type { Entry, Field, Project } from '../types.js'

/** 导入/保存的结构校验：只要求 name 与 entries 形状正确 */
export function isProjectList(value: unknown): value is Project[] {
  return (
    Array.isArray(value) &&
    value.every(
      (p) =>
        !!p &&
        typeof (p as Project).name === 'string' &&
        Array.isArray((p as Project).entries ?? [])
    )
  )
}

const uid = (): string => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

const field = (label: string, value: string, secret = false): Field => ({ label, value, secret })

const entry = (type: string, name: string, fields: Field[]): Entry => ({
  id: uid(),
  type,
  name,
  note: '',
  fields
})

/** 首次启动示例数据（可编辑删除；与 legacy 种子一致） */
export function seedProjects(): Project[] {
  return [
    {
      id: uid(), name: '示例 · 电商中台', alias: 'shop, 商城', tags: ['生产', '测试'],
      updatedAt: Date.now(),
      note: '核心业务项目，所有环境信息都在这里维护。此卡片为示例数据，可编辑或删除。',
      entries: [
        entry('web', '生产环境管理后台', [field('地址', 'https://admin.example.com'), field('账号', 'ops_admin'), field('密码', 'Demo#2026!', true)]),
        entry('jenkins', 'CI/CD Jenkins', [field('地址', 'http://jenkins.example.com:8080'), field('账号', 'deployer'), field('密码/Token', '11aabbcc22ddeeff', true)]),
        entry('ssh', '测试服务器', [field('地址', '192.168.1.101'), field('端口', '22'), field('账号', 'root'), field('密码/密钥', 'Ssh#Demo123', true)]),
        entry('jump', '生产跳板机', [field('地址', 'jump.example.com'), field('端口', '2222'), field('账号', 'jumpuser'), field('密码', 'Jump#Demo456', true)]),
        entry('remote', '运维机（向日葵）', [field('设备ID/地址', '1234 5678 9012'), field('连接密码', 'sun#Demo789', true), field('验证码', '', true)])
      ]
    },
    {
      id: uid(), name: '示例 · 数据平台', alias: 'bi, 数仓', tags: ['内部'],
      updatedAt: Date.now(),
      note: '包含数仓各组件连接信息。',
      entries: [
        entry('web', '数据平台门户', [field('地址', ''), field('账号', ''), field('密码', '', true)]),
        entry('ssh', 'Hadoop 主节点', [field('地址', '10.0.2.15'), field('端口', '22'), field('账号', 'hadoop'), field('密码/密钥', 'Hd#Demo321', true)]),
        entry('custom', 'VPN 连接', [field('内容', '公司 VPN：vpn.example.com，端口 443，账号 zhangsan'), field('密码/口令', '', true)])
      ]
    }
  ]
}
