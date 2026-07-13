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

const formatMoney = value => {
  const number = Number(value)

  if (!Number.isFinite(number)) return '0'

  return new Intl.NumberFormat('vi-VN').format(number)
}

const getErrorMessage = error => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Đã có lỗi xảy ra.'
  )
}

function StatusBadge({ type }) {
  const isDone = type === 'done'

  return (
    <span style={{ ...S.statusBadge, ...(isDone ? S.statusDone : S.statusPending) }}>
      {isDone ? 'Đã ghi nhận' : 'Chưa ghi nhận'}
    </span>
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

function ReturnRoomTable({
  rows,
  type,
  loading,
  emptyText,
  onRecord,
  onViewDetail,
}) {
  return (
    <div style={S.tableWrap}>
      <table style={S.table}>
        <colgroup>
          <col style={{ width: '16%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '24%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '10%' }} />
        </colgroup>

        <thead>
          <tr>
            <th style={S.th}>Mã trả phòng</th>
            <th style={S.th}>Mã phòng</th>
            <th style={S.th}>Tên khách hàng</th>
            <th style={S.th}>Ngày trả phòng</th>
            <th style={S.th}>Trạng thái</th>
            <th style={S.th}>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <EmptyRow colSpan={6} text="Đang tải dữ liệu..." />
          ) : rows.length === 0 ? (
            <EmptyRow colSpan={6} text={emptyText} />
          ) : (
            rows.map(row => (
              <tr key={row.ma_tp} style={S.tr}>
                <td style={S.td}>
                  <span style={S.ellipsisText}>{row.ma_tp}</span>
                </td>

                <td style={S.td}>
                  <span style={S.ellipsisText}>{row.ma_phong || 'Chưa có phòng'}</span>
                </td>

                <td style={S.td}>
                  <span style={S.ellipsisText}>
                    {row.ten_khach_hang || row.ma_khach_thue}
                  </span>
                </td>

                <td style={S.td}>
                  <span style={S.ellipsisText}>{formatDate(row.ngay_tp)}</span>
                </td>

                <td style={S.td}>
                  <StatusBadge type={type === 'history' ? 'done' : 'pending'} />
                </td>

                <td style={S.td}>
                  {type === 'history' ? (
                    <button type="button" style={S.btnAction} onClick={() => onViewDetail(row)}>
                      Xem chi tiết
                    </button>
                  ) : (
                    <button type="button" style={S.btnAction} onClick={() => onRecord(row)}>
                      Ghi nhận
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
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
          Thông tin vật dụng hư hại đã được hệ thống ghi nhận thành công.
        </p>

        <button type="button" style={S.btnSuccessBack} onClick={onBack}>
          ← Quay lại danh sách
        </button>
      </div>
    </div>
  )
}

function DetailView({
  mode,
  detail,
  items,
  noDamage,
  saving,
  showSuccess,
  onBack,
  onSuccessBack,
  onToggleNoDamage,
  onChangeQuantity,
  onSave,
}) {
  const isHistory = mode === 'history'

  return (
    <section style={S.page}>
      <div style={S.breadcrumb}>
        Chọn hồ sơ trả phòng <span>/</span>{' '}
        {isHistory ? 'Chi tiết ghi nhận vật dụng hư hại' : 'Ghi nhận vật dụng hư hại'}
      </div>

      <PageTitle
        title="Chi tiết ghi nhận vật dụng hư hại"
        description={
          isHistory
            ? 'Xem lại số lượng vật dụng bị hư hỏng hoặc thất thoát đã được lưu.'
            : 'Kiểm tra và ghi nhận số lượng vật dụng bị hư hỏng hoặc thất thoát trong quá trình khách lưu trú.'
        }
      />

      <div style={S.infoCard}>
        <h3 style={S.infoTitle}>Thông tin trả phòng</h3>

        <div style={S.infoGrid}>
          <div style={S.infoCol}>
            <div style={S.infoRow}>
              <span>Mã trả phòng:</span>
              <strong>{detail.ma_tp}</strong>
            </div>
            <div style={S.infoRow}>
              <span>Mã phòng:</span>
              <strong>{detail.ma_phong || 'Chưa có phòng'}</strong>
            </div>
            <div style={S.infoRow}>
              <span>Khách hàng:</span>
              <strong>{detail.ten_khach_hang || detail.ma_khach_thue}</strong>
            </div>
          </div>

          <div style={S.infoCol}>
            <div style={S.infoRow}>
              <span>Số điện thoại:</span>
              <strong>{detail.sdt || 'Chưa có'}</strong>
            </div>
            <div style={S.infoRow}>
              <span>Ngày nhận:</span>
              <strong>{formatDate(detail.tg_vao)}</strong>
            </div>
            <div style={S.infoRow}>
              <span>Ngày trả:</span>
              <strong>{formatDate(detail.ngay_tp)}</strong>
            </div>
          </div>
        </div>
      </div>

      <label style={S.noDamageLabel}>
        <input
          type="checkbox"
          checked={noDamage}
          disabled={isHistory}
          onChange={event => onToggleNoDamage(event.target.checked)}
        />
        <span>Không có vật dụng hư hại</span>
      </label>

      <div style={S.detailTableWrap}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={{ ...S.th, width: '70px', textAlign: 'center' }}>STT</th>
              <th style={S.th}>Tên vật dụng</th>
              <th style={{ ...S.th, textAlign: 'center' }}>SL bàn giao</th>
              <th style={S.th}>Tình trạng</th>
              <th style={{ ...S.th, textAlign: 'center' }}>SL hư hại</th>
              <th style={{ ...S.th, textAlign: 'right' }}>Giá bồi thường</th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 ? (
              <EmptyRow colSpan={6} text="Không có vật dụng bàn giao." />
            ) : (
              items.map((item, index) => (
                <tr key={`${item.ma_bb}-${item.ma_vd}`} style={S.tr}>
                  <td style={{ ...S.td, textAlign: 'center' }}>{index + 1}</td>
                  <td style={S.td}>{item.ten_vd}</td>
                  <td style={{ ...S.td, textAlign: 'center' }}>{item.so_luong_ban_giao}</td>
                  <td style={S.td}>{item.tinh_trang || 'Không ghi nhận'}</td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    <div style={S.qtyControl}>
                      <button
                        type="button"
                        style={S.qtyButton}
                        disabled={noDamage || isHistory || item.sl_hu_hai <= 0}
                        onClick={() => onChangeQuantity(index, item.sl_hu_hai - 1)}
                      >
                        -
                      </button>
                      <input
                        style={S.qtyInput}
                        type="text"
                        inputMode="numeric"
                        value={item.sl_hu_hai}
                        disabled={noDamage || isHistory}
                        onChange={event => onChangeQuantity(index, event.target.value)}
                        onFocus={event => event.target.select()}
                      />
                      <button
                        type="button"
                        style={S.qtyButton}
                        disabled={noDamage || isHistory || item.sl_hu_hai >= item.so_luong_ban_giao}
                        onClick={() => onChangeQuantity(index, item.sl_hu_hai + 1)}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td style={{ ...S.td, textAlign: 'right' }}>
                    {formatMoney(item.gia_boi_thuong)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={S.detailFooter}>
        <button type="button" style={S.btnBack} onClick={onBack}>
          Hủy
        </button>

        {!isHistory && (
          <button type="button" style={S.btnSave} disabled={saving} onClick={onSave}>
            {saving ? 'Đang lưu...' : 'Lưu ghi nhận'}
          </button>
        )}
      </div>

      {showSuccess && (
        <SuccessPopup onBack={onSuccessBack} />
      )}
    </section>
  )
}

export default function VatDungHuHaiPage() {
  const [view, setView] = useState('list')
  const [detailMode, setDetailMode] = useState('record')

  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [pendingRows, setPendingRows] = useState([])
  const [historyRows, setHistoryRows] = useState([])
  const [loading, setLoading] = useState(false)

  const [detail, setDetail] = useState(null)
  const [items, setItems] = useState([])
  const [noDamage, setNoDamage] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const fetchVatDungHuHai = async () => {
    setLoading(true)

    try {
      const response = await api.get('/vat-dung-hu-hai')
      const data = response.data?.data || response.data || {}

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
    fetchVatDungHuHai()
  }, [])

  const filterRows = rows => {
    const keyword = normalizeText(search)

    if (!keyword) {
      return rows
    }

    return rows.filter(row => {
      return normalizeText(row.ma_phong).includes(keyword)
    })
  }

  const filteredPendingRows = useMemo(
    () => filterRows(pendingRows),
    [pendingRows, appliedSearch],
  )

  const filteredHistoryRows = useMemo(
    () => filterRows(historyRows),
    [historyRows, appliedSearch],
  )
  const handleSearch = () => {
    setAppliedSearch(search)
  }
  const openDetail = async (row, mode) => {
    try {
      const response = await api.get(`/vat-dung-hu-hai/${row.ma_tp}`)
      const data = response.data || {}

      setDetail(data)
      setItems(
        Array.isArray(data.items)
          ? data.items.map(item => ({
              ...item,
              sl_hu_hai: Number(item.sl_hu_hai || 0),
              so_luong_ban_giao: Number(item.so_luong_ban_giao || 0),
              gia_boi_thuong: Number(item.gia_boi_thuong || 0),
            }))
          : [],
      )
      setNoDamage(Boolean(data.khong_co_vat_dung_hu_hai))
      setDetailMode(mode)
      setShowSuccess(false)
      setView('detail')
    } catch (error) {
      console.error(error)
      window.alert(getErrorMessage(error))
    }
  }

  const resetDetailState = () => {
    setView('list')
    setDetail(null)
    setItems([])
    setNoDamage(false)
    setShowSuccess(false)
  }

  const handleToggleNoDamage = checked => {
    setNoDamage(checked)

    if (checked) {
      setItems(current => current.map(item => ({
        ...item,
        sl_hu_hai: 0,
      })))
    }
  }

  const handleChangeQuantity = (index, value) => {
    setItems(current => {
      const next = [...current]
      const item = next[index]
      const max = Number(item.so_luong_ban_giao || 0)
      let quantity = Number(value)

      if (!Number.isFinite(quantity)) {
        quantity = 0
      }

      quantity = Math.max(0, Math.min(max, quantity))

      next[index] = {
        ...item,
        sl_hu_hai: quantity,
      }

      return next
    })
  }

  const handleSave = async () => {
    if (!detail) return

    const damagedItems = items.filter(item => Number(item.sl_hu_hai) > 0)

    if (!noDamage && damagedItems.length === 0) {
      window.alert('Vui lòng nhập ít nhất một vật dụng có số lượng hư hại lớn hơn 0 hoặc chọn không có vật dụng hư hại.')
      return
    }

    setSaving(true)

    try {
      await api.post(`/vat-dung-hu-hai/${detail.ma_tp}`, {
        khong_co_vat_dung_hu_hai: noDamage,
        items: damagedItems.map(item => ({
          ma_vd: item.ma_vd,
          ma_bb: item.ma_bb,
          sl_hu_hai: Number(item.sl_hu_hai),
        })),
      })

      setShowSuccess(true)
    } catch (error) {
      console.error(error)
      window.alert(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleSuccessBack = async () => {
    resetDetailState()
    await fetchVatDungHuHai()
  }

  if (view === 'detail' && detail) {
    return (
      <DetailView
        mode={detailMode}
        detail={detail}
        items={items}
        noDamage={noDamage}
        saving={saving}
        showSuccess={showSuccess}
        onBack={resetDetailState}
        onSuccessBack={handleSuccessBack}
        onToggleNoDamage={handleToggleNoDamage}
        onChangeQuantity={handleChangeQuantity}
        onSave={handleSave}
      />
    )
  }

  return (
    <section style={S.page}>
      <PageTitle
        title="Ghi nhận vật dụng hư hại"
        description="Quản lý và ghi nhận mọi hư hại được báo cáo trong quá trình trả phòng."
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
            placeholder="Nhập mã phòng để tìm kiếm"
            />
          </div>

          <button type="button" style={S.btnSearch} onClick={handleSearch}>
            Tìm kiếm
          </button>
        </div>

        <ReturnRoomTable
          rows={filteredPendingRows}
          type="pending"
          loading={loading}
          emptyText="Không có hồ sơ trả phòng cần ghi nhận."
          onRecord={row => openDetail(row, 'record')}
          onViewDetail={row => openDetail(row, 'history')}
        />
      </div>

      <div style={S.historyHeader}>
        <PageTitle
          title="Lịch sử ghi nhận vật dụng hư hại"
          description="Xem chi tiết các ghi nhận mọi hư hại đã được lưu."
        />
      </div>

      <div style={S.card}>
        <ReturnRoomTable
          rows={filteredHistoryRows}
          type="history"
          loading={loading}
          emptyText="Chưa có lịch sử ghi nhận vật dụng hư hại."
          onRecord={row => openDetail(row, 'record')}
          onViewDetail={row => openDetail(row, 'history')}
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
    fontSize: '12px',
    fontWeight: 700,
  },

  card: {
    border: '1px solid #d9ded4',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: '#fff',
    marginTop: '16px',
    marginBottom: '24px',
  },

  searchRow: {
    display: 'flex',
    gap: '14px',
    marginBottom: '20px',
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
    color: '#6b7560',
    fontSize: '26px',
    lineHeight: 1,
  },

  searchInput: {
    width: '100%',
    height: '54px',
    boxSizing: 'border-box',
    padding: '0 16px 0 52px',
    border: '1.5px solid #cfd6c9',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#1a1f14',
    fontFamily: 'inherit',
    fontSize: '16px',
    outline: 'none',
  },

  btnSearch: {
    width: '130px',
    height: '54px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#3b4f27',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: '16px',
    fontWeight: 800,
    cursor: 'pointer',
  },

  tableWrap: {
    maxHeight: '252px',
    overflowY: 'auto',
    overflowX: 'hidden',
    border: '1px solid #dde3d8',
    borderRadius: '4px',
    backgroundColor: '#fff',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
  },

  th: {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    height: '56px',
    padding: '0 14px',
    backgroundColor: '#f8f9f7',
    color: '#626d56',
    textAlign: 'center',
    fontSize: '13px',
    fontWeight: 800,
    borderBottom: '1px solid #dde3d8',
    whiteSpace: 'nowrap',
  },

  tr: {
    borderBottom: '1px solid #eef0eb',
  },

  td: {
    height: '74px',
    padding: '0 14px',
    color: '#11160f',
    fontSize: '15px',
    verticalAlign: 'middle',
    textAlign: 'center',
  },
  ellipsisText: {
    display: 'block',
    width: '100%',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  emptyCell: {
    padding: '28px 24px',
    color: '#7a8372',
    textAlign: 'center',
    fontSize: '15px',
  },

  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '96px',
    padding: '6px 12px',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: 800,
  },

  statusPending: {
    backgroundColor: '#f0f2ee',
    color: '#64705b',
  },

  statusDone: {
    backgroundColor: '#dceec7',
    color: '#3d561f',
  },

  btnAction: {
    minWidth: '108px',
    height: '42px',
    padding: '0 14px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#3b4f27',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: '14px',
    fontWeight: 800,
    cursor: 'pointer',
  },

  historyHeader: {
    marginTop: '24px',
  },

  infoCard: {
    border: '1px solid #d9ded4',
    borderRadius: '6px',
    padding: '16px',
    backgroundColor: '#fff',
    marginTop: '14px',
    marginBottom: '8px',
  },

  infoTitle: {
    margin: '0 0 12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #eef0eb',
    color: '#1f2a1d',
    fontSize: '18px',
    fontWeight: 800,
  },

  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },

  infoCol: {
    display: 'grid',
    gap: '9px',
  },

  infoRow: {
    display: 'grid',
    gridTemplateColumns: '110px 1fr',
    gap: '14px',
    color: '#4e574a',
    fontSize: '13px',
  },

  noDamageLabel: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '8px',
    margin: '8px 0 8px',
    color: '#4e574a',
    fontSize: '13px',
    fontWeight: 700,
  },

  detailTableWrap: {
    border: '1px solid #dde3d8',
    borderRadius: '4px',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },

  qtyControl: {
    width: '120px',
    height: '34px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '34px 52px 34px',
    alignItems: 'center',
    border: '1px solid #d6dccf',
    borderRadius: '6px',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },

  qtyButton: {
    width: '34px',
    height: '34px',
    padding: 0,
    border: 'none',
    backgroundColor: '#fff',
    color: '#3b4f27',
    fontFamily: 'inherit',
    fontSize: '17px',
    fontWeight: 900,
    lineHeight: '34px',
    textAlign: 'center',
    cursor: 'pointer',
  },

  qtyInput: {
    width: '52px',
    height: '34px',
    padding: 0,
    margin: 0,
    border: 'none',
    borderLeft: '1px solid #d6dccf',
    borderRight: '1px solid #d6dccf',
    backgroundColor: '#fff',
    color: '#11160f',
    textAlign: 'center',
    fontFamily: 'inherit',
    fontSize: '15px',
    fontWeight: 700,
    lineHeight: '34px',
    outline: 'none',
    boxSizing: 'border-box',
  },

  detailFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '16px',
  },

  btnBack: {
    width: '80px',
    height: '38px',
    border: '1px solid #c9cfc3',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#1a1f14',
    fontFamily: 'inherit',
    fontWeight: 700,
    cursor: 'pointer',
  },

  btnSave: {
    width: '130px',
    height: '38px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#3b4f27',
    color: '#fff',
    fontFamily: 'inherit',
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
    width: '310px',
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