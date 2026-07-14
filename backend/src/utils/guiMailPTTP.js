import nodemailer from 'nodemailer'
import dns from 'dns/promises'

const formatTien = n => Number(n || 0).toLocaleString('vi-VN') + 'đ'
const formatNgay = d => (d ? new Date(d).toLocaleDateString('vi-VN') : '')

async function kiemTraDomainNhanMail(email) {
  try {
    const domain = String(email || '').split('@')[1]
    if (!domain) return false

    const mxRecords = await dns.resolveMx(domain)

    return mxRecords.some(mx => mx.exchange && mx.exchange.trim() !== '')
  } catch {
    return false
  }
}

export const guiEmailPTTraPhong = async pttp => {
  const email = pttp.email || pttp.email_khach_hang

  if (!email) {
    console.error('Gửi email PTTP thất bại: khách hàng chưa có email.')
    return false
  }

  const domainHopLe = await kiemTraDomainNhanMail(email)

  if (!domainHopLe) {
    console.error(`Gửi email PTTP thất bại: domain của "${email}" không hợp lệ.`)
    return false
  }

  const maPttp = pttp.maPTTP || pttp.ma_pttp || ''
  const maTp = pttp.maTP || pttp.ma_tp || ''
  const maPhong = pttp.maPhong || pttp.ma_phong || ''
  const tenKhachHang = pttp.tenKH || pttp.ten_khach_hang || ''
  const sdt = pttp.sdt || pttp.so_dien_thoai || pttp.phone || ''
  const cccd = pttp.cccd || ''
  const maKhachThue = pttp.maKH || pttp.ma_khach_thue || pttp.ma_kh || ''

  const tongTien = Number(pttp.tongTien ?? pttp.tong_tien ?? 0)
  const tienHienThi = Math.abs(tongTien)

  const laHoanTien = tongTien >= 0

  const tieuDeKetQua = laHoanTien
    ? 'Số tiền hoàn lại cho khách'
    : 'Số tiền khách cần thanh toán thêm'

  const mauTien = laHoanTien ? '#188642' : '#c0392b'

  const thongTinCuPhap = sdt || cccd || maKhachThue
  const cuPhapChuyenKhoan = ['HSD', maPttp, thongTinCuPhap]
    .filter(Boolean)
    .join(' ')

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
      subject: `Thông báo quyết toán trả phòng - Phiếu thu ${maPttp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px;">
          <h2 style="color: #3b4f27;">🏠 Thông báo quyết toán trả phòng</h2>

          <p>Chào <strong>${tenKhachHang}</strong>,</p>

          <p>
            Hệ thống đã lập phiếu thu trả phòng
            <strong>${maPttp}</strong>
            cho hồ sơ trả phòng
            <strong>${maTp}</strong>.
          </p>

          <p>
            Mã phòng:
            <strong>${maPhong}</strong>
          </p>

          <p>
            Ngày lập phiếu:
            <strong>${formatNgay(pttp.ngay)}</strong>
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />

          <p>Thông tin quyết toán:</p>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0;">Tiền hoàn cọc</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">
                ${formatTien(pttp.tienHoanCoc ?? pttp.tien_hoan_coc)}
              </td>
            </tr>

            <tr>
              <td style="padding: 8px 0;">Tổng khấu trừ</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #c0392b;">
                ${formatTien(pttp.tienKhauTru ?? pttp.tien_khau_tru)}
              </td>
            </tr>
          </table>

          <div style="text-align: center; margin: 24px 0; padding: 16px; background: #f7f8f6; border-radius: 10px;">
            <p style="margin: 0 0 8px; color: #555;">${tieuDeKetQua}</p>
            <span style="font-size: 26px; font-weight: bold; color: ${mauTien};">
              ${formatTien(tienHienThi)}
            </span>
          </div>

          ${
            laHoanTien
              ? `
                <p>
                  Nhân viên kế toán sẽ thực hiện hoàn tiền theo quy trình của ký túc xá.
                </p>
              `
              : `
                <p style="margin: 24px 0 8px;">
                  Vui lòng chuyển khoản số tiền cần thanh toán theo cú pháp:
                </p>

                <div style="
                  margin: 14px 0 22px;
                  padding: 14px 18px;
                  border-radius: 10px;
                  background: #eef6ec;
                  color: #38502b;
                  font-size: 18px;
                  font-weight: 800;
                  text-align: center;
                ">
                  ${cuPhapChuyenKhoan}
                </div>
              `
          }

          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />

          <p style="color: #999; font-size: 12px; text-align: center;">
            © 2026 Homestay Dorm System
          </p>
        </div>
      `,
    })

    return true
  } catch (err) {
    console.error('guiEmailPTTraPhong:', err?.message)
    return false
  }
}

export default { guiEmailPTTraPhong }