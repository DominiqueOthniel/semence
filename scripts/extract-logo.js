const fs = require('fs');
const html = fs.readFileSync('docs/semence-presentation.html', 'utf8');
const m = html.match(/class="marque-signe"[^>]*src="data:image\/png;base64,([^"]+)"/);
if (!m) {
  console.error('logo not found');
  process.exit(1);
}
const buf = Buffer.from(m[1], 'base64');
fs.mkdirSync('assets/brand', { recursive: true });
fs.writeFileSync('assets/brand/marque-semence-or.png', buf);
console.log('saved', buf.length, 'bytes to assets/brand/marque-semence-or.png');
