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
 # 24-sep · retirado el 20-jul y rescatado: la batalla del examen, contada. Es el DESENLACE: se abre en la Nave de cada
 # cual tras la batalla (como el Fragmento Prohibido, y justo antes que él). Oculto en YouTube, como el resto de la serie
 "desenlace": ("7z3cAg-7Kow", "El desenlace · La batalla de la Ciudadela Gris"),
}

def yt(clave):
    vid, tit = V[clave]
    return {"id": vid, "titulo": tit, "url": f"https://youtu.be/{vid}"}

# ---------- cronología: las 15 semanas ----------
# videos: [(clave_V, cuándo dentro de la semana)]
# insignias: claves de assets/img/insignias que se ENTREGAN esa semana
# lanza: retos que se lanzan (se resuelven después)
# preguntas: 🔴 23-sep · la pregunta de cada clase, tal cual el calendario oficial de la asignatura («Resolución de problemas
#   en las clases en directo»). Solo las que son preguntas: las presentaciones, resoluciones, el repaso y el simulacro no
#   llevan. La sesión abre con ella (el comandante del docente, recortado, y la pregunta en grande) y NO se contesta: la
#   resuelve el docente en clase (Norberto: «solo lanzamos la pregunta de reflexión y el docente la va respondiendo»).
CRONO = [
 dict(sem=1, tema="Tema 1 · Fôrge", sub="Creación de contenido multimedia — Bienvenida",
      capitulo="El reclutamiento",
      # 23-sep · el tráiler oficial abre la sesión, a oscuras (Norberto: «mira a ver qué vídeo es bueno para empezar»)
      videos=[("trailer","Apertura: a oscuras, antes de decir nada"),
              ("sinopsis","Primera sesión: el gancho de arranque"),
              ("bitacora","Apertura: tras la sinopsis, presenta la Bitácora (ePortfolio) y la asignatura"),
              ("t1i","Tras el despegue: al abrir el Tema 1, antes de sus retos")],
      lanza=["Reto «Preséntate a tu tripulación» (vídeo 60 s)", "Reto relámpago «La hoja de ruta» (tu programación didáctica) — en clase, 15 min"],
      insignias=["E1_nebula","H1_reclutamiento"],
      preguntas=[("2", "¿Cómo empezamos nuestra programación de aula en un documento académico? ¿Nos puede asistir la IA para crear nuestras planificaciones?")],
      hito="Presentación ante el mando · Bitácora de la semana: un recurso multimedia con IA",
      clases="Clases 01–02",
      consejo="Preséntate como su Comandante y reparte la insignia de Reclutamiento en público. El Opening puede abrir cada clase."),
 dict(sem=2, tema="Tema 1 (cont.) · Fôrge", sub="Actividad 1",
      capitulo=None,
      videos=[("act1","Al lanzar la Actividad 1"),
              ("t1c","Al cerrar el trabajo del planeta"),
              ("f1","Justo tras el cierre: la recompensa del bloque")],
      lanza=["Actividad 1 — actividad didáctica a partir de una imagen con IA", "Reto relámpago «Del boceto a la forja» (recupera a Bran) — en clase, 15 min", "Reto principal «La Bitácora en marcha» (tu ePortfolio)"],
      insignias=["P1_bran","R1_la-chispa","E2_capitan","H2_primera-forja"],
      preguntas=[("3", "¿Cómo creamos recursos didácticos para nuestras clases y cómo la IA puede ayudarnos en la creación de estos materiales?")],
      hito="Presenta la Act. 1 · Test del Tema 1",
      clases="Clases 03–04",
      consejo="La de Bran (P1) y La chispa (R1) se entregan con el relámpago de la clase 3; la del Capitán y Primera Forja, al presentar/entregar la Act. 1."),
 dict(sem=3, tema="Tema 2 · Ecos", sub="El vídeo como recurso",
      capitulo=None,
      videos=[("t2i","Al abrir el Tema 2")],
      lanza=["Reto principal «El eco que enseña» (tu videotutorial)"],   # 24-sep · intercambiados con la semana 4
      insignias=["R2_el-eco-que-ensena"], hito="Videotutorial en marcha", clases="Clase 05",
      preguntas=[("5", "¿Cómo creamos nuestros videotutoriales con herramientas que pueden agilizar los procesos, como IA?")],
      consejo="Ecos = solo regresa el mensaje que se entiende. Conecta con el aula invertida."),
 dict(sem=4, tema="Tema 2 (cont.) · Ecos", sub="El vídeo que pregunta",
      capitulo=None,
      videos=[("t2c","Al cerrar el bloque"),("f2","Tras el cierre")],
      lanza=["Reto relámpago «El vídeo que pregunta» (recupera a Tomás) — en clase, 15 min"], insignias=["P2_tomas"],
      preguntas=[("6", "¿Cómo nos podemos asegurar de que han visto y entendido los conceptos que se trabajan en un vídeo? ¿La IA nos puede ayudar a generar preguntas para el videoquiz?")],
      hito="Test del Tema 2 · Bitácora: videotutorial enriquecido", clases="Clase 06",
      consejo="El fragmento de Tomás (su hija Lena) es el momento emocional del bloque: dale su espacio."),
 dict(sem=5, tema="Tema 3 · Sendara", sub="Contenidos interactivos",
      capitulo="Una ruta hacia la Tierra",
      videos=[("t3i","Al abrir el Tema 3")],
      lanza=["Reto relámpago «Dos senderos» (recupera a Sylla) — en clase, 15 min"],
      insignias=["P3_sylla"], hito="Itinerario de aprendizaje", clases="Clase 07",
      preguntas=[("7", "¿Cómo podemos crear un itinerario de aprendizaje? ¿Las herramientas de IA nos pueden facilitar la planificación?")],
      consejo="El mapa de un solo sendero de Sendara ES el itinerario; guárdate el paisaje para la semana 6."),
 dict(sem=6, tema="Tema 3 (cont.) · Sendara", sub="Actividad 2 — el paisaje",
      capitulo=None,
      videos=[("act2","Al lanzar la Actividad 2"),
              ("t3c","Al cerrar el bloque"),("f3","Tras el cierre")],
      lanza=["Actividad 2 — planifica y crea un paisaje de aprendizaje", "Reto principal «El itinerario» (refuerzo y ampliación en Genially)"],
      insignias=["R3_la-matriz"],
      preguntas=[("8", "¿Cómo podemos atender a la personalización del aprendizaje con un paisaje de aprendizaje?")],
      hito="Presenta la Act. 2 · Test del Tema 3 · Bitácora: itinerario o paisaje", clases="Clases 08–09",
      consejo="La Act. 2 se presenta ahora y se resuelve en la semana 13: recuérdalo para que no la dejen morir."),
 dict(sem=7, tema="Tema 4 · Reliae", sub="M-learning",
      capitulo="Estableciendo comunicaciones",
      videos=[("t4i","Al abrir el Tema 4")],
      lanza=["Reto relámpago «Abre el canal» (recupera a Amara) — en clase, 10 min"],
      insignias=["P4_amara"], hito="Compartir de forma organizada", clases="Clase 10",
      preguntas=[("10", "¿Qué tendríamos que hacer para compartir de manera organizada los materiales del aula con nuestros alumnos?")],
      consejo="Primero compartir ordenado (Sites/Classroom/Moodle); la comunicación viva llega la semana que viene."),
 dict(sem=8, tema="Tema 4 (cont.) · Reliae", sub="El entorno digital de aula",
      capitulo=None,
      videos=[("t4c","Al cerrar el bloque"),("f4","Tras el cierre")],
      lanza=["Reto principal «El entorno de aula» (Classroom o Sites)"], insignias=["R4_entorno-de-aula"],
      preguntas=[("11", "¿Qué tendríamos que hacer para compartir de manera organizada los materiales con nuestros alumnos, establecer actividades, calificarlas o incluso comunicarnos con ellos?")],
      hito="Test del Tema 4 · Bitácora: tu entorno de aula", clases="Clase 11",
      consejo="La lección de Amara (compartir a tiempo, pulir después) es oro contra el perfeccionismo del alumnado."),
 dict(sem=9, tema="Tema 5 · Umbral", sub="Evaluación y ePortfolio — aparece la Estática",
      capitulo="Evaluando la situación",
      videos=[("t5i","Al abrir el Tema 5 (¡aparece Vaeon!)"),
              ("t5c","Al cerrar el bloque"),("f5","Tras el cierre")],
      lanza=["Reto relámpago «Mide con método» (recupera a Vera) — en clase, 15 min", "Reto principal «Tu centro de recursos» (web abierta + rúbrica)"],
      insignias=["P5_vera","R5_bitacora-medida"],
      preguntas=[("12", "¿Qué herramientas son más útiles para seguir el progreso del alumno?")],
      hito="Resolución de la Act. 1 · Test del Tema 5 · Bitácora: Google Forms para registrar el progreso", clases="Clase 12",
      consejo="El momento dramático del curso: justo cuando saben medir, aparece el enemigo que silencia. Y se resuelve la Act. 1."),
 dict(sem=10, tema="Tema 6 · Ludo", sub="Aprendizaje Basado en el Juego (ABJ)",
      capitulo="Aprender jugando",
      videos=[("t6i","Al abrir el Tema 6"),
              ("t6c","Al cerrar el bloque"),("f6","Tras el cierre")],
      lanza=["Reto relámpago «Encuentra el juego» (recupera a Joran) — en clase, 15 min", "Reto principal «El juego» (juego digital)"],
      insignias=["P6_joran","R6_el-juego"],
      preguntas=[("13", "¿Cómo planificamos y creamos nuestro material para impartir una clase bajo el Aprendizaje Basado en el Juego?"), ("14", "¿Cómo integramos los juegos digitales en el paisaje de aprendizaje?")],
      hito="Test del Tema 6 · Bitácora: un juego digital", clases="Clases 13–14",
      consejo="En Ludo SE JUEGA: el juego es la actividad. Fija ya la diferencia con lo que viene en Vínculo."),
 dict(sem=11, tema="Tema 7 · Vínculo", sub="Gamificación",
      capitulo="El arte de motivar",
      videos=[("t7i","Al abrir el Tema 7")],
      lanza=["Reto relámpago «Un porqué» (recupera a Mara) — en clase, 15 min"],
      insignias=["P7_mara"], hito="Microgamificación en marcha", clases="Clase 15",
      preguntas=[("15", "¿Cómo planificamos y creamos nuestro material para impartir una clase bajo un PBL?")],
      consejo="Aquí NO se juega: se toman elementos del juego. Es el error conceptual más común del curso — apóyate en Joran y Mara."),
 dict(sem=12, tema="Tema 7 (cont.) · Vínculo", sub="Gamificación profunda",
      capitulo=None,
      videos=[("t7c","Al cerrar el bloque"),("f7","Tras el cierre")],
      lanza=["Reto principal «La microgamificación»"], insignias=["R7_microgamificacion","E3_vaeon"],
      preguntas=[("16", "¿Cómo planificamos y creamos nuestro material para impartir una clase bajo una gamificación profunda?")],
      hito="Test del Tema 7 · Bitácora: tu microgamificación", clases="Clase 16",
      consejo="Momento meta: STARGATE es una gamificación profunda funcionando delante de sus ojos. Díselo."),
 dict(sem=13, tema="Tema 8 · Liminar", sub="Realidad Aumentada",
      capitulo=None,
      videos=[("t8i","Al abrir el Tema 8")],
      lanza=["Reto relámpago «El QR» (recupera a Noa) — en clase, 10 min"],
      insignias=["P8_noa","H3_cartografo"],
      preguntas=[("17", "¿Cómo aprovechamos la RA en el aula?")],
      hito="Resolución de la Act. 2", clases="Clase 17",
      consejo="Se resuelve la Actividad 2: la insignia de Cartógrafo se entrega con el paisaje presentado. Con el QR de Noa se completa la Cero."),
 dict(sem=14, tema="Tema 8 (cont.) · Liminar", sub="Realidad Virtual — NEBULA casi completa",
      capitulo=None,
      # 24-sep · Norberto: «solo falta el cierre del tema 8. Ponlo». El finale (la verdad de la Cero) ES el cierre de
      # Liminar: pasa de abrir la semana 15 a cerrar la 14, y la última semana se queda solo con el plan de ataque.
      videos=[("finale","Al cerrar el bloque: la verdad de la Cero"),
              ("f8","NEBULA recuerda por qué la Cero se quedó: el fragmento de Noa cae aquí")],
      lanza=["Reto principal «El último umbral» (tu Bitácora publicada)"], insignias=["R8_ultimo-umbral","H4_tripulacion-cero"],
      preguntas=[("18", "¿Cómo aprovechamos la RV en el aula?")],
      hito="Test del Tema 8 · la Tripulación Cero queda completa", clases="Clase 18",
      consejo="Con la Cero completa llega la insignia de hito Tripulación Cero. El finale cierra el tema: la verdad de la Cero, sin resolver todavía."),
 dict(sem=15, tema="Repaso · La liberación", sub="Simulacro y salto final",
      capitulo="La liberación",
      # 24-sep · la última semana, solo el plan de ataque. El Fragmento Prohibido (el epílogo de Vaeon, que empieza «La
      # batalla terminó… Ganamos») NO se proyecta: se abre en la Nave de todos cuando acaba el viaje, tras el examen.
      videos=[("plan","El Capitán presenta el examen: la batalla ES el examen"),
              # 24-sep · Norberto: «coincido con tu propuesta» — el desenlace tras la batalla, en la Nave, antes del Fragmento Prohibido
              ("desenlace","Tras la batalla (el examen): cómo se ganó, en la Nave de cada cual cuando acaba el viaje"),
              ("f9","Y detrás, el último secreto de la Cero: se abre con el desenlace")],
      lanza=["Reto «El simulacro del examen» (90 minutos de reloj, en la clase de repaso)"], insignias=["H5_la-liberacion"],
      hito="Repaso + simulacro del examen · Bitácoras publicadas", clases="Clases 19–20",
      consejo="Celebra las Bitácoras publicadas: son el producto real del curso. Despídete con «Vuelve después de la batalla para ver el desenlace»: cuando acaba el viaje se abren en su Nave «La batalla de la Ciudadela Gris» y, detrás, el Fragmento Prohibido."),
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
        cuerpo = cuerpo.replace("{plan de ataque}", yt("plan")["url"])   # 24-sep · la semana 15, con su vídeo
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

# ---------- el grupo de demostración ----------
# 🔴 20-sep · Las pantallas de ejemplo (?demo=1: la Nave, la consola, el aula, las capturas de «Cómo se hace») leen un
# grupo DE VERDAD por la puerta pública. Su identificador estaba escrito a mano en seis sitios, apuntando a
# «demo-motor»… que ya no existe: el botón «Probar la Nave como estudiante» de la guía llevaba a un error, y las
# capturas no se podían regenerar. Un dato, un sitio. Si algún día se cambia el grupo de ejemplo, se cambia AQUÍ.
PER_DEMO = "demo-stargate"
# 🔴 20-sep · LA NAVE ESCUELA: el grupo donde el profesorado trastea (30 reclutas, el curso entero y un selector
# de semanas). Lo siembra `motor/sembrar_prueba.js --escuela`. Va aquí para que lo sepan la web y la presentación
# del equipo sin que nadie escriba el identificador dos veces.
PER_ESCUELA = "nave-escuela"

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
 ("puente",     "El puente",         "Tus retos",                      {"tipo": "sobre"}),
 ("mercado",    "El Mercado",        "Tu colección",                   {"tipo": "creditos", "n": 25}),
 ("camarote",   "El camarote",       "Tu imagen",                      {"tipo": "sobre"}),
 ("zoco",       "El Zoco",           "El trueque",                     {"tipo": "capsula"}),
 ("constancia", "La constancia",     "Los días a bordo",               {"tipo": "creditos", "n": 30}),
]
#   hito: (clave, cubierta, icono, título, qué hay que hacer, pestaña de la Nave donde se hace)
HITOS_A_BORDO = [
 ("reto",       "puente",     "<img class=ico src=assets/img/iconos/p/cohete.png alt>", "Primer salto",          "Registra tu primer reto.",                                   "retos"),
 # 🔴 23-sep · con los 20 retos ninguno se responde por escrito: «Tu voz» (tu primera reflexión) y «Eco de la tripulación»
 # (comentar una) ya no se podían ganar, y sin ellos nadie completaba el puente ni llegaba al Contramaestre. Los dos
 # retos de cada tema ocupan su sitio.
 ("relampago",  "puente",     "<img class=ico src=assets/img/iconos/p/rayo.png alt>", "Chispa en clase",       "Registra tu primer reto relámpago (el que se hace en clase).", "retos"),
 ("principal",  "puente",     "<img class=ico src=assets/img/iconos/p/diana.png alt>", "Tu gran reto",          "Registra tu primer reto principal (el de casa).",            "retos"),
 ("compra",     "mercado",    "<img class=ico src=assets/img/iconos/p/mercado.png alt>", "Primera compra",        "Compra algo en el Mercado Estelar.",                         "mercado"),
 ("carta",      "mercado",    "<img class=ico src=assets/img/iconos/p/sobre.png alt>", "Primera carta",         "Consigue tu primera carta del álbum.",                       "mercado"),
 ("heroe",      "mercado",    "<img class=ico src=assets/img/iconos/p/escudo.png alt>", "Un héroe a tu lado",    "Consigue tu primer héroe de la Rebelión.",                   "mercado"),
 ("sorteo",     "mercado",    "<img class=ico src=assets/img/iconos/p/ticket.png alt>", "Boleto dorado",         "Consigue una participación del Gran Sorteo.",                "mercado"),
 ("viste",      "camarote",   "<img class=ico src=assets/img/iconos/p/gente.png alt>", "Otra cara",             "Ponte uno de tus héroes como avatar.",                       "botin"),
 ("skin",       "camarote",   "<img class=ico src=assets/img/iconos/p/rankings.png alt>", "Has evolucionado",      "Ponte una skin que hayas desbloqueado al subir de nivel.",   "botin"),
 ("adorno",     "camarote",   "<img class=ico src=assets/img/iconos/p/estrella.png alt>", "Con estilo",            "Ponte un título, un marco o un fondo.",                      "botin"),
 ("cambio",     "zoco",       "<img class=ico src=assets/img/iconos/p/zoco.png alt>", "Nada se tira",          "Cambia tus repetidos por un sobre o por un héroe nuevo.",    "botin"),
 ("zoco",       "zoco",       "<img class=ico src=assets/img/iconos/p/monedas.png alt>", "Tu puesto",             "Pon una pieza en el Zoco Estelar.",                          "zoco"),
 ("trato",      "zoco",       "<img class=ico src=assets/img/iconos/p/hecho.png alt>", "Trato hecho",           "Cierra un trato en el Zoco, comprando o vendiendo.",         "zoco"),
 ("dias3",      "constancia", "<img class=ico src=assets/img/iconos/p/fuego.png alt>", "Tres días seguidos",    "Entra en tu Nave tres días seguidos.",                       ""),
 ("dias7",      "constancia", "<img class=ico src=assets/img/iconos/p/calendario.png alt>", "Una semana entera",     "Entra en tu Nave siete días seguidos.",                      ""),
 ("dias20",     "constancia", "<img class=ico src=assets/img/iconos/p/varios.png alt>", "Veinte días a bordo",   "Entra en tu Nave veinte días distintos.",                    ""),
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
 ( 3,  650, 2, "Cadete"),
 ( 4, 1050, 2, "Cadete de vuelo"),
 ( 5, 1550, 3, "Oficial"),
 ( 6, 2050, 3, "Oficial de puente"),
 ( 7, 2600, 3, "Oficial mayor"),
 ( 8, 3200, 4, "Comandante"),
 ( 9, 3850, 4, "Comandante de flota"),
 (10, 4650, 5, "Leyenda de la Cero"),
]
# v3.41 · fuera la Batalla final (500), dentro el huevo de Pascua S7 (150) — también en PUA.
# El nivel 10 exige los bonus de planeta: Leyenda = completarlo de verdad. 🔴 23-sep · la curva entera, escalada al viaje
# de 20 retos (× 5.260 / 5.680, redondeada a 50): el mismo esfuerzo relativo para cada nivel.
# 🔴 23-sep · de 27 retos a 20: fuera A1-A8 y los relámpago de escribir; los relámpago (100 xp) recuperan al tripulante.
# = xp de los retos del catálogo (Datos.gs) + reclutamiento (100) + hitos derivados (750). La batería 85 lo comprueba.
XP_VIAJE = {"REGULAR": 5260, "PUA": 5260}   # PUA lleva los mismos retos y con el mismo valor
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
       "sección «Preséntate» del padlet de la clase (título = tu alias; primera línea = «Comandante: tu profe»). No hace falta guion de cine — si te da apuro, "
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
  "S7": "Hay una sala de la que no se sale sin pensar: el Escape UNI. Entra, resuelve sus enigmas y, al final, "
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
 # 15-sep · Norberto, reto a reto: todos piden su enlace (A0 el de su publicación del padlet).
 # 🔴 23-sep · desde que los retos son SOLO prácticos (crear, diseñar, encontrar), todos piden su enlace o su captura:
 # ya no hay retos de escribir en la caja.
 "X1": "obligatoria", "X2": "obligatoria", "A0": "obligatoria",
 "B1": "obligatoria", "B2": "obligatoria", "B3": "obligatoria", "B4": "obligatoria",
 "B5": "obligatoria", "B6": "obligatoria", "B7": "obligatoria", "B8": "obligatoria",
 "L0": "obligatoria", "L1": "obligatoria", "L2": "obligatoria", "L3": "obligatoria", "L4": "obligatoria",
 "L5": "obligatoria", "L6": "obligatoria", "L7": "obligatoria", "L8": "obligatoria",
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
 # 🔴 23-sep · VACÍO A PROPÓSITO. Norberto: «los retos deben ser prácticos (crear algo, diseñar, encontrar…)»; la reflexión
 # pasa a la pregunta de cada clase, que resuelve el docente en directo. El mecanismo (la caja grande, «Lo que ha escrito
 # tu tripulación», «Lo que dijisteis») se queda por si algún día vuelve a hacer falta un reto de escribir.
}
# 🔴 17-sep · TRES POR SEMANA, no al día (Norberto, en la prueba humana: «“Como mucho, 3 retos al día”. ¡Debería ser 3 retos a
# la semana!»). La semana, de lunes a domingo. Cuentan los que registra el propio recluta (A0, B, X, S7); no los hitos (van
# solos), ni los relámpago (se hacen en clase), ni los que valida su docente desde la ficha (`stargateOtorgados`). Deshacer
# uno libera su hueco. Lo aplica también el servidor (gamificapro/functions/stargateTope.js), con el mismo número.
# 🔴 25-sep · SIN TOPE. Norberto: «vamos a quitar el límite de 3 retos a la semana… algunos estudiantes lo hacen al final a
# modo de repaso, no quiero frenarles. Ahora bien, al docente del grupo sí que le debería saltar un aviso (ojo, el recluta X
# ha completado +6 retos en un solo día, deberías revisar los enlaces)». 0 = sin tope (la web y el servidor lo leen así).
TOPE_RETOS_SEMANA = 0
# …y el aviso: con tantos retos registrados el MISMO día (en las dos últimas semanas), NEBULA avisa a su docente en el
# Puente y su fila en Reclutas lo marca.
AVISO_RETOS_DIA = 6

