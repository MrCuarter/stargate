'use strict';
// 5 · La Consola del profesorado (segunda hoja) y DATOS/RESUMEN
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
console.log("\n▶ 5 · Consola del profesorado y DATOS/RESUMEN");

const G = E.nuevoMundo();
E.crearPERDemo(G);
const PER = "prueba-banco";
const RET = G.retosDe_("REGULAR");

E.enviarBitacora(G, PER, { email: "a@alumno.es", alias: "Aa", nombre: "A A", profe: "Mr Cuarter" });
E.enviarBitacora(G, PER, { email: "b@alumno.es", alias: "Bb", nombre: "B B", profe: "Norberto Genially" });
E.enviarBitacora(G, PER, { email: "c@alumno.es", alias: "Cc", nombre: "C C", profe: "" });   // sin docente
E.enviarBitacora(G, PER, { email: "a@alumno.es", marcados: E.marcar(G, RET.filter(r => r[4] === 1)) }, 2);

// un canje de nota pendiente de aplicar. Ojo: subir nota EXIGE planetas completos, así que primero
// se le dan los suyos — que es justo lo que la regla quiere: no se toca la nota sin haber trabajado.
for (let t2 = 1; t2 <= G.NOTA_MIN_PLANETAS; t2++)
  RET.filter(r => r[4] === t2).forEach(r => G.hoja_("AJUSTES").appendRow(
    [new Date(), PER, "a@alumno.es", r[0], "otorgar", "", "banco"]));
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
igual(res.getLastRow() - 1, 3, "RESUMEN tiene una fila por recluta");

// ---------------------------------------------------------------- las dos pestañas son PARA INVESTIGAR
// v3.23 · llevan el DOCENTE (la variable que faltaba) y NO llevan a nadie identificado. La vista con
// nombres es la Consola; estas dos se comparten fuera, así que salen seudonimizadas.
const cabD = datos.getRange(1, 1, 1, datos.getLastColumn()).getValues()[0].map(String);
const cabR = res.getRange(1, 1, 1, res.getLastColumn()).getValues()[0].map(String);
[["DATOS", cabD], ["RESUMEN", cabR]].forEach(([nom, cab]) => {
  c(cab.indexOf("docente") >= 0, nom + " lleva la columna del docente");
  c(cab.indexOf("seudonimo") >= 0, nom + " identifica por seudónimo");
  ["email", "alias", "nombre"].forEach(x =>
    c(cab.indexOf(x) < 0, "🔴 " + nom + " NO lleva la columna «" + x + "»"));
});
igual(cabR[cabR.indexOf("nivel")], "nivel", "RESUMEN sigue llevando el nivel");

const cuerpo = datos.getRange(2, 1, datos.getLastRow() - 1, datos.getLastColumn()).getValues()
  .concat(res.getRange(2, 1, res.getLastRow() - 1, res.getLastColumn()).getValues());
const conArroba = cuerpo.filter(f => f.some(x => String(x).indexOf("@") >= 0));
igual(conArroba.length, 0, "🔴 y no se escapa ni un correo por las celdas");

const seuds = res.getRange(2, cabR.indexOf("seudonimo") + 1, res.getLastRow() - 1, 1)
  .getValues().map(f => String(f[0]));
igual(new Set(seuds).size, seuds.length, "cada recluta tiene SU seudónimo (no colisionan)");
c(seuds.every(x => /^R-[0-9a-f]{12}$/.test(x)), "y todos tienen la misma forma: " + seuds[0]);

const docentes = res.getRange(2, cabR.indexOf("docente") + 1, res.getLastRow() - 1, 1)
  .getValues().map(f => String(f[0])).filter(Boolean);
c(docentes.length > 0, "el docente llega de verdad a las filas (" + docentes.length + " de " + seuds.length + ")");

// el seudónimo es ESTABLE: si cambiara en cada consolidación, no habría serie que seguir
G.consolidarDatos();
const res2 = G._maestra.getSheetByName("RESUMEN");
igual(res2.getRange(2, cabR.indexOf("seudonimo") + 1, res2.getLastRow() - 1, 1).getValues().map(f => String(f[0])),
      seuds, "🔴 el mismo recluta conserva su seudónimo entre consolidaciones");

E.resumen("Consola del profesorado y DATOS/RESUMEN");
