'use strict';
// 55 · LAS PÁGINAS DEL MOTOR NUEVO: LO QUE NO PUEDEN HACER
//
// La batería 54 comprueba que el traductor dice la verdad. Esta comprueba que las páginas que lo
// usan no se saltan por la puerta de atrás lo que tanto costó cerrar por la de delante: que el
// correo lo diga Google y no el teclado, que el nombre real no acabe en un documento público, que
// la experiencia solo la mueva el servidor y que ninguna página vuelva a fiarse de un PIN.
//
// Son comprobaciones sobre el CÓDIGO, no sobre el navegador. No prueban que la página se vea bien
// —eso se mira con los ojos— sino que no hace lo que no debe, que es lo que nadie mira.
const E = require("./entorno.js");
const { comprobar: c, igual } = E;
const fs = require("fs"), path = require("path");
const js = f => fs.readFileSync(path.join(__dirname, "..", "assets", "js", f), "utf8");
const sinComentarios = t => t.replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
console.log("\n▶ 55 · Las páginas del motor nuevo");

const MOTOR = js("motor.js"), ALTA = js("alistarse.js"), CONSOLA = js("consola.js"), VALIDAR = js("validar.js");
const CREAR = js("crear.js");

// ---------------------------------------------------------------- a) una sola puerta a Firebase
// 🔴 Si cada página hablara con Firebase por su cuenta, un fallo de conexión habría que arreglarlo
// en cinco sitios y la aritmética del juego acabaría mezclada con la fontanería. Una sola puerta.
[["alistarse.js", ALTA], ["consola.js", CONSOLA], ["validar.js", VALIDAR], ["crear.js", CREAR]]
  .forEach(function (par) {
    c(par[1].indexOf("firebasejs") < 0, par[0] + " NO importa Firebase: pasa por el motor");
    c(par[1].indexOf("window.SG.MOTOR") >= 0 || par[1].indexOf("SG.MOTOR") >= 0,
      "   " + par[0] + " usa la centralita");
  });
