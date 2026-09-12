/**
 * STARGATE · LA CENTRALITA
 *
 * Lo único de todo el sistema que habla con Firebase. Entra, lee, escribe y llama a las funciones
 * del servidor de GamificaPro. Nada más: la aritmética del tablero está en motor/tablero.js, que es
 * una función pura y por eso se puede probar sin red.
 *
 * 🔴 Esa separación es deliberada y es la que permite dormir tranquilo: aquí no hay ni una regla de
 * juego. Si algo de este fichero falla, falla la conexión; no se descuadra la economía de nadie.
 *
 * Se carga como módulo (`type="module"`) porque el SDK de Firebase se sirve así desde Google. Al
 * terminar deja `window.SG.MOTOR` y avisa con el evento `sg:motor` para que el resto de la web
 * —que son scripts normales— sepa que ya puede usarlo.
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch, onSnapshot }
  from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getFunctions, httpsCallable }
  from "https://www.gstatic.com/firebasejs/12.1.0/firebase-functions.js";

const CFG = window.SG_FIREBASE || {};
const app = initializeApp(CFG);
const auth = getAuth(app);
const db = getFirestore(app);
const fns = getFunctions(app);
const google = new GoogleAuthProvider();

// ------------------------------------------------------------------ la sesión
// 🔴 `undefined` es «todavía no sé» y `null` es «no hay nadie». Son dos cosas distintas y
// confundirlas es el error clásico aquí: Firebase tarda un instante en mirar si había sesión
// guardada, y preguntar antes de que conteste devuelve «no hay nadie» y manda a la puerta a quien
// ya estaba dentro.
let quien;
const esperando = [];
onAuthStateChanged(auth, u => {
  quien = u ? { uid: u.uid, correo: (u.email || "").toLowerCase(), nombre: u.displayName || "", foto: u.photoURL || "" } : null;
  document.dispatchEvent(new CustomEvent("sg:sesion", { detail: quien }));
  while (esperando.length) esperando.shift()(quien);
});
const sesion = () => new Promise(ok => (quien !== undefined ? ok(quien) : esperando.push(ok)));

async function entrar() { const r = await signInWithPopup(auth, google); return r.user; }
async function salir() { await signOut(auth); }

// ------------------------------------------------------------------ leer
// 🔴 Las colecciones de GamificaPro son comunes a TODOS los proyectos, así que el identificador
// del documento lleva el grupo por delante (`pruebas__A1`). Pero el tablero y la web entera hablan
// en identificadores de STARGATE (`A1`), y así se va a quedar: se traduce aquí, en la puerta, una
// sola vez. `docId` queda a mano para cuando haya que escribir.
const docs = async (col, campo, valor) => {
  const r = await getDocs(query(collection(db, col), where(campo, "==", valor)));
  return r.docs.map(d => {
    const x = d.data();
    return Object.assign({}, x, { id: x.stargateId || d.id, docId: d.id });
  });
};

/**
 * Todo lo que hace falta para pintar el tablero de un PER, en cuatro consultas paralelas.
 *
 * `conPrivados` añade una quinta ronda: la ficha privada de cada recluta (nombre, correo). Solo la
 * pide el profesorado, y Firestore solo se la da a quien tiene derecho — no es una cortesía de la
 * página, es una regla del servidor.
 */
async function leerPER(perId, conPrivados) {
  const p = await getDoc(doc(db, "projects", perId));
  if (!p.exists()) throw new Error("No existe el grupo «" + perId + "»");
  const [misiones, campanas, recompensas, perfiles] = await Promise.all([
    docs("missions", "projectId", perId), docs("campaigns", "projectId", perId),
    docs("rewards", "projectId", perId), docs("student_profiles", "projectId", perId)
  ]);
  const datos = { proyecto: Object.assign({ id: p.id }, p.data()), misiones, campanas,
                  recompensas, perfiles, privados: {}, vales: [], catalogo: window.SG_CATALOGO };
  if (conPrivados) {
    datos.vales = await docs("purchased_vouchers", "projectId", perId);
    try { const pv = await getDoc(doc(db, "projects", perId, "privado", "stargate"));
          datos.privadoPER = pv.exists() ? pv.data() : {}; } catch (e) { datos.privadoPER = {}; }
    const fichas = await Promise.all(perfiles.map(async f => {
      try { const d = await getDoc(doc(db, "student_profiles", f.id, "privado", "datos"));
            return [f.id, d.exists() ? d.data() : {}]; } catch (e) { return [f.id, {}]; }
    }));
    fichas.forEach(([id, d]) => { datos.privados[id] = d; });
  }
  return datos;
}

