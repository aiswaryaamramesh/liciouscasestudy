// ─────────────────────────────────────────────────────────────────────────────
// Bloomline · Control Tower — hardcoded data
//
// Left = Sankey (Producers → Warehouses → Hubs → Routes). Every node is
// clickable. Right = context panel: metrics + issues for the whole network by
// default, updating to a single node's data when one is selected.
// ─────────────────────────────────────────────────────────────────────────────

export const product = {
  name: 'Bloomline',
  surface: 'Control Tower',
  tabs: ['Flow', 'Map', 'Chain'],
  activeTab: 'Flow',
  valueAtRisk: '₹2.0L',
  lastSync: '1m ago',
}

export const ALL = '__all__'

// ── Sankey columns (each node carries a `key` used to drive the right panel) ──
export const sankeyStages = ['Producers', 'Warehouses', 'Hubs', 'Routes']

export const sankeyCols = [
  [
    { key: 'prod-HOS', n: 'Hosur', v: 22, hl: 'ok' },
    { key: 'prod-NIL', n: 'Nilgiris', v: 12, hl: 'warn', reason: 'Fog delay +45m', icon: 'fog' },
    { key: 'prod-KAN', n: 'Kanchipuram', v: 16, hl: 'ok' },
    { key: 'prod-CHK', n: 'Chikkaballapur', v: 14, hl: 'ok' },
    { key: 'prod-KOL', n: 'Kolar', v: 10, hl: 'ok' },
    { key: 'prod-KRI', n: 'Krishnagiri', v: 8, hl: 'ok' },
    { key: 'prod-DIN', n: 'Dindigul', v: 8, hl: 'ok' },
    { key: 'prod-THR', n: 'Thrissur', v: 10, hl: 'ok' },
  ],
  [
    { key: 'wh-blr', n: 'Bangalore ×8', v: 30, hl: 'warn', reason: 'Overload 91%', icon: 'overload' },
    { key: 'wh-che', n: 'Chennai ×7', v: 22, hl: 'ok' },
    { key: 'wh-hyd', n: 'Hyderabad ×5', v: 16, hl: 'ok' },
    { key: 'wh-cbe', n: 'Coimbatore ×3', v: 10, hl: 'bad', reason: 'Refrigeration fail', icon: 'cold' },
    { key: 'wh-koc', n: 'Kochi ×3', v: 8, hl: 'warn', reason: 'Inbound at risk', icon: 'warning' },
    { key: 'wh-mys', n: 'Mysore ×2', v: 8, hl: 'ok' },
    { key: 'wh-mng', n: 'Mangalore ×2', v: 6, hl: 'bad', reason: 'Truck accident', icon: 'truck' },
  ],
  [
    { key: 'hub-ontime', n: 'Hubs on time', v: 78, hl: 'ok' },
    { key: 'hub-delayed', n: 'Hubs delayed', v: 22, hl: 'bad', reason: 'Sorting backlog', icon: 'layers' },
  ],
  [
    { key: 'rt-ontime', n: 'Routes on-time', v: 84, hl: 'ok' },
    { key: 'rt-delayed', n: 'Routes delayed', v: 16, hl: 'bad', reason: 'SLA breach', icon: 'clock' },
  ],
]

// Flow groups, each entry [fromIdx, toIdx, volume]
export const sankeyFlowGroups = [
  {
    from: 0,
    to: 1,
    flows: [
      [0, 0, 14], [0, 5, 8], [1, 3, 12], [2, 1, 18], [3, 0, 12], [3, 2, 10],
      [4, 0, 10], [4, 2, 6], [5, 0, 8], [6, 3, 6], [7, 4, 10],
    ],
  },
  {
    from: 1,
    to: 2,
    flows: [
      [0, 0, 28], [0, 1, 2], [1, 0, 22], [2, 0, 16], [3, 1, 8], [3, 0, 2],
      [4, 0, 8], [5, 0, 8], [6, 1, 6],
    ],
  },
  {
    from: 2,
    to: 3,
    flows: [[0, 0, 74], [0, 1, 4], [1, 0, 10], [1, 1, 12]],
  },
]

// special same-column line-haul: Bangalore → Mangalore (failing rescue feed)
export const sankeySpecial = { fromKey: 'wh-blr', toKey: 'wh-mng', hl: 'bad' }

// ── Flower SKU codes ─────────────────────────────────────────────────────────
// Format: [2-letter flower][stem length, inches][2-letter colour].
// e.g. RO40RE = Rose · 40" · Red. SKU codes are used everywhere in place of plain
// flower names so the control tower speaks the warehouse's product language.
export const SKU = {
  RO40RE: 'Rose · 40" · Red',
  RO50PK: 'Rose · 50" · Pink',
  GE30MX: 'Gerbera · 30" · Mixed',
  CA50PK: 'Carnation · 50" · Pink',
  AN35RD: 'Anthurium · 35" · Red',
  JA20WH: 'Jasmine · 20" · White',
  MA18OR: 'Marigold · 18" · Orange',
  CH45WH: 'Chrysanthemum · 45" · White',
  TU30YE: 'Tulip · 30" · Yellow',
}

// ── Priority scoring model ───────────────────────────────────────────────────
// Impact score = (Value + 2·Urgency + Impact radius + Customer exposure) / 22 ×100
// where Urgency = Perishability + Time to failure.
// Max = 3 + 2·(3+3) + 4 + 3 = 22, so the score normalises to 0–100. Each issue
// carries its component buckets in `sc`, and the score below is COMPUTED from them.
export const SCORE_MODEL = {
  value: { 3: '₹2L–3L', 2: '₹75k–2L', 1: 'Up to ₹75k' },
  perishability: {
    3: 'Short life · 3–8 days (roses, tulips)',
    2: 'Medium · 5–10 days (lilies, marigold)',
    1: 'Long · 14–20 days (carnation, orchid)',
  },
  timeToFailure: { 3: '< 2 hours', 2: '2–6 hours', 1: '> 6 hours' },
  impactRadius: {
    4: 'Multiple warehouses',
    3: 'Multiple hubs / one warehouse',
    2: 'One hub',
    1: 'Single route',
  },
  customerExposure: { 3: '100+ orders', 2: '10–100 orders', 1: '1–10 orders' },
}
export const scoreLabels = {
  value: 'Value at risk',
  perishability: 'Perishability',
  timeToFailure: 'Time to failure',
  impactRadius: 'Impact radius',
  customerExposure: 'Customer exposure',
}
export function impactScore(c) {
  const urgency = c.perishability + c.timeToFailure
  return Math.round(((c.value + 2 * urgency + c.impactRadius + c.customerExposure) / 22) * 100)
}

