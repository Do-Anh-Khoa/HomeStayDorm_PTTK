import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sendResetPasswordEmail } from '../utils/sendEmail.js'
// Lưu token tạm thời trong bộ nhớ (sau này thay bằng database)
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

    // TODO: thay bằng query database thật
    // const user = await prisma.user.findFirst({
    //   where: {
    //     OR: [
    //       { email: username },
    //       { phone: username },
    //       { username: username },
    //     ]
    //   }
    // })
    // if (!user) return res.status(401).json({ message: 'Tài khoản không tồn tại.' })
    // const isMatch = await bcrypt.compare(password, user.password)
    // if (!isMatch) return res.status(401).json({ message: 'Mật khẩu không đúng.' })

    return res.status(200).json({ message: 'Đăng nhập thành công.' })
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

    // TODO: sau khi có database, bỏ comment đoạn này
    // const user = await prisma.user.findUnique({ where: { email } })
    // if (!user) {
    //   // Vẫn trả về 200 để không lộ email nào đã đăng ký
    //   return res.status(200).json({ message: 'Nếu email tồn tại, chúng tôi đã gửi link khôi phục.' })
    // }

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
  console.log('EMAIL_USER:', process.env.EMAIL_USER)
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS)
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

    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // TODO: sau khi có database, bỏ comment đoạn này
    // await prisma.user.update({
    //   where: { email: record.email },
    //   data: { password: hashedPassword },
    // })

    console.log(`Đổi mật khẩu cho: ${record.email}`) // tạm thời log ra
    console.log(`Mật khẩu mới (đã hash): ${hashedPassword}`)

    // Xóa token sau khi dùng xong
    resetTokenStore.delete(token)

    return res.status(200).json({ message: 'Đặt lại mật khẩu thành công.' })
  } catch (error) {
    console.error('Reset password error:', error)
    return res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại.' })
  }
}