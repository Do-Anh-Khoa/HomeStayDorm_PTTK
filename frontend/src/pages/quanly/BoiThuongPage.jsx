import { useEffect, useMemo, useState } from 'react'
import PageTitle from '../../components/common/PageTitle.jsx'
import api from '../../services/api.js'

const normalizeText = value => {
  return String(value || '')
    .trim()
    .toLowerCase()
}

const formatDate = value => {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('vi-VN').format(date)
}

const getErrorMessage = error => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Đã có lỗi xảy ra.'
  )
}

function EmptyRow({ colSpan, text }) {
  return (
    <tr>
      <td colSpan={colSpan} style={S.emptyCell}>
        {text}
      </td>
    </tr>
  )
}

function WarningBox({ message }) {
  if (!message) {
    return null
  }

  return (
    <div style={S.warningBox}>
      {message}
    </div>
  )
}

function SuccessPopup({ onBack }) {
  return (
    <div style={S.successOverlay}>
      <div style={S.successBox}>
        <div style={S.successIcon}>✓</div>

        <h3 style={S.successTitle}>Ghi nhận thành công</h3>

        <p style={S.successText}>
          Biên bản bồi thường đã được hệ thống ghi nhận thành công.
        </p>

        <button type="button" style={S.btnSuccessBack} onClick={onBack}>
          ← Quay lại danh sách
        </button>
      </div>
    </div>
  )
}


