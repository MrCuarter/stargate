'use strict';
/**
 * BATERÍA 135 · EL SDK DE CLIENTE DE GAMIFICAPRO (7-oct-2026, fase 5 de gamificapro/docs/PLAN_CENTRALIZAR.md, pasos 1-3)
 * Las semanas, `llamar` y `miPapel` llegan en un paquete de GamificaPro (assets/js/mod-sdk.v1.<huella>.js), fijado en
 * _build_site.py → SDK_FIJADO. Con alumnado dentro, solo entra lo que da EXACTAMENTE lo mismo:
 *   · el paquete es el fijado, con su huella, y va antes del motor en cada página que lo carga;
 *   · motor/semanas.js ES la pieza «semanas» del paquete (tal cual) y cuenta igual que el GP_SDK.semanas del motor;
 *   · `llamar` es GP_SDK.llamador (mismo data, mismo error con marcas) y `sinDesplegar` va por código desde los pasos
 *     4-11 (7-oct; antes, por palabras: batería 138); `miPapel` está en el motor, pero nadie lo usa aún.
 */
const fs = require("fs"), path = require("path"), vm = require("vm"), crypto = require("crypto");
const R = path.join(__dirname, "..");
const L = (f) => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + JSON.stringify(dato))); };

const FIJADO = (L("_build_site.py").match(/^SDK_FIJADO = "(mod-sdk\.v1\.([0-9a-f]{10})\.js)"$/m) || []);
const PAQ = FIJADO[1] ? L("assets/js/" + FIJADO[1]) : "";
const caja = { self: {} }; vm.runInNewContext(PAQ, caja);
const SDK = caja.self.GP_SDK || {};
const MOT = L("assets/js/motor.js");

console.log("\n  · El paquete");
c(!!FIJADO[1], "_build_site.py fija el paquete (SDK_FIJADO)");
c(crypto.createHash("sha256").update(PAQ, "utf8").digest("hex").slice(0, 10) === FIJADO[2], "🔴 su huella cuadra (nadie lo ha tocado a mano)");
c(fs.readdirSync(path.join(R, "assets/js")).filter((f) => /^mod-sdk\./.test(f)).join() === FIJADO[1], "   y es el único en assets/js");
const gp = "/Users/nor/Claude/vibewebs/gamificapro/dist-sdk/" + FIJADO[1];
c(!fs.existsSync(gp) || fs.readFileSync(gp, "utf8") === PAQ, "   es el de GamificaPro (si está al lado)");
c(SDK.version === "v1" && typeof SDK.llamador === "function" && typeof SDK.papel === "function", "deja GP_SDK v1 (llamador, papel, semanas)");
c(!/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(PAQ) && !/AIza[0-9A-Za-z_-]{20,}/.test(PAQ), "🔴 sin correos ni claves (este repo es público)");

console.log("\n  · Va antes del motor en cada página que lo carga");
const paginas = fs.readdirSync(R).filter((f) => f.endsWith(".html"));
let conMotor = 0;
paginas.forEach((f) => {
  const h = L(f), m = h.search(/assets\/js\/(motor|motor_sim|fuente)\.js/);
  if (m < 0) return;
  conMotor++;
  const i = h.indexOf('<script src="assets/js/' + FIJADO[1] + '"></script>');
  c(i >= 0 && i < m, "🔴 " + f + " carga el SDK antes que el motor", [i, m]);
});
c(conMotor >= 25, "   (" + conMotor + " páginas con motor)");

console.log("\n  · Paso 1 · las semanas");
const pieza = PAQ.match(/\/\/ ─── GP_SDK pieza «semanas» \(sdk\/semanas\.js\), tal cual ───\n([\s\S]*?)\/\/ ─── fin de la pieza «semanas» ───/);
c(!!pieza && L("motor/semanas.js") === pieza[1], "🔴 motor/semanas.js ES la pieza «semanas» del paquete, tal cual");
const S = require("../motor/semanas.js");
let iguales = 0, distintas = [];
for (const [inicio, pausas] of [["2026-10-05", []], ["2026-10-05", ["2026-12-21", "2026-12-28"]], ["2027-02-15", ["2027-03-22"]]]) {
  for (let d = -14; d < 320; d++) {
    const dia = S.masDias(inicio, d);
    const a = SDK.semanas.semanaDelCurso(inicio, pausas, dia), b = S.semanaDelCurso(inicio, pausas, dia);
    if (a === b) iguales++; else distintas.push([inicio, dia, a, b]);
  }
}
c(!distintas.length && iguales > 900, "la del paquete y motor/semanas.js cuentan igual (" + iguales + " días)", distintas.slice(0, 3));
c(/SDK\.semanas\.semanaDelCurso\(S\.inicio, S\.pausas\)/.test(MOT) && !/window\.SGSEMANAS\./.test(MOT), "🔴 motor.js cuenta con GP_SDK.semanas (ya no con window.SGSEMANAS)");

console.log("\n  · Paso 2 · llamar");
c(/const llamar = SDK\.llamador\(nombre => httpsCallable\(fns, nombre\)\);/.test(MOT), "🔴 llamar es GP_SDK.llamador");
c((MOT.match(/httpsCallable\(/g) || []).length === 1, "   una sola puerta a las funciones");
// 7-oct · con los pasos 4-11, «sin desplegar» pasa a ir POR CÓDIGO (lo mide la batería 138: un «no» del servidor sin tildes ya
// no manda al camino viejo del navegador; se ve tal cual)
c(/const sinDesplegar = e => SDK\.errores\.sinDesplegar\(e\);/.test(MOT) && !/\[áéíóúñ\]\|recluta\|grupo/.test(MOT),
  "🔴 sinDesplegar va POR CÓDIGO (GP_SDK.errores), ya no por palabras");
// llamar devuelve data y relanza el MISMO error (code y message de siempre), con marcas
const llamar = SDK.llamador((n) => (d) => n === "bien" ? Promise.resolve({ data: { ok: true, d } }) : Promise.reject(Object.assign(new Error("Ese recluta no existe"), { code: "functions/not-found" })));
llamar("bien", { x: 1 }).then((r) => c(JSON.stringify(r) === '{"ok":true,"d":{"x":1}}', "   devuelve `data`, como antes", r))
  .then(() => llamar("mal", {})).catch((e) => {
    c(e.code === "functions/not-found" && e.message === "Ese recluta no existe", "   el error, con su code y message de siempre", [e.code, e.message]);
    c(e.codigo === "not-found" && e.delServidor === true && e.sinDesplegar === false && e.funcion === "mal", "   y sus marcas por código", e);
  }).then(() => {
    console.log("\n  · Paso 3 · miPapel");
    c(/const papel = SDK\.papel\(llamar\);/.test(MOT) && /SDK\.papelDe\(await papel\.miPapel\(yo\.uid\), "stargate"\)/.test(MOT), "miPapel, del SDK (mod stargate)");
    c(/window\.SG\.MOTOR = \{ entrar, salir, sesion, credencial, miPapel,/.test(MOT), "   en window.SG.MOTOR");
    c(/const REFERENTES_VITALICIOS = \[/.test(MOT) && /VITALICIOS: REFERENTES_VITALICIOS/.test(MOT), "🔴 la lista de vitalicios se queda (marca a otras personas del equipo): cambiarla, en una pausa");
    c(/consentimiento/.test(L("assets/js/motor_sim.js")) && /SDK\.llamador/.test(L("assets/js/motor_sim.js")), "la consola de ensayo (motor_sim.js) va igual");
    console.log("\n  Batería 135 · el SDK de GamificaPro");
    console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
    if (fallos.length) process.exit(1);
  });
