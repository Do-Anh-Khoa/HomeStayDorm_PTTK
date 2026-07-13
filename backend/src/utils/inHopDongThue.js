import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const FONT_REGULAR = path.join(__dirname, '../assets/fonts/Roboto-Regular.ttf')
const FONT_BOLD = path.join(__dirname, '../assets/fonts/Roboto-Bold.ttf')

const PAGE_MARGIN = 40
const PAGE_BOTTOM = 42
const COLOR_TITLE = '#334b24'
const COLOR_TEXT = '#3f473d'
const COLOR_MUTED = '#7b8276'
const COLOR_BORDER = '#dfe5d8'
const COLOR_SOFT = '#f7f8f4'
const COLOR_TOTAL = '#e7efdb'
const COLOR_BADGE_BG = '#eef5dc'
const COLOR_BADGE_TEXT = '#6d8b29'

function formatNgay(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('vi-VN')
}

function formatTien(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')} VND`
}

function normalizeTermItems(items = []) {
  return items
    .map((item) => item?.content || item?.noi_dung || item)
    .map((item) => String(item || '').trim())
    .filter(Boolean)
}

function ensureSpace(doc, minHeight) {
  if (doc.y + minHeight <= doc.page.height - PAGE_BOTTOM) {
    return
  }

  doc.addPage()
  doc.y = PAGE_MARGIN
}

function drawCenteredHeader(doc, F) {
  doc.font(F(true)).fontSize(10).fillColor(COLOR_TITLE)
  doc.text('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', PAGE_MARGIN, doc.y, {
    width: doc.page.width - PAGE_MARGIN * 2,
    align: 'center',
  })

  doc.moveDown(0.15)
  doc.font(F(true)).fontSize(8.5).fillColor(COLOR_TEXT)
  doc.text('Độc lập - Tự do - Hạnh phúc', PAGE_MARGIN, doc.y, {
    width: doc.page.width - PAGE_MARGIN * 2,
    align: 'center',
  })

  doc.moveDown(1.2)
  doc.font(F(true)).fontSize(28).fillColor(COLOR_TITLE)
  doc.text('HỢP ĐỒNG THUÊ', PAGE_MARGIN, doc.y, {
    width: doc.page.width - PAGE_MARGIN * 2,
    align: 'center',
  })

  doc.moveDown(1.1)
}

function drawSectionTitle(doc, F, title) {
  ensureSpace(doc, 26)
  doc.font(F(true)).fontSize(14).fillColor(COLOR_TITLE)
  doc.text(title, PAGE_MARGIN, doc.y)
  doc.moveDown(0.65)
}

function drawInfoGrid(doc, F, items) {
  const columnGap = 26
  const leftWidth = 240
  const rightWidth = 240
  const startX = PAGE_MARGIN
  const rightX = startX + leftWidth + columnGap
  const labelWidth = 92
  const rowHeight = 28

  items.forEach(([left, right]) => {
    ensureSpace(doc, rowHeight)
    const y = doc.y

    doc.font(F(false)).fontSize(10).fillColor(COLOR_MUTED)
    doc.text(left.label, startX, y, { width: labelWidth })
    doc.font(F(true)).fontSize(10).fillColor(COLOR_TEXT)
    doc.text(left.value || '--', startX + labelWidth, y, {
      width: leftWidth - labelWidth,
    })

    doc.font(F(false)).fontSize(10).fillColor(COLOR_MUTED)
    doc.text(right.label, rightX, y, { width: labelWidth })
    doc.font(F(true)).fontSize(10).fillColor(COLOR_TEXT)
    doc.text(right.value || '--', rightX + labelWidth, y, {
      width: rightWidth - labelWidth,
    })

    doc.y = y + rowHeight
  })

  doc.moveDown(0.15)
}

