import { useEffect, useMemo, useRef, useState } from 'react'
import { sankeyCols, sankeyFlowGroups, sankeySpecial, sankeyStages, ALL } from '../data.js'

const HL = { ok: '#3f9d52', warn: '#b9791a', bad: '#cc0000' }
const FLOW = { bad: '#cc0000', warn: '#e0b25a', ok: '#86c596' }
// reason-tag tones — solid status colour with a contrast-picked text colour:
// dark/red bg → white text, light amber bg → dark text, so tags stay readable
const REASON = {
  bad: { bg: '#cc0000', fg: '#ffffff' },
  warn: { bg: '#ffce7a', fg: '#6e4406' },
}

// failure-reason glyphs drawn in a 12×12 box (stroke = currentColor passed in)
const ICONS = {
  cold: (c) => `<path d="M6 1.5V10.5M2 4 10 8M10 4 2 8" stroke="${c}" stroke-width="1.1" stroke-linecap="round" fill="none"/>`,
  truck: (c) => `<g stroke="${c}" stroke-width="1.1" fill="none" stroke-linejoin="round"><path d="M1.5 3.4H7V8H1.5z"/><path d="M7 5H9.3L10.8 6.8V8H7"/><circle cx="3.2" cy="9" r="1.1"/><circle cx="9" cy="9" r="1.1"/></g>`,
  fog: (c) => `<g stroke="${c}" stroke-width="1.1" fill="none" stroke-linecap="round"><path d="M3 6.4a2 2 0 0 1 1.9-2 2.4 2.4 0 0 1 4.4 .6 1.6 1.6 0 0 1 -.3 3.1H4.2A1.5 1.5 0 0 1 3 6.4z"/><path d="M3.6 9.6H9M4.6 11.2H8"/></g>`,
  overload: (c) => `<g stroke="${c}" stroke-width="1.1" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M2.6 10H9.4M3.6 7.8H8.4"/><path d="M6 5.6V1.6M4.3 3.3 6 1.6 7.7 3.3"/></g>`,
  layers: (c) => `<g stroke="${c}" stroke-width="1.1" fill="none" stroke-linejoin="round"><path d="M6 2 10 4 6 6 2 4z"/><path d="M2.4 6.3 6 8 9.6 6.3"/><path d="M2.4 8.6 6 10.3 9.6 8.6"/></g>`,
  clock: (c) => `<g stroke="${c}" stroke-width="1.1" fill="none" stroke-linecap="round"><circle cx="6" cy="6" r="4.3"/><path d="M6 3.4V6l1.9 1.1"/></g>`,
  warning: (c) => `<g stroke="${c}" stroke-width="1.1" fill="none" stroke-linejoin="round" stroke-linecap="round"><path d="M6 1.6 11 10.2H1z"/><path d="M6 4.9V7.2"/><path d="M6 8.9h.01"/></g>`,
}