// ── Issues (each tagged with the node keys it belongs to) ────────────────────
export const issues = [
  {
    id: 'roses', sev: 'crit', title: 'RO40RE dying in transit',
    clkLabel: 'Viable for', clk: '6h 10m', urgent: true, orders: '~1,800 affected',
    sc: { value: 3, perishability: 3, timeToFailure: 1, impactRadius: 3, customerExposure: 3 },
    chips: [['flower', '1,200 × RO40RE'], ['cart', '~1,800 orders']],
    nodes: ['wh-mng', 'rt-delayed'],
    detail: {
      ty: 'ROUTE · IN TRANSIT', c: 'bad', where: 'Bangalore → Mangalore line-haul',
      iss: 'Highway accident. 1,200 × RO40RE, <b>6h viability — recoverable in 2h.</b>',
      blast: ['Mangalore hub', 'AM delivery slots'],
      rec: { c: 'act', t: 'Reroute via <b>Coimbatore WH</b> — has RO40RE buffer.', label: 'Reroute' },
    },
  },
  {
    id: 'refrig', sev: 'crit', title: 'Refrigeration failure',
    clkLabel: 'Viable for', clk: '1h 30m', urgent: true, orders: '~1,100 affected',
    sc: { value: 2, perishability: 3, timeToFailure: 3, impactRadius: 3, customerExposure: 3 },
    chips: [['box', '₹80k load'], ['cart', '~1,100 orders']],
    nodes: ['wh-cbe', 'hub-delayed', 'wh-koc'],
    detail: {
      ty: 'WAREHOUSE · COLD CHAIN', c: 'bad', where: 'Coimbatore WH → Kochi',
      iss: 'Refrigeration failed on Kochi-bound dock. <b>₹80k TU30YE warming.</b>',
      blast: ['9 hubs', '~46 routes', 'Kochi'],
      rec: { c: 'mit', t: 'Fix slower than spoilage. <b>Protect Kochi orders</b> — pull buffer.', label: 'Mitigate' },
    },
  },
  {
    id: 'corp', sev: 'high', title: 'Corporate order delivery failed', customer: true,
    clkLabel: 'Recover in', clk: '40m', urgent: true, orders: '1 bulk order',
    sc: { value: 2, perishability: 2, timeToFailure: 3, impactRadius: 1, customerExposure: 1 },
    chips: [['flower', 'Bulk order'], ['refund', 'Refund risk']],
    nodes: ['rt-delayed', 'wh-blr'],
    detail: {
      ty: 'LAST-MILE · DELIVERY', c: 'bad', where: 'HSR Layout · corporate park',
      iss: 'A high-value corporate bulk order missed its window. <b>Client-visible, contract-critical.</b>',
      blast: ['1 client account', 'Reputation / churn'],
      rec: { c: 'mit', t: 'Call the client, dispatch replacement from nearest hub, issue credit.', label: 'Recover' },
    },
  },
  {
    id: 'blr-ovl', sev: 'smoke', title: 'Bangalore overload forming',
    clkLabel: 'Breaches in', clk: '~2h', urgent: false,
    sc: { value: 1, perishability: 2, timeToFailure: 2, impactRadius: 4, customerExposure: 3 },
    chips: [['warehouse', '8 WH'], ['bars', '91%']],
    nodes: ['wh-blr'],
    detail: {
      ty: 'WAREHOUSE · CAPACITY', c: 'smoke', where: 'Bangalore cluster',
      iss: 'At 91%, inbound still arriving. <b>Breaches in ~2h.</b>',
      blast: ['8 warehouses', 'Overflow / rejected inbound'],
      rec: { c: 'prevent', t: 'Redirect next <b>Hosur inbound to Mysore</b> to stay under capacity.', label: 'Prevent now' },
    },
  },
  {
    id: 'che-sku', sev: 'smoke', title: 'Chennai SKU depletion',
    clkLabel: 'Stockout in', clk: '~5h', urgent: false,
    sc: { value: 1, perishability: 1, timeToFailure: 2, impactRadius: 3, customerExposure: 3 },
    chips: [['flower', 'CA50PK']],
    nodes: ['wh-che'],
    detail: {
      ty: 'INVENTORY · STOCK', c: 'smoke', where: 'Chennai · CA50PK',
      iss: 'CA50PK stock trending to <b>stockout in ~5h</b> at current pull.',
      blast: ['7 Chennai WH', 'CA50PK backorders'],
      rec: { c: 'prevent', t: 'Trigger an automatic reorder from the upstream belt now.', label: 'Reorder' },
    },
  },
  {
    id: 'nil-fog', sev: 'smoke', title: 'Nilgiris inbound slow (fog)',
    clkLabel: 'Delay', clk: '+45m', urgent: false,
    sc: { value: 1, perishability: 3, timeToFailure: 1, impactRadius: 2, customerExposure: 1 },
    chips: [['flower', 'RO40RE · CA50PK'], ['clock', '+45m']],
    nodes: ['prod-NIL', 'wh-cbe'],
    detail: {
      ty: 'PRODUCER · INBOUND', c: 'smoke', where: 'Nilgiris belt → Coimbatore',
      iss: 'Hill fog is slowing morning intake. <b>Dispatch running +45m.</b>',
      blast: ['Coimbatore intake', 'AM cutoffs'],
      rec: { c: 'prevent', t: 'Pull the Coimbatore cutoff forward and pre-stage buffer stock.', label: 'Adjust cutoff' },
    },
  },
]

