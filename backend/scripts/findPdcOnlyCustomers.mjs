import prisma from '../src/config/prisma.js'

const eligibleRows = await prisma.$queryRaw`
  SELECT
    kh.cccd,
    kh.ten_kh AS "tenKhach",
    kh.email,
    pdc.ma_pdc AS "maPdc",
    pdc.trang_thai AS "trangThai",
    pdc.ngay_dc AS "ngayDatCoc"
  FROM phieu_dat_coc pdc
  JOIN khach_hang kh ON kh.ma_kh = pdc.khach_dat
  LEFT JOIN hop_dong_thue hdt ON hdt.ma_pdc = pdc.ma_pdc
  WHERE hdt.ma_pdc IS NULL
    AND pdc.trang_thai NOT IN ('Đã hủy', 'Quá hạn')
  ORDER BY pdc.ngay_dc DESC
  LIMIT 50;
`

const allRows = await prisma.$queryRaw`
  SELECT
    kh.cccd,
    kh.ten_kh AS "tenKhach",
    kh.email,
    pdc.ma_pdc AS "maPdc",
    pdc.trang_thai AS "trangThai",
    pdc.ngay_dc AS "ngayDatCoc"
  FROM phieu_dat_coc pdc
  JOIN khach_hang kh ON kh.ma_kh = pdc.khach_dat
  LEFT JOIN hop_dong_thue hdt ON hdt.ma_pdc = pdc.ma_pdc
  WHERE hdt.ma_pdc IS NULL
  ORDER BY pdc.ngay_dc DESC
  LIMIT 50;
`

console.log('PDC-only còn hiệu lực (không Đã hủy/Quá hạn):')
console.table(eligibleRows)
console.log('PDC-only tất cả trạng thái:')
console.table(allRows)
await prisma.$disconnect()
