'use strict';
/**
 * BATERÍA 142 · EL MOTOR COMÚN: STARGATE LLAMA A LOS NOMBRES DEL MOTOR (8-oct-2026, GamificaPro docs/PLAN_CENTRALIZAR.md §1e)
 *
 * Lo que STARGATE llamaba con nombre de mod ahora se llama por el del motor, que en el servidor es la MISMA función (mismo
 * manejador, mismas opciones, misma respuesta: GamificaPro functions/modNombres.js y la tabla functions/mods/nombres.js):
 *   stargateEquipo → modEquipo · stargateAlumno → modAlumno · stargateAnularReto → modAnularReto · stargateOferta → modOferta
 *   stargateSorteosPendientes → modSorteosPendientes · stargateCambiarDocente → modCambiarDocente   (por el SDK fijado)
 *   stargateBatalla → modBatalla · stargateHitos → modLogros · stargateSecreto → modSecreto · stargateMiNombre → modMiNombre
 *   (a mano, en motor.js) y stargateOferta → modOferta (a mano, en fuente.js).
 * Aquí se fija cada llamada EXACTA (nombre y datos) corriendo las funciones de motor.js contra un mostrador que las apunta; las
 * demás (stargateFantasma, stargateZoco*, stargateRegalar…) no tienen nombre del motor y se quedan. Que el comportamiento entero
 * da lo mismo lo demuestra la batería 138 (el guion, antes y ahora, paso a paso).
 */
const fs = require("fs"), path = require("path"), assert = require("assert");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + JSON.stringify(dato).slice(0, 500))); };
const canon = v => JSON.stringify(v, (k, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.keys(x).sort().reduce((o, n) => (o[n] = x[n], o), {}) : x));

const MOTOR = L("assets/js/motor.js"), FUENTE = L("assets/js/fuente.js"), CONSOLA = L("assets/js/consola.js"), B = L("_build_site.py");
const { pieza, FIJADO } = require("./sdk_pieza.js");

console.log("  Los paquetes fijados");
c(FIJADO === "mod-sdk.v1.3dc8a5eeb5.js", "🔴 el SDK fijado es el de hoy (llama a los mod*; trae además los mensajes del sistema, conectar, grupos y, 8-oct, cambiarComandante y, tanda 2, el sitio de lo pasado para un mod entero, leer como la vieja y borrar en las dos; tanda 2b, lo suelto entero en mod_* y equipo con su sitio; las capturas del buzón para todos; tanda 2c, el buzón entero en mod_buzon y buzon con su sitio)", FIJADO);
c(/^SIM_FIJADO = "mod-sim\.v1\.3855e2af74\.js"$/m.test(B) && /^import "\.\/mod-sim\.v1\.3855e2af74\.js";$/m.test(L("assets/js/sim/firebase_sim.js")), "   y el simulador común que contesta a los dos nombres");

console.log("\n  Lo que va por el SDK (equipo, alumnado, anular, sorteos pendientes, oferta)");
const EQ = pieza("equipo"), RE = pieza("retos"), EC = pieza("economia");
c(/llamar\("modEquipo", \{ projectId: grupo, persona: persona \|\| \{\} \}\)/.test(EQ) && /llamar\("modEquipo", \{ projectId: grupo, persona: \{ correo: minus\(correo\) \}, quitar: true \}\)/.test(EQ) &&
  /llamar\("modEquipo", \{ projectIds: grupos, persona: Object\.assign\(\{\}, persona, \{ rol: "referente" \}\) \}\)/.test(EQ), "   modEquipo: añadir, quitar y referente en todos, con los datos de siempre");
