'use strict';
/**
 * BATERÍA 90 · 🌐 SORTEOS Y OFERTAS PARA VARIOS GRUPOS (17-sep-2026).
 *
 * Norberto: «podrías añadir una opción para marcar a qué grupos afecta esa recompensa o cuáles pueden reclamar (con
 * opción de TODOS). Lo mismo con ofertas y sorteos. Comparten todos la misma página de configuración, pero puedo ajustar
 * individualmente a qué grupos afecta. Sería interesante separar las opciones exclusivas de un grupo de las que afectan a
 * todos». Y de paso: «no queremos menús grises en ningún sitio» (el «Qué se vende» de las ofertas, con sus apartados).
 */
const fs = require("fs"), path = require("path");
const RAIZ = path.resolve(__dirname, "..");
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
const K = leer("assets/js/consola.js"), M = leer("assets/js/motor.js"), T = leer("motor/tablero.js"), SG = leer("assets/js/stargate.js"), CSS = leer("assets/css/stargate.css");

// 1 · sorteos
c(/async function sorteosDeGrupos\(perIds\)/.test(M) && /k = x\.stargateId \|\| d\.id\.split\("__"\)\.pop\(\)/.test(M), "🔴 un sorteo es el MISMO en todos sus grupos (mismo identificador): cada grupo, su bombo");
c(/async function sorteoEnGrupos\(s, destinos\)/.test(M) && /if \(t && !t\.stargateRetirado\) await guardarSorteo\(per, t\.docId, s\);/.test(M) && /else await crearSorteo\(per, s\);/.test(M),
  "🔴 crear o cambiar en los grupos elegidos (donde ya está se cambia; en los demás se crea)");
c(/hechos\.push\(per\); continue;/.test(M), "   donde ya se sorteó no se toca");
c(/async function retirarSorteo\(per, ticketDoc\)/.test(M) && /if \(n > 0\) throw new Error/.test(M) && /stargateRetirado: true/.test(M),
  "🔴 quitarlo de un grupo solo si allí nadie tiene participaciones (queda «retirado»)");
c(/!r\.stargateRetirado/.test(T), "   y un sorteo retirado no existe para el alumnado (tablero)");
c(/function cablearFormSorteo\(caja, id, despues\)/.test(K) && /var destinos = nuevo \? gruposElegidos\(f\) : await gruposConSorteo\(sid\);/.test(K),
  "🔴 al crearlo se eligen los grupos; al cambiarlo, se cambia en todos los suyos");
c(/function pintarAmbitoSorteo\(el, s, despues\)/.test(K) && /MOTOR\.retirarSorteo\(per, t\.docId\)/.test(K), "   y en cada sorteo, sus grupos: marcar lo lleva, desmarcar lo quita (preguntando)");
c(/async function verSorteosComunes\(destino\)/.test(K) && /entra en el grupo → Sorteos/.test(K), "🔴 «🌐 Para todos tus grupos» → Sorteos (el bombo y el directo, dentro de cada grupo)");
// 2 · ofertas
c(/async function crearOfertaEnGrupos\(datos, destinos\)/.test(M) && /updateDoc\(doc\(db, "rewards", r\.oferta\), \{ stargateComun: comun \}\)/.test(M),
  "🔴 una oferta para varios grupos: la crea el servidor en cada uno (con SUS inscritos) y quedan atadas");
c(/async function ofertaEnGrupos\(docs, accion, datos\)/.test(M) && /function hermanasDe\(docId, comun, per\)/.test(K),
  "🔴 lo que se hace con una (alargar, unidades, cancelar) se hace en todas");
c(/function formOferta\(R, sel\)/.test(K) && /selectorGrupos\("of-g-nuevo", sel\)/.test(K), "   su formulario lleva «¿Para qué grupos?»");
c(/async function verOfertasComunes\(destino\)/.test(K) && /La oferta automática de cada semana se enciende o apaga dentro de cada grupo/.test(K),
  "🔴 «🌐 Para todos tus grupos» → Ofertas (la automática semanal sigue siendo de cada grupo)");
c(/\(solo en este grupo\)/.test(K) && /varios\.png alt> varios grupos/.test(K), "   y dentro de un grupo se distingue qué es solo suyo y qué es de varios");
c(/"Oferta creada: ya está en el Mercado de tu alumnado\."/.test(K) && /"Oferta alargada\."/.test(K) && /"✕ Oferta cancelada\."/.test(K), "   (con los mismos avisos de siempre)");
// 3 · la página común y la separación
c(/\[\["premios", "huevos", "Premios por enlace"\], \["sorteos", "sorteos", "Sorteos"\], \["ofertas", "ofertas", "Ofertas"\]\]/.test(K), "🔴 la página común tiene sus tres pestañas");
c(/consola\.html\?comun=sorteos/.test(K) && /consola\.html\?comun=ofertas/.test(K), "   y la portada lleva a las tres");
c(/function selectorGrupos\(nombre, sel\)/.test(K) && /varios\.png alt> Todos tus grupos \(/.test(K), "   un solo «¿Para qué grupos?» para sorteos y ofertas");
// 4 · los desplegables con apartados
c(/n\.tagName === "OPTGROUP"/.test(SG) && /\.sgsel-g\{/.test(CSS), "🔴 los desplegables de la casa respetan los apartados («Sobres y cápsulas», «Un héroe concreto»…)");

console.log("\n  Batería 90 · sorteos y ofertas para varios grupos");
console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
fallos.forEach(f => console.log("   ✗ " + f));
process.exit(fallos.length ? 1 : 0);
