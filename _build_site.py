# -*- coding: utf-8 -*-
"""Genera el sitio STARGATE v2 — «templo» del profesorado (23-ago-2026).
Páginas: index (portada) · guia · cronologia · actividades · geniallys · registro · recursos.
Ejecutar desde web-stargate/:  python3 _build_site.py
Datos de cronología/vídeos/geniallys en _site_data.py."""
import os, json, hashlib, subprocess, glob
from _site_data import (GOOGLE_CLIENT_ID,
                        V, yt, CRONO, GENIALLYS, GENIALLY_CARPETA, foro_por_semana,
                        PROCESO, PROCESO_CIFRAS, CASTING, DIRECTOR, BRAZOS,
                        PLAYLIST, HERO_MP4, HERO_POSTER, TABLERO_API, PLANTILLA_EPORTFOLIO,
                        CROMOS, CROMO_SERIES, SERIES_ALBUM, MONEDA, RANGOS, NIVELES, XP_VIAJE, CREDITOS,
                        RECOMPENSAS, IMG_RECOMPENSA, SEMANAS_PER, SEMANAS_CANJE_EXTRA, SEMANA_ARSENAL, DIAS_APERTURA_ANTES,
                        HEROES, HEROES_OCULTOS, AYUDA_RETOS, GANCHO_RETOS, EVIDENCIA_RETOS, TOPE_RETOS_DIA, IMG_RECOMPENSA, BONUS_PLANETA, BONUS_RACHA, BONUS_TUTORIAL, _AYUDA_DOC,
                        NOTA_MIN_PLANETAS, BONUS_SERIE, BONUS_ALBUM, BONUS_TRIPULACION, BONUS_PASE,
                        PASOS, ESCUADRONES, TICKET_URL, TICKETS_API, TICKETS_HOJA,
                        ALIAS_SUGERIDOS)

# Un dato, un sitio: las semanas de desbloqueo que se citan en el texto salen del catálogo,
# no se escriben a mano (si no, cambiarlas en _site_data.py dejaría la web mintiendo).
_DESDE = {r[0]: r[4] for r in RECOMPENSAS}
_SEM_HEROE = _DESDE["Héroe de la Rebelión"]

_SERIE_TIT_WEB = {k: t for k, t, _ in CROMO_SERIES}
HERE = os.path.dirname(os.path.abspath(__file__))
FAV = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%9B%B8%3C/text%3E%3C/svg%3E"

# 🔴 12-sep · FALTABAN LAS DOS ACCIONES QUE MÁS SE USAN. Norberto, mirando la web publicada: «No
# entiendo ahora el proceso de creación de grupos como profe referente, ¿cómo lo hago?». Y tenía
# toda la razón: `crear.html` y `consola.html` solo se alcanzaban desde las tarjetas de la PORTADA.
# En cuanto entrabas al material del profesorado —que es donde pasas el tiempo— desaparecían del
# mapa. El menú llevaba a siete documentos que se leen una vez y a ninguna de las dos cosas que se
# hacen de verdad: crear un grupo y gobernarlo.
NAV = [("consola.html","Mis grupos","cons"),("guia.html","Guía","guia"),
       ("crear.html","Crear grupo","crear","referente")]
# 🔴 DE DOCE ENTRADAS A TRES. Norberto, entrando como docente: «¡mucho tomate! Debemos simplificar…
# cuantas menos opciones tenga el docente mejor, debe ser claro y conciso».
#
# Lo que se fue, y a dónde:
#   · «Inicio» → lo hace el logo. Un enlace a inicio junto a un logo que ya lleva a inicio es una
#     entrada gastada en no hacer nada.
#   · Cronología, Actividades, Recursos, Geniallys, Registro, Cómo se hace → DENTRO de la Guía, que
#     es donde alguien los busca: son el método, no herramientas.
#   · «Grupos» y «Mi clase» → dentro de «Mis grupos», que es la casa del docente.
#   · «Crear grupo» lleva una cuarta columna, `referente`: solo sale a quien puede usarlo. Antes lo
#     veía cualquiera y cualquiera podía pulsarlo.
#
# Un docente entra y ve sus grupos. Punto. Todo lo demás está a un clic desde ahí.

# `puerta=True` tapa la pagina hasta que el servidor confirma que esa cuenta lleva algun grupo
# (assets/js/puerta.js). Ya no hay PIN: la llave es la cuenta de Google del equipo docente.
# 🔴 Esconde el CAMINO, no el contenido: un fichero de assets/ se baja igual desde su URL.
# `publica=True` es la PORTADA: menu minimo y sin visita guiada. 🔴 Si la portada llevara el menu
# del profesorado, la bifurcacion seria mentira: un estudiante veria «Mi clase» y «Geniallys»
# antes que su propia Nave.
# La «G» de Google para el HTML que se escribe desde Python (el botón de la portada es un <a>, no
# un <button>, así que no pasa por el JS que la pinta en las demás puertas). Misma marca, un solo
# sitio en cada lenguaje. Ver `window.SG.LOGO_G` en stargate.js para el porqué.
LOGO_G = ('<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true" focusable="false">'
  '<path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11.8c-.5 2.7-2 5-4.3 6.6v5.5h7c4.1-3.8 6.6-9.4 6.6-16.3z"/>'
  '<path fill="#34A853" d="M24 46c5.8 0 10.7-1.9 14.3-5.2l-7-5.5c-1.9 1.3-4.4 2.1-7.3 2.1-5.6 0-10.4-3.8-12.1-8.9H4.7v5.6C8.3 41.4 15.6 46 24 46z"/>'
  '<path fill="#FBBC05" d="M11.9 28.5c-.4-1.3-.7-2.7-.7-4.5s.3-3.2.7-4.5v-5.6H4.7C3.2 17 2.4 20.4 2.4 24s.8 7 2.3 10.1l7.2-5.6z"/>'
  '<path fill="#EA4335" d="M24 9.5c3.2 0 6 1.1 8.2 3.2l6.2-6.2C34.7 3 29.8 1 24 1 15.6 1 8.3 5.6 4.7 13.9l7.2 5.6C13.6 14.4 18.4 9.5 24 9.5z"/>'
  '</svg>')

def head(title, desc, active, puerta=False, publica=False):
    def _lnk(h, t, k, solo=""):
        act = " active" if k == active else ""
        # 🔴 Las entradas marcadas `solo` se pintan APAGADAS y las enciende el motor si procede.
        # No se pueden generar en el servidor —esta web es estática y no sabe quién mira— así que
        # nacen ocultas: quien no deba verlas no las ve NUNCA, ni un parpadeo antes de esconderse.
        # Esconder después de enseñar es peor que no esconder: ya lo ha visto y ya sabe que existe.
        if solo:
            return f'<a class="lnk solo-{solo}{act}" href="{h}" hidden>{t}</a>'
        if k != "grp":
            return f'<a class="lnk{act}" href="{h}">{t}</a>'
        # «Grupos» despliega los PER activos (los pide stargate.js a la API; sin PIN)
        return (f'<div class="lnk drop{act}" id="nav-grupos"><button type="button" class="drop-btn" '
                f'aria-haspopup="true" aria-expanded="false">{t} <i>▾</i></button>'
                f'<div class="drop-menu" role="menu" hidden>'
                f'<a class="drop-all" href="{h}" role="menuitem">Ver todos los grupos →</a>'
                f'<div class="drop-list"><span class="drop-msg">Cargando grupos…</span></div></div></div>')
    # 🔴 12-sep · UNA PUERTA, NO DOS. La portada bifurcaba en «Soy estudiante» / «Soy docente», y
    # eso obliga a acertar ANTES de que el sistema sepa quién eres: quien elegía mal acababa en la
    # mitad equivocada de la web. Ahora se entra primero y el servidor reparte.
    links = ('<a class="lnk" href="entrar.html">Entrar</a>') if publica else \
            "".join(_lnk(e[0], e[1], e[2], e[3] if len(e) > 3 else "") for e in NAV)
    return f'''<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{title}"><meta property="og:description" content="{desc}">
<meta name="theme-color" content="#080c14">
<link rel="icon" href="{FAV}">
<link rel="stylesheet" href="assets/css/stargate.css">
<script>window.SG_TABLERO_API="{TABLERO_API}";</script>
<script src="assets/js/stargate.js" defer></script>
<script src="assets/js/tour.js" defer></script>
{'<script>document.documentElement.classList.add("cerrado")</script><script src="assets/js/puerta.js" defer></script>' if puerta else ''}
</head><body>
<nav class="nav"><div class="wrap">
<a class="brand" href="index.html">◈ STARGATE {'' if publica else '<span class="modo docente">Capitán<i> · docentes</i></span>'}</a>
{links}
{'' if publica else '<button class="tour-start" type="button" title="Visita guiada con el Capitán">&#9654; Visita guiada</button>'}
</div></nav>'''

FOOT = '''<footer><div class="wrap">
STARGATE · La Bitácora Estelar — Proyecto Gamificado del <b>Máster en Tecnología Educativa</b> de la UNIR.<br>
Documento vivo · <a href="index.html">Inicio</a> · <a href="comosehizo.html">Cómo se hizo</a> · <a href="guia.html#faq">Guía para docentes</a> · <a href="privacidad.html">Privacidad</a>
</div></footer></body></html>'''

# ---------- galerías ----------
PERS=[("P1_bran","Bran Okafor","Reto A · T1 · Fôrge","Lo imperfecto compartido"),
("P2_tomas","Tomás Reyer","Reto A · T2 · Ecos","Tu voz cuando no estás"),
("P3_sylla","Sylla Bren","Reto A · T3 · Sendara","No hay una sola ruta"),
("P4_amara","Amara Sol","Reto A · T4 · Reliae","Compartir a tiempo"),
("P5_vera","Vera Khal","Reto A · T5 · Umbral","Medir es cuidar"),
("P6_joran","Joran Pike","Reto A · T6 · Ludo","El ensayo del miedo"),
("P7_mara","Mara Voss","Reto A · T7 · Vínculo","Un porqué mueve personas"),
("P8_noa","Noa Lieth","Reto A · T8 · Liminar","Enseñar futuros")]
ESP=[("E1_nebula","NEBULA","Preséntate a tu tripulación","La Bitácora viva que narra el viaje"),
("E2_capitan","El Capitán","Presentar la Act. 1","El mando de la misión: tú, docente"),
("E3_vaeon","General Vaeon","El Fragmento Prohibido (huevo de Pascua)","Señor de la Estática (villano)")]
RETO=[("R1_la-chispa","La chispa","Reto B · T1","Imagen didáctica con IA (Act 1)"),
("R2_el-eco-que-ensena","El eco que enseña","Reto B · T2","Videotutorial + videoquiz"),
("R3_la-matriz","La matriz","Reto B · T3","Matriz 8×6 del paisaje (Act 2)"),
("R4_entorno-de-aula","El entorno de aula","Reto B · T4","Espacio digital de aula (m-learning)"),
("R5_bitacora-medida","La Bitácora medida","Reto B · T5","Rúbrica + estructura del ePortfolio"),
("R6_el-juego","El juego","Reto B · T6","Juego digital educativo (ABJ)"),
("R7_microgamificacion","La microgamificación","Reto B · T7","Microgamificación"),
("R8_ultimo-umbral","El último umbral","Reto B · T8","Experiencia RA/RV + publicar Bitácora")]
HITO=[("H1_reclutamiento","Reclutamiento","Aceptas la misión (Sem. 1)"),
("H2_primera-forja","Primera Forja","Entregas la Actividad 1"),
("H3_cartografo","Cartógrafo","Entregas la Actividad 2"),
("H4_tripulacion-cero","Tripulación Cero","Recuperas a los 8 personajes"),
("H5_la-liberacion","La Liberación","Completas y publicas la Bitácora")]
CARDS=[c[0] for c in CROMOS]                       # el álbum manda: 26 cartas en 5 series
SERIE_DE={c[0]:c[2] for c in CROMOS}
NOMBRE_CROMO={c[0]:c[1] for c in CROMOS}
RAREZA={c[0]:c[3] for c in CROMOS}
# título largo de las cartas nuevas (las 11 antiguas lo sacan de BADGE_INFO)
CROMO_TITULO={
 "L1_lena":"Lena Reyer · La Alumna Infinita",
 "L2_kel":"Kel Bren · El Cartógrafo Tardío",
 "L3_copistas":"Los Copistas de Fôrge · Cuarenta manos",
 "L4_ilan":"Ilan Kesh · El Primer Nombre",
 "L5_ruta_azul":"Los Niños de la Ruta Azul · La partida que ya estaba ganada",
 "L6_oren":"Oren Vash · La Primera Voz de Ashan",
 "N1_recluta":"El Recluta · La última página",
 "S1_ander":"Ander Vaeon · El nombre que borró",
 "S2_estatica":"La Estática · El silencio que avanza",
 # El arco de Vaeon (serie V): su caída contada en seis cartas, de niño a general.
 "V1_nino":"Ander, el niño · El que preguntaba",
 "V2_aprendiz":"Ander, el aprendiz · La promesa",
 "V3_archivista":"Archivista Mayor · La cumbre",
 "V4_noche":"La noche de la Estática · Lo que no pudo guardar",
 "V5_relectura":"La relectura · Mil veces lo mismo",
 "V6_sello":"El primer sello · El nombre que borró",
}
PLANETAS=[("p1_forge","Fôrge","T1 · Contenido multimedia"),("p2_ecos","Ecos","T2 · El vídeo"),
("p3_sendara","Sendara","T3 · Interactivos"),("p4_reliae","Reliae","T4 · M-learning"),
("p5_umbral","Umbral","T5 · Evaluación"),("p6_ludo","Ludo","T6 · ABJ"),
("p7_vinculo","Vínculo","T7 · Gamificación"),("p8_liminar","Liminar","T8 · RA/RV")]

def badge(key,title,tag,sub,sm=False):
    c=" sm" if sm else ""
    return (f'<figure class="badge{c}" data-key="{key}" title="Ver detalle"><img loading="lazy" src="assets/img/insignias/{key}.png" alt="{title}">'
            f'<figcaption><b>{title}</b><span class="tag">{tag}</span><em>{sub}</em></figcaption></figure>')
def hito(key,title,sub):
    return (f'<figure class="badge sm" data-key="{key}" title="Ver detalle"><img loading="lazy" src="assets/img/insignias/{key}.png" alt="{title}">'
            f'<figcaption><b>{title}</b><em>{sub}</em></figcaption></figure>')
def cardt(key):
    return f'<div class="card-thumb" data-card="{key}" title="Ampliar tarjeta"><img loading="lazy" src="assets/img/tarjetas/{key}_carta.png" alt="Carta de {key}"></div>'
def ytbox(clave, nota=""):
    v = yt(clave)
    return (f'<div class="yt" data-id="{v["id"]}" role="button" tabindex="0" title="Reproducir">'
            f'<img loading="lazy" src="https://i.ytimg.com/vi/{v["id"]}/hqdefault.jpg" alt="{v["titulo"]}">'
            f'<span class="play">▶</span><div class="cap"><b>{v["titulo"]}</b>{("<em>"+nota+"</em>") if nota else ""}'
            f'<a href="{v["url"]}" target="_blank" rel="noopener" onclick="event.stopPropagation()">{v["url"]}</a></div></div>')
def planeta(key,nombre,tema):
    return f'<div class="planeta"><img loading="lazy" src="assets/img/planetas/{key}.png" alt="{nombre}"><b>{nombre}</b><em>{tema}</em></div>'

pers_html="\n".join(badge(*p) for p in PERS)
esp_html="\n".join(badge(*e) for e in ESP)
reto_html="\n".join(badge(*r) for r in RETO)
hito_html="\n".join(hito(*h) for h in HITO)
cards_html="\n".join(cardt(k) for k in CARDS)
def cards_por_series():
    out=[]
    for sk,titulo,sub in CROMO_SERIES:
        ks=[c[0] for c in CROMOS if c[2]==sk]
        out.append(f'<h4 class="serie-tit">{titulo} <em>· {sub}</em> <span class="tag">{len(ks)} cartas</span></h4>'
                   f'<div class="cards-row" style="margin-bottom:18px">' + "\n".join(cardt(k) for k in ks) + "</div>")
    return "\n".join(out)
cards_series_html=cards_por_series()

def _mil(n): return f"{n:,}".replace(",", ".")
def tabla_niveles():
    filas, prev = [], None
    for n, xp, r, tit in NIVELES:
        evo = ' <span class="tag">evoluciona</span>' if prev is not None and r != prev else ''
        prev = r
        pua = round(xp * XP_VIAJE["PUA"] / XP_VIAJE["REGULAR"] / 25) * 25
        filas.append(f'<tr><td><b>{n}</b></td><td class="pts">{_mil(xp)}</td><td class="small muted">{_mil(pua)}</td>'
                     f'<td>{tit}</td><td>{RANGOS[r-1]}{evo}</td></tr>')
    return "\n".join(filas)
def tabla_recompensas():
    filas = []
    for nombre, coste, mx, desc, desde, tipo in RECOMPENSAS:
        corta = desc.split(". ")[0].rstrip(".") + "."
        como = ("La aplica el profesorado" if tipo == "nota"
                else "<b>Automática</b>" + (" · repetible" if mx >= 99 else (f" · máx. {mx}" if mx > 1 else "")))
        filas.append(f'<tr><td><b>{nombre}</b><br><span class="small muted">{corta}</span></td>'
                     f'<td class="pts">{coste} {MONEDA}</td><td>Semana {desde}</td><td>{como}</td></tr>')
    return "\n".join(filas)
niveles_html = tabla_niveles()
recompensas_html = tabla_recompensas()
CRED_VIAJE = {t: (CREDITOS["reclutamiento"] + 2*CREDITOS["actividad"] + 2*CREDITOS["derivada"]
                  + (8*CREDITOS["retoA"] + 8*CREDITOS["retoB"] + CREDITOS["final"] if t == "REGULAR"
                     else 8*CREDITOS["retoB_pua"])) for t in ("REGULAR", "PUA")}
planetas_html="\n".join(planeta(*p) for p in PLANETAS)

# ================= PORTADA (index.html) =================
tiles = [
 ("consola.html","🎛️","Mis grupos","Tu puesto de mando: proyectar la clase, el aula, la llamada a filas, tu gente y la cola de nota."),
 ("guia.html","🧭","La guía","Narrativa, personajes, retos e insignias, cómo dinamizarlo en clase y las preguntas frecuentes."),
 ("cronologia.html","🗓️","La cronología","Semana a semana: qué vídeo, qué reto, qué insignia y el mensaje para el foro de la plataforma de UNIR."),
 ("actividades.html","🎯","Misiones y evaluación","Las dos actividades, el ePortfolio y el examen con los requisitos oficiales."),
 ("registro.html","🏅","El tablero y las insignias","Cómo se entrega una insignia, el ranking de cada grupo y los dos marcadores: xp y créditos."),
 ("recluta.html?per=demo-stargate&amp;demo=1","🚀","La Nave del Recluta","Así la ve tu alumnado: su ficha, la orden de la semana, los retos, el álbum y el Mercado. Ábrela en modo demostración."),
 ("tickets.html","🎟️","Tickets de salida","Valoraciones y dudas anónimas del alumnado, por tema y por clase."),
 ("panel.html","🪐","Panel de control","El mapa de los ocho planetas sobre el universo: cada uno lleva a la presentación de su tema."),
 ("recursos.html","📦","Sala de recursos","Las 24 insignias, los cromos y los materiales."),
 ("crear.html","✨","Crear un grupo","Solo referentes: siembra un grupo entero —retos, planetas, tienda y álbum— en un minuto."),
]
# 🔴 Las cifras del proceso se CUENTAN del disco, no se escriben a mano: si mañana hay tres planos
# mas, la web lo dice sola. Si la carpeta de produccion no esta a mano (se construye desde otro
# sitio, o se movio), se usa el ultimo recuento conocido y se AVISA — mejor un numero viejo
# senalado que un build roto o, peor, un cero silencioso en una pagina publica.
_VID = os.path.join(HERE, "..", "Videos Narrativa")
_ULTIMO = dict(piezas=42, masters=92, planos=587, voces=64)   # recuento del 11-sep-2026
def _cifras_proceso():
    try:
        piezas  = len([d for d in os.listdir(_VID) if d.startswith("stargarte-")])
        masters = len(glob.glob(os.path.join(_VID, "_shared", "*.png")))
        planos  = len(glob.glob(os.path.join(_VID, "stargarte-*", "assets", "*.png")))
        voces   = len(glob.glob(os.path.join(HERE, "..", "Audios Narrativa", "**", "*.mp3"), recursive=True))
        c = dict(piezas=piezas, masters=masters, planos=planos, voces=voces)
        if min(c.values()) == 0: raise ValueError("algun recuento sali\u00f3 a cero")
        return c
    except Exception as e:
        print("   \u26a0 no pude contar la produccion (%s): uso el recuento del 11-sep" % e)
        return dict(_ULTIMO)
CIFRAS = _cifras_proceso()

proceso_html = "\n".join(
  '<div class="paso"><div class="paso-n">{n}</div><div><h3>{t}</h3><p class="small">{x}</p></div></div>'.format(
     n=q["n"], t=q["t"], x=q["x"].format(**CIFRAS))
  for q in PROCESO)
cifras_html = "\n".join(
  '<div class="cifra"><b>{a}</b><span>{b}</span><em>{c}</em></div>'.format(
     a=a.format(**CIFRAS), b=b, c=c)
  for a, b, c in PROCESO_CIFRAS)

# 🔴 El director va aparte y ARRIBA, y los brazos salen de el. Ponerlos en fila como cuatro iguales
# contaba mal el proceso: las tres herramientas no se hablan entre ellas, hablan con el centro.
def _boton(h):
    return ('<a class="btn ghost peq" href="%s" target="_blank" rel="noopener">Probar %s ↗</a>'
            % (h["url"], h["titulo"])) if h.get("url") else ""

director_html = (
  '<div class="director">'
  '<div class="dir-cab"><span class="logo-app grande"><img src="assets/img/logos/{g}" alt="{t}" loading="lazy"></span>'
  '<div><div class="eyebrow teal">{p}</div><h3>{t}</h3><p class="dir-entra">{e}</p></div></div>'
  '<div class="dir-cuerpo">{cuerpo}'
  '<p class="dir-humano">{h}</p>{b}</div></div>'
).format(g=DIRECTOR["logo"], t=DIRECTOR["titulo"], p=DIRECTOR["papel"], e=DIRECTOR["entradilla"],
         cuerpo="".join('<p class="small">%s</p>' % x for x in DIRECTOR["parrafos"]),
         h=DIRECTOR["humano"], b=_boton(DIRECTOR))

# el conector: tres lineas que bajan del centro a cada brazo. Puro adorno con significado, y se
# esconde en movil, donde las tarjetas ya van una debajo de otra y la linea no aclararia nada.
conector_html = ('<div class="conector" aria-hidden="true"><span></span><span></span><span></span></div>')

brazos_html = "\n".join(
  '<div class="card comohizo"><div class="ch-top"><span class="logo-app"><img src="assets/img/logos/{g}" alt="{t}" loading="lazy"></span>'
  '<div><div class="eyebrow teal">{p}</div><h3>{t}</h3></div></div><p class="small">{x}</p>{b}</div>'.format(
     g=h["logo"], p=h["papel"], t=h["titulo"], x=h["texto"], b=_boton(h))
  for h in BRAZOS)

comohizo_html = director_html + conector_html + '<div class="grid cols-3 brazos">' + brazos_html + '</div>'

tiles_html="\n".join(f'<a class="tile" href="{h}"><span class="ic">{i}</span><b>{t}</b><em>{d}</em></a>' for h,i,t,d in tiles)

# 🔴 9-sep · LA PORTADA YA NO ES LA COCINA. Era «Puesto de mando del profesorado» y llevaba directo
# a la guia, la cronologia y los Geniallys — el material del equipo, abierto a quien pasara por ahi.
# Ahora es la ENTRADA al proyecto: que es STARGATE, y dos puertas. Sirve ademas para enseñarlo fuera
# (SIMO, redes, un compañero curioso) sin que nadie caiga en la trastienda.
PORTADA = head("STARGATE · La Bitácora Estelar",
  "STARGATE, el proyecto gamificado del Máster en Tecnología Educativa de la UNIR: ocho planetas, ocho temas y una Bitácora que lo reenciende todo.","inicio", publica=True) + f'''
<header class="hero hero-video">
<video autoplay muted loop playsinline preload="auto" poster="{HERO_POSTER}"><source src="{HERO_MP4}" type="video/mp4"></video>
<div class="veil"></div>
<div class="hero-inner">
<div class="kicker">Máster en Tecnología Educativa · UNIR</div>
<h1>STARGATE</h1>
<div class="sub">La Bitácora Estelar</div>
<p>La galaxia se apaga por la Estática. El alumnado son los reclutas, ocho planetas son los ocho temas
y la Bitácora —su ePortfolio— es lo que vuelve a encenderlo todo.</p>
<div id="hero-cta" class="cta-row">
<a class="btn primary grande btn-google" href="entrar.html">{LOGO_G}<span>Iniciar sesión con Google</span></a>
<a class="btn grande btn-demo" href="recluta.html?per=demo-stargate&amp;demo=1">🎬 Ver la demo</a>
<a class="btn ghost" href="{PLAYLIST}" target="_blank" rel="noopener">Serie completa en YouTube ↗</a>
<p class="cta-pie small muted">Estudiante o docente, se entra por aquí: al entrar, el sistema te
reconoce y te lleva a tu sitio. <b>¿Solo quieres curiosear?</b> La demo te enseña la Nave de un
estudiante por dentro, sin cuenta y sin que se guarde nada.</p>
</div>
</div></header>

<section id="en60"><div class="wrap">
<div class="eyebrow">La misión en 60 segundos</div><h2>Qué es STARGATE</h2>
<div class="grid cols-3">
<div class="card"><h3>1 · La premisa</h3><p>La agencia STARGATE cruzó una puerta estelar. Al otro lado, una galaxia se apaga por
<b>la Estática</b>: un silencio que hace que nadie cree, registre ni comparta. Contra ella no sirven las armas:
sirve <b>dejar constancia</b>.</p></div>
<div class="card"><h3>2 · El viaje</h3><p>El alumnado es un <b>recluta</b>. Cruza <b>ocho planetas = ocho temas</b>, guiado por
<b>NEBULA</b> (la IA de la nave) y por ti, <b>el Capitán</b>. En cada planeta recupera a un tripulante de la
<b>Tripulación Cero</b> y gana sus insignias.</p></div>
<div class="card"><h3>3 · El arma</h3><p>La <b>Bitácora Estelar</b> es el ePortfolio. Cada página: evidencia → contexto →
reflexión → autoevaluación. Cuando está completa, la Estática retrocede y <b>la puerta a la Tierra se abre</b>.
La batalla final es el examen.</p></div>
</div>
<div class="planetas">{planetas_html}</div>
</div></section>

<section id="puertas"><div class="wrap">
<div class="eyebrow teal">Por dónde entras</div><h2>Una sola puerta</h2>
<p class="lead">Da igual quién seas: entras con tu cuenta de Google y el sistema te reconoce. No hay
que elegir bando en la puerta ni recordar ningún PIN.</p>
<div class="grid cols-3 puertas-3">
  <div class="card puerta-tile">
    <span class="ic">🚀</span>
    <h3>Si eres estudiante</h3>
    <p>Vas a tu <b>Nave</b>: tu personaje, la orden de la semana, los planetas que se abren, tus
    insignias y el Mercado Estelar. Desde ahí registras lo que completas y canjeas lo que ganas.</p>
    <span class="chip ok">Sin teclear nada →</span>
  </div>
  <div class="card puerta-tile">
    <span class="ic">🎓</span>
    <h3>Si eres docente</h3>
    <p>Vas a tu <b>puesto de mando</b>: tus grupos, y en cada uno lo que se usa en directo —proyectar
    la sesión, la llamada a filas y el aula—. Y desde ahí, la guía del método y las actividades.</p>
    <span class="chip">Sin teclear nada →</span>
  </div>
  <div class="card puerta-tile">
    <span class="ic">🔑</span>
    <h3>Si aún no estás</h3>
    <p>Te pide el <b>código de clase</b>, el que reparte tu docente el primer día. Con él te alistas
    en el momento y ya tienes Nave. Es lo único que hay que teclear en toda la web.</p>
    <span class="chip">Un código de 6 caracteres →</span>
  </div>
</div>
<p class="cta-row" style="margin-top:26px">
<a class="btn primary grande btn-google" href="entrar.html">{LOGO_G}<span>Iniciar sesión con Google</span></a>
<a class="btn grande btn-demo" href="recluta.html?per=demo-stargate&amp;demo=1">🎬 Ver la demo sin cuenta</a></p>
</div></section>
<section id="secciones"><div class="wrap">
<div class="eyebrow teal">Zona del profesorado</div><h2>Dónde está cada cosa</h2>
<p class="lead small">Todo esto es material del profesorado: se abre con la misma cuenta con la que
entras. Si eres estudiante, tu sitio es la Nave.</p>
<div class="tiles">{tiles_html}</div>
</div></section>

<section id="voces"><div class="wrap">
<div class="two">
<div>
<div class="eyebrow amber">Las tres voces</div><h2>NEBULA, el Capitán y Vaeon</h2>
<p class="lead"><b>NEBULA</b> narra y lanza los retos. <b>El Capitán eres tú</b>: das las órdenes (enunciados), reconoces los
logros (insignias) y sostienes la moral; en el foro de la plataforma de UNIR se firma siempre como <i>Capitán</i>, a secas. <b>Vaeon</b> silencia:
es la personificación de los errores de diseño educativo, y aparece en el Tema 5.</p>
<p><a class="btn" href="guia.html#pers">Conoce a la Tripulación Cero →</a></p>
</div>
<div class="trio trio-amenaza"><img src="assets/img/personajes/nebula.png" alt="NEBULA"><img src="assets/img/capitan/brazos.png" alt="El Capitán"><img src="assets/img/personajes/vaeon.png" alt="General Vaeon"></div>
</div>
</div></section>

<section id="comohizo"><div class="wrap">
<div class="eyebrow teal">Cómo se hizo</div><h2>Esto lo ha montado un profesor</h2>
<p class="lead">Sin estudio, sin productora y sin equipo: un docente, un ordenador y cuatro
herramientas. Lo cuento porque la pregunta que más me hacen al enseñarlo es
«¿y esto cuánto cuesta encargarlo?» — y la respuesta es que no se encargó.</p>

<!-- 🔴 NADA DE grid cols-3 AQUÍ. Este bloque ya trae su propia estructura: Claude a todo lo ancho
     y las tres herramientas en fila debajo. Metido en una rejilla de tres columnas, Claude quedaba
     aplastado en 353 px a la izquierda, el conector se comía otra columna entera y las tres
     herramientas se apilaban en la tercera — con medio bloque en blanco por el medio. En
     `comosehizo.html` se veía bien porque allí NO va envuelto; aquí sí, y nadie lo comparó. -->
<div>{comohizo_html}</div>
<!-- 🔴 Decirlo. Son de afiliado y ocultarlo seria justo lo contrario del proyecto, que va de dejar
     constancia. Ademas la peticion se sostiene mejor dicha en voz alta que disimulada. -->
<p class="small muted" style="margin-top:14px">Los botones son <b>enlaces de afiliado</b>, y se
dice para que lo sepas. Donde la herramienta lo ofrece, <b>quien entra por ahí se lleva un descuento
o un crédito de bienvenida</b>; y en todos los casos este proyecto recibe créditos que se reinvierten
en seguir ampliando la aventura.</p>

<p style="margin-top:26px"><a class="btn primary grande" href="comosehizo.html">📖 Cómo se hizo, con todo el detalle →</a></p>
<p class="small muted">El casting de las nueve voces, las anclas de personaje, por qué esos modelos
y cuántos borradores hubo de verdad.</p>
</div></section>
''' + FOOT

