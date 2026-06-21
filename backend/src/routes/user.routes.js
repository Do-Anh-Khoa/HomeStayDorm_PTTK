import { Router } from 'express'
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/user.controller.js'

const router = Router()

// GET /api/users - Lấy danh sách người dùng
router.get('/', getAllUsers)

// GET /api/users/:id - Lấy chi tiết một người dùng
router.get('/:id', getUserById)

// POST /api/users - Tạo người dùng mới
router.post('/', createUser)

// PUT /api/users/:id - Cập nhật người dùng
router.put('/:id', updateUser)

// DELETE /api/users/:id - Xóa người dùng
router.delete('/:id', deleteUser)

export default router
