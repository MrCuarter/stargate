# -*- coding: utf-8 -*-
"""Genera el sitio STARGATE (multipágina, assets externos). Ejecutar desde web-stargate/."""
import os, json
HERE = os.path.dirname(os.path.abspath(__file__))
FAV = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%9B%B8%3C/text%3E%3C/svg%3E"

def head(title, desc, active):
    def cl(p): return ' active' if p==active else ''
    return f'''<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{title}"><meta property="og:description" content="{desc}">
<meta name="theme-color" content="#080c14">
<link rel="icon" href="{FAV}">
<link rel="stylesheet" href="assets/css/stargate.css">
<script src="assets/js/stargate.js" defer></script>
</head><body>
<nav class="nav"><div class="wrap">
<a class="brand" href="index.html">◈ STARGATE</a>
<a class="lnk{cl('guia')}" href="index.html">Guía</a>
<a class="lnk{cl('guia')}" href="index.html#pers">Personajes</a>
<a class="lnk{cl('act')}" href="actividades.html">Actividades y evaluación</a>
<a class="lnk{cl('rec')}" href="recursos.html">Sala de recursos</a>
</div></nav>'''

FOOT = '''<footer><div class="wrap">
STARGATE · Gamificación de <b>Creación de Contenidos, M-learning y Gamificación en el Aula</b> (CCD).<br>
Guía y recursos para el profesorado — documento vivo. Basado en los materiales oficiales de la asignatura.
</div></footer></body></html>'''

# ---------- galerías (leen los PNG de assets/img) ----------
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

def badge(key,title,tag,sub,sm=False):
    c=" sm" if sm else ""
    return (f'<figure class="badge{c}" data-key="{key}" title="Ver detalle"><img loading="lazy" src="assets/img/insignias/{key}.png" alt="{title}">'
            f'<figcaption><b>{title}</b><span class="tag">{tag}</span><em>{sub}</em></figcaption></figure>')
def hito(key,title,sub):
    return (f'<figure class="badge sm" data-key="{key}" title="Ver detalle"><img loading="lazy" src="assets/img/insignias/{key}.png" alt="{title}">'
            f'<figcaption><b>{title}</b><em>{sub}</em></figcaption></figure>')
def cardt(key):
    return f'<div class="card-thumb" data-card="{key}" title="Ampliar tarjeta"><img loading="lazy" src="assets/img/tarjetas/{key}_carta.png" alt="Carta de {key}"></div>'

pers_html="\n".join(badge(*p) for p in PERS)
esp_html="\n".join(badge(*e) for e in ESP)
reto_html="\n".join(badge(*r) for r in RETO)
hito_html="\n".join(hito(*h) for h in HITO)
cards_html="\n".join(cardt(k) for k in CARDS)

