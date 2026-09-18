'use strict';
/**
 * BATERÍA 93 · LA TANDA DE LA PRUEBA HUMANA DEL 18-SEP.
 *
 * Norberto, probando: los retos se despliegan por semanas (el largo, la semana del cierre del tema) y el que no se ha
 * explicado sale en sombra; el aula dentro de la presentación (solo para el docente) y lo que lanza, encima de la
 * diapositiva del recluta; el panel del docente con su comandante y sus cifras; el grupo de un vistazo con lo de clase a
 * mano; iconos propios en el aula y fuera emojis; y en la semana 1, primero la asignatura y después el planeta.
 */
const fs = require("fs"), path = require("path");
const RAIZ = path.resolve(__dirname, "..");
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
const DATOS = leer("_site_data.py"), BUILD = leer("_build_site.py"), NAVE = leer("assets/js/recluta.js"), SES = leer("assets/js/sesion.js");
const AULA = leer("assets/js/aula.js"), CONS = leer("assets/js/consola.js"), MOTOR = leer("assets/js/motor.js"), CSS = leer("assets/css/stargate.css");
const ENTRAR = leer("assets/js/entrar.js");

// ── 1 · los retos, por semanas
const sr = (leer("recluta.html").match(/window\.SG_SEM_RETO=(\{.*?\}\});/) || [])[1];
let mapa = {}; try { mapa = JSON.parse(sr).REGULAR; } catch (e) {}
c(/def _sem_de_reto\(catalogo\)/.test(BUILD) && /SEM_RETO_JSON/.test(BUILD), "🔴 la semana de cada reto sale del calendario de la sesión (un dato, un sitio)");
c(mapa.A1 === 1 && mapa.B1 === 2, "🔴 tema 1: el reto rápido (A1) la semana 1 y el largo (B1) la 2", JSON.stringify({ A1: mapa.A1, B1: mapa.B1 }));
c(mapa.A2 === 3 && mapa.B2 === 4 && mapa.A3 === 5 && mapa.B3 === 6 && mapa.A4 === 7 && mapa.B4 === 8, "   y así en los temas 2, 3 y 4 (el largo, en la semana de cierre)");
c(mapa.A5 === 9 && mapa.B5 === 9 && mapa.A6 === 10 && mapa.B6 === 10, "   los temas de una sola sesión (5 y 6) lanzan los dos a la vez");
c(mapa.A7 === 11 && mapa.B7 === 12 && mapa.A8 === 13 && mapa.B8 === 14, "   y los temas 7 y 8, el largo a la semana siguiente");
c(/function retoPorLanzar\(id, ya\)/.test(NAVE) && /class="reto-sem por-lanzar"/.test(NAVE) && /La próxima semana/.test(NAVE),
  "🔴 Nave · el reto que aún no se ha explicado sale en sombra, con «la próxima semana» y sin poder registrarse");
