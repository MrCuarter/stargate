'use strict';
/**
 * BATERÍA 105 · LAS MEJORAS DE LA NOTA DEL 22-SEP (tanda 1: los arreglos sin rediseño)
 *
 * Norberto dejó 17 mejoras en una nota después de probarlo todo antes del estreno. Aquí, las de la primera tanda: las que
 * se arreglan sin dibujar nada antes. Lo que se puede EJECUTAR se ejecuta (el lector del mensaje del foro, con los
 * mensajes de verdad de las semanas 1 y 15); lo demás se vigila en su sitio.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };

const REC = L("assets/js/recluta.js"), SES = L("assets/js/sesion.js"), CONS = L("assets/js/consola.js");
const AULA = L("assets/js/aula.js"), BAT = L("assets/js/batalla.js"), TAB = L("assets/js/tablero.js");
const CSS = L("assets/css/stargate.css"), STG = L("assets/js/stargate.js");

// ── 1 · «En El Archivo los estudiantes pueden ver los fragmentos aunque no hayan recuperado al personaje. Arréglalo»
c(/function fragCerrado\(v\)/.test(REC), "🔴 un solo sitio decide si un vídeo es un fragmento todavía sin ganar");
c(/var fc=fragCerrado\(v\[0\]\); return fc\?'<div class="yt cerrado">'\+tapaFragmento\(fc\)/.test(REC),
  "🔴 el mapa de planetas («Mis retos») ya no reproduce un fragmento sin ganar: por ahí se escapaban");
c(/var fc=fragCerrado\(x\[0\]\);/.test(REC) && /cine-mini-tapa/.test(REC), "   ni la tira de miniaturas del cine enseña su carátula");
c(/\(fr&&llegada\?tapaFragmento\(fr\)/.test(REC), "   y en El Archivo, un fragmento de una semana futura no dice de quién es");
c(/querySelectorAll\('\.yt\[data-id\]'\)/.test(REC), "   el candado no se cablea como un vídeo (no tiene id que reproducir)");
c(/function nombreDeReto\(id\)/.test(REC) && /esc\(nombreDeReto\(f\.reto\)\)/.test(REC), "   y el candado nombra el reto por su nombre, no «A1»");

// ── 2 · el ticket: presentación, 8 temas y final (la batería 99 lo prueba entero)
c(/"p": "Presentación de la asignatura"/.test(L("_site_data.py")) && !/"a1":/.test(L("_site_data.py")), "🔴 ticket: sin actividades, con la presentación");

// ── 3 · el despegue: el panel, y nada más (la 84 lo prueba entero)
c(!/function diaPuente\(/.test(SES), "🔴 despegue: sin tarjeta puente");

// ── 4 · «en el embed de herramientas se cortan las imágenes de recompensas. Ponlas completas»
c(/\.au-pr-i\{width:100%;height:auto;aspect-ratio:16\/9;object-fit:contain/.test(CSS), "🔴 las láminas de premio, enteras (contain en su caja 16:9)");
c(!/\.au-pr-i\{[^}]*object-fit:cover/.test(CSS) && !/\.au-pr-i\{width:38px;height:38px\}/.test(CSS), "   ni recortadas con cover ni en un cuadradito de 38 px dentro del embed");

// ── 5 · el calendario: la fecha escrita a mano y el icono
c(/function trasElClic\(fn\)/.test(CONS) && /onchange = function \(\) \{ if \(ponInicio\(this\.value\)\) trasElClic\(re\); \}/.test(CONS),
  "🔴 calendario: el repintado espera a que se suelte el botón (el clic de «Guardar» ya no se pierde)");
c(/if \(\$\("#cal-inicio"\)\) ponInicio\(\$\("#cal-inicio"\)\.value\);/.test(CONS), "   y «Guardar» relee el campo por si su `change` no llegó");
c(/input\[type=date\],input\[type=datetime-local\],input\[type=time\]\{color-scheme:dark\}/.test(CSS)
  && /::-webkit-calendar-picker-indicator\{[^}]*calendario\.png/.test(CSS), "🔴 el icono del calendario se ve: tema oscuro y nuestro icono, a color");

// ── 7 · sin «Ajustes»; «Configurar diapositivas» en la sesión (la 95 lo prueba entero)
c(!/id="doc-ajustes-b"/.test(CONS) && /id="prep-cfg"/.test(SES), "🔴 sin Ajustes; «Configurar diapositivas» en «Antes de empezar»");

// ── 8 · «siempre que haya un enlace de YouTube, es para que lo embebas dentro del mensaje»
const a = STG.indexOf("window.SG.ytId = function"), b = STG.indexOf("window.SG.CFGSESION");
const win = { SG: {} };
new Function("window", STG.slice(a, b))(win);
const H = L("recluta.html"), i = H.indexOf("window.SG_SEMANAS="), j = H.indexOf(";window.", i);
const SEMS = JSON.parse(H.slice(i + "window.SG_SEMANAS=".length, j));
const b1 = win.SG.foroParrafos(SEMS[0].foro), yt1 = b1.filter(x => x.t === "yt");
c(yt1.length === 1 && yt1[0].id === "5CqyMqs8zE8", "🔴 el mensaje de la semana 1 trae su vídeo de bienvenida como VÍDEO, no como URL", JSON.stringify(yt1));
c(yt1.length === 1 && yt1[0].x === "Mensaje de bienvenida", "   con su rótulo («Mensaje de bienvenida»), que era la línea que lo presentaba", yt1[0] && yt1[0].x);
c(!b1.some(x => x.t !== "yt" && /youtu/.test(x.x || "")), "   y la URL ya no queda suelta en ningún párrafo");
const b15 = win.SG.foroParrafos(SEMS[SEMS.length - 1].foro);
c(b15.some(x => x.t === "yt"), "   el de la semana 15, también (el último capítulo)");
c(!win.SG.foroParrafos(SEMS[0].foro, { proyectar: 1 }).some(x => x.t === "yt"),
  "   en la proyección no (el vídeo ya tiene su diapositiva justo detrás del mensaje)");
c(win.SG.ytId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10") === "dQw4w9WgXcQ" && win.SG.ytId("https://youtu.be/dQw4w9WgXcQ") === "dQw4w9WgXcQ"
  && win.SG.ytId("https://www.youtube.com/shorts/dQw4w9WgXcQ") === "dQw4w9WgXcQ" && win.SG.ytId("https://example.com") === "",
  "   reconoce las formas de enlace de YouTube (watch, youtu.be, shorts) y nada más");
c(/if \(b\.t === "yt"\) return window\.SG\.ytInline\(b\.id, b\.x\);/.test(CONS), "🔴 la carta del foro de la Nave del Comandante lo pinta");
c(/if\(b\.t==='yt'\) return op\.sinVideos\?'':window\.SG\.ytInline/.test(REC) && /var vids=videosDelMensaje\(sm\.foro\)/.test(REC) && /sinVideos:true/.test(REC),
  "🔴 la Nave del recluta, también: fuera del recorte de «Leer entero», delante del texto");
c(/closest\('\.yt-foro'\)/.test(STG), "   y se reproduce ahí mismo al pulsarlo, aunque llegue después de cargar la página");

// ── 9 · «si se inicia sesión con la cuenta de un docente, debe poder mostrar el simulador completo a modo de ejemplo»
c(/M\.misPERs \? M\.misPERs\(correo\)/.test(BAT) && /ENSAYO = true;/.test(BAT), "🔴 simulador: un docente sin ficha de recluta entra en ensayo en su grupo");
c(/Das clase en más de uno: elige cuál quieres enseñar/.test(BAT), "   y si lleva varios, elige cuál");

// ── 10 · embeds universales: el tablero detecta la cuenta; las herramientas pasan lista
c(/if\(!per&&!enConsola\)\{ porCuenta\(\); return; \}/.test(TAB) && !/<h3>Elige tu PER<\/h3>/.test(TAB) && !/FUENTE\.lista\(\)/.test(TAB),
  "🔴 el tablero sin grupo ya no lista TODOS los grupos: pregunta a la cuenta");
c(/M\.misGruposDeAlumno\(yo\.uid\)/.test(TAB) && /x\.estado==='en marcha'/.test(TAB), "   estudiante → el suyo; docente → sus grupos en marcha");
c(/"registro\.html\?solo=1&embed=1"/.test(CONS), "🔴 y su embed es uno para todos, en «Para tus Geniallys»");
c(/id="au-ll-tocar"/.test(AULA) && /MOTOR\.abrirLlamada\(PER, min/.test(AULA) && /MOTOR\.cerrarLlamada\(SESION\.id\)/.test(AULA),
  "🔴 las herramientas pasan lista (abrir y cerrar la llamada) sin tener la presentación delante");

console.log("\n  Batería 105 · la nota del 22-sep, tanda 1");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