# ================= PÁGINA 1 · GUÍA (index) =================
INDEX = head("STARGATE · Guía para el profesorado",
  "La gamificación STARGATE de la asignatura CCD: narrativa, personajes, retos e insignias y cómo dinamizarla.","guia") + f'''
<header class="hero"><div class="kicker">Guía para el profesorado · CCD</div>
<h1>STARGATE</h1>
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
</div></div></section>

<section id="pers"><div class="wrap">
<div class="eyebrow">La narrativa</div><h2>Las voces del viaje</h2>
<p class="lead"><b>NEBULA</b> es la IA de la nave y la narradora: cálida, clara. Su secreto —que se revela poco a
poco— es que es la <b>Bitácora de la Tripulación Cero</b>, el primer equipo que no regresó. Cada planeta
documentado <b>recupera un fragmento</b> de quién fue. El <b>Capitán</b> eres <b>tú, docente</b>: el mando que
da las órdenes, reconoce los logros y sostiene la moral.</p>
<h3 style="margin-top:1.2em">La Tripulación Cero — 8 personajes que se recuperan</h3>
<p class="lead">Cada tripulante encarna la <b>lección</b> de su tema. Al superar el <b>Reto A</b> del planeta se
desbloquea su fragmento-vídeo y su <b>insignia de personaje</b>.</p>
<div class="badges">{pers_html}</div>
<h3 style="margin-top:1.8em">Personajes especiales</h3>
<div class="badges">{esp_html}</div>
<div class="card villain" style="margin-top:22px"><div class="eyebrow">El antagonista</div>
<h3>La Estática y el General Vaeon</h3>
<p>La Estática no destruye: <b>silencia</b>. El General <b>Vaeon</b> es la personificación de los <b>errores de
diseño educativo</b> —contenido que no se entiende, recursos que no llegan, aprendizaje sin evaluación, saber
acaparado—. Su debilidad, y la lección del curso: <b>una Bitácora abierta, documentada y compartida no se puede
silenciar</b>. Es un villano con motivo: fue archivista y perdió su mundo; hoy cree que olvidar es misericordia.</p></div>
<h3 style="margin-top:1.8em">Cartas de personaje (tipo juego de rol)</h3>
<p class="lead">Cada personaje tiene una <b>carta coleccionable</b> que se "desbloquea" con su insignia:
retrato, breve historia, clase, atributos y cita.</p>
<div class="cards-row">{cards_html}</div>
</div></section>

<section id="bit"><div class="wrap">
<div class="eyebrow">El corazón del sistema</div><h2>La Bitácora = el ePortfolio</h2>
<p class="lead">Todo converge en la Bitácora. Se enseña formalmente en el <b>Tema 5</b> y se va llenando durante
todo el viaje. Cada página se escribe con el mismo pulso:</p>
<div class="flow" style="margin:0 0 1.4em">
<span class="node">Evidencia</span><span class="ar">→</span><span class="node">Contexto</span><span class="ar">→</span>
<span class="node">Reflexión</span><span class="ar">→</span><span class="node">Autoevaluación</span></div>
<p class="lead">El detalle de las páginas, los requisitos oficiales de cada actividad y la evaluación están en
<a href="actividades.html"><b>Actividades y evaluación</b></a>.</p>
</div></section>

<section id="retos"><div class="wrap">
<div class="eyebrow">Retos e insignias</div><h2>Dos retos por tema</h2>
<div class="grid cols-2">
<div class="card"><h3>Reto A — «La Llave» 🗝️</h3><p>Micro-tarea reflexiva o de comunidad (10–20 min) que encarna la
lección del personaje. <b>No puntúa</b>: su recompensa es <b>desbloquear al personaje</b> (fragmento + insignia).
Es el motor de <b>motivación e identidad</b>.</p></div>
<div class="card"><h3>Reto B — «La Forja» 🔨</h3><p>Tarea de creación con criterios claros que produce una <b>evidencia
real</b> de la Bitácora y es un <b>trozo digerible</b> de la siguiente actividad grande. Su recompensa es la
<b>insignia de reto</b>. Es el motor de <b>producción</b>.</p></div>
</div>
<h3 style="margin-top:1.8em">Las 8 insignias de reto</h3>
<p class="lead">Solo imagen, sin texto. Su icono refleja la tarea.</p>
<div class="badges">{reto_html}</div>
<h3 style="margin-top:1.8em">Las 5 insignias de hito</h3>
<div class="badges sm5">{hito_html}</div>
</div></section>

<section id="cal"><div class="wrap">
<div class="eyebrow">El mapa</div><h2>Recorrido por temas</h2>
<p class="lead">Sin fechas (varían cada curso). El calendario oficial con fechas está en la sección
<b>Actividades</b> del aula virtual.</p>
<table><thead><tr><th>Tema · Planeta</th><th>Reto A (personaje)</th><th>Reto B (evidencia)</th><th>Hito</th></tr></thead><tbody>
<tr><td>T1 Fôrge · Contenido multimedia</td><td>Bran</td><td>La imagen con IA</td><td>Presenta Act 1</td></tr>
<tr><td>T2 Ecos · El vídeo</td><td>Tomás</td><td>Videotutorial + videoquiz</td><td>Test T2</td></tr>
<tr><td>T3 Sendara · Interactivos</td><td>Sylla</td><td>La matriz 8×6</td><td>Presenta Act 2</td></tr>
<tr><td>T4 Reliae · M-learning</td><td>Amara</td><td>Entorno de aula</td><td>Test T4</td></tr>
<tr><td>T5 Umbral · Evaluación</td><td>Vera</td><td>Rúbrica + ePortfolio</td><td>Resolución Act 1</td></tr>
<tr><td>T6 Ludo · ABJ</td><td>Joran</td><td>Juego digital</td><td>Test T6</td></tr>
<tr><td>T7 Vínculo · Gamificación</td><td>Mara</td><td>Microgamificación</td><td>Test T7</td></tr>
<tr><td>T8 Liminar · RA/RV</td><td>Noa</td><td>RA/RV + publicar Bitácora</td><td>Resolución Act 2</td></tr>
<tr><td>Repaso · La liberación</td><td>—</td><td>—</td><td>La Liberación</td></tr>
</tbody></table></div></section>

<section id="din"><div class="wrap">
<div class="eyebrow">Lo práctico</div><h2>Cómo dinamizarlo en clase</h2>
<div class="tips">
<div class="tip"><b>Empieza con el gancho, no con el temario.</b> Primera sesión: vídeo de bienvenida, preséntate como <b>Capitán</b>, reparte la insignia de <b>Reclutamiento</b> y deja una pregunta en el aire.</div>
<div class="tip"><b>Un mensaje de foro por semana</b> (ya redactados): introducen el tema con la narrativa y cierran con la "Bitácora de esta semana". Solo pon tu nombre y el enlace de la herramienta del momento.</div>
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
''' + FOOT

