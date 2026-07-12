import { useMemo, useState } from 'react'

const ROOM_IMAGE_1 =
  'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=900&q=80'

const ROOM_IMAGE_2 =
  'https://images.unsplash.com/photo-1631049035182-249067d7618e?auto=format&fit=crop&w=900&q=80'

// FRONTEND MOCK TRƯỚC
// Sau này có backend thì thay bằng api.get(...)
const MOCK_ROOMS = [
  {
    ma_phong: 'P101',
    ten_hien_thi: 'P.101',
    ten_loai: 'Phòng 4 Nam',
    chi_nhanh: 'CN001',
    ten_chi_nhanh: 'HomeStay Dorm Quận 1',
    loai_phong: 'PHONG_4_NAM',
    suc_chua: 4,
    gioi_tinh: 'Nam',
    gia_giuong: 1800000,
    trang_thai: 'Trống',
    muc_gia: 'DUOI_2_TRIEU',
    hinh_anh: ROOM_IMAGE_1,
    tien_ich: ['WiFi', 'Điều hòa', 'Giặt sấy'],
    tieu_chi: ['Có máy lạnh', 'Không gian yên tĩnh', 'Có ban công'],
    beds: [
      { ma_giuong: 'Giường A', trang_thai: 'Trống', don_gia: 1800000 },
      { ma_giuong: 'Giường B', trang_thai: 'Đã đặt', don_gia: 1800000 },
      { ma_giuong: 'Giường C', trang_thai: 'Đang sử dụng', don_gia: 1800000 },
      { ma_giuong: 'Giường D', trang_thai: 'Đang bảo trì', don_gia: 1800000 },
    ],
  },
  {
    ma_phong: 'P102',
    ten_hien_thi: 'P.102',
    ten_loai: 'Phòng 4 Nữ',
    chi_nhanh: 'CN001',
    ten_chi_nhanh: 'HomeStay Dorm Quận 1',
    loai_phong: 'PHONG_4_NU',
    suc_chua: 4,
    gioi_tinh: 'Nữ',
    gia_giuong: 1900000,
    trang_thai: 'Trống',
    muc_gia: 'DUOI_2_TRIEU',
    hinh_anh: ROOM_IMAGE_2,
    tien_ich: ['WiFi', 'Cửa sổ lớn'],
    tieu_chi: ['Gần khu vệ sinh', 'Có bãi đỗ xe'],
    beds: [
      { ma_giuong: 'Giường A', trang_thai: 'Trống', don_gia: 1900000 },
      { ma_giuong: 'Giường B', trang_thai: 'Trống', don_gia: 1900000 },
      { ma_giuong: 'Giường C', trang_thai: 'Đã đặt', don_gia: 1900000 },
      { ma_giuong: 'Giường D', trang_thai: 'Đang sử dụng', don_gia: 1900000 },
    ],
  },
]

const MOCK_REGISTRATIONS = [
  {
    ma_dk: 'HSDK001',
    cccd: '012345678901',
    ten_kh: 'Nguyễn Văn An',
    sdt: '0901234567',
    chi_nhanh: 'CN001',
    loai_phong: 'PHONG_4_NAM',
    trang_thai: 'Trống',
    muc_gia: 'DUOI_2_TRIEU',
    tieu_chi: ['Có máy lạnh', 'Có ban công'],
  },
  {
    ma_dk: 'HSDK999',
    cccd: '099999999999',
    ten_kh: 'Khách Không Có Phòng',
    sdt: '0999999999',
    chi_nhanh: 'CN002',
    loai_phong: 'PHONG_8_NAM',
    trang_thai: 'Trống',
    muc_gia: 'DUOI_2_TRIEU',
    tieu_chi: ['Yêu cầu giường tầng dưới', 'Có ban công'],
  },
]

const BRANCH_OPTIONS = [
  { value: '', label: 'Tất cả chi nhánh' },
  { value: 'CN001', label: 'HomeStay Dorm Quận 1' },
  { value: 'CN002', label: 'HomeStay Dorm Bình Thạnh' },
]

