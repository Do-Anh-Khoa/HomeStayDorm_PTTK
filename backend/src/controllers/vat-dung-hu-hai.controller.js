import { Prisma } from '@prisma/client'
import prisma from '../config/prisma.js'

const normalizeBoolean = value => {
  return value === true || value === 'true' || value === 1 || value === '1' || value === 't'
}

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
      ma_nv,
      ten_nv,
      ma_cn
    FROM nhanvien
    WHERE ma_nv = ${maNv}
    LIMIT 1
  `

  return rows[0] || null
}

const buildSameBranchExistsSql = maCn => Prisma.sql`
  EXISTS (
    SELECT 1
    FROM dat_coc_giuong dcg
    JOIN phong p ON p.ma_phong = dcg.ma_phong
    WHERE dcg.ma_pdc = h.ma_pdc
      AND p.chi_nhanh = ${maCn}
  )
`

const mapReturnRoomRow = row => ({
  ma_tp: row.ma_tp,
  ngay_tp: row.ngay_tp,
  ngay_huy: row.ngay_huy,

  ma_pdc: row.ma_pdc,
  ma_hdt: row.ma_hdt,
  ma_khach_thue: row.ma_khach_thue,

  cccd: row.cccd,
  sdt: row.sdt,
  ten_khach_hang: row.ten_khach_hang || row.ma_khach_thue,

  ma_phong: row.ma_phong || 'Chưa có phòng',
  ghi_nhan_hu_hai: normalizeBoolean(row.ghi_nhan_hu_hai),
})

const mapDetailItem = row => ({
  ma_vd: row.ma_vd,
  ma_bb: row.ma_bb,
  ten_vd: row.ten_vd,
  so_luong_ban_giao: Number(row.so_luong_ban_giao || 0),
  tinh_trang: row.tinh_trang || '',
  gia_boi_thuong: Number(row.gia_boi_thuong || 0),
  sl_hu_hai: Number(row.sl_hu_hai || 0),
})

const getCustomerColumnSql = async () => {
  const rows = await prisma.$queryRaw`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'khach_hang'
  `

  const columns = new Set(rows.map(row => row.column_name))

  const nameColumn =
    ['ten_kh', 'ho_ten', 'ten_khach_hang', 'hoten'].find(column =>
      columns.has(column),
    ) || null

  const phoneColumn =
    ['sdt', 'so_dien_thoai', 'dien_thoai', 'phone'].find(column =>
      columns.has(column),
    ) || null

  return {
    nameSql: nameColumn ? Prisma.raw(`kh.${nameColumn}`) : Prisma.raw('kh.ma_kh'),
    phoneSql: phoneColumn ? Prisma.raw(`kh.${phoneColumn}`) : Prisma.raw('NULL'),
  }
}

const getBaseReturnRoomSql = (nameSql, phoneSql, maCn) => Prisma.sql`
  SELECT
    h.ma_tp,
    h.ngay_tp,
    h.ngay_huy,
    h.ma_pdc,
    h.ma_hdt,
    h.ma_khach_thue,
    h.ghi_nhan_hu_hai,

    kh.cccd,
    ${phoneSql} AS sdt,
    ${nameSql} AS ten_khach_hang,

    COALESCE(
      (
        SELECT STRING_AGG(DISTINCT dcg.ma_phong, ', ' ORDER BY dcg.ma_phong)
        FROM dat_coc_giuong dcg
        JOIN phong p ON p.ma_phong = dcg.ma_phong
        WHERE dcg.ma_pdc = h.ma_pdc
          AND p.chi_nhanh = ${maCn}
      ),
      ''
    ) AS ma_phong

  FROM ho_so_tra_phong h
  JOIN khach_hang kh ON kh.ma_kh = h.ma_khach_thue
