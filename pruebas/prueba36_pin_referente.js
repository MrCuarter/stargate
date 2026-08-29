'use strict';
// 36 · EL PIN DE REFERENTE  (petición de Norberto, 27-ago · opción A)
//
// Hasta hoy el rol de referente no protegía NADA: solo ordenaba la vista. Cualquiera con el PIN del
// profesorado podía abrir el panel de cualquier grupo y mover la semana 1 —que recalcula y reprograma
// TODO el calendario—, archivar el PER, cerrar los formularios o reescribir el equipo docente. Son
// acciones que afectan a todo el alumnado de un grupo y estaban al alcance de quien solo tenía que
// aplicar una nota.
//
// La forma decidida: un solo PIN en pantalla, dos niveles resueltos en el servidor. Y la regla que
// permite desplegarlo a mitad de curso sin avisar a nadie: si PIN_REFERENTE no está configurado,
// TODO funciona exactamente como hasta hoy.
//
// 🔴 Lo comprueba el SERVIDOR. Esconder la pestaña de Ajustes en el JS es cortesía, no seguridad:
// cualquiera con la consola del navegador hace la llamada igual.
const fs = require("fs"), path = require("path");
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
const M = E.M;
console.log("\n▶ 36 · El PIN de referente");

const PER = "prueba-banco";
const DOCENTE = "sg2026docente", REFERENTE = "sg2026-referente-largo";

// Las 17 acciones con PIN, repartidas. Escritas AQUÍ a mano a propósito: si mañana alguien añade una
// acción nueva a doPost y no decide su nivel, el apartado (g) lo caza.
const DIA_A_DIA = ["pers","alumnos","tickets","ticket_resuelto","ficha","ajuste","entregado",
                   "pase_abrir","pase_estado","mi_panel"];
const RESERVADAS = ["profesorado","inicio","abrir","cerrar","archivar","panel","documento"];

function mundo(pinDocente, pinReferente) {
  const G = E.nuevoMundo();
  E.crearPERDemo(G);
  if (pinDocente) M.Props.getScriptProperties().setProperty("PIN_PROFES", pinDocente);
  if (pinReferente) M.Props.getScriptProperties().setProperty("PIN_REFERENTE", pinReferente);
  G._post = q => JSON.parse(G.doPost({ postData: { contents: JSON.stringify(q) } }).getContent());
  return G;
}
// Lo que se prueba es LA PUERTA, no que la acción termine bien con parámetros de juguete: basta con
// que el rechazo no venga del PIN.
function pasaLaPuerta(G, accion, pin) {
  const r = G._post(Object.assign({ accion: accion, per: PER, pin: pin }, ARGS[accion] || {}));
  return !/PIN incorrecto|profesor referente/.test(String(r.error || ""));
}
const ARGS = {
  ticket_resuelto: { fila: 2, valor: false }, entregado: { fila: 2, valor: false },
  ficha: { email: "ana@alumno.es", alias: "Ana" }, ajuste: { email: "ana@alumno.es", reto_id: "T1R1", tipo: "otorgar" },
  mi_panel: { profe: "Mr Cuarter", url: "https://panel.example" }, pase_abrir: { profe: "Mr Cuarter", minutos: 5 },
  profesorado: { referente: "Norberto Cuartero", profesorado: "Mr Cuarter" },
  inicio: { inicio: E.iso(E.haceSemanas(2)) }, archivar: { valor: false },
  panel: { ver: "https://ver.example", editar: "" }
};

// ---------------------------------------------------------------- a) SIN PIN de referente: como hoy
// Esto es lo que permite desplegar a mitad de curso sin llamar a nadie por teléfono. Y es lo que más
// fácil se rompe sin querer al añadir el nivel nuevo.
let G = mundo(DOCENTE, "");
E.enviarBitacora(G, PER, { email: "ana@alumno.es", alias: "Ana", profe: "Mr Cuarter" });
let fuera = DIA_A_DIA.concat(RESERVADAS).filter(a => !pasaLaPuerta(G, a, DOCENTE));
igual(fuera, [], "🔴 sin PIN_REFERENTE configurado, las 17 acciones siguen abiertas con el PIN de siempre");
igual(G._post({ accion: "pers", pin: DOCENTE }).nivel, "referente",
  "y el nivel que se devuelve lo dice: mientras no haya PIN de referente, el de siempre lo abre todo");
igual(G._post({ accion: "pers", pin: "otro" }).error, "PIN incorrecto", "un PIN inventado sigue sin entrar");

// ---------------------------------------------------------------- b) CON PIN de referente: se cierra
G = mundo(DOCENTE, REFERENTE);
E.enviarBitacora(G, PER, { email: "ana@alumno.es", alias: "Ana", profe: "Mr Cuarter" });

