import { useMemo, useState } from 'react'

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

// don't surface the word "Unassigned" — show a muted dash until someone's assigned
function assignee(name) {
  if (!name || name === 'Unassigned') return <span className="tbl-dim">—</span>
  return name
}

function StatusBadge({ status }) {
  return (
    <span className="tbl-status" style={{ '--sc': statusColor(status) }}>
      <span className="tbl-status-dot" /> {status || '—'}
    </span>
  )
}

const SKEL_W = ['72%', '54%', '63%', '48%', '67%', '58%', '60%', '50%']

function SkeletonBody() {
  return (
    <tbody className="tbl-skel">
      {SKEL_W.map((w, r) => (
        <tr key={r} className="tbl-skel-row">
          <td className="tbl-c-issue">
            <span className="skl skl-line" style={{ width: w }} />
          </td>
          <td><span className="skl skl-pill" /></td>
          <td><span className="skl skl-line" style={{ width: '80%' }} /></td>
          <td><span className="skl skl-line" style={{ width: '70%' }} /></td>
          <td className="tbl-c-score"><span className="skl skl-score" /></td>
          <td><span className="skl skl-line" style={{ width: '85%' }} /></td>
        </tr>
      ))}
    </tbody>
  )
}

export default function IssuesTable({ issues, onOpen, loading }) {
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return issues
    return issues.filter(
      (i) =>
        i.title.toLowerCase().includes(needle) ||
        (i.assignee || '').toLowerCase().includes(needle) ||
        (i.owner || '').toLowerCase().includes(needle) ||
        (i.status || '').toLowerCase().includes(needle),
    )
  }, [issues, q])

  return (
    <div className="tblpanel">
      <div className="tbl-head">
        <div className="tbl-head-l">
          <h2>All issues</h2>
          {loading ? <span className="skl skl-count" /> : <span className="tbl-count">{issues.length}</span>}
        </div>
        <div className="tbl-head-r">
          <input
            className="tbl-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search issues, owner, assignee…"
            disabled={loading}
          />
        </div>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th className="tbl-c-issue">Issue</th>
              <th>Status</th>
              <th>Owner</th>
              <th>Assignee</th>
              <th className="tbl-c-score">Score</th>
              <th>Time window</th>
            </tr>
          </thead>
          {loading ? (
            <SkeletonBody />
          ) : (
          <tbody>
            {rows.map((i) => (
              <tr className="tbl-row" key={i.id} onClick={() => onOpen(i)}>
                <td className="tbl-c-issue">
                  <div className="tbl-title">{i.title}</div>
                </td>
                <td><StatusBadge status={i.status} /></td>
                <td className="tbl-person">{i.owner}</td>
                <td className="tbl-person">{assignee(i.assignee)}</td>
                <td className="tbl-c-score"><span className={`score ${scoreTone(i.score)}`}>{i.score}</span></td>
                <td className="tbl-win">{i.clkLabel} {i.clk}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="tbl-empty">No issues match “{q}”.</td>
              </tr>
            )}
          </tbody>
          )}
        </table>
      </div>
    </div>
  )
}
