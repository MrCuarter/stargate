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
         deleteField, connectFirestoreEmulator }
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
  try { localStorage.removeItem("sgEsDocente"); localStorage.removeItem("sgEsRecluta"); } catch (e) {}
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
/** Las dos cuentas que mandan siempre, leídas de donde viven (motor/paquete.js). */
const REFERENTES_VITALICIOS = ["n.cuartero.10@gmail.com", "mutecdgami@gmail.com"];
/** La misma cuenta que hace la sala del docente (clase.js `estadoPer`), en un solo sitio. */
function estadoDelPER(S) {
  S = S || {};
  // 15-sep · del catálogo (PUA 8, regular 15): aquí ponía 10 para el PUA, y un PUA salía «de 10 semanas» y seguía
  // «en marcha» dos semanas después de acabar
  const sem = ((window.SG_CATALOGO || {}).semanas) || {};
  const total = (S.tipo === "PUA") ? (sem.PUA || 8) : (sem.REGULAR || 15);
  let semana = null;
  // con las semanas congeladas del calendario del referente (motor/semanas.js)
  if (S.inicio) semana = window.SGSEMANAS.semanaDelCurso(S.inicio, S.pausas);
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
                                  stargate: d.data().stargate || {}, codigo: d.data().joinCode || "",
                                  // 19-sep · para «Archivar o borrar» desde Mis grupos: borrar es de quien lo creó (o un vitalicio)
                                  ownerId: d.data().ownerId || "", teacherId: d.data().teacherId || "" }))
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
    const vitalicio = REFERENTES_VITALICIOS.indexOf(correo) >= 0;
    try {
      const pv = await getDoc(doc(db, "projects", x.id, "privado", "stargate"));
      const eq = (pv.exists() ? pv.data().docentes : null) || x.stargate.docentes || [];
      const yo = eq.filter(d => String(d.correo || "").toLowerCase() === correo)[0];
      x.soyReferente = vitalicio || !!(yo && yo.rol === "referente");
      // 15-sep · el equipo de cada grupo (quién y con qué rol): «Equipo docente» dice en qué otros grupos está cada uno
      x.equipo = eq.map(d => ({ nombre: d.nombre || "", correo: String(d.correo || "").toLowerCase(), rol: d.rol || "docente" }));
      // 14-sep · cómo se llama en ESTE grupo (el nombre que llevan las fichas de su escuadrón en «profe»):
      // la sesión proyectada lo usa para enseñar SU escuadrón y SUS tickets de salida
      x.miNombre = (yo && yo.nombre) || "";
    } catch (e) { x.soyReferente = vitalicio; x.miNombre = ""; }
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
    // 15-sep · y las subidas de nota que esperan (Norberto: «que brille cuando hay algo pendiente»)
    try {
      const v = await getCountFromServer(query(collection(db, "purchased_vouchers"),
                                               where("projectId", "==", x.id), where("status", "==", "pending")));
      x.cola = v.data().count;
    } catch (e) { x.cola = 0; }
  }));

  try { if (mios.length) localStorage.setItem("sgEsDocente", "1"); } catch (e) {}
  // 🔴 Y la que enciende «Crear grupo» en el menú. Se escribe SIEMPRE —también a "0"— para que
  // quien deje de ser referente no arrastre el botón de la sesión anterior.
  // (15-sep · también quien está en el registro de referentes, aunque aún no lleve ningún grupo)
  const refGlobal = mios.some(x => x.soyReferente) || await referenteGlobal(correo);
  try { localStorage.setItem("sgEsReferente", refGlobal ? "1" : "0"); } catch (e) {}
  // 15-sep · y su conexión, para la página de Profesores del Mando (una vez por sesión del navegador)
  if (mios.length || refGlobal) anotarConexion().catch(() => {});
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
 * ¿LO LLEVA YA ALGUIEN DEL GRUPO? Norberto (13-sep): «dos estudiantes NO pueden tener el mismo alias;
 * si un estudiante escoge un alias en uso, el sistema lo rechaza, PUNTO». Sin mayúsculas ni tildes:
 * «halo» y «Haló» son el mismo. Lo usan los dos sitios donde se pone un alias: el alistamiento y la
 * corrección de la ficha desde el puesto de mando. `excepto` es quien lo pide (su propia ficha no cuenta).
 */
