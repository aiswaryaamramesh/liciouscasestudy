import { useEffect, useMemo, useRef, useState } from 'react'

function initials(name) {
  return (name || '?')
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

// Custom (non-native) dropdown. `groups` is [{ label, options: [{value, label}] }];
// a group with an empty label renders no header. When `searchable`, a search box
// filters the options live.
export default function Dropdown({ value, onChange, groups, searchable = false, title, placeholder = 'Select', align = 'right', avatar = false }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const allOptions = useMemo(() => groups.flatMap((g) => g.options), [groups])
  const selected = allOptions.find((o) => o.value === value)

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return groups
    return groups
      .map((g) => ({
        ...g,
        options: g.options.filter(
          (o) => o.label.toLowerCase().includes(needle) || (o.sub && o.sub.toLowerCase().includes(needle)),
        ),
      }))
      .filter((g) => g.options.length)
  }, [groups, q])

  const pick = (v) => {
    onChange(v)
    setOpen(false)
    setQ('')
  }

  return (
    <div className={`dd ${open ? 'open' : ''} ${avatar ? 'dd-avatar' : ''}`} ref={ref}>
      <button
        type="button"
        className="dd-trig"
        title={title}
        onClick={() => setOpen((o) => !o)}
      >
        {avatar && selected && <span className="dd-av">{initials(selected.label)}</span>}
        {avatar && selected ? (
          <span className="dd-valwrap">
            <span className="dd-val">{selected.label}</span>
            {selected.sub && <span className="dd-val-sub">{selected.sub}</span>}
          </span>
        ) : (
          <span className="dd-val">{selected ? selected.label : placeholder}</span>
        )}
        <svg className="dd-chev" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M2 3.5 5 6.5 8 3.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className={`dd-pop ${align === 'left' ? 'left' : ''}`}>
          {searchable && (
            <input
              className="dd-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              autoFocus
            />
          )}
          <div className="dd-list">
            {filtered.map((g, gi) => (
              <div className="dd-group" key={g.label || gi}>
                {g.label ? <div className="dd-grp">{g.label}</div> : null}
                {g.options.map((o) => (
                  <button
                    type="button"
                    key={o.value}
                    className={`dd-opt ${o.value === value ? 'sel' : ''}`}
                    onClick={() => pick(o.value)}
                  >
                    <span className="dd-opt-main">
                      <span className="dd-opt-label">{o.label}</span>
                      {o.sub && <span className="dd-opt-sub">{o.sub}</span>}
                    </span>
                    {o.value === value && (
                      <svg className="dd-check" width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M2.5 6.2 5 8.6l4.5-5" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            ))}
            {filtered.length === 0 && <div className="dd-empty">No matches</div>}
          </div>
        </div>
      )}
    </div>
  )
}
