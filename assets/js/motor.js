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
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithCredential, signOut, onAuthStateChanged,
         connectAuthEmulator }
  from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, collection, query, where, getDocs, getCountFromServer, writeBatch, onSnapshot,
         connectFirestoreEmulator }
  from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getFunctions, httpsCallable, connectFunctionsEmulator }
  from "https://www.gstatic.com/firebasejs/12.1.0/firebase-functions.js";

/**
 * 🔴 EL LABORATORIO. Con esto, la batería 67 recorre la web entera contra el motor DE VERDAD —las
 * reglas de Firestore, las Cloud Functions, el mismo código que corre en producción— sin tocar
 * producción y sin ninguna cuenta real. Los emuladores de Firebase corren en la máquina de quien
 * prueba; aquí solo se les conecta.
 *
 * Tres cerrojos, y hacen falta los tres a la vez:
 *   1. la página se sirve desde 127.0.0.1 o localhost — en stargate.mistercuarter.es esto no existe;
 *   2. alguien ha puesto `window.SG_EMU = true` antes de cargar (lo hace la batería, por CDP);
 *   3. el proyecto pasa a llamarse `demo-stargate`. Firebase garantiza que un id que empieza por
 *      «demo-» NUNCA habla con servicios reales: si algún día se olvidara conectar un emulador, la
 *      petición fallaría contra un proyecto que no existe en vez de caer en el de verdad.
 *
 * Por qué no bastaba con el doble del motor de la batería 64: el doble contesta lo que yo le digo, y
 * así nunca iba a encontrar un fallo en una compra, un reto o una llamada a filas. Norberto lo
 * preguntó sin rodeos —«¿estás al 99 % de que no encontraré fallos tontos?»— y la respuesta honesta
 * era que no, precisamente por esto.
 */
const EMU = window.SG_EMU === true && /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
const CFG = EMU
  ? Object.assign({}, window.SG_FIREBASE || {}, { projectId: "demo-stargate", apiKey: "demo-api-key",
                                                  authDomain: "demo-stargate.firebaseapp.com" })
  : (window.SG_FIREBASE || {});
const app = initializeApp(CFG);
const auth = getAuth(app);
const db = getFirestore(app);
const fns = getFunctions(app);
const google = new GoogleAuthProvider();
// 🔴 El selector de cuentas SIEMPRE. Sin esto, Google entra en silencio con la última cuenta usada,
// y quien tiene dos —el profesorado prueba con la suya de docente y con una de alumno— acaba dentro
// con la equivocada sin saberlo. Norberto lo sufrió en su primera prueba.
google.setCustomParameters({ prompt: "select_account" });
if (EMU) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectFunctionsEmulator(fns, "127.0.0.1", 5001);
}

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
/**
 * Entrar como alguien, SIN ventana de Google: solo existe en el laboratorio. El emulador de Auth
 * acepta un «token de Google» que es un JSON sin firmar —en producción esto sería imposible, y por
 * eso esta función no se exporta fuera del laboratorio—. No hay contraseña ni cuenta real: la
 * identidad vive en la memoria del emulador y muere con él.
 */
async function entrarComo(correo, nombre) {
  if (!EMU) throw new Error("solo en el laboratorio");
  const sub = "emu-" + String(correo).toLowerCase().replace(/[^a-z0-9]/g, "");
  const cred = GoogleAuthProvider.credential(JSON.stringify({ sub, email: correo, email_verified: true, name: nombre || correo }));
  const r = await signInWithCredential(auth, cred);
  return r.user;
}
async function salir() {
  // La marca de docente se va con la sesión: si no, quien cierre sesión seguiría entrando en la
  // zona del profesorado desde ese navegador.
  try { localStorage.removeItem("sgEsDocente"); } catch (e) {}
  await signOut(auth);
}

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
const SEMANA_MS_ = 7 * 24 * 3600 * 1000;
/** Las dos cuentas que mandan siempre, leídas de donde viven (motor/paquete.js). */
const REFERENTES_VITALICIOS = ["n.cuartero.10@gmail.com", "mutecdgami@gmail.com"];
/** La misma cuenta que hace la sala del docente (clase.js `estadoPer`), en un solo sitio. */
function estadoDelPER(S) {
  S = S || {};
  const total = (S.tipo === "PUA") ? 10 : 15;
  let semana = null;
  if (S.inicio) {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    semana = Math.floor((hoy - new Date(S.inicio + "T00:00:00")) / SEMANA_MS_) + 1;
  }
  let estado;
  if (S.archivado) estado = "pasado";
  else if (semana == null) estado = "sin fecha";
  else if (semana < 1) estado = "por empezar";
  else estado = semana > total ? "pasado" : "en marcha";
  return { semana: semana, estado: estado, total: total, archivado: !!S.archivado };
}

