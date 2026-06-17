import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'

export default function MainLayout({ role, setRole }) {
  const navigate = useNavigate()

  if (!role) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = () => {
    setRole('')
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-[#f4f4f4] text-[#182016]">
      <Sidebar role={role} onLogout={handleLogout} />
      <div className="min-w-0 flex-1">
        <Header role={role} onLogout={handleLogout} />
        <main className="w-full px-[25px] pb-16 pt-[90px]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
