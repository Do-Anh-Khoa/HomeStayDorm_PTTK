// GuiMailLichHen — tương ứng lớp GuiEmail trong class diagram Ghi nhận lịch xem phòng.
// GuiEmailXacNhan(lichHen): boolean
import nodemailer from 'nodemailer'
import dns from 'dns'

const formatNgayGio = (d) =>
  d
    ? new Date(d).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : ''

// Dùng resolver riêng trỏ thẳng tới DNS công khai (Google / Cloudflare) thay vì
// DNS mặc định của hệ thống. Một số mạng (Wi-Fi trường học/ký túc xá, mạng
// công ty, một số modem ISP ở VN) chặn hoặc bóp nghẹt truy vấn DNS thô qua
// UDP:53 mà Node's dns.resolveMx() dùng — trong khi trình duyệt vẫn vào mạng
// bình thường vì nó dùng cơ chế phân giải DNS khác của hệ điều hành. Trỏ
// thẳng tới 8.8.8.8 / 1.1.1.1 giúp giảm khả năng bị chặn kiểu này.
const resolver = new dns.promises.Resolver()
resolver.setServers(['8.8.8.8', '1.1.1.1'])

// Các nhà cung cấp email lớn, chắc chắn luôn có MX hợp lệ -> bỏ qua bước tra
// DNS cho nhanh và tránh false-negative khi mạng có vấn đề.
const DOMAIN_LUON_HOP_LE = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'msn.com'
])

/**
 * Kiểm tra domain của email có bản ghi MX hợp lệ hay không, TRƯỚC khi gọi
 * sendMail. Nguyên tắc "fail-open": chỉ trả về false (chặn gửi) khi CHẮC
 * CHẮN domain không tồn tại (ENOTFOUND) hoặc không có bản ghi MX nào
 * (ENODATA). Với các lỗi khác (timeout, DNS server bị mạng chặn...) —
 * không đủ căn cứ để khẳng định domain sai — nên bỏ qua bước kiểm tra và
 * để chính lệnh sendMail của nodemailer là bên quyết định cuối cùng.
 */
async function kiemTraDomainNhanMail(email) {
  const domain = String(email).split('@')[1]?.toLowerCase()
  if (!domain) return false

  if (DOMAIN_LUON_HOP_LE.has(domain)) return true

  try {
    const mxRecords = await resolver.resolveMx(domain)
    return mxRecords.some((mx) => mx.exchange && mx.exchange.trim() !== '')
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
      return false
    }
    console.warn(
      `Không thể tra MX cho domain "${domain}" (lỗi: ${err.code || err.message}). ` +
        'Bỏ qua bước kiểm tra domain, tiếp tục thử gửi mail.'
    )
    return true
  }
}

/**
 * lichHen: {
 *   email, tenKH, maDK, tgHen,
 *   tenNVSale?, sdtNVSale?  // nhân viên phụ trách để khách liên hệ đổi lịch
 * }
 */
export const guiEmailXacNhanLichHen = async (lichHen) => {
  const domainHopLe = await kiemTraDomainNhanMail(lichHen.email)
  if (!domainHopLe) {
    console.error(
      `Gửi email thất bại: domain của "${lichHen.email}" không tồn tại hoặc không nhận được mail.`
    )
    return false
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  })

  const lienHe = lichHen.tenNVSale
    ? `<strong>${lichHen.tenNVSale}</strong>${lichHen.sdtNVSale ? ` - ${lichHen.sdtNVSale}` : ''}`
    : 'nhân viên phụ trách'

  try {
    await transporter.sendMail({
      from: `"Homestay Dorm System" <${process.env.EMAIL_USER}>`,
      to: lichHen.email,
      subject: `Xác nhận lịch hẹn xem phòng - Hồ sơ ${lichHen.maDK}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px;">
          <h2 style="color: #3b4f27;">📅 Xác nhận lịch hẹn xem phòng</h2>
          <p>Chào <strong>${lichHen.tenKH || ''}</strong>,</p>
          <p>Hệ thống ghi nhận lịch hẹn xem phòng ứng với hồ sơ đăng ký
             <strong>${lichHen.maDK}</strong>.</p>
          <p>Thời gian hẹn:</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="font-size: 24px; font-weight: bold; color: #3b4f27;">${formatNgayGio(
              lichHen.tgHen
            )}</span>
          </div>
          <p>Vui lòng có mặt đúng giờ hẹn. Nếu cần thay đổi thời gian, vui lòng liên hệ
             nhân viên phụ trách: ${lienHe}.</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">© 2026 Homestay Dorm System</p>
        </div>
      `
    })
    return true
  } catch (err) {
    console.error('guiEmailXacNhanLichHen:', err?.message)
    return false
  }
}

export default { guiEmailXacNhanLichHen }