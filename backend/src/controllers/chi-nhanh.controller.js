import prisma from '../config/prisma.js'

// GET /api/chi-nhanh - Lấy danh sách chi nhánh
export const getAllChiNhanh = async (req, res) => {
  try {
    const chiNhanhs = await prisma.chi_nhanh.findMany({
      select: {
        ma_cn: true,
        ten_cn: true,
        dia_chi: true,
        sdt: true,
      },
      orderBy: {
        ma_cn: 'asc',
      },
    })

    res.json({
      success: true,
      data: chiNhanhs,
      message: 'Lấy danh sách chi nhánh thành công',
    })
  } catch (error) {
    console.error('Lỗi khi lấy danh sách chi nhánh:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách chi nhánh',
      error: error.message,
    })
  }
}
