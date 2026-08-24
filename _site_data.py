# -*- coding: utf-8 -*-
"""Datos del sitio STARGATE v2 (portada + cronología + geniallys + registro).
Los textos del foro se parsean de ../FORO_DINAMIZADOR_STARGARTE.md al construir."""
import os, re

HERE = os.path.dirname(os.path.abspath(__file__))
PLAYLIST = "https://www.youtube.com/playlist?list=PLKZsWVJaEna0"
HERO_MP4 = "https://stargate.mistercuarter.es/media/video/00b_opening_popurri_720.mp4"

# ---------- catálogo de vídeos (id de YouTube -> título/rol) ----------
V = {
 "trailer":   ("BTF3BDh8EJU", "Tráiler oficial"),
 "teaser":    ("QawOVpEFFaQ", "Tráiler «La Bitácora»"),
 "opening":   ("EFhNelFVS6g", "Opening (cabecera de la serie)"),
 "sinopsis":  ("5CqyMqs8zE8", "Cap. 0 · Sinopsis"),
 "bitacora":  ("TBMPGAPB_sY", "Misión · La Bitácora (ePortfolio)"),
 "t1i": ("_8FoAlZgp9k", "T1 Fôrge · intro"),      "act1": ("1vgVhuxYG5A", "Misión · Actividad 1 (imagen con IA)"),
 "t1c": ("3VWUwUI_FCM", "T1 Fôrge · cierre"),     "f1": ("9e_EhKUr2ac", "Fragmento 1 · Bran Okafor"),
 "t2i": ("0H5yrzGGC6o", "T2 Ecos · intro"),       "t2c": ("oc2qjSfkgfg", "T2 Ecos · cierre"),
 "f2": ("z_ry9joLUEY", "Fragmento 2 · Tomás Reyer"),
 "t3i": ("QiBE3TMT4HM", "T3 Sendara · intro"),    "act2": ("dCqsHmtPhUE", "Misión · Actividad 2 (paisaje)"),
 "t3c": ("XSOQrs2IKWw", "T3 Sendara · cierre"),   "f3": ("c3CLpXGL5Hw", "Fragmento 3 · Sylla Bren"),
 "t4i": ("ciTK0GpyCeg", "T4 Reliae · intro"),     "t4c": ("t52SLxzgxPo", "T4 Reliae · cierre"),
 "f4": ("K8djfd302TE", "Fragmento 4 · Amara Sol"),
 "t5i": ("I9cMr2b87RE", "T5 Umbral · intro"),     "t5c": ("VK1iT4umlJU", "T5 Umbral · cierre"),
 "f5": ("6z11HqfPWqg", "Fragmento 5 · Vera Khal"),
 "t6i": ("8XKVjDnTLSU", "T6 Ludo · intro"),       "t6c": ("dS2UNfjuoiA", "T6 Ludo · cierre"),
 "f6": ("LZTeVGnbPDo", "Fragmento 6 · Joran Pike"),
 "t7i": ("9JKdZreboOc", "T7 Vínculo · intro"),    "t7c": ("2Mqik8zgrTc", "T7 Vínculo · cierre"),
 "f7": ("bC4baV80OcU", "Fragmento 7 · Mara Voss"),
 "t8i": ("CgJBqiMO1Rk", "T8 Liminar · intro"),    "f8": ("D2jB9A2SbmI", "Fragmento 8 · Noa Lieth"),
 "finale": ("-QH2gsjl5VA", "T8 Liminar · FINALE — La verdad de la Cero"),
 "plan": ("8nR6SKpy3TI", "Plan de Ataque (el examen)"),
 "f9": ("ZfBQYGolFnA", "Fragmento 9 · El Fragmento Prohibido"),
}

def yt(clave):
    vid, tit = V[clave]
    return {"id": vid, "titulo": tit, "url": f"https://youtu.be/{vid}"}