function buildSankey(rawCols, flowGroups, special, selectedKey, statusFilter, W, H) {
  const padX = 28 // side breathing room (24–32px); columns span the full width
  const padTop = 30 // room for the level labels along the top
  const padBottom = 42 // room for reason pills hanging under the lowest nodes
  // leftmost column hugs the left padding (its labels read rightward); rightmost
  // column hugs the right padding (its labels read leftward); inner columns are
  // spread evenly across the remaining width so nothing crowds the middle.
  const x0 = padX + 8
  const x3 = W - padX - 7
  const colX = [x0, x0 + (x3 - x0) / 3, x0 + (2 * (x3 - x0)) / 3, x3]

  const cols = rawCols.map((c) => c.map((n) => ({ ...n })))
  const g = 14 // vertical gap between stacked nodes in a column
  cols.forEach((c) => {
    const t = c.reduce((s, n) => s + n.v, 0)
    const a = H - padTop - padBottom - g * (c.length - 1)
    let y = padTop
    c.forEach((n) => {
      n.h = a * (n.v / t) // node height ∝ volume; the column fills the full height
      n.y = y
      y += n.h + g
    })
  })
  const byKey = {}
  cols.forEach((c) => c.forEach((n) => (byKey[n.key] = n)))

  // total in/out volume per node so each ribbon can fill its node's full height
  // at both ends — a node's whole bar splits into the flows leaving it.
  const outTotal = {}
  const inTotal = {}
  flowGroups.forEach(({ from: ci, to: cj, flows }) =>
    flows.forEach(([ai, bi, v]) => {
      const a = cols[ci][ai]?.key
      const b = cols[cj][bi]?.key
      if (a && b) {
        outTotal[a] = (outTotal[a] || 0) + v
        inTotal[b] = (inTotal[b] || 0) + v
      }
    }),
  )

  // directed edges (forward = toward routes), incl. the special line-haul
  const fwd = {}
  const bwd = {}
  const addEdge = (a, b) => {
    ;(fwd[a] = fwd[a] || []).push(b)
    ;(bwd[b] = bwd[b] || []).push(a)
  }
  flowGroups.forEach(({ from: ci, to: cj, flows }) =>
    flows.forEach(([ai, bi]) => {
      const a = cols[ci][ai]?.key
      const b = cols[cj][bi]?.key
      if (a && b) addEdge(a, b)
    }),
  )
  if (special) addEdge(special.fromKey, special.toKey)

  const selActive = selectedKey && selectedKey !== ALL
  // downstream + upstream reachable closure from the selected node
  const bfs = (start, adj) => {
    const seen = new Set([start])
    const q = [start]
    while (q.length) {
      const k = q.shift()
      ;(adj[k] || []).forEach((nx) => {
        if (!seen.has(nx)) {
          seen.add(nx)
          q.push(nx)
        }
      })
    }
    return seen
  }
  const D = selActive ? bfs(selectedKey, fwd) : new Set()
  const U = selActive ? bfs(selectedKey, bwd) : new Set()
  const inPath = (key) => D.has(key) || U.has(key)
  // the n+1 level directly fed by the selected node (one hop downstream)
  const directNext = selActive ? new Set(fwd[selectedKey] || []) : new Set()
  const edgeLit = (a, b) => !selActive || inPath(a) || inPath(b)
  const stOK = (hl) => statusFilter === 'all' || hl === statusFilter
  // Opacity tiers: when a node is selected, it stays fully lit, the n+1 level it
  // feeds is highlighted too, and the rest of the connected path (all the way to
  // L4) stays clearly visible so the whole chain reads end-to-end. Everything off
  // the path is dimmed.
  const nodeOpacity = (nd) => {
    if (!stOK(nd.hl)) return 0.06
    if (!selActive) return 1
    if (nd.key === selectedKey) return 1
    if (directNext.has(nd.key)) return 0.9
    if (inPath(nd.key)) return 0.82
    return 0.08
  }

  // ── flows (filled ribbons that fill each node's height at both ends) ──
  let p = ''
  function drawRibbon(A, B, sx, sy0, ws, ex, ey0, wt, predicted) {
    const mx = (sx + ex) / 2
    // a ribbon takes the colour of the bar it flows INTO (its target node):
    // arriving at a green bar → green, amber bar → amber, red bar → red.
    const tgtBad = B.hl === 'bad'
    const tgtWarn = B.hl === 'warn'
    const col = tgtBad ? FLOW.bad : tgtWarn ? FLOW.warn : FLOW.ok
    // the status filter matches the ribbon's TARGET (which is also what colours
    // it), so filtering "On track" never leaves a red/amber ribbon lit
    const lit = edgeLit(A.key, B.key) && stOK(B.hl)
    // a ribbon is on the traced path when BOTH ends are reachable from the
    // selected node in one direction — lighting the whole chain L1→L2→L3→L4.
    const onPath = selActive && ((D.has(A.key) && D.has(B.key)) || (U.has(A.key) && U.has(B.key)))
    let op
    if (!lit) {
      op = 0.05
    } else {
      op = tgtBad ? 0.5 : tgtWarn ? 0.42 : 0.32
      if (selActive) {
        if (onPath) op = tgtBad ? 0.82 : tgtWarn ? 0.72 : 0.58
        else op *= 0.35
      }
    }
    const d = `M${sx},${sy0} C${mx},${sy0} ${mx},${ey0} ${ex},${ey0} L${ex},${ey0 + wt} C${mx},${ey0 + wt} ${mx},${sy0 + ws} ${sx},${sy0 + ws} Z`
    // clicking a ribbon selects its target node — surfaces the transit & why it's red
    if (predicted) {
      // forecast flow: light fill + a crisp STATIC dashed outline — the dashed
      // edge (like a projected line on a chart) reads as "not yet happened"
      return `<path class="rib pred${onPath ? ' lit' : ''}" data-key="${B.key}" d="${d}" fill="${col}" fill-opacity="${(op * 0.35).toFixed(3)}" stroke="${col}" stroke-width="1.4" stroke-dasharray="6 4" stroke-opacity="${Math.min(0.95, op + 0.45).toFixed(3)}"/>`
    }
    return `<path class="rib${onPath ? ' lit' : ''}" data-key="${B.key}" d="${d}" fill="${col}" fill-opacity="${op.toFixed(3)}" stroke="none"/>`
  }

  flowGroups.forEach(({ from: ci, to: cj, flows }) => {
    const oo = cols[ci].map(() => 0)
    const io = cols[cj].map(() => 0)
    // the chain runs left→right in time: producers→warehouses has already
    // happened (solid); downstream legs — onward to hubs and last-mile routes —
    // are still to come, so they read as predicted (dashed).
    const predicted = cj >= 2
    flows.forEach(([ai, bi, v]) => {
      const A = cols[ci][ai]
      const B = cols[cj][bi]
      if (!A || !B) return
      const sx = colX[ci] + 7 // right edge of the source bar
      const ex = colX[cj] - 8 // left edge of the target bar
      const ws = A.h * (v / outTotal[A.key]) // share of the source node's height
      const wt = B.h * (v / inTotal[B.key]) // share of the target node's height
      const sy0 = A.y + oo[ai]
      oo[ai] += ws
      const ey0 = B.y + io[bi]
      io[bi] += wt
      p += drawRibbon(A, B, sx, sy0, ws, ex, ey0, wt, predicted)
    })
  })

  if (special) {
    const A = byKey[special.fromKey]
    const B = byKey[special.toKey]
    if (A && B) {
      const x = colX[1] - 8
      const cx = x - 22
      const lit = edgeLit(A.key, B.key) && stOK(B.hl)
      const onPath = selActive && ((D.has(A.key) && D.has(B.key)) || (U.has(A.key) && U.has(B.key)))
      const op = onPath ? 0.95 : lit ? 0.6 : 0.05
      const w = onPath ? 5 : 3.6
      // the accident already happened → solid (an actual, not a forecast)
      p += `<path class="rib" data-key="${B.key}" d="M${x},${A.y + A.h / 2} C${cx},${A.y + A.h / 2} ${cx},${B.y + B.h / 2} ${x},${B.y + B.h / 2}" stroke="${HL.bad}" stroke-width="${w}" fill="none" opacity="${op}"/>`
    }
  }

  // Which node labels sit on top of a RED ribbon → render them white so the text
  // stays readable. A label on cols 0–2 sits over that node's OUTflows (coloured
  // by their target); we find the outflow crossing the node's vertical centre and
  // flag it red if that target is failing. A route label (col 3) sits over its
  // INflows, which are all coloured by the route itself — so a red route = red.
  const labelRed = {}
  flowGroups.forEach(({ from: ci, to: cj, flows }) => {
    if (ci >= 3) return
    const acc = {}
    flows.forEach(([ai, bi, v]) => {
      const A = cols[ci][ai]
      const B = cols[cj][bi]
      if (!A || !B) return
      const start = acc[A.key] || 0
      const end = start + v / outTotal[A.key]
      acc[A.key] = end
      if (0.5 >= start && 0.5 < end && B.hl === 'bad') labelRed[A.key] = true
    })
  })
  ;(cols[3] || []).forEach((nd) => {
    if (nd.hl === 'bad') labelRed[nd.key] = true
  })

  // ── nodes ──
  let n = ''
  cols.forEach((c, ci) =>
    c.forEach((nd) => {
      const x = colX[ci] - 8
      const cy = nd.y + nd.h / 2
      const sel = nd.key === selectedKey
      const op = nodeOpacity(nd)
      const rt = ci < 3
      const tx = rt ? x + 22 : x - 7
      const an = rt ? 'start' : 'end'

      let g = `<g class="snode-g" data-key="${nd.key}" opacity="${op}">`
      if (sel) {
        g += `<rect x="${x - 4}" y="${nd.y - 4}" width="23" height="${nd.h + 8}" rx="6" fill="none" stroke="${HL[nd.hl]}" stroke-width="2"/>`
      } else if (directNext.has(nd.key)) {
        g += `<rect x="${x - 3}" y="${nd.y - 3}" width="21" height="${nd.h + 6}" rx="5" fill="none" stroke="${HL[nd.hl]}" stroke-width="1.4" stroke-dasharray="3 2.5"/>`
      }
      g += `<rect class="snode${nd.hl === 'bad' ? ' bad' : ''}" x="${x}" y="${nd.y}" width="15" height="${nd.h}" rx="3" fill="${HL[nd.hl]}"/>`
      const onRed = labelRed[nd.key]
      g += `<text class="snlab" x="${tx}" y="${cy - 1}" text-anchor="${an}"${onRed ? ' fill="#fff"' : ''}>${nd.n}</text>`
      g += `<text class="snvol" x="${tx}" y="${cy + 11}" text-anchor="${an}"${onRed ? ' fill="rgba(255,255,255,0.82)"' : ''}>${nd.v}%</text>`
      if (nd.reason) {
        const tone = REASON[nd.hl] || REASON.warn
        const draw = ICONS[nd.icon] || ICONS.warning
        // failure reason as a pill on the label side — icon + text, evenly padded
        // and vertically centred, sitting clear below the node's volume label
        const ry = cy + 23 // pill vertical centre
        const padI = 7 // inner horizontal padding (equal on both sides)
        const iconW = 11
        const gap = 6 // gap between icon and text
        const txtW = nd.reason.length * 4.55 // tight estimate — no trailing gap
        const pillW = padI * 2 + iconW + gap + txtW
        const pillH = 18
        const px = rt ? tx - padI : tx - pillW + padI
        g += `<g class="rreason"><title>${nd.reason}</title>`
        g += `<rect x="${px}" y="${ry - pillH / 2}" width="${pillW}" height="${pillH}" rx="${pillH / 2}" fill="${tone.bg}"/>`
        g += `<g transform="translate(${px + padI},${ry - iconW / 2})">${draw(tone.fg)}</g>`
        g += `<text class="sreason" x="${px + padI + iconW + gap}" y="${ry + 3.2}" text-anchor="start" fill="${tone.fg}">${nd.reason}</text>`
        g += `</g></g>`
      }
      g += `</g>`
      n += g
    }),
  )

  // level labels along the TOP, aligned to each column
  let s = ''
  sankeyStages.forEach((st, i) => {
    const an = i === 0 ? 'start' : i === colX.length - 1 ? 'end' : 'middle'
    const lx = i === 0 ? padX : i === colX.length - 1 ? W - padX : colX[i]
    s += `<text class="sslab" x="${lx}" y="16" text-anchor="${an}">${st}</text>`
  })

  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">${p}${n}${s}</svg>`
}