function drawTable(doc, F, beds, tongTien) {
  ensureSpace(doc, 120)

  const x = PAGE_MARGIN
  const width = doc.page.width - PAGE_MARGIN * 2
  const infoWidth = width * 0.7
  const priceWidth = width - infoWidth
  const headerHeight = 28
  const rowHeight = 28
  const totalHeight = 30
  const tableHeight = headerHeight + beds.length * rowHeight + totalHeight
  const y = doc.y

  doc.save()
  doc.roundedRect(x, y, width, tableHeight, 4).lineWidth(1).strokeColor(COLOR_BORDER).stroke()

  doc.rect(x, y, width, headerHeight).fillAndStroke(COLOR_SOFT, COLOR_BORDER)
  doc.moveTo(x + infoWidth, y).lineTo(x + infoWidth, y + tableHeight).strokeColor(COLOR_BORDER).stroke()

  doc.font(F(true)).fontSize(10).fillColor(COLOR_TEXT)
  doc.text('Thông tin thuê', x + 12, y + 9, { width: infoWidth - 24 })
  doc.text('Đơn giá', x + infoWidth + 12, y + 9, {
    width: priceWidth - 24,
    align: 'right',
  })

  let rowY = y + headerHeight
  beds.forEach((bed, index) => {
    if (index > 0) {
      doc.moveTo(x, rowY).lineTo(x + width, rowY).strokeColor(COLOR_BORDER).stroke()
    }

    doc.font(F(false)).fontSize(10).fillColor(COLOR_TEXT)
    doc.text(`${bed.maPhong} - ${bed.maGiuong}`, x + 12, rowY + 9, {
      width: infoWidth - 24,
    })
    doc.text(formatTien(bed.giaThue), x + infoWidth + 12, rowY + 9, {
      width: priceWidth - 24,
      align: 'right',
    })
    rowY += rowHeight
  })

  doc.rect(x, rowY, width, totalHeight).fillAndStroke(COLOR_TOTAL, COLOR_BORDER)
  doc.font(F(true)).fontSize(10).fillColor(COLOR_TITLE)
  doc.text('Tổng cộng (Đã bao gồm VAT):', x + 12, rowY + 9, { width: infoWidth - 24 })
  doc.text(formatTien(tongTien), x + infoWidth + 12, rowY + 9, {
    width: priceWidth - 24,
    align: 'right',
  })
  doc.restore()

  doc.y = y + tableHeight + 18
}

function drawBadge(doc, F, x, y, text) {
  const badgeWidth = Math.max(68, doc.widthOfString(text, { font: F(true), size: 8 }) + 18)
  doc.save()
  doc.roundedRect(x, y, badgeWidth, 20, 10).fill(COLOR_BADGE_BG)
  doc.font(F(true)).fontSize(8).fillColor(COLOR_BADGE_TEXT)
  doc.text(text, x, y + 6, { width: badgeWidth, align: 'center' })
  doc.restore()
}

function drawTenantCards(doc, F, tenants) {
  const x = PAGE_MARGIN
  const width = doc.page.width - PAGE_MARGIN * 2
  const gap = 14
  const cardWidth = (width - gap) / 2
  const cardHeight = 46

  for (let index = 0; index < tenants.length; index += 2) {
    ensureSpace(doc, cardHeight + 10)
    const y = doc.y
    const rowTenants = tenants.slice(index, index + 2)

    rowTenants.forEach((tenant, columnIndex) => {
      const cardX = x + columnIndex * (cardWidth + gap)
      doc.save()
      doc.roundedRect(cardX, y, cardWidth, cardHeight, 5).lineWidth(1).strokeColor(COLOR_BORDER).stroke()
      doc.font(F(true)).fontSize(10).fillColor(COLOR_TEXT)
      doc.text(tenant.hoTen || '--', cardX + 12, y + 10, {
        width: cardWidth - 110,
      })

      if (tenant.isChuHopDong) {
        drawBadge(doc, F, cardX + cardWidth - 90, y + 8, 'Chủ hợp đồng')
      }

      doc.font(F(false)).fontSize(9.5).fillColor(COLOR_MUTED)
      doc.text(`CCCD: ${tenant.cccd || '--'}`, cardX + 12, y + 27, {
        width: cardWidth - 24,
      })
      doc.restore()
    })

    doc.y = y + cardHeight + 10
  }

  doc.moveDown(0.3)
}