# ────────────────────── LAS DOS MISIONES MAYORES (las actividades que SÍ puntúan) ──────────────────────
# 🔴 21-sep · Norberto: «Necesito saber qué misiones/retos están directamente relacionados con la act1 y act2. En las
# sesiones en vivo de los temas 1 y 3 debes añadir un par de diapositivas explicando la actividad que toca. Es importante
# que aparezcan los retos relacionados para que vean que los retos forman parte del proceso. Las actividades sí cuentan
# para su nota final, los retos no».
#
# 🔴 UN DATO, UN SITIO. Esto es el enunciado oficial, y de aquí sale TODO lo que lo cuenta: la página «Actividades y
# evaluación» (actividades.html), las dos diapositivas de la sesión en directo de las semanas 2 y 6, y la guía del
# profesorado. Antes vivía escrito a mano dentro del HTML de `_build_site.py`: lo leía quien abriera esa página y nadie
# más — ni el docente que proyecta, ni el recluta que registra el reto.
#
#   pasos    → el enunciado paso a paso, como lo pide el documento oficial. Lo marcado **así** se pinta en negrita
#              (ni la sesión ni la página entienden markdown: las dos convierten esa marca y escapan el resto).
#   retos    → 🔴 LA PREGUNTA DE NORBERTO, respondida en el dato: qué reto deja hecho qué trozo de la actividad.
#              No son «retos del mismo tema»: cada línea dice la PIEZA de la entrega que ese reto ya produce. Si un día
#              un reto deja de alimentar la actividad, se quita de aquí y desaparece de los tres sitios a la vez.
#   resuelve → la semana en la que se corrige y se devuelve (no la de entrega). Sale de CRONO («Se resuelve la Act. 1»).
ACTIVIDADES = [
 dict(clave="a1", n=1, entrega=5, recuerda=[4, 5], orden="I", reto="X1", video="act1", tema=1, sem=2, resuelve=9, puntos="4,3",
      planeta="Fôrge", lema="La primera chispa",
      titulo="Actividad didáctica a partir de una imagen con IA",
      resumen="El recluta diseña una actividad para su aula a partir de una imagen creada con IA, "
              "documentando el proceso con criterio docente.",
      pasos=[
        ("Planifica", "obligatorio",
         "Define el alumnado, el tema del aula y la tarea que harán con la imagen."),
        ("Crea la imagen con IA", "iteración",
         "Prompt estructurado (contexto educativo + tipo de imagen + finalidad, modelo tipo CRAFT/RITA), "
         "**al menos una iteración**, y selección final con **tu criterio docente**. Cita la herramienta y "
         "respeta derechos de autor."),
        ("Tabla técnica", "",
         "Documenta función de la IA, prompt inicial, iteración, criterio docente, evidencia del proceso "
         "(enlace o capturas) y citación."),
        ("Tabla reflexiva", "ePortfolio",
         "Reflexión crítica: cómo integraste la IA, cómo transformó la actividad, qué pusiste tú y qué aprendiste."),
        ("Entregables", "",
         "**PDF (80%)**, máx. 4 páginas, con planificación, actividad, referencia a la IA, capturas de las tablas "
         "y el enlace al ePortfolio. **ePortfolio (20%)** con la imagen, la tarea, las tablas completas y la "
         "evidencia del proceso."),
      ],
      retos=[
        ("L0", "Tu programación de aula, hecha en la clase 2: es **la unidad real de la que parte la actividad** — el "
               "alumnado, el tema y la tarea ya están planificados."),
        ("L1", "Tu imagen, hecha en clase a partir de un boceto, con instrucción, iteración y criterio docente: es **el núcleo "
               "de la tabla técnica de la Actividad 1**. Quien hizo el relámpago ya tiene media entrega."),
        ("B1", "Tu Bitácora, creada y publicada: es **donde vive la página de la Actividad 1**, y esa página es el "
               "20 % de su nota."),
      ]),
 dict(clave="a2", n=2, entrega=9, recuerda=[7, 8], orden="II", reto="X2", video="act2", tema=3, sem=6, resuelve=13, puntos="4,3",
      planeta="Sendara", lema="Cuarenta y ocho senderos",
      titulo="Planifica y crea un paisaje de aprendizaje",
      resumen="Ante un aula con ritmos muy dispares, el recluta diseña un paisaje de aprendizaje que atiende a "
              "la diversidad: no hay una sola ruta.",
      pasos=[
        ("Contextualiza", "",
         "Describe una unidad didáctica real de tu nivel: edad, área, tema y elementos curriculares "
         "(objetivos, contenidos, criterios de evaluación)."),
        ("Matriz de programación 8×6", "núcleo",
         "Tabla de doble entrada: **8 inteligencias múltiples × 6 niveles de Bloom** = 48 casillas. Rellena "
         "**al menos 6 cruces** variados en complejidad y en talento, con una actividad en cada uno."),
        ("Cada actividad, completa", "",
         "Objetivo, tarea del alumno, recursos (con cita/enlace), instrumentos de evaluación, tiempo estimado "
         "y tipo: obligatoria, optativa o voluntaria."),
        ("El paisaje interactivo", "",
         "Convierte una **imagen interactiva** (no una presentación) en el paisaje, con las actividades "
         "integradas dentro del territorio y **sin un orden fijo**: cada cual entra por donde quiere."),
        ("Entregables", "",
         "**PDF (80%)** (máx. 10 páginas para 6 actividades, +1 por actividad extra) con planificación y matriz. "
         "**ePortfolio (20%)**: evidencias de matriz y paisaje (15%) + justificación del diseño y atención a la "
         "diversidad (5%)."),
      ],
      retos=[
        ("L0", "La unidad de tu aula que programaste en la clase 2: **la actividad empieza describiéndola**."),
        ("L3", "Tus dos senderos para un mismo objetivo: **el paisaje en pequeño**, sin el susto de las 48 casillas."),
        ("B3", "Tu itinerario en Genially, con refuerzo y ampliación: **el esqueleto del paisaje interactivo**. La matriz "
               "8×6 se hace ya dentro de la actividad."),
      ]),
]

