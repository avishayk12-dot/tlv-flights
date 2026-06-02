import { useState, useEffect } from "react"
import "./App.css"

const AIRPORTS = {
  LHR: { name: "לונדון", x: 260, y: 130 },
  CDG: { name: "פריז", x: 330, y: 150 },
  FRA: { name: "פרנקפורט", x: 430, y: 130 },
  VIE: { name: "וינה", x: 490, y: 150 },
  FCO: { name: "רומא", x: 370, y: 220 },
  AMS: { name: "אמסטרדם", x: 300, y: 100 },
  IST: { name: "איסטנבול", x: 560, y: 235 },
  DXB: { name: "דובאי", x: 690, y: 285 },
  MAN: { name: "מנצ׳סטר", x: 200, y: 80 },
  TLV: { name: "תל אביב", x: 612, y: 308 },
}

function statusClass(s) {
  const map = {
    נחתה: "s-landed", המריאה: "s-departed", עיכוב: "s-delayed",
    מבוטלת: "s-cancelled", בזמן: "s-scheduled", בטיסה: "s-inflight",
    "עלייה למטוס": "s-boarding",
  }
  return map[s] || "s-scheduled"
}

function formatDate(iso) {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export default function App() {
  const [tab, setTab] = useState("arrivals")
  const [arrivals, setArrivals] = useState([])
  const [departures, setDepartures] = useState([])
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState("")
  const [time, setTime] = useState(new Date())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    fetchFlights()
    const interval = setInterval(fetchFlights, 60000)
    return () => clearInterval(interval)
  }, [])

  async function fetchFlights() {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/3/action/datastore_search?resource_id=e83f763b-b7d7-479e-b172-ae981ddc6de5&limit=1000`
      )
      const data = await res.json()
      if (data.result && data.result.records) {
        const today = new Date().toISOString().slice(0, 10)
        const all = data.result.records.filter(f => {
          const t = f.CHSTOL || f.CHPTOL || ""
          return t.startsWith(today)
        })
        setArrivals(all.filter(f => f.CHAORD === "A"))
        setDepartures(all.filter(f => f.CHAORD === "D"))
      }
    } catch (e) {
      console.log("שגיאה", e)
    }
    setLoading(false)
  }

  const flights = tab === "arrivals" ? arrivals : departures

  const filtered = flights.filter((f) => {
    const dest = f.CHLOC1T || f.CHLOC1CH || ""
    const num = f.CHFLTN || ""
    const airline = f.CHOPERD || f.CHOPER || ""
    return !search ||
      dest.toLowerCase().includes(search.toLowerCase()) ||
      num.toLowerCase().includes(search.toLowerCase()) ||
      airline.toLowerCase().includes(search.toLowerCase())
  })

  const pad = (n) => String(n).padStart(2, "0")
  const clockStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`
  const dateStr = new Date().toLocaleDateString("he-IL", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })

  return (
    <div className="app">
      <div className="header">
        <div className="logo">
          <div className="logo-icon">✈</div>
          <div>
            <div className="logo-text">נתב״ג Live</div>
            <div className="logo-sub">BEN GURION · TLV</div>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat">
            <div className="stat-val">{arrivals.length}</div>
            <div className="stat-label">נחיתות</div>
          </div>
          <div className="stat">
            <div className="stat-val" style={{color:"var(--accent2)"}}>{departures.length}</div>
            <div className="stat-label">המראות</div>
          </div>
          <div className="date-display">{dateStr}</div>
        </div>
        <div className="header-right">
          <div className="clock">{clockStr}</div>
          <div className="live-badge">
            <div className="live-dot" />
            LIVE
          </div>
        </div>
      </div>

      <div className="main">
        <div className="flights-panel">
          <div className="panel-tabs">
            <div className={`tab ${tab === "arrivals" ? "active" : ""}`} onClick={() => { setTab("arrivals"); setSelected(null) }}>🛬 נחיתות ({arrivals.length})</div>
            <div className={`tab ${tab === "departures" ? "active" : ""}`} onClick={() => { setTab("departures"); setSelected(null) }}>🛫 המראות ({departures.length})</div>
          </div>
          {loading && <div className="loading-bar"><div className="loading-fill" /></div>}
          <div className="search-bar">
            <input className="search-input" placeholder="חפש יעד, מספר טיסה, חברה..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flights-list">
            {filtered.length === 0 && !loading && <div className="no-flights">לא נמצאו טיסות</div>}
            {filtered.map((f, i) => {
              const num = f.CHFLTN || "—"
              const destEn = f.CHLOC1T || "—"
              const destHe = f.CHLOC1CH || ""
              const airline = f.CHOPERD || f.CHOPER || "—"
              const flightTime = (f.CHSTOL || f.CHPTOL || "—").slice(11, 16)
              const status = f.CHRMINH || "—"
              const gate = f.CHGATE || "—"
              const isSel = selected && selected.CHFLTN === f.CHFLTN
              return (
                <div key={i} className={`flight-item ${isSel ? "selected" : ""}`} onClick={() => setSelected(f)}>
                  <div className="flight-row1">
                    <span className="flight-num">{num}</span>
                    <span className="flight-dest">
                      {destEn}
                      {destHe && <span className="flight-dest-heb">{destHe}</span>}
                    </span>
                    <span className={`flight-status ${statusClass(status)}`}>{status}</span>
                  </div>
                  <div className="flight-row2">
                    <span className="flight-time">{flightTime}</span>
                    <span className="flight-airline">{airline}</span>
                    <span className="flight-gate">שער <span className="gate-val">{gate}</span></span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="map-panel">
          <svg viewBox="0 0 900 600" className="map-svg">
            <rect width="900" height="600" fill="#050d18" />
            <ellipse cx="400" cy="310" rx="200" ry="55" fill="#060e1a" opacity="0.7" />
            <path d="M100,50 L200,40 L300,50 L380,80 L420,60 L500,70 L550,50 L600,80 L620,120 L580,160 L540,180 L500,170 L460,200 L420,210 L380,200 L340,220 L300,210 L260,230 L220,220 L180,240 L140,220 L100,200 L80,160 L90,120 Z" fill="#0a1520" stroke="#1a2d45" strokeWidth="0.8" />
            <path d="M540,220 L620,200 L700,210 L740,230 L720,260 L680,270 L640,260 L600,270 L560,260 L530,245 Z" fill="#0a1520" stroke="#1a2d45" strokeWidth="0.8" />
            <path d="M580,270 L640,260 L680,270 L700,300 L690,340 L660,360 L630,350 L600,330 L580,300 Z" fill="#0a1520" stroke="#1a2d45" strokeWidth="0.8" />
            <path d="M100,350 L200,340 L300,350 L400,360 L450,370 L460,420 L440,460 L380,470 L300,460 L200,450 L140,440 L100,420 Z" fill="#0a1520" stroke="#1a2d45" strokeWidth="0.8" />
            <circle cx="612" cy="308" r="5" fill="#00ff88" />
            <circle cx="612" cy="308" r="10" fill="none" stroke="#00ff88" strokeWidth="1" opacity="0.4" />
            <text x="612" y="328" textAnchor="middle" fontSize="10" fill="#00ff88" fontFamily="monospace">TLV</text>
            {Object.entries(AIRPORTS).filter(([k]) => k !== "TLV").map(([code, ap]) => (
              <g key={code}>
                <circle cx={ap.x} cy={ap.y} r="3" fill="#3d5a73" />
                <text x={ap.x} y={ap.y - 8} textAnchor="middle" fontSize="9" fill="#3d5a73" fontFamily="monospace">{code}</text>
              </g>
            ))}
          </svg>

          {selected && (
            <div className="flight-detail">
              <div className="detail-header">
                <div>
                  <div className="detail-flight-num">{selected.CHFLTN}</div>
                  <div className="detail-airline">{selected.CHOPERD || selected.CHOPER}</div>
                </div>
                <div className="close-btn" onClick={() => setSelected(null)}>✕</div>
              </div>
              <div className="detail-grid">
                <div className="detail-cell">
                  <div className="detail-cell-label">יעד</div>
                  <div className="detail-cell-val">{selected.CHLOC1T || "—"}</div>
                </div>
                <div className="detail-cell">
                  <div className="detail-cell-label">סטטוס</div>
                  <div className="detail-cell-val hl">{selected.CHRMINH || "—"}</div>
                </div>
                <div className="detail-cell">
                  <div className="detail-cell-label">שעה מתוכננת</div>
                  <div className="detail-cell-val">{(selected.CHSTOL || selected.CHPTOL || "—").slice(11, 16)}</div>
                </div>
                <div className="detail-cell">
                  <div className="detail-cell-label">תאריך</div>
                  <div className="detail-cell-val">{formatDate(selected.CHSTOL || selected.CHPTOL)}</div>
                </div>
                <div className="detail-cell">
                  <div className="detail-cell-label">שער</div>
                  <div className="detail-cell-val">{selected.CHGATE || "—"}</div>
                </div>
                <div className="detail-cell">
                  <div className="detail-cell-label">טרמינל</div>
                  <div className="detail-cell-val">{selected.CHTERM || "—"}</div>
                </div>
                <div className="detail-cell">
                  <div className="detail-cell-label">מדינה</div>
                  <div className="detail-cell-val">{selected.CHLOC1CH || "—"}</div>
                </div>
                <div className="detail-cell">
                  <div className="detail-cell-label">חברה</div>
                  <div className="detail-cell-val">{selected.CHOPERD || selected.CHOPER || "—"}</div>
                </div>
              </div>
              <div className="opensky-badge">📡 data.gov.il · נתונים חיים</div>
            </div>
          )}

          <div className="map-legend">
            <div className="legend-item"><div className="legend-dot" style={{ background: "#00aaff" }} />בטיסה</div>
            <div className="legend-item"><div className="legend-dot" style={{ background: "#00ff88" }} />נחתה</div>
            <div className="legend-item"><div className="legend-dot" style={{ background: "#ff6b35" }} />עיכוב</div>
          </div>
        </div>
      </div>
    </div>
  )
}