# ================= GUÍA (guia.html) =================
FAQ = [
 ("¿Tengo que cambiar mi programación para usar STARGATE?", "No. STARGATE no añade trabajo: <b>renombra y da sentido</b> al que ya existe (2 actividades + ePortfolio con 3 retos + tests). Sigue la programación oficial; la capa narrativa va encima."),
 ("¿Cómo entro? ¿Necesito algún PIN?", "No hay PIN. Entras con la <b>cuenta de Google</b> que tu profe referente puso en el equipo docente del grupo, desde la portada (<b>«Iniciar sesión con Google»</b>). El sistema te reconoce y te lleva a <a href='consola.html'>Mis grupos</a>. Si te dice que esa cuenta no lleva ningún grupo, pide a tu referente que te añada con <b>ese mismo correo</b>."),
 ("¿Cómo invito a mi clase?", "En <a href='consola.html'>Mis grupos</a>, cada grupo enseña su <b>código de clase</b> en grande (para la pizarra) y el botón <b>«Copiar invitación»</b>, que copia un mensaje listo para pegar en el foro de la plataforma de UNIR, con el enlace directo. Tu alumnado entra con Google, escribe el código y se alista solo."),
 ("¿Qué uso durante la clase en directo?", "Tres botones en la tarjeta de tu grupo: <b>Proyectar la clase</b> (la sesión de la semana montada: planeta, vídeos, retos e insignias; pasa con las flechas), <b>Llamada a filas</b> (el pase de lista: tu alumnado pulsa «Presente» en su Nave y se lleva créditos y un sobre de cromos) y <b>El aula</b> (quién ha fichado, a quién felicitar, el ranking y los premios a mano). El aula y la llamada se pueden incrustar en tu Genially con <code>?embed=1</code>."),
 ("Un estudiante ha marcado retos que no ha hecho. ¿Qué hago?", "En Mis grupos → <b>Ver mi gente y los ajustes</b> → <b>Mi gente</b>, pulsa su fila y <b>anula</b> el reto: se le descuentan los xp y los créditos que dio, y queda anotado. Si ya se había gastado los créditos, lo cosmético que compró se queda (el aviso te dice qué no se ha podido retirar), pero <b>la nota está a salvo</b>: ninguna subida de nota se aplica sin que la apruebes en la <b>Cola de nota</b>. Con el enlace obligatorio y el tope de 3 retos al día, una trampa así se ve enseguida."),
 ("¿Puedo dar un premio que se reclame desde una presentación?", "Sí: <b>Premios por enlace</b>, dentro del grupo (la pestaña la ve quien lo lleva, el referente; si no lo eres, pídeselo). Eliges qué da (xp, créditos, un sobre de cromos, un héroe…), cuántas veces (en total, por escuadrón o por persona) y te llevas un enlace para pegar en cualquier web o presentación. Por ejemplo: «los 5 primeros de cada escuadrón que lo pulsen, un sobre». Quien llega tarde lee que ya se ha agotado."),
 ("¿Dónde veo las dudas y valoraciones de mi alumnado?", "En los <a href='tickets.html'>tickets de salida</a>: al final de cada clase el alumnado valora la sesión y deja dudas de forma <b>anónima</b> («Contacta con NEBULA»), y tú las ves por tema y fecha, y marcas las resueltas."),
 ("Un estudiante dice que no puede entrar", "Casi siempre es la cuenta: tiene que entrar con la <b>misma cuenta de Google</b> con la que se alistó (en un ordenador compartido, la pantalla «¿Eres tú?» le deja cambiar de cuenta). Si nunca se alistó, que escriba el <b>código de clase</b> al entrar. En <b>Mi gente</b> ves el correo con el que se alistó cada uno."),
 ("¿Qué hago exactamente en la primera sesión?", "Antes de clase, en <a href='consola.html'>Mis grupos</a> pulsa <b>«Copiar invitación»</b> en tu grupo y pégala en el foro de la plataforma de UNIR (o escribe el <b>código de clase</b> en la pizarra). En clase: pon el vídeo de <b>Sinopsis</b>, después el de <b>La Bitácora</b> (ePortfolio), preséntate como <b>Capitán</b> y deja que se alisten en el momento: al hacerlo se llevan la insignia de <b>Reclutamiento</b>, que merece su minuto de ceremonia. Deja una pregunta en el aire: «¿por qué se apagan los mundos?»."),
 ("¿Cuándo pongo cada vídeo?", "La <a href='cronologia.html'>cronología</a> lo dice semana a semana: la <b>intro</b> del planeta al abrir el tema, el <b>cierre</b> al terminar el bloque y el <b>fragmento</b> del tripulante justo después, como recompensa. Las misiones (Bitácora, Act. 1, Act. 2) al lanzar cada una."),
 ("Los vídeos están en «oculto» en YouTube, ¿funcionan?", "Sí. Un vídeo oculto se ve con el enlace y se puede insertar en Genially o en el aula virtual. Van pasando a públicos solos según el calendario de redes del canal; tú no tienes que tocar nada."),
 ("¿El Reto A puntúa?", f"<b>Para nota, no</b> — y es a propósito: es el motor de motivación, y convertirlo en nota le quitaría la función. Sí da <b>100 xp</b> (que suben nivel) y <b>{CREDITOS['retoA']} créditos ◈</b>, y su recompensa real es desbloquear al personaje (fragmento + insignia). El Reto B sí produce una evidencia evaluable de la Bitácora."),
 ("¿Cómo y cuándo entrego las insignias?", "En público y con ceremonia: celébralo en clase o en el foro de la plataforma de UNIR y nombra el logro con la frase del personaje. No hay que anotar nada: la registra el propio estudiante desde su Nave y tú la ves en <b>Mi gente</b>. Qué insignia toca cada semana está en la <a href='cronologia.html'>cronología</a>."),
 ("¿Dónde están los enunciados y rúbricas oficiales?", "En <a href='actividades.html#docs'>Actividades → Documentos oficiales</a> (enunciados de la Act. 1 y 2, pautas del ePortfolio, instrucciones de uso de IA, rúbricas y planificación semanal)."),
 ("¿Qué pasa con el temario (PDF de los temas)?", "Los PDF de temas disponibles son de la programación anterior y con nombres cambiados; <b>no se publican aquí</b> hasta recibir el temario actualizado. Los vídeos de la serie ya siguen el orden nuevo (T6 ABJ → T7 Gamificación)."),
 ("Mi grupo es PUA (condensado). ¿Cómo lo adapto?", "Agrupa los mensajes para el foro de la plataforma de UNIR por bloque (dos semanas en un mensaje) y lanza los dos retos del tema juntos. La cronología sirve igual: son 15 semanas de contenido que tú compactas."),
 ("¿Cuál es la diferencia entre Ludo (T6) y Vínculo (T7)?", "En <b>Ludo se juega</b>: el juego ES la actividad (ABJ). En <b>Vínculo no se juega</b>: se toman elementos del juego (puntos, insignias, niveles, narrativa) y se ponen sobre una tarea que no es un juego (gamificación). Es el error conceptual más común: apóyate en Joran y Mara."),
 ("¿Cómo funciona el examen dentro de la historia?", "La batalla final ES el examen. En la semana 15 el vídeo <b>Plan de Ataque</b> lo presenta (caso, plataforma en directo, tablero de retos, reglas). Los tests de cada tema son el entrenamiento; la última semana hay repaso y simulacro."),
 ("¿Puedo mencionar Genially o la asignatura en público?", "En comunicación pública (redes, web abierta) el proyecto se nombra siempre «Proyecto Gamificado del Máster en Tecnología Educativa de la UNIR», sin la asignatura y sin citar herramientas. Dentro del aula y en este puesto de mando, sin problema."),
 ("¿Cómo registran los alumnos sus retos e insignias?", "Solos, desde su <b>Nave</b>: abren el reto, lo hacen y pulsan <b>«Lo he hecho»</b>. Donde hay algo que entregar (los Retos B, las actividades) el reto <b>pide el enlace</b> de la evidencia y sin él no se registra; y nadie registra más de <b>3 retos al día</b>, para que nadie llegue al nivel 10 a golpe de clic. Los xp, el nivel, los créditos, las insignias y el <b>avatar que evoluciona</b> se calculan solos. Tú ves cada enlace en <b>Mi gente</b> (pulsa la fila) y un aviso «⚠️ sin enlace» donde falte."),
 ("¿Qué es la Nave del Recluta?", "La web del alumnado: su <b>personaje con rango</b>, la orden de la semana, los vídeos, los retos, su botín (insignias, cromos y héroes), el Mercado Estelar y los rankings. Entran por la <b>misma puerta que tú</b>, la portada, con «Iniciar sesión con Google»: si ya están alistados van directos a su Nave, y si no, escriben el <b>código de clase</b> y se alistan en un minuto. La primera vez NEBULA les enseña cada rincón. Para <b>enseñarla sin cuenta</b> (en una charla, a un compañero) está el botón <b>«Ver la demo»</b> de la portada."),
 ("¿Qué es el panel de control de los planetas?", "El <a href='panel.html'>mapa de la galaxia</a>: los ocho planetas sobre el universo, cada uno enlazando a la presentación de su tema. Con <code>?per=</code> los planetas se <b>desbloquean solos</b> según el calendario del grupo. Sirve como página o incrustado en Genially. El <b>referente</b> pone el panel oficial del grupo en <b>Ajustes del grupo</b>, y cada docente puede poner su copia en <b>Mis enlaces</b>."),
 ("¿Qué son los xp, los niveles y los créditos?", f"Son <b>dos marcadores distintos</b>. Los <b>xp</b> (Reto A 100 · Reto B 250 · Actividad 500 · Batalla 500 · hitos 300) miden el viaje, <b>nunca bajan</b> y dan el <b>nivel del 1 al 10</b>: el personaje <b>evoluciona</b> al entrar en los niveles 3 (Cadete), 5 (Oficial), 8 (Comandante) y 10 (<b>Leyenda</b>, el viaje completo). Los <b>créditos ◈</b> (Reto A {CREDITOS['retoA']} · Reto B {CREDITOS['retoB']} · Actividad {CREDITOS['actividad']} · hitos {CREDITOS['derivada']}) son la moneda: es lo único que se descuenta al canjear recompensas. Comprar cromos no baja de nivel a nadie. Todo automático; tabla completa en <a href='registro.html#economia'>El tablero → Dos marcadores</a>."),
 ("¿Cómo abro un grupo nuevo?", "Lo hace el <b>profesor/a referente</b> en <a href='crear.html'>Crear grupo</a>, con su cuenta de Google: nombre, tipo REGULAR/PUA, primer día de la semana 1, el <b>equipo docente por su correo</b> y los enlaces de la clase (el padlet, el panel). En un minuto el grupo queda sembrado entero —los retos con sus insignias, los 8 planetas, la tienda, los escuadrones y el álbum— y sale un <b>código de clase</b> para repartir. Sin hojas de cálculo ni PIN. <span class='small muted'>Cómo era antes, en <a href='legacy.html'>el archivo</a>.</span>"),
 ("¿Qué hago si un alumno no hace el Reto A?", f"Nada punitivo: no cuenta para nota. Pero el tripulante sigue «sin recuperar» y esos 100 xp y {CREDITOS['retoA']} ◈ se quedan sin ganar: usa la narrativa (NEBULA sigue incompleta) como invitación, no como castigo. Lo habitual es que el grupo arrastre."),
]
faq_html="\n".join(f'<details class="faq"><summary>{q}</summary><div>{a}</div></details>' for q,a in FAQ)

GUIA = head("STARGATE · Guía para el profesorado",
  "La gamificación STARGATE: narrativa, personajes, retos e insignias, la Bitácora y cómo dinamizarla en clase.","guia", puerta=True) + f'''
<header class="hero"><div class="kicker">Guía para el profesorado</div>
<h1>La guía</h1>
<p>La capa narrativa que convierte la asignatura en una misión: cruzar ocho planetas y construir una
<b>Bitácora</b> —el ePortfolio— tan viva que reencienda lo que la Estática apaga.</p>
<p style="margin-top:18px"><span class="pill">8 planetas = 8 temas</span><span class="pill">24 insignias</span><span class="pill">26 cromos coleccionables</span><span class="pill">2 actividades + ePortfolio</span></p>
</header>

<!-- 🔴 SUBMENÚ DE LA GUÍA. Petición de Norberto: «al abrir la guía añade un submenú con secciones
     para ir rápido». La guía es larga a propósito —es el método entero— y sin índice se navega a
     rueda de ratón. Se pega arriba al hacer scroll: el índice de un documento largo que desaparece
     al bajar no es un índice, es una portada. -->
<nav class="guia-sub" aria-label="Secciones de la guía"><div class="wrap">
  <a href="#que">Visión general</a>
  <a href="cronologia.html">Cronología</a>
  <a href="actividades.html">Actividades</a>
  <a href="#pers">Personajes</a>
  <!-- 🔴 «La Bitácora» faltaba en el índice teniendo su propia sección (#bit), y no es una sección
       menor: es el ePortfolio, o sea lo que de verdad se evalúa. Un índice que se salta el capítulo
       principal enseña a no fiarse del índice. -->
  <a href="#bit">La Bitácora</a>
  <a href="#retos">Retos e insignias</a>
  <a href="#din">Una clase en directo</a>
  <a href="#enlaces">Recursos</a>
  <a href="#faq">Dudas</a>
</div></nav>

<section id="que"><div class="wrap">
<div class="eyebrow">La premisa</div><h2>Qué es STARGATE</h2>
<p class="lead">Es la <b>capa narrativa</b> que envuelve toda la asignatura. No añade trabajo: <b>renombra y da
sentido</b> al que ya existe (dos actividades + un ePortfolio con tres retos). En vez de "entregar tareas", el
alumnado <b>construye una Bitácora que le sobrevive</b>. Y de paso vive por dentro una gamificación profunda:
aprende gamificación <b>experimentándola</b>.</p>
<div class="grid cols-2">
<div class="card"><h3>El conflicto</h3><p>La galaxia se apaga por <b>la Estática</b>: un silencio que hace que la
gente deje de <b>crear, registrar y compartir</b>. Contra ella no sirven las armas: sirve <b>dejar constancia</b>.</p></div>
<div class="card"><h3>La misión del recluta</h3><p>El alumnado es un <b>recluta</b> del equipo de rescate. Cruza
<b>ocho planetas</b> (los ocho temas) y trae una <b>Bitácora</b> que reenciende lo perdido. Esa Bitácora <b>es su ePortfolio</b>.</p></div>
</div>
<h3 style="margin-top:1.6em">Los ocho mundos = los ocho temas</h3>
<div class="planetas">{planetas_html}</div>
</div></section>

<section id="pers"><div class="wrap">
<div class="eyebrow">La narrativa</div><h2>Las voces del viaje</h2>
<div class="two">
<div><p class="lead"><b>NEBULA</b> es la IA de la nave y la narradora: cálida, clara. Su secreto —que se revela poco a
poco— es que es la <b>Bitácora de la Tripulación Cero</b>, el primer equipo que no regresó. Cada planeta
documentado <b>recupera un fragmento</b> de quién fue. El <b>Capitán</b> eres <b>tú, docente</b>: el mando que
da las órdenes, reconoce los logros y sostiene la moral.</p></div>
<div class="trio"><img src="assets/img/personajes/nebula.png" alt="NEBULA"><img src="assets/img/capitan/tablet.png" alt="El Capitán"></div>
</div>
<h3 style="margin-top:1.2em">La Tripulación Cero — 8 personajes que se recuperan</h3>
<p class="lead">Cada tripulante encarna la <b>lección</b> de su tema. Al superar el <b>Reto A</b> del planeta se
desbloquea su fragmento-vídeo y su <b>insignia de personaje</b>. Pulsa cada insignia para ver el reto.</p>
<div class="badges">{pers_html}</div>
<h3 style="margin-top:1.8em">Personajes especiales</h3>
<div class="badges">{esp_html}</div>
<div class="card villain" style="margin-top:22px"><div class="two"><div><div class="eyebrow">El antagonista</div>
<h3>La Estática y el General Vaeon</h3>
<p>La Estática no destruye: <b>silencia</b>. El General <b>Vaeon</b> es la personificación de los <b>errores de
diseño educativo</b> —contenido que no se entiende, recursos que no llegan, aprendizaje sin evaluación, saber
acaparado—. Su debilidad, y la lección del curso: <b>una Bitácora abierta, documentada y compartida no se puede
silenciar</b>. Es un villano con motivo: fue archivista y perdió su mundo; hoy cree que olvidar es misericordia.
Aparece en el <b>Tema 5</b> y tiene su propio epílogo (el Fragmento Prohibido).</p></div>
<div class="trio"><img src="assets/img/personajes/vaeon.png" alt="General Vaeon"></div></div></div>
<h3 id="ecos" style="margin-top:1.8em">Los Ecos — seis vidas que la Cero cambió</h3>
<p class="lead">La Tripulación Cero no salvó mundos en abstracto: cambió a <b>personas concretas</b>. Los
<b>Ecos</b> son esas personas, y cada uno remata la lección de un tripulante desde el otro lado —el de quien
recibe—. No se ganan con retos: <b>solo salen en los sobres de cromos</b>, y son la razón narrativa para
seguir abriendo sobres cuando ya tienes a los ocho de la Cero.</p>
<div class="grid cols-2" style="gap:14px">
<div class="card"><h3>Lena Reyer · La Alumna Infinita</h3><p class="small">La hija de <b>Tomás</b>. Creció con
los videomensajes que él grababa a cientos de años luz. Hoy es maestra y los pone en su clase: cada curso,
treinta alumnos más aprenden de un hombre que no conocieron. <em>Un buen vídeo no tiene última reproducción</em>
— el argumento del aula invertida, contado por quien la vivió.</p></div>
<div class="card"><h3>Kel Bren · El Cartógrafo Tardío</h3><p class="small">El hermano gemelo de <b>Sylla</b>,
el que «no servía para estudiar». Tardó nueve años en descubrir que el problema no era él, sino que solo le
habían ofrecido un camino. Hoy dibuja los mapas de Sendara. Es la <b>atención a la diversidad</b> con cara y
nombre.</p></div>
<div class="card"><h3>Los Copistas de Fôrge · Cuarenta manos</h3><p class="small">Los cuarenta anónimos que
copiaron a mano el boceto sin terminar de <b>Bran</b> y lo pasaron de tienda en tienda. El original se perdió
esa noche; las copias, no. La carta que explica por qué compartir en bruto y con licencia abierta gana a
guardar la obra perfecta.</p></div>
<div class="card"><h3>Ilan Kesh · El Primer Nombre</h3><p class="small">El primer niño que <b>Vera</b> anotó
en su historia clínica de mundos. No escribió «sujeto 1»: escribió su nombre y qué le gustaba. Esa manía
convirtió una tabla de datos en la primera Bitácora. La <b>evaluación como cuidado</b>, resumida en una
carta.</p></div>
<div class="card"><h3>Los Niños de la Ruta Azul</h3><p class="small">Los diecinueve críos del refugio de
<b>Ludo</b> que jugaron cien veces al juego de Joran sin saber que ensayaban su evacuación. La noche real
salieron riéndose por una línea azul del suelo. El <b>ABJ</b> visto desde quien aprendió jugando.</p></div>
<div class="card"><h3>Oren Vash · La Primera Voz de Ashan</h3><p class="small">El anciano que volvió a
escribir cuando Ashan llevaba once años en silencio: un cuaderno de tapas rotas con cómo se hace el pan y por
qué su madre lloraba con cierta canción. <b>Ese cuaderno es la página uno de NEBULA</b> — el eslabón que faltaba
entre la Cero y la IA que narra el viaje.</p></div>
</div>
<h3 style="margin-top:1.8em">…y tres cartas que cierran el mapa</h3>
<div class="grid cols-3" style="gap:14px">
<div class="card"><h3>El Recluta</h3><p class="small">Eres <b>tú</b>. Sin poderes, sin destino escrito: solo
la costumbre de dejar constancia. Es la única carta del álbum que todavía se está escribiendo.</p></div>
<div class="card"><h3>Ander Vaeon · <span class="tag">1 %</span></h3><p class="small"><b>La carta más difícil
del álbum</b> y la única que revela la <b>identidad</b> del villano: antes del general hubo un Archivista Mayor
con un libro en los brazos y un nombre de pila. Cuando la Estática se llevó a los suyos, <b>el primer archivo
que selló bajo llave fue el suyo</b>; hoy solo le queda el apellido y un rango. Sale <b>1 de cada 100</b> sobres
— la mitad de veces que el propio Vaeon: <em>el hombre es más raro que el monstruo</em>.</p></div>
<div class="card"><h3>La Estática</h3><p class="small">El enemigo <b>de verdad</b>, y es más aburrido que un
general: una costumbre que se contagia. Donde entra, nadie crea, registra ni comparte, y en dos generaciones un
mundo olvida lo que sabía hacer.</p></div>
</div>
<h3 style="margin-top:1.8em">El álbum completo — 26 cartas en 5 series</h3>
<p class="lead">Cada carta trae retrato, historia breve, clase, atributos y cita. Regla de oro, y conviene
decirla en clase: <b>la insignia se gana, el cromo se compra</b>. El Reto A da la <b>insignia</b> del
tripulante; las <b>26 cartas del álbum salen únicamente de los sobres</b> (15 ◈, desde la semana 2), al azar
y con rarezas: comunes los ocho tripulantes, raros los Ecos, NEBULA y
el Capitán, épicos el Recluta y la Estática, y <b>LEGENDARIOS el General Vaeon</b> (2 % del sobre) y sobre todo
<b>Ander Vaeon</b>, la carta de la identidad del villano: <b>1 de cada 100</b>, la más difícil del juego.
Pulsa cualquiera para ampliar.</p>
{cards_series_html}
</div></section>

<section id="bit"><div class="wrap">
<div class="eyebrow">El corazón del sistema</div><h2>La Bitácora = el ePortfolio</h2>
<p class="lead">Todo converge en la Bitácora. Se presenta en la <b>semana 1</b> (vídeo «La Bitácora»), se enseña formalmente
en el <b>Tema 5</b> y se va llenando durante todo el viaje. Cada página se escribe con el mismo pulso:</p>
<div class="flow" style="margin:0 0 1.4em">
<span class="node">Evidencia</span><span class="ar">→</span><span class="node">Contexto</span><span class="ar">→</span>
<span class="node">Reflexión</span><span class="ar">→</span><span class="node">Autoevaluación</span></div>
<div class="grid cols-2">
<div>{ytbox("bitacora","Semana 1 · presenta el ePortfolio al alumnado")}</div>
<div class="card"><h3>Qué recoge</h3><p><b>Actividad 1</b> (imagen con IA) · <b>Actividad 2</b> (paisaje de aprendizaje) · <b>tres retos</b> con evidencia + reflexión
(videotutorial, microgamificación y uno libre). Con la IA, verdad por delante: lo que la máquina aporta se cita; lo que uno decide, se defiende.</p>
<p><a href="actividades.html"><b>Requisitos oficiales y evaluación →</b></a></p></div>
</div>
</div></section>

<section id="retos"><div class="wrap">
<div class="eyebrow">Retos e insignias</div><h2>Dos retos por tema</h2>
<div class="grid cols-2">
<div class="card"><h3>Reto A — «La Llave» 🗝️</h3><p>Micro-tarea reflexiva o de comunidad (10–20 min) que encarna la
lección del personaje. <b>No cuenta para nota</b> (da 100 xp simbólicos del juego): su recompensa es
<b>desbloquear al personaje</b> (fragmento + insignia). Es el motor de <b>motivación e identidad</b>.</p></div>
<div class="card"><h3>Reto B — «La Forja» 🔨</h3><p>Tarea de creación con criterios claros que produce una <b>evidencia
real</b> de la Bitácora y es un <b>trozo digerible</b> de la siguiente actividad grande. Su recompensa es la
<b>insignia de reto</b>. Es el motor de <b>producción</b>.</p></div>
</div>
<div class="card" style="margin-top:22px"><div class="eyebrow amber">La decisión de diseño que más se nota</div>
<h3>Dos marcadores: xp para el nivel, créditos ◈ para el bolsillo</h3>
<p>Un error clásico al gamificar es usar <b>un solo contador</b> para medir el progreso y para pagar las
recompensas: en cuanto el alumno compra algo, «retrocede» — y castigar la compra mata la tienda. Aquí van
separados, y conviene explicarlo en clase porque <b>es el contenido del Tema 7 en vivo</b>:</p>
<div class="grid cols-2" style="gap:14px">
<div class="card"><h3>⭐ xp — el viaje</h3><p class="small">Solo suben, <b>nunca se gastan</b>. Dan el
<b>nivel</b> (1 a 10), el puesto en el ranking y hacen <b>evolucionar al personaje</b> (5 versiones de arte,
en los niveles 3, 5, 8 y 10). Reto A 100 · Reto B 250 · Actividad 500 · Batalla 500 · hitos 300.</p></div>
<div class="card"><h3>◈ créditos — el bolsillo</h3><p class="small">Se ganan con el mismo trabajo
(Reto A {CREDITOS['retoA']} · Reto B {CREDITOS['retoB']} · Actividad {CREDITOS['actividad']} · hitos {CREDITOS['derivada']}) y son <b>lo único que se descuenta</b> en el canje.
El viaje completo da <b>{CRED_VIAJE['REGULAR']} ◈</b> y todo lo cosmético cuesta 280: <b>hay que elegir</b>.</p></div>
</div>
<p class="small muted" style="margin-top:10px">Tabla completa de niveles y precios en
<a href="registro.html#economia">Registro → Dos marcadores</a>.</p></div>

<h3 style="margin-top:1.8em">Las 8 insignias de reto</h3>
<p class="lead">Solo imagen, sin texto. Su icono refleja la tarea. Pulsa para ver qué hay que hacer.</p>
<div class="badges">{reto_html}</div>
<h3 style="margin-top:1.8em">Las 5 insignias de hito</h3>
<div class="badges sm5">{hito_html}</div>
<table style="margin-top:1.4em"><thead><tr><th>Tema</th><th>Reto B produce…</th><th>…que es un trozo de</th></tr></thead><tbody>
<tr><td>T1 Fôrge</td><td>La imagen con IA + tabla técnica del prompt</td><td><b>Actividad 1</b></td></tr>
<tr><td>T2 Ecos</td><td>Un videotutorial + videoquiz</td><td>Bitácora (reto videotutorial)</td></tr>
<tr><td>T3 Sendara</td><td>La matriz 8×6 con ≥6 cruces</td><td><b>Actividad 2</b></td></tr>
<tr><td>T4 Reliae</td><td>El entorno digital de aula</td><td>Bitácora (evidencia)</td></tr>
<tr><td>T5 Umbral</td><td>Rúbrica + estructura del ePortfolio (+ cierre Act 1)</td><td><b>Consolida la Bitácora</b></td></tr>
<tr><td>T6 Ludo</td><td>Un juego digital educativo</td><td>Bitácora (reto juego)</td></tr>
<tr><td>T7 Vínculo</td><td>Una microgamificación</td><td>Bitácora (reto microgamificación)</td></tr>
<tr><td>T8 Liminar</td><td>Experiencia RA/RV + <b>publicar la Bitácora</b> (+ cierre Act 2)</td><td><b>Cierra la Bitácora</b></td></tr>
</tbody></table>
</div></section>

<section id="din"><div class="wrap">
<div class="eyebrow">Lo práctico</div><h2>Una clase en directo, paso a paso</h2>
<!-- 🔴 REORIENTADO. Norberto sobre «¿Cómo se hace?»: «es un poco raro, creo que deberíamos
     cambiarlo por cómo sería una clase en directo. Enseñar a lanzar el panel, lo que muestra el
     panel, la importancia de celebrar logros de estudiantes y darles visibilidad». Tenía razón:
     lo que había mezclaba la instalación del referente con la rutina de quien da clase, y quien
     busca esto está a diez minutos de entrar al aula. -->
<p class="lead">Lo que haces de verdad los cuarenta minutos que empiezan cuando se sientan. Cuatro
pasos, y los tres primeros suman menos de cinco minutos.</p>
<div class="grid cols-2 clase-viva">
<div class="card"><span class="cv-n">1</span><h3>Proyecta la sesión</h3>
<p>Abre <b>Proyectar la clase</b> desde tus grupos. Trae en orden: dónde estáis, <b>a quién
felicitar esta semana</b> —con nombre—, el ranking, la misión más hecha, lo que os dijeron en el
ticket y una invitación concreta. Termina con el Genially del grupo, y ahí empieza la clase.</p>
<p class="small muted">También se incrusta en tu Genially: el mismo enlace vale para todos tus
grupos, porque sabe quién eres.</p></div>

<div class="card"><span class="cv-n">2</span><h3>Toca llamada a filas</h3>
<p>Un botón. Se abre el fichaje y en la Nave de tu gente aparece <b>✋ Presente</b>: unos créditos
por estar, y tú ves quién llega en directo desde <b>el aula</b>.</p>
<p class="small muted">No es un control de asistencia fiable y no pretende serlo — quien está puede
avisar a quien no. Ábrelo con la clase empezada y déjalo poco rato.</p></div>

<div class="card"><span class="cv-n">3</span><h3>Nombra a quien ha hecho algo</h3>
<p><b>Esto es lo único que no hace el sistema por ti, y es lo que más cambia una clase.</b> Los
puntos los da el motor; la ceremonia la haces tú. Di el alias en voz alta, enseña la insignia que
acaba de caer, pregunta cómo lo hizo. Treinta segundos.</p>
<p class="small muted">En <b>Premiar</b> puedes dar xp o créditos a mano, regalar un cromo o sacar
un estudiante al azar.</p></div>

<div class="card"><span class="cv-n">4</span><h3>Ponte en su lugar una vez</h3>
<p>Antes de la primera sesión, abre la Nave como si fueras alumno. Diez minutos entendiendo lo que
ven ellos ahorran media hora de dudas en clase.</p>
<p style="margin-top:12px"><a class="btn primary" href="recluta.html?per=demo-motor&amp;demo=1" target="_blank" rel="noopener">🚀 Probar la Nave como estudiante ↗</a></p>
<p class="small muted">Es un recluta de mentira en un grupo de pruebas: toca lo que quieras, no se
guarda nada.</p></div>
</div>

<h3 style="margin-top:34px">Y el resto de la rutina</h3>
<div class="tips">
<div class="tip"><b>Empieza con el gancho, no con el temario.</b> Primera sesión: vídeo de sinopsis, preséntate como <b>Capitán</b>, reparte la insignia de <b>Reclutamiento</b> y deja una pregunta en el aire.</div>
<div class="tip"><b>Un mensaje por semana para el foro de la plataforma de UNIR</b> (ya redactados, en la <a href="cronologia.html">cronología</a>): introducen el tema con la narrativa y cierran con la "Bitácora de esta semana". Solo pon tu nombre y el enlace de la herramienta del momento.</div>
<div class="tip"><b>Separa los dos retos en tu discurso.</b> El Reto A como <i>invitación</i> ("recupera a Bran"); el Reto B como <i>encargo</i> con criterios.</div>
<div class="tip"><b>Entrega las insignias en público.</b> El refuerzo funciona cuando se ve: publica el medallón y nombra el logro con la frase del personaje. Un tablero con las 24 hace visible el avance.</div>
<div class="tip"><b>Vincula siempre reto → Bitácora.</b> Cada Reto B <i>ya es</i> una página del ePortfolio (y a veces media actividad grande resuelta). Así no acumulan tareas: construyen.</div>
<div class="tip"><b>Usa la distinción Ludo/Vínculo como momento estrella.</b> En T6 <b>se juega</b> (el juego ES la actividad); en T7 <b>no</b> (se toman elementos del juego). Apóyate en Joran y Mara.</div>
<div class="tip"><b>Reserva a Vaeon para subir la tensión.</b> Haz que la Estática aparezca en T5: justo cuando saben medir, surge el enemigo que silencia.</div>
<div class="tip"><b>Cierra con La Liberación.</b> En el repaso final, la Bitácora completa vence a la Estática y abre la puerta a la Tierra. Celebra las Bitácoras publicadas.</div>
<div class="tip"><b>Lo atemporal en los vídeos, lo actual en el foro.</b> Los vídeos hablan solo de conceptos (no nombran apps); las herramientas concretas viven en el foro de la plataforma de UNIR.</div>
</div>
<blockquote>Errores a evitar: convertir el Reto A en nota · dar insignias sin ceremonia · meter nombres de apps en los vídeos · pedir solo entregables sin la capa narrativa · confundir ABJ y Gamificación delante del alumnado.</blockquote>
</div></section>

<!-- 🔴 LOS ENLACES DE INTERÉS, en la guía. «En la guía deben aparecer los enlaces de interés,
     RECURSOS audiovisuales y carpeta de Geniallys» (Norberto). Antes estaban repartidos entre una
     página de Recursos y otra de Geniallys —esta última ya eliminada por enseñar ocho huecos
     vacíos—. Aquí es donde alguien los busca: en el documento que explica el método. -->
<section id="enlaces"><div class="wrap">
<div class="eyebrow teal">Material</div><h2>Los enlaces de interés</h2>
<p class="lead">Todo lo que no vive en esta web. Si alguno te pide permiso, pídeselo a tu profe
referente: son carpetas compartidas con el equipo docente, no públicas.</p>
<div class="grid cols-3">
<a class="card enl" href="{GENIALLY_CARPETA}" target="_blank" rel="noopener">
  <span class="enl-ico">🪐</span><h3>Carpeta de Geniallys</h3>
  <p>Los Geniallys de los ocho planetas y el panel de control. Usa los estándar tal cual; si quieres
  el tuyo, duplica uno y pégalo en <b>Puesto de mando → Mis enlaces</b>.</p></a>
<a class="card enl" href="recursos.html">
  <span class="enl-ico">📦</span><h3>Recursos audiovisuales</h3>
  <p>Los 17 vídeos de la serie, las 24 insignias, los cromos y las láminas. Para proyectar, para el
  aula virtual o para tus propios materiales.</p></a>
<a class="card enl" href="cronologia.html">
  <span class="enl-ico">🗓️</span><h3>La cronología</h3>
  <p>Semana a semana: qué vídeo toca, qué reto se lanza, qué insignia se entrega y el mensaje del
  foro ya escrito.</p></a>
<!-- 🔴 `pasos.html` se quedó huérfana al sacarla del menú: nadie la enlazaba y una página que no
     enlaza nadie no existe. Aquí es donde tiene sentido — es material de consulta, no una sección
     del menú diario. -->
<a class="card enl" href="pasos.html">
  <span class="enl-ico">🧭</span><h3>Montarlo paso a paso</h3>
  <p>El recorrido completo con capturas: crear un grupo, repartir el enlace, la primera sesión.
  Se consulta una vez y casi no se vuelve.</p></a>
</div>
</div></section>

<section id="faq"><div class="wrap">
<div class="eyebrow teal">Dudas de docentes (nuevos y veteranos)</div><h2>Preguntas frecuentes</h2>
{faq_html}
</div></section>
''' + FOOT

# ================= ACTIVIDADES Y EVALUACIÓN =================
DOCS = [
 ("Actividad_1_imagen_IA.docx","Enunciado · Actividad 1","Actividad didáctica a partir de una imagen generada con IA"),
 ("Actividad_2_paisaje_de_aprendizaje.docx","Enunciado · Actividad 2","Planifica y crea un paisaje de aprendizaje"),
 ("Pautas_ePortfolio.docx","Pautas del ePortfolio","Cómo recoger evidencias y reflexión (5 pasos, estructura por página)"),
 ("Instrucciones_uso_IA.docx","Instrucciones de uso de la IA","Rúbrica de 6 criterios, hasta el 20 % de la nota"),
 ("Rubrica_Actividad_1.xlsx","Rúbrica · Actividad 1","7 criterios con niveles y feedback"),
 ("Rubrica_Actividad_2_ePortfolio.xlsx","Rúbrica · Actividad 2 + ePortfolio","Contextualización, matriz, actividades, paisaje, ePortfolio"),
 ("Planificacion_semanal.pdf","Planificación semanal oficial","16 semanas (las fechas del PDF son un marcador; manda la semana)"),
 ("Plantilla_Creacion_de_Contenidos.docx","Plantilla de entrega","Plantilla oficial para las entregas en PDF"),
 ("Ejemplo_examen.pdf","Ejemplo de examen","Para preparar el simulacro de la semana 15"),
 ("Ejemplo_ePortfolio_alumnado.pdf","Ejemplo de ePortfolio","Informe real de un grupo, como referencia de nivel (16 MB)"),
]
# 🔴 9-sep · TRES DOCUMENTOS RESERVADOS. El ejemplo de examen y las dos rubricas viven en una
# subcarpeta con nombre derivado del contenido (`_docs_reservados.txt`, lo genera el propio build):
# su URL deja de ser adivinable y los buscadores no la alcanzan. NO es proteccion de verdad —quien
# tenga el enlace se lo baja igual— pero suma a que la pagina ya pide PIN. Lo unico que reserva un
# documento de verdad es no tenerlo en un servidor publico.
_RESERVADOS = {"Ejemplo_examen.pdf", "Rubrica_Actividad_1.xlsx", "Rubrica_Actividad_2_ePortfolio.xlsx"}
_SUB = open(os.path.join(HERE, "_docs_reservados.txt")).read().strip()
def doc_url(f): return "assets/docs/%s%s" % ((_SUB + "/") if f in _RESERVADOS else "", f)
docs_html="\n".join(f'<a class="doc" href="{doc_url(f)}" download><span class="ext">{f.rsplit(".",1)[1].upper()}</span><b>{t}</b><em>{d}</em></a>' for f,t,d in DOCS)

