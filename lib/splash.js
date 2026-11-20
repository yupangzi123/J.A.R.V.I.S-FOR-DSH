/* ============================================================================
 * dsh-jarvis-startup — 浏览器运行时
 * ----------------------------------------------------------------------------
 * 一段约 10 秒的全息开机序列：方舟反应炉点火 → 品牌浮现 → 系统自检 →
 * 身份核验（可交互）→ 欢迎语 → RGB 分裂与 CRT 收束揭幕。
 *
 * 全部素材都是现场生成的：图形由 canvas 绘制，音效由 WebAudio 合成，
 * 台词由浏览器语音合成（优先英式男声）念出。没有任何影视音视频文件。
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
    identity: 'LINKS',
    callsign: 'SIR',
    clearance: 'ALPHA',
    brand: 'J.A.R.V.I.S.',
    subtitle: 'JUST A RATHER VERY INTELLIGENT SYSTEM',
    footer: 'MARK VII // MALIBU POINT',
    welcomeLine: 'WELCOME BACK',
    sound: true,
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
    mark3: { accent: '#ffc46b', accent2: '#8fe9ff' }
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
    // 主题预设：只有用户没改过主色时才接管，避免覆盖自定义配色
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

  /* ── DOM ────────────────────────────────────────────────────────────────── */

  var tpl = [
    '<div class="jv-backdrop"></div>',
    '<div class="jv-grid"></div>',
    '<div class="jv-axis"></div>',
    '<div class="jv-scanlines"></div>',
    '<div class="jv-vignette"></div>',
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
    '      </div>',
    '      <button type="button" class="jv-skip">SKIP</button>',
    '    </div>',
    '  </header>',
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

  var stage = root.querySelector('.jv-stage')
  var canvas = root.querySelector('.jv-canvas')
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
    link: root.querySelector('[data-k="link"]')
  }

  /* 玻璃 / 扫描线 / 主题变量 */
  if (cfg.glass) root.classList.add('jv-glass')
  if (!cfg.scanlines) root.classList.add('jv-flat')
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

  /* 尺寸：环形反应炉的直径同时决定 canvas 与文案的纵向位置 */
  function ringSize() {
    var vw = window.innerWidth || 1280
    var vh = window.innerHeight || 800
    var w = Math.min(vh * 0.4, vw * 0.74, 400)
    if (vw <= 720) w = Math.min(vw * 0.72, 300, vh * 0.42)
    return Math.max(180, Math.round(w))
  }

  var ringPx = ringSize()
  root.style.setProperty('--ring', ringPx + 'px')

  function fitCanvas() {
    var dpr = Math.min(2, window.devicePixelRatio || 1)
    var next = ringSize()
    if (next !== ringPx) {
      ringPx = next
      root.style.setProperty('--ring', ringPx + 'px')
    }
    canvas.width = Math.round(ringPx * dpr)
    canvas.height = Math.round(ringPx * dpr)
    canvas.style.width = ringPx + 'px'
    canvas.style.height = ringPx + 'px'
    var ctx = canvas.getContext('2d')
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  /* ── 反应炉绘制 ─────────────────────────────────────────────────────────── */

  var ringCtx = null
  var particles = []
  ;(function seedParticles() {
    var n = 44
    for (var i2 = 0; i2 < n; i2++) {
      particles.push({
        a: Math.random() * TAU,
        s: (Math.random() * 0.5 + 0.15) * (Math.random() < 0.5 ? -1 : 1),
        r: Math.random(),
        o: Math.random() * 0.55 + 0.15,
        ph: Math.random() * TAU
      })
    }
  })()

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

  function drawRing(t, elapsed, state) {
    if (!ringCtx) return
    var ctx = ringCtx
    var size = ringPx
    var R = size / 2 - 6
    var cx = size / 2
    var cy = size / 2
    var pulse = 0.5 + 0.5 * Math.sin(t * 0.0021)
    var ignite = clamp((elapsed - 40) / 900, 0, 1)
    var ease = 1 - Math.pow(1 - ignite, 3)
    var flare = state.flare || 0

    ctx.clearRect(0, 0, size, size)
    if (ease <= 0.001) return

    ctx.save()
    ctx.translate(cx, cy)
    ctx.globalCompositeOperation = 'lighter'
    ctx.scale(0.55 + 0.45 * ease, 0.55 + 0.45 * ease)
    ctx.globalAlpha = ease

    /* 环境辉光 */
    var glow = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 1.06)
    glow.addColorStop(0, rgba(ACCENT, 0.12 + 0.1 * flare))
    glow.addColorStop(0.5, rgba(ACCENT, 0.035 + 0.03 * flare))
    glow.addColorStop(1, rgba(ACCENT, 0))
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(0, 0, R * 1.06, 0, TAU)
    ctx.fill()

    var rot1 = t * 0.00006
    var rot2 = -t * 0.00013
    var rot3 = t * 0.00021

    /* 外环：四段弧 */
    ctx.lineWidth = 1.2
    ctx.strokeStyle = rgba(ACCENT, 0.5 + 0.25 * flare)
    drawArcs(ctx, R * 0.985, 4, 0.24, rot1)

    /* 刻度环 */
    ctx.lineWidth = 1
    ctx.strokeStyle = rgba(ACCENT, 0.42)
    for (var k = 0; k < 96; k++) {
      var ang = (k / 96) * TAU + rot2
      var long = k % 8 === 0
      var inner = R * 0.955
      var outer = inner - (long ? 9 : 4)
      ctx.beginPath()
      ctx.moveTo(Math.cos(ang) * inner, Math.sin(ang) * inner)
      ctx.lineTo(Math.cos(ang) * outer, Math.sin(ang) * outer)
      ctx.stroke()
    }

    /* 虚线圈 */
    ctx.setLineDash([1.5, 9])
    ctx.lineDashOffset = -t * 0.02
    ctx.lineWidth = 1
    ctx.strokeStyle = rgba(ACCENT, 0.34)
    ctx.beginPath()
    ctx.arc(0, 0, R * 0.875, 0, TAU)
    ctx.stroke()
    ctx.setLineDash([])

    /* 内环：金的三段弧 */
    ctx.lineWidth = 1.4
    ctx.strokeStyle = rgba(ACCENT2, 0.34 + 0.3 * flare)
    drawArcs(ctx, R * 0.75, 3, 0.16, rot3)

    /* 进度弧 */
    if (state.progress > 0.5) {
      var pStart = -Math.PI / 2
      var pEnd = pStart + TAU * (state.progress / 100)
      ctx.lineWidth = 1.8
      ctx.strokeStyle = rgba(ACCENT2, 0.75)
      ctx.beginPath()
      ctx.arc(0, 0, R * 1.005, pStart, pEnd)
      ctx.stroke()
      var headX = Math.cos(pEnd) * R * 1.005
      var headY = Math.sin(pEnd) * R * 1.005
      ctx.fillStyle = rgba(ACCENT2, 0.95)
      ctx.fillRect(headX - 1.4, headY - 1.4, 2.8, 2.8)
    }

    /* 核验扫描弧 */
    if (state.scan) {
      var s0 = t * 0.0016
      ctx.lineWidth = 2.4
      ctx.strokeStyle = rgba(ACCENT, 0.55)
      ctx.beginPath()
      ctx.arc(0, 0, R * 0.9, s0, s0 + 1.15)
      ctx.stroke()
      ctx.lineWidth = 1
      ctx.strokeStyle = rgba(ACCENT, 0.18)
      ctx.beginPath()
      ctx.arc(0, 0, R * 0.82, s0, s0 + 1.15)
      ctx.stroke()
    }

    /* 线圈 */
    ctx.lineWidth = 3
    ctx.strokeStyle = rgba(ACCENT, 0.3)
    for (var c = 0; c < 6; c++) {
      var ca = (c / 6) * TAU + Math.PI / 6 - rot2 * 0.4
      ctx.beginPath()
      ctx.arc(0, 0, R * 0.58, ca, ca + 0.34)
      ctx.stroke()
    }

    /* 核心 */
    var coreR = R * (0.13 + 0.02 * pulse + 0.05 * flare)
    var coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR * 2.4)
    coreGrad.addColorStop(0, 'rgba(255,255,255,0.95)')
    coreGrad.addColorStop(0.32, rgba(ACCENT, 0.85))
    coreGrad.addColorStop(0.7, rgba(ACCENT, 0.22))
    coreGrad.addColorStop(1, rgba(ACCENT, 0))
    ctx.fillStyle = coreGrad
    ctx.beginPath()
    ctx.arc(0, 0, coreR * 2.4, 0, TAU)
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(0, 0, coreR * 0.42, 0, TAU)
    ctx.fill()

    ctx.lineWidth = 1
    ctx.strokeStyle = rgba(ACCENT2, 0.7)
    ctx.beginPath()
    ctx.arc(0, 0, coreR * 0.78, 0, TAU)
    ctx.stroke()

    /* 粒子 */
    for (var p = 0; p < particles.length; p++) {
      var pt = particles[p]
      var pa = pt.a + t * 0.00006 * pt.s * 6
      var pr = R * (0.22 + pt.r * 0.6)
      var px = Math.cos(pa) * pr
      var py = Math.sin(pa) * pr
      var po = pt.o * (0.35 + 0.65 * Math.abs(Math.sin(t * 0.0012 + pt.ph)))
      ctx.fillStyle = rgba(ACCENT, po * 0.5)
      ctx.fillRect(px, py, 1.4, 1.4)
    }

    /* 点火白闪 */
    if (elapsed < 260) {
      ctx.fillStyle = 'rgba(255,255,255,' + (0.5 * (1 - elapsed / 260)).toFixed(3) + ')'
      ctx.beginPath()
      ctx.arc(0, 0, R * 1.02, 0, TAU)
      ctx.fill()
    }

    ctx.restore()
  }

  /* ── 音效 ───────────────────────────────────────────────────────────────── */

  var AC = null
  var audioFailed = false
  var audioUnlocked = false

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
    } catch (err) { /* 音效失败不影响动画 */ }
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
      filter.Q.value = 0.9
      filter.frequency.setValueAtTime(from, now)
      filter.frequency.exponentialRampToValueAtTime(to, now + dur)
      var g = envGain(ctx, gain, now, dur, 0.08)
      src.connect(filter).connect(g).connect(ctx.destination)
      src.start(now)
      src.stop(now + dur + 0.02)
    } catch (err) { /* noop */ }
  }

  var sfx = {
    ignite: function () {
      tone(58, 1.35, 'sawtooth', 0.05, 420)
      tone(116, 1.2, 'sine', 0.04, 880)
      noise(1.1, 0.035, 180, 2400)
    },
    tick: function () { tone(2100, 0.035, 'square', 0.018) },
    blip: function () { tone(720, 0.09, 'sine', 0.05, 1080) },
    prompt: function () {
      tone(520, 0.1, 'sine', 0.05)
      setTimeout(function () { tone(780, 0.12, 'sine', 0.045) }, 120)
    },
    confirm: function () {
      tone(520, 0.2, 'sine', 0.06, 1040)
      setTimeout(function () { tone(1560, 0.28, 'sine', 0.04) }, 150)
      noise(0.25, 0.02, 800, 4200)
    },
    welcome: function () {
      tone(392, 0.9, 'sine', 0.035)
      setTimeout(function () { tone(523.25, 0.9, 'sine', 0.03) }, 90)
      setTimeout(function () { tone(659.25, 0.9, 'sine', 0.025) }, 180)
    },
    skip: function () { tone(300, 0.08, 'square', 0.03, 160) }
  }

  /* 首次交互解锁音频 */
  function unlockAudio() {
    audioUnlocked = true
    audio()
    root.removeEventListener('pointerdown', unlockAudio)
    root.removeEventListener('keydown', unlockAudio)
  }
  root.addEventListener('pointerdown', unlockAudio)
  root.addEventListener('keydown', unlockAudio)
  /* 纯键盘流程也要解锁音频：指针或按键第一次落在文档上就放行 */
  document.addEventListener('pointerdown', unlockAudio, { once: true })
  document.addEventListener('keydown', unlockAudio, { once: true })

  /* ── 语音 ───────────────────────────────────────────────────────────────── */

  var synth = window.speechSynthesis
  var voice = null

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

  function speak(text) {
    if (!cfg.voice || !synth || !text) return
    try {
      var say = function () {
        try {
          synth.cancel()
          var u = new SpeechSynthesisUtterance(text)
          u.rate = clamp(cfg.voiceRate, 0.5, 2)
          u.pitch = clamp(cfg.voicePitch, 0, 2)
          u.volume = clamp(cfg.voiceVolume, 0, 1)
          u.lang = voice && voice.lang ? voice.lang : 'en-GB'
          if (voice) u.voice = voice
          synth.speak(u)
        } catch (err) { /* 语音失败只丢这一句 */ }
      }
      var lead = clamp(cfg.voiceLead, 0, 1200)
      if (lead > 0) setTimeout(say, lead)
      else say()
    } catch (err) { /* noop */ }
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
      en: 'GOOD EVENING, ' + String(cfg.callsign || 'SIR').toUpperCase() + '.',
      zh: '晚上好。动力核心与语音链路已就绪。',
      label: '[ 01 / 05 ] POWER UP',
      voice: 'Good evening, ' + String(cfg.callsign || 'sir').toLowerCase() + '. Power systems are online.'
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
    ['NEURAL LATTICE', 'SYNCED', '12ms'],
    ['SESSION GRAPH', 'RESTORED', '0.4s'],
    ['TOOL BUS', 'MOUNTED', 'READY'],
    ['MODEL ROUTER', 'ONLINE', 'ROUTED'],
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

  function setProgress(v, silent) {
    progress = clamp(v, 0, 100)
    barFill.style.width = progress + '%'
    pctEl.textContent = Math.round(progress) + '%'
    if (!silent && progress > 0) sfx.tick()
  }

  function setPhase(key, opts) {
    var p = PHASES[key]
    if (!p) return
    phase = key
    if (p.en) {
      phaseEn.textContent = p.en
      phaseEl.classList.add('is-on')
      phaseZh.textContent = p.zh
      phaseEn.classList.remove('jv-in')
      void phaseEn.offsetWidth
      phaseEn.classList.add('jv-in')
    }
    if (opts && opts.zh) phaseZh.textContent = opts.zh
    phaseLabel.textContent = p.label
    if (opts && opts.voice !== false && p.voice) speak(p.voice)
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
    setPhase('p3b', { zh: String(cfg.identity || 'OPERATOR') + '  ·  CLEARANCE ' + String(cfg.clearance || 'ALPHA') })
    setProgress(82)
  }

  function showWelcome() {
    setPhase('p4')
    phaseEl.style.opacity = '0'
    welcomeEl.classList.add('is-on')
    brandEl.style.transition = 'opacity 520ms ease'
    brandEl.style.opacity = '0.42'
    setProgress(100, true)
    sfx.welcome()
    speak(PHASES.p4.voice)
  }

  function beginExit() {
    if (finished) return
    root.classList.add('is-split')
  }

  function shutdown() {
    if (finished) return
    root.classList.add('is-off')
  }

  function finish() {
    if (finished) return
    finished = true
    try { if (raf) cancelAnimationFrame(raf) } catch (err) { /* noop */ }
    try { document.removeEventListener('keydown', onKey, true) } catch (err) { /* noop */ }
    try { window.removeEventListener('resize', onResize) } catch (err) { /* noop */ }
    try { if (synth && synth.cancel) synth.cancel() } catch (err) { /* noop */ }
    try {
      if (AC && AC.close) AC.close()
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
      // 跳过时不再等核验
      confirmed = true
      paused = false
    }
    sfx.skip()
    setProgress(100, true)
    root.classList.add('is-split')
    setTimeout(shutdown, 150)
    setTimeout(finish, 1150)
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

  /* 降低动态：直接进终幕，短暂停留后揭幕 */
  if (reduced) {
    root.classList.add('jv-flat')
    setProgress(100, true)
    phaseEl.style.opacity = '0'
    welcomeEl.classList.add('is-on')
    welcomeName.textContent = String(cfg.identity || 'OPERATOR')
    var em2 = document.createElement('em')
    em2.textContent = '· ' + String(cfg.clearance || 'ALPHA')
    welcomeName.appendChild(em2)
    drawRing(performance.now(), 1200, { progress: 100, flare: 0, scan: false })
    setTimeout(shutdown, 1500)
    setTimeout(finish, 2000)
    return
  }

  sfx.ignite()

  function tick(E) {
    if (E >= BASE.brand && logIndex === 0) {
      nextLog()
      setStat('arc', '34.2%')
    }
    if (E >= BASE.p1 && phase === 'p0') {
      setPhase('p1')
      setProgress(12)
      nextLog()
      setStat('arc', '87.1%')
    }
    if (E >= BASE.p1b && logIndex === 2) {
      nextLog()
      setProgress(22)
    }
    if (E >= BASE.p2 && phase === 'p1') {
      setPhase('p2')
      setProgress(38)
      nextLog()
      setStat('arc', '100.0%')
      setStat('pwr', '2.11 GW')
      setStat('link', 'SECURE')
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
      finish()
    }
  }

  function loop(ts) {
    if (finished) return
    if (!lastTs) lastTs = ts
    var dt = Math.min(64, Math.max(0, ts - lastTs))
    lastTs = ts
    if (!paused) {
      elapsed += dt * SPEED
      tick(elapsed)
    }
    if (elapsed > BASE.welcome - 400 && phase === 'p3b') {
      flare = Math.min(1, flare + dt / 600)
    }
    drawRing(ts, elapsed, {
      progress: progress,
      flare: flare,
      scan: !confirmed && (paused || phase === 'p3')
    })
    raf = requestAnimationFrame(loop)
  }

  raf = requestAnimationFrame(loop)
})()