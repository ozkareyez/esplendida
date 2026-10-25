#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------
# Impresión directa a la impresora térmica, sin diálogo de PDF.
# Requiere Google Chrome/Chromium y la térmica como predeterminada.
#
# Usa un perfil de Chrome exclusivo para que --kiosk-printing se
# aplique aunque Chrome normal esté abierto.
#
# 1) Primera vez (configurar la térmica):
#      ./imprimir-facturas.sh --config
#    Inicia sesión, pulsa Imprimir una vez, elige la térmica,
#    desmarca "Encabezados y pies de página", márgenes "Ninguno"
#    y papel de 58 mm. Luego cancela o imprime una prueba y cierra
#    esa ventana de Chrome.
#
# 2) Uso normal (ya imprime sin preguntar):
#      ./imprimir-facturas.sh
#      ./imprimir-facturas.sh https://tu-dominio.com/admin/facturas
# ---------------------------------------------------------------

CONFIG=0
if [[ "${1:-}" == "--config" || "${1:-}" == "/config" ]]; then
  CONFIG=1
  shift
fi

APP_URL="${1:-http://localhost:3000/admin/facturas}"
PROFILE="${XDG_CONFIG_HOME:-$HOME/.config}/esplendida-chrome-impresion"
mkdir -p "$PROFILE"

BROWSER=""
for name in google-chrome google-chrome-stable chromium chromium-browser brave-browser; do
  if command -v "$name" >/dev/null 2>&1; then
    BROWSER="$(command -v "$name")"
    break
  fi
done

if [[ -z "$BROWSER" ]]; then
  echo "No se encontró Google Chrome ni Chromium."
  echo "Instálalo y vuelve a ejecutar este script."
  read -r -p "Pulsa Enter para cerrar..."
  exit 1
fi

ARGS=(
  "--user-data-dir=$PROFILE"
  "--no-first-run"
  "--no-default-browser-check"
  "--new-window"
)

if [[ "$CONFIG" -eq 0 ]]; then
  ARGS=("--kiosk-printing" "${ARGS[@]}")
fi

exec "$BROWSER" "${ARGS[@]}" "$APP_URL"
