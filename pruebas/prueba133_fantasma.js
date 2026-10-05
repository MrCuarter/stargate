'use strict';
/**
 * BATERÍA 133 · EL MODO FANTASMA (5-oct-2026)
 *
 * Norberto: «muchos docentes quieren una cuenta de alumno para ponerse en la piel de sus estudiantes y hacer los retos
 * antes que ellos, por si hay errores… un estudiante como cualquier otro, pero oculto para los demás, para que el juego
 * no se vea afectado. No está en los rankings; las compras no reducen el stock, pero sí gastan su dinero».
 * Sus decisiones: el fantasma SÍ gana insignias (sin nada público); la ficha de Anita pasa a fantasma; y «una vez
 * fantasma, siempre fantasma».
 *
 * El motor (GamificaPro) decide lo que cuenta; aquí, la web: el traductor saca a los fantasmas de `reclutas` antes de
 * los puestos, la corona y los contadores (y los deja en `fantasmas`), la Nave se encuentra a sí misma, el alistamiento
 * del equipo docente nace fantasma, el cambio de papel y lo que se salta el traductor (la llamada, el directo, el Zoco,
 * los recuentos y las bienvenidas).
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };

const { catalogo } = require(path.join(R, "motor", "catalogo.js"));
const { paquete } = require(path.join(R, "motor", "paquete.js"));
const T = require(path.join(R, "motor", "tablero.js"));

console.log("\n▶ 133 · El modo fantasma");

// ------------------------------------------------------------------ 1 · el traductor
console.log("  1 · el traductor: fuera de la clase, dentro para sí");
const cat = catalogo();
const PER = "g-fantasma";
const p = paquete({ id: PER, nombre: "Grupo", tipo: "REGULAR", inicio: "2026-10-05", referente: "anita@x.es",
                    docentes: [{ nombre: "Anita", correo: "anita@x.es", rol: "referente" }] }, cat);
const hoy = new Date().toISOString();
const ficha = (id, alias, retos, extra) => Object.assign({ id, userId: "u-" + id, projectId: PER, displayName: alias,
  totalPoints: 0, coins: 50, inventory: [], earnedBadges: [], completedCampaignIds: [], stargateProfe: "Anita",
  completedMissionIds: retos, missionTimestamps: Object.fromEntries(retos.map(r => [r, [hoy]])) }, extra || {});
const perfiles = [
  // la fantasma va la primera en xp a propósito: si contara, se llevaría el puesto 1 y la corona
  ficha("f-anitina", "Anitina", ["H1", "A0", "L1", "B1"], { fantasma: true, totalPoints: 500 }),
  ficha("f-lola", "Lola", ["H1", "A0", "L1"], { totalPoints: 300 }),
  ficha("f-pau", "Pau", ["H1"], { totalPoints: 100 }),
  ficha("f-nuevo", "Nuevo", []),
];
const datos = { proyecto: Object.assign({ id: PER }, p.proyecto), misiones: p.misiones, campanas: p.campanas,
  recompensas: p.recompensas, perfiles, privados: { "f-anitina": { firstName: "Ana", email: "anita@x.es" } },
  vales: [{ id: "v1", studentId: "u-f-anitina", status: "pending", cost: 100, rewardTitle: "Subir 0,5" }], catalogo: cat };
const pub = T.tablero(datos, false), priv = T.tablero(datos, true);
const alias = (l) => (l || []).map(x => x.alias);
c(alias(pub.reclutas).indexOf("Anitina") < 0, "la fantasma no está en `reclutas` (rankings, sesión, tripulación, escuadrones)", alias(pub.reclutas));
c(pub.reclutas.length === 3, "los tres reclutas, sí", pub.reclutas.length);
c(alias(pub.fantasmas).join() === "Anitina", "va aparte, en `fantasmas`", alias(pub.fantasmas));
c(pub.reclutas[0].alias === "Lola" && pub.reclutas[0].pos === 1, "el puesto 1 es de Lola (la fantasma no se lo quita)", pub.reclutas.map(x => x.alias + x.pos));
c(pub.reclutas.map(x => x.pos).join() === "1,2,3", "los puestos de la clase van seguidos, sin hueco", pub.reclutas.map(x => x.pos));
c(pub.fantasmas[0].pos === 1, "la fantasma ve el puesto que tendría («irías el 1.º»)", pub.fantasmas[0].pos);
c(pub.fantasmas[0].corona === false, "y nunca lleva la corona semanal", pub.fantasmas[0].corona);
c(pub.reclutas.filter(x => x.corona).map(x => x.alias).join() === "Lola", "la corona es de quien más ganó de la clase", pub.reclutas.filter(x => x.corona).map(x => x.alias));
c(pub.activos === 2, "«somos N y esto lo llevan M»: la fantasma no cuenta en `activos`", pub.activos);
c((pub.retos_n || {}).B1 === undefined, "ni en cuántos llevan cada reto (B1 solo lo hizo ella)", JSON.stringify(pub.retos_n));
c(pub.fantasmas[0].fantasma === true && pub.reclutas.every(x => x.fantasma === false), "cada fila dice si es fantasma");
c(pub.fantasmas[0].n > 0 && pub.fantasmas[0].xp > 0, "la fantasma gana xp e insignias como cualquiera (para ella)", pub.fantasmas[0].n);
c(priv.fantasmas[0].email === "anita@x.es", "el equipo docente la ve con su nombre y su correo, como a todos");
c(priv.pendientes.length === 1 && priv.pendientes[0].fantasma === true && priv.pendientes[0].alias === "Anitina",
  "la Cola de nota la encuentra y la marca como fantasma", JSON.stringify(priv.pendientes));
const sinMarca = T.tablero(Object.assign({}, datos, { perfiles: perfiles.map(f => Object.assign({}, f, { fantasma: undefined })) }), false);
c(sinMarca.reclutas.length === 4 && (sinMarca.fantasmas || []).length === 0, "sin la marca (el servidor de antes), todo como siempre");

// ------------------------------------------------------------------ 2 · la web
console.log("  2 · las pantallas");
const MOTOR = L("assets/js/motor.js"), FUENTE = L("assets/js/fuente.js"), ALI = L("assets/js/alistarse.js"),
      REC = L("assets/js/recluta.js"), CON = L("assets/js/consola.js"), SES = L("assets/js/sesion.js"),
      AULA = L("assets/js/aula.js"), ENT = L("assets/js/entrar.js"), CSS = L("assets/css/stargate.css"),
      SIM = L("assets/js/motor_sim.js");
c(/function esDelEquipoDe\(proy, yo\)/.test(MOTOR) && /coTeacherEmails/.test(MOTOR.split("function esDelEquipoDe")[1].slice(0, 400)),
  "motor: quién es del equipo docente (dueño o coTeacherEmails)");
c(/\.\.\.\(esDelEquipoDe\(proy, yo\) \? \{ fantasma: true \} : \{\}\)/.test(MOTOR), "motor: el alta del equipo docente nace fantasma");
c(/llamar\("stargateFantasma", \{ projectId: perId \}\)/.test(MOTOR), "motor: pasar a fantasma lo hace el servidor (stargateFantasma)");
c(/esDelEquipoDe, pasarAFantasma/.test(MOTOR), "motor: los dos, en SG.MOTOR");
c(/esDelEquipoDe, pasarAFantasma/.test(SIM), "y en la consola de ensayo (motor_sim.js, generado)");
c(/where\("fantasma", "==", true\)/.test(MOTOR) && (MOTOR.match(/await fantasmasEn\(x\.id\)/g) || []).length === 2,
  "motor: «reclutas a tu cargo» y el Mando restan los fantasmas");
c(/fantasma: p\.fantasma === true \}/.test(MOTOR) && /if \(yo\.fantasma\) return;/.test(MOTOR),
  "el directo: el fantasma juega en su móvil, pero no escribe en la sala (la clase no lo ve)");
c(/t\.reclutas\.concat\(t\.fantasmas \|\| \[\]\)/.test(FUENTE) && /yo_\.fantasma = f\.fantasma === true/.test(FUENTE),
  "fuente: la Nave del fantasma se encuentra (y sabe que lo es, de su propia ficha)");
c(/Entras en modo fantasma/.test(ALI) && /Entrar como fantasma/.test(ALI) && /Tu progreso cuenta solo para ti/.test(ALI) && /Nadie de la clase te ve/.test(ALI),
  "alistarse: se le explica antes y el botón dice «Entrar como fantasma»");
c(/no se quita/.test(ALI), "alistarse: y que no se quita");
c(/Modo fantasma<\/span>/.test(REC) && /irías el '\+r\.pos/.test(REC), "Nave: el distintivo «Modo fantasma» y el puesto que tendría");
c(/Verme como docente/.test(REC) && /esDelEquipoDe\(x\[1\]\.data\(\),x\[0\]\)/.test(REC), "Nave: «Verme como docente» (del equipo, por el propio grupo)");
c(/Pasar a modo fantasma/.test(REC) && /No se puede deshacer/.test(REC), "Nave: una ficha antigua del equipo se puede pasar a fantasma, avisando de que no se deshace");
c(/r\.fantasma \? ''/.test(REC) && /En modo fantasma ves el Zoco/.test(REC), "Nave: el Zoco se mira, pero no se pone ni se oferta");
c(/fichasFantasma\(\)/.test(REC) && /deLaClase\(m\)/.test(REC), "Nave: lo que escribe un fantasma en la tripulación no lo ve la clase");
c(/Verme como recluta/.test(CON) && /Entrar como fantasma/.test(CON), "consola: «Verme como recluta» (o «Entrar como fantasma» si aún no tiene ficha)");
c(/En modo fantasma<\/h4>/.test(CON) && /chip fantasma/.test(CON), "consola: «Mi gente» enseña a los fantasmas aparte y marcados");
c(/k\.charAt\(0\) === "f" \? \(t\.fantasmas \|\| \[\]\)/.test(CON), "consola: su fila abre su ficha");
c(/fant\[v\.studentId\]/.test(CON), "consola: la Cola de nota marca la petición de un fantasma");
c(/f=f\.filter\(function\(x\)\{ return !fant\[x\.studentProfileId\]; \}\);/.test(SES), "sesión: el fichaje de un fantasma no se proyecta ni se cuenta (ni hace recargar)");
c(/f = f\.filter\(function \(x\) \{ return !fant\[x\.userId\]; \}\);/.test(AULA), "aula: ni cuenta como presente");
c(/" · en modo fantasma"/.test(ENT), "la puerta: la tarjeta de la ficha lo dice");
c(/\.chip\.fantasma\{/.test(CSS) && /\.a-fantasma/.test(CSS), "los estilos, en la hoja común");
const TXT = [ALI, REC, CON].join("\n").split("\n").filter(l => /fantasma/i.test(l)).join("\n");
c(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(TXT), "sin emojis en lo que dice el modo fantasma");

// ------------------------------------------------------------------ 3 · el buzón
console.log("  3 · las bienvenidas");
const BUZ = path.join(R, "..", "mando", "buzon.cjs");
if (fs.existsSync(BUZ)) {
  const B = fs.readFileSync(BUZ, "utf8");
  c(/x\.fantasma === true \|\| Number\(x\.createdAt/.test(B), "el buzón no le manda la bienvenida de recluta a un fantasma");
} else console.log("   · (sin la carpeta del Mando: se salta)");

console.log("\n  Batería 133 · El modo fantasma");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
