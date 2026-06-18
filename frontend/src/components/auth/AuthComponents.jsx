import { useState } from 'react'
import { C, S } from '../../styles/tokens'

// ICONS
export function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" strokeWidth={1.8}>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" strokeWidth={1.8}>
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

export function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" strokeWidth={2}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  )
}

export function MailSentIcon() {
  return (
    <svg width="48" height="48" fill="none" viewBox="0 0 24 24"
      stroke={C.forest} strokeWidth={1.4}>
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  )
}

export function ShieldCheckIcon() {
  return (
    <svg width="48" height="48" fill="none" viewBox="0 0 24 24"
      stroke={C.forest} strokeWidth={1.4}>
      <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6l-8-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

export function CheckCircleIcon() {
  return (
    <svg width="56" height="56" fill="none" viewBox="0 0 24 24"
      stroke={C.forest} strokeWidth={1.3}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l3 3 5-5" />
    </svg>
  )
}

// INPUT FIELD
export function InputField({
  label, type = 'text', placeholder,
  value, onChange, error,
  showToggle, show, onToggle,
  hint,
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ marginBottom: error ? '4px' : '0' }}>
      <label style={S.label}>{label}</label>
      <div style={S.inputWrap}>
        <input
          type={showToggle ? (show ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            ...S.input,
            ...(focused && !error ? S.inputFocused : {}),
            ...(error ? S.inputError : {}),
            paddingRight: showToggle ? '44px' : '16px',
          }}
          autoComplete={type === 'password' ? 'current-password' : 'off'}
        />
        {showToggle && (
          <button
            style={S.eyeBtn}
            onClick={onToggle}
            type="button"
            tabIndex={-1}
          >
            <EyeIcon open={show} />
          </button>
        )}
      </div>
      {error && <p style={S.errorMsg}>{error}</p>}
      {hint && !error && (
        <p style={{ fontSize: '12px', color: C.textMuted, marginTop: '5px', marginBottom: '4px' }}>
          {hint}
        </p>
      )}
    </div>
  )
}

// PASSWORD STRENGTH INDICATOR
export function PasswordStrength({ password }) {
  const getStrength = (pw) => {
    if (!pw) return 0
    let score = 0
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    return score
  }

  const strength = getStrength(password)
  const labels = ['', 'Yếu', 'Trung bình', 'Khá mạnh', 'Mạnh']
  const colors = ['', '#e74c3c', '#e67e22', '#f1c40f', C.forest]

  if (!password) return null

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={S.strengthBar}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '4px',
              backgroundColor: i <= strength ? colors[strength] : C.border,
              transition: 'background-color 0.3s',
            }}
          />
        ))}
      </div>
      <p style={{ ...S.strengthLabel, color: colors[strength] }}>
        Độ mạnh: {labels[strength]}
      </p>
    </div>
  )
}

// RIGHT PANEL (ảnh + hero card)
export function RightPanel({ badge = 'PREMIUM SERVICE', title, subtitle }) {
  return (
    <div style={S.rightPanel}>
      <div style={S.rightOverlay} />
      <div style={S.heroCard}>
        <div style={S.heroBadge}>
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={2}>
            <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          {badge}
        </div>
        <p style={S.heroTitle}>{title}</p>
        <p style={S.heroSubtitle}>{subtitle}</p>
      </div>
    </div>
  )
}

// TOP BAR
export function TopBar() {
  return (
    <div style={S.topBar}>
      <span style={S.brand}>Homestay Dorm System</span>
    </div>
  )
}

// BOTTOM BAR
export function BottomBar() {
  return (
    <div style={S.bottomBar}>
      <span style={S.bottomBrand}>Homestay Dorm System</span>
      <span style={S.copyright}>© 2026 Homestay Dorm System. All rights reserved.</span>
    </div>
  )
}

// PRIMARY BUTTON
export function PrimaryButton({ children, onClick, loading, type = 'submit', disabled }) {
  const [hover, setHover] = useState(false)
  const isDisabled = loading || disabled

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...S.btnPrimary,
        ...(hover && !isDisabled ? S.btnPrimaryHover : {}),
        ...(isDisabled ? S.btnDisabled : {}),
      }}
    >
      {loading ? 'Đang xử lý...' : children}
    </button>
  )
}

// BACK BUTTON
export function BackButton({ children, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...S.backLink,
        color: hover ? '#3b4f27' : '#6b7560',
      }}
    >
      <ArrowLeftIcon />
      {children}
    </button>
  )
}