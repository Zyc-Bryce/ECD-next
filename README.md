# Evolutionary Constraint Development v2

[简体中文](README.zh-CN.md) | English

<div align="center">

**Freeze product meaning first, then deliver through a constrained pre-plan-code-achieve loop.**

![Claude Code](https://img.shields.io/badge/Claude_Code-Skill-412991?style=flat-square)
![Version](https://img.shields.io/badge/version-2.0-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)

**🏗️ ECD Core + 4 Stage Skills — Extensible Workflow Framework**

</div>

## What is ECD v2?

ECD v2 is a Claude Code skill that converts vague requirements into running, tested code through a strict `pre → plan → code → achieve` closed loop. v2 introduces **independent stage commands** and an **artifact-driven workflow**.

## Five Commands

| Command | Role |
|---------|------|
| `/ecd-next` | One-click entry — scans `.ecd/` and auto-routes |
| `/ecd-pre` | Requirements & constraint extraction |
| `/ecd-plan` | Architecture & task breakdown |
| `/ecd-code` | Implementation & testing |
| `/ecd-achieve` | Acceptance & review |

## Quick Install

```bash
npx @zyc-bryce/ecd-next
```

Restart Claude Code. All 5 commands available.

## Architecture

```
ecd-next/
├── SKILL.md                ← /ecd-next entry point
├── ecd-pre/SKILL.md        ← /ecd-pre
├── ecd-plan/SKILL.md       ← /ecd-plan
├── ecd-code/SKILL.md       ← /ecd-code
├── ecd-achieve/SKILL.md    ← /ecd-achieve
└── shared/
    └── ecd-core.md         ← Shared spec layer
```

## License

MIT
