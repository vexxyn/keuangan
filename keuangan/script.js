/* ====================================================================
   FILE INI MENGATUR LOGIKA APLIKASI. Tidak perlu diubah kecuali
   kamu ingin mengubah cara kerja/perhitungan aplikasi.
   ==================================================================== */

const STORAGE_KEY = "pemantau-keuangan-data";

let transaksi = [];
let bulanAktif = new Date();
let tipeAktif = "keluar";
let kategoriAktif = KATEGORI_KELUAR[0].id;

/* ---------- util ---------- */
function formatRupiah(n) {
  const abs = Math.abs(n);
  const formatted = new Intl.NumberFormat("id-ID").format(abs);
  return (n < 0 ? "-Rp " : "Rp ") + formatted;
}
function bulanLabel(date) {
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}
function keyBulan(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
function daftarKategori(tipe) {
  return tipe === "keluar" ? KATEGORI_KELUAR : KATEGORI_MASUK;
}
function cariKategori(id, tipe) {
  return daftarKategori(tipe).find((k) => k.id === id);
}

/* ---------- storage ---------- */
function muatData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    transaksi = raw ? JSON.parse(raw) : [];
  } catch (e) {
    transaksi = [];
  }
}
function simpanData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transaksi));
  } catch (e) {
    document.getElementById("error-text").textContent = "Gagal menyimpan data di browser ini.";
  }
}

/* ---------- render kategori pill ---------- */
function renderKategoriPills() {
  const grid = document.getElementById("kat-grid");
  grid.innerHTML = "";
  daftarKategori(tipeAktif).forEach((k) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "kat-pill" + (kategoriAktif === k.id ? " active" : "");
    btn.textContent = k.label;
    btn.style.borderColor = kategoriAktif === k.id ? k.color : "#2A313C";
    btn.style.color = kategoriAktif === k.id ? k.color : "#9099A6";
    btn.addEventListener("click", () => {
      kategoriAktif = k.id;
      renderKategoriPills();
    });
    grid.appendChild(btn);
  });
}

/* ---------- toggle tipe ---------- */
function setTipe(tipe) {
  tipeAktif = tipe;
  kategoriAktif = daftarKategori(tipe)[0].id;
  document.getElementById("btn-keluar").className = "toggle-btn" + (tipe === "keluar" ? " active-out" : "");
  document.getElementById("btn-masuk").className = "toggle-btn" + (tipe === "masuk" ? " active-in" : "");
  renderKategoriPills();
}

