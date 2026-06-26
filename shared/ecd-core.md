# ECD Core — 公共层规范

> 本文件是 ECD v2 的公共规范层。4 个 Stage Skill 启动时用 `Read` 工具按需加载对应模块。
> 本文件不是 Skill——Claude Code 不会自动发现它。

---

## 模块 1：Artifact 目录规范

所有 ECD 阶段产物写入项目根目录下的 `.ecd/`。**采用 case 隔离结构**——每次 ECD 流程为一个独立 case，避免跨 case 产物混杂。

```
.ecd/
  current                       ← 纯文本文件，内容为活跃 case 的 slug（无活跃 case 时为空或不存在）
  .gitignore                    ← 建议内容: cases/\narchive/

  cases/
    <case-slug>/                ← 每个 case 独立子树（slug 格式见模块 6）
      pre/                      ← ecd-pre 写入
        00-overview.md
        05-constraint-ledger.md
        case.json               ← L2/L3

      plan/                     ← ecd-plan 写入
        90-code-handoff.md      ← L1/L2/L3 均生成
        91-canonical-contracts.md ← L2/L3
        95-execution-manifest.md  ← L2/L3（L2 含批次与顺序附节）

        -- 以下仅 L3 生成 --
        92-constraint-crosswalk.md
        93-dependency-graph.md
        96-code-batches.md

      code/                     ← ecd-code 写入
        runs/
          <run-id>/             ← 每次运行一个子目录（001, 002...，每个 case 从 001 开始）
            00-code-run.md      ← 运行记录（修订运行标注 revision-of）
            01-verification.md  ← 验证结果
            02-reentry.md       ← （可选）中断重入标记
            03-revision.md      ← （修订运行时）修订说明

      achieve/                  ← ecd-achieve 写入
        03-achieve.md           ← 验收判定

  archive/                      ← 已完成的 case（achieve 判定 archived 后移入）
    <case-slug>/                ← 完整 case 子树原样保留
```

**活跃 case 定位**：所有阶段启动时先读 `.ecd/current` 获取活跃 case slug，拼接路径 `.ecd/cases/<slug>/` 定位产物。

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

> 所有路径相对于活跃 case 目录 `.ecd/cases/<slug>/`。先读 `.ecd/current` 获取 `<slug>`。

| 命令 | 门控检查 | 缺失时行为 |
|------|---------|-----------|
| `/ecd-pre` | `.ecd/current` 不存在或为空？→ 直接启动新 case | 无阻塞。若 `.ecd/current` 已有活跃 case → 警告用户存在未完成 case，由用户选择继续或放弃 |
| `/ecd-plan` | `cases/<slug>/pre/00-overview.md` 存在？ | 阻塞："未找到 pre 产物，请先执行 `/ecd-pre`" |
| `/ecd-code` | `cases/<slug>/plan/90-code-handoff.md` 存在？ | 阻塞："未找到 plan 交接包，请先执行 `/ecd-plan`" |
| `/ecd-code` (修订) | `cases/<slug>/plan/90-code-handoff.md` 存在 + 上次 run 已完成 | 交接包完好，可直接修订。修订范围不得超出原交接包边界。超出 → 提示先执行 `/ecd-pre`。最多 3 轮修订 |
| `/ecd-achieve` | `cases/<slug>/code/runs/` 至少一个 run？ | 阻塞："未找到 code 运行记录，请先执行 `/ecd-code`" |

**artifact 自动发现逻辑**：

1. 读取 `.ecd/current` 获取活跃 case slug
2. 检查 `cases/<slug>/` 下各子目录（pre/ plan/ code/runs/ achieve/）
3. 根据已有产物判断当前可执行的阶段
4. 无需用户手动指定路径

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
- Bundle 校验命令：`python scripts/validate_ecl_bundle.py .ecd/cases/<slug>/`
- 脚本路径：相对于 `ecd-next/` 根目录，如 `python scripts/ecd.py pre --request "..." --output .ecd/pre`

---

## 模块 6：Case 生命周期

### Case Slug 格式

```
<YYYYMMDD>-<kebab-desc>-<4char-hex>
```

- **日期**：pre 启动日期（`20260626`）
- **描述**：从 `00-overview.md` 标题提取，kebab-case，最长 30 字符（`empty-tray-out`）
- **随机后缀**：4 位 hex，防同日同描述碰撞（`a3f2`）

示例：`20260626-empty-tray-out-a3f2`

### 活跃 Case 管理

- `.ecd/current`：纯文本文件，存储活跃 case slug。**一行，无换行，无空格**。
- 每个阶段启动时第一步：`Read .ecd/current` → 拼接 `cases/<slug>/` 定位产物。
- `.ecd/current` 不存在或为空 → 只有 `/ecd-pre` 可执行（创建新 case），其他阶段阻塞。

### 孤儿 Case 检测

`/ecd-pre` 启动时：
1. 检查 `.ecd/current` 是否存在且非空
2. 若已有活跃 case → **警告用户**："检测到未完成 case `<slug>`。请选择：A) 继续当前 case B) 放弃并开始新 case"
3. 选择 B → 旧 case 移到 `archive/`（标记为 `not_achieved`），创建新 case
4. 选择 A → 拒绝新建，提示用户执行对应阶段继续

### Archive 规则（ecd-achieve 执行）

| 判定 | 动作 | `.ecd/current` |
|------|------|----------------|
| `archived` | `Move-Item cases/<slug> archive/<slug>` | 清空（写入空字符串） |
| `achieved_with_followups` | case 保持活跃。`03-achieve.md` 记录遗留项清单。用户可执行 `/ecd-code` 继续修订 | 保持不变 |
| `not_achieved` | case 保持活跃。等待重新编码 | 保持不变 |

### Run-id 作用域

- 每个 case 独立编号，从 `001` 开始
- 修订运行递增：`002`, `003`...
- 新 case → run-id 重置为 `001`

### .gitignore 建议

`.ecd/` 根目录下创建 `.gitignore`：
```
cases/
archive/
```
保留 `.ecd/current` 可被 git 追踪，让团队知晓当前活跃 case。

### 迁移说明

旧版平铺 `.ecd/`（pre/ plan/ code/ achieve/ 直接在 `.ecd/` 下）不再使用。首次运行新版 `/ecd-pre` 时自动创建 case 目录结构。旧产物可手动删除或移入 `archive/legacy/`。
