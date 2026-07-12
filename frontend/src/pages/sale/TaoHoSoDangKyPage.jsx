import { useEffect, useState } from 'react'
import { BriefcaseBusiness, CircleCheck, Home, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { createHoSoDangKy, fetchHoSoDangKyFormOptions } from '../../services/hoSoDangKy.js'

const INITIAL_FORM = {
  hoTen: '',
  soDienThoai: '',
  email: '',
  gioiTinh: 'Nam',
  cccd: '',
  ngheNghiep: '',
  quocTich: 'Việt Nam',
  hinhThucThue: 'Theo giường',
  soLuongNguoi: '1',
  thoiGianVao: '',
  thoiHanThue: '3',
  chiNhanh: '',
  tieuChi: '',
}

const SPECIAL_REQUESTS = [
  'Có máy lạnh',
  'Giờ giấc tự do',
  'Có bãi đỗ xe',
  'Gần khu vệ sinh',
  'Không gian yên tĩnh',
  'Có ban công',
  'Yêu cầu giường tầng dưới',
]

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
        {label}
        {required ? ' *' : ''}
      </span>
      {children}
      {error && <span className="block text-[14px] font-medium text-[#c1443e]">{error}</span>}
    </label>
  )
}

function getFieldClass(hasError = false) {
  return `h-[52px] w-full rounded-[8px] border bg-white px-4 text-[18px] text-[#3b4037] outline-none transition placeholder:text-[#a2a69d] focus:border-[#9dad88] ${
    hasError ? 'border-[#e7aaa6]' : 'border-[#d9ddd2]'
  }`
}

function validateForm(formData) {
  const nextErrors = {}

  if (!formData.hoTen.trim()) nextErrors.hoTen = 'Vui lòng nhập họ và tên.'
  if (!/^\d{9,15}$/.test(formData.soDienThoai.replace(/\s+/g, ''))) {
    nextErrors.soDienThoai = 'Số điện thoại không hợp lệ.'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
    nextErrors.email = 'Email không đúng định dạng.'
  }
  if (!formData.gioiTinh.trim()) nextErrors.gioiTinh = 'Vui lòng chọn giới tính.'
  if (!/^\d{9,20}$/.test(formData.cccd.trim())) {
    nextErrors.cccd = 'CCCD không hợp lệ.'
  }
  if (!formData.hinhThucThue.trim()) nextErrors.hinhThucThue = 'Vui lòng chọn hình thức thuê.'
  if (!Number.isInteger(Number(formData.soLuongNguoi)) || Number(formData.soLuongNguoi) <= 0) {
    nextErrors.soLuongNguoi = 'Số lượng người phải lớn hơn 0.'
  }
  if (!formData.thoiGianVao) nextErrors.thoiGianVao = 'Vui lòng chọn thời gian dự kiến vào ở.'
  if (!formData.thoiHanThue) nextErrors.thoiHanThue = 'Vui lòng chọn thời hạn thuê.'
  if (!formData.chiNhanh) nextErrors.chiNhanh = 'Vui lòng chọn chi nhánh.'

  return nextErrors
}

