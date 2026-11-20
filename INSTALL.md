# 安装与排查

## 1. 插件管理器（推荐）

1. 打开 DSH 的 **插件** 页。
2. 点 **添加插件**，选择本目录（包含 `package.json` 与 `cordis.patch.yml` 的那一层）。
3. 装好后重启 dsh web / 桌面端，刷新页面。
4. 设置页里应出现 **「JARVIS 开机序列」**。

## 2. 命令行

```bash
# web profile
dsh plugin --profile web add /绝对路径/jarvis_start_up

# 桌面端
dsh plugin --profile desktop add /绝对路径/jarvis_start_up
```

部分 DSH 版本会拒绝在终端里操作 `desktop` profile（提示 managed exclusively by the Electron
application），此时改用桌面端的插件页安装。

安装是链接本地目录，不是打包拷贝：改完 `lib/` 里的文件，刷新页面就会用新文件（静态资源按 mtime
缓存，`splash.js` 请求带时间戳）。

## 3. 让它播放一次

- 默认 **每次会话** 只播一次。同一个浏览器会话里刷新不会再播。
- 想立刻再看：设置页 →「JARVIS 开机序列」→ **保存并重播**。
- 想每次都播：显示模式改成「每次刷新」。
- 想临时不播：关掉「启用」，或按 Esc 跳过。

## 4. 排查

**刷新后没看到动画**

- 确认插件启用且 profile 正确（web / desktop 是两套）。
- 设置了「每次会话」时，新开一个标签页或重启浏览器才会再播。
- 同时装了 `dsh-startup-screen` 的话，两套动画互相覆盖；停用其中一个。

**看到黑屏超过十秒**

正常情况下不会：首屏兜底脚本在 10 秒后无条件移除遮罩并放开滚动。若仍黑屏，说明页面本身没起来，
与插件无关，先看宿主日志。

**没有声音**

浏览器要求先有一次交互才允许出声，点一下页面或按 Enter 即可。语音还取决于系统里是否装了英文语音：
macOS 在「系统设置 → 辅助功能 → 朗读内容 → 系统声音」里可以下载 Daniel 等英文声音。

**字体不对**

HUD 数字与英文用系统等宽字体（`SF Mono` / `Menlo` / `Consolas`），在 macOS 与 Windows 上都无需额外安装。

**想彻底移除**

```bash
dsh plugin --profile web remove dsh-jarvis-startup
```

配置文件 `~/.dsh/jarvis-startup.json` 会保留，可手动删除。