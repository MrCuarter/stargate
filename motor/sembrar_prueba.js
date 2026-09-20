'use strict';
/**
 * STARGATE · LA CLASE DE PRUEBA DE NORBERTO
 *
 * Un grupo completo para probar el sistema con gente dentro: 20 reclutas de mentira en la semana 10,
 * con progresos MUY distintos a propósito —desde quien no ha hecho nada hasta quien va sobrado— y el
 * equipo docente real, para poder entrar con cada cuenta y ver exactamente lo que ve cada rol.
 *
 * 🔴 Escribe en el Firestore de VERDAD. Solo crea documentos bajo su propio grupo; no toca nada más.
 *   node motor/sembrar_prueba.js            → la clase de prueba de Norberto (prueba-humana)
 *   node motor/sembrar_prueba.js --demo     → el grupo del botón DEMO de la portada (demo-stargate)
 *   node motor/sembrar_prueba.js --id=prueba-semana-16 --nombre="…" --semana=16 [--real=CORREO-DE-LA-CUENTA]
 *        → 16-sep · un grupo de prueba EN LA SEMANA QUE SE PIDA, con los 20 reclutas repartidos sobre los retos que
 *          ya están abiertos esa semana (catálogo de hoy: relámpago y simulacro incluidos), colección, logros de a bordo
 *          y el Simulador. Con `--real`, el primero es esa cuenta DE VERDAD (su uid de Firebase Auth) con casi todo hecho,
 *          para entrar con ella. No pisa un grupo que ya exista.
 *
 * LA DEMO ES OTRO GRUPO, Y A PROPÓSITO. La clase de prueba es para tocarla: Norberto se aliste en
 * ella, completa retos, abre llamadas. El escaparate público no puede cambiar cada vez que alguien
 * prueba algo, así que va aparte, con profesorado de ficción y la semana CONGELADA (`demoSemana`):
 * el tablero hace como si hoy fuera la semana 10 y la demo no caduca nunca.
 */
const path = require("path");
const GP = "/Users/nor/Claude/vibewebs/gamificapro";
const admin = require(path.join(GP, "node_modules", "firebase-admin"));
const { catalogo } = require("./catalogo.js");
const { paquete } = require("./paquete.js");

/**
 * 🔴 EL LABORATORIO (`--lab`) SOLO SIEMBRA EN EL EMULADOR, y el cerrojo va aquí arriba, antes de
 * abrir ninguna conexión. Si falta FIRESTORE_EMULATOR_HOST se aborta: sembrar el laboratorio en el
 * Firestore de verdad llenaría producción de grupos de mentira con profesorado inventado. Y en el
 * emulador no se usa la cuenta de servicio — ni siquiera se lee el fichero.
 */
const LAB = process.argv.includes("--lab");
if (LAB && !process.env.FIRESTORE_EMULATOR_HOST) {
  console.error("✗ --lab solo siembra en el emulador. Falta FIRESTORE_EMULATOR_HOST. No se ha tocado nada.");
  process.exit(2);
}
// (16-sep · y cualquier otro modo, si se lanza contra el emulador: así se ensaya un grupo a medida antes de producción)
if (LAB || process.env.FIRESTORE_EMULATOR_HOST) admin.initializeApp({ projectId: "demo-stargate" });
else admin.initializeApp({ credential: admin.credential.cert(require(path.join(GP, "service-account.json"))) });
const db = admin.firestore();

const DEMO = process.argv.includes("--demo");
/**
 * 🔴 20-sep · LA NAVE ESCUELA (`--escuela`). Norberto: «crea un grupo EJEMPLO (busca un nombre más atractivo). Sirve
 * para que los docentes puedan explorar, interactuar… lo más fiel posible a un grupo normal», con «30 estudiantes con
 * diferentes niveles de implicación», tickets de salida de cada tema, compras, cartas en el Zoco y participaciones.
 *
 * Es un grupo a medida (`--id --semana`) con el curso ENTERO por detrás y cuatro cosas más que un grupo recién
 * sembrado no tiene y una clase de verdad sí: lo comprado en el Mercado, el Zoco con tratos vivos, las papeletas del
 * Gran Sorteo y los tickets de salida. Y lleva `stargate.escuela`, que es lo que enciende en la web el selector de
 * semanas: la Nave Escuela se puede mirar en la semana que sea, sin escribir nada (ver motor/tablero.js).
 */
