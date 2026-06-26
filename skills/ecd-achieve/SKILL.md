---
name: ecd-achieve
description: ECD 阶段 4：基于证据判定验收结果。验证 bundle 完整性、检查验收清单、判断首次打开体验，决定归档还是重开。触发词：验收、验证、achieve、复盘。
---

# ECD-ACHIEVE：验收与复盘

你是 ECD 工作流的第四阶段。你的职责是**基于证据判定验收结果，决定归档还是重开**。

## 启动流程

### 1. Artifact 门控

读取 `.ecd/current` 获取活跃 case slug `<slug>`。

检查 `.ecd/cases/<slug>/code/runs/` 是否至少有一次运行记录。

- **不存在** → 阻塞，输出：
  > "未找到 case `<slug>` 的 code 运行记录，请先执行 `/ecd-code` 完成编码实现。"
- **存在** → 继续。

### 2. 加载前置产物

用 `Read` 读取：
- `.ecd/cases/<slug>/plan/90-code-handoff.md`（验收清单）
- `.ecd/cases/<slug>/code/runs/<latest-run>/00-code-run.md`
- `.ecd/cases/<slug>/code/runs/<latest-run>/01-verification.md`
- `.ecd/cases/<slug>/code/runs/<latest-run>/03-revision.md`（如存在，了解修订上下文）

### 3. 加载 Core 规范

用 `Read` 加载 `../../shared/ecd-core.md` 中的以下模块：
- **模块 3：阶段门控规则**
- **模块 5：输出格式规范**（校验命令）
- **模块 6：Case 生命周期**（归档规则、followups 规则）

### 4. 执行验收

**必须验证全部：**
1. 运行 `python ../../scripts/validate_ecl_bundle.py .ecd/cases/<slug>/` — 必须通过
2. 运行 `90-code-handoff.md` 中指定的测试/构建检查
3. 逐项检查 `90-code-handoff.md` 的验收检查清单
4. 检查首次打开体验——没有明显布局或交互损坏
5. 如有 `revision-of` 标注：确认修订链完整，每轮修订原因均已记录在对应的 `03-revision.md`

**归档动作（根据判定执行）**：

| 判定 | 动作 |
|------|------|
| `archived` | `Move-Item .ecd/cases/<slug> .ecd/archive/<slug>`，然后清空 `.ecd/current` |
| `achieved_with_followups` | case 保持活跃。在 `03-achieve.md` 中明确列出遗留项清单和责任人。**告知用户**："遗留项可在 `/ecd-code` 修订轮次中处理，或新建 case 单独追踪" |
| `not_achieved` | case 保持活跃。`.ecd/current` 不变。**告知用户**具体未通过的验收项，建议重新执行 `/ecd-code` |

### 5. 写入产物

```
.ecd/cases/<slug>/achieve/
  03-achieve.md              ←   验收判定
```

**判定：**
- `archived` — 全部通过，归档关闭
- `achieved_with_followups` — 主体通过，有低影响遗留项
- `not_achieved` — 验收失败，保持打开

验收失败的运行必须保持打开，不可伪装为干净关闭。

### 6. 输出

告知用户最终判定结果和 case slug。如为 `archived`，告知 case 已归档至 `archive/<slug>/`。如为 `not_achieved`，指明哪些验收项未通过。如为 `achieved_with_followups`，列出遗留项。

## 反模式

- ❌ 不以"看着还行"代替证据
- ❌ 不跳过 bundle 校验
- ❌ 不把验收失败标记为 archived
