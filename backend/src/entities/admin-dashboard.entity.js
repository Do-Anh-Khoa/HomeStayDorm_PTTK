const LOAI_NV_LABELS = {
  SALE: 'Sale',
  PT: 'Phụ trách',
  QL: 'Quản lý',
  KT: 'Kế toán',
}

function buildOverviewEntity(overview) {
  return {
    tong_chi_nhanh: overview.tong_chi_nhanh,
    tong_nhan_vien: overview.tong_nhan_vien,
    tong_giuong_trong: overview.tong_giuong_trong,
    ty_le_lap_day: overview.ty_le_lap_day,
    tong_quy_dinh: overview.tong_quy_dinh,
  }
}

function buildGiuongTheoChiNhanhEntity(rows) {
  return rows.map((row) => ({
    ma_cn: row.ma_cn,
    ten_cn: row.ten_cn,
    dang_su_dung: row.dang_su_dung,
    da_dat_coc: row.da_dat_coc,
    trong: row.trong,
  }))
}

function buildPhanBoNhanSuEntity(rows) {
  return rows.map((row) => ({
    label: LOAI_NV_LABELS[row.loai_nv] || row.loai_nv,
    pct: row.pct,
  }))
}

export function buildAdminOverviewEntity(overview) {
  return {
    data: buildOverviewEntity(overview),
    generatedAt: new Date().toISOString(),
  }
}

export function buildGiuongTheoChiNhanhResponse(rows) {
  return {
    data: buildGiuongTheoChiNhanhEntity(rows),
    generatedAt: new Date().toISOString(),
  }
}

export function buildPhanBoNhanSuResponse(rows) {
  return {
    data: buildPhanBoNhanSuEntity(rows),
    generatedAt: new Date().toISOString(),
  }
}
