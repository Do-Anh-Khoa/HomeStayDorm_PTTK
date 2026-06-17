import {
  LayoutDashboard,
  FileText,
  Search,
  CalendarDays,
  Receipt,
  LogIn,
  Users,
  Building2,
  BedDouble,
  ClipboardList,
  Wrench,
  KeyRound,
  Boxes,
  Building,
  Gavel,
  PackageCheck,
  ShieldCheck,
} from 'lucide-react'

export const menuByRole = {
  sale: [
    { label: 'Trang chủ', path: '/sale', icon: LayoutDashboard },
    { label: 'Hồ sơ', path: '/sale/ho-so-dang-ky', icon: FileText },
    { label: 'Lịch hẹn', path: '/sale/lich-xem-phong', icon: CalendarDays },
    { label: 'Phiếu thu', path: '/sale/phieu-dat-coc', icon: Receipt },
    { label: 'Trả phòng', path: '/sale/tra-phong', icon: LogIn },
  ],
  quanly: [
    { label: 'Trang chủ', path: '/quan-ly', icon: LayoutDashboard },
    { label: 'Tra cứu phòng/giường', path: '/quan-ly/tra-cuu-phong-giuong', icon: Search },
    { label: 'Lập biên bản bàn giao', path: '/quan-ly/ban-giao', icon: ClipboardList },
    { label: 'Ghi nhận vật dụng hư hại', path: '/quan-ly/vat-dung-hu-hai', icon: Wrench },
    { label: 'Kiểm tra phiếu thu', path: '/quan-ly/kiem-tra-phieu-thu', icon: Receipt },
    { label: 'Cập nhật phiếu thu', path: '/quan-ly/cap-nhat-phieu-thu', icon: FileText },
    { label: 'Ghi nhận bồi thường', path: '/quan-ly/boi-thuong', icon: KeyRound },
  ],
  ketoan: [
    { label: 'Trang chủ', path: '/ke-toan', icon: LayoutDashboard },
    { label: 'Lập phiếu thu', path: '/ke-toan/phieu-thu', icon: Receipt },
    { label: 'Xử lý dịch vụ', path: '/ke-toan/dich-vu-hang-thang', icon: FileText },
  ],
  phutrach: [
    { label: 'Trang chủ', path: '/phu-trach', icon: LayoutDashboard },
    { label: 'Lập Hợp đồng thuê', path: '/phu-trach/hop-dong', icon: FileText },
  ],
  admin: [
    { label: 'Trang chủ', path: '/admin', icon: LayoutDashboard },
    { label: 'Quản lý người dùng', path: '/admin/nguoi-dung', icon: Users },
    { type: 'section', label: 'Cấu hình hệ thống' },
    { label: 'Quản lý chi nhánh', path: '/admin/chi-nhanh', icon: Building2 },
    { label: 'Quản lý loại phòng', path: '/admin/loai-phong', icon: Building },
    { label: 'Quản lý phòng/giường', path: '/admin/phong-giuong', icon: BedDouble },
    { label: 'Quản lý vật dụng', path: '/admin/vat-dung', icon: PackageCheck },
    { label: 'Quản lý dịch vụ', path: '/admin/dich-vu', icon: Boxes },
    { type: 'section', label: 'Quy định hệ thống' },
    { label: 'Quản lý quy định hoàn cọc', path: '/admin/quy-dinh-hoan-coc', icon: ShieldCheck },
    { label: 'Quản lý quy định KTX', path: '/admin/quy-dinh-ktx', icon: Gavel },
  ],
}

export const roleLabels = {
  sale: 'Nhân viên Sale',
  quanly: 'Nhân viên Quản lý',
  ketoan: 'Nhân viên Kế toán',
  phutrach: 'Nhân viên Phụ trách',
  admin: 'Quản trị',
}
