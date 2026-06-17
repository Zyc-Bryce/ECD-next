#!/usr/bin/env node

/**
 * ECD-next v2 — npx 一键安装脚本
 *
 * 用法:
 *   npx @zyc-bryce/ecd-next
 *
 * 自动在 Claude Code 的 settings.json 中注册 ECD-next marketplace 并启用插件。
 * 安装后可用命令: /ecd-next /ecd-pre /ecd-plan /ecd-code /ecd-achieve
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ── 版本号 ────────────────────────────────────────────
const PKG_VERSION = (() => {
  try {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    return JSON.parse(fs.readFileSync(pkgPath, 'utf-8')).version || 'unknown';
  } catch (_) {
    return 'unknown';
  }
})();

// ── 配置 ──────────────────────────────────────────────
const MARKETPLACE_NAME = 'ecd-next-marketplace';
const MARKETPLACE_SOURCE = { source: 'github', repo: 'Zyc-Bryce/ECD-next' };
const PLUGIN_KEY = 'ecd-next@ecd-next-marketplace';

// ── helpers ───────────────────────────────────────────
function settingsPath() {
  const home = os.homedir();
  return path.join(home, '.claude', 'settings.json');
}

function skillsDir() {
  const home = os.homedir();
  return path.join(home, '.claude', 'skills');
}

function readSettings(filePath) {
  if (!fs.existsSync(filePath)) return {};
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) || {};
  } catch (e) {
    console.error('❌ 读取 settings.json 失败:', e.message);
    console.error('   文件路径:', filePath);
    console.error('   请检查文件是否为合法 JSON。');
    process.exit(1);
  }
}

function writeSettings(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

/** 递归复制目录 */
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ── uninstall ────────────────────────────────────────
function uninstall() {
  const header = `
  ╔══════════════════════════════════════════════╗
  ║     ECD-next v${PKG_VERSION} — 卸载               ║
  ║     Evolutionary Constraint Development       ║
  ╚══════════════════════════════════════════════╝

  正在移除 ECD-next 配置和技能文件…
  `;
  console.log(header);

  const filePath = settingsPath();
  console.log('  📁 settings.json: %s\n', filePath);

  const settings = readSettings(filePath);

  let changed = false;

  // 移除 marketplace 注册
  if (settings.extraKnownMarketplaces && settings.extraKnownMarketplaces[MARKETPLACE_NAME]) {
    delete settings.extraKnownMarketplaces[MARKETPLACE_NAME];
    if (Object.keys(settings.extraKnownMarketplaces).length === 0) {
      delete settings.extraKnownMarketplaces;
    }
    console.log('  ✅ 已移除 marketplace: ecd-next-marketplace');
    changed = true;
  } else {
    console.log('  ⏭️  marketplace 不存在，跳过');
  }

  // 禁用插件
  if (settings.enabledPlugins && settings.enabledPlugins[PLUGIN_KEY]) {
    delete settings.enabledPlugins[PLUGIN_KEY];
    if (Object.keys(settings.enabledPlugins).length === 0) {
      delete settings.enabledPlugins;
    }
    console.log('  ✅ 已禁用插件: ecd-next@ecd-next-marketplace');
    changed = true;
  } else {
    console.log('  ⏭️  插件未启用，跳过');
  }

  // 移除直接安装的技能文件
  const destSkillsDir = skillsDir();
  const subSkills = ['ecd-next', 'ecd-pre', 'ecd-plan', 'ecd-code', 'ecd-achieve'];
  let filesRemoved = 0;
  for (const skill of subSkills) {
    const skillDir = path.join(destSkillsDir, skill);
    if (fs.existsSync(skillDir)) {
      fs.rmSync(skillDir, { recursive: true, force: true });
      console.log(`  ✅ 已删除技能目录: ${skill}`);
      filesRemoved++;
    }
  }
  // 移除 shared 模块（仅在未被其他技能使用时）
  const sharedDir = path.join(destSkillsDir, 'shared');
  if (fs.existsSync(sharedDir)) {
    fs.rmSync(sharedDir, { recursive: true, force: true });
    console.log('  ✅ 已删除共享模块: shared/');
    filesRemoved++;
  }
  if (filesRemoved > 0) {
    changed = true;
  }

  if (changed) {
    writeSettings(filePath, settings);
    console.log('\n  💾 已保存 settings.json');
  } else {
    console.log('\n  ℹ️  未找到 ECD-next 配置，无需操作');
  }

  console.log(`
  ┌──────────────────────────────────────────────┐
  │  🧹 ECD-next v${PKG_VERSION} 卸载完成            │
  │                                              │
  │  已移除所有技能文件和 marketplace 配置         │
  │  重启 Claude Code 后生效                      │
  │                                              │
  │  如需重新安装：                                │
  │  npx @zyc-bryce/ecd-next                     │
  │                                              │
  │  文档：https://github.com/Zyc-Bryce/ECD-next  │
  └──────────────────────────────────────────────┘
  `);
}