const ROOM_TYPE_OPTIONS = [
  { value: '', label: 'Tất cả loại phòng' },
  { value: 'PHONG_4_NAM', label: 'Phòng 4 người' },
  { value: 'PHONG_4_NU', label: 'Phòng 4 nữ' },
  { value: 'PHONG_8_NAM', label: 'Phòng 8 nam' },
  { value: 'PHONG_8_NU', label: 'Phòng 8 nữ' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả tình trạng' },
  { value: 'Trống', label: 'Trống' },
  { value: 'Đã đặt', label: 'Đã đặt' },
  { value: 'Đang sử dụng', label: 'Đang sử dụng' },
]

const PRICE_OPTIONS = [
  { value: '', label: 'Tất cả mức giá' },
  { value: 'DUOI_2_TRIEU', label: 'Dưới 2 triệu' },
  { value: 'TU_2_DEN_3_TRIEU', label: 'Từ 2 - 3 triệu' },
  { value: 'TREN_3_TRIEU', label: 'Trên 3 triệu' },
]

const CRITERIA_OPTIONS = [
  'Có máy lạnh',
  'Giờ giấc tự do',
  'Có bãi đỗ xe',
  'Gần khu vệ sinh',
  'Không gian yên tĩnh',
  'Có ban công',
  'Yêu cầu giường tầng dưới',
]

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
  const million = Number(value) / 1000000

  if (!Number.isFinite(million)) {
    return '0tr'
  }

  return `${million.toFixed(million % 1 === 0 ? 0 : 1)}tr`
}

const formatMoney = value => {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return '0'
  }

  return new Intl.NumberFormat('vi-VN').format(number)
}

