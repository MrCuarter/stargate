'use strict';
/**
 * BATERÍA 104 · LAS DOS MISIONES MAYORES (21-sep)
 *
 * Norberto: «Necesito saber qué misiones/retos están directamente relacionados con la act1 y act2. En las sesiones
 * en vivo de los temas 1 y 3, debes añadir un par (o las que haga falta) de diapositivas explicando la actividad que
 * toca. Es importante que aparezcan los retos relacionados para que vean que los retos forman parte del proceso. Las
 * actividades sí que cuentan para su nota final, los retos no».
 *
 * 🔴 ESTO NO COMPRUEBA QUE EL CÓDIGO EXISTA: **monta las diapositivas de verdad**. Se saca `diasActividad` del propio
 * `sesion.js` (con sus ayudantes) y se ejecuta contra los datos reales que viajan en `sesion.html`. Así se ve lo que
 * verá la clase: el enunciado, los puntos, los tres retos con su nombre de verdad y la semana en que se lanzan.
 *
 * Y lo que más importa vigilar: que las dos frases que sostienen el encargo —«no puntúan» / «sí» y los puntos de la
 * actividad— salgan del dato y no de una copia escrita a mano en otro sitio.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };

const S = L("assets/js/sesion.js"), HTML = L("sesion.html"), ACTHTML = L("actividades.html");
const DATOS = L("_site_data.py"), CSS = L("assets/css/stargate.css");

// ── los datos tal y como viajan a la página
function global(n) {
  const i = HTML.indexOf("window." + n + "=");
  const j = HTML.indexOf(";window.", i), k = HTML.indexOf(";</script>", i);
  const fin = j < 0 || (k >= 0 && k < j) ? k : j;
  return JSON.parse(HTML.slice(i + ("window." + n + "=").length, fin));
}
const ACTS = global("SG_ACTIVIDADES"), SEMS = global("SG_SEMANAS"), RETOS = global("SG_RETOS");
const CAT = JSON.parse(L("motor/catalogo.json")).retos.REGULAR;

c(Array.isArray(ACTS) && ACTS.length === 2, "🔴 las dos misiones mayores viajan con la sesión (SG_ACTIVIDADES)", ACTS.length);
c(/^ACTIVIDADES = \[/m.test(DATOS), "   y viven en _site_data.py, en un solo sitio");

// ── se monta el trozo de sesion.js que pinta las diapositivas, con sus ayudantes
const entre = (a, b) => S.slice(S.indexOf(a), S.indexOf(b));
const api = new Function(`
  var RET = ${JSON.stringify(RETOS)}, ACTS = ${JSON.stringify(ACTS)}, SEMS = ${JSON.stringify(SEMS)};
  function semanas(){ return SEMS; }
  ${entre("function esc(s)", "function cargando(")}
  ${entre("function nucleo(txt){", "function badge(k)")}
  ${entre("function fuerte(t){", "\n  function diasMisiones(s){")}
  return { diasActividad: diasActividad, actividadDe: actividadDe, semanaDeReto: semanaDeReto, fuerte: fuerte };
`)();

const semDe = n => SEMS.filter(s => Number(s.sem) === n)[0];
const nombreCat = id => (CAT.filter(r => r.id === id)[0] || {}).titulo || "";
const nucleoDe = t => (String(t).match(/«([^»]+)»/) || [, ""])[1];

// ── 1 · solo salen en las semanas que lanzan una actividad
const conActividad = SEMS.filter(s => api.diasActividad(s).length).map(s => s.sem);
c(JSON.stringify(conActividad) === JSON.stringify(ACTS.map(a => a.sem)),
  "🔴 las diapositivas salen SOLO en las semanas que lanzan una actividad (la 2 y la 6)", JSON.stringify(conActividad));
c(ACTS.every(a => /Actividad\s+\d/i.test(String((semDe(a.sem) || {}).sub || ""))),
  "   y esa semana lo dice en su subtítulo, que es de donde se deduce (nada de números a mano)");

// ── 2 · son dos: qué pide la actividad y qué retos la construyen
ACTS.forEach(function (a) {
  const d = api.diasActividad(semDe(a.sem));
  const uno = d[0].html, dos = d[1].html;
  c(d.length === 2 && d[0].k === "act" && d[1].k === "actretos",
    "🔴 Actividad " + a.n + " · dos diapositivas: la actividad y los retos que la construyen", JSON.stringify(d.map(x => x.k)));

  // la primera: el enunciado oficial, paso a paso, y lo que pesa
  c(uno.indexOf(a.titulo) > 0 && uno.indexOf(a.lema) > 0 && uno.indexOf(a.planeta) > 0,
    "   Actividad " + a.n + " · lleva su título, su lema y su planeta");
  c(a.pasos.every(p => uno.indexOf(p[0]) > 0) && (uno.match(/<li style="--i:/g) || []).length === a.pasos.length,
    "   Actividad " + a.n + " · con los " + a.pasos.length + " pasos del enunciado oficial");
  c(uno.indexOf(a.puntos + " de los 10 puntos") > 0 && uno.indexOf("semana " + a.resuelve) > 0,
    "🔴 Actividad " + a.n + " · dice lo que pesa (" + a.puntos + ") y cuándo se resuelve (semana " + a.resuelve + ")");

  // la segunda: la frase del encargo y los retos, con su nombre de verdad
  c(/no puntúan/.test(dos) && /la actividad, <b>sí<\/b>/.test(dos),
    "🔴 Actividad " + a.n + " · «los retos no puntúan; la actividad, sí» — dicho en la diapositiva");
  // (el nombre sale del catálogo que viaja con la página, que es el corto — «Reto relámpago «La chispa y la marca»»—;
  //  el largo, con su coletilla, es el del catálogo congelado. Lo estable de los dos es el título entrecomillado, que
  //  es justo por donde los cruza la sesión: eso es lo que se exige aquí.)
  c(a.retos.every(r => nucleoDe(nombreCat(r[0])) && dos.indexOf(nucleoDe(nombreCat(r[0]))) > 0),
    "🔴 Actividad " + a.n + " · cada reto sale con su nombre, no con su id",
    JSON.stringify(a.retos.map(r => r[0] + "→" + nucleoDe(nombreCat(r[0])))));
  c(a.retos.every(r => dos.indexOf(r[0] + "</b>") < 0),
    "   Actividad " + a.n + " · y nunca el id pelado (L1, B3…) delante de la clase");
  c(a.retos.every(r => api.semanaDeReto(r[0]) > 0),
    "   Actividad " + a.n + " · y todos son retos que el calendario lanza de verdad",
    JSON.stringify(a.retos.map(r => r[0] + "→sem " + api.semanaDeReto(r[0]))));
  c(a.retos.every(r => api.semanaDeReto(r[0]) <= a.sem),
    "🔴 Actividad " + a.n + " · ninguno es de más adelante: la clase ya los tiene hechos o los hace hoy",
    JSON.stringify(a.retos.map(r => r[0] + "→sem " + api.semanaDeReto(r[0]))));
  const chips = (dos.match(/class="ar-w">([^<]+)</g) || []).map(x => x.replace(/.*">/, "").replace(/</, ""));
  c(chips.length === a.retos.length && chips.some(x => /ya lo tienes|Se lanza hoy/.test(x)),
    "   Actividad " + a.n + " · cada reto con su semana («ya lo tienes» / «se lanza hoy»)", JSON.stringify(chips));

  // 🔴 la marca **negrita** del dato se convierte: si se colara, la clase leería asteriscos
  c(uno.indexOf("**") < 0 && dos.indexOf("**") < 0, "   Actividad " + a.n + " · sin asteriscos sueltos en pantalla");
  const negritas = a.retos.map(r => (String(r[1]).match(/\*\*([^*]+)\*\*/) || [])[1]);
  c(negritas.every(t => t && dos.indexOf("<b>" + t + "</b>") > 0),
    "   Actividad " + a.n + " · y lo importante de cada línea, en negrita", JSON.stringify(negritas));
});

