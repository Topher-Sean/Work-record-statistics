# 工作记录统计（微光日记）

一款面向职场人士的网页端「工作记录 + AI 总结 + 可视化统计」应用。支持程序员/非程序员两种记录方式：程序员可按项目粘贴 commit 记录，非程序员可按工作项记录耗时；一键生成日报总结，并通过历史日历与统计视图回顾自己的工作轨迹。

## 功能概览

- 登录与用户态：邮箱登录/注册；支持游客模式快速体验（游客不写入云端数据）
- 今日记录：按角色录入 commit 或工作项；生成/编辑 AI 工作总结；保存为工作记录
- AI 提示词模板：在个人中心配置多套“AI 总结提示词模板”，生成时按当前模板约束输出
- 历史记录：日历视图快速定位某天记录，浏览与补写
- 数据统计：按日 / 月 / 年查看记录列表与统计概览（图表能力基于 ECharts）
- 项目管理：项目的创建/编辑/删除，记录与项目关联
- 个人中心：基础资料与偏好（主题/模式等）

页面路由定义见 [router/index.ts](file:///c:/Users/Administrator/Desktop/%E4%B8%AA%E4%BA%BA%E5%BA%94%E7%94%A8/Work-record-statistics/src/router/index.ts)。

## 设计风格（森系治愈 / 纸感手绘）

本项目的 UI 设计关键词：手绘插画风、治愈系、森系、低饱和莫兰迪色、纸张纹理、柔和光影与微交互。

- 色彩体系：`paper / rose / olive / blue` 等低饱和配色，强调温暖与克制的对比（见 [tailwind.config.js](file:///c:/Users/Administrator/Desktop/%E4%B8%AA%E4%BA%BA%E5%BA%94%E7%94%A8/Work-record-statistics/tailwind.config.js)）
- 纸感背景：全局 body 采用纸张噪声纹理，整体观感更“日记本”（见 [style.css](file:///c:/Users/Administrator/Desktop/%E4%B8%AA%E4%BA%BA%E5%BA%94%E7%94%A8/Work-record-statistics/src/style.css)）
- 卡片组件：`card-paper` 半透明纸卡 + 柔和阴影 + hover 提升，突出内容层级（见 [style.css](file:///c:/Users/Administrator/Desktop/%E4%B8%AA%E4%BA%BA%E5%BA%94%E7%94%A8/Work-record-statistics/src/style.css)）
- 手绘按钮：`HanddrawnButton` 使用不规则圆角与轻微抖动 hover/active，带一点“手作感”（见 [HanddrawnButton.vue](file:///c:/Users/Administrator/Desktop/%E4%B8%AA%E4%BA%BA%E5%BA%94%E7%94%A8/Work-record-statistics/src/components/ui/HanddrawnButton.vue)）
- 排版气质：标题使用衬线字体（serif），正文以无衬线提升可读性（见 [tailwind.config.js](file:///c:/Users/Administrator/Desktop/%E4%B8%AA%E4%BA%BA%E5%BA%94%E7%94%A8/Work-record-statistics/tailwind.config.js)）

更完整的产品与设计说明参考 [work-record-statistics-prd.md](file:///c:/Users/Administrator/Desktop/%E4%B8%AA%E4%BA%BA%E5%BA%94%E7%94%A8/Work-record-statistics/.trae/documents/work-record-statistics-prd.md)。

## 技术栈

- 前端：Vue 3 + TypeScript + Vite
- 路由与状态：Vue Router + Pinia
- 样式：TailwindCSS + PostCSS
- 图表：ECharts + vue-echarts
- 日期：Day.js
- 数据与鉴权：Supabase（Auth + Postgres）
- 后端 API：Express（主要用于 AI 总结接口转发与模型适配）

依赖清单见 [package.json](file:///c:/Users/Administrator/Desktop/%E4%B8%AA%E4%BA%BA%E5%BA%94%E7%94%A8/Work-record-statistics/package.json)。

## 快速开始

### 1) 安装依赖

```bash
npm i
```

### 2) 配置环境变量

建议使用 `.env`（本地）或 `.env.local`（仅本机）配置。需要的变量：

复制示例文件并填写：

```bash
cp .env.example .env.local
```

前端（Vite）：

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

后端（AI，可选）：

```bash
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
OPENAI_MODEL_NAME=qwen-turbo
VITE_PORT=5179
VITE_API_BASE_PATH=/wr-api
API_BASE_PATH=/wr-api
API_PORT=3001
PORT=3001
```

说明：
- AI 总结接口未配置 `OPENAI_API_KEY` 时，会返回本地模拟总结以便前端流程可用（实现见 [ai.service.ts](file:///c:/Users/Administrator/Desktop/%E4%B8%AA%E4%BA%BA%E5%BA%94%E7%94%A8/Work-record-statistics/api/services/ai.service.ts)）
- 本仓库包含 Supabase 初始化迁移脚本，见 [migrations](file:///c:/Users/Administrator/Desktop/%E4%B8%AA%E4%BA%BA%E5%BA%94%E7%94%A8/Work-record-statistics/supabase/migrations)
- 可在个人中心设置“AI 总结提示词模板”，该内容会在生成总结时一并传入模型以对齐你的写作风格与重点

安全建议：
- 不要提交任何真实密钥到仓库；推荐只提交 `.env.example`，本地使用 `.env.local`

### 3) 本地开发

双端联调（推荐）：

```bash
npm run dev
```

分别启动：

```bash
npm run client:dev
npm run server:dev
```

前端会将 `VITE_API_BASE_PATH`（默认 `/wr-api`）代理到本地后端（默认 `http://localhost:API_PORT`），代理配置见 [vite.config.ts](file:///c:/Users/Administrator/Desktop/%E4%B8%AA%E4%BA%BA%E5%BA%94%E7%94%A8/Work-record-statistics/vite.config.ts)。

### 4) 构建与预览

```bash
npm run build
npm run preview
```

## 目录结构

```text
src/
  pages/           页面（登录/今日/历史/统计/项目/个人）
  components/      UI 与布局组件（Navbar、HanddrawnButton 等）
  stores/          Pinia 用户态
  lib/             Supabase 初始化、工具函数
  style.css        Tailwind layer + 全局设计语言
api/
  routes/          API 路由
  controllers/     控制器
  services/        AI 服务封装
supabase/
  migrations/      数据库表结构与 RLS 策略
```

## 数据库与权限

数据库表与关系定义见 [init_schema.sql](file:///c:/Users/Administrator/Desktop/%E4%B8%AA%E4%BA%BA%E5%BA%94%E7%94%A8/Work-record-statistics/supabase/migrations/20240329000000_init_schema.sql)；RLS 策略修正见 [fix_rls.sql](file:///c:/Users/Administrator/Desktop/%E4%B8%AA%E4%BA%BA%E5%BA%94%E7%94%A8/Work-record-statistics/supabase/migrations/20240329000002_fix_rls.sql)。

## 部署

项目包含 Vercel 适配配置（Serverless API + rewrite `/api/*`），见 [vercel.json](file:///c:/Users/Administrator/Desktop/%E4%B8%AA%E4%BA%BA%E5%BA%94%E7%94%A8/Work-record-statistics/vercel.json) 与 [api/index.ts](file:///c:/Users/Administrator/Desktop/%E4%B8%AA%E4%BA%BA%E5%BA%94%E7%94%A8/Work-record-statistics/api/index.ts)。

## 文档维护

为保证“文档与功能一致”，每次新增/修改功能时同步更新 README：

- 新增页面或入口：更新“功能概览 / 路由 / 目录结构”
- 新增配置项：更新“环境变量 / 配置说明 / .env.example”
- 影响用户使用流程：更新“快速开始 / 使用说明”