ACT = head("STARGATE · Actividades y evaluación",
  "Las misiones (actividades), el ePortfolio, la evaluación, el examen y los documentos oficiales de la asignatura con su marco narrativo STARGATE.","act", puerta=True) + f'''
<header class="hero"><div class="kicker">Documentos oficiales</div>
<h1>Misiones y evaluación</h1>
<p>Las dos actividades mayores, el ePortfolio (la Bitácora), cómo se evalúa la asignatura y el examen —con su
marco narrativo STARGATE—. Los requisitos provienen de los enunciados y la guía oficiales (programación nueva).</p>
</header>

<section><div class="wrap">
<div class="eyebrow">Cómo se evalúa</div><h2>La evaluación continua (sobre 10)</h2>
<div class="grid cols-3" style="margin-top:14px">
<div class="card"><h3>Actividades mayores</h3><p><b>Actividad 1</b> — imagen con IA: <span class="pts">4,3</span><br><b>Actividad 2</b> — paisaje de aprendizaje: <span class="pts">4,3</span><br><small>En cada una: PDF 80 % + ePortfolio 20 %.</small></p></div>
<div class="card"><h3>Tests de tema</h3><p>Un test por tema (T1–T8). <span class="pts">0,1</span> cada uno (0,8 en total). Preparan para el examen.</p></div>
<div class="card"><h3>Asistencia en directo</h3><p>Asistencia a <b>3 clases en directo</b> a lo largo del curso. <span class="pts">0,2</span> cada una (0,6 en total).</p></div>
</div>
<div class="official">📋 Oficial · 4,3 + 4,3 + 0,8 + 0,6 = <b>10 puntos</b> de evaluación continua. La Actividad 3 de programaciones anteriores <b>ya no existe</b>.</div>
<blockquote>En STARGATE cada elemento tiene su nombre: las actividades son <b>misiones mayores</b>, los tests son
<b>controles de sistemas</b>, las clases en directo son <b>sesiones de mando</b> y las experiencias del portfolio
son <b>páginas de la Bitácora</b>. La nota mide tu avance; la Bitácora es lo que te llevas a casa.</blockquote>
</div></section>

<section id="act1"><div class="wrap">
<div class="eyebrow amber">Misión mayor I · Planeta Fôrge · semana 2 (se resuelve en la 9)</div><h2>Actividad 1 — Actividad didáctica a partir de una imagen con IA</h2>
<p class="lead"><i>«La primera chispa.»</i> El recluta diseña una actividad para su aula a partir de una imagen creada con IA,
documentando el proceso con criterio docente. <span class="pill amber">4,3 puntos</span></p>
<div class="yt-full">{ytbox("act1","El enunciado narrativo: ponlo al lanzar la actividad")}</div>
<h3>El enunciado, paso a paso (lo que entrega el alumnado)</h3>
<div class="steps">
<div class="step"><b>Planifica</b> <span class="tag-req">obligatorio</span><br>Define el alumnado, el tema del aula y la tarea que harán con la imagen.</div>
<div class="step"><b>Crea la imagen con IA</b> <span class="tag-req">iteración</span><br>Prompt estructurado (contexto educativo + tipo de imagen + finalidad, modelo tipo CRAFT/RITA), <b>al menos una iteración</b>, y selección final con <b>tu criterio docente</b>. Cita la herramienta y respeta derechos de autor.</div>
<div class="step"><b>Tabla técnica</b><br>Documenta función de la IA, prompt inicial, iteración, criterio docente, evidencia del proceso (enlace o capturas) y citación.</div>
<div class="step"><b>Tabla reflexiva</b> <span class="tag-req">ePortfolio</span><br>Reflexión crítica: cómo integraste la IA, cómo transformó la actividad, qué pusiste tú y qué aprendiste.</div>
<div class="step"><b>Entregables</b><br><b>PDF (80%)</b>, máx. 4 páginas, con planificación, actividad, referencia a la IA, capturas de las tablas y el enlace al ePortfolio. <b>ePortfolio (20%)</b> con la imagen, la tarea, las tablas completas y la evidencia del proceso.</div>
</div>
</div></section>

<section id="act2"><div class="wrap">
<div class="eyebrow amber">Misión mayor II · Planeta Sendara · semana 6 (se resuelve en la 13)</div><h2>Actividad 2 — Planifica y crea un paisaje de aprendizaje</h2>
<p class="lead"><i>«Cuarenta y ocho senderos.»</i> Ante un aula con ritmos muy dispares, el recluta diseña un paisaje de
aprendizaje que atiende a la diversidad: no hay una sola ruta. <span class="pill amber">4,3 puntos</span></p>
<div class="yt-full">{ytbox("act2","El enunciado narrativo: ponlo al lanzar la actividad")}</div>
<h3>El enunciado, paso a paso (lo que entrega el alumnado)</h3>
<div class="steps">
<div class="step"><b>Contextualiza</b><br>Describe una unidad didáctica real de tu nivel: edad, área, tema y elementos curriculares (objetivos, contenidos, criterios de evaluación).</div>
<div class="step"><b>Matriz de programación 8×6</b> <span class="tag-req">núcleo</span><br>Tabla de doble entrada: <b>8 inteligencias múltiples × 6 niveles de Bloom</b> = 48 casillas. Rellena <b>al menos 6 cruces</b> variados en complejidad y en talento, con una actividad en cada uno.</div>
<div class="step"><b>Cada actividad, completa</b><br>Objetivo, tarea del alumno, recursos (con cita/enlace), instrumentos de evaluación, tiempo estimado y tipo: obligatoria, optativa o voluntaria.</div>
<div class="step"><b>El paisaje interactivo</b><br>Convierte una <b>imagen interactiva</b> (no una presentación) en el paisaje, con las actividades integradas dentro del territorio.</div>
<div class="step"><b>Entregables</b><br><b>PDF (80%)</b> (máx. 10 páginas para 6 actividades, +1 por actividad extra) con planificación y matriz. <b>ePortfolio (20%)</b>: evidencias de matriz y paisaje (15%) + justificación del diseño y atención a la diversidad (5%).</div>
</div>
</div></section>

<section id="eportfolio"><div class="wrap">
<div class="eyebrow teal">La Bitácora</div><h2>El ePortfolio, página a página</h2>
<p class="lead">El ePortfolio es la Bitácora: recoge, con el patrón <b>evidencia → contexto → reflexión →
autoevaluación</b>, las dos actividades y tres retos (videotutorial, microgamificación y uno libre). Plataforma libre; un único enlace de acceso en cada entrega. Estas son las
<b>experiencias del portfolio</b> que propone la programación oficial, tema a tema:</p>
<table><thead><tr><th>Tema</th><th>Experiencia en el portfolio (oficial)</th><th>En STARGATE</th></tr></thead><tbody>
<tr><td>T1 · Fôrge</td><td>Recursos multimedia didácticos generados con ayuda de la IA</td><td>Reto B «La chispa»</td></tr>
<tr><td>T2 · Ecos</td><td>Enriquecer el videotutorial con preguntas (videoquiz)</td><td>Reto B «El eco que enseña»</td></tr>
<tr><td>T4 · Reliae</td><td>Entorno digital para el aula (p. ej. Site/Classroom)</td><td>Reto B «El entorno de aula»</td></tr>
<tr><td>T5 · Umbral</td><td>Registrar el progreso (p. ej. formularios) + e-portfolio</td><td>Reto B «La Bitácora medida»</td></tr>
<tr><td>T6 · Ludo</td><td>Diseño de un juego digital educativo</td><td>Reto B «El juego»</td></tr>
<tr><td>T7 · Vínculo</td><td>Recursos de gamificación: cartas de recompensa, insignias o narrativas</td><td>Reto B «La microgamificación»</td></tr>
</tbody></table>
<div class="official" style="margin-top:14px">💡 La experiencia del <b>Tema 7</b> es, literalmente, crear <b>cartas, insignias o narrativas</b>: STARGATE es el ejemplo vivo de esa entrega.</div>
</div></section>

<section id="examen"><div class="wrap">
<div class="eyebrow">El salto final</div><h2>El examen: la batalla ES el examen</h2>
<p class="lead">La evaluación continua se complementa con un <b>examen final</b> en la semana de exámenes. En STARGATE
es <b>la batalla final contra la Estática</b>: el Capitán la presenta en el vídeo <b>Plan de Ataque</b> (semana 15): un caso único,
plataforma en directo, tablero de retos, reglas de ortografía, enlaces públicos, capturas y tiempo. NEBULA no puede entrar: el recluta va solo.</p>
<div class="yt-full">{ytbox("plan","Semana 15 · antes del simulacro")}</div>
<div class="grid cols-3">
<div class="card"><h3>Preparación</h3><p>Los <b>tests de cada tema</b> fijan los conceptos y entrenan para el examen.</p></div>
<div class="card"><h3>Repaso + simulacro</h3><p>Semana 15: <b>repaso</b> y <b>simulacro</b> (hay un <a href="{doc_url('Ejemplo_examen.pdf')}">ejemplo de examen</a>).</p></div>
<div class="card"><h3>Examen final</h3><p>Semana 16 (semana de exámenes). Formato y fechas exactas: aula virtual.</p></div>
</div>
</div></section>

<section id="docs"><div class="wrap">
<div class="eyebrow amber">Descargas</div><h2>Documentos oficiales (programación nueva)</h2>
<p class="lead">Los enunciados, pautas y rúbricas vigentes. Descárgalos desde aquí; son los mismos que en el aula virtual.</p>
<div class="docs">{docs_html}</div>
<div class="official" style="margin-top:16px">📚 <b>Temario (PDF de los temas):</b> los disponibles son de la programación anterior y con nombres bailados; no se publican hasta recibir el temario actualizado.</div>
</div></section>
''' + FOOT

# ================= SALA DE RECURSOS (tablero + ranking + materiales) =================
if PLANTILLA_EPORTFOLIO:
    plantilla_ep_html = (f'<span class="chip ok">Disponible</span>'
        f'<p>Plantilla lista para que el alumnado la <b>reutilice</b> como base de su Bitácora: estructura por página '
        f'(evidencia → contexto → reflexión → autoevaluación) con la estética STARGATE.</p>'
        f'<div class="responsive-embed"><iframe src="{PLANTILLA_EPORTFOLIO}" allowfullscreen scrolling="no" loading="lazy"></iframe></div>'
        f'<a class="btn" href="{PLANTILLA_EPORTFOLIO}" target="_blank" rel="noopener">Abrir la plantilla en Genially ↗</a>')
else:
    plantilla_ep_html = ('<span class="chip wip">Pendiente de enlace</span>'
        '<p>Plantilla de Genially para que el alumnado la reutilice como base de su Bitácora. '
        'El enlace se añadirá aquí en cuanto esté publicado.</p>')

REC = head("STARGATE · Sala de recursos",
  "Tablero de las 24 insignias, ranking de reclutas y materiales del proyecto STARGATE.","rec", puerta=True) + f'''
<header class="hero"><div class="kicker">Sala de recursos</div>
<h1>Sala de recursos</h1>
<p>El tablero de las 24 insignias, las cartas y los materiales gráficos. Los vídeos viven en la
<a href="cronologia.html">cronología</a>.</p>
</header>

<section><div class="wrap">
<div class="eyebrow teal">Colección</div><h2>Tablero de insignias</h2>
<p class="lead">Las 24 insignias que se pueden desbloquear. Pulsa cualquiera para ver cómo se gana.</p>
<h3>Personajes de la Tripulación Cero</h3><div class="badges">{pers_html}</div>
<h3 style="margin-top:1.6em">Especiales</h3><div class="badges">{esp_html}</div>
<h3 style="margin-top:1.6em">Retos</h3><div class="badges">{reto_html}</div>
<h3 style="margin-top:1.6em">Hitos</h3><div class="badges sm5">{hito_html}</div>
<h3 style="margin-top:1.6em">Cartas</h3><div class="cards-row">{cards_html}</div>
</div></section>

<section><div class="wrap">
<div class="eyebrow amber">Clasificación</div><h2>Ranking de reclutas (xp)</h2>
<p class="lead">El marcador de la misión vive en el <b>tablero de cada grupo</b>: se alimenta solo de lo que cada
recluta marca en su Nave (insignias, xp, rangos y avatares). Tu alumnado lo ve en su Nave, pestaña <b>Rankings</b>;
para proyectarlo, Mis grupos → Ver mi gente y los ajustes → <b>Mis enlaces</b>.</p>
<div class="cta-row"><a class="btn primary" href="registro.html#tablero">Cómo funciona el tablero →</a><a class="btn" href="consola.html">Ir a Mis grupos</a></div>
</div></section>

<section id="plantilla-eportfolio"><div class="wrap">
<div class="eyebrow teal">La Bitácora</div><h2>Plantilla del ePortfolio</h2>
<div class="grid cols-2">
<div class="card"><h3>🪐 Plantilla Genially de la Bitácora</h3>{plantilla_ep_html}</div>
<div class="card"><h3>📘 Pautas oficiales</h3><p>Cómo se recoge cada evidencia y su reflexión (5 pasos, estructura por página):
<a href="assets/docs/Pautas_ePortfolio.docx" download><b>Pautas del ePortfolio (DOCX)</b></a>.
Como referencia de nivel, el <a href="assets/docs/Ejemplo_ePortfolio_alumnado.pdf">ejemplo real de un grupo (PDF)</a>.
El resto de documentos oficiales están en <a href="actividades.html#docs">Actividades → Descargas</a>.</p></div>
</div>
</div></section>

<section><div class="wrap">
<div class="eyebrow">Materiales</div><h2>Dónde está el material gráfico</h2>
<div class="grid cols-2">
<div class="card"><h3>Para montar Geniallys</h3><p>Fondos por planeta, clips de ambiente, personajes recortados, HUD, botones e iconos ya recortados, insignias y cartas: todo está en el paquete del equipo en Drive (carpeta <b>DRIVE_EQUIPO_STARGATE</b>, clasificado por tipo, con el documento «Qué va en cada Genially»). Novedades del paquete: los <b>planetas girando</b> en GIF/WebP sin fondo, sus <b>auras para el efecto latido</b>, el <b>fondo de universo en bucle</b> y un <b>pack de audio</b> (música ambiental + efectos de interfaz).</p></div>
<div class="card"><h3>Vídeos</h3><p>Los 33 vídeos de la serie en la playlist de YouTube: <a href="{PLAYLIST}" target="_blank" rel="noopener">STARGATE · La Bitácora Estelar ↗</a>. Cuándo usar cada uno: <a href="cronologia.html">cronología</a>.</p></div>
</div>
</div></section>
''' + FOOT

# ================= CRONOLOGÍA =================
FORO = foro_por_semana()
BADGE_NAME = {k:t for k,t,*_ in PERS+ESP+RETO+HITO}
# 🔴 Las 24 insignias EN ORDEN. Vivia mucho mas abajo, junto a la Nave, porque solo la Nave las
# pintaba. Ahora la ficha del alumno en la sala del docente enseña el catalogo COMPLETO —lo que
# tiene iluminado y lo que le falta apagado— y necesita la lista antes de generar clase.html.
NAVE_BADGES = [k for k,*_ in PERS]+[k for k,*_ in ESP]+[k for k,*_ in RETO]+[k for k,*_ in HITO]

def mini_badges(keys):
    if not keys: return '<span class="muted">— ninguna esta semana —</span>'
    return "".join(f'<figure class="mini badge" data-key="{k}" title="{BADGE_NAME.get(k,k)}"><img loading="lazy" src="assets/img/insignias/{k}.png" alt="{BADGE_NAME.get(k,k)}"><figcaption>{BADGE_NAME.get(k,k)}</figcaption></figure>' for k in keys)

def semana_card(s):
    sem = s["sem"]
    vids = "".join(f'<div class="yt-item">{ytbox(c, cuando)}</div>' for c, cuando in s["videos"])
    lanza = "".join(f"<li>{x}</li>" for x in s["lanza"]) or "<li class='muted'>— no se lanza nada nuevo: se cierran los retos abiertos —</li>"
    foro = FORO.get(sem, "")
    cap = f'<span class="pill amber">Nuevo capítulo: {s["capitulo"]}</span>' if s.get("capitulo") else ""
    return f'''<details class="semana" id="sem{sem}">
<summary><span class="num">Semana {sem}</span><span class="ttl"><b>{s["tema"]}</b><em>{s["sub"]}</em></span><span class="meta">{s["clases"]}</span></summary>
<div class="sem-body">
{cap}
<div class="sem-grid">
<div class="col">
<h4>🎬 Vídeos que se proyectan</h4>
<div class="yt-list">{vids}</div>
</div>
<div class="col">
<h4>🗝️ Retos que se lanzan</h4><ul>{lanza}</ul>
<h4>🏅 Insignias que se entregan</h4><div class="minis">{mini_badges(s["insignias"])}</div>
<h4>📌 Hitos de la semana</h4><p>{s["hito"]}</p>
<div class="consejo"><img src="assets/img/capitan/senala.png" alt=""><div><b>Consejo del Capitán</b><br>{s["consejo"]}</div></div>
</div>
</div>
<details class="foro"><summary>💬 Mensaje del foro dinamizador (listo para copiar)</summary>
<div class="foro-box"><button class="copy" type="button" data-copy="foro{sem}">Copiar texto</button><pre id="foro{sem}">{foro}</pre>
<small>La firma es siempre «Capitán», a secas (sin tu nombre). Revisa las herramientas citadas (son ejemplos, cambian cada curso) y, donde aparezca el enlace del tablero, usa el de tu PER.</small></div>
</details>
</div></details>'''

semanas_html = "\n".join(semana_card(s) for s in CRONO)

# tabla-mapa global
SHORT = {"sinopsis":"Sinopsis","bitacora":"Misión Bitácora","act1":"Misión Act. 1","act2":"Misión Act. 2",
 "plan":"Plan de Ataque","finale":"FINALE","f9":"F9 Vaeon (epílogo)"}
for _i in range(1,9):
    SHORT[f"t{_i}i"]=f"T{_i} intro"; SHORT[f"t{_i}c"]=f"T{_i} cierre"
for _i,_n in enumerate(["Bran","Tomás","Sylla","Amara","Vera","Joran","Mara","Noa"],1):
    SHORT[f"f{_i}"]=f"F{_i} {_n}"
def fila_mapa(s):
    vids = " · ".join(SHORT.get(c, V[c][1]) for c,_ in s["videos"])
    ins = " ".join(f'<img class="dot" src="assets/img/insignias/{k}.png" title="{BADGE_NAME.get(k,k)}" alt="">' for k in s["insignias"]) or "—"
    return f'<tr><td><a href="#sem{s["sem"]}"><b>S{s["sem"]}</b></a></td><td>{s["tema"]}<br><small>{s["sub"]}</small></td><td>{vids}</td><td>{ins}</td><td>{s["hito"]}</td></tr>'
mapa_html = "\n".join(fila_mapa(s) for s in CRONO)

CRONOLOGIA = head("STARGATE · Cronología semana a semana",
  "Qué vídeo proyectar, qué reto lanzar, qué insignia entregar y el mensaje del foro de cada semana del curso STARGATE.","crono", puerta=True) + f'''
<header class="hero"><div class="kicker">Carta de navegación</div>
<h1>Cronología</h1>
<p>Las <b>15 semanas</b> del curso, sin fechas (cambian cada convocatoria): qué vídeo se proyecta, qué reto se lanza, qué
insignia se entrega, el hito de evaluación y el mensaje para el foro de la plataforma de UNIR, listo para copiar. Después viene la semana 16: el examen.</p>
<p style="margin-top:14px"><span class="pill">Antes de empezar: los tráilers son promoción, no aula</span><span class="pill">El Opening puede abrir cada clase</span></p>
</header>

<section id="mapa"><div class="wrap">
<div class="eyebrow teal">Visión global</div><h2>El mapa del viaje</h2>
<div class="tablewrap"><table class="mapa"><thead><tr><th>Sem</th><th>Tema · planeta</th><th>Vídeos</th><th>Insignias</th><th>Hito</th></tr></thead>
<tbody>{mapa_html}</tbody></table></div>
<p class="lead" style="margin-top:12px">Regla de oro: la <b>intro</b> del planeta al abrir el tema · el <b>cierre</b> al terminar el bloque · el <b>fragmento</b> justo después, como recompensa · las <b>misiones</b> al lanzar cada actividad.</p>
</div></section>

<section id="antes"><div class="wrap">
<div class="eyebrow amber">Antes de la semana 1</div><h2>Piezas de arranque</h2>
<div class="yt-list three">
<div class="yt-item">{ytbox("trailer","Promoción: compártelo en el aula virtual antes de empezar")}</div>
<div class="yt-item">{ytbox("teaser","Teaser corto de la Bitácora")}</div>
<div class="yt-item">{ytbox("opening","Cabecera de 1 minuto, sin voz: para abrir cada clase")}</div>
</div>
</div></section>

<section id="semanas"><div class="wrap">
<div class="eyebrow">Semana a semana</div><h2>La orden del día</h2>
<p class="lead">Despliega cada semana. Los vídeos se reproducen aquí mismo; el enlace de cada uno sirve para insertarlo en Genially o en el aula virtual.
¿Solo quieres los mensajes del foro? Están <a href="foro.html?todos=1"><b>todos juntos en una página</b></a>, listos para copiar.</p>
<div class="semanas">{semanas_html}</div>
</div></section>
''' + FOOT

# ================= GENIALLYS (sección preparada) =================
def gen_slot(i, g):
    if g["view"]:
        emb = f'<div class="responsive-embed"><iframe src="{g["view"]}" allowfullscreen scrolling="no" loading="lazy"></iframe></div><a class="btn" href="{g["view"]}" target="_blank" rel="noopener">Abrir en Genially ↗</a>'
        chip = '<span class="chip ok">Publicado</span>'
    else:
        emb = ''
        chip = '<span class="chip wip">Pendiente de enlace</span>'
    return f'''<div class="gen" id="gen{i}"><img class="halo" src="assets/img/planetas/{PLANETAS[i-1][0]}.png" alt="">
<div class="gen-body"><div class="n">Tema {i}</div><h3>{g["nombre"]}</h3>{chip}
<p class="small">Vídeos del tema: <a href="cronologia.html#sem{ {1:1,2:3,3:5,4:7,5:9,6:10,7:11,8:13}[i] }">ver en la cronología</a></p>
{emb}</div></div>'''
gen_html = "\n".join(gen_slot(i, g) for i, g in GENIALLYS.items())

GENPAGE = head("STARGATE · Los Geniallys",
  "Los Geniallys de cada planeta del proyecto STARGATE: carpeta del equipo y enlaces por tema.","gen", puerta=True) + f'''
<header class="hero"><div class="kicker">Un Genially por planeta</div>
<h1>Los Geniallys</h1>
<p>La carpeta de Genially está <b>compartida con todo el profesorado</b>. Entra, busca la carpeta de tu
<b>perfil</b> y ahí tienes los <b>Geniallys estándar</b> de los ocho temas, listos para usar tal cual.</p>
<div class="cta-row"><a class="btn primary" href="{GENIALLY_CARPETA}" target="_blank" rel="noopener">Entrar en la carpeta compartida de Genially ↗</a></div>
<p class="small muted">Si no ves la carpeta, pide acceso al equipo. Los enlaces públicos de cada tema irán apareciendo abajo.</p>
</header>

<section><div class="wrap">
<div class="eyebrow amber">Antes de tocar nada</div><h2>Cómo usar la carpeta</h2>
<div class="grid cols-3">
<div class="card"><h3>1 · Entra y localiza tu perfil</h3><p>Dentro de la carpeta compartida hay una carpeta por <b>perfil</b>. En la tuya están los <b>Geniallys estándar</b> de los 8 planetas: puedes usarlos directamente en tus clases, sin montar nada.</p></div>
<div class="card"><h3>2 · ¿Quieres personalizarlo? Haz una copia</h3><p>Si quieres modificar un Genially, <b>duplícalo primero</b> y trabaja sobre tu copia. <b>No edites los estándar.</b></p></div>
<div class="card"><h3>3 · Ojo con el panel de control</h3><p>El <a href="panel.html"><b>panel de control</b></a> (el mapa de planetas que abre cada presentación) apunta a los <b>Geniallys estándar</b>. Si tu PER usa copias modificadas, el referente debe poner sus enlaces propios en <b>Panel de profes → Ajustes del PER</b>.</p></div>
</div>
</div></section>

<section id="lista"><div class="wrap">
<div class="eyebrow teal">Por planeta</div><h2>Los ocho Geniallys</h2>
<div class="gens">{gen_html}</div>
<div class="official" style="margin-top:18px">🧩 <b>Cómo se añade un Genially a esta página:</b> en Genially, <i>Compartir → Insertar</i> (o el enlace público de vista). Se pega en
<code>_site_data.py → GENIALLYS[n]["view"]</code> y se regenera la web; el hueco del tema pasa a «Publicado» con el Genially incrustado.</div>
</div></section>

<section><div class="wrap">
<div class="eyebrow amber">Para el equipo que los monta</div><h2>Qué lleva cada Genially</h2>
<div class="grid cols-2">
<div class="card"><h3>Estructura sugerida</h3><p>Portada con el fondo de espacio y el planeta-halo → <b>intro</b> (vídeo de llegada) → contenido del tema sobre los fondos de superficie → los <b>2 retos</b> → <b>cierre</b> (vídeo) → recompensa: el <b>fragmento</b> del tripulante + su insignia y carta.</p></div>
<div class="card"><h3>Material</h3><p>Todo está en el paquete <b>DRIVE_EQUIPO_STARGATE</b> (Drive): una carpeta por tema con fondos, clips, insignias, carta, retos y enlaces, más el documento «Qué va en cada Genially» con la miniatura de cada recurso. Los vídeos se insertan desde YouTube con el enlace de la <a href="cronologia.html">cronología</a>.</p></div>
</div>
</div></section>
''' + FOOT

# ================= REGISTRO DE INSIGNIAS =================
orden_html = "".join(f'<tr><td>S{s["sem"]}</td><td>{s["tema"]}</td><td><div class="minis">{mini_badges(s["insignias"])}</div></td></tr>' for s in CRONO if s["insignias"])