# ================= PÁGINA 2 · ACTIVIDADES Y EVALUACIÓN =================
ACT = head("STARGATE · Actividades y evaluación",
  "Las misiones (actividades), el ePortfolio, la evaluación y el examen de la asignatura CCD, con su marco narrativo STARGATE.","act") + f'''
<header class="hero"><div class="kicker">Documentos oficiales · CCD</div>
<h1>Misiones y evaluación</h1>
<p>Las dos actividades mayores, el ePortfolio (la Bitácora), cómo se evalúa la asignatura y el examen —con su
marco narrativo STARGATE—. Los requisitos provienen de los enunciados y la guía oficiales.</p>
</header>

<section><div class="wrap">
<a class="backlink" href="index.html">← Volver a la guía</a>
<div class="eyebrow">Cómo se evalúa</div><h2>La evaluación continua</h2>
<div class="official">📋 Oficial · <b>Las actividades suman 10 puntos</b> en total — la nota máxima de la evaluación continua. <span style="color:var(--amber)">Reparto por actividad en actualización.</span></div>
<div class="grid cols-3" style="margin-top:14px">
<div class="card"><h3>Actividades mayores</h3><p><b>Actividad 1</b> — imagen con IA<br><b>Actividad 2</b> — paisaje de aprendizaje<br><span class="pts">Reparto de puntos: por confirmar</span></p></div>
<div class="card"><h3>Tests de tema</h3><p>Un test por tema (T1–T8). <span class="pts">0,1 pts</span> cada uno. Preparan para el examen.</p></div>
<div class="card"><h3>Asistencia en directo</h3><p>Asistencia a <b>3 clases en directo</b> a lo largo del curso. <span class="pts">0,2 pts</span> cada una.</p></div>
</div>
<blockquote>En STARGATE cada elemento tiene su nombre: las actividades son <b>misiones mayores</b>, los tests son
<b>controles de sistemas</b>, las clases en directo son <b>sesiones de mando</b> y las experiencias del portfolio
son <b>páginas de la Bitácora</b>. La nota mide tu avance; la Bitácora es lo que te llevas a casa.</blockquote>
</div></section>

<section id="act1"><div class="wrap">
<div class="eyebrow amber">Misión mayor I · Planeta Fôrge</div><h2>Actividad 1 — Actividad didáctica a partir de una imagen con IA</h2>
<p class="lead"><i>«La primera chispa.»</i> Diseñas una actividad para tu aula a partir de una imagen creada con IA,
documentando el proceso con criterio docente. <span class="pill amber">puntuación por confirmar</span></p>
<div class="steps">
<div class="step"><b>Planifica</b> <span class="tag-req">obligatorio</span><br>Define el alumnado, el tema del aula y la tarea que harán con la imagen.</div>
<div class="step"><b>Crea la imagen con IA</b> <span class="tag-req">iteración</span><br>Prompt estructurado (contexto educativo + tipo de imagen + finalidad, modelo tipo CRAFT/RITA), <b>al menos una iteración</b>, y selección final con <b>tu criterio docente</b>. Cita la herramienta y respeta derechos de autor.</div>
<div class="step"><b>Tabla técnica</b><br>Documenta función de la IA, prompt inicial, iteración, criterio docente, evidencia del proceso (enlace o capturas) y citación.</div>
<div class="step"><b>Tabla reflexiva</b> <span class="tag-req">ePortfolio</span><br>Reflexión crítica: cómo integraste la IA, cómo transformó la actividad, qué pusiste tú y qué aprendiste.</div>
<div class="step"><b>Entregables</b><br><b>PDF (80%)</b>, máx. 4 páginas, con planificación, actividad, referencia a la IA, capturas de las tablas y el enlace al ePortfolio. <b>ePortfolio (20%)</b> con la imagen, la tarea, las tablas completas y la evidencia del proceso.</div>
</div>
<div class="official" style="margin-top:14px">🔗 Enunciado oficial: <b>«Creación de una actividad didáctica a partir de una imagen generada con IA»</b>.</div>
</div></section>

<section id="act2"><div class="wrap">
<div class="eyebrow amber">Misión mayor II · Planeta Sendara</div><h2>Actividad 2 — Planifica y crea un paisaje de aprendizaje</h2>
<p class="lead"><i>«Cuarenta y ocho senderos.»</i> Ante un aula con ritmos muy dispares, diseñas un paisaje de
aprendizaje que atiende a la diversidad: no hay una sola ruta.</p>
<div class="steps">
<div class="step"><b>Contextualiza</b><br>Describe una unidad didáctica real de tu nivel: edad, área, tema y elementos curriculares (objetivos, contenidos, criterios de evaluación).</div>
<div class="step"><b>Matriz de programación 8×6</b> <span class="tag-req">núcleo</span><br>Tabla de doble entrada: <b>8 inteligencias múltiples × 6 niveles de Bloom</b> = 48 casillas. Rellena <b>al menos 6 cruces</b> variados en complejidad y en talento, con una actividad en cada uno.</div>
<div class="step"><b>Cada actividad, completa</b><br>Objetivo, tarea del alumno, recursos (con cita/enlace), instrumentos de evaluación, tiempo estimado y tipo: obligatoria, optativa o voluntaria.</div>
<div class="step"><b>El paisaje interactivo</b><br>Convierte una <b>imagen interactiva</b> (no una presentación) en el paisaje, con las actividades integradas dentro del territorio.</div>
<div class="step"><b>Entregables</b><br><b>PDF</b> (máx. 10 páginas para 6 actividades, +1 por actividad extra) con planificación y matriz. <b>ePortfolio (20%)</b>: evidencias de matriz y paisaje (15%) + justificación del diseño y atención a la diversidad (5%).</div>
</div>
<div class="official" style="margin-top:14px">🔗 Enunciado oficial: <b>«Planifica y crea un paisaje de aprendizaje»</b>.</div>
</div></section>

<section id="eportfolio"><div class="wrap">
<div class="eyebrow teal">La Bitácora</div><h2>El ePortfolio, página a página</h2>
<p class="lead">El ePortfolio es tu Bitácora: recoge, con el patrón <b>evidencia → contexto → reflexión →
autoevaluación</b>, las dos actividades y tres retos. Estas son las <b>experiencias del portfolio</b> que propone
la programación oficial, tema a tema:</p>
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

<section><div class="wrap">
<div class="eyebrow">El salto final</div><h2>El examen</h2>
<p class="lead">La evaluación continua se complementa con un <b>examen final</b> en la semana de exámenes. En STARGATE
es <b>el salto de vuelta a la Tierra</b>: solo con la Bitácora completa se abre la puerta.</p>
<div class="grid cols-3">
<div class="card"><h3>Preparación</h3><p>Los <b>tests de cada tema</b> (T1–T8) fijan los conceptos y funcionan como entrenamiento continuo para el examen.</p></div>
<div class="card"><h3>Repaso + simulacro</h3><p>La última semana lectiva incluye una <b>sesión de repaso</b> y un <b>simulacro del examen</b> antes del salto.</p></div>
<div class="card"><h3>Examen final</h3><p>Se realiza en la <b>semana de exámenes</b>. Consulta el formato y las fechas exactas en la guía y el aula virtual de la asignatura.</p></div>
</div>
<div class="official" style="margin-top:14px">📋 Oficial · Semana 15: repaso y simulacro · Semana 16: semana de exámenes.</div>
</div></section>
''' + FOOT

