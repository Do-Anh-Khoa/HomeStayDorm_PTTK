import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FONT_REGULAR = path.join(__dirname, '../assets/fonts/Roboto-Regular.ttf')
const FONT_BOLD = path.join(__dirname, '../assets/fonts/Roboto-Bold.ttf')

const formatMoney = (n) => Number(n || 0).toLocaleString('vi-VN') + ' đ'
const formatDateTime = (d) => {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

export const inPhieuDatCoc = (pdc) => {
  return new Promise((resolve, reject) => {
    const outDir = path.join(__dirname, '../../storage/phieu-dat-coc')
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
    const filePath = path.join(outDir, `${pdc.maPDC}.pdf`)

    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const stream = fs.createWriteStream(filePath)
    doc.pipe(stream)

    doc.registerFont('Regular', FONT_REGULAR)
    doc.registerFont('Bold', FONT_BOLD)

    doc.fillColor('#3B4F27').font('Bold').fontSize(22).text('PHIẾU ĐẶT CỌC', { align: 'center' })
    doc.moveDown(2)

    const drawSection = (title, items) => {

      doc.x = 50
      doc.fillColor('#111827').font('Bold').fontSize(13).text(title, 50, doc.y)
      doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).strokeColor('#E5E7EB').lineWidth(1).stroke()
      doc.moveDown(1)
      
      let currentY = doc.y
      items.forEach((item, index) => {
        if (index % 2 === 0) {
          doc.fillColor('#6B7280').font('Bold').fontSize(9).text(item.label.toUpperCase(), 50, currentY)
          doc.fillColor('#111827').font('Regular').fontSize(11).text(item.value, 50, currentY + 14)
        } else {
          doc.fillColor('#6B7280').font('Bold').fontSize(9).text(item.label.toUpperCase(), 300, currentY)
          doc.fillColor('#111827').font('Regular').fontSize(11).text(item.value, 300, currentY + 14)
          currentY += 40
        }
      })
      if (items.length % 2 !== 0) currentY += 40
      doc.y = currentY + 10
    }

    const hanTT = pdc.ngayDC ? formatDateTime(new Date(new Date(pdc.ngayDC).getTime() + 86400000)) : ''

    drawSection('1. Thông tin chung', [
      { label: 'Mã phiếu', value: pdc.maPDC || '' },
      { label: 'Ngày lập', value: formatDateTime(pdc.ngayDC) },
      { label: 'Nhân viên tạo phiếu', value: pdc.tenNVSale || 'Chưa cập nhật' }
    ])

    drawSection('2. Thông tin khách hàng', [
      { label: 'Tên khách hàng', value: pdc.tenKH || '' },
      { label: 'Số điện thoại', value: pdc.sdt || '' },
      { label: 'CCCD/CMND', value: pdc.cccd || '' },
      { label: 'Email', value: pdc.emailKH || 'Không có' }
    ])

    drawSection('3. Thông tin Phòng/Giường', [
      { label: 'Cơ sở', value: pdc.coSo || 'Chưa cập nhật' },
      { label: 'Phòng', value: pdc.phong || '' },
      { label: 'Giường', value: pdc.giuong || '' }
    ])

    drawSection('4. Thông tin thanh toán', [
      { label: 'Số tiền cần thanh toán', value: formatMoney(pdc.soTien) },
      { label: 'Hình thức', value: 'Chuyển khoản' },
      { label: 'Hạn thanh toán', value: hanTT }
    ])

    doc.end()
    stream.on('finish', () => resolve(filePath))
    stream.on('error', (err) => reject(err))
  })
}