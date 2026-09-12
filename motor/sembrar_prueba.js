'use strict';
/**
 * STARGATE · LA CLASE DE PRUEBA DE NORBERTO
 *
 * Un grupo completo para probar el sistema con gente dentro: 20 reclutas de mentira en la semana 10,
 * con progresos MUY distintos a propósito —desde quien no ha hecho nada hasta quien va sobrado— y el
 * equipo docente real, para poder entrar con cada cuenta y ver exactamente lo que ve cada rol.
 *
 * 🔴 Escribe en el Firestore de VERDAD. Solo crea documentos bajo `prueba-humana`; no toca nada más.
 *   node motor/sembrar_prueba.js
 */
const path = require("path");
const GP = "/Users/nor/Claude/vibewebs/gamificapro";
const admin = require(path.join(GP, "node_modules", "firebase-admin"));
const { catalogo } = require("./catalogo.js");
const { paquete } = require("./paquete.js");

admin.initializeApp({ credential: admin.credential.cert(require(path.join(GP, "service-account.json"))) });
const db = admin.firestore();

const ID = "prueba-humana";
const NOMBRE = "PRUEBA HUMANA · 20 reclutas";
// Semana 10 hoy: la semana 1 empezó hace 9 semanas justas.
const INICIO = new Date(Date.now() - 9 * 7 * 864e5).toISOString().slice(0, 10);

/**
 * 🔴 Norberto figura DOS VECES en espíritu: `rol: referente` **e** `imparte: true`. Es el caso que
 * él mismo describió —«un docente puede ser referente, docente o los dos a la vez»— y el que hay que
 * poder probar: solo quien imparte se lleva escuadrón y alumnado.
 */
const DOCENTES = [
  { nombre: "Norberto Cuartero", correo: "n.cuartero.10@gmail.com", rol: "referente", imparte: true },
  { nombre: "Norberto Genially", correo: "norberto@genially.com",   rol: "docente",   imparte: true }
];

// Los 20, con progresos deliberadamente desiguales: sin variedad no se ve si el ranking ordena, si
// la corona semanal cambia de manos ni si «la misión más hecha» dice algo.
const ALIAS = [
  ["Tritón","Marta","Sanz"],      ["Nova","Pablo","Ferrer"],     ["Quasar","Lucía","Ibáñez"],
  ["Vega","Andrés","Molina"],     ["Órbita","Elena","Ruiz"],     ["Cénit","Javier","Ortiz"],
  ["Umbra","Sara","Peña"],        ["Bóreas","Diego","Lara"],     ["Perseo","Nuria","Gil"],
  ["Atlas","Iván","Serra"],       ["Lyra","Carmen","Vidal"],     ["Halo","Rubén","Castro"],
  ["Eclipse","Alba","Nieto"],     ["Cronos","Hugo","Prieto"],    ["Iris","Paula","Mena"],
  ["Zenit","Marcos","Roldán"],    ["Deriva","清","Ortega"],      ["Faro","Adriana","Cid"],
  ["Silbo","Óscar","Reyes"],      ["Nébula","Irene","Bravo"]
];
// Cuántos retos lleva cada uno. Escalado a propósito: dos sin empezar, un puñado a medias y tres
// que van sobrados. En la semana 10 lo abierto son ~13 retos.
const CUANTOS = [13,12,11,10,10,9,9,8,8,7,7,6,6,5,5,4,3,2,0,0];
const ORDEN = ["A0","A1","B1","X1","A2","B2","A3","B3","X2","A4","B4","A5","B5"];

