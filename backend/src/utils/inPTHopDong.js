// utils/inPTHopDong.js
//
// InPTHopDong — tương ứng InPTDatCoc nhưng cho phiếu thu hợp đồng.
// InPhieuThu(pthd, dsGiuong): Promise<string> — xuất PDF, trả về đường dẫn file.

import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const FONT_REGULAR = path.join(__dirname, '../assets/fonts/Roboto-Regular.ttf')
const FONT_BOLD = path.join(__dirname, '../assets/fonts/Roboto-Bold.ttf')

const formatTien = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'
const formatNgay = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '')

const isSnapshotNote = (ghiChu) => {
  if (!ghiChu) return false

  try {
    const parsed = JSON.parse(ghiChu)
    return parsed?.__snapshot === 'PTHD'
  } catch {
    return false
  }
}

export const inPTHopDong = (pthd) => {
  return new Promise((resolve, reject) => {
    try {
      const outDir = path.join(__dirname, '../../storage/phieu-thu-hop-dong')
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
      const filePath = path.join(outDir, `${pthd.maPTHD}.pdf`)

      const doc = new PDFDocument({ size: 'A5', margin: 40 })
      const stream = fs.createWriteStream(filePath)
      doc.pipe(stream)

      const hasFont = fs.existsSync(FONT_REGULAR) && fs.existsSync(FONT_BOLD)
      if (hasFont) {
        doc.registerFont('Regular', FONT_REGULAR)
        doc.registerFont('Bold', FONT_BOLD)
      }
      const F = (bold) => (hasFont ? (bold ? 'Bold' : 'Regular') : 'Helvetica')

      doc.font(F(true)).fontSize(16).text('PHIẾU THU HỢP ĐỒNG', { align: 'center' })
      doc.font(F(false)).fontSize(10).text(`Mã phiếu thu: ${pthd.maPTHD}`, { align: 'center' })
      doc.moveDown(1.5)

      doc.font(F(true)).fontSize(11).text('Thông tin khách hàng & hợp đồng')
      doc.moveTo(doc.x, doc.y + 2).lineTo(doc.page.width - 40, doc.y + 2).stroke()
      doc.moveDown(0.5)
      doc.font(F(false)).fontSize(10)
      doc.text(`Đại diện thuê: ${pthd.tenKH || ''}`)
      doc.text(`CCCD: ${pthd.cccd || ''}`)
      doc.text(`SĐT: ${pthd.sdt || ''}`)
      doc.text(`Mã hợp đồng: ${pthd.maHDT}`)
      doc.text(`Ngày vào ở: ${formatNgay(pthd.tgVao)}`)
      doc.text(`Kỳ thanh toán: ${pthd.kyTT} Tháng/Lần`)
      if (pthd.kyHienTai) doc.text(`Kỳ đang thu: Kỳ ${pthd.kyHienTai}`)
      doc.text(`NV phụ trách: ${pthd.tenNVPhuTrach || ''}`)
      doc.moveDown(1)

      doc.font(F(true)).fontSize(11).text('Chi tiết giường thuê & tính toán')
      doc.moveTo(doc.x, doc.y + 2).lineTo(doc.page.width - 40, doc.y + 2).stroke()
      doc.moveDown(0.5)
      doc.font(F(false)).fontSize(10)
      ;(pthd.dsGiuong || []).forEach((g) => {
        const soThang = g.soThangThu != null ? `x${g.soThangThu}` : `x${pthd.kyTT}`
        doc.text(
          `${g.maGiuong} - ${g.maPhong} (${g.tenLoai}): ${formatTien(g.giaGiuong)} ${soThang} = ${formatTien(g.thanhTien)}`
        )
      })
      doc.moveDown(0.5)
      doc.font(F(true)).fontSize(13).fillColor('#c0392b')
        .text(`TỔNG TIỀN CẦN THU: ${formatTien(pthd.tongTien)}`)
      doc.fillColor('black')
      doc.moveDown(1)

      doc.font(F(true)).fontSize(11).text('Thông tin chứng từ')
      doc.moveTo(doc.x, doc.y + 2).lineTo(doc.page.width - 40, doc.y + 2).stroke()
      doc.moveDown(0.5)
      doc.font(F(false)).fontSize(10)
      doc.text(`Nhân viên kế toán: ${pthd.tenNVKeToan || ''}`)
      doc.text(`Ngày lập phiếu: ${formatNgay(pthd.ngay)}`)
      doc.text(`Trạng thái: ${pthd.trangThai || ''}`)
      if (pthd.ghiChu && !isSnapshotNote(pthd.ghiChu)) doc.text(`Ghi chú: ${pthd.ghiChu}`)

      doc.end()

      stream.on('finish', () => resolve(filePath))
      stream.on('error', reject)
    } catch (err) {
      reject(err)
    }
  })
}

export default { inPTHopDong }