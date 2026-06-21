import { useState } from 'react'
import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'
import LogoutConfirmDialog from '../common/LogoutConfirmDialog.jsx'
import api from '../../services/api.js'

export default function MainLayout({ role, setRole }) {
  const navigate = useNavigate()
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  if (!role) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)

    try {
      await api.post('/auth/logout')
    } catch {
      // Phiên phía trình duyệt vẫn phải được xóa nếu server tạm thời không phản hồi.
    } finally {
      setRole('')
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="flex min-h-dvh w-full overflow-x-hidden bg-[#f4f4f4] text-[#182016]">
      <Sidebar
        role={role}
        onLogout={() => setIsLogoutDialogOpen(true)}
        isLoggingOut={isLoggingOut}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <Header role={role} />
        <main className="app-main min-w-0 flex-1 overflow-x-hidden px-8 py-6">
          <Outlet />
        </main>
      </div>

      <LogoutConfirmDialog
        isOpen={isLogoutDialogOpen}
        isLoggingOut={isLoggingOut}
        onCancel={() => setIsLogoutDialogOpen(false)}
        onConfirm={handleLogout}
      />
    </div>
  )
}
