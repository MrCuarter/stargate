'use strict';
// 15 · EL PARTE DE SALUD (§12.1) Y EL REPROCESO DE CANJES (§12.2)
//   a) en un mundo sano no inventa alarmas
//   b) en un mundo roto a propósito los encuentra TODOS
//   c) no repara nada: solo informa
//   d) reprocesar canjes sin resolver va por lotes, acaba, y no cobra dos veces
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
const M = E.M;
console.log("\n▶ 15 · Parte de salud del sistema y reproceso de canjes");

// El parte devuelve una lista de puntos con clave y nivel: este atajo saca el nivel de uno.
function nivel(p, clave) { const x = p.puntos.filter(y => y.clave === clave)[0]; return x ? x.nivel : "(no existe)"; }
function detalle(p, clave) { const x = p.puntos.filter(y => y.clave === clave)[0]; return x ? x.detalle : ""; }

// ---------------------------------------------------------------- a) mundo sano
let G = E.nuevoMundo();
E.crearPERDemo(G);
E.reclutaRico(G, "prueba-banco", "sano@alumno.es", { profe: "Mr Cuarter" });
G.asegurarTriggers_();
M.Props.getScriptProperties().setProperty("PIN_PROFES", "estrella7");
G.actualizarConsola();
G.dossier_();

let p = G.salud_();
igual(p.ok, true, "🔴 un mundo sano sale SANO (ningún punto en rojo)");
["triggers", "tareas", "canjes", "errores", "avisos", "docentes", "reclutas", "documentos", "cuota", "pin", "consola"]
  .forEach(k => igual(nivel(p, k), "ok", "sano · " + k));
igual(p.malos, 0, "cero rojos");
igual(p.avisos, 0, "cero ámbares");

// ---------------------------------------------------------------- b) mundo roto a propósito
G = E.nuevoMundo();
E.crearPERDemo(G);
M.Props.getScriptProperties().setProperty("PIN_PROFES", "0000");   // el PIN de hoy: corto de más

// 1) triggers duplicados (el fallo que dio dos cartas por un solo sobre)
G.asegurarTriggers_();
M.Guiones.newTrigger("alRecibirRespuesta").forSpreadsheet(G._maestra).onFormSubmit().create();
// 2) una tarea a medias
G.guardarProgreso_("formularios", { i: 2, n: 2, total: 7, fallos: [] });
// 3) un canje que llegó pero no se procesó (el trigger murió a media faena, como el 25-ago)
E.reclutaRico(G, "prueba-banco", "roto@alumno.es", { profe: "Mr Cuarter" });
const filaHuerfana = E.canjeSinResolver(G, "prueba-banco", { email: "roto@alumno.es", recompensa: E.etiqueta(G, "Sobre de cromos") });
const shC = G._maestra.getSheetByName("C · prueba-banco");
// OJO: la columna «Estado» no existe hasta que se resuelve el primer canje del grupo (la crea
// resolverCanje_ al vuelo), así que hay que preguntar por ella cada vez.
const colEstado = () => shC.getRange(1, 1, 1, shC.getLastColumn()).getValues()[0].map(String).indexOf("Estado") + 1;
// 4) una fila ERROR de las de un trigger atragantado
G.hoja_(G.H.AJ).appendRow([new Date(), "prueba-banco", "", "ERROR", "canje", "fila 9: boom", "sistema"]);
// 5) un aviso que no llegó a nadie
G.hoja_(G.H.AJ).appendRow([new Date(), "prueba-banco", "x@y.es", "AVISO", "nota", "Subir 1 punto", "SIN CORREO · NO ENVIADO"]);
// 6) un docente sin correo
const shD = G.hoja_(G.H.DOC);
shD.appendRow(["prueba-banco", "Docente Sin Correo", "", "imparte"]);
// 7) un recluta sin docente
E.enviarBitacora(G, "prueba-banco", { email: "huerfano@alumno.es", alias: "Huérfano", profe: "" });
// 8) el PER se queda sin documento
const fp = G.perFila_("prueba-banco");
G.hoja_(G.H.PERS).getRange(fp.fila, 19).setValue("");
// 9) sin cuota de correo
M.Correo.cuota = 3;

