import { Navigate, Route, Routes } from 'react-router-dom'
import { useState } from 'react'
import MainLayout from '../components/layout/MainLayout.jsx'

import LoginPage from '../pages/auth/LoginPage.jsx'
import NotFoundPage from '../pages/NotFoundPage.jsx'

import DashboardSale from '../pages/sale/DashboardSale.jsx'
import HoSoDangKyPage from '../pages/sale/HoSoDangKyPage.jsx'
import TraCuuPhongGiuongPage from '../pages/sale/TraCuuPhongGiuongPage.jsx'
import LichXemPhongPage from '../pages/sale/LichXemPhongPage.jsx'
import PhieuDatCocPage from '../pages/sale/PhieuDatCocPage.jsx'

import DashboardQuanLy from '../pages/quanly/DashboardQuanLy.jsx'
import BanGiaoPage from '../pages/quanly/BanGiaoPage.jsx'
import TraPhongPage from '../pages/quanly/TraPhongPage.jsx'
import VatDungHuHaiPage from '../pages/quanly/VatDungHuHaiPage.jsx'
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
import QuanLyPhongGiuongPage from '../pages/admin/QuanLyPhongGiuongPage.jsx'
import QuanLyDichVuPage from '../pages/admin/QuanLyDichVuPage.jsx'
import QuanLyQuyDinhPage from '../pages/admin/QuanLyQuyDinhPage.jsx'
import QuanLyVatDungPage from '../pages/admin/QuanLyVatDungPage.jsx'

export default function AppRoutes() {
  const [role, setRole] = useState('')

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage setRole={setRole} />} />

      <Route element={<MainLayout role={role} setRole={setRole} />}>
        <Route path="/sale" element={<DashboardSale />} />
        <Route path="/sale/ho-so-dang-ky" element={<HoSoDangKyPage />} />
        <Route path="/sale/tra-cuu-phong-giuong" element={<TraCuuPhongGiuongPage />} />
        <Route path="/sale/lich-xem-phong" element={<LichXemPhongPage />} />
        <Route path="/sale/phieu-dat-coc" element={<PhieuDatCocPage />} />

        <Route path="/quan-ly" element={<DashboardQuanLy />} />
        <Route path="/quan-ly/ban-giao" element={<BanGiaoPage />} />
        <Route path="/quan-ly/tra-phong" element={<TraPhongPage />} />
        <Route path="/quan-ly/vat-dung-hu-hai" element={<VatDungHuHaiPage />} />
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
        <Route path="/admin/phong-giuong" element={<QuanLyPhongGiuongPage />} />
        <Route path="/admin/dich-vu" element={<QuanLyDichVuPage />} />
        <Route path="/admin/quy-dinh" element={<QuanLyQuyDinhPage />} />
        <Route path="/admin/vat-dung" element={<QuanLyVatDungPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
