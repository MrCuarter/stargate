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
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, writeBatch }
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
        lote.set(doc(db, col, id + "__" + x.id), Object.assign({}, x, { projectId: id, stargateId: x.id }));
      });
      await lote.commit();
    }
  }
  avisa("Listo");
  return id;
}

const llamar = (nombre, datos) => httpsCallable(fns, nombre)(datos).then(r => r.data);

window.SG = window.SG || {};
window.SG.MOTOR = { entrar, salir, sesion, leerPER, tablero, misPERs, sembrarPER, llamar,
                    db, auth, doc, getDoc, setDoc, collection, query, where, getDocs };
document.dispatchEvent(new CustomEvent("sg:motor"));