const ESCUELA = process.argv.includes("--escuela");
const arg = k => { const a = process.argv.find(x => x.indexOf("--" + k + "=") === 0); return a ? a.slice(k.length + 3) : null; };
const A_ID = ESCUELA ? "nave-escuela" : (!LAB && !DEMO ? arg("id") : null);
// 🔴 La semana 15, no la 16: con la 16 el curso sale «terminado» —se ordena el último en «Mis grupos» y el banner
// dice «Curso terminado»—, y lo que hace falta es un grupo VIVO con todo abierto. En la 15 está el viaje entero.
const A_SEMANA = ESCUELA ? 15 : Number(arg("semana") || 0), A_REAL = ESCUELA ? null : arg("real");
const CUSTOM = !!A_ID;
if (CUSTOM && !/^[a-z0-9-]{3,40}$/.test(A_ID)) { console.error("✗ --id: minúsculas, números y guiones"); process.exit(2); }
if (CUSTOM && !(A_SEMANA >= 1 && A_SEMANA <= 16)) { console.error("✗ --semana: de 1 a 16"); process.exit(2); }
const ID = LAB ? "lab-clase" : DEMO ? "demo-stargate" : CUSTOM ? A_ID : "prueba-humana";
// 🔴 El nombre de la demo tiene que llevar «DEMO»: es la llave de `demoPermitido()` en la Nave.
const NOMBRE = LAB ? "LAB · CLASE DE PRUEBA" : DEMO ? "STARGATE · DEMO" : ESCUELA ? "STARGATE · NAVE ESCUELA"
             : CUSTOM ? (arg("nombre") || A_ID) : "PRUEBA HUMANA · 20 reclutas";
// Semana 10 hoy: la semana 1 empezó hace 9 semanas justas. Con --semana=N, la semana 1 es el lunes de hace N-1 semanas.
const LUNES = (() => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); })();
const INICIO = CUSTOM ? new Date(LUNES - (A_SEMANA - 1) * 7 * 864e5).toISOString().slice(0, 10)
                      : new Date(Date.now() - 9 * 7 * 864e5).toISOString().slice(0, 10);

/**
 * 🔴 Norberto figura DOS VECES en espíritu: `rol: referente` **e** `imparte: true`. Es el caso que
 * él mismo describió —«un docente puede ser referente, docente o los dos a la vez»— y el que hay que
 * poder probar: solo quien imparte se lleva escuadrón y alumnado.
 */
/**
 * El laboratorio tiene los TRES casos de profesorado que existen, porque cada uno ve una web distinta:
 * referente que además imparte, docente raso, y referente que NO imparte (no lleva escuadrón ni
 * alumnado, pero lo gobierna todo). Norberto: «en ocasiones el referente NO IMPARTE».
 */
/** El equipo del laboratorio: los tres casos de profesorado que existen, porque cada uno ve una web distinta. */
const EQUIPO_LAB = [
  { nombre: "Rita Referente", correo: "rita@lab.test", rol: "referente", imparte: true },
  { nombre: "Dani Docente",   correo: "dani@lab.test", rol: "docente",   imparte: true },
  { nombre: "Sol Coordina",   correo: "sol@lab.test",  rol: "referente", imparte: false }
];
const DOCENTES = LAB ? EQUIPO_LAB : DEMO ? [
  // Profesorado de ficción: el público ve estos nombres en el tablero y en la ficha de cada recluta.
  // Los correos no existen ni pueden existir (.invalid está reservado para eso, RFC 2606).
  { nombre: "Capitana Vega",    correo: "capitana.vega@stargate.invalid",    rol: "referente", imparte: true },
  { nombre: "Comandante Orion", correo: "comandante.orion@stargate.invalid", rol: "docente",   imparte: true }
] : ESCUELA ? (process.env.FIRESTORE_EMULATOR_HOST ? EQUIPO_LAB : [
  // 🔴 Las dos cuentas del equipo que ya mandan en todo (los referentes vitalicios de motor.js). Se ve el grupo quien
  // esté en `coTeacherEmails`, así que para que lo explore alguien más se le añade desde «Gestionar grupos → Equipo
  // docente»: es la misma puerta que para una clase de verdad, y así se prueba también eso.
  { nombre: "Norberto Cuartero", correo: "n.cuartero.10@gmail.com", rol: "referente", imparte: true },
  { nombre: "CCD TEAM",          correo: "mutecdgami@gmail.com",    rol: "docente",   imparte: true }
]) : [
  { nombre: "Norberto Cuartero", correo: "n.cuartero.10@gmail.com", rol: "referente", imparte: true },
  { nombre: "Norberto Genially", correo: "norberto@genially.com",   rol: "docente",   imparte: true }
];

// Los 20, con progresos deliberadamente desiguales: sin variedad no se ve si el ranking ordena, si
// la corona semanal cambia de manos ni si «la misión más hecha» dice algo.
/**
 * 🔴 20-sep · LOS DIEZ ÚLTIMOS SON SOLO DE LA NAVE ESCUELA. Al añadirlos a esta lista sin más, TODOS los grupos
 * sembrados pasaron a tener 30 reclutas — incluido el del laboratorio—, y «Cometa» quedó ocupado: la prueba en la que
 * Carla se alista con ese alias empezó a fallar, y con ella las seis que venían detrás. Un dato compartido que cambia
 * de tamaño rompe a quien no lo pidió. Los demás modos se quedan en 20, que es para lo que están hechos `CUANTOS` y
 * la primera mitad de `FRACCION`.
 */