export default function TaoHoSoDangKyPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [selectedFeatures, setSelectedFeatures] = useState([])
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formOptions, setFormOptions] = useState({
    branches: [],
    rentTypes: [
      { value: 'Theo giường', label: 'Ở ghép / Theo giường' },
      { value: 'Nguyên phòng', label: 'Nguyên phòng' },
    ],
    termOptions: [
      { value: 3, label: '3 tháng' },
      { value: 6, label: '6 tháng' },
      { value: 12, label: '12 tháng' },
    ],
  })
  const [successState, setSuccessState] = useState(null)

  useEffect(() => {
    if (!successState) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      navigate('/sale/tra-cuu-phong-giuong', {
        replace: true,
        state: {
          creationMessage: successState.response.message,
          createdProfile: successState.response.data,
        },
      })
    }, 1400)

    return () => window.clearTimeout(timeoutId)
  }, [navigate, successState])

  useEffect(() => {
    let isMounted = true

    async function loadFormOptions() {
      try {
        const data = await fetchHoSoDangKyFormOptions()
        if (!isMounted) {
          return
        }

        setFormOptions({
          branches: data.branches || [],
          rentTypes: data.rentTypes || [],
          termOptions: data.termOptions || [],
        })

        setFormData((current) => ({
          ...current,
          chiNhanh: data.defaults?.chiNhanh || current.chiNhanh,
          hinhThucThue: data.rentTypes?.[0]?.value || current.hinhThucThue,
          thoiHanThue: String(data.termOptions?.[0]?.value || current.thoiHanThue),
        }))
      } catch (error) {
        if (isMounted) {
          setSubmitError(error.response?.data?.message || 'Không thể tải biểu mẫu lập hồ sơ.')
        }
      } finally {
        if (isMounted) {
          setLoadingOptions(false)
        }
      }
    }

    loadFormOptions()

    return () => {
      isMounted = false
    }
  }, [])

  const handleChange = (field) => (event) => {
    const value = event.target.value

    setFormData((current) => ({
      ...current,
      [field]: value,
    }))

    setFieldErrors((current) => ({
      ...current,
      [field]: '',
    }))
  }

  const handleFeatureChange = (feature) => (event) => {
    setSelectedFeatures((current) => {
      const nextSelected = event.target.checked
        ? [...current, feature]
        : current.filter((item) => item !== feature)

      setFormData((currentForm) => ({
        ...currentForm,
        tieuChi: nextSelected.join(', '),
      }))

      return nextSelected
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const nextErrors = validateForm(formData)
    setFieldErrors(nextErrors)
    setSubmitError('')

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSubmitting(true)

    try {
      const response = await createHoSoDangKy(formData)
      setSuccessState({ response })
    } catch (error) {
      setSubmitError(error.response?.data?.message || 'Không thể lưu hồ sơ đăng ký.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="relative space-y-8 pb-8">
      {successState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e2418]/35 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[520px] rounded-[20px] border border-[#d8ddcf] bg-white p-6 text-center shadow-[0_20px_60px_rgba(33,41,21,0.18)] sm:p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#edf4e3] text-[#4b6132]">
              <CircleCheck size={30} />
            </div>

            <h2 className="mt-5 text-[28px] font-extrabold tracking-[-0.02em] text-[#26351d]">
              Lưu hồ sơ thành công
            </h2>
            <p className="mt-3 text-[17px] leading-[1.7] text-[#5c6258]">
              Chuẩn bị sang tab tra cứu để kiểm tra lại hồ sơ và tiếp tục tư vấn phòng/giường phù hợp cho khách.
            </p>

            <div className="mt-6 inline-flex items-center rounded-[999px] bg-[#f4f7ee] px-4 py-2 text-[14px] font-semibold text-[#5a664b]">
              Hệ thống đang chuyển trang...
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-[34px] font-extrabold leading-[1.08] tracking-[-0.02em] text-[#26351d]">
          Tạo hồ sơ đăng ký mới
        </h1>
        <p className="mt-2 max-w-[720px] text-[18px] leading-snug text-[#555852]">
          Nhập thông tin khách hàng và tiêu chí lưu trú để lưu hồ sơ với trạng thái mới tiếp nhận, sau đó chuyển sang bước tra cứu phòng/giường phù hợp.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-[18px] border border-[#d9ddd2] bg-white p-5 shadow-[0_8px_24px_rgba(33,41,21,0.04)] sm:p-6 xl:p-8"
      >
        {submitError && (
          <div className="mb-6 rounded-[12px] border border-[#efc1bd] bg-[#fff0ef] px-4 py-3 text-[15px] font-semibold text-[#c1443e]">
            {submitError}
          </div>
        )}

        <div className="grid gap-8 xl:grid-cols-2">
          <div className="space-y-6">
            <SectionHeading icon={UserRound} title="1. Thông tin cá nhân" />

            <div className="space-y-5">
              <InputField label="Họ và tên" required error={fieldErrors.hoTen}>
                <input
                  type="text"
                  value={formData.hoTen}
                  onChange={handleChange('hoTen')}
                  className={getFieldClass(Boolean(fieldErrors.hoTen))}
                />
              </InputField>

              <InputField label="Số điện thoại" required error={fieldErrors.soDienThoai}>
                <input
                  type="text"
                  value={formData.soDienThoai}
                  onChange={handleChange('soDienThoai')}
                  className={getFieldClass(Boolean(fieldErrors.soDienThoai))}
                />
              </InputField>

              <InputField label="Email" required error={fieldErrors.email}>
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  className={getFieldClass(Boolean(fieldErrors.email))}
                />
              </InputField>

              <fieldset className="space-y-3">
                <legend className="text-[14px] font-semibold text-[#6a7065]">Giới tính *</legend>
                <div className="flex flex-wrap gap-6 text-[17px] text-[#4d534a]">
                  {['Nam', 'Nữ', 'Khác'].map((option) => (
                    <label key={option} className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="gioi_tinh"
                        value={option}
                        checked={formData.gioiTinh === option}
                        onChange={handleChange('gioiTinh')}
                        className="h-4 w-4 border-[#cbd2c3] text-[#4b6132] focus:ring-[#4b6132]"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                {fieldErrors.gioiTinh && (
                  <span className="block text-[14px] font-medium text-[#c1443e]">
                    {fieldErrors.gioiTinh}
                  </span>
                )}
              </fieldset>

              <InputField label="CCCD" required error={fieldErrors.cccd}>
                <input
                  type="text"
                  value={formData.cccd}
                  onChange={handleChange('cccd')}
                  placeholder="Nhập số định danh"
                  className={getFieldClass(Boolean(fieldErrors.cccd))}
                />
              </InputField>

              <InputField label="Nghề nghiệp">
                <input
                  type="text"
                  value={formData.ngheNghiep}
                  onChange={handleChange('ngheNghiep')}
                  className={getFieldClass()}
                />
              </InputField>

              <InputField label="Quốc tịch">
                <input
                  type="text"
                  value={formData.quocTich}
                  onChange={handleChange('quocTich')}
                  className={getFieldClass()}
                />
              </InputField>
            </div>
          </div>

          <div className="space-y-6">
            <SectionHeading icon={Home} title="2. Nhu cầu thuê phòng" />

            <div className="space-y-5">
              <InputField label="Hình thức thuê" required error={fieldErrors.hinhThucThue}>
                <select
                  value={formData.hinhThucThue}
                  onChange={handleChange('hinhThucThue')}
                  className={getFieldClass(Boolean(fieldErrors.hinhThucThue))}
                  disabled={loadingOptions}
                >
                  {formOptions.rentTypes.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </InputField>

              <InputField label="Số lượng người" required error={fieldErrors.soLuongNguoi}>
                <input
                  type="number"
                  min="1"
                  value={formData.soLuongNguoi}
                  onChange={handleChange('soLuongNguoi')}
                  className={getFieldClass(Boolean(fieldErrors.soLuongNguoi))}
                />
              </InputField>

              <InputField label="Thời gian dự kiến vào ở" required error={fieldErrors.thoiGianVao}>
                <input
                  type="date"
                  value={formData.thoiGianVao}
                  onChange={handleChange('thoiGianVao')}
                  className={getFieldClass(Boolean(fieldErrors.thoiGianVao))}
                />
              </InputField>

              <InputField label="Thời hạn thuê" required error={fieldErrors.thoiHanThue}>
                <select
                  value={formData.thoiHanThue}
                  onChange={handleChange('thoiHanThue')}
                  className={getFieldClass(Boolean(fieldErrors.thoiHanThue))}
                  disabled={loadingOptions}
                >
                  {formOptions.termOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </InputField>

              <InputField label="Chi nhánh" required error={fieldErrors.chiNhanh}>
                <select
                  value={formData.chiNhanh}
                  onChange={handleChange('chiNhanh')}
                  className={getFieldClass(Boolean(fieldErrors.chiNhanh))}
                  disabled={loadingOptions}
                >
                  <option value="">Chọn chi nhánh</option>
                  {formOptions.branches.map((branch) => (
                    <option key={branch.value} value={branch.value}>
                      {branch.label}
                    </option>
                  ))}
                </select>
              </InputField>
            </div>
          </div>
        </div>

        <div className="mt-10 space-y-6 border-t border-[#edf0ea] pt-8">
          <SectionHeading icon={CircleCheck} title="Tiện ích & yêu cầu đặc biệt" />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {SPECIAL_REQUESTS.map((feature) => (
              <label key={feature} className="inline-flex items-start gap-3 text-[18px] text-[#4d534a]">
                <input
                  type="checkbox"
                  checked={selectedFeatures.includes(feature)}
                  onChange={handleFeatureChange(feature)}
                  className="mt-1 h-4 w-4 rounded border-[#cbd2c3] text-[#4b6132] focus:ring-[#4b6132]"
                />
                <span>{feature}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col-reverse gap-3 border-t border-[#edf0ea] pt-8 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate('/sale/ho-so-dang-ky')}
            className="inline-flex h-[52px] items-center justify-center rounded-[8px] px-8 text-[18px] font-semibold text-[#676d63] transition hover:bg-[#f5f7f1]"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting || loadingOptions}
            className="inline-flex h-[52px] items-center justify-center gap-2 rounded-[8px] bg-[#4b6132] px-8 text-[18px] font-semibold text-white shadow-[0_6px_12px_rgba(75,97,50,0.16)] transition hover:bg-[#42572c] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <BriefcaseBusiness size={18} />
            {submitting ? 'Đang lưu hồ sơ...' : 'Lưu hồ sơ'}
          </button>
        </div>
      </form>
    </section>
  )
}
