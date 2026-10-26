// Separate the two already transparent source rabbits by their actual alpha components.
// No illustration pixels are redrawn and no rectangular mask reaches an opaque pixel.
const sharp = require('sharp');
const path = require('path');

(async () => {
  const source = path.join(__dirname, '../public/images/hero-fountain-rabbits.png');
  const target = path.join(__dirname, '../public/images');
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const count = width * height;
  const visited = new Uint8Array(count);
  const components = [];
  const stack = [];
  for (let start = 0; start < count; start++) {
    if (visited[start] || data[start * channels + 3] < 36) continue;
    const pixels = [];
    visited[start] = 1;
    stack.push(start);
    while (stack.length) {
      const current = stack.pop();
      pixels.push(current);
      const x = current % width, y = (current / width) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const next = ny * width + nx;
        if (!visited[next] && data[next * channels + 3] >= 36) {
          visited[next] = 1;
          stack.push(next);
        }
      }
    }
    if (pixels.length > 40000) components.push(pixels);
  }
  const rabbits = components.filter((pixels) => pixels.length < 100000).sort((a, b) => {
    const ax = a.reduce((sum, p) => sum + p % width, 0) / a.length;
    const bx = b.reduce((sum, p) => sum + p % width, 0) / b.length;
    return ax - bx;
  });
  if (rabbits.length !== 2) throw Error(`Expected two original rabbit silhouettes, found ${rabbits.length}`);
  const masks = rabbits.map((pixels) => {
    let mask = new Uint8Array(count);
    for (const p of pixels) mask[p] = 1;
    // Retain the original anti-aliased perimeter, including near-transparent pixels.
    for (let pass = 0; pass < 3; pass++) {
      const expanded = mask.slice();
      for (let p = 0; p < count; p++) {
        if (!mask[p]) continue;
        const x = p % width, y = (p / width) | 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) expanded[ny * width + nx] = 1;
        }
      }
      mask = expanded;
    }
    return mask;
  });
  const files = ['hero-rabbit-left.png', 'hero-rabbit-right.png', 'hero-fountain-only.png'];
  for (let layer = 0; layer < files.length; layer++) {
    const pixels = Buffer.from(data);
    for (let p = 0; p < count; p++) {
      const visible = layer === 2 ? !masks[0][p] && !masks[1][p] : masks[layer][p];
      if (!visible) pixels[p * channels + 3] = 0;
    }
    await sharp(pixels, { raw: { width, height, channels } }).png().toFile(path.join(target, files[layer]));
  }
  console.log(files.join(', '));
})().catch((error) => { console.error(error); process.exitCode = 1; });
