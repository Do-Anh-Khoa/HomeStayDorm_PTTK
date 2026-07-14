import prisma from '../src/config/prisma.js'

const keyword = process.argv[2] || '12345678905'

async function main() {
  const registrationRows = await prisma.$queryRawUnsafe(`
    SELECT
      hsdk.ma_dk AS "maHSDK",
      hsdk.khach_hang AS "maKH",
      kh.cccd,
      kh.ten_kh AS "tenKH",
      hsdk.trang_thai AS "trangThaiHSDK",
      hsdk.chi_nhanh AS "chiNhanhHSDK",
      pdc.ma_pdc AS "maPDC",
      pdc.trang_thai AS "trangThaiPDC",
      pdc.nv_sale AS "nvSalePDC",
      nv.ma_cn AS "chiNhanhPDC",
      hdt.ma_hdt AS "maHDT"
    FROM ho_so_dang_ky hsdk
    JOIN khach_hang kh ON kh.ma_kh = hsdk.khach_hang
    LEFT JOIN phieu_dat_coc pdc ON pdc.khach_dat = hsdk.khach_hang
    LEFT JOIN nhanvien nv ON nv.ma_nv = pdc.nv_sale
    LEFT JOIN hop_dong_thue hdt ON hdt.ma_pdc = pdc.ma_pdc
    WHERE hsdk.ma_dk = '${keyword}' OR kh.cccd = '${keyword}'
    ORDER BY pdc.ngay_dc DESC NULLS LAST
  `)

  const pdcRows = await prisma.$queryRawUnsafe(`
    SELECT
      pdc.ma_pdc AS "maPDC",
      kh.cccd,
      kh.ten_kh AS "tenKH",
      pdc.trang_thai AS "trangThaiPDC",
      nv.ma_cn AS "chiNhanhPDC",
      EXISTS (
        SELECT 1
        FROM dat_coc_giuong dcg
        WHERE dcg.ma_pdc = pdc.ma_pdc
      ) AS "coDatCocGiuong",
      EXISTS (
        SELECT 1
        FROM ho_so_tra_phong h
        WHERE h.ma_pdc = pdc.ma_pdc
          AND h.ngay_huy IS NULL
      ) AS "daCoHoSoTraPhong",
      EXISTS (
        SELECT 1
        FROM hop_dong_thue hdt
        WHERE hdt.ma_pdc = pdc.ma_pdc
      ) AS "daCoHopDong"
    FROM phieu_dat_coc pdc
    JOIN khach_hang kh ON kh.ma_kh = pdc.khach_dat
    JOIN nhanvien nv ON nv.ma_nv = pdc.nv_sale
    WHERE kh.cccd = '${keyword}' OR pdc.ma_pdc = '${keyword}'
    ORDER BY pdc.ngay_dc DESC NULLS LAST
  `)

  console.log('HSDK / PDC / HDT lien quan:')
  console.table(registrationRows)
  console.log('Dieu kien lookup tra phong:')
  console.table(pdcRows)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
