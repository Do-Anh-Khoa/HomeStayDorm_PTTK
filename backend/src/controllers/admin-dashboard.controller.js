import {
  getAdminDashboardOverview,
  getGiuongTheoChiNhanh,
  getPhanBoNhanSu,
} from '../database/admin-dashboard.database.js'
import {
  buildAdminOverviewEntity,
  buildGiuongTheoChiNhanhResponse,
  buildPhanBoNhanSuResponse,
} from '../entities/admin-dashboard.entity.js'

export async function getTongQuan(req, res, next) {
  try {
    const overview = await getAdminDashboardOverview()
    res.json(buildAdminOverviewEntity(overview))
  } catch (error) {
    next(error)
  }
}

export async function getGiuongTheoChiNhanhHandler(req, res, next) {
  try {
    const rows = await getGiuongTheoChiNhanh()
    res.json(buildGiuongTheoChiNhanhResponse(rows))
  } catch (error) {
    next(error)
  }
}

export async function getPhanBoNhanSuHandler(req, res, next) {
  try {
    const rows = await getPhanBoNhanSu()
    res.json(buildPhanBoNhanSuResponse(rows))
  } catch (error) {
    next(error)
  }
}
