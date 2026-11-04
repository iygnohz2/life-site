/**
 * 一次性处理示例照片：裁掉底部水印条 + 转 JPEG 压缩。
 * 用法：node tools/optimize-photos.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const dir = path.join(process.cwd(), 'public', 'photos')
const files = fs.readdirSync(dir).filter((f) => /\.png$/i.test(f))

for (const file of files) {
  const src = path.join(dir, file)
  const stem = file.replace(/\.png$/i, '')
  const buf = fs.readFileSync(src)
  const meta = await sharp(buf).metadata()
  const cut = Math.round((meta.height ?? 0) * 0.065)

  await sharp(buf)
    .extract({ left: 0, top: 0, width: meta.width, height: meta.height - cut })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(path.join(dir, `${stem}.jpg`))

  const outSize = fs.statSync(path.join(dir, `${stem}.jpg`)).size
  fs.unlinkSync(src)
  console.log(
    `${stem}.jpg  ${meta.width}x${meta.height - cut}  ${(outSize / 1024).toFixed(0)} KB`
  )
}
