import fs from 'fs'
const three = fs.readFileSync(new URL('../node_modules/three/build/three.module.min.js', import.meta.url), 'utf8')
const scene = fs.readFileSync(new URL('./scene.js', import.meta.url), 'utf8')
const html = `<title>Tenebrae Unit</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..700&family=Azeret+Mono:wght@400;500&display=swap">
<style>
  *{box-sizing:border-box} html,body{height:100%;margin:0;overflow:hidden;background:#0A0A0B}
  #stage{position:fixed;inset:0} canvas{display:block}
  .hud{position:fixed;left:0;right:0;bottom:0;display:flex;align-items:flex-end;justify-content:space-between;
    gap:18px;padding:18px 22px;pointer-events:none;
    font-family:"Azeret Mono",ui-monospace,monospace;font-size:10px;letter-spacing:.14em;color:#8A8880}
  .hud b{color:#C4281C;font-weight:500}
  .ctl{pointer-events:auto;display:flex;align-items:center;gap:12px}
  input[type=range]{-webkit-appearance:none;appearance:none;width:190px;height:22px;background:transparent;cursor:ew-resize}
  input[type=range]::-webkit-slider-runnable-track{height:2px;background:#3A3A38}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:20px;margin-top:-9px;background:#DEDCD3;border:1px solid #000}
  input[type=range]::-moz-range-track{height:2px;background:#3A3A38}
  input[type=range]::-moz-range-thumb{width:12px;height:20px;border-radius:0;background:#DEDCD3;border:1px solid #000}
  .note{max-width:52ch;line-height:1.7}
  .sr{position:fixed;left:0;top:0;z-index:80;display:flex;gap:4px;padding:6px}
  .sr button{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
  .sr button:focus{position:static;width:auto;height:auto;clip:auto;margin:0;padding:5px 9px;
    font:10px/1 "Azeret Mono",monospace;letter-spacing:.1em;text-transform:uppercase;
    background:#DEDCD3;color:#17181B;border:1px solid #000;cursor:pointer}
  #err{position:fixed;top:0;left:0;right:0;max-height:60%;overflow:auto;margin:0;padding:12px;color:#F03A22;
    background:rgba(0,0,0,.92);font:11px/1.5 monospace;white-space:pre-wrap;z-index:99;display:none}
</style>
<div id="stage"></div>
<nav class="sr" aria-label="Unit controls">
  <button data-act="0">Ident</button><button data-act="1">Now / Next</button>
  <button data-act="2">Project 001</button><button data-act="3">Crate</button>
  <button data-act="4">Method</button><button data-act="5">Out</button>
  <button data-act="inspect">Toggle inspect mode</button>
</nav>
<pre id="err"></pre>
<div class="hud">
  <p class="note">Click the pads. Drag the jog to browse, the knob to bend,<br>the fader to crossfade. <b id="mode">INSPECT OFF</b></p>
  <span class="ctl">BEND <input id="bend" type="range" min="0" max="100" value="0" aria-label="Bend"> <b id="bv">00</b></span>
</div>
<script>
window.addEventListener('error',function(e){var d=document.getElementById('err');d.style.display='block';d.textContent+='ERR: '+(e.message||e)+' @'+(e.lineno||'')+String.fromCharCode(10);});
</script>
<script type="module">
${three}
;(function(){
${scene}
})();
</script>`
fs.writeFileSync(new URL('./unit.html', import.meta.url), html)
console.log('MB', (html.length/1048576).toFixed(2))
