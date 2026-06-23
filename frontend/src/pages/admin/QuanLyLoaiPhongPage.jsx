import { useEffect, useRef, useState } from 'react'
import PageTitle from '../../components/common/PageTitle.jsx'
import api from '../../services/api.js'

// Hàm format tiền tệ
const parseMoney = (value) => {
  const raw = String(value ?? '').replace(/[^\d]/g, '')
  return raw ? Number(raw) : 0
}

const formatMoney = (value) => {
  const raw = String(value ?? '').replace(/[^\d]/g, '')
  return raw ? Number(raw).toLocaleString('vi-VN') : '0'
}

const formatMoneyInput = (value) => {
  const raw = String(value ?? '').replace(/[^\d]/g, '')
  return raw ? Number(raw).toLocaleString('vi-VN') : ''
}

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
        <h3 style={S.confirmTitle}>Xác nhận xóa loại phòng?</h3>
        <p style={S.confirmBody}>
          Bạn có chắc chắn muốn xóa loại phòng <strong>"{item?.ten_loai}"</strong> không?
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
function LoaiPhongConfirmDialog({ mode, data, onCancel, onConfirm, submitting }) {
  const isEdit = mode === 'edit'

  return (
    <div style={S.overlay}>
      <div style={S.confirmBox}>
        <h3 style={S.confirmTitle}>
          {isEdit ? 'Xác nhận cập nhật loại phòng' : 'Xác nhận thêm loại phòng'}
        </h3>
        <p style={S.confirmBody}>
          Vui lòng kiểm tra lại thông tin trước khi {isEdit ? 'cập nhật' : 'thêm'} loại phòng.
        </p>
        <div style={{ display: 'grid', gap: '10px', marginBottom: '24px' }}>
          {isEdit && data.ma_loai && (
            <div style={S.confirmInfoRow}>
              <span style={S.confirmInfoLabel}>Mã loại</span>
              <strong style={S.confirmInfoValue}>{data.ma_loai}</strong>
            </div>
          )}
          <div style={S.confirmInfoRow}>
            <span style={S.confirmInfoLabel}>Tên loại</span>
            <strong style={S.confirmInfoValue}>{data.ten_loai}</strong>
          </div>
          <div style={S.confirmInfoRow}>
            <span style={S.confirmInfoLabel}>Giá giường</span>
            <strong style={S.confirmInfoValue}>{formatMoney(data.gia_giuong)} VND</strong>
          </div>
          <div style={S.confirmInfoRow}>
            <span style={S.confirmInfoLabel}>Giá phòng</span>
            <strong style={S.confirmInfoValue}>{formatMoney(data.gia_nguyen_phong)} VND</strong>
          </div>
          <div style={S.confirmInfoRow}>
            <span style={S.confirmInfoLabel}>Thời gian lưu trú</span>
            <strong style={S.confirmInfoValue}>{data.thoi_han_toi_thieu} - {data.thoi_han_toi_da} tháng</strong>
          </div>
        </div>
        <div style={S.confirmFooter}>
          <button style={S.btnSecondary} onClick={onCancel} disabled={submitting}>Hủy</button>
          <button style={S.btnPrimary} onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Đang lưu…' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Form Thêm / Cập nhật
const emptyForm = { ten_loai: '', gia_giuong: '', gia_nguyen_phong: '', thoi_han_toi_thieu: '', thoi_han_toi_da: '' }

function FormView({ mode, initial, onSave, onCancel, submitting, serverError }) {
  const isEdit = mode === 'edit'
  const [form, setForm] = useState({
    ...initial,
    gia_giuong: formatMoneyInput(initial.gia_giuong),
    gia_nguyen_phong: formatMoneyInput(initial.gia_nguyen_phong)
  })
  const [errors, setErrors] = useState({})
  const [confirmData, setConfirmData] = useState(null)

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.ten_loai.trim()) e.ten_loai = 'Vui lòng nhập tên loại phòng.'
    
    if (!parseMoney(form.gia_giuong)) e.gia_giuong = 'Vui lòng nhập giá giường hợp lệ.'
    if (!parseMoney(form.gia_nguyen_phong)) e.gia_nguyen_phong = 'Vui lòng nhập giá phòng hợp lệ.'
    
    const minTime = Number(form.thoi_han_toi_thieu)
    const maxTime = Number(form.thoi_han_toi_da)
    
    if (!minTime || minTime <= 0) e.thoi_han_toi_thieu = 'Thời gian tối thiểu phải > 0.'
    if (!maxTime || maxTime <= 0) e.thoi_han_toi_da = 'Thời gian tối đa phải > 0.'
    if (minTime > 0 && maxTime > 0 && minTime > maxTime) {
      e.thoi_han_toi_thieu = 'Thời hạn tối thiểu không được lớn hơn thời hạn tối đa.'
    }
    
    return e
  }

  const handleSubmit = () => {
    const e = validate()
    if (Object.keys(e).length) return setErrors(e)
    
    setConfirmData({
      ...form,
      gia_giuong: parseMoney(form.gia_giuong),
      gia_nguyen_phong: parseMoney(form.gia_nguyen_phong),
      thoi_han_toi_thieu: Number(form.thoi_han_toi_thieu),
      thoi_han_toi_da: Number(form.thoi_han_toi_da)
    })
  }

  const handleConfirmSave = async () => {
    if (!confirmData) return
    await onSave(confirmData)
    setConfirmData(null)
  }

  return (
    <section>
      <div style={{ marginBottom: '24px' }}>
        <PageTitle
          title={isEdit ? 'Cập nhật thông tin loại phòng' : 'Thêm loại phòng mới'}
          description={isEdit ? `Loại phòng: ${initial.ma_loai}` : 'Vui lòng điền đầy đủ thông tin bên dưới để tạo loại phòng mới trong hệ thống.'}
        />
      </div>

      <div style={S.formCard}>
        <div style={{ marginBottom: '20px' }}>
          <label style={S.label}>Tên loại phòng</label>
          <input
            style={{ ...S.input, ...(errors.ten_loai ? S.inputErr : {}) }}
            placeholder="Nhập tên loại phòng"
            value={form.ten_loai}
            onChange={e => set('ten_loai', e.target.value)}
          />
          {errors.ten_loai && <p style={S.errMsg}>{errors.ten_loai}</p>}
        </div>

        <div style={S.formRow}>
          <div style={S.formCol}>
            <label style={S.label}>Giá theo Giường (VND)</label>
            <input
              style={{ ...S.input, ...(errors.gia_giuong ? S.inputErr : {}) }}
              placeholder="Ví dụ: 1.500.000"
              value={form.gia_giuong}
              onChange={e => set('gia_giuong', formatMoneyInput(e.target.value))}
            />
            {errors.gia_giuong && <p style={S.errMsg}>{errors.gia_giuong}</p>}
          </div>
          <div style={S.formCol}>
            <label style={S.label}>Giá theo Phòng (VND)</label>
            <input
              style={{ ...S.input, ...(errors.gia_nguyen_phong ? S.inputErr : {}) }}
              placeholder="Ví dụ: 6.000.000"
              value={form.gia_nguyen_phong}
              onChange={e => set('gia_nguyen_phong', formatMoneyInput(e.target.value))}
            />
            {errors.gia_nguyen_phong && <p style={S.errMsg}>{errors.gia_nguyen_phong}</p>}
          </div>
        </div>

        <div style={S.formRow}>
          <div style={S.formCol}>
            <label style={S.label}>Thời gian lưu trú tối thiểu (tháng)</label>
            <input
              type="number" min="1"
              style={{ ...S.input, ...(errors.thoi_han_toi_thieu ? S.inputErr : {}) }}
              placeholder="Nhập số tháng"
              value={form.thoi_han_toi_thieu}
              onChange={e => set('thoi_han_toi_thieu', e.target.value)}
            />
            {errors.thoi_han_toi_thieu && <p style={S.errMsg}>{errors.thoi_han_toi_thieu}</p>}
          </div>
          <div style={S.formCol}>
            <label style={S.label}>Thời gian lưu trú tối đa (tháng)</label>
            <input
              type="number" min="1"
              style={{ ...S.input, ...(errors.thoi_han_toi_da ? S.inputErr : {}) }}
              placeholder="Nhập số tháng"
              value={form.thoi_han_toi_da}
              onChange={e => set('thoi_han_toi_da', e.target.value)}
            />
            {errors.thoi_han_toi_da && <p style={S.errMsg}>{errors.thoi_han_toi_da}</p>}
          </div>
        </div>

        {serverError && <p style={{ ...S.errMsg, marginTop: '12px', fontSize: '13.5px' }}>{serverError}</p>}

        <div style={{ borderTop: '1px solid #eef0eb', margin: '20px 0 0' }} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
          <button style={S.btnSecondary} onClick={onCancel} disabled={submitting}>Hủy</button>
          <button style={S.btnPrimary} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Đang lưu…' : (isEdit ? 'Cập nhật' : 'Lưu loại phòng')}
          </button>
        </div>
      </div>

      {confirmData && (
        <LoaiPhongConfirmDialog mode={mode} data={confirmData} onCancel={() => setConfirmData(null)} onConfirm={handleConfirmSave} submitting={submitting} />
      )}
    </section>
  )
}

