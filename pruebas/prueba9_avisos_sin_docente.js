'use strict';
// 9 · HALLAZGOS 3 y 4 · Un canje de nota concedido sin correos de docente no puede quedar en silencio,
//     y un alumno sin docente asignado tiene que destacarse en algún sitio.
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
const M = E.M;
console.log("\n▶ 9 · Avisos que no se pierden y alumnos sin docente");

// ---------------------------------------------------------------- 3 · equipo docente SIN correos
const G = E.nuevoMundo();
E.crearPERDemo(G, { nombre: "SIN CORREOS", docentes: [
  { nombre: "Referente Pepa", correo: "", rol: "referente+imparte" },
  { nombre: "Profe Luis", correo: "", rol: "imparte" }] });
const PER = "sin-correos";
E.reclutaRico(G, PER, "x@alumno.es", { profe: "Profe Luis" });

igual(G.correosAviso_(PER, "Profe Luis"), [], "el equipo docente no tiene ni un correo");

M.Correo.limpiar();
const r = E.enviarCanje(G, PER, { email: "x@alumno.es", recompensa: E.etiqueta(G, "Subir 0,5 en un entregable"),
  actividad: "Actividad 2 · paisaje de aprendizaje" });
igual(r.estado, "Concedido", "el canje se concede igual (el alumno no tiene la culpa)");

const avisos = M.Correo.enviados.filter(x => x.asunto.indexOf("te toca a ti") >= 0 || x.asunto.indexOf("sin destinatario") >= 0);
c(avisos.length >= 1, "🔴 el aviso NO se pierde: llega a alguien");
const av0 = avisos[0] || { para: "", cuerpo: "" };
contiene(av0.para, "mutecdgami@gmail.com", "al dueño de la hoja, que es quien puede arreglarlo");
contiene(av0.cuerpo, "sin correo", "y el correo explica que el equipo docente no tiene correos");
contiene(av0.cuerpo, "DOCENTES", "diciendo dónde se arregla");

const traza = G.hoja_("AJUSTES").getDataRange().getValues().slice(1).filter(x => x[3] === "AVISO");
igual(traza.length, 1, "queda una traza del aviso en AJUSTES");
contiene((traza[0]||[])[5], "Subir 0,5", "con la recompensa");
contiene(String((traza[0]||[])[6]), "SIN CORREO", "marcada como no entregada al docente");

// con correos, la traza dice a quién fue
const G2 = E.nuevoMundo();
E.crearPERDemo(G2);
E.reclutaRico(G2, "prueba-banco", "y@alumno.es");
M.Correo.limpiar();
E.enviarCanje(G2, "prueba-banco", { email: "y@alumno.es", recompensa: E.etiqueta(G2, "Subir 0,5 en un entregable"), actividad: "Actividad 1 · imagen con IA" });
const t2 = G2.hoja_("AJUSTES").getDataRange().getValues().slice(1).filter(x => x[3] === "AVISO");
igual(t2.length, 1, "también queda traza cuando sí hay correos");
contiene(String((t2[0]||[])[6]), "mrcuarter@gmail.com", "diciendo a quién se avisó");

// ---------------------------------------------------------------- 4 · alumnos sin docente
const G3 = E.nuevoMundo();
E.crearPERDemo(G3);
const P3 = "prueba-banco";
E.enviarBitacora(G3, P3, { email: "con@alumno.es", alias: "Con", nombre: "C C", profe: "Mr Cuarter" });
E.enviarBitacora(G3, P3, { email: "sin1@alumno.es", alias: "Sin1", nombre: "S1", profe: "" });
E.enviarBitacora(G3, P3, { email: "sin2@alumno.es", alias: "Sin2", nombre: "S2", profe: "" });

const tab = G3.tablero_(P3, true);
igual(tab.sin_docente, 2, "🔴 el tablero privado dice cuántos reclutas no tienen docente");
igual(G3.tablero_(P3, false).sin_docente, undefined, "🔒 y eso no viaja en el tablero público");

const post = q => JSON.parse(G3.doPost({ postData: { contents: JSON.stringify(q) } }).getContent());
M.Props.getScriptProperties().setProperty("PIN_PROFES", "sg2026");
igual(post({ accion: "alumnos", per: P3, pin: "sg2026" }).sin_docente, 2, "y llega al panel del profesorado");

G3.actualizarConsola();
const ss = M.Libro.registro[M.Props.getScriptProperties().getProperty("CONSOLA_ID")];
const portada = ss.getSheetByName("PORTADA");
const cab = portada.getRange(5, 1, 1, portada.getLastColumn()).getValues()[0].map(String);
c(cab.indexOf("Sin docente") >= 0, "la PORTADA de la Consola tiene columna «Sin docente»");
igual(portada.getRange(6, cab.indexOf("Sin docente") + 1).getValue(), 2, "con los 2 que faltan");

const pes = ss.getSheetByName("PER · " + P3).getDataRange().getValues().map(f => f.join(" | ")).join("\n");
contiene(pes, "SIN DOCENTE", "y la pestaña del PER lo destaca en el bloque «Por docente»");

// si están todos asignados, no se avisa de nada
const G4 = E.nuevoMundo();
E.crearPERDemo(G4);
E.enviarBitacora(G4, "prueba-banco", { email: "ok@alumno.es", alias: "Ok", nombre: "O O", profe: "Mr Cuarter" });
igual(G4.tablero_("prueba-banco", true).sin_docente, 0, "con todos asignados, 0 sin docente");
G4.actualizarConsola();
const ss4 = M.Libro.registro[M.Props.getScriptProperties().getProperty("CONSOLA_ID")];
const pes4 = ss4.getSheetByName("PER · prueba-banco").getDataRange().getValues().map(f => f.join(" | ")).join("\n");
c(pes4.indexOf("SIN DOCENTE") < 0, "y la Consola no inventa una alerta que no existe");

E.resumen("Avisos que no se pierden y alumnos sin docente");
