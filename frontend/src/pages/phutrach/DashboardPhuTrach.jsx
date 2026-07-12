import { useEffect, useState } from 'react'
import PageTitle from '../../components/common/PageTitle.jsx'
import api from '../../services/api.js'
import { getStoredUser } from '../../services/authSession.js'
// ===== Icons =====
const IconChoHopDong = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 2h6l5 5v13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
    <path d="M9 12h6M9 16h6M9 8h2" />
  </svg>
)
const IconGiuong = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
    <path d="M2 20v-3h20v3" />
    <path d="M2 12V9a2 2 0 0 1 2-2h4v5" />
    <path d="M12 9h6" />
  </svg>
)
const IconHopDongDaLap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)
const IconKhach = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

// ===== Card thống kê =====
function StatCard({ icon, label, value }) {
  return (
    <div style={S.statCard}>
      <div style={S.statIconWrap}>{icon}</div>
      <div style={S.statLabel}>{label}</div>
      <div style={S.statValue}>{value}</div>
    </div>
  )
}

// ===== Donut: Tình trạng giường =====
function TinhTrangGiuong({ roomStatus }) {
  const total = roomStatus.total || 0

  const ringStyle = (() => {
    if (!total) return { background: '#e6ebe0' }
    let current = 0
    const segments = roomStatus.items.map((item) => {
      const angle = (item.value / total) * 360
      const start = current
      const end = current + angle
      current = end
      return `${item.color} ${start}deg ${end}deg`
    })
    return { background: `conic-gradient(${segments.join(', ')})` }
  })()

  return (
    <div style={S.card}>
      <h3 style={S.cardTitle}>Tình trạng giường</h3>

      <div style={S.donutWrap}>
        <div style={{ ...S.donutRing, ...ringStyle }}>
          <div style={S.donutHole}>
            <div style={S.donutTotal}>{total}</div>
            <div style={S.donutTotalLabel}>Tổng giường</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '22px' }}>
        {roomStatus.items.map((item) => {
          const pct = total ? Math.round((item.value / total) * 100) : 0
          return (
            <div key={item.key} style={S.legendRowBetween}>
              <span style={S.legendItem}>
                <i style={{ ...S.legendDot, backgroundColor: item.color }} />
                {item.label}
              </span>
              <span style={S.legendValue}>{item.value} ({pct}%)</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ===== Bar chart: Thống kê hợp đồng theo tháng =====
function ThongKeHopDong({ chart }) {
  const maxTotal = Math.max(chart.maxTotal, 1)

  return (
    <div style={S.card}>
      <div style={S.cardHeadRow}>
        <h3 style={S.cardTitle}>Thống kê hợp đồng</h3>
        <div style={S.legendRow}>
          <span style={S.legendItem}>
            <i style={{ ...S.legendDot, backgroundColor: '#3b4f27' }} />
            Số lượng hợp đồng ({chart.year})
          </span>
        </div>
      </div>

      {chart.items.every((item) => item.total === 0) ? (
        <p style={S.emptyMsg}>Chưa có dữ liệu hợp đồng.</p>
      ) : (
        <div style={S.monthBarsWrap}>
          {chart.items.map((item) => {
            const h = item.total ? `${Math.max((item.total / maxTotal) * 100, 4)}%` : '2%'
            return (
              <div key={item.month} style={S.monthBarCol}>
                <div style={S.monthBarValue}>{item.total > 0 ? item.total : ''}</div>
                <div style={S.monthBarTrack}>
                  <div style={{ ...S.monthBarFill, height: h }} />
                </div>
                <div style={S.monthBarLabel}>{item.label}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ===== Trang Dashboard Phụ trách =====
export default function DashboardPhuTrach() {
  const user = getStoredUser()
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [branch, setBranch] = useState(null)
  const [summary, setSummary] = useState({
    pendingContracts: 0,
    availableBeds: 0,
    contractsSigned: 0,
    closedCustomers: 0,
    totalContracts: 0,
    contractsThisMonth: 0,
    contractsThisYear: 0,
  })
  const [roomStatus, setRoomStatus] = useState({
    total: 0,
    items: [
      { key: 'reserved', label: 'Đã đặt cọc', value: 0, color: '#a9bd97' },
      { key: 'occupied', label: 'Đang sử dụng', value: 0, color: '#3b4f27' },
      { key: 'available', label: 'Trống', value: 0, color: '#e6ebe0' },
    ],
  })
  const [contractsChart, setContractsChart] = useState({
    year: new Date().getFullYear(),
    maxTotal: 0,
    items: Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      label: `T${index + 1}`,
      total: 0,
    })),
  })

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      setErrorMsg('')
      try {
        const res = await api.get('/phu-trach-dashboard')
        const data = res.data?.data || res.data || {}

        setBranch(data.branch || null)
        setSummary((prev) => ({ ...prev, ...data.summary }))
        setRoomStatus((prev) => ({ ...prev, ...data.roomStatus }))
        setContractsChart((prev) => ({ ...prev, ...data.contractsChart }))
      } catch (err) {
        console.error('Lỗi tải dashboard phụ trách:', err?.response?.status, err?.response?.data || err?.message)
        setErrorMsg(err?.response?.data?.message || 'Không thể tải dữ liệu dashboard phụ trách.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  return (
    <section>
      <div style={{ marginBottom: '24px' }}>
        <PageTitle
          title="Trang chủ Phụ trách"
          description={`Chào mừng trở lại! Bạn có ${loading ? '—' : summary.pendingContracts} phiếu đặt cọc đang chờ lập hợp đồng.`}
        />
      </div>

      {errorMsg && <p style={{ ...S.errMsg, marginBottom: '16px' }}>{errorMsg}</p>}

      {/* Thẻ thống kê tổng quan */}
      <div style={S.statGrid}>
        <StatCard
          icon={<IconChoHopDong />}
          label="CHỜ LẬP HỢP ĐỒNG"
          value={loading ? '—' : summary.pendingContracts}
        />
        <StatCard
          icon={<IconGiuong />}
          label="SỐ GIƯỜNG TRỐNG"
          value={loading ? '—' : summary.availableBeds}
        />
        <StatCard
          icon={<IconHopDongDaLap />}
          label="HỢP ĐỒNG ĐÃ LẬP"
          value={loading ? '—' : summary.contractsSigned}
        />
        <StatCard
          icon={<IconKhach />}
          label="SỐ KHÁCH ĐÃ CHỐT"
          value={loading ? '—' : summary.closedCustomers}
        />
      </div>

      {/* Biểu đồ */}
      <div style={S.chartsGrid}>
        <TinhTrangGiuong roomStatus={loading ? { total: 0, items: roomStatus.items } : roomStatus} />
        <ThongKeHopDong chart={loading ? { ...contractsChart, maxTotal: 0 } : contractsChart} />
      </div>
    </section>
  )
}

const S = {
  errMsg: { margin: 0, fontSize: '13.5px', color: '#c0392b' },

  // ---- Stat cards ----
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  statCard: {
    backgroundColor: '#fff',
    border: '1px solid #dde3d8',
    borderRadius: '12px',
    padding: '18px 20px',
  },
  statIconWrap: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    backgroundColor: '#eef2e8',
    color: '#3b4f27',
    marginBottom: '14px',
  },
  statLabel: {
    fontSize: '11.5px',
    fontWeight: 700,
    letterSpacing: '0.4px',
    color: '#9aa090',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#1a1f14',
    lineHeight: 1.1,
  },

  // ---- Card chung ----
  card: {
    backgroundColor: '#fff',
    border: '1px solid #dde3d8',
    borderRadius: '12px',
    padding: '22px 24px',
  },
  cardTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 700,
    color: '#1a1f14',
  },
  cardHeadRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '4px',
  },
  emptyMsg: { textAlign: 'center', padding: '32px', color: '#9aa090', fontSize: '13.5px' },

  // ---- Charts grid layout ----
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.6fr)',
    gap: '16px',
    alignItems: 'stretch',
  },

  // ---- Legend ----
  legendRow: { display: 'flex', gap: '14px', flexWrap: 'wrap' },
  legendRowBetween: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  legendItem: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7560', fontWeight: 600 },
  legendValue: { fontSize: '13px', fontWeight: 700, color: '#1a1f14' },
  legendDot: { width: '9px', height: '9px', borderRadius: '3px', display: 'inline-block' },

  // ---- Donut ----
  donutWrap: { display: 'flex', justifyContent: 'center', marginTop: '10px' },
  donutRing: {
    width: '190px',
    height: '190px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutHole: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 0 0 0 1px #e6e9e1',
  },
  donutTotal: { fontSize: '38px', fontWeight: 800, color: '#1a1f14', lineHeight: 1 },
  donutTotalLabel: { marginTop: '6px', fontSize: '12px', fontWeight: 700, color: '#9aa090', letterSpacing: '0.4px' },

  // ---- Bar chart theo tháng ----
  monthBarsWrap: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: '10px',
    height: '220px',
    marginTop: '26px',
  },
  monthBarCol: {
    flex: '1 1 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
  },
  monthBarValue: { fontSize: '12px', fontWeight: 700, color: '#1a1f14', marginBottom: '6px' },
  monthBarTrack: {
    flex: 1,
    width: '100%',
    display: 'flex',
    alignItems: 'flex-end',
    borderRadius: '6px 6px 0 0',
    overflow: 'hidden',
    backgroundColor: '#f4f6f0',
  },
  monthBarFill: { width: '100%', backgroundColor: '#3b4f27', borderRadius: '4px 4px 0 0' },
  monthBarLabel: { marginTop: '10px', fontSize: '12px', fontWeight: 600, color: '#9aa090' },
}