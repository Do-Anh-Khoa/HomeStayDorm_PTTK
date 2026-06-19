import { Router } from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import {
  getDichVuList,
  createDichVu,
  updateDichVu,
  deleteDichVu,
} from '../controllers/dich-vu.controller.js'

const router = Router()

router.use(authMiddleware)

router.get('/',        getDichVuList)
router.post('/',       createDichVu)
router.put('/:ma',     updateDichVu)
router.delete('/:ma',  deleteDichVu)

export default router