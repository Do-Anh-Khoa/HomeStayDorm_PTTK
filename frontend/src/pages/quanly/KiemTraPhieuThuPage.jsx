import { useEffect, useState } from 'react'
import PageTitle from '../../components/common/PageTitle.jsx'
import api from '../../services/api.js'

// Hàm format tiền tệ
const formatMoney = (value) => {
  const raw = String(value ?? '').replace(/[^\d]/g, '')
  return raw ? Number(raw).toLocaleString('vi-VN') : '0'
}

// Loại phiếu thu nào cho phép "Xem chi tiết" (chỉ đọc) sau khi đã kiểm tra
const LOAI_XEM_CHI_TIET = ['Đặt cọc', 'Hợp đồng']
// Loại phiếu thu cho phép "Cập nhật" khi phiếu ở trạng thái Không hợp lệ
const LOAI_CAP_NHAT = ['Trả phòng', 'Bồi thường']

// Icons
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9aa090" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

// Badge trạng thái
function StatusBadge({ status }) {
  const map = {
    'Đã thanh toán': { bg: '#e8f3e3', color: '#2e7d32' },
    'Hợp lệ': { bg: '#e8f3e3', color: '#2e7d32' },
    'Không hợp lệ': { bg: '#fbe9e7', color: '#c0392b' },
  }
  const s = map[status] || { bg: '#eef0eb', color: '#6b7560' }
  return (
    <span style={{ ...S.badge, backgroundColor: s.bg, color: s.color }}>
      <span style={{ ...S.badgeDot, backgroundColor: s.color }} />
      {status}
    </span>
  )
}