const coladas = RESERVADAS.filter(a => pasaLaPuerta(G, a, DOCENTE));
igual(coladas, [], "🔴 con el PIN de docente, las 7 acciones de grupo entero quedan cerradas");
const bloqueadas = DIA_A_DIA.filter(a => !pasaLaPuerta(G, a, DOCENTE));
igual(bloqueadas, [], "🔴 y el día a día NO se toca: las 10 de siempre siguen funcionando con el PIN de docente");
const cerradasAlJefe = DIA_A_DIA.concat(RESERVADAS).filter(a => !pasaLaPuerta(G, a, REFERENTE));
igual(cerradasAlJefe, [], "con el PIN de referente pasan las 17");

// el mensaje tiene que decir QUÉ hacer, no solo que no
const negado = G._post({ accion: "cerrar", per: PER, pin: DOCENTE });
contiene(negado.error, "referente", "🔴 y el «no» explica de quién es esa tecla");
igual(G._post({ accion: "pers", pin: DOCENTE }).nivel, "docente", "la respuesta lleva el nivel, para que la web se adapte sola");
igual(G._post({ accion: "pers", pin: REFERENTE }).nivel, "referente", "y con el otro PIN, el nivel alto");

// ---------------------------------------------------------------- c) y el cierre es de verdad
// No basta con que devuelva error: lo que no puede pasar es que el efecto se aplique igual.
igual(G.perObj_(G.perFila_(PER).v).archivado, "", "el PER no estaba archivado");
G._post({ accion: "archivar", per: PER, pin: DOCENTE, valor: true });
igual(G.perObj_(G.perFila_(PER).v).archivado, "", "🔴 el docente NO lo archiva: el rechazo no es cosmético");
G._post({ accion: "archivar", per: PER, pin: REFERENTE, valor: true });
c(String(G.perObj_(G.perFila_(PER).v).archivado || "") !== "", "y el referente sí");

const antes = String(G.perObj_(G.perFila_(PER).v).inicio);
G._post({ accion: "inicio", per: PER, pin: DOCENTE, inicio: E.iso(E.haceSemanas(1)) });
igual(String(G.perObj_(G.perFila_(PER).v).inicio), antes,
  "🔴 ni mueve la semana 1, que es la que reprograma TODO el calendario del grupo");

// ---------------------------------------------------------------- d) ninguna acción sin nivel decidido
// Un colador con fecha: el día que alguien añada una acción a doPost y se olvide de clasificarla,
// entraría con el PIN de docente sin que nadie lo mirara.
const fuente = fs.readFileSync(process.env.STARGATE_GS ||
  path.join(__dirname, "..", "apps-script", "Code.gs"), "utf8");
const tramo = fuente.slice(fuente.indexOf("nivelDePin_(q.pin)"), fuente.indexOf('Acci') );
const enElCodigo = {};
(tramo.match(/a === "([a-z_]+)"/g) || []).forEach(x => { enElCodigo[x.match(/"([a-z_]+)"/)[1]] = true; });
const sinClasificar = Object.keys(enElCodigo).filter(a => DIA_A_DIA.indexOf(a) < 0 && RESERVADAS.indexOf(a) < 0);
igual(sinClasificar, [], "🔴 toda acción de doPost tiene su nivel decidido (si esto falla, hay una nueva sin clasificar)");
igual(Object.keys(enElCodigo).length, 17, "y siguen siendo 17");

// ---------------------------------------------------------------- e) queda traza de quién tocó qué
// Con dos niveles, saber quién recalendarizó o archivó deja de ser opcional.
G = mundo(DOCENTE, REFERENTE);
G._post({ accion: "inicio", per: PER, pin: REFERENTE, inicio: E.iso(E.haceSemanas(3)), profe: "Norberto Cuartero" });
G._post({ accion: "archivar", per: PER, pin: REFERENTE, valor: true, profe: "Norberto Cuartero" });
// v3.36 · se lee por registros_(), la puerta única: la segunda acción de esta prueba es ARCHIVAR, y
// archivar MUEVE los registros del grupo a «AJUSTES ARCHIVADOS». Mirando solo la pestaña viva, media
// traza habría desaparecido — que es justo lo que no puede pasar con un registro de quién tocó qué.
// Se ordena por NOMBRE, no por fecha: las dos filas se escriben en el mismo milisegundo y ordenar
// por hora aquí sería tirar una moneda al aire cada vez que se ejecuta el banco.
const trazaDe = () => G.registros_(G.H.AJ, PER).filter(v => v[3] === "REFERENTE");
const traza = trazaDe();
igual(traza.length, 2, "🔴 cada acción de referente deja su fila en AJUSTES");
igual(traza.map(v => v[4]).sort(), ["archivar", "inicio"], "con la acción");
c(traza.every(v => v[6] === "Norberto Cuartero"), "y con quién la hizo");
c(traza.every(v => !/@/.test(String(v[5]))), "sin arrastrar correos al motivo (la exportación de investigación va seudonimizada)");
// 🔴 y lo importante del archivo: la traza NO se pierde al mudarse, solo cambia de pestaña
igual(G.hoja_(G.H.AJA).getDataRange().getValues().slice(1).filter(v => v[4] === "inicio").length, 1,
  "🔴 archivar MUEVE la traza al archivo, no la borra");
