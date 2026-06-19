
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import prisma from '../config/prisma.js'
import { signToken, verifyToken } from '../utils/jwt.js'
import { sendResetPasswordEmail } from '../utils/sendEmail.js'

// Lưu token tạm thời trong bộ nhớ (sau này có thể chuyển vào DB nếu cần)
// Key: token, Value: { email, expiresAt }
const resetTokenStore = new Map()
const DUMMY_PASSWORD_HASH = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.'

// POST /api/auth/login
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

    const passwordHash = nhanVien?.mat_khau || DUMMY_PASSWORD_HASH
    const isMatch = await bcrypt.compare(password, passwordHash)

    if (!nhanVien || !isMatch) {
      return res.status(401).json({ message: 'Sai tên đăng nhập/mật khẩu.' })
    }

    if (nhanVien.tinh_trang !== 'Đang làm việc') {
      return res.status(403).json({ message: 'Tài khoản không thể đăng nhập.' })
    }

    // Tạo token chứa thông tin để phân quyền ở các API sau này
    const jti = crypto.randomUUID()
    const token = signToken(
      {
        ma_nv: nhanVien.ma_nv,
        loai_nv: nhanVien.loai_nv,
        ma_cn: nhanVien.ma_cn,
      },
      { jwtid: jti },
    )
    const tokenPayload = verifyToken(token)

    await prisma.phien_dang_nhap.create({
      data: {
        jti,
        ma_nv: nhanVien.ma_nv,
        het_han: new Date(tokenPayload.exp * 1000),
      },
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

// POST /api/auth/logout
export const logout = async (req, res) => {
  try {
    await prisma.phien_dang_nhap.updateMany({
      where: {
        jti: req.auth.jti,
        thu_hoi_luc: null,
      },
      data: {
        thu_hoi_luc: new Date(),
      },
    })

    return res.status(200).json({ message: 'Đăng xuất thành công.' })
  } catch (error) {
    console.error('Logout error:', error)
    return res.status(500).json({ message: 'Không thể đăng xuất lúc này.' })
  }
}

// POST /api/auth/forgot-password
// Body: { email }
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

// POST /api/auth/reset-password
// Body: { token, newPassword }
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Thiếu thông tin.' })
    }

    if (newPassword.length < 7) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 7 ký tự.' })
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
export const verifyResetToken = (req, res) => {
  const { token } = req.query

  if (!token) {
    return res.status(400).json({ valid: false, message: 'Thiếu token.' })
  }

  const record = resetTokenStore.get(token)

  if (!record) {
    return res.status(400).json({ valid: false, message: 'Link không hợp lệ hoặc đã được sử dụng.' })
  }

  if (Date.now() > record.expiresAt) {
    resetTokenStore.delete(token)
    return res.status(400).json({ valid: false, message: 'Link đã hết hạn. Vui lòng yêu cầu link mới.' })
  }

  return res.status(200).json({ valid: true })
}
