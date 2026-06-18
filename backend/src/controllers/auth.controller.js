
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import prisma from '../config/prisma.js'
import { signToken } from '../utils/jwt.js'
import { sendResetPasswordEmail } from '../utils/sendEmail.js'

// Lưu token tạm thời trong bộ nhớ (sau này có thể chuyển vào DB nếu cần)
// Key: token, Value: { email, expiresAt }
const resetTokenStore = new Map()

// ============================================================
// POST /api/auth/login
// ============================================================
export const login = async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin.' })
    }

    // Tìm nhân viên theo email hoặc số điện thoại
    const nhanVien = await prisma.nhanvien.findFirst({
      where: {
        OR: [{ email: username }, { sdt: username }],
      },
    })

    if (!nhanVien) {
      return res.status(401).json({ message: 'Tài khoản không tồn tại.' })
    }

    if (nhanVien.tinh_trang !== 'Đang làm việc') {
      return res.status(403).json({ message: 'Tài khoản đã nghỉ việc, không thể đăng nhập.' })
    }

    const isMatch = await bcrypt.compare(password, nhanVien.mat_khau)
    if (!isMatch) {
      return res.status(401).json({ message: 'Mật khẩu không đúng.' })
    }

    // Tạo token chứa thông tin để phân quyền ở các API sau này
    const token = signToken({
      ma_nv: nhanVien.ma_nv,
      loai_nv: nhanVien.loai_nv,
      ma_cn: nhanVien.ma_cn,
    })

    return res.status(200).json({
      message: 'Đăng nhập thành công.',
      token,
      user: {
        ma_nv: nhanVien.ma_nv,
        ten_nv: nhanVien.ten_nv,
        loai_nv: nhanVien.loai_nv, // SALE | QL | KT | PT | ADMIN -> frontend dùng để điều hướng
        ma_cn: nhanVien.ma_cn,
        email: nhanVien.email,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ message: 'Lỗi server.' })
  }
}

// ============================================================
// POST /api/auth/forgot-password
// Body: { email }
// ============================================================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: 'Vui lòng nhập email.' })
    }

    const nhanVien = await prisma.nhanvien.findUnique({ where: { email } })
    if (!nhanVien) {
      // Vẫn trả 200 để không lộ email nào đã đăng ký trong hệ thống
      return res.status(200).json({
        message: 'Nếu email tồn tại, chúng tôi đã gửi link khôi phục.',
      })
    }

    // Tạo token ngẫu nhiên
    const token = crypto.randomBytes(32).toString('hex')

    // Lưu token + thời hạn 30 phút
    resetTokenStore.set(token, {
      email,
      expiresAt: Date.now() + 30 * 60 * 1000, // 30 phút
    })

    // Link gửi về email (frontend sẽ xử lý trang này)
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`

    // Gửi email
    await sendResetPasswordEmail(email, resetLink)

    return res.status(200).json({
      message: 'Link đặt lại mật khẩu đã được gửi đến email của bạn.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' })
  }
}

// ============================================================
// POST /api/auth/reset-password
// Body: { token, newPassword }
// ============================================================
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Thiếu thông tin.' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 8 ký tự.' })
    }

    // Kiểm tra token có tồn tại không
    const record = resetTokenStore.get(token)
    if (!record) {
      return res.status(400).json({ message: 'Link không hợp lệ hoặc đã được sử dụng.' })
    }

    // Kiểm tra token có hết hạn chưa
    if (Date.now() > record.expiresAt) {
      resetTokenStore.delete(token)
      return res.status(400).json({ message: 'Link đã hết hạn. Vui lòng yêu cầu link mới.' })
    }

    // Hash mật khẩu mới TRƯỚC KHI lưu xuống database
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Lưu hash thật vào database (thay cho console.log tạm thời trước đây)
    await prisma.nhanvien.update({
      where: { email: record.email },
      data: { mat_khau: hashedPassword },
    })

    // Xóa token sau khi dùng xong
    resetTokenStore.delete(token)

    return res.status(200).json({ message: 'Đặt lại mật khẩu thành công.' })
  } catch (error) {
    console.error('Reset password error:', error)
    return res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' })
  }
}