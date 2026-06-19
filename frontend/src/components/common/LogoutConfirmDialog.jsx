import { useEffect, useRef } from 'react'
import { CircleAlert } from 'lucide-react'

export default function LogoutConfirmDialog({
  isOpen,
  isLoggingOut,
  onCancel,
  onConfirm,
}) {
  const cancelButtonRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isLoggingOut) {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    cancelButtonRef.current?.focus()

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isLoggingOut, onCancel])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isLoggingOut) {
          onCancel()
        }
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
        className="w-full rounded-lg border border-[#dedfd5] bg-white text-center shadow-[0_18px_50px_rgba(24,32,22,0.18)]"
        style={{
          maxWidth: '390px',
          padding: '30px 28px 26px',
        }}
      >
        <div className="flex w-full justify-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-[#fee2e2] text-[#dc2626]">
            <CircleAlert size={32} strokeWidth={2.4} />
          </div>
        </div>

        <h2
          id="logout-dialog-title"
          className="text-[21px] font-extrabold text-[#1e2618]"
          style={{ marginTop: '20px' }}
        >
          Xác nhận đăng xuất
        </h2>
        <p
          id="logout-dialog-description"
          className="mx-auto max-w-[310px] text-[15px] leading-6 text-[#686d63]"
          style={{ marginTop: '8px' }}
        >
          Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?
        </p>

        <div
          className="grid grid-cols-2 gap-3"
          style={{ marginTop: '26px' }}
        >
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={isLoggingOut}
            className="h-12 rounded-md border border-[#cfd3c1] bg-white text-[15px] font-bold text-[#53584f] transition hover:bg-[#f4f6ef] focus:outline-none focus:ring-2 focus:ring-[#9aaa89] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoggingOut}
            aria-busy={isLoggingOut}
            className="h-12 rounded-md bg-[#3f552f] text-[15px] font-bold text-white shadow-sm transition hover:bg-[#304323] focus:outline-none focus:ring-2 focus:ring-[#81946f] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
          </button>
        </div>
      </div>
    </div>
  )
}
