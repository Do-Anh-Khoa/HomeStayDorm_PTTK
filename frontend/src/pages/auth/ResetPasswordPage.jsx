import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import { S, C } from '../../styles/tokens'
import {
  InputField,
  PasswordStrength,
  RightPanel,
  TopBar,
  BottomBar,
  PrimaryButton,
  BackButton,
  ShieldCheckIcon,
  CheckCircleIcon,
} from '../../components/auth/AuthComponents'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [form, setForm]         = useState({ password: '', confirm: '' })
  const [showPw, setShowPw]     = useState(false)
  const [showCf, setShowCf]     = useState(false)
  const [errors, setErrors]     = useState({})
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)

  // null = đang kiểm tra | true = hợp lệ | false = hết hạn / không hợp lệ
  const [tokenValid, setTokenValid] = useState(null)
  const [tokenMsg, setTokenMsg]     = useState('')

  //  Kiểm tra token ngay khi vào trang 
  useEffect(() => {
    if (!token) {
      setTokenValid(false)
      setTokenMsg('Link không hợp lệ.')
      return
    }

    api.get(`/auth/verify-reset-token?token=${token}`)
      .then(() => setTokenValid(true))
      .catch((err) => {
        setTokenValid(false)
        setTokenMsg(
          err.response?.data?.message || 'Link đã hết hạn hoặc không hợp lệ.'
        )
      })
  }, [token])

  //  Validation 
  const validate = () => {
    const e = {}
    if (!form.password)
      e.password = 'Vui lòng nhập mật khẩu mới.'
    else if (form.password.length < 7)
      e.password = 'Mật khẩu phải có ít nhất 7 ký tự.'
    if (!form.confirm)
      e.confirm = 'Vui lòng xác nhận mật khẩu.'
    else if (form.confirm !== form.password)
      e.confirm = 'Mật khẩu xác nhận không khớp.'
    return e
  }

  //  Submit 
  const handleSubmit = async (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setErrors({})
    setLoading(true)

    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: form.password,
      })
      setDone(true)
    } catch (err) {
      setErrors({
        general: err.response?.data?.message || 'Link đã hết hạn hoặc không hợp lệ.',
      })
    } finally {
      setLoading(false)
    }
  }

  //  Đang kiểm tra token 
  if (tokenValid === null) {
    return (
      <div style={S.page}>
        <div style={S.leftPanel}>
          <TopBar />
          <div style={S.formWrap}>
            <p style={S.subheading}>Đang kiểm tra link...</p>
          </div>
          <BottomBar />
        </div>
        <RightPanel
          title={'Hành trình mới\nBắt đầu từ đây.'}
          subtitle="Trải nghiệm không gian sống hiện đại và tinh tế tại hệ thống ký túc xá homestay hàng đầu."
        />
      </div>
    )
  }

  //  Token hết hạn hoặc không hợp lệ 
  if (tokenValid === false) {
    return (
      <div style={S.page}>
        <div style={S.leftPanel}>
          <TopBar />
          <div style={S.formWrap}>
            <h1 style={{ ...S.heading, color: C.errorRed }}>Link không hợp lệ</h1>
            <p style={{ ...S.subheading, marginBottom: '32px' }}>
              {tokenMsg}
            </p>
            <PrimaryButton type="button" onClick={() => navigate('/forgot-password')}>
              Yêu cầu link mới
            </PrimaryButton>
            <BackButton onClick={() => navigate('/login')}>
              Quay lại Đăng nhập
            </BackButton>
          </div>
          <BottomBar />
        </div>
        <RightPanel
          title={'Hành trình mới\nBắt đầu từ đây.'}
          subtitle="Trải nghiệm không gian sống hiện đại và tinh tế tại hệ thống ký túc xá homestay hàng đầu."
        />
      </div>
    )
  }

  // Token hợp lệ → hiện form 
  return (
    <div style={S.page}>
      {/* LEFT */}
      <div style={S.leftPanel}>
        <TopBar />

        <div style={S.formWrap}>

          {!done ? (
            <>
              <div style={{ marginBottom: '20px' }}>
                <ShieldCheckIcon />
              </div>
              <h1 style={S.heading}>Đặt mật khẩu mới</h1>
              <p style={S.subheading}>
                Nhập mật khẩu mới cho tài khoản của bạn. Mật khẩu phải có ít nhất 8 ký tự.
              </p>

              {errors.general && (
                <p style={{ ...S.errorMsg, marginBottom: '16px', fontSize: '13.5px' }}>
                  ⚠️ {errors.general}
                </p>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <InputField
                  label="Mật khẩu mới"
                  placeholder="Tối thiểu 8 ký tự"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  error={errors.password}
                  showToggle
                  show={showPw}
                  onToggle={() => setShowPw(!showPw)}
                />
                <PasswordStrength password={form.password} />

                <InputField
                  label="Xác nhận mật khẩu"
                  placeholder="Nhập lại mật khẩu"
                  value={form.confirm}
                  onChange={e => setForm({ ...form, confirm: e.target.value })}
                  error={errors.confirm}
                  showToggle
                  show={showCf}
                  onToggle={() => setShowCf(!showCf)}
                />

                <div style={{ marginTop: '8px' }}>
                  <PrimaryButton loading={loading}>
                    Xác nhận đổi mật khẩu
                  </PrimaryButton>
                </div>
              </form>
            </>
          ) : (
            <>
              <div style={{ marginBottom: '24px' }}>
                <CheckCircleIcon />
              </div>
              <h1 style={S.heading}>Đổi mật khẩu thành công!</h1>
              <p style={S.subheading}>
                Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập ngay bây giờ.
              </p>
              <div style={S.successBox}>
                Để bảo mật tài khoản, hãy đảm bảo không chia sẻ mật khẩu với bất kỳ ai.
              </div>
              <PrimaryButton type="button" onClick={() => navigate('/login')}>
                Về trang Đăng nhập
              </PrimaryButton>
            </>
          )}

          {!done && (
            <BackButton onClick={() => navigate('/login')}>
              Quay lại Đăng nhập
            </BackButton>
          )}
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