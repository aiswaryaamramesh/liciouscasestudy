import { useEffect, useRef } from 'react'
import L from 'leaflet'

// approximate coordinates for the belts / warehouses / hubs / routes in the data
const GEO = {
  hosur: [12.74, 77.83],
  bangalore: [12.97, 77.59],
  blr: [12.97, 77.59],
  hebbal: [13.04, 77.59],
  koramangala: [12.93, 77.62],
  hsr: [12.91, 77.64],
  mangalore: [12.87, 74.84],
  coimbatore: [11.02, 76.96],
  kochi: [9.93, 76.27],
  nilgiris: [11.41, 76.69],
  ooty: [11.41, 76.69],
  kanchipuram: [12.84, 79.7],
  chennai: [13.0, 80.25],
  adyar: [13.0, 80.22],
  mysore: [12.3, 76.64],
  chikkaballapur: [13.43, 77.73],
}
const RANK = { bad: 3, warn: 2, ok: 1, pending: 0 }

function lookup(s) {
  for (const k in GEO) if (s.includes(k)) return GEO[k]
  return null
}
function resolve(place) {
  const p = place.toLowerCase()
  const legs = p.split(/→|->| to /)
  if (legs.length === 2) {
    const a = lookup(legs[0])
    const b = lookup(legs[1])
    if (a && b) return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  }
  return lookup(p)
}
function shortPlace(place) {
  return (place || '').split(' · ')[0]
}

// collapse the journey into distinct geographic stops, in order
function buildStops(journey) {
  const stops = []
  ;(journey || []).forEach((s) => {
    const coord = resolve(s.place)
    if (!coord) return
    const last = stops[stops.length - 1]
    if (last && Math.abs(last.coord[0] - coord[0]) < 0.05 && Math.abs(last.coord[1] - coord[1]) < 0.05) {
      if (RANK[s.state] > RANK[last.state]) last.state = s.state
      last.anyActual = last.anyActual || s.state !== 'pending'
    } else {
      stops.push({ coord, state: s.state, label: shortPlace(s.place), anyActual: s.state !== 'pending' })
    }
  })
  return stops
}

const COLOR = { ok: '#3f9d52', warn: '#b9791a', bad: '#cc0000', pending: '#9b958c' }

export default function RouteMap({ journey }) {
  const ref = useRef(null)

  useEffect(() => {
    const stops = buildStops(journey)
    if (!ref.current || stops.length < 1) return

    let current = 0
    stops.forEach((s, i) => {
      if (s.state !== 'pending') current = i
    })

    const map = L.map(ref.current, {
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: false,
      dragging: true,
    })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 18,
    }).addTo(map)

    const pts = stops.map((s) => s.coord)
    if (current >= 1) {
      L.polyline(pts.slice(0, current + 1), { color: '#6b6660', weight: 3.5, opacity: 0.7 }).addTo(map)
    }
    if (current < pts.length - 1) {
      L.polyline(pts.slice(current), { color: '#a39d95', weight: 3, opacity: 0.85, dashArray: '4 8' }).addTo(map)
    }

    stops.forEach((s, i) => {
      const cur = i === current
      const icon = L.divIcon({
        className: 'rm-mk-wrap',
        html: `<span class="rm-mk ${s.state}${cur ? ' cur' : ''}"></span>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })
      const m = L.marker(s.coord, { icon }).addTo(map)
      m.bindTooltip(cur ? `Now · ${s.label}` : s.label, {
        direction: 'top',
        offset: [0, -9],
        permanent: cur,
        className: `rm-tip${cur ? ' cur' : ''}`,
      })
    })

    const bounds = L.latLngBounds(pts).pad(0.15)
    map.fitBounds(bounds)
    if (pts.length === 1) map.setView(pts[0], 10)

    // the panel slides in and the map sits in a scroll column, so its container
    // may be 0-sized at init — re-measure on every resize and once after settle
    const refit = () => {
      map.invalidateSize()
      if (pts.length > 1) map.fitBounds(bounds)
    }
    const t = setTimeout(refit, 320)
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(ref.current)

    return () => {
      clearTimeout(t)
      ro.disconnect()
      map.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div className="routemap" ref={ref} />
}

export { COLOR }
