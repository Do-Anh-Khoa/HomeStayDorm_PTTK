import { Router } from 'express'
import {
  getTraCuuPhongGiuongOptions,
  getTraCuuPhongGiuongList,
  getTraCuuPhongGiuongDetail,
} from '../controllers/tra-cuu-phong-giuong.controller.js'

const router = Router()

router.get('/options', getTraCuuPhongGiuongOptions)
router.get('/', getTraCuuPhongGiuongList)
router.get('/:ma_phong', getTraCuuPhongGiuongDetail)

export default router