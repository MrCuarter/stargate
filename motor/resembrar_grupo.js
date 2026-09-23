'use strict';
/**
 * STARGATE · VOLVER A SEMBRAR UN GRUPO DE MENTIRA CON EL CATÁLOGO DE HOY (23-sep-2026)
 *
 * El 23-sep el catálogo pasó a los 20 retos (un relámpago y un principal por tema, sin A1–A8). Un grupo guarda el
 * catálogo con el que nació —sus misiones, sus campañas y su `levelSystem`—, así que los grupos que ya existían seguían
 * con los retos viejos. En los grupos de verdad eso se migraría con cuidado; pero los dos que hay en producción son de
 * mentira de principio a fin (la DEMO de la portada y la NAVE ESCUELA del profesorado): lo fiel es sembrarlos otra vez,
 * con reclutas que han hecho los retos NUEVOS. Es lo mismo que se hizo el 16-sep al empezar de cero.
 *
 *   node motor/resembrar_grupo.js --id=nave-escuela              → ensayo: dice lo que borraría y no toca nada
 *   node motor/resembrar_grupo.js --id=nave-escuela --aplicar    → copia, borra y vuelve a sembrar
 *   (con FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 va al emulador)
 *
 * 🔴 Cerrojos, antes de escribir nada:
 *   · solo `demo-stargate` y `nave-escuela` (los que siembra `sembrar_prueba.js --demo / --escuela`);
 *   · solo si el grupo es de STARGATE (`stargate.version`) — el Firestore es GamificaPro ENTERO;
 *   · solo si TODAS sus fichas son de mentira (`demo_…`, `prueba_…`, `lab_…`): si alguien de verdad se ha alistado,
 *     se para y lo dice;
 *   · copia de todo lo que se borra en ~/.config/stargate-mando/copias/resembrar-AAAA-MM-DD/<grupo>.json (fuera de
 *     los repositorios: lleva nombres y correos de mentira, pero es un volcado del grupo).
 * El borrado es el de `deleteProject` más las colecciones de STARGATE que llegaron después.
 */
const path = require("path"), fs = require("fs"), os = require("os");
const { spawnSync } = require("child_process");
const GP = "/Users/nor/Claude/vibewebs/gamificapro";
const admin = require(path.join(GP, "node_modules", "firebase-admin"));
const EMU = !!process.env.FIRESTORE_EMULATOR_HOST;
if (EMU) admin.initializeApp({ projectId: "demo-stargate" });
else admin.initializeApp({ credential: admin.credential.cert(require(path.join(GP, "service-account.json"))) });
const db = admin.firestore();

const MODO = { "demo-stargate": "--demo", "nave-escuela": "--escuela" };
const ID = (process.argv.find(a => a.indexOf("--id=") === 0) || "").slice(5);
const APLICAR = process.argv.includes("--aplicar");
if (!MODO[ID]) {
  console.error("✗ --id=demo-stargate o --id=nave-escuela: solo los grupos de mentira que se siembran con sembrar_prueba.js.");
  process.exit(2);
}

// lo que cuelga del grupo por `projectId` (la lista de deleteProject y lo que STARGATE añadió después)
const POR_PROYECTO = [
  "missions", "rewards", "campaigns", "purchased_vouchers", "redemption_requests", "assets", "announcements",
  "announcement_replies", "pending_mission_validations", "mission_deliveries", "mission_submissions", "distress_signals",
  "marketplace", "auctions", "xp_ledger", "notifications", "internal_messages", "internal_message_reports",
  "messaging_daily_digest_log", "attendance_records", "attendance_sessions",
  "stargate_zoco", "stargate_tratos", "stargate_alias", "stargate_asistencia", "stargate_congelados",
  "stargate_reflexiones", "stargate_comentarios", "stargate_batallas", "stargate_anulaciones", "stargate_respuestas"
];
const DE_MENTIRA = /^(demo|prueba|lab)_/;

async function volcar(ref) {   // un documento con todo lo que lleva dentro
  const d = await ref.get(), out = { id: ref.id, datos: d.exists ? d.data() : null, dentro: {} };
  for (const sub of await ref.listCollections()) {
    out.dentro[sub.id] = [];
    for (const x of (await sub.get()).docs) out.dentro[sub.id].push(await volcar(x.ref));
  }
  return out;
}

