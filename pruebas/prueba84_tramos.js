'use strict';
/**
 * BATERÍA 84 · LOS TRES TIEMPOS DE LA CLASE (16-sep-2026).
 *
 * Norberto: «el embed de clase que detecta al docente y la semana es continuo; creo que deberíamos separarlo en dos
 * bloques. Primero animar la gamificación, el vídeo, revisar el ticket de salida. Después la presentación de Genially,
 * con la teoría y alguna práctica guiada. Después el reto relámpago de cierre, con el vídeo si toca. ¿Aprovechar el
 * mismo embed que tenga claramente antes / después? Así el mismo embed nos sirve para todo».
 *
 * Lo que se vigila: que el MISMO enlace sirva para los dos momentos (`?tramo=apertura` y `?tramo=cierre`), que cada
 * diapositiva sepa en qué tiempo va, que lo que se repasa (ticket, ranking, reflexiones) esté en la apertura y lo que
 * se lanza (misión, retos, cierre) esté en el cierre, y que el Genially del grupo siga siendo el tramo del medio.
 */
const fs = require("fs"), path = require("path");
const RAIZ = path.resolve(__dirname, "..");
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
const S = leer("assets/js/sesion.js"), CSS = leer("assets/css/stargate.css");

// 1 · el mismo embed, dos veces
c(/var TRAMO *=/.test(S) && /apertura\|ap/.test(S) && /cierre\|ci/.test(S),
  "🔴 el mismo enlace vale para los dos momentos: ?tramo=apertura y ?tramo=cierre");
c(/TRAMO *=== *'ap'/.test(S) && /TRAMO *=== *'ci'/.test(S), "   y cada uno enseña solo lo suyo");
c(/tramo/i.test(S) && !/tramo=1|tramo=2/.test(S), "   sin números: se escribe lo que significa");

// 2 · qué va en cada tiempo
c(/d\.forEach\(function *\(x\) *\{ *x\.t *= *'ap'; *\}\)/.test(S),
  "🔴 la apertura es lo que se REPASA: portada, llamada a filas, el mensaje, el vídeo de empezar, el parte de vuelo y el ticket");
c(/ci\.forEach\(function *\(x\) *\{ *x\.t *= *'ci'; *\}\)/.test(S),
  "🔴 el cierre es lo que se LANZA: el vídeo de la misión, los retos de la semana, tu ejemplo y el vídeo de cerrar");
const ap = S.indexOf("x.t='ap'"), ci = S.indexOf("x.t='ci'");
c(ap > 0 && ci > ap, "   y en ese orden (primero la apertura, después el cierre)");
c(/diaTicket\(\)[\s\S]{0,200}x\.t='ap'/.test(S.replace(/\s+/g, " ").replace(/x\.t *= *'ap'/, "x.t='ap'")) || S.indexOf("diaTicket()") < ap,
  "   el ticket de salida (lo que dijeron al salir la semana pasada) se repasa al principio");
c(/ci *= *ci\.concat\(diasMisiones\(s\)\)/.test(S), "   los retos de la semana se lanzan al final, con el cierre");

// 3 · el tramo del medio
c(/medio\.push\(\{k:'genially', t:'pr'/.test(S),
  "🔴 el Genially del grupo es el tramo del medio (la teoría y la práctica guiada), no una diapositiva suelta");
c(/if\(st\.per && !EMBED\)/.test(S), "   y solo se embebe proyectando desde la web: dentro del Genially sería él mismo");
c(/function diaPuente\(/.test(S) && /Ahora, la presentación/.test(S),
  "🔴 dentro del Genially, una tarjeta puente dice en voz alta lo que toca ahora");
c(/reto relámpago/.test(S), "   y recuerda que al volver toca el reto relámpago");

// 4 · el rótulo de los tres tiempos
c(/var TRAMOS=\[\['ap'/.test(S) && /function tramos\(\)/.test(S) && /function marcarTramo\(\)/.test(S),
  "el docente ve en qué tiempo está: apertura · presentación · cierre");
c((S.match(/marcarTramo\(\)/g) || []).length >= 3, "   y se actualiza al pasar de diapositiva");
c(/pointer-events:none/.test(CSS.split(".ses-tramos")[1] || ""), "🔴 es un rótulo, no un menú: no se puede tocar en directo");
c(/\.ses-tramos \.tr\{[^}]*font-size:12px/.test(CSS), "   con letra de 12px, que es el mínimo de la casa");
c(/\.dia\.puente/.test(CSS) && /\.pu-pasos/.test(CSS), "   y la tarjeta puente tiene su estilo");

console.log("\n  Batería 84 · los tres tiempos de la clase");
console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
fallos.forEach(f => console.log("   ✗ " + f));
process.exit(fallos.length ? 1 : 0);
