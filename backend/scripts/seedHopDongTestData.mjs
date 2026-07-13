import prisma from '../src/config/prisma.js'

const TEST_CASES = [
  {
    customer: {
      ma_kh: 'KH_HDTEST_001',
      ten_kh: 'Khach test hop dong 1',
      cccd: '990000000101',
      sdt: '0909000101',
      email: 'hdtest001@local.test',
      gioi_tinh: 'Nu',
      cong_viec: 'Nhan vien van phong',
      quoc_tich: 'Viet Nam',
    },
    registration: {
      ma_dk: 'HSDK_HDTEST_001',
      hinh_thuc_thue: 'Theo giuong',
      so_nguoi: 1,
      thoi_gian_vao: '2026-07-20 08:00:00+07',
      thoi_han_thue: 3,
      tieu_chi: 'Test lap hop dong 1',
      trang_thai: 'Da chot coc',
      chi_nhanh: 'CN001',
      nv_sale: 'NV001',
    },
    deposit: {
      ma_pdc: 'PDC_HDTEST_001',
      trang_thai: 'Hoan tat',
      nv_sale: 'NV001',
    },
    beds: [{ ma_phong: 'P102', ma_giuong: 'G01' }],
  },
  {
    customer: {
      ma_kh: 'KH_HDTEST_002',
      ten_kh: 'Khach test hop dong nhom',
      cccd: '990000000102',
      sdt: '0909000102',
      email: 'hdtest002@local.test',
      gioi_tinh: 'Nam',
      cong_viec: 'Ky su',
      quoc_tich: 'Viet Nam',
    },
    registration: {
      ma_dk: 'HSDK_HDTEST_002',
      hinh_thuc_thue: 'Theo giuong',
      so_nguoi: 2,
      thoi_gian_vao: '2026-07-22 08:00:00+07',
      thoi_han_thue: 6,
      tieu_chi: 'Test lap hop dong nhom',
      trang_thai: 'Da chot coc',
      chi_nhanh: 'CN001',
      nv_sale: 'NV001',
    },
    deposit: {
      ma_pdc: 'PDC_HDTEST_002',
      trang_thai: 'Hoan tat',
      nv_sale: 'NV001',
    },
    beds: [
      { ma_phong: 'P201', ma_giuong: 'G04' },
      { ma_phong: 'P201', ma_giuong: 'G05' },
    ],
  },
  {
    customer: {
      ma_kh: 'KH_HDTEST_003',
      ten_kh: 'Khach test hop dong 3',
      cccd: '990000000103',
      sdt: '0909000103',
      email: 'hdtest003@local.test',
      gioi_tinh: 'Nu',
      cong_viec: 'Sinh vien',
      quoc_tich: 'Viet Nam',
    },
    registration: {
      ma_dk: 'HSDK_HDTEST_003',
      hinh_thuc_thue: 'Theo giuong',
      so_nguoi: 1,
      thoi_gian_vao: '2026-07-25 08:00:00+07',
      thoi_han_thue: 12,
      tieu_chi: 'Test lap hop dong 3',
      trang_thai: 'Da chot coc',
      chi_nhanh: 'CN001',
      nv_sale: 'NV001',
    },
    deposit: {
      ma_pdc: 'PDC_HDTEST_003',
      trang_thai: 'Hoan tat',
      nv_sale: 'NV001',
    },
    beds: [{ ma_phong: 'P202', ma_giuong: 'G01' }],
  },
]

function vi(text) {
  return text
    .replaceAll('Theo giuong', 'Theo giường')
    .replaceAll('Hoan tat', 'Hoàn tất')
    .replaceAll('Da chot coc', 'Đã chốt cọc')
    .replaceAll('Nu', 'Nữ')
    .replaceAll('Viet Nam', 'Việt Nam')
    .replaceAll('Nhan vien van phong', 'Nhân viên văn phòng')
    .replaceAll('Ky su', 'Kỹ sư')
    .replaceAll('Sinh vien', 'Sinh viên')
}

