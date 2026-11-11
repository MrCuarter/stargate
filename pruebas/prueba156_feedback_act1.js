'use strict';
/**
 * BATERÍA 156 · EL FEEDBACK DE LA ACTIVIDAD 1, PARA EL ALUMNADO (11-nov)
 * ------------------------------------------------------------------------------------------------
 * Norberto, en clase: «cuando inicien sesión solo mi grupo, ponles que el comandante les diga revisa el feedback de la actividad 1
 * y que lo puedan consultar en el panel, al igual que pueden consultar otras actividades».
 *   1. el dato: FEEDBACK_M1_AULAS (PER y Comandante), como la lección; llega a la Nave como SG_FEEDBACK_M1_AULAS;
 *   2. la página del alumnado (feedback-mision1.html): puerta de sesión, los mismos datos que el informe, sin «Solo profesorado»;
 *   3. la Nave: el aviso del Comandante y la entrada en Archivo → Sesiones, solo en su aula (se ejecuta el filtro de verdad).
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const R = path.join(__dirname, "..");
const L = (f) => fs.readFileSync(path.join(R, f), "utf8");
const DATA = L("_site_data.py"), NAVE_JS = L("assets/js/recluta.js"), NAVE = L("recluta.html"), FB = L("feedback-mision1.html"), INF = L("informe-mision1.html");
let ok = 0; const fallos = [];
const c = (cond, txt) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt); };

console.log("\n  · 1 · el dato");
c(/FEEDBACK_M1_AULAS = \[\("per-16450", "Norberto Cuartero"\), \("demo-stargate", None\)\]/.test(DATA), "🔴 solo el aula de Norberto en PER 16450 y la demo");
c(/window\.SG_FEEDBACK_M1_AULAS=\[\["per-16450", "Norberto Cuartero"\], \["demo-stargate", null\]\];/.test(NAVE), "   y la Nave lo recibe");

console.log("\n  · 2 · la página del alumnado");
c(/data-puerta","sesion"/.test(FB), "🔴 la abre la marca de recluta (puerta de sesión), no solo el profesorado");
c(/noindex,nofollow/.test(FB), "   no se indexa");
c(!/Solo profesorado/.test(FB) && /El feedback de la Actividad 1/.test(FB), "   habla al recluta, no al docente");
const datos = (h) => (h.match(/window\.SG_INFORME=(.*?);<\/script>/) || [])[1];
c(datos(FB) && datos(FB) === datos(INF), "   los mismos datos que el informe del docente (un dato, un sitio)");
c(/assets\/js\/informe\.js\?v=/.test(FB), "   y lo pinta la misma pieza (informe.js)");
c(!/"nota"|calificaci/i.test(datos(FB) || ""), "   sin notas");

console.log("\n  · 3 · la Nave: el filtro, de verdad");
const ini = NAVE_JS.indexOf("var URL_FEEDBACK_M1="), fin = NAVE_JS.indexOf("function avisoFeedbackM1");
c(ini > 0 && fin > ini, "   las piezas están en recluta.js");
const prueba = (per, profe) => {
  const ctx = { window: { SG_FEEDBACK_M1_AULAS: [["per-16450", "Norberto Cuartero"], ["demo-stargate", null]] }, per, st: { yo: { profe } }, localStorage: { getItem() { return null; }, setItem() {} } };
  vm.runInNewContext(NAVE_JS.slice(ini, fin) + ";this.r=feedbackM1();", ctx); return ctx.r;
};
c(prueba("per-16450", "Norberto Cuartero") === true, "🔴 el grupo de Norberto lo ve");
c(prueba("per-16450", "Caridad") === false, "🔴 el de Caridad, en el mismo PER, no");
c(prueba("per-99999", "Norberto Cuartero") === false, "   ni otro PER");
c(prueba("demo-stargate", "") === true, "   la demo, sí");
c(/\+recordatorioActividad\(\)\s*\n\s*\/\/[^\n]*\n\s*\+avisoFeedbackM1\(\)/.test(NAVE_JS), "   el aviso, en Mi nave debajo de la ficha");
c(/Mensaje de tu Comandante/.test(NAVE_JS) && /Revisa el feedback de la Actividad 1/.test(NAVE_JS), "   lo dice su Comandante");
c(/Number\(a\.n\)===1 && feedbackM1\(\)\) out\.push\(\{u:URL_FEEDBACK_M1/.test(NAVE_JS), "   en Archivo → Sesiones, detrás de «La Actividad 1»");
c(/data-fbm1-ver/.test(NAVE_JS) && /st\.arSes=URL_FEEDBACK_M1; irA\('archivo'\)/.test(NAVE_JS), "   «Ver el feedback» lo abre en el panel");
c(/try\{ return localStorage\.getItem/.test(NAVE_JS), "   el «ya lo he visto», con try (sin almacenamiento, sale igual)");

console.log("\n  Batería 156 · El feedback de la Actividad 1, para el alumnado");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
if (fallos.length) process.exit(1);