const tablero = async (perId, conPrivados) =>
  window.SG.TABLERO.tablero(await leerPER(perId, conPrivados), !!conPrivados);

/** Los PER en los que figuro como docente, más los que son de demostración. */
async function misPERs(correo) {
  correo = String(correo || "").toLowerCase();
  const r = await getDocs(query(collection(db, "projects"), where("coTeacherEmails", "array-contains", correo)));
  return r.docs.map(d => ({ id: d.id, nombre: d.data().name, stargate: d.data().stargate || {} }))
               .filter(x => x.stargate.version);
}

// ------------------------------------------------------------------ escribir
/**
 * SEMBRAR UN PER. Lo que antes hacía el menú de la hoja de cálculo: crear el grupo entero.
 *
 * 🔴 Se escribe en lotes y el PROYECTO VA EL PRIMERO, solo. No es manía: la regla de Firestore que
 * deja crear misiones pregunta «¿eres docente de ese proyecto?», y para contestarla tiene que poder
 * leer el proyecto. Si fuese todo en el mismo lote, el proyecto aún no existiría y Firestore
 * rechazaría las 90 escrituras siguientes sin decir por qué.
 */
async function sembrarPER(per, alAvanzar) {
  const yo = await sesion();
  if (!yo) throw new Error("Entra con tu cuenta de Google antes de crear un grupo");
  const cat = window.SG_CATALOGO;
  const paq = window.SG.PAQUETE.paquete(per, cat);
  const id = per.id;
  const avisa = t => { if (alAvanzar) alAvanzar(t); };

  if ((await getDoc(doc(db, "projects", id))).exists())
    throw new Error("Ya existe un grupo con el identificador «" + id + "». Elige otro nombre.");

  avisa("Creando el grupo…");
  // El equipo docente entra en coTeacherEmails: es lo que mira Firestore para dejarles entrar. Y
  // quien lo crea se añade también, para no quedarse fuera de su propio grupo por un despiste.
  const correos = Array.from(new Set(paq.proyecto.coTeacherEmails.concat([yo.correo]).filter(Boolean)));
  await setDoc(doc(db, "projects", id), Object.assign({}, paq.proyecto, {
    teacherId: yo.uid, ownerId: yo.uid, teacherEmail: yo.correo, ownerEmail: yo.correo,
    coTeacherEmails: correos, createdAt: Date.now(), isOnboardingComplete: true
  }));

  // Los correos del profesorado y el enlace de edición, a su sitio: fuera del documento abierto.
  await setDoc(doc(db, "projects", id, "privado", "stargate"), paq.privado);

  const tandas = [
    ["missions", paq.misiones, "misiones"],
    ["campaigns", paq.campanas, "campañas"],
    ["rewards", paq.recompensas, "recompensas y colección"]
  ];
  for (const [col, lista, nombre] of tandas) {
    avisa("Sembrando " + lista.length + " " + nombre + "…");
    // Firestore admite 500 escrituras por lote; vamos de 200 en 200 por prudencia.
    for (let i = 0; i < lista.length; i += 200) {
      const lote = writeBatch(db);
      lista.slice(i, i + 200).forEach(x => {
        const { id: _fuera, ...resto } = x;   // ver conIdsDeDocumento: el `id` no entra en el documento
        lote.set(doc(db, col, id + "__" + x.id), Object.assign({}, resto, conIdsDeDocumento(id, x)));
      });
      await lote.commit();
    }
  }
  avisa("Listo");
  return id;
}

/**
 * ALISTARSE. Abre la ficha del recluta y le da su insignia de Reclutamiento.
 *
 * 🔴 La ficha nace A CERO y así tiene que ser: la regla de Firestore lo exige (`naceEnCero`), y por
 * un buen motivo — sin eso, cualquiera podía crearse un segundo perfil con 999.999 de experiencia,
 * porque al CREAR no se miraba la economía. Los 100 xp y los 20 créditos del alistamiento los da el
 * servidor después, completando la misión H1, que es el único camino por el que entra dinero.
 */
