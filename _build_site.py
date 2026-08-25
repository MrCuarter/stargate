# -*- coding: utf-8 -*-
"""Genera el sitio STARGATE v2 — «templo» del profesorado (23-ago-2026).
Páginas: index (portada) · guia · cronologia · actividades · geniallys · registro · recursos.
Ejecutar desde web-stargate/:  python3 _build_site.py
Datos de cronología/vídeos/geniallys en _site_data.py."""
import os, json, hashlib
from _site_data import (V, yt, CRONO, GENIALLYS, GENIALLY_CARPETA, foro_por_semana,
                        PLAYLIST, HERO_MP4, HERO_POSTER, TABLERO_API, PLANTILLA_EPORTFOLIO,
                        CROMOS, CROMO_SERIES, MONEDA, RANGOS, NIVELES, XP_VIAJE, CREDITOS,
                        RECOMPENSAS)

HERE = os.path.dirname(os.path.abspath(__file__))
FAV = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%9B%B8%3C/text%3E%3C/svg%3E"

NAV = [("index.html","Inicio","inicio"),("guia.html","Guía","guia"),("cronologia.html","Cronología","crono"),
       ("actividades.html","Actividades","act"),("geniallys.html","Geniallys","gen"),
       ("registro.html","Registro","reg"),("grupos.html","Grupos","grp"),("clase.html","Mi clase","cla"),("recursos.html","Recursos","rec")]

def head(title, desc, active):
    def _lnk(h, t, k):
        act = " active" if k == active else ""
        if k != "grp":
            return f'<a class="lnk{act}" href="{h}">{t}</a>'
        # «Grupos» despliega los PER activos (los pide stargate.js a la API; sin PIN)
        return (f'<div class="lnk drop{act}" id="nav-grupos"><button type="button" class="drop-btn" '
                f'aria-haspopup="true" aria-expanded="false">{t} <i>▾</i></button>'
                f'<div class="drop-menu" role="menu" hidden>'
                f'<a class="drop-all" href="{h}" role="menuitem">Ver todos los grupos →</a>'
                f'<div class="drop-list"><span class="drop-msg">Cargando grupos…</span></div></div></div>')
    links = "".join(_lnk(h, t, k) for h, t, k in NAV)
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
</head><body>
<nav class="nav"><div class="wrap">
<a class="brand" href="index.html">◈ STARGATE <span class="modo docente">Capitán<i> · docentes</i></span></a>
{links}
<button class="tour-start" type="button" title="Visita guiada con el Capitán">▶ Visita guiada</button>
</div></nav>'''

FOOT = '''<footer><div class="wrap">
STARGATE · La Bitácora Estelar — Proyecto Gamificado del <b>Máster en Tecnología Educativa</b> de la UNIR.<br>
Puesto de mando del profesorado — documento vivo. <a href="index.html">Inicio</a> · <a href="cronologia.html">Cronología</a> · <a href="guia.html#faq">Preguntas frecuentes</a>
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
ESP=[("E1_nebula","NEBULA","Reclutamiento","La Bitácora viva que narra el viaje"),
("E2_capitan","El Capitán","Presentar la Act. 1","El mando de la misión: tú, docente"),
("E3_vaeon","General Vaeon","Batalla final","Señor de la Estática (villano)")]
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
CARDS=[c[0] for c in CROMOS]                       # el álbum manda: 20 cartas en 4 series
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
 ("guia.html","🧭","La guía","Narrativa, personajes, retos e insignias y cómo dinamizarlo en clase."),
 ("cronologia.html","🗓️","La cronología","Semana a semana: qué vídeo, qué reto, qué insignia y el mensaje del foro."),
 ("actividades.html","🎯","Misiones y evaluación","Las dos actividades, el ePortfolio y el examen con los requisitos oficiales."),
 ("geniallys.html","🪐","Los Geniallys","Uno por planeta. La carpeta compartida con los estándar de tu perfil."),
 ("registro.html","🏅","Registro de insignias","Tablero en vivo por PER, formularios del alumnado y cómo funciona."),
 ("profes.html","🔐","Panel del profesorado","Alumnos, insignias, canjes y ajustes de cada PER (con PIN)."),
 ("tickets.html","🎟️","Tickets de salida","Valoraciones y dudas del alumnado, visual y por clase (con PIN)."),
 ("embed.html","🧩","Enlaces, embeds y QR","Elige tu PER y tu nombre: todo listo para pegar en Genially."),
 ("foro.html","💬","Foro dinamizador","El mensaje de la semana en curso (embebible en el Genially del PER) o todos de una vez, para copiar."),
 ("recluta.html","🚀","La Nave del Recluta","La web del alumnado: onboarding con NEBULA, planetas por semanas, su ficha y las recompensas."),
 ("panel.html","🪐","Panel de control","El mapa de los ocho planetas sobre el universo: cada uno lleva a la presentación de su tema."),
 ("recursos.html","📦","Sala de recursos","Tablero de las 24 insignias, ranking y materiales."),
]
tiles_html="\n".join(f'<a class="tile" href="{h}"><span class="ic">{i}</span><b>{t}</b><em>{d}</em></a>' for h,i,t,d in tiles)

PORTADA = head("STARGATE · Puesto de mando del profesorado",
  "Todo lo que un docente necesita para pilotar STARGATE: narrativa, cronología semana a semana, retos, insignias, vídeos y Geniallys.","inicio") + f'''
<header class="hero hero-video">
<video autoplay muted loop playsinline preload="auto" poster="{HERO_POSTER}"><source src="{HERO_MP4}" type="video/mp4"></video>
<div class="veil"></div>
<div class="hero-inner">
<div class="kicker">Puesto de mando del profesorado</div>
<h1>STARGATE</h1>
<div class="sub">La Bitácora Estelar</div>
<p>La galaxia se apaga por la Estática. Tu alumnado son los reclutas, ocho planetas son los ocho temas y
la Bitácora es su ePortfolio. Aquí está todo lo que necesitas para pilotar la misión.</p>
<div id="hero-cta" class="cta-row">
<button class="btn primary tour-start" type="button">▶ Visita guiada con el Capitán</button>
<a class="btn" href="cronologia.html">Ver la cronología</a>
<a class="btn ghost" href="{PLAYLIST}" target="_blank" rel="noopener">Serie completa en YouTube ↗</a>
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

<section id="secciones"><div class="wrap">
<div class="eyebrow teal">Navegación</div><h2>Dónde está cada cosa</h2>
<div class="tiles">{tiles_html}</div>
</div></section>

<section id="voces"><div class="wrap">
<div class="two">
<div>
<div class="eyebrow amber">Las tres voces</div><h2>NEBULA, el Capitán y Vaeon</h2>
<p class="lead"><b>NEBULA</b> narra y lanza los retos. <b>El Capitán eres tú</b>: das las órdenes (enunciados), reconoces los
logros (insignias) y sostienes la moral; el foro se firma siempre como <i>Capitán</i>, a secas. <b>Vaeon</b> silencia:
es la personificación de los errores de diseño educativo, y aparece en el Tema 5.</p>
<p><a class="btn" href="guia.html#pers">Conoce a la Tripulación Cero →</a></p>
</div>
<div class="trio"><img src="assets/img/personajes/nebula.png" alt="NEBULA"><img src="assets/img/capitan/brazos.png" alt="El Capitán"><img src="assets/img/personajes/vaeon.png" alt="General Vaeon"></div>
</div>
</div></section>
''' + FOOT

