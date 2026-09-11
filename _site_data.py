# -*- coding: utf-8 -*-
"""Datos del sitio STARGATE v2 (portada + cronología + geniallys + registro).
Los textos del foro se parsean de ../FORO_DINAMIZADOR_STARGARTE.md al construir."""
import os, re

HERE = os.path.dirname(os.path.abspath(__file__))
PLAYLIST = "https://www.youtube.com/playlist?list=PLKZsWVJaEna0"
# Bucle del hero: la nave surcando el espacio (ida+vuelta = bucle infinito sin corte).
# Vive en el repo (media/video/) para que se despliegue con la web.
# Vídeos por jsDelivr (CDN de GitHub): resisten caídas del hosting (25-ago-2026)
CDN_VIDEO = "https://cdn.jsdelivr.net/gh/MrCuarter/stargate@main/media/video"
HERO_MP4 = CDN_VIDEO + "/hero_nave_loop.mp4"
HERO_POSTER = "assets/img/nave/hero_poster.jpg"

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
      lanza=["Reto «Preséntate a tu tripulación» (vídeo 60 s)", "Reto A «El boceto sin quemar» (Bran)", "Reto B «La chispa» (imagen con IA)"],
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
      lanza=[], insignias=["P7_mara","R7_microgamificacion","E3_vaeon"],
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
      lanza=[], insignias=["H5_la-liberacion"],
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

# ---------- PRUEBA EN PARALELO · inicio de sesion con Google (11-sep-2026) ----------
# ID de cliente de OAuth (Google Cloud → Credenciales → ID de cliente de OAuth → Aplicacion web,
# con https://stargate.mistercuarter.es en «Origenes autorizados de JavaScript»).
# 🔴 NO es un secreto: viaja en el HTML de cualquier web que use «Iniciar sesion con Google». Lo que
# protege la puerta es que el servidor comprueba que el token se emitio PARA este id (el campo
# `aud`), no que el id sea privado.
# Vacio = la prueba esta APAGADA: la pagina lo dice y no carga nada de Google.
GOOGLE_CLIENT_ID = "631545413622-fpc6e9lteh6j9ikk79o2opdquh0a1art.apps.googleusercontent.com"

# ---------- tablero de reclutas (web app de Apps Script en mutecdgami) ----------
# URL del despliegue «Aplicación web» (termina en /exec). Vacío = tablero pendiente de conectar.
TABLERO_API = "https://script.google.com/macros/s/AKfycbxlrRGIBJPD9h8-6D46Y4IJ8Gb2fu9v4-6wYZjgPAom2W1QfLh14ltBZmXV2Sx3_nXvPg/exec"

# ---------- cromos: el álbum del «Sobre de cromos» ----------
# FUENTE ÚNICA del álbum. De aquí salen (a) el catálogo que pinta la Nave del Recluta
# (window.SG_CROMOS) y (b) el bloque «var CROMOS» del Apps Script, que _build_site.py
# reescribe solo entre los marcadores CROMOS-INICIO / CROMOS-FIN. Nunca copiar a mano.
# serie: (clave, título, subtítulo del álbum)
CROMO_SERIES = [
 ("I",   "Serie I · La Tripulación Cero", "Los ocho que se quedaron"),
 ("II",  "Serie II · Los Ecos",           "Las personas a las que la Cero les cambió la vida"),
 ("III", "Serie III · La Nave",           "Quienes te acompañan… y tú"),
 ("IV",  "Serie IV · La Sombra",          "El silencio, y quien acabó sirviéndolo"),
]
# Insignia por completar una SERIE entera (§12.5). El álbum completo (20 cartas, una del 1 %) no es
# meta realista; una serie sí. Van en un campo aparte del tablero (insignias_album), NUNCA entre las
# 24 de la misión: ese contador se pinta como «n/24» en cuatro sitios y dejaría de ser cierto.
SERIES_ALBUM = [
 ("A1_tripulacion", "I",   "La Tripulación Cero al completo"),
 ("A2_ecos",        "II",  "Los Ecos al completo"),
 ("A3_nave",        "III", "La Nave al completo"),
 ("A4_sombra",      "IV",  "La Sombra al completo"),
]
# [clave, nombre en el álbum, serie, rareza, peso] · los pesos suman 100
CROMOS = [
 ("P1_bran",      "Bran Okafor",                "I",   "común",      7),
 ("P2_tomas",     "Tomás Reyer",                "I",   "común",      7),
 ("P3_sylla",     "Sylla Bren",                 "I",   "común",      7),
 ("P4_amara",     "Amara Sol",                  "I",   "común",      7),
 ("P5_vera",      "Vera Khal",                  "I",   "común",      7),
 ("P6_joran",     "Joran Pike",                 "I",   "común",      7),
 ("P7_mara",      "Mara Voss",                  "I",   "común",      7),
 ("P8_noa",       "Noa Lieth",                  "I",   "común",      7),
 ("L1_lena",      "Lena Reyer",                 "II",  "rara",       4),
 ("L2_kel",       "Kel Bren",                   "II",  "rara",       4),
 ("L3_copistas",  "Los Copistas de Fôrge",      "II",  "rara",       4),
 ("L4_ilan",      "Ilan Kesh",                  "II",  "rara",       4),
 ("L5_ruta_azul", "Los Niños de la Ruta Azul",  "II",  "rara",       4),
 ("L6_oren",      "Oren Vash",                  "II",  "rara",       4),
 ("E1_nebula",    "NEBULA",                     "III", "rara",       5),
 ("E2_capitan",   "El Capitán",                 "III", "rara",       5),
 ("N1_recluta",   "El Recluta",                 "III", "épica",      3),
 ("S2_estatica",  "La Estática",                "IV",  "épica",      4),
 ("E3_vaeon",     "General Vaeon",              "IV",  "LEGENDARIA", 2),
 ("S1_ander",     "Ander Vaeon",                "IV",  "LEGENDARIA", 1),
]
assert sum(c[4] for c in CROMOS) == 100, "los pesos de CROMOS deben sumar 100"