c(/llamar\("modCambiarDocente", \{ projectId: grupo, sale: minus\(sale\), entra: entra \|\| \{\}, ceder: ceder === true \}\)/.test(EQ), "   modCambiarDocente");
c(/llamar\("modAlumno", Object\.assign\(\{ projectId: grupo, fichaId: fichaId, accion: accion \}, extra \|\| \{\}\)\)/.test(EQ), "   modAlumno");
c(/llamar\("modAnularReto", \{ projectId: grupo, studentProfileId: fichaId, retoId: retoId, motivo: /.test(RE), "   modAnularReto");
c(/llamar\("modSorteosPendientes", \{ projectId: grupo \}\)/.test(EC) && /llamar\("modOferta", Object\.assign\(\{ projectId: grupo, accion: accion \}, datos \|\| \{\}\)\)/.test(EC), "   modSorteosPendientes y modOferta");
const todo = EQ + RE + EC;
c(!/llamar\("stargate(Equipo|CambiarDocente|Alumno|AnularReto|SorteosPendientes|Oferta)"/.test(todo), "🔴 ni una llamada del SDK a los nombres de siempre");

console.log("\n  Las llamadas a mano de motor.js, una a una (las funciones de verdad, contra un mostrador)");
const funcion = n => { const i = MOTOR.indexOf("\nasync function " + n + "("); assert.ok(i >= 0, n); return MOTOR.slice(i, MOTOR.indexOf("\n}\n", i) + 2); };
const constante = n => { const i = MOTOR.indexOf("\nconst " + n + " = "); assert.ok(i >= 0, n); return MOTOR.slice(i, MOTOR.indexOf("\n", i + 1)); };
const cuerpo = ["traerPalabra", "hitos", "cambiarMiNombre"].map(funcion).join("") + constante("batalla") + "\nreturn { traerPalabra, hitos, cambiarMiNombre, batalla };";
const llamadas = [];
const M = new Function("llamar", "sesion", cuerpo)(async (fn, d) => { llamadas.push([fn, d]); return { ok: true }; }, async () => ({ uid: "u1", correo: "a@x.es" }));
const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { return ""; } })();
(async () => {
  await M.traerPalabra("g1", "S7", "lapalabra"); await M.traerPalabra("g1", "S7");
  await M.hitos("g1");
  await M.batalla("empezar", { projectId: "g1", fichaId: "f1" }); await M.batalla("responder", { projectId: "g1", r: 2 });
  await M.cambiarMiNombre("  Comandante Ana  ");
  c(canon(llamadas) === canon([
    ["modSecreto", { projectId: "g1", reto: "S7", texto: "lapalabra" }],
    ["modSecreto", { projectId: "g1", reto: "S7", texto: "" }],
    ["modLogros", { projectId: "g1", tz }],
    ["modBatalla", { accion: "empezar", projectId: "g1", fichaId: "f1" }],
    ["modBatalla", { accion: "responder", projectId: "g1", r: 2 }],
    ["modMiNombre", { nombre: "Comandante Ana" }]]), "🔴 la palabra secreta, los logros, la batalla y el nombre, por modSecreto, modLogros, modBatalla y modMiNombre, con los datos de siempre", llamadas);
  c(!/llamar\("stargate(Batalla|Hitos|Secreto|MiNombre|Oferta|Equipo|Alumno|AnularReto|SorteosPendientes|CambiarDocente)"/.test(MOTOR + FUENTE + CONSOLA), "🔴 ni una llamada a mano a los nombres de siempre (motor.js, fuente.js ni consola.js)");

  console.log("\n  La oferta de fuente.js");
  c(/\? M\.llamar\("modOferta", \{ projectId: cuerpo\.per, accion: "comprar", ofertaId: cuerpo\.recompensa \}\)/.test(FUENTE), "🔴 comprar una oferta: modOferta, con los datos de siempre");

  console.log("\n  El servidor: son la MISMA función");
  const GP = [process.env.GAMIFICAPRO_DIR, "/Users/nor/Claude/vibewebs/gamificapro"].filter(Boolean).map(d => path.join(d, "functions")).find(d => fs.existsSync(path.join(d, "mods", "nombres.js")));
  if (!GP) console.log("   (sin la carpeta de gamificapro al lado: la tabla del servidor no se comprueba aquí)");
  else {
    const T = fs.readFileSync(path.join(GP, "mods", "nombres.js"), "utf8"), NM = fs.readFileSync(path.join(GP, "modNombres.js"), "utf8");
    const par = { modEquipo: "stargateEquipo", modCambiarDocente: "stargateCambiarDocente", modAlumno: "stargateAlumno", modAnularReto: "stargateAnularReto",
      modOferta: "stargateOferta", modSorteosPendientes: "stargateSorteosPendientes", modBatalla: "stargateBatalla", modLogros: "stargateHitos",
      modSecreto: "stargateSecreto", modMiNombre: "stargateMiNombre" };
    Object.keys(par).forEach(n => c(new RegExp("\\b" + n + ": '" + par[n] + "'").test(T) && new RegExp("export const " + n + " = onCall\\(OPC, \\(request\\) => " + par[n] + "\\.run\\(request\\)\\);").test(NM),
      "   " + n + " = " + par[n] + " (misma tabla, mismo manejador)"));
  }

  console.log("\n  Batería 142 · el motor común (STARGATE llama a los nombres del motor)");
  console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
  process.exit(fallos.length ? 1 : 0);
})();
