# ECD v2 架构升级 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 ECD 从单一入口拆分为 ECD Core + 4 个可独立调用的 Stage Skill + 1 个兼容入口

**Architecture:** 新建 6 个 markdown 文件（1 Core + 5 SKILL.md），Core 是纯规范文档供 Stage Skill 按需引用，Stage Skill 各自 ~80 行自包含。所有文件位于 `ecd-next/` 内，不动原版 `ecd/`。

**Tech Stack:** Markdown（SKILL.md + YAML frontmatter），无需额外依赖

---

## 文件映射

| 文件 | Skill 名称 | 用户命令 | 作用 |
|------|-----------|---------|------|
| `shared/ecd-core.md` | — | — | 公共层：artifact 规范、分类器、门控规则、工具映射 |
| `SKILL.md` | `ecd-next` | `/ecd-next` | 兼容入口：扫描 `.ecd/` 自动路由 |
| `ecd-pre/SKILL.md` | `ecd-pre` | `/ecd-pre` | 需求质疑澄清 + 分类定级 |
| `ecd-plan/SKILL.md` | `ecd-plan` | `/ecd-plan` | 收敛需求 + 生成交接包 |
| `ecd-code/SKILL.md` | `ecd-code` | `/ecd-code` | 按交接包执行编码 |
| `ecd-achieve/SKILL.md` | `ecd-achieve` | `/ecd-achieve` | 基于证据验收判定 |

---

### Task 1: 创建目录结构

**Files:**
- Create: `ecd-next/shared/` (目录)
- Create: `ecd-next/ecd-pre/` (目录)
- Create: `ecd-next/ecd-plan/` (目录)
- Create: `ecd-next/ecd-code/` (目录)
- Create: `ecd-next/ecd-achieve/` (目录)

- [ ] **Step 1: 创建所有子目录**

```powershell
$base = 'D:\11aagit\控制论skill\NewSkills\ecd\skills\ecd-next'
New-Item -ItemType Directory -Force -Path "$base\shared"
New-Item -ItemType Directory -Force -Path "$base\ecd-pre"
New-Item -ItemType Directory -Force -Path "$base\ecd-plan"
New-Item -ItemType Directory -Force -Path "$base\ecd-code"
New-Item -ItemType Directory -Force -Path "$base\ecd-achieve"
```

- [ ] **Step 2: 验证目录结构**

```powershell
Get-ChildItem -Directory 'D:\11aagit\控制论skill\NewSkills\ecd\skills\ecd-next' | Select-Object Name
```

预期输出包含: `shared`, `ecd-pre`, `ecd-plan`, `ecd-code`, `ecd-achieve`, `scripts`, `templates`, `schemas`, `references`, `docs`, `agents`

- [ ] **Step 3: 提交**

```bash
cd 'D:\11aagit\控制论skill\NewSkills\ecd'
git add skills/ecd-next/shared/ skills/ecd-next/ecd-pre/ skills/ecd-next/ecd-plan/ skills/ecd-next/ecd-code/ skills/ecd-next/ecd-achieve/
git commit -m "feat(ecd-next): create v2 directory structure for stage skills"
```

---

### Task 2: 编写 `shared/ecd-core.md` — ECD Core 公共层

**Files:**
- Create: `ecd-next/shared/ecd-core.md`

- [ ] **Step 1: 编写 Core 文件**

```markdown
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

**arifact 自动发现逻辑**：

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
```

- [ ] **Step 2: 提交**

```bash
cd 'D:\11aagit\控制论skill\NewSkills\ecd'
git add skills/ecd-next/shared/ecd-core.md
git commit -m "feat(ecd-next): add ECD Core shared specification (5 modules)"
```

---

### Task 3: 编写 `ecd-pre/SKILL.md` — 需求与约束提取

**Files:**
- Create: `ecd-next/ecd-pre/SKILL.md`

- [ ] **Step 1: 编写 ecd-pre SKILL.md**

