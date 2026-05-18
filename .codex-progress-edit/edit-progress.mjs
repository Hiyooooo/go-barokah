import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "C:/Users/Hp/Downloads/progres.xlsx";
const outputDir = "D:/Coding/Tugas Akhir/go-barokah/outputs";
const outputPath = `${outputDir}/progres-backend-edited.xlsx`;

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);
const sheet = workbook.worksheets.getItem("Progres Project");

const backendRows = [
  ["4. BACK-END - Total Bobot: 30%", null, null, null, null, null],
  [
    "Setup Project",
    "Express.js, Prisma, MySQL, struktur folder, Swagger/OpenAPI",
    0.02,
    0.02,
    "SELESAI",
    "Fondasi API sudah berjalan",
  ],
  [
    "Auth & Role Guard",
    "Register, login, OTP email, JWT, middleware role user/admin/owner",
    0.04,
    0.04,
    "SELESAI",
    "Login memakai verifikasi email",
  ],
  [
    "Address",
    "CRUD alamat user dan default address",
    0.02,
    0.02,
    "SELESAI",
    "Alamat tersimpan di database",
  ],
  [
    "Product",
    "CRUD produk, category, type, upload gambar, stock, discount",
    0.05,
    0.05,
    "SELESAI",
    "Produk sudah siap untuk katalog",
  ],
  [
    "Users",
    "Update username dan nomor HP",
    0.015,
    0.012,
    "PROGRESS",
    "Belum ada manajemen user dari admin",
  ],
  [
    "Carts",
    "Tambah item, update qty, hapus item, clear cart, hitung total",
    0.03,
    0.03,
    "SELESAI",
    "Cart sudah tersimpan di database",
  ],
  [
    "Orders",
    "Checkout, order history, status pesanan",
    0.04,
    0,
    "BELUM SELESAI",
    "Belum ada model/API order",
  ],
  [
    "Shipments",
    "CRUD zone, harga ongkir per zona, kalkulasi ongkir",
    0.025,
    0,
    "BELUM SELESAI",
    "Belum ada fitur shipment",
  ],
  [
    "Review",
    "Review produk dan rating produk",
    0.01,
    0,
    "BELUM SELESAI",
    "Belum ada fitur review",
  ],
  [
    "Product Analysis",
    "Analisis stok, produk terlaris, performa produk",
    0.02,
    0,
    "BELUM SELESAI",
    "Menunggu data order",
  ],
  [
    "Financial Analysis",
    "Omzet, profit, laporan transaksi",
    0.03,
    0,
    "BELUM SELESAI",
    "Menunggu order/payment",
  ],
];

const existingNonBackendScore = 0.45;
const backendScore = backendRows.slice(1).reduce((sum, row) => sum + Number(row[3]), 0);
const totalScore = existingNonBackendScore + backendScore;

const totalRow = [
  "TOTAL PROGRES FULL-STACK (AKTUAL)",
  null,
  1,
  totalScore,
  `${(totalScore * 100).toFixed(1)}% DONE`,
  null,
];

sheet.getRange("A21:F45").clear({ applyTo: "all" });
sheet.getRange("A21:F32").values = backendRows;
sheet.getRange("A33:F33").values = [totalRow];

const darkGreen = "#2F5144";
const headerGreen = "#29483D";
const rowA = "#F2F6F4";
const rowB = "#EAF1EE";
const statusFill = "#E7F4EE";
const doneGreen = "#00A651";
const progressBlue = "#2563EB";
const orange = "#E65A00";

sheet.getRange("A1:F1").format = {
  fill: "#FFFFFF",
  font: { bold: true, italic: true, color: "#174A5A", size: 16 },
};
sheet.getRange("A4:F4").format = {
  fill: headerGreen,
  font: { bold: true, color: "#FFFFFF" },
};
sheet.getRange("A21:F21").format = {
  fill: darkGreen,
  font: { bold: true, color: "#FFFFFF", size: 12 },
};

for (let row = 22; row <= 32; row += 1) {
  sheet.getRange(`A${row}:F${row}`).format = {
    fill: row % 2 === 0 ? rowA : rowB,
    wrapText: true,
  };
  sheet.getRange(`E${row}`).format = {
    fill: statusFill,
    font: {
      bold: true,
      color:
        row === 26
          ? progressBlue
          : backendRows[row - 21][4] === "SELESAI"
            ? doneGreen
            : orange,
    },
  };
}

sheet.getRange("A33:F33").format = {
  fill: "#FFFFFF",
  font: { bold: true },
};
sheet.getRange("E33").format = {
  fill: statusFill,
  font: { bold: true, color: doneGreen },
};

sheet.getRange("C6:D33").format.numberFormat = "0.0%";
sheet.getRange("C21:D33").format.numberFormat = "0.0%";
sheet.getRange("A21:F33").format.borders = {
  top: { style: "continuous", color: "#B8C3BF" },
  bottom: { style: "continuous", color: "#B8C3BF" },
  left: { style: "continuous", color: "#B8C3BF" },
  right: { style: "continuous", color: "#B8C3BF" },
  insideHorizontal: { style: "continuous", color: "#B8C3BF" },
  insideVertical: { style: "continuous", color: "#B8C3BF" },
};

sheet.getRange("A:A").format.columnWidthPx = 270;
sheet.getRange("B:B").format.columnWidthPx = 340;
sheet.getRange("C:D").format.columnWidthPx = 112;
sheet.getRange("E:E").format.columnWidthPx = 142;
sheet.getRange("F:F").format.columnWidthPx = 390;
sheet.getRange("A21:F33").format.autofitRows();

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "formula error scan",
});
console.log(errors.ndjson);

const preview = await workbook.render({
  sheetName: "Progres Project",
  range: "A1:F33",
  scale: 1,
  format: "png",
});
await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(
  `${outputDir}/progres-backend-edited-preview.png`,
  new Uint8Array(await preview.arrayBuffer()),
);

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);

console.log(JSON.stringify({ outputPath, totalScore }));
