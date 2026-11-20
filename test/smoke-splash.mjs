// 运行时冒烟测试：语法可编译、关键路径齐全、没有会破坏内联注入的字面量。
// 用法：node test/smoke-splash.mjs
import assert from 'node:assert/strict'
import fs from 'node:fs'

const file = new URL('../lib/splash.js', import.meta.url)
const src = fs.readFileSync(file, 'utf8')

/* 外部脚本里出现 </script> 会把内联注入截断（本文件是外链，仍防一手） */
assert.ok(!src.includes('</script>'), '不含 </script>')
assert.ok(/^\(function \(\) \{/m.test(src), 'IIFE 包裹')

/* 能解析：用 Function 构造，不执行 */
assert.doesNotThrow(() => new Function(src), '语法可编译')

for (const marker of [
  'requestAnimationFrame',
  'speechSynthesis',
  'AudioContext',
  'getContext(\'2d\')',
  'jv-root',
  'dsh-jarvis-startup:shown',
  'prefers-reduced-motion'
]) {
  assert.ok(src.includes(marker), '包含 ' + marker)
}

/* 时间线常量存在且顺序合理 */
const baseStart = src.indexOf('var BASE =')
const baseEnd = src.indexOf('var PHASES')
assert.ok(baseStart > 0 && baseEnd > baseStart, '找到 BASE 时间线')
const base = src.slice(baseStart, baseEnd)
const order = ['brand:', 'p1:', 'p2:', 'p3:', 'gate:', 'welcome:', 'split:', 'off:', 'end:']
let last = -1
for (const key of order) {
  const at = base.indexOf(key)
  assert.ok(at > last, 'BASE 字段顺序：' + key)
  last = at
}

/* 配置项都被运行时读过，避免设置页改了不生效 */
const cfgKeys = ['identity', 'callsign', 'clearance', 'brand', 'subtitle', 'footer', 'welcomeLine', 'glassOpacity', 'voiceRate', 'sfxVolume', 'accent2']
for (const key of cfgKeys) {
  assert.ok(src.includes('cfg.' + key), '读取配置 ' + key)
}

console.log('smoke-splash: ok')