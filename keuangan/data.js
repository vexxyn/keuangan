/* ====================================================================
   EDIT DAFTAR KATEGORI DI SINI KALAU MAU DIUBAH/DITAMBAH.
   Setiap kategori butuh: id (unik, tanpa spasi), label (nama tampil), color (kode warna).
   ==================================================================== */

const KATEGORI_KELUAR = [
  { id: "makan", label: "Makan & Minum", color: "#D1654B" },
  { id: "transport", label: "Transportasi", color: "#CDA349" },
  { id: "belanja", label: "Belanja", color: "#8C7BB5" },
  { id: "tagihan", label: "Tagihan", color: "#4F8EA1" },
  { id: "hiburan", label: "Hiburan", color: "#4FA187" },
  { id: "kesehatan", label: "Kesehatan", color: "#B5482E" },
  { id: "lain_keluar", label: "Lainnya", color: "#7A8291" },
];

const KATEGORI_MASUK = [
  { id: "gaji", label: "Gaji", color: "#4FA187" },
  { id: "bonus", label: "Bonus / Freelance", color: "#CDA349" },
  { id: "lain_masuk", label: "Lainnya", color: "#7A8291" },
];