p = G.salud_();
igual(p.ok, false, "🔴 un mundo roto NO sale sano");
igual(nivel(p, "triggers"), "mal", "ve el trigger duplicado");
contiene(detalle(p, "triggers"), "alRecibirRespuesta", "y dice cuál");
igual(nivel(p, "tareas"), "aviso", "ve la tarea a medias");
contiene(detalle(p, "tareas"), "formularios", "y dice cuál");
igual(nivel(p, "canjes"), "mal", "🔴 ve el canje sin resolver (el fallo que se escondió en vivo)");
contiene(detalle(p, "canjes"), "1", "y cuenta cuántos");
igual(nivel(p, "errores"), "mal", "ve la fila ERROR de AJUSTES");
igual(nivel(p, "avisos"), "mal", "ve el aviso que no llegó a nadie");
igual(nivel(p, "docentes"), "aviso", "ve al docente sin correo");
contiene(detalle(p, "docentes"), "Docente Sin Correo", "y lo nombra");
igual(nivel(p, "reclutas"), "aviso", "ve al recluta sin docente");
igual(nivel(p, "documentos"), "aviso", "ve el PER sin documento");
igual(nivel(p, "cuota"), "aviso", "ve la cuota de correo por los suelos");
igual(nivel(p, "pin"), "mal", "🔴 y canta que el PIN es demasiado corto");
c(p.malos >= 5, "hay al menos 5 rojos (" + p.malos + ")");

// cada punto dice DÓNDE se arregla: si no, el parte solo da malas noticias
c(p.puntos.filter(x => x.nivel !== "ok").every(x => x.arreglo && x.arreglo.length > 5),
  "🔴 todo lo que no está en verde dice cómo se arregla");

// ---------------------------------------------------------------- c) no repara nada
const triggersAntes = M.Guiones.getProjectTriggers().length;
const estadoAntes = String(colEstado() ? shC.getRange(filaHuerfana, colEstado()).getValue() : "");
G.salud_();
igual(M.Guiones.getProjectTriggers().length, triggersAntes, "el parte NO borra triggers");
igual(String(colEstado() ? shC.getRange(filaHuerfana, colEstado()).getValue() : ""), estadoAntes, "ni resuelve el canje por su cuenta");
igual(G.progreso_("formularios").i, 2, "ni toca las tareas a medias");

// ---------------------------------------------------------------- d) reprocesar los canjes huérfanos
const r2 = G.reprocesarCanjes_();
igual(r2.terminado, true, "el reproceso termina");
igual(r2.resueltos, 1, "🔴 y resuelve el canje que se había quedado en el limbo");
const estadoAhora = String(shC.getRange(filaHuerfana, colEstado()).getValue());
c(estadoAhora.indexOf("Concedido") === 0 || estadoAhora.indexOf("Denegado") === 0,
  "la fila queda resuelta de verdad: «" + estadoAhora + "»");
igual(nivel(G.salud_(), "canjes"), "ok", "y el parte ya no la ve");

// se aplica UNA vez: ni se queda sin efecto ni se dobla
const al = G.tablero_("prueba-banco", true).reclutas.filter(x => x.email === "roto@alumno.es")[0];
igual(al.canjeados["Sobre de cromos"], 1, "🔴 una sola concesión, no dos");
const nCromos = Object.keys(al.cromos).reduce((a, k) => a + al.cromos[k], 0);
igual(nCromos, 1, "y una sola carta en el álbum");

// volver a reprocesar cuando no queda nada no hace daño
const r3 = G.reprocesarCanjes_();
igual(r3.resueltos, 0, "reprocesar en vacío no resuelve nada");
igual(r3.terminado, true, "y termina igual");

// ---------------------------------------------------------------- e) el reproceso va por lotes
G = E.nuevoMundo();
const GRUPOS = ["PRUEBA BANCO", "GRUPO DOS", "GRUPO TRES"];
const IDS = ["prueba-banco", "grupo-dos", "grupo-tres"];
GRUPOS.forEach(n => E.crearPERDemo(G, { nombre: n }));
IDS.forEach(id => {
  E.reclutaRico(G, id, "lote@alumno.es", { profe: "Mr Cuarter" });
  E.canjeSinResolver(G, id, { email: "lote@alumno.es", recompensa: E.etiqueta(G, "Sobre de cromos") });
});
igual(G.salud_().puntos.filter(x => x.clave === "canjes")[0].n, 3, "partimos de 3 canjes sin resolver, uno por grupo");

const margen = G.MARGEN_MS;
G.MARGEN_MS = 0;                       // como si Apps Script cortara enseguida
let vueltas = 0, r4;
do { r4 = G.reprocesarCanjes_(); vueltas++; } while (!r4.terminado && vueltas < 20);
G.MARGEN_MS = margen;
c(vueltas > 1, "🔴 con el reloj a cero va a trozos (" + vueltas + " pasadas), no de golpe");
igual(r4.terminado, true, "y acaba");
igual(G.progreso_("canjes"), null, "sin dejar progreso a medias");
igual(G.salud_().puntos.filter(x => x.clave === "canjes")[0].n, 0, "no queda ninguno sin resolver");
IDS.forEach(id => {
  const a = G.tablero_(id, true).reclutas[0];
  igual(a.canjeados["Sobre de cromos"], 1, "el canje de «" + id + "» se resuelve una sola vez");
});

E.resumen("Parte de salud y reproceso de canjes");
