'use strict';
/**
 * BATERÍA 88 · UN EJEMPLO EN CADA RETO (17-sep-2026).
 *
 * Norberto: «me encantaría que cada reto fuera acompañado de un ejemplo. A veces puede ser una imagen, una descripción o
 * algo más elaborado. ¿Puedes elaborar un ejemplo de cada reto para que lo tengan de ejemplo?». Vigila que TODOS los retos
 * (menos el secreto) lo tengan, que en los que se responden con una reflexión el ejemplo sea una respuesta que cumple el
 * mínimo que pide la caja, y que la Nave lo enseñe entero (con sus puntos clave y sus saltos de línea).
 *
 * 23-sep · con los 20 retos, cada uno tiene su ejemplo nuevo; los tres ejemplos de verdad que dio Norberto se quedan donde
 * encajan: el vídeo en L2 (el mensaje para quien faltó), el Edpuzzle en B2 y las series niveladas en B3 (el itinerario).
 */
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const RAIZ = path.resolve(__dirname, "..");
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
const D = JSON.parse(execFileSync("python3", ["-c",
  "import json,_site_data as D;print(json.dumps({'ej':D.EJEMPLOS_RETOS,'rf':D.REFLEXION_RETOS}))"], { cwd: RAIZ, encoding: "utf8" }));
