import {
  buildCreateHoSoDangKyInput,
  buildCreatedHoSoDangKyEntity,
  buildHoSoDangKyDetailEntity,
  buildHoSoDangKyFormEntity,
  buildHoSoDangKyListEntity,
} from '../entities/ho-so-dang-ky.entity.js'
import {
  createHoSoDangKyRecord,
  getHoSoDangKyDetailSnapshot,
  getHoSoDangKyFormSnapshot,
  getHoSoDangKyListSnapshot,
  updateHoSoDangKyRecord, 
  cancelHoSoDangKyRecord  
} from '../database/ho-so-dang-ky.database.js'

export async function getHoSoDangKyFormOptions(req, res, next) {
  try {
    const snapshot = await getHoSoDangKyFormSnapshot({
      maCn: req.auth?.ma_cn || '',
    })

    res.json(buildHoSoDangKyFormEntity(snapshot))
  } catch (error) {
    next(error)
  }
}

export async function createHoSoDangKy(req, res, next) {
  try {
    const input = buildCreateHoSoDangKyInput(req.body, {
      maNv: req.auth?.ma_nv || '',
    })
    const record = await createHoSoDangKyRecord(input)

    res.status(201).json({
      message: 'Tạo hồ sơ thành công.',
      data: buildCreatedHoSoDangKyEntity(record),
    })
  } catch (error) {
    if (error.code === 'P2002') {
      error.status = 409
      error.message = 'CCCD hoặc email đã tồn tại trên hệ thống.'
    }
    next(error)
  }
}

export async function getHoSoDangKyList(req, res, next) {
  try {
    const snapshot = await getHoSoDangKyListSnapshot({
      search: req.query.search || '',
      status: req.query.status || '',
      page: req.query.page || 1,
      pageSize: req.query.pageSize || 4,
    })

    res.json(buildHoSoDangKyListEntity(snapshot))
  } catch (error) {
    next(error)
  }
}

export async function getHoSoDangKyDetail(req, res, next) {
  try {
    const record = await getHoSoDangKyDetailSnapshot(req.params.maDk)

    if (!record) {
      const notFoundError = new Error('Không tìm thấy hồ sơ đăng ký.')
      notFoundError.status = 404
      throw notFoundError
    }

    res.json(buildHoSoDangKyDetailEntity(record))
  } catch (error) {
    next(error)
  }
}
export async function updateHoSoDangKy(req, res, next) {
  try {
    const { maDk } = req.params
    const inputData = req.body

    
    const existingRecord = await getHoSoDangKyDetailSnapshot(maDk)
    if (!existingRecord) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ đăng ký.' })
    }

    if (existingRecord.trang_thai !== 'Mới tiếp nhận' && existingRecord.trang_thai !== 'Đã hẹn') {
      return res.status(400).json({ 
        message: 'Chỉ được phép chỉnh sửa hồ sơ ở trạng thái Mới tiếp nhận.' 
      })
    }

    
    inputData.maKhachHang = existingRecord.khach_hang

    const updatedRecord = await updateHoSoDangKyRecord(maDk, inputData)

    res.json({
      message: 'Cập nhật hồ sơ thành công.',
      data: updatedRecord
    })
  } catch (error) {
    if (error.code === 'P2002') {
      error.status = 409
      error.message = 'CCCD hoặc email đã bị trùng với khách hàng khác.'
    }
    next(error)
  }
}

export async function cancelHoSoDangKy(req, res, next) {
  try {
    const { maDk } = req.params
    
    const existingRecord = await getHoSoDangKyDetailSnapshot(maDk)
    if (!existingRecord) {
      return res.status(404).json({ message: 'Không tìm thấy hồ sơ đăng ký.' })
    }

    if (existingRecord.trang_thai === 'Hủy yêu cầu') {
      return res.status(400).json({ message: 'Hồ sơ này đã được hủy trước đó.' })
    }


    

    await cancelHoSoDangKyRecord(maDk)

    res.json({ message: 'Đã hủy hồ sơ đăng ký thành công.' })
  } catch (error) {
    next(error)
  }
}