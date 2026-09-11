'use strict';
/**
 * STARGATE · SEMBRAR UN GRUPO DESDE AQUÍ
 *
 * Lo mismo que hace la consola del referente en el navegador, pero desde la línea de órdenes y con
 * privilegios de administrador. Existe por dos motivos: para poder probar el motor nuevo sin
 * depender de que alguien inicie sesión, y para dejar sembrada la CLASE DEMO de una vez.
 *
 * 🔴 Escribe en el Firestore de VERDAD. Solo crea documentos nuevos bajo el identificador que se le
 * pasa y no toca ningún otro proyecto, pero conviene saber lo que se está pulsando.
 *
 *   node motor/sembrar.js <id> "<Nombre>" <REGULAR|PUA> <AAAA-MM-DD> [--reclutas]
 */
const path = require("path");
const GP = "/Users/nor/Claude/vibewebs/gamificapro";
const admin = require(path.join(GP, "node_modules", "firebase-admin"));
const { catalogo } = require("./catalogo.js");
const { paquete } = require("./paquete.js");

admin.initializeApp({ credential: admin.credential.cert(require(path.join(GP, "service-account.json"))) });
const db = admin.firestore();

// Un equipo docente de mentira para la demo: nombres que no son de nadie, a propósito.
const DOCENTES_DEMO = [
  { nombre: "Mr Cuarter", correo: "mutecdgami@gmail.com", rol: "referente",
    panel: "https://view.genially.com/6a8bfc4f5068ad5903fc39e3" },
  { nombre: "Capitana Vega", correo: "vega@ejemplo.es", rol: "docente" },
  { nombre: "Comandante Orion", correo: "orion@ejemplo.es", rol: "docente" }
];

// Reclutas de mentira para que la Nave y la consola tengan algo que enseñar. Los alias salen del
// mismo banco que usa el formulario de alta, así que suenan a STARGATE y no a «alumno1».
const SIEMBRA = [
  { alias: "Vega",  nombre: "Vega",  apellidos: "Estrella", profe: "Capitana Vega",  retos: ["A0","A1","B1","X1","A2","B2"] },
  { alias: "Orion", nombre: "Orion", apellidos: "Cazador",  profe: "Comandante Orion", retos: ["A0","A1","B1"] },
  { alias: "Lyra",  nombre: "Lyra",  apellidos: "Cuerda",   profe: "Capitana Vega",  retos: ["A0","A1"] },
  { alias: "Nix",   nombre: "Nix",   apellidos: "Noche",    profe: "Mr Cuarter",     retos: ["A0"] },
  { alias: "Talia", nombre: "Talia", apellidos: "Vuelo",    profe: "Comandante Orion", retos: ["A0","A1","B1","X1","A2","B2","A3","B3","X2"] }
];

// La misma traducción que hace assets/js/motor.js al sembrar desde el navegador. Los dos caminos
// tienen que escribir EXACTAMENTE lo mismo, y eso lo vigila la batería 55.
function conIdsDeDocumento(per, x) {
  // 🔴 `id: undefined` NO es un capricho. GamificaPro lee sus documentos con
  // `{ id: doc.id, ...doc.data() }`, así que un campo `id` DENTRO del documento pisa el
  // identificador real y todo el motor empieza a hablar de «A1» donde el documento se llama
  // «grupo__A1». El síntoma fue de los peores: la misión se registraba bien y a continuación la
  // función reventaba con un «INTERNAL» mudo al cerrar la campaña del planeta.
  const out = { projectId: per, stargateId: x.id };
  const doc_ = s => per + "__" + s;
  if (Array.isArray(x.missionIds)) out.missionIds = x.missionIds.map(doc_);
  if (Array.isArray(x.optionalMissionIds)) out.optionalMissionIds = x.optionalMissionIds.map(doc_);
  if (Array.isArray(x.rewardItemIds)) out.rewardItemIds = x.rewardItemIds.map(doc_);
  if (x.consumeEffects && x.consumeEffects.lootBox)
    out.consumeEffects = Object.assign({}, x.consumeEffects, { lootBox: { items:
      x.consumeEffects.lootBox.items.map(i => Object.assign({}, i, { rewardId: doc_(i.rewardId) })) } });
  if (x.campaignId) out.campaignId = doc_(x.campaignId);
  if (x.unlockWhenCampaignComplete) out.unlockWhenCampaignComplete = doc_(x.unlockWhenCampaignComplete);
  return out;
}