# ================= PÁGINA 3 · SALA DE RECURSOS (en construcción) =================
gen_slots="\n".join(
 f'<div class="embed-slot"><div class="n">Tema {i}</div><div class="s">{t}</div><div class="wipchip">Próximamente</div></div>'
 for i,t in enumerate(["Fôrge · Contenido multimedia","Ecos · El vídeo","Sendara · Interactivos","Reliae · M-learning","Umbral · Evaluación","Ludo · ABJ","Vínculo · Gamificación","Liminar · RA/RV"],1))

REC = head("STARGATE · Sala de recursos",
  "Presentaciones de Genially, clasificación de puntos y tablero de insignias del proyecto STARGATE (CCD). En construcción.","rec") + f'''
<header class="hero"><div class="kicker">Sala de recursos · CCD</div>
<h1>Sala de recursos</h1>
<p>El centro de mando del curso: presentaciones interactivas, la clasificación de puntos y el tablero de
insignias. Algunas piezas están <b>en construcción</b> y se irán encendiendo a lo largo del curso.</p>
</header>

<section><div class="wrap">
<a class="backlink" href="index.html">← Volver a la guía</a>
<div class="wip"><span class="ic">🚧</span><div><b>Zona en construcción.</b> Los espacios marcados como «Próximamente» están preparados para
embeber el contenido en cuanto esté disponible. La estructura ya está lista.</div></div>

<div class="eyebrow teal">Presentaciones</div><h2>Geniallys de cada planeta</h2>
<p class="lead">Un Genially por tema. Cuando estén publicados, se incrustarán aquí. <span class="pill">Cómo incrustar: pega el enlace/embed de Genially en <code>recursos.html</code></span></p>
<div class="embed-grid">{gen_slots}</div>

<!-- PLANTILLA PARA INCRUSTAR UN GENIALLY (descomenta y pega el enlace de "Compartir → Insertar"):
<div class="responsive-embed">
  <iframe src="https://view.genially.com/XXXXXXXXXXXX" allowfullscreen scrolling="no" loading="lazy"></iframe>
</div>
-->
</div></section>

<section><div class="wrap">
<div class="eyebrow amber">Clasificación</div><h2>Ranking de reclutas (puntos)</h2>
<p class="lead">El marcador de la misión. Se conectará con la fuente de puntos del curso (hoja de cálculo, Additio,
ClassDojo…). <b>En construcción.</b></p>
<div class="podium">
<div class="pod silver"><div class="medal">🥈</div><div>2.º</div><div class="h"></div></div>
<div class="pod gold"><div class="medal">🥇</div><div>1.º</div><div class="h"></div></div>
<div class="pod bronze"><div class="medal">🥉</div><div>3.º</div><div class="h"></div></div>
</div>
<table><thead><tr><th>#</th><th>Recluta</th><th>Planeta actual</th><th>Insignias</th><th>Puntos</th></tr></thead>
<tbody class="muted-rows">
<tr><td>1</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>
<tr><td>2</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>
<tr><td>3</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>
<tr><td>…</td><td>Pendiente de conectar la fuente de puntos</td><td>—</td><td>—</td><td>—</td></tr>
</tbody></table>
<div class="official">🔌 Preparado para conectar con la clasificación real (por definir la herramienta con Norberto).</div>
</div></section>

<section><div class="wrap">
<div class="eyebrow teal">Colección</div><h2>Tablero de insignias</h2>
<p class="lead">Las 24 insignias que se pueden desbloquear. <b>Ya disponible</b> como galería; en el curso se marcará
cuáles ha ganado cada recluta.</p>
<h3>Personajes de la Tripulación Cero</h3><div class="badges">{pers_html}</div>
<h3 style="margin-top:1.6em">Especiales</h3><div class="badges">{esp_html}</div>
<h3 style="margin-top:1.6em">Retos</h3><div class="badges">{reto_html}</div>
<h3 style="margin-top:1.6em">Hitos</h3><div class="badges sm5">{hito_html}</div>
</div></section>

<section><div class="wrap">
<div class="eyebrow">Vídeos</div><h2>La serie narrativa</h2>
<p class="lead">Los vídeos de la campaña (opening, capítulos de cada planeta, fragmentos y batalla final). Se
enlazarán/incrustarán aquí desde el canal. <b>En construcción.</b></p>
<div class="embed-grid">
<div class="embed-slot"><div class="n">▶</div><div class="s">Opening «La Bitácora»</div><div class="wipchip">Próximamente</div></div>
<div class="embed-slot"><div class="n">▶</div><div class="s">Tráiler de campaña</div><div class="wipchip">Próximamente</div></div>
<div class="embed-slot"><div class="n">▶</div><div class="s">Fragmentos de la Cero</div><div class="wipchip">Próximamente</div></div>
</div>
</div></section>
''' + FOOT

