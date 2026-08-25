# -*- coding: utf-8 -*-
"""Genera una copia de Code.gs SIN un solo byte no-ASCII, para poder pegarla por
automatización (o por cualquier editor con la codificación mal puesta) sin que se
rompan los acentos. Dentro de cadenas y expresiones regulares, cada carácter no
ASCII se escribe como \\uXXXX —que JavaScript interpreta idéntico—; en los
comentarios se translitera, porque ahí da igual."""
import io, os, sys, unicodedata

TRANS = {"·":"-", "«":'"', "»":'"', "—":"-", "–":"-", "→":"->", "×":"x", "≥":">=", "…":"...",
         "◈":"(cred)", "★":"*", "♛":"corona", "✦":"*", "🃏":"", "👑":"", "⏳":"", "⚡":"", "🔒":"", "🔴":"",
         "“":'"', "”":'"', "’":"'", "¡":"!", "¿":"?"}
def a_ascii(c):
    if c in TRANS: return TRANS[c]
    d = unicodedata.normalize("NFD", c)
    s = "".join(x for x in d if not unicodedata.combining(x))
    return s if s.isascii() else "?"

def convertir(src):
    out = []
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
        else: out.append("".join("\\u%04x" % ord(x) for x in c))
        i += 1
    return "".join(out)

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
                       ("apps-script/Dialog.html", "assets/descargas/Dialog.html.ascii.txt")]:
        s = io.open(os.path.join(base, orig), encoding="utf-8").read()
        r = convertir_html(s) if orig.endswith(".html") else convertir(s)
        malos = [c for c in r if ord(c) > 127]
        assert not malos, "quedan no-ASCII: " + repr(malos[:5])
        io.open(os.path.join(base, dest), "w", encoding="utf-8").write(r)
        print("%-28s -> %-34s %d bytes, 100%% ASCII" % (orig, dest, len(r)))
