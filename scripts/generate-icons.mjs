import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svg = readFileSync(join(__dirname, '../public/icon.svg'))
const outDir = join(__dirname, '../public/icons')

mkdirSync(outDir, { recursive: true })

const sizes = [16, 32, 180, 192, 512]

for (const size of sizes) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(join(outDir, `icon-${size}.png`))
  console.log(`✓ icon-${size}.png`)
}

console.log('Done.')
