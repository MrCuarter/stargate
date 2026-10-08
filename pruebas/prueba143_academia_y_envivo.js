'use strict';
/**
 * BATERÍA 143 · LA ACADEMIA Y LO EN VIVO, POR EL SERVIDOR (8-oct-2026, GamificaPro docs/PLAN_CENTRALIZAR.md §1e y fase 6)
 *
 * Lo que motor.js escribía desde el navegador en la Academia de la Cero (`stargate_formacion/{uid}`) y en lo en vivo del aula
 * (`stargate_envivo/{grupo}` y `stargate_respuestas/{grupo}__{pregunta}__{ficha}`) lo hace ahora el servidor del motor de
 * GamificaPro, con los MISMOS documentos y campos:
 *   academiaGuardar / Editar / Responder / Quitar / Todos / Profes → modFormacion { mod: "stargate", accion }
 *   publicarEnVivo / lanzarPregunta / cerrarPregunta / responderPregunta / quitarRespuesta → modClase { sala: "envivo", accion }
 * Leer sigue siendo directo (academiaMia, academiaEscuchar, vigilarEnVivo, vigilarRespuestas, miRespuesta). El juego del final
 * (`directoCanal`, sala «directo») lo hace la batería 141 (Norberto, 8-oct: «pasa al motor YA»).
 *
 * Qué se demuestra:
 *   1. cada llamada exacta (nombre y datos), corriendo las funciones de motor.js contra un mostrador;
 *   2. el mismo guion (pruebas/sdk_guion.mjs --ensayo: ~30 pasos) con el motor.js de ANTES (el del commit BASE, que escribía desde
 *      el navegador) y con el de ahora, cada uno en su proceso, contra la consola de ensayo, que ahora simula modFormacion y
 *      modClase como GamificaPro (tests/sdk/sim/envoltorio-stargate.mjs): lo que devuelve cada función (o su error), y cada
 *      documento tocado, idénticos. Lo único distinto es el id al azar de una pregunta (p + 10 letras), que se nombra por orden;
 *   3. que la configuración del servidor (functions/mods/stargate.js) tiene lo que estas llamadas necesitan.
 * (Que el servidor de verdad escribe lo mismo que el navegador, con las reglas, lo prueba el emulador de GamificaPro:
 *  tests/emulador/mod-formacion.test.ts y mod-clase.test.ts.)
 */
const fs = require("fs"), path = require("path"), os = require("os"), assert = require("assert"), { execFileSync, spawnSync } = require("child_process");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + JSON.stringify(dato).slice(0, 600))); };
const canon = v => JSON.stringify(v, (k, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.keys(x).sort().reduce((o, n) => (o[n] = x[n], o), {}) : x));

const MOTOR = L("assets/js/motor.js");

console.log("  Las llamadas exactas (las funciones de verdad de motor.js, contra un mostrador)");
const funcion = n => { const i = MOTOR.search(new RegExp("\\n(async )?function " + n + "\\(")); assert.ok(i >= 0, n); const j = MOTOR.indexOf("\n}\n", i); return MOTOR.slice(i, j + 2); };
const una = n => { const i = MOTOR.indexOf("\nasync function " + n + "("); assert.ok(i >= 0, n); const j = MOTOR.indexOf("\n}", i); return MOTOR.slice(i, j + 2); };
const linea = n => { const i = MOTOR.indexOf("\nasync function " + n + "("); assert.ok(i >= 0, n); return MOTOR.slice(i, MOTOR.indexOf("\n", i + 1)); };
const cuerpo = [
  "let colaEnVivo = Promise.resolve();", funcion("publicarEnVivo"), una("lanzarPregunta"), linea("cerrarPregunta"), una("responderPregunta"), linea("quitarRespuesta"),
  una("academiaGuardar"), una("academiaTodos"), una("academiaEditar"), linea("academiaQuitar"), una("academiaResponder"), una("academiaProfes"),
  'const ACADEMIA_CAMPOS = ["alias", "pasos", "diseno", "preguntas", "feedback", "avance"];',
  "return { publicarEnVivo, lanzarPregunta, cerrarPregunta, responderPregunta, quitarRespuesta, academiaGuardar, academiaTodos, academiaEditar, academiaQuitar, academiaResponder, academiaProfes };"].join("\n");
