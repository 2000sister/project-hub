# Project Hub · 项目连接信息卡

> 小而美的局域网项目凭据/连接信息卡片库：搜索即达、一键复制、脱敏展示、两套口令分级权限。
> 技术栈：**Vue 3 + TypeScript + Vite**（前端）/ **Koa + TypeScript**（服务端）/ JSON 文件存储（零数据库运维）

## 目录结构

```
project-hub/
├─ server/          # Koa + TS 服务端（MVC 分层）
│  ├─ src/
│  │  ├─ index.ts           # 启动：加载数据 → 装配 → 监听
│  │  ├─ app.ts             # Koa 装配（中间件顺序集中可见）
│  │  ├─ routes.ts          # URL → controller 映射 + 守卫声明
│  │  ├─ controllers/       # 请求/响应处理（auth / data）
│  │  ├─ models/            # 领域逻辑（db / password / session / lockout / log / project）
│  │  ├─ middlewares/       # 异常兜底 / 会话与编辑守卫 / 静态托管
│  │  ├─ http/              # HTTP 边界：ctx 类型、响应形状、cookie 会话
│  │  ├─ utils/             # crypto / 局域网地址（无业务语义）
│  │  ├─ config.ts
│  │  └─ types.ts
│  ├─ Dockerfile            # 生产镜像：tsc 编译 → node 跑 dist
│  └─ Dockerfile.dev        # 开发镜像：tsx watch
├─ web/             # Vue3 + Vite + TS 前端
│  ├─ src/
│  │  ├─ styles/     # 全局样式三层：tokens（变量）/ base（重置基线）/ components（通用类）
│  │  ├─ views/      # ProjectsView（项目页）/ EntriesView（全部条目页），页面样式写在各自 SFC
│  │  ├─ components/ # AuthOverlay / EntryCard，组件样式写在各自 SFC
│  │  ├─ stores/     # session（口令/权限）/ data（版本冲突保存）/ toast
│  │  ├─ api/        # client.ts（fetch 封装）/ types.ts
│  │  └─ utils/      # search（搜索/高亮）/ clipboard
│  ├─ Dockerfile            # 生产镜像：多阶段构建 → nginx 托管 dist
│  ├─ Dockerfile.dev        # 开发镜像：Vite dev server
│  ├─ nginx.conf            # 静态托管 + /api 反代到 server
│  └─ package.json
├─ docker-compose.yml       # 生产 2 服务 + dev profile 2 服务
├─ data/            # 运行时数据（首次启动自动创建；data.json + .bak）
├─ docs/            # PRD
└─ legacy/          # V1/V2 单文件历史版本（已归档，不再维护）
```

## 快速开始

```bash
# 1. 构建（或开发模式二选一）
cd web && npm install && npm run build

# 2. 启动服务
cd ../server && npm install && npm run start

# 控制台会打印：
#   本机访问:   http://localhost:5218
#   局域网访问: http://<你的IP>:5218  ← 分发给同事
```

首次打开浏览器会进入**口令设置向导**：分别设置「查看口令」（给同事，只读）与「编辑口令」（自己，可增删改），两者不能相同。

### 开发模式（前端热更新）

```bash
cd server && npm run dev        # Koa :5218
cd web && npm run dev           # Vite :5219，/api 已代理到 5218
```

### Docker 部署

两种方式共用同一个 `docker-compose.yml`，用 profile 区分：

```bash
# 生产：tsc 编译后 node 运行，页面与 /api 由 nginx(:5218) 收口
docker compose up -d --build            # → http://localhost:5218

# 开发：tsx watch + Vite HMR，源码 bind mount 进容器
docker compose --profile dev up --build # → http://localhost:5229
```

| 服务 | profile | 宿主端口 | 说明 |
|------|---------|----------|------|
| `web` | 默认 | 5218 | nginx 托管 `web/dist`，`/api` 反代到 `server:5218` |
| `server` | 默认 | 不暴露 | 镜像内 `tsc` 编译，`node dist/index.js` 运行 |
| `web-dev` | dev | 5229 | Vite dev server |
| `server-dev` | dev | 5228 | `tsx watch` 热重启 |

**几点必须知道：**

- 数据目录挂载宿主 `./data` → 容器 `/app/data`。生产与开发**共用同一份数据**，别同时启动（JSON 单写者假设会被破坏）
- 容器布局刻意保持 `server/` 与 `data/` 同级：`config.ts` 用 `__dirname/../..` 推项目根，`dist` 与 `src` 同层因此编译前后推导一致
- `HUB_TRUST_PROXY=true`：请求经 nginx/Vite 反代进来，客户端 IP 取 `X-Real-IP` / `X-Forwarded-For`。不开启的话「错 5 次锁 10 分钟」会按代理 IP 计数，一个人输错锁住所有人。仅在受信任反代后开启，否则客户端可伪造头绕过锁定
- `CHOKIDAR_USEPOLLING=true`（仅 `server-dev`）：宿主目录 bind mount 不产生 inotify 事件，容器内 `tsx watch` 收不到变更。改轮询后在 Windows/macOS Docker Desktop 下改 `.ts` 才会重启。Linux 原生宿主可删
- `VITE_USE_POLLING=true`（仅 `web-dev`）：同上原因，Vite 的 `watch.usePolling` 需要轮询才能触发热更新
- `VITE_API_TARGET`：`web-dev` 里指向 `server-dev:5218`；本机 `npm run dev` 不设置时默认 `http://localhost:5218`
- ⚠ 镜像构建未在本机验证（开发机无 Docker），已核对：`npm run build` 编译通过、`node dist/index.js` 启动成功、compose 文件 YAML 结构合法

