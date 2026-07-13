// GuiMailPTDC — tương ứng lớp GuiMailPTDC trong class diagram.
// GuiEmailYeuCauThanhToan(ptdc): boolean
import nodemailer from 'nodemailer'
import dns from 'dns/promises'

const formatTien = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'
const formatNgay = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '')

/**
 * Kiểm tra domain của email có bản ghi MX hợp lệ hay không, TRƯỚC khi gọi
 * sendMail. Lưu ý: một số nhà mạng ở VN trả DNS "wildcard" cho domain
 * không tồn tại (trả về 1 bản ghi MX với exchange rỗng thay vì báo lỗi
 * NXDOMAIN chuẩn) — nên phải lọc bỏ các bản ghi exchange rỗng, không chỉ
 * kiểm tra length > 0.
 */
async function kiemTraDomainNhanMail(email) {
  try {
    const domain = String(email).split('@')[1]
    if (!domain) return false
    const mxRecords = await dns.resolveMx(domain)
    return mxRecords.some((mx) => mx.exchange && mx.exchange.trim() !== '')
  } catch {
    return false
  }
}

export const guiEmailYeuCauThanhToan = async (ptdc) => {
  const domainHopLe = await kiemTraDomainNhanMail(ptdc.email)
  if (!domainHopLe) {
    console.error(`Gửi email thất bại: domain của "${ptdc.email}" không tồn tại hoặc không nhận được mail.`)
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
      to: ptdc.email,
      subject: `Yêu cầu thanh toán tiền cọc - Phiếu thu ${ptdc.maPTDC}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px;">
          <h2 style="color: #3b4f27;">💰 Yêu cầu thanh toán tiền cọc</h2>
          <p>Chào <strong>${ptdc.tenKH || ''}</strong>,</p>
          <p>Hệ thống ghi nhận phiếu thu đặt cọc <strong>${ptdc.maPTDC}</strong> ứng với phiếu đặt cọc
             <strong>${ptdc.maPDC}</strong>, lập ngày ${formatNgay(ptdc.ngay)}.</p>
          <p>Số tiền cọc cần thanh toán:</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="font-size: 24px; font-weight: bold; color: #c0392b;">${formatTien(ptdc.tongTien)}</span>
          </div>
          <p>Vui lòng chuyển khoản theo cú pháp: <strong>HSD ${ptdc.maPTDC} &lt;Số điện thoại&gt;</strong>.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">© 2026 Homestay Dorm System</p>
        </div>
      `,
    })
    return true
  } catch (err) {
    console.error('guiEmailYeuCauThanhToan:', err?.message)
    return false
  }
}

export default { guiEmailYeuCauThanhToan }