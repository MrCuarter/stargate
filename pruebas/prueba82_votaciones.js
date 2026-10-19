'use strict';
/**
 * BATERÍA 82 · LAS VOTACIONES DEL AULA (16-sep-2026).
 *
 * Norberto: «las votaciones en vivo deberían vivir también en el mismo sitio que has puesto los cronómetros, es gestión
 * de aula. También cada docente puede publicar una votación para que respondan, la próxima semana se resuelve. Ejemplo:
 * ¿qué herramienta prefieres que aprendamos la próxima semana? GamificaPro tiene algo divertido, compra voto extra:
 * impleméntalo también».
 *
 * Lo que se vigila aquí: que la votación viva en el aula (con los cronómetros), que la ponga cada docente para su
 * escuadrón o para el grupo, que el alumnado vote desde su Nave, que el VOTO EXTRA lo cobre el servidor (nunca el
 * navegador) y que los resultados no se enseñen mientras está abierta. El laboratorio (sección 40) la juega entera.
 */
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const RAIZ = path.resolve(__dirname, ".."), GP = "/Users/nor/Claude/vibewebs/gamificapro";
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
const A = leer("assets/js/aula.js"), N = leer("assets/js/recluta.js"), M = leer("assets/js/motor.js"),
      S = leer("assets/js/sesion.js"), CSS = leer("assets/css/stargate.css");

// 1 · los números, en un solo sitio
const V = JSON.parse(execFileSync("python3", ["-c", "import json,_site_data as D;print(json.dumps(D.VOTACION))"], { cwd: RAIZ, encoding: "utf8" }));
c(V.min_opciones === 2 && V.max_opciones >= 3 && V.max_opciones <= 6, "una votación lleva de 2 a " + V.max_opciones + " opciones", JSON.stringify([V.min_opciones, V.max_opciones]));
c(V.voto_extra > 0 && V.max_extra > 0, "🔴 el voto extra cuesta " + V.voto_extra + " ◈ y hay tope (" + V.max_extra + ")", JSON.stringify([V.voto_extra, V.max_extra]));
c(Array.isArray(V.ejemplos) && V.ejemplos.length >= 2 && /herramienta/i.test(V.ejemplos[0]), "   y trae ejemplos de pregunta para el docente", (V.ejemplos || [])[0]);
["aula.html", "recluta.html", "sesion.html"].forEach(p => c(/window\.SG_VOTACION=/.test(leer(p)), "   la configuración llega a " + p));