function ConfirmPopup({ saving, onCancel, onConfirm }) {
  return (
    <div style={S.confirmOverlay}>
      <div style={S.confirmBox}>
        <h3 style={S.confirmTitle}>Xác nhận ghi nhận</h3>

        <p style={S.confirmText}>
          Bạn có chắc chắn muốn ghi nhận biên bản bồi thường của khách hàng này không?
        </p>

        <div style={S.confirmFooter}>
          <button type="button" style={S.btnConfirmCancel} onClick={onCancel}>
            Hủy
          </button>

          <button type="button" style={S.btnConfirmOk} disabled={saving} onClick={onConfirm}>
            {saving ? 'Đang lưu...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CustomerTable({ rows, loading, onSelect }) {
  return (
    <div style={S.tableWrap}>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Mã khách hàng</th>
            <th style={S.th}>Tên khách hàng</th>
            <th style={S.th}>CCCD</th>
            <th style={S.th}>Số điện thoại</th>
            <th style={S.th}>Mã phòng</th>
            <th style={{ ...S.th, textAlign: 'center' }}>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <EmptyRow colSpan={6} text="Đang tải dữ liệu..." />
          ) : rows.length === 0 ? (
            <EmptyRow colSpan={6} text="Không có khách hàng phù hợp." />
          ) : (
            rows.map(row => (
              <tr key={row.ma_kh} style={S.tr}>
                <td style={S.td}>
                  <strong>{row.ma_kh}</strong>
                </td>
                <td style={S.td}>{row.ten_khach_hang}</td>
                <td style={S.td}>{row.cccd}</td>
                <td style={S.td}>{row.sdt}</td>
                <td style={S.td}>
                  <strong>{row.ma_phong || 'Chưa có'}</strong>
                </td>
                <td style={{ ...S.td, textAlign: 'center' }}>
                  <button type="button" style={S.btnAction} onClick={() => onSelect(row)}>
                    Chọn
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function HistoryTable({ rows, loading, onViewDetail }) {
  return (
    <div style={S.tableWrap}>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Mã bồi thường</th>
            <th style={S.th}>Mã khách hàng</th>
            <th style={S.th}>Tên khách hàng</th>
            <th style={S.th}>Mã phòng</th>
            <th style={S.th}>Ngày ghi nhận</th>
            <th style={{ ...S.th, textAlign: 'center' }}>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <EmptyRow colSpan={6} text="Đang tải dữ liệu..." />
          ) : rows.length === 0 ? (
            <EmptyRow colSpan={6} text="Chưa có biên bản bồi thường nào trong hôm nay." />
          ) : (
            rows.map(row => (
              <tr key={row.ma_bt} style={S.tr}>
              <td style={S.td}>
              <strong>{row.ma_bt}</strong>
              </td>

            <td style={S.td}>
              <strong>{row.ma_kh}</strong>
            </td>

            <td style={S.td}>{row.ten_khach_hang}</td>

            <td style={S.td}>
              <strong>{row.ma_phong || 'Chưa có'}</strong>
            </td>

            <td style={S.td}>{formatDate(row.ngay_bt)}</td>

            <td style={{ ...S.td, textAlign: 'center' }}>
    <button type="button" style={S.btnAction} onClick={() => onViewDetail(row)}>
      Xem chi tiết
    </button>
  </td>
</tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function DetailView({
  customer,
  historyItem,
  mode,
  saving,
  showConfirm,
  showSuccess,
  onCancel,
  onSave,
  onCancelConfirm,
  onConfirmSave,
  onSuccessBack,
}) {
  const isHistory = mode === 'history'
  const displayCustomer = customer || historyItem
  const warningMessage = displayCustomer?.canh_bao || null

  return (
    <section style={S.page}>
      <div style={S.breadcrumb}>
        Chọn khách hàng <span>/</span>{' '}
        {isHistory ? 'Chi tiết bồi thường' : 'Ghi nhận chi tiết bồi thường'}
      </div>

      <PageTitle
        title="Ghi nhận bồi thường mất thẻ/chìa khóa"
        description="Quản lý thông tin bồi thường đối với thẻ hoặc chìa khóa bị thất lạc."
      />

      <div style={S.detailCard}>
        <h2 style={S.sectionTitle}>THÔNG TIN KHÁCH HÀNG</h2>

        <div style={S.customerInfoGrid}>
          <div>
            <div style={S.infoLabel}>HỌ TÊN KHÁCH HÀNG</div>
            <div style={S.infoValue}>{displayCustomer.ten_khach_hang}</div>
          </div>

          <div>
            <div style={S.infoLabel}>CCCD</div>
            <div style={S.infoValue}>{displayCustomer.cccd}</div>
          </div>

          <div>
            <div style={S.infoLabel}>SỐ ĐIỆN THOẠI</div>
            <div style={S.infoValue}>{displayCustomer.sdt || 'Chưa có'}</div>
          </div>

          <div>
            <div style={S.infoLabel}>MÃ PHÒNG</div>
            <div style={S.infoValue}>{displayCustomer.ma_phong || 'Chưa có'}</div>
          </div>

          <div>
            <div style={S.infoLabel}>NGÀY</div>
            <div style={S.infoValue}>
              {isHistory ? formatDate(historyItem.ngay_bt) : formatDate(new Date())}
            </div>
          </div>
        </div>

        <div style={S.divider} />

        <h2 style={S.sectionTitle}>CHI TIẾT BỒI THƯỜNG</h2>

        <label style={S.formLabel}>Loại vi phạm</label>
        <input
          style={S.readonlyInput}
          value="Mất thẻ ra vào ký túc xá"
          readOnly
        />

        <WarningBox message={warningMessage} />
      </div>

      <div style={S.footerBar}>
        <button type="button" style={S.btnCancel} onClick={onCancel}>
          Hủy
        </button>

        {!isHistory && (
          <button type="button" style={S.btnCreate} disabled={saving} onClick={onSave}>
            Tạo biên bản bồi thường
          </button>
        )}
      </div>

      {showConfirm && (
        <ConfirmPopup
          saving={saving}
          onCancel={onCancelConfirm}
          onConfirm={onConfirmSave}
        />
      )}

      {showSuccess && (
        <SuccessPopup onBack={onSuccessBack} />
      )}
    </section>
  )
}

export default function BoiThuongPage() {
  const [view, setView] = useState('list')
  const [mode, setMode] = useState('record')

  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')

  const [customers, setCustomers] = useState([])
  const [historyRows, setHistoryRows] = useState([])
  const [loading, setLoading] = useState(false)

  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [selectedHistory, setSelectedHistory] = useState(null)

  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const fetchData = async () => {
    setLoading(true)

    try {
      const response = await api.get('/boi-thuong')
      const data = response.data?.data || response.data || {}

      setCustomers(Array.isArray(data.customers) ? data.customers : [])
      setHistoryRows(Array.isArray(data.history) ? data.history : [])
    } catch (error) {
      console.error(error)
      window.alert(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredCustomers = useMemo(() => {
  const keyword = normalizeText(appliedSearch)

  if (!keyword) {
    return customers
  }

  return customers.filter(row => {
    return (
      normalizeText(row.ma_kh).includes(keyword) ||
      normalizeText(row.cccd).includes(keyword) ||
      normalizeText(row.sdt).includes(keyword)
    )
  })
}, [customers, appliedSearch])

  const handleSearch = () => {
    setAppliedSearch(search)
  }

  const handleSelectCustomer = row => {
    setSelectedCustomer(row)
    setSelectedHistory(null)
    setMode('record')
    setShowConfirm(false)
    setShowSuccess(false)
    setView('detail')
  }

  const handleViewHistory = row => {
    setSelectedHistory(row)
    setSelectedCustomer(null)
    setMode('history')
    setShowConfirm(false)
    setShowSuccess(false)
    setView('detail')
  }

  const resetDetail = () => {
    setView('list')
    setSelectedCustomer(null)
    setSelectedHistory(null)
    setShowConfirm(false)
    setShowSuccess(false)
  }

  const handleOpenConfirm = () => {
    setShowConfirm(true)
  }

  const handleConfirmSave = async () => {
    if (!selectedCustomer) return

    setSaving(true)

    try {
      await api.post('/boi-thuong', {
        ma_kh: selectedCustomer.ma_kh,
      })

      setShowConfirm(false)
      setShowSuccess(true)
    } catch (error) {
      console.error(error)
      window.alert(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleSuccessBack = async () => {
    resetDetail()
    await fetchData()
  }

  if (view === 'detail') {
    return (
      <DetailView
        customer={selectedCustomer}
        historyItem={selectedHistory}
        mode={mode}
        saving={saving}
        showConfirm={showConfirm}
        showSuccess={showSuccess}
        onCancel={resetDetail}
        onSave={handleOpenConfirm}
        onCancelConfirm={() => setShowConfirm(false)}
        onConfirmSave={handleConfirmSave}
        onSuccessBack={handleSuccessBack}
      />
    )
  }

  return (
    <section style={S.page}>
      <PageTitle
        title="Ghi nhận bồi thường"
        description="Tạo biên bản bồi thường cho khách hàng làm mất thẻ ra vào hoặc chìa khóa."
      />

      <div style={S.card}>
        <div style={S.searchRow}>
          <div style={S.searchInputWrap}>
            <span style={S.searchIcon}>⌕</span>

            <input
              style={S.searchInput}
              value={search}
              onChange={event => setSearch(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  handleSearch()
                }
              }}
              placeholder="Nhập mã khách hàng, CCCD hoặc số điện thoại"
            />
          </div>

          <button type="button" style={S.btnSearch} onClick={handleSearch}>
            Tìm kiếm
          </button>
        </div>

        <CustomerTable
          rows={filteredCustomers}
          loading={loading}
          onSelect={handleSelectCustomer}
        />
      </div>

      <div style={S.historyHeader}>
        <PageTitle
          title="Lịch sử ghi nhận bồi thường"
          description="Xem chi tiết các biên bản bồi thường đã được ghi nhận."
        />
      </div>

      <div style={S.card}>
        <HistoryTable
          rows={historyRows}
          loading={loading}
          onViewDetail={handleViewHistory}
        />
      </div>
    </section>
  )
}

const S = {
  page: {
    padding: '0',
  },

  breadcrumb: {
    marginBottom: '8px',
    color: '#6b7560',
    fontSize: '13px',
    fontWeight: 700,
  },

  card: {
    border: '1px solid #d9ded4',
    borderRadius: '8px',
    padding: '18px',
    backgroundColor: '#fff',
    marginTop: '16px',
    marginBottom: '24px',
  },

  searchRow: {
    display: 'flex',
    gap: '14px',
    marginBottom: '18px',
  },

  searchInputWrap: {
    position: 'relative',
    flex: 1,
  },

  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#6b7560',
    fontSize: '24px',
    lineHeight: 1,
  },

  searchInput: {
    width: '100%',
    height: '48px',
    boxSizing: 'border-box',
    padding: '0 14px 0 44px',
    border: '1.5px solid #cfd6c9',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#1a1f14',
    fontFamily: 'inherit',
    fontSize: '15px',
    outline: 'none',
  },

  btnSearch: {
    width: '112px',
    height: '48px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#3b4f27',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer',
  },

  tableWrap: {
    maxHeight: '260px',
    overflowY: 'auto',
    overflowX: 'hidden',
    border: '1px solid #dde3d8',
    borderRadius: '4px',
    backgroundColor: '#fff',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },

  th: {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    padding: '15px 20px',
    backgroundColor: '#f8f9f7',
    color: '#626d56',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: 800,
    borderBottom: '1px solid #dde3d8',
  },

  tr: {
    borderBottom: '1px solid #eef0eb',
  },

  td: {
    padding: '14px 20px',
    color: '#11160f',
    fontSize: '15px',
    verticalAlign: 'middle',
  },

  emptyCell: {
    padding: '30px 20px',
    color: '#7a8372',
    textAlign: 'center',
    fontSize: '15px',
  },

  btnAction: {
    minWidth: '74px',
    height: '34px',
    padding: '0 14px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#3b4f27',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: '13px',
    fontWeight: 800,
    cursor: 'pointer',
  },

  historyHeader: {
    marginTop: '18px',
  },

  detailCard: {
    border: '1px solid #d9ded4',
    borderRadius: '8px',
    backgroundColor: '#fff',
    padding: '28px 30px 44px',
    marginTop: '18px',
  },

  sectionTitle: {
    margin: '0 0 24px',
    color: '#061108',
    fontSize: '23px',
    fontWeight: 900,
  },

  customerInfoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
    gap: '28px',
  },

  infoLabel: {
    color: '#626d56',
    fontSize: '12px',
    fontWeight: 900,
    marginBottom: '10px',
  },

  infoValue: {
    color: '#061108',
    fontSize: '15px',
    fontWeight: 800,
  },

  divider: {
    height: '1px',
    backgroundColor: '#d9ded4',
    margin: '26px 0 24px',
  },

  formLabel: {
    display: 'block',
    marginBottom: '10px',
    color: '#061108',
    fontSize: '14px',
    fontWeight: 800,
  },

  readonlyInput: {
    width: '100%',
    height: '48px',
    boxSizing: 'border-box',
    padding: '0 16px',
    border: '1.5px solid #cfd6c9',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#11160f',
    fontFamily: 'inherit',
    fontSize: '15px',
    outline: 'none',
  },

  warningBox: {
    marginTop: '14px',
    padding: '12px 14px',
    border: '1px solid #e3e882',
    borderRadius: '4px',
    backgroundColor: '#f1ff91',
    color: '#334414',
    fontSize: '13px',
    fontWeight: 800,
    textTransform: 'uppercase',
  },

  footerBar: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    height: '78px',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '14px',
    padding: '0 26px',
    borderTop: '1px solid #d9ded4',
    backgroundColor: '#fff',
    zIndex: 50,
  },

  btnCancel: {
    width: '76px',
    height: '44px',
    border: '1px solid #c9cfc3',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#11160f',
    fontFamily: 'inherit',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer',
  },

  btnCreate: {
    width: '236px',
    height: '44px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#3b4f27',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer',
  },


  confirmOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 35, 28, 0.28)',
  },

  confirmBox: {
    width: '430px',
    borderRadius: '8px',
    backgroundColor: '#fff',
    boxShadow: '0 18px 60px rgba(0,0,0,0.22)',
    overflow: 'hidden',
  },

  confirmTitle: {
    margin: 0,
    padding: '22px 24px 12px',
    color: '#11160f',
    fontSize: '20px',
    fontWeight: 900,
  },

  confirmText: {
    margin: 0,
    padding: '0 24px 22px',
    color: '#4f574b',
    fontSize: '14px',
    lineHeight: 1.6,
  },

  confirmFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '16px 24px',
    backgroundColor: '#f5f5f4',
  },

  btnConfirmCancel: {
    minWidth: '72px',
    height: '36px',
    border: '1px solid #c9cfc3',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#11160f',
    fontFamily: 'inherit',
    fontSize: '13px',
    fontWeight: 800,
    cursor: 'pointer',
  },

  btnConfirmOk: {
    minWidth: '86px',
    height: '36px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#3b4f27',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: '13px',
    fontWeight: 800,
    cursor: 'pointer',
  },

  successOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 35, 28, 0.28)',
  },

  successBox: {
    width: '320px',
    borderRadius: '10px',
    backgroundColor: '#fff',
    boxShadow: '0 18px 60px rgba(0,0,0,0.22)',
    padding: '28px 22px 22px',
    textAlign: 'center',
  },

  successIcon: {
    width: '48px',
    height: '48px',
    margin: '0 auto 14px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d9f9e3',
    color: '#22b65c',
    fontSize: '28px',
    fontWeight: 800,
  },

  successTitle: {
    margin: '0 0 8px',
    color: '#151915',
    fontSize: '15px',
    fontWeight: 900,
  },

  successText: {
    margin: '0 0 18px',
    color: '#4d554a',
    fontSize: '12px',
    lineHeight: 1.5,
  },

  btnSuccessBack: {
    width: '100%',
    height: '42px',
    border: 'none',
    borderRadius: '7px',
    backgroundColor: '#3b4f27',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: '13px',
    fontWeight: 800,
    cursor: 'pointer',
  },
}