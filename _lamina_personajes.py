#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Compone assets/img/avatares/lamina_personajes.jpg desde las piezas de evo/.

Existe porque la lámina llevaba el texto QUEMADO en la imagen: cuando el 27-ago los siete
personajes pasaron a estar disponibles desde el principio, la lámina siguió diciendo «los 5-7 son
EXCLUSIVOS (se desbloquean con xp)» — y es lo primero que ve el alumnado al alistarse.

Ahora se genera, y los umbrales de rango salen de _site_data.py: si mañana cambian los niveles,
la lámina se rehace sola y no vuelve a mentir.

    python3 _lamina_personajes.py
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from _site_data import NIVELES, RANGOS   # noqa: E402

EVO = os.path.join(HERE, "assets", "img", "avatares", "evo")
FUENTES = os.path.join(HERE, "assets", "fonts")
SALIDA = os.path.join(HERE, "assets", "img", "avatares", "lamina_personajes.jpg")

PERSONAJES = 7
FONDO = (10, 16, 26)
TEAL = (55, 182, 198)
AMBAR = (245, 176, 67)
TINTA = (22, 32, 44)
TEXTO = (223, 232, 238)
APAG = (139, 160, 175)

COL, GAP, MARGEN = 200, 12, 14
RETRATO, TIRA = 200, 42
CABECERA, ETIQ, PIE = 46, 30, 34


def fuente(nombre, tam):
    try:
        return ImageFont.truetype(os.path.join(FUENTES, nombre), tam)
    except Exception:
        return ImageFont.load_default()


def umbrales():
    """[(rango, xp en que se entra)] leído de NIVELES: el arte cambia cuando cambia la columna 3."""
    out, visto = [], None
    for n, xp, r, _t in NIVELES:
        if r != visto:
            out.append((RANGOS[r - 1], xp))
            visto = r
    return out


def etiqueta(d, x, y, texto, f, fondo, color=(10, 16, 26)):
    izq, arr, der, aba = d.textbbox((0, 0), texto, font=f)
    w, h = der - izq, aba - arr
    d.rounded_rectangle((x, y, x + w + 18, y + h + 11), radius=7, fill=fondo)
    d.text((x + 9 - izq, y + 5 - arr), texto, font=f, fill=color)
    return w + 18


def main():
    ancho = MARGEN * 2 + PERSONAJES * COL + (PERSONAJES - 1) * GAP
    fila = ETIQ + 6 + RETRATO + 4 + TIRA
    alto = CABECERA + fila * 2 + GAP + PIE + MARGEN
    im = Image.new("RGB", (ancho, alto), FONDO)
    d = ImageDraw.Draw(im)

    f_tit = fuente("Unbounded.ttf", 21)
    f_etq = fuente("DMSans.ttf", 17)
    f_pie = fuente("DMSans.ttf", 15)

    # cabecera. 🔴 Ya no dice que 5-7 sean exclusivos: los siete están disponibles al alistarse.
    x = MARGEN
    d.text((x, 14), "ELIGE TU PERSONAJE", font=f_tit, fill=TEAL)
    ancho_tit = d.textlength("ELIGE TU PERSONAJE", font=f_tit)
    d.text((x + ancho_tit + 12, 18),
           "· los siete, disponibles desde el primer día · tu personaje no cambia: cambia su aspecto al subir de nivel",
           font=f_pie, fill=APAG)

    for j, sexo in enumerate(("f", "m")):
        arriba = CABECERA + j * (fila + GAP // 2)
        for i in range(1, PERSONAJES + 1):
            x = MARGEN + (i - 1) * (COL + GAP)
            variante = ("modelo A" if sexo == "f" else "modelo B") if i == 5 else ("ella" if sexo == "f" else "él")
            etiqueta(d, x, arriba, "%d · %s" % (i, variante), f_etq, AMBAR)
            # retrato del primer rango
            base = os.path.join(EVO, "p%d%s_r1.jpg" % (i, sexo))
            im.paste(Image.open(base).resize((RETRATO, RETRATO), Image.LANCZOS), (x, arriba + ETIQ + 6))
            # y la tira de los cinco rangos
            ancho_min = (COL - 4 * 3) // 5
            for r in range(1, 6):
                mini = Image.open(os.path.join(EVO, "p%d%s_r%d.jpg" % (i, sexo, r)))
                mini = mini.resize((ancho_min, TIRA), Image.LANCZOS)
                im.paste(mini, (x + (r - 1) * (ancho_min + 3), arriba + ETIQ + 6 + RETRATO + 4))

    pie = "Rangos por xp: " + " → ".join(
        (r if xp == 0 else "%s (%s)" % (r, "{:,}".format(xp).replace(",", "."))) for r, xp in umbrales())
    d.text((MARGEN, alto - PIE + 4), pie + ", el viaje completo", font=f_pie, fill=APAG)

    im.save(SALIDA, "JPEG", quality=88, optimize=True)
    print("lamina: %s · %dx%d · %.0f KB · %d personajes"
          % (os.path.basename(SALIDA), im.width, im.height,
             os.path.getsize(SALIDA) / 1024, PERSONAJES))


if __name__ == "__main__":
    main()
