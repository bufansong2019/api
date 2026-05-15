## ✨ 项目简介

- 采用 **Hono** 轻量 Web 框架，性能优越

- 搭配 **Drizzle ORM** 操作 D1 数据库，类型安全、语法简洁

- 内置 **Pico CSS** 管理后台，支持响应式布局与深色/浅色模式

- 使用 **JWT** 身份认证 + **PBKDF2** 密码加密，安全可靠

- 纯 TypeScript 编写，全栈类型安全

## 🚀 本地运行

```bash
# 克隆仓库
git clone https://github.com/bufansong2019/api.git

# 进入目录
cd api

# 安装依赖
pnpm install

# 初始化本地 D1 数据库并启动开发服务器
pnpm dev

# 手动部署到 Cloudflare Workers
npx wrangler deploy
```

## 🗄️ 数据库操作

```bash
# 本地迁移
pnpm seedLocalD1

# 线上迁移
pnpm predeploy

# 线上执行所有数据库SQL
npx wrangler d1 migrations apply DB --remote
```

## 📦 技术栈

| 类别 | 技术 |
|------|------|
| 运行时 | Cloudflare Workers |
| 数据库 | Cloudflare D1 (SQLite) |
| Web 框架 | Hono v4 |
| ORM | Drizzle ORM |
| 认证 | JWT (HS256) + PBKDF2 |
| 前端 | Pico CSS v2 |
| 语言 | TypeScript |
| 包管理 | pnpm |
| 部署 | Wrangler CLI |

## 📁 项目结构

```
src/
├── admin/          # 后台页面组件
│   ├── layout.ts   # 整体布局 + 导航栏
│   ├── login.ts    # 登录页
│   ├── home.ts     # 首页（统计卡片 + 操作日志）
│   ├── dashboard.ts# 数据库概览
│   ├── table.ts    # 表数据查看器（支持筛选）
│   ├── api-keys.ts # API 密钥管理
│   ├── users.ts    # 用户管理
│   ├── pagination.ts # 分页组件
│   └── toast.ts    # Toast 提示组件
├── routes/
│   ├── admin.ts    # 后台路由
│   └── api/
│       ├── auth.ts # 用户注册/登录/获取信息
│       └── index.ts# API 根路径
├── db/
│   └── schema.ts   # Drizzle 数据表定义
├── middleware/
│   └── auth.ts     # JWT 验证 & 管理员守卫
└── shared/
    └── utils.ts    # 工具函数
```

## 🔑 环境变量

| 变量 | 说明 |
|------|------|
| `API_KEY` | Master API Key，用于后台登录 |
| `JWT_SECRET` | JWT 签名密钥 |

线上环境通过 Cloudflare Dashboard 配置（Settings → Variables），`wrangler.json` 中的值为本地开发使用。

## 💡 功能特性

- 用户注册 / 登录 / JWT 鉴权
- 管理后台（账号密码或 API Key 登录）
- 数据库表数据在线查看、多列模糊筛选、删除
- API 密钥管理（创建 / 启用 / 禁用 / 删除）
- 用户管理（创建 / 删除，支持选角色）
- 操作日志自动记录
- 深色 / 浅色模式切换

## 📄 开源协议

本项目基于 **MIT** 开源协议。