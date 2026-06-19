import prisma from '../config/prisma.js'

// sinh mã tự động: DV001, DV002, ...
async function generateMaDv() {
  const last = await prisma.dich_vu.findFirst({
    orderBy: { ma_dv: 'desc' },
    select:  { ma_dv: true },
  })

  if (!last) return 'DV001'

  const num = parseInt(last.ma_dv.replace(/\D/g, ''), 10)
  if (isNaN(num)) return 'DV001'

  const next = num + 1
  return 'DV' + String(next).padStart(3, '0')
}

// GET /api/dich-vu?q=keyword
export async function getDichVuList(req, res) {
  const { q } = req.query

  const where = q
    ? {
        OR: [
          { ten_dv: { contains: q, mode: 'insensitive' } },
          { ma_dv:  { contains: q, mode: 'insensitive' } },
        ],
      }
    : {}

  try {
    const data = await prisma.dich_vu.findMany({
      where,
      orderBy: { ma_dv: 'asc' },
    })
    res.json(data)
  } catch {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách dịch vụ.' })
  }
}

// POST /api/dich-vu
export async function createDichVu(req, res) {
  const { ten_dv, don_vi_tinh, gia_dv } = req.body

  if (!ten_dv?.trim()) {
    return res.status(400).json({ message: 'Vui lòng nhập tên dịch vụ.' })
  }
  if (gia_dv == null || isNaN(Number(gia_dv)) || Number(gia_dv) < 0) {
    return res.status(400).json({ message: 'Đơn giá không hợp lệ.' })
  }

  try {
    const ma_dv = await generateMaDv()

    const created = await prisma.dich_vu.create({
      data: {
        ma_dv,
        ten_dv:      ten_dv.trim(),
        don_vi_tinh: don_vi_tinh?.trim() || '',
        gia_dv:      Number(gia_dv),
      },
    })
    res.status(201).json(created)
  } catch {
    res.status(500).json({ message: 'Lỗi khi thêm dịch vụ.' })
  }
}

// PUT /api/dich-vu/:ma
export async function updateDichVu(req, res) {
  const { ma } = req.params
  const { ten_dv, don_vi_tinh } = req.body

  if (!ten_dv?.trim()) {
    return res.status(400).json({ message: 'Vui lòng nhập tên dịch vụ.' })
  }

  try {
    const updated = await prisma.dich_vu.update({
      where: { ma_dv: ma },
      // gia_dv không cập nhật được
      data: {
        ten_dv:      ten_dv.trim(),
        don_vi_tinh: don_vi_tinh?.trim() || '',
      },
    })
    res.json(updated)
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Không tìm thấy dịch vụ.' })
    }
    res.status(500).json({ message: 'Lỗi khi cập nhật dịch vụ.' })
  }
}

// DELETE /api/dich-vu/:ma
export async function deleteDichVu(req, res) {
  const { ma } = req.params

  try {
    await prisma.dich_vu.delete({ where: { ma_dv: ma } })
    res.json({ message: 'Đã xóa dịch vụ.' })
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Không tìm thấy dịch vụ.' })
    }
    if (err.code === 'P2003') {
      return res.status(400).json({ message: 'Không thể xóa vì dịch vụ đang được sử dụng.' })
    }
    res.status(500).json({ message: 'Lỗi khi xóa dịch vụ.' })
  }
}