// ── main ──────────────────────────────────────────────
function main() {
  if (process.argv.includes('--uninstall') || process.argv.includes('-u')) {
    uninstall();
    process.exit(0);
  }

  const header = `
  ╔══════════════════════════════════════════════╗
  ║     ECD-next — 演进约束开发        v${PKG_VERSION}     ║
  ║     Evolutionary Constraint Development       ║
  ╚══════════════════════════════════════════════╝

  正在配置 Claude Code 插件…

  安装后可用命令:
    /ecd-next     — 一键式全流程（自动路由）
    /ecd-pre      — 需求与约束提取
    /ecd-plan     — 架构与任务拆解
    /ecd-code     — 实现与测试
    /ecd-achieve  — 验收与复盘
  `;
  console.log(header);

  const filePath = settingsPath();
  console.log('  📁 settings.json: %s\n', filePath);

  const settings = readSettings(filePath);

  let changed = false;

  // ── Step 1: 注册 marketplace ──
  if (!settings.extraKnownMarketplaces) {
    settings.extraKnownMarketplaces = {};
  }
  if (!settings.extraKnownMarketplaces[MARKETPLACE_NAME]) {
    settings.extraKnownMarketplaces[MARKETPLACE_NAME] = {
      source: MARKETPLACE_SOURCE,
    };
    console.log('  ✅ 已注册 marketplace: ecd-next-marketplace (github.com/Zyc-Bryce/ECD-next)');
    changed = true;
  } else {
    console.log('  ⏭️  marketplace 已存在，跳过');
  }

  // ── Step 2: 启用插件 ──
  if (!settings.enabledPlugins) {
    settings.enabledPlugins = {};
  }
  if (!settings.enabledPlugins[PLUGIN_KEY]) {
    settings.enabledPlugins[PLUGIN_KEY] = true;
    console.log('  ✅ 已启用插件: ecd-next@ecd-next-marketplace');
    changed = true;
  } else {
    console.log('  ⏭️  插件已启用，跳过');
  }

  // ── Step 3: 直接复制技能文件到 ~/.claude/skills/ ──
  // 这样即使 GitHub 不可达（国内网络），技能也能立即可用
  const pkgRoot = path.join(__dirname, '..');
  const pkgSkillsDir = path.join(pkgRoot, 'skills');
  const pkgSharedDir = path.join(pkgRoot, 'shared');
  const destSkillsDir = skillsDir();

  const subSkills = ['ecd-next', 'ecd-pre', 'ecd-plan', 'ecd-code', 'ecd-achieve'];

  if (fs.existsSync(pkgSkillsDir)) {
    let skillsCopied = 0;

    for (const skill of subSkills) {
      const src = path.join(pkgSkillsDir, skill);
      const dest = path.join(destSkillsDir, skill);
      if (fs.existsSync(src)) {
        copyDirectory(src, dest);
        // 修正 shared/ 引用路径：
        //   原始: ../../shared/ecd-core.md  (skills/<name>/SKILL.md → 包根/shared/)
        //   目标: ../shared/ecd-core.md     (.claude/skills/<name>/SKILL.md → .claude/skills/shared/)
        const skillMd = path.join(dest, 'SKILL.md');
        if (fs.existsSync(skillMd)) {
          let content = fs.readFileSync(skillMd, 'utf-8');
          content = content.replace(/\.\.\/\.\.\/shared\//g, '../shared/');
          fs.writeFileSync(skillMd, content, 'utf-8');
        }
        console.log(`  ✅ 已安装技能: /${skill}`);
        skillsCopied++;
      }
    }

    // 安装 shared 共享模块
    if (fs.existsSync(pkgSharedDir)) {
      const sharedDest = path.join(destSkillsDir, 'shared');
      copyDirectory(pkgSharedDir, sharedDest);
      console.log('  ✅ 已安装共享模块: shared/ecd-core.md');
    }

    if (skillsCopied > 0) {
      changed = true;
    }
  } else {
    console.log('  ⚠️  未找到 skills/ 目录，跳过直接复制（将依赖 marketplace 下载）');
  }

  // ── Step 4: 写入 settings.json ──
  if (changed) {
    writeSettings(filePath, settings);
    console.log('\n  💾 已保存 settings.json');
  } else {
    console.log('\n  ℹ️  配置已是最新，无需修改');
  }

  console.log(`
  ┌──────────────────────────────────────────────┐
  │  🎉 ECD-next v${PKG_VERSION} 安装完成！          │
  │                                              │
  │  重启 Claude Code 后可用命令：                   │
  │     /ecd-next     一键式全流程                  │
  │     /ecd-pre      需求与约束提取                │
  │     /ecd-plan     架构与任务拆解                │
  │     /ecd-code     实现与测试                   │
  │     /ecd-achieve  验收与复盘                   │
  │                                              │
  │  卸载：                                      │
  │  npx @zyc-bryce/ecd-next --uninstall         │
  │                                              │
  │  文档：https://github.com/Zyc-Bryce/ECD-next  │
  └──────────────────────────────────────────────┘
  `);
}

main();
