CREATE TABLE "phien_dang_nhap" (
    "ma_phien" UUID NOT NULL,
    "jti" UUID NOT NULL,
    "ma_nv" VARCHAR(20) NOT NULL,
    "tao_luc" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "het_han" TIMESTAMP(6) NOT NULL,
    "thu_hoi_luc" TIMESTAMP(6),

    CONSTRAINT "phien_dang_nhap_pkey" PRIMARY KEY ("ma_phien")
);

CREATE UNIQUE INDEX "phien_dang_nhap_jti_key"
ON "phien_dang_nhap"("jti");

CREATE INDEX "idx_phien_dang_nhap_ma_nv"
ON "phien_dang_nhap"("ma_nv");

CREATE INDEX "idx_phien_dang_nhap_het_han"
ON "phien_dang_nhap"("het_han");

ALTER TABLE "phien_dang_nhap"
ADD CONSTRAINT "phien_dang_nhap_ma_nv_fkey"
FOREIGN KEY ("ma_nv") REFERENCES "nhanvien"("ma_nv")
ON DELETE CASCADE ON UPDATE NO ACTION;
