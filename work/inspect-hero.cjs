const sharp = require('sharp');
const path = require('path');

(async () => {
  const file = path.join(__dirname, '../public/images/hero-fountain-rabbits.png');
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const seen = new Uint8Array(width * height);
  const components = [];
  const stack = [];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const start = y * width + x;
    if (seen[start] || data[start * channels + 3] < 36) continue;
    seen[start] = 1; stack.push(start);
    let area = 0, x0 = x, y0 = y, x1 = x, y1 = y;
    while (stack.length) {
      const p = stack.pop(); const px = p % width, py = (p / width) | 0;
      area++; x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = px + dx, ny = py + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const q = ny * width + nx;
        if (!seen[q] && data[q * channels + 3] >= 36) { seen[q] = 1; stack.push(q); }
      }
    }
    if (area > 30) components.push({ area, box: [x0,y0,x1,y1] });
  }
  components.sort((a,b) => b.area - a.area);
  console.log(JSON.stringify({ width, height, components:components.slice(0,40) }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
