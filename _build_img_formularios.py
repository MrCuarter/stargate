#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
STARGATE · genera las imágenes de los TRES formularios (Bitácora, Ticket y Canje).

Dos familias, y la diferencia importa:

  A) MONTAJES con el arte que ya existe (`montaje_*`). Se usan para las recompensas cosméticas y
     para los héroes. 🔴 LO QUE SE ENSEÑA ES LO QUE SE RECIBE: el marco dorado, el fondo de planeta
     y el título son cambios REALES en la ficha de la Nave, así que la ficha de ejemplo se monta con
     el MISMO avatar, el MISMO planeta y las MISMAS fuentes que usa la Nave. Si se ilustraran con
     arte inventado, el ejemplo prometería algo más bonito que la recompensa. Las siluetas de héroe
     bloqueado ya estaban dibujadas: son «el héroe en sombra con un interrogante» que pidió Norberto.

  B) ARTE GENERADO en Magnific (`arte_*`), para lo que no tenía imagen de partida: el sobre de cromos
     y las cuatro recompensas que tocan la nota. Los .jpg en bruto viven en assets/img/canje/_raw/ y
     aquí solo se les pone el rótulo, para que TODA la serie comparta tipografía y tratamiento.
     🔴 STARGATE se genera SIEMPRE con Magnific: es la cuenta de la universidad.

  C) ESCENAS DE SECCIÓN (`escena`): el Capitán y NEBULA presentan cada tramo de los formularios, con
     los recortes que ya existen en assets/img/capitan/ y assets/img/personajes/.

El texto va SIEMPRE aquí y nunca dentro del prompt: los modelos destrozan las letras, y así el
rótulo sale en Unbounded/DM Sans como el resto de la marca.

    python3 _build_img_formularios.py

