// backend/src/utils/inPTBoiThuong.js
// Cần cài: npm install pdfkit --save (trong thư mục backend)
import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// QUAN TRỌNG: font mặc định của pdfkit KHÔNG hỗ trợ dấu tiếng Việt.
// Bạn cần tải 1 font Unicode (khuyến nghị Roboto hoặc Be Vietnam Pro dạng .ttf)
// và đặt vào: backend/src/assets/fonts/Roboto-Regular.ttf
//                                       /Roboto-Bold.ttf
const FONT_REGULAR = path.join(__dirname, '../assets/fonts/Roboto-Regular.ttf')
const FONT_BOLD = path.join(__dirname, '../assets/fonts/Roboto-Bold.ttf')

const formatTien = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'
const formatNgay = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '')

/**
 * InPTBoiThuong — tương ứng lớp InPTBoiThuong trong class diagram.
 * InPTBT(ptdb): boolean — xuất file PDF, trả về đường dẫn file đã tạo.
 */
export const inPTBT = (ptbt) => {
  return new Promise((resolve, reject) => {
    try {
      const outDir = path.join(__dirname, '../../storage/phieu-thu-boi-thuong')
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
      const filePath = path.join(outDir, `${ptbt.maPTDB}.pdf`)

      const doc = new PDFDocument({ size: 'A5', margin: 40 })
      const stream = fs.createWriteStream(filePath)
      doc.pipe(stream)

      const hasFont = fs.existsSync(FONT_REGULAR) && fs.existsSync(FONT_BOLD)
      if (hasFont) {
        doc.registerFont('Regular', FONT_REGULAR)
        doc.registerFont('Bold', FONT_BOLD)
      }
      const F = (bold) => (hasFont ? (bold ? 'Bold' : 'Regular') : 'Helvetica')

      doc.font(F(true)).fontSize(16).text('PHIẾU THU BỒI THƯỜNG', { align: 'center' })
      doc.font(F(false)).fontSize(10).text(`Mã phiếu thu: ${ptbt.maPTDB}`, { align: 'center' })
      doc.moveDown(1.5)

      doc.font(F(true)).fontSize(11).text('Thông tin khách hàng & biên bản')
      doc.moveTo(doc.x, doc.y + 2).lineTo(doc.page.width - 40, doc.y + 2).stroke()
      doc.moveDown(0.5)
      doc.font(F(false)).fontSize(10)
      doc.text(`Khách hàng: ${ptbt.tenKH || ''}`)
      doc.text(`CCCD: ${ptbt.cccd || ''}`)
      doc.text(`SĐT: ${ptbt.sdt || ''}`)
      doc.text(`Mã biên bản: ${ptbt.maBT}`)
      doc.text(`Ngày lập biên bản: ${formatNgay(ptbt.ngayBT)}`)
      doc.moveDown(1)

      doc.font(F(true)).fontSize(11).text('Chi tiết vi phạm & mức phạt')
      doc.moveTo(doc.x, doc.y + 2).lineTo(doc.page.width - 40, doc.y + 2).stroke()
      doc.moveDown(0.5)
      doc.font(F(false)).fontSize(10)
      doc.text(`Lý do vi phạm: Mất ${ptbt.tenVD || ''}`)
      doc.text(`Số lần vi phạm : Lần ${ptbt.soLanViPham || ''}`)
      doc.text(`Đơn giá áp dụng: ${formatTien(ptbt.giaBoiThuong)}`)
      doc.moveDown(0.5)
      doc.font(F(true)).fontSize(13).fillColor('#c0392b')
        .text(`TỔNG TIỀN PHẠT: ${formatTien(ptbt.tongTien)}`)
      doc.fillColor('black')
      doc.moveDown(1)

      doc.font(F(true)).fontSize(11).text('Thông tin chứng từ')
      doc.moveTo(doc.x, doc.y + 2).lineTo(doc.page.width - 40, doc.y + 2).stroke()
      doc.moveDown(0.5)
      doc.font(F(false)).fontSize(10)
      doc.text(`Nhân viên kế toán: ${ptbt.tenNVKeToan || ptbt.nvKeToan || ''}`)
      doc.text(`Ngày lập phiếu: ${formatNgay(ptbt.ngay)}`)
      doc.text(`Trạng thái: ${ptbt.trangThai || ''}`)

      doc.end()

      stream.on('finish', () => resolve(filePath))
      stream.on('error', reject)
    } catch (err) {
      reject(err)
    }
  })
}

export default { inPTBT }