const aliasPlano = t => String(t || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
/**
 * LA CLAVE DE LA RESERVA: la MISMA cuenta que hacen las reglas de Firestore (`aliasClave` en
 * firestore.rules de GamificaPro). Si no coincidiera letra por letra, el servidor rechazaría la
 * reserva. Las reglas son quienes lo hacen cumplir: el alias reservado no se puede repetir.
 */
// 🔴 13-sep · `lower()` de las reglas SOLO baja la A-Z (la «Ó» de «Olga Órbita» se quedaba en
// mayúscula y la clave no coincidía: esa alumna no podía alistarse). Así que aquí se baja también
// solo la A-Z, y las tildes se quitan en mayúscula y en minúscula, igual que en las reglas.
const aliasClave = a => String(a || "").replace(/[A-Z]+/g, m => m.toLowerCase()).trim()
  .replace(/[áàäâãÁÀÄÂÃ]/g, "a").replace(/[éèëêÉÈËÊ]/g, "e").replace(/[íìïîÍÌÏÎ]/g, "i")
  .replace(/[óòöôõÓÒÖÔÕ]/g, "o").replace(/[úùüûÚÙÜÛ]/g, "u").replace(/[ñÑ]/g, "n").replace(/[çÇ]/g, "c")
  .replace(/\//g, "-").replace(/ +/g, " ");
const refAlias = (perId, alias) => doc(db, "stargate_alias", perId + "__" + aliasClave(alias));
/**
 * Reserva el alias para `uid` DENTRO del lote que escribe la ficha (las reglas lo exigen así). Si ya
 * es suyo (vuelve a alistarse, o se corrige la ficha a lo mismo) no hace falta escribirlo; si es de
 * otro, se para con palabras.
 */
async function reservarAlias(lote, perId, uid, alias) {
  const r = await getDoc(refAlias(perId, alias)).catch(() => null);
  if (r && r.exists()) {
    if (r.data().uid === uid) return;
    throw new Error("«" + alias + "» ya lo lleva alguien de tu grupo. Elige otro alias (o pulsa el dado para que te sugiera uno).");
  }
  lote.set(refAlias(perId, alias), { projectId: perId, uid: uid, alias: String(alias), creado: Date.now() });
}
async function aliasOcupado(perId, alias, excepto) {
  const e = excepto || {};
  const r = await getDocs(query(collection(db, "student_profiles"), where("projectId", "==", perId)));
  const otro = r.docs.find(d => d.id !== e.ficha && (!e.uid || d.data().userId !== e.uid)
                                && aliasPlano(d.data().displayName) === aliasPlano(alias));
  return otro ? String(otro.data().displayName || alias) : null;
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

  /**
   * 🔴 13-sep · UN ALIAS, UNA PERSONA. Nada impedía que dos reclutas del mismo grupo se llamaran
   * igual, y la Nave averiguaba «cuál de las filas del tablero soy yo» POR EL ALIAS: el segundo
   * «Halo» veía la Nave del primero —su experiencia, sus héroes— sin que nadie se enterara. Lo
   * destapó el laboratorio. La Nave ya empareja por la ficha; y aquí se pide otro alias, porque en
   * el ranking dos «Halo» tampoco se distinguen. Sin mayúsculas ni tildes: «halo» y «Haló» son el mismo.
   */
  if (await aliasOcupado(perId, datos.alias, { uid: yo.uid }))
    throw new Error("«" + datos.alias + "» ya lo lleva alguien de tu grupo. Elige otro alias (o pulsa el dado para que te sugiera uno).");

  avisa("Abriendo tu ficha…");
  const ficha = doc(collection(db, "student_profiles"));
  // 🔴 la ficha y la reserva de su alias van JUNTAS: las reglas no dejan una sin la otra
  const datosFicha = {
    userId: yo.uid, projectId: perId, displayName: datos.alias,
    totalPoints: 0, coins: 0, inventory: [], earnedBadges: [],
    completedMissionIds: [], completedCampaignIds: [], currentPhase: 1, role: "student",
    hubCustomization: {}, createdAt: Date.now(),
    squadId: escuadron ? escuadron.id : null, factionId: escuadron ? escuadron.id : null,
    stargateProfe: datos.comandante || "", stargateAvatar: datos.avatar || null,
    stargateBio: datos.bio || ""
  };
  const lote = writeBatch(db);
  await reservarAlias(lote, perId, yo.uid, datos.alias);
  lote.set(ficha, datosFicha);
  try { await lote.commit(); }
  catch (e) {
    if (!/permission|insufficient/i.test(String(e && (e.code || e.message)))) throw e;
    // dos personas pulsando a la vez con el mismo alias: el servidor deja pasar a una sola
    if (await aliasOcupado(perId, datos.alias, { uid: yo.uid }))
      throw new Error("«" + datos.alias + "» ya lo lleva alguien de tu grupo. Elige otro alias (o pulsa el dado para que te sugiera uno).");
    // 🔴 servidor con las reglas de ANTES del registro de alias (el despliegue de la web y el de las
    // reglas no son el mismo segundo): ahí la reserva no existe y la ficha va sola, como siempre.
    // Con las reglas nuevas esto no pasa nunca: una ficha sin su reserva la rechazan.
    await setDoc(ficha, datosFicha);
  }

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

/**
 * EL CALENDARIO DEL REFERENTE (13-sep): el grupo (semana 1, semanas congeladas, capítulos abiertos
 * antes y los cierres) y las fechas que cuelgan de la semana —planetas y Mercado—, en UNA escritura:
 * o se mueve todo o no se mueve nada. Nunca un grupo con el cierre nuevo y el Mercado viejo.
 * `escribir`: [[colección, id, campos], …] (la consola solo manda documentos que existen).
 */
async function guardarCalendario(perId, publico, escribir) {
  const lote = writeBatch(db);
  lote.update(doc(db, "projects", perId), publico);
  (escribir || []).forEach(([col, id, datos]) => lote.update(doc(db, col, id), datos));
  await lote.commit();
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
  // 17-sep · validado a mano por su docente: queda apuntado para que NO le quite hueco del tope de la semana
  const otorgados = (d.stargateOtorgados || []).filter(x => x !== m.id).concat([m.id]);
  await updateDoc(doc(db, "student_profiles", fichaId), {
    completedMissionIds: (d.completedMissionIds || []).concat([m.id]),
    missionTimestamps: sellos, earnedBadges: insignias, stargateOtorgados: otorgados
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
/**
 * 🔴 17-sep · UN MENSAJE DEL COMANDANTE AL RECLUTA, al validar o anular un reto desde su ficha. Norberto: «imagina que ha
 * puesto un enlace incorrecto: se desmarca la misión y se da una razón al estudiante». Sin el porqué, un reto que
 * desaparece parece un fallo de la web, y acaba en un correo.
 *
 * Va a `notifications`, la bandeja que GamificaPro ya tiene (sus reglas: la crea cualquiera con sesión; la lee y la
 * marca como leída solo su destinatario). Con `stargate` dentro, para que la Nave distinga los suyos de los del motor.
 */
async function avisarRecluta(perId, userId, { reto = "", accion = "", texto = "", de = "", titulo = "", regalo = null } = {}) {
  if (!userId) throw new Error("No sé a quién mandárselo");
  const t = String(texto || "").trim().slice(0, 400);
  const tit = titulo || (accion === "anulado" ? "Tu Comandante ha anulado el reto " + reto
                                              : accion === "validado" ? "Tu Comandante ha validado el reto " + reto
                                              : accion === "regalo" ? "Un regalo de tu Comandante" : "Mensaje de tu Comandante");
  const sg = { reto: String(reto || ""), accion: String(accion || ""), de: String(de || "").slice(0, 80) };
  /**
   * 17-sep · EL REGALO, EN SU PANTALLA (Norberto: «cuando doy el premio, en la pantalla del estudiante no aparece nada…
   * debemos hacer que al otorgar la recompensa le salte automáticamente el sobre o lo que haya ganado»). Lo que ha
   * ganado va aquí mismo, para que la Nave lo abra carta a carta al momento (o al entrar, si no estaba conectado).
   */
  if (regalo) sg.regalo = {
    tipo: String(regalo.tipo || ""), xp: Number(regalo.xp) || 0, creditos: Number(regalo.creditos) || 0,
    participaciones: Number(regalo.participaciones) || 0,
    piezas: (regalo.piezas || []).slice(0, 10).map(p => ({ clave: String(p.clave || ""), tipo: String(p.tipo || ""),
      nombre: String(p.nombre || "").slice(0, 80), rareza: String(p.rareza || "") }))
  };
  const r = await addDoc(collection(db, "notifications"), {
    userId, projectId: perId, type: accion === "validado" ? "mission_validated" : "internal_message",
    title: tit, message: t, read: false, createdAt: Date.now(), stargate: sg
  });
  return r.id;
}
/**
 * 🔴 20-sep · LA CREDENCIAL DE LA SESIÓN, para lo poco que vive FUERA de Firestore: el lector del ticket de
 * salida (una hoja de Google con su Apps Script). Ese lector ya no contesta a cualquiera: se le manda este
 * token y él le pregunta a Firebase si vale. Vacío si no hay nadie identificado (y entonces no se lee nada).
 */
async function credencial() {
  const u = auth.currentUser;
  if (!u || !u.getIdToken) return "";
  try { return await u.getIdToken(); } catch (e) { return ""; }
}
/** La Nave, a la escucha de los mensajes sin leer de su Comandante en este grupo (en directo, como la llamada a filas). */
function vigilarMensajes(perId, alCambiar) {
  const u = auth.currentUser;
  if (!u) { alCambiar([]); return function () {}; }
  return onSnapshot(query(collection(db, "notifications"), where("userId", "==", u.uid), where("projectId", "==", perId)),
    r => alCambiar(r.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(x => x.stargate && !x.read).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))),
    () => alCambiar([]));
}
async function mensajeLeido(id) { await updateDoc(doc(db, "notifications", id), { read: true }); }

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
 * 16-sep · CAMBIAR DE COMANDANTE A UNA SOLA PERSONA. Lo mismo que `traspasar`, pero de uno en uno: alguien que eligió
 * al docente equivocado al alistarse, o un reparto de grupos. Cambia Comandante y escuadrón de una vez, y todo lo suyo
 * (retos, créditos, colección) va con la persona, no con el escuadrón.
 */
async function cambiarComandante(perId, fichaId, aNombre) {
  const p = await getDoc(doc(db, "projects", perId));
  const destino = ((p.data() || {}).factions || []).filter(f => f.teacherName === aNombre)[0] || null;
  if (!destino) throw new Error("Ese Comandante no tiene escuadrón en este grupo");
  const ficha = await getDoc(doc(db, "student_profiles", fichaId));
  if (!ficha.exists() || ficha.data().projectId !== perId) throw new Error("Esa ficha no es de este grupo");
  await updateDoc(ficha.ref, { stargateProfe: aNombre, squadId: destino.id, factionId: destino.id });
  return { ok: true };
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
  // 14-sep · la participación de un sorteo apunta al documento de su premio
  if (x.linkedItemId) out.linkedItemId = doc_(x.linkedItemId);
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

/**
 * La llamada abierta de un grupo, si la hay. Devuelve null si no hay ninguna o ya ha caducado.
 *
 * 🔴 15-sep · `elegir` (opcional): cuál vale. En un grupo hay varios Comandantes y cada uno toca
 * llamada para SU escuadrón; si dos la tienen abierta a la vez, «la más reciente» era la del otro:
 * el alumno se quedaba sin su «Presente» y la sesión de un docente adoptaba (y podía cerrar) la de
 * otro. Una función (la de mi escuadrón) o 'mia' (la que abrió quien mira).
 */
async function llamadaAbierta(perId, elegir) {
  const r = await getDocs(query(collection(db, LLAMADA),
    where("projectId", "==", perId), where("active", "==", true)));
  const ahora = Date.now();
  const vivas = r.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(x => fin(x) > ahora)
    .sort((a, b) => fin(b) - fin(a));
  let f = typeof elegir === "function" ? elegir : null;
  if (elegir === "mia") { const yo = await sesion(); f = x => !!yo && x.teacherId === yo.uid; }
  return (f ? vivas.filter(f) : vivas)[0] || null;
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
/**
 * 🔴 18-sep · LA PALABRA DEL RETO SECRETO LA COMPRUEBA EL SERVIDOR (S7, el Escape UNI).
 * La web la miraba contra la huella pública y luego llamaba a `completeMission` como a cualquier reto: quien
 * llamara al servidor a mano se llevaba los 150 xp sin pisar el escape. Ahora el servidor la comprueba y deja
 * la marca en la ficha (`stargateSecretos`), y sin esa marca `completeMission` no deja registrar el reto.
 * Devuelve true si la palabra vale (o si ya estaba traída); lanza si no.
 */
async function traerPalabra(perId, reto, texto) {
  const r = await llamar("stargateSecreto", { projectId: perId, reto: reto, texto: String(texto || "") });
  return !!(r && r.ok);
}

async function ficharLlamada(perId, fichaId) {
  const yo = await sesion();
  if (!yo) throw new Error("Entra con tu cuenta");
  const f = await getDoc(doc(db, "student_profiles", fichaId));
  if (!f.exists()) throw new Error("No encuentro tu ficha");
  const perfil = f.data();
  // la de SU escuadrón (o una para todo el grupo), aunque otra más reciente esté abierta
  const s = await llamadaAbierta(perId, x => !x.restrictedFactionId || x.restrictedFactionId === (perfil.factionId ?? null));
  if (!s) throw new Error("La llamada a filas ya no está abierta.");
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
function vigilarLlamada(perId, alCambiar, elegir) {
  return onSnapshot(query(collection(db, LLAMADA),
    where("projectId", "==", perId), where("active", "==", true)),
    r => {
      const ahora = Date.now();
      const vivas = r.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(x => fin(x) > ahora).sort((a, b) => fin(b) - fin(a));
      // (15-sep · `elegir`: la de mi escuadrón o la mía, no «la más reciente del grupo»)
      alCambiar((typeof elegir === "function" ? vivas.filter(elegir) : vivas)[0] || null, vivas);
    },
    () => alCambiar(null, []));
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
/**
 * 14-sep · CONGELAR, DESCONGELAR O DAR DE BAJA a un recluta: lo hace el servidor (`stargateAlumno`),
 * solo para el referente. Norberto: «el referente tiene poder de eliminar o congelar (puede acceder,
 * pero no puede hacer nada, bloqueado)».
 */
const alumno = (perId, fichaId, accion, extra) => llamar("stargateAlumno", Object.assign({ projectId: perId, fichaId, accion }, extra || {}));
/**
 * 19-sep · CAMBIAR A UN RECLUTA DE GRUPO, con todo lo suyo (Norberto eligió «todo»: xp, créditos, insignias, cromos y
 * héroes). Lo hace el servidor (stargateAlumno, acción «mover»): traduce los identificadores de un grupo al otro
 * (cada reto, campaña y recompensa se llama `grupo__id`) y exige ser referente de los DOS grupos.
 */
async function moverRecluta(perId, fichaId, destino) {
  try { return await alumno(perId, fichaId, "mover", { destino }); }
  catch (e) { if (sinDesplegar(e) || /accion|qué hacer/i.test(String(e && e.message))) throw new Error("Falta desplegar en el servidor la versión nueva de «stargateAlumno» (con «mover»): el comando está en el traspaso."); throw e; }
}
// ¿la función aún no está en el servidor? (un 404 del propio Firebase, no un «no» nuestro, que va en español)
const sinDesplegar = e => /not-found|internal/.test(String(e && e.code)) && !/[áéíóúñ]|recluta|grupo/i.test(String(e && e.message));
async function darDeBaja(perId, fichaId) {
  // 🔴 Antes lo hacía el navegador, y las reglas solo dejan borrar fichas al DUEÑO del grupo: un
  // referente que no lo fuera se daba con «permiso denegado». Ahora, el servidor; si aún no está
  // desplegado, como antes.
  try { return await alumno(perId, fichaId, "baja"); } catch (e) { if (!sinDesplegar(e)) throw e; }
  const f = await getDoc(doc(db, "student_profiles", fichaId));
  if (!f.exists()) throw new Error("Esa ficha ya no está");
  if (f.data().projectId !== perId) throw new Error("Esa ficha no es de este grupo");
  try { await deleteDoc(doc(db, "student_profiles", fichaId, "privado", "datos")); } catch (e) {}
  await deleteDoc(doc(db, "student_profiles", fichaId));
  // y su alias queda libre para otro
  try { const ra = await getDoc(refAlias(perId, f.data().displayName)); if (ra.exists() && ra.data().uid === f.data().userId) await deleteDoc(ra.ref); } catch (e) {}
}

/**
 * CAMBIAR EL ALIAS de una ficha (lo usa la corrección de ficha del profesorado): se reserva el nuevo
 * a nombre del alumno y se libera el viejo, todo en el mismo lote que la ficha.
 */
async function cambiarAlias(perId, fichaId, nuevo, extra) {
  const f = await getDoc(doc(db, "student_profiles", fichaId));
  if (!f.exists()) throw new Error("Esa ficha ya no está");
  const uid = f.data().userId, viejo = f.data().displayName;
  const lote = writeBatch(db);
  await reservarAlias(lote, perId, uid, nuevo);
  if (aliasClave(viejo) !== aliasClave(nuevo)) {
    const rv = await getDoc(refAlias(perId, viejo)).catch(() => null);
    if (rv && rv.exists() && rv.data().uid === uid) lote.delete(rv.ref);
  }
  const cambios = Object.assign({}, extra || {}, { displayName: nuevo });
  lote.update(doc(db, "student_profiles", fichaId), cambios);
  try { await lote.commit(); }
  catch (e) {
    if (!/permission|insufficient/i.test(String(e && (e.code || e.message)))) throw e;
    if (await aliasOcupado(perId, nuevo, { ficha: fichaId })) throw new Error("«" + nuevo + "» ya lo lleva otro recluta del grupo.");
    await updateDoc(doc(db, "student_profiles", fichaId), cambios);   // reglas de antes del registro (ver alistar)
  }
}

/** Cambiar el código de acceso del grupo. Se usa cuando se ha corrido más de la cuenta. */
/**
 * ════════════ EL BUZÓN DEL MANDO (15-sep) · «📡 Frecuencia de mando», buzon.html ════════════
 *
 * Norberto: «que los docentes tengan una página sencilla donde poner recomendaciones o problemas, y
 * que lo resuelvas sin que yo intervenga». El profesorado escribe (problema, duda o idea); cada cual
 * ve lo suyo y las respuestas; el Mando (los vitalicios) lo ve todo. Lo resuelve un asistente que
 * trabaja desde el servidor: aquí solo se escribe y se lee. Las reglas: `stargate_buzon`.
 */
const BUZON = "stargate_buzon";
async function buzonEnviar(m) {
  const yo = await sesion();
  if (!yo) throw new Error("Entra con tu cuenta para escribir al Mando.");
  const ahora = Date.now();
  const ref = await addDoc(collection(db, BUZON), {
    uid: yo.uid, correo: yo.correo, nombre: yo.nombre || yo.correo, projectId: m.projectId || "", grupo: m.grupo || "",
    tipo: m.tipo, urgente: !!m.urgente, texto: String(m.texto || "").trim().slice(0, 2000), contexto: m.contexto || {},
    estado: "nuevo", respuestas: [], creado: ahora, actualizado: ahora, visto: true, autoayuda: m.autoayuda || []
  });
  return ref.id;
}
/** Lo mío, lo último arriba (sin índices compuestos: se ordena aquí). */
async function buzonMios() {
  const yo = await sesion();
  if (!yo) return [];
  const r = await getDocs(query(collection(db, BUZON), where("uid", "==", yo.uid)));
  return r.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.actualizado || 0) - (a.actualizado || 0));
}
/** Todo (solo el Mando: las reglas no dejan a nadie más). */
async function buzonTodos() {
  const r = await getDocs(collection(db, BUZON));
  return r.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.actualizado || 0) - (a.actualizado || 0));
}
/**
 * Contestar en un hilo. El docente añade una respuesta suya (y el mensaje vuelve a «nuevo»: el Mando
 * lo verá); el Mando responde como «mando» y le pone el estado que toque. Nada de lo anterior se toca.
 */
async function buzonResponder(id, texto, opciones) {
  const o = opciones || {}, ref = doc(db, BUZON, id);
  const d = await getDoc(ref);
  if (!d.exists()) throw new Error("Ese mensaje ya no existe.");
  const t = String(texto || "").trim().slice(0, 2000);
  const cambios = { actualizado: Date.now() };
  if (t) cambios.respuestas = (d.data().respuestas || []).concat([{ de: o.comoMando ? "mando" : "docente", texto: t, fecha: Date.now() }]);
  if (o.comoMando) { cambios.estado = o.estado || d.data().estado; if (t) cambios.visto = false; }
  else cambios.estado = o.estado === "resuelto" ? "resuelto" : "nuevo";
  await updateDoc(ref, cambios);
}
/** «Ya lo he leído»: se apaga el aviso de respuesta nueva. */
async function buzonVisto(id) { try { await updateDoc(doc(db, BUZON, id), { visto: true }); } catch (e) {} }

/**
 * ════════════ LAS REFLEXIONES DE LOS RETOS Y SUS COMENTARIOS (15-sep, noche) ════════════
 *
 * Norberto: «en los retos en los que tienen que compartir una breve reflexión… que lo respondan directamente
 * sobre el reto… y que puedan ver el del resto de sus compañeros así como el enlace (servirá de ejemplo) y
 * responderse/comentar». Una reflexión por recluta y reto (`stargate_reflexiones/{grupo__reto__ficha}`): la escribe
 * su dueño, la ve el grupo por su alias (aquí no hay nombres ni correos) y la quita su dueño o el profesorado. Los
 * comentarios (`stargate_comentarios`), cortos: los quita su autor, el dueño de la reflexión o el profesorado. Las
 * reglas viven en GamificaPro (firestore.rules); qué retos la llevan, en `_site_data.py → REFLEXION_RETOS`.
 */
const REFLEX = "stargate_reflexiones", COMENT = "stargate_comentarios";
const TOPE_REFLEXION = 2000, TOPE_COMENTARIO = 400;
function idReflexion(perId, reto, fichaId) { return perId + "__" + reto + "__" + fichaId; }
async function guardarReflexion(perId, reto, fichaId, texto, enlace) {
  const yo = await sesion();
  if (!yo) throw new Error("Entra con tu cuenta para guardar tu reflexión.");
  const t = String(texto || "").trim().slice(0, TOPE_REFLEXION);
  if (!t) throw new Error("La reflexión está vacía.");
  const ref = doc(db, REFLEX, idReflexion(perId, reto, fichaId));
  let creado = Date.now();
  try { const a = await getDoc(ref); if (a.exists()) creado = a.data().creado || creado; } catch (e) {}
  const d = { projectId: perId, reto: reto, fichaId: fichaId, uid: yo.uid, texto: t, creado: creado, editado: Date.now() };
  const e = String(enlace || "").trim().slice(0, 500);
  if (e) d.enlace = e;
  await setDoc(ref, d);
  return ref.id;
}
/** El enlace de una reflexión que ya existe, al día (se cambió desde «Cambiar enlace»). Si no hay reflexión, nada. */
async function enlaceDeReflexion(perId, reto, fichaId, enlace) {
  const ref = doc(db, REFLEX, idReflexion(perId, reto, fichaId));
  try {
    const a = await getDoc(ref);
    if (!a.exists()) return;
    await setDoc(ref, Object.assign({}, a.data(), { enlace: String(enlace || "").trim().slice(0, 500), editado: Date.now() }));
  } catch (e) {}
}
/** Todas las de un reto del grupo (o todas las del grupo), las más nuevas arriba (sin índices: se ordena aquí). */
async function reflexionesDe(perId, reto) {
  const q = reto ? query(collection(db, REFLEX), where("projectId", "==", perId), where("reto", "==", reto))
                 : query(collection(db, REFLEX), where("projectId", "==", perId));
  const r = await getDocs(q);
  return r.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.creado || 0) - (a.creado || 0));
}
async function misReflexiones(perId) {
  const yo = await sesion();
  if (!yo) return [];
  const r = await getDocs(query(collection(db, REFLEX), where("projectId", "==", perId), where("uid", "==", yo.uid)));
  return r.docs.map(d => ({ id: d.id, ...d.data() }));
}
/** Los comentarios de un reto del grupo, del más viejo al más nuevo (una conversación se lee así). */
async function comentariosDe(perId, reto) {
  const q = reto ? query(collection(db, COMENT), where("projectId", "==", perId), where("reto", "==", reto))
                 : query(collection(db, COMENT), where("projectId", "==", perId));
  const r = await getDocs(q);
  return r.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.creado || 0) - (b.creado || 0));
}
async function comentar(perId, reflexionId, reto, fichaId, texto) {
  const yo = await sesion();
  if (!yo) throw new Error("Entra con tu cuenta para comentar.");
  const t = String(texto || "").trim().slice(0, TOPE_COMENTARIO);
  if (!t) throw new Error("El comentario está vacío.");
  const ref = await addDoc(collection(db, COMENT), { projectId: perId, reflexion: reflexionId, reto: reto,
    fichaId: fichaId, uid: yo.uid, texto: t, creado: Date.now() });
  return ref.id;
}
async function borrarComentario(id) { await deleteDoc(doc(db, COMENT, id)); }
/**
 * Quitar una reflexión: primero sus comentarios (si no, se quedarían colgando de nada) y luego ella. Lo hace su dueño
 * (al deshacer el reto) o el profesorado (para moderar). Un comentario que no se pueda quitar no para lo demás.
 */
