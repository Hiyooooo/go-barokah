import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const input = await FileBlob.load(
  "D:/Coding/Tugas Akhir/go-barokah/outputs/progres-backend-edited.xlsx",
);
const workbook = await SpreadsheetFile.importXlsx(input);

const table = await workbook.inspect({
  kind: "table",
  range: "Progres Project!A21:F33",
  include: "values,formulas",
  tableMaxRows: 20,
  tableMaxCols: 6,
  maxChars: 6000,
});

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
});

console.log(table.ndjson);
console.log(errors.ndjson);
