import { Router } from 'express'
import {
  huyHoSoTraPhong,
  lapHoSoTraPhong,
  loadDanhSachHoSoTraPhong,
  timKiemKhachThueTraPhong,
  xemChiTietHoSoTraPhong,
} from '../controllers/ho-so-tra-phong.controller.js'

const router = Router()

router.get('/', loadDanhSachHoSoTraPhong)
router.get('/search', timKiemKhachThueTraPhong)
router.post('/', lapHoSoTraPhong)
router.get('/:maTP', xemChiTietHoSoTraPhong)
router.post('/:maTP/huy', huyHoSoTraPhong)

export default router

