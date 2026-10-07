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
 *   … --aplicar --otra-vez                                       → aunque ya lleve el catálogo de hoy (cambia su código)
 *   (con FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 va al emulador)
 *
 * 🔴 Cerrojos, antes de escribir nada:
 *   · solo `demo-stargate` y `nave-escuela` (los que siembra `sembrar_prueba.js --demo / --escuela`);
 *   · solo si el grupo es de STARGATE (`stargate.version`) — el Firestore es GamificaPro ENTERO;
 *   · solo si TODAS sus fichas son de mentira (`demo_…`, `prueba_…`, `lab_…`): si alguien de verdad se ha alistado,
 *     se para y lo dice;
 *   · copia de todo lo que se borra en ~/.config/stargate-mando/copias/resembrar-AAAA-MM-DD/<grupo>-HHMMSS.json (fuera de
 *     los repositorios: lleva nombres y correos de mentira, pero es un volcado del grupo).
 * El borrado es el de `deleteProject` más las colecciones de STARGATE que llegaron después.
 *
 * 7-oct · LO QUE SE BORRA LO DICE EL MOTOR, NO ESTA LISTA. Todo lo que está en el mapa de colecciones de GamificaPro
 * (functions/mods/colecciones.js: las `stargate_*` y las `ceniza_*`, cada una en su sitio viejo Y en su `mod_*`) se recorre
 * con lo mismo que usa `deleteProject`: `planDeBorrado()` y `sitiosDe()` para contar (ensayo) y copiar (paso 1), y
 * `borrarGrupoDelMapa()` para borrar (paso 2). Así sigue sola al interruptor `fase` de cada colección cuando se pase a
 * `mod_*`, y deja de escapársele lo que antes se le escapaba (rutas, Asedio, galería, fama, directo, buzón, metas de las
 * batallas). `POR_PROYECTO` se queda solo con lo de GamificaPro que no está en el mapa.
 */
const path = require("path"), fs = require("fs"), os = require("os");
const { pathToFileURL } = require("url");
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
// 24-sep · se lanzó dos veces seguidas sobre la Nave Escuela: la segunda no arreglaba nada y le cambió el código de acceso
// (y pisó la copia de la primera). Si el grupo ya lleva el catálogo de hoy, no se toca salvo que se pida con --otra-vez.
const OTRA_VEZ = process.argv.includes("--otra-vez");
if (!MODO[ID]) {
  console.error("✗ --id=demo-stargate o --id=nave-escuela: solo los grupos de mentira que se siembran con sembrar_prueba.js.");
  process.exit(2);
}

