// InPTDacCoc — tương ứng lớp InPTDacCoc trong class diagram.
// InPhieuThu(ptdc): boolean — xuất PDF, trả về đường dẫn file.
import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const FONT_REGULAR = path.join(__dirname, '../assets/fonts/Roboto-Regular.ttf')
const FONT_BOLD = path.join(__dirname, '../assets/fonts/Roboto-Bold.ttf')

const formatTien = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'
const formatNgay = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '')

export const inPTDatCoc = (ptdc) => {
  return new Promise((resolve, reject) => {
    try {
      const outDir = path.join(__dirname, '../../storage/phieu-thu-dat-coc')
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
      const filePath = path.join(outDir, `${ptdc.maPTDC}.pdf`)

      const doc = new PDFDocument({ size: 'A5', margin: 40 })
      const stream = fs.createWriteStream(filePath)
      doc.pipe(stream)

      const hasFont = fs.existsSync(FONT_REGULAR) && fs.existsSync(FONT_BOLD)
      if (hasFont) {
        doc.registerFont('Regular', FONT_REGULAR)
        doc.registerFont('Bold', FONT_BOLD)
      }
      const F = (bold) => (hasFont ? (bold ? 'Bold' : 'Regular') : 'Helvetica')

      doc.font(F(true)).fontSize(16).text('PHIẾU THU ĐẶT CỌC', { align: 'center' })
      doc.font(F(false)).fontSize(10).text(`Mã phiếu thu: ${ptdc.maPTDC}`, { align: 'center' })
      doc.moveDown(1.5)

      doc.font(F(true)).fontSize(11).text('Thông tin khách hàng & đặt cọc')
      doc.moveTo(doc.x, doc.y + 2).lineTo(doc.page.width - 40, doc.y + 2).stroke()
      doc.moveDown(0.5)
      doc.font(F(false)).fontSize(10)
      doc.text(`Họ tên: ${ptdc.tenKH || ''}`)
      doc.text(`CCCD: ${ptdc.cccd || ''}`)
      doc.text(`SĐT: ${ptdc.sdt || ''}`)
      doc.text(`Mã đặt cọc: ${ptdc.maPDC}`)
      doc.text(`Ngày lập PDC: ${formatNgay(ptdc.ngayDC)}`)
      doc.text(`NV Sale: ${ptdc.tenNVSale || ''}`)
      doc.moveDown(1)

      doc.font(F(true)).fontSize(11).text('Chi tiết giường đã cọc & tính toán')
      doc.moveTo(doc.x, doc.y + 2).lineTo(doc.page.width - 40, doc.y + 2).stroke()
      doc.moveDown(0.5)
      doc.font(F(false)).fontSize(10)
      ;(ptdc.dsGiuong || []).forEach((g) => {
        doc.text(
          `${g.maPhong}-${g.maGiuong} (${g.tenLoai}): ${formatTien(g.giaGiuong)} x ${g.heSo} = ${formatTien(g.thanhTien)}`
        )
      })
      doc.moveDown(0.5)
      doc.font(F(true)).fontSize(13).fillColor('#c0392b')
        .text(`TỔNG TIỀN CỌC PHẢI THU: ${formatTien(ptdc.tongTien)}`)
      doc.fillColor('black')
      doc.moveDown(1)

      doc.font(F(true)).fontSize(11).text('Thông tin chứng từ')
      doc.moveTo(doc.x, doc.y + 2).lineTo(doc.page.width - 40, doc.y + 2).stroke()
      doc.moveDown(0.5)
      doc.font(F(false)).fontSize(10)
      doc.text(`Nhân viên kế toán: ${ptdc.tenNVKeToan || ''}`)
      doc.text(`Ngày lập phiếu: ${formatNgay(ptdc.ngay)}`)
      doc.text(`Trạng thái: ${ptdc.trangThai || ''}`)

      doc.end()

      stream.on('finish', () => resolve(filePath))
      stream.on('error', reject)
    } catch (err) {
      reject(err)
    }
  })
}

export default { inPTDatCoc }