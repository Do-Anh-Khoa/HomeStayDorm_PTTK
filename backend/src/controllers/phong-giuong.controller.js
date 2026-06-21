import { Prisma } from '@prisma/client'
import prisma from '../config/prisma.js'

export const getPhongGiuongList = async (req, res, next) => {
  try {
    const { q, loai_phong } = req.query

    const where = []

    if (q?.trim()) {
      const keyword = `%${q.trim()}%`
      where.push(Prisma.sql`
        (
          p.ma_phong ILIKE ${keyword}
          OR p.ma_loai ILIKE ${keyword}
          OR lp.ten_loai ILIKE ${keyword}
        )
      `)
    }

    if (loai_phong) {
      where.push(Prisma.sql`p.ma_loai = ${loai_phong}`)
    }

    const whereSql = where.length
      ? Prisma.sql`WHERE ${Prisma.join(where, ' AND ')}`
      : Prisma.empty

    const rows = await prisma.$queryRaw`
      SELECT
        p.ma_phong,
        p.suc_chua_toi_da AS suc_chua,
        p.ma_loai AS loai_phong,
        lp.ten_loai AS ten_loai_phong,
        p.chi_nhanh,
        cn.ten_cn AS ten_chi_nhanh,
        COALESCE(
          json_agg(
            json_build_object(
              'ma_giuong', g.ma_giuong,
              'trang_thai', g.trang_thai
            )
            ORDER BY g.ma_giuong
          ) FILTER (WHERE g.ma_giuong IS NOT NULL),
          '[]'::json
        ) AS giuong
      FROM phong p
      LEFT JOIN loai_phong lp ON lp.ma_loai = p.ma_loai
      LEFT JOIN chi_nhanh cn ON cn.ma_cn = p.chi_nhanh
      LEFT JOIN giuong g ON g.ma_phong = p.ma_phong
      ${whereSql}
      GROUP BY
        p.ma_phong,
        p.suc_chua_toi_da,
        p.ma_loai,
        lp.ten_loai,
        p.chi_nhanh,
        cn.ten_cn
      ORDER BY p.ma_phong ASC
    `

    const data = rows.map(row => ({
      ...row,
      suc_chua: Number(row.suc_chua),
      giuong: typeof row.giuong === 'string'
        ? JSON.parse(row.giuong)
        : row.giuong,
    }))

    res.json(data)
  } catch (error) {
    next(error)
  }
}

export const getLoaiPhongOptions = async (req, res, next) => {
  try {
    const rows = await prisma.$queryRaw`
      SELECT
        ma_loai AS value,
        ma_loai || ' — ' || ten_loai AS label
      FROM loai_phong
      ORDER BY ma_loai ASC
    `

    res.json(rows)
  } catch (error) {
    next(error)
  }
}

export const getChiNhanhOptions = async (req, res, next) => {
  try {
    const rows = await prisma.$queryRaw`
      SELECT
        ma_cn AS value,
        ma_cn || ' — ' || ten_cn AS label
      FROM chi_nhanh
      ORDER BY ma_cn ASC
    `

    res.json(rows)
  } catch (error) {
    next(error)
  }
}