# ================= GUÍA (guia.html) =================
FAQ = [
 ("¿Tengo que cambiar mi programación para usar STARGATE?", "No. STARGATE no añade trabajo: <b>renombra y da sentido</b> al que ya existe (2 actividades + ePortfolio con 3 retos + tests). Sigue la programación oficial; la capa narrativa va encima."),
 ("¿Qué hago exactamente en la primera sesión?", "Pon el vídeo de <b>Sinopsis</b>, después el de <b>La Bitácora</b> (ePortfolio), preséntate como <b>Capitán</b>, publica el mensaje de reclutamiento del foro (está en la cronología, semana 1) y entrega en público la insignia de <b>Reclutamiento</b>. Deja una pregunta en el aire: «¿por qué se apagan los mundos?»."),
 ("¿Cuándo pongo cada vídeo?", "La <a href='cronologia.html'>cronología</a> lo dice semana a semana: la <b>intro</b> del planeta al abrir el tema, el <b>cierre</b> al terminar el bloque y el <b>fragmento</b> del tripulante justo después, como recompensa. Las misiones (Bitácora, Act. 1, Act. 2) al lanzar cada una."),
 ("Los vídeos están en «oculto» en YouTube, ¿funcionan?", "Sí. Un vídeo oculto se ve con el enlace y se puede insertar en Genially o en el aula virtual. Van pasando a públicos solos según el calendario de redes del canal; tú no tienes que tocar nada."),
 ("¿El Reto A puntúa?", "<b>Para nota, no</b> — y es a propósito: es el motor de motivación, y convertirlo en nota le quitaría la función. Sí da <b>100 xp</b> (que suben nivel) y <b>10 créditos ◈</b>, y su recompensa real es desbloquear al personaje (fragmento + insignia). El Reto B sí produce una evidencia evaluable de la Bitácora."),
 ("¿Cómo y cuándo entrego las insignias?", "En público y con ceremonia: publica el medallón en el foro/tablero al superar el reto y nombra el logro con la frase del personaje. Qué insignia va cada semana está en la cronología; cómo anotarlas, en <a href='registro.html'>Registro de insignias</a>."),
 ("¿Dónde están los enunciados y rúbricas oficiales?", "En <a href='actividades.html#docs'>Actividades → Documentos oficiales</a> (enunciados de la Act. 1 y 2, pautas del ePortfolio, instrucciones de uso de IA, rúbricas y planificación semanal)."),
 ("¿Qué pasa con el temario (PDF de los temas)?", "Los PDF de temas disponibles son de la programación anterior y con nombres cambiados; <b>no se publican aquí</b> hasta recibir el temario actualizado. Los vídeos de la serie ya siguen el orden nuevo (T6 ABJ → T7 Gamificación)."),
 ("Mi grupo es PUA (condensado). ¿Cómo lo adapto?", "Agrupa los mensajes del foro por bloque (dos semanas en un mensaje) y lanza los dos retos del tema juntos. La cronología sirve igual: son 15 semanas de contenido que tú compactas."),
 ("¿Cuál es la diferencia entre Ludo (T6) y Vínculo (T7)?", "En <b>Ludo se juega</b>: el juego ES la actividad (ABJ). En <b>Vínculo no se juega</b>: se toman elementos del juego (puntos, insignias, niveles, narrativa) y se ponen sobre una tarea que no es un juego (gamificación). Es el error conceptual más común: apóyate en Joran y Mara."),
 ("¿Cómo funciona el examen dentro de la historia?", "La batalla final ES el examen. En la semana 15 el vídeo <b>Plan de Ataque</b> lo presenta (caso, plataforma en directo, tablero de retos, reglas). Los tests de cada tema son el entrenamiento; la última semana hay repaso y simulacro."),
 ("¿Puedo mencionar Genially o la asignatura en público?", "En comunicación pública (redes, web abierta) el proyecto se nombra siempre «Proyecto Gamificado del Máster en Tecnología Educativa de la UNIR», sin la asignatura y sin citar herramientas. Dentro del aula y en este puesto de mando, sin problema."),
 ("¿Cómo registran los alumnos sus retos e insignias?", "Solos, en la <b>Bitácora de mando</b> de su PER (un formulario con inicio de sesión de Google y una única respuesta que editan cuando ganan una insignia). Los xp, el nivel, los créditos, las insignias y el <b>avatar que evoluciona</b> se calculan automáticamente y se ven en el <a href='registro.html'>tablero</a> y en su <a href='recluta.html'>Nave del Recluta</a>. Tú no tocas ninguna hoja."),
 ("¿Qué es la Nave del Recluta?", "La <a href='recluta.html'>web del alumnado</a> de su PER: se identifican con su correo (una vez por dispositivo) y ven su <b>personaje con rango y biografía</b>, su colección de insignias, la orden de la semana, los planetas que se van desbloqueando y las recompensas. Tiene onboarding con NEBULA. Entrégales el enlace o el QR (están en el Doc de enlaces del PER)."),
 ("¿Qué es el panel de control de los planetas?", "El <a href='panel.html'>mapa de la galaxia</a>: los ocho planetas sobre el universo, cada uno enlazando a la presentación de su tema. Con <code>?per=</code> los planetas se <b>desbloquean solos</b> según el calendario del PER. Sirve como página o incrustado en Genially; el <b>referente</b> decide si el PER usa el panel estándar o una copia propia (Panel de profes → Ajustes)."),
 ("¿Qué son los xp, los niveles y los créditos?", "Son <b>dos marcadores distintos</b>. Los <b>xp</b> (Reto A 100 · Reto B 250 · Actividad 500 · Batalla 500 · hitos 300) miden el viaje, <b>nunca bajan</b> y dan el <b>nivel del 1 al 10</b>: el personaje <b>evoluciona</b> al entrar en los niveles 3 (Cadete), 5 (Oficial), 8 (Comandante) y 10 (<b>Leyenda</b>, el viaje completo). Los <b>créditos ◈</b> (Reto A 10 · Reto B 30 · Actividad 60 · hitos 40) son la moneda: es lo único que se descuenta al canjear recompensas. Comprar cromos no baja de nivel a nadie. Todo automático; tabla completa en <a href='registro.html#economia'>Registro</a>."),
 ("¿Cómo abro un PER nuevo?", "Lo hace el <b>profesor/a referente</b> desde la hoja maestra (cuenta mutecdgami): menú STARGATE → Crear nuevo PER… (nombre, REGULAR/PUA, fecha de la semana 1, profesorado). En un minuto tienes los 3 formularios, el tablero, el foro dinámico, la Nave del Recluta y un <b>documento con todos los enlaces, embeds y QR</b> para repartir al profesorado. El referente también decide el <b>panel de control Genially</b> del PER (estándar o propio). Guía en <a href='registro.html#instalacion'>Registro → Instalación</a>."),
 ("¿Qué hago si un alumno no hace el Reto A?", "Nada punitivo: no cuenta para nota. Pero el tripulante sigue «sin recuperar» y esos 100 xp y 10 ◈ se quedan sin ganar: usa la narrativa (NEBULA sigue incompleta) como invitación, no como castigo. Lo habitual es que el grupo arrastre."),
]
faq_html="\n".join(f'<details class="faq"><summary>{q}</summary><div>{a}</div></details>' for q,a in FAQ)

GUIA = head("STARGATE · Guía para el profesorado",
  "La gamificación STARGATE: narrativa, personajes, retos e insignias, la Bitácora y cómo dinamizarla en clase.","guia") + f'''
<header class="hero"><div class="kicker">Guía para el profesorado</div>
<h1>La guía</h1>
<p>La capa narrativa que convierte la asignatura en una misión: cruzar ocho planetas y construir una
<b>Bitácora</b> —el ePortfolio— tan viva que reencienda lo que la Estática apaga.</p>
<p style="margin-top:18px"><span class="pill">8 planetas = 8 temas</span><span class="pill">24 insignias</span><span class="pill">20 cromos coleccionables</span><span class="pill">2 actividades + ePortfolio</span></p>
</header>

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
<h3 style="margin-top:1.8em">El álbum completo — 20 cartas en 4 series</h3>
<p class="lead">Cada carta trae retrato, historia breve, clase, atributos y cita. Regla de oro, y conviene
decirla en clase: <b>la insignia se gana, el cromo se compra</b>. El Reto A da la <b>insignia</b> del
tripulante; las <b>20 cartas del álbum salen únicamente de los sobres</b> (15 ◈, desde la semana 2), al azar
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
(Reto A 10 · Reto B 30 · Actividad 60 · hitos 40) y son <b>lo único que se descuenta</b> en el canje.
El viaje completo da <b>590 ◈</b> y todo lo cosmético cuesta 280: <b>hay que elegir</b>.</p></div>
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
<div class="eyebrow">Lo práctico</div><h2>Cómo dinamizarlo en clase</h2>
<div class="tips">
<div class="tip"><b>Empieza con el gancho, no con el temario.</b> Primera sesión: vídeo de sinopsis, preséntate como <b>Capitán</b>, reparte la insignia de <b>Reclutamiento</b> y deja una pregunta en el aire.</div>
<div class="tip"><b>Un mensaje de foro por semana</b> (ya redactados, en la <a href="cronologia.html">cronología</a>): introducen el tema con la narrativa y cierran con la "Bitácora de esta semana". Solo pon tu nombre y el enlace de la herramienta del momento.</div>
<div class="tip"><b>Separa los dos retos en tu discurso.</b> El Reto A como <i>invitación</i> ("recupera a Bran"); el Reto B como <i>encargo</i> con criterios.</div>
<div class="tip"><b>Entrega las insignias en público.</b> El refuerzo funciona cuando se ve: publica el medallón y nombra el logro con la frase del personaje. Un tablero con las 24 hace visible el avance.</div>
<div class="tip"><b>Vincula siempre reto → Bitácora.</b> Cada Reto B <i>ya es</i> una página del ePortfolio (y a veces media actividad grande resuelta). Así no acumulan tareas: construyen.</div>
<div class="tip"><b>Usa la distinción Ludo/Vínculo como momento estrella.</b> En T6 <b>se juega</b> (el juego ES la actividad); en T7 <b>no</b> (se toman elementos del juego). Apóyate en Joran y Mara.</div>
<div class="tip"><b>Reserva a Vaeon para subir la tensión.</b> Haz que la Estática aparezca en T5: justo cuando saben medir, surge el enemigo que silencia.</div>
<div class="tip"><b>Cierra con La Liberación.</b> En el repaso final, la Bitácora completa vence a la Estática y abre la puerta a la Tierra. Celebra las Bitácoras publicadas.</div>
<div class="tip"><b>Lo atemporal en los vídeos, lo actual en el foro.</b> Los vídeos hablan solo de conceptos (no nombran apps); las herramientas concretas viven en el foro.</div>
</div>
<blockquote>Errores a evitar: convertir el Reto A en nota · dar insignias sin ceremonia · meter nombres de apps en los vídeos · pedir solo entregables sin la capa narrativa · confundir ABJ y Gamificación delante del alumnado.</blockquote>
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
docs_html="\n".join(f'<a class="doc" href="assets/docs/{f}" download><span class="ext">{f.rsplit(".",1)[1].upper()}</span><b>{t}</b><em>{d}</em></a>' for f,t,d in DOCS)

ACT = head("STARGATE · Actividades y evaluación",
  "Las misiones (actividades), el ePortfolio, la evaluación, el examen y los documentos oficiales de la asignatura con su marco narrativo STARGATE.","act") + f'''
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
<div class="card"><h3>Repaso + simulacro</h3><p>Semana 15: <b>repaso</b> y <b>simulacro</b> (hay un <a href="assets/docs/Ejemplo_examen.pdf">ejemplo de examen</a>).</p></div>
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
  "Tablero de las 24 insignias, ranking de reclutas y materiales del proyecto STARGATE.","rec") + f'''
<header class="hero"><div class="kicker">Sala de recursos</div>
<h1>Sala de recursos</h1>
<p>El tablero de las 24 insignias, el ranking de reclutas y los materiales gráficos. Los Geniallys tienen
<a href="geniallys.html">su propia sala</a>; los vídeos viven en la <a href="cronologia.html">cronología</a>.</p>
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
<p class="lead">El marcador de la misión vive en el <b>tablero en vivo de cada PER</b>: se alimenta solo de la
Bitácora de mando del alumnado (insignias, xp, rangos y avatares).</p>
<div class="cta-row"><a class="btn primary" href="registro.html#tablero">Ver el tablero en vivo →</a><a class="btn" href="embed.html">Incrustarlo en tu Genially</a></div>
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
  "Qué vídeo proyectar, qué reto lanzar, qué insignia entregar y el mensaje del foro de cada semana del curso STARGATE.","crono") + f'''
