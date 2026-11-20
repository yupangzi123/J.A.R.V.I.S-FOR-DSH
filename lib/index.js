/* ============================================================================
 * dsh-jarvis-startup — Host 半侧
 * ----------------------------------------------------------------------------
 * 做三件事：
 *   1) 往 index.html 注入「开机序列」：首屏兜底黑幕 + 关键 CSS + 配置 + 运行时
 *   2) 提供 /dsh-jarvis/splash.css · splash.js · config 三个路由
 *   3) 把配置持久化到 ~/.dsh/jarvis-startup.json（设置页经 /dsh-jarvis/config 读写）
 *
 * 配置刻意不走 settings 命名空间，而是自带一份 JSON + 自带设置面板，
 * 这样不受 dsh-settings 版本变更影响。
 * ========================================================================== */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DSH_HOME = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
const CONFIG_FILE = path.join(DSH_HOME, 'jarvis-startup.json')

const NS = 'dsh-jarvis-startup'
const ROUTE_BASE = '/dsh-jarvis'
const ROOT_ID = 'dsh-jarvis-root'
const LOCK_CLASS = 'jv-lock'
const FLAG_SHOWN = NS + ':shown'
const FLAG_DAY = NS + ':day'

/** 插件版本：读自己的 package.json，读不到就退回占位符。 */
const PLUGIN_VERSION = (() => {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'))
    const v = String(pkg.version || '').trim()
    return v || '0.0.0'
  } catch (err) {
    return '0.0.0'
  }
})()

/** 默认配置：字段与 lib/splash.js 的 DEFAULTS 一一对应。 */
const DEFAULTS = {
  enabled: true,
  mode: 'session',              // always | session | daily
  theme: 'reactor',             // reactor（冰蓝）| mark3（金）
  speed: 1,
  requireInteraction: true,     // 身份核验那一步等确认
  allowSkip: true,
  identity: 'LINKS',            // 被 JARVIS 称呼的人
  callsign: 'SIR',              // 称呼后缀：SIR / MA'AM / 老板
  clearance: 'ALPHA',           // 权限等级
  brand: 'J.A.R.V.I.S.',
  subtitle: 'JUST A RATHER VERY INTELLIGENT SYSTEM',
  footer: 'MARK VII // MALIBU POINT',
  welcomeLine: 'WELCOME BACK',
  sound: true,                  // 界面音效（WebAudio 合成）
  sfxVolume: 0.4,
  voice: true,                  // 语音播报（Web Speech API）
  voiceName: '',                // '' = 自动挑一个英式男声
  voiceRate: 0.92,
  voicePitch: 0.78,
  voiceVolume: 0.9,
  voiceLead: 260,               // 开口前的留白
  glass: true,                  // 液态玻璃：底衬半透明磨砂
  glassOpacity: 0.95,           // 0.15 ~ 0.95
  glassBlur: 36,                // 0 ~ 60px
  glassSaturate: 145,           // 100 ~ 200%
  glassBackdropBlur: 40,        // 0 ~ 80px
  scanlines: true,
  accent: '#5fe3ff',            // 主色：冰蓝
  accent2: '#ffc46b',           // 副色：方舟反应炉的金
  glitchA: '#ff4f45',
  glitchB: '#2f7fd0'
}

const TEXT_KEYS = [
  'identity', 'callsign', 'clearance', 'brand', 'subtitle', 'footer', 'welcomeLine', 'voiceName'
]
const COLOR_KEYS = ['accent', 'accent2', 'glitchA', 'glitchB']
const ENUMS = {
  mode: ['always', 'session', 'daily'],
  theme: ['reactor', 'mark3']
}
const BOOL_KEYS = [
  'enabled', 'requireInteraction', 'allowSkip', 'sound', 'voice', 'glass', 'scanlines'
]
/** 数值字段的合法区间（越界即夹取）。 */
const RANGES = {
  speed: [0.4, 2.5],
  sfxVolume: [0, 1],
  voiceRate: [0.5, 2],
  voicePitch: [0, 2],
  voiceVolume: [0, 1],
  voiceLead: [0, 1200],
  glassOpacity: [0.15, 0.95],
  glassBlur: [0, 60],
  glassSaturate: [100, 200],
  glassBackdropBlur: [0, 80]
}

function normalize(input) {
  const out = { ...DEFAULTS }
  const src = input && typeof input === 'object' ? input : {}
  for (const key of Object.keys(DEFAULTS)) {
    if (!(key in src) || src[key] === undefined || src[key] === null) continue
    const value = src[key]
    if (BOOL_KEYS.includes(key)) {
      out[key] = value === true || value === 'true' || value === 1 || value === '1'
    } else if (ENUMS[key]) {
      out[key] = ENUMS[key].includes(value) ? value : DEFAULTS[key]
    } else if (RANGES[key]) {
      const [lo, hi] = RANGES[key]
      const n = Number(value)
      out[key] = Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : DEFAULTS[key]
    } else if (COLOR_KEYS.includes(key)) {
      const s = String(value).trim()
      out[key] = /^#[0-9a-fA-F]{3,8}$/.test(s) ? s : DEFAULTS[key]
    } else if (TEXT_KEYS.includes(key)) {
      out[key] = String(value).slice(0, 64).trim()
    } else {
      out[key] = value
    }
  }
  if (!String(out.identity).trim()) out.identity = DEFAULTS.identity
  if (!String(out.callsign).trim()) out.callsign = DEFAULTS.callsign
  if (!String(out.brand).trim()) out.brand = DEFAULTS.brand
  return out
}

function readConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8')
    return normalize(JSON.parse(raw))
  } catch (err) {
    return { ...DEFAULTS }
  }
}

function writeConfig(next) {
  const cfg = normalize(next)
  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true })
  const tmp = CONFIG_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(cfg, null, 2), 'utf8')
  fs.renameSync(tmp, CONFIG_FILE)
  return cfg
}

/** 静态文件按 mtime 缓存，改完插件刷新页面即生效。 */
function makeReader(rel) {
  let cache = null
  return function read() {
    const file = path.join(PACKAGE_ROOT, rel)
    try {
      const st = fs.statSync(file)
      if (!cache || cache.mtimeMs !== st.mtimeMs) {
        cache = { mtimeMs: st.mtimeMs, text: fs.readFileSync(file, 'utf8') }
      }
      return cache.text
    } catch (err) {
      return ''
    }
  }
}

const readSplashCss = makeReader('lib/splash.css')
const readSplashJs = makeReader('lib/splash.js')

/** 内联脚本里绝对不能出现 `</script>`。 */
function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028|\u2029/g, '')
}

/** 首屏兜底：应用挂载前先把窗口盖住，避免闪出界面本体。 */
const CRITICAL_CSS = [
  'html.' + LOCK_CLASS + ',html.' + LOCK_CLASS + ' body{overflow:hidden!important}',
  'html.' + LOCK_CLASS + ' body{background-color:#000!important}',
  ':root{--dsh-boot-bg:#000}',
  '#' + ROOT_ID + '.jv-boot{position:fixed;inset:0;z-index:2147483000;background:#000}'
].join('')

const BOOTSTRAP_JS = `(function(){try{
var c=window.__DSH_JARVIS__||{};
var root=document.getElementById('${ROOT_ID}');
var off=!c.enabled;
if(!off&&c.mode==='session'&&sessionStorage.getItem('${FLAG_SHOWN}')==='1')off=true;
if(!off&&c.mode==='daily'&&localStorage.getItem('${FLAG_DAY}')===new Date().toISOString().slice(0,10))off=true;
if(off){window.__DSH_JARVIS_SKIP__=true;if(root&&root.parentNode)root.parentNode.removeChild(root);}
else{document.documentElement.classList.add('${LOCK_CLASS}');/* 兜底：运行时没跑起来（404/被拦/语法错）时 10 秒后无条件放行，绝不锁黑屏 */setTimeout(function(){try{if(window.__DSH_JARVIS_RUNNING__===true)return;var r=document.getElementById('${ROOT_ID}');if(r&&r.parentNode)r.parentNode.removeChild(r);document.documentElement.classList.remove('${LOCK_CLASS}');if(document.body)document.body.style.overflow='';window.__DSH_JARVIS_FAILED__=true;}catch(e){}},10000);}
}catch(e){} })()`

const name = NS
const inject = ['webServer', 'connection']

/**
 * 取得 HTTP 载体服务。
 *
 * web profile 与桌面端都会挂 @deepseek-ai/dsh-web-app，其中 webserver 这一行
 * 提供 webServer；Electron 也可能改成 file:// + IPC 直接下发前端。那种情况下
 * 没有 webServer，本插件不该把一颗 fiber 炸掉 —— 交给浏览器半侧自举。
 */
function resolveWebServer(ctx) {
  try {
    const viaGet = typeof ctx.get === 'function' ? ctx.get('webServer') : undefined
    if (viaGet) return viaGet
  } catch (err) { /* 取不到就当没有 */ }
  return ctx.webServer
}

function hasRoutes(server) {
  return !!server && typeof server.register === 'function' && typeof server.tapIndex === 'function'
}