const llamadas = []; let fin = null;
const lista = [{ uid: "u2", correo: "B@x.es", nombre: "Bea", t: 5, avance: { de: 8 } }, { uid: "u1", correo: "a@x.es", alias: "Ana", t: "7" }, { uid: "u3", nombre: "sin correo" }];
const M = new Function("llamar", "auth", "sesion", cuerpo)(async (fn, d) => {
  llamadas.push([fn, d]);
  if (d.accion === "pregunta") return { ok: true, id: "pabc" };
  if (d.accion === "responder" && d.mod) return { ok: true, t: 1234 };
  if (d.accion === "todos") return { ok: true, lista };
  return { ok: true };
}, { currentUser: { uid: "yo" } }, async () => ({ uid: "yo", correo: "Yo@X.es", nombre: "Yo Mismo" }));
(async () => {
  const antes = () => llamadas.splice(0, llamadas.length);
  // lo en vivo
  await M.publicarEnVivo("g1", { sesion: { activa: true, k: "c3" } });
  await M.publicarEnVivo("g1", { sesion: { crono: null } });
  const id = await M.lanzarPregunta("g1", "  ¿Qué?  ", "Ana".repeat(40));
  await M.cerrarPregunta("g1");
  await M.responderPregunta("g1", "pabc", "f1", "Nova", "  Esto  ");
  await M.quitarRespuesta("g1__pabc__f1");
  c(id === "pabc" && canon(antes()) === canon([
    ["modClase", { accion: "poner", projectId: "g1", sala: "envivo", parte: "sesion", valor: { activa: true, k: "c3" } }],
    ["modClase", { accion: "poner", projectId: "g1", sala: "envivo", parte: "sesion", valor: { crono: null } }],
    ["modClase", { accion: "pregunta", projectId: "g1", sala: "envivo", texto: "¿Qué?", por: "Ana".repeat(40).slice(0, 80) }],
    ["modClase", { accion: "cerrarPregunta", projectId: "g1", sala: "envivo" }],
    ["modClase", { accion: "responder", projectId: "g1", sala: "envivo", pregunta: "pabc", fichaId: "f1", texto: "Esto" }],
    ["modClase", { accion: "quitarRespuesta", projectId: "g1", sala: "envivo", id: "g1__pabc__f1" }]]),
  "🔴 la sesión, la pregunta, su cierre, la respuesta y su retirada, por modClase (sala envivo), con los datos de siempre", llamadas);
  // dos publicaciones seguidas salen EN ORDEN aunque la primera tarde más (antes las escrituras de Firestore salían en orden)
  const orden = [];
  const L2 = new Function("llamar", "auth", "sesion", cuerpo)(async (fn, d) => { if (d.valor.k === "primera") await new Promise(r => setTimeout(r, 30)); orden.push(d.valor.k); return { ok: true }; }, {}, async () => null);
  await Promise.all([L2.publicarEnVivo("g1", { sesion: { k: "primera" } }), L2.publicarEnVivo("g1", { sesion: { k: "segunda" } })]);
  c(canon(orden) === canon(["primera", "segunda"]), "🔴 dos diapositivas seguidas llegan en el orden en que se pidieron (cola)", orden);
  // un fallo no frena las siguientes, y se lo cuenta a quien lo pidió
  let n = 0; const L3 = new Function("llamar", "auth", "sesion", cuerpo)(async () => { if (n++ === 0) throw new Error("sin red"); return { ok: true }; }, {}, async () => null);
  const f1 = await L3.publicarEnVivo("g1", { sesion: { k: 1 } }).then(() => "bien", e => e.message), f2 = await L3.publicarEnVivo("g1", { sesion: { k: 2 } }).then(() => "bien", e => e.message);
  c(f1 === "sin red" && f2 === "bien", "   un fallo se lo dice a quien lo pidió y no frena lo siguiente", [f1, f2]);
  // los avisos de antes, en el navegador, antes de llamar
  const llamadasVacias = llamadas.length;
  const e1 = await M.lanzarPregunta("g1", "  ", "x").then(() => null, e => e.message), e2 = await M.responderPregunta("g1", "p", "f", "a", " ").then(() => null, e => e.message);
  c(e1 === "Escribe la pregunta." && e2 === "Escribe tu respuesta." && llamadas.length === llamadasVacias, "   los avisos de siempre («Escribe la pregunta.», «Escribe tu respuesta.») salen antes de llamar", [e1, e2]);
  // la Academia
  await M.academiaGuardar({ alias: "Lyra", pasos: { a: 1 }, intruso: "no", claude: { x: 1 } });
  const todos = await M.academiaTodos();
  const profes = await M.academiaProfes();
  await M.academiaEditar("u1", { nombre: " Ana ", correo: "ANA@X.ES", t: 9 });
  await M.academiaQuitar("u1");
  const t = await M.academiaResponder("u1", "  Bien hecho  ", "Norberto");
  c(canon(antes()) === canon([
    ["modFormacion", { mod: "stargate", accion: "guardar", campos: { alias: "Lyra", pasos: { a: 1 } }, nombre: "Yo Mismo" }],
    ["modFormacion", { mod: "stargate", accion: "todos" }],
    ["modFormacion", { mod: "stargate", accion: "todos" }],
    ["modFormacion", { mod: "stargate", accion: "editar", uid: "u1", campos: { nombre: "Ana", correo: "ana@x.es" } }],
    ["modFormacion", { mod: "stargate", accion: "quitar", uid: "u1" }],
    ["modFormacion", { mod: "stargate", accion: "responder", uid: "u1", texto: "Bien hecho", de: "Norberto" }]]) && t === 1234,
  "🔴 guardar (solo sus campos), listar, corregir, echar y responder, por modFormacion (mod stargate), con los datos de siempre", llamadas);
  c(canon(todos.map(x => x.uid)) === canon(["u2", "u1"]) && canon(profes.map(x => [x.uid, x.correo, x.nombre, x.t])) === canon([["u1", "a@x.es", "Ana", 7], ["u2", "b@x.es", "Bea", 5]]),
    "   la lista deja fuera a quien no tiene correo; para crear grupos, con el correo en minúsculas y por nombre", [todos, profes]);

  console.log("\n  Ya no escribe desde el navegador (lo en vivo y la Academia)");
  const sinEscribir = ["publicarEnVivo", "lanzarPregunta", "cerrarPregunta", "responderPregunta", "quitarRespuesta", "academiaGuardar", "academiaEditar", "academiaQuitar", "academiaResponder"];
  c(sinEscribir.every(nombre => !/\b(setDoc|updateDoc|deleteDoc|addDoc)\(/.test(funcion2(nombre))),
    "🔴 ni un setDoc, updateDoc o deleteDoc en ninguna de esas nueve funciones");
  function funcion2(n) { const i = MOTOR.search(new RegExp("\\n(async )?function " + n + "\\(")); const j = MOTOR.indexOf("\n}", i); return MOTOR.slice(i, j + 2); }
  c(/function vigilarEnVivo\(perId, alCambiar\) \{\n  return onSnapshot\(doc\(db, ENVIVO, perId\)/.test(MOTOR) && /function vigilarRespuestas\(/.test(MOTOR) && /async function academiaMia\(\) \{[\s\S]{0,200}getDoc\(doc\(db, "stargate_formacion", yo\.uid\)\)/.test(MOTOR) &&
    /function academiaEscuchar\(fn\)[\s\S]{0,300}onSnapshot\(doc\(db, "stargate_formacion", yo\.uid\)/.test(MOTOR), "   y leer sigue siendo directo (vigilarEnVivo, vigilarRespuestas, miRespuesta, academiaMia, academiaEscuchar)");
  c(/directoCanal/.test(MOTOR) && /DIRECTO = "mod_directo"/.test(MOTOR) && /sala: "directo"/.test(MOTOR), "   y el juego del final (directoCanal, sala «directo») va por el servidor también: lo prueba la batería 141");

  console.log("\n  Lo mismo, paso a paso: el motor de antes escribiendo desde el navegador y el de ahora por el servidor, contra la consola de ensayo");
  const BASE = "19af6f49";
  let viejo = "";
  try { viejo = execFileSync("git", ["show", BASE + ":assets/js/motor.js"], { cwd: R, encoding: "utf8", maxBuffer: 16 << 20 }); } catch (e) { /* sin historial */ }
  if (!viejo) console.log("   (sin el historial de git: no tengo el motor de antes con el que comparar; me salto esta parte)");
  else {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sg-140-"));
    const fv = path.join(tmp, "motor_antes.js"); fs.writeFileSync(fv, viejo);
    /** Los ids al azar de una pregunta (p + 10 letras) se nombran por orden de aparición: se compara QUÉ se escribe, no qué azar tocó. */
    const normalizar = (t) => { const nombres = {};
      return JSON.parse(JSON.stringify(t).replace(/(?<![A-Za-z0-9])p[a-km-z2-9]{10}(?![A-Za-z0-9])/g, (x) => nombres[x] || (nombres[x] = "PREG" + (Object.keys(nombres).length + 1)))); };
    const correr = (motor) => {
      const r = spawnSync(process.execPath, [path.join(__dirname, "sdk_guion.mjs"), motor, "--ensayo"], { cwd: R, encoding: "utf8", maxBuffer: 64 << 20, env: Object.assign({}, process.env, { TZ: "Europe/Madrid" }) });
      try { return normalizar(JSON.parse(r.stdout)); } catch (e) { return [["💥 no ha salido la traza", (r.stderr || "").slice(0, 2000)]]; }
    };
    const a = correr(fv), b = correr(path.join(R, "assets/js/motor.js"));
    c(a.length > 25 && !a.some(x => /^💥/.test(x[0])), "   el guion corre entero con el motor de antes (" + a.length + " pasos)", a.filter(x => /^💥/.test(x[0])));
    c(!b.some(x => /^💥/.test(x[0])), "   y con el de ahora", b.filter(x => /^💥/.test(x[0])));
    c(canon(a.map(x => x[0])) === canon(b.map(x => x[0])), "🔴 los mismos pasos, en el mismo orden", a.map((x, i) => x[0] === (b[i] || [])[0] ? null : [x[0], (b[i] || [])[0]]).filter(Boolean));
    let mismos = 0;
    a.forEach((x, i) => { const y = b[i] || []; if (canon(x[1]) === canon(y[1])) mismos++; else c(false, "🔴 da lo mismo · " + x[0], { antes: x[1], ahora: y[1] }); });
    c(mismos === a.length, "🔴 " + mismos + " de " + a.length + " pasos, idénticos (lo que devuelve cada función o su error, y cada documento que queda tocado)");
    const tocados = a.filter(x => /^tocado · /.test(x[0])).map(x => x[0].slice(9));
    c(tocados.indexOf("stargate_envivo/nave-escuela") >= 0 && tocados.some(x => /^stargate_respuestas\//.test(x)) && tocados.indexOf("stargate_formacion/sim-docente") >= 0,
      "   y lo comparado incluye lo que se escribe: la sala en vivo, la respuesta y la ficha de la Academia", tocados);
    const paso = (t, n) => (t.find(x => x[0] === n) || [])[1];
    c(canon(paso(b, "academiaGuardar")) === canon(paso(a, "academiaGuardar")) && !!paso(b, "academiaMia").ok && paso(b, "academiaMia: tras quitar").ok === null && paso(b, "academiaTodos: tras corregir y responder").ok.length === 1,
      "   (la ficha de la Academia nace con sus campos, se corrige, recibe la respuesta del Mando y se echa)");
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  console.log("\n  El servidor (GamificaPro functions/mods/stargate.js)");
  const GP = [process.env.GAMIFICAPRO_DIR, "/Users/nor/Claude/vibewebs/gamificapro"].filter(Boolean).map(d => path.join(d, "functions", "mods", "stargate.js")).find(f => fs.existsSync(f));
  if (!GP) console.log("   (sin la carpeta de gamificapro al lado: la configuración del servidor no se comprueba aquí)");
  else {
    const S = fs.readFileSync(GP, "utf8");
    c(/'formacion', 'clase'\]/.test(S) || (/'formacion'/.test(S) && /'clase'/.test(S)), "   STARGATE tiene encendidas las piezas «formacion» y «clase»");
    c(/coleccion: 'stargate_formacion'/.test(S) && /identidad: \{ nombre: 80, correo: 120 \}/.test(S) && /hora: 'ms'/.test(S) && /textos: \{ alias: 60 \}/.test(S) &&
      /mapas: \{ pasos: 60, diseno: 10, preguntas: 80, feedback: 120, avance: 8 \}/.test(S) && /leen: \['mando', 'vitalicios', 'referentes'\]/.test(S) && /gestionan: \['mando'\]/.test(S) &&
      /hilo: \{ campo: 'mando', max: 200, texto: 2000, de: 80, firma: 'El Mando' \}/.test(S), "   la Academia: sus campos y topes (los de las reglas), quién la lee y quién la gestiona (el Mando), y el hilo");
    const CAMPOS = (MOTOR.match(/const ACADEMIA_CAMPOS = \[([^\]]*)\]/) || ["", ""])[1].replace(/["\s]/g, "").split(",").sort();
    c(canon(CAMPOS) === canon(["alias", "avance", "diseno", "feedback", "pasos", "preguntas"]), "   y los campos que filtra la web son los que el servidor deja guardar", CAMPOS);
    c(/envivo: \{\s*coleccion: 'mod_envivo',\s*sello: true,\s*partes: \{ sesion: 'mezcla' \},\s*sesion: 'sesion',\s*pregunta: \{ campo: 'pregunta', texto: 300, por: 80 \},\s*sinCongelar: true,\s*respuestas: \{ forma: 'texto', coleccion: 'mod_respuestas', texto: 280 \},/.test(S),
      "   lo en vivo: la sala (con su sello), la sesión que se mezcla, la pregunta (300 y 80), sin congelados y la respuesta de texto (280)");
    // 8-oct (tarde, tanda 1 de «adelantar lo de Navidad») · donde escribe el servidor es donde lee la web
    c(/const ENVIVO = "mod_envivo", RESPUESTAS = "mod_respuestas", DIRECTO = "mod_directo";/.test(MOTOR) && /directo: \{\s*coleccion: 'mod_directo',/.test(S),
      "🔴 la web lee lo en vivo y el juego del final de mod_envivo, mod_respuestas y mod_directo: donde los escribe el servidor");
    c(/const comoAntes = \(d\) => \{[^\n]*delete x\.mod; delete x\.espejoDe; delete x\.espejoHora;/.test(MOTOR) &&
      /alCambiar\(s\.exists\(\) \? comoAntes\(s\.data\(\)\) : \{\}\)/.test(MOTOR) && /\.\.\.comoAntes\(d\.data\(\)\)/.test(MOTOR) && /const d = comoAntes\(s\.data\(\)\);/.test(MOTOR),
      "   y quita al leer lo que pone el motor (su `mod` y lo del espejo): la sala, las respuestas, la mía y lo mío del juego, como antes");
  }

  console.log("\n  Batería 143 · la Academia y lo en vivo, por el servidor");
  console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
  process.exit(fallos.length ? 1 : 0);
})();