REGPAGE = head("STARGATE · Registro y tablero en vivo",
  "El sistema de autoregistro de STARGATE: el alumnado registra sus insignias, el tablero se actualiza solo y el profesorado anima y da la ceremonia.","reg", puerta=True) + f'''
<header class="hero"><div class="kicker">Registro y tablero en vivo</div>
<h1>Registro de insignias</h1>
<p>El registro es <b>automático</b>: cada estudiante marca sus propios retos desde <a href="recluta.html?per=demo-stargate&amp;demo=1">su Nave</a>
y los xp, los rangos y el <b>tablero</b> se calculan solos. Tu papel como docente no es apuntar nada:
es <b>animar</b> — entregar cada insignia en público, con ceremonia, y enseñar el tablero para que el avance se vea.</p>
<div class="cta-row"><a class="btn primary" href="#tablero">Ver el tablero en vivo</a><a class="btn" href="recursos.html">Ver las 24 insignias</a></div>
</header>

<section id="registro"><div class="wrap">
<div class="eyebrow teal">Tu papel: la ceremonia</div><h2>Cómo se entrega una insignia</h2>
<p class="lead">Una insignia que se otorga en silencio no motiva. La constancia queda sola (la registra el estudiante);
lo que no puede faltar es tu ceremonia:</p>
<div class="grid cols-3">
<div class="card"><h3>1 · En público</h3><p>Anuncia el medallón en clase o en el foro de la plataforma de UNIR en cuanto el recluta supera el reto. El refuerzo funciona cuando se ve.</p></div>
<div class="card"><h3>2 · Con su frase</h3><p>Nombra el logro con la frase del personaje («una imagen no tiene que ser perfecta, tiene que llegar a tiempo»). Pulsa cualquier insignia en la sala de recursos: la frase está en su ficha.</p></div>
<div class="card"><h3>3 · Y recuérdales registrarla</h3><p>El estudiante pulsa «Lo he hecho» en el reto, desde su Nave, y el tablero se actualiza al momento. Invítales a mirarlo: una obra que no se documenta, no existe.</p></div>
</div>
</div></section>

<section id="alumnado"><div class="wrap">
<div class="eyebrow amber">Cómo funciona para tu alumnado</div><h2>Así registran los estudiantes</h2>
<div class="grid cols-3">
<div class="card"><h3>1 · Su alistamiento</h3><p>Se hace <b>una sola vez</b>, con su cuenta de Google: nombre real, alias, Comandante, personaje y el enlace de su ePortfolio. A partir de ahí no vuelven a rellenar nada — marcan cada reto desde <a href="recluta.html">su Nave</a>.</p></div>
<div class="card"><h3>2 · Todo se calcula solo</h3><p>Los xp, las insignias, el planeta actual y el <b>avatar con rango</b> aparecen en el <a href="#tablero">tablero del grupo</a> al momento. Las insignias de hito (Tripulación Cero, La Liberación) se otorgan solas. Donde hay algo que entregar, el reto pide el <b>enlace</b> de la evidencia (y tú lo ves en «Mi gente»), y nadie registra más de <b>3 retos al día</b>.</p></div>
<div class="card"><h3>3 · Dónde lo ven</h3><p>En la <a href="recluta.html?per=demo-stargate&amp;demo=1"><b>Nave del Recluta</b></a> (el hub del alumnado, con su ficha, la orden semanal y las recompensas) y en el tablero, que se incrusta en el Genially del PER (o se comparte por enlace/QR desde el <a href="embed.html">generador de embeds</a>). Enséñalos en clase al entregar insignias.</p></div>
</div>
</div></section>

<section id="profe-herramientas"><div class="wrap">
<div class="eyebrow">También desde tu puesto</div><h2>Lo que usas cada semana</h2>
<div class="grid cols-2">
<div class="card"><h3>🛰️ El aula, dentro de tu Genially</h3><p>Tu puesto de mando <b>sin salir de la presentación</b>: tocas <b>llamada a filas</b> y ves quién ficha en directo, miras a quién felicitar por lo que ha hecho esta semana y a quién dar la bienvenida, consultas el ranking y repartes premios a mano — experiencia, créditos o una carta de regalo, incluso eligiendo a alguien al azar. Ábrelo con el botón <b>«El aula»</b> de tu grupo en <a href="consola.html">Mis grupos</a>, o incrústalo con <code>aula.html?embed=1</code>.</p>
<p class="small muted">🔴 Ese enlace <b>no lleva el grupo dentro</b>: se deduce de tu cuenta. Se monta una vez en todos tus Geniallys y no se toca más, ni al crear un grupo nuevo ni el curso que viene.</p></div>
<div class="card"><h3>🔔 Llamada a filas</h3><p>El pase de lista. Lo tocas tú —y solo tú: quien no sea Comandante recibe un aviso que se lo explica— y se abre el fichaje <b>solo para tu escuadrón</b>, los minutos que elijas. En la Nave de tu gente aparece el botón <b>✋ Presente</b> con su cuenta atrás, y al pulsarlo cobran. <a href="llamada.html">llamada.html</a>, también universal.</p>
<p class="small muted">No hay palabra que dictar: lo que no se puede adivinar es <b>cuándo</b> la vas a tocar.</p></div>
<div class="card"><h3>🎟️ Ticket de salida «Contacta con NEBULA»</h3><p>El alumnado valora la clase y deja dudas de forma <b>anónima</b> (presentación / tema / actividad / repaso, indicando quién imparte). Tú lo explotas en el <a href="tickets.html">panel visual de tickets</a>: valoraciones 1–5 por sección y dudas que puedes marcar como resueltas cuando las trates en clase.</p></div>
<div class="card"><h3>🎁 El Mercado Estelar</h3><p>Los xp no se gastan nunca: lo que se canjea son los <b>créditos ◈</b>, en el Mercado de la Nave, sin formularios (sobres de cromos, héroes, adornos…). Las recompensas que tocan la <b>nota</b> no se conceden solas: esperan en la <b>Cola de nota</b> de tu grupo (<a href="consola.html">Mis grupos</a> → Ver mi gente y los ajustes) hasta que las apruebas.</p></div>
</div>
</div></section>

<section id="roles"><div class="wrap">
<div class="eyebrow teal">Dos papeles, un sistema</div><h2>¿Quién hace qué?</h2>
<div class="grid cols-2">
<div class="card"><h3>🛰️ Profesorado referente <span class="pill">gestiona el PER</span></h3>
<p><b>Crea el grupo</b> desde <a href="crear.html">la consola del referente</a> (con la fecha de la semana 1, que marca el ritmo de todo el sistema), <b>pone el equipo docente</b> —quien esté en esa lista entra con su propia cuenta, sin PIN que repartir—, <b>monta y actualiza el Genially del grupo</b> y gobierna el día a día desde <a href="consola.html">el puesto de mando</a>: alumnado, cola de nota, traspasos y ajustes. La chuleta completa está en <a href="pasos.html#referente">Cómo se hace</a>.</p></div>
<div class="card"><h3>🎓 Profesorado que imparte <span class="pill">dinamiza el aula</span></h3>
<p>No toca ninguna hoja: sigue la <a href="cronologia.html">cronología</a>, publica el mensaje de la semana en el foro de la plataforma de UNIR, entrega las insignias <b>con ceremonia</b> y usa <a href="consola.html">Mis grupos</a> (proyectar la clase, el aula, la llamada a filas, su gente) y los <a href="tickets.html">tickets</a>, todo con su propia cuenta de Google. Si quiere un <b>panel de control Genially propio</b>, lo pega él mismo en Mis grupos → Ver mi gente y los ajustes → <b>Mis enlaces</b>.</p></div>
</div>
<p class="small muted" style="margin-top:10px">En la mayoría de los PER el referente <b>también imparte</b>: entonces te tocan las dos columnas. El botón <b>▶ Visita guiada</b> de arriba te lo enseña, y en Mis grupos el Capitán te explica cada botón la primera vez.</p>
</div></section>

<section id="orden"><div class="wrap">
<div class="eyebrow amber">Calendario de entrega</div><h2>Qué insignia toca cada semana</h2>
<div class="tablewrap"><table><thead><tr><th>Sem</th><th>Tema</th><th>Se entregan</th></tr></thead><tbody>{orden_html}</tbody></table></div>
<p class="lead" style="margin-top:10px">Las de <b>personaje</b> (P) llegan con el Reto A; las de <b>reto</b> (R) con el Reto B; las <b>especiales</b> y de <b>hito</b> en sus momentos (reclutamiento, Act. 1, Act. 2, Cero completa, Liberación).</p>
</div></section>

<section id="tablero"><div class="wrap">
<div class="eyebrow">Tablero en vivo</div><h2>Ranking e insignias de cada PER</h2>
<p class="lead">Se alimenta solo de lo que registra cada recluta en su Nave. Para <b>proyectarlo</b> en clase: Mis grupos → Ver mi gente y los ajustes → <b>Mis enlaces</b> → «El tablero, para proyectar». Tu alumnado lo ve en su Nave, pestaña <b>Rankings</b>.</p>
<div id="tablero-app"></div>
<script>window.SG_TABLERO_API="{TABLERO_API}";window.SG_BADGE_NAMES={json.dumps(BADGE_NAME, ensure_ascii=False)};window.SG_CROMOS={json.dumps([list(c) for c in CROMOS], ensure_ascii=False)};</script>
<script src="assets/js/tablero.js" defer></script>
</div></section>

<section id="instalacion"><div class="wrap">
<div class="eyebrow amber">Cómo funciona por dentro · para el profesorado referente</div><h2>El sistema de autoregistro</h2>
<div class="grid cols-3">
<div class="card"><h3>1 · El alumno registra</h3><p>Sin formularios. Cada estudiante se alista <b>una vez</b> con su cuenta de Google —nombre real, alias, Comandante y personaje— y a partir de ahí todo lo hace desde <a href="recluta.html">su Nave</a>: ve los retos de la semana con su paso a paso, pulsa <b>«Lo he hecho»</b> y los puntos suben en el momento. El <b>ticket de salida «Contacta con NEBULA»</b> sigue siendo anónimo y aparte, y el <b>canje</b> ocurre dentro de la Nave: los créditos se descuentan solos y a ti solo te llega lo que tiene que aprobar una persona.</p>
</div>
<div class="card"><h3>2 · Nadie hace nada</h3><p>Los xp, los créditos, las insignias, el planeta actual y el nivel los calcula el sistema con cada reto que se marca, y el tablero cambia al momento. Las insignias de hito <b>Tripulación Cero</b> y <b>La Liberación</b> se otorgan solas. Si hay un registro falso, el docente lo anula desde <a href="consola.html">Mis grupos</a> → Mi gente (pulsa la fila) y se descuenta lo que dio, con su asiento en el libro. Todo queda guardado para análisis e investigación.</p>
<p class="small muted">Hasta septiembre de 2026 esto vivía en una hoja de cálculo con formularios: está contado en <a href="legacy.html">el archivo</a>.</p></div>
<div class="card"><h3>3 · Un grupo nuevo, un minuto</h3><p>Antes, dos minutos en padlet.com: crea el <b>padlet del grupo</b> en formato <b>«Muro con secciones»</b> con cuatro secciones — <b>📹 Preséntate · 🎨 La chispa · 🎲 Ensaya jugando · 🛡️ Mi insignia</b> — y deja que los visitantes escriban. Después, en <a href="crear.html">Crear grupo</a> (con tu cuenta de Google): nombre, tipo REGULAR/PUA, primer día de la semana 1, el <b>equipo docente por su correo</b> y el enlace del padlet. Sale un <b>código de clase</b>, y «Copiar invitación» lo convierte en un mensaje listo para el foro de la plataforma de UNIR.</p></div>
</div>
<h3 style="margin-top:1.6em">Avatares</h3>
<div><p class="lead">Cada recluta elige su personaje al alistarse: uno de los <b>siete</b>, en versión ella/él. Cada personaje tiene <b>cinco versiones de arte</b> — Recluta → Cadete → Oficial → Comandante → <b>Leyenda</b> — que se <b>desbloquean por nivel</b> (3, 5, 8 y 10; ver <a href="#economia">la tabla de niveles</a>). Al desbloquear una nueva se pone sola, pero desde ese momento son <b>skins</b>: el recluta elige cuál lleva desde su Nave, cuando quiera y gratis.</p><img src="assets/img/avatares/lamina_personajes.jpg" alt="Personajes que evolucionan" style="border-radius:14px;border:1px solid var(--line);margin-bottom:12px">
<div class="official" style="display:block">🎭 <b>El vestuario de héroes.</b> Además de las skins, hay <b>héroes de la Rebelión</b>: figuras únicas que salen <b>al azar</b> con la recompensa del mismo nombre (60 ◈, desde la semana {_SEM_HEROE}) y que se <b>acumulan</b>. Se ponen y se quitan gratis desde la Nave. Los que aún no tienes salen en <b>sombra</b>, y los <b>LEGENDARIOS</b> no se dejan ver hasta que caen. Poner tu propia imagen y comprar un personaje suelto <b>se han retirado</b>: el vestuario los sustituye.</div></div>
</div>
<h3 id="economia" style="margin-top:1.6em">Dos marcadores: xp y créditos ◈</h3>
<p class="lead">Es la decisión de diseño más importante del sistema, y de paso el ejemplo vivo de una
distinción que el alumnado va a estudiar en el <b>Tema 7</b>: <b>puntos de progreso</b> y <b>moneda
canjeable</b> no son lo mismo y no deben compartir marcador.</p>
<div class="grid cols-2">
<div class="card"><h3>⭐ Los xp — el viaje</h3><p class="small"><b>Solo suben. No se gastan nunca.</b>
Miden lo que el recluta ha recorrido: marcan su <b>nivel</b> (del 1 al 10), su puesto en el ranking y hacen
<b>evolucionar a su personaje</b>. Comprar cromos no le baja de nivel: lo que ha aprendido no se devuelve.</p>
<p class="small">Reclutamiento 100 · Reto A 100 · Reto B 250 · Actividad entregada 500 · Batalla final 500 ·
hitos derivados 300. Viaje completo = <b>{_mil(XP_VIAJE["REGULAR"])} xp</b> (PUA: 300 por tema + 500 por actividad,
{_mil(XP_VIAJE["PUA"])} xp). Los xp <b>no son nota</b>.</p></div>
<div class="card"><h3>◈ Los créditos — el bolsillo</h3><p class="small"><b>Es lo único que se descuenta.</b>
Se ganan con el mismo trabajo que da xp, pero en otra escala, y se gastan en el canje. Cuando un recluta
compra un sobre de cromos pierde créditos, no progreso.</p>
<p class="small">Reclutamiento {CREDITOS["reclutamiento"]} ◈ · Reto A {CREDITOS["retoA"]} · Reto B {CREDITOS["retoB"]} ·
Actividad {CREDITOS["actividad"]} · Batalla final {CREDITOS["final"]} · hitos derivados {CREDITOS["derivada"]}.
Un viaje completo da <b>{CRED_VIAJE["REGULAR"]} ◈</b> (PUA: {CRED_VIAJE["PUA"]} ◈). Todo lo cosmético del catálogo
cuesta 280 ◈: <b>hay que elegir</b>, y esa elección es la mitad de la gracia.</p></div>
</div>
<h4 style="margin-top:1.4em">Los 10 niveles (y cuándo evoluciona el personaje)</h4>
<p class="lead">El personaje tiene <b>cinco versiones de arte</b> y cambia al entrar en los niveles 3, 5, 8 y 10.
En PUA los umbrales se escalan solos, para que el camino se sienta igual de largo.</p>
<div class="tablewrap"><table><thead><tr><th>Nivel</th><th>xp (REGULAR)</th><th>xp (PUA)</th><th>Título</th><th>Personaje</th></tr></thead><tbody>
{niveles_html}
</tbody></table></div>
<h4 style="margin-top:1.4em">Las recompensas y cuándo se desbloquean</h4>
<p class="lead">Todas se pagan en <b>créditos ◈</b>. La semana indicada es la de un PER REGULAR de 15 semanas;
en PUA se escala sola. Las automáticas se aplican en el momento de canjear en la Nave; las de nota esperan en
la <b>Cola de nota</b> hasta que el docente las aprueba.</p>
<div class="tablewrap"><table><thead><tr><th>Recompensa</th><th>Coste</th><th>Desde</th><th>Cómo se aplica</th></tr></thead><tbody>
{recompensas_html}
</tbody></table></div>
<p class="small muted" style="margin-top:8px">Además, sin canje: la <b>corona semanal</b> 👑 aparece sola en el tablero junto al recluta que más xp ganó en los últimos 7 días.</p>
<p class="small muted">Las cosméticas se aplican solas (el avatar cambia en el tablero al instante). Las de nota quedan <b>pendientes</b> en la Cola de nota hasta que el docente las aprueba, y los créditos no se mueven hasta entonces. En PUA las semanas se escalan solas. En la Nave, las que aún no tocan aparecen como «recompensa clasificada».</p>
<p class="small muted" style="margin-top:18px">¿Buscas cómo se instalaba el sistema antiguo, con la hoja de cálculo y los formularios? Está en <a href="legacy.html">el archivo</a>.</p>
</div></section>
''' + FOOT

# ================= DATOS DE LOS MODALES (insignias) =================
# tipo · como (cómo se consigue) · cuando · tarea (qué hay que hacer)
BADGE_INFO = {
 # Personajes de la Tripulación Cero (Reto A)
 "P1_bran":{"nombre":"Bran Okafor · El Forjador","tipo":"Insignia de personaje","como":"Completando el Reto A del Tema 1: «El boceto sin quemar».","cuando":"Tema 1 · Planeta Fôrge","tarea":"Publica en el foro de la plataforma de UNIR un borrador en bruto de algo que estés creando y una frase sobre qué te daba reparo enseñarlo sin pulir. No se corrige: el único criterio es compartirlo antes de terminarlo. Al hacerlo se recupera el fragmento de Bran."},
 "P2_tomas":{"nombre":"Tomás Reyer · El Cronista","tipo":"Insignia de personaje","como":"Completando el Reto A del Tema 2: «Un mensaje para quien faltó».","cuando":"Tema 2 · Planeta Ecos","tarea":"Graba un clip corto (máx. 60 s) explicando un concepto como si se lo contaras a un alumno que hoy no vino a clase. Debe entenderse solo, sin ti delante."},
 "P3_sylla":{"nombre":"Sylla Bren · La Rastreadora","tipo":"Insignia de personaje","como":"Completando el Reto A del Tema 3: «Dos senderos».","cuando":"Tema 3 · Planeta Sendara","tarea":"Toma un objetivo de aprendizaje y describe dos rutas completamente distintas para alcanzarlo, pensadas para dos alumnos diferentes. Que las dos lleguen a la misma cima."},
 "P4_amara":{"nombre":"Amara Sol · La Operadora","tipo":"Insignia de personaje","como":"Completando el Reto A del Tema 4: «Abre el canal».","cuando":"Tema 4 · Planeta Reliae","tarea":"Publica en tus redes una reflexión o un recurso del curso con el hashtag #mutecdstargate, en abierto. A tiempo por encima de perfecto: se publica hoy, se pule mañana.","cita":"Llegué tarde por querer llegar perfecta. Nunca más."},
 "P5_vera":{"nombre":"Vera Khal · La Médica","tipo":"Insignia de personaje","como":"Completando el Reto A del Tema 5: «Mide con método».","cuando":"Tema 5 · Planeta Umbral","tarea":"Define un indicador observable que vayas a seguir de verdad del aprendizaje de tus alumnos, acompañado de la pregunta que lo convierte en cuidado: «¿qué haré mañana mejor que hoy?»."},
 "P6_joran":{"nombre":"Joran Pike · El Ingeniero-jugador","tipo":"Insignia de personaje","como":"Completando el Reto A del Tema 6: «Ensaya jugando».","cuando":"Tema 6 · Planeta Ludo","tarea":"Coge algo que tus alumnos temen o les cuesta y conviértelo en un pequeño ensayo jugable (una mecánica: puntos, rutas, un enigma en cada paso). Que el juego sirva a un objetivo, no juego por juego."},
 "P7_mara":{"nombre":"Mara Voss · El Mando","tipo":"Insignia de personaje","como":"Completando el Reto A del Tema 7: «Un porqué».","cuando":"Tema 7 · Planeta Vínculo","tarea":"Toma una tarea rutinaria y escribe el «porqué» / la narrativa que la convierte en una causa. Diseña una insignia con sentido: memoria de un acto significativo, no premio por obedecer."},
 "P8_noa":{"nombre":"Noa Lieth · La Arquitecta de capas","tipo":"Insignia de personaje","como":"Completando el Reto A del Tema 8: «La capa posible».","cuando":"Tema 8 · Planeta Liminar","tarea":"Describe una «capa» sobre tu aula real: cómo sería si aprendiera a hablar de sí misma. Y elige un compromiso concreto que te llevas de todo el viaje. Con esto la Tripulación Cero queda completa."},
 # Especiales
 "E1_nebula":{"nombre":"NEBULA · La Bitácora viva","tipo":"Insignia de personaje (especial)","como":"Completando el reto «Preséntate a tu tripulación»: un vídeo de 60 segundos en el padlet de la clase.","cuando":"Semana 1","tarea":"NEBULA es la IA de la nave y tu narradora constante. Te da su insignia cuando compartes tu cara con la tripulación: preséntate en un vídeo de un minuto y publícalo en el padlet. Lo que se comparte no se apaga."},
 "E2_capitan":{"nombre":"El Capitán · El Mando de la misión","tipo":"Insignia de personaje (especial)","como":"Se obtiene al presentar la Actividad 1.","cuando":"Temas 1–2","tarea":"El Capitán es el mando de la misión (tu profesor o profesora). Su insignia reconoce que has asumido tu primera misión mayor: la actividad didáctica con imagen de IA."},
 "E3_vaeon":{"nombre":"General Vaeon · Señor de la Estática","tipo":"Insignia de villano","como":"Resolviendo el huevo de Pascua «El Fragmento Prohibido»: un enlace oculto en la presentación del planeta Vínculo lleva a un enigma, y el enigma a la palabra que Vaeon borró.","cuando":"Tema 7 · Vínculo (si sabes mirar)","tarea":"Vaeon es el antagonista: personifica los errores del diseño educativo (contenido que no se entiende, recursos que no llegan, saber no compartido). Su insignia no se anuncia: se encuentra. Coleccionar su carta es el trofeo de haber entendido al enemigo."},
 # Retos (Reto B)
 "R1_la-chispa":{"nombre":"La chispa","tipo":"Insignia de reto","como":"Completando el Reto B del Tema 1.","cuando":"Tema 1 · Fôrge","tarea":"Genera con una IA una imagen con finalidad didáctica: prompt estructurado (contexto + tipo de imagen + finalidad), al menos una iteración, selección final con tu criterio docente y evidencia del proceso. Es el núcleo de la Actividad 1."},
 "R2_el-eco-que-ensena":{"nombre":"El eco que enseña","tipo":"Insignia de reto","como":"Completando el Reto B del Tema 2.","cuando":"Tema 2 · Ecos","tarea":"Crea un videotutorial de calidad (guion + grabación de pantalla + edición) y enriquécelo con 2–3 preguntas insertadas (videoquiz). Piénsalo para aula invertida y súbelo a la Bitácora con una reflexión breve."},
 "R3_la-matriz":{"nombre":"La matriz","tipo":"Insignia de reto","como":"Completando el Reto B del Tema 3.","cuando":"Tema 3 · Sendara","tarea":"Construye la matriz de programación 8×6 (8 inteligencias múltiples × 6 niveles de Bloom = 48 casillas) y rellena al menos 6 cruces variados, con una actividad en cada uno. Es el núcleo de planificación de la Actividad 2."},
 "R4_entorno-de-aula":{"nombre":"El entorno de aula","tipo":"Insignia de reto","como":"Completando el Reto B del Tema 4.","cuando":"Tema 4 · Reliae","tarea":"Monta un espacio digital de aula organizado (tipo Classroom, Sites, Moodle…) donde compartas materiales y puedas dar feedback y comunicarte en diferido y en directo. Deja enlace/captura + reflexión en la Bitácora."},
 "R5_bitacora-medida":{"nombre":"La Bitácora medida","tipo":"Insignia de reto","como":"Completando el Reto B del Tema 5.","cuando":"Tema 5 · Umbral","tarea":"Diseña una rúbrica digital sencilla y estructura formalmente tu ePortfolio (una sección por evidencia, con el patrón evidencia → contexto → reflexión → autoevaluación). Esta semana además se cierra la Actividad 1."},
 "R6_el-juego":{"nombre":"El juego","tipo":"Insignia de reto","como":"Completando el Reto B del Tema 6.","cuando":"Tema 6 · Ludo","tarea":"Adapta o crea un juego digital educativo para un objetivo concreto de tu aula. En Aprendizaje Basado en el Juego el juego ES la actividad: cada mecánica debe servir a un aprendizaje. Sube el juego + reflexión."},
 "R7_microgamificacion":{"nombre":"La microgamificación","tipo":"Insignia de reto","como":"Completando el Reto B del Tema 7.","cuando":"Tema 7 · Vínculo","tarea":"Diseña una microgamificación de calidad: un toque de juego sobre una tarea que NO es un juego (una insignia, una barra de progreso, un tablero, un reto con narrativa). Aquí no se juega: se toman elementos del juego para enganchar."},
 "R8_ultimo-umbral":{"nombre":"El último umbral","tipo":"Insignia de reto","como":"Completando el Reto B del Tema 8.","cuando":"Tema 8 · Liminar","tarea":"Crea una experiencia de Realidad Aumentada o Virtual para tu materia y termina y publica la Bitácora (paisaje como imagen interactiva + las 5 páginas completas + enlace único). Resuelve la Actividad 2."},
 # Hitos
 "H1_reclutamiento":{"nombre":"Reclutamiento","tipo":"Insignia de hito","como":"Se entrega en la primera sesión, cuando el recluta se presenta ante el mando.","cuando":"Semana 1","tarea":"Aceptas la misión: te alistas en el equipo de rescate de STARGATE y abres tu Bitácora Estelar."},
 "H2_primera-forja":{"nombre":"Primera Forja","tipo":"Insignia de hito","como":"Se entrega con la Actividad 1.","cuando":"Temas 1–2","tarea":"Tu primera obra queda registrada en la Bitácora: la actividad didáctica creada a partir de una imagen con IA."},
 "H3_cartografo":{"nombre":"Cartógrafo","tipo":"Insignia de hito","como":"Se entrega con la Actividad 2.","cuando":"Tema 3 (se resuelve en el 8)","tarea":"Dibujas un territorio, no un camino: entregas el paisaje de aprendizaje con su matriz de programación."},
 "H4_tripulacion-cero":{"nombre":"Tripulación Cero","tipo":"Insignia de hito","como":"Se otorga sola al desbloquear a los 8 personajes de la Cero.","cuando":"A lo largo del viaje","tarea":"Recuperas a Bran, Tomás, Sylla, Amara, Vera, Joran, Mara y Noa. NEBULA vuelve a estar completa."},
 "H5_la-liberacion":{"nombre":"La Liberación","tipo":"Insignia de hito","como":"Se otorga sola al completar y publicar la Bitácora.","cuando":"Repaso final","tarea":"Una Bitácora abierta, copiada y compartida no se puede apagar: la Estática retrocede y la puerta a la Tierra se abre. Tu ePortfolio es el camino a casa."},
}
# Frase del personaje (se muestra en el modal de las insignias de personaje)
CITAS = {
 "P1_bran":"Copiadlo. Copiadlo todos.",
 "P2_tomas":"Si ves esto, es que hoy no llegué a contártelo yo.",
 "P3_sylla":"Mi hermano no se perdió. Lo perdió el mapa.",
 "P4_amara":"Llegué tarde por querer llegar perfecta. Nunca más.",
 "P5_vera":"Medir es mirar con método a alguien que te importa.",
 "P6_joran":"Esta ya la hemos ganado cien veces. Ruta azul.",
 "P7_mara":"Una orden mueve cuerpos. Un porqué mueve personas.",
 "P8_noa":"Que conste que nadie nos obligó. Elegimos.",
 "E1_nebula":"Lo que se comparte no se apaga.",
 "E2_capitan":"Una obra que no se documenta, no existe.",
 "E3_vaeon":"Si recordar duele, olvidar es misericordia.",
}
# Enlace a la actividad mayor / ePortfolio del que forma parte el reto
LINKS = {
 "R1_la-chispa":{"text":"Actividad 1 — imagen con IA","href":"actividades.html#act1"},
 "R2_el-eco-que-ensena":{"text":"el ePortfolio (reto videotutorial)","href":"actividades.html#eportfolio"},
 "R3_la-matriz":{"text":"Actividad 2 — paisaje de aprendizaje","href":"actividades.html#act2"},
 "R4_entorno-de-aula":{"text":"el ePortfolio (entorno de aula)","href":"actividades.html#eportfolio"},
 "R5_bitacora-medida":{"text":"el ePortfolio y la Actividad 1","href":"actividades.html#eportfolio"},
 "R6_el-juego":{"text":"el ePortfolio (reto juego digital)","href":"actividades.html#eportfolio"},
 "R7_microgamificacion":{"text":"el ePortfolio (reto microgamificación)","href":"actividades.html#eportfolio"},
 "R8_ultimo-umbral":{"text":"la Actividad 2 y la Bitácora","href":"actividades.html#act2"},
 "H2_primera-forja":{"text":"Actividad 1","href":"actividades.html#act1"},
 "H3_cartografo":{"text":"Actividad 2","href":"actividades.html#act2"},
}
for _k,_v in CITAS.items(): BADGE_INFO[_k]["cita"]=_v
for _k,_v in LINKS.items(): BADGE_INFO[_k]["link"]=_v

CARD_TITLES = {k: (BADGE_INFO[k]["nombre"] if k in BADGE_INFO else CROMO_TITULO[k]) for k in CARDS}


JS_TEMPLATE = r"""// STARGATE — modales, vídeos y utilidades (autogenerado por _build_site.py)
(function(){
  var BADGE=__BADGE__, CARDT=__CARDS__;
  // v3.60 · la ficha completa de cada insignia (nombre, cómo se gana, la cita) vivía encerrada
  // en este modal. La sala de sesión la necesita para proyectarla en clase, y copiarla habría
  // sido tener el mismo dato en dos sitios: se expone y punto.
  window.SG = window.SG || {}; window.SG.BADGE = BADGE; window.SG.CARDT = CARDT;

  /**
   * ENCENDER LO QUE SOLO VE EL PROFE REFERENTE.
   *
   * 🔴 Las entradas `solo-referente` del menú nacen OCULTAS en el HTML, y es deliberado: esta web
   * es estática y no sabe quién mira, así que si nacieran visibles habría un parpadeo en el que
   * cualquier docente vería «Crear grupo» antes de que se escondiera. Esconder después de enseñar
   * es peor que no esconder: ya lo ha visto y ya sabe que existe.
   *
   * Vive aquí —y no en `puerta.js`— porque el menú es el mismo en TODAS las páginas y la puerta solo
   * se carga en diez. Sin esto, en la consola y en crear el botón no aparecía nunca.
   *
   * Se escucha `sg:rol` porque el menú se pinta mucho antes de que el servidor diga quién eres: sin
   * el aviso, el referente no veía el botón hasta recargar — y nadie recarga para ver si aparece
   * algo que no sabe que existe.
   */
  function encenderSegunRol(){
    var ref=false; try{ ref = localStorage.getItem('sgEsReferente')==='1'; }catch(e){}
    if(!ref) return;
    Array.prototype.forEach.call(document.querySelectorAll('.lnk.solo-referente'),function(a){ a.hidden=false; });
  }
  encenderSegunRol();
  document.addEventListener('sg:rol', encenderSegunRol);
  var back=document.createElement('div');
  back.className='modal-backdrop'; back.setAttribute('role','dialog'); back.setAttribute('aria-modal','true');
  document.body.appendChild(back);
  function esc(s){return (s==null?'':String(s)).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function close(){back.classList.remove('open'); back.innerHTML=''; document.body.style.overflow='';}
  function afterOpen(){back.classList.add('open'); document.body.style.overflow='hidden';
    var b=back.querySelector('.modal-close'); if(b){b.addEventListener('click',close); b.focus();}}
  function openBadge(key){var d=BADGE[key]; if(!d) return;
    back.innerHTML='<div class="modal modal-badge"><button class="modal-close" aria-label="Cerrar">✕</button>'
      +'<div class="fig"><img src="assets/img/insignias/'+key+'.png" alt="'+esc(d.nombre)+'"></div>'
      +'<div class="body"><div class="type">'+esc(d.tipo)+'</div><h3>'+esc(d.nombre)+'</h3>'
      +'<dl><dt>Cómo se consigue</dt><dd>'+esc(d.como)+'</dd>'
      +'<dt>Cuándo</dt><dd>'+esc(d.cuando)+'</dd>'
      +'<dt>La tarea (tal como la recibe el alumnado)</dt><dd>'+esc(d.tarea)+'</dd></dl>'
      +(d.cita?('<blockquote class="mquote">«'+esc(d.cita)+'»</blockquote>'):'')
      +(d.link?('<a class="mlink" href="'+esc(d.link.href)+'">Forma parte de: '+esc(d.link.text)+' →</a>'):'')
      // 🔴 UN HUECO PARA QUIEN SEPA MÁS QUE ESTE MODAL. Esta ficha de insignia se usa en media web
      // —recursos, registro, la sala— y no sabe nada de quién la está mirando. Pero en la Nave sí
      // se sabe: hay una persona identificada y se sabe si ese reto le falta. En vez de meter aquí
      // lógica de alumnado, se deja un hueco que la Nave rellena si quiere. Las demás páginas no
      // definen la función y no pasa nada.
      +(window.SG_BADGE_EXTRA?window.SG_BADGE_EXTRA(key):'')
      +'</div></div>';
    afterOpen();
    if(window.SG_BADGE_WIRE) window.SG_BADGE_WIRE(key, back, close);}
  function openCard(key){
    back.innerHTML='<div class="modal-card"><button class="modal-close" aria-label="Cerrar">✕</button>'
      +'<img src="assets/img/tarjetas/'+key+'_carta.png?v=__CARDV__" alt="Carta de '+esc(CARDT[key]||key)+'"></div>';
    afterOpen();}
  back.addEventListener('click',function(e){if(e.target===back) close();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape') close();});
  function wire(sel,attr,fn){Array.prototype.forEach.call(document.querySelectorAll(sel),function(el){
    el.tabIndex=0; el.setAttribute('role','button');
    el.addEventListener('click',function(){fn(el.getAttribute(attr));});
    el.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();fn(el.getAttribute(attr));}});});}
  wire('.badge[data-key]','data-key',openBadge);
  // v3.40 · el modal tambien para contenido que se pinta DESPUES (la coleccion de la Nave)
  window.SG_OPEN_BADGE=openBadge;
  wire('.card-thumb[data-card]','data-card',openCard);
  // vídeos de YouTube: miniatura -> iframe al pulsar
  function playYT(el){var id=el.getAttribute('data-id'); if(!id||el.classList.contains('on')) return;
    var f=document.createElement('iframe'); f.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0';
    f.allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture'; f.allowFullscreen=true;
    var img=el.querySelector('img'); el.insertBefore(f,img); el.classList.add('on');}
  Array.prototype.forEach.call(document.querySelectorAll('.yt'),function(el){
    el.addEventListener('click',function(){playYT(el);});
    el.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();playYT(el);}});});
  // copiar mensajes del foro
  Array.prototype.forEach.call(document.querySelectorAll('button.copy[data-copy]'),function(b){
    b.addEventListener('click',function(){var t=document.getElementById(b.getAttribute('data-copy')); if(!t) return;
      var txt=t.innerText; function ok(){b.textContent='¡Copiado!'; setTimeout(function(){b.textContent='Copiar texto';},1800);}
      if(navigator.clipboard){navigator.clipboard.writeText(txt).then(ok);} else {var ta=document.createElement('textarea'); ta.value=txt; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); ok();}});});
  // abrir la semana indicada en el hash
  if(location.hash && /^#sem\d+$/.test(location.hash)){var d=document.querySelector(location.hash); if(d&&d.tagName==='DETAILS'){d.open=true;}}
})();

// ---- avatares: SOLO personajes que evolucionan (v3.8: fuera la galería clásica) + URL propia por canje ----
window.SG = window.SG || {};

/**
 * LA «G» DE GOOGLE, EN UN SOLO SITIO. Tal cual la publica su guía de marca.
 *
 * 🔴 Norberto lo pidió al primer vistazo: «aquí no aparece el inicio de Google, debe quedar claro.
 * Podrías usar el logo de Google también, da más confianza». Un botón que solo dice «entrar» no
 * promete nada — quien lo pulsa no sabe si le van a pedir una contraseña nueva o inventarse un
 * usuario. La marca dice, sin leer una palabra, que la contraseña se teclea en Google y no aquí.
 *
 * Va aquí y no copiada en cada puerta porque las puertas son cinco (la del material docente, la
 * consola, la sala, crear y alistarse) y un logo repetido cinco veces es un logo que el día que
 * cambie se quedará viejo en cuatro. Y va en SVG DENTRO de la página, no cargado del servidor de
 * Google: el día que ese enlace cambie, el botón se quedaría mudo justo en la pantalla que pide
 * confianza.
 */
window.SG.LOGO_G = '<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true" focusable="false">'
  + '<path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11.8c-.5 2.7-2 5-4.3 6.6v5.5h7c4.1-3.8 6.6-9.4 6.6-16.3z"/>'
  + '<path fill="#34A853" d="M24 46c5.8 0 10.7-1.9 14.3-5.2l-7-5.5c-1.9 1.3-4.4 2.1-7.3 2.1-5.6 0-10.4-3.8-12.1-8.9H4.7v5.6C8.3 41.4 15.6 46 24 46z"/>'
  + '<path fill="#FBBC05" d="M11.9 28.5c-.4-1.3-.7-2.7-.7-4.5s.3-3.2.7-4.5v-5.6H4.7C3.2 17 2.4 20.4 2.4 24s.8 7 2.3 10.1l7.2-5.6z"/>'
  + '<path fill="#EA4335" d="M24 9.5c3.2 0 6 1.1 8.2 3.2l6.2-6.2C34.7 3 29.8 1 24 1 15.6 1 8.3 5.6 4.7 13.9l7.2 5.6C13.6 14.4 18.4 9.5 24 9.5z"/>'
  + '</svg>';
// Niveles y rangos (v3.7). Los XP SOLO SUBEN: dan nivel, y el avatar evoluciona al entrar en
// los niveles marcados. Lo gastable son los CRÉDITOS, que viajan aparte en la ficha del recluta.
window.SG.MONEDA = __MONEDA__;
window.SG.RANGOS = __RANGOS__;
window.SG.NIVELES = __NIVELES__;            // [nivel, xp REGULAR, rango 1-5, título]
window.SG.XP_VIAJE = __XPVIAJE__;
window.SG.escalaXp = function(tipoPer){ var r=window.SG.XP_VIAJE.REGULAR||1; return (window.SG.XP_VIAJE[tipoPer]||r)/r; };
window.SG.nivel = function(xp, tipoPer){ var k=window.SG.escalaXp(tipoPer), n=1, L=window.SG.NIVELES;
  for(var i=0;i<L.length;i++) if((xp||0) >= L[i][1]*k) n=L[i][0];
  return n; };
window.SG.nivelInfo = function(xp, tipoPer){ var L=window.SG.NIVELES, k=window.SG.escalaXp(tipoPer);
  var n=window.SG.nivel(xp,tipoPer), f=L[n-1];
  var desde=Math.round(f[1]*k), sig=n<L.length?Math.round(L[n][1]*k):null;
  var pct=sig?Math.min(100,Math.max(0,Math.round(((xp||0)-desde)/(sig-desde)*100))):100;
  // ¿en qué nivel toca la próxima evolución del avatar?
  var evo=null; for(var j=n;j<L.length;j++) if(L[j][2]>f[2]){ evo={nivel:L[j][0], xp:Math.round(L[j][1]*k), rango:window.SG.RANGOS[L[j][2]-1]}; break; }
  return { nivel:n, rango:f[2], rangoNombre:window.SG.RANGOS[f[2]-1], titulo:f[3],
           desde:desde, siguiente:sig, faltan: sig===null?0:Math.max(0,sig-(xp||0)), pct:pct, evo:evo }; };
window.SG.rango = function(xp, tipoPer){ return window.SG.NIVELES[window.SG.nivel(xp,tipoPer)-1][2]; };
window.SG.avatarSrc = function(av, alias, xp, tipoPer){
  av = av || {}; var h=0; for(var i=0;i<(alias||'').length;i++) h=(h*31+alias.charCodeAt(i))>>>0;
  var n = av.n; if(!(n>=1&&n<=7)) n=(h%7)+1;      // sin personaje válido, uno estable por alias
  var v = av.v || ((h>>3)%2 ? 'm' : 'f');
  var r = window.SG.rango(xp||0, tipoPer);
  // v3.16 · manda lo que lleva PUESTO. Un héroe es una imagen suya; una skin es el tramo de arte
  // que ha elegido. Si no ha elegido nada, la más alta que tenga (que es lo de siempre).
  if (av.heroe) return { src:'assets/img/heroes/'+av.heroe+'.jpg', fallback:'assets/img/heroes/'+av.heroe+'.jpg',
                         rango: window.SG.RANGOS[r-1], r: r, evo:false, heroe: av.heroe };
  if (av.skin >= 1 && av.skin <= 5) r = av.skin;
  var fallback = 'assets/img/avatares/evo/p'+n+v+'_r'+r+'.jpg';
  var u = av.url ? String(av.url).trim() : '';
  if(u){ var m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([A-Za-z0-9_-]{10,})/); if(m) u = 'https://drive.google.com/thumbnail?id='+m[1]+'&sz=w400';
         if(!/^https?:\/\//i.test(u)) u=''; }
  return { src: u || fallback, fallback: fallback, rango: window.SG.RANGOS[r-1], r: r, evo: !u };
};
window.SG.avatarImg = function(av, alias, cls, xp, tipoPer){ var r = window.SG.avatarSrc(av, alias, xp, tipoPer);
  return '<img class="av '+(cls||'')+' r'+r.r+'" src="'+r.src+'" data-fb="'+r.fallback+'" alt="" title="'+r.rango+'" loading="lazy" referrerpolicy="no-referrer" onerror="var f=this.dataset.fb; if(this.src.indexOf(f)<0){this.src=f;} else if(!this.dataset.rt){this.dataset.rt=1; this.src=f+(f.indexOf(String.fromCharCode(63))<0?\'?rt=1\':\'&amp;rt=1\');}">'; };

// ---------- lista de PERs (grupos): caché de 12 h + revalidación en segundo plano ----------
// La usa el desplegable «Grupos» del menú y grupos.html. doGet ?per=all NO pide PIN y solo
// devuelve id/nombre/tipo/estado/inicio de los PER no archivados.
/**
 * La lista de grupos: alimenta el desplegable «Grupos» del menu y la pagina de grupos.
 *
 * 12-sep · Preguntaba SOLO al Apps Script, asi que los grupos creados con el motor nuevo no
 * aparecian en ninguno de los dos sitios. Un referente creaba un grupo desde la consola y no lo veia
 * en el menu de su propia web, sin ningun error que lo explicara.
 *
 * Ahora se juntan las dos listas. La del motor nuevo solo llega si hay sesion (Firestore no contesta
 * a quien no ha entrado) y si esa pagina carga la fuente, asi que esto ANADE y nunca quita: en una
 * pagina publica sigue saliendo exactamente lo de siempre.
 */
window.SG.pers = function(cb){
  var API=(window.SG_TABLERO_API||'').trim(), K='sgPers_v1';
  // 🔴 El motor se decide por la URL o por el ajuste, NO por si `SG.FUENTE` ya existe. Los scripts
  // van con `defer` y esta funcion la llaman paginas que arrancan antes de que la fuente este
  // cargada: mirando el objeto, `nuevo` salia falso, se cacheaba la lista sin los grupos del motor
  // nuevo, y no volvian a aparecer hasta vaciar la cache a mano.
  var q = new URLSearchParams(location.search);
  var nuevo = ((q.get('motor')||window.SG_MOTOR||'apps')+'').toLowerCase() === 'firestore';
  function juntar(a,b){ var v={}, out=[];
    (a||[]).concat(b||[]).forEach(function(p){ if(!p||!p.id||v[p.id])return; v[p.id]=true; out.push(p); });
    return out; }
  /** Espera a que la fuente exista (llega con defer), pero sin colgarse si nunca llega. */
  function fuente(){
    return new Promise(function(ok){
      var t0=Date.now();
      (function mira(){
        var F=window.SG && window.SG.FUENTE;
        if(F && F.nombre==='firestore') return ok(F);
        if(Date.now()-t0 > 6000) return ok(null);
        setTimeout(mira, 80);
      })();
    });
  }
  function delMotorNuevo(){
    if(!nuevo) return Promise.resolve([]);
    return fuente().then(function(F){
      if(!F) return [];
      return F.lista().then(function(r){ return (r&&r.pers)||[]; }).catch(function(){ return []; });
    }); }
  if(!API){
    delMotorNuevo().then(function(n){ cb(n, n.length?'red':'sin-api'); });
    return; }
  var cache=null; try{ cache=JSON.parse(localStorage.getItem(K)||'null'); }catch(e){}
  var fresco = cache && (Date.now()-cache.ts) < 12*3600*1000;
  if(cache) cb(cache.pers, fresco?'cache':'viejo');
  if(fresco && !nuevo) return;   // con el motor nuevo se refresca igual: la cache no lo conoce
  Promise.all([
    fetch(API+'?per=all',{redirect:'follow'}).then(function(r){return r.json();})
      .then(function(d){ return (d&&d.pers)||[]; }).catch(function(){ return null; }),
    delMotorNuevo()
  ]).then(function(res){
    var viejos=res[0], nuevos=res[1];
    if(viejos===null && !nuevos.length){ if(!cache) cb([], 'error'); return; }
    var pers=juntar(viejos||[], nuevos);
    try{ localStorage.setItem(K, JSON.stringify({ts:Date.now(), pers:pers})); }catch(e){}
    cb(pers, 'red');
  });
};

// ---------- desplegable «Grupos» del menú ----------
(function(){
  var box=document.getElementById('nav-grupos'); if(!box) return;
  var btn=box.querySelector('.drop-btn'), menu=box.querySelector('.drop-menu'), lista=box.querySelector('.drop-list');
  function esc2(t){return (t==null?'':String(t)).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function abrir(v){ menu.hidden=!v; box.classList.toggle('open',v); btn.setAttribute('aria-expanded',v?'true':'false'); }
  btn.addEventListener('click',function(e){ e.stopPropagation(); abrir(menu.hidden); });
  document.addEventListener('click',function(e){ if(!box.contains(e.target)) abrir(false); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') abrir(false); });
  var pintado=false;
  window.SG.pers(function(pers,origen){
    if(pintado && origen!=='red') return;
    pintado=true;
    if(!pers.length){ lista.innerHTML='<span class="drop-msg">'+(origen==='sin-api'
      ? 'El tablero aún no está conectado.' : 'Todavía no hay grupos activos.')+'</span>'; return; }
    lista.innerHTML=pers.map(function(p){
      return '<a href="grupos.html?per='+encodeURIComponent(p.id)+'" role="menuitem"><b>'+esc2(p.nombre)+'</b>'
        +'<em>'+esc2(p.tipo||'')+(p.estado?' · '+esc2(p.estado):'')+'</em></a>';}).join('');
  });
})();
"""