// People directory — name, role, where they're situated, and contact details.
// Issues start Unassigned; assigning surfaces the assignee's full details.
const P = {
  arun: { name: 'Arun K.', role: 'Cold-chain lead', place: 'Coimbatore · Peelamedu cold dock', phone: '+91 98430 11020', email: 'arun.k@bloomline.co' },
  deepa: { name: 'Deepa R.', role: 'Warehouse supervisor', place: 'Coimbatore · RS Puram', phone: '+91 98430 11044', email: 'deepa.r@bloomline.co' },
  ganesh: { name: 'Ganesh R.', role: 'Hub coordinator', place: 'Mangalore · Hampankatta', phone: '+91 98450 22019', email: 'ganesh.r@bloomline.co' },
  rajesh: { name: 'Rajesh T.', role: 'Line-haul captain', place: 'BLR–Mangalore corridor', phone: '+91 99000 33011', email: 'rajesh.t@bloomline.co' },
  imran: { name: 'Imran H.', role: 'Transit ops', place: 'Hosur Rd transit yard', phone: '+91 99000 33027', email: 'imran.h@bloomline.co' },
  suresh: { name: 'Suresh M.', role: 'Belt coordinator', place: 'Nilgiris belt · Ooty', phone: '+91 94880 55003', email: 'suresh.m@bloomline.co' },
  vikram: { name: 'Vikram S.', role: 'Warehouse ops lead', place: 'Bangalore · Hebbal', phone: '+91 99860 77001', email: 'vikram.s@bloomline.co' },
  meera: { name: 'Meera P.', role: 'Capacity planner', place: 'Bangalore · Hosur Rd mother hub', phone: '+91 99860 77042', email: 'meera.p@bloomline.co' },
  karthik: { name: 'Karthik V.', role: 'Inventory lead', place: 'Chennai · Adyar', phone: '+91 90030 88010', email: 'karthik.v@bloomline.co' },
  lakshmi: { name: 'Lakshmi N.', role: 'Stock planner', place: 'Chennai · T Nagar', phone: '+91 90030 88055', email: 'lakshmi.n@bloomline.co' },
  anand: { name: 'Anand B.', role: 'Last-mile lead', place: 'Bangalore · HSR Layout', phone: '+91 95910 44002', email: 'anand.b@bloomline.co' },
  pooja: { name: 'Pooja G.', role: 'Delivery coordinator', place: 'Bangalore · Koramangala', phone: '+91 95910 44038', email: 'pooja.g@bloomline.co' },
  ravi: { name: 'Ravi D.', role: 'Mysore WH lead', place: 'Mysore · Vijayanagar', phone: '+91 99016 55008', email: 'ravi.d@bloomline.co' },
  nisha: { name: 'Nisha P.', role: 'Kochi hub lead', place: 'Kochi · Edappally', phone: '+91 90370 66012', email: 'nisha.p@bloomline.co' },
  sandeep: { name: 'Sandeep R.', role: 'Account manager', place: 'Bangalore · corporate desk', phone: '+91 98800 99005', email: 'sandeep.r@bloomline.co' },
}

