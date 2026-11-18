/** 局域网地址探测：只返回同事真能访问的 IPv4 地址 */
import os from 'node:os'

/** 虚拟网卡名（Hyper-V / VMware / VirtualBox / Docker / Tailscale 等），其地址只有本机虚拟机可通 */
const VIRTUAL_IFACE = /vEthernet|Hyper-V|VMware|VirtualBox|Docker|Loopback|Tailscale|TAP-|Npcap/i

/** 169.254.x.x 是 APIPA：网卡未拿到租约时自动分配的地址，跨机器不可达 */
const APIPA_PREFIX = '169.254.'

export function listShareableAddresses(): string[] {
  return Object.entries(os.networkInterfaces())
    .filter(([name]) => !VIRTUAL_IFACE.test(name))
    .flatMap(([, addrs]) => addrs ?? [])
    .filter((n) => n.family === 'IPv4' && !n.internal && !n.address.startsWith(APIPA_PREFIX))
    .map((n) => n.address)
}
