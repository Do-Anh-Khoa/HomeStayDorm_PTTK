import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api.js'

const formatMoney = value => {
  const number = Number(value || 0)
  return new Intl.NumberFormat('vi-VN').format(Math.abs(number))
}

const formatSignedMoney = value => {
  const number = Number(value || 0)
  const prefix = number < 0 ? '-' : ''
  return `${prefix}${formatMoney(number)}đ`
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
    error?.response?.data?.error ||
    error?.message ||
    'Đã có lỗi xảy ra.'
  )
}

const normalizeText = value => String(value || '').trim().toLowerCase()

function EmptyRow({ colSpan, text }) {
  return (
    <tr>
      <td colSpan={colSpan} style={S.emptyCell}>
        {text}
      </td>
    </tr>
  )
}

function LastReturnWarningPopup({ data, message, onClose }) {
  return (
    <div style={S.popupOverlay}>
      <div style={S.warningPopup}>
        <div style={S.warningIcon}>!</div>

        <h2 style={S.warningTitle}>Cảnh báo: Hồ sơ trả phòng cuối cùng!</h2>

        <div style={S.warningInfoBox}>
          <div>
            <strong>Mã hồ sơ:</strong> {data?.ma_tp || 'Chưa có'}
          </div>
          <div>
            <strong>Mã phòng:</strong> {data?.ma_phong || 'Chưa có'}
          </div>
        </div>

        <p style={S.warningMessage}>
          {message ||
            'Đây là hồ sơ trả phòng cuối cùng của phòng này, vui lòng ghi nhận dịch vụ tháng cuối cho phòng trước khi lập phiếu thu.'}
        </p>

        <button type="button" style={S.btnWarningClose} onClick={onClose}>
          Đóng
        </button>
      </div>
    </div>
  )
}

