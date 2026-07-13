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