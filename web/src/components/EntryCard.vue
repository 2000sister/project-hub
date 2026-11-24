<template>
  <div class="entry">
    <div v-if="project" class="entry-proj">
      <Icon name="folder" :size="12" class="proj-ic" />
      <span class="pn" v-html="hl(project.name, terms)"></span>
      <span v-for="t in project.tags || []" :key="t" class="tag">{{ t }}</span>
    </div>

    <header class="entry-head">
      <span class="etype"><Icon :name="iconName(tpl.icon)" :size="12" /> {{ tpl.label }}</span>
      <span class="ename" v-html="hl(entry.name, terms)"></span>
      <span v-if="entry.creds.length" class="counter">{{ entry.creds.length }} 组账号</span>
      <button
        class="fbtn txt copy-entry"
        title="复制整条：标题 + 地址等字段 + 全部账号（含明文密码） + 备注"
        @click="copyEntry($event)"
      >
        <Icon name="copy" /> 复制整条
      </button>
    </header>

    <p v-if="entry.note" class="entry-note">
      <span class="note-ic">注</span><span v-html="hl(entry.note, terms)"></span>
    </p>

    <!-- 资源属性：label / value / 操作三栏对齐，值统一等宽 -->
    <div v-if="entry.fields.length" class="fields">
      <div v-for="(f, i) in entry.fields" :key="i" class="frow">
        <span class="flabel" v-html="hl(f.label, terms)"></span>
        <span class="fvalue">
          <span v-if="f.secret && f.value && !revealed[i]" class="masked">••••••••••</span>
          <a v-else-if="isUrl(f.value)" :href="f.value" target="_blank" rel="noopener" v-html="hl(f.value, terms)"></a>
          <span v-else-if="f.value" v-html="hl(f.value, terms)"></span>
          <span v-else class="unset">未填写</span>
        </span>
        <span class="facts">
          <button v-if="f.value" class="fbtn" title="复制" @click="copy(f.value, $event)">
            <Icon name="copy" />
          </button>
          <button
            v-if="f.secret && f.value"
            class="fbtn"
            :title="revealed[i] ? '隐藏' : '显示'"
            @click="revealed[i] = !revealed[i]"
          >
            <Icon :name="revealed[i] ? 'eye-off' : 'eye'" />
          </button>
        </span>
      </div>
    </div>

    <!-- 账号栅栏：一组一行，组名 / 账号 / 密码 / 操作四列，一屏看完 -->
    <div v-if="entry.creds.length" class="creds">
      <div class="creds-bar">
        <span class="creds-title">账号凭据</span>
      </div>
      <div v-for="(c, ci) in entry.creds" :key="c.id" class="cred">
        <span class="cred-label">{{ c.label || '默认账号' }}</span>
        <span class="cred-user">
          <span v-if="c.username" class="mono" v-html="hl(c.username, terms)"></span>
          <span v-else class="unset">未填写</span>
          <button v-if="c.username" class="fbtn" title="复制账号" @click="copy(c.username, $event)">
            <Icon name="copy" />
          </button>
        </span>
        <span class="cred-pass">
          <span v-if="!c.password" class="unset">未填写</span>
          <span v-else-if="!revealCred[ci]" class="mono masked">••••••••••</span>
          <span v-else class="mono" v-html="hl(c.password, terms)"></span>
          <button v-if="c.password" class="fbtn" title="复制密码" @click="copy(c.password, $event)">
            <Icon name="copy" />
          </button>
          <button
            v-if="c.password"
            class="fbtn"
            :title="revealCred[ci] ? '隐藏' : '显示'"
            @click="revealCred[ci] = !revealCred[ci]"
          >
            <Icon :name="revealCred[ci] ? 'eye-off' : 'eye'" />
          </button>
        </span>
        <span class="cred-acts">
          <button class="fbtn txt" title="整组复制「账号 + 密码」" @click="copyCred(c, $event)">
            <Icon name="copy" /> 整组
          </button>
        </span>
        <p v-if="c.note" class="cred-note"><span class="note-ic">注</span><span v-html="hl(c.note, terms)"></span></p>
      </div>
    </div>
    <div v-else-if="entry.type !== 'custom'" class="no-cred">该条目未填写账号密码</div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import Icon from '@/components/Icon.vue'