TOUR_JS = r"""// STARGATE — visita guiada con el Capitán (autogenerado por _build_site.py: editar TOUR_JS, no este fichero)
// Empieza en Mis grupos; si la cuenta es de referente (se ve su zona), suma los pasos de crear grupo.
(function(){
  var KEYR='sgTourRol';
  /**
   * 🔴 13-sep · LA VISITA, REHECHA CON LA WEB DE HOY. Empezaba en la portada pública («esta web es tu
   * puesto de mando»), pasaba por el «Registro» de la hoja de cálculo y acababa mandando al «panel
   * del profesorado con el PIN que te dará tu referente». Tres paradas en sitios que ya no existen.
   *
   * Ahora empieza donde aterriza el docente —Mis grupos— y señala los botones de verdad: el código de
   * clase, proyectar, la llamada, el aula y su gente. Luego el método (guía, cronología, actividades).
   * Lo del referente ya no se pregunta: se VE. Si en Mis grupos está la zona del referente, la visita
   * suma sus pasos; si no, no los enseña.
   *
   * Tres claves nuevas en cada paso: `espera` (la consola pinta los grupos cuando llega la sesión, así
   * que el paso aguarda a que su objetivo exista), `si` (si el objetivo no aparece, el paso se salta en
   * vez de señalar al vacío) y `rol` (el paso que mira si eres referente).
   */
  var BASE=[
   {p:'consola.html',sel:'.gp',listo:'.gp',espera:1,rol:1,pose:'saluda',t:'Bienvenido al mando',x:'Recluta… perdón: <b>Capitán</b>. Soy tu homólogo en la historia. Esto es <b>Mis grupos</b>, tu puesto de mando: cada tarjeta es un grupo tuyo, y todo lo de clase sale de ella. Te lo enseño en dos minutos.'},
   {p:'consola.html',sel:'.gp-invita',listo:'.gp',espera:1,si:1,pose:'senala',t:'Lo primero: tu clase',x:'El <b>código de clase</b>, en grande para escribirlo en la pizarra. <b>«Copiar invitación»</b> te da un mensaje listo para pegar en el foro de la plataforma de UNIR, con el enlace dentro. Tu alumnado entra con Google, escribe el código y se alista solo.'},
   {p:'consola.html',sel:'.gp-b.principal',listo:'.gp',espera:1,si:1,pose:'tablet',t:'Cada clase empieza aquí',x:'<b>Proyectar la clase</b>: la sesión de la semana ya montada —el planeta, los vídeos, los retos y las insignias—; pasas con las flechas. Arriba, solo para ti, el consejo del Capitán y el mensaje de la semana para el foro.'},
   {p:'consola.html',sel:'.gp-hacer',listo:'.gp',espera:1,si:1,pose:'brazos',t:'Durante la clase',x:'<b>Llamada a filas</b> es el pase de lista con premio: tu alumnado pulsa «Presente» en su Nave y se lleva créditos y un sobre de cromos. <b>El aula</b> te dice quién ha fichado, a quién felicitar y el ranking, y deja repartir premios a mano. Las dos se incrustan en tu Genially con <code>?embed=1</code>.'},
   {p:'consola.html',sel:'.gp-abrir',listo:'.gp',espera:1,si:1,pose:'tablet',t:'Tu gente',x:'<b>Ver mi gente y los ajustes</b>: la lista con sus xp, créditos, insignias y los <b>enlaces de sus evidencias</b>. Pulsa una fila para otorgar o anular un reto. Ahí está también la <b>Cola de nota</b>: ninguna subida de nota se aplica sin tu visto bueno.'},
   {p:'consola.html',sel:'.ref-zona',listo:'.gp',espera:1,si:1,soloRef:1,pose:'senala',t:'Como referente',x:'Lo tuyo como referente: <b>crear un grupo</b> en un minuto, los <b>tickets de salida</b> de todas tus clases y el montaje paso a paso. Dentro de cada grupo verás además <b>Equipo docente</b>, <b>Escuadrones</b>, <b>Premios por enlace</b> y <b>Ajustes</b>.'},
   {p:'guia.html',sel:'#pers',pose:'brazos',t:'Las voces y la Tripulación Cero',x:'<b>NEBULA</b> narra, <b>yo</b> doy las órdenes (o sea, tú) y <b>Vaeon</b> silencia. Ocho tripulantes esperan a que tu alumnado los recupere, uno por tema. Pulsa cualquier insignia: verás su reto y su frase.'},
   {p:'guia.html',sel:'#retos',pose:'tablet',t:'Dos retos por tema',x:'El <b>Reto A</b> da la <b>insignia</b> del personaje: no cuenta para nota, aunque da 100 xp y __CRED_A__ ◈. El <b>Reto B</b> produce una evidencia real de la Bitácora (250 xp y __CRED_B__ ◈) y <b>pide su enlace</b>. Los <b>xp</b> suben de nivel y nunca se gastan; los <b>créditos ◈</b> son lo que se canjea. Y nadie registra más de 3 retos al día.'},
   {p:'cronologia.html',sel:'#mapa',pose:'senala',t:'Tu carta de navegación',x:'El mapa de las <b>15 semanas</b>: qué vídeo proyectar, qué reto lanzar, qué insignia entregar y el hito de evaluación. Sin fechas: semanas, como tu aula.'},
   {p:'cronologia.html',sel:'#sem1',pose:'pensativo',t:'La orden del día',x:'Despliega una semana y tendrás la orden completa, con los vídeos reproducibles aquí mismo y el <b>mensaje para el foro de la plataforma de UNIR</b>, listo para copiar (la firma es siempre «Capitán», a secas). Tu alumnado ya lo ve solo en su Nave.'},
   {p:'actividades.html',sel:'#act1',pose:'pensativo',t:'Misiones y evaluación',x:'Las dos misiones mayores, el ePortfolio y el examen con los <b>requisitos oficiales</b>, más los documentos para descargar.'}
  ];
  var REF=[
   {p:'crear.html',sel:'',pose:'tablet',t:'Referente: crear un grupo',x:'Los grupos se crean <b>aquí</b>, con tu cuenta de Google: nombre, tipo REGULAR/PUA, primer día de la semana 1, los enlaces de la clase y el equipo docente. En un minuto queda sembrado entero —los retos, los 8 planetas, la tienda, los escuadrones y el álbum— y sale su <b>código de clase</b>.'},
   {p:'crear.html',sel:'',pose:'senala',t:'Referente: el equipo y la fecha',x:'No hay PIN que repartir. Pones a cada docente con <b>su correo</b> en el equipo y con eso entra en Mis grupos iniciando sesión con Google; si alguien se va, lo quitas del equipo y deja de entrar. Lo que sí tienes que poner bien es la <b>fecha de la semana 1</b>: marca el ritmo de todo, desde la orden de la semana hasta los desbloqueos de la Nave.'}
  ];
  var FINAL={p:'consola.html',sel:'.gp',listo:'.gp',espera:1,pose:'pulgar',t:'Listo para el salto',x:'Eso es todo, Capitán. Cuando quieras repasarlo, <b>▶ Visita guiada</b> en la barra de arriba; y las dudas de siempre, en las <a href="guia.html#faq">preguntas frecuentes</a>. Recuerda: <b>una obra que no se documenta, no existe</b>. Corto y cierro.'};
  // v3.35 · VISITAS DE UNA SOLA PÁGINA. La de arriba recorre toda la web; una página puede declarar
  // la suya con `window.SG_TOUR_LOCAL = {clave, pasos:[…]}` — es lo que hace la sala del docente para
  // explicar el ORDEN de lo que tiene que hacer el alumnado. No salta de página y lleva su propia
  // cuenta de «ya vista», para que una no borre a la otra.
  function local(){ return window.SG_TOUR_LOCAL || null; }
  var modo='global';
  function steps(){
    if(modo==='local'){ var L=local(); return (L&&L.pasos)||[]; }
    // lo del referente, solo a quien lo es: fuera de la lista (no «saltado»), para que el contador
    // «N / total» no se coma números por el camino
    var ref = localStorage.getItem(KEYR)==='ref';
    return (ref ? BASE.concat(REF) : BASE.filter(function(x){ return !x.soloRef; })).concat([FINAL]); }
  var KEY='sgTourStep';
  function clavePaso(){ return modo==='local' ? 'sgTour_'+(local().clave||'x')+'_paso' : KEY; }
  function claveHecha(){ return modo==='local' ? 'sgTour_'+(local().clave||'x')+'_hecha' : 'sgTourDone'; }
  // Un paso puede traer un objetivo de reserva: el enlace del que habla no siempre existe (un PER sin
  // formularios publicados todavía), y entonces se señala el bloque que lo contiene.
  function objetivo(s){ var t=document.querySelector(s.sel); return t || (s.sel2 ? document.querySelector(s.sel2) : null); }
  function page(){var p=location.pathname.split('/').pop(); return p||'index.html';}
  function qs(){var m=location.search.match(/[?&]tour=(\d+)/); return m?parseInt(m[1],10):null;}
  var ov=null, recien=true, vigia=null, manual=false;
  // mousedown incluido: arrastrar la barra de scroll no dispara «wheel», y ahi tambien manda el usuario
  ['wheel','touchstart','keydown','mousedown'].forEach(function(ev){
    window.addEventListener(ev,function(){manual=true;},{passive:true});});
  function clearTarget(){Array.prototype.forEach.call(document.querySelectorAll('.tour-target'),function(e){e.classList.remove('tour-target');});}
  // v3.30 - EL SCROLL DE LA VISITA. scrollIntoView({block:'center'}) fallaba por dos motivos: al
  // llegar desde otra pagina se dispara mientras el navegador todavia esta colocando su propio
  // scroll, que lo cancela -por eso la visita se quedaba arriba del todo-; y con un objetivo mas
  // alto que la ventana, «centrar» deja el titulo fuera de plano. Ahora la posicion se calcula a
  // mano (debajo de la barra pegajosa y sin que el panel del Capitan tape lo señalado) y se
  // reintenta mientras la pagina siga creciendo, que las miniaturas de YouTube entran tarde.
  function altoBarra(){var n=document.querySelector('.nav'); if(!n) return 0;
    var p=getComputedStyle(n).position; return (p==='sticky'||p==='fixed')?n.getBoundingClientRect().height:0;}
  function donde(tg){
    var arriba=window.pageYOffset||document.documentElement.scrollTop||0;
    var r=tg.getBoundingClientRect(), y=r.top+arriba;
    var vh=document.documentElement.clientHeight, barra=altoBarra(), reserva=0;
    var caja=ov&&ov.querySelector('.tour-box');
    if(caja){var c=caja.getBoundingClientRect(); if(c.right>r.left&&c.left<r.right) reserva=c.height+24;}
    var libre=Math.max(140, vh-barra-reserva);
    var margen=(r.height>libre-32)?20:Math.max(20,(libre-r.height)/2);
    var tope=Math.max(0, document.documentElement.scrollHeight-vh);
    return Math.max(0, Math.min(tope, Math.round(y-barra-margen)));
  }
  function enfocar(tg,instante){
    if(vigia){clearInterval(vigia); vigia=null;}
    if(!tg) return;
    manual=false;
    // El CSS de la web pone html{scroll-behavior:smooth}, asi que hasta el ajuste mas pequeño se
    // convertia en una animacion; y mientras dura, lo que mide el guion no cuadra con lo que se ve
    // en pantalla, asi que el ajuste siguiente salia disparado (se iba 500 px de largo). Los
    // reajustes cortan en seco —y devuelven el CSS a su sitio— y solo el salto de paso es suave.
    function ir(suave){var y=donde(tg), arriba=window.pageYOffset||document.documentElement.scrollTop||0;
      if(Math.abs(y-arriba)<6) return;
      var raiz=document.documentElement, antes=raiz.style.scrollBehavior;
      if(!suave) raiz.style.scrollBehavior='auto';
      try{window.scrollTo({top:y,behavior:suave?'smooth':'auto'});}catch(e){window.scrollTo(0,y);}
      if(!suave) raiz.style.scrollBehavior=antes;}
    ir(!instante);
    // En la web de verdad la pagina sigue moviendose MUCHO despues de que el guion arranque: las
    // fotos entran sin medidas puestas y lo empujan todo. Asi que no basta con reintentar un par de
    // segundos: se insiste hasta que el objetivo lleve tres vueltas quieto y la pagina este cargada
    // del todo (con tope de 9 segundos), y se suelta el volante en cuanto el usuario toca la rueda.
    var t0 = new Date().getTime(), antes = null, quietas = 0;
    if (document.readyState !== 'complete')
      window.addEventListener('load', function(){ if(!manual) ir(false); });
    setTimeout(function(){
      if (manual) return;
      vigia = setInterval(function(){
        if (manual) { clearInterval(vigia); vigia=null; return; }
        var pos = Math.round(tg.getBoundingClientRect().top + (window.pageYOffset||document.documentElement.scrollTop||0));
        if (pos === antes) quietas++; else { quietas = 0; antes = pos; }
        ir(false);
        if ((document.readyState === 'complete' && quietas >= 3) || new Date().getTime()-t0 > 9000) {
          clearInterval(vigia); vigia = null;
        }
      }, 220);
    }, instante ? 120 : 700);
  }
  var esperando=null, sentido=1;
  function render(i, intento){
    var S=steps(); var s=S[i]; if(!s) return end();
    if(s.p&&s.p!==page()){localStorage.setItem(KEY,String(i)); location.href=s.p+'?tour='+i; return;}
    localStorage.setItem(clavePaso(),String(i));
    clearTarget();
    var tg=s.sel?objetivo(s):null;
    // la página aún no ha pintado lo que se señala (Mis grupos espera a la sesión): se aguarda, pero
    // solo mientras la página no esté lista (`listo`: sus grupos ya pintados). Lista y sin objetivo,
    // el objetivo no va a llegar: no se hace esperar a nadie.
    var lista = !s.listo || !!document.querySelector(s.listo);
    if(!tg && s.sel && s.espera && !lista && (intento||0) < 30){
      clearTimeout(esperando); esperando=setTimeout(function(){ render(i,(intento||0)+1); }, 250); return; }
    // si el paso depende de algo que en esta cuenta no existe (la zona del referente), se salta
    if(!tg && s.si){ var k=i+sentido; if(k>=0 && k<S.length) return render(k); }
    // y lo del referente se decide ANTES de pintar el contador, para que «1 / N» no cambie de N al paso 2
    if(s.rol && tg){ try{ localStorage.setItem(KEYR, document.querySelector('.ref-zona') ? 'ref' : 'doc'); }catch(e){} S=steps(); }
    if(tg){tg.classList.add('tour-target'); if(tg.tagName==='DETAILS') tg.open=true;}
    if(!ov){ov=document.createElement('div'); ov.className='tour'; document.body.appendChild(ov);}
    var btns = s.ask
      ? '<button type="button" class="tour-rol primary" data-rol="ref">🛰️ Sí, soy referente</button>'
        +'<button type="button" class="tour-rol" data-rol="doc">🎓 Imparto clases</button>'
        +'<button type="button" class="tour-exit">Salir</button>'
      : '<button type="button" class="tour-prev"'+(i===0?' disabled':'')+'>← Anterior</button>'
        +'<button type="button" class="tour-next primary">'+(i===S.length-1?'Terminar ✓':'Siguiente →')+'</button>'
        +'<button type="button" class="tour-exit">Salir</button>';
    ov.innerHTML='<div class="tour-box"><img class="tour-cap" src="assets/img/capitan/'+s.pose+'.png" alt="El Capitán">'
      +'<div class="tour-panel"><div class="tour-step">Visita guiada · '+(i+1)+' / '+S.length+'</div><h3>'+s.t+'</h3><p>'+s.x+'</p>'
      +'<div class="tour-btns">'+btns+'</div></div></div>';
    if(s.ask){ Array.prototype.forEach.call(ov.querySelectorAll('.tour-rol'),function(b){ b.onclick=function(){ localStorage.setItem(KEYR,b.getAttribute('data-rol')); render(i+1); }; }); }
    else { ov.querySelector('.tour-prev').onclick=function(){sentido=-1; render(i-1);};
           ov.querySelector('.tour-next').onclick=function(){sentido=1; if(i===S.length-1) end(); else render(i+1);}; }
    ov.querySelector('.tour-exit').onclick=end;
    ov.classList.add('open');
    enfocar(tg,recien); recien=false;   // el panel ya esta puesto: ahora se sabe cuanto tapa
  }
  function end(){localStorage.removeItem(clavePaso()); localStorage.setItem(claveHecha(),'1'); clearTarget();
    if(ov){ov.classList.remove('open'); ov.innerHTML='';}
    if(qs()!==null) history.replaceState(null,'',location.pathname);}
  document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.tour-start'); if(b){e.preventDefault();
    // El botón de la barra enseña LA VISITA DE ESTA PÁGINA si la hay y ya está pintada. Si todavía
    // no lo está —en la sala del docente hay que pasar el PIN antes—, no habría nada que señalar,
    // así que hace lo de siempre: la visita general de la web.
    var L=local();
    modo=(L&&L.pasos&&L.pasos.length&&document.querySelector(L.pasos[0].sel))?'local':'global';
    recien=true; render(0);}});
  // La página avisa cuando ya tiene algo que enseñar (ver clase.js). Se ofrece una sola vez.
  var ofrecida=false;
  window.sgTour={
    empezarLocal:function(){ var L=local(); if(!L)return; modo='local'; recien=true; render(0); },
    ofrecerLocal:function(){
      var L=local(); if(!L||ofrecida||localStorage.getItem('sgTour_'+(L.clave||'x')+'_hecha')) return;
      if(!document.querySelector(L.pasos[0].sel)) return;
      ofrecida=true;
      // una invitación cada vez: la de la visita general pudo quedarse abierta en la pantalla anterior
      Array.prototype.forEach.call(document.querySelectorAll('.tour-invite'),function(x){x.remove();});
      var inv=document.createElement('div'); inv.className='tour-invite';
      inv.innerHTML='<img src="assets/img/capitan/saluda.png" alt=""><div><b>'+(L.invita||'¿Te enseño esta sala?')+'</b><br>'
        +(L.invita2||'Sobre todo, el orden en que tu alumnado tiene que hacer las cosas.')+'</div>'
        +'<button type="button" class="tour-aqui">Empezar</button><button type="button" class="x" aria-label="Cerrar">✕</button>';
      document.body.appendChild(inv);
      inv.querySelector('.x').onclick=function(){inv.remove(); localStorage.setItem('sgTour_'+(L.clave||'x')+'_hecha','1');};
      inv.querySelector('.tour-aqui').onclick=function(){inv.remove(); window.sgTour.empezarLocal();};
    }};
  // al saltar de pagina en pagina, el navegador restaura SU scroll y se lleva por delante el nuestro
  var q=qs(); if(q!==null){ try{ if('scrollRestoration' in history) history.scrollRestoration='manual'; }catch(e){} render(q); }
  // 🔴 9-sep · LA INVITACION SE MUDA A LA GUIA. Vivia en index.html cuando index.html ERA el puesto
  // de mando. Desde que la portada es la puerta publica del proyecto, el globo del Capitan le
  // preguntaba «¿primera vez en el puesto de mando?» a cualquiera que pasara por ahi — a un
  // estudiante, a alguien de fuera. Ahora saluda en guia.html, la primera parada de quien lee el
  // metodo. 🔴 12-sep · «Soy docente» ya NO lleva a la guia sino a consola.html: quien pulsa eso
  // quiere ENTRAR, no leer, y la guia es un documento.
  // 🔴 13-sep · Y SALUDA SOBRE TODO EN «MIS GRUPOS», que es donde aterriza el docente al entrar: la
  // guía era la primera parada de quien leía el método, pero hoy la primera parada es su puesto de
  // mando. Allí espera a que estén pintados sus grupos (sin sesión no hay nada que enseñar) y no sale
  // dentro de un grupo abierto, que tiene su propia visita.
  function invitar(){
    if(localStorage.getItem('sgTourDone') || localStorage.getItem(KEY) || document.querySelector('.tour-invite')) return;
    var inv=document.createElement('div'); inv.className='tour-invite';
    inv.innerHTML='<img src="assets/img/capitan/saluda.png" alt=""><div><b>¿Primera vez en el puesto de mando?</b><br>Te lo enseño en dos minutos.</div><button type="button" class="tour-start">Empezar</button><button type="button" class="x" aria-label="Cerrar">✕</button>';
    document.body.appendChild(inv);
    inv.querySelector('.x').onclick=function(){inv.remove(); localStorage.setItem('sgTourDone','1');};
    inv.querySelector('.tour-start').addEventListener('click',function(){inv.remove();});
  }
  if(q===null && page()==='guia.html') invitar();
  if(q===null && page()==='consola.html'){
    var vueltas=0, vigila=setInterval(function(){
      if(document.querySelector('.gp')){ clearInterval(vigila); invitar(); }
      else if(++vueltas>60) clearInterval(vigila);
    }, 300);
  }
})();
"""

os.makedirs(os.path.join(HERE,"assets","js"),exist_ok=True)
_cardv = hashlib.md5(b"".join(open(os.path.join(HERE,"assets","img","tarjetas",k+"_carta.png"),"rb").read() for k in CARDS)).hexdigest()[:10]
js = (JS_TEMPLATE.replace("__BADGE__", json.dumps(BADGE_INFO, ensure_ascii=False))
                 .replace("__CARDS__", json.dumps(CARD_TITLES, ensure_ascii=False))
                 .replace("__CARDV__", _cardv)
                 .replace("__MONEDA__", json.dumps(MONEDA, ensure_ascii=False))
                 .replace("__RANGOS__", json.dumps(RANGOS, ensure_ascii=False))
                 .replace("__NIVELES__", json.dumps([list(n) for n in NIVELES], ensure_ascii=False))
                 .replace("__XPVIAJE__", json.dumps(XP_VIAJE, ensure_ascii=False)))
def _js_valido(nombre, codigo):
    """Comprueba la sintaxis del JS generado antes de escribirlo. Sin esto, un error de comillas se
    publica tal cual y la página se queda sin window.SG: la Nave carga a medias y nada lo canta."""
    import subprocess, tempfile
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as t:
        t.write(codigo); ruta = t.name
    r = subprocess.run(["node", "--check", ruta], capture_output=True, text=True)
    os.unlink(ruta)
    if r.returncode != 0:
        raise SystemExit("\n🔴 %s tiene un error de sintaxis y NO se ha escrito:\n%s" % (nombre, r.stderr))

_js_valido("stargate.js", js)
open(os.path.join(HERE,"assets","js","stargate.js"),"w",encoding="utf-8").write(js)
open(os.path.join(HERE,"assets","js","tour.js"),"w",encoding="utf-8").write(
  TOUR_JS.replace("__CRED_A__", str(CREDITOS["retoA"])).replace("__CRED_B__", str(CREDITOS["retoB"])))

# 🔴 Y TODOS los .js del sitio, no solo los generados aquí. El 27-ago se desplegó un `recluta.js`
# con una línea metida entre un `if` y su `else if`: el fichero entero dejaba de compilar y la Nave
# se quedaba EN BLANCO para todos los grupos. Nadie lo cantó — el banco prueba el Apps Script, no el
# JS del navegador—, y se descubrió porque un profesor dijo «no se puede hacer nada aquí».
# Un fichero roto no se puede desplegar: el build se para.
_dir_js = os.path.join(HERE, "assets", "js")
_rotos = []
for _f in sorted(os.listdir(_dir_js)):
    if not _f.endswith(".js"):
        continue
    _r = subprocess.run(["node", "--check", os.path.join(_dir_js, _f)], capture_output=True, text=True)
    if _r.returncode != 0:
        _rotos.append((_f, (_r.stderr or "").strip().split("\n")[:4]))
if _rotos:
    raise SystemExit("\n🔴 NO SE PUBLICA: %d fichero(s) JS no compilan\n\n%s"
                     % (len(_rotos), "\n\n".join("   " + f + "\n      " + "\n      ".join(e)
                                                  for f, e in _rotos)))
print("js: los %d ficheros de assets/js compilan" %
      len([f for f in os.listdir(_dir_js) if f.endswith(".js")]))

# ================= CÓMO SE HIZO (comosehizo.html) =================
# Norberto quiso una página propia: «hacer clic e ir a otra página con todo explicado». La portada
# se queda con el adelanto y el botón; aquí cabe el detalle sin apretar.
# 🔴 PÚBLICA: sin puerta.js. Es la cara del proyecto hacia fuera, igual que la portada.
casting_html = "\n".join(
  '<tr><td><b>{n}</b><em>{p}</em></td><td>{v}</td><td class="nota">{a}</td></tr>'.format(
     n=n_, p=p_, v=v_, a=a_) for n_, p_, v_, a_ in CASTING)

COMOSEHIZO = head("STARGATE · Cómo se hizo",
  "El proceso real detrás de STARGATE: la narrativa a cuatro manos, el casting de voces, las anclas "
  "de personaje, los modelos y los borradores. Contado con los datos de producción.",
  "comosehizo", publica=True) + f'''
<header class="hero"><div class="kicker">Cómo se hizo</div>
<h1>Esto lo ha montado un profesor</h1>
<p>Sin estudio, sin productora y sin equipo: un docente, un ordenador y cuatro herramientas. Lo cuento entero —incluida la parte fea— porque la pregunta que más me hacen
al enseñarlo es «¿y esto cuánto cuesta encargarlo?», y la respuesta es que no se encargó.</p>
<p style="margin-top:18px"><span class="pill">17 vídeos</span><span class="pill">8 planetas</span>
<span class="pill">24 insignias</span><span class="pill">26 cartas</span></p>
</header>

<section><div class="wrap">
<div class="eyebrow teal">Las herramientas</div><h2>Una que dirige y tres que ejecutan</h2>
{comohizo_html}
<!-- 🔴 Si hay botones, se dice que son de afiliado y que gana cada parte. Ver bateria 43. -->
<p class="small muted" style="margin-top:14px">Los botones son <b>enlaces de afiliado</b>, y se dice
para que lo sepas. Donde la herramienta lo ofrece, <b>quien entra por ahí se lleva un descuento o un
crédito de bienvenida</b>; y en todos los casos este proyecto recibe créditos que se reinvierten en
seguir ampliando la aventura. Puedes ir a sus webs directamente y no pasa nada.</p>
<!-- 🔴 Los logos son de sus dueños y se usan para DECIR QUE SE USARON, nada mas. La politica de
     afiliados de OpenArt prohibe expresamente dar a entender una relacion que no existe. -->
<p class="small muted">Los logos pertenecen a sus respectivas empresas y aparecen aquí solo para
identificar las herramientas que se usaron. <b>Este proyecto no está afiliado a ninguna de ellas
ni cuenta con su respaldo</b>.</p>

<div class="two" style="margin-top:30px">
<div>
<h3>La pieza que no se ve: MCP</h3>
<p class="small">Es un estándar que permite conectar herramientas externas a Claude para que pueda
usarlas <b>durante la conversación</b>, sin que nadie copie y pegue de una ventana a otra. Pedir una
imagen, recibirla, decir «el casco más oscuro» y que la siguiente salga corregida — todo en el mismo
hilo.</p>
<p class="small">Eso es lo que convierte un rato de trabajo en algo terminado: no es que la máquina
haga el proyecto, es que <b>deja de haber costuras</b> entre pensar, escribir, dibujar y montar.</p>
</div>
<div>
<h3>Y lo que sigue siendo trabajo humano</h3>
<p class="small">La narrativa, la decisión pedagógica de qué se evalúa y qué no, el criterio para
tirar a la basura lo que no funcionaba y <b>revisarlo todo</b>. Las herramientas aceleran; no
deciden. Los ocho planetas son ocho temas de verdad, con sus rúbricas y su programación oficial
detrás.</p>
</div>
</div>
</div></section>

<section><div class="wrap">
<div class="eyebrow teal">El proceso</div><h2>De una idea a diecisiete vídeos</h2>
<p class="lead small">Sin saltarse la parte fea, que es la que más se calla.</p>
<div class="pasos-proc">{proceso_html}</div>
<div class="cifras">{cifras_html}</div>
<p class="small muted">Estas cifras se cuentan solas del disco cada vez que se publica esta web: si
mañana hay tres planos más, aquí lo pone.</p>
</div></section>

<section><div class="wrap">
<div class="eyebrow amber">El casting</div>
<h2 class="con-logo"><span class="logo-app peq"><img src="assets/img/logos/elevenlabs.svg" alt="ElevenLabs" loading="lazy"></span> Nueve voces con nombre y apellidos</h2>
<p class="lead">Cada tripulante tiene una voz elegida a mano en <b>ElevenLabs</b>, con acentos de
varios países <b>a propósito</b>: la Tripulación Cero se reclutó por todo el mundo, y se nota al
oírla. No todas salieron a la primera.</p>
<div class="scroll-x"><table class="casting">
<tr><th>Personaje</th><th>Voz</th><th>Por qué esa</th></tr>
{casting_html}
</table></div>
<p class="small muted">Los <b>recasts</b> están en la tabla a propósito. Una voz que no encaja se
nota en el primer segundo, y arreglarlo es una llamada — no rehacer el vídeo.</p>
</div></section>

<section><div class="wrap">
<div class="eyebrow teal">Las decisiones</div><h2>Por qué así y no de otra manera</h2>
<div class="grid cols-2">
<div class="card"><h3>Un sufijo de estilo, repetido en todas</h3><p class="small">Todas las imágenes
llevan pegada la misma coletilla: <i>«cinematic sci-fi, dark teal and electric blue palette, amber
accents, volumetric light, full-frame no letterbox, 16:9»</i>. Es aburrido y es justo lo que hace
que ocho planetas distintos parezcan la misma galaxia.</p></div>
<div class="card"><h3>Anclas, no descripciones</h3><p class="small">Describir a un personaje con
palabras da un parecido distinto cada vez. Las <b>anclas</b> se crearon <b>subiendo los originales</b>,
no regenerándolos. Y si en un plano hay varios personajes hay que pasarlas <b>todas</b>, o el modelo
se inventa al que falta: eso se aprendió fallando.</p></div>
<div class="card"><h3>Imágenes quietas, animadas después</h3><p class="small">Generar vídeo entero
para cada plano sería carísimo. Casi todo son <b>imágenes fijas con paneo real</b> —no solo zoom—
sobre un lienzo mucho más grande, para que no tiemblen. El vídeo generado se reserva para los planos
que de verdad lo piden.</p></div>
<div class="card"><h3>Los vídeos no nombran aplicaciones</h3><p class="small">Ni una herramienta
concreta dentro de la narrativa: solo conceptos. Así el material <b>no caduca</b> cuando una app
cambia de nombre o desaparece. Lo actual va en los mensajes semanales, que sí se reescriben.</p></div>
</div>
</div></section>

<section><div class="wrap">
<div class="two">
<div>
<div class="eyebrow amber">Si te sirve</div><h2>Cógelo</h2>
<p class="lead">Está contado para eso. Si das clase y quieres montar algo parecido en tu asignatura,
lo que necesitas no es un equipo: es tiempo, criterio para tirar lo que no funciona y aguantar los
borradores.</p>
<p><a class="btn primary" href="index.html">Ver el proyecto ↗</a></p>
</div>
<div class="trio trio-amenaza"><img src="assets/img/personajes/nebula.png" alt="NEBULA"><img src="assets/img/capitan/brazos.png" alt="El Capitán"><img src="assets/img/personajes/vaeon.png" alt="General Vaeon"></div>
</div>
</div></section>
''' + FOOT

