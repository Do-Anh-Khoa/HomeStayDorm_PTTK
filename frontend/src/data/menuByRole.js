import {
  LayoutDashboard,
  FileText,
  Search,
  CalendarDays,
  Receipt,
  Users,
  Building2,
  BedDouble,
  ClipboardList,
  Wrench,
  KeyRound,
  Settings,
  Boxes,
} from 'lucide-react'

export const menuByRole = {
  sale: [
    { label: 'Dashboard', path: '/sale', icon: LayoutDashboard },
    { label: 'Lập hồ sơ đăng ký', path: '/sale/ho-so-dang-ky', icon: FileText },
    { label: 'Tra cứu phòng/giường', path: '/sale/tra-cuu-phong-giuong', icon: Search },
    { label: 'Lịch xem phòng', path: '/sale/lich-xem-phong', icon: CalendarDays },
    { label: 'Phiếu đặt cọc', path: '/sale/phieu-dat-coc', icon: Receipt },
  ],
  quanly: [
    { label: 'Dashboard', path: '/quan-ly', icon: LayoutDashboard },
    { label: 'Biên bản bàn giao', path: '/quan-ly/ban-giao', icon: ClipboardList },
    { label: 'Hồ sơ trả phòng', path: '/quan-ly/tra-phong', icon: FileText },
    { label: 'Vật dụng hư hại', path: '/quan-ly/vat-dung-hu-hai', icon: Wrench },
    { label: 'Bồi thường thẻ/chìa khóa', path: '/quan-ly/boi-thuong', icon: KeyRound },
  ],
  ketoan: [
    { label: 'Dashboard', path: '/ke-toan', icon: LayoutDashboard },
    { label: 'Phiếu thu', path: '/ke-toan/phieu-thu', icon: Receipt },
    { label: 'Dịch vụ hàng tháng', path: '/ke-toan/dich-vu-hang-thang', icon: FileText },
    { label: 'Xác nhận thanh toán', path: '/ke-toan/xac-nhan-thanh-toan', icon: ClipboardList },
  ],
  phutrach: [
    { label: 'Dashboard', path: '/phu-trach', icon: LayoutDashboard },
    { label: 'Hợp đồng thuê', path: '/phu-trach/hop-dong', icon: FileText },
  ],
  admin: [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Quản lý người dùng', path: '/admin/nguoi-dung', icon: Users },
    { label: 'Quản lý chi nhánh', path: '/admin/chi-nhanh', icon: Building2 },
    { label: 'Quản lý phòng/giường', path: '/admin/phong-giuong', icon: BedDouble },
    { label: 'Quản lý dịch vụ', path: '/admin/dich-vu', icon: Boxes },
    { label: 'Quản lý quy định', path: '/admin/quy-dinh', icon: Settings },
    { label: 'Quản lý vật dụng', path: '/admin/vat-dung', icon: Wrench },
  ],
}

export const roleLabels = {
  sale: 'Nhân viên Sale',
  quanly: 'Nhân viên Quản lý',
  ketoan: 'Nhân viên Kế toán',
  phutrach: 'Nhân viên Phụ trách',
  admin: 'Quản trị',
}
