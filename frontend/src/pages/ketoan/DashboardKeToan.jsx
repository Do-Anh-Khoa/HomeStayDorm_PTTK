import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageTitle from '../../components/common/PageTitle.jsx'
import api from '../../services/api.js'

const DONUT_SEGMENTS = [
  { key: 'daThanhToan', label: 'Đã thanh toán', color: '#3b4f27' },
  { key: 'chuaThanhToan', label: 'Chưa thanh toán', color: '#8a9a6b' },
  { key: 'hopLe', label: 'Hợp lệ', color: '#c7cfba' },
  { key: 'khongHopLe', label: 'Không hợp lệ', color: '#e5e7eb' }
]

const CARD_CONFIG = [
  { key: 'datCoc', icon: '🧾', label: 'PHIẾU THU ĐẶT CỌC\nCẦN LẬP', route: '/ke-toan/lap-pt-dat-coc' },
  { key: 'hopDong', icon: '📅', label: 'PHIẾU THU HỢP ĐỒNG\nCẦN LẬP', route: '/ke-toan/lap-pt-hop-dong' },
  { key: 'boiThuong', icon: '📄', label: 'PHIẾU THU BỒI THƯỜNG\nCẦN LẬP', route: '/ke-toan/lap-pt-boi-thuong' },
  {
    key: 'traPhong',
    icon: '⇥',
    label: 'PHIẾU THU TRẢ PHÒNG\nCẦN XỬ LÝ',
    route: '/ke-toan/lap-pt-tra-phong',
    urgent: true
  }
]