```markdown
---
name: ecd-pre
description: ECD 阶段 1：需求质疑与澄清。探查仓库、分类定级、冻结审批目标，为后续 plan 提供语义基础。触发词：需求分析、需求澄清、pre、约束提取。
---

# ECD-PRE：需求与约束提取

你是 ECD 工作流的第一阶段。你的职责是**质疑、澄清、发散，冻结审批目标**——在一行代码写出来之前，让需求语义达到最大覆盖率。

## 启动流程

### 1. 加载 Core 规范

用 `Read` 加载 `../shared/ecd-core.md` 中的以下模块：
- **模块 2：复杂度分类器**（三问定级）
- **模块 5：输出格式规范**（产物格式）

### 2. 探查仓库

使用 `Glob`、`Grep`、`Read`、`codegraph_*` 先搜索本地仓库、文档、配置和现有产物，**再**向用户提问。

### 3. 分类定级

静默回答三问（Q1 影响面 / Q2 风险 / Q3 清晰度），输出等级。格式：
```
[L2] 判定依据: 6文件 + 功能逻辑风险 + 需求明确
```

### 4. 按等级执行

**L1 (ECD-Lite)：A-Lite**
- 最多 3 个反问
- 冻结：重述目标、保留范围、排除范围、3-5 项验收检查、关键假设
- 呈现紧凑审批包（5 行以内）

**L2/L3 (ECD-Standard/Full)：A + B**
- **阶段 A**：深度质疑。默认假设用户可能说不清、说不全、隐瞒甚至无意识撒谎。主动找出模糊、歧义、缺失、矛盾之处，以反问形式澄清。用批量问题暴露隐藏矛盾或缺失语义。
- **阶段 B（方案发散）**：生成至少 3 种材质不同的技术方案（非风格变体），每个方案说明覆盖了哪些盲区、有哪些权衡。保留恰好一条路径进入收敛。

### 5. 审批门

在用户明确批准前**不得进入 plan**。审批包包含：
- 重述后的目标
- 保留范围 / 舍弃范围
- 关键假设
- 将冻结给 code 的具体决策

### 6. 写入产物

用户批准后，创建 `.ecd/pre/` 并写入：

```
.ecd/pre/
  00-overview.md             ← 等级、重述目标、范围边界、假设、审批记录
  05-constraint-ledger.md    ← 冻结决策
  case.json                  ← L2/L3 时生成
```

### 7. 输出

告知用户：**"审批目标已冻结。请执行 `/ecd-plan` 进入架构与任务拆解。"**

## 工具映射

- 仓库探索：`Read` / `Glob` / `Grep` / `codegraph_*`
- 结构化审批：`EnterPlanMode` / `ExitPlanMode`
- 产物写入：`Write`
- 脚本执行：`Bash`（如 `python ../scripts/ecd.py pre --request "..." --output .ecd/pre`）

## 反模式

- ❌ 不在审批前进入 plan
- ❌ 不追求"少问问题"——追求审批前语义覆盖率最大化
- ❌ 不跳过仓库探查就向用户提问
```

- [ ] **Step 2: 提交**

```bash
cd 'D:\11aagit\控制论skill\NewSkills\ecd'
git add skills/ecd-next/ecd-pre/SKILL.md
git commit -m "feat(ecd-next): add ecd-pre stage skill"
```

---

### Task 4: 编写 `ecd-plan/SKILL.md` — 架构与任务拆解

**Files:**
- Create: `ecd-next/ecd-plan/SKILL.md`

- [ ] **Step 1: 编写 ecd-plan SKILL.md**