function drawTermBlock(doc, F, title, items) {
  const normalizedItems = normalizeTermItems(items)
  if (normalizedItems.length === 0) {
    return
  }

  const content = normalizedItems.map((item, index) => `${index + 1}. ${item}`).join('\n')
  const width = doc.page.width - PAGE_MARGIN * 2 - 8
  const titleHeight = doc.heightOfString(`${title}:`, {
    width,
    font: F(true),
    size: 10,
  })
  const contentHeight = doc.heightOfString(content, {
    width,
    font: F(false),
    size: 9.2,
    lineGap: 2,
  })

  ensureSpace(doc, titleHeight + contentHeight + 16)

  doc.font(F(true)).fontSize(10).fillColor(COLOR_TEXT)
  doc.text(`${title}:`, PAGE_MARGIN, doc.y)
  doc.moveDown(0.2)

  doc.font(F(false)).fontSize(9.2).fillColor(COLOR_TEXT)
  doc.text(content, PAGE_MARGIN, doc.y, {
    width,
    lineGap: 2,
    align: 'left',
  })
  doc.moveDown(0.85)
}

export const inHopDongThue = (contract) =>
  new Promise((resolve, reject) => {
    try {
      const outDir = path.join(__dirname, '../../storage/hop-dong-thue')
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

      const filePath = path.join(outDir, `${contract.maHopDong}.pdf`)
      const doc = new PDFDocument({
        size: 'A4',
        margin: PAGE_MARGIN,
        bufferPages: true,
      })
      const stream = fs.createWriteStream(filePath)
      doc.pipe(stream)

      const hasFont = fs.existsSync(FONT_REGULAR) && fs.existsSync(FONT_BOLD)
      if (hasFont) {
        doc.registerFont('Regular', FONT_REGULAR)
        doc.registerFont('Bold', FONT_BOLD)
      }
      const F = (bold) => (hasFont ? (bold ? 'Bold' : 'Regular') : bold ? 'Helvetica-Bold' : 'Helvetica')

      const tongTien = (contract.beds || []).reduce(
        (sum, bed) => sum + Number(bed.giaThue || 0),
        0,
      )

      drawCenteredHeader(doc, F)

      drawSectionTitle(doc, F, 'I. THÔNG TIN CHUNG')
      drawInfoGrid(doc, F, [
        [
          { label: 'Mã phiếu đặt cọc', value: contract.maPhieuDatCoc },
          { label: 'Nhân viên phụ trách', value: contract.nhanVienPhuTrach?.tenNV || '' },
        ],
        [
          { label: 'Thời gian lập', value: formatNgay(contract.thoiGianLapHopDong) },
          { label: 'Thời gian bắt đầu', value: formatNgay(contract.thoiGianBatDauThue) },
        ],
        [
          { label: 'Thời hạn thuê', value: `${contract.thoiHanThue} tháng` },
          { label: 'Kỳ thanh toán', value: contract.kyThanhToanLabel || '' },
        ],
      ])

      drawSectionTitle(doc, F, 'II. CHI TIẾT THUÊ')
      drawTable(doc, F, contract.beds || [], tongTien)

      drawSectionTitle(doc, F, 'III. DANH SÁCH KHÁCH THUÊ')
      drawTenantCards(doc, F, contract.tenants || [])

      drawSectionTitle(doc, F, 'IV. ĐIỀU KHOẢN & QUY ĐỊNH')
      doc.moveTo(PAGE_MARGIN, doc.y).lineTo(doc.page.width - PAGE_MARGIN, doc.y).strokeColor(COLOR_BORDER).stroke()
      doc.moveDown(0.8)

      drawTermBlock(doc, F, 'Nội quy ký túc xá', contract.terms?.noiQuyKtx || [])
      drawTermBlock(doc, F, 'Quy định hoàn cọc', contract.terms?.quyDinhHoanCoc || [])
      drawTermBlock(doc, F, 'Điều khoản xử lý vi phạm', contract.terms?.dieuKhoanXuLyViPham || [])

      doc.end()

      stream.on('finish', () => resolve(filePath))
      stream.on('error', reject)
    } catch (error) {
      reject(error)
    }
  })

export default { inHopDongThue }
