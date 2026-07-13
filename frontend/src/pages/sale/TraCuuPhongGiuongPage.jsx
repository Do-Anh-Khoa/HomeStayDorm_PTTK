import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api.js'

const ROOM_IMAGE =
  'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=900&q=80'

const DEFAULT_FILTERS = {
  chi_nhanh: '',
  loai_phong: '',
  trang_thai: 'Trống',
}

const DEFAULT_OPTIONS = {
  chi_nhanh: [{ value: '', label: 'Tất cả chi nhánh' }],
  loai_phong: [{ value: '', label: 'Tất cả loại phòng' }],
  trang_thai: [{ value: '', label: 'Tất cả tình trạng' }],
  tieu_chi: [],
}

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
)

const IconEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" />
  </svg>
)

const IconCheckCircle = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

const formatMoneyShort = value => {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return '0'
  }

  if (number >= 1000000) {
    const million = number / 1000000
    return `${million.toFixed(million % 1 === 0 ? 0 : 1)}tr`
  }

  return new Intl.NumberFormat('vi-VN').format(number)
}

const formatMoney = value => {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return '0'
  }

  return new Intl.NumberFormat('vi-VN').format(number)
}

const formatTermRange = room => {
  const min = Number(room?.thoi_han_toi_thieu || 0)
  const max = Number(room?.thoi_han_toi_da || 0)

  if (!min && !max) {
    return 'Chưa có'
  }

  if (min && max && min === max) {
    return `${min} tháng`
  }

  if (min && max) {
    return `${min} - ${max} tháng`
  }

  if (min) {
    return `Từ ${min} tháng`
  }

  return `Tối đa ${max} tháng`
}

const getCriteriaArray = room => {
  if (Array.isArray(room?.tieu_chi)) {
    return room.tieu_chi
  }

  if (room?.tieu_chi_text) {
    return String(room.tieu_chi_text)
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
  }

  return []
}

const getCriteriaText = room => {
  if (room?.tieu_chi_text) {
    return room.tieu_chi_text
  }

  const criteria = getCriteriaArray(room)

  return criteria.length
    ? criteria.join(', ')
    : 'Không có tiêu chí đặc biệt'
}

const normalizeRoom = room => {
  const criteria = getCriteriaArray(room)

  return {
    ...room,
    gia_giuong: Number(room.gia_giuong || 0),
    thoi_han_toi_thieu: Number(room.thoi_han_toi_thieu || 0),
    thoi_han_toi_da: Number(room.thoi_han_toi_da || 0),
    hinh_anh: ROOM_IMAGE,
    tien_ich:
      Array.isArray(room.tien_ich) && room.tien_ich.length > 0
        ? room.tien_ich
        : ['WiFi', ...criteria].slice(0, 3),
    tieu_chi: criteria,
    tieu_chi_text: room.tieu_chi_text || criteria.join(', '),
    beds: Array.isArray(room.beds) ? room.beds : [],
  }
}

function BedStatusBadge({ status }) {
  const styleByStatus = {
    Trống: S.bedBadgeEmpty,
    'Đã đặt': S.bedBadgeBooked,
    'Đã đặt cọc': S.bedBadgeBooked,
    'Đang sử dụng': S.bedBadgeUsing,
    'Đang bảo trì': S.bedBadgeMaintenance,
  }

  return (
    <span style={{ ...S.bedBadge, ...(styleByStatus[status] || S.bedBadgeMaintenance) }}>
      {status}
    </span>
  )
}

