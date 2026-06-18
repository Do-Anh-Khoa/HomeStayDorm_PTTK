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
npx prisma generate
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
