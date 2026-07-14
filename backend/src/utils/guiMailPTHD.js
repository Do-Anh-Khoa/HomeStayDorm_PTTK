// utils/guiMailPTHD.js
//
// GuiMailPTHD — tương ứng GuiMailPTDC nhưng cho phiếu thu hợp đồng.
// GuiEmailYeuCauThanhToanHopDong(pthd): boolean

import nodemailer from 'nodemailer'
import dns from 'dns/promises'

const formatTien = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'
const formatNgay = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '')

/**
 * Kiểm tra domain của email có bản ghi MX hợp lệ hay không, TRƯỚC khi gọi
 * sendMail (giống hệt guiMailPTDC.js — lọc bỏ MX rỗng do wildcard DNS).
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

export const guiEmailYeuCauThanhToanHopDong = async (pthd) => {
  const domainHopLe = await kiemTraDomainNhanMail(pthd.emailKH)
  if (!domainHopLe) {
    console.error(`Gửi email thất bại: domain của "${pthd.emailKH}" không tồn tại hoặc không nhận được mail.`)
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
      to: pthd.emailKH,
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
             <strong>HSD ${pthd.maPTHD} ${pthd.sdt}</strong>.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">© 2026 Homestay Dorm System</p>
        </div>
      `,
    })
    return true
  } catch (err) {
    console.error('guiEmailYeuCauThanhToanHopDong:', err?.message)
    return false
  }
}

export default { guiEmailYeuCauThanhToanHopDong }