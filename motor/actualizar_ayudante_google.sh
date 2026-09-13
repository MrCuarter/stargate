#!/bin/bash
# Copia el ayudante oficial de Google para iniciar sesión (Firebase Auth) desde el dominio de
# Firebase del proyecto a __/auth/ y __/firebase/ de esta web. Es lo que permite que la ventana de
# Google diga «stargate.mistercuarter.es». Lánzalo si algún día Firebase cambia su ayudante:
#   bash motor/actualizar_ayudante_google.sh && git add __ && git commit -m "Ayudante de Google al día" && git push
set -e
cd "$(dirname "$0")/.."
ORIGEN="https://gamificapro-99e0a.firebaseapp.com"
for f in handler handler.js experiments.js iframe iframe.js; do
  curl -fsS -o "__/auth/$f" "$ORIGEN/__/auth/$f"
done
curl -fsS -o "__/firebase/init.json" "$ORIGEN/__/firebase/init.json"
grep -q "handler.js" __/auth/handler && echo "✓ ayudante de Google copiado en __/auth/"
