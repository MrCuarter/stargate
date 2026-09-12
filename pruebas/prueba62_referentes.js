'use strict';
// 62 · QUIÉN MANDA EN UN GRUPO
//
// Norberto: «Profe referente, de forma vitalicia yo (n.cuartero.10@gmail.com). Desde la app tengo
// posibilidad de añadir a coprofesores referente en cada per o de forma general.»
//
// 🔴 LA TRAMPA QUE ESTO EVITA, y no es evidente: la tentación era comprobar el permiso en el
// navegador («¿eres tú? pues pasa»). No habría servido de nada. `misPERs` le pregunta a FIRESTORE
// por los proyectos donde tu correo está en `coTeacherEmails`, y esa pregunta la responde el
// SERVIDOR. Un permiso que solo viviera en la página le habría dejado ver la pantalla de «esta
// cuenta no lleva ningún grupo» con todos los permisos del mundo.
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
const fs = require("fs"), path = require("path");
const raiz = f => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
console.log("\n▶ 62 · Quién manda en un grupo");

const PAQ = require("../motor/paquete.js");
const cat = JSON.parse(raiz("motor/catalogo.json"));
const VIT = "n.cuartero.10@gmail.com";

// ---------------------------------------------------------------- a) el vitalicio, sin pedirlo
const sinEl = PAQ.paquete({
  nombre: "GRUPO SIN NORBERTO", tipo: "REGULAR", inicio: "2026-09-14",
  docentes: [{ nombre: "Ana", correo: "ana@unir.net", rol: "referente" }]
}, cat);
c(sinEl.proyecto.coTeacherEmails.indexOf(VIT) >= 0,
  "🔴 el referente vitalicio entra aunque NADIE le haya puesto en el equipo");
igual((sinEl.privado.docentes.filter(d => d.correo === VIT)[0] || {}).rol, "referente",
  "   y entra como referente, no como docente que imparte");
// Si contara como quien imparte, se llevaría un escuadrón con alumnado que no es suyo y ensuciaría
// el ranking de escuadrones desde el primer día.
igual(sinEl.proyecto.factions.length, 1,
  "🔴 pero NO se lleva escuadrón: los escuadrones son de quien da clase");

// ---------------------------------------------------------------- b) y si ya estaba puesto
const conEl = PAQ.paquete({
  nombre: "GRUPO CON NORBERTO", tipo: "REGULAR", inicio: "2026-09-14",
  docentes: [{ nombre: "Norberto Cuartero", correo: VIT, rol: "docente" }]
}, cat);
igual(conEl.privado.docentes.filter(d => d.correo === VIT).length, 1,
  "🔴 si ya estaba puesto a mano no se duplica");
igual((conEl.privado.docentes.filter(d => d.correo === VIT)[0] || {}).nombre, "Norberto Cuartero",
  "   se respeta el nombre con el que se le puso");
igual((conEl.privado.docentes.filter(d => d.correo === VIT)[0] || {}).rol, "referente",
  "🔴 pero el rol de referente no se le puede quitar, ni queriendo");

// ---------------------------------------------------------------- c) por qué va en el documento
const paq = raiz("motor/paquete.js");
c(/REFERENTES_VITALICIOS\s*=\s*\[/.test(paq) && /n\.cuartero\.10@gmail\.com/.test(paq),
  "🔴 están en el CÓDIGO, no en un ajuste que se pueda borrar sin querer");
// 🔴 La segunda cuenta es la de la UNIVERSIDAD: es la dueña del material y la que tiene que poder
// resolver cualquier lío sin depender de que Norberto esté disponible. Con «mantenimiento 0
// mientras estoy de baja», tener una sola llave para todo el sistema era el punto único de fallo.
c(/mutecdgami@gmail\.com/.test(paq), "🔴 y son DOS: la de Norberto y la de la universidad");
const conDos = PAQ.paquete({ nombre: "DOS MANDOS", tipo: "REGULAR", inicio: "2026-09-14",
  docentes: [{ nombre: "Ana", correo: "ana@unir.net", rol: "docente" }] }, cat);
c(conDos.proyecto.coTeacherEmails.indexOf("mutecdgami@gmail.com") >= 0,
  "   mutecdgami entra en todos los grupos");
igual(conDos.proyecto.factions.length, 1,
  "🔴 y las dos juntas siguen sin llevarse escuadrón: solo lo tiene quien imparte");
c(/coTeacherEmails: conVitalicio\(/.test(paq),
  "🔴 y se escribe en coTeacherEmails, que es lo que mira Firestore para dejar entrar");

// ---------------------------------------------------------------- d) los co-referentes
const motor = raiz("assets/js/motor.js");
c(/async function anadirDocente/.test(motor),
  "🔴 se puede añadir a alguien al equipo DESPUÉS de crear el grupo (antes era irreversible)");
c(/coTeacherEmails: correos/.test(motor) && /docentes/.test(motor),
  "🔴 y se escribe en los DOS sitios: Firestore deja entrar, la interfaz enseña nombre y rol");
c(/async function referenteEnTodos/.test(motor),
  "y existe el «de forma general»: referente de todos sus grupos");
c(/hechos, fallos/.test(motor) || /fallos: fallos/.test(motor) || /return \{ hechos, fallos \}/.test(motor),
  "🔴 que informa de en cuáles NO ha podido: creer que alguien tiene acceso a ocho grupos teniéndolo a seis es peor que el fallo");
c(/anadirDocente, referenteEnTodos/.test(motor), "las dos salen del motor");

// ---------------------------------------------------------------- e) y se pueden usar
const con = raiz("assets/js/consola.js");
contiene(con, 'id="e-add"', "la consola tiene el botón de añadir al equipo");
contiene(con, 'id="e-todos"', "   y el de hacerle referente de todos los grupos");
c(/confirm\(/.test(con.slice(con.indexOf('#e-todos"\\).onclick') >= 0 ? con.indexOf('#e-todos') : 0)),
  "🔴 y lo de «todos» se confirma: da acceso a los correos y los ajustes de TODOS los grupos");

E.resumen("Quién manda en un grupo");
