'use strict';
/**
 * BATERÍA 72 · LA NAVE POR CAPÍTULOS, UN SOLO CALENDARIO.
 *
 * 🔴 13-sep · Norberto: «de primeras no quiero que puedan hacer mil cosas; que se desbloquearan las
 * opciones cada semana… y en la sesión que proyecta el docente, una diapositiva sobre ese desbloqueo
 * y la demo del estudiante para interactuar». El calendario vive en `_site_data.py → CAPITULOS`, pero
 * la semana en que el Mercado VENDE cada cosa la pone el catálogo del motor (`apps-script/Datos.gs`)
 * y en PUA la calcula `motor/paquete.js`. Tres sitios que tienen que decir lo mismo: si un día se
 * mueve el héroe a otra semana en uno y no en los otros, NEBULA contaría los héroes una semana y el
 * Mercado los vendería otra. Aquí se vigila.
 *
 * Y la Nave del Comandante (el simulacro) no puede escribir NADA: se comprueba que su código no
 * tiene ni una llamada que escriba.
 */
const fs = require("fs"), path = require("path"), vm = require("vm"), { execFileSync } = require("child_process");
const RAIZ = path.resolve(__dirname, "..");
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");

// 1 · los capítulos, tal como los ve la web
const CAPS = JSON.parse(execFileSync("python3", ["-c",
  "import json,sys; sys.path.insert(0,'.'); import _site_data as d; print(json.dumps(d.CAPITULOS, ensure_ascii=False))"],
  { cwd: RAIZ, encoding: "utf8" }));
c(CAPS.length >= 5, "hay capítulos", String(CAPS.length));
c(CAPS[0].semana === 1 && CAPS[0].abre.indexOf("nave") >= 0, "el capítulo 1 abre la Nave en la semana 1");

// 2 · el catálogo del motor (Datos.gs → motor/catalogo.json) vende cada cosa en la semana de su capítulo
const cat = JSON.parse(leer("motor/catalogo.json"));
CAPS.forEach(ca => (ca.mercado || []).forEach(tipo => {
  cat.recompensas.filter(r => r.tipo === tipo).forEach(r =>
    c(r.desdeSemana === ca.semana, "🔴 «" + r.nombre + "» se vende en la semana de su capítulo (" + ca.titulo + ")",
      "catálogo: semana " + r.desdeSemana + " · capítulo: semana " + ca.semana));
}));
// y nada del Mercado queda sin capítulo que lo presente
cat.recompensas.forEach(r => c(CAPS.some(ca => (ca.mercado || []).indexOf(r.tipo) >= 0),
  "«" + r.nombre + "» tiene un capítulo que lo cuenta", r.tipo));

// 2b · 14-sep · el Gran Sorteo: se vende desde la semana de su capítulo (y en PUA, también)
const capSorteo = CAPS.filter(ca => (ca.mercado || []).indexOf("sorteo") >= 0)[0];
c(!!capSorteo && (cat.sorteos || []).length > 0, "hay un capítulo que presenta el sorteo, y un sorteo en el catálogo");
(cat.sorteos || []).forEach(s => c(capSorteo && s.desdeSemana === capSorteo.semana, "🔴 el sorteo «" + s.premio + "» se vende desde la semana de su capítulo",
  "catálogo: " + s.desdeSemana + " · capítulo: " + (capSorteo && capSorteo.semana)));
// 3 · en PUA, la misma regla en la web (semana_capitulo) y en el motor (semanaTienda)
const caja = { window: {} }; caja.self = caja.window; vm.createContext(caja);
vm.runInContext(leer("motor/paquete.js"), caja);
const P = caja.window.SG && caja.window.SG.PAQUETE || caja.module && caja.module.exports;
const semanaTienda = P && P.semanaTienda;
c(typeof semanaTienda === "function", "motor/paquete.js expone semanaTienda");
// (solo los capítulos que abren algo en la tienda y que EXISTEN en PUA: el Sorteo, el Hangar y el Zoco no están
//  en un PUA desde el 16-sep, y «Los logros de a bordo» no vende nada)
if (semanaTienda) CAPS.filter(ca => (ca.mercado || []).length && ca.semanas.PUA != null).forEach(ca =>
  c(semanaTienda(ca.semana, "PUA", cat) === ca.semanas.PUA, "🔴 PUA · el capítulo «" + ca.titulo + "» y la tienda caen la misma semana",
    "tienda " + semanaTienda(ca.semana, "PUA", cat) + " · capítulo " + ca.semanas.PUA));

// 4 · la Nave tiene los pasos de NEBULA de cada capítulo que existe, y la sesión lee el mismo calendario
const R = leer("assets/js/recluta.js");
CAPS.filter(ca => ca.listo !== false && ca.clave !== "c1").forEach(ca =>
  c(new RegExp("\\b" + ca.clave + ":(\\[\\{t:|function\\s*\\()").test(R), "NEBULA tiene pasos para el capítulo «" + ca.titulo + "»"));
c(/SG_CAPITULOS/.test(leer("assets/js/sesion.js")) && /diapositivasNuevas/.test(leer("assets/js/sesion.js")),
  "la sesión proyectable lee el mismo calendario (y pone «Lo nuevo» y «Enséñalo»)");
["recluta.html", "sesion.html", "consola.html"].forEach(f =>
  c(/window\.SG_CAPITULOS=\[/.test(leer(f)), f + " lleva el calendario de capítulos"));

// 5 · la Nave del Comandante no escribe nada
const F = leer("assets/js/fuente.js");
const sim = F.slice(F.indexOf("function simulacro()"), F.indexOf("window.SG.FUENTE = q.get(\"simulacro\")"));
c(sim.length > 1000, "el simulacro existe en fuente.js");
["updateDoc", "setDoc", "addDoc", "deleteDoc", "writeBatch", "llamar(", "runTransaction"].forEach(w =>
  c(sim.indexOf(w) < 0, "🔴 el simulacro no escribe en la base de datos (no usa «" + w + "»)"));
c(/if\(SIMULACRO\) return;\s*\/\/ la llamada del simulacro/.test(R), "el simulacro no escucha la llamada a filas de verdad");
c(/function marcarCap\(c, estado\)\{\s*if\(SIMULACRO\) return;/.test(R), "el simulacro no apunta capítulos en ninguna ficha");

module.exports = { nombre: "La Nave por capítulos, un solo calendario", ok, fallos };
if (require.main === module) {
  console.log("\n  Batería 72 · la Nave por capítulos, un solo calendario");
  console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
  fallos.forEach(f => console.log("   ✗ " + f));
  process.exit(fallos.length ? 1 : 0);
}
