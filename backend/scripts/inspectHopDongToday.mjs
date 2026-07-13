import prisma from '../src/config/prisma.js'

async function main() {
  const [contracts, employees] = await Promise.all([
    prisma.hop_dong_thue.findMany({
      select: {
        ma_hdt: true,
        ma_pdc: true,
        nv_phu_trach: true,
        tg_tao_hd: true,
        tg_vao: true,
        thoi_han_thue: true,
      },
      orderBy: [{ tg_tao_hd: 'desc' }, { ma_hdt: 'desc' }],
      take: 20,
    }),
    prisma.nhanvien.findMany({
      select: {
        ma_nv: true,
        ten_nv: true,
        loai_nv: true,
        ma_cn: true,
      },
      orderBy: { ma_nv: 'asc' },
    }),
  ])

  console.log('CONTRACTS')
  console.table(contracts)
  console.log('EMPLOYEES')
  console.table(employees)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