const CAT = JSON.parse(leer("motor/catalogo.json"));
const ids = new Set();
Object.values((CAT.retos || {})).forEach(l => (l || []).forEach(r => ids.add(r.id)));
const retos = [...ids].filter(id => !/^H\d/.test(id));
c(retos.length === 22, "el catálogo trae los retos (sin hitos): A0, L0–L8, B1–B8, X1, X2, XS y S7", String(retos.length));
retos.forEach(id => {
  const e = D.ej[id];
  if (id === "S7") { c(!e || !e.texto, "🔴 S7 es secreto: sin ejemplo que lo destripe"); return; }
  c(!!e && !!e.titulo && !!(e.texto || e.enlace), "🔴 " + id + " tiene su ejemplo, con título");
});
Object.keys(D.rf).forEach(id => {
  const e = D.ej[id] || {}, min = Number(D.rf[id].min) || 0;
  c(String(e.texto || "").replace(/\s+/g, " ").trim().length >= min, "   " + id + ": la reflexión de ejemplo cumple el mínimo de su caja (" + min + ")", String((e.texto || "").length));
});
["L2", "B2", "B3"].forEach(id => c(/^https:\/\//.test((D.ej[id] || {}).enlace || ""), "   " + id + " conserva su ejemplo publicado (enlace)"));
c(Object.values(D.ej).every(e => !e.enlace || /^https:\/\/(view\.genially\.com|youtu\.be|edpuzzle\.com)\//.test(e.enlace)),
  "   ningún enlace inventado: solo los ejemplos públicos que ya había");
const N = leer("assets/js/recluta.js"), J = leer("assets/js/ejemplo.js"), CE = leer("assets/css/ejemplo.css"), H = leer("ejemplo.html");
// 17-sep (tarde) · Norberto: «si metemos el ejemplo dentro de la ficha del reto, se verá fatal… que cada ejemplo tenga su
// página dedicada y abra una pestaña; estilo más académico; un botón para cerrar la pestaña»
c(/ejPag=ej&&t\[0\]!=='S7'\?'ejemplo\.html\?reto='/.test(N) && /href="'\+ejPag\+'" target="_blank" rel="noopener"/.test(N),
  "🔴 en la Nave, «💡 Ver un ejemplo» abre SU página en otra pestaña");
c(!/rs-ej-caja|ej\.detalle\.map|ejemploVivo/.test(N), "🔴 y el ejemplo ya no se mete dentro de la tarjeta del reto");
const NAVE = (leer("recluta.html").match(/window\.SG_EJEMPLOS=(\{.*?\});window\.SG_ESCAPE_UNI/) || [])[1];
c(!!NAVE && !/"texto"|"imagen"|"vivo"/.test(NAVE) && !/"S7"/.test(NAVE), "   la Nave solo recibe el título de cada ejemplo (y nada de S7)");
const EJ = JSON.parse((H.match(/window\.SG_EJ=(\{.*\});<\/script>/) || [])[1] || "{}");
c(Object.keys(EJ.ejemplos || {}).length >= 21 && !(EJ.ejemplos || {}).S7 && !(EJ.consignas || {}).S7, "🔴 ejemplo.html trae todos los ejemplos, sin S7 (ni su consigna)");
c(Object.keys(EJ.retos || {}).length >= 21 && Object.keys(EJ.consignas || {}).length >= 21 && (EJ.planetas || []).length === 8, "   con el nombre, el tema y la consigna de cada reto");
c(/id="ej-cerrar"/.test(H) && /window\.close\(\)/.test(J) && /ej-cerrar-nota/.test(H), "🔴 con su botón «Cerrar esta pestaña» (y, si el navegador no deja, cómo cerrarla)");
c(/--serif:/.test(CE) && /font:18px\/1\.6 var\(--serif\)/.test(CE) && !/stargate\.css/.test(H), "   estilo académico: serif sobre papel, sin la hoja de estilos de la app");
c(/\.ej-caso\{white-space:pre-line\}/.test(CE), "   con sus saltos de línea (hay ejemplos en los que las líneas SON el ejemplo)");
c(/Figura ' \+ nFig/.test(J) && /Tabla ' \+ nTab/.test(J), "   figuras y tablas numeradas, con su pie");
c(/indice\(\)/.test(J) && /id !== "S7"/.test(J), "   sin reto (o con S7) enseña el índice de todos");

// imágenes (Magnific) y ejemplos «vivos» (Norberto: «igual algún ejemplo se muestra mejor con HTML»)
const conImg = Object.keys(D.ej).filter(id => D.ej[id].imagen), conVivo = Object.keys(D.ej).filter(id => D.ej[id].vivo);
c(conImg.length >= 10, "🔴 los ejemplos con captura llevan su imagen", conImg.join(","));
// «Hay algunos que ya te di ejemplo antes, usa esos cuando sea posible»: L2, B2 y B3, arriba e incrustados
["L2", "B2", "B3"].forEach(id => {
  const e = D.ej[id] || {};
  c(!!(e.real && e.real.titulo && e.enlace), "🔴 " + id + ": su ejemplo de verdad (el que dio Norberto) va primero en su página", e.enlace);
  c(!/Abajo tienes/.test(e.texto || ""), "   " + id + ": y el caso ya no remite «abajo» a él");
});
c(!D.ej.B3.imagen, "   B3 sin captura inventada: manda su Genially de verdad");
c(/youtube-nocookie\.com\/embed\//.test(J) && /view\.genially\.com\//.test(J) && /edpuzzle\.com\/embed\/media\//.test(J) && /if \(conReal\) html \+= real\(e, enlace\)/.test(J),
  "   se incrustan (YouTube, Genially, Edpuzzle) antes del caso");
conImg.forEach(id => {
  const e = D.ej[id], f = path.join(RAIZ, "assets/img/ejemplos", e.imagen);
  c(fs.existsSync(f), "   " + id + ": su imagen existe (" + e.imagen + ")");
  c(fs.existsSync(f) && fs.statSync(f).size < 260 * 1024, "   " + id + ": y pesa poco (< 260 KB)", fs.existsSync(f) ? Math.round(fs.statSync(f).size / 1024) + " KB" : "");
  c(String(e.imagen_alt || "").length > 30, "   " + id + ": con su pie (texto alternativo)");
});
c(conVivo.length >= 3, "🔴 lo que se lee mejor escrito va en HTML (tablas, autoevaluación, rúbrica)", conVivo.join(","));
conVivo.forEach(id => (D.ej[id].vivo || []).forEach((b, i) => {
  const n = "   " + id + " · bloque " + (i + 1) + " (" + b.tipo + ")";
  if (b.tipo === "tabla") c(Array.isArray(b.cab) && b.filas.length && b.filas.every(f => f.length === b.cab.length), n + ": cada fila con tantas casillas como columnas");
  else if (b.tipo === "quiz") c(b.preguntas.length && b.preguntas.every(q => q.abierta ? !!q.explica : (q.opciones || [])[q.bien] !== undefined && !!q.explica), n + ": cada pregunta con su respuesta buena y su explicación");
  else if (b.tipo === "linea") c(b.marcas.length && b.marcas.every(m => /^\d+:\d\d$/.test(m.t) && (m.opciones || [])[m.bien] !== undefined), n + ": cada marca con su minuto y su respuesta buena");
  else c(false, n + ": tipo desconocido");
}));
c(!D.ej.S7 || (!D.ej.S7.imagen && !D.ej.S7.vivo), "   S7 sigue sin nada que lo destripe");
c(/\.ej-ancha tbody th,\.ej-ancha thead th:first-child\{position:sticky/.test(CE) && /\.ej-scroll\{overflow-x:auto/.test(CE), "   las tablas anchas se desplazan dentro de su caja, con la primera columna fija (móvil)");
c(!/<select/.test(J), "   y sin desplegables grises: solo botones");

console.log("\n  Batería 88 · un ejemplo en cada reto");
console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
fallos.forEach(f => console.log("   ✗ " + f));
process.exit(fallos.length ? 1 : 0);
