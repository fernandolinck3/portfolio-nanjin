/**
 * Quando a GPU vai embora no meio da sessão.
 *
 * Isto não é a mesma pergunta que o `capability.js` faz. Ele pergunta se **há**
 * contexto, antes de a cena existir, e manda quem não tem para o piso de texto. Aqui
 * a cena já está de pé e o contexto **se perde**: o driver reinicia, o sistema tira
 * memória de vídeo, o laptop troca de GPU integrada para dedicada, a aba fica em
 * segundo plano tempo demais no Safari.
 *
 * O navegador não avisa ninguém além deste evento, e nada no objeto o escutava. O
 * resultado era a pior falha que este site pode ter: o canvas apaga e **fica preto
 * para sempre**, com o portfólio inteiro atrás dele, sem erro no console e sem nada
 * na tela dizendo o que aconteceu.
 *
 * O arquivo existia desde o build de julho, em `src/components/`, sem ninguém o
 * importar. Ele estava certo e estava desligado.
 *
 * **`preventDefault` é obrigatório e não é cerimônia**: sem ele o contexto não pode
 * ser restaurado, nem por nós nem pelo navegador. Mantê-lo restaurável é o que deixa
 * a porta aberta para um dia isto reconstruir a cena em vez de cair para o texto.
 */

/**
 * Escuta a perda e devolve como parar de escutar.
 *
 * Desregistrar **antes** de qualquer desmontagem deliberada é obrigatório: soltar o
 * contexto por conta própria também dispara `webglcontextlost`, e tratar isso como
 * falha derrubaria a cena no exato momento em que alguém a estava trocando de lugar.
 */
export function onContextLost(canvas, whenLost) {
  const handle = event => {
    event.preventDefault()
    whenLost()
  }
  canvas.addEventListener('webglcontextlost', handle)
  return () => canvas.removeEventListener('webglcontextlost', handle)
}
