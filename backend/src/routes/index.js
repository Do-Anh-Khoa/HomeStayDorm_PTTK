import { Router } from 'express'
import authRoutes from './auth.routes.js'
import userRoutes from './user.routes.js'
import roomRoutes from './room.routes.js'
import chiNhanhRoutes from './chi-nhanh.routes.js'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import dichVuRoutes from './dich-vu.routes.js'
import quyDinhHoanCocRoutes from './quy-dinh-hoan-coc.routes.js'
import loaiPhongRoutes from './loai-phong.routes.js'
import phongGiuongRoutes from './phong-giuong.routes.js'
import quyDinhKtxRoutes from './quy-dinh-ktx.routes.js'
import vatDungRoutes from './vat-dung.routes.js'
import saleDashboardRoutes from './sale-dashboard.routes.js'
import hoSoDangKyRoutes from './ho-so-dang-ky.routes.js'
const router = Router()

router.use('/auth', authRoutes)
router.use('/users', authMiddleware, userRoutes)
router.use('/rooms', authMiddleware, roomRoutes)
router.use('/phong', authMiddleware, roomRoutes)
router.use('/chi-nhanh', authMiddleware, chiNhanhRoutes)
router.use('/dich-vu', dichVuRoutes)
router.use('/quy-dinh-hoan-coc', quyDinhHoanCocRoutes)
router.use('/loai-phong', authMiddleware, loaiPhongRoutes)
router.use('/phong-giuong', phongGiuongRoutes)
router.use('/quy-dinh-ktx', authMiddleware, quyDinhKtxRoutes)
router.use('/vat-dung', vatDungRoutes)
router.use('/sale-dashboard', authMiddleware, saleDashboardRoutes)
router.use('/ho-so-dang-ky', authMiddleware, hoSoDangKyRoutes)
export default router
