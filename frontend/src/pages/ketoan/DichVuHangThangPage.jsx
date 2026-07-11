import { useEffect, useRef, useState } from 'react'
import PageTitle from '../../components/common/PageTitle.jsx'
import api from '../../services/api.js'

const formatMoney = (value) => {
  const raw = String(value ?? '').replace(/[^\d]/g, '')
  return raw ? Number(raw).toLocaleString('vi-VN') : '0'
}

const donViDV = (maDV) => {
  if (maDV === 'DIEN') return 'kWh'
  if (maDV === 'NUOC') return 'm3'
  if (maDV === 'WIFI') return 'lần'
  return ''
}

const normalizeMaDV = (value) => String(value || '').trim().toUpperCase()

const formatNgay = (value) => {
  if (!value) return ''
  const raw = String(value).split('T')[0]
  const parts = raw.split('-')
  if (parts.length !== 3) return String(value)
  const [year, month, day] = parts
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
}

function GhiNhanDichVuDialog({ maPhong, onCancel, onSaved, showToast }) {
  const [loadingServices, setLoadingServices] = useState(true)
  const [services, setServices] = useState([])
  const [serviceForm, setServiceForm] = useState({})
  const [date, setDate] = useState(() => {
    const today = new Date()
    const d = String(today.getDate()).padStart(2, '0')
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const y = today.getFullYear()
    return `${d}/${m}/${y}`
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [confirmData, setConfirmData] = useState(null)

  useEffect(() => {
    let isCancelled = false
    setLoadingServices(true)
    api.get('/dich-vu').then(res => {
      if (isCancelled) return
      const data = res.data || []
      setServices(data)
      const initialForm = {}
      data.forEach(s => {
        if (isMeterService(s)) {
          initialForm[s.ma_dv] = { chiSoCu: '', chiSoMoi: '' }
        } else {
          initialForm[s.ma_dv] = { soLuong: '' }
        }
      })
      setServiceForm(initialForm)
      setLoadingServices(false)
    }).catch(() => {
      if (isCancelled) return
      showToast('Không thể tải danh sách dịch vụ.', 'error')
      setLoadingServices(false)
    })
    return () => { isCancelled = true }
  }, [maPhong])

  const setField = (maDV, key, value) => {
    setServiceForm(prev => ({
      ...prev,
      [maDV]: {
        ...prev[maDV],
        [key]: value,
      },
    }))
    setErrors(prev => ({ ...prev, [maDV]: '' }))
  }

  const normalizeDateInput = (value) => {
    const digits = value.replace(/\D/g, '')
    const day = digits.slice(0, 2)
    const month = digits.slice(2, 4)
    const year = digits.slice(4, 8)
    let formatted = day
    if (month) formatted += `/${month}`
    if (year) formatted += `/${year}`
    return formatted
  }

  const isMeterService = (service) => {
    const code = String(service?.ma_dv || service?.maDV || '').trim().toUpperCase()
    const name = String(service?.ten_dv || service?.ten || '').trim().toLowerCase()
    return code === 'DIEN' || code === 'NUOC' || name.includes('điện') || name.includes('nước')
  }

  const serviceRows = services.map(service => {
    const row = serviceForm[service.ma_dv] || {}
    const donVi = service.don_vi_tinh || service.don_vi || donViDV(service.ma_dv)
    const meter = isMeterService(service)
    if (meter) {
      const chiSoCu = row.chiSoCu === '' ? '' : Number(row.chiSoCu)
      const chiSoMoi = row.chiSoMoi === '' ? '' : Number(row.chiSoMoi)
      const soLuong = (
        chiSoCu === '' || chiSoMoi === '' || Number.isNaN(chiSoCu) || Number.isNaN(chiSoMoi)
      ) ? '' : Math.max(0, chiSoMoi - chiSoCu)
      const thanhTien = soLuong === '' ? 0 : soLuong * Number(service.gia_dv)
      return {
        ...service,
        donVi,
        chiSoCu: row.chiSoCu,
        chiSoMoi: row.chiSoMoi,
        soLuong,
        thanhTien,
      }
    }

    const soLuong = row.soLuong === '' ? '' : Number(row.soLuong)
    const thanhTien = typeof soLuong === 'number' && Number.isFinite(soLuong) ? Math.max(0, soLuong) * Number(service.gia_dv) : 0
    return {
      ...service,
      donVi,
      soLuong: row.soLuong ?? '',
      thanhTien,
    }
  })

  const totalAmount = serviceRows.reduce((sum, item) => sum + (item.thanhTien || 0), 0)

  const isValidDate = (value) => {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return false
    const [day, month, year] = value.split('/').map(Number)
    const dateObj = new Date(year, month - 1, day)
    return dateObj.getFullYear() === year && dateObj.getMonth() === month - 1 && dateObj.getDate() === day
  }

  const validate = () => {
    const e = {}
    let hasAny = false

    serviceRows.forEach(item => {
      if (isMeterService(item)) {
        if (item.chiSoCu === '' && item.chiSoMoi === '') return

        if (item.chiSoCu === '' || item.chiSoMoi === '') {
          e[item.ma_dv] = 'Vui lòng nhập cả chỉ số cũ và chỉ số mới.'
          return
        }

        const cu = Number(item.chiSoCu)
        const moi = Number(item.chiSoMoi)

        if (Number.isNaN(cu) || Number.isNaN(moi)) {
          e[item.ma_dv] = 'Chỉ số phải là số hợp lệ.'
          return
        }

        if (moi <= cu) {
          e[item.ma_dv] = 'Chỉ số mới phải lớn hơn chỉ số cũ.'
          return
        }

        if (moi === cu) {
          e[item.ma_dv] = 'Tiêu thụ phải lớn hơn 0.'
          return
        }

        if (item.thanhTien > 0) {
          hasAny = true
        }
      } else {
        const amount = item.soLuong === '' ? 0 : Number(item.soLuong)
        if (amount > 0) {
          hasAny = true
        }

        if (item.soLuong !== '' && (!Number.isFinite(amount) || amount < 0)) {
          e[item.ma_dv] = 'Số lượng phải là số hợp lệ.'
          return
        }
      }
    })

    if (!isValidDate(date)) {
      e.date = 'Ngày phải có định dạng dd/mm/yyyy.'
    }

    const hasFieldErrors = Object.keys(e).some(key => key !== 'general' && key !== 'date')
    if (!hasAny && !hasFieldErrors) {
      e.general = 'Vui lòng nhập dữ liệu cho ít nhất một dịch vụ.'
    }

    return e
  }

  const handleSubmit = () => {
    const e = validate()
    if (Object.keys(e).length) return setErrors(e)

    const items = serviceRows
      .map(item => {
        if (isMeterService(item)) {
          return {
            maDV: item.ma_dv,
            ten: item.ten_dv,
            donVi: item.donVi,
            chiSoCu: Number(item.chiSoCu),
            chiSoMoi: Number(item.chiSoMoi),
            gia_dv: Number(item.gia_dv),
          }
        }
        return {
          maDV: item.ma_dv,
          ten: item.ten_dv,
          donVi: item.donVi,
          soLuong: Number(item.soLuong || 0),
          gia_dv: Number(item.gia_dv),
        }
      })
      .filter(item => {
        if (isMeterService(item)) {
          return item.chiSoMoi > item.chiSoCu
        }
        return item.soLuong > 0
      })

    setConfirmData({
      maPhong,
      ngay: date,
      items,
      tongCong: totalAmount,
    })
  }

  const handleConfirmSave = async () => {
    if (!confirmData) return
    setSubmitting(true)
    setServerError('')

    try {
      await api.post('/dich-vu/ghi-nhan', confirmData)
      showToast('Lập dịch vụ phòng thành công.')
      setConfirmData(null)
      onSaved()
    } catch (err) {
      setServerError(err.response?.data?.message || 'Lỗi khi lập chi tiết dịch vụ.')
      setConfirmData(null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={S.overlay}>
      <div style={S.modalBox}>
        <div style={S.modalHeader}>
          <h3 style={S.modalTitle}>Ghi Nhận Dịch Vụ - Phòng {maPhong}</h3>
          <button style={S.iconBtnPlain} onClick={onCancel}>×</button>
        </div>

        {loadingServices ? (
          <p style={S.emptyMsg}>Đang tải danh sách dịch vụ…</p>
        ) : (
          <div style={S.dialogBody}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={S.serviceFieldLabel}>Ngày ghi nhận</label>
                <input
                  style={S.input}
                  type="text"
                  placeholder="dd/mm/yyyy"
                  value={date}
                  onChange={e => setDate(normalizeDateInput(e.target.value))}
                />
              </div>
            </div>

            <div style={S.dialogScroll}>
              <div style={{ display: 'grid', gap: '14px' }}>
                {serviceRows.map(item => (
                  <div key={item.ma_dv} style={S.serviceRow}>
                    <div style={S.serviceLabel}>
                      <span>{item.ten_dv}</span>
                    </div>

                    <div style={S.serviceInputs}>
                      {isMeterService(item) ? (
                        <>
                          <div style={S.serviceField}>
                            <span style={S.serviceFieldLabel}>Chỉ số cũ</span>
                            <input
                              style={{ ...S.input, ...(errors[item.ma_dv] ? S.inputErr : {}) }}
                              type="number"
                              min="0"
                              value={item.chiSoCu}
                              onChange={e => setField(item.ma_dv, 'chiSoCu', e.target.value)}
                            />
                          </div>
                          <div style={S.serviceField}>
                            <span style={S.serviceFieldLabel}>Chỉ số mới</span>
                            <input
                              style={{ ...S.input, ...(errors[item.ma_dv] ? S.inputErr : {}) }}
                              type="number"
                              min="0"
                              value={item.chiSoMoi}
                              onChange={e => setField(item.ma_dv, 'chiSoMoi', e.target.value)}
                            />
                          </div>
                          <div style={S.serviceField}>
                            <span style={S.serviceFieldLabel}>Tiêu thụ</span>
                            <div>{item.soLuong === '' ? '--' : `${item.soLuong} ${item.donVi}`}</div>
                          </div>
                          <div style={{ ...S.serviceField, gridColumn: '4' }}>
                            <span style={S.serviceFieldLabel}>Thành tiền</span>
                            <strong>{formatMoney(item.thanhTien)}đ</strong>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ ...S.serviceField, gridColumn: 'span 3' }}>
                            <span style={S.serviceFieldLabel}>Số lượng</span>
                            <input
                              style={{ ...S.input, ...(errors[item.ma_dv] ? S.inputErr : {}) }}
                              type="number"
                              min="0"
                              value={item.soLuong}
                              onChange={e => setField(item.ma_dv, 'soLuong', e.target.value)}
                            />
                          </div>
                          <div style={{ ...S.serviceField, gridColumn: '4' }}>
                            <span style={S.serviceFieldLabel}>Thành tiền</span>
                            <strong>{formatMoney(item.thanhTien)}đ</strong>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {errors.date && <p style={S.errMsg}>{errors.date}</p>}
            {errors.general && <p style={S.errMsg}>{errors.general}</p>}
            {Object.keys(errors).filter(key => key !== 'general' && key !== 'date').map(key => (
              <p key={key} style={S.errMsg}>{errors[key]}</p>
            ))}
          </div>
        )}

        {serverError && <p style={{ ...S.errMsg, marginTop: '12px' }}>{serverError}</p>}

        <div style={S.modalFooter}>
          <div style={S.totalText}>
            Tổng cộng (Tạm tính): <strong style={S.totalMoney}>{formatMoney(totalAmount)}đ</strong>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={S.btnSecondary} onClick={onCancel} disabled={submitting}>Hủy</button>
            <button
              style={{
                ...S.btnPrimary,
                ...(loadingServices || submitting ? S.btnPrimaryDisabled : {}),
              }}
              onClick={handleSubmit}
              disabled={loadingServices || submitting}
            >
              Lập chi tiết dịch vụ
            </button>
          </div>
        </div>
      </div>

      {confirmData && (
        <div style={S.overlay}>
          <div style={S.confirmBox}>
            <h3 style={S.confirmTitle}>Xác nhận lập chi tiết dịch vụ</h3>
            <p style={S.confirmBody}>Bạn chắc chắn muốn lập chi tiết dịch vụ cho phòng này?</p>

            <div style={{ marginBottom: '24px' }}>
              <p style={{ margin: 0, color: '#4a4a4a', fontSize: '14px', lineHeight: 1.6 }}>
                Sau khi xác nhận, hệ thống sẽ lưu các dịch vụ đã chọn và chuyển sang trạng thái chờ thanh toán.
              </p>
            </div>

            <div style={S.confirmFooter}>
              <button style={S.btnSecondary} onClick={() => setConfirmData(null)} disabled={submitting}>Hủy</button>
              <button
                style={{ ...S.btnPrimary, ...(submitting ? S.btnPrimaryDisabled : {}) }}
                onClick={handleConfirmSave}
                disabled={submitting}
              >
                {submitting ? 'Đang lưu…' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function XacNhanThanhToanDialog({ maPhong, onCancel, onSaved, showToast }) {
  const [loading, setLoading] = useState(true)
  const [choThanhToan, setChoThanhToan] = useState([])
  const [daThanhToan, setDaThanhToan] = useState([])
  const [daChon, setDaChon] = useState(new Set())
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let huy = false
    setLoading(true)
    api.get('/dich-vu/cho-thanh-toan', { params: { maPhong } }).then(res => {
      if (huy) return
      const { choThanhToan: cho = [], daThanhToan: da = [] } = res.data || {}
      setChoThanhToan(cho)
      setDaThanhToan(da)
      setDaChon(new Set())
      setLoading(false)
    }).catch(() => {
      if (huy) return
      showToast('Không thể tải danh sách dịch vụ chờ thanh toán.', 'error')
      setLoading(false)
    })
    return () => { huy = true }
  }, [maPhong])

  const toggleChon = (maCT) => {
    setDaChon(prev => {
      const next = new Set(prev)
      next.has(maCT) ? next.delete(maCT) : next.add(maCT)
      return next
    })
  }

  const toggleAll = () => {
    setDaChon(prev => {
      if (choThanhToan.length > 0 && prev.size === choThanhToan.length) {
        return new Set()
      }
      return new Set(choThanhToan.map(ct => ct.maCT))
    })
  }

  const tongDaChon = choThanhToan
    .filter(ct => daChon.has(ct.maCT))
    .reduce((s, ct) => s + ct.thanhTien, 0)

  const handleXacNhan = async () => {
    if (daChon.size === 0) return
    setSubmitting(true)

    try {
      await api.post('/dich-vu/xac-nhan-thanh-toan', {
        maPhong,
        danhSachMaCT: Array.from(daChon),
      })
      showToast('Cập nhật thanh toán thành công.')
      onSaved()
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi xác nhận thanh toán.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={S.overlay}>
      <div style={{ ...S.modalBox, maxWidth: '820px' }}>
        <div style={S.modalHeader}>
          <h3 style={S.modalTitle}>Xác Nhận Thanh Toán Dịch Vụ - Phòng {maPhong}</h3>
          <button style={S.iconBtnPlain} onClick={onCancel}>×</button>
        </div>
        <p style={S.modalSubtitle}>Chọn các khoản dịch vụ khách hàng đã đóng tiền để cập nhật hệ thống.</p>

        <h4 style={S.sectionTitle}>1. Dịch vụ chờ thanh toán</h4>
        {loading ? (
          <p style={S.emptyMsg}>Đang tải danh sách dịch vụ…</p>
        ) : choThanhToan.length === 0 ? (
          <p style={S.emptyMsg}>Không có khoản dịch vụ nào đang chờ thanh toán.</p>
        ) : (
          <div style={{ ...S.tableWrap, ...S.tableScrollable, marginBottom: '14px' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>
                    <input
                      type="checkbox"
                      checked={choThanhToan.length > 0 && daChon.size === choThanhToan.length}
                      onChange={toggleAll}
                    />
                  </th>
                  <th style={S.th}>TÊN DỊCH VỤ</th>
                  <th style={S.thCenter}>SỐ LƯỢNG</th>
                  <th style={S.th}>ĐƠN GIÁ</th>
                  <th style={S.th}>THÀNH TIỀN</th>
                  <th style={S.th}>TRẠNG THÁI</th>
                </tr>
              </thead>
              <tbody>
                {choThanhToan.map(ct => (
                  <tr key={ct.maCT} style={S.tr}>
                    <td style={S.td}>
                      <input type="checkbox" checked={daChon.has(ct.maCT)} onChange={() => toggleChon(ct.maCT)} />
                    </td>
                    <td style={S.td}>{ct.ten}</td>
                    <td style={S.tdCenter}>{ct.soLuong} {donViDV(ct.maDV)}</td>
                    <td style={S.td}>{formatMoney(ct.donGia)}đ</td>
                    <td style={S.td}><strong>{formatMoney(ct.thanhTien)}đ</strong></td>
                    <td style={S.td}><span style={S.badgeWarn}>Chưa thanh toán</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && choThanhToan.length > 0 && (
          <div style={S.rowBetween}>
            <span>Đã chọn thanh toán: <strong>{daChon.size} khoản</strong> ({formatMoney(tongDaChon)}đ)</span>
            <button
              style={{ ...S.btnPrimary, ...((daChon.size === 0 || submitting) ? S.btnPrimaryDisabled : {}) }}
              onClick={handleXacNhan}
              disabled={daChon.size === 0 || submitting}
            >
              {submitting ? 'Đang xác nhận…' : 'Xác nhận đã thanh toán'}
            </button>
          </div>
        )}

        <h4 style={{ ...S.sectionTitle, marginTop: '22px' }}>2. Lịch sử dịch vụ đã thanh toán</h4>
        {daThanhToan.length === 0 ? (
          <p style={S.emptyMsg}>Chưa có lịch sử thanh toán.</p>
        ) : (
          <div style={{ ...S.tableWrap, ...S.historyTableWrap }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>TÊN DỊCH VỤ</th>
                  <th style={S.th}>NGÀY GHI NHẬN</th>
                  <th style={S.thCenter}>SỐ LƯỢNG</th>
                  <th style={S.th}>THÀNH TIỀN</th>
                  <th style={S.th}>TRẠNG THÁI</th>
                </tr>
              </thead>
              <tbody>
                {daThanhToan.map(ct => (
                  <tr key={ct.maCT} style={S.tr}>
                    <td style={S.td}>{ct.ten}</td>
                    <td style={S.td}>{formatNgay(ct.ngay)}</td>
                    <td style={S.tdCenter}>{ct.soLuong} {donViDV(ct.maDV)}</td>
                    <td style={S.td}>{formatMoney(ct.thanhTien)}đ</td>
                    <td style={S.td}><span style={S.badgeOk}>Đã thanh toán</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ ...S.modalFooter, justifyContent: 'flex-end' }}>
          <button style={S.btnSecondary} onClick={onCancel}>Đóng / Hủy thao tác</button>
        </div>
      </div>
    </div>
  )
}

export default function DichVuHangThangPage() {
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [maPhongChon, setMaPhongChon] = useState(null)
  const [dialogMo, setDialogMo] = useState(null) // 'ghiNhan' | 'thanhToan' | null
  const [toast, setToast] = useState(null)
  const searchTimer = useRef(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchList = async (q = search, p = page) => {
    setLoading(true)

    try {
      const res = await api.get('/dich-vu/phong', {
        params: { q: q.trim() || undefined, page: p, pageSize },
      })
      setList(res.data?.items || [])
      setTotal(res.data?.total || 0)
    } catch {
      showToast('Không thể tải danh sách phòng.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList(search, page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handleSearch = (value) => {
    setSearch(value)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      fetchList(value, 1)
    }, 350)
  }

  const phongDangChon = list.find(p => p.maPhong === maPhongChon)
  const tongSoTrang = Math.max(1, Math.ceil(total / pageSize))

  const handleChonPhong = (maPhong) => {
    setMaPhongChon(cur => (cur === maPhong ? null : maPhong))
  }

  const closeDialog = (needReload) => {
    setDialogMo(null)
    if (needReload) fetchList(search, page)
  }

  return (
    <section>
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9aa090"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          style={{ ...S.input, paddingLeft: '38px', maxWidth: '420px' }}
          placeholder="Tìm kiếm theo mã phòng"
          value={search}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>

      <div style={S.listHeader}>
        <PageTitle
          title="Quản Lý Dịch Vụ Phòng"
          description="Chọn một phòng để ghi nhận chỉ số sử dụng hoặc xác nhận thanh toán phí dịch vụ."
        />
      </div>

      <div style={S.tableWrap}>
        {loading ? (
          <p style={S.emptyMsg}>Đang tải…</p>
        ) : list.length === 0 ? (
          <p style={S.emptyMsg}>Không tìm thấy phòng phù hợp.</p>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}></th>
                <th style={S.th}>MÃ PHÒNG</th>
                <th style={S.th}>SỐ TIỀN DỰ KIẾN</th>
              </tr>
            </thead>
            <tbody>
              {list.map(p => (
                <tr
                  key={p.maPhong}
                  style={{ ...S.tr, ...(p.maPhong === maPhongChon ? S.trActive : {}), cursor: 'pointer' }}
                  onClick={() => handleChonPhong(p.maPhong)}
                >
                  <td style={S.td}>
                    <input
                      type="checkbox"
                      checked={p.maPhong === maPhongChon}
                      onChange={() => handleChonPhong(p.maPhong)}
                      onClick={e => e.stopPropagation()}
                    />
                  </td>
                  <td style={S.td}><strong>{p.maPhong}</strong></td>
                  <td style={S.td}>{p.soTienDuKien ? `${formatMoney(p.soTienDuKien)}đ` : '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={S.footerBar}>
        <div style={{ color: '#6b7560', fontSize: '14px' }}>
          {maPhongChon ? `Đang chọn: ${maPhongChon}` : 'Chưa chọn phòng nào'}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            style={{ ...S.btnPrimary, ...((!maPhongChon || Boolean(phongDangChon?.soTienDuKien)) ? S.btnPrimaryDisabled : {}) }}
            disabled={!maPhongChon || Boolean(phongDangChon?.soTienDuKien)}
            onClick={() => setDialogMo('ghiNhan')}
          >
            Ghi nhận chi tiết dịch vụ
          </button>
          <button
            style={{ ...S.btnPrimary, ...((!maPhongChon || !phongDangChon?.soTienDuKien) ? S.btnPrimaryDisabled : {}) }}
            disabled={!maPhongChon || !phongDangChon?.soTienDuKien}
            onClick={() => setDialogMo('thanhToan')}
          >
            Xác nhận thanh toán
          </button>
        </div>
      </div>

      {total > 0 && (
        <div style={S.pagination}>
          <span>Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} của {total} phòng.</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button style={S.pageBtn} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: tongSoTrang }, (_, i) => i + 1).map(num => (
              <button
                key={num}
                style={{ ...S.pageBtn, ...(num === page ? S.pageBtnActive : {}) }}
                onClick={() => setPage(num)}
              >
                {num}
              </button>
            ))}
            <button style={S.pageBtn} disabled={page >= tongSoTrang} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        </div>
      )}

      {dialogMo === 'ghiNhan' && maPhongChon && (
        <GhiNhanDichVuDialog
          maPhong={maPhongChon}
          onCancel={() => setDialogMo(null)}
          onSaved={() => closeDialog(true)}
          showToast={showToast}
        />
      )}

      {dialogMo === 'thanhToan' && maPhongChon && (
        <XacNhanThanhToanDialog
          maPhong={maPhongChon}
          onCancel={() => setDialogMo(null)}
          onSaved={() => closeDialog(true)}
          showToast={showToast}
        />
      )}

      {toast && (
        <div style={{ ...S.toast, ...(toast.type === 'error' ? S.toastError : S.toastSuccess) }}>
          {toast.msg}
        </div>
      )}
    </section>
  )
}

const S = {
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
    gap: '12px',
    flexWrap: 'wrap',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 14px',
    border: '1.5px solid #dde3d8',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: '#1a1f14',
    outline: 'none',
    boxShadow: 'none',
    backgroundColor: '#fff',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  },
  inputReadOnly: {
    backgroundColor: '#f5f6f2',
    color: '#6b7560',
  },
  inputErr: {
    border: '1.5px solid #c0392b',
    boxShadow: 'none',
  },
  tableWrap: {
    maxWidth: '100%',
    border: '1px solid #dde3d8',
    borderRadius: '10px',
    backgroundColor: '#fff',
    maxHeight: '60vh',
    overflowX: 'auto',
    overflowY: 'auto',
  },
  tableScrollable: {
    maxHeight: '320px',
    overflowY: 'auto',
  },
  historyTableWrap: {
    maxHeight: '180px',
    overflowY: 'auto',
    marginBottom: '18px',
  },
  table: {
    width: '100%',
    minWidth: '480px',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    padding: '12px 18px',
    textAlign: 'left',
    backgroundColor: '#fff',
    color: '#6b7560',
    fontWeight: 700,
    fontSize: '12px',
    letterSpacing: '0.4px',
    borderBottom: '1px solid #dde3d8',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  thCenter: {
    padding: '12px 18px',
    textAlign: 'center',
    backgroundColor: '#fff',
    color: '#6b7560',
    fontWeight: 700,
    fontSize: '12px',
    letterSpacing: '0.4px',
    borderBottom: '1px solid #dde3d8',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  tdCenter: {
    padding: '14px 18px',
    color: '#1a1f14',
    verticalAlign: 'middle',
    textAlign: 'center',
  },
  tr: {
    borderBottom: '1px solid #eef0eb',
  },
  trActive: {
    backgroundColor: '#f3f5ee',
  },
  td: {
    padding: '14px 18px',
    color: '#1a1f14',
    verticalAlign: 'middle',
  },
  emptyMsg: {
    textAlign: 'center',
    padding: '32px',
    color: '#9aa090',
    fontSize: '14px',
  },
  footerBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '14px',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '14px',
    color: '#6b7560',
    fontSize: '13px',
  },
  pageBtn: {
    width: '28px',
    height: '28px',
    border: '1px solid #dde3d8',
    background: '#fff',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  pageBtnActive: {
    backgroundColor: '#3b4f27',
    color: '#fff',
    borderColor: '#3b4f27',
  },
  btnSecondary: {
    padding: '8px 20px',
    backgroundColor: '#fff',
    color: '#1a1f14',
    border: '1.5px solid #dde3d8',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnPrimary: {
    padding: '8px 20px',
    backgroundColor: '#3b4f27',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  iconBtnPlain: {
    border: 'none',
    background: 'none',
    fontSize: '20px',
    lineHeight: 1,
    cursor: 'pointer',
    color: '#9aa090',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalBox: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: 'min(900px, calc(100vw - 32px))',
    maxWidth: '100%',
    maxHeight: '90vh',
    overflow: 'hidden',
    padding: '24px 28px',
  },
  dialogBody: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 auto',
    minHeight: 0,
    gap: '16px',
  },
  dialogScroll: {
    flex: '1 1 auto',
    minHeight: 0,
    maxHeight: 'calc(90vh - 260px)',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    margin: 0,
    fontSize: '17px',
    fontWeight: 700,
    color: '#1a1f14',
  },
  modalSubtitle: {
    margin: '4px 0 16px',
    fontSize: '13px',
    color: '#6b7560',
  },
  sectionTitle: {
    margin: '4px 0 8px',
    fontSize: '14px',
    fontWeight: 700,
    color: '#1a1f14',
  },
  serviceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '14px 0',
    borderBottom: '1px solid #eef0eb',
  },
  serviceLabel: {
    minWidth: '110px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: 700,
    color: '#1a1f14',
  },
  serviceInputs: {
    display: 'grid',
    gridTemplateColumns: 'minmax(160px, 1fr) minmax(160px, 1fr) minmax(130px, 1fr) minmax(140px, 1fr)',
    gap: '18px',
    alignItems: 'end',
    flex: 1,
  },
  serviceField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '12px',
    color: '#6b7560',
    minWidth: 0,
  },
  serviceFieldLabel: {
    color: '#9aa090',
  },
  rowBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    padding: '8px 4px',
    fontSize: '14px',
    color: '#1a1f14',
  },
  badgeWarn: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    backgroundColor: '#fbe8e6',
    color: '#c0392b',
  },
  badgeOk: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    backgroundColor: '#e5f2e7',
    color: '#3b4f27',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    paddingTop: '16px',
    marginTop: '12px',
    borderTop: '1px solid #eef0eb',
  },
  totalText: {
    fontSize: '14px',
    color: '#1a1f14',
  },
  totalMoney: {
    color: '#c0392b',
    fontSize: '22px',
    fontWeight: 800,
  },
  errMsg: {
    margin: '4px 0 0',
    fontSize: '12px',
    color: '#c0392b',
  },
  confirmBox: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: 'min(420px, calc(100vw - 32px))',
    maxWidth: '100%',
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
    margin: '0 0 20px',
    fontSize: '14px',
    color: '#4a4a4a',
    lineHeight: 1.6,
  },
  confirmFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  confirmInfoRow: {
    display: 'grid',
    gridTemplateColumns: '140px 1fr',
    gap: '12px',
    alignItems: 'start',
    fontSize: '14px',
  },
  confirmInfoLabel: {
    color: '#6b7560',
    fontWeight: 600,
  },
  confirmInfoValue: {
    color: '#1a1f14',
    fontWeight: 700,
    wordBreak: 'break-word',
  },
  btnPrimaryDisabled: {
    opacity: 0.58,
    cursor: 'not-allowed',
  },
  toast: {
    position: 'fixed',
    top: '90px',
    right: '24px',
    maxWidth: 'calc(100vw - 48px)',
    overflowWrap: 'anywhere',
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