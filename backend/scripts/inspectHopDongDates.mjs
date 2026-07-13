import prisma from '../src/config/prisma.js'

async function main() {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT
      ma_hdt,
      nv_phu_trach,
      tg_tao_hd,
      pg_typeof(tg_tao_hd)::text AS tg_type,
      DATE(tg_tao_hd) AS date_plain,
      DATE(tg_tao_hd AT TIME ZONE 'Asia/Ho_Chi_Minh') AS date_at_hcm,
      DATE(CURRENT_TIMESTAMP) AS current_date_plain,
      DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh') AS current_date_hcm
    FROM hop_dong_thue
    WHERE ma_hdt IN ('HDT007', 'HDT008', 'HDT009', 'HDT_G03')
    ORDER BY ma_hdt
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