/* ---------- render dashboard ---------- */
function renderDashboard() {
  document.getElementById("month-label").textContent = bulanLabel(bulanAktif);

  const k = keyBulan(bulanAktif);
  const bulanIni = transaksi
    .filter((t) => t.tanggal.slice(0, 7) === k)
    .sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));

  const totalMasuk = bulanIni.filter((t) => t.tipe === "masuk").reduce((s, t) => s + t.jumlah, 0);
  const totalKeluar = bulanIni.filter((t) => t.tipe === "keluar").reduce((s, t) => s + t.jumlah, 0);
  const selisih = totalMasuk - totalKeluar;
  const saldoTotal = transaksi.reduce((s, t) => s + (t.tipe === "masuk" ? t.jumlah : -t.jumlah), 0);

  const saldoEl = document.getElementById("saldo-total");
  saldoEl.textContent = formatRupiah(saldoTotal);
  saldoEl.className = "saldo-number" + (saldoTotal < 0 ? " negatif" : "");

  document.getElementById("total-masuk").textContent = formatRupiah(totalMasuk);
  document.getElementById("total-keluar").textContent = formatRupiah(totalKeluar);

  const selisihEl = document.getElementById("selisih-bulan");
  selisihEl.textContent = formatRupiah(selisih);
  selisihEl.className = selisih < 0 ? "negatif" : "positif";

  // riwayat
  const listEl = document.getElementById("riwayat-list");
  const emptyEl = document.getElementById("empty-state");
  document.getElementById("riwayat-count").textContent = `(${bulanIni.length})`;
  listEl.innerHTML = "";
  emptyEl.style.display = bulanIni.length === 0 ? "block" : "none";

  bulanIni.forEach((t) => {
    const kat = cariKategori(t.kategori, t.tipe);
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <span class="row-dot" style="background:${kat ? kat.color : "#7A8291"}"></span>
      <div style="flex:1;min-width:0;">
        <div class="row-kategori">${kat ? kat.label : t.kategori}</div>
        <div class="row-meta">${new Date(t.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}${t.catatan ? " · " + escapeHtml(t.catatan) : ""}</div>
      </div>
      <div class="row-jumlah ${t.tipe}">${t.tipe === "masuk" ? "+" : "-"}${formatRupiah(t.jumlah)}</div>
      <button class="delete-btn" data-id="${t.id}" aria-label="Hapus transaksi">✕</button>
    `;
    listEl.appendChild(row);
  });

  listEl.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      transaksi = transaksi.filter((t) => t.id !== btn.dataset.id);
      simpanData();
      renderDashboard();
    });
  });

  renderChart(bulanIni);
}

/* ---------- grafik donat (SVG murni) ---------- */
function renderChart(bulanIni) {
  const map = {};
  bulanIni.filter((t) => t.tipe === "keluar").forEach((t) => {
    map[t.kategori] = (map[t.kategori] || 0) + t.jumlah;
  });
  const data = Object.entries(map)
    .map(([id, value]) => {
      const kat = cariKategori(id, "keluar");
      return { name: kat ? kat.label : id, value, color: kat ? kat.color : "#7A8291" };
    })
    .sort((a, b) => b.value - a.value);

  const chartCard = document.getElementById("chart-card");
  if (data.length === 0) {
    chartCard.style.display = "none";
    return;
  }
  chartCard.style.display = "block";

  const total = data.reduce((s, d) => s + d.value, 0);
  const svg = document.getElementById("donut-chart");
  const r = 50, cx = 60, cy = 60, circumference = 2 * Math.PI * r;
  let offset = 0;
  let paths = "";
  data.forEach((d) => {
    const frac = d.value / total;
    const dash = frac * circumference;
    paths += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${d.color}" stroke-width="16"
      stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-offset}"
      transform="rotate(-90 ${cx} ${cy})" />`;
    offset += dash;
  });
  svg.innerHTML = paths;

  const legend = document.getElementById("legend");
  legend.innerHTML = "";
  data.forEach((d) => {
    const row = document.createElement("div");
    row.className = "legend-row";
    row.innerHTML = `
      <span class="legend-dot" style="background:${d.color}"></span>
      <span class="legend-label">${d.name}</span>
      <span class="legend-value">${formatRupiah(d.value)}</span>
    `;
    legend.appendChild(row);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- events ---------- */
document.getElementById("btn-keluar").addEventListener("click", () => setTipe("keluar"));
document.getElementById("btn-masuk").addEventListener("click", () => setTipe("masuk"));

document.getElementById("btn-prev").addEventListener("click", () => {
  bulanAktif.setMonth(bulanAktif.getMonth() - 1);
  renderDashboard();
});
document.getElementById("btn-next").addEventListener("click", () => {
  bulanAktif.setMonth(bulanAktif.getMonth() + 1);
  renderDashboard();
});

document.getElementById("form-transaksi").addEventListener("submit", (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("error-text");
  errorEl.textContent = "";

  const jumlahInput = document.getElementById("input-jumlah");
  const tanggalInput = document.getElementById("input-tanggal");
  const catatanInput = document.getElementById("input-catatan");

  const nilai = parseFloat(jumlahInput.value);
  if (!nilai || nilai <= 0) {
    errorEl.textContent = "Masukkan jumlah yang valid.";
    return;
  }
  const tanggal = tanggalInput.value || new Date().toISOString().slice(0, 10);

  transaksi.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    tipe: tipeAktif,
    jumlah: nilai,
    kategori: kategoriAktif,
    catatan: catatanInput.value.trim(),
    tanggal,
  });

  simpanData();
  jumlahInput.value = "";
  catatanInput.value = "";
  renderDashboard();
});

/* ---------- init ---------- */
document.getElementById("input-tanggal").value = new Date().toISOString().slice(0, 10);
muatData();
setTipe("keluar");
renderDashboard();
