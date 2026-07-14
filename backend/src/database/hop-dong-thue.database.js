import prisma from '../config/prisma.js'

export const KY_THANH_TOAN_LABELS = {
  1: 'Hàng tháng',
  3: '3 tháng / lần',
  6: '6 tháng / lần',
  12: '12 tháng / lần',
}

export const DIEU_KHOAN_XU_LY_VI_PHAM_MAC_DINH = [
  'Bồi thường nếu có thiệt hại tài sản hoặc vi phạm nội quy phòng ở.',
  'Có thể chấm dứt hợp đồng nếu khách thuê vi phạm nghiêm trọng nội quy hoặc pháp luật.',
  'Các khoản phát sinh do khách thuê vi phạm cam kết sẽ được xử lý theo quy định hiện hành của KTX.',
]

function toNumber(value) {
  return Number(value || 0)
}

function formatDateInput(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function mapTerms(terms, idKey) {
  return terms.map((item) => ({
    id: item[idKey],
    title: item.ten_qd,
    content: item.noi_dung,
  }))
}

export async function getNhanVienByMa(maNV) {
  return prisma.nhanvien.findUnique({
    where: { ma_nv: maNV },
    select: {
      ma_nv: true,
      ten_nv: true,
      ma_cn: true,
      loai_nv: true,
    },
  })
}

export async function getDanhSachPhieuDatCocChoLapHopDong({ maCn, tuKhoa = '' }) {
  const rows = await prisma.$queryRaw`
    SELECT
      pdc.ma_pdc AS "maPhieuDatCoc",
      kh.ten_kh AS "tenKhachHang",
      kh.cccd AS "cccd",
      COUNT(dcg.ma_giuong)::int AS "soLuongGiuong",
      pdc.trang_thai AS "trangThai"
    FROM phieu_dat_coc pdc
    JOIN khach_hang kh ON kh.ma_kh = pdc.khach_dat
    JOIN nhanvien nv_sale ON nv_sale.ma_nv = pdc.nv_sale
    JOIN dat_coc_giuong dcg ON dcg.ma_pdc = pdc.ma_pdc
    WHERE nv_sale.ma_cn = ${maCn}
      AND pdc.trang_thai = 'Hoàn tất'
      AND NOT EXISTS (
        SELECT 1 FROM hop_dong_thue hdt WHERE hdt.ma_pdc = pdc.ma_pdc
      )
      AND (
        ${tuKhoa} = '' OR
        pdc.ma_pdc ILIKE '%' || ${tuKhoa} || '%' OR
        kh.cccd ILIKE '%' || ${tuKhoa} || '%' OR
        kh.ten_kh ILIKE '%' || ${tuKhoa} || '%'
      )
    GROUP BY pdc.ma_pdc, kh.ten_kh, kh.cccd, pdc.trang_thai, pdc.ngay_dc
    ORDER BY pdc.ngay_dc DESC, pdc.ma_pdc DESC
  `

  return rows
}

export async function getHopDongFormContext({ maPDC, maCn }) {
  const baseRows = await prisma.$queryRaw`
    SELECT
      pdc.ma_pdc AS "maPhieuDatCoc",
      pdc.ngay_dc AS "ngayDatCoc",
      pdc.trang_thai AS "trangThaiPhieuDatCoc",
      pdc.khach_dat AS "maKhachDat",
      kh.ten_kh AS "tenKhachDat",
      kh.cccd AS "cccd",
      kh.sdt AS "soDienThoai",
      kh.email AS "email",
      kh.gioi_tinh AS "gioiTinh",
      kh.cong_viec AS "congViec",
      kh.quoc_tich AS "quocTich",
      nv_sale.ma_nv AS "maNVSale",
      nv_sale.ten_nv AS "tenNVSale",
      nv_sale.ma_cn AS "maCn"
    FROM phieu_dat_coc pdc
    JOIN khach_hang kh ON kh.ma_kh = pdc.khach_dat
    JOIN nhanvien nv_sale ON nv_sale.ma_nv = pdc.nv_sale
    WHERE pdc.ma_pdc = ${maPDC}
      AND nv_sale.ma_cn = ${maCn}
    LIMIT 1
  `

  const base = baseRows[0] || null
  if (!base) return null

  const daCoHopDong = await prisma.hop_dong_thue.findUnique({
    where: { ma_pdc: maPDC },
    select: { ma_hdt: true },
  })

  const [beds, latestRegistration, noiQuyKtx, quyDinhHoanCoc] = await Promise.all([
    prisma.$queryRaw`
      SELECT
        dcg.ma_phong AS "maPhong",
        dcg.ma_giuong AS "maGiuong",
        dcg.trang_thai AS "trangThai",
        lp.gia_giuong AS "giaThue",
        lp.ten_loai AS "tenLoaiPhong"
      FROM dat_coc_giuong dcg
      JOIN phong p ON p.ma_phong = dcg.ma_phong
      JOIN loai_phong lp ON lp.ma_loai = p.ma_loai
      WHERE dcg.ma_pdc = ${maPDC}
      ORDER BY dcg.ma_phong ASC, dcg.ma_giuong ASC
    `,
    prisma.ho_so_dang_ky.findFirst({
      where: { khach_hang: base.maKhachDat },
      orderBy: { ngay_lap: 'desc' },
      select: {
        thoi_gian_vao: true,
        thoi_han_thue: true,
      },
    }),
    prisma.quy_dinh_ktx.findMany({
      orderBy: { ma_qdktx: 'asc' },
    }),
    prisma.quy_dinh_hoan_coc.findMany({
      orderBy: { ma_qdhc: 'asc' },
    }),
  ])

  return {
    maPhieuDatCoc: base.maPhieuDatCoc,
    trangThaiPhieuDatCoc: base.trangThaiPhieuDatCoc,
    daCoHopDong: Boolean(daCoHopDong),
    maHopDongDaTonTai: daCoHopDong?.ma_hdt || null,
    khachDatCoc: {
      maKh: base.maKhachDat,
      hoTen: base.tenKhachDat,
      cccd: base.cccd,
      soDienThoai: base.soDienThoai,
      email: base.email,
      gioiTinh: base.gioiTinh,
      congViec: base.congViec || '',
      quocTich: base.quocTich || 'Việt Nam',
      tinhTrang: 'Đang làm việc',
    },
    nhanVienSale: {
      maNV: base.maNVSale,
      tenNV: base.tenNVSale,
    },
    ngayDatCoc: formatDateInput(base.ngayDatCoc),
    thoiGianBatDauThueMacDinh: formatDateInput(latestRegistration?.thoi_gian_vao) || formatDateInput(new Date()),
    thoiHanThueMacDinh: Number(latestRegistration?.thoi_han_thue || 3),
    kyThanhToanMacDinh: 1,
    beds: beds.map((bed) => ({
      maPhong: bed.maPhong,
      maGiuong: bed.maGiuong,
      trangThai: bed.trangThai,
      giaThue: toNumber(bed.giaThue),
      tenLoaiPhong: bed.tenLoaiPhong,
    })),
    terms: {
      noiQuyKtx: mapTerms(noiQuyKtx, 'ma_qdktx'),
      quyDinhHoanCoc: mapTerms(quyDinhHoanCoc, 'ma_qdhc'),
      dieuKhoanXuLyViPham: DIEU_KHOAN_XU_LY_VI_PHAM_MAC_DINH,
    },
  }
}

export async function getDanhSachHopDongDaLapHomNay({ maNV }) {
  const rows = await prisma.$queryRaw`
    SELECT
      hdt.ma_hdt AS "maHopDong",
      hdt.ma_pdc AS "maPhieuDatCoc",
      hdt.tg_tao_hd AS "thoiGianTao",
      hdt.thoi_han_thue AS "thoiHanThueThang",
      kh.ten_kh AS "khachDaiDien",
      COUNT(kt.ma_kh)::int AS "soKhachThue"
    FROM hop_dong_thue hdt
    JOIN phieu_dat_coc pdc ON pdc.ma_pdc = hdt.ma_pdc
    JOIN khach_hang kh ON kh.ma_kh = pdc.khach_dat
    LEFT JOIN khach_thue kt ON kt.ma_hdt = hdt.ma_hdt
    WHERE hdt.nv_phu_trach = ${maNV}
      AND (hdt.tg_tao_hd + INTERVAL '7 hour') >=
          date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')
      AND (hdt.tg_tao_hd + INTERVAL '7 hour') <
          date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh') + INTERVAL '1 day'
    GROUP BY hdt.ma_hdt, hdt.ma_pdc, hdt.tg_tao_hd, hdt.thoi_han_thue, kh.ten_kh
    ORDER BY hdt.tg_tao_hd DESC, hdt.ma_hdt DESC
  `

  return rows.map((row) => ({
    maHopDong: row.maHopDong,
    maPhieuDatCoc: row.maPhieuDatCoc,
    thoiGianTao: row.thoiGianTao,
    thoiHanThue: `${row.thoiHanThueThang} tháng`,
    thoiHanThueThang: Number(row.thoiHanThueThang || 0),
    khachDaiDien: row.khachDaiDien,
    soKhachThue: Number(row.soKhachThue || 0),
  }))
}

export async function getChiTietHopDong({ maHDT, maCn = null }) {
  const contractRows = await prisma.$queryRaw`
    SELECT
      hdt.ma_hdt AS "maHopDong",
      hdt.ma_pdc AS "maPhieuDatCoc",
      hdt.tg_tao_hd AS "thoiGianLapHopDong",
      hdt.tg_vao AS "thoiGianBatDauThue",
      hdt.thoi_han_thue AS "thoiHanThue",
      hdt.ky_tt AS "kyThanhToan",
      nv_pt.ma_nv AS "maNVPhuTrach",
      nv_pt.ten_nv AS "tenNVPhuTrach",
      pdc.khach_dat AS "maKhachDat",
      pdc.trang_thai AS "trangThaiPhieuDatCoc"
    FROM hop_dong_thue hdt
    JOIN nhanvien nv_pt ON nv_pt.ma_nv = hdt.nv_phu_trach
    JOIN phieu_dat_coc pdc ON pdc.ma_pdc = hdt.ma_pdc
    JOIN nhanvien nv_sale ON nv_sale.ma_nv = pdc.nv_sale
    WHERE hdt.ma_hdt = ${maHDT}
      AND (${maCn}::varchar IS NULL OR nv_sale.ma_cn = ${maCn})
    LIMIT 1
  `

  const contract = contractRows[0] || null
  if (!contract) return null

  const [beds, tenants, noiQuyKtx, quyDinhHoanCoc] = await Promise.all([
    prisma.$queryRaw`
      SELECT
        dcg.ma_phong AS "maPhong",
        dcg.ma_giuong AS "maGiuong",
        dcg.trang_thai AS "trangThai",
        lp.gia_giuong AS "giaThue",
        lp.ten_loai AS "tenLoaiPhong"
      FROM dat_coc_giuong dcg
      JOIN phong p ON p.ma_phong = dcg.ma_phong
      JOIN loai_phong lp ON lp.ma_loai = p.ma_loai
      WHERE dcg.ma_pdc = ${contract.maPhieuDatCoc}
      ORDER BY dcg.ma_phong ASC, dcg.ma_giuong ASC
    `,
    prisma.$queryRaw`
      SELECT
        kh.ma_kh AS "maKh",
        kh.ten_kh AS "hoTen",
        kh.cccd AS "cccd",
        kh.sdt AS "soDienThoai",
        kh.email AS "email",
        kh.gioi_tinh AS "gioiTinh",
        kh.cong_viec AS "congViec",
        kh.quoc_tich AS "quocTich"
      FROM khach_thue kt
      JOIN khach_hang kh ON kh.ma_kh = kt.ma_kh
      WHERE kt.ma_hdt = ${maHDT}
      ORDER BY CASE WHEN kh.ma_kh = ${contract.maKhachDat} THEN 0 ELSE 1 END, kh.ten_kh ASC
    `,
    prisma.quy_dinh_ktx.findMany({
      orderBy: { ma_qdktx: 'asc' },
    }),
    prisma.quy_dinh_hoan_coc.findMany({
      orderBy: { ma_qdhc: 'asc' },
    }),
  ])

  return {
    maHopDong: contract.maHopDong,
    maPhieuDatCoc: contract.maPhieuDatCoc,
    thoiGianLapHopDong: contract.thoiGianLapHopDong,
    thoiGianBatDauThue: contract.thoiGianBatDauThue,
    thoiHanThue: Number(contract.thoiHanThue || 0),
    kyThanhToan: Number(contract.kyThanhToan || 0),
    kyThanhToanLabel: KY_THANH_TOAN_LABELS[Number(contract.kyThanhToan || 0)] || `${contract.kyThanhToan} tháng / lần`,
    nhanVienPhuTrach: {
      maNV: contract.maNVPhuTrach,
      tenNV: contract.tenNVPhuTrach,
    },
    trangThaiPhieuDatCoc: contract.trangThaiPhieuDatCoc,
    beds: beds.map((bed) => ({
      maPhong: bed.maPhong,
      maGiuong: bed.maGiuong,
      trangThai: bed.trangThai,
      giaThue: toNumber(bed.giaThue),
      tenLoaiPhong: bed.tenLoaiPhong,
    })),
    tenants: tenants.map((tenant) => ({
      maKh: tenant.maKh,
      hoTen: tenant.hoTen,
      cccd: tenant.cccd,
      soDienThoai: tenant.soDienThoai,
      email: tenant.email,
      gioiTinh: tenant.gioiTinh,
      congViec: tenant.congViec || '',
      quocTich: tenant.quocTich || 'Việt Nam',
      tinhTrang: 'Đang làm việc',
      isChuHopDong: tenant.maKh === contract.maKhachDat,
    })),
    terms: {
      noiQuyKtx: mapTerms(noiQuyKtx, 'ma_qdktx'),
      quyDinhHoanCoc: mapTerms(quyDinhHoanCoc, 'ma_qdhc'),
      dieuKhoanXuLyViPham: DIEU_KHOAN_XU_LY_VI_PHAM_MAC_DINH,
    },
  }
}

function buildSyntheticEmail(cccd) {
  return `khach-${cccd}@local.invalid`
}

async function resolveOrCreateKhachHang(tx, tenant) {
  if (tenant.maKh) {
    const byId = await tx.khach_hang.findUnique({
      where: { ma_kh: tenant.maKh },
      select: { ma_kh: true },
    })
    if (byId) return byId.ma_kh
  }

  const existingByCCCD = await tx.khach_hang.findUnique({
    where: { cccd: tenant.cccd },
    select: { ma_kh: true },
  })
  if (existingByCCCD) return existingByCCCD.ma_kh

  const created = await tx.khach_hang.create({
    data: {
      ten_kh: tenant.hoTen,
      cccd: tenant.cccd,
      sdt: tenant.soDienThoai,
      email: tenant.email || buildSyntheticEmail(tenant.cccd),
      gioi_tinh: tenant.gioiTinh || 'Nữ',
      cong_viec: tenant.congViec || null,
      quoc_tich: tenant.quocTich || 'Việt Nam',
    },
    select: { ma_kh: true },
  })

  return created.ma_kh
}

export async function createHopDongThue({
  maPDC,
  maNVPhuTrach,
  maCn,
  tgTaoHD,
  tgVao,
  thoiHanThue,
  kyThanhToan,
  selectedBeds,
  tenants,
}) {
  const created = await prisma.$transaction(async (tx) => {
    const pdc = await tx.phieu_dat_coc.findUnique({
      where: { ma_pdc: maPDC },
      select: {
        ma_pdc: true,
        trang_thai: true,
        khach_dat: true,
        nv_sale: true,
      },
    })

    if (!pdc) {
      const error = new Error('Không tìm thấy phiếu đặt cọc.')
      error.status = 404
      throw error
    }

    if (pdc.trang_thai !== 'Hoàn tất') {
      const error = new Error('Phiếu đặt cọc này không ở trạng thái đủ điều kiện để lập hợp đồng.')
      error.status = 409
      throw error
    }

    const saleEmployee = await tx.nhanvien.findUnique({
      where: { ma_nv: pdc.nv_sale },
      select: { ma_cn: true },
    })

    if (!saleEmployee || saleEmployee.ma_cn !== maCn) {
      const error = new Error('Bạn không có quyền thao tác với phiếu đặt cọc này.')
      error.status = 403
      throw error
    }

    const existingContract = await tx.hop_dong_thue.findUnique({
      where: { ma_pdc: maPDC },
      select: { ma_hdt: true },
    })
    if (existingContract) {
      const error = new Error('Phiếu đặt cọc này đã được lập hợp đồng bởi nhân viên khác.')
      error.status = 409
      throw error
    }

    const reservedBeds = await tx.dat_coc_giuong.findMany({
      where: { ma_pdc: maPDC },
      select: {
        ma_phong: true,
        ma_giuong: true,
      },
    })

    const reservedBedKeySet = new Set(
      reservedBeds.map((bed) => `${bed.ma_phong}__${bed.ma_giuong}`),
    )

    for (const bed of selectedBeds) {
      const key = `${bed.maPhong}__${bed.maGiuong}`
      if (!reservedBedKeySet.has(key)) {
        const error = new Error('Danh sách giường thuê không hợp lệ.')
        error.status = 400
        throw error
      }
    }

    const selectedKeySet = new Set(
      selectedBeds.map((bed) => `${bed.maPhong}__${bed.maGiuong}`),
    )

    const removedBeds = reservedBeds
      .filter((bed) => !selectedKeySet.has(`${bed.ma_phong}__${bed.ma_giuong}`))
      .map((bed) => ({
        maPhong: bed.ma_phong,
        maGiuong: bed.ma_giuong,
      }))

    const createdContract = await tx.hop_dong_thue.create({
      data: {
        tg_tao_hd: tgTaoHD,
        tg_vao: tgVao,
        thoi_han_thue: thoiHanThue,
        ky_tt: kyThanhToan,
        nv_phu_trach: maNVPhuTrach,
        ma_pdc: maPDC,
      },
      select: { ma_hdt: true },
    })

    const tenantIds = []
    for (const tenant of tenants) {
      const maKh = await resolveOrCreateKhachHang(tx, tenant)
      tenantIds.push(maKh)
    }

    await tx.khach_thue.createMany({
      data: tenantIds.map((maKh) => ({
        ma_hdt: createdContract.ma_hdt,
        ma_kh: maKh,
      })),
    })

    // DB hiện tại không cho phép trạng thái "Đã chốt"/"Đã chốt cọc" ở phieu_dat_coc.
    // Vì danh sách chờ lập hợp đồng đã loại những PDC có hop_dong_thue, nên chỉ cần
    // giữ nguyên trạng thái "Hoàn tất" và dựa vào quan hệ hợp đồng để phân biệt.

    if (selectedBeds.length > 0) {
      await tx.dat_coc_giuong.updateMany({
        where: {
          ma_pdc: maPDC,
          OR: selectedBeds.map((bed) => ({
            ma_phong: bed.maPhong,
            ma_giuong: bed.maGiuong,
          })),
        },
        data: { trang_thai: 'Đã chốt' },
      })
    }

    if (removedBeds.length > 0) {
      await tx.dat_coc_giuong.updateMany({
        where: {
          ma_pdc: maPDC,
          OR: removedBeds.map((bed) => ({
            ma_phong: bed.maPhong,
            ma_giuong: bed.maGiuong,
          })),
        },
        data: { trang_thai: 'Hoàn cọc' },
      })

      await tx.giuong.updateMany({
        where: {
          OR: removedBeds.map((bed) => ({
            ma_phong: bed.maPhong,
            ma_giuong: bed.maGiuong,
          })),
        },
        data: { trang_thai: 'Trống' },
      })
    }

    return createdContract
  })

  return getChiTietHopDong({ maHDT: created.ma_hdt, maCn })
}