<header class="hero"><div class="kicker">Carta de navegación</div>
<h1>Cronología</h1>
<p>Las <b>15 semanas</b> del curso, sin fechas (cambian cada convocatoria): qué vídeo se proyecta, qué reto se lanza, qué
insignia se entrega, el hito de evaluación y el mensaje del foro listo para copiar. Después viene la semana 16: el examen.</p>
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
  "Los Geniallys de cada planeta del proyecto STARGATE: carpeta del equipo y enlaces por tema.","gen") + f'''
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
  "El sistema de autoregistro de STARGATE: el alumnado registra sus insignias, el tablero se actualiza solo y el profesorado anima y da la ceremonia.","reg") + f'''
<header class="hero"><div class="kicker">Registro y tablero en vivo</div>
<h1>Registro de insignias</h1>
<p>El registro es <b>automático</b>: cada estudiante anota sus propias insignias en la <b>Bitácora de mando</b> de su PER
y los xp, los rangos y el <b>tablero</b> se calculan solos. Tu papel como docente no es apuntar nada:
es <b>animar</b> — entregar cada insignia en público, con ceremonia, y enseñar el tablero para que el avance se vea.</p>
<div class="cta-row"><a class="btn primary" href="#tablero">Ver el tablero en vivo</a><a class="btn" href="recursos.html">Ver las 24 insignias</a></div>
</header>

<section id="registro"><div class="wrap">
<div class="eyebrow teal">Tu papel: la ceremonia</div><h2>Cómo se entrega una insignia</h2>
<p class="lead">Una insignia que se otorga en silencio no motiva. La constancia queda sola (la registra el estudiante);
lo que no puede faltar es tu ceremonia:</p>
<div class="grid cols-3">
<div class="card"><h3>1 · En público</h3><p>Anuncia el medallón en clase o en el foro en cuanto el recluta supera el reto. El refuerzo funciona cuando se ve.</p></div>
<div class="card"><h3>2 · Con su frase</h3><p>Nombra el logro con la frase del personaje («una imagen no tiene que ser perfecta, tiene que llegar a tiempo»). Pulsa cualquier insignia en la sala de recursos: la frase está en su ficha.</p></div>
<div class="card"><h3>3 · Y recuérdales registrarla</h3><p>El estudiante marca su insignia nueva en la Bitácora de mando y el tablero se actualiza al momento. Invítales a mirarlo: una obra que no se documenta, no existe.</p></div>
</div>
</div></section>

<section id="alumnado"><div class="wrap">
<div class="eyebrow amber">Cómo funciona para tu alumnado</div><h2>Así registran los estudiantes</h2>
<div class="grid cols-3">
<div class="card"><h3>1 · Su Bitácora de mando</h3><p>Un formulario con inicio de sesión de Google y <b>una sola respuesta editable</b>. La primera vez eligen alias y avatar y ponen el enlace de su ePortfolio; después solo vuelven, marcan la casilla de la insignia nueva y envían.</p></div>
<div class="card"><h3>2 · Todo se calcula solo</h3><p>Los xp, las insignias, el planeta actual y el <b>avatar con rango</b> aparecen en el <a href="#tablero">tablero del PER</a> al momento. Las insignias de hito (Tripulación Cero, La Liberación) se otorgan solas. Ni tú ni nadie toca ninguna hoja.</p></div>
<div class="card"><h3>3 · Dónde lo ven</h3><p>En la <a href="recluta.html"><b>Nave del Recluta</b></a> (el hub del alumnado, con su ficha, la orden semanal y las recompensas) y en el tablero, que se incrusta en el Genially del PER (o se comparte por enlace/QR desde el <a href="embed.html">generador de embeds</a>). Enséñalos en clase al entregar insignias.</p></div>
</div>
</div></section>

<section id="profe-herramientas"><div class="wrap">
<div class="eyebrow">También desde tu puesto</div><h2>El ticket de salida y el canje, en versión docente</h2>
<div class="grid cols-2">
<div class="card"><h3>🎟️ Ticket de salida «Contacta con NEBULA»</h3><p>El alumnado valora la clase y deja dudas de forma <b>anónima</b> (presentación / tema / actividad / repaso, indicando quién imparte). Tú lo explotas en el <a href="tickets.html">panel visual de tickets</a>: valoraciones 1–5 por sección y dudas que puedes marcar como resueltas cuando las trates en clase.</p></div>
<div class="card"><h3>🎁 Canje de xp</h3><p>Los xp del juego se canjean por recompensas (subir nota, recalificar…) con <b>validación automática</b>: el sistema comprueba el saldo y responde por correo. A ti solo te llegan los <b>canjes pendientes de aplicar</b>, en el <a href="profes.html">panel del profesorado</a>.</p></div>
</div>
</div></section>

<section id="roles"><div class="wrap">
<div class="eyebrow teal">Dos papeles, un sistema</div><h2>¿Quién hace qué?</h2>
<div class="grid cols-2">
<div class="card"><h3>🛰️ Profesorado referente <span class="pill">gestiona el PER</span></h3>
<p>Trabaja en la <b>hoja maestra</b> (cuenta mutecdgami): <b>crea el PER</b> (menú STARGATE → Crear nuevo PER…, con la fecha de la semana 1 que marca el ritmo de todo el sistema), define el <b>PIN docente</b> y lo reparte, <b>monta y actualiza el Genially del PER</b> (el panel de control: estándar compartido o copia propia), comparte el <b>Doc de enlaces, embeds y QR</b> con su equipo y abre/cierra los formularios. La chuleta completa está abajo, en <a href="#instalacion">el sistema por dentro</a>.</p></div>
<div class="card"><h3>🎓 Profesorado que imparte <span class="pill">dinamiza el aula</span></h3>
<p>No toca ninguna hoja: sigue la <a href="cronologia.html">cronología</a>, publica el mensaje del foro, entrega las insignias <b>con ceremonia</b> y usa con el PIN el <a href="profes.html">panel del PER</a> y los <a href="tickets.html">tickets</a>. Si quiere un <b>panel de control Genially propio</b> en vez del estándar: lo acuerda con su referente, que duplica el Genially y pega sus enlaces en Panel de profes → Ajustes del PER.</p></div>
</div>
<p class="small muted" style="margin-top:10px">En la mayoría de los PER el referente <b>también imparte</b>: entonces te tocan las dos columnas. La <b>visita guiada</b> de la portada pregunta tu papel y te enseña solo lo tuyo.</p>
</div></section>

<section id="orden"><div class="wrap">
<div class="eyebrow amber">Calendario de entrega</div><h2>Qué insignia toca cada semana</h2>
<div class="tablewrap"><table><thead><tr><th>Sem</th><th>Tema</th><th>Se entregan</th></tr></thead><tbody>{orden_html}</tbody></table></div>
<p class="lead" style="margin-top:10px">Las de <b>personaje</b> (P) llegan con el Reto A; las de <b>reto</b> (R) con el Reto B; las <b>especiales</b> y de <b>hito</b> en sus momentos (reclutamiento, Act. 1, Act. 2, Cero completa, Liberación).</p>
</div></section>

<section id="tablero"><div class="wrap">
<div class="eyebrow">Tablero en vivo</div><h2>Ranking e insignias de cada PER</h2>
<p class="lead">Se alimenta solo de la Bitácora de mando de cada PER. Para incrustar el tablero, el foro o los formularios en tu Genially: <a href="embed.html"><b>generador de enlaces, embeds y QR</b></a>.</p>
<div id="tablero-app"></div>
<script>window.SG_TABLERO_API="{TABLERO_API}";window.SG_BADGE_NAMES={json.dumps(BADGE_NAME, ensure_ascii=False)};</script>
<script src="assets/js/tablero.js" defer></script>
</div></section>

