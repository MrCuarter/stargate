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
      lanza=["Reto «Preséntate a tu tripulación» (vídeo 60 s)", "Reto A «El boceto sin quemar» (Bran)", "Reto B «La Bitácora en marcha» (tu ePortfolio)"],
      insignias=["E1_nebula","H1_reclutamiento"],
      hito="Presentación ante el mando · Bitácora de la semana: un recurso multimedia con IA",
      clases="Clases 01–02",
      consejo="Preséntate como Capitán y reparte la insignia de Reclutamiento en público. El Opening puede abrir cada clase."),
 dict(sem=2, tema="Tema 1 (cont.) · Fôrge", sub="Actividad 1",
      capitulo=None,
      videos=[("act1","Al lanzar la Actividad 1"),
              ("t1c","Al cerrar el trabajo del planeta"),
              ("f1","Justo tras el cierre: la recompensa del bloque")],
      lanza=["Actividad 1 — actividad didáctica a partir de una imagen con IA", "Reto ⚡ «La chispa y la marca» (imagen con IA + logo) — en clase, 15 min"],
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
      lanza=["Reto ⚡ «Módulo 1 y módulo 2» (antes y durante) — en clase, 15 min"], insignias=["P2_tomas","R2_el-eco-que-ensena"],
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
      lanza=["Actividad 2 — planifica y crea un paisaje de aprendizaje", "Reto ⚡ «Cinco líneas que explican» (itinerario y paisaje) — en clase, 15 min"],
      insignias=["P3_sylla","R3_la-matriz"],
      hito="Presenta la Act. 2 · Test del Tema 3 · Bitácora: itinerario o paisaje", clases="Clases 08–09",
      consejo="La Act. 2 se presenta ahora y se resuelve en la semana 13: recuérdalo para que no la dejen morir."),
 dict(sem=7, tema="Tema 4 · Reliae", sub="M-learning",
      capitulo="Estableciendo comunicaciones",
      videos=[("t4i","Al abrir el Tema 4")],
      lanza=["Reto A «Abre el canal» (Amara)", "Reto B «El entorno de aula» (aula virtual)"],
      insignias=[], hito="Compartir de forma organizada", clases="Clase 10",
      consejo="Primero compartir ordenado (Sites/Classroom/Moodle); la comunicación viva llega la semana que viene."),
 dict(sem=8, tema="Tema 4 (cont.) · Reliae", sub="El entorno digital de aula",
      capitulo=None,
      videos=[("t4c","Al cerrar el bloque"),("f4","Tras el cierre")],
      lanza=["Reto ⚡ «Enlace en incógnito» — en clase, 10 min"], insignias=["P4_amara","R4_entorno-de-aula"],
      hito="Test del Tema 4 · Bitácora: tu entorno de aula", clases="Clase 11",
      consejo="La lección de Amara (compartir a tiempo, pulir después) es oro contra el perfeccionismo del alumnado."),
 dict(sem=9, tema="Tema 5 · Umbral", sub="Evaluación y ePortfolio — aparece la Estática",
      capitulo="Evaluando la situación",
      videos=[("t5i","Al abrir el Tema 5 (¡aparece Vaeon!)"),
              ("t5c","Al cerrar el bloque"),("f5","Tras el cierre")],
      lanza=["Reto A «Mide con método» (Vera)", "Reto B «La Bitácora medida» (web de recursos + rúbrica)", "Reto ⚡ «Tres preguntas» (autoevaluación) — en clase, 15 min"],
      insignias=["P5_vera","R5_bitacora-medida"],
      hito="Resolución de la Act. 1 · Test del Tema 5", clases="Clase 12",
      consejo="El momento dramático del curso: justo cuando saben medir, aparece el enemigo que silencia. Y se resuelve la Act. 1."),
 dict(sem=10, tema="Tema 6 · Ludo", sub="Aprendizaje Basado en el Juego (ABJ)",
      capitulo="Aprender jugando",
      videos=[("t6i","Al abrir el Tema 6"),
              ("t6c","Al cerrar el bloque"),("f6","Tras el cierre")],
      lanza=["Reto A «El Simulador de Joran» (batalla de preguntas, Joran)", "Reto B «El juego» (juego digital educativo)"],
      insignias=["P6_joran","R6_el-juego"],
      hito="Test del Tema 6 · Bitácora: un juego digital", clases="Clases 13–14",
      consejo="En Ludo SE JUEGA: el juego es la actividad. Fija ya la diferencia con lo que viene en Vínculo."),
 dict(sem=11, tema="Tema 7 · Vínculo", sub="Gamificación",
      capitulo="El arte de motivar",
      videos=[("t7i","Al abrir el Tema 7")],
      lanza=["Reto A «Un porqué» (Mara)", "Reto B «La microgamificación»", "Reto ⚡ «Las diez líneas» (justifica un recurso) — en clase, 15 min"],
      insignias=[], hito="Microgamificación en marcha", clases="Clase 15",
      consejo="Aquí NO se juega: se toman elementos del juego. Es el error conceptual más común del curso — apóyate en Joran y Mara."),
 dict(sem=12, tema="Tema 7 (cont.) · Vínculo", sub="Gamificación profunda",
      capitulo=None,
      videos=[("t7c","Al cerrar el bloque"),("f7","Tras el cierre")],
      lanza=["Reto ⚡ «El marcador» (tabla de clasificación) — en clase, 10 min"], insignias=["P7_mara","R7_microgamificacion","E3_vaeon"],
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
      lanza=["Reto ⚡ «El QR» (dentro de una lámina) — en clase, 10 min"], insignias=["P8_noa","R8_ultimo-umbral","H4_tripulacion-cero"],
      hito="Test del Tema 8 · la Tripulación Cero queda completa", clases="Clase 18",
      consejo="Con Noa se completa la Cero (insignia de hito Tripulación Cero). Deja el finale para la última semana."),
 dict(sem=15, tema="Repaso · La liberación", sub="Simulacro y salto final",
      capitulo="La liberación",
      videos=[("finale","La revelación: la verdad de la Cero (sin resolución)"),
              ("plan","El Capitán presenta el examen: la batalla ES el examen"),
              ("f9","Tras el examen/el cierre: el epílogo de Vaeon")],
      lanza=["Reto «El simulacro del examen» (90 minutos de reloj, en la clase de repaso)"], insignias=["H5_la-liberacion"],
      hito="Repaso + simulacro del examen · Bitácoras publicadas", clases="Clases 19–20",
      consejo="Celebra las Bitácoras publicadas: son el producto real del curso. El Fragmento Prohibido es el regalo final."),
]

# ---------- Plantilla Genially del ePortfolio (la Bitácora) ----------
# Enlace público de la plantilla de Genially que el alumnado puede reutilizar.
PLANTILLA_EPORTFOLIO = "https://view.genially.com/695f825d05cc22f3f7fac45b"