const ALIAS_TODOS = [
  ["Tritón","Marta","Sanz"],      ["Nova","Pablo","Ferrer"],     ["Quasar","Lucía","Ibáñez"],
  ["Vega","Andrés","Molina"],     ["Órbita","Elena","Ruiz"],     ["Cénit","Javier","Ortiz"],
  ["Umbra","Sara","Peña"],        ["Bóreas","Diego","Lara"],     ["Perseo","Nuria","Gil"],
  ["Atlas","Iván","Serra"],       ["Lyra","Carmen","Vidal"],     ["Halo","Rubén","Castro"],
  ["Eclipse","Alba","Nieto"],     ["Cronos","Hugo","Prieto"],    ["Iris","Paula","Mena"],
  ["Zenit","Marcos","Roldán"],    ["Deriva","Clara","Ortega"],      ["Faro","Adriana","Cid"],
  ["Silbo","Óscar","Reyes"],      ["Nébula","Irene","Bravo"],
  // 20-sep · los diez de la Nave Escuela, hasta 30 («mete 30 estudiantes con diferentes niveles de implicación»)
  ["Cometa","Leo","Arnau"],       ["Aurora","Daniela","Sierra"],  ["Pulsar","Unai","Mendoza"],
  ["Ítaca","Rocío","Belmonte"],   ["Kairós","Nil","Fuentes"],     ["Solsticio","Aitana","Robles"],
  ["Tramontana","Bruno","Calvo"], ["Céfiro","Lola","Amat"],       ["Antares","Hugo","Salas"],
  ["Estela","Miriam","Duarte"]
];
const ALIAS = ALIAS_TODOS.slice(0, ESCUELA ? 30 : 20);
// Los títulos que se compran en el Mercado (rec3). Salen del catálogo de la Nave; aquí basta con que suenen a lo
// que el alumnado elegiría, porque lo que se está probando es que el título SE VEA bajo el alias.
const TITULOS = ["Cartógrafa de la Nebulosa", "Piloto de pruebas", "Archivista de a bordo", "Rompesilencios",
                 "Vigía del puente", "Ingeniera de fragmentos", "Voz de la Rebelión", "Guardián de la Bitácora"];
// Cuántos retos lleva cada uno. Escalado a propósito: dos sin empezar, un puñado a medias y tres
// que van sobrados. En la semana 10 lo abierto son ~13 retos.
const CUANTOS = [13,12,11,10,10,9,9,8,8,7,7,6,6,5,5,4,3,2,0,0];
const ORDEN = ["A0","A1","B1","X1","A2","B2","A3","B3","X2","A4","B4","A5","B5"];