# ---------- vestuario: skins del personaje + héroes coleccionables (v3.16) ----------
# DOS COSAS DISTINTAS, y conviene no mezclarlas:
#   · SKINS. Tu personaje tiene 5 versiones de arte (RANGOS) que se desbloquean POR NIVEL. Antes se
#     imponían al subir; ahora se ELIGEN. No hacen falta imágenes nuevas: son las de siempre.
#   · HÉROES. Figuras únicas de la Rebelión que salen AL AZAR de la recompensa «Héroe de la
#     Rebelión». Se acumulan y también se eligen. Uno por imagen: ni ella/él ni evoluciones — por eso
#     un catálogo grande es asumible.
# El fichero vive en assets/img/heroes/<clave>.jpg.
# [clave, nombre, rareza, peso] · los pesos suman 100
HEROES = [
 # 30 figuras de la Rebelión. Salen AL AZAR al canjear «Héroe de la Rebelión» y se acumulan: los que
 # no tienes se ven en sombra, y la sombra es la del héroe de verdad — por eso reconoces el contorno
 # cuando por fin te toca. Van en parejas él/ella para que nadie se quede sin alguien en quien verse.
 # 🔴 Los pesos suman 100 (lo comprueba el assert de abajo): son la probabilidad de cada uno.
 #   14 raras × 4 = 56 · 12 épicas × 3 = 36 · 4 LEGENDARIAS × 2 = 8
 ("H01_custodio",    "Custodio de Fôrge",                "épica",       3),
 ("H02_custodia",    "Custodia de Fôrge",                "épica",       3),
 ("H03_xeno",        "Xeno de Liminar",                  "rara",        4),
 ("H04_xena",        "Xena de Liminar",                  "rara",        4),
 ("H05_eco",         "Eco de la Cero",                   "épica",       3),
 ("H06_eca",         "Eca de la Cero",                   "épica",       3),
 ("H07_tejedor",     "Tejedor de Sendara",               "rara",        4),
 ("H08_tejedora",    "Tejedora de Sendara",              "rara",        4),
 ("H09_pregonero",   "El Pregonero de Ecos",             "rara",        4),
 ("H10_pregonera",   "La Pregonera de Ecos",             "rara",        4),
 ("H11_emisario",    "El Emisario de Reliae",            "rara",        4),
 ("H12_emisaria",    "La Emisaria de Reliae",            "rara",        4),
 ("H13_agrimensor",  "El Agrimensor de Umbral",          "épica",       3),
 ("H14_agrimensora", "La Agrimensora de Umbral",         "épica",       3),
 ("H15_croupier",    "El Croupier de Ludo",              "rara",        4),
 ("H16_croupiera",   "La Croupier de Ludo",              "rara",        4),
 ("H17_abanderado",  "El Abanderado de Vínculo",         "épica",       3),
 ("H18_abanderada",  "La Abanderada de Vínculo",         "épica",       3),
 ("H19_relojero",    "El Relojero de la Cero",           "épica",       3),
 ("H20_relojera",    "La Relojera de la Cero",           "épica",       3),
 ("H21_cartografo",  "El Cartógrafo de lo que no existe","épica",       3),
 ("H22_cartografa",  "La Cartógrafa de lo que no existe","épica",       3),
 ("H23_bardo",       "El Último Bardo",                  "rara",        4),
 ("H24_juglar",      "La Última Juglar",                 "rara",        4),
 ("H27_silencioso",  "El Silencioso de Fôrge",           "rara",        4),
 ("H28_silenciosa",  "La Silenciosa de Fôrge",           "rara",        4),
 ("H25_desertor",    "El Desertor de la Estática",       "LEGENDARIA",  2),
 ("H26_desertora",   "La Desertora de la Estática",      "LEGENDARIA",  2),
 ("H29_heredero",    "Heredero de la Sombra",            "LEGENDARIA",  2),
 ("H30_heredera",    "Heredera de la Sombra",            "LEGENDARIA",  2),
]
assert sum(h[3] for h in HEROES) == 100, "los pesos de HEROES deben sumar 100"
# Los LEGENDARIOS no se pueden previsualizar: bloqueados salen como una silueta negra
# (assets/img/heroes/<clave>_bloqueado.jpg). Querer algo que no sabes cómo es tira más que verlo.
HEROES_OCULTOS = [h[0] for h in HEROES if h[2] == "LEGENDARIA"]

# ---------- niveles, rangos y economía (v3.7) ----------
# DOS MONEDAS, a propósito (y es la lección de gamificación de la asignatura):
#   · XP  = progreso del viaje. SOLO SUBEN. Determinan el NIVEL y la evolución del avatar.
#   · ◈ CRÉDITOS = moneda de misión. Se ganan con el mismo trabajo y son lo ÚNICO que se gasta.
# Fuente única: de aquí salen el JS de la web (window.SG_NIVELES) y los bloques NIVELES /
# CREDITOS / RECOMPENSAS del Apps Script, que _build_site.py reescribe entre marcadores.
MONEDA = "◈"
# 10 niveles. El umbral es xp acumulados en REGULAR; en PUA se escala por el total del viaje.
# rango = tramo de arte del avatar (1-5): el personaje EVOLUCIONA al entrar en los niveles 3, 5, 8 y 10.
RANGOS = ["Recluta", "Cadete", "Oficial", "Comandante", "Leyenda"]
# [nivel, xp REGULAR, rango (1-5), título del nivel]
NIVELES = [
 ( 1,    0, 1, "Recluta raso"),
 ( 2,  300, 1, "Recluta de guardia"),
 ( 3,  700, 2, "Cadete"),
 ( 4, 1150, 2, "Cadete de vuelo"),
 ( 5, 1650, 3, "Oficial"),
 ( 6, 2200, 3, "Oficial de puente"),
 ( 7, 2800, 3, "Oficial mayor"),
 ( 8, 3450, 4, "Comandante"),
 ( 9, 4150, 4, "Comandante de flota"),
 (10, 5000, 5, "Leyenda de la Cero"),
]
# v3.41 · fuera la Batalla final (500), dentro el huevo de Pascua S7 (150) — también en PUA.
# El nivel 10 (5.000) exige ahora los bonus de planeta: Leyenda = completarlo de verdad.
XP_VIAJE = {"REGULAR": 4750, "PUA": 4350}
# ◈ que da cada tipo de logro (el xp lo sigue fijando la tabla de retos del Apps Script)
# 26-ago · SUBE LO QUE SE GANA. Con el vestuario de héroes hay mucho más donde gastar, y con la
# economía vieja (590 ◈ el viaje entero) elegir una recompensa de nota significaba renunciar a
# coleccionar del todo. Ahora el viaje completo son 1.000 ◈ redondos en REGULAR.
# ================= QUÉ HAY QUE HACER EN CADA RETO =================
# Va dentro del formulario, en la sección de su tema. Un alumno que no sabe qué se le pide ESCRIBE
# UN CORREO, y cada correo evitado aquí es media hora que tu equipo no pierde. Google Forms no
# permite ayuda por opción, así que las líneas se juntan bajo la casilla de cada tema.
#
# Se edita AQUÍ, no en Code.gs: _build_site.py lo inyecta.
#
# 🔴 PENDIENTE DE TUS PALABRAS: los ocho «Reto A» llevan un texto provisional. De ellos solo existe
# el título en todo el proyecto, así que no me invento lo que piden. Sustituye las líneas marcadas
# con «(falta)» por una frase tuya que diga QUÉ se entrega. Lo demás sale de la propia etiqueta del
# reto, que ya nombra el entregable.
# ================= BONUS =================
# 🔴 Se conceden UNA VEZ y quedan escritos en AJUSTES, no se recalculan. La racha BAJA cuando se
# falla una semana: si el bonus se recalculara, alguien que llegó a 6 semanas y luego falló perdería
# créditos que ya se ha gastado, y el saldo se iría a negativo. Lo ganado, ganado.
BONUS_PLANETA = {"xp": 150, "creditos": 40}   # todos los retos de un tema registrados
# [semanas seguidas, créditos]. Sin xp a propósito: la constancia no debe mover el nivel ni los
# rankings, solo dar de gastar.
BONUS_RACHA = [[3, 40], [6, 80], [10, 150]]
# El Capitán paga el tutorial. 30 ◈ = DOS sobres de cromos exactos: acabas de aprender cómo funciona
# el álbum y puedes ir a abrirlo, en vez de quedarte con un número abstracto. Sin xp: no has
# producido nada, solo has escuchado.
BONUS_TUTORIAL = {"creditos": 30}

