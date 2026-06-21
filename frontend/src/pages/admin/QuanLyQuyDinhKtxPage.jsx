import { useEffect, useRef, useState } from 'react'
import PageTitle from '../../components/common/PageTitle.jsx'
import api from '../../services/api.js'

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

// ── Delete Confirm Dialog ────────────────────────────────────
function DeleteDialog({ item, onCancel, onConfirm, submitting }) {
  return (
    <div style={S.overlay}>
      <div style={S.confirmBox}>
        <h3 style={S.confirmTitle}>Xác nhận xóa quy định KTX</h3>
        <p style={S.confirmBody}>
          Bạn có chắc chắn muốn xóa quy định KTX không?
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

// ── Form View (Add / Edit) ───────────────────────────────────
const emptyForm = { ten_qd: '', noi_dung: '' }

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
    if (!form.ten_qd.trim())   e.ten_qd   = 'Vui lòng nhập tên quy định.'
    if (!form.noi_dung.trim()) e.noi_dung = 'Vui lòng nhập nội dung quy định.'
    return e
  }

  const handleSubmit = () => {
    const e = validate()
    if (Object.keys(e).length) return setErrors(e)
    onSave(form)
  }

  return (
    <section>
      <div style={{ marginBottom: '24px' }}>
        <PageTitle
          title={isEdit ? 'Cập nhật quy định' : 'Thêm quy định mới'}
          description={isEdit
            ? `Mã quy định KTX: ${initial.ma_qd}`
            : 'Khởi tạo chính sách và điều khoản nội quy mới áp dụng cho ký túc xá.'}
        />
      </div>

      <div style={S.formCard}>
        {/* Tên quy định */}
        <div style={{ marginBottom: '20px' }}>
          <label style={S.label}>Tên quy định</label>
          <input
            style={{ ...S.input, ...(errors.ten_qd ? S.inputErr : {}) }}
            placeholder="Ví dụ: Quy định giờ giấc, Quy định vệ sinh..."
            value={form.ten_qd}
            onChange={e => set('ten_qd', e.target.value)}
          />
          {errors.ten_qd && <p style={S.errMsg}>{errors.ten_qd}</p>}
        </div>

        {/* Nội dung quy định */}
        <div style={{ marginBottom: '20px' }}>
          <label style={S.label}>Nội dung quy định</label>
          <textarea
            style={{ ...S.textarea, ...(errors.noi_dung ? S.inputErr : {}), resize: 'none' }}
            placeholder="Nhập chi tiết nội dung quy định..."
            rows={6}
            value={form.noi_dung}
            onChange={e => set('noi_dung', e.target.value)}
          />
          {errors.noi_dung && <p style={S.errMsg}>{errors.noi_dung}</p>}
        </div>

        {serverError && <p style={{ ...S.errMsg, marginTop: '12px', fontSize: '13.5px' }}>{serverError}</p>}

        <div style={{ borderTop: '1px solid #eef0eb', margin: '24px 0 0' }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
          <button style={S.btnSecondary} onClick={onCancel} disabled={submitting}>Hủy bỏ</button>
          <button style={S.btnPrimary} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Đang lưu…' : isEdit ? 'Cập nhật' : 'Lưu quy định'}
          </button>
        </div>
      </div>
    </section>
  )
}

// ── Main Page ────────────────────────────────────────────────
export default function QuanLyQuyDinhKTXPage() {
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
      const res = await api.get('/quy-dinh-ktx', { params: q ? { q } : {} })
      setList(res.data)
    } catch {
      showToast('Không thể tải danh sách quy định.', 'error')
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
      await api.post('/quy-dinh-ktx', form)
      showToast('Thêm quy định thành công.')
      setView('list'); fetchList(search)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Lỗi khi thêm quy định.')
    } finally { setSubmitting(false) }
  }

  const handleSaveEdit = async (form) => {
    setSubmitting(true); setServerError('')
    try {
      await api.put(`/quy-dinh-ktx/${editTarget.ma_qd}`, form)
      showToast('Cập nhật thông tin thành công.')
      setView('list'); fetchList(search)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Lỗi khi cập nhật.')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    setSubmitting(true)
    try {
      await api.delete(`/quy-dinh-ktx/${deleteTarget.ma_qd}`)
      showToast('Xóa quy định thành công.')
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
        initial={{ ma_qd: editTarget.ma_qd, ten_qd: editTarget.ten_qd, noi_dung: editTarget.noi_dung ?? '' }}
        onSave={handleSaveEdit}
        onCancel={() => { setView('list'); setServerError('') }}
        submitting={submitting}
        serverError={serverError}
      />
    )
  }

  return (
    <section>
      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9aa090" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          style={{ ...S.input, paddingLeft: '38px', paddingTop: '12px', paddingBottom: '12px', borderRadius: '12px' }}
          placeholder="Tìm kiếm theo mã hoặc tên quy định..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>

      {/* Header row */}
      <div style={S.listHeader}>
        <PageTitle
          title="QUẢN LÝ QUY ĐỊNH KTX"
          description="Danh sách quy định đang áp dụng trên toàn bộ hệ thống."
        />
        <button style={S.btnAdd} onClick={() => { setServerError(''); setView('add') }}>
          + Thêm quy định
        </button>
      </div>

      {/* Table */}
      <div style={S.tableWrap}>
        {loading ? (
          <p style={S.emptyMsg}>Đang tải…</p>
        ) : list.length === 0 ? (
          <p style={S.emptyMsg}>Không tìm thấy quy định phù hợp.</p>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={{ ...S.th, width: '140px' }}>MÃ QUY ĐỊNH</th>
                <th style={{ ...S.th, width: '240px' }}>TÊN QUY ĐỊNH</th>
                <th style={S.th}>NỘI DUNG QUY ĐỊNH</th>
                <th style={{ ...S.th, textAlign: 'center', width: '100px' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.ma_qd} style={S.tr}>
                  <td style={{ ...S.td, textAlign: 'center' }}><strong>{item.ma_qd}</strong></td>
                  <td style={S.td}>{item.ten_qd}</td>
                  <td style={{ ...S.td, ...S.tdContent }}>{item.noi_dung}</td>
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
  listHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', marginTop: '16px', gap: '12px', flexWrap: 'wrap' },
  btnAdd:        { flexShrink: 0, padding: '10px 20px', backgroundColor: '#3b4f27', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' },
  input:         { width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '1.5px solid #dde3d8', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', color: '#1a1f14', outline: 'none', backgroundColor: '#fff' },
  textarea:      { width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '1.5px solid #dde3d8', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', color: '#1a1f14', outline: 'none', backgroundColor: '#fff', resize: 'vertical', lineHeight: 1.6 },
  inputErr:      { borderColor: '#c0392b' },
  inputDisabled: { backgroundColor: '#f4f6f1', color: '#6b7560', cursor: 'not-allowed' },
  tableWrap:     { border: '1px solid #dde3d8', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#fff', maxHeight: '60vh', overflowY: 'auto' },
  table:         { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th:            { padding: '12px 18px', textAlign: 'left', backgroundColor: '#fff', color: '#6b7560', fontWeight: 700, fontSize: '12px', letterSpacing: '0.4px', borderBottom: '1px solid #dde3d8', position: 'sticky', top: 0, zIndex: 1 },
  tr:            { borderBottom: '1px solid #eef0eb' },
  td:            { padding: '14px 18px', color: '#1a1f14', verticalAlign: 'top' },
  tdContent:     { color: '#4a4a4a', lineHeight: 1.6, whiteSpace: 'pre-wrap', maxWidth: '480px' },
  iconBtn:       { width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '6px', color: '#3b4f27' },
  emptyMsg:      { textAlign: 'center', padding: '48px', color: '#9aa090', fontSize: '14px' },
  // form
  formCard:      { backgroundColor: '#fff', border: '1px solid #dde3d8', borderRadius: '12px', padding: '28px 32px' },
  label:         { display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#1a1f14', marginBottom: '7px' },
  errMsg:        { margin: '4px 0 0', fontSize: '12px', color: '#c0392b' },
  hintMsg:       { margin: '5px 0 0', fontSize: '12px', color: '#9aa090' },
  // confirm dialog
  overlay:       { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  confirmBox:    { backgroundColor: '#fff', borderRadius: '12px', width: '400px', padding: '28px 28px 24px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' },
  confirmTitle:  { margin: '0 0 12px', fontSize: '16px', fontWeight: 700, color: '#1a1f14' },
  confirmBody:   { margin: '0 0 24px', fontSize: '14px', color: '#4a4a4a', lineHeight: 1.6 },
  confirmFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
  btnSecondary:  { padding: '8px 20px', backgroundColor: '#fff', color: '#1a1f14', border: '1.5px solid #dde3d8', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  btnPrimary:    { padding: '8px 20px', backgroundColor: '#3b4f27', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  // toast
  toast:         { position: 'fixed', top: '82px', right: '450px', padding: '12px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' },
  toastSuccess:  { backgroundColor: '#2e7d32', color: '#fff' },
  toastError:    { backgroundColor: '#c0392b', color: '#fff' },
}