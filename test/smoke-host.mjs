// Host 半侧冒烟测试：路由注册、首屏注入、配置读写。
// 用法：node test/smoke-host.mjs
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'jv-host-'))
process.env.DSH_HOME = home

const mod = await import('../lib/index.js')

assert.equal(mod.name, 'dsh-jarvis-startup')
assert.deepEqual(mod.inject, ['webServer', 'connection'])
assert.equal(typeof mod.apply, 'function')

const routes = []
let tapFn = null
let cleanup = null
const webServer = {
  register(route) { routes.push(route); return () => { route.disposed = true } },
  tapIndex(fn) { tapFn = fn; return () => { tapFn = null } }
}

mod.apply({
  get: (key) => (key === 'webServer' ? webServer : undefined),
  effect: (fn) => { cleanup = fn() }
})

assert.equal(routes.length, 3)
assert.deepEqual(routes.map((r) => r.path), [
  '/dsh-jarvis/splash.css',
  '/dsh-jarvis/splash.js',
  '/dsh-jarvis/config'
])
assert.equal(typeof tapFn, 'function')

/* ── 首屏注入 ──────────────────────────────────────────────────────────── */
const html = '<!doctype html><html><head><title>x</title></head><body><div id="app"></div></body></html>'
const out = tapFn(html)
assert.ok(out.includes('/dsh-jarvis/splash.css'), '注入样式表')
assert.ok(out.includes('/dsh-jarvis/splash.js'), '注入运行时')
assert.ok(out.includes('id="dsh-jarvis-root"'), '注入根节点')
assert.ok(out.includes('window.__DSH_JARVIS__='), '注入配置')
assert.ok(out.includes('window.__DSH_JARVIS_BOOT__="index"'), '注入来源标记')
assert.ok(out.indexOf('dsh-jarvis-root') < out.indexOf('<div id="app"></div>'), '根节点在应用之前')
assert.equal(tapFn(out), out, '重复注入应幂等')

/* ── 配置接口 ──────────────────────────────────────────────────────────── */
function fakeRes() {
  return {
    statusCode: 200,
    headers: {},
    chunks: [],
    writeHead(code, headers) { this.statusCode = code; this.headers = headers || {} },
    end(body) { if (body) this.chunks.push(Buffer.from(body)) },
    get body() { return Buffer.concat(this.chunks).toString('utf8') }
  }
}

const configRoute = routes.find((r) => r.path === '/dsh-jarvis/config')

const getRes = fakeRes()
await configRoute.handler({ method: 'GET', url: '/dsh-jarvis/config' }, getRes)
assert.equal(getRes.statusCode, 200)
const got = JSON.parse(getRes.body)
assert.equal(got.ok, true)
assert.equal(got.version, JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version)
assert.equal(got.config.identity, 'LINKS')
assert.equal(got.config.mode, 'session')
assert.ok(got.defaults && got.defaults.speed === 1)

const postRes = fakeRes()
const postReq = Readable.from([JSON.stringify({ patch: { speed: 99, mode: 'always', identity: '  TONY  ' } })])
postReq.method = 'POST'
await configRoute.handler(postReq, postRes)
assert.equal(postRes.statusCode, 200)
const saved = JSON.parse(postRes.body)
assert.equal(saved.config.speed, 2.5, '超范围速度被夹取')
assert.equal(saved.config.mode, 'always')
assert.equal(saved.config.identity, 'TONY', '文本被去空白')

assert.ok(fs.existsSync(path.join(home, 'jarvis-startup.json')), '配置文件落盘')

const resetRes = fakeRes()
const resetReq = Readable.from([JSON.stringify({ action: 'reset' })])
resetReq.method = 'POST'
await configRoute.handler(resetReq, resetRes)
assert.equal(JSON.parse(resetRes.body).config.mode, 'session', '恢复默认')

/* ── 静态路由 ──────────────────────────────────────────────────────────── */
const cssRes = fakeRes()
await routes[0].handler({ method: 'GET', url: '/dsh-jarvis/splash.css' }, cssRes)
assert.ok(cssRes.body.includes('.jv-root'), '返回 CSS')
assert.ok(String(cssRes.headers['Content-Type']).includes('text/css'))

const jsRes = fakeRes()
await routes[1].handler({ method: 'GET', url: '/dsh-jarvis/splash.js' }, jsRes)
assert.ok(jsRes.body.includes('__DSH_JARVIS__'), '返回运行时')

/* ── 清理 ──────────────────────────────────────────────────────────────── */
cleanup()
assert.equal(tapFn, null, 'dispose 后不再注入')
fs.rmSync(home, { recursive: true, force: true })

console.log('smoke-host: ok')