# 🔴 SUBIR NOTA EXIGE HABER TRABAJADO. La idea no es que alguien se ponga la última semana a entregar
# chapuzas y compre puntos: es premiar a quien ha hecho varias misiones. Se pide en PLANETAS
# COMPLETOS, no en racha, a propósito — una gripe de una semana no puede dejarte fuera, y el sistema
# no sabe cuándo hiciste el trabajo, solo cuándo lo registraste.
NOTA_MIN_PLANETAS = 4

# Completar colecciones mueve el motor: gastas créditos en sobres y parte vuelve, así que sigues
# jugando. NO es una máquina de dinero — completar el álbum cuesta muchísimos más sobres de los que
# devuelve (la legendaria sale 1 de cada 100).
# 🔴 Las series NO dan xp a propósito: los xp son el viaje y mueven el nivel y el ranking principal.
# Pagarlos por comprar sobres dejaría escalar a quien tiene créditos, no a quien ha trabajado. Para
# eso está el ranking de Colección. El ÁLBUM ENTERO sí los da: eso ya es una gesta.
BONUS_SERIE = {"creditos": 40}
BONUS_ALBUM = {"xp": 300, "creditos": 200}

# EL PARTE DE LA TRIPULACIÓN · si en un tema responde al ticket al menos esta fracción del grupo,
# TODA la tripulación cobra. Colectivo a propósito: el ticket es ANÓNIMO, así que no se puede saber
# quién respondió — y contando cabezas en vez de nombres, nadie tiene que renunciar a decir la verdad
# para cobrar. 🔧 Se ajusta sin tocar código desde el menú (Mantenimiento → Bonus de la tripulación);
# esto es solo el valor de partida.
BONUS_TRIPULACION = {"fraccion": 0.25, "creditos": 15, "semanas_activo": 4}

# EL PASE DE LISTA · el docente abre una ventana desde su sala y enseña una consigna de 4 letras;
# quien esté en la clase EN DIRECTO la teclea en su Nave y se lleva unos créditos. Una vez por
# sesión. Es simbólico a propósito: si un docente se olvida de abrirlo, sus alumnos no pueden hacer
# nada al respecto, así que la diferencia tiene que ser pequeña.
# 🔴 Y hay que decirlo claro: en un máster online esto mide «estaba mirando cuando se abrió», no
# «asistió». La consigna se puede pasar por chat. Sube el listón; no es una prueba de asistencia.
# 50 minutos = lo que dura una clase, a propósito. Con una ventana corta, quien entra cinco
# minutos tarde se queda fuera y le pide al docente que la reabra: eso revienta el chat y le
# roba la clase. El pase premia ASISTIR, no estar conectado en el minuto exacto.
BONUS_PASE = {"creditos": 5, "minutos": 50}

def _ayuda_de_los_retos():
    """Saca de RETOS_INSIGNIAS_STARGATE.md lo que pide cada reto (su bloque LITERAL).

    🔴 NO se copian a mano. El documento maestro es de donde salen también los ocho
    Material_Genially/T*/Retos_del_tema.md (comprobado: 8 copias, 0 discrepancias). Copiarlos aquí
    crearía un TERCER sitio con el mismo dato, y el día que se toque uno los otros mentirían.

    Si el documento cambia una redacción, el formulario la recoge al recompilar. Y si un reto se
    queda sin texto, esto REVIENTA en vez de dejar al alumnado sin saber qué se le pide.
    """
    import os, re, io
    doc = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "RETOS_INSIGNIAS_STARGATE.md")
    if not os.path.exists(doc):
        raise SystemExit("🔴 No encuentro RETOS_INSIGNIAS_STARGATE.md: sin él, el formulario no puede "
                         "explicar los retos. Está en Project_CCD/.")
    txt = io.open(doc, encoding="utf-8").read()
    porNombre = {}
    for bloque in re.split(r"^####\s*", txt, flags=re.M)[1:]:
        cab = bloque.split("\n")[0]
        m = re.search(r"«([^»]+)»", cab)
        lit = re.search(r"\*\*LITERAL:\*\*\s*(.+?)(?=\n- \*\*NARRATIVO|\n####|\n---|\Z)", bloque, re.S)
        if not (m and lit):
            continue
        t = re.sub(r"\s+", " ", lit.group(1)).strip()
        t = re.sub(r"\*\*(.+?)\*\*", r"\1", t)          # el formulario no entiende markdown
        t = re.sub(r"\*(.+?)\*", r"\1", t)
        # El foro es el de la plataforma de UNIR: dicho así, nadie pregunta cuál.
        t = re.sub(r"\bel foro\b", "el foro de la plataforma de UNIR", t)
        porNombre[m.group(1)] = t
    return porNombre

_AYUDA_DOC = _ayuda_de_los_retos()