// ── Rich issue detail: root cause, ownership, the order's journey, an activity
// log, and the team it can be assigned to. Merged onto the issues by id. ──────
const issueExtras = {
  roses: {
    owner: 'Priya N.', assignee: 'Aiswarya Ramesh', status: 'Open',
    rootCause: 'Highway accident on the Bangalore→Mangalore line-haul has held the vehicle in transit, leaving 1,200 RO40RE stems with only 6h viability.',
    team: { kind: 'transit', name: 'Line-haul transit team', people: [P.rajesh, P.imran, P.suresh] },
    journey: [
      { stage: 'Producer', place: 'Hosur belt', state: 'ok', time: '03:50', note: 'Harvest QC passed — 1,200 RO40RE stems graded A' },
      { stage: 'Producer', place: 'Hosur belt', state: 'ok', time: '04:10', note: 'Picked & dispatched to Bangalore WH on schedule' },
      { stage: 'Warehouse', place: 'Bangalore ×8', state: 'ok', time: '05:20', note: 'Received, cold-packed, staged for the Mangalore line-haul' },
      { stage: 'Warehouse', place: 'Bangalore ×8', state: 'ok', time: '05:45', note: 'Loaded to line-haul vehicle KA-01-9921' },
      { stage: 'Transit', place: 'BLR → Mangalore line-haul', state: 'bad', time: '06:02', note: 'Vehicle held — highway accident on NH-75; 6h viability clock started' },
      { stage: 'Hub', place: 'Mangalore · Hampankatta', state: 'pending', time: '—', note: 'Awaiting inbound — AM slots at risk' },
      { stage: 'Route', place: 'Mangalore last-mile', state: 'pending', time: '—', note: '~1,800 orders pending dispatch' },
    ],
    log: [
      { time: '06:02', who: 'System', text: 'Line-haul GPS stalled on NH-75; accident flag raised' },
      { time: '06:05', who: 'Priya N.', text: 'Acknowledged — assessing reroute options' },
      { time: '06:08', who: 'System', text: 'Coimbatore WH has RO40RE buffer; swap vehicle available' },
    ],
    subIssues: [
      { title: '1,200 × RO40RE at 6h viability', where: 'Line-haul', status: 'Open', assignee: 'Unassigned' },
      { title: '~1,800 Mangalore AM orders exposed', where: 'Mangalore routes', status: 'Open', assignee: 'Unassigned' },
    ],
  },
  refrig: {
    owner: 'Priya N.', assignee: 'Aiswarya Ramesh', status: 'Open',
    rootCause: 'A compressor fault on the Coimbatore cold dock (CBE-W2) breached the temperature threshold, warming ₹80k of TU30YE bound for Kochi.',
    team: { kind: 'warehouse', name: 'Coimbatore cold-chain team', people: [P.arun, P.deepa, P.ganesh] },
    journey: [
      { stage: 'Producer', place: 'Nilgiris belt', state: 'ok', time: '03:20', note: 'CA50PK / TU30YE harvested & QC passed' },
      { stage: 'Producer', place: 'Nilgiris belt', state: 'ok', time: '03:40', note: 'Dispatched to Coimbatore WH on schedule' },
      { stage: 'Warehouse', place: 'Coimbatore · cold dock CBE-W2', state: 'ok', time: '05:30', note: 'Received into cold dock, holding at 4°C' },
      { stage: 'Warehouse', place: 'Coimbatore · cold dock CBE-W2', state: 'bad', time: '05:55', note: 'Compressor fault — temp breached 8°C; ₹80k TU30YE warming' },
      { stage: 'Warehouse', place: 'Kochi ×3', state: 'warn', time: '—', note: 'Inbound from CBE at risk' },
      { stage: 'Hub', place: 'Kochi hubs', state: 'pending', time: '—', note: '~1,100 orders exposed' },
      { stage: 'Route', place: 'Kochi last-mile', state: 'pending', time: '—', note: 'AM deliveries pending' },
    ],
    log: [
      { time: '05:55', who: 'System', text: 'Cold-dock CBE-W2 temp breached 8°C threshold' },
      { time: '05:58', who: 'System', text: 'Compressor fault confirmed — fix slower than spoilage' },
      { time: '06:01', who: 'Priya N.', text: 'Protect Kochi orders — pull buffer from Mysore' },
    ],
    subIssues: [
      { title: '₹80k TU30YE warming at CBE-W2', where: 'Coimbatore WH', status: 'Open', assignee: 'Unassigned' },
      { title: '~1,100 Kochi orders exposed', where: 'Kochi', status: 'Open', assignee: 'Unassigned' },
    ],
  },
  corp: {
    owner: 'Priya N.', assignee: 'Aiswarya Ramesh', status: 'Open',
    rootCause: 'Sorting and last-mile delay pushed a high-value corporate bulk order past its committed window in HSR Layout — client-visible.',
    team: { kind: 'route', name: 'HSR last-mile team', people: [P.anand, P.pooja] },
    journey: [
      { stage: 'Producer', place: 'Hosur belt', state: 'ok', time: '05:40', note: 'RO40RE picked for the corporate bulk order' },
      { stage: 'Warehouse', place: 'Bangalore ×8', state: 'ok', time: '06:30', note: 'Bulk order assembled, packed & invoiced' },
      { stage: 'Hub', place: 'Bangalore · Koramangala', state: 'ok', time: '07:10', note: 'Sorted to the HSR delivery route' },
      { stage: 'Route', place: 'HSR Layout · corporate park', state: 'bad', time: '09:40', note: 'Missed the committed window — client-visible SLA breach' },
    ],
    log: [
      { time: '09:40', who: 'System', text: 'SLA breach — corporate order past committed window' },
      { time: '09:50', who: 'Priya N.', text: 'Call client, dispatch replacement, issue credit' },
    ],
    subIssues: [
      { title: 'Corporate bulk order missed window', where: 'HSR route', status: 'Open', assignee: 'Unassigned' },
      { title: 'Refund / credit pending', where: 'Accounts', status: 'Open', assignee: 'Unassigned' },
    ],
  },
  'blr-ovl': {
    owner: 'Vikram S.', assignee: 'Aiswarya Ramesh', status: 'Open',
    rootCause: 'Inbound is arriving faster than outbound throughput, pushing the Bangalore cluster toward 91% — it breaches capacity in ~2h at the current pull.',
    team: { kind: 'warehouse', name: 'Bangalore WH ops', people: [P.vikram, P.meera] },
    journey: [
      { stage: 'Producer', place: 'Hosur / Chikkaballapur', state: 'ok', time: '06:00', note: 'Morning inbound dispatched as planned' },
      { stage: 'Warehouse', place: 'Bangalore ×8', state: 'ok', time: '07:00', note: 'Cluster at 82% — within range' },
      { stage: 'Warehouse', place: 'Bangalore ×8', state: 'warn', time: '07:25', note: 'Crossed 88% — inbound still arriving' },
      { stage: 'Warehouse', place: 'Bangalore ×8', state: 'warn', time: 'now', note: 'At 91% — breaches in ~2h at current pull' },
      { stage: 'Hub', place: 'Bangalore hubs', state: 'pending', time: '—', note: 'Overflow / rejected-inbound risk' },
    ],
    log: [
      { time: '07:20', who: 'System', text: 'Bangalore cluster capacity crossed 88%' },
      { time: '07:25', who: 'System', text: 'Trending to breach — recommend redirect to Mysore' },
    ],
    subIssues: [
      { title: '8 WH near capacity', where: 'Bangalore', status: 'Open', assignee: 'Unassigned' },
      { title: 'Inbound overflow in ~2h', where: 'Bangalore', status: 'Open', assignee: 'Unassigned' },
    ],
  },
  'che-sku': {
    owner: 'Karthik V.', assignee: 'Aiswarya Ramesh', status: 'Open',
    rootCause: 'CA50PK pull rate exceeds replenishment at Chennai · Adyar — on-hand has dropped below the reorder point, trending to stockout in ~5h.',
    team: { kind: 'warehouse', name: 'Chennai inventory team', people: [P.karthik, P.lakshmi] },
    journey: [
      { stage: 'Producer', place: 'Kanchipuram belt', state: 'ok', time: '04:50', note: 'CA50PK supply dispatched — volumes normal' },
      { stage: 'Warehouse', place: 'Chennai ×7 · Adyar', state: 'ok', time: '06:30', note: 'On-hand above reorder point' },
      { stage: 'Warehouse', place: 'Chennai ×7 · Adyar', state: 'warn', time: '06:50', note: 'Dropped below reorder point — trending to stockout in ~5h' },
      { stage: 'Route', place: 'Chennai routes', state: 'pending', time: '—', note: 'Carnation backorders if unfilled' },
    ],
    log: [
      { time: '06:50', who: 'System', text: 'CA50PK on-hand below reorder point at CHE-W3' },
      { time: '06:52', who: 'System', text: 'Wide window — auto-reorder from upstream belt suggested' },
    ],
    subIssues: [
      { title: 'CA50PK stockout in ~5h', where: 'Chennai · Adyar', status: 'Open', assignee: 'Unassigned' },
      { title: '7 Chennai WH affected', where: 'Chennai', status: 'Open', assignee: 'Unassigned' },
    ],
  },
  'nil-fog': {
    owner: 'Suresh M.', assignee: 'Aiswarya Ramesh', status: 'Open',
    rootCause: 'Hill fog is slowing morning intake at the Nilgiris belt, running dispatch +45m and putting the Coimbatore AM cutoff at risk.',
    team: { kind: 'producer', name: 'Nilgiris belt coordinators', people: [P.suresh] },
    journey: [
      { stage: 'Producer', place: 'Nilgiris belt', state: 'ok', time: '04:30', note: 'Harvest started on schedule' },
      { stage: 'Producer', place: 'Nilgiris belt', state: 'warn', time: '05:10', note: 'Hill fog slowing intake — dispatch running +45m' },
      { stage: 'Warehouse', place: 'Coimbatore intake', state: 'pending', time: '—', note: 'AM cutoff at risk' },
    ],
    log: [
      { time: '05:10', who: 'System', text: 'Nilgiris dispatch running 45m behind schedule' },
      { time: '05:14', who: 'System', text: 'Pull Coimbatore cutoff forward; pre-stage buffer' },
    ],
    subIssues: [
      { title: 'Dispatch running +45m', where: 'Nilgiris', status: 'Open', assignee: 'Unassigned' },
      { title: 'Coimbatore AM cutoff at risk', where: 'Coimbatore', status: 'Open', assignee: 'Unassigned' },
    ],
  },
}
// What happens when the recommended resolution is accepted: the manual steps
// the operator still owns, and the actions the platform fires automatically.
// nextSteps are actionable: { text, who/role context, cta button, optional tel
// for a Call, and the comment posted to the log when completed }
const acceptPlan = {
  roses: {
    nextSteps: [
      { text: 'Confirm the swap vehicle with Rajesh T. · line-haul captain', who: [P.rajesh, P.imran], cta: 'Call', tel: '+91 99000 33011', log: 'Called Rajesh T. — swap vehicle confirmed for the Mangalore line-haul' },
      { text: 'Notify Mangalore hub (Ganesh R.) of the revised ETA', who: [P.ganesh], cta: 'Notify', to: 'Mangalore hub · Ganesh R.', msg: 'Heads up — the Bangalore line-haul hit a highway accident, so RO40RE inbound is delayed. Revised ETA to follow shortly; please hold the AM delivery slots.', log: 'Notified Mangalore hub of the revised inbound ETA' },
      { text: 'Approve the RO40RE buffer pull from Coimbatore WH', who: [P.arun, P.deepa], cta: 'Approve', log: 'Approved the RO40RE buffer pull from Coimbatore WH' },
    ],
    background: [
      { text: 'Coimbatore WH buffer reserved (1,200 × RO40RE)', by: 'Routing engine' },
      { text: 'Customer ETAs recalculated, SMS queued', by: 'Notifications', eta: '~3m' },
      { text: 'Credit pre-approval for at-risk orders', by: 'Finance · auto', eta: '~12m' },
    ],
  },
  refrig: {
    nextSteps: [
      { text: 'Authorise the buffer pull from Mysore WH', who: [P.ravi], cta: 'Authorise', log: 'Authorised the buffer pull from Mysore WH for Kochi' },
      { text: 'Brief Kochi hub on the substitute stock', who: [P.nisha], cta: 'Notify', to: 'Kochi hub', msg: 'Cold-dock CBE-W2 failed. We are routing substitute stock from the Mysore buffer for the ~1,100 affected Kochi orders — please prioritise these on arrival.', log: 'Briefed Kochi hub on the substitute stock plan' },
      { text: 'Confirm the spoiled TU30YE write-off with Arun K. · cold-chain lead', who: [P.arun], cta: 'Call', tel: '+91 98430 11020', log: 'Called Arun K. — ₹80k TU30YE write-off confirmed' },
    ],
    background: [
      { text: 'Mysore buffer earmarked for Kochi', by: 'Routing engine' },
      { text: 'Cold-dock CBE-W2 isolated from intake', by: 'WH controls' },
      { text: 'Affected Kochi orders tagged for priority', by: 'Order system', eta: '~5m' },
    ],
  },
  corp: {
    nextSteps: [
      { text: 'Call the client to confirm a replacement window', who: [P.anand], cta: 'Call', log: 'Called the client — replacement window agreed' },
      { text: 'Dispatch the replacement from the nearest hub (Anand B.)', who: [P.anand], cta: 'Dispatch', to: 'Koramangala hub · Anand B.', msg: 'Please dispatch a replacement for the failed corporate order to the client at the earliest slot, and confirm the dispatch time back here.', log: 'Dispatched the replacement order from the nearest hub' },
      { text: 'Escalate to the account manager', who: [P.sandeep], cta: 'Escalate', to: 'Account manager', msg: 'Escalating a failed high-value corporate order in HSR Layout — it is client-visible. Please engage the client directly and approve a goodwill credit.', log: 'Escalated the corporate order to the account manager' },
    ],
    background: [
      { text: 'Replacement order created from Koramangala hub', by: 'Order system' },
      { text: 'Service credit applied to client account', by: 'Finance · auto', eta: '~10m' },
      { text: 'Incident logged to account health', by: 'CRM sync' },
    ],
  },
  'blr-ovl': {
    nextSteps: [
      { text: 'Approve the Hosur → Mysore inbound redirect', who: [P.vikram], cta: 'Approve', log: 'Approved the Hosur → Mysore inbound redirect' },
      { text: 'Stage overflow staff at Hebbal (Meera P.)', who: [P.meera], cta: 'Notify', to: 'Hebbal · Meera P.', msg: 'Bangalore cluster is trending to breach capacity in ~2h. Please stage overflow staff at Hebbal and prep for redirected inbound from Hosur.', log: 'Requested overflow staff staging at Hebbal' },
      { text: 'Confirm the revised cluster capacity with Vikram S. · WH ops lead', who: [P.vikram], cta: 'Call', tel: '+91 99860 77001', log: 'Called Vikram S. — revised Bangalore capacity confirmed' },
    ],
    background: [
      { text: 'Next 2 Hosur inbounds rerouted to Mysore', by: 'Routing engine' },
      { text: 'Capacity forecast re-run (projects 84%)', by: 'Forecast engine' },
      { text: 'Mysore overflow buffer activated', by: 'WH controls', eta: '~8m' },
    ],
  },
  'che-sku': {
    nextSteps: [
      { text: 'Approve the auto-reorder from the upstream belt', who: [P.karthik, P.lakshmi], cta: 'Approve', log: 'Approved the CA50PK auto-reorder from the Kanchipuram belt' },
      { text: 'Confirm Adyar shelf allocation with Karthik V. · inventory lead', who: [P.karthik], cta: 'Call', tel: '+91 90030 88010', log: 'Called Karthik V. — Adyar shelf allocation confirmed' },
    ],
    background: [
      { text: 'Reorder PO raised to Kanchipuram belt', by: 'Inventory system' },
      { text: 'CA50PK demand forecast updated', by: 'Forecast engine' },
      { text: 'Backorder guard enabled for Chennai', by: 'Order system' },
    ],
  },
  'nil-fog': {
    nextSteps: [
      { text: 'Approve the earlier Coimbatore cutoff', who: [P.arun], cta: 'Approve', log: 'Approved the earlier Coimbatore AM cutoff' },
      { text: 'Pre-stage buffer stock at intake (Suresh M.)', who: [P.suresh], cta: 'Notify', to: 'Coimbatore intake · Suresh M.', msg: 'Nilgiris dispatch is running +45m due to hill fog. Please pre-stage buffer stock at intake and pull the AM cutoff forward by 30m.', log: 'Requested buffer stock pre-staging at Coimbatore intake' },
    ],
    background: [
      { text: 'Coimbatore AM cutoff moved 30m earlier', by: 'Scheduling' },
      { text: 'Buffer stock flagged for pre-stage', by: 'WH controls', eta: '~6m' },
      { text: 'Driver ETAs updated for fog delay', by: 'Notifications' },
    ],
  },
}
// once the steps are complete, the blocked order resumes — these events get
// appended to its journey so the order detail reflects the recovery.
const recoveryPlan = {
  roses: [
    { stage: 'Transit', place: 'BLR → Mangalore line-haul', state: 'ok', time: 'now', note: 'Rerouted — swap vehicle from Coimbatore en route' },
    { stage: 'Route', place: 'Mangalore last-mile', state: 'ok', time: 'now', note: 'AM slots held; ~1,800 orders back on schedule' },
  ],
  refrig: [
    { stage: 'Warehouse', place: 'Kochi ×3', state: 'ok', time: 'now', note: 'Substitute stock inbound from the Mysore buffer' },
    { stage: 'Route', place: 'Kochi last-mile', state: 'ok', time: 'now', note: '~1,100 orders protected — AM deliveries on track' },
  ],
  corp: [
    { stage: 'Route', place: 'HSR Layout · corporate park', state: 'ok', time: 'now', note: 'Replacement dispatched; client credited & informed' },
  ],
  'blr-ovl': [
    { stage: 'Warehouse', place: 'Bangalore ×8', state: 'ok', time: 'now', note: 'Inbound redirected to Mysore — projects 84%, breach averted' },
  ],
  'che-sku': [
    { stage: 'Warehouse', place: 'Chennai ×7 · Adyar', state: 'ok', time: 'now', note: 'Reorder raised — stock replenishing, stockout averted' },
  ],
  'nil-fog': [
    { stage: 'Producer', place: 'Nilgiris belt', state: 'ok', time: 'now', note: 'Cutoff pulled forward; buffer pre-staged — AM cutoff safe' },
  ],
}
issues.forEach((i) => {
  Object.assign(i, issueExtras[i.id] || {}, acceptPlan[i.id] || {}, { recovery: recoveryPlan[i.id] || [] })
  // the priority score is derived from the scoring model, not hardcoded
  if (i.sc) i.score = impactScore(i.sc)
})

