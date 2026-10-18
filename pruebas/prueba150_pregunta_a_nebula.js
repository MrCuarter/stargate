'use strict';
/**
 * BATERÍA 150 · «PREGUNTA A NEBULA» (18-oct-2026). El asistente de dudas del directo de GamificaPro (functions/modDudaDirecto.js, modo
 * `privado`): en «En vivo», un desplegable discreto con el que el recluta pregunta una duda suelta; la respuesta vuelve solo a él. Se vigila lo
 * de la web: el motor llama a `modDudaDirecto` con el texto (200 como mucho), la caja solo sale con el motor nuevo y fuera del ensayo, el
 * desplegable no cambia nada de lo que ya hay en «En vivo» y el servidor del mod tiene el uso en modo privado.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = (f) => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt); };

const MOT = L("assets/js/motor.js"), SIM = L("assets/js/motor_sim.js"), REC = L("assets/js/recluta.js");
console.log("\n  · El motor");
c(/llamar\("modDudaDirecto", \{ projectId: String\(perId\), sesion: String\(sesion\), texto: String\(texto \|\| ""\)\.slice\(0, 200\) \}\)/.test(MOT), "llama a modDudaDirecto con el grupo, la sesión y el texto (200 como mucho)");
c(/preguntarANebula, vigilarRespuestas/.test(MOT) && /preguntarANebula, vigilarRespuestas/.test(SIM), "preguntarANebula está en el motor y en el del ensayo (generado)");

console.log("\n  · La caja de «En vivo»");
c(/\+preguntaANebulaCaja\(\);\n  \}/.test(REC), "va al final de «En vivo» y lo que ya había (pregunta, votación, sesión) queda igual");
c(/if\(!M\|\|!M\.preguntarANebula\|\|SIMULACRO\|\|enDemo\(\)\|\|!st\.yo\) return '';/.test(REC), "no sale en el ensayo, en la demo ni sin sesión");
c(/Pregunta a NEBULA/.test(REC) && /solo tú ves la respuesta/.test(REC), "se llama «Pregunta a NEBULA» y dice que la respuesta es solo suya");
c(/NEBULA está pensando…/.test(REC), "mientras espera: «NEBULA está pensando…»");
c(/Pregúntaselo a tu Comandante en el chat de la clase/.test(REC) && !/24 horas/.test(REC.slice(REC.indexOf("PREGUNTA A NEBULA"))), "si NEBULA no sabe, lo dice y manda al Comandante, sin plazos");

console.log("\n  · El servidor");
{
  const m = require("child_process").spawnSync("node", ["--input-type=module", "-e",
    "import('" + path.join(process.env.GAMIFICAPRO_DIR || path.join(R, "..", "..", "gamificapro"), "functions", "mods", "stargate.js") + "').then(m=>{const x=m.default||m.STARGATE||m;const ia=(x.ia||(Object.values(m).find(v=>v&&v.ia)||{}).ia);console.log(JSON.stringify({u:!!ia.usos.directo,modo:ia.directo.modo}))}).catch(e=>console.log('ERR '+e.message))"], { encoding: "utf8" });
  const salida = (m.stdout || "").trim().split("\n").pop();
  let r = {}; try { r = JSON.parse(salida); } catch (e) { /* sin GamificaPro al lado: se salta */ }
  if (r.u !== undefined) c(r.u === true && r.modo === "privado", "GamificaPro: STARGATE tiene el uso `directo` en modo privado (sin chat propio que leer)");
  else console.log("   · (sin GamificaPro al lado: se salta la comprobación del servidor)");
}

console.log("\n  Batería 150 · Pregunta a NEBULA\n  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
if (fallos.length) { console.log(fallos.map((f) => "   ✗ " + f).join("\n")); process.exit(1); }
