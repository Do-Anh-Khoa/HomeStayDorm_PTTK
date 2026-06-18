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
  BackButton,
  MailSentIcon,
}from '../../components/auth/AuthComponents'
export default function ForgotPasswordPage() {
  const navigate = useNavigate()

  const [email, setEmail]   = useState('')
  const [error, setError]   = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)

  // ---- Submit ----
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim())              { setError('Vui lòng nhập email.'); return }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Email không đúng định dạng.'); return }
    setError('')
    setLoading(true)

    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể kết nối server. Vui lòng thử lại.')
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

          {/* --- Chưa gửi --- */}
          {!sent ? (
            <>
              <h1 style={S.heading}>Quên mật khẩu?</h1>
              <p style={S.subheading}>
                Đừng lo lắng! Nhập email của bạn vào bên dưới, chúng tôi sẽ
                gửi liên kết để đặt lại mật khẩu mới.
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <InputField
                  label="Email đã đăng ký"
                  type="email"
                  placeholder="example@homestay.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  error={error}
                />

                <div style={{ marginTop: '8px' }}>
                  <PrimaryButton loading={loading}>
                    Gửi yêu cầu khôi phục
                  </PrimaryButton>
                </div>
              </form>
            </>
          ) : (
            /* --- Đã gửi thành công --- */
            <>
              <div style={{ marginBottom: '24px' }}>
                <MailSentIcon />
              </div>
              <h1 style={S.heading}>Kiểm tra email</h1>
              <p style={S.subheading}>
                Chúng tôi đã gửi link khôi phục đến <strong>{email}</strong>
              </p>
              <div style={S.successBox}>
                Link reset mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư đến
                (hoặc thư mục <strong>Spam</strong>) và nhấp vào link trong vòng{' '}
                <strong>30 phút</strong>.
              </div>
              <PrimaryButton
                type="button"
                onClick={() => { setEmail(''); setSent(false) }}
              >
                Gửi lại email
              </PrimaryButton>
            </>
          )}

          <BackButton onClick={() => navigate('/login')}>
            Quay lại Đăng nhập
          </BackButton>
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
