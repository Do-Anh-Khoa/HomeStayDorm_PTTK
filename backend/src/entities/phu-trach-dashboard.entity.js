function buildRoomStatusEntity(roomStatus) {
  return {
    total: roomStatus.total,
    items: [
      {
        key: 'reserved',
        label: 'Đã đặt cọc',
        value: roomStatus.reserved,
        color: '#20331a',
      },
      {
        key: 'occupied',
        label: 'Đang sử dụng',
        value: roomStatus.occupied,
        color: '#4c6a3f',
      },
      {
        key: 'checking_out',
        label: 'Đang trả phòng',
        value: roomStatus.checkingOut,
        color: '#b7791f',
      },
      {
        key: 'available',
        label: 'Trống',
        value: roomStatus.available,
        color: '#d8dece',
      },
    ],
  }
}

function buildSummaryEntity(summary) {
  return {
    pendingContracts: summary.pendingContracts,
    availableBeds: summary.availableBeds,
    contractsSigned: summary.contractsSigned,
    closedCustomers: summary.closedCustomers,
    totalContracts: summary.totalContracts,
    contractsThisMonth: summary.contractsThisMonth,
    contractsThisYear: summary.contractsThisYear,
  }
}

function buildContractsChartEntity(contractsByMonth) {
  const maxTotal = contractsByMonth.reduce((max, item) => Math.max(max, item.total), 0)

  return {
    year: new Date().getFullYear(),
    maxTotal,
    items: contractsByMonth,
  }
}

export function buildPhuTrachDashboardEntity(snapshot) {
  return {
    branch: snapshot.branch
      ? {
          code: snapshot.branch.ma_cn,
          name: snapshot.branch.ten_cn,
        }
      : null,
    summary: buildSummaryEntity(snapshot.summary),
    roomStatus: buildRoomStatusEntity(snapshot.roomStatus),
    contractsChart: buildContractsChartEntity(snapshot.contractsByMonth),
    generatedAt: new Date().toISOString(),
  }
}