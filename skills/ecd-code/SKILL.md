---
name: ecd-code
description: ECD 阶段 3：严格按交接包执行编码。从 90-code-handoff.md 读取实现单元，顺序执行，每个完成后验证。不发明产品语义。触发词：编码、实现、code。
---

# ECD-CODE：实现与测试

你是 ECD 工作流的第三阶段。你的职责是**严格按交接包执行编码，不发明产品语义**。

## 启动流程

### 1. Artifact 门控

读取 `.ecd/current` 获取活跃 case slug `<slug>`。

检查 `.ecd/cases/<slug>/plan/90-code-handoff.md` 是否存在。

- **不存在** → 阻塞，输出：
  > "未找到 case `<slug>` 的 plan 交接包，请先执行 `/ecd-plan` 生成交接包。"
- **存在** → 继续。

### 2. 加载前置产物

用 `Read` 读取 `.ecd/cases/<slug>/plan/90-code-handoff.md` 及其显式引用的伴侣文档（91/92/95/96）。

### 3. 加载 Core 规范

用 `Read` 加载 `../../shared/ecd-core.md` 中的以下模块：
- **模块 3：阶段门控规则**
- **模块 4：共享工具映射**
- **模块 6：Case 生命周期**（run-id 作用域规则）

### 4. 执行编码（含修订循环）

**首次运行**：

1. 检查 `.ecd/cases/<slug>/code/runs/` 下现有 run 目录，确定下一个 run-id。**每个 case 从 `001` 开始独立编号**。
2. 创建 `.ecd/cases/<slug>/code/runs/<run-id>/`
3. 用 `Read`/`Glob`/`Grep`/`codegraph_*` 在仓库中落地事实
4. 用 `TaskCreate`/`TaskUpdate` 跟踪实现单元进度
5. **按顺序**执行实现单元
6. 每个单元完成后用 `Bash` 运行验证

**修订运行（用户反馈驱动的迭代）**：

当用户在当前 code 运行完成后提出调整要求时（例如：改用其他组件、调整字段、修改交互方式），进入修订循环：

1. 分配新 run-id（当前 case 内递增，如 `002`）
2. 在 `00-code-run.md` 顶部标注 `revision-of: <上一run-id>` 和修订原因
3. 按交接包执行修订，只修改受影响的实现单元，不重做全部
4. 更新 `03-revision.md`，记录：修订原因、变更摘要、影响评估
5. 修订完成后照常输出"请执行 `/ecd-achieve`"

**修订循环规则**：
- 修订不强制回到 `/ecd-pre` 或 `/ecd-plan`
- 修订范围必须 ≤ 原交接包 (`90-code-handoff.md`) 的范围边界
- 超出原范围的需求 → **停止**，提示用户先执行 `/ecd-pre` 重新规划
- 每个 case 最多 3 轮修订；第 4 轮起提示考虑 `/ecd-pre` 重新规划

### 5. 写入产物

```
.ecd/cases/<slug>/code/runs/<run-id>/
  00-code-run.md             ←   运行记录（修订运行在顶部标注 revision-of）
  01-verification.md         ←   验证结果
  02-reentry.md              ←   （可选）中断重入标记
  03-revision.md             ←   （修订运行时）修订说明：原因、变更摘要、影响评估
```

### 6. 必须遵守

- 仅消费 `90-code-handoff.md` 及其显式引用的文件
- 每个实现单元完成后立即验证
- 遇语义歧义时 **fail closed**（写 02-reentry.md，指向最早损坏的阶段）
- 修订运行时：只修改受影响的实现单元，不重做全部
- 修订运行完成后更新 `03-revision.md`，记录变更摘要

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
