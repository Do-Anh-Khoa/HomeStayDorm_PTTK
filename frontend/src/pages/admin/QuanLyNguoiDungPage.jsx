import { useEffect, useRef, useState } from 'react'
import PageTitle from '../../components/common/PageTitle.jsx'
import api from '../../services/api.js'

// ── helpers ──────────────────────────────────────────────────
const VAI_TRO_OPTIONS = [
  { value: 'SALE', label: 'Sale' },
  { value: 'PT',   label: 'Phụ trách' },
  { value: 'QL',   label: 'Quản lý' },
  { value: 'KT',   label: 'Kế toán' },
]

function fmtVaiTro(val) {
  return VAI_TRO_OPTIONS.find(o => o.value === val)?.label ?? val ?? '—'
}

function StatusBadge({ trangThai }) {
  const active = trangThai !== 'Đã nghỉ việc'
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 600,
      backgroundColor: active ? '#eaf2e3' : '#f5f5f5',
      color: active ? '#3b4f27' : '#9aa090',
    }}>
      {active ? 'Đang làm việc' : 'Đã nghỉ việc'}
    </span>
  )
}

function formatDateForDisplay(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

function normalizeDateInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function parseDateForApi(value) {
  if (!value) return ''
  const parts = value.split('/')
  if (parts.length === 3) {
    const [day, month, year] = parts
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  return value
}

function parseDateFromDisplay(value) {
  if (!value) return ''
  const parts = value.split('/')
  if (parts.length === 3) {
    const [day, month, year] = parts
    return new Date(`${year}-${month}-${day}`)
  }
  return new Date(value)
}

// ── icons ────────────────────────────────────────────────────
const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)
const IconFilter = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
)

// ── Delete Confirm Dialog ────────────────────────────────────
function DeleteDialog({ onCancel, onConfirm, submitting }) {
  return (
    <div style={S.overlay}>
      <div style={S.confirmBox}>
        <h3 style={S.confirmTitle}>Xác nhận xóa người dùng</h3>
        <p style={S.confirmBody}>
          Bạn có chắc chắn muốn xóa nhân viên không?
        </p>
        <p style={{ ...S.confirmBody, marginTop: '8px', fontSize: '13px', color: '#5c6560' }}>
          Thao tác này không thể hoàn tác.
        </p>
        <div style={S.confirmFooter}>
          <button style={S.btnSecondary} onClick={onCancel} disabled={submitting}>Hủy</button>
          <button style={{ ...S.btnPrimary, backgroundColor: '#c0392b' }} onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Đang xóa…' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Filter Panel ─────────────────────────────────────────────
function FilterPanel({ value, onChange, onClose }) {
  return (
    <div style={S.filterPanel}>
      <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: '#1a1f14' }}>Lọc theo vai trò</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={S.radioLabel}>
          <input type="radio" name="vaiTro" value="" checked={value === ''} onChange={() => onChange('')} style={{ accentColor: '#3b4f27' }} />
          Tất cả
        </label>
        {VAI_TRO_OPTIONS.map(o => (
          <label key={o.value} style={S.radioLabel}>
            <input type="radio" name="vaiTro" value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} style={{ accentColor: '#3b4f27' }} />
            {o.label}
          </label>
        ))}
      </div>
      <button style={{ ...S.btnPrimary, marginTop: '16px', width: '100%' }} onClick={onClose}>Áp dụng</button>
    </div>
  )
}

// ── Form View (Add / Edit) ───────────────────────────────────
const emptyForm = {
  ho_ten: '', mat_khau: '', cccd: '', sdt: '',
  gioi_tinh: 'Nam', ngay_sinh: '', luong: '',
  email: '', ma_chi_nhanh: '', vai_tro: 'SALE',
}

