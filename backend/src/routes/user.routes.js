import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  res.json({ data: [], message: 'Danh sách người dùng demo' })
})

export default router