// ── 3 · un dato, un sitio: la misma respuesta en la página del alumnado
c(/<h3>Los retos que la construyen<\/h3>/.test(ACTHTML),
  "🔴 «Actividades y evaluación» cuenta lo mismo (no hay dos versiones de esta respuesta)");
c(ACTS.every(a => a.retos.every(r => ACTHTML.indexOf(nombreCat(r[0])) > 0)),
  "   con los mismos retos en la página");
c(!/<section id="act1"><div class="wrap">\n<div class="eyebrow amber">Misión mayor I/.test(L("_build_site.py")),
  "🔴 y la página ya no los lleva escritos a mano en el HTML: se generan del dato");
c(/def _seccion_actividad\(a\)/.test(L("_build_site.py")) && /_negrita\(/.test(L("_build_site.py")),
  "   el generador está donde se ve, con la misma marca de negrita que la sesión");

// ── 4 · la sección se puede apagar, como todas las demás
c(/\("actividad", "La misión mayor"/.test(DATOS), "🔴 es una sección con nombre: el docente puede quitarla de su sesión");
c(/act:'actividad', actretos:'actividad'/.test(S), "   y las dos diapositivas pertenecen a ella");
// 23-sep · entre la actividad y las misiones va la diapositiva de los retos de la semana (el comandante, retador)
c(/ci=ci\.concat\(diasActividad\(s\)\);\s*\n\s*var rs=diaRetosSemana\(s\); if\(rs\) ci\.push\(rs\);\s*\n\s*ci=ci\.concat\(diasMisiones\(s\)\)/.test(S),
  "🔴 van detrás del vídeo de la misión y delante de los retos de la semana");

// ── 5 · y se ven (el estilo existe, y nada por debajo de 12 px)
["act-pasos", "act-retos", "act-tag", "act-nota"].forEach(k =>
  c(CSS.indexOf("." + k) > 0, "   estilo de ." + k));
const chicas = (CSS.match(/\.(act-[a-z]+|ar-[a-z]+)[^{]*\{[^}]*font-size:\.(\d\d)rem/g) || [])
  .filter(x => Number("0." + x.match(/font-size:\.(\d\d)rem/)[1]) < 0.75);
c(!chicas.length, "🔴 ni una letra por debajo de 12 px (la regla del aire)", chicas.join(" · "));

console.log("\n  Batería 104 · las dos misiones mayores (21-sep)");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
