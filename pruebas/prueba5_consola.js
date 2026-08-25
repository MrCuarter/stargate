'use strict';
// 5 · La Consola del profesorado (segunda hoja) y DATOS/RESUMEN
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
console.log("\n▶ 5 · Consola del profesorado y DATOS/RESUMEN");

const G = E.nuevoMundo();
E.crearPERDemo(G);
const PER = "prueba-banco";
const RET = G.retosDe_("REGULAR");
const col = t => "Tema " + t + " · Lo que he completado";

E.enviarBitacora(G, PER, { email: "a@alumno.es", alias: "Aa", nombre: "A A", profe: "Mr Cuarter" });
E.enviarBitacora(G, PER, { email: "b@alumno.es", alias: "Bb", nombre: "B B", profe: "Norberto Genially" });
E.enviarBitacora(G, PER, { email: "c@alumno.es", alias: "Cc", nombre: "C C", profe: "" });   // sin docente
E.enviarBitacora(G, PER, { email: "a@alumno.es", marcados: { [col(1)]: RET.filter(r => r[4] === 1).map(r => r[1]).join(", ") } }, 2);

// un canje de nota pendiente de aplicar
for (let i = 0; i < 3; i++) G.hoja_("AJUSTES").appendRow([new Date(), PER, "a@alumno.es", "Z" + i, "otorgar", "", "banco"]);
G.hoja_("EVENTOS").appendRow([new Date(), PER, "a@alumno.es", "Aa", "XF", "final", 9, 500, "formulario"]);
const rc = E.enviarCanje(G, PER, { email: "a@alumno.es", recompensa: E.etiqueta(G, "Subir 0,5 en un entregable"), actividad: "Actividad 1 · imagen con IA" });
igual(rc.estado, "Concedido", "el canje de nota queda concedido y pendiente de aplicar");

const url = G.actualizarConsola();
c(/spreadsheets/.test(url), "la consola devuelve la URL de su archivo");
const consola = E.M.Libro.registro[G.PropertiesService ? "" : ""] || null;
const id = require("./mocks.js").Props.getScriptProperties().getProperty("CONSOLA_ID");
c(!!id, "el id de la consola queda guardado en las propiedades del script");
const ss = E.M.Libro.registro[id];
c(!!ss, "y el archivo existe");

const portada = ss.getSheetByName("PORTADA");
c(!!portada, "hay una PORTADA");
const cab = portada.getRange(5, 1, 1, portada.getLastColumn()).getValues()[0].map(String);
["id", "Grupo", "Reclutas", "Pendientes de aplicar", "Equipo docente", "Sala de clase"].forEach(k =>
  c(cab.indexOf(k) >= 0, "la portada tiene la columna «" + k + "»"));
const fila = portada.getRange(6, 1, 1, cab.length).getValues()[0];
igual(fila[cab.indexOf("id")], PER, "la portada lista el PER");
igual(fila[cab.indexOf("Reclutas")], 3, "con sus 3 reclutas");
igual(fila[cab.indexOf("Pendientes de aplicar")], 1, "y 1 canje pendiente de aplicar");
contiene(fila[cab.indexOf("Equipo docente")], "n.cuartero.10@gmail.com", "y el equipo docente con correos");
contiene(fila[cab.indexOf("Equipo docente")], "★", "marcando al referente");

const pes = ss.getSheetByName("PER · " + PER);
c(!!pes, "hay una pestaña por PER");
const texto = pes.getDataRange().getValues().map(f => f.join(" | ")).join("\n");
contiene(texto, "Por docente", "con el bloque «Por docente»");
contiene(texto, "Reclutas (por xp)", "el bloque de reclutas");
contiene(texto, "Canjes", "el de canjes");
contiene(texto, "Últimos registros de la Bitácora", "y el de la Bitácora");
contiene(texto, "Foto tomada el", "y dice que es una foto, con su fecha");

// la pestaña de un PER borrado desaparece al refrescar
ss.insertSheet("PER · fantasma");
G.actualizarConsola();
c(!ss.getSheetByName("PER · fantasma"), "las pestañas de PER que ya no existen se borran solas");

// DATOS / RESUMEN
G.consolidarDatos();
const datos = G._maestra.getSheetByName("DATOS");
const res = G._maestra.getSheetByName("RESUMEN");
c(datos.getLastRow() > 1, "DATOS se rellena");
igual(res.getRange(1, 1, 1, 13).getValues()[0][6], "nivel", "RESUMEN lleva la columna de nivel");
igual(res.getLastRow() - 1, 3, "RESUMEN tiene una fila por recluta");

E.resumen("Consola del profesorado y DATOS/RESUMEN");
