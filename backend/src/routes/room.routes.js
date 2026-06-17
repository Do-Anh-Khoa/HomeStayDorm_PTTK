import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  res.json({ data: [], message: 'Danh sách phòng/giường demo' })
})

export default router