async function borrarReflexion(perId, reto, fichaId) {
  const id = idReflexion(perId, reto, fichaId);
  try {
    const r = await getDocs(query(collection(db, COMENT), where("projectId", "==", perId), where("reflexion", "==", id)));
    for (const d of r.docs) { try { await deleteDoc(d.ref); } catch (e) {} }
  } catch (e) {}
  await deleteDoc(doc(db, REFLEX, id));
}

/**
 * ════════════ LOS LOGROS DE A BORDO (15-sep, noche) ════════════
 *
 * Los decide el servidor (`stargateHitos`): mira los datos, apunta el día, los hitos nuevos y el premio
 * de cada cubierta completa, y con las cinco da el Contramaestre. Aquí solo se pregunta, con la zona
 * horaria de quien pregunta (el servidor la apunta la primera vez y ya no la cambia). Devuelve lo que
 * hay y lo que es nuevo, para que la Nave lo celebre. Si el grupo aún no tiene la función, `null`.
 */
/**
 * ════════════ LAS VOTACIONES DEL AULA (16-sep) ════════════
 *
 * Norberto: «las votaciones en vivo deberían vivir en el mismo sitio que los cronómetros, es gestión de aula… cada
 * docente puede publicar una votación y la próxima semana se resuelve… y GamificaPro tiene algo divertido: comprar voto
 * extra». No hace falta función nueva: el motor trae `castVote` (voto gratis y voto de PAGO, que es el voto extra) y las
 * reglas dejan crear y cerrar la votación a cualquier docente del grupo. Aquí solo se le da forma de STARGATE.
 *
 * Cada votación vive en `projects/{grupo}/voting_events/{id}` con la forma que espera el motor (`options`, `isActive`,
 * `votesPerPerson`, `costPerVote`, `maxPaidVotesPerPerson`, `eligibleFactionId`) y tres campos nuestros: la semana en que
 * se lanzó, la semana en que se resuelve y quién la puso.
 */
const refVotaciones = (perId) => collection(db, "projects", perId, "voting_events");
async function votaciones(perId) {
  const r = await getDocs(refVotaciones(perId));
  return r.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => Number(b.creado || 0) - Number(a.creado || 0));
}
/** Crear una votación. `opciones` son textos; el id de cada una es su posición, que no cambia nunca. */
async function crearVotacion(perId, v) {
  const yo = await sesion();
  const opciones = (v.opciones || []).map(String).map(s => s.trim()).filter(Boolean)
    .map((titulo, i) => ({ id: "o" + (i + 1), title: titulo, totalFreeVotes: 0, totalCoinsInvested: 0 }));
  if (opciones.length < 2) throw new Error("Una votación necesita al menos dos opciones.");
  const doc_ = doc(refVotaciones(perId));
  await setDoc(doc_, {
    title: String(v.pregunta || "").trim(), description: "",
    options: opciones, isActive: true,
    votesPerPerson: 1,
    costPerVote: Math.max(0, Math.floor(Number(v.extra) || 0)),
    maxPaidVotesPerPerson: Math.max(0, Math.floor(Number(v.maxExtra) || 0)),
    // 🔴 si la pone para SU escuadrón, el motor no deja votar a los demás (eligibleFactionId)
    eligibleFactionId: v.escuadron || "",
    factionVoteTotals: {},
    // 17-sep · en DIRECTO (se vota en clase, hasta que el docente la cierra) o en DIFERIDO (abierta unos días; cada cual vota
    // cuando entra, y se cierra sola a su hora)
    stargateModo: v.modo === "diferido" ? "diferido" : "directo",
    stargateCierra: v.modo === "diferido" ? Date.now() + Math.max(1, Math.min(14, Number(v.dias) || 3)) * 864e5 : null,
    creado: Date.now(), stargateSemana: Number(v.semana) || null,
    stargateResuelve: Number(v.resuelve) || null, stargateProfe: String(v.profe || ""),
    creadoPor: yo ? yo.uid : null,
  });
  return doc_.id;
}
const cerrarVotacion = (perId, id) => updateDoc(doc(db, "projects", perId, "voting_events", id), { isActive: false, cerrada: Date.now() });
const borrarVotacion = (perId, id) => deleteDoc(doc(db, "projects", perId, "voting_events", id));
/** Votar: gratis o pagando el voto extra. Lo cobra y lo cuenta el servidor. */
const votar = (perId, id, opcionId, tipo) => llamar("castVote", { projectId: perId, eventId: id, optionId: opcionId, voteType: tipo || "free" });

