<template>
  <div class="auth-wrap">
    <div class="auth-card">
      <h1>项目连接信息卡</h1>
      <p>输入口令进入 · 数据存于局域网服务端</p>

      <template v-if="mode === 'setup'">
        <input
          v-model="viewPassword"
          type="password"
          placeholder="设置查看口令（同事使用）"
          autocomplete="new-password"
          @keyup.enter="focusEdit"
        />
        <input
          ref="editInput"
          v-model="editPassword"
          type="password"
          placeholder="设置编辑口令（自己使用）"
          autocomplete="new-password"
          @keyup.enter="submit"
        />
        <p class="auth-hint">
          首次使用：查看口令给同事（只读），编辑口令只给自己（可增删改）。两个口令不要设成一样的。
        </p>
      </template>
      <template v-else>
        <input
          v-model="password"
          type="password"
          placeholder="访问口令"
          autocomplete="current-password"
          @keyup.enter="submit"
        />
      </template>

      <button class="btn primary" @click="submit">
        {{ mode === 'setup' ? '完成设置并进入' : '进入' }}
      </button>
      <div class="auth-msg">{{ msg }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { sessionStore } from '@/stores/session'
import { toast } from '@/stores/toast'
import { dataActions } from '@/stores/data'

const props = defineProps<{ mode: 'login' | 'setup' }>()

const viewPassword = ref('')
const editPassword = ref('')
const password = ref('')
const msg = ref('')
const editInput = ref<HTMLInputElement>()

async function submit(): Promise<void> {
  msg.value = ''
  try {
    if (props.mode === 'setup') {
      if (!viewPassword.value || !editPassword.value) {
        msg.value = '两套口令均不能为空'
        return
      }
      await sessionStore.submitSetup(viewPassword.value, editPassword.value)
    } else {
      if (!password.value) {
        msg.value = '请输入口令'
        return
      }
      await sessionStore.submitLogin(password.value)
      password.value = ''
    }
    await dataActions.load()
    toast('欢迎回来')
  } catch (e) {
    msg.value = (e as Error).message || '操作失败'
    password.value = ''
  }
}

function focusEdit(): void {
  editInput.value?.focus()
}
</script>

<style scoped>
/* ============ 口令页 ============ */
.auth-wrap{
  position:fixed;inset:0;background:var(--bg);
  display:flex;align-items:center;justify-content:center;z-index:50;
  background-image:radial-gradient(oklch(90.5% 0.012 80) 1px,transparent 1px);
  background-size:26px 26px;
  animation:fadeIn var(--dur-3) var(--ease) both;
}

.auth-card{
  background:var(--card);
  border:1px solid var(--line);
  border-radius:var(--radius-lg);
  border-color:var(--line-strong);
  box-shadow:var(--shadow-2);
  padding:34px 32px 28px;width:380px;text-align:center;
  animation:popIn var(--dur-3) var(--ease) both;
}
.auth-card h1{
  font-family:var(--serif);font-size:20px;margin-bottom:9px;letter-spacing:.02em;
  -webkit-text-stroke:.2px currentColor;
}
.auth-card h1::before{
  content:"录";display:flex;align-items:center;justify-content:center;
  width:44px;height:44px;border-radius:7px;background:var(--accent);
  color:oklch(99% 0.004 178);
  font-size:21px;margin:0 auto 13px;
  box-shadow:inset 0 0 0 2px oklch(100% 0 0 / .32),
             0 4px 14px oklch(40% 0.08 180 / .24);
}
.auth-card p{font-size:12px;color:var(--sub);margin-bottom:18px;line-height:1.7}
.auth-card .auth-hint{text-align:left}

.auth-card input{
  width:100%;padding:11px 14px;border:1px solid var(--line-strong);
  border-radius:var(--radius);font-size:14px;outline:none;margin-bottom:11px;
  background:var(--paper);color:var(--txt);font-family:inherit;
  box-shadow:inset 0 1px 1px oklch(28% 0.02 70 / .04);
  transition:border-color var(--dur-2) var(--ease),
             box-shadow var(--dur-2) var(--ease),
             background var(--dur-2) var(--ease);
}
.auth-card input:focus{
  border-color:var(--accent);background:var(--card);
  box-shadow:0 0 0 3px var(--accent-soft);
}
.auth-card .btn{width:100%;padding:11px;margin-top:3px;font-size:13.5px}

.auth-msg{
  font-size:12px;color:var(--danger);margin-top:11px;min-height:16px;
  animation:fadeIn var(--dur-2) var(--ease) both;
}
</style>