```markdown
---
name: ecd-plan
description: ECD 阶段 2：收敛需求，生成 code-ready 交接包。读取 pre 阶段的审批目标，拆解需求、验证依赖、编译交接。触发词：架构设计、任务拆解、交接包、plan。
---

# ECD-PLAN：架构与任务拆解

你是 ECD 工作流的第二阶段。你的职责是**收敛需求，冻结代码就绪的交接包**。

## 启动流程

### 1. Artifact 门控

检查 `.ecd/pre/00-overview.md` 是否存在。

- **不存在** → 阻塞，输出：
  > "未找到 `.ecd/pre/00-overview.md`，请先执行 `/ecd-pre` 完成需求澄清和审批。"
- **存在** → 继续。

### 2. 加载前置产物

用 `Read` 读取 `.ecd/pre/` 下全部产物（00-overview.md、05-constraint-ledger.md、case.json 如存在）。从中获取等级信息。

### 3. 加载 Core 规范

用 `Read` 加载 `../shared/ecd-core.md` 中的以下模块：
- **模块 1：Artifact 目录规范**（plan 产物规格）
- **模块 3：阶段门控规则**
- **模块 4：共享工具映射**

### 4. 按等级执行收敛

**L1：J-Lite**
- 将 A-Lite 输出直接编译为最小交接包
- 仅生成 `90-code-handoff.md`

**L2：C → D(可选) → E(精简) → H(可选) → J**
- C：需求拆解为可验证的需求单元，冻结接口契约
- D（需求单元 >5 或存在横切关注点时运行）：独立批判子 Agent
- E（精简）：仅解决高影响依赖缺口
- H（实现单元 >3 时运行）：独立评审子 Agent
- J：编译交接包

**L3：完整 10 阶段**
- C → D → E → F → G → H → J
- D/G/H/J 必须使用 `Agent` 工具启动独立子 Agent
- 详见 `../references/stage-playbook.md` 和 `../references/subagent-protocol.md`

### 5. 写入产物

创建 `.ecd/plan/` 并写入：

```
.ecd/plan/
  90-code-handoff.md         ← 交接包（code 唯一入口）
  91-canonical-contracts.md  ← 接口契约（L2/L3）
  92-constraint-crosswalk.md ← 约束映射表（L2/L3）
  95-execution-manifest.md   ← 执行清单（L2/L3）
  96-code-batches.md         ← 分批计划（L2/L3）
```

`90-code-handoff.md` 必须冻结：
- 产品是什么/不是什么
- 仓库目标和仓库落地事实
- 用户可见工作流和空/错误/加载状态
- 领域对象和状态转换
- 数据形态和持久化行为
- 逐文件变更计划
- 函数级契约
- 实现单元及其顺序
- 验证命令和浏览器检查
- 什么会触发流程重开

### 6. 输出

告知用户：**"交接包已冻结。请执行 `/ecd-code` 开始编码实现。"**

## 反模式

- ❌ 不重新打开 pre 已批准的产品决策
- ❌ 不给 code 留下需要发明产品语义的缺口
- ❌ L3 时不跳过强制子 Agent 阶段
```

- [ ] **Step 2: 提交**

```bash
cd 'D:\11aagit\控制论skill\NewSkills\ecd'
git add skills/ecd-next/ecd-plan/SKILL.md
git commit -m "feat(ecd-next): add ecd-plan stage skill"
```

---

### Task 5: 编写 `ecd-code/SKILL.md` — 实现与测试

**Files:**
- Create: `ecd-next/ecd-code/SKILL.md`

- [ ] **Step 1: 编写 ecd-code SKILL.md**

```markdown
---
name: ecd-code
description: ECD 阶段 3：严格按交接包执行编码。从 90-code-handoff.md 读取实现单元，顺序执行，每个单元完成后验证。不发明产品语义。触发词：编码、实现、code。
---

# ECD-CODE：实现与测试

你是 ECD 工作流的第三阶段。你的职责是**严格按交接包执行编码，不发明产品语义**。

## 启动流程

### 1. Artifact 门控

检查 `.ecd/plan/90-code-handoff.md` 是否存在。

- **不存在** → 阻塞，输出：
  > "未找到 `.ecd/plan/90-code-handoff.md`，请先执行 `/ecd-plan` 生成交接包。"
- **存在** → 继续。

### 2. 加载前置产物

用 `Read` 读取 `.ecd/plan/90-code-handoff.md` 及其显式引用的伴侣文档（91/92/95/96）。

### 3. 加载 Core 规范

用 `Read` 加载 `../shared/ecd-core.md` 中的以下模块：
- **模块 3：阶段门控规则**
- **模块 4：共享工具映射**

### 4. 执行编码

1. 分配 run-id（`001`, `002`...），创建 `.ecd/code/runs/<run-id>/`
2. 用 `Read`/`Glob`/`Grep`/`codegraph_*` 在仓库中落地事实
3. 用 `TaskCreate`/`TaskUpdate` 跟踪实现单元进度
4. **按顺序**执行实现单元
5. 每个单元完成后用 `Bash` 运行验证

### 5. 写入产物

```
.ecd/code/runs/<run-id>/
  00-code-run.md             ←   运行记录
  01-verification.md         ←   验证结果
  02-reentry.md              ←   （可选）中断重入标记