// ── Per-node context (metrics shown in the right panel) ─────────────────────
const M = (k, v, tone) => ({ k, v, tone: tone || 'none' })

// belt detail from the producer table (location · grows · feeds)
const PRODUCER_META = {
  HOS: { share: 22, ontime: '98%', grows: 'RO40RE, GE30MX', feeds: 'Bangalore' },
  NIL: { share: 12, ontime: '88%', warn: true, grows: 'CA50PK, AN35RD', feeds: 'Coimbatore, Kochi' },
  KAN: { share: 16, ontime: '96%', grows: 'JA20WH, MA18OR', feeds: 'Chennai' },
  CHK: { share: 14, ontime: '97%', grows: 'RO40RE, CH45WH', feeds: 'Bangalore, Hyderabad' },
  KOL: { share: 10, ontime: '95%', grows: 'RO40RE, MA18OR', feeds: 'Bangalore, Hyderabad' },
  KRI: { share: 8, ontime: '96%', grows: 'RO50PK, MA18OR', feeds: 'Bangalore, Coimbatore' },
  DIN: { share: 8, ontime: '94%', grows: 'JA20WH, MA18OR', feeds: 'Coimbatore' },
  THR: { share: 10, ontime: '93%', grows: 'GE30MX, AN35RD', feeds: 'Kochi' },
}

