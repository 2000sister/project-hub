<template>
  <svg
    class="ico"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    v-html="PATHS[name] ?? ''"
  />
</template>

<script setup lang="ts">
/**
 * 线条图标：统一 stroke=currentColor，跟随按钮 / 文字色。
 * 用 emoji 的问题：彩色不受主题控制、跨系统字形与基线不一致、无法随 hover 变色。
 */
import { PATHS, type IconName } from './icons'

withDefaults(
  defineProps<{
    name: IconName
    size?: number
    strokeWidth?: number
  }>(),
  { size: 14, strokeWidth: 1.6 }
)
</script>

<style scoped>
.ico{
  flex-shrink:0;display:inline-block;vertical-align:-2px;
}
</style>
