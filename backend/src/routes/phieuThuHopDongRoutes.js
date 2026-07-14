import express from 'express'
import {
  inPhieuThuPDF,
  lapVaLuuPTHD,
  loadDSPTHDChoXuLy,
  loadDSPTHDDaLapHomNay,
  loadThongTinLapPTHD,
  timKiemPTHDChoXuLy,
  xemChiTietPTHD,
} from '../controllers/phieuThuHopDongController.js'

const router = express.Router()

router.use((req, res, next) => {
  if (req.auth?.loai_nv !== 'KT') {
    return res.status(403).json({ message: 'Chỉ Nhân viên Kế toán được truy cập chức năng này.' })
  }

  next()
})

router.get('/cho-xu-ly', (req, res) => {
  if (req.query.tuKhoa !== undefined) return timKiemPTHDChoXuLy(req, res)
  return loadDSPTHDChoXuLy(req, res)
})
router.get('/da-lap-hom-nay', loadDSPTHDDaLapHomNay)
router.get('/lap/:maHDT', loadThongTinLapPTHD)
router.post('/lap', lapVaLuuPTHD)
router.get('/:maPTHD/pdf', inPhieuThuPDF)
router.get('/:maPTHD', xemChiTietPTHD)

export default router