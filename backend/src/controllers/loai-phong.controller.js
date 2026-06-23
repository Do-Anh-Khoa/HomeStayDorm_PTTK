import prisma from '../config/prisma.js'

// GET /api/loai-phong (UC 1b)
export const getAllLoaiPhong = async (req, res) => {
  const { q } = req.query
  const where = q
    ? {
        OR: [
          { ten_loai: { contains: q, mode: 'insensitive' } },
          { ma_loai:  { contains: q, mode: 'insensitive' } },
        ],
      }
    : {}

  try {
    const data = await prisma.loai_phong.findMany({
      where,
      orderBy: { ma_loai: 'asc' },
    })
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách loại phòng.' })
  }
}

// POST /api/loai-phong (UC 1a)
export const createLoaiPhong = async (req, res) => {
  const { ten_loai, gia_nguyen_phong, gia_giuong, thoi_han_toi_da, thoi_han_toi_thieu } = req.body

  // 1a.2 Kiểm tra dữ liệu đầu vào
  if (!ten_loai?.trim() || gia_nguyen_phong < 0 || gia_giuong < 0 || thoi_han_toi_da <= 0 || thoi_han_toi_thieu <= 0) {
    return res.status(400).json({ message: 'Thông tin nhập vào không hợp lệ. Các mức giá/thời hạn phải lớn hơn 0.' })
  }

  if (thoi_han_toi_thieu > thoi_han_toi_da) {
    return res.status(400).json({ message: 'Thời hạn tối thiểu không được lớn hơn thời hạn tối đa.' })
  }

  try {
    // Tự động phát sinh mã loại phòng (UC 1a.3)
    const lastRoom = await prisma.loai_phong.findFirst({
      where: { ma_loai: { startsWith: 'LP' } },
      orderBy: { ma_loai: 'desc' }
    })
    
    let newMaLoai = 'LP001'
    if (lastRoom && lastRoom.ma_loai.startsWith('LP')) {
      const lastNum = parseInt(lastRoom.ma_loai.replace(/\D/g, '')) || 0
      newMaLoai = 'LP' + String(lastNum + 1).padStart(3, '0')
    }

    const created = await prisma.loai_phong.create({
      data: {
        ma_loai: newMaLoai,
        ten_loai: ten_loai.trim(),
        gia_nguyen_phong: Number(gia_nguyen_phong),
        gia_giuong: Number(gia_giuong),
        thoi_han_toi_da: Number(thoi_han_toi_da),
        thoi_han_toi_thieu: Number(thoi_han_toi_thieu),
      },
    })
    res.status(201).json({ message: 'Tạo loại phòng thành công', data: created })
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi thêm loại phòng.' })
  }
}

// PUT /api/loai-phong/:ma (UC 1c)
export const updateLoaiPhong = async (req, res) => {
  const { ma } = req.params
  const { ten_loai, gia_nguyen_phong, gia_giuong, thoi_han_toi_da, thoi_han_toi_thieu } = req.body

  // 1c.3 Kiểm tra dữ liệu đầu vào
  if (!ten_loai?.trim() || gia_nguyen_phong < 0 || gia_giuong < 0 || thoi_han_toi_da <= 0 || thoi_han_toi_thieu <= 0) {
    return res.status(400).json({ message: 'Thông tin nhập vào không hợp lệ.' })
  }

  if (thoi_han_toi_thieu > thoi_han_toi_da) {
    return res.status(400).json({ message: 'Thời hạn tối thiểu không được lớn hơn thời hạn tối đa.' })
  }

  try {
    const updated = await prisma.loai_phong.update({
      where: { ma_loai: ma },
      data: {
        ten_loai: ten_loai.trim(),
        gia_nguyen_phong: Number(gia_nguyen_phong),
        gia_giuong: Number(gia_giuong),
        thoi_han_toi_da: Number(thoi_han_toi_da),
        thoi_han_toi_thieu: Number(thoi_han_toi_thieu),
      },
    })
    res.json({ message: 'Cập nhật thông tin loại phòng thành công', data: updated })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Không tìm thấy loại phòng.' })
    res.status(500).json({ message: 'Lỗi khi cập nhật loại phòng.' })
  }
}

// DELETE /api/loai-phong/:ma (UC 1d)
export const deleteLoaiPhong = async (req, res) => {
  const { ma } = req.params

  try {
    await prisma.loai_phong.delete({ where: { ma_loai: ma } })
    res.json({ message: 'Xóa loại phòng thành công.' })
  } catch (err) {
    // 1d.5 Kiểm tra ràng buộc khóa ngoại
    if (err.code === 'P2003') {
      return res.status(400).json({ message: 'Không thể xóa loại phòng đang được sử dụng.' })
    }
    res.status(500).json({ message: 'Lỗi khi xóa loại phòng.' })
  }
}