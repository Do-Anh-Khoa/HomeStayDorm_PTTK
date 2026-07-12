import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { menuByRole } from '../../data/menuByRole.js'

export default function Sidebar({ role, onLogout, isLoggingOut = false }) {
  const menus = menuByRole[role] || []

  return (
    <aside className="flex min-h-dvh w-[78px] shrink-0 self-stretch flex-col overflow-hidden border-r border-[#d8ddc8] bg-[#fffef1] md:w-[92px] xl:w-[255px]">
      <div className="flex h-20 shrink-0 flex-col justify-center border-b border-[#d8ddc8] px-3 md:px-4 xl:px-6">
        <p className="text-center text-2xl font-extrabold leading-none tracking-[-0.02em] text-[#3f6b2a] xl:hidden">
          DS
        </p>
        <p className="hidden text-2xl font-extrabold leading-none tracking-[-0.02em] text-[#3f6b2a] xl:block">
          DormSystem
        </p>
        <p className="mt-1 hidden text-[13px] font-medium text-[#4f554a] xl:block">Management Portal</p>
      </div>

      <nav className="sidebar-scroll min-h-0 flex-1 space-y-1.5 overflow-x-hidden overflow-y-auto py-6">
        {menus.map((item) => {
          if (item.type === 'section') {
            return (
              <p
                key={item.label}
                className="hidden px-6 pb-2 pt-5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#9a9d90] xl:block"
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
                `box-border flex h-[48px] w-full items-center justify-center gap-3 border-r-4 px-3 text-[16px] font-medium transition md:px-4 xl:justify-start xl:px-6 ${
                  isActive
                    ? 'border-[#26351d] bg-[#eef6dc] text-[#24351b]'
                    : 'border-transparent text-[#53584f] hover:bg-[#f3f6e7] hover:text-[#24351b]'
                }`
              }
            >
              <Icon size={21} strokeWidth={2} />
              <span className="hidden min-w-0 leading-tight xl:block">{item.label}</span>
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
          className="box-border flex h-[48px] w-full items-center justify-center gap-3 border-r-4 border-transparent px-3 text-[16px] font-medium text-[#53584f] transition hover:bg-[#f3f6e7] hover:text-[#24351b] disabled:cursor-not-allowed disabled:opacity-60 md:px-4 xl:justify-start xl:px-6"
        >
          <LogOut size={21} strokeWidth={2} />
          <span className="hidden xl:block">{isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
        </button>
      </div>
    </aside>
  )
}
