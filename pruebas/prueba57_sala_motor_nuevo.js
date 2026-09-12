'use strict';
// 57 · LA SALA DEL DOCENTE, EN EL MOTOR NUEVO
//
// Hasta el 12-sep esta sala enseñaba un cartel —«todavía no habla con el motor nuevo»— y mandaba a
// la consola. Parecían trece traducciones pendientes (otorgar, anular, fichas, tickets, pases…) y
// era UNA sola cosa: todas las peticiones entran por el mismo buzón que usa el alumnado, y ese buzón
// empieza buscando la ficha de recluta de quien pregunta. Un docente no tiene ficha en su propio
// grupo, así que recibía «todavía no te has alistado» a absolutamente todo.
//
// 🔴 Esta batería existe para que ese orden no se pierda en una refactorización distraída: si el
// desvío del profesorado vuelve a quedar POR DEBAJO de la búsqueda de ficha, la sala se apaga otra
// vez y no da ningún error que se vea — contesta una frase que no viene a cuento.
const E = require("./entorno.js");
const { comprobar: c, igual } = E;
const fs = require("fs"), path = require("path");
const js = f => fs.readFileSync(path.join(__dirname, "..", "assets", "js", f), "utf8");
console.log("\n▶ 57 · La sala del docente, en el motor nuevo");

const F = js("fuente.js"), SALA = js("clase.js");
const TAB = fs.readFileSync(path.join(__dirname, "..", "motor", "tablero.js"), "utf8");

// ---------------------------------------------------------------- a) el orden, que es todo
const iDocente = F.indexOf("if (DOCENTE[cuerpo.accion])");
const iFicha = F.indexOf("return miFicha(M, cuerpo.per, yo).then(function (ficha) {");
c(iDocente > 0, "el buzón desvía lo del profesorado antes de nada");
c(iFicha > 0 && iDocente < iFicha,
  "🔴 y ese desvío va ANTES de buscar la ficha de recluta: al revés, un docente recibe «todavía no te has alistado» a todo");

// ---------------------------------------------------------------- b) están las trece, o se dicen
// Las que no se han migrado tienen que APAGARSE A LA VISTA, no fallar al pulsarlas. Un botón que
// revienta enseña un error de programador a un docente en mitad de una clase.
const PIDE = ["pers", "alumnos", "ficha", "ajuste", "mi_panel", "pendientes", "pendiente_resolver",
              "entregado", "canje_revertir"];
PIDE.forEach(function (a) {
  c(new RegExp("\\b" + a + ": function \\(M").test(F), "el motor nuevo sabe hacer «" + a + "»");
  c(SALA.indexOf("accion:'" + a + "'") >= 0, "   y la sala se lo pide");
});
c(/if\(NUEVO\) return .*apagado/.test(SALA.replace(/\n\s*/g, " ")),
  "🔴 el pase de lista se apaga A LA VISTA en el motor nuevo, no falla al pulsarlo");
c(/puerta propia en el\s+\/\/ servidor|puerta propia en el/.test(SALA),
  "   y se dice POR QUÉ: la palabra tiene que comprobarse sin poder leerse antes");

// ---------------------------------------------------------------- c) lo privado, por la puerta privada
// 🔴 El fallo que costó una prueba en falso: `FUENTE.tablero(per, fresco)` sale por la puerta
// PÚBLICA —la que usan los Geniallys proyectados, sin sesión— y su segundo argumento es «sáltate la
// caché», NO «tráeme lo privado». Pedirle correos devuelve fichas sin correo y sin identificador, en
// silencio, y el primer `ajuste` contesta «esa ficha no trae identificador».
c(/var tableroPrivado = function \(M, per\)/.test(F), "hay una lectura aparte para lo privado");
c(/tableroPrivado[\s\S]{0,200}M\.leerPER\(per, true\)/.test(F),
  "🔴 que lee Firestore con la sesión del docente, no la puerta pública");
const cuerpoDoc = F.slice(F.indexOf("var DOCENTE = {"), F.indexOf("    return {\n      nombre: \"firestore\""));
c(cuerpoDoc.indexOf("FUENTE.tablero(") < 0,
  "🔴 y NINGUNA acción del profesorado usa la puerta pública para datos privados");

// ---------------------------------------------------------------- d) lo que la sala manda de vuelta
// Revertir un canje o marcarlo entregado exige poder nombrarlo. En la hoja era el número de fila; en
// Firestore es el identificador del vale, y se sigue llamando `fila` porque la sala lo devuelve tal
// cual: renombrarlo obligaría a tocar la sala sin ganar nada.
c(/fila: v\.id/.test(TAB), "🔴 cada canje viaja con su identificador, o no se puede revertir");
c(/res\.pendientes = \(datos\.vales \|\| \[\]\)/.test(TAB),
  "la cola de nota la calcula el traductor, en un solo sitio");
const iPend = TAB.indexOf("res.pendientes"), iPriv = TAB.indexOf("if (conPrivados) {");
c(iPriv > 0 && iPend > iPriv, "🔴 y vive en la rama PRIVADA: lleva correos y nombres");
["fila", "email", "alias", "recompensa", "coste", "saldo"].forEach(function (k) {
  c(new RegExp("\\b" + k + ":").test(TAB.slice(iPend, iPend + 900)),
    "   cada pendiente trae «" + k + "», que es lo que pinta la sala");
});
c(/out\.uid = p\.userId/.test(TAB), "el uid ata a cada recluta con sus vales");
const iUid = TAB.indexOf("out.uid = p.userId");
c(iUid > TAB.indexOf("out.ficha = p.id") && iUid < TAB.indexOf("lista.sort("),
  "🔴 y va en la rama privada: identifica a una persona y no sale del puesto de mando");

