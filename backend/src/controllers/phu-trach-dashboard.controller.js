import { getPhuTrachDashboardSnapshot } from '../database/phu-trach-dashboard.database.js'
import { buildPhuTrachDashboardEntity } from '../entities/phu-trach-dashboard.entity.js'

export async function getPhuTrachDashboard(req, res, next) {
  try {
    const snapshot = await getPhuTrachDashboardSnapshot({
      maCn: req.auth?.ma_cn || null,
      maNv: req.auth?.ma_nv || null,
    })

    res.json(buildPhuTrachDashboardEntity(snapshot))
  } catch (error) {
    next(error)
  }
}