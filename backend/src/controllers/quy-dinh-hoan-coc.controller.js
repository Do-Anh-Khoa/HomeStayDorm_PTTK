import prisma from '../config/prisma.js'

// GET /api/quy-dinh-hoan-coc?q=keyword
export async function getQuyDinhList(req, res) {
  const { q } = req.query

  const where = q
    ? { OR: [
        { ten_qd:   { contains: q, mode: 'insensitive' } },
        { noi_dung: { contains: q, mode: 'insensitive' } },
      ]}
    : {}

  try {
    const data = await prisma.quy_dinh_hoan_coc.findMany({
      where,
      orderBy: { ma_qdhc: 'asc' },
    })
    res.json(data)
  } catch {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách quy định.' })
  }
}

// POST /api/quy-dinh-hoan-coc
export async function createQuyDinh(req, res) {
  const { ten_qd, noi_dung } = req.body

  if (!ten_qd?.trim())   return res.status(400).json({ message: 'Vui lòng nhập tên quy định.' })
  if (!noi_dung?.trim()) return res.status(400).json({ message: 'Vui lòng nhập nội dung quy định.' })

  try {
    const created = await prisma.quy_dinh_hoan_coc.create({
      data: { ten_qd: ten_qd.trim(), noi_dung: noi_dung.trim() },
    })
    res.status(201).json(created)
  } catch {
    res.status(500).json({ message: 'Lỗi khi thêm quy định.' })
  }
}

// PUT /api/quy-dinh-hoan-coc/:id
export async function updateQuyDinh(req, res) {
  const id = parseInt(req.params.id, 10)
  const { ten_qd, noi_dung } = req.body

  if (!ten_qd?.trim())   return res.status(400).json({ message: 'Vui lòng nhập tên quy định.' })
  if (!noi_dung?.trim()) return res.status(400).json({ message: 'Vui lòng nhập nội dung quy định.' })

  try {
    const updated = await prisma.quy_dinh_hoan_coc.update({
      where: { ma_qdhc: id },
      data:  { ten_qd: ten_qd.trim(), noi_dung: noi_dung.trim() },
    })
    res.json(updated)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Không tìm thấy quy định.' })
    res.status(500).json({ message: 'Lỗi khi cập nhật quy định.' })
  }
}

// DELETE /api/quy-dinh-hoan-coc/:id
export async function deleteQuyDinh(req, res) {
  const id = parseInt(req.params.id, 10)

  try {
    await prisma.quy_dinh_hoan_coc.delete({ where: { ma_qdhc: id } })
    res.json({ message: 'Đã xóa quy định.' })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Không tìm thấy quy định.' })
    res.status(500).json({ message: 'Lỗi khi xóa quy định.' })
  }
}