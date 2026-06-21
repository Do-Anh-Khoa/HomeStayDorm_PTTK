import prisma from '../config/prisma.js'

export const getQuyDinhKtxList = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim()
    const where = q ? {
      OR: [
        { ten_qd: { contains: q, mode: 'insensitive' } },
        ...(Number.isNaN(Number(q)) ? [] : [{ ma_qdktx: Number(q) }]),
      ],
    } : undefined

    const items = await prisma.quy_dinh_ktx.findMany({
      where,
      orderBy: { ma_qdktx: 'asc' },
    })

    res.json(items.map(item => ({
      ma_qd: item.ma_qdktx,
      ten_qd: item.ten_qd,
      noi_dung: item.noi_dung,
    })))
  } catch (error) {
    console.error('Lỗi khi lấy danh sách quy định KTX:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách quy định KTX',
      error: error.message,
    })
  }
}

export const createQuyDinhKtx = async (req, res) => {
  try {
    const { ten_qd, noi_dung } = req.body
    if (!ten_qd?.trim() || !noi_dung?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên và nội dung quy định.',
      })
    }

    const item = await prisma.quy_dinh_ktx.create({
      data: { ten_qd: ten_qd.trim(), noi_dung: noi_dung.trim() },
    })

    res.status(201).json({
      success: true,
      data: {
        ma_qd: item.ma_qdktx,
        ten_qd: item.ten_qd,
        noi_dung: item.noi_dung,
      },
      message: 'Tạo quy định KTX thành công',
    })
  } catch (error) {
    console.error('Lỗi khi tạo quy định KTX:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo quy định KTX',
      error: error.message,
    })
  }
}

export const updateQuyDinhKtx = async (req, res) => {
  try {
    const ma = Number(req.params.ma)
    if (!ma) {
      return res.status(400).json({ success: false, message: 'Mã quy định không hợp lệ' })
    }

    const { ten_qd, noi_dung } = req.body
    if (!ten_qd?.trim() || !noi_dung?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên và nội dung quy định.',
      })
    }

    const item = await prisma.quy_dinh_ktx.update({
      where: { ma_qdktx: ma },
      data: { ten_qd: ten_qd.trim(), noi_dung: noi_dung.trim() },
    })

    res.json({
      success: true,
      data: { ma_qd: item.ma_qdktx, ten_qd: item.ten_qd, noi_dung: item.noi_dung },
      message: 'Cập nhật quy định KTX thành công',
    })
  } catch (error) {
    console.error('Lỗi khi cập nhật quy định KTX:', error)
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Không tìm thấy quy định KTX' })
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật quy định KTX',
      error: error.message,
    })
  }
}

export const deleteQuyDinhKtx = async (req, res) => {
  try {
    const ma = Number(req.params.ma)
    if (!ma) {
      return res.status(400).json({ success: false, message: 'Mã quy định không hợp lệ' })
    }

    await prisma.quy_dinh_ktx.delete({ where: { ma_qdktx: ma } })

    res.json({ success: true, message: 'Xóa quy định KTX thành công' })
  } catch (error) {
    console.error('Lỗi khi xóa quy định KTX:', error)
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Không tìm thấy quy định KTX' })
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa quy định KTX',
      error: error.message,
    })
  }
}