async function alistar(perId, datos, alAvanzar) {
  const yo = await sesion();
  if (!yo) throw new Error("Entra con tu cuenta antes de alistarte");
  const avisa = t => { if (alAvanzar) alAvanzar(t); };
  const p = await getDoc(doc(db, "projects", perId));
  if (!p.exists()) throw new Error("No existe el grupo «" + perId + "»");
  const proy = p.data();

  // El escuadrón sale del Comandante elegido: quien elige profe, hereda bando.
  const escuadron = (proy.factions || []).filter(f =>
    f.teacherName === datos.comandante ||
    (f.assignedTeacherEmails || []).indexOf(String(datos.comandante || "").toLowerCase()) >= 0)[0] || null;

  avisa("Abriendo tu ficha…");
  const ficha = doc(collection(db, "student_profiles"));
  await setDoc(ficha, {
    userId: yo.uid, projectId: perId, displayName: datos.alias,
    totalPoints: 0, coins: 0, inventory: [], earnedBadges: [],
    completedMissionIds: [], completedCampaignIds: [], currentPhase: 1, role: "student",
    hubCustomization: {}, createdAt: Date.now(),
    squadId: escuadron ? escuadron.id : null, factionId: escuadron ? escuadron.id : null,
    stargateProfe: datos.comandante || "", stargateAvatar: datos.avatar || null,
    stargateBio: datos.bio || ""
  });

  // 🔴 El nombre y el correo NO van en la ficha: van a `privado/datos`, que solo leen el propio
  // alumno y su equipo docente. La ficha la lee cualquiera con sesión —la necesitan el ranking y el
  // salón de la fama—, y ahí dentro un nombre real es un nombre real a la vista de todos.
  avisa("Guardando tus datos…");
  await setDoc(doc(db, "student_profiles", ficha.id, "privado", "datos"), {
    firstName: datos.nombre || "", lastName: datos.apellidos || "",
    email: datos.correo || yo.correo, bitacora: datos.bitacora || "", bio: datos.bio || ""
  });

  avisa("Entregando tu insignia…");
  try {
    const r = await getDocs(query(collection(db, "missions"),
      where("projectId", "==", perId), where("stargateId", "==", "H1")));
    if (!r.empty) await llamar("completeMission",
      { projectId: perId, missionId: r.docs[0].id, studentProfileId: ficha.id });
  } catch (e) {
    // Que falle la insignia no puede dejar a nadie sin alistar: la ficha ya existe y el profesorado
    // puede otorgar el reto a mano. Mejor dentro sin insignia que fuera con un error.
    console.warn("[STARGATE] la insignia de reclutamiento no ha entrado:", e && e.message);
  }
  return escuadron;
}

// ------------------------------------------------------------------ el puesto de mando
/** Cambiar los ajustes de un grupo. Lo público y lo privado van a sitios distintos, como siempre. */
async function guardarAjustes(perId, publico, privado) {
  if (publico && Object.keys(publico).length) await updateDoc(doc(db, "projects", perId), publico);
  if (privado && Object.keys(privado).length)
    await setDoc(doc(db, "projects", perId, "privado", "stargate"), privado, { merge: true });
}

// La fuente que el motor acepta para un movimiento hecho por el profesorado. No es decorativo:
// `applyXpDelta` rechaza cualquier nombre que no esté en su lista, y con razón — así nadie puede
// colar experiencia disfrazándola de otra cosa.
const AJUSTE_DOCENTE = "teacher_resource_adjustment";

/**
 * OTORGAR un reto a mano. Lo que hacía «otorgar» en la hoja: el profesorado da por bueno algo que
 * vio en clase y que el alumno no registró.
 *
 * 🔴 NO va por `completeMission`. Esa función exige que el perfil sea del que llama —«ese perfil no
 * es tuyo»— y hace bien: una misión la completa quien la hace. Lo del docente es otra cosa y tiene
 * su propio camino: `applyXpDelta` mueve la experiencia y los créditos dejando asiento en el libro,
 * y la lista de retos la escribe el docente, que sí puede. Un regalo sin registro es un descuadre
 * esperando a que alguien pregunte.
 */
