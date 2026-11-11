'use strict';
/**
 * BATERÍA 155 · LA LECCIÓN: EL BLOQUE CENTRAL SIN GENIALLY (11-nov)
 *
 * Norberto: «Quiero hacer COMPLETAS las presentaciones… La parte central es Genially. Me gustaría poder prescindir de Genially
 * y hacerlo todo dentro de nuestra plataforma» y «de momento SOLO a mis grupos, así lo pruebo tranquilamente». Primera lección:
 * el Tema 3 entero, en dos partes (semanas 5 y 6). Aquí: el dato (SG_LECCIONES), quién la ve (SG_LECCION_AULAS, por PER y
 * Comandante: en PER 16450 está también Caridad), que sustituye al Genially del despegue solo donde toca y que la matriz de
 * ejemplo es la MISMA de la sesión de la Actividad 2 (un dato, un sitio).
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };
const global = (html, nombre) => { const m = html.match(new RegExp("window\\." + nombre + "=([\\s\\S]*?);window\\.")); return m ? vm.runInNewContext("(" + m[1] + ")") : null; };

const SESH = L("sesion.html"), SES = L("assets/js/sesion.js"), CSS = L("assets/css/stargate.css");
const LEC = global(SESH, "SG_LECCIONES") || {}, AULAS = global(SESH, "SG_LECCION_AULAS") || [], ACT = global(SESH, "SG_SES_ACT") || {};
const MZ = global(SESH, "SG_MATRIZ") || {};
const TIPOS = ["tarjetas", "piezas", "matriz", "ejemplos", "manos", "ia", "lista"];

console.log("  El dato");
c(LEC["5"] && LEC["6"], "hay lección en las semanas 5 y 6 (el Tema 3, en dos partes)", Object.keys(LEC));
c(LEC["5"] && LEC["5"].tema === 3 && LEC["6"].tema === 3, "   las dos, del Tema 3");
Object.keys(LEC).forEach(k => {
  const D = LEC[k].dias || [];
  c(D.length >= 4 && D.every(d => TIPOS.indexOf(d.tipo) >= 0 && d.titulo && d.rot), "semana " + k + ": " + D.length + " diapositivas, todas con tipo conocido, título y nombre", D.map(d => d.tipo));
  const rots = D.map(d => d.rot); c(new Set(rots).size === rots.length, "   semana " + k + ": nombres distintos en la barra", rots);
  D.filter(d => d.tipo === "ejemplos").forEach(d => c(d.ejemplos.every(e => e[3] === "MATRIZ" || /^https:\/\/(view\.genially\.com|deck\.toys)\//.test(e[3])),
    "   semana " + k + ": los ejemplos, enlaces https a Genially (o Deck.toys, aparte)", d.ejemplos.map(e => e[3])));
});
const S6 = (LEC["6"] || {}).dias || [];
const man = S6.filter(d => d.tipo === "manos")[0] || {};
c(man.minutos > 0 && (man.pasos || []).length >= 5 && /imagen interactiva/i.test(JSON.stringify(man.pasos)), "semana 6: manos a la obra con cronómetro y la imagen interactiva desde cero", man.minutos);
const lista = (S6.filter(d => d.tipo === "lista")[0] || {}).items || [];
c(["imagen interactiva", "6 actividades", "público", "Bitácora"].every(w => JSON.stringify(lista).indexOf(w) >= 0), "   la lista de «¿está listo?» pide lo del enunciado de la Actividad 2");

console.log("  La matriz es la de la Actividad 2 (un dato, un sitio)");
const mz = S6.filter(d => d.tipo === "matriz")[0] || {};
const EJ = ((ACT[mz.ejemplo] || {}).ejemplo) || {};
c(mz.ejemplo === "a2" && !mz.actividades, "la lección no trae su propia matriz: apunta a la de la sesión de la Actividad 2");
c((EJ.cruces || []).length >= 6, "   el ejemplo tiene al menos 6 cruces", (EJ.cruces || []).length);
c((EJ.cruces || []).every(x => (MZ.inteligencias || []).indexOf(x[2]) >= 0 && (MZ.bloom || []).indexOf(x[1]) >= 0 && /^(obligatoria|optativa|voluntaria)$/.test(x[3])),
  "   cada cruce cae en una casilla de verdad (inteligencia × Bloom) y tiene su tipo");
c(/SG_SES_ACT\|\|\{\}\)\[d\.ejemplo\]/.test(SES), "   sesion.js la lee de SG_SES_ACT");
c(/\.lc-mz-c\.t-obligatoria[^{]*\{background:rgba\(95,207,122/.test(CSS) && /\.ac-mc\.obligatoria[^{]*\{background:#5fcf7a/.test(CSS), "   y con los mismos colores (verde, azul, amarillo)");

console.log("  Quién la ve (de estreno, solo el aula de Norberto)");
c(JSON.stringify(AULAS) === JSON.stringify([["per-16450", "Norberto Cuartero"], ["demo-stargate", null]]), "solo PER 16450 con su Comandante «Norberto Cuartero», y la demo", JSON.stringify(AULAS));
// se ejecuta leccionDe tal cual, con un `st` y una URL de mentira
const fn = (SES.match(/function leccionDe\(s\)\{[\s\S]*?\n  \}/) || [""])[0];
c(!!fn, "sesion.js tiene leccionDe");
const ve = (st, q, sem) => { const ctx = { window: { SG_LECCIONES: LEC, SG_LECCION_AULAS: AULAS }, location: { search: q || "" }, st: st }; vm.runInNewContext(fn + ";r=leccionDe({sem:" + (sem || 6) + "})", ctx); return !!ctx.r; };
c(ve({ per: "per-16450", miNombre: "Norberto Cuartero" }), "   Norberto, proyectando en su grupo: sí");
c(!ve({ per: "per-16450", miNombre: "Caridad" }), "   Caridad, en el mismo PER: no (sigue con su Genially)");
c(ve({ per: "per-16450", alumno: true, profeMio: "Norberto Cuartero" }), "   un recluta de Norberto (en directo o en diferido): sí");
c(!ve({ per: "per-16450", alumno: true, profeMio: "Caridad" }), "   un recluta de Caridad: no");
c(!ve({ per: "per-99999", miNombre: "Norberto Cuartero" }), "   Norberto en otro grupo: no");
c(ve({ per: "demo-stargate", miNombre: "" }), "   la demo: sí");
c(!ve({ per: "per-16450", miNombre: "Norberto Cuartero", tipo: "PUA" }), "   un grupo PUA: no (la lección va por semanas del regular)");
c(ve({ per: "per-99999", miNombre: "X" }, "?leccion=1"), "   ?leccion=1 la enseña en cualquier grupo");
c(!ve({ per: "per-16450", miNombre: "Norberto Cuartero" }, "?leccion=0"), "   ?leccion=0 la quita");
c(!ve({ per: "per-16450", miNombre: "Norberto Cuartero" }, "", 7), "   una semana sin lección (la 7): su Genially, como siempre");

console.log("  En la sesión");
c(/var lec=leccionDe\(s\);\n    if\(lec\) medio=diasLeccion\(s, lec\);\n    else \{\n      var panel=panelDelMazo/.test(SES), "la lección va en el despegue en lugar del Genially; sin lección, el panel de siempre");
c(/k:'lc-'\+\(i\+1\), sec:'despegue', t:'pr'/.test(SES), "   cada diapositiva con su clave (notas propias) y en la sección «despegue» (la rueda la apaga y la mueve)");
c(/G\[sl\.k\]\|\|sl\.guion\)/.test(SES) && S6.every(d => (d.notas || []).length), "   las notas del presentador de la semana 6, por defecto en cada diapositiva");
c(/class="dia leccion lct-'\+esc\(d\.tipo\)/.test(SES), "   la clase del tipo lleva prefijo propio (lct-): «lc-tarjetas» en la diapositiva la volvía rejilla");
c(/function montarVisor[\s\S]*removeEventListener\('keydown', tecla, true\)/.test(SES), "   el visor de ejemplos se cierra con Esc y suelta el teclado al salir");
c(/cronoRelampago\(Number\(d\.minutos\)\|\|20\)/.test(SES) && /montar:montarCrono, html: abre/.test(SES), "   manos a la obra usa el cronómetro del relámpago");

console.log("  Que se vea en cualquier pantalla");
c(/\.lc-tarjetas\{display:grid;grid-template-columns:repeat\(var\(--n,3\),minmax\(0,1fr\)\)/.test(CSS), "tarjetas iguales en rejilla (minmax(0,1fr))");
c(/@media \(max-width:900px\),\(max-height:560px\)\{ \.dia\.leccion\{overflow-y:auto/.test(CSS), "   en pantallas pequeñas o bajas, se desliza dentro de su diapositiva (no se corta)");
c(/@media \(max-width:620px\)\{ body \.mazo \.dia\.leccion\{padding:54px/.test(CSS), "   en el móvil, por debajo de la barra de arriba");
c(/\.lc-lista input\{width:22px;height:22px/.test(CSS) && /\.lc-bots \.btn\{min-height:40px\}/.test(CSS), "   zonas de pulsar de 40 px");

console.log("\n  Batería 155 · La lección");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
