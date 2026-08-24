# -*- coding: utf-8 -*-
"""Genera el sitio STARGATE v2 — «templo» del profesorado (23-ago-2026).
Páginas: index (portada) · guia · cronologia · actividades · geniallys · registro · recursos.
Ejecutar desde web-stargate/:  python3 _build_site.py
Datos de cronología/vídeos/geniallys en _site_data.py."""
import os, json, hashlib
from _site_data import (V, yt, CRONO, GENIALLYS, GENIALLY_CARPETA, foro_por_semana,
                        PLAYLIST, HERO_MP4, TABLERO_API, PLANTILLA_EPORTFOLIO)

HERE = os.path.dirname(os.path.abspath(__file__))
FAV = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%9B%B8%3C/text%3E%3C/svg%3E"

NAV = [("index.html","Inicio","inicio"),("guia.html","Guía","guia"),("cronologia.html","Cronología","crono"),
       ("actividades.html","Actividades","act"),("geniallys.html","Geniallys","gen"),
       ("registro.html","Registro","reg"),("recursos.html","Recursos","rec")]

def head(title, desc, active):
    links = "".join(f'<a class="lnk{" active" if k==active else ""}" href="{h}">{t}</a>' for h,t,k in NAV)
    return f'''<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{title}"><meta property="og:description" content="{desc}">
<meta name="theme-color" content="#080c14">
<link rel="icon" href="{FAV}">
<link rel="stylesheet" href="assets/css/stargate.css">
<script src="assets/js/stargate.js" defer></script>
<script src="assets/js/tour.js" defer></script>
</head><body>
<nav class="nav"><div class="wrap">
<a class="brand" href="index.html">◈ STARGATE</a>
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
CARDS=[k for k,*_ in PERS]+["E1_nebula","E2_capitan","E3_vaeon"]
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
 ("recursos.html","📦","Sala de recursos","Tablero de las 24 insignias, ranking y materiales."),
]
tiles_html="\n".join(f'<a class="tile" href="{h}"><span class="ic">{i}</span><b>{t}</b><em>{d}</em></a>' for h,i,t,d in tiles)

PORTADA = head("STARGATE · Puesto de mando del profesorado",
  "Todo lo que un docente necesita para pilotar STARGATE: narrativa, cronología semana a semana, retos, insignias, vídeos y Geniallys.","inicio") + f'''
