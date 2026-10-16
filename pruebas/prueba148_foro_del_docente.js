/**
 * BATERÍA 148 · EL MENSAJE DEL FORO DEL DOCENTE, PARA SU ALUMNADO (16-oct)
 * ------------------------------------------------------------------------------------------------
 * Anita (per-16450): «si modifico el mensaje del docente, a los estudiantes no les cambia: les sigue apareciendo el mensaje por
 * defecto». Su versión ya se guardaba en su ficha (vale para todos sus grupos), pero solo la leía su consola. Ahora la recibe su
 * escuadrón en la Nave y en el foro del grupo (`modForoSemana` de GamificaPro: solo la semana que ya ha llegado, sin nombres) y en
 * cada grupo elige «El mío / El genérico». La lógica y las reglas se prueban en GamificaPro (tests/functions/mod-foro.test.ts).
 * 🔴 Quien no ha escrito nada ve exactamente lo de antes: sin interruptor y con el genérico.
 */
const fs = require("fs"), path = require("path");
const raiz = path.join(__dirname, "..");
const leer = f => fs.readFileSync(path.join(raiz, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + JSON.stringify(dato))); };

console.log("▶ 148 · El mensaje del foro del docente, para su alumnado");
const CONS = leer("assets/js/consola.js"), REC = leer("assets/js/recluta.js"), FORO = leer("assets/js/foro.js"), MOT = leer("assets/js/motor.js"), SIM = leer("assets/js/motor_sim.js");

// ── 1 · el interruptor: sale solo si ha escrito alguno; por defecto «el mío»; «el genérico» en ESE grupo
const src = CONS.slice(CONS.indexOf("  function modoForo() {"), CONS.indexOf("  function interruptorForo() {"));
const modo = (ficha, per) => new Function("FICHA", "PER", src + "; return modoForo();")(ficha, per);
c(modo(null, "g") === "sin" && modo({ foros: { 2: "  " } }, "g") === "sin", "🔴 sin haber escrito ninguno, no hay interruptor (lo de siempre)");
c(modo({ foros: { 2: "hola" } }, "g") === "mio", "   con alguno escrito, por defecto «El mío»");
c(modo({ foros: { 2: "hola" }, modForoGenerico: { g: true } }, "g") === "generico" && modo({ foros: { 2: "hola" }, modForoGenerico: { h: true } }, "g") === "mio",
  "   «El genérico», solo en el grupo donde lo eligió");
c(/var foroTxt = \(!foroGen && mioForo\) \|\| foro;/.test(CONS), "   y la consola enseña el mismo que ve su alumnado en ese grupo");
c(/MOTOR\.guardarForoModo\(PER, gen\)/.test(CONS) && /async function guardarForoModo\(perId, generico\)/.test(MOT) && /guardarForoModo, ticketsGuardados/.test(MOT)
  && /async function guardarForoModo/.test(SIM), "   se guarda en su ficha (`modForoGenerico`), también en la consola de ensayo");
c(/id="ht-foro-previa"/.test(CONS) && /inp\.oninput = verPrevia/.test(CONS), "   al editar, vista previa con la misma carta");
c(/id="ht-foro-of">Volver al genérico</.test(CONS), "   y «Volver al genérico» por semana");
c(/"foro\.html\?per=" \+ P \+ escForo\(\) \+ "&embed=1"/.test(CONS), "   el código del foro del grupo lleva SU escuadrón (`&esc=`)");

// ── 2 · lo que ve el alumnado: la Nave y el foro del grupo
c(/function foroPropio\(esc, n\)/.test(REC) && /foroPropio\(suEsc\.id, Number\(sm\.sem\)\)\)\|\|sm\.foro/.test(REC), "🔴 la Nave: la orden de la semana de su comandante, o la de siempre");
c(/msgHtml\(\(estado==='curso'&&PROPIO\[s\.sem\]\)\|\|s\.foro/.test(FORO) && /if\(!ESC\|\|!per/.test(FORO), "🔴 el foro del grupo (?per=&esc=): el de su comandante; sin `esc`, el de siempre");
c(/modForoSemana/.test(REC) && /modForoSemana/.test(FORO), "   lo da GamificaPro (`modForoSemana`)");

console.log("\n  Batería 148 · " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
if (fallos.length) process.exit(1);
