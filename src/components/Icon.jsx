// Minimal monochrome line icons — replaces emoji in chips so the UI reads as a
// real product, not a vibe-coded mock. All inherit currentColor, 12px grid.

const paths = {
  // a single flowering stem
  flower: (
    <>
      <path d="M6 11V6.5" />
      <circle cx="6" cy="4" r="2.2" />
      <path d="M6 8.5c-1.4 0-2.3-.8-2.3-.8M6 8.5c1.4 0 2.3-.8 2.3-.8" />
    </>
  ),
  // package / crate
  box: (
    <>
      <path d="M2.2 4.2 6 2.3l3.8 1.9v3.6L6 9.7 2.2 7.8z" />
      <path d="M2.2 4.2 6 6.1l3.8-1.9M6 6.1v3.6" />
    </>
  ),
  // order / cart
  cart: (
    <>
      <path d="M1.8 2.4h1.2l1 5.1h4.4l.9-3.7H3.6" />
      <circle cx="4.7" cy="9.3" r="0.7" />
      <circle cx="8.3" cy="9.3" r="0.7" />
    </>
  ),
  // refund / return arrow
  refund: (
    <>
      <path d="M3 5.2H7.4a2 2 0 0 1 0 4H4.2" />
      <path d="M4.6 3.3 2.8 5.1l1.8 1.8" />
    </>
  ),
  // warehouse / building
  warehouse: (
    <>
      <path d="M2 5 6 2.6 10 5v4.4H2z" />
      <path d="M4.4 9.4V6.6h3.2v2.8" />
    </>
  ),
  // bars / capacity gauge
  bars: (
    <>
      <path d="M2.6 9.4V6.2M6 9.4V3M9.4 9.4V5" />
    </>
  ),
  // clock
  clock: (
    <>
      <circle cx="6" cy="6" r="4" />
      <path d="M6 3.7V6l1.7 1" />
    </>
  ),
}

export default function Icon({ name }) {
  const body = paths[name]
  if (!body) return null
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.15"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {body}
    </svg>
  )
}