# Lo que se le enseña al alumnado bajo la casilla de su tema. Sale del documento maestro; aquí solo
# se escriben a mano las piezas que ese documento no cubre (las Actividades y el examen).
AYUDA_RETOS = {
 "A0": "Graba un vídeo de MÁXIMO 60 segundos presentándote al resto de la tripulación y publícalo en la "
       "sección 📹 «Preséntate» del padlet de la clase (título = tu alias; primera línea = «Capitán: tu profe»). No hace falta guion de cine — si te da apuro, "
       "responde a tres o cuatro de estas: ¿quién eres y a qué te dedicas? ¿desde dónde te conectas? "
       "¿por qué educación? ¿una herramienta que ames y una que sufras? ¿un dato curioso que nadie "
       "adivinaría? Grábalo del tirón con el móvil: natural gana a perfecto. Sirve para ponernos cara "
       "desde el primer día — y NEBULA te da su insignia: lo que se comparte no se apaga.",
  "X1": "La Actividad 1 entregada donde te la pide tu profesor. Marca la casilla cuando la hayas ENVIADO, no cuando la empieces.",
  "X2": "La Actividad 2 entregada donde te la pide tu profesor. Igual: al enviarla.",
  "S7": "🕳️ En la presentación del planeta Vínculo hay un enlace que no debería estar ahí. Encuéntralo, "
        "resuelve el enigma que esconde y trae la PALABRA que Vaeon borró. Nadie va a decirte dónde mirar: "
        "los secretos de la gamificación se encuentran jugando.",
}
CREDITOS = {"reclutamiento": 20, "retoA": 20, "retoB": 50, "retoB_pua": 55,
            "actividad": 100, "final": 100, "derivada": 60}
# ---------- calendario del PER (v3.14) ----------
# Decisión del usuario (25-ago): los formularios NO se abren y cierran a ojo. Por defecto:
#   · abren UNA SEMANA ANTES de la semana 1 (para que el alumnado se aliste con margen),
#   · el registro de misiones (Bitácora) y el ticket cierran al ACABAR la última semana,
#   · y el CANJE aguanta UNA SEMANA MÁS: se reclama lo ganado cuando ya no se gana nada.
SEMANAS_PER = {"REGULAR": 15, "PUA": 8}   # duración del viaje, en semanas
# 🔴 La semana en que se abre el ARSENAL DE BATALLA (las recompensas de nota). Va aquí y no
# suelta en el catálogo para que el aviso del formulario y el bloqueo del servidor no puedan
# decir cosas distintas. Ver la nota larga en RECOMPENSAS.
SEMANA_ARSENAL = 15
SEMANAS_CANJE_EXTRA = 1                    # semanas de propina para reclamar recompensas
DIAS_APERTURA_ANTES = 0                    # los formularios abren el primer día de la semana 1

# Catálogo oficial de recompensas — [nombre, coste ◈, máx por alumno, descripción, desde semana, tipo]
# tipo: cromo · titulo · fondo · avatar · marco · avatar_exclusivo · avatar_url · nota
# Imagen de ejemplo que enseña el formulario de canje ANTES de confirmar cada recompensa.
# 🔴 Va aquí y NO en la pestaña RECOMPENSAS de la hoja: esa la edita el profesorado (coste, máximo,
# semana) y un nombre de fichero solo sería ruido para ellos. Se empareja por NOMBRE, y _build_site.py
# comprueba que las dos listas coinciden — si alguien renombra una recompensa y se olvida de esto, el
# build falla en vez de dejar la recompensa muda.
# Las montadas con arte propio y las generadas en Magnific salen de _build_img_formularios.py.
IMG_RECOMPENSA = {
 "Sobre de cromos":                                "sobre.jpg",
 "Cambiar 3 repetidos por un sobre":               "repetidos.jpg",
 "Título de recluta":                              "titulo.jpg",
 "Fondo de ficha: tu planeta":                     "planeta.jpg",
 "Marco dorado del avatar":                        "marco.jpg",
 "Héroe de la Rebelión":                           "heroe.jpg",
 "Subir 0,5 en un entregable":                     "nota_05.jpg",
 "Subir 1 punto en un entregable":                 "nota_1punto.jpg",
 "Recalificar un trabajo entregado fuera de plazo": "nota_plazo.jpg",
 "Recalificar un suspenso":                        "nota_suspenso.jpg",
}

RECOMPENSAS = [
 ("Sobre de cromos", 15, 99,
  "Una carta al azar de las 20 del álbum (4 series). Los tripulantes son comunes; los Ecos, NEBULA y el Capitán, raros; el Recluta y la Estática, épicos; y dos LEGENDARIOS: el General Vaeon (2 %) y Ander Vaeon, la identidad del villano, solo 1 de cada 100. Se abre solo y tu álbum está en la Nave.", 2, "cromo"),
 ("Cambiar 3 repetidos por un sobre", 0, 99,
  "¿Cartas repetidas? Cámbialas. Por cada 3 repetidas te llevas un sobre nuevo, gratis. No cuesta créditos y se comprueba solo: si no llegas a 3, se te avisa y no pierdes nada.", 2, "cromo_repes"),
 ("Título de recluta", 40, 3,
  "Un título narrativo bajo tu alias en el tablero y la Nave (elígelo en el formulario). Se aplica solo.", 3, "titulo"),
 ("Fondo de ficha: tu planeta", 35, 1,
  "Tu ficha de la Nave con el planeta que elijas de fondo (indícalo en el formulario). Se aplica solo.", 4, "fondo"),
 ("Marco dorado del avatar", 60, 1,
  "Tu avatar con marco y brillo dorados en el ranking y la Nave. Se aplica solo.", 6, "marco"),
 ("Héroe de la Rebelión", 60, 99,
  "Un héroe AL AZAR del vestuario: 30 figuras de la Rebelión en tres rangos. ⚔️ La Resistencia (56% del sobre): el grueso del ejército. 🔥 La Vanguardia (36%): van por delante, cuesta alcanzarlas. 🌟 Los MITOS (8%, ni uno de cada doce sobres): ni siquiera se dejan ver hasta que caen. Se acumulan —cuantos más tengas, más donde elegir— y te los pones gratis desde tu Nave.", 2, "heroe"),
 ("Subir 0,5 en un entregable", 550, 1,
  "⚔️ ARSENAL DE BATALLA · Medio punto más en una actividad ya entregada y corregida. "
  "🔴 LEE ESTO ANTES: si ya tienes la nota máxima de evaluación continua, esto NO te sube nada — "
  "estarías tirando 550 créditos a la basura. Comprueba tu nota primero. Con esos créditos cierras "
  "media docena de sobres o te llevas nueve héroes.", 15, "nota"),
 ("Subir 1 punto en un entregable", 850, 1,
  "⚔️ ARSENAL DE BATALLA · Un punto entero en una actividad ya entregada y corregida. "
  "🔴 LEE ESTO ANTES: si ya tienes la nota máxima de evaluación continua, no te sube nada y pierdes "
  "los 850 créditos. Es la recompensa más cara del catálogo a propósito: elegirla significa "
  "renunciar a casi todo lo demás.", 15, "nota"),
 ("Recalificar un trabajo entregado fuera de plazo", 700, 1,
  "⚔️ ARSENAL DE BATALLA · Que se te corrija un trabajo que entregaste tarde. No es un aprobado "
  "automático: es que se mire y se puntúe como si hubiera llegado a tiempo.", 15, "nota"),
 ("Recalificar un suspenso", 950, 1,
  "⚔️ ARSENAL DE BATALLA · Una segunda oportunidad sobre un trabajo suspenso: lo rehaces y se "
  "vuelve a corregir. Pensada para quien ha trabajado y se le atragantó una entrega.", 15, "nota"),
]
assert [n[0] for n in NIVELES] == list(range(1, 11)), "los niveles van del 1 al 10"
assert all(NIVELES[i][1] < NIVELES[i+1][1] for i in range(9)), "los umbrales de nivel deben crecer"


