import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const BRAND_GREEN = '#2E7D32';

const outDir = resolve(process.cwd(), 'assets');

function squareSvg(size, { withBg = true } = {}) {
  const bg = withBg ? `<rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${BRAND_GREEN}"/>` : '';
  const fontSize = size * 0.62;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${bg}
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
        font-family="Helvetica, Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="800"
        fill="#FFFFFF">S</text>
</svg>`;
}

async function write(filename, size, options) {
  const target = resolve(outDir, filename);
  await mkdir(dirname(target), { recursive: true });
  await sharp(Buffer.from(squareSvg(size, options))).png().toFile(target);
  console.log(`wrote ${filename} (${size}x${size})`);
}

await write('icon.png', 1024);
await write('adaptive-icon.png', 1024);
await write('splash-icon.png', 1024, { withBg: false });
await write('favicon.png', 64);