# ────────────────────────── 23-sep · CÓMO SE EVALÚA (un dato: la página y la sesión de la semana 1) ──────────────────────────
# Vivía escrito a mano en el HTML de «Actividades y evaluación». La sesión de la semana 1 lo cuenta ahora en clase («cuándo
# empiezan las actividades oficiales y cuándo se entregan»), así que pasa a ser un dato. Las dos actividades, de ACTIVIDADES.
#   (nombre, puntos, cómo)
# 25-sep · y el día de entrega: Norberto, «la actividad 1 se entrega siempre el último día de la semana 5 y la actividad 2 el
# último día de la semana 9» (la programación oficial de 2026-27; referencias/PROGRAMACION_SEMANAL_OFICIAL_2026-27.pdf).
# `entrega`: esa semana (la fecha, del calendario de cada grupo: su último día lectivo, a las 23:59); `recuerda`: las semanas
# en que la Nave, la sesión y el Puente lo recuerdan con su tarjeta (Norberto: «en la 4 y 5 la act1, y la 7 y 8 la act2»).
# ─────────────── 🔴 26-sep · LA SESIÓN DE CADA ACTIVIDAD (sesion.html?act=1 / ?act=2) ───────────────
# Norberto: «aquí están las actividades 1 y 2. En la semana que toquen, quiero una sesión tanto para el estudiante como para el
# docente explicando la actividad. Usa a NEBULA, el Capitán y el Comandante para explicar lo más importante. Debe quedar muy
# claro. Puedes crear ejemplos concretos… Quiero separarlas de los temas… una sesión dedicada… que el estudiante la pueda ver
# en diferido. También te dejo las rúbricas… una versión reducida e interactiva para que sepan exactamente lo que necesitan
# para tener un 10». Fuente: los enunciados y las rúbricas oficiales (Project_CCD/referencias/actividades_2026-27/). Los
# ejemplos resueltos son los de siempre (EJEMPLOS_RETOS): Pilar (L1, su infografía) y Patricia (X2, su huerto).
# La rúbrica, reducida: el peso de cada criterio y lo que pide el nivel 4 (sobresaliente), en una línea.
MATRIZ_PLANTILLA = "https://view.genially.com/6829b625ff56e91aba84861d/horizontal-infographic-review-corregida-matriz-de-programacion"
INTELIGENCIAS = ["Lingüística", "Lógico-matemática", "Visual-espacial", "Corporal-cinestésica", "Musical", "Interpersonal",
                 "Intrapersonal", "Naturalista"]
BLOOM = ["Crear", "Evaluar", "Analizar", "Aplicar", "Comprender", "Recordar"]   # de arriba abajo, como en la matriz
ORTOGRAFIA = "Ortografía: −0,10 por cada falta y −0,25 por cada cinco tildes."
# 26-sep · LAS CAPTURAS, OBLIGATORIAS (Norberto: «la obligatoriedad de hacer capturas de pantalla: es la única prueba y evidencia
# de haber hecho las cosas en la fecha prevista y ayuda a prevenir problemas de enlaces restringidos o privados; enseña cómo
# hacer captura en Mac, Windows y Chromebook con atajos de teclado»). Una diapositiva en la sesión de cada actividad.
CAPTURAS = dict(
    por_que=["Son la **única prueba** de que lo hiciste **a tiempo**: el enlace cambia; la captura, no.",
             "Te salvan si un enlace sale **restringido o privado**: lo que se ve en la captura, se ve."],
    que=["Cada paso importante: tu **prompt**, las **versiones**, las **tablas** y tu **ePortfolio** publicado.",
         "Si puedes, con la **fecha y la hora** a la vista (el reloj de tu barra de tareas)."],
    atajos=[("Mac", [("Cmd + Mayús + 3", "Toda la pantalla"), ("Cmd + Mayús + 4", "Una zona: arrástrala"),
                     ("Cmd + Mayús + 5", "El menú: ventana, zona o grabación")], "Se guardan en el Escritorio."),
            ("Windows", [("Win + Mayús + S", "Una zona, una ventana o toda la pantalla"), ("Win + Impr Pant", "Toda la pantalla, guardada")],
             "Se guardan en Imágenes › Capturas de pantalla (la de Win + Mayús + S va al portapapeles: pégala o guárdala)."),
            ("Chromebook", [("Ctrl + Mostrar ventanas", "Toda la pantalla"), ("Ctrl + Mayús + Mostrar ventanas", "Una zona o una ventana")],
             "«Mostrar ventanas» es la tecla del rectángulo con dos rayas, en la fila de arriba. Se guardan en Descargas.")])
SESION_ACTIVIDAD = {
  "a1": dict(
    mision=("Tu primera misión mayor",
            "Recluta: en Fôrge se forja lo que luego se usa en el aula. Tu misión es diseñar una actividad para tu clase a "
            "partir de una imagen que crees con IA… y demostrar que la IA la has usado TÚ, con criterio."),
    objetivo="Diseñar una actividad didáctica basada en una imagen creada con IA y documentar cómo has usado la IA: con "
             "criterio, citándola y reflexionando sobre ella.",
    pdf=["Máximo **4 páginas**, con la **plantilla**, sus estilos e **índice automático**.",
         "La **planificación**, la **imagen** y la **actividad**, y la referencia al uso de la IA.",
         "**Capturas** de la tabla técnica, de la reflexiva y de la imagen.",
         "El **enlace único** a tu ePortfolio y las citas en **APA**."],
    portfolio=["Formato y plataforma **libres** (la plantilla es opcional).",
               "La **imagen** y la **tarea** para el alumnado.",
               "Las **dos tablas completas**: técnica y reflexiva.",
               "La **evidencia** del proceso: el enlace al chat o capturas."],
    tareas=["Señala las partes de…", "Rellena la ficha con los elementos que…", "Clasifica los objetos que ves según…",
            "Describe la imagen…", "Anota las diferencias entre…", "Detecta los errores del mapa mental y justifica…",
            "Responde a las cuestiones a partir del esquema…", "Imagina una situación como la de la imagen y describe…",
            "Explica los conceptos de la infografía…", "Añade el texto que acompañaría a cada paso del proceso…"],
    ejemplo=dict(
      quien="Pilar, maestra de 6.º de Primaria", imagen="L1.jpg",
      alumnado="6.º de Primaria (11-12 años)", tema="El aparato circulatorio · Ciencias de la Naturaleza",
      tarea="Explicar con sus palabras el recorrido de la sangre a partir de una infografía",
      herramienta="Microsoft Designer",
      prompt=[("Contexto", "Para una clase de 6.º de Primaria sobre el aparato circulatorio,"),
              ("Rol", "actúa como ilustrador de materiales escolares"),
              ("Acción", "y crea una infografía del recorrido de la sangre: corazón, pulmones y resto del cuerpo,"),
              ("Formato", "vertical, con flechas rojas y azules,"),
              ("Tono", "clara y amable para niños. Finalidad: que el alumnado explique el recorrido con sus palabras.")],
      modelo="CRAFT",
      iteracion="La primera versión traía etiquetas inventadas y en inglés. Segundo prompt: «Solo seis etiquetas, en "
                "español, con letra grande y fondo blanco».",
      criterio="Elijo la versión 2: se lee desde el fondo del aula y distingue por color la sangre con y sin oxígeno, que "
               "es justo lo que voy a evaluar.",
      evidencia="El enlace al chat de la herramienta y las capturas de las dos versiones.",
      cita="Microsoft. (2026). Microsoft Designer [Generador de imágenes con IA]. https://designer.microsoft.com",
      funcion="Generar un organizador gráfico (una infografía) del recorrido de la sangre, a partir de su boceto.",
      enunciado=["Observa la infografía y **señala** el camino de la sangre del corazón a los pulmones, y de vuelta.",
                 "**Responde**: ¿por qué unas flechas son rojas y otras azules?",
                 "**Explica** a tu compañero, con tus palabras, qué pasa en los capilares."],
      reflexion="La IA me dio en un minuto lo que dibujo cada año en la pizarra, pero la primera versión tenía errores y "
                "estaba en inglés: sin mi revisión no servía. He aprendido a pedirle con una finalidad didáctica y a no "
                "quedarme con la primera respuesta."),
    tecnica=[("Función de la IA", "Apoyo para generar una imagen con finalidad didáctica (ilustración, organizador gráfico o infografía), explorando opciones.", "funcion"),
             ("Prompt inicial", "Claro y estructurado: contexto educativo, tipo de imagen y finalidad, siguiendo un modelo (CRAFT, RITA o RCTA).", "prompt"),
             ("Iteración", "Ajustar el prompt al menos una vez para mejorar la imagen, visual o pedagógicamente.", "iteracion"),
             ("Criterio docente", "Elegir la imagen final con tu criterio y justificar por qué encaja con la actividad y el nivel.", "criterio"),
             ("Evidencia del proceso", "Conservar el enlace al chat o capturas de la interacción con la IA.", "evidencia"),
             ("Citación", "Citar la IA y las herramientas empleadas según la normativa (APA).", "cita")],
    reflexiva=[("Integración crítica", "¿Cómo has usado la IA en tu actividad de forma reflexiva y crítica?"),
               ("Transformación", "¿La IA ha transformado la actividad? ¿De qué manera?"),
               ("Conocimiento propio", "¿Cómo combinaste lo que te ofreció la IA con lo que tú sabes?"),
               ("Justificación", "¿Por qué es relevante lo que has integrado de la IA?"),
               ("Aprendizaje", "¿Cómo ha cambiado tu forma de pensar? ¿Qué has aprendido?")],
    errores=[("Una sola versión", "Sin al menos una iteración, la tabla técnica se queda corta."),
             ("El prompt sin modelo", "Di qué modelo sigues (CRAFT, RITA o RCTA) y que se vean sus partes."),
             ("La reflexión, solo en el PDF", "La tabla reflexiva va completa en el ePortfolio; en el PDF, captura o resumen."),
             ("La IA sin citar", "La herramienta y cada imagen, en APA."),
             ("Fuera de la plantilla", "Más de 4 páginas, sin estilos o sin índice automático: eso solo vale 1,5 puntos."),
             ("Un enlace que no abre", "Tu ePortfolio, público: ábrelo en una ventana de incógnito antes de entregar.")],
    rubrica=[("Formato, estilos y funciones avanzadas", 1.5, "PDF", "La plantilla y sus estilos bien usados, e índice automático (y de figuras o tablas)."),
             ("La actividad y la imagen", 2.5, "PDF", "Alineadas con los objetivos: la imagen es pertinente, clara y creativa, y ayuda a hacer la tarea."),
             ("Uso técnico de la IA · tabla técnica", 1.5, "PDF", "Prompt estructurado con su modelo, iteraciones justificadas, criterio docente explícito y la herramienta citada."),
             ("Reflexión sobre la IA · tabla reflexiva", 1.5, "PDF", "Profunda y argumentada: lo que puso la IA y lo que pusiste tú, su impacto y sus límites, con ejemplos."),
             ("Citas y referencias · APA", 1, "PDF", "Todo citado en APA, también lo generado con IA, con enlaces que funcionan."),
             ("Organización del ePortfolio", 1, "ePortfolio", "Ordenado y coherente: evidencias, reflexión y el proceso entero, fácil de seguir."),
             ("Presentación del ePortfolio", 1, "ePortfolio", "Atractivo, legible y accesible: se entiende y se evalúa sin esfuerzo.")]),
  "a2": dict(
    mision=("Cuarenta y ocho senderos",
            "Recluta: te ha tocado un grupo con ritmos muy distintos. Lo que a uno le motiva, a otro le aburre; lo que a uno "
            "le parece fácil, otros no saben ni por dónde empezar. En Sendara no hay un solo camino: diseña un paisaje donde "
            "cada cual encuentre el suyo."),
    objetivo="Planificar un tema con una matriz de programación (inteligencias múltiples × Bloom) y convertirlo en un paisaje "
             "de aprendizaje interactivo que atienda a la diversidad.",
    pdf=["Con la **plantilla** y sus estilos; figuras **numeradas y nombradas**; citas en **APA**, también la IA.",
         "Máximo **10 páginas** para seis actividades (**+1** por cada actividad más).",
         "La **contextualización**, la **matriz** (con enlace y captura si es digital) y la **ficha** de cada actividad.",
         "El **enlace** a tu ePortfolio, con el paisaje y la matriz."],
    portfolio=["**Evidencias (15 %)**: la matriz y el paisaje, mejor **embebido**.",
               "**Justificación (5 %)**: un párrafo argumentado sobre cómo tu diseño atiende a la **diversidad** y a los **ritmos**.",
               "Si usaste IA (opcional): para qué, con qué criterios y con qué prompts."],
    ejemplo=dict(
      quien="Patricia, maestra de 3.º de Primaria", imagen="X2_paisaje.jpg",
      nivel="3.º de Primaria (8-9 años)", area="Ciencias de la Naturaleza · «Las plantas»",
      objetivos=["Identificar las partes de la planta y para qué sirve cada una.",
                 "Describir el ciclo de vida de una planta.",
                 "Reconocer lo que necesita una planta para crecer."],
      criterios="Explica las partes y el ciclo de vida con sus palabras; relaciona el crecimiento con el agua, la luz y la tierra.",
      # 🔴 26-sep · UN PAISAJE, NO UN ITINERARIO. Norberto: «el ejemplo de la actividad 2 es un itinerario (las actividades se
      # hacen en orden); primordialmente pedimos un paisaje, libertad total, sin orden». Fuera los números (1-8) de la imagen
      # (X2_paisaje.jpg: cada planta, solo con el color de su tipo) y de la matriz: cada cruce es una planta, y se entra por
      # la que se quiera.
      paisaje="Un huerto ilustrado en Genially, hecho imagen interactiva: cada planta abre su actividad y se entra por la que "
              "se quiera, sin orden. El color dice solo el tipo: obligatoria (verde, todos la hacen, cuando cada cual decida), "
              "optativa (azul) o voluntaria (amarilla).",
      # (planta, fila de Bloom, columna de inteligencia, tipo, título, tarea) · la planta es su nombre: no hay número ni orden
      cruces=[("Tomate", "Recordar", "Visual-espacial", "obligatoria", "Las partes de la tomatera", "Señala raíz, tallo, hojas, flor y fruto en la foto de la tomatera."),
              ("Lechuga", "Comprender", "Lingüística", "optativa", "¿Para qué sirve cada parte?", "Explícalo con tus palabras en un audio de un minuto."),
              ("Zanahoria", "Analizar", "Lógico-matemática", "voluntaria", "¿Cuánto crece mi planta?", "Medimos la planta cada semana, lo anotamos en una tabla y lo representamos en una gráfica."),
              ("Judía", "Aplicar", "Naturalista", "obligatoria", "Mi judía en un vaso", "Plántala, cuida lo que necesita (agua, luz y tierra) y anota lo que ves."),
              ("Cebolla", "Comprender", "Musical", "optativa", "La canción del ciclo de vida", "Completa la letra con las fases: semilla, germinación, planta, flor y fruto."),
              ("Calabacín", "Evaluar", "Interpersonal", "obligatoria", "¿Dónde crece mejor?", "Por parejas, comparad una planta con luz y otra sin luz, y decidid por qué."),
              ("Fresa", "Crear", "Corporal-cinestésica", "voluntaria", "De semilla a fresa", "Representa con tu cuerpo cómo crece una semilla hasta dar fruto, en un vídeo corto."),
              ("Col", "Crear", "Intrapersonal", "optativa", "Mi diario de jardinero", "Escribe qué has aprendido y qué planta cuidarías tú, y por qué.")],
      ficha=[("Actividad", "La zanahoria · ¿Cuánto crece mi planta? (Analizar × Lógico-matemática)"),
             ("Objetivo", "Reconocer lo que necesita una planta para crecer."),
             ("Tarea", "Medimos la planta cada semana, lo anotamos en una tabla y lo representamos en una gráfica."),
             ("Recursos", "Una regla y la plantilla de la tabla (enlace y captura, porque es propia)."),
             ("Evaluación", "La tabla y la gráfica, con una lista de cotejo."),
             ("Tiempo", "10 minutos a la semana, durante 4 semanas."),
             ("Tipo", "Voluntaria · sin orden: se hace cuando cada cual quiera, antes o después de las demás.")],
      justificacion="En el huerto no hay un orden: cada cual entra por la planta que quiere y decide su camino. Las verdes "
                    "aseguran lo básico para todo el grupo, cuando cada uno lo elija; las azules y las amarillas dejan que "
                    "quien va rápido llegue más lejos y que quien necesita tiempo empiece por lo que le resulta más cercano. "
                    "Por eso hay una de cada inteligencia y los seis niveles de Bloom: nadie se queda sin un sendero."),
    ia=["La **herramienta** de IA usada.", "El **prompt** que usaste.",
        "Una **reflexión** sobre si la respuesta servía y **qué cambiaste**."],
    errores=[("Una presentación, no un paisaje", "Tiene que ser una imagen interactiva; si es una presentación o lineal, no es un paisaje."),
             ("Un itinerario disfrazado", "Si todo va numerado y en orden (1, 2, 3…), es un itinerario. En un paisaje, cada cual entra por donde quiere."),
             ("Menos de seis", "Al menos seis actividades completas, variadas en Bloom y en inteligencias."),
             ("La ficha a medias", "Cada actividad: objetivo, tarea, recursos, evaluación, tiempo y tipo."),
             ("Sin decir el tipo", "Obligatoria, optativa o voluntaria (y si hay que seguir un orden)."),
             ("La IA sin citar", "La herramienta, el prompt y qué cambiaste de su respuesta."),
             ("El paisaje escondido", "En el ePortfolio, a la vista: embebido o enlazado, junto a la matriz.")],
    rubrica=[("Contextualización", 1, "PDF", "Completa: nivel, área, objetivos, contenidos o competencias y criterios, y justifica las decisiones del paisaje."),
             ("Matriz de programación", 2, "PDF", "Cruces realistas y explicados entre la demanda cognitiva y cada actividad, alineados con los objetivos."),
             ("Diseño de las actividades", 3, "PDF", "Completas y coherentes con la matriz, con obligatorias, optativas y voluntarias bien diferenciadas."),
             ("El paisaje de aprendizaje", 2, "PDF", "Cuidado y motivador, con varios itinerarios que dan autonomía al alumnado."),
             ("ePortfolio · evidencias", 1.5, "ePortfolio", "El paisaje embebido o compartido, con la matriz a la vista y coherente con lo planificado."),
             ("ePortfolio · justificación", 0.5, "ePortfolio", "Precisa: con referencias a tus actividades, tu matriz y la atención a la diversidad.")]),
}