# ---------- Geniallys (rellenar cuando haya enlaces) ----------
# 15-sep · el paquete del equipo en Drive (mutecdgami): se comparte SOLO LECTURA con cada docente que se añade a un
# grupo (lo hace el Mando cada día: mando/buzon.cjs compartir-drive). Hasta entonces, «pídesela a tu referente».
DRIVE_EQUIPO = "https://drive.google.com/drive/folders/1Dp0il1ZQq8Cw8St0Pue_cwlabLAot6e7"
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
        # {tablero} -> el RANKING PÚBLICO del grupo (el foro dinámico sustituye el id solo; en la
        # copia estática, el profe pone el id de su PER). 🔴 13-sep · con `solo=1`: sin él, el enlace
        # llevaba a la página del método, que está tras la puerta del profesorado, y el alumnado que
        # lo pulsaba desde el foro se daba con «Material del profesorado».
        cuerpo = cuerpo.replace("{tablero}", "https://stargate.mistercuarter.es/registro.html?solo=1&per={id-del-PER}")
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
 ("V",   "Serie V · La caída de Vaeon",   "Cómo un buen hombre acabó siendo el enemigo"),
]
# Insignia por completar una SERIE entera (§12.5). El álbum completo (26 cartas) no es
# meta realista; una serie sí. Van en un campo aparte del tablero (insignias_album), NUNCA entre las
# 24 de la misión: ese contador se pinta como «n/24» en cuatro sitios y dejaría de ser cierto.
SERIES_ALBUM = [
 ("A1_tripulacion", "I",   "La Tripulación Cero al completo"),
 ("A2_ecos",        "II",  "Los Ecos al completo"),
 ("A3_nave",        "III", "La Nave al completo"),
 ("A4_sombra",      "IV",  "La Sombra al completo"),
 # 🔴 12-sep · EL ARCO DE VAEON. Petición de Norberto: «la historia cronológica de Vaeon, desde su
 # infancia, su evolución hasta convertirse en el malo malvado; ver cómo se va corrompiendo en cada
 # carta». Seis, no diez: con veinte cromos ya cuesta completar el álbum y veinte más lo harían
 # imposible. Y seis bastan para que la corrupción se LEA de un vistazo en la rejilla.
 # Resuelve además un agujero de la narrativa: hasta ahora Vaeon aparecía de golpe en la semana 9
 # sin que nadie supiera de dónde salía. Ahora su caída se cuenta sin un vídeo más.
 ("A5_caida",       "V",   "La caída de Vaeon al completo"),
]
# [clave, nombre en el álbum, serie, rareza, peso] · los pesos suman 100
CROMOS = [
 ("P1_bran",        "Bran Okafor",                    "I",     "común",        5),
 ("P2_tomas",       "Tomás Reyer",                    "I",     "común",        5),
 ("P3_sylla",       "Sylla Bren",                     "I",     "común",        5),
 ("P4_amara",       "Amara Sol",                      "I",     "común",        5),
 ("P5_vera",        "Vera Khal",                      "I",     "común",        5),
 ("P6_joran",       "Joran Pike",                     "I",     "común",        5),
 ("P7_mara",        "Mara Voss",                      "I",     "común",        5),
 ("P8_noa",         "Noa Lieth",                      "I",     "común",        5),
 ("L1_lena",        "Lena Reyer",                     "II",    "rara",         3),
 ("L2_kel",         "Kel Bren",                       "II",    "rara",         3),
 ("L3_copistas",    "Los Copistas de Fôrge",          "II",    "rara",         3),
 ("L4_ilan",        "Ilan Kesh",                      "II",    "rara",         3),
 ("L5_ruta_azul",   "Los Niños de la Ruta Azul",      "II",    "rara",         3),
 ("L6_oren",        "Oren Vash",                      "II",    "rara",         3),
 ("E1_nebula",      "NEBULA",                         "III",   "rara",         5),
 ("E2_capitan",     "El Capitán",                     "III",   "rara",         5),
 ("N1_recluta",     "El Recluta",                     "III",   "épica",        3),
 ("S2_estatica",    "La Estática",                    "IV",    "épica",        4),
 ("E3_vaeon",       "General Vaeon",                  "IV",    "LEGENDARIA",   2),
 ("S1_ander",       "Ander Vaeon",                    "IV",    "LEGENDARIA",   1),
 ("V1_nino",        "Ander, el niño que preguntaba",  "V",     "común",        6),
 ("V2_aprendiz",    "Ander, el aprendiz",             "V",     "común",        5),
 ("V3_archivista",  "Ander, Archivista Mayor",        "V",     "rara",         4),
 ("V4_noche",       "La noche de la Estática",        "V",     "rara",         3),
 ("V5_relectura",   "La relectura",                   "V",     "épica",        3),
 ("V6_sello",       "El primer sello",                "V",     "LEGENDARIA",   1),
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

# ─────────────────────────── LOS LOGROS DE A BORDO (15-sep, noche) ───────────────────────────
# Norberto: «un tipo de insignia, reconocimiento o premio a medida que vayan usando la plataforma: la
# primera vez que compran algo en el mercado, cuando colocan algo en el zoco, su primera venta, su primer
# avatar, los primeros retos…», «un avatar y una carta personalizada, especial, legendaria, que se consigue
# solo al completar todos» y «piensa también en entrar días consecutivos… si puede haber varias
# recompensas relacionadas con conjuntos de hitos concretos, hazlo».
# 16 hitos (la PRIMERA vez que se hace algo) en 5 cubiertas de la Nave; cada cubierta completa trae su
# premio, y las cinco, el CONTRAMAESTRE DE LA NAVE (héroe legendario, él y ella, y una carta legendaria
# con tu alias). Ninguno da xp: la xp ordena lo aprendido, no lo usado.
# 🔴 Lo decide el servidor (GamificaPro, functions/stargateABordo.js + stargateHitos.js): claves,
# cubiertas y premios tienen que decir lo MISMO allí y aquí — la batería 79 los compara.
# 🔴 El «tiempo conectado» NO está, a propósito: una pestaña olvidada contaría igual que una tarde de
# trabajo, y medir cuánto rato pasa cada persona conectada es vigilar. Los días a bordo sí: se cuenta
# UNA visita por día, en la zona horaria de cada cual (hay alumnado a los dos lados del Atlántico).
#   cubierta: (clave, nombre, de qué va, premio {tipo: sobre | capsula | creditos, n})
CUBIERTAS_A_BORDO = [
 ("puente",     "El puente",         "Los retos y tu tripulación",     {"tipo": "sobre"}),
 ("mercado",    "El Mercado",        "Tu colección",                   {"tipo": "creditos", "n": 25}),
 ("camarote",   "El camarote",       "Tu imagen",                      {"tipo": "sobre"}),
 ("zoco",       "El Zoco",           "El trueque",                     {"tipo": "capsula"}),
 ("constancia", "La constancia",     "Los días a bordo",               {"tipo": "creditos", "n": 30}),
]
#   hito: (clave, cubierta, icono, título, qué hay que hacer, pestaña de la Nave donde se hace)
HITOS_A_BORDO = [
 ("reto",       "puente",     "🚀", "Primer salto",          "Registra tu primer reto.",                                   "retos"),
 ("reflexion",  "puente",     "✍️", "Tu voz",                "Escribe tu primera reflexión en un reto.",                   "retos"),
 ("comentario", "puente",     "💬", "Eco de la tripulación", "Comenta la reflexión de alguien de tu tripulación.",         "retos"),
 ("compra",     "mercado",    "🛒", "Primera compra",        "Compra algo en el Mercado Estelar.",                         "mercado"),
 ("carta",      "mercado",    "🃏", "Primera carta",         "Consigue tu primera carta del álbum.",                       "mercado"),
 ("heroe",      "mercado",    "🛡️", "Un héroe a tu lado",    "Consigue tu primer héroe de la Rebelión.",                   "mercado"),
 ("sorteo",     "mercado",    "🎟️", "Boleto dorado",         "Consigue una participación del Gran Sorteo.",                "mercado"),
 ("viste",      "camarote",   "🎭", "Otra cara",             "Ponte uno de tus héroes como avatar.",                       "botin"),
 ("skin",       "camarote",   "🧬", "Has evolucionado",      "Ponte una skin que hayas desbloqueado al subir de nivel.",   "botin"),
 ("adorno",     "camarote",   "✨", "Con estilo",            "Ponte un título, un marco o un fondo.",                      "botin"),
 ("cambio",     "zoco",       "🔁", "Nada se tira",          "Cambia tus repetidos por un sobre o por un héroe nuevo.",    "botin"),
 ("zoco",       "zoco",       "🏪", "Tu puesto",             "Pon una pieza en el Zoco Estelar.",                          "zoco"),
 ("trato",      "zoco",       "🤝", "Trato hecho",           "Cierra un trato en el Zoco, comprando o vendiendo.",         "zoco"),
 ("dias3",      "constancia", "🔥", "Tres días seguidos",    "Entra en tu Nave tres días seguidos.",                       ""),
 ("dias7",      "constancia", "☄️", "Una semana entera",     "Entra en tu Nave siete días seguidos.",                      ""),
 ("dias20",     "constancia", "🌌", "Veinte días a bordo",   "Entra en tu Nave veinte días distintos.",                    ""),
]
assert {h[1] for h in HITOS_A_BORDO} == {c[0] for c in CUBIERTAS_A_BORDO}, "cada hito, en una cubierta que exista"
# El premio de las cinco: el Contramaestre de la Nave. Van FUERA de HEROES a propósito: HEROES es lo que
# sale en las cápsulas (el catálogo de Datos.gs, los porcentajes del Mercado, lo que se regala en clase y
# lo que se esconde en un enlace). Estos dos solo se ganan. La Nave, el tablero y la sala del docente los
# pintan igual que a los demás (SG_HEROES los lleva al final) y sin descubrir salen en sombra.
HEROES_A_BORDO = [
 ("H31_contramaestre", "El Contramaestre de la Nave", "LEGENDARIA", 0),
 ("H32_contramaestra", "La Contramaestre de la Nave", "LEGENDARIA", 0),
]
# La carta legendaria: no está en el álbum ni sale en ningún sobre. El NOMBRE va en blanco en la imagen y
# la Nave escribe encima el alias de quien la ha ganado (Retos e Insignias/_work/cartas.py → CARTA_A_BORDO).
CARTA_A_BORDO = ("Z1_contramaestre", "Contramaestre de la Nave")

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
XP_VIAJE = {"REGULAR": 5680, "PUA": 5280}   # 16-sep: +480 (ocho relámpago) +300 (simulacro) +150 (Mano rápida)
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
       "adivinaría? Grábalo del tirón con el móvil: natural gana a perfecto. Después copia el enlace de TU "
       "publicación (los tres puntos ⋮ → «Copiar el enlace a la publicación») y pégalo aquí. Sirve para ponernos cara "
       "desde el primer día — y NEBULA te da su insignia: lo que se comparte no se apaga.",
  "X1": "La Actividad 1 entregada donde te la pide tu profesor. Pulsa «Lo he hecho» cuando la hayas ENVIADO, no cuando la empieces, y pega el enlace o los enlaces que compartiste en tu actividad (es obligatorio; el «+» añade un segundo).",
  "X2": "La Actividad 2 entregada donde te la pide tu profesor. Igual: al ENVIARLA, y pega el enlace o los enlaces que compartiste en tu actividad (es obligatorio; el «+» añade un segundo).",
  # 16-sep · el simulacro de la semana 15. La clase 20 ya se llama «Simulacro del examen» en la
  # programación oficial de la asignatura: esto solo le pone premio y una lista de comprobación.
  "XS": "El ensayo general, con el reloj de verdad: 90 minutos para resolver un caso como el del examen. Se hace en la "
        "clase de repaso (semana 15). Se te dará un planteamiento y tendrás que montar, EN ESE RATO, una plataforma "
        "digital (web o Genially) con su portada, su logo con la palabra clave, dos módulos y tres productos digitales "
        "—algunos puedes reutilizarlos de los que ya has hecho en el viaje: para eso está tu Arsenal—. Al terminar, pega "
        "aquí el enlace público y sube tus capturas. No lleva nota: lleva una lista de comprobación que repasas tú "
        "mismo delante de todos (¿el logo lleva la palabra?, ¿se abre en incógnito?, ¿hay dos módulos?, ¿tres "
        "productos?, ¿la justificación cabe en diez líneas?). Nadie sabe lo que son noventa minutos hasta que los vive.",
  # 15-sep · el reto secreto es el Escape UNI (Norberto): se registra solo, con el botón del final del escape
  "S7": "🗝️ Hay una sala de la que no se sale sin pensar: el Escape UNI. Entra, resuelve sus enigmas y, al final, "
        "pulsa el botón que te espera: el reto se registra solo en tu Nave. Nadie va a darte las respuestas: "
        "los secretos de la gamificación se encuentran jugando.",
}
# ---------------------------------------------------------------- el gancho de cada reto
# 🔴 UNA LÍNEA por reto, la que se lee SIN abrir la tarjeta. Existe porque el título solo dice el
# nombre («Reto B "La chispa"») y la explicación entera son seis líneas: entre las dos faltaba lo
# único que decide si alguien abre el desplegable o pasa de largo — QUÉ hay que hacer.
#
# 🔴 Y no se inventa: cada línea es el resumen fiel de su entrada de AYUDA_RETOS (apps-script/
# Datos.gs). Si la tarea cambia allí, esta línea miente — y mentir aquí es peor que no decir nada,
# porque esto es lo que se lee y lo otro lo que se abre.
# ─── QUÉ EVIDENCIA PIDE CADA RETO, Y CUÁNTOS SE PUEDEN REGISTRAR (13-sep; por SEMANA desde el 17-sep) ─
# Norberto: «¿qué opinas sobre poner un tope de misiones validadas al día? ¿3? … Así evitamos un
# ansioso que hace clic en todo y llega al nivel 10 sin pestañear. Y que en determinados retos sea
# obligatorio poner la URL… Las actividades requieren una URL del artefacto sí o sí».
#
# 🔴 Por qué hacía falta, con cifras del laboratorio: un recluta marcó 15 retos de un tirón, sin
# evidencia, y se llevó +4.100 xp y +880 ◈ en un minuto; se lo gastó en 63 sobres y, cuando su
# docente se lo anuló todo, conservó el álbum entero. El tope y la URL no lo hacen imposible —quien
# quiera mentir pegará «www.culo.com»—, pero lo frenan (3 por semana) y dejan RASTRO: el docente ve el
# enlace, puede comprobarlo y, si es bueno, enseñarlo en clase.
#
#   obligatoria  → sin un enlace, «Lo he hecho» no registra. Las actividades (X) y todos los Reto B:
#                  cada uno produce un artefacto digital que va a la Bitácora. Y A4, que es una
#                  publicación en redes: tiene enlace público y es lo más fácil de verificar.
#   recomendada  → se pide con cariño, no se exige: vídeos o borradores en el Padlet o en el foro de
#                  la plataforma de UNIR, donde sacar el enlace de UNA publicación no siempre es
#                  cómodo. A0 va aquí a propósito: es lo primero que se hace en clase y frenar ahí es
#                  frenar la entrada.
#   (vacío)      → sin enlace: los que se responden en la caja (A1, L2, L3, L6), A6 (se gana en el Simulador) y el
#                  secreto (S7). (17-sep: A3, A5 y A8 ya piden enlace; este comentario lo decía al revés)
EVIDENCIA_RETOS = {
 # 15-sep · Norberto, reto a reto: TODOS los A, B y X piden su enlace (A0 el de su publicación del padlet)
 "X1": "obligatoria", "X2": "obligatoria",
 "B1": "obligatoria", "B2": "obligatoria", "B3": "obligatoria", "B4": "obligatoria",
 "B5": "obligatoria", "B6": "obligatoria", "B7": "obligatoria", "B8": "obligatoria",
 "A0": "obligatoria", "A2": "obligatoria", "A3": "obligatoria", "A4": "obligatoria",
 "A5": "obligatoria", "A7": "obligatoria", "A8": "obligatoria",
 # 15-sep (noche) · A1 se RESPONDE en el reto (REFLEXION_RETOS): el enlace pasa a opcional
 # 16-sep · A6 no pide nada: se gana al Simulador de Joran (batalla.html) y se registra solo
 "A1": "", "A6": "",
 # 16-sep · LOS RELÁMPAGO. Piden lo mínimo que demuestra que se ha hecho: una captura o un enlace.
 # Los tres que son de escribir (L2, L3 y L6) se responden en la caja y el enlace es opcional.
 "L1": "obligatoria", "L4": "obligatoria", "L5": "obligatoria", "L7": "obligatoria", "L8": "obligatoria",
 "L2": "", "L3": "", "L6": "",
 "XS": "obligatoria",
}
# 15-sep (noche) · LOS RETOS QUE SE RESPONDEN EN EL PROPIO RETO. Norberto: «en los retos en los que tienen que compartir
# una breve reflexión o escribir algo concreto, en vez de ponerlo en el foro, que lo respondan directamente sobre el reto…
# una caja de texto más grande… y dos semanas después, en la presentación de clase, podrían aparecer las respuestas,
# priorizando las del escuadrón del profesor activo». Y: «que pudieran ver el del resto de sus compañeros así como el
# enlace (servirá de ejemplo) y responderse/comentar». La reflexión vive en `stargate_reflexiones` (la ve el grupo por su
# alias) y sus comentarios en `stargate_comentarios` (reglas de GamificaPro). En la Nave, la caja grande con su pregunta y
# «Lo que ha escrito tu tripulación»; en la sesión, «Lo que dijisteis» dos semanas después de lanzarse el reto.
#   modo "texto": se responde en la caja y el enlace es opcional (EVIDENCIA_RETOS lo dice)
#   modo "ambos": el enlace a lo creado sigue siendo obligatorio y la reflexión va en la caja
REFLEXION_RETOS = {
 "A1": {"modo": "texto", "min": 120, "titulo": "Lo que nos frena",
        "pide": "¿Qué tienes a medias, en qué punto se quedó y qué te frenó para terminarlo?"},
 "B2": {"modo": "ambos", "min": 150, "titulo": "Lo que aprendimos grabando",
        "pide": "Tu reflexión: qué objetivo didáctico cubre tu videotutorial y qué aprendiste al hacerlo."},
 "B4": {"modo": "ambos", "min": 150, "titulo": "Aulas que viajan en el bolsillo",
        "pide": "Tu reflexión: cómo llega tu contenido al móvil del alumno y cómo mantienes viva la conversación."},
 "B6": {"modo": "ambos", "min": 150, "titulo": "Juegos con niveles",
        "pide": "Tu reflexión: qué objetivo cubre tu juego, qué cambia de un nivel a otro y cómo lo evalúas."},
 "A7": {"modo": "ambos", "min": 120, "titulo": "Insignias con sentido",
        "pide": "El porqué de tu insignia: cómo se llama, qué acto reconoce y qué historia convierte esa tarea en una causa."},
 "B7": {"modo": "ambos", "min": 150, "titulo": "Tareas convertidas en causa",
        "pide": "Tu reflexión: qué conducta refuerza tu microgamificación, qué historia la envuelve y por qué."},
 "A8": {"modo": "ambos", "min": 200, "titulo": "Capas que ya existen",
        "pide": "¿Cómo usarías ese recurso en una clase concreta? Qué vería tu alumnado, qué haría y qué añade esa capa."},
 # 16-sep · los relámpago de escribir. Son cortos a propósito: se hacen en clase, en diez minutos, y
 # entrenan justo lo que el examen puntúa — repartir una sesión, explicar un concepto y justificar.
 "L2": {"modo": "texto", "min": 120, "titulo": "Antes y durante",
        "pide": "Tu sesión, en dos listas: qué hace tu alumnado ANTES de clase y qué hacéis DURANTE."},
 "L3": {"modo": "texto", "min": 150, "titulo": "Itinerario y paisaje, en cinco líneas",
        "pide": "Con tus palabras: qué es un itinerario de aprendizaje y en qué se diferencia de un paisaje. Cinco líneas."},
 "L6": {"modo": "texto", "min": 250, "titulo": "Las diez líneas",
        "pide": "Justifica un recurso tuyo según una metodología concreta: qué aporta, cuándo se usa y por qué ese. Diez líneas."},
}
# 🔴 17-sep · TRES POR SEMANA, no al día (Norberto, en la prueba humana: «“Como mucho, 3 retos al día”. ¡Debería ser 3 retos a
# la semana!»). La semana, de lunes a domingo. Cuentan los que registra el propio recluta (A, B, X, S7); no los hitos (van
# solos), ni los relámpago (se hacen en clase), ni los que valida su docente desde la ficha (`stargateOtorgados`). Deshacer
# uno libera su hueco. Lo aplica también el servidor (gamificapro/functions/stargateTope.js), con el mismo número.
TOPE_RETOS_SEMANA = 3