Salida: assets/img/canje/*.jpg (recompensas) y assets/img/forms/sec_*.jpg (secciones), a 1280x720.
En el formulario se muestran a 640 de ancho.
"""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(AQUI, "assets", "img")
OUT = os.path.join(IMG, "canje")
FONTS = os.path.join(AQUI, "assets", "fonts")

W, H = 1280, 720

# Paleta muestreada de assets/img/forms/cabecera_canje_nuevo.jpg: es la cabecera real del
# formulario, así que la imagen de cada recompensa cae debajo sin desentonar.
CIAN = (102, 228, 243)
AMBAR = (240, 194, 108)
NOCHE = (7, 14, 22)
BLANCO = (255, 255, 255)


def fuente(nombre, px):
    return ImageFont.truetype(os.path.join(FONTS, nombre), px)


def fondo():
    """El campo de estrellas real de la Nave, oscurecido para que el contenido se lea encima."""
    f = Image.open(os.path.join(IMG, "nave", "fondo_universo.jpg")).convert("RGB")
    # recorte centrado a 16:9 sin deformar
    escala = max(W / f.width, H / f.height)
    f = f.resize((int(f.width * escala), int(f.height * escala)), Image.LANCZOS)
    izq, arr = (f.width - W) // 2, (f.height - H) // 2
    f = f.crop((izq, arr, izq + W, arr + H))
    velo = Image.new("RGB", (W, H), NOCHE)
    return Image.blend(f, velo, 0.62)


def circular(im, diam):
    """Recorta una imagen cuadrada en círculo (los avatares de la Nave son redondos)."""
    im = im.convert("RGBA").resize((diam, diam), Image.LANCZOS)
    mask = Image.new("L", (diam * 4, diam * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, diam * 4, diam * 4), fill=255)
    im.putalpha(mask.resize((diam, diam), Image.LANCZOS))
    return im


def resplandor(capa, caja, color, radio=26, fuerza=150):
    """Halo difuminado detrás de un elemento; el mismo recurso que usa el arte de los héroes."""
    g = Image.new("RGBA", capa.size, (0, 0, 0, 0))
    ImageDraw.Draw(g).ellipse(caja, fill=color + (fuerza,))
    capa.alpha_composite(g.filter(ImageFilter.GaussianBlur(radio)))


def titular(d, texto, y, color=BLANCO, px=46, fnt="Unbounded.ttf"):
    f = fuente(fnt, px)
    an = d.textbbox((0, 0), texto, font=f)[2]
    d.text(((W - an) // 2, y), texto, font=f, fill=color)
    return an


def pie(d, texto, y, color=AMBAR, px=27):
    f = fuente("DMSans.ttf", px)
    an = d.textbbox((0, 0), texto, font=f)[2]
    d.text(((W - an) // 2, y), texto, font=f, fill=color)


# ─────────────────────────── la ficha de la Nave ───────────────────────────
# Las tres recompensas cosméticas (título, fondo y marco) cambian ESTA tarjeta. Se dibuja una vez
# y cada imagen enciende su mejora: así se ve que es la misma ficha con una cosa distinta.
def ficha(base, cx, cy, avatar="p3f_r4.jpg", alias="NOVA", titulo=None, planeta=None, marco=False):
    # La tarjeta se ajusta a lo que lleva dentro: con título es más alta. Si se deja fija, la
    # versión sin título queda con un palmo de hueco muerto debajo del nivel.
    an = 420
    al = 470 if titulo else 418
    caja = (cx - an // 2, cy - al // 2, cx + an // 2, cy + al // 2)
    capa = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(capa)
    d.rounded_rectangle(caja, 26, fill=(12, 22, 34, 232), outline=CIAN + (70,), width=2)

    if planeta:
        # 🔴 El planeta tiene que VERSE: esta imagen existe para enseñar la diferencia con la ficha
        # normal. Se pega el orbe grande detrás del avatar y se recorta a la tarjeta con una máscara
        # propia (componer por alfa sobre el relleno oscuro lo dejaba invisible).
        p = Image.open(os.path.join(IMG, "planetas", planeta)).convert("RGBA")
        lado = int(an * 0.74)          # entra ENTERO en la tarjeta: cortado por abajo parecía un fallo
        p = p.resize((lado, lado), Image.LANCZOS)
        lienzo = Image.new("RGBA", (an, al), (0, 0, 0, 0))
        lienzo.paste(p, ((an - lado) // 2, 78), p)   # centrado tras el avatar, que va en y=44+210/2
        alfa = lienzo.getchannel("A").point(lambda v: int(v * 0.9))
        recorte = Image.new("L", (an, al), 0)
        ImageDraw.Draw(recorte).rounded_rectangle((0, 0, an - 1, al - 1), 26, fill=255)
        lienzo.putalpha(Image.composite(alfa, Image.new("L", (an, al), 0), recorte))
        capa.alpha_composite(lienzo, (caja[0], caja[1]))
        # Velo en DEGRADADO bajo el texto. Con un rectángulo plano quedaba una costura recta
        # cruzando el orbe, que es justo lo que delata un montaje.
        hv = 190
        rampa = Image.linear_gradient("L").resize((1, hv)).resize((an, hv))
        velo = Image.new("RGBA", (an, hv), (10, 18, 28, 255))
        mvelo = Image.new("L", (an, hv), 0)
        ImageDraw.Draw(mvelo).rounded_rectangle((0, -60, an - 1, hv - 1), 26, fill=255)
        velo.putalpha(Image.composite(rampa.point(lambda v: int(v * 0.82)), Image.new("L", (an, hv), 0), mvelo))
        capa.alpha_composite(velo, (caja[0], caja[3] - hv))
        d = ImageDraw.Draw(capa)
        d.rounded_rectangle(caja, 26, outline=CIAN + (140,), width=2)

    # el avatar, con marco dorado si la recompensa es esa
    diam = 210
    ax, ay = cx - diam // 2, caja[1] + 44
    if marco:
        resplandor(capa, (ax - 30, ay - 30, ax + diam + 30, ay + diam + 30), AMBAR, 30, 130)
    av = circular(Image.open(os.path.join(IMG, "avatares", "evo", avatar)), diam)
    capa.alpha_composite(av, (ax, ay))
    d2 = ImageDraw.Draw(capa)
    if marco:
        d2.ellipse((ax - 9, ay - 9, ax + diam + 9, ay + diam + 9), outline=AMBAR, width=9)
        d2.ellipse((ax - 2, ay - 2, ax + diam + 2, ay + diam + 2), outline=(255, 238, 190), width=2)
    else:
        d2.ellipse((ax - 4, ay - 4, ax + diam + 4, ay + diam + 4), outline=CIAN + (150,), width=4)

    # alias y, si toca, el título narrativo debajo
    fa = fuente("Unbounded.ttf", 40)
    aa = d2.textbbox((0, 0), alias, font=fa)[2]
    ty = ay + diam + 30
    d2.text((cx - aa // 2, ty), alias, font=fa, fill=BLANCO)
    ty += 54
    if titulo:
        ft = fuente("DMSans-Italic.ttf", 27)
        at = d2.textbbox((0, 0), titulo, font=ft)[2]
        d2.rounded_rectangle((cx - at // 2 - 16, ty - 6, cx + at // 2 + 16, ty + 40), 16,
                             fill=(240, 194, 108, 38), outline=AMBAR + (190,), width=2)
        d2.text((cx - at // 2, ty), titulo, font=ft, fill=AMBAR)
        ty += 52
    fn = fuente("DMSans.ttf", 23)
    txt = "Nivel 6 · 1.240 xp"
    at = d2.textbbox((0, 0), txt, font=fn)[2]
    d2.text((cx - at // 2, ty + 2), txt, font=fn, fill=(150, 170, 185))
    base.alpha_composite(capa)


def guardar(im, nombre, carpeta=None):
    # 🔴 JPG y no PNG a propósito. Son ilustraciones fotográficas sin transparencia, y CADA UNA la
    # descarga Apps Script al montar los formularios: en PNG pesaban ~850 KB (13 MB en total) y eso
    # es exactamente lo que consume el presupuesto de 6 minutos que ya reventó dos veces el 30-ago.
    # En JPG bajan a ~150 KB sin diferencia visible a los 640 px a los que se muestran.
    destino = os.path.join(IMG, carpeta) if carpeta else OUT
    os.makedirs(destino, exist_ok=True)
    ruta = os.path.join(destino, nombre)
    im.convert("RGB").save(ruta, "JPEG", quality=88, optimize=True, progressive=True)
    print("  ✓ %-22s %s KB" % (nombre, os.path.getsize(ruta) // 1024))


# ─────────────────────────── 1 · Héroe de la Rebelión ───────────────────────────
def heroe():
    """Tres siluetas y un interrogante: no sabes cuál de los 30 te va a tocar."""
    base = fondo().convert("RGBA")
    # tres rangos distintos para que se vea que el sorteo es entre figuras diferentes
    for i, (arch, x, diam, op) in enumerate([
            ("H09_pregonero_bloqueado.jpg", 300, 300, 170),
            ("H01_custodio_bloqueado.jpg", 640, 380, 255),
            ("H15_croupier_bloqueado.jpg", 980, 300, 170)]):
        h = Image.open(os.path.join(IMG, "heroes", arch)).convert("RGBA")
        h = h.resize((diam, diam), Image.LANCZOS)
        mask = Image.new("L", (diam * 4, diam * 4), 0)
        ImageDraw.Draw(mask).ellipse((0, 0, diam * 4, diam * 4), fill=255)
        h.putalpha(Image.eval(mask.resize((diam, diam), Image.LANCZOS), lambda v: v * op // 255))
        base.alpha_composite(h, (x - diam // 2, 210 - diam // 2 + (0 if i == 1 else 20)))

    capa = Image.new("RGBA", base.size, (0, 0, 0, 0))
    resplandor(capa, (560, 130, 720, 290), CIAN, 34, 120)
    base.alpha_composite(capa)
    d = ImageDraw.Draw(base)
    fq = fuente("Unbounded.ttf", 190)
    aq = d.textbbox((0, 0), "?", font=fq)
    d.text((640 - (aq[2] - aq[0]) // 2 - aq[0], 118), "?", font=fq, fill=CIAN)

    titular(d, "Un héroe AL AZAR de los 30", 430)
    pie(d, "Resistencia 56 %   ·   Vanguardia 36 %   ·   MITO 8 %", 508)
    pie(d, "Se acumulan: cuantos más tengas, más donde elegir en tu vestuario", 556, (150, 170, 185), 25)
    guardar(base, "heroe.jpg")


# ─────────────────────────── 2 · Cambiar 3 repetidos ───────────────────────────
def repetidos():
    """Tres cartas iguales entran, una carta nueva sale. Gratis."""
    base = fondo().convert("RGBA")
    carta = Image.open(os.path.join(IMG, "tarjetas", "P1_bran_carta.png")).convert("RGBA")
    alto = 330
    c = carta.resize((int(carta.width * alto / carta.height), alto), Image.LANCZOS)
    for i, (x, ang) in enumerate([(215, 11), (295, 0), (375, -11)]):
        g = c.rotate(ang, expand=True, resample=Image.BICUBIC)
        base.alpha_composite(g, (x - g.width // 2, 210 - g.height // 2))

    d = ImageDraw.Draw(base)
    fa = fuente("Unbounded.ttf", 92)
    d.text((590, 165), "→", font=fa, fill=AMBAR)

    # la carta que sale: tapada, con interrogante (es al azar)
    tapada = Image.new("RGBA", c.size, (0, 0, 0, 0))
    dt = ImageDraw.Draw(tapada)
    dt.rounded_rectangle((0, 0, c.width - 1, c.height - 1), 18, fill=(14, 26, 40, 245), outline=CIAN + (170,), width=3)
    fq = fuente("Unbounded.ttf", 120)
    q = dt.textbbox((0, 0), "?", font=fq)
    dt.text(((c.width - (q[2] - q[0])) // 2 - q[0], c.height // 2 - 92), "?", font=fq, fill=CIAN)
    base.alpha_composite(tapada, (900 - c.width // 2, 210 - c.height // 2))

    titular(d, "3 repetidas  →  una carta nueva", 430)
    pie(d, "GRATIS · no cuesta créditos", 508)
    pie(d, "Si no llegas a 3 repetidas, se te avisa y no pierdes nada", 556, (150, 170, 185), 25)
    guardar(base, "repetidos.jpg")


# ─────────────────────────── 3, 4 y 5 · las cosméticas ───────────────────────────
def titulo():
    base = fondo().convert("RGBA")
    ficha(base, 640, 300, titulo="La que no se rinde")
    d = ImageDraw.Draw(base)
    titular(d, "Tu título, bajo tu alias", 566)
    pie(d, "Se ve en el tablero y en la Nave · lo eliges tú en el formulario", 632, px=25)
    guardar(base, "titulo.jpg")


def planeta():
    base = fondo().convert("RGBA")
    ficha(base, 640, 300, planeta="p6_ludo.png")
    d = ImageDraw.Draw(base)
    titular(d, "Tu ficha, con tu planeta detrás", 566)
    pie(d, "Eliges cuál de los 8 · se aplica solo, sin esperar a nadie", 632, px=25)
    guardar(base, "planeta.jpg")


def marco():
    base = fondo().convert("RGBA")
    ficha(base, 640, 300, marco=True)
    d = ImageDraw.Draw(base)
    titular(d, "Marco dorado en tu avatar", 566)
    pie(d, "En la Nave y en el ranking · que se note quién eres", 632, px=25)
    guardar(base, "marco.jpg")


# ═══════════════════ B · el arte generado en Magnific, rotulado aquí ═══════════════════
RAW = os.path.join(OUT, "_raw")


def arte(bruto, titulo, subtitulo, salida, carpeta=None):
    """Coge el .jpg de Magnific, lo baja a 1280x720 y le pone el rótulo de la casa.

    El degradado inferior no es decoración: el arte llega con el motivo centrado y sin él los
    títulos caen sobre zonas claras y dejan de leerse."""
    im = Image.open(os.path.join(RAW, bruto + ".jpg")).convert("RGB")
    escala = max(W / im.width, H / im.height)
    im = im.resize((int(im.width * escala), int(im.height * escala)), Image.LANCZOS)
    izq, arr = (im.width - W) // 2, (im.height - H) // 2
    base = im.crop((izq, arr, izq + W, arr + H)).convert("RGBA")

    hv = 300
    rampa = Image.linear_gradient("L").resize((1, hv)).resize((W, hv))
    velo = Image.new("RGBA", (W, hv), (6, 12, 19, 255))
    velo.putalpha(rampa.point(lambda v: int(v * 0.93)))
    base.alpha_composite(velo, (0, H - hv))

    d = ImageDraw.Draw(base)
    titular(d, titulo, 500)
    pie(d, subtitulo, 578, px=26)
    guardar(base, salida, carpeta)


# ═══════════════════ C · el Capitán y NEBULA presentan cada sección ═══════════════════
def escena(personaje, titulo, subtitulo, salida, izquierda=True, alto=620, carpeta="forms"):
    """Banner de sección: el personaje a un lado y el texto al otro.

    Los recortes ya existen y son los MISMOS que ve el alumnado en la web y en los vídeos: que el
    Capitán presente el alistamiento y NEBULA el ticket ata el formulario al relato en vez de
    dejarlo como un trámite suelto."""
    base = fondo().convert("RGBA")
    pj = Image.open(os.path.join(IMG, personaje)).convert("RGBA")
    an = int(pj.width * alto / pj.height)
    pj = pj.resize((an, alto), Image.LANCZOS)
    px = 70 if izquierda else W - an - 70
    # halo detrás para despegarlo del campo de estrellas
    capa = Image.new("RGBA", base.size, (0, 0, 0, 0))
    resplandor(capa, (px - 40, H - alto - 30, px + an + 40, H + 60), CIAN, 60, 62)
    base.alpha_composite(capa)
    base.alpha_composite(pj, (px, H - alto))

    # el texto ocupa el lado libre
    zx0 = px + an + 50 if izquierda else 60
    zx1 = W - 60 if izquierda else px - 50
    d = ImageDraw.Draw(base)
    y = 210
    for linea, fnt, px_, col in envolver(d, titulo, zx1 - zx0, 44, "Unbounded.ttf", BLANCO):
        d.text((zx0, y), linea, font=fnt, fill=col); y += px_ + 14
    y += 16
    for linea, fnt, px_, col in envolver(d, subtitulo, zx1 - zx0, 27, "DMSans.ttf", AMBAR):
        d.text((zx0, y), linea, font=fnt, fill=col); y += px_ + 10
    guardar(base, salida, carpeta)


def envolver(d, texto, ancho, px, fnt, color):
    """Parte un texto en líneas que quepan en `ancho`. Sin esto, un título largo se sale del lienzo
    y no hay forma de verlo hasta que la imagen ya está en el formulario."""
    f = fuente(fnt, px)
    lineas, actual = [], ""
    for palabra in texto.split():
        prueba = (actual + " " + palabra).strip()
        if d.textbbox((0, 0), prueba, font=f)[2] <= ancho or not actual:
            actual = prueba
        else:
            lineas.append(actual); actual = palabra
    if actual:
        lineas.append(actual)
    return [(l, f, px, color) for l in lineas]


if __name__ == "__main__":
    print("Imágenes de los formularios →", IMG)

    print("\n· CANJE · montajes con el arte que ya existe")
    heroe()
    repetidos()
    titulo()
    planeta()
    marco()

    print("\n· CANJE · arte de Magnific, rotulado aquí")
    arte("sobre", "Un sobre de cromos", "Una carta al azar de las 20 · se abre sola en tu Nave", "sobre.jpg")
    arte("nota_05", "Media décima más", "Sube 0,5 en el entregable que tú elijas", "nota_05.jpg")
    arte("nota_1punto", "Un punto entero", "Sube 1 punto en el entregable que tú elijas", "nota_1punto.jpg")
    arte("nota_plazo", "El plazo se reabre", "Se recalifica un trabajo que entregaste tarde", "nota_plazo.jpg")
    arte("nota_suspenso", "Una segunda oportunidad", "Se recalifica un trabajo suspenso", "nota_suspenso.jpg")

    print("\n· SECCIONES · el Capitán y NEBULA presentan")
    escena("capitan/saluda.png", "Bienvenido a bordo",
           "Este formulario es UNO SOLO y sirve para dos cosas: alistarte la primera vez y "
           "registrar retos a partir de ahí. Siempre con el mismo enlace.", "sec_portada.jpg")
    escena("capitan/tablet.png", "Quién eres a bordo",
           "Alias, personaje y quién te da clase. Esto solo se hace una vez: lo que registres "
           "después se guarda siempre.", "sec_alistamiento.jpg")
    escena("personajes/nebula.png", "Elige el planeta",
           "Cada planeta es un tema del curso. Dime de cuál es el reto que has completado y te "
           "llevo directa a su sección.", "sec_planeta.jpg", izquierda=False)
    escena("personajes/nebula.png", "Contacta con NEBULA",
           "Cuéntame qué te ha pasado. Lo lee tu profesorado, y si prefieres que no sepan quién "
           "eres, puedes enviarlo en anónimo.", "sec_ticket.jpg", izquierda=False)
    escena("capitan/senala.png", "Cambia tus créditos por ventajas",
           "Elige abajo qué quieres canjear y te enseño exactamente lo que te llevas antes de "
           "confirmar. Los créditos no son los xp: gastarlos no te baja de nivel.", "sec_canje.jpg")

    print("\nHecho.")
