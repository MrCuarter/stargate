/**
 * STARGATE · LA CONSOLA DE ENSAYO · un Firebase de mentira, en memoria (29-sep-2026; desde GamificaPro sdk/sim, 7-oct)
 *
 * Norberto, para la Academia de la Cero: «conocer el panel del docente (habrá que construir un "simulador" con vista docente),
 * ver las posibilidades». La consola de ensayo (ensayo.html) es la consola DE VERDAD —motor.js entero— corriendo contra esto
 * en vez de contra Firebase: motor_sim.js lo genera _build_site.py desde motor.js cambiando solo sus imports.
 *
 * El Firebase de mentira es el de GamificaPro (sdk/sim/simulador.js, en el paquete fijado mod-sim.v1.<huella>.js, que el build
 * copia al lado): no se edita aquí. Aquí queda lo de STARGATE: la Nave Escuela (assets/sim/escuela.json, sembrada en papel por
 * herramientas/simulador_datos.cjs), la clave de este navegador (`sgEnsayo.db`; «Empezar de cero» la borra), los textos, lo
 * que se apunta para la Academia, el buzón que no finge y las funciones del servidor que se simulan.
 *
 * 🔴 Nada sale del navegador y no da acceso a nada real: ni cuentas, ni red (salvo leer assets/sim/escuela.json), ni permisos.
 *
 * 🔴 LAS FECHAS VIAJAN CON EL CALENDARIO. Los datos se sembraron un día concreto, «hoy es la semana 15». Al cargar se corren
 * todas las fechas las semanas enteras (de lunes a lunes) que hayan pasado: el ensayo siempre está en su semana 15. Lo tocado se
 * guarda con su corrimiento: cambia de semana, empieza de cero.
 */
import "./mod-sim.v1.3855e2af74.js";
const { crearSimulador, semanasEnteras, SEMANA } = globalThis.GP_SIM;

const CLAVE = "sgEnsayo.db";
const HUELLA = new URL(import.meta.url).searchParams.get("h") || "1";
const semilla = await fetch(new URL("../../sim/escuela.json?h=" + encodeURIComponent(HUELLA), import.meta.url)).then((r) => {
  if (!r.ok) throw new Error("No se han podido cargar los datos del ensayo (" + r.status + ").");
  return r.json();
});
const CORRE = semanasEnteras(Number(semilla.generado || Date.now())) * SEMANA;
const VERSION = semilla.v + "+" + Math.round(CORRE / SEMANA);

/**
 * 🔴 30-sep · LO QUE HACE EL DOCENTE, APUNTADO PARA LA ACADEMIA. Cada planeta de la Academia pide una misión en este ensayo
 * («valida uno y anula otro», «manda un mensaje», «resuelve la Cola de nota», «esconde un premio»): en cada escritura que se
 * queda se apunta qué se ha hecho (localStorage `sgEnsayo.hechos`, en este navegador). Aparte de los datos: «Empezar de cero»
 * deja la Nave Escuela como estaba, pero lo conseguido no se pierde.
 */