# 15-sep · UN EJEMPLO POR RETO (Norberto: «es lo que más les ayuda»).
# 17-sep · Y AHORA EN TODOS (Norberto: «me encantaría que cada reto fuera acompañado de un ejemplo: a veces una imagen,
# una descripción o algo más elaborado»). Cada uno es el caso de una docente o un docente concreto, con la herramienta,
# lo que hizo y dónde lo dejó; en las reflexiones, una respuesta modelo que supera el mínimo. `titulo` y `texto` siempre;
# `detalle` (los puntos clave) y `enlace` (un ejemplo público de verdad) cuando los hay. S7 no lleva: es secreto.
# En la Nave sale dentro del reto, plegado, como «💡 Ver un ejemplo».
EJEMPLOS_RETOS = {
 "A0": {
  "titulo": "Carmen se presenta en 55 segundos, grabada con el móvil",
  "texto": "Carmen, maestra de 4.º de Primaria en un colegio de Zaragoza, se grabó con el móvil en su casa, del tirón y sin guion: «Soy Carmen, llevo doce años con niños de 9 y 10 años y me conecto desde Zaragoza. Me metí en educación por mi maestra de 5.º. Me encanta Genially y sufro con las hojas de cálculo. Un dato curioso: toco la gaita». Duró 55 segundos. Lo publicó en la sección «Preséntate» del padlet de la clase, con su alias (Capella) como título y «Capitán:» más el nombre de su profe en la primera línea. Después copió el enlace de su publicación (⋮ → «Copiar el enlace a la publicación») y lo pegó en el reto."
 },
 "A1": {
  "titulo": "Javier (FP) saca del cajón un banco de prácticas a medias",
  "texto": "Tengo a medias un banco de prácticas de montaje de ordenadores para 1.º del ciclo de Sistemas Microinformáticos y Redes. Lo empecé en Genially: hay seis fichas hechas (placa base, procesador, RAM, fuente, disco y refrigeración) y faltan las de periféricos y la autoevaluación final. Se quedó ahí en febrero, cuando me di cuenta de que las fotos de los componentes eran de internet y no sabía si podía usarlas. Me frenó eso y el perfeccionismo: quería hacer yo todas las fotos en el taller y nunca encontraba el momento. Lo comparto tal cual, con sus huecos.",
  "detalle": [
   "Javier, profesor de FP de Grado Medio, lo escribe directamente en la caja del reto: no se corrige ni se puntúa.",
   "Opcional: el enlace al Genially con permiso de lectura, para que la tripulación lo vea."
  ]
 },
 "B1": {
  "titulo": "Lucía abre su Bitácora en Google Sites y publica su presentación",
  "texto": "Lucía, profesora de Biología y Geología de 3.º de ESO en un instituto de Murcia, creó su Bitácora en Google Sites y la llamó «Bitácora de Lucía · MUTECD». La personalizó con el verde de su departamento, otra tipografía y una foto suya en el laboratorio. Dejó el menú preparado con cinco páginas vacías (Actividad 1, Actividad 2, Videotutorial, Microgamificación y Reto libre) y publicó la primera entrada, «Quién soy»: diez líneas sobre su trayectoria, sus grupos y lo que espera del máster («aprender a crear recursos que mi alumnado use también desde el móvil»). Pulsó «Publicar», abrió el enlace en una ventana de incógnito para comprobar que se veía sin su cuenta y lo pegó en el reto y en su BIO de la Nave.",
  "detalle": [
   "Alternativa rápida: duplicar la plantilla oficial de Genially y cambiar colores, foto y textos.",
   "No hace falta que esté llena: basta con la portada y la primera entrada.",
   "Si la cuenta del centro no deja publicar en abierto, mejor crearla con una cuenta personal.",
   "Comprobación clave: el enlace se abre en incógnito sin pedir permiso."
  ]
 },
 "L1": {
  "titulo": "Pilar crea una infografía del aparato circulatorio y el logo «PULSO»",
  "texto": "Pilar, maestra de 6.º de Primaria, pidió a Microsoft Designer una infografía del recorrido de la sangre con un prompt que dice contexto, tipo de imagen y finalidad. La primera versión traía etiquetas inventadas en inglés, así que iteró: «solo seis etiquetas, en español y con letra grande». Eligió la segunda y lo justificó en dos líneas: «Se lee desde el fondo del aula y distingue por color la sangre con y sin oxígeno, que es justo lo que evalúo». Después hizo en Canva un logo circular con un corazón y la palabra «PULSO» dentro. Puso las dos imágenes en la portada de su Bitácora y pegó una captura en el padlet.",
  "detalle": [
   "Prompt: «Eres ilustrador de materiales escolares. Para una clase de 6.º de Primaria sobre el aparato circulatorio, crea una infografía vertical del recorrido de la sangre (corazón, pulmones y resto del cuerpo) con flechas rojas y azules. Finalidad: que el alumnado explique el recorrido con sus palabras».",
   "Iteración: «Solo seis etiquetas, en español, letra grande y fondo blanco».",
   "Criterio docente, en dos líneas: por qué esa versión y no la otra.",
   "Logo: hecho en Canva, con la palabra clave «PULSO» bien visible."
  ]
 },
 "X1": {
  "titulo": "Rosa entrega su Actividad 1 y la marca en la Nave al enviarla",
  "texto": "Rosa, profesora de Inglés de 1.º de Bachillerato, diseñó una actividad de expresión oral a partir de una imagen creada con IA: una calle de su ciudad en 2050 que el alumnado describe y compara con su barrio usando will y be going to. Su PDF (4 páginas) incluye la planificación (grupo, unidad y tarea), la actividad, la referencia a la IA usada, las capturas de la tabla técnica y de la reflexiva y el enlace a su Bitácora. En la Bitácora, la página «Actividad 1» muestra la imagen, la tarea, las dos tablas completas y las capturas del proceso. Subió el PDF a la plataforma de UNIR y, solo después de enviarlo, marcó «Lo he hecho» en la Nave y pegó el enlace de esa página de su Bitácora.",
  "detalle": [
   "Tabla técnica: función de la IA, prompt inicial, iteración, criterio docente, evidencia del proceso y cita de la herramienta.",
   "Tabla reflexiva: cómo integró la IA, qué cambió en la actividad, qué puso ella y qué aprendió.",
   "Con el «+» añadió un segundo enlace: el de la imagen publicada.",
   "Se marca al ENVIAR la actividad, no al empezarla."
  ]
 },
 "A2": {
  "titulo": "Un clip de 50 segundos para quien faltó a clase",
  "texto": "Nuria, profesora de Lengua de 1.º de ESO, grabó con el móvil 50 segundos sobre cómo encontrar el sujeto de una oración: escribe una frase en la pizarra, pone el verbo en plural y señala qué grupo de palabras tiene que cambiar con él. Nada más. Lo subió a YouTube en oculto, se lo enseñó a su hija para ver si se entendía sin ella delante y pegó el enlace en el reto.",
  "enlace": "https://youtu.be/ZE_JdQUmepk"
 },
 "B2": {
  "titulo": "Marta (Tecnología, 3.º ESO): videotutorial de Tinkercad con tres preguntas",
  "texto": "Mi videotutorial enseña a diseñar un llavero en Tinkercad y a exportarlo en STL para imprimirlo en 3D. El objetivo didáctico es que mi alumnado de 3.º de ESO sepa agrupar formas, crear huecos y medir en milímetros antes de llegar al taller, para dedicar la clase a imprimir y corregir. Las tres preguntas están justo después de cada paso difícil. Al hacerlo aprendí que el guion lo es todo: la primera grabación duraba nueve minutos y, al escribir antes lo que iba a decir, bajó a cuatro. También aprendí que una buena pregunta comprueba un paso, no un detalle.",
  "detalle": [
   "Guion de una página, grabación de pantalla con Screencastify y edición en Clipchamp (cortes y zoom en los botones).",
   "Subido a YouTube en oculto e importado en Edpuzzle con 3 preguntas: en el 1:10, el 2:30 y el 3:40.",
   "Aula invertida: lo ven en casa y en clase se imprime.",
   "El enlace de Edpuzzle va en el reto; la reflexión, en la caja y en su Bitácora."
  ],
  "enlace": "https://edpuzzle.com/media/68ff9e1a400997c66a1f3eea"
 },
 "L2": {
  "titulo": "Raúl (Matemáticas, 3.º ESO) reparte su sesión de sistemas de ecuaciones",
  "texto": "ANTES de clase (en casa):\n· Ven un vídeo de 5 minutos sobre el método de sustitución, con dos preguntas en Edpuzzle.\n· Resuelven un sistema guiado paso a paso.\n· Escriben su duda principal en un formulario de una sola pregunta.\n\nDURANTE la clase:\n· Resolvemos en la pizarra las tres dudas más repetidas del formulario.\n· Por parejas, plantean y resuelven dos problemas reales (entradas de cine, monedas).\n· Cada pareja explica un problema a otra y se corrigen entre sí.\n· Cierre: un ejercicio individual de salida, de 5 minutos."
 },
 "A3": {
  "titulo": "Irene (Inglés, 5.º de Primaria) monta tres senderos hacia el mismo objetivo",
  "texto": "Irene creó un Genially con un solo objetivo: describir su rutina diaria en presente simple. En la portada hay tres puertas y cada estudiante elige una. «Hazlo»: ordena viñetas de un día y graba un audio contándolas. «Léelo»: lee un cómic corto y completa una tabla de horas y acciones. «Escúchalo»: escucha un pódcast de dos niños y responde con dibujos. Los tres caminos terminan en la misma tarea: escribir cinco frases sobre su propio día.",
  "detalle": [
   "Criterio: cada sendero es una actividad distinta, no la misma con otro nombre.",
   "Si no tienes una hora esta semana, vale un boceto a mano de los caminos, fotografiado."
  ],
  "enlace": "https://view.genially.com/673a886db3cebc087dcc971a"
 },
 "B3": {
  "titulo": "Patricia rellena seis cruces de la matriz para «Las plantas» (3.º de Primaria)",
  "texto": "Patricia, maestra de 3.º de Primaria, contextualizó su unidad «Las plantas» (Ciencias de la Naturaleza, 8-9 años) con sus objetivos, contenidos y criterios de evaluación. Hizo la tabla 8×6 en Google Docs, con las inteligencias en filas y los niveles de Bloom en columnas, y rellenó seis casillas: una por cada nivel de Bloom y con seis inteligencias distintas. Cada actividad lleva objetivo, tarea del alumno, recurso, evaluación, tiempo y tipo. Las 42 casillas vacías quedan a la vista para completarlas más adelante.",
  "detalle": [
   "Naturalista × Recordar: nombra las partes de una planta del huerto con una ficha de fotos · lista de cotejo · 20 min · obligatoria.",
   "Lingüística × Comprender: explica en un audio de 1 minuto qué necesita una planta para vivir · rúbrica · 15 min · obligatoria.",
   "Lógico-matemática × Aplicar: mide cada dos días una judía que germina y lo anota en una tabla · hoja de registro · 2 semanas · obligatoria.",
   "Visual-espacial × Analizar: compara con fotos una planta al sol y otra a la sombra · escala de valoración · 30 min · optativa.",
   "Interpersonal × Evaluar: en equipo, deciden con tres criterios qué maceta está mejor cuidada · coevaluación · 30 min · optativa.",
   "Musical × Crear: inventa una canción corta sobre el ciclo de la planta con Chrome Music Lab · rúbrica · 45 min · voluntaria."
  ],
  "enlace": "https://view.genially.com/5d3ebe3d5890ce0f65730f81"
 },
 "L3": {
  "titulo": "Beatriz (Francés, EOI) explica itinerario y paisaje en cinco líneas",
  "texto": "Un itinerario de aprendizaje es una secuencia ordenada de actividades para llegar a un objetivo.\nPuede tener alguna bifurcación, pero el orden lo marca el docente y todos siguen un recorrido parecido.\nUn paisaje de aprendizaje ofrece muchas actividades a la vez, planificadas cruzando inteligencias múltiples y niveles de Bloom.\nEn el paisaje cada estudiante elige qué hace y en qué orden, entre tareas obligatorias, optativas y voluntarias.\nLa diferencia: el itinerario guía un recorrido; el paisaje abre varias opciones y atiende mejor a la diversidad."
 },
 "X2": {
  "titulo": "Patricia entrega su paisaje de aprendizaje y lo marca en la Nave",
  "texto": "Patricia, maestra de 3.º de Primaria, amplió la matriz de su unidad «Las plantas» a ocho actividades y las llevó a un paisaje: una imagen interactiva en Genially (no una presentación) con un huerto ilustrado en el que cada planta abre una actividad, con un color según sea obligatoria, optativa o voluntaria. Su PDF (11 páginas, dentro del límite para ocho actividades) recoge la contextualización, la matriz y la ficha completa de cada actividad. En la Bitácora añadió la página «Actividad 2» con la matriz, el paisaje incrustado y un párrafo sobre cómo ese diseño atiende a la diversidad. Subió el PDF a la plataforma de UNIR y, al enviarlo, marcó «Lo he hecho» en la Nave con el enlace del paisaje y, con el «+», el de su Bitácora.",
  "detalle": [
   "PDF (80 %): contextualización, matriz 8×6 y ficha de cada actividad (objetivo, tarea, recursos citados, evaluación, tiempo y tipo).",
   "ePortfolio (20 %): evidencias de la matriz y del paisaje, más la justificación del diseño y de la atención a la diversidad.",
   "Se marca al ENVIAR la actividad, no al empezarla."
  ]
 },
 "A4": {
  "titulo": "Álvaro publica en LinkedIn su primer videoquiz, sin esperar a pulirlo",
  "texto": "Álvaro, profesor de Educación Física de 1.º de Bachillerato, publicó en LinkedIn, en abierto, una captura de su primer videoquiz con dos líneas: «Esta semana he convertido la explicación del salto de altura en un vídeo con preguntas para verlo antes de clase. No es perfecto, pero mi grupo ya lo está usando. #mutecdstargate». Tardó cinco minutos. Abrió la publicación, copió su enlace directo y lo pegó en el reto. Esa misma publicación le sirve después como evidencia en otros retos."
 },
 "B4": {
  "titulo": "Daniel (Física y Química, 4.º ESO) monta su Classroom con tres recursos que ya existen",
  "texto": "Mi contenido llega al móvil a través de la app de Classroom: cada tarea y cada anuncio avisan con una notificación, y elijo recursos que se ven bien en pantalla pequeña (vídeos cortos y una simulación que funciona en el navegador del móvil). Las instrucciones caben en tres líneas, no en un PDF. La conversación la mantengo viva así: cada lunes publico en el tablón una pregunta de la semana, respondo a los comentarios de clase en menos de 24 horas y en cada práctica dejo un comentario privado a cada estudiante. Cuando una duda se repite, la respondo en el tablón para todos.",
  "detalle": [
   "Aula «Física y Química 4.º B» con una tarea publicada: «Práctica: densidad de sólidos irregulares», con fecha y rúbrica.",
   "Tablón abierto a comentarios y un anuncio de bienvenida.",
   "Tres recursos ajenos, cada uno con dos líneas de por qué ese y su fuente: la simulación «Densidad» de PhET (Universidad de Colorado, CC BY 4.0), un vídeo divulgativo de YouTube sobre el principio de Arquímedes (canal citado) y un juego de Educaplay de otro docente sobre unidades (autor citado).",
   "Google Doc con permiso de lectura y dos capturas (el tablón y la tarea): su enlace va en el reto."
  ]
 },
 "L4": {
  "titulo": "Mónica descubre en incógnito que su rúbrica pedía permiso",
  "texto": "Mónica, maestra de Educación Infantil, eligió la rúbrica que había hecho en Google Docs. Copió el enlace, abrió una ventana de incógnito (Ctrl + Mayús + N en Chrome) y le salió «Necesitas permiso». En el documento pulsó «Compartir», cambió «Restringido» por «Cualquier persona con el enlace» con el rol «Lector» y volvió a probar: ahora se abría sin iniciar sesión. Hizo la captura con la ventana de incógnito y el documento a la vista y la pegó en el reto. Cinco minutos."
 },
 "A5": {
  "titulo": "Laura (Inglés, 2.º ESO) hace una rúbrica de 4 criterios con descripciones observables",
  "texto": "Laura eligió un objetivo que ya trabaja: «Presentar oralmente su ciudad durante dos minutos». Hizo en Google Docs una tabla con 4 criterios (contenido, vocabulario, fluidez y pronunciación) y 4 niveles (Inicial, En proceso, Conseguido y Destacado). En cada casilla escribió lo que se ve o se oye, no un adjetivo: en vez de «buen vocabulario», «usa 8 o más palabras de la unidad sin repetir». La compartió como «Cualquier persona con el enlace · Lector», se la pasó a una compañera para ver si podía usarla sin preguntarle y pegó el enlace en el reto.",
  "detalle": [
   "Contenido · Destacado: nombra 4 o más lugares y da un dato de cada uno. Inicial: nombra 1 lugar, sin datos.",
   "Fluidez · Destacado: habla dos minutos con 2 pausas largas como máximo. Inicial: lee casi todo del papel.",
   "Sin adjetivos sueltos («bien», «adecuado»): si no se puede observar, no se puede medir."
  ]
 },
 "B5": {
  "titulo": "Laura monta en Google Sites el centro de recursos de Inglés de 2.º ESO",
  "texto": "Laura creó en Google Sites «English Hub · 2.º ESO» con un menú de cinco páginas: Inicio, Unidad 1, Unidad 2, Unidad 3 y «Cómo se evalúa». Cada unidad tiene sus recursos (un vídeo con preguntas, un juego de Wordwall, una ficha de vocabulario), cada uno con una línea que dice para qué sirve. En «Cómo se evalúa» incrustó la rúbrica de la exposición oral que hizo en el reto anterior. Comprobó el enlace en incógnito y lo pegó en el reto. En su Bitácora añadió la entrada «Centro de recursos»: evidencia (el enlace), contexto (grupo y uso) y reflexión (qué cambia al tenerlo todo en un sitio). Esa misma semana cerró allí su página de la Actividad 1.",
  "detalle": [
   "Web no es aula virtual: aquí no se entregan tareas; el alumnado encuentra los recursos sin pedirlos.",
   "Organizada con criterio: por unidad (también valdría por tipo de recurso).",
   "La rúbrica, a la vista en su propia página, no escondida tras un enlace."
  ],
  "pua": "En PUA este reto recupera también a Vera y no hay reto anterior de rúbrica: la rúbrica (3-4 criterios con descripciones observables) se hace aquí mismo."
 },
 "L5": {
  "titulo": "Paula crea en Google Forms tres preguntas de autoevaluación sobre el feudalismo",
  "texto": "Paula, profesora de Geografía e Historia de 2.º de ESO, abrió Google Forms en modo cuestionario, con la puntuación y las respuestas visibles al enviar. Escribió una pregunta por cada objetivo de la unidad: 1) ¿Qué estamento trabajaba la tierra? (opción múltiple). 2) Relaciona señor y vasallo con sus obligaciones (cuadrícula). 3) ¿Por qué un campesino aceptaba depender de un señor? (respuesta corta, con una respuesta modelo como comentario). Lo insertó en su Bitácora (Google Sites → Insertar → Formularios) y pegó el enlace en el reto. Doce minutos."
 },
 "A6": {
  "titulo": "Ramón repasa 15 minutos y gana al Simulador a la segunda",
  "texto": "Ramón, profesor de FP Básica, se preparó 15 minutos antes de entrar: repasó sus notas de los temas 1 al 5 y se apuntó los pares que más se confunden (itinerario y paisaje, videotutorial y videoquiz, aula virtual y web de recursos, ABJ y gamificación). La primera partida la perdió por contestar despacio. En la segunda respondió sin apurar los 25 segundos, guardó «reparar escudo» para cuando su escudo iba bajo y llegó al Remate sin fallos pendientes. No tuvo que entregar nada: la insignia se registró sola."
 },
 "B6": {
  "titulo": "Carlos (Química, 1.º Bachillerato): escape de formulación en tres fases",
  "texto": "Mi juego cubre este objetivo: nombrar y formular compuestos inorgánicos binarios y ternarios según la IUPAC. Es un escape en Genially con tres fases, y cada una sube la dificultad: en la primera se reconocen óxidos e hidruros; en la segunda hay que nombrar sales binarias; en la tercera, formular oxoácidos a partir de su nombre. Cada fase da un dígito del candado final, así que no se avanza sin acertar. Lo evalúo con un Google Forms al final, donde cada equipo escribe el código y cuántos intentos le costó cada fase, y con una lista de cotejo mientras juegan: así veo en qué fase se atascan y qué tengo que repasar.",
  "detalle": [
   "Hecho en Genially con una plantilla de escape: portada, tres salas y candado final.",
   "Cada mecánica sirve a un aprendizaje: sin nombrar bien el compuesto, la puerta no se abre.",
   "Enlace público del Genially en el reto; la reflexión, en la caja y en su Bitácora."
  ]
 },
 "L6": {
  "titulo": "Marta justifica su videotutorial de Tinkercad según el aula invertida",
  "texto": "Recurso: videotutorial de Tinkercad con tres preguntas en Edpuzzle (3.º ESO).\nMetodología: aula invertida.\nSe ve en casa, antes de la sesión, al ritmo de cada estudiante.\nLas preguntas comprueban que ha entendido cada paso antes de seguir.\nEdpuzzle me dice quién lo ha visto y qué pregunta se falla más.\nCon eso empiezo la clase resolviendo solo las dudas reales.\nEl tiempo de aula se dedica a diseñar e imprimir, conmigo al lado.\nVídeo y no PDF: el procedimiento se entiende mejor viéndolo.\nEdpuzzle y no YouTube a secas: sin preguntas no sabría quién lo sigue.\nAporta autonomía, respeta los ritmos y deja más práctica guiada en clase."
 },
 "A7": {
  "titulo": "Rocío (5.º de Primaria) crea la insignia «Guardianes de la biblioteca»",
  "texto": "Se llama «Guardianes de la biblioteca». Reconoce al equipo que cada viernes deja la biblioteca de aula ordenada, con los libros revisados y las fichas de préstamo al día. En nuestra historia de clase, esos libros son el archivo de todas las aventuras que hemos leído: si se pierden o se rompen, el lunes nadie puede seguir la suya. No premia obedecer: recuerda que cuidar lo que es de todos es cuidar a los compañeros.",
  "detalle": [
   "Diseñada en Canva: escudo azul con un libro abierto y una llave.",
   "Compartida con el enlace de solo lectura de Canva y publicada en el padlet de la clase."
  ]
 },
 "B7": {
  "titulo": "Ana (FP de Cuidados Auxiliares de Enfermería) convierte el registro diario en un turno de guardia",
  "texto": "Mi microgamificación refuerza una conducta concreta: rellenar cada día, completa y sin errores, la hoja de registro de las prácticas. Nadie juega: la tarea es la de siempre. La envuelve una historia: mi grupo es el equipo de guardia del «Hospital Aurora» y cada registro bien hecho es un paciente atendido a tiempo. En un tablero de Genially cada equipo tiene la barra de progreso de su turno, y con cinco días seguidos sin errores gana la insignia «Turno impecable». Lo hago así porque en su trabajo real un registro incompleto tiene consecuencias, y la historia les ayuda a verlo antes de salir a las prácticas.",
  "detalle": [
   "Tablero en Genially: una barra por equipo que avanza con cada registro que valida la profesora.",
   "Insignia «Turno impecable» al quinto día seguido sin errores.",
   "No es ABJ: no hay un juego que jugar, solo elementos de juego (historia, progreso e insignia) sobre una tarea real."
  ]
 },
 "L7": {
  "titulo": "Pedro hace una tabla de los equipos que más han mejorado",
  "texto": "Pedro, profesor de Educación Física de 1.º de ESO, no quería premiar solo al más rápido. En Google Sheets hizo una tabla de cinco filas, una por equipo, con tres columnas: marca media en la primera prueba de 1.000 metros, marca media actual y porcentaje de mejora. La ordenó por la mejora y añadió formato condicional para que el primer puesto salga en verde. Así, arriba va el equipo que más ha progresado, aunque no sea el más rápido. Hizo la captura y la pegó en el reto. Diez minutos."
 },
 "A8": {
  "titulo": "Clara (Geografía e Historia, 1.º ESO) trae al aula un Coliseo en 3D",
  "texto": "Usaría un modelo 3D del Coliseo publicado en Sketchfab, que desde el móvil se puede colocar sobre la mesa en realidad aumentada. Sería en 1.º de ESO, en la unidad de Roma. Por parejas, el alumnado lo giraría y se acercaría a las gradas, la arena y las entradas, y dibujaría un plano sencillo con el lugar donde se sentaba cada grupo social. Esa capa añade lo que el libro no da con una foto: el tamaño, la estructura por dentro y la posibilidad de compararlo con un estadio que conocen.",
  "detalle": [
   "En el reto va el enlace al modelo: aquí no se construye nada, se elige un recurso que ya existe.",
   "Se cita el autor del modelo y su licencia, que aparecen en la propia ficha de Sketchfab."
  ]
 },
 "B8": {
  "titulo": "Lucía crea una lámina con RA y publica su Bitácora completa",
  "texto": "Lucía, la profesora de Biología y Geología de 3.º de ESO que abrió su Bitácora en la semana 1, hizo su experiencia de realidad aumentada con una lámina del aparato digestivo: junto a cada órgano hay un código QR que abre en el móvil un modelo 3D de ese órgano (de Sketchfab, con su autor citado) o un vídeo suyo de 40 segundos. La imprimió en A3 para la pared del aula y la usó como reto libre. Después cerró la Bitácora: convirtió su paisaje de la Actividad 2 en una imagen interactiva de Genially incrustada en su página, revisó que las cinco páginas estuvieran completas (Actividad 1, Actividad 2, videotutorial, microgamificación y reto libre), lo abrió todo en incógnito y pegó el enlace único en el reto.",
  "detalle": [
   "Cada página sigue el mismo patrón: evidencia → contexto → reflexión.",
   "Probó los QR con dos móviles distintos antes de imprimir la lámina.",
   "Un solo enlace, el de la Bitácora, que lleva a todo lo demás."
  ]
 },
 "L8": {
  "titulo": "Víctor mete en una diapositiva el QR de su juego sobre la orquesta",
  "texto": "Víctor, profesor de Música de 2.º de ESO, abrió en Chrome el enlace público de su juego de Wordwall sobre las familias de instrumentos y generó el QR con el botón derecho → «Crear código QR para esta página». Lo pegó en una diapositiva de Google Slides titulada «Escanea y juega: la orquesta», lo escaneó con su móvil para comprobar que abría el juego y, con la pantalla partida, hizo una captura con la diapositiva a la izquierda y el juego abierto a la derecha, con su dirección visible. La pegó en el reto. Ocho minutos."
 },
 "XS": {
  "titulo": "Isabel monta su plataforma «EXPLORA» en 90 minutos",
  "texto": "Isabel, maestra de 6.º de Primaria, recibió un caso: una plataforma para preparar una salida al entorno natural. Minutos 0-15: un Google Sites con portada, el logo hecho en Canva con la palabra clave que pedía el caso, «EXPLORA», y cinco líneas que explican el enfoque. Minutos 15-40: Módulo 1 (antes de la salida), con su videoquiz reutilizado del tema 2 y un cuestionario de autoevaluación de tres preguntas creado en el momento. Minutos 40-65: Módulo 2 (durante la salida), con un juego de Wordwall creado en directo y su QR dentro de una lámina. Minutos 65-78: justificación de diez líneas según el ABP. Minutos 78-90: todos los enlaces abiertos en incógnito, capturas y repaso de ortografía. Al terminar, pegó el enlace público y subió las capturas.",
  "detalle": [
   "¿El logo lleva la palabra clave?",
   "¿Se abre todo en una ventana de incógnito?",
   "¿Hay dos módulos y tres productos?",
   "¿La justificación cabe en diez líneas?",
   "¿Hay capturas y se ha repasado la ortografía?"
  ]
 }
}

