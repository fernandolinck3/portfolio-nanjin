# ADR-0029 — A chave do formulário fica exposta, e isso é uma decisão

**Data:** 2026-09-03 · **Status:** aceita
**Toca:** `prototype/contact.js`, e a ADR-0027 que escolheu o Web3Forms

## Contexto

`contact.js` carrega a `ACCESS_KEY` do Web3Forms em texto puro. Não há onde escondê-la:
o site é estático, servido pelo GitHub Pages, e qualquer segredo que o navegador precisa
usar o navegador entrega. O próprio arquivo já dizia isso desde que nasceu.

Uma varredura de segurança em 2026-09-02 levantou a chave como achado, e a defesa óbvia
foi checada: o Web3Forms tem **Restrict to Domain**, que faz a chave só funcionar a
partir de um domínio declarado.

## Decisão

**Não ativar, e não assinar o plano para isso agora.**

O recurso é exclusivo do plano PRO. A documentação deles também registra um efeito
colateral que importa aqui: *"once added forms will only work on the added domain and it
will not work locally"* — então ligá-lo passa a exigir `localhost` na lista ou o
desligamento temporário a cada teste.

## Por quê

O que a restrição protege é estreito. A chave **só envia**: não lê submissões, não dá
acesso à conta, não expõe dado de ninguém. O pior caso realista de alguém colhê-la e
abusar é cota mensal consumida e mensagens que o Fernando não reconhece na caixa.

E já existem duas defesas que não custam nada. O formulário tem honeypot — o campo que
um humano não vê e um robô preenche — e a chave está num portfólio pessoal, que não é o
tipo de alvo que colheita automatizada de chaves procura.

Pagar um plano para fechar um risco de cota, num formulário que recebe poucas mensagens
por mês, é gastar dinheiro e conveniência de desenvolvimento contra um problema que
ainda não existe.

## O gatilho para reverter

Escrito para não depender de alguém lembrar de reavaliar:

- Chegar mensagem pelo formulário que o Fernando não reconhece como pessoa real, mais de
  uma vez; **ou**
- A cota do Web3Forms estourar num mês em que ele não recebeu o volume correspondente.

Qualquer um dos dois e o PRO se paga sozinho. A configuração fica esperando, e o formato
já está levantado: domínio **sem protocolo** — `nanj.in` —, vários separados por vírgula,
nas opções da Access Key e não em Form Details.

## O que foi descartado junto

Trocar de fornecedor para um com restrição de domínio no plano gratuito. A ADR-0027
argumentou a escolha do Web3Forms por a rota sem vendor não existir mais, e trocar de
vendor por um recurso que ainda não é necessário reabriria aquela decisão inteira em
troca de nada.
