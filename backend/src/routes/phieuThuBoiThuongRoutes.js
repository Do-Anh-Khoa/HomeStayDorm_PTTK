// backend/src/routes/phieuThuBoiThuongRoutes.js
import { Router } from 'express'
import {
  loadDSBTChoXuLy,
  timKiemBBBT,
  loadThongTinLapPTBT,
  lapVaLuuPTBT,
  loadDSPTBTDaLapHomNay,
  xemChiTietPTBT,
  inPhieuThuPDF,
} from '../controllers/phieuThuBoiThuongController.js'

const router = Router()

// Chặn nếu không đúng vai trò Kế toán.
// authMiddleware (đã áp khi mount ở index.js) chỉ xác thực token,
// nên check role KT thực hiện ngay tại đây.
router.use((req, res, next) => {
  if (req.auth?.loai_nv !== 'KT') {
    return res.status(403).json({ message: 'Chỉ Nhân viên Kế toán được truy cập chức năng này.' })
  }
  next()
})

router.get('/cho-xu-ly', (req, res, next) => {
  if (req.query.tuKhoa !== undefined) return timKiemBBBT(req, res, next)
  return loadDSBTChoXuLy(req, res, next)
})
router.get('/da-lap-hom-nay', loadDSPTBTDaLapHomNay)
router.get('/lap/:maBT', loadThongTinLapPTBT)
router.post('/lap', lapVaLuuPTBT)
router.get('/:maPTDB/pdf', inPhieuThuPDF)
router.get('/:maPTDB', xemChiTietPTBT)

export default router