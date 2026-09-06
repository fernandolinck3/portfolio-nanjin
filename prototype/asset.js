/**
 * O caminho de um arquivo de `public/`, resolvido contra a base do deploy.
 *
 * `modules.ts` guarda as imagens como `/works/foo.jpg`, que é a forma certa para o
 * **dado**: um caminho relativo à raiz, que não diz nada sobre onde o site está
 * hospedado. Mas o build emite os scripts relativos (`base: './'`) para o mesmo
 * output rodar de um subdiretório e da raiz de um domínio — e aí um caminho absoluto
 * resolve **passando por cima** do subdiretório e dá 404.
 *
 * Esse defeito só aparece num build publicado, nunca em `npm run dev`, onde o site
 * *está* na raiz. É exatamente a classe de bug que vale quatro linhas para nunca mais
 * ter — e por isso ela mora num lugar só. Havia três cópias em 2026-09-06: aqui,
 * `focus.js` e `superficie.js`.
 */
export const asset = p => (import.meta.env?.BASE_URL || '/') + String(p).replace(/^\//, '')
