import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { S } from '../../styles/tokens'
import {
  InputField,
  RightPanel,
  TopBar,
  BottomBar,
  PrimaryButton,
} from '../../components/auth/AuthComponents'

const demoAccounts = {
  sale01: { password: 'demo123', role: 'sale', path: '/sale' },
  quanly01: { password: 'demo123', role: 'quanly', path: '/quan-ly' },
  ketoan01: { password: 'demo123', role: 'ketoan', path: '/ke-toan' },
  phutrach01: { password: 'demo123', role: 'phutrach', path: '/phu-trach' },
  admin01: { password: 'demo123', role: 'admin', path: '/admin' },
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
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      if (remember) localStorage.setItem('token', data.token)
      else sessionStorage.setItem('token', data.token)

      navigate('/dashboard')
      const username = form.username.trim().toLowerCase()
      const account = demoAccounts[username]

      await new Promise(r => setTimeout(r, 350))

      if (!account || account.password !== form.password) {
        setErrors({ general: 'Tên đăng nhập hoặc mật khẩu không đúng.' })
        return
      }

      const storage = remember ? localStorage : sessionStorage
      const staleStorage = remember ? sessionStorage : localStorage
      const user = { username, role: account.role }

      staleStorage.removeItem('token')
      staleStorage.removeItem('role')
      staleStorage.removeItem('user')
      storage.setItem('token', `demo-token-${account.role}`)
      storage.setItem('role', account.role)
      storage.setItem('user', JSON.stringify(user))

      setRole(account.role)
      navigate(account.path, { replace: true })

      // TODO: thay demoAccounts bằng API thật khi backend auth sẵn sàng.
    } catch (err) {
      setErrors({ general: err.message || 'Tên đăng nhập hoặc mật khẩu không đúng.' })
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
