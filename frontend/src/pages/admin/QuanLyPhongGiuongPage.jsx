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
const IconFilter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
)
function RoomConfirmDialog({
  mode,
  data,
  loaiPhongOptions,
  chiNhanhOptions,
  onCancel,
  onConfirm,
  submitting,
}) {
  const isEdit = mode === 'edit'

  const loaiPhongLabel =
    loaiPhongOptions.find(lp => lp.value === data.loai_phong)?.label || data.loai_phong

  const chiNhanhLabel =
    chiNhanhOptions.find(cn => cn.value === data.chi_nhanh)?.label || data.chi_nhanh

  return (
    <div style={S.overlay}>
      <div style={S.confirmBox}>
        <h3 style={S.confirmTitle}>
          {isEdit ? 'Xác nhận cập nhật phòng' : 'Xác nhận tạo phòng'}
        </h3>

        <p style={S.confirmBody}>
          Vui lòng kiểm tra lại thông tin trước khi {isEdit ? 'cập nhật' : 'tạo'} phòng.
        </p>

        <div style={{ display: 'grid', gap: '10px', marginBottom: '24px' }}>
          <div style={S.confirmInfoRow}>
            <span style={S.confirmInfoLabel}>Mã phòng</span>
            <strong style={S.confirmInfoValue}>{data.ma_phong}</strong>
          </div>

          <div style={S.confirmInfoRow}>
            <span style={S.confirmInfoLabel}>Sức chứa</span>
            <strong style={S.confirmInfoValue}>{data.suc_chua} người</strong>
          </div>

          <div style={S.confirmInfoRow}>
            <span style={S.confirmInfoLabel}>Loại phòng</span>
            <strong style={S.confirmInfoValue}>{loaiPhongLabel}</strong>
          </div>

          <div style={S.confirmInfoRow}>
            <span style={S.confirmInfoLabel}>Chi nhánh</span>
            <strong style={S.confirmInfoValue}>{chiNhanhLabel}</strong>
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
// ── Delete Confirm Dialog ────────────────────────────────────
function DeleteDialog({ item, onCancel, onConfirm, submitting }) {
  return (
    <div style={S.overlay}>
      <div style={S.confirmBox}>
        <h3 style={S.confirmTitle}>Xác nhận xóa phòng</h3>

        <p style={S.confirmBody}>
          Vui lòng kiểm tra lại thông tin trước khi xóa phòng.
        </p>

        <div style={{ display: 'grid', gap: '10px', marginBottom: '18px' }}>
          <div style={S.confirmInfoRow}>
            <span style={S.confirmInfoLabel}>Mã phòng</span>
            <strong style={S.confirmInfoValue}>{item?.ma_phong}</strong>
          </div>

          <div style={S.confirmInfoRow}>
            <span style={S.confirmInfoLabel}>Sức chứa</span>
            <strong style={S.confirmInfoValue}>{item?.suc_chua} người</strong>
          </div>

          <div style={S.confirmInfoRow}>
            <span style={S.confirmInfoLabel}>Loại phòng</span>
            <strong style={S.confirmInfoValue}>
              {item?.ten_loai_phong || item?.loai_phong || '—'}
            </strong>
          </div>

          <div style={S.confirmInfoRow}>
            <span style={S.confirmInfoLabel}>Chi nhánh</span>
            <strong style={S.confirmInfoValue}>
              {item?.ten_chi_nhanh || item?.chi_nhanh || '—'}
            </strong>
          </div>
        </div>

        <p style={{ margin: '0 0 18px', fontSize: '13px', color: '#6b7560', lineHeight: 1.5 }}>
          Hệ thống chỉ cho phép xóa nếu phòng và giường chưa phát sinh dữ liệu liên kết.
        </p>

        <div style={S.confirmFooter}>
          <button style={S.btnSecondary} onClick={onCancel} disabled={submitting}>
            Hủy
          </button>

          <button style={S.btnDanger} onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Đang xóa…' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Filter Panel ─────────────────────────────────────────────
function FilterPanel({ filters, onChange, onReset, loaiPhongOptions }) {
  return (
    <div style={S.filterPanel}>
      <div style={S.filterRow}>
        <div style={S.filterCol}>
          <label style={S.label}>Loại phòng</label>
          <select
            style={S.select}
            value={filters.loai_phong}
            onChange={e => onChange('loai_phong', e.target.value)}
          >
            <option value="">Tất cả</option>
            {loaiPhongOptions.map(lp => (
              <option key={lp.value} value={lp.value}>{lp.label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button style={S.btnSecondary} onClick={onReset}>Đặt lại</button>
        </div>
      </div>
    </div>
  )
}

// ── Bed Tags ─────────────────────────────────────────────────
function BedTags({ beds }) {
  if (!beds || beds.length === 0) return <span style={{ color: '#9aa090' }}>—</span>

  const pairs = []
  for (let i = 0; i < beds.length; i += 2) {
    pairs.push(beds.slice(i, i + 2))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {pairs.map((pair, idx) => (
        <div key={idx} style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {pair.map(bed => (
            <span key={bed.ma_giuong} style={{ fontWeight: 700, color: '#1a1f14' }}>
              {bed.ma_giuong}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Form View (Add / Edit) ───────────────────────────────────
const emptyForm = { ma_phong: '', suc_chua: '', loai_phong: '', chi_nhanh: '' }

function FormView({ mode, initial, onSave, onCancel, submitting, serverError, loaiPhongOptions, chiNhanhOptions }) {
  const isEdit = mode === 'edit'
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const [confirmData, setConfirmData] = useState(null)
  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: '' }))
  }

  const validate = () => {
  const e = {}

  if (!isEdit && !form.ma_phong.trim()) {
    e.ma_phong = 'Vui lòng nhập mã phòng.'
  }

  const capacity = Number(form.suc_chua)

    if (!Number.isInteger(capacity) || capacity <= 0 || capacity > 12) {
      e.suc_chua = 'Sức chứa phải là số nguyên từ 1 đến 12.'
    }

    if (!form.loai_phong) e.loai_phong = 'Vui lòng chọn loại phòng.'
    if (!form.chi_nhanh) e.chi_nhanh = 'Vui lòng chọn chi nhánh.'

    return e
  }

  const handleSubmit = () => {
    const e = validate()
    if (Object.keys(e).length) return setErrors(e)

    const payload = {
      ...form,
      ma_phong: form.ma_phong.trim().toUpperCase(),
      suc_chua: Number(form.suc_chua),
    }

    setConfirmData(payload)
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
          title={isEdit ? 'Cập nhật phòng' : 'Thêm phòng mới'}
          description={isEdit
            ? `Phòng: ${initial.ma_phong}`
            : 'Vui lòng nhập đầy đủ thông tin để khởi tạo phòng mới trong hệ thống ký túc xá.'}
        />
      </div>

      <div style={S.formCard}>
        {/* Mã phòng + Sức chứa */}
        <div style={S.formRow}>
          {!isEdit && (
            <div style={S.formCol}>
              <label style={S.label}>Mã phòng <span style={{ color: '#c0392b' }}>*</span></label>
              <input
                style={{
                  ...S.input,
                  ...(errors.ma_phong ? S.inputErr : {}),
                }}
                placeholder="Ví dụ: P001"
                value={form.ma_phong}
                onChange={e => set('ma_phong', e.target.value)}
              />
              {errors.ma_phong && <p style={S.errMsg}>{errors.ma_phong}</p>}
            </div>
          )}
          <div style={S.formCol}>
            <label style={S.label}>Sức chứa (người) <span style={{ color: '#c0392b' }}>*</span></label>
            <input
              style={{ ...S.input, ...(errors.suc_chua ? S.inputErr : {}) }}
                type="number"
                min="1"
                max="12"
                step="1"
                placeholder="Ví dụ: 4"
                value={form.suc_chua}
                onChange={e => set('suc_chua', e.target.value)}
            />
            {errors.suc_chua && <p style={S.errMsg}>{errors.suc_chua}</p>}
          </div>
        </div>

        {/* Loại phòng + Chi nhánh */}
        <div style={S.formRow}>
          <div style={S.formCol}>
            <label style={S.label}>Loại phòng <span style={{ color: '#c0392b' }}>*</span></label>
            <select
              style={{ ...S.select, ...(errors.loai_phong ? S.inputErr : {}) }}
              value={form.loai_phong}
              onChange={e => set('loai_phong', e.target.value)}
            >
              <option value="">-- Chọn loại phòng --</option>
              {loaiPhongOptions.map(lp => (
                <option key={lp.value} value={lp.value}>{lp.label}</option>
              ))}
            </select>
            {errors.loai_phong && <p style={S.errMsg}>{errors.loai_phong}</p>}
          </div>
          <div style={S.formCol}>
            <label style={S.label}>Chi nhánh <span style={{ color: '#c0392b' }}>*</span></label>
            <select
              style={{ ...S.select, ...(errors.chi_nhanh ? S.inputErr : {}) }}
              value={form.chi_nhanh}
              onChange={e => set('chi_nhanh', e.target.value)}
            >
              <option value="">-- Chọn chi nhánh --</option>
              {chiNhanhOptions.map(cn => (
                <option key={cn.value} value={cn.value}>{cn.label}</option>
              ))}
            </select>
            {errors.chi_nhanh && <p style={S.errMsg}>{errors.chi_nhanh}</p>}
          </div>
        </div>

        {serverError && <p style={{ ...S.errMsg, marginTop: '12px', fontSize: '13.5px' }}>{serverError}</p>}

        <div style={{ borderTop: '1px solid #eef0eb', margin: '20px 0 0' }} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
          <button style={S.btnSecondary} onClick={onCancel} disabled={submitting}>Hủy bỏ</button>
          <button style={S.btnPrimary} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Đang lưu…' : (isEdit ? 'Cập nhật' : 'Lưu phòng')}
          </button>
        </div>
      </div>

      {confirmData && (
        <RoomConfirmDialog
          mode={mode}
          data={confirmData}
          loaiPhongOptions={loaiPhongOptions}
          chiNhanhOptions={chiNhanhOptions}
          onCancel={() => setConfirmData(null)}
          onConfirm={handleConfirmSave}
          submitting={submitting}
        />
      )}
    </section>
  )
}

// ── Main Page ────────────────────────────────────────────────
export default function QuanLyPhongGiuongPage() {
  const [view, setView]                 = useState('list')
  const [list, setList]                 = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [showFilter, setShowFilter]     = useState(false)
  const [filters, setFilters] = useState({ loai_phong: '' })
  const [editTarget, setEditTarget]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [submitting, setSubmitting]     = useState(false)
  const [serverError, setServerError]   = useState('')
  const [toast, setToast]               = useState(null)
  const searchTimer                     = useRef(null)

  // Danh sách loại phòng và chi nhánh
  const [loaiPhongOptions, setLoaiPhongOptions] = useState([])
  const [chiNhanhOptions, setChiNhanhOptions] = useState([])
  // const chiNhanhOptions = [
  //   { value: 'CN-001', label: 'CN-001 — Cơ sở 1' },
  //   { value: 'CN-002', label: 'CN-002 — Cơ sở 2' },
  //   { value: 'CN-003', label: 'CN-003 — Cơ sở 3' },
  //   { value: 'CN-006', label: 'CN-006 — Cơ sở 6' },
  // ]

  const buildParams = (q = '', f = filters) => {
    const params = {}

    if (q.trim()) {
      params.q = q.trim()
    }

    if (f.loai_phong) {
      params.loai_phong = f.loai_phong
    }

    return params
  }
  const fetchChiNhanhOptions = async () => {
    try {
      const res = await api.get('/phong-giuong/chi-nhanh')
      setChiNhanhOptions(res.data || [])
    } catch (err) {
      showToast('Không thể tải danh sách chi nhánh.', 'error')
    }
  }
  const fetchLoaiPhongOptions = async () => {
    try {
      const res = await api.get('/phong-giuong/loai-phong')
      setLoaiPhongOptions(res.data || [])
    } catch (err) {
      showToast('Không thể tải danh sách loại phòng.', 'error')
    }
  }
  const fetchList = async (q = '', f = filters) => {
    setLoading(true)
    try {
      const res = await api.get('/phong-giuong', { params: buildParams(q, f) })
      setList(res.data)
    } catch {
      showToast('Không thể tải danh sách phòng/giường.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLoaiPhongOptions()
    fetchChiNhanhOptions()
    fetchList()
  }, [])

  const handleSearch = (val) => {
    setSearch(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => fetchList(val, filters), 350)
  }

  const handleFilterChange = (key, val) => {
    const next = { ...filters, [key]: val }
    setFilters(next)
    fetchList(search, next)
  }

  const handleFilterReset = () => {
    const reset = { loai_phong: '' }
    setFilters(reset)
    fetchList(search, reset)
  }

  const hasActiveFilter = Boolean(filters.loai_phong)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSaveAdd = async (form) => {
    setSubmitting(true); setServerError('')
    try {
      await api.post('/phong-giuong', form)
      showToast('Thêm phòng thành công.')
      setView('list'); fetchList(search)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Lỗi khi thêm phòng.')
    } finally { setSubmitting(false) }
  }

  const handleSaveEdit = async (form) => {
    setSubmitting(true); setServerError('')
    try {
      await api.put(`/phong-giuong/${editTarget.ma_phong}`, form)
      showToast('Cập nhật phòng thành công.')
      setView('list'); fetchList(search)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Lỗi khi cập nhật.')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    setSubmitting(true)
    try {
      await api.delete(`/phong-giuong/${deleteTarget.ma_phong}`)

      showToast('Xóa phòng thành công.')
      setDeleteTarget(null)
      fetchList(search)
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Không thể xóa phòng vì phòng hoặc giường đang được liên kết với dữ liệu khác.',
        'error'
      )
      setDeleteTarget(null)
    } finally {
      setSubmitting(false)
    }
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
        loaiPhongOptions={loaiPhongOptions}
        chiNhanhOptions={chiNhanhOptions}
      />
    )
  }

  if (view === 'edit') {
    return (
      <FormView
        mode="edit"
        initial={{
          ma_phong:   editTarget.ma_phong,
          suc_chua:   editTarget.suc_chua ?? '',
          loai_phong: editTarget.loai_phong ?? '',
          chi_nhanh:  editTarget.chi_nhanh ?? '',
        }}
        onSave={handleSaveEdit}
        onCancel={() => { setView('list'); setServerError('') }}
        submitting={submitting}
        serverError={serverError}
        loaiPhongOptions={loaiPhongOptions}
        chiNhanhOptions={chiNhanhOptions}
      />
    )
  }

  return (
    <section>
      {/* Search bar — full width, top */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9aa090" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          style={{ ...S.input, paddingLeft: '38px' }}
          placeholder="Tìm kiếm theo tên hoặc mã phòng..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>

      {/* Header row */}
      <div style={S.listHeader}>
        <div>
          <PageTitle
            title="QUẢN LÝ PHÒNG/GIƯỜNG"
            description="Quản lý phòng/giường trên toàn bộ hệ thống."
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            style={{ ...S.btnFilter, ...(hasActiveFilter ? S.btnFilterActive : {}) }}
            onClick={() => setShowFilter(v => !v)}
          >
            <IconFilter />
            Lọc
            {hasActiveFilter && <span style={S.filterBadge} />}
          </button>
          <button style={S.btnAdd} onClick={() => { setServerError(''); setView('add') }}>
            + Thêm phòng
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilter && (
        <FilterPanel
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleFilterReset}
          loaiPhongOptions={loaiPhongOptions}
        />
      )}

      {/* Table */}
      <div style={S.tableWrap}>
        {loading ? (
          <p style={S.emptyMsg}>Đang tải…</p>
        ) : list.length === 0 ? (
          <p style={S.emptyMsg}>Không có phòng nào.</p>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>MÃ PHÒNG</th>
                <th style={S.th}>SỨC CHỨA</th>
                <th style={S.th}>GIƯỜNG</th>
                <th style={S.th}>LOẠI PHÒNG</th>
                <th style={S.th}>CHI NHÁNH</th>
                <th style={{ ...S.th, textAlign: 'center' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.ma_phong} style={S.tr}>
                  <td style={S.td}><strong>{item.ma_phong}</strong></td>
                  <td style={S.td}>{item.suc_chua}</td>
                  <td style={S.td}>
                    <BedTags beds={item.giuong ?? []} />
                  </td>
                  <td style={S.td}>{item.ten_loai_phong || item.loai_phong || '—'}</td>
                  <td style={S.td}>{item.ten_chi_nhanh || item.chi_nhanh || '—'}</td>
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
  listHeader:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '12px', flexWrap: 'wrap' },
  btnAdd:         { flexShrink: 0, padding: '10px 20px', backgroundColor: '#3b4f27', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' },
  btnFilter:      { display: 'inline-flex', alignItems: 'center', gap: '6px', position: 'relative', flexShrink: 0, padding: '9px 16px', backgroundColor: '#fff', color: '#1a1f14', border: '1.5px solid #dde3d8', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' },
  btnFilterActive:{ borderColor: '#3b4f27', color: '#3b4f27', backgroundColor: '#f0f4eb' },
  filterBadge:    { position: 'absolute', top: '6px', right: '6px', width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#c0392b' },
  filterPanel:    { backgroundColor: '#f8faf5', border: '1.5px solid #dde3d8', borderRadius: '10px', padding: '20px 24px', marginBottom: '12px' },
  filterRow:      { display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' },
  filterCol:      { flex: '1 1 160px' },
  input:          { width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '1.5px solid #dde3d8', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', color: '#1a1f14', outline: 'none', backgroundColor: '#fff' },
  inputErr:       { borderColor: '#c0392b' },
  inputDisabled:  { backgroundColor: '#f4f6f1', color: '#6b7560', cursor: 'not-allowed' },
  select:         { width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '1.5px solid #dde3d8', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', color: '#1a1f14', outline: 'none', backgroundColor: '#fff', cursor: 'pointer' },
  tableWrap:      { border: '1px solid #dde3d8', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#fff', maxHeight: '60vh', overflowY: 'auto' },
  table:          { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th:             { padding: '12px 18px', textAlign: 'left', backgroundColor: '#fff', color: '#6b7560', fontWeight: 700, fontSize: '12px', letterSpacing: '0.4px', borderBottom: '1px solid #dde3d8', position: 'sticky', top: 0, zIndex: 1 },
  tr:             { borderBottom: '1px solid #eef0eb' },
  td:             { padding: '14px 18px', color: '#1a1f14', verticalAlign: 'middle' },
  iconBtn:        { width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '6px', color: '#3b4f27' },
  emptyMsg:       { textAlign: 'center', padding: '48px', color: '#9aa090', fontSize: '14px' },
  // form
  formCard:       { backgroundColor: '#fff', border: '1px solid #dde3d8', borderRadius: '12px', padding: '28px 32px' },
  formRow:        { display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' },
  formCol:        { flex: '1 1 220px' },
  label:          { display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#1a1f14', marginBottom: '7px' },
  errMsg:         { margin: '4px 0 0', fontSize: '12px', color: '#c0392b' },
  // confirm dialog
  overlay:        { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  confirmBox:     { backgroundColor: '#fff', borderRadius: '12px', width: '380px', padding: '28px 28px 24px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' },
  confirmTitle:   { margin: '0 0 12px', fontSize: '16px', fontWeight: 700, color: '#1a1f14' },
  confirmBody:    { margin: '0 0 24px', fontSize: '14px', color: '#4a4a4a', lineHeight: 1.6 },
  confirmFooter:  { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
  confirmInfoRow: { display: 'grid', gridTemplateColumns: '95px 1fr', gap: '12px', alignItems: 'start', fontSize: '14px' },
  confirmInfoLabel: { color: '#6b7560', fontWeight: 600 },
  confirmInfoValue: { color: '#1a1f14', fontWeight: 700, wordBreak: 'break-word' },
  btnSecondary:   { padding: '8px 20px', backgroundColor: '#fff', color: '#1a1f14', border: '1.5px solid #dde3d8', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  btnPrimary:     { padding: '8px 20px', backgroundColor: '#3b4f27', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  btnDanger:      { padding: '8px 20px', backgroundColor: '#c0392b', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  // toast
  toast:          { position: 'fixed', top: '90px', right: '510px', padding: '12px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' },
  toastSuccess:   { backgroundColor: '#2e7d32', color: '#fff' },
  toastError:     { backgroundColor: '#c0392b', color: '#fff' },
}