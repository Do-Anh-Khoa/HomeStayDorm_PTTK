INSERT INTO users (username, password, full_name, role) VALUES
('sale01', 'demo123', 'Nhân viên Sale Demo', 'sale'),
('quanly01', 'demo123', 'Nhân viên Quản lý Demo', 'quanly'),
('ketoan01', 'demo123', 'Nhân viên Kế toán Demo', 'ketoan'),
('phutrach01', 'demo123', 'Nhân viên Phụ trách Demo', 'phutrach'),
('admin01', 'demo123', 'Quản trị Demo', 'admin')
ON CONFLICT (username) DO NOTHING;

INSERT INTO branches (name, address) VALUES
('Chi nhánh 1', 'TP. Hồ Chí Minh')
ON CONFLICT DO NOTHING;

INSERT INTO rooms (code, room_type, status, branch_id) VALUES
('P101', 'Phòng 4 người', 'TRONG', 1),
('P102', 'Phòng 6 người', 'TRONG', 1)
ON CONFLICT (code) DO NOTHING;

INSERT INTO beds (code, status, room_id) VALUES
('G101-01', 'TRONG', 1),
('G101-02', 'TRONG', 1),
('G102-01', 'TRONG', 2);
