import express from 'express'
import {
  loadDSPDCChuaLap,
  timKiemPDC,
  loadThongTinLapPTDC,
  lapVaLuuPTDC,
  loadDSPTDCDaLapHomNay,
  xemChiTietPTDC,
  inPhieuThuPDF,
} from '../controllers/phieuThuDatCocController.js'
// GIẢ ĐỊNH tên/đường dẫn middleware — sửa lại cho khớp với middleware thật
// đang dùng ở phieuThuBoiThuongRoutes.js.
import { authMiddleware } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.use(authMiddleware)

router.get('/cho-xu-ly', (req, res) => {
  if (req.query.tuKhoa) return timKiemPDC(req, res)
  return loadDSPDCChuaLap(req, res)
})
router.get('/da-lap-hom-nay', loadDSPTDCDaLapHomNay)
router.get('/lap/:maPDC', loadThongTinLapPTDC)
router.post('/lap', lapVaLuuPTDC)
router.get('/:maPTDC/pdf', inPhieuThuPDF) // đặt TRƯỚC '/:maPTDC' để không bị nuốt route
router.get('/:maPTDC', xemChiTietPTDC)

export default router