async function misPERs(correo) {
  correo = String(correo || "").toLowerCase();
  const r = await getDocs(query(collection(db, "projects"), where("coTeacherEmails", "array-contains", correo)));
  // 🔴 Las facciones viajan con el grupo: la tarjeta necesita el EMBLEMA del escuadrón de quien mira
  // —«a golpe de vista se debe ver el nombre, su emblema de escuadrón, número de estudiantes
  // inscritos, semana»— y pedirlo aparte serían N lecturas más para pintar una lista.
  const mios = r.docs.map(d => ({ id: d.id, nombre: d.data().name, factions: d.data().factions || [],
                                  stargate: d.data().stargate || {}, codigo: d.data().joinCode || "" }))
                     .filter(x => x.stargate.version)
                     .map(x => Object.assign(x, estadoDelPER(x.stargate)));
  // 🔴 EN QUÉ SEMANA VA CADA GRUPO, decidido UNA vez y aquí.
  //
  // Sin esto, cada pantalla elegía «el grupo del docente» a su manera: la sala buscaba el que
  // estuviera en marcha, el aula y la llamada a filas cogían `GRUPOS[0]` —el primero que devolviera
  // Firestore, que no tiene ningún orden prometido—. Y eso no es un detalle de conveniencia:
  // en enero un docente tiene a la vez un grupo acabando y otro empezando, y abrir la llamada a
  // filas en el grupo equivocado no da ningún error. Simplemente los que están delante no pueden
  // fichar, y los que no están sí.
  //
  // Ordenados: primero los que están en marcha, luego los que van a empezar, y los pasados al
  // final. Así, cuando haya que elegir por defecto, el primero ya es el correcto.
  const ORDEN = { "en marcha": 0, "por empezar": 1, "sin fecha": 2, "pasado": 3 };
  mios.sort((a, b) => (ORDEN[a.estado] - ORDEN[b.estado]) || String(a.nombre||"").localeCompare(String(b.nombre||"")));

  /**
   * 🔴 ¿SOY REFERENTE DE ESTE GRUPO? Hasta hoy nadie lo preguntaba, y se notó: `crear.html` no
   * comprobaba nada, así que CUALQUIER docente podía sembrar grupos nuevos. Norberto lo pilló
   * entrando como profe normal: «me permite crear GRUPO, NO puede ser. Solo referente».
   *
   * Va aquí y no en cada pantalla porque el dato vive en `privado/stargate` —los correos del equipo
   * no son públicos— y esa lectura hay que hacerla una vez, no seis. Son como mucho ocho grupos.
   *
   * Ante un fallo de lectura se asume que NO eres referente: equivocarse hacia el lado de dar menos
   * permisos deja a alguien sin un botón; equivocarse al revés le deja crear grupos que no debería.
   */
  await Promise.all(mios.map(async x => {
    if (REFERENTES_VITALICIOS.indexOf(correo) >= 0) { x.soyReferente = true; return; }
    try {
      const pv = await getDoc(doc(db, "projects", x.id, "privado", "stargate"));
      const eq = (pv.exists() ? pv.data().docentes : null) || x.stargate.docentes || [];
      const yo = eq.filter(d => String(d.correo || "").toLowerCase() === correo)[0];
      x.soyReferente = !!(yo && yo.rol === "referente");
    } catch (e) { x.soyReferente = false; }
  }));
  // 🔴 La marca que abre la puerta del profesorado. Se pone AQUÍ porque este es el único sitio donde
  // el servidor ha dicho que sí: si devuelve grupos, esta cuenta es docente de alguno. No es una
  // contraseña —no se puede teclear— y se borra al salir.
  /**
   * CUÁNTA GENTE HAY EN CADA GRUPO. Es el dato que más se mira de un vistazo —«¿se han alistado ya?»
   * es LA pregunta de las dos primeras semanas— y no estaba en ninguna parte sin abrir el grupo.
   * Se cuenta con `getCountFromServer`, que no se trae las fichas: devuelve el número y ya. Con
   * doscientos alumnos por grupo, traerlas para contarlas sería absurdo.
   */
  await Promise.all(mios.map(async x => {
    try {
      const c = await getCountFromServer(query(collection(db, "student_profiles"),
                                               where("projectId", "==", x.id)));
      x.reclutas = c.data().count;
    } catch (e) { x.reclutas = null; }   // sin dato es mejor que un cero que parece verdad
  }));

  try { if (mios.length) localStorage.setItem("sgEsDocente", "1"); } catch (e) {}
  // 🔴 Y la que enciende «Crear grupo» en el menú. Se escribe SIEMPRE —también a "0"— para que
  // quien deje de ser referente no arrastre el botón de la sesión anterior.
  try { localStorage.setItem("sgEsReferente", mios.some(x => x.soyReferente) ? "1" : "0"); } catch (e) {}
  // 🔴 Y se AVISA. El menú se pinta con el HTML, mucho antes de que el servidor diga quién eres, así
  // que sin este aviso el referente no veía «Crear grupo» hasta recargar la página — y nadie recarga
  // para ver si aparece un botón que no sabe que existe.
  try { document.dispatchEvent(new CustomEvent("sg:rol")); } catch (e) {}
  return mios;
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
  // 🔴 Devuelve TAMBIÉN el código de acceso. Si solo devolviera el id, la consola daría el enlace de
  // alistamiento sin él y nadie podría entrar — el referente repartiría una puerta cerrada.
  return { id: id, codigo: paq.proyecto.joinCode || "" };
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
  /**
   * 🔴 12-sep · AHORA LO HACE EL SERVIDOR (`stargateAnularReto`), y para los dos casos.
   *
   * Antes esto llamaba a `applyXpDelta` con el origen del docente y luego escribía
   * `completedMissionIds` desde el navegador. Para un DOCENTE funcionaba. Para un ALUMNO —que lo
   * usa en «↩︎ No lo he hecho todavía»— las dos cosas eran imposibles: el servidor rechaza ese
   * origen a quien no es docente y las reglas le prohíben tocar su propia economía. El botón que
   * Norberto marcó como IMPORTANTE fallaba siempre. Lo destapó el laboratorio.
   *
   * Y de paso cierra la trampa «marcar → cobrar → gastar → deshacer»: el alumno solo puede deshacer
   * mientras conserve los créditos del reto. El servidor devuelve cuánto no pudo retirar cuando
   * anula un docente, para que la consola se lo diga.
   */
  try {
    return await llamar("stargateAnularReto", { projectId: perId, studentProfileId: fichaId, retoId: retoId,
                                                motivo: motivo || "" });
  } catch (e) {
    // 🔴 PLAN B mientras la función no esté desplegada en producción: el camino viejo, que para un
    // DOCENTE funciona (a un alumno el servidor se lo seguirá negando, como hasta hoy). Sin esto,
    // subir la web antes que la función le rompería al profesorado su «quitar reto».
    const falta = /not-found|unimplemented|internal|does not exist/i.test(String((e && (e.code || "")) + " " + (e && e.message)));
    if (!falta) throw e;
    return anularRetoViejo(perId, fichaId, retoId, motivo);
  }
}
async function anularRetoViejo(perId, fichaId, retoId, motivo) {
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
  return { ok: true };
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
    autoReward: true,
    // 🔴 El regalo se guarda EN LA SESIÓN, no se decide al fichar. Así todo el mundo recibe lo
    // mismo —lo eligió el docente al abrirla— y quien llega tarde no se lleva algo distinto.
    stargateRegalo: String(o.regalo || "")
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
  /**
   * ════════ LA RACHA ════════
   *
   * Norberto: «quiero premiar la asistencia y la constancia. Cada vez que sea una racha seguida se
   * suman 5 créditos con límite de 25 extra».
   *
   * 🔴 Y sale casi gratis: `previos` ya está leído arriba para no cobrar dos veces el mismo día.
   * Solo falta saber QUÉ sesiones ha habido, que son una por clase (~20 en todo el curso), para
   * poder contar hacia atrás. Una consulta más, y solo cuando alguien ficha.
   *
   * 🔴 Créditos, NUNCA xp. También lo dijo él y tiene razón: los xp marcan el nivel y el puesto en
   * el ranking, así que premiar la asistencia con xp enturbiaría la puntuación de lo aprendido con
   * lo de haber venido. Los créditos son dinero: se gastan y no ordenan a nadie.
   *
   * La cuenta: 1ª seguida +0, 2ª +5, 3ª +10… hasta +25 y ahí se queda. Perder una clase devuelve
   * a cero, que es justo lo que hace que una racha signifique algo.
   */
  /**
   * ════════ LA RACHA Y EL REGALO, EN EL SERVIDOR ════════
   *
   * Norberto: «quiero premiar la asistencia y la constancia. Cada vez que sea una racha seguida se
   * suman 5 créditos con límite de 25 extra». Y el sobre de cromos, si el docente lo marcó.
   *
   * 🔴 12-sep · ANTES LOS PAGABA ESTE NAVEGADOR, Y NO PODÍA. La racha iba por `applyXpDelta` con el
   * origen del docente —el servidor se lo niega a un alumno— y el sobre escribía `inventory` —las
   * reglas se lo niegan—. Las dos cosas estaban dentro de un `try` que convertía el rechazo en «+0»
   * y «sin regalo»: el alumno veía su fichaje correcto y los extras no llegaban NUNCA, sin un solo
   * aviso. Lo destapó el laboratorio. Ahora lo decide `stargateAsistencia`, que lee del servidor
   * cuántas llamadas seguidas llevas y paga una sola vez por sesión, pulses lo que pulses.
   *
   * El regalo llega como un sobre en el inventario; se abre aquí mismo, carta a carta y EN SERIE,
   * igual que uno comprado (tres `consumeItem` a la vez se pisarían la última escritura).
   */
  let racha = 1, extra = 0, regalo = null;
  try {
    const r = await llamar("stargateAsistencia", { projectId: perId, sessionId: s.id });
    racha = Number(r.racha || 1); extra = Number(r.extra || 0);
    if (r.regalo && r.regalo.rewardId) {
      regalo = [];
      for (let i = 0; i < Number(r.regalo.usos || 1); i++) {
        try {
          const c = await llamar("consumeItem", { projectId: perId, rewardId: r.regalo.rewardId, studentProfileId: fichaId });
          const b = c && (c.botin || c.obtenido);
          // la pantalla de la Nave espera {clave, nombre, rareza}; el servidor devuelve el id de la
          // carta en cadena. Sin traducirlo, la celebración pedía «undefined_carta.png».
          if (b) regalo.push(cartaDeBotin(b));
        } catch (e) { break; }   // lo que no se abra se queda en el inventario, para abrirlo en el álbum
      }
    }
  } catch (e) { /* el fichaje ya está hecho y pagado: los extras nunca pueden tumbarlo */ }

  return { ok: true, xp: Number(s.pointsReward || 15), creditos: Number(s.coinsReward || 30),
           racha: racha, extra: extra, regalo: regalo };
}