export const createPhongGiuong = async (req, res, next) => {
  try {
    const { ma_phong, suc_chua, loai_phong, chi_nhanh } = req.body

    if (!ma_phong?.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập mã phòng.' })
    }

    const capacity = Number(suc_chua)

    if (!Number.isInteger(capacity) || capacity <= 0 || capacity > 12) {
      return res.status(400).json({
        message: 'Sức chứa phải là số nguyên từ 1 đến 12.'
      })
    }

    if (!loai_phong) {
      return res.status(400).json({ message: 'Vui lòng chọn loại phòng.' })
    }

    if (!chi_nhanh) {
      return res.status(400).json({ message: 'Vui lòng chọn chi nhánh.' })
    }

    const roomCode = ma_phong.trim().toUpperCase()

    const existedRoom = await prisma.$queryRaw`
      SELECT ma_phong
      FROM phong
      WHERE ma_phong = ${roomCode}
      LIMIT 1
    `

    if (existedRoom.length > 0) {
      return res.status(400).json({ message: 'Mã phòng đã tồn tại.' })
    }

    const existedLoaiPhong = await prisma.$queryRaw`
      SELECT ma_loai
      FROM loai_phong
      WHERE ma_loai = ${loai_phong}
      LIMIT 1
    `

    if (existedLoaiPhong.length === 0) {
      return res.status(400).json({ message: 'Loại phòng không hợp lệ.' })
    }

    const existedChiNhanh = await prisma.$queryRaw`
      SELECT ma_cn
      FROM chi_nhanh
      WHERE ma_cn = ${chi_nhanh}
      LIMIT 1
    `

    if (existedChiNhanh.length === 0) {
      return res.status(400).json({ message: 'Chi nhánh không hợp lệ.' })
    }

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        INSERT INTO phong (ma_phong, suc_chua_toi_da, ma_loai, chi_nhanh)
        VALUES (${roomCode}, ${capacity}, ${loai_phong}, ${chi_nhanh})
      `

      for (let i = 1; i <= capacity; i++) {
        const ma_giuong = `G${String(i).padStart(2, '0')}`

        await tx.$executeRaw`
          INSERT INTO giuong (ma_giuong, ma_phong, trang_thai)
          VALUES (${ma_giuong}, ${roomCode}, ${'Trống'})
        `
      }
    })

    res.status(201).json({
      message: 'Tạo phòng thành công.'
    })
  } catch (error) {
    next(error)
  }
}

export const deletePhongGiuong = async (req, res, next) => {
  const DELETE_BLOCKED_MESSAGE =
    'Không thể xóa phòng vì phòng hoặc giường đang được liên kết với dữ liệu khác.'

  try {
    const { ma_phong } = req.params
    const roomCode = ma_phong?.trim().toUpperCase()

    if (!roomCode) {
      return res.status(400).json({
        message: 'Mã phòng không hợp lệ.'
      })
    }

    // 1. Kiểm tra phòng có tồn tại không
    const existedRoom = await prisma.$queryRaw`
      SELECT ma_phong
      FROM phong
      WHERE ma_phong = ${roomCode}
      LIMIT 1
    `

    if (existedRoom.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy phòng cần xóa.'
      })
    }

    // 2. Kiểm tra trạng thái giường theo use case
    const restrictedBeds = await prisma.$queryRaw`
      SELECT ma_giuong, trang_thai
      FROM giuong
      WHERE ma_phong = ${roomCode}
        AND trang_thai IN (${`Đã đặt cọc`}, ${`Đang sử dụng`})
      LIMIT 1
    `

    if (restrictedBeds.length > 0) {
      return res.status(400).json({
        message: DELETE_BLOCKED_MESSAGE
      })
    }

    // 3. Kiểm tra giường có liên kết với phiếu đặt cọc không
    const usedInDeposit = await prisma.$queryRaw`
      SELECT ma_pdc, ma_phong, ma_giuong
      FROM dat_coc_giuong
      WHERE ma_phong = ${roomCode}
      LIMIT 1
    `

    if (usedInDeposit.length > 0) {
      return res.status(400).json({
        message: DELETE_BLOCKED_MESSAGE
      })
    }

    // 4. Kiểm tra phòng có phát sinh chi tiết dịch vụ không
    const usedInService = await prisma.$queryRaw`
      SELECT ma_ct
      FROM chi_tiet_dv
      WHERE ma_phong = ${roomCode}
      LIMIT 1
    `

    if (usedInService.length > 0) {
      return res.status(400).json({
        message: DELETE_BLOCKED_MESSAGE
      })
    }

    // 5. Nếu không có ràng buộc thì xóa
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        DELETE FROM giuong
        WHERE ma_phong = ${roomCode}
      `

      await tx.$executeRaw`
        DELETE FROM phong
        WHERE ma_phong = ${roomCode}
      `
    })

    res.json({
      message: 'Xóa phòng thành công.'
    })
  } catch (error) {
    const isForeignKeyError =
      error.code === '23503' ||
      error.code === 'P2003' ||
      error.meta?.code === '23503' ||
      (error.code === 'P2010' && error.meta?.code === '23503')

    if (isForeignKeyError) {
      return res.status(400).json({
        message: DELETE_BLOCKED_MESSAGE
      })
    }

    next(error)
  }
}

