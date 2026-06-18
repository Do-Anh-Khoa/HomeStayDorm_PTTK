import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { S } from '../../styles/tokens'
import {
  InputField,
  RightPanel,
  TopBar,
  BottomBar,
  PrimaryButton,
} from '../../components/auth/AuthComponents'

// Backend trả loai_nv viết HOA (theo CHECK constraint trong DB).
// Frontend (AppRoutes.jsx) quy ước key viết thường, tiếng Việt không dấu.
// Bảng dịch này bắt buộc phải có, không thì role không khớp -> trang trống.
const ROLE_KEY_MAP = {
  ADMIN: 'admin',
  SALE: 'sale',
  QL: 'quanly',
  KT: 'ketoan',
  PT: 'phutrach',
}

// Phải khớp 100% với defaultPathByRole trong AppRoutes.jsx
const ROLE_ROUTES = {
  admin: '/admin',
  sale: '/sale',
  quanly: '/quan-ly',
  ketoan: '/ke-toan',
  phutrach: '/phu-trach',
}

export default function LoginPage({ setRole = () => {} }) {
  const navigate = useNavigate()

  const [form, setForm] = useState({ username: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // ---- Validation ----
  const validate = () => {
    const e = {}
    if (!form.username.trim()) e.username = 'Vui lòng nhập tài khoản.'
    if (!form.password)        e.password = 'Vui lòng nhập mật khẩu.'
    return e
  }

  // ---- Submit ----
  const handleSubmit = async (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setErrors({})
    setLoading(true)

    try {
      const { data } = await api.post('/auth/login', {
        username: form.username,
        password: form.password,
      })

      // Dịch loai_nv (SALE/QL/KT/PT/ADMIN) sang key mà AppRoutes đang dùng
      const roleKey = ROLE_KEY_MAP[data.user.loai_nv] || ''

      // Lưu thông tin vào Storage của trình duyệt
      const storage = remember ? localStorage : sessionStorage
      const staleStorage = remember ? sessionStorage : localStorage

      staleStorage.removeItem('token')
      staleStorage.removeItem('role')
      staleStorage.removeItem('user')

      storage.setItem('token', data.token)
      storage.setItem('role', roleKey)
      storage.setItem('user', JSON.stringify(data.user))

      // Chuyển hướng sang đúng trang chức năng theo vai trò
      setRole(roleKey)
      navigate(ROLE_ROUTES[roleKey] || '/login', { replace: true })

    } catch (err) {
      setErrors({
        general: err.response?.data?.message || err.message || 'Có lỗi xảy ra khi kết nối hệ thống.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.page}>
      {/* LEFT */}
      <div style={S.leftPanel}>
        <TopBar />

        <div style={S.formWrap}>
          <h1 style={S.heading}>Chào mừng trở lại</h1>
          <p style={S.subheading}>Đăng nhập hệ thống Homestay Dorm</p>

          {errors.general && (
            <p style={{ ...S.errorMsg, marginBottom: '16px', fontSize: '13.5px' }}>
              ⚠️ {errors.general}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <InputField
              label="Số điện thoại / Email"
              type="text"
              placeholder="Nhập tài khoản của bạn"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              error={errors.username}
            />

            <InputField
              label="Mật khẩu"
              placeholder="Nhập mật khẩu"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              error={errors.password}
              showToggle
              show={showPw}
              onToggle={() => setShowPw(!showPw)}
            />

            <div style={S.rowBetween}>
              <label style={S.checkLabel}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  style={S.checkbox}
                />
                Ghi nhớ tài khoản
              </label>
              <button
                type="button"
                style={S.linkBtn}
                onClick={() => navigate('/forgot-password')}
              >
                Quên mật khẩu?
              </button>
            </div>

            <PrimaryButton loading={loading}>
              Đăng nhập hệ thống
            </PrimaryButton>
          </form>
        </div>

        <BottomBar />
      </div>

      {/* RIGHT */}
      <RightPanel
        title={'Hành trình mới\nBắt đầu từ đây.'}
        subtitle="Trải nghiệm không gian sống hiện đại và tinh tế tại hệ thống ký túc xá homestay hàng đầu."
      />
    </div>
  )
}
