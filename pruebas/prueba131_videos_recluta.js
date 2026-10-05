'use strict';
/**
 * BATERÍA 131 · LOS VÍDEOS DEL RECLUTA (5-oct)
 * Norberto: «¿no necesitaríamos algún vídeo más para los estudiantes? ¿Hacer una compra? ¿Comprar un boleto? ¿Consultar su
 * clasificación? ¿Poner algo a la venta? ¿Dónde encontrar las sesiones de clase?». Cinco tutoriales hablados de «tú», grabados con
 * stargate/tutoriales/grabar.cjs sobre la Nave en simulacro, y enlazados desde la respuesta de NEBULA de cada cosa.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
let ok = 0; const fallos = [];
const c = (cond, txt) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt); };
global.window = {}; require(path.join(R, "assets/js/nebula-faq.js")); const F = window.SG_NEBULA_FAQ;
const V = { comprar: "recluta-comprar", sorteo: "recluta-sorteo", rankings: "recluta-ranking", zoco_vender: "recluta-zoco", sesiones: "recluta-sesiones" };
for (const [id, v] of Object.entries(V)) {
  const f = path.join(R, "assets/video/tutoriales", v + ".mp4"), e = F.find((x) => x.id === id);
  c(fs.existsSync(f) && fs.statSync(f).size > 200000 && e && e.r.includes('href="assets/video/tutoriales/' + v + '.mp4"'), "🔴 «" + id + "»: su vídeo existe y NEBULA lo enlaza (" + v + ".mp4)");
}
c(/\+\(per\?puertaSec\('sesiones'/.test(fs.readFileSync(path.join(R, "assets/js/recluta.js"), "utf8")), "   «Sesiones de clase» también en el simulacro (el tutorial y el docente que mira su grupo como recluta)");
const G = fs.readFileSync(path.join(R, "../tutoriales/grabar.cjs"), "utf8");
c(/\{ timeout: 800 \}\)\.catch/.test(G), "   el grabador no se queda 30 s congelado si lo pulsado desaparece");
console.log("\n  Batería 131 · los vídeos del recluta");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