<section id="instalacion"><div class="wrap">
<div class="eyebrow amber">Cómo funciona por dentro · para el profesorado referente</div><h2>El sistema de autoregistro</h2>
<div class="grid cols-3">
<div class="card"><h3>1 · El alumno registra</h3><p>Cada PER tiene su <b>Bitácora de mando</b>: un formulario con inicio de sesión de Google y <b>una sola respuesta editable</b>. La primera vez pone alias, nombre y el enlace a su ePortfolio; después solo vuelve, marca la casilla de la insignia nueva y envía. Además: el <b>ticket de salida «Contacta con NEBULA»</b> (anónimo, ramificado: presentación / tema / actividad / repaso, con el profe que imparte) y un formulario de <b>canje de xp</b> con validación automática.</p></div>
<div class="card"><h3>2 · Nadie hace nada</h3><p>Todo vive en <b>una sola hoja maestra</b> (cuenta <b>mutecdgami</b>): una pestaña de respuestas por PER, más <b>DATOS</b> (todos los registros de todos los PER en formato largo, para análisis e investigación) y <b>RESUMEN</b> (puntos e insignias por recluta y PER), que se rehacen solas con cada respuesta. El script calcula alias, insignias, planeta actual y puntos. Las insignias de hito <b>Tripulación Cero</b> y <b>La Liberación</b> se otorgan solas. Si hay un registro falso, el profesorado escribe algo en la columna <b>Anulado</b> de la hoja y desaparece.</p></div>
<div class="card"><h3>3 · Un PER nuevo, un clic</h3><p>Menú <b>🛰️ STARGATE → Crear nuevo PER…</b>: pide nombre del PER, profesorado y fechas de apertura y cierre; crea formulario y hoja, programa la apertura/cierre y devuelve el enlace, el QR y el código para Genially.</p></div>
</div>
<h3 style="margin-top:1.6em">La Bitácora de mando, por secciones (rápida de rellenar)</h3>
<p class="lead">Es el formulario que el alumnado <b>rellena una vez y edita</b> cada vez que gana una insignia,
así que tiene que costar segundos. Está organizado así:</p>
<div class="flow" style="margin:0 0 1em"><span class="node">1 · Quién soy</span><span class="ar">→</span>
<span class="node">«¿Qué vienes a registrar hoy?»</span><span class="ar">→</span>
<span class="node">salta al tema elegido</span><span class="ar">→</span><span class="node">Enviar</span></div>
<p class="lead">La primera página es siempre la identidad (alias, personaje, enlace a la Bitácora y biografía)
y termina con un desplegable que <b>salta directo</b> a la sección del tema que se viene a registrar; al marcar
las casillas de esa sección, <b>se envía y ya está</b>. Antes había que pasar por las diez páginas.</p>
<div class="official" style="display:block">🔒 <b>Por qué es seguro saltarse secciones:</b> las insignias no viven en el formulario,
viven en la hoja <b>EVENTOS</b>, y el sistema <b>solo añade</b> lo que aún no estaba registrado — nunca borra.
Aunque un recluta no pase por la página del Tema 3, su insignia del Tema 3 sigue ahí. Lo único que se lee de la
respuesta son sus datos de identidad, y esa página se ve siempre.</div>

