import { useEffect, useMemo, useState } from 'react'
import PageTitle from '../../components/common/PageTitle.jsx'

// FRONTEND MOCK TRƯỚC
// Sau này có backend thì thay mấy mảng này bằng api.get(...)
const MOCK_PENDING_RECORDS = [
  {
    ma_tp: 'CO-1029',
    ma_phong: 'A-204',
    ten_kh: 'Nguyễn Văn A',
    cccd: '012345678901',
    sdt: '0909 123 456',
    ngay_nhan: '10/10/2025',
    ngay_tra: '06/06/2026',
    trang_thai: 'Chưa ghi nhận',
    vat_dung: [
      { ma_vd: 'VD001', ten_vd: 'Khăn tắm', so_luong_ban_giao: 4 },
      { ma_vd: 'VD002', ten_vd: 'Remote TV', so_luong_ban_giao: 1 },
      { ma_vd: 'VD003', ten_vd: 'Máy sấy tóc', so_luong_ban_giao: 1 },
      { ma_vd: 'VD004', ten_vd: 'Đèn ngủ', so_luong_ban_giao: 2 },
    ],
  },
  {
    ma_tp: 'CO-1027',
    ma_phong: 'C-301',
    ten_kh: 'Lê Hoàng C',
    cccd: '012345678903',
    sdt: '0908 333 222',
    ngay_nhan: '09/10/2025',
    ngay_tra: '06/06/2026',
    trang_thai: 'Chưa ghi nhận',
    vat_dung: [
      { ma_vd: 'VD005', ten_vd: 'Chìa khóa phòng', so_luong_ban_giao: 1 },
      { ma_vd: 'VD006', ten_vd: 'Thẻ ra vào', so_luong_ban_giao: 1 },
    ],
  },
]

const MOCK_HISTORY_RECORDS = [
  {
    ma_tp: 'CO-1028',
    ma_phong: 'B-105',
    ten_kh: 'Trần Thị B',
    cccd: '012345678902',
    sdt: '0912 222 111',
    ngay_nhan: '10/10/2025',
    ngay_tra: '06/06/2026',
    trang_thai: 'Đã ghi nhận',
    khong_co_hu_hai: false,
    vat_dung: [
      { ma_vd: 'VD001', ten_vd: 'Khăn tắm', so_luong_ban_giao: 4, so_luong_hu_hai: 2, ghi_chu: '' },
      { ma_vd: 'VD002', ten_vd: 'Remote TV', so_luong_ban_giao: 1, so_luong_hu_hai: 1, ghi_chu: '' },
      { ma_vd: 'VD003', ten_vd: 'Máy sấy tóc', so_luong_ban_giao: 1, so_luong_hu_hai: 0, ghi_chu: '' },
      { ma_vd: 'VD004', ten_vd: 'Đèn ngủ', so_luong_ban_giao: 2, so_luong_hu_hai: 0, ghi_chu: '' },
    ],
  },
]

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

const formatRecordForDetail = record => ({
  ...record,
  khong_co_hu_hai: record.khong_co_hu_hai || false,
  vat_dung: record.vat_dung.map(item => ({
    ...item,
    so_luong_hu_hai: item.so_luong_hu_hai || 0,
    ghi_chu: item.ghi_chu || '',
  })),
})

function StatusBadge({ status }) {
  const isDone = status === 'Đã ghi nhận'

  return (
    <span style={isDone ? S.badgeDone : S.badgePending}>
      {status}
    </span>
  )
}

