// utils/guiMailPTHD.js
import nodemailer from 'nodemailer'
import dns from 'dns'

const formatTien = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'
const formatNgay = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '')

// 1. Dùng DNS của Google/Cloudflare để chống bị nhà mạng bóp băng thông
const resolver = new dns.promises.Resolver()
resolver.setServers(['8.8.8.8', '1.1.1.1'])

// 2. Danh sách các đuôi email "VIP" không cần kiểm tra DNS
const DOMAIN_LUON_HOP_LE = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'outlook.com',
  'hotmail.com', 'live.com', 'icloud.com', 'msn.com'
])

async function kiemTraDomainNhanMail(email) {
  const domain = String(email).split('@')[1]?.toLowerCase()
  if (!domain) return false

  // Nếu là Gmail thì auto cho qua luôn, không cần hỏi mạng!
  if (DOMAIN_LUON_HOP_LE.has(domain)) return true

  try {
    const mxRecords = await resolver.resolveMx(domain)
    return mxRecords.some((mx) => mx.exchange && mx.exchange.trim() !== '')
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
      return false
    }
    // Nếu mạng lỗi, vẫn châm chước cho qua để nodemailer tự xử lý
    console.warn(`Bỏ qua lỗi DNS cho domain "${domain}", tiếp tục gửi mail.`)
    return true
  }
}

export const guiEmailYeuCauThanhToanHopDong = async (pthd) => {
  const emailNhan = String(pthd.emailKH || pthd.email || '').trim()
  console.log(`[Hệ thống] Đang chuẩn bị gửi mail PTHD đến: "${emailNhan}"`)

  if (!emailNhan || emailNhan === 'undefined') {
    console.error('Gửi email thất bại: Dữ liệu khách hàng không có email.')
    return false
  }

  const domainHopLe = await kiemTraDomainNhanMail(emailNhan)
  if (!domainHopLe) {
    console.error(`Gửi email thất bại: Tên miền của "${emailNhan}" không tồn tại.`)
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
      to: emailNhan,
      subject: `Yêu cầu thanh toán tiền thuê kỳ ${pthd.kyHienTai || ''} - Phiếu thu ${pthd.maPTHD}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px;">
          <h2 style="color: #3b4f27;">🏠 Yêu cầu thanh toán tiền thuê phòng</h2>
          <p>Chào <strong>${pthd.tenKH || ''}</strong>,</p>
          <p>Hệ thống ghi nhận phiếu thu hợp đồng <strong>${pthd.maPTHD}</strong> ứng với hợp đồng thuê
             <strong>${pthd.maHDT}</strong>, kỳ thu thứ <strong>${pthd.kyHienTai || ''}</strong>, lập ngày ${formatNgay(pthd.ngay)}.</p>
          <p>Số tiền thuê kỳ này cần thanh toán:</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="font-size: 24px; font-weight: bold; color: #c0392b;">${formatTien(pthd.tongTien)}</span>
          </div>
          <p>Vui lòng chuyển khoản theo cú pháp:
             <strong>HSD ${pthd.maPTHD} ${pthd.sdt}</strong> trong vòng 7 ngày kể từ ngày lập phiếu.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">© 2026 Homestay Dorm System</p>
        </div>
      `,
    })
    console.log(`[Hệ thống] Gửi mail thành công đến: ${emailNhan}`)
    return true
  } catch (err) {
    console.error('Lỗi khi gửi mail PTHD:', err?.message)
    return false
  }
}

export default { guiEmailYeuCauThanhToanHopDong }