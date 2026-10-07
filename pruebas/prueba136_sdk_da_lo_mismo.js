'use strict';
/**
 * BATERÍA 136 · LOS PASOS 4-11 DEL SDK DE GAMIFICAPRO DAN LO MISMO (7-oct-2026, fase 5 de gamificapro/docs/PLAN_CENTRALIZAR.md)
 *
 * motor.js sigue siendo la centralita con su misma API (window.SG.MOTOR); por dentro, alistarse y el alias, los premios por enlace,
 * la llamada a filas, las votaciones, los retos (avisos, reflexiones y comentarios), el equipo docente, el buzón y los vales,
 * sorteos y ofertas pasan al SDK. Con alumnado dentro, solo entra lo que da EXACTAMENTE lo mismo, y aquí se demuestra:
 *
 *   el mismo guion (pruebas/sdk_guion.mjs: ~100 llamadas a la centralita, con sus errores) corre con el motor.js de ANTES de la
 *   tanda (el del commit BASE, del historial de git) y con el de ahora, cada uno en su proceso, contra la consola de ensayo y con
 *   el reloj parado y el azar sembrado. Se comparan, paso a paso: lo que devuelve cada función (o su error), cada llamada al
 *   servidor con sus datos, lo que se avisa y, al final, cada documento tocado. Tres pasadas: como el docente de ensayo, con el
 *   buzón abierto (en el ensayo no se guarda, a propósito) y como un recluta.
 *
 * Las diferencias a propósito están en DIFERENCIAS, con lo que se espera de cada una: cualquier otra, falla.
 */
const fs = require("fs"), path = require("path"), os = require("os"), { execFileSync, spawnSync } = require("child_process");
const R = path.join(__dirname, "..");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + JSON.stringify(dato).slice(0, 600))); };

/** El main de antes de los pasos 4-11 (con los pasos 1-3 del SDK ya dentro). */
const BASE = "19af6f49";
let viejo = "";
try { viejo = execFileSync("git", ["show", BASE + ":assets/js/motor.js"], { cwd: R, encoding: "utf8", maxBuffer: 16 << 20 }); } catch (e) { /* sin historial */ }

/**
 * LAS DIFERENCIAS A PROPÓSITO, paso a paso: (antes, ahora) → ¿es la que se espera? Lo que no esté aquí tiene que dar lo mismo.
 * (Se rellena con cada paso de la tanda; cada una, con su porqué.)
 */
const mismoError = (a, b) => !!a.error && a.error === b.error && a.code === b.code;
const DIFERENCIAS = {
  // paso 4 · el SDK mira la reserva del alias ANTES de abrir la ficha (antes, solo las fichas, y la reserva paraba después)
  "alistar: un alias reservado sin ficha (de antes)": { porque: "el mismo «ya lo lleva alguien», sin enseñar antes «Abriendo tu ficha…»",
    espera: (a, b) => mismoError(a, b) && canon(a.progreso) === canon(["Abriendo tu ficha…"]) && canon(b.progreso) === "[]" },
  // paso 8 · «sin desplegar» POR CÓDIGO (GP_SDK.errores): un «no» con texto del servidor sin tildes ya no manda al camino viejo
  // paso 8 · el porqué de una anulación sale ya cortado a 200 (el servidor lo cortaba igual: functions/stargate.js)
  "→ stargateAnularReto": { porque: "el porqué, cortado a 200 letras en el navegador (el servidor ya lo cortaba a 200)",
    espera: (a, b) => canon(Object.assign({}, a, { motivo: String(a.motivo || "").slice(0, 200) })) === canon(b) && String(a.motivo || "").length > 200 },
  "anularReto: el servidor dice que no (sin tildes)": { porque: "se ve el «no» del servidor, no el del camino viejo del navegador",
    espera: (a, b) => a.error === "Ese reto no existe en este grupo: ZZ" && b.error === "No existe el reto" && b.code === "functions/not-found" },
};

