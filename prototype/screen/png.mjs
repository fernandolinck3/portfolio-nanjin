/* A minimal PNG reader — enough to read what a pixel-art editor exports, and
   nothing more. It exists so the sprite pipeline adds no dependency to a repo
   that deliberately ships none (ADR-0004).

   Handles the four things Aseprite, Piskel, Photoshop and Retro Diffusion
   actually write: 8/16-bit RGB and RGBA, indexed colour with a palette, and
   greyscale — at bit depths 1, 2, 4, 8 and 16. Adam7 interlacing is rejected
   loudly rather than decoded wrong; no pixel-art tool defaults to it. */
import { inflateSync } from 'node:zlib'

const SIG = [137, 80, 78, 71, 13, 10, 26, 10]
const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }

function paeth(a, b, c) {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}

/** @returns {{ width, height, data: Uint8Array }} data is RGBA, 4 bytes per pixel. */
export function decodePng(buf) {
  for (let i = 0; i < 8; i++)
    if (buf[i] !== SIG[i]) throw new Error('not a PNG file')

  let width = 0, height = 0, depth = 8, colorType = 6, interlace = 0
  let palette = null, transparency = null
  const idat = []

  for (let p = 8; p < buf.length; ) {
    const len = buf.readUInt32BE(p)
    const type = buf.toString('ascii', p + 4, p + 8)
    const body = buf.subarray(p + 8, p + 8 + len)
    p += 12 + len                                   /* 4 len + 4 type + 4 crc */

    if (type === 'IHDR') {
      width = body.readUInt32BE(0); height = body.readUInt32BE(4)
      depth = body[8]; colorType = body[9]; interlace = body[12]
    } else if (type === 'PLTE') palette = body
    else if (type === 'tRNS') transparency = body
    else if (type === 'IDAT') idat.push(body)
    else if (type === 'IEND') break
  }

  if (interlace) throw new Error('interlaced PNG — re-export with interlacing off')
  const channels = CHANNELS[colorType]
  if (!channels) throw new Error('unsupported colour type ' + colorType)

  const raw = inflateSync(Buffer.concat(idat))
  const bpp = Math.max(1, Math.ceil((channels * depth) / 8))
  const lineBytes = Math.ceil((width * channels * depth) / 8)

  /* Undo the per-scanline filters, in place, one line at a time. */
  const flat = new Uint8Array(height * lineBytes)
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (lineBytes + 1)]
    const src = y * (lineBytes + 1) + 1, dst = y * lineBytes, up = dst - lineBytes
    for (let i = 0; i < lineBytes; i++) {
      const x = raw[src + i]
      const a = i >= bpp ? flat[dst + i - bpp] : 0
      const b = y > 0 ? flat[up + i] : 0
      const c = y > 0 && i >= bpp ? flat[up + i - bpp] : 0
      flat[dst + i] =
        filter === 0 ? x : filter === 1 ? x + a : filter === 2 ? x + b :
        filter === 3 ? x + ((a + b) >> 1) : x + paeth(a, b, c)
    }
  }

  /* Pull one channel value out of a scanline, whatever the bit depth. */
  const sample = (y, index) => {
    if (depth === 8) return flat[y * lineBytes + index]
    if (depth === 16) return flat[y * lineBytes + index * 2]     /* drop the low byte */
    const per = 8 / depth, byte = flat[y * lineBytes + ((index / per) | 0)]
    const shift = 8 - depth * ((index % per) + 1)
    const v = (byte >> shift) & ((1 << depth) - 1)
    return Math.round((v * 255) / ((1 << depth) - 1))             /* scale to 0..255 */
  }
  const rawSample = (y, index) => {                                /* unscaled, for palette indices */
    if (depth === 8) return flat[y * lineBytes + index]
    const per = 8 / depth, byte = flat[y * lineBytes + ((index / per) | 0)]
    return (byte >> (8 - depth * ((index % per) + 1))) & ((1 << depth) - 1)
  }

  const data = new Uint8Array(width * height * 4)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const o = (y * width + x) * 4
    let r, g, b, a = 255
    if (colorType === 3) {
      const i = rawSample(y, x)
      r = palette[i * 3]; g = palette[i * 3 + 1]; b = palette[i * 3 + 2]
      if (transparency && i < transparency.length) a = transparency[i]
    } else if (colorType === 0 || colorType === 4) {
      r = g = b = sample(y, x * channels)
      if (colorType === 4) a = sample(y, x * channels + 1)
      else if (transparency && r === transparency.readUInt16BE(0)) a = 0
    } else {
      r = sample(y, x * channels); g = sample(y, x * channels + 1); b = sample(y, x * channels + 2)
      if (colorType === 6) a = sample(y, x * channels + 3)
    }
    data[o] = r; data[o + 1] = g; data[o + 2] = b; data[o + 3] = a
  }
  return { width, height, data }
}
