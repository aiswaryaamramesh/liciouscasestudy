import { useMemo, useState } from 'react'
import Sankey from './components/Sankey.jsx'
import ContextPanel from './components/ContextPanel.jsx'
import Dropdown from './components/Dropdown.jsx'
import AllIssuesPage from './components/AllIssuesPage.jsx'
import { ALL, sankeyCols, sankeyStages } from './data.js'

const STATUS_OPTS = [
  ['all', 'All statuses'],
  ['bad', 'At risk'],
  ['warn', 'Strained'],
  ['ok', 'On track'],
]

function FlowerLogo() {
  return (
    <svg className="logo" width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <ellipse key={a} cx="12" cy="6.4" rx="2.6" ry="4.4" fill="var(--red)" opacity="0.92" transform={`rotate(${a} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="3.1" fill="#ffb732" />
    </svg>
  )
}

function AccountButton() {
  return (
    <button className="acct" title="Account" aria-label="Account">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <circle cx="12" cy="8.5" r="3.4" />
        <path d="M5.5 19a6.6 6.6 0 0 1 13 0" />
      </svg>
    </button>
  )
}

export default function App() {
  const [selected, setSelected] = useState(ALL)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState('dashboard')
  // live, in-session overrides per issue id — as steps get worked, an issue's
  // status / viability label / score update, and that flows to the cards, the
  // table and the detail panel alike.
  const [issueOverrides, setIssueOverrides] = useState({})
  const patchIssue = (id, patch) =>
    setIssueOverrides((o) => ({ ...o, [id]: { ...o[id], ...patch } }))

  // option groups for the shared filters — warehouse names drop the "×8" count
  const nodeGroups = useMemo(
    () => [
      { label: '', options: [{ value: ALL, label: 'All areas' }] },
      ...sankeyCols.map((col, i) => ({
        label: sankeyStages[i],
        options: col.map((nd) => ({ value: nd.key, label: nd.n.replace(/\s*×\d+/, '') })),
      })),
    ],
    [],
  )
  const statusGroups = useMemo(
    () => [{ label: '', options: STATUS_OPTS.map(([v, l]) => ({ value: v, label: l })) }],
    [],
  )

  return (
    <div id="app">
      <nav className="topbar">
        <div className="l">
          <FlowerLogo />
          <div className="brand">
            <span className="wm">
              Bloom<span className="di">l</span>ine<span className="smile" />
            </span>
            <span className="sep">Control Tower</span>
          </div>
        </div>
        <div className="r">
          <div className="fresh">
            <span className="dot" /> Updated 25 secs ago
          </div>
          <AccountButton />
        </div>
      </nav>

      {page === 'dashboard' ? (
        <>
          {/* view header + shared filters on one line, outside the cards */}
          <div className="viewhead">
            <div className="vh-title">
              <h1>Network flow &amp; failures</h1>
              <div className="vsub">8 belts · 30 warehouses · ~500 routes</div>
            </div>
            <div className="topfilters">
              <Dropdown value={selected} onChange={setSelected} groups={nodeGroups} searchable title="Region / node" />
              <Dropdown value={statusFilter} onChange={setStatusFilter} groups={statusGroups} title="Status filter" />
            </div>
          </div>

          <div className="grid">
            <Sankey selectedKey={selected} onSelect={setSelected} statusFilter={statusFilter} />
            <ContextPanel
              scopeKey={selected}
              onViewAll={() => setPage('issues')}
              overrides={issueOverrides}
              onPatch={patchIssue}
            />
          </div>
        </>
      ) : (
        <AllIssuesPage onBack={() => setPage('dashboard')} overrides={issueOverrides} onPatch={patchIssue} />
      )}
    </div>
  )
}