# ─────────────────────────── CÓMO SE HIZO · portada pública (11-sep) ───────────────────────────
# Petición de Norberto: contar en la web abierta cómo se ha hecho esto de verdad, y para qué sirvió
# cada herramienta. Los datos salen de KIT_PROYECTO.json, no de memoria:
#   · las imágenes de la serie v2 → OpenArt (nano-banana-2)
#   · el audio y el vídeo → Magnific/Freepik, donde viven además las ANCLAS de personaje
# 🔴 NO se nombra Genially aquí: la regla del proyecto es que en comunicación pública no se citan
# las herramientas del aula. Estas tres son de producción, no de aula, y las cita él a propósito.
#
# Los enlaces de referido los pasa Norberto cuando los tenga. Mientras el url esté vacío, la
# tarjeta se pinta igual pero SIN botón: mejor no enseñar un enlace que no lleva a ningún sitio.
# ─── EL DIRECTOR DE ORQUESTA Y LOS BRAZOS ───
# 🔴 Esta estructura NO es decorativa: es como funciona de verdad. OpenArt, Magnific y Hostinger no
# se hablan entre ellas — cada una habla con el centro. Una imagen no viaja de OpenArt a Magnific:
# vuelve a la conversacion y sale otra vez. Por eso el centro no es «una herramienta mas» y dibujarlo
# en fila, como si fueran cuatro iguales, contaba mal el proceso.
DIRECTOR = dict(
  clave="claude", logo="claude.png", titulo="Claude", papel="El director de orquesta",
  url="https://claude.ai/referral/pp8xmqpz3Q",
  entradilla="Todo pasa por aquí. No es un paso más de la cadena: es la cadena.",
  parrafos=[
    "Aquí se escribió <b>todo lo que no es una imagen</b>: la narrativa de los ocho planetas, quién "
    "es cada tripulante, los retos de cada tema, los mensajes semanales del foro, esta web entera, "
    "el sistema que lleva las cuentas del alumnado y el banco de pruebas que lo vigila.",
    "Pero lo que de verdad cambia las cosas es que <b>también dirige a las demás</b>. El prompt de "
    "cada imagen se escribe aquí, se envía a OpenArt sin salir de la conversación, vuelve la imagen, "
    "se mira, se dice «el casco más oscuro» y sale corregida. Lo mismo con las voces. Y el código "
    "que después junta esas imágenes y ese audio en un vídeo también se escribe aquí.",
    "<b>Por eso no es un paso que se pueda saltar.</b> OpenArt, Magnific y Hostinger no se hablan "
    "entre ellas: cada una habla con el centro. Una imagen no viaja sola de una a otra — vuelve a la "
    "conversación, se decide qué hacer con ella, y sale otra vez.",
  ],
  # 🔴 El contrapeso, y va DENTRO del bloque del director a proposito: si la pagina presume de
  # orquesta sin decir quien escribe la partitura, se convierte en publicidad.
  humano="Con una condición que conviene decir alto: <b>la partitura la escribe el docente</b>. Qué "
         "se cuenta, qué se evalúa, qué se tira a la basura porque no funcionaba. La orquesta toca; "
         "no decide qué obra se interpreta.",
)

# Los tres brazos. Salen del centro, no van en fila con él.
BRAZOS = [
  dict(clave="openart", icono="🎨", logo="openart.png", titulo="OpenArt", papel="El mundo dibujado",
       url="",
       texto="De aquí salieron <b>las imágenes</b>: los ocho planetas, la Tripulación Cero, las "
             "portadas de cada tema, las 24 insignias y las 20 cartas del álbum. Con "
             "<b>nano-banana</b>, elegido por una razón práctica: acepta una imagen de "
             "referencia y respeta el encuadre 16:9 sin recortar por su cuenta — que es lo que "
             "hace falta cuando el plano tiene que encajar en un montaje."),
  dict(clave="magnific", icono="🎬", logo="magnific.svg", titulo="Magnific", papel="La voz y el movimiento",
       url="https://referral.magnific.com/mzW6daB",
       texto="Puso <b>las voces</b> de los personajes y <b>los clips de vídeo</b>. Y algo que no se "
             "ve pero se nota: las <b>anclas</b> de personaje, que son las que hacen que NEBULA sea "
             "la misma en los diecisiete vídeos y no una parecida en cada plano."),
  # 🔴 El cuarto pilar. No es una herramienta de creación como las otras tres —no habla por MCP con
  # nadie— pero sin ella no habría web: es donde vive todo. Comprobado en la cabecera HTTP del
  # propio sitio (`platform: hostinger`), no supuesto.
  dict(clave="hostinger", icono="🌍", logo="hostinger.png", titulo="Hostinger", papel="Donde vive todo",
       url="https://www.hostinger.com/es?REFERRALCODE=TH1MRCUARNEM",
       texto="La web que estás leyendo, el panel del profesorado y la Nave del alumnado están "
             "alojados aquí. Es la pieza menos vistosa de las cuatro y la única sin la que nada de "
             "esto existiría: sin un sitio donde vivir, un proyecto así se queda en una carpeta del "
             "ordenador."),
]

