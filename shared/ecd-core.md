# ECD Core — 公共层规范

> 本文件是 ECD v2 的公共规范层。4 个 Stage Skill 启动时用 `Read` 工具按需加载对应模块。
> 本文件不是 Skill——Claude Code 不会自动发现它。

---

## 模块 1：Artifact 目录规范

所有 ECD 阶段产物写入项目根目录下的 `.ecd/`，按阶段分子目录：

```
.ecd/
  pre/                         ← ecd-pre 写入
    00-overview.md             ←   需求重述、等级、范围边界、假设、审批记录
    05-constraint-ledger.md    ←   约束账本（冻结的决策）
    case.json                  ←   规范化 case 数据（L2/L3）

  plan/                        ← ecd-plan 写入
    90-code-handoff.md         ←   交接包（code 唯一入口）
    91-canonical-contracts.md  ←   接口契约
    92-constraint-crosswalk.md ←   约束映射表
    95-execution-manifest.md   ←   执行清单
    96-code-batches.md         ←   分批计划

  code/                        ← ecd-code 写入
    runs/
      <run-id>/                ←   每次运行一个子目录（001, 002...）
        00-code-run.md         ←   运行记录
        01-verification.md     ←   验证结果
        02-reentry.md          ←   （可选）中断重入标记

  achieve/                     ← ecd-achieve 写入
    03-achieve.md              ←   验收判定
```

**文件编号规则**：`00-` 概览类、`05-` 约束类、`90-` 交接类、`03-` 验收类。

---

## 模块 2：复杂度分类器

在执行 ecd-pre 时，先静默评估以下 3 个问题（不向用户提问，基于仓库探查和需求分析自行判断）：

| 问题 | L1 (轻量) | L2 (标准) | L3 (重量) |
|------|-----------|-----------|-----------|
| **Q1 代码影响面** | ≤3 文件 | 4-10 文件 | >10 文件 |
| **Q2 安全/正确性风险** | UI样式/文案/排版 | 功能逻辑/API | 数据丢失/认证/支付/安全漏洞/PII |
| **Q3 需求清晰度** | 需求明确无歧义 | 部分细节待定 | 需求模糊（如"让它变快"）→ **自动升级 L3** |

### 定级规则

```
最终等级 = max(Q1, Q2, Q3)
Q3 为 "模糊" 时 → 强制 L3（不论 Q1/Q2 结果）
greenfield 项目（无现有仓库）→ Q1 默认 L2
用户可显式覆盖：--tier lite|standard|full
```

### 三级路由

| 等级 | 阶段路径 | 子 Agent | Token 预算 | 适用场景 |
|------|---------|----------|-----------|---------|
| **L1 ECD-Lite** | A-Lite → J-Lite → code → achieve-Lite | 0 | 15k-30k | 暗色模式、修bug、文案调整、单组件改动 |
| **L2 ECD-Standard** | A → B → C → D(可选) → E(精简) → H(可选) → J → code → achieve | 0-2 | 35k-55k | 新增API、中等功能、多文件改动 |
| **L3 ECD-Full** | A → B → C → D → E → F → G → H → J → code → achieve | 5 (强制) | 65k-105k | 认证系统、架构变更、安全敏感、需求模糊 |

### 微型任务快速通道

在定级完成后，额外检查微型任务条件。**全部满足**则跳过 pre/plan 直接进入 code：

| 条件 | 阈值 |
|------|------|
| 预估代码改动 | **<10 行** |
| 安全/正确性风险 | **L1**（仅UI样式/文案/排版） |
| 需求清晰度 | **明确无歧义** |

触发微型通道时：不生成 bundle、不启动子Agent、不渲染审批包。直接执行代码改动 → 快速验证 → 完成。预估 Token：**3k-8k**。

### 分类理由输出

在审批包顶部输出一行分类理由，格式：
```
[L2] 判定依据: 6文件 + 功能逻辑风险 + 需求明确
```

格式规范：`[等级] 判定依据: Q1结果 + Q2结果 + Q3结果`，其中 Q1/Q2/Q3 用中文简述。

---

## 模块 3：阶段门控规则

| 命令 | 门控检查 | 缺失时行为 |
|------|---------|-----------|
| `/ecd-pre` | 无前置要求 | 直接启动 |
| `/ecd-plan` | `.ecd/pre/00-overview.md` 存在？ | 阻塞："未找到 `.ecd/pre/00-overview.md`，请先执行 `/ecd-pre`" |
| `/ecd-code` | `.ecd/plan/90-code-handoff.md` 存在？ | 阻塞："未找到 `.ecd/plan/90-code-handoff.md`，请先执行 `/ecd-plan`" |
| `/ecd-achieve` | `.ecd/code/runs/` 至少一个 run？ | 阻塞："未找到 `.ecd/code/runs/` 运行记录，请先执行 `/ecd-code`" |

**artifact 自动发现逻辑**：

1. 检查 `<project_root>/.ecd/` 是否存在
2. 扫描各子目录（pre/ plan/ code/runs/ achieve/）
3. 根据已有产物判断当前可执行的阶段
4. 无需用户手动指定 case.json 或 bundle 路径

---

## 模块 4：共享工具映射

| ECD 需求 | Claude Code 工具 |
|----------|-----------------|
| 独立子 Agent (D/G/H/J) | `Agent` 工具，`subagent_type: "general-purpose"` |
| 进度跟踪 | `TaskCreate` / `TaskUpdate` |
| 运行 CLI 脚本和验证 | `Bash` 工具 |
| 结构化审批门 | `EnterPlanMode` / `ExitPlanMode` |
| 仓库落地和探索 | `Read` / `Glob` / `Grep` / `codegraph_*` |
| 代码修改 | `Edit` / `Write` |
| 运行记录和笔记 | `Write` 写入 markdown 文件 |
| Bundle 渲染/校验 | `Bash` 调用 `scripts/` 下的 Python 脚本 |

---

## 模块 5：输出格式规范

- 所有产物为 Markdown，UTF-8 无 BOM
- 文件编号规则：`00-` 概览类、`05-` 约束类、`90-` 交接类、`03-` 验收类
- Bundle 校验命令：`python scripts/validate_ecl_bundle.py .ecd/`
- 脚本路径：相对于 `ecd-next/` 根目录，如 `python scripts/ecd.py pre --request "..." --output .ecd/pre`