```

### 6. 必须遵守

- 仅消费 `90-code-handoff.md` 及其显式引用的文件
- 每个实现单元完成后立即验证
- 遇语义歧义时 **fail closed**（写 02-reentry.md，指向最早损坏的阶段）

### 7. 禁止行为

- 重新打开产品方向
- 发明缺失的用户语义
- 静默重排交接顺序
- 自行决定验收标准

### 8. 输出

告知用户：**"编码完成。请执行 `/ecd-achieve` 进行验收判定。"**

## 反模式

- ❌ 不在编码期间补充产品语义——那是 plan 的缺陷
- ❌ 遇到歧义不猜——停止并写 02-reentry.md
```

- [ ] **Step 2: 提交**

```bash
cd 'D:\11aagit\控制论skill\NewSkills\ecd'
git add skills/ecd-next/ecd-code/SKILL.md
git commit -m "feat(ecd-next): add ecd-code stage skill"
```

---

### Task 6: 编写 `ecd-achieve/SKILL.md` — 验收与复盘

**Files:**
- Create: `ecd-next/ecd-achieve/SKILL.md`

- [ ] **Step 1: 编写 ecd-achieve SKILL.md**

```markdown
---
name: ecd-achieve
description: ECD 阶段 4：基于证据判定验收结果。验证 bundle 完整性、检查验收清单、判断首次打开体验，决定归档还是重开。触发词：验收、验证、achieve、复盘。
---

# ECD-ACHIEVE：验收与复盘

你是 ECD 工作流的第四阶段。你的职责是**基于证据判定验收结果，决定归档还是重开**。

## 启动流程

### 1. Artifact 门控

检查 `.ecd/code/runs/` 是否至少有一次运行记录。

- **不存在** → 阻塞，输出：
  > "未找到 `.ecd/code/runs/` 运行记录，请先执行 `/ecd-code` 完成编码实现。"
- **存在** → 继续。

### 2. 加载前置产物

用 `Read` 读取：
- `.ecd/plan/90-code-handoff.md`（验收清单）
- `.ecd/code/runs/<latest-run>/00-code-run.md`
- `.ecd/code/runs/<latest-run>/01-verification.md`

### 3. 加载 Core 规范

用 `Read` 加载 `../shared/ecd-core.md` 中的以下模块：
- **模块 3：阶段门控规则**
- **模块 5：输出格式规范**（校验命令）

### 4. 执行验收

**必须验证全部：**
1. 运行 `python ../scripts/validate_ecl_bundle.py .ecd/` — 必须通过
2. 运行 `90-code-handoff.md` 中指定的测试/构建检查
3. 逐项检查 `90-code-handoff.md` 的验收检查清单
4. 检查首次打开体验——没有明显布局或交互损坏

### 5. 写入产物

```
.ecd/achieve/
  03-achieve.md              ←   验收判定
```

**判定：**
- `archived` — 全部通过，归档关闭
- `achieved_with_followups` — 主体通过，有低影响遗留项
- `not_achieved` — 验收失败，保持打开

验收失败的运行必须保持打开，不可伪装为干净关闭。

### 6. 输出

告知用户最终判定结果。如为 `archived`，告知 case 已关闭。如为 `not_achieved`，指明哪些验收项未通过。

## 反模式

- ❌ 不以"看着还行"代替证据
- ❌ 不跳过 bundle 校验
- ❌ 不把验收失败标记为 archived
```

- [ ] **Step 2: 提交**

```bash
cd 'D:\11aagit\控制论skill\NewSkills\ecd'
git add skills/ecd-next/ecd-achieve/SKILL.md
git commit -m "feat(ecd-next): add ecd-achieve stage skill"
```

---

### Task 7: 重写根 `SKILL.md` — 兼容入口

