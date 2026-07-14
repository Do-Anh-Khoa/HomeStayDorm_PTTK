import { Router } from 'express'
import {
  getBoiThuongPageData,
  createBoiThuong,
} from '../controllers/boi-thuong.controller.js'

const router = Router()

router.get('/', getBoiThuongPageData)
router.post('/', createBoiThuong)

export default router