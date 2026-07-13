import { useEffect, useMemo, useState } from 'react'
import PageTitle from '../../components/common/PageTitle.jsx'
import api from '../../services/api.js'
import { useNavigate } from 'react-router-dom'


const normalizeText = value => String(value || '').trim().toLowerCase()

const formatDate = value => {
  if (!value) return '--/--/----'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--/--/----'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)
}


const getInitials = (name) => {
  if (!name) return 'KH'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}


const getAvatarColor = (initials) => {
  const colors = ['#3b82f6', '#d97706', '#a855f7', '#ef4444', '#10b981', '#ec4899']
  const charCode = initials.charCodeAt(0) || 0
  return colors[charCode % colors.length]
}

function EmptyRow({ colSpan, text }) {
  return (
    <tr>
      <td colSpan={colSpan} style={S.emptyCell}>{text}</td>
    </tr>
  )
}

function BanGiaoTable({ rows, loading, emptyText, isHistory, onAction }) {
  return (
    <div style={S.tableWrap}>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Mã hợp đồng</th>
            <th style={S.th}>Khách Hàng</th>
            <th style={S.th}>Phòng/Giường</th>
            <th style={S.th}>Ngày bàn giao</th>
            <th style={S.th}>Trạng thái<br/>phiếu thu</th>
            <th style={{ ...S.th, textAlign: 'center' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <EmptyRow colSpan={6} text="Đang tải dữ liệu..." />
          ) : rows.length === 0 ? (
            <EmptyRow colSpan={6} text={emptyText} />
          ) : (
            rows.map((row, index) => {
              const initials = getInitials(row.ten_khach_hang)
              const bgColor = getAvatarColor(initials)

              return (
                <tr key={row.ma_hdt || index} style={S.tr}>
                  <td style={S.td}>{row.ma_hdt}</td>
                  
                  <td style={S.td}>
                    <div style={S.customerCell}>
                      <div style={{ ...S.avatar, backgroundColor: bgColor }}>
                        {initials}
                      </div>
                      <span style={S.customerName}>{row.ten_khach_hang}</span>
                    </div>
                  </td>
                  
                  <td style={S.td}>{row.phong_giuong}</td>
                  <td style={S.td}>{formatDate(row.ngay_ban_giao)}</td>
                  
                  <td style={S.td}>
                    <span style={S.statusBadge}>
                      {row.trang_thai_phieu_thu || 'Hợp lệ'}
                    </span>
                  </td>
                  
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    <button 
                      type="button" 
                      style={isHistory ? S.btnHistory : S.btnCreate} 
                      onClick={() => onAction(row.ma_hdt)}
                    >
                      {isHistory ? 'Xem chi tiết' : 'Lập biên bản'}
                    </button>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

export default function BanGiaoPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  
  const [pendingRows, setPendingRows] = useState([])
  const [historyRows, setHistoryRows] = useState([])
  const [loading, setLoading] = useState(false)

  const [view, setView] = useState('list') 
  const [selectedHdt, setSelectedHdt] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await api.get('/ban-giao')
      const data = response.data?.data || response.data || {}
      setPendingRows(Array.isArray(data.pendingList) ? data.pendingList : [])
      setHistoryRows(Array.isArray(data.historyList) ? data.historyList : [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filterRows = rows => {
    const keyword = normalizeText(appliedSearch)
    if (!keyword) return rows
    return rows.filter(row => 
      normalizeText(row.ma_hdt).includes(keyword) || 
      normalizeText(row.ten_khach_hang).includes(keyword) ||
      normalizeText(row.ma_kh).includes(keyword)
    )
  }

  const filteredPendingRows = useMemo(() => filterRows(pendingRows), [pendingRows, appliedSearch])
  const filteredHistoryRows = useMemo(() => filterRows(historyRows), [historyRows, appliedSearch])

  const handleSearch = () => {
    setAppliedSearch(search)
  }

  const handleCreate = async (maHdt) => {
    try {
      const res = await api.get(`/ban-giao/${maHdt}`)
      setDetailData(res.data.data)
      setSelectedHdt(maHdt)
      setView('detail')
    } catch (err) {
      window.alert('Không thể lấy thông tin hợp đồng.')
    }
  }

  
  const handleViewDetails = async (maHdt) => {
    try {
      const res = await api.get(`/ban-giao/history/${maHdt}`)
      setDetailData(res.data.data)
      setSelectedHdt(maHdt)
      setView('history') // Chuyển state sang màn hình xem lịch sử
    } catch (err) {
      window.alert('Không thể lấy thông tin chi tiết biên bản.')
    }
  }
  if (view === 'detail' && detailData) {
    return (
      <FormLapBienBan 
        data={detailData}
        onBack={() => {
          setView('list')
          fetchData() 
        }}
      />
    )
  }
  if (view === 'history' && detailData) {
    return (
      <FormXemChiTiet 
        data={detailData}
        onBack={() => setView('list')}
      />
    )
  }
  return (
    <section style={S.page}>
      <PageTitle
        title="Lập biên bản bàn giao phòng/giường"
        description="Chọn hợp đồng thuê đã hoàn tất thanh toán để lập biên bản bàn giao vật dụng."
      />

      <div style={S.card}>
        <div style={S.searchRow}>
          <div style={S.searchInputWrap}>
            <span style={S.searchIcon}>⌕</span>
            <input
              style={S.searchInput}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Mã hợp đồng, CCCD khách hàng..."
            />
          </div>
          <button type="button" style={S.btnSearch} onClick={handleSearch}>
            Tìm kiếm
          </button>
        </div>

        <BanGiaoTable
          rows={filteredPendingRows}
          loading={loading}
          isHistory={false}
          emptyText="Không có hợp đồng nào chờ lập biên bản."
          onAction={handleCreate}
        />
      </div>

      <div style={S.historyHeader}>
        <h2 style={S.historyTitle}>Lịch sử lập biên bản bàn giao</h2>
        <p style={S.historyDesc}>Xem lại danh sách các hợp đồng đã được lập biên bản bàn giao.</p>
      </div>

      <div style={S.cardHistory}>
        <BanGiaoTable
          rows={filteredHistoryRows}
          loading={loading}
          isHistory={true}
          emptyText="Chưa có lịch sử lập biên bản bàn giao."
          onAction={handleViewDetails}
        />
      </div>
    </section>
  )
}


const S = {
  page: {
    padding: '0',
    fontFamily: 'Inter, sans-serif',
  },
  card: {
    border: '1px solid #eef0eb',
    borderRadius: '8px',
    padding: '24px',
    backgroundColor: '#fff',
    marginTop: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  cardHistory: {
    border: '1px solid #eef0eb',
    borderRadius: '8px',
    padding: '0', 
    backgroundColor: '#fff',
    marginTop: '16px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  searchRow: {
    display: 'flex',
    gap: '14px',
    marginBottom: '24px',
  },
  searchInputWrap: {
    position: 'relative',
    flex: 1,
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
    fontSize: '20px',
  },
  searchInput: {
    width: '100%',
    height: '46px',
    boxSizing: 'border-box',
    padding: '0 16px 0 46px',
    border: '1.5px solid #e5e7eb',
    borderRadius: '6px',
    backgroundColor: '#fff',
    color: '#374151',
    fontSize: '15px',
    outline: 'none',
  },
  btnSearch: {
    width: '110px',
    height: '46px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#3b4f27',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  tableWrap: {
    width: '100%',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '16px 20px',
    backgroundColor: '#f4f5f4', 
    color: '#374151',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: 700,
  },
  tr: {
    borderBottom: '1px solid #f3f4f6',
  },
  td: {
    padding: '16px 20px',
    color: '#4b5563',
    fontSize: '14.5px',
    verticalAlign: 'middle',
  },
  emptyCell: {
    padding: '30px',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '15px',
  },
  customerCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: '13px',
  },
  customerName: {
    fontWeight: 500,
    color: '#1f2937',
  },
  statusBadge: {
    display: 'inline-block',
    backgroundColor: '#d1fae5', 
    color: '#059669', 
    padding: '4px 12px',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: 600,
  },
  btnCreate: {
    minWidth: '110px',
    height: '36px',
    padding: '0 16px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#3b4f27',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnHistory: {
    minWidth: '110px',
    height: '36px',
    padding: '0 16px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#3b4f27', 
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  historyHeader: {
    marginTop: '36px',
  },
  historyTitle: {
    margin: '0 0 6px 0',
    fontSize: '20px',
    fontWeight: 700,
    color: '#111827',
  },
  historyDesc: {
    margin: 0,
    fontSize: '14.5px',
    color: '#6b7280',
  }
}

function FormLapBienBan({ data, onBack }) {
  const { contract, vatDungs } = data
  const [tinhTrangPhong, setTinhTrangPhong] = useState('Sạch')
  const [selectedVd, setSelectedVd] = useState('')
  const [items, setItems] = useState([])
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const handleAddItem = () => {
    if (!selectedVd) return
    const vdInfo = vatDungs.find(v => v.ma_vd === selectedVd)
    if (items.some(i => i.ma_vd === selectedVd)) return 
    
    setItems([...items, {
      ma_vd: vdInfo.ma_vd,
      ten_vd: vdInfo.ten_vd,
      so_luong: 1,
      tinh_trang: 'Mới', 
      da_duyet: false
    }])
    setSelectedVd('')
  }

  const updateItem = (index, field, value) => {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  const handleSave = async () => {
    setErrorMsg('')
    setSaving(true)
    try {
      await api.post(`/ban-giao/${contract.ma_hdt}`, {
        tinh_trang_vs: tinhTrangPhong,
        items: items
      })
      setShowSuccess(true)
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Lỗi lưu biên bản.')
    } finally {
      setSaving(false)
    }
  }

  // Lấy ngày hiện tại
  const today = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date())

  return (
    <section style={S.page}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '8px' }}>Chọn hợp đồng / <strong>Biên bản bàn giao</strong></div>
          <h2 style={{ fontSize: '24px', margin: '0 0 6px 0', color: '#111827' }}>Lập biên bản bàn giao phòng/giường</h2>
        </div>
        <div style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', backgroundColor: '#fff', fontSize: '14px', fontWeight: 600 }}>
          📅 {today}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* CỘT TRÁI: THÔNG TIN KHÁCH HÀNG */}
        <div style={{ width: '320px', backgroundColor: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e5e7eb', height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📄</div>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#1f2937' }}>Thông tin Khách Hàng</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Mã hợp đồng</span>
              <strong style={{ color: '#111827' }}>{contract.ma_hdt}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Khách hàng</span>
              <strong style={{ color: '#111827' }}>{contract.ten_khach_hang}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Phòng/Giường</span>
              <strong style={{ color: '#111827' }}>{contract.phong_giuong}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Ngày bàn giao</span>
              <strong style={{ color: '#111827' }}>{today}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6b7280' }}>Trạng thái</span>
              <span style={{ color: '#059669', backgroundColor: '#d1fae5', padding: '4px 10px', borderRadius: '99px', fontSize: '13px', fontWeight: 600 }}>● Hợp lệ</span>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: FORM CẬP NHẬT */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card 1: Tình trạng phòng */}
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🧹 Tình trạng phòng
            </h3>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div 
                onClick={() => setTinhTrangPhong('Sạch')}
                style={{ flex: 1, padding: '12px 16px', border: tinhTrangPhong === 'Sạch' ? '2px solid #3b4f27' : '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, backgroundColor: tinhTrangPhong === 'Sạch' ? '#f8faf6' : '#fff' }}
              >
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: tinhTrangPhong === 'Sạch' ? '5px solid #3b4f27' : '1px solid #ccc', boxSizing: 'border-box' }}/>
                Sạch
              </div>
              <div 
                 onClick={() => setTinhTrangPhong('Chưa sạch')}
                style={{ flex: 1, padding: '12px 16px', border: tinhTrangPhong === 'Chưa sạch' ? '2px solid #3b4f27' : '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, backgroundColor: tinhTrangPhong === 'Chưa sạch' ? '#f8faf6' : '#fff' }}
              >
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: tinhTrangPhong === 'Chưa sạch' ? '5px solid #3b4f27' : '1px solid #ccc', boxSizing: 'border-box' }}/>
                Chưa sạch
              </div>
            </div>
          </div>

          {/* Card 2: Vật dụng */}
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>📦 Vật dụng bàn giao</h3>
              <span style={{ fontSize: '13px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '4px 12px', borderRadius: '99px' }}>{items.length} items</span>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>THÊM VẬT DỤNG MỚI</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <select 
                  style={{ flex: 1, padding: '10px 16px', borderRadius: '6px', border: '1px solid #e5e7eb', outline: 'none', fontSize: '15px', color: '#111827' }}
                  value={selectedVd}
                  onChange={(e) => setSelectedVd(e.target.value)}
                >
                  <option value="">Chọn vật dụng cần thêm</option>
                  {vatDungs.map(vd => <option key={vd.ma_vd} value={vd.ma_vd}>{vd.ten_vd}</option>)}
                </select>
                <button onClick={handleAddItem} style={{ backgroundColor: '#3b4f27', color: '#fff', border: 'none', padding: '0 24px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>+ Thêm</button>
              </div>
            </div>

            {/* Bảng danh sách items */}
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: '13px' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>Tên vật dụng</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600 }}>SL</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600 }}>Tình trạng</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600 }}>Đã duyệt</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && <tr><td colSpan="4" style={{ padding: '24px', color: '#9ca3af' }}>Chưa có vật dụng nào.</td></tr>}
                {items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '16px 8px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>{item.ten_vd}</td>
                    <td style={{ padding: '16px 8px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                        <button onClick={() => updateItem(idx, 'so_luong', Math.max(1, item.so_luong - 1))} style={{ width: '32px', height: '32px', border: 'none', background: '#fff', cursor: 'pointer', fontSize: '18px', color: '#6b7280' }}>-</button>
                        <input type="text" value={item.so_luong} readOnly style={{ width: '32px', height: '32px', border: 'none', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', textAlign: 'center', outline: 'none', fontWeight: 600 }} />
                        <button onClick={() => updateItem(idx, 'so_luong', item.so_luong + 1)} style={{ width: '32px', height: '32px', border: 'none', background: '#fff', cursor: 'pointer', fontSize: '16px', color: '#6b7280' }}>+</button>
                      </div>
                    </td>
                    <td style={{ padding: '16px 8px' }}>
                      <input 
                        type="text" 
                        value={item.tinh_trang}
                        onChange={(e) => updateItem(idx, 'tinh_trang', e.target.value)}
                        style={{ width: '80px', padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', outline: 'none', textAlign: 'center', color: '#2563eb', fontWeight: 600, backgroundColor: '#eff6ff' }}
                      />
                    </td>
                    <td style={{ padding: '16px 8px' }}>
                      <input 
                        type="checkbox" 
                        checked={item.da_duyet}
                        onChange={(e) => updateItem(idx, 'da_duyet', e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cảnh báo Notice */}
          <div style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>ⓘ</span> Notice: Vui lòng xác nhận trạng thái "Đã duyệt" cùng Khách hàng trước khi lưu biên bản.
          </div>
          {errorMsg && <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}>❌ {errorMsg}</div>}

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <button onClick={onBack} style={{ padding: '12px 24px', backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
              ← Quay lại danh sách
            </button>
            <button onClick={handleSave} disabled={saving} style={{ padding: '12px 48px', backgroundColor: '#3b4f27', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', color: '#fff', fontSize: '15px' }}>
              {saving ? 'Đang lưu...' : '💾 Lưu biên bản'}
            </button>
          </div>

        </div>
      </div>

      {showSuccess && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '12px', textAlign: 'center', width: '300px' }}>
            <div style={{ fontSize: '48px', color: '#e7eae9', marginBottom: '16px' }}>✓</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#111827' }}>Thành công!</h3>
            <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: '14px' }}>Biên bản bàn giao đã được lưu.</p>
            <button onClick={onBack} style={{ width: '100%', padding: '12px', backgroundColor: '#3b4f27', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
             ← Đóng & Quay lại danh sách
            </button>
          </div>
        </div>
      )}
    </section>
  )
}



function FormXemChiTiet({ data, onBack }) {
  const { contract, items } = data;
  const tinhTrangPhong = contract.tinh_trang_vs || 'Sạch';
  const ngayBanGiao = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(contract.ngay_bg));

  return (
    <section style={S.page}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '8px' }}>Chọn hợp đồng / <strong>Biên bản bàn giao</strong></div>
          <h2 style={{ fontSize: '24px', margin: '0 0 6px 0', color: '#111827' }}>Chi tiết biên bản bàn giao</h2>
        </div>
        <div style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', backgroundColor: '#fff', fontSize: '14px', fontWeight: 600 }}>
          📅 {ngayBanGiao}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* CỘT TRÁI: THÔNG TIN KHÁCH HÀNG */}
        <div style={{ width: '320px', backgroundColor: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e5e7eb', height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📄</div>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#1f2937' }}>Thông tin Khách Hàng</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Mã hợp đồng</span>
              <strong style={{ color: '#111827' }}>{contract.ma_hdt}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Khách hàng</span>
              <strong style={{ color: '#111827' }}>{contract.ten_khach_hang}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Phòng/Giường</span>
              <strong style={{ color: '#111827' }}>{contract.phong_giuong}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Ngày bàn giao</span>
              <strong style={{ color: '#111827' }}>{ngayBanGiao}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6b7280' }}>Trạng thái</span>
              <span style={{ color: '#059669', backgroundColor: '#d1fae5', padding: '4px 10px', borderRadius: '99px', fontSize: '13px', fontWeight: 600 }}>
                ● {contract.trang_thai_phieu_thu || 'Hợp lệ'}
              </span>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: CHI TIẾT (READ ONLY) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card 1: Tình trạng phòng */}
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🧹 Tình trạng phòng ban đầu
            </h3>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div 
                style={{ flex: 1, padding: '12px 16px', border: tinhTrangPhong === 'Sạch' ? '2px solid #3b4f27' : '1px solid #e5e7eb', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, backgroundColor: tinhTrangPhong === 'Sạch' ? '#f8faf6' : '#f9fafb', opacity: tinhTrangPhong === 'Sạch' ? 1 : 0.5 }}
              >
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: tinhTrangPhong === 'Sạch' ? '5px solid #3b4f27' : '1px solid #ccc', boxSizing: 'border-box' }}/>
                Sạch
              </div>
              <div 
                style={{ flex: 1, padding: '12px 16px', border: tinhTrangPhong === 'Chưa sạch' ? '2px solid #3b4f27' : '1px solid #e5e7eb', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, color: tinhTrangPhong === 'Chưa sạch' ? '#111827' : '#6b7280', backgroundColor: tinhTrangPhong === 'Chưa sạch' ? '#f8faf6' : '#f9fafb', opacity: tinhTrangPhong === 'Chưa sạch' ? 1 : 0.5 }}
              >
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: tinhTrangPhong === 'Chưa sạch' ? '5px solid #3b4f27' : '1px solid #ccc', boxSizing: 'border-box' }}/>
                Chưa sạch
              </div>
            </div>
          </div>

          {/* Card 2: Vật dụng */}
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>📦 Vật dụng đã bàn giao</h3>
              <span style={{ fontSize: '13px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '4px 12px', borderRadius: '99px' }}>{items.length} items</span>
            </div>

            {/* Bảng danh sách items (Read Only) */}
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: '13px' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>Tên vật dụng</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600 }}>SL</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600 }}>Tình trạng</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600 }}>Đã duyệt</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && <tr><td colSpan="4" style={{ padding: '24px', color: '#9ca3af' }}>Không có vật dụng.</td></tr>}
                {items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '16px 8px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>{item.ten_vd}</td>
                    <td style={{ padding: '16px 8px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#f9fafb' }}>
                        <span style={{ width: '60px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: '#4b5563' }}>{item.so_luong}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 8px' }}>
                      <span style={{ display: 'inline-block', minWidth: '60px', padding: '4px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', textAlign: 'center', color: '#2563eb', fontWeight: 600, backgroundColor: '#eff6ff', fontSize: '14px' }}>
                        {item.tinh_trang}
                      </span>
                    </td>
                    <td style={{ padding: '16px 8px' }}>
                      <input type="checkbox" checked={true} readOnly disabled style={{ width: '18px', height: '18px' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

       
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '8px' }}>
            <button onClick={onBack} style={{ padding: '12px 24px', backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
              ← Quay lại danh sách
            </button>
          </div>

        </div>
      </div>
    </section>
  )
}