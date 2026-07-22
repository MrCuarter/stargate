#!/usr/bin/env bash
# Sube una imagen (o varias) al repo público y te devuelve su URL de CDN estable.
#
#   ./subir-imagen.sh  imagen.png  [subcarpeta]
#   ./subir-imagen.sh  *.png       geniallys
#
# Copia el/los archivo(s) a  media/[subcarpeta]/ , hace commit y push, e imprime
# la URL de jsDelivr lista para pegar en Genially, el tablero de puntos, etc.
set -euo pipefail
REPO="MrCuarter/stargate"; BRANCH="main"
CDN="https://cdn.jsdelivr.net/gh/${REPO}@${BRANCH}"
cd "$(dirname "$0")"

if [ "$#" -lt 1 ]; then
  echo "Uso: $0 <imagen> [subcarpeta]"; exit 1
fi

# El último argumento es subcarpeta solo si NO es un archivo existente.
SUB=""
ARGS=("$@")
last="${ARGS[${#ARGS[@]}-1]}"
if [ ! -e "$last" ] && [ "${#ARGS[@]}" -ge 2 ]; then
  SUB="$last"; unset 'ARGS[${#ARGS[@]}-1]'
fi
DEST="media${SUB:+/$SUB}"
mkdir -p "$DEST"

URLS=()
for f in "${ARGS[@]}"; do
  [ -f "$f" ] || { echo "⚠️  no existe: $f"; continue; }
  base="$(basename "$f")"
  # normaliza espacios en el nombre para URLs limpias
  clean="$(echo "$base" | tr ' ' '_')"
  cp "$f" "$DEST/$clean"
  URLS+=("$CDN/$DEST/$clean")
done

git add -A
git -c commit.gpgsign=false commit -q -m "media: sube $(printf '%s ' "${ARGS[@]}")" || { echo "Nada que commitear."; }
git push -q origin "$BRANCH"

echo ""
echo "✅ Subido. URLs (jsDelivr CDN):"
for u in "${URLS[@]}"; do echo "   $u"; done
echo ""
echo "ℹ️  jsDelivr cachea ~12 h; la primera carga puede tardar unos segundos."
