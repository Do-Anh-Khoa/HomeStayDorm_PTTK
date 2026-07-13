import { Router } from 'express'
import {
  inHopDongPDF,
  lapVaLuuHopDong,
  loadDSHopDongDaLapHomNay,
  loadDSPDCChoLapHopDong,
  loadThongTinLapHopDong,
  xemChiTietHopDong,
  xemTruocHopDong,
} from '../controllers/hop-dong-thue.controller.js'

const router = Router()

router.get('/cho-xu-ly', loadDSPDCChoLapHopDong)
router.get('/da-lap-hom-nay', loadDSHopDongDaLapHomNay)
router.get('/lap/:maPDC', loadThongTinLapHopDong)
router.post('/xem-truoc', xemTruocHopDong)
router.post('/lap', lapVaLuuHopDong)
router.get('/:maHDT/pdf', inHopDongPDF)
router.get('/:maHDT', xemChiTietHopDong)

export default router
