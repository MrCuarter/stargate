'use strict';
/**
 * BATERÍA 139 · LOS MENSAJES DE NEBULA (7-oct-2026). Norberto, de baja, con Claude de asistente: «Si le escribes, que no te
 * hagas pasar por el docente, sino como NEBULA. Ese mensaje debe aparecer al profesor responsable y al estudiante, pero enviado
 * como NEBULA.» Los escribe el servidor de GamificaPro (functions/modMensajes.js → `enviarMensajeDelSistema`): uno al recluta,
 * con la marca `stargate` de siempre y `modSistema: { voz: 'NEBULA', para: 'alumno' }`, y otro a su Comandante, con
 * `modSistema.para == 'docente'` y SIN la marca. Aquí se vigila lo de la web, ejecutando sus trozos:
 *   · la Nave lo firma «Mensaje de NEBULA» (no «de tu Comandante · NEBULA»); los del Comandante, como siempre;
 *   · la consola escucha solo los del docente (motor.js y motor_sim.js, igual) y los pinta arriba, con «Entendido».
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const R = path.join(__dirname, "..");
const L = (f) => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + JSON.stringify(dato))); };
const trozo = (src, desde, hasta) => { const i = src.indexOf(desde), j = src.indexOf(hasta, i + 1); if (i < 0 || j < 0) throw new Error("no encuentro " + desde); return src.slice(i, j); };
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
const sinEtiquetas = (t) => t.replace(/<[^>]+>/g, "");

const REC = L("assets/js/recluta.js"), CONS = L("assets/js/consola.js"), MOT = L("assets/js/motor.js"), SIM = L("assets/js/motor_sim.js");
const NEBULA = { id: "s1", createdAt: 1791400000000, message: "El enlace no abre.", stargate: { reto: "L1", accion: "anulado", de: "NEBULA" },
  modSistema: { voz: "NEBULA", mod: "stargate", para: "alumno", fichaId: "f1" } };
const CMD = { id: "c1", createdAt: 1791400000000, message: "Bien hecho", stargate: { reto: "A1", accion: "validado", de: "Marta" } };

console.log("\n  · La Nave: quién firma");
{
  const ctx = { st: { mensajes: [], yo: { id: "f1" }, d: { tipo: "REGULAR" } }, SIMULACRO: false, esc, window: { SG_RETOS: { REGULAR: [["L1", "Bitácora"], ["A1", "Primer salto"]] } } };
  vm.createContext(ctx);
  vm.runInContext(trozo(REC, "function avisoMensajes(){", "function vigilarMensajes(){") + "; this.avisoMensajes = avisoMensajes;", ctx);
  ctx.st.mensajes = [NEBULA];
  const h = sinEtiquetas(ctx.avisoMensajes());
  c(/Mensaje de NEBULA/.test(h) && !/Comandante/.test(h), "🔴 un mensaje del sistema: «Mensaje de NEBULA», sin «tu Comandante»", h.slice(0, 90));
  c(/Ha anulado tu reto L1 · Bitácora\./.test(h) && /«El enlace no abre\.»/.test(h), "   con su reto y su texto, como los demás");
  ctx.st.mensajes = [CMD];
  c(/Mensaje de tu Comandante · Marta/.test(sinEtiquetas(ctx.avisoMensajes())), "   el de un Comandante, como siempre: «Mensaje de tu Comandante · Marta»");
  ctx.st.mensajes = [{ ...NEBULA, modSistema: undefined }];
  c(/Mensaje de NEBULA/.test(sinEtiquetas(ctx.avisoMensajes())) && !/Comandante/.test(sinEtiquetas(ctx.avisoMensajes())), "   los primeros del 7-oct (solo `de: 'NEBULA'`), también como NEBULA");
}

console.log("\n  · El motor: la consola escucha solo las copias del docente");
for (const [nombre, src] of [["motor.js", MOT], ["motor_sim.js", SIM]]) {
  const llamadas = [];
  const ctx = { auth: { currentUser: { uid: "profe" } },
    RETOS: { vigilarAvisos: (per, campo, cb, uid) => { llamadas.push([per, campo, uid]); cb([NEBULA, CMD, { id: "d1", modSistema: { voz: "NEBULA", para: "docente" } }, { id: "d2", modSistema: { para: "docente" } }]); return () => {}; } } };
  vm.createContext(ctx);
  vm.runInContext(trozo(src, "function vigilarMensajesDelSistema(", "\n}\n") + "\n}; this.f = vigilarMensajesDelSistema;", ctx);
  let vistos = null;
  ctx.f("per-1", (l) => { vistos = l.map((x) => x.id); });
  c(JSON.stringify(llamadas) === JSON.stringify([["per-1", null, "profe"]]) && JSON.stringify(vistos) === '["d1"]', "🔴 " + nombre + ": los del grupo, sin filtrar por la marca, y solo los de `para: 'docente'` con su voz", vistos);
  c(/avisarRecluta, vigilarMensajes, mensajeLeido, vigilarMensajesDelSistema,/.test(src), "   " + nombre + " lo publica en SG.MOTOR");
}

console.log("\n  · La consola: arriba, con «Entendido»");
{
  const ctx = { esc, ico: (k) => "[" + k + "]", SISTEMA: [] };
  vm.createContext(ctx);
  vm.runInContext(trozo(CONS, "function avisosSistema()", "function cablearSistema(") + "; this.avisosSistema = avisosSistema;", ctx);
  c(ctx.avisosSistema() === "", "sin mensajes, nada");
  const d = (i, m) => ({ id: "d" + i, createdAt: 1791400000000, message: "El enlace no abre.", modSistema: { voz: "NEBULA", para: "docente", alumno: "Star Picard", ...m } });
  vm.runInContext("SISTEMA = " + JSON.stringify([d(1, { reto: "L1", accion: "anulado" }), d(2, {})]), ctx);
  const h = ctx.avisosSistema(), t = sinEtiquetas(h);
  c(/Mensaje de NEBULA · a Star Picard/.test(t) && /Ha anulado el reto L1 de Star Picard\./.test(t), "🔴 a quién se lo dijo NEBULA y qué", t.slice(0, 120));
  c(/Le ha escrito a Star Picard\./.test(t) && (h.match(/data-sis-leido="d\d"/g) || []).length === 2, "   un mensaje suelto, también; cada uno con su «Entendido»");
  vm.runInContext("SISTEMA = " + JSON.stringify([1, 2, 3, 4, 5, 6, 7].map((i) => d(i, {}))), ctx);
  c((ctx.avisosSistema().match(/msg-cmd/g) || []).length === 5 && /Y 2 más/.test(ctx.avisosSistema()), "   cinco como mucho, y cuántos quedan");
  c(/'<div id="c-sistema">' \+ avisosSistema\(\)/.test(CONS) && /cablearSistema\(app\)/.test(CONS), "   va arriba de todo en cada sección (pintar), y se cablea");
  c(/pintar\(\);\s*quizaBienvenida\(\);\s*vigilarSistema\(\);/.test(CONS), "   se escucha al abrir un grupo, y una vez por grupo");
  c(/MOTOR\.mensajeLeido\(id\)/.test(trozo(CONS, "function cablearSistema(", "/** Tu cita en el grupo")), "   «Entendido» lo da por leído (solo su copia)");
  c(/GESTION \|\| !MOTOR \|\| !MOTOR\.vigilarMensajesDelSistema/.test(CONS), "   ni en Gestionar grupos ni con un motor que no lo tenga");
}

console.log("\n  Batería 139 · los mensajes de NEBULA");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
