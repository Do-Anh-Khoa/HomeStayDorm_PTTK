BEGIN;

-- Seed test cho luồng phiếu thu hợp đồng.
-- Dùng dữ liệu sẵn có trong script gốc: CN001, NV003, P101.
-- Mục tiêu:
-- 1) HDT900 sẽ hiện ở danh sách chờ xử lý để lập phiếu thu.
-- 2) PTHD900 sẽ hiện ở danh sách đã lập hôm nay.

VALUES
  ('KHTEST900', 'Trần Quốc Duy', '079399990001', '0979000001', 'duy.test@example.com', 'Nam', 'Sinh viên', 'Việt Nam')
  ('PTHD900', NOW(), NULL, NULL, 'Chưa thanh toán', 260000, 'NV003', 'NV003', 'HDT900')

-- Phiếu đặt cọc đã hoàn tất để ký hợp đồng.
INSERT INTO phieu_dat_coc (ma_pdc, ngay_dc, trang_thai, khach_dat, nv_sale)
VALUES
  ('PDC900', NOW() - INTERVAL '40 days', 'Hoàn tất', 'KHTEST900', 'NV001')
ON CONFLICT (ma_pdc) DO NOTHING;

-- Giữ chỗ trên phòng P101, dùng các giường còn trống trong script gốc.
INSERT INTO dat_coc_giuong (ma_pdc, ma_phong, ma_giuong, trang_thai)
VALUES
  ('PDC900', 'P101', 'G03', 'Đã chốt'),
  ('PDC900', 'P101', 'G04', 'Đã chốt')
ON CONFLICT (ma_pdc, ma_phong, ma_giuong) DO NOTHING;

-- Hợp đồng đang có hiệu lực, kỳ thanh toán 1 tháng, đủ điều kiện lập phiếu thu.
INSERT INTO hop_dong_thue (ma_hdt, tg_tao_hd, tg_vao, thoi_han_thue, ky_tt, nv_phu_trach, ma_pdc)
VALUES
  ('HDT900', NOW() - INTERVAL '39 days', NOW() - INTERVAL '40 days', 6, 1, 'NV001', 'PDC900')
ON CONFLICT (ma_hdt) DO NOTHING;

INSERT INTO khach_thue (ma_kh, ma_hdt)
VALUES
  ('KHTEST900', 'HDT900')
ON CONFLICT (ma_kh, ma_hdt) DO NOTHING;

-- Phiếu thu hợp đồng mẫu đã lập hôm nay để test danh sách "đã lập hôm nay".
INSERT INTO pt_hop_dong (ma_pthd, ngay, ngay_thanh_toan, ghi_chu, trang_thai, tong_tien, nv_ke_toan, nv_cap_nhat, ma_hdt)
VALUES
  ('PTHD900', NOW(), NULL, NULL, 'Chưa thanh toán', 260000, 'NV003', 'NV003', 'HDT900')
ON CONFLICT (ma_pthd) DO NOTHING;

COMMIT;
