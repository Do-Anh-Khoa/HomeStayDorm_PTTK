// backend/src/utils/guiMailPhieuThuBT.js
import nodemailer from 'nodemailer'

/**
 * GuiMailPhieuThuBT — tương ứng lớp GuiMailPhieuThuBT trong class diagram.
 * GuiEmailThongBaoDongPhat(ptbt): boolean
 *
 * Viết cùng style với sendResetPasswordEmail bạn đã có sẵn.
 */
export const guiEmailThongBaoDongPhat = async (ptbt) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  const soTienFormat = Number(ptbt.tongTien).toLocaleString('vi-VN') + 'đ'
  const ngayLap = new Date(ptbt.ngay).toLocaleDateString('vi-VN')

  try {
    await transporter.sendMail({
      from: `"Homestay Dorm System" <${process.env.EMAIL_USER}>`,
      to: ptbt.emailKH,
      subject: `Thông báo đóng phạt bồi thường - Phiếu thu ${ptbt.maPTDB}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px;">
          <h2 style="color: #3b4f27;">⚠️ Thông báo đóng phạt bồi thường</h2>
          <p>Xin chào <strong>${ptbt.tenKH || ''}</strong>,</p>
          <p>Bạn đã làm mất <strong>${ptbt.tenVD || 'vật dụng'}</strong> (vi phạm lần thứ ${ptbt.soLanViPham || ''})
             theo biên bản <strong>${ptbt.maBT}</strong> lập ngày ${new Date(ptbt.ngayBT).toLocaleDateString('vi-VN')}.</p>
          <p>Hệ thống đã lập phiếu thu bồi thường số <strong>${ptbt.maPTDB}</strong> ngày ${ngayLap}
             với số tiền cần thanh toán:</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="font-size: 24px; font-weight: bold; color: #c0392b;">${soTienFormat}</span>
          </div>
          <p>Vui lòng thanh toán trong vòng 7 ngày kể từ ngày lập phiếu theo quy định của ký túc xá.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">© 2026 Homestay Dorm System</p>
        </div>
      `,
    })
    return true
  } catch (err) {
    console.error('Gửi email thông báo đóng phạt thất bại:', err?.message)
    return false
  }
}

export default { guiEmailThongBaoDongPhat }