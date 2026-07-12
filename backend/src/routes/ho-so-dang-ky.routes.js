import { Router } from 'express'
import {
  createHoSoDangKy,
  getHoSoDangKyDetail,
  getHoSoDangKyFormOptions,
  getHoSoDangKyList,
} from '../controllers/ho-so-dang-ky.controller.js'

const router = Router()

router.get('/form-options', getHoSoDangKyFormOptions)
router.get('/', getHoSoDangKyList)
router.get('/:maDk', getHoSoDangKyDetail)
router.post('/', createHoSoDangKy)

export default router
