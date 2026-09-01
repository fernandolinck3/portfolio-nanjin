# T-28 — Três rotas para um formulário, e a que custa menos

Pesquisa. Nada foi construído; nenhum arquivo de código foi tocado.

## Recomendação

**Rota A — um endpoint de terceiro (Web3Forms), com honeypot, mantendo o endereço
visível ao lado como rota de falha.** É a única que não acrescenta pacote nenhum ao
`package.json` — o custo que a ADR-0004 vem cobrando de fato, e o que as 120 linhas de
`zlib` compraram. O que ela acrescenta é um **fornecedor no caminho do dado em tempo de
execução**: questão de LGPD, não de dependência, e a LGPD tem resposta específica aqui.
Quem preenche o formulário para falar de vaga ou projeto pede *procedimentos
preliminares relacionados a contrato* (art. 7º, V), e o art. 33, IX autoriza a
transferência internacional exatamente nessas hipóteses — sem consentimento, sem banner,
sem contradizer a decisão que continua aberta em `docs/analytics/README.md`, que é sobre
**cookie de analytics**, outra coisa. A rota própria não evita fornecedor: um Worker
**não envia e-mail sozinho**, e o caminho gratuito que existia (MailChannels) morreu em
2024. Ela custa uma conta a mais para manter viva, uma migração de DNS ainda não feita e
uma ordem de grandeza a mais de trabalho, para terminar com um fornecedor de e-mail no
mesmo lugar.

## Comparação

| | A — endpoint de terceiro | B — endpoint próprio (Worker) | C — só `mailto:` |
|---|---|---|---|
| Pacotes npm | **0** (um `fetch` para uma URL) | 0 no site; `wrangler` no dev | 0 |
| ADR-0004 | não viola a letra (nenhum pacote); acrescenta fornecedor em runtime | idem, mais um serviço a manter | nada |
| Fornecedor no caminho do dado | 1 (Web3Forms, EUA) | 1 (provedor de e-mail) + Cloudflare | 0 |
| Custo | R$ 0 até o limite do plano grátis | US$ 0–5/mês, ver abaixo | 0 |
| Esforço | ~2–3 h (form DOM + estados + honeypot) | ~1–2 dias (conta, DNS, deploy, CORS, segredo, spam) | ~1 h (é o T-24) |
| Spam | honeypot `botcheck` + hCaptcha/Turnstile | tudo por conta própria | inexistente |
| Falha visível | resposta JSON com `success: false` → dá para dizer na tela | idem, se for escrito | o cliente de e-mail não abre e o visitante some |
| Bloqueia em | confirmar que `.in` não está na blocklist do fornecedor | DNS do `nanj.in` sair do Hostinger | nada |

## Rota A — endpoint de terceiro

