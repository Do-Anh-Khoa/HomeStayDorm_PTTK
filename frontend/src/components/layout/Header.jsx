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
    <header className="flex h-20 min-w-0 shrink-0 items-center justify-end overflow-x-hidden border-b border-[#d8ddc8] bg-[#fffefb] px-8">
      <div className="flex min-w-0 items-center justify-end gap-4">
        <p className="min-w-0 text-right text-sm font-bold leading-tight text-[#1e2618]">
          {roleLabels[role] || 'Người dùng'} - Quản lý hệ thống
        </p>
        <div className="grid h-[40px] w-[40px] shrink-0 place-items-center rounded-full border border-[#c7cfb7] bg-[#e7efd7] text-sm font-extrabold text-[#26351d]">
          {userInitials[role] || 'HD'}
        </div>
      </div>
    </header>
  )
}