// every producer belt shows the SAME four numeric attributes; the descriptive
// "grows / feeds" detail moves to the subtitle so the tiles stay uniform.
const producerDetails = Object.fromEntries(
  sankeyCols[0].map((p) => {
    const code = p.key.split('-')[1]
    const meta = PRODUCER_META[code]
    const fed = meta.feeds.split(',').length
    const stems = `${(meta.share * 0.2).toFixed(1)}k`
    return [
      p.key,
      {
        name: p.n,
        sub: `Producer belt · grows ${meta.grows}`,
        status: meta.warn ? 'warn' : 'ok',
        metrics: [
          M('Dispatch on-time', meta.ontime, meta.warn ? 'a' : 'ok'),
          M('Volume share', `${meta.share}%`),
          M('Daily stems', stems),
          M('Warehouses fed', String(fed)),
        ],
      },
    ]
  }),
)

export const nodeDetails = {
  [ALL]: {
    name: 'All areas',
    sub: 'Live operational status',
    status: 'bad',
    metrics: [
      M('Delayed deliveries', '16% (46)', 'r'),
      M('Value at risk', '₹2.0L', 'r'),
      M('Low-stock SKUs', '7', 'a'),
      M('Orders at risk', '~2.9k', 'r'),
    ],
  },
  ...producerDetails,
  // ── warehouses: shared schema · Capacity / On-time / Low-stock SKUs / Orders at risk
  'wh-blr': {
    name: 'Bangalore ×8', sub: 'Warehouse cluster', status: 'warn',
    metrics: [M('Capacity', '91%', 'a'), M('On-time', '89%', 'a'), M('Low-stock SKUs', '2', 'a'), M('Orders at risk', '~600', 'a')],
  },
  'wh-che': {
    name: 'Chennai ×7', sub: 'Warehouse cluster', status: 'warn',
    metrics: [M('Capacity', '74%', 'ok'), M('On-time', '92%', 'ok'), M('Low-stock SKUs', '1', 'a'), M('Orders at risk', '~120', 'a')],
  },
  'wh-hyd': {
    name: 'Hyderabad ×5', sub: 'Warehouse cluster', status: 'ok',
    metrics: [M('Capacity', '63%', 'ok'), M('On-time', '95%', 'ok'), M('Low-stock SKUs', '0', 'ok'), M('Orders at risk', '0', 'ok')],
  },
  'wh-cbe': {
    name: 'Coimbatore ×3', sub: 'Warehouse cluster', status: 'bad',
    metrics: [M('Capacity', '78%', 'ok'), M('On-time', '64%', 'r'), M('Low-stock SKUs', '3', 'r'), M('Orders at risk', '~1,100', 'r')],
  },
  'wh-koc': {
    name: 'Kochi ×3', sub: 'Warehouse cluster', status: 'warn',
    metrics: [M('Capacity', '70%', 'ok'), M('On-time', '86%', 'a'), M('Low-stock SKUs', '1', 'a'), M('Orders at risk', '~1,100', 'a')],
  },
  'wh-mys': {
    name: 'Mysore ×2', sub: 'Warehouse cluster · overflow', status: 'ok',
    metrics: [M('Capacity', '44%', 'ok'), M('On-time', '94%', 'ok'), M('Low-stock SKUs', '0', 'ok'), M('Orders at risk', '0', 'ok')],
  },
  'wh-mng': {
    name: 'Mangalore ×2', sub: 'Warehouse cluster · inbound-dependent', status: 'bad',
    metrics: [M('Capacity', '58%', 'ok'), M('On-time', '61%', 'r'), M('Low-stock SKUs', '1', 'a'), M('Orders at risk', '~1,800', 'r')],
  },
  // ── hubs: shared schema · Hubs / On-time / Avg delay / Orders held
  'hub-ontime': {
    name: 'Hubs on time', sub: 'City hub sorting', status: 'ok',
    metrics: [M('Hubs', '78', 'ok'), M('On-time', '95%', 'ok'), M('Avg delay', '3m', 'ok'), M('Orders held', '0', 'ok')],
  },
  'hub-delayed': {
    name: 'Hubs delayed', sub: 'City hub sorting', status: 'bad',
    metrics: [M('Hubs', '12', 'r'), M('On-time', '44%', 'r'), M('Avg delay', '90m', 'r'), M('Orders held', '~2.3k', 'r')],
  },
  // ── routes: shared schema · Routes / On-time / Customer-visible / Perishable-loaded
  'rt-ontime': {
    name: 'Routes on-time', sub: 'Last-mile delivery', status: 'ok',
    metrics: [M('Routes', '~454', 'ok'), M('On-time', '96%', 'ok'), M('Customer-visible', '0', 'ok'), M('Perishable-loaded', '0', 'ok')],
  },
  'rt-delayed': {
    name: 'Routes delayed', sub: 'Last-mile delivery', status: 'bad',
    metrics: [M('Routes', '~46', 'r'), M('On-time', '38%', 'r'), M('Customer-visible', '1', 'r'), M('Perishable-loaded', '4', 'a')],
  },
}

