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
 *   node motor/sembrar.js <id> "<Nombre>" <REGULAR|PUA> <AAAA-MM-DD> [--reclutas] [--version=1|2]
 *
 * 10-oct · el grupo sale del plan de `crearGrupoMod` (motor/plan_grupo.js): lo mismo que escribe el servidor cuando se crea
 * desde crear.html, en la versión de `versiones.nacen` de GamificaPro o en la de `--version`.
 */
const path = require("path");
const GP = "/Users/nor/Claude/vibewebs/gamificapro";
const admin = require(path.join(GP, "node_modules", "firebase-admin"));
const { catalogo } = require("./catalogo.js");
const { paquete } = require("./paquete.js");
const GRUPO = require("./plan_grupo.js");

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
  { alias: "Vega",  nombre: "Vega",  apellidos: "Estrella", profe: "Capitana Vega",  retos: ["A0","L1","B1","X1","L2","B2"] },
  { alias: "Orion", nombre: "Orion", apellidos: "Cazador",  profe: "Comandante Orion", retos: ["A0","L1","B1"] },
  { alias: "Lyra",  nombre: "Lyra",  apellidos: "Cuerda",   profe: "Capitana Vega",  retos: ["A0","L1"] },
  { alias: "Nix",   nombre: "Nix",   apellidos: "Noche",    profe: "Mr Cuarter",     retos: ["A0"] },
  { alias: "Talia", nombre: "Talia", apellidos: "Vuelo",    profe: "Comandante Orion", retos: ["A0","L1","B1","X1","L2","B2","L3","B3","X2"] }
];

async function main() {
  const [id, nombre, tipo, inicio] = process.argv.slice(2);
  const conReclutas = process.argv.indexOf("--reclutas") >= 0;
  const version = GRUPO.versionPedida();
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

  // 10-oct · por el plan de crearGrupoMod (motor/plan_grupo.js): el proyecto, el equipo, los retos, las campañas y las
  // recompensas, con sus ids de documento y sin el campo `id` dentro (documentoDelPaquete), en un lote. Lo «crea» SEMBRADO
  // con el correo del referente de la demo, como antes.
  const plan = await GRUPO.plan({ id, proyecto: paq.proyecto, privado: paq.privado, misiones: paq.misiones, campanas: paq.campanas,
    recompensas: paq.recompensas }, { uid: "SEMBRADO", correo: "mutecdgami@gmail.com", nombre: "Mr Cuarter" }, version);
  await GRUPO.escribir(db, plan);
  console.log("· grupo creado:", nombre, "· versión", plan.version);
  for (const [col, lista] of [["missions", paq.misiones], ["campaigns", paq.campanas], ["rewards", paq.recompensas]]) console.log("· " + col + ":", lista.length);

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
  // 🔴 El código se imprime SIEMPRE. Sembrar un grupo y no decir su código es sembrar un grupo en el
  // que nadie puede alistarse, y el dato solo está aquí.
  console.log("\nListo.");
  console.log("  Código de acceso : " + (paq.proyecto.joinCode || "(sin código)"));
  console.log("  Alistarse        : alistarse.html?per=" + id + "&motor=firestore" +
              (paq.proyecto.joinCode ? "&codigo=" + paq.proyecto.joinCode : ""));
  console.log("  La Nave          : recluta.html?per=" + id + "&motor=firestore");
}

main().then(() => process.exit(0)).catch(e => { console.error("💥", e.message); process.exit(1); });
