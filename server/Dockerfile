# 生产镜像：两阶段构建 —— build 阶段 tsc 编译，运行阶段只装生产依赖、用 node 跑编译产物
# 目录布局刻意与仓库一致（server/ 与 data/ 同级）：config.ts 用 __dirname/../.. 推导项目根目录，
# dist/ 与 src/ 同层，因此编译后推导结果不变：代码在 /app/server/dist，数据在 /app/data，前端在 /app/web/dist。
FROM node:22-alpine AS build

WORKDIR /app/server

# 编译需要 devDependencies（typescript、@types/*），此阶段不设 NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- 运行阶段 ----------
FROM node:22-alpine

WORKDIR /app/server

# 只装运行时依赖（koa 等），不再需要 tsx/typescript
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/server/dist ./dist

ENV NODE_ENV=production \
    HUB_PORT=5218
EXPOSE 5218

# /api/state 无需会话，恒返回 200，用它判活（alpine 自带 wget）
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${HUB_PORT}/api/state" > /dev/null || exit 1

CMD ["node", "dist/index.js"]
