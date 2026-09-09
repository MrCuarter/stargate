# -*- coding: utf-8 -*-
"""Verifica que un PER recien creado esta COMPLETO, sin entrar en la hoja."""
import json, re, sys, urllib.request
API = "https://script.google.com/macros/s/AKfycbxlrRGIBJPD9h8-6D46Y4IJ8Gb2fu9v4-6wYZjgPAom2W1QfLh14ltBZmXV2Sx3_nXvPg/exec"

def baja(u):
    req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=90) as r:
        return r.read().decode("utf-8", "replace")

def payload(html):
    m = re.search(r"FB_PUBLIC_LOAD_DATA_ = (.*?);</script>", html, re.S)
    return json.loads(m.group(1)) if m else None

per = sys.argv[1]
d = json.loads(baja(f"{API}?per={per}&t={id(per)}"))
print(f"══════ {d.get('nombre')} ({per})")
ok, mal = [], []
def chk(c, t): (ok if c else mal).append(t)

for k, t in [("formBitacora","Bitácora"),("formTicket","Ticket"),("formCanje","Canje"),
             ("panel","Genially")]:
    chk(bool(d.get(k)), f"tiene {t}")

for k, nombre, imgs_min in [("formBitacora","Bitácora",8),("formCanje","Canje",10)]:
    if not d.get(k): continue
    h = baja(d[k])
    p = payload(h)
    if not p: mal.append(f"{nombre}: no se puede leer"); continue
    items = p[1][1] or []
    tipos = {}
    for it in items: tipos[it[3]] = tipos.get(it[3], 0) + 1
    imgs = tipos.get(11, 0)         # 🔴 tipo 11 = IMAGEN. El 6 es cabecera de seccion: contarlo daba 2 y parecia que faltaban las fotos.
    chk(imgs >= imgs_min, f"{nombre}: {imgs} imágenes (mínimo {imgs_min})")
    txt = json.dumps(p, ensure_ascii=False)
    if nombre == "Bitácora":
        for marca in ["Fragmento Prohibido", "#mutecdstargate", "Preséntate a tu tripulación",
                      "QUÉ QUIERES HACER HOY"]:
            chk(marca in txt, f"Bitácora: catálogo al día — «{marca[:28]}»")
        chk("Batalla final" not in txt, "Bitácora: la Batalla final NO está")
    else:
        for r in ["Sobre de cromos", "Héroe de la Rebelión", "Recalificar un suspenso"]:
            chk(r in txt, f"Canje: «{r}»")

print(f"\n✅ {len(ok)} bien")
for x in ok: print("   ✓", x)
if mal:
    print(f"\n🔴 {len(mal)} MAL")
    for x in mal: print("   ✗", x)
else:
    print("\n🎉 el grupo está COMPLETO")