/**
 * 🔴 17-sep · LO EN VIVO. Norberto, en la prueba humana: «cuando inicio una votación, al estudiante no le aparece nada para
 * votar… Quizá podamos resolver estos problemas añadiendo una sección en vivo en la Nave: la presentación en vivo del
 * docente, temporizadores, preguntas… Siempre que haya una votación activa debe aparecer en Mi nave de forma automática.
 * Deberíamos distinguir entre votaciones en diferido o directo». Y: «además de votación me gustaría lanzar una pregunta en
 * directo; las respuestas van apareciendo en tiempo real, con su alias y avatar»; «si el docente pasa de diapo, al
 * estudiante le pasa también». Todo en tiempo real (onSnapshot), como la llamada a filas.
 *
 * - Las votaciones activas del grupo: se escuchan (antes se miraban UNA vez al abrir la Nave).
 * - `stargate_envivo/{grupo}`: una ficha por grupo que escribe el profesorado — la sesión que proyecta (semana y
 *   diapositiva) y la pregunta en directo abierta. La leen todos los del grupo.
 * - `stargate_respuestas/{grupo}__{pregunta}__{ficha}`: la respuesta de cada recluta (una por pregunta, la puede
 *   cambiar mientras está abierta), con su alias. Las reglas comprueban que la ficha es suya y la pregunta, abierta.
 */
function vigilarVotaciones(perId, alCambiar) {
  return onSnapshot(query(refVotaciones(perId), where("isActive", "==", true)),
    r => alCambiar(r.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => Number(b.creado || 0) - Number(a.creado || 0))),
    () => alCambiar([]));
}
const ENVIVO = "stargate_envivo", RESPUESTAS = "stargate_respuestas";
function vigilarEnVivo(perId, alCambiar) {
  return onSnapshot(doc(db, ENVIVO, perId), s => alCambiar(s.exists() ? s.data() : {}), () => alCambiar({}));
}
async function publicarEnVivo(perId, cambios) {
  await setDoc(doc(db, ENVIVO, perId), Object.assign({ projectId: perId, actualizado: Date.now() }, cambios), { merge: true });
}
async function lanzarPregunta(perId, texto, por) {
  const t = String(texto || "").trim().slice(0, 300);
  if (!t) throw new Error("Escribe la pregunta.");
  const id = "p" + azar(10);
  await publicarEnVivo(perId, { pregunta: { id, texto: t, abierta: true, t: Date.now(), por: String(por || "").slice(0, 80) } });
  return id;
}
async function cerrarPregunta(perId) { await updateDoc(doc(db, ENVIVO, perId), { "pregunta.abierta": false, actualizado: Date.now() }); }
async function responderPregunta(perId, preguntaId, fichaId, alias, texto) {
  const u = auth.currentUser;
  if (!u) throw new Error("Entra con tu cuenta para responder.");
  const t = String(texto || "").trim().slice(0, 280);
  if (!t) throw new Error("Escribe tu respuesta.");
  await setDoc(doc(db, RESPUESTAS, perId + "__" + preguntaId + "__" + fichaId),
    { projectId: perId, pregunta: preguntaId, fichaId, uid: u.uid, alias: String(alias || ""), texto: t, creado: Date.now() });
}
function vigilarRespuestas(perId, preguntaId, alCambiar) {
  return onSnapshot(query(collection(db, RESPUESTAS), where("projectId", "==", perId), where("pregunta", "==", preguntaId)),
    r => alCambiar(r.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.creado || 0) - (b.creado || 0))),
    () => alCambiar([]));
}
async function quitarRespuesta(id) { await deleteDoc(doc(db, RESPUESTAS, id)); }
async function miRespuesta(perId, preguntaId, fichaId) {
  if (!fichaId || !preguntaId) return null;
  try { const d = await getDoc(doc(db, RESPUESTAS, perId + "__" + preguntaId + "__" + fichaId)); return d.exists() ? d.data() : null; }
  catch (e) { return null; }
}
/** Lo que ya ha votado esta persona en esa votación (papeleta por ficha). */
async function miPapeleta(perId, id, fichaId) {
  if (!fichaId) return {};
  const d = await getDoc(doc(db, "projects", perId, "voting_events", id, "votes", fichaId));
  return d.exists() ? (d.data().byOption || {}) : {};
}

/**
 * LA BATALLA CONTRA EL SIMULADOR DE JORAN (16-sep). Todo lo decide el servidor: aquí solo se le pasa qué quiere hacer
 * el estudiante (empezar, responder, actuar, rendirse) y se devuelve lo que contesta. Ni una respuesta viaja antes de
 * tiempo, y el reloj del rival lo lleva él: cerrar la pestaña no lo para.
 */
const batalla = (accion, datos) => llamar("stargateBatalla", Object.assign({ accion }, datos || {}));

async function hitos(perId) {
  let tz = "";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
  try { return await llamar("stargateHitos", { projectId: perId, tz }); }
  catch (e) { if (/not-found|NOT_FOUND|internal/i.test(String(e && (e.code || e.message)))) return null; throw e; }
}

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
  // 🔴 15-sep · lo hace el SERVIDOR (`stargateEquipo`, solo para el referente): las reglas ya no dejan
  // que un codocente toque `coTeacherEmails` ni la lista de roles (antes, cualquiera podía hacerse
  // referente desde el navegador). Mientras la función no esté desplegada, el camino de antes.
  try {
    const r = await llamar("stargateEquipo", { projectId: perId, persona: persona || {} });
    return r.persona || persona;
  } catch (e) {
    if (!/not-found|internal|unavailable/.test(String(e && e.code || "")) || /[áéíóú]/.test(String(e && e.message || ""))) throw e;
  }
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
 * 15-sep · QUITAR A ALGUIEN DEL EQUIPO. Solo por el servidor (`stargateEquipo` con `quitar`): las reglas no dejan
 * tocar `coTeacherEmails` desde el navegador. El servidor no deja quitar a un vitalicio, ni a uno mismo, ni al último
 * referente, ni a quien aún tenga alumnado a su nombre (la consola lo pasa antes a otro docente).
 */
async function quitarDocente(perId, correo) {
  const r = await llamar("stargateEquipo", { projectId: perId, persona: { correo: String(correo || "").toLowerCase() }, quitar: true });
  return r;
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
  // (15-sep · de una vez, en el servidor; y si aún no está desplegado, grupo a grupo como antes)
  try {
    const r = await llamar("stargateEquipo", { projectIds: perIds, persona: Object.assign({}, persona, { rol: "referente" }) });
    return { hechos: r.hechos || [], fallos: r.fallos || [] };
  } catch (e) {
    if (!/not-found|internal|unavailable/.test(String(e && e.code || "")) || /[áéíóú]/.test(String(e && e.message || ""))) throw e;
  }
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
  // 18-sep · `profe` viene de balde (la ficha ya está leída) y sirve para firmar el mensaje de la semana con su Comandante
  const fichas = r.docs.map(d => ({ ficha: d.id, per: d.data().projectId, profe: d.data().stargateProfe || "" })).filter(x => x.per);
  // El nombre del grupo, para que la pantalla de «¿cómo entras hoy?» diga «PRUEBA HUMANA» y no
  // «prueba-humana». Son una o dos lecturas: nadie está alistado en diez grupos a la vez.
  // Y solo grupos de STARGATE: una ficha de GamificaPro en otro proyecto no es una Nave.
  // 19-sep · y la fecha de inicio (semana 1), en la misma lectura: la puerta la enseña bajo el nombre del grupo
  const grupos = await Promise.all(fichas.map(f => getDoc(doc(db, "projects", f.per))
    .then(p => (p.exists() && (p.data().stargate || {}).version) ? { nombre: p.data().name || f.per, inicio: p.data().stargate.inicio || "",
      estado: estadoDelPER(p.data().stargate).estado } : null)
    .catch(() => null)));
  // (el curso terminado se sigue listando: Norberto, 19-sep, «me parece bien que un estudiante pueda acceder a un grupo
  // terminado»; la puerta lo pone debajo y lo marca)
  return fichas.map((f, i) => Object.assign(f, { nombreGrupo: grupos[i] && grupos[i].nombre, inicio: grupos[i] ? grupos[i].inicio : "",
    estado: grupos[i] ? grupos[i].estado : "" })).filter(f => f.nombreGrupo);
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

/**
 * 🔴 17-sep · LOS PREMIOS POR ENLACE, PARA VARIOS GRUPOS Y CON CÓDIGO SECRETO. Norberto: «¿valen para cualquier grupo?
 * Sería maravilloso que fueran para cualquier grupo para poder reciclarlos… una opción para marcar a qué grupos afecta
 * (con opción de TODOS)». Y: «es importante usar direcciones más difíciles: un usuario avispado puede cambiar el 1 por
 * el 2 y ganar otra recompensa». Y lo que pasó al probarlo: creó uno, no pulsó «Guardar», y desapareció.
 *
 * Cómo queda:
 *   · UN premio, UN enlace para todos sus grupos: `huevo.html?h=<id>&c=<código>`. La página busca en qué grupo está
 *     quien lo pulsa, como siempre; el premio existe en cada grupo al que se aplica (su recompensa `<grupo>__huevo_<id>`).
 *   · El CÓDIGO no está en la recompensa (esa la puede leer cualquiera con sesión): va solo su huella
 *     (`claimLinkHash`), y el servidor la comprueba al reclamar. Sin código, el identificador solo no da nada.
 *   · El catálogo vive en la parte PRIVADA de cada grupo (`privado/stargate.premiosEnlace`, un mapa por id): solo lo
 *     lee su equipo docente. Un premio de «todos» está en todos los grupos que lleva quien lo guarda.
 *   · Se guarda cada premio suyo, al tocarlo. Nada de un «Guardar» para toda la lista que se olvida.
 */
const PRIV = (perId) => doc(db, "projects", perId, "privado", "stargate");
function azar(n, abc) {
  const A = abc || "abcdefghijkmnpqrstuvwxyz23456789", r = new Uint32Array(n);
  crypto.getRandomValues(r);
  return Array.from(r, x => A[x % A.length]).join("");
}
async function huellaPremio(id, codigo) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(id) + ":" + String(codigo)));
  return Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, "0")).join("");
}
function premioNuevo(datos) {
  return Object.assign({ id: azar(10), codigo: azar(18, "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"),
    tipo: "recompensa", nombre: "", premio: "sobre", heroe: "", cantidad: 0, sorteo: "", grupos: "todos",
    desde: 0, hasta: 0, limite: 0, porEscuadron: 0, activo: true, creado: Date.now() }, datos || {});
}
/** El catálogo de premios por enlace de estos grupos (los que pueda leer quien mira), con dónde está cada uno. */
async function premiosEnlaceDe(perIds) {
  const porId = {};
  await Promise.all((perIds || []).map(async per => {
    let m = {};
    try { const d = await getDoc(PRIV(per)); m = (d.exists() && d.data().premiosEnlace) || {}; } catch (e) { return; }
    Object.keys(m).forEach(id => {
      const x = m[id]; if (!x || !x.id) return;
      const ya = porId[id];
      if (!ya || Number(x.actualizado || 0) > Number(ya.actualizado || 0)) porId[id] = Object.assign({}, x, { en: ya ? ya.en : [] });
      porId[id].en.push(per);
    });
  }));
  return Object.values(porId).sort((a, b) => Number(b.creado || 0) - Number(a.creado || 0));
}
/** A qué grupos va: «todos» son todos los que lleva quien guarda; si no, los marcados que lleve. */
function destinosDe(item, gestionados) {
  return item.grupos === "todos" ? gestionados.slice() : (item.grupos || []).filter(g => gestionados.indexOf(g) >= 0);
}
/**
 * Guardar UN premio: en la parte privada de cada grupo al que va, su recompensa en cada uno (con la huella del código),
 * y fuera de los grupos a los que ya no va. Devuelve { en: [grupos donde está], saltados: [{per, motivo}] }.
 */
