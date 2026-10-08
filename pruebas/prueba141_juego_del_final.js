'use strict';
/**
 * BATERÍA 141 · EL JUEGO DEL FINAL, POR EL SERVIDOR (8-oct-2026, GamificaPro docs/PLAN_CENTRALIZAR.md fase 6, «STARGATE, después», punto 3)
 *
 * Norberto, 8-oct: «pasa al motor YA». `directoCanal` (motor.js, el canal de juegos/directo/canal.js) escribía desde el navegador en
 * `stargate_directo/{grupo}` (el estado), `jugadores/{ficha}` y `eventos`; ahora lo hace el servidor del motor (GamificaPro
 * `modClase`, sala «directo» de functions/mods/stargate.js), con los MISMOS documentos y campos:
 *   · el estado (el docente)        → modClase { accion: "poner", sala: "directo", parte: "estado", valor }
 *   · los sucesos del docente       → modClase { accion: "evento", sala: "directo", t, datos }
 *   · el sabotaje del recluta       → modClase { accion: "evento", sala: "directo", t: "sabotaje", datos: { id }, fichaId }
 *   · el jugador (hola y puntos)    → modClase { accion: "responder", sala: "directo", fichaId, avatar, listo, puntos, stats }
 * Leer sigue siendo directo (onSnapshot) y la tanda de un segundo se queda. El alias, el grupo, el uid y la hora los pone el servidor.
 *
 * Qué se demuestra:
 *   1. cada llamada exacta (nombre y datos), corriendo `directoCanal` de motor.js contra un mostrador;
 *   2. que ya no escribe desde el navegador (ni setDoc, ni addDoc, ni updateDoc, ni deleteDoc) y que leer sigue directo;
 *   3. el mismo guion (pruebas/sdk_guion.mjs --ensayo --directo) con el motor.js de ANTES (escribiendo desde el navegador) y el de
 *      ahora (por el servidor de la consola de ensayo), en los dos papeles —la pantalla del docente y el móvil de un recluta—: lo que
 *      oye cada uno y cada documento tocado, idénticos;
 *   4. que todo lo que la web manda lo acepta la configuración del servidor (functions/mods/stargate.js, sala «directo»), y que la
 *      consola de ensayo simula la sala.
 * (Que el servidor de verdad escribe lo mismo que el navegador, con las reglas, lo prueba el emulador de GamificaPro:
 *  tests/emulador/mod-clase.test.ts.)
 */
const fs = require("fs"), path = require("path"), os = require("os"), assert = require("assert"), { execFileSync, spawnSync } = require("child_process");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + JSON.stringify(dato).slice(0, 600))); };
const canon = v => JSON.stringify(v, (k, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.keys(x).sort().reduce((o, n) => (o[n] = x[n], o), {}) : x));
const espera = ms => new Promise(r => setTimeout(r, ms));

const MOTOR = L("assets/js/motor.js"), SIM = L("assets/js/motor_sim.js");
const funcion = (T, n) => { const i = T.indexOf("\nfunction " + n + "("); assert.ok(i >= 0, n); const j = T.indexOf("\n}\n", i); return T.slice(i, j + 3); };
const CANAL = funcion(MOTOR, "directoCanal");

