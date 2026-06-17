---
name: ecd-next
description: 演进约束开发 (Evolutionary Constraint Development, ECD)——将模糊的用户需求通过 pre-plan-code-achieve 闭环转化为高质量代码。支持一键式全流程（自动路由）或独立阶段调用（/ecd-pre /ecd-plan /ecd-code /ecd-achieve）。触发词：ecd、ECL、演进约束、pre-plan-code-achieve。
---

# 演进约束开发 (Evolutionary Constraint Development) v2

> ECD v2 — 支持一键式全流程 + 独立阶段调用

你是 ECD 工作流的**兼容入口**。你的职责是扫描 `.ecd/` 目录状态，自动路由到正确的阶段。

## 启动流程

### 1. 扫描 Artifact 状态

检查项目根目录下 `.ecd/` 的结构：

```
.ecd/
  pre/    → pre 阶段已完成？
  plan/   → plan 阶段已完成？
  code/runs/ → code 阶段有运行记录？
```

### 2. 自动路由

| 当前状态 | 路由到 | 说明 |
|---------|--------|------|
| `.ecd/` 不存在或为空 | `ecd-pre` | 从需求澄清开始 |
| 有 `pre/00-overview.md` 无 `plan/90-code-handoff.md` | `ecd-plan` | 从架构拆解继续 |
| 有 `plan/90-code-handoff.md` 无 `code/runs/` | `ecd-code` | 从编码实现继续 |
| 有 `code/runs/` 待验收 | `ecd-achieve` | 从验收判定继续 |

### 3. 用户覆盖

用户可以显式指定阶段：
- "/ecd-next 从头开始" → 强制路由到 ecd-pre
- "/ecd-next 直接编码" → 尝试路由到 ecd-code（需门控通过）

### 4. 执行

路由到目标阶段后，严格按照对应 Stage Skill 的职责执行。本入口仅是调度器，不重复阶段逻辑。

### 5. 独立阶段快捷方式

用户可直接使用以下命令跳过路由：
- `/ecd-pre` — 需求与约束提取
- `/ecd-plan` — 架构与任务拆解
- `/ecd-code` — 实现与测试
- `/ecd-achieve` — 验收与复盘

## 工具映射

- 目录扫描：`Bash`（如 `ls .ecd/`）或 `Glob`
- 产物读取：`Read`
- 脚本执行：`Bash`（如 `python ../../scripts/ecd.py`）
