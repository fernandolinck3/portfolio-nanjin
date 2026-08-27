import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const HERE = dirname(fileURLToPath(import.meta.url))
import { decodePng } from '../screen/png.mjs'
const { width:W, height:H, data } = decodePng(readFileSync(process.argv[2] || join(HERE, 'roomexample.png')))
const lum=(x,y)=>{const i=(y*W+x)*4;return .2126*data[i]+.7152*data[i+1]+.0722*data[i+2]}
const CX=16, CY=9
const ramp=' .:-=+*#%@'
console.log(`luminance map (${CX}x${CY} cells, mean of each):\n`)
for(let cy=0;cy<CY;cy++){
  let row='', nums=[]
  for(let cx=0;cx<CX;cx++){
    const x0=Math.floor(cx*W/CX),x1=Math.floor((cx+1)*W/CX)
    const y0=Math.floor(cy*H/CY),y1=Math.floor((cy+1)*H/CY)
    let s=0,n=0
    for(let y=y0;y<y1;y+=2)for(let x=x0;x<x1;x+=2){s+=lum(x,y);n++}
    const m=s/n
    row+=ramp[Math.min(9,Math.floor(m/12))].repeat(2)
    nums.push(m.toFixed(0).padStart(3))
  }
  console.log(row+'   '+nums.join(' '))
}
console.log('\nramp: space=0  @=108+   (cell means, 0-255)')
