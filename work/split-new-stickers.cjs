const sharp = require('sharp');
const source = 'C:/Users/liupe/.codex/generated_images/01a1684a-29fb-7ee3-9f24-456d5559b4e5/exec-2a96ecbd-14a1-4af9-8856-ceba94dbba77.png';
const output = 'public/images/stickers';
const crops = [
  ['joy-of-being', { left: 0, top: 275, width: 635, height: 345 }],
  ['one-day', { left: 645, top: 165, width: 435, height: 565 }],
  ['my-year', { left: 0, top: 685, width: 600, height: 600 }],
  ['best-yet', { left: 600, top: 825, width: 486, height: 520 }],
];

async function split(name, crop) {
  const { data, info } = await sharp(source).extract(crop).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const seen = new Uint8Array(width * height);
  let largest = [];
  for (let start = 0; start < seen.length; start++) {
    if (seen[start] || data[start * channels + 3] < 115) continue;
    const queue = [start];
    seen[start] = 1;
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const index = queue[cursor];
      const x = index % width;
      const y = (index / width) | 0;
      for (let ny = Math.max(0, y - 1); ny <= Math.min(height - 1, y + 1); ny++) {
        for (let nx = Math.max(0, x - 1); nx <= Math.min(width - 1, x + 1); nx++) {
          const next = ny * width + nx;
          if (!seen[next] && data[next * channels + 3] >= 115) { seen[next] = 1; queue.push(next); }
        }
      }
    }
    if (queue.length > largest.length) largest = queue;
  }
  const keep = new Uint8Array(width * height);
  for (const index of largest) keep[index] = 1;
  const cleaned = Buffer.from(data);
  let left = width, right = 0, top = height, bottom = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const index = y * width + x;
    let near = false;
    for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < width && ny < height && keep[ny * width + nx]) { near = true; break; }
    }
    const alpha = index * channels + 3;
    if (!near || cleaned[alpha] < 80 || (cleaned[index * channels + 1] < 38 && cleaned[index * channels + 2] < 75)) cleaned[alpha] = 0;
    if (cleaned[alpha] > 0) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }
  }
  await sharp(cleaned, { raw: info }).extract({ left, top, width: right - left + 1, height: bottom - top + 1 }).png().toFile(`${output}/${name}.png`);
  console.log(name, right - left + 1, bottom - top + 1);
}
Promise.all(crops.map(([name, crop]) => split(name, crop))).catch(error => { console.error(error); process.exitCode = 1; });