async function main() {
  const cat = catalogo();
  const paq = paquete({ id: ID, nombre: NOMBRE, tipo: "REGULAR", inicio: INICIO,
                        docentes: DOCENTES, referente: DOCENTES[0].correo }, cat);

  await db.collection("projects").doc(ID).set(Object.assign({}, paq.proyecto, {
    ownerId: "sembrado", createdAt: Date.now(), isOnboardingComplete: true
  }));
  await db.collection("projects").doc(ID).collection("privado").doc("stargate").set(paq.privado);

  const porId = {};
  for (const col of ["missions", "campaigns", "rewards"]) {
    const lista = col === "missions" ? paq.misiones : col === "campaigns" ? paq.campanas : paq.recompensas;
    for (let i = 0; i < lista.length; i += 400) {
      const lote = db.batch();
      lista.slice(i, i + 400).forEach(x => {
        const { id: _fuera, ...resto } = x;
        if (col === "missions") porId[x.id] = x;
        lote.set(db.collection(col).doc(ID + "__" + x.id), Object.assign({}, resto, {
          projectId: ID, stargateId: x.id,
          ...(Array.isArray(x.missionIds) ? { missionIds: x.missionIds.map(s => ID + "__" + s) } : {}),
          ...(Array.isArray(x.optionalMissionIds) ? { optionalMissionIds: x.optionalMissionIds.map(s => ID + "__" + s) } : {}),
          ...(Array.isArray(x.rewardItemIds) ? { rewardItemIds: x.rewardItemIds.map(s => ID + "__" + s) } : {}),
          ...(x.campaignId ? { campaignId: ID + "__" + x.campaignId } : {}),
          ...(x.unlockWhenCampaignComplete ? { unlockWhenCampaignComplete: ID + "__" + x.unlockWhenCampaignComplete } : {}),
          ...(x.consumeEffects && x.consumeEffects.lootBox ? { consumeEffects: Object.assign({}, x.consumeEffects,
              { lootBox: { items: x.consumeEffects.lootBox.items.map(i => Object.assign({}, i, { rewardId: ID + "__" + i.rewardId })) } }) } : {})
        }));
      });
      await lote.commit();
    }
  }

  const ini = new Date(INICIO + "T09:00:00").getTime();
  for (let k = 0; k < ALIAS.length; k++) {
    const [alias, nom, ape] = ALIAS[k];
    const retos = ORDEN.slice(0, CUANTOS[k]);
    const hechas = retos.map(x => ID + "__" + x);
    const sellos = {}; let xp = 0, cred = 0;
    hechas.forEach((rid, j) => {
      // Repartidas por el curso, y las últimas DENTRO de los siete últimos días para que el xp de
      // la semana y la corona no salgan a cero en todo el grupo.
      const dias = j < hechas.length - 2 ? j * 4 : 60 + j;
      sellos[rid] = [new Date(Math.min(Date.now() - 864e5, ini + dias * 864e5)).toISOString()];
      const m = porId[rid.split("__").pop()];
      if (m) { xp += m.points || 0; cred += m.coinsReward || 0; }
    });
    // El escuadrón se reparte entre los dos que imparten.
    const profe = DOCENTES[k % 2].nombre;
    const esc = (paq.proyecto.factions || []).filter(f => f.teacherName === profe)[0];
    const ficha = db.collection("student_profiles").doc();
    await ficha.set({
      userId: "prueba_" + alias.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, ""),
      projectId: ID, displayName: alias,
      totalPoints: xp, coins: cred, inventory: [], earnedBadges: [],
      completedMissionIds: hechas, missionTimestamps: sellos, completedCampaignIds: [],
      currentPhase: 1, role: "student", hubCustomization: {}, createdAt: Date.now(),
      squadId: esc ? esc.id : null, factionId: esc ? esc.id : null,
      stargateProfe: profe,
      stargateAvatar: { tipo: "evo", n: (k % 7) + 1, v: k % 2 ? "m" : "f", url: "" },
      stargateBio: ""
    });
    await ficha.collection("privado").doc("datos").set({
      firstName: nom, lastName: ape,
      email: alias.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "") + "@prueba.es",
      bitacora: "", bio: ""
    });
  }

  // Un escondite por planeta, listos para pegar en los Geniallys.
  const huevos = [1,2,3,4,5,6,7,8].map(n => ({
    id: "p" + n, nombre: "Presentación del Tema " + n,
    premio: n % 3 === 0 ? "bolsa" : n % 3 === 1 ? "sobre" : "heroe",
    limite: 0, activo: true, creditos: 50
  }));
  await db.collection("projects").doc(ID).update({ "stargate.huevos": huevos });

  console.log("✓ sembrado:", ID);
  console.log("  semana 1:", INICIO, "· hoy debería ser la semana 10");
  console.log("  reclutas:", ALIAS.length, "· escondites:", huevos.length);
  console.log("  código de acceso:", paq.proyecto.joinCode);
}
main().catch(e => { console.error("✗", e); process.exit(1); });
