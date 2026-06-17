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

export default function LoginPage() {
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
        if (remember) {
            localStorage.setItem('token', res.data.token)
        } else {
            sessionStorage.setItem('token', res.data.token)
        }
      // TODO: thay bằng API thật
      // const res = await axios.post('/api/auth/login', {
      //   username: form.username,
      //   password: form.password,
      // })
      // navigate('/dashboard')

      await new Promise(r => setTimeout(r, 1200)) // giả lập delay
      alert('Đăng nhập thành công! (chưa kết nối API)')
    } catch (err) {
      setErrors({ general: 'Tên đăng nhập hoặc mật khẩu không đúng.' })
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
              label="Số điện thoại / Email / Tên đăng nhập"
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