c(/\.reto-sem\.por-lanzar\{opacity:\.5/.test(CSS), "   y se ve en sombra");

// ── 2 · el aula, dentro de la presentación
c(/!st\.alumno && st\.per && st\.yo\s*\n?\s*\? '<button type="button" class="ses-aula-b"/.test(SES) && /aula\.html\?per='\+encodeURIComponent\(st\.per\)\+'&embed=1/.test(SES),
  "🔴 sesión · el docente tiene «El aula» en cualquier diapositiva (solo si es docente de ese grupo)");
c(/function emitirCrono\(\)/.test(AULA) && /publicarEnVivo\(PER, \{ sesion: \{ crono: c \} \}\)/.test(AULA), "🔴 aula · el temporizador viaja a la sesión de la clase");
c(/function relojAlumno\(\)/.test(SES) && /class="ses-al-crono"/.test(SES), "   y el recluta lo ve encima de la diapositiva");
c(/SEG\.pararVotos=M\.vigilarVotaciones\(st\.per/.test(SES) && /class="ses-al-vt"/.test(SES), "🔴 la votación que lanza el docente se pinta encima, y se vota ahí");

// ── 3 · el panel del docente y el grupo de un vistazo
c(/async function miFichaDocente\(\)/.test(MOTOR) && /async function ponerAvatarDocente\(clave\)/.test(MOTOR), "🔴 motor · el docente guarda su avatar de comandante");
c(/class="doc-panel"/.test(CONS) && /\(window\.SG_COMANDANTES_GEN \|\| \[\]\)\.map/.test(CONS), "🔴 consola · panel del docente con su comandante, que se cambia de una galería");
// 18-sep · los genéricos salen de la carpeta (c1, c2…): se añade una imagen y ya está en la galería
const GEN = JSON.parse((leer("consola.html").match(/window\.SG_COMANDANTES_GEN=(\[[^\]]*\]);/) || [])[1] || "[]");
c(GEN.length >= 26 && GEN.every((k, i) => k === "c" + (i + 1) && fs.existsSync(path.join(RAIZ, "assets/img/avatares/comandantes", k + ".jpg"))),
  "   los comandantes genéricos, en orden y todos con su imagen (rubios, castaños, pelirrojos, veteranos y alienígenas)", GEN.join(" "));
c(/function resumenGrupo\(t\)/.test(CONS) && /resumenGrupo\(t\) \+/.test(CONS), "🔴 dentro del grupo, sus cifras de un vistazo (activos, sin estrenarse, destacados)");
c(/'<div class="gp-hacer c-hacer">'/.test(CONS), "🔴 dentro del grupo, proyectar la clase, el aula y la llamada a filas");

// ── 4 · iconos y fuera emojis
["clase", "gente", "premios", "tiempo", "voto", "pregunta"].forEach(k =>
  c(fs.existsSync(path.join(RAIZ, "assets/img/nave/iconos", k + ".png")), "   icono del aula «" + k + "»"));
c(!/\["[a-z]+", "[\u{1F300}-\u{1FAFF}☀-➿]/u.test(AULA), "🔴 las pestañas del aula, con icono propio y sin emojis");
c(!/<span>📽️<\/span>|<span>🎛️<\/span>|<span>🔔<\/span>/.test(CONS), "   las tarjetas de grupo, sin emojis");
c(!/<span>🎓<\/span>|<span>🚀<\/span>/.test(ENTRAR), "   y la puerta («¿Cómo entras hoy?»), tampoco");

// ── 5 · la semana 1: primero la asignatura, después el planeta
c(/if\(\/\^Apertura\\b\/i\.test\(c\)\) return 'inicio';/.test(SES) && /Tras el despegue/.test(SES), "🔴 sesión · el momento de cada vídeo lo dice el propio dato");
c(/"Apertura: tras la sinopsis, presenta la Bitácora/.test(DATOS) && /"Tras el despegue: al abrir el Tema 1/.test(DATOS),
  "   semana 1: el ePortfolio en la apertura; el planeta, tras el despegue y antes de sus retos");

// ── 6 · la sesión a medida de cada docente
const FUENTE = leer("assets/js/fuente.js"), TAB = leer("motor/tablero.js");
c(/SESION_SECCIONES = \[/.test(DATOS) && (DATOS.match(/^    \("[a-z]+", "/gm) || []).length >= 16, "🔴 las secciones de la sesión, con su nombre, en un solo sitio");
c(/function apagadas\(\)/.test(SES) && /off\.indexOf\(secDe\(x\)\)<0/.test(SES) && /todo=quedan\.length\?quedan:\[todo\[0\]\]/.test(SES),
  "🔴 la sesión quita lo que ese docente quita (y nunca se queda vacía)");
c(/st\.profeMio\|\|''/.test(SES.slice(SES.indexOf("function apagadas"))), "   y su alumnado, al seguirle, ve lo mismo que él");
c(/mi_sesion: function \(M, yo, q\)/.test(FUENTE) && /"stargate\.sesiones": sesiones/.test(FUENTE), "🔴 cada docente guarda la suya en su grupo (como su Genially propio)");
c(/sesiones: S\.sesiones \|\| \{\}/.test(TAB), "   y viaja en el tablero del grupo");
c(/<h3>Tu sesión en directo<\/h3>/.test(CONS) && /class="m-sec"><input type="checkbox" data-sec=/.test(CONS) && /✓ Guardado/.test(CONS),
  "🔴 consola · «Tu sesión en directo»: una casilla por sección, todas marcadas por defecto, y se guarda al tocarla");

// ── 7 · el reparto de comandantes: los inspirados en el equipo, uno más, sin nombres
// 🔴 18-sep · Norberto: «no pongas nombres a los comandantes, forman parte del reparto de comandantes»
const DIR_COM = path.join(RAIZ, "assets/img/avatares/comandantes");
c(GEN.length === 26, "🔴 26 comandantes en el reparto (los inspirados en el equipo, c21–c26, entre ellos)", GEN.length);
c(!/COMANDANTES_PROPIOS/.test(DATOS + BUILD) && !/window\.SG_COMANDANTES=/.test(leer("consola.html")) && !/doc-avas-g propios|<span>' \+ esc\(x\[1\]\)/.test(CONS),
  "🔴 la galería no lleva nombres ni una fila aparte para el equipo");
c(!fs.readdirSync(DIR_COM).some(f => /^t\d*-|^(norberto|abel|adriana|anita|caridad|patricia)\./.test(f)),
  "🔴 ningún fichero con el nombre de un docente (ni los retratos con su cara real)");
c(!fs.existsSync(path.join(RAIZ, "fotos_comandantes")) && !/fotos_comandantes\/[a-z]/.test(DATOS), "🔴 las fotos originales NO están en la web (son de personas)");
c(/\.doc-avas-g \.doc-av-op\{flex:0 0 calc\(\(100% - 120px\) \/ 13\)\}/.test(CSS) && /justify-content:center/.test(CSS.slice(CSS.indexOf(".doc-avas-g{"))),
  "   13 por fila (dos filas justas) y la última, centrada en el móvil");

console.log("\n  Batería 93 · la tanda de la prueba humana del 18-sep");
console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
fallos.forEach(f => console.log("   ✗ " + f));
process.exit(fallos.length ? 1 : 0);
