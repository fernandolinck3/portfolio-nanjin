const aces=x=>{const a=(x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14);return Math.min(1,Math.max(0,a))}
const srgb=c=>(c<=0.0031308?12.92*c:1.055*Math.pow(c,1/2.4)-0.055)
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]]
const len=v=>Math.hypot(...v), norm=v=>{const l=len(v);return v.map(x=>x/l)}
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2]
const pointFall=(r,d,dec=2)=>{let f=1/Math.max(Math.pow(r,dec),.01)
  if(d>0){const w=Math.max(0,Math.min(1,1-Math.pow(r/d,4)));f*=w*w}return f}
const smoothstep=(e0,e1,x)=>{const t=Math.max(0,Math.min(1,(x-e0)/(e1-e0)));return t*t*(3-2*t)}

const FLOOR_Y=-2.95, WALL_Z=-11.5, wallFace=WALL_Z+0.7, cz=wallFace+0.85
const CY=1.05*.98+.60
const candles=[[0,CY,-2.05],[3.42,CY,1.35],[-3.42,CY,1.35]]
const globes=[[-11.5,-.88,cz-.04],[9.9,-1.03,cz-.04]]

/* the key becomes a spot standing in for the candle cluster: one 2D shadow map,
   exactly what a directional costs, but with a cone and a falloff */
const SPOT={pos:[-2.4,4.6,1.6], target:[0,.2,-.2], dist:20, angle:.80, penumbra:.85}
const SPOT_DIR=norm(sub(SPOT.target,SPOT.pos))
const coneCos=Math.cos(SPOT.angle), penCos=Math.cos(SPOT.angle*(1-SPOT.penumbra))
function spotCoef(P,N){
  const v=sub(SPOT.pos,P), r=len(v), L=norm(v)
  const ang=dot([-L[0],-L[1],-L[2]],SPOT_DIR)
  const sa=smoothstep(coneCos,penCos,ang)
  if(sa<=0) return 0
  return pointFall(r,SPOT.dist)*sa*Math.max(0,dot(N,L))
}
/* moon: a directional is physically right for it, and it is meant to be flat */
const MOON=norm([1.1,2.4,4.2])   // from the window, which is behind the wall at -z
function moonCoef(N){ return Math.max(0,dot(N,[-MOON[0],-MOON[1],-MOON[2]])) }
/* the painting's backlight, the one thing lighting the middle of the wall in his ref */
const PAINT=[-2.6,1.9,-10.3]
function paintCoef(P,N){const v=sub(PAINT,P),r=len(v);return pointFall(r,7)*Math.max(0,dot(N,norm(v)))}

const S=[
  ['Unit face',            [0,0.35,0],          [0,1,0], .18, 42, 1.5],
  ['table by the candles', [0.9,0.05,-1.2],     [0,1,0], .42, 65, 1.5],
  ['table far corner',     [-6,0.05,-3.4],      [0,1,0], .42, 45, 1.0],
  ['monitor front',        [3.75,-1.2,-9.5],    [0,0,1], .12, 28, 1.0],
  ['panel nearest globe',  [-10.6,0.10,-10.78], [0,0,1], .55, 56, 1.0],
  ['panel far from globe', [-7.2,0.10,-10.78],  [0,0,1], .55, 45, 1.0],
  ['far wall centre',      [0,0.5,-10.78],      [0,0,1], .09, 13, 1.5],
  ['floor behind rug',     [0,FLOOR_Y,-8],      [0,1,0], .22, 19, 1.0],
  ['far wall, high',       [0,7.0,-10.78],      [0,0,1], .09,  6, 3.0],
  ['far wall, right end',  [12,0.5,-10.78],     [0,0,1], .09,  5, 3.0],
  ['side wall, left',      [-14.6,0.5,-3],      [1,0,0], .09,  4, 3.0],
  ['floor, front corner',  [-12,FLOOR_Y,4],     [0,1,0], .22,  4, 3.0],
]
const COEF=S.map(([n,P,N])=>({
  env:1, spot:spotCoef(P,N), moon:moonCoef(N), paint:paintCoef(P,N),
  candle:candles.reduce((s,q)=>{const v=sub(q,P),r=len(v);return s+pointFall(r,13)*Math.max(0,dot(N,norm(v)))},0),
  globe: globes .reduce((s,q)=>{const v=sub(q,P),r=len(v);return s+pointFall(r, 9)*Math.max(0,dot(N,norm(v)))},0),
}))
const KEYS=['env','spot','moon','paint','candle','globe']
const px=(rig,i,exp)=>srgb(aces(KEYS.reduce((s,k)=>s+rig[k]*COEF[i][k],0)*S[i][3]/Math.PI*exp))*255
function cost(rig,exp){
  let c=S.reduce((s,[n,,,,t,w],i)=>s+w*Math.pow(px(rig,i,exp)-t,2),0)
  if(rig.env>0.30) c += 4000*Math.pow(rig.env-0.30,2)        // env stands in for bounce, no more
  /* the Candles must actually carry the Altar: without this the fit hands the room
     to the uniform term and the rite stops dimming anything */
  for(const i of [0,1,2]){
    const co=COEF[i], tot=KEYS.reduce((s,k)=>s+rig[k]*co[k],0)
    const share=(rig.candle*co.candle)/tot
    if(share<0.35) c += 9000*Math.pow(0.35-share,2)
  }
  return c
}

let rig={env:.15,spot:60,moon:.08,paint:4,candle:12,globe:6}, exp=.92, best=cost(rig,exp)
for(let p=0;p<12000;p++){
  const st=1+0.25*Math.exp(-p/2600)
  for(const k of KEYS) for(const f of [st,1/st]){
    const t={...rig}; t[k]=rig[k]*f; const c=cost(t,exp); if(c<best){best=c;rig=t}
  }
  for(const f of [st,1/st]){const c=cost(rig,exp*f); if(c<best){best=c;exp=exp*f}}
}
console.log('fitted:  exposure '+exp.toFixed(3))
for(const k of KEYS) console.log('  '+k.padEnd(7), rig[k].toFixed(3))
console.log('\nsample point            | fitted | target | flat / spot+moon / practicals')
console.log('-'.repeat(84))
for(let i=0;i<S.length;i++){
  const c=COEF[i]
  const flat=rig.env, beam=rig.spot*c.spot+rig.moon*c.moon
  const prac=rig.candle*c.candle+rig.globe*c.globe+rig.paint*c.paint
  const tot=flat+beam+prac
  console.log(S[i][0].padEnd(23)+' | '+px(rig,i,exp).toFixed(0).padStart(6)+' | '+String(S[i][4]).padStart(6)+
    ' |  '+(flat/tot*100).toFixed(0).padStart(3)+'% / '+(beam/tot*100).toFixed(0).padStart(3)+'% / '+(prac/tot*100).toFixed(0).padStart(3)+'%')
}
const err=Math.sqrt(best/S.reduce((s,x)=>s+x[5],0))
console.log('\nweighted RMS error: '+err.toFixed(1)+' px  (was 11.4 with the directional rig)')
