<template>
  <div class="auth-wrap">
    <div class="auth-card">
      <h1>🗂 项目连接信息卡</h1>
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
  background-image:radial-gradient(oklch(90% 0.015 80) 1px,transparent 1px);
  background-size:24px 24px;
}

.auth-card{
  background:var(--card);border:1px solid var(--line-strong);border-radius:10px;
  box-shadow:0 1px 2px oklch(30% 0.02 70 / .08),0 16px 40px oklch(30% 0.02 70 / .1);
  padding:36px 34px;width:380px;text-align:center;
}
.auth-card h1{font-family:var(--serif);font-size:21px;margin-bottom:8px;letter-spacing:.02em}
.auth-card h1::before{
  content:"录";display:inline-flex;align-items:center;justify-content:center;
  width:40px;height:40px;border-radius:8px;background:var(--accent);color:#fff;
  font-size:20px;margin-bottom:12px;
  box-shadow:inset 0 0 0 2px oklch(100% 0 0 / .35);
}
.auth-card p{font-size:12px;color:var(--sub);margin-bottom:18px;line-height:1.7}
.auth-card .auth-hint{text-align:left}

.auth-card input{
  width:100%;padding:10px 13px;border:1px solid var(--line-strong);
  border-radius:var(--radius);font-size:14px;outline:none;margin-bottom:12px;
  background:var(--bg);color:var(--txt);font-family:inherit;
  transition:border-color .18s var(--ease),box-shadow .18s var(--ease),background .18s;
}
.auth-card input:focus{
  border-color:var(--accent);background:var(--card);box-shadow:0 0 0 3px var(--accent-soft);
}
.auth-card .btn{width:100%;padding:10px;margin-top:2px}

.auth-msg{font-size:12px;color:var(--danger);margin-top:10px;min-height:16px}
</style>