// ---------------------------------------------------------------- e) la puerta: cuenta, no PIN
// Un PIN compartido identifica al GRUPO, no a la persona: quien lo tuviera podía escribir el correo
// de un compañero y entrar en su sala. Con la cuenta no hay nada que escribir.
c(/function puertaNueva\(\)/.test(SALA), "con el motor nuevo la sala tiene su propia puerta");
c(/if\(NUEVO\)\{ document\.addEventListener\('sg:sesion'/.test(SALA),
  "🔴 que se usa en vez del PIN, y se entera si alguien cambia de cuenta");
const iPuerta = SALA.indexOf("if(NUEVO){ document.addEventListener('sg:sesion'");
c(iPuerta > 0 && iPuerta < SALA.indexOf("if(st.pin||st.demo)inicio();"),
  "   y se decide ANTES de llegar al PIN de siempre");
c(/st\.correo=u\.correo/.test(SALA),
  "🔴 el correo lo pone la sesión, no el teclado: no hay correo ajeno que escribir");
const html = fs.readFileSync(path.join(__dirname, "..", "clase.html"), "utf8");
c(!/Entra con el PIN/.test(html), "🔴 y la portada de la sala ya no promete un PIN que no se pide");
c(/Entra con tu cuenta de Google/.test(html), "   sino la cuenta");
c(/sistema anterior sigue pidiéndose el PIN/.test(html),
  "   diciendo que en los grupos viejos sigue siendo el de siempre");

// ---------------------------------------------------------------- f) el nombre con el que se firma
// Los ajustes quedan anotados con el nombre del docente. Ese nombre sale del CORREO de la sesión,
// no de un desplegable: si se eligiera de una lista, cualquiera podría firmar como un compañero.
c(/String\(d\.correo \|\| ""\)\.toLowerCase\(\) === yo\.correo/.test(F),
  "🔴 el nombre del docente se deduce de su correo, no se elige de una lista");
c(/privado", "stargate"/.test(F),
  "   y si el listado no lo trae, se busca en `privado`, que solo lee el profesorado");

// ---------------------------------------------------------------- g) los tickets, que son otra cosa
// 🔴 El ticket de salida es la ÚNICA pieza que no se ha mudado, y es a propósito: tiene que ser
// anónimo y el motor guarda quién completa cada cosa suya. Sus respuestas viven en una hoja, y una
// hoja no se lee desde una página sin abrirla al mundo. Por eso la hoja lleva su propio lector.
const TK = js("tickets.js");
const LECTOR = fs.readFileSync(path.join(__dirname, "..", "apps-script", "LectorTickets.gs"), "utf8");
c(/function doGet\(e\)/.test(LECTOR) && /function doPost\(e\)/.test(LECTOR),
  "el lector de la hoja contesta a GET y a POST");
["pers", "tickets", "ticket_resuelto"].forEach(function (a) {
  c(new RegExp('a === "' + a + '"').test(LECTOR), "   y sabe hacer «" + a + "»");
});
c(/if \(g && cGrupo >= 0 && String\(v\[i\]\[cGrupo\]/.test(LECTOR),
  "🔴 filtra por grupo EN EL SERVIDOR: si filtrara la página, cualquier docente vería las dudas de los grupos de sus compañeros");
c(LECTOR.indexOf("getEmail") < 0 && !/correo|email/i.test(LECTOR.split("function ticketsDe_")[1].split("}")[0]),
  "🔴 y no toca ningún correo: anónimo es anónimo");

c(/function sinLector\(\)/.test(TK), "el panel sabe qué hacer cuando el lector no está desplegado");
c(/El panel todavía no lee esta hoja/.test(TK),
  "🔴 y lo DICE, en vez de pintar un panel vacío que parecería «tu clase no ha contestado nada»");
c(/SG_TICKETS_HOJA/.test(TK), "   dando el enlace a la hoja, para que no se pierda nada mientras tanto");
c(/if\(NUEVO\) \{ if\(LECTOR\) inicio\(\); else sinLector\(\); \}/.test(TK),
  "🔴 y con el motor nuevo no pide PIN: una credencial para una puerta que no lleva a ningún sitio");
const tkhtml = fs.readFileSync(path.join(__dirname, "..", "tickets.html"), "utf8");
c(/window\.SG_TICKETS_API=/.test(tkhtml) && /window\.SG_TICKETS_HOJA=/.test(tkhtml),
  "y la página lleva las dos direcciones puestas por la construcción, no escritas a mano");

// 🔴 Y el lector, desplegado. Mientras `TICKETS_API` esté vacío el panel degrada bien —eso se
// comprueba arriba—, pero una vez puesto tiene que ser una dirección de aplicación web de verdad:
// un `/dev` en vez de un `/exec` solo funciona para quien tenga sesión de Google, y el panel lo
// abren docentes desde su navegador sin más.
const DATOS2 = fs.readFileSync(path.join(__dirname, "..", "_site_data.py"), "utf8");
const mAPI = DATOS2.match(/TICKETS_API = \(([\s\S]*?)\)\n/);
const API = mAPI ? (mAPI[1].match(/"([^"]*)"/g) || []).map(x => x.slice(1, -1)).join("") : "";
if (API) {
  c(/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(API),
    "🔴 TICKETS_API es una aplicación web publicada (/exec), no el enlace de pruebas (/dev)");
  c(tkhtml.indexOf(API) > 0, "   y llega entera a tickets.html");
} else {
  c(true, "TICKETS_API todavía sin desplegar: el panel lo dice y da la hoja (comprobado arriba)");
}

E.resumen("La sala del docente, en el motor nuevo");
