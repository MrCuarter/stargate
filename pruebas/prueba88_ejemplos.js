'use strict';
/**
 * BATERÍA 88 · UN EJEMPLO EN CADA RETO (17-sep-2026).
 *
 * Norberto: «me encantaría que cada reto fuera acompañado de un ejemplo. A veces puede ser una imagen, una descripción o
 * algo más elaborado. ¿Puedes elaborar un ejemplo de cada reto para que lo tengan de ejemplo?». Vigila que TODOS los retos
 * (menos el secreto) lo tengan, que en los que se responden con una reflexión el ejemplo sea una respuesta que cumple el
 * mínimo que pide la caja, y que la Nave lo enseñe entero (con sus puntos clave y sus saltos de línea).
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
c(retos.length >= 29, "el catálogo trae los retos (sin hitos)", String(retos.length));
retos.forEach(id => {
  const e = D.ej[id];
  if (id === "S7") { c(!e || !e.texto, "🔴 S7 es secreto: sin ejemplo que lo destripe"); return; }
  c(!!e && !!e.titulo && !!(e.texto || e.enlace), "🔴 " + id + " tiene su ejemplo, con título");
});
Object.keys(D.rf).forEach(id => {
  const e = D.ej[id] || {}, min = Number(D.rf[id].min) || 0;
  c(String(e.texto || "").replace(/\s+/g, " ").trim().length >= min, "   " + id + ": la reflexión de ejemplo cumple el mínimo de su caja (" + min + ")", String((e.texto || "").length));
});
["A2", "A3", "B2", "B3"].forEach(id => c(/^https:\/\//.test((D.ej[id] || {}).enlace || ""), "   " + id + " conserva su ejemplo publicado (enlace)"));
c(Object.values(D.ej).every(e => !e.enlace || /^https:\/\/(view\.genially\.com|youtu\.be|edpuzzle\.com)\//.test(e.enlace)),
  "   ningún enlace inventado: solo los ejemplos públicos que ya había");
const N = leer("assets/js/recluta.js"), CSS = leer("assets/css/stargate.css");
c(/<details class="rs-ej-caja"><summary>💡 Ver un ejemplo/.test(N), "🔴 la Nave lo enseña dentro del reto, plegado («💡 Ver un ejemplo»)");
c(/class="rs-ej-det"/.test(N) && /ej\.detalle\.map/.test(N), "   con sus puntos clave");
c(/\.rs-ej-txt\{[^}]*white-space:pre-line/.test(CSS), "   y con sus saltos de línea (en L3 y L6 las líneas SON el ejemplo)");
c(/window\.SG_EJEMPLOS=/.test(leer("recluta.html")), "   y la página lo recibe");

console.log("\n  Batería 88 · un ejemplo en cada reto");
console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
fallos.forEach(f => console.log("   ✗ " + f));
process.exit(fallos.length ? 1 : 0);
