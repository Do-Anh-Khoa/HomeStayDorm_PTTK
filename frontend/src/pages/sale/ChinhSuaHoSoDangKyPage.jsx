import { useEffect, useMemo, useState } from 'react'
import { BriefcaseBusiness, CircleCheck, Home, UserRound } from 'lucide-react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { fetchHoSoDangKyFormOptions, updateHoSoDangKy, fetchHoSoDangKyDetail } from '../../services/hoSoDangKy.js'

function getTomorrowDateInput() {
  const now = new Date()
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const year = tomorrow.getFullYear()
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
  const day = String(tomorrow.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function SectionHeading({ icon: Icon, title }) {
  return (
    <div className="border-b border-[#ebeee7] pb-4">
      <div className="flex items-center gap-3 text-[#5b664d]">
        <Icon size={18} />
        <h2 className="text-[16px] font-bold uppercase tracking-[0.04em] text-[#5a664b]">
          {title}
        </h2>
      </div>
    </div>
  )
}

function InputField({ label, required = false, error = '', children }) {
  return (
    <label className="block space-y-2">
      <span className="text-[14px] font-semibold text-[#6a7065]">
        {label}{required ? ' *' : ''}
      </span>
      {children}
      {error && <span className="block text-[13px] font-medium text-[#ef4444] mt-1">{error}</span>}
    </label>
  )
}

function getFieldClass(hasError = false, disabled = false) {
  return `h-[52px] w-full rounded-[8px] border px-4 text-[15px] outline-none transition placeholder:text-[#a2a69d] focus:border-[#9dad88] ${
    disabled ? 'bg-[#f4f4f5] text-[#a1a1aa] cursor-not-allowed border-[#e4e4e7]' :
    hasError ? 'border-[#f87171] bg-[#fef2f2] text-[#b91c1c]' : 'border-[#d9ddd2] bg-white text-[#3b4037]'
  }`
}

export default function ChinhSuaHoSoDangKyPage() {
  const navigate = useNavigate()
  const { maDk } = useParams()
  
  const [formData, setFormData] = useState(null)
  const [selectedFeatures, setSelectedFeatures] = useState([])
  const [fieldErrors, setFieldErrors] = useState({})
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successModal, setSuccessModal] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [isEditable, setIsEditable] = useState(true)
  const [statusName, setStatusName] = useState('')

  const [formOptions, setFormOptions] = useState({ branches: [], rentTypes: [], termOptions: [], criteriaByBranch: {}, capacityByBranch: {} })

  const availableCriteria = useMemo(() => {
    if (!formData) {
      return []
    }

    const branchCriteria = formOptions.criteriaByBranch?.[formData.chiNhanh] || []
    const selectedMissingCriteria = selectedFeatures
      .filter(item => !branchCriteria.some(option => option.value === item))
      .map(item => ({ value: item, label: item }))

    return [...branchCriteria, ...selectedMissingCriteria]
  }, [formData, formOptions.criteriaByBranch, selectedFeatures])

  const availableCapacities = useMemo(() => {
    if (!formData) {
      return []
    }

    return (formOptions.capacityByBranch?.[formData.chiNhanh] || [])
      .map(value => Number(value))
      .filter(Boolean)
  }, [formData, formOptions.capacityByBranch])

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        const [optionsRes, detailData] = await Promise.all([
          fetchHoSoDangKyFormOptions(),
          fetchHoSoDangKyDetail(maDk)
        ])

        if (!isMounted) return

        setFormOptions({
          branches: optionsRes.branches || [],
          rentTypes: optionsRes.rentTypes || [],
          termOptions: optionsRes.termOptions || [],
          criteriaByBranch: optionsRes.criteriaByBranch || {},
          capacityByBranch: optionsRes.capacityByBranch || {},
        })

        const data = detailData
        setStatusName(data.status)
     
        if (data.status !== 'Mới tiếp nhận') {
          setIsEditable(false)
        }

        // Xử lý định dạng ngày từ DD/MM/YYYY của Backend sang YYYY-MM-DD cho thẻ <input type="date">
        let parsedDate = ''
        if (data.moveInDate) {
          if (data.moveInDate.includes('/')) {
            const [d, m, y] = data.moveInDate.split('/')
            parsedDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
          } else {
            parsedDate = data.moveInDate.split('T')[0]
          }
        }

        // Bóc tách ID cho Select (Ví dụ: "3 tháng" -> "3", "CN001 - HomeStay..." -> "CN001")
        const parsedDuration = String(data.duration || '').replace(/\D/g, '') || '3'
        const parsedBranch = String(data.branch || '').split(' ')[0]
        const parsedRentType = String(data.rentType || '').includes('Nguyên phòng') ? 'Nguyên phòng' : 'Theo giường'

        setFormData({
          hoTen: data.customerName || '',
          soDienThoai: data.phone || '',
          email: data.email || '',
          gioiTinh: data.gender || 'Nam',
          cccd: data.cccd || '',
          ngheNghiep: data.occupation || '',
          quocTich: data.nationality || 'Việt Nam',
          hinhThucThue: parsedRentType,
          soLuongNguoi: String(data.peopleCount || '1').replace(/\D/g, ''),
          thoiGianVao: parsedDate,
          thoiHanThue: parsedDuration,
          chiNhanh: parsedBranch,
          tieuChi: data.criteriaItems ? data.criteriaItems.join(', ') : ''
        })

        if (data.criteriaItems) {
            setSelectedFeatures(data.criteriaItems)
        }

      } catch (error) {
        setErrorMsg('Không thể tải thông tin hồ sơ.')
      } finally {
        if(isMounted) setLoading(false)
      }
    }
    fetchData()
    return () => { isMounted = false }
  }, [maDk])

  useEffect(() => {
    if (!formData) {
      return
    }

    setFormData(current => {
      if (!current || current.hinhThucThue !== 'Nguyên phòng') {
        return current
      }

      const capacities = (formOptions.capacityByBranch?.[current.chiNhanh] || [])
        .map(value => Number(value))
        .filter(Boolean)

      if (capacities.length === 0) {
        if (current.soLuongNguoi === '') {
          return current
        }

        return {
          ...current,
          soLuongNguoi: '',
        }
      }

      if (capacities.includes(Number(current.soLuongNguoi))) {
        return current
      }

      return {
        ...current,
        soLuongNguoi: String(capacities[0]),
      }
    })
  }, [formData?.chiNhanh, formData?.hinhThucThue, formOptions.capacityByBranch])

  useEffect(() => {
    if (!formData) {
      return
    }

    const availableValues = new Set(
      (formOptions.criteriaByBranch?.[formData.chiNhanh] || []).map(item => item.value),
    )

    if (availableValues.size === 0) {
      setSelectedFeatures([])
      setFormData(current => current ? { ...current, tieuChi: '' } : current)
      return
    }

    setSelectedFeatures(current => {
      const filtered = current.filter(item => availableValues.has(item))
      if (filtered.length === current.length) {
        return current
      }

      setFormData(currentForm => currentForm ? { ...currentForm, tieuChi: filtered.join(', ') } : currentForm)
      return filtered
    })
  }, [formData?.chiNhanh, formOptions.criteriaByBranch])

  const validateForm = () => {
    const nextErrors = {}
    const tomorrow = getTomorrowDateInput()
    if (!formData.hoTen.trim()) nextErrors.hoTen = 'Vui lòng nhập họ và tên'
    if (!/^\d{9,15}$/.test(formData.soDienThoai.replace(/\s+/g, ''))) nextErrors.soDienThoai = 'Số điện thoại không đúng định dạng'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) nextErrors.email = 'Email không hợp lệ'
    if (!/^\d{9,20}$/.test(formData.cccd.trim())) nextErrors.cccd = 'CCCD không hợp lệ'
    if (!Number.isInteger(Number(formData.soLuongNguoi)) || Number(formData.soLuongNguoi) <= 0) nextErrors.soLuongNguoi = 'Số lượng người phải lớn hơn 0'
    if (
      formData.hinhThucThue === 'Nguyên phòng' &&
      availableCapacities.length > 0 &&
      !availableCapacities.includes(Number(formData.soLuongNguoi))
    ) {
      nextErrors.soLuongNguoi = `Thuê nguyên phòng chỉ được chọn đúng sức chứa phòng hiện có (${availableCapacities.join(', ')} người)`
    }
    if (!formData.thoiGianVao) nextErrors.thoiGianVao = 'Vui lòng chọn ngày vào ở'
    if (formData.thoiGianVao && formData.thoiGianVao < tomorrow) nextErrors.thoiGianVao = 'Thời gian dự kiến vào ở phải là ngày trong tương lai'
    return nextErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!isEditable) return

    const nextErrors = validateForm()
    setFieldErrors(nextErrors)
    setErrorMsg('')

    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      // --- TẨY RỬA DỮ LIỆU ---
      const cleanedData = {
        ...formData,
        soDienThoai: formData.soDienThoai.replace(/\s+/g, ''), 
        cccd: formData.cccd.replace(/\s+/g, ''),
        // Chuyển string thành số để khớp với Backend
        soLuongNguoi: parseInt(formData.soLuongNguoi, 10), 
        thoiHanThue: parseInt(formData.thoiHanThue, 10)
      }

      await updateHoSoDangKy(maDk, cleanedData) 
      setSuccessModal(true)
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Không thể cập nhật hồ sơ.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelRequest = () => {
    if (submitting) {
      return
    }

    setCancelConfirmOpen(true)
  }

  const handleConfirmCancel = () => {
    setCancelConfirmOpen(false)
    navigate(`/sale/ho-so-dang-ky/${maDk}`)
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>

  return (
    <section className="relative space-y-6 pb-8">
      {cancelConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e2418]/35 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[460px] rounded-[20px] border border-[#d8ddcf] bg-white p-6 shadow-[0_20px_60px_rgba(33,41,21,0.18)] sm:p-7">
            <h2 className="text-[26px] font-extrabold tracking-[-0.02em] text-[#26351d]">
              Xác nhận hủy
            </h2>
            <p className="mt-3 text-[16px] leading-[1.7] text-[#5c6258]">
              Bạn có chắc muốn hủy chỉnh sửa hồ sơ không? Các thay đổi hiện tại sẽ không được lưu.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setCancelConfirmOpen(false)}
                className="inline-flex h-[48px] items-center justify-center rounded-[10px] border border-[#d9ddd2] px-6 text-[16px] font-semibold text-[#676d63] transition hover:bg-[#f5f7f1]"
              >
                Tiếp tục chỉnh sửa
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="inline-flex h-[48px] items-center justify-center rounded-[10px] bg-[#b94b45] px-6 text-[16px] font-semibold text-white transition hover:bg-[#a6403a]"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thành Công y hệt UI */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e2418]/35 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[400px] rounded-[20px] bg-white p-8 text-center shadow-xl">
            <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#dcfce7] text-[#16a34a]">
              <CircleCheck size={36} strokeWidth={2.5} />
            </div>
            <h2 className="mt-5 text-[24px] font-bold text-[#1a202c]">Ghi nhận thành công</h2>
            <p className="mt-2 text-[15px] text-[#64748b]">
              Thông tin hồ sơ đã được hệ thống cập nhật thành công.
            </p>
            <button
              onClick={() => navigate(`/sale/ho-so-dang-ky/${maDk}`)}
              className="mt-6 w-full rounded-lg bg-[#3f5227] py-3 text-[15px] font-semibold text-white transition hover:bg-[#344420]"
            >
              ← Quay lại danh sách
            </button>
          </div>
        </div>
      )}

      {/* Breadcrumb & Title */}
      <div>
        <div className="text-[13px] text-gray-500 mb-2 font-medium">
          <Link to="/sale/ho-so-dang-ky" className="hover:underline">Hồ sơ</Link> &gt; {formData?.hoTen} &gt; <span className="text-gray-900 font-bold">Chỉnh sửa hồ sơ</span>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-[28px] font-extrabold text-[#26351d]">
            Chỉnh sửa hồ sơ: {formData?.hoTen}
          </h1>
          {/* Badge trạng thái */}
          <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${
            statusName === 'Mới tiếp nhận' ? 'bg-[#dbeafe] text-[#1e40af]' : 
            statusName === 'Đã chốt cọc' ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-gray-100 text-gray-600'
          }`}>
            {statusName}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-[18px] border border-[#d9ddd2] bg-white p-6 shadow-sm">
        {errorMsg && (
          <div className="mb-6 rounded-lg bg-[#fef2f2] px-4 py-3 text-[14px] text-red-600 border border-red-200">
            {errorMsg}
          </div>
        )}
        
        {!isEditable && (
          <div className="mb-6 rounded-lg bg-orange-50 px-4 py-3 text-[14px] text-orange-700 border border-orange-200">
            Hồ sơ đang ở trạng thái <strong>{statusName}</strong> nên không thể chỉnh sửa.
          </div>
        )}

        <div className="grid gap-8 xl:grid-cols-2">
          {/* CỘT 1: THÔNG TIN CÁ NHÂN */}
          <div className="space-y-6">
            <SectionHeading icon={UserRound} title="1. Thông tin cá nhân" />
            <div className="space-y-5">
              <InputField label="Họ và tên" required error={fieldErrors.hoTen}>
                <input
                  type="text"
                  value={formData.hoTen}
                  onChange={e => { setFormData({...formData, hoTen: e.target.value}); setFieldErrors({...fieldErrors, hoTen: ''}) }}
                  className={getFieldClass(Boolean(fieldErrors.hoTen), !isEditable)}
                  disabled={!isEditable}
                />
              </InputField>

              <div className="grid grid-cols-2 gap-4">
                <InputField label="Số điện thoại" required error={fieldErrors.soDienThoai}>
                  <input
                    type="text"
                    value={formData.soDienThoai}
                    onChange={e => setFormData({...formData, soDienThoai: e.target.value})}
                    className={getFieldClass(Boolean(fieldErrors.soDienThoai), !isEditable)}
                    disabled={!isEditable}
                  />
                </InputField>
                <fieldset className="space-y-2">
                  <legend className="text-[14px] font-semibold text-[#6a7065]">Giới tính *</legend>
                  <select
                    value={formData.gioiTinh}
                    onChange={e => setFormData({...formData, gioiTinh: e.target.value})}
                    className={getFieldClass(false, !isEditable)}
                    disabled={!isEditable}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </fieldset>
              </div>

              <InputField label="Email" required error={fieldErrors.email}>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className={getFieldClass(Boolean(fieldErrors.email), !isEditable)}
                  disabled={!isEditable}
                />
              </InputField>

              <InputField label="CCCD/Passport" required error={fieldErrors.cccd}>
                <input
                  type="text"
                  value={formData.cccd}
                  onChange={e => setFormData({...formData, cccd: e.target.value})}
                  className={getFieldClass(Boolean(fieldErrors.cccd), !isEditable)}
                  disabled={!isEditable}
                />
              </InputField>

              <InputField label="Nghề nghiệp">
                <input
                  type="text"
                  value={formData.ngheNghiep}
                  onChange={e => setFormData({...formData, ngheNghiep: e.target.value})}
                  className={getFieldClass(false, !isEditable)}
                  disabled={!isEditable}
                />
              </InputField>
            </div>
          </div>

          {/* CỘT 2: NHU CẦU LƯU TRÚ */}
          <div className="space-y-6">
            <SectionHeading icon={Home} title="2. Nhu cầu lưu trú" />
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Hình thức thuê" required>
                  <select
                    value={formData.hinhThucThue}
                    onChange={e => {
                      const value = e.target.value
                      setFormData(current => {
                        if (value !== 'Nguyên phòng') {
                          return { ...current, hinhThucThue: value, soLuongNguoi: current.soLuongNguoi || '1' }
                        }

                        return {
                          ...current,
                          hinhThucThue: value,
                          soLuongNguoi: availableCapacities.length > 0 ? String(availableCapacities[0]) : '',
                        }
                      })
                      setFieldErrors(current => ({ ...current, soLuongNguoi: '' }))
                    }}
                    className={getFieldClass(false, !isEditable)}
                    disabled={!isEditable}
                  >
                    {formOptions.rentTypes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </InputField>
                <InputField label="Số lượng người" required error={fieldErrors.soLuongNguoi}>
                  {formData.hinhThucThue === 'Nguyên phòng' ? (
                    <select
                      value={formData.soLuongNguoi}
                      onChange={e => setFormData({...formData, soLuongNguoi: e.target.value})}
                      className={getFieldClass(Boolean(fieldErrors.soLuongNguoi), !isEditable)}
                      disabled={!isEditable || availableCapacities.length === 0}
                    >
                      {availableCapacities.length === 0 ? (
                        <option value="">Không có mức sức chứa phù hợp</option>
                      ) : (
                        availableCapacities.map(capacity => (
                          <option key={capacity} value={capacity}>{capacity} người</option>
                        ))
                      )}
                    </select>
                  ) : (
                    <input
                      type="number"
                      value={formData.soLuongNguoi}
                      onChange={e => setFormData({...formData, soLuongNguoi: e.target.value})}
                      className={getFieldClass(Boolean(fieldErrors.soLuongNguoi), !isEditable)}
                      disabled={!isEditable}
                    />
                  )}
                </InputField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputField label="Thời gian vào ở dự kiến" required error={fieldErrors.thoiGianVao}>
                  <input
                    type="date"
                    value={formData.thoiGianVao}
                    onChange={e => setFormData({...formData, thoiGianVao: e.target.value})}
                    min={getTomorrowDateInput()}
                    className={getFieldClass(Boolean(fieldErrors.thoiGianVao), !isEditable)}
                    disabled={!isEditable}
                  />
                </InputField>
                <InputField label="Thời hạn thuê" required>
                  <select
                    value={formData.thoiHanThue}
                    onChange={e => setFormData({...formData, thoiHanThue: e.target.value})}
                    className={getFieldClass(false, !isEditable)}
                    disabled={!isEditable}
                  >
                    {formOptions.termOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </InputField>
              </div>

              <InputField label="Chi nhánh ưu tiên" required>
                <select
                  value={formData.chiNhanh}
                  onChange={e => setFormData({...formData, chiNhanh: e.target.value})}
                  className={getFieldClass(false, !isEditable)}
                  disabled={!isEditable}
                >
                  {formOptions.branches.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </InputField>
            </div>
          </div>
        </div>

      
        <div className="mt-8 space-y-5 border-t border-[#edf0ea] pt-6">
          <SectionHeading icon={CircleCheck} title="Tiện ích & yêu cầu đặc biệt" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {availableCriteria.map(feature => (
              <label key={feature.value} className={`inline-flex items-start gap-3 text-[15px] font-medium ${isEditable ? 'text-[#4d534a] cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}>
                <input
                  type="checkbox"
                  checked={selectedFeatures.includes(feature.value)}
                  disabled={!isEditable}
                  onChange={(e) => {
                    const next = e.target.checked ? [...selectedFeatures, feature.value] : selectedFeatures.filter(i => i !== feature.value)
                    setSelectedFeatures(next)
                    setFormData({...formData, tieuChi: next.join(', ')})
                  }}
                  className="mt-1 h-4 w-4 rounded text-[#4b6132] focus:ring-[#4b6132]"
                />
                <span>{feature.label}</span>
              </label>
            ))}
          </div>
        </div>

      
        <div className="mt-10 flex justify-end gap-3 border-t border-[#edf0ea] pt-6">
          <button
            type="button"
            onClick={handleCancelRequest}
            disabled={submitting}
            className="h-[44px] rounded-md px-6 font-semibold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={!isEditable || submitting}
            className={`h-[44px] rounded-md px-6 font-semibold text-white transition ${
              !isEditable || submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#3b4f27] hover:bg-[#2d3d1e] shadow-md'
            }`}
          >
            {submitting ? 'Đang cập nhật...' : '💾 Cập nhật hồ sơ'}
          </button>
        </div>
      </form>
    </section>
  )
}
