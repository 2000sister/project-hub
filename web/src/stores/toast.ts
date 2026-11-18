/** 全局轻提示 */
import { reactive } from 'vue'

export const toastState = reactive({ msg: '', show: false })
let timer: ReturnType<typeof setTimeout> | undefined

export function toast(msg: string): void {
  toastState.msg = msg
  toastState.show = true
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => (toastState.show = false), 1600)
}