async function main() {
  const [id, nombre, tipo, inicio] = process.argv.slice(2);
  const conReclutas = process.argv.indexOf("--reclutas") >= 0;
  if (!id || !nombre || !inicio) {
    console.error('Uso: node motor/sembrar.js <id> "<Nombre>" <REGULAR|PUA> <AAAA-MM-DD> [--reclutas]');
    process.exit(1);
  }
  const cat = catalogo();
  const paq = paquete({ id, nombre, tipo: tipo || "REGULAR", inicio,
    referente: "mutecdgami@gmail.com", padlet: "https://padlet.com/mutecdgami/stargate",
    docentes: DOCENTES_DEMO }, cat);

  if ((await db.collection("projects").doc(id).get()).exists) {
    console.error("Ya existe un grupo con el id «" + id + "». Elige otro o bórralo antes.");
    process.exit(1);
  }

  // 🔴 El proyecto, solo y primero. Con reglas de cliente es obligatorio (la regla que deja crear
  // misiones necesita leer el proyecto); aquí las reglas no aplican, pero se hace igual: el orden
  // de escritura es el mismo en los dos caminos y así lo que se prueba aquí vale allí.
  await db.collection("projects").doc(id).set(Object.assign({}, paq.proyecto, {
    teacherId: "SEMBRADO", ownerId: "SEMBRADO",
    teacherEmail: "mutecdgami@gmail.com", ownerEmail: "mutecdgami@gmail.com",
    createdAt: Date.now(), isOnboardingComplete: true
  }));
  await db.collection("projects").doc(id).collection("privado").doc("stargate").set(paq.privado);
  console.log("· grupo creado:", nombre);

  for (const [col, lista] of [["missions", paq.misiones], ["campaigns", paq.campanas], ["rewards", paq.recompensas]]) {
    for (let i = 0; i < lista.length; i += 400) {
      const lote = db.batch();
      lista.slice(i, i + 400).forEach(x => {
        const { id: _fuera, ...resto } = x;   // ver conIdsDeDocumento: el `id` no entra en el documento
        lote.set(db.collection(col).doc(id + "__" + x.id), Object.assign({}, resto, conIdsDeDocumento(id, x)));
      });
      await lote.commit();
    }
    console.log("· " + col + ":", lista.length);
  }

  if (conReclutas) {
    const porId = {}; paq.misiones.forEach(m => { porId[m.id] = m; });
    const ini = new Date(inicio + "T10:00:00").getTime();
    for (let k = 0; k < SIEMBRA.length; k++) {
      const r = SIEMBRA[k];
      // Los mismos identificadores que escribe `completeMission` en producción. Sembrar con los
      // cortos habría funcionado en la demo y fallado con el primer alumno de verdad.
      const hechas = ["H1"].concat(r.retos).map(x => id + "__" + x);
      const sellos = {}, xp0 = { xp: 0, cred: 0 };
      hechas.forEach((rid, j) => {
        // Las fechas se reparten por el curso: sin eso, la racha y la corona semanal saldrían
        // siempre iguales para todos y no se vería si funcionan.
        sellos[rid] = [new Date(ini + j * 3 * 864e5).toISOString()];
        const m = porId[rid.split("__").pop()]; if (m) { xp0.xp += m.points || 0; xp0.cred += m.coinsReward || 0; }
      });
      const esc = (paq.proyecto.factions || []).filter(f => f.teacherName === r.profe)[0];
      const ficha = db.collection("student_profiles").doc();
      await ficha.set({
        userId: "demo_" + r.alias.toLowerCase(), projectId: id, displayName: r.alias,
        totalPoints: xp0.xp, coins: xp0.cred, inventory: [], earnedBadges: [],
        completedMissionIds: hechas, missionTimestamps: sellos, completedCampaignIds: [],
        currentPhase: 1, role: "student", hubCustomization: {}, createdAt: Date.now(),
        squadId: esc ? esc.id : null, factionId: esc ? esc.id : null,
        stargateProfe: r.profe,
        stargateAvatar: { tipo: "evo", n: (k % 7) + 1, v: k % 2 ? "m" : "f", url: "" },
        stargateBio: ""
      });
      await ficha.collection("privado").doc("datos").set({
        firstName: r.nombre, lastName: r.apellidos,
        email: r.alias.toLowerCase() + "@ejemplo.es", bitacora: "", bio: ""
      });
    }
    console.log("· reclutas de muestra:", SIEMBRA.length);
  }
  console.log("\nListo. La Nave: recluta.html?per=" + id + "&motor=firestore");
}

main().then(() => process.exit(0)).catch(e => { console.error("💥", e.message); process.exit(1); });