EVALUACION = [("Actividad %d" % a["n"], a["puntos"], "%s · se lanza en la semana %d, se entrega el último día de la semana %d y se resuelve en la %d" % (a["titulo"], a["sem"], a["entrega"], a["resuelve"]))
              for a in ACTIVIDADES] + [
    ("Tests de tema", "0,8", "Uno por tema, 0,1 cada uno: fijan los conceptos del examen"),
    ("Asistencia en directo", "0,6", "Tres clases en directo a lo largo del curso, 0,2 cada una"),
]
EVALUACION_EXAMEN = "Y el examen final, en la semana de exámenes: se construye una plataforma en directo (en la 15 hay simulacro)."

# ────────────────────────── 🔴 23-sep · LA SESIÓN DE LA SEMANA 1: EL EMBARQUE ──────────────────────────
# Norberto: «esa primera semana es la presentación de la asignatura junto con la primera parte del tema 1. Esa sesión en
# vivo es especial. Debes empezar desde cero, explicando STARGATE, metiendo al estudiante en la narrativa. Mira a ver qué
# vídeo es bueno para empezar. Enseñamos la nave, dejamos tiempo para que se alisten… Para acabar esta parte proyectamos
# dentro de la presentación el ticket de salida y dejamos que lo rellenen. Después vamos a Fôrge. Replantea cómo lo
# harías para tener ese efecto WOW… Explicarás qué se hace cada semana, cuándo empiezan las actividades oficiales y
# cuándo se entregan. Especial hincapié en el ePortfolio». Es el guion del borrador del 22-sep, tal cual lo aprobó.
#
# 🔴 El orden vive AQUÍ, no en el código de la sesión: sesion.js lo lee y monta cada pieza, y la guía lo cuenta con
# su rótulo. (pieza, argumento, tiempo, rótulo para la guía)
#   tiempo: 'ap' apertura (el acto 1 y la llegada a Fôrge) · 'pr' el despegue (el Genially) · 'ci' el cierre (las misiones)
# 🔴 26-sep · LA PRESENTACIÓN DE LA ASIGNATURA, APARTE (sesión 1) · la semana 1 es ya una semana más (sesión 2, Fôrge parte 1).
# Norberto: «me gustaría aislar la sesión 1 (presentación) de la sesión 2 (tema 1 parte 1), aunque sea todo en la misma
# semana. Quiero que tanto el docente como el estudiante tengan a mano la presentación de la asignatura con la información de
# puntuaciones y fechas. Añade una diapositiva de que el proyecto STARGATE es totalmente voluntario… Incide en que la
# asistencia (la que cuenta para nota) y las actividades 1 y 2 se entregan por la plataforma UNIR… Las dudas, en el foro de
# UNIR. Explica brevemente los planetas… en 3 bloques… reorganiza las páginas como consideres mejor». Primero LO OFICIAL (la
# asignatura en tres bloques, la nota con sus fechas, UNIR y el foro); después, EL JUEGO (voluntario, y el embarque de
# siempre). Se abre siempre: sesion.html?pres=1 (el docente, en su banner y en Enlaces; el recluta, en El Archivo y en el
# índice del diferido). Lo de Fôrge (la pregunta de la clase 2, el panel, los retos y las misiones) vive en la semana 1.
SESION_EMBARQUE = [
    ("portada_asig", "", "ap", "**La asignatura**: su nombre, sus ocho temas y sus dos actividades, con tu comandante saludando"),
    ("bloque", "1", "ap", "**Bloque 1 · Creación de contenido** (temas 1 a 3): Fôrge, Ecos y Sendara, qué se trabaja en cada uno y cuándo"),
    ("bloque", "2", "ap", "**Bloque 2 · M-Learning** (temas 4 y 5): Reliae y Umbral"),
    ("bloque", "3", "ap", "**Bloque 3 · Gamificación en el aula** (temas 6 a 8): Ludo, Vínculo y Liminar"),
    ("nota", "", "ap", "**Lo que cuenta para tu nota**, con las fechas de este grupo: las dos actividades, los tests, la asistencia y el examen"),
    ("unir", "", "ap", "**Todo lo evaluable, por la plataforma de UNIR**: la asistencia que puntúa, las dos actividades y los tests"),
    ("dudas", "", "ap", "**Las dudas, en el foro de la asignatura** (UNIR)"),
    ("voluntario", "", "ap", "**Y ahora, el juego: STARGATE es voluntario**. Vivir una gamificación en primera persona, sin ninguna penalización"),
    ("video", "trailer", "ap", "A oscuras, el **tráiler oficial** (1:05)"),
    ("portada", "", "ap", "**Bienvenidos a bordo de La Constancia**, la nave de STARGATE"),
    ("mensaje", "", "ap", "**El mensaje** del Comandante, con tu rótulo"),
    ("video", "sinopsis", "ap", "**Cap. 0 · Sinopsis** (1:47): la historia entera"),
    ("nombres", "", "ap", "**Cuatro nombres**: NEBULA, la Estática, el Capitán de la Nave y su Comandante STARGATE, que eres tú, con tu avatar"),
    ("semana", "", "ap", "**Así es una semana**: la sesión, los retos, la Nave y el ticket"),
    ("video", "bitacora", "ap", "**Misión · La Bitácora** (1:36)…"),
    ("bitacora", "", "ap", "…y **la Bitácora ES el ePortfolio**: su patrón, qué acaba dentro y la plantilla"),
    # 25-sep · Norberto: «embébelo… justo después de la Bitácora (así puede usarla y pegar su enlace al alistarse)»
    ("plantilla", "", "ap", "**La plantilla de la Bitácora**, embebida: la duplican, la hacen suya y pegan su enlace al alistarse"),
    ("nave", "", "ap", "**Su Nave**, enseñada en simulacro"),
    ("alistaos", "", "ap", "**¡Alistaos!**: el código grande y las caras de quien ya está a bordo, en directo"),
    ("llamada", "", "ap", "**La llamada a filas**: su primer fichaje"),
    ("ticket", "p", "ap", "**El ticket de la presentación**, dentro de la diapositiva: lo rellenan ahí mismo"),
    ("hasta", "forge", "ap", "**Nos vemos en Fôrge**: tu comandante se despide hasta la sesión 2"),
]
# 26-sep · LA ASIGNATURA EN TRES BLOQUES (la presentación). Los títulos de cada tema son los de la programación oficial
# (referencias/PROGRAMACION_SEMANAL_OFICIAL_2026-27.pdf); lo que se trabaja, sus apartados en una línea.
ASIGNATURA = "Creación de Contenidos, Mobile Learning y Gamificación en el Aula"
BLOQUES_ASIGNATURA = [
    ("Creación de contenido", [1, 2, 3], "Crear materiales propios, del texto y la imagen al vídeo y lo interactivo, con la IA como ayudante."),
    ("M-Learning", [4, 5], "El aula en el móvil: compartir, comunicarse y evaluar con dispositivos móviles."),
    ("Gamificación en el aula", [6, 7, 8], "Jugar para aprender: el juego, la gamificación y las realidades aumentada y virtual."),
]
TEMARIO = {
    1: ("Creación de contenido multimedia", "Texto, imagen, audio, infografías y presentaciones multimedia."),
    2: ("El vídeo como recurso educativo", "El videotutorial, crear y editar vídeo, y el aula invertida."),
    3: ("Creación de contenidos interactivos", "Presentaciones y recursos interactivos, y paisajes de aprendizaje."),
    4: ("M-learning: aprender con dispositivos móviles", "Herramientas para difundir contenidos y comunicarse, y apps educativas."),
    5: ("La evaluación con los dispositivos móviles", "Tipos de evaluación, registro sistemático, rúbrica digital y ePortfolio."),
    6: ("El juego y el aprendizaje basado en el juego", "El ABJ, adaptar juegos tradicionales y crear juegos digitales."),
    7: ("Gamificación", "Sus elementos básicos, la microgamificación, la gamificación profunda y su gestión."),
    8: ("Realidad aumentada y realidad virtual", "La RA en el aula, iniciarse en la RV y la realidad mixta."),
}