# 17-sep · IMÁGENES Y EJEMPLOS «VIVOS» (Norberto: «haz imágenes para retos» y «igual algún ejemplo se muestra mejor
# con HTML o algo que crees con código»). Se añaden a EJEMPLOS_RETOS sin tocar sus textos:
# - `imagen` (+ `imagen_alt`): una captura verosímil del caso (Magnific · GPT 2), en assets/img/ejemplos/.
# - `vivo`: lo que se lee mejor escrito en la propia web que en una foto: tablas (la rúbrica, la matriz, las de la
#   Actividad 1, los pares que se confunden), el cuestionario que se puede contestar y la línea de tiempo del vídeo
#   con sus preguntas. Lo pinta la Nave (recluta.js, `ejemploVivo`) con los colores de STARGATE.
EJEMPLOS_EXTRA = {
 "B1": {"imagen": "B1.jpg", "imagen_alt": "La portada de la Bitácora de Lucía en Google Sites: cabecera verde, menú de cinco páginas y la página «Quién soy» con su foto."},
 "L1": {"imagen": "L1.jpg", "imagen_alt": "Las dos versiones de la infografía del aparato circulatorio (la primera con etiquetas en inglés, la segunda elegida) y el logo circular «PULSO»."},
 "X2": {"imagen": "X2.jpg", "imagen_alt": "El paisaje de aprendizaje de Patricia: un huerto ilustrado con ocho plantas numeradas de colores y la ficha de la actividad 3 abierta."},
 "B4": {"imagen": "B4.jpg", "imagen_alt": "El tablón de Classroom «Física y Química 4.º B» con la pregunta de la semana y una tarea con tres recursos citados."},
 "L4": {"imagen": "L4.jpg", "imagen_alt": "La rúbrica de Mónica abierta en una ventana de incógnito de Chrome, sin sesión iniciada."},
 "B5": {"imagen": "B5.jpg", "imagen_alt": "El sitio «English Hub · 2.º ESO» con su menú de cinco páginas y la rúbrica incrustada en «Cómo se evalúa»."},
 "B6": {"imagen": "B6.jpg", "imagen_alt": "La fase 3 del escape de formulación de Carlos: un laboratorio con un candado de tres dígitos y la consigna «Formula el ácido sulfúrico»."},
 "A7": {"imagen": "A7.jpg", "imagen_alt": "La insignia «Guardianes de la biblioteca»: un escudo azul y dorado con un libro abierto y una llave."},
 "B7": {"imagen": "B7.jpg", "imagen_alt": "El tablero «Hospital Aurora · Equipo de guardia» con la barra de cada equipo y la insignia «Turno impecable»."},
 "L7": {"imagen": "L7.jpg", "imagen_alt": "La hoja de cálculo de Pedro con cinco equipos ordenados por su mejora en los 1.000 metros y el primero en verde."},
 "B8": {"imagen": "B8.jpg", "imagen_alt": "La lámina del aparato digestivo con un QR junto a cada órgano y un móvil que muestra el estómago en 3D."},
 "L8": {"imagen": "L8.jpg", "imagen_alt": "A la izquierda, la diapositiva «Escanea y juega: la orquesta» con su QR; a la derecha, el juego de Wordwall abierto con su dirección."},
 "XS": {"imagen": "XS.jpg", "imagen_alt": "La portada de «EXPLORA» en Google Sites: el logo, cinco líneas de presentación y los botones «Módulo 1 · Antes» y «Módulo 2 · Durante»."},

 "A5": {"vivo": [{"tipo": "tabla", "titulo": "Rúbrica · Presentar oralmente su ciudad durante dos minutos (Inglés, 2.º ESO)",
   "cab": ["Criterio", "Inicial", "En proceso", "Conseguido", "Destacado"],
   "filas": [
    ["Contenido", "Nombra 1 lugar, sin datos", "Nombra 2 lugares y da un dato de uno", "Nombra 3 lugares y da un dato de cada uno", "Nombra 4 o más lugares y da un dato de cada uno"],
    ["Vocabulario", "Usa menos de 4 palabras de la unidad", "Usa de 4 a 7 palabras de la unidad", "Usa 8 o más palabras de la unidad sin repetir", "Usa 8 o más y 2 expresiones nuevas de la unidad"],
    ["Fluidez", "Lee casi todo del papel", "No llega a 2 minutos o para muchas veces", "Habla 2 minutos con 3 o 4 pausas largas", "Habla 2 minutos con 2 pausas largas como máximo"],
    ["Pronunciación", "No se entiende más de la mitad", "Se entiende con esfuerzo en varias frases", "Se entiende todo, con algún error", "Se entiende todo y cuida la entonación de las preguntas"]],
   "nota": "Cada casilla dice lo que se ve o se oye, no un adjetivo: «usa 8 o más palabras», no «buen vocabulario»."}]},

 "B3": {"vivo": [{"tipo": "tabla", "titulo": "Matriz de inteligencias múltiples × Bloom · «Las plantas» (3.º de Primaria)",
   "cab": ["", "Recordar", "Comprender", "Aplicar", "Analizar", "Evaluar", "Crear"],
   "filas": [
    ["Lingüística", "", "Explica en un audio de 1 minuto qué necesita una planta para vivir", "", "", "", ""],
    ["Lógico-matemática", "", "", "Mide cada dos días una judía que germina y lo anota en una tabla", "", "", ""],
    ["Visual-espacial", "", "", "", "Compara con fotos una planta al sol y otra a la sombra", "", ""],
    ["Corporal", "", "", "", "", "", ""],
    ["Musical", "", "", "", "", "", "Inventa una canción corta sobre el ciclo de la planta (Chrome Music Lab)"],
    ["Interpersonal", "", "", "", "", "En equipo, deciden con tres criterios qué maceta está mejor cuidada", ""],
    ["Intrapersonal", "", "", "", "", "", ""],
    ["Naturalista", "Nombra las partes de una planta del huerto con una ficha de fotos", "", "", "", "", ""]],
   "nota": "Seis cruces: una por cada nivel de Bloom y en seis inteligencias distintas (las de sus puntos clave, abajo). Las 42 casillas vacías quedan a la vista para más adelante."}]},

 "A6": {"vivo": [{"tipo": "tabla", "titulo": "Los pares que Ramón se apuntó (los que más se confunden)",
   "cab": ["Se confunde…", "…con", "La diferencia"],
   "filas": [
    ["Itinerario", "Paisaje", "El itinerario es una secuencia que ordena el docente; en el paisaje hay muchas actividades a la vez (inteligencias × Bloom) y cada estudiante elige cuáles y en qué orden."],
    ["Videotutorial", "Videoquiz", "El videotutorial explica paso a paso cómo hacer algo; el videoquiz es un vídeo con preguntas dentro que hay que responder para seguir."],
    ["Aula virtual", "Web de recursos", "El aula virtual tiene alumnado inscrito, tareas, entregas y notas; la web de recursos ordena materiales para consultarlos."],
    ["ABJ", "Gamificación", "En el ABJ se aprende jugando a un juego; en la gamificación se usan elementos de juego (puntos, insignias, historia) en algo que no es un juego."]]}]},

 "X1": {"vivo": [
   {"tipo": "tabla", "titulo": "Tabla técnica (lo que puso Rosa)", "cab": ["Campo", "Rosa"],
    "filas": [
     ["Función de la IA", "Crear la imagen de partida: la calle mayor de su ciudad en 2050, para describirla y compararla con su barrio."],
     ["Prompt inicial", "«Ilustración realista de la calle mayor de una ciudad española en 2050, con tranvía, placas solares y gente paseando, sin texto»."],
     ["Iteración", "Salían coches voladores y rótulos inventados: pidió «tecnología creíble, la calle reconocible y ningún texto»."],
     ["Criterio docente", "Eligió la versión con más cosas que se pueden predecir con will y be going to (obras, carteles de próximas aperturas)."],
     ["Evidencia del proceso", "Capturas de las tres versiones y del prompt final, en su Bitácora."],
     ["Cita de la herramienta", "Imagen generada con Microsoft Designer (12-oct-2026). Prompt y versiones en la Bitácora."]]},
   {"tipo": "tabla", "titulo": "Tabla reflexiva", "cab": ["Pregunta", "Rosa"],
    "filas": [
     ["¿Cómo integró la IA?", "Solo para el material de partida: la tarea, las preguntas y la evaluación son suyas."],
     ["¿Qué cambió en la actividad?", "Antes describían una foto de hoy; ahora predicen, y eso obliga a usar el futuro con sentido."],
     ["¿Qué puso ella?", "La elección de la imagen, las preguntas guía y la rúbrica de la exposición."],
     ["¿Qué aprendió?", "A iterar el prompt con criterios didácticos, no estéticos."]]}]},

 "L5": {"vivo": [{"tipo": "quiz", "titulo": "Pruébalo: las tres preguntas de Paula",
   "preguntas": [
    {"q": "1 · ¿Qué estamento trabajaba la tierra?", "opciones": ["La nobleza", "El clero", "El campesinado", "La realeza"], "bien": 2,
     "explica": "El campesinado trabajaba la tierra y pagaba rentas al señor."},
    {"q": "2 · ¿Qué debía el vasallo a su señor?", "opciones": ["Protección y un feudo", "Fidelidad y ayuda militar", "Nada: eran iguales"], "bien": 1,
     "explica": "El vasallo juraba fidelidad y ayuda militar; el señor le daba protección y un feudo. (En Forms es una cuadrícula con los dos.)"},
    {"q": "3 · ¿Por qué un campesino aceptaba depender de un señor?", "abierta": True,
     "explica": "Respuesta modelo: porque a cambio recibía protección frente a ataques y tierra para cultivar, en una época sin un poder central fuerte."}],
   "nota": "En Forms, en modo cuestionario, con la puntuación y las respuestas visibles al enviar: la autoevaluación se corrige sola."}]},

 "B2": {"vivo": [{"tipo": "linea", "titulo": "Su vídeo en Edpuzzle: 4:00 y tres preguntas, justo después de cada paso difícil", "dura": "4:00",
   "marcas": [
    {"t": "1:10", "paso": "Agrupar formas", "q": "Para unir el aro y el cuerpo del llavero en una sola pieza, ¿qué botón usas?",
     "opciones": ["Agrupar", "Alinear", "Duplicar"], "bien": 0, "explica": "Agrupar une las formas en una sola pieza que se mueve y se exporta junta."},
    {"t": "2:30", "paso": "Crear huecos", "q": "¿Cómo haces el agujero para la anilla?",
     "opciones": ["Pongo un cilindro en modo «Hueco» y agrupo", "Borro un trozo con la goma", "Bajo la opacidad del aro"], "bien": 0,
     "explica": "Una forma en modo «Hueco» agrupada con la pieza la agujerea."},
    {"t": "3:40", "paso": "Medir en milímetros", "q": "El llavero tiene que medir 5 cm de largo. ¿Qué escribes en Tinkercad?",
     "opciones": ["5", "50", "500"], "bien": 1, "explica": "Tinkercad mide en milímetros: 5 cm son 50 mm."}]}]},
}
 # 17-sep · «Hay algunos que ya te di ejemplo antes, usa esos cuando sea posible» (Norberto, revisión de retos del 15-sep):
 # A2, A3, B2 y B3. Su `enlace` es el de siempre; `real` dice qué es para el pie, y la página lo pone el PRIMERO, incrustado.