# ================= AYUDA PARA EL ALUMNADO (ayuda.html) =================
# 🔴 PÚBLICA y sin PIN: la usa el alumnado, que no tiene. Nace de dos grabaciones de pantalla de
# Norberto (11-sep) — los GIF salen de ahí, no de una reconstrucción.
# ================= v3.64 · POLÍTICA DE PRIVACIDAD =================
# 🔴 Pública a propósito, y sin la puerta del PIN: Google la EXIGE accesible sin iniciar sesión para
# publicar la aplicación de «Iniciar sesión con Google», y el alumnado tiene derecho a leerla antes
# de pulsar el botón. Una política detrás de un PIN no es una política.
# Se describe lo que el sistema hace DE VERDAD, no lo que quedaría bonito: si mañana cambia lo que
# se recoge, esto se cambia el mismo día.
PRIVACIDAD = head("STARGATE · Política de privacidad",
  "Qué datos recoge STARGATE, para qué, quién los ve y cómo pedir que se borren.",
  "", publica=True) + '''
<header class="hero"><div class="kicker">Última actualización: 13 de septiembre de 2026</div>
<h1>Política de privacidad</h1>
<p>STARGATE · La Bitácora Estelar es el <b>proyecto gamificado del Máster en Tecnología Educativa de
la UNIR</b>. Esta página cuenta, sin rodeos, qué datos se recogen, para qué sirven, quién puede
verlos y cómo pedir que se borren.</p></header>

<section><div class="wrap">

<h2>1 · Quién trata los datos</h2>
<p>El profesorado del máster, encabezado por <b>Norberto Cuartero</b>, con fines exclusivamente
docentes dentro de la asignatura. Para cualquier cosa relacionada con tus datos:
<a href="mailto:n.cuartero.10@gmail.com">n.cuartero.10@gmail.com</a>.</p>

<h2>2 · Qué datos se recogen</h2>
<p>Solo lo necesario para que el juego funcione. Nada más.</p>

<h3>Al iniciar sesión con Google (es la única forma de entrar)</h3>
<p>Se recibe <b>tu dirección de correo y tu nombre público</b>. Nada más. En concreto:</p>
<ul>
<li>🔴 <b>No</b> se recibe ni se pide tu contraseña.</li>
<li>🔴 <b>No</b> hay acceso a tu Drive, tu Gmail, tus contactos ni tus documentos. La pantalla de
  permisos de Google lo dice: solo «ver tu dirección de correo electrónico».</li>
<li>El correo sirve para <b>encontrar tu ficha</b> y para que nadie pueda registrar misiones ni
  canjear recompensas haciéndose pasar por ti.</li>
</ul>

<h3>Lo que escribes tú</h3>
<ul>
<li><b>Nombre y apellidos</b>, para que el profesorado sepa a quién corresponde cada progreso.</li>
<li><b>Alias de recluta</b>: el nombre que se ve en público.</li>
<li><b>Quién imparte tu clase</b>, para que tu docente vea tu progreso.</li>
<li><b>El enlace a tu Bitácora</b> (tu ePortfolio) y las evidencias de cada misión.</li>
<li>Una <b>biografía breve</b> de tu personaje, si quieres escribirla.</li>
</ul>

<h3>Lo que genera el juego</h3>
<p>Misiones completadas, experiencia, nivel, créditos, insignias, cartas y recompensas canjeadas.</p>

<h3>Los tickets de salida</h3>
<p><b>Son anónimos.</b> No se guarda quién los escribe. Sirven para que el docente sepa qué ha
quedado flojo en clase, no para saber quién lo dijo.</p>

<h2>3 · Dónde se guardan</h2>
<p>En <b>Google Firebase</b> (la base de datos de Google Cloud), dentro de un proyecto gestionado por el
equipo docente del máster. Los <b>tickets de salida</b>, que son anónimos, van a un formulario y una hoja de
cálculo de Google. No hay servidores propios para los datos: la infraestructura es de Google, con conexión
cifrada, y las reglas de la base de datos impiden que nadie lea la ficha de otra persona.</p>

<h2>4 · Quién puede verlos</h2>
<ul>
<li><b>El profesorado de tu asignatura.</b> Cada docente ve a su grupo.</li>
<li>🔴 <b>El tablero público de clase enseña SOLO tu alias</b>, tu avatar y tus puntos. Nunca tu
  correo ni tu nombre real, ni siquiera si el docente comparte pantalla. Está construido así a
  propósito: esos datos no salen del servidor.</li>
<li><b>Nadie más.</b> No se venden, no se ceden, no se usan para publicidad y no se comparten con
  ninguna empresa. Tampoco hay analítica ni rastreo de terceros en esta web.</li>
</ul>

<h2>5 · Cuánto tiempo</h2>
<p>Durante el curso y el periodo de evaluación. Después el grupo se archiva, y se borra cuando ya no
hace falta para justificar las calificaciones. Puedes pedir que se borre lo tuyo antes.</p>

<h2>6 · Tus derechos</h2>
<p>Puedes pedir <b>ver, corregir o borrar</b> tus datos cuando quieras, y <b>retirar el permiso</b>
que le diste a la aplicación desde
<a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener">tu cuenta de
Google</a>. Escribe a <a href="mailto:n.cuartero.10@gmail.com">n.cuartero.10@gmail.com</a> y se
atiende.</p>
<p class="small muted">Participar en la gamificación es <b>voluntario</b>: si prefieres no usarla,
díselo a tu docente y se acuerda otra forma de seguir la asignatura.</p>

<h2>7 · Si esto cambia</h2>
<p>Si algún día se recoge algo distinto, se cambia esta página <b>el mismo día</b> y se avisa en
clase. La fecha de arriba dice cuándo se tocó por última vez.</p>

</div></section>
''' + FOOT

AYUDA = head("STARGATE · Cómo comparto mi evidencia",
  "Los dos enlaces que más se fallan al registrar un reto: la publicación de Padlet y la página "
  "concreta de un Genially. Con los pasos en movimiento.",
  "ayuda", publica=True) + '''
<header class="hero"><div class="kicker">Guía rápida · alumnado</div>
<h1>Que tu enlace abra <i>lo tuyo</i></h1>
<p>Cuando un reto te pide un enlace, ese enlace tiene que llevar <b>directamente a tu trabajo</b>:
no al muro entero, no al genially por la primera página. Si quien lo abre tiene que buscarte, la
evidencia no cuenta como evidencia.</p>
<p style="margin-top:16px"><span class="pill">2 minutos</span><span class="pill">sirve para toda la asignatura</span></p>
</header>

<section><div class="wrap">
<div class="eyebrow teal">Padlet</div><h2>El enlace a <i>tu</i> publicación</h2>
<p class="lead">Copiar la dirección del navegador te da el muro entero, con las publicaciones de
todo el mundo. Lo que hace falta es el enlace de <b>tu chincheta</b>.</p>
<div class="two">
<div>
<ol class="pasos-num">
<li>Pon el ratón sobre <b>tu publicación</b>.</li>
<li>Pulsa los <b>tres puntos</b> (⋮) de la esquina.</li>
<li>Elige <b>«Copiar el enlace a la publicación»</b>.</li>
<li>Pégalo en la casilla del enlace del reto, en tu Nave, y pulsa «Lo he hecho». Ya está.</li>
</ol>
<p class="small muted">Ojo: «Abrir publicación» solo la abre para ti. El que copia el enlace es el
tercero de la lista.</p>
</div>
<div><img class="gif-ayuda" src="assets/img/ayuda/compartir-padlet.gif"
  alt="Pulsar los tres puntos de una publicación de Padlet y elegir «Copiar el enlace a la publicación»"
  loading="lazy" width="640"></div>
</div>
</div></section>

<section><div class="wrap">
<div class="eyebrow amber">Genially</div><h2>Compartir desde <i>una página concreta</i></h2>
<p class="lead">Un genially puede tener veinte páginas. Si mandas el enlace normal, se abre por la
primera y hay que buscar la tuya. Se puede mandar <b>abierto por la página exacta</b>, pero solo
desde el <b>modo visualización</b> — no desde el editor.</p>
<div class="two">
<div>
<ol class="pasos-num">
<li>En el editor, pulsa <b>Presentar</b> y luego <b>«Mostrar creación»</b>. Eso lo abre en modo
visualización, que es donde está la opción.</li>
<li>Ve a la <b>página que quieres compartir</b>.</li>
<li>Abajo a la derecha, pulsa <b>«Opciones del genially»</b> (⋯).</li>
<li>En la pestaña <b>Enlace</b>, marca <b>«Compartir desde esta página»</b>. Verás que la dirección
cambia y se le añade un trozo al final.</li>
<li>Pulsa <b>«Copiar enlace»</b> y pégalo.</li>
</ol>
<p class="small muted">Si el enlace que copias no lleva ese trozo al final, es que la casilla no
estaba marcada: se abrirá por la primera página.</p>
</div>
<div><img class="gif-ayuda" src="assets/img/ayuda/compartir-genially.gif"
  alt="Abrir el genially en modo visualización, ir a la página, abrir Opciones y marcar «Compartir desde esta página»"
  loading="lazy" width="760"></div>
</div>
</div></section>

<section><div class="wrap">
<div class="card"><h3>Antes de enviar, compruébalo</h3>
<p class="small">Abre tu propio enlace en una <b>ventana de incógnito</b> (o pásaselo a alguien).
Si se abre justo donde tiene que abrirse y sin pedir permisos, está bien. Es el minuto mejor
invertido de todo el reto.</p>
<p style="margin-top:14px"><a class="btn primary" href="recluta.html">🚀 Volver a mi Nave</a></p></div>
</div></section>
''' + FOOT

# ================= 12-sep · EL ARCHIVO: LA HOJA DE CÁLCULO =================
# 🔴 Por qué esta página existe y no un `rm -rf`. Norberto pidió «borrar (o dejar en legacy) todo lo
# de la hoja de cálculo». Borrarlo sin más dejaría dos agujeros: los grupos que YA están corriendo
# sobre el motor viejo —con gente dentro— y la memoria de por qué el sistema es como es. Un archivo
# cuesta una página y evita las dos cosas.
LEGACY = head("STARGATE · El archivo: la hoja de cálculo",
  "Cómo funcionaba STARGATE antes del 12 de septiembre de 2026, qué pasó con los grupos de entonces "
  "y cómo volver atrás si hiciera falta.",
  "", publica=True) + '''
<header class="hero"><div class="kicker">Archivo · retirado el 12 de septiembre de 2026</div>
<h1>La hoja de cálculo</h1>
<p>Durante un año STARGATE vivió dentro de una hoja de cálculo de Google con un menú propio y tres
formularios por grupo. Funcionaba. Esta página cuenta cómo era, <b>qué pasó con los grupos que la
usaban</b> y cómo volver atrás si algún día hiciera falta.</p>
<p class="small muted">Si buscas cómo se crea un grupo <b>hoy</b>, está en
<a href="pasos.html#referente">Cómo se hace</a>.</p></header>

<section><div class="wrap">

<h2>Qué se ha retirado, y qué no</h2>
<div class="grid2">
<div class="card"><h3>Retirado para grupos nuevos</h3>
<p>El menú <b>STARGATE</b> de la hoja, los tres formularios por grupo (Bitácora, canje y ticket), el
documento de enlaces, los dos PIN y el dossier del profesorado. Nada de eso hace falta ya: un grupo
se crea desde <a href="crear.html">la consola del referente</a> y se gobierna desde
<a href="consola.html">el puesto de mando</a>.</p></div>
<div class="card"><h3>Sigue en pie</h3>
<p><b>Los grupos que ya estaban corriendo.</b> No se han tocado ni se van a migrar a la fuerza: su
Nave, su tablero y su sala funcionan igual que ayer. La web sabe con qué motor hablar en cada caso, y
un grupo viejo se abre añadiendo <code>?motor=apps</code> si hiciera falta forzarlo.</p></div>
</div>

<h2>Por qué se cambió</h2>
<p>No fue por gusto. Apps Script tiene un techo de <b>30 ejecuciones a la vez</b>, y el máster mete
unos 200 estudiantes por grupo con grupos solapados. El día que una clase entera abriera la Nave a la
vez, el primero esperaba y el resto recibía un error. Calcular el tablero costaba entre 2 y 10
segundos y había que recalcularlo entero para devolver <i>una</i> ficha.</p>
<p>Lo que hay debajo ahora es el motor de <b>GamificaPro</b> —Firestore y funciones en servidor—, que
no tiene ese techo. STARGATE conserva su cara: la misma web, los mismos retos, las mismas insignias.
Por dentro cambia quién lleva las cuentas.</p>

<h2>Qué se ganó por el camino</h2>
<ul class="lista">
<li><b>Se acabaron los PIN.</b> Un PIN compartido identifica al grupo, no a la persona: quien lo
tuviera podía escribir el correo de un compañero y entrar en su sala. Ahora se entra con la cuenta de
Google y quien pregunta <i>es</i> quien ha entrado.</li>
<li><b>Un enlace en vez de tres formularios.</b> El alumnado se alista una vez y marca sus retos
desde la propia Nave, viendo subir los puntos en el momento.</li>
<li><b>Un ticket de salida para siempre.</b> Antes se creaba uno por grupo; ahora es uno solo, con dos
huecos que se rellenan solos. Sigue siendo un formulario de Google porque tiene que ser
<b>anónimo</b>.</li>
<li><b>Enlaces de validación reutilizables.</b> Un botón en un Genially vale para el mismo reto en
cualquier grupo y en cualquier curso: se montan una vez y se olvidan.</li>
</ul>

<h2>Dónde están los datos de antes</h2>
<p>Donde estaban. La hoja maestra sigue en la cuenta de la asignatura con sus pestañas de respuestas,
y los formularios de los grupos que la usan siguen abiertos. No se ha borrado ni una fila.</p>
<p>Los <b>tickets de salida</b> son la excepción, y a mejor: desde ahora se recogen en una hoja
propia, compartida por todos los grupos y todos los años, para que la hoja maestra se pueda congelar
el día que toque sin arrastrar nada.</p>

<h2>Cómo era</h2>
<p class="small muted">Estas capturas se conservan porque explican de dónde viene el sistema. Las
pantallas que retratan siguen existiendo para los grupos antiguos.</p>
<div class="tiras">
<figure><img loading="lazy" src="assets/img/pasos/legacy/r1_menu.png" alt="El menú STARGATE dentro de la hoja de cálculo">
<figcaption>La sala de máquinas: el menú <b>STARGATE</b> sobre la pestaña de grupos.</figcaption></figure>
<figure><img loading="lazy" src="assets/img/pasos/legacy/r3_crear.png" alt="El diálogo de crear un grupo nuevo">
<figcaption>Crear un grupo: nombre, tipo y la fecha de la semana 1.</figcaption></figure>
<figure><img loading="lazy" src="assets/img/pasos/legacy/r5_doc.png" alt="El documento de enlaces y embeds">
<figcaption>El documento de enlaces, partido en dos: lo que se podía repartir y lo que no.</figcaption></figure>
<figure><img loading="lazy" src="assets/img/pasos/legacy/r6_pin.png" alt="El diálogo de cambiar el PIN">
<figcaption>Las dos llaves. Hoy no hay ninguna: se entra con la cuenta.</figcaption></figure>
<figure><img loading="lazy" src="assets/img/pasos/legacy/r7_dossier.png" alt="El dossier del profesorado">
<figcaption>El dossier, para repartir enlaces sin perseguir a nadie.</figcaption></figure>
<figure><img loading="lazy" src="assets/img/pasos/legacy/r8_ciclo.png" alt="El ciclo de vida de un grupo">
<figcaption>Archivar al terminar el curso. Borrar pedía escribir el nombre del grupo.</figcaption></figure>
</div>

<h2>Si hubiera que volver atrás</h2>
<p>El motor viejo <b>no se ha apagado</b>. La web decide con qué hablar mediante un interruptor, y se
puede forzar visita a visita:</p>
<ul class="lista">
<li><code>?motor=apps</code> — el sistema de siempre, con su hoja y sus formularios.</li>
<li><code>?motor=firestore</code> — el motor nuevo.</li>
</ul>
<p>Eso significa que un problema en el motor nuevo no deja a nadie tirado: se vuelve al de siempre
mientras se arregla. Ese fue el requisito desde el primer día, y por eso el traductor devuelve
exactamente el mismo tablero que devolvía la hoja.</p>

</div></section>
''' + FOOT

PAGES=[("index.html",PORTADA),("comosehizo.html",COMOSEHIZO),("ayuda.html",AYUDA),("privacidad.html",PRIVACIDAD),("guia.html",GUIA),("cronologia.html",CRONOLOGIA),("actividades.html",ACT),
       ("registro.html",REGPAGE),("recursos.html",REC),("legacy.html",LEGACY)]
def _ver(rel): return hashlib.md5(open(os.path.join(HERE,rel),"rb").read()).hexdigest()[:10]
vc,vj,vt = _ver("assets/css/stargate.css"), _ver("assets/js/stargate.js"), _ver("assets/js/tour.js")
for name,html in PAGES:
    html=(html.replace('assets/css/stargate.css"','assets/css/stargate.css?v='+vc+'"')
              .replace('assets/js/stargate.js"','assets/js/stargate.js?v='+vj+'"')
              .replace('assets/js/tour.js"','assets/js/tour.js?v='+vt+'"'))
    open(os.path.join(HERE,name),"w",encoding="utf-8").write(html)
    print("escrito:",name,f"{len(html)//1024} KB")
print("OK sitio v2 generado · css?v="+vc)

# ================= v2.1 · PANEL DE PROFESORADO + FORO DINÁMICO =================
# ================= EL CATÁLOGO COMPLETO DE RETOS, PARA LA NAVE =================
# 🔴 La lista de aquí abajo (RETOS_REGULAR/RETOS_PUA de la web) es un resumen id+título para la
# cronología. La Nave necesita el catálogo ENTERO —xp y tema incluidos— y su explicación, y eso vive
# en apps-script/Datos.gs, que a su vez se regenera desde el documento maestro. Se lee de ahí: si se
# inyectara el resumen, la sección de retos de la Nave saldría vacía (pasó el 29-ago: r[4] no existía).
import re as _re
_datos_src = open(os.path.join(HERE, "apps-script", "Datos.gs"), encoding="utf-8").read()
def _catalogo_retos(nombre):
    _a = _datos_src.index("var %s = [" % nombre); _b = _datos_src.index("\n];", _a)
    filas = [json.loads(m) for m in _re.findall(r'^\s*(\[.*\]),?$', _datos_src[_a:_b], _re.M)]
    assert filas and all(len(f) == 5 for f in filas), "el catálogo %s de Datos.gs no tiene la forma esperada" % nombre
    return filas
_RETOS_NAVE = {"REGULAR": _catalogo_retos("RETOS_REGULAR"), "PUA": _catalogo_retos("RETOS_PUA")}
_a0 = _datos_src.index("var AYUDA_RETOS = "); _b0 = _datos_src.index(";\n// AYUDA-FIN", _a0)
_AYUDA_NAVE = json.loads(_datos_src[_a0 + len("var AYUDA_RETOS = "):_b0])
# 19 = A1-A8 + B1-B8 + X1 + X2 + XF (los PUA reutilizan los mismos ids)
assert len(_AYUDA_NAVE) >= 19, "AYUDA_RETOS de Datos.gs se ha quedado corta (%d)" % len(_AYUDA_NAVE)

RETOS_REGULAR=[("A0","Reto «Preséntate a tu tripulación»"),("A1","Reto A «El boceto sin quemar» (Bran)"),("B1","Reto B «La chispa»"),("X1","Actividad 1 entregada"),("A2","Reto A «Un mensaje para quien faltó» (Tomás)"),("B2","Reto B «El eco que enseña»"),("A3","Reto A «Dos senderos» (Sylla)"),("B3","Reto B «La matriz»"),("X2","Actividad 2 entregada"),("A4","Reto A «Abre el canal» (Amara)"),("B4","Reto B «El entorno de aula»"),("A5","Reto A «Mide con método» (Vera)"),("B5","Reto B «La Bitácora medida»"),("A6","Reto A «Ensaya jugando» (Joran)"),("B6","Reto B «El juego»"),("A7","Reto A «Un porqué» (Mara)"),("B7","Reto B «La microgamificación»"),("A8","Reto A «La capa posible» (Noa)"),("B8","Reto B «El último umbral»"),("S7","Reto secreto «El Fragmento Prohibido»")]
RETOS_PUA=[("A0","Reto «Preséntate a tu tripulación»"),("B1","La chispa (Bran)"),("X1","Actividad 1 entregada"),("B2","El eco que enseña (Tomás)"),("B3","La matriz (Sylla)"),("X2","Actividad 2 entregada"),("B4","El entorno de aula (Amara)"),("B5","La Bitácora medida (Vera)"),("B6","El juego (Joran)"),("B7","La microgamificación (Mara)"),("B8","El último umbral (Noa)")]
SEMANAS_JSON = json.dumps([{
  "sem": s["sem"], "tema": s["tema"], "sub": s["sub"], "capitulo": s.get("capitulo"),
  "tema_n": int(__import__("re").search(r"Tema (\d)", s["tema"]).group(1)) if "Tema " in s["tema"] else 0,
  "videos": [[{"id": yt(c)["id"], "titulo": yt(c)["titulo"]}, cuando] for c, cuando in s["videos"]],
  "lanza": s["lanza"], "insignias": s["insignias"], "foro": FORO.get(s["sem"], ""), "hito": s["hito"],
  # v3.60 · el consejo y las clases ya vivian en el CRONO pero no viajaban al navegador: los necesita
  # la sala de sesion (sesion.html) para la tira de preparacion del docente.
  "consejo": s.get("consejo", ""), "clases": s.get("clases", "")} for s in CRONO], ensure_ascii=False)

PROFES = head("STARGATE · Panel del profesorado", "Panel del profesorado de STARGATE: alumnos, insignias, tickets de salida, canjes y ajustes de cada PER.", "reg") + f'''
<header class="hero"><div class="kicker">Solo profesorado · PIN</div><h1>Panel del profesorado</h1>
<p>Elige el PER y gestiona sin tocar la hoja: alumnos con nombre y correo, insignias (anular / otorgar), tickets de salida por tema, canjes pendientes de entregar, profesorado, fecha de inicio y apertura/cierre de formularios.</p></header>
<section id="panel"><div class="wrap">

<div id="profes-app"></div>
<script>window.SG_TABLERO_API="{TABLERO_API}";window.SG_BADGE_NAMES={json.dumps(BADGE_NAME, ensure_ascii=False)};window.SG_RETOS={json.dumps({"REGULAR": RETOS_REGULAR, "PUA": RETOS_PUA}, ensure_ascii=False)};</script>
<script src="assets/js/profes.js" defer></script>

</div></section>
''' + FOOT

FORO_PAGE = head("STARGATE · La orden de la semana", "El mensaje para el foro de la plataforma de UNIR de la semana en curso, con sus retos, insignias y vídeos. Se actualiza solo a partir de la fecha de la semana 1.", "crono") + f'''
<header class="hero"><div class="kicker">Para el foro de la plataforma de UNIR</div><h1>La orden de la semana</h1>
<p>Tu alumnado ya la ve sola en su Nave, cada semana. Aquí tienes dos usos más: <b>incrustarla</b> en el Genially del
grupo (enseña la de la semana en curso y cambia sola), o <b>verlas todas de una vez</b> y copiarlas para publicarlas
en el foro de la plataforma de UNIR.</p>
<div class="cta-row"><a class="btn primary" href="foro.html?todos=1">Ver TODOS los mensajes (para copiar) →</a></div>
<p class="small muted">Uso del artefacto dinámico: <code>foro.html?per=&lt;id&gt;</code> (toma la fecha del PER) o <code>foro.html?inicio=2026-09-14&amp;tipo=REGULAR|PUA</code>. Añade <code>&amp;embed=1</code> para incrustar y <code>&amp;semana=N</code> para forzar una semana. Todos los mensajes: <code>foro.html?todos=1</code> (con <code>&amp;per=&lt;id&gt;</code> los enlaces del tablero salen ya con tu PER).</p></header>
<section><div class="wrap">
<div id="foro-app"></div>
<script>window.SG_TABLERO_API="{TABLERO_API}";window.SG_SEMANAS={SEMANAS_JSON};</script>
<script src="assets/js/calendario.js" defer></script>
<script src="assets/js/foro.js" defer></script>
</div></section>
''' + FOOT

for name, html in [("profes.html", PROFES), ("foro.html", FORO_PAGE)]:
    html=(html.replace('assets/css/stargate.css"','assets/css/stargate.css?v='+vc+'"').replace('assets/js/stargate.js"','assets/js/stargate.js?v='+vj+'"').replace('assets/js/tour.js"','assets/js/tour.js?v='+vt+'"'))
    open(os.path.join(HERE,name),"w",encoding="utf-8").write(html); print("escrito:",name,f"{len(html)//1024} KB")

# ================= v2.2 · PANEL VISUAL DE TICKETS =================
TICKETS = head("STARGATE · Tickets de salida", "Panel visual de los tickets de salida «Contacta con NEBULA»: valoraciones por sección y dudas por resolver, por PER y por profesor/a.", "reg") + f'''
<header class="hero"><div class="kicker">Solo profesorado</div><h1>Contacta con NEBULA</h1>
<p>Elige tu grupo y tu clase: verás de un vistazo las valoraciones (1-5) de cada sección y las dudas del alumnado, y podrás marcarlas como resueltas cuando las trates en clase.</p>
<p class="small muted">El ticket es <b>uno solo para todos los grupos y todos los años</b>, y es <b>anónimo</b>: el formulario no recoge ni nombres ni correos. La Nave le dice sola de qué grupo y de qué Comandante viene cada respuesta.</p>
<p class="small muted">Embed para el Genially del profesorado: <code>tickets.html?embed=1</code> (o <code>?per=&lt;id&gt;&amp;embed=1</code>). <a href="tickets.html?demo=1">Ver una demostración con datos ficticios</a>.</p></header>
<section id="panel"><div class="wrap">
<div id="tickets-app"></div>
<script>window.SG_TABLERO_API="{TABLERO_API}";</script>
<script src="assets/js/tickets.js" defer></script>
</div></section>
''' + FOOT
html=(TICKETS.replace('assets/css/stargate.css"','assets/css/stargate.css?v='+vc+'"').replace('assets/js/stargate.js"','assets/js/stargate.js?v='+vj+'"').replace('assets/js/tour.js"','assets/js/tour.js?v='+vt+'"'))
open(os.path.join(HERE,"tickets.html"),"w",encoding="utf-8").write(html); print("escrito: tickets.html")

# ---- La visita guiada de la sala (v3.35) ----------------------------------------------------
# Lo que más falta hacía no era «qué es cada cosa», sino EL ORDEN de lo que tiene que hacer el
# alumnado: sin la Bitácora rellenada no existe nadie en el sistema, y todo lo demás se cae detrás.
# Los objetivos los pinta clase.js; `sel2` es el bloque de reserva por si ese enlace concreto aún no
# existe (un PER sin formularios publicados). El build comprueba que las anclas siguen en clase.js.
TOUR_CLASE = {
 "clave": "sala",
 "invita": "¿Te enseño tu sala?",
 "invita2": "Sobre todo, el orden en que tu alumnado tiene que hacer las cosas.",
 "pasos": [
  {"sel":"#sala-herramientas","pose":"senala","t":"Tus tres botones",
   "x":"Lo que se usa <b>en directo</b>: proyectar la semana ya montada, el <b>aula</b> —donde tocas llamada a filas, ves quién ficha y repartes premios a mano— y la llamada suelta con el botón grande. Los dos últimos se incrustan en tu Genially y valen para todos tus grupos."},
  {"sel":"#sala-cabecera","pose":"saluda","t":"Esta es tu sala, Capitán",
   "x":"Todo lo que necesitas antes de entrar al aula, en una página. Pero empecemos por lo que más "
       "se atasca: <b>el orden en que tu alumnado tiene que hacer las cosas</b>. Son cinco pasos, y el "
       "primero no se puede saltar."},
  {"sel":"[data-acc=\'bitacora\']","sel2":"#sala-enlaces","pose":"senala","t":"1 · Que se alisten. Hoy, en clase",
   "x":"El <b>enlace de alistarse</b> —el de arriba, con el código de tu clase dentro—. Que lo abran "
       "<b>con su cuenta de Google</b> y pongan nombre real, alias, personaje y quién les da clase. "
       "Hasta que no lo hacen <b>no existen para el sistema</b>: no salen en el tablero, no tienen "
       "Nave y no pueden canjear nada. Es lo primero de la primera sesión, delante de ti.<br>"
       "<span class=\'small muted\'>En los grupos del sistema anterior esto es la Bitácora de mando, "
       "el formulario de Google.</span>"},
  {"sel":"[data-acc=\'nave\']","sel2":"#sala-enlaces","pose":"tablet","t":"2 · Dónde se ven a sí mismos",
   "x":"La <b>Nave del Recluta</b>. Entran con <b>el mismo correo de Google</b> con el que se alistaron "
       "y ahí está su personaje, su nivel, sus insignias, sus cartas y sus créditos. Si alguien dice "
       "que «no le sale nada», casi siempre es esto: entró con otra cuenta."},
  {"sel":"[data-acc=\'bitacora\']","sel2":"#sala-enlaces","pose":"pensativo","t":"3 · Cómo registran lo que van haciendo",
   "x":"Desde su <b>propia Nave</b>: en «Mi nave» ven los retos de la semana con lo que da cada uno, "
       "los abren, leen el paso a paso y pulsan <b>«Lo he hecho»</b>. Los puntos suben en el momento, "
       "arriba, donde siempre los tienen delante. No hay formulario que enviar.<br>"
       "<span class=\'small muted\'>En los grupos del sistema anterior vuelven a la misma Bitácora y "
       "editan su respuesta: no se empieza de cero.</span>"},
  {"sel":"[data-acc=\'ticket\']","sel2":"#sala-clase","pose":"senala","t":"4 · Al terminar la clase: el ticket",
   "x":"El <b>ticket de salida</b>, treinta segundos y <b>anónimo</b>. Lo que escriban te llega aquí, "
       "a «Con qué empezar la clase», filtrable por tema y por fecha. Es tu termómetro de la sesión."},
  {"sel":"[data-acc=\'canje\']","sel2":"#sala-enlaces","pose":"brazos","t":"5 · Cuando tengan créditos: el canje",
   "x":"El <b>Mercado Estelar</b>, dentro de su Nave: canjean ahí mismo y los créditos se descuentan "
       "solos. A ti solo te llega lo que tiene que aplicar una persona —subir una nota, recalificar—, "
       "y eso queda <b>pendiente de tu visto bueno</b> en la cola de nota.<br>"
       "<span class=\'small muted\'>En los grupos del sistema anterior es el formulario de canje.</span>"},
  {"sel":"#sala-intervencion","pose":"tablet","t":"Y ahora lo tuyo: lo primero al llegar",
   "x":"<b>Requiere tu intervención</b>. Canjes ya cobrados que esperan por ti: el alumno ya pagó y ya "
       "lo sabe. Si aparece el aviso ámbar de <b>reclutas sin docente</b>, arréglalo antes que nada: "
       "sin docente, sus avisos no le llegan a ninguna persona concreta."},
  {"sel":"#sala-clase","pose":"senala","t":"La orden de la semana",
   "x":"Qué toca hoy según la fecha de la semana 1 del grupo, y el <b>mensaje del foro</b> de esta "
       "semana. <b>No tienes que repartirlo:</b> a tu alumnado ya le sale solo en su Nave, nada "
       "más entrar, y también dentro del Genially si tenéis incrustado el foro dinámico. Cambia "
       "de semana él solo. Aquí lo tienes para leerlo antes de clase — o para copiarlo al foro de "
       "la plataforma de UNIR si quieres además dejarlo escrito ahí. Debajo, las dudas del ticket."},
  {"sel":"#sala-grupo","pose":"brazos","t":"Tu gente, y sus errores",
   "x":"Tu grupo con su nivel, sus créditos y sus insignias. Pulsa <b>«Ver ficha»</b> —o la fila— y "
       "tienes la radiografía completa de esa persona: su biografía, sus insignias, sus cartas, los "
       "personajes que ha ganado y su correo. Y ahí dentro, el botón <b>Corregir</b> arregla el alias, "
       "el nombre, el docente, el enlace del ePortfolio y los retos marcados. No hace falta abrir "
       "ninguna hoja de cálculo."},
    {"sel":"#sala-pase","pose":"brazos","t":"El pase de lista en directo",
   "x":"Abre una ventana de unos minutos y enseña la consigna en tu pantalla. Quien esté en clase "
       "la teclea en su Nave y se lleva unos créditos. La consigna <b>no viaja</b>: no está en "
       "ningún enlace ni en los datos que recibe el alumnado, solo en tu pantalla. Aun así no es "
       "un control de asistencia fiable —quien está en clase puede escribírsela por el chat a "
       "quien no está—, así que ábrelo con la clase ya empezada y déjalo pocos minutos. Y si "
       "necesitas la pantalla para otra cosa, <b>tápala</b>: la ventana sigue abierta."},
  {"sel":"#sala-enlaces","pose":"tablet","t":"Todo lo del grupo, sin buscar en Drive",
   "x":"Los enlaces de <b>este</b> grupo: tablero, Nave, los tres formularios, el panel de Genially, "
       "el foro y el generador de embeds y QR. Y si eres el referente, el panel completo."},
  {"sel":"#sala-cabecera","pose":"pulgar","t":"Listo, Capitán",
   "x":"Recuerda los dos primeros pasos y el resto va solo: <b>que se alisten</b> y <b>que editen su "
       "respuesta</b> en vez de empezar de cero. Puedes volver a ver esto cuando quieras con el botón "
       "«Visita guiada» de la barra de arriba."}
 ]}