# 18-sep · LAS SECCIONES DE LA SESIÓN EN DIRECTO. Norberto: «que cada sección tenga un nombre propio, independientemente
# de si aparece una cosa u otra en función de la semana… y que cada docente pueda marcar con una checkbox lo que quiere
# usar en su presentación. Por defecto, todo completo». Clave, nombre y qué trae. Las lee la sesión (para quitar lo que
# el docente quite) y la consola (la rueda de «1 · Empezar la clase», en el Puente de la Nave del Comandante).
# 24-sep · Norberto: «tenemos un planeta de la Estática, mete esa imagen en la semana 15». La semana sin tema (el repaso)
# lleva este planeta donde las demás llevan el suyo: la portada de la sesión, la tira de la presentación y el banner.
PLANETA_FIN = ("estatica", "La Estática", "La liberación")

# 24-sep · LA TRIPULACIÓN CERO, UNO A UNO (para la página del tripulante en la sesión). La historia sale de
# NARRATIVA_V3_LA_CERO.md (la sinopsis de cada fragmento), en corto; la cita, de CITAS (_build_site.py).
TRIPULANTES = {
 "P1_bran":  ("Bran Okafor", "El Forjador", "Durante años quemó sus bocetos porque «no estaban listos». En Fôrge, un esquema suyo a medio acabar, compartido a tiempo, guió a un refugio entero a través de la tormenta.", "Lo imperfecto compartido vale más que lo perfecto guardado."),
 "P2_tomas": ("Tomás Reyer", "El Cronista", "Cada noche grababa un mensaje para Lena, su hija en la Tierra, sabiendo que quizá no volvería. Sus grabaciones enseñan hoy a gente que él nunca conoció.", "Un buen vídeo es tu voz enseñando cuando tú ya no estás."),
 "P3_sylla": ("Sylla Bren", "La Rastreadora", "Su hermano gemelo «no servía para estudiar»: solo era que la única ruta ofrecida no era la suya. Trazó los 48 senderos de Sendara para que nadie más se quedara fuera del mapa.", "No hay una sola ruta."),
 "P4_amara": ("Amara Sol", "La Operadora", "Una vez retuvo un informe tres días «para pulirlo»; cuando lo envió, ya no quedaba nadie para leerlo. Desde entonces mantiene el canal abierto, aunque le tiemble la voz.", "Compartir a tiempo salva más que compartir perfecto."),
 "P5_vera":  ("Vera Khal", "La Médica", "Aprendió a medir sin humillar: su historia clínica de mundos es la primera Bitácora rigurosa, y su rúbrica del silencio predijo dónde golpearía la Estática.", "Evaluar es mirar con método a alguien que te importa."),
 "P6_joran": ("Joran Pike", "El Ingeniero-jugador", "Lo llamaban frívolo: «siempre jugando». Convirtió el simulacro de evacuación en un juego, y la noche de verdad los niños del refugio escaparon riendo por una ruta que conocían de memoria.", "El juego es el ensayo general del miedo."),
 "P7_mara":  ("Mara Voss", "El Mando", "Guarda medallas de una guerra que preferiría no haber ganado. Por eso en la Cero las insignias no premian obediencia. Fue ella quien propuso quedarse.", "Una insignia registra un acto con significado."),
 "P8_noa":   ("Noa Lieth", "La Arquitecta de capas", "Construía realidades superpuestas para que un mundo pudiera ensayar su futuro antes de vivirlo. Su fragmento es La Última Noche: la votación de las ocho manos y la decisión de quedarse.", "Enseñar futuros."),
}

