/**
 * EL GUION DE LA BATERÍA 138 (7-oct-2026): corre UNA centralita (motor.js) contra la consola de ensayo, con el reloj parado y el
 * azar sembrado, y escribe en la salida lo que ha pasado paso a paso. La batería lo lanza dos veces, en procesos aparte: con el
 * motor.js de ANTES de los pasos 4-11 del SDK de GamificaPro (del historial de git) y con el de ahora, y compara las dos trazas.
 *
 *   node pruebas/sdk_guion.mjs <motor.js> [--yo=<uid>] [--buzon]
 *
 * Firestore y Auth son los del ensayo (assets/js/sim/firebase_sim.js, el de este repo, con la Nave Escuela y un segundo grupo);
 * las funciones del servidor, un mostrador que apunta cada llamada y contesta lo que dice `RESPUESTAS` (o el error que se le
 * pida). Lo que se compara: lo que devuelve cada función (o su error: mensaje y código), las llamadas al servidor, lo que se
 * avisa por el camino y, al final, cada documento tocado.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";

const R = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const L = (f) => fs.readFileSync(path.join(R, f), "utf8");
const [, , MOTOR_FICHERO, ...OPC] = process.argv;

// ── el reloj parado y el azar sembrado (lo mismo en las dos pasadas)
const T0 = Date.UTC(2026, 9, 7, 9, 30, 0);
const DateReal = Date;
class DateParado extends DateReal { constructor(...a) { if (a.length) super(...a); else super(T0); } static now() { return T0; } }
globalThis.Date = DateParado;
let semilla = 20261007;
const azar = () => { semilla = (semilla + 0x6D2B79F5) | 0; let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
Math.random = azar;
Object.defineProperty(globalThis, "crypto", { configurable: true, value: {
  getRandomValues(a) { for (let i = 0; i < a.length; i++) a[i] = Math.floor(azar() * 4294967296) % (a instanceof Uint8Array ? 256 : 4294967296); return a; },
  subtle: webcrypto.subtle } });

// ── el navegador de mentira
const guardado = {}, sesionGuardada = {};
globalThis.self = globalThis;
globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.localStorage = { getItem: (k) => (k in guardado ? guardado[k] : null), setItem: (k, v) => { guardado[k] = String(v); }, removeItem: (k) => { delete guardado[k]; } };
globalThis.sessionStorage = { getItem: (k) => (k in sesionGuardada ? sesionGuardada[k] : null), setItem: (k, v) => { sesionGuardada[k] = String(v); }, removeItem: (k) => { delete sesionGuardada[k]; } };
globalThis.location = { hostname: "stargate.test", origin: "https://stargate.test", href: "https://stargate.test/ensayo.html" };
const avisos = [];
globalThis.document = { dispatchEvent: (e) => { avisos.push(e.type); return true; } };
globalThis.SG_FIREBASE = { projectId: "ensayo" };

// la Nave Escuela y un segundo grupo, «grupo-b», donde quien entra NO es del equipo (para alistarse como recluta)
const DATOS = JSON.parse(L("assets/sim/escuela.json"));
DATOS.generado = T0;
const D = DATOS.docs, NAVE = "nave-escuela", B = "grupo-b";
D["projects/" + B] = Object.assign(JSON.parse(JSON.stringify(D["projects/" + NAVE])), { name: "GRUPO B", joinCode: "BBBBBB", coTeacherEmails: ["dani@ensayo.invalid"], ownerId: "otro" });
D["projects/" + B + "/privado/stargate"] = { docentes: [{ nombre: "Dani Docente", correo: "dani@ensayo.invalid", rol: "referente", panel: "" }] };
for (const k of Object.keys(D)) {
  const m = k.match(/^(missions|rewards)\/nave-escuela__(.+)$/);
  if (m && (m[1] === "missions" ? /^(H1|L1|X1)$/.test(m[2]) : /^(rec1|rec6|rec7|cromo_P1_bran|heroe_H01_custodio|premio_sorteo1|sorteo1)$/.test(m[2])))
    D[m[1] + "/" + B + "__" + m[2]] = Object.assign(JSON.parse(JSON.stringify(D[k])), { projectId: B });
}
D["stargate_alias/" + B + "__reservado sin ficha"] = { projectId: B, uid: "alguien", alias: "Reservado Sin Ficha", creado: 1 };
globalThis.__SG_BUZON_ABIERTO = OPC.indexOf("--buzon") >= 0;
const YO = (OPC.find((x) => x.startsWith("--yo=")) || "").slice(5);
if (YO) DATOS.yo = { uid: YO, nombre: "Recluta " + YO, correo: YO + "@ensayo.invalid" };
globalThis.fetch = async (u) => {
  if (/escuela\.json/.test(String(u))) return { ok: true, status: 200, json: async () => JSON.parse(JSON.stringify(DATOS)) };
  throw new Error("sin red en el guion: " + u);
};

// ── el SDK, el paquete y el catálogo, como en la página
const FIJADO = L("_build_site.py").match(/^SDK_FIJADO = "(mod-sdk\.v1\.[0-9a-f]{10}\.js)"$/m)[1];
vm.runInThisContext(L("assets/js/" + FIJADO));
vm.runInThisContext(L("motor/paquete.js"));
globalThis.SG_CATALOGO = JSON.parse(L("motor/catalogo.json"));

// ── el servidor: un mostrador que apunta y contesta
const traza = [];
const apunta = (paso, x) => traza.push([paso, JSON.parse(JSON.stringify(x === undefined ? null : x))]);
const ERRORES = {};   // nombre → { code, message } (la próxima llamada a esa función falla así)
const RESPUESTAS = {
  completeMission: { ok: true }, modOtorgarReto: { ok: true, xp: 50 }, stargateAnularReto: { ok: true, xp: 10, creditos: 5, noRetirados: 0 },
  applyXpDelta: { ok: true }, modFichar: { ok: true, xp: 15, creditos: 30, racha: 2, extra: 0, regalo: { rewardId: NAVE + "__rec1", usos: 3 } },
  consumeItem: { ok: true, botin: NAVE + "__cromo_P1_bran" }, castVote: { ok: true },
  claimLinkedReward: { ok: true, participaciones: 2 }, stargateHeroeRepetido: { ok: true, creditos: 40, rewardId: NAVE + "__rec1", usos: 3 },
  stargateEquipo: (d) => (d.projectIds ? { ok: true, hechos: d.projectIds.slice(1), fallos: [{ per: d.projectIds[0], error: "no" }] } : { ok: true, persona: Object.assign({ eco: 1 }, d.persona) }),
  stargateAlumno: { ok: true, estado: "congelado" }, modVale: { ok: true, estado: "aprobado" },
  stargateSortear: { ok: true, ganadores: ["Tritón"] }, modSortear: { ok: true, ganadores: ["Tritón"] },
  stargateSorteosPendientes: { ok: true, resueltos: [] }, stargateOferta: (d) => ({ ok: true, oferta: d.accion === "crear" ? "rewards-oferta-" + d.projectId : undefined }),
  stargateFantasma: { ok: true }, miPapel: { ok: true, mods: { stargate: { vitalicio: false, mando: false } } },
};
globalThis.__SG_SERVIDOR = async (nombre, datos) => {
  apunta("→ " + nombre, datos);
  if (ERRORES[nombre]) { const x = ERRORES[nombre]; delete ERRORES[nombre]; throw Object.assign(new Error(x.message), { code: x.code }); }
  const r = RESPUESTAS[nombre];
  return { data: typeof r === "function" ? r(datos) : JSON.parse(JSON.stringify(r === undefined ? { ok: true } : r)) };
};

// ── la centralita, con los imports del ensayo (como motor_simulador() de _build_site.py) y el mostrador
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sg-guion-"));
const sim = L("assets/js/sim/firebase_sim.js");
fs.mkdirSync(path.join(tmp, "js", "sim"), { recursive: true });
// (el buzón no se guarda en el ensayo, a propósito; aquí se abre con una marca para poder comparar lo que escribe)
const simAbierto = sim.replace(/^const NO_SE_GUARDA = \[/m, "const NO_SE_GUARDA = globalThis.__SG_BUZON_ABIERTO ? [] : [");
if (simAbierto === sim) throw new Error("el ensayo ya no tiene NO_SE_GUARDA: revisa el guion");
fs.writeFileSync(path.join(tmp, "js", "sim", "firebase_sim.mjs"), simAbierto);
const paqSim = (sim.match(/^import "\.\/(mod-sim\.v1\.[0-9a-f]{10}\.js)";$/m) || [])[1];
if (paqSim) fs.copyFileSync(path.join(R, "assets/js/sim", paqSim), path.join(tmp, "js", "sim", paqSim));
fs.writeFileSync(path.join(tmp, "js", "mostrador.mjs"),
  "export const getFunctions = () => ({});\nexport const connectFunctionsEmulator = () => {};\n" +
  "export const httpsCallable = (fns, nombre) => (datos) => globalThis.__SG_SERVIDOR(nombre, datos);\n");
let src = fs.readFileSync(MOTOR_FICHERO, "utf8");
src = src.replace(/from "https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-(?:app|auth|firestore)\.js"/g, 'from "./sim/firebase_sim.mjs?h=guion"')
         .replace(/from "https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-functions\.js"/, 'from "./mostrador.mjs"');
fs.writeFileSync(path.join(tmp, "js", "motor.mjs"), src);

try {
  await import(pathToFileURL(path.join(tmp, "js", "motor.mjs")).href);
  const M = globalThis.SG.MOTOR;
  const paso = async (nombre, fn) => {
    // (el azar, sembrado de nuevo en cada paso: lo que saque un paso no depende de cuánto sacaron los de antes)
    semilla = [...nombre].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) | 0, 7);
    const progreso = [];
    try { apunta(nombre, { ok: await fn((t) => progreso.push(t)), progreso }); }
    catch (e) { apunta(nombre, { error: String((e && e.message) || e), code: (e && e.code) || null, progreso }); }
  };
  const ficha = async (per, alias) => (await M.getDocs(M.query(M.collection(M.db, "student_profiles"), M.where("projectId", "==", per), M.where("displayName", "==", alias)))).docs[0];
  const UNA = (await ficha(NAVE, "Tritón")).id;
  const datosAlta = (alias, comandante) => ({ alias, comandante, avatar: { cara: 1 }, bio: "hola", nombre: "Ana", apellidos: "Pi", correo: "", bitacora: "",
    consentimiento: { v: "2026-10-05", t: 5 } });

  // ─── paso 4 · alistarse y el alias
  await paso("alistar: recluta en un grupo ajeno (sin equipo)", (a) => M.alistar(B, datosAlta("Nova Prueba", "Dani Docente"), a));
  await paso("alistar: del equipo docente (nace fantasma)", (a) => M.alistar(NAVE, datosAlta("Fantasma Docente", "Docente de ensayo"), a));
  await paso("alistar: alias de otro recluta (sin tildes ni mayúsculas)", (a) => M.alistar(NAVE, datosAlta("triton", "Docente de ensayo"), a));
  await paso("alistar: un alias reservado sin ficha (de antes)", (a) => M.alistar(B, datosAlta("reservado sin ficha", "Dani Docente"), a));
  await paso("alistar: un grupo que no existe", (a) => M.alistar("no-existe", datosAlta("Quien Sea", "X"), a));
  await paso("aliasOcupado: con uid", () => M.aliasOcupado(NAVE, "TRITÓN", { uid: "nadie" }));
  await paso("aliasOcupado: corrigiendo una ficha (la suya no cuenta)", () => M.aliasOcupado(NAVE, "tritón", { ficha: UNA }));
  await paso("aliasOcupado: libre", () => M.aliasOcupado(NAVE, "Nadie Lo Lleva", { uid: "nadie" }));
  await paso("cambiarAlias: a uno libre", () => M.cambiarAlias(NAVE, UNA, "Tritón Nuevo", { stargateBio: "x" }));
  const otra = (await ficha(NAVE, "Fantasma Docente"));
  await paso("cambiarAlias: a uno reservado por otro", () => M.cambiarAlias(NAVE, otra.id, "Tritón Nuevo"));
  await paso("cambiarAlias: una ficha que no está", () => M.cambiarAlias(NAVE, "no-esta", "Lo Que Sea"));

  // ─── paso 5 · los premios por enlace
  const item = M.premioNuevo({ nombre: "Huevo de prueba", premio: "sobre", grupos: "todos", tipo: "huevo" });
  await paso("premioNuevo", () => item);
  await paso("huellaPremio", () => M.huellaPremio("abc", "XYZ"));
  await paso("guardarPremioEnlace: en dos grupos", () => M.guardarPremioEnlace(item, [NAVE, B]));
  await paso("guardarPremioEnlace: un sobre que un grupo no tiene", () => M.guardarPremioEnlace(M.premioNuevo({ premio: "sobre_raro", grupos: [NAVE, B] }), [NAVE, B]));
  await paso("premiosEnlaceDe", () => M.premiosEnlaceDe([NAVE, B, "no-existe"]));
  await paso("estadoDePremio", () => [M.estadoDePremio(null), M.estadoDePremio({ claimLinkEnabled: false }), M.estadoDePremio({ claimLinkStartsAt: T0 + 1 }),
    M.estadoDePremio({ claimLinkEndsAt: T0 - 1 }), M.estadoDePremio({ claimLinkMaxTotal: 2, claimLinkTotalClaimed: 2 }), M.estadoDePremio({})]);
  await paso("estadoHuevo", () => M.estadoHuevo(NAVE, item.id, UNA));
  await paso("reclamarHuevo: abre el sobre", () => M.reclamarHuevo(NAVE, item.id, UNA, item.codigo));
  for (const [code, message, que] of [["functions/resource-exhausted", "SOLD_OUT", "agotado"], ["functions/failed-precondition", "Has alcanzado el límite de reclamos", "ya era suyo"],
    ["functions/failed-precondition", "Este premio aún no está abierto", "pronto"], ["functions/failed-precondition", "Este premio ya se ha cerrado", "cerrado"],
    ["functions/permission-denied", "Lo siento, el código no vale", "otro"]]) {
    ERRORES.claimLinkedReward = { code, message };
    await paso("reclamarHuevo: " + que, () => M.reclamarHuevo(NAVE, item.id, UNA, item.codigo));
  }
  await paso("abrirHuevo", () => M.abrirHuevo(NAVE, item.id, UNA));
  ERRORES.consumeItem = { code: "functions/failed-precondition", message: "no queda" };
  await paso("abrirHuevo: sin poder abrir", () => M.abrirHuevo(NAVE, item.id, UNA));
  await paso("resolverHeroeRepetido: créditos", () => M.resolverHeroeRepetido(NAVE, item.id, UNA, "creditos"));
  await paso("resolverHeroeRepetido: sobre", () => M.resolverHeroeRepetido(NAVE, item.id, UNA, "sobre"));
  await paso("borrarPremioEnlace", () => M.borrarPremioEnlace(Object.assign({}, item, { en: [NAVE, B] }), [NAVE]));

  // ─── paso 6 · la llamada a filas
  await paso("abrirLlamada", () => M.abrirLlamada(NAVE, 20, { regalo: "sobre" }));
  await paso("abrirLlamada: sin minutos ni premio, como otro Comandante", () => M.abrirLlamada(NAVE, null, { comandante: "Dani Docente", xp: 0 }));
  await paso("llamadaAbierta", () => M.llamadaAbierta(NAVE));
  await paso("llamadaAbierta: la mía", () => M.llamadaAbierta(NAVE, "mia"));
  await paso("llamadaAbierta: la de un escuadrón", () => M.llamadaAbierta(NAVE, (x) => x.restrictedFactionId === "esc_eco_largo"));
  const vista = [];
  const fuera = M.vigilarLlamada(NAVE, (x, todas) => vista.push([x && x.teacherDisplayName, todas.length]));
  await new Promise((r) => setTimeout(r, 20));
  const abierta = await M.llamadaAbierta(NAVE);
  await paso("cerrarLlamada", () => M.cerrarLlamada(abierta.id));
  await new Promise((r) => setTimeout(r, 20)); fuera();
  await paso("vigilarLlamada", () => vista);
  await paso("ficharLlamada", () => M.ficharLlamada(NAVE, UNA));
  RESPUESTAS.modFichar = { ok: true, repetido: true };
  await paso("ficharLlamada: repetido", () => M.ficharLlamada(NAVE, UNA));
  await M.setDoc(M.doc(M.collection(M.db, "attendance_records")), { sessionId: abierta.id, userId: "u2", projectId: NAVE, registeredAt: new Date(T0 + 2000) });
  await M.setDoc(M.doc(M.collection(M.db, "attendance_records")), { sessionId: abierta.id, userId: "u1", projectId: NAVE, registeredAt: new Date(T0 + 1000) });
  await paso("fichajesDe", () => M.fichajesDe(abierta.id));
  await paso("yaFiche", async () => [await M.yaFiche(abierta.id, "u1"), await M.yaFiche(abierta.id, "u9"), await M.yaFiche("", "u1")]);
  await paso("presentesDeHoy", () => M.presentesDeHoy(NAVE));

  // ─── paso 7 · las votaciones
  await paso("crearVotacion", () => M.crearVotacion(NAVE, { pregunta: " ¿Cuál? ", opciones: ["A", " ", "B "], extra: 5, maxExtra: 2, escuadron: "esc_yunques",
    modo: "diferido", dias: 30, semana: 3, resuelve: 4, profe: "Docente de ensayo" }));
  await paso("crearVotacion: una sola opción", () => M.crearVotacion(NAVE, { pregunta: "¿?", opciones: ["A"] }));
  await paso("crearVotacion: en directo", () => M.crearVotacion(NAVE, { pregunta: "Otra", opciones: ["Sí", "No"] }));
  const vots = await M.votaciones(NAVE);
  await paso("votaciones", () => vots);
  await paso("votar", () => M.votar(NAVE, vots[0].id, "o1", "paid"));
  await M.setDoc(M.doc(M.db, "projects", NAVE, "voting_events", vots[0].id, "votes", UNA), { byOption: { o2: 1 } });
  await paso("miPapeleta", async () => [await M.miPapeleta(NAVE, vots[0].id, UNA), await M.miPapeleta(NAVE, vots[0].id, "nadie"), await M.miPapeleta(NAVE, vots[0].id, "")]);
  const oidas = [];
  const fueraV = M.vigilarVotaciones(NAVE, (l) => oidas.push(l.map((x) => x.title)));
  await new Promise((r) => setTimeout(r, 20));
  await paso("cerrarVotacion", () => M.cerrarVotacion(NAVE, vots[1].id));
  await new Promise((r) => setTimeout(r, 20)); fueraV();
  await paso("vigilarVotaciones", () => oidas);
  await paso("borrarVotacion", () => M.borrarVotacion(NAVE, vots[0].id));

  // ─── paso 8 · los retos, los avisos, las reflexiones y los comentarios
  await paso("otorgarReto", () => M.otorgarReto(NAVE, UNA, "L1"));
  await paso("anularReto", () => M.anularReto(NAVE, UNA, "L1", "x".repeat(250)));
  ERRORES.stargateAnularReto = { code: "functions/not-found", message: "not-found" };
  await paso("anularReto: sin desplegar (el camino de antes)", () => M.anularReto(NAVE, UNA, "X1", "porque"));
  ERRORES.stargateAnularReto = { code: "functions/not-found", message: "No existe el reto" };
  await paso("anularReto: el servidor dice que no (sin tildes)", () => M.anularReto(NAVE, UNA, "ZZ", "porque"));
  ERRORES.stargateAnularReto = { code: "functions/failed-precondition", message: "Ya no tienes los créditos" };
  await paso("anularReto: el servidor dice que no", () => M.anularReto(NAVE, UNA, "L1"));
  const destino = (await M.getDoc(M.doc(M.db, "student_profiles", UNA))).data().userId;
  await paso("avisarRecluta: anulado", () => M.avisarRecluta(NAVE, destino, { reto: "L1", accion: "anulado", texto: "  " + "y".repeat(500) + " ", de: "D".repeat(100) }));
  await paso("avisarRecluta: regalo", () => M.avisarRecluta(NAVE, destino, { accion: "regalo", regalo: { tipo: "sobre", piezas: [{ clave: "P1", tipo: "cromo", nombre: "Bran", rareza: "comun" }] } }));
  await paso("avisarRecluta: validado y con título", () => M.avisarRecluta(NAVE, destino, { reto: "X1", accion: "validado", titulo: "¡Hecho!" }));
  await paso("avisarRecluta: sin destino", () => M.avisarRecluta(NAVE, "", { texto: "hola" }));
  await M.setDoc(M.doc(M.collection(M.db, "notifications")), { userId: DATOS.yo.uid, projectId: NAVE, title: "a mí", read: false, createdAt: 3, stargate: { reto: "" } });
  await M.setDoc(M.doc(M.collection(M.db, "notifications")), { userId: DATOS.yo.uid, projectId: NAVE, title: "del motor", read: false, createdAt: 4 });
  const msj = [];
  const fueraM = M.vigilarMensajes(NAVE, (l) => msj.push(l.map((x) => x.title)));
  await new Promise((r) => setTimeout(r, 20));
  const mio = (await M.getDocs(M.query(M.collection(M.db, "notifications"), M.where("title", "==", "a mí")))).docs[0];
  await paso("mensajeLeido", () => M.mensajeLeido(mio.id));
  await new Promise((r) => setTimeout(r, 20)); fueraM();
  await paso("vigilarMensajes", () => msj);
  await paso("guardarReflexion", () => M.guardarReflexion(NAVE, "L1", UNA, "  Mi reflexión  ", " https://x.es/a "));
  await paso("guardarReflexion: otra vez (conserva cuándo se creó)", () => M.guardarReflexion(NAVE, "L1", UNA, "Cambiada", ""));
  await paso("guardarReflexion: vacía", () => M.guardarReflexion(NAVE, "L1", UNA, "   "));
  await paso("guardarReflexion: otra ficha", () => M.guardarReflexion(NAVE, "X1", "f2", "La de otra", "e"));
  await paso("enlaceDeReflexion", () => M.enlaceDeReflexion(NAVE, "L1", UNA, " https://y.es "));
  await paso("enlaceDeReflexion: sin reflexión", () => M.enlaceDeReflexion(NAVE, "L9", UNA, "z"));
  await paso("reflexionesDe", async () => [await M.reflexionesDe(NAVE, "L1"), await M.reflexionesDe(NAVE)]);
  await paso("misReflexiones", () => M.misReflexiones(NAVE));
  const idR = M.idReflexion(NAVE, "L1", UNA);
  await paso("comentar", () => M.comentar(NAVE, idR, "L1", "f2", "  " + "c".repeat(450)));
  await paso("comentar: vacío", () => M.comentar(NAVE, idR, "L1", "f2", " "));
  await paso("comentar: otro", () => M.comentar(NAVE, idR, "L1", "f3", "Bien"));
  const coms = await M.comentariosDe(NAVE, "L1");
  await paso("comentariosDe", async () => [coms, await M.comentariosDe(NAVE)]);
  await paso("borrarComentario", () => M.borrarComentario(coms[0].id));
  await paso("borrarReflexion", () => M.borrarReflexion(NAVE, "L1", UNA));

  // ─── paso 9 · el equipo docente, el alumnado y los referentes
  await paso("anadirDocente", () => M.anadirDocente(NAVE, { correo: "nuevo@ensayo.invalid", nombre: "Nuevo", rol: "docente" }));
  ERRORES.stargateEquipo = { code: "functions/not-found", message: "not-found" };
  await paso("anadirDocente: sin desplegar (el camino de antes)", () => M.anadirDocente(NAVE, { correo: " Otro@Ensayo.invalid ", rol: "referente" }));
  ERRORES.stargateEquipo = { code: "functions/unavailable", message: "unavailable" };
  await paso("anadirDocente: sin red (en un grupo que no existe: el camino viejo no llega a escribir)", () => M.anadirDocente("no-existe", { correo: "sinred@ensayo.invalid" }));
  ERRORES.stargateEquipo = { code: "functions/permission-denied", message: "Solo el referente del grupo puede tocar su equipo." };
  await paso("anadirDocente: el servidor dice que no", () => M.anadirDocente(NAVE, { correo: "x@ensayo.invalid" }));
  await paso("quitarDocente", () => M.quitarDocente(NAVE, "Nuevo@Ensayo.invalid"));
  await paso("referenteEnTodos", () => M.referenteEnTodos({ correo: "r@ensayo.invalid", nombre: "R" }, [NAVE, B]));
  ERRORES.stargateEquipo = { code: "functions/internal", message: "internal" };
  await paso("referenteEnTodos: sin desplegar (grupo a grupo)", () => M.referenteEnTodos({ correo: "s@ensayo.invalid", nombre: "S" }, [NAVE, B]));
  await paso("alumno", () => M.alumno(NAVE, UNA, "congelar"));
  await paso("moverRecluta", () => M.moverRecluta(NAVE, UNA, B));
  ERRORES.stargateAlumno = { code: "functions/not-found", message: "not-found" };
  await paso("moverRecluta: sin desplegar", () => M.moverRecluta(NAVE, UNA, B));
  ERRORES.stargateAlumno = { code: "functions/invalid-argument", message: "No sé qué hacer con «mover»." };
  await paso("moverRecluta: un servidor viejo", () => M.moverRecluta(NAVE, UNA, B));
  await paso("darDeBaja", () => M.darDeBaja(NAVE, UNA));
  const nova = await ficha(B, "Nova Prueba");
  ERRORES.stargateAlumno = { code: "functions/not-found", message: "not-found" };
  await paso("darDeBaja: sin desplegar (el camino de antes, y su alias libre)", () => M.darDeBaja(B, nova.id));
  ERRORES.stargateAlumno = { code: "functions/not-found", message: "No existe esa ficha" };
  await paso("darDeBaja: «no» del servidor sin tildes", () => M.darDeBaja(NAVE, "no-esta"));
  await paso("nuevoCodigo", () => M.nuevoCodigo(NAVE));
  await paso("referenteGlobal", async () => [await M.referenteGlobal("n.cuartero.10@gmail.com"), await M.referenteGlobal("Nadie@x.es")]);
  await paso("crearInvitacion", () => M.crearInvitacion("  Profe Nueva  "));
  const inv = (await M.invitaciones())[0];
  await paso("leerInvitacion", async () => [await M.leerInvitacion(inv.id), await M.leerInvitacion("nada")]);
  await paso("canjearInvitacion", () => M.canjearInvitacion(inv.id));
  await paso("canjearInvitacion: otra vez", () => M.canjearInvitacion(inv.id));
  await paso("canjearInvitacion: no existe", () => M.canjearInvitacion("nada"));
  await M.setDoc(M.doc(M.db, "stargate_invitaciones", "vieja"), { nombre: "V", caduca: T0 - 1, usadoPor: null });
  await paso("canjearInvitacion: caducada", () => M.canjearInvitacion("vieja"));
  await M.setDoc(M.doc(M.db, "stargate_invitaciones", "usada"), { nombre: "U", caduca: T0 + 1e9, usadoPor: "otro" });
  await paso("canjearInvitacion: usada", () => M.canjearInvitacion("usada"));
  await paso("ponerReferente", () => M.ponerReferente(" Ref@Ensayo.invalid ", true, "Ref"));
  await paso("ponerReferente: otra vez, sin nombre", () => M.ponerReferente("ref@ensayo.invalid", false));
  await paso("ponerReferente: un correo malo", () => M.ponerReferente("no-es-correo", true));
  await paso("referentes e invitaciones", async () => [await M.referentes(), await M.invitaciones()]);
  await paso("referenteGlobal: el de la invitación", () => M.referenteGlobal(DATOS.yo.correo));

  // ─── paso 10 · el buzón del Mando
  await paso("buzonEnviar: docente", () => M.buzonEnviar({ tipo: "problema", texto: "  Algo pasa  ", urgente: true, projectId: NAVE, grupo: "G", contexto: { a: 1 },
    adjuntos: ["https://firebasestorage.googleapis.com/a.jpg", "https://otro.es/b.jpg", "https://firebasestorage.googleapis.com/c.jpg"] }));
  await paso("buzonEnviar: duda de un recluta, sin alias", () => M.buzonEnviar({ tipo: "recluta", texto: "¿Y esto?", urgente: true }));
  await paso("buzonEnviar: duda de un recluta, con alias", () => M.buzonEnviar({ tipo: "recluta", texto: "x", contexto: { alias: "Tritón" }, autoayuda: ["faq1"] }));
  if (globalThis.__SG_BUZON_ABIERTO) {
    const ids = (await M.buzonMios()).map((x) => x.id);
    await paso("buzonMios", () => M.buzonMios());
    await M.setDoc(M.doc(M.db, "stargate_buzon", "ajeno"), { uid: "otro", texto: "de otro", estado: "nuevo", respuestas: [], actualizado: 1 });
    await paso("buzonTodos", () => M.buzonTodos());
    await paso("buzonResponder: el docente", () => M.buzonResponder(ids[0], "  Más datos  "));
    await paso("buzonResponder: el docente lo da por resuelto, sin texto", () => M.buzonResponder(ids[1], "", { estado: "resuelto" }));
    await paso("buzonResponder: el Mando", () => M.buzonResponder(ids[0], "Hecho", { comoMando: true, estado: "resuelto" }));
    await paso("buzonResponder: el Mando, solo el estado", () => M.buzonResponder(ids[2], " ", { comoMando: true }));
    await paso("buzonResponder: un mensaje que no existe", () => M.buzonResponder("nada", "x"));
    await paso("buzonVisto", async () => [await M.buzonVisto(ids[0]), await M.buzonVisto("nada")]);
    await paso("BUZON_VALORA", () => M.BUZON_VALORA);
  }

  // ─── paso 11 · vales, sorteos y ofertas
  await paso("resolverVale", async () => [await M.resolverVale("v1", true, "Bien"), await M.resolverVale(7, false)]);
  await paso("sortear", () => M.sortear(NAVE, NAVE + "__sorteo1"));
  await paso("sorteosPendientes", () => M.sorteosPendientes(NAVE));
  await paso("oferta", () => M.oferta(NAVE, "semana"));
  await paso("crearOfertaEnGrupos", () => M.crearOfertaEnGrupos({ que: "sobre", pct: 20, dias: 3, unidades: 5 }, [NAVE]));
  await paso("ofertaEnGrupos", () => M.ofertaEnGrupos([{ per: NAVE, docId: "o1" }, { per: B, docId: "o2" }], "extender", { dias: 2 }));
} catch (e) {
  apunta("💥 el guion se ha caído", { error: String((e && e.stack) || e) });
}

// lo tocado, documento a documento (lo guarda el ensayo en este navegador), y lo que se ha avisado
await new Promise((r) => setTimeout(r, 20));
const tocado = (JSON.parse(guardado["sgEnsayo.db"] || "{}").c) || {};
Object.keys(tocado).sort().forEach((k) => apunta("tocado · " + k, tocado[k]));
apunta("avisos del documento", avisos);
apunta("lo que queda en el navegador", Object.keys(guardado).filter((k) => k !== "sgEnsayo.db").sort().map((k) => [k, guardado[k]]));
fs.rmSync(tmp, { recursive: true, force: true });
process.stdout.write(JSON.stringify(traza));
process.exit(0);
