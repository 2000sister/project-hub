/** 图标路径表：纯数据，与渲染分离（Icon.vue 只负责画） */
export type IconName =
  | 'copy' | 'eye' | 'eye-off' | 'link'
  | 'nav-projects' | 'nav-entries' | 'search' | 'key' | 'edit' | 'save'
  | 'folder' | 'info' | 'warning'
  | 'download' | 'upload'
  | 'arrow-left' | 'arrow-up' | 'arrow-down' | 'plus' | 'x'
  | `type-${string}`

/** 内容是可信常量，用 v-html 一次性渲染（避免为每个图形写一份 template 分支） */
export const PATHS: Record<string, string> = {
  /* ---- 动作 ---- */
  copy: '<rect x="9" y="3" width="12" height="12" rx="2"/><path d="M6 9H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1"/>',
  download: '<path d="M12 3v12"/><path d="M7.5 11l4.5 4.5 4.5-4.5"/><path d="M4 19.5h16"/>',
  upload: '<path d="M12 20V8"/><path d="M7.5 12L12 7.5l4.5 4.5"/><path d="M4 4.5h16"/>',
  eye: '<path d="M2 12c2.5-4.5 6-6.5 10-6.5S19.5 7.5 22 12c-2.5 4.5-6 6.5-10 6.5S4.5 16.5 2 12Z"/><circle cx="12" cy="12" r="3.2"/>',
  'eye-off':
    '<path d="M10.5 5.9A9.6 9.6 0 0 1 12 5.5c4 0 7.5 2 10 6.5a17.2 17.2 0 0 1-2.6 3.4"/>' +
    '<path d="M6.6 6.9A16.9 16.9 0 0 0 2 12c2.5 4.5 6 6.5 10 6.5a9.9 9.9 0 0 0 4.2-.9"/>' +
    '<path d="M14.1 14.1a3 3 0 0 1-4.2-4.2"/><line x1="3" y1="3" x2="21" y2="21"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="M11 12 20 3"/><path d="M17 6l3 3"/><path d="M15 8l3 3"/>',
  search: '<circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  x: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',

  /* ---- 方向 ---- */
  'arrow-left': '<line x1="20" y1="12" x2="5" y2="12"/><path d="M11 6l-6 6 6 6"/>',
  'arrow-up': '<line x1="12" y1="20" x2="12" y2="5"/><path d="M6 11l6-6 6 6"/>',
  'arrow-down': '<line x1="12" y1="4" x2="12" y2="19"/><path d="M6 13l6 6 6-6"/>',

  /* ---- 导航 ---- */
  'nav-projects':
    '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>' +
    '<rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  'nav-entries': '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>',

  /* ---- 提示 ---- */
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  info: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><circle cx="12" cy="7.7" r="1.1" fill="currentColor" stroke="none"/>',
  warning: '<path d="M12 3.5 22 20H2Z"/><line x1="12" y1="9.5" x2="12" y2="14.5"/><circle cx="12" cy="17.4" r="1.1" fill="currentColor" stroke="none"/>',

  /* ---- 条目类型 ---- */
  'type-web': '<circle cx="12" cy="12" r="9"/><path d="M3.2 12h17.6"/><path d="M12 3.2a15 15 0 0 1 0 17.6 15 15 0 0 1 0-17.6"/>',
  'type-remote': '<rect x="2.5" y="4" width="19" height="12.5" rx="2"/><line x1="8" y1="20.5" x2="16" y2="20.5"/><line x1="12" y1="16.5" x2="12" y2="20.5"/>',
  'type-jump': '<circle cx="5.5" cy="6" r="2.5"/><circle cx="18.5" cy="18" r="2.5"/><path d="M8 6h6a3 3 0 0 1 3 3v6"/>',
  'type-jenkins': '<rect x="3.5" y="8" width="17" height="12" rx="3"/><line x1="9" y1="13" x2="9" y2="15.5"/><line x1="15" y1="13" x2="15" y2="15.5"/><path d="M12 8V5"/><circle cx="12" cy="3.6" r="1.4"/>',
  'type-db': '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  'type-ssh': '<rect x="2.5" y="4" width="19" height="16" rx="2"/><path d="M7 10l3 2.5-3 2.5"/><line x1="12.5" y1="15" x2="17" y2="15"/>',
  'type-custom': '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/>'
}

/** 数据层的图形名字符串 → 合法图标名；未知图形回落到自定义图标 */
export function iconName(raw: string): IconName {
  return PATHS[raw] ? (raw as IconName) : 'type-custom'
}