async function otorgarReto(perId, fichaId, retoId) {
  const [mi, ficha] = await Promise.all([
    getDocs(query(collection(db, "missions"), where("projectId", "==", perId), where("stargateId", "==", retoId))),
    getDoc(doc(db, "student_profiles", fichaId))
  ]);
  if (mi.empty) throw new Error("Ese reto no existe en este grupo: " + retoId);
  if (!ficha.exists()) throw new Error("No encuentro la ficha");
  const m = mi.docs[0], d = ficha.data();
  if ((d.completedMissionIds || []).indexOf(m.id) >= 0) throw new Error("Ya lo tenía registrado");
  await llamar("applyXpDelta", {
    projectId: perId, studentProfileId: fichaId, userId: d.userId,
    deltaXp: Number(m.data().points || 0), deltaCoins: Number(m.data().coinsReward || 0),
    source: AJUSTE_DOCENTE, details: "Otorgado a mano: " + retoId
  });
  const sellos = Object.assign({}, d.missionTimestamps || {});
  sellos[m.id] = (sellos[m.id] || []).concat([new Date().toISOString()]);
  const insignias = (d.earnedBadges || []).slice();
  const badge = m.data().badge;
  if (badge && insignias.indexOf(badge) < 0) insignias.push(badge);
  await updateDoc(doc(db, "student_profiles", fichaId), {
    completedMissionIds: (d.completedMissionIds || []).concat([m.id]),
    missionTimestamps: sellos, earnedBadges: insignias
  });
}

/**
 * ANULAR un reto. Se quita de la lista y se descuenta lo que dio.
 *
 * 🔴 El descuento va por `applyXpDelta` (con su asiento en el libro) y la lista por escritura
 * directa del docente, que sí puede. Quitar el reto sin quitar la experiencia dejaría a alguien con
 * xp que no se corresponde con nada: el clásico «tiene 300 puntos y ninguna misión».
 */
async function anularReto(perId, fichaId, retoId, motivo) {
  const [mi, ficha] = await Promise.all([
    getDocs(query(collection(db, "missions"), where("projectId", "==", perId), where("stargateId", "==", retoId))),
    getDoc(doc(db, "student_profiles", fichaId))
  ]);
  if (mi.empty) throw new Error("Ese reto no existe en este grupo: " + retoId);
  if (!ficha.exists()) throw new Error("No encuentro la ficha");
  const m = mi.docs[0], d = ficha.data();
  if ((d.completedMissionIds || []).indexOf(m.id) < 0) throw new Error("Ese reto no lo tenía registrado");
  await llamar("applyXpDelta", {
    projectId: perId, studentProfileId: fichaId, userId: d.userId,
    deltaXp: -Number(m.data().points || 0), deltaCoins: -Number(m.data().coinsReward || 0),
    source: AJUSTE_DOCENTE, details: "Anulado: " + retoId + (motivo ? " · " + motivo : "")
  });
  const sellos = Object.assign({}, d.missionTimestamps || {}); delete sellos[m.id];
  await updateDoc(doc(db, "student_profiles", fichaId), {
    completedMissionIds: (d.completedMissionIds || []).filter(x => x !== m.id),
    missionTimestamps: sellos
  });
}

/**
 * PASAR TODO EL ALUMNADO de un docente a otro. Pasa de verdad —un docente se va a mitad de curso—
 * y a mano son doscientas fichas.
 *
 * Cambia el Comandante y el escuadrón de un golpe: quien se queda hereda el grupo entero.
 */
async function traspasar(perId, deNombre, aNombre) {
  const p = await getDoc(doc(db, "projects", perId));
  const destino = (p.data().factions || []).filter(f => f.teacherName === aNombre)[0] || null;
  const r = await getDocs(query(collection(db, "student_profiles"),
    where("projectId", "==", perId), where("stargateProfe", "==", deNombre)));
  let n = 0;
  for (let i = 0; i < r.docs.length; i += 200) {
    const lote = writeBatch(db);
    r.docs.slice(i, i + 200).forEach(d => {
      lote.update(d.ref, { stargateProfe: aNombre,
        squadId: destino ? destino.id : null, factionId: destino ? destino.id : null });
      n++;
    });
    await lote.commit();
  }
  return n;
}

