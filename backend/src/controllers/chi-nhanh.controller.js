import prisma from '../config/prisma.js'

// GET /api/chi-nhanh - Lấy danh sách chi nhánh (UC 1b)
export const getAllChiNhanh = async (req, res) => {
  const { q } = req.query
  const where = q
    ? {
        OR: [
          { ten_cn: { contains: q, mode: 'insensitive' } },
          { ma_cn:  { contains: q, mode: 'insensitive' } },
        ],
      }
    : {}

  try {
    const chiNhanhs = await prisma.chi_nhanh.findMany({
      where,
      select: { ma_cn: true, ten_cn: true, dia_chi: true, sdt: true },
      orderBy: { ma_cn: 'asc' },
    })

    res.json(chiNhanhs)
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách chi nhánh.' })
  }
}

// POST /api/chi-nhanh - Thêm mới chi nhánh (UC 1a)
export const createChiNhanh = async (req, res) => {
  const { ten_cn, dia_chi, sdt } = req.body

  if (!ten_cn?.trim() || !dia_chi?.trim() || !sdt?.trim()) {
    return res.status(400).json({ message: 'Thông tin nhập vào không hợp lệ. Vui lòng kiểm tra lại.' })
  }

  try {
    // A1a.3 - Kiểm tra trùng lặp
    const exists = await prisma.chi_nhanh.findFirst({
      where: { OR: [{ ten_cn: ten_cn.trim() }, { sdt: sdt.trim() }] }
    })

    if (exists) {
      return res.status(400).json({ message: 'Tên chi nhánh hoặc số điện thoại đã tồn tại trên hệ thống. Vui lòng kiểm tra lại.' })
    }

    const created = await prisma.chi_nhanh.create({
      data: { ten_cn: ten_cn.trim(), dia_chi: dia_chi.trim(), sdt: sdt.trim() },
    })
    res.status(201).json(created)
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi thêm chi nhánh.' })
  }
}

// PUT /api/chi-nhanh/:ma - Cập nhật chi nhánh (UC 1c)
export const updateChiNhanh = async (req, res) => {
  const { ma } = req.params
  const { ten_cn, dia_chi, sdt } = req.body

  if (!ten_cn?.trim() || !dia_chi?.trim() || !sdt?.trim()) {
    return res.status(400).json({ message: 'Thông tin nhập vào không hợp lệ. Vui lòng kiểm tra lại.' })
  }

  try {
    // A1c.4 - Kiểm tra trùng lặp với chi nhánh khác
    const exists = await prisma.chi_nhanh.findFirst({
      where: {
        ma_cn: { not: ma },
        OR: [{ ten_cn: ten_cn.trim() }, { sdt: sdt.trim() }]
      }
    })

    if (exists) {
      return res.status(400).json({ message: 'Tên chi nhánh hoặc số điện thoại đã tồn tại trên hệ thống. Vui lòng kiểm tra lại.' })
    }

    const updated = await prisma.chi_nhanh.update({
      where: { ma_cn: ma },
      data: { ten_cn: ten_cn.trim(), dia_chi: dia_chi.trim(), sdt: sdt.trim() },
    })
    res.json(updated)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Không tìm thấy chi nhánh phù hợp.' })
    res.status(500).json({ message: 'Lỗi khi cập nhật chi nhánh.' })
  }
}

// DELETE /api/chi-nhanh/:ma - Xóa chi nhánh (UC 1d)
export const deleteChiNhanh = async (req, res) => {
  const { ma } = req.params

  try {
    await prisma.chi_nhanh.delete({ where: { ma_cn: ma } })
    res.json({ message: 'Xóa chi nhánh thành công.' })
  } catch (err) {
    // A1d.5 - Vi phạm khóa ngoại
    if (err.code === 'P2003') {
      return res.status(400).json({ message: 'Không thể xóa chi nhánh này vì hiện tại đang có phòng hoặc hồ sơ đăng ký thuộc chi nhánh.' })
    }
    res.status(500).json({ message: 'Lỗi khi xóa chi nhánh.' })
  }
}