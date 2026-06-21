import { Router } from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import {
  getQuyDinhKtxList,
  createQuyDinhKtx,
  updateQuyDinhKtx,
  deleteQuyDinhKtx,
} from '../controllers/quy-dinh-ktx.controller.js'

const router = Router()

router.use(authMiddleware)
router.get('/', getQuyDinhKtxList)
router.post('/', createQuyDinhKtx)
router.put('/:ma', updateQuyDinhKtx)
router.delete('/:ma', deleteQuyDinhKtx)

export default router