/**
 * Los ids que inventa el ensayo para los documentos nuevos llevan un contador: si un paso deja de crear uno que no llegaba a
 * escribirse (p. ej. la ficha de un alistamiento que se para antes), los de después cambian de número. Así que se nombran por
 * orden de aparición (ID1, ID2…) y lo tocado se ordena por ese nombre: se compara QUÉ se escribe, no qué número le tocó.
 */
function normalizar(t) {
  const nombres = {};
  const txt = JSON.stringify(t).replace(/\bens[0-9a-z]{10,}\b/g, (id) => nombres[id] || (nombres[id] = "ID" + (Object.keys(nombres).length + 1)));
  const n = JSON.parse(txt), tocado = n.filter((x) => /^tocado · /.test(x[0])).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  let k = 0;
  return n.map((x) => (/^tocado · /.test(x[0]) ? tocado[k++] : x));
}
/** El JSON con las claves en orden (a Firestore le da igual en qué orden se escriben los campos de un documento). */
const canon = (v) => JSON.stringify(v, (k, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.keys(x).sort().reduce((o, c) => (o[c] = x[c], o), {}) : x));
function correr(motor, opc) {
  const r = spawnSync(process.execPath, [path.join(__dirname, "sdk_guion.mjs"), motor].concat(opc), { cwd: R, encoding: "utf8", maxBuffer: 64 << 20, env: Object.assign({}, process.env, { TZ: "Europe/Madrid" }) });
  try { return normalizar(JSON.parse(r.stdout)); } catch (e) { return [["💥 no ha salido la traza", (r.stderr || "").slice(0, 2000)]]; }
}

if (!viejo) {
  console.log("   (sin el historial de git: no tengo el motor de antes con el que comparar; me salto la batería)");
} else {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sg-136-"));
  const fv = path.join(tmp, "motor_antes.js"); fs.writeFileSync(fv, viejo);
  const fn = path.join(R, "assets/js/motor.js");
  for (const [nombre, opc] of [["el docente de ensayo", []], ["con el buzón abierto", ["--buzon"]], ["un recluta (Tritón)", ["--yo=prueba_triton"]]]) {
    console.log("\n  · " + nombre);
    const a = correr(fv, opc), b = correr(fn, opc);
    c(a.length > 150 && !a.some((x) => /^💥/.test(x[0])), "   el guion corre entero con el motor de antes (" + a.length + " pasos)", a.filter((x) => /^💥/.test(x[0])));
    c(!b.some((x) => /^💥/.test(x[0])), "   y con el de ahora", b.filter((x) => /^💥/.test(x[0])));
    const pasos = (t) => t.map((x) => x[0]);
    const iguales = JSON.stringify(pasos(a)) === JSON.stringify(pasos(b));
    if (!iguales) {
      const sa = new Set(pasos(a)), sb = new Set(pasos(b));
      const solo = (x, y) => pasos(x).filter((p) => !y.has(p));
      c(false, "🔴 los mismos pasos, en el mismo orden", { soloAntes: solo(a, sb).slice(0, 8), soloAhora: solo(b, sa).slice(0, 8) });
      continue;
    }
    let mismos = 0;
    a.forEach((x, i) => {
      const y = b[i], ja = canon(x[1]), jb = canon(y[1]);
      if (ja === jb) { mismos++; return; }
      const d = DIFERENCIAS[x[0]];
      if (d) c(d.espera(x[1], y[1]), "   a propósito · " + x[0] + ": " + d.porque, [x[1], y[1]]);
      else c(false, "🔴 da lo mismo · " + x[0], { antes: x[1], ahora: y[1] });
    });
    c(mismos > 0, "🔴 " + mismos + " de " + a.length + " pasos, idénticos (lo que devuelve, lo que llama al servidor y lo que escribe)");
  }
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log("\n  Batería 136 · los pasos 4-11 del SDK dan lo mismo");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