for _k, _real in {
    "A2": {"titulo": "Publicar y compartir un Genially", "autor": "Mr. Cuarter", "donde": "YouTube",
           "por_que": "Un tutorial corto que explica un procedimiento paso a paso: justo lo que pide el reto."},
    "A3": {"titulo": "(Math) Series niveladas", "donde": "Genially",
           "por_que": "Varias actividades para un mismo objetivo, y cada estudiante escoge su camino."},
    "B2": {"titulo": "Taxonomía de Bloom: qué es y ejemplos de aplicación", "donde": "Edpuzzle",
           "por_que": "Un vídeo con preguntas insertadas que comprueban la comprensión mientras se ve."},
    "B3": {"titulo": "(Gamificación) Paisaje de aprendizaje: El viaje del Endurance", "donde": "Genially",
           "por_que": "Un paisaje terminado: la matriz de este reto es la planificación que lo sostiene."},
}.items():
    EJEMPLOS_EXTRA.setdefault(_k, {})["real"] = _real
for _k, _v in EJEMPLOS_EXTRA.items():
    EJEMPLOS_RETOS[_k].update(_v)
# 15-sep · EL RETO SECRETO (S7) ES EL ESCAPE UNI (Norberto). En la Nave, su botón de entrada; al final del escape, el
# botón lleva a validar.html?reto=S7&llave=… (la llave, PALABRA_HUEVO de Datos.gs; la web solo lleva su huella).
ESCAPE_UNI = "https://view.genially.com/6a461360d187e3f8869ca453"

GANCHO_RETOS = {
 "A0": "Un vídeo de 60 s presentándote, al padlet de la clase, y el enlace de tu publicación.",
 "A1": "Cuenta aquí algo que tengas (o dejaste) a medias y qué te frenó. Y lee a tu tripulación.",
 "B1": "Abre tu ePortfolio y publica su primera entrada: tu presentación. El enlace, aquí y en tu BIO.",
 # 16-sep · los relámpago: diez o quince minutos, en clase. La línea dice el gesto, no la teoría.
 "L1": "Una imagen didáctica con IA (prompt + una iteración) y un logo con tu palabra clave.",
 "L2": "Tu sesión en dos listas: qué hacen antes de clase y qué durante.",
 "L3": "Cinco líneas tuyas: qué es un itinerario y en qué se diferencia de un paisaje.",
 "L4": "Abre un recurso tuyo en incógnito y sube la captura de que se ve sin tu cuenta.",
 "L5": "Un cuestionario de autoevaluación de tres preguntas, enlazado en tu Bitácora.",
 "L6": "Justifica un recurso tuyo según una metodología. Diez líneas exactas.",
 "L7": "Una tabla de clasificación sencilla para una dinámica de tu aula.",
 "L8": "Un QR que abra un recurso tuyo, dentro de una lámina, con su captura.",
 "XS": "El ensayo general: 90 minutos de reloj para resolver un caso como el del examen.",
 "X1": "Pulsa «Lo he hecho» cuando hayas ENVIADO la Actividad 1, con su enlace (obligatorio).",
 "A2": "Un clip de 60 s explicando un concepto a quien faltó a clase.",
 "B2": "Un videotutorial con dos o tres preguntas insertadas dentro.",
 "A3": "Un Genially con una bifurcación: 2 o 3 actividades para un mismo objetivo, y cada cual elige.",
 "B3": "La matriz 8×6: inteligencias múltiples por niveles de Bloom.",
 "X2": "Pulsa «Lo he hecho» cuando hayas ENVIADO la Actividad 2, con su enlace (obligatorio).",
 "A4": "Comparte algo del curso en abierto con #mutecdstargate.",
 "B4": "Tu aula virtual con una tarea o un material publicado, en un doc con 2 capturas.",
 "A5": "Una rúbrica de 3-4 criterios para evaluar un objetivo, lista para que la use cualquiera.",
 "B5": "El centro de recursos de tu alumnado: una web (Sites o Genially) con tu rúbrica a la vista.",
 "A6": "Joran te reta: gánale a su simulador con lo que llevas aprendido.",
 "B6": "Un juego digital con niveles o varias formas de jugar, al servicio de un objetivo.",
 "A7": "Crea una insignia con sentido para una tarea rutinaria, y cuenta su porqué.",
 "B7": "Un toque de juego sobre una tarea, envuelto en una historia.",
 "S7": "Escápate del Escape UNI: el botón del final registra el reto.",
 "A8": "Una experiencia AR/VR que ya exista: su enlace, y aquí cómo la usarías.",
 "B8": "Una experiencia AR/VR (de un QR a una escena VR) y la Bitácora publicada.",
}

CREDITOS = {"reclutamiento": 20, "retoA": 20, "retoB": 50, "retoB_pua": 55,
            "actividad": 100, "final": 100, "derivada": 60,
 # 16-sep · el relámpago paga poco a propósito: son 10 o 15 minutos en clase, y si pagara como un
 # reto B desinflaría el Arsenal (el medio punto cuesta 550 ◈). El simulacro sí paga: son 90 minutos.
 "relampago": 10, "simulacro": 60,}
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

# ─────────────────────────── LA NAVE POR CAPÍTULOS (13-sep) ───────────────────────────
# Norberto: «de primeras no quiero que puedan hacer mil cosas, esto puede agobiar. Me gustaría ir poco
# a poco y que se desbloquearan las opciones cada semana». Cada capítulo abre una pieza de la Nave en
# su semana y NEBULA la presenta en dos o tres pasos. Quien llega tarde ve los que le faltan, EN ORDEN.
#
# 🔴 UN SOLO SITIO. Lo leen la Nave (qué pestañas hay y qué cuenta NEBULA), la sesión que proyecta el
# docente (las diapositivas de «se abre esta semana» y la Nave del Comandante) y la consola (quién ha
# visto cada capítulo). Las recompensas del Mercado que abre cada capítulo llevan su semana en
# `apps-script/Datos.gs` (el catálogo del motor) y aquí en RECOMPENSAS: la batería 72 comprueba que
# las tres cosas coinciden.
#
# 🔴 PUA: las cinco primeras semanas son LAS MISMAS que en REGULAR (se aprende a jugar igual de
# despacio), y lo de después se comprime como el resto del curso. Es la misma regla que aplica
# `motor/paquete.js → semanaTienda()` a la tienda.
#
# `abre`: lo que aparece —pestañas (mercado, rankings, zoco) y piezas (heroes, adornos, arsenal)—.
# `listo: False` = aún no existe en la Nave (el Zoco): no se enseña ni se cuenta.
def semana_capitulo(semana_regular, tipo):
    if tipo != "PUA" or semana_regular <= 5:
        return semana_regular
    # 🔴 14-sep · lo de DESPUÉS de la semana 5 se reparte en las semanas que le quedan al PUA (6…8),
    # nunca antes de la 5: con la cuenta de antes (escalar todo el curso) la semana 6 caía en la 3,
    # antes que el Zoco. Misma regla en motor/paquete.js → semanaTienda (la batería 72 lo vigila).
    import math
    total, suyas = SEMANAS_PER["REGULAR"], SEMANAS_PER["PUA"]
    return max(min(6, suyas), min(suyas, 5 + math.ceil((semana_regular - 5) * (suyas - 5) / (total - 5))))

CAPITULOS = [
    {"n": 1, "clave": "c1", "titulo": "Canal abierto", "icono": "🛰️", "semana": 1,
     "abre": ["nave", "retos", "botin"], "mercado": [],
     "cabecera": "Tu Nave, ya en marcha",
     "puedes": ["Tu personaje, tu nivel y tus créditos, siempre a la vista",
                "Los retos de la semana: se hacen y se marcan con «Lo he hecho» (con el enlace de tu evidencia)",
  "📓 Tu Bitácora, desde hoy: el viaje entero termina en ella, y el primer reto B es abrirla",
  "⚡ Los retos relámpago: diez o quince minutos, y se hacen EN CLASE — quien viene, sale con el reto hecho",
                "✋ Presente en la llamada a filas: créditos y un sobre de regalo",
                "Mi botín: tus insignias y tu álbum de cromos"],
     "imagen": "assets/img/canje/sobre.jpg"},
    {"n": 2, "clave": "c2", "titulo": "El Mercado Estelar", "icono": "🛒", "semana": 2,
     "abre": ["mercado", "rankings"], "mercado": ["cromo", "cromo_repes"],
     "cabecera": "Ya puedes gastar tus créditos",
     "puedes": ["Comprar sobres de cromos: tres cartas al azar por 15 ◈",
                "Cambiar 3 cartas repetidas por un sobre nuevo, gratis",
                "Los rankings: tu clase de ocho maneras distintas, y tu duelo con quien tienes cerca"],
     "imagen": "assets/img/canje/sobre.jpg"},
    {"n": 3, "clave": "c3", "titulo": "La Rebelión", "icono": "🛡️", "semana": 3,
     "abre": ["heroes"], "mercado": ["heroe"],
     "cabecera": "Llegan los Héroes de la Rebelión",
     "puedes": ["La cápsula de rescate del Mercado: un héroe al azar de 30 por 60 ◈",
                "Ponértelos (y quitártelos) gratis en tu vestuario",
                "Cambiar 2 héroes repetidos por uno nuevo al azar"],
     "imagen": "assets/img/canje/capsula_rescate.jpg"},
    {"n": 4, "clave": "c4", "titulo": "Tu insignia de mando", "icono": "🖼️", "semana": 4,
     "abre": ["adornos"], "mercado": ["titulo", "fondo", "marco", "sobre_grande"],
     "cabecera": "Tu ficha, a tu gusto",
     "puedes": ["Un título bajo tu alias", "El fondo de tu ficha: el planeta que elijas",
                "El marco dorado de tu avatar", "Se ven en tu ficha y en el tablero de la clase",
                "Y en el Mercado, el sobre grande: cinco cartas en vez de tres"],
     "imagen": "assets/img/canje/marco.jpg"},
    # 16-sep · DE MENOS A MÁS COMPLEJO. Norberto: «revisa lo que se presenta cada semana… debería ir de menos complejo a
    # más complejo». Eligió mi propuesta: comprar (2) → comprar y vestirse (3) → personalizar (4) → comprar con prisa (5,
    # las ofertas) → apostar (6, el Sorteo) → ahorrar para lo caro (7, el Hangar) → negociar con personas (8, el Zoco) →
    # dominarlo todo (9, los logros) → la nota (15). En PUA (8 semanas, 10 capítulos) se juntan: 6 Sorteo y Hangar,
    # 7 Zoco y logros, 8 Arsenal. El servidor abre el Zoco (ZOCO.SEMANA), las ofertas (OFERTAS.SEMANA_MIN) y paga los
    # logros (CAPITULO) en estas mismas semanas: la batería 79 lo compara.
    #
    # LA OFERTA DE LA SEMANA: empezaba en la 3, a la vez que los héroes y sin que nadie la explicara. Ahora tiene su capítulo.
    {"n": 5, "clave": "c10", "titulo": "La oferta de la semana", "icono": "⚡", "semana": 5,
     "abre": ["ofertas"], "mercado": [],
     "cabecera": "Cada semana, algo rebajado… por poco tiempo",
     "puedes": ["Cada semana sale una oferta en el Mercado: un sobre, una cápsula, un héroe o una carta concretos",
                "Rebajada entre un 20 y un 40 %, y solo hasta que acaba la semana: verás la cuenta atrás",
                "Si es algo raro, hay pocas unidades: cuando se acaban, se acabó",
                "Una por persona. Y tu docente también puede preparar las suyas"],
     "imagen": "assets/img/canje/oferta.jpg"},
    # 16-sep · en PUA NO hay Gran Sorteo (Norberto: «nooo hay sorteo»): son 8 semanas y el premio es de la convocatoria larga.
    {"n": 6, "clave": "c6", "titulo": "El Gran Sorteo", "icono": "🎟️", "semana": 6, "sin_pua": True,
     "abre": ["sorteo"], "mercado": ["sorteo", "sobre_raro"],
     "cabecera": "El Gran Sorteo de la tripulación",
     "puedes": ["Se sortean dos licencias de Genially de un año completo",
                "Cada participación es una papeleta: cuantas más tengas, más posibilidades",
                "Se compran en el Mercado, y tu docente también las regala (o las esconde en un enlace)",
                "Se sortea solo en la semana 16: ese día, al entrar en tu Nave, verás el resultado",
                "Como en una lotería, lo que pagas no se devuelve… y nadie gana dos",
                "Y en el Mercado, el sobre de raras: casi sin comunes, para cerrar las series difíciles"],
     "imagen": "assets/img/canje/sorteo.jpg"},
    # 14-sep · EL HANGAR (Norberto: «que hubiera un cofre legendario, donde siempre toca un avatar
    # legendario; obviamente caro… y para la 10 debería estar todo descubierto»). 16-sep: de la 8 a la 7, antes que el
    # Zoco: al llegar a él ya se sabe lo que vale cada pieza (y hay legendarias que cambiar).
    # 16-sep · tampoco el Hangar: con 4.350 xp y menos créditos, la cápsula legendaria (320 ◈) es un escaparate que nadie alcanza.
    {"n": 7, "clave": "c8", "titulo": "El Hangar de las Leyendas", "icono": "🟨", "semana": 7, "sin_pua": True,
     "abre": [], "mercado": ["sobre_epico", "capsula_elite", "capsula_legendaria"],
     "cabecera": "Las cápsulas de élite, la legendaria y el sobre épico",
     "puedes": ["La cápsula de élite: un héroe de la Vanguardia o un Mito, sin la Resistencia",
                "La cápsula legendaria: un Mito seguro. La más cara del hangar",
                "El sobre épico: tres cartas sin comunes, con muchas más legendarias",
                "Tu docente también puede esconder una cápsula legendaria en una presentación… o dártela de premio"],
     "imagen": "assets/img/canje/capsula_legendaria.jpg"},
    # 16-sep · EL ZOCO, de la 5 a la 8 (en PUA, la 7): lo más complejo de la Nave —negociar con otras personas en 3 pasos,
    # con lo ofrecido apartado, topes y caducidad—, cuando ya hay repetidas (y legendarias) que cambiar.
    # 16-sep · y el Zoco se queda fuera de PUA: negociar en tres pasos, con lo apartado y 7 días de caducidad, no cabe en 8 semanas.
    {"n": 8, "clave": "c5", "titulo": "El Zoco Estelar", "icono": "🔄", "semana": 8, "sin_pua": True,
     "abre": ["zoco"], "mercado": [],
     "cabecera": "El trueque entre reclutas",
     "puedes": ["Poner tus héroes y cromos en el Zoco (repetidos o no)",
                "Ofrecer lo tuyo por lo de otro recluta: créditos, cartas o héroes",
                "Aceptar, rechazar con un mensaje o contraofertar: 3 pasos y trato cerrado",
                "Lo que ofreces queda apartado hasta que te respondan",
                "Y las participaciones del Gran Sorteo: si te ofrecen buen precio, se revenden aquí"],
     "imagen": "assets/img/canje/heroe.jpg"},
    # 15-sep (noche) · LOS LOGROS DE A BORDO. Hasta que se presentan, la Nave los apunta en silencio (y los días a bordo
    # cuentan desde el primero): ese día NEBULA los presenta con lo que cada cual ya lleva, y el servidor paga entonces las
    # cubiertas que ya estuvieran completas. 16-sep: los últimos, en la 9 (en PUA, la 7, con el Zoco): piden haberlo
    # usado todo, y así todo lo que piden ya está abierto.
    {"n": 9, "clave": "c9", "titulo": "Los logros de a bordo", "icono": "🎖️", "semana": 9, "semana_pua": 6,
     "abre": ["logros"], "mercado": [],
     "cabecera": "Lo que ya sabes hacer en la Nave, con premio",
     "puedes": ["16 logros: la primera vez que haces cada cosa en la Nave. Se apuntan solos, y los que ya hiciste también cuentan",
                "5 cubiertas: el puente, el Mercado, el camarote, el Zoco y la constancia. Cada una completa trae su premio",
                "La constancia son tus días a bordo: tres seguidos, siete seguidos y veinte en total",
                "Las cinco: el Contramaestre de la Nave, un héroe legendario (él y ella) y una carta con tu alias",
                "No se compra, no se regala y no se cambia en el Zoco: solo se gana"],
     "imagen": "assets/img/canje/logros.jpg"},
    # 16-sep · EL SIMULADOR DE JORAN (el reto A6). Norberto: «la misma semana 10 les puedo dejar hacer la actividad en
    # clase y la semana siguiente mostramos el emulador desbloqueado (aunque algunos ya lo tendrán desbloqueado)». La
    # batalla se abre con el planeta Ludo (tema 6, semana 10); este capítulo la presenta a la clase entera la semana
    # siguiente. En PUA el tema 6 cae en la 5, así que el capítulo va con el Arsenal, en la 8.
    {"n": 10, "clave": "c11", "titulo": "El Simulador de Joran", "icono": "🎮", "semana": 11, "semana_pua": 7,
     "abre": ["simulador"], "mercado": [],
     "cabecera": "El simulador que dejó encendido Joran",
     "puedes": ["Si le ganaste a RUTA AZUL en el reto A6, el simulador ya está en tu Nave",
                "Y si no, vuelve a intentarlo: cada derrota lo cansa y ataca más despacio",
                "Entrena tema a tema, o con todas las preguntas del viaje a la vez",
                "Cada modo tiene su ranking: ganar vale, ganar entero vale más y ganar sin fallar, lo máximo",
                "Es repaso de verdad: las preguntas salen del temario, y la batalla final es el examen"],
     "imagen": "assets/img/canje/simulador.jpg"},
    {"n": 11, "clave": "c7", "titulo": "El Arsenal de batalla", "icono": "⚔️", "semana": 15,
     "abre": ["arsenal"], "mercado": ["nota"],
     "cabecera": "El Arsenal: créditos por nota",
     "puedes": ["Subir 0,5 o 1 punto en un entregable, o que se recalifique un trabajo",
                "Queda pendiente hasta que tu docente lo apruebe",
                "Ojo: si ya tienes la nota máxima, no te sube nada"],
     "imagen": "assets/img/canje/nota_1punto.jpg"},
]
for _c in CAPITULOS:
    _c["semanas"] = {"REGULAR": _c["semana"], "PUA": _c.get("semana_pua") or semana_capitulo(_c["semana"], "PUA")}
    # 16-sep · lo que un PUA no tiene (decidido por Norberto): el Gran Sorteo, el Zoco y el Hangar. En 8 semanas hay
    # que aprender a jugar, no a hacerlo todo: se quedan comprar, vestirse, personalizar, las ofertas, los logros, el
    # simulador y el Arsenal. La web, el servidor y el paquete del grupo miran esta misma marca.
    if _c.get("sin_pua"): _c["semanas"]["PUA"] = None
