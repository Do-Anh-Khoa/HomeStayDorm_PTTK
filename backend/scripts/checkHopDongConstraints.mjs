import prisma from '../src/config/prisma.js'

async function main() {
  const [constraints, pdcStatuses, dcgStatuses] = await Promise.all([
    prisma.$queryRawUnsafe(`
      SELECT
        t.relname AS table_name,
        c.conname,
        pg_get_constraintdef(c.oid) AS definition
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      WHERE t.relname IN ('phieu_dat_coc', 'dat_coc_giuong', 'giuong')
        AND c.contype = 'c'
      ORDER BY t.relname, c.conname
    `),
    prisma.$queryRawUnsafe(`
      SELECT DISTINCT trang_thai
      FROM phieu_dat_coc
      ORDER BY 1
    `),
    prisma.$queryRawUnsafe(`
      SELECT DISTINCT trang_thai
      FROM dat_coc_giuong
      ORDER BY 1 NULLS FIRST
    `),
  ])

  console.log('CHECK CONSTRAINTS')
  console.table(constraints)

  console.log('\nPHIEU_DAT_COC statuses')
  console.table(pdcStatuses)

  console.log('\nDAT_COC_GIUONG statuses')
  console.table(dcgStatuses)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
