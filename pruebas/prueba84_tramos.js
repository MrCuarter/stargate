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
c(/if\(st\.per && \(!EMBED \|\| VENTANA\)\)/.test(S), "   y solo se embebe proyectando desde la web o en su ventana: dentro del Genially sería él mismo");
c(/function diaPuente\(/.test(S) && /Ahora, el despegue/.test(S),
  "🔴 dentro del Genially, una tarjeta puente dice en voz alta lo que toca ahora");
c(/reto relámpago/.test(S), "   y recuerda que al volver toca el reto relámpago");

// 4 · el rótulo de los tres tiempos
c(/var TRAMOS=\[\['ap'/.test(S) && /function tramos\(\)/.test(S) && /function marcarTramo\(\)/.test(S),
  "el docente ve en qué tiempo está: apertura · presentación · cierre");
c((S.match(/marcarTramo\(\)/g) || []).length >= 3, "   y se actualiza al pasar de diapositiva");
// 17-sep · y se pulsa (Norberto: «sería fantástico hacer clic e ir directamente a esas sesiones»)
c(/<button type="button" class="tr'/.test(S) && /function irATramo\(t\)/.test(S) && /irATramo\(b\.getAttribute\('data-t'\)\)/.test(S),
  "🔴 cada tiempo es un botón que lleva a su primera diapositiva");
c(/' disabled title="Este tiempo va en tu Genially"'/.test(S), "   el que va en el Genially no se pulsa");
c(/\.ses-tramos \.tr\{[^}]*pointer-events:auto;cursor:pointer/.test(CSS), "   (la caja deja pasar el clic; solo los botones lo recogen)");
c(/\.ses-tramos \.tr\{[^}]*font-size:12px/.test(CSS), "   con letra de 12px, que es el mínimo de la casa");
c(/\.dia\.puente/.test(CSS) && /\.pu-pasos/.test(CSS), "   y la tarjeta puente tiene su estilo");

// 5 · la revisión de la sesión semana a semana (16-sep · Norberto: «revisa la sesión de la semana, que funcione todo»).
//     Barrido en el laboratorio: las 16 semanas REGULAR y las 9 PUA, cada diapositiva, sin errores ni imágenes rotas.
c(/var semResuelve=function\(v\)/.test(S) && /return r \? r===sem :/.test(S),
  "🔴 una votación resuelta sale SOLO en la semana en que se resuelve (antes salía en todas las siguientes)");
c(/return desde\|\|semResuelve\(v\) \? \(sem>=desde && sem<=hasta\)/.test(S), "   y la abierta, desde que se publica hasta que se resuelve");
c(/st\.semHoy=hoy&&hoy>0\?hoy:1;/.test(S), "   (la sesión sabe qué semana es hoy aunque se proyecte otra)");
c(/function precargarTickets\(\)/.test(S) && /no\(new Error\('tarda demasiado'\)\); \}, 12000\)/.test(S),
  "🔴 el ticket de salida se pide al abrir la sesión y no se queda en «Leyendo…»: 12 s como mucho, y si no, lo dice");
c(/function cronoRelampago\(min\)/.test(S) && /montar:rel\?montarCrono:null/.test(S) && /\(\\d\+\)\\s\*min/.test(S),
  "🔴 la diapositiva de un relámpago lleva su cronómetro, con los minutos del calendario");
c(/e\.stopPropagation\(\);/.test(S.split("function montarCrono")[1] || ""), "   y pulsar sus botones no pasa de diapositiva");
c(/\.rel-crono\.fin \.rc-reloj/.test(CSS) && /prefers-reduced-motion:reduce\)\{\.rel-crono\.fin/.test(CSS), "   (con aviso al acabar, y sin parpadeo para quien no quiere movimiento)");
c(/else if\(st\.i===0\) pintar\(\);/.test(S), "🔴 si las reflexiones o las votaciones llegan tarde, se suman al mazo mientras se está en la portada");

// 6 · la sesión, a pantalla completa y en su propia ventana (17-sep · Norberto: «un botón para que se abra la sesión en una
//     ventana dedicada, sin barra de navegación… y el botón o icono de pantalla completa dentro de la presentación»)
c(/function controles\(\)/.test(S) && /\+controles\(\)/.test(S) && /id="ses-pantalla"/.test(S), "🔴 dentro de la presentación, el botón de pantalla completa");
c(/e\.key==='f'\|\|e\.key==='F'/.test(S), "   también con la tecla F");
c(/document\.body\.classList\.add\('proyectando'\)/.test(S) && /body\.proyectando #mazo\{position:fixed;inset:0/.test(CSS),
  "   y si el navegador no la deja (un Genially que no la permite), el mazo ocupa todo lo que tiene");
c(/addEventListener\('fullscreenchange', marcarPantalla\)/.test(S), "   el icono cambia a «salir» mientras está a pantalla completa");
c(/function abrirEnVentana\(\)/.test(S) && /u\.searchParams\.set\('ventana','1'\)/.test(S) && /'popup=yes,width='/.test(S),
  "🔴 y el de abrirla en una ventana aparte, sin la web alrededor");
c(/\(!EMBED\?'<button type="button" class="ses-ic" data-ses-ventana/.test(S) && /data-ses-ventana title="Sin la web alrededor/.test(S),
  "   en la presentación y junto a «Proyectar la sesión» (dentro de un Genially no sale)");
c(/var VENTANA = EMBED && q\.get\('ventana'\) === '1'/.test(S) && /if\(st\.per && \(!EMBED \|\| VENTANA\)\)/.test(S),
  "🔴 en su ventana va el Genially del grupo en medio (no está dentro de un Genially: no hace falta la tarjeta puente)");
c(/'sg_sesion_'\+String\(st\.per/.test(S), "   y pulsar dos veces no abre dos (el mismo nombre que el ⧉ de la consola)");

console.log("\n  Batería 84 · los tres tiempos de la clase");
console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
fallos.forEach(f => console.log("   ✗ " + f));
process.exit(fallos.length ? 1 : 0);