CAPITULOS_PUA = [c for c in CAPITULOS if not c.get("sin_pua")]

# 🔴 LO QUE UN GRUPO PUA NO TIENE (16-sep). Norberto: «en PUA podríamos capar ciertas opciones: nooo hay sorteo,
# podemos quitar zoco…». Sale de los capítulos marcados `sin_pua`, para que no haya una segunda lista que mantener:
#   · la tienda: lo que vendían esos capítulos (participaciones del sorteo, sobre de raras y el Hangar entero);
#   · el sorteo: no se crea con el grupo;
#   · los logros de a bordo: los cuatro que piden Zoco o sorteo, y con ellos su cubierta. En PUA son 12 en 4 cubiertas,
#     y el Contramaestre llega al completar las cuatro (el premio es el mismo: nadie se queda sin poder ganarlo).
# Lo miran igual la web (la Nave, la consola, la sesión), el paquete del grupo (motor/paquete.js) y el servidor
# (GamificaPro: stargateABordo.js y stargateZoco.js). La batería 81 los compara.
SIN_PUA = {
    "capitulos": [c["clave"] for c in CAPITULOS if c.get("sin_pua")],
    "tienda": sorted({t for c in CAPITULOS if c.get("sin_pua") for t in c["mercado"]}),
    "sorteo": True,
    "cubiertas": ["zoco"],
    "hitos": sorted({h[0] for h in HITOS_A_BORDO if h[1] == "zoco"} | {"sorteo"}),
}
assert [c["n"] for c in CAPITULOS] == list(range(1, len(CAPITULOS) + 1)), "los capítulos van en orden"
assert all(CAPITULOS[i]["semana"] <= CAPITULOS[i + 1]["semana"] for i in range(len(CAPITULOS) - 1)), \
    "un capítulo no puede abrirse antes que el anterior"

# ─────────────────── EL SIMULADOR DE JORAN · la batalla del reto A6 (16-sep) ───────────────────
# Norberto: «Reto A6: vamos a hacer algo más épico… se van a enfrentar a un juego de preguntas contra Joran… GamificaPro
# tiene un motor de peleas, revísalo y lo usamos… si el usuario gana desbloquea algo nuevo en su nave: el Simulador de
# Joran… habrá un ranking de cada tema y un modo en que entren todas las preguntas».
#
# 🔴 LAS PREGUNTAS NO ESTÁN AQUÍ. El banco (con sus respuestas) vive en GamificaPro —repositorio privado—, en
# `functions/stargateBanco.js`, y solo sale de allí pregunta a pregunta. Esta web es PÚBLICA: lo que hay aquí son los
# números que se le enseñan al alumnado, y tienen que ser los mismos que en `functions/stargateBatalla.js → BATALLA`
# (la batería 80 los compara).
BATALLA = {
    "reto": "A6", "clave": "joran", "rival": "RUTA AZUL", "creador": "Joran Pike", "capitulo": "c11",
    "tema_reto": 6, "temas_reto": [1, 2, 3, 4, 5],
    "vida": 100, "vida_rival": 180, "golpe": 20, "golpe_rival": 10,
    "cadencia": 25, "preguntas": 14, "cura": 35, "lentitud": 12,
    # 16-sep · Norberto: «sería fantástico poder escoger el nivel de dificultad en el juego». El nivel cambia las
    # preguntas que salen, lo que aguanta el rival, cada cuánto pega y lo que vale la marca. El reto A6 va siempre en
    # media: la insignia de Joran cuesta lo mismo para todo el mundo.
    "nivel_reto": "media",
    "niveles": [["facil", "Fácil", "Sobre todo preguntas fáciles. Aguanta menos y pega más despacio.", "×0,85"],
                ["media", "Media", "El equilibrio del reto de Joran.", "×1"],
                ["dificil", "Difícil", "Medias y difíciles, aguanta más, pega antes y sin pistas.", "×1,35"]],
    # y los reconocimientos del grupo, que salen del historial de cada recluta
    "medallas": [["rapido", "⚡", "El más rápido", "menos segundos por acierto"],
                 ["certero", "🎯", "El más certero", "más aciertos por respuesta"],
                 ["sabio", "📚", "Quien más sabe", "más respuestas correctas en total"]],
    # 16-sep · el mínimo para optar a «rápido» y «certero» (el espejo de BATALLA.MEDALLAS en GamificaPro): una buena
    # tarde no puede valer por un curso. Lo usan también los rankings de la Nave y de la consola.
    "medallas_min": {"aciertos": 20, "respondidas": 30},
    "objetos": [["cura", "🔧", "Reparación", "Recupera 35 de escudo"],
                ["furia", "⚡", "Sobrecarga", "Tu próximo golpe hace el doble"],
                ["lentitud", "📡", "Interferencia", "Retrasa su ataque 12 segundos"]],
}

# ─────────────────── LAS VOTACIONES DEL AULA (16-sep) ───────────────────
# Norberto: «las votaciones en vivo deberían vivir también en el mismo sitio que has puesto los cronómetros, es gestión de
# aula. También cada docente puede publicar una votación para que respondan, la próxima semana se resuelve. Ejemplo:
# ¿qué herramienta prefieres que aprendamos la próxima semana? GamificaPro tiene algo divertido, compra voto extra:
# impleméntalo también».
#
# 🔴 No hace falta servidor nuevo: el motor ya trae `castVote` (con voto gratis y voto de PAGO, que es el «voto extra») y
# las reglas ya dejan a cada docente del grupo crear y cerrar sus votaciones. Aquí solo están los números.
VOTACION = {
    "min_opciones": 2, "max_opciones": 5,
    "voto_extra": 15,        # ◈ por cada voto de más (el servidor los cobra al votar)
    "max_extra": 2,          # cuántos votos de pago como mucho por persona
    "pregunta_max": 120, "opcion_max": 60,
    "ejemplos": ["¿Qué herramienta prefieres que veamos la semana que viene?",
                 "¿Qué reto B enseñamos en clase?",
                 "¿Con qué planeta empezamos el repaso?"],
}

# ─────────────────────────── EL GRAN SORTEO (14-sep) ───────────────────────────
# Norberto: «el sorteo de dos licencias de Genially de año completo, a partir de la semana 6: que los
# estudiantes puedan comprar participaciones y el profe regalarlas, o que el referente embeba
# participaciones». Cada grupo nuevo nace con estos sorteos (motor/paquete.js); el referente puede
# cambiarlos o crear más desde la consola (pestaña «Sorteos»). Lo decide el servidor
# (GamificaPro, functions/stargateSorteo.js): una papeleta por participación y nadie gana dos veces.
#   [id, premio, descripción, ganadores, coste de la participación ◈, máx por persona,
#    desde semana (venta), semana del sorteo, imagen]
SORTEOS = [
    ("sorteo1", "Licencia de Genially (un año completo)",
     "Se sortean dos licencias de Genially de un año completo entre toda la tripulación. Cada "
     "participación es una papeleta: cuantas más tengas, más posibilidades. Como en una lotería, lo "
     "que pagas no se devuelve: si te toca, enhorabuena. Se sortea SOLO en la semana 16 (la del "
     "canje); ese día, al entrar en tu Nave, verás el resultado. Nadie gana dos.",
     # 0 = sin tope por persona (Norberto, 14-sep: «igual alguien apuesta todo su dinero»); a la venta
     # desde la 6 y se resuelve SOLO en la 16 (Norberto: «es como una lotería… se resuelve la semana 16»)
     2, 20, 0, 6, 16, "sorteo.jpg"),
]

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
# ─────────────────────────── SOBRES Y CÁPSULAS (14-sep) ───────────────────────────
# Norberto: «para dar más vida a los cromos, ¿diferentes tipos de sobres? como los cofres del Clash
# Royale… jugando con los precios y la semana de desbloqueo (para la 10 debería estar todo
# descubierto)». Y para los héroes, un concepto distinto de «sobre» —«un avatar es una persona»—:
# la CÁPSULA DE RESCATE (llega a la Nave con alguien dentro), con una LEGENDARIA que siempre trae un
# Mito. Cada tipo: cuántas piezas trae (`usos`) y cuánto pesa cada rareza (×; 0 = no sale). Lo usan
# el motor (motor/paquete.js, cofres de GamificaPro) y las descripciones del Mercado (porcentajes).
COFRES = {
    "cromo":              {"piezas": "cromos", "usos": 3},
    "sobre_grande":       {"piezas": "cromos", "usos": 5},
    "sobre_raro":         {"piezas": "cromos", "usos": 3, "pesos": {"común": 0.25, "rara": 2, "épica": 2, "legendaria": 1.5}},
    "sobre_epico":        {"piezas": "cromos", "usos": 3, "pesos": {"común": 0, "rara": 1, "épica": 3, "legendaria": 3}},
    "heroe":              {"piezas": "heroes", "usos": 1},
    "capsula_elite":      {"piezas": "heroes", "usos": 1, "pesos": {"rara": 0, "épica": 1, "legendaria": 2}},
    "capsula_legendaria": {"piezas": "heroes", "usos": 1, "pesos": {"rara": 0, "épica": 0, "legendaria": 1}},
}
def _pct_cofre(tipo):
    """El porcentaje de cada rareza en una tirada de ese cofre, con los pesos reales del catálogo."""
    c = COFRES[tipo]; f = c.get("pesos", {})
    filas = [(x[3], x[4]) for x in CROMOS] if c["piezas"] == "cromos" else [(x[2], x[3]) for x in HEROES]
    w = {}
    for rz, peso in filas:
        k = rz.lower(); w[k] = w.get(k, 0) + peso * f.get(k, 1)
    t = sum(w.values()) or 1
    return {k: round(100 * v / t) for k, v in w.items() if v > 0}

IMG_RECOMPENSA = {
 "Sobre de cromos":                                "sobre.jpg",
 "Cambiar 3 repetidos por un sobre":               "repetidos.jpg",
 "Título de recluta":                              "titulo.jpg",
 "Fondo de ficha: tu planeta":                     "planeta.jpg",
 "Marco dorado del avatar":                        "marco.jpg",
 "Cápsula de rescate":                             "capsula_rescate.jpg",
 "Sobre grande":                                   "sobre_grande.jpg",
 "Sobre de raras":                                 "sobre_raro.jpg",
 "Sobre épico":                                    "sobre_epico.jpg",
 "Cápsula de élite":                               "capsula_elite.jpg",
 "Cápsula legendaria":                             "capsula_legendaria.jpg",
 "Subir 0,5 en un entregable":                     "nota_05.jpg",
 "Subir 1 punto en un entregable":                 "nota_1punto.jpg",
 "Recalificar un trabajo entregado fuera de plazo": "nota_plazo.jpg",
 "Recalificar un suspenso":                        "nota_suspenso.jpg",
}