async function guardarPremioEnlace(item, gestionados) {
  item = Object.assign({}, item, { actualizado: Date.now() });
  const antes = item.en || [];
  delete item.en;
  const destinos = destinosDe(item, gestionados), hash = await huellaPremio(item.id, item.codigo);
  const saltados = [], en = [];
  for (const per of destinos) {
    // el cofre del sobre, del héroe, de las cápsulas: los de la tienda de ESE grupo (mismo sorteo, mismas cartas)
    const premios = (await getDocs(query(collection(db, "rewards"), where("projectId", "==", per)))).docs.map(d => ({ id: d.id, ...d.data() }));
    const conCofre = premios.filter(r => r.consumeEffects && r.consumeEffects.lootBox);
    const sobre = conCofre.find(r => r.stargateTipo === "cromo"), heroe = conCofre.find(r => r.stargateTipo === "heroe");
    const cofres = {};
    conCofre.forEach(r => { if (/^(sobre_|capsula_)/.test(r.stargateTipo || "") && r.inStore !== false) cofres[r.stargateTipo] = r; });
    if (/^(sobre_|capsula_)/.test(item.premio) && !cofres[item.premio]) { saltados.push({ per, motivo: "no tiene ese premio en su tienda" }); continue; }
    if (item.premio === "participaciones" && !premios.some(r => r.id === item.sorteo)) { saltados.push({ per, motivo: "ese sorteo no es de este grupo" }); continue; }
    const lote = writeBatch(db);
    lote.set(doc(db, "rewards", idPremioHuevo(per, item.id)),
      Object.assign(window.SG.PAQUETE.premioDeHuevo(per, item, sobre, heroe, cofres), { claimLinkHash: hash, stargateBorrado: false }), { merge: true });
    lote.set(PRIV(per), { premiosEnlace: { [item.id]: item } }, { merge: true });
    await lote.commit();
    en.push(per);
  }
  for (const per of antes.filter(g => en.indexOf(g) < 0 && gestionados.indexOf(g) >= 0)) await quitarDeGrupo(per, item.id);
  return { en, saltados };
}
async function quitarDeGrupo(per, id) {
  const lote = writeBatch(db);
  // cerrado y marcado (borrar la recompensa solo lo puede el dueño principal): quien lo reclamó lo conserva
  lote.set(doc(db, "rewards", idPremioHuevo(per, id)), { claimLinkEnabled: false, stargateBorrado: true }, { merge: true });
  lote.update(PRIV(per), { ["premiosEnlace." + id]: deleteField() });
  await lote.commit();
}
async function borrarPremioEnlace(item, gestionados) {
  for (const per of (item.en || []).filter(g => gestionados.indexOf(g) >= 0)) await quitarDeGrupo(per, item.id);
}
/** El enlace de un premio (directo: la página de STARGATE; con `embed`: la caja suelta para el Genially). */
function enlacePremio(item, embed) {
  return location.origin + "/huevo.html?h=" + encodeURIComponent(item.id) + "&c=" + encodeURIComponent(item.codigo || "") +
    (item.tipo === "huevo" ? "&t=h" : "&t=r") + (embed ? "&embed=1" : "");
}

async function guardarHuevos(perId, lista) {
  // el cofre del sobre y el del héroe se copian de la tienda del grupo: mismo sorteo, mismas cartas
  const premios = await getDocs(query(collection(db, "rewards"), where("projectId", "==", perId)));
  const conCofre = premios.docs.map(d => ({ id: d.id, ...d.data() }))
                              .filter(r => r.consumeEffects && r.consumeEffects.lootBox);
  const sobre = conCofre.find(r => r.stargateTipo === "cromo");
  const heroe = conCofre.find(r => r.stargateTipo === "heroe");
  // 14-sep · y los sobres y cápsulas nuevos (la cápsula legendaria se puede esconder en un enlace)
  const cofres = {};
  conCofre.forEach(r => { if (/^(sobre_|capsula_)/.test(r.stargateTipo || "") && r.inStore !== false) cofres[r.stargateTipo] = r; });
  const antes = await huevosDe(perId);

  const lote = writeBatch(db);
  lista.forEach(h => {
    lote.set(doc(db, "rewards", idPremioHuevo(perId, h.id)), window.SG.PAQUETE.premioDeHuevo(perId, h, sobre, heroe, cofres), { merge: true });
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
 * CÓMO ESTÁ UN PREMIO POR ENLACE AHORA MISMO, antes de pulsar nada: para que la página enseñe «se
 * abre el lunes a las 10:00» o «ya lo tenías» en vez de un botón que luego dice que no.
 * `estado`: abierto · pronto · cerrado · pausado · agotado · borrado. Quien decide de verdad es el
 * servidor al reclamar; esto solo lo cuenta antes.
 */
function estadoDePremio(R, ahora = Date.now()) {
  if (!R || R.stargateBorrado) return "borrado";
  if (R.claimLinkEnabled === false) return "pausado";
  const desde = Number(R.claimLinkStartsAt) || 0, hasta = Number(R.claimLinkEndsAt) || 0;
  if (desde && ahora < desde) return "pronto";
  if (hasta && ahora > hasta) return "cerrado";
  const tope = Number(R.claimLinkMaxTotal) || 0;
  if (tope && (Number(R.claimLinkTotalClaimed) || 0) >= tope) return "agotado";
  return "abierto";
}
async function estadoHuevo(perId, huevoId, fichaId) {
  const rid = idPremioHuevo(perId, huevoId);
  const [r, f] = await Promise.all([getDoc(doc(db, "rewards", rid)),
                                    fichaId ? getDoc(doc(db, "student_profiles", fichaId)) : Promise.resolve(null)]);
  const R = r.exists() ? r.data() : null;
  const H = (R && R.stargateHuevo) || {};
  const F = f && f.exists() ? f.data() : {};
  const inv = Array.isArray(F.inventory) ? F.inventory : [];
  const yaEra = ((F.linkedRewardClaims || {})[rid] || 0) >= 1;
  // el héroe del enlace: cuántas copias tiene ya (la burbuja «×2» y la oferta de NEBULA)
  const heroeId = H.premio === "heroe_fijo" && H.heroe ? perId + "__heroe_" + H.heroe : "";
  return { R, H, yaEra, estado: estadoDePremio(R), desde: Number(R && R.claimLinkStartsAt) || 0,
           hasta: Number(R && R.claimLinkEndsAt) || 0, tope: Number(R && R.claimLinkMaxTotal) || 0,
           reclamados: Number(R && R.claimLinkTotalClaimed) || 0,
           // reclamado pero sin abrir: se fue a mitad de elegir, o no se pudo abrir en su momento
           sinAbrir: yaEra && inv.indexOf(rid) >= 0,
           copias: heroeId ? inv.filter(x => x === heroeId).length : 0 };
}
/** «el lunes 15 de septiembre a las 10:00», en la hora de quien lo lee. */
function cuandoEs(ms) {
  try {
    const d = new Date(ms), hoy = new Date(), man = new Date(Date.now() + 864e5);
    const hora = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    if (d.toDateString() === hoy.toDateString()) return "hoy a las " + hora;
    if (d.toDateString() === man.toDateString()) return "mañana a las " + hora;
    return "el " + d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }) + " a las " + hora;
  } catch (e) { return new Date(ms).toISOString(); }
}

/**
 * Reclamar un escondite. Devuelve qué ha tocado, o por qué no — con palabras, no con códigos.
 */
async function reclamarHuevo(perId, huevoId, fichaId, codigo) {
  const yo = await sesion();
  if (!yo) throw new Error("Entra con tu cuenta para reclamarlo");
  const rid = idPremioHuevo(perId, huevoId);
  const [r, f] = await Promise.all([getDoc(doc(db, "rewards", rid)), getDoc(doc(db, "student_profiles", fichaId))]);
  if (!r.exists() || r.data().stargateBorrado) throw new Error("Este escondite no existe en tu grupo.");
  if (!f.exists()) throw new Error("No encuentro tu ficha");
  const R = r.data(), H = R.stargateHuevo || {};
  if (((f.data().linkedRewardClaims || {})[rid] || 0) >= 1) return { yaEra: true, premio: H.premio };
  const heroeId = H.premio === "heroe_fijo" && H.heroe ? perId + "__heroe_" + H.heroe : "";
  const copias = heroeId ? (f.data().inventory || []).filter(x => x === heroeId).length : 0;
  if (R.claimLinkEnabled === false) throw new Error("Este premio está en pausa: tu docente lo abrirá cuando toque.");
  const est = estadoDePremio(R);
  if (est === "pronto") throw new Error("Todavía no se puede: se abre " + cuandoEs(R.claimLinkStartsAt) + ".");
  if (est === "cerrado") throw new Error("Se cerró " + cuandoEs(R.claimLinkEndsAt) + ". Llegaste tarde a este.");

  let reclamo;
  try {
    // (17-sep · con su código: el servidor comprueba la huella antes de dar nada)
    reclamo = await llamar("claimLinkedReward", { rewardId: rid, modo: "item", codigo: String(codigo || "") });
  } catch (e) {
    const m = String((e && e.message) || "");
    if (/SOLD_OUT|resource-exhausted/i.test(m + " " + (e && e.code)))
      throw new Error("Llegaste tarde: este ya lo encontraron " + (R.claimLinkMaxTotal || "todas las") + " personas que podían.");
    if (/límite de reclamos/i.test(m)) return { yaEra: true, premio: H.premio };
    // la ventana, dicha por el servidor (si el reloj de este equipo no coincide con el suyo)
    if (/aún no está abierto/i.test(m)) throw new Error("Todavía no se puede: se abre " + cuandoEs(R.claimLinkStartsAt) + ".");
    if (/ya se ha cerrado/i.test(m)) throw new Error("Se cerró " + cuandoEs(R.claimLinkEndsAt) + ". Llegaste tarde a este.");
    throw new Error(m.replace(/^Lo siento, /, "") || "No he podido reclamarlo.");
  }
  /**
   * 🔴 13-sep · EL HÉROE DEL ENLACE QUE YA TENÍAS NO SE ABRE SOLO. Norberto: «se le ofrece mantenerlo
   * aunque esté repetido, cobrar 40 créditos o un sobre». Queda reclamado y sin abrir, y la página
   * pregunta (`resolverHeroeRepetido`). Si se va sin elegir, al volver se le pregunta otra vez.
   */
  // 14-sep · participaciones del sorteo: no hay nada que abrir, ya están sumadas en su ficha
  if (H.premio === "participaciones") {
    const t = H.sorteo ? await getDoc(doc(db, "rewards", H.sorteo)).catch(() => null) : null;
    const S = (t && t.exists() && t.data().stargateSorteo) || {};
    return { ok: true, premio: "participaciones", nombre: R.title || "",
             detalle: { tipo: "participaciones", n: Number((reclamo && reclamo.participaciones) || H.cantidad || 1), sorteo: S.premio || "", fecha: Number(S.fecha || 0) } };
  }
  if (copias > 0) {
    const b = cartaDeBotin(heroeId);
    return { ok: true, premio: H.premio, repetido: true, copias: copias, nombre: R.title || "",
             detalle: { tipo: "heroe", clave: H.heroe, nombre: b.nombre, rareza: b.rareza } };
  }
  return abrirHuevo(perId, huevoId, fichaId, R);
}

/**
 * Abrir un premio por enlace ya reclamado: se consume (el sobre, tres veces) y se cuenta qué ha
 * tocado. Sirve al reclamar y también para el que se quedó sin abrir.
 */
async function abrirHuevo(perId, huevoId, fichaId, R_) {
  const rid = idPremioHuevo(perId, huevoId);
  const R = R_ || (await getDoc(doc(db, "rewards", rid))).data() || {};
  const H = R.stargateHuevo || {};
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
  // 14-sep · los sobres nuevos se enseñan como el sobre; las cápsulas, como el héroe
  if (H.premio === "sobre" || /^sobre_/.test(H.premio || "")) detalle = { tipo: "sobre", cartas: sacadas.map(cartaDeBotin) };
  else if (H.premio === "heroe" || H.premio === "heroe_fijo" || /^capsula_/.test(H.premio || "")) {
    const b = sacadas[0] ? cartaDeBotin(sacadas[0]) : (H.heroe ? cartaDeBotin(perId + "__heroe_" + H.heroe) : null);
    detalle = { tipo: "heroe", nombre: b ? b.nombre : "", clave: b ? b.clave : "", rareza: b ? b.rareza : "" };
  } else if (H.premio === "bolsa") detalle = { tipo: "bolsa", creditos: Number(H.cantidad || H.creditos || 50) };
  else if (H.premio === "xp") detalle = { tipo: "xp", xp: Number(H.cantidad || 100) };
  // 🔴 Si no se ha podido abrir, se dice: el premio está en su inventario y se abre desde la Nave. Lo
  // contrario —«+50 ◈, ya está en tu cuenta» con el saldo quieto— es lo que pasó la primera vez.
  if (usos > 0 && !abiertos) detalle = Object.assign({}, detalle || {}, { sinAbrir: true });
  return { ok: true, premio: H.premio, detalle: detalle, nombre: R.title || "" };
}

/**
 * EL HÉROE REPETIDO DE UN ENLACE: lo que elige el recluta en la oferta de NEBULA.
 *   · 'quedar'   → se abre como cualquier otro (una copia más, la burbuja pasa a ×2);
 *   · 'creditos' → 40 ◈, en el servidor (`stargateHeroeRepetido`), sin abrirlo;
 *   · 'sobre'    → un sobre de cromos que se abre aquí mismo, carta a carta.
 */
async function resolverHeroeRepetido(perId, huevoId, fichaId, opcion) {
  const rid = idPremioHuevo(perId, huevoId);
  if (opcion === "quedar") return abrirHuevo(perId, huevoId, fichaId);
  const r = await llamar("stargateHeroeRepetido", { projectId: perId, rewardId: rid, opcion: opcion });
  if (opcion === "creditos") return { ok: true, premio: "bolsa", detalle: { tipo: "bolsa", creditos: Number(r.creditos || 40) } };
  const sacadas = [];
  for (let i = 0; i < Math.max(1, Number(r.usos || 3)); i++) {
    try {
      const c = await llamar("consumeItem", { projectId: perId, rewardId: r.rewardId, studentProfileId: fichaId });
      const b = c && (c.botin || c.obtenido); if (b) sacadas.push(b);
    } catch (e) { break; }
  }
  return { ok: true, premio: "sobre", detalle: { tipo: "sobre", cartas: sacadas.map(cartaDeBotin), sinAbrir: !sacadas.length } };
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

/**
 * PREMIAR EN CLASE, a uno o a varios: una carta, un sobre, un héroe (al azar o elegido) o un adorno.
 * Lo hace el servidor (`stargateRegalar`), una transacción por estudiante. Devuelve, por ficha, qué
 * le ha tocado ya con nombre: [{ ficha, piezas: [{clave, nombre, rareza, tipo}], ya?, error? }].
 */
async function regalarEnClase(perId, fichas, regalo) {
  const r = await llamar("stargateRegalar", { projectId: perId, fichas: fichas, regalo: regalo });
  const nombreAdorno = { marco: "Marco dorado", fondo: "Fondo de ficha", titulo: "Título de recluta" };
  return (r.resultados || []).map(x => Object.assign({}, x, {
    piezas: (x.piezas || []).map(id => regalo.tipo === "adorno"
      ? { clave: regalo.cual, nombre: nombreAdorno[regalo.cual] || "Adorno", tipo: "adorno" }
      : cartaDeBotin(id))
  }));
}

/**
 * QUIÉN ESTÁ EN CLASE HOY: quien ha respondido a una llamada a filas del grupo desde las 00:00.
 * Norberto: «un sitio donde se vean los que han respondido a la llamada, los que tengo en clase en
 * directo, para seleccionar uno o varios y premiarlos, o sacar uno al azar y preguntarle». Vale
 * aunque la llamada ya se haya cerrado: la clase sigue. Devuelve los uid, en orden de llegada.
 */
async function presentesDeHoy(perId) {
  const r = await getDocs(query(collection(db, FICHAJES), where("projectId", "==", perId)));
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const t = x => { const v = x.registeredAt; return v && v.toDate ? v.toDate() : new Date(v || 0); };
  const vistos = {};
  return r.docs.map(d => d.data()).filter(x => t(x) >= hoy)
    .sort((a, b) => t(a) - t(b))
    .filter(x => x.userId && !vistos[x.userId] && (vistos[x.userId] = true))
    .map(x => x.userId);
}

/**
 * ════════ EL ZOCO ESTELAR ════════ (el trueque entre reclutas; lo hace el servidor: functions/stargateZoco.js)
 * Aquí solo se LEE —lo puesto en el Zoco del grupo y mis tratos— y se PIDE: poner, ofertar,
 * responder. Nada de esto toca créditos ni inventario desde el navegador.
 */
async function zocoDatos(perId) {
  const yo = await sesion();
  const T = collection(db, "stargate_tratos");
  const [anuncios, vendo, compro] = await Promise.all([
    getDocs(query(collection(db, "stargate_zoco"), where("projectId", "==", perId), where("estado", "==", "abierto"))),
    yo ? getDocs(query(T, where("projectId", "==", perId), where("vende.uid", "==", yo.uid))) : Promise.resolve({ docs: [] }),
    yo ? getDocs(query(T, where("projectId", "==", perId), where("compra.uid", "==", yo.uid))) : Promise.resolve({ docs: [] })
  ]);
  let tratos = vendo.docs.concat(compro.docs).map(d => ({ id: d.id, ...d.data() }));
  // un trato mío que caducó sin respuesta: se le pide al servidor que lo cierre (y devuelva lo
  // apartado) antes de enseñarlo. Sin tareas programadas: la caducidad es perezosa.
  const caducados = tratos.filter(t => t.estado === "abierto" && Number(t.caduca || 0) < Date.now());
  if (caducados.length && !zocoDatos._cerrando) {
    zocoDatos._cerrando = true;
    try {
      await llamar("stargateZocoResponder", { tratoId: caducados[0].id, accion: "caducar" }).catch(() => null);
      return await zocoDatos(perId);
    } finally { zocoDatos._cerrando = false; }
  }
  tratos = tratos.sort((a, b) => Number(b.actualizado || b.creado || 0) - Number(a.actualizado || a.creado || 0));
  return { uid: yo ? yo.uid : "", anuncios: anuncios.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => Number(b.creado || 0) - Number(a.creado || 0)), tratos };
}
/** Todos los tratos del grupo (el docente): el registro y deshacer. */
async function zocoTratosGrupo(perId) {
  const r = await getDocs(query(collection(db, "stargate_tratos"), where("projectId", "==", perId)));
  return r.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => Number(b.actualizado || 0) - Number(a.actualizado || 0));
}
/**
 * 20-sep · LO PUESTO EN EL ZOCO DE UN GRUPO, para el profesorado. La ficha de cada recluta dice qué tiene puesto a
 * cambiar (Norberto: «si miro la ficha de un estudiante, ¿veo… lo que ha puesto en el Zoco?»), y la pantalla del
 * Zoco lo cruza con los tratos. Lo abierto y lo cerrado: retirar algo también es parte de la historia.
 */
