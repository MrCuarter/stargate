'use strict';
// 50 · PASAR LOS ALUMNOS DE UN DOCENTE A OTRO
// Norberto, 11-sep: «a veces entran profesores a mitad de per o abandonan unos por lo que sea».
//
// Quitar a alguien del equipo docente siempre fue fácil. Lo que no lo era: sus alumnos seguían con
// su nombre puesto en la Bitácora, y arreglarlo iba de uno en uno desde la ficha. Con 20 alumnos es
// un rato tonto que además nadie hace hasta que algo se ve raro semanas después.
//
// Y había un segundo agujero, más callado: el desplegable «¿Quién imparte tu clase?» del formulario
// de la Bitácora seguía ofreciendo al docente que se fue. El del ticket sí se refrescaba al guardar
// el equipo; el de la Bitácora no, y es justo el que ata cada alumno a su docente. Hacía falta
// acordarse de correr «Actualizar formularios» (6 minutos) para que se enterara.
const E = require("./entorno.js");
const { comprobar: c, igual } = E;
const fs = require("fs"), path = require("path");
console.log("\n▶ 50 · Pasar los alumnos de un docente a otro");

const G = E.nuevoMundo();
E.crearPERDemo(G);
const PER = "prueba-banco", PIN = "0000", PINREF = "12345678";
G.PropertiesService.getScriptProperties().setProperty("PIN_PROFES", PIN);
G.PropertiesService.getScriptProperties().setProperty("PIN_REFERENTE", PINREF);
const api = b => JSON.parse(G.doPost({ postData: { contents: JSON.stringify(b) } }).getContent());
const reclutas = () => G.tablero_(PER, true).reclutas;
const deQuien = n => reclutas().filter(r => String(r.profe || "").trim() === n).length;

// tres alumnos de «Mr Cuarter» y uno de «Norberto Genially»
["ana@alumno.es", "luis@alumno.es", "eva@alumno.es"].forEach(function (m) {
  E.enviarBitacora(G, PER, { email: m, alias: m.split("@")[0], profe: "Mr Cuarter" });
});
E.enviarBitacora(G, PER, { email: "ivan@alumno.es", alias: "ivan", profe: "Norberto Genially" });

igual(deQuien("Mr Cuarter"), 3, "de partida, tres alumnos declaran a Mr Cuarter");
igual(deQuien("Norberto Genially"), 1, "y uno a Norberto Genially");

// ---------------------------------------------------------------- a) el traspaso mueve a TODOS
const r = api({ accion: "traspasar", per: PER, de: "Mr Cuarter", a: "Norberto Genially", pin: PINREF });
igual(r.cambiados, 3, "🔴 pasan los tres de una vez");
igual(deQuien("Mr Cuarter"), 0, "   y no queda ninguno en el de origen");
igual(deQuien("Norberto Genially"), 4, "   los cuatro quedan en el de destino (1 suyo + 3 que llegan)");

// ---------------------------------------------------------------- b) no se lleva por delante a nadie más
// El fallo que estaría esperando: escribir la columna entera en vez de solo las filas que tocan.
E.enviarBitacora(G, PER, { email: "sara@alumno.es", alias: "sara", profe: "Norberto Cuartero" });
const r2 = api({ accion: "traspasar", per: PER, de: "Nadie Que Existe", a: "Norberto Genially", pin: PINREF });
igual(r2.cambiados, 0, "traspasar a alguien sin alumnos no cambia nada");
igual(deQuien("Norberto Cuartero"), 1, "🔴 y quien no estaba en el traspaso sigue con su docente");

// ---------------------------------------------------------------- c) se escribe donde está el dato
// La pestaña ALUMNADO es una VISTA: se regenera. Si el traspaso escribiera ahí, al primer refresco
// volvería el nombre viejo y nadie entendería por qué.
const gs = fs.readFileSync(path.join(__dirname, "..", "apps-script", "Code.gs"), "utf8");
const fn = gs.slice(gs.indexOf("function traspasarDocente_"), gs.indexOf("function sincronizarDocentesBitacora_"));
c(/o\.tabB/.test(fn), "🔴 el traspaso escribe en la pestaña de la BITÁCORA, que es la fuente");
c(/alumnado_\(\)/.test(fn), "   y regenera ALUMNADO después, que es una vista de eso");

// ---------------------------------------------------------------- d) protecciones de bulto
["", null].forEach(function (v) {
  let salto = false;
  try { G.traspasarDocente_(PER, v, "Norberto Genially"); } catch (e) { salto = true; }
  c(salto, "🔴 sin docente de origen no se hace nada (lo habría puesto a TODOS)");
});
let mismo = false;
try { G.traspasarDocente_(PER, "Norberto Genially", "Norberto Genially"); } catch (e) { mismo = true; }
c(mismo, "pasar a alguien a sí mismo se rechaza en vez de hacer un trabajo inútil");

// ---------------------------------------------------------------- e) es cosa del referente
c(!!api({ accion: "traspasar", per: PER, de: "x", a: "y", pin: PIN }).error,
  "🔴 con el PIN del día a día NO se puede: reasignar alumnos afecta al grupo entero");
c(/"traspasar"/.test(gs.slice(gs.indexOf("var ACCIONES_REFERENTE"), gs.indexOf("var ACCIONES_REFERENTE") + 200)),
  "   y está declarado como acción de referente, no por casualidad");

// ---------------------------------------------------------------- f) el formulario se entera solo
c(/function sincronizarDocentesBitacora_/.test(gs),
  "🔴 hay una función que refresca el desplegable «¿Quién imparte tu clase?» de la Bitácora");
// 🔴 anclado al MANEJADOR de la acción, no a la primera aparición del texto: «a === "profesorado"»
// también sale en trazaReferente_, 150 líneas antes, y ahí no hay nada de esto.
const _ini = gs.indexOf('else if (a === "profesorado") { var p = perFila_');
const accion = gs.slice(_ini, _ini + 2400);
c(/sincronizarDocentesBitacora_\(per/.test(accion),
  "🔴 y se llama al GUARDAR el equipo: antes había que acordarse de «Actualizar formularios»");
c(/formTicketEdit/.test(accion), "   el del ticket se sigue refrescando también");
c(/huerfanos/.test(accion),
  "y se devuelve quién se ha quedado fuera con alumnos a su nombre, para poder ofrecer el traspaso");

// ---------------------------------------------------------------- g) y el panel lo ofrece
const pj = fs.readFileSync(path.join(__dirname, "..", "assets", "js", "profes.js"), "utf8");
c(/function traspaso\(/.test(pj), "el panel del referente ofrece el traspaso al guardar el equipo");
c(/accion:'traspasar'/.test(pj), "   y llama a la acción");
c(/dejar\\nvacío para no tocar nada|vacío para no tocar nada/.test(pj),
  "🔴 y se puede decir que no: quizá el docente vuelve la semana que viene");
c(/siguen \+h\.alumnos|h\.alumnos\+' alumno/.test(pj),
  "el aviso dice CUÁNTOS alumnos hay detrás: sin ese número no se puede decidir");

E.resumen("Pasar los alumnos de un docente a otro");