/**
 * Resolver un vale de la cola de nota.
 *
 * 🔴 Ojo a una diferencia con el sistema viejo, y es a mejor: aquí los créditos se cobran AL PEDIR
 * y se devuelven si se deniega. Antes se cobraban al conceder, y mientras tanto ese saldo seguía
 * disponible — se podía pedir dos subidas de nota con dinero para una sola.
 */
async function resolverVale(valeId, aprobar, mensaje) {
  const v = await getDoc(doc(db, "purchased_vouchers", valeId));
  if (!v.exists()) throw new Error("Ese vale ya no está");
  const d = v.data();
  if ((d.status || "pending") !== "pending") throw new Error("Ese vale ya estaba resuelto");
  if (!aprobar) {
    const ficha = d.studentProfileId ? await getDoc(doc(db, "student_profiles", d.studentProfileId)) : null;
    if (ficha && ficha.exists() && Number(d.cost || 0) > 0) {
      const f = ficha.data(), inv = (f.inventory || []).slice(), k = inv.indexOf(d.rewardId);
      if (k >= 0) inv.splice(k, 1);
      await updateDoc(ficha.ref, { coins: Number(f.coins || 0) + Number(d.cost || 0), inventory: inv });
    }
  }
  await updateDoc(v.ref, { status: aprobar ? "approved" : "rejected",
                           resolvedAt: Date.now(), councilMessage: mensaje || "" });
}

/**
 * Los campos que hay que traducir al guardar: el identificador del documento lleva el grupo por
 * delante.
 *
 * 🔴 `missionIds` de una campaña es el caso que casi se cuela. El motor comprueba si una campaña
 * está completa mirando si sus `missionIds` están en `completedMissionIds` del alumno — y ahí dentro
 * viven identificadores de DOCUMENTO. Con los cortos, la comparación no casa nunca: el bonus de
 * planeta no se concedería jamás, y sin un solo error por ninguna parte.
 */
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

const llamar = (nombre, datos) => httpsCallable(fns, nombre)(datos).then(r => r.data);

// El catálogo (retos, insignias, niveles, tienda) sale de Datos.gs y se congela en la construcción.
// Se pide aquí y no se incrusta en cada página: son 25 KB que solo necesitan las pantallas del motor
// nuevo, y el navegador lo cachea una vez para todas.
if (!window.SG_CATALOGO) {
  try { window.SG_CATALOGO = await fetch(window.SG_CATALOGO_URL || "motor/catalogo.json").then(r => r.json()); }
  catch (e) { console.error("[STARGATE] no he podido cargar el catálogo:", e); }
}

/**
 * ════════════ LA LLAMADA A FILAS ════════════
 *
 * El pase de lista, resuelto sin inventar nada. GamificaPro ya tenía la asistencia entera —sesiones
 * con ventana, restricción por facción, registro y pago verificado en el servidor—, así que esto no
 * es un sistema nuevo: es hablar con el que hay.
 *
 * 🔴 Por qué esto NO lleva una palabra secreta de cuatro letras, como el sistema viejo. En Apps
 * Script la palabra la guardaba el servidor y el alumnado la mandaba a ciegas. En Firestore, un
 * sitio donde el alumnado pueda comprobarla es un sitio donde puede leerla antes de que la digas.
 * La defensa aquí es OTRA: la ventana es corta y la abres cuando quieres. No hay secreto que
 * proteger porque lo que no se puede adivinar es el MOMENTO. Y en la consola queda quién fichó y a
 * qué hora, que es el control de verdad de cualquier pase de lista.
 *
 * 🔴 Y las cantidades no las decide el navegador: `applyXpDelta` con esta fuente lee lo que paga de
 * la sesión, en el servidor, e ignora lo que le manden. Un alumno no decide cuánto cobra.
 */
const LLAMADA = "attendance_sessions", FICHAJES = "attendance_records";

/** La llamada abierta de un grupo, si la hay. Devuelve null si no hay ninguna o ya ha caducado. */
async function llamadaAbierta(perId) {
  const r = await getDocs(query(collection(db, LLAMADA),
    where("projectId", "==", perId), where("active", "==", true)));
  const ahora = Date.now();
  const vivas = r.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(x => fin(x) > ahora)
    .sort((a, b) => fin(b) - fin(a));
  return vivas[0] || null;
}
const fin = x => {
  const t = x && x.endTime;
  if (!t) return 0;
  return t.toDate ? t.toDate().getTime() : new Date(t).getTime();
};

