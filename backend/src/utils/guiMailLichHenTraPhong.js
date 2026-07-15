import nodemailer from 'nodemailer'
import dns from 'dns/promises'

// Cập nhật lại format ngày giờ hiển thị thân thiện hơn (VD: 14:30 - 15/07/2026)
const formatNgayGio = (d) => {
  if (!d) return ''
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return ''
  
  const gio = String(date.getHours()).padStart(2, '0')
  const phut = String(date.getMinutes()).padStart(2, '0')
  const ngay = String(date.getDate()).padStart(2, '0')
  const thang = String(date.getMonth() + 1).padStart(2, '0')
  const nam = date.getFullYear()
  
  return `${gio}:${phut} - ${ngay}/${thang}/${nam}`
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
    console.error('Gửi email thông báo trả phòng thất bại: khách hàng chưa có email.')
    return false
  }

  const domainHopLe = await kiemTraDomainNhanMail(email)

  if (!domainHopLe) {
    console.error(`Gửi email thông báo trả phòng thất bại: domain của "${email}" không hợp lệ.`)
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
      // Đổi tiêu đề cho phù hợp
      subject: `Thông báo trả phòng - Hồ sơ ${maTP}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px;">
          <h2 style="color: #3b4f27;">🏠 Thông báo trả phòng</h2>

          <p>Chào <strong>${tenKhachHang || ''}</strong>,</p>

          <p>
            Hệ thống đã ghi nhận yêu cầu trả phòng của bạn cho hồ sơ
            <strong>${maTP || ''}</strong>.
          </p>

          <p>
            Phòng/Giường:
            <strong>${phongGiuong || ''}</strong>
          </p>

          <p>
            Thời gian trả phòng dự kiến:
            <strong style="color: #d9534f;">${formatNgayGio(tgHen)}</strong>
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />

          <p style="color: #999; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} Homestay Dorm System
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