# ─────────────────────────── EL PROCESO, PASO A PASO (11-sep) ───────────────────────────
# 🔴 TODO ESTO SALE DE LOS FICHEROS DE PRODUCCIÓN, no de la memoria ni de una version bonita:
#   · CASTING_CERO.md ......... las 9 voces con su id de ElevenLabs, y los DOS recasts
#   · NARRATIVA_STARGARTE §8 .. el sufijo de estilo literal y el reparto de herramientas
#   · KIT_PROYECTO.json ....... las anclas y de donde salieron
#   · Videos Narrativa/ ....... 42 carpetas de montaje, 92 masters, 587 planos, 64 pistas de voz
#   · kenburns.py ............. el motor de imagen→video (Ken Burns 8K, grado, glitch de Vaeon)
# Si algun dia cambian, se actualiza AQUI y la web sola. Nada de numeros a mano en el HTML.
PROCESO = [
  dict(n="1", t="Una idea dicha en voz alta",
       x="No empezó con un guion: empezó con «quiero que la asignatura sea un viaje por ocho "
         "planetas». A partir de ahí, conversando: quién narra, quién es el enemigo, por qué el "
         "portfolio es el arma. Lo que no funcionaba se tiraba y se volvía a empezar — y eso pasó "
         "más de una vez."),
  dict(n="2", t="El casting: nueve voces con nombre y apellidos",
       x="Cada tripulante tiene una voz elegida a mano en <b>ElevenLabs</b> (dentro de Magnific), "
         "con acentos de varios países <b>a propósito</b>: la Tripulación Cero se reclutó por todo "
         "el mundo. Y hubo <b>recasts</b>: Amara Sol se rehízo entera con una voz colombiana nativa "
         "porque la primera no sonaba de allí, y para Noa Lieth se descartaron dos antes de dar "
         "con la buena."),
  dict(n="3", t="Las anclas: que el personaje sea el mismo en todos los planos",
       x="Este es el problema que hunde la mayoría de los intentos: pides dos imágenes del mismo "
         "personaje y salen dos personas distintas. Se resuelve con <b>anclas</b> en Magnific — "
         "NEBULA, Vaeon, la nave y los ocho planetas—, creadas <b>subiendo los originales</b>, no "
         "regenerándolos. Y una regla aprendida a base de fallos: si en un plano hay varios "
         "personajes, hay que pasar <b>todas</b> las anclas, o el modelo se inventa al otro."),
  dict(n="4", t="Las imágenes",
       x="Generadas en <b>OpenArt</b> con un sufijo de estilo fijo, palabra por palabra, en todas: "
         "<i>«cinematic sci-fi, dark teal and electric blue palette, amber accents, volumetric "
         "light, full-frame no letterbox, 16:9»</i>. Esa repetición es la que hace que ocho "
         "planetas distintos parezcan la misma galaxia."),
  dict(n="5", t="De imagen quieta a vídeo",
       x="Las imágenes no se quedan quietas: un motor propio les da <b>paneo real</b> —no solo "
         "zoom— sobre un lienzo enorme para que no tiemblen, más grado de color teal y ámbar, "
         "viñeta de cine y fundidos encadenados. Los planos de Vaeon llevan además un "
         "<b>glitch</b>: no es decoración, es la Estática comiéndose la imagen."),
  dict(n="6", t="La voz manda sobre el montaje",
       x="Primero la narración, después las imágenes. Cada plano dura lo que dura la frase que lo "
         "acompaña, y los subtítulos se cuadran con los tiempos que detecta <b>Whisper</b> — pero "
         "el texto que se lee es el del guion, no lo que la máquina creyó oír."),
  dict(n="7", t="Y muchos borradores",
       x="Esta es la parte que no se enseña nunca: para las piezas publicadas hay <b>{piezas} "
         "carpetas de montaje</b> en el disco. Hay un «opening» y un «opening-v2» uno al lado del "
         "otro. La serie entera se rehízo una vez, de v1 a v2, cuando quedó claro que cada planeta "
         "necesitaba entrada y cierre por separado en vez de un vídeo único."),
]
# Los numeros se leen del disco al construir la web (ver _build_site.py): si manaña hay mas planos,
# la cifra cambia sola. Un dato, un sitio.
PROCESO_CIFRAS = [
  ("{piezas}", "carpetas de montaje", "para 17 piezas publicadas"),
  ("{masters}", "imágenes master", "los originales de personajes y lugares"),
  ("{planos}", "planos", "repartidos por todas las piezas"),
  ("{voces}", "pistas de voz", "narración y fragmentos de la Cero"),
]

# El casting, tal cual está en CASTING_CERO.md. Se publican los NOMBRES de las voces y su acento,
# no los ids internos de ElevenLabs: al lector le dicen algo los primeros y nada los segundos, y los
# ids cambian si algún día hay recast. (nombre, papel, voz, acento/nota)
CASTING = [
  ("NEBULA",        "La IA de la nave · narradora",  "Voz fija de la serie", "narra los diecisiete vídeos"),
  ("Bran Okafor",   "El Forjador",                   "Pablo Ortega",   "grave, lento, suave"),
  ("Tomás Reyer",   "El Cronista",                   "Javier Olmedo",  "medio-grave, íntimo"),
  ("Sylla Bren",    "La Rastreadora",                "Martina Rossi",  "firme sin perder suavidad"),
  ("Amara Sol",     "La Operadora",                  "Sofía Ramírez",  "colombiana nativa · <b>recast</b>: la primera no sonaba de allí"),
  ("Vera Khal",     "La Médica",                     "Emilia Álvarez", "serena, culta"),
  ("Joran Pike",    "El Ingeniero-jugador",          "Iván Mendoza",   "joven, con chispa"),
  ("Cap. Mara Voss","El Mando",                      "Isabel Ríos",    "autoridad sincera"),
  ("Noa Lieth",     "La Arquitecta",                 "Ana Beltrán",    "castellana dulce · se descartaron <b>dos</b> antes"),
  ("Vaeon",         "El antagonista",                "Manuel Ferrer",  "la misma voz desde el primer día"),
]

# ─────────────────────────── PASOS · «Cómo se hace» (v3.43) ───────────────────────────
# La sección de la web que sustituye a los tres vídeos de onboarding. Idea de Norberto
# (9-sep): en vez de grabar vídeos que envejecen con cada cambio de pantalla, una sección
# con capturas + la voz del Capitán, que se regenera con un `python3 _build_site.py`.
#
# 🔴 UN DATO, UN SITIO. El texto de `voz` es a la vez:
#   · lo que se LEE en la página,
#   · lo que se NARRA en el audio del Capitán (voz 562, la misma de la serie),
#   · y el guion si algún día se graba en vídeo.
# Cambiar el texto aquí cambia las tres cosas. El audio se regenera solo para los pasos
# cuyo texto haya cambiado (`_audio_pasos.py` guarda el hash de cada uno).
#
# 🔴 Al escribir `voz`: NADA de etiquetas tipo «Capitán:» — la voz las lee en alto.
#    Lección cara de la serie: costó regenerar siete cierres.
#
# `img`  = nombre del PNG en assets/img/pasos/ (lo genera `_capturas_pasos.py`).
#          None = captura que necesita una sesión de Google que el script no tiene;
#          la página lo marca en ámbar y el build avisa.
# `pose` = pose del Capitán: saluda · pensativo · tablet · brazos · senala · pulgar

