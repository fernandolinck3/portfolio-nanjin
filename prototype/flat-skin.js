/**
 * O Flat Plate — a Tela, em CSS, sobre a marcação do espelho.
 *
 * `SPEC` §6 e o `T-05` pedem um **entregável desenhado**, não um screenshot
 * degradado, e dizem por quê: é a versão que crawler, busca de página e ATS veem,
 * e portanto a que a maioria dos recrutadores encontra antes de carregar o 3D.
 * Até 2026-09-03 o que existia era o piso — texto corrido em Archivo, honesto e
 * sem desenho.
 *
 * ## A regra que evita a segunda fonte
 *
 * **Nada aqui renderiza.** Toda a marcação vem de `src/content/mirror.ts`, e esta
 * folha só a veste. É por isso que o espelho ganhou `data-mirror-layout` e os
 * ganchos de campo: sem eles, desenhar os cinco layouts exigiria remontar a
 * distinção aqui — uma segunda fonte da mesma informação, que é o que o
 * `CLAUDE.md` inteiro existe para impedir.
 *
 * ## De onde vem cada decisão
 *
 * Paleta: os dois estados de `render.js` — `DAY` em osso e ouro, `DARK` em osso e
 * brasa. Faces: a mesma divisão que a Screen usa, e não uma aproximação —
 * UnifrakturMaguntia no nome e nos títulos de Módulo, Silkscreen em todo rótulo,
 * VT323 na prosa. As três já são carregadas pelo `index.html`.
 *
 * ## Emissão, não grão
 *
 * Um display emite luz de dentro do glifo; grão é propriedade do papel. O halo é
 * proporcional ao peso do texto — apertado no Silkscreen, que é bitmap e um halo
 * largo o borraria. A varredura é um sussurro a 6%; a 16% ela vira textura, que é
 * a coisa errada.
 *
 * ## Caixa de frase nos títulos, e por CSS
 *
 * `render.js:621` já resolveu isto: maiúsculas de blackletter são quase ilegíveis
 * em sequência — «CRITÉRIOS» em UnifrakturMaguntia é uma fileira de formas. Aqui
 * a correção é `text-transform:lowercase` mais `::first-letter`, e não uma segunda
 * string: o Módulo continua se chamando CRITÉRIOS no DOM, que é o que uma máquina
 * deve ler, e só o desenho o mostra como Critérios.
 *
 * As Teclas mantêm a caixa alta pelo mesmo motivo que na Plate: são Silkscreen, e
 * ali a caixa alta é a convenção.
 */

