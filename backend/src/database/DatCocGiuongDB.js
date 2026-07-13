import prisma from '../config/prisma.js'

class DatCocGiuongDB {
  // LoadDSGiuongDaCoc(maPDC): DatCocGiuong[] — kèm sẵn thông tin phòng +
  // loại phòng (giá thuê/tháng)
  static async LoadDSGiuongDaCoc(maPDC) {
    const rows = await prisma.$queryRaw`
      SELECT dcg.ma_pdc AS "maPDC", dcg.ma_phong AS "maPhong", dcg.ma_giuong AS "maGiuong",
             dcg.trang_thai AS "trangThai",
             ph.suc_chua_toi_da AS "sucChuaToiDa", ph.ma_loai AS "maLoai", ph.chi_nhanh AS "chiNhanh",
             lp.ten_loai AS "tenLoai", lp.gia_giuong AS "giaGiuong"
      FROM dat_coc_giuong dcg
      JOIN phong ph ON ph.ma_phong = dcg.ma_phong
      JOIN loai_phong lp ON lp.ma_loai = ph.ma_loai
      WHERE dcg.ma_pdc = ${maPDC}
      ORDER BY dcg.ma_phong, dcg.ma_giuong
    `
    return rows
  }
}

export default DatCocGiuongDB