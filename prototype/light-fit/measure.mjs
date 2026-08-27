import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const HERE = dirname(fileURLToPath(import.meta.url))
import { decodePng } from '../screen/png.mjs'
const p = decodePng(readFileSync(process.argv[2] || join(HERE, 'roomexample.png')))
const { width:W, height:H, data } = p
const at = (x,y) => { const i=(y*W+x)*4; return [data[i],data[i+1],data[i+2]] }
const lum = ([r,g,b]) => .2126*r + .7152*g + .0722*b

// 1. global tonal histogram
const bins = new Array(8).fill(0)
let sum=0
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const L=lum(at(x,y)); sum+=L; bins[Math.min(7,L>>5)]++}
const tot=W*H
console.log('mean luminance', (sum/tot).toFixed(1), '/255')
console.log('tonal bins (0-31,32-63,...):')
bins.forEach((n,i)=>console.log(`  ${String(i*32).padStart(3)}-${String(i*32+31).padStart(3)} ${(n/tot*100).toFixed(1).padStart(5)}%  ${'#'.repeat(Math.round(n/tot*60))}`))

// 2. brightest 1% threshold — how much of frame is actually "lit"
const all=[]
for(let y=0;y<H;y+=3)for(let x=0;x<W;x+=3) all.push(lum(at(x,y)))
all.sort((a,b)=>a-b)
const q=f=>all[Math.floor(all.length*f)].toFixed(0)
console.log('\npercentiles  p50',q(.5),' p90',q(.9),' p99',q(.99),' p999',q(.999),' max',all[all.length-1].toFixed(0))

// 3. corner vs centre falloff
const box=(x0,y0,x1,y1)=>{let s=0,n=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){s+=lum(at(x,y));n++}return s/n}
console.log('\nvignette:')
console.log('  centre       ', box(650,480,980,700).toFixed(1))
console.log('  top-left     ', box(0,0,160,100).toFixed(1))
console.log('  top-right    ', box(W-160,0,W,100).toFixed(1))
console.log('  bottom-left  ', box(0,H-100,160,H).toFixed(1))
console.log('  bottom-right ', box(W-160,H-100,W,H).toFixed(1))
console.log('  ceiling strip', box(200,0,1400,55).toFixed(1))

// 4. named swatches
const sw = {
  'wall (left of window)': [770,120], 'wall (right, dark)': [1560,300],
  'panel bone':[1490,220], 'panel rust':[1300,250], 'panel slate':[1180,250],
  'moon':[963,140], 'night sky':[880,180],
  'table top (lit)':[900,690], 'table top (far dark)':[420,640],
  'rug (lit)':[760,800], 'rug (edge)':[120,900],
  'floor behind rug':[1250,690], 'candle flame':[834,455],
  'deck face':[712,545], 'monitor cabinet':[640,400],
}
console.log('\nswatches (r,g,b · lum):')
for(const [k,[x,y]] of Object.entries(sw)){
  const c=at(x,y); console.log(`  ${k.padEnd(22)} ${String(c[0]).padStart(3)},${String(c[1]).padStart(3)},${String(c[2]).padStart(3)}  ${lum(c).toFixed(0).padStart(3)}`)
}
