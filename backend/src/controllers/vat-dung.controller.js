import prisma from '../config/prisma.js'

const DELETE_BLOCKED_MESSAGE =
  'Không thể xóa vật dụng vì vật dụng đang được liên kết với dữ liệu khác.'

const validateVatDungPayload = ({ ten_vd, gia_boi_thuong }) => {
  const errors = {}

  if (!ten_vd?.trim()) {
    errors.ten_vd = 'Vui lòng nhập tên vật dụng.'
  }

  const price = Number(gia_boi_thuong)

  if (!Number.isFinite(price) || price < 0) {
    errors.gia_boi_thuong = 'Giá bồi thường phải là số không âm.'
  }

  return errors
}

export const getVatDungList = async (req, res, next) => {
  try {
    const q = req.query.q?.trim() || ''

    const rows = await prisma.$queryRaw`
      SELECT
        ma_vd,
        ten_vd,
        gia_boi_thuong
      FROM vat_dung
      WHERE
        ${q} = ''
        OR ma_vd ILIKE ${`%${q}%`}
        OR ten_vd ILIKE ${`%${q}%`}
      ORDER BY ma_vd
    `

    res.json(
      rows.map(row => ({
        ...row,
        gia_boi_thuong: Number(row.gia_boi_thuong),
      }))
    )
  } catch (error) {
    next(error)
  }
}

export const createVatDung = async (req, res, next) => {
  try {
    const { ten_vd, gia_boi_thuong } = req.body

    const errors = validateVatDungPayload({ ten_vd, gia_boi_thuong })

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: 'Dữ liệu không hợp lệ.',
        errors,
      })
    }

    const price = Number(gia_boi_thuong)

    const rows = await prisma.$queryRaw`
      INSERT INTO vat_dung (ten_vd, gia_boi_thuong)
      VALUES (${ten_vd.trim()}, ${price})
      RETURNING ma_vd, ten_vd, gia_boi_thuong
    `

    res.status(201).json({
      message: 'Thêm vật dụng thành công.',
      data: {
        ...rows[0],
        gia_boi_thuong: Number(rows[0].gia_boi_thuong),
      },
    })
  } catch (error) {
    next(error)
  }
}

export const updateVatDung = async (req, res, next) => {
  try {
    const { ma_vd } = req.params
    const { ten_vd, gia_boi_thuong } = req.body

    const itemCode = ma_vd?.trim().toUpperCase()

    if (!itemCode) {
      return res.status(400).json({
        message: 'Mã vật dụng không hợp lệ.',
      })
    }

    const errors = validateVatDungPayload({ ten_vd, gia_boi_thuong })

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: 'Dữ liệu không hợp lệ.',
        errors,
      })
    }

    const existedItem = await prisma.$queryRaw`
      SELECT ma_vd
      FROM vat_dung
      WHERE ma_vd = ${itemCode}
      LIMIT 1
    `

    if (existedItem.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy vật dụng cần cập nhật.',
      })
    }

    const price = Number(gia_boi_thuong)

    const rows = await prisma.$queryRaw`
      UPDATE vat_dung
      SET
        ten_vd = ${ten_vd.trim()},
        gia_boi_thuong = ${price}
      WHERE ma_vd = ${itemCode}
      RETURNING ma_vd, ten_vd, gia_boi_thuong
    `

    res.json({
      message: 'Cập nhật vật dụng thành công.',
      data: {
        ...rows[0],
        gia_boi_thuong: Number(rows[0].gia_boi_thuong),
      },
    })
  } catch (error) {
    next(error)
  }
}

export const deleteVatDung = async (req, res, next) => {
  try {
    const { ma_vd } = req.params
    const itemCode = ma_vd?.trim().toUpperCase()

    if (!itemCode) {
      return res.status(400).json({
        message: 'Mã vật dụng không hợp lệ.',
      })
    }

    const existedItem = await prisma.$queryRaw`
      SELECT ma_vd
      FROM vat_dung
      WHERE ma_vd = ${itemCode}
      LIMIT 1
    `

    if (existedItem.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy vật dụng cần xóa.',
      })
    }

    await prisma.$executeRaw`
      DELETE FROM vat_dung
      WHERE ma_vd = ${itemCode}
    `

    res.json({
      message: 'Xóa vật dụng thành công.',
    })
  } catch (error) {
    const isForeignKeyError =
      error.code === '23503' ||
      error.code === 'P2003' ||
      error.meta?.code === '23503' ||
      (error.code === 'P2010' && error.meta?.code === '23503')

    if (isForeignKeyError) {
      return res.status(400).json({
        message: DELETE_BLOCKED_MESSAGE,
      })
    }

    next(error)
  }
}