// Trang Chính
export default function QuanLyLoaiPhongPage() {
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
      const res = await api.get('/loai-phong', { params: q ? { q } : {} })
      setList(res.data?.data || res.data || [])
    } catch {
      showToast('Không thể tải danh sách loại phòng.', 'error')
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
      await api.post('/loai-phong', form)
      showToast('Tạo loại phòng thành công.')
      setView('list'); fetchList(search)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Thông tin nhập vào không hợp lệ.')
    } finally { setSubmitting(false) }
  }

  const handleSaveEdit = async (form) => {
    setSubmitting(true); setServerError('')
    try {
      await api.put(`/loai-phong/${editTarget.ma_loai}`, form)
      showToast('Cập nhật thông tin loại phòng thành công.')
      setView('list'); fetchList(search)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Thông tin cập nhật không hợp lệ.')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    setSubmitting(true)
    try {
      await api.delete(`/loai-phong/${deleteTarget.ma_loai}`)
      showToast('Xóa loại phòng thành công.')
      setDeleteTarget(null); fetchList(search)
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể xóa loại phòng đang được sử dụng.', 'error')
      setDeleteTarget(null)
    } finally { setSubmitting(false) }
  }

  if (view === 'add') {
    return <FormView mode="add" initial={emptyForm} onSave={handleSaveAdd} onCancel={() => { setView('list'); setServerError('') }} submitting={submitting} serverError={serverError} />
  }

  if (view === 'edit') {
    return <FormView mode="edit" initial={{ ma_loai: editTarget.ma_loai, ten_loai: editTarget.ten_loai, gia_giuong: editTarget.gia_giuong, gia_nguyen_phong: editTarget.gia_nguyen_phong, thoi_han_toi_thieu: editTarget.thoi_han_toi_thieu, thoi_han_toi_da: editTarget.thoi_han_toi_da }} onSave={handleSaveEdit} onCancel={() => { setView('list'); setServerError('') }} submitting={submitting} serverError={serverError} />
  }

  return (
    <section>
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9aa090" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input style={{ ...S.input, paddingLeft: '38px', paddingTop: '10px', paddingBottom: '10px' }} placeholder="Tìm kiếm theo tên hoặc mã loại phòng..." value={search} onChange={e => handleSearch(e.target.value)} />
      </div>

      <div style={S.listHeader}>
        <div>
          <PageTitle title="QUẢN LÝ LOẠI PHÒNG" description="Quản lý loại giường trên toàn hệ thống" />
        </div>
        <button style={S.btnAdd} onClick={() => { setServerError(''); setView('add') }}>+ Thêm loại phòng</button>
      </div>

      <div style={S.tableWrap}>
        {loading ? (
          <p style={S.emptyMsg}>Đang tải…</p>
        ) : list.length === 0 ? (
          <p style={S.emptyMsg}>Không tìm thấy loại phòng phù hợp.</p>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>MÃ LOẠI</th>
                <th style={S.th}>TÊN LOẠI</th>
                <th style={S.th}>GIÁ GIƯỜNG</th>
                <th style={S.th}>GIÁ PHÒNG</th>
                <th style={S.th}>THỜI GIAN</th>
                <th style={{ ...S.th, textAlign: 'center' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.ma_loai} style={S.tr}>
                  <td style={S.td}><strong>{item.ma_loai}</strong></td>
                  <td style={S.td}>{item.ten_loai}</td>
                  <td style={S.td}>{formatMoney(item.gia_giuong)}</td>
                  <td style={S.td}>{formatMoney(item.gia_nguyen_phong)}</td>
                  <td style={S.td}>{item.thoi_han_toi_thieu} - {item.thoi_han_toi_da} (Tháng)</td>
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
  confirmBox:     { backgroundColor: '#fff', borderRadius: '12px', width: 'min(420px, calc(100vw - 32px))', maxWidth: '100%', padding: '28px 28px 24px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' },
  confirmTitle:   { margin: '0 0 12px', fontSize: '16px', fontWeight: 700, color: '#1a1f14' },
  confirmBody:    { margin: '0 0 24px', fontSize: '14px', color: '#4a4a4a', lineHeight: 1.6 },
  confirmFooter:  { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
  confirmInfoRow: { display: 'grid', gridTemplateColumns: '130px 1fr', gap: '12px', alignItems: 'start', fontSize: '14px' },
  confirmInfoLabel: { color: '#6b7560', fontWeight: 600 },
  confirmInfoValue: { color: '#1a1f14', fontWeight: 700, wordBreak: 'break-word' },
  btnSecondary:   { padding: '8px 20px', backgroundColor: '#fff', color: '#1a1f14', border: '1.5px solid #dde3d8', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  btnPrimary:     { padding: '8px 20px', backgroundColor: '#3b4f27', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  btnDanger:      { padding: '8px 20px', backgroundColor: '#c0392b', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  toast:          { position: 'fixed', top: '82px', right: '24px', maxWidth: 'calc(100vw - 48px)', overflowWrap: 'anywhere', padding: '12px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' },
  toastSuccess:   { backgroundColor: '#2e7d32', color: '#fff' },
  toastError:     { backgroundColor: '#c0392b', color: '#fff' },
}