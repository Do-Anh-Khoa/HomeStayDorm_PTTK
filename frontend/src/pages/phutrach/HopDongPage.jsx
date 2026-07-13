import { useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import PageTitle from '../../components/common/PageTitle.jsx'
import {
  createContract,
  downloadContractPdf,
  fetchContractDetail,
  fetchContractDraft,
  fetchCreatedContractsToday,
  fetchPendingContracts,
  previewContract,
} from '../../services/hopDongThue.js'

const PENDING_PAGE_SIZE = 6
const CREATED_PAGE_SIZE = 6

function formatDateInput(value = new Date()) {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateDisplay(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('vi-VN').format(date)
}

function createTenant(name, cccd, overrides = {}) {
  return {
    id: overrides.id || `${Date.now()}-${Math.random()}`,
    maKh: overrides.maKh || null,
    hoTen: name || '',
    cccd: cccd || '',
    soDienThoai: '',
    email: '',
    gioiTinh: 'Nữ',
    congViec: '',
    quocTich: 'Việt Nam',
    tinhTrang: 'Đang làm việc',
    isChuHopDong: false,
    ...overrides,
  }
}

function createEmptyTenantForm() {
  return {
    hoTen: '',
    cccd: '',
    soDienThoai: '',
    gioiTinh: 'Nữ',
    quocTich: 'Việt Nam',
    congViec: '',
    email: '',
  }
}

function buildTermSections(terms = {}) {
  return [
    {
      title: 'Nội quy ký túc xá',
      items: (terms.noiQuyKtx || []).map((item, index) => `${index + 1}. ${item.content || item.noi_dung || ''}`),
    },
    {
      title: 'Quy định hoàn cọc',
      items: (terms.quyDinhHoanCoc || []).map((item, index) => `${index + 1}. ${item.content || item.noi_dung || ''}`),
    },
    {
      title: 'Điều khoản xử lý vi phạm',
      items: (terms.dieuKhoanXuLyViPham || []).map((item, index) => `${index + 1}. ${item}`),
    },
  ]
}

function createDraftFromApi(data) {
  return {
    maPhieuDatCoc: data.maPhieuDatCoc,
    nhanVienPhuTrach: data.nhanVienPhuTrach || '',
    thoiGianLapHopDong: formatDateInput(data.thoiGianLapHopDong || new Date()),
    thoiGianBatDauThue: formatDateInput(data.thoiGianBatDauThue || new Date()),
    thoiHanThue: String(data.thoiHanThue || 3),
    kyThanhToan: String(data.kyThanhToan || 1),
    beds: data.beds || [],
    tenants: (data.tenants || []).map((tenant, index) =>
      createTenant(tenant.hoTen, tenant.cccd, {
        id: tenant.maKh || `${tenant.cccd}-${index}`,
        maKh: tenant.maKh || null,
        soDienThoai: tenant.soDienThoai || '',
        email: tenant.email || '',
        gioiTinh: tenant.gioiTinh || 'Nữ',
        congViec: tenant.congViec || '',
        quocTich: tenant.quocTich || 'Việt Nam',
        tinhTrang: tenant.tinhTrang || 'Đang làm việc',
        isChuHopDong: Boolean(tenant.isChuHopDong ?? index === 0),
      }),
    ),
    termSections: buildTermSections(data.terms),
  }
}

function createPreviewFromApi(data) {
  return {
    ...data,
    termSections: buildTermSections(data.terms),
  }
}

function createDetailFromApi(data) {
  return {
    ...data,
    nhanVienPhuTrach: data.nhanVienPhuTrach?.tenNV || '',
    thoiHanThueLabel: `${data.thoiHanThue || 0} tháng`,
    kyThanhToanLabel: data.kyThanhToanLabel || '',
    termSections: buildTermSections(data.terms),
  }
}

function buildContractPayload(draft) {
  return {
    maPDC: draft.maPhieuDatCoc,
    thoiGianLapHopDong: draft.thoiGianLapHopDong,
    thoiGianBatDauThue: draft.thoiGianBatDauThue,
    thoiHanThue: Number(draft.thoiHanThue),
    kyThanhToan: Number(draft.kyThanhToan),
    selectedBeds: draft.beds.map((bed) => ({
      maPhong: bed.maPhong,
      maGiuong: bed.maGiuong,
    })),
    tenants: draft.tenants.map((tenant) => ({
      maKh: tenant.maKh,
      hoTen: tenant.hoTen,
      cccd: tenant.cccd,
      soDienThoai: tenant.soDienThoai,
      email: tenant.email,
      gioiTinh: tenant.gioiTinh,
      congViec: tenant.congViec,
      quocTich: tenant.quocTich,
      tinhTrang: tenant.tinhTrang,
      isChuHopDong: tenant.isChuHopDong,
    })),
  }
}

function isValidEmail(value) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isDraftValid(draft) {
  if (!draft) {
    return false
  }

  const thoiHanThue = Number(draft.thoiHanThue)
  const kyThanhToan = Number(draft.kyThanhToan)

  if (!draft.thoiGianLapHopDong || !draft.thoiGianBatDauThue) {
    return false
  }

  if (!Number.isInteger(thoiHanThue) || thoiHanThue <= 0) {
    return false
  }

  if (!Number.isInteger(kyThanhToan) || kyThanhToan <= 0) {
    return false
  }

  if (kyThanhToan > thoiHanThue || thoiHanThue % kyThanhToan !== 0) {
    return false
  }

  if (!Array.isArray(draft.beds) || draft.beds.length === 0) {
    return false
  }

  if (!Array.isArray(draft.tenants) || draft.tenants.length !== draft.beds.length) {
    return false
  }

  const seenCCCD = new Set()

  for (const tenant of draft.tenants) {
    const hoTen = String(tenant.hoTen || '').trim()
    const cccd = String(tenant.cccd || '').trim()
    const soDienThoai = String(tenant.soDienThoai || '').trim()
    const email = String(tenant.email || '').trim()

    if (!hoTen) {
      return false
    }

    if (!/^\d{9,20}$/.test(cccd)) {
      return false
    }

    if (!/^\d{9,15}$/.test(soDienThoai)) {
      return false
    }

    if (!isValidEmail(email)) {
      return false
    }

    if (seenCCCD.has(cccd)) {
      return false
    }

    seenCCCD.add(cccd)
  }

  return true
}

function StatusBadge({ label }) {
  return (
    <span style={S.statusBadge}>
      <span style={S.statusDot} />
      {label}
    </span>
  )
}

function SectionTitle({ children }) {
  return <h2 style={S.sectionTitle}>{children}</h2>
}

function TableCard({ children }) {
  return <div style={S.card}>{children}</div>
}

function SectionCard({ title, children, rightAction }) {
  return (
    <div style={S.formCard}>
      <div style={S.sectionHeader}>
        <h3 style={S.formSectionTitle}>{title}</h3>
        {rightAction}
      </div>
      {children}
    </div>
  )
}

function FieldGroup({ label, children }) {
  return (
    <label style={S.fieldGroup}>
      <span style={S.fieldLabel}>{label}</span>
      {children}
    </label>
  )
}

function TableFooter({ page, totalItems, pageSize, itemLabel, onPrev, onNext, totalLabel }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <div style={S.tableFooter}>
      <div style={S.footerText}>
        Hiển thị {start}-{end} trong số {totalLabel || totalItems} {itemLabel}
      </div>

      <div style={S.pagination}>
        <button type="button" style={S.pageButton} onClick={onPrev} disabled={page === 1}>
          <ChevronLeft size={14} />
        </button>

        {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            style={{
              ...S.pageButton,
              ...(pageNumber === page ? S.pageButtonActive : {}),
            }}
            onClick={() => {
              if (pageNumber < page) {
                onPrev(page - pageNumber)
                return
              }
              if (pageNumber > page) {
                onNext(pageNumber - page)
              }
            }}
          >
            {pageNumber}
          </button>
        ))}

        <button type="button" style={S.pageButton} onClick={onNext} disabled={page === totalPages}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

function AddTenantModal({
  isOpen,
  form,
  errors,
  onChange,
  onClose,
  onSubmit,
}) {
  if (!isOpen) {
    return null
  }

  return (
    <div style={S.modalOverlay}>
      <div style={S.modalBox}>
        <div style={S.modalHeader}>
          <h3 style={S.modalTitle}>Thêm thành viên mới</h3>
        </div>

        <div style={S.modalBody}>
          <div style={S.modalGrid}>
            <FieldGroup label={<span>Họ và tên <span style={S.requiredMark}>*</span></span>}>
              <input
                value={form.hoTen}
                onChange={(event) => onChange('hoTen', event.target.value)}
                style={{
                  ...S.modalInput,
                  ...(errors.hoTen ? S.modalInputError : {}),
                }}
              />
            </FieldGroup>

            <FieldGroup label={<span>CCCD <span style={S.requiredMark}>*</span></span>}>
              <input
                value={form.cccd}
                onChange={(event) => onChange('cccd', event.target.value)}
                style={{
                  ...S.modalInput,
                  ...(errors.cccd ? S.modalInputError : {}),
                }}
              />
            </FieldGroup>

            <FieldGroup label={<span>Số điện thoại <span style={S.requiredMark}>*</span></span>}>
              <input
                value={form.soDienThoai}
                onChange={(event) => onChange('soDienThoai', event.target.value)}
                style={{
                  ...S.modalInput,
                  ...(errors.soDienThoai ? S.modalInputError : {}),
                }}
              />
            </FieldGroup>

            <FieldGroup label="Giới tính">
              <div style={S.genderGroup}>
                {['Nam', 'Nữ'].map((value) => (
                  <label key={value} style={S.genderOption}>
                    <input
                      type="radio"
                      name="gioi_tinh_thanh_vien"
                      value={value}
                      checked={form.gioiTinh === value}
                      onChange={(event) => onChange('gioiTinh', event.target.value)}
                    />
                    <span>{value}</span>
                  </label>
                ))}
              </div>
            </FieldGroup>

            <FieldGroup label="Quốc tịch">
              <input
                value={form.quocTich}
                onChange={(event) => onChange('quocTich', event.target.value)}
                style={S.modalInput}
              />
            </FieldGroup>

            <FieldGroup label="Công việc">
              <input
                value={form.congViec}
                onChange={(event) => onChange('congViec', event.target.value)}
                style={S.modalInput}
              />
            </FieldGroup>

            <div style={S.modalGridFull}>
              <FieldGroup label="Email">
                <input
                  value={form.email}
                  onChange={(event) => onChange('email', event.target.value)}
                  style={{
                    ...S.modalInput,
                    ...(errors.email ? S.modalInputError : {}),
                  }}
                />
              </FieldGroup>
            </div>
          </div>
        </div>

        <div style={S.modalFooter}>
          <button type="button" style={S.modalCancelButton} onClick={onClose}>
            Hủy
          </button>
          <button type="button" style={S.modalSubmitButton} onClick={onSubmit}>
            Thêm
          </button>
        </div>
      </div>
    </div>
  )
}

function PrintConfirmModal({ isOpen, onClose, onConfirm, isLoading }) {
  if (!isOpen) {
    return null
  }

  return (
    <div style={S.modalOverlay}>
      <div style={S.confirmBox}>
        <div style={S.confirmTitle}>Xác nhận in hợp đồng</div>
        <div style={S.confirmText}>Bạn có muốn in hợp đồng thuê phòng này?</div>
        <div style={S.confirmActions}>
          <button type="button" style={S.modalCancelButton} onClick={onClose} disabled={isLoading}>
            Hủy
          </button>
          <button type="button" style={S.modalSubmitButton} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Đang xử lý...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ContractFormView({
  draft,
  isFormValid,
  onBack,
  onChangeGeneral,
  onAddTenant,
  onRemoveBed,
  onRemoveTenant,
  onChangeTenant,
  onSubmit,
  isAddTenantOpen,
  newTenantForm,
  newTenantErrors,
  onNewTenantChange,
  onCloseAddTenant,
  onSubmitNewTenant,
}) {
  const totalPrice = draft.beds.reduce((sum, bed) => sum + Number(bed.giaThue || 0), 0)

  return (
    <section style={S.page}>
      <button type="button" style={S.backButton} onClick={onBack}>
        <ChevronLeft size={18} />
        Lập Hợp đồng thuê
      </button>

      <SectionCard title="A. Thông tin chung">
        <div style={S.generalGrid}>
          <FieldGroup label="Mã phiếu đặt cọc">
            <input value={draft.maPhieuDatCoc} disabled style={S.inputDisabled} />
          </FieldGroup>

          <FieldGroup label="Nhân viên phụ trách">
            <input value={draft.nhanVienPhuTrach} disabled style={S.inputDisabled} />
          </FieldGroup>

          <FieldGroup label="Thời gian lập hợp đồng">
            <input
              type="date"
              value={draft.thoiGianLapHopDong}
              onChange={(event) => onChangeGeneral('thoiGianLapHopDong', event.target.value)}
              style={S.input}
            />
          </FieldGroup>

          <FieldGroup label="Thời gian bắt đầu thuê">
            <input
              type="date"
              value={draft.thoiGianBatDauThue}
              onChange={(event) => onChangeGeneral('thoiGianBatDauThue', event.target.value)}
              style={S.input}
            />
          </FieldGroup>

          <FieldGroup label="Thời hạn thuê">
            <select
              value={draft.thoiHanThue}
              onChange={(event) => onChangeGeneral('thoiHanThue', event.target.value)}
              style={S.input}
            >
              <option value="3">3 tháng</option>
              <option value="6">6 tháng</option>
              <option value="12">12 tháng</option>
            </select>
          </FieldGroup>

          <FieldGroup label="Kỳ thanh toán">
            <select
              value={draft.kyThanhToan}
              onChange={(event) => onChangeGeneral('kyThanhToan', event.target.value)}
              style={S.input}
            >
              <option value="1">Hàng tháng</option>
              <option value="3">3 tháng / lần</option>
              <option value="6">6 tháng / lần</option>
            </select>
          </FieldGroup>
        </div>
      </SectionCard>

      <SectionCard title="B. Thông tin thuê">
        <div style={S.tableWrap}>
          <table style={S.formTable}>
            <thead>
              <tr>
                <th style={S.th}>Mã phòng</th>
                <th style={S.th}>Mã giường</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Giá thuê / giường</th>
                <th style={{ ...S.th, textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {draft.beds.map((bed) => (
                <tr key={`${bed.maPhong}-${bed.maGiuong}`} style={S.tr}>
                  <td style={S.td}>{bed.maPhong}</td>
                  <td style={S.td}>{bed.maGiuong}</td>
                  <td style={{ ...S.td, textAlign: 'right' }}>
                    {Number(bed.giaThue || 0).toLocaleString('vi-VN')} VND
                  </td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    <button
                      type="button"
                      style={S.deleteIconButton}
                      onClick={() => onRemoveBed(bed)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan="4" style={S.totalRow}>
                  <span>Tổng tiền:</span>
                  <strong>{totalPrice.toLocaleString('vi-VN')} VND</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="C. Danh sách khách thuê"
        rightAction={(
          <button type="button" style={S.addMemberButton} onClick={onAddTenant}>
            <Plus size={14} />
            Thêm thành viên mới
          </button>
        )}
      >
        <div style={S.tenantList}>
          {draft.tenants.map((tenant, index) => (
            <div key={tenant.id} style={S.tenantCard}>
              <div style={S.tenantHeader}>
                <span style={S.tenantTitle}>A. Thông tin khách hàng {index + 1}</span>
                <div style={S.tenantActions}>
                  {index === 0 && <span style={S.contractOwnerBadge}>Chủ hợp đồng</span>}
                  {index > 0 && (
                    <button
                      type="button"
                      style={S.removeTenantButton}
                      onClick={() => onRemoveTenant(tenant.id)}
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>

              <div style={S.tenantGrid}>
                <FieldGroup label="Họ và tên">
                  <input
                    value={tenant.hoTen}
                    onChange={(event) => onChangeTenant(tenant.id, 'hoTen', event.target.value)}
                    style={index === 0 ? S.inputDisabled : S.input}
                    readOnly={index === 0}
                  />
                </FieldGroup>

                <FieldGroup label="CCCD">
                  <input
                    value={tenant.cccd}
                    onChange={(event) => onChangeTenant(tenant.id, 'cccd', event.target.value)}
                    style={index === 0 ? S.inputDisabled : S.input}
                    readOnly={index === 0}
                  />
                </FieldGroup>

                <FieldGroup label="Số điện thoại">
                  <input
                    value={tenant.soDienThoai}
                    onChange={(event) => onChangeTenant(tenant.id, 'soDienThoai', event.target.value)}
                    style={index === 0 ? S.inputDisabled : S.input}
                    readOnly={index === 0}
                  />
                </FieldGroup>

                <FieldGroup label="Email">
                  <input
                    value={tenant.email}
                    onChange={(event) => onChangeTenant(tenant.id, 'email', event.target.value)}
                    style={index === 0 ? S.inputDisabled : S.input}
                    readOnly={index === 0}
                  />
                </FieldGroup>

                <FieldGroup label="Giới tính">
                  {index === 0 ? (
                    <input value={tenant.gioiTinh} disabled style={S.inputDisabled} />
                  ) : (
                    <select
                      value={tenant.gioiTinh}
                      onChange={(event) => onChangeTenant(tenant.id, 'gioiTinh', event.target.value)}
                      style={S.input}
                    >
                      <option>Nam</option>
                      <option>Nữ</option>
                      <option>Khác</option>
                    </select>
                  )}
                </FieldGroup>

                <FieldGroup label="Công việc">
                  <input
                    value={tenant.congViec}
                    onChange={(event) => onChangeTenant(tenant.id, 'congViec', event.target.value)}
                    style={index === 0 ? S.inputDisabled : S.input}
                    readOnly={index === 0}
                  />
                </FieldGroup>

                <FieldGroup label="Quốc tịch">
                  <input
                    value={tenant.quocTich}
                    onChange={(event) => onChangeTenant(tenant.id, 'quocTich', event.target.value)}
                    style={index === 0 ? S.inputDisabled : S.input}
                    readOnly={index === 0}
                  />
                </FieldGroup>

                <FieldGroup label="Tình trạng">
                  {index === 0 ? (
                    <input value={tenant.tinhTrang} disabled style={S.inputDisabled} />
                  ) : (
                    <select
                      value={tenant.tinhTrang}
                      onChange={(event) => onChangeTenant(tenant.id, 'tinhTrang', event.target.value)}
                      style={S.input}
                    >
                      <option>Đang làm việc</option>
                      <option>Đi học</option>
                      <option>Tự do</option>
                    </select>
                  )}
                </FieldGroup>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Điều khoản hợp đồng">
        <div style={S.termGrid}>
          {(draft.termSections || []).map((group) => (
            <div key={group.title} style={S.termBox}>
              <div style={S.termTitle}>{group.title}</div>
              <ul style={S.termList}>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SectionCard>

      <div style={S.formFooterBar}>
        <button
          type="button"
          style={{
            ...S.submitContractButton,
            ...(isFormValid ? S.submitContractButtonActive : {}),
          }}
          onClick={onSubmit}
          disabled={!isFormValid}
        >
          Tạo hợp đồng
        </button>
      </div>

      <AddTenantModal
        isOpen={isAddTenantOpen}
        form={newTenantForm}
        errors={newTenantErrors}
        onChange={onNewTenantChange}
        onClose={onCloseAddTenant}
        onSubmit={onSubmitNewTenant}
      />
    </section>
  )
}

function PreviewInfoItem({ label, value, strong }) {
  return (
    <div style={S.previewInfoItem}>
      <div style={S.previewInfoLabel}>{label}</div>
      <div style={strong ? S.previewInfoValueStrong : S.previewInfoValue}>{value || '--'}</div>
    </div>
  )
}

function ContractPreviewView({
  preview,
  onBack,
  onPrint,
  isSubmitting,
  primaryButtonLabel = 'In hợp đồng',
  secondaryButtonLabel = 'Quay lại chỉnh sửa',
  isConfirmOpen,
  onCloseConfirm,
  onConfirmPrint,
}) {
  const totalPrice = preview.summary?.tongTien || 0

  return (
    <section style={S.page}>
      <div style={S.previewShell}>
        <div style={S.previewPaper}>
          <div style={S.previewNational}>
            <div style={S.previewNationalTitle}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div style={S.previewNationalSubtitle}>Độc lập - Tự do - Hạnh phúc</div>
          </div>

          <h1 style={S.previewMainTitle}>HỢP ĐỒNG THUÊ</h1>

          <div style={S.previewSection}>
            <div style={S.previewSectionTitle}>I. THÔNG TIN CHUNG</div>
            <div style={S.previewInfoGrid}>
              <PreviewInfoItem label="Mã phiếu đặt cọc" value={preview.maPhieuDatCoc} strong />
              <PreviewInfoItem label="Nhân viên phụ trách" value={preview.nhanVienPhuTrach} strong />
              <PreviewInfoItem label="Thời gian lập" value={formatDateDisplay(preview.thoiGianLapHopDong)} strong />
              <PreviewInfoItem label="Thời gian bắt đầu" value={formatDateDisplay(preview.thoiGianBatDauThue)} strong />
              <PreviewInfoItem label="Thời hạn thuê" value={preview.thoiHanThueLabel} strong />
              <PreviewInfoItem label="Kỳ thanh toán" value={preview.kyThanhToanLabel} strong />
            </div>
          </div>

          <div style={S.previewSection}>
            <div style={S.previewSectionTitle}>II. CHI TIẾT THUÊ</div>
            <div style={S.previewTableWrap}>
              <table style={S.previewTable}>
                <thead>
                  <tr>
                    <th style={S.previewTh}>Thông tin thuê</th>
                    <th style={{ ...S.previewTh, textAlign: 'right' }}>Đơn giá</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.beds.map((bed) => (
                    <tr key={`${bed.maPhong}-${bed.maGiuong}`}>
                      <td style={S.previewTd}>{bed.maPhong} - {bed.maGiuong}</td>
                      <td style={{ ...S.previewTd, textAlign: 'right' }}>
                        {Number(bed.giaThue || 0).toLocaleString('vi-VN')} VND
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan="2" style={S.previewTotalRow}>
                      <div style={S.previewTotalContent}>
                        <span>Tổng cộng (Đã bao gồm VAT):</span>
                        <strong>{Number(totalPrice).toLocaleString('vi-VN')} VND</strong>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={S.previewSection}>
            <div style={S.previewSectionTitle}>III. DANH SÁCH KHÁCH THUÊ</div>
            <div style={S.previewTenantGrid}>
              {preview.tenants.map((tenant) => (
                <div key={`${tenant.cccd}-${tenant.hoTen}`} style={S.previewTenantCard}>
                  <div style={S.previewTenantHeader}>
                    <span style={S.previewTenantName}>{tenant.hoTen}</span>
                    {tenant.isChuHopDong && <span style={S.contractOwnerBadge}>Chủ hợp đồng</span>}
                  </div>
                  <div style={S.previewTenantCccd}>CCCD: {tenant.cccd}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={S.previewSection}>
            <div style={S.previewSectionTitle}>IV. ĐIỀU KHOẢN & QUY ĐỊNH</div>
            <div style={S.previewTermWrap}>
              {(preview.termSections || []).map((group) => (
                <div key={group.title} style={S.previewTermBlock}>
                  <div style={S.previewTermTitle}>{group.title}:</div>
                  <div style={S.previewTermText}>{group.items.join(' ')}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={S.previewActions}>
            <button type="button" style={S.previewSecondaryButton} onClick={onBack}>
              {secondaryButtonLabel}
            </button>
            <button type="button" style={S.previewPrimaryButton} onClick={onPrint} disabled={isSubmitting}>
              {primaryButtonLabel}
            </button>
          </div>
        </div>
      </div>

      <PrintConfirmModal
        isOpen={isConfirmOpen}
        onClose={onCloseConfirm}
        onConfirm={onConfirmPrint}
        isLoading={isSubmitting}
      />
    </section>
  )
}

function ContractListView({
  searchKeyword,
  onSearchChange,
  pendingContracts,
  createdContracts,
  isPendingLoading,
  isCreatedLoading,
  pendingTotalItems,
  createdTotalItems,
  pendingPage,
  createdPage,
  onPendingPrev,
  onPendingNext,
  onCreatedPrev,
  onCreatedNext,
  onCreateContract,
  onViewContract,
}) {
  return (
    <section style={S.page}>
      <div style={S.headerWrap}>
        <PageTitle
          title="Lập Hợp đồng thuê"
          description="Quản lý và lập hợp đồng cho các phiếu đặt cọc đã thanh toán thành công."
        />
      </div>

      <TableCard>
        <div style={S.toolbar}>
          <div style={S.searchWrap}>
            <Search size={16} style={S.searchIcon} />
            <input
              type="text"
              value={searchKeyword}
              onChange={onSearchChange}
              placeholder="Nhập mã phiếu đặt cọc hoặc CCCD"
              style={S.searchInput}
            />
          </div>
        </div>

        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Phiếu đặt cọc</th>
                <th style={S.th}>Tên khách hàng</th>
                <th style={S.th}>CCCD</th>
                <th style={{ ...S.th, textAlign: 'center' }}>Số lượng giường</th>
                <th style={{ ...S.th, textAlign: 'center' }}>Trạng thái</th>
                <th style={{ ...S.th, textAlign: 'center' }}>Hành động</th>
              </tr>
            </thead>

            <tbody>
              {isPendingLoading ? (
                <tr>
                  <td colSpan="6" style={S.emptyCell}>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : pendingContracts.length === 0 ? (
                <tr>
                  <td colSpan="6" style={S.emptyCell}>
                    Không tìm thấy phiếu đặt cọc phù hợp.
                  </td>
                </tr>
              ) : (
                pendingContracts.map((item) => (
                  <tr key={item.maPhieuDatCoc} style={S.tr}>
                    <td style={S.tdStrong}>{item.maPhieuDatCoc}</td>
                    <td style={S.td}>{item.tenKhachHang}</td>
                    <td style={S.td}>{item.cccd}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>{item.soLuongGiuong}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <StatusBadge label={item.trangThai} />
                    </td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <button
                        type="button"
                        style={S.primaryAction}
                        onClick={() => onCreateContract(item)}
                      >
                        Lập hợp đồng
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TableFooter
          page={pendingPage}
          totalItems={pendingTotalItems}
          pageSize={PENDING_PAGE_SIZE}
          itemLabel="phiếu"
          onPrev={onPendingPrev}
          onNext={onPendingNext}
        />
      </TableCard>

      <div style={S.sectionSpacing}>
        <SectionTitle>Danh sách hợp đồng đã lập hôm nay</SectionTitle>
      </div>

      <TableCard>
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Mã phiếu đặt cọc</th>
                <th style={S.th}>Mã hợp đồng</th>
                <th style={S.th}>Thời gian tạo</th>
                <th style={S.th}>Thời hạn thuê</th>
                <th style={S.th}>Khách đại diện</th>
                <th style={{ ...S.th, textAlign: 'center' }}>Số khách thuê</th>
                <th style={{ ...S.th, textAlign: 'center' }}>Hành động</th>
              </tr>
            </thead>

            <tbody>
              {isCreatedLoading ? (
                <tr>
                  <td colSpan="7" style={S.emptyCell}>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : createdContracts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={S.emptyCell}>
                    Chưa có hợp đồng nào được lập hôm nay.
                  </td>
                </tr>
              ) : (
                createdContracts.map((item) => (
                  <tr key={item.maHopDong} style={S.tr}>
                    <td style={S.tdStrong}>{item.maPhieuDatCoc}</td>
                    <td style={S.td}>
                      <span style={S.contractCode}>{item.maHopDong}</span>
                    </td>
                    <td style={S.td}>{item.thoiGianTao}</td>
                    <td style={S.td}>{item.thoiHanThue}</td>
                    <td style={S.td}>{item.khachDaiDien}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>{item.soKhachThue}</td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <button
                        type="button"
                        style={S.iconAction}
                        onClick={() => onViewContract(item)}
                        aria-label={`Xem chi tiết ${item.maHopDong}`}
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TableFooter
          page={createdPage}
          totalItems={createdTotalItems}
          pageSize={CREATED_PAGE_SIZE}
          itemLabel="hợp đồng"
          onPrev={onCreatedPrev}
          onNext={onCreatedNext}
        />
      </TableCard>
    </section>
  )
}

export default function HopDongPage() {
  const [view, setView] = useState('list')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [pendingPage, setPendingPage] = useState(1)
  const [createdPage, setCreatedPage] = useState(1)
  const [pendingData, setPendingData] = useState([])
  const [createdData, setCreatedData] = useState([])
  const [isPendingLoading, setIsPendingLoading] = useState(true)
  const [isCreatedLoading, setIsCreatedLoading] = useState(true)
  const [draft, setDraft] = useState(null)
  const [previewData, setPreviewData] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false)
  const [newTenantForm, setNewTenantForm] = useState(createEmptyTenantForm())
  const [newTenantErrors, setNewTenantErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPrintConfirmOpen, setIsPrintConfirmOpen] = useState(false)

  const filteredPendingContracts = useMemo(() => pendingData, [pendingData])

  const paginatedPendingContracts = useMemo(() => {
    const start = (pendingPage - 1) * PENDING_PAGE_SIZE
    return filteredPendingContracts.slice(start, start + PENDING_PAGE_SIZE)
  }, [filteredPendingContracts, pendingPage])

  const paginatedCreatedContracts = useMemo(() => {
    const start = (createdPage - 1) * CREATED_PAGE_SIZE
    return createdData.slice(start, start + CREATED_PAGE_SIZE)
  }, [createdData, createdPage])

  const pendingTotalPages = Math.max(1, Math.ceil(filteredPendingContracts.length / PENDING_PAGE_SIZE))
  const createdTotalPages = Math.max(1, Math.ceil(createdData.length / CREATED_PAGE_SIZE))
  const isCurrentDraftValid = useMemo(() => isDraftValid(draft), [draft])

  useEffect(() => {
    let isMounted = true

    const loadPending = async () => {
      setIsPendingLoading(true)
      try {
        const data = await fetchPendingContracts({
          tuKhoa: searchKeyword.trim(),
        })

        if (isMounted) {
          setPendingData(data)
        }
      } catch (error) {
        if (isMounted) {
          setPendingData([])
          window.alert(error.response?.data?.message || 'Không tải được danh sách phiếu đặt cọc.')
        }
      } finally {
        if (isMounted) {
          setIsPendingLoading(false)
        }
      }
    }

    loadPending()

    return () => {
      isMounted = false
    }
  }, [searchKeyword])

  useEffect(() => {
    let isMounted = true

    const loadCreated = async () => {
      setIsCreatedLoading(true)
      try {
        const data = await fetchCreatedContractsToday()
        if (isMounted) {
          setCreatedData(
            data.map((item) => ({
              ...item,
              thoiGianTao: formatDateDisplay(item.thoiGianTao),
            })),
          )
        }
      } catch (error) {
        if (isMounted) {
          setCreatedData([])
          window.alert(error.response?.data?.message || 'Không tải được danh sách hợp đồng đã lập hôm nay.')
        }
      } finally {
        if (isMounted) {
          setIsCreatedLoading(false)
        }
      }
    }

    loadCreated()

    return () => {
      isMounted = false
    }
  }, [])

  const handleChangeSearch = (event) => {
    setSearchKeyword(event.target.value)
    setPendingPage(1)
  }

  const handleStartCreateContract = async (item) => {
    try {
      const data = await fetchContractDraft(item.maPhieuDatCoc)
      setDraft(createDraftFromApi(data))
      setIsAddTenantOpen(false)
      setNewTenantForm(createEmptyTenantForm())
      setNewTenantErrors({})
      setView('create')
    } catch (error) {
      window.alert(error.response?.data?.message || 'Không tải được thông tin lập hợp đồng.')
    }
  }

  const handleChangeGeneral = (field, value) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleAddTenant = () => {
    setNewTenantForm(createEmptyTenantForm())
    setNewTenantErrors({})
    setIsAddTenantOpen(true)
  }

  const handleRemoveBed = (bedToRemove) => {
    setDraft((current) => ({
      ...current,
      beds: current.beds.filter(
        (bed) =>
          !(bed.maPhong === bedToRemove.maPhong && bed.maGiuong === bedToRemove.maGiuong),
      ),
    }))
  }

  const handleRemoveTenant = (tenantId) => {
    setDraft((current) => ({
      ...current,
      tenants: current.tenants.filter((tenant) => tenant.id !== tenantId),
    }))
  }

  const handleChangeTenant = (tenantId, field, value) => {
    setDraft((current) => ({
      ...current,
      tenants: current.tenants.map((tenant) => (
        tenant.id === tenantId
          ? { ...tenant, [field]: value }
          : tenant
      )),
    }))
  }

  const handleChangeNewTenant = (field, value) => {
    setNewTenantForm((current) => ({
      ...current,
      [field]: value,
    }))
    setNewTenantErrors((current) => ({
      ...current,
      [field]: '',
    }))
  }

  const handleCloseAddTenant = () => {
    setIsAddTenantOpen(false)
    setNewTenantErrors({})
  }

  const handleSubmitNewTenant = () => {
    const nextErrors = {}

    if (!newTenantForm.hoTen.trim()) {
      nextErrors.hoTen = 'Vui lòng nhập họ và tên.'
    }

    if (!/^\d{9,20}$/.test(newTenantForm.cccd.trim())) {
      nextErrors.cccd = 'CCCD không hợp lệ.'
    }

    if (!/^\d{9,15}$/.test(newTenantForm.soDienThoai.trim())) {
      nextErrors.soDienThoai = 'Số điện thoại không hợp lệ.'
    }

    if (
      newTenantForm.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newTenantForm.email.trim())
    ) {
      nextErrors.email = 'Email không đúng định dạng.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setNewTenantErrors(nextErrors)
      return
    }

    setDraft((current) => ({
      ...current,
      tenants: [
        ...current.tenants,
        createTenant(newTenantForm.hoTen, newTenantForm.cccd, {
          soDienThoai: newTenantForm.soDienThoai,
          email: newTenantForm.email,
          gioiTinh: newTenantForm.gioiTinh,
          quocTich: newTenantForm.quocTich || 'Việt Nam',
          congViec: newTenantForm.congViec,
        }),
      ],
    }))

    setIsAddTenantOpen(false)
    setNewTenantForm(createEmptyTenantForm())
    setNewTenantErrors({})
  }

  const handleSubmitContract = async () => {
    if (!draft) {
      return
    }

    setIsSubmitting(true)
    try {
      const preview = await previewContract(buildContractPayload(draft))
      setPreviewData(createPreviewFromApi(preview))
      setView('preview')
    } catch (error) {
      window.alert(error.response?.data?.message || 'Không thể xem trước hợp đồng.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmPrint = async () => {
    if (!draft) {
      return
    }

    setIsSubmitting(true)
    try {
      const created = await createContract(buildContractPayload(draft))
      await downloadContractPdf(created.maHopDong)

      const [pendingList, createdList] = await Promise.all([
        fetchPendingContracts({ tuKhoa: searchKeyword.trim() }),
        fetchCreatedContractsToday(),
      ])

      setPendingData(pendingList)
      setCreatedData(
        createdList.map((item) => ({
          ...item,
          thoiGianTao: formatDateDisplay(item.thoiGianTao),
        })),
      )
      setDraft(null)
      setPreviewData(null)
      setView('list')
      setCreatedPage(1)
      setIsPrintConfirmOpen(false)
      window.alert(`Đã tạo và in hợp đồng ${created?.maHopDong || ''} thành công.`)
    } catch (error) {
      window.alert(error.response?.data?.message || 'Không thể in hợp đồng.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewContract = async (item) => {
    try {
      const detail = await fetchContractDetail(item.maHopDong)
      setDetailData(createDetailFromApi(detail))
      setView('detail')
    } catch (error) {
      window.alert(error.response?.data?.message || 'Không tải được chi tiết hợp đồng.')
    }
  }

  const handlePrintExistingContract = async () => {
    if (!detailData?.maHopDong) {
      return
    }

    setIsSubmitting(true)
    try {
      await downloadContractPdf(detailData.maHopDong)
    } catch (error) {
      window.alert(error.response?.data?.message || 'Không thể in lại hợp đồng.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (view === 'create' && draft) {
    return (
      <ContractFormView
        draft={draft}
        isFormValid={isCurrentDraftValid}
        onBack={() => {
          setDraft(null)
          setView('list')
        }}
        onChangeGeneral={handleChangeGeneral}
        onAddTenant={handleAddTenant}
        onRemoveBed={handleRemoveBed}
        onRemoveTenant={handleRemoveTenant}
        onChangeTenant={handleChangeTenant}
        onSubmit={isSubmitting ? () => {} : handleSubmitContract}
        isAddTenantOpen={isAddTenantOpen}
        newTenantForm={newTenantForm}
        newTenantErrors={newTenantErrors}
        onNewTenantChange={handleChangeNewTenant}
        onCloseAddTenant={handleCloseAddTenant}
        onSubmitNewTenant={handleSubmitNewTenant}
      />
    )
  }

  if (view === 'preview' && previewData) {
    return (
      <ContractPreviewView
        preview={previewData}
        onBack={() => {
          setIsPrintConfirmOpen(false)
          setView('create')
        }}
        onPrint={() => setIsPrintConfirmOpen(true)}
        isSubmitting={isSubmitting}
        isConfirmOpen={isPrintConfirmOpen}
        onCloseConfirm={() => setIsPrintConfirmOpen(false)}
        onConfirmPrint={handleConfirmPrint}
      />
    )
  }

  if (view === 'detail' && detailData) {
    return (
      <ContractPreviewView
        preview={detailData}
        onBack={() => {
          setDetailData(null)
          setView('list')
        }}
        onPrint={handlePrintExistingContract}
        isSubmitting={isSubmitting}
        secondaryButtonLabel="Quay lại"
        primaryButtonLabel="In lại hợp đồng"
        isConfirmOpen={false}
        onCloseConfirm={() => {}}
        onConfirmPrint={() => {}}
      />
    )
  }

  return (
    <ContractListView
      searchKeyword={searchKeyword}
      onSearchChange={handleChangeSearch}
      pendingContracts={paginatedPendingContracts}
      createdContracts={paginatedCreatedContracts}
      isPendingLoading={isPendingLoading}
      isCreatedLoading={isCreatedLoading}
      pendingTotalItems={filteredPendingContracts.length}
      createdTotalItems={createdData.length}
      pendingPage={pendingPage}
      createdPage={createdPage}
      onPendingPrev={(step = 1) => setPendingPage((current) => Math.max(1, current - step))}
      onPendingNext={(step = 1) => setPendingPage((current) => Math.min(pendingTotalPages, current + step))}
      onCreatedPrev={(step = 1) => setCreatedPage((current) => Math.max(1, current - step))}
      onCreatedNext={(step = 1) => setCreatedPage((current) => Math.min(createdTotalPages, current + step))}
      onCreateContract={handleStartCreateContract}
      onViewContract={handleViewContract}
    />
  )
}

const S = {
  page: {
    minWidth: 0,
    paddingBottom: '20px',
  },
  headerWrap: {
    marginBottom: '22px',
  },
  sectionSpacing: {
    marginTop: '36px',
    marginBottom: '14px',
  },
  sectionTitle: {
    margin: 0,
    color: '#1f2619',
    fontSize: '24px',
    fontWeight: 800,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  card: {
    position: 'relative',
    border: '1px solid #dde3d8',
    borderRadius: '12px',
    backgroundColor: '#fff',
    boxShadow: '0 10px 24px rgba(30, 35, 24, 0.05)',
    overflow: 'visible',
  },
  formCard: {
    border: '1px solid #dde3d8',
    borderRadius: '12px',
    backgroundColor: '#fff',
    boxShadow: '0 10px 24px rgba(30, 35, 24, 0.05)',
    padding: '14px 14px 12px',
    marginBottom: '18px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
    padding: '0 4px 12px',
    borderBottom: '1px solid #edf0ea',
    marginBottom: '14px',
  },
  formSectionTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 800,
    color: '#47543d',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '18px 18px 12px',
    flexWrap: 'wrap',
  },
  searchWrap: {
    position: 'relative',
    flex: '1 1 320px',
    maxWidth: '520px',
    minWidth: '240px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9aa090',
  },
  searchInput: {
    width: '100%',
    height: '42px',
    boxSizing: 'border-box',
    border: '1px solid #dde3d8',
    borderRadius: '8px',
    padding: '0 14px 0 38px',
    fontSize: '13.5px',
    color: '#1a1f14',
    outline: 'none',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#1f2619',
    fontSize: '18px',
    fontWeight: 800,
    padding: 0,
    marginBottom: '18px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  generalGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '14px 12px',
  },
  tenantGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: 0,
  },
  fieldLabel: {
    fontSize: '11.5px',
    fontWeight: 700,
    color: '#6e756a',
  },
  input: {
    width: '100%',
    height: '38px',
    boxSizing: 'border-box',
    padding: '0 10px',
    border: '1px solid #dde3d8',
    borderRadius: '4px',
    outline: 'none',
    color: '#1a1f14',
    fontSize: '13px',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
  },
  inputDisabled: {
    width: '100%',
    height: '38px',
    boxSizing: 'border-box',
    padding: '0 10px',
    border: '1px solid #dde3d8',
    borderRadius: '4px',
    outline: 'none',
    color: '#6b7367',
    fontSize: '13px',
    fontFamily: 'inherit',
    backgroundColor: '#f5f6f3',
  },
  tableWrap: {
    width: '100%',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    minWidth: '920px',
    borderCollapse: 'collapse',
  },
  formTable: {
    width: '100%',
    minWidth: '620px',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px 18px',
    borderBottom: '1px solid #edf0ea',
    color: '#6f766a',
    fontSize: '11.5px',
    fontWeight: 800,
    textAlign: 'left',
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #f1f3ee',
  },
  td: {
    padding: '14px 18px',
    color: '#4d5449',
    fontSize: '13.5px',
    whiteSpace: 'nowrap',
  },
  tdStrong: {
    padding: '14px 18px',
    color: '#46503f',
    fontSize: '13.5px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  totalRow: {
    padding: '14px 18px',
    backgroundColor: '#e8f0df',
    color: '#405337',
    fontSize: '13.5px',
    fontWeight: 700,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyCell: {
    padding: '28px 18px',
    color: '#8d9486',
    textAlign: 'center',
    fontSize: '13.5px',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '999px',
    backgroundColor: '#eef5dc',
    color: '#6d8b29',
    fontSize: '11px',
    fontWeight: 700,
    lineHeight: 1,
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#7ea232',
    flexShrink: 0,
  },
  primaryAction: {
    height: '32px',
    padding: '0 14px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#51683a',
    color: '#fff',
    fontSize: '12.5px',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
  },
  submitContractButton: {
    minWidth: '124px',
    height: '36px',
    padding: '0 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#aab59e',
    color: '#fff',
    fontSize: '12.5px',
    fontWeight: 700,
    cursor: 'not-allowed',
    fontFamily: 'inherit',
    opacity: 0.9,
  },
  submitContractButtonActive: {
    backgroundColor: '#51683a',
    cursor: 'pointer',
    opacity: 1,
  },
  addMemberButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    height: '30px',
    padding: '0 12px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#51683a',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  iconAction: {
    width: '32px',
    height: '32px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #dde3d8',
    borderRadius: '999px',
    backgroundColor: '#fff',
    color: '#5d6658',
    cursor: 'pointer',
  },
  deleteIconButton: {
    width: '28px',
    height: '28px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#d14b47',
    cursor: 'pointer',
  },
  contractCode: {
    display: 'inline-block',
    maxWidth: '74px',
    whiteSpace: 'normal',
    lineHeight: 1.35,
    fontWeight: 700,
    color: '#41513a',
  },
  tableFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '14px 18px 16px',
    flexWrap: 'wrap',
  },
  footerText: {
    color: '#6c7367',
    fontSize: '12.5px',
  },
  pagination: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  pageButton: {
    minWidth: '28px',
    height: '28px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 8px',
    border: '1px solid #dde3d8',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#6c7367',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 700,
    fontFamily: 'inherit',
  },
  pageButtonActive: {
    backgroundColor: '#3b4f27',
    borderColor: '#3b4f27',
    color: '#fff',
  },
  tenantList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  tenantCard: {
    border: '1px solid #e5e9e1',
    borderRadius: '8px',
    padding: '10px',
    backgroundColor: '#fff',
  },
  tenantHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  tenantTitle: {
    color: '#5c6653',
    fontSize: '12px',
    fontWeight: 700,
  },
  tenantActions: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  contractOwnerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    height: '22px',
    padding: '0 10px',
    borderRadius: '999px',
    backgroundColor: '#eef5dc',
    color: '#6d8b29',
    fontSize: '11px',
    fontWeight: 700,
  },
  removeTenantButton: {
    border: '1px solid #ecd0cf',
    backgroundColor: '#fff',
    color: '#c5504d',
    borderRadius: '999px',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  termGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '12px',
  },
  termBox: {
    minHeight: '156px',
    border: '1px solid #e5e9e1',
    borderRadius: '8px',
    padding: '10px 12px',
    backgroundColor: '#fff',
  },
  termTitle: {
    fontSize: '12px',
    fontWeight: 800,
    color: '#5b6552',
    marginBottom: '8px',
  },
  termList: {
    margin: 0,
    paddingLeft: '16px',
    color: '#5f675b',
    fontSize: '11.5px',
    lineHeight: 1.6,
  },
  formFooterBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '4px',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(18, 24, 16, 0.38)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    zIndex: 1000,
  },
  modalBox: {
    width: 'min(760px, 100%)',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 24px 70px rgba(0, 0, 0, 0.18)',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '22px 24px 18px',
    borderBottom: '1px solid #edf0ea',
  },
  modalTitle: {
    margin: 0,
    color: '#1f2619',
    fontSize: '24px',
    fontWeight: 800,
    lineHeight: 1.2,
  },
  modalBody: {
    padding: '18px 24px 28px',
  },
  modalGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '20px 26px',
  },
  modalGridFull: {
    gridColumn: '1 / -1',
  },
  modalInput: {
    width: '100%',
    height: '42px',
    boxSizing: 'border-box',
    padding: '0 14px',
    border: '1px solid #d9ddd2',
    borderRadius: '8px',
    outline: 'none',
    color: '#1a1f14',
    fontSize: '15px',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
  },
  modalInputError: {
    borderColor: '#d14b47',
    boxShadow: '0 0 0 3px rgba(209, 75, 71, 0.08)',
  },
  genderGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '28px',
    minHeight: '42px',
  },
  genderOption: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: '#374034',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  requiredMark: {
    color: '#ef4444',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '18px 24px',
    borderTop: '1px solid #edf0ea',
    backgroundColor: '#fff',
  },
  modalCancelButton: {
    minWidth: '72px',
    height: '42px',
    padding: '0 18px',
    border: '1px solid #dde3d8',
    borderRadius: '8px',
    backgroundColor: '#fff',
    color: '#384237',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  modalSubmitButton: {
    minWidth: '78px',
    height: '42px',
    padding: '0 18px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#355a3b',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  confirmBox: {
    width: 'min(420px, 100%)',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 24px 70px rgba(0, 0, 0, 0.18)',
    padding: '24px',
  },
  confirmTitle: {
    color: '#1f2619',
    fontSize: '20px',
    fontWeight: 800,
    marginBottom: '10px',
  },
  confirmText: {
    color: '#5a6257',
    fontSize: '14px',
    lineHeight: 1.6,
    marginBottom: '20px',
  },
  confirmActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  previewShell: {
    padding: '24px',
    backgroundColor: '#eef1ea',
    borderRadius: '12px',
  },
  previewPaper: {
    maxWidth: '860px',
    margin: '0 auto',
    backgroundColor: '#fff',
    border: '1px solid #dde3d8',
    boxShadow: '0 16px 32px rgba(30, 35, 24, 0.06)',
    padding: '42px 48px',
  },
  previewNational: {
    textAlign: 'center',
    marginBottom: '26px',
  },
  previewNationalTitle: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#283120',
    marginBottom: '6px',
  },
  previewNationalSubtitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#4e5649',
  },
  previewMainTitle: {
    margin: '0 0 28px',
    textAlign: 'center',
    fontSize: '34px',
    fontWeight: 800,
    color: '#2f3b25',
  },
  previewSection: {
    marginBottom: '28px',
  },
  previewSectionTitle: {
    marginBottom: '14px',
    fontSize: '16px',
    fontWeight: 800,
    color: '#4f5c44',
  },
  previewInfoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '14px 30px',
  },
  previewInfoItem: {
    display: 'grid',
    gridTemplateColumns: '130px 1fr',
    gap: '10px',
    alignItems: 'start',
  },
  previewInfoLabel: {
    color: '#7b8375',
    fontSize: '13px',
  },
  previewInfoValue: {
    color: '#44503c',
    fontSize: '14px',
  },
  previewInfoValueStrong: {
    color: '#2d3628',
    fontSize: '14px',
    fontWeight: 700,
  },
  previewTableWrap: {
    border: '1px solid #e3e8de',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  previewTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  previewTh: {
    padding: '12px 14px',
    backgroundColor: '#f8faf6',
    color: '#566051',
    fontSize: '13px',
    fontWeight: 700,
    textAlign: 'left',
    borderBottom: '1px solid #e5e9e1',
  },
  previewTd: {
    padding: '12px 14px',
    color: '#46503f',
    fontSize: '13.5px',
    borderBottom: '1px solid #edf0ea',
  },
  previewTotalRow: {
    padding: 0,
    backgroundColor: '#e8f0df',
  },
  previewTotalContent: {
    padding: '12px 14px',
    color: '#405337',
    fontSize: '13.5px',
    fontWeight: 700,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTenantGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px',
  },
  previewTenantCard: {
    border: '1px solid #e5e9e1',
    borderRadius: '8px',
    padding: '14px',
    backgroundColor: '#fff',
  },
  previewTenantHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '8px',
  },
  previewTenantName: {
    color: '#2d3628',
    fontSize: '14px',
    fontWeight: 700,
  },
  previewTenantCccd: {
    color: '#71796b',
    fontSize: '12.5px',
  },
  previewTermWrap: {
    borderTop: '1px solid #edf0ea',
    paddingTop: '16px',
  },
  previewTermBlock: {
    marginBottom: '16px',
  },
  previewTermTitle: {
    color: '#516048',
    fontSize: '13px',
    fontWeight: 800,
    marginBottom: '6px',
  },
  previewTermText: {
    color: '#5f675b',
    fontSize: '12.5px',
    lineHeight: 1.7,
  },
  previewActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #edf0ea',
  },
  previewSecondaryButton: {
    minWidth: '148px',
    height: '40px',
    padding: '0 18px',
    border: '1px solid #dde3d8',
    borderRadius: '6px',
    backgroundColor: '#fff',
    color: '#42503d',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  previewPrimaryButton: {
    minWidth: '118px',
    height: '40px',
    padding: '0 18px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#51683a',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
}
