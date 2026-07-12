import { Prisma } from '@prisma/client'
import prisma from '../config/prisma.js'

const RETURNED_WARNING =
  'Hợp đồng thuê của khách hàng đã hết hiệu lực. Vui lòng không cấp thẻ mới.'

const toBoolean = value => {
  return value === true || value === 't' || value === 'true' || value === 1
}

const getCurrentEmployee = async req => {
  const maNv =
    req.auth?.ma_nv ||
    req.authSession?.ma_nv ||
    req.body?.nv_quan_ly ||
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

/**
 * Khách còn hợp đồng thuê hiệu lực ở chi nhánh hiện tại:
 * - Có khach_thue -> hop_dong_thue -> dat_coc_giuong -> phong cùng chi nhánh
 * - Chưa có hồ sơ trả phòng chưa hủy cho hợp đồng đó
 */
const buildActiveContractExistsSql = maCn => Prisma.sql`
  EXISTS (
    SELECT 1
    FROM khach_thue kt
    JOIN hop_dong_thue hdt ON hdt.ma_hdt = kt.ma_hdt
    JOIN phieu_dat_coc pdc ON pdc.ma_pdc = hdt.ma_pdc
    JOIN dat_coc_giuong dcg ON dcg.ma_pdc = pdc.ma_pdc
    JOIN phong p ON p.ma_phong = dcg.ma_phong
    WHERE kt.ma_kh = kh.ma_kh
      AND p.chi_nhanh = ${maCn}
      AND NOT EXISTS (
        SELECT 1
        FROM ho_so_tra_phong hstp
        WHERE hstp.ma_khach_thue = kt.ma_kh
          AND hstp.ma_hdt = kt.ma_hdt
          AND hstp.ngay_huy IS NULL
      )
  )
`

/**
 * Khách có hồ sơ trả phòng hôm nay ở chi nhánh hiện tại.
 * Trường hợp này vẫn load lên để cho phép ghi nhận bồi thường mất thẻ.
 */
const buildReturnedTodayExistsSql = maCn => Prisma.sql`
  EXISTS (
    SELECT 1
    FROM ho_so_tra_phong hstp
    JOIN phieu_dat_coc pdc ON pdc.ma_pdc = hstp.ma_pdc
    JOIN dat_coc_giuong dcg ON dcg.ma_pdc = pdc.ma_pdc
    JOIN phong p ON p.ma_phong = dcg.ma_phong
    WHERE hstp.ma_khach_thue = kh.ma_kh
      AND hstp.ngay_huy IS NULL
      AND DATE(hstp.ngay_tp) = CURRENT_DATE
      AND p.chi_nhanh = ${maCn}
  )
`

/**
 * Lấy mã phòng:
 * - Nếu khách còn hợp đồng hiệu lực: lấy phòng từ hợp đồng đang thuê.
 * - Nếu khách trả phòng hôm nay: lấy phòng từ HSTP hôm nay.
 */
const buildRoomTextSql = maCn => Prisma.sql`
  COALESCE(
    (
      SELECT STRING_AGG(DISTINCT room_data.ma_phong, ', ' ORDER BY room_data.ma_phong)
      FROM (
        SELECT dcg.ma_phong
        FROM khach_thue kt
        JOIN hop_dong_thue hdt ON hdt.ma_hdt = kt.ma_hdt
        JOIN phieu_dat_coc pdc ON pdc.ma_pdc = hdt.ma_pdc
        JOIN dat_coc_giuong dcg ON dcg.ma_pdc = pdc.ma_pdc
        JOIN phong p ON p.ma_phong = dcg.ma_phong
        WHERE kt.ma_kh = kh.ma_kh
          AND p.chi_nhanh = ${maCn}
          AND NOT EXISTS (
            SELECT 1
            FROM ho_so_tra_phong hstp
            WHERE hstp.ma_khach_thue = kt.ma_kh
              AND hstp.ma_hdt = kt.ma_hdt
              AND hstp.ngay_huy IS NULL
          )

        UNION

        SELECT dcg.ma_phong
        FROM ho_so_tra_phong hstp
        JOIN phieu_dat_coc pdc ON pdc.ma_pdc = hstp.ma_pdc
        JOIN dat_coc_giuong dcg ON dcg.ma_pdc = pdc.ma_pdc
        JOIN phong p ON p.ma_phong = dcg.ma_phong
        WHERE hstp.ma_khach_thue = kh.ma_kh
          AND hstp.ngay_huy IS NULL
          AND DATE(hstp.ngay_tp) = CURRENT_DATE
          AND p.chi_nhanh = ${maCn}
      ) room_data
    ),
    ''
  )
`

/**
 * Lấy mã HSTP hôm nay nếu khách đã trả phòng hôm nay.
 */
const buildReturnTodayTextSql = maCn => Prisma.sql`
  COALESCE(
    (
      SELECT STRING_AGG(DISTINCT hstp.ma_tp, ', ' ORDER BY hstp.ma_tp)
      FROM ho_so_tra_phong hstp
      JOIN phieu_dat_coc pdc ON pdc.ma_pdc = hstp.ma_pdc
      JOIN dat_coc_giuong dcg ON dcg.ma_pdc = pdc.ma_pdc
      JOIN phong p ON p.ma_phong = dcg.ma_phong
      WHERE hstp.ma_khach_thue = kh.ma_kh
        AND hstp.ngay_huy IS NULL
        AND DATE(hstp.ngay_tp) = CURRENT_DATE
        AND p.chi_nhanh = ${maCn}
    ),
    ''
  )
`

const mapCustomerRow = row => {
  const isReturnedToday = toBoolean(row.hop_dong_het_hieu_luc)

  return {
    ma_kh: row.ma_kh,
    ten_khach_hang: row.ten_khach_hang || row.ma_kh,
    cccd: row.cccd || '',
    sdt: row.sdt || '',

    ma_phong: row.ma_phong || '',
    ma_tp: row.ma_tp || '',

    hop_dong_het_hieu_luc: isReturnedToday,
    canh_bao: isReturnedToday ? RETURNED_WARNING : null,
  }
}

const mapHistoryRow = row => {
  const isReturnedToday = toBoolean(row.hop_dong_het_hieu_luc)

  return {
    ma_bt: row.ma_bt,
    ngay_bt: row.ngay_bt,
    ma_kh: row.ma_kh,
    nv_quan_ly: row.nv_quan_ly,

    ten_khach_hang: row.ten_khach_hang || row.ma_kh,
    cccd: row.cccd || '',
    sdt: row.sdt || '',

    ma_phong: row.ma_phong || '',
    ma_tp: row.ma_tp || '',

    hop_dong_het_hieu_luc: isReturnedToday,
    canh_bao: isReturnedToday ? RETURNED_WARNING : null,

    loai_boi_thuong: 'Mất thẻ ra vào ký túc xá',
  }
}

export const getBoiThuongPageData = async (req, res, next) => {
  try {
    const currentEmployee = await getCurrentEmployee(req)

    if (!currentEmployee?.ma_cn) {
      return res.status(401).json({
        message: 'Không xác định được chi nhánh của nhân viên đang đăng nhập.',
      })
    }

    const maCn = currentEmployee.ma_cn
    const { nameSql, phoneSql } = await getCustomerColumnSql()

    /**
     * Chỉ load khách hàng nếu:
     * 1. Có hợp đồng thuê còn hiệu lực ở cùng chi nhánh
     * HOẶC
     * 2. Có HSTP hôm nay ở cùng chi nhánh
     *
     * Nếu khách không có phòng, không có HSTP hôm nay => KHÔNG load.
     */
    const customers = await prisma.$queryRaw`
      SELECT
        kh.ma_kh,
        ${nameSql} AS ten_khach_hang,
        kh.cccd,
        ${phoneSql} AS sdt,

        ${buildRoomTextSql(maCn)} AS ma_phong,
        ${buildReturnTodayTextSql(maCn)} AS ma_tp,

        ${buildReturnedTodayExistsSql(maCn)} AS hop_dong_het_hieu_luc

      FROM khach_hang kh

      WHERE
        ${buildActiveContractExistsSql(maCn)}
        OR ${buildReturnedTodayExistsSql(maCn)}

      ORDER BY kh.ma_kh ASC
    `

    /**
     * Lịch sử bồi thường hôm nay:
     * Chỉ lấy biên bản do nhân viên quản lý cùng chi nhánh tạo.
     */
    const history = await prisma.$queryRaw`
      SELECT
        bt.ma_bt,
        bt.ngay_bt,
        bt.ma_kh,
        bt.nv_quan_ly,

        ${nameSql} AS ten_khach_hang,
        kh.cccd,
        ${phoneSql} AS sdt,

        ${buildRoomTextSql(maCn)} AS ma_phong,
        ${buildReturnTodayTextSql(maCn)} AS ma_tp,

        ${buildReturnedTodayExistsSql(maCn)} AS hop_dong_het_hieu_luc

      FROM boi_thuong bt
      JOIN khach_hang kh ON kh.ma_kh = bt.ma_kh
      JOIN nhanvien nv ON nv.ma_nv = bt.nv_quan_ly

      WHERE DATE(bt.ngay_bt) = CURRENT_DATE
        AND bt.nv_quan_ly = ${currentEmployee.ma_nv}

      ORDER BY bt.ngay_bt DESC, bt.ma_bt DESC
    `

    res.json({
      customers: customers.map(mapCustomerRow),
      history: history.map(mapHistoryRow),
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

export const createBoiThuong = async (req, res, next) => {
  try {
    const maKh = req.body?.ma_kh?.trim()
    const currentEmployee = await getCurrentEmployee(req)

    if (!maKh) {
      return res.status(400).json({
        message: 'Thiếu mã khách hàng.',
      })
    }

    if (!currentEmployee?.ma_nv || !currentEmployee?.ma_cn) {
      return res.status(401).json({
        message: 'Không xác định được nhân viên quản lý đang đăng nhập.',
      })
    }

    const maCn = currentEmployee.ma_cn
    const nvQuanLy = currentEmployee.ma_nv

    /**
     * Khi lưu cũng kiểm tra lại:
     * Khách phải còn hợp đồng ở chi nhánh hiện tại
     * hoặc có HSTP hôm nay ở chi nhánh hiện tại.
     */
    const eligibleRows = await prisma.$queryRaw`
      SELECT
        kh.ma_kh,
        ${buildRoomTextSql(maCn)} AS ma_phong,
        ${buildReturnTodayTextSql(maCn)} AS ma_tp,
        ${buildReturnedTodayExistsSql(maCn)} AS hop_dong_het_hieu_luc
      FROM khach_hang kh
      WHERE kh.ma_kh = ${maKh}
        AND (
          ${buildActiveContractExistsSql(maCn)}
          OR ${buildReturnedTodayExistsSql(maCn)}
        )
      LIMIT 1
    `

    if (eligibleRows.length === 0) {
      return res.status(400).json({
        message:
          'Khách hàng không có phòng đang thuê hoặc hồ sơ trả phòng hôm nay tại chi nhánh của bạn.',
      })
    }

    const insertedRows = await prisma.$queryRaw`
      INSERT INTO boi_thuong (
        ngay_bt,
        ma_kh,
        nv_quan_ly
      )
      VALUES (
        CURRENT_TIMESTAMP,
        ${maKh},
        ${nvQuanLy}
      )
      RETURNING
        ma_bt,
        ngay_bt,
        ma_kh,
        nv_quan_ly
    `

    const isReturnedToday = toBoolean(eligibleRows[0]?.hop_dong_het_hieu_luc)

    res.json({
      success: true,
      message: 'Tạo biên bản bồi thường thành công.',
      data: {
        ...insertedRows[0],
        ma_phong: eligibleRows[0]?.ma_phong || '',
        ma_tp: eligibleRows[0]?.ma_tp || '',
        hop_dong_het_hieu_luc: isReturnedToday,
        canh_bao: isReturnedToday ? RETURNED_WARNING : null,
      },
    })
  } catch (error) {
    next(error)
  }
}