async function zocoAnunciosGrupo(perId) {
  const r = await getDocs(query(collection(db, "stargate_zoco"), where("projectId", "==", perId)));
  return r.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => Number(b.creado || 0) - Number(a.creado || 0));
}
const zocoPoner = (perId, piezas) => llamar("stargateZocoPoner", { projectId: perId, piezas });
const zocoRetirar = (anuncioId) => llamar("stargateZocoRetirar", { anuncioId });
const zocoOfertar = (anuncioId, ofrece, mensaje) => llamar("stargateZocoOfertar", { anuncioId, ofrece, mensaje: mensaje || "" });
const zocoResponder = (tratoId, accion, extra) => llamar("stargateZocoResponder", Object.assign({ tratoId, accion }, extra || {}));
const zocoDeshacer = (tratoId) => llamar("stargateZocoDeshacer", { tratoId });

/**
 * ════════ EL GRAN SORTEO ════════ (14-sep). Un sorteo son dos recompensas —el premio y la
 * participación— que arma `SG.PAQUETE.docsDeSorteo` (la misma receta que al crear el grupo). Crearlo
 * y cambiarlo lo hace el docente (las reglas le dejan escribir sus recompensas); SORTEARLO, el
 * servidor (`stargateSortear`): elige él, con peso por participaciones y sin repetir ganador.
 */
async function crearSorteo(perId, s) {
  const p = await getDoc(doc(db, "projects", perId));
  if (!p.exists()) throw new Error("No existe el grupo «" + perId + "»");
  const S = p.data().stargate || {};
  const [premio, ticket] = window.SG.PAQUETE.docsDeSorteo(s, { inicio: S.inicio, pausas: S.pausas || [],
    tipo: S.tipo === "PUA" ? "PUA" : "REGULAR", cat: window.SG_CATALOGO });
  const lote = writeBatch(db);
  [premio, ticket].forEach(x => {
    const { id, ...resto } = x;
    lote.set(doc(db, "rewards", perId + "__" + id), Object.assign({}, resto, conIdsDeDocumento(perId, x)));
  });
  await lote.commit();
  return { ticket: perId + "__" + ticket.id, premio: perId + "__" + premio.id };
}
/** Cambiar un sorteo que aún no se ha hecho: el premio y la participación, en una escritura. */
async function guardarSorteo(perId, ticketDoc, c) {
  const [t, p] = await Promise.all([getDoc(doc(db, "rewards", ticketDoc)), getDoc(doc(db, "projects", perId))]);
  const S = (p.exists() && p.data().stargate) || {};
  c = Object.assign({ inicio: S.inicio, pausas: S.pausas || [] }, c);
  if (!t.exists() || t.data().projectId !== perId) throw new Error("Ese sorteo no existe en este grupo.");
  if (t.data().isRaffleCompleted) throw new Error("Este sorteo ya se ha hecho: no se puede cambiar.");
  const premio = String(c.premio || "").trim() || "El premio del sorteo";
  const ganadores = Math.max(1, Math.floor(Number(c.ganadores) || 1));
  const lote = writeBatch(db);
  lote.update(doc(db, "rewards", ticketDoc), {
    title: "Participación · " + premio, description: String(c.descripcion || ""),
    cost: Math.max(0, Math.floor(Number(c.coste) || 0)), maxPerUser: Number(c.maximo) > 0 ? Math.floor(Number(c.maximo)) : null,
    availableFrom: Number(c.desde), availableUntil: Number(c.fecha), ticketDeadline: Number(c.fecha),
    "stargateSorteo.premio": premio, "stargateSorteo.ganadores": ganadores, "stargateSorteo.fecha": Number(c.fecha),
    "stargateSorteo.desde": Number(c.desde), "stargateSorteo.fijo": true, "stargateSorteo.semanaSorteo": null,
    // la Nave lo enseña desde la semana de su fecha de venta
    stargateSemana: Math.max(1, window.SGSEMANAS.semanaDelCurso(c.inicio || "", c.pausas || [], Number(c.desde)) || 1) });
  lote.update(doc(db, "rewards", t.data().linkedItemId), { title: premio, description: String(c.descripcion || ""),
    globalStock: ganadores, globalStockInitial: ganadores });
  await lote.commit();
}
/**
 * 🌐 17-sep · SORTEOS PARA VARIOS GRUPOS. Norberto: «lo mismo con ofertas y sorteos: comparten la misma página de
 * configuración, pero puedo ajustar individualmente a qué grupos afecta (todos o unos pocos)». Un sorteo es el MISMO en
 * todos sus grupos porque lleva el mismo identificador (`stargateId`): cada grupo tiene su bombo, su venta y su sorteo en
 * directo (así lo hace el servidor), y la configuración se escribe en todos a la vez.
 */