<header class="hero hero-video">
<video autoplay muted loop playsinline poster="https://i.ytimg.com/vi/{V["opening"][0]}/maxresdefault.jpg"><source src="{HERO_MP4}" type="video/mp4"></video>
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
 ("¿El Reto A puntúa?", "<b>Para nota, no</b> — y es a propósito: es el motor de motivación, y convertirlo en nota le quitaría la función. Sí da <b>100 xp del juego</b> (algo simbólico) y su recompensa real es desbloquear al personaje (fragmento + insignia). El Reto B sí produce una evidencia evaluable de la Bitácora."),
 ("¿Cómo y cuándo entrego las insignias?", "En público y con ceremonia: publica el medallón en el foro/tablero al superar el reto y nombra el logro con la frase del personaje. Qué insignia va cada semana está en la cronología; cómo anotarlas, en <a href='registro.html'>Registro de insignias</a>."),
 ("¿Dónde están los enunciados y rúbricas oficiales?", "En <a href='actividades.html#docs'>Actividades → Documentos oficiales</a> (enunciados de la Act. 1 y 2, pautas del ePortfolio, instrucciones de uso de IA, rúbricas y planificación semanal)."),
 ("¿Qué pasa con el temario (PDF de los temas)?", "Los PDF de temas disponibles son de la programación anterior y con nombres cambiados; <b>no se publican aquí</b> hasta recibir el temario actualizado. Los vídeos de la serie ya siguen el orden nuevo (T6 ABJ → T7 Gamificación)."),
 ("Mi grupo es PUA (condensado). ¿Cómo lo adapto?", "Agrupa los mensajes del foro por bloque (dos semanas en un mensaje) y lanza los dos retos del tema juntos. La cronología sirve igual: son 15 semanas de contenido que tú compactas."),
 ("¿Cuál es la diferencia entre Ludo (T6) y Vínculo (T7)?", "En <b>Ludo se juega</b>: el juego ES la actividad (ABJ). En <b>Vínculo no se juega</b>: se toman elementos del juego (puntos, insignias, niveles, narrativa) y se ponen sobre una tarea que no es un juego (gamificación). Es el error conceptual más común: apóyate en Joran y Mara."),
 ("¿Cómo funciona el examen dentro de la historia?", "La batalla final ES el examen. En la semana 15 el vídeo <b>Plan de Ataque</b> lo presenta (caso, plataforma en directo, tablero de retos, reglas). Los tests de cada tema son el entrenamiento; la última semana hay repaso y simulacro."),
 ("¿Puedo mencionar Genially o la asignatura en público?", "En comunicación pública (redes, web abierta) el proyecto se nombra siempre «Proyecto Gamificado del Máster en Tecnología Educativa de la UNIR», sin la asignatura y sin citar herramientas. Dentro del aula y en este puesto de mando, sin problema."),
 ("¿Cómo registran los alumnos sus retos e insignias?", "Solos, en la <b>Bitácora de mando</b> de su PER (un formulario con inicio de sesión de Google y una única respuesta que editan cuando ganan una insignia). Los xp, las insignias y el <b>avatar con rango</b> se calculan automáticamente y se ven en el <a href='registro.html'>tablero</a>. Tú no tocas ninguna hoja."),
 ("¿Qué son los xp y los rangos del avatar?", "Puntos del juego (no nota): Reto A 100 · Reto B 250 · Actividad 500 · Batalla 500 · hitos 300. El avatar del alumno <b>evoluciona</b> solo: Recluta → Cadete (1.000) → Oficial (2.500) → Comandante (4.000). Los xp se pueden canjear por recompensas (subir nota, recalificar…) con validación automática."),
 ("¿Cómo abro un PER nuevo?", "Lo hace el <b>profesor/a referente</b> desde la hoja maestra (cuenta mutecdgami): menú STARGATE → Crear nuevo PER… (nombre, REGULAR/PUA, fecha de la semana 1, profesorado). En un minuto tienes los 3 formularios, el tablero, el foro dinámico y un documento con enlaces, embeds y QR. Guía en <a href='registro.html#instalacion'>Registro → Instalación</a>."),
 ("¿Qué hago si un alumno no hace el Reto A?", "Nada punitivo: no cuenta para nota. Pero el tripulante sigue «sin recuperar» y esos 100 xp se quedan sin ganar: usa la narrativa (NEBULA sigue incompleta) como invitación, no como castigo. Lo habitual es que el grupo arrastre."),
]
faq_html="\n".join(f'<details class="faq"><summary>{q}</summary><div>{a}</div></details>' for q,a in FAQ)