// 2 · el aula: con los cronómetros
c(/\["voto", "voto", "Votación"\]/.test(A), "🔴 la votación es una pestaña del aula, al lado de «Tiempo» (con su icono propio, sin emoji)");
// 20-sep · las herramientas de clase van por lo que más se usa en directo: En clase, Premiar, Pregunta, Votación
// y el Tiempo al final («déjalo, pequeño»). Lo que importa es que la votación y la pregunta estén juntas.
c(A.indexOf('["pregunta"') < A.indexOf('["voto"') && A.indexOf('["voto"') < A.indexOf('["tiempo"'), "   al lado de «Pregunta» y antes del temporizador");
c(/function vistaVoto\(\)/.test(A) && /function cablearVoto\(\)/.test(A), "   con su vista y su cableado");
c(/crearVotacion\(PER, \{/.test(A) && /cerrarVotacion\(PER/.test(A), "   el docente la publica y la cierra desde ahí");
c(/eligibleFactionId|escuadron:/.test(A) && /miEscuadron\(\)/.test(A), "   puede ser solo para SU escuadrón o para todo el grupo");
c(/resuelve: \(\(D && D\.semana\) \|\| 0\) \+ 1/.test(A), "🔴 se resuelve en la semana siguiente (lo que pidió Norberto)");
c(/au-vt-barra/.test(A) && /au-vt-barra/.test(CSS), "   y el docente ve el recuento en vivo, con barras");

// 3 · la Nave: se vota desde ahí
c(/function votacionCaja\(\)/.test(N) && (N.match(/votacionCaja\(\)/g) || []).length >= 2, "la Nave enseña la votación abierta (definida y pintada)");
c(/data-voto/.test(N) && /M\.votar\(per, v\.id/.test(N), "   y se vota tocando la opción");
c(/tipo=dados>=Number\(v\.votesPerPerson\|\|1\)\?'paid':'free'/.test(N.replace(/\s/g, "")), "🔴 el primer voto es gratis; el siguiente, de pago (el voto extra)");
c(/INSUFFICIENT_COINS/.test(N) && /MAX_PAID_VOTES/.test(N) && /FACTION_NOT_ELIGIBLE/.test(N), "   y cada negativa del servidor se cuenta en cristiano");
c(/Los resultados se enseñan en clase/.test(N), "🔴 mientras está abierta NO se enseñan los resultados (si no, se vota a lo que gana)");
c(/voto-op/.test(CSS) && /voto-caja/.test(CSS), "   con su estilo");

// 4 · la sesión proyectada
c(/function diaVotacion\(s\)/.test(S) && (S.match(/diaVotacion\(s\)/g) || []).length >= 2, "la sesión proyecta la votación (definida y en el mazo de diapositivas)");
c(/precargarVotaciones/.test(S), "   pidiéndolas antes de pintar, como las reflexiones");
c(/vt-lista/.test(S) && /vt-lista/.test(CSS), "   con el resultado en barras y la ganadora destacada");

// 5 · el motor de la web y el del servidor
c(/const votar = \(perId, id, opcionId, tipo\)/.test(M) && (/llamar\("castVote"/.test(M) ||
  // (7-oct · por el SDK de GamificaPro: GP_SDK.votacion, paso 7)
  /=> VOTACION\.votar\(perId, id, opcionId, tipo\)/.test(M) && /ctx\.llamar\("castVote", \{ projectId: grupo, eventId: id, optionId: opcion, voteType: tipo \|\| "free" \}\)/.test(require("./sdk_pieza.js").pieza("votacion"))), "🔴 el voto lo cuenta el SERVIDOR (castVote), no el navegador");
c(/votaciones, crearVotacion, cerrarVotacion, borrarVotacion, votar, miPapeleta,/.test(M), "   y el motor de la web los exporta");
c(!/coins\s*[-+]=|updateDoc\([^)]*coins/.test(M.split("crearVotacion")[1] || ""), "🔴 el navegador no toca los créditos del voto extra");
const voting = fs.existsSync(path.join(GP, "functions/voting.js")) ? fs.readFileSync(path.join(GP, "functions/voting.js"), "utf8") : "";
c(/export const castVote/.test(voting) && /motivoParaNoVotar/.test(voting), "el servidor trae castVote con sus motivos de rechazo");
c(/INSUFFICIENT_COINS/.test(voting) && /MAX_PAID_VOTES_REACHED/.test(voting) && /costPerVote/.test(voting),
  "   cobra el voto extra con el precio de la votación y respeta el tope");
const reglas = fs.readFileSync(path.join(GP, "firestore.rules"), "utf8");
c(/match \/projects\/\{projectId\}\/voting_events\/\{eventId\}/.test(reglas) && /allow create: if isSignedIn\(\) && isProjectOwner\(projectId\)/.test(reglas),
  "🔴 y las reglas dejan crear la votación SOLO al profesorado del grupo");

// 5b · 19-oct · el alumnado, sin los recuentos de cada voto (GamificaPro: S1 de docs/AHORRO_MODS.md, functions/modVotacionSenal.js)
c(/st\.paraVotos=\(M\.vigilarVotacionesAlumno\|\|M\.vigilarVotaciones\)\(per,/.test(N), "🔴 la Nave escucha las votaciones sin los recuentos de cada voto (vigilarVotacionesAlumno)");
c(/SEG\.pararVotos=\(M\.vigilarVotacionesAlumno\|\|M\.vigilarVotaciones\)\(st\.per,/.test(S), "   y la sesión que sigue el recluta, también");
c(/VOT\.parar = MOTOR\.vigilarVotaciones\(PER,/.test(A), "   el aula del docente sigue con el recuento en vivo (vigilarVotaciones)");
c(/vigilarVotaciones, vigilarVotacionesAlumno, vigilarEnVivo,/.test(M), "   y el motor de la web la exporta");
{
  // la copia de motor.js (la de sdk/votacion.js, `vigilarLigero`, mientras el SDK fijado no la traiga), funcionando con un Firestore de mentira
  const src = M.slice(M.indexOf("function vigilarVotacionesAlumno("), M.indexOf("\n}\n", M.indexOf("function vigilarVotacionesAlumno(")) + 2);
  const senal = { existe: false, datos: {} }, oyentes = [], llamadas = { consultas: 0, enteras: 0, paradas: 0 };
  const activas = [{ id: "a", isActive: true, creado: 1, title: "A" }, { id: "b", isActive: true, creado: 2, title: "B" }];
  const fk = {
    db: {}, doc: (db, c, id) => ({ c, id }), collection: () => ({}), where: () => ({}), query: () => ({}),
    getDocs: () => { llamadas.consultas++; return Promise.resolve({ docs: activas.map(x => ({ id: x.id, data: () => x })) }); },
    onSnapshot: (ref, f) => { const o = () => f({ exists: () => senal.existe, data: () => senal.datos }); oyentes.push(o); o(); return () => oyentes.splice(oyentes.indexOf(o), 1); },
    VOTACION: {}, vigilarVotaciones: (per, f) => { llamadas.enteras++; f(activas.slice().reverse()); return () => { llamadas.paradas++; }; },
  };
  const VA = new Function(...Object.keys(fk), src + "\nreturn vigilarVotacionesAlumno;")(...Object.values(fk));
  const vistos = [], aviso = () => oyentes.slice().forEach(o => o());
  const parar = VA("g", l => vistos.push(l.map(x => x.id).join(",")));
  c(llamadas.enteras === 1 && llamadas.consultas === 0 && vistos[0] === "b,a", "   sin señal del servidor, lo de siempre (escucha las votaciones enteras)", JSON.stringify([llamadas, vistos]));
  senal.existe = true; senal.datos = { cambiado: 1 }; aviso();
  Promise.resolve().then(() => Promise.resolve()).then(() => {
    c(llamadas.paradas === 1 && llamadas.consultas === 1 && vistos.at(-1) === "b,a", "🔴 con señal, deja de escucharlas enteras y pide las activas una vez, en el mismo orden", JSON.stringify([llamadas, vistos]));
    senal.datos = { cambiado: 1, ligero: false }; aviso();
    c(llamadas.enteras === 2, "   apagada (ligero: false), vuelve a escucharlas enteras al momento", JSON.stringify(llamadas));
    parar();
    c(llamadas.paradas === 2 && oyentes.length === 0, "   y al dejar de vigilar no queda nada escuchando", JSON.stringify([llamadas, oyentes.length]));
    fin();
  });
}

// 6 · lo otro que trajimos del motor: la hoja de cálculo para evaluar
const K = leer("assets/js/consola.js");
c(/function descargarCSV\(t, lista, filtro\)/.test(K) && /id="c-csv"/.test(K), "la consola exporta el grupo a CSV desde «Mi gente»");
c(/"\\uFEFF"/.test(K) && /join\(";"\)/.test(K), "🔴 con BOM y punto y coma: Excel en español lo abre a la primera");
c(/Sala de Joran \(máquinas\)/.test(K) && /Logros de a bordo/.test(K) && /Enlaces entregados/.test(K),
  "   y lleva lo que hace falta para evaluar: retos, insignias, logros, la sala de Joran y los enlaces entregados");
c(/lista\.map\(function \(x\)/.test(K) && /filtro \? "_" \+ filtro/.test(K), "   respeta el escuadrón filtrado y lo dice en el nombre del fichero");

function fin() {
  console.log("\n  Batería 82 · las votaciones del aula y el CSV");
  console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
  fallos.forEach(f => console.log("   ✗ " + f));
  process.exit(fallos.length ? 1 : 0);
}
