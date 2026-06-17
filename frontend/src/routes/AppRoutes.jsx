import { Navigate, Route, Routes } from 'react-router-dom'
import { useState } from 'react'
import MainLayout from '../components/layout/MainLayout.jsx'

import LoginPage from '../pages/auth/LoginPage.jsx'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage.jsx'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage.jsx'
import NotFoundPage from '../pages/NotFoundPage.jsx'

import DashboardSale from '../pages/sale/DashboardSale.jsx'
import HoSoDangKyPage from '../pages/sale/HoSoDangKyPage.jsx'
import TraCuuPhongGiuongPage from '../pages/sale/TraCuuPhongGiuongPage.jsx'
import LichXemPhongPage from '../pages/sale/LichXemPhongPage.jsx'
import PhieuDatCocPage from '../pages/sale/PhieuDatCocPage.jsx'

import DashboardQuanLy from '../pages/quanly/DashboardQuanLy.jsx'
import BanGiaoPage from '../pages/quanly/BanGiaoPage.jsx'
import TraCuuPhongGiuongQuanLyPage from '../pages/quanly/TraCuuPhongGiuongPage.jsx'
import TraPhongPage from '../pages/quanly/TraPhongPage.jsx'
import VatDungHuHaiPage from '../pages/quanly/VatDungHuHaiPage.jsx'
import KiemTraPhieuThuPage from '../pages/quanly/KiemTraPhieuThuPage.jsx'
import CapNhatPhieuThuPage from '../pages/quanly/CapNhatPhieuThuPage.jsx'
import BoiThuongPage from '../pages/quanly/BoiThuongPage.jsx'

import DashboardKeToan from '../pages/ketoan/DashboardKeToan.jsx'
import PhieuThuPage from '../pages/ketoan/PhieuThuPage.jsx'
import DichVuHangThangPage from '../pages/ketoan/DichVuHangThangPage.jsx'
import XacNhanThanhToanPage from '../pages/ketoan/XacNhanThanhToanPage.jsx'

import DashboardPhuTrach from '../pages/phutrach/DashboardPhuTrach.jsx'
import HopDongPage from '../pages/phutrach/HopDongPage.jsx'

import DashboardAdmin from '../pages/admin/DashboardAdmin.jsx'
import QuanLyNguoiDungPage from '../pages/admin/QuanLyNguoiDungPage.jsx'
import QuanLyChiNhanhPage from '../pages/admin/QuanLyChiNhanhPage.jsx'
import QuanLyLoaiPhongPage from '../pages/admin/QuanLyLoaiPhongPage.jsx'
import QuanLyPhongGiuongPage from '../pages/admin/QuanLyPhongGiuongPage.jsx'
import QuanLyDichVuPage from '../pages/admin/QuanLyDichVuPage.jsx'
import QuanLyQuyDinhPage from '../pages/admin/QuanLyQuyDinhPage.jsx'
import QuanLyQuyDinhHoanCocPage from '../pages/admin/QuanLyQuyDinhHoanCocPage.jsx'
import QuanLyQuyDinhKtxPage from '../pages/admin/QuanLyQuyDinhKtxPage.jsx'
import QuanLyVatDungPage from '../pages/admin/QuanLyVatDungPage.jsx'

const defaultPathByRole = {
  sale: '/sale',
  quanly: '/quan-ly',
  ketoan: '/ke-toan',
  phutrach: '/phu-trach',
  admin: '/admin',
}

function getStoredRole() {
  return localStorage.getItem('role') || sessionStorage.getItem('role') || ''
}

export default function AppRoutes() {
  const [role, setRoleState] = useState(getStoredRole)

  const setRole = (nextRole) => {
    if (!nextRole) {
      localStorage.removeItem('token')
      localStorage.removeItem('role')
      localStorage.removeItem('user')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('role')
      sessionStorage.removeItem('user')
    }

    setRoleState(nextRole)
  }

  const homePath = defaultPathByRole[role] || '/login'

  return (
    <Routes>
      <Route path="/" element={<Navigate to={homePath} replace />} />
      <Route
        path="/login"
        element={role ? <Navigate to={homePath} replace /> : <LoginPage setRole={setRole} />}
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<MainLayout role={role} setRole={setRole} />}>
        <Route path="/sale" element={<DashboardSale />} />
        <Route path="/sale/ho-so-dang-ky" element={<HoSoDangKyPage />} />
        <Route path="/sale/tra-cuu-phong-giuong" element={<TraCuuPhongGiuongPage />} />
        <Route path="/sale/lich-xem-phong" element={<LichXemPhongPage />} />
        <Route path="/sale/phieu-dat-coc" element={<PhieuDatCocPage />} />
        <Route path="/sale/tra-phong" element={<TraPhongPage />} />

        <Route path="/quan-ly" element={<DashboardQuanLy />} />
        <Route path="/quan-ly/tra-cuu-phong-giuong" element={<TraCuuPhongGiuongQuanLyPage />} />
        <Route path="/quan-ly/ban-giao" element={<BanGiaoPage />} />
        <Route path="/quan-ly/tra-phong" element={<TraPhongPage />} />
        <Route path="/quan-ly/vat-dung-hu-hai" element={<VatDungHuHaiPage />} />
        <Route path="/quan-ly/kiem-tra-phieu-thu" element={<KiemTraPhieuThuPage />} />
        <Route path="/quan-ly/cap-nhat-phieu-thu" element={<CapNhatPhieuThuPage />} />
        <Route path="/quan-ly/boi-thuong" element={<BoiThuongPage />} />

        <Route path="/ke-toan" element={<DashboardKeToan />} />
        <Route path="/ke-toan/phieu-thu" element={<PhieuThuPage />} />
        <Route path="/ke-toan/dich-vu-hang-thang" element={<DichVuHangThangPage />} />
        <Route path="/ke-toan/xac-nhan-thanh-toan" element={<XacNhanThanhToanPage />} />

        <Route path="/phu-trach" element={<DashboardPhuTrach />} />
        <Route path="/phu-trach/hop-dong" element={<HopDongPage />} />

        <Route path="/admin" element={<DashboardAdmin />} />
        <Route path="/admin/nguoi-dung" element={<QuanLyNguoiDungPage />} />
        <Route path="/admin/chi-nhanh" element={<QuanLyChiNhanhPage />} />
        <Route path="/admin/loai-phong" element={<QuanLyLoaiPhongPage />} />
        <Route path="/admin/phong-giuong" element={<QuanLyPhongGiuongPage />} />
        <Route path="/admin/dich-vu" element={<QuanLyDichVuPage />} />
        <Route path="/admin/quy-dinh" element={<QuanLyQuyDinhPage />} />
        <Route path="/admin/quy-dinh-hoan-coc" element={<QuanLyQuyDinhHoanCocPage />} />
        <Route path="/admin/quy-dinh-ktx" element={<QuanLyQuyDinhKtxPage />} />
        <Route path="/admin/vat-dung" element={<QuanLyVatDungPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
