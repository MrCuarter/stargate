# -*- coding: utf-8 -*-
"""Regenera las capturas de la seccion «Como se hace» (pasos.html).

    python3 _capturas_pasos.py            # todas las que se puedan
    python3 _capturas_pasos.py E5 E6      # solo esas

🔴 POR QUE ESTO ES UN SCRIPT Y NO UNA CARPETA DE PNG HECHOS A MANO:
una captura es una foto. Si cambia la interfaz, el texto de PASOS se actualiza pero la captura
MIENTE EN SILENCIO — el fallo de «un dato, un sitio» otra vez. Regenerandolas con un comando,
una pantalla que cambia se ve en el `git diff` de la imagen.

Dispara Chrome headless por CDP (`_capturar.cjs`, sin dependencias). Eso permite dos cosas que
`chrome --screenshot` no puede: SEMBRAR el localStorage antes de disparar —la Nave identifica al
alumno por ahi, y el correo NO viaja en la URL a proposito— y ESPERAR POR CONDICION en vez de por
reloj, que es lo unico fiable cuando los datos vienen de Apps Script.

Lo que NO puede capturar (y sale en ambar en la pagina): la hoja maestra (cuenta mutecdgami,
dentro de Google Sheets) y lo que va detras del PIN del profesorado. Esas se dejan a mano en
assets/img/pasos/ con el nombre que diga PASOS.

Que lo retratado siga existiendo lo vigila el banco: la bateria 33 comprueba que la ficha del
alumno pinta los catalogos enteros, y el build que existen sus 104 imagenes.
"""
import json, os, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from _site_data import PASOS, TABLERO_API

WEB = "https://stargate.mistercuarter.es"
PER = "clase-demo"                     # el unico grupo con gente: las capturas salen vivas
ALUMNO = "demo05@reclutas.demo"        # recluta sembrado, correo inventado a proposito
DESTINO = os.path.join(HERE, "assets", "img", "pasos")

# La Nave guarda a quien eres en localStorage, con la clave del PER.
SEMBRAR = ("localStorage.setItem('sgNaveEmail_%s','%s');"
           "localStorage.setItem('sgNaveOnboard_%s','1');" % (PER, ALUMNO, PER))
OLVIDAR = ("localStorage.removeItem('sgNaveEmail_%s');"
           "localStorage.setItem('sgNaveOnboard_%s','1');" % (PER, PER))
# 🔴 La Nave tiene TRES mensajes de espera distintos («Contactando», «Estableciendo conexion»,
# «Sincronizando»). Comprobar la ausencia de UNO dejaba pasar los otros dos y la captura salia a
# medio cargar. Se espera a que haya CONTENIDO de verdad, no a que falte un cartel.
ESPERANDO = "/Cargando|Contactando|Estableciendo|Sincronizando|Buscándote/"
CARGADA = ("/\\d+\\s*xp/.test(document.body.innerText) && !%s.test(document.body.innerText)"
           % ESPERANDO)

def pestana(nombre):
    """clic en una pestaña de la Nave: son botones normales, no widgets de Google"""
    return ("(function(){var b=[].slice.call(document.querySelectorAll('button'))"
            ".filter(function(x){return /%s/.test(x.innerText);})[0];"
            "if(b){b.click();var t=b.closest('div');if(t){t.scrollIntoView({block:'start'});"
            "window.scrollBy(0,-60);}}return 1;})()" % nombre)

def subir(txt):
    return ("(function(){var b=[].slice.call(document.querySelectorAll('button,h2,h3'))"
            ".filter(function(x){return /%s/.test(x.innerText);})[0];"
            "if(b){b.scrollIntoView({block:'start'});window.scrollBy(0,-70);}return 1;})()" % txt)

def url_form(cual):
    """La URL del formulario vivo del PER, leida de la API publica (no se escribe a mano)."""
    import urllib.request
    with urllib.request.urlopen("%s?per=%s" % (TABLERO_API, PER), timeout=120) as r:
        d = json.loads(r.read().decode())
    return {"bitacora": d["formBitacora"], "canje": d["formCanje"], "ticket": d["formTicket"]}[cual]

