#!/usr/bin/env python3
"""
19-sep · FUERA EMOJIS, DENTRO NUESTROS ICONOS. Norberto: «No queremos emojis, tenemos iconos muy chulos. Cámbialos».

    python3 herramientas/sin_emojis.py FICHERO            # enseña qué cambiaría, línea a línea
    python3 herramientas/sin_emojis.py FICHERO --aplicar  # lo cambia

Regla por contexto:
  · donde el texto acaba como HTML  → el emoji pasa a ser <img class=ico …> (sin comillas: vale dentro de '…' y de "…");
  · donde es TEXTO PLANO (avisos, textContent, title, botones de SG.preguntar, lo que se copia) → el emoji se quita.
Los signos tipográficos (✓ → ← ↗ ★ ◈ ✕ ▾ ▶ ⛶ ⧉ ↺) no son emojis de colores: se quedan.
Los iconos: assets/img/iconos/p/<k>.png (pictograma; Magnific, 19-sep) y assets/img/nave/iconos/<k>.png (los de la Nave).
"""
import re, sys

N = "nave:"   # los de assets/img/nave/iconos
MAPA = {
  "🔔": N+"clase", "🗑": "papelera", "✨": "estrella", "🧭": "brujula", "⚙": "ajustes", "🛠": "ajustes",
  "📽": "video", "🎬": "video", "🛰": N+"envivo", "📡": N+"envivo", "⚔": "diana", "🎯": "diana", "🎮": "diana",
  "🎟": "ticket", "🏷": "ticket", "🏅": "medalla", "🎖": "medalla", "🎓": "medalla", "👥": N+"gente", "👤": N+"gente",
  "🙋": N+"gente", "✋": N+"gente", "🗓": "calendario", "📅": "calendario", "🎄": "calendario", "🌐": "varios",
  "🪐": "varios", "🌌": "varios", "👑": "corona", "🧊": "hielo", "🏆": N+"rankings", "📈": N+"rankings", "📊": N+"rankings",
  "⚠": "aviso", "🚨": "aviso", "🚫": "aviso", "💬": "mensaje", "📣": "mensaje", "🌟": "estrella", "⭐": "estrella",
  "🎉": "estrella", "💡": "estrella", "💎": "estrella", "🃏": "estrella", "🔥": "fuego", "🔀": N+"zoco", "🔁": N+"zoco",
  "🔄": N+"zoco", "🔗": "enlace", "✍": "editar", "✏": "editar", "🚀": "cohete", "🧱": "notas", "📋": "notas",
  "🗂": "notas", "📜": "libro", "📚": "libro", "🛡": "escudo", "🟪": "escudo", "🟨": "corona", "🎲": "dados",
  "💰": "monedas", "⚡": "rayo", "🎁": N+"premios", "📦": N+"botin", "🥚": N+"botin", "➕": "anadir", "👁": "ojo",
  "👀": "ojo", "⏸": "pausa", "⏳": N+"tiempo", "⌛": N+"tiempo", "⏱": N+"tiempo", "🕗": N+"tiempo", "🔒": "candado",
  "🔓": "abierto", "🚪": "abierto", "🏁": "hecho", "🟢": "hecho", "✅": "hecho", "🗝": "llave", "🔑": "llave",
  "📨": "sobre", "❓": N+"pregunta", "🗳": N+"voto", "🛒": N+"mercado",
}
# se quitan sin icono (no aportan nada o no tienen equivalente)
QUITAR = set("👆🎭🫡😉🔇🕳🖼")
# emojis «de texto» que se dejan en su forma de signo
A_SIGNO = {"▶️": "▶", "↩️": "↩", "✖️": "✕", "⏸️": "⏸"}

EMO = re.compile('([\U0001F300-\U0001FAFF☀-⛿✀-➿⭐⏩-⏺⌚⌛])(️)?( ?)')
SIGNOS = set("✓✔✕✖→←↗★☆◈✦▾▴▶⛶⧉↺↻⇄↩⏏")
TEXTO = re.compile(r"textContent|innerText|aviso\(|\.title\s*=|setAttribute\(\"(title|aria-label)|si:\s*[\"']|no:\s*[\"']|titulo:\s*[\"']|"
                   r"texto:\s*[\"']|placeholder|alert\(|confirm\(|reabrirFicha\(|tras\(|hazlo\(|pide\(|repinta\(|despues\(|"
                   r"document\.title|aria-label=\"[^\"]*$|<option")

def src(k):
    return "assets/img/iconos/p/" + (k[len(N):] if k.startswith(N) else k) + ".png"   # (las de la Nave, también en p/: con fondo transparente)

def cambia(linea):
    s = linea.strip()
    if s.startswith("//") or s.startswith("*") or s.startswith("/*") or s.startswith("#"): return linea, []
    for a, b in A_SIGNO.items(): linea = linea.replace(a, b)
    es_texto = bool(TEXTO.search(linea))
    notas = []
    def r(m):
        e = m.group(1)
        if e in SIGNOS: return m.group(0)
        if e in QUITAR: notas.append(e + "→∅"); return ""
        k = MAPA.get(e)
        if not k: notas.append(e + "→¿?"); return m.group(0)
        if es_texto: notas.append(e + "→∅ (texto)"); return ""
        notas.append(e + "→" + k)
        return '<img class=ico src=' + src(k) + ' alt>' + (m.group(3) or "")
    return EMO.sub(r, linea), notas

if __name__ == "__main__":
    f = sys.argv[1]; aplicar = "--aplicar" in sys.argv
    L = open(f, encoding="utf-8").read().split("\n")
    out, n = [], 0
    for i, ln in enumerate(L, 1):
        nuevo, notas = cambia(ln)
        if notas and not aplicar: print(f"{i}: {' '.join(notas)} | {ln.strip()[:120]}")
        if nuevo != ln: n += 1
        out.append(nuevo)
    if aplicar: open(f, "w", encoding="utf-8").write("\n".join(out))
    print(("cambiadas " if aplicar else "cambiarían ") + str(n) + " líneas", file=sys.stderr)
