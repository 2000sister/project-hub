<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="share-card overlay-card">
      <div class="share-head">
        <h2>分享「{{ project.name }}」</h2>
        <button class="btn sm" @click="$emit('close')">关闭</button>
      </div>

      <div class="share-body">
        <div class="share-pick">
          <div class="pick-head">
            <span>选择要分享的条目（{{ selected.size }} / {{ project.entries.length }}）</span>
            <span class="pick-ops">
              <button class="btn sm" @click="selectAll">全选</button>
              <button class="btn sm" @click="selected.clear()">全不选</button>
            </span>
          </div>
          <label v-for="row in entryRows" :key="row.entry.id" class="pick-row">
            <input
              type="checkbox"
              :checked="selected.has(row.entry.id)"
              @change="toggle(row.entry.id)"
            />
            <span class="pick-name">
              <Icon :name="iconName(row.tpl.icon)" :size="12" class="pick-ic" />
              {{ row.entry.name || row.tpl.label }}
            </span>
            <span class="pick-type">{{ row.tpl.label }}</span>
            <span class="pick-count">{{ row.creds }} 组账号</span>
          </label>
          <div v-if="!project.entries.length" class="pick-empty">该项目还没有条目</div>
        </div>

        <div class="share-out">
          <div class="opt-row">
            <label class="chk">
              <input v-model="includeSecrets" type="checkbox" />
              包含敏感值（密码 / 密钥）
            </label>
            <label class="chk">
              <input v-model="includeNotes" type="checkbox" />
              包含备注
            </label>
          </div>
          <p v-if="includeSecrets" class="warn">
            <Icon name="warning" :size="13" /> 文本含明文密码，只发给可信同事；聊天工具会留存记录。
          </p>

          <textarea
            ref="outEl"
            class="share-text"
            readonly
            :value="text"
            @focus="outEl?.select()"
          ></textarea>

          <div class="share-actions">
            <button class="btn primary" :disabled="!selected.size" @click="doCopy">
              <Icon name="copy" :size="13" /> 复制文本
            </button>
            <button class="btn" :disabled="!selected.size" @click="doDownload">下载 .txt</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { TYPES } from '@/api/types'
import Icon from '@/components/Icon.vue'
import { iconName } from '@/components/icons'
import type { Project } from '@/api/types'
import { copyText } from '@/utils/clipboard'
import { toast } from '@/stores/toast'
import { buildShareText } from './shareText'

const props = defineProps<{ project: Project }>()
defineEmits<{ close: [] }>()

const selected = reactive(new Set<string>(props.project.entries.map((e) => e.id)))
const includeSecrets = ref(true)
const includeNotes = ref(true)
const outEl = ref<HTMLTextAreaElement>()

/** 条目选择行的展示数据（类型模板与已填字段数只算一次） */
const entryRows = computed(() =>
  props.project.entries.map((entry) => ({
    entry,
    tpl: TYPES[entry.type] ?? TYPES.custom,
    creds: entry.creds.length
  }))
)

const text = computed(() =>
  buildShareText(props.project, [...selected], {
    includeSecrets: includeSecrets.value,
    includeNotes: includeNotes.value
  })
)

function toggle(id: string): void {
  selected.has(id) ? selected.delete(id) : selected.add(id)
}

function selectAll(): void {
  props.project.entries.forEach((e) => selected.add(e.id))
}

async function doCopy(): Promise<void> {
  if (!(await copyText(text.value))) {
    toast('复制失败，请手动全选文本框复制')
    return
  }
  toast('已复制分享文本 ✓')
}

function doDownload(): void {
  const blob = new Blob([text.value], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${props.project.name}-连接信息.txt`
  a.click()
  URL.revokeObjectURL(a.href)
  toast('已下载 ✓')
}
</script>

<style scoped>
.share-card{
  max-width:820px;max-height:100%;display:flex;flex-direction:column;
}

.share-head{
  display:flex;align-items:center;gap:12px;padding:16px 22px;
  border-bottom:1px solid var(--line-strong);
}
.share-head h2{
  font-family:var(--serif);font-size:18px;font-weight:700;
  flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}

.share-body{display:flex;gap:18px;padding:18px 22px;overflow:auto;min-height:0}
.share-pick{width:320px;flex-shrink:0;display:flex;flex-direction:column}
.pick-head{
  display:flex;align-items:center;justify-content:space-between;gap:8px;
  font-size:12px;color:var(--sub);margin-bottom:10px;
}
.pick-ops{display:flex;gap:6px}
.pick-row{
  display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:3px;
  cursor:pointer;font-size:12.5px;
  transition:background .15s var(--ease);
}
.pick-row:hover{background:var(--accent-soft)}
.pick-name{
  flex:1;display:inline-flex;align-items:center;gap:5px;min-width:0;
  overflow:hidden;white-space:nowrap;text-overflow:ellipsis;
}
.pick-name .pick-ic{opacity:.75}
.pick-type{font-size:11px;color:var(--sub);flex-shrink:0}
.pick-count{font-size:11px;color:var(--sub);flex-shrink:0;font-variant-numeric:tabular-nums}
.pick-empty{font-size:12px;color:var(--sub);padding:12px 8px}

.share-out{flex:1;display:flex;flex-direction:column;min-width:0}
.opt-row{display:flex;gap:18px;margin-bottom:8px}
.chk{display:flex;align-items:center;gap:5px;font-size:12px;color:var(--sub);cursor:pointer}
.warn{display:flex;align-items:center;gap:5px;font-size:12px;color:var(--danger);margin-bottom:8px}

.share-text{
  flex:1;min-height:260px;resize:vertical;
  padding:12px 14px;border:1px solid var(--line-strong);border-radius:var(--radius);
  font-family:var(--mono);font-size:12.5px;line-height:1.7;
  background:var(--card-2);color:var(--txt);outline:none;
}
.share-text:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}

.share-actions{display:flex;gap:8px;margin-top:12px;justify-content:flex-end}

@media (max-width:760px){
  .share-body{flex-direction:column}
  .share-pick{width:100%;max-height:32vh;overflow:auto}
}
</style>