function RecordTable({ records, emptyText, actionType, onRecord, onViewDetail }) {
  return (
    <div style={S.tableWrap}>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Mã trả phòng</th>
            <th style={S.th}>Mã phòng</th>
            <th style={S.th}>Tên khách hàng</th>
            <th style={S.th}>Ngày trả phòng</th>
            <th style={S.th}>Trạng thái</th>
            <th style={{ ...S.th, textAlign: 'center' }}>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan="6" style={S.emptyCell}>
                {emptyText}
              </td>
            </tr>
          ) : (
            records.map(record => (
              <tr key={record.ma_tp} style={S.tr}>
                <td style={S.td}>{record.ma_tp}</td>
                <td style={S.td}>{record.ma_phong}</td>
                <td style={S.td}>{record.ten_kh}</td>
                <td style={S.td}>{record.ngay_tra}</td>
                <td style={S.td}>
                  <StatusBadge status={record.trang_thai} />
                </td>
                <td style={{ ...S.td, textAlign: 'center' }}>
                  {actionType === 'record' ? (
                    <button
                      type="button"
                      style={S.btnSmall}
                      onClick={() => onRecord(record)}
                    >
                      Ghi nhận
                    </button>
                  ) : (
                    <button
                      type="button"
                      style={S.btnSmall}
                      onClick={() => onViewDetail(record)}
                    >
                      Xem chi tiết
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

function ListView({
  keyword,
  setKeyword,
  pendingRecords,
  historyRecords,
  onSearch,
  onRecord,
  onViewDetail,
}) {
  return (
    <section>
      <div style={{ marginBottom: '14px' }}>
        <PageTitle
          title="Ghi nhận vật dụng hư hại"
          description="Quản lý và ghi nhận mọi hư hại được báo cáo trong quá trình trả phòng."
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
              placeholder="Nhập CCCD hoặc mã phòng"
              value={keyword}
              onChange={event => setKeyword(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') onSearch()
              }}
            />
          </div>

          <button type="button" style={S.btnSearch} onClick={onSearch}>
            Tìm kiếm
          </button>
        </div>

        <RecordTable
          records={pendingRecords}
          emptyText="Không có hồ sơ trả phòng nào cần ghi nhận."
          actionType="record"
          onRecord={onRecord}
        />
      </div>

      <div style={{ marginTop: '22px', marginBottom: '12px' }}>
        <PageTitle
          title="Lịch sử ghi nhận vật dụng hư hại"
          description="Xem chi tiết các ghi nhận mọi hư hại đã được lưu."
        />
      </div>

      <div style={S.card}>
        <RecordTable
          records={historyRecords}
          emptyText="Chưa có lịch sử ghi nhận vật dụng hư hại."
          actionType="view"
          onViewDetail={onViewDetail}
        />
      </div>
    </section>
  )
}

function ReturnInfo({ record }) {
  return (
    <div style={S.infoCard}>
      <h3 style={S.sectionTitle}>Thông tin trả phòng</h3>

      <div style={S.infoDivider} />

      <div style={S.infoGrid}>
        <div style={S.infoCol}>
          <InfoRow label="Mã trả phòng:" value={record.ma_tp} />
          <InfoRow label="Mã phòng:" value={record.ma_phong} />
          <InfoRow label="Khách hàng:" value={record.ten_kh} />
        </div>

        <div style={S.infoCol}>
          <InfoRow label="Số điện thoại:" value={record.sdt} />
          <InfoRow label="Ngày nhận:" value={record.ngay_nhan} />
          <InfoRow label="Ngày trả:" value={record.ngay_tra} />
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={S.infoRow}>
      <span style={S.infoLabel}>{label}</span>
      <strong style={S.infoValue}>{value}</strong>
    </div>
  )
}

function DamageCounter({ value, disabled, onDecrease, onIncrease }) {
  return (
    <div style={disabled ? S.counterDisabled : S.counter}>
      <button
        type="button"
        style={S.counterButton}
        onClick={onDecrease}
        disabled={disabled}
      >
        −
      </button>

      <span style={S.counterValue}>{value}</span>

      <button
        type="button"
        style={S.counterButton}
        onClick={onIncrease}
        disabled={disabled}
      >
        +
      </button>
    </div>
  )
}

function DetailView({ mode, record, onCancel, onSave }) {
  const isViewOnly = mode === 'view'
  const [items, setItems] = useState(record.vat_dung)
  const [noDamage, setNoDamage] = useState(record.khong_co_hu_hai || false)
  const [submitting, setSubmitting] = useState(false)

  const hasInvalidQuantity = useMemo(() => {
    return items.some(item => item.so_luong_hu_hai > item.so_luong_ban_giao)
  }, [items])

  const hasAnyDamage = useMemo(() => {
    return items.some(item => item.so_luong_hu_hai > 0)
  }, [items])

  const canSave = !isViewOnly && !hasInvalidQuantity && (noDamage || hasAnyDamage)

  const changeDamageQuantity = (maVd, type) => {
    if (isViewOnly || noDamage) return

    setItems(current =>
      current.map(item => {
        if (item.ma_vd !== maVd) return item

        const nextValue = type === 'increase'
          ? item.so_luong_hu_hai + 1
          : Math.max(0, item.so_luong_hu_hai - 1)

        return {
          ...item,
          so_luong_hu_hai: nextValue,
        }
      })
    )
  }

  const changeNote = (maVd, note) => {
    if (isViewOnly || noDamage) return

    setItems(current =>
      current.map(item => {
        if (item.ma_vd !== maVd) return item

        return {
          ...item,
          ghi_chu: note,
        }
      })
    )
  }

  const handleToggleNoDamage = event => {
    if (isViewOnly) return

    const checked = event.target.checked

    setNoDamage(checked)

    if (checked) {
      setItems(current =>
        current.map(item => ({
          ...item,
          so_luong_hu_hai: 0,
          ghi_chu: '',
        }))
      )
    }
  }

  const handleSave = async () => {
    if (!canSave) return

    setSubmitting(true)

    try {
      await onSave({
        ...record,
        khong_co_hu_hai: noDamage,
        vat_dung: items,
        trang_thai: 'Đã ghi nhận',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section style={{ paddingBottom: isViewOnly ? '0' : '80px' }}>
      <div style={S.breadcrumb}>
        {isViewOnly ? 'Xem chi tiết ghi nhận' : 'Chọn hồ sơ trả phòng'}
        <span>/</span>
        Ghi nhận vật dụng hư hại
      </div>

      <div style={{ marginBottom: '14px' }}>
        <PageTitle
          title={isViewOnly ? 'Chi tiết ghi nhận vật dụng hư hại' : 'Chi tiết ghi nhận vật dụng hư hại'}
          description="Kiểm tra và ghi nhận số lượng vật dụng bị hư hỏng hoặc thất thoát trong quá trình khách lưu trú."
        />
      </div>

      <ReturnInfo record={record} />

      <label style={S.noDamageRow}>
        <input
          type="checkbox"
          checked={noDamage}
          onChange={handleToggleNoDamage}
          disabled={isViewOnly}
        />
        <span>Không có vật dụng hư hại</span>
      </label>

      <div style={S.damageTableWrap}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={{ ...S.th, width: '70px', textAlign: 'center' }}>STT</th>
              <th style={S.th}>Tên vật dụng</th>
              <th style={{ ...S.th, textAlign: 'center' }}>SL bàn giao</th>
              <th style={{ ...S.th, textAlign: 'center' }}>SL hư hại</th>
              <th style={S.th}>Ghi chú</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, index) => {
              const invalid = item.so_luong_hu_hai > item.so_luong_ban_giao
              const rowDisabled = noDamage || isViewOnly

              return (
                <tr key={item.ma_vd} style={S.tr}>
                  <td style={{ ...S.td, textAlign: 'center' }}>{index + 1}</td>
                  <td style={S.td}>{item.ten_vd}</td>
                  <td style={{ ...S.td, textAlign: 'center' }}>{item.so_luong_ban_giao}</td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    <div style={S.counterCell}>
                      <DamageCounter
                        value={item.so_luong_hu_hai}
                        disabled={rowDisabled}
                        onDecrease={() => changeDamageQuantity(item.ma_vd, 'decrease')}
                        onIncrease={() => changeDamageQuantity(item.ma_vd, 'increase')}
                      />

                      {invalid && (
                        <span style={S.quantityError}>
                          Số lượng hư hại không hợp lệ
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={S.td}>
                    <input
                      style={rowDisabled ? S.noteInputDisabled : S.noteInput}
                      placeholder="Thêm ghi chú..."
                      value={item.ghi_chu}
                      onChange={event => changeNote(item.ma_vd, event.target.value)}
                      disabled={rowDisabled}
                      readOnly={isViewOnly}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {isViewOnly ? (
        <div style={S.viewFooter}>
          <button type="button" style={S.btnPrimary} onClick={onCancel}>
            Quay lại
          </button>
        </div>
      ) : (
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
            style={canSave ? S.btnPrimary : S.btnPrimaryDisabled}
            onClick={handleSave}
            disabled={!canSave || submitting}
          >
            {submitting ? 'Đang lưu…' : 'Lưu ghi nhận'}
          </button>
        </div>
      )}
    </section>
  )
}

export default function VatDungHuHaiPage() {
  const [keyword, setKeyword] = useState('')
  const [pendingRecords, setPendingRecords] = useState([])
  const [historyRecords, setHistoryRecords] = useState([])
  const [view, setView] = useState('list')
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    setPendingRecords(MOCK_PENDING_RECORDS)
    setHistoryRecords(MOCK_HISTORY_RECORDS)
  }, [])

  const handleSearch = () => {
    const q = keyword.trim().toLowerCase()

    if (!q) {
      setPendingRecords(MOCK_PENDING_RECORDS)
      return
    }

    const result = MOCK_PENDING_RECORDS.filter(record => {
      return (
        record.cccd.toLowerCase().includes(q) ||
        record.ma_phong.toLowerCase().includes(q)
      )
    })

    setPendingRecords(result)
  }

  const handleRecord = record => {
    setSelectedRecord(formatRecordForDetail(record))
    setView('record')
  }

  const handleViewDetail = record => {
    setSelectedRecord(formatRecordForDetail(record))
    setView('view')
  }

  const handleSaveRecord = async savedRecord => {
    // FRONTEND MOCK: backend sau này sẽ lưu xuống bảng vat_dung_hu_hai
    setPendingRecords(current => current.filter(item => item.ma_tp !== savedRecord.ma_tp))

    setHistoryRecords(current => [
      {
        ...savedRecord,
        trang_thai: 'Đã ghi nhận',
      },
      ...current,
    ])

    showToast('Lưu ghi nhận vật dụng hư hại thành công.')

    setSelectedRecord(null)
    setView('list')
  }

  const goBackToList = () => {
    setSelectedRecord(null)
    setView('list')
  }

  if ((view === 'record' || view === 'view') && selectedRecord) {
    return (
      <>
        <DetailView
          mode={view === 'view' ? 'view' : 'record'}
          record={selectedRecord}
          onCancel={goBackToList}
          onSave={handleSaveRecord}
        />

        {toast && (
          <div style={{ ...S.toast, ...(toast.type === 'error' ? S.toastError : S.toastSuccess) }}>
            {toast.message}
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <ListView
        keyword={keyword}
        setKeyword={setKeyword}
        pendingRecords={pendingRecords}
        historyRecords={historyRecords}
        onSearch={handleSearch}
        onRecord={handleRecord}
        onViewDetail={handleViewDetail}
      />

      {toast && (
        <div style={{ ...S.toast, ...(toast.type === 'error' ? S.toastError : S.toastSuccess) }}>
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
    gap: '12px',
    marginBottom: '16px',
  },
  searchInputWrap: {
    position: 'relative',
    flex: 1,
  },
  searchIcon: {
    position: 'absolute',
    left: '13px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#6b7560',
    display: 'inline-flex',
  },
  inputSearch: {
    width: '100%',
    height: '42px',
    boxSizing: 'border-box',
    padding: '10px 14px 10px 40px',
    border: '1.5px solid #cfd6c9',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: '#1a1f14',
    outline: 'none',
    backgroundColor: '#fff',
  },
  btnSearch: {
    width: '104px',
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
  damageTableWrap: {
    border: '1px solid #dde3d8',
    borderRadius: '4px',
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginTop: '14px',
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
  btnSmall: {
    minWidth: '78px',
    height: '30px',
    padding: '0 14px',
    backgroundColor: '#3b4f27',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    fontWeight: 700,
    fontSize: '12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  badgePending: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '86px',
    padding: '4px 10px',
    borderRadius: '999px',
    backgroundColor: '#eef0eb',
    color: '#6b7560',
    fontSize: '12px',
    fontWeight: 700,
  },
  badgeDone: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '86px',
    padding: '4px 10px',
    borderRadius: '999px',
    backgroundColor: '#dcecc4',
    color: '#3b4f27',
    fontSize: '12px',
    fontWeight: 700,
  },
  breadcrumb: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    color: '#6b7560',
    fontSize: '13px',
    marginBottom: '6px',
  },
  infoCard: {
    backgroundColor: '#fff',
    border: '1px solid #cfd6c9',
    borderRadius: '8px',
    padding: '20px 24px',
  },
  sectionTitle: {
    margin: '0',
    color: '#1a1f14',
    fontSize: '22px',
    fontWeight: 800,
  },
  infoDivider: {
    borderTop: '1px solid #dde3d8',
    margin: '14px 0 18px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '48px',
  },
  infoCol: {
    display: 'grid',
    gap: '12px',
  },
  infoRow: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr',
    gap: '14px',
    alignItems: 'center',
  },
  infoLabel: {
    color: '#6b7560',
    fontSize: '13px',
    fontWeight: 700,
  },
  infoValue: {
    color: '#1a1f14',
    fontSize: '13px',
    fontWeight: 800,
  },
  noDamageRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px',
    color: '#1a1f14',
    fontSize: '13px',
    fontWeight: 600,
    marginTop: '12px',
  },
  counterCell: {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  counter: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '58px',
    height: '28px',
    border: '1px solid #cfd6c9',
    borderRadius: '5px',
    backgroundColor: '#fff',
  },
  counterDisabled: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '58px',
    height: '28px',
    border: '1px solid #d6d8d2',
    borderRadius: '5px',
    backgroundColor: '#d9dbd8',
  },
  counterButton: {
    width: '20px',
    height: '26px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#1a1f14',
    cursor: 'pointer',
    fontWeight: 800,
    fontFamily: 'inherit',
  },
  counterValue: {
    minWidth: '18px',
    textAlign: 'center',
    color: '#1a1f14',
    fontWeight: 700,
  },
  quantityError: {
    maxWidth: '90px',
    color: '#e02424',
    fontSize: '11px',
    lineHeight: 1.2,
    textAlign: 'center',
  },
  noteInput: {
    width: '100%',
    height: '34px',
    boxSizing: 'border-box',
    padding: '8px 12px',
    border: '1.5px solid #cfd6c9',
    borderRadius: '5px',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
    backgroundColor: '#fff',
    color: '#1a1f14',
  },
  noteInputDisabled: {
    width: '100%',
    height: '34px',
    boxSizing: 'border-box',
    padding: '8px 12px',
    border: '1.5px solid #d6d8d2',
    borderRadius: '5px',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
    backgroundColor: '#cfd1cd',
    color: '#6b7560',
    cursor: 'not-allowed',
  },
  bottomBar: {
    position: 'fixed',
    left: '280px',
    right: 0,
    bottom: 0,
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
  viewFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '16px',
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
  btnPrimaryDisabled: {
    padding: '10px 22px',
    backgroundColor: '#d9dbd8',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'not-allowed',
    fontFamily: 'inherit',
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