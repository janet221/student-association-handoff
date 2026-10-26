const sharp = require("sharp");
const fs = require("node:fs/promises");

async function cleanLargestContour(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const seen = new Uint8Array(width * height);
  let largest = [];
  for (let start = 0; start < seen.length; start += 1) {
    if (seen[start] || data[start * channels + 3] < 96) continue;
    const queue = [start];
    const component = [];
    seen[start] = 1;
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const index = queue[cursor];
      component.push(index);
      const x = index % width;
      const y = Math.floor(index / width);
      for (let ny = Math.max(0, y - 1); ny <= Math.min(height - 1, y + 1); ny += 1) {
        for (let nx = Math.max(0, x - 1); nx <= Math.min(width - 1, x + 1); nx += 1) {
          const next = ny * width + nx;
          if (!seen[next] && data[next * channels + 3] >= 96) {
            seen[next] = 1;
            queue.push(next);
          }
        }
      }
    }
    if (component.length > largest.length) largest = component;
  }

  const core = new Uint8Array(width * height);
  for (const index of largest) core[index] = 1;
  const cleaned = Buffer.from(data);
  let left = width, top = height, right = 0, bottom = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      let nearCore = false;
      for (let ny = Math.max(0, y - 2); ny <= Math.min(height - 1, y + 2) && !nearCore; ny += 1) {
        for (let nx = Math.max(0, x - 2); nx <= Math.min(width - 1, x + 2); nx += 1) {
          if (core[ny * width + nx]) { nearCore = true; break; }
        }
      }
      const alphaIndex = index * channels + 3;
      if (!nearCore) cleaned[alphaIndex] = 0;
      if (cleaned[alphaIndex] > 0) {
        left = Math.min(left, x); top = Math.min(top, y);
        right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
    }
  }
  const cropWidth = right - left + 1;
  const cropHeight = bottom - top + 1;
  const trimmed = await sharp(cleaned, { raw: info }).extract({ left, top, width: cropWidth, height: cropHeight }).png().toBuffer();
  return { buffer: trimmed, width: cropWidth, height: cropHeight };
}

async function main() {
  const root = "public/images/stickers";
  const names = ["soft-03", "soft-05", "soft-06", "soft-08", "soft-11", "soft-21", "soft-28", "soft-30"];
  for (const name of names) {
    const file = `${root}/${name}.png`;
    const { buffer, width, height } = name === "soft-08" || name === "soft-21"
      ? await cleanLargestContour(file)
      : { buffer: await fs.readFile(file), ...(await sharp(file).metadata()) };
    const temporary = `${file}.tmp.png`;
    await sharp(buffer)
      .resize({ width: width * 4, height: height * 4, kernel: sharp.kernel.lanczos3 })
      .sharpen({ sigma: 1.1, m1: 0.35, m2: 1.1 })
      .png({ compressionLevel: 9, palette: false })
      .toFile(temporary);
    await fs.rename(temporary, file);
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
