/** 数据状态：项目集合、服务端版本号、保存与冲突处理（PRD FR-04/05/16） */
import { reactive } from 'vue'
import { api, ApiError } from '@/api/client'
import type { Project } from '@/api/types'
import { sessionStore } from './session'
import { toast } from './toast'

interface MigrationSource {
  projects: Project[]
}

export const dataStore = reactive({
  projects: [] as Project[],
  version: 0,
  loaded: false,
  /** 当前选中项目（列表高亮 + 详情展示 + 回车直达目标） */
  currentId: null as string | null,
  /** 新建项目请求信号（顶栏「新建」→ 项目页编辑器，跨页面传递） */
  createRequest: 0,
  /** V1 存量迁移候选（检测到 localStorage 数据且服务端为空时置位） */
  migration: null as MigrationSource | null
})

export function findProject(pid: string): Project | undefined {
  return dataStore.projects.find((p) => p.id === pid)
}

export function findEntry(eid: string): { project: Project; entryIndex: number } | null {
  for (const p of dataStore.projects) {
    const i = (p.entries || []).findIndex((e) => e.id === eid)
    if (i >= 0) return { project: p, entryIndex: i }
  }
  return null
}

async function load(): Promise<void> {
  const d = await api.data()
  dataStore.projects = d.projects || []
  dataStore.version = d.version
  dataStore.loaded = true
  checkMigration()
}

/**
 * FR-16：统一保存入口。
 * - 409 版本冲突 → 提示后写覆盖（force）或刷新
 * - 403 权限不足 / 401 未登录 → 相应处理
 */
async function saveAll(force = false): Promise<boolean> {
  try {
    const r = await api.save(dataStore.projects, dataStore.version, force)
    dataStore.version = r.version
    return true
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 409) {
        const overwrite = window.confirm(
          '数据已被他人更新（局域网另一位编辑者）。\n是否用当前内容覆盖？取消则刷新查看最新数据。'
        )
        if (overwrite) return saveAll(true)
        await load()
        return false
      }
      if (e.status === 403) toast('权限不足：需要编辑口令才能保存')
      else if (e.status === 401) sessionStore.handleUnauth()
      else toast('保存失败：' + e.message)
    } else {
      toast('保存失败：服务不可用')
    }
    return false
  }
}

/** FR-05：导入（覆盖服务端数据，编辑模式专用） */
async function importProjects(projects: Project[]): Promise<number | null> {
  try {
    const r = await api.import(projects)
    dataStore.version = r.version
    await load()
    return r.count
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 403) toast('权限不足：需要编辑口令')
      else if (e.status === 401) sessionStore.handleUnauth()
      else toast('导入失败：' + e.message)
    } else {
      toast('导入失败：服务不可用')
    }
    return null
  }
}

/** V1 localStorage 存量数据检测（PRD FR-05 迁移引导） */
function checkMigration(): void {
  if (dataStore.projects.length) {
    dataStore.migration = null
    return
  }
  try {
    const raw = localStorage.getItem('projhub_v1')
    if (!raw) return
    const arr = JSON.parse(raw) as Project[]
    if (Array.isArray(arr) && arr.length) dataStore.migration = { projects: arr }
  } catch {
    /* 无 V1 数据，忽略 */
  }
}

async function runMigration(): Promise<void> {
  const m = dataStore.migration
  if (!m) return
  const n = await importProjects(m.projects)
  if (n !== null) {
    dataStore.migration = null
    toast(`迁移完成 ✓（${n} 个项目）`)
  }
}

export const dataActions = { load, saveAll, importProjects, runMigration }