# ---------- cronología: las 15 semanas ----------
# videos: [(clave_V, cuándo dentro de la semana)]
# insignias: claves de assets/img/insignias que se ENTREGAN esa semana
# lanza: retos que se lanzan (se resuelven después)
CRONO = [
 dict(sem=1, tema="Tema 1 · Fôrge", sub="Creación de contenido multimedia — Bienvenida",
      capitulo="El reclutamiento",
      videos=[("sinopsis","Primera sesión: el gancho de arranque"),
              ("bitacora","Tras la sinopsis: presenta la Bitácora (ePortfolio)"),
              ("t1i","Al abrir el Tema 1")],
      lanza=["Reto A «El boceto sin quemar» (Bran)", "Reto B «La chispa» (imagen con IA)"],
      insignias=["E1_nebula","H1_reclutamiento"],
      hito="Presentación ante el mando · Bitácora de la semana: un recurso multimedia con IA",
      clases="Clases 01–02",
      consejo="Preséntate como Capitán y reparte la insignia de Reclutamiento en público. El Opening puede abrir cada clase."),
 dict(sem=2, tema="Tema 1 (cont.) · Fôrge", sub="Actividad 1",
      capitulo=None,
      videos=[("act1","Al lanzar la Actividad 1"),
              ("t1c","Al cerrar el trabajo del planeta"),
              ("f1","Justo tras el cierre: la recompensa del bloque")],
      lanza=["Actividad 1 — actividad didáctica a partir de una imagen con IA"],
      insignias=["P1_bran","R1_la-chispa","E2_capitan","H2_primera-forja"],
      hito="Presenta la Act. 1 · Test del Tema 1",
      clases="Clases 03–04",
      consejo="P1 y R1 se entregan al completar los retos del T1; la del Capitán y Primera Forja, al presentar/entregar la Act. 1."),
 dict(sem=3, tema="Tema 2 · Ecos", sub="El vídeo como recurso",
      capitulo=None,
      videos=[("t2i","Al abrir el Tema 2")],
      lanza=["Reto A «Un mensaje para quien faltó» (Tomás)", "Reto B «El eco que enseña» (videotutorial + videoquiz)"],
      insignias=[], hito="Videotutorial en marcha", clases="Clase 05",
      consejo="Ecos = solo regresa el mensaje que se entiende. Conecta con el aula invertida."),
 dict(sem=4, tema="Tema 2 (cont.) · Ecos", sub="El vídeo que pregunta",
      capitulo=None,
      videos=[("t2c","Al cerrar el bloque"),("f2","Tras el cierre")],
      lanza=[], insignias=["P2_tomas","R2_el-eco-que-ensena"],
      hito="Test del Tema 2 · Bitácora: videotutorial enriquecido", clases="Clase 06",
      consejo="El fragmento de Tomás (su hija Lena) es el momento emocional del bloque: dale su espacio."),
 dict(sem=5, tema="Tema 3 · Sendara", sub="Contenidos interactivos",
      capitulo="Una ruta hacia la Tierra",
      videos=[("t3i","Al abrir el Tema 3")],
      lanza=["Reto A «Dos senderos» (Sylla)", "Reto B «La matriz» (matriz 8×6)"],
      insignias=[], hito="Itinerario de aprendizaje", clases="Clase 07",
      consejo="El mapa de un solo sendero de Sendara ES el itinerario; guárdate el paisaje para la semana 6."),
 dict(sem=6, tema="Tema 3 (cont.) · Sendara", sub="Actividad 2 — el paisaje",
      capitulo=None,
      videos=[("act2","Al lanzar la Actividad 2"),
              ("t3c","Al cerrar el bloque"),("f3","Tras el cierre")],
      lanza=["Actividad 2 — planifica y crea un paisaje de aprendizaje"],
      insignias=["P3_sylla","R3_la-matriz"],
      hito="Presenta la Act. 2 · Test del Tema 3 · Bitácora: itinerario o paisaje", clases="Clases 08–09",
      consejo="La Act. 2 se presenta ahora y se resuelve en la semana 13: recuérdalo para que no la dejen morir."),
 dict(sem=7, tema="Tema 4 · Reliae", sub="M-learning",
      capitulo="Estableciendo comunicaciones",
      videos=[("t4i","Al abrir el Tema 4")],
      lanza=["Reto A «Abre el canal» (Amara)", "Reto B «El entorno de aula»"],
      insignias=[], hito="Compartir de forma organizada", clases="Clase 10",
      consejo="Primero compartir ordenado (Sites/Classroom/Moodle); la comunicación viva llega la semana que viene."),
 dict(sem=8, tema="Tema 4 (cont.) · Reliae", sub="El entorno digital de aula",
      capitulo=None,
      videos=[("t4c","Al cerrar el bloque"),("f4","Tras el cierre")],
      lanza=[], insignias=["P4_amara","R4_entorno-de-aula"],
      hito="Test del Tema 4 · Bitácora: tu entorno de aula", clases="Clase 11",
      consejo="La lección de Amara (compartir a tiempo, pulir después) es oro contra el perfeccionismo del alumnado."),
 dict(sem=9, tema="Tema 5 · Umbral", sub="Evaluación y ePortfolio — aparece la Estática",
      capitulo="Evaluando la situación",
      videos=[("t5i","Al abrir el Tema 5 (¡aparece Vaeon!)"),
              ("t5c","Al cerrar el bloque"),("f5","Tras el cierre")],
      lanza=["Reto A «Mide con método» (Vera)", "Reto B «La Bitácora medida» (rúbrica + estructura del ePortfolio)"],
      insignias=["P5_vera","R5_bitacora-medida"],
      hito="Resolución de la Act. 1 · Test del Tema 5", clases="Clase 12",
      consejo="El momento dramático del curso: justo cuando saben medir, aparece el enemigo que silencia. Y se resuelve la Act. 1."),
 dict(sem=10, tema="Tema 6 · Ludo", sub="Aprendizaje Basado en el Juego (ABJ)",
      capitulo="Aprender jugando",
      videos=[("t6i","Al abrir el Tema 6"),
              ("t6c","Al cerrar el bloque"),("f6","Tras el cierre")],
      lanza=["Reto A «Ensaya jugando» (Joran)", "Reto B «El juego» (juego digital educativo)"],
      insignias=["P6_joran","R6_el-juego"],
      hito="Test del Tema 6 · Bitácora: un juego digital", clases="Clases 13–14",
      consejo="En Ludo SE JUEGA: el juego es la actividad. Fija ya la diferencia con lo que viene en Vínculo."),
 dict(sem=11, tema="Tema 7 · Vínculo", sub="Gamificación",
      capitulo="El arte de motivar",
      videos=[("t7i","Al abrir el Tema 7")],
      lanza=["Reto A «Un porqué» (Mara)", "Reto B «La microgamificación»"],
      insignias=[], hito="Microgamificación en marcha", clases="Clase 15",
      consejo="Aquí NO se juega: se toman elementos del juego. Es el error conceptual más común del curso — apóyate en Joran y Mara."),
 dict(sem=12, tema="Tema 7 (cont.) · Vínculo", sub="Gamificación profunda",
      capitulo=None,
      videos=[("t7c","Al cerrar el bloque"),("f7","Tras el cierre")],
      lanza=[], insignias=["P7_mara","R7_microgamificacion"],
      hito="Test del Tema 7 · Bitácora: tu microgamificación", clases="Clase 16",
      consejo="Momento meta: STARGATE es una gamificación profunda funcionando delante de sus ojos. Díselo."),
 dict(sem=13, tema="Tema 8 · Liminar", sub="Realidad Aumentada",
      capitulo=None,
      videos=[("t8i","Al abrir el Tema 8")],
      lanza=["Reto A «La capa posible» (Noa)", "Reto B «El último umbral» (RA/RV + publicar la Bitácora)"],
      insignias=["H3_cartografo"],
      hito="Resolución de la Act. 2", clases="Clase 17",
      consejo="Se resuelve la Actividad 2: la insignia de Cartógrafo se entrega con el paisaje presentado."),
 dict(sem=14, tema="Tema 8 (cont.) · Liminar", sub="Realidad Virtual — NEBULA casi completa",
      capitulo=None,
      videos=[("f8","NEBULA recuerda por qué la Cero se quedó: el fragmento de Noa cae aquí")],
      lanza=[], insignias=["P8_noa","R8_ultimo-umbral","H4_tripulacion-cero"],
      hito="Test del Tema 8 · la Tripulación Cero queda completa", clases="Clase 18",
      consejo="Con Noa se completa la Cero (insignia de hito Tripulación Cero). Deja el finale para la última semana."),
 dict(sem=15, tema="Repaso · La liberación", sub="Simulacro y salto final",
      capitulo="La liberación",
      videos=[("finale","La revelación: la verdad de la Cero (sin resolución)"),
              ("plan","El Capitán presenta el examen: la batalla ES el examen"),
              ("f9","Tras el examen/el cierre: el epílogo de Vaeon")],
      lanza=[], insignias=["H5_la-liberacion","E3_vaeon"],
      hito="Repaso + simulacro del examen · Bitácoras publicadas", clases="Clases 19–20",
      consejo="Celebra las Bitácoras publicadas: son el producto real del curso. El Fragmento Prohibido es el regalo final."),
]

