'use strict';
/**
 * BATERÍA 117 · LA CONSOLA DE ENSAYO (29-sep): la consola de verdad contra un Firebase de mentira
 *
 * Norberto, para la Academia de la Cero: «conocer el panel del docente (habrá que construir un "simulador" con vista docente)»;
 * luego, «haz todo lo pendiente». ensayo.html es consola.html con motor_sim.js (motor.js con sus imports de Firebase cambiados
 * por assets/js/sim/firebase_sim.js) y la Nave Escuela sembrada en papel (herramientas/simulador_datos.cjs). Aquí se comprueba
 * que la consola de verdad no se ha tocado, que el ensayo no se queda atrás de ella, que no lleva ni un correo de verdad y que
 * su Firebase de mentira hace lo que la consola le pide: se EJECUTA en node con sus datos.
 * La prueba de clics (bienvenida, validar, anular, premiar, regalar un sobre, la rueda, el panel, el buzón, recargar, empezar de
 * cero y el móvil a 375 px) se hizo en el navegador el 29-sep.
 */
const fs = require("fs"), path = require("path"), os = require("os"), { pathToFileURL } = require("url");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };

const ENS = L("ensayo.html"), CON = L("consola.html"), MOT = L("assets/js/motor.js"), SIM = L("assets/js/motor_sim.js");
const FSIM = L("assets/js/sim/firebase_sim.js"), CJS = L("assets/js/consola.js"), BUILD = L("_build_site.py");
const DATOS = JSON.parse(L("assets/sim/escuela.json")), TXT = JSON.stringify(DATOS.docs);

// ── 1 · La consola de verdad, intacta; el ensayo, aparte
c(/<script type="module" src="assets\/js\/motor\.js\?v=[0-9a-f]{10}"><\/script>/.test(CON) && !/motor_sim|SG_ENSAYO/.test(CON),
  "🔴 consola.html sigue con su motor de verdad y no sabe nada del ensayo");
c(/<script>window\.SG_ENSAYO=1;<\/script><script type="module" src="assets\/js\/motor_sim\.js\?v=[0-9a-f]{10}"><\/script>/.test(ENS) && !/src="assets\/js\/motor\.js/.test(ENS),
  "🔴 ensayo.html carga motor_sim.js (y no el motor de verdad)");
c(/<title>STARGATE · Consola de ensayo<\/title>/.test(ENS) && /<h1>Consola de ensayo<\/h1>/.test(ENS) && /name="robots" content="noindex"/.test(ENS),
  "   se llama «Consola de ensayo» y no la indexan los buscadores");
c(ENS.replace(/<script>window\.SG_ENSAYO=1;<\/script>.*?<\/script>/, "").replace(/Consola de ensayo/g, "Mi nave").replace(/<meta name="robots" content="noindex">\n/, "")
   .replace(/<title>STARGATE · Mi nave<\/title>/, "") === CON.replace(/<script type="module" src="assets\/js\/motor\.js[^"]*"><\/script>/, "").replace(/<title>STARGATE · Mi nave<\/title>/, ""),
  "🔴 por lo demás, ensayo.html ES consola.html (no se puede quedar atrás)");

// ── 2 · motor_sim.js = motor.js, con otros imports
const cuerpo = SIM.slice(SIM.indexOf("/**\n * STARGATE · LA CENTRALITA"));
const imps = cuerpo.match(/from "\.\/sim\/firebase_sim\.js\?h=([0-9a-f]{10})"/g) || [];
c(imps.length === 4 && new Set(imps).size === 1 && !/gstatic\.com/.test(SIM), "🔴 motor_sim.js: los cuatro imports de Firebase van al de mentira (y ni uno a Google)", imps.length);
// (30-sep · salvo la carga de Storage para las capturas de la Academia, que en el ensayo es un error claro: no se sube nada)
c(cuerpo.replace(/from "\.\/sim\/firebase_sim\.js\?h=[0-9a-f]{10}"/g, "F").replace('Promise.reject(new Error("En la consola de ensayo no se suben archivos."))', "S")
    === MOT.replace(/from "https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-(?:app|auth|firestore|functions)\.js"/g, "F").replace(/import\("https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-storage\.js"\)/, "S"),
  "🔴 y todo lo demás, motor.js letra por letra (el ensayo es la consola de verdad)");