// Khối thông tin phiếu thu + khách hàng (dùng chung cho cả 2 chế độ)
function ThongTinPhieuThu({ data }) {
  return (
    <div style={S.formCard}>
      <div style={S.sectionHeaderRow}>
        <h3 style={S.sectionTitle}>Thông tin phiếu thu</h3>
        <StatusBadge status={data.trangThai} />
      </div>

      <div style={S.infoGrid}>
        <div>
          <div style={S.infoLabel}>Mã phiếu thu</div>
          <div style={S.infoValue}>{data.maPhieuThu}</div>
        </div>
        <div>
          <div style={S.infoLabel}>Ngày lập</div>
          <div style={S.infoValue}>{data.ngayLap}</div>
        </div>
        <div>
          <div style={S.infoLabel}>Nhân viên lập phiếu</div>
          <div style={S.infoValue}>{data.nhanVienLapPhieu}</div>
        </div>

        {data.maChungTuGoc && (
          <div>
            <div style={S.infoLabel}>{data.nhanChungTuGoc || 'Mã chứng từ liên quan'}</div>
            <div style={S.infoValue}>{data.maChungTuGoc}</div>
          </div>
        )}
        <div>
          <div style={S.infoLabel}>Tổng tiền</div>
          <div style={S.infoValueMoney}>{formatMoney(data.tongTien)} VND</div>
        </div>
      </div>

      <div style={S.khachHangBox}>
        <div style={S.infoLabelSm}>Thông tin khách hàng</div>
        <div style={S.infoGrid}>
          <div>
            <div style={S.infoLabel}>Họ và tên</div>
            <div style={S.infoValue}>{data.tenKhachHang}</div>
          </div>
          <div>
            <div style={S.infoLabel}>Số điện thoại</div>
            <div style={S.infoValue}>{data.soDienThoai}</div>
          </div>
          <div>
            <div style={S.infoLabel}>CCCD</div>
            <div style={S.infoValue}>{data.cccd}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Màn hình Chi tiết kiểm tra phiếu thu (nhập kết quả kiểm tra)
function ChiTietKiemTraView({ detail, onCancel, onSaved, submitting, onSubmit, serverError }) {
  const [ketQua, setKetQua] = useState(null) // 'hop_le' | 'khong_hop_le'
  const [ghiChu, setGhiChu] = useState('')
  const [error, setError] = useState('')
  const [showNoteError, setShowNoteError] = useState(false)

  const handleChonKetQua = (val) => {
    setKetQua(val)
    setError('')
    setShowNoteError(false)
  }

  const handleLuu = () => {
    if (!ketQua) {
      setError('Vui lòng chọn kết quả kiểm tra.')
      setShowNoteError(false)
      return
    }
    if (ketQua === 'khong_hop_le' && !ghiChu.trim()) {
      setError('Vui lòng nhập lý do phiếu thu không hợp lệ.')
      setShowNoteError(true)
      return
    }
    setShowNoteError(false)
    onSubmit({ trangThai: ketQua === 'hop_le' ? 'Hợp lệ' : 'Không hợp lệ', ghiChu: ghiChu.trim() })
  }

  return (
    <section>
      <div style={{ marginBottom: '4px' }}>
        <PageTitle title="Chi tiết kiểm tra phiếu thu" description="Kiểm tra thông tin khách hàng, số tiền và thời gian thanh toán." />
      </div>

      <ThongTinPhieuThu data={detail} />

      <div style={{ ...S.formCard, marginTop: '18px' }}>
        <h3 style={S.sectionTitle}>Kết quả kiểm tra</h3>
        <div style={S.ketQuaRow}>
          <button
            style={{ ...S.ketQuaBtn, ...(ketQua === 'hop_le' ? S.ketQuaBtnHopLeActive : {}) }}
            onClick={() => handleChonKetQua('hop_le')}
            disabled={submitting}
          >
            <IconCheck /> Hợp lệ
          </button>
          <button
            style={{ ...S.ketQuaBtn, ...(ketQua === 'khong_hop_le' ? S.ketQuaBtnKhongHopLeActive : {}) }}
            onClick={() => handleChonKetQua('khong_hop_le')}
            disabled={submitting}
          >
            <IconX /> Không hợp lệ
          </button>
        </div>

        <div style={{ marginTop: '18px' }}>
          <label style={S.label}>Ghi chú</label>
          <textarea
            style={{ ...S.textarea, ...(showNoteError ? { borderColor: '#c0392b' } : {}) }}
            placeholder={ketQua === 'khong_hop_le' ? 'Vui lòng nhập ghi chú lý do phiếu thu không hợp lệ.' : 'Nhập ghi chú nếu cần cho kết quả kiểm tra.'}
            value={ghiChu}
            onChange={e => { setGhiChu(e.target.value); setError(''); if (showNoteError) setShowNoteError(false) }}
            rows={3}
          />
        </div>

        {error && <p style={S.errMsg}>{error}</p>}
        {serverError && <p style={S.errMsg}>{serverError}</p>}

        <div style={{ borderTop: '1px solid #eef0eb', margin: '20px 0 0' }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
          <button style={S.btnSecondary} onClick={onCancel} disabled={submitting}>Hủy</button>
          <button style={S.btnPrimary} onClick={handleLuu} disabled={submitting}>
            {submitting ? 'Đang lưu…' : 'Lưu kết quả'}
          </button>
        </div>
      </div>
    </section>
  )
}

// Màn hình Xem chi tiết (chỉ đọc) sau khi đã kiểm tra
function XemChiTietView({ detail, onBack }) {
  return (
    <section>
      <div style={{ marginBottom: '4px' }}>
        <PageTitle title="Chi tiết kiểm tra phiếu thu" description="Kiểm tra thông tin khách hàng, số tiền và thời gian thanh toán." />
      </div>

      <ThongTinPhieuThu data={detail} />

      <div style={{ ...S.formCard, marginTop: '18px' }}>
        <h3 style={S.sectionTitle}>Kết quả kiểm tra</h3>
        <div style={S.ketQuaRow}>
          <div style={{ ...S.ketQuaBtn, ...(detail.trangThai === 'Hợp lệ' ? S.ketQuaBtnHopLeActive : {}), cursor: 'default' }}>
            <IconCheck /> Hợp lệ
          </div>
          <div style={{ ...S.ketQuaBtn, ...(detail.trangThai === 'Không hợp lệ' ? S.ketQuaBtnKhongHopLeActive : {}), cursor: 'default' }}>
            <IconX /> Không hợp lệ
          </div>
        </div>

        {detail.trangThai === 'Không hợp lệ' && (
          <div style={{ marginTop: '18px' }}>
            <label style={S.label}>Ghi chú</label>
            <div style={S.textareaReadonly}>{detail.ghiChu || '—'}</div>
          </div>
        )}

        <div style={{ borderTop: '1px solid #eef0eb', margin: '20px 0 0' }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button style={S.btnSecondary} onClick={onBack}>Quay lại</button>
        </div>
      </div>
    </section>
  )
}

// Trang chính
export default function KiemTraPhieuThuPage() {
  const [view, setView] = useState('list') // 'list' | 'kiem-tra' | 'xem-chi-tiet'
  const [canKiemTra, setCanKiemTra] = useState([])
  const [lichSu, setLichSu] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchDanhSach = async (q = '') => {
    setLoading(true)
    try {
      const [resCanKiemTra, resLichSu] = await Promise.all([
        api.get('/phieu-thu/can-kiem-tra', { params: q ? { q } : {} }),
        api.get('/phieu-thu/lich-su-kiem-tra', { params: q ? { q } : {} }),
      ])
      setCanKiemTra(resCanKiemTra.data?.data || resCanKiemTra.data || [])
      setLichSu(resLichSu.data?.data || resLichSu.data || [])
    } catch {
      showToast('Không thể tải danh sách phiếu thu.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDanhSach() }, [])

  const handleTimKiem = () => {
    fetchDanhSach(search.trim())
  }

  const fetchDetail = async (maPhieuThu) => {
    setLoadingDetail(true)
    try {
      const res = await api.get(`/phieu-thu/${maPhieuThu}`)
      setDetail(res.data?.data || res.data)
    } catch {
      showToast('Không thể tải chi tiết phiếu thu.', 'error')
      setView('list')
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleMoKiemTra = (item) => {
    setSelected(item)
    setServerError('')
    setDetail(null)
    setView('kiem-tra')
    fetchDetail(item.maPhieuThu)
  }

  const handleXemChiTiet = (item) => {
    setSelected(item)
    setDetail(null)
    setView('xem-chi-tiet')
    fetchDetail(item.maPhieuThu)
  }

  const handleCapNhat = (item) => {
    showToast('Vui lòng chuyển sang chức năng "Cập nhật phiếu thu" để xử lý phiếu này.', 'error')
  }

  const handleLuuKetQua = async ({ trangThai, ghiChu }) => {
    if (!selected) return
    setSubmitting(true)
    setServerError('')
    try {
      await api.put(`/phieu-thu/${selected.maPhieuThu}/kiem-tra`, { trangThai, ghiChu })
      showToast(
        trangThai === 'Hợp lệ'
          ? 'Cập nhật trạng thái phiếu thu sang "Hợp lệ" thành công.'
          : 'Cập nhật trạng thái phiếu thu sang "Không hợp lệ" thành công.'
      )
      setView('list')
      fetchDanhSach(search)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Không thể lưu kết quả kiểm tra, vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  if (view === 'kiem-tra') {
    if (loadingDetail || !detail) {
      return <p style={S.emptyMsg}>Đang tải…</p>
    }
    return (
      <ChiTietKiemTraView
        detail={detail}
        onCancel={() => { setView('list'); setServerError('') }}
        onSubmit={handleLuuKetQua}
        submitting={submitting}
        serverError={serverError}
      />
    )
  }

  if (view === 'xem-chi-tiet') {
    if (loadingDetail || !detail) {
      return <p style={S.emptyMsg}>Đang tải…</p>
    }
    return <XemChiTietView detail={detail} onBack={() => setView('list')} />
  }

  return (
    <section>
      <div style={S.searchRow}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <div style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <IconSearch />
          </div>
          <input
            style={{ ...S.input, paddingLeft: '38px' }}
            placeholder="Nhập mã phiếu thu"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleTimKiem() }}
          />
        </div>
        <button style={S.btnSearch} onClick={handleTimKiem} disabled={loading}>
          Tìm kiếm
        </button>
      </div>

      <div style={{ marginBottom: '16px', marginTop: '16px' }}>
        <PageTitle title="Danh sách phiếu thu cần kiểm tra" description="Quản lý và đối soát các giao dịch thanh toán từ khách hàng." />
      </div>

      <div style={{ ...S.tableWrap, maxHeight: '35vh', overflowY: 'auto' }}>
        {loading ? (
          <p style={S.emptyMsg}>Đang tải…</p>
        ) : canKiemTra.length === 0 ? (
          <p style={S.emptyMsg}>Không có phiếu thu nào cần kiểm tra.</p>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>MÃ PHIẾU THU</th>
                <th style={S.th}>TÊN KHÁCH HÀNG</th>
                <th style={S.th}>NGÀY TẠO PHIẾU</th>
                <th style={S.th}>LOẠI PHIẾU THU</th>
                <th style={S.th}>TRẠNG THÁI</th>
                <th style={{ ...S.th, textAlign: 'center' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {canKiemTra.map(item => (
                <tr key={item.maPhieuThu} style={S.tr}>
                  <td style={S.td}><strong>{item.maPhieuThu}</strong></td>
                  <td style={S.td}>{item.tenKhachHang}</td>
                  <td style={S.td}>{item.ngayTaoPhieu}</td>
                  <td style={S.td}>{item.loaiPhieuThu}</td>
                  <td style={S.td}><StatusBadge status={item.trangThai} /></td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    <button style={S.btnAction} onClick={() => handleMoKiemTra(item)}>Kiểm tra</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginBottom: '16px', marginTop: '28px' }}>
        <PageTitle title="Lịch sử kiểm tra phiếu thu" description="Xem chi tiết các phiếu thu đã được kiểm tra." />
      </div>

      <div style={S.tableWrap}>
        {loading ? (
          <p style={S.emptyMsg}>Đang tải…</p>
        ) : lichSu.length === 0 ? (
          <p style={S.emptyMsg}>Chưa có phiếu thu nào được kiểm tra.</p>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>MÃ PHIẾU THU</th>
                <th style={S.th}>TÊN KHÁCH HÀNG</th>
                <th style={S.th}>NGÀY TẠO PHIẾU</th>
                <th style={S.th}>LOẠI PHIẾU THU</th>
                <th style={S.th}>TRẠNG THÁI</th>
                <th style={{ ...S.th, textAlign: 'center' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {lichSu.map(item => (
                <tr key={item.maPhieuThu} style={S.tr}>
                  <td style={S.td}><strong>{item.maPhieuThu}</strong></td>
                  <td style={S.td}>{item.tenKhachHang}</td>
                  <td style={S.td}>{item.ngayTaoPhieu}</td>
                  <td style={S.td}>{item.loaiPhieuThu}</td>
                  <td style={S.td}><StatusBadge status={item.trangThai} /></td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    {item.trangThai === 'Không hợp lệ' && LOAI_CAP_NHAT.includes(item.loaiPhieuThu) ? (
                      <button style={S.btnAction} onClick={() => handleCapNhat(item)}>Cập nhật</button>
                    ) : (
                      <button style={S.btnActionOutline} onClick={() => handleXemChiTiet(item)}>Xem chi tiết</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {toast && <div style={{ ...S.toast, ...(toast.type === 'error' ? S.toastError : S.toastSuccess) }}>{toast.msg}</div>}
    </section>
    )
  }

const S = {
  input: { width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '1.5px solid #dde3d8', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', color: '#1a1f14', outline: 'none', backgroundColor: '#fff' },
  tableWrap: { maxWidth: '100%', border: '1px solid #dde3d8', borderRadius: '10px', backgroundColor: '#fff', overflowX: 'auto' },
  table: { width: '100%', minWidth: '760px', borderCollapse: 'collapse', fontSize: '14px' },
  th: { padding: '12px 18px', textAlign: 'left', backgroundColor: '#fff', color: '#6b7560', fontWeight: 700, fontSize: '12px', letterSpacing: '0.4px', borderBottom: '1px solid #dde3d8', position: 'sticky', top: 0, zIndex: 1 },
  tr: { borderBottom: '1px solid #eef0eb' },
  td: { padding: '14px 18px', color: '#1a1f14', verticalAlign: 'middle' },
  emptyMsg: { textAlign: 'center', padding: '48px', color: '#9aa090', fontSize: '14px' },
  breadcrumb: { margin: '0 0 4px', fontSize: '13px', color: '#9aa090' },

  btnAction: { padding: '7px 16px', backgroundColor: '#3b4f27', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
  btnActionOutline: { padding: '7px 16px', backgroundColor: '#fff', color: '#3b4f27', border: '1.5px solid #3b4f27', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
  btnSecondary: { padding: '8px 20px', backgroundColor: '#fff', color: '#1a1f14', border: '1.5px solid #dde3d8', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  btnPrimary: { padding: '8px 20px', backgroundColor: '#3b4f27', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },

  badge: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '999px', fontSize: '12.5px', fontWeight: 700 },
  badgeDot: { width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block' },

  formCard: { maxWidth: '100%', backgroundColor: '#fff', border: '1px solid #dde3d8', borderRadius: '12px', padding: '24px 28px' },
  sectionHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' },
  sectionTitle: { margin: 0, fontSize: '15px', fontWeight: 700, color: '#1a1f14' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '18px' },
  infoLabel: { fontSize: '12px', color: '#9aa090', fontWeight: 600, marginBottom: '4px' },
  infoLabelSm: { fontSize: '12.5px', color: '#6b7560', fontWeight: 700, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.3px' },
  infoValue: { fontSize: '14.5px', color: '#1a1f14', fontWeight: 500 },
  infoValueMoney: { fontSize: '15px', color: '#2e7d32', fontWeight: 700 },
  searchRow: { display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'stretch', flexWrap: 'wrap' },
  btnSearch: { padding: '10px 20px', backgroundColor: '#3b4f27', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  khachHangBox: { marginTop: '20px', paddingTop: '18px', borderTop: '1px solid #eef0eb' },

  ketQuaRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
  ketQuaBtn: { flex: '1 1 200px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', border: '1.5px solid #dde3d8', borderRadius: '10px', backgroundColor: '#fff', color: '#6b7560', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' },
  ketQuaBtnHopLeActive: { borderColor: '#2e7d32', backgroundColor: '#e8f3e3', color: '#2e7d32' },
  ketQuaBtnKhongHopLeActive: { borderColor: '#c0392b', backgroundColor: '#fbe9e7', color: '#c0392b' },

  label: { display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#1a1f14', marginBottom: '7px' },
  textarea: { width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '1.5px solid #dde3d8', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', color: '#1a1f14', outline: 'none', resize: 'vertical' },
  textareaReadonly: { padding: '10px 14px', border: '1px solid #eef0eb', borderRadius: '8px', fontSize: '14px', color: '#1a1f14', backgroundColor: '#faf9f6' },
  errMsg: { margin: '10px 0 0', fontSize: '12.5px', color: '#c0392b' },

  toast: { position: 'fixed', top: '82px', right: '24px', maxWidth: 'calc(100vw - 48px)', overflowWrap: 'anywhere', padding: '12px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' },
  toastSuccess: { backgroundColor: '#2e7d32', color: '#fff' },
  toastError: { backgroundColor: '#c0392b', color: '#fff' },
}