import { iconName } from '@/components/icons'
import type { Credential, Entry, Project } from '@/api/types'
import { TYPES } from '@/api/types'
import { hl, terms } from '@/utils/search'
import { copyText } from '@/utils/clipboard'
import { buildEntryText } from '@/components/shareText'
import { toast } from '@/stores/toast'

const props = defineProps<{ entry: Entry; project?: Project }>()

const tpl = TYPES[props.entry.type] ?? TYPES.custom
const revealed = reactive<Record<number, boolean>>({})
const revealCred = reactive<Record<number, boolean>>({})

function isUrl(v: string): boolean {
  return /^https?:\/\//.test(v)
}

async function copy(text: string, ev: MouseEvent): Promise<void> {
  const ok = await copyText(text)
  if (!ok) {
    toast('复制失败，请手动选择复制')
    return
  }
  toast('已复制 ✓')
  const btn = ev.currentTarget as HTMLElement
  btn.classList.add('ok')
  setTimeout(() => btn.classList.remove('ok'), 800)
}

/** 整条复制：标题 + 资源字段 + 全部账号（含明文密码） + 备注，与分享面板共用同一套文本格式 */
async function copyEntry(ev: MouseEvent): Promise<void> {
  const text = buildEntryText(props.entry, { includeSecrets: true, includeNotes: true }, props.project)
  await copy(text, ev)
}

/** 整组复制：一次落进剪贴板，避免找账号密码时分开复制两次 */
async function copyCred(c: Credential, ev: MouseEvent): Promise<void> {
  const lines: string[] = []
  if (c.label) lines.push(`【${c.label}】`)
  if (c.username) lines.push(`账号：${c.username}`)
  if (c.password) lines.push(`密码：${c.password}`)
  await copy(lines.join('\n'), ev)
}
</script>

<style scoped>
/* ============ 条目卡：一张档案卡，不是浮起的卡片 ============
   单层 hairline 边框 + 一层极轻投影；内部靠发丝线与纸底分区，不再嵌套卡片 */
.entry{
  background:var(--card);
  border:1px solid var(--line-strong);
  border-radius:var(--radius-lg);
  margin-bottom:14px;
  overflow:hidden;
  box-shadow:var(--shadow-1);
}

/* 全部条目页顶部的项目归属行 */
.entry-proj{
  display:flex;align-items:center;gap:6px;flex-wrap:wrap;
  padding:8px 16px 0;font-size:11.5px;color:var(--sub);
}
.entry-proj .proj-ic{opacity:.6;flex-shrink:0}
.entry-proj .pn{font-weight:600;color:var(--txt-soft)}

