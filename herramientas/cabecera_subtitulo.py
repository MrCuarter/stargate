#!/usr/bin/env python3
"""
STARGATE · Cambiar el SUBTÍTULO de una cabecera de formulario sin tocar el arte.

Las tres cabeceras (Bitácora, Ticket, Canje) son ilustraciones con el texto ya incrustado.
Cuando cambia una frase —«Cambia tus xp por ventajas» pasó a ser en créditos— no hace falta
regenerar la ilustración: se borra la línea vieja reconstruyendo el fondo y se escribe la nueva
con la tipografía de marca. Así la cabecera sigue siendo EXACTAMENTE la misma imagen, que es lo
que mantiene las tres coherentes entre sí.

    python3 herramientas/cabecera_subtitulo.py canje "Cambia tus créditos ◈ por ventajas"

El resultado se escribe al lado del original, con «_nuevo», para poder compararlos antes de
subirlo a la plantilla de Drive.
"""
import sys, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

AQUI   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FUENTE = os.path.join(AQUI, "assets", "fonts", "DMSans.ttf")
AMBAR  = (245, 176, 67)

# Medido sobre las cabeceras originales: dónde vive el subtítulo en cada una.
# [banda a limpiar (y0,y1,x0,x1), borde izquierdo, línea base]
CABECERAS = {
    "canje": dict(banda=(292, 340, 60, 540), izq=74, base=321),
}

def dilata(m, n=1):
    for _ in range(n):
        d = m.copy()
        d[1:, :] |= m[:-1, :]; d[:-1, :] |= m[1:, :]
        d[:, 1:] |= m[:, :-1]; d[:, :-1] |= m[:, 1:]
        m = d
    return m

def borra_texto(a, banda):
    """Reconstruye el fondo donde estaba el texto ámbar, difundiendo desde los bordes."""
    y0, y1, x0, x1 = banda
    sub = a[y0:y1, x0:x1].copy()
    R, G, B = sub[:, :, 0], sub[:, :, 1], sub[:, :, 2]
    m = dilata((R > 120) & (R - B > 40) & (G > 70), 2)   # el ámbar, con su halo
    work = sub.copy(); work[m] = np.nan
    for _ in range(600):
        hueco = np.isnan(work[:, :, 0])
        if not hueco.any(): break
        acc = np.zeros_like(work); cnt = np.zeros(work.shape[:2])
        for dy, dx in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)):
            v = np.roll(work, (dy, dx), axis=(0, 1))
            ok = ~np.isnan(v[:, :, 0])
            acc[ok] += v[ok]; cnt[ok] += 1
        # 🔴 solo donde HAY vecino válido: rellenar el resto deja un fantasma negro con la
        # forma exacta de las letras, que es peor que no haber borrado nada.
        fill = hueco & (cnt > 0)
        work[fill] = acc[fill] / cnt[fill][:, None]
    ent = lambda x: Image.fromarray(np.clip(x, 0, 255).astype(np.uint8))
    suave = np.asarray(ent(work).filter(ImageFilter.GaussianBlur(1.6))).astype(float)
    peso  = np.asarray(Image.fromarray((m * 255).astype(np.uint8))
                       .filter(ImageFilter.GaussianBlur(1.6))).astype(float) / 255.0
    a[y0:y1, x0:x1] = work * (1 - peso[:, :, None]) + suave * peso[:, :, None]
    return a

def rombo(alto):
    """El ◈ de los créditos. DM Sans no lo trae, así que se dibuja a 4x y se reduce."""
    ancho, S = alto * 0.86, 4
    lz = Image.new("RGBA", (int(ancho * S) + 8, int(alto * S) + 8), (0, 0, 0, 0))
    d = ImageDraw.Draw(lz); w, h = lz.size
    mx, my, rx, ry = w / 2, h / 2, ancho * S / 2 - 2, alto * S / 2 - 2
    d.polygon([(mx, my-ry), (mx+rx, my), (mx, my+ry), (mx-rx, my)], outline=AMBAR + (255,), width=int(1.6*S))
    k = 0.38
    d.polygon([(mx, my-ry*k), (mx+rx*k, my), (mx, my+ry*k), (mx-rx*k, my)], fill=AMBAR + (255,))
    return lz.resize((int(w / S), int(h / S)), Image.LANCZOS)

def escribe(im, txt, izq, base, tam=24):
    f = ImageFont.truetype(FUENTE, tam)
    capa = f.getbbox("C")[3]
    d = ImageDraw.Draw(im)
    partes = txt.split("◈")
    x = izq
    for i, p in enumerate(partes):
        if i:
            r = rombo(15.0)
            im.paste(r, (int(x + 3), int(base - capa / 2.0 - 1 - r.size[1] / 2)), r)
            x += r.size[0] + 6
        d.text((x, base - capa), p, font=f, fill=AMBAR)
        x += d.textlength(p, font=f)
    return im

def main():
    if len(sys.argv) < 3:
        print(__doc__); sys.exit(1)
    cual, texto = sys.argv[1], sys.argv[2]
    if cual not in CABECERAS:
        print("No tengo medida la cabecera «%s». Las que sé: %s" % (cual, ", ".join(CABECERAS)))
        sys.exit(1)
    cfg = CABECERAS[cual]
    src = os.path.join(AQUI, "assets", "img", "forms", "cabecera_%s.jpg" % cual)
    a = np.asarray(Image.open(src).convert("RGB")).astype(float)
    im = Image.fromarray(np.clip(borra_texto(a, cfg["banda"]), 0, 255).astype(np.uint8))
    im = escribe(im, texto, cfg["izq"], cfg["base"])
    dst = src.replace(".jpg", "_nuevo.jpg")
    im.save(dst, quality=92)
    print("escrito: %s  (%dx%d)" % (dst, im.size[0], im.size[1]))
    print("Compáralo con el original y, si cuadra, súbelo a la plantilla de Drive.")

if __name__ == "__main__":
    main()
