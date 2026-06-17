# ECD v2 架构升级设计文档

> 日期：2026-06-17
> 状态：设计完成，待实现

## 1. 背景与目标

### 1.1 现状

ECD v1.x 是一个单一入口的 Claude Code Skill（`/ecd`）。用户输入需求后，技能内部按 `pre → plan → code → achieve` 顺序执行。四个命令是内部阶段，不可独立调用。

### 1.2 目标

- 将 4 个阶段拆分为**独立可调用的 Stage Skill**
- 建立 **ECD Core** 公共层，避免 4 个 Skill 重复维护
- 用 **Artifact 驱动**替代状态标记判断阶段进度
- 保持对原有 `/ecd` 用户的兼容

### 1.3 范围

- **修改范围**：仅 `skills/ecd-next/`，不动原版 `skills/ecd/`
- **新建 6 个文件**：1 Core + 4 Stage Skill + 1 兼容入口
- **继承资源**：scripts、templates、schemas、references、docs、agents 从原版完整复制

---

## 2. 目录结构

```
skills/ecd-next/                     ← 新版根目录，完全自包含
│
├── SKILL.md                         ← /ecd-next 兼容入口
│
├── ecd-pre/SKILL.md                 ← /ecd-pre
├── ecd-plan/SKILL.md                ← /ecd-plan
├── ecd-code/SKILL.md                ← /ecd-code
├── ecd-achieve/SKILL.md             ← /ecd-achieve
│
├── shared/
│   └── ecd-core.md                  ← 公共层（纯规范文档，不是 Skill）
│
├── scripts/                         ← 从原版完整复制
│   ├── ecd.py
│   ├── validate_ecl_bundle.py
│   ├── render_code_run.py
│   ├── render_achieve_note.py
│   ├── scaffold_case_json.py
│   ├── render_canvas.py
│   ├── render_obsidian_bundle.py
│   └── render_openspec_pack.py
│
├── templates/                       ← 从原版完整复制
├── schemas/                         ← 从原版完整复制
├── references/                      ← 从原版完整复制
├── docs/                            ← 从原版完整复制 + 新增 specs/
│   └── specs/
│       └── 2026-06-17-ecd-architecture-v2-design.md
└── agents/                          ← 从原版完整复制
```

**设计约束**：
- 所有文件引用使用相对路径，对外部 `skills/ecd/` **零依赖**
- `shared/ecd-core.md` 不被 Claude Code 自动发现为 Skill（不在子目录根，无 SKILL.md 文件名）

---

## 3. ECD Core 设计

`shared/ecd-core.md` 是纯规范文档，4 个 Stage Skill 启动时用 `Read` 按需加载其中段落。

### 3.1 模块 1：Artifact 目录规范

