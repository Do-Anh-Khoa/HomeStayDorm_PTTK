import { useNavigate } from 'react-router-dom'
import { roleLabels } from '../../data/menuByRole.js'

export default function LoginPage({ setRole }) {
  const navigate = useNavigate()

  const handleLogin = (selectedRole) => {
    setRole(selectedRole)
    const defaultPaths = {
      sale: '/sale',
      quanly: '/quan-ly',
      ketoan: '/ke-toan',
      phutrach: '/phu-trach',
      admin: '/admin',
    }
    navigate(defaultPaths[selectedRole])
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-900">Đăng nhập demo</h1>
        <p className="text-slate-500 mt-2">
          Chọn vai trò để xem giao diện tương ứng. Sau này phần này sẽ nối API đăng nhập thật.
        </p>

        <div className="mt-6 space-y-3">
          {Object.entries(roleLabels).map(([role, label]) => (
            <button
              key={role}
              onClick={() => handleLogin(role)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left hover:bg-blue-50 hover:border-blue-300 transition"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