# ---------- Plantilla Genially del ePortfolio (la Bitácora) ----------
# Enlace público de la plantilla de Genially que el alumnado puede reutilizar.
PLANTILLA_EPORTFOLIO = "https://view.genially.com/695f825d05cc22f3f7fac45b"

# ---------- Geniallys (rellenar cuando haya enlaces) ----------
GENIALLY_CARPETA = ("https://app.genially.com/teams/6567099bd7d7460014e6ec9c/spaces/"
                    "65e1bbeb0eea250014729589/folder/6a8abdcd38a70c07f841fe70")
# Por tema: view = enlace público (view.genially.com/...) cuando exista; None = pendiente
GENIALLYS = {
 1: {"nombre": "Fôrge · Contenido multimedia", "view": None},
 2: {"nombre": "Ecos · El vídeo", "view": None},
 3: {"nombre": "Sendara · Interactivos", "view": None},
 4: {"nombre": "Reliae · M-learning", "view": None},
 5: {"nombre": "Umbral · Evaluación", "view": None},
 6: {"nombre": "Ludo · ABJ", "view": None},
 7: {"nombre": "Vínculo · Gamificación", "view": None},
 8: {"nombre": "Liminar · RA/RV", "view": None},
}

# ---------- foro dinamizador (parsea el MD del proyecto) ----------
def foro_por_semana():
    """Devuelve {sem: texto_plano} con los placeholders de vídeo resueltos."""
    src = os.path.join(HERE, "..", "FORO_DINAMIZADOR_STARGARTE.md")
    out = {}
    try:
        txt = open(src, encoding="utf-8").read()
    except OSError:
        return out
    partes = re.split(r"### Semana (\d+) —", txt)
    for k in range(1, len(partes), 2):
        sem = int(partes[k])
        cuerpo = partes[k + 1]
        cuerpo = cuerpo.split("\n---")[0]
        # primera línea = resto del título
        lineas = cuerpo.strip().splitlines()
        cuerpo = "\n".join(lineas[1:]).strip()
        # placeholders de vídeo -> enlaces reales
        cuerpo = cuerpo.replace("{vídeo de bienvenida}", yt("sinopsis")["url"])
        cuerpo = cuerpo.replace("{vídeo}", yt("finale")["url"])
        # {tablero} -> enlace al tablero del PER (el foro dinámico sustituye el id solo;
        # en la copia estática, el profe pone el id de su PER)
        cuerpo = cuerpo.replace("{tablero}", "https://stargate.mistercuarter.es/registro.html?per={id-del-PER}")
        # markdown ligero -> texto plano (negritas/cursivas fuera)
        cuerpo = re.sub(r"\*\*(.+?)\*\*", r"\1", cuerpo, flags=re.S)
        cuerpo = re.sub(r"\*(.+?)\*", r"\1", cuerpo, flags=re.S)
        out[sem] = cuerpo.strip()
    return out

# ---------- tablero de reclutas (web app de Apps Script en mutecdgami) ----------
# URL del despliegue «Aplicación web» (termina en /exec). Vacío = tablero pendiente de conectar.
TABLERO_API = "https://script.google.com/macros/s/AKfycbxlrRGIBJPD9h8-6D46Y4IJ8Gb2fu9v4-6wYZjgPAom2W1QfLh14ltBZmXV2Sx3_nXvPg/exec"