// ── Sub-warehouses per cluster (capacity gauges in the right panel) ─────────
// Bangalore areas/hubs come from the warehouse table; others are representative.
// `issues` (when present) drives the drill-down badge on each warehouse row.
export const subWarehouses = {
  'wh-blr': [
    { id: 'BLR-W1', area: 'Whitefield', cap: 96, issues: ['Near capacity · 96%', 'Inbound overflow in ~2h'] },
    { id: 'BLR-W2', area: 'Koramangala', cap: 93, issues: ['Near capacity · 93%'] },
    { id: 'BLR-W3', area: 'Indiranagar', cap: 88 },
    { id: 'BLR-W4', area: 'Hebbal · North', cap: 91, issues: ['Near capacity · 91%'] },
    { id: 'BLR-W5', area: 'JP Nagar · South', cap: 95, issues: ['Near capacity · 95%', 'CA50PK low stock'] },
    { id: 'BLR-W6', area: 'Rajajinagar · West', cap: 84 },
    { id: 'BLR-W7', area: 'Electronic City', cap: 90, issues: ['Near capacity · 90%'] },
    { id: 'BLR-W8', area: 'Mother hub · Hosur Rd', cap: 78 },
  ],
  'wh-che': [
    { id: 'CHE-W1', area: 'T Nagar', cap: 82 },
    { id: 'CHE-W2', area: 'Velachery', cap: 79 },
    { id: 'CHE-W3', area: 'Adyar', cap: 74, issues: ['CA50PK · stockout ~5h'] },
    { id: 'CHE-W4', area: 'Anna Nagar', cap: 86 },
    { id: 'CHE-W5', area: 'Tambaram', cap: 71 },
    { id: 'CHE-W6', area: 'Porur', cap: 76 },
    { id: 'CHE-W7', area: 'OMR', cap: 80 },
  ],
  'wh-hyd': [
    { id: 'HYD-W1', area: 'Gachibowli', cap: 64 },
    { id: 'HYD-W2', area: 'Madhapur', cap: 61 },
    { id: 'HYD-W3', area: 'Kukatpally', cap: 58 },
    { id: 'HYD-W4', area: 'Secunderabad', cap: 67 },
    { id: 'HYD-W5', area: 'Banjara Hills', cap: 63 },
  ],
  'wh-cbe': [
    { id: 'CBE-W1', area: 'RS Puram', cap: 79 },
    { id: 'CBE-W2', area: 'Peelamedu · cold dock', cap: 88, fail: true, issues: ['Refrigeration failure', '₹80k load warming', '~1,100 Kochi orders at risk'] },
    { id: 'CBE-W3', area: 'Gandhipuram', cap: 72 },
  ],
  'wh-koc': [
    { id: 'KOC-W1', area: 'Edappally', cap: 73 },
    { id: 'KOC-W2', area: 'Kakkanad', cap: 70 },
    { id: 'KOC-W3', area: 'MG Road', cap: 68 },
  ],
  'wh-mys': [
    { id: 'MYS-W1', area: 'Vijayanagar', cap: 46 },
    { id: 'MYS-W2', area: 'Kuvempunagar', cap: 42 },
  ],
  'wh-mng': [
    { id: 'MNG-W1', area: 'Hampankatta', cap: 64, issues: ['Truck accident · inbound delayed 5h', '~1,800 AM slots at risk'] },
    { id: 'MNG-W2', area: 'Kadri', cap: 59, issues: ['Inbound-dependent · no local growers'] },
  ],
}

