import { useEffect, useMemo, useState } from 'react'
import PageTitle from '../../components/common/PageTitle.jsx'
import api from '../../services/api.js'

const API_BASE = '/cap-nhat-phieu-thu-ql'

const formatTien = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VNĐ`
const formatNgay = (value) => (value ? new Date(value).toLocaleDateString('vi-VN') : '')
const formatNgayGio = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleString('vi-VN', {
    hour12: false,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const pad = (number) => String(number).padStart(2, '0')
const toDateTimeLocalValue = (date = new Date()) => {
  const yyyy = date.getFullYear()
  const mm = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  const hh = pad(date.getHours())
  const mi = pad(date.getMinutes())
  const ss = pad(date.getSeconds())
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`
}

const isValidDateTimeLocal = (value) => {
  if (!value) return false
  const chosenDate = new Date(value)
  
  // Kiểm tra định dạng hợp lệ VÀ thời gian chọn phải nhỏ hơn hoặc bằng hiện tại
  return !Number.isNaN(chosenDate.getTime()) && chosenDate <= new Date()
}

const noiDungThanhToan = (pt) => {
  if (!pt) return ''
  if (pt.loaiPT === 'tra-phong') {
    return `Thanh toán phiếu thu trả phòng ${pt.maTP || pt.maLienKet || ''} - ${pt.tenKH || ''}`
  }
  return `Thanh toán phiếu thu bồi thường ${pt.maBT || pt.maLienKet || ''} - ${pt.tenKH || ''}`
}

function StatusBadge({ status }) {
  const style = {
    ...S.badge,
    ...(status === 'Đã thanh toán'
      ? S.badgeSuccess
      : status === 'Không hợp lệ'
        ? S.badgeDanger
        : S.badgePending),
  }

  return <span style={style}>{status || 'Chưa thanh toán'}</span>
}

function LoaiBadge({ loai }) {
  return <span style={S.typeBadge}>{loai || 'Phiếu thu'}</span>
}

function FormField({ label, value, strong }) {
  return (
    <div>
      <div style={S.fieldLabel}>{label}</div>
      <div style={{ ...S.fieldValue, ...(strong ? S.strongValue : {}) }}>{value || '-'}</div>
    </div>
  )
}

function SubHeader({ breadcrumb, title, description }) {
  return (
    <div style={S.subHeader}>
      <div style={S.breadcrumb}>{breadcrumb}</div>
      <h2 style={S.subTitle}>{title}</h2>
      <p style={S.subDesc}>{description}</p>
    </div>
  )
}