PASOS = [
 dict(
  id="referente", icono="🛰️", titulo="Si creas el grupo",
  quien="El profe <b>referente</b>: una persona por curso. Crea el PER y reparte las llaves.",
  cuanto="Nueve pasos · se hacen UNA vez por grupo",
  porque="Todo esto vive dentro de la hoja maestra, en la cuenta <b>mutecdgami</b>. Es la única "
         "parte del sistema que no se puede enseñar desde la web, así que va con capturas.",
  pasos=[
   dict(cod="R1", t="La sala de máquinas", pose="saluda", img="r1_menu.png",
    hacer="Hoja maestra → pestaña <code>PERs</code> → menú <b>STARGATE</b> desplegado.",
    voz="Esto es la sala de máquinas de STARGATE. Es una hoja de cálculo, y desde ese menú se hace "
        "todo. Si eres el profe referente de tu grupo, esta página es para ti. Son nueve pasos, y "
        "luego casi no vuelves por aquí."),

   dict(cod="R2", t="Lo primero: el parte de salud", pose="tablet", img="r2_salud.png",
    hacer="Menú <b>STARGATE → Parte de salud del sistema</b>.",
    voz="Antes de crear nada, esto. El parte de salud revisa el sistema entero y te dice en verde, "
        "ámbar o rojo qué está bien y qué no. Cuando algo falla, además te dice cómo se arregla. "
        "Empieza siempre por aquí, y vuelve cuando algo se comporte raro."),

   dict(cod="R3", t="Crear el grupo", pose="pensativo", img="r3_crear.png",
    hacer="Menú <b>STARGATE → Crear nuevo PER…</b> y rellenar el diálogo.",
    voz="Un PER es un grupo: un curso concreto con su gente y su calendario. El nombre es para ti. "
        "El tipo cambia el ritmo, porque REGULAR son quince semanas y PUA va comprimido. Y la fecha "
        "de la semana uno es la pieza importante: de ella dependen el foro, los desbloqueos de la "
        "Nave y las recompensas. Ponla bien y olvídate."),

   dict(cod="R4", t="Lo que aparece solo", pose="brazos", img=None,
    hacer="Pulsa <b>Crear</b> y espera. Al terminar sale un diálogo con todo lo creado.",
    voz="Un minuto de paciencia. En ese minuto el sistema crea los tres formularios del grupo, el "
        "tablero en vivo, la Nave del recluta, el foro dinámico y un documento con todos los "
        "enlaces. No hay que configurar nada más: ya está funcionando."),

   dict(cod="R5", t="El documento de enlaces", pose="senala", img="r5_doc.png",
    hacer="Ábrelo desde el diálogo, o menú <b>STARGATE → Documento de enlaces y embeds</b>.",
    voz="Este documento es lo único que tienes que repartir, y está partido en dos. Lo de arriba, "
        "con el visto verde, es lo que puedes dar al alumnado sin miedo. Lo de abajo, con el "
        "candado, es solo para el profesorado: lleva dentro el enlace a la hoja maestra. No mandes "
        "el documento entero a una clase."),

   dict(cod="R6", t="Las dos llaves", pose="pensativo", img="r6_pin.png",
    hacer="Menú <b>STARGATE → Cambiar PIN del profesorado</b> y <b>→ PIN del profesor referente</b>.",
    voz="Hay dos llaves. El PIN del profesorado lo repartes entre quienes dan clase, y les abre su "
        "sala y los tickets. El de referente te lo quedas tú, y es el que permite tocar el grupo "
        "entero: mover la semana uno, cerrar formularios, archivar. Cámbialos los dos antes de que "
        "entre nadie de verdad."),

   dict(cod="R7", t="Repartir sin perseguir a nadie", pose="tablet", img="r7_dossier.png",
    hacer="Menú <b>STARGATE → Dossier del profesorado</b>, y después <b>Enviar el dossier por correo</b>.",
    voz="En vez de mandar enlaces uno a uno, el dossier reúne todos los grupos y a cada docente le "
        "llega por correo lo suyo. Si alguien lo pierde, se vuelve a mandar y ya está."),

   dict(cod="R8", t="Cuando el curso acaba", pose="senala", img="r8_ciclo.png",
    hacer="Selecciona la fila del grupo → menú <b>STARGATE → Ciclo de vida del PER</b>.",
    voz="Cuando un grupo termina, se archiva: cierra los formularios, lo quita de en medio y "
        "conserva todos los datos. Borrar es otra cosa, y se lleva los formularios por delante, "
        "así que te pide escribir el nombre del grupo para asegurarse. Archivar es lo normal."),

   dict(cod="R9", t="Y ya está", pose="pulgar", img="r9_pers.png",
    hacer="Vuelve a la pestaña <code>PERs</code>: ahí vive tu grupo.",
    voz="A partir de aquí esto funciona solo. El alumnado se registra, el tablero se actualiza y a "
        "quien da clase le llega lo suyo. Si algo va raro, el parte de salud. Nos vemos arriba."),
  ]),

 dict(
  id="imparte", icono="🎓", titulo="Si das las clases",
  quien="Quien <b>imparte</b>. Recibes el PIN y el documento de enlaces de tu referente.",
  cuanto="Seis pasos · cuatro de ellos son lo que harás cada semana",
  porque="Corto a propósito. La <b>visita guiada</b> del Capitán ya te cuenta la narrativa, los retos "
         "y las insignias — púlsala arriba a la derecha. Aquí está solo lo que se hace cada semana.",
  pasos=[
   dict(cod="D1", t="El atajo que deberías usar primero", pose="saluda", img="d1_portada.png",
    hacer="Portada de la web → botón <b>▶ Visita guiada</b>, arriba a la derecha.",
    voz="Bienvenido al puesto de mando. Antes de nada, ese botón de arriba a la derecha. La visita "
        "guiada te cuenta en cinco minutos qué es STARGATE, cómo funcionan los retos y qué hace "
        "cada insignia, y te pregunta si eres referente para enseñarte más cosas o menos. Hazla "
        "cuando termines esta página. Aquí voy a enseñarte solo las cuatro cosas que harás cada semana."),

   dict(cod="D2", t="Uno: la orden de la semana", pose="senala", img="d2_cronologia.png",
    hacer="<b>Cronología</b> → despliega la semana que toque → abajo, botón <b>Copiar</b> del foro.",
    voz="La cronología es tu carta de navegación: quince semanas, y cada una te dice qué vídeo "
        "proyectar, qué reto lanzar y qué insignia entregar. Abajo del todo está el mensaje del "
        "foro, ya escrito. Lo copias, lo pegas en el foro de la plataforma de UNIR y sigues con tu vida."),

   dict(cod="D3", t="Dos: tu sala", pose="tablet", img="d3_sala.png",
    hacer="<b>Mi clase</b> → PIN → pulsa cualquier alumno para abrir su ficha completa.",
    voz="Esta es tu sala, y solo sale tu alumnado, no el del grupo entero. Si pulsas a cualquiera "
        "se abre su ficha completa: lo que lleva hecho, sus insignias, sus créditos y su correo, "
        "por si tienes que escribirle. Desde aquí también puedes darle o quitarle un reto a mano "
        "cuando algo se tuerza."),

   dict(cod="D4", t="Tres: el pase de lista", pose="brazos", img="d4_pase.png",
    hacer="En tu sala, bloque del <b>pase de lista</b> → <b>Abrir</b>. Sale una palabra de cuatro letras.",
    voz="Si das clase en directo, esto. Abres la ventana y en tu pantalla sale una palabra de cuatro "
        "letras. Quien está en clase la escribe en su Nave y cobra unos créditos. La palabra no "
        "viaja a ningún sitio: solo la ve quien te está mirando. Es simbólico, pero funciona."),

   dict(cod="D5", t="Cuatro: los tickets", pose="pensativo", img="d5_tickets.png",
    hacer="<b>Tickets</b> → PIN → pulsa cualquier valoración para verla en grande.",
    voz="El ticket de salida es tu termómetro, y es anónimo, así que la gente dice lo que piensa de "
        "verdad. Pulsa cualquier resultado y se ve en grande. Y hay una versión apaisada pensada "
        "para proyectarla en clase: enseñar lo que ha votado el grupo genera más conversación que "
        "preguntarlo en voz alta."),

   dict(cod="D6", t="Lo único que el sistema no hace por ti", pose="pulgar", img="d6_tablero.png",
    hacer="El tablero en vivo, con los tres rankings.",
    voz="Y una cosa más, que no está en ninguna pantalla. Los puntos los da el sistema; la ceremonia "
        "la haces tú. Nombra en voz alta a quien recupera un personaje. Enseña el ranking en clase de "
        "vez en cuando. Eso es lo que convierte una tabla en un juego."),
  ]),

 dict(
  id="estudiante", icono="🧑‍🚀", titulo="Si eres recluta",
  quien="El <b>alumnado</b>. Pon el enlace de esta pestaña en el Genially del tema 1 y en el foro de la semana 1.",
  cuanto="Ocho pasos · el segundo es el que importa de verdad",
  porque="Corto porque nadie lee instrucciones largas. Tiene un objetivo por encima de todos: que se "
         "alisten con la cuenta correcta. Es <b>el fallo más caro del sistema</b> — quien un día entra "
         "con otra cuenta desaparece de su Nave con media misión hecha.",
  pasos=[
   dict(cod="E1", t="Esto es tuyo", pose="saluda", img="e1_nave.png",
    hacer="La Nave del recluta, todavía sin identificar.",
    voz="Esto es tu nave. Ahora mismo está vacía porque todavía no te has alistado. En dos minutos "
        "vas a tener aquí tu personaje, tus puntos y tus insignias. Sígueme."),

   dict(cod="E2", t="La cuenta. Lo único que puede salir mal", pose="senala", img="e2_cuenta.png",
    aviso=True,
    hacer="Abre la <b>Bitácora de mando</b> y mira <b>arriba del todo</b>: ahí sale tu cuenta de Google.",
    voz="Para. Esto es lo único importante de toda la página. Arriba del todo ves con qué cuenta de "
        "Google has entrado. Tu progreso se guarda en esa cuenta. En esa, no en el correo que "
        "escribas más abajo. Si un día entras con otra, la nave no te encontrará y habrás perdido lo "
        "que llevabas. Usa siempre la misma. Míralo ahora, antes de seguir."),

   dict(cod="E3", t="Alistarse", pose="tablet", img="e3_alistarse.png",
    hacer="En «¿QUÉ QUIERES HACER HOY?» elige <b>ALISTARME</b>. Alias, personaje, docente y biografía.",
    voz="Alistarme, que es la primera vez. El alias es tu nombre público: es el que sale en el "
        "tablero, tu nombre real solo lo ve el profesorado. Eliges personaje, dices quién te da "
        "clase, y escribes una biografía. La biografía la va a leer tu clase cuando pulse tu nombre "
        "en el ranking, así que dedícale diez segundos."),

   dict(cod="E4", t="Tu primer reto", pose="brazos", img="e4_reto.png",
    hacer="«¿Quieres registrar algún reto ahora?» → <b>Sí</b> → <b>Planeta 1</b> → marca la casilla y pega el enlace.",
    voz="Y ya que estás, el primer reto. Preséntate a tu tripulación, que es un vídeo de sesenta "
        "segundos. Marcas la casilla solo cuando lo tengas hecho de verdad, pegas el enlace y "
        "envías. Un aviso importante: es el mismo enlace para siempre. Cada vez que termines algo "
        "vuelves aquí, marcas la casilla nueva y envías. Lo de antes no se borra nunca."),

   dict(cod="E5", t="Vuelve a la nave", pose="pensativo", img="e5_ficha.png",
    hacer="Abre la Nave y pon tu correo una sola vez. Ahí está tu ficha.",
    voz="Ahora vuelve a la nave y pon tu correo, una sola vez. Ahí está: tu personaje, tu nivel y "
        "tus puntos. Y la primera insignia, la de NEBULA, que no se regala por alistarse: hay que "
        "ganarla con el primer reto. Tu personaje cambia de aspecto según subes de nivel."),

   dict(cod="E6", t="Las seis pestañas", pose="senala", img="e6_pestanas.png",
    hacer="Arriba: <b>Mi ficha · Mis retos · Esta semana · Los planetas · Recompensas · El tablero</b>.",
    voz="Seis pestañas. Mi ficha eres tú. Mis retos, lo que llevas y lo que te falta. Esta semana, lo "
        "que toca ahora. Los planetas son los ocho temas, y se van abriendo con el calendario. "
        "Recompensas es la tienda. Y el tablero es la clase entera: si pulsas a alguien ves su "
        "personaje y su biografía."),

   dict(cod="E7", t="Dos marcadores, no uno", pose="tablet", img="e7_premios.png",
    hacer="Pestaña <b>Recompensas</b>: el catálogo con sus precios.",
    voz="Y una cosa que confunde a todo el mundo: hay dos marcadores. Los xp suben de nivel y no se "
        "gastan nunca. Los créditos son dinero, y sí se gastan. Aquí eliges en qué. Hay cosas de "
        "adorno y cosas que tocan tu nota, así que piensa antes de fundirte el sueldo en un marco dorado."),

   dict(cod="E8", t="Bienvenido a bordo", pose="pulgar", img="e8_tablero.png",
    hacer="El tablero de la clase: pulsa a cualquiera para ver su ficha.",
    voz="Eso es todo. Recuerda las dos reglas: siempre la misma cuenta de Google, y siempre el mismo "
        "enlace. Bienvenido a bordo, recluta."),
  ]),
]

assert len({p["id"] for p in PASOS}) == 3, "los tres caminos deben tener id distinto"
assert all(len({s["cod"] for s in c["pasos"]}) == len(c["pasos"]) for c in PASOS), "codigos repetidos"
