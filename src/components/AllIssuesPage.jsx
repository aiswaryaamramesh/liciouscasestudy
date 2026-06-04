import { useEffect, useState } from 'react'
import IssuesTable from './IssuesTable.jsx'
import IssueModal from './IssueModal.jsx'
import { issuesFor, ALL } from '../data.js'

export default function AllIssuesPage({ onBack, overrides = {}, onPatch }) {
  const [detailId, setDetailId] = useState(null)
  const [loading, setLoading] = useState(true)
  const all = issuesFor(ALL)
    .map((i) => ({ ...i, ...overrides[i.id] }))
    .sort((a, b) => b.score - a.score)
  const detail = detailId ? all.find((i) => i.id === detailId) : null

  // simulate the table fetching its rows so the transition feels real
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 850)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="issuespage">
      <nav className="crumbs" aria-label="Breadcrumb">
        <button type="button" className="crumb-link" onClick={onBack}>
          Control Tower
        </button>
        <span className="crumb-sep">›</span>
        <span className="crumb-cur">All issues</span>
      </nav>

      <div className="panel issuespanel">
        <IssuesTable issues={all} onOpen={(i) => setDetailId(i.id)} loading={loading} />
      </div>

      {detail && <IssueModal issue={detail} onClose={() => setDetailId(null)} onPatch={onPatch} />}
    </div>
  )
}