// ── Individual city hubs per Sankey hub-node (sorting-load gauges + drill-down) ─
// `cap` = sorting load %; the ring colours it (≥90 red, ≥75 amber, else teal).
// Delayed hubs trace back to the Coimbatore cold-chain, the Mangalore line-haul
// accident, and Bangalore overflow; on-time hubs are a representative sample.
export const subHubs = {
  'hub-delayed': [
    { id: 'HUB-CBE-02', area: 'Coimbatore · Peelamedu', cap: 94, fail: true, issues: ['Cold-chain fail upstream', 'Sorting backlog · behind cutoff', '~340 orders past SLA'] },
    { id: 'HUB-MNG-01', area: 'Mangalore · Hampankatta', cap: 89, issues: ['Line-haul accident · inbound +5h', '~280 AM orders at risk'] },
    { id: 'HUB-BLR-04', area: 'Bangalore · Hebbal', cap: 91, issues: ['Overflow from WH cluster', 'Behind cutoff ~45m'] },
    { id: 'HUB-KOC-01', area: 'Kochi · Edappally', cap: 85, issues: ['Inbound from CBE at risk', 'Sorting backlog forming'] },
    { id: 'HUB-BLR-07', area: 'Bangalore · Electronic City', cap: 88, issues: ['Behind cutoff ~30m'] },
    { id: 'HUB-BLR-01', area: 'Bangalore · Whitefield', cap: 87, issues: ['Behind cutoff ~25m'] },
    { id: 'HUB-MNG-02', area: 'Mangalore · Kadri', cap: 82, issues: ['Inbound-dependent · no local feed'] },
    { id: 'HUB-CBE-01', area: 'Coimbatore · RS Puram', cap: 83, issues: ['Knock-on backlog from cold dock'] },
    { id: 'HUB-KOC-02', area: 'Kochi · Kakkanad', cap: 80, issues: ['Sorting backlog forming'] },
    { id: 'HUB-CHE-05', area: 'Chennai · Tambaram', cap: 81, issues: ['Behind cutoff ~20m'] },
    { id: 'HUB-MYS-01', area: 'Mysore · Vijayanagar', cap: 78, issues: ['Knock-on delay from Bangalore'] },
    { id: 'HUB-HYD-03', area: 'Hyderabad · Kukatpally', cap: 79, issues: ['Minor sorting backlog'] },
  ],
  'hub-ontime': [
    { id: 'HUB-BLR-08', area: 'Bangalore · Hosur Rd · mother', cap: 68 },
    { id: 'HUB-BLR-02', area: 'Bangalore · Koramangala', cap: 70 },
    { id: 'HUB-CHE-01', area: 'Chennai · T Nagar', cap: 64 },
    { id: 'HUB-CHE-03', area: 'Chennai · Adyar', cap: 61 },
    { id: 'HUB-HYD-01', area: 'Hyderabad · Gachibowli', cap: 58 },
    { id: 'HUB-HYD-02', area: 'Hyderabad · Madhapur', cap: 55 },
    { id: 'HUB-KOC-03', area: 'Kochi · MG Road', cap: 66 },
    { id: 'HUB-MYS-02', area: 'Mysore · Kuvempunagar', cap: 49 },
  ],
}

export function issuesFor(key) {
  const list = key === ALL ? issues : issues.filter((i) => i.nodes.includes(key))
  // highest-priority score first
  return [...list].sort((a, b) => b.score - a.score)
}
