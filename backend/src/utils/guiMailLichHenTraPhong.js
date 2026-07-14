import nodemailer from 'nodemailer'
import dns from 'dns/promises'

const formatNgayGio = (d) => {
  if (!d) return ''
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('vi-VN')
}

async function kiemTraDomainNhanMail(email) {
  try {
    const domain = String(email || '').split('@')[1]
    if (!domain) return false

    const mxRecords = await dns.resolveMx(domain)

    return mxRecords.some((mx) => mx.exchange && mx.exchange.trim() !== '')
  } catch {
    return false
  }
}

export const guiEmailLichHenTraPhong = async ({ email, tenKhachHang, maTP, tgHen, phongGiuong }) => {
  if (!email) {
    console.error('Gửi email lịch hẹn trả phòng thất bại: khách hàng chưa có email.')
    return false
  }

  const domainHopLe = await kiemTraDomainNhanMail(email)

  if (!domainHopLe) {
    console.error(`Gửi email lịch hẹn trả phòng thất bại: domain của "${email}" không hợp lệ.`)
    return false
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  try {
    await transporter.sendMail({
      from: `"Homestay Dorm System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Lịch hẹn trả phòng - Hồ sơ ${maTP}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px;">
          <h2 style="color: #3b4f27;">🏠 Lịch hẹn trả phòng</h2>

          <p>Chào <strong>${tenKhachHang || ''}</strong>,</p>

          <p>
            Hệ thống đã ghi nhận lịch hẹn trả phòng cho hồ sơ
            <strong>${maTP || ''}</strong>.
          </p>

          <p>
            Phòng/Giường:
            <strong>${phongGiuong || ''}</strong>
          </p>

          <p>
            Thời gian hẹn:
            <strong>${formatNgayGio(tgHen)}</strong>
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />

          <p style="color: #999; font-size: 12px; text-align: center;">
            © 2026 Homestay Dorm System
          </p>
        </div>
      `,
    })

    return true
  } catch (err) {
    console.error('guiEmailLichHenTraPhong:', err?.message)
    return false
  }
}

export default { guiEmailLichHenTraPhong }