export default function Sankey({ selectedKey, onSelect, statusFilter }) {
  const stageRef = useRef(null)
  // render the SVG at the container's real pixel size so it fills the width
  // (no letterbox whitespace) and stays crisp on resize
  const [size, setSize] = useState({ w: 900, h: 460 })
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      // low floors so the viewBox matches the real container (no letterbox) at
      // normal sizes; the floor only guards against degenerate tiny layouts
      setSize({ w: Math.max(320, Math.round(width)), h: Math.max(240, Math.round(height)) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const svg = useMemo(
    () => buildSankey(sankeyCols, sankeyFlowGroups, sankeySpecial, selectedKey, statusFilter, size.w, size.h),
    [selectedKey, statusFilter, size.w, size.h],
  )

  function onClick(e) {
    const el = e.target.closest('[data-key]')
    onSelect(el ? el.getAttribute('data-key') : ALL)
  }

  return (
    <div className="panel mappanel">
      <div className="stage sankey-stage" onClick={onClick}>
        <div ref={stageRef} dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
      <div className="lg">
        <span><span className="sq" style={{ background: HL.ok }} />On track</span>
        <span><span className="sq" style={{ background: HL.warn }} />Strained</span>
        <span><span className="pulse" />At risk / failing</span>
        <span><span className="flk" />Actual</span>
        <span><span className="flk dash" />Predicted</span>
        <span style={{ color: 'var(--ink3)' }}>Width = volume share</span>
      </div>
    </div>
  )
}
