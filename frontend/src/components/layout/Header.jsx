import { roleLabels } from '../../data/menuByRole.js'

const userInitials = {
  sale: 'SA',
  quanly: 'QL',
  ketoan: 'KT',
  phutrach: 'PT',
  admin: 'AD',
}

export default function Header({ role }) {
  return (
    <header className="flex h-[68px] items-center justify-end border-b border-[#cfd3c1] bg-[#fffefb] px-6 shadow-[0_1px_0_rgba(38,53,29,0.08)]">
      <div className="flex items-center gap-4">
        <p className="text-sm font-bold text-[#1e2618]">
          {roleLabels[role] || 'Người dùng'} - Quản lý hệ thống
        </p>
        <div className="grid h-[40px] w-[40px] place-items-center rounded-full border border-[#c7cfb7] bg-[#e7efd7] text-sm font-extrabold text-[#26351d]">
          {userInitials[role] || 'HD'}
        </div>
      </div>
    </header>
  )
}
