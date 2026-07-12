import { useEffect, useMemo, useState } from 'react'
import PageTitle from '../../components/common/PageTitle.jsx'

// FRONTEND MOCK TRƯỚC
// Sau này có backend thì thay mấy mảng này bằng api.get(...)
const MOCK_CUSTOMERS = [
  {
    ma_kh: 'KH001',
    ten_kh: 'Nguyễn Văn An',
    cccd: '012345678901',
    sdt: '0901234567',

    // Backend sau này trả cảnh báo thì mới hiện dòng vàng.
    // Không có cảnh báo thì để chuỗi rỗng.
    canh_bao: '',
  },
  {
    ma_kh: 'KH002',
    ten_kh: 'Trần Thị Bình',
    cccd: '0123456789',
    sdt: '0987654321',
    canh_bao: '',
  },
]

const MOCK_HISTORY_TODAY = []

const IconSearch = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

function ConfirmDialog({ onCancel, onConfirm, submitting }) {
  return (
    <div style={S.overlay}>
      <div style={S.confirmBox}>
        <h3 style={S.confirmTitle}>Xác nhận tạo biên bản</h3>

        <p style={S.confirmBody}>
          Bạn có muốn tạo biên bản bồi thường?
        </p>

        <div style={S.confirmFooter}>
          <button
            type="button"
            style={S.btnSecondary}
            onClick={onCancel}
            disabled={submitting}
          >
            Hủy
          </button>

          <button
            type="button"
            style={S.btnPrimary}
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting ? 'Đang lưu…' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CustomerSearchView({
  keyword,
  setKeyword,
  customers,
  historyToday,
  onSearch,
  onSelectCustomer,
}) {
  return (
    <section>
      <div style={{ marginBottom: '16px' }}>
        <PageTitle
          title="Ghi nhận bồi thường"
          description="Tạo biên bản bồi thường cho khách hàng làm mất thẻ ra vào hoặc chìa khóa."
        />
      </div>

      <div style={S.card}>
        <div style={S.searchRow}>
          <div style={S.searchInputWrap}>
            <span style={S.searchIcon}>
              <IconSearch />
            </span>

            <input
              style={S.inputSearch}
              placeholder="Nhập CCCD, tên khách hàng hoặc số điện thoại"
              value={keyword}
              onChange={event => setKeyword(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  onSearch()
                }
              }}
            />
          </div>

          <button
            type="button"
            style={S.btnSearch}
            onClick={onSearch}
          >
            Tìm kiếm
          </button>
        </div>

        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Mã khách hàng</th>
                <th style={S.th}>Tên khách hàng</th>
                <th style={S.th}>CCCD</th>
                <th style={S.th}>Số điện thoại</th>
                <th style={{ ...S.th, textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={S.emptyCell}>
                    Không tìm thấy khách hàng.
                  </td>
                </tr>
              ) : (
                customers.map(customer => (
                  <tr key={customer.ma_kh} style={S.tr}>
                    <td style={S.td}>
                      <strong>{customer.ma_kh}</strong>
                    </td>

                    <td style={S.td}>{customer.ten_kh}</td>

                    <td style={S.td}>{customer.cccd}</td>

                    <td style={S.td}>{customer.sdt}</td>

                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <button
                        type="button"
                        style={S.btnChoose}
                        onClick={() => onSelectCustomer(customer)}
                      >
                        Chọn
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: '18px', marginBottom: '12px' }}>
        <PageTitle
          title="Lịch sử ghi nhận bồi thường"
          description="Xem chi tiết các biên bản bồi thường đã được ghi nhận."
        />
      </div>

      <div style={S.card}>
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Mã phiếu thu</th>
                <th style={S.th}>Tên khách hàng</th>
                <th style={S.th}>Ngày thanh toán</th>
                <th style={S.th}>Loại phiếu thu</th>
                <th style={S.th}>Trạng thái</th>
                <th style={{ ...S.th, textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {historyToday.length === 0 ? (
                <tr>
                  <td colSpan="6" style={S.emptyCell}>
                    Chưa có biên bản bồi thường nào trong hôm nay.
                  </td>
                </tr>
              ) : (
                historyToday.map(item => (
                  <tr key={item.ma_phieu_thu} style={S.tr}>
                    <td style={S.td}>
                      <strong>{item.ma_phieu_thu}</strong>
                    </td>

                    <td style={S.td}>{item.ten_kh}</td>

                    <td style={S.td}>{item.ngay_thanh_toan || '—'}</td>

                    <td style={S.td}>{item.loai_phieu_thu}</td>

                    <td style={S.td}>{item.trang_thai}</td>

                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <button type="button" style={S.btnChoose}>
                        Xem
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function CompensationDetailView({
  customer,
  onCancel,
  onCreate,
  submitting,
}) {
  const [showConfirm, setShowConfirm] = useState(false)

  const todayText = useMemo(() => {
    return new Intl.DateTimeFormat('vi-VN').format(new Date())
  }, [])

  const handleConfirmCreate = async () => {
    await onCreate({
      ma_kh: customer.ma_kh,
      loai_vi_pham: 'Mất thẻ hoặc chìa khóa',
    })

    setShowConfirm(false)
  }

  return (
    <section>
      <div style={S.breadcrumb}>
        Chọn khách hàng <span>/</span> Ghi nhận chi tiết bồi thường
      </div>

      <div style={{ marginBottom: '14px' }}>
        <PageTitle
          title="Ghi nhận bồi thường mất thẻ/chìa khóa"
          description="Quản lý thông tin bồi thường đối với thẻ hoặc chìa khóa bị thất lạc."
        />
      </div>

      <div style={S.detailCard}>
        <h3 style={S.sectionTitle}>THÔNG TIN KHÁCH HÀNG</h3>

        <div style={S.customerInfoGrid}>
          <div>
            <p style={S.infoLabel}>HỌ TÊN KHÁCH HÀNG</p>
            <strong style={S.infoValue}>{customer.ten_kh}</strong>
          </div>

          <div>
            <p style={S.infoLabel}>CCCD</p>
            <strong style={S.infoValue}>{customer.cccd}</strong>
          </div>

          <div>
            <p style={S.infoLabel}>SỐ ĐIỆN THOẠI</p>
            <strong style={S.infoValue}>{customer.sdt}</strong>
          </div>

          <div>
            <p style={S.infoLabel}>NGÀY</p>
            <strong style={S.infoValue}>{todayText}</strong>
          </div>
        </div>

        <div style={S.divider} />

        <h3 style={S.sectionTitle}>CHI TIẾT BỒI THƯỜNG</h3>

        <div style={S.formGroup}>
          <label style={S.label}>Loại vi phạm</label>

          <input
            style={S.inputNormal}
            value="Mất thẻ hoặc chìa khóa"
            readOnly
          />
        </div>

        {/* Không hiện cố định.
            Sau này backend trả customer.canh_bao thì mới hiện. */}
        {customer.canh_bao && (
          <div style={S.warningBox}>
            {customer.canh_bao}
          </div>
        )}
      </div>

      <div style={S.bottomBar}>
        <button
          type="button"
          style={S.btnSecondary}
          onClick={onCancel}
          disabled={submitting}
        >
          Hủy
        </button>

        <button
          type="button"
          style={S.btnPrimary}
          onClick={() => setShowConfirm(true)}
          disabled={submitting}
        >
          Tạo biên bản bồi thường
        </button>
      </div>

      {showConfirm && (
        <ConfirmDialog
          onCancel={() => setShowConfirm(false)}
          onConfirm={handleConfirmCreate}
          submitting={submitting}
        />
      )}
    </section>
  )
}

export default function BoiThuongPage() {
  const [view, setView] = useState('list')
  const [keyword, setKeyword] = useState('')
  const [customers, setCustomers] = useState([])
  const [historyToday, setHistoryToday] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })

    setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  useEffect(() => {
    setCustomers(MOCK_CUSTOMERS)
    setHistoryToday(MOCK_HISTORY_TODAY)
  }, [])

  const handleSearch = () => {
    const q = keyword.trim().toLowerCase()

    if (!q) {
      setCustomers(MOCK_CUSTOMERS)
      return
    }

    const result = MOCK_CUSTOMERS.filter(customer => {
      return (
        customer.ma_kh.toLowerCase().includes(q) ||
        customer.ten_kh.toLowerCase().includes(q) ||
        customer.cccd.toLowerCase().includes(q) ||
        customer.sdt.toLowerCase().includes(q)
      )
    })

    setCustomers(result)
  }

  const handleSelectCustomer = customer => {
    setSelectedCustomer(customer)
    setView('detail')
  }

  const handleCreateCompensation = async payload => {
    setSubmitting(true)

    try {
      console.log('Tạo biên bản bồi thường frontend mock:', payload)

      const now = new Date()

      const fakeReceiptCode = `PTBT_TEMP_${String(
        historyToday.length + 1
      ).padStart(3, '0')}`

      const newHistoryItem = {
        ma_phieu_thu: fakeReceiptCode,
        ten_kh: selectedCustomer.ten_kh,
        ngay_thanh_toan: new Intl.DateTimeFormat('vi-VN').format(now),
        loai_phieu_thu: 'Bồi thường',
        trang_thai: 'Đã ghi nhận',
      }

      setHistoryToday(current => [
        newHistoryItem,
        ...current,
      ])

      showToast('Tạo biên bản bồi thường thành công.')

      setSelectedCustomer(null)
      setView('list')
    } catch {
      showToast('Không thể tạo biên bản bồi thường.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (view === 'detail' && selectedCustomer) {
    return (
      <>
        <CompensationDetailView
          customer={selectedCustomer}
          onCancel={() => {
            setSelectedCustomer(null)
            setView('list')
          }}
          onCreate={handleCreateCompensation}
          submitting={submitting}
        />

        {toast && (
          <div
            style={{
              ...S.toast,
              ...(toast.type === 'error'
                ? S.toastError
                : S.toastSuccess),
            }}
          >
            {toast.message}
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <CustomerSearchView
        keyword={keyword}
        setKeyword={setKeyword}
        customers={customers}
        historyToday={historyToday}
        onSearch={handleSearch}
        onSelectCustomer={handleSelectCustomer}
      />

      {toast && (
        <div
          style={{
            ...S.toast,
            ...(toast.type === 'error'
              ? S.toastError
              : S.toastSuccess),
          }}
        >
          {toast.message}
        </div>
      )}
    </>
  )
}

const S = {
  card: {
    backgroundColor: '#fff',
    border: '1px solid #dde3d8',
    borderRadius: '8px',
    padding: '16px',
  },

  searchRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '16px',
  },

  searchInputWrap: {
    position: 'relative',
    flex: 1,
  },

  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#6b7560',
    display: 'inline-flex',
  },

  inputSearch: {
    width: '100%',
    height: '42px',
    boxSizing: 'border-box',
    padding: '10px 14px 10px 38px',
    border: '1.5px solid #cfd6c9',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: '#1a1f14',
    outline: 'none',
    backgroundColor: '#fff',
  },

  inputNormal: {
    width: '100%',
    height: '42px',
    boxSizing: 'border-box',
    padding: '10px 14px',
    border: '1.5px solid #cfd6c9',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: '#1a1f14',
    outline: 'none',
    backgroundColor: '#fff',
  },

  btnSearch: {
    width: '100px',
    height: '42px',
    backgroundColor: '#3b4f27',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  tableWrap: {
    border: '1px solid #dde3d8',
    borderRadius: '4px',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },

  th: {
    padding: '13px 18px',
    textAlign: 'left',
    backgroundColor: '#f5f6f3',
    color: '#6b7560',
    fontWeight: 700,
    fontSize: '12px',
    borderBottom: '1px solid #dde3d8',
  },

  tr: {
    borderBottom: '1px solid #eef0eb',
  },

  td: {
    padding: '13px 18px',
    color: '#1a1f14',
    verticalAlign: 'middle',
  },

  emptyCell: {
    padding: '28px',
    color: '#8b9285',
    textAlign: 'center',
    fontSize: '14px',
  },

  btnChoose: {
    minWidth: '66px',
    height: '30px',
    padding: '0 14px',
    backgroundColor: '#3b4f27',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 700,
    fontSize: '12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  breadcrumb: {
    fontSize: '13px',
    color: '#6b7560',
    marginBottom: '6px',
  },

  detailCard: {
    backgroundColor: '#fff',
    border: '1px solid #cfd6c9',
    borderRadius: '8px',
    padding: '24px 26px',
  },

  sectionTitle: {
    margin: '0 0 18px',
    color: '#1a1f14',
    fontSize: '22px',
    fontWeight: 800,
  },

  customerInfoGrid: {
    display: 'grid',
    gridTemplateColumns: '1.3fr 1fr 1fr 1fr',
    gap: '22px',
  },

  infoLabel: {
    margin: '0 0 4px',
    color: '#6b7560',
    fontSize: '11px',
    fontWeight: 700,
  },

  infoValue: {
    color: '#1a1f14',
    fontSize: '14px',
    fontWeight: 700,
  },

  divider: {
    borderTop: '1px solid #cfd6c9',
    margin: '18px 0',
  },

  formGroup: {
    marginBottom: '16px',
  },

  label: {
    display: 'block',
    fontSize: '13.5px',
    fontWeight: 600,
    color: '#1a1f14',
    marginBottom: '7px',
  },

  warningBox: {
    marginTop: '14px',
    padding: '14px 16px',
    backgroundColor: '#f3ffa2',
    border: '1px solid #cbd96a',
    borderRadius: '4px',
    color: '#1a1f14',
    fontSize: '14px',
    fontWeight: 700,
    textTransform: 'uppercase',
  },

  bottomBar: {
    position: 'fixed',
    left: '280px',
    right: '0',
    bottom: '0',
    minHeight: '72px',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '12px',
    padding: '0 24px',
    borderTop: '1px solid #dde3d8',
    backgroundColor: '#fff',
    zIndex: 50,
  },

  btnSecondary: {
    padding: '9px 20px',
    backgroundColor: '#fff',
    color: '#1a1f14',
    border: '1.5px solid #cfd6c9',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  btnPrimary: {
    padding: '10px 22px',
    backgroundColor: '#3b4f27',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },

  confirmBox: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: '380px',
    padding: '28px 28px 24px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
  },

  confirmTitle: {
    margin: '0 0 12px',
    fontSize: '16px',
    fontWeight: 700,
    color: '#1a1f14',
  },

  confirmBody: {
    margin: '0 0 24px',
    fontSize: '14px',
    color: '#4a4a4a',
    lineHeight: 1.6,
  },

  confirmFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },

  toast: {
    position: 'fixed',
    top: '90px',
    right: '24px',
    padding: '12px 20px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    zIndex: 2000,
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  },

  toastSuccess: {
    backgroundColor: '#2e7d32',
    color: '#fff',
  },

  toastError: {
    backgroundColor: '#c0392b',
    color: '#fff',
  },
}