const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const files = [
  'GESTION AÑO 2026.xlsx',
  'GESTION 2026 MODULOS ABCD.xlsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  console.log(`\n============================`);
  console.log(`FILE: ${file}`);
  console.log(`============================`);
  
  const workbook = xlsx.readFile(filePath);
  
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n--- SHEET: ${sheetName} ---`);
    const worksheet = workbook.Sheets[sheetName];
    // Get up to 5 rows to see structure
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: null, blankrows: false }).slice(0, 10);
    console.log(JSON.stringify(data, null, 2));
  });
});
