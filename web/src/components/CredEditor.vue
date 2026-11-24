<template>
  <div class="cred-edit">
    <div class="cred-edit-head">
      <input
        v-model="cred.label"
        class="inp lb"
        placeholder="用途 / 归属，如：超级管理员、惠南用户（可留空）"
      />
      <button class="btn sm" title="上移" :disabled="!!isFirst" @click="$emit('move', -1)">
        <Icon name="arrow-up" :size="12" />
      </button>
      <button class="btn sm" title="下移" :disabled="!!isLast" @click="$emit('move', 1)">
        <Icon name="arrow-down" :size="12" />
      </button>
      <button class="btn sm danger" title="删除该账号组" @click="$emit('remove')">删除</button>
    </div>
    <div class="cred-edit-row">
      <label class="cfld">
        <span>账号</span>
        <input v-model="cred.username" class="inp" placeholder="登录账号" autocomplete="off" />
      </label>
      <label class="cfld">
        <span>密码</span>
        <div class="pwd-wrap">
          <input
            v-model="cred.password"
            class="inp mono"
            :type="showPwd ? 'text' : 'password'"
            placeholder="登录密码 / Token"
            autocomplete="new-password"
          />
          <button
            type="button"
            class="eye"
            :title="showPwd ? '隐藏密码' : '显示密码'"
            @click="showPwd = !showPwd"
          >
            <Icon :name="showPwd ? 'eye-off' : 'eye'" :size="13" />
          </button>
        </div>
      </label>
    </div>
    <input
      v-model="cred.note"
      class="inp cred-note"
      placeholder="该账号的备注：权限范围、有效期、注意事项…"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Credential } from '@/api/types'
import Icon from '@/components/Icon.vue'

/** 单个账号块编辑：只负责渲染与上抛事件，数组顺序由父组件维护 */
defineProps<{ cred: Credential; isFirst: boolean; isLast: boolean }>()
defineEmits<{ move: [dir: number]; remove: [] }>()

/** 密码默认隐藏，编辑时可按需查看 */
const showPwd = ref(false)
</script>

<style scoped>
.cred-edit{
  background:var(--bg);border:1px solid var(--line);border-radius:var(--radius);
  padding:11px 13px;margin-bottom:9px;
  transition:border-color var(--dur-1) var(--ease);
}
.cred-edit:hover{border-color:var(--line-strong)}
.cred-edit-head{display:flex;gap:8px;align-items:center;margin-bottom:8px}
.cred-edit-head .lb{flex:1}
.cred-edit-row{display:flex;gap:10px;margin-bottom:8px}
.cfld{flex:1;display:flex;flex-direction:column;gap:4px;min-width:0}
.cfld span{font-size:11.5px;color:var(--sub)}
.cred-note{width:100%;font-size:12px}

.inp{
  padding:7px 10px;border:1px solid var(--line-strong);border-radius:var(--radius);
  font-size:13px;font-family:inherit;background:var(--card);color:var(--txt);
  outline:none;min-width:0;
  transition:border-color .18s var(--ease),box-shadow .18s var(--ease);
}
.inp:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.inp.mono{font-family:var(--mono)}

/* 密码框：右侧留出眼睛按钮的位置，避免文字被遮住 */
.pwd-wrap{position:relative;display:flex}
.pwd-wrap .inp{flex:1;padding-right:32px}
.pwd-wrap .eye{
  position:absolute;right:2px;top:50%;transform:translateY(-50%);
  border:none;background:none;cursor:pointer;font-size:13px;line-height:1;
  padding:4px 6px;border-radius:4px;color:var(--sub);
  transition:background .15s,color .15s;
}
.pwd-wrap .eye:hover{background:var(--accent-soft);color:var(--accent-deep)}

.btn:disabled{opacity:.4;cursor:not-allowed}
.btn:disabled:hover{border-color:var(--line-strong);color:var(--txt)}
</style>
