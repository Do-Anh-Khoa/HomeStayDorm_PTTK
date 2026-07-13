import { Router } from 'express'
import { createPhieuDatCoc } from '../controllers/phieu-dat-coc.controller.js'

const router = Router()

router.post('/', createPhieuDatCoc)

export default router