```
.ecd/                          ← 项目根目录下固定路径
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

### 3.2 模块 2：复杂度分类器

保留 v1.1 的三问定级，由 ecd-pre 调用，结果写入 `00-overview.md`：

| 问题 | L1 (轻量) | L2 (标准) | L3 (重量) |
|------|-----------|-----------|-----------|
| Q1 代码影响面 | ≤3 文件 | 4-10 文件 | >10 文件 |
| Q2 安全/正确性风险 | UI样式/文案/排版 | 功能逻辑/API | 数据丢失/认证/支付/PII |
| Q3 需求清晰度 | 明确无歧义 | 部分细节待定 | 模糊 → 强制 L3 |

`最终等级 = max(Q1, Q2, Q3)`，Q3 模糊时强制 L3。

### 3.3 模块 3：阶段门控规则

| 命令 | 门控检查 | 缺失时行为 |
|------|---------|-----------|
| `/ecd-pre` | 无 | 直接启动 |
| `/ecd-plan` | `.ecd/pre/00-overview.md` 存在？ | 阻塞："请先执行 /ecd-pre" |
| `/ecd-code` | `.ecd/plan/90-code-handoff.md` 存在？ | 阻塞："请先执行 /ecd-plan" |
| `/ecd-achieve` | `.ecd/code/runs/` 至少一个 run？ | 阻塞："请先执行 /ecd-code" |

### 3.4 模块 4：共享工具映射

| ECD 需求 | Claude Code 工具 |
|----------|-----------------|
| 独立子 Agent (D/G/H/J) | `Agent` 工具 |
| 进度跟踪 | `TaskCreate` / `TaskUpdate` |
| CLI 脚本和验证 | `Bash` + `../scripts/*.py` |
| 仓库探索 | `Read` / `Glob` / `Grep` / `codegraph_*` |
| 代码修改 | `Edit` / `Write` |
| 结构化审批 | `EnterPlanMode` / `ExitPlanMode` |

### 3.5 模块 5：输出格式规范

- 所有产物为 Markdown，UTF-8 无 BOM
- 文件编号规则：`00-` 概览类、`05-` 约束类、`90-` 交接类、`03-` 验收类
- Bundle 校验命令：`python ../scripts/validate_ecl_bundle.py .ecd/`

---

## 4. Stage Skills 设计

### 4.1 `/ecd-pre` — 需求与约束提取

- **加载**：Core 的模块 2（分类器）
- **职责**：质疑澄清 → 分类定级 → 冻结审批目标
- **门控**：无前置要求
- **流程**：
  1. 探查仓库（Glob/Grep/codegraph），回答三问，输出等级
  2. L1 → A-Lite（最多 3 反问）；L2/L3 → A-Full（深度质疑 + 方案发散）
  3. 用户批准后写入 `.ecd/pre/`（00-overview.md、05-constraint-ledger.md、可选的 case.json）
- **输出**：告知用户下一步 `/ecd-plan`

### 4.2 `/ecd-plan` — 架构与任务拆解

- **加载**：Core 的模块 3（门控规则）
- **职责**：收敛需求 → 生成 code-ready 交接包
- **门控**：`.ecd/pre/00-overview.md` 必须存在
- **流程**：
  1. 读取 `.ecd/pre/` 全部产物
  2. L1 → J-Lite；L2 → C→D(可选)→E(精简)→H(可选)→J；L3 → 完整 10 阶段
  3. 写入 `.ecd/plan/`（90-code-handoff.md 为主，伴侣文档按需）
- **输出**：告知用户下一步 `/ecd-code`

### 4.3 `/ecd-code` — 实现与测试

- **加载**：Core 的模块 3（门控规则）
- **职责**：严格按交接包执行编码，不发明产品语义
- **门控**：`.ecd/plan/90-code-handoff.md` 必须存在
- **流程**：
  1. 分配 run-id（001, 002...）
  2. 按实现单元顺序执行，每个单元完成后验证
  3. 写入 `.ecd/code/runs/<id>/`（00-code-run.md、01-verification.md）
  4. 遇歧义：写 02-reentry.md，阻塞不猜
- **输出**：告知用户下一步 `/ecd-achieve`

### 4.4 `/ecd-achieve` — 验收与复盘

- **加载**：Core 的模块 3（门控规则）
- **职责**：基于证据判定验收，决定归档或重开
- **门控**：`.ecd/code/runs/` 至少一次运行
- **流程**：
  1. 运行 `python ../scripts/validate_ecl_bundle.py .ecd/`
  2. 逐项检查 90-code-handoff.md 的验收清单
  3. 检查首次打开体验
  4. 写入 `.ecd/achieve/03-achieve.md`，判定：`archived | achieved_with_followups | not_achieved`

### 4.5 `/ecd-next` — 兼容入口

- **职责**：传统一键式体验，扫描 `.ecd/` 自动路由
- **流程**：
  1. 扫描 `.ecd/` 目录状态
  2. 无 bundle → 等同 `/ecd-pre`
  3. 有 pre 无 plan → 等同 `/ecd-plan`
  4. 有 plan 无 run → 等同 `/ecd-code`
  5. 有待验收 run → 等同 `/ecd-achieve`
  6. 用户可显式覆盖路由

---

## 5. 安装与调用

### 5.1 调用映射

| 用户输入 | 加载文件 | 相对路径 |
|---------|---------|---------|
| `/ecd-next` | `SKILL.md` | `ecd-next/SKILL.md` |
| `/ecd-pre` | `ecd-pre/SKILL.md` | `ecd-next/ecd-pre/SKILL.md` |
| `/ecd-plan` | `ecd-plan/SKILL.md` | `ecd-next/ecd-plan/SKILL.md` |
| `/ecd-code` | `ecd-code/SKILL.md` | `ecd-next/ecd-code/SKILL.md` |
| `/ecd-achieve` | `ecd-achieve/SKILL.md` | `ecd-next/ecd-achieve/SKILL.md` |

### 5.2 安装

```powershell
New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\skills\ecd-next" `
    -Target "D:\11aagit\控制论skill\NewSkills\ecd\skills\ecd-next" -Force
```

Claude Code 递归扫描 `ecd-next/` 下所有子目录中的 `SKILL.md`，自动发现 5 个技能（1 兼容入口 + 4 Stage）。

### 5.3 与原版共存

```
/ecd          ← 原版（插件安装，不动）
/ecd-next     ← 新版兼容入口
/ecd-pre      ← 新版 Stage Skill
/ecd-plan     ← 新版 Stage Skill
/ecd-code     ← 新版 Stage Skill
/ecd-achieve  ← 新版 Stage Skill
```

---

## 6. 对比总结

| | 原版 (ecd) | 新版 (ecd-next) |
|---|-----------|----------------|
| 入口数 | 1 | 5（+4 独立阶段） |
| 阶段调用 | 必须顺序 | 可独立，可一键 |
| 状态管理 | 隐式（case.json 字段） | 显式（Artifact 文件） |
| 公共层 | 无（所有规则在同一个 SKILL.md） | Core（5 个模块共享） |
| 单个 SKILL.md 大小 | ~425 行 | 各 ~80 行 + Core ~200 行 |
| 扩展性 | 添加阶段需改主文件 | 新增 Stage Skill 文件即可 |
| 安装 | 插件系统 | 手动 Junction |

---

## 7. 自审清单

- [x] 无占位符或 TBD
- [x] 各节之间无矛盾
- [x] 范围明确（仅 ecd-next，不动原版）
- [x] 前置依赖清楚（每个 Stage 的门控规则）
- [x] 安装方式明确
