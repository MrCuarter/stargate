#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""STARGATE · comprueba que la web publicada responde ANTES de tocar los formularios.

Por qué existe (§12.9 del traspaso): el 25-ago Hostinger devolvía 504 y nos costó una ejecución
entera de Apps Script — seis minutos y un PER a medias. Se descubrió de casualidad. De esa web
cuelgan los ORBES DE PLANETA que el script incrusta en la Bitácora: si no responde, el alta de un
grupo se arrastra o queda incompleta.

Va aparte del build a propósito: `_build_site.py` tiene que funcionar sin internet.

    python3 comprobar_web.py              # comprueba todo
    python3 comprobar_web.py --rapido     # solo páginas y orbes (lo que usa el Apps Script)
    python3 comprobar_web.py --autoprueba # se prueba a sí mismo con una URL inventada
    python3 comprobar_web.py --base http://localhost:8791   # contra una copia local

Devuelve 0 si todo responde 200, y 1 si algo falla: así se puede encadenar.
"""
import argparse, concurrent.futures as futuros, hashlib, os, re, sys, time
import urllib.error, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from _site_data import CROMOS   # noqa: E402  · un dato, un sitio


def _del_code_gs(patron, grupo=1):
    """Lee un dato del Code.gs en vez de copiarlo aquí: quien descarga los orbes es él."""
    gs = open(os.path.join(HERE, "apps-script", "Code.gs"), encoding="utf-8").read()
    return re.findall(patron, gs)


# Los 8 orbes, tal y como los pide orbeBlob_: WEB + assets/img/planetas/ + TEMAS[t][2] + .png
PLANETAS = _del_code_gs(r'\["[^"]+","[^"]+","(p\d_[a-z]+)"\]')
BASE = _del_code_gs(r'var WEB = "([^"]+)"')[0]
# El CDN de OpenArt tumba el User-Agent de urllib; el dominio propio no lo necesita, pero cuesta cero
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 STARGATE-check"
TIMEOUT = 20
PAGINAS = ["index.html", "guia.html", "cronologia.html", "actividades.html", "geniallys.html",
           "registro.html", "grupos.html", "clase.html", "recursos.html", "recluta.html",
           "profes.html", "tickets.html", "foro.html", "embed.html", "panel.html"]


def versionados(base):
    """Los assets tal y como los pide la web: con su ?v=… de cache-bust, leído del HTML generado."""
    urls = set()
    for pag in PAGINAS:
        f = os.path.join(HERE, pag)
        if not os.path.exists(f):
            continue
        html = open(f, encoding="utf-8").read()
        for m in re.finditer(r'(?:src|href)="(assets/(?:js|css)/[^"]+)"', html):
            urls.add(base + m.group(1))
    return sorted(urls)


def comprobar(url):
    t0 = time.time()
    pet = urllib.request.Request(url, headers={"User-Agent": UA}, method="GET")
    try:
        with urllib.request.urlopen(pet, timeout=TIMEOUT) as r:
            return url, r.status, len(r.read()), time.time() - t0, ""
    except urllib.error.HTTPError as e:
        return url, e.code, 0, time.time() - t0, e.reason
    except Exception as e:                                   # DNS, timeout, TLS…
        return url, 0, 0, time.time() - t0, str(e)[:80]


def tanda(titulo, urls, base):
    print(f"\n▶ {titulo} ({len(urls)})")
    malos = []
    with futuros.ThreadPoolExecutor(max_workers=8) as pool:
        for url, cod, n, seg, err in pool.map(comprobar, urls):
            corto = url[len(base):] if url.startswith(base) else url
            if cod == 200:
                print(f"   ✓ {cod}  {seg*1000:5.0f} ms  {n/1024:7.1f} KB  {corto}")
            else:
                print(f"   ✗ {cod or '—'}  {seg*1000:5.0f} ms  {corto}   {err}")
                malos.append((corto, cod, err))
    return malos


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default=BASE)
    ap.add_argument("--rapido", action="store_true", help="solo lo que necesita el Apps Script")
    ap.add_argument("--autoprueba", action="store_true", help="comprobarse a sí mismo")
    a = ap.parse_args()
    base = a.base if a.base.endswith("/") else a.base + "/"

    if a.autoprueba:
        print("▶ Autoprueba: una URL que no existe TIENE que dar fallo")
        malos = tanda("inventado", [base + "esta-pagina-no-existe-jamas.html"], base)
        ok = len(malos) == 1
        print("\n" + ("✓ el comprobador detecta lo que está roto" if ok
                      else "✗ EL COMPROBADOR NO SIRVE: ha dado por buena una URL inventada"))
        return 0 if ok else 1

    print("═══ STARGATE · comprobación de la web publicada ═══")
    print("base: " + base)
    malos = []
    # 1) las páginas
    malos += tanda("Páginas", [base + p for p in PAGINAS], base)
    # 2) los 8 orbes de planeta: son los que descarga el Apps Script al crear un PER
    malos += tanda("Orbes de planeta (los que incrusta el Apps Script)",
                   [base + "assets/img/planetas/" + k + ".png" for k in PLANETAS], base)
    if not a.rapido:
        # 3) js y css con su ?v= (si el cache-bust apunta a un fichero que no está, la web sale rota)
        malos += tanda("JS y CSS versionados", versionados(base), base)
        # 4) las cabeceras de los formularios y la lámina de personajes
        malos += tanda("Imágenes de los formularios",
                       [base + "assets/img/forms/cabecera_bitacora.jpg",
                        base + "assets/img/forms/cabecera_ticket.jpg",
                        base + "assets/img/forms/cabecera_canje.jpg",
                        base + "assets/img/personajes/nebula.png",
                        base + "assets/img/personajes/vaeon.png"], base)
        # 5) las 20 cartas del álbum
        malos += tanda("Cartas del álbum",
                       [base + "assets/img/tarjetas/" + c[0] + "_carta.png" for c in CROMOS], base)

    print("\n" + "═" * 51)
    if malos:
        print(f"✗ {len(malos)} recurso(s) NO responden:")
        for corto, cod, err in malos[:20]:
            print(f"   {cod or '—'}  {corto}  {err}")
        print("\n🔴 NO lances ahora «Crear PER» ni «Actualizar imágenes de los planetas»: el Apps\n"
              "   Script se come 12 s por cada orbe que no baja y puede agotar los 6 minutos.")
        return 1
    print("✓ TODO RESPONDE · la web está en pie, se puede tocar los formularios")
    return 0


if __name__ == "__main__":
    sys.exit(main())
