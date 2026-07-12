import { Prisma } from '@prisma/client'
import prisma from '../config/prisma.js'

const ROOM_IMAGE =
  'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=900&q=80'

const formatMoneyRange = price => {
  const number = Number(price)

  if (number < 2000000) return 'DUOI_2_TRIEU'
  if (number <= 3000000) return 'TU_2_DEN_3_TRIEU'
  return 'TREN_3_TRIEU'
}

const formatDisplayRoomCode = maPhong => {
  if (!maPhong) return ''

  return maPhong.replace(/^([A-Za-z]+)(\d+)$/, '$1.$2')
}

const splitCriteriaText = text => {
  if (!text) return []

  return String(text)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

const parseCriteriaQuery = value => {
  if (!value) return []

  if (Array.isArray(value)) {
    return value
      .flatMap(item => String(item).split(','))
      .map(item => item.trim())
      .filter(Boolean)
  }

  return String(value)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

const buildHangPhongSql = () => Prisma.sql`
  CASE
    WHEN RIGHT(lp.ma_loai, 3) = '_TB' THEN 'TRUNG_BINH'
    WHEN RIGHT(lp.ma_loai, 3) = '_CC' THEN 'CAO_CAP'
    ELSE 'THUONG'
  END
`

const buildGioiTinhSql = () => Prisma.sql`
  CASE
    WHEN LEFT(lp.ma_loai, 4) = 'NAM_' THEN 'Nam'
    WHEN LEFT(lp.ma_loai, 3) = 'NU_' THEN 'Nữ'
    ELSE 'Không xác định'
  END
`

const mapRoomRow = row => {
  const tieuChi = splitCriteriaText(row.tieu_chi_text)

  return {
    ma_phong: row.ma_phong,
    ten_hien_thi: formatDisplayRoomCode(row.ma_phong),

    ma_loai: row.ma_loai,
    ten_loai: row.ten_loai,
    hang_phong: row.hang_phong,

    chi_nhanh: row.chi_nhanh,
    ten_chi_nhanh: row.ten_chi_nhanh,

    suc_chua: Number(row.suc_chua || 0),
    gioi_tinh: row.gioi_tinh,

    // Giá ngoài card phòng
    gia_nguyen_phong: Number(row.gia_nguyen_phong || 0),

    // Giá giường, dùng cho modal chi tiết
    gia_giuong: Number(row.gia_giuong || 0),

    muc_gia: formatMoneyRange(row.gia_nguyen_phong || row.gia_giuong),

    so_giuong: Number(row.so_giuong || 0),
    so_giuong_trong: Number(row.so_giuong_trong || 0),

    trang_thai:
      Number(row.so_giuong_trong || 0) > 0
        ? 'Trống'
        : 'Hết giường',

    hinh_anh: ROOM_IMAGE,
    tien_ich: ['WiFi', ...tieuChi].slice(0, 3),

    // Mảng tiêu chí cho frontend lọc checkbox
    tieu_chi: tieuChi,

    // Chuỗi tiêu chí để hiện trong modal
    tieu_chi_text: row.tieu_chi_text || '',
  }
}

export const getTraCuuPhongGiuongOptions = async (req, res, next) => {
  try {
    const chiNhanhOptions = await prisma.$queryRaw`
      SELECT
        ma_cn AS value,
        ten_cn AS label
      FROM chi_nhanh
      ORDER BY ma_cn ASC
    `

    const loaiPhongOptions = await prisma.$queryRaw`
      SELECT
        ma_loai AS value,
        ten_loai AS label
      FROM loai_phong
      ORDER BY
        CASE
          WHEN ma_loai = 'NAM_T' THEN 1
          WHEN ma_loai = 'NU_T' THEN 2
          WHEN ma_loai = 'NAM_TB' THEN 3
          WHEN ma_loai = 'NU_TB' THEN 4
          WHEN ma_loai = 'NAM_CC' THEN 5
          WHEN ma_loai = 'NU_CC' THEN 6
          ELSE 99
        END,
        ma_loai ASC
    `

    const tieuChiOptions = await prisma.$queryRaw`
      SELECT DISTINCT
        BTRIM(ten_tc) AS value,
        BTRIM(ten_tc) AS label
      FROM tieu_chi
      WHERE ten_tc IS NOT NULL
        AND BTRIM(ten_tc) <> ''
      ORDER BY value ASC
    `

    res.json({
      chi_nhanh: [
        { value: '', label: 'Tất cả chi nhánh' },
        ...chiNhanhOptions,
      ],

      loai_phong: [
        { value: '', label: 'Tất cả loại phòng' },
        ...loaiPhongOptions,
      ],

      trang_thai: [
        { value: '', label: 'Tất cả tình trạng' },
        { value: 'Trống', label: 'Trống' },
        { value: 'Đã đặt cọc', label: 'Đã đặt cọc' },
        { value: 'Đang sử dụng', label: 'Đang sử dụng' },
      ],

      // Frontend hiện tại đã bỏ mức giá, nhưng để lại cũng không sao.
      muc_gia: [
        { value: '', label: 'Tất cả mức giá' },
        { value: 'DUOI_2_TRIEU', label: 'Dưới 2 triệu' },
        { value: 'TU_2_DEN_3_TRIEU', label: 'Từ 2 - 3 triệu' },
        { value: 'TREN_3_TRIEU', label: 'Trên 3 triệu' },
      ],

      tieu_chi: tieuChiOptions,
    })
  } catch (error) {
    next(error)
  }
}

export const getTraCuuPhongGiuongList = async (req, res, next) => {
  try {
    const {
      chi_nhanh,
      loai_phong,
      trang_thai,
      muc_gia,
      tieu_chi,
    } = req.query

    const where = []
    const selectedCriteria = parseCriteriaQuery(tieu_chi)

    if (chi_nhanh) {
      where.push(Prisma.sql`p.chi_nhanh = ${chi_nhanh}`)
    }

    // Frontend gửi mã loại phòng thật:
    // NAM_T / NU_T / NAM_TB / NU_TB / NAM_CC / NU_CC
    if (loai_phong) {
      where.push(Prisma.sql`p.ma_loai = ${loai_phong}`)
    }

    if (trang_thai) {
      where.push(Prisma.sql`
        EXISTS (
          SELECT 1
          FROM giuong gx
          WHERE gx.ma_phong = p.ma_phong
            AND gx.trang_thai = ${trang_thai}
        )
      `)
    }

    // Frontend hiện tại bỏ mức giá, nhưng nếu còn gửi thì backend vẫn xử lý được.
    if (muc_gia === 'DUOI_2_TRIEU') {
      where.push(Prisma.sql`lp.gia_nguyen_phong < 2000000`)
    }

    if (muc_gia === 'TU_2_DEN_3_TRIEU') {
      where.push(Prisma.sql`
        lp.gia_nguyen_phong >= 2000000
        AND lp.gia_nguyen_phong <= 3000000
      `)
    }

    if (muc_gia === 'TREN_3_TRIEU') {
      where.push(Prisma.sql`lp.gia_nguyen_phong > 3000000`)
    }

    if (selectedCriteria.length > 0) {
      where.push(Prisma.sql`
        p.ma_phong IN (
          SELECT tc_filter.ma_phong
          FROM tieu_chi tc_filter
          WHERE BTRIM(tc_filter.ten_tc) IN (${Prisma.join(selectedCriteria)})
          GROUP BY tc_filter.ma_phong
          HAVING COUNT(DISTINCT BTRIM(tc_filter.ten_tc)) = ${selectedCriteria.length}
        )
      `)
    }

    const whereSql = where.length
      ? Prisma.sql`WHERE ${Prisma.join(where, ' AND ')}`
      : Prisma.empty

    const rows = await prisma.$queryRaw`
      SELECT
        p.ma_phong,
        p.suc_chua_toi_da AS suc_chua,

        p.ma_loai,
        lp.ten_loai,
        lp.gia_nguyen_phong,
        lp.gia_giuong,

        ${buildHangPhongSql()} AS hang_phong,
        ${buildGioiTinhSql()} AS gioi_tinh,

        p.chi_nhanh AS chi_nhanh,
        cn.ten_cn AS ten_chi_nhanh,

        COUNT(DISTINCT g.ma_giuong) AS so_giuong,
        COUNT(DISTINCT g.ma_giuong) FILTER (WHERE g.trang_thai = 'Trống') AS so_giuong_trong,

        COALESCE(
          STRING_AGG(DISTINCT BTRIM(tc.ten_tc), ', ' ORDER BY BTRIM(tc.ten_tc)),
          ''
        ) AS tieu_chi_text

      FROM phong p
      JOIN loai_phong lp ON lp.ma_loai = p.ma_loai
      JOIN chi_nhanh cn ON cn.ma_cn = p.chi_nhanh
      LEFT JOIN giuong g ON g.ma_phong = p.ma_phong
      LEFT JOIN tieu_chi tc ON tc.ma_phong = p.ma_phong

      ${whereSql}

      GROUP BY
        p.ma_phong,
        p.suc_chua_toi_da,
        p.ma_loai,
        lp.ma_loai,
        lp.ten_loai,
        lp.gia_nguyen_phong,
        lp.gia_giuong,
        p.chi_nhanh,
        cn.ten_cn

      ORDER BY p.ma_phong ASC
    `

    res.json(rows.map(mapRoomRow))
  } catch (error) {
    next(error)
  }
}

export const getTraCuuPhongGiuongDetail = async (req, res, next) => {
  try {
    const roomCode = req.params.ma_phong?.trim().toUpperCase()

    if (!roomCode) {
      return res.status(400).json({
        message: 'Mã phòng không hợp lệ.',
      })
    }

    const rows = await prisma.$queryRaw`
      SELECT
        p.ma_phong,
        p.suc_chua_toi_da AS suc_chua,

        p.ma_loai,
        lp.ten_loai,
        lp.gia_nguyen_phong,
        lp.gia_giuong,

        ${buildHangPhongSql()} AS hang_phong,
        ${buildGioiTinhSql()} AS gioi_tinh,

        p.chi_nhanh AS chi_nhanh,
        cn.ten_cn AS ten_chi_nhanh,

        COUNT(DISTINCT g.ma_giuong) AS so_giuong,
        COUNT(DISTINCT g.ma_giuong) FILTER (WHERE g.trang_thai = 'Trống') AS so_giuong_trong,

        COALESCE(
          STRING_AGG(DISTINCT BTRIM(tc.ten_tc), ', ' ORDER BY BTRIM(tc.ten_tc)),
          ''
        ) AS tieu_chi_text

      FROM phong p
      JOIN loai_phong lp ON lp.ma_loai = p.ma_loai
      JOIN chi_nhanh cn ON cn.ma_cn = p.chi_nhanh
      LEFT JOIN giuong g ON g.ma_phong = p.ma_phong
      LEFT JOIN tieu_chi tc ON tc.ma_phong = p.ma_phong

      WHERE p.ma_phong = ${roomCode}

      GROUP BY
        p.ma_phong,
        p.suc_chua_toi_da,
        p.ma_loai,
        lp.ma_loai,
        lp.ten_loai,
        lp.gia_nguyen_phong,
        lp.gia_giuong,
        p.chi_nhanh,
        cn.ten_cn

      LIMIT 1
    `

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy phòng.',
      })
    }

    const beds = await prisma.$queryRaw`
      SELECT
        g.ma_giuong,
        g.trang_thai,
        lp.gia_giuong AS don_gia
      FROM giuong g
      JOIN phong p ON p.ma_phong = g.ma_phong
      JOIN loai_phong lp ON lp.ma_loai = p.ma_loai
      WHERE g.ma_phong = ${roomCode}
      ORDER BY g.ma_giuong ASC
    `

    const room = mapRoomRow(rows[0])

    res.json({
      ...room,
      beds: beds.map(bed => ({
        ma_giuong: bed.ma_giuong,
        trang_thai: bed.trang_thai,
        don_gia: Number(bed.don_gia || 0),
      })),
    })
  } catch (error) {
    next(error)
  }
}