async function sorteosDeGrupos(perIds) {
  const porId = {};
  for (const per of perIds || []) {
    let r; try { r = await getDocs(query(collection(db, "rewards"), where("projectId", "==", per), where("systemEffect", "==", "lottery_ticket"))); } catch (e) { continue; }
    r.docs.forEach(d => {
      const x = Object.assign({ docId: d.id }, d.data()), k = x.stargateId || d.id.split("__").pop();
      (porId[k] = porId[k] || { id: k, grupos: [] }).grupos.push({ per: per, ticket: x });
    });
  }
  return Object.values(porId);
}
async function participacionesEn(per, ticketDoc) {
  const r = await getDocs(query(collection(db, "student_profiles"), where("projectId", "==", per)));
  return r.docs.reduce((a, d) => a + Number(((d.data().lotteryEntries) || {})[ticketDoc] || 0), 0);
}
/** Crear o cambiar un sorteo en estos grupos (en los que ya lo tienen se cambia; en los demás se crea). Los hechos no se tocan. */
async function sorteoEnGrupos(s, destinos) {
  const ya = {}; (await sorteosDeGrupos(destinos)).filter(x => x.id === s.id).forEach(x => x.grupos.forEach(g => { ya[g.per] = g.ticket; }));
  const hechos = [];
  for (const per of destinos) {
    const t = ya[per];
    if (t && t.isRaffleCompleted && !t.stargateRetirado) { hechos.push(per); continue; }
    if (t && !t.stargateRetirado) await guardarSorteo(per, t.docId, s);
    else if (t && t.stargateRetirado) { await updateDoc(doc(db, "rewards", t.docId), { isRaffleCompleted: false, stargateRetirado: false, raffleResolvedBy: null, raffleResolvedAt: null }); await guardarSorteo(per, t.docId, s); }
    else await crearSorteo(per, s);
  }
  return { hechos };
}
/**
 * Quitar un sorteo de UN grupo: solo si allí nadie tiene participaciones (si no, habría papeletas pagadas sin sorteo).
 * Se marca «retirado» (cerrado y sin ganadores): la Nave deja de venderlo y el servidor no lo sortea.
 */
async function retirarSorteo(per, ticketDoc) {
  const n = await participacionesEn(per, ticketDoc);
  if (n > 0) throw new Error("Ahí ya hay " + n + (n === 1 ? " participación" : " participaciones") + ": no se puede quitar (haz el sorteo o regálalo).");
  await updateDoc(doc(db, "rewards", ticketDoc), { isRaffleCompleted: true, raffleWinnerIds: [], raffleWinnerNames: [], raffleResolvedAt: Date.now(),
    raffleResolvedBy: "retirado", stargateRetirado: true, availableUntil: Date.now() });
}
/**
 * 🌐 LAS OFERTAS PARA VARIOS GRUPOS. Las crea el servidor en cada grupo (con sus unidades según SUS inscritos); se atan
 * con `stargateComun` y lo que se haga con una (alargar, unidades, cancelar) se hace en todas.
 */
async function ofertasDeGrupos(perIds) {
  const porId = {};
  for (const per of perIds || []) {
    let r; try { r = await getDocs(query(collection(db, "rewards"), where("projectId", "==", per), where("stargateTipo", "==", "oferta"))); } catch (e) { continue; }
    r.docs.forEach(d => {
      const x = Object.assign({ docId: d.id }, d.data()), k = x.stargateComun || d.id;
      (porId[k] = porId[k] || { id: k, comun: !!x.stargateComun, grupos: [] }).grupos.push({ per: per, oferta: x });
    });
  }
  return Object.values(porId);
}
async function crearOfertaEnGrupos(datos, destinos) {
  const comun = "of" + azar(10), fallos = [];
  for (const per of destinos) {
    try {
      const r = await oferta(per, "crear", datos);
      if (r && r.oferta && destinos.length > 1) await updateDoc(doc(db, "rewards", r.oferta), { stargateComun: comun });
    } catch (e) { fallos.push({ per: per, motivo: e.message }); }
  }
  return { comun, fallos };
}
async function ofertaEnGrupos(docs, accion, datos) {
  const fallos = [];
  for (const g of docs) { try { await oferta(g.per, accion, Object.assign({ ofertaId: g.docId }, datos || {})); } catch (e) { fallos.push({ per: g.per, motivo: e.message }); } }
  return { fallos };
}
const sortear = (perId, ticketDoc) => llamar("stargateSortear", { projectId: perId, ticketId: ticketDoc });
// 14-sep · los sorteos que ya han pasado su fecha se resuelven solos al entrar cualquiera del grupo
const sorteosPendientes = (perId) => llamar("stargateSorteosPendientes", { projectId: perId });
// 14-sep · las ofertas de la semana: la automática (la pide la Nave al entrar), comprar, y lo del referente
const oferta = (perId, accion, datos) => llamar("stargateOferta", Object.assign({ projectId: perId, accion: accion }, datos || {}));

/** Quién ha fichado en una llamada, para verlo en directo desde el puesto de mando. */
/**
 * 18-sep · ¿YA FICHÉ EN ESTA LLAMADA? Norberto: «la llamada a filas aparece todo el rato si el estudiante cierra la
 * ventana o cambia». Es que «ya he fichado» solo vivía en la memoria de la pestaña. Esto lo pregunta al servidor.
 * (Dos igualdades y una de ellas es su uid: es lo que dejan leer las reglas, y no hace falta índice nuevo.)
 */
async function yaFiche(sesionId, uid) {
  if (!sesionId || !uid) return false;
  const r = await getDocs(query(collection(db, FICHAJES), where("sessionId", "==", sesionId), where("userId", "==", uid)));
  return !r.empty;
}

async function fichajesDe(sesionId) {
  const r = await getDocs(query(collection(db, FICHAJES), where("sessionId", "==", sesionId)));
  return r.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.registeredAt?.toDate ? a.registeredAt.toDate() : new Date(a.registeredAt))
                  - (b.registeredAt?.toDate ? b.registeredAt.toDate() : new Date(b.registeredAt)));
}

/**
 * ════════ 15-sep · LOS PROFES REFERENTES, SUS INVITACIONES Y LAS CONEXIONES DEL PROFESORADO ════════
 * Norberto: «no sé con qué email iniciarán sesión, ¿podrías autodetectarlo y convertirlas en referentes?» y
 * «una página de profesores: veo todos los profes que son o han sido, los convierto (o quito) de referente…».
 * Por nombre NO se puede (cualquiera se pone ese nombre en Google): el Mando crea una INVITACIÓN de un solo
 * uso, y quien la abre con su cuenta queda como referente (las reglas lo atan en una sola escritura).
 * Referente = puede crear grupos y ve lo de referente. Los vitalicios lo son siempre.
 */
async function referenteGlobal(correo) {
  correo = String(correo || "").toLowerCase();
  if (REFERENTES_VITALICIOS.indexOf(correo) >= 0) return true;
  try { const d = await getDoc(doc(db, "stargate_referentes", correo)); return d.exists() && d.data().activo === true; }
  catch (e) { return false; }
}
function aleatorio(n) {
  const a = new Uint8Array(n), L = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  crypto.getRandomValues(a); return Array.prototype.map.call(a, x => L[x % L.length]).join("");
}
async function crearInvitacion(nombre) {
  const yo = await sesion(); if (!yo) throw new Error("Entra con tu cuenta.");
  const t = aleatorio(24), ahora = Date.now();
  await setDoc(doc(db, "stargate_invitaciones", t), { nombre: String(nombre || "").trim().slice(0, 80), rol: "referente",
    creado: ahora, caduca: ahora + 14 * 864e5, por: yo.correo, usadoPor: null, usadoCorreo: null, usadoEn: null });
  return { token: t, enlace: location.origin + "/invitacion.html?t=" + t, caduca: ahora + 14 * 864e5 };
}
async function leerInvitacion(t) {
  const d = await getDoc(doc(db, "stargate_invitaciones", String(t || ""))); return d.exists() ? { id: d.id, ...d.data() } : null;
}
async function canjearInvitacion(t) {
  const yo = await sesion(); if (!yo) throw new Error("Entra con tu cuenta de Google.");
  const inv = await leerInvitacion(t);
  if (!inv) return { error: "no-existe" };
  if (inv.usadoPor) return inv.usadoPor === yo.uid ? { ok: true, ya: true, nombre: inv.nombre } : { error: "usada" };
  if (Number(inv.caduca) < Date.now()) return { error: "caducada" };
  const b = writeBatch(db), ahora = Date.now();
  b.set(doc(db, "stargate_referentes", yo.correo), { correo: yo.correo, nombre: yo.nombre || inv.nombre || yo.correo, activo: true,
    desde: ahora, por: "invitacion", invitacion: t, actualizado: ahora });
  b.update(doc(db, "stargate_invitaciones", t), { usadoPor: yo.uid, usadoCorreo: yo.correo, usadoEn: ahora });
  await b.commit();
  try { localStorage.setItem("sgEsReferente", "1"); localStorage.setItem("sgEsDocente", "1"); document.dispatchEvent(new CustomEvent("sg:rol")); } catch (e) {}
  anotarConexion().catch(() => {});
  return { ok: true, nombre: inv.nombre };
}
/** Solo el Mando: la lista de invitaciones, la de referentes, poner o quitar uno, y las conexiones. */
async function invitaciones() {
  return (await getDocs(collection(db, "stargate_invitaciones"))).docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.creado || 0) - (a.creado || 0));
}
async function referentes() {
  return (await getDocs(collection(db, "stargate_referentes"))).docs.map(d => ({ id: d.id, ...d.data() }));
}
async function ponerReferente(correo, activo, nombre) {
  const yo = await sesion(); correo = String(correo || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(correo)) throw new Error("Ese correo no parece un correo.");
  const ref = doc(db, "stargate_referentes", correo), d = await getDoc(ref), x = d.exists() ? d.data() : {};
  await setDoc(ref, { correo, nombre: String(nombre || x.nombre || correo), activo: !!activo, desde: x.desde || Date.now(),
    por: (yo && yo.correo) || "", actualizado: Date.now() });
}
async function profes() {
  return (await getDocs(collection(db, "stargate_profes"))).docs.map(d => ({ id: d.id, ...d.data() }));
}
async function anotarConexion() {
  const yo = await sesion(); if (!yo) return;
  const k = "sgConexion:" + yo.uid;
  try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, "1"); } catch (e) {}
  const ref = doc(db, "stargate_profes", yo.uid), d = await getDoc(ref), x = d.exists() ? d.data() : {}, ahora = Date.now();
  await setDoc(ref, { uid: yo.uid, correo: yo.correo, nombre: yo.nombre || x.nombre || "", foto: yo.foto || x.foto || "",
    primera: x.primera || ahora, ultima: ahora, n: (x.n || 0) + 1, ultimas: (x.ultimas || []).concat(ahora).slice(-20) });
}
/**
 * 18-sep · EL PANEL DEL DOCENTE. Norberto: «que los docentes también puedan coger avatares… un panel del docente con sus
 * grupos, su avatar, sus datos, algunas estadísticas». El avatar es una clave de assets/img/avatares/comandantes/ (c1…),
 * guardada en su propia ficha de conexión (stargate_profes/{uid}), que solo lee él y el Mando.
 */
async function miFichaDocente() {
  const yo = await sesion(); if (!yo) return null;
  const d = await getDoc(doc(db, "stargate_profes", yo.uid));
  return Object.assign({ uid: yo.uid, correo: yo.correo, nombre: yo.nombre || "", foto: yo.foto || "" }, d.exists() ? d.data() : {});
}
/**
 * 19-sep · TUS NOTAS DEL GRUPO. Norberto: «una caja de texto por si tiene algo pendiente». Van en
 * projects/{grupo}/privado/notas_{uid}: `privado` solo lo lee y escribe el equipo docente del grupo (reglas de
 * siempre, sin desplegar nada) y nunca el alumnado. Una por docente.
 */
