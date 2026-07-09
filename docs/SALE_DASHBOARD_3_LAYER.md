# Sale Dashboard - So do 3 lop

## 1. GUI Layer

### File
- `frontend/src/pages/sale/DashboardSale.jsx`
- `frontend/src/services/saleDashboard.js`
- `frontend/src/services/authSession.js`

### Phuong thuc chinh
- `DashboardSale()`
  - Render giao dien dashboard sale
  - Quan ly state `dashboard`, `loading`, `error`
- `loadDashboard()`
  - Goi API dashboard sale
  - Cap nhat state giao dien
- `formatNumber(value)`
  - Dinh dang so hien thi tren KPI
- `formatTime(value)`
  - Dinh dang gio cua lich hen
- `formatGeneratedTime(value)`
  - Dinh dang thoi diem dong bo du lieu
- `getStatusClass(statusTone)`
  - Chon class CSS cho trang thai lich hen
- `buildRingStyle(roomStatus)`
  - Tao CSS `conic-gradient` cho vong tron trang thai phong
- `SummaryCard(props)`
  - Component hien thi the KPI
- `SectionCard(props)`
  - Component khung noi dung dung chung
- `fetchSaleDashboard()`
  - Goi `GET /api/sale-dashboard`
- `getStoredUser()`
  - Lay thong tin nguoi dung dang luu trong storage

## 2. Controller Layer

### File
- `backend/src/controllers/sale-dashboard.controller.js`
- `backend/src/routes/sale-dashboard.routes.js`

### Phuong thuc chinh
- `getSaleDashboard(req, res, next)`
  - Nhan request tu GUI
  - Lay `ma_nv`, `ma_cn` tu `req.auth`
  - Goi lop database lay snapshot du lieu
  - Goi lop entity chuan hoa response
  - Tra JSON cho frontend

## 3. Entity Layer

### File
- `backend/src/entities/sale-dashboard.entity.js`

### Phuong thuc chinh
- `buildSaleDashboardEntity(snapshot)`
  - Chuan hoa response tong cho dashboard
- `buildSummaryEntity(summary)`
  - Chuan hoa nhom KPI tong hop
- `buildRoomStatusEntity(roomStatus)`
  - Chuan hoa du lieu bieu do trang thai phong
- `buildAppointmentEntity(item)`
  - Chuan hoa tung dong lich hen
- `formatAppointmentStatus(statusKey)`
  - Doi `statusKey` thanh nhan va tone hien thi

## 4. Database Layer

### File
- `backend/src/database/sale-dashboard.database.js`

### Phuong thuc chinh
- `getSaleDashboardSnapshot({ maCn, maNv })`
  - Truy van tong hop du lieu dashboard
  - Lay KPI tong quan
  - Lay danh sach lich hen hom nay
  - Lay breakdown trang thai phong
  - Lay thong tin chi nhanh
- `toNumber(value)`
  - Chuyen ket qua truy van ve dang so

## 5. Luong goi 3 lop

1. `DashboardSale.loadDashboard()`
2. `fetchSaleDashboard()`
3. `GET /api/sale-dashboard`
4. `getSaleDashboard(req, res, next)`
5. `getSaleDashboardSnapshot({ maCn, maNv })`
6. `buildSaleDashboardEntity(snapshot)`
7. JSON response tra ve GUI
8. `DashboardSale()` render KPI + bieu do + bang lich hen
