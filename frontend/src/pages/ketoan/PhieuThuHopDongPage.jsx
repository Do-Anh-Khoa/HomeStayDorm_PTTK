import { useEffect, useState } from 'react'
import PageTitle from '../../components/common/PageTitle.jsx'
import api from '../../services/api.js'
import { getStoredUser } from '../../services/authSession.js'

const formatTien = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'
const formatNgay = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '')
const formatGio = (d) => (d ? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '')

// ==========================================
// COMPONENT DÙNG CHUNG
// ==========================================
function SubHeader({ title }) {
  return (
    <div style={S.subHeader}>
      <h2 style={S.subHeaderTitle}>{title}</h2>
    </div>
  )
}

function FormField({ label, value, highlight }) {
  return (
    <div style={S.fieldContainer}>
      <div style={S.fieldLabel}>{label}</div>
      <div style={{ ...S.fieldValue, ...(highlight ? { color: '#c0392b', fontWeight: 700 } : {}) }}>
        {value || '—'}
      </div>
    </div>
  )
}

// Bảng chi tiết giường thuê & tính toán (Dùng chung cho Form và Detail)
function BangGiuongThue({ dsGiuong, kyTT, tongTien }) {
  return (
    <div style={S.tableWrapper}>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>MÃ GIƯỜNG</th>
            <th style={S.th}>MÃ PHÒNG</th>
            <th style={{ ...S.th, textAlign: 'right' }}>GIÁ THUÊ/THÁNG</th>
            <th style={{ ...S.th, textAlign: 'center' }}>SỐ THÁNG THU</th>
            <th style={{ ...S.th, textAlign: 'right' }}>THÀNH TIỀN</th>
          </tr>
        </thead>
        <tbody>
          {(dsGiuong || []).map((g) => (
            <tr key={`${g.maPhong}-${g.maGiuong}`} style={S.tr}>
              <td style={S.td}>{g.maGiuong}</td>
              <td style={S.td}>{g.maPhong}</td>
              <td style={{ ...S.td, textAlign: 'right' }}>{formatTien(g.giaGiuong)}</td>
              <td style={{ ...S.td, textAlign: 'center' }}>
                x {g.soThangThu != null ? g.soThangThu : kyTT}
                {g.soNgayThu != null && (
                  <div style={S.hintNho}>(kỳ cuối · {g.soNgayThu} ngày)</div>
                )}
              </td>
              <td style={{ ...S.td, fontWeight: 700, textAlign: 'right' }}>{formatTien(g.thanhTien)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={S.tongTienBox}>
        <span style={S.tongTienLabel}>TỔNG TIỀN CẦN THU:</span>
        <span style={S.tongTienValue}>{formatTien(tongTien)}</span>
      </div>
    </div>
  )
}

// ==========================================
// MÀN HÌNH 1: DANH SÁCH
// ==========================================
function DanhSachHDCanLap({ dsChoLap, dsDaLap, tuKhoa, setTuKhoa, loading, onChonLap, onXemChiTiet }) {
  const phieuMoiNhat = dsDaLap.length > 0
    ? dsDaLap.reduce((moi, pt) => (new Date(pt.ngay) > new Date(moi.ngay) ? pt : moi), dsDaLap[0])
    : null

  return (
    <>
      {/* Khối 1: Tìm kiếm & Rà soát */}
      <div style={S.card}>
        <div style={S.searchBox}>
          <span style={S.searchIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
          <input
            type="text"
            placeholder="Tìm theo MaHDT, CCCD khách hàng..."
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            style={S.searchInput}
          />
        </div>

        {loading ? (
          <p style={S.emptyMsg}>Đang tải dữ liệu...</p>
        ) : (
          <div style={S.tableWrapper}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>MÃ HĐ</th>
                  <th style={S.th}>PHÒNG/GIƯỜNG</th>
                  <th style={{ ...S.th, textAlign: 'center' }}>KỲ TT</th>
                  <th style={{ ...S.th, textAlign: 'center' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {dsChoLap.length === 0 ? (
                  <tr><td colSpan="4" style={S.emptyMsg}>Không có hợp đồng nào đến hạn lập phiếu thu.</td></tr>
                ) : (
                  dsChoLap.map((hd) => (
                    <tr key={hd.maHDT} style={S.tr}>
                      <td style={S.td}><b>{hd.maHDT}</b></td>
                      <td style={S.td}>{hd.nhanPhongGiuong}</td>
                      <td style={{ ...S.td, textAlign: 'center' }}>{hd.kyTT}<br/><span style={S.hintNho}>tháng</span></td>
                      <td style={{ ...S.td, textAlign: 'center' }}>
                        <button style={S.btnAction} onClick={() => onChonLap(hd.maHDT)}>
                          <span style={S.plusIcon}>+</span> Lập Phiếu Thu
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {/* Thanh phân trang UI */}
            {dsChoLap.length > 0 && (
              <div style={S.pagination}>
                <span style={S.pageText}>Hiển thị 1 - {dsChoLap.length} của {dsChoLap.length} hợp đồng đến hạn</span>
                <div style={S.pageControls}>
                  <button style={S.pageBtnDisabled}>{'<'}</button>
                  <button style={S.pageBtnActive}>1</button>
                  <button style={S.pageBtn}>2</button>
                  <button style={S.pageBtn}>{'>'}</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Khối 2: Danh sách đã lập hôm nay */}
      <div style={S.sectionHeaderRow}>
        <h3 style={S.sectionTitle}>Danh sách PT Hợp đồng đã lập hôm nay</h3>
        {phieuMoiNhat && (
          <span style={S.updateBadge}>CẬP NHẬT LÚC {formatGio(new Date(phieuMoiNhat.ngay))}</span>
        )}
      </div>

      <div style={S.card}>
        <div style={S.tableWrapper}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>MÃ PHIẾU THU</th>
                <th style={S.th}>MÃ HĐ</th>
                <th style={S.th}>NGÀY LẬP</th>
                <th style={S.th}>TỔNG TIỀN</th>
                <th style={{ ...S.th, textAlign: 'center' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {dsDaLap.length === 0 ? (
                <tr><td colSpan="5" style={S.emptyMsg}>Bạn chưa lập phiếu thu hợp đồng nào hôm nay.</td></tr>
              ) : (
                dsDaLap.map((pt) => (
                  <tr key={pt.maPTHD} style={S.tr}>
                    <td style={S.td}><b>{pt.maPTHD}</b></td>
                    <td style={S.td}>{pt.maHDT}</td>
                    <td style={S.td}>{formatNgay(pt.ngay)}</td>
                    <td style={{ ...S.td, fontWeight: 700 }}>{formatTien(pt.tongTien)}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <button style={S.iconBtn} onClick={() => onXemChiTiet(pt.maPTHD)} title="Xem chi tiết">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7560" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// ==========================================
// MÀN HÌNH 2: FORM LẬP PHIẾU
// ==========================================
function BieuMauLapPTHD({ thongTin, saving, errorMsg, onHuy, onTao }) {
  return (
    <div style={S.formContainer}>
      <SubHeader title="Lập Phiếu Thu Hợp Đồng" />

      <div style={S.cardNoPadding}>
        {errorMsg && <div style={{ padding: '20px' }}><p style={S.errMsg}>⚠ {errorMsg}</p></div>}

        <div style={S.formSection}>
          <div style={S.formSectionTitle}>THÔNG TIN KHÁCH HÀNG & HỢP ĐỒNG</div>
          <div style={S.formGrid}>
            <FormField label="Đại diện thuê" value={thongTin.tenKH} />
            <FormField label="Mã Hợp Đồng" value={thongTin.maHDT} />
            <FormField label="CCCD" value={thongTin.cccd} />
            <FormField label="Ngày vào ở" value={formatNgay(thongTin.tgVao)} />
            <FormField label="SĐT" value={thongTin.sdt} />
            <FormField label="Kỳ thanh toán" value={`${thongTin.kyTT} Tháng/Lần`} />
          </div>
          <div style={S.dashedDivider}></div>
          <div>
            <div style={S.fieldLabel}>Kỳ đang thu</div>
            <div style={S.fieldValue}>
              <b>Kỳ {thongTin.kyHienTai} (Ngày mốc: {formatNgay(thongTin.ngayMoc)})</b>
              {thongTin.laKyCuoi && <span style={S.badgeCuoiKy}>Kỳ cuối hợp đồng</span>}
            </div>
          </div>
        </div>

        <div style={S.formSection}>
          <div style={S.formSectionTitle}>CHI TIẾT GIƯỜNG THUÊ & TÍNH TOÁN</div>
          <BangGiuongThue dsGiuong={thongTin.dsGiuong} kyTT={thongTin.kyTT} tongTien={thongTin.tongTien} />
        </div>

        <div style={S.formSection}>
          <div style={S.formSectionTitle}>THÔNG TIN CHỨNG TỪ</div>
          <div style={S.formGrid}>
            <div>
              <div style={S.fieldLabel}>Nhân viên Kế toán</div>
              <input type="text" value={thongTin.tenNVKeToan || ''} disabled style={S.inputDisabled} />
            </div>
            <div>
              <div style={S.fieldLabel}>Ngày lập phiếu</div>
              <input type="text" value={formatNgay(new Date())} disabled style={S.inputDisabled} />
            </div>
          </div>
          
          <div style={{ marginTop: '24px' }}>
            <div style={S.fieldLabel}>Trạng thái phiếu thu</div>
            <span style={S.badgeWarning}>Chưa thanh toán</span>
          </div>
          <div style={{ marginTop: '24px' }}>
             <span style={S.textNote}>Hệ thống tự động gửi Email đến Khách hàng</span>
          </div>
        </div>

        <div style={S.formFooter}>
          <button style={S.btnGhost} onClick={onHuy} disabled={saving}>Hủy bỏ</button>
          <button style={S.btnPrimaryLarge} onClick={onTao} disabled={saving}>
            <span style={{ marginRight: '6px' }}>🖨</span> {saving ? 'Đang tạo...' : 'Tạo & In Phiếu Thu'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// MÀN HÌNH 3: XEM CHI TIẾT
// ==========================================
function ChiTietPTHD({ pt, onQuayLai, onIn, printing }) {
  return (
    <div style={S.formContainer}>
      <SubHeader title={`Mã phiếu thu: ${pt.maPTHD}`} />

      <div style={S.cardNoPadding}>
        <div style={S.formSection}>
          <div style={S.formSectionTitle}>THÔNG TIN KHÁCH HÀNG & HỢP ĐỒNG</div>
          <div style={S.formGrid}>
            <FormField label="Đại diện thuê" value={pt.tenKH} />
            <FormField label="Mã Hợp Đồng" value={pt.maHDT} />
            <FormField label="CCCD" value={pt.cccd} />
            <FormField label="Ngày vào ở" value={formatNgay(pt.tgVao)} />
            <FormField label="SĐT" value={pt.sdt} />
            <FormField label="Kỳ thanh toán" value={`${pt.kyTT} Tháng/Lần`} />
          </div>
        </div>

        <div style={S.formSection}>
          <div style={S.formSectionTitle}>CHI TIẾT GIƯỜNG THUÊ & TÍNH TOÁN</div>
          <BangGiuongThue dsGiuong={pt.dsGiuong} kyTT={pt.kyTT} tongTien={pt.tongTien} />
        </div>

        <div style={S.formSection}>
          <div style={S.formSectionTitle}>THÔNG TIN CHỨNG TỪ</div>
          <div style={S.formGrid}>
             <div>
              <div style={S.fieldLabel}>Nhân viên Kế toán</div>
              <input type="text" value={pt.tenNVKeToan || ''} disabled style={S.inputDisabled} />
            </div>
            <div>
              <div style={S.fieldLabel}>Ngày lập phiếu</div>
              <input type="text" value={formatNgay(pt.ngay)} disabled style={S.inputDisabled} />
            </div>
          </div>
        </div>

        <div style={S.formFooterLeft}>
          <button style={S.btnGhost} onClick={onQuayLai}>Quay lại</button>
          <button style={S.btnPrimaryLarge} onClick={onIn} disabled={printing}>
             <span style={{ marginRight: '6px' }}>📄</span> {printing ? 'Đang xuất PDF...' : 'In phiếu thu'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// TRANG CHÍNH (PAGE COMPONENT)
// ==========================================
export default function PhieuThuHopDongPage() {
  const user = getStoredUser()
  const [view, setView] = useState('list') 
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [tuKhoa, setTuKhoa] = useState('')

  const [dsChoLap, setDsChoLap] = useState([])
  const [dsDaLap, setDsDaLap] = useState([])
  const [thongTinLap, setThongTinLap] = useState(null)
  const [chiTietPT, setChiTietPT] = useState(null)

  const taiDanhSach = async (tuKhoaHienTai) => {
    setLoading(true)
    try {
      const [resChoLap, resDaLap] = await Promise.all([
        api.get('/phieu-thu-hop-dong/cho-xu-ly', { params: tuKhoaHienTai ? { tuKhoa: tuKhoaHienTai } : {} }),
        api.get('/phieu-thu-hop-dong/da-lap-hom-nay'),
      ])
      setDsChoLap(resChoLap.data?.data || [])
      setDsDaLap(resDaLap.data?.data || [])
    } catch (err) {
      console.error('Lỗi tải danh sách PT hợp đồng:', err?.response?.data || err?.message)
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

  const handleChonLap = async (maHDT) => {
    setErrorMsg('')
    try {
      const res = await api.get(`/phieu-thu-hop-dong/lap/${maHDT}`)
      setThongTinLap({ ...res.data.data, tenNVKeToan: user?.ten_nv || user?.tenNV })
      setView('form')
    } catch (err) {
      alert(err?.response?.data?.message || 'Không thể tải thông tin hợp đồng.')
      taiDanhSach(tuKhoa)
    }
  }

  const handleTaoPhieu = async () => {
    setSaving(true)
    setErrorMsg('')
    try {
      const res = await api.post('/phieu-thu-hop-dong/lap', { maHDT: thongTinLap.maHDT })
      const pthdMoi = res.data?.data
      if (res.data?.warning) alert(res.data.warning)

      if (pthdMoi?.maPTHD) {
        try {
          const pdfRes = await api.get(`/phieu-thu-hop-dong/${pthdMoi.maPTHD}/pdf`, { responseType: 'blob' })
          const url = window.URL.createObjectURL(new Blob([pdfRes.data]))
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', `${pthdMoi.maPTHD}.pdf`)
          document.body.appendChild(link)
          link.click()
          link.remove()
        } catch (pdfErr) {
          console.error('Xuất PDF thất bại:', pdfErr)
          alert('Tạo phiếu thu thành công nhưng xuất file PDF thất bại. Bạn có thể in lại sau.')
        }
      }
      await taiDanhSach(tuKhoa)
      setView('list')
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Không thể tạo phiếu thu hợp đồng.')
      if (err?.response?.status === 409) setTimeout(() => setView('list'), 1500)
    } finally {
      setSaving(false)
    }
  }

  const handleXemChiTiet = async (maPTHD) => {
    try {
      const res = await api.get(`/phieu-thu-hop-dong/${maPTHD}`)
      setChiTietPT(res.data.data)
      setView('detail')
    } catch (err) {
      alert(err?.response?.data?.message || 'Không thể tải chi tiết phiếu thu.')
    }
  }

  const handleInPhieu = async () => {
    setPrinting(true)
    try {
      const res = await api.get(`/phieu-thu-hop-dong/${chiTietPT.maPTHD}/pdf`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${chiTietPT.maPTHD}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      alert('Không thể xuất file PDF.')
    } finally {
      setPrinting(false)
    }
  }

  return (
    <section style={{ backgroundColor: '#f9faf8', minHeight: '100vh', paddingBottom: '40px' }}>
      {view === 'list' && (
        <div style={{ marginBottom: '24px' }}>
          <PageTitle
            title="Lập Phiếu Thu Hợp Đồng"
            description='Rà soát các hợp đồng thuê thỏa mãn điều kiện "Ngày hiện tại ≥ Ngày mốc chuẩn" để lập phiếu thu.'
          />
        </div>
      )}

      {view === 'list' && (
        <DanhSachHDCanLap
          dsChoLap={dsChoLap}
          dsDaLap={dsDaLap}
          tuKhoa={tuKhoa}
          setTuKhoa={setTuKhoa}
          loading={loading}
          onChonLap={handleChonLap}
          onXemChiTiet={handleXemChiTiet}
        />
      )}

      {view === 'form' && thongTinLap && (
        <BieuMauLapPTHD
          thongTin={thongTinLap}
          saving={saving}
          errorMsg={errorMsg}
          onHuy={() => setView('list')}
          onTao={handleTaoPhieu}
        />
      )}

      {view === 'detail' && chiTietPT && (
        <ChiTietPTHD
          pt={chiTietPT}
          onQuayLai={() => setView('list')}
          onIn={handleInPhieu}
          printing={printing}
        />
      )}
    </section>
  )
}

// ==========================================
// STYLES DỰA TRÊN MOCKUP FIGMA
// ==========================================
const S = {
  // Bố cục chung
  subHeader: { marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e0e5db' },
  subHeaderTitle: { margin: 0, fontSize: '24px', fontWeight: 800, color: '#1a1f14' },
  formContainer: { maxWidth: '900px', margin: '0' },
  
  // Cards & Boxes
  card: {
    backgroundColor: '#fff', border: '1px solid #e5e9e1', borderRadius: '12px',
    padding: '24px', boxShadow: '0 2px 6px rgba(20, 30, 10, 0.03)', marginBottom: '24px'
  },
  cardNoPadding: {
    backgroundColor: '#fff', border: '1px solid #e5e9e1', borderRadius: '12px',
    boxShadow: '0 2px 6px rgba(20, 30, 10, 0.03)', overflow: 'hidden'
  },
  
  // Typography
  sectionHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '32px 0 16px' },
  sectionTitle: { margin: 0, fontSize: '18px', fontWeight: 700, color: '#1a1f14' },
  
  // Search
  searchBox: { position: 'relative', marginBottom: '20px', maxWidth: '400px' },
  searchIcon: { position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9aa090', display: 'flex' },
  searchInput: {
    width: '100%', padding: '12px 16px 12px 42px', borderRadius: '6px',
    border: '1px solid #dde3d8', fontSize: '14px', outline: 'none', color: '#1a1f14'
  },

  // Tables
  tableWrapper: { border: '1px solid #eef0ea', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fafbf9' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: {
    textAlign: 'left', padding: '14px 16px', borderBottom: '1px solid #eef0ea',
    backgroundColor: '#f4f6f0', color: '#6b7560', fontWeight: 700, fontSize: '12px', letterSpacing: '0.5px'
  },
  tr: { backgroundColor: '#fff', borderBottom: '1px solid #eef0ea' },
  td: { padding: '16px', color: '#1a1f14', verticalAlign: 'middle' },
  
  // Pagination
  pagination: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px', backgroundColor: '#fafbf9', borderTop: '1px solid #eef0ea'
  },
  pageText: { fontSize: '12px', color: '#6b7560' },
  pageControls: { display: 'flex', gap: '6px' },
  pageBtn: { padding: '4px 10px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#1a1f14', fontSize: '13px' },
  pageBtnActive: { padding: '4px 10px', border: 'none', background: '#4a5c39', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
  pageBtnDisabled: { padding: '4px 10px', border: 'none', background: 'transparent', color: '#ccc', cursor: 'not-allowed', fontSize: '13px' },

  // Form Sections
  formSection: { padding: '24px 32px', borderBottom: '1px solid #eef0ea', backgroundColor: '#fff' },
  formSectionTitle: {
    fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px',
    color: '#6b7560', marginBottom: '24px'
  },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' },
  
  fieldContainer: { display: 'flex', flexDirection: 'column', gap: '6px' },
  fieldLabel: { fontSize: '13px', color: '#6b7560' },
  fieldValue: { fontSize: '15px', color: '#1a1f14', fontWeight: 500 },
  inputDisabled: {
    padding: '10px 12px', borderRadius: '6px', border: '1px solid #e5e9e1',
    backgroundColor: '#f4f6f0', color: '#1a1f14', fontSize: '14px', width: '100%', boxSizing: 'border-box'
  },
  dashedDivider: { borderTop: '1px dashed #dde3d8', margin: '24px 0' },

  // Totals & Badges
  tongTienBox: {
    display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '24px',
    padding: '16px 24px', backgroundColor: '#f4f6f0', borderTop: '1px solid #eef0ea'
  },
  tongTienLabel: { fontSize: '13px', fontWeight: 700, color: '#6b7560' },
  tongTienValue: { fontSize: '24px', color: '#c0392b', fontWeight: 800 },
  
  badgeWarning: {
    display: 'inline-block', padding: '4px 12px', borderRadius: '4px',
    backgroundColor: '#fff4e5', color: '#b7791f', fontSize: '13px', fontWeight: 600, border: '1px solid #fde5c8'
  },
  badgeCuoiKy: {
    display: 'inline-block', marginLeft: '12px', padding: '2px 8px', borderRadius: '4px',
    backgroundColor: '#fdecea', color: '#c0392b', fontSize: '12px', fontWeight: 600,
  },
  updateBadge: {
    padding: '6px 16px', borderRadius: '20px', backgroundColor: '#4a5c39',
    color: '#fff', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px'
  },
  textNote: { fontSize: '13px', color: '#1a1f14' },

  // Buttons
  btnAction: {
    padding: '8px 16px', borderRadius: '6px', border: 'none',
    backgroundColor: '#4a5c39', color: '#fff', fontWeight: 600,
    fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px'
  },
  plusIcon: {
    display: 'inline-flex', justifyContent: 'center', alignItems: 'center',
    width: '16px', height: '16px', border: '1px solid #fff', borderRadius: '50%', fontSize: '14px', lineHeight: 1
  },
  btnPrimaryLarge: {
    padding: '10px 24px', borderRadius: '6px', border: 'none',
    backgroundColor: '#4a5c39', color: '#fff', fontWeight: 600,
    fontSize: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center'
  },
  btnGhost: {
    padding: '10px 24px', borderRadius: '6px', border: '1px solid #dde3d8',
    backgroundColor: '#fff', color: '#1a1f14', fontWeight: 600, fontSize: '14px', cursor: 'pointer'
  },
  iconBtn: {
    border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%'
  },
  
  // Footers
  formFooter: { 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    padding: '20px 32px', backgroundColor: '#f9faf8', borderTop: '1px solid #eef0ea' 
  },
  formFooterLeft: { 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    padding: '20px 32px', backgroundColor: '#f9faf8', borderTop: '1px solid #eef0ea' 
  },
  
  // Misc
  emptyMsg: { textAlign: 'center', padding: '40px', color: '#9aa090', fontSize: '14px' },
  errMsg: { margin: 0, fontSize: '14px', color: '#c0392b' },
  hintNho: { fontSize: '12px', color: '#9aa090', marginTop: '4px' },
}