/**
 * Abrir la llamada. La abre un docente para SU escuadrón y nadie más.
 *
 * `restrictedFactionId` es lo que hace que la llamada sea «solo de mi clase»: GamificaPro ya lo
 * comprueba en el servidor al pagar, así que no es una cortesía de la interfaz.
 */
async function abrirLlamada(perId, minutos, opciones) {
  const yo = await sesion();
  if (!yo) throw new Error("Entra con tu cuenta para tocar llamada a filas");
  const o = opciones || {};
  const p = await getDoc(doc(db, "projects", perId));
  if (!p.exists()) throw new Error("No existe el grupo «" + perId + "»");
  const proy = p.data();
  // El escuadrón de quien toca: se busca por su nombre en el equipo docente. Si no aparece (un
  // referente que no imparte), la llamada va para todo el grupo.
  const priv = await getDoc(doc(db, "projects", perId, "privado", "stargate")).catch(() => null);
  const docentes = (priv && priv.exists() ? priv.data().docentes : (proy.stargate || {}).docentes) || [];
  const mio = docentes.filter(d => String(d.correo || "").toLowerCase() === yo.correo)[0];
  const nombre = o.comandante || (mio && mio.nombre) || yo.nombre || yo.correo;
  const faccion = (proy.factions || []).filter(f => f.teacherName === nombre)[0] || null;

  const ahora = new Date();
  const hasta = new Date(ahora.getTime() + Math.max(1, Number(minutos) || 60) * 60000);
  const ref = await addDoc(collection(db, LLAMADA), Object.assign({
    projectId: perId, teacherId: yo.uid, teacherDisplayName: nombre,
    startTime: ahora, endTime: hasta, active: true,
    pointsReward: o.xp == null ? 15 : Number(o.xp),
    coinsReward: o.creditos == null ? 30 : Number(o.creditos),
    autoReward: true
  }, faccion ? { restrictedFactionId: faccion.id } : {}));
  return { id: ref.id, hasta: hasta.getTime(), escuadron: faccion ? faccion.name : null,
           comandante: nombre, minutos: Math.max(1, Number(minutos) || 60) };
}

/** Cerrarla antes de tiempo. */
async function cerrarLlamada(sesionId) {
  await updateDoc(doc(db, LLAMADA, sesionId), { active: false, endTime: new Date() });
}

/**
 * Fichar. Los mismos pasos que hace GamificaPro, en el mismo orden:
 * comprobar facción → mirar que no hayas fichado hoy → dejar el registro → pedir el pago.
 */
async function ficharLlamada(perId, fichaId) {
  const yo = await sesion();
  if (!yo) throw new Error("Entra con tu cuenta");
  const s = await llamadaAbierta(perId);
  if (!s) throw new Error("La llamada a filas ya no está abierta.");
  const f = await getDoc(doc(db, "student_profiles", fichaId));
  if (!f.exists()) throw new Error("No encuentro tu ficha");
  const perfil = f.data();
  const restringe = typeof s.restrictedFactionId === "string" && s.restrictedFactionId.trim() !== "";
  if (restringe && (perfil.factionId ?? null) !== s.restrictedFactionId)
    throw new Error("Esta llamada es de otro escuadrón.");

  // Una vez al día: si ya fichaste hoy, no se cobra dos veces por estar en la misma clase.
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const previos = await getDocs(query(collection(db, FICHAJES),
    where("projectId", "==", perId), where("userId", "==", yo.uid)));
  const yaHoy = previos.docs.some(d => {
    const t = d.data().registeredAt;
    const f2 = t && t.toDate ? t.toDate() : new Date(t);
    return f2 >= hoy;
  });
  if (yaHoy) return { ok: true, repetido: true };

  await addDoc(collection(db, FICHAJES), {
    sessionId: s.id, projectId: perId, userId: yo.uid,
    studentProfileId: fichaId, registeredAt: new Date()
  });
  // 🔴 El servidor lee de la sesión lo que paga e ignora lo que le mandemos. Las cifras van aquí
  // solo porque la función las pide; quien manda es la sesión.
  await llamar("applyXpDelta", {
    projectId: perId, studentProfileId: fichaId, userId: yo.uid,
    deltaXp: Number(s.pointsReward || 15), deltaCoins: Number(s.coinsReward || 30),
    source: "attendance_session_auto_reward", sourceRefId: s.id,
    idempotencyKey: "xp_attendance_" + perId + "_" + s.id + "_" + yo.uid
  });
  return { ok: true, xp: Number(s.pointsReward || 15), creditos: Number(s.coinsReward || 30) };
}

