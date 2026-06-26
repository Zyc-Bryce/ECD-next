---
name: ecd-plan
description: ECD 阶段 2：收敛需求，生成 code-ready 交接包。读取 pre 阶段的审批目标，拆解需求、验证依赖、编译交接。触发词：架构设计、任务拆解、交接包、plan。
---

# ECD-PLAN：架构与任务拆解

你是 ECD 工作流的第二阶段。你的职责是**收敛需求，冻结代码就绪的交接包**。

## 启动流程

### 1. Artifact 门控

读取 `.ecd/current` 获取活跃 case slug `<slug>`。

检查 `.ecd/cases/<slug>/pre/00-overview.md` 是否存在。

- **不存在** → 阻塞，输出：
  > "未找到 case `<slug>` 的 pre 产物，请先执行 `/ecd-pre` 完成需求澄清和审批。"
- **存在** → 继续。

### 2. 加载前置产物

用 `Read` 读取 `.ecd/cases/<slug>/pre/` 下全部产物（00-overview.md、05-constraint-ledger.md、case.json 如存在）。从中获取等级信息。

### 3. 加载 Core 规范

用 `Read` 加载 `../../shared/ecd-core.md` 中的以下模块：
- **模块 1：Artifact 目录规范**（plan 产物规格）
- **模块 3：阶段门控规则**
- **模块 4：共享工具映射**
- **模块 6：Case 生命周期**（路径拼接规则）

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
- **产物**：90-code-handoff.md + 91-canonical-contracts.md + 95-execution-manifest.md（3 个文件）
  - 92（约束映射）的内容合并到 90 §"约束落实" 附节
  - 96（分批计划）的内容合并到 95 §"批次与顺序" 附节

**L3：完整 10 阶段**
- C → D → E → F → G → H → J
- D/G/H/J 必须使用 `Agent` 工具启动独立子 Agent
- 详见 `../../references/stage-playbook.md` 和 `references/subagent-protocol.md`
- **产物**：90 + 91 + 92 + 93 + 95 + 96（6 个文件）
  - 92-constraint-crosswalk.md — 约束映射表（Pre→Plan 约束逐条落实）
  - 93-dependency-graph.md — 依赖拓扑图（实现单元间的依赖关系图）
  - 96-code-batches.md — 分批计划（>1 批时的批次与依赖）

### 5. 写入产物（按等级）

创建 `.ecd/cases/<slug>/plan/` 并按等级写入：

**L1**（仅 1 个文件）：
```
.ecd/cases/<slug>/plan/
  90-code-handoff.md         ← 交接包（code 唯一入口）
```

**L2**（3 个文件）：
```
.ecd/cases/<slug>/plan/
  90-code-handoff.md         ← 交接包（含"约束落实"附节，合并 92 功能）
  91-canonical-contracts.md  ← 接口契约
  95-execution-manifest.md   ← 执行清单（含"批次与顺序"附节，合并 96 功能）
```

**L3**（6 个文件）：
```
.ecd/cases/<slug>/plan/
  90-code-handoff.md         ← 交接包
  91-canonical-contracts.md  ← 接口契约
  92-constraint-crosswalk.md ← 约束映射表
  93-dependency-graph.md     ← 依赖拓扑图
  95-execution-manifest.md   ← 执行清单
  96-code-batches.md         ← 分批计划
```

`90-code-handoff.md` **必须冻结**（code 阶段不可自行决定）：
- 产品是什么/不是什么
- 仓库目标和仓库落地事实
- 用户可见工作流和状态覆盖（加载/成功/失败/空/边缘）
- 领域对象和数据结构（JSON schema / DTO 字段定义 / 枚举值）
- 接口契约（API endpoint、request/response 结构、错误码语义）
- 实现单元及其顺序和依赖关系
- 验证命令和验收检查项
- 什么会触发流程重开

`90-code-handoff.md` **不得冻结**（留给 code 阶段根据仓库实际情况自行选择）：
- 具体 UI 组件选择（el-input vs VolForm / Ant Design vs Element Plus）
- CSS 样式 / DOM 结构 / 布局方案
- 完整的 VUE/React 代码模板
- 具体 i18n key 列表（**只声明**"需要 i18n 的页面/组件"，**不枚举**具体 key）
- 框架 API 选择（Composition API vs Options API）

### 6. 输出

告知用户：**"交接包已冻结（case: `<slug>`）。请执行 `/ecd-code` 开始编码实现。"**

## 反模式

- ❌ 不重新打开 pre 已批准的产品决策
- ❌ 不给 code 留下需要发明产品语义的缺口
- ❌ L3 时不跳过强制子 Agent 阶段
- ❌ 不预生成 i18n key 列表——只声明需要 i18n 的页面/组件，code 阶段按需添加
- ❌ 不提供完整 UI 代码模板——冻结契约和数据结构，不冻结具体组件选择
