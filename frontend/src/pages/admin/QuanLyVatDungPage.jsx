import { useEffect, useRef, useState } from 'react'
import PageTitle from '../../components/common/PageTitle.jsx'
import api from '../../services/api.js'

const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
)

const emptyForm = {
  ten_vd: '',
  gia_boi_thuong: '',
}

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

function VatDungConfirmDialog({ mode, data, onCancel, onConfirm, submitting }) {
  const isEdit = mode === 'edit'

  return (
    <div style={S.overlay}>
      <div style={S.confirmBox}>
        <h3 style={S.confirmTitle}>
          {isEdit ? 'Xác nhận cập nhật vật dụng' : 'Xác nhận thêm vật dụng'}
        </h3>

        <p style={S.confirmBody}>
          Vui lòng kiểm tra lại thông tin trước khi {isEdit ? 'cập nhật' : 'thêm'} vật dụng.
        </p>

        <div style={{ display: 'grid', gap: '10px', marginBottom: '24px' }}>
          {data.ma_vd && (
            <div style={S.confirmInfoRow}>
              <span style={S.confirmInfoLabel}>Mã vật dụng</span>
              <strong style={S.confirmInfoValue}>{data.ma_vd}</strong>
            </div>
          )}

          <div style={S.confirmInfoRow}>
            <span style={S.confirmInfoLabel}>Tên vật dụng</span>
            <strong style={S.confirmInfoValue}>{data.ten_vd}</strong>
          </div>

          <div style={S.confirmInfoRow}>
            <span style={S.confirmInfoLabel}>Giá bồi thường</span>
            <strong style={S.confirmInfoValue}>
              {formatMoney(data.gia_boi_thuong)} VND
            </strong>
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

function DeleteVatDungDialog({ item, onCancel, onConfirm, submitting }) {
  return (
    <div style={S.overlay}>
      <div style={S.confirmBox}>
        <h3 style={S.confirmTitle}>Xác nhận xóa vật dụng</h3>

        <p style={S.confirmBody}>
          Vui lòng kiểm tra lại thông tin trước khi xóa vật dụng.
        </p>

        <div style={{ display: 'grid', gap: '10px', marginBottom: '18px' }}>
          <div style={S.confirmInfoRow}>
            <span style={S.confirmInfoLabel}>Mã vật dụng</span>
            <strong style={S.confirmInfoValue}>{item?.ma_vd}</strong>
          </div>

          <div style={S.confirmInfoRow}>
            <span style={S.confirmInfoLabel}>Tên vật dụng</span>
            <strong style={S.confirmInfoValue}>{item?.ten_vd}</strong>
          </div>

          <div style={S.confirmInfoRow}>
            <span style={S.confirmInfoLabel}>Giá bồi thường</span>
            <strong style={S.confirmInfoValue}>
              {formatMoney(item?.gia_boi_thuong)} VND
            </strong>
          </div>
        </div>

        <p style={{ margin: '0 0 18px', fontSize: '13px', color: '#6b7560', lineHeight: 1.5 }}>
          Hệ thống chỉ cho phép xóa nếu vật dụng chưa phát sinh dữ liệu liên kết.
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

function FormView({ mode, initial, onSave, onCancel, submitting, serverError }) {
  const isEdit = mode === 'edit'
  const [form, setForm] = useState({
    ...initial,
    gia_boi_thuong: formatMoneyInput(initial.gia_boi_thuong),
  })
  const [errors, setErrors] = useState({})
  const [confirmData, setConfirmData] = useState(null)

  const set = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const validate = () => {
    const e = {}

    if (!form.ten_vd.trim()) {
      e.ten_vd = 'Vui lòng nhập tên vật dụng.'
    }

    const priceRaw = String(form.gia_boi_thuong ?? '').replace(/[^\d]/g, '')
    const price = Number(priceRaw)

    if (!priceRaw) {
      e.gia_boi_thuong = 'Vui lòng nhập giá bồi thường.'
    } else if (!Number.isFinite(price) || price < 0) {
      e.gia_boi_thuong = 'Giá bồi thường phải là số không âm.'
    }

    return e
  }

  const handleSubmit = () => {
    const e = validate()
    if (Object.keys(e).length) return setErrors(e)

    const payload = {
      ...form,
      ten_vd: form.ten_vd.trim(),
      gia_boi_thuong: parseMoney(form.gia_boi_thuong),
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
          title={isEdit ? 'Cập nhật vật dụng' : 'Thêm vật dụng mới'}
          description={isEdit
            ? `Vật dụng: ${initial.ma_vd}`
            : 'Vui lòng nhập đầy đủ thông tin để thêm vật dụng mới.'}
        />
      </div>

      <div style={S.formCard}>
        <div style={S.formRow}>
          <div style={S.formCol}>
            <label style={S.label}>Tên vật dụng <span style={{ color: '#c0392b' }}>*</span></label>
            <input
              style={{ ...S.input, ...(errors.ten_vd ? S.inputErr : {}) }}
              placeholder="Ví dụ: Bàn ăn"
              value={form.ten_vd}
              onChange={e => set('ten_vd', e.target.value)}
            />
            {errors.ten_vd && <p style={S.errMsg}>{errors.ten_vd}</p>}
          </div>

          <div style={S.formCol}>
            <label style={S.label}>Giá bồi thường <span style={{ color: '#c0392b' }}>*</span></label>
            <input
              style={{ ...S.input, ...(errors.gia_boi_thuong ? S.inputErr : {}) }}
              type="text"
              inputMode="numeric"
              placeholder="Ví dụ: 1.000.000"
              value={form.gia_boi_thuong}
              onChange={e => set('gia_boi_thuong', formatMoneyInput(e.target.value))}
            />
            {errors.gia_boi_thuong && <p style={S.errMsg}>{errors.gia_boi_thuong}</p>}
          </div>
        </div>

        {serverError && (
          <p style={{ ...S.errMsg, marginTop: '12px', fontSize: '13.5px' }}>
            {serverError}
          </p>
        )}

        <div style={{ borderTop: '1px solid #eef0eb', margin: '20px 0 0' }} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
          <button style={S.btnSecondary} onClick={onCancel} disabled={submitting}>
            Hủy bỏ
          </button>

          <button style={S.btnPrimary} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Đang lưu…' : (isEdit ? 'Cập nhật' : 'Lưu vật dụng')}
          </button>
        </div>
      </div>

      {confirmData && (
        <VatDungConfirmDialog
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

export default function QuanLyVatDungPage() {
  const [view, setView] = useState('list')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [toast, setToast] = useState(null)
  const searchTimer = useRef(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchList = async (q = search) => {
    setLoading(true)

    try {
      const res = await api.get('/vat-dung', {
        params: q.trim() ? { q: q.trim() } : {},
      })

      setList(res.data || [])
    } catch {
      showToast('Không thể tải danh sách vật dụng.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList('')
  }, [])

  const handleSearch = (value) => {
    setSearch(value)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => fetchList(value), 350)
  }

  const handleSaveAdd = async (form) => {
    setSubmitting(true)
    setServerError('')

    try {
      await api.post('/vat-dung', form)
      showToast('Thêm vật dụng thành công.')
      setView('list')
      fetchList(search)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Lỗi khi thêm vật dụng.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveEdit = async (form) => {
    if (!editTarget) return

    setSubmitting(true)
    setServerError('')

    try {
      await api.put(`/vat-dung/${editTarget.ma_vd}`, form)
      showToast('Cập nhật vật dụng thành công.')
      setView('list')
      fetchList(search)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Lỗi khi cập nhật vật dụng.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    setSubmitting(true)

    try {
      await api.delete(`/vat-dung/${deleteTarget.ma_vd}`)
      showToast('Xóa vật dụng thành công.')
      setDeleteTarget(null)
      fetchList(search)
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          'Không thể xóa vật dụng vì vật dụng đang được liên kết với dữ liệu khác.',
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
      />
    )
  }

  if (view === 'edit') {
    return (
      <FormView
        mode="edit"
        initial={{
          ma_vd: editTarget.ma_vd,
          ten_vd: editTarget.ten_vd ?? '',
          gia_boi_thuong: editTarget.gia_boi_thuong ?? '',
        }}
        onSave={handleSaveEdit}
        onCancel={() => { setView('list'); setServerError('') }}
        submitting={submitting}
        serverError={serverError}
      />
    )
  }

  return (
    <section>
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9aa090"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{
            position: 'absolute',
            left: '13px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          style={{ ...S.input, paddingLeft: '38px' }}
          placeholder="Tìm kiếm theo mã hoặc tên vật dụng..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>

      <div style={S.listHeader}>
        <PageTitle
          title="QUẢN LÝ VẬT DỤNG"
          description="Quản lý vật dụng trên toàn hệ thống."
        />

        <button
          style={S.btnAdd}
          onClick={() => { setServerError(''); setView('add') }}
        >
          + Thêm vật dụng
        </button>
      </div>

      <div style={S.tableWrap}>
        {loading ? (
          <p style={S.emptyMsg}>Đang tải…</p>
        ) : list.length === 0 ? (
          <p style={S.emptyMsg}>Không có vật dụng nào.</p>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>MÃ VẬT DỤNG</th>
                <th style={S.th}>TÊN VẬT DỤNG</th>
                <th style={S.th}>GIÁ BỒI THƯỜNG</th>
                <th style={{ ...S.th, textAlign: 'center' }}>THAO TÁC</th>
              </tr>
            </thead>

            <tbody>
              {list.map(item => (
                <tr key={item.ma_vd} style={S.tr}>
                  <td style={S.td}><strong>{item.ma_vd}</strong></td>
                  <td style={S.td}>{item.ten_vd}</td>
                  <td style={S.td}>{formatMoney(item.gia_boi_thuong)}</td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                      <button
                        style={S.iconBtn}
                        title="Chỉnh sửa"
                        onClick={() => {
                          setEditTarget(item)
                          setServerError('')
                          setView('edit')
                        }}
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
        <DeleteVatDungDialog
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

const S = {
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
    gap: '12px',
    flexWrap: 'wrap',
  },
  btnAdd: {
    flexShrink: 0,
    padding: '10px 20px',
    backgroundColor: '#3b4f27',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
    fontFamily: 'inherit',
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
    backgroundColor: '#fff',
  },
  inputErr: {
    borderColor: '#c0392b',
  },
  tableWrap: {
    border: '1px solid #dde3d8',
    borderRadius: '10px',
    overflow: 'hidden',
    backgroundColor: '#fff',
    maxHeight: '60vh',
    overflowY: 'auto',
  },
  table: {
    width: '100%',
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
  tr: {
    borderBottom: '1px solid #eef0eb',
  },
  td: {
    padding: '14px 18px',
    color: '#1a1f14',
    verticalAlign: 'middle',
  },
  iconBtn: {
    width: '32px',
    height: '32px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    borderRadius: '6px',
    color: '#3b4f27',
  },
  emptyMsg: {
    textAlign: 'center',
    padding: '48px',
    color: '#9aa090',
    fontSize: '14px',
  },
  formCard: {
    backgroundColor: '#fff',
    border: '1px solid #dde3d8',
    borderRadius: '12px',
    padding: '28px 32px',
  },
  formRow: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  formCol: {
    flex: '1 1 220px',
  },
  label: {
    display: 'block',
    fontSize: '13.5px',
    fontWeight: 600,
    color: '#1a1f14',
    marginBottom: '7px',
  },
  errMsg: {
    margin: '4px 0 0',
    fontSize: '12px',
    color: '#c0392b',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  confirmBox: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: '400px',
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
    margin: '0 0 24px',
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
    gridTemplateColumns: '110px 1fr',
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
  btnDanger: {
    padding: '8px 20px',
    backgroundColor: '#c0392b',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  toast: {
    position: 'fixed',
    top: '90px',
    right: '510px',
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