c(/^\/\* GENERADO por _build_site\.py/.test(SIM) && /const localStorage = \(\(\) => \{ const L = window\.localStorage, NO = \/\^sgEs\(Docente\|Referente\|Recluta\)\$\//.test(SIM),
  "🔴 con su propio localStorage: el docente de ensayo no toca las marcas «soy docente / referente» de la cuenta de verdad");
c(!/window\.localStorage/.test(MOT), "   (y motor.js no se lo salta con window.localStorage)");
const importados = [...MOT.matchAll(/import \{([^}]+)\}\s*from "https:\/\/www\.gstatic/g)].flatMap(m => m[1].split(",").map(s => s.trim()).filter(Boolean));
const exportados = [...FSIM.matchAll(/export (?:async )?(?:function|class|const) (\w+)/g)].map(m => m[1]);
const faltan = importados.filter(n => exportados.indexOf(n) < 0);
c(importados.length > 20 && !faltan.length, "🔴 el Firebase de mentira exporta TODO lo que importa motor.js", faltan.join(", "));

// ── 3 · Los datos: la Nave Escuela, sin un correo de verdad
const correos = [...new Set(TXT.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) || [])];
c(correos.length > 30 && correos.every(x => /@ensayo\.invalid$/.test(x)), "🔴 todos los correos del ensayo son @ensayo.invalid", correos.filter(x => !/@ensayo\.invalid$/.test(x)).slice(0, 3).join(", "));
c(!/cuartero|norberto|feridouni|sierradaz|mutecdgami|genially\.com|lab\.test|prueba\.es/i.test(TXT), "🔴 ni un nombre ni un dominio de verdad");
const P = DATOS.docs["projects/" + DATOS.grupo] || {}, V = DATOS.docs["projects/" + DATOS.grupo + "/privado/stargate"] || {};
c(DATOS.grupo === "nave-escuela" && (P.stargate || {}).escuela === true && (P.stargate || {}).version, "   el grupo es la Nave Escuela (con su selector de semanas)");
c(DATOS.yo.correo === "docente@ensayo.invalid" && (P.coTeacherEmails || []).indexOf(DATOS.yo.correo) >= 0 &&
  (V.docentes || []).some(d => d.correo === DATOS.yo.correo && d.rol === "referente" && d.imparte === true),
  "🔴 el docente de ensayo es referente que imparte en ese grupo (ve la consola entera)");
const fichas = Object.keys(DATOS.docs).filter(k => /^student_profiles\/[^/]+$/.test(k));
c(fichas.length === 30 && Object.keys(DATOS.docs).some(k => /^stargate_tratos\//.test(k)) && DATOS.docs["projects/nave-escuela/privado/tickets"],
  "   30 reclutas, el Zoco con tratos vivos y los tickets de salida", fichas.length);
c(Number(DATOS.generado) > 1.7e12 && /^\d{4}-\d{2}-\d{2}-\d+$/.test(DATOS.v), "   la semilla dice cuándo se sembró (para correr las fechas)");

// ── 4 · La consola sabe que está ensayando
c(/var ENSAYO = window\.SG_ENSAYO === 1, ENSAYA = ENSAYO \|\| url\.get\("demo"\) === "1";/.test(CJS) && /var PAGINA = ENSAYO \? "ensayo\.html" : "consola\.html";/.test(CJS),
  "   consola.js: ENSAYO y la página en la que está");
c(!/["']consola\.html/.test(CJS.replace(/PAGINA = ENSAYO \? "ensayo\.html" : "consola\.html"/, "")), "🔴 ni un enlace ni un replaceState a consola.html a pelo: el ensayo no se escapa a la consola de verdad");
c((CJS.match(/if \(ENSAYA && window\.SG\.rastroAcademia\)/g) || []).length === 2, "   el rastro para la Academia (pestañas y ficha), también en el ensayo");
c(/if \(ENSAYO && v && window\.SG\.rastroAcademia\) window\.SG\.rastroAcademia\(\{ panel: true \}\);/.test(CJS), "   el panel: se guarda de verdad (en el ensayo) y apunta el hito");
c(/window\.SG_ENSAYO === 1 && off\.length && window\.SG\.rastroAcademia\) window\.SG\.rastroAcademia\(\{ rueda: true \}\)/.test(BUILD), "   la rueda: igual");
c(/var a = ACADEMIA_DOC; if \(!a \|\| ENSAYO \|\| ORGANIZO_ACADEMIA\(\)\) return "";/.test(CJS), "   en el ensayo no sale la puerta de la Academia (ni a quien la organiza)");
c(/function franjaEnsayo\(\)/.test(CJS) && /data-ens="cero">Empezar de cero/.test(CJS) && /href="academia\.html">Volver a la Academia/.test(CJS) && /localStorage\.removeItem\("sgEnsayo\.db"\)/.test(CJS),
  "🔴 la franja, siempre a la vista: «Empezar de cero» y «Volver a la Academia»");
c(/return p==='ensayo\.html'\?'consola\.html':\(p\|\|'index\.html'\);/.test(L("assets/js/tour.js")), "   la visita guiada no se va a la consola de verdad para enseñarla");
c(/"sim:consola"\) return "ensayo\.html"/.test(L("assets/js/academia.js")) && /"boton": "sim:consola"/.test(L("_site_data.py")),
  "🔴 la Academia manda a la consola de ensayo nueva");

// ── 5 · El Firebase de mentira, EJECUTADO con sus datos
(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sg-ensayo-"));
  const cargar = async (semilla, n) => {
    const f = path.join(tmp, "fs" + n + ".mjs"); fs.writeFileSync(f, FSIM);
    const guardado = {};
    global.localStorage = { getItem: k => (k in guardado ? guardado[k] : null), setItem: (k, v) => { guardado[k] = String(v); }, removeItem: k => { delete guardado[k]; } };
    global.window = { addEventListener() {}, localStorage: global.localStorage };
    global.fetch = async (u) => { if (!/escuela\.json/.test(String(u))) throw new Error("red: " + u); return { ok: true, json: async () => JSON.parse(JSON.stringify(semilla)) }; };
    return { F: await import(pathToFileURL(f).href + "?h=" + n), guardado };
  };
  const { F, guardado } = await cargar(Object.assign({}, DATOS, { generado: Date.now() }), 1);
  const db = F.getFirestore(), per = "nave-escuela";
  const mios = await F.getDocs(F.query(F.collection(db, "projects"), F.where("coTeacherEmails", "array-contains", "docente@ensayo.invalid")));
  c(mios.size === 1 && mios.docs[0].id === per, "🔴 «mis grupos» del docente de ensayo: la Nave Escuela", mios.size);
  const fic = await F.getDocs(F.query(F.collection(db, "student_profiles"), F.where("projectId", "==", per)));
  const f0 = fic.docs.find(d => (d.data().completedMissionIds || []).length && !(d.data().completedMissionIds || []).includes(per + "__X1")) || fic.docs[fic.docs.length - 1];
  const antes = f0.data(), llamar = (n, d) => F.httpsCallable(F.getFunctions(), n)(d).then(r => r.data);
  await llamar("applyXpDelta", { projectId: per, studentProfileId: f0.id, deltaXp: 50, deltaCoins: 7 });
  let d1 = (await F.getDoc(F.doc(db, "student_profiles", f0.id))).data();
  c(d1.totalPoints === antes.totalPoints + 50 && d1.coins === antes.coins + 7, "   premiar (applyXpDelta) suma xp y créditos", [antes.totalPoints, d1.totalPoints].join("→"));
  const reto = (antes.completedMissionIds || [])[0].split("__").pop();
  const an = await llamar("stargateAnularReto", { projectId: per, studentProfileId: f0.id, retoId: reto, motivo: "prueba" });
  d1 = (await F.getDoc(F.doc(db, "student_profiles", f0.id))).data();
  c(an.ok && !d1.completedMissionIds.includes(per + "__" + reto) && d1.totalPoints === antes.totalPoints + 50 - an.xp, "🔴 anular un reto lo quita y descuenta lo que dio", reto);
  const rg = await llamar("stargateRegalar", { projectId: per, fichas: [f0.id], regalo: { tipo: "sobre" } });
  d1 = (await F.getDoc(F.doc(db, "student_profiles", f0.id))).data();
  c(rg.resultados[0].piezas.length === 3 && rg.resultados[0].piezas.every(p => /__cromo_/.test(p)) && d1.inventory.length === (antes.inventory || []).length + 3,
    "   regalar un sobre en clase: tres cartas del cofre del grupo, a su inventario");
  await llamar("stargateAlumno", { projectId: per, fichaId: f0.id, accion: "congelar" });
  c(!!(await F.getDoc(F.doc(db, "student_profiles", f0.id))).data().stargateCongelado, "   congelar a un recluta");
  let buzon = ""; try { await F.addDoc(F.collection(db, "stargate_buzon"), { texto: "hola" }); } catch (e) { buzon = e.message; }
  c(/no llega a nadie/.test(buzon), "🔴 el buzón NO finge que envía: dice que en el ensayo no llega a nadie", buzon);
  let sorteo = ""; try { await llamar("stargateSortear", {}); } catch (e) { sorteo = e.message; }
  c(/En la consola de ensayo no se puede hacer el Gran Sorteo/.test(sorteo), "   lo que hace el servidor, dicho con palabras", sorteo);
  const g = JSON.parse(guardado["sgEnsayo.db"] || "{}");
  c(g.v && g.c && g.c["student_profiles/" + f0.id], "   lo tocado se guarda en este navegador (sgEnsayo.db), con su versión");
  // 30-sep · lo que hace el docente, apuntado para las misiones de la Academia (sgEnsayo.hechos)
  const H = () => JSON.parse(guardado["sgEnsayo.hechos"] || "{}");
  c(H().anular && !H().validar, "🔴 anular un reto se apunta («anular»), con su asiento en stargate_anulaciones (como el servidor)");
  await F.updateDoc(F.doc(db, "student_profiles", f0.id), { stargateOtorgados: [per + "__X1"] });
  await F.addDoc(F.collection(db, "notifications"), { userId: antes.userId, projectId: per, title: "Hola", stargate: { accion: "" } });
  const vales = await F.getDocs(F.query(F.collection(db, "purchased_vouchers"), F.where("projectId", "==", per)));
  c(vales.size === 2 && vales.docs.every(d => d.data().status === "pending" && /Subir/.test(d.data().rewardTitle)), "🔴 la Cola de nota sembrada: dos subidas de nota esperando", vales.size);
  await F.updateDoc(vales.docs[0].ref, { status: "approved", resolvedAt: Date.now() });
  await F.setDoc(F.doc(db, "projects", per, "privado", "stargate"), { premiosEnlace: { x1: { id: "x1", nombre: "Prueba" } } }, { merge: true });
  c(H().validar && H().mensaje && H().cola && H().premio, "🔴 validar, un mensaje, la Cola de nota y un premio por enlace, apuntados", Object.keys(H()).join(","));
  const t0 = H().validar; await F.updateDoc(F.doc(db, "student_profiles", f0.id), { coins: 3 });
  c(H().validar === t0, "   cada cosa se apunta una vez (la primera)");
  let viva = 0; const fuera = F.onSnapshot(F.doc(db, "student_profiles", f0.id), () => viva++);
  await new Promise(r => setTimeout(r, 5)); await F.updateDoc(F.doc(db, "student_profiles", f0.id), { coins: 1 }); await new Promise(r => setTimeout(r, 5)); fuera();
  c(viva === 2, "   en vivo: onSnapshot avisa al empezar y con cada cambio", viva);

  // las fechas viajan con el calendario: sembrado hace tres semanas, se corre tres semanas
  const hace = Date.now() - 3 * 7 * 864e5 - 3600e3;
  const { F: G } = await cargar(Object.assign({}, DATOS, { generado: hace }), 2);
  const p2 = (await G.getDoc(G.doc(G.getFirestore(), "projects", per))).data(), p1 = (await F.getDoc(F.doc(db, "projects", per))).data();
  const dias = (Date.parse(p2.stargate.inicio) - Date.parse(p1.stargate.inicio)) / 864e5;
  const s1 = Object.values(antes.missionTimestamps || {})[0][0], f2 = (await G.getDoc(G.doc(G.getFirestore(), "student_profiles", f0.id))).data();
  const s2 = f2.missionTimestamps[Object.keys(antes.missionTimestamps)[0]][0];
  c(dias === 21 && (Date.parse(s2) - Date.parse(s1)) === 21 * 864e5, "🔴 sembrado hace tres semanas: el curso y sus registros se corren 21 días (siempre en su semana 15)", dias);
  c(f2.createdAt - antes.createdAt === 21 * 864e5, "   también las fechas en milisegundos");
  fs.rmSync(tmp, { recursive: true, force: true });

  // 30-sep · la Nave Escuela de verdad se retira: el ensayo trae sus entregas (la de Cometa y el Drive sin permisos)
  const entregas = Object.keys(DATOS.docs).filter(k => /^mission_deliveries\//.test(k)).map(k => DATOS.docs[k]);
  c(entregas.length > 100 && entregas.some(e => /ejemplo\.html\?reto=/.test(e.enlace)) && entregas.some(e => /drive\.google\.com\/file\/d\/1sinPermisos/.test(e.enlace)),
    "🔴 el ensayo trae las entregas: el ejemplo de cada reto y un Drive sin permisos para anular con un porqué", entregas.length);
  c(DATOS.docs["projects/nave-escuela"].name === "STARGATE · GRUPO DE ENSAYO" && /per=nave-escuela\(&\|\$\)/.test(CJS) && /window\.SG_PER_DEMO \|\| "demo-stargate"/.test(CJS),
    "   se llama «grupo de ensayo», y lo que sale de la consola (la clase, el aula, la Nave) va al grupo DEMO");

  console.log("\n  Batería 117 · la consola de ensayo");
  console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
  process.exit(fallos.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