<h3 style="margin-top:1.6em">Avatares</h3>
<div><p class="lead">Cada recluta elige su avatar en la Bitácora de mando: un <b>personaje que evoluciona con su NIVEL</b> (10 niveles y <b>5 versiones de arte</b>: Recluta → Cadete → Oficial → Comandante → <b>Leyenda</b>; cambia al entrar en los niveles <b>3, 5, 8 y 10</b>, escalado solo en PUA — ver <a href="#economia">la tabla de niveles</a>). Al alistarse se eligen los personajes <b>1-4</b>; los <b>5-7 son EXCLUSIVOS</b> y se desbloquean con <b>créditos ◈</b> — otro motor de motivación. <b>Poner su propia imagen ya no es gratis</b>: es la recompensa «Avatar personal» (90 ◈, desde la semana 10), y se pide en el formulario de canje — no al alistarse. La antigua galería clásica de 16 avatares fijos <b>se ha retirado</b>: todos los reclutas llevan un personaje que evoluciona.</p><img src="assets/img/avatares/lamina_personajes.jpg" alt="Personajes que evolucionan" style="border-radius:14px;border:1px solid var(--line);margin-bottom:12px">
<div class="official" style="display:block">🖼️ <b>Cómo poner su propia imagen (cuando el alumno canjea «Avatar personal», 90 ◈):</b> 1) entra en <a href="https://postimages.org" target="_blank" rel="noopener">postimages.org</a>, pulsa <i>Elegir imágenes</i> y sube la foto (no hace falta registrarse); 2) copia el campo <b>«Enlace directo»</b> (termina en .jpg o .png); 3) pégalo en el <b>formulario de canje</b>, en la pregunta de la URL. También vale un enlace de <b>Google Drive</b> compartido como «cualquier persona con el enlace». Un enlace a Instagram o a una página web no funciona.</div></div>
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
en PUA se escala sola. Las automáticas las aplica el sistema al recibir el formulario; las de nota las aplica
el profesorado al terminar las clases en directo.</p>
<div class="tablewrap"><table><thead><tr><th>Recompensa</th><th>Coste</th><th>Desde</th><th>Cómo se aplica</th></tr></thead><tbody>
{recompensas_html}
</tbody></table></div>
<p class="small muted" style="margin-top:8px">Además, sin canje: la <b>corona semanal</b> 👑 aparece sola en el tablero junto al recluta que más xp ganó en los últimos 7 días.</p>
<p class="small muted">Las de avatar se conceden y se aplican solas (el avatar cambia en el tablero al instante). Las de nota se conceden solas pero <b>se hacen efectivas al terminar las clases en directo</b>: el correo de confirmación ya lo avisa. Todo es editable en la pestaña <b>RECOMPENSAS</b> de la hoja (coste, máximo, semana de desbloqueo); en PUA las semanas se escalan solas. En la <a href="recluta.html">Nave del Recluta</a> las que aún no tocan aparecen como «recompensa clasificada».</p>
<details class="faq"><summary>Instalación en la cuenta mutecdgami (una vez, 20 minutos)</summary><div>
<ol>
<li>Con sesión en <b>mutecdgami@gmail.com</b>, crea en la carpeta del proyecto una hoja de cálculo <b>STARGATE · Mando de PERs</b>.</li>
<li><b>Extensiones → Apps Script</b>: sustituye <code>Código.gs</code> por <a href="assets/descargas/Code.gs.txt" target="_blank">Code.gs</a> (debe verse «Bitácora» con tilde) y crea un archivo HTML llamado <b>Dialog</b> con <a href="assets/descargas/Dialog.html.txt" target="_blank">Dialog.html</a>. Guarda y recarga la hoja: aparece el menú <b>STARGATE</b>; autoriza la primera vez.</li>
<li><b>Plantillas con la estética</b> (en la misma carpeta, con el nombre exacto): crea tres formularios vacíos llamados <b>PLANTILLA · Bitácora de mando</b>, <b>PLANTILLA · Ticket de salida</b> y <b>PLANTILLA · Canje de recompensas</b>; en cada uno, <i>Personalizar tema</i> → imagen de cabecera (<a href="assets/img/forms/cabecera_bitacora.jpg" download>Bitácora</a> · <a href="assets/img/forms/cabecera_ticket.jpg" download>Ticket</a> · <a href="assets/img/forms/cabecera_canje.jpg" download>Canje</a>), color <code>#0e5f6c</code>, fondo oscuro, fuente a tu gusto. Sin preguntas: el asistente las pone.</li>
<li><b>Menú STARGATE → «Abrir la Consola del profesorado»</b>: crea (una sola vez) un <b>segundo archivo de Google Sheets</b> con una <b>portada de todos tus grupos</b> y una pestaña por PER —reclutas con su nivel, xp y créditos, canjes con lo que te queda por aplicar, y los últimos registros—. La hoja maestra se queda como materia prima (3 pestañas de respuestas por PER: con varios grupos es ilegible, y no pasa nada porque no hay que leerla). La Consola es una <b>foto</b>: se rehace desde ese menú y sola cada madrugada.</li>
<li><b>Reparte la sala del docente</b>: pásale a cada profe que imparte el enlace de <a href="clase.html">clase.html</a>. Entra con el PIN, elige su nombre una vez y ya tiene <b>todo en una página</b>: sus grupos (los de ahora y los pasados), lo que <b>requiere su intervención</b>, la orden de la semana, las dudas del ticket filtrables por tema y fecha, y su gente — <b>con los errores corregibles desde ahí</b> (alias, nombre, docente, enlace del ePortfolio y las insignias). No necesita entrar nunca en la hoja de cálculo ni en Drive: eso es cosa del profe referente.</li>
<li>Menú STARGATE → <b>Cambiar PIN del profesorado</b>: el PIN que usarán los profes en el panel.</li>
<li><b>Implementar → Nueva implementación → Aplicación web</b> · Ejecutar como <b>Yo</b> · Acceso <b>Cualquier usuario</b> → copia la URL <code>/exec</code>, pégala en menú STARGATE → <b>Guardar URL del web app</b> y pásasela a quien mantenga la web (va en <code>_site_data.py → TABLERO_API</code>).</li>
<li>Revisa la pestaña <b>RECOMPENSAS</b> (nombre · coste · máximo · descripción). Para cambiarlas en el futuro: editar la pestaña y menú → <b>Actualizar recompensas</b>.</li>
<li><b>Roles:</b> el asistente pide el <b>profesor/a referente</b> (crea los documentos y gestiona el PER: hoja maestra, PIN, altas) y el <b>profesorado que imparte</b> (desarrolla las clases y usa el panel); ambos aparecen en el desplegable del ticket.</li>
<li>Los formularios se <b>publican solos</b> (Google Forms los crea sin publicar). Si alguno diera «este documento no se ha publicado», menú STARGATE → <b>Publicar y abrir formularios del PER seleccionado</b>.</li>
<li><b>Crear nuevo PER…</b> y listo: 3 formularios, pestañas <code>B · id</code> / <code>T · id</code> / <code>C · id</code>, embeds para el Genially. Las pestañas <b>EVENTOS</b>, <b>DATOS</b> y <b>RESUMEN</b> se mantienen solas.</li>
</ol>
<p>Si cambia el código: <b>Implementar → Gestionar implementaciones → ✎ → Nueva versión</b> (la URL no cambia).</p>
</div></details>
<details class="faq"><summary>Mantenimiento: archivar un PER terminado, borrar los de prueba, empezar de cero</summary><div>
<p>Todo desde el menú <b>🛰️ STARGATE</b> de la hoja maestra. <b>Nunca dupliques la hoja</b> para empezar de nuevo: se romperían los vínculos con los formularios y cambiaría la URL del web app.</p>
<ul>
<li><b>Archivar un PER terminado</b> (menú → Ciclo de vida del PER, o desde el <a href="profes.html">panel de profes → Ajustes</a>): cierra sus formularios, <b>oculta sus pestañas</b> en la hoja y lo saca de los listados del alumnado. <b>No borra nada</b>: sus datos siguen en DATOS/RESUMEN y su tablero es accesible por enlace directo. Es lo que quieres al cerrar una convocatoria: con ocho PERs, solo ves los vivos.</li>
<li><b>Borrar un PER de prueba</b> (menú → Ciclo de vida del PER): selecciona su fila en la pestaña <b>PERs</b> y confirma escribiendo su id. Manda sus 3 formularios y su documento de enlaces a la papelera de Drive, borra sus pestañas de respuestas y sus registros de EVENTOS y AJUSTES.</li>
<li><b>Restaurar el catálogo de recompensas</b> (menú → Mantenimiento): reescribe la pestaña RECOMPENSAS con los precios y semanas oficiales. Úsalo si vienes de una versión anterior y siguen apareciendo las recompensas viejas; después, <b>Actualizar formularios</b>.</li>
<li><b>Limpiar restos de PER borrados</b> (menú → Mantenimiento): enseña la lista de formularios <i>y</i> pestañas de respuestas que ya no pertenecen a ningún PER y, si confirmas, manda los formularios a la papelera y borra las pestañas. Úsalo si borraste algún PER a mano o con una versión anterior del script: esos restos son los que provocan el error «<i>Ya existe una hoja con el nombre B · …</i>» al crear un PER con el mismo nombre.</li>
<li><b>Resetear la hoja</b> (menú → Mantenimiento): borra todos los PER (y cualquier formulario suelto de la carpeta) y limpia EVENTOS, AJUSTES, DATOS y RESUMEN, dejando la hoja como recién instalada. Conserva el PIN, la URL del web app, el panel estándar y las plantillas de formulario. Pide escribir <code>RESETEAR</code>.</li>
</ul>
</div></details>
</div></section>
''' + FOOT

# ================= DATOS DE LOS MODALES (insignias) =================
# tipo · como (cómo se consigue) · cuando · tarea (qué hay que hacer)
BADGE_INFO = {
 # Personajes de la Tripulación Cero (Reto A)
 "P1_bran":{"nombre":"Bran Okafor · El Forjador","tipo":"Insignia de personaje","como":"Completando el Reto A del Tema 1: «El boceto sin quemar».","cuando":"Tema 1 · Planeta Fôrge","tarea":"Publica en el foro un borrador en bruto de algo que estés creando y una frase sobre qué te daba reparo enseñarlo sin pulir. No se corrige: el único criterio es compartirlo antes de terminarlo. Al hacerlo se recupera el fragmento de Bran."},
 "P2_tomas":{"nombre":"Tomás Reyer · El Cronista","tipo":"Insignia de personaje","como":"Completando el Reto A del Tema 2: «Un mensaje para quien faltó».","cuando":"Tema 2 · Planeta Ecos","tarea":"Graba un clip corto (máx. 60 s) explicando un concepto como si se lo contaras a un alumno que hoy no vino a clase. Debe entenderse solo, sin ti delante."},
 "P3_sylla":{"nombre":"Sylla Bren · La Rastreadora","tipo":"Insignia de personaje","como":"Completando el Reto A del Tema 3: «Dos senderos».","cuando":"Tema 3 · Planeta Sendara","tarea":"Toma un objetivo de aprendizaje y describe dos rutas completamente distintas para alcanzarlo, pensadas para dos alumnos diferentes. Que las dos lleguen a la misma cima."},
 "P4_amara":{"nombre":"Amara Sol · La Operadora","tipo":"Insignia de personaje","como":"Completando el Reto A del Tema 4: «Abre el canal».","cuando":"Tema 4 · Planeta Reliae","tarea":"Comparte con tu clase o el foro un recurso útil en menos de 24 h, aunque no esté pulido. Añade qué habrías «guardado en el cajón para pulir» y por qué esta vez no lo hiciste."},
 "P5_vera":{"nombre":"Vera Khal · La Médica","tipo":"Insignia de personaje","como":"Completando el Reto A del Tema 5: «Mide con método».","cuando":"Tema 5 · Planeta Umbral","tarea":"Define un indicador observable que vayas a seguir de verdad del aprendizaje de tus alumnos, acompañado de la pregunta que lo convierte en cuidado: «¿qué haré mañana mejor que hoy?»."},
 "P6_joran":{"nombre":"Joran Pike · El Ingeniero-jugador","tipo":"Insignia de personaje","como":"Completando el Reto A del Tema 6: «Ensaya jugando».","cuando":"Tema 6 · Planeta Ludo","tarea":"Coge algo que tus alumnos temen o les cuesta y conviértelo en un pequeño ensayo jugable (una mecánica: puntos, rutas, un enigma en cada paso). Que el juego sirva a un objetivo, no juego por juego."},
 "P7_mara":{"nombre":"Mara Voss · El Mando","tipo":"Insignia de personaje","como":"Completando el Reto A del Tema 7: «Un porqué».","cuando":"Tema 7 · Planeta Vínculo","tarea":"Toma una tarea rutinaria y escribe el «porqué» / la narrativa que la convierte en una causa. Diseña una insignia con sentido: memoria de un acto significativo, no premio por obedecer."},
 "P8_noa":{"nombre":"Noa Lieth · La Arquitecta de capas","tipo":"Insignia de personaje","como":"Completando el Reto A del Tema 8: «La capa posible».","cuando":"Tema 8 · Planeta Liminar","tarea":"Describe una «capa» sobre tu aula real: cómo sería si aprendiera a hablar de sí misma. Y elige un compromiso concreto que te llevas de todo el viaje. Con esto la Tripulación Cero queda completa."},
 # Especiales
 "E1_nebula":{"nombre":"NEBULA · La Bitácora viva","tipo":"Insignia de personaje (especial)","como":"Se obtiene en el Reclutamiento, al aceptar la misión.","cuando":"Inicio del viaje","tarea":"NEBULA es la IA de la nave y tu narradora constante. Su insignia marca tu alistamiento en STARGATE; te acompañará desde el primer día hasta la puerta de vuelta a casa."},
 "E2_capitan":{"nombre":"El Capitán · El Mando de la misión","tipo":"Insignia de personaje (especial)","como":"Se obtiene al presentar la Actividad 1.","cuando":"Temas 1–2","tarea":"El Capitán es el mando de la misión (tu profesor o profesora). Su insignia reconoce que has asumido tu primera misión mayor: la actividad didáctica con imagen de IA."},
 "E3_vaeon":{"nombre":"General Vaeon · Señor de la Estática","tipo":"Insignia de villano","como":"Se desbloquea en la batalla final y con el «Fragmento Prohibido».","cuando":"Cierre del viaje","tarea":"Vaeon es el antagonista: personifica los errores del diseño educativo (contenido que no se entiende, recursos que no llegan, saber no compartido). Coleccionar su carta es el trofeo de haber entendido al enemigo."},
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
      +'</div></div>';
    afterOpen();}
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
  var fallback = 'assets/img/avatares/evo/p'+n+v+'_r'+r+'.jpg';
  var u = av.url ? String(av.url).trim() : '';
  if(u){ var m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([A-Za-z0-9_-]{10,})/); if(m) u = 'https://drive.google.com/thumbnail?id='+m[1]+'&sz=w400';
         if(!/^https?:\/\//i.test(u)) u=''; }
  return { src: u || fallback, fallback: fallback, rango: window.SG.RANGOS[r-1], r: r, evo: !u };
};
window.SG.avatarImg = function(av, alias, cls, xp, tipoPer){ var r = window.SG.avatarSrc(av, alias, xp, tipoPer);
  return '<img class="av '+(cls||'')+' r'+r.r+'" src="'+r.src+'" data-fb="'+r.fallback+'" alt="" title="'+r.rango+'" loading="lazy" referrerpolicy="no-referrer" onerror="if(this.src!==this.dataset.fb){this.src=this.dataset.fb;}">'; };

// ---------- lista de PERs (grupos): caché de 12 h + revalidación en segundo plano ----------
// La usa el desplegable «Grupos» del menú y grupos.html. doGet ?per=all NO pide PIN y solo
// devuelve id/nombre/tipo/estado/inicio de los PER no archivados.
window.SG.pers = function(cb){
  var API=(window.SG_TABLERO_API||'').trim(), K='sgPers_v1';
  if(!API){ cb([], 'sin-api'); return; }
  var cache=null; try{ cache=JSON.parse(localStorage.getItem(K)||'null'); }catch(e){}
  var fresco = cache && (Date.now()-cache.ts) < 12*3600*1000;
  if(cache) cb(cache.pers, fresco?'cache':'viejo');
  if(fresco) return;
  fetch(API+'?per=all',{redirect:'follow'}).then(function(r){return r.json();}).then(function(d){
    var pers=(d&&d.pers)||[];
    try{ localStorage.setItem(K, JSON.stringify({ts:Date.now(), pers:pers})); }catch(e){}
    cb(pers, 'red');
  }).catch(function(){ if(!cache) cb([], 'error'); });
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

TOUR_JS = r"""// STARGATE — visita guiada con el Capitán (onboarding del profesorado)
// Pregunta el rol al empezar: profe referente -> pasos extra (hoja maestra, PIN, panel de control).
(function(){
  var KEYR='sgTourRol';
  var BASE=[
   {p:'index.html',sel:'#hero-cta',pose:'saluda',t:'Bienvenido al mando',x:'Recluta… perdón: <b>Capitán</b>. Soy tu homólogo en la historia. Esta web es tu puesto de mando: todo lo que necesitas para pilotar STARGATE en tu aula está aquí. Sígueme.'},
   {p:'index.html',sel:'#hero-cta',pose:'pensativo',ask:true,t:'Una pregunta de mando',x:'¿Eres el <b>profesor o profesora referente</b> de tu PER (quien lo crea y lo gestiona), o <b>impartes las clases</b>? Si eres referente te enseñaré también la sala de máquinas.'},
   {p:'index.html',sel:'#en60',pose:'tablet',t:'La misión en 60 segundos',x:'La galaxia se apaga por la Estática. Tu alumnado son reclutas: <b>8 planetas = 8 temas</b>, y una <b>Bitácora</b> (el ePortfolio) que lo reenciende todo. La batalla final es el examen.'},
   {p:'guia.html',sel:'#pers',pose:'brazos',t:'Las voces y la Tripulación Cero',x:'<b>NEBULA</b> narra, <b>yo</b> doy las órdenes (o sea, tú) y <b>Vaeon</b> silencia. Ocho tripulantes esperan a que tu alumnado los recupere, uno por tema. Pulsa cualquier insignia: verás su reto y su frase.'},
   {p:'guia.html',sel:'#retos',pose:'tablet',t:'Dos retos por tema',x:'El <b>Reto A</b> da la <b>insignia</b> del personaje: no cuenta para nota, aunque da 100 xp y 10 ◈. El <b>Reto B</b> produce una evidencia real de la Bitácora (250 xp y 30 ◈). Recuerda la regla: los <b>xp</b> suben de nivel y nunca se gastan; los <b>créditos ◈</b> son lo que se canjea.'},
   {p:'cronologia.html',sel:'#mapa',pose:'senala',t:'Tu carta de navegación',x:'El mapa de las <b>15 semanas</b>: qué vídeo proyectar, qué reto lanzar, qué insignia entregar y el hito de evaluación. Sin fechas: semanas, como tu aula.'},
   {p:'cronologia.html',sel:'#sem1',pose:'pensativo',t:'La orden del día',x:'Despliega una semana y tendrás la orden completa, con los vídeos reproducibles aquí mismo y el <b>mensaje del foro listo para copiar</b> (la firma es siempre «Capitán», a secas). Empieza por la semana 1.'},
   {p:'actividades.html',sel:'#act1',pose:'pensativo',t:'Misiones y evaluación',x:'Las dos misiones mayores, el ePortfolio y el examen con los <b>requisitos oficiales</b>, más los documentos para descargar.'},
   {p:'geniallys.html',sel:'#lista',pose:'senala',t:'Los Geniallys',x:'La carpeta de Genially está <b>compartida con todo el profesorado</b>: busca la carpeta de tu perfil y usa los <b>Geniallys estándar</b> tal cual. ¿Quieres personalizar uno? Haz una copia; el sistema enlaza siempre a los estándar.'},
   {p:'registro.html',sel:'#registro',pose:'tablet',t:'El registro es automático',x:'Tu alumnado registra sus insignias solo, en la <b>Bitácora de mando</b> de su PER, y el <b>tablero en vivo</b> se actualiza al momento: xp, rangos y avatares. Tu papel es la <b>ceremonia</b>: entrega cada insignia en público y con su frase.'},
   {p:'registro.html',sel:'#profe-herramientas',pose:'brazos',t:'Tus sensores de a bordo',x:'El <b>ticket de salida</b> te devuelve valoraciones y dudas anónimas de cada clase, y el <b>canje de xp</b> se valida solo: a ti solo te llegan los canjes pendientes de aplicar. Cada uno con su panel visual.'},
   {p:'index.html',sel:'#secciones',pose:'senala',t:'Tus herramientas de mando',x:'Desde aquí llegas al <b>panel del profesorado</b> (con el PIN que te dará tu referente), a los <b>tickets</b>, a la <b>Nave del Recluta</b> y al <b>foro dinámico</b> para el Genially del PER, y al <b>generador de enlaces, embeds y QR</b>.'}
  ];
  var REF=[
   {p:'registro.html',sel:'#instalacion',pose:'tablet',t:'Referente: la hoja maestra',x:'Los PER se crean desde la <b>hoja maestra</b> (cuenta mutecdgami): menú <b>STARGATE → Crear nuevo PER…</b> — nombre, tipo REGULAR/PUA, fecha de la semana 1 y profesorado. En un minuto: los 3 formularios, el tablero, el foro dinámico, la <b>Nave del Recluta</b> y un <b>Doc con todos los enlaces, embeds y QR</b> para repartir.'},
   {p:'registro.html',sel:'#instalacion',pose:'senala',t:'Referente: el PIN y las fechas',x:'Define el <b>PIN compartido</b> (menú STARGATE → Cambiar PIN) y repárteselo a tu profesorado: abre el panel del PER y los tickets. La <b>fecha de la semana 1</b> que pones al crear el PER marca el ritmo de todo: foro dinámico, desbloqueos de la Nave y recompensas.'},
   {p:'geniallys.html',sel:'#lista',pose:'brazos',t:'Referente: el panel de control Genially',x:'El <b>panel de control</b> es el Genially con los planetas que enlaza a las presentaciones. Todos los PER heredan el <b>estándar</b> (menú STARGATE → Guardar panel de control estándar). ¿Un profe quiere el suyo? Que duplique el Genially y pegue sus enlaces en <b>Panel de profes → Ajustes del PER</b>.'}
  ];
  var FINAL={p:'index.html',sel:'#hero-cta',pose:'pulgar',t:'Listo para el salto',x:'Eso es todo, Capitán. La nave es tuya. Y recuerda: <b>una obra que no se documenta, no existe</b>. Corto y cierro.'};
  function steps(){ return (localStorage.getItem(KEYR)==='ref' ? BASE.concat(REF) : BASE).concat([FINAL]); }
  var KEY='sgTourStep';
  function page(){var p=location.pathname.split('/').pop(); return p||'index.html';}
  function qs(){var m=location.search.match(/[?&]tour=(\d+)/); return m?parseInt(m[1],10):null;}
  var ov=null;
  function clearTarget(){Array.prototype.forEach.call(document.querySelectorAll('.tour-target'),function(e){e.classList.remove('tour-target');});}
  function render(i){
    var S=steps(); var s=S[i]; if(!s) return end();
    if(s.p!==page()){localStorage.setItem(KEY,String(i)); location.href=s.p+'?tour='+i; return;}
    localStorage.setItem(KEY,String(i));
    clearTarget();
    var tg=document.querySelector(s.sel);
    if(tg){tg.classList.add('tour-target'); if(tg.tagName==='DETAILS') tg.open=true; tg.scrollIntoView({behavior:'smooth',block:'center'});}
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
    else { ov.querySelector('.tour-prev').onclick=function(){render(i-1);};
           ov.querySelector('.tour-next').onclick=function(){ if(i===S.length-1) end(); else render(i+1);}; }
    ov.querySelector('.tour-exit').onclick=end;
    ov.classList.add('open');
  }
  function end(){localStorage.removeItem(KEY); localStorage.setItem('sgTourDone','1'); clearTarget();
    if(ov){ov.classList.remove('open'); ov.innerHTML='';}
    if(qs()!==null) history.replaceState(null,'',location.pathname);}
  document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.tour-start'); if(b){e.preventDefault(); render(0);}});
  var q=qs(); if(q!==null) render(q);
  // primera visita a la portada: invitación discreta
  if(page()==='index.html' && q===null && !localStorage.getItem('sgTourDone') && !localStorage.getItem(KEY)){
    var inv=document.createElement('div'); inv.className='tour-invite';
    inv.innerHTML='<img src="assets/img/capitan/saluda.png" alt=""><div><b>¿Primera vez en el puesto de mando?</b><br>Te lo enseño en dos minutos.</div><button type="button" class="tour-start">Empezar</button><button type="button" class="x" aria-label="Cerrar">✕</button>';
    document.body.appendChild(inv);
    inv.querySelector('.x').onclick=function(){inv.remove(); localStorage.setItem('sgTourDone','1');};
    inv.querySelector('.tour-start').addEventListener('click',function(){inv.remove();});
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
open(os.path.join(HERE,"assets","js","stargate.js"),"w",encoding="utf-8").write(js)
open(os.path.join(HERE,"assets","js","tour.js"),"w",encoding="utf-8").write(TOUR_JS)

PAGES=[("index.html",PORTADA),("guia.html",GUIA),("cronologia.html",CRONOLOGIA),("actividades.html",ACT),
       ("geniallys.html",GENPAGE),("registro.html",REGPAGE),("recursos.html",REC)]
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
RETOS_REGULAR=[("A1","Reto A «El boceto sin quemar» (Bran)"),("B1","Reto B «La chispa»"),("X1","Actividad 1 entregada"),("A2","Reto A «Un mensaje para quien faltó» (Tomás)"),("B2","Reto B «El eco que enseña»"),("A3","Reto A «Dos senderos» (Sylla)"),("B3","Reto B «La matriz»"),("X2","Actividad 2 entregada"),("A4","Reto A «Abre el canal» (Amara)"),("B4","Reto B «El entorno de aula»"),("A5","Reto A «Mide con método» (Vera)"),("B5","Reto B «La Bitácora medida»"),("A6","Reto A «Ensaya jugando» (Joran)"),("B6","Reto B «El juego»"),("A7","Reto A «Un porqué» (Mara)"),("B7","Reto B «La microgamificación»"),("A8","Reto A «La capa posible» (Noa)"),("B8","Reto B «El último umbral»"),("XF","Batalla final")]
RETOS_PUA=[("B1","La chispa (Bran)"),("X1","Actividad 1 entregada"),("B2","El eco que enseña (Tomás)"),("B3","La matriz (Sylla)"),("X2","Actividad 2 entregada"),("B4","El entorno de aula (Amara)"),("B5","La Bitácora medida (Vera)"),("B6","El juego (Joran)"),("B7","La microgamificación (Mara)"),("B8","El último umbral (Noa)")]
SEMANAS_JSON = json.dumps([{
  "sem": s["sem"], "tema": s["tema"], "sub": s["sub"], "capitulo": s.get("capitulo"),
  "tema_n": int(__import__("re").search(r"Tema (\d)", s["tema"]).group(1)) if "Tema " in s["tema"] else 0,
  "videos": [[{"id": yt(c)["id"], "titulo": yt(c)["titulo"]}, cuando] for c, cuando in s["videos"]],
  "lanza": s["lanza"], "insignias": s["insignias"], "foro": FORO.get(s["sem"], ""), "hito": s["hito"]} for s in CRONO], ensure_ascii=False)

PROFES = head("STARGATE · Panel del profesorado", "Panel del profesorado de STARGATE: alumnos, insignias, tickets de salida, canjes y ajustes de cada PER.", "reg") + f'''
<header class="hero"><div class="kicker">Solo profesorado · PIN</div><h1>Panel del profesorado</h1>
<p>Elige el PER y gestiona sin tocar la hoja: alumnos con nombre y correo, insignias (anular / otorgar), tickets de salida por tema, canjes pendientes de entregar, profesorado, fecha de inicio y apertura/cierre de formularios.</p></header>
<section id="panel"><div class="wrap">
<div id="profes-app"></div>
<script>window.SG_TABLERO_API="{TABLERO_API}";window.SG_BADGE_NAMES={json.dumps(BADGE_NAME, ensure_ascii=False)};window.SG_RETOS={json.dumps({"REGULAR": RETOS_REGULAR, "PUA": RETOS_PUA}, ensure_ascii=False)};</script>
<script src="assets/js/profes.js" defer></script>
<div class="official" style="margin-top:18px;display:block">🧩 <b>¿Quieres incrustar esto (o el tablero, el foro, los tickets) en Genially?</b> Usa el <a href="embed.html"><b>generador de enlaces, embeds y QR</b></a>: eliges PER y tu nombre y copias el código. El PIN se cambia desde la hoja maestra (menú STARGATE → Cambiar PIN).</div>
</div></section>
''' + FOOT

FORO_PAGE = head("STARGATE · Foro dinámico", "El mensaje del foro de la semana en curso, con sus retos, insignias y vídeos. Se actualiza solo a partir de la fecha de la semana 1.", "crono") + f'''
<header class="hero"><div class="kicker">Foro dinamizador</div><h1>La orden de la semana</h1>
<p>Dos formas de usar los mensajes del foro: <b>incrustar este artefacto</b> en el Genially del PER (muestra el mensaje
de la semana en curso y cambia solo cada semana), o <b>verlos todos de una vez</b> y copiarlos para publicarlos tú
en el foro de tu aula.</p>
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
<header class="hero"><div class="kicker">Solo profesorado · PIN</div><h1>Contacta con NEBULA</h1>
<p>Elige tu PER y tu clase: verás de un vistazo las valoraciones (1-5) de cada sección y las dudas del alumnado, y podrás marcarlas como resueltas cuando las trates en clase.</p>
<p class="small muted">Embed para el Genially del profesorado: <code>tickets.html?embed=1</code> (o <code>?per=&lt;id&gt;&amp;embed=1</code>). <a href="tickets.html?demo=1">Ver una demostración con datos ficticios</a>.</p></header>
<section id="panel"><div class="wrap">
<div id="tickets-app"></div>
<script>window.SG_TABLERO_API="{TABLERO_API}";</script>
<script src="assets/js/tickets.js" defer></script>
</div></section>
''' + FOOT
html=(TICKETS.replace('assets/css/stargate.css"','assets/css/stargate.css?v='+vc+'"').replace('assets/js/stargate.js"','assets/js/stargate.js?v='+vj+'"').replace('assets/js/tour.js"','assets/js/tour.js?v='+vt+'"'))
open(os.path.join(HERE,"tickets.html"),"w",encoding="utf-8").write(html); print("escrito: tickets.html")

# ================= v3.11 · LA SALA DEL DOCENTE =================
# Un solo sitio para quien imparte: sus grupos, lo que requiere SU intervención, las dudas del ticket
# filtradas, su gente (con corrección de errores) y los enlaces. Con PIN, y de escritura.
CLASE = head("STARGATE · Mi clase", "La sala del docente: tus grupos, lo que requiere tu intervención, las dudas del ticket de salida y tu gente — todo en una página, sin abrir hojas de cálculo.", "cla") + f'''
<header class="hero"><div class="kicker">Solo profesorado · PIN</div><h1>Mi clase</h1>
<p>Todo lo que necesitas antes de entrar al aula, en una página: <b>lo que requiere tu intervención</b>,
la orden de la semana, las <b>dudas del ticket de salida</b> filtrables por tema y fecha, y <b>tu gente</b>
—con sus errores corregibles desde aquí—. Las hojas de cálculo y el Drive son cosa del profe referente.</p>
<p class="small muted">Se abre por tu nombre: <code>clase.html?per=&lt;id&gt;&amp;profe=Nombre</code>, o eliges
una vez y se recuerda en este navegador. Para incrustar: <code>&amp;embed=1</code>.</p></header>
<section><div class="wrap"><div id="clase-app"></div>
<script>window.SG_TABLERO_API="{TABLERO_API}";window.SG_BADGE_NAMES={json.dumps(BADGE_NAME, ensure_ascii=False)};window.SG_RETOS={json.dumps({"REGULAR": RETOS_REGULAR, "PUA": RETOS_PUA}, ensure_ascii=False)};window.SG_SEMANAS={SEMANAS_JSON};</script>
<script src="assets/js/clase.js" defer></script>
</div></section>
''' + FOOT
html=(CLASE.replace('assets/css/stargate.css"','assets/css/stargate.css?v='+vc+'"').replace('assets/js/stargate.js"','assets/js/stargate.js?v='+vj+'"').replace('assets/js/tour.js"','assets/js/tour.js?v='+vt+'"'))
open(os.path.join(HERE,"clase.html"),"w",encoding="utf-8").write(html); print("escrito: clase.html")

# ================= v3.6 · GRUPOS (un panel de accesos por PER) =================
# La lista sale de doGet ?per=all (sin PIN); los formularios de cada grupo, de doGet ?per=<id>.
GRUPOS = head("STARGATE · Grupos", "Tus grupos (PER) de STARGATE: tablero, nave del alumnado, panel del profesorado, tickets, foro y enlaces de cada uno.", "grp") + f'''
<header class="hero"><div class="kicker">Un grupo, un panel</div><h1>Tus grupos</h1>
<p>Cada clase que se da de alta en la hoja maestra es un <b>PER</b>: su tablero, su nave, su foro y sus
formularios. Aquí los tienes todos, y desde el menú <b>Grupos</b> puedes saltar a cualquiera desde
cualquier página.</p>
<p class="small muted">Se listan los PER <b>no archivados</b>. Para crear uno: hoja maestra → menú
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
EMBED = head("STARGATE · Enlaces y embeds", "Genera los enlaces, códigos de incrustación y QR de un PER para los Geniallys del alumnado y del profesorado.", "gen") + f'''
<header class="hero"><div class="kicker">Para montar tu Genially</div><h1>Enlaces, embeds y QR</h1>
<p>Elige el PER y tu nombre: aquí están todos los enlaces, los códigos para incrustar y los QR, listos para copiar.</p></header>
<section id="panel"><div class="wrap"><div id="embed-app"></div>
<script>window.SG_TABLERO_API="{TABLERO_API}";</script><script src="assets/js/embed.js" defer></script>
</div></section>
''' + FOOT
html=(EMBED.replace('assets/css/stargate.css"','assets/css/stargate.css?v='+vc+'"').replace('assets/js/stargate.js"','assets/js/stargate.js?v='+vj+'"').replace('assets/js/tour.js"','assets/js/tour.js?v='+vt+'"'))
open(os.path.join(HERE,"embed.html"),"w",encoding="utf-8").write(html); print("escrito: embed.html")

