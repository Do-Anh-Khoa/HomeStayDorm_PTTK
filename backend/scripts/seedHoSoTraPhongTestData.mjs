import prisma from '../src/config/prisma.js'

const TEST_EMAIL = 'nguyenatuan143@gmail.com'

function toIsoDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function findOrCreateCustomer() {
  const existing = await prisma.khach_hang.findUnique({
    where: { email: TEST_EMAIL },
    select: { ma_kh: true, ten_kh: true, cccd: true, sdt: true, email: true },
  })

  if (existing) {
    return existing
  }

  const created = await prisma.khach_hang.create({
    data: {
      ten_kh: 'Khách test trả phòng',
      cccd: '990000001431',
      sdt: '0900001431',
      email: TEST_EMAIL,
      gioi_tinh: 'Nam',
      cong_viec: 'Test',
      quoc_tich: 'Việt Nam',
    },
    select: { ma_kh: true, ten_kh: true, cccd: true, sdt: true, email: true },
  })

  return created
}

async function pickEmployee(maCn) {
  const employee = await prisma.nhanvien.findFirst({
    where: { ma_cn: maCn },
    select: { ma_nv: true, ma_cn: true, ten_nv: true },
  })

  return employee || null
}

async function pickBedInBranch(maCn) {
  const rows = await prisma.$queryRaw`
    SELECT g.ma_phong AS "maPhong", g.ma_giuong AS "maGiuong", g.trang_thai AS "trangThai"
    FROM giuong g
    JOIN phong p ON p.ma_phong = g.ma_phong
    WHERE p.chi_nhanh = ${maCn}
    ORDER BY p.ma_phong ASC, g.ma_giuong ASC
    LIMIT 1
  `

  return rows?.[0] || null
}

async function seedForBranch({ maCn, customer }) {
  const employee = await pickEmployee(maCn)
  if (!employee) {
    return null
  }

  const bed = await pickBedInBranch(maCn)
  if (!bed) {
    return null
  }

  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60, 8, 0, 0)

  const created = await prisma.$transaction(async (tx) => {
    const pdc = await tx.phieu_dat_coc.create({
      data: {
        trang_thai: 'Hoàn tất',
        khach_dat: customer.ma_kh,
        nv_sale: employee.ma_nv,
      },
      select: { ma_pdc: true, trang_thai: true },
    })

    await tx.$executeRaw`
      UPDATE giuong
      SET trang_thai = 'Đã đặt cọc'
      WHERE ma_phong = ${bed.maPhong}
        AND ma_giuong = ${bed.maGiuong}
        AND trang_thai = 'Trống'
    `

    await tx.$executeRawUnsafe(`
      INSERT INTO dat_coc_giuong (ma_pdc, ma_phong, ma_giuong, trang_thai)
      VALUES ('${pdc.ma_pdc}', '${bed.maPhong}', '${bed.maGiuong}', NULL)
      ON CONFLICT (ma_pdc, ma_phong, ma_giuong) DO UPDATE SET
        trang_thai = EXCLUDED.trang_thai
    `)

    const hdt = await tx.hop_dong_thue.create({
      data: {
        tg_vao: startDate,
        thoi_han_thue: 6,
        ky_tt: 1,
        nv_phu_trach: employee.ma_nv,
        ma_pdc: pdc.ma_pdc,
      },
      select: { ma_hdt: true, tg_vao: true, ma_pdc: true },
    })

    await tx.khach_thue.create({
      data: {
        ma_kh: customer.ma_kh,
        ma_hdt: hdt.ma_hdt,
      },
      select: { ma_kh: true, ma_hdt: true },
    })

    return {
      maCn,
      maPdc: pdc.ma_pdc,
      maHdt: hdt.ma_hdt,
      maPhong: bed.maPhong,
      maGiuong: bed.maGiuong,
      tgVao: hdt.tg_vao,
      nvSeed: employee.ma_nv,
    }
  })

  return created
}

async function main() {
  const customer = await findOrCreateCustomer()

  const branches = await prisma.chi_nhanh.findMany({
    select: { ma_cn: true, ten_cn: true },
    orderBy: { ma_cn: 'asc' },
  })

  const createdRows = []

  for (const branch of branches) {
    const row = await seedForBranch({ maCn: branch.ma_cn, customer })
    if (row) {
      createdRows.push({
        maCn: branch.ma_cn,
        tenCn: branch.ten_cn,
        maPdc: row.maPdc,
        maHdt: row.maHdt,
        phongGiuong: `${row.maPhong} - ${row.maGiuong}`,
        tgVao: toIsoDate(new Date(row.tgVao)),
      })
    }
  }

  console.log('Seed hồ sơ trả phòng test xong.')
  console.log('Email test:', customer.email)
  console.table(createdRows)
  console.log('Gợi ý test: Sale -> Trả phòng -> Lập hồ sơ -> tìm theo CCCD:', customer.cccd)
}

main()
  .catch((error) => {
    console.error('Seed thất bại:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

