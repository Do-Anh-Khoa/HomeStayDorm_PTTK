import { Router } from 'express'
import {
  getPhongGiuongList,
  getLoaiPhongOptions,
  getChiNhanhOptions,
  createPhongGiuong,
  updatePhongGiuong,
  deletePhongGiuong,
} from '../controllers/phong-giuong.controller.js'

const router = Router()

router.get('/loai-phong', getLoaiPhongOptions)
router.get('/chi-nhanh', getChiNhanhOptions)
router.get('/', getPhongGiuongList)
router.post('/', createPhongGiuong)
router.delete('/:ma_phong', deletePhongGiuong)
router.put('/:ma_phong', updatePhongGiuong)
export default router