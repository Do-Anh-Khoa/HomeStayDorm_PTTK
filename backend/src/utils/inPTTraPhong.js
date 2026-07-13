import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const FONT_REGULAR = path.join(__dirname, '../assets/fonts/Roboto-Regular.ttf')
const FONT_BOLD = path.join(__dirname, '../assets/fonts/Roboto-Bold.ttf')

const formatTien = n => Number(n || 0).toLocaleString('vi-VN') + 'đ'
const formatNgay = d => (d ? new Date(d).toLocaleDateString('vi-VN') : '')

const getValue = (obj, ...keys) => {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null) return obj[key]
  }

  return ''
}

export const inPTTraPhong = pttp => {
  return new Promise((resolve, reject) => {
    try {
      const maPTTP = getValue(pttp, 'maPTTP', 'ma_pttp')
      const maTP = getValue(pttp, 'maTP', 'ma_tp')
      const tenKH = getValue(pttp, 'tenKH', 'ten_khach_hang')
      const maPhong = getValue(pttp, 'maPhong', 'ma_phong')
      const thamChieu = getValue(pttp, 'thamChieu', 'tham_chieu')
      const ngay = getValue(pttp, 'ngay')
      const cccd = getValue(pttp, 'cccd')
      const sdt = getValue(pttp, 'sdt')

      const tienHoanCoc = Number(getValue(pttp, 'tienHoanCoc', 'tien_hoan_coc') || 0)
      const tienKhauTru = Number(getValue(pttp, 'tienKhauTru', 'tien_khau_tru') || 0)
      const tongTien = Number(getValue(pttp, 'tongTien', 'tong_tien') || 0)

      const vatDungHuHai = getValue(pttp, 'vatDungHuHai', 'vat_dung_hu_hai') || []
      const dichVu = getValue(pttp, 'dichVu', 'dich_vu') || []

      const outDir = path.join(__dirname, '../../storage/phieu-thu-tra-phong')

      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true })
      }

      const filePath = path.join(outDir, `${maPTTP}.pdf`)

      const doc = new PDFDocument({
        size: 'A5',
        margin: 40,
      })

      const stream = fs.createWriteStream(filePath)
      doc.pipe(stream)

      const hasFont = fs.existsSync(FONT_REGULAR) && fs.existsSync(FONT_BOLD)

      if (hasFont) {
        doc.registerFont('Regular', FONT_REGULAR)
        doc.registerFont('Bold', FONT_BOLD)
      }

      const F = bold => (hasFont ? (bold ? 'Bold' : 'Regular') : 'Helvetica')

      doc.font(F(true)).fontSize(16).text('PHIẾU THU TRẢ PHÒNG', {
        align: 'center',
      })

      doc.font(F(false)).fontSize(10).text(`Mã phiếu thu: ${maPTTP}`, {
        align: 'center',
      })

      doc.moveDown(1.3)

      doc.font(F(true)).fontSize(11).text('Thông tin khách hàng & hồ sơ')
      doc.moveTo(doc.x, doc.y + 2).lineTo(doc.page.width - 40, doc.y + 2).stroke()
      doc.moveDown(0.5)

      doc.font(F(false)).fontSize(10)
      doc.text(`Họ tên: ${tenKH}`)
      doc.text(`CCCD: ${cccd}`)
      doc.text(`SĐT: ${sdt}`)
      doc.text(`Mã hồ sơ trả phòng: ${maTP}`)
      doc.text(`Mã phòng: ${maPhong}`)
      doc.text(`Tham chiếu: ${thamChieu}`)
      doc.text(`Ngày lập phiếu: ${formatNgay(ngay)}`)

      doc.moveDown(1)

      doc.font(F(true)).fontSize(11).text('Vật dụng hư hại')
      doc.moveTo(doc.x, doc.y + 2).lineTo(doc.page.width - 40, doc.y + 2).stroke()
      doc.moveDown(0.5)

      doc.font(F(false)).fontSize(9)

      if (vatDungHuHai.length === 0) {
        doc.text('Không có vật dụng hư hại.')
      } else {
        vatDungHuHai.forEach(item => {
          doc.text(
            `${item.ten || item.ten_vd}: ${item.so_luong || 0} x ${formatTien(
              item.don_gia,
            )} = ${formatTien(item.thanh_tien)}`,
          )
        })
      }

      doc.moveDown(1)

      doc.font(F(true)).fontSize(11).text('Dịch vụ tháng cuối')
      doc.moveTo(doc.x, doc.y + 2).lineTo(doc.page.width - 40, doc.y + 2).stroke()
      doc.moveDown(0.5)

      doc.font(F(false)).fontSize(9)

      if (dichVu.length === 0) {
        doc.text('Không có dịch vụ tháng cuối cần quyết toán.')
      } else {
        dichVu.forEach(item => {
          doc.text(
            `${item.ten || item.ten_dv}: ${item.so_luong || 0} x ${formatTien(
              item.don_gia,
            )} = ${formatTien(item.thanh_tien)}`,
          )
        })
      }

      doc.moveDown(1)

      doc.font(F(true)).fontSize(11).text('Tổng kết quyết toán')
      doc.moveTo(doc.x, doc.y + 2).lineTo(doc.page.width - 40, doc.y + 2).stroke()
      doc.moveDown(0.5)

      doc.font(F(false)).fontSize(10)
      doc.text(`Tiền hoàn cọc: ${formatTien(tienHoanCoc)}`)
      doc.text(`Tổng khấu trừ: ${formatTien(tienKhauTru)}`)

      doc.moveDown(0.6)

      if (tongTien >= 0) {
        doc.font(F(true)).fontSize(13).fillColor('#188642')
          .text(`SỐ TIỀN HOÀN TRẢ KHÁCH: ${formatTien(tongTien)}`)
      } else {
        doc.font(F(true)).fontSize(13).fillColor('#c0392b')
          .text(`SỐ TIỀN KHÁCH CẦN THANH TOÁN: ${formatTien(Math.abs(tongTien))}`)
      }

      doc.fillColor('black')
      doc.moveDown(1)

      doc.font(F(false)).fontSize(9)
      doc.text('Nhân viên kế toán', 60, doc.y + 20)
      doc.text('Khách hàng', doc.page.width - 150, doc.y, {
        align: 'center',
      })

      doc.end()

      stream.on('finish', () => resolve(filePath))
      stream.on('error', reject)
    } catch (err) {
      reject(err)
    }
  })
}

export default { inPTTraPhong }