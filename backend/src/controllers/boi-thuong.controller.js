import { Prisma } from '@prisma/client'
import prisma from '../config/prisma.js'

const getCurrentEmployeeId = async req => {
  const maNv =
    req.auth?.ma_nv ||
    req.authSession?.ma_nv ||
    req.body?.nv_quan_ly ||
    null

  if (!maNv) {
    return null
  }

  const rows = await prisma.$queryRaw`
    SELECT ma_nv
    FROM nhanvien
    WHERE ma_nv = ${maNv}
    LIMIT 1
  `

  return rows[0]?.ma_nv || null
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

const mapCustomerRow = row => ({
  ma_kh: row.ma_kh,
  ten_khach_hang: row.ten_khach_hang || row.ma_kh,
  cccd: row.cccd || '',
  sdt: row.sdt || '',
})

const mapHistoryRow = row => ({
  ma_bt: row.ma_bt,
  ngay_bt: row.ngay_bt,
  ma_kh: row.ma_kh,
  nv_quan_ly: row.nv_quan_ly,

  ten_khach_hang: row.ten_khach_hang || row.ma_kh,
  cccd: row.cccd || '',
  sdt: row.sdt || '',

  loai_boi_thuong: 'Mất thẻ ra vào ký túc xá',
})

export const getBoiThuongPageData = async (req, res, next) => {
  try {
    const { nameSql, phoneSql } = await getCustomerColumnSql()

    // Load tất cả khách hàng
    const customers = await prisma.$queryRaw`
      SELECT
        kh.ma_kh,
        ${nameSql} AS ten_khach_hang,
        kh.cccd,
        ${phoneSql} AS sdt
      FROM khach_hang kh
      ORDER BY kh.ma_kh ASC
    `

    // Load lịch sử bồi thường trong ngày hôm nay
    const history = await prisma.$queryRaw`
      SELECT
        bt.ma_bt,
        bt.ngay_bt,
        bt.ma_kh,
        bt.nv_quan_ly,

        ${nameSql} AS ten_khach_hang,
        kh.cccd,
        ${phoneSql} AS sdt

      FROM boi_thuong bt
      JOIN khach_hang kh ON kh.ma_kh = bt.ma_kh

      WHERE DATE(bt.ngay_bt) = CURRENT_DATE

      ORDER BY bt.ngay_bt DESC, bt.ma_bt DESC
    `

    res.json({
      customers: customers.map(mapCustomerRow),
      history: history.map(mapHistoryRow),
    })
  } catch (error) {
    next(error)
  }
}

export const createBoiThuong = async (req, res, next) => {
  try {
    const maKh = req.body?.ma_kh?.trim()
    const nvQuanLy = await getCurrentEmployeeId(req)

    if (!maKh) {
      return res.status(400).json({
        message: 'Thiếu mã khách hàng.',
      })
    }

    if (!nvQuanLy) {
      return res.status(401).json({
        message: 'Không xác định được nhân viên quản lý đang đăng nhập.',
      })
    }

    const customerRows = await prisma.$queryRaw`
      SELECT ma_kh
      FROM khach_hang
      WHERE ma_kh = ${maKh}
      LIMIT 1
    `

    if (customerRows.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy khách hàng.',
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

    res.json({
      success: true,
      message: 'Tạo biên bản bồi thường thành công.',
      data: insertedRows[0],
    })
  } catch (error) {
    next(error)
  }
}