# ================= v3 · LA NAVE DEL RECLUTA (web del alumnado por PER) =================
NAVE_BADGES = [k for k,*_ in PERS]+[k for k,*_ in ESP]+[k for k,*_ in RETO]+[k for k,*_ in HITO]
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
<nav class="nav"><div class="wrap"><a class="brand" href="recluta.html">◈ STARGATE <span class="modo recluta">Recluta<i> · alumnado</i></span></a></div></nav>
<header class="hero"><div class="kicker">Canal del alumnado</div><h1>La Nave del Recluta</h1>
<p>Tu puesto a bordo: la orden de cada semana, los planetas que se van desbloqueando con el viaje,
tu ficha de recluta y las recompensas. <b>NEBULA</b> te acompaña.</p></header>
<section><div class="wrap"><div id="nave-app"></div>
<script>window.SG_TABLERO_API="{TABLERO_API}";window.SG_SEMANAS={SEMANAS_JSON};window.SG_BADGE_NAMES={json.dumps(BADGE_NAME, ensure_ascii=False)};window.SG_BADGES={json.dumps(NAVE_BADGES)};window.SG_PLANETAS={json.dumps(PLANETAS, ensure_ascii=False)};window.SG_CROMOS={json.dumps([list(c) for c in CROMOS], ensure_ascii=False)};window.SG_CROMO_SERIES={json.dumps([list(x) for x in CROMO_SERIES], ensure_ascii=False)};window.SG_CARDV="?v={_cardv}";window.SG_IMGV="?v={hashlib.md5("".join(open(os.path.join(HERE,"assets","img","planetas",k+".png"),"rb").read().hex()[:64] for k,*_ in PLANETAS).encode()).hexdigest()[:10]}";</script>
<script src="assets/js/calendario.js" defer></script>
<script src="assets/js/recluta.js" defer></script>
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
.panel .tit .k{{font-size:.72rem;letter-spacing:.34em;color:var(--teal);text-transform:uppercase}}
.panel .tit h1{{font-family:'Unbounded',sans-serif;font-size:clamp(1.6rem,4.4vw,3rem);margin:.15em 0 0;color:#eaf6fb;text-shadow:0 0 34px rgba(55,224,236,.45)}}
.panel .tit p{{margin:.3em 0 0;color:var(--mut);font-size:clamp(.72rem,1.5vw,.95rem)}}
.mapa{{position:absolute;inset:0;z-index:2}}
.pl{{position:absolute;transform:translate(-50%,-50%);text-align:center;text-decoration:none;width:clamp(88px,11vw,150px);transition:transform .28s ease}}
.pl img{{width:100%;display:block;filter:drop-shadow(0 10px 26px rgba(0,0,0,.65));transition:filter .28s ease}}
.pl b{{display:block;margin-top:.35em;font-size:clamp(.72rem,1.35vw,.95rem);color:#fff;text-shadow:0 2px 12px #000}}
.pl em{{display:block;font-style:normal;font-size:clamp(.6rem,1.05vw,.75rem);color:var(--teal2);text-shadow:0 2px 10px #000;opacity:0;transition:opacity .28s ease}}
.pl:hover{{transform:translate(-50%,-50%) scale(1.14)}}
.pl:hover img{{filter:drop-shadow(0 0 26px rgba(55,224,236,.75)) drop-shadow(0 10px 26px rgba(0,0,0,.65))}}
.pl:hover em{{opacity:1}}
.pl .orbita{{position:absolute;inset:-14%;border:1px solid rgba(55,224,236,.28);border-radius:50%;opacity:0;transition:opacity .28s ease;animation:giro 14s linear infinite}}
.pl:hover .orbita{{opacity:1}}
@keyframes giro{{to{{transform:rotate(360deg)}}}}
.pl[data-pendiente] b::after{{content:'';display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--amber);margin-left:6px;vertical-align:middle;opacity:.85}}
.pl[data-pendiente] img{{opacity:.82}}
.pie{{position:absolute;bottom:1.2vh;left:0;right:0;text-align:center;z-index:3;color:var(--mut);font-size:.72rem}}
.pie a{{color:var(--teal2)}}
@media(max-width:720px){{.pl{{width:74px}} .pl em{{display:none}}}}
.pl .candado{{display:none;font-size:clamp(.55rem,1vw,.7rem);color:var(--mut);text-shadow:0 2px 10px #000}}
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
# El bloque «var CROMOS» del Code.gs se GENERA desde _site_data.CROMOS (un dato, un sitio),
# y assets/descargas/Code.gs.txt es siempre una copia exacta del .gs.
_SERIE_TIT = {k: t for k, t, _ in CROMO_SERIES}
def _js_cromos():
    filas = []
    for clave, nombre, serie, rareza, peso in CROMOS:
        filas.append('  ["%s","%s",%d,"%s","%s"],' % (clave, nombre, peso, rareza, _SERIE_TIT[serie]))
    filas[-1] = filas[-1][:-1]
    return "\n".join(filas)

def _js_niveles():
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
    return "\n".join(L)

def _js_recompensas():
    filas = []
    for nombre, coste, mx, desc, desde, tipo in RECOMPENSAS:
        filas.append('  [%s,%d,%d,%s,%d,%s],' % (json.dumps(nombre, ensure_ascii=False), coste, mx,
                                                 json.dumps(desc, ensure_ascii=False), desde,
                                                 json.dumps(tipo, ensure_ascii=False)))
    filas[-1] = filas[-1][:-1]
    return "\n".join(filas)

def _sustituir(txt, ini, fin, cuerpo):
    a = txt.index(ini) + len(ini); b = txt.index(fin)
    return txt[:a] + cuerpo + txt[b:]

_gs_path = os.path.join(HERE, "apps-script", "Code.gs")
_gs = open(_gs_path, encoding="utf-8").read()
_gs = _sustituir(_gs, "var CROMOS = [\n", "\n];\n// CROMOS-FIN", _js_cromos())
_gs = _sustituir(_gs, "// NIVELES-INICIO", "\n// NIVELES-FIN",
                 _gs[_gs.index("// NIVELES-INICIO")+len("// NIVELES-INICIO"):_gs.index("var MONEDA")].rstrip("\n")
                 + "\n" + _js_niveles())
_gs = _sustituir(_gs, "var RECOMPENSAS_INICIALES = [\n", "\n];\n// RECOMPENSAS-FIN", _js_recompensas())
open(_gs_path, "w", encoding="utf-8").write(_gs)
open(os.path.join(HERE, "assets", "descargas", "Code.gs.txt"), "w", encoding="utf-8").write(_gs)
open(os.path.join(HERE, "assets", "descargas", "Dialog.html.txt"), "w", encoding="utf-8").write(
    open(os.path.join(HERE, "apps-script", "Dialog.html"), encoding="utf-8").read())
# Copias 100% ASCII para pegar sin riesgo de que se rompan los acentos (ver _ascii_gs.py)
import subprocess as _sp
_sp.run(["python3", os.path.join(HERE, "_ascii_gs.py")], check=False, capture_output=True)
print("apps-script: CROMOS (%d cartas) + NIVELES (%d) + RECOMPENSAS (%d) regenerados y sincronizados"
      % (len(CROMOS), len(NIVELES), len(RECOMPENSAS)))