function FormView({ mode, initial, onSave, onCancel, submitting, serverError, chiNhanhOptions }) {
  const isEdit = mode === 'edit'
  const [form, setForm]     = useState(initial)
  const [errors, setErrors] = useState({})

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.ho_ten.trim())              e.ho_ten      = 'Vui lòng nhập họ tên.'
    if (!isEdit && !form.mat_khau.trim()) e.mat_khau    = 'Vui lòng nhập mật khẩu.'
    if (!isEdit && !form.cccd.trim())     e.cccd        = 'Vui lòng nhập CCCD.'
    if (!form.sdt.trim())                 e.sdt         = 'Vui lòng nhập số điện thoại.'
    if (!form.email.trim())               e.email       = 'Vui lòng nhập email.'
    if (!form.ma_chi_nhanh)               e.ma_chi_nhanh = 'Vui lòng chọn chi nhánh.'

    if (!form.ngay_sinh.trim()) {
      e.ngay_sinh = 'Vui lòng nhập ngày sinh.'
    } else {
      const [day, month, year] = form.ngay_sinh.split('/')
      const invalidDate = !day || !month || !year || day.length !== 2 || month.length !== 2 || year.length !== 4
      const birthDate = !invalidDate ? new Date(`${year}-${month}-${day}`) : new Date('invalid')
      if (invalidDate || Number.isNaN(birthDate.getTime()) || birthDate.getDate() !== Number(day) || birthDate.getMonth() + 1 !== Number(month) || birthDate.getFullYear() !== Number(year)) {
        e.ngay_sinh = 'Ngày sinh không hợp lệ.'
      } else {
        const today = new Date()
        const age = today.getFullYear() - birthDate.getFullYear() - ((today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) ? 1 : 0)
        if (age < 18) {
          e.ngay_sinh = 'Nhân viên phải từ 18 tuổi trở lên.'
        }
      }
    }

    if (!isEdit && (form.luong === '' || isNaN(Number(form.luong)) || Number(form.luong) < 0))
      e.luong = 'Mức lương phải là số không âm.'
    return e
  }

  const handleSubmit = () => {
    const e = validate()
    if (Object.keys(e).length) return setErrors(e)
    onSave({ ...form, luong: Number(form.luong) })
  }

  return (
    <section>
      <div style={{ marginBottom: '24px' }}>
        <PageTitle
          title={isEdit ? 'Cập nhật người dùng' : 'Thêm nhân viên mới'}
          description={isEdit
            ? `Nhân viên: ${initial.ma_nv}`
            : 'Vui lòng điền đầy đủ thông tin bên dưới để tạo tài khoản nhân viên mới trong hệ thống.'}
        />
      </div>

      <div style={S.formCard}>

        {/* Row 1: Họ và tên + Mật khẩu */}
        <div style={S.formRow}>
          <div style={S.formCol}>
            <label style={S.label}>Họ và tên</label>
            <input style={{ ...S.input, ...(errors.ho_ten ? S.inputErr : {}), ...(isEdit ? S.inputDisabled : {}) }}
              placeholder="Nhập họ tên nhân viên"
              value={form.ho_ten}
              onChange={e => !isEdit && set('ho_ten', e.target.value)}
              readOnly={isEdit}
            />
            {errors.ho_ten && <p style={S.errMsg}>{errors.ho_ten}</p>}
          </div>
          <div style={S.formCol}>
            <label style={S.label}>Mật khẩu</label>
            <input
              style={{ ...S.input, ...(errors.mat_khau ? S.inputErr : {}), ...(isEdit ? S.inputDisabled : {}) }}
              type="password"
              placeholder={isEdit ? '••••••••' : 'Nhập mật khẩu'}
              value={form.mat_khau}
              onChange={e => !isEdit && set('mat_khau', e.target.value)}
              readOnly={isEdit}
            />
            {errors.mat_khau && <p style={S.errMsg}>{errors.mat_khau}</p>}

          </div>
        </div>

        {/* Row 2: Số CCCD + Giới tính */}
        <div style={S.formRow}>
          <div style={S.formCol}>
            <label style={S.label}>Số CCCD (12 số)</label>
            <input
              style={{ ...S.input, ...(errors.cccd ? S.inputErr : {}), ...(isEdit ? S.inputDisabled : {}) }}
              placeholder="012345678901"
              value={form.cccd}
              onChange={e => !isEdit && set('cccd', e.target.value)}
              readOnly={isEdit}
              disabled={isEdit}
            />
            {errors.cccd && <p style={S.errMsg}>{errors.cccd}</p>}
          </div>
          <div style={S.formCol}>
            <label style={S.label}>Giới tính</label>
            <select
              style={{ ...S.input, ...(isEdit ? S.inputDisabled : {}) }}
              value={form.gioi_tinh}
              onChange={e => !isEdit && set('gioi_tinh', e.target.value)}
              disabled={isEdit}
            >
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>
        </div>

        {/* Row 3: Ngày sinh + Email công việc */}
        <div style={S.formRow}>
          <div style={S.formCol}>
            <label style={S.label}>Ngày sinh</label>
            <input
              style={{ ...S.input, ...(errors.ngay_sinh ? S.inputErr : {}) }}
              type="text"
              placeholder="dd/mm/yyyy"
              value={form.ngay_sinh}
              onChange={e => set('ngay_sinh', normalizeDateInput(e.target.value))}
            />
            {errors.ngay_sinh && <p style={S.errMsg}>{errors.ngay_sinh}</p>}
          </div>
          <div style={S.formCol}>
            <label style={S.label}>Email công việc</label>
            <input
              style={{ ...S.input, ...(errors.email ? S.inputErr : {}) }}
              type="email" placeholder="example@dormsystem.vn"
              value={form.email} onChange={e => set('email', e.target.value)}
            />
            {errors.email && <p style={S.errMsg}>{errors.email}</p>}
          </div>
        </div>

        {/* Row 4: Số điện thoại + Mức lương */}
        <div style={S.formRow}>
          <div style={S.formCol}>
            <label style={S.label}>Số điện thoại (10 số)</label>
            <input style={{ ...S.input, ...(errors.sdt ? S.inputErr : {}) }}
              placeholder="0123456789"
              value={form.sdt} onChange={e => set('sdt', e.target.value)} />
            {errors.sdt && <p style={S.errMsg}>{errors.sdt}</p>}
          </div>
          <div style={S.formCol}>
            <label style={S.label}>Mức lương (VND)</label>
            <input
              style={{ ...S.input, ...(errors.luong ? S.inputErr : {}) }}
              type="number" min="0"
              placeholder="Nhập mức lương cơ bản"
              value={form.luong}
              onChange={e => set('luong', e.target.value)}
            />
            {errors.luong && <p style={S.errMsg}>{errors.luong}</p>}
          </div>
        </div>

        {/* Row 5: Chi nhánh — full width */}
        <div style={{ marginBottom: '20px' }}>
          <label style={S.label}>Chi nhánh</label>
          <select
            style={{ ...S.input, ...(errors.ma_chi_nhanh ? S.inputErr : {}), ...(isEdit ? S.inputDisabled : {}), color: form.ma_chi_nhanh ? '#1a1f14' : '#9aa090' }}
            value={form.ma_chi_nhanh}
            onChange={e => !isEdit && set('ma_chi_nhanh', e.target.value)}
            disabled={isEdit}
          >
            <option value="" disabled>Chọn chi nhánh làm việc</option>
            {chiNhanhOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {errors.ma_chi_nhanh && <p style={S.errMsg}>{errors.ma_chi_nhanh}</p>}
        </div>

        {/* Row 6: Vai trò — toggle button group, full width */}
        <div style={{ marginBottom: '8px' }}>
          <label style={S.label}>Vai trò trong hệ thống</label>
          <div style={S.vaiTroGroup}>
            {VAI_TRO_OPTIONS.map(o => {
              const active = form.vai_tro === o.value
              return (
                <button
                  key={o.value}
                  type="button"
                  style={{
                    ...S.vaiTroBtn,
                    ...(active ? S.vaiTroBtnActive : {}),
                  }}
                  onClick={() => set('vai_tro', o.value)}
                >
                  {o.label}
                </button>
              )
            })}
          </div>
        </div>

        {serverError && <p style={{ ...S.errMsg, marginTop: '12px', fontSize: '13.5px' }}>{serverError}</p>}

        <div style={{ borderTop: '1px solid #eef0eb', margin: '24px 0 0' }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
          <button style={S.btnSecondary} onClick={onCancel} disabled={submitting}>Hủy</button>
          <button style={S.btnPrimary} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Đang lưu…' : 'Lưu người dùng'}
          </button>
        </div>
      </div>
    </section>
  )
}

// ── Main Page ────────────────────────────────────────────────
export default function QuanLyNguoiDungPage() {
  const [view, setView]               = useState('list')
  const [list, setList]               = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filterVaiTro, setFilterVaiTro] = useState('')
  const [showFilter, setShowFilter]   = useState(false)
  const [editTarget, setEditTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [submitting, setSubmitting]   = useState(false)
  const [serverError, setServerError] = useState('')
  const [toast, setToast]             = useState(null)
  const [chiNhanhOptions, setChiNhanhOptions] = useState([])
  const [isRoleLoading, setIsRoleLoading] = useState(false)
  const searchTimer                   = useRef(null)

  const fetchList = async (q = '', vaiTro = '') => {
    setLoading(true)
    try {
      const res = await api.get('/users')
      let data = res.data.data || []
      data = data.filter(item => item.loai_nv !== 'ADMIN')
      
      // Lọc theo tên hoặc mã nhân viên
      if (q) {
        const qLower = q.toLowerCase()
        data = data.filter(item =>
          item.ten_nv.toLowerCase().includes(qLower) ||
          item.ma_nv.toLowerCase().includes(qLower)
        )
      }
      
      // Lọc theo loại nhân viên (vai trò)
      if (vaiTro) {
        data = data.filter(item => item.loai_nv === vaiTro)
      }
      
      // Sắp xếp: đang làm việc trước, sau đó theo mã NV
      data.sort((a, b) => {
        const aActive = a.tinh_trang === 'Đang làm việc'
        const bActive = b.tinh_trang === 'Đang làm việc'
        if (aActive !== bActive) return aActive ? -1 : 1
        return a.ma_nv.localeCompare(b.ma_nv, undefined, { numeric: true, sensitivity: 'base' })
      })

      // Map dữ liệu để match với cấu trúc cũ
      const mappedData = data.map(item => ({
        ...item,
        ho_ten: item.ten_nv,
        vai_tro: item.loai_nv,
        ma_chi_nhanh: item.ma_cn,
      }))
      
      setList(mappedData)
    } catch (err) {
      console.error('Lỗi fetch users:', err)
      showToast('Không thể tải danh sách người dùng.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    fetchList()
    fetchChiNhanh()
  }, [])

  const fetchChiNhanh = async () => {
    try {
      const res = await api.get('/chi-nhanh')
      const options = res.data.data.map(cn => ({
        value: cn.ma_cn,
        label: `${cn.ma_cn} - ${cn.ten_cn}`,
      }))
      setChiNhanhOptions(options)
    } catch (err) {
      console.error('Lỗi fetch chi nhánh:', err)
      showToast('Không thể tải danh sách chi nhánh.', 'error')
    }
  }

  const handleSearch = (val) => {
    setSearch(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => fetchList(val, filterVaiTro), 350)
  }

  const handleApplyFilter = (vaiTro) => {
    setFilterVaiTro(vaiTro)
    setShowFilter(false)
    fetchList(search, vaiTro)
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSaveAdd = async (form) => {
    setSubmitting(true); setServerError('')
    try {
      // Map từ form sang API schema
      const apiPayload = {
        ten_nv: form.ho_ten,
        cccd: form.cccd,
        sdt: form.sdt,
        gioi_tinh: form.gioi_tinh,
        ngay_sinh: parseDateForApi(form.ngay_sinh),
        luong: form.luong,
        loai_nv: form.vai_tro,
        email: form.email,
        ma_cn: form.ma_chi_nhanh,
        mat_khau: form.mat_khau, // Thêm mật khẩu
      }
      await api.post('/users', apiPayload)
      showToast('Tạo người dùng thành công.')
      setView('list'); fetchList(search, filterVaiTro)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Lỗi khi thêm người dùng.')
    } finally { setSubmitting(false) }
  }

  const handleSaveEdit = async (form) => {
    setSubmitting(true); setServerError('')
    try {
      // Map từ form sang API schema (chỉ cập nhật các trường được phép)
      const apiPayload = {
        sdt: form.sdt,
        ngay_sinh: parseDateForApi(form.ngay_sinh),
        luong: form.luong,
        loai_nv: form.vai_tro,
        email: form.email,
      }
      await api.put(`/users/${editTarget.ma_nv}`, apiPayload)
      showToast('Cập nhật thông tin người dùng thành công.')
      setView('list'); fetchList(search, filterVaiTro)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Lỗi khi cập nhật.')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    setSubmitting(true)
    try {
      await api.delete(`/users/${deleteTarget.ma_nv}`)
      showToast('Xóa người dùng thành công.')
      setDeleteTarget(null); fetchList(search, filterVaiTro)
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi xóa.', 'error')
      setDeleteTarget(null)
    } finally { setSubmitting(false) }
  }

  if (view === 'add') {
    return (
      <FormView
        mode="add"
        initial={emptyForm}
        onSave={handleSaveAdd}
        onCancel={() => { setView('list'); setServerError('') }}
        submitting={submitting}
        serverError={serverError}
        chiNhanhOptions={chiNhanhOptions}
      />
    )
  }

  if (view === 'edit') {
    return (
      <FormView
        mode="edit"
        initial={{
          ma_nv:        editTarget.ma_nv,
          ho_ten:       editTarget.ho_ten       ?? '',
          mat_khau:     '',
          cccd:         editTarget.cccd         ?? '',
          sdt:          editTarget.sdt          ?? '',
          gioi_tinh:    editTarget.gioi_tinh    ?? 'Nam',
          ngay_sinh:    editTarget.ngay_sinh ? formatDateForDisplay(editTarget.ngay_sinh) : '',
          luong:        editTarget.luong        ?? '',
          email:        editTarget.email        ?? '',
          ma_chi_nhanh: editTarget.ma_chi_nhanh ?? '',
          vai_tro:      editTarget.vai_tro      ?? 'SALE',
        }}
        onSave={handleSaveEdit}
        onCancel={() => { setView('list'); setServerError('') }}
        submitting={submitting}
        serverError={serverError}
        chiNhanhOptions={chiNhanhOptions}
      />
    )
  }

  const filterActive = filterVaiTro !== ''

  return (
    <section>
      {/* Search row */}
      <div style={S.searchRow}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9aa090" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            style={{ ...S.input, paddingLeft: '38px', paddingTop: '12px', paddingBottom: '12px', borderRadius: '12px' }}
            placeholder="Tìm kiếm theo tên nhân viên hoặc mã nhân viên..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Header row */}
      <div style={S.listHeader}>
        <PageTitle
          title="QUẢN LÝ NGƯỜI DÙNG"
          description="Quản lý nhân viên trên toàn bộ hệ thống."
        />
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <button
              style={{
                ...S.btnSecondary,
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '12px 18px',
                minHeight: '44px',
                ...(filterActive ? { borderColor: '#3b4f27', color: '#3b4f27', backgroundColor: '#f0f4ec' } : {}),
              }}
              onClick={() => setShowFilter(v => !v)}
            >
              <IconFilter />
              Lọc {filterActive && `· ${fmtVaiTro(filterVaiTro)}`}
            </button>
            {showFilter && (
              <FilterPanel
                value={filterVaiTro}
                onChange={setFilterVaiTro}
                onClose={() => handleApplyFilter(filterVaiTro)}
              />
            )}
          </div>
          <button style={S.btnAdd} onClick={() => { setServerError(''); setView('add') }}>
            + Thêm nhân viên
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={S.tableWrap}>
        {loading ? (
          <p style={S.emptyMsg}>Đang tải…</p>
        ) : list.length === 0 ? (
          <p style={S.emptyMsg}>Không tìm thấy người dùng phù hợp.</p>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>MÃ NV</th>
                <th style={S.th}>HỌ TÊN</th>
                <th style={S.th}>VAI TRÒ</th>
                <th style={S.th}>SỐ ĐIỆN THOẠI</th>
                <th style={S.th}>CHI NHÁNH</th>
                <th style={{ ...S.th, textAlign: 'center' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.ma_nv} style={S.tr}>
                  <td style={S.td}><strong>{item.ma_nv}</strong></td>
                  <td style={S.td}>{item.ho_ten}</td>
                  <td style={S.td}>{fmtVaiTro(item.vai_tro)}</td>
                  <td style={S.td}>{item.sdt || '—'}</td>
                  <td style={S.td}>{item.ma_chi_nhanh || '—'}</td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    {item.tinh_trang === 'Đã nghỉ việc' ? (
                      <span style={S.disabledAction}>Đã nghỉ việc</span>
                    ) : (
                      <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          style={S.iconBtn}
                          title="Chỉnh sửa"
                          onClick={() => { setEditTarget(item); setServerError(''); setView('edit') }}
                        >
                          <IconEdit />
                        </button>
                        <button
                          style={{ ...S.iconBtn, color: '#c0392b' }}
                          title="Xóa"
                          onClick={() => setDeleteTarget(item)}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteTarget && (
        <DeleteDialog
          item={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          submitting={submitting}
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

// ── styles ───────────────────────────────────────────────────
const S = {
  listHeader:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', marginTop: '16px', gap: '12px', flexWrap: 'wrap' },
  btnAdd:         { flexShrink: 0, padding: '10px 20px', backgroundColor: '#3b4f27', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' },
  input:          { width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '1.5px solid #dde3d8', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', color: '#1a1f14', outline: 'none', backgroundColor: '#fff' },
  inputErr:       { borderColor: '#c0392b' },
  inputDisabled:  { backgroundColor: '#f4f6f1', color: '#6b7560', cursor: 'not-allowed' },
  tableWrap:      { maxWidth: '100%', border: '1px solid #dde3d8', borderRadius: '10px', backgroundColor: '#fff', maxHeight: '60vh', overflowX: 'auto', overflowY: 'auto' },
  table:          { width: '100%', minWidth: '760px', borderCollapse: 'collapse', fontSize: '14px' },
  th:             { padding: '12px 18px', textAlign: 'left', backgroundColor: '#fff', color: '#6b7560', fontWeight: 700, fontSize: '12px', letterSpacing: '0.4px', borderBottom: '1px solid #dde3d8', position: 'sticky', top: 0, zIndex: 1 },
  tr:             { borderBottom: '1px solid #eef0eb' },
  td:             { padding: '14px 18px', color: '#1a1f14', verticalAlign: 'middle' },
  iconBtn:        { width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '6px', color: '#3b4f27' },
  emptyMsg:       { textAlign: 'center', padding: '48px', color: '#9aa090', fontSize: '14px' },
  // form
  formCard:       { maxWidth: '100%', backgroundColor: '#fff', border: '1px solid #dde3d8', borderRadius: '12px', padding: '28px 32px' },
  formRow:        { display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' },
  formCol:        { flex: '1 1 220px' },
  label:          { display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#1a1f14', marginBottom: '7px' },
  errMsg:         { margin: '4px 0 0', fontSize: '12px', color: '#c0392b' },
  hintMsg:        { margin: '5px 0 0', fontSize: '12px', color: '#9aa090' },
  currencySymbol: { position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9aa090', fontSize: '14px', pointerEvents: 'none' },
  // vai trò toggle
  vaiTroGroup:    { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  vaiTroBtn:      { flex: '1 1 80px', padding: '10px 16px', border: '1.5px solid #dde3d8', borderRadius: '8px', backgroundColor: '#fff', color: '#1a1f14', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' },
  vaiTroBtnActive:{ backgroundColor: '#3b4f27', color: '#fff', borderColor: '#3b4f27', fontWeight: 700 },
  disabledAction: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 14px', borderRadius: '900px', fontSize: '12px', fontWeight: 700, color: '#7d8682', backgroundColor: '#f1f3f1', border: '1px solid #d8dbd8' },
  // filter panel
  searchRow:       { display: 'flex', gap: '10px', marginBottom: '16px', position: 'relative', alignItems: 'flex-start', flexWrap: 'wrap' },
  filterPanel:    { position: 'absolute', right: 0, top: 'calc(100% + 6px)', backgroundColor: '#fff', border: '1.5px solid #dde3d8', borderRadius: '10px', padding: '16px', width: '220px', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' },
  radioLabel:     { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#1a1f14', cursor: 'pointer' },
  // confirm dialog
  overlay:        { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  confirmBox:     { backgroundColor: '#fff', borderRadius: '12px', width: 'min(360px, calc(100vw - 32px))', maxWidth: '100%', padding: '28px 28px 24px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' },
  confirmTitle:   { margin: '0 0 12px', fontSize: '16px', fontWeight: 700, color: '#1a1f14' },
  confirmBody:    { margin: '0 0 24px', fontSize: '14px', color: '#4a4a4a', lineHeight: 1.6 },
  confirmFooter:  { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
  btnSecondary:   { padding: '8px 20px', backgroundColor: '#fff', color: '#1a1f14', border: '1.5px solid #dde3d8', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  btnPrimary:     { padding: '8px 20px', backgroundColor: '#3b4f27', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  // toast
  toast:          { position: 'fixed', top: '82px', right: '24px', maxWidth: 'calc(100vw - 48px)', overflowWrap: 'anywhere', padding: '12px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' },
  toastSuccess:   { backgroundColor: '#2e7d32', color: '#fff' },
  toastError:     { backgroundColor: '#c0392b', color: '#fff' },
}
