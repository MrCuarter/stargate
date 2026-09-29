/* LA CONSOLA DE ENSAYO · sus datos (29-sep-2026). Norberto, para la Academia de la Cero: «conocer el panel del docente
 * (habrá que construir un "simulador" con vista docente)», y luego «haz todo lo pendiente». Es la consola DE VERDAD corriendo
 * contra un Firestore en memoria (assets/js/sim/firebase_sim.js; ensayo.html): se pulsa todo, nada sale del navegador y no
 * da acceso a nada real. Lo mismo que el simulador de DPG1 (dpg/web-camino, `?motor=sim`), con piel de STARGATE.
 *
 * Aquí se generan sus datos, SIN RED: el MISMO sembrador de la Nave Escuela (motor/sembrar_prueba.js --escuela: 30 reclutas
 * con implicación desigual, el curso entero andado, Mercado, Zoco, Gran Sorteo y tickets de salida), escrito en un Firestore
 * de papel en vez de en el de verdad, y guardado en assets/sim/escuela.json. Se engaña a `require("firebase-admin")`: el
 * sembrador no sabe que escribe en papel, así que el ensayo nunca se queda atrás del grupo de verdad.
 *
 * 🔴 Ni un correo de verdad: el equipo pasa a @ensayo.invalid (RFC 2606: no existe ni puede existir) y, si queda uno solo que
 * no lo sea, se para aquí sin escribir nada. El repositorio es público.
 *
 *   node herramientas/simulador_datos.cjs      (se vuelve a lanzar si cambia el sembrador, el paquete o los retos)
 */
const path = require("path"), fs = require("fs"), Module = require("module");
const RAIZ = path.join(__dirname, "..");
const YO = { uid: "sim-docente", nombre: "Docente de ensayo", correo: "docente@ensayo.invalid" };

// ── un Firestore de papel: lo que usa el sembrador (colección/documento, set/update/get, subcolecciones y lotes)
const docs = {};
const limpio = (x) => JSON.parse(JSON.stringify(x));
let auto = 0;
const idNuevo = () => "ens" + String(++auto).padStart(4, "0");   // (ids fijos: el fichero no cambia sin motivo)
function ponerCampo(d, campo, v) {
  const s = String(campo).split("."); let x = d;
  for (let i = 0; i < s.length - 1; i++) { if (!x[s[i]] || typeof x[s[i]] !== "object") x[s[i]] = {}; x = x[s[i]]; }
  x[s[s.length - 1]] = limpio(v);
}
function ref(ruta) {
  return {
    id: ruta.split("/").pop(), path: ruta,
    set: async (d) => { docs[ruta] = limpio(d); },
    update: async (d) => { if (!docs[ruta]) throw new Error("update de un documento que no existe: " + ruta); Object.keys(d).forEach((k) => ponerCampo(docs[ruta], k, d[k])); },
    get: async () => ({ exists: ruta in docs, data: () => docs[ruta] }),
    collection: (c) => col(ruta + "/" + c),
  };
}
function col(ruta) { return { doc: (id) => ref(ruta + "/" + (id || idNuevo())) }; }
const db = { collection: (c) => col(c), batch: () => { const p = []; return { set: (r, d) => p.push(() => r.set(d)), update: (r, d) => p.push(() => r.update(d)), commit: async () => { for (const f of p) await f(); } }; } };
const ADMIN = { initializeApp: () => ({}), credential: { cert: () => ({}) }, firestore: () => db, auth: () => ({ getUserByEmail: async () => null }) };

// el sembrador pide firebase-admin: se le da el de papel
const cargar = Module._load;
Module._load = function (pedido, padre, esPrincipal) { return /(^|[\\/])firebase-admin$/.test(pedido) ? ADMIN : cargar.apply(this, arguments); };
// (con esta variable el sembrador no toca la cuenta de servicio y usa su equipo de laboratorio, que aquí se disfraza)
process.env.FIRESTORE_EMULATOR_HOST = "papel:0";
process.argv = [process.argv[0], path.join(RAIZ, "motor/sembrar_prueba.js"), "--escuela"];
const salir = process.exit;
process.exit = (c) => { if (c) { console.error("✗ el sembrador ha parado (" + c + ")"); salir(c); } };

/** Lo que sale del laboratorio y del paquete (los referentes vitalicios) pasa a ser de mentira. */
const CAMBIOS = [
  ["rita@lab.test", YO.correo], ["Rita Referente", YO.nombre],
  ["dani@lab.test", "dani@ensayo.invalid"], ["sol@lab.test", "sol@ensayo.invalid"],
  ["@prueba.es", "@ensayo.invalid"],
  ["n.cuartero.10@gmail.com", "mando@ensayo.invalid"], ["mutecdgami@gmail.com", "ccd@ensayo.invalid"],
  ["anita.feridouni@gmail.com", "coordina1@ensayo.invalid"], ["caridadsierradaz@gmail.com", "coordina2@ensayo.invalid"],
  ['"Mr. Cuarter"', '"El Mando (ensayo)"'], ['"Anita"', '"Coordinación 1"'], ['"Caridad"', '"Coordinación 2"'],
];
const PROHIBIDO = /cuartero|norberto|feridouni|sierradaz|mutecdgami|genially\.com/i;

process.on("beforeExit", () => {
  process.removeAllListeners("beforeExit");
  let txt = JSON.stringify(docs);
  CAMBIOS.forEach(([a, b]) => { txt = txt.split(a).join(b); });
  const correos = (txt.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) || []).filter((c) => !/@ensayo\.invalid$/.test(c));
  if (correos.length) { console.error("✗ Hay correos que no son de mentira: " + [...new Set(correos)].slice(0, 5).join(", ")); salir(1); }
  const malo = txt.match(PROHIBIDO);
  if (malo) { console.error("✗ Queda algo de verdad en los datos: «" + malo[0] + "»"); salir(1); }
  const D = JSON.parse(txt), grupo = "nave-escuela";
  if (!D["projects/" + grupo]) { console.error("✗ No se ha sembrado el grupo " + grupo); salir(1); }
  const n = Object.keys(D).length;
  const salida = { v: new Date().toISOString().slice(0, 10) + "-" + n, generado: Date.now(), yo: YO, grupo, docs: D };
  fs.mkdirSync(path.join(RAIZ, "assets/sim"), { recursive: true });
  fs.writeFileSync(path.join(RAIZ, "assets/sim/escuela.json"), JSON.stringify(salida));
  const fichas = Object.keys(D).filter((k) => /^student_profiles\/[^/]+$/.test(k)).length;
  console.log("✅ assets/sim/escuela.json · " + n + " documentos · " + fichas + " reclutas · " + Math.round(JSON.stringify(salida).length / 1024) + " KB");
  salir(0);
});

require(path.join(RAIZ, "motor/sembrar_prueba.js"));