GUIA = head("STARGATE · Guía para el profesorado",
  "La gamificación STARGATE: narrativa, personajes, retos e insignias, la Bitácora y cómo dinamizarla en clase.","guia") + f'''
<header class="hero"><div class="kicker">Guía para el profesorado</div>
<h1>La guía</h1>
<p>La capa narrativa que convierte la asignatura en una misión: cruzar ocho planetas y construir una
<b>Bitácora</b> —el ePortfolio— tan viva que reencienda lo que la Estática apaga.</p>
<p style="margin-top:18px"><span class="pill">8 planetas = 8 temas</span><span class="pill">24 insignias</span><span class="pill">11 personajes</span><span class="pill">2 actividades + ePortfolio</span></p>
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
<h3 style="margin-top:1.8em">Cartas de personaje (tipo juego de rol)</h3>
<p class="lead">Cada personaje tiene una <b>carta coleccionable</b> que se "desbloquea" con su insignia:
retrato, breve historia, clase, atributos y cita. Pulsa para ampliar.</p>
<div class="cards-row">{cards_html}</div>
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
<div class="card"><h3>Para montar Geniallys</h3><p>Fondos por planeta, clips de ambiente, personajes recortados, HUD, kit de interfaz, insignias y cartas: todo está en el paquete del equipo en Drive (carpeta <b>DRIVE_EQUIPO_STARGATE</b>, con el documento «Qué va en cada Genially» que lleva la miniatura de cada recurso).</p></div>
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
<div class="card"><h3>3 · Ojo con el panel de control</h3><p>Los enlaces y embeds del sistema (panel, foro dinámico, tablero) apuntan a los <b>Geniallys estándar</b>. Si usas una copia modificada, tendrás que enlazarla tú en tus propios materiales.</p></div>
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
<p>Trabaja en la <b>hoja maestra</b> (cuenta mutecdgami): <b>crea el PER</b> (menú STARGATE → Crear nuevo PER…, con la fecha de la semana 1 que marca el ritmo de todo el sistema), define el <b>PIN docente</b> y lo reparte, guarda el <b>panel de control estándar</b> de Genially, comparte el <b>Doc de enlaces, embeds y QR</b> con su equipo y abre/cierra los formularios. La chuleta completa está abajo, en <a href="#instalacion">el sistema por dentro</a>.</p></div>
<div class="card"><h3>🎓 Profesorado que imparte <span class="pill">dinamiza el aula</span></h3>
<p>No toca ninguna hoja: sigue la <a href="cronologia.html">cronología</a>, publica el mensaje del foro, entrega las insignias <b>con ceremonia</b> y usa con el PIN el <a href="profes.html">panel del PER</a> y los <a href="tickets.html">tickets</a>. Si quiere un <b>panel de control Genially propio</b> en vez del estándar: duplica el Genially y pega sus enlaces en Panel de profes → Ajustes del PER.</p></div>
</div>
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
<h3 style="margin-top:1.6em">Avatares</h3>
<div class="grid cols-2"><div><p class="lead">Cada recluta elige su avatar en la Bitácora de mando: un <b>personaje que evoluciona con sus xp</b> (5 personajes, cada uno en versión ella/él, × 4 rangos: Recluta → Cadete → Oficial → Comandante; el tablero cambia la imagen solo al superar 1.000 / 2.500 / 4.000 xp, escalado en PUA), una <b>galería clásica de 16 avatares</b> o <b>su propia imagen por URL</b>. Si la URL falla, se muestra el avatar elegido.</p><img src="assets/img/avatares/lamina_personajes.jpg" alt="Personajes que evolucionan" style="border-radius:14px;border:1px solid var(--line);margin-bottom:12px">
<div class="official" style="display:block">🖼️ <b>Cómo poner tu propia imagen (para el alumnado):</b> 1) entra en <a href="https://postimages.org" target="_blank" rel="noopener">postimages.org</a>, pulsa <i>Elegir imágenes</i> y sube tu foto (no hace falta registrarse); 2) cuando termine, copia el campo <b>«Enlace directo»</b> (termina en .jpg o .png); 3) pégalo en la pregunta «URL de tu propia imagen». También vale un enlace de <b>Google Drive</b> si el archivo está compartido como «cualquier persona con el enlace». Un enlace a Instagram o a una página web no funciona.</div></div>
<img src="assets/img/avatares/lamina_avatares.jpg" alt="Galería de avatares" style="border-radius:14px;border:1px solid var(--line)"></div>
<h3 style="margin-top:1.6em">Puntos</h3>
<p class="lead">Reclutamiento 100 xp · Reto A 100 · Reto B 250 · Actividad entregada 500 · Batalla final 500 · hitos derivados (Cero completa, Liberación) 300. Un viaje completo ≈ 4.500 xp. En PUA: 300 por tema (personaje) + 500 por actividad. Los xp son del juego: <b>no son nota</b>.</p>
<h4 style="margin-top:1em">Las recompensas y cuándo se desbloquean</h4>
<div class="tablewrap"><table><thead><tr><th>Recompensa</th><th>Coste</th><th>Desde</th><th>Cómo se aplica</th></tr></thead><tbody>
<tr><td>Cambio de avatar (elige otro de la galería)</td><td class="pts">300</td><td>Semana 5</td><td><b>Automática</b> · máx. 3 veces</td></tr>
<tr><td>Avatar personal (su propia imagen por URL)</td><td class="pts">800</td><td>Semana 10</td><td><b>Automática</b></td></tr>
<tr><td>Subir 0,5 en un entregable</td><td class="pts">900</td><td>Semana 14</td><td>La aplica el profesorado</td></tr>
<tr><td>Subir 1 punto en un entregable</td><td class="pts">1.400</td><td>Semana 14</td><td>La aplica el profesorado</td></tr>
<tr><td>Recalificar fuera de plazo</td><td class="pts">2.000</td><td>Semana 14</td><td>La aplica el profesorado</td></tr>
<tr><td>Recalificar un suspenso</td><td class="pts">2.800</td><td>Semana 14</td><td>La aplica el profesorado</td></tr>
</tbody></table></div>
<p class="small muted">Las de avatar se conceden y se aplican solas (el avatar cambia en el tablero al instante). Las de nota se conceden solas pero <b>se hacen efectivas al terminar las clases en directo</b>: el correo de confirmación ya lo avisa. Todo es editable en la pestaña <b>RECOMPENSAS</b> de la hoja (coste, máximo, semana de desbloqueo); en PUA las semanas se escalan solas. En la <a href="recluta.html">Nave del Recluta</a> las que aún no tocan aparecen como «recompensa clasificada».</p>
<details class="faq"><summary>Instalación en la cuenta mutecdgami (una vez, 20 minutos)</summary><div>
<ol>
<li>Con sesión en <b>mutecdgami@gmail.com</b>, crea en la carpeta del proyecto una hoja de cálculo <b>STARGATE · Mando de PERs</b>.</li>
<li><b>Extensiones → Apps Script</b>: sustituye <code>Código.gs</code> por <a href="assets/descargas/Code.gs.txt" target="_blank">Code.gs</a> (debe verse «Bitácora» con tilde) y crea un archivo HTML llamado <b>Dialog</b> con <a href="assets/descargas/Dialog.html.txt" target="_blank">Dialog.html</a>. Guarda y recarga la hoja: aparece el menú <b>STARGATE</b>; autoriza la primera vez.</li>
<li><b>Plantillas con la estética</b> (en la misma carpeta, con el nombre exacto): crea tres formularios vacíos llamados <b>PLANTILLA · Bitácora de mando</b>, <b>PLANTILLA · Ticket de salida</b> y <b>PLANTILLA · Canje de recompensas</b>; en cada uno, <i>Personalizar tema</i> → imagen de cabecera (<a href="assets/img/forms/cabecera_bitacora.jpg" download>Bitácora</a> · <a href="assets/img/forms/cabecera_ticket.jpg" download>Ticket</a> · <a href="assets/img/forms/cabecera_canje.jpg" download>Canje</a>), color <code>#0e5f6c</code>, fondo oscuro, fuente a tu gusto. Sin preguntas: el asistente las pone.</li>
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
<li><b>📦 Archivar un PER terminado</b> (menú → Ciclo de vida del PER, o desde el <a href="profes.html">panel de profes → Ajustes</a>): cierra sus formularios, <b>oculta sus pestañas</b> en la hoja y lo saca de los listados del alumnado. <b>No borra nada</b>: sus datos siguen en DATOS/RESUMEN y su tablero es accesible por enlace directo. Es lo que quieres al cerrar una convocatoria: con ocho PERs, solo ves los vivos.</li>
<li><b>🗑️ Borrar un PER de prueba</b> (menú → Ciclo de vida del PER): selecciona su fila en la pestaña <b>PERs</b> y confirma escribiendo su id. Manda sus 3 formularios y su documento de enlaces a la papelera de Drive, borra sus pestañas de respuestas y sus registros de EVENTOS y AJUSTES.</li>
<li><b>♻️ Restaurar el catálogo de recompensas</b> (menú → Mantenimiento): reescribe la pestaña RECOMPENSAS con los precios y semanas oficiales. Úsalo si vienes de una versión anterior y siguen apareciendo las recompensas viejas; después, <b>Actualizar formularios</b>.</li>
<li><b>💣 Resetear la hoja</b> (menú → Mantenimiento): borra todos los PER y limpia EVENTOS, AJUSTES, DATOS y RESUMEN, dejando la hoja como recién instalada. Conserva el PIN, la URL del web app, el panel estándar y las plantillas de formulario. Pide escribir <code>RESETEAR</code>.</li>
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

CARD_TITLES = {k: BADGE_INFO[k]["nombre"] for k in
               ["P1_bran","P2_tomas","P3_sylla","P4_amara","P5_vera","P6_joran","P7_mara","P8_noa","E1_nebula","E2_capitan","E3_vaeon"]}


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
      +'<img src="assets/img/tarjetas/'+key+'_carta.png" alt="Carta de '+esc(CARDT[key]||key)+'"></div>';
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

// ---- avatares: personaje que evoluciona por xp · clásico · URL propia (con respaldo) ----
window.SG = window.SG || {};
window.SG.RANGOS = ['Recluta','Cadete','Oficial','Comandante'];
window.SG.rango = function(xp, tipoPer){ var k = (tipoPer==='PUA') ? 3500/4500 : 1; var u=[1000*k,2500*k,4000*k]; var r=1; for(var i=0;i<3;i++) if(xp>=u[i]) r=i+2; return r; };
window.SG.avatarSrc = function(av, alias, xp, tipoPer){
  av = av || {}; var h=0; for(var i=0;i<(alias||'').length;i++) h=(h*31+alias.charCodeAt(i))>>>0;
  var tipo = av.tipo || 'evo'; var n = av.n || (tipo==='evo' ? (h%5)+1 : (h%16)+1); var v = av.v || ((h>>3)%2 ? 'm' : 'f');
  var r = window.SG.rango(xp||0, tipoPer);
  var fallback = tipo==='evo' ? 'assets/img/avatares/evo/p'+n+v+'_r'+r+'.jpg' : 'assets/img/avatares/a'+(n<10?'0':'')+n+'.jpg';
  var u = av.url ? String(av.url).trim() : '';
  if(u){ var m = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([A-Za-z0-9_-]{10,})/); if(m) u = 'https://drive.google.com/thumbnail?id='+m[1]+'&sz=w400';
         if(!/^https?:\/\//i.test(u)) u=''; }
  return { src: u || fallback, fallback: fallback, rango: window.SG.RANGOS[r-1], r: r, evo: tipo==='evo' && !u };
};
window.SG.avatarImg = function(av, alias, cls, xp, tipoPer){ var r = window.SG.avatarSrc(av, alias, xp, tipoPer);
  return '<img class="av '+(cls||'')+' r'+r.r+'" src="'+r.src+'" data-fb="'+r.fallback+'" alt="" title="'+r.rango+'" loading="lazy" referrerpolicy="no-referrer" onerror="if(this.src!==this.dataset.fb){this.src=this.dataset.fb;}">'; };
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
   {p:'guia.html',sel:'#retos',pose:'tablet',t:'Dos retos por tema',x:'El <b>Reto A</b> desbloquea al personaje: no cuenta para nota, aunque da 100 xp simbólicos del juego. El <b>Reto B</b> produce una evidencia real de la Bitácora. 24 insignias en total: entrégalas en público y con su frase.'},
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
js = JS_TEMPLATE.replace("__BADGE__", json.dumps(BADGE_INFO, ensure_ascii=False)).replace("__CARDS__", json.dumps(CARD_TITLES, ensure_ascii=False))
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
<nav class="nav"><div class="wrap"><a class="brand" href="recluta.html">◈ STARGATE · La Nave del Recluta</a></div></nav>
<header class="hero"><div class="kicker">Canal del alumnado</div><h1>La Nave del Recluta</h1>
<p>Tu puesto a bordo: la orden de cada semana, los planetas que se van desbloqueando con el viaje,
tu ficha de recluta y las recompensas. <b>NEBULA</b> te acompaña.</p></header>
<section><div class="wrap"><div id="nave-app"></div>
<script>window.SG_TABLERO_API="{TABLERO_API}";window.SG_SEMANAS={SEMANAS_JSON};window.SG_BADGE_NAMES={json.dumps(BADGE_NAME, ensure_ascii=False)};window.SG_BADGES={json.dumps(NAVE_BADGES)};window.SG_PLANETAS={json.dumps(PLANETAS, ensure_ascii=False)};</script>
<script src="assets/js/calendario.js" defer></script>
<script src="assets/js/recluta.js" defer></script>
</div></section>
<footer><div class="wrap">STARGATE · La Bitácora Estelar — Proyecto Gamificado del <b>Máster en Tecnología Educativa</b> de la UNIR.</div></footer></body></html>'''
html=(RECLUTA.replace('assets/css/stargate.css"','assets/css/stargate.css?v='+vc+'"').replace('assets/js/stargate.js"','assets/js/stargate.js?v='+vj+'"'))
open(os.path.join(HERE,"recluta.html"),"w",encoding="utf-8").write(html); print("escrito: recluta.html")

# ================= cache-busting de TODOS los js (tablero/profes/tickets/foro/embed) =================
import glob as _glob, re as _re
_vers = {os.path.basename(f): _ver("assets/js/"+os.path.basename(f)) for f in _glob.glob(os.path.join(HERE,"assets","js","*.js"))}
for _html in _glob.glob(os.path.join(HERE,"*.html")):
    _s = open(_html, encoding="utf-8").read()
    for _name, _v in _vers.items():
        _s = _re.sub(r'assets/js/'+_re.escape(_name)+r'(\?v=[0-9a-f]+)?"', 'assets/js/'+_name+'?v='+_v+'"', _s)
    open(_html, "w", encoding="utf-8").write(_s)
print("cache-bust js:", ", ".join(k+"="+v[:6] for k,v in sorted(_vers.items())))
