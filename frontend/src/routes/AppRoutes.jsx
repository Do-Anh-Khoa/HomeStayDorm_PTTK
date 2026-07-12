import { Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import MainLayout from '../components/layout/MainLayout.jsx'
import {
  clearAuthSession,
  getStoredRole,
  getStoredToken,
  getTokenExpiryMs,
  isTokenExpired,
} from '../services/authSession.js'

import LoginPage from '../pages/auth/LoginPage.jsx'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage.jsx'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage.jsx'
import NotFoundPage from '../pages/NotFoundPage.jsx'

import DashboardSale from '../pages/sale/DashboardSale.jsx'
import HoSoDangKyPage from '../pages/sale/HoSoDangKyPage.jsx'
import ChiTietHoSoDangKyPage from '../pages/sale/ChiTietHoSoDangKyPage.jsx'
import TaoHoSoDangKyPage from '../pages/sale/TaoHoSoDangKyPage.jsx'
import TraCuuPhongGiuongPage from '../pages/sale/TraCuuPhongGiuongPage.jsx'
import LichXemPhongPage from '../pages/sale/LichXemPhongPage.jsx'
import PhieuThuSalePage from '../pages/sale/PhieuThuPage.jsx'
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

// Map role với prefix path
const defaultPathByRole = {
  sale:     '/sale',
  quanly:   '/quan-ly',
  ketoan:   '/ke-toan',
  phutrach: '/phu-trach',
  admin:    '/admin',
}

// Map loai_nv từ DB → role string dùng trong app
export const loaiNvToRole = {
  SALE:  'sale',
  QL:    'quanly',
  KT:    'ketoan',
  PT:    'phutrach',
  ADMIN: 'admin',
}

// ProtectedRoute: chặn user vào route không thuộc role của họ
function ProtectedRoute({ allowedRole, currentRole, children }) {
  // Chưa đăng nhập
  if (!currentRole) {
    return <Navigate to="/login" replace />
  }
  // Đăng nhập nhưng sai role
  if (currentRole !== allowedRole) {
    const correctPath = defaultPathByRole[currentRole] || '/login'
    return <Navigate to={correctPath} replace />
  }
  return children
}

// AppRoutes
export default function AppRoutes() {
  const [role, setRoleState] = useState(getStoredRole)

  const setRole = (nextRole) => {
    if (!nextRole) {
      clearAuthSession()
    }
    setRoleState(nextRole)
  }

  useEffect(() => {
    if (!role) {
      return undefined
    }

    const token = getStoredToken()
    if (!token || isTokenExpired(token)) {
      setRole('')
      return undefined
    }

    const expiresAt = getTokenExpiryMs(token)
    if (!expiresAt) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setRole('')
    }, Math.max(expiresAt - Date.now(), 0))

    return () => window.clearTimeout(timeoutId)
  }, [role])

  const homePath = defaultPathByRole[role] || '/login'

  return (
    <Routes>
      {/* Trang chủ → redirect theo role */}
      <Route path="/" element={<Navigate to={homePath} replace />} />

      {/* Auth pages — không cần đăng nhập */}
      <Route
        path="/login"
        element={role ? <Navigate to={homePath} replace /> : <LoginPage setRole={setRole} />}
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* SALE */}
      <Route
        element={
          <ProtectedRoute allowedRole="sale" currentRole={role}>
            <MainLayout role={role} setRole={setRole} />
          </ProtectedRoute>
        }
      >
        <Route path="/sale" element={<DashboardSale />} />
        <Route path="/sale/ho-so-dang-ky" element={<HoSoDangKyPage />} />
        <Route path="/sale/ho-so-dang-ky/:profileId" element={<ChiTietHoSoDangKyPage />} />
        <Route path="/sale/ho-so-dang-ky/tao-moi" element={<TaoHoSoDangKyPage />} />
        <Route path="/sale/tra-cuu-phong-giuong" element={<TraCuuPhongGiuongPage />} />
        <Route path="/sale/lich-xem-phong" element={<LichXemPhongPage />} />
        <Route path="/sale/phieu-thu" element={<PhieuThuSalePage />} />
        <Route path="/sale/phieu-dat-coc" element={<PhieuDatCocPage />} />
        <Route path="/sale/tra-phong" element={<TraPhongPage />} />
      </Route>

      {/* QUẢN LÝ */}
      <Route
        element={
          <ProtectedRoute allowedRole="quanly" currentRole={role}>
            <MainLayout role={role} setRole={setRole} />
          </ProtectedRoute>
        }
      >
        <Route path="/quan-ly" element={<DashboardQuanLy />} />
        <Route path="/quan-ly/tra-cuu-phong-giuong" element={<TraCuuPhongGiuongQuanLyPage />} />
        <Route path="/quan-ly/ban-giao" element={<BanGiaoPage />} />
        <Route path="/quan-ly/tra-phong" element={<TraPhongPage />} />
        <Route path="/quan-ly/vat-dung-hu-hai" element={<VatDungHuHaiPage />} />
        <Route path="/quan-ly/kiem-tra-phieu-thu" element={<KiemTraPhieuThuPage />} />
        <Route path="/quan-ly/cap-nhat-phieu-thu" element={<CapNhatPhieuThuPage />} />
        <Route path="/quan-ly/boi-thuong" element={<BoiThuongPage />} />
      </Route>

      {/* KẾ TOÁN  */}
      <Route
        element={
          <ProtectedRoute allowedRole="ketoan" currentRole={role}>
            <MainLayout role={role} setRole={setRole} />
          </ProtectedRoute>
        }
      >
        <Route path="/ke-toan" element={<DashboardKeToan />} />
        <Route path="/ke-toan/phieu-thu" element={<PhieuThuPage />} />
        <Route path="/ke-toan/dich-vu-hang-thang" element={<DichVuHangThangPage />} />
        <Route path="/ke-toan/xac-nhan-thanh-toan" element={<XacNhanThanhToanPage />} />
      </Route>

      {/*  PHỤ TRÁCH  */}
      <Route
        element={
          <ProtectedRoute allowedRole="phutrach" currentRole={role}>
            <MainLayout role={role} setRole={setRole} />
          </ProtectedRoute>
        }
      >
        <Route path="/phu-trach" element={<DashboardPhuTrach />} />
        <Route path="/phu-trach/hop-dong" element={<HopDongPage />} />
      </Route>

      {/*  ADMIN  */}
      <Route
        element={
          <ProtectedRoute allowedRole="admin" currentRole={role}>
            <MainLayout role={role} setRole={setRole} />
          </ProtectedRoute>
        }
      >
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

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