function RoomDetailModal({ room, onClose }) {
  if (!room) {
    return null
  }

  return (
    <div style={S.modalOverlay}>
      <div style={S.modalBox}>
        <div style={S.modalHeader}>
          <h2 style={S.modalTitle}>
            Phòng: {room.ten_hien_thi || room.ma_phong} - {room.ten_loai}
          </h2>

          <button type="button" style={S.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div style={S.criteriaLine}>
          <strong>Tiêu chí:</strong> {getCriteriaText(room)}
        </div>

        <div style={S.criteriaLine}>
          <strong>Thời hạn thuê:</strong> {formatTermRange(room)}
        </div>

        <div style={S.modalTableWrap}>
          <table style={S.modalTable}>
            <thead>
              <tr>
                <th style={S.modalTh}>Mã giường</th>
                <th style={S.modalTh}>Trạng thái</th>
                <th style={{ ...S.modalTh, textAlign: 'right' }}>Đơn giá (VNĐ/Tháng)</th>
              </tr>
            </thead>

            <tbody>
              {room.beds.length === 0 ? (
                <tr>
                  <td colSpan="3" style={S.modalEmptyCell}>
                    Không có dữ liệu giường.
                  </td>
                </tr>
              ) : (
                room.beds.map(bed => (
                  <tr key={bed.ma_giuong} style={S.modalTr}>
                    <td style={S.modalTd}>
                      <strong>{bed.ma_giuong}</strong>
                    </td>

                    <td style={S.modalTd}>
                      <BedStatusBadge status={bed.trang_thai} />
                    </td>

                    <td style={{ ...S.modalTd, textAlign: 'right', fontWeight: 700 }}>
                      {formatMoney(bed.don_gia)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={S.modalFooter}>
          <button type="button" style={S.btnCancel} onClick={onClose}>
            Hủy bỏ
          </button>
        </div>
      </div>
    </div>
  )
}

function RoomCard({ room, onViewDetail }) {
  return (
    <article style={S.roomCard}>
      <div style={S.imageWrap}>
        <img src={ROOM_IMAGE} alt={room.ten_hien_thi || room.ma_phong} style={S.roomImage} />

        <span style={S.statusBadge}>{room.trang_thai}</span>
      </div>

      <div style={S.roomBody}>
        <div style={S.roomTop}>
          <div style={S.roomInfo}>
            <h3 style={S.roomCode}>{room.ten_hien_thi || room.ma_phong}</h3>
            <p style={S.roomType}>Loại: {room.ten_loai}</p>
            <p style={S.roomTerm}>Thời hạn: {formatTermRange(room)}</p>
          </div>

          <div style={S.priceBox}>
            <strong>{formatMoneyShort(room.gia_giuong)}</strong>
            <span>/THÁNG</span>
          </div>
        </div>

        <div style={S.chipRow}>
          {room.tien_ich.map(item => (
            <span key={item} style={S.chip}>
              {item}
            </span>
          ))}
        </div>

        <button type="button" style={S.btnDetail} onClick={() => onViewDetail(room)}>
          Xem chi tiết
        </button>
      </div>
    </article>
  )
}

export default function TraCuuPhongGiuongPage() {
  const [search, setSearch] = useState('')

  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [criteria, setCriteria] = useState([])
  const [appliedCriteria, setAppliedCriteria] = useState([])

  const [options, setOptions] = useState(DEFAULT_OPTIONS)
  const [rooms, setRooms] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [loadingRooms, setLoadingRooms] = useState(false)

  const [selectedRoom, setSelectedRoom] = useState(null)
  const [shouldShowEditButton] = useState(false)

  const setFilter = (key, value) => {
    setFilters(current => ({
      ...current,
      [key]: value,
    }))
  }

  const toggleCriteria = item => {
    setCriteria(current => {
      const existed = current.includes(item)

      if (existed) {
        return current.filter(value => value !== item)
      }

      return [...current, item]
    })
  }

  const filteredRooms = useMemo(() => {
  if (appliedCriteria.length === 0) {
    return rooms
  }

  return rooms.filter(room => {
    const roomCriteria = getCriteriaArray(room)
    return appliedCriteria.some(item => roomCriteria.includes(item))
  })
}, [rooms, appliedCriteria])

  const fetchOptions = async () => {
    setLoadingOptions(true)

    try {
      const response = await api.get('/tra-cuu-phong-giuong/options')
      const data = response.data || {}

      setOptions({
        chi_nhanh: data.chi_nhanh || DEFAULT_OPTIONS.chi_nhanh,
        loai_phong: data.loai_phong || DEFAULT_OPTIONS.loai_phong,
        trang_thai: data.trang_thai || DEFAULT_OPTIONS.trang_thai,
        tieu_chi: data.tieu_chi || DEFAULT_OPTIONS.tieu_chi,
      })
    } catch (error) {
      console.error(error)
      window.alert('Không thể tải bộ lọc tra cứu phòng/giường.')
    } finally {
      setLoadingOptions(false)
    }
  }

  const fetchRooms = async (
  currentFilters = filters,
  currentCriteria = criteria,
  currentSearch = search,
) => {
  setLoadingRooms(true)

  try {
    const params = {}

    if (currentSearch.trim()) {
      params.search = currentSearch.trim()
    }

    if (currentFilters.chi_nhanh) {
      params.chi_nhanh = currentFilters.chi_nhanh
    }

    if (currentFilters.loai_phong) {
      params.loai_phong = currentFilters.loai_phong
    }

    if (currentFilters.trang_thai) {
      params.trang_thai = currentFilters.trang_thai
    }

    if (currentCriteria.length > 0) {
      params.tieu_chi = currentCriteria.join(',')
    }

    const response = await api.get('/tra-cuu-phong-giuong', {
      params,
    })

    const data = Array.isArray(response.data) ? response.data : []

    setRooms(data.map(normalizeRoom))
    setAppliedCriteria(currentCriteria)
  } catch (error) {
    console.error(error)
    window.alert('Không thể tải danh sách phòng/giường.')
  } finally {
    setLoadingRooms(false)
  }
}

  useEffect(() => {
    fetchOptions()
    fetchRooms(DEFAULT_FILTERS, [], '')
  }, [])

  const handleSearch = () => {
    fetchRooms(filters, criteria, search)
  }

  const handleViewDetail = async room => {
    try {
      const response = await api.get(`/tra-cuu-phong-giuong/${room.ma_phong}`)
      setSelectedRoom(normalizeRoom(response.data || room))
    } catch (error) {
      console.error(error)
      window.alert('Không thể tải chi tiết phòng.')
    }
  }

  const handleEditRegistration = () => {
    window.alert('Chức năng chỉnh sửa hồ sơ đăng ký sẽ làm sau.')
  }

  return (
    <section style={S.page}>
      <div style={S.pageHeader}>
        <h1 style={S.title}>Tra cứu phòng và giường</h1>
        <p style={S.description}>
          Tra cứu phòng/giường trống theo chi nhánh, loại phòng và tình trạng.
        </p>
      </div>

      <div style={S.searchCard}>
        <div style={S.searchRow}>
          <div style={S.searchInputWrap}>
            <span style={S.searchIcon}>
              <IconSearch />
            </span>

            <input
              style={S.searchInput}
              value={search}
              onChange={event => setSearch(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  handleSearch()
                }
              }}
              placeholder="Nhập mã hồ sơ đăng ký hoặc mã phòng"
            />
          </div>

          <button type="button" style={S.btnSearch} onClick={handleSearch}>
            {loadingRooms ? 'Đang tải...' : 'Tìm kiếm'}
          </button>
        </div>

        <div style={S.filterGrid}>
          <div>
            <label style={S.label}>Chi nhánh</label>
            <select
              style={S.select}
              value={filters.chi_nhanh}
              onChange={event => setFilter('chi_nhanh', event.target.value)}
              disabled={loadingOptions}
            >
              {options.chi_nhanh.map(option => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={S.label}>Loại phòng</label>
            <select
              style={S.select}
              value={filters.loai_phong}
              onChange={event => setFilter('loai_phong', event.target.value)}
              disabled={loadingOptions}
            >
              {options.loai_phong.map(option => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={S.label}>Tình trạng</label>
            <select
              style={S.select}
              value={filters.trang_thai}
              onChange={event => setFilter('trang_thai', event.target.value)}
              disabled={loadingOptions}
            >
              {options.trang_thai.map(option => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      <div style={S.criteriaSection}>
        <div style={S.criteriaTitle}>
          <IconCheckCircle />
          <span>TIỆN ÍCH & YÊU CẦU ĐẶC BIỆT</span>
        </div>

        <div style={S.criteriaGrid}>
          {options.tieu_chi.length === 0 ? (
            <p style={S.criteriaEmptyText}>Chưa có tiêu chí phòng.</p>
          ) : (
            options.tieu_chi.map(option => (
              <label key={option.value} style={S.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={criteria.includes(option.value)}
                  onChange={() => toggleCriteria(option.value)}
                />
                <span style={S.checkboxText}>{String(option.label).toUpperCase()}</span>
              </label>
            ))
          )}
        </div>
      </div>

      {loadingRooms ? (
        <div style={S.emptyBox}>
          <p style={S.emptyText}>Đang tải danh sách phòng...</p>
        </div>
      ) : filteredRooms.length > 0 ? (
        <div style={S.roomGrid}>
          {filteredRooms.map(room => (
            <RoomCard
              key={room.ma_phong}
              room={room}
              onViewDetail={handleViewDetail}
            />
          ))}
        </div>
      ) : (
        <div style={S.emptyBox}>
          <p style={S.emptyText}>Không tìm thấy, mời đổi tiêu chí</p>

          {shouldShowEditButton && (
            <button type="button" style={S.btnEditCriteria} onClick={handleEditRegistration}>
              <IconEdit />
              Chỉnh sửa hồ sơ
            </button>
          )}
        </div>
      )}

      <RoomDetailModal
        room={selectedRoom}
        onClose={() => setSelectedRoom(null)}
      />
    </section>
  )
}

const S = {
  page: {
    minHeight: '100%',
    maxHeight: 'calc(100vh - 96px)',
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingRight: '8px',
    paddingBottom: '24px',
    boxSizing: 'border-box',
    backgroundColor: 'transparent',
  },

  pageHeader: {
    marginBottom: '14px',
  },

  title: {
    margin: 0,
    color: '#1a1f14',
    fontSize: '28px',
    fontWeight: 800,
    lineHeight: 1.2,
  },

  description: {
    margin: '6px 0 0',
    color: '#5f675b',
    fontSize: '14px',
  },

  searchCard: {
    border: '1px solid #dde3d8',
    borderRadius: '8px',
    padding: '14px',
    backgroundColor: '#fff',
    marginBottom: '16px',
  },

  searchRow: {
    display: 'flex',
    gap: '14px',
    marginBottom: '14px',
  },

  searchInputWrap: {
    position: 'relative',
    flex: 1,
  },

  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#6b7560',
    display: 'inline-flex',
  },

  searchInput: {
    width: '100%',
    height: '40px',
    boxSizing: 'border-box',
    padding: '10px 14px 10px 42px',
    border: '1.5px solid #cfd6c9',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: '#1a1f14',
    outline: 'none',
    backgroundColor: '#fff',
  },

  btnSearch: {
    width: '100px',
    height: '40px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#3b4f27',
    color: '#fff',
    fontFamily: 'inherit',
    fontWeight: 700,
    cursor: 'pointer',
  },

  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(140px, 1fr))',
    gap: '14px',
  },

  label: {
    display: 'block',
    marginBottom: '6px',
    color: '#5f675b',
    fontSize: '12px',
    fontWeight: 600,
  },

  select: {
    width: '100%',
    height: '36px',
    padding: '0 10px',
    border: '1.5px solid #cfd6c9',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#1a1f14',
    fontFamily: 'inherit',
    outline: 'none',
  },

  criteriaSection: {
    marginBottom: '18px',
    border: '1px solid #dde3d8',
    borderRadius: '8px',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },

  criteriaTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '12px 16px',
    borderBottom: '1px solid #eef0eb',
    color: '#3b4f27',
    fontSize: '13px',
    fontWeight: 800,
    backgroundColor: '#fff',
  },

  criteriaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(140px, 1fr))',
    gap: '12px 24px',
    padding: '14px 16px',
  },

  criteriaEmptyText: {
    gridColumn: '1 / -1',
    margin: 0,
    color: '#8b9285',
    fontSize: '14px',
  },

  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#1a1f14',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
  },

  checkboxText: {
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },

  roomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 255px))',
    gap: '22px',
    alignItems: 'start',
    justifyContent: 'start',
  },

  roomCard: {
    border: '1px solid #d6dccf',
    borderRadius: '6px',
    backgroundColor: '#fff',
    overflow: 'hidden',
    boxShadow: '0 8px 18px rgba(20, 30, 15, 0.07)',
  },

  imageWrap: {
    position: 'relative',
    height: '122px',
    overflow: 'hidden',
    backgroundColor: '#f3f4f1',
  },

  roomImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },

  statusBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    padding: '5px 11px',
    borderRadius: '999px',
    backgroundColor: '#dcffe1',
    color: '#30b44d',
    fontSize: '12px',
    fontWeight: 800,
  },

  roomBody: {
    padding: '12px',
  },

  roomTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '10px',
    marginBottom: '10px',
  },

  roomInfo: {
    minWidth: 0,
    flex: 1,
  },

  roomCode: {
    margin: 0,
    color: '#2f4426',
    fontSize: '20px',
    fontWeight: 800,
    lineHeight: 1.1,
    whiteSpace: 'nowrap',
  },

  roomType: {
    margin: '4px 0 0',
    color: '#6c7468',
    fontSize: '11px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  roomTerm: {
    margin: '3px 0 0',
    color: '#6c7468',
    fontSize: '11px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  priceBox: {
    flexShrink: 0,
    minWidth: '92px',
    textAlign: 'right',
    color: '#2f4426',
    whiteSpace: 'nowrap',
    fontSize: '12px',
  },

  chipRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    minHeight: '25px',
    marginBottom: '12px',
  },

  chip: {
    maxWidth: '100%',
    padding: '4px 8px',
    borderRadius: '999px',
    backgroundColor: '#f0f2ee',
    color: '#4d554a',
    fontSize: '10px',
    fontWeight: 700,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  btnDetail: {
    width: '100%',
    height: '34px',
    border: '1.5px solid #3b4f27',
    borderRadius: '3px',
    backgroundColor: '#fff',
    color: '#1a1f14',
    fontFamily: 'inherit',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
  },

  emptyBox: {
    minHeight: '260px',
    border: '2px dashed #d4dacd',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    color: '#787f74',
  },

  emptyText: {
    margin: 0,
    fontSize: '16px',
  },

  btnEditCriteria: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    height: '40px',
    padding: '0 18px',
    border: '1.5px solid #bfc7b8',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#56604f',
    fontFamily: 'inherit',
    fontWeight: 600,
    cursor: 'pointer',
  },

  modalOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30, 35, 28, 0.25)',
  },

  modalBox: {
    width: 'min(680px, calc(100vw - 40px))',
    maxHeight: '86vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
    padding: '20px 24px 18px',
    overflow: 'hidden',
  },

  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #eef0eb',
  },

  modalTitle: {
    margin: 0,
    color: '#3b4f27',
    fontSize: '22px',
    fontWeight: 800,
  },

  closeButton: {
    border: 'none',
    backgroundColor: 'transparent',
    color: '#aab0a5',
    fontSize: '34px',
    lineHeight: 1,
    cursor: 'pointer',
  },

  criteriaLine: {
    margin: '6px 0',
    color: '#4e574a',
    fontSize: '13px',
    lineHeight: 1.35,
  },
  modalTableWrap: {
    maxHeight: '48vh',
    overflowY: 'auto',
    overflowX: 'hidden',
    borderTop: '1px solid #eef0eb',
  // đẩy thanh cuộn nhích qua phải
  marginRight: '-14px',
  paddingRight: '14px',
  },

  modalTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },

  modalTh: {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    padding: '10px 0',
    backgroundColor: '#fff',
    color: '#9fa79c',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: 800,
    borderBottom: '1px solid #eef0eb',
  },

  modalTr: {
    borderBottom: '1px solid #f1f2ef',
  },

  modalTd: {
    padding: '12px 0',
    color: '#505866',
    fontSize: '16px',
  },

  modalEmptyCell: {
    padding: '22px 0',
    color: '#8b9285',
    textAlign: 'center',
    fontSize: '14px',
  },

  bedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '58px',
    padding: '5px 10px',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: 800,
  },

  bedBadgeEmpty: {
    backgroundColor: '#e2f8e5',
    color: '#56c76a',
  },

  bedBadgeBooked: {
    backgroundColor: '#fff0b8',
    color: '#ffd04d',
  },

  bedBadgeUsing: {
    backgroundColor: '#ffd2d7',
    color: '#ff5c65',
  },

  bedBadgeMaintenance: {
    backgroundColor: '#eeeeee',
    color: '#8e908f',
  },

  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '14px',
  },

  btnCancel: {
    width: '110px',
    height: '42px',
    border: 'none',
    borderRadius: '10px',
    backgroundColor: '#ededf0',
    color: '#59606b',
    fontFamily: 'inherit',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer',
  },
}