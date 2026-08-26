# -*- coding: utf-8 -*-
"""Genera una copia de Code.gs SIN un solo byte no-ASCII, para poder pegarla por
automatización (o por cualquier editor con la codificación mal puesta) sin que se
rompan los acentos. Dentro de cadenas y expresiones regulares, cada carácter no
ASCII se escribe como \\uXXXX —que JavaScript interpreta idéntico—; en los
comentarios se translitera, porque ahí da igual."""
import io, os, sys, unicodedata

TRANS = {"·":"-", "«":'"', "»":'"', "—":"-", "–":"-", "→":"->", "×":"x", "≥":">=", "…":"...",
         "◈":"(cred)", "★":"*", "♛":"corona", "✦":"*", "🃏":"", "👑":"", "⏳":"", "⚡":"", "🔒":"", "🔴":"", "⚠":"(!)", "✓":"ok", "✗":"x", "═":"=", "▶":">",
         "“":'"', "”":'"', "’":"'", "¡":"!", "¿":"?"}
def a_ascii(c):
    if c in TRANS: return TRANS[c]
    d = unicodedata.normalize("NFD", c)
    s = "".join(x for x in d if not unicodedata.combining(x))
    return s if s.isascii() else "?"

def escapar_js(c):
    """\\uXXXX como lo entiende JavaScript.

    🔴 Los caracteres fuera del BMP (los emojis 🔴🟡🟢, U+1F534 y compañía) NO caben en cuatro
    dígitos: hay que escribirlos como PAR SURROGADO. Con «\\u%04x» salia «\\u1f534», que JavaScript
    lee como \\u1f53 seguido de un «4» — y el semáforo del parte de salud aparecía en pantalla
    como «ù4». Visto en producción el 26-ago.
    """
    o = ord(c)
    if o < 0x10000:
        return "\\u%04x" % o
    o -= 0x10000
    return "\\u%04x\\u%04x" % (0xD800 + (o >> 10), 0xDC00 + (o & 0x3FF))


def convertir(src):
    out = []
    en_cadena = []             # los no-ASCII que van dentro de cadenas: se comprueban al final
    i, n = 0, len(src)
    estado = "codigo"          # codigo | ' | " | ` | linea | bloque
    while i < n:
        c = src[i]
        # escapes: se copian tal cual (y así //, \/ y \" no confunden al analizador)
        if estado in ("'", '"', "`", "codigo") and c == "\\" and i + 1 < n:
            out.append(c); out.append(src[i+1]); i += 2; continue
        if estado == "codigo":
            if c == "/" and i+1 < n and src[i+1] == "/": estado = "linea"; out.append("//"); i += 2; continue
            if c == "/" and i+1 < n and src[i+1] == "*": estado = "bloque"; out.append("/*"); i += 2; continue
            if c in "'\"`": estado = c; out.append(c); i += 1; continue
        elif estado in ("'", '"', "`"):
            if c == estado: estado = "codigo"; out.append(c); i += 1; continue
        elif estado == "linea":
            if c == "\n": estado = "codigo"; out.append(c); i += 1; continue
        elif estado == "bloque":
            if c == "*" and i+1 < n and src[i+1] == "/": estado = "codigo"; out.append("*/"); i += 2; continue
        if ord(c) < 128: out.append(c)
        elif estado in ("linea", "bloque"): out.append(a_ascii(c))
        else:
            en_cadena.append(c)
            out.append(escapar_js(c))
        i += 1
    r = "".join(out)
    _comprobar(r, en_cadena)
    return r


def _comprobar(convertido, esperados):
    """Que lo escapado se lea como lo original. Es la única forma de saber que lo que se PEGA dice
    lo mismo que lo que se escribió — y el banco de pruebas no lo ve, porque compara comportamiento,
    no glifos."""
    import collections, re as _re
    crudo = _re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1), 16)), convertido)
    # JavaScript une los pares surrogados; Python los deja sueltos, así que se unen igual
    unido = crudo.encode("utf-16", "surrogatepass").decode("utf-16")
    hay = collections.Counter(c for c in unido if ord(c) > 127)
    faltan = collections.Counter(esperados) - hay
    assert not faltan, ("el escape no se lee igual que el original: " +
                        ", ".join("%r x%d" % (c, n) for c, n in faltan.items()))

def convertir_html(src):
    """En un HTML hay dos mundos: dentro de <script> valen los \\uXXXX de JavaScript;
    fuera, hay que usar entidades numéricas (&#xE9;) o el navegador pintaría el texto crudo."""
    out, i, n = [], 0, len(src)
    while i < n:
        j = src.lower().find("<script", i)
        if j < 0:
            out.append("".join(c if ord(c) < 128 else "&#x%X;" % ord(c) for c in src[i:])); break
        out.append("".join(c if ord(c) < 128 else "&#x%X;" % ord(c) for c in src[i:j]))
        k = src.lower().find("</script>", j)
        k = n if k < 0 else k + len("</script>")
        out.append(convertir(src[j:k]))
        i = k
    return "".join(out)

if __name__ == "__main__":
    base = os.path.dirname(os.path.abspath(__file__))
    for orig, dest in [("apps-script/Code.gs", "assets/descargas/Code.gs.ascii.txt"),
                       ("apps-script/Datos.gs", "assets/descargas/Datos.gs.ascii.txt"),
                       ("apps-script/Dialog.html", "assets/descargas/Dialog.html.ascii.txt")]:
        s = io.open(os.path.join(base, orig), encoding="utf-8").read()
        r = convertir_html(s) if orig.endswith(".html") else convertir(s)
        malos = [c for c in r if ord(c) > 127]
        assert not malos, "quedan no-ASCII: " + repr(malos[:5])
        io.open(os.path.join(base, dest), "w", encoding="utf-8").write(r)
        print("%-28s -> %-34s %d bytes, 100%% ASCII" % (orig, dest, len(r)))
