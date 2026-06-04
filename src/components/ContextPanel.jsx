import { useState } from 'react'
import CapacityRing from './CapacityRing.jsx'
import IssueModal from './IssueModal.jsx'
import { nodeDetails, issuesFor, subWarehouses, subHubs, ALL } from '../data.js'


// Tone for a warehouse's drill-down badge, based on its open issues.
function whTone(w) {
  const n = (w.issues || []).length
  if (w.fail || n >= 2) return 'r'
  if (n >= 1) return 'a'
  return 'ok'
}

function WarehouseRow({ w, open, onToggle }) {
  const wis = w.issues || []
  const tone = whTone(w)
  return (
    <div className="whrow-wrap">
      <div
        className={`whrow ${open ? 'open' : ''}`}
        onClick={() => wis.length && onToggle()}
        style={{ cursor: wis.length ? 'pointer' : 'default' }}
      >
        <CapacityRing value={w.cap} fail={w.fail} />
        <div className="whmeta">
          <div className="whn">{w.id}</div>
          <div className="wha">{w.area}</div>
        </div>
        {wis.length ? (
          <div className={`whstat ${tone}`}>
            <span className="whx">!</span>
            {wis.length} flag{wis.length > 1 ? 's' : ''}
            <span className="whchev">{open ? '▾' : '›'}</span>
          </div>
        ) : (
          <div className="whstat clear" title="No active flags">
            <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 6.2 5 8.6l4.5-5" />
            </svg>
          </div>
        )}
      </div>
      {open && wis.length > 0 && (
        <ul className="whissues">
          {wis.map((it, i) => (
            <li key={i}>
              <span className={`widot ${tone}`} />
              {it}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// priority-score tone: high score = more urgent
function scoreTone(score) {
  const n = Number(score)
  if (n >= 70) return 'hi'
  if (n >= 45) return 'mid'
  return 'lo'
}

function statusColor(status) {
  const s = (status || '').toLowerCase()
  if (s === 'open') return '#cc0000'
  if (s === 'mitigating' || s === 'recovering') return '#b9791a'
  if (s === 'monitoring' || s === 'preventing') return '#3b6fed'
  if (s === 'resolved') return '#3f9d52'
  return '#6b6660'
}

function IssueCard({ issue, onSee }) {
  const blast = (issue.detail?.blast || []).join(' · ')
  return (
    <div className={`ac ${issue.sev}`} onClick={onSee} style={{ cursor: 'pointer' }}>
      <div className="r1">
        <div className="tt">{issue.title}</div>
        <span className={`score ${scoreTone(issue.score)}`} title="Priority score">
          {issue.score}
        </span>
        {issue.status && (
          <span className="chip stat" style={{ '--sc': statusColor(issue.status) }}>{issue.status}</span>
        )}
      </div>
      <div className="ac-meta">
        <div className="acm">
          <span className="acm-k">{issue.clkLabel}</span>
          <span className={`acm-v ${issue.urgent ? 'urgent' : ''}`}>{issue.clk}</span>
        </div>
        {blast && (
          <div className="acm">
            <span className="acm-k">Blast radius</span>
            <span className="acm-v">{blast}</span>
          </div>
        )}
        {issue.orders && (
          <div className="acm">
            <span className="acm-k">Orders</span>
            <span className="acm-v">{issue.orders}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ContextPanel({ scopeKey, onViewAll, overrides = {}, onPatch }) {
  const [openWh, setOpenWh] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const node = nodeDetails[scopeKey] || nodeDetails[ALL]
  // apply any live overrides, then re-sort so a de-escalated issue sinks
  const list = issuesFor(scopeKey)
    .map((i) => ({ ...i, ...overrides[i.id] }))
    .sort((a, b) => b.score - a.score)
  const detail = detailId ? list.find((i) => i.id === detailId) : null
  // both warehouse clusters and hub nodes drill down into individual units
  const subs = subWarehouses[scopeKey] || subHubs[scopeKey]
  const subLabel = subWarehouses[scopeKey] ? 'Warehouses' : 'Hubs'

  return (
    <div className="panel ctx">
      <div className="ctx-head">
        <div className="ch-row">
          <h2>{node.name}</h2>
          <span className={`pill ${node.status}`}>
            {list.length > 0
              ? `${list.length} critical alert${list.length > 1 ? 's' : ''}`
              : 'No active alerts'}
          </span>
        </div>
        <div className="ch-sub">{node.sub}</div>
      </div>

      <div className="ctx-sec">
        <div className="sec-t">Overview</div>
        <div className="mgrid">
          {node.metrics.map((m) => {
            // pure numbers/percentages/currency render big; anything with words or
            // codes renders smaller — but both use the same page sans for consistency
            const isNum = /^[~₹]?[\d.,]+[%kKLlmM]?(\s*\(\d+\))?$/.test(String(m.v).trim())
            return (
              <div className="mtile" key={m.k}>
                <div className="mk">{m.k}</div>
                <div className={`mv ${m.tone} ${isNum ? '' : 'txt'}`}>{m.v}</div>
              </div>
            )
          })}
        </div>
      </div>

      {subs && (
        <div className="ctx-sec">
          <div className="sec-t">
            {subLabel} <span className="cnt">{subs.length}</span>
            {(() => {
              const tot = subs.reduce((s, w) => s + (w.issues || []).length, 0)
              return (
                <span className={`scope-hint ${tot ? 'has-iss' : ''}`}>
                  {tot ? `${tot} flag${tot > 1 ? 's' : ''}` : 'All clear'}
                </span>
              )
            })()}
          </div>
          <div className="whlist">
            {subs.map((w) => (
              <WarehouseRow
                key={w.id}
                w={w}
                open={openWh === w.id}
                onToggle={() => setOpenWh(openWh === w.id ? null : w.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="ctx-sec">
        <div className="sec-t">
          Issues <span className="cnt">{list.length}</span>
          <button className="viewall" onClick={onViewAll}>View all →</button>
        </div>
        {list.length === 0 ? (
          <div className="empty">No active issues in this area.</div>
        ) : (
          <div className="ilist">
            {list.map((i) => (
              <IssueCard key={i.id} issue={i} onSee={() => setDetailId(i.id)} />
            ))}
          </div>
        )}
      </div>

      {detail && <IssueModal issue={detail} onClose={() => setDetailId(null)} onPatch={onPatch} />}
    </div>
  )
}
