import { useEffect, useRef, useState } from 'react'
import PageTitle from '../../components/common/PageTitle.jsx'
import api from '../../services/api.js'

// Icons
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

// Hộp thoại Xác nhận Xóa
function DeleteDialog({ item, onCancel, onConfirm, submitting }) {
  return (
    <div style={S.overlay}>
      <div style={S.confirmBox}>
        <h3 style={S.confirmTitle}>Xác nhận xóa chi nhánh?</h3>
        <p style={S.confirmBody}>
          Bạn có chắc chắn muốn xóa chi nhánh <strong>"{item?.ten_cn}"</strong> không?
        </p>
        <div style={S.confirmFooter}>
          <button style={S.btnSecondary} onClick={onCancel} disabled={submitting}>Hủy</button>
          <button style={S.btnDanger} onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Đang xóa…' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  )
}
// Hộp thoại Xác nhận Thêm/Sửa
function ChiNhanhConfirmDialog({ mode, data, onCancel, onConfirm, submitting }) {
  const isEdit = mode === 'edit'

  return (
    <div style={S.overlay}>
      <div style={S.confirmBox}>
        <h3 style={S.confirmTitle}>
          {isEdit ? 'Xác nhận cập nhật chi nhánh' : 'Xác nhận thêm chi nhánh'}
        </h3>

        <p style={S.confirmBody}>
          Vui lòng kiểm tra lại thông tin trước khi {isEdit ? 'cập nhật' : 'thêm'} chi nhánh.
        </p>

        <div style={{ display: 'grid', gap: '10px', marginBottom: '24px' }}>
          {isEdit && data.ma_cn && (
            <div style={S.confirmInfoRow}>
              <span style={S.confirmInfoLabel}>Mã chi nhánh</span>
              <strong style={S.confirmInfoValue}>{data.ma_cn}</strong>
            </div>
          )}

          <div style={S.confirmInfoRow}>
            <span style={S.confirmInfoLabel}>Tên chi nhánh</span>
            <strong style={S.confirmInfoValue}>{data.ten_cn}</strong>
          </div>

          <div style={S.confirmInfoRow}>
            <span style={S.confirmInfoLabel}>Số điện thoại</span>
            <strong style={S.confirmInfoValue}>{data.sdt}</strong>
          </div>
          
          <div style={S.confirmInfoRow}>
            <span style={S.confirmInfoLabel}>Địa chỉ</span>
            <strong style={S.confirmInfoValue}>{data.dia_chi}</strong>
          </div>
        </div>

        <div style={S.confirmFooter}>
          <button style={S.btnSecondary} onClick={onCancel} disabled={submitting}>
            Hủy
          </button>
          <button style={S.btnPrimary} onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Đang lưu…' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  )
}
// Form Thêm / Cập nhật
const emptyForm = { ten_cn: '', sdt: '', dia_chi: '' }

function FormView({ mode, initial, onSave, onCancel, submitting, serverError }) {
  const isEdit = mode === 'edit'
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  // Thêm biến state để quản lý việc mở/đóng hộp thoại xác nhận
  const [confirmData, setConfirmData] = useState(null)

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.ten_cn.trim()) e.ten_cn = 'Vui lòng nhập tên chi nhánh.'
    if (!form.dia_chi.trim()) e.dia_chi = 'Vui lòng nhập địa chỉ.'
    const phoneRegex = /^[0-9]{9,11}$/
    if (!form.sdt.trim() || !phoneRegex.test(form.sdt.trim())) {
      e.sdt = 'Số điện thoại không hợp lệ (9-11 số).'
    }
    return e
  }

  // Khi bấm nút "Lưu" ở form, ta chỉ validate và mở hộp thoại chứ chưa save
  const handleSubmit = () => {
    const e = validate()
    if (Object.keys(e).length) return setErrors(e)
    
    // Đẩy dữ liệu vào confirmData để hộp thoại hiện lên
    setConfirmData(form)
  }

  // Hàm này mới thực sự lưu dữ liệu khi bấm "Xác nhận" trên hộp thoại
  const handleConfirmSave = async () => {
    if (!confirmData) return
    await onSave(confirmData)
    setConfirmData(null)
  }

  return (
    <section>
      <div style={{ marginBottom: '24px' }}>
        <PageTitle
          title={isEdit ? 'Cập nhật thông tin chi nhánh' : 'Thêm chi nhánh mới'}
          description={isEdit ? `Chi nhánh: ${initial.ma_cn}` : 'Vui lòng nhập đầy đủ thông tin để khởi tạo chi nhánh mới cho hệ thống ký túc xá.'}
        />
      </div>

      <div style={S.formCard}>
        <div style={S.formRow}>
          <div style={S.formCol}>
            <label style={S.label}>Tên chi nhánh</label>
            <input
              style={{ ...S.input, ...(errors.ten_cn ? S.inputErr : {}) }}
              placeholder="Nhập tên chi nhánh mới"
              value={form.ten_cn}
              onChange={e => set('ten_cn', e.target.value)}
            />
            {errors.ten_cn && <p style={S.errMsg}>{errors.ten_cn}</p>}
          </div>
          <div style={S.formCol}>
            <label style={S.label}>Số điện thoại (10 số)</label>
            <input
              style={{ ...S.input, ...(errors.sdt ? S.inputErr : {}) }}
              placeholder="0123456789"
              value={form.sdt}
              onChange={e => set('sdt', e.target.value)}
            />
            {errors.sdt && <p style={S.errMsg}>{errors.sdt}</p>}
          </div>
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={S.label}>Địa chỉ</label>
          <textarea
            rows={4}
            style={{ ...S.input, resize: 'vertical', lineHeight: 1.6, ...(errors.dia_chi ? S.inputErr : {}) }}
            placeholder="Nhập địa chỉ của chi nhánh mới"
            value={form.dia_chi}
            onChange={e => set('dia_chi', e.target.value)}
          />
          {errors.dia_chi && <p style={S.errMsg}>{errors.dia_chi}</p>}
        </div>

        {serverError && <p style={{ ...S.errMsg, marginTop: '12px', fontSize: '13.5px' }}>{serverError}</p>}

        <div style={{ borderTop: '1px solid #eef0eb', margin: '20px 0 0' }} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
          <button style={S.btnSecondary} onClick={onCancel} disabled={submitting}>Hủy</button>
          <button style={S.btnPrimary} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Đang lưu…' : (isEdit ? 'Cập nhật' : 'Lưu chi nhánh')}
          </button>
        </div>
      </div>

      {/* Hiển thị hộp thoại khi có dữ liệu trong confirmData */}
      {confirmData && (
        <ChiNhanhConfirmDialog
          mode={mode}
          data={confirmData}
          onCancel={() => setConfirmData(null)}
          onConfirm={handleConfirmSave}
          submitting={submitting}
        />
      )}
    </section>
  )
}

