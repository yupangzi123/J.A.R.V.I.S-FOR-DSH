// 浏览器半侧冒烟测试：ModuleLoader 注册、设置分区注册、面板工厂可调用。
// 用法：node test/smoke-client.mjs
import assert from 'node:assert/strict'
import fs from 'node:fs'

const src = fs.readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')

let bundle = null
globalThis.window = { __ModuleLoader__: { load: (b) => { bundle = b } } }

assert.doesNotThrow(() => new Function(src)(), '语法可编译')
assert.ok(bundle, '调用 __ModuleLoader__.load')
assert.equal(bundle.id, 'dsh-jarvis-startup', 'entry id 等于包名')

/* 极简 React 替身：只够跑注册与面板工厂 */
const hooks = []
const react = {
  createElement: (type, props, ...children) => ({ type, props, children }),
  useState(init) { return [init, () => {}] },
  useEffect(fn) { hooks.push(fn) },
  Fragment: 'Fragment'
}

const mod = bundle.factory((name) => {
  if (name === 'react') return react
  throw new Error('unexpected require: ' + name)
})
assert.equal(typeof mod.apply, 'function')
assert.deepEqual(mod.inject, ['slots'])

let registered = null
const ctx = {
  slots: {
    inject(name, fn) { assert.equal(name, 'settings.section'); fn() },
    register(opts, factory) { registered = { opts, factory }; return () => {} }
  }
}

assert.doesNotThrow(() => mod.apply(ctx))
assert.ok(registered, '注册了设置分区')
assert.equal(registered.opts.name, 'settings.section')
assert.equal(registered.opts.id, 'jarvis-startup')
assert.equal(registered.opts.label, 'JARVIS 开机序列')
assert.equal(typeof registered.factory, 'function')

/* 面板工厂在无 DOM 环境下只建立 hooks，不应抛错 */
assert.doesNotThrow(() => registered.factory())

/* 带 hooks 的字段必须以组件方式渲染，不能当普通函数调用（React #310） */
assert.ok(src.includes('h(VoicePicker'), 'VoicePicker 以组件方式渲染')
assert.ok(!/control = VoicePicker\(/.test(src), 'VoicePicker 不被直接调用')

/* 关键字段都在字段表里 */
for (const key of ['enabled', 'mode', 'theme', 'speed', 'identity', 'callsign', 'voice', 'glass', 'accent', 'scanlines']) {
  assert.ok(src.includes("'" + key + "'"), '设置项 ' + key)
}

console.log('smoke-client: ok')