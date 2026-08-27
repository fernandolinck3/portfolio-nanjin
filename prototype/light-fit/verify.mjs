import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const HERE = dirname(fileURLToPath(import.meta.url))
const R = join(HERE, '..') + '/'
const scene=readFileSync(R+'scene.js','utf8'), decor=readFileSync(R+'room-decor.js','utf8')
const grab=(src,re,label)=>{const m=src.match(re); if(!m) throw new Error('could not read '+label); return parseFloat(m[1])}

const V={
  exposure: grab(scene,/toneMappingExposure = ([\d.]+)/,'exposure'),
  env:      grab(scene,/scene\.environmentIntensity = ([\d.]+);/,'env'),
  key:      grab(scene,/SpotLight\(0xffc98a, ([\d.]+)/,'key'),
  keyAngle: grab(scene,/SpotLight\(0xffc98a, [\d.]+, [\d.]+, ([\d.]+)/,'key angle'),
  keyPen:   grab(scene,/SpotLight\(0xffc98a, [\d.]+, [\d.]+, [\d.]+, ([\d.]+)/,'key penumbra'),
  keyDist:  grab(scene,/SpotLight\(0xffc98a, [\d.]+, ([\d.]+)/,'key distance'),
  moon:     grab(scene,/DirectionalLight\(0x8FA6C4, ([\d.]+)/,'moon'),
  candle:   grab(scene,/PointLight\(0xFFB162, ([\d.]+)/,'candle'),
  globe:    grab(decor,/PointLight\(0xF3C070, ([\d.]+)/,'globe'),
  /* the Screen's glow light shares this hex, so match the declaration by name */
  picture:  grab(scene,/pictureLight = new THREE\.PointLight\(0x7FD9B0, ([\d.]+)/,'picture'),
  picDist:  grab(scene,/pictureLight = new THREE\.PointLight\(0x7FD9B0, [\d.]+, ([\d.]+)/,'picture distance'),
  /* Two directionals that were missed the first time this was written, and they are
     not small: skyLight is the largest single light in the scene. Anything computed
     without them is wrong, which is exactly what happened. */
  sky:      grab(scene,/skyLight = new THREE\.DirectionalLight\(0xFFE4BC, ([\d.]+)/,'skyLight'),
  wash:     grab(scene,/wallWash = new THREE\.DirectionalLight\(0xC8B79A, ([\d.]+)/,'wallWash'),
}
console.log('read back from the source files:')
for(const [k,v] of Object.entries(V)) console.log('  '+k.padEnd(9), v)

const aces=x=>{const a=(x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14);return Math.min(1,Math.max(0,a))}
const srgb=c=>(c<=0.0031308?12.92*c:1.055*Math.pow(c,1/2.4)-0.055)
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]]
const len=v=>Math.hypot(...v), norm=v=>{const l=len(v);return v.map(x=>x/l)}
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2]
const fall=(r,d)=>{let f=1/Math.max(r*r,.01); if(d>0){const w=Math.max(0,Math.min(1,1-Math.pow(r/d,4)));f*=w*w} return f}
const sstep=(e0,e1,x)=>{const t=Math.max(0,Math.min(1,(x-e0)/(e1-e0)));return t*t*(3-2*t)}

const FLOOR_Y=-2.95, WALL_Z=-11.5, cz=WALL_Z+0.7+0.85, CY=1.05*.98+.60
const candles=[[0,CY,-2.05],[3.42,CY,1.35],[-3.42,CY,1.35]]
const globes=[[-11.5,-.88,cz-.04],[9.9,-1.03,cz-.04]]
const SP={pos:[-2.4,4.6,1.6],dir:norm(sub([0,.2,-.2],[-2.4,4.6,1.6]))}
const cc=Math.cos(V.keyAngle), pc=Math.cos(V.keyAngle*(1-V.keyPen))
const MOON=norm([1.1,2.4,4.2])
const PIC=[-4.9,FLOOR_Y+5.4,WALL_Z+1.9]
/* three shines a directional from `position` toward `target`, so the vector arriving
   at a surface is normalize(position - target) */
const SKY  = norm(sub([1.1,4.6,WALL_Z],[0,0,1]))
const WASH = norm(sub([0,5,6],[0,2,WALL_Z]))

const S=[
  ['Unit face',            [0,0.35,0],          [0,1,0], .18, null],
  ['table by the candles', [0.9,0.05,-1.2],     [0,1,0], .42, 65],
  ['table far corner',     [-6,0.05,-3.4],      [0,1,0], .42, 45],
  ['monitor front',        [3.75,-1.2,-9.5],    [0,0,1], .12, 28],
  ['panel nearest globe',  [-10.6,0.10,-10.78], [0,0,1], .55, 56],
  ['panel far from globe', [-7.2,0.10,-10.78],  [0,0,1], .55, 45],
  ['far wall centre',      [0,0.5,-10.78],      [0,0,1], .09, 13],
  ['floor behind rug',     [0,FLOOR_Y,-8],      [0,1,0], .22, 19],
  ['far wall, high',       [0,7.0,-10.78],      [0,0,1], .09,  6],
  ['side wall, left',      [-14.6,0.5,-3],      [1,0,0], .09,  4],
  ['floor, front corner',  [-12,FLOOR_Y,4],     [0,1,0], .22,  4],
]
if(process.env.SWEEP){
  const pts=S.filter(x=>['monitor front','far wall centre','panel far from globe','far wall, high'].includes(x[0]))
  console.log('\npicture  dist |'+pts.map(p=>p[0].slice(0,13).padStart(14)).join(' |'))
  console.log(' target       |'+pts.map(p=>String(p[4]).padStart(14)).join(' |'))
  for(const [I,D] of [[14,8],[12,11],[11,13],[9,16],[8,18]]){
    V.picture=I; V.picDist=D
    const row=pts.map(([n,P,N,alb])=>{
      const v=sub(SP.pos,P), r=len(v), L=norm(v)
      const spot=V.key*fall(r,V.keyDist)*sstep(cc,pc,dot([-L[0],-L[1],-L[2]],SP.dir))*Math.max(0,dot(N,L))
      const mo=V.moon*Math.max(0,dot(N,MOON.map(x=>-x)))
      const ca=candles.reduce((s,q)=>{const w=sub(q,P),d=len(w);return s+V.candle*fall(d,13)*Math.max(0,dot(N,norm(w)))},0)
      const gl=globes.reduce((s,q)=>{const w=sub(q,P),d=len(w);return s+V.globe*fall(d,9)*Math.max(0,dot(N,norm(w)))},0)
      const pv=sub(PIC,P), pr=len(pv)
      const pi=V.picture*fall(pr,V.picDist)*Math.max(0,dot(N,norm(pv)))
      return String(Math.round(srgb(aces((V.env+spot+mo+ca+gl+pi)*alb/Math.PI*V.exposure))*255)).padStart(14)
    })
    console.log(String(I).padStart(7)+String(D).padStart(6)+' |'+row.join(' |'))
  }
  process.exit(0)
}
console.log('\nsample point            | now | ref | candles | sky+wash')
console.log('-'.repeat(66))
let worst=0
for(const [n,P,N,alb,ref] of S){
  const v=sub(SP.pos,P), r=len(v), L=norm(v)
  const spot=V.key*fall(r,V.keyDist)*sstep(cc,pc,dot([-L[0],-L[1],-L[2]],SP.dir))*Math.max(0,dot(N,L))
  const mo=V.moon*Math.max(0,dot(N,MOON.map(x=>-x)))
  const ca=candles.reduce((s,q)=>{const w=sub(q,P),d=len(w);return s+V.candle*fall(d,13)*Math.max(0,dot(N,norm(w)))},0)
  const gl=globes.reduce((s,q)=>{const w=sub(q,P),d=len(w);return s+V.globe*fall(d,9)*Math.max(0,dot(N,norm(w)))},0)
  const pv=sub(PIC,P), pr=len(pv)
  const pi=V.picture*fall(pr,V.picDist)*Math.max(0,dot(N,norm(pv)))
  const sk=V.sky *Math.max(0,dot(N,SKY))
  const wa=V.wash*Math.max(0,dot(N,WASH))
  const E=V.env+spot+mo+ca+gl+pi+sk+wa
  const out=Math.round(srgb(aces(E*alb/Math.PI*V.exposure))*255)
  if(ref!==null) worst=Math.max(worst,Math.abs(out-ref))
  console.log(n.padEnd(23)+' | '+String(out).padStart(3)+' | '+String(ref===null?'—':ref).padStart(3)+
    ' | '+((ca/E*100).toFixed(0)+'%').padStart(7)+' | '+(((sk+wa)/E*100).toFixed(0)+'%').padStart(8))
}
console.log('\nworst deviation from the reference: '+worst+' px')
