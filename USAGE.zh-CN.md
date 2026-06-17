# ECD v2 使用指南

> 演进约束开发 (Evolutionary Constraint Development) v2 — 从模糊需求到可运行代码的完整闭环
>
> 🆕 **v2 新特性：** 独立阶段命令、Artifact 驱动工作流、Core + Stage Skills 可扩展架构

## 目录

1. [快速上手](#快速上手)
2. [五个命令详解](#五个命令详解)
3. [Artifact 目录结构](#artifact-目录结构)
4. [复杂度分类器](#复杂度分类器)
5. [工作流示例](#工作流示例)
6. [增量模式](#增量模式)
7. [FAQ](#faq)

---

## 快速上手

### 最简示例

```
用户："/ecd-pre 给这个 React 项目加个暗色模式切换"
```

ECD-pre 会：
1. 静默探查仓库
2. 三问分类：L1（≤3文件，UI风险，需求清晰）
3. A-Lite：最多 3 个反问（CSS 方案？跟随系统？持久化？）
4. 审批通过后写入 `.ecd/pre/`

然后：
```
用户："/ecd-plan"
  → 读取 .ecd/pre/ → J-Lite 编译交接包 → 写入 .ecd/plan/

用户："/ecd-code"
  → 读取 90-code-handoff.md → 按单元执行 → 写入 .ecd/code/runs/

用户："/ecd-achieve"
  → 验证通过 → archived
```

### 一键式（传统体验）

```
用户："/ecd-next 给这个项目加个暗色模式切换"
```

`/ecd-next` 自动扫描 `.ecd/` 状态 → 路由到正确阶段 → 等同于顺序调用 4 个命令。

---

## 五个命令详解

### `/ecd-next` — 兼容入口

自动路由逻辑：

| `.ecd/` 状态 | 路由到 |
|-------------|--------|
| `.ecd/` 不存在或为空 | `/ecd-pre` |
| 有 `pre/` 无 `plan/` | `/ecd-plan` |
| 有 `plan/` 无 `code/runs/` | `/ecd-code` |
| 有 `code/runs/` 待验收 | `/ecd-achieve` |

用户可覆盖：`"/ecd-next 从头开始"` → 强制 `/ecd-pre`

### `/ecd-pre` — 需求与约束提取

- 探查仓库 → 三问定级 → 按等级执行 A-Lite 或 A-Full
- **L1**：最多 3 反问，紧凑审批包
- **L2/L3**：深度质疑 + 方案发散（至少 3 种技术方案）
- 产物：`.ecd/pre/00-overview.md`、`05-constraint-ledger.md`

### `/ecd-plan` — 架构与任务拆解

- 门控：检查 `.ecd/pre/00-overview.md` 存在
- **L1**：J-Lite（直接编译最小交接包）
- **L2**：C → D(可选) → E(精简) → H(可选) → J
- **L3**：完整 10 阶段，D/G/H/J 强制独立子 Agent
- 产物：`.ecd/plan/90-code-handoff.md` + 伴侣文档

### `/ecd-code` — 实现与测试

- 门控：检查 `.ecd/plan/90-code-handoff.md` 存在
- 仅消费交接包，不发明产品语义
- 按实现单元顺序执行，每个单元完成后验证
- 遇歧义 fail closed（写 `02-reentry.md`）
- 产物：`.ecd/code/runs/<run-id>/00-code-run.md`

### `/ecd-achieve` — 验收与复盘

- 门控：检查 `.ecd/code/runs/` 有运行记录
- 验证 bundle、验收清单、首次打开体验
- 判定：`archived` / `achieved_with_followups` / `not_achieved`
- 产物：`.ecd/achieve/03-achieve.md`

---

## Artifact 目录结构

```
项目根/.ecd/
  pre/                         ← /ecd-pre 写入
    00-overview.md             ← 需求重述、等级、范围、假设
    05-constraint-ledger.md    ← 约束账本
    case.json                  ← L2/L3 时生成

  plan/                        ← /ecd-plan 写入
    90-code-handoff.md         ← 交接包（code 唯一入口）
    91-canonical-contracts.md  ← 接口契约
    92-constraint-crosswalk.md ← 约束映射表
    95-execution-manifest.md   ← 执行清单
    96-code-batches.md         ← 分批计划

  code/                        ← /ecd-code 写入
    runs/
      001/
        00-code-run.md
        01-verification.md

  achieve/                     ← /ecd-achieve 写入
    03-achieve.md
```

---

## 复杂度分类器

| 问题 | L1 (轻量) | L2 (标准) | L3 (重量) |
|------|-----------|-----------|-----------|
| Q1 代码影响面 | ≤3 文件 | 4-10 文件 | >10 文件 |
| Q2 安全/正确性风险 | UI样式/文案 | 功能逻辑/API | 数据丢失/认证/支付 |
| Q3 需求清晰度 | 明确无歧义 | 部分细节待定 | 模糊 → 强制 L3 |

`最终等级 = max(Q1, Q2, Q3)`

---

## 工作流示例

### 场景 1：简单功能（暗色模式）

```
/ecd-pre → [L1] → A-Lite(3问) → 审批 → .ecd/pre/
/ecd-plan → [L1] → J-Lite → .ecd/plan/90-code-handoff.md
/ecd-code → 按单元执行 → .ecd/code/runs/001/
/ecd-achieve → 验收 → archived
```

### 场景 2：安全敏感功能（认证系统）

```
/ecd-pre → [L3] → A+B(深度质疑+方案发散) → 审批 → .ecd/pre/
/ecd-plan → [L3] → C→D→E→F→G(红蓝对抗)→H→J → .ecd/plan/
/ecd-code → 严格按交接包执行
/ecd-achieve → 全面验收
```

### 场景 3：Bug 修复

```
/ecd-code → 读取已有 .ecd/plan/90-code-handoff.md → 修复 → 验证
/ecd-achieve → 验收
```

---

## 增量模式

已有 `.ecd/` bundle 的项目，后续修改不需要重走完整流水线：

| 变更类型 | 从哪个阶段进入 |
|---------|-------------|
| 改变产品语义 | `/ecd-pre` |
| 改变实现方案 | `/ecd-plan` |
| 纯增量功能 | `/ecd-plan`（跳转到 Stage J） |
| Bug 修复 | 直接 `/ecd-code` |

---

## FAQ

### Q: v2 和 v1 有什么区别？

A: v2 支持**独立阶段调用**（`/ecd-pre` `/ecd-plan` `/ecd-code` `/ecd-achieve`），v1 只能顺序执行。v2 用 **Artifact 文件**判断阶段状态，v1 用内部状态标记。v2 的架构（Core + Stage Skills）更易扩展。

### Q: 我能同时安装 v1 和 v2 吗？

A: 可以。`/ecd`（v1）和 `/ecd-next`（v2）互不干扰。

### Q: 必须按顺序执行四个命令吗？

A: 不必须。你可以独立执行任何阶段——但后置阶段会检查前置 artifact，缺失时提示你先执行前置命令。

### Q: 微型任务（<10 行改动）怎么处理？

A: ECD-pre 的分类器会自动检测微型任务条件，触发快速通道：跳过 pre/plan，直接进入 code。
