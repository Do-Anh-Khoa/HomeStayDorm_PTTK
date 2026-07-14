import prisma from '../src/config/prisma.js'

function pad2(value) {
  return String(value).padStart(2, '0')
}

function makeCccd(index) {
  const now = new Date()
  const y = String(now.getFullYear()).slice(-2)
  return `0799${y}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}${pad2(index)}`
}

function makeEmail(index) {
  const tag = String(index).padStart(2, '0')
  return `nguyenatuan143+pdconly${tag}@gmail.com`
}

function makePhone(index) {
  const suffix = String(1000 + index).slice(-4)
  return `09${suffix}0000`
}

const COUNT = Number(process.env.SEED_COUNT || 6)

const beds = await prisma.$queryRaw`
  SELECT
    g.ma_phong AS "maPhong",
    g.ma_giuong AS "maGiuong",
    p.chi_nhanh AS "maCn"
  FROM giuong g
  JOIN phong p ON p.ma_phong = g.ma_phong
  WHERE g.trang_thai = 'Trống'
  ORDER BY p.chi_nhanh ASC, g.ma_phong ASC, g.ma_giuong ASC
  LIMIT ${COUNT};
`

if (!beds.length) {
  console.log('Không tìm thấy giường trạng thái Trống để seed.')
  await prisma.$disconnect()
  process.exit(0)
}

const created = []

for (let i = 0; i < beds.length; i += 1) {
  const bed = beds[i]
  const seq = i + 1

  const employee = await prisma.nhanvien.findFirst({
    where: { ma_cn: bed.maCn },
    select: { ma_nv: true, ma_cn: true },
  })

  if (!employee) {
    continue
  }

  const cccd = makeCccd(seq)
  const email = makeEmail(seq)

  const row = await prisma.$transaction(async (tx) => {
    const kh = await tx.khach_hang.create({
      data: {
        ten_kh: `KH PDC-Only ${seq}`,
        cccd,
        sdt: makePhone(seq),
        email,
        gioi_tinh: seq % 2 === 0 ? 'Nữ' : 'Nam',
        quoc_tich: 'Việt Nam',
      },
      select: { ma_kh: true },
    })

    const pdc = await tx.phieu_dat_coc.create({
      data: {
        trang_thai: 'Hoàn tất',
        khach_dat: kh.ma_kh,
        nv_sale: employee.ma_nv,
      },
      select: { ma_pdc: true },
    })

    await tx.$executeRaw`
      INSERT INTO dat_coc_giuong (ma_pdc, ma_phong, ma_giuong, trang_thai)
      VALUES (${pdc.ma_pdc}, ${bed.maPhong}, ${bed.maGiuong}, NULL)
    `

    await tx.giuong.update({
      where: { ma_phong_ma_giuong: { ma_phong: bed.maPhong, ma_giuong: bed.maGiuong } },
      data: { trang_thai: 'Đã đặt cọc' },
      select: { ma_phong: true },
    })

    return {
      maCn: bed.maCn,
      maPhong: bed.maPhong,
      maGiuong: bed.maGiuong,
      maPdc: pdc.ma_pdc,
      cccd,
      email,
    }
  })

  created.push(row)
}

console.log('Seed PDC-only (còn hiệu lực, chưa phát sinh hợp đồng) xong:')
console.table(created)

await prisma.$disconnect()