function PhieuThuTable({ title, description, rows, loading, actionLabel, onAction, emptyText, history, tuKhoa, setTuKhoa, onTimKiem }) {
  return (
    <section style={S.panel}>
      <div style={S.panelHead}>
      <div>
        <h3 style={S.panelTitle}>{title}</h3>
        <p style={S.panelDesc}>{description}</p>
      </div>
    </div>

    {!history && (
      <div style={S.searchPanel}>
        <input
          type="text"
          value={tuKhoa}
          onChange={(e) => setTuKhoa(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onTimKiem()
          }}
          placeholder="Nhập mã phiếu thu"
          style={S.searchInput}
        />
        <button style={S.btnPrimary} onClick={onTimKiem}>Tìm kiếm</button>
      </div>
    )}

      {loading ? (
        <p style={S.emptyMsg}>Đang tải dữ liệu...</p>
      ) : rows.length === 0 ? (
        <p style={S.emptyMsg}>{emptyText}</p>
      ) : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Mã phiếu thu</th>
                <th style={S.th}>Tên khách hàng</th>
                <th style={S.th}>{history ? 'Ngày thanh toán' : 'Ngày lập'}</th>
                <th style={S.th}>Loại phiếu thu</th>
                <th style={S.th}>Trạng thái</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((pt) => (
                <tr key={`${pt.loaiPT}-${pt.maPT}`}>
                  <td style={S.td}><b>{pt.maPT}</b></td>
                  <td style={S.td}>{pt.tenKH}</td>
                  <td style={S.td}>{history ? formatNgayGio(pt.ngayThanhToan) : formatNgay(pt.ngay)}</td>
                  <td style={S.td}><LoaiBadge loai={pt.tenLoaiPT} /></td>
                  <td style={S.td}><StatusBadge status={pt.trangThai} /></td>
                  <td style={{ ...S.td, textAlign: 'right' }}>
                    <button style={history ? S.btnGhostDark : S.btnPrimary} onClick={() => onAction(pt)}>
                      {actionLabel}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function DanhSachPhieuThu({
  dsCanCapNhat,
  lichSu,
  tuKhoa,
  setTuKhoa,
  loading,
  onTimKiem,
  onCapNhat,
  onXemChiTiet,
}) {
  return (
    <>
      

      <PhieuThuTable
      title="Danh sách phiếu thu cần cập nhật trạng thái"
      description="Quản lý và cập nhật trạng thái thanh toán cho phiếu thu trả phòng và phiếu thu bồi thường."
      rows={dsCanCapNhat}
      loading={loading}
      actionLabel="Cập nhật"
      onAction={onCapNhat}
      emptyText="Không có phiếu thu nào cần cập nhật."
      tuKhoa={tuKhoa}
      setTuKhoa={setTuKhoa}
      onTimKiem={onTimKiem}
    />
      <PhieuThuTable
        title="Lịch sử cập nhật phiếu thu"
        description="Xem chi tiết các phiếu thu bạn đã cập nhật trạng thái."
        rows={lichSu}
        loading={loading}
        actionLabel="Xem chi tiết"
        onAction={onXemChiTiet}
        emptyText="Bạn chưa xác nhận thanh toán phiếu thu nào."
        history
      />
    </>
  )
}

function ThongTinPhieuThu({ pt }) {
  const maLienKetLabel = pt.loaiPT === 'tra-phong' ? 'Mã hồ sơ trả phòng' : 'Mã bồi thường'

  return (
    <section style={S.panel}>
      <div style={S.detailHead}>
        <h3 style={S.panelTitle}>Thông Tin Phiếu Thu</h3>
        <StatusBadge status={pt.trangThai} />
      </div>

      <div style={S.divider} />

      <div style={S.detailGrid}>
        <FormField label="Mã phiếu thu" value={pt.maPT} strong />
        <FormField label="Loại phiếu thu" value={pt.tenLoaiPT} />
        <FormField label={maLienKetLabel} value={pt.maLienKet} />
        <FormField label="Tên khách hàng" value={pt.tenKH} />
        <FormField label="CCCD" value={pt.cccd} />
        <FormField label="Số điện thoại" value={pt.sdt} />
        <FormField label="Ngày lập phiếu" value={formatNgayGio(pt.ngay)} />
        <FormField label="Nhân viên kế toán" value={pt.tenNVKeToan || pt.maNVKeToan} />
      
      </div>

      <div style={S.payContent}>
        <div style={S.fieldLabel}>Nội dung thanh toán</div>
        <div style={S.fieldValue}>{noiDungThanhToan(pt)}</div>
      </div>

      {pt.loaiPT === 'tra-phong' && (
        <div style={S.moneyGrid}>
          <FormField label="Tiền hoàn cọc" value={formatTien(pt.tienHoanCoc)} />
          <FormField label="Tiền khấu trừ" value={formatTien(pt.tienKhauTru)} />
        </div>
      )}

      <div style={S.totalRow}>
        <span>Tổng tiền thanh toán</span>
        <b style={S.totalAmount}>{formatTien(pt.tongTien)}</b>
      </div>
    </section>
  )
}

function KhungXacNhan({
  pt,
  ngayThanhToan,
  setNgayThanhToan,
  saving,
  onHuy,
  onXacNhan,
}) {
  const laKhongHopLe = pt.trangThai === 'Không hợp lệ'

  return (
    <section style={S.panel}>
      <h3 style={S.panelTitle}>Xác Nhận Thanh Toán</h3>
      <p style={laKhongHopLe ? S.invalidText : S.pendingText}>
        {laKhongHopLe
          ? 'Phiếu thu hiện tại đang ở trạng thái KHÔNG HỢP LỆ'
          : 'Phiếu thu hiện tại đang ở trạng thái CHƯA THANH TOÁN'}
      </p>

      {pt.ghiChu && (
        <div style={S.noteBox}>
          <span style={S.noteTag}>Ghi chú lý do</span>
          <p>{pt.ghiChu}</p>
        </div>
      )}

      <div style={S.inputGroup}>
        <label style={S.fieldLabel} htmlFor="ngayThanhToan">Thời điểm thanh toán do quản lý ghi nhận</label>
        <input
          id="ngayThanhToan"
          type="datetime-local"
          step="1"
          value={ngayThanhToan}
          onChange={(e) => setNgayThanhToan(e.target.value)}
          style={S.dateInput}
        />
      </div>

      <div style={S.footerActions}>
        <button style={S.btnOutline} onClick={onHuy} disabled={saving}>Hủy</button>
        <button style={S.btnPrimary} onClick={onXacNhan} disabled={saving}>
          {saving ? 'Đang cập nhật...' : 'Xác nhận thanh toán'}
        </button>
      </div>
    </section>
  )
}

function ChiTietSauCapNhat({ pt, onQuayLai }) {
  return (
    <>
      <ThongTinPhieuThu pt={pt} />

      <section style={S.panel}>
        <h3 style={S.panelTitle}>Xác Nhận Thanh Toán</h3>
        <p style={S.successText}>Phiếu thu hiện tại đang ở trạng thái ĐÃ THANH TOÁN</p>

        {pt.ghiChu && (
          <div style={S.noteBox}>
            <span style={S.noteTag}>Ghi chú lý do</span>
            <p>{pt.ghiChu}</p>
          </div>
        )}

        <div style={S.footerActions}>
          <button style={S.btnPrimary} onClick={onQuayLai}>Quay lại</button>
        </div>
      </section>
    </>
  )
}

export default function CapNhatPhieuThuPage() {
  const [view, setView] = useState('list')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tuKhoa, setTuKhoa] = useState('')
  const [dsCanCapNhat, setDsCanCapNhat] = useState([])
  const [lichSu, setLichSu] = useState([])
  const [chiTietPT, setChiTietPT] = useState(null)
  const [ngayThanhToan, setNgayThanhToan] = useState(toDateTimeLocalValue())

  const pageTitle = useMemo(() => {
    if (view === 'update') return 'Cập Nhật Trạng Thái Phiếu Thu'
    if (view === 'detail') return 'Cập Nhật Trạng Thái Phiếu Thu'
    return 'Cập nhật trạng thái phiếu thu'
  }, [view])

  const taiDanhSach = async (tuKhoaHienTai = tuKhoa) => {
    setLoading(true)
    try {
      const params = tuKhoaHienTai ? { tuKhoa: tuKhoaHienTai } : {}
      const [resCanCapNhat, resLichSu] = await Promise.all([
        api.get(`${API_BASE}/can-cap-nhat`, { params }),
        api.get(`${API_BASE}/lich-su`),
      ])

      setDsCanCapNhat(resCanCapNhat.data?.data || [])
      setLichSu(resLichSu.data?.data || [])
    } catch (err) {
      alert(err?.response?.data?.message || 'Không thể tải danh sách phiếu thu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (view !== 'list') return
    const delay = tuKhoa ? 350 : 0
    const timer = setTimeout(() => taiDanhSach(tuKhoa), delay)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, tuKhoa])

  const loadChiTiet = async (pt) => {
    const res = await api.get(`${API_BASE}/${pt.loaiPT}/${pt.maPT}`)
    return res.data?.data
  }

  const handleCapNhat = async (pt) => {
    try {
      const data = await loadChiTiet(pt)
      setChiTietPT(data)
      setNgayThanhToan(toDateTimeLocalValue())
      setView('update')
    } catch (err) {
      alert(err?.response?.data?.message || 'Không thể tải chi tiết phiếu thu.')
      taiDanhSach(tuKhoa)
    }
  }

  const handleXemChiTiet = async (pt) => {
    try {
      const data = await loadChiTiet(pt)
      setChiTietPT(data)
      setView('detail')
    } catch (err) {
      alert(err?.response?.data?.message || 'Không thể tải chi tiết phiếu thu.')
    }
  }

  const handleXacNhanThanhToan = async () => {
    if (!ngayThanhToan) {
      alert('Vui lòng nhập thời điểm thanh toán.')
      return
    }
    if (new Date(ngayThanhToan) > new Date()) {
    alert('Thời điểm thanh toán không thể lớn hơn thời gian hiện tại.')
    return
  }
    if (!isValidDateTimeLocal(ngayThanhToan)) {
      alert('Thời điểm thanh toán không hợp lệ.')
      return
    }
    const thoiDiemChon = new Date(ngayThanhToan).getTime()

    // 1. Kiểm tra so với ngày lập phiếu
    if (chiTietPT?.ngay) {
      const ngayLapPhieu = new Date(chiTietPT.ngay).getTime()
      if (thoiDiemChon <= ngayLapPhieu) {
        alert('Thời điểm thanh toán phải lớn hơn ngày lập phiếu.')
        return
      }
    }

    // 2. Kiểm tra so với thời điểm thanh toán cũ (nếu có và không null)
    if (chiTietPT?.ngayThanhToan) {
      const ngayThanhToanCu = new Date(chiTietPT.ngayThanhToan).getTime()
      if (thoiDiemChon <= ngayThanhToanCu) {
        alert('Thời điểm thanh toán mới phải lớn hơn thời điểm thanh toán cũ.')
        return
      }
    }
    setSaving(true)
    try {
      await api.patch(`${API_BASE}/${chiTietPT.loaiPT}/${chiTietPT.maPT}/xac-nhan-thanh-toan`, {
        ngayThanhToan,
      })
      alert('Cập nhật trạng thái phiếu thu thành công.')
      await taiDanhSach(tuKhoa)
      setView('list')
    } catch (err) {
      alert(err?.response?.data?.message || 'Không thể cập nhật trạng thái phiếu thu.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section>
      {view === 'list' ? (
        <div style={S.titleWrap}>
          <PageTitle
            title={pageTitle}
            description="Quản lý xác nhận thanh toán cho phiếu thu trả phòng và phiếu thu bồi thường."
          />
        </div>
      ) : (
        <SubHeader
          breadcrumb={view === 'update' ? 'Chọn phiếu thu / Cập nhật trạng thái phiếu thu' : 'Chọn phiếu thu / Xem chi tiết trạng thái phiếu thu sau cập nhật'}
          title={pageTitle}
          description="Chi tiết phiếu thu và cập nhật trạng thái phiếu thu."
        />
      )}

      {view === 'list' && (
        <DanhSachPhieuThu
          dsCanCapNhat={dsCanCapNhat}
          lichSu={lichSu}
          tuKhoa={tuKhoa}
          setTuKhoa={setTuKhoa}
          loading={loading}
          onTimKiem={() => taiDanhSach(tuKhoa)}
          onCapNhat={handleCapNhat}
          onXemChiTiet={handleXemChiTiet}
        />
      )}

      {view === 'update' && chiTietPT && (
        <>
          <ThongTinPhieuThu pt={chiTietPT} />
          <KhungXacNhan
            pt={chiTietPT}
            ngayThanhToan={ngayThanhToan}
            setNgayThanhToan={setNgayThanhToan}
            saving={saving}
            onHuy={() => setView('list')}
            onXacNhan={handleXacNhanThanhToan}
          />
        </>
      )}

      {view === 'detail' && chiTietPT && (
        <ChiTietSauCapNhat pt={chiTietPT} onQuayLai={() => setView('list')} />
      )}
    </section>
  )
}

const S = {
  titleWrap: {
    marginBottom: '20px',
  },
  subHeader: {
    marginBottom: '18px',
  },
  breadcrumb: {
    color: '#7a8371',
    fontSize: '13px',
    marginBottom: '6px',
  },
  subTitle: {
    margin: 0,
    color: '#1b1f17',
    fontSize: '28px',
    lineHeight: 1.2,
    fontWeight: 800,
  },
  subDesc: {
    margin: '6px 0 0',
    color: '#66705d',
    fontSize: '14px',
  },
  searchPanel: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '12px',
    backgroundColor: '#f8faf6',
    border: '1px solid #dfe5da',
    borderRadius: '6px',
    padding: '14px',
    margin: '16px 0 18px',
  },
  searchInput: {
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    border: '1px solid #d7ded1',
    borderRadius: '6px',
    padding: '11px 13px',
    outline: 'none',
    fontSize: '14px',
  },
  panel: {
    backgroundColor: '#fff',
    border: '1px solid #dfe5da',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
  },
  panelHead: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '14px',
  },
  panelTitle: {
    margin: 0,
    color: '#314120',
    fontSize: '18px',
    fontWeight: 800,
  },
  panelDesc: {
    margin: '6px 0 0',
    color: '#687260',
    fontSize: '14px',
  },
  tableWrap: {
    overflowX: 'auto',
    border: '1px solid #dfe5da',
    borderRadius: '6px',
  },
  totalAmount: {
  color: '#c0392b',
  fontSize: '24px',
  lineHeight: 1.2,
  fontWeight: 900,
  whiteSpace: 'nowrap',
},
  table: {
    width: '100%',
    minWidth: '760px',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    textAlign: 'left',
    padding: '12px 14px',
    backgroundColor: '#f4f5f1',
    color: '#4f5946',
    fontWeight: 800,
    borderBottom: '1px solid #dfe5da',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '13px 14px',
    borderBottom: '1px solid #edf0e8',
    color: '#252a20',
    verticalAlign: 'middle',
  },
  emptyMsg: {
    margin: 0,
    padding: '22px',
    color: '#66705d',
    textAlign: 'center',
    backgroundColor: '#f8faf6',
    borderRadius: '6px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: '24px',
    padding: '3px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },
  badgePending: {
    color: '#4d5e3d',
    backgroundColor: '#dfe8d5',
  },
  badgeDanger: {
    color: '#a53b33',
    backgroundColor: '#f9d8d5',
  },
  badgeSuccess: {
    color: '#3f6c35',
    backgroundColor: '#dcecd5',
  },
  typeBadge: {
    display: 'inline-flex',
    padding: '3px 9px',
    borderRadius: '999px',
    color: '#4d5e3d',
    backgroundColor: '#eef2ea',
    fontSize: '12px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  btnPrimary: {
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#314b23',
    color: '#fff',
    padding: '10px 16px',
    fontWeight: 800,
    fontSize: '14px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  btnGhostDark: {
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#314b23',
    color: '#fff',
    padding: '8px 12px',
    fontWeight: 800,
    fontSize: '13px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  btnOutline: {
    border: '1px solid #aab5a3',
    borderRadius: '6px',
    backgroundColor: '#fff',
    color: '#27311f',
    padding: '10px 16px',
    fontWeight: 800,
    fontSize: '14px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  detailHead: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '14px',
    alignItems: 'center',
  },
  divider: {
    height: '1px',
    backgroundColor: '#dfe5da',
    margin: '14px 0 18px',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: '18px 28px',
  },
  moneyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: '18px 28px',
    marginTop: '18px',
  },
  fieldLabel: {
    color: '#66705d',
    fontSize: '12px',
    fontWeight: 800,
    textTransform: 'uppercase',
    marginBottom: '5px',
  },
  fieldValue: {
    color: '#1f251b',
    fontSize: '14px',
    fontWeight: 700,
    overflowWrap: 'anywhere',
  },
  strongValue: {
    fontSize: '15px',
    color: '#121710',
  },
  payContent: {
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid #edf0e8',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '14px',
    marginTop: '18px',
    paddingTop: '16px',
    borderTop: '1px solid #edf0e8',
    color: '#314120',
    fontSize: '16px',
    fontWeight: 800,
  },
  invalidText: {
    margin: '12px 0',
    color: '#c0392b',
    fontWeight: 800,
  },
  pendingText: {
    margin: '12px 0',
    color: '#8a6b12',
    fontWeight: 800,
  },
  successText: {
    margin: '12px 0',
    color: '#2f7d3b',
    fontWeight: 800,
  },
  noteBox: {
    backgroundColor: '#f4f3eb',
    border: '1px solid #dedbc8',
    borderRadius: '6px',
    padding: '12px 14px',
    marginBottom: '16px',
    color: '#30351f',
  },
  noteTag: {
    display: 'inline-flex',
    padding: '3px 8px',
    borderRadius: '999px',
    color: '#a53b33',
    backgroundColor: '#f9d8d5',
    fontSize: '12px',
    fontWeight: 800,
    marginBottom: '8px',
  },
  inputGroup: {
    marginTop: '16px',
  },
  dateInput: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid #cfd8c8',
    borderRadius: '6px',
    padding: '11px 13px',
    color: '#1f251b',
    fontSize: '14px',
    fontWeight: 700,
  },
  footerActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    borderTop: '1px solid #dfe5da',
    marginTop: '22px',
    paddingTop: '16px',
  },
}
