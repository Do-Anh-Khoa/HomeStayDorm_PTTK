import { useEffect, useState } from 'react'
import PageTitle from '../../components/common/PageTitle.jsx'
import api from '../../services/api.js'
import { getStoredUser } from '../../services/authSession.js'

const formatTien = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'
const formatNgay = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '')
const formatGio = (d) => (d ? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '')
//  Header dùng chung cho màn Form / Chi tiết (thay cho PageTitle)
function SubHeader({ title }) {
  return (
    <div style={S.subHeader}>
      <h2 style={S.subHeaderTitle}>{title}</h2>
    </div>
  )
}

// Màn hình 1 : Danh sách PDC chờ lập + đã lập hôm nay 
function DanhSachPDCChoLap({ dsChoLap, dsDaLap, tuKhoa, setTuKhoa, loading, onChonLap, onXemChiTiet })  {
  // Lấy thời điểm phiếu thu MỚI NHẤT trong danh sách đã lập hôm nay 
  const phieuMoiNhat = dsDaLap.length > 0
    ? dsDaLap.reduce((moi, pt) => (new Date(pt.ngay) > new Date(moi.ngay) ? pt : moi), dsDaLap[0])
    : null

  return (
    <>
      <div style={S.card}>
        <div style={S.cardHeadRow}>
          <h3 style={S.cardTitle}>📋 Danh sách Phiếu đặt cọc chờ lập</h3>
        </div>

        <div style={S.searchBox}>
          <span style={S.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Tìm mã đặt cọc, tên khách hàng..."
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            style={S.searchInput}
          />
        </div>

        {loading ? (
          <p style={S.emptyMsg}>Đang tải...</p>
        ) : dsChoLap.length === 0 ? (
          <p style={S.emptyMsg}>Không có phiếu đặt cọc nào đang chờ lập.</p>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Mã đặt cọc</th>
                <th style={S.th}>Khách đặt</th>
                <th style={S.th}>Ngày cọc</th>
                <th style={{ ...S.th, textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {dsChoLap.map((pdc) => (
                <tr key={pdc.maPDC} style={S.trHover}>
                  <td style={S.td}><b>{pdc.maPDC}</b></td>
                  <td style={S.td}>{pdc.tenKH}</td>
                  <td style={S.td}>{formatNgay(pdc.ngayDC)}</td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    <button style={S.btnPrimary} onClick={() => onChonLap(pdc.maPDC)}>
                      + Lập Phiếu Thu
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ ...S.card, marginTop: '18px' }}>
        <div style={S.cardHeadRow}>
         <h3 style={S.cardTitle}>✅ Danh sách Phiếu thu Đặt cọc đã lập hôm nay</h3>
          {phieuMoiNhat && (
            <span style={S.updateBadge}>Cập nhật lúc {formatGio(new Date(phieuMoiNhat.ngay))}</span>
          )}
        </div>
        {dsDaLap.length === 0 ? (
          <p style={S.emptyMsg}>Bạn chưa lập phiếu thu đặt cọc nào hôm nay.</p>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Mã phiếu thu</th>
                <th style={S.th}>Mã đặt cọc</th>
                <th style={S.th}>Ngày lập</th>
                <th style={S.th}>Tổng tiền cọc</th>
                <th style={{ ...S.th, textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {dsDaLap.map((pt) => (
                <tr key={pt.maPTDC} style={S.trHover}>
                  <td style={S.td}><b>{pt.maPTDC}</b></td>
                  <td style={S.td}>{pt.maPDC}</td>
                  <td style={S.td}>{formatNgay(pt.ngay)}</td>
                  <td style={S.td}><b style={{ color: '#c0392b' }}>{formatTien(pt.tongTien)}</b></td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    <button style={S.iconBtn} onClick={() => onXemChiTiet(pt.maPTDC)} title="Xem chi tiết">
                      👁
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

// Bảng chi tiết giường đã cọc 
function BangGiuongDaCoc({ dsGiuong }) {
  return (
    <table style={S.table}>
      <thead>
        <tr>
          <th style={S.th}>Mã giường</th>
          <th style={S.th}>Loại phòng</th>
          <th style={S.th}>Giá thuê/tháng</th>
          <th style={{ ...S.th, textAlign: 'center' }}>Hệ số</th>
          <th style={{ ...S.th, textAlign: 'center' }}>Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        {(dsGiuong || []).map((g) => (
          <tr key={`${g.maPhong}-${g.maGiuong}`}>
            <td style={S.td}>{g.maPhong} - {g.maGiuong}</td>
            <td style={S.td}>{g.tenLoai}</td>
            <td style={S.td}>{formatTien(g.giaGiuong)}</td>
            <td style={{ ...S.td, textAlign: 'center' }}>x{g.heSo}</td>
            <td style={{ ...S.td, fontWeight: 700, textAlign: 'center' }}>{formatTien(g.thanhTien)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

//  Màn hình 2 : Biểu mẫu lập phiếu thu đặt cọc
function BieuMauLapPTDC({ thongTin, saving, errorMsg, onHuy, onTao }) {
  return (
    <>
      <SubHeader title="Lập Phiếu Thu Đặt Cọc" />

      <div style={S.card}>
        {errorMsg && <p style={S.errMsg}>⚠ {errorMsg}</p>}

        <div style={S.formSection}>
          <div style={S.formSectionTitle}>Thông tin khách hàng & đặt cọc</div>
          <div style={S.formGrid}>
            <FormField label="Họ tên" value={thongTin.tenKH} />
            <FormField label="Mã đặt cọc" value={thongTin.maPDC} />
            <FormField label="CCCD" value={thongTin.cccd} />
            <FormField label="Ngày lập" value={formatNgay(thongTin.ngayDC)} />
            <FormField label="SĐT" value={thongTin.sdt} />
            <FormField label="NV Sale" value={thongTin.tenNVSale} />
          </div>
        </div>

        <div style={S.formSection}>
          <div style={S.formSectionTitle}>Chi tiết giường đã cọc & tính toán</div>
          <BangGiuongDaCoc dsGiuong={thongTin.dsGiuong} />
          <div style={S.tongTienBox}>
            <span>TỔNG TIỀN CỌC PHẢI THU</span>
            <span style={S.tongTienValue}>{formatTien(thongTin.tongTienCoc)}</span>
          </div>
        </div>

        <div style={{ ...S.formSection, borderBottom: 'none' }}>
          <div style={S.formSectionTitle}>Thông tin chứng từ</div>
          <div style={S.formGrid}>
            <FormField label="Nhân viên kế toán" value={thongTin.tenNVKeToan} />
            <FormField label="Ngày lập phiếu" value={formatNgay(new Date())} />
          </div>
          <div style={{ marginTop: '20px', marginBottom: '16px' }}>
            <div style={S.fieldLabel}>Trạng thái phiếu thu</div>
            <span style={S.badgeWarning}>Chưa thanh toán</span>
          </div>
          <p style={S.mailNote}>
             Hệ thống sẽ tự động gửi email yêu cầu thanh toán tiền cọc đến khách hàng.
          </p>
        </div>

        <div style={S.formFooter}>
          <button style={S.btnGhost} onClick={onHuy} disabled={saving}>Hủy bỏ</button>
          <button style={S.btnPrimary} onClick={onTao} disabled={saving}>
            {saving ? 'Đang tạo...' : 'Tạo & In Phiếu Thu'}
          </button>
        </div>
      </div>
    </>
  )
}

function FormField({ label, value, highlight }) {
  return (
    <div>
      <div style={S.fieldLabel}>{label}</div>
      <div style={{ ...S.fieldValue, ...(highlight ? { color: '#c0392b', fontWeight: 700 } : {}) }}>
        {value || '—'}
      </div>
    </div>
  )
}

//Màn hình 3 : Xem chi tiết phiếu thu đã lập
function ChiTietPTDC({ pt, onQuayLai, onIn, printing }) {
  return (
    <>
      <SubHeader title={`Mã phiếu thu: ${pt.maPTDC}`} />

      <div style={S.card}>
        <div style={S.formSection}>
          <div style={S.formSectionTitle}>Thông tin khách hàng & đặt cọc</div>
          <div style={S.formGrid}>
            <FormField label="Họ tên" value={pt.tenKH} />
            <FormField label="Mã đặt cọc" value={pt.maPDC} />
            <FormField label="CCCD" value={pt.cccd} />
            <FormField label="Ngày lập" value={formatNgay(pt.ngayDC)} />
            <FormField label="SĐT" value={pt.sdt} />
            <FormField label="NV Sale" value={pt.tenNVSale} />
          </div>
        </div>

        <div style={S.formSection}>
          <div style={S.formSectionTitle}>Chi tiết giường đã cọc & tính toán</div>
          <BangGiuongDaCoc dsGiuong={pt.dsGiuong} />
          <div style={S.tongTienBox}>
            <span>TỔNG TIỀN CỌC PHẢI THU</span>
            <span style={S.tongTienValue}>{formatTien(pt.tongTien)}</span>
          </div>
        </div>

        <div style={{ ...S.formSection, borderBottom: 'none' }}>
          <div style={S.formSectionTitle}>Thông tin chứng từ</div>
          <div style={S.formGrid}>
            <FormField label="Nhân viên kế toán" value={pt.tenNVKeToan} />
            <FormField label="Ngày lập phiếu" value={formatNgay(pt.ngay)} />
          </div>
        </div>

        <div style={S.formFooter}>
          <button style={S.btnGhost} onClick={onQuayLai}>Quay lại</button>
          <button style={S.btnPrimary} onClick={onIn} disabled={printing}>
            {printing ? 'Đang xuất PDF...' : '📄 In phiếu thu'}
          </button>
        </div>
      </div>
    </>
  )
}

//  Trang chính
export default function LapPTDatCocPage() {
  const user = getStoredUser()
  const [view, setView] = useState('list') // 'list' | 'form' | 'detail'
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
        api.get('/phieu-thu-dat-coc/cho-xu-ly', { params: tuKhoaHienTai ? { tuKhoa: tuKhoaHienTai } : {} }),
        api.get('/phieu-thu-dat-coc/da-lap-hom-nay'),
      ])
      setDsChoLap(resChoLap.data?.data || [])
      setDsDaLap(resDaLap.data?.data || [])
    } catch (err) {
      console.error('Lỗi tải danh sách PT đặt cọc:', err?.response?.data || err?.message)
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

  const handleChonLap = async (maPDC) => {
    setErrorMsg('')
    try {
      const res = await api.get(`/phieu-thu-dat-coc/lap/${maPDC}`)
      setThongTinLap({ ...res.data.data, tenNVKeToan: user?.ten_nv || user?.tenNV })
      setView('form')
    } catch (err) {
      alert(err?.response?.data?.message || 'Không thể tải thông tin phiếu đặt cọc.')
      taiDanhSach(tuKhoa)
    }
  }

  // Tạo phiếu -> gửi mail 
  // Xuất PDF nằm trong try-catch RIÊNG để nếu lỗi cũng không ảnh hưởng đến
  // việc phiếu đã tạo thành công.
  const handleTaoPhieu = async () => {
    setSaving(true)
    setErrorMsg('')
    try {
      const res = await api.post('/phieu-thu-dat-coc/lap', { maPDC: thongTinLap.maPDC })

      const ptdcMoi = res.data?.data
      if (res.data?.warning) alert(res.data.warning)

      if (ptdcMoi?.maPTDC) {
        try {
          const pdfRes = await api.get(`/phieu-thu-dat-coc/${ptdcMoi.maPTDC}/pdf`, {
            responseType: 'blob',
          })
          const url = window.URL.createObjectURL(new Blob([pdfRes.data]))
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', `${ptdcMoi.maPTDC}.pdf`)
          document.body.appendChild(link)
          link.click()
          link.remove()
        } catch (pdfErr) {
          console.error('Xuất PDF thất bại:', pdfErr?.response?.data || pdfErr?.message)
          alert('Tạo phiếu thu thành công nhưng xuất file PDF thất bại. Bạn có thể xem và in lại ở danh sách đã lập hôm nay.')
        }
      }
       await taiDanhSach(tuKhoa)  
      setView('list')
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Không thể tạo phiếu thu đặt cọc.')
      if (err?.response?.status === 409) {
        setTimeout(() => setView('list'), 1500)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleXemChiTiet = async (maPTDC) => {
    try {
      const res = await api.get(`/phieu-thu-dat-coc/${maPTDC}`)
      setChiTietPT(res.data.data)
      setView('detail')
    } catch (err) {
      alert(err?.response?.data?.message || 'Không thể tải chi tiết phiếu thu.')
    }
  }

  const handleInPhieu = async () => {
    setPrinting(true)
    try {
      const res = await api.get(`/phieu-thu-dat-coc/${chiTietPT.maPTDC}/pdf`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${chiTietPT.maPTDC}.pdf`)
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
    <section>
      {view === 'list' && (
        <div style={{ marginBottom: '24px' }}>
          <PageTitle
            title="Lập Phiếu Thu Đặt Cọc"
            description="Rà soát các phiếu đặt cọc chưa có phiếu thu để lập phiếu."
          />
        </div>
      )}

      {view === 'list' && (
        <DanhSachPDCChoLap
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
        <BieuMauLapPTDC
          thongTin={thongTinLap}
          saving={saving}
          errorMsg={errorMsg}
          onHuy={() => setView('list')}
          onTao={handleTaoPhieu}
        />
      )}

      {view === 'detail' && chiTietPT && (
        <ChiTietPTDC
          pt={chiTietPT}
          onQuayLai={() => setView('list')}
          onIn={handleInPhieu}
          printing={printing}
        />
      )}
    </section>
  )
}

// Style dùng chung 
const S = {
  errMsg: {
    margin: '0 0 18px',
    fontSize: '13.5px',
    color: '#c0392b',
    backgroundColor: '#fdecea',
    padding: '10px 14px',
    borderRadius: '8px',
  },
  subHeader: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '18px' },
  subHeaderTitle: { margin: 0, fontSize: '35px', fontWeight: 800, color: '#1a1f14' },
  card: {
    backgroundColor: '#fff',
    border: '1px solid #e5e9e1',
    borderRadius: '14px',
    padding: '24px 26px',
    boxShadow: '0 1px 3px rgba(20, 30, 10, 0.04)',
  },
  cardTitle: { margin: 0, fontSize: '15px', fontWeight: 700, color: '#1a1f14' },
  cardHeadRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  emptyMsg: { textAlign: 'center', padding: '28px', color: '#9aa090', fontSize: '13.5px' },
  searchBox: { position: 'relative', margin: '10px 0 18px' },
  searchIcon: {
    position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
    fontSize: '13px', color: '#9aa090', pointerEvents: 'none',
  },
  searchInput: {
    width: '100%', padding: '10px 14px 10px 34px', borderRadius: '8px',
    border: '1px solid #dde3d8', fontSize: '13.5px', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' },
  th: {
    textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #eef0ea',
    color: '#9aa090', fontWeight: 700, fontSize: '11.5px',
    letterSpacing: '0.3px', textTransform: 'uppercase',
  },
  td: { padding: '13px 8px', borderBottom: '1px solid #f4f6f0', color: '#1a1f14' },
  trHover: { transition: 'background-color 0.1s' },
  badgeWarning: {
    display: 'inline-block', padding: '4px 12px', borderRadius: '999px',
    backgroundColor: '#fdf3e3', color: '#b7791f', fontSize: '12.5px', fontWeight: 700,
  },
  updateBadge: {
    padding: '4px 12px', borderRadius: '999px', backgroundColor: '#eef1ea',
    color: '#5c6653', fontSize: '11.5px', fontWeight: 600, whiteSpace: 'nowrap',
  },
  btnPrimary: {
    padding: '9px 18px', borderRadius: '8px', border: 'none',
    backgroundColor: '#3b4f27', color: '#fff', fontWeight: 700,
    fontSize: '13px', cursor: 'pointer', transition: 'opacity 0.15s',
  },
  btnGhost: {
    padding: '9px 18px', borderRadius: '8px', border: '1px solid #dde3d8',
    backgroundColor: '#fff', color: '#1a1f14', fontWeight: 700,
    fontSize: '13px', cursor: 'pointer',
  },
  iconBtn: {
    border: '1px solid #dde3d8', background: '#fff', borderRadius: '7px',
    width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px',
  },
  formSection: { padding: '20px 0', borderBottom: '1px solid #eef0ea' },
  formSectionTitle: {
    fontSize: '15.5px', fontWeight: 700, letterSpacing: '0.4px',
    color: '#9aa090', textTransform: 'uppercase', marginBottom: '16px',
  },
  formGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px',
  },
  fieldLabel: { fontSize: '15px', color: '#9aa090', marginBottom: '5px' },
  fieldValue: { fontSize: '16.5px', color: '#1a1f14', fontWeight: 600 },
  mailNote: {
    fontSize: '14.5px', color: '#6b7560', marginTop: '12px',
    backgroundColor: '#f6f8f4', padding: '10px 12px', borderRadius: '8px',
  },
  tongTienBox: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: '16px', padding: '16px 18px', backgroundColor: '#fdecea',
    borderRadius: '10px', fontSize: '14px', fontWeight: 700, color: '#7a2318',
  },
  tongTienValue: { fontSize: '25px', color: '#c0392b', fontWeight: 800 },
  formFooter: { display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '22px' },
}