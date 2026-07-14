import prisma from '../src/config/prisma.js'

const readyRows = await prisma.$queryRaw`
  SELECT
    kh.cccd,
    kh.ten_kh AS "tenKhach",
    kh.email,
    pdc.ma_pdc AS "maPdc",
    pdc.trang_thai AS "trangThai",
    pdc.ngay_dc AS "ngayDatCoc",
    COALESCE(
      (
        SELECT STRING_AGG(t.item, ', ' ORDER BY t.item)
        FROM (
          SELECT DISTINCT CONCAT(dcg.ma_phong, ' - ', dcg.ma_giuong) AS item
          FROM dat_coc_giuong dcg
          WHERE dcg.ma_pdc = pdc.ma_pdc
        ) t
      ),
      ''
    ) AS "phongGiuong"
  FROM phieu_dat_coc pdc
  JOIN khach_hang kh ON kh.ma_kh = pdc.khach_dat
  LEFT JOIN hop_dong_thue hdt ON hdt.ma_pdc = pdc.ma_pdc
  WHERE hdt.ma_pdc IS NULL
    AND pdc.trang_thai = 'Hoàn tất'
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

console.log('PDC-only đủ điều kiện lập hồ sơ trả phòng (Hoàn tất, chưa có HDT):')
console.table(readyRows)
console.log('PDC-only tất cả trạng thái:')
console.table(allRows)
await prisma.$disconnect()
