import { Router } from 'express'
import {
  getTongQuan,
  getGiuongTheoChiNhanhHandler,
  getPhanBoNhanSuHandler,
} from '../controllers/admin-dashboard.controller.js'

const router = Router()

router.get('/tong-quan', getTongQuan)
router.get('/giuong-theo-chi-nhanh', getGiuongTheoChiNhanhHandler)
router.get('/phan-bo-nhan-su', getPhanBoNhanSuHandler)

export default router