function apuntarHecho(ruta, d) {
  let k = null;
  if (/^student_profiles\/[^/]+$/.test(ruta) && d && Array.isArray(d.stargateOtorgados) && d.stargateOtorgados.length) k = "validar";
  else if (/^stargate_anulaciones\//.test(ruta) && d) k = "anular";
  else if (/^notifications\//.test(ruta) && d && d.stargate) k = "mensaje";
  else if (/^purchased_vouchers\//.test(ruta) && d && (d.status === "approved" || d.status === "rejected")) k = "cola";
  else if (/\/privado\/stargate$/.test(ruta) && d && d.premiosEnlace && Object.keys(d.premiosEnlace).length) k = "premio";
  if (!k) return;
  try { const h = JSON.parse(localStorage.getItem("sgEnsayo.hechos") || "{}") || {}; if (!h[k]) { h[k] = Date.now(); localStorage.setItem("sgEnsayo.hechos", JSON.stringify(h)); } } catch (e) { /* sin almacenamiento */ }
}

/**
 * 🔴 LO QUE EN EL ENSAYO NO PUEDE «FUNCIONAR» SIN ENGAÑAR. El buzón es la línea con el equipo de STARGATE: si aquí se
 * guardara en la memoria del navegador, quien escribe una duda de verdad creería haberla mandado y no le leería nadie.
 */
// (8-oct, tanda 2c de «adelantar lo de Navidad», GamificaPro · la web escribe ya en mod_buzon: tampoco)
const NO_SE_GUARDA = [[/^(stargate|mod)_buzon\//, "En la consola de ensayo el buzón no llega a nadie. Escríbenos desde tu Nave de Comandante de verdad."]];

const QUE_HACE = { completeMission: "registrar un reto como recluta", castVote: "votar como recluta", claimLinkedReward: "abrir un premio por enlace",
  consumeItem: "usar una carta", stargateAsistencia: "fichar en la llamada a filas", stargateBatalla: "jugar la batalla contra Joran",
stargateSortear: "hacer el Gran Sorteo", modSortear: "hacer el Gran Sorteo", stargateSorteosPendientes: "mirar los sorteos pendientes", stargateOferta: "lanzar una oferta del Mercado",
  stargateSecreto: "comprobar una palabra secreta", stargateHitos: "comprobar los logros de a bordo", stargateMiNombre: "cambiar tu nombre en todos tus grupos",
  stargateHeroeRepetido: "cambiar un héroe repetido", deleteProject: "borrar el grupo",
  stargateZocoPoner: "poner algo en el Zoco", stargateZocoRetirar: "retirar algo del Zoco", stargateZocoOfertar: "ofertar en el Zoco",
  stargateZocoResponder: "responder en el Zoco", stargateZocoDeshacer: "deshacer un trato del Zoco" };

// ── las funciones del servidor (httpsCallable): las del docente que más se ven, simuladas (premiar, validar y anular un reto,
// regalar en clase, el equipo, congelar o dar de baja); las demás dicen con palabras que en el ensayo no hay servidor.
function servidor(S) {
  const { DATOS, escribir, hacerSet, hacerUpdate, resolverConsulta, trasEscribir, idNuevo, refDoc, YO, DB } = S.interno;
  const { query, collection, where, deleteField, arrayUnion, arrayRemove } = S;
  const fallo = (code, texto) => Object.assign(new Error(texto), { code: "functions/" + code });
  const ficha = (id) => { const f = DATOS.get("student_profiles/" + id); if (!f) throw new Error("No encuentro esa ficha."); return f; };
  function misionDe(per, retoId) {
    const r = resolverConsulta(query(collection(DB, "missions"), where("projectId", "==", per), where("stargateId", "==", retoId)));
    return r.length ? { id: r[0][0].split("/")[1], d: r[0][1] } : null;
  }
  const premiosDe = (per) => resolverConsulta(query(collection(DB, "rewards"), where("projectId", "==", per))).map(([ruta, d]) => Object.assign({ id: ruta.split("/")[1] }, d));
  /** Sacar del cofre con sus probabilidades, como el Mercado (y como el servidor: lootPicker.js). */
  function sortea(cofre) {
    const items = (((cofre || {}).consumeEffects || {}).lootBox || {}).items || [];
    const total = items.reduce((a, i) => a + Math.max(0, Number(i.probability) || 0), 0);
    let n = Math.random() * (total || items.length);
    for (const i of items) { n -= total ? Math.max(0, Number(i.probability) || 0) : 1; if (n <= 0) return i.rewardId; }
    return items.length ? items[items.length - 1].rewardId : null;
  }
  /**
   * 8-oct · EL JUEGO DEL FINAL, por el servidor (GamificaPro modClase, sala «directo» de STARGATE: partes { estado: 'documento' },
   * respuestas de forma 'jugador', eventos { sub: 'eventos', alumno: ['sabotaje'] }, sinCongelar). Lo mismo que escribía directoCanal.
   * 8-oct (tarde, tanda 1 de «adelantar lo de Navidad») · donde lo escribe ya el servidor: mod_directo/{grupo}, con `mod: 'stargate'`.
   */
  function directo(x, per, ahora) {
    const sala = "mod_directo/" + per, MOD = { mod: "stargate" }, plano = (v) => !!v && typeof v === "object" && !Array.isArray(v);
    const grupo = DATOS.get("projects/" + per);
    if (!grupo) throw fallo("not-found", "Ese grupo no existe.");
    const docente = (grupo.coTeacherEmails || []).map((c) => String(c).toLowerCase()).indexOf(String(YO.correo || "").toLowerCase()) >= 0 || grupo.ownerId === YO.uid;
    const mia = (fichaId) => {
      const f = typeof fichaId === "string" && fichaId && fichaId.indexOf("/") < 0 ? DATOS.get("student_profiles/" + fichaId) : null;
      if (!f || f.userId !== YO.uid || f.projectId !== per) throw fallo("permission-denied", "Esa ficha no es tuya en este grupo.");
      if (f.stargateCongelado != null) throw fallo("permission-denied", "Tu referente ha congelado tu cuenta: puedes mirar, pero no hacer nada.");
      return f;
    };
    if (["poner", "abrir", "cerrar", "pregunta", "cerrarPregunta"].indexOf(x.accion) >= 0) {
      if (!docente) throw fallo("permission-denied", "Esto es del equipo docente del grupo.");
      if (x.accion !== "poner") throw fallo("invalid-argument", "Esta sala no tiene sesión que abrir o cerrar.");
      if (x.parte !== "estado") throw fallo("invalid-argument", "Esa parte de la sala no existe.");
      if (!plano(x.valor)) throw fallo("invalid-argument", "«estado» tiene que ser un mapa.");
      hacerSet(refDoc(sala), Object.assign({ projectId: per, actualizado: ahora }, MOD, { estado: x.valor }));
    } else if (x.accion === "evento") {
      const t = typeof x.t === "string" ? x.t : "";
      if (!t || t.length > 40) throw fallo("invalid-argument", "Falta qué pasa.");
      const datos = x.datos === undefined ? null : x.datos, id = idNuevo();
      if (docente) escribir(sala + "/eventos/" + id, Object.assign({ t, datos, uid: YO.uid }, typeof x.fichaId === "string" ? { fichaId: x.fichaId } : {}, { creado: ahora }, MOD));
      else {
        if (t !== "sabotaje") throw fallo("permission-denied", "Eso solo lo puede mandar el equipo docente.");
        mia(x.fichaId);
        escribir(sala + "/eventos/" + id, Object.assign({ t, datos, uid: YO.uid, fichaId: x.fichaId, creado: ahora }, MOD));
      }
      trasEscribir(); return { ok: true, id };
    } else if (x.accion === "responder") {
      const f = mia(x.fichaId), avatar = x.avatar == null ? "" : x.avatar;
      if (typeof x.listo !== "boolean") throw fallo("invalid-argument", "Falta si está listo.");
      if (typeof x.puntos !== "number" || !isFinite(x.puntos) || x.puntos < 0 || x.puntos > 100000) throw fallo("invalid-argument", "Esos puntos no valen.");
      if (typeof avatar !== "string" || avatar.length > 300 || !/^[A-Za-z0-9_.\/:?=&%~+,;@!*#-]*$/.test(avatar)) throw fallo("invalid-argument", "Ese avatar no vale.");
      if (x.stats != null && !plano(x.stats)) throw fallo("invalid-argument", "Las cifras tienen que ser un mapa.");
      const antes = DATOS.get(sala + "/jugadores/" + x.fichaId);
      if (antes && antes.uid !== YO.uid) throw fallo("permission-denied", "Esa respuesta no es tuya.");
      escribir(sala + "/jugadores/" + x.fichaId, { projectId: per, fichaId: x.fichaId, uid: YO.uid, alias: String(f.displayName || ""), avatar, listo: x.listo, puntos: x.puntos,
        stats: x.stats || {}, actualizado: ahora, mod: "stargate" });
    } else if (x.accion === "quitarRespuesta") {
      const id = String(x.id || ""), antes = DATOS.get(sala + "/jugadores/" + id);
      if (!id || id.indexOf("/") >= 0) throw fallo("invalid-argument", "Esa respuesta no es de este grupo.");
      if (antes && antes.uid !== YO.uid && !docente) throw fallo("permission-denied", "Solo la suya, o el equipo docente.");
      if (antes) escribir(sala + "/jugadores/" + id, null);
    } else throw fallo("invalid-argument", "En el simulador no se puede «" + x.accion + "».");
    trasEscribir(); return { ok: true };
  }
  return {
    // 7-oct · la investigación del ticket (GamificaPro modConsentimiento / modOlvidarSeudonimo): en el ensayo nadie ha decidido
    // nada y no hay seudónimos que borrar (docs/INVESTIGACION_TICKET.md, §7.6)
    async modConsentimiento() { return { ok: true, investigacion: null }; },
    async modOlvidarSeudonimo() { return { ok: true, retirados: 0, borradas: 0, temas: 0, sinSecreto: true, ya: true }; },
    async applyXpDelta(x) {
      const ruta = "student_profiles/" + x.studentProfileId, f = ficha(x.studentProfileId);
      hacerUpdate(refDoc(ruta), [{ totalPoints: Math.max(0, (Number(f.totalPoints) || 0) + (Number(x.deltaXp) || 0)), coins: Math.max(0, (Number(f.coins) || 0) + (Number(x.deltaCoins) || 0)) }]);
      trasEscribir(); return { ok: true };
    },
    async stargateAnularReto(x) {
      const m = misionDe(x.projectId, x.retoId), f = ficha(x.studentProfileId), ruta = "student_profiles/" + x.studentProfileId;
      if (!m) throw new Error("Ese reto no existe en este grupo.");
      if ((f.completedMissionIds || []).indexOf(m.id) < 0) throw new Error("Ese reto no está registrado.");
      const xp = Number(m.d.points) || 0, oro = Number(m.d.coinsReward) || 0, tenia = Number(f.coins) || 0;
      const sellos = Object.assign({}, f.missionTimestamps || {}); delete sellos[m.id];
      hacerUpdate(refDoc(ruta), [{ completedMissionIds: (f.completedMissionIds || []).filter((id) => id !== m.id), missionTimestamps: sellos,
        totalPoints: Math.max(0, (Number(f.totalPoints) || 0) - xp), coins: Math.max(0, tenia - oro),
        earnedBadges: (f.earnedBadges || []).filter((b) => b !== m.d.badge) }]);
      // (como el servidor: queda escrito quién lo deshizo y por qué)
      escribir("stargate_anulaciones/" + idNuevo(), { projectId: x.projectId, studentProfileId: x.studentProfileId, userId: f.userId, retoId: x.retoId, missionId: m.id,
        por: "docente", porCorreo: YO.correo, motivo: String(x.motivo || "").slice(0, 200), xp, creditos: oro, fecha: Date.now() });
      trasEscribir(); return { ok: true, xp, creditos: oro, noRetirados: Math.max(0, oro - tenia), saldo: Math.max(0, tenia - oro) };
    },
    async stargateEquipo(x) {
      const persona = { correo: String((x.persona || {}).correo || "").toLowerCase(), nombre: String((x.persona || {}).nombre || "").slice(0, 80), rol: (x.persona || {}).rol === "referente" ? "referente" : "docente" };
      if (!persona.correo) throw new Error("Falta el correo.");
      const pers = x.projectIds || [x.projectId], hechos = [], fallos = [];
      pers.forEach((per) => {
        const p = DATOS.get("projects/" + per), pv = DATOS.get("projects/" + per + "/privado/stargate") || {};
        if (!p) { fallos.push(per); return; }
        let lista = (pv.docentes || []).slice();
        if (x.quitar) lista = lista.filter((d) => String(d.correo).toLowerCase() !== persona.correo);
        else { const i = lista.findIndex((d) => String(d.correo).toLowerCase() === persona.correo);
          if (i >= 0) lista[i] = Object.assign({}, lista[i], persona, { nombre: persona.nombre || lista[i].nombre });
          else lista.push(Object.assign({ panel: "", imparte: true }, persona, { nombre: persona.nombre || persona.correo.split("@")[0] })); }
        hacerSet(refDoc("projects/" + per + "/privado/stargate"), { docentes: lista }, { merge: true });
        hacerUpdate(refDoc("projects/" + per), [{ coTeacherEmails: x.quitar ? arrayRemove(persona.correo) : arrayUnion(persona.correo) }]);
        hechos.push(per);
      });
      trasEscribir(); return { ok: true, hechos, fallos, persona };
    },
    async stargateAlumno(x) {
      const ruta = "student_profiles/" + x.fichaId, f = ficha(x.fichaId);
      if (x.accion === "congelar" || x.accion === "descongelar") {
        hacerUpdate(refDoc(ruta), [{ stargateCongelado: x.accion === "congelar" ? { por: YO.correo, fecha: Date.now() } : deleteField() }]);
        trasEscribir(); return { ok: true, estado: x.accion === "congelar" ? "congelado" : "activo" };
      }
      if (x.accion === "baja") {
        escribir(ruta + "/privado/datos", null); escribir(ruta, null);
        // 8-oct (tanda 2) · el alias de STARGATE vive en mod_alias (GamificaPro: `pasadaPara` del mapa)
        resolverConsulta(query(collection(DB, "mod_alias"), where("projectId", "==", x.projectId), where("uid", "==", f.userId))).forEach(([r]) => escribir(r, null));
        trasEscribir(); return { ok: true };
      }
      const e = new Error("En el ensayo no se puede mover a nadie de grupo: solo hay un grupo. En los tuyos de verdad, sí."); e.code = "functions/failed-precondition"; throw e;
    },
    // 8-oct · la Academia de la Cero la guarda el servidor (GamificaPro: modFormacion, mod «stargate»; PLAN_CENTRALIZAR §1e): lo mismo
    // que escribía el navegador en stargate_formacion/{uid} (aquí no hay reglas: en el ensayo manda quien está dentro)
    // (8-oct, tanda 2c · ya entera en mod_formacion/stargate__{uid}, con su mod, como el servidor; lo que se devuelve, como la vieja)
    async modFormacion(x) {
      const ruta = (uid) => "mod_formacion/stargate__" + uid, ahora = Date.now();
      const comoVuelve = (v) => { if (!v) return v; const { mod: _m, ...y } = v; return y; };
      if (x.mod !== "stargate") throw fallo("invalid-argument", "Ese mod no tiene formación del profesorado.");
      if (x.accion === "guardar")
        hacerSet(refDoc(ruta(YO.uid)), Object.assign({ uid: YO.uid, correo: String(YO.correo || "").toLowerCase(),
          nombre: String(typeof x.nombre === "string" ? x.nombre : YO.nombre || "").slice(0, 80), t: ahora }, x.campos || {}, { mod: "stargate" }), { merge: true });
      else if (x.accion === "mia") return { ok: true, ficha: comoVuelve(DATOS.get(ruta(YO.uid))) || null };
      else if (x.accion === "todos")
        return { ok: true, lista: [...DATOS.entries()].filter(([k]) => /^mod_formacion\/stargate__[^/]+$/.test(k)).map(([k, v]) => Object.assign({}, comoVuelve(v), { uid: k.split("__")[1] })) };
      else if (x.accion === "editar" || x.accion === "responder" || x.accion === "quitar") {
        if (x.accion === "quitar") escribir(ruta(String(x.uid || "")), null);
        else {
          if (!DATOS.get(ruta(String(x.uid || "")))) throw fallo("not-found", "Esa persona no está en la formación.");
          if (x.accion === "editar") {
            const c = {};
            for (const k of ["nombre", "alias", "correo"]) if ((x.campos || {})[k] != null) c[k] = String(x.campos[k]).trim();
            if (!Object.keys(c).length) throw fallo("invalid-argument", "No hay nada que corregir.");
            if (c.correo != null) { c.correo = c.correo.toLowerCase(); if (!/^[^@\s]+@[^@\s]+[.][a-z]{2,}$/.test(c.correo)) throw fallo("invalid-argument", "Ese correo no parece un correo."); }
            hacerUpdate(refDoc(ruta(x.uid)), [c]);
          } else {
            const t = String(x.texto || "").trim().slice(0, 2000);
            if (t.length < 2) throw fallo("invalid-argument", "Escribe algo antes de enviar.");
            hacerUpdate(refDoc(ruta(x.uid)), ["mando.mensajes." + ahora, { texto: t, t: ahora, de: String(x.de || "El Mando").slice(0, 80) }]);
            trasEscribir(); return { ok: true, t: ahora };
          }
        }
      } else throw fallo("invalid-argument", "En el simulador no se puede «" + x.accion + "».");
      trasEscribir(); return { ok: true };
    },
    // 8-oct · lo en vivo lo escribe el servidor (GamificaPro: modClase, sala «envivo» de STARGATE): lo mismo que escribía el
    // navegador en stargate_envivo/{grupo} y stargate_respuestas/{grupo}__{pregunta}__{ficha}. Y el juego del final (sala
    // «directo»): stargate_directo/{grupo} (el estado, entero), jugadores/{ficha} y eventos, como lo escribía directoCanal.
    // 8-oct (tarde, tanda 1 de «adelantar lo de Navidad») · donde lo escribe ya el servidor: mod_envivo y mod_respuestas, con `mod: 'stargate'`.
    async modClase(x) {
      const per = String(x.projectId || ""), ruta = "mod_envivo/" + per, ahora = Date.now();
      if (x.sala === "directo") return directo(x, per, ahora);
      if (x.sala !== "envivo") throw fallo("failed-precondition", "En el simulador no se puede usar esa sala por el servidor.");
      if (x.accion === "poner") {
        if (x.parte !== "sesion" || !x.valor || typeof x.valor !== "object" || Array.isArray(x.valor)) throw fallo("invalid-argument", "Esa parte de la sala no existe.");
        hacerSet(refDoc(ruta), { projectId: per, actualizado: ahora, mod: "stargate", sesion: x.valor }, { merge: true });
      } else if (x.accion === "pregunta") {
        const t = String(x.texto || "").trim().slice(0, 300);
        if (!t) throw fallo("invalid-argument", "Escribe la pregunta.");
        const id = "p" + Array.from({ length: 10 }, () => "abcdefghijkmnpqrstuvwxyz23456789"[Math.floor(Math.random() * 32)]).join("");
        hacerSet(refDoc(ruta), { projectId: per, actualizado: ahora, mod: "stargate", pregunta: { id, texto: t, abierta: true, t: ahora, por: String(x.por || "").slice(0, 80) } }, { merge: true });
        trasEscribir(); return { ok: true, id };
      } else if (x.accion === "cerrarPregunta") {
        if (!DATOS.get(ruta)) throw fallo("not-found", "No hay ninguna pregunta abierta.");
        hacerUpdate(refDoc(ruta), [{ "pregunta.abierta": false, actualizado: ahora }]);
      } else if (x.accion === "responder") {
        const sala = DATOS.get(ruta), f = DATOS.get("student_profiles/" + x.fichaId), t = String(x.texto || "").trim().slice(0, 280);
        if (!t) throw fallo("invalid-argument", "Escribe tu respuesta.");
        if (!sala || !sala.pregunta || sala.pregunta.id !== x.pregunta || sala.pregunta.abierta !== true) throw fallo("failed-precondition", "Esa pregunta ya está cerrada.");
        escribir("mod_respuestas/" + per + "__" + x.pregunta + "__" + x.fichaId, { projectId: per, pregunta: x.pregunta, fichaId: x.fichaId, uid: YO.uid,
          alias: String((f && f.displayName) || ""), texto: t, creado: ahora, mod: "stargate" });
      } else if (x.accion === "quitarRespuesta") {
        const id = String(x.id || "");
        if (id.indexOf(per + "__") !== 0) throw fallo("invalid-argument", "Esa respuesta no es de este grupo.");
        escribir("mod_respuestas/" + id, null);
      } else throw fallo("failed-precondition", "En el simulador no se puede «" + x.accion + "».");
      trasEscribir(); return { ok: true };
    },
    async stargateRegalar(x) {
      const per = x.projectId, regalo = x.regalo || {}, docs = premiosDe(per), tipo = String(regalo.tipo || "");
      const cofreDe = (t) => docs.find((r) => r.stargateTipo === t && r.consumeEffects && r.consumeEffects.lootBox);
      if (tipo === "participacion") {
        const t = docs.find((r) => r.id === regalo.sorteo && r.systemEffect === "lottery_ticket");
        if (!t) throw new Error("Ese sorteo no existe en este grupo.");
        const n = Math.max(1, Math.min(10, Math.floor(Number(regalo.n) || 1)));
        const resultados = (x.fichas || []).map((id) => { const f = ficha(id), ya = Number((f.lotteryEntries || {})[t.id] || 0);
          hacerUpdate(refDoc("student_profiles/" + id), ["lotteryEntries." + t.id, ya + n]); return { ficha: id, participaciones: n }; });
        trasEscribir(); return { ok: true, tipo, sorteo: t.id, resultados };
      }
      let piezas, unico = false;
      if (tipo === "carta" || tipo === "sobre") {
        const sobre = cofreDe("cromo"); if (!sobre) throw new Error("Este grupo no tiene sobres de cromos.");
        piezas = regalo.clave ? () => [per + "__cromo_" + regalo.clave] : () => Array.from({ length: tipo === "sobre" ? Math.max(1, Number(sobre.maxUses || 3)) : 1 }, () => sortea(sobre)).filter(Boolean);
      } else if (tipo === "heroe") {
        piezas = regalo.clave ? () => [per + "__heroe_" + regalo.clave] : () => [sortea(cofreDe("heroe"))].filter(Boolean);
      } else if (tipo === "cofre") {
        const cofre = cofreDe(String(regalo.cual || "")); if (!cofre) throw new Error("Este grupo no tiene ese cofre en su tienda.");
        piezas = () => Array.from({ length: Math.max(1, Number(cofre.maxUses || 1)) }, () => sortea(cofre)).filter(Boolean);
      } else if (tipo === "adorno") {
        const r = docs.find((y) => y.inStore !== false && y.stargateTipo === regalo.cual); if (!r) throw new Error("Este grupo no tiene ese adorno en su tienda.");
        piezas = () => [r.id]; unico = true;
      } else throw new Error("Ese regalo no existe.");
      const resultados = (x.fichas || []).map((id) => {
        try {
          const f = ficha(id), inv = (f.inventory || []).slice(), nuevas = piezas();
          if (unico && inv.indexOf(nuevas[0]) >= 0) return { ficha: id, ya: true, piezas: [] };
          hacerUpdate(refDoc("student_profiles/" + id), [{ inventory: inv.concat(nuevas) }]);
          return { ficha: id, piezas: nuevas };
        } catch (e) { return { ficha: id, error: String(e.message || e) }; }
      });
      trasEscribir(); return { ok: true, tipo, resultados };
    },
  };
}

const S = crearSimulador({
  semilla, clave: CLAVE, version: VERSION, corre: CORRE,
  nombre: "ensayo", donde: "en el ensayo", prefijoId: "ens", token: "",
  noSeGuarda: NO_SE_GUARDA, alEscribir: apuntarHecho,
  /** «Salir» en el ensayo es salir del ensayo: de vuelta a la Academia (la sesión de verdad ni se ha tocado). */
  alSalir: () => { setTimeout(() => { location.href = "academia.html"; }, 0); },
  queHace: QUE_HACE,
  sinServidor: (que) => "En la consola de ensayo no se puede " + que + ": eso lo hace el servidor, y aquí no hay servidor. En tu grupo de verdad, sí.",
  funciones: servidor,
});

// lo que importa motor.js (y lo demás del Firebase de verdad que el simulador sabe hacer), con sus nombres
export const initializeApp = S.initializeApp;
export const getAuth = S.getAuth;
export const GoogleAuthProvider = S.GoogleAuthProvider;
export const signInWithPopup = S.signInWithPopup;
export const signInWithCredential = S.signInWithCredential;
export const signInAnonymously = S.signInAnonymously;
export const signOut = S.signOut;
// 9-oct · lo que importa motor.js para «Cambiar el correo con el que entro» (sdk/cuenta.js): en el ensayo no sale el botón
export const reauthenticateWithPopup = () => Promise.reject(new Error("En la consola de ensayo no se cambia de cuenta."));
export const deleteApp = () => Promise.resolve();
export const onAuthStateChanged = S.onAuthStateChanged;
export const connectAuthEmulator = S.connectAuthEmulator;
export const getFirestore = S.getFirestore;
export const connectFirestoreEmulator = S.connectFirestoreEmulator;
export const terminate = S.terminate;
export const Timestamp = S.Timestamp;
export const FieldPath = S.FieldPath;
export const arrayUnion = S.arrayUnion;
export const arrayRemove = S.arrayRemove;
export const deleteField = S.deleteField;
export const serverTimestamp = S.serverTimestamp;
export const increment = S.increment;
export const doc = S.doc;
export const collection = S.collection;
export const where = S.where;
export const orderBy = S.orderBy;
export const limit = S.limit;
export const query = S.query;
export const getDoc = S.getDoc;
export const getDocs = S.getDocs;
export const getCountFromServer = S.getCountFromServer;
export const setDoc = S.setDoc;
export const updateDoc = S.updateDoc;
export const deleteDoc = S.deleteDoc;
export const addDoc = S.addDoc;
export const writeBatch = S.writeBatch;
export const runTransaction = S.runTransaction;
export const onSnapshot = S.onSnapshot;
export const getFunctions = S.getFunctions;
export const connectFunctionsEmulator = S.connectFunctionsEmulator;
export const httpsCallable = S.httpsCallable;