**Forma.** `POST` de JSON para `https://api.web3forms.com/submit` com um `access_key`
em campo oculto — "You do not need to hide the access key. Access key is public"
(https://docs.web3forms.com/getting-started/faq.md). Sem SDK, sem pacote: é `fetch`. É a
mesma forma do `prototype/track.js` — empurrar para um endpoint configurável sem nomear
fornecedor no código.

**Conta.** Basta um e-mail em https://web3forms.com/#start; a chave chega por e-mail.

**Armazenamento.** "We do not store any form submissions of our users. We process them
and forward to your email"; logs com dado pessoal apagados a cada 2 meses; **servidores
em US-East**, empresa sediada na Índia (mesma FAQ). O dado sai do Brasil e não fica com
o fornecedor — a retenção passa a ser a caixa do Outlook do Fernando.

**Limite grátis.** Comparações de 2026 dão **250 envios/mês**, 30 dias de histórico
(https://formtorch.com/compare/web3forms). **Não confirmei no primário** —
`web3forms.com/pricing` responde 403 a acesso automatizado, e Fernando deve abrir no
navegador antes de fechar. O Formspree grátis dá **50/mês**, pago a partir de US$ 15
(https://splitforms.com/formspree-free-plan-limits): para um portfólio 250 é folga, 50 é
apertado se um bot achar o endpoint.

**Spam.** Honeypot nativo: um `<input type="checkbox" name="botcheck">` oculto, e a API
descarta o envio se vier marcado. A própria doc avisa que "honeypot seems to be less
effective" e recomenda captcha; hCaptcha roda no plano grátis com a sitekey
compartilhada `50b2fe65-b00b-4b9e-ad62-3ba471098be2`. **Turnstile é grátis** (20
widgets, desafios ilimitados — https://developers.cloudflare.com/turnstile/plans/) mas
no Web3Forms é recurso Pro. Honeypot agora, captcha se chegar spam. Há ainda 429 por
IP, liberado em uma hora (mesma FAQ) — vale tratar como erro nomeado.

**Falha.** A API responde JSON com `success` booleano, então o estado de erro é
legível e a tela pode dizer, em português, que não enviou e mostrar o endereço. Isso é
o que o ticket exige.

**Um risco específico deste domínio.** A doc diz: "To prevent spam & abuse, we block
certain domains, sub-domains & LTDs by default. If your form works as expected in
localhost and not working in your custom domain website, please contact us with the
domain name to review" (https://docs.web3forms.com/getting-started/faq.md). `nanj.in` é
um domain hack de quatro letras em `.in` — exatamente o perfil que uma blocklist
genérica pega. Não dá para saber pela doc se `.in` está na lista, e o formato da falha é
o pior possível: funciona em localhost e não funciona em produção, que é o formulário
que finge enviar. Por isso o teste em produção vem **antes** da ADR, não depois.

## Rota B — endpoint próprio

**O Worker não resolve o e-mail.** A MailChannels encerrou a API gratuita para Workers
em 30/06/2024
(https://support.mailchannels.com/hc/en-us/articles/26814255454093-End-of-Life-Notice-Cloudflare-Workers).
O caminho atual é o **Cloudflare Email Service**, em beta pública desde abril de 2026
(https://blog.cloudflare.com/email-service/), ou um terceiro (Resend, Brevo, SendGrid).
**A rota "sem terceiro no caminho do dado" descrita no ticket não existe hoje.**

O que é grátis: "Sends to verified destination addresses are always free: they do not
count toward your monthly quota or your daily sending limits, on any plan"
(https://developers.cloudflare.com/email-service/platform/limits/) — que é justamente o
caso de um formulário de contato. Só que depende do domínio estar onboarded na
Cloudflare, e **`nanj.in` aponta hoje para `byte.dns-parking.com` /
`pixel.dns-parking.com` (Hostinger), sem MX**. Migrar o DNS é pré-requisito, não
detalhe. Fontes secundárias dizem que o serviço exige **Workers Paid, US$ 5/mês**, mais
US$ 0,35 por mil acima de 3.000/mês; **não confirmei no primário** — a página de limites
não menciona plano nem preço.

O Workers grátis dá 100.000 requisições/dia e 10 ms de CPU
(https://developers.cloudflare.com/workers/platform/limits/) — folgado. O custo é o
resto: conta Cloudflare, migração de DNS, `wrangler`, CORS, um segredo em produção,
spam por conta própria, e um serviço a mais que pode cair em silêncio. Um a dois dias,
contra duas ou três horas.

## Rota C — manter `mailto:`

Não é concorrente: é o **T-24**, e deve ser feito de qualquer jeito — o endereço
visível é a rota de falha do formulário, o que a tela mostra quando o envio falha.
Sozinha, mantém o buraco do ticket: quem usa webmail no celular não tem cliente de
e-mail para abrir. T-24 primeiro, formulário depois.

## LGPD — o que a decisão envolve

Não é aconselhamento jurídico; é o mapa do que precisa existir.

1. **Base legal.** Art. 7º, V — "execução de contrato ou de procedimentos preliminares
   relacionados a contrato do qual seja parte o titular, **a pedido do titular**" — cabe
   em quem escreve para tratar de vaga ou freela; art. 7º, IX (legítimo interesse) cobre
   o resto. **Consentimento não é a base aqui**, e é bom que não seja: não abre banner e
   não pré-julga a decisão pendente de analytics.
2. **Aviso no ponto de coleta** (art. 9º): finalidade, forma e duração, identificação e
   contato do controlador, uso compartilhado — uma linha dizendo *para quê*, *por quanto
   tempo*, *quem é o controlador*, *que o envio passa por um serviço nos EUA*.
3. **Transferência internacional** (art. 33). O inciso IX autoriza quando a operação
   atende ao art. 7º, V — que é o caso. Sem isso, seria preciso cláusulas-padrão
   (Resolução CD/ANPD nº 19/2024). Com a rota A, não é.
4. **Retenção** (art. 15, I): a finalidade acaba quando a conversa acaba. Como o
   fornecedor não guarda, a resposta é sobre a caixa de e-mail dele. Uma frase basta.
5. **Encarregado**: pessoa natural como controladora é agente de pequeno porte pela
   Resolução CD/ANPD nº 2/2022 e **não precisa nomear encarregado**, desde que ofereça
   um canal de comunicação com o titular — o e-mail que já está no CONTATO.

## O que Fernando precisa decidir e fornecer

- **A rota.** Nada começa antes.
- **Conferir no navegador** o limite grátis atual em `web3forms.com/pricing`.
- **A chave de acesso** do Web3Forms, gerada com o e-mail dele.
- **A linha de privacidade em PT-BR**, na voz dele — é texto do produto, não meu.
- **Confirmar `fernandolinck@outlook.com`** como destino.
- **Pré-requisito de segurança:** item 10 do `HANDOFF.md` — `www.nanj.in` sem
  certificado, redirecionando em HTTP puro. Postar nome e e-mail de estranho de uma
  página alcançável em HTTP limpo é pior que um `mailto:`. Não reabro a decisão; marco
  que ela virou pré-requisito.

## Próximo passo, se a recomendação for aceita

**Zero: um envio de teste real a partir de `nanj.in`**, com uma chave descartável e
nenhum código de formulário — só confirmar que a API aceita o domínio. Se responder 403,
pedir liberação ao suporte; se isso emperrar, a mesma forma serve para Formspree
(50/mês) ou Basin, e a decisão não muda, só o endpoint.

Depois, escrever a ADR — **"O formulário fala com um endpoint externo"** — que *estende* a
ADR-0004 e, ao fazê-lo, **enuncia a regra que a 0004 nunca escreveu**. Vale registrar:
o texto da ADR-0004 é sobre geometria procedural e "ships no binary assets"; a regra
"não adicione dependências" existe como *citação* dela no `HANDOFF.md` e no
`docs/analytics/README.md`, não no documento. A ADR nova é o lugar de dizer, em letra:
a regra proíbe **pacote**, e fornecedor em runtime custa uma decisão de LGPD, não uma
de bundle. Só depois disso o `layout: 'form'` entra em `modules.ts`.