function apply(ctx) {
  const disposers = []
  const webServer = resolveWebServer(ctx)

  if (!hasRoutes(webServer)) {
    try {
      ctx.logger?.warn?.(
        '[' + NS + '] 当前 profile 没有可用的 webServer（桌面端可能用 file:// + IPC 下发前端）；' +
        'Host 半侧跳过路由与首屏注入，改由浏览器半侧自举开机序列。'
      )
    } catch (err) { /* 日志失败不影响加载 */ }
    return
  }

  /** 浏览器信任栅栏：自定义路由必须过一遍，否则可被任意网页读写。 */
  function rejected(req, res) {
    try {
      const conn = (typeof ctx.get === 'function' ? ctx.get('connection') : undefined) || ctx.connection
      if (!conn || typeof conn.requestRejection !== 'function') return false
      const code = conn.requestRejection(req)
      if (code === undefined || code === null || code === false) return false
      res.statusCode = typeof code === 'number' ? code : 403
      res.end()
      return true
    } catch (err) {
      return false
    }
  }

  function registerRoute(route) {
    const inner = route && route.handler
    const wrapped = Object.assign({}, route, {
      handler: async (req, res) => {
        if (rejected(req, res)) return
        return inner(req, res)
      }
    })
    return webServer.register(wrapped)
  }

  function sendJson(res, code, payload) {
    const body = Buffer.from(JSON.stringify(payload), 'utf8')
    res.writeHead(code, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Length': String(body.length)
    })
    res.end(body)
  }

  function sendText(res, type, text) {
    const body = Buffer.from(text, 'utf8')
    res.writeHead(200, {
      'Content-Type': type,
      'Cache-Control': 'no-store',
      'Content-Length': String(body.length)
    })
    res.end(body)
  }

  function readBody(req, limit = 64 * 1024) {
    return new Promise((resolve) => {
      let size = 0
      const chunks = []
      req.on('data', (c) => {
        const chunk = Buffer.isBuffer(c) ? c : Buffer.from(String(c))
        size += chunk.length
        if (size > limit) {
          req.destroy()
          resolve('')
          return
        }
        chunks.push(chunk)
      })
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
      req.on('error', () => resolve(''))
    })
  }

  disposers.push(registerRoute({
    kind: 'exact',
    path: ROUTE_BASE + '/splash.css',
    handler: (req, res) => sendText(res, 'text/css; charset=utf-8', readSplashCss())
  }))

  disposers.push(registerRoute({
    kind: 'exact',
    path: ROUTE_BASE + '/splash.js',
    handler: (req, res) => sendText(res, 'application/javascript; charset=utf-8', readSplashJs())
  }))

  disposers.push(registerRoute({
    kind: 'exact',
    path: ROUTE_BASE + '/config',
    handler: async (req, res) => {
      const method = (req.method || 'GET').toUpperCase()
      if (method === 'GET') {
        sendJson(res, 200, {
          ok: true,
          version: PLUGIN_VERSION,
          config: readConfig(),
          defaults: DEFAULTS,
          file: CONFIG_FILE
        })
        return
      }
      if (method !== 'POST') {
        sendJson(res, 405, { ok: false, error: 'method not allowed' })
        return
      }
      const text = await readBody(req)
      let payload = {}
      try {
        payload = text ? JSON.parse(text) : {}
      } catch (err) {
        sendJson(res, 400, { ok: false, error: 'invalid json' })
        return
      }
      try {
        if (payload && payload.action === 'reset') {
          const cfgNow = writeConfig(DEFAULTS)
          sendJson(res, 200, { ok: true, version: PLUGIN_VERSION, config: cfgNow, defaults: DEFAULTS })
          return
        }
        const current = readConfig()
        const patch = payload && typeof payload.patch === 'object' && payload.patch ? payload.patch : payload
        const cfgNow = writeConfig({ ...current, ...patch })
        sendJson(res, 200, { ok: true, version: PLUGIN_VERSION, config: cfgNow, defaults: DEFAULTS })
      } catch (err) {
        sendJson(res, 500, { ok: false, error: String((err && err.message) || err) })
      }
    }
  }))

  disposers.push(webServer.tapIndex((html) => {
    if (!html || html.includes(ROUTE_BASE + '/splash.js')) return html
    const cfg = readConfig()
    const head =
      '<link rel="stylesheet" href="' + ROUTE_BASE + '/splash.css">' +
      '<style id="dsh-jarvis-critical">' + CRITICAL_CSS + '</style>'
    const body =
      '<div id="' + ROOT_ID + '" class="jv-root jv-boot"></div>' +
      '<script>window.__DSH_JARVIS_BOOT__="index";window.__DSH_JARVIS_VERSION__=' + safeJson(PLUGIN_VERSION) + ';window.__DSH_JARVIS__=' + safeJson(cfg) + ';' + BOOTSTRAP_JS + '</script>' +
      '<script defer src="' + ROUTE_BASE + '/splash.js"></script>'

    let out = html
    if (out.includes('</head>')) out = out.replace('</head>', head + '</head>')
    else out = head + out
    if (out.includes('<body>')) out = out.replace('<body>', '<body>' + body)
    else if (out.includes('</body>')) out = out.replace('</body>', body + '</body>')
    else out = out + body
    return out
  }))

  ctx.effect(() => () => {
    for (const dispose of disposers) {
      try { dispose() } catch (err) { /* noop */ }
    }
  })
}

/* 导出形状对齐 DSH 内部插件：只给具名 name / inject / apply。
   不导出 default（loader 的 unwrapExports 是 exports.default ?? exports），
   也不导出 Config（本插件自带 JSON 配置，不吃 profile config）。 */
export { apply, inject, name }