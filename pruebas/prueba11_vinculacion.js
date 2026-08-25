'use strict';
// 11 · VISTO EN PRODUCCIÓN (25-ago, v3.13): al crear un PER, Google falló al vincular el SEGUNDO
//      formulario a la hoja («Failed to set response destination»). Es transitorio: la hoja está
//      ocupada creando la pestaña del anterior. Y si crearPER se cae a medias, deja basura.
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
const M = E.M, FormApp = E.FormApp;
console.log("\n▶ 11 · Vincular formularios con reintento, y limpieza si crearPER se cae");

// ---------------------------------------------------------------- reintento
let G = E.nuevoMundo();
c(typeof G.vincular_ === "function", "existe vincular_(): setDestination con reintentos");

FormApp._fallosVinculacion = 2;            // los dos primeros intentos fallan
let r = E.crearPERDemo(G);
igual(FormApp._fallosVinculacion, 0, "se han consumido los fallos simulados");
igual(r.id, "prueba-banco", "el PER se crea IGUAL: el reintento lo salva");
["B", "T", "C"].forEach(k => c(!!G._maestra.getSheetByName(k + " · prueba-banco"), "la pestaña " + k + " queda vinculada"));
E.enviarBitacora(G, "prueba-banco", { email: "a@alumno.es", alias: "A", nombre: "A A", profe: "Mr Cuarter" });
igual(G.tablero_("prueba-banco", true).reclutas.length, 1, "y el circuito funciona con normalidad");

// no reintenta a lo tonto si ya está vinculado
const o = G.perObj_(G.perFila_("prueba-banco").v);
const fb = G.formDelPER_(o, "B");
FormApp._fallosVinculacion = 99;
igual(G.vincular_(fb, G._maestra.getId()), true, "si el formulario YA está vinculado, no vuelve a intentarlo");
igual(FormApp._fallosVinculacion, 99, "y no gasta ni un intento");

// ---------------------------------------------------------------- se rinde con un mensaje claro
G = E.nuevoMundo();
FormApp._fallosVinculacion = 99;
let err = "";
try { E.crearPERDemo(G, { nombre: "IMPOSIBLE" }); } catch (e) { err = e.message; }
contiene(err, "vincular", "si Google no cede nunca, el error explica QUÉ falló");
contiene(err, "intentos", "y que se reintentó");
FormApp._fallosVinculacion = 0;

// ---------------------------------------------------------------- limpieza al caerse
igual(G.hoja_("PERs").getDataRange().getValues().slice(1).filter(v => v[0]).length, 0,
  "un crearPER fallido NO deja fila en PERs");
const sueltas = G._maestra.getSheets().filter(h => /^Respuestas de formulario/.test(h.getName()));
igual(sueltas.length, 0, "🔴 ni pestañas «Respuestas de formulario N» huérfanas (el resto del fallo del 25-ago)");
const carpeta = G.carpetaDelPER_("IMPOSIBLE", false);
igual(carpeta.getName(), "Formularios PER", "ni la carpeta del PER a medio hacer");

// y después de un fallo se puede volver a crear con el mismo nombre
const r2 = E.crearPERDemo(G, { nombre: "IMPOSIBLE" });
igual(r2.id, "imposible", "tras limpiar, el mismo nombre se puede volver a usar");

// ---------------------------------------------------------------- limpiarRestos ve las huérfanas
G = E.nuevoMundo();
E.crearPERDemo(G);
G._maestra.insertSheet("Respuestas de formulario 4");     // la huérfana real de la hoja de mutecdgami
M.UI.limpiar(); M.UI.responder(M.UI.Button.YES);
G.limpiarRestos();
c(!G._maestra.getSheetByName("Respuestas de formulario 4"),
  "🔴 limpiarRestos borra las pestañas «Respuestas de formulario N» sin formulario vivo");
c(!!G._maestra.getSheetByName("B · prueba-banco"), "y NO toca las pestañas de un PER vivo");

E.resumen("Vinculación con reintento y limpieza");