export const updatePhongGiuong = async (req, res, next) => {
  const UPDATE_BLOCKED_MESSAGE =
    'Không thể cập nhật sức chứa vì phòng hoặc giường đang được liên kết với dữ liệu khác.'

  try {
    const { ma_phong } = req.params
    const { suc_chua, loai_phong, chi_nhanh } = req.body

    const roomCode = ma_phong?.trim().toUpperCase()

    if (!roomCode) {
      return res.status(400).json({
        message: 'Mã phòng không hợp lệ.'
      })
    }

    const capacity = Number(suc_chua)

    if (!Number.isInteger(capacity) || capacity <= 0 || capacity > 12) {
      return res.status(400).json({
        message: 'Sức chứa phải là số nguyên từ 1 đến 12.'
      })
    }

    if (!loai_phong) {
      return res.status(400).json({
        message: 'Vui lòng chọn loại phòng.'
      })
    }

    if (!chi_nhanh) {
      return res.status(400).json({
        message: 'Vui lòng chọn chi nhánh.'
      })
    }

    const existedRoom = await prisma.$queryRaw`
      SELECT ma_phong, suc_chua_toi_da
      FROM phong
      WHERE ma_phong = ${roomCode}
      LIMIT 1
    `

    if (existedRoom.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy phòng cần cập nhật.'
      })
    }

    const existedLoaiPhong = await prisma.$queryRaw`
      SELECT ma_loai
      FROM loai_phong
      WHERE ma_loai = ${loai_phong}
      LIMIT 1
    `

    if (existedLoaiPhong.length === 0) {
      return res.status(400).json({
        message: 'Loại phòng không hợp lệ.'
      })
    }

    const existedChiNhanh = await prisma.$queryRaw`
      SELECT ma_cn
      FROM chi_nhanh
      WHERE ma_cn = ${chi_nhanh}
      LIMIT 1
    `

    if (existedChiNhanh.length === 0) {
      return res.status(400).json({
        message: 'Chi nhánh không hợp lệ.'
      })
    }

    const oldCapacity = Number(existedRoom[0].suc_chua_toi_da)

    await prisma.$transaction(async (tx) => {
      // 1. Nếu giảm sức chứa, phải xóa các giường vượt quá sức chứa mới.
      // Chỉ cho xóa nếu các giường đó chưa bị đặt cọc/đang dùng/chưa có liên kết.
      if (capacity < oldCapacity) {
        const bedsToRemove = []

        for (let i = capacity + 1; i <= oldCapacity; i++) {
          bedsToRemove.push(`G${String(i).padStart(2, '0')}`)
        }

        const restrictedBeds = await tx.$queryRaw`
          SELECT ma_giuong, trang_thai
          FROM giuong
          WHERE ma_phong = ${roomCode}
            AND ma_giuong IN (${Prisma.join(bedsToRemove)})
            AND trang_thai IN (${`Đã đặt cọc`}, ${`Đang sử dụng`})
          LIMIT 1
        `

        if (restrictedBeds.length > 0) {
          throw new Error(UPDATE_BLOCKED_MESSAGE)
        }

        const usedInDeposit = await tx.$queryRaw`
          SELECT ma_pdc, ma_phong, ma_giuong
          FROM dat_coc_giuong
          WHERE ma_phong = ${roomCode}
            AND ma_giuong IN (${Prisma.join(bedsToRemove)})
          LIMIT 1
        `

        if (usedInDeposit.length > 0) {
          throw new Error(UPDATE_BLOCKED_MESSAGE)
        }

        await tx.$executeRaw`
          DELETE FROM giuong
          WHERE ma_phong = ${roomCode}
            AND ma_giuong IN (${Prisma.join(bedsToRemove)})
        `
      }

      // 2. Nếu tăng sức chứa, tự sinh thêm giường Gxx.
      if (capacity > oldCapacity) {
        for (let i = oldCapacity + 1; i <= capacity; i++) {
          const maGiuong = `G${String(i).padStart(2, '0')}`

          await tx.$executeRaw`
            INSERT INTO giuong (ma_giuong, ma_phong, trang_thai)
            VALUES (${maGiuong}, ${roomCode}, ${'Trống'})
          `
        }
      }

      // 3. Cập nhật thông tin phòng.
      await tx.$executeRaw`
        UPDATE phong
        SET
          suc_chua_toi_da = ${capacity},
          ma_loai = ${loai_phong},
          chi_nhanh = ${chi_nhanh}
        WHERE ma_phong = ${roomCode}
      `
    })

    res.json({
      message: 'Cập nhật thông tin phòng thành công.'
    })
  } catch (error) {
    const isForeignKeyError =
      error.code === '23503' ||
      error.code === 'P2003' ||
      error.meta?.code === '23503' ||
      (error.code === 'P2010' && error.meta?.code === '23503')

    if (error.message === UPDATE_BLOCKED_MESSAGE || isForeignKeyError) {
      return res.status(400).json({
        message: UPDATE_BLOCKED_MESSAGE
      })
    }

    next(error)
  }
}