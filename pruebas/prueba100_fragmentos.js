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
// 23-sep · a los personajes los recupera el relámpago de su tema (L1–L8): los A ya no existen
igual(FR.filter(f => f.reto).map(f => f.reto), ["L1", "L2", "L3", "L4", "L5", "L6", "L7", "L8"], "🔴 cada fragmento va con el reto que recupera a ese personaje");
const f6 = FR.filter(f => f.n === 6)[0] || {};
c(f6.reto === "L6" && Number(f6.sem) === 10 && Number(f6.publica) === 12,
  "🔴 el del tema 6 (semana 10) se abre para todos al acabar el tema 7 (semana 12)", JSON.stringify(f6));
c(FR.every(f => Number(f.publica) >= Number(f.sem)), "   y ninguno se abre antes de existir");

// ── 2 · en la Nave: bloqueado de verdad, sin play
// 🔴 23-sep · Norberto: «solo quien lo recupera». Ya no se abre para todos a las dos semanas.
c(/function fragAbierto\(f\)/.test(REC) && /if\(f\.reto\) return mios\.indexOf\(f\.reto\)>=0;/.test(REC),
  "🔴 un fragmento con reto SOLO lo ve quien registra ese reto (nada de «para todos a las dos semanas»)");
// 24-sep · el del final del viaje se abre tras la batalla: cuando el viaje ACABA (estado «fin», también en PUA)
c(/return st\.estado==='fin' \|\| Number\(st\.actual\|\|0\) >= Number\(f\.publica\|\|99\);/.test(REC) && FR.filter(f => !f.reto).length === 1
  && FR.filter(f => !f.reto)[0].publica === 16,
  "   el único que se abre solo es el que no tiene reto: tras la batalla, cuando acaba el viaje (la semana 16)");
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
// 20-sep · y se ven en la web: el visor, no YouTube
c(/data-video="'\+esc\(y\.id\)\+'"/.test(REC) && /window\.SG\.VISOR=\{ abrir: visorAbrir/.test(leer("assets/js/stargate.js")) && /\.sg-visor\{position:fixed/.test(leer("assets/css/stargate.css")),
  "🔴 cada vídeo se abre en el visor de la propia web");
c(!/youtu\.be/.test(leer("assets/js/consola.js")) && /data-video="' \+ esc\(y\.id\)/.test(leer("assets/js/consola.js")),
  "   y «Hoy toca» ya no saca a nadie a YouTube");
c(/class="ar-v cerrada"/.test(REC) && /Llega en la <b>semana/.test(REC), "   lo de semanas futuras, con candado");

// ── 4 · al completar el reto, el vídeo en la ventana de recompensa
c(/FRAGMENTO DESBLOQUEADO/.test(REC) && /class="logro-video"/.test(REC) && /\.logro-video\{/.test(CSS),
  "🔴 al registrar el reto, el fragmento aparece desbloqueado en la ventana de recompensa");

// ── 5 · en la sesión: un fragmento con reto NO se proyecta (sería regalarlo en clase)
c(/FR\.filter\(function\(f\)\{ return !f\.reto && Number\(f\.publica\)===Number\(s\.sem\); \}\)/.test(SES),
  "🔴 la sesión solo proyecta el fragmento sin reto, en el final del viaje");
c(/if\(yaFr\[id\] \|\| \(f && \(f\.reto \|\| Number\(f\.publica\)!==Number\(s\.sem\)\)\)\) return;/.test(SES), "   y ninguno de los que se ganan (ni ninguno dos veces)");

// ── 6 · el material gráfico: su icono, y ninguno con el fondo pegado
c(fs.existsSync(path.join(R, "assets/img/nave/iconos/archivo.png")), "🔴 «El Archivo» tiene su icono en la lámina de la Nave");
c(/iconoTab\(k\)\{ return '<img class="i" src="assets\/img\/nave\/iconos\/'\+k\+'\.png"/.test(REC), "   y la pestaña lo usa como las demás");

// 🔴 stargate.js y tour.js los ESCRIBE el build: editarlos a mano se pierde en la siguiente construcción
["assets/js/stargate.js", "assets/js/tour.js"].forEach(function (f) {
  c(/autogenerado por _build_site\.py/.test(leer(f)), "🔴 " + f + " avisa de que lo genera el build (no se edita a mano)");
});
c(/window\.SG\.VISOR=\{ abrir: visorAbrir/.test(B) && /window\.SG\.foroParrafos = function/.test(B),
  "   y el visor y los párrafos del foro viven en su plantilla (JS_TEMPLATE), no en el fichero generado");

// ── 🔴 24-sep · EL DESENLACE. Norberto: «coincido con tu propuesta» — «La batalla de la Ciudadela Gris», tras la batalla,
// en la Nave, antes del Fragmento Prohibido (y fuera del «privado» de YouTube: oculto, como el resto de la serie)
const TB = JSON.parse((H.match(/window\.SG_TRAS_BATALLA=(\[[\s\S]*?\]);/) || [])[1] || "[]");
const f9 = FR.filter(f => !f.reto)[0] || {};
c(TB.length === 1 && TB[0].id === "7z3cAg-7Kow" && TB[0].desenlace && !TB[0].reto, "🔴 el desenlace viaja con la Nave (SG_TRAS_BATALLA), sin reto", JSON.stringify(TB));
c(TB[0] && TB[0].publica === f9.publica, "   y se abre cuando el Fragmento Prohibido: tras la batalla", (TB[0] || {}).publica + " vs " + f9.publica);
c(!FR.some(f => f.id === "7z3cAg-7Kow"), "   no cuenta como fragmento (el marcador sigue siendo «N de " + FR.length + "»)");
const s15 = (JSON.parse((H.match(/window\.SG_SEMANAS=(\[[\s\S]*?\]);window\./) || [])[1] || "[]").filter(x => x.sem === 15)[0] || {}).videos || [];
const ids15 = s15.map(v => (v[0] || {}).id);
c(ids15.indexOf("7z3cAg-7Kow") >= 0 && ids15.indexOf("7z3cAg-7Kow") === ids15.indexOf(f9.id) - 1, "🔴 en la semana 15, justo antes del Fragmento Prohibido", JSON.stringify(ids15));
c(/var TRAS=\(window\.SG_TRAS_BATALLA\|\|\[\]\)/.test(REC) && /for\(var j=0;j<TRAS\.length;j\+\+\) if\(TRAS\[j\]\.id===id\) return TRAS\[j\]/.test(REC),
  "   la Nave lo cierra con el mismo candado que los fragmentos (El Archivo, el visor y el mapa)");
c(/fr\.desenlace\?'El desenlace'/.test(REC), "   y en El Archivo se llama «El desenlace», no «Fragmento undefined»");
c(/TB\.indexOf\(\(v\[0\]\|\|\{\}\)\.id\)<0/.test(SES) && /la batalla de la Ciudadela Gris<\/b> y, detrás, el último fragmento/.test(SES),
  "🔴 la sesión no lo proyecta, y la última diapositiva dice que se abre en la Nave");
c(/window\.SG_TRAS_BATALLA=/.test(leer("sesion.html")), "   (la sesión recibe la lista para quitarlo)");

console.log("\n  Batería 100 · los fragmentos se ganan, y El Archivo (20-sep)");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