export default function AccountingDashboard() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState(null)

  const [rows, setRows] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(5)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRooms, setTotalRooms] = useState(0)
  const [tableLoading, setTableLoading] = useState(true)

  useEffect(() => {
    fetchSummary()
  }, [])

  useEffect(() => {
    fetchDichVuPhong(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const fetchSummary = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/ke-toan/dashboard')
      setSummary(res.data?.data || res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải dữ liệu dashboard kế toán.')
    } finally {
      setLoading(false)
    }
  }

  const fetchDichVuPhong = async (currentPage) => {
    setTableLoading(true)
    try {
      const res = await api.get('/ke-toan/dashboard/dich-vu-phong', {
        params: { page: currentPage, pageSize }
      })
      const data = res.data?.data || res.data
      setRows(data.items || [])
      setTotalRooms(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      console.error(err)
    } finally {
      setTableLoading(false)
    }
  }

  const trangThai = summary?.trangThaiTongHop || {
    tongSo: 0,
    daThanhToan: 0,
    chuaThanhToan: 0,
    hopLe: 0,
    khongHopLe: 0
  }
  const soPhieuCanLap = summary?.soPhieuCanLap || {
    datCoc: 0,
    hopDong: 0,
    boiThuong: 0,
    traPhong: 0
  }

  return (
    <section style={S.page}>
      <PageTitle
        title="Accounting Dashboard"
        description={
          loading
            ? 'Đang tải dữ liệu...'
            : `Chào mừng trở lại! Hôm nay bạn có ${summary?.tongChungTuCanXuLy ?? 0} chứng từ cần xử lý.`
        }
      />

      {error && <div style={S.errorBanner}>{error}</div>}

      {/* ---- 4 thẻ số phiếu cần lập ---- */}
      <div style={S.cardsRow}>
        {CARD_CONFIG.map(cfg => (
          <button
            key={cfg.key}
            type="button"
            style={cfg.urgent ? S.summaryCardUrgent : S.summaryCard}
            onClick={() => navigate(cfg.route)}
          >
            <div style={S.cardTopRow}>
              <span style={S.cardIcon}>{cfg.icon}</span>
              {cfg.urgent && <span style={S.urgentBadge}>CẦN XỬ LÝ</span>}
            </div>
            <div style={S.cardLabel}>
              {cfg.label.split('\n').map(line => (
                <div key={line}>{line}</div>
              ))}
            </div>
            <div style={cfg.urgent ? S.cardValueUrgent : S.cardValue}>
              {loading ? '--' : soPhieuCanLap[cfg.key]}
            </div>
          </button>
        ))}
      </div>

      <div style={S.grid}>
        {/* ---- Donut trạng thái phiếu thu tổng hợp ---- */}
        <div style={S.card}>
          <div style={S.cardTitleRow}>
            <span style={S.cardTitle}>Trạng thái phiếu thu tổng hợp</span>
            <span style={S.dotsMenu}>⋮</span>
          </div>
          <DonutChart data={trangThai} loading={loading} />
          <div style={S.legend}>
            {DONUT_SEGMENTS.map(seg => (
              <div key={seg.key} style={S.legendRow}>
                <span style={{ ...S.legendDot, backgroundColor: seg.color }} />
                <span style={S.legendLabel}>{seg.label}</span>
                <span style={S.legendValue}>{loading ? '--' : trangThai[seg.key]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ---- Danh sách dịch vụ phòng cần ghi nhận ---- */}
        <div style={S.card}>
          <div style={S.cardTitleRow}>
            <div>
              <div style={S.cardTitle}>Danh sách dịch vụ phòng cần ghi nhận</div>
              <div style={S.cardSubtitle}>
                Cập nhật lúc{' '}
                {new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(
                  new Date()
                )}{' '}
                hôm nay
              </div>
            </div>
            <button type="button" style={S.filterBtn}>
              ⇅ Bộ lọc
            </button>
          </div>

          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Mã phòng</th>
                <th style={S.th}>Tên dịch vụ</th>
                <th style={S.th}>Số lượng</th>
                <th style={S.th}>Trạng thái</th>
                <th style={S.th} />
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                <tr>
                  <td colSpan={5} style={S.emptyCell}>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} style={S.emptyCell}>
                    Không có phòng nào trong chi nhánh.
                  </td>
                </tr>
              ) : (
                rows.map(row => (
                  <tr key={row.ma_phong}>
                    <td style={S.td}>{row.ma_phong}</td>
                    <td style={S.td}>{row.ten_dv || '--'}</td>
                    <td style={S.td}>{row.so_luong ?? '--'}</td>
                    <td style={S.td}>
                      <span
                        style={
                          row.trang_thai === 'Đã lập dịch vụ' ? S.statusDone : S.statusPending
                        }
                      >
                        {row.trang_thai}
                      </span>
                    </td>
                    <td style={{ ...S.td, textAlign: 'right' }}>
                      <span style={S.arrow}>›</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div style={S.paginationRow}>
            <span style={S.paginationText}>
              Hiển thị {rows.length} / {totalRooms} phòng
            </span>
            <div style={S.paginationControls}>
              <button
                type="button"
                style={S.pageBtn}
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(0, 3)
                .map(p => (
                  <button
                    key={p}
                    type="button"
                    style={p === page ? S.pageBtnActive : S.pageBtn}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
              <button
                type="button"
                style={S.pageBtn}
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function DonutChart({ data, loading }) {
  const total = data.tongSo || 0
  const size = 160
  const stroke = 18
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  let offsetAcc = 0
  const segments = DONUT_SEGMENTS.map(seg => {
    const value = total > 0 ? data[seg.key] || 0 : 0
    const fraction = total > 0 ? value / total : 0
    const dash = fraction * circumference
    const segment = {
      ...seg,
      dasharray: `${dash} ${circumference - dash}`,
      dashoffset: -offsetAcc
    }
    offsetAcc += dash
    return segment
  })

  return (
    <div style={S.donutWrap}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={stroke}
        />
        {!loading &&
          total > 0 &&
          segments.map(seg => (
            <circle
              key={seg.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={seg.dasharray}
              strokeDashoffset={seg.dashoffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              strokeLinecap="butt"
            />
          ))}
      </svg>
      <div style={S.donutCenter}>
        <div style={S.donutTotal}>{loading ? '--' : total}</div>
        <div style={S.donutTotalLabel}>TỔNG SỐ</div>
      </div>
    </div>
  )
}

const S = {
  page: { padding: 0, fontFamily: 'Inter, sans-serif' },
  errorBanner: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    padding: '10px 14px',
    marginBottom: '16px',
    fontSize: '14px'
  },
  cardsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginTop: '20px'
  },
  summaryCard: {
    textAlign: 'left',
    border: '1px solid #eef0eb',
    borderRadius: '10px',
    padding: '18px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  summaryCardUrgent: {
    textAlign: 'left',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '18px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  cardTopRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardIcon: { fontSize: '20px', color: '#6b7280' },
  urgentBadge: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '999px'
  },
  cardLabel: {
    marginTop: '14px',
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: 600,
    letterSpacing: '0.02em',
    lineHeight: 1.5
  },
  cardValue: { marginTop: '10px', fontSize: '26px', fontWeight: 700, color: '#111827' },
  cardValueUrgent: { marginTop: '10px', fontSize: '26px', fontWeight: 700, color: '#dc2626' },
  grid: {
    display: 'grid',
    gridTemplateColumns: '340px 1fr',
    gap: '20px',
    marginTop: '20px',
    alignItems: 'start'
  },
  card: {
    border: '1px solid #eef0eb',
    borderRadius: '10px',
    padding: '20px',
    backgroundColor: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  cardTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  cardTitle: { fontSize: '15px', fontWeight: 700, color: '#111827' },
  cardSubtitle: { fontSize: '12px', color: '#9ca3af', marginTop: '4px' },
  dotsMenu: { color: '#9ca3af', cursor: 'pointer' },
  filterBtn: {
    height: '34px',
    padding: '0 14px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#fff',
    color: '#4b5563',
    fontSize: '13px',
    cursor: 'pointer'
  },
  donutWrap: {
    position: 'relative',
    width: '160px',
    height: '160px',
    margin: '0 auto 20px'
  },
  donutCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center'
  },
  donutTotal: { fontSize: '24px', fontWeight: 700, color: '#111827' },
  donutTotalLabel: { fontSize: '10px', color: '#9ca3af', letterSpacing: '0.05em' },
  legend: { display: 'flex', flexDirection: 'column', gap: '10px' },
  legendRow: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px' },
  legendDot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  legendLabel: { flex: 1, color: '#4b5563' },
  legendValue: { fontWeight: 700, color: '#111827' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '4px' },
  th: {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: '13px',
    color: '#6b7280',
    borderBottom: '1px solid #eef0eb'
  },
  td: { padding: '14px 12px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f3f4f6' },
  emptyCell: { padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' },
  statusDone: {
    display: 'inline-block',
    backgroundColor: '#d1fae5',
    color: '#059669',
    padding: '3px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600
  },
  statusPending: {
    display: 'inline-block',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    padding: '3px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600
  },
  arrow: { color: '#9ca3af', fontSize: '16px' },
  paginationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px'
  },
  paginationText: { fontSize: '13px', color: '#6b7280' },
  paginationControls: { display: 'flex', gap: '6px' },
  pageBtn: {
    width: '30px',
    height: '30px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#fff',
    color: '#4b5563',
    cursor: 'pointer',
    fontSize: '13px'
  },
  pageBtnActive: {
    width: '30px',
    height: '30px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#3b4f27',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 700
  }
}