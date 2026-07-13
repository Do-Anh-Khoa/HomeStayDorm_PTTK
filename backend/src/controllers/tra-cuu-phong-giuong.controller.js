import { Prisma } from '@prisma/client'
import prisma from '../config/prisma.js'

const ROOM_IMAGE =
  'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=900&q=80'

const getCurrentEmployee = async req => {
  const maNv =
    req.auth?.ma_nv ||
    req.authSession?.ma_nv ||
    null

  if (!maNv) {
    return null
  }

  const rows = await prisma.$queryRaw`
    SELECT
      nv.ma_nv,
      nv.ten_nv,
      nv.ma_cn,
      cn.ten_cn
    FROM nhanvien nv
    JOIN chi_nhanh cn ON cn.ma_cn = nv.ma_cn
    WHERE nv.ma_nv = ${maNv}
    LIMIT 1
  `

  return rows[0] || null
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

    gia_giuong: Number(row.gia_giuong || 0),

    gia_giuong: Number(row.gia_giuong || 0),

    thoi_han_toi_thieu: Number(row.thoi_han_toi_thieu || 0),
    thoi_han_toi_da: Number(row.thoi_han_toi_da || 0),

    so_giuong: Number(row.so_giuong || 0),

    trang_thai:
      Number(row.so_giuong_trong || 0) > 0
        ? 'Trống'
        : 'Hết giường',

    hinh_anh: ROOM_IMAGE,
    tien_ich: ['WiFi', ...tieuChi].slice(0, 3),

    tieu_chi: tieuChi,
    tieu_chi_text: row.tieu_chi_text || '',
  }
}