RECOMPENSAS = [
 ("Sobre de cromos", 15, 99,
  "TRES cartas al azar de las 26 del álbum (5 series). Los tripulantes son comunes; los Ecos, NEBULA y el Capitán, raros; el Recluta y la Estática, épicos; y dos LEGENDARIOS: el General Vaeon y Ander Vaeon, la identidad del villano. La serie V cuenta la caída de Vaeon, de niño a general.", 2, "cromo"),
 ("Cambiar 3 repetidos por un sobre", 0, 99,
  "¿Cartas repetidas? Cámbialas. Por cada 3 repetidas te llevas un sobre nuevo, gratis. No cuesta créditos y se comprueba solo: si no llegas a 3, se te avisa y no pierdes nada.", 2, "cromo_repes"),
 ("Título de recluta", 40, 3,
  "Un título narrativo bajo tu alias en el tablero y la Nave. Lo eliges tú en Mi botín.", 4, "titulo"),
 ("Fondo de ficha: tu planeta", 35, 1,
  "Tu ficha de la Nave con el planeta que elijas de fondo. Eliges cuál de los ocho en Mi botín.", 4, "fondo"),
 ("Marco dorado del avatar", 60, 1,
  "Tu avatar con marco y brillo dorados en el ranking y la Nave. Te lo pones (y te lo quitas) en Mi botín.", 4, "marco"),
 ("Cápsula de rescate", 60, 99,
  "Una cápsula de rescate llega a tu Nave con UN héroe de la Rebelión dentro, al azar: 30 figuras en tres rangos. ⚔️ La Resistencia (%d%%): el grueso del ejército. 🔥 La Vanguardia (%d%%): van por delante, cuesta alcanzarlas. 🌟 Los MITOS (%d%%, ni uno de cada doce): ni siquiera se dejan ver hasta que caen. Se acumulan —cuantos más tengas, más donde elegir— y te los pones gratis desde tu Nave. ¿Repetido? Con 2 repetidos, uno nuevo al azar." % (_pct_cofre("heroe")["rara"], _pct_cofre("heroe")["épica"], _pct_cofre("heroe")["legendaria"]), 3, "heroe"),
 ("Sobre grande", 25, 99,
  "CINCO cartas al azar del álbum (en vez de tres), con las mismas probabilidades que el sobre de siempre: más cartas por cada crédito.", 4, "sobre_grande"),
 ("Sobre de raras", 35, 99,
  "TRES cartas donde las comunes casi desaparecen: rara %d%%, épica %d%%, legendaria %d%% (y común solo %d%%). Para cerrar las series difíciles." % (_pct_cofre("sobre_raro")["rara"], _pct_cofre("sobre_raro")["épica"], _pct_cofre("sobre_raro")["legendaria"], _pct_cofre("sobre_raro")["común"]), 6, "sobre_raro"),
 ("Sobre épico", 60, 99,
  "TRES cartas y ninguna común: rara %d%%, épica %d%% y LEGENDARIA %d%% en cada carta, cuatro veces más que en el sobre de siempre." % (_pct_cofre("sobre_epico")["rara"], _pct_cofre("sobre_epico")["épica"], _pct_cofre("sobre_epico")["legendaria"]), 7, "sobre_epico"),
 ("Cápsula de élite", 140, 99,
  "En esta cápsula no viaja la Resistencia: un héroe de la Vanguardia (%d%%) o un MITO (%d%%, casi cuatro veces más que en la de rescate)." % (_pct_cofre("capsula_elite")["épica"], _pct_cofre("capsula_elite")["legendaria"]), 7, "capsula_elite"),
 ("Cápsula legendaria", 320, 99,
  "Un MITO seguro: uno de los héroes legendarios de la Rebelión, siempre. La cápsula más cara del hangar, y también la que tu docente puede esconder en una presentación o darte de premio.", 7, "capsula_legendaria"),
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
    "es cada tripulante, los retos de cada tema, los mensajes semanales para el foro de la plataforma de UNIR, esta web entera, "
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
             "portadas de cada tema, las 24 insignias y las 26 cartas del álbum. Con "
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
       texto="La web que estás leyendo, el puesto de mando del profesorado y la Nave del alumnado están "
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
  quien="El profe <b>referente</b>: una persona por curso. Crea el grupo y reparte las llaves.",
  cuanto="Siete pasos · se hacen UNA vez por grupo",
  porque="Desde el 12-sep esto ya no vive en una hoja de cálculo: es una página más de la web, y se "
         "entra con tu cuenta de Google. Lo de la hoja está en <a href='legacy.html'>el archivo</a>.",
  pasos=[
   dict(cod="R1", t="La consola del referente", pose="saluda", img="r1_consola.png",
    hacer="Abre <code>crear.html</code> y entra con tu cuenta de Google.",
    voz="Esto es la sala de máquinas de STARGATE. Antes era una hoja de cálculo con un menú; ahora "
        "es esta página. Entras con tu cuenta de Google, la misma con la que llevas tus cosas de la "
        "asignatura, y no hay ningún PIN que recordar. Si eres el profe referente de tu grupo, esta "
        "página es para ti. Son siete pasos, y luego casi no vuelves por aquí."),

   dict(cod="R2", t="Cinco datos y ya", pose="pensativo", img="r2_grupo.png",
    hacer="Bloque <b>1 · El grupo</b>: nombre, tipo y el primer día de la semana 1.",
    voz="Un grupo es un curso concreto con su gente y su calendario. El nombre es para ti, y de él "
        "sale solo el identificador. El tipo cambia el ritmo, porque REGULAR son quince semanas y "
        "PUA va comprimido. Y la fecha de la semana uno es la pieza importante: de ella dependen el "
        "foro, los desbloqueos de la Nave y las recompensas. Ponla bien y olvídate."),

   dict(cod="R3", t="Los enlaces de la clase", pose="senala", img="r3_enlaces.png",
    hacer="Bloque <b>2 · Los enlaces</b>: el Padlet y el panel de control. El ticket de salida ya va solo.",
    voz="Aquí van el Padlet de la clase y tu panel de control. El ticket de salida ya no se pregunta: "
        "es el mismo para todos los grupos y para todos los años, y la Nave le dice "
        "sola de qué grupo y de qué Comandante viene cada respuesta. Sigue siendo un formulario de "
        "Google porque tiene que ser anónimo, y eso es innegociable."),

   dict(cod="R4", t="El equipo docente", pose="tablet", img="r4_equipo.png",
    hacer="Bloque <b>3 · El equipo</b>: un nombre y un correo por persona. Marca quién es referente.",
    voz="Esta lista es la llave. Quien esté aquí con su correo entra en Mis grupos simplemente iniciando "
        "sesión, sin que le tengas que dar nada. Ya no hay dos PIN que repartir ni que cambiar antes "
        "del estreno: si alguien se va del equipo, lo borras de la lista y deja de entrar. Y cada "
        "docente se lleva su escuadrón, con su nombre y su emblema."),

   dict(cod="R5", t="Lo que aparece solo", pose="brazos", img=None,
    hacer="Pulsa <b>Crear el grupo</b> y espera. Verás el avance paso a paso.",
    voz="Un minuto de paciencia. En ese minuto el sistema siembra el grupo entero: los veinte "
        "retos con sus insignias, los ocho planetas con su bonus, las diez recompensas con sus "
        "precios y sus fechas, los escuadrones con sus emblemas y los personajes del álbum. No hay "
        "que configurar nada más: ya está funcionando."),

   dict(cod="R6", t="Lo único que tienes que repartir", pose="senala", img=None,
    hacer="El <b>código de clase</b>: está en la tarjeta del grupo, en Mis grupos, con el botón <b>«Copiar invitación»</b>.",
    voz="Un código. Uno solo, de seis caracteres, y sale en grande en la tarjeta del grupo para que "
        "lo escribas en la pizarra. Tu alumnado entra por la portada con su cuenta de Google, escribe "
        "el código y se alista. Y si prefieres mandarlo por escrito, el botón Copiar invitación te da "
        "un mensaje listo para el foro de la plataforma de UNIR, con el enlace directo dentro. Ya no hay "
        "tres formularios que repartir ni un documento con candado: esto se lo puedes dar a una clase sin pensarlo."),

   dict(cod="R7", t="El puesto de mando", pose="pulgar", img="r7_consola.png",
    hacer="<code>consola.html</code>: alumnado, cola de nota, equipo docente y ajustes.",
    voz="Y aquí vives a partir de ahora. El alumnado con su nombre y su correo, otorgar o anular un "
        "reto cuando algo se tuerza, la cola de subidas de nota que apruebas tú, pasar a todo el "
        "alumnado de un docente a otro si alguien se va a mitad de curso, y los ajustes del grupo. "
        "A partir de aquí esto funciona solo. Nos vemos arriba."),
  ]),

 dict(
  id="imparte", icono="🎓", titulo="Si das las clases",
  quien="Quien <b>imparte</b>. Tu referente te pone en el equipo docente con tu correo: con eso entras.",
  cuanto="Seis pasos · cuatro de ellos son lo que harás cada semana",
  porque="Corto a propósito. La <b>visita guiada</b> del Capitán ya te cuenta tus botones, la narrativa, "
         "los retos y las insignias — te la ofrece la primera vez que entras en Mis grupos, y luego está "
         "arriba a la derecha. Aquí está solo lo que se hace cada semana.",
  pasos=[
   dict(cod="D1", t="El atajo que deberías usar primero", pose="saluda", img="d1_portada.png",
    hacer="Portada → <b>Iniciar sesión con Google</b> → en <b>Mis grupos</b>, la visita guiada del Capitán (o el botón <b>▶ Visita guiada</b>, arriba a la derecha).",
    voz="Bienvenido al puesto de mando. Entras por la portada con tu cuenta de Google y aterrizas en "
        "Mis grupos. La primera vez te ofrezco una visita de dos minutos: el código de clase, proyectar "
        "la clase, la llamada a filas, el aula y tu gente, y después el método. Si eres referente, te "
        "enseño también lo tuyo. Aquí voy a enseñarte solo las cuatro cosas que harás cada semana."),

   dict(cod="D2", t="Uno: la orden de la semana", pose="senala", img="d2_cronologia.png",
    hacer="<b>Cronología</b> → despliega la semana que toque → abajo, botón <b>Copiar</b> del foro.",
    voz="La cronología es tu carta de navegación: quince semanas, y cada una te dice qué vídeo "
        "proyectar, qué reto lanzar y qué insignia entregar. Abajo del todo está el mensaje del "
        "foro, ya escrito. Lo copias, lo pegas en el foro de la plataforma de UNIR y sigues con tu vida."),

   dict(cod="D3", t="Dos: tu gente", pose="tablet", img="d3_sala.png",
    hacer="<b>Mis grupos</b> → <b>Entrar en el grupo</b> → <b>Mi gente</b> → pulsa cualquier fila.",
    voz="Esta es tu gente, y entras con tu cuenta de Google: ni PIN, ni escribir tu correo, ni elegir "
        "tu nombre de una lista. Si pulsas a cualquiera se abre su ficha: lo que lleva hecho, sus "
        "insignias, sus créditos, su correo y el enlace de cada evidencia. El aviso sin enlace te dice "
        "dónde falta una. Desde aquí también puedes darle o quitarle un reto a mano cuando algo se tuerza."),

   dict(cod="D4", t="Tres: el aula, dentro del Genially", pose="brazos", img="d7_aula.png",
    hacer="<b>Mis grupos</b> → botón <b>El aula</b> de tu grupo. O dentro del <b>Genially de clase</b> que te da tu referente.",
    voz="Esto es lo que más te va a cambiar la clase. Es tu puesto de mando y vive dentro del "
        "Genially, así que no tienes que salir de la presentación para nada. Desde aquí tocas "
        "llamada a filas y ves quién va fichando en directo; miras a quién felicitar por lo que ha "
        "hecho esta semana y a quién dar la bienvenida porque acaba de llegar; y repartes premios a "
        "mano: experiencia, créditos o una carta de regalo. Incluso puede elegir a alguien al azar "
        "por ti. Se monta una vez y vale para todos tus grupos, siempre."),

   dict(cod="D5", t="Cuatro: los tickets", pose="pensativo", img="d5_tickets.png",
    hacer="Portada → <b>Tickets de salida</b> (si llevas el grupo, también en Mis grupos → Como profe referente) → pulsa cualquier valoración.",
    voz="El ticket de salida es tu termómetro, y es anónimo, así que la gente dice lo que piensa de "
        "verdad. Pulsa cualquier resultado y se ve en grande. Y hay una versión apaisada pensada "
        "para proyectarla en clase: enseñar lo que ha votado el grupo genera más conversación que "
        "preguntarlo en voz alta."),

   dict(cod="D6", t="Lo único que el sistema no hace por ti", pose="pulgar", img="d6_tablero.png",
    hacer="El tablero en vivo, con sus ocho rankings.",
    voz="Y una cosa más, que no está en ninguna pantalla. Los puntos los da el sistema; la ceremonia "
        "la haces tú. Nombra en voz alta a quien recupera un personaje. Enseña el ranking en clase de "
        "vez en cuando. Eso es lo que convierte una tabla en un juego."),
  ]),

 dict(
  id="estudiante", icono="🧑‍🚀", titulo="Si eres recluta",
  quien="El <b>alumnado</b>. Dales el código de clase (o pega la invitación en el foro de la plataforma de UNIR de la semana 1).",
  cuanto="Siete pasos · el segundo es el que importa de verdad",
  porque="Corto porque nadie lee instrucciones largas. Tiene un objetivo por encima de todos: que se "
         "alisten con la cuenta correcta. Es <b>el fallo más caro del sistema</b> — quien un día entra "
         "con otra cuenta desaparece de su Nave con media misión hecha.",
  pasos=[
   dict(cod="E1", t="Una sola puerta", pose="saluda", img="e1_nave.png",
    hacer="La portada de STARGATE → <b>Iniciar sesión con Google</b>.",
    voz="Esta es la puerta, y es la única. Pulsas Iniciar sesión con Google y el sistema sabe quién "
        "eres. Si ya te has alistado, vas directo a tu nave. Si todavía no, te pide el código de "
        "clase que te ha dado tu docente. En dos minutos vas a tener tu personaje, tus puntos y tus "
        "insignias. Sígueme."),

   dict(cod="E2", t="La cuenta. Lo único que puede salir mal", pose="senala", img="e2_cuenta.png",
    aviso=True,
    hacer="Pulsa <b>Iniciar sesión con Google</b> y mira con qué cuenta entras. Si te lo pide, escribe el <b>código de clase</b>.",
    voz="Para. Esto es lo único importante de toda la página. Tu progreso se guarda en la cuenta de "
        "Google con la que entres, y en ninguna otra. Si un día entras con otra, la nave no te "
        "encontrará y habrás perdido lo que llevabas. Usa siempre la misma. Míralo ahora, antes de "
        "seguir. Ya no hay ningún correo que escribir a mano: quien entra eres tú, y el sistema lo "
        "sabe sin preguntártelo."),

   dict(cod="E3", t="Alistarse", pose="tablet", img="e3_alistarse.png",
    hacer="Cuatro bloques: quién eres, tu Comandante, tu personaje y tu Bitácora.",
    voz="Cuatro cosas y estás dentro. El alias es tu nombre público: es el que sale en el tablero, "
        "tu nombre real solo lo ve el profesorado. Eliges a tu Comandante, que es quien te da clase, "
        "y con él te toca su escuadrón y su emblema. Eliges personaje. Y pegas el enlace de tu "
        "Bitácora con dos líneas sobre ti, que las va a leer tu clase cuando pulse tu nombre en el "
        "ranking, así que dedícales diez segundos."),

   dict(cod="E4", t="Tu primer reto", pose="brazos", img="e4_reto.png",
    hacer="En <b>Mi nave</b>, el bloque <b>«Lo que puedes conseguir esta semana»</b> → pulsa el reto "
          "y dentro, <b>Lo he hecho</b>.",
    voz="Nada más alistarte ya estás en la nave, con tu primera insignia. Y lo primero que ves es lo "
        "que puedes conseguir esta semana, con lo que da cada cosa. Pulsa un reto y se abre lo que "
        "hay que hacer, paso a paso. Cuando lo tengas hecho de verdad, Lo he hecho y pegas el "
        "enlace. Verás subir los puntos y el dinero arriba, en el momento, sin recargar nada y sin "
        "enviar ningún formulario."),

   dict(cod="E5", t="La barra de arriba", pose="senala", img="e6_pestanas.png",
    hacer="Siempre contigo: tu nombre, las cinco pestañas y tus <b>xp</b> y <b>créditos</b>.",
    voz="Arriba tienes una barra que no se va nunca. A la izquierda estás tú; a la derecha, tus "
        "puntos y tu dinero, para que los veas subir estés donde estés. Y en medio, cinco sitios. "
        "Mi nave es donde aterrizas: quién eres, lo que toca esta semana y los planetas. Mis retos "
        "es el viaje entero. Mi botín es todo lo que llevas ganado: insignias, cartas y personajes. "
        "El Mercado Estelar es donde gastas. Y Rankings es la clase entera, de ocho maneras "
        "distintas. Los tres puntos de la derecha guardan lo que se usa de vez en cuando."),

   dict(cod="E6", t="Dos marcadores, no uno", pose="tablet", img="e7_premios.png",
    hacer="Pestaña <b>Mercado Estelar</b>: el catálogo con sus precios.",
    voz="Y una cosa que confunde a todo el mundo: hay dos marcadores. Los xp suben de nivel y no se "
        "gastan nunca. Los créditos son dinero, y sí se gastan. Aquí eliges en qué. Hay cosas de "
        "adorno y cosas que tocan tu nota, así que piensa antes de fundirte el sueldo en un marco dorado."),

   dict(cod="E7", t="Ocho formas de ir primero", pose="pulgar", img="e8_tablero.png",
    hacer="Pestaña <b>Rankings</b>: pulsa a cualquiera para ver su ficha.",
    voz="Y una última cosa, que es la que más me gusta. No hay un ranking, hay ocho. El de siempre, "
        "el de esta semana, el de tu escuadrón, el de los escuadrones entre sí, el de quien no falla "
        "ni una semana, el de quien colecciona, el de las insignias y el de quien termina los "
        "planetas enteros. Si no destacas en uno, destacas en otro. Siempre la misma cuenta de "
        "Google, y bienvenido a bordo, recluta."),
  ]),
]