**Files:**
- Modify: `ecd-next/SKILL.md`（当前是原版的完整副本，需替换为兼容入口）

- [ ] **Step 1: 重写 SKILL.md 为兼容入口**

```markdown
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
- 脚本执行：`Bash`（如 `python scripts/ecd.py`）
```

- [ ] **Step 2: 提交**

```bash
cd 'D:\11aagit\控制论skill\NewSkills\ecd'
git add skills/ecd-next/SKILL.md
git commit -m "feat(ecd-next): rewrite root SKILL.md as compatibility entry with auto-routing"
```

---

### Task 8: 验证安装

**Files:**
- 无新建，验证阶段

- [ ] **Step 1: 确认所有文件就位**

```powershell
$base = 'D:\11aagit\控制论skill\NewSkills\ecd\skills\ecd-next'
Get-ChildItem -Recurse -File $base -Include 'SKILL.md', 'ecd-core.md' |
    Select-Object FullName
```

预期输出 6 个文件：
```
...\ecd-next\SKILL.md
...\ecd-next\shared\ecd-core.md
...\ecd-next\ecd-pre\SKILL.md
...\ecd-next\ecd-plan\SKILL.md
...\ecd-next\ecd-code\SKILL.md
...\ecd-next\ecd-achieve\SKILL.md
```

- [ ] **Step 2: 验证 YAML frontmatter 格式**

```powershell
$files = @(
    'D:\11aagit\控制论skill\NewSkills\ecd\skills\ecd-next\SKILL.md',
    'D:\11aagit\控制论skill\NewSkills\ecd\skills\ecd-next\ecd-pre\SKILL.md',
    'D:\11aagit\控制论skill\NewSkills\ecd\skills\ecd-next\ecd-plan\SKILL.md',
    'D:\11aagit\控制论skill\NewSkills\ecd\skills\ecd-next\ecd-code\SKILL.md',
    'D:\11aagit\控制论skill\NewSkills\ecd\skills\ecd-next\ecd-achieve\SKILL.md'
)
foreach ($f in $files) {
    $content = Get-Content $f -Raw
    if ($content -match '^---\s*\nname:\s*(\S+)') {
        Write-Host "✅ $($matches[1]) — $f"
    } else {
        Write-Host "❌ Missing name field — $f"
    }
}
```

预期输出 5 个 ✅：
```
✅ ecd-next
✅ ecd-pre
✅ ecd-plan
✅ ecd-code
✅ ecd-achieve
```

- [ ] **Step 3: 确认原版未被修改**

```powershell
cd 'D:\11aagit\控制论skill\NewSkills\ecd'
git status --short skills/ecd/
```

预期输出：**空**（无任何改动）

- [ ] **Step 4: 安装 Junction 并验证技能发现**

```powershell
Remove-Item "$env:USERPROFILE\.claude\skills\ecd-next" -Force -ErrorAction SilentlyContinue
New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\skills\ecd-next" `
    -Target "D:\11aagit\控制论skill\NewSkills\ecd\skills\ecd-next" -Force
Get-ChildItem "$env:USERPROFILE\.claude\skills\ecd-next" -Directory |
    Where-Object { (Get-ChildItem $_.FullName -Filter 'SKILL.md' -Depth 0).Count -gt 0 } |
    Select-Object Name
```

预期：Junction 创建成功，显示含 SKILL.md 的子目录。

- [ ] **Step 5: 提交**

```bash
cd 'D:\11aagit\控制论skill\NewSkills\ecd'
git add skills/ecd-next/SKILL.md
git commit -m "chore(ecd-next): verify installation and file structure"
```

---

## 自审清单

- [x] **Spec 覆盖**：每个设计文档的章节都有对应任务——模块1-5 → Task 2，4个Stage → Task 3-6，兼容入口 → Task 7
- [x] **占位符检查**：无 TBD、TODO、implement later
- [x] **类型一致性**：所有文件路径统一使用相对路径 `../` 引用 Core 和 scripts
- [x] **原版隔离**：所有操作仅在 `ecd-next/` 内，Task 8 Step 3 验证原版未被触碰
