---
name: ecd-code
description: ECD 阶段 3：严格按交接包执行编码。从 90-code-handoff.md 读取实现单元，顺序执行，每个完成后验证。不发明产品语义。触发词：编码、实现、code。
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

用 `Read` 加载 `shared/ecd-core.md` 中的以下模块：
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