// lo que cuelga del grupo por `projectId` Y NO ESTÁ EN EL MAPA: las de GamificaPro (la lista de deleteProject). Todo lo de
// STARGATE y DPG (`stargate_*`, `ceniza_*`) lo trae el mapa de colecciones: no se nombra aquí. Si una de estas entrara algún
// día en el mapa, se quita sola de aquí (más abajo) y la lleva el motor.
const DE_GAMIFICAPRO = [
  "missions", "rewards", "campaigns", "purchased_vouchers", "redemption_requests", "assets", "announcements",
  "announcement_replies", "pending_mission_validations", "mission_deliveries", "mission_submissions", "distress_signals",
  "marketplace", "auctions", "xp_ledger", "notifications", "internal_messages", "internal_message_reports",
  "messaging_daily_digest_log", "attendance_records", "attendance_sessions"
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
  // el motor: el mapa de colecciones y el borrado de un grupo (GamificaPro). Carga functions/comun.js, que inicia su propia
  // app de firebase-admin (la de functions/node_modules): no la usa, porque a todo se le pasa el `db` de este script.
  const GPF = (f) => pathToFileURL(path.join(GP, "functions", f)).href;
  const { MAPA, planDeBorrado, sitiosDe, borrarGrupoDelMapa, listaSinGrupo } = await import(GPF("modColeccion.js"));
  const { idNuevo } = await import(GPF("modEspejoLogica.js"));
  const POR_PROYECTO = DE_GAMIFICAPRO.filter(c => !MAPA[c]);
  const plan = planDeBorrado();
  const fichaIds = fichas.map(f => f.id);
  const docsDe = (vieja, id) => [db.collection(vieja).doc(String(id)), db.collection(MAPA[vieja].nueva).doc(idNuevo(MAPA[vieja], id))];

  // lo que hay del grupo hoy, por colección: lo mismo que recorre borrarGrupoDelMapa, sin tocarlo
  async function contar() {
    const c = {}, sumar = (k, n) => { if (n) c[k] = (c[k] || 0) + n; };
    for (const vieja of plan.campo) for (const n of sitiosDe(vieja))
      sumar(n, (await db.collection(n).where("projectId", "==", ID).count().get()).data().count);
    for (const vieja of plan.id) for (const ref of docsDe(vieja, ID)) if ((await ref.get()).exists) sumar(ref.parent.id, 1);
    for (const [vieja, prefijo] of plan.porFicha) for (const f of fichaIds) for (const ref of docsDe(vieja, prefijo + f))
      if ((await ref.get()).exists) sumar(ref.parent.id, 1);
    for (const [vieja, campo] of plan.listas) for (const n of sitiosDe(vieja)) for (const d of (await db.collection(n).get()).docs) {
      const antes = d.data()[campo];
      if (Array.isArray(antes)) sumar(n, antes.length - listaSinGrupo(antes, ID, fichaIds).length);
    }
    for (const col of POR_PROYECTO) sumar(col, (await db.collection(col).where("projectId", "==", ID).count().get()).data().count);
    return c;
  }
  const cuenta = p.exists ? await contar() : {};
  const misiones = p.exists ? (await db.collection("missions").where("projectId", "==", ID).get()).docs.map(d => d.data().stargateId) : [];
  console.log("\n  " + ID + (EMU ? "  (EMULADOR)" : "  (PRODUCCIÓN)") + " · " + (p.exists ? p.data().name : "—"));
  console.log("  fichas: " + fichas.length + " (todas de mentira) · retos viejos A1–A8: " + misiones.filter(x => /^A[1-8]$/.test(x)).length +
              " · con L0: " + (misiones.indexOf("L0") >= 0 ? "sí" : "no"));
  const alDia = p.exists && misiones.indexOf("L0") >= 0 && !misiones.some(x => /^A[1-8]$/.test(x));
  if (!alDia || OTRA_VEZ)
    console.log("  se borraría: " + Object.keys(cuenta).sort().map(k => k + " " + cuenta[k]).join(" · ") +
                (p.exists ? " · el grupo con sus subcolecciones" : ""));
  if (alDia && !OTRA_VEZ) {
    console.log("\n  ✓ «" + ID + "» ya lleva el catálogo de hoy: no hace falta sembrarlo otra vez (y su código de acceso se queda como está)." +
                "\n    Si de verdad quieres rehacerlo, añade --otra-vez.\n");
    process.exit(0);
  }
  if (!APLICAR) { console.log("\n  Ensayo: no se ha tocado nada. Para hacerlo, lo mismo con --aplicar.\n"); process.exit(0); }

  // 1 · la copia
  if (p.exists) {
    const dir = path.join(os.homedir(), ".config", "stargate-mando", "copias", "resembrar-" + new Date().toISOString().slice(0, 10));
    fs.mkdirSync(dir, { recursive: true });
    const copia = { grupo: await volcar(pRef), fichas: [], colecciones: {} };
    for (const f of fichas) copia.fichas.push(await volcar(f.ref));
    const poner = (n, x) => { (copia.colecciones[n] = copia.colecciones[n] || []).push(x); };
    // las de `projectId` (las del mapa, en sus dos sitios; las que llevan subcolecciones, con todo lo que cuelga)
    for (const vieja of plan.campo) for (const n of sitiosDe(vieja)) if (cuenta[n])
      for (const d of (await db.collection(n).where("projectId", "==", ID).get()).docs)
        poner(n, MAPA[vieja].sub.length ? await volcar(d.ref) : { id: d.id, datos: d.data() });
    // las que son el documento del grupo (`stargate_envivo`, `stargate_directo`…), con todo lo que cuelga
    for (const vieja of plan.id) for (const ref of docsDe(vieja, ID)) if ((await ref.get()).exists) poner(ref.parent.id, await volcar(ref));
    // las metas de las batallas (no llevan `projectId`)
    for (const [vieja, prefijo] of plan.porFicha) for (const f of fichaIds) for (const ref of docsDe(vieja, prefijo + f)) {
      const d = await ref.get(); if (d.exists) poner(ref.parent.id, { id: d.id, datos: d.data() });
    }
    // las listas compartidas (el salón de la fama): solo las entradas que se van a quitar
    copia.listas = {};
    for (const [vieja, campo] of plan.listas) for (const n of sitiosDe(vieja)) for (const d of (await db.collection(n).get()).docs) {
      const antes = d.data()[campo];
      if (!Array.isArray(antes)) continue;
      const quedan = listaSinGrupo(antes, ID, fichaIds);
      if (quedan.length !== antes.length) (copia.listas[n] = copia.listas[n] || []).push({ id: d.id, campo, quitadas: antes.filter(x => !quedan.includes(x)) });
    }
    for (const col of POR_PROYECTO) if (cuenta[col])
      copia.colecciones[col] = (await db.collection(col).where("projectId", "==", ID).get()).docs.map(d => ({ id: d.id, datos: d.data() }));
    // cada copia con su hora: dos pasadas el mismo día no se pisan
    const fich = path.join(dir, ID + (EMU ? "-emulador" : "") + "-" + new Date().toTimeString().slice(0, 8).replace(/:/g, "") + ".json");
    fs.writeFileSync(fich, JSON.stringify(copia));
    console.log("  ✓ copia en " + fich);

    // 2 · el borrado: las de GamificaPro, aquí; todo lo del mapa (y sus `mod_*`), el motor
    for (const f of fichas) await db.recursiveDelete(f.ref);
    for (const col of POR_PROYECTO) {
      if (!cuenta[col]) continue;
      const docs = (await db.collection(col).where("projectId", "==", ID).get()).docs;
      for (let i = 0; i < docs.length; i += 400) { const b = db.batch(); docs.slice(i, i + 400).forEach(d => b.delete(d.ref)); await b.commit(); }
    }
    const borradas = await borrarGrupoDelMapa(ID, { fichaIds, db });
    await db.recursiveDelete(pRef);
    // lo que ha borrado el motor tiene que ser lo que se ensayó, y no puede quedar nada del grupo en ningún sitio
    const dist = Object.keys(Object.assign({}, cuenta, borradas)).filter(k => !POR_PROYECTO.includes(k) && (cuenta[k] || 0) !== (borradas[k] || 0));
    if (dist.length) console.log("  · ojo: el ensayo y el borrado no cuentan lo mismo en " + dist.map(k => k + " " + (cuenta[k] || 0) + "→" + (borradas[k] || 0)).join(", "));
    const restos = await contar();
    const fichasQuedan = (await db.collection("student_profiles").where("projectId", "==", ID).count().get()).data().count;
    const hayGrupo = (await pRef.get()).exists || fichasQuedan > 0;
    if (Object.keys(restos).length || hayGrupo) {
      console.error("✗ queda algo del grupo tras el borrado: " + Object.keys(restos).map(k => k + " " + restos[k]).join(" · ") + (hayGrupo ? " · el grupo o sus fichas" : ""));
      process.exit(1);
    }
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
