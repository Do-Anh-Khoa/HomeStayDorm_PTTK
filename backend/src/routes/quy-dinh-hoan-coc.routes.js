import { Router } from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import {
  getQuyDinhList,
  createQuyDinh,
  updateQuyDinh,
  deleteQuyDinh,
} from '../controllers/quy-dinh-hoan-coc.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/',      getQuyDinhList)
router.post('/',     createQuyDinh)
router.put('/:id',   updateQuyDinh)
router.delete('/:id', deleteQuyDinh)

export default router