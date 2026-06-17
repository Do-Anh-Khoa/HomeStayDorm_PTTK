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
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={role} />
      <div className="flex-1">
        <Header role={role} onLogout={handleLogout} />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