/**
 * Quedarse a la escucha de la llamada de un grupo, EN DIRECTO.
 *
 * 🔴 Escucha, no pregunta cada X segundos. Con 200 alumnos en la Nave, preguntar cada diez segundos
 * son 1.200 lecturas por minuto por el gusto de enterarse tarde; escuchar es una conexión que avisa
 * en cuanto el docente pulsa. Devuelve la función para dejar de escuchar: sin llamarla, cambiar de
 * pestaña deja conexiones vivas de por vida.
 */
function vigilarLlamada(perId, alCambiar) {
  return onSnapshot(query(collection(db, LLAMADA),
    where("projectId", "==", perId), where("active", "==", true)),
    r => {
      const ahora = Date.now();
      const vivas = r.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(x => fin(x) > ahora).sort((a, b) => fin(b) - fin(a));
      alCambiar(vivas[0] || null);
    },
    () => alCambiar(null));
}

/**
 * ════════════ PREMIOS A MANO ════════════
 * Lo que el docente reparte en clase: unos xp por una intervención buena, unos créditos por ayudar,
 * una carta de regalo. No sustituye a los retos — los complementa: es la gasolina de la clase en
 * directo, y es lo que convierte «participar» en algo que pasa de verdad.
 */
async function premiar(perId, fichaId, { xp = 0, creditos = 0, motivo = "" } = {}) {
  const f = await getDoc(doc(db, "student_profiles", fichaId));
  if (!f.exists()) throw new Error("No encuentro la ficha");
  const d = f.data();
  await llamar("applyXpDelta", {
    projectId: perId, studentProfileId: fichaId, userId: d.userId,
    deltaXp: Number(xp) || 0, deltaCoins: Number(creditos) || 0,
    source: AJUSTE_DOCENTE, details: motivo || "Premio en clase"
  });
}

/**
 * Regalar una carta.
 *
 * 🔴 Va al inventario con el identificador de DOCUMENTO («grupo__cromo_x»), que es lo que guarda el
 * motor. Escribir la clave corta dejaría una carta que el álbum no sabría leer — justamente el fallo
 * que se arregló el 12-sep.
 */
async function regalarCromo(perId, fichaId, clave) {
  const f = await getDoc(doc(db, "student_profiles", fichaId));
  if (!f.exists()) throw new Error("No encuentro la ficha");
  const cat = window.SG_CATALOGO || {};
  const cromos = cat.cromos || [];
  if (!cromos.length) throw new Error("No tengo el catálogo de cartas");
  const elegido = clave
    ? cromos.filter(c => c.clave === clave)[0]
    : cromos[Math.floor(Math.random() * cromos.length)];
  if (!elegido) throw new Error("Esa carta no existe");
  const idDoc = perId + "__cromo_" + elegido.clave;
  await updateDoc(doc(db, "student_profiles", fichaId),
    { inventory: (f.data().inventory || []).concat([idDoc]) });
  return { clave: elegido.clave, nombre: elegido.nombre, rareza: elegido.rareza };
}

/** Quién ha fichado en una llamada, para verlo en directo desde el puesto de mando. */
async function fichajesDe(sesionId) {
  const r = await getDocs(query(collection(db, FICHAJES), where("sessionId", "==", sesionId)));
  return r.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.registeredAt?.toDate ? a.registeredAt.toDate() : new Date(a.registeredAt))
                  - (b.registeredAt?.toDate ? b.registeredAt.toDate() : new Date(b.registeredAt)));
}

window.SG = window.SG || {};
window.SG.MOTOR = { entrar, salir, sesion, leerPER, tablero, misPERs, sembrarPER, alistar, llamar,
                    guardarAjustes, otorgarReto, anularReto, traspasar, resolverVale,
                    llamadaAbierta, abrirLlamada, cerrarLlamada, ficharLlamada, fichajesDe, vigilarLlamada,
                    premiar, regalarCromo,
                    db, auth, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch };
document.dispatchEvent(new CustomEvent("sg:motor"));
