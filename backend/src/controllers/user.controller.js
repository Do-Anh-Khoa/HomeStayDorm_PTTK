import bcrypt from 'bcryptjs'
import prisma from '../config/prisma.js'
import { Prisma } from '@prisma/client'

// GET /api/users - Lấy danh sách tất cả người dùng (nhân viên)
export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.nhanvien.findMany({
      select: {
        ma_nv: true,
        ten_nv: true,
        cccd: true,
        sdt: true,
        gioi_tinh: true,
        ngay_sinh: true,
        luong: true,
        loai_nv: true,
        email: true,
        tinh_trang: true,
        ma_cn: true,
      },
      orderBy: {
        ma_nv: 'asc',
      },
    })

    res.json({
      success: true,
      data: users,
      message: 'Lấy danh sách người dùng thành công',
    })
  } catch (error) {
    console.error('Lỗi khi lấy danh sách người dùng:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách người dùng',
      error: error.message,
    })
  }
}

// GET /api/users/:id - Lấy thông tin chi tiết một người dùng
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params

    const user = await prisma.nhanvien.findUnique({
      where: { ma_nv: id },
      select: {
        ma_nv: true,
        ten_nv: true,
        cccd: true,
        sdt: true,
        gioi_tinh: true,
        ngay_sinh: true,
        luong: true,
        loai_nv: true,
        email: true,
        tinh_trang: true,
        ma_cn: true,
      },
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      })
    }

    res.json({
      success: true,
      data: user,
      message: 'Lấy thông tin người dùng thành công',
    })
  } catch (error) {
    console.error('Lỗi khi lấy thông tin người dùng:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin người dùng',
      error: error.message,
    })
  }
}

// POST /api/users - Tạo người dùng mới
export const createUser = async (req, res) => {
  try {
    const { ten_nv, cccd, sdt, gioi_tinh, ngay_sinh, luong, loai_nv, email, ma_cn, mat_khau } = req.body

    // Validate bắt buộc
    if (!ten_nv || !cccd || !sdt || !loai_nv || !email || !ma_cn || !mat_khau) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đủ thông tin bắt buộc',
      })
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await prisma.nhanvien.findFirst({
      where: {
        OR: [
          { email },
          { cccd },
        ],
      },
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email hoặc CCCD đã tồn tại trong hệ thống',
      })
    }

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(mat_khau, 10)

    // Tạo mã nhân viên tự động
    const lastEmployee = await prisma.nhanvien.findFirst({
      orderBy: { ma_nv: 'desc' },
      take: 1,
      select: { ma_nv: true },
    })
    const newId = lastEmployee ? `NV${String(parseInt(lastEmployee.ma_nv.slice(2)) + 1).padStart(3, '0')}` : 'NV001'

    const newUser = await prisma.nhanvien.create({
      data: {
        ma_nv: newId,
        ten_nv,
        cccd,
        sdt,
        gioi_tinh: gioi_tinh || 'Nam',
        ngay_sinh: ngay_sinh ? new Date(ngay_sinh) : new Date(),
        luong: luong ? parseFloat(luong) : 0,
        loai_nv,
        email,
        tinh_trang: 'Đang làm việc',
        ma_cn,
        mat_khau: hashedPassword,
      },
      select: {
        ma_nv: true,
        ten_nv: true,
        cccd: true,
        sdt: true,
        gioi_tinh: true,
        ngay_sinh: true,
        luong: true,
        loai_nv: true,
        email: true,
        tinh_trang: true,
        ma_cn: true,
      },
    })

    res.status(201).json({
      success: true,
      data: newUser,
      message: 'Tạo người dùng thành công',
    })
  } catch (error) {
    console.error('Lỗi khi tạo người dùng:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo người dùng',
      error: error.message,
    })
  }
}

// PUT /api/users/:id - Cập nhật thông tin người dùng
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { ten_nv, sdt, gioi_tinh, ngay_sinh, luong, loai_nv, email, tinh_trang } = req.body

    const updatedUser = await prisma.nhanvien.update({
      where: { ma_nv: id },
      data: {
        ...(ten_nv && { ten_nv }),
        ...(sdt && { sdt }),
        ...(gioi_tinh && { gioi_tinh }),
        ...(ngay_sinh && { ngay_sinh: new Date(ngay_sinh) }),
        ...(luong && { luong: parseFloat(luong) }),
        ...(loai_nv && { loai_nv }),
        ...(email && { email }),
        ...(tinh_trang && { tinh_trang }),
      },
      select: {
        ma_nv: true,
        ten_nv: true,
        cccd: true,
        sdt: true,
        gioi_tinh: true,
        ngay_sinh: true,
        luong: true,
        loai_nv: true,
        email: true,
        tinh_trang: true,
        ma_cn: true,
      },
    })

    res.json({
      success: true,
      data: updatedUser,
      message: 'Cập nhật người dùng thành công',
    })
  } catch (error) {
    console.error('Lỗi khi cập nhật người dùng:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật người dùng',
      error: error.message,
    })
  }
}

// DELETE /api/users/:id - Xóa người dùng
export const deleteUser = async (req, res) => {
  const { id } = req.params

  try {
    await prisma.nhanvien.delete({
      where: { ma_nv: id },
    })

    return res.json({
      success: true,
      message: 'Xóa người dùng thành công',
      deleted: true,
    })
  } catch (error) {
    console.error('Lỗi khi xóa người dùng:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      })
    }

    // Nếu xóa không được do khóa ngoại, chuyển thành cập nhật trạng thái
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      try {
        const updatedUser = await prisma.nhanvien.update({
          where: { ma_nv: id },
          data: { tinh_trang: 'Đã nghỉ việc' },
        })

        return res.json({
          success: true,
          message: 'Người dùng không thể xóa trực tiếp do ràng buộc dữ liệu, đã cập nhật trạng thái thành "Đã nghỉ việc"',
          deleted: false,
          data: updatedUser,
        })
      } catch (updateError) {
        console.error('Lỗi khi cập nhật trạng thái người dùng sau khi xóa thất bại:', updateError)
        return res.status(500).json({
          success: false,
          message: 'Không thể xóa hoặc cập nhật trạng thái người dùng',
          error: updateError.message,
        })
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa người dùng',
      error: error.message,
    })
  }
}