(async () => {
  console.log("  Las llamadas exactas (directoCanal de motor.js, contra un mostrador)");
  // el mostrador: la sesión, Firestore (solo se lee, y se apunta qué se escucha) y `llamar`, que apunta cada llamada al servidor
  const llamadas = [], oyendo = [], escrituras = [];
  // 8-oct (tarde) · dónde lee (mod_directo) y lo que quita al leer, de motor.js tal cual
  const SITIOS = (MOTOR.match(/\nconst ENVIVO = [^\n]*\nconst comoAntes = [^\n]*\n/) || [""])[0];
  c(/DIRECTO = "mod_directo"/.test(SITIOS) && /const comoAntes/.test(SITIOS), "   la sala del juego, de motor.js: mod_directo (con lo que se quita al leer)");
  const montar = (conLlamar) => new Function("auth", "db", "doc", "collection", "query", "where", "onSnapshot", "getDoc", "setDoc", "addDoc", "updateDoc", "deleteDoc", "llamar",
    SITIOS + "\n" + CANAL + "\nreturn directoCanal;")(
    { currentUser: { uid: "yo" } }, {},
    (...a) => ({ doc: a.slice(1).join("/") }), (...a) => ({ col: a.slice(1).join("/") }), (...a) => ({ q: a }), (...a) => ({ w: a }),
    (ref, ok1) => { oyendo.push(ref.doc || ref.col || (ref.q && ref.q[0].col)); return () => {}; },
    async (ref) => ({ exists: () => true, data: () => ({ actualizado: Date.now(), listo: true, puntos: 12, stats: { a: 1 } }) }),
    (...a) => { escrituras.push(["setDoc", a]); return Promise.resolve(); }, (...a) => { escrituras.push(["addDoc", a]); return Promise.resolve(); },
    (...a) => { escrituras.push(["updateDoc", a]); return Promise.resolve(); }, (...a) => { escrituras.push(["deleteDoc", a]); return Promise.resolve(); },
    conLlamar || (async (fn, d) => { llamadas.push([fn, JSON.parse(JSON.stringify(d))]); return { ok: true }; }));
  const directoCanal = montar();
  const antes = () => llamadas.splice(0, llamadas.length);

  // la pantalla del docente
  const D = directoCanal("g1", true, null, () => {});
  c(canon(oyendo.splice(0)) === canon(["mod_directo/g1", "mod_directo/g1/eventos", "mod_directo/g1/jugadores"]), "   el docente escucha la sala, los sucesos y los jugadores (leer sigue directo)");
  D.enviar({ t: "estado", fase: "sala", cfg: { modo: "defensa" }, eqs: [{ id: "e1" }], vacio: undefined });
  await espera(40);
  c(canon(antes()) === canon([["modClase", { projectId: "g1", sala: "directo", accion: "poner", parte: "estado", valor: { fase: "sala", cfg: { modo: "defensa" }, eqs: [{ id: "e1" }] } }]]),
    "🔴 el estado: poner, parte «estado», sin la «t» ni lo indefinido (el documento entero lo escribe el servidor)", llamadas);
  D.enviar({ t: "bomba", quedan: 2 });
  D.enviar({ t: "sabotaje", contra: "e1", de: "Ana" });
  D.enviar({ t: "curar", escudo: 5 });
  await espera(40);
  c(canon(antes()) === canon([
    ["modClase", { projectId: "g1", sala: "directo", accion: "evento", t: "bomba", datos: { t: "bomba", quedan: 2 } }],
    ["modClase", { projectId: "g1", sala: "directo", accion: "evento", t: "sabotaje", datos: { t: "sabotaje", contra: "e1", de: "Ana" } }],
    ["modClase", { projectId: "g1", sala: "directo", accion: "evento", t: "curar", datos: { t: "curar", escudo: 5 } }]]),
  "🔴 los sucesos del docente: evento, con el mensaje entero en «datos» (la pantalla de los móviles lo lee igual que antes)", llamadas);
  D.enviar({ fase: "sin t" }); D.enviar(null);
  await espera(20);
  c(llamadas.length === 0, "   sin «t» (o sin nada) no llama");
  // varios estados seguidos: la tanda de un segundo se queda (como mucho uno por segundo y por documento; sale el último)
  for (const fase of ["a", "b", "c"]) D.enviar({ t: "estado", fase });
  await espera(1200);
  const fases = antes().map(x => x[1].valor.fase);
  c(canon(fases) === canon(["c"]), "   la tanda de un segundo se queda: de tres estados seguidos sale solo el último", fases);

  // el móvil de un recluta
  const J = directoCanal("g1", false, { id: "f1", alias: "Nova", avatar: "a/b.png?x=1", fantasma: false }, () => {});
  c(canon(oyendo.splice(0)) === canon(["mod_directo/g1", "mod_directo/g1/eventos"]), "   el recluta escucha la sala y los sucesos, pero no a los jugadores");
  J.enviar({ t: "hola", listo: true });
  await espera(40);
  c(canon(antes()) === canon([["modClase", { projectId: "g1", sala: "directo", accion: "responder", fichaId: "f1", avatar: "a/b.png?x=1", listo: true, puntos: 0, stats: {} }]]),
    "🔴 «hola»: responder, con su ficha, su avatar, listo, cero puntos y las cifras vacías (el alias lo pone el servidor, de la ficha)", llamadas);
  J.enviar({ t: "pts", puntos: 12.6, stats: { a: 1, b: { c: 2 } } });
  await espera(1200);
  c(canon(antes()) === canon([["modClase", { projectId: "g1", sala: "directo", accion: "responder", fichaId: "f1", avatar: "a/b.png?x=1", listo: true, puntos: 13, stats: { a: 1, b: { c: 2 } } }]]),
    "🔴 los puntos: redondeados, y «listo» se conserva de antes", llamadas);
  J.enviar({ t: "pts", puntos: 999999 }); await espera(1200);
  const tope = antes()[0][1].puntos;
  J.enviar({ t: "pts", puntos: -3 }); await espera(1200);
  const suelo = antes()[0][1].puntos;
  c(tope === 100000 && suelo === 0, "   con el tope (100.000) y el suelo (0) de siempre", [tope, suelo]);
  J.enviar({ t: "sabotaje", id: "f1" });
  await espera(40);
  c(canon(antes()) === canon([["modClase", { projectId: "g1", sala: "directo", accion: "evento", t: "sabotaje", datos: { id: "f1" }, fichaId: "f1" }]]),
    "🔴 el sabotaje: evento «sabotaje», con su ficha (lo único que el servidor deja mandar al alumnado)", llamadas);
  llamadas.length = 0;
  const larga = "a".repeat(400);
  const JL = directoCanal("g1", false, { id: "f2", avatar: larga }, () => {}); JL.enviar({ t: "hola" }); await espera(40);
  c(antes()[0][1].avatar.length === 300, "   el avatar, cortado a 300 como antes");
  // modo fantasma, sin ficha, sin sesión: no escriben
  const F = directoCanal("g1", false, { id: "f3", avatar: "", fantasma: true }, () => {}); F.enviar({ t: "hola" }); F.enviar({ t: "pts", puntos: 5 }); F.enviar({ t: "sabotaje" });
  const S0 = directoCanal("g1", false, null, () => {}); S0.enviar({ t: "hola" }); S0.enviar({ t: "sabotaje" });
  await espera(1200);
  c(llamadas.length === 0, "🔴 el modo fantasma (5-oct) y quien no tiene ficha no escriben en la sala");
  // «lo mío» al volver: lee directo, y retoma sin pisar lo que llevaba
  const J2 = directoCanal("g1", false, { id: "f4", avatar: "z.png" }, () => {});
  const mio = await J2.mio();
  J2.enviar({ t: "sabotaje" }); J2.enviar({ t: "pts", puntos: 20 }); await espera(1200);
  const dd = antes().filter(x => x[1].accion === "responder")[0][1];
  c(mio && mio.puntos === 12 && dd.listo === true && dd.puntos === 20 && canon(dd.stats) === canon({}), "   al volver, mio() lee su documento y retoma con su «listo»", dd);
  // los fallos del servidor no rompen el juego (como cuando setDoc/addDoc fallaban en silencio)
  const roto = montar(async () => { throw Object.assign(new Error("no"), { code: "functions/permission-denied" }); });
  const R1 = roto("g1", true, null, () => {}), R2 = roto("g1", false, { id: "f5", avatar: "" }, () => {});
  let sinRomper = true;
  try { R1.enviar({ t: "estado", fase: "x" }); R1.enviar({ t: "bomba" }); R2.enviar({ t: "hola" }); R2.enviar({ t: "sabotaje" }); await espera(1200); } catch (e) { sinRomper = false; }
  c(sinRomper, "   si el servidor dice que no (o no está), el juego sigue: se traga el error, como antes");
  // en orden: un estado lento no lo pisa uno más nuevo
  const orden = [];
  const lento = montar(async (fn, d) => { if (d.valor && d.valor.fase === "uno") await espera(1300); orden.push(d.valor.fase); return { ok: true }; });
  const LD = lento("g1", true, null, () => {});
  LD.enviar({ t: "estado", fase: "uno" }); await espera(30); LD.enviar({ t: "estado", fase: "dos" }); await espera(3200);
  c(canon(orden) === canon(["uno", "dos"]), "🔴 un estado lento no lo pisa uno más nuevo (las llamadas del estado y del jugador van en orden)", orden);

  console.log("\n  Ya no escribe desde el navegador (y leer sigue directo)");
  const sinSet = n => !/\b(setDoc|updateDoc|deleteDoc|addDoc)\(/.test(n);
  c(sinSet(CANAL) && sinSet(funcion(SIM, "directoCanal")), "🔴 ni un setDoc, addDoc, updateDoc o deleteDoc en directoCanal (motor.js y motor_sim.js, igual)");
  c(/onSnapshot\(sala,/.test(CANAL) && /onSnapshot\(query\(collection\(db, DIRECTO, perId, "eventos"\), where\("creado", ">", t0 - 2000\)\)/.test(CANAL) &&
    /onSnapshot\(collection\(db, DIRECTO, perId, "jugadores"\)/.test(CANAL) && /getDoc\(doc\(db, DIRECTO, perId, "jugadores", yo\.id\)\)/.test(CANAL) &&
    /const sala = doc\(db, DIRECTO, perId\);/.test(CANAL) && /DIRECTO = "mod_directo"/.test(MOTOR), "   la sala, los sucesos, los jugadores y «lo mío» se siguen leyendo directo (onSnapshot y getDoc)");
  c(funcion(SIM, "directoCanal").replace(/\s+/g, "") === CANAL.replace(/\s+/g, ""), "   y la consola de ensayo (motor_sim.js, que genera el build) lleva la misma función");
  c(!/sala: "directo"/.test(MOTOR.replace(CANAL, "")) && /sala: "directo"/.test(CANAL), "   la sala «directo» solo se nombra en directoCanal");

  console.log("\n  Lo mismo, paso a paso: el motor de antes escribiendo desde el navegador y el de ahora por el servidor, contra la consola de ensayo");
  const BASE = "4244c69a";
  let viejo = "";
  try { viejo = execFileSync("git", ["show", BASE + ":assets/js/motor.js"], { cwd: R, encoding: "utf8", maxBuffer: 16 << 20 }); } catch (e) { /* sin historial */ }
  if (!viejo) console.log("   (sin el historial de git: no tengo el motor de antes con el que comparar; me salto esta parte)");
  else {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sg-141-"));
    const fv = path.join(tmp, "motor_antes.js"); fs.writeFileSync(fv, viejo);
    const correr = (motor, ...extra) => {
      const r = spawnSync(process.execPath, [path.join(__dirname, "sdk_guion.mjs"), motor, "--ensayo", "--directo", ...extra], { cwd: R, encoding: "utf8", maxBuffer: 64 << 20, env: Object.assign({}, process.env, { TZ: "Europe/Madrid" }) });
      try { return JSON.parse(r.stdout); } catch (e) { return [["💥 no ha salido la traza", (r.stderr || "").slice(0, 2000)]]; }
    };
    for (const [papel, extra] of [["la pantalla del docente", []], ["el móvil de un recluta", ["--yo=prueba_triton"]]]) {
      const a = correr(fv, ...extra), b = correr(path.join(R, "assets/js/motor.js"), ...extra);
      console.log("  · " + papel);
      c(a.length > 10 && !a.some(x => /^💥/.test(x[0])), "   el guion corre entero con el motor de antes (" + a.length + " pasos)", a.filter(x => /^💥/.test(x[0])));
      c(!b.some(x => /^💥/.test(x[0])), "   y con el de ahora", b.filter(x => /^💥/.test(x[0])));
      c(canon(a.map(x => x[0])) === canon(b.map(x => x[0])), "🔴 los mismos pasos, en el mismo orden", a.map((x, i) => x[0] === (b[i] || [])[0] ? null : [x[0], (b[i] || [])[0]]).filter(Boolean));
      let mismos = 0;
      a.forEach((x, i) => { const y = b[i] || []; if (canon(x[1]) === canon(y[1])) mismos++; else c(false, "🔴 da lo mismo · " + x[0], { antes: x[1], ahora: y[1] }); });
      c(mismos === a.length, "🔴 " + mismos + " de " + a.length + " pasos, idénticos (lo que oye cada uno, lo que queda en la sala y cada documento tocado)");
      const tocados = a.filter(x => /^tocado · /.test(x[0])).map(x => x[0].slice(9));
      c(tocados.some(x => /^stargate_directo\/[^/]+$/.test(x)) || tocados.some(x => /\/jugadores\//.test(x)), "   y lo comparado incluye lo que se escribe en la sala", tocados);
    }
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  console.log("\n  El servidor (GamificaPro functions/mods/stargate.js) acepta todo lo que la web manda");
  const GPD = [process.env.GAMIFICAPRO_DIR, "/Users/nor/Claude/vibewebs/gamificapro"].filter(Boolean).find(d => fs.existsSync(path.join(d, "functions", "mods", "stargate.js")));
  if (!GPD) console.log("   (sin la carpeta de gamificapro al lado: la configuración del servidor no se comprueba aquí)");
  else {
    const S = fs.readFileSync(path.join(GPD, "functions", "mods", "stargate.js"), "utf8");
    c(/directo: \{\s*coleccion: 'mod_directo',\s*sello: true,\s*partes: \{ estado: 'documento' \},\s*sinCongelar: true,\s*respuestas: \{ forma: 'jugador', sub: 'jugadores', puntos: 100000, avatar: 300 \},\s*eventos: \{ sub: 'eventos', alumno: \['sabotaje'\] \},/.test(S),
      "   la sala: el estado como documento entero (con su sello), sin congelados, el jugador (puntos hasta 100.000, avatar de 300) y solo el sabotaje del alumnado");
    const MC = fs.readFileSync(path.join(GPD, "functions", "modClase.js"), "utf8");
    c(/accion === 'evento'|\/\/ evento/.test(MC) && /ev\.alumno \|\| \[\]\)\.includes\(t\)/.test(MC) && /t\.length > 40/.test(MC), "   y modClase deja al alumnado los tipos de «alumno» y corta el tipo de suceso a 40 letras");
    // lo que manda la web
    const tiposDocente = new Set(), tiposAlumno = new Set();
    for (const f of ["juegos/directo/proyector.js", "juegos/directo/alumno.js"]) {
      const T = L(f), re = /enviar\(\{\s*t:\s*['"]([a-z_]+)['"]/g; let m;
      while ((m = re.exec(T))) (f.endsWith("alumno.js") ? tiposAlumno : tiposDocente).add(m[1]);
    }
    const alumno = ["sabotaje"];
    c([...tiposDocente].length >= 5 && [...tiposDocente].every(t => t.length <= 40), "   los sucesos y el estado de la pantalla del docente: tipos cortos (≤ 40)", [...tiposDocente]);
    c(canon([...tiposAlumno].sort()) === canon(["hola", "pts", "sabotaje"]), "   el móvil del recluta solo manda hola, pts y sabotaje", [...tiposAlumno]);
    c(alumno.every(t => new RegExp("alumno: \\[[^\\]]*'" + t + "'").test(S)), "   y de ellos, el servidor deja pasar como suceso el sabotaje (hola y pts van por «responder»)");
  }

  console.log("\n  La consola de ensayo simula la sala (assets/js/sim/firebase_sim.js)");
  const SIMF = L("assets/js/sim/firebase_sim.js");
  c(/if \(x\.sala === "directo"\) return directo\(x, per, ahora\);/.test(SIMF) && /function directo\(x, per, ahora\)/.test(SIMF), "   modClase contesta a la sala «directo»");
  c(/Esto es del equipo docente del grupo\./.test(SIMF) && /Eso solo lo puede mandar el equipo docente\./.test(SIMF) && /Esa ficha no es tuya en este grupo\./.test(SIMF) && /Esos puntos no valen\./.test(SIMF) && /Ese avatar no vale\./.test(SIMF),
    "   con las mismas negativas que el servidor (solo el docente pone el estado, el alumnado solo el sabotaje, su ficha, los puntos y el avatar)");

  console.log("\n  Batería 141 · el juego del final, por el servidor");
  console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
  process.exit(fallos.length ? 1 : 0);
})();
