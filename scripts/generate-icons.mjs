import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = resolve(__dirname, '../public/icon/icon.svg');
const outDir = resolve(__dirname, '../public/icon');

mkdirSync(outDir, { recursive: true });

const svgBuffer = readFileSync(svgPath);

for (const size of [16, 48, 128]) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(resolve(outDir, `${size}.png`));
  console.log(`Generated ${size}x${size} icon`);
}

console.log('Done!');
