'use strict';
/**
 * Batería 102 · EL ONBOARDING, CONTRA LA WEB DE HOY (20-sep)
 *
 * 🔴 POR QUÉ EXISTE. La visita guiada del Capitán señalaba `.cn-hero`: una clase que dejó de existir cuando se rehízo
 * la Nave del Comandante. Nadie se enteró, porque un objetivo que no está no da error — la visita simplemente señala
 * al vacío. Y arrastraba algo peor: la comprobación de «¿eres referente?» cuelga del paso 1, así que sin objetivo un
 * referente NUNCA veía sus dos pasos.
 *
 * Aquí se vigila lo único que hace útil a un guía: que todo lo que señala EXISTA, y que lo que cuenta sea lo que hay.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };

const TOUR = L("assets/js/tour.js"), CONSOLA = L("assets/js/consola.js"), REC = L("assets/js/recluta.js");
// 🔴 Lo que se mira es LO QUE SE LEE EN PANTALLA, no el fichero: un comentario que cuenta por qué se quitó
// «la llamada a filas» no es la visita hablando de la llamada a filas. Aquí van solo los títulos y los textos.
const DICE = (TOUR.match(/[tx]:'(?:\\'|[^'])*'/g) || []).join(" | ");

// ── 1 · la visita del Capitán: todo lo que señala tiene que existir
const pasos = [];
TOUR.replace(/\{p:'([a-z]+\.html)',sel:'([^']*)'([^}]*)\}/g, function (_, pag, sel, resto) {
  pasos.push({ pag: pag, sel: sel, si: /\bsi:1/.test(resto), rol: /\brol:1/.test(resto), t: (resto.match(/t:'([^']+)'/) || [, ""])[1] });
  return _;
});
c(pasos.length >= 14, "la visita guiada tiene sus paradas", pasos.length);

/** ¿La consola pinta este selector? Se busca la clase o el id tal cual en el guion que lo escribe. */
function estaEnLaConsola(sel) {
  return sel.replace(/^[.#]/, "").split(/[.#\[:]/)[0].split(" ").filter(Boolean).every(function (k) {
    return CONSOLA.indexOf(k) >= 0 || TOUR.indexOf('"' + k + '"') >= 0 || L("assets/js/stargate.js").indexOf(k) >= 0;
  });
}
const perdidos = [];
pasos.forEach(function (s) {
  if (!s.sel) return;
  let hay;
  if (s.pag === "consola.html") hay = estaEnLaConsola(s.sel);
  else { const h = L(s.pag); hay = h.indexOf('id="' + s.sel.replace("#", "") + '"') >= 0; }
  if (!hay) perdidos.push(s.t + " → " + s.sel + " (" + s.pag + ")");
});
c(!perdidos.length, "🔴 ningún paso señala al vacío: todos sus objetivos existen", perdidos.join(" · "));

// el paso que decide si eres referente NO puede saltarse ni depender de un grupo: si se queda sin
// objetivo, la visita da por hecho que no eres referente y se come sus dos pasos
const rol = pasos.filter(function (s) { return s.rol; });
c(rol.length === 1, "🔴 solo un paso decide si eres referente", rol.length);
c(rol.length === 1 && !rol[0].si, "🔴 y ese paso no se salta nunca (si no, un referente no ve su parte)");
c(rol.length === 1 && rol[0].sel === ".cn-ficha", "   señala tu ficha, que está en la Nave hasta sin grupos", rol.length ? rol[0].sel : "");

// ── 2 · y lo que cuenta es lo que hay
[["llamada a filas", "las herramientas de clase ya no la llevan"],
 ["Mi gente", "hoy se llama «Reclutas»"],
 ["tus notas", "se borraron el 20-sep"],
 ["tres pasos de la clase", "hoy solo queda «Empezar la clase»"]].forEach(function (x) {
  c(DICE.indexOf(x[0]) < 0, "la visita ya no habla de «" + x[0] + "»: " + x[1]);
});
[["Empezar la clase", "el botón de cada semana"], ["Reclutas", "la sección del alumnado"], ["Contacto", "la última sección"],
 ["tickets de salida|Tickets de salida", "la caja de los tickets"], ["fijes", "fijar y ocultar comentarios"],
 ["sello", "la carta del foro firmada"], ["El Archivo", "los fragmentos que se coleccionan"],
 ["en gris", "los retos que aún no se han desbloqueado"]].forEach(function (x) {
  c(new RegExp(x[0]).test(DICE), "   y sí de " + x[1]);
});

// ── 3 · la bienvenida de NEBULA cuenta las pestañas que esa persona VE
c(REC.indexOf("'Cinco sitios") < 0, "🔴 NEBULA ya no dice «Cinco sitios» a pelo (con El Archivo son seis, y con el Zoco, siete)");
c(/function pasoTabs\(\)/.test(REC), "   el paso de las pestañas se arma al momento");
c(/tabsVisibles\(\)\.map[\s\S]{0,140}TAB_QUE_ES/.test(REC), "   y lo arma con las pestañas visibles, no con una lista a mano");
const tabs = (REC.match(/var TABS=\[([\s\S]*?)\];/) || [, ""])[1].match(/\['([a-z]+)'/g).map(function (x) { return x.slice(2, -1); });
const dicc = (REC.match(/var TAB_QUE_ES=\{([\s\S]*?)\};/) || [, ""])[1];
const sinFrase = tabs.filter(function (k) { return k !== "envivo" && dicc.indexOf(k + ":") < 0; });
c(!sinFrase.length, "🔴 cada pestaña de la Nave tiene su frase (si se añade una, se nota aquí)", sinFrase.join(", "));
c(dicc.indexOf("archivo:") >= 0 && /El Archivo<\/b>, la historia en v[ií]deo/.test(REC), "   incluida «El Archivo»");
c(/Los <b>fragmentos<\/b> de cada tripulante, no: esos se ganan/.test(REC), "🔴 y NEBULA explica que los fragmentos se ganan");
c(/pasos:pasosNave/.test(REC) && /typeof A\.pasos==='function'/.test(REC), "   la bienvenida entera se arma al empezar, no al cargar la página");

console.log("\n  Batería 102 · el onboarding contra la web de hoy (20-sep)");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