async function main() {
  if (CUSTOM && (await db.collection("projects").doc(ID).get()).exists) {
    console.error("✗ ya existe un grupo «" + ID + "». No se toca: bórralo antes o elige otro --id."); process.exit(2);
  }
  // la cuenta de verdad (si la hay): su uid de Firebase Auth, para que al entrar con Google se vea en su ficha
  const REAL = CUSTOM && A_REAL ? await admin.auth().getUserByEmail(A_REAL).catch(() => null) : null;
  if (CUSTOM && A_REAL && !REAL) { console.error("✗ " + A_REAL + " no ha entrado nunca en la plataforma: no tiene uid."); process.exit(2); }
  // lo que la Nave necesita saber de los capítulos y de los logros de a bordo (un dato, un sitio: _site_data.py)
  const DATOS_WEB = CUSTOM ? JSON.parse(require("child_process").execFileSync("python3", ["-c",
    "import json,_site_data as D;print(json.dumps({'caps':[[c['clave'],c['semana']] for c in D.CAPITULOS],'hitos':[(h['clave'] if isinstance(h,dict) else h[0]) for h in D.HITOS_A_BORDO]}))"],
    { cwd: path.join(__dirname, ".."), encoding: "utf8" })) : null;
  const cat = catalogo();
  const paq = paquete({ id: ID, nombre: NOMBRE, tipo: "REGULAR", inicio: INICIO,
                        docentes: DOCENTES, referente: DOCENTES[0].correo }, cat);

  const proyecto = Object.assign({}, paq.proyecto, {
    ownerId: "sembrado", createdAt: Date.now(), isOnboardingComplete: true
  });
  if (DEMO) proyecto.stargate = Object.assign({}, proyecto.stargate, { demoSemana: 10 });
  // 🔴 `escuela`: la web deja elegir en qué semana se mira este grupo (y no escribe nada al hacerlo). Ver motor/tablero.js.
  if (ESCUELA) proyecto.stargate = Object.assign({}, proyecto.stargate, { escuela: true });
  await db.collection("projects").doc(ID).set(proyecto);
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
          ...(x.linkedItemId ? { linkedItemId: ID + "__" + x.linkedItemId } : {}),
          ...(x.consumeEffects && x.consumeEffects.lootBox ? { consumeEffects: Object.assign({}, x.consumeEffects,
              { lootBox: { items: x.consumeEffects.lootBox.items.map(i => Object.assign({}, i, { rewardId: ID + "__" + i.rewardId })) } }) } : {})
        }));
      });
      await lote.commit();
    }
  }

  const ini = new Date(INICIO + "T09:00:00").getTime();
  const GENTE = [];   // quién ha quedado sembrado: lo necesitan el Zoco y los tickets, que van después
  // 16-sep · en un grupo a medida, los retos que ya están abiertos esa semana, en el orden del catálogo
  const DISPONIBLES = paq.misiones.filter(m => m.id !== "H1" && Number(m.stargateSemana || 1) <= (A_SEMANA || 99))
    .sort((a, b) => (a.order || 0) - (b.order || 0)).map(m => m.id);
  /**
   * CUÁNTO LLEVA CADA UNO. No es una rampa bonita a propósito: una clase de verdad tiene dos o tres que van sobrados,
   * un pelotón grande a medio camino, unos cuantos rezagados y siempre alguien que no ha entrado nunca. Si todos
   * llevaran lo mismo no se vería si el ranking ordena, si la corona cambia de manos ni a quién señala NEBULA.
   */
  const FRACCION = [1, .95, .9, .85, .8, .75, .7, .65, .6, .55, .5, .45, .4, .35, .3, .25, .2, .1, 0, 0]
    .concat([.98, .88, .72, .68, .58, .48, .33, .22, .06, 0]).slice(0, ALIAS.length);
  for (let k = 0; k < ALIAS.length; k++) {
    const esReal = !!(REAL && k === 0);
    const [alias, nom, ape] = esReal ? ["Mr Cuarter", "Norberto", "Cuartero"] : ALIAS[k];
    const retos = !CUSTOM ? ORDEN.slice(0, CUANTOS[k])
      : DISPONIBLES.slice(0, esReal ? Math.max(0, DISPONIBLES.length - 3) : Math.round(FRACCION[k] * DISPONIBLES.length));
    const hechas = retos.map(x => ID + "__" + x);
    const sellos = {}; let xp = 0, cred = 0;
    hechas.forEach((rid, j) => {
      const m = porId[rid.split("__").pop()];
      let t;
      if (CUSTOM) {
        // en su semana (con unos días de desfase para que no coincidan todos), y las dos últimas en los siete últimos días
        const sem = Number((m && m.stargateSemana) || 1);
        t = j >= hechas.length - 2 ? Date.now() - (hechas.length - j) * 864e5 - k * 3600e3
                                   : ini + ((sem - 1) * 7 + ((j + k) % 5)) * 864e5 + k * 3600e3;
        t = Math.min(Date.now() - 3600e3, t);
      } else {
        // Repartidas por el curso, y las últimas DENTRO de los siete últimos días para que el xp de
        // la semana y la corona no salgan a cero en todo el grupo.
        const dias = j < hechas.length - 2 ? j * 4 : 60 + j;
        t = Math.min(Date.now() - 864e5, ini + dias * 864e5);
      }
      sellos[rid] = [new Date(t).toISOString()];
      if (m) { xp += m.points || 0; cred += m.coinsReward || 0; }
    });
    // El escuadrón se reparte entre los dos que imparten.
    const profe = DOCENTES[k % 2].nombre;
    const esc = (paq.proyecto.factions || []).filter(f => f.teacherName === profe)[0];
    const ficha = db.collection("student_profiles").doc();
    // 🔴 En la demo el álbum no puede salir a 0/26: es lo primero que se mira y lo que más engancha.
    // Cada recluta lleva cartas en proporción a lo que ha hecho —con alguna repetida, que es lo que
    // da sentido al cambio de tres repetidas por un sobre— y los que van arriba, un héroe ganado.
    const inventario = []; let heroeSuyo = "";
    if (DEMO || CUSTOM) {
      const cromos = paq.recompensas.filter(r => r.stargateTipo === "cromo" && /^cromo_/.test(r.id)).map(r => r.id);
      const heroes = paq.recompensas.filter(r => r.stargateTipo === "heroe" && /^heroe_/.test(r.id)).map(r => r.id);
      const cuantas = Math.round(retos.length * 1.6);
      for (let c = 0; c < cuantas; c++) inventario.push(ID + "__" + cromos[(k * 7 + c * 3) % Math.min(20, cromos.length)]);
      if (retos.length >= 9) { heroeSuyo = heroes[k % heroes.length]; inventario.push(ID + "__" + heroeSuyo); }
      // 20-sep · en la Nave Escuela, quien va sobrado tiene DOS héroes: es lo que hace que el Zoco tenga sentido
      if (ESCUELA && retos.length >= 20) inventario.push(ID + "__" + heroes[(k * 5 + 3) % heroes.length]);
    }
    const uidFalso = esReal ? REAL.uid : (DEMO ? "demo_" : "prueba_") + alias.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "");
    // 16-sep · lo que da vida a la ficha en un grupo a medida: logros de a bordo en proporción a lo hecho, los capítulos de
    // NEBULA ya vistos (la cuenta real no se come once bienvenidas seguidas) y, a quien venció a Joran, sus marcas.
    const extra = {};
    if (CUSTOM) {
      const prop = DISPONIBLES.length ? retos.length / DISPONIBLES.length : 0;
      const hitos = {}; DATOS_WEB.hitos.slice(0, Math.round(prop * DATOS_WEB.hitos.length)).forEach((h, i) => { hitos[h] = Date.now() - (i + 2) * 3 * 864e5; });
      extra.stargateHitos = hitos;
      const caps = {}; DATOS_WEB.caps.filter(c => c[1] <= A_SEMANA && (esReal || prop >= 0.3)).forEach(c => {
        caps[c[0]] = { v: 1, estado: "hecho", fecha: ini + (c[1] - 1) * 7 * 864e5 }; });
      extra.stargateCapitulos = caps;
      extra.stargateDias = { tz: "Europe/Madrid", ultimo: new Date(Date.now() - 864e5).toISOString().slice(0, 10),
                             racha: Math.round(prop * 6), mejor: Math.round(prop * 9), total: Math.round(prop * 40) };
      if (retos.indexOf("A6") >= 0) {
        const aciertos = 20 + ((k * 13) % 60) + (esReal ? 40 : 0), respondidas = aciertos + 8 + (k % 7) * 3;
        extra.stargateSimulador = {
          joran: { f: ini + 9 * 7 * 864e5, p: 900 + ((k * 37) % 400) },
          marcas: { t1: { p: 400 + k * 11, f: ini + 10 * 7 * 864e5 }, todas: { p: 700 + ((k * 53) % 500), f: ini + 11 * 7 * 864e5 } },
          total: { batallas: 3 + (k % 6), aciertos: aciertos, respondidas: respondidas, ms: aciertos * (4200 + ((k * 331) % 5200)) }
        };
      }
      /**
       * 🔴 20-sep · LO QUE SE HA GASTADO. Un grupo recién sembrado tiene cartas y nada más: nadie se ha comprado un
       * marco, nadie lleva puesto un héroe y el Gran Sorteo está a cero papeletas. Y justo eso es lo que un docente
       * quiere ver antes de contarlo en clase. Los adornos van al inventario CON su recompensa (`rec3`, `rec4`,
       * `rec5`) además de en su campo: el Mercado mira el inventario para decir «ya la tienes».
       */
      if (ESCUELA) {
        const compro = rec => inventario.push(ID + "__" + rec);
        if (prop >= .45) { compro("rec3"); extra.stargateTitulo = TITULOS[k % TITULOS.length]; }
        if (prop >= .55) { compro("rec4"); extra.stargateFondo = String((k % 8) + 1); }
        if (prop >= .75) { compro("rec5"); extra.stargateMarco = "oro"; }
        // el vestuario: quien tiene un héroe se lo pone (uno de cada tres se queda con su personaje de siempre)
        if (heroeSuyo && k % 3 !== 2) extra.stargateViste = "heroe:" + heroeSuyo.replace(/^heroe_/, "");
        // las papeletas del Gran Sorteo: se compran en el Mercado y el docente las regala en clase
        if (prop >= .2) extra.lotteryEntries = { [ID + "__sorteo1"]: 1 + ((k * 3) % 6) };
      }
    }
    // 13-sep · su alias, reservado como lo reserva la web (las reglas lo exigen a quien se aliste después)
    const clave = alias.replace(/[A-Z]+/g, m => m.toLowerCase()).trim().replace(/[áàäâãÁÀÄÂÃ]/g, "a").replace(/[éèëêÉÈËÊ]/g, "e").replace(/[íìïîÍÌÏÎ]/g, "i")
      .replace(/[óòöôõÓÒÖÔÕ]/g, "o").replace(/[úùüûÚÙÜÛ]/g, "u").replace(/[ñÑ]/g, "n").replace(/[çÇ]/g, "c").replace(/\//g, "-").replace(/ +/g, " ");
    await db.collection("stargate_alias").doc(ID + "__" + clave).set({ projectId: ID, uid: uidFalso, alias: alias, creado: Date.now() });
    await ficha.set({
      userId: uidFalso,
      projectId: ID, displayName: alias,
      totalPoints: xp, coins: cred, inventory: inventario, earnedBadges: [],
      completedMissionIds: hechas, missionTimestamps: sellos, completedCampaignIds: [],
      currentPhase: 1, role: "student", hubCustomization: {}, createdAt: Date.now(),
      squadId: esc ? esc.id : null, factionId: esc ? esc.id : null,
      stargateProfe: profe,
      stargateAvatar: { tipo: "evo", n: (k % 7) + 1, v: k % 2 ? "m" : "f", url: "" },
      stargateBio: "",
      ...extra
    });
    await ficha.collection("privado").doc("datos").set({
      firstName: nom, lastName: ape,
      email: esReal ? A_REAL : alias.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "") + "@prueba.es",
      bitacora: "", bio: ""
    });
    GENTE.push({ ficha: ficha.id, uid: uidFalso, alias: alias, profe: profe, inventario: inventario,
                 creditos: cred, retos: retos.length, papeletas: Number((extra.lotteryEntries || {})[ID + "__sorteo1"] || 0) });
  }
  if (ESCUELA) { await sembrarZoco(GENTE); await sembrarTickets(ini); }

  // 🔴 17-sep · SIN PREMIOS DE MUESTRA. Nacían ocho («p1»…«p8», adivinables cambiando el número) y Norberto: «no es
  // necesario ver todo: se pueden ir añadiendo a medida que los vaya necesitando». Los premios por enlace se crean en la
  // consola, con su código secreto (motor.js · guardarPremioEnlace).
  const huevos = [];
  if (huevos.length) {
    await db.collection("projects").doc(ID).update({ "stargate.huevos": huevos });
    // 🔴 Y sus recompensas en el servidor: sin ellas, el escondite existe en la lista y no se puede
    // reclamar. La forma sale de paquete.js, la misma que escribe la consola al guardar.
    const { premioDeHuevo, idPremioHuevo } = require("./paquete.js");
    const conCofre = paq.recompensas.filter(r => r.consumeEffects && r.consumeEffects.lootBox);
    const traduce = r => r && Object.assign({}, r, { consumeEffects: { lootBox: { items:
      r.consumeEffects.lootBox.items.map(i => Object.assign({}, i, { rewardId: ID + "__" + i.rewardId })) } } });
    const sobre = traduce(conCofre.find(r => r.stargateTipo === "cromo"));
    const heroe = traduce(conCofre.find(r => r.stargateTipo === "heroe"));
    const lote = db.batch();
    huevos.forEach(h => lote.set(db.collection("rewards").doc(idPremioHuevo(ID, h.id)), premioDeHuevo(ID, h, sobre, heroe)));
    await lote.commit();
  }

  console.log("✓ sembrado:", ID);
  console.log("  semana 1:", INICIO, DEMO ? "· congelada en la semana 10 para siempre" : "· hoy debería ser la semana " + (A_SEMANA || 10));
  if (CUSTOM) console.log("  retos abiertos esa semana:", DISPONIBLES.length, REAL ? "· " + A_REAL + " (uid " + REAL.uid + ") con " + Math.max(0, DISPONIBLES.length - 3) : "");
  console.log("  reclutas:", ALIAS.length, "· escondites:", huevos.length);
  console.log("  código de acceso:", paq.proyecto.joinCode);
}
/**
 * ════════ EL ZOCO DE LA NAVE ESCUELA (20-sep) ════════
 *
 * Un grupo recién sembrado tiene el Zoco VACÍO, y el Zoco vacío no enseña nada: es la pantalla que más cuesta
 * explicar («¿esto qué es?») y la que más se entiende viéndola con cosas dentro. Así que aquí se deja como está un
 * martes cualquiera de la semana 10: siete cosas puestas —cromos, héroes y una papeleta del Gran Sorteo— y dos
 * tratos a medias, uno esperando al vendedor y otro con contraoferta esperando al comprador.
 *
 * 🔴 Se escribe con la MISMA forma que el servidor (functions/stargateZoco.js): `stargate_zoco` para lo puesto y
 * `stargate_tratos` para los tratos, y lo que el comprador ofrece sale de su ficha —queda APARTADO— igual que
 * cuando oferta de verdad. Si se apartara solo de mentira, el primer trato que alguien aceptara duplicaría cartas.
 */
