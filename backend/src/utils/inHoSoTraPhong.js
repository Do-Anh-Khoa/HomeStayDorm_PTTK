import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const FONT_REGULAR = path.join(__dirname, '../assets/fonts/Roboto-Regular.ttf')
const FONT_BOLD = path.join(__dirname, '../assets/fonts/Roboto-Bold.ttf')

const PAGE_MARGIN = 48
const COLOR_TITLE = '#334b24'
const COLOR_TEXT = '#1f2937'
const COLOR_MUTED = '#6b7280'
const COLOR_BORDER = '#d9ddd2'
const COLOR_SOFT = '#f7f8f4'

function getValue(source, ...keys) {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null && source?.[key] !== '') {
      return source[key]
    }
  }
  return ''
}

function display(value) {
  return value === undefined || value === null || value === '' ? '--' : String(value)
}

function formatDate(value) {
  if (!value) return '--'

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-')
    return `${day}/${month}/${year}`
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return display(value)

  return date.toLocaleDateString('vi-VN')
}

function formatDateTime(value) {
  if (!value) return '--'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return display(value)

  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function drawHeader(doc, F, profileCode) {
  doc.font(F(true)).fontSize(12).fillColor(COLOR_TITLE)
  doc.text('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', PAGE_MARGIN, doc.y, {
    width: doc.page.width - PAGE_MARGIN * 2,
    align: 'center',
  })

  doc.moveDown(0.2)
  doc.font(F(true)).fontSize(11).fillColor(COLOR_TEXT)
  doc.text('Độc lập - Tự do - Hạnh phúc', PAGE_MARGIN, doc.y, {
    width: doc.page.width - PAGE_MARGIN * 2,
    align: 'center',
  })

  doc.moveDown(1.6)
  doc.font(F(true)).fontSize(24).fillColor(COLOR_TITLE)
  doc.text('HỒ SƠ TRẢ PHÒNG', PAGE_MARGIN, doc.y, {
    width: doc.page.width - PAGE_MARGIN * 2,
    align: 'center',
  })

  doc.moveDown(0.35)
  doc.font(F(true)).fontSize(11).fillColor(COLOR_MUTED)
  doc.text(`Mã hồ sơ: ${display(profileCode)}`, PAGE_MARGIN, doc.y, {
    width: doc.page.width - PAGE_MARGIN * 2,
    align: 'center',
  })

  doc.moveDown(1.6)
}

function drawMeta(doc, F, rows) {
  const x = PAGE_MARGIN
  const y = doc.y
  const width = doc.page.width - PAGE_MARGIN * 2
  const height = 56
  const columnWidth = width / 2

  doc.save()
  doc.roundedRect(x, y, width, height, 5).fillAndStroke(COLOR_SOFT, COLOR_BORDER)

  doc.font(F(false)).fontSize(9).fillColor(COLOR_MUTED)
  doc.text(rows[0].label, x + 12, y + 10, { width: columnWidth - 24 })
  doc.text(rows[1].label, x + columnWidth + 12, y + 10, { width: columnWidth - 24 })

  doc.font(F(true)).fontSize(10).fillColor(COLOR_TEXT)
  doc.text(rows[0].value, x + 12, y + 30, { width: columnWidth - 24 })
  doc.text(rows[1].value, x + columnWidth + 12, y + 30, { width: columnWidth - 24 })
  doc.restore()

  doc.y = y + height + 10
}

function drawSectionTitle(doc, F, title) {
  if (doc.y + 30 > doc.page.height - PAGE_MARGIN) {
    doc.addPage()
  }

  doc.font(F(true)).fontSize(13).fillColor(COLOR_TITLE)
  doc.text(title, PAGE_MARGIN, doc.y)
  doc.moveTo(PAGE_MARGIN, doc.y + 4)
    .lineTo(doc.page.width - PAGE_MARGIN, doc.y + 4)
    .strokeColor(COLOR_BORDER)
    .lineWidth(1)
    .stroke()
  doc.moveDown(0.9)
}

function drawFieldGrid(doc, F, fields) {
  const gap = 14
  const x = PAGE_MARGIN
  const width = doc.page.width - PAGE_MARGIN * 2
  const columnWidth = (width - gap) / 2
  const rowHeight = 52

  for (let index = 0; index < fields.length; index += 2) {
    if (doc.y + rowHeight > doc.page.height - PAGE_MARGIN) {
      doc.addPage()
    }

    const y = doc.y
    const rowFields = fields.slice(index, index + 2)

    rowFields.forEach((field, columnIndex) => {
      const fieldX = x + columnIndex * (columnWidth + gap)
      doc.save()
      doc.roundedRect(fieldX, y, columnWidth, rowHeight, 5)
        .lineWidth(1)
        .strokeColor(COLOR_BORDER)
        .stroke()
      doc.font(F(true)).fontSize(8.5).fillColor(COLOR_MUTED)
      doc.text(String(field.label || '').toUpperCase(), fieldX + 11, y + 9, {
        width: columnWidth - 22,
      })
      doc.font(F(true)).fontSize(10.5).fillColor(COLOR_TEXT)
      doc.text(display(field.value), fieldX + 11, y + 25, {
        width: columnWidth - 22,
        lineGap: 1,
      })
      doc.restore()
    })

    doc.y = y + rowHeight + 10
  }

  doc.moveDown(0.7)
}

function drawNoteBox(doc, F) {
  const height = 74

  if (doc.y + height > doc.page.height - PAGE_MARGIN) {
    doc.addPage()
  }

  const x = PAGE_MARGIN
  const width = doc.page.width - PAGE_MARGIN * 2
  const y = doc.y

  doc.save()
  doc.roundedRect(x, y, width, height, 5)
    .dash(4, { space: 4 })
    .lineWidth(1)
    .strokeColor('#c7cebd')
    .stroke()
  doc.undash()
  doc.font(F(true)).fontSize(9).fillColor(COLOR_MUTED)
  doc.text('GHI CHÚ XỬ LÝ', x + 12, y + 10)
  doc.restore()

  doc.y = y + height + 28
}

function drawSignatures(doc, F, { customerName, employeeName }) {
  if (doc.y + 80 > doc.page.height - PAGE_MARGIN) {
    doc.addPage()
  }

  const leftX = PAGE_MARGIN
  const rightX = doc.page.width - PAGE_MARGIN
  const baseY = doc.y + 8

  doc.font(F(true)).fontSize(9).fillColor(COLOR_TEXT)
  doc.text('Nhân viên lập hồ sơ', leftX, baseY, { width: 160 })
  doc.text('Khách hàng', rightX - 120, baseY, { width: 120, align: 'center' })

  const signLineY = baseY + 20
  doc.moveTo(leftX, signLineY).lineTo(leftX + 180, signLineY).strokeColor(COLOR_BORDER).lineWidth(1).stroke()
  doc.moveTo(rightX - 180, signLineY).lineTo(rightX, signLineY).strokeColor(COLOR_BORDER).lineWidth(1).stroke()

  doc.font(F(false)).fontSize(9).fillColor(COLOR_MUTED)
  doc.text(' (Ký & ghi rõ họ tên)', leftX, signLineY + 6, { width: 180 })
  doc.text(' (Ký & ghi rõ họ tên)', rightX - 180, signLineY + 6, { width: 180, align: 'center' })

  doc.font(F(true)).fontSize(10).fillColor(COLOR_TEXT)
  doc.text(display(employeeName || '--'), leftX, signLineY + 24, { width: 180 })
  doc.text(display(customerName || '--'), rightX - 180, signLineY + 24, { width: 180, align: 'center' })

  doc.moveDown(2)
}

export const inHoSoTraPhong = (profile) =>
  new Promise((resolve, reject) => {
    try {
      const maHoSo = getValue(profile, 'maHoSo', 'ma_tp') || `HSTP_${Date.now()}`
      const isDepositCase = !getValue(profile, 'maHopDong', 'ma_hdt')
      
      // Khởi tạo thư mục và đường dẫn y hệt bên inHopDongThue
      const outDir = path.join(__dirname, '../../storage/ho-so-tra-phong')
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true })
      }

      const filePath = path.join(outDir, `${maHoSo}.pdf`)
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: PAGE_MARGIN,
        bufferPages: true // Thêm thuộc tính này cho giống inHopDongThue
      })
      const stream = fs.createWriteStream(filePath)
      doc.pipe(stream)

      const hasFont = fs.existsSync(FONT_REGULAR) && fs.existsSync(FONT_BOLD)
      if (hasFont) {
        doc.registerFont('Regular', FONT_REGULAR)
        doc.registerFont('Bold', FONT_BOLD)
      }

      const F = (bold) => (hasFont ? (bold ? 'Bold' : 'Regular') : bold ? 'Helvetica-Bold' : 'Helvetica')

      const maHopDong = getValue(profile, 'maHopDong', 'ma_hdt')
      const maPdc = getValue(profile, 'maPdc', 'ma_pdc')
      const ngayTraPhong = isDepositCase
        ? 'Giải quyết trong ngày'
        : formatDate(getValue(profile, 'ngayTraPhongDuKien'))
      const lichHen = isDepositCase
        ? 'Giải quyết trong ngày'
        : display(getValue(profile, 'lichHenTraPhong'))
      const emailStatus = isDepositCase
        ? 'Không gửi email'
        : getValue(profile, 'ngayTraPhongDuKien')
          ? 'Đã gửi'
          : '--'

      drawHeader(doc, F, maHoSo)
      drawMeta(doc, F, [
        { label: 'Ngày lập hồ sơ', value: formatDateTime(getValue(profile, 'ngayLap')) },
        { label: 'Thời gian in', value: formatDateTime(new Date()) },
      ])

      drawSectionTitle(doc, F, 'I. THÔNG TIN KHÁCH THUÊ')
      drawFieldGrid(doc, F, [
        { label: 'Họ tên', value: getValue(profile, 'hoVaTen') },
        { label: 'CCCD', value: getValue(profile, 'cccd') },
        { label: 'Số điện thoại', value: getValue(profile, 'soDienThoai') },
        { label: 'Email', value: getValue(profile, 'email') },
      ])

      drawSectionTitle(doc, F, 'II. THÔNG TIN THUÊ')
      drawFieldGrid(doc, F, [
        { label: 'Loại hồ sơ', value: isDepositCase ? 'Phiếu đặt cọc' : 'Hợp đồng thuê' },
        { label: 'Mã hợp đồng', value: maHopDong || '--' },
        { label: 'Mã phiếu đặt cọc', value: maPdc },
        { label: 'Phòng/Giường', value: getValue(profile, 'phongGiuong') },
        { label: 'Trạng thái hiện tại', value: getValue(profile, 'trangThaiHienTai') },
      ])

      drawSectionTitle(doc, F, 'III. THÔNG TIN TRẢ PHÒNG')
      drawFieldGrid(doc, F, [
        { label: 'Ngày trả phòng dự kiến', value: ngayTraPhong },
        { label: 'Lịch hẹn trả phòng', value: lichHen },
        { label: 'Trạng thái email', value: emailStatus },
      ])

      drawNoteBox(doc, F)
      drawSignatures(doc, F, {
        customerName: getValue(profile, 'hoVaTen'),
        employeeName: getValue(profile, 'nhanVienLap', 'tenNhanVienLap', 'nv_sale'),
      })

      doc.end()

      stream.on('finish', () => resolve(filePath))
      stream.on('error', reject)
    } catch (error) {
      reject(error)
    }
  })

export default { inHoSoTraPhong }