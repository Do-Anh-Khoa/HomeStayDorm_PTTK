import { useEffect, useMemo, useState } from 'react'
import PageTitle from '../../components/common/PageTitle.jsx'
import api from '../../services/api.js'

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
]

const pad2 = (n) => String(n).padStart(2, '0')
const toDateKey = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

const formatTime = (value) => {
  const d = new Date(value)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

// Hiển thị 1 khung giờ 1 tiếng cho dễ nhìn trên UI (schema chỉ lưu 1 mốc thời gian)
const formatTimeRange = (value) => {
  const start = new Date(value)
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  return `${formatTime(start)} - ${formatTime(end)}`
}

const formatFullDateTime = (value) => {
  const d = new Date(value)
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(d)
}

const toDateTimeLocalValue = (value) => {
  if (!value) return ''
  const d = new Date(value)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export default function LichXemPhongPage() {
  const today = useMemo(() => new Date(), [])
  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(today)

  const [monthEvents, setMonthEvents] = useState([]) // toàn bộ lịch hẹn trong tháng đang xem
  const [dayEvents, setDayEvents] = useState([]) // lịch hẹn của ngày đang chọn
  const [loadingMonth, setLoadingMonth] = useState(true)
  const [loadingDay, setLoadingDay] = useState(true)

  const [hoSoOptions, setHoSoOptions] = useState([])
  const [modal, setModal] = useState(null) // 'dat-lich' | 'sua-lich' | 'chi-tiet' | null
  const [activeLich, setActiveLich] = useState(null) // dữ liệu lịch hẹn đang thao tác

  const [formMaDK, setFormMaDK] = useState('')
  const [formTgHen, setFormTgHen] = useState('')
  const [formError, setFormError] = useState('')
  const [formWarning, setFormWarning] = useState('')
  const [saving, setSaving] = useState(false)

  // ---- Tải lịch hẹn theo tháng (để chấm badge lên các ô ngày) ----
  useEffect(() => {
    fetchMonthEvents(viewMonth)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMonth])

  // ---- Tải lịch hẹn theo ngày đang chọn (panel "Chi tiết ngày") ----
  useEffect(() => {
    fetchDayEvents(selectedDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  const fetchMonthEvents = async (monthDate) => {
    setLoadingMonth(true)
    try {
      const res = await api.get('/lich-hen', {
        params: { thang: monthDate.getMonth() + 1, nam: monthDate.getFullYear() }
      })
      setMonthEvents(res.data?.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMonth(false)
    }
  }

  const fetchDayEvents = async (date) => {
    setLoadingDay(true)
    try {
      const res = await api.get('/lich-hen', { params: { ngay: toDateKey(date) } })
      setDayEvents(res.data?.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingDay(false)
    }
  }

  const refreshAll = () => {
    fetchMonthEvents(viewMonth)
    fetchDayEvents(selectedDate)
  }

  const eventsByDay = useMemo(() => {
    const map = {}
    for (const ev of monthEvents) {
      const key = toDateKey(new Date(ev.tg_hen))
      if (!map[key]) map[key] = []
      map[key].push(ev)
    }
    return map
  }, [monthEvents])

  // ---- Điều hướng tháng ----
  const goPrevMonth = () => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  const goNextMonth = () => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))

  // ---- Build lưới ngày trong tháng (Sun -> Sat) ----
  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)
    const startOffset = firstDay.getDay() // 0=Sun
    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < startOffset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d))
    }
    return cells
  }, [viewMonth])

  const closeModal = () => {
    setModal(null)
    setActiveLich(null)
    setFormMaDK('')
    setFormTgHen('')
    setFormError('')
    setFormWarning('')
  }

  // ---- btnDatLich_Click(): mở modal Đặt lịch xem phòng ----
  const openDatLichModal = async () => {
    setFormError('')
    setFormWarning('')
    setFormMaDK('')
    setFormTgHen('')
    setModal('dat-lich')
    try {
      const res = await api.get('/lich-hen/ho-so-dang-ky')
      setHoSoOptions(res.data?.data || [])
    } catch (err) {
      setFormError('Không thể tải danh sách hồ sơ đăng ký.')
    }
  }

  // ---- cardLichHen_Click(maLich): mở modal Chi tiết lịch xem phòng ----
  const openChiTietModal = async (maLich) => {
    setFormError('')
    setModal('chi-tiet')
    setActiveLich(null)
    try {
      const res = await api.get(`/lich-hen/${maLich}`)
      setActiveLich(res.data?.data || res.data)
    } catch (err) {
      setFormError('Không thể tải chi tiết lịch hẹn.')
    }
  }

  // ---- btnSua_Click(maLich) / btnChinhSua_Click(): mở modal Sửa lịch hẹn ----
  const openSuaModal = async (maLich) => {
    setFormError('')
    setFormWarning('')
    setModal('sua-lich')
    if (activeLich?.ma_lich === maLich) {
      setFormTgHen(toDateTimeLocalValue(activeLich.tg_hen))
      return
    }
    try {
      const res = await api.get(`/lich-hen/${maLich}`)
      const data = res.data?.data || res.data
      setActiveLich(data)
      setFormTgHen(toDateTimeLocalValue(data.tg_hen))
    } catch (err) {
      setFormError('Không thể tải chi tiết lịch hẹn.')
    }
  }

  // ---- B3/B4/B7: Lưu lịch hẹn mới ----
  const handleSubmitDatLich = async () => {
    setFormError('')
    setFormWarning('')
    if (!formMaDK) {
      setFormError('Vui lòng chọn mã hồ sơ đăng ký.')
      return
    }
    if (!formTgHen) {
      setFormError('Vui lòng nhập thời gian hẹn.')
      return
    }
    setSaving(true)
    try {
      const res = await api.post('/lich-hen', {
        ma_dk: formMaDK,
        tg_hen: new Date(formTgHen).toISOString()
      })
      if (res.data?.data?.gui_email_thanh_cong === false) {
        setFormWarning(res.data.message)
        setTimeout(() => {
          closeModal()
          refreshAll()
        }, 1800)
      } else {
        closeModal()
        refreshAll()
      }
    } catch (err) {
      // A4: thời gian không hợp lệ / lỗi khác -> hiển thị lỗi, ở lại B2 để sửa
      setFormError(err.response?.data?.message || 'Không thể lưu lịch hẹn.')
    } finally {
      setSaving(false)
    }
  }

  // ---- 7.1: Lưu chỉnh sửa giờ hẹn ----
  const handleSubmitSuaLich = async () => {
    setFormError('')
    setFormWarning('')
    if (!formTgHen) {
      setFormError('Vui lòng nhập thời gian hẹn.')
      return
    }
    setSaving(true)
    try {
      const res = await api.put(`/lich-hen/${activeLich.ma_lich}`, {
        tg_hen: new Date(formTgHen).toISOString()
      })
      if (res.data?.data?.gui_email_thanh_cong === false) {
        setFormWarning(res.data.message)
        setTimeout(() => {
          closeModal()
          refreshAll()
        }, 1800)
      } else {
        closeModal()
        refreshAll()
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Không thể cập nhật lịch hẹn.')
    } finally {
      setSaving(false)
    }
  }

  // ---- 9.1: Hủy lịch hẹn ----
  const handleHuyLich = async (maLich) => {
    if (!window.confirm('Bạn có chắc muốn hủy lịch hẹn này?')) return
    try {
      await api.delete(`/lich-hen/${maLich}`)
      refreshAll()
    } catch (err) {
      window.alert(err.response?.data?.message || 'Không thể hủy lịch hẹn.')
    }
  }

  return (
    <section style={S.page}>
      <div style={S.headerRow}>
        <div>
          <h1 style={S.pageTitle}>Quản lý Lịch hẹn</h1>
          <p style={S.pageDesc}>Theo dõi và điều phối các buổi xem phòng và tư vấn khách hàng.</p>
        </div>
        <button type="button" style={S.btnDatLich} onClick={openDatLichModal}>
          📅 Đặt lịch hẹn
        </button>
      </div>

      <div style={S.layout}>
        {/* ---- Lịch tháng ---- */}
        <div style={S.calendarCard}>
          <div style={S.calendarHeader}>
            <span style={S.monthLabel}>
              {MONTH_NAMES[viewMonth.getMonth()]}, {viewMonth.getFullYear()}
            </span>
            <div style={S.monthNav}>
              <button type="button" style={S.navBtn} onClick={goPrevMonth}>‹</button>
              <button type="button" style={S.navBtn} onClick={goNextMonth}>›</button>
            </div>
          </div>

          <div style={S.weekRow}>
            {WEEKDAYS.map(w => (
              <div key={w} style={S.weekCell}>{w}</div>
            ))}
          </div>

          <div style={S.grid}>
            {calendarCells.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} style={S.emptyDayCell} />
              const key = toDateKey(date)
              const events = eventsByDay[key] || []
              const selected = isSameDay(date, selectedDate)
              const isToday = isSameDay(date, today)
              return (
                <button
                  type="button"
                  key={key}
                  style={{
                    ...S.dayCell,
                    ...(selected ? S.dayCellSelected : {}),
                    ...(isToday && !selected ? S.dayCellToday : {})
                  }}
                  onClick={() => setSelectedDate(date)}
                >
                  <span style={S.dayNumber}>{date.getDate()}</span>
                  <div style={S.badgeStack}>
                    {events.slice(0, 2).map(ev => (
                      <span key={ev.ma_lich} style={S.dayBadge}>
                        {formatTime(ev.tg_hen)} - {ev.ten_kh?.split(' ').slice(-1)[0]}
                      </span>
                    ))}
                    {events.length > 2 && (
                      <span style={S.dayBadgeMore}>+{events.length - 2} khác</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ---- Chi tiết ngày ---- */}
        <div style={S.detailCard}>
          <div style={S.detailHeaderRow}>
            <span style={S.detailTitle}>
              Chi tiết ngày {pad2(selectedDate.getDate())}/{pad2(selectedDate.getMonth() + 1)}/
              {selectedDate.getFullYear()}
            </span>
            <span style={S.dotsMenu}>⋮</span>
          </div>

          {loadingDay ? (
            <div style={S.emptyDetail}>Đang tải...</div>
          ) : dayEvents.length === 0 ? (
            <div style={S.emptyDetail}>Không còn lịch hẹn nào khác trong ngày.</div>
          ) : (
            <div style={S.eventList}>
              {dayEvents.map(ev => (
                <div key={ev.ma_lich} style={S.eventCard}>
                  <button
                    type="button"
                    style={S.eventCardClickable}
                    onClick={() => openChiTietModal(ev.ma_lich)}
                  >
                    <div style={S.eventTime}>{formatTimeRange(ev.tg_hen)}</div>
                    <div style={S.eventName}>{ev.ten_kh}</div>
                    <div style={S.eventMeta}> Hồ sơ đăng ký: {ev.ma_dk}</div>
                  </button>
                  <div style={S.eventActions}>
                    <button type="button" style={S.linkBtn} onClick={() => openSuaModal(ev.ma_lich)}>
                      ✎ Sửa
                    </button>
                    <button
                      type="button"
                      style={S.linkBtnDanger}
                      onClick={() => handleHuyLich(ev.ma_lich)}
                    >
                      ⊗ Hủy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= Modal: Đặt lịch xem phòng (tạo mới) ================= */}
      {modal === 'dat-lich' && (
        <ModalShell title="Đặt lịch xem phòng" subtitle="Thiết lập thời gian hẹn." onClose={closeModal}>
          {formError && <div style={S.errorBanner}>{formError}</div>}
          {formWarning && <div style={S.warningBanner}>⚠ {formWarning}</div>}

          <label style={S.label}>Mã hồ sơ đăng ký *</label>
          <select style={S.input} value={formMaDK} onChange={e => setFormMaDK(e.target.value)}>
            <option value="">Chọn mã hồ sơ...</option>
            {hoSoOptions.map(hs => (
              <option key={hs.ma_dk} value={hs.ma_dk}>
                {hs.ma_dk} - {hs.ten_kh}
              </option>
            ))}
          </select>

          <label style={{ ...S.label, marginTop: '16px' }}>Thời gian hẹn *</label>
          <input
            type="datetime-local"
            style={S.input}
            value={formTgHen}
            onChange={e => setFormTgHen(e.target.value)}
          />

          <p style={S.noteText}>
            Tự động gửi email xác nhận lịch hẹn đến{' '}
            {formMaDK
              ? hoSoOptions.find(h => h.ma_dk === formMaDK)?.email || 'khách hàng'
              : 'khách hàng'}
          </p>

          <div style={S.modalFooter}>
            <button type="button" style={S.btnOutline} onClick={closeModal}>Hủy bỏ</button>
            <button type="button" style={S.btnPrimary} onClick={handleSubmitDatLich} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu & Gửi Mail'}
            </button>
          </div>
        </ModalShell>
      )}

      {/* ================= Modal: Sửa lịch hẹn ================= */}
      {modal === 'sua-lich' && (
        <ModalShell
          title="Đặt lịch xem phòng"
          subtitle={
            activeLich ? `Thiết lập thời gian hẹn cho khách hàng ${activeLich.ten_kh}.` : ''
          }
          onClose={closeModal}
        >
          {formError && <div style={S.errorBanner}>{formError}</div>}
          {formWarning && <div style={S.warningBanner}>⚠ {formWarning}</div>}

          <label style={S.label}>Thời gian hẹn *</label>
          <input
            type="datetime-local"
            style={S.input}
            value={formTgHen}
            onChange={e => setFormTgHen(e.target.value)}
          />

          <p style={S.noteText}>
            Tự động gửi email xác nhận lịch hẹn đến{'\n'}
            {activeLich?.email}
          </p>

          <div style={S.modalFooter}>
            <button type="button" style={S.btnOutline} onClick={closeModal}>Hủy bỏ</button>
            <button type="button" style={S.btnPrimary} onClick={handleSubmitSuaLich} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu & Gửi Mail'}
            </button>
          </div>
        </ModalShell>
      )}

      {/* ================= Modal: Chi tiết lịch xem phòng ================= */}
      {modal === 'chi-tiet' && (
        <ModalShell title="Chi tiết lịch xem phòng" onClose={closeModal}>
          {formError && <div style={S.errorBanner}>{formError}</div>}
          {!activeLich ? (
            <div style={S.emptyDetail}>Đang tải...</div>
          ) : (
            <>
              <div style={S.detailRow}>
                <span style={S.detailIcon}>🗓</span>
                <div>
                  <div style={S.detailLabel}>THỜI GIAN HẸN</div>
                  <div style={S.detailValue}>{formatFullDateTime(activeLich.tg_hen)}</div>
                </div>
              </div>
              <div style={S.successBanner}>
                ⊙ Đã gửi email xác nhận đến {activeLich.email}
              </div>
              <div style={S.modalFooter}>
                <button type="button" style={S.btnText} onClick={closeModal}>Đóng</button>
                <button
                  type="button"
                  style={S.btnPrimary}
                  onClick={() => openSuaModal(activeLich.ma_lich)}
                >
                  ✎ Chỉnh sửa
                </button>
              </div>
            </>
          )}
        </ModalShell>
      )}
    </section>
  )
}

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modalBox} onClick={e => e.stopPropagation()}>
        <div style={S.modalHeaderRow}>
          <div>
            <div style={S.modalTitle}>{title}</div>
            {subtitle && <div style={S.modalSubtitle}>{subtitle}</div>}
          </div>
          <button type="button" style={S.closeBtn} onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const S = {
  page: { padding: 0, fontFamily: 'Inter, sans-serif' },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px'
  },
  pageTitle: { fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 },
  pageDesc: { fontSize: '14px', color: '#6b7280', margin: '6px 0 0' },
  btnDatLich: {
    height: '42px',
    padding: '0 18px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#fff',
    color: '#374151',
    fontWeight: 600,
    cursor: 'pointer'
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: '20px',
    alignItems: 'start'
  },
  calendarCard: {
    border: '1px solid #eef0eb',
    borderRadius: '10px',
    padding: '20px',
    backgroundColor: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  calendarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  monthLabel: { fontSize: '15px', fontWeight: 700, color: '#111827' },
  monthNav: { display: 'flex', gap: '6px' },
  navBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#fff',
    cursor: 'pointer',
    color: '#4b5563'
  },
  weekRow: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '8px' },
  weekCell: {
    textAlign: 'center',
    fontSize: '11.5px',
    fontWeight: 700,
    color: '#9ca3af',
    padding: '6px 0'
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' },
  emptyDayCell: { minHeight: '84px' },
  dayCell: {
    minHeight: '84px',
    border: '1px solid #f3f4f6',
    borderRadius: '6px',
    padding: '6px',
    textAlign: 'left',
    backgroundColor: '#fff',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  dayCellSelected: { border: '1.5px solid #3b4f27', backgroundColor: '#f3f6ef' },
  dayCellToday: { border: '1.5px solid #d1d5db' },
  dayNumber: { fontSize: '12.5px', fontWeight: 600, color: '#374151' },
  badgeStack: { display: 'flex', flexDirection: 'column', gap: '2px' },
  dayBadge: {
    fontSize: '10px',
    backgroundColor: '#e6ece0',
    color: '#3b4f27',
    borderRadius: '3px',
    padding: '2px 4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  dayBadgeMore: { fontSize: '10px', color: '#9ca3af' },
  detailCard: {
    border: '1px solid #eef0eb',
    borderRadius: '10px',
    padding: '20px',
    backgroundColor: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    minHeight: '300px'
  },
  detailHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  detailTitle: { fontSize: '14.5px', fontWeight: 700, color: '#111827' },
  dotsMenu: { color: '#9ca3af', cursor: 'pointer' },
  emptyDetail: { fontSize: '13.5px', color: '#9ca3af', marginTop: '20px' },
  eventList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  eventCard: {
    border: '1px solid #eef0eb',
    borderRadius: '8px',
    padding: '12px',
    backgroundColor: '#f9fbf7'
  },
  eventCardClickable: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    border: 'none',
    background: 'none',
    padding: 0,
    cursor: 'pointer'
  },
  eventTime: {
    display: 'inline-block',
    fontSize: '11.5px',
    fontWeight: 700,
    color: '#3b4f27',
    backgroundColor: '#e6ece0',
    borderRadius: '4px',
    padding: '2px 8px',
    marginBottom: '6px'
  },
  eventName: { fontSize: '14px', fontWeight: 700, color: '#111827' },
  eventMeta: { fontSize: '12.5px', color: '#6b7280', marginTop: '2px' },
  eventActions: { display: 'flex', gap: '14px', marginTop: '10px' },
  linkBtn: {
    border: 'none',
    background: 'none',
    color: '#3b4f27',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0
  },
  linkBtnDanger: {
    border: 'none',
    background: 'none',
    color: '#dc2626',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalBox: {
    width: '420px',
    maxWidth: '92vw',
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
  },
  modalHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '18px'
  },
  modalTitle: { fontSize: '17px', fontWeight: 700, color: '#111827' },
  modalSubtitle: { fontSize: '13px', color: '#6b7280', marginTop: '4px' },
  closeBtn: {
    border: 'none',
    background: 'none',
    fontSize: '20px',
    color: '#9ca3af',
    cursor: 'pointer',
    lineHeight: 1
  },
  label: { display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#374151', marginBottom: '6px' },
  input: {
    width: '100%',
    height: '42px',
    boxSizing: 'border-box',
    borderRadius: '6px',
    border: '1.5px solid #e5e7eb',
    padding: '0 12px',
    fontSize: '14px',
    color: '#374151'
  },
  noteText: { fontSize: '12.5px', color: '#6b7280', marginTop: '14px', lineHeight: 1.5, whiteSpace: 'pre-line' },
  errorBanner: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    padding: '10px 14px',
    marginBottom: '14px',
    fontSize: '13.5px'
  },
  warningBanner: {
    backgroundColor: '#fffbeb',
    color: '#b45309',
    border: '1px solid #fde68a',
    borderRadius: '6px',
    padding: '10px 14px',
    marginBottom: '14px',
    fontSize: '13.5px'
  },
  successBanner: {
    backgroundColor: '#ecfdf5',
    color: '#059669',
    border: '1px solid #a7f3d0',
    borderRadius: '6px',
    padding: '10px 14px',
    marginTop: '16px',
    fontSize: '13.5px'
  },
  detailRow: { display: 'flex', gap: '12px', alignItems: 'flex-start' },
  detailIcon: { fontSize: '20px' },
  detailLabel: { fontSize: '11px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.04em' },
  detailValue: { fontSize: '15px', fontWeight: 700, color: '#111827', marginTop: '4px' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' },
  btnOutline: {
    height: '40px',
    padding: '0 18px',
    borderRadius: '6px',
    border: '1.5px solid #e5e7eb',
    backgroundColor: '#fff',
    color: '#374151',
    fontWeight: 600,
    cursor: 'pointer'
  },
  btnPrimary: {
    height: '40px',
    padding: '0 18px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#3b4f27',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer'
  },
  btnText: {
    height: '40px',
    padding: '0 10px',
    border: 'none',
    background: 'none',
    color: '#4b5563',
    fontWeight: 600,
    cursor: 'pointer'
  }
}