# ================= v3.11 · LA SALA DEL DOCENTE =================
# Un solo sitio para quien imparte: sus grupos, lo que requiere SU intervención, las dudas del ticket
# filtradas, su gente (con corrección de errores) y los enlaces. Con PIN, y de escritura.
CLASE = head("STARGATE · Mi clase", "La sala del docente: tus grupos, lo que requiere tu intervención, las dudas del ticket de salida y tu gente — todo en una página, sin abrir hojas de cálculo.", "cla") + f'''
<header class="hero"><div class="kicker">Solo profesorado</div><h1>Mi clase</h1>
<p>Todo lo que necesitas antes de entrar al aula, en una página: <b>lo que requiere tu intervención</b>,
la orden de la semana, las <b>dudas del ticket de salida</b> filtrables por tema y fecha, y <b>tu gente</b>
—con sus errores corregibles desde aquí—.</p>
<p class="small muted"><b>Entra con tu cuenta de Google</b>: la misma con la que tu referente te puso en
el equipo docente. No hay PIN que recordar ni correo que escribir — el servidor sabe quién eres y te
enseña solo <b>tus grupos y tu alumnado</b>.<br>
</p></header>
<section><div class="wrap"><div id="clase-app"></div>
<script>window.SG_TABLERO_API="{TABLERO_API}";window.SG_BADGE_NAMES={json.dumps(BADGE_NAME, ensure_ascii=False)};window.SG_RETOS={json.dumps({"REGULAR": RETOS_REGULAR, "PUA": RETOS_PUA}, ensure_ascii=False)};window.SG_SEMANAS={SEMANAS_JSON};window.SG_TOUR_LOCAL={json.dumps(TOUR_CLASE, ensure_ascii=False)};window.SG_BADGES={json.dumps(NAVE_BADGES)};window.SG_CROMOS={json.dumps([list(c) for c in CROMOS], ensure_ascii=False)};window.SG_HEROES={json.dumps([[h[0], h[1], h[3], h[2]] for h in HEROES], ensure_ascii=False)};window.SG_CARDV="?v={_cardv}";</script>
<script src="assets/js/clase.js" defer></script>
</div></section>
''' + FOOT
html=(CLASE.replace('assets/css/stargate.css"','assets/css/stargate.css?v='+vc+'"').replace('assets/js/stargate.js"','assets/js/stargate.js?v='+vj+'"').replace('assets/js/tour.js"','assets/js/tour.js?v='+vt+'"'))
open(os.path.join(HERE,"clase.html"),"w",encoding="utf-8").write(html); print("escrito: clase.html")

# ================= v3.60 · LA SESION DE LA SEMANA (proyectable) =================
# 🔴 Lo pidio Norberto el 11-sep: «que el docente viera todo lo de esa semana de forma que al
# compartir pantalla pudiera explicarlo sin necesidad de crear un genially». El temario, los videos,
# las misiones, las insignias y el hito son IGUALES para todo el profesorado: montarlo cada uno por
# su cuenta era trabajo repetido. Lo unico propio de cada docente son sus ejemplos, y para eso el
# mazo termina en una diapositiva en blanco.
# Con PIN, como «Mi clase»: la tira de preparacion lleva el consejo del Capitan, que no debe verse
# proyectado.
SESION = head("STARGATE · La sesión de la semana", "La semana en curso montada como presentación: planeta, vídeos, misiones, insignias y hito. Para proyectar en clase sin montar un Genially.", "cla", puerta=True) + f'''
<header class="hero corto"><div class="kicker">Solo profesorado</div><h1>La sesión de la semana</h1>
<p>La semana en curso, ya montada para proyectar: el planeta, los vídeos con el momento en que van,
las misiones que se lanzan <b>con lo que pide cada una</b>, las insignias que entregas y el hito.
Pasa con las flechas <b>←</b> y <b>→</b>.</p>
<p class="small muted">El <b>consejo del Capitán</b> y el mensaje del foro están arriba, fuera del mazo:
al pulsar <b>Proyectar</b> desaparecen y solo se ve la presentación.</p></header>
<section><div class="wrap"><div id="sesion-app"></div>
<script>window.SG_TABLERO_API="{TABLERO_API}";window.SG_SEMANAS={SEMANAS_JSON};window.SG_PLANETAS={json.dumps(PLANETAS, ensure_ascii=False)};window.SG_RETOS={json.dumps({"REGULAR": RETOS_REGULAR, "PUA": RETOS_PUA}, ensure_ascii=False)};window.SG_AYUDA_RETOS={json.dumps(_AYUDA_NAVE, ensure_ascii=False)};window.SG_IMGV="?v={hashlib.md5("".join(open(os.path.join(HERE,"assets","img","planetas",k+".png"),"rb").read().hex()[:64] for k,*_ in PLANETAS).encode()).hexdigest()[:10]}";</script>
<script src="assets/js/calendario.js" defer></script>
<script src="assets/js/sesion.js" defer></script>
</div></section>
''' + FOOT
html=(SESION.replace('assets/css/stargate.css"','assets/css/stargate.css?v='+vc+'"').replace('assets/js/stargate.js"','assets/js/stargate.js?v='+vj+'"').replace('assets/js/tour.js"','assets/js/tour.js?v='+vt+'"'))
open(os.path.join(HERE,"sesion.html"),"w",encoding="utf-8").write(html); print("escrito: sesion.html")

# ================= v3.63 · PRUEBA EN PARALELO DEL LOGIN DE GOOGLE =================
# 🔴 Esta pagina NO va en el menu, ni en el pie, ni enlazada desde ningun sitio. Es un banco de
# pruebas. Norberto, 11-sep: «algo que no rompa nada, algo paralelo para probar».
# Tampoco lleva la puerta del PIN: no enseña ni un dato del curso, solo el correo de quien pulsa.
PRUEBALOGIN = head("STARGATE · Prueba de inicio de sesion", "Banco de pruebas del inicio de sesion con Google. Pagina interna.", "") + f'''
<header class="hero"><div class="kicker">Banco de pruebas · pagina interna</div><h1>Inicio de sesión con Google</h1>
<p>Esta página <b>no está enlazada desde ningún sitio</b> y no toca nada de lo que funciona: ni la
Nave, ni los formularios, ni los despliegues, ni los permisos del script. Es solo para comprobar si
podemos saber quién es cada estudiante <b>sin pedirle permiso sobre tu Drive</b>.</p>
<p class="small muted">Lo que se prueba: que el estudiante ve la pantalla <b>normal</b> de Google
(solo «ver tu correo», sin cartel rojo) y que el servidor puede <b>verificar</b> ese correo.</p></header>
<section><div class="wrap"><div id="login-app"></div>
<script>window.SG_TABLERO_API="{TABLERO_API}";window.SG_GOOGLE_CLIENT_ID="{GOOGLE_CLIENT_ID}";</script>
<script src="assets/js/pruebalogin.js" defer></script>
</div></section>
''' + FOOT
html=(PRUEBALOGIN.replace('assets/css/stargate.css"','assets/css/stargate.css?v='+vc+'"').replace('assets/js/stargate.js"','assets/js/stargate.js?v='+vj+'"').replace('assets/js/tour.js"','assets/js/tour.js?v='+vt+'"'))
open(os.path.join(HERE,"pruebalogin.html"),"w",encoding="utf-8").write(html); print("escrito: pruebalogin.html  (interna, sin enlazar)")

# ================= v3.6 · GRUPOS (un panel de accesos por PER) =================
# La lista sale de doGet ?per=all (sin PIN); los formularios de cada grupo, de doGet ?per=<id>.
GRUPOS = head("STARGATE · Grupos", "Tus grupos (PER) de STARGATE: tablero, nave del alumnado, panel del profesorado, tickets, foro y enlaces de cada uno.", "grp", puerta=True) + f'''
<header class="hero"><div class="kicker">Un grupo, un panel</div><h1>Tus grupos</h1>
<p>Cada clase que se da de alta es un <b>PER</b>: su tablero, su nave, su foro y sus
formularios. Aquí los tienes todos, y desde el menú <b>Grupos</b> puedes saltar a cualquiera desde
cualquier página.</p>
<p class="small muted">Se listan los PER <b>no archivados</b>. Para crear uno: <a href="crear.html">la consola del referente</a>. En el sistema antiguo: hoja maestra → menú
<b>STARGATE → Crear nuevo PER</b>. Para archivarlo o borrarlo, panel del profesorado → Ajustes.</p></header>
<section><div class="wrap"><div id="grupos-app"></div>
<script>window.SG_SEMANAS={SEMANAS_JSON};</script>
<script src="assets/js/calendario.js" defer></script>
<script src="assets/js/grupos.js" defer></script>
</div></section>
''' + FOOT
html=(GRUPOS.replace('assets/css/stargate.css"','assets/css/stargate.css?v='+vc+'"').replace('assets/js/stargate.js"','assets/js/stargate.js?v='+vj+'"').replace('assets/js/tour.js"','assets/js/tour.js?v='+vt+'"'))
open(os.path.join(HERE,"grupos.html"),"w",encoding="utf-8").write(html); print("escrito: grupos.html")

# ================= v2.3 · GENERADOR DE EMBEDS =================
EMBED = head("STARGATE · Enlaces y embeds", "Genera los enlaces, códigos de incrustación y QR de un PER para los Geniallys del alumnado y del profesorado.", "gen", puerta=True) + f'''
<header class="hero"><div class="kicker">Para montar tu Genially</div><h1>Enlaces, embeds y QR</h1>
<p>Elige el PER y tu nombre: aquí están todos los enlaces, los códigos para incrustar y los QR, listos para copiar.</p></header>
<section id="panel"><div class="wrap"><div id="embed-app"></div>
<script>window.SG_TABLERO_API="{TABLERO_API}";</script><script src="assets/js/embed.js" defer></script>
</div></section>
''' + FOOT
html=(EMBED.replace('assets/css/stargate.css"','assets/css/stargate.css?v='+vc+'"').replace('assets/js/stargate.js"','assets/js/stargate.js?v='+vj+'"').replace('assets/js/tour.js"','assets/js/tour.js?v='+vt+'"'))
open(os.path.join(HERE,"embed.html"),"w",encoding="utf-8").write(html); print("escrito: embed.html")

# ================= v3 · LA NAVE DEL RECLUTA (web del alumnado por PER) =================
RECLUTA = f'''<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>STARGATE · La Nave del Recluta</title>
<meta name="description" content="La nave del alumnado de STARGATE: la orden de cada semana, los planetas que se desbloquean con el calendario, tu estado y tus recompensas.">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#080c14">
<link rel="icon" href="{FAV}">
<link rel="stylesheet" href="assets/css/stargate.css">
<script src="assets/js/stargate.js" defer></script>
</head><body>
<!-- 🔴 El logo llevaba a recluta.html, o sea a si mismo: pulsarlo no hacia nada. Ahora sale a la
     portada, que es la puerta publica del proyecto. -->
<nav class="nav"><div class="wrap"><a class="brand" href="index.html">◈ STARGATE <span class="modo recluta">Recluta<i> · alumnado</i></span></a></div></nav>
<header class="hero"><div class="kicker">Canal del alumnado</div><h1>La Nave del Recluta</h1>
<p>Tu puesto a bordo: la orden de cada semana, los planetas que se van desbloqueando con el viaje,
tu ficha de recluta y las recompensas. <b>NEBULA</b> te acompaña.</p></header>
<section><div class="wrap"><div id="nave-app"></div>
<script>window.SG_TABLERO_API="{TABLERO_API}";window.SG_GOOGLE_CLIENT_ID="{GOOGLE_CLIENT_ID}";window.SG_SEMANAS={SEMANAS_JSON};window.SG_BADGE_NAMES={json.dumps(BADGE_NAME, ensure_ascii=False)};window.SG_BADGES={json.dumps(NAVE_BADGES)};window.SG_PLANETAS={json.dumps(PLANETAS, ensure_ascii=False)};window.SG_CROMOS={json.dumps([list(c) for c in CROMOS], ensure_ascii=False)};window.SG_CROMO_SERIES={json.dumps([list(x) for x in CROMO_SERIES], ensure_ascii=False)};window.SG_SERIES_ALBUM={json.dumps([[k, _SERIE_TIT_WEB[sr], n] for k, sr, n in SERIES_ALBUM], ensure_ascii=False)};window.SG_HEROES={json.dumps([[h[0], h[1], h[3], h[2]] for h in HEROES], ensure_ascii=False)};window.SG_HEROES_OCULTOS={json.dumps(HEROES_OCULTOS, ensure_ascii=False)};window.SG_CARDV="?v={_cardv}";window.SG_IMGV="?v={hashlib.md5("".join(open(os.path.join(HERE,"assets","img","planetas",k+".png"),"rb").read().hex()[:64] for k,*_ in PLANETAS).encode()).hexdigest()[:10]}";window.SG_RETOS={json.dumps(_RETOS_NAVE, ensure_ascii=False)};window.SG_AYUDA_RETOS={json.dumps(_AYUDA_NAVE, ensure_ascii=False)};window.SG_GANCHO_RETOS={json.dumps(GANCHO_RETOS, ensure_ascii=False)};window.SG_EVIDENCIA={json.dumps(EVIDENCIA_RETOS)};window.SG_TOPE_DIA={TOPE_RETOS_DIA};window.SG_IMG_RECOMPENSA={json.dumps(IMG_RECOMPENSA, ensure_ascii=False)};</script>
<script src="assets/js/calendario.js" defer></script>
<script src="assets/js/sobre.js" defer></script>
<script src="assets/js/recluta.js" defer></script>
</div></section>
<section id="nave-ranking"><div class="wrap">
<div class="eyebrow amber">El tablero de tu grupo</div>
<h2>¿Cómo va la tripulación?</h2>
<p class="lead">Ocho rankings distintos, en vivo: hay más de una forma de ir primero. Pulsa sobre cualquier
recluta para ver su ficha: su personaje, su biografía, su nivel y las insignias que lleva. Aquí solo se ven
<b>alias</b> — ni nombres ni correos.</p>
<div id="tablero-app"></div>
<script>window.SG_TABLERO_ALOJADO=true;</script>
<script src="assets/js/tablero.js" defer></script>
</div></section>
<footer><div class="wrap">STARGATE · La Bitácora Estelar — Proyecto Gamificado del <b>Máster en Tecnología Educativa</b> de la UNIR.</div></footer></body></html>'''
html=(RECLUTA.replace('assets/css/stargate.css"','assets/css/stargate.css?v='+vc+'"').replace('assets/js/stargate.js"','assets/js/stargate.js?v='+vj+'"'))
open(os.path.join(HERE,"recluta.html"),"w",encoding="utf-8").write(html); print("escrito: recluta.html")

# ================= v3.3 · PANEL DE CONTROL (mapa de planetas sobre el universo) =================
# Pensado para incrustar en Genially (o usarlo suelto): fondo en bucle + los 8 planetas clicables.
# Cada planeta lleva al Genially de su tema (GENIALLYS en _site_data.py) o, si no lo hay, a la cronología.
POS = [(13,37),(37,32),(61,37),(85,32),(13,71),(37,76),(61,71),(85,76)]   # % (x,y): dos arcos, sin pisar título ni pie
def planeta_panel(i, key, nombre, tema):
    g = GENIALLYS.get(i, {})
    destino = g.get("view") or f"cronologia.html#sem{ {1:1,2:3,3:5,4:7,5:9,6:10,7:11,8:13}[i] }"
    pend = "" if g.get("view") else ' data-pendiente="1"'
    x, y = POS[i-1]
    abre = {1:1,2:3,3:5,4:7,5:9,6:10,7:11,8:13}[i]
    return (f'<a class="pl" style="left:{x}%;top:{y}%" href="{destino}" target="_blank" rel="noopener"{pend} data-tema="{i}" data-abre="{abre}">'
            f'<span class="orbita"></span><img src="assets/img/planetas/{key}.png" alt="{nombre}">'
            f'<b>{nombre}</b><em>{tema}</em><span class="candado">Se abre la semana {abre}</span></a>')
planetas_panel = "\n".join(planeta_panel(i, k, n, t) for i, (k, n, t) in enumerate(PLANETAS, 1))

PANEL = f'''<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>STARGATE · Panel de control</title>
<meta name="description" content="Mapa de los ocho planetas de STARGATE: cada uno lleva a la presentación de su tema.">
<meta name="robots" content="noindex">
<link rel="icon" href="{FAV}">
<link rel="stylesheet" href="assets/css/stargate.css">
<style>
html,body{{margin:0;height:100%;background:#05080f;overflow:hidden}}
.panel{{position:relative;width:100vw;height:100vh;overflow:hidden}}
.panel>video{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0}}
.panel .velo{{position:absolute;inset:0;background:radial-gradient(60% 60% at 50% 50%,rgba(5,8,15,.55),rgba(5,8,15,.82));z-index:1}}
.panel .tit{{position:absolute;top:2.4vh;left:0;right:0;text-align:center;z-index:3;pointer-events:none}}
.panel .tit .k{{font-size:.78rem;letter-spacing:.34em;color:var(--teal);text-transform:uppercase}}
.panel .tit h1{{font-family:'Unbounded',sans-serif;font-size:clamp(1.6rem,4.4vw,3rem);margin:.15em 0 0;color:#eaf6fb;text-shadow:0 0 34px rgba(55,224,236,.45)}}
.panel .tit p{{margin:.3em 0 0;color:var(--mut);font-size:clamp(.8rem,1.5vw,.95rem)}}
.mapa{{position:absolute;inset:0;z-index:2}}
.pl{{position:absolute;transform:translate(-50%,-50%);text-align:center;text-decoration:none;width:clamp(88px,11vw,150px);transition:transform .28s ease}}
.pl img{{width:100%;display:block;filter:drop-shadow(0 10px 26px rgba(0,0,0,.65));transition:filter .28s ease}}
.pl b{{display:block;margin-top:.35em;font-size:clamp(.8rem,1.35vw,.95rem);color:#fff;text-shadow:0 2px 12px #000}}
.pl em{{display:block;font-style:normal;font-size:clamp(.75rem,1.05vw,.82rem);color:var(--teal2);text-shadow:0 2px 10px #000;opacity:0;transition:opacity .28s ease}}
.pl:hover{{transform:translate(-50%,-50%) scale(1.14)}}
.pl:hover img{{filter:drop-shadow(0 0 26px rgba(55,224,236,.75)) drop-shadow(0 10px 26px rgba(0,0,0,.65))}}
.pl:hover em{{opacity:1}}
.pl .orbita{{position:absolute;inset:-14%;border:1px solid rgba(55,224,236,.28);border-radius:50%;opacity:0;transition:opacity .28s ease;animation:giro 14s linear infinite}}
.pl:hover .orbita{{opacity:1}}
@keyframes giro{{to{{transform:rotate(360deg)}}}}
.pl[data-pendiente] b::after{{content:'';display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--amber);margin-left:6px;vertical-align:middle;opacity:.85}}
.pl[data-pendiente] img{{opacity:.82}}
.pie{{position:absolute;bottom:1.2vh;left:0;right:0;text-align:center;z-index:3;color:var(--mut);font-size:.78rem}}
.pie a{{color:var(--teal2)}}
@media(max-width:720px){{.pl{{width:74px}} .pl em{{display:none}}}}
.pl .candado{{display:none;font-size:clamp(.75rem,1vw,.8rem);color:var(--mut);text-shadow:0 2px 10px #000}}
.pl.bloq{{pointer-events:none}}
.pl.bloq img{{filter:grayscale(1) brightness(.4) contrast(1.1)}}
.pl.bloq b{{color:var(--mut)}}
.pl.bloq b::after{{display:none}}
.pl.bloq em{{display:none}}
.pl.bloq .candado{{display:block}}
.aviso{{position:absolute;top:calc(2.4vh + 92px);left:0;right:0;text-align:center;z-index:3;color:var(--teal2);font-size:.76rem}}
</style></head><body>
<div class="panel">
<video autoplay muted loop playsinline poster="assets/img/nave/fondo_universo_poster.jpg"><source src="media/video/fondo_universo.mp4" type="video/mp4"></video>
<div class="velo"></div>
<div class="tit"><div class="k">Panel de control <span class="modo recluta">Recluta<i> · alumnado</i></span></div><h1>La galaxia de STARGATE</h1>
<p>Ocho mundos, ocho temas. Pulsa un planeta para entrar en su misión.</p></div>
<div class="mapa">{{planetas}}</div>
<div class="pie">Proyecto Gamificado del <b>Máster en Tecnología Educativa</b> de la UNIR</div>
<div class="aviso" id="aviso"></div>
</div>
<script>window.SG_TABLERO_API="{TABLERO_API}";window.SG_SEMANAS={SEMANAS_JSON};</script>
<script src="assets/js/calendario.js" defer></script>
<script src="assets/js/panel.js" defer></script>
</body></html>'''.replace("{planetas}", planetas_panel)
html=(PANEL.replace('assets/css/stargate.css"','assets/css/stargate.css?v='+vc+'"'))
open(os.path.join(HERE,"panel.html"),"w",encoding="utf-8").write(html); print("escrito: panel.html")

# ================= cache-busting de TODOS los js (tablero/profes/tickets/foro/embed) =================
import glob as _glob, re as _re
_vers = {os.path.basename(f): _ver("assets/js/"+os.path.basename(f)) for f in _glob.glob(os.path.join(HERE,"assets","js","*.js"))}

# cache-busting de las imágenes que pueden cambiar (planetas, avatares, nave): si no, el navegador
# sigue mostrando la vieja porque la URL no cambia
_IMG_DIRS = ["assets/img/planetas", "assets/img/nave", "assets/img/avatares", "assets/img/tarjetas", "media/video"]
_imgv = {}
for _d in _IMG_DIRS:
    for _f in _glob.glob(os.path.join(HERE, _d, "*")):
        if os.path.isfile(_f) and _f.rsplit(".",1)[-1].lower() in ("png","jpg","jpeg","webp","mp4"):
            _rel = _d + "/" + os.path.basename(_f)
            _imgv[_rel] = _ver(_rel)
def _bust_img(_s):
    for _rel, _v in _imgv.items():
        _s = _re.sub(_re.escape(_rel) + r'(\?v=[0-9a-f]+)?', _rel + "?v=" + _v, _s)
    return _s
for _html in _glob.glob(os.path.join(HERE,"*.html")):
    _s = open(_html, encoding="utf-8").read()
    for _name, _v in _vers.items():
        _s = _re.sub(r'assets/js/'+_re.escape(_name)+r'(\?v=[0-9a-f]+)?"', 'assets/js/'+_name+'?v='+_v+'"', _s)
    _s = _bust_img(_s)
    open(_html, "w", encoding="utf-8").write(_s)
print("cache-bust js:", ", ".join(k+"="+v[:6] for k,v in sorted(_vers.items())))
print("cache-bust img:", len(_imgv), "imagenes versionadas · sendara =", _imgv.get("assets/img/planetas/p3_sendara.png","?")[:6])


# ================= APPS SCRIPT: catálogo de cromos y copia descargable =================
# El bloque «var CROMOS» vive en Datos.gs y se GENERA desde _site_data.CROMOS (un dato, un sitio).
# Las cuatro copias de assets/descargas/ son copias EXACTAS de apps-script/ — es lo que la página de
# instalación manda pegar en el editor, así que se reescriben en cada build y la batería 19 lo vigila.
_SERIE_TIT = _SERIE_TIT_WEB
def _js_cromos():
    filas = []
    for clave, nombre, serie, rareza, peso in CROMOS:
        filas.append('  ["%s","%s",%d,"%s","%s"],' % (clave, nombre, peso, rareza, _SERIE_TIT[serie]))
    filas[-1] = filas[-1][:-1]
    return "\n".join(filas)

def _js_heroes():
    filas = []
    for clave, nombre, rareza, peso in HEROES:
        filas.append('  ["%s",%s,%d,%s],' % (clave, json.dumps(nombre, ensure_ascii=False), peso,
                                             json.dumps(rareza, ensure_ascii=False)))
    filas[-1] = filas[-1][:-1]
    return "\n".join(filas)

def _js_niveles():
    import re as _re2
    L = []
    L.append('var MONEDA = %s;' % json.dumps(MONEDA, ensure_ascii=False))
    L.append('var RANGOS = %s;' % json.dumps(RANGOS, ensure_ascii=False))
    L.append('var NIVELES = [   // [nivel, xp REGULAR, rango de arte 1-5, titulo]')
    for n, xp, r, t in NIVELES:
        L.append('  [%d,%d,%d,%s],' % (n, xp, r, json.dumps(t, ensure_ascii=False)))
    L[-1] = L[-1][:-1]
    L.append('];')
    L.append('var XP_VIAJE = %s;' % json.dumps(XP_VIAJE, ensure_ascii=False))
    L.append('var CREDITOS = %s;' % json.dumps(CREDITOS, ensure_ascii=False))
    L.append('// Calendario del PER: los formularios abren el primer dia de la semana 1, el registro'  )
    L.append('// de misiones cierra al acabar la ultima semana y el canje aguanta una semana mas.')
    L.append('// Generado desde _site_data.py: no editar a mano.')
    L.append('var SEMANAS_PER = %s;' % json.dumps(SEMANAS_PER, ensure_ascii=False))
    # v3.37 · la primera semana en que se abre cada tema, sacada del CRONO (el mismo dato que usa la
    # web para desbloquear planetas). Lo necesita la siembra de alumnado de prueba para poner fechas
    # creíbles — un recluta no puede tener un reto del tema 5 fechado en la semana 2.
    _sem_tema = {}
    for _s in CRONO:
        _m = _re2.match(r"Tema (\d)", str(_s.get("tema") or ""))
        if _m and int(_m.group(1)) not in _sem_tema: _sem_tema[int(_m.group(1))] = _s["sem"]
    L.append('// Primera semana en que se abre cada tema. Generado desde el CRONO de la web: no editar a mano.')
    L.append('var SEMANA_DEL_TEMA = %s;' % json.dumps(_sem_tema, sort_keys=True))
    L.append('var SEMANAS_CANJE_EXTRA = %d;' % SEMANAS_CANJE_EXTRA)
    L.append('// La semana en que se abre el ARSENAL DE BATALLA (recompensas de nota).')
    L.append('var SEMANA_ARSENAL = %d;' % SEMANA_ARSENAL)
    L.append('var DIAS_APERTURA_ANTES = %d;' % DIAS_APERTURA_ANTES)
    L.append('// Insignia por serie completa. [clave, titulo de la serie tal y como aparece en CROMOS, nombre]')
    L.append('var SERIES_ALBUM = [')
    for clave, serie, nombre in SERIES_ALBUM:
        L.append('  [%s,%s,%s],' % (json.dumps(clave), json.dumps(_SERIE_TIT[serie], ensure_ascii=False),
                                    json.dumps(nombre, ensure_ascii=False)))
    L[-1] = L[-1][:-1]
    L.append('];')
    return "\n".join(L)

def _js_recompensas():
    filas = []
    for nombre, coste, mx, desc, desde, tipo in RECOMPENSAS:
        filas.append('  [%s,%d,%d,%s,%d,%s],' % (json.dumps(nombre, ensure_ascii=False), coste, mx,
                                                 json.dumps(desc, ensure_ascii=False), desde,
                                                 json.dumps(tipo, ensure_ascii=False)))
    filas[-1] = filas[-1][:-1]
    return "\n".join(filas)

def _js_img_recompensas():
    # 🔴 GUARDA: la imagen se empareja por NOMBRE con el catálogo. Si alguien renombra una recompensa
    # en RECOMPENSAS y no toca IMG_RECOMPENSA, la recompensa se quedaría muda en el formulario sin
    # que nadie se entere. Mejor romper el build aquí que descubrirlo con el curso empezado.
    nombres = {r[0] for r in RECOMPENSAS}
    faltan, sobran = nombres - set(IMG_RECOMPENSA), set(IMG_RECOMPENSA) - nombres
    if faltan or sobran:
        raise SystemExit("IMG_RECOMPENSA no cuadra con RECOMPENSAS.\n  sin imagen: %s\n  sobran: %s"
                         % (sorted(faltan) or "—", sorted(sobran) or "—"))
    for r in RECOMPENSAS:
        ruta = os.path.join(HERE, "assets", "img", "canje", IMG_RECOMPENSA[r[0]])
        if not os.path.exists(ruta):
            raise SystemExit("IMG_RECOMPENSA: falta el fichero %s (genera con _build_img_formularios.py)" % ruta)
    filas = ['  %s: %s,' % (json.dumps(n, ensure_ascii=False), json.dumps(f, ensure_ascii=False))
             for n, f in ((r[0], IMG_RECOMPENSA[r[0]]) for r in RECOMPENSAS)]
    filas[-1] = filas[-1][:-1]
    return "\n".join(filas)

def _js_escuadrones():
    return ",\n".join('  [%s]' % ", ".join(json.dumps(x, ensure_ascii=False) for x in e)
                      for e in ESCUADRONES)

def _sustituir(txt, ini, fin, cuerpo):
    a = txt.index(ini) + len(ini); b = txt.index(fin)
    return txt[:a] + cuerpo + txt[b:]

# El catalogo vive en Datos.gs desde que Code.gs dejo de poder guardarse (Apps Script rechaza
# el fichero al pasar de ~220 KB). Aqui se inyecta donde esta el dato, no donde estaba.
_gs_path = os.path.join(HERE, "apps-script", "Datos.gs")
_gs = open(_gs_path, encoding="utf-8").read()
_gs = _sustituir(_gs, "var CROMOS = [\n", "\n];\n// CROMOS-FIN", _js_cromos())
_gs = _sustituir(_gs, "var HEROES = [\n", "\n];\n// HEROES-FIN", _js_heroes())
_gs = _sustituir(_gs, "// NIVELES-INICIO", "\n// NIVELES-FIN",
                 _gs[_gs.index("// NIVELES-INICIO")+len("// NIVELES-INICIO"):_gs.index("var MONEDA")].rstrip("\n")
                 + "\n" + _js_niveles())
_gs = _sustituir(_gs, "var ESCUADRONES = [\n", "\n];\n// ESCUADRONES-FIN", _js_escuadrones())
_gs = _sustituir(_gs, "var RECOMPENSAS_INICIALES = [\n", "\n];\n// RECOMPENSAS-FIN", _js_recompensas())
_gs = _sustituir(_gs, "var IMG_RECOMPENSA = {\n", "\n};\n// IMG-RECOMPENSA-FIN", _js_img_recompensas())
_gs = _sustituir(_gs, "var BONUS_PLANETA = ", ";\n// BONUS-FIN",
                 json.dumps(BONUS_PLANETA, ensure_ascii=False) + ";\nvar BONUS_RACHA = " +
                 json.dumps(BONUS_RACHA, ensure_ascii=False) + ";\nvar BONUS_TUTORIAL = " +
                 json.dumps(BONUS_TUTORIAL, ensure_ascii=False) + ";\nvar NOTA_MIN_PLANETAS = " + str(NOTA_MIN_PLANETAS) + ";\nvar BONUS_SERIE = " + json.dumps(BONUS_SERIE, ensure_ascii=False) +
                 ";\nvar BONUS_ALBUM = " + json.dumps(BONUS_ALBUM, ensure_ascii=False) +
                 ";\nvar BONUS_TRIPULACION = " + json.dumps(BONUS_TRIPULACION, ensure_ascii=False) +
                 ";\nvar BONUS_PASE = " + json.dumps(BONUS_PASE, ensure_ascii=False))
# El texto de cada reto sale del documento maestro (_AYUDA_DOC, por nombre); aquí se empareja con su
# id leyendo las etiquetas de RETOS_REGULAR/RETOS_PUA, que viven en Code.gs. Así el dato tiene UN solo
# origen y el emparejamiento tampoco se escribe a mano.
def _retos_del_gs(nombre):
    a = _gs.index("var %s = [" % nombre); b = _gs.index("\n];", a)
    return _re.findall(r'\["([A-Z0-9]+)","([^"]*)"', _gs[a:b])

