import { Router } from 'express'
import {
  getVatDungList,
  createVatDung,
  updateVatDung,
  deleteVatDung,
} from '../controllers/vat-dung.controller.js'

const router = Router()

router.get('/', getVatDungList)
router.post('/', createVatDung)
router.put('/:ma_vd', updateVatDung)
router.delete('/:ma_vd', deleteVatDung)

export default router