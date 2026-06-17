import { NavLink } from 'react-router-dom'
import { menuByRole, roleLabels } from '../../data/menuByRole.js'

export default function Sidebar({ role }) {
  const menus = menuByRole[role] || []

  return (
    <aside className="w-72 bg-slate-900 text-white min-h-screen">
      <div className="p-6 border-b border-slate-700">
        <p className="text-xl font-bold">Homestay Dorm</p>
        <p className="text-sm text-slate-300 mt-1">{roleLabels[role]}</p>
      </div>

      <nav className="p-4 space-y-1">
        {menus.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
