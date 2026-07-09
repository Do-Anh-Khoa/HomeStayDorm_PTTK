function formatAppointmentStatus(statusLabel) {
  const normalized = (statusLabel || '').toLowerCase()

  if (normalized.includes('chốt cọc') || normalized.includes('hoàn tất')) {
    return {
      key: 'success',
      label: statusLabel,
      tone: 'success',
    }
  }

  if (normalized.includes('mới') || normalized.includes('chờ')) {
    return {
      key: 'warning',
      label: statusLabel || 'Đang xử lý',
      tone: 'warning',
    }
  }

  return {
    key: 'scheduled',
    label: statusLabel || 'Đã hẹn',
    tone: 'neutral',
  }
}

function buildAppointmentEntity(item) {
  const status = formatAppointmentStatus(item.profileStatus)

  return {
    id: item.id,
    time: item.time,
    customerName: item.customerName,
    phone: item.phone,
    status,
  }
}

function buildRoomStatusEntity(roomStatus) {
  return {
    total: roomStatus.total,
    items: [
      {
        key: 'occupied',
        label: 'Đang sử dụng',
        value: roomStatus.occupied,
        color: '#20331a',
      },
      {
        key: 'available',
        label: 'Trống',
        value: roomStatus.available,
        color: '#bfceb0',
      },
      {
        key: 'reserved',
        label: 'Đã đặt cọc',
        value: roomStatus.reserved,
        color: '#d8dece',
      },
    ],
  }
}

function buildSummaryEntity(summary) {
  return {
    availableBeds: summary.availableBeds,
    reservedBeds: summary.reservedBeds,
    occupiedBeds: summary.occupiedBeds,
    appointmentCount: summary.appointmentCount,
    newProfiles: summary.newProfiles,
    pendingDeposits: summary.pendingDeposits,
    totalBeds: summary.totalBeds,
  }
}

export function buildSaleDashboardEntity(snapshot) {
  return {
    branch: snapshot.branch
      ? {
          code: snapshot.branch.ma_cn,
          name: snapshot.branch.ten_cn,
        }
      : null,
    summary: buildSummaryEntity(snapshot.summary),
    roomStatus: buildRoomStatusEntity(snapshot.roomStatus),
    appointments: snapshot.appointments.map(buildAppointmentEntity),
    generatedAt: new Date().toISOString(),
  }
}
