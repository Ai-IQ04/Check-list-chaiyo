const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('app.js', 'utf8');
const studioJs = fs.readFileSync('pdf-studio.js', 'utf8');

const idRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
let match;
const usedIds = new Set();
while ((match = idRegex.exec(js)) !== null) {
  usedIds.add(match[1]);
}

const studioIds = new Set();
while ((match = idRegex.exec(studioJs)) !== null) {
  studioIds.add(match[1]);
}

console.log('Total DOM elements used in app.js:', usedIds.size);
console.log('Total DOM elements used in pdf-studio.js:', studioIds.size);

let missing = [];
usedIds.forEach(id => {
  if (!id.includes('${') && !html.includes('id="' + id + '"') && !html.includes("id='" + id + "'")) {
    missing.push('app.js -> ' + id);
  }
});

studioIds.forEach(id => {
  if (!id.includes('${') && !html.includes('id="' + id + '"') && !html.includes("id='" + id + "'")) {
    missing.push('pdf-studio.js -> ' + id);
  }
});

console.log('Missing IDs in index.html:', missing);
if (missing.length === 0) {
  console.log('100% PERFECT MATCH! ALL DOM IDs ARE PRESENT IN INDEX.HTML!');
}

