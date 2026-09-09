# -*- coding: utf-8 -*-
"""Regenera las capturas de la seccion «Como se hace» (pasos.html).

    python3 _capturas_pasos.py            # todas las que se puedan
    python3 _capturas_pasos.py E5 E6      # solo esas

🔴 POR QUE ESTO ES UN SCRIPT Y NO UNA CARPETA DE PNG HECHOS A MANO:
una captura es una foto. Si cambia la interfaz, el texto de PASOS se actualiza pero la captura
MIENTE EN SILENCIO — el fallo de «un dato, un sitio» otra vez. Regenerandolas con un comando,
una pantalla que cambia se ve en el `git diff` de la imagen.

Lo que NO puede capturar (y sale en ambar en la pagina): lo que vive dentro de la hoja maestra
(cuenta mutecdgami) y lo que va detras del PIN del profesorado. Esas se dejan a mano en
assets/img/pasos/ con el nombre que diga PASOS.

Usa Chrome headless. Ojo: Chrome escribe el fichero y a veces NO termina — de ahi el timeout.
"""
import os, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from _site_data import PASOS

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
WEB = "https://stargate.mistercuarter.es"
PER = "clase-demo"                     # el unico grupo con gente: las capturas salen vivas
ALUMNO = "demo05@reclutas.demo"        # recluta sembrado, correo inventado a proposito
DESTINO = os.path.join(HERE, "assets", "img", "pasos")

TOMAS = {
 # Lo que se puede retratar sin identidad ninguna
 "d1_portada.png":    (f"{WEB}/index.html", 1440, 900, 6),
 "d2_cronologia.png": (f"{WEB}/cronologia.html", 1440, 1200, 7),
 "d6_tablero.png":    (f"{WEB}/registro.html?per={PER}&embed=1&solo=1", 1280, 1000, 16),
 "e1_nave.png":       (f"{WEB}/recluta.html?per={PER}", 1280, 950, 14),
 # Los tres formularios son publicos: se retratan sin sesion (su URL sale de la API, no a mano)
 "e2_cuenta.png":     ("FORM:bitacora", 1100, 900, 8),
 "e3_alistarse.png":  ("FORM:bitacora", 1100, 1250, 8),
 "e4_reto.png":       ("FORM:canje", 1100, 1000, 8),
}

# 🔴 Lo que este script NO puede hacer, y por que:
#  · E5-E8 (la Nave YA identificada): la identidad vive en localStorage y el correo NO viaja
#    en la URL — es una decision de privacidad del sistema, no un descuido. Chrome headless
#    arranca siempre sin identificar. Esas cuatro se ponen a mano.
#  · D3-D5 (sala del docente y tickets): van detras del PIN.
#  · R1-R9 (la hoja maestra): cuenta mutecdgami, dentro de Google Sheets.
# Que no envejezcan en silencio lo vigila la bateria 42 (pruebas/prueba42_pasos.js): comprueba
# que lo que sale retratado —las seis pestañas, las opciones del formulario, los platos del
# menu— sigue existiendo. Si cambia, se pone en rojo y toca volver a capturar.

def url_form(cual):
    """La URL del formulario vivo del PER, leida de la API publica (no se escribe a mano)."""
    import json, urllib.request
    from _site_data import TABLERO_API
    with urllib.request.urlopen(f"{TABLERO_API}?per={PER}", timeout=90) as r:
        d = json.loads(r.read().decode())
    return {"bitacora": d["formBitacora"], "canje": d["formCanje"], "ticket": d["formTicket"]}[cual]

def disparar(nombre, url, ancho, alto, espera):
    salida = os.path.join(DESTINO, nombre)
    tmp = salida + ".tmp.png"
    cmd = [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
           f"--window-size={ancho},{alto}", f"--screenshot={tmp}",
           f"--virtual-time-budget={espera*1000}", "--force-device-scale-factor=2", url]
    try:
        subprocess.run(cmd, timeout=espera + 45, capture_output=True)
    except subprocess.TimeoutExpired:
        pass                       # Chrome a veces escribe y no muere; el fichero ya esta
    if os.path.exists(tmp) and os.path.getsize(tmp) > 20000:
        os.replace(tmp, salida)
        return os.path.getsize(salida)
    if os.path.exists(tmp): os.remove(tmp)
    return 0

def main():
    os.makedirs(DESTINO, exist_ok=True)
    pedidos = {a.lower() for a in sys.argv[1:]}
    quiere = {s["img"]: s["cod"] for c in PASOS for s in c["pasos"] if s.get("img")}
    cache_form = {}
    hechas, fallidas = [], []
    for nombre, (url, an, al, esp) in TOMAS.items():
        cod = quiere.get(nombre, "?")
        if pedidos and cod.lower() not in pedidos and nombre.lower() not in pedidos:
            continue
        if url.startswith("FORM:"):
            cual = url.split(":")[1]
            if cual not in cache_form: cache_form[cual] = url_form(cual)
            url = cache_form[cual]
        print(f"  {cod:>3} · {nombre} … ", end="", flush=True)
        n = disparar(nombre, url, an, al, esp)
        if n: hechas.append(nombre); print(f"{n//1024} KB")
        else: fallidas.append(nombre); print("🔴 no salio")
    print(f"\n{len(hechas)} capturas hechas" + (f" · {len(fallidas)} fallaron: {', '.join(fallidas)}" if fallidas else ""))
    sin = [f'{s["cod"]} ({s["img"] or "sin nombre"})' for c in PASOS for s in c["pasos"]
           if not s.get("img") or s["img"] not in TOMAS]
    if sin:
        print("\nA mano (PIN o hoja maestra): " + ", ".join(sin))
    print("\nDespues: python3 _build_site.py")

if __name__ == "__main__":
    main()
