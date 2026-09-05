#!/usr/bin/env bash
# Abre uma bancada do Tenebrae no Chrome dedicado, **reaproveitando a aba**.
#
# Por que existe: as tres vistas rodam na mesma origem e por muito tempo tinham o mesmo
# titulo, entao uma janela com cinco abas era ilegivel. Pior, cada "abrir" criava uma
# janela nova no fundo da pilha em vez de levantar a que ja estava lá — e a instancia
# dedicada acumulou abas de outras coisas, o que tornou impossivel achar a certa.
#
# Este script faz o contrario: procura uma aba do projeto entre TODAS as janelas,
# aponta ela para a vista pedida e traz para a frente. Janela nova so se nao houver
# nenhuma. O titulo da aba passou a dizer qual bancada e — ver o bloco de VISTAS em
# `prototype/scene.js`.
#
#   ./abrir.sh            # ?trilho, o padrao
#   ./abrir.sh sala
#   ./abrir.sh film
#   ./abrir.sh ''         # o site, sem bancada

set -euo pipefail

VISTA="${1-trilho}"
PORTA="${PORTA:-5174}"
PERFIL="$HOME/.chrome-tenebrae"
URL="http://localhost:${PORTA}/"
[ -n "$VISTA" ] && URL="${URL}?${VISTA}"

if ! curl -fsS -o /dev/null --max-time 3 "http://localhost:${PORTA}/"; then
  echo "O dev server nao esta em pe na porta ${PORTA}."
  echo "  npm run prototype"
  exit 1
fi

# Levantar a aba existente. Janelas sem abas (paineis, downloads) fazem o Chrome
# devolver erro de indice, por isso cada acesso vai dentro de um `try`.
RES=$(osascript <<EOF
tell application "Google Chrome"
  set alvo to missing value
  set idx to 0
  repeat with wi from 1 to (count of windows)
    set w to window wi
    try
      repeat with i from 1 to (count of tabs of w)
        try
          if (URL of tab i of w) contains "localhost:${PORTA}" then
            set alvo to w
            set idx to i
          end if
        end try
      end repeat
    end try
  end repeat
  if alvo is missing value then return "SEM_ABA"
  set URL of tab idx of alvo to "${URL}"
  set active tab index of alvo to idx
  set index of alvo to 1
  activate
  return "REUSADA"
end tell
EOF
)

if [ "$RES" = "SEM_ABA" ]; then
  open -na "Google Chrome" --args \
    --user-data-dir="$PERFIL" \
    --window-size=1560,1000 --window-position=20,30 --new-window "$URL"
  echo "janela nova: $URL"
else
  echo "aba reaproveitada e levantada: $URL"
fi