/** Firestore devuelve Timestamp; de una exportación puede llegar cadena o número. */
function fechaDe(t) {
  if (!t) return null;
  const d = t && t.toDate ? t.toDate() : new Date(t);
  return isNaN(d.getTime()) ? null : d;
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
 * DAR DE BAJA a alguien del grupo.
 *
 * 🔴 Hace falta, y no por capricho: alguien se alista en el grupo equivocado, alguien entra con la
 * cuenta que no era y se crea una ficha huérfana, o se cuela quien no debía. Sin esto, la única
 * salida era dejarlo ahí para siempre ensuciando el ranking.
 *
 * 🔴 Borra la ficha y su expediente privado, y NO toca el libro de experiencia: ahí queda el rastro
 * de lo que se le dio y se le quitó. Borrar el rastro contable por borrar una ficha sería perder la
 * única prueba de lo que pasó.
 */
async function darDeBaja(perId, fichaId) {
  const f = await getDoc(doc(db, "student_profiles", fichaId));
  if (!f.exists()) throw new Error("Esa ficha ya no está");
  if (f.data().projectId !== perId) throw new Error("Esa ficha no es de este grupo");
  try { await deleteDoc(doc(db, "student_profiles", fichaId, "privado", "datos")); } catch (e) {}
  await deleteDoc(doc(db, "student_profiles", fichaId));
}

/** Cambiar el código de acceso del grupo. Se usa cuando se ha corrido más de la cuenta. */
/**
 * ════════════ AÑADIR A ALGUIEN AL EQUIPO DOCENTE ════════════
 *
 * 🔴 Faltaba, y se iba a notar en la primera semana: el equipo se fijaba al CREAR el grupo y no
 * había forma de tocarlo después. Un docente que se incorpora a mitad de curso, un cambio de última
 * hora, un co-referente — todo eso obligaba a volver a sembrar el grupo entero.
 *
 * Se escribe en los DOS sitios porque cada uno lo mira alguien distinto:
 *   · `coTeacherEmails` lo mira FIRESTORE, y es lo que decide si esa cuenta puede entrar.
 *   · `privado.docentes` lo mira la INTERFAZ, y es de donde salen el nombre y el rol.
 * Escribir solo en uno da un fallo mudo de los peores: o entra y no aparece por ningún lado, o
 * aparece en las listas y no puede entrar.
 *
 * No crea escuadrón. Quien se incorpora tarde recoge alumnado desde «pasar de un docente a otro»,
 * que ya existe; inventarle un escuadrón vacío a mitad de curso solo ensucia el ranking.
 */
async function anadirDocente(perId, persona) {
  const correo = String(persona && persona.correo || "").toLowerCase().trim();
  if (!correo || correo.indexOf("@") < 0) throw new Error("Hace falta un correo válido.");
  const nombre = String(persona && persona.nombre || "").trim() || correo.split("@")[0];
  const rol = persona && persona.rol === "referente" ? "referente" : "docente";

  const ref = doc(db, "projects", perId);
  const p = await getDoc(ref);
  if (!p.exists()) throw new Error("No existe ese grupo.");
  const correos = Array.isArray(p.data().coTeacherEmails) ? p.data().coTeacherEmails.slice() : [];
  if (correos.indexOf(correo) < 0) correos.push(correo);

  const pref = doc(db, "projects", perId, "privado", "stargate");
  const pv = await getDoc(pref);
  const priv = pv.exists() ? pv.data() : { docentes: [] };
  const docentes = Array.isArray(priv.docentes) ? priv.docentes.slice() : [];
  const i = docentes.findIndex(d => String(d.correo || "").toLowerCase() === correo);
  if (i >= 0) docentes[i] = Object.assign({}, docentes[i], { nombre, rol });
  else docentes.push({ nombre, correo, rol, panel: "" });

  await updateDoc(ref, { coTeacherEmails: correos });
  await setDoc(pref, Object.assign({}, priv, { docentes }), { merge: true });
  return { correo, nombre, rol };
}

/**
 * ════════════ CO-REFERENTE DE TODO ════════════
 *
 * 🔴 «De forma general» no puede ser una casilla en un ajuste suelto, y la razón es la misma que la
 * del referente vitalicio: `misPERs` pregunta a FIRESTORE por los grupos donde tu correo está en
 * `coTeacherEmails`. Una marca global guardada en otro sitio no le haría ver ni un grupo — vería
 * «esta cuenta no lleva ningún grupo» con todos los permisos del mundo.
 *
 * Así que «general» significa: se escribe en CADA grupo, uno por uno. Devuelve en cuáles ha podido
 * y en cuáles no, porque con varios grupos algo puede fallar a mitad y callarlo sería peor que el
 * fallo: creerías que alguien tiene acceso a ocho grupos cuando lo tiene a seis.
 */
async function referenteEnTodos(persona, perIds) {
  const hechos = [], fallos = [];
  for (const id of perIds) {
    try { await anadirDocente(id, Object.assign({}, persona, { rol: "referente" })); hechos.push(id); }
    catch (e) { fallos.push({ per: id, error: e.message }); }
  }
  return { hechos, fallos };
}

/**
 * ════════ LOS HUEVOS DE PASCUA ════════
 *
 * Norberto: «me encantaría esconder un huevo de Pascua en cada presentación. Si el estudiante lo
 * encuentra gana un sobre de cromos, un avatar o una bolsa de dinero».
 *
 * 🔴 Y preguntó bien la parte difícil: «¿tendría que crear una recompensa por presentación y
 * limitar a 1 por persona? ¿O una semanal, pero entonces uno podría reclamar la misma cada semana
 * sin encontrar el resto?». Las dos opciones tienen el mismo fallo: atan el límite a la RECOMPENSA,
 * y lo que hay que contar no es cuántos premios se lleva alguien — es CUÁNTOS HUEVOS DISTINTOS ha
 * encontrado.
 *
 * Así que el límite va en el HUEVO, no en el premio:
 *   · cada escondite tiene su id (`p1`, `p2`… uno por presentación) y viaja en el enlace;
 *   · el perfil guarda qué huevos ha abierto ya (`stargateHuevos`);
 *   · el premio es solo una consecuencia, y se puede repetir entre huevos sin problema.
 *
 * Con esto sobra crear ocho recompensas, y reclamar dos veces el mismo escondite es imposible
 * aunque el enlace circule por WhatsApp: el segundo intento ve su propia marca y no paga.
 */
/**
 * EN QUÉ GRUPO ESTÁ ESTA PERSONA.
 *
 * 🔴 Esto es lo que permite que el enlace del huevo NO lleve el grupo dentro — y por tanto que se
 * monte UNA vez por presentación y valga para todos los grupos y todos los años. Es la misma idea
 * que ya usan la llamada a filas y validar retos: el grupo se deduce de quién pulsa.
 *
 * Las fichas se buscan por `userId`, que es lo que ata a una persona con su expediente, y no por
 * correo: alguien puede cambiarse el correo visible, pero no su identidad de Google.
 */
async function misGruposDeAlumno(uid) {
  const r = await getDocs(query(collection(db, "student_profiles"), where("userId", "==", uid)));
  const fichas = r.docs.map(d => ({ ficha: d.id, per: d.data().projectId })).filter(x => x.per);
  // El nombre del grupo, para que la pantalla de «¿cómo entras hoy?» diga «PRUEBA HUMANA» y no
  // «prueba-humana». Son una o dos lecturas: nadie está alistado en diez grupos a la vez.
  // Y solo grupos de STARGATE: una ficha de GamificaPro en otro proyecto no es una Nave.
  const nombres = await Promise.all(fichas.map(f => getDoc(doc(db, "projects", f.per))
    .then(p => (p.exists() && (p.data().stargate || {}).version) ? (p.data().name || f.per) : null)
    .catch(() => null)));
  return fichas.map((f, i) => Object.assign(f, { nombreGrupo: nombres[i] })).filter(f => f.nombreGrupo);
}

/**
 * BUSCAR UN GRUPO POR SU CÓDIGO DE CLASE, sin saber cuál es.
 *
 * 🔴 Esta es la pieza que faltaba para la puerta única. Hasta ahora el código solo se COMPROBABA:
 * `alistarse.html?per=X&codigo=Y` ya sabía a qué grupo iba y solo miraba si la clave cuadraba. Pero
 * Norberto quiere que el código sea la puerta de verdad — «una vez iniciada sesión, si no detecta
 * usuario, le pide introducir código de clase» —, y para eso el código tiene que ENCONTRAR el
 * grupo, no confirmarlo.
 *
 * Por qué se puede preguntar desde el navegador: la regla de `projects` es `allow read: if
 * isSignedIn()`, la misma por la que `misPERs` busca los grupos de un docente por su correo. Solo
 * se llega aquí con sesión abierta, así que quien pregunta ya tiene nombre.
 *
 * Y por qué no es un agujero: el código no da acceso a nada. Da de alta en un grupo, que es
 * exactamente lo que hace hoy el enlace de alistamiento que el docente reparte en clase — solo que
 * sin tener que llevar el id del grupo pegado en la URL.
 */
async function grupoPorCodigo(codigo) {
  const c = String(codigo || "").trim().toUpperCase();
  if (!c) return null;
  const r = await getDocs(query(collection(db, "projects"), where("joinCode", "==", c)));
  const g = r.docs.map(d => ({ id: d.id, nombre: d.data().name, stargate: d.data().stargate || {} }))
                  .filter(x => x.stargate.version)[0];
  return g || null;
}

async function huevosDe(perId) {
  const p = await getDoc(doc(db, "projects", perId));
  return ((p.exists() ? p.data().stargate : null) || {}).huevos || [];
}

/**
 * ════════ LOS ESCONDITES, EN EL SERVIDOR ════════
 *
 * 🔴 12-sep · LA PRIMERA VERSIÓN LOS COBRABA EL NAVEGADOR DEL ALUMNO, Y NO PODÍA. Marcaba el escondite
 * en su ficha y luego se pagaba el premio: el sobre escribiendo `inventory`, la bolsa con
 * `applyXpDelta` en nombre del docente. Las reglas y el servidor —con razón— se lo niegan a un
 * alumno. Resultado: el escondite quedaba MARCADO como encontrado y el premio no llegaba nunca. Y
 * el tope «solo los tres primeros» se contaba en el navegador, así que dos pulsando a la vez se
 * colaban los dos. Lo destapó el laboratorio.
 *
 * El principio no cambia —el límite va en el ESCONDITE, no en el premio—, pero ahora cada escondite
 * ES una recompensa de GamificaPro con reclamación por enlace (`claimLinkedReward`, ya desplegada):
 *   · una por persona (`claimLinkMaxPerUser: 1`): el mismo enlace no paga dos veces;
 *   · el tope total, si lo hay (`claimLinkMaxTotal`), dentro de una TRANSACCIÓN del servidor;
 *   · y el tope por escuadrón (`claimLinkMaxPerSquad`) — «los tres primeros de cada clase», lo que
 *     Norberto pidió como «límite por grupo»;
 *   · el premio va DENTRO: un consumible con el mismo cofre que el sobre o el héroe de la tienda, o
 *     con `addCoins` si es una bolsa. Se abre con `consumeItem`, como cualquier cosa comprada.
 *
 * La lista que edita el referente sigue siendo `stargate.huevos` —una sola fuente—, y cada vez que
 * se guarda se regeneran sus recompensas. `inStore: false`: no aparecen en el Mercado.
 */
const idPremioHuevo = (perId, huevoId) => window.SG.PAQUETE.idPremioHuevo(perId, huevoId);

async function guardarHuevos(perId, lista) {
  // el cofre del sobre y el del héroe se copian de la tienda del grupo: mismo sorteo, mismas cartas
  const premios = await getDocs(query(collection(db, "rewards"), where("projectId", "==", perId)));
  const conCofre = premios.docs.map(d => ({ id: d.id, ...d.data() }))
                              .filter(r => r.consumeEffects && r.consumeEffects.lootBox);
  const sobre = conCofre.find(r => r.stargateTipo === "cromo");
  const heroe = conCofre.find(r => r.stargateTipo === "heroe");
  const antes = await huevosDe(perId);

  const lote = writeBatch(db);
  lista.forEach(h => {
    lote.set(doc(db, "rewards", idPremioHuevo(perId, h.id)), window.SG.PAQUETE.premioDeHuevo(perId, h, sobre, heroe), { merge: true });
  });
  // los que se han quitado de la lista se CIERRAN (borrar lo puede solo el dueño principal del grupo)
  antes.filter(a => !lista.some(h => String(h.id) === String(a.id))).forEach(a => {
    lote.set(doc(db, "rewards", idPremioHuevo(perId, a.id)), { claimLinkEnabled: false, stargateBorrado: true }, { merge: true });
  });
  lote.update(doc(db, "projects", perId), { "stargate.huevos": lista });
  await lote.commit();
  return lista;
}

/**
 * Reclamar un escondite. Devuelve qué ha tocado, o por qué no — con palabras, no con códigos.
 */
async function reclamarHuevo(perId, huevoId, fichaId) {
  const yo = await sesion();
  if (!yo) throw new Error("Entra con tu cuenta para reclamarlo");
  const rid = idPremioHuevo(perId, huevoId);
  const [r, f] = await Promise.all([getDoc(doc(db, "rewards", rid)), getDoc(doc(db, "student_profiles", fichaId))]);
  if (!r.exists() || r.data().stargateBorrado) throw new Error("Este escondite no existe en tu grupo.");
  if (!f.exists()) throw new Error("No encuentro tu ficha");
  const R = r.data(), H = R.stargateHuevo || {};
  if (((f.data().linkedRewardClaims || {})[rid] || 0) >= 1) return { yaEra: true, premio: H.premio };
  if (R.claimLinkEnabled === false) throw new Error("Este escondite ya está cerrado.");

  try {
    await llamar("claimLinkedReward", { rewardId: rid, modo: "item" });
  } catch (e) {
    const m = String((e && e.message) || "");
    if (/SOLD_OUT|resource-exhausted/i.test(m + " " + (e && e.code)))
      throw new Error("Llegaste tarde: este ya lo encontraron " + (R.claimLinkMaxTotal || "todas las") + " personas que podían.");
    if (/límite de reclamos/i.test(m)) return { yaEra: true, premio: H.premio };
    throw new Error(m.replace(/^Lo siento, /, "") || "No he podido reclamarlo.");
  }
  // Y se abre en el momento: es un regalo, no un paquete que haya que ir a buscar al álbum.
  const usos = Math.max(1, Number(R.maxUses || 1)), sacadas = [];
  let abiertos = 0;
  for (let i = 0; i < usos; i++) {
    try {
      const c = await llamar("consumeItem", { projectId: perId, rewardId: rid, studentProfileId: fichaId });
      abiertos++;
      const b = c && (c.botin || c.obtenido);
      if (b) sacadas.push(b);
    } catch (e) { break; }   // lo que no se abra queda en el inventario y se abre desde el álbum
  }
  let detalle = null;
  if (H.premio === "sobre") detalle = { tipo: "sobre", cartas: sacadas.map(cartaDeBotin) };
  else if (H.premio === "heroe") {
    const b = sacadas[0] ? cartaDeBotin(sacadas[0]) : null;
    detalle = { tipo: "heroe", nombre: b ? b.nombre : "", clave: b ? b.clave : "" };
  } else if (H.premio === "bolsa") detalle = { tipo: "bolsa", creditos: Number(H.cantidad || H.creditos || 50) };
  else if (H.premio === "xp") detalle = { tipo: "xp", xp: Number(H.cantidad || 100) };
  // 🔴 Si no se ha podido abrir, se dice: el premio está en su inventario y se abre desde la Nave. Lo
  // contrario —«+50 ◈, ya está en tu cuenta» con el saldo quieto— es lo que pasó la primera vez.
  if (usos > 0 && !abiertos) detalle = Object.assign({}, detalle || {}, { sinAbrir: true });
  return { ok: true, premio: H.premio, detalle: detalle, nombre: R.title || "" };
}

/** Lo que devuelve un cofre, dicho como lo espera la pantalla del escondite: {clave, nombre, rareza}. */
function cartaDeBotin(b) {
  // `consumeItem` devuelve el botín como el ID de la recompensa, en cadena («grupo__cromo_P1_bran»)
  const id = typeof b === "string" ? b : String((b && (b.rewardId || b.id)) || "");
  const clave = id.split("__").pop().replace(/^(cromo|heroe)_/, "");
  const cat = window.SG_CATALOGO || {};
  const x = (cat.cromos || []).concat(cat.heroes || []).find(c => c.clave === clave) || {};
  const tipo = id.split("__").pop().indexOf("heroe_") === 0 ? "heroe" : "cromo";
  return { clave: clave, tipo: tipo, nombre: x.nombre || (b && (b.title || b.nombre)) || clave, rareza: x.rareza || "" };
}

async function nuevoCodigo(perId) {
  const c = window.SG.PAQUETE.codigoNuevo();
  await updateDoc(doc(db, "projects", perId), { joinCode: c });
  return c;
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
/**
 * 🔴 AL AZAR, PERO RESPETANDO LAS RAREZAS. Regalar elegía con `Math.random()` uniforme: la
 * legendaria de Ander —una de cada cien en la tienda— caía igual de fácil que un tripulante común.
 * Eso no es un detalle: la rareza es TODO el valor de una colección, y un regalo que la ignora
 * devalúa las cartas que alguien lleva semanas persiguiendo.
 * El peso ya está en el catálogo; solo había que usarlo.
 */
function alAzarPorPeso(lista) {
  const total = lista.reduce((a, c) => a + (Number(c.peso) || 1), 0);
  let n = Math.random() * total;
  for (const c of lista) { n -= (Number(c.peso) || 1); if (n <= 0) return c; }
  return lista[lista.length - 1];
}

/** Varias de golpe, para el regalo de la asistencia: un sobre son tres. */
async function regalarSobre(perId, fichaId, cuantas) {
  const f = await getDoc(doc(db, "student_profiles", fichaId));
  if (!f.exists()) throw new Error("No encuentro la ficha");
  const cromos = (window.SG_CATALOGO || {}).cromos || [];
  if (!cromos.length) throw new Error("No tengo el catálogo de cartas");
  const sacadas = [], inv = (f.data().inventory || []).slice();
  for (let i = 0; i < (cuantas || 3); i++) {
    const c = alAzarPorPeso(cromos);
    inv.push(perId + "__cromo_" + c.clave);
    sacadas.push({ clave: c.clave, nombre: c.nombre, rareza: c.rareza });
  }
  // 🔴 Una sola escritura con las tres dentro. Tres `updateDoc` seguidos sobre el mismo documento
  // se pisan entre sí: se guardaría la última y se perderían dos cartas regaladas.
  await updateDoc(doc(db, "student_profiles", fichaId), { inventory: inv });
  return sacadas;
}

async function regalarCromo(perId, fichaId, clave) {
  const f = await getDoc(doc(db, "student_profiles", fichaId));
  if (!f.exists()) throw new Error("No encuentro la ficha");
  const cat = window.SG_CATALOGO || {};
  const cromos = cat.cromos || [];
  if (!cromos.length) throw new Error("No tengo el catálogo de cartas");
  const elegido = clave ? cromos.filter(c => c.clave === clave)[0] : alAzarPorPeso(cromos);
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
if (EMU) window.SG.EMU = { entrarComo };
window.SG.MOTOR = { entrar, salir, sesion, leerPER, tablero, misPERs, sembrarPER, alistar, llamar,
                    guardarAjustes, otorgarReto, anularReto, traspasar, resolverVale,
                    llamadaAbierta, abrirLlamada, cerrarLlamada, ficharLlamada, fichajesDe, vigilarLlamada,
                    premiar, regalarCromo, regalarSobre, darDeBaja, nuevoCodigo,
                    huevosDe, guardarHuevos, reclamarHuevo, misGruposDeAlumno, grupoPorCodigo,
                    anadirDocente, referenteEnTodos,
                    db, auth, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch };
document.dispatchEvent(new CustomEvent("sg:motor"));
