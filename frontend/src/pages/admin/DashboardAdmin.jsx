import { useEffect, useState } from 'react'
import PageTitle from '../../components/common/PageTitle.jsx'
import api from '../../services/api.js'

// ===== Icons (đồng bộ style với các icon khác trong hệ thống) =====
const IconChiNhanh = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18" />
    <path d="M5 21V7l7-4 7 4v14" />
    <path d="M9 21v-6h6v6" />
    <path d="M9 9h1M14 9h1M9 13h1M14 13h1" />
  </svg>
)
const IconNhanVien = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
const IconQuyDinh = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 2h6l5 5v13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
    <path d="M9 12h6M9 16h6M9 8h2" />
  </svg>
)

// ===== Skeleton đơn giản cho card =====
function StatCard({ icon, label, value, sub, subColor }) {
  return (
    <div style={S.statCard}>
      <div style={S.statIconWrap}>{icon}</div>
      <div style={S.statLabel}>{label}</div>
      <div style={S.statValue}>{value}</div>
      {sub && <div style={{ ...S.statSub, color: subColor || '#7a8a6a' }}>{sub}</div>}
    </div>
  )
}

// ===== Biểu đồ cột chồng: Tình trạng giường theo chi nhánh =====
function GiuongChart({ data }) {
  return (
    <div style={S.card}>
      <div style={S.cardHeadRow}>
        <h3 style={S.cardTitle}>Tình trạng giường theo chi nhánh</h3>
        <div style={S.legendRow}>
          <span style={S.legendItem}><i style={{ ...S.legendDot, backgroundColor: '#3b4f27' }} />Đang sử dụng</span>
          <span style={S.legendItem}><i style={{ ...S.legendDot, backgroundColor: '#a9bd97' }} />Đã đặt cọc</span>
          <span style={S.legendItem}><i style={{ ...S.legendDot, backgroundColor: '#e6ebe0' }} />Trống</span>
        </div>
      </div>

      {data.length === 0 ? (
        <p style={S.emptyMsg}>Chưa có dữ liệu giường.</p>
      ) : (
        <div style={S.barsWrap}>
          {data.map((d) => {
            const total = d.dang_su_dung + d.da_dat_coc + d.trong
            const h = (v) => total > 0 ? `${(v / total) * 100}%` : '0%'
            return (
              <div key={d.ma_cn} style={S.barCol}>
                <div style={S.barTrack}>
                  <div style={{ ...S.barSeg, height: h(d.dang_su_dung), backgroundColor: '#3b4f27' }} title={`Đang sử dụng: ${d.dang_su_dung}`} />
                  <div style={{ ...S.barSeg, height: h(d.da_dat_coc), backgroundColor: '#a9bd97' }} title={`Đã đặt cọc: ${d.da_dat_coc}`} />
                  <div style={{ ...S.barSeg, height: h(d.trong), backgroundColor: '#e6ebe0' }} title={`Trống: ${d.trong}`} />
                </div>
                <div style={S.barLabel}>{d.ma_cn}</div>
                <div style={S.barTotal}>{total}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ===== Phân bố nhân sự =====
function PhanBoNhanSu({ data }) {
  return (
    <div style={{ ...S.card, display: 'flex', flexDirection: 'column' }}>
      <h3 style={S.cardTitle}>Phân bố nhân sự</h3>

      {data.length === 0 ? (
        <p style={{ ...S.emptyMsg, flex: 1 }}>Chưa có dữ liệu nhân sự.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '18px', flex: 1 }}>
          {data.map((d) => (
            <div key={d.label}>
              <div style={S.progressHeadRow}>
                <span style={S.progressLabel}>{d.label}</span>
                <span style={S.progressPct}>{d.pct}%</span>
              </div>
              <div style={S.progressTrack}>
                <div style={{ ...S.progressFill, width: `${d.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ===== Trang Chính =====
export default function TrangChuADMINPage() {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState({
    tong_chi_nhanh: 0,
    tong_nhan_vien: 0,
    tong_giuong_trong: 0,
    ty_le_lap_day: 0,
    tong_quy_dinh: 0,
  })
  const [giuongData, setGiuongData] = useState([])
  const [nhanSuData, setNhanSuData] = useState([])
  const [errorMsg, setErrorMsg] = useState('')

  // Helper to get color for tỷ lệ lấp đầy
  const getTyLeColor = (tyLe) => {
    if (tyLe < 30) return '#c0392b' // đỏ
    if (tyLe < 70) return '#f39c12' // vàng
    return '#3b4f27' // xanh lá
  }

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      setErrorMsg('')
      try {
        const [ovRes, giuongRes, nsRes] = await Promise.all([
          api.get('/dashboard/tong-quan'),
          api.get('/dashboard/giuong-theo-chi-nhanh'),
          api.get('/dashboard/phan-bo-nhan-su'),
        ])

        setOverview(ovRes.data?.data || ovRes.data || {})
        setGiuongData(giuongRes.data?.data || giuongRes.data || [])
        setNhanSuData(nsRes.data?.data || nsRes.data || [])
      } catch {
        setErrorMsg('Không thể tải dữ liệu tổng quan hệ thống.')
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
          title="MÀN HÌNH TRANG CHỦ"
          description="Chào mừng trở lại! Hệ thống đang vận hành ổn định."
        />
      </div>

      {errorMsg && <p style={{ ...S.errMsg, marginBottom: '16px' }}>{errorMsg}</p>}

      {/* Thẻ thống kê tổng quan */}
      <div style={S.statGrid}>
        <StatCard
          icon={<IconChiNhanh />}
          label="TỔNG CHI NHÁNH"
          value={loading ? '—' : overview.tong_chi_nhanh}
        />
        <StatCard
          icon={<IconNhanVien />}
          label="TỔNG NHÂN VIÊN"
          value={loading ? '—' : overview.tong_nhan_vien}
        />
        <StatCard
          icon={<IconGiuong />}
          label="TỔNG GIƯỜNG TRỐNG"
          value={loading ? '—' : overview.tong_giuong_trong}
          sub={!loading ? `↗ Tỷ lệ lấp đầy ${overview.ty_le_lap_day.toFixed(1)}%` : ''}
          subColor={!loading ? getTyLeColor(overview.ty_le_lap_day) : '#7a8a6a'}
        />
        <StatCard
          icon={<IconQuyDinh />}
          label="QUY ĐỊNH HỆ THỐNG"
          value={loading ? '—' : overview.tong_quy_dinh}
        />
      </div>

      {/* Biểu đồ */}
      <div style={S.chartsGrid}>
        <GiuongChart data={loading ? [] : giuongData} />
        <PhanBoNhanSu data={loading ? [] : nhanSuData} />
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
  statSub: {
    marginTop: '6px',
    fontSize: '12.5px',
    fontWeight: 600,
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
    gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
    gap: '16px',
    alignItems: 'stretch',
  },

  // ---- Legend ----
  legendRow: { display: 'flex', gap: '14px', flexWrap: 'wrap' },
  legendItem: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7560', fontWeight: 600 },
  legendDot: { width: '9px', height: '9px', borderRadius: '3px', display: 'inline-block' },

  // ---- Bar chart ----
  barsWrap: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: '40px',
    height: '260px',
    marginTop: '30px',
    padding: '0 20px',
  },
  barCol: {
    flex: '0 1 120px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
  },
  barTrack: {
    flex: 1,
    width: '80px',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#f4f6f0',
  },
  barSeg: { width: '100%', flexShrink: 0 },
  barLabel: { marginTop: '14px', fontSize: '13px', fontWeight: 700, color: '#6b7560', textAlign: 'center' },
  barTotal: { fontSize: '12px', color: '#9aa090', marginTop: '4px' },

  // ---- Progress bars (phân bố nhân sự) ----
  progressHeadRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '7px' },
  progressLabel: { fontSize: '13px', fontWeight: 600, color: '#1a1f14' },
  progressPct: { fontSize: '13px', fontWeight: 700, color: '#3b4f27' },
  progressTrack: { width: '100%', height: '8px', borderRadius: '5px', backgroundColor: '#eef0eb', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#3b4f27', borderRadius: '5px' },
}