SESION_SECCIONES = [
    ("portada", "Portada", "El planeta de la semana y el capítulo de la historia."),
    ("unete", "Únete a la clase", "Semanas 1 y 2: el código y el enlace para alistarse, y «Copiar invitación» para el chat."),
    # 23-sep · solo en la semana 1: la presentación de la asignatura dentro de la historia
    ("embarque", "El embarque", "Semana 1: quiénes son, el viaje, cómo es una semana, lo que puntúa y la Bitácora."),
    ("llamada", "Llamada a filas", "Fichar la asistencia al empezar."),
    # 23-sep · la pregunta de la clase (calendario oficial): el comandante del docente y la pregunta en grande (24-sep: tras la llamada)
    ("pregunta", "La pregunta de la clase", "La pregunta del calendario oficial, con tu comandante. La resuelves tú en clase."),
    ("mensaje", "Mensaje de la semana", "La transmisión con el logo de STARGATE."),
    ("videos", "Vídeos de apertura", "La sinopsis, la Bitácora o la entrada al planeta."),
    ("repaso", "Repaso de la semana anterior", "Quién hizo cada misión la semana pasada."),
    ("clasificacion", "Clasificación", "Han movido ficha, la semana, el top 5 y los escuadrones."),
    ("coleccion", "Coleccionistas", "Quién va más avanzado en su colección."),
    ("simulador", "El Simulador de Joran", "Las marcas y los reconocimientos de la batalla."),
    ("votacion", "Votación", "La votación de la semana, si la hay."),
    ("ticket", "Ticket de salida", "Lo que dijisteis al salir (o el ticket para rellenar)."),
    ("oferta", "Oferta de la semana", "La rebaja de esta semana en el Mercado."),
    ("novedades", "Novedades de la semana", "Lo que se abre en la Nave, y tu Nave de ejemplo para enseñarlo."),
    ("despegue", "El despegue", "Tu Genially: la teoría y la práctica guiada."),
    # 21-sep · solo en las semanas que lanzan una actividad (la 2 y la 6): qué pide y qué retos la construyen
    ("actividad", "La misión mayor", "La actividad que puntúa y los retos que ya le han hecho un trozo; y su entrega, las semanas antes."),
    ("misiones", "Misiones", "El vídeo del planeta, la misión y los retos que se lanzan."),
    # 24-sep · Norberto: «haz hincapié en el fragmento: dedica una página entera al personaje, su misión, y haz referencia
    # al fragmento prohibido para que lo desbloqueen»
    ("tripulante", "El tripulante", "Quién es el tripulante que se recupera esta semana, su historia y cómo se desbloquea su fragmento."),
    ("recompensa", "Recompensa", "Las insignias que se entregan esta semana."),
    ("cierre", "Cierre del planeta", "El vídeo de cierre y la recompensa del bloque."),
]

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
 "L0": {
  "titulo": "Andrés deja hecha en clase la programación de «La fotosíntesis» (2.º ESO)",
  "texto": "Andrés, profesor de Biología y Geología de 2.º de ESO, siguió en directo la herramienta que enseñó su Comandante y, en quince minutos, dejó hecha la programación de su unidad «La fotosíntesis»: el grupo y su nivel, tres objetivos, los contenidos, cinco actividades en orden y cómo las evalúa. No está terminada —le faltan los tiempos y la atención a la diversidad—, pero ya existe. Compartió el documento con permiso de lectura y pegó el enlace en el reto. De esa misma unidad saldrán sus dos Actividades.",
  "detalle": [
   "Lo mínimo: nivel, área, objetivos, contenidos, actividades y evaluación.",
   "No tiene que estar terminada: tiene que existir, y ser de una unidad real de tu aula.",
   "Si no pudiste venir, vale cualquier herramienta: un documento, una plantilla o una IA que te ayude a ordenarla."
  ]
 },
 "L1": {
  "titulo": "Pilar convierte su boceto del aparato circulatorio en una infografía con IA",
  "texto": "Pilar, maestra de 6.º de Primaria, trajo a clase el boceto a lápiz del recorrido de la sangre que dibuja cada año en la pizarra y se lo pidió a Microsoft Designer convertido en infografía con un prompt que dice contexto, tipo de imagen y finalidad. La primera versión traía etiquetas inventadas en inglés, así que iteró: «solo seis etiquetas, en español y con letra grande». Eligió la segunda y lo justificó en dos líneas: «Se lee desde el fondo del aula y distingue por color la sangre con y sin oxígeno, que es justo lo que evalúo». Después hizo en Canva un logo circular con un corazón y la palabra «PULSO» dentro. Subió el boceto y la versión elegida, el antes y el después, y pegó la captura en el reto.",
  "detalle": [
   "Partió de su boceto: no empezó de cero, empezó de lo que ya tenía a medias.",
   "Prompt: «Eres ilustrador de materiales escolares. Para una clase de 6.º de Primaria sobre el aparato circulatorio, crea una infografía vertical del recorrido de la sangre (corazón, pulmones y resto del cuerpo) con flechas rojas y azules. Finalidad: que el alumnado explique el recorrido con sus palabras».",
   "Iteración: «Solo seis etiquetas, en español, letra grande y fondo blanco».",
   "Criterio docente, en dos líneas: por qué esa versión y no la otra.",
   "Logo: hecho en Canva, con la palabra clave «PULSO» bien visible."
  ],
  "imagen": "L1.jpg",
  "imagen_alt": "Las dos versiones de la infografía del aparato circulatorio (la primera con etiquetas en inglés, la segunda elegida) y el logo circular «PULSO»."
 },
 "B1": {
  "titulo": "Lucía abre su Bitácora en Google Sites y publica sus recursos creados con IA",
  "texto": "Lucía, profesora de Biología y Geología de 3.º de ESO en un instituto de Murcia, creó su Bitácora en Google Sites y la llamó «Bitácora de Lucía · MUTECD». La personalizó con el verde de su departamento y una foto suya en el laboratorio, y dejó el menú preparado: Quién soy, Actividad 1, Actividad 2 y sus experiencias. Publicó la primera, «Recursos creados con IA»: la infografía de la célula de su relámpago y un audio de dos minutos para repasar sus partes, cada uno con su contexto, su reflexión y su autoevaluación. Pulsó «Publicar», abrió el enlace en una ventana de incógnito para comprobar que se veía sin su cuenta y lo pegó en el reto y en su BIO de la Nave.",
  "detalle": [
   "Alternativa rápida: duplicar la plantilla oficial de Genially y cambiar colores, foto y textos.",
   "No hace falta que esté llena: basta con la portada y la primera experiencia.",
   "Si la cuenta del centro no deja publicar en abierto, mejor crearla con una cuenta personal.",
   "Comprobación clave: el enlace se abre en incógnito sin pedir permiso."
  ],
  "imagen": "B1.jpg",
  "imagen_alt": "La portada de la Bitácora de Lucía en Google Sites: cabecera verde, menú de cinco páginas y la página «Quién soy» con su foto."
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
 # 24-sep · Ecos, intercambiado: el principal es GRABAR el videotutorial; el relámpago, meterle las preguntas
 "B2": {
  "titulo": "Marta (Tecnología, 3.º ESO): su videotutorial de Tinkercad",
  "texto": "Mi videotutorial enseña a diseñar un llavero en Tinkercad y a exportarlo en STL para imprimirlo en 3D. El objetivo didáctico es que mi alumnado de 3.º de ESO sepa agrupar formas, crear huecos y medir en milímetros antes de llegar al taller, para dedicar la clase a imprimir y corregir. Al hacerlo aprendí que el guion lo es todo: la primera grabación duraba nueve minutos y, al escribir antes lo que iba a decir, bajó a cuatro.",
  "detalle": [
   "Guion de una página, grabación de pantalla con Screencastify y edición en Clipchamp (cortes y zoom en los botones).",
   "Subido a YouTube en oculto: se lo enseñó a un compañero para ver si se entendía sin ella delante.",
   "Aula invertida: lo ven en casa y en clase se imprime.",
   "La semana siguiente, en clase, le metió las preguntas (el relámpago de Ecos)."
  ],
  "enlace": "https://youtu.be/ZE_JdQUmepk"
 },
 "L2": {
  "titulo": "Marta (Tecnología, 3.º ESO): tres preguntas dentro de su videotutorial",
  "texto": "En clase, Marta subió su videotutorial de Tinkercad a Edpuzzle y le metió tres preguntas, cada una justo después de un paso difícil: agrupar formas, crear huecos y medir en milímetros. Le pidió diez preguntas a una IA y se quedó con tres: las que comprueban un paso, no un detalle. Si alguien falla la segunda, sabe exactamente qué tiene que repetir en el taller.",
  "detalle": [
   "Importado desde YouTube en Edpuzzle, con 3 preguntas: en el 1:10, el 2:30 y el 3:40.",
   "Si no hubiera tenido vídeo propio, valía uno ya hecho con preguntas dentro, que le sirviera para su aula.",
   "El enlace de Edpuzzle va en el reto."
  ],
  "enlace": "https://edpuzzle.com/media/68ff9e1a400997c66a1f3eea"
 },
 "L3": {
  "titulo": "Irene (Inglés, 5.º de Primaria) diseña dos senderos hacia el mismo objetivo",
  "texto": "Irene eligió un objetivo: describir su rutina diaria en presente simple. Diseñó dos actividades distintas para llegar a él. «Hazlo»: ordenar viñetas de un día y grabar un audio contándolas. «Léelo»: leer un cómic corto y completar una tabla de horas y acciones. Las dos terminan en la misma tarea: escribir cinco frases sobre su propio día. Lo hizo en clase en una hoja, le hizo una foto y la pegó en el reto.",
  "detalle": [
   "Criterio: dos actividades distintas de verdad, no la misma con otro nombre.",
   "En el reto principal lo convierte en un itinerario de Genially, con refuerzo y ampliación."
  ]
 },
 "B3": {
  "titulo": "Irene lleva sus dos senderos a un itinerario de Genially, con refuerzo y ampliación",
  "texto": "Irene llevó a Genially los dos senderos de su relámpago (describir su rutina diaria en presente simple). La portada presenta el objetivo y dos puertas: «Hazlo» y «Léelo». Antes de la tarea final añadió una actividad de refuerzo —ordenar frases con las horas, para quien se atasca— y una de ampliación —comparar su rutina con la de un niño de otro país, para quien va por delante—, cada una con su botón. Lo publicó en abierto, lo comprobó en una ventana de incógnito y pegó el enlace en el reto y en su Bitácora.",
  "detalle": [
   "Refuerzo: para quien lo necesita, antes de la tarea final.",
   "Ampliación: para quien va por delante.",
   "Es el esqueleto del paisaje de la Actividad 2; la matriz 8×6 se hace dentro de la Actividad."
  ],
  "enlace": "https://view.genially.com/673a886db3cebc087dcc971a",
  "real": {
   "titulo": "(Math) Series niveladas",
   "donde": "Genially",
   "por_que": "Varias actividades para un mismo objetivo, y cada estudiante escoge su camino."
  }
 },
 "X2": {
  "titulo": "Patricia entrega su paisaje de aprendizaje y lo marca en la Nave",
  "texto": "Patricia, maestra de 3.º de Primaria, amplió la matriz de su unidad «Las plantas» a ocho actividades y las llevó a un paisaje: una imagen interactiva en Genially (no una presentación) con un huerto ilustrado en el que cada planta abre una actividad y se entra por la que se quiera, sin orden: el color solo dice si es obligatoria, optativa o voluntaria. Su PDF (11 páginas, dentro del límite para ocho actividades) recoge la contextualización, la matriz y la ficha completa de cada actividad. En la Bitácora añadió la página «Actividad 2» con la matriz, el paisaje incrustado y un párrafo sobre cómo ese diseño atiende a la diversidad. Subió el PDF a la plataforma de UNIR y, al enviarlo, marcó «Lo he hecho» en la Nave con el enlace del paisaje y, con el «+», el de su Bitácora.",
  "detalle": [
   "PDF (80 %): contextualización, matriz 8×6 y ficha de cada actividad (objetivo, tarea, recursos citados, evaluación, tiempo y tipo).",
   "ePortfolio (20 %): evidencias de la matriz y del paisaje, más la justificación del diseño y de la atención a la diversidad.",
   "Se marca al ENVIAR la actividad, no al empezarla."
  ]
 },
 "L4": {
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
 "L5": {
  "titulo": "Laura (Inglés, 2.º ESO) hace una rúbrica de autoevaluación y un formulario para recogerla",
  "texto": "Laura eligió un objetivo que ya trabaja: «Presentar oralmente su ciudad durante dos minutos». Hizo una rúbrica de autoevaluación con 4 criterios (contenido, vocabulario, fluidez y pronunciación) y 4 niveles (Inicial, En proceso, Conseguido y Destacado). En cada casilla escribió lo que se ve o se oye, no un adjetivo: en vez de «buen vocabulario», «usa 8 o más palabras de la unidad sin repetir». Después la pasó a un Google Forms, una pregunta por criterio con los cuatro niveles como opciones, para que cada estudiante se autoevalúe al terminar su exposición. Pegó en el reto el enlace del formulario y una captura de la rúbrica.",
  "detalle": [
   "Contenido · Destacado: nombra 4 o más lugares y da un dato de cada uno. Inicial: nombra 1 lugar, sin datos.",
   "Fluidez · Destacado: habla dos minutos con 2 pausas largas como máximo. Inicial: lee casi todo del papel.",
   "Sin adjetivos sueltos («bien», «adecuado»): si no se puede observar, no se puede medir.",
   "Opción que se ve en clase: CoRubrics, que convierte la rúbrica en el formulario solo."
  ],
  "vivo": [
   {
    "tipo": "tabla",
    "titulo": "Rúbrica · Presentar oralmente su ciudad durante dos minutos (Inglés, 2.º ESO)",
    "cab": [
     "Criterio",
     "Inicial",
     "En proceso",
     "Conseguido",
     "Destacado"
    ],
    "filas": [
     [
      "Contenido",
      "Nombra 1 lugar, sin datos",
      "Nombra 2 lugares y da un dato de uno",
      "Nombra 3 lugares y da un dato de cada uno",
      "Nombra 4 o más lugares y da un dato de cada uno"
     ],
     [
      "Vocabulario",
      "Usa menos de 4 palabras de la unidad",
      "Usa de 4 a 7 palabras de la unidad",
      "Usa 8 o más palabras de la unidad sin repetir",
      "Usa 8 o más y 2 expresiones nuevas de la unidad"
     ],
     [
      "Fluidez",
      "Lee casi todo del papel",
      "No llega a 2 minutos o para muchas veces",
      "Habla 2 minutos con 3 o 4 pausas largas",
      "Habla 2 minutos con 2 pausas largas como máximo"
     ],
     [
      "Pronunciación",
      "No se entiende más de la mitad",
      "Se entiende con esfuerzo en varias frases",
      "Se entiende todo, con algún error",
      "Se entiende todo y cuida la entonación de las preguntas"
     ]
    ],
    "nota": "Cada casilla dice lo que se ve o se oye, no un adjetivo: «usa 8 o más palabras», no «buen vocabulario»."
   }
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
 },
 "L6": {
  "titulo": "Sergio (Matemáticas, 1.º ESO) adapta el Uno para practicar fracciones",
  "texto": "Sergio cogió el Uno de toda la vida y le cambió una regla: sobre cada carta pegó una fracción, y solo se puede echar una carta si es equivalente a la de la mesa (1/2 sobre 2/4) o si es del mismo color. Las cartas de «roba dos» obligan a simplificar en voz alta la fracción que te toca. Lo probó en clase con un grupo, hizo una foto de la mesa con las cartas y la pegó en el reto.",
  "detalle": [
   "No inventa un juego: adapta uno que todos conocen.",
   "La regla nueva es la que enseña: sin fracciones equivalentes, no se juega.",
   "Vale igual uno digital: la URL de un Kahoot, un Wordwall o un Genially que ya exista, y lo que le cambias."
  ]
 },
 "B6": {
  "titulo": "Carlos (Química, 1.º Bachillerato): escape de formulación en tres fases",
  "texto": "Mi juego cubre este objetivo: nombrar y formular compuestos inorgánicos binarios y ternarios según la IUPAC. Es un escape en Genially con tres fases, y cada una sube la dificultad: en la primera se reconocen óxidos e hidruros; en la segunda hay que nombrar sales binarias; en la tercera, formular oxoácidos a partir de su nombre. Cada fase da un dígito del candado final, así que no se avanza sin acertar. Lo evalúo con un Google Forms al final, donde cada equipo escribe el código y cuántos intentos le costó cada fase, y con una lista de cotejo mientras juegan: así veo en qué fase se atascan y qué tengo que repasar.",
  "detalle": [
   "Hecho en Genially con una plantilla de escape: portada, tres salas y candado final.",
   "Cada mecánica sirve a un aprendizaje: sin nombrar bien el compuesto, la puerta no se abre.",
   "Enlace público del Genially en el reto; la reflexión, en su Bitácora."
  ]
 },
 "L7": {
  "titulo": "Rocío (5.º de Primaria) crea la insignia «Guardianes de la biblioteca»",
  "texto": "Se llama «Guardianes de la biblioteca». Reconoce al equipo que cada viernes deja la biblioteca de aula ordenada, con los libros revisados y las fichas de préstamo al día. En nuestra historia de clase, esos libros son el archivo de todas las aventuras que hemos leído: si se pierden o se rompen, el lunes nadie puede seguir la suya. No premia obedecer: recuerda que cuidar lo que es de todos es cuidar a los compañeros.",
  "detalle": [
   "Diseñada con la IA de Canva a partir de una descripción: escudo azul con un libro abierto y una llave.",
   "Compartida con el enlace de solo lectura de Canva."
  ],
  "imagen": "A7.jpg",
  "imagen_alt": "La insignia «Guardianes de la biblioteca»: un escudo azul y dorado con un libro abierto y una llave."
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
 "L8": {
  "titulo": "Víctor mete en una diapositiva el QR de su juego sobre la orquesta",
  "texto": "Víctor, profesor de Música de 2.º de ESO, abrió en Chrome el enlace público de su juego de Wordwall sobre las familias de instrumentos y generó el QR con el botón derecho → «Crear código QR para esta página». Lo pegó en una diapositiva de Google Slides titulada «Escanea y juega: la orquesta», lo escaneó con su móvil para comprobar que abría el juego y, con la pantalla partida, hizo una captura con la diapositiva a la izquierda y el juego abierto a la derecha, con su dirección visible. La pegó en el reto. Ocho minutos."
 },
 "B8": {
  "titulo": "Lucía publica su Bitácora completa antes del examen",
  "texto": "Lucía, la profesora de Biología y Geología de 3.º de ESO que abrió su Bitácora en la semana 2, la cerró antes del examen: la página de la Actividad 1, la de la Actividad 2 con su paisaje incrustado, sus experiencias del portfolio con las tres hazañas —el videotutorial, la microgamificación y, a su elección, su juego digital— y la lámina con el QR de su relámpago. Lo abrió todo en una ventana de incógnito y pegó el enlace único en el reto.",
  "detalle": [
   "Cada página sigue el mismo patrón: evidencia, contexto, reflexión y autoevaluación.",
   "Un solo enlace, el de la Bitácora, que lleva a todo lo demás."
  ]
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
 "X2": {"imagen": "X2_paisaje.jpg", "imagen_alt": "El paisaje de aprendizaje de Patricia: un huerto ilustrado con ocho plantas marcadas por colores, sin números ni orden, y la ficha de la zanahoria abierta."},
 "B4": {"imagen": "B4.jpg", "imagen_alt": "El tablón de Classroom «Física y Química 4.º B» con la pregunta de la semana y una tarea con tres recursos citados."},
 "B5": {"imagen": "B5.jpg", "imagen_alt": "El sitio «English Hub · 2.º ESO» con su menú de cinco páginas y la rúbrica incrustada en «Cómo se evalúa»."},
 "B6": {"imagen": "B6.jpg", "imagen_alt": "La fase 3 del escape de formulación de Carlos: un laboratorio con un candado de tres dígitos y la consigna «Formula el ácido sulfúrico»."},
 "B7": {"imagen": "B7.jpg", "imagen_alt": "El tablero «Hospital Aurora · Equipo de guardia» con la barra de cada equipo y la insignia «Turno impecable»."},
 "L8": {"imagen": "L8.jpg", "imagen_alt": "A la izquierda, la diapositiva «Escanea y juega: la orquesta» con su QR; a la derecha, el juego de Wordwall abierto con su dirección."},
 "XS": {"imagen": "XS.jpg", "imagen_alt": "La portada de «EXPLORA» en Google Sites: el logo, cinco líneas de presentación y los botones «Módulo 1 · Antes» y «Módulo 2 · Durante»."},

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

 "L2": {"vivo": [{"tipo": "linea", "titulo": "Su vídeo en Edpuzzle: 4:00 y tres preguntas, justo después de cada paso difícil", "dura": "4:00",
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
 # L2 y B2 (antes A2, A3, B2 y B3; B3 lleva ya el suyo dentro). Su `enlace` es el de siempre; `real` dice qué es para el pie, y la página lo pone el PRIMERO, incrustado.
for _k, _real in {
    "B2": {"titulo": "Publicar y compartir un Genially", "autor": "Mr. Cuarter", "donde": "YouTube",
           "por_que": "Un tutorial corto que explica un procedimiento paso a paso: justo lo que pide el reto."},
    "L2": {"titulo": "Taxonomía de Bloom: qué es y ejemplos de aplicación", "donde": "Edpuzzle",
           "por_que": "Un vídeo con preguntas insertadas que comprueban la comprensión mientras se ve."},
}.items():
    EJEMPLOS_EXTRA.setdefault(_k, {})["real"] = _real
for _k, _v in EJEMPLOS_EXTRA.items():
    EJEMPLOS_RETOS[_k].update(_v)
# 15-sep · EL RETO SECRETO (S7) ES EL ESCAPE UNI (Norberto). En la Nave, su botón de entrada; al final del escape, el
# botón lleva a validar.html?reto=S7&llave=… (la llave, PALABRA_HUEVO de Datos.gs; la web solo lleva su huella).
ESCAPE_UNI = "https://view.genially.com/6a461360d187e3f8869ca453"

GANCHO_RETOS = {
 "A0": "Un vídeo de 60 s presentándote, al padlet de la clase, y el enlace de tu publicación.",
 # 23-sep · los relámpago: prácticos, en clase, y cada uno recupera a su tripulante. La línea dice el gesto.
 "L0": "En clase: la programación de una unidad de tu aula, con la herramienta que enseña tu Comandante.",
 "L1": "En clase: un boceto o una idea a medias, hecha realidad con IA (con una iteración). El antes y el después.",
 "L2": "En clase: mete dos o tres preguntas dentro de un vídeo (el tuyo o uno ya hecho) con Edpuzzle.",
 "L3": "En clase: un objetivo y dos actividades distintas para llegar a él.",
 "L4": "En clase: publica algo tuyo del curso en tus redes con #mutecdstargate.",
 "L5": "En clase: una rúbrica de autoevaluación y un formulario para recoger lo que respondan.",
 "L6": "En clase: busca un juego que ya exista y adáptalo a un objetivo tuyo.",
 "L7": "En clase: una insignia o una carta de recompensa diseñada con IA.",
 "L8": "En clase: un QR que lleve a una actividad o un recurso tuyo, comprobado con el móvil.",
 "XS": "El ensayo general: 90 minutos de reloj para resolver un caso como el del examen.",
 "X1": "Pulsa «Lo he hecho» cuando hayas ENVIADO la Actividad 1, con su enlace (obligatorio).",
 "X2": "Pulsa «Lo he hecho» cuando hayas ENVIADO la Actividad 2, con su enlace (obligatorio).",
 # los retos principales: la experiencia del portfolio que marca el calendario oficial para cada tema
 "B1": "Abre tu ePortfolio y publica su primera experiencia: tus recursos creados con IA.",
 "B2": "Graba tu videotutorial: un procedimiento de tu área que se entienda sin ti delante.",
 "B3": "Tu itinerario en Genially: tus dos senderos, con refuerzo y ampliación.",
 "B4": "Tu aula en Classroom o Sites: una tarea y tres materiales organizados.",
 "B5": "Una web abierta, con otra herramienta: tres recursos tuyos y tu rúbrica a la vista.",
 "B6": "Un juego digital con niveles, al servicio de un objetivo y metido en tu paisaje.",
 "B7": "Gamifica una tarea real: una historia, tres retos y la recompensa del relámpago.",
 "S7": "Escápate del Escape UNI: el botón del final registra el reto.",
 "B8": "Publica tu Bitácora completa: las dos Actividades, tus experiencias y tu QR.",
}

CREDITOS = {"reclutamiento": 20, "retoA": 20, "retoB": 50, "retoB_pua": 50,   # 23-sep · PUA = REGULAR
            "actividad": 100, "final": 100, "derivada": 60,
 # 16-sep · el relámpago pagaba poco a propósito (10 ◈). 🔴 23-sep · ahora recupera al tripulante (lo que antes hacía el
 # Reto A), así que paga lo que pagaba el Reto A: 20 ◈. El simulacro sí paga más: son 90 minutos.
 "relampago": 20, "simulacro": 60,}
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
    {"n": 1, "clave": "c1", "titulo": "Canal abierto", "icono": "<img class=ico src=assets/img/iconos/p/envivo.png alt>", "semana": 1,
     "abre": ["nave", "retos", "botin", "archivo"], "mercado": [],
     "cabecera": "Tu Nave, ya en marcha",
     "puedes": ["Tu personaje, tu nivel y tus créditos, siempre a la vista",
                "Los retos de la semana: se hacen y se marcan con «Lo he hecho» (con el enlace de tu evidencia)",
  "Tu Bitácora, desde hoy: el viaje entero termina en ella, y el primer reto principal es abrirla",
  "Los retos relámpago: quince minutos EN CLASE, y cada uno recupera a un tripulante — quien no pudo venir, lo hace esa semana",
                "Presente en la llamada a filas: créditos y un sobre de regalo",
                "Mi botín: tus insignias y tu álbum de cromos"],
     "imagen": "assets/img/canje/sobre.jpg"},
    {"n": 2, "clave": "c2", "titulo": "El Mercado Estelar", "icono": "<img class=ico src=assets/img/iconos/p/mercado.png alt>", "semana": 2,
     "abre": ["mercado", "rankings"], "mercado": ["cromo", "cromo_repes"],
     "cabecera": "Ya puedes gastar tus créditos",
     "puedes": ["Comprar sobres de cromos: tres cartas al azar por 15 ◈",
                "Cambiar 3 cartas repetidas por un sobre nuevo, gratis",
                "Los rankings: tu clase de ocho maneras distintas, y tu duelo con quien tienes cerca"],
     "imagen": "assets/img/canje/sobre.jpg"},
    {"n": 3, "clave": "c3", "titulo": "La Rebelión", "icono": "<img class=ico src=assets/img/iconos/p/escudo.png alt>", "semana": 3,
     "abre": ["heroes"], "mercado": ["heroe"],
     "cabecera": "Llegan los Héroes de la Rebelión",
     "puedes": ["La cápsula de rescate del Mercado: un héroe al azar de 30 por 60 ◈",
                "Ponértelos (y quitártelos) gratis en tu vestuario",
                "Cambiar 2 héroes repetidos por uno nuevo al azar"],
     "imagen": "assets/img/canje/capsula_rescate.jpg"},
    {"n": 4, "clave": "c4", "titulo": "Tu insignia de mando", "icono": "<img class=ico src=assets/img/iconos/p/estrella.png alt>", "semana": 4,
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
    {"n": 5, "clave": "c10", "titulo": "La oferta de la semana", "icono": "<img class=ico src=assets/img/iconos/p/rayo.png alt>", "semana": 5,
     "abre": ["ofertas"], "mercado": [],
     "cabecera": "Cada semana, algo rebajado… por poco tiempo",
     "puedes": ["Cada semana sale una oferta en el Mercado: un sobre, una cápsula, un héroe o una carta concretos",
                "Rebajada entre un 20 y un 40 %, y solo hasta que acaba la semana: verás la cuenta atrás",
                "Si es algo raro, hay pocas unidades: cuando se acaban, se acabó",
                "Una por persona. Y tu docente también puede preparar las suyas"],
     "imagen": "assets/img/canje/oferta.jpg"},
    # 16-sep · en PUA NO hay Gran Sorteo (Norberto: «nooo hay sorteo»): son 8 semanas y el premio es de la convocatoria larga.
    {"n": 6, "clave": "c6", "titulo": "El Gran Sorteo", "icono": "<img class=ico src=assets/img/iconos/p/ticket.png alt>", "semana": 6, "sin_pua": True,
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
    {"n": 7, "clave": "c8", "titulo": "El Hangar de las Leyendas", "icono": "<img class=ico src=assets/img/iconos/p/corona.png alt>", "semana": 7, "sin_pua": True,
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
    {"n": 8, "clave": "c5", "titulo": "El Zoco Estelar", "icono": "<img class=ico src=assets/img/iconos/p/zoco.png alt>", "semana": 8, "sin_pua": True,
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
    {"n": 9, "clave": "c9", "titulo": "Los logros de a bordo", "icono": "<img class=ico src=assets/img/iconos/p/medalla.png alt>", "semana": 9, "semana_pua": 6,
     "abre": ["logros"], "mercado": [],
     "cabecera": "Lo que ya sabes hacer en la Nave, con premio",
     "puedes": ["16 logros: la primera vez que haces cada cosa en la Nave. Se apuntan solos, y los que ya hiciste también cuentan",
                "5 cubiertas: el puente, el Mercado, el camarote, el Zoco y la constancia. Cada una completa trae su premio",
                "La constancia son tus días a bordo: tres seguidos, siete seguidos y veinte en total",
                "Las cinco: el Contramaestre de la Nave, un héroe legendario (él y ella) y una carta con tu alias",
                "No se compra, no se regala y no se cambia en el Zoco: solo se gana"],
     "imagen": "assets/img/canje/logros.jpg"},
    # 16-sep · EL SIMULADOR DE JORAN (hasta el 23-sep, el reto A6; ahora, un juego de repaso de la Nave). Norberto: «la misma semana 10 les puedo dejar hacer la actividad en
    # clase y la semana siguiente mostramos el emulador desbloqueado (aunque algunos ya lo tendrán desbloqueado)». La
    # batalla se abre con el planeta Ludo (tema 6, semana 10); este capítulo la presenta a la clase entera la semana
    # siguiente. En PUA el tema 6 cae en la 5, así que el capítulo va con el Arsenal, en la 8.
    # 🔴 24-sep · Norberto: «debe estar desbloqueado en la semana que toca el reto de Joran para poder verlo» (y el docente,
    # «la misma semana que empieza el tema 6»). El capítulo pasa a la semana de Ludo (10; en PUA, la 6): es la misma en que
    # el servidor abre la batalla (`stargateBatalla`, TEMA_RETO 6) y la del relámpago de Joran. En PUA se queda en la 7:
    # allí va un capítulo por semana y la 6 es la de los logros de a bordo (también fijada en el servidor, stargateABordo).
    {"n": 10, "clave": "c11", "titulo": "El Simulador de Joran", "icono": "<img class=ico src=assets/img/iconos/p/diana.png alt>", "semana": 10, "semana_pua": 7,
     "abre": ["simulador"], "mercado": [],
     "cabecera": "El simulador que dejó encendido Joran",
     "puedes": ["Gana a RUTA AZUL, el rival de Joran, y el entrenamiento se queda en tu Nave",
                "Y si no, vuelve a intentarlo: cada derrota lo cansa y ataca más despacio",
                "Entrena tema a tema, o con todas las preguntas del viaje a la vez",
                "Cada modo tiene su ranking: ganar vale, ganar entero vale más y ganar sin fallar, lo máximo",
                "Es repaso de verdad: las preguntas salen del temario, y la batalla final es el examen"],
     "imagen": "assets/img/canje/simulador.jpg"},
    {"n": 11, "clave": "c7", "titulo": "El Arsenal de batalla", "icono": "<img class=ico src=assets/img/iconos/p/diana.png alt>", "semana": 15,
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

# ─────────────────── EL SIMULADOR DE JORAN · la batalla de repaso (16-sep; hasta el 23-sep, el reto A6) ───────────────────
# Norberto: «Reto A6: vamos a hacer algo más épico… se van a enfrentar a un juego de preguntas contra Joran… GamificaPro
# tiene un motor de peleas, revísalo y lo usamos… si el usuario gana desbloquea algo nuevo en su nave: el Simulador de
# Joran… habrá un ranking de cada tema y un modo en que entren todas las preguntas».
#
# 🔴 LAS PREGUNTAS NO ESTÁN AQUÍ. El banco (con sus respuestas) vive en GamificaPro —repositorio privado—, en
# `functions/stargateBanco.js`, y solo sale de allí pregunta a pregunta. Esta web es PÚBLICA: lo que hay aquí son los
# números que se le enseñan al alumnado, y tienen que ser los mismos que en `functions/stargateBatalla.js → BATALLA`
# (la batería 80 los compara).
BATALLA = {
    # 🔴 23-sep · el Simulador deja de ser un reto (el relámpago de Ludo pasa a ser «Encuentra el juego»): se queda en la
    # Nave como juego de repaso. Ganar a RUTA AZUL sigue abriendo el entrenamiento, pero no registra ningún reto.
    "reto": None, "clave": "joran", "rival": "RUTA AZUL", "creador": "Joran Pike", "capitulo": "c11",
    "tema_reto": 6, "temas_reto": [1, 2, 3, 4, 5],
    "vida": 100, "vida_rival": 180, "golpe": 20, "golpe_rival": 10,
    "cadencia": 25, "preguntas": 14, "cura": 35, "lentitud": 12,
    # 16-sep · Norberto: «sería fantástico poder escoger el nivel de dificultad en el juego». El nivel cambia las
    # preguntas que salen, lo que aguanta el rival, cada cuánto pega y lo que vale la marca. La primera victoria (la que
    # abre el entrenamiento) va siempre en media: cuesta lo mismo para todo el mundo.
    "nivel_reto": "media",
    "niveles": [["facil", "Fácil", "Sobre todo preguntas fáciles. Aguanta menos y pega más despacio.", "×0,85"],
                ["media", "Media", "El equilibrio del reto de Joran.", "×1"],
                ["dificil", "Difícil", "Medias y difíciles, aguanta más, pega antes y sin pistas.", "×1,35"]],
    # y los reconocimientos del grupo, que salen del historial de cada recluta
    "medallas": [["rapido", "<img class=ico src=assets/img/iconos/p/rayo.png alt>", "El más rápido", "menos segundos por acierto"],
                 ["certero", "<img class=ico src=assets/img/iconos/p/diana.png alt>", "El más certero", "más aciertos por respuesta"],
                 ["sabio", "<img class=ico src=assets/img/iconos/p/libro.png alt>", "Quien más sabe", "más respuestas correctas en total"]],
    # 16-sep · el mínimo para optar a «rápido» y «certero» (el espejo de BATALLA.MEDALLAS en GamificaPro): una buena
    # tarde no puede valer por un curso. Lo usan también los rankings de la Nave y de la consola.
    "medallas_min": {"aciertos": 20, "respondidas": 30},
    "objetos": [["cura", "<img class=ico src=assets/img/iconos/p/ajustes.png alt>", "Reparación", "Recupera 35 de escudo"],
                ["furia", "<img class=ico src=assets/img/iconos/p/rayo.png alt>", "Sobrecarga", "Tu próximo golpe hace el doble"],
                ["lentitud", "<img class=ico src=assets/img/iconos/p/envivo.png alt>", "Interferencia", "Retrasa su ataque 12 segundos"]],
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
                 "¿Qué reto principal enseñamos en clase?",
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
  "Una cápsula de rescate llega a tu Nave con UN héroe de la Rebelión dentro, al azar: 30 figuras en tres rangos. La Resistencia (%d%%): el grueso del ejército. La Vanguardia (%d%%): van por delante, cuesta alcanzarlas. Los MITOS (%d%%, ni uno de cada doce): ni siquiera se dejan ver hasta que caen. Se acumulan —cuantos más tengas, más donde elegir— y te los pones gratis desde tu Nave. ¿Repetido? Con 2 repetidos, uno nuevo al azar." % (_pct_cofre("heroe")["rara"], _pct_cofre("heroe")["épica"], _pct_cofre("heroe")["legendaria"]), 3, "heroe"),
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
  "ARSENAL DE BATALLA · Medio punto más en una actividad ya entregada y corregida. "
  "LEE ESTO ANTES: si ya tienes la nota máxima de evaluación continua, esto NO te sube nada — "
  "estarías tirando 550 créditos a la basura. Comprueba tu nota primero. Con esos créditos cierras "
  "media docena de sobres o te llevas nueve héroes.", 15, "nota"),
 ("Subir 1 punto en un entregable", 850, 1,
  "ARSENAL DE BATALLA · Un punto entero en una actividad ya entregada y corregida. "
  "LEE ESTO ANTES: si ya tienes la nota máxima de evaluación continua, no te sube nada y pierdes "
  "los 850 créditos. Es la recompensa más cara del catálogo a propósito: elegirla significa "
  "renunciar a casi todo lo demás.", 15, "nota"),
 ("Recalificar un trabajo entregado fuera de plazo", 700, 1,
  "ARSENAL DE BATALLA · Que se te corrija un trabajo que entregaste tarde. No es un aprobado "
  "automático: es que se mire y se puntúe como si hubiera llegado a tiempo.", 15, "nota"),
 ("Recalificar un suspenso", 950, 1,
  "ARSENAL DE BATALLA · Una segunda oportunidad sobre un trabajo suspenso: lo rehaces y se "
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
  dict(clave="openart", icono="<img class=ico src=assets/img/iconos/p/editar.png alt>", logo="openart.png", titulo="OpenArt", papel="El mundo dibujado",
       url="",
       texto="De aquí salieron <b>las imágenes</b>: los ocho planetas, la Tripulación Cero, las "
             "portadas de cada tema, las 24 insignias y las 26 cartas del álbum. Con "
             "<b>nano-banana</b>, elegido por una razón práctica: acepta una imagen de "
             "referencia y respeta el encuadre 16:9 sin recortar por su cuenta — que es lo que "
             "hace falta cuando el plano tiene que encajar en un montaje."),
  dict(clave="magnific", icono="<img class=ico src=assets/img/iconos/p/video.png alt>", logo="magnific.svg", titulo="Magnific", papel="La voz y el movimiento",
       url="https://referral.magnific.com/mzW6daB",
       texto="Puso <b>las voces</b> de los personajes y <b>los clips de vídeo</b>. Y algo que no se "
             "ve pero se nota: las <b>anclas</b> de personaje, que son las que hacen que NEBULA sea "
             "la misma en los diecisiete vídeos y no una parecida en cada plano."),
  # 🔴 El cuarto pilar. No es una herramienta de creación como las otras tres —no habla por MCP con
  # nadie— pero sin ella no habría web: es donde vive todo. Comprobado en la cabecera HTTP del
  # propio sitio (`platform: hostinger`), no supuesto.
  dict(clave="hostinger", icono="<img class=ico src=assets/img/iconos/p/varios.png alt>", logo="hostinger.png", titulo="Hostinger", papel="Donde vive todo",
       url="https://www.hostinger.com/es?REFERRALCODE=TH1MRCUARNEM",
       texto="La web que estás leyendo, la Nave del Comandante (la del profesorado) y la Nave del alumnado están "
             "alojadas aquí. Es la pieza menos vistosa de las cuatro y la única sin la que nada de "
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
  id="referente", icono="<img class=ico src=assets/img/iconos/p/envivo.png alt>", titulo="Si creas el grupo",
  quien="El profe <b>referente</b>: una persona por curso. Crea el grupo y reparte las llaves.",
  cuanto="Siete pasos · se hacen UNA vez por grupo",
  porque="Desde el 12-sep esto ya no vive en una hoja de cálculo: es una página más de la web, y se "
         "entra con tu cuenta de Google. Lo de la hoja está en <a href='legacy.html'>el archivo</a>.",
  pasos=[
   dict(cod="R1", t="Gestionar grupos", pose="saluda", img="r1_consola.png",
    hacer="Entra con tu cuenta de Google → en el menú, <b>Gestionar grupos</b> → <b>«+ Crear un grupo»</b>.",
    voz="Esto es la sala de máquinas de STARGATE. Antes era una hoja de cálculo con un menú; ahora "
        "es Gestionar grupos, arriba en el menú, y solo la ve el profe referente. Entras con tu cuenta "
        "de Google, la misma con la que llevas tus cosas de la asignatura, y no hay ningún PIN que "
        "recordar. Pulsa Crear un grupo: son siete pasos, y luego casi no vuelves por aquí."),

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
    voz="Esta lista es la llave. Quien esté aquí con su correo entra en su nave simplemente iniciando "
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
    hacer="El <b>código de clase</b>: en el <b>Puente</b> de tu Nave las tres primeras semanas (después, en <b>Mi gente</b>), con el botón <b>«Copiar invitación»</b>. Y en la sesión de las semanas 1 y 2, en grande, en la diapositiva <b>«Únete a la clase»</b>.",
    voz="Un código. Uno solo, de seis caracteres. Las tres primeras semanas lo tienes en el Puente de "
        "tu nave, y después en Mi gente. Y en la sesión de las dos primeras semanas sale en grande, en "
        "su propia diapositiva, para que lo copien de la pantalla. Tu alumnado entra por la portada con su cuenta de Google, escribe "
        "el código y se alista. Y si prefieres mandarlo por escrito, el botón Copiar invitación te da "
        "un mensaje listo para el foro de la plataforma de UNIR, con el enlace directo dentro. Ya no hay "
        "tres formularios que repartir ni un documento con candado: esto se lo puedes dar a una clase sin pensarlo."),

   dict(cod="R7", t="Tu Nave del Comandante", pose="pulgar", img="r7_consola.png",
    hacer="<b>Mi nave</b>: la clase de cada semana, tu gente y la cola de nota. Lo de una o dos veces por curso, en <b>Gestionar grupos</b>.",
    voz="Y aquí vives a partir de ahora: en tu nave, que te deja directamente dentro de tu grupo. Tu "
        "gente con su nombre y su correo, otorgar o anular un reto cuando algo se tuerza y la cola de "
        "subidas de nota que apruebas tú. Lo que se hace una o dos veces por curso, como pasar a todo "
        "el alumnado de un docente a otro si alguien se va a mitad de curso, o los ajustes del grupo, "
        "se queda en Gestionar grupos. A partir de aquí esto funciona solo. Nos vemos arriba."),
  ]),

 dict(
  id="imparte", icono="<img class=ico src=assets/img/iconos/p/medalla.png alt>", titulo="Si das las clases",
  quien="Quien <b>imparte</b>. Tu referente te pone en el equipo docente con tu correo: con eso entras.",
  cuanto="Seis pasos · cuatro de ellos son lo que harás cada semana",
  porque="Corto a propósito. La <b>visita guiada</b> del Capitán ya te cuenta tus botones, la narrativa, "
         "los retos y las insignias — te la ofrece la primera vez que entras en tu Nave, y luego está "
         "arriba a la derecha. Aquí está solo lo que se hace cada semana.",
  pasos=[
   dict(cod="D1", t="El atajo que deberías usar primero", pose="saluda", img="d1_portada.png",
    hacer="Portada → <b>Iniciar sesión con Google</b> → en <b>tu Nave</b>, la visita guiada del Capitán (o el botón <b>▶ Visita guiada</b>, arriba a la derecha).",
    voz="Bienvenido a tu nave. Entras por la portada con tu cuenta de Google y aterrizas dentro de tu "
        "grupo. La primera vez te ofrezco una visita de dos minutos: tu ficha, los tres pasos de cada "
        "clase, lo que toca esta semana y las secciones de tu grupo, y después el método. Si eres referente, te "
        "enseño también lo tuyo. Aquí voy a enseñarte solo las cuatro cosas que harás cada semana."),

   dict(cod="D2", t="Uno: la orden de la semana", pose="senala", img="d2_cronologia.png",
    hacer="<b>Cronología</b> → despliega la semana que toque → abajo, botón <b>Copiar</b> del foro.",
    voz="La cronología es tu carta de navegación: quince semanas, y cada una te dice qué vídeo "
        "proyectar, qué reto lanzar y qué insignia entregar. Abajo del todo está el mensaje del "
        "foro, ya escrito. Lo copias, lo pegas en el foro de la plataforma de UNIR y sigues con tu vida."),

   dict(cod="D3", t="Dos: tu gente", pose="tablet", img="d3_sala.png",
    hacer="Tu Nave → <b>Mi gente</b> → pulsa cualquier fila.",
    voz="Esta es tu gente, y entras con tu cuenta de Google: ni PIN, ni escribir tu correo, ni elegir "
        "tu nombre de una lista. Si pulsas a cualquiera se abre su ficha: lo que lleva hecho, sus "
        "insignias, sus créditos, su correo y el enlace de cada evidencia. El aviso sin enlace te dice "
        "dónde falta una. Desde aquí también puedes darle o quitarle un reto a mano cuando algo se tuerza, "
        "con el mando manual puesto."),

   dict(cod="D4", t="Tres: el aula, dentro del Genially", pose="brazos", img="d7_aula.png",
    hacer="Tu Nave → en el Puente, <b>3 · El aula</b>. O dentro del <b>Genially de clase</b> que te da tu referente.",
    voz="Esto es lo que más te va a cambiar la clase. Es tu puesto de mando y vive dentro del "
        "Genially, así que no tienes que salir de la presentación para nada. Desde aquí tocas "
        "llamada a filas y ves quién va fichando en directo; miras a quién felicitar por lo que ha "
        "hecho esta semana y a quién dar la bienvenida porque acaba de llegar; y, con el mando manual, repartes premios a "
        "mano: experiencia, créditos o una carta de regalo. Incluso puede elegir a alguien al azar "
        "por ti. Se monta una vez y vale para todos tus grupos, siempre."),

   dict(cod="D5", t="Cuatro: los tickets", pose="pensativo", img="d5_tickets.png",
    hacer="Portada → <b>Tickets de salida</b> → pulsa cualquier valoración.",
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
  id="estudiante", icono="<img class=ico src=assets/img/iconos/p/cohete.png alt>", titulo="Si eres recluta",
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
# suyo propio)… ellos solo pondrán el link». Orden: el propio del docente («Tu panel de control» / «Enlaces», en su Nave) → el
# oficial del grupo («Ajustes del grupo», en Gestionar grupos) → este. Se enseña en un iframe: basta el enlace.
PANEL_MAESTRO = "https://view.genially.com/6a8bfc4f5068ad5903fc39e3"
# 17-sep · Norberto: «por defecto, el panel de control de Genially quiero que sea siempre el mismo, que salga ya escrito» (tanto
# el de edición como el de visualización). Al crear un grupo y en sus Ajustes, estos dos van ya puestos.
PANEL_MAESTRO_EDICION = "https://app.genially.com/editor/6a8bfc4f5068ad5903fc39e3"

TICKET_URL = ("https://docs.google.com/forms/d/e/"
              "1FAIpQLScqkZRCiUqKkq24s7_yzy2d2ldHXlWz8GoHCqXXmHbQlgKhIQ/viewform"
              "?usp=pp_url&entry.489397158={GRUPO}&entry.856117988={COMANDANTE}&entry.240809630={TEMA}")

# 🔴 20-sep · EL TEMA, YA ELEGIDO. El ticket se rellena AL ACABAR CADA TEMA (no cada semana), y la sesión
# que lo cierra lo incrusta en su última diapositiva. Si el tema va ya marcado, las respuestas se pueden
# agrupar por tema y la sesión que abre el siguiente proyecta «cómo os fue» sin que nadie ordene nada.
#
# Son los textos EXACTOS de las opciones del formulario (Google ignora en silencio cualquier otro): la clave
# es el número de tema —`tema_n` de cada semana— y «p» para la presentación de la asignatura.
# Si algún día se tocan las opciones del formulario, se tocan aquí.
# 🔴 23-sep · Norberto: «en el ticket de salida elimina las actividades. Solo presentación, 8 temas y final». Fuera «a1» y
# «a2» (la semana que lanzaba una actividad preseleccionaba la actividad en vez de su tema). «p» es la presentación de la
# asignatura: ya existía en el formulario —el constructor de Apps Script la creó la primera, con su propia página de
# preguntas («¿Qué vibraciones te ha transmitido la presentación?»)— y la usa la sesión especial de la semana 1.
TICKET_TEMAS = {
    "p": "Presentación de la asignatura",
    "0": "Repaso / balance final",
    "1": "Tema 1: Creación de contenido multimedia (Fôrge)",
    "2": "Tema 2: El vídeo como recurso (Ecos)",
    "3": "Tema 3: Contenidos interactivos (Sendara)",
    "4": "Tema 4: M-learning (Reliae)",
    "5": "Tema 5: Evaluación y ePortfolio (Umbral)",
    "6": "Tema 6: Aprendizaje Basado en el Juego (Ludo)",
    "7": "Tema 7: Gamificación (Vínculo)",
    "8": "Tema 8: Realidad Aumentada y Virtual (Liminar)",
}

# ────────────── 21-sep · LOS ENLACES DE INTERÉS (la última diapositiva de la presentación al equipo) ──────────────
# Norberto: «añade una diapo con enlaces de interés (Drive compartido, carpeta de geniallys actualizados y
# plataforma STARGATE). ¿Me dejo alguno?». Sí, cinco: el **panel de control** que se proyecta en clase, los
# **enunciados y rúbricas** oficiales, la **plantilla de la Bitácora** que reutiliza el alumnado, los **vídeos** de
# la serie y —lo primero que necesita quien empieza— la **Nave Escuela**, el grupo de mentira para trastear.
#
# 🔴 Ni una dirección escrita aquí: cada una se coge de donde ya vive. Si mañana cambia el Drive del equipo o el
# panel maestro, esta diapositiva lo dice bien sin que nadie se acuerde de ella.
#   (icono, título, para qué sirve, dirección)
ENLACES_EQUIPO = [
    ("nave",      "La plataforma STARGATE",      "Tu Nave del Comandante, la de tu alumnado y todo lo demás. Se entra con la cuenta de Google de la universidad.", "https://stargate.mistercuarter.es"),
    ("gente",     "La Nave Escuela",             "El grupo de mentira, con 30 reclutas y el curso entero, para trastear sin romper nada.", "consola.html?per=" + PER_ESCUELA),
    ("notas",     "Actividades y evaluación",    "Las dos misiones mayores paso a paso, el ePortfolio, el examen y los documentos oficiales para descargar.", "actividades.html"),
    ("clase",     "El panel de control de la clase", "El Genially maestro: la teoría y la práctica guiada, ya montadas. Es el segundo tiempo de cada sesión.", PANEL_MAESTRO),
    ("varios",    "La carpeta de Geniallys",     "Los Geniallys del curso, actualizados: de aquí sale el panel de cada grupo.", GENIALLY_CARPETA),
    ("libro",     "El Drive del equipo",         "Fondos, personajes, insignias, cartas, el pack de audio y la guía del profesorado en PDF.", DRIVE_EQUIPO),
    ("video",     "Los vídeos de la serie",      "Los 33 vídeos, en orden: la sinopsis, los ocho planetas, las misiones y los cierres.", PLAYLIST),
    ("estrella",  "La plantilla de la Bitácora", "El ePortfolio ya montado en Genially, para que el alumnado lo reutilice como base.", PLANTILLA_EPORTFOLIO),
]