(async () => {
  const pRef = db.collection("projects").doc(ID), p = await pRef.get();
  if (!p.exists) { console.log("· «" + ID + "» no existe: se siembra sin más."); }
  else if (!(p.data().stargate && p.data().stargate.version)) { console.error("✗ «" + ID + "» no es un grupo de STARGATE. No se toca."); process.exit(2); }

  const fichas = p.exists ? (await db.collection("student_profiles").where("projectId", "==", ID).get()).docs : [];
  const reales = fichas.filter(f => !DE_MENTIRA.test(String(f.data().userId || "")));
  if (reales.length) {
    console.error("✗ «" + ID + "» tiene " + reales.length + " ficha(s) de alguien de verdad (" +
      reales.map(f => f.data().publicAlias || f.id).join(", ") + "). No se borra: habría que migrarlo, no sembrarlo.");
    process.exit(2);
  }
  const cuenta = {};
  for (const col of POR_PROYECTO) cuenta[col] = p.exists ? (await db.collection(col).where("projectId", "==", ID).count().get()).data().count : 0;
  const misiones = p.exists ? (await db.collection("missions").where("projectId", "==", ID).get()).docs.map(d => d.data().stargateId) : [];
  console.log("\n  " + ID + (EMU ? "  (EMULADOR)" : "  (PRODUCCIÓN)") + " · " + (p.exists ? p.data().name : "—"));
  console.log("  fichas: " + fichas.length + " (todas de mentira) · retos viejos A1–A8: " + misiones.filter(x => /^A[1-8]$/.test(x)).length +
              " · con L0: " + (misiones.indexOf("L0") >= 0 ? "sí" : "no"));
  console.log("  se borraría: " + Object.keys(cuenta).filter(k => cuenta[k]).map(k => k + " " + cuenta[k]).join(" · ") +
              (p.exists ? " · el grupo con sus subcolecciones" : ""));
  if (!APLICAR) { console.log("\n  Ensayo: no se ha tocado nada. Para hacerlo, lo mismo con --aplicar.\n"); process.exit(0); }

  // 1 · la copia
  if (p.exists) {
    const dir = path.join(os.homedir(), ".config", "stargate-mando", "copias", "resembrar-" + new Date().toISOString().slice(0, 10));
    fs.mkdirSync(dir, { recursive: true });
    const copia = { grupo: await volcar(pRef), fichas: [], colecciones: {} };
    for (const f of fichas) copia.fichas.push(await volcar(f.ref));
    for (const col of POR_PROYECTO) if (cuenta[col])
      copia.colecciones[col] = (await db.collection(col).where("projectId", "==", ID).get()).docs.map(d => ({ id: d.id, datos: d.data() }));
    const envivo = await db.collection("stargate_envivo").doc(ID).get();
    if (envivo.exists) copia.colecciones.stargate_envivo = [{ id: ID, datos: envivo.data() }];
    const fich = path.join(dir, ID + (EMU ? "-emulador" : "") + ".json");
    fs.writeFileSync(fich, JSON.stringify(copia));
    console.log("  ✓ copia en " + fich);

    // 2 · el borrado (el de deleteProject y lo que llegó después)
    for (const f of fichas) await db.recursiveDelete(f.ref);
    for (const col of POR_PROYECTO) {
      if (!cuenta[col]) continue;
      const docs = (await db.collection(col).where("projectId", "==", ID).get()).docs;
      for (let i = 0; i < docs.length; i += 400) { const b = db.batch(); docs.slice(i, i + 400).forEach(d => b.delete(d.ref)); await b.commit(); }
    }
    await db.collection("stargate_envivo").doc(ID).delete();
    await db.recursiveDelete(pRef);
    console.log("  ✓ borrado");
  }

  // 3 · sembrarlo otra vez, con el catálogo de hoy (el mismo guion de siempre)
  const r = spawnSync(process.execPath, [path.join(__dirname, "sembrar_prueba.js"), MODO[ID]], { stdio: "inherit", env: process.env });
  if (r.status !== 0) { console.error("✗ la siembra ha fallado (código " + r.status + "). La copia está arriba."); process.exit(1); }

  // 4 · comprobarlo
  const ahora = (await db.collection("missions").where("projectId", "==", ID).get()).docs.map(d => d.data().stargateId);
  const bien = ahora.indexOf("L0") >= 0 && !ahora.some(x => /^A[1-8]$/.test(x));
  console.log((bien ? "  ✓ " : "  ✗ ") + ID + ": " + ahora.length + " misiones, " + (bien ? "con los 20 retos (L0, L1–L8, B1–B8) y sin A1–A8" : "¡algo no cuadra!") + "\n");
  process.exit(bien ? 0 : 1);
})().catch(e => { console.error("✗ " + (e && e.message || e)); process.exit(1); });
