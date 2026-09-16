const fs = require('fs');
const text = fs.readFileSync('C:\\Users\\C-LAB\\.gemini\\antigravity-ide\\brain\\36714c94-bbfd-4374-b215-ee8cdda1d43f\\srs_text.txt', 'utf-8');

// replace xml tags with newline or space
let cleaned = text.replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '');

const idx = cleaned.indexOf("Login Screen");
if (idx !== -1) {
  console.log("Found 'Login Screen' at:", idx);
  console.log(cleaned.substring(idx - 200, idx + 2500));
} else {
  console.log("Not found with exact string, searching case-insensitive");
  const match = cleaned.match(/login screen/i);
  if (match) {
    const i = match.index;
    console.log(cleaned.substring(i - 200, i + 2500));
  }
}
