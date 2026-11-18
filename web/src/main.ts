import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
/* 全局样式分层：变量 → 基线 → 通用组件；页面/组件专属样式在各自 SFC 内 */
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'

createApp(App).use(router).mount('#app')
