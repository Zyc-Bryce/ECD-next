# ECD v2 更新说明

> v2.0.0：架构升级 — 独立阶段命令 + Artifact 驱动工作流 + Core + Stage Skills 架构

---

## v2.1.0 `[2026-06-26]`

### Case 隔离与归档

- **Case 隔离目录结构**：每个 ECD 流程独立子目录 `.ecd/cases/<slug>/`，不再平铺混杂
- **活跃 case 发现**：`.ecd/current` 指针文件，各阶段自动定位当前 case
- **归档机制**：achieve 判定 `archived` 后自动 Move-Item 到 `.ecd/archive/`，清空 current
- **孤儿 case 检测**：pre 启动时检测未完成 case，警告用户选择继续或放弃

### 产物粒度优化

- **L2 精简为 3 个产物**：90-code-handoff + 91-contracts + 95-execution（92/96 合并到附节）
- **L3 保留 6 个产物**：新增 93-dependency-graph.md
- **Plan 不再冻结 UI 实现**：只冻结契约和数据结构，组件选择留给 code 阶段
- **Plan 不再预生成 i18n key**：只声明需要 i18n 的页面，code 阶段按需添加

### 修订循环

- **新增修订轮次支持**：code 完成后用户反馈→新 run-id + `revision-of` 标注，不强制回到 pre
- 每个 case 最多 3 轮修订，超出提示重新 `/ecd-pre`
- achieve 新增 `03-revision.md` 修订追踪

### 质量改进

- **Pre 审批后强制写入**：Write 调用变为强制 checklist + Read 回读确认
- `achieved_with_followups` 明确后续路径：case 保持活跃，可修订或新建
- `.gitignore` 建议：cases/ + archive/，current 可追踪
- 旧版平铺 `.ecd/` 迁移说明

---

## v2.0.0 更新说明 `[2026-06-17]`

### 架构升级

ECD 从单一入口重构为 **Core + Stage Skills** 可扩展架构：

- **新增 4 个独立阶段命令**：`/ecd-pre` `/ecd-plan` `/ecd-code` `/ecd-achieve`
- **新增兼容入口**：`/ecd-next` 一键式自动路由
- **Artifact 驱动**：用 `.ecd/` 目录下的实际产物文件判断阶段状态，替代隐式状态标记
- **ECD Core**：公共规范层（分类器、门控规则、Artifact 规范、工具映射），Stage Skill 共享

### 目录结构

```
ecd-next/
├── SKILL.md                ← /ecd-next 兼容入口
├── ecd-pre/SKILL.md        ← /ecd-pre 需求与约束提取
├── ecd-plan/SKILL.md       ← /ecd-plan 架构与任务拆解
├── ecd-code/SKILL.md       ← /ecd-code 实现与测试
├── ecd-achieve/SKILL.md    ← /ecd-achieve 验收与复盘
└── shared/
    └── ecd-core.md         ← 公共层（5 模块）
```

### 设计文档

- `docs/specs/2026-06-17-ecd-architecture-v2-design.md` — 架构设计文档
- `docs/specs/2026-06-17-ecd-architecture-v2-implementation-plan.md` — 实现计划

### v2.0.0 文件变更

| 文件 | 变更 |
|------|------|
| `package.json` | 新建：`@zyc-bryce/ecd-next` v2.0.0 |
| `bin/install.js` | 新建：npx 安装脚本，含 5 个命令说明 |
| `.claude-plugin/plugin.json` | 新建：声明 5 个 skill 路径 |
| `.claude-plugin/marketplace.json` | 新建：ecd-next-marketplace |
| `SKILL.md` | 新建：兼容入口（路由调度器） |
| `ecd-pre/SKILL.md` | 新建：需求与约束提取 |
| `ecd-plan/SKILL.md` | 新建：架构与任务拆解 |
| `ecd-code/SKILL.md` | 新建：实现与测试 |
| `ecd-achieve/SKILL.md` | 新建：验收与复盘 |
| `shared/ecd-core.md` | 新建：公共规范层 |
| `README.zh-CN.md` | 新建：v2 独立文档 |
| `USAGE.zh-CN.md` | 新建：v2 使用指南 |
| `CHANGELOG.zh-CN.md` | 新建：v2 版本历史 |
| `scripts/` | 从 v1 继承（ecd.py 等 CLI 辅助脚本） |
| `templates/` | 从 v1 继承 |
| `schemas/` | 从 v1 继承 |
| `references/` | 从 v1 继承 |
| `docs/` | 从 v1 继承 + 新增 specs/ |
| `agents/` | 从 v1 继承 |

---

## 与 v1 的关系

ECD v2 是 v1 的**架构升级**，不是替代：

- v1 (`/ecd`) 继续维护，适合习惯传统单一入口的用户
- v2 (`/ecd-next` + 4 Stage) 适合需要独立阶段控制和可扩展工作流的用户
- 两者可**同时安装**，互不干扰
