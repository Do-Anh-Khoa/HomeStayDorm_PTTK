import prisma from '../src/config/prisma.js'

async function main() {
  const [grouped, rooms] = await Promise.all([
    prisma.phong.groupBy({
      by: ['chi_nhanh', 'suc_chua_toi_da'],
      _count: { _all: true },
      orderBy: [{ chi_nhanh: 'asc' }, { suc_chua_toi_da: 'asc' }],
    }),
    prisma.phong.findMany({
      select: {
        ma_phong: true,
        suc_chua_toi_da: true,
        chi_nhanh: true,
        ma_loai: true,
      },
      orderBy: [{ chi_nhanh: 'asc' }, { suc_chua_toi_da: 'asc' }, { ma_phong: 'asc' }],
    }),
  ])

  console.log('GROUPED')
  console.table(grouped)
  console.log('ROOMS')
  console.table(rooms)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
