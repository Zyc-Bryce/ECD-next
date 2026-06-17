# 演进约束开发 v2

[English](README.md) | 简体中文

<div align="center">

**先冻结产品含义，再把交付压进一个有约束的 pre-plan-code-achieve 闭环。**

![Claude Code](https://img.shields.io/badge/Claude_Code-Skill-412991?style=flat-square)
![Constraint Planning](https://img.shields.io/badge/Planning-Constraint_Driven-0F766E?style=flat-square)
![CLI Toolkit](https://img.shields.io/badge/CLI-Toolkit-1D4ED8?style=flat-square)
![Plan Code Achieve](https://img.shields.io/badge/Workflow-Plan_Code_Achive-7C3AED?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)
![Version](https://img.shields.io/badge/version-2.0-blue?style=flat-square)

**🏗️ ECD Core + 4 Stage Skills — 可扩展的 Workflow Framework**

</div>

## 目录

- [v1 vs v2](#v1-vs-v2)
- [快速开始](#快速开始)
- [五个命令](#五个命令)
- [前置要求](#前置要求)
- [安装与卸载](#安装与卸载)
- [架构](#架构)
- [仓库导览](#仓库导览)
- [参与贡献](#参与贡献)
- [致谢](#致谢)
- [许可证](#许可证)

## v1 vs v2

| | ECD v1 (`/ecd`) | ECD v2 (`/ecd-next` + 4 Stage) |
|---|---|---|
| 入口数 | 1 | **5**（一键 + 4 独立阶段） |
| 阶段调用 | 必须顺序 | **可独立调用** |
| 状态管理 | 隐式（case.json 字段） | **显式（Artifact 文件）** |
| 架构 | 单一 SKILL.md | **Core + Stage Skills（可扩展）** |
| 安装 | `npx @zyc-bryce/ecd` | `npx @zyc-bryce/ecd-next` |

## 快速开始

在 Claude Code 中输入以下任一命令：

```
/ecd-next     一键式全流程（扫描 .ecd/ 自动路由）
/ecd-pre      需求与约束提取
/ecd-plan     架构与任务拆解
/ecd-code     实现与测试
/ecd-achieve  验收与复盘
```

## 五个命令

| 命令 | 职责 | 写入 | 前置条件 |
|------|------|------|---------|
| `/ecd-next` | 兼容入口，扫描 `.ecd/` 自动路由 | — | 无 |
| `/ecd-pre` | 质疑澄清，分类定级，冻结审批目标 | `.ecd/pre/` | 无 |
| `/ecd-plan` | 收敛需求，生成 code-ready 交接包 | `.ecd/plan/` | `.ecd/pre/00-overview.md` |
| `/ecd-code` | 严格按交接包执行编码 | `.ecd/code/runs/` | `.ecd/plan/90-code-handoff.md` |
| `/ecd-achieve` | 基于证据判定验收 | `.ecd/achieve/` | `.ecd/code/runs/` 至少一次运行 |

### 典型工作流

```
用户: "/ecd-pre 给这个项目加个暗色模式切换"
  → ECD-PRE 质疑澄清 → 审批 → 冻结到 .ecd/pre/

用户: "/ecd-plan"
  → ECD-PLAN 拆解任务 → 生成 90-code-handoff.md → 冻结到 .ecd/plan/

用户: "/ecd-code"
  → ECD-CODE 按交接包执行编码 → 逐单元验证 → 记录到 .ecd/code/runs/001/

用户: "/ecd-achieve"
  → ECD-ACHIEVE 验收判定 → archived / left_open
```

## 前置要求

- **Claude Code** — 建议使用最新版本
- **Python 3.8+** — 仅在使用 CLI 辅助脚本时需要（可选）
- **Git** — 通过 `npx skills add` 安装时需要

## 安装与卸载

### 方式一：npx 一键安装（⭐ 推荐）

```bash
npx @zyc-bryce/ecd-next
```

重启 Claude Code 后，5 个命令全部可用。

#### 卸载

```bash
npx @zyc-bryce/ecd-next --uninstall
```

### 方式二：npx skills add

```bash
npx skills add Zyc-Bryce/ECD-next
```

> ⚠️ **关键操作：用空格键勾选 Claude Code！**

#### 卸载

```bash
npx skills remove ecd-next
```

### 方式三：手动安装

```bash
# 克隆仓库
git clone https://github.com/Zyc-Bryce/ECD-next.git

# 复制到 Claude Code skills 目录
# Windows (PowerShell)
Copy-Item -Recurse ECD-next $env:USERPROFILE\.claude\skills\

# macOS / Linux
cp -r ECD-next ~/.claude/skills/
```

#### 卸载

直接删除 `.claude/skills/ecd-next/` 目录。

## 架构

```
ecd-next/
├── SKILL.md                ← /ecd-next 兼容入口（路由调度器）
├── ecd-pre/SKILL.md        ← /ecd-pre 需求与约束提取
├── ecd-plan/SKILL.md       ← /ecd-plan 架构与任务拆解
├── ecd-code/SKILL.md       ← /ecd-code 实现与测试
├── ecd-achieve/SKILL.md    ← /ecd-achieve 验收与复盘
├── shared/
│   └── ecd-core.md         ← 公共层（5 模块：Artifact 规范、分类器、门控、工具映射、格式规范）
├── scripts/                ← CLI 辅助脚本
├── templates/              ← Bundle 产物模板
├── schemas/                ← ECL schema
├── references/             ← Playbook、质量门槛、子代理协议
├── docs/                   ← 理论、阶段、入门指南
└── agents/                 ← Claude Code Agent 接口
```

### 设计原则

- **Artifact 驱动**：不再依赖 `pre_complete=true` 这样的状态标记，改为检查 `.ecd/` 目录下的实际产物文件
- **Core 共享**：分类器、门控规则、工具映射等公共规范集中在 `shared/ecd-core.md`，Stage Skill 按需引用
- **可扩展**：新增阶段只需添加一个 `SKILL.md` 文件，无需修改现有代码

## 仓库导览

- `docs/specs/` — 设计文档
- `docs/zh-CN/beginners-guide.md` — 小白入门完全指南
- `shared/ecd-core.md` — ECD Core 公共规范
- `references/zh-CN/` — 中文参考指南

## 参与贡献

欢迎贡献！在 [GitHub Issues](https://github.com/Zyc-Bryce/ECD-next/issues) 提交 issue 或 PR。

## 致谢

本技能基于 [@Etherstrings](https://github.com/Etherstrings) 创建的 [Evolution Constraint Planner](https://github.com/Etherstrings/evolution-constraint-planner)，由 [ECD v1](https://github.com/Zyc-Bryce/ECD) 演进而来。

## 许可证

MIT
