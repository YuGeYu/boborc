# 啵啵小队出击

《啵啵小队出击》是一个基于 Vue 3 和 Phaser 3 的多页面动作小游戏项目。项目围绕“轻量横版战斗 + 角色成长 + 世界与营地展示”展开，当前已经具备角色招募、关卡挑战、装备搭配、本地存档、云存档，以及营地 AI 问答等功能模块。

这个仓库同时包含：

- 前端页面与 Phaser 战斗逻辑
- Cloudflare Pages Functions 接口
- D1 数据库迁移脚本
- 本地预览、GitHub 推送、Cloudflare 部署所需的脚本和文档

## 项目特点

- 多页面前端结构：大厅、战斗、角色、装备、关卡、存档、设置、世界页分离
- Phaser 战斗核心：战斗表现与主要结算逻辑集中在场景层
- 本地进度系统：支持账号、存档槽和本地进度兼容
- 云存档接口：通过 `functions/` 和 `migrations/` 提供登录、注册、读写云存档能力
- 可选 AI 对话：营地问答依赖环境变量配置，默认不会携带任何密钥
- 静态部署友好：构建产物输出到 `dist/`，可直接部署到 Cloudflare Pages、Netlify、Vercel 或任意静态服务器

## 技术栈

- Vue 3
- Phaser 3
- Vue Router
- Express
- Cloudflare Pages Functions
- Cloudflare D1

## 目录结构

```text
.
├─ src/
│  ├─ assets/               静态资源与音频
│  ├─ common/               通用配置、云接口、AI 对话封装
│  ├─ components/           Vue 组件
│  ├─ data/                 角色、装备、关卡、进度等核心静态数据
│  ├─ game/                 Phaser 入口、战斗配置与场景
│  ├─ pages/                多页面入口文件
│  ├─ state/                全局状态组合
│  └─ views/                页面级 Vue 视图
├─ public/                  公共静态资源
├─ functions/               Cloudflare Pages Functions API
├─ migrations/              D1 数据库迁移
├─ scripts/                 构建辅助脚本
├─ dist/                    构建输出（不建议提交）
└─ 维护说明.md              维护与二次开发说明
```

## 本地开发

建议使用 Node.js 18 或更新版本。

```bash
npm install
npm run serve
```

开发环境默认读取：

- `VUE_APP_API_URL=http://localhost:8080`
- `VUE_APP_DEBUG_MODE=true`

## 构建与预览

```bash
npm run build
npm run preview
```

Windows 下也可以直接双击 `start-preview.bat`，脚本会自动安装依赖、执行构建，并在 `http://localhost:8080` 启动本地预览。

## 环境变量

可以参考新增的 `.env.example`。

| 变量名 | 说明 | 是否必需 |
| --- | --- | --- |
| `VUE_APP_API_URL` | 前端请求 API 的基础地址 | 是 |
| `VUE_APP_DEBUG_MODE` | 是否启用调试模式 | 否 |
| `VUE_APP_AI_CHAT_API_URL` | AI 问答接口地址 | 仅启用 AI 时需要 |
| `VUE_APP_AI_CHAT_API_KEY` | AI 问答接口密钥 | 仅启用 AI 时需要 |

说明：

- 仓库中不再保留任何默认 AI 密钥。
- 如果未配置 AI 相关变量，营地 AI 会自动视为未启用状态。

## Cloudflare 部署

项目内已包含 Cloudflare Pages 所需文件：

- `wrangler.toml`
- `functions/`
- `migrations/`
- `deploy-cloudflare.bat`

部署命令：

```bash
npm run deploy:cloudflare
```

部署前请先确认：

- 已安装并登录 `wrangler`
- D1 数据库绑定信息正确
- 生产环境变量已在 Cloudflare Pages 中配置

当前已验证可以直接部署到 Cloudflare Pages。

## 日常发布流程

提交到 GitHub：

```bash
publish-github.bat 你的提交说明
```

或手动执行：

```bash
git add -A
git commit -m "你的提交说明"
git push origin main
```

部署到 Cloudflare：

```bash
npm run deploy:cloudflare
```

或直接双击 `deploy-cloudflare.bat`。

更详细的协作与发布说明见 `发布流程.md`。

## 维护建议

- 角色、装备、关卡等平衡性调整优先查看 `src/data/gameContent.js`
- 本地存档与账号逻辑优先查看 `src/data/progression.js`
- 战斗行为与角色专属机制优先查看 `src/game/scenes/PlayScene.js`
- 页面逻辑变更优先查看 `src/views/` 与 `src/state/useGameState.js`
- 准备接手项目时，建议先阅读 `维护说明.md`

## 仓库整理约定

- `dist/`、`node_modules/`、`.wrangler/`、`tmp_assets/` 等产物目录不提交
- 不要把真实密钥写进源码或 `.env.*` 之外的文件
- 功能修改后至少执行一次 `npm run build`

## License

[MIT](./LICENSE)