assert len({p["id"] for p in PASOS}) == 3, "los tres caminos deben tener id distinto"
assert all(len({s["cod"] for s in c["pasos"]}) == len(c["pasos"]) for c in PASOS), "codigos repetidos"

# ---------- escuadrones ----------
# Un escuadrón por docente. 🔴 El estudiante NO elige escuadrón: elige COMANDANTE, que es lo único
# que conoce el primer día —el nombre de quien le da clase—. El escuadrón viene detrás, con su
# nombre, su lema y su emblema, y así enterarse de a qué bando perteneces es una recompensa en vez
# de un formulario. Todos salen de la Tripulación Cero: quien elige comandante, hereda un legado.
# [clave, nombre, lema, de quién sale]
ESCUADRONES = [
 ("esc_yunques",     "Los Yunques",     "Lo que se forja, aguanta.",                          "Bran Okafor · Fôrge"),
 ("esc_eco_largo",   "Eco Largo",       "Si ves esto, es que hoy no llegué a contártelo yo.",  "Tomás Reyer · Ecos"),
 ("esc_cartografos", "Los Cartógrafos", "Dos senderos, una misma cima.",                       "Sylla Bren · Sendara"),
 ("esc_senal",       "Señal Abierta",   "A tiempo por encima de perfecto.",                    "Amara Sol · Reliae"),
 ("esc_faro",        "Faro Umbral",     "Medir es mirar con método a alguien que te importa.", "Vera Khal · Umbral"),
 ("esc_ruta_azul",   "Ruta Azul",       "Esta ya la hemos ganado cien veces.",                 "Joran Pike · Ludo"),
 ("esc_porques",     "Los Porqués",     "Una orden mueve cuerpos. Un porqué mueve personas.",  "Mara Voss · Vínculo"),
 ("esc_capa",        "Capa Liminar",    "Un aula que aprende a hablar de sí misma.",           "Noa Lieth · Liminar"),
 ("esc_copistas",    "Los Copistas",    "Cuarenta manos, un mismo trazo.",                     "Los Copistas de Fôrge"),
 ("esc_guardia",     "Guardia Cero",    "Que conste que nadie nos obligó. Elegimos.",          "La Tripulación Cero"),
]

# ---------- ticket de salida ----------
# 🔴 UNO para todos los grupos y para siempre. Se crea una sola vez desde el menú de la hoja
# maestra («Crear el ticket de salida COMPARTIDO») y esa función escribe esta dirección con los dos
# huecos ya puestos: {GRUPO} lo rellena el tablero y {COMANDANTE} la Nave.
#
# No puede vivir en el motor nuevo porque tiene que ser ANÓNIMO, y el motor guarda quién responde
# cada formulario suyo. Las respuestas caen en la hoja «STARGATE · Tickets de salida», que es la
# única cosa para la que sigue existiendo una hoja de cálculo.
#
# Para rellenarlo: menú STARGATE → «Ver los datos del ticket compartido» → copiar la línea de
# DIRECCIÓN CON HUECOS y pegarla aquí.
# ─────────────────────────── ALIAS SUGERIDOS ───────────────────────────
# El banco de nombres del botón «Sugiéreme uno» del alistamiento. Existe por una razón concreta y
# observada: el alias es lo PRIMERO que se pide y hay quien se queda en blanco ahí mismo, con la
# página abierta, sin alistarse. Un botón que propone quita ese atasco en un segundo.
#
# De dónde salen: estrellas y constelaciones reales, lunas y cuerpos del sistema solar, mitología
# de las constelaciones, fenómenos y partículas, y un puñado de inventados eufónicos. Todos se
# pronuncian en español y ninguno pisa un nombre que STARGATE ya usa para otra cosa — un planeta o
# un escuadrón de alias confundiría el tablero.
#
# 🔴 No son obligatorios: el campo se sigue pudiendo escribir a mano. Los alias son ÚNICOS en cada grupo (stargate_alias).
# 17-sep · el dado propone DOS nombres combinados («Vega Altair»), no uno (alistarse.js).
ALIAS_SUGERIDOS = [
    "Vega", "Rigel", "Altair", "Sirio", "Antares", "Deneb", "Mizar", "Alcor", "Arturo", "Capella",
    "Bellatrix", "Aldebarán", "Procyon", "Canopus", "Spica", "Pollux", "Castor", "Regulus",
    "Achernar", "Hadar", "Atria", "Alnair", "Alphard", "Algol", "Alcyone", "Merak", "Dubhe",
    "Phecda", "Megrez", "Alioth", "Thuban", "Kochab", "Polaris", "Elnath", "Saiph", "Alnitak",
    "Alnilam", "Mintaka", "Meissa", "Nihal", "Arneb", "Wezen", "Adhara", "Mirzam", "Furud", "Naos",
    "Avior", "Miaplacidus", "Almach", "Mirach", "Hamal", "Menkar", "Mira", "Diphda", "Fomalhaut",
    "Enif", "Sadalsuud", "Sadalmelik", "Markab", "Scheat", "Algenib", "Alderamin", "Errai", "Caph",
    "Ruchbah", "Segin", "Navi", "Izar", "Muphrid", "Zubeneschamali", "Unukalhai", "Rasalhague",
    "Rasalgethi", "Sabik", "Shaula", "Sargas", "Kaus", "Nunki", "Ascella", "Albaldah", "Altais",
    "Eltanin", "Rastaban", "Grumium", "Vindemiatrix", "Porrima", "Zavijava", "Denebola", "Zosma",
    "Chertan", "Algieba", "Adhafera", "Rasalas", "Subra", "Alterf", "Tegmine", "Acubens", "Asellus",
    "Talitha", "Tania", "Alula", "Muscida", "Europa", "Ío", "Calisto", "Ganímedes", "Titán",
    "Encélado", "Mimas", "Tetis", "Dione", "Rea", "Japeto", "Febe", "Tritón", "Nereida", "Caronte",
    "Hidra", "Nix", "Cerbero", "Estigia", "Deimos", "Fobos", "Ceres", "Palas", "Juno", "Vesta",
    "Quirón", "Ixión", "Orco", "Sedna", "Haumea", "Makemake", "Eris", "Disnomia", "Amaltea", "Tebe",
    "Metis", "Adrastea", "Himalia", "Elara", "Pasífae", "Sinope", "Lisitea", "Carme", "Ananké",
    "Leda", "Calírroe", "Temisto", "Jano", "Epimeteo", "Prometeo", "Pandora", "Atlas", "Pan",
    "Dafne", "Telesto", "Calipso", "Helena", "Polideuces", "Hiperión", "Kiviuq", "Ymir", "Ariel",
    "Umbriel", "Titania", "Oberon", "Miranda", "Puck", "Cordelia", "Ofelia", "Bianca", "Cressida",
    "Desdémona", "Julieta", "Porcia", "Rosalinda", "Belinda", "Perdita", "Cupido", "Mab", "Larisa",
    "Proteo", "Talasa", "Despina", "Galatea", "Sao", "Laomedeia", "Neso", "Halimede", "Orion",
    "Lyra", "Perseo", "Andrómeda", "Casiopea", "Cefeo", "Pegaso", "Draco", "Hércules", "Boyero",
    "Corona", "Cisne", "Águila", "Delfín", "Lira", "Flecha", "Zorra", "Lagarto", "Jirafa", "Lince",
    "Osa", "Dragón", "Fénix", "Grulla", "Tucán", "Pavo", "Indio", "Quilla", "Popa", "Vela",
    "Brújula", "Reloj", "Cincel", "Buril", "Retícula", "Altar", "Lobo", "Centauro", "Cruz", "Mosca",
    "Camaleón", "Tucana", "Hidro", "Dorado", "Volante", "Pintor", "Mesa", "Octante", "Ave",
    "Triángulo", "Escudo", "Serpiente", "Ofiuco", "Sagita", "Auriga", "Cochero", "Cabra", "Toro",
    "Carnero", "Balanza", "Copa", "Cuervo", "Sextante", "Unicornio", "Can", "Liebre", "Río",
    "Horno", "Escultor", "Ballena", "Quásar", "Púlsar", "Magnetar", "Cuásar", "Nebul", "Cénit",
    "Nadir", "Eclipse", "Cometa", "Aurora", "Boreal", "Austral", "Perihelio", "Afelio", "Cuanto",
    "Fotón", "Neutrino", "Plasma", "Quark", "Bosón", "Fermión", "Gravitón", "Taquión", "Leptón",
    "Muón", "Gluón", "Hadrón", "Protón", "Neutrón", "Isótopo", "Espectro", "Prisma", "Refracción",
    "Paralaje", "Cefeida", "Supernova", "Kilonova", "Hipernova", "Blázar", "Halo", "Cromosfera",
    "Fotosfera", "Heliopausa", "Termosfera", "Magnetosfera", "Ionosfera", "Exosfera", "Tránsito",
    "Ocultación", "Conjunción", "Oposición", "Cuadratura", "Sicigia", "Apogeo", "Perigeo",
    "Absidal", "Nodo", "Eclíptica", "Cenital", "Azimut", "Declinación", "Efeméride", "Meridiano",
    "Vórtice", "Singularidad", "Horizonte", "Ergosfera", "Acreción", "Jet", "Bólido", "Meteoro",
    "Aerolito", "Condrita", "Tectita", "Kaelen", "Soren", "Rhiane", "Tavek", "Nyra", "Orrin",
    "Sable", "Vexa", "Corvid", "Lumen", "Arken", "Sylas", "Thaen", "Iskra", "Vireo", "Nael",
    "Ordan", "Ravel", "Sidra", "Tarn", "Ulmo", "Varek", "Wrenn", "Xandra", "Yara", "Zephir",
    "Aluen", "Brask", "Caldon", "Draven", "Elyra", "Faelan", "Gorran", "Halcyon", "Ilvar", "Jorah",
    "Kyra", "Lirien", "Maren", "Noctis", "Oryx", "Perrin", "Qadir", "Rhea", "Sorrel", "Tyrian",
    "Ulric", "Vaela", "Wulf", "Xeris", "Ylva", "Zorin", "Amaris", "Bryn", "Calen", "Dorne",
    "Eirlys", "Fenn", "Galen", "Haleth", "Ione", "Jaro", "Kestra", "Loren", "Mirren", "Nevin",
    "Oriel", "Pryce", "Quen", "Rune", "Serel", "Torin", "Ulva", "Vandra", "Wynn", "Yorik", "Zaira",
    "Aethon", "Brannoc", "Cyrion", "Dalen", "Eskel", "Fyren", "Grimm", "Hespera", "Ithel", "Kaida",
    "Lysander", "Morvan", "Niamh", "Ondine", "Peregrin", "Riven", "Sylvane", "Teryn", "Uriel",
    "Veyra", "Wystan", "Ysolde", "Zarek", "Anwen", "Belen", "Cinder", "Doran", "Ember", "Falke",
    "Gwyn", "Haven", "Indris", "Jarek", "Kelric", "Lark", "Merida", "Nyssa", "Orien", "Perla",
    "Quirin", "Ronan", "Seren", "Thane", "Ulla", "Varen", "Wilder", "Yael", "Zima",
]

assert len(ALIAS_SUGERIDOS) == len(set(ALIAS_SUGERIDOS)), "hay alias repetidos en el banco"
assert all(1 <= len(a) <= 24 for a in ALIAS_SUGERIDOS), "un alias no cabe en el campo (24)"

# La hoja donde caen TODAS las respuestas del ticket, de todos los grupos y todos los años. Se
# creó a la vez que el formulario y se deja a mano porque es la materia prima: si algún día el
# panel no estuviera disponible, las respuestas se leen aquí.
TICKETS_HOJA = "https://docs.google.com/spreadsheets/d/1x_5lztVydAttUvAdvuVM0AiC8zseUrXbMmBu4e9uOdM/edit"

# 🔴 El lector de esa hoja. Vive DENTRO de ella (apps-script/LectorTickets.gs) y hay que desplegarlo
# una vez: Extensiones → Apps Script → pegar → Implementar como aplicación web (ejecutar como Yo,
# acceso Cualquier usuario) → pegar aquí la URL que acaba en /exec.
#
# Mientras esté vacío, el panel de tickets de los grupos del motor nuevo lo dice y manda a la hoja,
# en vez de quedarse en blanco o inventarse que no hay respuestas.
TICKETS_API = ("https://script.google.com/macros/s/"
               "AKfycbw_xmo_3DLONvYxkPYem-uL70M0yLj-4gmhWwla7hoqlfjYkeAeexEqITNGM49H8CpoHQ"
               "/exec")

# 14-sep · EL PANEL DE CONTROL DE CLASE POR DEFECTO (el Genially del referente). Norberto: «por
# defecto este es el panel de control para todos los grupos (aunque los docentes pueden configurar el
# suyo propio)… ellos solo pondrán el link». Orden: el propio del docente («Mis enlaces») → el
# oficial del grupo («Ajustes») → este. Se enseña en un iframe: basta el enlace.
PANEL_MAESTRO = "https://view.genially.com/6a8bfc4f5068ad5903fc39e3"
# 17-sep · Norberto: «por defecto, el panel de control de Genially quiero que sea siempre el mismo, que salga ya escrito» (tanto
# el de edición como el de visualización). Al crear un grupo y en sus Ajustes, estos dos van ya puestos.
PANEL_MAESTRO_EDICION = "https://app.genially.com/editor/6a8bfc4f5068ad5903fc39e3"

TICKET_URL = ("https://docs.google.com/forms/d/e/"
              "1FAIpQLScqkZRCiUqKkq24s7_yzy2d2ldHXlWz8GoHCqXXmHbQlgKhIQ/viewform"
              "?usp=pp_url&entry.489397158={GRUPO}&entry.856117988={COMANDANTE}")
