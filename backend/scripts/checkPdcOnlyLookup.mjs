import prisma from '../src/config/prisma.js'

const targetCccds = [
  '079926071401',
  '079926071402',
  '079926071403',
  '079926071404',
  '079926071405',
]

async function main() {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT
      pdc.ma_pdc AS "maPdc",
      kh.cccd,
      kh.ten_kh AS "tenKhach",
      nv.ma_cn AS "maCn",
      pdc.trang_thai AS "trangThaiPdc",
      EXISTS (
        SELECT 1
        FROM ho_so_tra_phong h
        WHERE h.ma_pdc = pdc.ma_pdc
          AND h.ma_hdt IS NULL
          AND h.ngay_huy IS NULL
      ) AS "daCoHoSoTraPhong"
    FROM phieu_dat_coc pdc
    JOIN khach_hang kh ON kh.ma_kh = pdc.khach_dat
    JOIN nhanvien nv ON nv.ma_nv = pdc.nv_sale
    WHERE kh.cccd IN (${targetCccds.map((value) => `'${value}'`).join(', ')})
    ORDER BY pdc.ma_pdc
  `)

  console.table(rows)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
