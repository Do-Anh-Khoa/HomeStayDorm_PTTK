# Homestay Dorm Management System

Đồ án hệ thống quản lý ký túc xá tư nhân Homestay Dorm.

## Stack đề xuất

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: PostgreSQL
- ORM: Prisma
- API testing: Postman / Thunder Client
- Deploy: Vercel FE, Render BE, Neon DB

## Cấu trúc thư mục

```text
homestay-dorm-starter/
├── frontend/        # Giao diện React
├── backend/         # API Node.js + Express
├── database/        # Script SQL, mock data, query test
├── api/             # Postman collection / tài liệu API
├── docs/            # Tài liệu đồ án, phân công, ghi chú
└── .github/         # Cấu hình workflow nếu cần
```

## Chạy frontend

```bash
cd frontend
npm install
npm run dev
```

## Chạy backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

## Git lần đầu

```bash
git init
git add .
git commit -m "init project structure"
git branch -M main
git remote add origin <link-repo-github>
git push -u origin main
```
## Quy trình làm việc trên GitHub (Nhiều người làm)

### 1. Luồng làm việc chính (Git Flow)

- **Branch `main`**: Chỉ chứa code ổn định, đã test xong, sẵn sàng deploy
### 2. Quy tắc đặt tên branch

- Tính năng mới: `feature/ten-tinh-nang` (vd: `feature/login-page`, `feature/room-management`)
- Fix bug: `fix/ten-bug` (vd: `fix/login-error`, `fix/database-connection`)
- Hotfix: `hotfix/ten-bug-khan-cap` (vd: `hotfix/payment-error`)
- Cải thiện/refactor: `refactor/ten-noi-dung` (vd: `refactor/api-service`)

### 3. Quy tắc commit message

Sử dụng cấu trúc: `type: description`

Types:
- `feat`: Thêm tính năng mới
- `fix`: Fix bug
- `refactor`: Thay đổi code không làm thay đổi chức năng
- `style`: Thay đổi về format, không ảnh hưởng logic
- `docs`: Cập nhật tài liệu
- `test`: Thêm/sửa test
- `chore`: Thay đổi cấu hình, dependencies...

Ví dụ:
```bash
git commit -m "feat: thêm trang quản lý phòng"
git commit -m "fix: sửa lỗi đăng nhập khi email sai"
git commit -m "docs: cập nhật README với quy trình GitHub"
```

### 4. Quy trình làm việc với Pull Request (PR)

1. **Tạo branch mới từ `develop`**:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/ten-tinh-nang
   ```

2. **Code và commit thay đổi**:
   ```bash
   git add .
   git commit -m "feat: mô tả thay đổi"
   ```

3. **Đẩy branch lên GitHub**:
   ```bash
   git push origin feature/ten-tinh-nang
   ```

4. **Tạo Pull Request**:
   - Vào GitHub → Pull requests → New pull request
   - Base branch: `develop`, Compare branch: `feature/ten-tinh-nang`
   - Điền tiêu đề và mô tả chi tiết các thay đổi
   - Yêu cầu review từ thành viên khác (nếu cần)

5. **Review và merge**:
   - Ít nhất 1 người review và approve trước khi merge
   - Sửa comment nếu có
   - Merge vào `develop` và xóa branch

### 5. Lưu ý quan trọng

- **Không push trực tiếp lên `main`: Phải Pull Request (PR) để merge vào `main`**:
  - Tạo branch mới từ `main`
  - Code và commit thay đổi
  - Đẩy branch lên GitHub
  - Tạo Pull Request với `main` và branch mới
  - Yêu cầu review từ thành viên khác (nếu cần)
  - Ít nhất 1 người review và approve trước khi merge
  - Sửa comment nếu có
  - Merge vào `main` và xóa branch
- **Pull trước khi push**: Luôn `git pull origin main` trước khi tạo branch hoặc push để tránh conflict
- **Xử lý conflict**: Nếu có conflict, giải quyết cẩn thận, hỏi người viết code gốc nếu không hiểu
- **Test code trước khi tạo PR**: Đảm bảo code chạy, không có lỗi syntax, không break tính năng cũ
- **Cập nhật thường xuyên**: Pull `main` mỗi ngày để giữ branch của bạn cập nhật
- **Không commit file không cần thiết**: Thêm vào `.gitignore` (node_modules, .env, file log...)
- **Comment code**: Viết comment rõ ràng cho phần code phức tạp
