import sharp from 'sharp';
import { resolve } from 'node:path';

const src = resolve(process.cwd(), 'assets/icon.png');
const dest = resolve(process.cwd(), 'assets/favicon.png');

await sharp(src).resize(64, 64, { fit: 'contain' }).png().toFile(dest);
console.log(`wrote favicon.png (64x64) from icon.png`);