## 常用命令

| 命令 | 位置 | 说明 |
|------|------|------|
| `npm run start` | server/ | 本地启动（tsx 直接跑 TS，免编译） |
| `npm run build` | server/ | 编译 TS 到 `dist/`（Docker 生产镜像用它） |
| `npm run dev` | server/ | 服务端 watch 重启 |
| `npm run typecheck` | 两端 | TS 类型检查 |
| `npm run build` | web/ | 类型检查 + 产出 dist/ |
| `HUB_PORT=8080 npm run start` | server/ | 自定义端口 |

## 前端样式约定

样式按「作用域」分四层，改样式时先判断落点，别再加全局大文件：

| 层 | 位置 | 放什么 |
|----|------|--------|
| 1 变量 | `web/src/styles/tokens.css` | 颜色 / 字体 / 圆角 / 缓动曲线。换主题只改这里 |
| 2 基线 | `web/src/styles/base.css` | reset、body、滚动条、`mark`、`:focus-visible` 等标签级样式 |
| 3 通用类 | `web/src/styles/components.css` | 两个以上组件复用的类：`.btn`、`.tag`、`.empty`、`.main`/`.detail` 布局壳 |
| 4 组件级 | 各自 SFC 的 `<style scoped>` | 只有该组件用的样式，就近维护 |

判断规则：**只被一个 SFC 用 → 写进该 SFC；被两个及以上用 → 提升到 `components.css`；只涉及颜色/字体等值 → 改 `tokens.css`。**

## 功能速览

- **双页面**：项目页（`#/`）+ 全部条目页（`#/entries`），vue-router 管理
- **搜索**：多关键词 AND、命中高亮、匹配位置提示、回车直达、Esc 清空
- **条目化**：网页地址 / 远程桌面·向日葵 / 跳板机 / Jenkins / SSH / 自定义，字段可扩展、独立备注
- **权限**：两套口令；写接口服务端强校验（403）；防暴力锁定（错 5 次锁 10 分钟）
- **数据**：`data/data.json` 原子落盘 + `.bak` 崩溃恢复；导出/导入 JSON 备份；V1 localStorage 数据一键迁移
- **并发**：后写覆盖 + 版本冲突提示（FR-16）

## 数据与备份

- 数据文件：`data/data.json`（口令为 scrypt 加盐哈希，无明文）
- 备份 = 复制 `data/data.json`，或页面内「导出备份」
- ⚠ 备份文件含全部凭据，禁止存放公共网盘；服务禁止端口转发到公网（公网部署需先做 HTTPS + 加密存储，见 PRD V3 触发条件）

## 运维

- 服务重启：数据自动加载；会话失效需重新输入口令（24h TTL）
- 数据文件损坏：自动用 `data.json.bak` 恢复
- 日志：编辑会话访问 `/api/logs`（保留最近 500 条）

### 环境变量

| 变量 | 默认 | 说明 |
|------|------|------|
| `HUB_PORT` | `5218` | 监听端口 |
| `HUB_TRUST_PROXY` | 关 | 置 `true` 时从 `X-Real-IP` / `X-Forwarded-For` 取客户端 IP。**仅在受信任反代后开启**，直连部署开启会让人伪造头绕过登录锁定 |
| `VITE_API_TARGET` | `http://localhost:5218` | Vite 开发时 `/api` 的代理目标 |
| `VITE_USE_POLLING` | 关 | 置 `true` 时 Vite 用轮询监听文件（容器挂载宿主目录时需要） |
| `CHOKIDAR_USEPOLLING` | 关 | 置 `true` 时 `tsx watch` 用轮询监听（同上，见 chokidar 官方约定） |

布尔变量统一接受 `1`/`true`/`on`/`yes`（开）与 `0`/`false`/`off`/`no`（关），大小写与首尾空格不敏感，未设置视为关。**其它取值会让服务启动或构建直接报错**，不再静默当成关闭——写错配置会立刻暴露，而不是跑到线上才发现登录锁定全站共享。

例外：`CHOKIDAR_USEPOLLING` 由第三方库 chokidar 读取，它把取值的字符串原样求值（`false`/`0` 为关，其余非空值均为开），不受上面这条约束；本项目统一写 `true` 即可。

---

*对应 PRD：docs/PRD-ProjectHub-v1.0.md（v1.1 变更：技术栈 Vue3+TS+Koa 工程化改造）*
