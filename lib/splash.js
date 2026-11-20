/* ============================================================================
 * dsh-jarvis-startup — 浏览器运行时（电影级 3D 全息 J.A.R.V.I.S. HUD）
 * ----------------------------------------------------------------------------
 * 全屏 Canvas 3D 投影渲染：
 *   - 钢铁侠头盔面甲合拢 + 光学对焦开场（Visor Boot-Up）
 *   - 真 3D 球面神经网络矩阵（Fibonacci 节点群 + 动态神经突触 + 3D 声纹脉冲）
 *   - 三层 3D 透视倾斜陀螺仪轨道环 + 外圈精密刻度 + 雷达扫描扇区
 *   - 头盔曲面面甲弧线 + 3D 景深空间粒子 + 真实设备电量/网络/时间遥测
 *   - 低频方舟反应炉环境底噪 + 动态早/午/晚安问候 + 完整语音防截断同步
 *
 * 零外部依赖，纯原生 Canvas 2D + WebAudio + Web Speech API 现场合成。
 * ========================================================================== */

(function () {
  'use strict'

  var TAU = Math.PI * 2
  var ROOT_ID = 'dsh-jarvis-root'
  var FLAG_SHOWN = 'dsh-jarvis-startup:shown'
  var FLAG_DAY = 'dsh-jarvis-startup:day'

  var DEFAULTS = {
    enabled: true,
    mode: 'session',
    theme: 'reactor',
    speed: 1,
    requireInteraction: true,
    allowSkip: true,
    visorBoot: true,
    parallax: 1,
    neuralDensity: 1,
    identity: 'LINKS',
    callsign: 'SIR',
    clearance: 'ALPHA',
    brand: 'J.A.R.V.I.S.',
    subtitle: 'JUST A RATHER VERY INTELLIGENT SYSTEM',
    footer: 'MARK VII // MALIBU POINT',
    welcomeLine: 'WELCOME BACK',
    sound: true,
    ambientHum: true,
    sfxVolume: 0.4,
    voice: true,
    voiceName: '',
    voiceRate: 0.92,
    voicePitch: 0.78,
    voiceVolume: 0.9,
    voiceLead: 260,
    glass: true,
    glassOpacity: 0.95,
    glassBlur: 36,
    glassSaturate: 145,
    glassBackdropBlur: 40,
    scanlines: true,
    accent: '#5fe3ff',
    accent2: '#ffc46b',
    glitchA: '#ff4f45',
    glitchB: '#2f7fd0'
  }

  var THEMES = {
    reactor: { accent: '#5fe3ff', accent2: '#ffc46b' },
    mark3: { accent: '#ffc46b', accent2: '#8fe9ff' },
    ultron: { accent: '#ffb830', accent2: '#fff0a8' }
  }

  /* 防重复：同一页面里只跑一份 */
  if (window.__DSH_JARVIS_LOADED__) return
  window.__DSH_JARVIS_LOADED__ = true
  window.__DSH_JARVIS_RUNNING__ = true

  var cfg = mergeConfig(window.__DSH_JARVIS__)
  var reduced = false
  try {
    reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch (err) { /* 老浏览器没有 matchMedia */ }

  var root = document.getElementById(ROOT_ID)
  if (!root) {
    root = document.createElement('div')
    root.id = ROOT_ID
    document.body.appendChild(root)
  }
  root.textContent = ''
  root.className = 'jv-root jv-boot'

  /* ── 配置 ───────────────────────────────────────────────────────────────── */

  function mergeConfig(raw) {
    var out = {}
    for (var k in DEFAULTS) out[k] = DEFAULTS[k]
    if (raw && typeof raw === 'object') {
      for (var key in raw) {
        if (raw[key] !== undefined && raw[key] !== null) out[key] = raw[key]
      }
    }
    var preset = THEMES[out.theme]
    if (preset) {
      if (out.accent === DEFAULTS.accent && out.accent2 === DEFAULTS.accent2) {
        out.accent = preset.accent
        out.accent2 = preset.accent2
      }
    }
    return out
  }

  function clamp(n, lo, hi) {
    n = Number(n)
    if (!isFinite(n)) n = lo
    return Math.min(hi, Math.max(lo, n))
  }

  function hexToRgb(hex) {
    var s = String(hex || '').replace('#', '')
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2]
    var n = parseInt(s.slice(0, 6), 16)
    if (!isFinite(n)) n = 0x5fe3ff
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
  }

  function rgba(hex, a) {
    var c = hexToRgb(hex)
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')'
  }

  var ACCENT = cfg.accent
  var ACCENT2 = cfg.accent2
  var SPEED = clamp(cfg.speed, 0.4, 2.5)
  var PARALLAX = clamp(cfg.parallax, 0, 2)
  var DENSITY = clamp(cfg.neuralDensity, 0.5, 1.6)

  /* 按当前本地时间生成早/午/晚安问候 */
  function getGreeting() {
    var hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      return { en: 'GOOD MORNING', zh: '早上好。动力核心与语音链路已就绪。', voice: 'Good morning' }
    }
    if (hour >= 12 && hour < 18) {
      return { en: 'GOOD AFTERNOON', zh: '下午好。动力核心与语音链路已就绪。', voice: 'Good afternoon' }
    }
    return { en: 'GOOD EVENING', zh: '晚上好。动力核心与语音链路已就绪。', voice: 'Good evening' }
  }
  var GREET = getGreeting()

  /* ── DOM ────────────────────────────────────────────────────────────────── */

  var useVisor = !!(cfg.visorBoot && !reduced)
  var visorTpl = useVisor
    ? '<div class="jv-visor" aria-hidden="true"><div class="jv-visor-half jv-visor-half--top"></div><div class="jv-visor-half jv-visor-half--bot"></div><div class="jv-visor-seam"></div></div>'
    : ''

  var tpl = [
    '<div class="jv-backdrop"></div>',
    '<div class="jv-grid"></div>',
    '<div class="jv-scanlines"></div>',
    '<div class="jv-vignette"></div>',
    visorTpl,
    '<div class="jv-stage">',
    '  <canvas class="jv-canvas" aria-hidden="true"></canvas>',
    '  <div class="jv-corner jv-corner--tl"></div>',
    '  <div class="jv-corner jv-corner--tr"></div>',
    '  <div class="jv-corner jv-corner--bl"></div>',
    '  <div class="jv-corner jv-corner--br"></div>',
    '  <header class="jv-top">',
    '    <div class="jv-wordmark"><b>STARK INDUSTRIES</b><span class="jv-model"></span></div>',
    '    <div class="jv-topright">',
    '      <div class="jv-stats">',
    '        <span class="jv-stat"><b>ARC</b><i data-k="arc">0.0%</i></span>',
    '        <span class="jv-stat"><b>PWR</b><i data-k="pwr">0.00 GW</i></span>',
    '        <span class="jv-stat"><b>LINK</b><i data-k="link">SYNC</i></span>',
    '        <span class="jv-stat"><b>TIME</b><i data-k="clock">--:--:--</i></span>',
    '      </div>',
    '      <button type="button" class="jv-skip">SKIP</button>',
    '    </div>',
    '  </header>',
    '  <aside class="jv-wing jv-wing--left" aria-hidden="true">',
    '    <div class="jv-wing-head"><span class="jv-wing-badge"><span class="jv-wing-dot"></span><span>SUIT TELEMETRY</span></span><span class="jv-wing-code" data-t="cores">MK-VII</span></div>',
    '    <div class="jv-telemetry">',
    '      <div class="jv-tel-row"><div class="jv-tel-meta"><span>CORE TEMP</span><i data-t="temp">294 K</i></div><div class="jv-tel-track"><div class="jv-tel-fill" data-bar="temp"></div></div></div>',
    '      <div class="jv-tel-row"><div class="jv-tel-meta"><span>NEURAL BUS</span><i data-t="bus">12%</i></div><div class="jv-tel-track"><div class="jv-tel-fill" data-bar="bus"></div></div></div>',
    '      <div class="jv-tel-row"><div class="jv-tel-meta"><span>POWER CELL</span><i data-t="hull">100%</i></div><div class="jv-tel-track"><div class="jv-tel-fill" data-bar="hull"></div></div></div>',
    '    </div>',
    '    <div class="jv-eq-wrap">',
    '      <div class="jv-eq-label"><span>VOICE MATRIX</span><span data-t="vox">IDLE</span></div>',
    '      <div class="jv-eq">',
    '        <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>',
    '      </div>',
    '    </div>',
    '  </aside>',
    '  <aside class="jv-wing jv-wing--right" aria-hidden="true">',
    '    <div class="jv-wing-head"><span class="jv-wing-badge"><span class="jv-wing-dot"></span><span>NEURAL MATRIX</span></span><span class="jv-wing-code" data-t="net">SYNC</span></div>',
    '    <div class="jv-matrix">',
    '      <div class="jv-cell" data-m="0">ARC</div>',
    '      <div class="jv-cell" data-m="1">NET</div>',
    '      <div class="jv-cell" data-m="2">MEM</div>',
    '      <div class="jv-cell" data-m="3">BUS</div>',
    '      <div class="jv-cell" data-m="4">LLM</div>',
    '      <div class="jv-cell" data-m="5">SEC</div>',
    '      <div class="jv-cell" data-m="6">VOX</div>',
    '      <div class="jv-cell" data-m="7">HUD</div>',
    '    </div>',
    '    <div class="jv-hexstream" data-t="hex">0x7F4A · 99.4% · SYNC<br>0x3C0E · LATTICE OK</div>',
    '    <div class="jv-pitch">',
    '      <div class="jv-pitch-bars">',
    '        <div class="jv-pitch-line" style="width:92px"></div>',
    '        <div class="jv-pitch-line" style="width:56px"></div>',
    '        <div class="jv-pitch-line" style="width:74px"></div>',
    '      </div>',
    '      <div class="jv-pitch-readout" data-t="azm">AZM 000.0° · ELV +00.0°</div>',
    '    </div>',
    '  </aside>',
    '  <main class="jv-main">',
    '    <div class="jv-lockup">',
    '      <div class="jv-brand" role="heading" aria-level="1"></div>',
    '      <div class="jv-sub"></div>',
    '    </div>',
    '    <div class="jv-phase">',
    '      <div class="jv-phase-en"></div>',
    '      <div class="jv-phase-zh"></div>',
    '      <div class="jv-phase-rule"></div>',
    '      <div class="jv-auth">',
    '        <button type="button" class="jv-auth-btn"><span class="jv-auth-label">AUTHENTICATE</span><span class="jv-auth-key">ENTER</span></button>',
    '        <div class="jv-auth-hint">按 Enter / 空格确认，Esc 跳过</div>',
    '      </div>',
    '    </div>',
    '    <div class="jv-welcome">',
    '      <div class="jv-welcome-line"></div>',
    '      <div class="jv-welcome-name"></div>',
    '    </div>',
    '  </main>',
    '  <footer class="jv-bottom">',
    '    <div class="jv-log"><div class="jv-log-title">BOOT LOG</div><div class="jv-log-lines"></div></div>',
    '    <div class="jv-centerbar">',
    '      <div class="jv-progress-meta"><span class="jv-phase-label">[ 01 / 05 ] POWER UP</span><span class="jv-pct">0%</span></div>',
    '      <div class="jv-bar"><div class="jv-bar-fill"></div><div class="jv-bar-ticks"></div></div>',
    '    </div>',
    '    <div class="jv-foot"><div class="jv-ident">ID CONFIRMED : <b>—</b></div><div class="jv-powered">POWERED BY DEEPSEEK</div></div>',
    '  </footer>',
    '</div>'
  ].join('')

  root.innerHTML = tpl

  var canvas = root.querySelector('.jv-canvas')
  var visorEl = root.querySelector('.jv-visor')
  var brandEl = root.querySelector('.jv-brand')
  var subEl = root.querySelector('.jv-sub')
  var modelEl = root.querySelector('.jv-model')
  var phaseEl = root.querySelector('.jv-phase')
  var phaseEn = root.querySelector('.jv-phase-en')
  var phaseZh = root.querySelector('.jv-phase-zh')
  var phaseLabel = root.querySelector('.jv-phase-label')
  var authEl = root.querySelector('.jv-auth')
  var authBtn = root.querySelector('.jv-auth-btn')
  var welcomeEl = root.querySelector('.jv-welcome')
  var welcomeLine = root.querySelector('.jv-welcome-line')
  var welcomeName = root.querySelector('.jv-welcome-name')
  var logLines = root.querySelector('.jv-log-lines')
  var barFill = root.querySelector('.jv-bar-fill')
  var pctEl = root.querySelector('.jv-pct')
  var identEl = root.querySelector('.jv-ident b')
  var skipBtn = root.querySelector('.jv-skip')
  var stats = {
    arc: root.querySelector('[data-k="arc"]'),
    pwr: root.querySelector('[data-k="pwr"]'),
    link: root.querySelector('[data-k="link"]'),
    clock: root.querySelector('[data-k="clock"]')
  }
  var telText = {
    temp: root.querySelector('[data-t="temp"]'),
    bus: root.querySelector('[data-t="bus"]'),
    hull: root.querySelector('[data-t="hull"]'),
    azm: root.querySelector('[data-t="azm"]'),
    vox: root.querySelector('[data-t="vox"]'),
    hex: root.querySelector('[data-t="hex"]'),
    cores: root.querySelector('[data-t="cores"]'),
    net: root.querySelector('[data-t="net"]')
  }
  var telBars = {
    temp: root.querySelector('[data-bar="temp"]'),
    bus: root.querySelector('[data-bar="bus"]'),
    hull: root.querySelector('[data-bar="hull"]')
  }
  var eqBars = root.querySelectorAll('.jv-eq span')
  var matrixCells = root.querySelectorAll('.jv-cell')

  /* 玻璃 / 扫描线 / 面甲光学对焦 / 主题变量 */
  if (cfg.glass) root.classList.add('jv-glass')
  if (!cfg.scanlines) root.classList.add('jv-flat')
  if (useVisor) {
    root.classList.add('jv-visor-focus')
    setTimeout(function () {
      if (visorEl && visorEl.parentNode) visorEl.parentNode.removeChild(visorEl)
    }, 900)
  }
  root.style.setProperty('--accent', cfg.accent)
  root.style.setProperty('--accent2', cfg.accent2)
  root.style.setProperty('--glitch-a', cfg.glitchA)
  root.style.setProperty('--glitch-b', cfg.glitchB)
  root.style.setProperty('--glass-alpha', String(clamp(cfg.glassOpacity, 0.15, 0.95)))
  root.style.setProperty('--glass-blur', clamp(cfg.glassBlur, 0, 60) + 'px')
  root.style.setProperty('--glass-sat', clamp(cfg.glassSaturate, 100, 200) + '%')
  root.style.setProperty('--backdrop-blur', clamp(cfg.glassBackdropBlur, 0, 80) + 'px')

  /* 品牌逐字入场 */
  modelEl.textContent = cfg.footer
  subEl.textContent = cfg.subtitle
  welcomeLine.textContent = cfg.welcomeLine
  var brandText = String(cfg.brand || 'J.A.R.V.I.S.')
  for (var i = 0; i < brandText.length; i++) {
    var span = document.createElement('span')
    span.textContent = brandText[i] === ' ' ? '\u00a0' : brandText[i]
    span.style.setProperty('--i', String(i))
    brandEl.appendChild(span)
  }
  brandEl.setAttribute('aria-label', brandText)

  welcomeName.textContent = String(cfg.identity || 'OPERATOR')
  var clearanceEm = document.createElement('em')
  clearanceEm.textContent = '· ' + String(cfg.clearance || 'ALPHA')
  welcomeName.appendChild(clearanceEm)

  if (cfg.allowSkip) skipBtn.style.display = ''
  else skipBtn.style.display = 'none'

  /* ── 真实设备环境遥测（CPU 核心数 / 网络延迟 / 电池电量 & 低电量警告） ─── */

  var realBatteryPct = null
  var realLowPower = false
  var realCores = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) ? navigator.hardwareConcurrency : 8
  var realNetLabel = (typeof navigator !== 'undefined' && navigator.onLine === false) ? 'OFFLINE' : 'ONLINE'
  var realRtt = (typeof navigator !== 'undefined' && navigator.connection && typeof navigator.connection.rtt === 'number' && navigator.connection.rtt > 0)
    ? navigator.connection.rtt + 'ms'
    : '12ms'

  if (telText.cores) telText.cores.textContent = realCores + '-CORE'
  if (telText.net) telText.net.textContent = realNetLabel === 'OFFLINE' ? 'OFFLINE' : realRtt

  function updateClock() {
    if (!stats.clock) return
    var d = new Date()
    var hh = String(d.getHours()).padStart(2, '0')
    var mm = String(d.getMinutes()).padStart(2, '0')
    var ss = String(d.getSeconds()).padStart(2, '0')
    stats.clock.textContent = hh + ':' + mm + ':' + ss
  }
  updateClock()

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.getBattery === 'function') {
      navigator.getBattery().then(function (bat) {
        if (!bat || finished) return
        var pct = Math.round(clamp(bat.level, 0, 1) * 100)
        realBatteryPct = pct
        updateTelemetry(undefined, undefined, pct)
        if (pct < 20 && !bat.charging) {
          realLowPower = true
          root.classList.add('jv-low-power')
          setStat('arc', 'LOW ' + pct + '%')
        }
      }).catch(function () { /* noop */ })
    }
  } catch (err) { /* noop */ }

  /* 尺寸：全屏 Canvas + 中心反应炉直径 */
  var viewW = window.innerWidth || 1280
  var viewH = window.innerHeight || 800
  var pointerNX = 0
  var pointerNY = 0

  function ringSize() {
    var vw = window.innerWidth || 1280
    var vh = window.innerHeight || 800
    var w = Math.min(vh * 0.43, vw * 0.72, 420)
    if (vw <= 720) w = Math.min(vw * 0.72, 300, vh * 0.4)
    return Math.max(190, Math.round(w))
  }

  function stageCenterY() {
    if (viewW <= 720) return viewH * 0.33
    if (viewH <= 640) return viewH * 0.31
    return viewH * 0.35
  }

  var ringPx = ringSize()
  root.style.setProperty('--ring', ringPx + 'px')

  function fitCanvas() {
    viewW = window.innerWidth || 1280
    viewH = window.innerHeight || 800
    var dpr = Math.min(2, window.devicePixelRatio || 1)
    var next = ringSize()
    if (next !== ringPx) {
      ringPx = next
      root.style.setProperty('--ring', ringPx + 'px')
    }
    canvas.width = Math.round(viewW * dpr)
    canvas.height = Math.round(viewH * dpr)
    canvas.style.width = viewW + 'px'
    canvas.style.height = viewH + 'px'
    var ctx = canvas.getContext('2d')
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  /* ── 3D J.A.R.V.I.S. 神经网络矩阵 & 全屏头盔面甲数据初始化 ──────────────── */

  var ringCtx = null
  var speakingUntil = 0

  /* 1. Fibonacci 球面分布：按 neuralDensity 动态生成 3D 神经节点与突触连线 */
  var NEURAL_NODES = []
  var NEURAL_EDGES = []
  ;(function buildNeuralSphere() {
    var count = Math.round(84 * DENSITY)
    var goldenAngle = Math.PI * (3 - Math.sqrt(5))
    for (var n = 0; n < count; n++) {
      var y = 1 - (n / (count - 1)) * 2
      var radiusAtY = Math.sqrt(Math.max(0, 1 - y * y))
      var theta = goldenAngle * n
      var shell = n % 3 === 0 ? 0.62 : (n % 2 === 0 ? 0.86 : 1.0)
      NEURAL_NODES.push({
        x: Math.cos(theta) * radiusAtY * shell,
        y: y * shell,
        z: Math.sin(theta) * radiusAtY * shell,
        ph: Math.random() * TAU,
        gold: n % 5 === 0,
        px: 0, py: 0, pz: 0, scale: 1
      })
    }
    var threshold = 0.54 / Math.sqrt(DENSITY * 0.85 + 0.15)
    for (var a = 0; a < count; a++) {
      var links = 0
      for (var b = a + 1; b < count; b++) {
        var dx = NEURAL_NODES[a].x - NEURAL_NODES[b].x
        var dy = NEURAL_NODES[a].y - NEURAL_NODES[b].y
        var dz = NEURAL_NODES[a].z - NEURAL_NODES[b].z
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist < threshold && links < 4) {
          NEURAL_EDGES.push([a, b, Math.random() * TAU])
          links++
        }
      }
    }
  })()

  /* 2. 全屏 3D 景深全息尘埃粒子 */
  var spaceParticles = []
  ;(function seedSpaceParticles() {
    var count = Math.round(88 * DENSITY)
    for (var i2 = 0; i2 < count; i2++) {
      spaceParticles.push({
        x: (Math.random() - 0.5) * 2.1,
        y: (Math.random() - 0.5) * 1.6,
        z: Math.random() * 1.4 + 0.25,
        vx: (Math.random() - 0.5) * 0.00018,
        vy: (Math.random() - 0.5) * 0.00012,
        ph: Math.random() * TAU,
        gold: i2 % 7 === 0
      })
    }
  })()

  /* 3. 3D 旋转工具 */
  function rot3D(x, y, z, ax, ay, az) {
    var cosX = Math.cos(ax), sinX = Math.sin(ax)
    var y1 = y * cosX - z * sinX
    var z1 = y * sinX + z * cosX

    var cosY = Math.cos(ay), sinY = Math.sin(ay)
    var x2 = x * cosY + z1 * sinY
    var z2 = -x * sinY + z1 * cosY

    var cosZ = Math.cos(az), sinZ = Math.sin(az)
    var x3 = x2 * cosZ - y1 * sinZ
    var y3 = x2 * sinZ + y1 * cosZ
    return { x: x3, y: y3, z: z2 }
  }

  function drawArcs(ctx, radius, count, gapRatio, rotation) {
    var step = TAU / count
    var gap = step * gapRatio
    for (var i3 = 0; i3 < count; i3++) {
      var a0 = rotation + i3 * step + gap / 2
      var a1 = rotation + (i3 + 1) * step - gap / 2
      ctx.beginPath()
      ctx.arc(0, 0, radius, a0, a1)
      ctx.stroke()
    }
  }

  function drawPolygon(ctx, radius, sides, rotation) {
    ctx.beginPath()
    for (var s = 0; s <= sides; s++) {
      var a = rotation + (s / sides) * TAU
      var x = Math.cos(a) * radius
      var y = Math.sin(a) * radius
      if (s === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  /* 绘制 3D 透视倾斜陀螺仪轨道环 */
  function drawGyroRing3D(ctx, radius, tiltX, tiltY, spin, colorHex, baseAlpha, fov, dotCount) {
    var segs = 64
    for (var s = 0; s < segs; s++) {
      var a0 = (s / segs) * TAU + spin
      var a1 = ((s + 1) / segs) * TAU + spin
      var p0 = rot3D(Math.cos(a0) * radius, Math.sin(a0) * radius, 0, tiltX, tiltY, 0)
      var p1 = rot3D(Math.cos(a1) * radius, Math.sin(a1) * radius, 0, tiltX, tiltY, 0)
      var sc0 = fov / (fov + p0.z)
      var sc1 = fov / (fov + p1.z)
      var depth = clamp((1.15 - p0.z / (radius * 1.4)) * 0.65, 0.14, 1)
      if (s % 16 === 0 || s % 16 === 1) continue
      ctx.strokeStyle = rgba(colorHex, baseAlpha * depth)
      ctx.lineWidth = 0.8 + 1.15 * depth
      ctx.beginPath()
      ctx.moveTo(p0.x * sc0, p0.y * sc0)
      ctx.lineTo(p1.x * sc1, p1.y * sc1)
      ctx.stroke()
    }
    for (var d = 0; d < dotCount; d++) {
      var da = spin * 2.2 + (d / dotCount) * TAU
      var dp = rot3D(Math.cos(da) * radius, Math.sin(da) * radius, 0, tiltX, tiltY, 0)
      var dsc = fov / (fov + dp.z)
      var dAlpha = clamp((1.2 - dp.z / (radius * 1.3)) * 0.8, 0.2, 1)
      ctx.fillStyle = rgba(colorHex, dAlpha)
      ctx.beginPath()
      ctx.arc(dp.x * dsc, dp.y * dsc, 2.2 * dsc, 0, TAU)
      ctx.fill()
    }
  }

  /* 绘制钢铁侠头盔内部曲面弧形面甲刻度 */
  function drawHelmetVisor(ctx, cx, cy, R, t, ease, flare) {
    if (viewW < 780) return
    var visorR = Math.min(viewW * 0.44, viewH * 0.62)
    var arcSpan = 0.44
    var drift = Math.sin(t * 0.0009) * 0.03 + pointerNY * 0.06 * PARALLAX

    ctx.save()
    ctx.translate(cx, cy + viewH * 0.06)
    ctx.globalAlpha = ease * (0.68 + 0.24 * flare)

    for (var side = -1; side <= 1; side += 2) {
      var baseA = side === -1 ? Math.PI : 0
      ctx.lineWidth = 1.1
      ctx.strokeStyle = rgba(ACCENT, 0.24 + 0.16 * flare)
      ctx.beginPath()
      ctx.arc(0, 0, visorR, baseA - arcSpan, baseA + arcSpan)
      ctx.stroke()

      ctx.lineWidth = 0.8
      ctx.strokeStyle = rgba(ACCENT, 0.12)
      ctx.beginPath()
      ctx.arc(0, 0, visorR - 14, baseA - arcSpan * 0.82, baseA + arcSpan * 0.82)
      ctx.stroke()

      var ticks = 19
      for (var tk = 0; tk < ticks; tk++) {
        var frac = (tk / (ticks - 1)) * 2 - 1
        var ang = baseA + frac * arcSpan + drift * side
        var major = tk % 3 === 0
        var rIn = visorR - (major ? 12 : 5)
        var rOut = visorR + (major ? 4 : 0)
        ctx.lineWidth = major ? 1.2 : 0.8
        ctx.strokeStyle = major ? rgba(ACCENT2, 0.46) : rgba(ACCENT, 0.26)
        ctx.beginPath()
        ctx.moveTo(Math.cos(ang) * rIn, Math.sin(ang) * rIn)
        ctx.lineTo(Math.cos(ang) * rOut, Math.sin(ang) * rOut)
        ctx.stroke()
      }

      var connA = baseA
      ctx.strokeStyle = rgba(ACCENT, 0.14)
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.moveTo(Math.cos(connA) * (R * 1.18), Math.sin(connA) * (R * 1.18) - viewH * 0.06)
      ctx.lineTo(Math.cos(connA) * (visorR - 22), Math.sin(connA) * (visorR - 22))
      ctx.stroke()
    }
    ctx.restore()
  }

  /* 全屏 3D 空间粒子 */
  function drawSpaceDust(ctx, t, ease, flare) {
    ctx.save()
    ctx.globalAlpha = ease
    for (var i = 0; i < spaceParticles.length; i++) {
      var p = spaceParticles[i]
      p.x += p.vx * 16
      p.y += p.vy * 16
      if (p.x > 1.1) p.x = -1.1
      if (p.x < -1.1) p.x = 1.1
      if (p.y > 0.85) p.y = -0.85
      if (p.y < -0.85) p.y = 0.85
      var invZ = 1 / p.z
      var sx = viewW * 0.5 + (p.x + pointerNX * 0.06 * PARALLAX * invZ) * viewW * 0.52
      var sy = viewH * 0.5 + (p.y + pointerNY * 0.06 * PARALLAX * invZ) * viewH * 0.52
      var twinkle = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.0014 + p.ph))
      var rad = clamp(1.3 * invZ, 0.6, 2.4)
      ctx.fillStyle = rgba(p.gold ? ACCENT2 : ACCENT, twinkle * (0.28 + 0.25 * flare) * clamp(invZ, 0.3, 1))
      ctx.fillRect(sx, sy, rad, rad)
    }
    ctx.restore()
  }

  function drawRing(t, elapsed, state) {
    if (!ringCtx) return
    var ctx = ringCtx
    var cx = viewW * 0.5 + pointerNX * 10 * PARALLAX
    var cy = stageCenterY() + pointerNY * 8 * PARALLAX
    var R = ringPx / 2 - 14
    var pulse = 0.5 + 0.5 * Math.sin(t * 0.0026)
    var ignite = clamp((elapsed - 20) / 900, 0, 1)
    var ease = 1 - Math.pow(1 - ignite, 3)
    var flare = state.flare || 0
    var speaking = t < speakingUntil ? 1 : 0
    var fov = R * 3.4

    ctx.clearRect(0, 0, viewW, viewH)
    if (ease <= 0.001) return

    ctx.save()
    ctx.globalCompositeOperation = 'lighter'

    drawSpaceDust(ctx, t, ease, flare)
    drawHelmetVisor(ctx, cx, cy, R, t, ease, flare)

    ctx.translate(cx, cy)
    ctx.scale(0.58 + 0.42 * ease, 0.58 + 0.42 * ease)
    ctx.globalAlpha = ease

    /* 核心全息体积辉光 */
    var glow = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 1.35)
    glow.addColorStop(0, rgba(ACCENT, 0.22 + 0.16 * flare + 0.08 * speaking))
    glow.addColorStop(0.38, rgba(ACCENT, 0.07 + 0.06 * flare))
    glow.addColorStop(0.7, rgba(ACCENT2, 0.02 + 0.05 * flare))
    glow.addColorStop(1, rgba(ACCENT, 0))
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(0, 0, R * 1.35, 0, TAU)
    ctx.fill()

    var rot1 = t * 0.000075
    var rot2 = -t * 0.00016

    /* 点火 & 终幕双能量冲击波 */
    if (elapsed > 40 && elapsed < 1300) {
      var sw = clamp((elapsed - 40) / 1260, 0, 1)
      var swR = R * (0.12 + 1.25 * (1 - Math.pow(1 - sw, 2.6)))
      ctx.lineWidth = 2.2 * (1 - sw)
      ctx.strokeStyle = rgba(ACCENT, 0.8 * (1 - sw))
      ctx.beginPath()
      ctx.arc(0, 0, swR, 0, TAU)
      ctx.stroke()
    }
    if (flare > 0.05) {
      var fw = (t * 0.0011) % 1
      ctx.lineWidth = 1.6 * (1 - fw)
      ctx.strokeStyle = rgba(ACCENT2, 0.6 * flare * (1 - fw))
      ctx.beginPath()
      ctx.arc(0, 0, R * (0.3 + 1.1 * fw), 0, TAU)
      ctx.stroke()
    }

    /* 1) 三层真 3D 陀螺仪倾斜轨道环 */
    var gyroSpeed = 1 + flare * 2.2 + speaking * 0.6
    drawGyroRing3D(ctx, R * 0.94, 1.04 + pointerNY * 0.18 * PARALLAX, 0.36 + pointerNX * 0.18 * PARALLAX, t * 0.00055 * gyroSpeed, ACCENT, 0.56 + 0.25 * flare, fov, 2)
    drawGyroRing3D(ctx, R * 0.84, -0.82 - pointerNY * 0.14 * PARALLAX, 0.78 + pointerNX * 0.14 * PARALLAX, -t * 0.00072 * gyroSpeed, ACCENT2, 0.48 + 0.35 * flare, fov, 3)
    drawGyroRing3D(ctx, R * 0.66, 0.45, -1.12, t * 0.00105 * gyroSpeed, ACCENT, 0.42 + 0.22 * flare, fov, 2)

    /* 2) 真 3D J.A.R.V.I.S. 球面神经网络矩阵 */
    var sphereR = R * (0.46 + 0.03 * pulse + 0.05 * flare + 0.035 * speaking)
    var spinX = t * 0.00028 * gyroSpeed + pointerNY * 0.35 * PARALLAX
    var spinY = t * 0.00046 * gyroSpeed + pointerNX * 0.45 * PARALLAX
    var spinZ = t * 0.00014

    for (var n = 0; n < NEURAL_NODES.length; n++) {
      var nd = NEURAL_NODES[n]
      var voiceWave = speaking ? (1 + 0.16 * Math.sin(t * 0.016 - nd.y * 5.2 + nd.ph)) : (1 + 0.025 * Math.sin(t * 0.003 + nd.ph))
      var p3 = rot3D(nd.x * sphereR * voiceWave, nd.y * sphereR * voiceWave, nd.z * sphereR * voiceWave, spinX, spinY, spinZ)
      var sc = fov / (fov + p3.z)
      nd.px = p3.x * sc
      nd.py = p3.y * sc
      nd.pz = p3.z
      nd.scale = sc
    }

    for (var e = 0; e < NEURAL_EDGES.length; e++) {
      var edge = NEURAL_EDGES[e]
      var na = NEURAL_NODES[edge[0]]
      var nb = NEURAL_NODES[edge[1]]
      var avgZ = (na.pz + nb.pz) * 0.5
      var depth = clamp((1.12 - avgZ / (sphereR * 1.4)) * 0.62, 0.08, 1)
      var synPulse = 0.5 + 0.5 * Math.sin(t * (speaking ? 0.012 : 0.0035) + edge[2])
      var useGold = (flare > 0.35 || (speaking && synPulse > 0.72) || (na.gold && nb.gold))
      ctx.lineWidth = (0.55 + 0.65 * depth) * (speaking ? 1.2 : 1)
      ctx.strokeStyle = rgba(useGold ? ACCENT2 : ACCENT, depth * (0.18 + 0.28 * synPulse + 0.22 * flare + 0.16 * speaking))
      ctx.beginPath()
      ctx.moveTo(na.px, na.py)
      ctx.lineTo(nb.px, nb.py)
      ctx.stroke()
    }

    for (var n2 = 0; n2 < NEURAL_NODES.length; n2++) {
      var node = NEURAL_NODES[n2]
      var nDepth = clamp((1.15 - node.pz / (sphereR * 1.35)) * 0.75, 0.12, 1)
      var nGlow = 0.55 + 0.45 * Math.sin(t * 0.005 + node.ph)
      var nRad = (1.1 + 1.7 * nDepth) * node.scale * (speaking ? 1.18 : 1)
      var isGoldNode = node.gold || flare > 0.45
      ctx.fillStyle = rgba(isGoldNode ? ACCENT2 : ACCENT, nDepth * (0.55 + 0.4 * nGlow))
      ctx.beginPath()
      ctx.arc(node.px, node.py, nRad, 0, TAU)
      ctx.fill()
      if (nDepth > 0.72) {
        ctx.fillStyle = 'rgba(255,255,255,' + (0.55 * nDepth).toFixed(2) + ')'
        ctx.beginPath()
        ctx.arc(node.px, node.py, nRad * 0.42, 0, TAU)
        ctx.fill()
      }
    }

    /* 3) 外圈 Mark VII 精密 HUD 刻度与径向声纹频谱 */
    ctx.lineWidth = 1.2
    ctx.strokeStyle = rgba(ACCENT, 0.52 + 0.25 * flare)
    drawArcs(ctx, R * 1.02, 4, 0.2, rot1)

    ctx.save()
    ctx.font = '600 ' + Math.max(7, Math.round(R * 0.044)) + 'px ui-monospace, SF Mono, Menlo, monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = rgba(ACCENT, 0.62)
    var degLabels = ['000°', '090°', '180°', '270°']
    for (var dl = 0; dl < 4; dl++) {
      var da2 = dl * (Math.PI / 2) - Math.PI / 2 + rot1 * 0.22
      ctx.fillText(degLabels[dl], Math.cos(da2) * (R * 1.11), Math.sin(da2) * (R * 1.11))
    }
    ctx.restore()

    ctx.lineWidth = 1
    for (var k = 0; k < 120; k++) {
      var ang = (k / 120) * TAU + rot2
      var major = k % 10 === 0
      var mid = k % 5 === 0
      var inner = R * 0.985
      var outer = inner - (major ? 11 : mid ? 6 : 3.5)
      ctx.strokeStyle = major ? rgba(ACCENT2, 0.68) : rgba(ACCENT, 0.34)
      ctx.beginPath()
      ctx.moveTo(Math.cos(ang) * inner, Math.sin(ang) * inner)
      ctx.lineTo(Math.cos(ang) * outer, Math.sin(ang) * outer)
      ctx.stroke()
    }

    var sweepA = t * 0.00105
    var trailSteps = 10
    for (var ts2 = 0; ts2 < trailSteps; ts2++) {
      var f = ts2 / trailSteps
      ctx.strokeStyle = rgba(ACCENT, 0.13 * (1 - f))
      ctx.lineWidth = R * 0.14
      ctx.beginPath()
      ctx.arc(0, 0, R * 0.89, sweepA - f * 0.5, sweepA - (f - 1 / trailSteps) * 0.5)
      ctx.stroke()
    }

    var barCount = 64
    var voiceBaseR = R * 0.72
    for (var b = 0; b < barCount; b++) {
      var ba = (b / barCount) * TAU + rot1 * 0.45
      var wave = Math.abs(Math.sin(t * 0.013 + b * 0.58) * Math.cos(t * 0.007 - b * 0.29))
      var amp = speaking ? (0.025 + 0.125 * wave) : (0.012 + 0.026 * wave * (0.65 + flare))
      ctx.lineWidth = 1.5
      ctx.strokeStyle = speaking ? rgba(ACCENT2, 0.65 + 0.3 * wave) : rgba(ACCENT, 0.34 + 0.24 * flare)
      ctx.beginPath()
      ctx.moveTo(Math.cos(ba) * voiceBaseR, Math.sin(ba) * voiceBaseR)
      ctx.lineTo(Math.cos(ba) * (voiceBaseR + R * amp), Math.sin(ba) * (voiceBaseR + R * amp))
      ctx.stroke()
    }

    if (state.progress > 0.5) {
      var pStart = -Math.PI / 2
      var pEnd = pStart + TAU * (state.progress / 100)
      ctx.lineWidth = 2.2
      ctx.strokeStyle = rgba(ACCENT2, 0.88)
      ctx.beginPath()
      ctx.arc(0, 0, R * 1.045, pStart, pEnd)
      ctx.stroke()
      var headX = Math.cos(pEnd) * R * 1.045
      var headY = Math.sin(pEnd) * R * 1.045
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(headX - 2.2, headY - 2.2, 4.4, 4.4)
    }

    /* 4) 身份核验阶段：3D 生物锁定扫描 + 四角战术锁定括号 */
    if (state.scan) {
      var s0 = t * 0.0021
      ctx.lineWidth = 2.6
      ctx.strokeStyle = rgba(ACCENT, 0.8)
      ctx.beginPath()
      ctx.arc(0, 0, R * 0.93, s0, s0 + 1.25)
      ctx.stroke()

      ctx.lineWidth = 1.6
      ctx.strokeStyle = rgba(ACCENT2, 0.78)
      ctx.beginPath()
      ctx.arc(0, 0, R * 0.82, -s0 * 1.3, -s0 * 1.3 + 1.05)
      ctx.stroke()

      ctx.lineWidth = 1.2
      ctx.strokeStyle = rgba(ACCENT2, 0.62)
      drawPolygon(ctx, R * 0.42, 6, s0 * 0.45)

      var scanY = Math.sin(t * 0.0036) * R * 0.52
      var scanGrad = ctx.createLinearGradient(-R * 0.52, scanY, R * 0.52, scanY)
      scanGrad.addColorStop(0, rgba(ACCENT, 0))
      scanGrad.addColorStop(0.5, rgba(ACCENT, 0.85))
      scanGrad.addColorStop(1, rgba(ACCENT, 0))
      ctx.strokeStyle = scanGrad
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(-R * 0.52, scanY)
      ctx.lineTo(R * 0.52, scanY)
      ctx.stroke()

      var brk = R * (0.56 + 0.04 * Math.sin(t * 0.006))
      var brkLen = R * 0.11
      ctx.lineWidth = 1.8
      ctx.strokeStyle = rgba(ACCENT2, 0.82)
      for (var qx = -1; qx <= 1; qx += 2) {
        for (var qy = -1; qy <= 1; qy += 2) {
          ctx.beginPath()
          ctx.moveTo(qx * brk, qy * (brk - brkLen))
          ctx.lineTo(qx * brk, qy * brk)
          ctx.lineTo(qx * (brk - brkLen), qy * brk)
          ctx.stroke()
        }
      }
    }

    /* 5) 反应炉中心能量核心 */
    var coreR = R * (0.11 + 0.02 * pulse + 0.055 * flare + 0.02 * speaking)
    var coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR * 2.8)
    coreGrad.addColorStop(0, 'rgba(255,255,255,0.98)')
    coreGrad.addColorStop(0.28, rgba(ACCENT, 0.92))
    coreGrad.addColorStop(0.65, rgba(ACCENT2, 0.2 + 0.25 * flare))
    coreGrad.addColorStop(1, rgba(ACCENT, 0))
    ctx.fillStyle = coreGrad
    ctx.beginPath()
    ctx.arc(0, 0, coreR * 2.8, 0, TAU)
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(0, 0, coreR * 0.38, 0, TAU)
    ctx.fill()

    if (elapsed < 280) {
      ctx.fillStyle = 'rgba(255,255,255,' + (0.62 * (1 - elapsed / 280)).toFixed(3) + ')'
      ctx.beginPath()
      ctx.arc(0, 0, R * 1.15, 0, TAU)
      ctx.fill()
    }

    ctx.restore()
  }

  /* ── 电影级文字解码动效（Scramble Decode） ──────────────────────────────── */

  var DECODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/:#'
  var decodeTimer = 0

  function decodeText(el, target) {
    if (decodeTimer) { clearInterval(decodeTimer); decodeTimer = 0 }
    if (reduced || !target) {
      el.textContent = target || ''
      return
    }
    var frame = 0
    var total = 14
    decodeTimer = setInterval(function () {
      frame++
      var out = ''
      var locked = Math.floor((frame / total) * target.length)
      for (var idx = 0; idx < target.length; idx++) {
        var ch = target[idx]
        if (idx < locked || ch === ' ' || ch === '.' || ch === ',') out += ch
        else out += DECODE_CHARS[Math.floor(Math.random() * DECODE_CHARS.length)]
      }
      el.textContent = out
      if (frame >= total) {
        clearInterval(decodeTimer)
        decodeTimer = 0
        el.textContent = target
      }
    }, 26)
  }

  /* ── 音效（反应炉点火 + 钛金面甲锁扣 + 低频环境底噪呼吸声） ────────────── */

  var AC = null
  var audioFailed = false
  var audioUnlocked = false
  var humNodes = null

  function audio() {
    if (!cfg.sound || audioFailed || !audioUnlocked) return null
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) { audioFailed = true; return null }
      if (!AC) AC = new Ctx()
      if (AC.state === 'suspended' && AC.resume) AC.resume()
      return AC
    } catch (err) {
      audioFailed = true
      return null
    }
  }

  function startAmbientHum() {
    if (!cfg.ambientHum || humNodes || finished) return
    var ctx = audio()
    if (!ctx) return
    try {
      var now = ctx.currentTime
      var osc1 = ctx.createOscillator()
      var osc2 = ctx.createOscillator()
      var filter = ctx.createBiquadFilter()
      var gain = ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(55, now)
      osc2.type = 'triangle'
      osc2.frequency.setValueAtTime(110, now)
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(190, now)
      var level = Math.max(0.0001, 0.032 * clamp(cfg.sfxVolume, 0, 1))
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(level, now + 0.9)
      osc1.connect(filter)
      osc2.connect(filter)
      filter.connect(gain).connect(ctx.destination)
      osc1.start(now)
      osc2.start(now)
      humNodes = { osc1: osc1, osc2: osc2, gain: gain }
    } catch (err) { /* noop */ }
  }

  function stopAmbientHum() {
    if (!humNodes || !AC) return
    try {
      var now = AC.currentTime
      humNodes.gain.gain.cancelScheduledValues(now)
      humNodes.gain.gain.setTargetAtTime(0.0001, now, 0.06)
      var n = humNodes
      humNodes = null
      setTimeout(function () {
        try { n.osc1.stop(); n.osc2.stop() } catch (e) { /* noop */ }
      }, 240)
    } catch (err) {
      humNodes = null
    }
  }

  function envGain(ctx, gainValue, start, dur, attack) {
    var g = ctx.createGain()
    var v = Math.max(0.0001, gainValue * clamp(cfg.sfxVolume, 0, 1))
    g.gain.setValueAtTime(0.0001, start)
    g.gain.exponentialRampToValueAtTime(v, start + (attack || 0.02))
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    return g
  }

  function tone(freq, dur, type, gain, slideTo) {
    var ctx = audio()
    if (!ctx) return
    try {
      var now = ctx.currentTime
      var osc = ctx.createOscillator()
      osc.type = type || 'sine'
      osc.frequency.setValueAtTime(freq, now)
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + dur)
      var g = envGain(ctx, gain || 0.06, now, dur)
      osc.connect(g).connect(ctx.destination)
      osc.start(now)
      osc.stop(now + dur + 0.02)
    } catch (err) { /* noop */ }
  }

  function noise(dur, gain, from, to) {
    var ctx = audio()
    if (!ctx) return
    try {
      var now = ctx.currentTime
      var len = Math.floor(ctx.sampleRate * dur)
      var buf = ctx.createBuffer(1, len, ctx.sampleRate)
      var data = buf.getChannelData(0)
      for (var i4 = 0; i4 < len; i4++) data[i4] = Math.random() * 2 - 1
      var src = ctx.createBufferSource()
      src.buffer = buf
      var filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.Q.value = 1.1
      filter.frequency.setValueAtTime(from, now)
      filter.frequency.exponentialRampToValueAtTime(to, now + dur)
      var g = envGain(ctx, gain, now, dur, 0.08)
      src.connect(filter).connect(g).connect(ctx.destination)
      src.start(now)
      src.stop(now + dur + 0.02)
    } catch (err) { /* noop */ }
  }

  var sfx = {
    visor: function () {
      /* 钛金面甲合拢锁扣声 */
      tone(190, 0.12, 'sawtooth', 0.055, 72)
      noise(0.14, 0.045, 2400, 620)
    },
    ignite: function () {
      if (useVisor) sfx.visor()
      startAmbientHum()
      tone(44, 1.8, 'sine', 0.08, 110)
      tone(62, 1.45, 'sawtooth', 0.045, 480)
      tone(124, 1.25, 'triangle', 0.04, 960)
      noise(1.2, 0.04, 160, 3200)
      setTimeout(function () { tone(1320, 0.26, 'sine', 0.025, 1760) }, 420)
    },
    tick: function () { tone(2200, 0.03, 'square', 0.016) },
    blip: function () { tone(760, 0.09, 'sine', 0.05, 1180) },
    prompt: function () {
      tone(540, 0.1, 'sine', 0.05)
      setTimeout(function () { tone(810, 0.12, 'sine', 0.048) }, 110)
      setTimeout(function () { tone(1080, 0.16, 'sine', 0.036) }, 220)
    },
    confirm: function () {
      tone(520, 0.22, 'sine', 0.065, 1040)
      setTimeout(function () { tone(1040, 0.18, 'triangle', 0.045, 1560) }, 110)
      setTimeout(function () { tone(1560, 0.34, 'sine', 0.04) }, 210)
      noise(0.28, 0.024, 900, 4800)
    },
    welcome: function () {
      tone(261.63, 1.1, 'sine', 0.04)
      setTimeout(function () { tone(392, 1.0, 'sine', 0.038) }, 70)
      setTimeout(function () { tone(523.25, 0.95, 'sine', 0.034) }, 140)
      setTimeout(function () { tone(659.25, 0.95, 'sine', 0.028) }, 220)
    },
    skip: function () { tone(300, 0.08, 'square', 0.03, 160) }
  }

  function unlockAudio() {
    audioUnlocked = true
    audio()
    startAmbientHum()
    root.removeEventListener('pointerdown', unlockAudio)
    root.removeEventListener('keydown', unlockAudio)
  }
  root.addEventListener('pointerdown', unlockAudio)
  root.addEventListener('keydown', unlockAudio)
  document.addEventListener('pointerdown', unlockAudio, { once: true })
  document.addEventListener('keydown', unlockAudio, { once: true })

  /* ── 语音 ───────────────────────────────────────────────────────────────── */

  var synth = window.speechSynthesis
  var voice = null
  var currentUtterance = null
  var speechTimer = 0
  var speechSeq = 0
  var speechBusy = false
  var speechStartedAt = 0

  function scoreVoice(v) {
    var n = String(v.name || '').toLowerCase()
    var l = String(v.lang || '').toLowerCase()
    var s = 0
    if (l.indexOf('en-gb') === 0) s += 40
    else if (l.indexOf('en') === 0) s += 14
    if (/daniel|arthur|oliver|george|ryan|guy|male/.test(n)) s += 26
    if (/female|samantha|karen|moira|tessa|victoria|serena|zira|susan|kate/.test(n)) s -= 22
    if (v.localService) s += 4
    return s
  }

  function loadVoices() {
    if (!synth || typeof synth.getVoices !== 'function') return
    var list = []
    try { list = synth.getVoices() || [] } catch (err) { list = [] }
    if (!list.length) return
    var wanted = null
    if (cfg.voiceName) {
      for (var i5 = 0; i5 < list.length; i5++) {
        if (list[i5].name === cfg.voiceName) { wanted = list[i5]; break }
      }
    }
    if (!wanted) {
      var best = -999
      for (var j = 0; j < list.length; j++) {
        var sc = scoreVoice(list[j])
        if (sc > best) { best = sc; wanted = list[j] }
      }
    }
    voice = wanted
  }

  if (synth) {
    loadVoices()
    if (typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', loadVoices)
    else synth.onvoiceschanged = loadVoices
  }

  function cancelSpeech() {
    speechSeq++
    speechBusy = false
    currentUtterance = null
    if (speechTimer) {
      clearTimeout(speechTimer)
      speechTimer = 0
    }
    try { if (synth && synth.cancel) synth.cancel() } catch (err) { /* noop */ }
  }

  function isVoiceBusy(maxWaitMs) {
    if (!cfg.voice || !synth) return false
    var active = speechBusy || !!(synth.speaking || synth.pending)
    if (!active) return false
    if (speechStartedAt && performance.now() - speechStartedAt > (maxWaitMs || 4800)) {
      speechBusy = false
      return false
    }
    return true
  }

  function speak(text, opts) {
    if (!text) return
    var now = performance.now()
    speakingUntil = Math.max(speakingUntil, now + 1850)
    if (!cfg.voice || !synth) return
    try {
      var mySeq = ++speechSeq
      if (speechTimer) {
        clearTimeout(speechTimer)
        speechTimer = 0
      }
      speechBusy = true
      speechStartedAt = now
      var interrupt = !!(opts && opts.interrupt)
      var say = function () {
        speechTimer = 0
        if (finished || mySeq !== speechSeq) return
        try {
          if (interrupt && synth.cancel) synth.cancel()
          var u = new SpeechSynthesisUtterance(text)
          u.rate = clamp(cfg.voiceRate, 0.5, 2)
          u.pitch = clamp(cfg.voicePitch, 0, 2)
          u.volume = clamp(cfg.voiceVolume, 0, 1)
          u.lang = voice && voice.lang ? voice.lang : 'en-GB'
          if (voice) u.voice = voice
          currentUtterance = u
          u.onstart = function () {
            if (mySeq !== speechSeq) return
            speechStartedAt = performance.now()
            speakingUntil = speechStartedAt + 6000
          }
          u.onend = function () {
            if (mySeq !== speechSeq) return
            speechBusy = false
            currentUtterance = null
            speakingUntil = performance.now() + 180
          }
          u.onerror = function () {
            if (mySeq !== speechSeq) return
            speechBusy = false
            currentUtterance = null
            speakingUntil = 0
          }
          synth.speak(u)
        } catch (err) {
          if (mySeq === speechSeq) speechBusy = false
        }
      }
      var lead = clamp(cfg.voiceLead, 0, 1200)
      if (lead > 0) speechTimer = setTimeout(say, lead)
      else say()
    } catch (err) {
      speechBusy = false
    }
  }

  /* ── 时间线 ─────────────────────────────────────────────────────────────── */

  var BASE = {
    brand: 520,
    p1: 1500,
    p1b: 2400,
    p2: 3300,
    p2b: 4300,
    p3: 5100,
    gate: 5900,
    welcome: 7900,
    split: 9500,
    off: 9860,
    end: 10620
  }

  var PHASES = {
    p1: {
      en: GREET.en + ', ' + String(cfg.callsign || 'SIR').toUpperCase() + '.',
      zh: GREET.zh,
      label: '[ 01 / 05 ] POWER UP',
      voice: GREET.voice + ', ' + String(cfg.callsign || 'sir').toLowerCase() + '. Power systems are online.'
    },
    p2: {
      en: 'INITIALIZING SYSTEMS.',
      zh: '正在加载内核模块、会话图与工具总线。',
      label: '[ 02 / 05 ] DIAGNOSTICS',
      voice: 'Initializing all systems, ' + String(cfg.callsign || 'sir').toLowerCase() + '.'
    },
    p3: {
      en: 'OPERATOR IDENTIFICATION.',
      zh: '检测到操作者，请确认身份以继续。',
      label: '[ 03 / 05 ] IDENTITY',
      voice: 'Operator identification. Please confirm, ' + String(cfg.callsign || 'sir').toLowerCase() + '.'
    },
    p3b: {
      en: 'IDENTITY CONFIRMED.',
      zh: '',
      label: '[ 04 / 05 ] CLEARANCE',
      voice: 'Identity confirmed, ' + String(cfg.callsign || 'sir').toLowerCase() + '. Welcome.'
    },
    p4: {
      en: '',
      zh: '',
      label: '[ 05 / 05 ] WELCOME',
      voice: 'Welcome back, ' + String(cfg.callsign || 'sir').toLowerCase() + '. All systems are online.'
    }
  }

  var LOG = [
    ['ARC REACTOR', 'STABLE', '100%'],
    ['NEURAL LATTICE', realCores + ' CORES', realRtt],
    ['SESSION GRAPH', 'RESTORED', '0.4s'],
    ['TOOL BUS', 'MOUNTED', 'READY'],
    ['MODEL ROUTER', realNetLabel, 'ROUTED'],
    ['MEMORY LATTICE', 'INDEXED', 'OK'],
    ['ENCRYPTION', 'AES-256', 'SECURE'],
    ['HUD', 'CALIBRATED', '60FPS']
  ]

  var elapsed = 0
  var paused = false
  var confirmed = false
  var finished = false
  var progress = 0
  var phase = 'p0'
  var flare = 0
  var logIndex = 0
  var raf = 0
  var lastTs = 0
  var lastHexTs = 0
  var lastClockTs = 0

  function setProgress(v, silent) {
    progress = clamp(v, 0, 100)
    barFill.style.width = progress + '%'
    pctEl.textContent = Math.round(progress) + '%'
    if (!silent && progress > 0) sfx.tick()
  }

  function lightMatrix(count, gold) {
    for (var m = 0; m < matrixCells.length; m++) {
      if (m < count) {
        matrixCells[m].classList.add('is-lit')
        if (gold) matrixCells[m].classList.add('is-gold')
      }
    }
  }

  function updateTelemetry(temp, busPct, hullPct) {
    if (telText.temp && temp) telText.temp.textContent = temp
    if (telBars.temp && temp) telBars.temp.style.width = clamp(parseInt(temp, 10) / 3.5, 10, 100) + '%'
    if (telText.bus && busPct !== undefined) {
      telText.bus.textContent = busPct + '%'
      if (telBars.bus) telBars.bus.style.width = busPct + '%'
    }
    if (telText.hull && hullPct !== undefined) {
      telText.hull.textContent = hullPct + '%'
      if (telBars.hull) telBars.hull.style.width = hullPct + '%'
    }
  }

  function updateEqAndHex(t) {
    var active = t < speakingUntil
    if (telText.vox) telText.vox.textContent = active ? 'ACTIVE' : 'STANDBY'
    if (eqBars && eqBars.length) {
      for (var e = 0; e < eqBars.length; e++) {
        var v = active
          ? 24 + Math.round(76 * Math.abs(Math.sin(t * 0.017 + e * 0.65)))
          : 12 + Math.round(28 * Math.abs(Math.sin(t * 0.0032 + e * 0.5)))
        eqBars[e].style.height = v + '%'
        eqBars[e].style.opacity = active ? '0.95' : '0.45'
        eqBars[e].style.background = active ? 'var(--accent2)' : 'var(--accent)'
      }
    }
    if (telText.hex && t - lastHexTs > 220) {
      lastHexTs = t
      var h1 = (0x1000 + Math.floor(Math.random() * 0xefff)).toString(16).toUpperCase()
      var h2 = (0x1000 + Math.floor(Math.random() * 0xefff)).toString(16).toUpperCase()
      var syn = (96 + Math.random() * 3.9).toFixed(1)
      telText.hex.innerHTML = '0x' + h1 + ' · ' + syn + '% · ' + (active ? 'VOX' : 'SYNC') + '<br>0x' + h2 + ' · NODES ' + NEURAL_NODES.length + '/' + NEURAL_NODES.length
    }
    if (t - lastClockTs > 1000) {
      lastClockTs = t
      updateClock()
    }
  }

  function setPhase(key, opts) {
    var p = PHASES[key]
    if (!p) return
    phase = key
    if (p.en) {
      phaseEl.classList.add('is-on')
      phaseZh.textContent = p.zh
      phaseEn.classList.remove('jv-in')
      void phaseEn.offsetWidth
      phaseEn.classList.add('jv-in')
      decodeText(phaseEn, p.en)
    }
    if (opts && opts.zh) phaseZh.textContent = opts.zh
    phaseLabel.textContent = p.label
    if (opts && opts.voice !== false && p.voice) speak(p.voice, { interrupt: !!(opts && opts.interrupt) })
    if (key !== 'p3') hideAuth()
  }

  function showAuth() {
    authEl.classList.add('is-on')
    authBtn.focus({ preventScroll: true })
    sfx.prompt()
  }

  function hideAuth() {
    authEl.classList.remove('is-on')
  }

  function appendLog(entry) {
    var row = document.createElement('div')
    row.className = 'jv-log-line'
    var i6 = document.createElement('i')
    i6.textContent = '>'
    var b = document.createElement('b')
    b.textContent = entry[0]
    var s = document.createElement('s')
    s.textContent = entry[1] + '  ' + entry[2]
    row.appendChild(i6)
    row.appendChild(b)
    row.appendChild(s)
    logLines.appendChild(row)
    while (logLines.children.length > 4) logLines.removeChild(logLines.firstChild)
    sfx.tick()
  }

  function nextLog() {
    if (logIndex >= LOG.length) return
    appendLog(LOG[logIndex])
    logIndex++
  }

  function setStat(key, text) {
    if (stats[key]) stats[key].textContent = text
  }

  function confirmIdentity() {
    if (confirmed || finished) return
    confirmed = true
    paused = false
    hideAuth()
    sfx.confirm()
    identEl.textContent = String(cfg.identity || 'OPERATOR').toUpperCase()
    setPhase('p3b', {
      zh: String(cfg.identity || 'OPERATOR') + '  ·  CLEARANCE ' + String(cfg.clearance || 'ALPHA'),
      interrupt: true
    })
    setProgress(82)
    lightMatrix(8, true)
    updateTelemetry('312 K', 96, realBatteryPct !== null ? realBatteryPct : 100)
  }

  function showWelcome() {
    setPhase('p4')
    phaseEl.style.opacity = '0'
    welcomeEl.classList.add('is-on')
    brandEl.style.transition = 'opacity 520ms ease'
    brandEl.style.opacity = '0.42'
    setProgress(100, true)
    sfx.welcome()
  }

  function beginExit() {
    if (finished) return
    root.classList.add('is-split')
  }

  function shutdown() {
    if (finished) return
    root.classList.add('is-off')
  }

  function onPointerMove(e) {
    if (reduced || finished || PARALLAX <= 0) return
    pointerNX = (e.clientX / (window.innerWidth || 1280) - 0.5) * 2
    pointerNY = (e.clientY / (window.innerHeight || 800) - 0.5) * 2
    root.style.setProperty('--tilt-x', (pointerNX * 2.0 * PARALLAX).toFixed(2) + 'deg')
    root.style.setProperty('--tilt-y', (-pointerNY * 1.6 * PARALLAX).toFixed(2) + 'deg')
    if (telText.azm) {
      var azm = ((pointerNX * 24 + 360) % 360).toFixed(1).padStart(5, '0')
      var elv = (-pointerNY * 16).toFixed(1)
      telText.azm.textContent = 'AZM ' + azm + '° · ELV ' + (Number(elv) >= 0 ? '+' : '') + elv + '°'
    }
  }

  function finish(forceCancelVoice) {
    if (finished) return
    finished = true
    try { if (raf) cancelAnimationFrame(raf) } catch (err) { /* noop */ }
    try { if (decodeTimer) clearInterval(decodeTimer) } catch (err) { /* noop */ }
    try { document.removeEventListener('keydown', onKey, true) } catch (err) { /* noop */ }
    try { window.removeEventListener('resize', onResize) } catch (err) { /* noop */ }
    try { window.removeEventListener('pointermove', onPointerMove) } catch (err) { /* noop */ }
    stopAmbientHum()
    if (forceCancelVoice) cancelSpeech()
    else if (speechTimer) { clearTimeout(speechTimer); speechTimer = 0 }
    try {
      if (AC && AC.close) setTimeout(function () { try { AC.close() } catch (e) {} }, 260)
    } catch (err) { /* noop */ }
    try {
      document.documentElement.classList.remove('jv-lock')
      if (document.body) document.body.style.overflow = ''
    } catch (err) { /* noop */ }
    try {
      root.parentNode && root.parentNode.removeChild(root)
    } catch (err) { /* noop */ }
    window.__DSH_JARVIS_RUNNING__ = false
  }

  function skip() {
    if (finished || !cfg.allowSkip) return
    if (confirmed === false && paused) {
      confirmed = true
      paused = false
    }
    cancelSpeech()
    stopAmbientHum()
    sfx.skip()
    setProgress(100, true)
    root.classList.add('is-split')
    setTimeout(shutdown, 150)
    setTimeout(function () { finish(true) }, 1150)
  }

  /* 交互 */
  authBtn.addEventListener('click', function () { confirmIdentity() })
  skipBtn.addEventListener('click', function () { skip() })

  function onKey(e) {
    if (finished) return
    var key = e.key
    if (key === 'Escape') {
      if (cfg.allowSkip) {
        e.preventDefault()
        skip()
      }
      return
    }
    if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
      if (confirmed) return
      if (authEl.classList.contains('is-on') || paused) {
        e.preventDefault()
        confirmIdentity()
      }
    }
  }
  document.addEventListener('keydown', onKey, true)

  /* 播放标记：一旦真的开始播，就按模式记这一次 */
  try {
    if (cfg.mode === 'session') sessionStorage.setItem(FLAG_SHOWN, '1')
    if (cfg.mode === 'daily') localStorage.setItem(FLAG_DAY, new Date().toISOString().slice(0, 10))
  } catch (err) { /* 隐私模式下可能抛，忽略 */ }

  /* 首帧前先拿住 canvas 上下文 */
  fitCanvas()
  ringCtx = canvas.getContext('2d')

  root.classList.remove('jv-boot')
  root.classList.add('jv-live')
  try {
    if (document.body) document.body.style.overflow = 'hidden'
    document.documentElement.classList.add('jv-lock')
  } catch (err) { /* noop */ }

  function onResize() {
    fitCanvas()
    drawRing(performance.now(), elapsed, { progress: progress, flare: flare, scan: !confirmed && paused })
  }
  window.addEventListener('resize', onResize)
  if (!reduced) window.addEventListener('pointermove', onPointerMove, { passive: true })

  /* 降低动态：直接进终幕，短暂停留后揭幕 */
  if (reduced) {
    root.classList.add('jv-flat')
    setProgress(100, true)
    lightMatrix(8, true)
    updateTelemetry('312 K', 100, realBatteryPct !== null ? realBatteryPct : 100)
    phaseEl.style.opacity = '0'
    welcomeEl.classList.add('is-on')
    welcomeName.textContent = String(cfg.identity || 'OPERATOR')
    var em2 = document.createElement('em')
    em2.textContent = '· ' + String(cfg.clearance || 'ALPHA')
    welcomeName.appendChild(em2)
    drawRing(performance.now(), 1200, { progress: 100, flare: 0, scan: false })
    setTimeout(shutdown, 1500)
    setTimeout(function () { finish(false) }, 2000)
    return
  }

  sfx.ignite()
  updateTelemetry('294 K', 18, realBatteryPct !== null ? realBatteryPct : 92)

  function shouldWaitVoice(nextE) {
    if (!isVoiceBusy(4800)) return false
    if (phase === 'p1' && nextE >= BASE.p2) return true
    if (phase === 'p2' && nextE >= BASE.p3) return true
    if (phase === 'p3b' && nextE >= BASE.welcome) return true
    if (phase === 'p4' && nextE >= BASE.split) return true
    return false
  }

  function tick(E) {
    if (E >= BASE.brand && logIndex === 0) {
      nextLog()
      if (!realLowPower) setStat('arc', realBatteryPct !== null ? realBatteryPct + '%' : '34.2%')
      lightMatrix(2, false)
      updateTelemetry('298 K', 34, realBatteryPct !== null ? realBatteryPct : 96)
    }
    if (E >= BASE.p1 && phase === 'p0') {
      setPhase('p1')
      setProgress(12)
      nextLog()
      if (!realLowPower) setStat('arc', realBatteryPct !== null ? realBatteryPct + '%' : '87.1%')
      lightMatrix(4, false)
      updateTelemetry('302 K', 56, realBatteryPct !== null ? realBatteryPct : 98)
    }
    if (E >= BASE.p1b && logIndex === 2) {
      nextLog()
      setProgress(22)
    }
    if (E >= BASE.p2 && phase === 'p1') {
      setPhase('p2')
      setProgress(38)
      nextLog()
      if (!realLowPower) setStat('arc', realBatteryPct !== null ? realBatteryPct + '%' : '100.0%')
      setStat('pwr', '2.11 GW')
      setStat('link', realNetLabel === 'OFFLINE' ? 'LOCAL' : 'SECURE')
      lightMatrix(6, false)
      updateTelemetry('307 K', 78, realBatteryPct !== null ? realBatteryPct : 100)
    }
    if (E >= BASE.p2b && logIndex === 4) {
      nextLog()
      setProgress(52)
      setStat('pwr', '3.24 GW')
    }
    if (E >= BASE.p3 && phase === 'p2') {
      setPhase('p3')
      setProgress(62)
      nextLog()
      lightMatrix(7, false)
      updateTelemetry('309 K', 88, realBatteryPct !== null ? realBatteryPct : 100)
      showAuth()
      if (!cfg.requireInteraction) {
        setTimeout(function () { if (!confirmed) confirmIdentity() }, 900)
      }
    }
    if (E >= BASE.gate && !confirmed && cfg.requireInteraction && !paused) {
      paused = true
      if (root.querySelector('.jv-auth')) authBtn.focus({ preventScroll: true })
    }
    if (E >= BASE.welcome && phase === 'p3b') {
      showWelcome()
    }
    if (E >= BASE.split) {
      beginExit()
    }
    if (E >= BASE.off) {
      shutdown()
    }
    if (E >= BASE.end) {
      finish(false)
    }
  }

  function loop(ts) {
    if (finished) return
    if (!lastTs) lastTs = ts
    var dt = Math.min(64, Math.max(0, ts - lastTs))
    lastTs = ts
    if (!paused) {
      var nextE = elapsed + dt * SPEED
      if (!shouldWaitVoice(nextE)) {
        elapsed = nextE
        tick(elapsed)
      }
    }
    if (elapsed > BASE.welcome - 400 && phase === 'p3b') {
      flare = Math.min(1, flare + dt / 600)
    }
    updateEqAndHex(ts)
    drawRing(ts, elapsed, {
      progress: progress,
      flare: flare,
      scan: !confirmed && (paused || phase === 'p3')
    })
    raf = requestAnimationFrame(loop)
  }

  raf = requestAnimationFrame(loop)
})()