export const getTraCuuPhongGiuongOptions = async (req, res, next) => {
  try {
    const currentEmployee = await getCurrentEmployee(req)

    if (!currentEmployee?.ma_cn) {
      return res.status(401).json({
        message: 'Không xác định được chi nhánh của nhân viên đang đăng nhập.',
      })
    }

    const maCn = currentEmployee.ma_cn

    const loaiPhongOptions = await prisma.$queryRaw`
      SELECT
        lp.ma_loai AS value,
        lp.ten_loai AS label
      FROM loai_phong lp
      JOIN phong p ON p.ma_loai = lp.ma_loai
      WHERE p.chi_nhanh = ${maCn}
      GROUP BY
        lp.ma_loai,
        lp.ten_loai
      ORDER BY
        CASE
          WHEN lp.ma_loai = 'NAM_T' THEN 1
          WHEN lp.ma_loai = 'NU_T' THEN 2
          WHEN lp.ma_loai = 'NAM_TB' THEN 3
          WHEN lp.ma_loai = 'NU_TB' THEN 4
          WHEN lp.ma_loai = 'NAM_CC' THEN 5
          WHEN lp.ma_loai = 'NU_CC' THEN 6
          ELSE 99
        END,
        lp.ma_loai ASC
    `

    const tieuChiOptions = await prisma.$queryRaw`
      SELECT
        BTRIM(tc.ten_tc) AS value,
        BTRIM(tc.ten_tc) AS label
      FROM tieu_chi tc
      JOIN phong p ON p.ma_phong = tc.ma_phong
      WHERE tc.ten_tc IS NOT NULL
        AND BTRIM(tc.ten_tc) <> ''
        AND p.chi_nhanh = ${maCn}
      GROUP BY BTRIM(tc.ten_tc)
      ORDER BY BTRIM(tc.ten_tc) ASC
    `

    res.json({
      chi_nhanh: [
        {
          value: '',
          label: `${currentEmployee.ten_cn} - ${currentEmployee.ma_cn}`,
        },
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

      tieu_chi: tieuChiOptions,

      currentBranch: {
        ma_cn: currentEmployee.ma_cn,
        ten_cn: currentEmployee.ten_cn,
        ma_nv: currentEmployee.ma_nv,
        ten_nv: currentEmployee.ten_nv,
      },
    })
  } catch (error) {
    console.error('Lỗi load bộ lọc tra cứu phòng/giường:', error)
    next(error)
  }
}

export const getTraCuuPhongGiuongList = async (req, res, next) => {
  try {
    const currentEmployee = await getCurrentEmployee(req)

    if (!currentEmployee?.ma_cn) {
      return res.status(401).json({
        message: 'Không xác định được chi nhánh của nhân viên đang đăng nhập.',
      })
    }

    const maCn = currentEmployee.ma_cn

    const {
      search,
      loai_phong,
      trang_thai,
      tieu_chi,
    } = req.query

    const where = [
      Prisma.sql`p.chi_nhanh = ${maCn}`,
    ]

    const selectedCriteria = parseCriteriaQuery(tieu_chi)
    const searchRaw = String(search || '').trim()
    const searchText = searchRaw.toUpperCase()
    const searchRoomCode = searchText.replace(/[.\s-]/g, '')

    if (searchText) {
      if (searchText.startsWith('HSDK')) {
        const registrationRows = await prisma.$queryRaw`
          SELECT
            ma_dk,
            hinh_thuc_thue,
            so_nguoi,
            thoi_han_thue,
            tieu_chi,
            chi_nhanh
          FROM ho_so_dang_ky
          WHERE UPPER(ma_dk) = ${searchText}
            AND chi_nhanh = ${maCn}
          LIMIT 1
        `

        if (registrationRows.length === 0) {
          return res.json([])
        }

        const registration = registrationRows[0]
        const soNguoi = Number(registration.so_nguoi || 0)
        const thoiHanThue = Number(registration.thoi_han_thue || 0)

        const hinhThucThue = String(registration.hinh_thuc_thue || '')
          .trim()
          .toLowerCase()

        const registrationCriteria = String(registration.tieu_chi || '')
          .split(',')
          .map(item => item.trim())
          .filter(Boolean)

        if (soNguoi > 0) {
          if (hinhThucThue === 'nguyên phòng') {
            where.push(Prisma.sql`
              p.suc_chua_toi_da = ${soNguoi}
              AND (
                SELECT COUNT(*)::int
                FROM giuong gx
                WHERE gx.ma_phong = p.ma_phong
              ) = ${soNguoi}
              AND (
                SELECT COUNT(*)::int
                FROM giuong gx
                WHERE gx.ma_phong = p.ma_phong
                  AND gx.trang_thai = 'Trống'
              ) = ${soNguoi}
            `)
          } else {
            where.push(Prisma.sql`
              (
                SELECT COUNT(*)::int
                FROM giuong gx
                WHERE gx.ma_phong = p.ma_phong
                  AND gx.trang_thai = 'Trống'
              ) >= ${soNguoi}
            `)
          }
        }

        if (thoiHanThue > 0) {
          where.push(Prisma.sql`
            ${thoiHanThue} >= lp.thoi_han_toi_thieu
            AND ${thoiHanThue} <= lp.thoi_han_toi_da
          `)
        }

        if (registrationCriteria.length > 0) {
          const criteriaConditions = registrationCriteria.map(item => {
            const keyword = `%${item}%`

            return Prisma.sql`
              (
                tc_hsdk.ten_tc ILIKE ${keyword}
                OR lp.ten_loai ILIKE ${keyword}
              )
            `
          })

          where.push(Prisma.sql`
            EXISTS (
              SELECT 1
              FROM tieu_chi tc_hsdk
              WHERE tc_hsdk.ma_phong = p.ma_phong
                AND (
                  ${Prisma.join(criteriaConditions, ' OR ')}
                )
            )
          `)
        }
      } else {
        where.push(Prisma.sql`
          (
            UPPER(p.ma_phong) LIKE ${`%${searchText}%`}
            OR REPLACE(REPLACE(REPLACE(UPPER(p.ma_phong), '.', ''), '-', ''), ' ', '') LIKE ${`%${searchRoomCode}%`}
          )
        `)
      }
    }

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

    if (selectedCriteria.length > 0) {
      where.push(Prisma.sql`
        EXISTS (
          SELECT 1
          FROM tieu_chi tc_filter
          JOIN phong p_filter ON p_filter.ma_phong = tc_filter.ma_phong
          WHERE tc_filter.ma_phong = p.ma_phong
            AND BTRIM(tc_filter.ten_tc) IN (${Prisma.join(selectedCriteria)})
            AND p_filter.chi_nhanh = ${maCn}
        )
      `)
}

    const whereSql = Prisma.sql`WHERE ${Prisma.join(where, ' AND ')}`

    const rows = await prisma.$queryRaw`
      SELECT
        p.ma_phong,
        p.suc_chua_toi_da AS suc_chua,

        p.ma_loai,
        lp.ten_loai,
        lp.gia_giuong,
        lp.thoi_han_toi_thieu,
        lp.thoi_han_toi_da,

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
        lp.gia_giuong,
        lp.thoi_han_toi_thieu,
        lp.thoi_han_toi_da,
        p.chi_nhanh,
        cn.ten_cn

      ORDER BY p.ma_phong ASC
    `

    res.json(rows.map(mapRoomRow))
  } catch (error) {
    console.error('Lỗi load danh sách phòng/giường:', error)

    res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách phòng/giường.',
      error: error.message,
    })
  }
}

export const getTraCuuPhongGiuongDetail = async (req, res, next) => {
  try {
    const currentEmployee = await getCurrentEmployee(req)

    if (!currentEmployee?.ma_cn) {
      return res.status(401).json({
        message: 'Không xác định được chi nhánh của nhân viên đang đăng nhập.',
      })
    }

    const maCn = currentEmployee.ma_cn
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
        lp.gia_giuong,
        lp.thoi_han_toi_thieu,
        lp.thoi_han_toi_da,

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
        AND p.chi_nhanh = ${maCn}

      GROUP BY
        p.ma_phong,
        p.suc_chua_toi_da,
        p.ma_loai,
        lp.ma_loai,
        lp.ten_loai,
        lp.gia_giuong,
        lp.thoi_han_toi_thieu,
        lp.thoi_han_toi_da,
        p.chi_nhanh,
        cn.ten_cn

      LIMIT 1
    `

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy phòng thuộc chi nhánh của bạn.',
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
        AND p.chi_nhanh = ${maCn}
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