// Trang Chính
export default function QuanLyChiNhanhPage() {
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
      const res = await api.get('/chi-nhanh', { params: q ? { q } : {} })
      setList(res.data?.data || res.data || [])
    } catch {
      showToast('Không thể tải danh sách chi nhánh.', 'error')
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
      await api.post('/chi-nhanh', form)
      showToast('Thêm chi nhánh thành công.')
      setView('list'); fetchList(search)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Lỗi khi thêm chi nhánh.')
    } finally { setSubmitting(false) }
  }

  const handleSaveEdit = async (form) => {
    setSubmitting(true); setServerError('')
    try {
      await api.put(`/chi-nhanh/${editTarget.ma_cn}`, form)
      showToast('Cập nhật thông tin thành công.')
      setView('list'); fetchList(search)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Lỗi khi cập nhật chi nhánh.')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    setSubmitting(true)
    try {
      await api.delete(`/chi-nhanh/${deleteTarget.ma_cn}`)
      showToast('Xóa chi nhánh thành công.')
      setDeleteTarget(null); fetchList(search)
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi xóa chi nhánh.', 'error')
      setDeleteTarget(null)
    } finally { setSubmitting(false) }
  }

  if (view === 'add') {
    return (
      <FormView mode="add" initial={emptyForm} onSave={handleSaveAdd} onCancel={() => { setView('list'); setServerError('') }} submitting={submitting} serverError={serverError} />
    )
  }

  if (view === 'edit') {
    return (
      <FormView mode="edit" initial={{ ma_cn: editTarget.ma_cn, ten_cn: editTarget.ten_cn, sdt: editTarget.sdt, dia_chi: editTarget.dia_chi }} onSave={handleSaveEdit} onCancel={() => { setView('list'); setServerError('') }} submitting={submitting} serverError={serverError} />
    )
  }

  return (
    <section>
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9aa090" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input style={{ ...S.input, paddingLeft: '38px', paddingTop: '10px', paddingBottom: '10px' }} placeholder="Tìm kiếm theo tên hoặc mã chi nhánh..." value={search} onChange={e => handleSearch(e.target.value)} />
      </div>

      <div style={S.listHeader}>
        <div>
          <PageTitle title="QUẢN LÝ CHI NHÁNH" description="Quản lý chi nhánh trên toàn hệ thống" />
        </div>
        <button style={S.btnAdd} onClick={() => { setServerError(''); setView('add') }}>+ Thêm chi nhánh</button>
      </div>

      <div style={S.tableWrap}>
        {loading ? (
          <p style={S.emptyMsg}>Đang tải…</p>
        ) : list.length === 0 ? (
          <p style={S.emptyMsg}>Không tìm thấy chi nhánh phù hợp.</p>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>MÃ CN</th>
                <th style={S.th}>TÊN CHI NHÁNH</th>
                <th style={S.th}>SỐ ĐIỆN THOẠI</th>
                <th style={S.th}>ĐỊA CHỈ</th>
                <th style={{ ...S.th, textAlign: 'center' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.ma_cn} style={S.tr}>
                  <td style={S.td}><strong>{item.ma_cn}</strong></td>
                  <td style={S.td}>{item.ten_cn}</td>
                  <td style={S.td}>{item.sdt}</td>
                  <td style={S.td}>{item.dia_chi}</td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
                      <button style={S.iconBtn} title="Chỉnh sửa" onClick={() => { setEditTarget(item); setServerError(''); setView('edit') }}><IconEdit /></button>
                      <button style={{ ...S.iconBtn, color: '#c0392b' }} title="Xóa" onClick={() => setDeleteTarget(item)}><IconTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteTarget && <DeleteDialog item={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} submitting={submitting} />}
      {toast && <div style={{ ...S.toast, ...(toast.type === 'error' ? S.toastError : S.toastSuccess) }}>{toast.msg}</div>}
    </section>
  )
}

const S = {
  listHeader:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', marginTop: '16px', gap: '12px', flexWrap: 'wrap' },
  btnAdd:         { flexShrink: 0, padding: '10px 20px', backgroundColor: '#3b4f27', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' },
  input:          { width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '1.5px solid #dde3d8', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', color: '#1a1f14', outline: 'none', backgroundColor: '#fff' },
  inputErr:       { borderColor: '#c0392b' },
  tableWrap:      { maxWidth: '100%', border: '1px solid #dde3d8', borderRadius: '10px', backgroundColor: '#fff', maxHeight: '60vh', overflowX: 'auto', overflowY: 'auto' },
  table:          { width: '100%', minWidth: '640px', borderCollapse: 'collapse', fontSize: '14px' },
  th:             { padding: '12px 18px', textAlign: 'left', backgroundColor: '#fff', color: '#6b7560', fontWeight: 700, fontSize: '12px', letterSpacing: '0.4px', borderBottom: '1px solid #dde3d8', position: 'sticky', top: 0, zIndex: 1 },
  tr:             { borderBottom: '1px solid #eef0eb' },
  td:             { padding: '14px 18px', color: '#1a1f14', verticalAlign: 'middle' },
  iconBtn:        { width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '6px', color: '#3b4f27' },
  emptyMsg:       { textAlign: 'center', padding: '48px', color: '#9aa090', fontSize: '14px' },
  formCard:       { maxWidth: '100%', backgroundColor: '#fff', border: '1px solid #dde3d8', borderRadius: '12px', padding: '28px 32px' },
  formRow:        { display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' },
  formCol:        { flex: '1 1 220px' },
  label:          { display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#1a1f14', marginBottom: '7px' },
  errMsg:         { margin: '4px 0 0', fontSize: '12px', color: '#c0392b' },
  overlay:        { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  confirmBox:     { backgroundColor: '#fff', borderRadius: '12px', width: 'min(360px, calc(100vw - 32px))', maxWidth: '100%', padding: '28px 28px 24px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' },
  confirmTitle:   { margin: '0 0 12px', fontSize: '16px', fontWeight: 700, color: '#1a1f14' },
  confirmBody:    { margin: '0 0 24px', fontSize: '14px', color: '#4a4a4a', lineHeight: 1.6 },
  confirmFooter:  { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
  btnSecondary:   { padding: '8px 20px', backgroundColor: '#fff', color: '#1a1f14', border: '1.5px solid #dde3d8', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  btnPrimary:     { padding: '8px 20px', backgroundColor: '#3b4f27', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  btnDanger:      { padding: '8px 20px', backgroundColor: '#c0392b', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  toast:          { position: 'fixed', top: '82px', right: '24px', maxWidth: 'calc(100vw - 48px)', overflowWrap: 'anywhere', padding: '12px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' },
  toastSuccess:   { backgroundColor: '#2e7d32', color: '#fff' },
  toastError:     { backgroundColor: '#c0392b', color: '#fff' },
}