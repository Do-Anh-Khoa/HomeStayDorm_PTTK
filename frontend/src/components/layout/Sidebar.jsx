import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { menuByRole } from '../../data/menuByRole.js'

export default function Sidebar({ role, onLogout, isLoggingOut = false }) {
  const menus = menuByRole[role] || []

  return (
    <aside className="sticky top-0 flex h-dvh w-[255px] shrink-0 flex-col overflow-hidden border-r border-[#d8ddc8] bg-[#fffef1]">
      <div className="flex h-20 shrink-0 flex-col justify-center border-b border-[#d8ddc8] px-6">
        <p className="text-2xl font-extrabold leading-none tracking-[-0.02em] text-[#3f6b2a]">
          DormSystem
        </p>
        <p className="mt-1 text-[13px] font-medium text-[#4f554a]">Management Portal</p>
      </div>

      <nav className="sidebar-scroll min-h-0 flex-1 space-y-1.5 overflow-x-hidden overflow-y-auto py-6">
        {menus.map((item) => {
          if (item.type === 'section') {
            return (
              <p
                key={item.label}
                className="px-6 pb-2 pt-5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#9a9d90]"
              >
                {item.label}
              </p>
            )
          }

          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end
              className={({ isActive }) =>
                `box-border flex h-[48px] w-full items-center gap-3 border-r-4 px-6 text-[16px] font-medium transition ${
                  isActive
                    ? 'border-[#26351d] bg-[#eef6dc] text-[#24351b]'
                    : 'border-transparent text-[#53584f] hover:bg-[#f3f6e7] hover:text-[#24351b]'
                }`
              }
            >
              <Icon size={21} strokeWidth={2} />
              <span className="min-w-0 leading-tight">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="shrink-0 border-t border-[#d8ddc8] py-4">
        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          aria-label="Đăng xuất khỏi hệ thống"
          aria-busy={isLoggingOut}
          className="box-border flex h-[48px] w-full items-center gap-3 border-r-4 border-transparent px-6 text-[16px] font-medium text-[#53584f] transition hover:bg-[#f3f6e7] hover:text-[#24351b] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut size={21} strokeWidth={2} />
          {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
        </button>
      </div>
    </aside>
  )
}
