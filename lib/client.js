/**
 * dsh-jarvis-startup — 浏览器半侧（设置页「JARVIS 开机序列」）
 * ----------------------------------------------------------------------------
 * 以 dsh.client bundle 格式加载（手写 ModuleLoader bundle，无需构建）：
 * 在 DSH 设置里注册一个 `settings.section`，用来改开机序列的身份、台词、
 * 配色、速度、语音与玻璃效果。
 *
 * 数据不走 settings 命名空间，而是走 Host 半侧自带的 HTTP API
 * （GET/POST /dsh-jarvis/config）。注册 id 必须等于 loader entry 名
 * （dsh-jarvis-startup），否则 ModuleLoader 会报
 * "loaded without registering dsh-jarvis-startup"。
 */

window.__ModuleLoader__.load({
  id: 'dsh-jarvis-startup',
  factory: function (require) {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    var react = require('react')
    var h = react.createElement

    var API = '/dsh-jarvis/config'
    var ROOT_ID = 'dsh-jarvis-root'
    var BOOT_ROUTE = '/dsh-jarvis'

    /* ── 兜底默认值：接口没读到时也能把面板画出来 ─────────────────────── */
    var FALLBACK = {
      enabled: true, mode: 'session', theme: 'reactor', speed: 1,
      requireInteraction: true, allowSkip: true,
      identity: 'LINKS', callsign: 'SIR', clearance: 'ALPHA',
      brand: 'J.A.R.V.I.S.', subtitle: 'JUST A RATHER VERY INTELLIGENT SYSTEM',
      footer: 'MARK VII // MALIBU POINT', welcomeLine: 'WELCOME BACK',
      sound: true, sfxVolume: 0.4,
      voice: true, voiceName: '', voiceRate: 0.92, voicePitch: 0.78, voiceVolume: 0.9, voiceLead: 260,
      glass: true, glassOpacity: 0.95, glassBlur: 36, glassSaturate: 145, glassBackdropBlur: 40,
      scanlines: true,
      accent: '#5fe3ff', accent2: '#ffc46b', glitchA: '#ff4f45', glitchB: '#2f7fd0'
    }

    var CSS = [
      '.__jv_root{max-width:620px;display:flex;flex-direction:column;gap:14px;font-size:13px;color:var(--dsw-alias-label-primary)}',
      '.__jv_head{display:flex;align-items:baseline;justify-content:space-between;gap:12px}',
      '.__jv_version{font-family:ui-monospace,Consolas,monospace;font-size:12px;letter-spacing:.04em;color:var(--dsw-alias-label-tertiary)}',
      '.__jv_toc{position:sticky;top:0;z-index:2;display:flex;flex-wrap:wrap;gap:6px;padding:6px 0 8px;background:var(--dsw-alias-bg-layer-1,transparent)}',
      '.__jv_tocItem{font:inherit;font-size:12px;line-height:1;padding:5px 10px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-secondary);cursor:pointer}',
      '.__jv_tocItem:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-state-business-primary)}',
      '.__jv_tocItem:active{transform:translateY(1px)}',
      '.__jv_group{border:1px solid var(--dsw-alias-border-l2);border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:12px;scroll-margin-top:44px}',
      '.__jv_groupTitle{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary)}',
      '.__jv_field{display:flex;flex-direction:column;gap:6px}',
      '.__jv_labelRow{display:flex;align-items:baseline;justify-content:space-between;gap:12px}',
      '.__jv_label{font-size:12px;font-weight:600;color:var(--dsw-alias-label-primary)}',
      '.__jv_value{font-family:ui-monospace,Consolas,monospace;font-size:11px;color:var(--dsw-alias-label-tertiary)}',
      '.__jv_hint{font-size:11px;line-height:1.55;color:var(--dsw-alias-label-tertiary)}',
      '.__jv_input{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:6px 10px;font-size:13px;box-sizing:border-box;width:100%;outline:none}',
      '.__jv_input:focus{border-color:var(--dsw-alias-state-business-primary)}',
      '.__jv_select{appearance:none;background-image:linear-gradient(45deg,transparent 50%,var(--dsw-alias-label-tertiary) 50%),linear-gradient(135deg,var(--dsw-alias-label-tertiary) 50%,transparent 50%);background-position:calc(100% - 16px) 50%,calc(100% - 11px) 50%;background-size:5px 5px,5px 5px;background-repeat:no-repeat;padding-right:32px}',
      '.__jv_seg{display:flex;gap:6px;flex-wrap:wrap}',
      '.__jv_segBtn{font:inherit;font-size:12px;padding:6px 12px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-secondary);cursor:pointer}',
      '.__jv_segBtn:hover{color:var(--dsw-alias-label-primary)}',
      '.__jv_segBtn[data-on="1"]{border-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}',
      '.__jv_switch{display:flex;align-items:center;justify-content:space-between;gap:14px;cursor:pointer;padding:2px 0}',
      '.__jv_track{position:relative;width:38px;height:21px;border-radius:999px;background:var(--dsw-alias-bg-layer-4,rgba(127,127,127,.3));border:1px solid var(--dsw-alias-border-l2);flex:none;transition:background .15s ease}',
      '.__jv_track[data-on="1"]{background:var(--dsw-alias-state-business-primary);border-color:transparent}',
      '.__jv_knob{position:absolute;top:2px;left:2px;width:15px;height:15px;border-radius:999px;background:#fff;transition:transform .15s ease}',
      '.__jv_track[data-on="1"] .__jv_knob{transform:translateX(17px)}',
      '.__jv_rangeWrap{display:flex;align-items:center;gap:10px}',
      '.__jv_range{flex:1;min-width:0;accent-color:var(--dsw-alias-state-business-primary)}',
      '.__jv_colorRow{display:flex;align-items:center;gap:10px}',
      '.__jv_color{width:34px;height:26px;padding:0;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:transparent;cursor:pointer}',
      '.__jv_colorText{flex:1}',
      '.__jv_status{font-size:12px;line-height:1.6;color:var(--dsw-alias-label-tertiary)}',
      '.__jv_error{color:var(--dsw-alias-state-danger-primary,#d9534f)}',
      '.__jv_ok{color:var(--dsw-alias-state-business-primary)}',
      '.__jv_bar{position:sticky;bottom:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0 6px;background:var(--dsw-alias-bg-layer-1,#fff);border-top:1px solid var(--dsw-alias-border-l2)}',
      '.__jv_actions{display:flex;gap:8px;flex-wrap:wrap}',
      '.__jv_btn{font:inherit;font-size:12px;padding:7px 14px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);cursor:pointer}',
      '.__jv_btn:hover{border-color:var(--dsw-alias-state-business-primary)}',
      '.__jv_btn:disabled{opacity:.45;cursor:default}',
      '.__jv_btnPrimary{background:var(--dsw-alias-state-business-primary);border-color:transparent;color:#fff}',
      '.__jv_dot{display:inline-block;width:6px;height:6px;border-radius:999px;background:var(--dsw-alias-state-business-primary);margin-right:6px;vertical-align:1px}',
      '.__jv_foot{font-size:11px;line-height:1.6;color:var(--dsw-alias-label-tertiary);word-break:break-all}'
    ].join('\n')

    /* ── 字段定义 ──────────────────────────────────────────────────────── */

    var GROUPS = [
      {
        id: 'play', title: '播放',
        items: [
          { key: 'enabled', type: 'switch', label: '启用', hint: '总开关。关掉后完全不播。' },
          { key: 'mode', type: 'select', label: '显示模式', options: [['session', '每次会话'], ['always', '每次刷新'], ['daily', '每天一次']], hint: '每次会话 = 一个浏览器会话只播一次。' },
          { key: 'theme', type: 'seg', label: '主题', options: [['reactor', '冰蓝反应炉'], ['mark3', '金色马克 III']], hint: '选主题会把主副色一起换掉；之后仍可在「视觉」里单独改。' },
          { key: 'speed', type: 'range', label: '速度', min: 0.4, max: 2.5, step: 0.05, unit: '×', digits: 2 },
          { key: 'requireInteraction', type: 'switch', label: '要求确认', hint: '身份核验那一步停下来，等按 Enter 或点按钮。' },
          { key: 'allowSkip', type: 'switch', label: '允许跳过', hint: '显示右上角 SKIP，并响应 Esc。' }
        ]
      },
      {
        id: 'identity', title: '身份与台词',
        items: [
          { key: 'identity', type: 'text', label: '身份名称', hint: '终幕「LINKS · ALPHA」里的名字。', maxLength: 32 },
          { key: 'callsign', type: 'text', label: '称呼', hint: 'JARVIS 怎么叫你，如 SIR / MA’AM。', maxLength: 24 },
          { key: 'clearance', type: 'text', label: '权限等级', maxLength: 24 },
          { key: 'brand', type: 'text', label: '主标题', maxLength: 32 },
          { key: 'subtitle', type: 'text', label: '英文副标题', maxLength: 64 },
          { key: 'welcomeLine', type: 'text', label: '欢迎语上方小字', maxLength: 32 },
          { key: 'footer', type: 'text', label: '左上角第二行', maxLength: 48 }
        ]
      },
      {
        id: 'voice', title: '语音',
        items: [
          { key: 'voice', type: 'switch', label: '语音播报', hint: '用浏览器语音合成念台词；没有可用声音时静默。' },
          { key: 'voiceName', type: 'voice', label: '音色', hint: '默认自动挑英式男声（Daniel / Arthur 一类）。' },
          { key: 'voiceRate', type: 'range', label: '语速', min: 0.5, max: 2, step: 0.02, digits: 2 },
          { key: 'voicePitch', type: 'range', label: '音调', min: 0, max: 2, step: 0.02, digits: 2, hint: '0.78 左右更接近管家腔；1 以上会像客服。' },
          { key: 'voiceVolume', type: 'range', label: '音量', min: 0, max: 1, step: 0.02, digits: 2 },
          { key: 'voiceLead', type: 'range', label: '开口前留白', min: 0, max: 1200, step: 20, unit: 'ms', digits: 0 }
        ]
      },
      {
        id: 'sfx', title: '界面音效',
        items: [
          { key: 'sound', type: 'switch', label: '界面音效', hint: '点火、阶段推进、按钮确认的合成音。' },
          { key: 'sfxVolume', type: 'range', label: '音效音量', min: 0, max: 1, step: 0.02, digits: 2 }
        ]
      },
      {
        id: 'glass', title: '液态玻璃',
        items: [
          { key: 'glass', type: 'switch', label: '液态玻璃', hint: '把底衬换成半透明磨砂层，透过它能看到后面的界面。' },
          { key: 'glassOpacity', type: 'range', label: '玻璃不透明度', min: 0.15, max: 0.95, step: 0.01, digits: 2, hint: '越低越透；0.95 时背后只剩一层被糊掉的轮廓。' },
          { key: 'glassBlur', type: 'range', label: '磨砂模糊', min: 0, max: 60, step: 1, unit: 'px' },
          { key: 'glassSaturate', type: 'range', label: '玻璃饱和度', min: 100, max: 200, step: 1, unit: '%' },
          { key: 'glassBackdropBlur', type: 'range', label: '背景模糊', min: 0, max: 80, step: 1, unit: 'px', hint: '直接糊应用本体；20–30 最像照片，超过 60 会糊成纯色。' }
        ]
      },
      {
        id: 'look', title: '视觉',
        items: [
          { key: 'accent', type: 'color', label: '主色', hint: 'HUD 线条、反应炉辉光、进度头。' },
          { key: 'accent2', type: 'color', label: '副色', hint: '进度弧、欢迎语小字。' },
          { key: 'glitchA', type: 'color', label: '故障色 A' },
          { key: 'glitchB', type: 'color', label: '故障色 B' },
          { key: 'scanlines', type: 'switch', label: '扫描线', hint: 'CRT 横向细线与缓慢下扫的光带。' }
        ]
      }
    ]

    /* ── 小工具 ────────────────────────────────────────────────────────── */

    function injectCss() {
      var id = 'dsh-jarvis-settings-css'
      if (document.getElementById(id)) return
      var el = document.createElement('style')
      el.id = id
      el.textContent = CSS
      document.head.appendChild(el)
    }

    function readInjectedVersion() {
      try {
        if (window.__DSH_JARVIS_VERSION__) return String(window.__DSH_JARVIS_VERSION__)
      } catch (e) { /* noop */ }
      return ''
    }

    function fmt(value, item) {
      var n = Number(value)
      if (!isFinite(n)) return String(value)
      var digits = item.digits === undefined ? 0 : item.digits
      return n.toFixed(digits)
    }

    /* ── 字段控件 ──────────────────────────────────────────────────────── */

    function LabelRow(item, extra) {
      return h('div', { className: '__jv_labelRow' },
        h('div', { className: '__jv_label' }, item.label),
        extra ? h('div', { className: '__jv_value' }, extra) : null
      )
    }

    function Switch(item, value, set) {
      return h('label', { className: '__jv_switch' },
        h('span', { className: '__jv_label' }, item.label),
        h('span', { className: '__jv_track', 'data-on': value ? '1' : '0' },
          h('span', { className: '__jv_knob' }),
          h('input', {
            type: 'checkbox', checked: !!value, style: { display: 'none' },
            onChange: function (e) { set(item.key, e.target.checked) }
          })
        )
      )
    }

    function Select(item, value, set) {
      return h('div', { className: '__jv_field' },
        LabelRow(item),
        h('select', {
          className: '__jv_input __jv_select', value: String(value),
          onChange: function (e) { set(item.key, e.target.value) }
        }, item.options.map(function (o) {
          return h('option', { key: o[0], value: o[0] }, o[1])
        }))
      )
    }

    var THEME_COLORS = {
      reactor: ['#5fe3ff', '#ffc46b'],
      mark3: ['#ffc46b', '#8fe9ff']
    }

    function Seg(item, value, set) {
      return h('div', { className: '__jv_field' },
        LabelRow(item),
        h('div', { className: '__jv_seg' }, item.options.map(function (o) {
          return h('button', {
            key: o[0], type: 'button', className: '__jv_segBtn',
            'data-on': String(value) === o[0] ? '1' : '0',
            onClick: function () {
              set(item.key, o[0])
              /* 主题是配色预设：选它就把主副色一起落下来，避免配置里颜色和主题对不上 */
              var pair = THEME_COLORS[o[0]]
              if (item.key === 'theme' && pair) {
                set('accent', pair[0])
                set('accent2', pair[1])
              }
            }
          }, o[1])
        }))
      )
    }

    function Range(item, value, set) {
      return h('div', { className: '__jv_field' },
        LabelRow(item, fmt(value, item) + (item.unit || '')),
        h('div', { className: '__jv_rangeWrap' },
          h('input', {
            className: '__jv_range', type: 'range',
            min: item.min, max: item.max, step: item.step,
            value: Number(value),
            onChange: function (e) { set(item.key, Number(e.target.value)) }
          })
        )
      )
    }

    function Text(item, value, set) {
      return h('div', { className: '__jv_field' },
        LabelRow(item),
        h('input', {
          className: '__jv_input', type: 'text', value: String(value == null ? '' : value),
          maxLength: item.maxLength || 64,
          onChange: function (e) { set(item.key, e.target.value) }
        })
      )
    }

    function Color(item, value, set) {
      return h('div', { className: '__jv_field' },
        LabelRow(item),
        h('div', { className: '__jv_colorRow' },
          h('input', {
            className: '__jv_color', type: 'color', value: String(value),
            onChange: function (e) { set(item.key, e.target.value) }
          }),
          h('input', {
            className: '__jv_input __jv_colorText', type: 'text', value: String(value),
            onChange: function (e) {
              var v = e.target.value.trim()
              if (/^#[0-9a-fA-F]{3,8}$/.test(v)) set(item.key, v)
            }
          })
        )
      )
    }

    function VoicePicker(props) {
      var item = props.item
      var value = props.value
      var set = props.set
      var [list, setList] = react.useState(readVoices())
      react.useEffect(function () {
        var synth = window.speechSynthesis
        if (!synth) return undefined
        var update = function () { setList(readVoices()) }
        if (typeof synth.addEventListener === 'function') {
          synth.addEventListener('voiceschanged', update)
          return function () { synth.removeEventListener('voiceschanged', update) }
        }
        synth.onvoiceschanged = update
        return function () { synth.onvoiceschanged = null }
      }, [])
      return h('div', { className: '__jv_field' },
        LabelRow(item),
        h('select', {
          className: '__jv_input __jv_select', value: String(value || ''),
          onChange: function (e) { set(item.key, e.target.value) }
        },
          h('option', { value: '' }, '自动（优先英式男声）'),
          list.map(function (v) {
            return h('option', { key: v.name, value: v.name }, v.name + ' · ' + v.lang)
          })
        )
      )
    }

    function readVoices() {
      try {
        var synth = window.speechSynthesis
        if (!synth || typeof synth.getVoices !== 'function') return []
        return (synth.getVoices() || []).slice().sort(function (a, b) {
          return String(a.lang).localeCompare(String(b.lang)) || String(a.name).localeCompare(String(b.name))
        })
      } catch (e) {
        return []
      }
    }

    function renderItem(item, draft, set) {
      var value = draft[item.key]
      var control
      if (item.type === 'switch') control = Switch(item, value, set)
      else if (item.type === 'select') control = Select(item, value, set)
      else if (item.type === 'seg') control = Seg(item, value, set)
      else if (item.type === 'range') control = Range(item, value, set)
      else if (item.type === 'color') control = Color(item, value, set)
      else if (item.type === 'voice') control = h(VoicePicker, { item: item, value: value, set: set, key: item.key })
      else control = Text(item, value, set)

      if (item.type === 'switch') {
        return h('div', { className: '__jv_field', key: item.key },
          control,
          item.hint ? h('div', { className: '__jv_hint' }, item.hint) : null
        )
      }
      return h('div', { className: '__jv_field', key: item.key },
        control,
        item.hint ? h('div', { className: '__jv_hint' }, item.hint) : null
      )
    }

    /* ── 设置面板 ──────────────────────────────────────────────────────── */

    function Panel() {
      injectCss()

      var [draft, setDraft] = react.useState(null)
      var [file, setFile] = react.useState('')
      var [version, setVersion] = react.useState(readInjectedVersion)
      var [error, setError] = react.useState(null)
      var [notice, setNotice] = react.useState(null)
      var [busy, setBusy] = react.useState(false)
      var [dirty, setDirty] = react.useState(false)

      function load() {
        setError(null)
        return fetch(API, { headers: { Accept: 'application/json' } })
          .then(function (r) { return r.json() })
          .then(function (j) {
            if (!j || j.ok !== true) throw new Error((j && j.error) || 'load failed')
            setDraft(Object.assign({}, FALLBACK, j.config))
            setDirty(false)
            setFile(j.file || '')
            if (j.version) setVersion(String(j.version))
          })
          .catch(function (e) {
            setError('读取配置失败：' + String(e && e.message ? e.message : e))
          })
      }

      react.useEffect(function () { load() }, [])

      function set(key, value) {
        setNotice(null)
        setDirty(true)
        setDraft(function (d) { return Object.assign({}, d, { [key]: value }) })
      }

      function save() {
        if (!draft) return
        setBusy(true); setNotice(null); setError(null)
        return fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patch: draft })
        })
          .then(function (r) { return r.json() })
          .then(function (j) {
            if (!j || j.ok !== true) throw new Error((j && j.error) || 'save failed')
            setDraft(j.config)
            setDirty(false)
            setNotice('已保存。下一次打开 DSH（或刷新页面）时按新配置播放。')
          })
          .catch(function (e) {
            setError('保存失败：' + String(e && e.message ? e.message : e))
          })
          .then(function () { setBusy(false) })
      }

      function reset() {
        setBusy(true); setNotice(null); setError(null)
        fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reset' })
        })
          .then(function (r) { return r.json() })
          .then(function (j) {
            if (!j || j.ok !== true) throw new Error((j && j.error) || 'reset failed')
            setDraft(j.config)
            setDirty(false)
            setNotice('已恢复默认。')
          })
          .catch(function (e) {
            setError('恢复默认失败：' + String(e && e.message ? e.message : e))
          })
          .then(function () { setBusy(false) })
      }

      /** 保存当前草稿 → 清掉「本次会话已播」标记 → 刷新，立刻看一遍。 */
      function replay() {
        if (!draft) return
        setBusy(true)
        save().then(function () {
          try { sessionStorage.removeItem('dsh-jarvis-startup:shown') } catch (e) { /* noop */ }
          window.location.reload()
        })
      }

      var versionLine = h('div', { className: '__jv_version' }, '版本 v' + (version || '1.0.0'))

      if (!draft) {
        return h('div', { className: '__jv_root' },
          h('div', { className: '__jv_head' }, versionLine),
          h('div', { className: '__jv_status' + (error ? ' __jv_error' : '') },
            error || '读取配置中…'),
          error ? h('div', { className: '__jv_actions' },
            h('button', { className: '__jv_btn', onClick: load }, '重试')
          ) : null
        )
      }

      var groups = GROUPS.map(function (group) {
        return h('section', { className: '__jv_group', key: group.id, id: 'jv-group-' + group.id },
          h('div', { className: '__jv_groupTitle' }, group.title),
          group.items.map(function (item) { return renderItem(item, draft, set) })
        )
      })

      var toc = h('div', { className: '__jv_toc' }, GROUPS.map(function (group) {
        return h('button', {
          key: group.id, type: 'button', className: '__jv_tocItem',
          onClick: function () {
            var el = document.getElementById('jv-group-' + group.id)
            if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start', behavior: 'smooth' })
          }
        }, group.title)
      }))

      return h('div', { className: '__jv_root' },
        h('div', { className: '__jv_head' },
          h('div', { className: '__jv_label' }, 'JARVIS 开机序列'),
          versionLine
        ),
        h('div', { className: '__jv_hint' },
          '整窗播放的一段全息开机动画：反应炉点火 → 系统自检 → 身份核验 → 欢迎语 → 故障收束。图形由 canvas 绘制，音效与语音现场合成，不含影视素材。'),
        toc,
        groups,
        h('div', { className: '__jv_bar' },
          h('div', { className: '__jv_status' + (error ? ' __jv_error' : notice ? ' __jv_ok' : '') },
            error || notice || (dirty ? h('span', null, h('span', { className: '__jv_dot' }), '有未保存的改动') : '改完点保存。')
          ),
          h('div', { className: '__jv_actions' },
            h('button', { className: '__jv_btn', disabled: busy, onClick: reset }, '恢复默认'),
            h('button', { className: '__jv_btn', disabled: busy || !dirty, onClick: save }, '保存'),
            h('button', { className: '__jv_btn __jv_btnPrimary', disabled: busy, onClick: replay }, '保存并重播')
          )
        ),
        file ? h('div', { className: '__jv_foot' }, '配置文件：' + file) : null
      )
    }

    /* ── 桌面端自举：Host 注入不生效时自己拉起开机序列 ─────────────────── */

    function bootFallback() {
      try {
        if (typeof window === 'undefined' || typeof document === 'undefined') return
        if (!document.body) return
        if (window.__DSH_JARVIS_BOOT__ || window.__DSH_JARVIS__) return
        if (document.getElementById(ROOT_ID)) return
        if (window.__DSH_JARVIS_FAILED__ === true) return

        fetch(API, { headers: { Accept: 'application/json' } })
          .then(function (r) { return r.json() })
          .then(function (j) { return j && j.ok === true ? j.config : null })
          .catch(function () { return null })
          .then(function (cfg) {
            cfg = cfg || { enabled: true, mode: 'session', speed: 1 }
            if (cfg.enabled === false) return
            var today = new Date().toISOString().slice(0, 10)
            try {
              if (cfg.mode === 'session' && sessionStorage.getItem('dsh-jarvis-startup:shown') === '1') return
              if (cfg.mode === 'daily' && localStorage.getItem('dsh-jarvis-startup:day') === today) return
            } catch (e) { /* 隐私模式 */ }

            window.__DSH_JARVIS__ = cfg
            window.__DSH_JARVIS_BOOT__ = 'client'
            var root = document.createElement('div')
            root.id = ROOT_ID
            root.className = 'jv-root jv-boot'
            document.body.appendChild(root)

            var css = document.createElement('link')
            css.rel = 'stylesheet'
            css.href = BOOT_ROUTE + '/splash.css'
            document.head.appendChild(css)

            var script = document.createElement('script')
            script.src = BOOT_ROUTE + '/splash.js?t=' + Date.now()
            script.async = false
            document.head.appendChild(script)
          })
          .catch(function () { /* 自举失败就算了，页面本来就是好的 */ })
      } catch (e) { /* 自举是兜底，不许把宿主带崩 */ }
    }

    /* ── 插件 ──────────────────────────────────────────────────────────── */

    var inject = ['slots']

    function apply(ctx) {
      bootFallback()
      ctx.slots.inject('settings.section', function () {
        return ctx.slots.register(
          { name: 'settings.section', id: 'jarvis-startup', order: 27, label: 'JARVIS 开机序列' },
          function () { return h(Panel, {}) }
        )
      })
    }

    exports.apply = apply
    exports.inject = inject
    return module.exports
  }
})