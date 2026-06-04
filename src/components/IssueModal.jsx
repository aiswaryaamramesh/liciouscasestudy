import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import Dropdown from './Dropdown.jsx'
import RouteMap from './RouteMap.jsx'
import { impactScore, scoreLabels, SCORE_MODEL } from '../data.js'

const J_STATE = { ok: '#3f9d52', warn: '#b9791a', bad: '#cc0000', pending: '#c7c1b8' }

// tel: links only place a call where the OS can (macOS FaceTime / iPhone / iPad).
// On Windows we show the number, non-clickable, instead.
const CAN_CALL =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || '')

// the control-tower operator — issues auto-assign to them; named everywhere
const SELF = {
  name: 'Aiswarya Ramesh',
  role: 'Operations manager',
  place: 'Control tower · Bangalore',
  phone: '+91 98765 43210',
  email: 'aiswarya.r@bloomline.co',
}
const ME = SELF.name

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

function initials(name) {
  return (name || '?')
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function renderComment(text, names) {
  const sorted = [...names].sort((a, b) => b.length - a.length)
  const out = []
  let rest = text
  let key = 0
  while (rest.length) {
    let at = -1
    let hit = null
    for (const n of sorted) {
      const idx = rest.indexOf('@' + n)
      if (idx !== -1 && (at === -1 || idx < at)) {
        at = idx
        hit = n
      }
    }
    if (at === -1) {
      out.push(rest)
      break
    }
    if (at > 0) out.push(rest.slice(0, at))
    out.push(
      <span className="mention" key={key++}>
        @{hit}
      </span>,
    )
    rest = rest.slice(at + 1 + hit.length)
  }
  return out
}

function PhoneIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.6 2.3 4.3 2l1 2.2-1 .8c.5 1 1.3 1.8 2.3 2.3l.8-1 2.2 1-.3 1.7c-3.8.2-6.6-2.6-6.7-6.4z" />
    </svg>
  )
}

function Section({ title, count, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`sp-sec ${open ? 'open' : ''}`}>
      <button type="button" className="sp-sec-h" onClick={() => setOpen((o) => !o)}>
        <span className="sp-sec-t">
          {title}
          {count != null && <span className="sp-cnt">{count}</span>}
        </span>
        <svg className="sp-chev" width="12" height="12" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M2 3.5 5 6.5 8 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="sp-sec-b">{children}</div>}
    </div>
  )
}