`

export const getVatDungHuHaiList = async (req, res, next) => {
  try {
    const currentEmployee = await getCurrentEmployee(req)

    if (!currentEmployee?.ma_cn) {
      return res.status(401).json({
        message: 'Không xác định được chi nhánh của nhân viên đang đăng nhập.',
      })
    }

    const maCn = currentEmployee.ma_cn
    const { nameSql, phoneSql } = await getCustomerColumnSql()

    const pendingRows = await prisma.$queryRaw`
      ${getBaseReturnRoomSql(nameSql, phoneSql, maCn)}

      WHERE h.ngay_huy IS NULL
        AND h.ma_hdt IS NOT NULL
        AND h.ghi_nhan_hu_hai = FALSE
        AND ${buildSameBranchExistsSql(maCn)}

      ORDER BY h.ngay_tp DESC, h.ma_tp DESC
    `

    const historyRows = await prisma.$queryRaw`
      ${getBaseReturnRoomSql(nameSql, phoneSql, maCn)}

      WHERE h.ghi_nhan_hu_hai = TRUE
        AND ${buildSameBranchExistsSql(maCn)}

      ORDER BY h.ngay_tp DESC, h.ma_tp DESC
    `

    res.json({
      pending: pendingRows.map(mapReturnRoomRow),
      history: historyRows.map(mapReturnRoomRow),
      currentBranch: {
        ma_cn: maCn,
        ma_nv: currentEmployee.ma_nv,
        ten_nv: currentEmployee.ten_nv,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getVatDungHuHaiDetail = async (req, res, next) => {
  try {
    const maTp = req.params.ma_tp?.trim().toUpperCase()

    if (!maTp) {
      return res.status(400).json({
        message: 'Mã trả phòng không hợp lệ.',
      })
    }

    const currentEmployee = await getCurrentEmployee(req)

    if (!currentEmployee?.ma_cn) {
      return res.status(401).json({
        message: 'Không xác định được chi nhánh của nhân viên đang đăng nhập.',
      })
    }

    const maCn = currentEmployee.ma_cn
    const { nameSql, phoneSql } = await getCustomerColumnSql()

    const headerRows = await prisma.$queryRaw`
      SELECT
        h.ma_tp,
        h.ngay_tp,
        h.ngay_huy,
        h.ma_pdc,
        h.ma_hdt,
        h.ma_khach_thue,
        h.ghi_nhan_hu_hai,

        kh.cccd,
        ${phoneSql} AS sdt,
        ${nameSql} AS ten_khach_hang,

        hd.tg_vao,

        COALESCE(
          (
            SELECT STRING_AGG(DISTINCT dcg.ma_phong, ', ' ORDER BY dcg.ma_phong)
            FROM dat_coc_giuong dcg
            JOIN phong p ON p.ma_phong = dcg.ma_phong
            WHERE dcg.ma_pdc = h.ma_pdc
              AND p.chi_nhanh = ${maCn}
          ),
          ''
        ) AS ma_phong

      FROM ho_so_tra_phong h
      JOIN khach_hang kh ON kh.ma_kh = h.ma_khach_thue
      LEFT JOIN hop_dong_thue hd ON hd.ma_hdt = h.ma_hdt

      WHERE h.ma_tp = ${maTp}
        AND ${buildSameBranchExistsSql(maCn)}

      LIMIT 1
    `

    if (headerRows.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy hồ sơ trả phòng thuộc chi nhánh của bạn.',
      })
    }

    const itemRows = await prisma.$queryRaw`
      SELECT
        vd.ma_vd,
        bb.ma_bb,
        vd.ten_vd,
        vd.gia_boi_thuong,

        vdbg.so_luong AS so_luong_ban_giao,
        vdbg.tinh_trang,

        COALESCE(vdh.sl_hu_hai, 0) AS sl_hu_hai

      FROM ho_so_tra_phong h
      JOIN bien_ban_ban_giao bb ON bb.ma_hdt = h.ma_hdt
      JOIN vd_bg vdbg ON vdbg.ma_bb = bb.ma_bb
      JOIN vat_dung vd ON vd.ma_vd = vdbg.ma_vd
      LEFT JOIN vat_dung_hu_hai vdh
        ON vdh.ma_tp = h.ma_tp
       AND vdh.ma_vd = vdbg.ma_vd
       AND vdh.ma_bb = vdbg.ma_bb

      WHERE h.ma_tp = ${maTp}
        AND ${buildSameBranchExistsSql(maCn)}

      ORDER BY vd.ten_vd ASC, vd.ma_vd ASC
    `

    const damagedCountRows = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM vat_dung_hu_hai
      WHERE ma_tp = ${maTp}
    `

    const hasDamageRows = Number(damagedCountRows[0]?.count || 0) > 0
    const header = mapReturnRoomRow(headerRows[0])

    res.json({
      ...header,
      tg_vao: headerRows[0].tg_vao,

      khong_co_vat_dung_hu_hai:
        normalizeBoolean(headerRows[0].ghi_nhan_hu_hai) && !hasDamageRows,

      items: itemRows.map(mapDetailItem),
    })
  } catch (error) {
    next(error)
  }
}

