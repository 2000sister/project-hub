<template>
  <div class="entry">
    <div v-if="project" class="entry-proj">
      📁 <span class="pn" v-html="hl(project.name, terms)"></span>
      <span v-for="t in project.tags || []" :key="t" class="tag">{{ t }}</span>
    </div>
    <div class="entry-head">
      <span class="etype">{{ tpl.icon }} {{ tpl.label }}</span>
      <span class="ename" v-html="hl(entry.name, terms)"></span>
    </div>
    <div v-if="entry.note" class="entry-note">📝 <span v-html="hl(entry.note, terms)"></span></div>
    <div class="fields">
      <div v-for="(f, i) in entry.fields" :key="i" class="frow">
        <span class="flabel" v-html="hl(f.label, terms)"></span>
        <span
          v-if="f.secret && f.value && !revealed[i]"
          class="fvalue masked"
        >••••••••</span>
        <span v-else-if="isUrl(f.value)" class="fvalue">
          <a :href="f.value" target="_blank" rel="noopener" v-html="hl(f.value, terms)"></a>
        </span>
        <span v-else class="fvalue">
          <template v-if="f.value"><span v-html="hl(f.value, terms)"></span></template>
          <template v-else><span class="unset">未填写</span></template>
        </span>
        <button v-if="f.value" class="fbtn" title="复制" @click="copy(f.value, $event)">📋</button>
        <button
          v-if="f.secret && f.value"
          class="fbtn"
          title="显示/隐藏"
          @click="revealed[i] = !revealed[i]"
        >👁</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import type { Entry, Project } from '@/api/types'
import { TYPES } from '@/api/types'
import { hl, terms } from '@/utils/search'
import { copyText } from '@/utils/clipboard'
import { toast } from '@/stores/toast'

const props = defineProps<{ entry: Entry; project?: Project }>()

const tpl = TYPES[props.entry.type] ?? TYPES.custom
const revealed = reactive<Record<number, boolean>>({})

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
</script>

<style scoped>
/* ============ 条目卡片：细线台账卡 ============ */
.entry{
  background:var(--card);border:1px solid var(--line-strong);border-radius:var(--radius);
  margin-bottom:14px;overflow:hidden;
  transition:border-color .18s var(--ease);
}
.entry:hover{border-color:var(--sub)}

.entry-proj{
  font-size:12px;color:var(--sub);padding:10px 18px 0;
  display:flex;gap:6px;align-items:center;flex-wrap:wrap;
}
.entry-proj .pn{font-weight:600;color:var(--txt)}

.entry-head{
  display:flex;align-items:center;gap:10px;padding:11px 18px;
  border-bottom:1px solid var(--line);background:var(--card-2);
}
.etype{
  font-size:11.5px;padding:3px 10px;border-radius:4px;
  background:var(--accent-soft);color:var(--accent-deep);font-weight:600;white-space:nowrap;
  border:1px solid var(--accent-line);
}
.entry-head .ename{font-weight:600}

.entry-note{padding:9px 18px 0;font-size:12.5px;color:var(--sub);line-height:1.6}

/* ============ 字段行 ============ */
.fields{padding:6px 18px 12px}
.frow{display:flex;align-items:baseline;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)}
.frow:last-child{border-bottom:none}
.flabel{width:96px;color:var(--sub);font-size:12px;flex-shrink:0}
.fvalue{flex:1;font-family:var(--mono);font-size:12.5px;word-break:break-all}
.fvalue a{
  color:var(--accent-deep);text-decoration:none;
  border-bottom:1px dashed var(--accent-line);transition:border-color .15s;
}
.fvalue a:hover{border-bottom-style:solid;border-color:var(--accent)}
.fvalue.masked{letter-spacing:3px;color:var(--sub)}
.fvalue .unset{color:var(--sub);opacity:.55;font-family:var(--sans)}

.fbtn{
  border:none;background:none;cursor:pointer;color:var(--sub);font-size:13px;
  padding:3px 7px;border-radius:5px;align-self:center;
  transition:background .15s,color .15s,transform .12s var(--ease);
}
.fbtn:hover{background:var(--accent-soft);color:var(--accent-deep)}
.fbtn:active{transform:scale(.9)}
.fbtn.ok{color:var(--ok);background:var(--ok-soft)}
</style>