async function seedCase(item) {
  const kh = {
    ...item.customer,
    gioi_tinh: vi(item.customer.gioi_tinh),
    cong_viec: vi(item.customer.cong_viec),
    quoc_tich: vi(item.customer.quoc_tich),
  }
  const hsdk = {
    ...item.registration,
    hinh_thuc_thue: vi(item.registration.hinh_thuc_thue),
    trang_thai: vi(item.registration.trang_thai),
  }
  const pdc = {
    ...item.deposit,
    trang_thai: vi(item.deposit.trang_thai),
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`
      INSERT INTO khach_hang (ma_kh, ten_kh, cccd, sdt, email, gioi_tinh, cong_viec, quoc_tich)
      VALUES ('${kh.ma_kh}', '${kh.ten_kh}', '${kh.cccd}', '${kh.sdt}', '${kh.email}', '${kh.gioi_tinh}', '${kh.cong_viec}', '${kh.quoc_tich}')
      ON CONFLICT (ma_kh) DO UPDATE SET
        ten_kh = EXCLUDED.ten_kh,
        cccd = EXCLUDED.cccd,
        sdt = EXCLUDED.sdt,
        email = EXCLUDED.email,
        gioi_tinh = EXCLUDED.gioi_tinh,
        cong_viec = EXCLUDED.cong_viec,
        quoc_tich = EXCLUDED.quoc_tich
    `)

    await tx.$executeRawUnsafe(`
      INSERT INTO ho_so_dang_ky (
        ma_dk, hinh_thuc_thue, so_nguoi, thoi_gian_vao, thoi_han_thue,
        tieu_chi, trang_thai, chi_nhanh, khach_hang, nv_sale
      )
      VALUES (
        '${hsdk.ma_dk}', '${hsdk.hinh_thuc_thue}', ${hsdk.so_nguoi}, '${hsdk.thoi_gian_vao}',
        ${hsdk.thoi_han_thue}, '${hsdk.tieu_chi}', '${hsdk.trang_thai}', '${hsdk.chi_nhanh}',
        '${kh.ma_kh}', '${hsdk.nv_sale}'
      )
      ON CONFLICT (ma_dk) DO UPDATE SET
        hinh_thuc_thue = EXCLUDED.hinh_thuc_thue,
        so_nguoi = EXCLUDED.so_nguoi,
        thoi_gian_vao = EXCLUDED.thoi_gian_vao,
        thoi_han_thue = EXCLUDED.thoi_han_thue,
        tieu_chi = EXCLUDED.tieu_chi,
        trang_thai = EXCLUDED.trang_thai,
        chi_nhanh = EXCLUDED.chi_nhanh,
        khach_hang = EXCLUDED.khach_hang,
        nv_sale = EXCLUDED.nv_sale
    `)

    await tx.$executeRawUnsafe(`
      INSERT INTO phieu_dat_coc (ma_pdc, trang_thai, khach_dat, nv_sale)
      VALUES ('${pdc.ma_pdc}', '${pdc.trang_thai}', '${kh.ma_kh}', '${pdc.nv_sale}')
      ON CONFLICT (ma_pdc) DO UPDATE SET
        trang_thai = EXCLUDED.trang_thai,
        khach_dat = EXCLUDED.khach_dat,
        nv_sale = EXCLUDED.nv_sale
    `)

    for (const bed of item.beds) {
      await tx.$executeRawUnsafe(`
        UPDATE giuong
        SET trang_thai = 'Đã đặt cọc'
        WHERE ma_phong = '${bed.ma_phong}' AND ma_giuong = '${bed.ma_giuong}'
      `)

      await tx.$executeRawUnsafe(`
        INSERT INTO dat_coc_giuong (ma_pdc, ma_phong, ma_giuong, trang_thai)
        VALUES ('${pdc.ma_pdc}', '${bed.ma_phong}', '${bed.ma_giuong}', NULL)
        ON CONFLICT (ma_pdc, ma_phong, ma_giuong) DO UPDATE SET
          trang_thai = EXCLUDED.trang_thai
      `)
    }
  })
}

async function main() {
  for (const item of TEST_CASES) {
    await seedCase(item)
  }

  const rows = await prisma.$queryRawUnsafe(`
    SELECT
      pdc.ma_pdc AS "maPDC",
      kh.ten_kh AS "tenKH",
      kh.cccd AS "cccd",
      COUNT(dcg.ma_giuong)::int AS "soGiuong",
      pdc.trang_thai AS "trangThai"
    FROM phieu_dat_coc pdc
    JOIN khach_hang kh ON kh.ma_kh = pdc.khach_dat
    JOIN nhanvien nv ON nv.ma_nv = pdc.nv_sale
    JOIN dat_coc_giuong dcg ON dcg.ma_pdc = pdc.ma_pdc
    WHERE nv.ma_cn = 'CN001'
      AND pdc.trang_thai = 'Hoàn tất'
      AND NOT EXISTS (
        SELECT 1 FROM hop_dong_thue hdt WHERE hdt.ma_pdc = pdc.ma_pdc
      )
    GROUP BY pdc.ma_pdc, kh.ten_kh, kh.cccd, pdc.trang_thai
    ORDER BY pdc.ma_pdc
  `)

  console.log('Da seed xong du lieu test hop dong. Danh sach PDC cho lap hop dong:')
  console.table(rows)
}

main()
  .catch((error) => {
    console.error('Seed that bai:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
