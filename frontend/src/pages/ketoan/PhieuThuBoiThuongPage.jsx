import { useEffect, useState } from 'react'
import PageTitle from '../../components/common/PageTitle.jsx'
import api from '../../services/api.js'
import { getStoredUser } from '../../services/authSession.js'

const formatTien = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'
const formatNgay = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '')
const formatGio = (d) => (d ? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '')
// Header dùng chung cho màn Form / Chi tiết (thay cho PageTitle) 
function SubHeader({ title }) {
  return (
    <div style={S.subHeader}>
      <h2 style={S.subHeaderTitle}>{title}</h2>
    </div>
  )
}
// Màn hình 1 : Danh sách biên bản chờ xử lý + đã lập hôm nay
function DanhSachBTChoXuLy({ dsChoXuLy, dsDaLap, tuKhoa, setTuKhoa, loading, onChonLap, onXemChiTiet }) {
  // Lấy thời điểm phiếu thu MỚI NHẤT trong danh sách đã lập hôm nay (không
  // phải thời điểm gọi API) — dùng ngay của phiếu có ngay lớn nhất.
  const phieuMoiNhat = dsDaLap.length > 0
    ? dsDaLap.reduce((moi, pt) => (new Date(pt.ngay) > new Date(moi.ngay) ? pt : moi), dsDaLap[0])
    : null

  return (
    <>
      <div style={S.card}>
        <div style={S.cardHeadRow}>
          <h3 style={S.cardTitle}>📋 Danh sách Biên bản chờ xử lý</h3>
        </div>

        <div style={S.searchBox}>
          <span style={S.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Tìm mã biên bản, tên khách hàng..."
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            style={S.searchInput}
          />
        </div>

        {loading ? (
          <p style={S.emptyMsg}>Đang tải...</p>
        ) : dsChoXuLy.length === 0 ? (
          <p style={S.emptyMsg}>Không có biên bản bồi thường nào đang chờ xử lý.</p>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Mã biên bản</th>
                <th style={S.th}>Khách hàng</th>
                <th style={S.th}>Ngày lập biên bản</th>
                <th style={S.th}>Lần vi phạm</th>
                <th style={{ ...S.th, textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {dsChoXuLy.map((bt) => (
                <tr key={bt.maBT} style={S.trHover}>
                  <td style={S.td}><b>{bt.maBT}</b></td>
                  <td style={S.td}>{bt.tenKH}</td>
                  <td style={S.td}>{formatNgay(bt.ngayBT)}</td>
                  <td style={S.td}>
                    <span style={S.badgeDanger}>Lần {bt.soLanViPham}</span>
                  </td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    <button style={S.btnPrimary} onClick={() => onChonLap(bt.maBT)}>
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
          <h3 style={S.cardTitle}>✅ Danh sách Phiếu thu Bồi Thường đã lập hôm nay</h3>
          {phieuMoiNhat && (
            <span style={S.updateBadge}>Cập nhật lúc {formatGio(new Date(phieuMoiNhat.ngay))}</span>
          )}
        </div>
        {dsDaLap.length === 0 ? (
          <p style={S.emptyMsg}>Bạn chưa lập phiếu thu bồi thường nào hôm nay.</p>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Mã phiếu thu</th>
                <th style={S.th}>Mã biên bản</th>
                <th style={S.th}>Ngày lập phiếu thu</th>
                <th style={S.th}>Tổng tiền phạt</th>
                <th style={{ ...S.th, textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {dsDaLap.map((pt) => (
                <tr key={pt.maPTDB} style={S.trHover}>
                  <td style={S.td}><b>{pt.maPTDB}</b></td>
                  <td style={S.td}>{pt.maBT}</td>
                  <td style={S.td}>{formatNgay(pt.ngay)}</td>
                  <td style={S.td}><b style={{ color: '#c0392b' }}>{formatTien(pt.tongTien)}</b></td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    <button style={S.iconBtn} onClick={() => onXemChiTiet(pt.maPTDB)} title="Xem chi tiết">
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

//Màn hình 2 : Biểu mẫu lập phiếu thu bồi thường 
function BieuMauLapPT({ thongTin, saving, errorMsg, onHuy, onTao }) {
  return (
    <>
      <SubHeader title="Lập Phiếu Thu Bồi Thường" />

      <div style={S.card}>
        {errorMsg && <p style={S.errMsg}>⚠ {errorMsg}</p>}

        <div style={S.formSection}>
          <div style={S.formSectionTitle}>Thông tin khách hàng & biên bản</div>
          <div style={S.formGrid}>
            <FormField label="Khách hàng vi phạm" value={thongTin.tenKH} />
            <FormField label="Mã biên bản" value={thongTin.maBT} />
            <FormField label="CCCD" value={thongTin.cccd} />
            <FormField label="Ngày lập biên bản" value={formatNgay(thongTin.ngayBT)} />
            <FormField label="SĐT" value={thongTin.sdt} />
            <FormField
              label="Lịch sử vi phạm"
              value={`Lần ${thongTin.soLanViPham}${thongTin.soLanViPham > 1 ? ' (Tái phạm)' : ''}`}
              highlight
            />
          </div>
        </div>

        <div style={S.formSection}>
          <div style={S.formSectionTitle}>Chi tiết vi phạm & mức phạt</div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Lý do vi phạm</th>
                <th style={S.th}>Số lần vi phạm </th>
                <th style={S.th}>Đơn giá áp dụng</th>
                <th style={{ ...S.th, textAlign: 'center' }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={S.td}>Mất {thongTin.tenVD}</td>
                <td style={S.td}>Lần {thongTin.soLanViPham}</td>
                <td style={S.td}>{formatTien(thongTin.giaBoiThuong)}</td>
                <td style={{ ...S.td, fontWeight: 700, textAlign: 'center' }}>{formatTien(thongTin.tongTienPhat)}</td>
              </tr>
            </tbody>
          </table>
          <p style={S.noteText}>
             Hệ thống tự động áp dụng đơn giá phạt tăng dần dựa trên số lần vi phạm của khách hàng theo quy định KTX.
          </p>
          <div style={S.tongTienBox}>
            <span>TỔNG TIỀN PHẠT</span>
            <span style={S.tongTienValue}>{formatTien(thongTin.tongTienPhat)}</span>
          </div>
        </div>

        <div style={{ ...S.formSection, borderBottom: 'none' }}>
            <div style={S.formSectionTitle}>Thông tin chứng từ</div>

            
          <div style={S.formGrid}>
            <FormField label="Nhân viên kế toán" value={thongTin.tenNVKeToan} />
            <FormField label="Ngày lập phiếu thu" value={formatNgay(new Date())} />
          </div>
            <div style={{ marginTop: '20px', marginBottom: '16px' }}>
            <div style={S.fieldLabel}>Trạng thái phiếu thu</div>
            <span style={S.badgeWarning}>
                Chưa thanh toán
            </span>
            </div>
          <p style={S.mailNote}>
             Hệ thống sẽ tự động gửi email thông báo đóng phạt (kèm lý do và số tiền) đến khách hàng.
          </p>
        </div>

        <div style={S.formFooter}>
          <button style={S.btnGhost} onClick={onHuy} disabled={saving}>Hủy bỏ</button>
          <button style={S.btnPrimary} onClick={onTao} disabled={saving}>
            {saving ? 'Đang tạo...' : ' Tạo & In Phiếu Thu'}
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

// Màn hình 3 : Xem chi tiết phiếu thu đã lập 
function ChiTietPT({ pt, onQuayLai, onIn, printing }) {
  return (
    <>
      <SubHeader title={`Mã phiếu thu: ${pt.maPTDB}`} />

      <div style={S.card}>
        

        <div style={S.formSection}>
          <div style={S.formSectionTitle}>Thông tin khách hàng & biên bản</div>
          <div style={S.formGrid}>
            <FormField label="Khách hàng vi phạm" value={pt.tenKH} />
            <FormField label="Mã biên bản" value={pt.maBT} />
            <FormField label="CCCD" value={pt.cccd} />
            <FormField label="Ngày lập biên bản" value={formatNgay(pt.ngayBT)} />
            <FormField label="SĐT" value={pt.sdt} />
            <FormField label="Lịch sử vi phạm" value={`Lần ${pt.soLanViPham}`} highlight />
          </div>
        </div>

        <div style={S.formSection}>
          <div style={S.formSectionTitle}>Chi tiết vi phạm & mức phạt</div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Lý do vi phạm</th>
                <th style={S.th}>Số lần vi phạm</th>
                <th style={S.th}>Đơn giá áp dụng</th>
                <th style={{ ...S.th, textAlign: 'center' }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={S.td}>Mất {pt.tenVD}</td>
                <td style={S.td}>Lần {pt.soLanViPham}</td>
                <td style={S.td}>{formatTien(pt.giaBoiThuong)}</td>
                <td style={{ ...S.td, fontWeight: 700, textAlign: 'center' }}>{formatTien(pt.tongTien)}</td>
              </tr>
            </tbody>
          </table>
          <div style={S.tongTienBox}>
            <span>TỔNG TIỀN PHẠT</span>
            <span style={S.tongTienValue}>{formatTien(pt.tongTien)}</span>
          </div>
        </div>

        <div style={{ ...S.formSection, borderBottom: 'none' }}>
          <div style={S.formSectionTitle}>Thông tin chứng từ</div>
          <div style={S.formGrid}>
            <FormField label="Nhân viên kế toán" value={pt.tenNVKeToan} />
            <FormField label="Ngày lập phiếu thu" value={formatNgay(pt.ngay)} />
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

// ===== Trang chính =====
export default function LapPTBoiThuongPage() {
  const user = getStoredUser()
  const [view, setView] = useState('list') // 'list' | 'form' | 'detail'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [tuKhoa, setTuKhoa] = useState('')

  const [dsChoXuLy, setDsChoXuLy] = useState([])
  const [dsDaLap, setDsDaLap] = useState([])

  const [thongTinLap, setThongTinLap] = useState(null)
  const [chiTietPT, setChiTietPT] = useState(null)
  const [showConfirmTao, setShowConfirmTao] = useState(false)
  const taiDanhSach = async (tuKhoaHienTai) => {
    setLoading(true)
    try {
      const [resChoXuLy, resDaLap] = await Promise.all([
        api.get('/phieu-thu-boi-thuong/cho-xu-ly', { params: tuKhoaHienTai ? { tuKhoa: tuKhoaHienTai } : {} }),
        api.get('/phieu-thu-boi-thuong/da-lap-hom-nay'),
      ])
      setDsChoXuLy(resChoXuLy.data?.data || [])
      setDsDaLap(resDaLap.data?.data || [])
    } catch (err) {
      console.error('Lỗi tải danh sách PT bồi thường:', err?.response?.data || err?.message)
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

  const handleChonLap = async (maBT) => {
    setErrorMsg('')
    try {
      const res = await api.get(`/phieu-thu-boi-thuong/lap/${maBT}`)
      setThongTinLap({ ...res.data.data, tenNVKeToan: user?.ten_nv || user?.tenNV })
      setView('form')
    } catch (err) {
      alert(err?.response?.data?.message || 'Không thể tải thông tin biên bản.')
      taiDanhSach(tuKhoa)
    }
  }

  const handleTaoPhieu = async () => {
  setSaving(true)
  setErrorMsg('')
  try {
    const res = await api.post('/phieu-thu-boi-thuong/lap', {
      maBT: thongTinLap.maBT,
      trangThai: 'Chưa thanh toán'
    })

    const ptbtMoi = res.data?.data

    // A9: gửi mail thất bại — backend vẫn trả 201 kèm warning, không phải lỗi
    if (res.data?.warning) alert(res.data.warning)

    // Xuất PDF ngay sau khi tạo phiếu — tách riêng try-catch để nếu xuất PDF
    // lỗi thì KHÔNG ảnh hưởng đến việc phiếu đã tạo / mail đã gửi (hoặc chưa).
    if (ptbtMoi?.maPTDB) {
      try {
        const pdfRes = await api.get(`/phieu-thu-boi-thuong/${ptbtMoi.maPTDB}/pdf`, {
          responseType: 'blob',
        })
        const url = window.URL.createObjectURL(new Blob([pdfRes.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `${ptbtMoi.maPTDB}.pdf`)
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
    setErrorMsg(err?.response?.data?.message || 'Không thể tạo phiếu thu bồi thường.')
    if (err?.response?.status === 409) {
      setTimeout(() => setView('list'), 1500)
    }
  } finally {
    setSaving(false)
  }
}

  const handleXemChiTiet = async (maPTDB) => {
    try {
      const res = await api.get(`/phieu-thu-boi-thuong/${maPTDB}`)
      setChiTietPT(res.data.data)
      setView('detail')
    } catch (err) {
      alert(err?.response?.data?.message || 'Không thể tải chi tiết phiếu thu.')
    }
  }

  const handleInPhieu = async () => {
    setPrinting(true)
    try {
      const res = await api.get(`/phieu-thu-boi-thuong/${chiTietPT.maPTDB}/pdf`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${chiTietPT.maPTDB}.pdf`)
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
      {/* PageTitle chỉ hiện ở màn danh sách — form/chi tiết dùng SubHeader gọn hơn */}
      {view === 'list' && (
        <div style={{ marginBottom: '24px' }}>
          <PageTitle
            title="Lập Phiếu Thu Bồi Thường"
            description="Rà soát các biên bản sự cố, vi phạm quy định (mất thẻ, chìa khóa) để lập hóa đơn bồi thường."
          />
        </div>
      )}

      {view === 'list' && (
        <DanhSachBTChoXuLy
          dsChoXuLy={dsChoXuLy}
          dsDaLap={dsDaLap}
          tuKhoa={tuKhoa}
          setTuKhoa={setTuKhoa}
          loading={loading}
          onChonLap={handleChonLap}
          onXemChiTiet={handleXemChiTiet}
        />
      )}

      {view === 'form' && thongTinLap && (
        <BieuMauLapPT
          thongTin={thongTinLap}
          saving={saving}
          errorMsg={errorMsg}
          onHuy={() => setView('list')}
          onTao={() => setShowConfirmTao(true)}
        />
      )}

      {view === 'detail' && chiTietPT && (
        <ChiTietPT
          pt={chiTietPT}
          onQuayLai={() => setView('list')}
          onIn={handleInPhieu}
          printing={printing}
        />
      )}

      {showConfirmTao && (
  <div style={S.modalOverlay}>
    <div style={S.confirmBox}>
      <h3 style={S.confirmTitle}>Xác nhận tạo phiếu thu</h3>
      <p style={S.confirmText}>Bạn có xác nhận muốn tạo phiếu thu bồi thường?</p>

      <div style={S.confirmActions}>
        <button
          style={S.btnGhost}
          onClick={() => setShowConfirmTao(false)}
          disabled={saving}
        >
          Hủy
        </button>

        <button
          style={S.btnPrimary}
          onClick={() => {
            setShowConfirmTao(false)
            handleTaoPhieu()
          }}
          disabled={saving}
        >
          Xác nhận
        </button>
      </div>
    </div>
  </div>
)}
    </section>
  )
}

const S = {
  
  errMsg: {
    margin: '0 0 18px',
    fontSize: '13.5px',
    color: '#c0392b',
    backgroundColor: '#fdecea',
    padding: '10px 14px',
    borderRadius: '8px',
  },

  subHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '18px',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 14px',
    borderRadius: '8px',
    border: '1px solid #dde3d8',
    backgroundColor: '#fff',
    color: '#3b4f27',
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
  },
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
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '13px',
    color: '#9aa090',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px 10px 34px',
    borderRadius: '8px',
    border: '1px solid #dde3d8',
    fontSize: '13.5px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },

  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' },
  th: {
    textAlign: 'left',
    padding: '10px 8px',
    borderBottom: '1px solid #eef0ea',
    color: '#9aa090',
    fontWeight: 700,
    fontSize: '11.5px',
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
  },
  td: { padding: '13px 8px', borderBottom: '1px solid #f4f6f0', color: '#1a1f14' },
  trHover: { transition: 'background-color 0.1s' },

  badgeDanger: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '999px',
    backgroundColor: '#fdecea',
    color: '#c0392b',
    fontSize: '12px',
    fontWeight: 700,
  },

  modalOverlay: {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.35)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 999,
},

confirmBox: {
  width: 'min(420px, calc(100vw - 32px))',
  backgroundColor: '#fff',
  borderRadius: '10px',
  padding: '22px 24px',
  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.18)',
},

confirmTitle: {
  margin: 0,
  color: '#1a1f14',
  fontSize: '20px',
  fontWeight: 800,
},

confirmText: {
  margin: '12px 0 0',
  color: '#4f5946',
  fontSize: '14px',
  lineHeight: 1.5,
},

confirmActions: {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
  marginTop: '22px',
},
  badgeWarning: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '999px',
    backgroundColor: '#fdf3e3',
    color: '#b7791f',
    fontSize: '12.5px',
    fontWeight: 700,
  },
  updateBadge: {
    padding: '4px 12px',
    borderRadius: '999px',
    backgroundColor: '#eef1ea',
    color: '#5c6653',
    fontSize: '11.5px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  badgeSuccess: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '999px',
    backgroundColor: '#e8f3e6',
    color: '#3b4f27',
    fontSize: '12.5px',
    fontWeight: 700,
  },
  statusRow: { marginBottom: '18px' },

  btnPrimary: {
    padding: '9px 18px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3b4f27',
    color: '#fff',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  btnGhost: {
    padding: '9px 18px',
    borderRadius: '8px',
    border: '1px solid #dde3d8',
    backgroundColor: '#fff',
    color: '#1a1f14',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer',
  },
  iconBtn: {
    border: '1px solid #dde3d8',
    background: '#fff',
    borderRadius: '7px',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    fontSize: '14px',
  },

  formSection: {
    padding: '20px 0',
    borderBottom: '1px solid #eef0ea',
  },
  formSectionTitle: {
    fontSize: '15.5px',
    fontWeight: 700,
    letterSpacing: '0.4px',
    color: '#9aa090',
    textTransform: 'uppercase',
    marginBottom: '16px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '18px',
  },
  fieldLabel: { fontSize: '15px', color: '#9aa090', marginBottom: '5px' },
  fieldValue: { fontSize: '16.5px', color: '#1a1f14', fontWeight: 600 },

  noteText: { fontSize: '14px', color: '#9aa090', fontStyle: 'italic', marginTop: '12px' },
  mailNote: {
    fontSize: '14.5px',
    color: '#6b7560',
    marginTop: '12px',
    backgroundColor: '#f6f8f4',
    padding: '10px 12px',
    borderRadius: '8px',
  },
  tongTienBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px',
    padding: '16px 18px',
    backgroundColor: '#fdecea',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    color: '#7a2318',
  },
  tongTienValue: { fontSize: '25px', color: '#c0392b', fontWeight: 800 },

  formFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    paddingTop: '22px',
  },
}