const normalizeText = value => {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function BedStatusBadge({ status }) {
  const styleByStatus = {
    Trống: S.bedBadgeEmpty,
    'Đã đặt': S.bedBadgeBooked,
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
            Phòng: {room.ten_hien_thi} - {room.ten_loai}
          </h2>

          <button type="button" style={S.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div style={S.criteriaLine}>
          <strong>Tiêu chí:</strong>{' '}
          {room.tieu_chi?.length ? room.tieu_chi.join(', ') : 'Không có tiêu chí đặc biệt'}
        </div>

        <table style={S.modalTable}>
          <thead>
            <tr>
              <th style={S.modalTh}>Mã giường</th>
              <th style={S.modalTh}>Trạng thái</th>
              <th style={{ ...S.modalTh, textAlign: 'right' }}>Đơn giá (VNĐ/Tháng)</th>
            </tr>
          </thead>

          <tbody>
            {room.beds.map(bed => (
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
            ))}
          </tbody>
        </table>

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
        <img src={room.hinh_anh} alt={room.ten_hien_thi} style={S.roomImage} />

        <span style={S.statusBadge}>{room.trang_thai}</span>
      </div>

      <div style={S.roomBody}>
        <div style={S.roomTop}>
          <div>
            <h3 style={S.roomCode}>{room.ten_hien_thi}</h3>
            <p style={S.roomType}>Loại: {room.ten_loai}</p>
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

// Bộ lọc đang chọn trên giao diện
  const [filters, setFilters] = useState({
    chi_nhanh: '',
    loai_phong: 'PHONG_4_NAM',
    trang_thai: 'Trống',
    muc_gia: 'DUOI_2_TRIEU',
  })

// Bộ lọc đã bấm "Tìm kiếm" mới áp dụng
  const [appliedFilters, setAppliedFilters] = useState({
    chi_nhanh: '',
    loai_phong: 'PHONG_4_NAM',
    trang_thai: 'Trống',
    muc_gia: 'DUOI_2_TRIEU',
  })

// Tiêu chí đang tick trên giao diện
  const [criteria, setCriteria] = useState([])

// Tiêu chí đã bấm "Tìm kiếm" mới áp dụng
  const [appliedCriteria, setAppliedCriteria] = useState([])

  const [activeSearchMode, setActiveSearchMode] = useState('combo')
  const [searchedRegistration, setSearchedRegistration] = useState(null)
  const [selectedRoom, setSelectedRoom] = useState(null)

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

  const filterRooms = (baseFilters, selectedCriteria) => {
    return MOCK_ROOMS.filter(room => {
      if (baseFilters.chi_nhanh && room.chi_nhanh !== baseFilters.chi_nhanh) {
        return false
      }

      if (baseFilters.loai_phong && room.loai_phong !== baseFilters.loai_phong) {
        return false
      }

      if (baseFilters.trang_thai && room.trang_thai !== baseFilters.trang_thai) {
        return false
      }

      if (baseFilters.muc_gia && room.muc_gia !== baseFilters.muc_gia) {
        return false
      }

      if (selectedCriteria.length > 0) {
        return selectedCriteria.every(item => room.tieu_chi.includes(item))
      }

      return true
    })
  }

  const rooms = useMemo(() => {
    if (activeSearchMode === 'registration' && searchedRegistration) {
      return filterRooms(
        {
          chi_nhanh: searchedRegistration.chi_nhanh,
          loai_phong: searchedRegistration.loai_phong,
          trang_thai: searchedRegistration.trang_thai,
          muc_gia: searchedRegistration.muc_gia,
        },
        searchedRegistration.tieu_chi || []
      )
    }

    return filterRooms(appliedFilters, appliedCriteria)
  }, [activeSearchMode, searchedRegistration, appliedFilters, appliedCriteria])

  const shouldShowEditButton =
    activeSearchMode === 'registration' &&
    Boolean(searchedRegistration) &&
    rooms.length === 0

  const handleSearch = () => {
  const keyword = normalizeText(search)

  // Không nhập thanh tìm kiếm thì áp dụng bộ lọc combobox/checkbox
  if (!keyword) {
    setActiveSearchMode('combo')
    setSearchedRegistration(null)
    setAppliedFilters(filters)
    setAppliedCriteria(criteria)
    return
  }

  // Có nhập thanh tìm kiếm thì tìm theo hồ sơ đăng ký / CCCD / tên / SĐT
  const registration = MOCK_REGISTRATIONS.find(item => {
    return (
      normalizeText(item.ma_dk).includes(keyword) ||
      normalizeText(item.cccd).includes(keyword) ||
      normalizeText(item.ten_kh).includes(keyword) ||
      normalizeText(item.sdt).includes(keyword)
    )
  })

  if (registration) {
    const registrationFilters = {
      chi_nhanh: registration.chi_nhanh,
      loai_phong: registration.loai_phong,
      trang_thai: registration.trang_thai,
      muc_gia: registration.muc_gia,
    }

    setActiveSearchMode('registration')
    setSearchedRegistration(registration)

    // Đồng bộ lên giao diện combobox để người dùng thấy tiêu chí của hồ sơ
    setFilters(registrationFilters)
    setCriteria(registration.tieu_chi || [])

    // Áp dụng ngay sau khi bấm tìm kiếm
    setAppliedFilters(registrationFilters)
    setAppliedCriteria(registration.tieu_chi || [])
    return
  }

  setActiveSearchMode('registration')
  setSearchedRegistration({
    ma_dk: search.trim(),
    tieu_chi: [],
  })

  setAppliedFilters(filters)
  setAppliedCriteria(criteria)
}

  const handleEditRegistration = () => {
    // Frontend trước nên chỉ log/mock.
    // Sau này có route chỉnh hồ sơ thì navigate(`/sale/ho-so-dang-ky/${searchedRegistration.ma_dk}/edit`)
    console.log('Chỉnh sửa hồ sơ:', searchedRegistration)
    window.alert('Frontend mock: chuyển sang màn hình chỉnh sửa hồ sơ đăng ký sau khi có route.')
  }

  return (
    <section style={S.page}>
      <div style={S.pageHeader}>
        <h1 style={S.title}>Tra cứu phòng và giường</h1>
        <p style={S.description}>
          Quản lý và ghi nhận mọi hư hại được báo cáo trong quá trình trả phòng.
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
              placeholder="Nhập mã hồ sơ đăng ký, CCCD, tên khách hàng hoặc số điện thoại"
            />
          </div>

          <button type="button" style={S.btnSearch} onClick={handleSearch}>
            Tìm kiếm
          </button>
        </div>

        <div style={S.filterGrid}>
          <div>
            <label style={S.label}>Chi nhánh</label>
            <select
              style={S.select}
              value={filters.chi_nhanh}
              onChange={event => setFilter('chi_nhanh', event.target.value)}
            >
              {BRANCH_OPTIONS.map(option => (
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
            >
              {ROOM_TYPE_OPTIONS.map(option => (
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
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={S.label}>Mức giá</label>
            <select
              style={S.select}
              value={filters.muc_gia}
              onChange={event => setFilter('muc_gia', event.target.value)}
            >
              {PRICE_OPTIONS.map(option => (
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
          {CRITERIA_OPTIONS.map(item => (
            <label key={item} style={S.checkboxLabel}>
              <input
                type="checkbox"
                checked={criteria.includes(item)}
                onChange={() => toggleCriteria(item)}
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>

      {rooms.length > 0 ? (
        <div style={S.roomGrid}>
          {rooms.map(room => (
            <RoomCard
              key={room.ma_phong}
              room={room}
              onViewDetail={setSelectedRoom}
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
    backgroundColor: 'transparent',
  },

  pageHeader: {
    marginBottom: '14px',
  },

  title: {
    margin: 0,
    color: '#1a1f14',
    fontSize: '30px',
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
    padding: '16px',
    backgroundColor: '#fff',
    marginBottom: '20px',
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
    height: '42px',
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
    height: '42px',
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
    gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))',
    gap: '18px',
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
    height: '38px',
    padding: '0 10px',
    border: '1.5px solid #cfd6c9',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#1a1f14',
    fontFamily: 'inherit',
    outline: 'none',
  },

  criteriaSection: {
    marginBottom: '24px',
    border: '1px solid #dde3d8',
    borderRadius: '8px',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },

  criteriaTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '14px 16px',
    borderBottom: '1px solid #eef0eb',
    color: '#3b4f27',
    fontSize: '13px',
    fontWeight: 800,
    backgroundColor: '#fff',
  },

  criteriaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(140px, 1fr))',
    gap: '14px 28px',
    padding: '16px',
  },

  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#1a1f14',
    fontSize: '14px',
    cursor: 'pointer',
  },

  roomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(240px, 330px))',
    gap: '44px',
    alignItems: 'start',
  },

  roomCard: {
    border: '1px solid #d6dccf',
    borderRadius: '6px',
    backgroundColor: '#fff',
    overflow: 'hidden',
    boxShadow: '0 8px 20px rgba(20, 30, 15, 0.08)',
  },

  imageWrap: {
    position: 'relative',
    height: '176px',
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
    top: '12px',
    right: '12px',
    padding: '6px 12px',
    borderRadius: '999px',
    backgroundColor: '#dcffe1',
    color: '#30b44d',
    fontSize: '12px',
    fontWeight: 800,
  },

  roomBody: {
    padding: '14px 16px 16px',
  },

  roomTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '14px',
  },

  roomCode: {
    margin: 0,
    color: '#2f4426',
    fontSize: '22px',
    fontWeight: 800,
  },

  roomType: {
    margin: '2px 0 0',
    color: '#3f463b',
    fontSize: '13px',
  },

  priceBox: {
    textAlign: 'right',
    color: '#2f4426',
  },

  priceBoxStrong: {},

  chipRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginBottom: '14px',
  },

  chip: {
    padding: '5px 9px',
    borderRadius: '999px',
    backgroundColor: '#f0f2ee',
    color: '#4d554a',
    fontSize: '11px',
    fontWeight: 700,
  },

  btnDetail: {
    width: '100%',
    height: '38px',
    border: '1.5px solid #3b4f27',
    borderRadius: '3px',
    backgroundColor: '#fff',
    color: '#1a1f14',
    fontFamily: 'inherit',
    fontWeight: 700,
    cursor: 'pointer',
  },

  emptyBox: {
    minHeight: '340px',
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
    width: 'min(760px, calc(100vw - 40px))',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
    padding: '28px 32px 24px',
  },

  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    paddingBottom: '20px',
    borderBottom: '1px solid #eef0eb',
  },

  modalTitle: {
    margin: 0,
    color: '#3b4f27',
    fontSize: '30px',
    fontWeight: 800,
  },

  closeButton: {
    border: 'none',
    backgroundColor: 'transparent',
    color: '#aab0a5',
    fontSize: '40px',
    lineHeight: 1,
    cursor: 'pointer',
  },

  criteriaLine: {
    margin: '16px 0 4px',
    color: '#4e574a',
    fontSize: '14px',
  },

  modalTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '12px',
  },

  modalTh: {
    padding: '18px 0',
    color: '#b1b7ae',
    textAlign: 'left',
    fontSize: '16px',
    fontWeight: 800,
    borderBottom: '1px solid #eef0eb',
  },

  modalTr: {
    borderBottom: '1px solid #f1f2ef',
  },

  modalTd: {
    padding: '22px 0',
    color: '#505866',
    fontSize: '20px',
  },

  bedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '70px',
    padding: '7px 14px',
    borderRadius: '999px',
    fontSize: '16px',
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
    marginTop: '26px',
  },

  btnCancel: {
    width: '150px',
    height: '58px',
    border: 'none',
    borderRadius: '14px',
    backgroundColor: '#ededf0',
    color: '#59606b',
    fontFamily: 'inherit',
    fontSize: '20px',
    fontWeight: 800,
    cursor: 'pointer',
  },
}