_ayuda = dict(AYUDA_RETOS)          # X1, X2 y XF: no están en el documento
_sin = []
for _nom in ("RETOS_REGULAR", "RETOS_PUA"):
    for _rid, _et in _retos_del_gs(_nom):
        if _rid in _ayuda: continue
        # el nombre del reto va entre comillas angulares (REGULAR) o suelto dentro de la etiqueta (PUA):
        # se coge el más largo que encaje, para que «El juego» no gane a «El juego digital»
        _cand = sorted([k for k in _AYUDA_DOC if k in _et], key=len, reverse=True)
        if _cand: _ayuda[_rid] = _AYUDA_DOC[_cand[0]]
        else: _sin.append("%s · %s" % (_rid, _et))
if _sin:
    raise SystemExit("🔴 Estos retos se quedarían SIN explicación en el formulario, y eso es justo lo "
                     "que genera los correos al profesorado:\n   " + "\n   ".join(_sin))
_gs = _sustituir(_gs, "var AYUDA_RETOS = ", ";\n// AYUDA-FIN",
                 json.dumps(_ayuda, ensure_ascii=False, indent=1, sort_keys=True))
open(_gs_path, "w", encoding="utf-8").write(_gs)
# 🔴 27-ago noche · La copia de Code.gs NO la escribía nadie, pese al comentario de arriba. La página
# de instalación manda pegar `Code.gs.txt` y llevaba un día entero parada: sin el arreglo de la Nave
# en blanco ni el de la caché del CDN. Las cuatro copias se escriben AQUÍ, en un solo bucle, y la
# batería 19 comprueba que son idénticas a su fuente.
for _f in ("Code.gs", "Datos.gs", "Bonus.gs", "Imagenes.gs", "Dialog.html", "LectorTickets.gs"):
    open(os.path.join(HERE, "assets", "descargas", _f + ".txt"), "w", encoding="utf-8").write(
        open(os.path.join(HERE, "apps-script", _f), encoding="utf-8").read())
# Copias 100% ASCII para pegar sin riesgo de que se rompan los acentos (ver _ascii_gs.py)
import subprocess as _sp, sys as _sys
_sp.run(["python3", os.path.join(HERE, "_ascii_gs.py")], check=False, capture_output=True)
print("apps-script: CROMOS (%d cartas) + HEROES (%d) + NIVELES (%d) + RECOMPENSAS (%d) + AYUDA_RETOS (%d, %d sin escribir) regenerados"
      % (len(CROMOS), len(HEROES), len(NIVELES), len(RECOMPENSAS), len(AYUDA_RETOS),
         sum(1 for _v in AYUDA_RETOS.values() if _v.startswith("(falta)"))))

# ================= LAS IMÁGENES QUE EL JS CONSTRUYE, ¿ESTÁN? =================
# El 26-ago el cartel de «HÉROE DE LA REBELIÓN» pedía `heroes/<clave>.png` y los archivos son .jpg:
# la celebración salía con la figura rota, justo lo contrario de lo que se buscaba. El fallo no lo
# ve nadie leyendo el código, porque la ruta se arma concatenando. Así que aquí se arma igual:
# se sacan del JS los trozos literales que rodean a la clave y se mira si el archivo está en disco.
_RUTA = _re.compile(r"assets/img/(heroes|tarjetas)/'\s*\+\s*[A-Za-z0-9_.\[\]]+\s*\+\s*'([^']*?\.(?:jpg|png))")
_CATALOGO = {"heroes": [h[0] for h in HEROES], "tarjetas": [c[0] for c in CROMOS]}
_rotas = []
for _js in sorted(_glob.glob(os.path.join(HERE, "assets", "js", "*.js"))):
    for _carpeta, _cola in set(_RUTA.findall(open(_js, encoding="utf-8").read())):
        for _clave in _CATALOGO[_carpeta]:
            _f = os.path.join(HERE, "assets", "img", _carpeta, _clave + _cola)
            if not os.path.exists(_f):
                _rotas.append("%s → assets/img/%s/%s%s" % (os.path.basename(_js), _carpeta, _clave, _cola))
if _rotas:
    raise SystemExit("🔴 El JS pide imágenes que no existen (saldrían rotas en la Nave):\n   "
                     + "\n   ".join(_rotas[:12])
                     + ("\n   ... y %d más" % (len(_rotas) - 12) if len(_rotas) > 12 else ""))
print("imagenes: las %d rutas que arma el JS existen todas" % (len(_CATALOGO["heroes"]) + len(_CATALOGO["tarjetas"])))

# 🔴 La ficha del alumno (sala del docente) pinta el CATALOGO ENTERO: las 24 insignias, las 20
# cartas y los 30 personajes con su variante «_bloqueado» para los que aun no tiene. Son 104
# imagenes y ninguna la arma una ruta literal, asi que si falta una sale un hueco roto en la
# pantalla que el profesorado usa para hablar con un alumno. Se comprueban aqui, al construir.
_falta_ficha = []
for _k in NAVE_BADGES:
    if not os.path.exists(os.path.join(HERE, "assets", "img", "insignias", _k + ".png")):
        _falta_ficha.append("insignia " + _k)
for _c in CROMOS:
    if not os.path.exists(os.path.join(HERE, "assets", "img", "tarjetas", _c[0] + "_carta.png")):
        _falta_ficha.append("carta " + _c[0])
for _h in HEROES:
    for _suf in ("", "_bloqueado"):
        if not os.path.exists(os.path.join(HERE, "assets", "img", "heroes", _h[0] + _suf + ".jpg")):
            _falta_ficha.append("heroe " + _h[0] + _suf)
if _falta_ficha:
    raise SystemExit("\n🔴 A la ficha del alumno le faltan imágenes:\n   " + "\n   ".join(_falta_ficha))
print("ficha del alumno: las %d imágenes del catálogo completo existen todas"
      % (len(NAVE_BADGES) + len(CROMOS) + len(HEROES) * 2))

# ================= LAS ANCLAS DE LA VISITA GUIADA, ¿SIGUEN AHÍ? =================
# La sala del docente la pinta clase.js entera, así que los objetivos de la visita son ids y claves
# que viven en ESE fichero. Si alguien renombra un bloque, la visita señalaría al vacío sin decir ni
# mu (el paso se ve, pero no se resalta ni se baja a él). Aquí se comprueba, que es barato.
_clase_js = open(os.path.join(HERE, "assets", "js", "clase.js"), encoding="utf-8").read()
_sin_ancla = []
for _paso in TOUR_CLASE["pasos"]:
    for _sel in [_paso["sel"]] + ([_paso["sel2"]] if _paso.get("sel2") else []):
        _m = _re.match(r"^#([a-z-]+)$", _sel) or _re.match(r"^\[data-acc='([a-z]+)'\]$", _sel)
        if not _m:
            _sin_ancla.append("%s (no se sabe comprobar)" % _sel); continue
        _busca = ('id="%s"' % _m.group(1)) if _sel[0] == "#" else ("'%s')" % _m.group(1))
        if _busca not in _clase_js:
            _sin_ancla.append("%s → falta %s en clase.js" % (_sel, _busca))
if _sin_ancla:
    raise SystemExit("🔴 La visita guiada de la sala señala a sitios que ya no existen:\n   "
                     + "\n   ".join(sorted(set(_sin_ancla))))
print("visita guiada: los %d pasos de la sala señalan a anclas que existen" % len(TOUR_CLASE["pasos"]))

# ================= «CÓMO SE HACE»: LOS TRES CAMINOS (v3.43) =================
# Sustituye a los tres videos de onboarding que iba a grabar Norberto. Misma informacion,
# pero viva: el texto sale de PASOS (_site_data.py), las capturas las regenera
# _capturas_pasos.py y el audio del Capitan _audio_pasos.py. Cambiar una frase aqui la cambia
# en la pagina, en la voz y en el guion — un dato, un sitio.
_DIR_PASOS = os.path.join(HERE, "assets", "img", "pasos")
_DIR_AUD   = os.path.join(HERE, "assets", "audio", "pasos")
os.makedirs(_DIR_PASOS, exist_ok=True); os.makedirs(_DIR_AUD, exist_ok=True)

def _paso_html(i, s, camino):
    cod = s["cod"]
    clase = "paso aviso" if s.get("aviso") else "paso"
    # la captura: si falta, un hueco honesto en ambar en vez de una imagen rota
    img = s.get("img")
    if img and os.path.exists(os.path.join(_DIR_PASOS, img)):
        v = _ver(os.path.join("assets", "img", "pasos", img))
        fig = ('<figure><img src="assets/img/pasos/%s?v=%s" alt="%s" loading="lazy"></figure>'
               % (img, v, s["t"].replace('"', "")))
    else:
        # 🔴 12-sep · El texto decía «vive detrás de un PIN o dentro de la hoja maestra». Ya no queda
        # ninguna así: las dos que faltan son pulsar un botón y copiar un enlace, y una foto de eso
        # no enseña nada. Un cartel que da una razón que ya no existe confunde más que no ponerlo.
        fig = ('<div class="paso-falta"><b>Sin captura, a propósito</b>'
               'Este paso es un gesto —pulsar un botón, copiar un enlace— y una foto no añade nada. '
               'Si algún día hace falta, se deja el PNG en <code>assets/img/pasos/</code> y se '
               'vuelve a construir.</div>')
    # el audio, solo si existe el mp3
    mp3 = os.path.join(_DIR_AUD, cod + ".mp3")
    aud = ""
    if os.path.exists(mp3):
        aud = ('<button class="paso-audio" type="button" data-audio="assets/audio/pasos/%s.mp3">'
               '▶ Escuchar al Capitán</button>' % cod)
    return ('<article class="%s" id="%s"><div class="paso-num">'
            '<img class="cap" src="assets/img/capitan/%s.png" alt="" loading="lazy">'
            '<span class="n">%s</span></div>'
            '<div class="paso-cuerpo"><h3><a href="#%s">%s</a></h3>'
            '<p class="paso-hacer">%s</p>%s<p class="paso-voz">%s</p>%s</div></article>'
            % (clase, cod, s["pose"], cod, cod, s["t"], s["hacer"], fig, s["voz"], aud))

_tabs, _paneles, _faltan = [], [], []
for _ci, _c in enumerate(PASOS):
    _sel = "true" if _ci == 0 else "false"
    _tabs.append('<button class="camino-tab" role="tab" aria-selected="%s" aria-controls="cam-%s" '
                 'id="tab-%s" data-camino="%s"><i>%s</i><b>%s<span>%s</span></b></button>'
                 % (_sel, _c["id"], _c["id"], _c["id"], _c["icono"], _c["titulo"], _c["cuanto"]))
    _cuerpo = "".join(_paso_html(_i, _s, _c) for _i, _s in enumerate(_c["pasos"]))
    for _s in _c["pasos"]:
        if not _s.get("img") or not os.path.exists(os.path.join(_DIR_PASOS, _s["img"] or "")):
            _faltan.append("%s (%s)" % (_s["cod"], _c["titulo"]))
    _paneles.append('<section class="camino-panel" id="cam-%s" role="tabpanel" aria-labelledby="tab-%s"%s>'
                    '<div class="camino-intro"><p><b>Para quién:</b> %s</p><p>%s</p></div>%s</section>'
                    % (_c["id"], _c["id"], "" if _ci == 0 else " hidden", _c["quien"], _c["porque"], _cuerpo))

_PASOS_JS = """
<script>
(function(){
 var tabs=[].slice.call(document.querySelectorAll('.camino-tab'));
 var pans=[].slice.call(document.querySelectorAll('.camino-panel'));
 function ver(id,guardar){
   tabs.forEach(function(t){t.setAttribute('aria-selected', t.dataset.camino===id?'true':'false');});
   pans.forEach(function(p){p.hidden = p.id!=='cam-'+id;});
   if(guardar){ try{localStorage.setItem('sgCamino',id);}catch(e){}
     history.replaceState(null,'','?camino='+id); }
 }
 tabs.forEach(function(t){ t.onclick=function(){ver(t.dataset.camino,true);}; });
 // el enlace manda: ?camino=… o una ancla #R3 abren su camino solo
 var q=(location.search.match(/camino=([a-z]+)/)||[])[1];
 var anc=(location.hash||'').replace('#','');
 if(!q && anc){ pans.forEach(function(p){ if(p.querySelector('#'+CSS.escape(anc))) q=p.id.slice(4); }); }
 if(!q){ try{q=localStorage.getItem('sgCamino');}catch(e){} }
 if(q && document.getElementById('cam-'+q)) ver(q,false);
 if(anc){ var el=document.getElementById(anc); if(el) setTimeout(function(){el.scrollIntoView({block:'center'});},60); }
 // un solo audio a la vez
 var sonando=null;
 document.addEventListener('click',function(e){
   var b=e.target.closest && e.target.closest('.paso-audio'); if(!b) return;
   if(sonando){ sonando.pause(); document.querySelectorAll('.paso-audio').forEach(function(x){x.removeAttribute('data-sonando');x.textContent='\\u25b6 Escuchar al Capit\\u00e1n';}); }
   if(b.getAttribute('data-sonando')){ sonando=null; return; }
   sonando=new Audio(b.getAttribute('data-audio'));
   b.setAttribute('data-sonando','1'); b.textContent='\\u23f8 Parar';
   sonando.onended=function(){ b.removeAttribute('data-sonando'); b.textContent='\\u25b6 Escuchar al Capit\\u00e1n'; sonando=null; };
   sonando.play();
 });
})();
</script>"""

_html = head("STARGATE · Cómo se hace", "Los tres caminos de STARGATE paso a paso, con capturas y la voz "
             "del Capitán: crear el grupo, dar las clases y alistarse como recluta.", "pasos", puerta=True) + f'''
<header class="hero"><div class="kicker">Paso a paso</div><h1>Cómo se hace</h1>
<p>Tres caminos, según lo que seas hoy. Cada paso dice <b>dónde pulsar</b> y <b>qué está pasando</b>.
Es la misma información que habría en un vídeo, pero se actualiza con el sistema en vez de envejecer con él.</p></header>
<section id="pasos"><div class="wrap">
<div class="caminos" role="tablist" aria-label="Elige tu camino">{"".join(_tabs)}</div>
{"".join(_paneles)}
</div></section>
{_PASOS_JS}
''' + FOOT
open(os.path.join(HERE, "pasos.html"), "w", encoding="utf-8").write(_html)
print("escrito: pasos.html  (%d pasos en %d caminos)" % (sum(len(c["pasos"]) for c in PASOS), len(PASOS)))
_ntot = sum(len(c["pasos"]) for c in PASOS)
_naud = sum(1 for c in PASOS for s in c["pasos"] if os.path.exists(os.path.join(_DIR_AUD, s["cod"] + ".mp3")))
print("   capturas: %d de %d puestas%s" % (_ntot - len(_faltan), _ntot,
      ("  ·  faltan: " + ", ".join(_faltan)) if _faltan else ""))
print("   audio del Capitán: %d de %d (se genera con _audio_pasos.py)" % (_naud, _ntot))


# ================= COMPROBACIÓN DE LA WEB PUBLICADA (§12.9) =================
# A propósito NO se hace por defecto: el build tiene que funcionar sin internet. Pero el 504 de
# Hostinger del 25-ago nos costó una ejecución entera de Apps Script y se descubrió de casualidad,
# así que al menos queda el recordatorio a la vista.
if "--check" in _sys.argv:
    print("\n--- comprobando la web publicada ---", flush=True)
    _sys.exit(_sp.run([_sys.executable, os.path.join(HERE, "comprobar_web.py")]).returncode)
print("\nrecuerda: python3 comprobar_web.py  ANTES de crear un PER o actualizar las imágenes de los\n"
      "formularios (de esa web bajan los orbes; si está caída, el alta se arrastra o queda a medias).")


# ================= EL MOTOR NUEVO (Firestore) =================
# Dos páginas que no hablan con Apps Script sino con el motor de GamificaPro. Conviven con todo lo
# demás: mientras el sistema viejo siga en pie, estas son un camino paralelo que no estorba.
#
# 🔴 El catálogo NO se escribe aquí. Se congela desde Datos.gs con motor/catalogo.js, para que un
# reto añadido en la hoja llegue solo a Firestore. «Un dato, un sitio».
import json as _json, subprocess as _subp
_CAT = os.path.join(HERE, "motor", "catalogo.json")
try:
    _subp.run(["node", os.path.join(HERE, "motor", "catalogo.js")], check=True,
              stdout=open(_CAT, "w", encoding="utf-8"))
    print("escrito: motor/catalogo.json  (el catálogo, congelado desde Datos.gs)")
except Exception as _e:
    print("⚠️  no he podido regenerar motor/catalogo.json: %s" % _e)

FIREBASE = {"apiKey": "AIzaSyBv-PLACEHOLDER", # 🔴 EL NOMBRE QUE LEE UN ESTUDIANTE AL ENTRAR. Google escribe «Iniciar sesión en <authDomain>», y
    # ese era `gamificapro-99e0a.firebaseapp.com`: un identificador de máquina, en la primera
    # pantalla y justo cuando hay que dar confianza. Norberto: «¿es necesario que salga este nombre
    # tan feo?». No.
    # 🔴🔴 13-sep · Y NO: `gamificapro.mistercuarter.es` NO es Firebase Hosting. Está en Hostinger, y en
    # /__/auth/handler devuelve la app de GamificaPro con un 200 (el comodín de una SPA contesta 200 a
    # CUALQUIER ruta). El «comprobado con curl: 200» del 12-sep miraba el código y no el contenido.
    # Resultado: la ventana de Google abría GamificaPro y NUNCA terminaba de entrar. Solo funcionaban
    # las sesiones ya guardadas; una persona nueva no podía entrar. GamificaPro usa firebaseapp.com.
    # Para que ponga «stargate» hay que alojar el ayudante de Google en este dominio Y añadir su
    # dirección en la consola de Google Cloud — eso es una decisión de Norberto, no un arreglo.
    # La batería 70 comprueba que el authDomain sirve el ayudante DE VERDAD (su contenido).
    "authDomain": "gamificapro-99e0a.firebaseapp.com",
            "projectId": "gamificapro-99e0a", "storageBucket": "gamificapro-99e0a.firebasestorage.app",
            "messagingSenderId": "388656371280", "appId": "1:388656371280:web:b3d4178a235df271846355"}
_FB = os.path.join(HERE, "assets", "js", "firebase_config.json")
if os.path.exists(_FB):
    FIREBASE = _json.load(open(_FB, encoding="utf-8"))

def _ver_assets(html):
    """La marca de versión en CSS y JS. Sin esto el navegador sirve la hoja de estilos de ayer y la
    página sale a medio maquetar sin que nada falle: el peor tipo de error, el que no avisa."""
    return (html.replace('assets/css/stargate.css"', 'assets/css/stargate.css?v=' + _ver("assets/css/stargate.css") + '"')
                .replace('assets/js/stargate.js"', 'assets/js/stargate.js?v=' + _ver("assets/js/stargate.js") + '"')
                .replace('assets/js/tour.js"', 'assets/js/tour.js?v=' + _ver("assets/js/tour.js") + '"'))

def _v(rel):
    """La ruta con su huella. Sin esto, cambiar un fichero y no verlo cambiar es cuestión de tiempo
    —y el síntoma es siempre el mismo: «pero si eso ya lo he arreglado»."""
    return rel + "?v=" + _ver(rel)

def _cabeza_motor():
    """Los scripts del motor, para las páginas que SIEMPRE lo usan (consola, crear, alistarse…)."""
    return (
        '<script>window.SG_FIREBASE=' + _json.dumps(FIREBASE) + ';'
        'window.SG_CATALOGO_URL="' + _v("motor/catalogo.json") + '";'
        'window.SG_TICKET_URL=' + _json.dumps(TICKET_URL) + ';'
        # El banco de alias solo lo usa el alistamiento, pero va con el resto: son 4 KB y evita una
        # descarga aparte justo en la pantalla donde más prisa tiene la gente.
        'window.SG_ALIAS=' + _json.dumps(ALIAS_SUGERIDOS) + ';'
        # la regla de evidencia de cada reto: la consola marca a quien le falten enlaces obligatorios
        'window.SG_EVIDENCIA=' + _json.dumps(EVIDENCIA_RETOS) + ';window.SG_TOPE_DIA=' + str(TOPE_RETOS_DIA) + ';</script>'
        '<script src="' + _v("motor/paquete.js") + '" defer></script>'
        '<script src="' + _v("motor/tablero.js") + '" defer></script>'
        '<script type="module" src="' + _v("assets/js/motor.js") + '"></script>')

def _cabeza_fuente():
    """
    Para las páginas que hablan con UN motor u OTRO: la Nave, la sala de clase, el panel.

    🔴 Firebase solo se carga si de verdad se va a usar. Mientras el sistema viejo siga en pie, la
    Nave de siempre no puede pagar medio megabyte de SDK que no necesita — y sobre todo no puede
    romperse si Google tarda en servirlo.
    """
    cfg = _json.dumps(FIREBASE)
    modo = _json.dumps(MOTOR_POR_DEFECTO)
    return (
        '<script>window.SG_FIREBASE=' + cfg + ';window.SG_MOTOR=' + modo + ';'
        'window.SG_TICKETS_API=' + _json.dumps(TICKETS_API) + ';'
        'window.SG_TICKETS_HOJA=' + _json.dumps(TICKETS_HOJA) + ';'
        'window.SG_CATALOGO_URL="' + _v("motor/catalogo.json") + '";</script>'
        '<script src="' + _v("assets/js/fuente.js") + '" defer></script>'
        '<script src="' + _v("assets/js/fiesta.js") + '" defer></script>'
        '<script>(function(){var q=new URLSearchParams(location.search);'
        'if(((q.get("motor")||window.SG_MOTOR||"apps")+"").toLowerCase()!=="firestore")return;'
        '["' + _v("motor/paquete.js") + '","' + _v("motor/tablero.js") + '"].forEach(function(u){'
        'var e=document.createElement("script");e.src=u;e.defer=true;document.head.appendChild(e);});'
        # El catálogo lo pide motor.js, que se carga justo debajo. Pedirlo también aquí hacía dos
        # descargas del mismo fichero en cada visita.
        'var m=document.createElement("script");m.type="module";m.src="' + _v("assets/js/motor.js") + '";'
        'document.head.appendChild(m);})();</script>')

# 🔴 12-sep · GIRADO A «firestore». Hasta hoy mandaba «apps» y el motor nuevo solo se veía
# añadiendo ?motor=firestore a mano — es decir: el enlace que reparte un docente entraba al sistema
# VIEJO. Norberto lo zanjó: «vamos a usar LO NUEVO, el legacy ahora me da igual».
# La vuelta atrás sigue existiendo y es de un carácter: ?motor=apps en la URL, o este valor.
MOTOR_POR_DEFECTO = "firestore"

# ---------------------------------------------------------------- la consola del referente
_html = head("STARGATE · Crear un grupo",
             "Crea un grupo (PER) de STARGATE: calendario, equipo docente, padlet y paneles. Sin hojas de cálculo.",
             "reg").replace("</head>", _cabeza_motor() + "\n</head>") + f'''
<header class="hero corto"><div class="kicker">Solo profesorado referente</div><h1>Crear un grupo</h1>
<p>Escribe cinco datos y el grupo queda sembrado entero: los {len(RETOS_REGULAR)} retos con sus insignias, los 8 planetas,
la tienda con sus precios y fechas, el álbum de cromos y el vestuario de héroes. Sin hojas de cálculo
y sin formularios: la fecha de la semana 1 decide el calendario completo.</p></header>
<section id="crear"><div class="wrap">
<div id="crear-app"><p class="muted">Cargando…</p></div>
''' + '<script src="' + _v("assets/js/crear.js") + '" defer></script>' + '''
</div></section>
''' + FOOT
open(os.path.join(HERE, "crear.html"), "w", encoding="utf-8").write(_ver_assets(_html))
print("escrito: crear.html  (la consola del referente)")

# ---------------------------------------------------------------- validar un reto desde fuera
# Pública a propósito: el enlace vive dentro de un Genially y lo pulsa el alumnado.
_html = head("STARGATE · Validar un reto",
             "Registra un reto de STARGATE desde una presentación, un escape room o un juego.",
             "reg", publica=True).replace("</head>", _cabeza_motor() + "\n</head>") + '''
<header class="hero"><div class="kicker">Registro de reto</div><h1>Validar</h1></header>
<section id="validar"><div class="wrap">
<div id="validar-app"><p class="muted">Cargando…</p></div>
''' + '<script src="' + _v("assets/js/validar.js") + '" defer></script>' + '''
<p class="small muted nota-docente" style="margin-top:22px">Para el profesorado: este enlace sirve en
<b>todos</b> los grupos y en todas las convocatorias. El grupo no va en el enlace — lo pone quien
pulsa, porque se le busca por su cuenta. Móntalo una vez en tu presentación y olvídate.</p>
</div></section>
''' + FOOT
open(os.path.join(HERE, "validar.html"), "w", encoding="utf-8").write(_ver_assets(_html))
print("escrito: validar.html  (enlaces universales para Genially)")

# ---------------------------------------------------------------- la llamada a filas (embed Genially)
# Pública a propósito: vive dentro del Genially que el docente PROYECTA, así que la ve la clase
# entera. Quien no sea Comandante recibe un mensaje que lo explica y no pasa nada más.
_html = head("STARGATE · Llamada a filas",
             "El botón del pase de lista de STARGATE: lo toca el Comandante y el fichaje se abre "
             "solo para su escuadrón, el tiempo que él decida.",
             "reg", publica=True).replace("</head>", _cabeza_motor() + "\n</head>") + '''
<header class="hero corto"><div class="kicker">Pase de lista</div><h1>Llamada a filas</h1></header>
<section id="llamada"><div class="wrap">
<div id="llamada-app"><p class="muted">Cargando…</p></div>
''' + '<script src="' + _v("assets/js/llamada.js") + '" defer></script>' + '''
<p class="small muted nota-docente" style="margin-top:22px">Para el profesorado: este enlace vale en
<b>todos</b> los grupos y en todas las convocatorias. El grupo no va dentro — se deduce de quién
pulsa. Móntalo una vez en tus presentaciones y no vuelvas a tocarlo.<br>
Con <code>?embed=1</code> se incrusta sin cabecera ni pie.</p>
</div></section>
''' + FOOT
open(os.path.join(HERE, "llamada.html"), "w", encoding="utf-8").write(_ver_assets(_html))
print("escrito: llamada.html  (el pase de lista, dentro del Genially)")

# ---------------------------------------------------------------- LA PUERTA ÚNICA
# 🔴 12-sep · «Después botón de iniciar sesión con Google y ya detecta si es docente, estudiante o
# referente. Una vez iniciada sesión, si no detecta usuario, le pide introducir código de clase.»
#
# Pública porque es, literalmente, la puerta: si pidiera algo para llegar a ella no serviría de
# nada. Y deliberadamente CORTA — una tarjeta y un botón, sin hero que empuje nada bajo el pliegue.
# Esa fue la causa exacta del fallo que la trajo: en `clase.html` el botón de Google quedaba a 734 px
# de scroll y la persona concluía que no había forma de entrar.
_html = head("STARGATE · Entrar",
             "Entra en STARGATE con tu cuenta de Google. El sistema reconoce si eres estudiante o "
             "docente y te lleva a tu sitio.",
             "reg", publica=True).replace("</head>", _cabeza_motor() + "\n</head>") + \
'''
<section id="entrar"><div class="wrap wrap-puerta">
<div id="entrar-app"><div class="card puerta-unica"><h3>Abriendo…</h3></div></div>
''' + '<script src="' + _v("assets/js/entrar.js") + '" defer></script>' + '''
</div></section>
''' + FOOT
open(os.path.join(HERE, "entrar.html"), "w", encoding="utf-8").write(_ver_assets(_html))
print("escrito: entrar.html  (la puerta única: Google decide quién eres)")

# ---------------------------------------------------------------- el huevo de Pascua
# 🔴 Pública como la llamada, y por el mismo motivo: vive DENTRO de una presentación. Aquí el
# secreto no es el enlace —circulará, seguro— sino ENCONTRARLO. Y aunque alguien lo comparta, cada
# escondite se reclama una sola vez por persona: lo impide la marca en su propia ficha.
_html = head("STARGATE · Un escondite",
             "Has encontrado un escondite de la Tripulación Cero. Reclama lo que hay dentro.",
             "reg", publica=True).replace("</head>", _cabeza_motor() + "\n</head>") + '''
<header class="hero corto"><h1>Un escondite</h1></header>
<section id="huevo"><div class="wrap">
<div id="huevo-app"><p class="muted">Cargando…</p></div>
''' + '<script src="' + _v("assets/js/sobre.js") + '" defer></script>' + '<script src="' + _v("assets/js/huevo.js") + '" defer></script>' + '''
<p class="small muted nota-docente" style="margin-top:22px">Para el profesorado: un enlace por premio
(<code>?h=p1</code>, <code>?h=p2</code>…), y cada uno vale en <b>todos</b> los grupos y todas las
convocatorias — el grupo se deduce de quién pulsa. Se configuran en
<a href="consola.html">Mis grupos</a> → Ver mi gente y los ajustes → <b>Premios por enlace</b>.<br>
Con <code>?embed=1</code> se incrusta sin cabecera ni pie.</p>
</div></section>
''' + FOOT
open(os.path.join(HERE, "huevo.html"), "w", encoding="utf-8").write(_ver_assets(_html))
print("escrito: huevo.html  (el escondite de cada presentación)")

# ---------------------------------------------------------------- el aula (embed del docente)
# 🔴 El puesto de mando del docente DENTRO del Genially. El enemigo de una gamificación en clase es
# tener que salir de la presentación: abrir otra pestaña, buscar el grupo, volver, perder el hilo.
# Aquí está lo que hace falta para mover la clase sin salir. Y el grupo no va en el enlace: se
# deduce de quién pulsa, así que es UNO para todos los Geniallys y todos los años.
_html = head("STARGATE · El aula",
             "El puesto de mando del docente dentro del Genially: llamada a filas, quién ficha en "
             "directo, a quién felicitar, el ranking y premios a mano.",
             "reg").replace("</head>", _cabeza_motor() + chr(10) + '<script>window.SG_SEMANAS=' + SEMANAS_JSON + ';</script>' + "\n</head>") + '''
<header class="hero corto"><div class="kicker">Profesorado</div><h1>El aula</h1>
<p>Todo lo que hace falta para mover tu clase, sin salir del Genially.</p></header>
<section id="aula"><div class="wrap">
<div id="aula-app"><p class="muted">Cargando…</p></div>
''' + '<script src="' + _v("assets/js/aula.js") + '" defer></script>' + '''
<p class="small muted" style="margin-top:22px">Este enlace vale en <b>todos</b> tus grupos y en todas
las convocatorias: el grupo se deduce de tu cuenta. Móntalo una vez en tus Geniallys.<br>
Con <code>?embed=1</code> se incrusta sin cabecera ni pie, y con <code>?per=&lt;grupo&gt;</code> se
fija a uno concreto si das clase en varios.</p>
</div></section>
''' + FOOT
open(os.path.join(HERE, "aula.html"), "w", encoding="utf-8").write(_ver_assets(_html))
print("escrito: aula.html  (el puesto de mando dentro del Genially)")

# ---------------------------------------------------------------- alistarse (sustituye al formulario)
_html = head("STARGATE · Alistarse",
             "Alístate en tu grupo de STARGATE: entra con tu cuenta, elige Comandante y personaje y abre tu Bitácora.",
             "reg", publica=True).replace("</head>", _cabeza_motor() + "\n</head>") + '''
<header class="hero"><div class="kicker">Alistamiento</div><h1>Únete a la tripulación</h1>
<p>Se hace una vez. Entra con tu cuenta, di quién eres y elige a tu Comandante: él te llevará a tu escuadrón.</p></header>
<section id="alistarse"><div class="wrap">
<div id="alistarse-app"><p class="muted">Cargando…</p></div>
''' + '<script src="' + _v("assets/js/alistarse.js") + '" defer></script>' + '''
</div></section>
''' + FOOT
open(os.path.join(HERE, "alistarse.html"), "w", encoding="utf-8").write(_ver_assets(_html))
print("escrito: alistarse.html  (el alistamiento, sin formularios)")

# ---------------------------------------------------------------- la consola (sustituye a la hoja)
_html = head("STARGATE · Consola",
             "Puesto de mando de STARGATE: alumnado, cola de nota, equipo docente y ajustes de cada grupo.",
             "reg").replace("</head>", _cabeza_motor() + "\n</head>") + '''
<!-- 🔴 HERO MÍNIMO. Aquí se viene a hacer algo, no a leer: un titular de tres líneas explicando la
     página empujaba los grupos fuera de la primera pantalla. Quien entra ya sabe a qué viene, y si
     no lo sabe, verlos es la mejor explicación posible. -->
<header class="hero corto"><h1>Mi puesto de mando</h1></header>
<section id="consola"><div class="wrap">
<div id="consola-app"><p class="muted">Cargando…</p></div>
''' + '<script src="' + _v("assets/js/consola.js") + '" defer></script>' + '''
</div></section>
''' + FOOT
open(os.path.join(HERE, "consola.html"), "w", encoding="utf-8").write(_ver_assets(_html))
print("escrito: consola.html  (el puesto de mando, sin hoja de cálculo)")

# ---------------------------------------------------------------- el interruptor, en las páginas de siempre
# La Nave, la sala de clase, el panel y la sesión proyectable tienen que poder hablar con CUALQUIERA
# de los dos motores. Se les añade aquí, al final, porque se escriben mucho antes de que exista
# `_cabeza_fuente` — y moverlas de sitio para ahorrarse este paso sería tocar media construcción por
# una elegancia que nadie va a ver.
for _f in ("recluta.html", "clase.html", "panel.html", "sesion.html", "grupos.html", "tickets.html",
           "profes.html", "registro.html", "embed.html", "foro.html"):
    _ruta = os.path.join(HERE, _f)
    if not os.path.exists(_ruta):
        continue
    _h = open(_ruta, encoding="utf-8").read()
    if "assets/js/fuente.js" in _h:
        continue
    _h = _h.replace("</head>", _cabeza_fuente() + "\n</head>", 1)
    open(_ruta, "w", encoding="utf-8").write(_ver_assets(_h))
print("interruptor de motor puesto en: recluta, clase, panel, sesión, grupos, tickets y profes")
