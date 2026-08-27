const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('app.js', 'utf8');

const idRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
let match;
const usedIds = new Set();
while ((match = idRegex.exec(js)) !== null) {
  usedIds.add(match[1]);
}

console.log('Total DOM elements used in app.js:', usedIds.size);
let missing = [];
usedIds.forEach(id => {
  if (!html.includes('id="' + id + '"') && !html.includes("id='" + id + "'")) {
    missing.push(id);
  }
});

console.log('Missing IDs in index.html:', missing);
if (missing.length === 0) {
  console.log('100% PERFECT MATCH! ALL DOM IDs ARE PRESENT IN INDEX.HTML!');
}