export default function IssueModal({ issue, onClose, onPatch }) {
  const team = issue.team || { name: 'team', people: [] }
  const taggable = [SELF.name, ...team.people.map((p) => p.name), issue.owner].filter(Boolean)

  const [assigned, setAssigned] = useState(SELF) // auto-assigned to the ops manager
  const cid = useRef(1)
  const [comments, setComments] = useState(() =>
    (issue.log || [])
      .map((e, idx) => ({ id: -1 - idx, who: e.who, text: e.text, time: e.time, system: e.who === 'System' }))
      .reverse(),
  )
  const [draft, setDraft] = useState('')
  const [mention, setMention] = useState(null)
  const [stepAssignee, setStepAssignee] = useState({}) // step index → assignee name
  const [assignedCount, setAssignedCount] = useState(0) // sequential — N assigned means 0..N-1 are assigned
  const [ownWay, setOwnWay] = useState(false) // operator chose to handle it independently
  const [status, setStatus] = useState(issue.status) // live status that progresses as you work
  const [journey, setJourney] = useState(issue.journey || []) // grows when the order recovers
  const [resolving, setResolving] = useState(false) // brief "applying recovery" loader
  const taRef = useRef(null)
  const resolvedRef = useRef(false)
  const resolveTimer = useRef(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // clear the pending "applying recovery" timer if the panel closes mid-flight
  useEffect(() => () => clearTimeout(resolveTimer.current), [])

  // when every manual step is done (and it's not delegated), the issue resolves
  useEffect(() => {
    const steps = issue.nextSteps || []
    const isDelegated = assigned && assigned.name !== SELF.name
    if (!isDelegated && !ownWay && steps.length && assignedCount === steps.length && !resolvedRef.current) {
      resolvedRef.current = true
      // de-escalate, but not instantly: show a brief "applying recovery" loader
      // so it reads like the system is propagating the change, THEN flip the
      // status, drop the priority score and reframe the "viable for" countdown.
      // recompute via the scoring model: recovery underway eases time-to-failure,
      // and containing the issue shrinks its radius and customer exposure.
      const newScore = issue.sc
        ? impactScore({ ...issue.sc, timeToFailure: 1, impactRadius: 1, customerExposure: 1 })
        : Math.max(1, Math.round(issue.score * 0.5))
      setResolving(true)
      addComment(ME, 'All steps assigned — applying recovery…')
      resolveTimer.current = setTimeout(() => {
        setStatus('Mitigating')
        const patch = { status: 'Mitigating', score: newScore }
        if (issue.clkLabel === 'Viable for') patch.clkLabel = 'Trying to save in'
        if (onPatch) onPatch(issue.id, patch)
        // the blocked order resumes — append the recovery to its journey
        if (issue.recovery && issue.recovery.length) setJourney((j) => [...j, ...issue.recovery])
        addComment(ME, `Recovery applied — order recovering · priority ${issue.score} → ${newScore}`)
        setResolving(false)
      }, 1800)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedCount, assigned, ownWay])

  const addComment = (who, text, system = false) => {
    const id = cid.current++
    setComments((c) => [{ id, who, text, time: 'just now', system }, ...c])
    return id
  }

  const assignGroups = [
    {
      label: '',
      options: [{ value: SELF.name, label: SELF.name, sub: SELF.role }],
    },
    {
      label: team.name,
      options: team.people.map((p) => ({ value: p.name, label: p.name, sub: `${p.role} · ${p.place}` })),
    },
  ]
  const assign = (name) => {
    if (name === SELF.name) {
      if (assigned?.name === SELF.name) return
      setAssigned(SELF)
      addComment(ME, `Assigned this to @${SELF.name} · ${SELF.role}`)
      return
    }
    const person = team.people.find((p) => p.name === name)
    if (!person || person.name === assigned?.name) return
    setAssigned(person)
    addComment(ME, `Assigned this to @${person.name} · ${person.role} (${team.name})`)
  }

  const updateMention = (val, caret) => {
    const m = val.slice(0, caret).match(/(?:^|\s)@([^\s@]*)$/)
    if (m) setMention({ query: m[1].toLowerCase(), start: caret - m[1].length - 1 })
    else setMention(null)
  }
  const onDraftChange = (e) => {
    setDraft(e.target.value)
    updateMention(e.target.value, e.target.selectionStart)
  }
  const suggestions = mention ? taggable.filter((n) => n.toLowerCase().includes(mention.query)).slice(0, 6) : []
  const pickMention = (name) => {
    const ta = taRef.current
    const caret = ta ? ta.selectionStart : draft.length
    const before = draft.slice(0, mention.start)
    const inserted = `@${name} `
    setDraft(before + inserted + draft.slice(caret))
    setMention(null)
    requestAnimationFrame(() => {
      if (!ta) return
      ta.focus()
      const pos = (before + inserted).length
      ta.setSelectionRange(pos, pos)
    })
  }

  const postComment = () => {
    const t = draft.trim()
    if (!t) return
    addComment(ME, t)
    setDraft('')
    setMention(null)
  }
  // steps run in order: only the active step (index === assignedCount) can be
  // assigned; assigning it advances the sequence and logs who it went to.
  const assignStep = (i, name, step) => {
    if (i > assignedCount) return // locked
    const person = (step.who && step.who.length ? step.who : team.people).find((p) => p.name === name)
    if (!person) return
    setStepAssignee((m) => ({ ...m, [i]: name }))
    if (i === assignedCount) setAssignedCount(i + 1)
    addComment(ME, `Assigned “${step.text}” to @${name} · ${person.role}`)
  }
  // a decision step (Approve / Authorise — no external contact) is the operator's
  // own sign-off, so it's actioned directly rather than handed to someone else.
  const actStep = (i, step) => {
    if (i > assignedCount) return // locked
    setStepAssignee((m) => ({ ...m, [i]: ME }))
    if (i === assignedCount) setAssignedCount(i + 1)
    addComment(ME, step.log || `${step.cta}d “${step.text}”`)
  }
  const handleOwnWay = () => {
    setOwnWay(true)
    addComment(ME, 'Chose to handle this independently — recommended steps dismissed')
  }
  const useRecommended = () => {
    setOwnWay(false)
    addComment(ME, 'Switched back to the recommended steps')
  }

  const d = issue.detail
  const isSelf = assigned && assigned.name === SELF.name
  const delegated = assigned && !isSelf
  const stepOwner = !assigned ? 'Recommended steps' : `${assigned.name.split(' ')[0]}'s next steps`
  return (
    <div className="sp-overlay" onClick={onClose}>
      <aside className="sp sp-wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="sp-head">
          <div className="sp-head-top">
            <div className="sp-ty">{d.ty}</div>
            <button type="button" className="sp-close" onClick={onClose} aria-label="Close">
              <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M3 3l8 8M11 3l-8 8" />
              </svg>
            </button>
          </div>
          <div className="sp-titlerow">
            <h2>{issue.title}</h2>
            <div className="sp-ttags">
              <span className="sp-status-pill" style={{ '--sc': statusColor(status) }}>{status}</span>
              <span className={`score ${scoreTone(issue.score)} sp-score-tag`} tabIndex={issue.sc ? 0 : undefined}>
                {issue.score}
                {issue.sc && (
                  <span className="sp-score-tip" role="tooltip">
                    <span className="sp-score-tip-f">
                      (Value + 2·Urgency + Impact radius + Customer exposure) ÷ 22 × 100
                    </span>
                    {['value', 'perishability', 'timeToFailure', 'impactRadius', 'customerExposure'].map((k) => (
                      <span className="sp-score-tip-r" key={k}>
                        <span className="sp-score-tip-k">{scoreLabels[k]}</span>
                        <span className="sp-score-tip-v">
                          <b>{issue.sc[k]}</b> {SCORE_MODEL[k][issue.sc[k]]}
                        </span>
                      </span>
                    ))}
                  </span>
                )}
              </span>
            </div>
          </div>
          <div className="sp-chips">
            <span className={`chip clk ${issue.urgent ? 'urgent' : ''}`}>
              <Icon name="clock" /> {issue.clkLabel} {issue.clk}
            </span>
            {(issue.chips || []).map((c, i) => (
              <span key={i} className="chip">
                <Icon name={c[0]} /> <b>{c[1]}</b>
              </span>
            ))}
            <span className="chip plain">{d.where}</span>
          </div>
        </div>

        <div className="sp-body sp-grid">
          {/* LEFT — what's happened */}
          <div className="sp-col sp-col-l">
            <div className="sp-colhead">What's happened</div>

            <RouteMap journey={issue.journey} />

            {issue.rootCause && (
              <div className="sp-root">
                <div className="sp-root-k">Root cause</div>
                <div className="sp-root-v">{issue.rootCause}</div>
              </div>
            )}

            <Section title="Order journey">
              <ol className="sp-journey">
                {journey.map((s, i) => (
                  <li key={i} className={`sp-step st-${s.state}`}>
                    <span className="sp-dot" style={{ background: J_STATE[s.state] }} />
                    <div className="sp-step-b">
                      <div className="sp-step-h">
                        <span className="sp-stage">{s.stage}</span>
                        <span className="sp-time">{s.time}</span>
                      </div>
                      <div className="sp-place">{s.place}</div>
                      <div className="sp-note">{s.note}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </Section>

            <Section title="Impact if unresolved">
              <div className="sp-iss" dangerouslySetInnerHTML={{ __html: d.iss }} />
              <div className="sp-blast">
                {d.blast.map((b, i) => (
                  <span key={i} className="sp-tag">{b}</span>
                ))}
              </div>
            </Section>
          </div>

          {/* RIGHT — what to do now */}
          <div className="sp-col sp-col-r">
            <div className="sp-colhead">What to do now</div>

            <div className="sp-assignsec">
              <div className="sp-sec-t">Assignee</div>
              <Dropdown value={assigned?.name || ''} onChange={assign} groups={assignGroups} placeholder="Assign to…" align="left" searchable avatar title="Assignee" />
            </div>

            <div className="sp-rec-block">
              <div className="sp-rec-k">Recommended resolution</div>
              <div className="sp-rec-v" dangerouslySetInnerHTML={{ __html: d.rec.t }} />

              {delegated ? (
                <div className="sp-fu-note">
                  {assigned.name} · {assigned.role} is handling the next steps — they'll update the log here.
                </div>
              ) : ownWay ? (
                <div className="sp-fu-note">
                  You're handling this your own way — recommended steps dismissed.{' '}
                  <button type="button" className="sp-linkbtn" onClick={useRecommended}>Use recommended steps</button>
                </div>
              ) : (
                <>
                  <div className="sp-fu-grp">
                    <div className="sp-fu-k">{stepOwner}</div>
                    <ul className="sp-fu todo seq">
                      {(issue.nextSteps || []).map((s, i) => {
                        const isAssigned = i < assignedCount
                        const isLocked = i > assignedCount
                        const who = stepAssignee[i]
                        // a self-action step has no external contact (no phone,
                        // no recipient) — the operator actions it directly rather
                        // than assigning it to someone else. A sign-off decision
                        // (Approve / Authorise) reads as that verb; any other
                        // self-action is simply "Mark as done".
                        const selfAct = !s.to && !s.tel
                        const isDecision = s.cta === 'Approve' || s.cta === 'Authorise'
                        const doLabel = isDecision ? s.cta : 'Mark as done'
                        const doneLabel = isDecision ? `${s.cta}d` : 'Done'
                        // only the people connected to THIS step are assignable
                        const stepPeople = s.who && s.who.length ? s.who : team.people
                        const stepGroups = [
                          { label: '', options: stepPeople.map((p) => ({ value: p.name, label: p.name, sub: p.role })) },
                        ]
                        return (
                          <li key={i} className={isAssigned ? 'on' : isLocked ? 'locked' : 'active'}>
                            <div className="sp-fu-row">
                              <span className={`sp-fu-ind ${isAssigned ? 'done' : isLocked ? 'locked' : 'active'}`}>
                                {isAssigned ? (
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.2 5 8.6l4.5-5" /></svg>
                                ) : (
                                  i + 1
                                )}
                              </span>
                              <span className="sp-fu-txt">{s.text}</span>
                              {!isLocked &&
                                (selfAct ? (
                                  isAssigned ? (
                                    <span className="sp-fu-by">{doneLabel} · {ME.split(' ')[0]}</span>
                                  ) : (
                                    <button type="button" className="sp-fu-do" onClick={() => actStep(i, s)}>
                                      {doLabel}
                                    </button>
                                  )
                                ) : (
                                  <Dropdown
                                    value={who || ''}
                                    onChange={(name) => assignStep(i, name, s)}
                                    groups={stepGroups}
                                    placeholder="Assign"
                                    align="right"
                                    searchable
                                    title="Assign this step"
                                  />
                                ))}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                  {resolving ? (
                    <div className="sp-resolving" role="status">
                      <span className="sp-spin" />
                      Applying recovery — updating status &amp; priority…
                    </div>
                  ) : assignedCount < (issue.nextSteps || []).length ? (
                    <button type="button" className="sp-ownway" onClick={handleOwnWay}>
                      I'll handle it my own way →
                    </button>
                  ) : null}
                </>
              )}

              <div className="sp-fu-grp">
                <div className="sp-fu-k">Happening in the background</div>
                <ul className="sp-fu bg">
                  {(issue.background || []).map((b, i) => {
                    const running = !!b.eta
                    return (
                      <li key={i}>
                        <span className={`sp-fu-auto ${running ? 'run' : ''}`}>
                          {!running && (
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.2 5 8.6l4.5-5" /></svg>
                          )}
                        </span>
                        <div className="sp-bg-b">
                          <div className="sp-bg-text">{b.text}</div>
                          <div className="sp-bg-meta">{b.by} · {running ? `ETA ${b.eta}` : 'just now'}</div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>

            <div className="sp-comments">
              <div className="sp-sec-t sp-comments-h">
                Comments <span className="sp-cnt">{comments.length}</span>
              </div>
              <div className="sp-cbox">
                <div className="sp-ta-wrap">
                  <textarea
                    ref={taRef}
                    className="sp-cinput"
                    value={draft}
                    onChange={onDraftChange}
                    placeholder="Add a comment… type @ to tag a teammate"
                    rows={2}
                  />
                  {mention && suggestions.length > 0 && (
                    <div className="sp-mentionbox">
                      {suggestions.map((n) => (
                        <button type="button" key={n} className="sp-mention-opt" onMouseDown={(e) => e.preventDefault()} onClick={() => pickMention(n)}>
                          <span className="sp-mention-av">{initials(n)}</span>
                          {n}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="sp-cbox-row">
                  <span className="sp-chint">Type @ to tag</span>
                  <button type="button" className="sp-cpost" onClick={postComment} disabled={!draft.trim()}>
                    Comment
                  </button>
                </div>
              </div>
              <ul className="sp-cfeed">
                {comments.map((c) => (
                  <li key={c.id} className={c.system ? 'sys' : ''}>
                    <div className="sp-c-avatar">{c.system ? '•' : initials(c.who)}</div>
                    <div className="sp-c-b">
                      <div className="sp-c-h">
                        <b>{c.who}</b>
                        <span className="sp-c-t">{c.time}</span>
                      </div>
                      <div className="sp-c-text">{renderComment(c.text, taggable)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