c(/from "https:\/\/www\.gstatic\.com\/firebasejs\//.test(MOTOR), "y motor.js la carga desde Google");

// ---------------------------------------------------------------- b) el correo lo dice Google
// El fallo más repetido del sistema viejo: teclear un correo distinto al de la sesión y acabar con
// dos fichas, o con ninguna. Ya no hay dónde teclearlo.
c(ALTA.indexOf('id="a-correo"') < 0, "🔴 en el alistamiento NO hay campo para escribir el correo");
c(/email: datos\.correo \|\| yo\.correo/.test(MOTOR), "   el que se guarda es el de la sesión de Google");
c(/YO\.correo/.test(ALTA), "   y se le enseña con cuál está entrando, para que no se equivoque de cuenta");
c(/No soy yo/.test(ALTA), "   con salida por si se equivocó");

// ---------------------------------------------------------------- c) el nombre real, a lo privado
// 🔴 La ficha del alumno la lee CUALQUIERA con sesión en la plataforma: la necesitan el ranking y
// el salón de la fama. Un nombre real ahí dentro es un nombre real a la vista de todos.
const alistar = MOTOR.slice(MOTOR.indexOf("async function alistar"), MOTOR.indexOf("const llamar"));
const fichaPublica = alistar.slice(alistar.indexOf("await setDoc(ficha"), alistar.indexOf("privado"));
["firstName", "lastName", "datos.nombre", "datos.apellidos", "datos.correo"].forEach(function (k) {
  c(fichaPublica.indexOf(k) < 0, "🔴 «" + k + "» NO se escribe en la ficha pública");
});
c(/"student_profiles", ficha\.id, "privado", "datos"/.test(alistar),
  "🔴 el nombre y el correo van a la subcolección privada, que tiene su propia regla");
c(/firstName: datos\.nombre/.test(alistar) && /lastName: datos\.apellidos/.test(alistar),
  "   nombre y apellidos POR SEPARADO: partirlos a máquina en español no se puede");
c(/bitacora: datos\.bitacora/.test(alistar), "y el cuaderno de bitácora se guarda al alistarse");

// ---------------------------------------------------------------- d) la ficha nace a cero
// La regla de Firestore lo exige (`naceEnCero`) y con razón: sin eso, cualquiera se creaba un
// segundo perfil con 999.999 de experiencia, porque al CREAR no se miraba la economía.
c(/totalPoints: 0, coins: 0/.test(alistar), "🔴 la ficha nace con 0 xp y 0 créditos");
c(/completedMissionIds: \[\]/.test(alistar), "   y sin ningún reto hecho");
c(/completeMission/.test(alistar),
  "🔴 los 100 xp del alistamiento los da el SERVIDOR completando H1, no el navegador");

// ---------------------------------------------------------------- e) la experiencia solo la mueve el servidor
const CONSOLA_LIMPIA = sinComentarios(CONSOLA), MOTOR_LIMPIO = sinComentarios(MOTOR);
["totalPoints", "coins:"].forEach(function (campo) {
  c(CONSOLA_LIMPIA.indexOf(campo) < 0, "🔴 la consola NO escribe «" + campo + "» a mano");
});
c(/llamar\("applyXpDelta"/.test(MOTOR_LIMPIO), "anular un reto descuenta por applyXpDelta (con su asiento)");
c(/llamar\("completeMission"/.test(MOTOR_LIMPIO), "y otorgarlo, por completeMission");
const anular = MOTOR_LIMPIO.slice(MOTOR_LIMPIO.indexOf("async function anularReto"), MOTOR_LIMPIO.indexOf("async function traspasar"));
c(anular.indexOf("applyXpDelta") >= 0 && anular.indexOf("completedMissionIds") >= 0,
  "🔴 anular quita el reto Y descuenta: dejar solo una de las dos deja a alguien con xp de la nada");

// ---------------------------------------------------------------- f) se acabó el PIN
// El PIN era lo único que teníamos con Apps Script, y es el eslabón débil: sin bloqueo por
// intentos, seis cifras caen en unas horas. Y además no distinguía a nadie.
[["consola.html", "consola"], ["crear.html", "crear"]].forEach(function (par) {
  const html = fs.readFileSync(path.join(__dirname, "..", par[0]), "utf8");
  c(html.indexOf("puerta.js") < 0, "🔴 " + par[0] + " NO pide PIN: pide cuenta");
  c(/motor\.js/.test(html), "   y carga el motor");
});
c(/MOTOR\.misPERs\(YO\.correo\)/.test(CONSOLA),
  "🔴 la consola enseña los grupos DE QUIEN ENTRA, no todos: eso el PIN no sabía hacerlo");

// ---------------------------------------------------------------- g) a quién se le edita
// Emparejar por alias era una bomba: dos reclutas con el mismo alias y le otorgas el reto al que no
// es, sin enterarte. El identificador de la ficha viaja con ella.
c(/var ficha = r\.ficha;/.test(CONSOLA), "🔴 la consola edita por id de ficha, no por alias");
c(CONSOLA.indexOf("displayName === r.alias") < 0, "   y ya no empareja por alias en ningún sitio");
const TAB = fs.readFileSync(path.join(__dirname, "..", "motor", "tablero.js"), "utf8");
const priv = TAB.slice(TAB.indexOf("if (conPrivados) {"), TAB.indexOf("return out;"));
c(/out\.ficha = p\.id;/.test(priv), "y ese id solo viaja en la rama privada, con el correo y el nombre");

// ---------------------------------------------------------------- h) los enlaces del Genially
// 🔴 Lo que permite montar los Geniallys UNA vez aunque STARGATE se repita tres veces al año.
c(VALIDAR.indexOf('get("per")') < 0, "🔴 el enlace de validar NO lleva el grupo");
c(/get\("reto"\)/.test(VALIDAR), "   lleva el RETO");
c(/where\("stargateId", "==", RETO\)/.test(VALIDAR),
  "   y el grupo sale de quien pulsa: se busca su ficha y dentro de su grupo, ese reto");
c(/stargateId: x\.id/.test(MOTOR),
  "🔴 por eso las misiones se siembran con su id de STARGATE: igual en todos los grupos y convocatorias");
c(/grupos\.length > 1/.test(VALIDAR),
  "y si alguien está en dos grupos se le PREGUNTA: acertar por sorteo dejaría el reto mal puesto");

// ---------------------------------------------------------------- i) primero la cuenta, luego el grupo
// Firestore no deja leer NADA sin sesión, ni el nombre del grupo. Preguntar antes de entrar
// devolvía «permisos insuficientes» y la página moría con un error que no era culpa de nadie.
const arranca = ALTA.slice(ALTA.indexOf("async function arrancar"));
c(arranca.indexOf("if (!YO) return puerta();") < arranca.indexOf('"projects", PER'),
  "🔴 el alistamiento comprueba la sesión ANTES de leer el grupo");

// ---------------------------------------------------------------- j) alistarse dos veces, no
c(/if \(!mias\.empty\) return location\.replace\(naveUrl\(\)\);/.test(ALTA),
  "🔴 quien ya se alistó va derecho a su Nave: dos fichas de la misma persona es peor que ninguna");
// 🔴 Y el salto conserva el interruptor de motor. Sin eso, quien se alista en el motor nuevo aterriza
// en la Nave del viejo y se encuentra un «PER no encontrado» después de haberlo hecho todo bien.
c(/function naveUrl\(\)/.test(ALTA) && /q\.get\("motor"\)/.test(ALTA),
  "   y el enlace de la Nave conserva el motor con el que se entró");

// ---------------------------------------------------------------- k) el proyecto va solo, y primero
// La regla que deja crear misiones pregunta «¿eres docente de ese proyecto?», y para contestar tiene
// que poder leer el proyecto. En el mismo lote, aún no existiría y rechazaría las 90 escrituras
// siguientes sin decir por qué.
const sembrar = MOTOR_LIMPIO.slice(MOTOR_LIMPIO.indexOf("async function sembrarPER"), MOTOR_LIMPIO.indexOf("async function alistar"));
c(sembrar.indexOf('setDoc(doc(db, "projects", id)') < sembrar.indexOf("writeBatch"),
  "🔴 el proyecto se crea solo y ANTES que sus misiones");
c(/i \+= 200/.test(sembrar), "y lo demás en lotes, que Firestore admite 500 por tanda");

// ---------------------------------------------------------------- l) los dos sembradores, iguales
// 🔴 Se siembra desde dos sitios —la consola del referente (navegador) y la línea de órdenes— y los
// dos tienen que escribir EXACTAMENTE lo mismo. Si uno traduce los identificadores y el otro no, la
// mitad de los grupos del curso quedan con el bonus de planeta roto y nadie se entera hasta que
// alguien complete un planeta y no cobre.
const SEMBRAR = fs.readFileSync(path.join(__dirname, "..", "motor", "sembrar.js"), "utf8");
const trozo = t => {
  const a = t.indexOf("function conIdsDeDocumento");
  return t.slice(a, t.indexOf("\n}", a)).replace(/\s+/g, " ");
};
igual(trozo(MOTOR), trozo(SEMBRAR),
  "🔴 los dos sembradores traducen los identificadores exactamente igual");
["missionIds", "optionalMissionIds", "rewardItemIds", "campaignId", "unlockWhenCampaignComplete", "lootBox"]
  .forEach(function (k) {
    c(trozo(MOTOR).indexOf(k) >= 0, "   y traducen «" + k + "»");
  });
// El que más duele si se olvida: el motor da una campaña por completa comparando sus `missionIds`
// con los retos hechos del alumno, y ahí dentro hay identificadores de documento.
c(/if \(Array\.isArray\(x\.missionIds\)\)/.test(MOTOR),
  "🔴 missionIds se traduce: es lo que decide si un planeta está completo y paga su bonus");

// ---------------------------------------------------------------- m) el `id` no entra al documento
// 🔴 La lección más cara de la noche. GamificaPro lee TODOS sus documentos con
// `{ id: doc.id, ...doc.data() }`. Si el documento lleva dentro un campo `id`, ese campo PISA el
// identificador real y el motor entero empieza a hablar de «A1» donde el documento se llama
// «grupo__A1». El síntoma fue de los peores que hay: la misión se registraba correctamente y, acto
// seguido, la función reventaba con un «INTERNAL» mudo — al cerrar la campaña del planeta.
[["assets/js/motor.js", MOTOR], ["motor/sembrar.js", SEMBRAR]].forEach(function (par) {
  c(/const \{ id: _fuera, \.\.\.resto \} = x;/.test(par[1]),
    "🔴 " + par[0] + " quita el campo `id` antes de escribir el documento");
  c(par[1].indexOf("Object.assign({}, resto, conIdsDeDocumento") >= 0,
    "   y escribe el resto, nunca el objeto entero");
});

// El premio de una campaña se llama `xp_extra`, no `xp`. Con el nombre equivocado el bonus de
// planeta se concedía... a cero: la campaña se cerraba, los créditos entraban y los 150 xp no.
const PAQ = fs.readFileSync(path.join(__dirname, "..", "motor", "paquete.js"), "utf8");
c(/type: "xp_extra"/.test(PAQ), "🔴 el xp de una campaña se declara como «xp_extra», que es lo que el motor entiende");
c(!/type: "xp",/.test(PAQ), "   y nunca como «xp», que se ignora en silencio");
const TABL = fs.readFileSync(path.join(__dirname, "..", "motor", "tablero.js"), "utf8");
c(/x\.type === "xp_extra"/.test(TABL), "   y el traductor lo lee con el mismo nombre");

// ---------------------------------------------------------------- n) la puerta pública, por fuera
// 🔴 Esta batería vigila el fichero que vive en el OTRO repositorio (gamificapro/functions), y lo
// hace a propósito: es la única lectura de STARGATE que funciona sin sesión —la que sostiene los
// tableros incrustados en los Geniallys— y por tanto la única por la que se puede escapar algo.
//
// Se coló una vez: los escuadrones llevan los correos del profesorado (`assignedTeacherEmails`,
// que es como el motor sabe de quién es cada grupo) y el documento del proyecto viajaba entero.
// Lo cazó una comprobación a mano contra producción, no el banco. Por eso ahora está aquí.
const PUERTA = path.join("/Users/nor/Claude/vibewebs/gamificapro", "functions", "stargate.js");
if (fs.existsSync(PUERTA)) {
  const P = fs.readFileSync(PUERTA, "utf8");
  // Mirar el CÓDIGO, no los comentarios: aquí se habla justo de los campos que NO deben salir.
  const PC = sinComentarios(P);
  c(/const PUBLICO_DEL_PERFIL = \[/.test(P),
    "🔴 la puerta pública filtra los perfiles con una LISTA BLANCA");
  c(/const escuadronPublico = /.test(P),
    "🔴 y los escuadrones también: sin ella salían los correos del profesorado");
  c(PC.indexOf("assignedTeacherEmails") < 0,
    "   y `assignedTeacherEmails` no aparece por ninguna parte de lo que se devuelve");
  ["email", "firstName", "lastName", "coTeacherEmails", "panelEdit"].forEach(function (k) {
    c(PC.indexOf("'" + k + "'") < 0 && PC.indexOf('"' + k + '"') < 0,
      "   ni «" + k + "»");
  });
  c(/\(p\.data\(\)\.stargate \|\| \{\}\)\.version/.test(PC),
    "🔴 y solo contesta a grupos de STARGATE: si no, dejaría leer sin sesión cualquier proyecto de la plataforma");
} else {
  console.log("   (no encuentro gamificapro/functions/stargate.js: me salto la puerta pública)");
}

E.resumen("Las páginas del motor nuevo");
