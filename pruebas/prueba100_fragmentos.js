'use strict';
/**
 * Batería 100 · LOS FRAGMENTOS SE GANAN, Y EL ARCHIVO (20-sep)
 *
 * Norberto: «cuando completen la misión que corresponde a un personaje, además de la insignia, desbloqueen el vídeo,
 * el fragmento de ese personaje… los que no la completan lo tendrán bloqueado, sin poder darle al play… o mejor aún,
 * que aparezca dos semanas más tarde: el del tema 6 aparecería en el tema 7, el último día… y me encantaría añadir una
 * página que fuera el cine, donde van apareciendo todos los vídeos cronológicamente. Es otra forma de coleccionar».
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const leer = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };
const igual = (a, b, txt) => c(JSON.stringify(a) === JSON.stringify(b), txt, "esperaba " + JSON.stringify(b) + " y fue " + JSON.stringify(a));

const REC = leer("assets/js/recluta.js"), SES = leer("assets/js/sesion.js"), CSS = leer("assets/css/stargate.css"), B = leer("_build_site.py");
const H = leer("recluta.html");
const FR = JSON.parse((H.match(/window\.SG_FRAGMENTOS=(\[[\s\S]*?\]);window\./) || [])[1] || "[]");

// ── 1 · los datos salen del calendario y de los retos, no de una lista a mano
c(/def _fragmentos\(\)/.test(B) && /Fragmento\\\\s\*\(\\\\d\+\)/.test(B) === false, "🔴 los fragmentos se derivan en el build (no hay lista escrita a mano)");
c(FR.length >= 9, "los nueve fragmentos llegan a la Nave", FR.length);
c(FR.every(f => f.id && f.titulo && f.personaje && Number(f.sem) > 0 && Number(f.publica) > 0), "cada uno con su vídeo, su personaje, su semana y cuándo se abre para todos");
igual(FR.filter(f => f.reto).map(f => f.reto), ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8"], "🔴 cada fragmento va con el reto que recupera a ese personaje");
const f6 = FR.filter(f => f.n === 6)[0] || {};
c(f6.reto === "A6" && Number(f6.sem) === 10 && Number(f6.publica) === 12,
  "🔴 el del tema 6 (semana 10) se abre para todos al acabar el tema 7 (semana 12)", JSON.stringify(f6));
c(FR.every(f => Number(f.publica) >= Number(f.sem)), "   y ninguno se abre antes de existir");

// ── 2 · en la Nave: bloqueado de verdad, sin play
c(/function fragAbierto\(f\)/.test(REC) && /mios\.indexOf\(f\.reto\)>=0/.test(REC) && /Number\(st\.actual\|\|0\) >= Number\(f\.publica\|\|99\)/.test(REC),
  "🔴 se abre al registrar su reto… o solo, en su semana pública");
c(/function tapaFragmento\(f, cls\)/.test(REC) && /candado\.png/.test(REC) && /\.frag-tapa\{/.test(CSS),
  "🔴 el que no has ganado se tapa (ni carátula ni botón de play)");
c(/var fr=fragDe\(v\.id\), cerrado=fr&&!fragAbierto\(fr\)/.test(REC) && /cerrado \? tapaFragmento\(fr, 'grande'\)/.test(REC),
  "   también en el visor de vídeos de la semana");
c(!/data-cine-play/.test(REC.slice(REC.indexOf("var fr=fragDe(v.id)"), REC.indexOf("var fr=fragDe(v.id)") + 400).split("tapaFragmento")[0]),
  "   y cuando está tapado no se pinta ningún botón de reproducir");

// ── 3 · El Archivo
c(/\['archivo','archivo','El Archivo'\]/.test(REC) && /if\(st\.tab==='archivo'\)  return archivo\(\);/.test(REC), "🔴 la Nave tiene «El Archivo»");
c(/function archivo\(\)/.test(REC) && /La historia, fragmento a fragmento/.test(REC) && /\.ar-grid\{/.test(CSS), "   con todos los vídeos en orden");
c(/de '\+FRAGS\.length\+' fragmentos/.test(REC), "   y el marcador de cuántos fragmentos llevas");
c(/ARCH\.abierto=b\.getAttribute\('data-arch'\)/.test(REC), "   cada vídeo se abre en su tarjeta");
c(/class="ar-v cerrada"/.test(REC) && /Llega en la <b>semana/.test(REC), "   lo de semanas futuras, con candado");

// ── 4 · al completar el reto, el vídeo en la ventana de recompensa
c(/FRAGMENTO DESBLOQUEADO/.test(REC) && /class="logro-video"/.test(REC) && /\.logro-video\{/.test(CSS),
  "🔴 al registrar el reto, el fragmento aparece desbloqueado en la ventana de recompensa");

// ── 5 · en la sesión, dos semanas después
c(/Number\(f\.publica\)===Number\(s\.sem\)/.test(SES) && /El fragmento, ya para todos/.test(SES),
  "🔴 la sesión proyecta cada fragmento en su semana pública, no en la suya");
c(/if\(f && Number\(f\.publica\)!==Number\(s\.sem\)\) return;/.test(SES), "   y no lo enseña antes de tiempo");

console.log("\n  Batería 100 · los fragmentos se ganan, y El Archivo (20-sep)");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