async function misNotas(perId) {
  const yo = await sesion(); if (!yo || !perId) return { texto: "" };
  const d = await getDoc(doc(db, "projects", perId, "privado", "notas_" + yo.uid));
  return d.exists() ? d.data() : { texto: "" };
}
async function guardarNotas(perId, texto) {
  const yo = await sesion(); if (!yo) throw new Error("Entra con tu cuenta");
  const t = String(texto || "").slice(0, 4000);
  await setDoc(doc(db, "projects", perId, "privado", "notas_" + yo.uid), { texto: t, uid: yo.uid, cuando: Date.now() }, { merge: true });
  return true;
}
/**
 * 19-sep · EL MODO DEL DOCENTE. Norberto: «el docente raso, modo simple o modo avanzado. El simple se limita a seguir lo
 * que el referente ha creado, sin complicaciones… quiero evitar que docentes nuevos se agobien y permitir a los
 * experimentados DISFRUTAR». «Piloto automático» (por defecto) o «Mando manual», en su ficha: le sigue a cualquier equipo.
 */
async function ponerModoDocente(modo) {
  const yo = await sesion(); if (!yo) throw new Error("Entra con tu cuenta");
  if (modo !== "piloto" && modo !== "manual") throw new Error("Ese modo no existe");
  await setDoc(doc(db, "stargate_profes", yo.uid), { uid: yo.uid, correo: yo.correo, modo: modo }, { merge: true });
}
/**
 * 🔴 20-sep · QUÉ SE PROYECTA DEL TICKET Y QUÉ NO. Norberto: «utiliza un botón de ocultar (no saldrá en la sesión en
 * vivo) o fijar (saldrá seguro). Los no marcados saldrán los que quepan en la diapositiva». Es una decisión de cada
 * docente en cada grupo —lo que uno quiere leer en voz alta no es lo que quiere otro—, así que vive en
 * `projects/{grupo}/privado/tickets_{uid}`: lo lee y lo escribe el equipo docente del grupo, nunca el alumnado.
 */
/**
 * 🔴 20-sep · LOS TICKETS QUE VIVEN CON SU GRUPO (la Nave Escuela). El ticket de salida de verdad es ANÓNIMO a
 * propósito: un formulario de Google que deja las respuestas en una hoja, y de ahí las lee el panel. El grupo de
 * exploración no puede usar esa hoja —meterle cien respuestas inventadas sería ensuciar con datos falsos el sitio
 * donde el alumnado escribe en confianza—, así que las suyas se guardan con él, en `privado/tickets`.
 *
 * Devuelve [] para un grupo normal (el documento no existe) y también si Firestore dice que no: quien lee esto es
 * quien da la clase, y si algo falla la sesión tiene que seguir por la hoja de siempre.
 */
async function ticketsGuardados(perId) {
  if (!perId) return [];
  try {
    const d = await getDoc(doc(db, "projects", perId, "privado", "tickets"));
    const v = d.exists() ? d.data() : null;
    return (v && Array.isArray(v.filas)) ? v.filas : [];
  } catch (e) { return []; }
}
async function marcasTicket(perId) {
  const yo = await sesion(); if (!yo || !perId) return { fijadas: [], ocultas: [] };
  const d = await getDoc(doc(db, "projects", perId, "privado", "tickets_" + yo.uid));
  const v = d.exists() ? d.data() : {};
  return { fijadas: v.fijadas || [], ocultas: v.ocultas || [] };
}
/** `estado`: "fija", "oculta" o "" (quitarle la marca). Devuelve las marcas ya actualizadas. */
async function marcarTicket(perId, id, estado) {
  const yo = await sesion(); if (!yo) throw new Error("Entra con tu cuenta");
  const m = await marcasTicket(perId);
  const fuera = (L) => L.filter((x) => x !== id);
  const nuevas = { fijadas: fuera(m.fijadas), ocultas: fuera(m.ocultas) };
  if (estado === "fija") nuevas.fijadas.push(id);
  if (estado === "oculta") nuevas.ocultas.push(id);
  await setDoc(doc(db, "projects", perId, "privado", "tickets_" + yo.uid),
    { fijadas: nuevas.fijadas, ocultas: nuevas.ocultas, uid: yo.uid, cuando: Date.now() }, { merge: true });
  return nuevas;
}
/**
 * 🔴 20-sep · TUS MENSAJES DEL FORO. Norberto: «los docentes pueden personalizar sus propios mensajes si quieren y
 * guardarlos para todos sus grupos». Así que NO van en el grupo (como el panel o la sesión a medida): van en la ficha
 * del docente —`stargate_profes/{uid}.foros`—, una entrada por semana. El oficial (el del calendario, firmado con su
 * nombre) sigue siendo el que se ve mientras no escriba el suyo; borrar el suyo devuelve el oficial.
 */
async function guardarForo(sem, texto) {
  const yo = await sesion(); if (!yo) throw new Error("Entra con tu cuenta");
  const k = String(Number(sem) || 0); if (k === "0") throw new Error("No sé de qué semana es ese mensaje");
  const d = await getDoc(doc(db, "stargate_profes", yo.uid));
  const foros = Object.assign({}, (d.exists() ? d.data() : {}).foros || {});
  const t = String(texto || "").trim().slice(0, 4000);
  if (t) foros[k] = t; else delete foros[k];
  await setDoc(doc(db, "stargate_profes", yo.uid), { uid: yo.uid, correo: yo.correo, foros: foros }, { merge: true });
  return foros;
}
async function ponerAvatarDocente(clave) {
  const yo = await sesion(); if (!yo) throw new Error("Entra con tu cuenta");
  if (!/^[a-z0-9_-]{1,40}$/.test(String(clave || ""))) throw new Error("Ese avatar no existe");
  await setDoc(doc(db, "stargate_profes", yo.uid), { uid: yo.uid, correo: yo.correo, avatar: clave }, { merge: true });
}

/**
 * 🔴 23-sep · TU NOMBRE, EN TODOS TUS GRUPOS (Norberto: «cada docente, el suyo»). Lo hace el servidor (`stargateMiNombre`):
 * el nombre es la llave de tu alumnado, tu escuadrón, tu panel y tus diapositivas, y hay que moverlo todo a la vez.
 */
async function cambiarMiNombre(nombre) {
  const yo = await sesion(); if (!yo) throw new Error("Entra con tu cuenta");
  return llamar("stargateMiNombre", { nombre: String(nombre || "").trim() });
}

/** Solo el Mando: TODOS los grupos de STARGATE (con su equipo, si se deja leer) y cuántos alistados tiene cada uno. */
async function todosLosGrupos() {
  const r = await getDocs(collection(db, "projects"));
  const gs = r.docs.map(d => ({ id: d.id, nombre: d.data().name, stargate: d.data().stargate || {}, coTeacherEmails: d.data().coTeacherEmails || [] }))
    .filter(x => x.stargate.version).map(x => Object.assign(x, estadoDelPER(x.stargate)));
  await Promise.all(gs.map(async x => {
    try { const pv = await getDoc(doc(db, "projects", x.id, "privado", "stargate")); x.equipo = (pv.exists() ? pv.data().docentes : null) || x.stargate.docentes || []; }
    catch (e) { x.equipo = x.stargate.docentes || []; }
    try { x.reclutas = (await getCountFromServer(query(collection(db, "student_profiles"), where("projectId", "==", x.id)))).data().count; }
    catch (e) { x.reclutas = null; }
  }));
  return gs;
}

/**
 * 15-sep · LA INVITACIÓN Y EL CÓDIGO PARA GENIALLY, EN UN SOLO SITIO. Los usa la consola (sus botones) y el
 * Capitán del buzón (que los da al instante cuando alguien pregunta «¿cuál es el código de invitación?»):
 * si cada uno tuviera su copia del texto, un día dirían cosas distintas.
 */
function invitacion(p) {
  const enlace = location.origin + "/alistarse.html?per=" + encodeURIComponent(p.id) + "&codigo=" + encodeURIComponent(p.codigo);
  return "Te esperamos en STARGATE, el proyecto gamificado de la asignatura.\n" +
         "Entra aquí con tu cuenta de Google y alístate: " + enlace + "\n" +
         "Si te pide un código de clase, es " + p.codigo + ".";
}
/** El código para insertar en Genially (Insertar → Otros → Código): llena la caja que le des. */
function codigoGenially(ruta, titulo) {
  return '<iframe src="' + location.origin + '/' + ruta + '" width="1200" height="675" style="border:0;width:100%;height:100%" ' +
    'allow="fullscreen; clipboard-write; autoplay; encrypted-media" allowfullscreen title="' + titulo + '"></iframe>';
}

window.SG = window.SG || {};
if (EMU) window.SG.EMU = { entrarComo };
window.SG.MOTOR = { entrar, salir, sesion, credencial, leerPER, tablero, misPERs, sembrarPER, alistar, llamar,
                    guardarAjustes, guardarCalendario, otorgarReto, anularReto, traspasar, cambiarComandante, avisarRecluta, vigilarMensajes, mensajeLeido, resolverVale,
                    llamadaAbierta, abrirLlamada, cerrarLlamada, ficharLlamada, fichajesDe, yaFiche, vigilarLlamada, traerPalabra, miFichaDocente, ponerAvatarDocente, cambiarMiNombre, ponerModoDocente, misNotas, guardarNotas,
                    premiar, regalarCromo, regalarSobre, regalarEnClase, presentesDeHoy, darDeBaja, moverRecluta, alumno, nuevoCodigo, guardarForo, ticketsGuardados, marcasTicket, marcarTicket,
                    huevosDe, guardarHuevos, premioNuevo, premiosEnlaceDe, guardarPremioEnlace, borrarPremioEnlace, enlacePremio, destinosDe, huellaPremio, reclamarHuevo, abrirHuevo, resolverHeroeRepetido, estadoHuevo, estadoDePremio, cuandoEs, misGruposDeAlumno, grupoPorCodigo,
                    anadirDocente, quitarDocente, referenteEnTodos, aliasOcupado, cambiarAlias,
                    zocoDatos, zocoTratosGrupo, zocoAnunciosGrupo, zocoPoner, zocoRetirar, zocoOfertar, zocoResponder, zocoDeshacer,
                    crearSorteo, guardarSorteo, sortear, sorteosPendientes, oferta, sorteosDeGrupos, sorteoEnGrupos, retirarSorteo, participacionesEn,
                    ofertasDeGrupos, crearOfertaEnGrupos, ofertaEnGrupos,
                    buzonEnviar, buzonMios, buzonTodos, buzonResponder, buzonVisto, invitacion, codigoGenially,
                    guardarReflexion, enlaceDeReflexion, reflexionesDe, misReflexiones, comentariosDe, comentar, borrarComentario,
                    borrarReflexion, idReflexion, hitos, batalla,
                    votaciones, crearVotacion, cerrarVotacion, borrarVotacion, votar, miPapeleta,
                    vigilarVotaciones, vigilarEnVivo, publicarEnVivo, lanzarPregunta, cerrarPregunta, responderPregunta, vigilarRespuestas, quitarRespuesta, miRespuesta,
                    referenteGlobal, crearInvitacion, leerInvitacion, canjearInvitacion, invitaciones, referentes, ponerReferente,
                    profes, anotarConexion, todosLosGrupos, VITALICIOS: REFERENTES_VITALICIOS,
                    db, auth, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch };
document.dispatchEvent(new CustomEvent("sg:motor"));
