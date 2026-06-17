import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { menuByRole } from '../../data/menuByRole.js'

export default function Sidebar({ role, onLogout }) {
  const menus = menuByRole[role] || []

  return (
    <aside className="sticky top-0 flex h-screen min-h-screen w-[255px] shrink-0 flex-col border-r border-[#d8d9cc] bg-[#fffef1]">
      <div className="flex h-[68px] flex-col justify-center border-b border-[#cfd3c1] px-6">
        <p className="text-2xl font-extrabold leading-none tracking-[-0.02em] text-[#3f6b2a]">
          DormSystem
        </p>
        <p className="mt-1 text-[13px] font-medium text-[#4f554a]">Management Portal</p>
      </div>

      <nav className="space-y-1.5 px-0 pt-10">
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

      <div className="flex-1" />

      <div className="px-0 pb-9">
        <div className="mx-3 mb-4 border-t border-[#d6d7c9]" />
        <button
          onClick={onLogout}
          className="box-border flex h-[48px] w-full items-center gap-3 border-r-4 border-transparent px-6 text-[16px] font-medium text-[#53584f] transition hover:bg-[#f3f6e7] hover:text-[#24351b]"
        >
          <LogOut size={21} strokeWidth={2} />
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}
