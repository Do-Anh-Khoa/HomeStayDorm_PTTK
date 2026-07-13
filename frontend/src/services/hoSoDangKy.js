import api from "./api.js";

export async function fetchHoSoDangKyFormOptions() {
  const { data } = await api.get("/ho-so-dang-ky/form-options");
  return data;
}

export async function createHoSoDangKy(formData) {
  const { data } = await api.post("/ho-so-dang-ky", formData);
  return data;
}

// ĐÂY LÀ HÀM LÚC NÃY BỊ THIẾU NÈ:
export async function fetchHoSoDangKyList(params) {
  const { data } = await api.get("/ho-so-dang-ky", { params });
  return data;
}

export async function fetchHoSoDangKyDetail(maDk) {
  const { data } = await api.get(`/ho-so-dang-ky/${maDk}`);
  return data;
}

export const updateHoSoDangKy = async (maDk, formData) => {
  const response = await api.put(`/ho-so-dang-ky/${maDk}`, formData);
  return response.data;
}

export const cancelHoSoDangKy = async (maDk) => {
  const response = await api.patch(`/ho-so-dang-ky/${maDk}/cancel`);
  return response.data;
}