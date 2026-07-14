import { Router } from 'express'
import authRoutes from './auth.routes.js'
import userRoutes from './user.routes.js'
import roomRoutes from './room.routes.js'
import chiNhanhRoutes from './chi-nhanh.routes.js'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import dichVuRoutes from './dich-vu.routes.js'
import chiTietDvRoutes from './chi-tiet-dv.routes.js'
import quyDinhHoanCocRoutes from './quy-dinh-hoan-coc.routes.js'
import loaiPhongRoutes from './loai-phong.routes.js'
import phongGiuongRoutes from './phong-giuong.routes.js'
import quyDinhKtxRoutes from './quy-dinh-ktx.routes.js'
import vatDungRoutes from './vat-dung.routes.js'
import dashboardRoutesQly from './dashboard_qly.routes.js'
import saleDashboardRoutes from './sale-dashboard.routes.js'
import phieuThuRoutes from './phieu-thu.routes.js'
import hoSoDangKyRoutes from './ho-so-dang-ky.routes.js'
import dashboardRoutes from './dashboard.routes.js'
import phuTrachDashboardRoutes from './phu-trach-dashboard.routes.js'
import traCuuPhongGiuongRoutes from './tra-cuu-phong-giuong.routes.js'
import vatDungHuHaiRoutes from './vat-dung-hu-hai.routes.js'
import boiThuongRoutes from './boi-thuong.routes.js'
import banGiaoRoutes from './ban-giao.routes.js'
import ptTraPhongRoutes from './pt-tra-phong.routes.js'
import keToanDashboardRoutes from './ke-toan-dashboard.routes.js'
import phieuThuBoiThuongRoutes from './phieuThuBoiThuongRoutes.js'
import phieuThuDatCocRoutes from './phieuThuDatCocRoutes.js'
import phieuThuHopDongRoutes from './phieuThuHopDongRoutes.js'
import capNhatPhieuThuQLRoutes from './capNhatPhieuThuQLRoutes.js'
import capNhatPhieuThuSaleRoutes from './capNhatPhieuThuSaleRoutes.js'
import phieuDatCocRoutes from './phieu-dat-coc.routes.js'
import hopDongThueRoutes from './hop-dong-thue.routes.js'
import lichHenRoutes from './lich-hen.routes.js'
const router = Router()

router.use('/auth', authRoutes)
router.use('/users', authMiddleware, userRoutes)
router.use('/rooms', authMiddleware, roomRoutes)
router.use('/phong', authMiddleware, roomRoutes)
router.use('/chi-nhanh', authMiddleware, chiNhanhRoutes)
router.use('/dich-vu', dichVuRoutes)
router.use('/chi-tiet-dv', chiTietDvRoutes)
router.use('/quy-dinh-hoan-coc', quyDinhHoanCocRoutes)
router.use('/loai-phong', authMiddleware, loaiPhongRoutes)
router.use('/phong-giuong', phongGiuongRoutes)
router.use('/quy-dinh-ktx', authMiddleware, quyDinhKtxRoutes)
router.use('/vat-dung', vatDungRoutes)
router.use('/sale-dashboard', authMiddleware, saleDashboardRoutes)
router.use('/phieu-thu', phieuThuRoutes)
router.use('/ho-so-dang-ky', authMiddleware, hoSoDangKyRoutes)
router.use('/dashboard-qly', authMiddleware, dashboardRoutesQly)
router.use('/dashboard', authMiddleware, dashboardRoutes)
router.use('/phu-trach-dashboard', authMiddleware, phuTrachDashboardRoutes)
router.use('/tra-cuu-phong-giuong', authMiddleware, traCuuPhongGiuongRoutes)
router.use('/vat-dung-hu-hai', authMiddleware, vatDungHuHaiRoutes)
router.use('/boi-thuong', authMiddleware, boiThuongRoutes)
router.use('/ban-giao', authMiddleware, banGiaoRoutes)
router.use('/pt-tra-phong', authMiddleware, ptTraPhongRoutes)
router.use('/ke-toan', authMiddleware, keToanDashboardRoutes)
router.use('/phieu-thu-boi-thuong', authMiddleware, phieuThuBoiThuongRoutes)
router.use('/phieu-thu-dat-coc', authMiddleware, phieuThuDatCocRoutes)
router.use('/phieu-thu-hop-dong', authMiddleware, phieuThuHopDongRoutes)
router.use('/cap-nhat-phieu-thu-ql', authMiddleware, capNhatPhieuThuQLRoutes)
router.use('/cap-nhat-phieu-thu-sale', authMiddleware, capNhatPhieuThuSaleRoutes)

router.use('/phieu-dat-coc', authMiddleware, phieuDatCocRoutes)
router.use('/hop-dong-thue', authMiddleware, hopDongThueRoutes)
router.use('/lich-hen', authMiddleware, lichHenRoutes)
export default router
