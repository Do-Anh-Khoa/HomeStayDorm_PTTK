import { Router } from 'express'
import {
  getVatDungHuHaiList,
  getVatDungHuHaiDetail,
  saveVatDungHuHai,
} from '../controllers/vat-dung-hu-hai.controller.js'

const router = Router()

router.get('/', getVatDungHuHaiList)
router.get('/:ma_tp', getVatDungHuHaiDetail)
router.post('/:ma_tp', saveVatDungHuHai)

export default router