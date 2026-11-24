/** 项目数据用例：读取、版本冲突保存、导入、操作日志（FR-04/05/14/16） */
import { bodyOf, sessionOf, type AppContext } from '../http/context.js'
import { fail, ok } from '../http/respond.js'
import { mutate, readDb, stamp } from '../models/db.js'
import { appendLog } from '../models/log.js'
import { isProjectList } from '../models/project.js'
import { migrateProjects } from '../models/migrate.js'

export function getData(ctx: AppContext): void {
  const db = readDb()
  ctx.body = { version: db.version, projects: db.projects, level: sessionOf(ctx).level }
}

export function postSave(ctx: AppContext): void {
  const db = readDb()
  const body = bodyOf(ctx)
  const projects = body.projects
  if (!isProjectList(projects)) {
    fail(ctx, 400, '数据格式不正确')
    return
  }
  // FR-16：版本冲突，force=true 时后写覆盖
  if (!body.force && Number(body.baseVersion) !== db.version) {
    fail(ctx, 409, '数据已被他人更新', { version: db.version })
    return
  }
  const version = mutate((draft) => {
    draft.projects = migrateProjects(projects)
    stamp(draft)
    appendLog(draft, 'edit', '保存数据', `version=${draft.version}`)
    return draft.version
  })
  ok(ctx, { version })
}

/** 导入接受裸数组或 { projects } 两种形态（兼容 legacy 导出文件） */
export function postImport(ctx: AppContext): void {
  const input = Array.isArray(ctx.request.body) ? ctx.request.body : bodyOf(ctx).projects
  if (!isProjectList(input)) {
    fail(ctx, 400, '文件格式不正确（EX-06）')
    return
  }
  const version = mutate((draft) => {
    draft.projects = migrateProjects(input)
    stamp(draft)
    appendLog(draft, 'edit', '导入数据', `projects=${input.length}`)
    return draft.version
  })
  ok(ctx, { version, count: input.length })
}

export function getLogs(ctx: AppContext): void {
  ctx.body = { logs: readDb().logs }
}