# nombre -> el trabajo. `form:` se resuelve contra la API antes de disparar.
TOMAS = {
 "d1_portada.png":    dict(url=WEB + "/index.html", ancho=1440, alto=900, espera=5),
 "d2_cronologia.png": dict(url=WEB + "/cronologia.html", ancho=1440, alto=1150, espera=6,
                           scroll=subir("Semana 1")),
 "d6_tablero.png":    dict(url=WEB + "/registro.html?per=%s&embed=1&solo=1" % PER,
                           ancho=1280, alto=1000, espera=4,
                           listo="document.querySelectorAll('#tablero tbody tr').length>0"),
 "e1_nave.png":       dict(url=WEB + "/recluta.html?per=%s" % PER, ancho=1280, alto=950, espera=4,
                           antes=OLVIDAR, listo="/correo/i.test(document.body.innerText)"),
 "e2_cuenta.png":     dict(url="form:bitacora", ancho=1100, alto=900, espera=7),
 "e3_alistarse.png":  dict(url="form:bitacora", ancho=1100, alto=1250, espera=7),
 "e4_reto.png":       dict(url="form:canje", ancho=1100, alto=1000, espera=7),
 "e5_ficha.png":      dict(url=WEB + "/recluta.html?per=%s" % PER, ancho=1280, alto=1080, espera=4,
                           antes=SEMBRAR, listo=CARGADA, scroll=pestana("Mi ficha"),
                           listo2="/créditos/.test(document.body.innerText)"),
 "e6_pestanas.png":   dict(url=WEB + "/recluta.html?per=%s" % PER, ancho=1280, alto=1000, espera=4,
                           antes=SEMBRAR, listo=CARGADA, scroll=pestana("Mis retos"),
                           listo2="document.querySelectorAll('input[type=checkbox],.reto,.mis-retos').length>0 || /Planeta 1/.test(document.body.innerText)"),
 "e7_premios.png":    dict(url=WEB + "/recluta.html?per=%s" % PER, ancho=1280, alto=1080, espera=4,
                           antes=SEMBRAR, listo=CARGADA, scroll=pestana("Recompensas"),
                           listo2="(document.body.innerText.match(/◈/g)||[]).length>4"),
 "e8_tablero.png":    dict(url=WEB + "/recluta.html?per=%s" % PER, ancho=1280, alto=1000, espera=4,
                           antes=SEMBRAR, listo=CARGADA, scroll=pestana("El tablero"),
                           listo2="document.querySelectorAll('#tablero tbody tr').length>0"),
}

def main():
    os.makedirs(DESTINO, exist_ok=True)
    pedidos = {a.lower() for a in sys.argv[1:]}
    codigo = {s["img"]: s["cod"] for c in PASOS for s in c["pasos"] if s.get("img")}
    cache, trabajos = {}, []
    for nombre, t in TOMAS.items():
        cod = codigo.get(nombre, "?")
        if pedidos and cod.lower() not in pedidos and nombre.lower() not in pedidos:
            continue
        t = dict(t, nombre=nombre)
        if t["url"].startswith("form:"):
            cual = t["url"].split(":")[1]
            if cual not in cache: cache[cual] = url_form(cual)
            t["url"] = cache[cual]
        trabajos.append(t)
    if not trabajos:
        print("nada que capturar con esos codigos"); return

    print("disparando %d capturas…" % len(trabajos), flush=True)
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as f:
        json.dump(trabajos, f, ensure_ascii=False); ruta = f.name
    r = subprocess.run(["node", os.path.join(HERE, "_capturar.cjs"), ruta, DESTINO],
                       capture_output=True, text=True)
    os.unlink(ruta)
    if r.returncode != 0:
        print(r.stdout); print(r.stderr)
        raise SystemExit("🔴 el capturador ha fallado")
    for x in json.loads(r.stdout.strip().splitlines()[-1]):
        print("  %-18s %s  %d KB" % (codigo.get(x["nombre"], "?"), x["nombre"], x["bytes"] // 1024))

    sin = ["%s (%s)" % (s["cod"], s["img"] or "sin nombre")
           for c in PASOS for s in c["pasos"] if not s.get("img") or s["img"] not in TOMAS]
    if sin:
        print("\nA mano (PIN o hoja maestra): " + ", ".join(sin))
    print("\nDespues: python3 _build_site.py")

if __name__ == "__main__":
    main()
