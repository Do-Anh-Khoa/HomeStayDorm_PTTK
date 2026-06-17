import { LogOut } from 'lucide-react'
import { roleLabels } from '../../data/menuByRole.js'

export default function Header({ role, onLogout }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
      <div>
        <h1 className="font-semibold text-slate-900">Homestay Dorm</h1>
        <p className="text-sm text-slate-500">Hệ thống quản lý ký túc xá tư nhân</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">Người dùng demo</p>
          <p className="text-xs text-slate-500">{roleLabels[role]}</p>
        </div>
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
        >
          <LogOut size={16} />
          Đăng xuất
        </button>
      </div>
    </header>
  )
}