/* ---------- 卡片抬头 ---------- */
.entry-head{
  display:flex;align-items:center;gap:9px;
  padding:10px 16px 11px;
  border-bottom:1px solid var(--line);
}
.etype{
  display:inline-flex;align-items:center;gap:4px;flex-shrink:0;
  font-size:11px;line-height:1.6;padding:1px 8px;
  border-radius:99px;
  background:var(--accent-soft);color:var(--accent-deep);
  border:1px solid var(--accent-line);
  letter-spacing:.02em;
}
.entry-head .ename{
  flex:1;min-width:0;
  font-weight:600;font-size:14px;letter-spacing:.005em;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.counter{
  margin-left:auto;font-size:11.5px;color:var(--sub);
  font-variant-numeric:tabular-nums;white-space:nowrap;
}

/* ---------- 备注 ---------- */
.entry-note{
  position:relative;
  padding:9px 16px 0 37px;margin:0;   /* 16 + 注签 14 + 间距 7 */
  font-size:12.5px;line-height:1.65;color:var(--sub);
}
.entry-note .note-ic{position:absolute;left:16px;top:10px}

/* ---------- 资源字段 ---------- */
.fields{padding:8px 16px 10px}
.frow{
  display:grid;
  grid-template-columns:86px minmax(0,1fr) auto;
  align-items:baseline;gap:10px;
  padding:7px 8px;margin:0 -8px;
  border-bottom:1px solid var(--line);
}
.frow:last-child{border-bottom:none}
.frow:hover{background:var(--card-2)}
.flabel{font-size:11.5px;color:var(--sub);letter-spacing:.02em}
.fvalue{
  font-family:var(--mono);font-size:13px;line-height:1.5;
  word-break:break-all;color:var(--txt);
}
.fvalue a{
  color:var(--accent-deep);text-decoration:none;
  border-bottom:1px solid var(--accent-line);
  transition:border-color var(--dur-1) var(--ease);
}
.fvalue a:hover{border-bottom-color:var(--accent)}
.masked{letter-spacing:1.5px;color:var(--sub);font-size:12px}
.unset{color:var(--sub);opacity:.55;font-family:var(--sans);font-size:12px}
.facts{display:flex;gap:1px;justify-self:end;align-self:center}

/* ---------- 账号栅栏 ---------- */
.creds{
  border-top:1px solid var(--line-strong);
  background:var(--card-2);
  padding:9px 16px 12px;
}
.creds-bar{
  display:flex;align-items:baseline;
  padding:0 0 6px;
}
.creds-title{font-size:11.5px;font-weight:600;color:var(--sub);letter-spacing:.06em}

.cred{
  display:grid;
  grid-template-columns:132px 158px minmax(0,1fr) 56px;
  align-items:center;gap:10px;
  padding:6px 8px;margin:0 -8px;
  border-bottom:1px solid var(--line);
  border-radius:3px;
  transition:background var(--dur-1) var(--ease);
}
.cred:last-child{border-bottom:none}
.cred:hover{background:var(--card)}
.cred:hover .fbtn{opacity:.85}
.cred-label{
  font-size:12.5px;font-weight:600;color:var(--txt-soft);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.cred-user,.cred-pass{
  display:flex;align-items:center;gap:4px;min-width:0;
}
.cred-user .mono,.cred-pass .mono{
  font-family:var(--mono);font-size:13px;line-height:1.5;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.cred-acts{justify-self:end}
.cred-note{
  grid-column:1/-1;position:relative;
  margin:2px 0 0;padding:4px 0 2px 21px;   /* 14 + 间距 7 */
  font-size:12px;line-height:1.6;color:var(--sub);
}
.cred-note .note-ic{position:absolute;left:0;top:4px}

.no-cred{
  border-top:1px solid var(--line);
  padding:10px 16px 12px;
  font-size:12px;color:var(--sub);opacity:.6;
}

/* ---------- 行内图标按钮 ----------
   常显（不 hover 才出现），键盘与触屏都能用；默认极淡，悬停才变实 */
.fbtn{
  display:inline-flex;align-items:center;justify-content:center;gap:3px;
  flex-shrink:0;
  border:none;background:none;cursor:pointer;
  color:var(--sub);font-size:11.5px;font-family:inherit;line-height:1;
  padding:4px;border-radius:3px;
  opacity:.55;
  transition:background var(--dur-1) var(--ease),color var(--dur-1) var(--ease),
             opacity var(--dur-1) var(--ease);
}
.fbtn:hover{background:var(--accent-soft);color:var(--accent-deep);opacity:1}
.fbtn:active{background:var(--accent-line)}
.fbtn.ok{color:var(--ok);background:var(--ok-soft);opacity:1}
.fbtn.txt{padding:4px 7px;font-size:11.5px}
.copy-entry{opacity:.68;margin-left:2px}

/* 备注前缀：小字「注」方签 */
.note-ic{
  display:inline-block;flex-shrink:0;
  font-size:10px;line-height:1.5;padding:0 3px;
  border:1px solid var(--line-strong);border-radius:2px;color:var(--sub);
}

/* ---------- 窄屏：栅栏折成一列 ---------- */
@media (max-width:760px){
  .counter{display:none}          /* 窄屏让位给条目名和「复制整条」 */
  .frow{grid-template-columns:76px minmax(0,1fr) auto}
  /* 栅栏折成三行：组名 + 整组按钮同一行，账号一行，密码一行 */
  .cred{grid-template-columns:minmax(0,1fr) auto;row-gap:3px}
  .cred-label{grid-column:1;grid-row:1;font-weight:600}
  .cred-acts{grid-column:2;grid-row:1;justify-self:end}
  .cred-user{grid-column:1/-1;grid-row:2}
  .cred-pass{grid-column:1/-1;grid-row:3}
}
</style>