function ConfirmPopup({ saving, onCancel, onConfirm }) {
  return (
    <div style={S.popupOverlay}>
      <div style={S.confirmPopup}>
        <h2 style={S.confirmTitle}>Xác nhận tạo phiếu thu</h2>

        <p style={S.confirmText}>
          Bạn có chắc chắn muốn tạo phiếu thu trả phòng cho hồ sơ này không?
        </p>

        <div style={S.confirmActions}>
          <button type="button" style={S.btnSecondary} disabled={saving} onClick={onCancel}>
            Hủy
          </button>

          <button type="button" style={S.btnPrimary} disabled={saving} onClick={onConfirm}>
            {saving ? 'Đang tạo...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  )
}


function SuccessPopup({ data, onBackToList }) {
  return (
    <div style={S.popupOverlay}>
      <div style={S.successPopup}>
        <div style={S.successIcon}>✓</div>

        <h2 style={S.successTitle}>Tạo phiếu thu thành công</h2>

        <p style={S.successMessage}>
          Phiếu thu trả phòng <strong>{data?.ma_pttp || ''}</strong> đã được tạo thành công.
        </p>

        <div style={S.successInfoBox}>
          <div>
            <strong>Mã phiếu thu:</strong> {data?.ma_pttp || 'Chưa có'}
          </div>

          <div>
            <strong>Mã hồ sơ:</strong> {data?.ma_tp || 'Chưa có'}
          </div>

          <div>
            <strong>Xuất PDF:</strong>{' '}
            {data?.pdf_processing
              ? 'Đang xuất...'
              : data?.pdf_downloaded
                ? 'Đã tải xuống'
                : data?.pdf_error
                  ? 'Xuất lỗi'
                  : 'Đang xử lý'}
          </div>

          <div>
            <strong>Gửi email:</strong> Đã được gửi tự động
          </div>
        </div>

        <button type="button" style={S.btnSuccessClose} onClick={onBackToList}>
          Quay lại danh sách
        </button>
      </div>
    </div>
  )
}

function PendingTable({ rows, loading, onCreate }) {
  return (
    <div style={S.tableWrap}>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Mã HSTP</th>
            <th style={S.th}>Mã KH</th>
            <th style={S.th}>Tên KH</th>
            <th style={S.th}>Ngày trả phòng</th>
            <th style={S.th}>Mã phòng</th>
            <th style={{ ...S.th, textAlign: 'center' }}>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <EmptyRow colSpan={6} text="Đang tải hồ sơ trả phòng..." />
          ) : rows.length === 0 ? (
            <EmptyRow colSpan={6} text="Không có hồ sơ trả phòng chờ lập phiếu thu." />
          ) : (
            rows.map(row => (
              <tr key={row.ma_tp} style={S.tr}>
                <td style={S.td}>
                  <strong>{row.ma_tp}</strong>
                </td>
                <td style={S.td}>{row.ma_khach_thue}</td>
                <td style={S.td}>{row.ten_khach_hang}</td>
                <td style={S.td}>{formatDate(row.ngay_tp)}</td>
                <td style={S.td}>
                  <strong>{row.ma_phong || 'Chưa có'}</strong>
                </td>
                <td style={{ ...S.td, textAlign: 'center' }}>
                  <button type="button" style={S.btnSmall} onClick={() => onCreate(row)}>
                    + Lập phiếu thu
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

function HistoryTable({ rows, loading, onView }) {
  return (
    <div style={S.tableWrap}>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Mã PTTP</th>
            <th style={S.th}>Mã HSTP</th>
            <th style={S.th}>Ngày lập</th>
            <th style={{ ...S.th, textAlign: 'right' }}>Tiền hoàn cọc</th>
            <th style={{ ...S.th, textAlign: 'right' }}>Tiền khấu trừ</th>
            <th style={{ ...S.th, textAlign: 'right' }}>Tổng quyết toán</th>
            <th style={{ ...S.th, textAlign: 'center' }}>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <EmptyRow colSpan={7} text="Đang tải phiếu thu đã lập hôm nay..." />
          ) : rows.length === 0 ? (
            <EmptyRow colSpan={7} text="Chưa có phiếu thu trả phòng nào được lập hôm nay." />
          ) : (
            rows.map(row => (
              <tr key={row.ma_pttp} style={S.tr}>
                <td style={S.td}>
                  <strong>{row.ma_pttp}</strong>
                </td>

                <td style={S.td}>{row.ma_tp}</td>

                <td style={S.td}>{formatDate(row.ngay)}</td>

                <td
                  style={{
                    ...S.td,
                    textAlign: 'right',
                    fontWeight: 800,
                    color: '#188642',
                  }}
                >
                  {formatMoney(row.tien_hoan_coc)}đ
                </td>

                <td
                  style={{
                    ...S.td,
                    textAlign: 'right',
                    fontWeight: 800,
                    color: '#d62828',
                  }}
                >
                  {formatMoney(row.tien_khau_tru)}đ
                </td>

                <td
                  style={{
                    ...S.td,
                    textAlign: 'right',
                    fontWeight: 900,
                    color: Number(row.tong_tien || 0) >= 0 ? '#188642' : '#d62828',
                  }}
                >
                  {formatSignedMoney(row.tong_tien)}
                </td>

                <td style={{ ...S.td, textAlign: 'center' }}>
                  <button type="button" style={S.btnIcon} title="Xem chi tiết" onClick={() => onView(row)}>
                    👁
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

function MoneyLine({ label, value, bold = false, color }) {
  return (
    <div style={S.moneyLine}>
      <span style={{ ...S.moneyLabel, ...(bold ? S.moneyBold : {}) }}>{label}</span>
      <span style={{ ...S.moneyValue, ...(bold ? S.moneyBold : {}), ...(color ? { color } : {}) }}>
        {formatSignedMoney(value)}
      </span>
    </div>
  )
}

function ItemTable({ title, rows, emptyText }) {
  return (
    <div style={S.itemSection}>
      <h3 style={S.subTitle}>{title}</h3>

      <div style={S.tableWrapLite}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Hạng mục</th>
              <th style={{ ...S.th, textAlign: 'center' }}>Số lượng</th>
              <th style={{ ...S.th, textAlign: 'right' }}>Đơn giá</th>
              <th style={{ ...S.th, textAlign: 'right' }}>Thành tiền</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <EmptyRow colSpan={4} text={emptyText} />
            ) : (
              rows.map((item, index) => (
                <tr key={item.ma_ct || item.ma_vd || index} style={S.tr}>
                  <td style={S.td}>{item.ten}</td>
                  <td style={{ ...S.td, textAlign: 'center' }}>{item.so_luong || '-'}</td>
                  <td style={{ ...S.td, textAlign: 'right' }}>{formatMoney(item.don_gia)}đ</td>
                  <td style={{ ...S.td, textAlign: 'right', fontWeight: 800 }}>
                    {formatMoney(item.thanh_tien)}đ
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DetailView({
  mode,
  data,
  saving,
  showConfirm,
  onBack,
  onOpenConfirm,
  onCancelConfirm,
  onConfirmCreate,
  onPrint,
}) {
  const isViewMode = mode === 'view'
  const tongTien = Number(data?.tong_tien || 0)
  const isRefund = tongTien >= 0
  const resultLabel = isRefund ? 'Hoàn trả' : 'Khách cần thanh toán'

  return (
    <section style={S.page}>
      <div style={S.detailCard} id="pttp-print-area">
        <div style={S.detailHeader}>
          <h1 style={S.detailTitle}>Lập Phiếu Thu Trả Phòng</h1>
          {isViewMode && <span style={S.viewBadge}>Xem lại phiếu thu</span>}
        </div>

        <h2 style={S.sectionTitle}>THÔNG TIN KHÁCH HÀNG & HỒ SƠ</h2>

        <div style={S.infoBox}>
          <div>
            <div style={S.infoLabel}>Khách hàng</div>
            <div style={S.infoValue}>{data.ten_khach_hang}</div>

            <div style={S.infoLabel}>CCCD</div>
            <div style={S.infoValue}>{data.cccd || 'Chưa có'}</div>

            <div style={S.infoLabel}>SĐT</div>
            <div style={S.infoValue}>{data.sdt || 'Chưa có'}</div>
          </div>

          <div>
            <div style={S.infoLabel}>Mã HSTP</div>
            <div style={S.infoValue}>{data.ma_tp}</div>

            <div style={S.infoLabel}>Mã phòng</div>
            <div style={S.infoValue}>{data.ma_phong || 'Chưa có'}</div>

            <div style={S.infoLabel}>Tham chiếu</div>
            <div style={S.infoValue}>{data.tham_chieu || 'Chưa có'}</div>
          </div>

          <div>
            <div style={S.infoLabel}>{isViewMode ? 'Ngày lập phiếu' : 'Ngày trả phòng'}</div>
            <div style={S.infoValue}>{formatDate(isViewMode ? data.ngay : data.ngay_tp)}</div>

            <div style={S.infoLabel}>Mã khách thuê</div>
            <div style={S.infoValue}>{data.ma_khach_thue}</div>
          </div>
        </div>

        <h2 style={S.sectionTitle}>CHI TIẾT ĐỐI SOÁT & QUYẾT TOÁN</h2>

        <div style={S.moneyBox}>
          {!isViewMode && <MoneyLine label="Tiền cọc gốc" value={data.tien_coc_goc} />}

          {!isViewMode && (
            <div style={S.ruleLine}>
              <span>Quy định hoàn cọc</span>
              <strong>
                {data.quy_dinh_hoan_coc?.ten_qd || 'Chưa có'}{' '}
                {data.quy_dinh_hoan_coc?.ty_le !== undefined
                  ? `(Hoàn ${Math.round(Number(data.quy_dinh_hoan_coc.ty_le) * 100)}%)`
                  : ''}
              </strong>
            </div>
          )}

          <MoneyLine label="Tiền hoàn cọc cơ bản" value={data.tien_hoan_coc} bold />
        </div>

        <ItemTable
          title="Vật dụng hư hại"
          rows={Array.isArray(data.vat_dung_hu_hai) ? data.vat_dung_hu_hai : []}
          emptyText="Không có vật dụng hư hại."
        />

        <ItemTable
          title="Dịch vụ tháng cuối"
          rows={Array.isArray(data.dich_vu) ? data.dich_vu : []}
          emptyText="Không có dịch vụ tháng cuối cần quyết toán."
        />

        <div style={S.totalBox}>
          <MoneyLine label="Tổng khấu trừ" value={data.tien_khau_tru} bold color="#d62828" />
        </div>

        <div style={{ ...S.resultBox, ...(isRefund ? S.resultRefund : S.resultPayMore) }}>
          {resultLabel}: {formatMoney(Math.abs(tongTien))}đ
        </div>
      </div>

      <div style={S.footerBar}>
        <button type="button" style={S.btnSecondary} disabled={saving} onClick={onBack}>
          {isViewMode ? 'Quay lại danh sách' : 'Hủy bỏ'}
        </button>

        {isViewMode ? (
          <button type="button" style={S.btnPrimary} onClick={onPrint}>
            In lại phiếu thu
          </button>
        ) : (
          <button type="button" style={S.btnPrimary} disabled={saving} onClick={onOpenConfirm}>
            Tạo & In Phiếu Thu
          </button>
        )}
      </div>

      {showConfirm && (
        <ConfirmPopup
          saving={saving}
          onCancel={onCancelConfirm}
          onConfirm={onConfirmCreate}
        />
      )}
    </section>
  )
}

export default function PhieuThuTraPhongPage() {
  const [search, setSearch] = useState('')
  const [pendingRows, setPendingRows] = useState([])
  const [historyRows, setHistoryRows] = useState([])
  const [loading, setLoading] = useState(false)

  const [view, setView] = useState('list')
  const [detailMode, setDetailMode] = useState('create')
  const [detailData, setDetailData] = useState(null)

  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [warning, setWarning] = useState(null)
  const [success, setSuccess] = useState(null)

  const filteredPending = useMemo(() => {
    const keyword = normalizeText(search)
    if (!keyword) return pendingRows

    return pendingRows.filter(row => {
      return (
        normalizeText(row.ma_tp).includes(keyword) ||
        normalizeText(row.ma_khach_thue).includes(keyword) ||
        normalizeText(row.ten_khach_hang).includes(keyword) ||
        normalizeText(row.cccd).includes(keyword) ||
        normalizeText(row.ma_pdc).includes(keyword) ||
        normalizeText(row.ma_phong).includes(keyword)
      )
    })
  }, [pendingRows, search])

  const fetchData = async () => {
    setLoading(true)

    try {
      const response = await api.get('/pt-tra-phong')
      const data = response.data || {}

      setPendingRows(Array.isArray(data.pending) ? data.pending : [])
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

  const handleCreateClick = async row => {
    try {
      const response = await api.get(`/pt-tra-phong/preview/${row.ma_tp}`)
      setDetailData(response.data)
      setDetailMode('create')
      setShowConfirm(false)
      setView('detail')
    } catch (error) {
      const data = error?.response?.data

      if (data?.code === 'LAST_RETURN_NEEDS_SERVICE') {
        setWarning({
          message: data.message,
          data: data.data,
        })
        return
      }

      console.error(error)
      window.alert(getErrorMessage(error))
    }
  }
  const handleDownloadPdf = async maPttp => {
    if (!maPttp) return false

    const response = await api.get(`/pt-tra-phong/receipt/${maPttp}/pdf`, {
      responseType: 'blob',
    })

    const blob = new Blob([response.data], {
      type: 'application/pdf',
    })

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `${maPttp}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()

    window.URL.revokeObjectURL(url)

    return true
  }
  const handleViewReceipt = async row => {
    try {
      const response = await api.get(`/pt-tra-phong/receipt/${row.ma_pttp}`)
      setDetailData(response.data)
      setDetailMode('view')
      setShowConfirm(false)
      setView('detail')
    } catch (error) {
      console.error(error)
      window.alert(getErrorMessage(error))
    }
  }

  const handleConfirmCreate = async () => {
  if (!detailData?.ma_tp) return

  setSaving(true)

  try {
    const response = await api.post(`/pt-tra-phong/${detailData.ma_tp}`)
    const createdData = response.data?.data || response.data || {}
    const maPttp = createdData.ma_pttp

    setShowConfirm(false)

    // KHÔNG quay về list ở đây
    // Giữ nguyên màn hình lập phiếu, chỉ hiện popup đè lên
    setSuccess({
      ...createdData,
      pdf_downloaded: false,
      pdf_processing: true,
      pdf_error: false,
      email_processing: true,
    })

    setSaving(false)

    // Load lại danh sách chạy nền, không chặn popup
    fetchData().catch(error => {
      console.error('Lỗi tải lại danh sách:', error)
    })

    // Tải PDF sau khi popup đã hiện
    if (maPttp) {
      handleDownloadPdf(maPttp)
        .then(() => {
          setSuccess(current => {
            if (!current || current.ma_pttp !== maPttp) return current

            return {
              ...current,
              pdf_downloaded: true,
              pdf_processing: false,
              pdf_error: false,
            }
          })
        })
        .catch(pdfError => {
          console.error('Lỗi tải PDF phiếu thu trả phòng:', pdfError)

          setSuccess(current => {
            if (!current || current.ma_pttp !== maPttp) return current

            return {
              ...current,
              pdf_downloaded: false,
              pdf_processing: false,
              pdf_error: true,
            }
          })
        })
    } else {
      setSuccess(current => {
        if (!current) return current

        return {
          ...current,
          pdf_downloaded: false,
          pdf_processing: false,
          pdf_error: true,
        }
      })
    }
  } catch (error) {
    console.error(error)
    window.alert(getErrorMessage(error))
    setSaving(false)
  }
}
  const handleBack = async () => {
  if (detailMode === 'create' && detailData?.ma_tp && !detailData?.ma_pttp) {
    try {
      await api.post(`/pt-tra-phong/cancel/${detailData.ma_tp}`)
    } catch (error) {
      console.error('Lỗi hoàn trạng thái giường:', error)
    }
  }

  setView('list')
  setDetailData(null)
  setDetailMode('create')
  setShowConfirm(false)
  await fetchData()
}

  const handlePrint = async () => {
    if (!detailData?.ma_pttp) return

    try {
      await handleDownloadPdf(detailData.ma_pttp)
    } catch (error) {
      console.error(error)
      window.alert(getErrorMessage(error))
    }
  }

  if (view === 'detail' && detailData) {
  return (
    <>
      <DetailView
        mode={detailMode}
        data={detailData}
        saving={saving}
        showConfirm={showConfirm}
        onBack={handleBack}
        onOpenConfirm={() => setShowConfirm(true)}
        onCancelConfirm={() => setShowConfirm(false)}
        onConfirmCreate={handleConfirmCreate}
        onPrint={handlePrint}
      />

      {success && (
        <SuccessPopup
          data={success}
          onBackToList={async () => {
            setSuccess(null)
            setView('list')
            setDetailData(null)
            setDetailMode('create')
            setShowConfirm(false)
            await fetchData()
          }}
        />
      )}
    </>
  )
}

  return (
    <section style={S.page}>
      <div style={S.pageHeader}>
        <h1 style={S.title}>Lập Phiếu Thu Trả Phòng</h1>
        <p style={S.description}>
          Đối soát tiền hoàn cọc dựa trên tỷ lệ quy định và chi phí khấu trừ hư hại để lập quyết toán trả phòng.
        </p>
      </div>

      <div style={S.searchBox}>
        <span style={S.searchIcon}>⌕</span>

        <input
          style={S.searchInput}
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Tìm theo Mã HSTP, CCCD khách hàng, mã phòng..."
        />
      </div>

      <PendingTable rows={filteredPending} loading={loading} onCreate={handleCreateClick} />

      <h2 style={S.historyTitle}>Danh sách PT Trả Phòng đã lập hôm nay</h2>

      <HistoryTable rows={historyRows} loading={loading} onView={handleViewReceipt} />

      {warning && (
        <LastReturnWarningPopup
          data={warning.data}
          message={warning.message}
          onClose={() => setWarning(null)}
        />
      )}

      {success && (
        <SuccessPopup
          data={success}
          onBackToList={async () => {
            setSuccess(null)
            setView('list')
            setDetailData(null)
            setDetailMode('create')
            setShowConfirm(false)
            await fetchData()
          }}
        />
      )}
    </section>
  )
}

const S = {
  page: {
    padding: '0 0 24px',
  },

  pageHeader: {
    marginBottom: '48px',
  },

  title: {
    margin: 0,
    color: '#232823',
    fontSize: '28px',
    fontWeight: 900,
  },

  description: {
  width: '100%',
  maxWidth: '820px',
  margin: '8px 0 0',
  color: '#60685d',
  fontSize: '14px',
  lineHeight: 1.45,
},

  searchBox: {
    position: 'relative',
    marginBottom: '8px',
  },

  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#6a7564',
    fontSize: '20px',
    lineHeight: 1,
  },

  searchInput: {
    width: '100%',
    height: '42px',
    boxSizing: 'border-box',
    padding: '0 14px 0 42px',
    border: '1px solid #cdd6c8',
    borderRadius: '6px',
    color: '#222',
    fontFamily: 'inherit',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#fff',
  },

  tableWrap: {
    border: '1px solid #d7ddd2',
    borderRadius: '6px',
    backgroundColor: '#fff',
    overflow: 'hidden',
    marginBottom: '42px',
  },

  tableWrapLite: {
    border: '1px solid #d7ddd2',
    borderRadius: '6px',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },

  table: {
  width: '100%',
  borderCollapse: 'collapse',
  tableLayout: 'fixed',
},

  th: {
  padding: '14px 16px',
  backgroundColor: '#f1f2f0',
  color: '#687162',
  textAlign: 'center',
  fontSize: '12px',
  fontWeight: 900,
  textTransform: 'uppercase',
  borderBottom: '1px solid #e4e7e1',
},

  tr: {
    borderBottom: '1px solid #edf0eb',
  },

  td: {
  padding: '15px 16px',
  color: '#353d34',
  fontSize: '14px',
  verticalAlign: 'middle',
  textAlign: 'center',
},

  emptyCell: {
    padding: '28px 16px',
    color: '#8c9588',
    textAlign: 'center',
    fontSize: '14px',
  },

  btnSmall: {
    minWidth: '118px',
    height: '30px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#3b4f27',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: '12px',
    fontWeight: 900,
    cursor: 'pointer',
  },

  btnIcon: {
    width: '34px',
    height: '30px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    color: '#3b4f27',
    fontSize: '16px',
    cursor: 'pointer',
  },

  historyTitle: {
    margin: '0 0 10px',
    color: '#30362f',
    fontSize: '15px',
    fontWeight: 900,
  },

  detailCard: {
  width: '100%',
  maxWidth: '100%',
  border: '1px solid #d7ddd2',
  borderRadius: '8px',
  backgroundColor: '#fff',
  boxShadow: '0 8px 20px rgba(20, 30, 15, 0.06)',
  overflow: 'hidden',
},

  detailHeader: {
    minHeight: '54px',
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #e5e8e2',
  },

  detailTitle: {
    margin: 0,
    color: '#242923',
    fontSize: '21px',
    fontWeight: 900,
  },

  viewBadge: {
    padding: '5px 10px',
    borderRadius: '999px',
    backgroundColor: '#eff3ea',
    color: '#3b4f27',
    fontSize: '12px',
    fontWeight: 900,
  },

  sectionTitle: {
    margin: '18px 20px 10px',
    color: '#6a7464',
    fontSize: '12px',
    fontWeight: 900,
    textTransform: 'uppercase',
  },

  infoBox: {
  margin: '0 20px 18px',
  padding: '14px 16px',
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '22px',
  border: '1px solid #d7ddd2',
  borderRadius: '6px',
  backgroundColor: '#f7f8f6',
},

  infoLabel: {
    margin: '0 0 4px',
    color: '#6c7567',
    fontSize: '11px',
    fontWeight: 900,
    textTransform: 'uppercase',
  },

  infoValue: {
    margin: '0 0 10px',
    color: '#263026',
    fontSize: '14px',
    fontWeight: 800,
  },

  moneyBox: {
    margin: '0 20px 14px',
    border: '1px solid #d7ddd2',
    borderRadius: '6px',
    overflow: 'hidden',
  },

  moneyLine: {
    minHeight: '38px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '0 16px',
    borderBottom: '1px solid #edf0eb',
  },

  moneyLabel: {
    color: '#4b5547',
    fontSize: '14px',
  },

  moneyValue: {
    color: '#222',
    fontSize: '15px',
    fontWeight: 800,
  },

  moneyBold: {
    fontWeight: 900,
  },

  ruleLine: {
    minHeight: '38px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '0 16px',
    borderBottom: '1px solid #edf0eb',
    color: '#4b5547',
    fontSize: '14px',
  },

  itemSection: {
    margin: '0 20px 16px',
  },

  subTitle: {
    margin: '0 0 8px',
    color: '#30362f',
    fontSize: '14px',
    fontWeight: 900,
  },

  totalBox: {
    margin: '0 20px 14px',
    border: '1px solid #d7ddd2',
    borderRadius: '6px',
    overflow: 'hidden',
  },

  resultBox: {
    margin: '0 20px 22px',
    minHeight: '62px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '7px',
    fontSize: '27px',
    fontWeight: 900,
  },

  resultRefund: {
    border: '1px solid #bfe9cb',
    backgroundColor: '#eafaf0',
    color: '#188642',
  },

  resultPayMore: {
    border: '1px solid #ffc4c4',
    backgroundColor: '#fff0f0',
    color: '#d62828',
  },

  footerBar: {
  width: '100%',
  maxWidth: '100%',
  minHeight: '66px',
  marginTop: '0',
  padding: '0 20px',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  border: '1px solid #d7ddd2',
  borderTop: 'none',
  borderRadius: '0 0 8px 8px',
  backgroundColor: '#f9faf8',
},

  btnSecondary: {
    minWidth: '86px',
    height: '38px',
    padding: '0 16px',
    border: '1px solid #d3d8ce',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#333b32',
    fontFamily: 'inherit',
    fontSize: '13px',
    fontWeight: 800,
    cursor: 'pointer',
  },

  btnPrimary: {
    minWidth: '168px',
    height: '40px',
    padding: '0 18px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#3b4f27',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: '13px',
    fontWeight: 900,
    cursor: 'pointer',
  },

  popupOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.34)',
  },

  warningPopup: {
    width: 'min(560px, calc(100vw - 32px))',
    borderRadius: '14px',
    backgroundColor: '#fff',
    padding: '28px 30px 30px',
    boxShadow: '0 22px 70px rgba(0,0,0,0.24)',
    textAlign: 'center',
  },

  warningIcon: {
    width: '68px',
    height: '60px',
    margin: '0 auto 16px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    backgroundColor: '#f1aa2b',
    fontSize: '42px',
    fontWeight: 900,
    clipPath: 'polygon(50% 0%, 100% 86%, 0% 86%)',
  },

  warningTitle: {
    margin: '0 0 18px',
    color: '#1d1d1d',
    fontSize: '24px',
    fontWeight: 900,
  },

  warningInfoBox: {
    margin: '0 8px 20px',
    padding: '16px 20px',
    borderRadius: '10px',
    backgroundColor: '#eef6ec',
    color: '#405a34',
    textAlign: 'left',
    fontSize: '18px',
    fontWeight: 800,
    lineHeight: 1.55,
  },

  warningMessage: {
    margin: '0 0 24px',
    color: '#363b34',
    fontSize: '16px',
    lineHeight: 1.55,
    textAlign: 'left',
  },

  btnWarningClose: {
    width: '100%',
    height: '48px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#3b4f27',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: '16px',
    fontWeight: 900,
    cursor: 'pointer',
  },

  successPopup: {
    width: 'min(500px, calc(100vw - 32px))',
    borderRadius: '14px',
    backgroundColor: '#fff',
    padding: '28px 30px 30px',
    boxShadow: '0 22px 70px rgba(0,0,0,0.24)',
    textAlign: 'center',
  },

  successIcon: {
    width: '68px',
    height: '68px',
    margin: '0 auto 16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    backgroundColor: '#3b4f27',
    fontSize: '42px',
    fontWeight: 900,
  },

  successTitle: {
    margin: '0 0 14px',
    color: '#1d1d1d',
    fontSize: '24px',
    fontWeight: 900,
  },

  successMessage: {
    margin: '0 0 18px',
    color: '#363b34',
    fontSize: '16px',
    lineHeight: 1.55,
  },

  successInfoBox: {
    margin: '0 8px 22px',
    padding: '16px 20px',
    borderRadius: '10px',
    backgroundColor: '#eef6ec',
    color: '#405a34',
    textAlign: 'left',
    fontSize: '15px',
    fontWeight: 800,
    lineHeight: 1.65,
  },

  btnSuccessClose: {
    width: '100%',
    height: '48px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#3b4f27',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: '16px',
    fontWeight: 900,
    cursor: 'pointer',
  },

  confirmPopup: {
    width: '430px',
    borderRadius: '10px',
    backgroundColor: '#fff',
    boxShadow: '0 22px 70px rgba(0,0,0,0.24)',
    overflow: 'hidden',
  },

  confirmTitle: {
    margin: 0,
    padding: '22px 24px 10px',
    color: '#1f241e',
    fontSize: '20px',
    fontWeight: 900,
  },

  confirmText: {
    margin: 0,
    padding: '0 24px 22px',
    color: '#4c5549',
    fontSize: '14px',
    lineHeight: 1.5,
  },

  confirmActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '16px 24px',
    backgroundColor: '#f4f5f2',
  },
}