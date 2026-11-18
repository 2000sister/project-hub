import { createRouter, createWebHashHistory } from 'vue-router'
import ProjectsView from '@/views/ProjectsView.vue'
import EntriesView from '@/views/EntriesView.vue'

/** 双页面路由：项目页（#/）与全部条目页（#/entries），与 V2 地址兼容 */
export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'projects', component: ProjectsView },
    { path: '/entries', name: 'entries', component: EntriesView },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})
