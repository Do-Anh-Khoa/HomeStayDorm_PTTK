import { Router } from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import {
  getDichVuPhongList,
  ghiNhanDichVu,
  getChoThanhToan,
  xacNhanThanhToan,
} from '../controllers/chi-tiet-dv.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/phong', getDichVuPhongList)
router.post('/ghi-nhan', ghiNhanDichVu)
router.get('/cho-thanh-toan', getChoThanhToan)
router.post('/xac-nhan-thanh-toan', xacNhanThanhToan)

export default router