export const saveVatDungHuHai = async (req, res, next) => {
  try {
    const maTp = req.params.ma_tp?.trim().toUpperCase()
    const khongCoVatDungHuHai = normalizeBoolean(req.body?.khong_co_vat_dung_hu_hai)
    const items = Array.isArray(req.body?.items) ? req.body.items : []

    if (!maTp) {
      return res.status(400).json({
        message: 'Mã trả phòng không hợp lệ.',
      })
    }

    const currentEmployee = await getCurrentEmployee(req)

    if (!currentEmployee?.ma_cn) {
      return res.status(401).json({
        message: 'Không xác định được chi nhánh của nhân viên đang đăng nhập.',
      })
    }

    const maCn = currentEmployee.ma_cn

    await prisma.$transaction(async tx => {
      const hoSoRows = await tx.$queryRaw`
        SELECT
          h.ma_tp,
          h.ma_hdt
        FROM ho_so_tra_phong h
        WHERE h.ma_tp = ${maTp}
          AND ${buildSameBranchExistsSql(maCn)}
        LIMIT 1
      `

      if (hoSoRows.length === 0) {
        const error = new Error('Không tìm thấy hồ sơ trả phòng thuộc chi nhánh của bạn.')
        error.statusCode = 404
        throw error
      }

      await tx.$executeRaw`
        DELETE FROM vat_dung_hu_hai
        WHERE ma_tp = ${maTp}
      `

      if (khongCoVatDungHuHai) {
        await tx.$executeRaw`
          UPDATE ho_so_tra_phong
          SET ghi_nhan_hu_hai = TRUE
          WHERE ma_tp = ${maTp}
        `

        return
      }

      const damagedItems = items
        .map(item => ({
          ma_vd: String(item.ma_vd || '').trim(),
          ma_bb: String(item.ma_bb || '').trim(),
          sl_hu_hai: Number(item.sl_hu_hai || 0),
        }))
        .filter(item => item.ma_vd && item.ma_bb && item.sl_hu_hai > 0)

      if (damagedItems.length === 0) {
        const error = new Error(
          'Vui lòng nhập số lượng hư hại lớn hơn 0 hoặc chọn không có vật dụng hư hại.',
        )
        error.statusCode = 400
        throw error
      }

      const handedRows = await tx.$queryRaw`
        SELECT
          vdbg.ma_vd,
          vdbg.ma_bb,
          vdbg.so_luong
        FROM ho_so_tra_phong h
        JOIN bien_ban_ban_giao bb ON bb.ma_hdt = h.ma_hdt
        JOIN vd_bg vdbg ON vdbg.ma_bb = bb.ma_bb
        WHERE h.ma_tp = ${maTp}
          AND ${buildSameBranchExistsSql(maCn)}
      `

      const handedMap = new Map(
        handedRows.map(row => [
          `${row.ma_bb}__${row.ma_vd}`,
          Number(row.so_luong || 0),
        ]),
      )

      for (const item of damagedItems) {
        const key = `${item.ma_bb}__${item.ma_vd}`
        const handedQuantity = handedMap.get(key)

        if (handedQuantity === undefined) {
          const error = new Error(
            `Vật dụng ${item.ma_vd} không thuộc biên bản bàn giao của hồ sơ này.`,
          )
          error.statusCode = 400
          throw error
        }

        if (item.sl_hu_hai > handedQuantity) {
          const error = new Error(
            `Số lượng hư hại của vật dụng ${item.ma_vd} không được vượt quá số lượng bàn giao.`,
          )
          error.statusCode = 400
          throw error
        }
      }

      const insertValues = damagedItems.map(item => Prisma.sql`
        (${maTp}, ${item.ma_vd}, ${item.ma_bb}, ${item.sl_hu_hai})
      `)

      await tx.$executeRaw`
        INSERT INTO vat_dung_hu_hai (ma_tp, ma_vd, ma_bb, sl_hu_hai)
        VALUES ${Prisma.join(insertValues)}
      `

      await tx.$executeRaw`
        UPDATE ho_so_tra_phong
        SET ghi_nhan_hu_hai = TRUE
        WHERE ma_tp = ${maTp}
      `
    })

    res.json({
      success: true,
      message: 'Lưu ghi nhận vật dụng hư hại thành công.',
    })
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    next(error)
  }
}