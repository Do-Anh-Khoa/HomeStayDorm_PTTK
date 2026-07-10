import { getSaleDashboardSnapshot } from '../database/sale-dashboard.database.js'
import { buildSaleDashboardEntity } from '../entities/sale-dashboard.entity.js'

export async function getSaleDashboard(req, res, next) {
  try {
    const snapshot = await getSaleDashboardSnapshot({
      maCn: req.auth?.ma_cn || null,
      maNv: req.auth?.ma_nv || null,
    })

    res.json(buildSaleDashboardEntity(snapshot))
  } catch (error) {
    next(error)
  }
}