export const FLAT_CSS = `
  html[data-flat]{
    --bg:#0A0B09; --ink:#E9E3D2; --mid:#8A8470; --dim:#5E5A4C; --gold:#C9BE96;
    --rim:#1C2018; --well:#07080A;
    --glow:rgba(201,190,150,.055);
    --emit:rgba(233,227,210,.32); --emit-gold:rgba(201,190,150,.32);
    --emit-tight:rgba(233,227,210,.46);
  }
  html[data-flat][data-vigil="1"]{
    --bg:#08070A; --ink:#DCD6C6; --mid:#9C5A4E; --dim:#6E1810; --gold:#F03A22;
    --rim:#160E0E; --well:#050408;
    --glow:rgba(240,58,34,.05);
    --emit:rgba(220,214,198,.28); --emit-gold:rgba(240,58,34,.42);
    --emit-tight:rgba(220,214,198,.4);
  }

  html[data-flat] body{ overflow:auto; background:var(--well); }
  html[data-flat] #frame, html[data-flat] #stage, html[data-flat] .hud{ display:none !important; }

  /* O recorte de mirror.ts é desfeito aqui e não editado lá: aquela folha é o que
     impede o espelho pré-renderizado de piscar como um muro de texto num
     carregamento normal, e ela precisa seguir fazendo aquilo. */
  html[data-flat] #mirror{
    position:static; width:auto; height:auto; overflow:visible; display:block;
    max-width:820px; margin:0 auto; padding:26px 18px 100px;
    font:400 21px/1.5 VT323, ui-monospace, "Courier New", monospace;
    color:var(--ink); -webkit-font-smoothing:antialiased;
  }

  /* ── o poço: cada Módulo é uma superfície acesa dentro de uma moldura ────── */
  html[data-flat] #mirror > section{
    background:var(--bg); border:1px solid var(--rim); margin:0 0 22px;
    box-shadow:inset 0 0 90px 18px var(--glow), inset 0 0 0 1px rgba(0,0,0,.5);
    position:relative; overflow:hidden; padding:26px 30px 32px;
  }
  /* o vidro, sob o texto */
  html[data-flat] #mirror > section::before{
    content:""; position:absolute; inset:0; pointer-events:none; z-index:0;
    background:radial-gradient(125% 105% at 50% 38%,
      transparent 52%, rgba(0,0,0,.30) 88%, rgba(0,0,0,.46) 100%);
  }
  /* a varredura, sobre tudo */
  html[data-flat] #mirror > section::after{
    content:""; position:absolute; inset:0; pointer-events:none; z-index:3;
    background:repeating-linear-gradient(to bottom,
      rgba(0,0,0,.06) 0 1px, transparent 1px 4px);
    mix-blend-mode:multiply;
  }
  html[data-flat] #mirror > section > *{ position:relative; z-index:2; }

  /* ── emissão, por peso ───────────────────────────────────────────────────── */
  html[data-flat] #mirror{ text-shadow:0 0 7px var(--emit); }
  html[data-flat] #mirror :is(h2,h4,[data-mirror-role],[data-mirror-disc],[data-mirror-meta]){
    text-shadow:0 0 4px var(--emit-tight);
  }
  html[data-flat] #mirror :is([data-mirror-role],h4){ text-shadow:0 0 4px var(--emit-gold); }

  /* ── BLACKLETTER · o nome e os títulos de Módulo ─────────────────────────── */
  html[data-flat] #mirror h1{
    font:400 clamp(38px,7.4vw,62px)/1 UnifrakturMaguntia, Georgia, serif;
    color:var(--ink); margin:0 0 10px; letter-spacing:.01em;
    text-shadow:0 0 13px var(--emit), 0 0 3px var(--emit);
  }
  html[data-flat] #mirror h2{
    font:400 clamp(23px,3.3vw,30px)/1.12 UnifrakturMaguntia, Georgia, serif;
    color:var(--ink); margin:0 0 8px; border:0; padding:0;
    text-transform:lowercase;
  }
  html[data-flat] #mirror h2::first-letter{ text-transform:uppercase; }

  /* ── SILKSCREEN · todo rótulo ────────────────────────────────────────────── */
  html[data-flat] #mirror [data-mirror-role]{
    font:400 10px/2 Silkscreen, ui-monospace, monospace; letter-spacing:.17em;
    color:var(--gold); text-transform:uppercase; margin:0 0 18px;
  }
  html[data-flat] #mirror [data-mirror-disc]{
    display:flex; flex-wrap:wrap; gap:0 13px; margin:0 0 22px; padding:0; list-style:none;
    font:400 9px/2.2 Silkscreen, ui-monospace, monospace; letter-spacing:.13em;
    color:var(--mid); text-transform:uppercase;
  }
  html[data-flat] #mirror [data-mirror-disc] li{ position:relative; padding-right:13px; margin:0; }
  html[data-flat] #mirror [data-mirror-disc] li::after{
    content:"·"; position:absolute; right:0; color:var(--dim);
  }
  html[data-flat] #mirror [data-mirror-disc] li:last-child::after{ content:""; }
  html[data-flat] #mirror h4{
    font:400 9px/2 Silkscreen, ui-monospace, monospace; letter-spacing:.15em;
    color:var(--dim); text-transform:uppercase; margin:14px 0 5px;
  }
  html[data-flat] #mirror [data-mirror-meta]{
    font:400 9px/2 Silkscreen, ui-monospace, monospace; letter-spacing:.14em;
    color:var(--dim); text-transform:uppercase; margin:0 0 4px;
  }

  /* ── VT323 · a prosa ─────────────────────────────────────────────────────── */
  html[data-flat] #mirror p{ margin:0 0 13px; max-width:56ch; }
  html[data-flat] #mirror [data-mirror-lead]{ font-size:23px; line-height:1.45; color:var(--ink); }
  html[data-flat] #mirror [data-mirror-low]{ color:var(--dim); font-size:19px; }
  html[data-flat] #mirror ul{ list-style:none; margin:0; padding:0; }
  html[data-flat] #mirror h3{ margin:0 0 3px; font:inherit; }

  /* Os títulos de item são botões porque a Tela precisa que sejam; sem Tela eles
     voltam a ser títulos e têm de parar de parecer pressionáveis. */
  html[data-flat] #mirror h3 button{
    all:unset; display:block; cursor:default; font:inherit;
    font-size:22px; color:var(--ink);
  }

  /* ── LIST · nomes, e só nomes ────────────────────────────────────────────── */
  html[data-flat] #mirror [data-mirror-layout="list"] > ul > li{
    padding:15px 0; border-top:1px solid var(--rim); margin:0;
  }
  html[data-flat] #mirror [data-mirror-layout="list"] > ul > li:last-child{ padding-bottom:0; }

  /* ── INDEX · numerado, compacto, tudo visível ────────────────────────────── */
  html[data-flat] #mirror [data-mirror-layout="index"] > ul > li{
    padding:14px 0 14px 42px; border-top:1px solid var(--rim); position:relative; margin:0;
  }
  html[data-flat] #mirror [data-mirror-layout="index"] [data-mirror-meta]{
    position:absolute; left:0; top:16px; font-size:11px; color:var(--gold);
    letter-spacing:.1em; margin:0;
  }

  /* ── GRID · matriz de grupos ─────────────────────────────────────────────── */
  html[data-flat] #mirror [data-mirror-layout="grid"] > ul{
    display:grid; grid-template-columns:repeat(auto-fit,minmax(230px,1fr));
    gap:1px; background:var(--rim); border:1px solid var(--rim); margin-top:14px;
  }
  html[data-flat] #mirror [data-mirror-layout="grid"] > ul > li{
    background:var(--bg); padding:18px 20px; margin:0;
  }
  html[data-flat] #mirror [data-mirror-layout="grid"] h3 button{
    font:400 9px/2 Silkscreen, ui-monospace, monospace; letter-spacing:.14em;
    color:var(--gold); text-transform:uppercase;
  }
  html[data-flat] #mirror [data-mirror-layout="grid"] p{ font-size:19px; color:var(--mid); }

  /* ── NODES · blocos grandes, ligados ─────────────────────────────────────── */
  html[data-flat] #mirror [data-mirror-layout="nodes"] > ul{
    display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr));
    gap:26px; margin-top:14px;
  }
  html[data-flat] #mirror [data-mirror-layout="nodes"] > ul > li{
    border-left:1px solid var(--rim); padding-left:18px; margin:0;
  }
  html[data-flat] #mirror [data-mirror-layout="nodes"] h3 button{
    font-family:UnifrakturMaguntia, Georgia, serif; font-size:clamp(19px,2.4vw,23px);
    line-height:1.2; text-transform:lowercase;
  }
  html[data-flat] #mirror [data-mirror-layout="nodes"] h3 button::first-letter{
    text-transform:uppercase;
  }

  /* ── as rotas que agem ───────────────────────────────────────────────────── */
  html[data-flat] #mirror a{
    color:var(--ink); text-decoration:none; border-bottom:1px solid var(--rim);
  }
  html[data-flat] #mirror a:hover, html[data-flat] #mirror a:focus-visible{
    color:var(--gold); border-color:var(--gold);
  }

  /* ── LYRA ────────────────────────────────────────────────────────────────
     Uma só, e não uma por Módulo: aqui não há cursor de Módulo para ela seguir.
     A bolha é horizontal porque a linha tem espaço — na Tela ela é estreita
     porque lá o espaço é de 320px. */
  html[data-flat] .flat-lyra{
    max-width:820px; margin:0 auto 22px; padding:18px 30px;
    border:1px solid var(--rim); background:var(--bg);
    display:flex; gap:16px; align-items:flex-end;
  }
  html[data-flat] .flat-lyra canvas{ display:block; flex:0 0 auto; image-rendering:pixelated; }
  html[data-flat] .flat-lyra .say{ flex:1; min-width:0; }
  html[data-flat] .flat-lyra .who{
    font:400 9px/2.6 Silkscreen, ui-monospace, monospace; letter-spacing:.15em;
    color:var(--dim); text-transform:uppercase; margin:0;
    text-shadow:0 0 4px var(--emit-tight);
  }
  html[data-flat] .flat-lyra .bubble{
    border:1px solid var(--rim); padding:12px 16px; background:rgba(0,0,0,.22);
  }
  html[data-flat] .flat-lyra .bubble p{
    margin:0; color:var(--mid); font-size:20px; max-width:none;
  }

  /* ── o piso, e a rota que ainda age ──────────────────────────────────────── */
  html[data-flat] .flat-note{
    max-width:820px; margin:0 auto 22px; padding:14px 18px;
    border:1px solid var(--rim); background:var(--bg);
    font:400 9px/2 Silkscreen, ui-monospace, monospace; letter-spacing:.12em;
    color:var(--dim); text-transform:uppercase;
    text-shadow:0 0 4px var(--emit-tight);
  }
  html[data-flat] .flat-write{
    all:unset; display:inline-block; margin:18px 0 0; cursor:pointer;
    border:1px solid var(--rim); color:var(--mid); padding:11px 22px;
    font:400 9px/1 Silkscreen, ui-monospace, monospace; letter-spacing:.16em;
    text-transform:uppercase; transition:.18s;
  }
  html[data-flat] .flat-write:hover, html[data-flat] .flat-write:focus-visible{
    border-color:var(--gold); color:var(--gold);
  }

  /* A saída de foco do espelho recortado perde o sentido depois de desrecortado. */
  html[data-flat] #mirror :is(button,a):focus{
    position:static; padding:0; background:none; color:inherit; border:0;
    max-width:none; font:inherit; letter-spacing:inherit;
  }
  html[data-flat] #mirror :is(button,a):focus-visible{
    outline:2px solid var(--gold); outline-offset:3px;
  }

  @media (max-width:600px){
    html[data-flat] #mirror > section{ padding:22px 20px 26px; }
  }
  @media (prefers-reduced-motion:reduce){
    html[data-flat] #mirror > section::after{ display:none; }
  }
`