# ================= DATOS DE LOS MODALES (insignias) =================
# tipo · como (cómo se consigue) · cuando · tarea (qué hay que hacer)
BADGE_INFO = {
 # Personajes de la Tripulación Cero (Reto A)
 "P1_bran":{"nombre":"Bran Okafor · El Forjador","tipo":"Insignia de personaje","como":"Completa el Reto A del Tema 1: «El boceto sin quemar».","cuando":"Tema 1 · Planeta Fôrge","tarea":"Publica en el foro un borrador en bruto de algo que estés creando y una frase sobre qué te daba reparo enseñarlo sin pulir. No se corrige: el único criterio es compartirlo antes de terminarlo. Al hacerlo se recupera el fragmento de Bran."},
 "P2_tomas":{"nombre":"Tomás Reyer · El Cronista","tipo":"Insignia de personaje","como":"Completa el Reto A del Tema 2: «Un mensaje para quien faltó».","cuando":"Tema 2 · Planeta Ecos","tarea":"Graba un clip corto (máx. 60 s) explicando un concepto como si se lo contaras a un alumno que hoy no vino a clase. Debe entenderse solo, sin ti delante."},
 "P3_sylla":{"nombre":"Sylla Bren · La Rastreadora","tipo":"Insignia de personaje","como":"Completa el Reto A del Tema 3: «Dos senderos».","cuando":"Tema 3 · Planeta Sendara","tarea":"Toma un objetivo de aprendizaje y describe dos rutas completamente distintas para alcanzarlo, pensadas para dos alumnos diferentes. Que las dos lleguen a la misma cima."},
 "P4_amara":{"nombre":"Amara Sol · La Operadora","tipo":"Insignia de personaje","como":"Completa el Reto A del Tema 4: «Abre el canal».","cuando":"Tema 4 · Planeta Reliae","tarea":"Comparte con tu clase o el foro un recurso útil en menos de 24 h, aunque no esté pulido. Añade qué habrías «guardado en el cajón para pulir» y por qué esta vez no lo hiciste."},
 "P5_vera":{"nombre":"Vera Khal · La Médica","tipo":"Insignia de personaje","como":"Completa el Reto A del Tema 5: «Mide con método».","cuando":"Tema 5 · Planeta Umbral","tarea":"Define un indicador observable que vayas a seguir de verdad del aprendizaje de tus alumnos, acompañado de la pregunta que lo convierte en cuidado: «¿qué haré mañana mejor que hoy?»."},
 "P6_joran":{"nombre":"Joran Pike · El Ingeniero-jugador","tipo":"Insignia de personaje","como":"Completa el Reto A del Tema 6: «Ensaya jugando».","cuando":"Tema 6 · Planeta Ludo","tarea":"Coge algo que tus alumnos temen o les cuesta y conviértelo en un pequeño ensayo jugable (una mecánica: puntos, rutas, un enigma en cada paso). Que el juego sirva a un objetivo, no juego por juego."},
 "P7_mara":{"nombre":"Mara Voss · El Mando","tipo":"Insignia de personaje","como":"Completa el Reto A del Tema 7: «Un porqué».","cuando":"Tema 7 · Planeta Vínculo","tarea":"Toma una tarea rutinaria y escribe el «porqué» / la narrativa que la convierte en una causa. Diseña una insignia con sentido: memoria de un acto significativo, no premio por obedecer."},
 "P8_noa":{"nombre":"Noa Lieth · La Arquitecta de capas","tipo":"Insignia de personaje","como":"Completa el Reto A del Tema 8: «La capa posible».","cuando":"Tema 8 · Planeta Liminar","tarea":"Describe una «capa» sobre tu aula real: cómo sería si aprendiera a hablar de sí misma. Y elige un compromiso concreto que te llevas de todo el viaje. Con esto la Tripulación Cero queda completa."},
 # Especiales
 "E1_nebula":{"nombre":"NEBULA · La Bitácora viva","tipo":"Insignia de personaje (especial)","como":"Se obtiene en el Reclutamiento, al aceptar la misión.","cuando":"Inicio del viaje","tarea":"NEBULA es la IA de la nave y tu narradora constante. Su insignia marca tu alistamiento en STARGATE; te acompañará desde el primer día hasta la puerta de vuelta a casa."},
 "E2_capitan":{"nombre":"El Capitán · El Mando de la misión","tipo":"Insignia de personaje (especial)","como":"Se obtiene al presentar la Actividad 1.","cuando":"Temas 1–2","tarea":"El Capitán es el mando de la misión (tu profesor o profesora). Su insignia reconoce que has asumido tu primera misión mayor: la actividad didáctica con imagen de IA."},
 "E3_vaeon":{"nombre":"General Vaeon · Señor de la Estática","tipo":"Insignia de villano","como":"Se desbloquea en la batalla final y con el «Fragmento Prohibido».","cuando":"Cierre del viaje","tarea":"Vaeon es el antagonista: personifica los errores del diseño educativo (contenido que no se entiende, recursos que no llegan, saber no compartido). Coleccionar su carta es el trofeo de haber entendido al enemigo."},
 # Retos (Reto B)
 "R1_la-chispa":{"nombre":"La chispa","tipo":"Insignia de reto","como":"Completa el Reto B del Tema 1.","cuando":"Tema 1 · Fôrge","tarea":"Genera con una IA una imagen con finalidad didáctica: prompt estructurado (contexto + tipo de imagen + finalidad), al menos una iteración, selección final con tu criterio docente y evidencia del proceso. Es el núcleo de la Actividad 1."},
 "R2_el-eco-que-ensena":{"nombre":"El eco que enseña","tipo":"Insignia de reto","como":"Completa el Reto B del Tema 2.","cuando":"Tema 2 · Ecos","tarea":"Crea un videotutorial de calidad (guion + grabación de pantalla + edición) y enriquécelo con 2–3 preguntas insertadas (videoquiz). Piénsalo para aula invertida y súbelo a la Bitácora con una reflexión breve."},
 "R3_la-matriz":{"nombre":"La matriz","tipo":"Insignia de reto","como":"Completa el Reto B del Tema 3.","cuando":"Tema 3 · Sendara","tarea":"Construye la matriz de programación 8×6 (8 inteligencias múltiples × 6 niveles de Bloom = 48 casillas) y rellena al menos 6 cruces variados, con una actividad en cada uno. Es el núcleo de planificación de la Actividad 2."},
 "R4_entorno-de-aula":{"nombre":"El entorno de aula","tipo":"Insignia de reto","como":"Completa el Reto B del Tema 4.","cuando":"Tema 4 · Reliae","tarea":"Monta un espacio digital de aula organizado (tipo Classroom, Sites, Moodle…) donde compartas materiales y puedas dar feedback y comunicarte en diferido y en directo. Deja enlace/captura + reflexión en la Bitácora."},
 "R5_bitacora-medida":{"nombre":"La Bitácora medida","tipo":"Insignia de reto","como":"Completa el Reto B del Tema 5.","cuando":"Tema 5 · Umbral","tarea":"Diseña una rúbrica digital sencilla y estructura formalmente tu ePortfolio (una sección por evidencia, con el patrón evidencia → contexto → reflexión → autoevaluación). Esta semana además se cierra la Actividad 1."},
 "R6_el-juego":{"nombre":"El juego","tipo":"Insignia de reto","como":"Completa el Reto B del Tema 6.","cuando":"Tema 6 · Ludo","tarea":"Adapta o crea un juego digital educativo para un objetivo concreto de tu aula. En Aprendizaje Basado en el Juego el juego ES la actividad: cada mecánica debe servir a un aprendizaje. Sube el juego + reflexión."},
 "R7_microgamificacion":{"nombre":"La microgamificación","tipo":"Insignia de reto","como":"Completa el Reto B del Tema 7.","cuando":"Tema 7 · Vínculo","tarea":"Diseña una microgamificación de calidad: un toque de juego sobre una tarea que NO es un juego (una insignia, una barra de progreso, un tablero, un reto con narrativa). Aquí no se juega: se toman elementos del juego para enganchar."},
 "R8_ultimo-umbral":{"nombre":"El último umbral","tipo":"Insignia de reto","como":"Completa el Reto B del Tema 8.","cuando":"Tema 8 · Liminar","tarea":"Crea una experiencia de Realidad Aumentada o Virtual para tu materia y termina y publica la Bitácora (paisaje como imagen interactiva + las 5 páginas completas + enlace único). Resuelve la Actividad 2."},
 # Hitos
 "H1_reclutamiento":{"nombre":"Reclutamiento","tipo":"Insignia de hito","como":"Preséntate ante el mando en la primera sesión.","cuando":"Semana 1","tarea":"Aceptas la misión: te alistas en el equipo de rescate de STARGATE y abres tu Bitácora Estelar."},
 "H2_primera-forja":{"nombre":"Primera Forja","tipo":"Insignia de hito","como":"Entrega la Actividad 1.","cuando":"Temas 1–2","tarea":"Tu primera obra queda registrada en la Bitácora: la actividad didáctica creada a partir de una imagen con IA."},
 "H3_cartografo":{"nombre":"Cartógrafo","tipo":"Insignia de hito","como":"Entrega la Actividad 2.","cuando":"Tema 3 (se resuelve en el 8)","tarea":"Dibujas un territorio, no un camino: entregas el paisaje de aprendizaje con su matriz de programación."},
 "H4_tripulacion-cero":{"nombre":"Tripulación Cero","tipo":"Insignia de hito","como":"Desbloquea a los 8 personajes de la Cero.","cuando":"A lo largo del viaje","tarea":"Recuperas a Bran, Tomás, Sylla, Amara, Vera, Joran, Mara y Noa. NEBULA vuelve a estar completa."},
 "H5_la-liberacion":{"nombre":"La Liberación","tipo":"Insignia de hito","como":"Completa y publica la Bitácora.","cuando":"Repaso final","tarea":"Una Bitácora abierta, copiada y compartida no se puede apagar: la Estática retrocede y la puerta a la Tierra se abre. Tu ePortfolio es el camino a casa."},
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

JS_TEMPLATE = r"""// STARGATE — modales de insignias y tarjetas (autogenerado)
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
      +'<dt>Qué hay que hacer</dt><dd>'+esc(d.tarea)+'</dd></dl>'
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
})();
"""
os.makedirs(os.path.join(HERE,"assets","js"),exist_ok=True)
js = JS_TEMPLATE.replace("__BADGE__", json.dumps(BADGE_INFO, ensure_ascii=False)).replace("__CARDS__", json.dumps(CARD_TITLES, ensure_ascii=False))
with open(os.path.join(HERE,"assets","js","stargate.js"),"w") as fh: fh.write(js)
print("escrito: assets/js/stargate.js")

for name,html in [("index.html",INDEX),("actividades.html",ACT),("recursos.html",REC)]:
    with open(os.path.join(HERE,name),"w") as fh: fh.write(html)
    print("escrito:",name, f"{len(html)//1024} KB")
print("OK sitio generado")