igual(G.hoja_(G.H.AJ).getDataRange().getValues().slice(1).filter(v => v[1] === PER && v[4] === "inicio").length, 0,
  "y deja de estorbar en la pestaña viva, que es de lo que se trataba");
// y lo que NO se hizo no deja rastro: si no, el registro miente
G._post({ accion: "cerrar", per: PER, pin: DOCENTE });
igual(trazaDe().length, 2,
  "🔴 lo rechazado no se apunta: el registro cuenta lo que PASÓ, no lo que se intentó");

// ---------------------------------------------------------------- f) los dos PIN iguales
// Si coinciden no hay separación ninguna, y la sensación de seguridad sería falsa. No se puede
// impedir por las bravas (alguien puede escribirlos a mano en las propiedades del script), así que:
// nadie se queda fuera —manda el nivel alto, o sea como hoy— y el parte de salud lo canta en rojo.
G = mundo("mismopin7", "mismopin7");
igual(G._post({ accion: "pers", pin: "mismopin7" }).nivel, "referente",
  "si alguien los deja iguales, nadie se queda fuera (se comporta como antes del cambio)");
let s = G.salud_();
const pt = k => s.puntos.filter(x => x.clave === k)[0] || {};
igual(pt("pin").nivel, "mal", "🔴 pero el parte de salud lo canta: dos PIN iguales no separan nada");
contiene(pt("pin").detalle.toLowerCase(), "iguales", "y dice exactamente qué pasa");

// el menú tampoco deja guardarlo así
G = mundo(DOCENTE, REFERENTE);
M.UI.limpiar(); M.UI.responder(DOCENTE);
G.cambiarPinReferente();
igual(M.Props.getScriptProperties().getProperty("PIN_REFERENTE"), REFERENTE,
  "🔴 el menú NO guarda un PIN de referente igual al de docente");
c(M.UI.avisos.join(" ").indexOf("mismo") >= 0 || M.UI.avisos.join(" ").indexOf("igual") >= 0,
  "y lo dice en vez de callarse");
M.UI.limpiar(); M.UI.responder("otro-pin-largo-de-verdad");
G.cambiarPinReferente();
igual(M.Props.getScriptProperties().getProperty("PIN_REFERENTE"), "otro-pin-largo-de-verdad",
  "uno distinto sí se guarda");

// ---------------------------------------------------------------- g) el parte de salud mira los dos
G = mundo(DOCENTE, "");
s = G.salud_();
igual(pt("pin").nivel, "aviso", "sin PIN de referente el parte avisa (en ámbar: se sigue pudiendo trabajar)");
contiene(pt("pin").arreglo, "referente", "y dice por dónde se pone");

G = mundo(DOCENTE, "corto");
s = G.salud_();
igual(pt("pin").nivel, "mal", "🔴 y un PIN de referente corto es rojo: abre las acciones destructivas");

G = mundo(DOCENTE, REFERENTE);
s = G.salud_();
igual(pt("pin").nivel, "ok", "con los dos puestos, distintos y largos, verde");
contiene(pt("pin").detalle, "referente", "y el detalle nombra a los dos");

// ---------------------------------------------------------------- h) la pantalla de «¿quién eres?»
// Para pintar un desplegable de nombres sobra el correo de todo el profesorado. El doGet público ya
// los filtraba; «pers» los mandaba enteros.
G = mundo(DOCENTE, REFERENTE);
const pers = G._post({ accion: "pers", pin: REFERENTE }).pers;
igual(pers[0].docentes.length, 3, "«pers» sigue trayendo el equipo docente");
c(pers[0].docentes.every(d => !!d.nombre), "con sus nombres, que es lo que pinta el desplegable");
c(pers[0].docentes.every(d => d.correo === undefined), "🔒 pero ya no con los correos: para un desplegable no hacen falta");
c(!/@/.test(JSON.stringify(pers)), "🔒 y en toda la respuesta no viaja ni una dirección");
// donde SÍ hacen falta —la pantalla de ajustes del PER— siguen llegando
c(!!G._post({ accion: "alumnos", per: PER, pin: REFERENTE }).docentes_full[0].correo,
  "los Ajustes del PER siguen recibiéndolos: ahí se editan");

E.resumen("El PIN de referente");
