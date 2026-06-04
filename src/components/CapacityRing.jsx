// Small circular capacity gauge (the "loader-ish" ring).
export default function CapacityRing({ value, fail }) {
  const size = 40
  const stroke = 4.5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  const off = c * (1 - pct / 100)
  const color = fail ? '#cc0000' : pct >= 90 ? '#cc0000' : pct >= 75 ? '#b9791a' : '#00b2b2'

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="cring">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ece7e1" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="cring-t" fill={color}>
        {pct}
      </text>
    </svg>
  )
}