async function sembrarZoco(gente) {
  const conHeroe = gente.filter(g => g.inventario.some(x => /__heroe_/.test(x)));
  const conCartas = gente.filter(g => g.inventario.some(x => /__cromo_/.test(x)));
  const pieza = id => ({ id: id, tipo: /__heroe_/.test(id) ? "heroe" : /__cromo_/.test(id) ? "cromo" : "participacion",
                         clave: String(id).split("__").pop().replace(/^(heroe|cromo)_/, "") });
  const quien = g => ({ ficha: g.ficha, uid: g.uid, alias: g.alias });
  const dia = n => Date.now() - n * 864e5;

  const puestas = [];
  // cuatro cromos de cuatro reclutas DISTINTOS y de distinta parte de la clase (los repetidos son lo que de verdad
  // se cambia): si los pusiera todos quien va primero, el Zoco parecería cosa de los que van sobrados
  [0, 3, 7, 11].forEach((n, i) => {
    const g = conCartas[n % conCartas.length]; if (!g) return;
    const suyos = g.inventario.filter(x => /__cromo_/.test(x));
    puestas.push({ de: g, id: suyos[suyos.length - 1 - i] || suyos[0], hace: i + 1 });
  });
  // dos héroes de quienes tienen dos (el segundo, que es el que se cambia)
  const dobles = conHeroe.filter(g => g.inventario.filter(x => /__heroe_/.test(x)).length > 1);
  [0, Math.min(2, dobles.length - 1)].forEach((n, i) => {
    const g = dobles[n]; if (!g || puestas.some(p => p.de === g && /heroe/.test(String(p.id)))) return;
    puestas.push({ de: g, id: g.inventario.filter(x => /__heroe_/.test(x))[1], hace: i + 2 });
  });
  // y una papeleta del Gran Sorteo: la reventa que Norberto pidió («debes permitir también añadir participaciones»)
  const conPapeletas = gente.filter(g => g.papeletas >= 3)[0];
  if (conPapeletas) puestas.push({ de: conPapeletas, id: ID + "__sorteo1", hace: 1 });

  const anuncios = [];
  for (const p of puestas) {
    if (!p.id) continue;
    const ref = db.collection("stargate_zoco").doc();
    await ref.set({ projectId: ID, estado: "abierto", vende: quien(p.de), pieza: pieza(p.id), creado: dia(p.hace), ofertas: 0 });
    anuncios.push({ ref: ref, vende: p.de, pieza: pieza(p.id) });
  }

  // ── dos tratos vivos. El comprador nunca es quien vende, y lo que ofrece se le quita de la ficha.
  const compradores = gente.filter(g => g.creditos >= 80 && !anuncios.some(a => a.vende.ficha === g.ficha));
  const tratos = [
    { a: anuncios[0], c: compradores[0], creditos: 25, mensaje: "Me falta esa para cerrar el planeta 3, ¿te vale?", paso: 1, turno: "vendedor" },
    { a: anuncios[4] || anuncios[1], c: compradores[1], creditos: 60, mensaje: "Te doy 60 ◈ por él.", paso: 2, turno: "comprador",
      pide: { creditos: 110, piezas: [] }, respuesta: "60 es poco para un héroe. Por 110 es tuyo." }
  ];
  for (const t of tratos) {
    if (!t.a || !t.c) continue;
    const suyos = t.c.inventario.filter(x => /__cromo_/.test(x));
    const ofrecePieza = t.paso === 1 && suyos.length > 2 ? [suyos[0]] : [];
    const ofrece = { creditos: t.creditos, piezas: ofrecePieza };
    // 🔴 APARTADO DE VERDAD: fuera de su ficha mientras el trato esté abierto
    const quitado = t.c.inventario.slice();
    ofrecePieza.forEach(id => { const i = quitado.indexOf(id); if (i >= 0) quitado.splice(i, 1); });
    await db.collection("student_profiles").doc(t.c.ficha)
      .update({ coins: Math.max(0, t.c.creditos - t.creditos), inventory: quitado });
    const mensajes = [{ de: "comprador", texto: t.mensaje, fecha: dia(2) }];
    if (t.respuesta) mensajes.push({ de: "vendedor", texto: t.respuesta, fecha: dia(1) });
    await db.collection("stargate_tratos").doc().set({
      projectId: ID, anuncio: t.a.ref.id, vende: quien(t.a.vende), compra: quien(t.c), pieza: t.a.pieza,
      ofrece: ofrece, pide: t.pide || null, paso: t.paso, turno: t.turno, estado: "abierto",
      mensajes: mensajes, creado: dia(2), actualizado: dia(1), caduca: Date.now() + 5 * 864e5
    });
    await t.a.ref.update({ ofertas: 1 });
  }
  console.log("  Zoco:", anuncios.length, "cosas puestas y", tratos.filter(t => t.a && t.c).length, "tratos abiertos");
}

