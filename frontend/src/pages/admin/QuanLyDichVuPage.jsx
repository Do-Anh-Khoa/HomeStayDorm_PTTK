import { useEffect, useRef, useState } from 'react'
import PageTitle from '../../components/common/PageTitle.jsx'
import api from '../../services/api.js'

// ── helpers ──────────────────────────────────────────────────
function fmtCurrency(val) {
  if (val == null || val === '') return '—'
  return Number(val).toLocaleString('vi-VN')
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

// ── Delete Confirm Dialog (giống ảnh mẫu) ───────────────────
function DeleteDialog({ item, onCancel, onConfirm, submitting }) {
  return (
    <div style={S.overlay}>
      <div style={S.confirmBox}>
        <h3 style={S.confirmTitle}>Xác nhận xóa dịch vụ</h3>
        <p style={S.confirmBody}>
          Bạn có chắc chắn muốn xóa dịch vụ <strong>"{item?.ten_dv}"</strong> không?
        </p>
        <div style={S.confirmFooter}>
          <button style={S.btnSecondary} onClick={onCancel} disabled={submitting}>Hủy</button>
          <button style={S.btnPrimary}   onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Đang xóa…' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Form View (Add / Edit) ───────────────────────────────────
const emptyForm = { ten_dv: '', don_vi_tinh: '', gia_dv: '' }

function FormView({ mode, initial, onSave, onCancel, submitting, serverError }) {
  const isEdit = mode === 'edit'
  const [form, setForm]     = useState(initial)
  const [errors, setErrors] = useState({})

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.ten_dv.trim()) e.ten_dv = 'Vui lòng nhập tên dịch vụ.'
    if (!isEdit && (form.gia_dv === '' || isNaN(Number(form.gia_dv)) || Number(form.gia_dv) < 0))
      e.gia_dv = 'Đơn giá phải là số không âm.'
    return e
  }

  const handleSubmit = () => {
    const e = validate()
    if (Object.keys(e).length) return setErrors(e)
    onSave({ ...form, gia_dv: Number(form.gia_dv) })
  }

  return (
    <section>
      <div style={{ marginBottom: '24px' }}>
        <PageTitle
          title={isEdit ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ mới'}
          description={isEdit ? `Dịch vụ: ${initial.ma_dv}` : 'Vui lòng nhập đầy đủ thông tin để khởi tạo dịch vụ tiện ích mới cho hệ thống ký túc xá.'}
        />
      </div>

      <div style={S.formCard}>
        {/* Tên + Đơn vị tính */}
        <div style={S.formRow}>
          <div style={S.formCol}>
            <label style={S.label}>Tên dịch vụ <span style={{ color: '#c0392b' }}>*</span></label>
            <input
              style={{ ...S.input, ...(errors.ten_dv ? S.inputErr : {}) }}
              placeholder="Ví dụ: Giữ xe tháng, Vệ sinh phòng..."
              value={form.ten_dv}
              onChange={e => set('ten_dv', e.target.value)}
            />
            {errors.ten_dv && <p style={S.errMsg}>{errors.ten_dv}</p>}
          </div>
          <div style={S.formCol}>
            <label style={S.label}>Đơn vị tính</label>
            <input
              style={S.input}
              placeholder="Ví dụ: kWh, m3, Tháng, Lượt..."
              value={form.don_vi_tinh}
              onChange={e => set('don_vi_tinh', e.target.value)}
            />
          </div>
        </div>

        {/* Đơn giá — full width */}
        <div style={{ marginBottom: '8px' }}>
          <label style={S.label}>
            Đơn giá (VND){!isEdit && <span style={{ color: '#c0392b' }}> *</span>}
          </label>
          <div style={{ position: 'relative' }}>
            <input
              style={{
                ...S.input,
                ...(errors.gia_dv ? S.inputErr : {}),
                ...(isEdit ? S.inputDisabled : {}),
                paddingRight: '32px',
              }}
              type="number"
              min="0"
              placeholder="Ví dụ: 50000"
              value={form.gia_dv}
              onChange={e => !isEdit && set('gia_dv', e.target.value)}
              readOnly={isEdit}
            />
            <span style={S.currencySymbol}>đ</span>
          </div>
          {errors.gia_dv && <p style={S.errMsg}>{errors.gia_dv}</p>}
          {isEdit && (
            <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#9aa090' }}>
              Đơn giá không thể thay đổi sau khi tạo.
            </p>
          )}
        </div>

        {serverError && <p style={{ ...S.errMsg, marginTop: '12px', fontSize: '13.5px' }}>{serverError}</p>}

        <div style={{ borderTop: '1px solid #eef0eb', margin: '20px 0 0' }} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
          <button style={S.btnSecondary} onClick={onCancel} disabled={submitting}>Hủy bỏ</button>
          <button style={S.btnPrimary}   onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Đang lưu…' : 'Lưu dịch vụ'}
          </button>
        </div>
      </div>
    </section>
  )
}

// ── Main Page ────────────────────────────────────────────────
export default function QuanLyDichVuPage() {
  const [view, setView]               = useState('list')
  const [list, setList]               = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [editTarget, setEditTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [submitting, setSubmitting]   = useState(false)
  const [serverError, setServerError] = useState('')
  const [toast, setToast]             = useState(null)
  const searchTimer                   = useRef(null)

  const fetchList = async (q = '') => {
    setLoading(true)
    try {
      const res = await api.get('/dich-vu', { params: q ? { q } : {} })
      setList(res.data)
    } catch {
      showToast('Không thể tải danh sách dịch vụ.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchList() }, [])

  const handleSearch = (val) => {
    setSearch(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => fetchList(val), 350)
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSaveAdd = async (form) => {
    setSubmitting(true); setServerError('')
    try {
      await api.post('/dich-vu', form)
      showToast('Thêm dịch vụ thành công.')
      setView('list'); fetchList(search)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Lỗi khi thêm dịch vụ.')
    } finally { setSubmitting(false) }
  }

  const handleSaveEdit = async (form) => {
    setSubmitting(true); setServerError('')
    try {
      await api.put(`/dich-vu/${editTarget.ma_dv}`, form)
      showToast('Cập nhật dịch vụ thành công.')
      setView('list'); fetchList(search)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Lỗi khi cập nhật.')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    setSubmitting(true)
    try {
      await api.delete(`/dich-vu/${deleteTarget.ma_dv}`)
      showToast('Đã xóa dịch vụ.')
      setDeleteTarget(null); fetchList(search)
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
      />
    )
  }

  if (view === 'edit') {
    return (
      <FormView
        mode="edit"
        initial={{ ma_dv: editTarget.ma_dv, ten_dv: editTarget.ten_dv, don_vi_tinh: editTarget.don_vi_tinh ?? '', gia_dv: editTarget.gia_dv ?? '' }}
        onSave={handleSaveEdit}
        onCancel={() => { setView('list'); setServerError('') }}
        submitting={submitting}
        serverError={serverError}
      />
    )
  }

  return (
    <section>
      {/* Header row */}
      <div style={S.listHeader}>
        <div>
          <PageTitle
  title="QUẢN LÝ DỊCH VỤ"
  description="Danh sách dịch vụ có trên toàn bộ hệ thống."
/>
        </div>
        <button style={S.btnAdd} onClick={() => { setServerError(''); setView('add') }}>
          + Thêm dịch vụ
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9aa090" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          style={{ ...S.input, paddingLeft: '38px', paddingTop: '10px', paddingBottom: '10px' }}
          placeholder="Tìm kiếm theo mã hoặc tên dịch vụ..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div style={S.tableWrap}>
        {loading ? (
          <p style={S.emptyMsg}>Đang tải…</p>
        ) : list.length === 0 ? (
          <p style={S.emptyMsg}>Không có dịch vụ nào.</p>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>MÃ DỊCH VỤ</th>
                <th style={S.th}>TÊN DỊCH VỤ</th>
                <th style={S.th}>ĐƠN GIÁ (VND)</th>
                <th style={S.th}>ĐƠN VỊ TÍNH</th>
                <th style={{ ...S.th, textAlign: 'center' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.ma_dv} style={S.tr}>
                  <td style={S.td}><strong>{item.ma_dv}</strong></td>
                  <td style={S.td}>{item.ten_dv}</td>
                  <td style={S.td}>{fmtCurrency(item.gia_dv)}</td>
                  <td style={S.td}>{item.don_vi_tinh || '—'}</td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
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
  pageHeading:    { margin: '0 0 4px', fontSize: '26px', fontWeight: 800, color: '#1a1f14', letterSpacing: '-0.3px' },
  pageSubheading: { margin: 0, fontSize: '14px', color: '#6b7560' },
  listHeader:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', marginTop: '16px', gap: '12px', flexWrap: 'wrap' },
  btnAdd:         { flexShrink: 0, padding: '10px 20px', backgroundColor: '#3b4f27', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' },
  input:          { width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '1.5px solid #dde3d8', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', color: '#1a1f14', outline: 'none', backgroundColor: '#fff' },
  inputErr:       { borderColor: '#c0392b' },
  inputDisabled:  { backgroundColor: '#f4f6f1', color: '#6b7560', cursor: 'not-allowed' },
  tableWrap:      { maxWidth: '100%', border: '1px solid #dde3d8', borderRadius: '10px', backgroundColor: '#fff', maxHeight: '60vh', overflowX: 'auto', overflowY: 'auto' },
  table:          { width: '100%', minWidth: '640px', borderCollapse: 'collapse', fontSize: '14px' },
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
  currencySymbol: { position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9aa090', fontSize: '14px', pointerEvents: 'none' },
  // confirm dialog — compact, giống ảnh mẫu
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
