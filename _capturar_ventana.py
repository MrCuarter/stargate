# -*- coding: utf-8 -*-
"""Captura la ventana de Chrome y recorta el navegador, dejando solo la pagina.

    python3 _capturar_ventana.py <window_id> <alto_barra_pt> <destino.png> [--completa]

Se usa para las capturas que NINGUN script puede sacar por su cuenta: las que viven dentro de la
hoja maestra, con la sesion de mutecdgami. Claude conduce Chrome con la extension, y esto retrata
la ventana y le quita la barra de pestañas y la de direcciones — que llevan dentro las OTRAS
pestañas del usuario, y esas no tienen por que salir en una guia.

`alto_barra_pt` = altura de la ventana MENOS window.innerHeight, en puntos. Se calcula en vivo
(no se escribe a mano) porque cambia con la barra de marcadores, los avisos de Chrome, etc.
"""
import subprocess, sys, tempfile, os
from PIL import Image

def main():
    if len(sys.argv) < 4:
        raise SystemExit(__doc__)
    wid, barra, destino = sys.argv[1], float(sys.argv[2]), sys.argv[3]
    completa = "--completa" in sys.argv
    tmp = tempfile.mktemp(suffix=".png")
    r = subprocess.run(["screencapture", "-x", "-o", "-l", str(wid), "-t", "png", tmp],
                       capture_output=True, text=True)
    if not os.path.exists(tmp) or os.path.getsize(tmp) < 5000:
        raise SystemExit("🔴 no se ha podido capturar la ventana %s: %s" % (wid, r.stderr.strip()))
    im = Image.open(tmp)
    if not completa:
        # la captura viene a 2x (retina): los puntos se multiplican por la escala real
        escala = im.width / 1728.0 if im.width > 2000 else 1.0
        corte = int(round(barra * escala))
        im = im.crop((0, corte, im.width, im.height))
    os.makedirs(os.path.dirname(os.path.abspath(destino)), exist_ok=True)
    im.save(destino)
    os.unlink(tmp)
    print("%s  %dx%d  %d KB" % (os.path.basename(destino), im.width, im.height,
                                os.path.getsize(destino) // 1024))

if __name__ == "__main__":
    main()