/**
 * ════════ LOS TICKETS DE SALIDA DE LA NAVE ESCUELA (20-sep) ════════
 *
 * 🔴 POR QUÉ NO VAN A LA HOJA DE GOOGLE. El ticket de salida de verdad es anónimo a propósito: un formulario de
 * Google que deja las respuestas en una hoja (ver apps-script/LectorTickets.gs). Meter ahí cien respuestas
 * inventadas sería ensuciar con datos falsos la hoja donde el alumnado de verdad escribe en confianza, y no se
 * podrían separar de un vistazo. Así que las de la Nave Escuela viven CON su grupo, en
 * `projects/nave-escuela/privado/tickets`, y la web las lee de ahí (assets/js/tkcomun.js).
 *
 * Las preguntas son las del formulario de verdad —tienen que serlo: el panel las acorta buscando su texto— y las
 * respuestas están escritas para que el tema se note: unos temas gustan más que otros, y las dudas son dudas de
 * verdad de ese tema, que es lo que se lee en voz alta al abrir el siguiente.
 */
async function sembrarTickets(ini) {
  const P_TEMA = "Selecciona el tema o la actividad que acabas de terminar";
  const P_PROFE = "¿Quién es tu profesor o profesora?";
  const P_SIGUE = "¿Cómo has seguido esta clase?";
  const NOTAS = [
    ["Valora la utilidad de las herramientas que has visto", 0],
    ["Valora la satisfacción general del desarrollo de la clase", 1],
    ["Valora los contenidos teóricos", 2],
    ["Valora las estrategias prácticas", 1],
    ["Valora el grado de participación del grupo", 2]
  ];
  const P_DUDA = "¿Alguna duda que quieras que resolvamos al empezar el siguiente tema?";
  const P_MEJOR = "¿Qué ha sido lo mejor?";
  const P_PEOR = "¿Y lo peor?";

  // El humor de cada tema (media sobre 5) y lo que se pregunta en él: sin esto todos los temas saldrían iguales y
  // la caja de tickets no diría nada al cambiar de tema, que es justo lo que se quiere enseñar.
  const TEMAS = [
    { t: "Tema 1", media: 4.2, dudas: ["¿La Bitácora hay que entregarla entera o tema a tema?",
        "No me queda claro qué cuenta como evidencia.", "¿El reto A también puntúa para la nota final?"],
      mejor: ["Que se entiende para qué sirve cada cosa.", "El vídeo del principio, me enganchó.", "Que no fue una clase de escuchar y ya."],
      peor: ["Demasiada información de golpe el primer día.", "Nada, la verdad.", "Me perdí un poco con los nombres de los planetas."] },
    { t: "Tema 2", media: 3.9, dudas: ["¿Podemos usar Canva en vez de Genially?", "¿Cuántas imágenes mínimo en el producto?"],
      mejor: ["Los ejemplos de otros cursos.", "Ver cómo quedaba antes y después."],
      peor: ["Se hizo largo el repaso del principio.", "La parte teórica del final."] },
    { t: "Tema 3", media: 4.5, dudas: ["¿La licencia de las imágenes hay que citarla también en el vídeo?",
        "¿Sirve cualquier banco de imágenes o solo los que dijiste?"],
      mejor: ["La actividad práctica, con diferencia.", "Que trabajamos en grupo y no cada uno a su bola.", "El ritmo."],
      peor: ["Poco tiempo para terminar la práctica.", "Nada."] },
    { t: "Tema 4", media: 3.4, dudas: ["No entiendo la diferencia entre los dos tipos de evaluación.",
        "¿La rúbrica la ponemos nosotros o viene dada?", "¿Esto entra en el examen?"],
      mejor: ["Los ejemplos reales.", "Que se resolvieron las dudas en el momento."],
      peor: ["Ha sido el tema más denso hasta ahora.", "Demasiados conceptos parecidos.", "Me costó seguir la última parte."] },
    { t: "Tema 5", media: 4.1, dudas: ["¿Cuántas evidencias mínimo lleva el ePortfolio?", "¿El enlace tiene que ser público público?"],
      mejor: ["Por fin vi cómo encaja todo el curso.", "La parte de gamificación."],
      peor: ["La conexión me falló y me perdí un cacho.", "Nada."] },
    { t: "Tema 6", media: 4.4, dudas: ["¿Podemos elegir nosotros la herramienta del producto final?",
        "¿Cuándo se abre la entrega?"],
      mejor: ["Se nota que el tema te gusta.", "Las plantillas que compartiste.", "Que fue muy práctico."],
      peor: ["Nada destacable.", "Un poco corto, me quedé con ganas."] },
    { t: "Tema 7", media: 3.8, dudas: ["¿La accesibilidad hay que justificarla en la memoria?", "¿Qué pasa si entrego tarde?"],
      mejor: ["Los casos que pusiste al final.", "La checklist."],
      peor: ["Mucha norma seguida.", "Me lié con los criterios."] },
    { t: "Tema 8", media: 4.6, dudas: ["¿El examen es con el ordenador abierto?", "¿Hay que llevar algo preparado el último día?"],
      mejor: ["El cierre de la historia.", "Saber exactamente qué se pide en el examen.", "Todo el curso, en general."],
      peor: ["Que se acaba.", "Nada."] },
    { t: "Actividad 1", media: 4.0, dudas: ["¿La actividad se entrega por la plataforma o por el enlace?"],
      mejor: ["Trabajar sobre algo mío de verdad."], peor: ["El tiempo, justo."] },
    { t: "Actividad 2", media: 4.3, dudas: ["¿Se puede mejorar la nota entregando otra versión?"],
      mejor: ["La corrección comentada."], peor: ["Nada."] }
  ];

  /**
   * Una nota ALREDEDOR de la media del tema (±0,9), con la mano que cada persona tiene: ni todo cincos ni una
   * campana perfecta. 🔴 La primera versión restaba siempre un punto y todos los temas salían en 3,4: el panel
   * enseñaba dos barras iguales tema tras tema y no se veía que un tema gustara más que otro, que es lo único que
   * la caja de tickets tiene que dejar claro.
   */
  const nota = (media, sesgo, r) => Math.max(1, Math.min(5, Math.round(media + sesgo + ((r % 5) - 2) * 0.45)));
  const filas = [];
  let fila = 1;
  TEMAS.forEach((T, ti) => {
    const cuantas = 7 + ((ti * 5) % 9);        // entre 7 y 15 respuestas por tema
    for (let i = 0; i < cuantas; i++) {
      const r = { [P_TEMA]: T.t, [P_PROFE]: DOCENTES[i % 2].nombre,
                  [P_SIGUE]: i % 4 === 3 ? "En diferido (viendo la grabación)" : "EN DIRECTO" };
      NOTAS.forEach(([q, sesgo], j) => { r[q] = nota(T.media, [0, -0.2, 0.2][sesgo] || 0, i + j * 3); });
      if (i < T.dudas.length) r[P_DUDA] = T.dudas[i];
      if (i % 3 === 0 && T.mejor[i / 3 | 0]) r[P_MEJOR] = T.mejor[i / 3 | 0];
      if (i % 4 === 1 && T.peor[(i - 1) / 4 | 0]) r[P_PEOR] = T.peor[(i - 1) / 4 | 0];
      fila++;
      filas.push({ fecha: new Date(ini + (ti * 14 + 6) * 864e5 + i * 3600e3).toISOString(), fila: fila, resuelto: "", r: r });
    }
  });
  await db.collection("projects").doc(ID).collection("privado").doc("tickets").set({ filas: filas, sembrado: Date.now() });
  console.log("  tickets de salida:", filas.length, "respuestas repartidas por", TEMAS.length, "temas y actividades");
}

main().catch(e => { console.error("✗", e); process.exit(1); });
