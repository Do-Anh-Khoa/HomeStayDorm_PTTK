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
    <div className="flex min-h-screen bg-[#f4f4f4] text-[#182016]">
      <Sidebar
        role={role}
        onLogout={() => setIsLogoutDialogOpen(true)}
        isLoggingOut={isLoggingOut}
      />
      <div className="min-w-0 flex-1">
        <Header role={role} />
        <main className="w-full px-[25px] pb-16 pt-[90px]">
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
