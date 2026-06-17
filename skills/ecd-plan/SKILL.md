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

用 `Read` 加载 `../../shared/ecd-core.md` 中的以下模块：
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
- 详见 `../../references/stage-playbook.md` 和 `references/subagent-protocol.md`

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
