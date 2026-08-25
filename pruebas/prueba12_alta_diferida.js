'use strict';
// 12 · VISTO EN PRODUCCIÓN (25-ago): crearPER agotó los 6 minutos de Apps Script y murió dejando el
//      PER a medias. El acabado (orbes de los planetas, documento de enlaces y dossier) sale del
//      camino crítico: si no da tiempo, lo termina una continuación dentro de un minuto.
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
const M = E.M;
console.log("\n▶ 12 · El alta de un PER cabe en el tiempo (acabado diferido)");

// ---------------------------------------------------------------- con tiempo: todo de una vez
let G = E.nuevoMundo();
let r = E.crearPERDemo(G);
igual(r.pendiente, null, "con tiempo de sobra no queda nada pendiente");
c(!!r.doc, "el documento de enlaces se crea");
igual(G.progreso_("alta"), null, "y no se guarda progreso");
c(!M.Guiones.getProjectTriggers().some(t => t.getHandlerFunction() === "continuarAltaPER"), "ni se programa continuación");

const o = G.perObj_(G.perFila_("prueba-banco").v);
const fb = G.formDelPER_(o, "B");
const PLANETAS = [1,2,3,4,5,6,7,8].map(t => G.TEMAS[t][0]);
const orbes = fb.getItems("IMAGE").map(i => i.getTitle()).filter(t => PLANETAS.indexOf(t) >= 0);
igual(orbes.length, 8, "los 8 orbes de planeta están puestos");
igual(orbes.sort().join(","), PLANETAS.slice().sort().join(","), "uno por planeta, sin repetir");
// cada orbe va justo debajo de su salto de página
for (let t = 1; t <= 8; t++) {
  const items = fb.getItems();
  const pb = items.filter(i => i.getType() === "PAGE_BREAK" && i.getTitle().indexOf("Tema " + t + " ") === 0)[0];
  const img = items.filter(i => i.getType() === "IMAGE" && i.getTitle() === G.TEMAS[t][0])[0];
  if (t === 1) c(!!pb && !!img && items.indexOf(img) === items.indexOf(pb) + 1, "el orbe va justo debajo de su salto de página");
}
igual(G.imagenesBitacora_(fb), 0, "volver a llamarlo no duplica ninguna imagen (idempotente)");

// ---------------------------------------------------------------- sin tiempo: se aplaza
G = E.nuevoMundo();
G.MARGEN_MS = 0;                       // no cabe ni el acabado
r = E.crearPERDemo(G);
c(!!r.id, "🔴 el PER se crea IGUAL: lo esencial nunca se aplaza");
c(!!r.pendiente, "pero el acabado queda pendiente");
igual(r.pendiente.imagenes, true, "los orbes");
igual(r.pendiente.doc, true, "el documento");
igual(r.pendiente.dossier, true, "y el dossier");
igual(r.doc, "", "el documento aún no tiene URL");
c(!!G.progreso_("alta"), "queda anotado por dónde iba");
c(M.Guiones.getProjectTriggers().some(t => t.getHandlerFunction() === "continuarAltaPER"), "y programada la continuación");

// el PER ya funciona aunque falte el acabado
E.enviarBitacora(G, "prueba-banco", { email: "a@alumno.es", alias: "A", nombre: "A A", profe: "Mr Cuarter" });
igual(G.tablero_("prueba-banco", true).reclutas.length, 1, "y el alumnado ya puede alistarse");

// la continuación lo termina
G.MARGEN_MS = 270000;
G.continuarAltaPER();
igual(G.progreso_("alta"), null, "la continuación termina el acabado");
c(!M.Guiones.getProjectTriggers().some(t => t.getHandlerFunction() === "continuarAltaPER"), "y se cancela sola");
const fb2 = G.formDelPER_(G.perObj_(G.perFila_("prueba-banco").v), "B");
igual(fb2.getItems("IMAGE").map(i => i.getTitle()).filter(t => PLANETAS.indexOf(t) >= 0).length, 8, "los orbes acaban puestos");
c(!!G.perObj_(G.perFila_("prueba-banco").v).doc, "y el documento de enlaces creado");
const idD = M.Props.getScriptProperties().getProperty("DOSSIER_ID");
contiene(M.Documento.registro[idD].getBody().getText(), "PRUEBA BANCO", "y el dossier al día");

// si borran el PER antes de que llegue la continuación, no revienta
G.guardarProgreso_("alta", { per: "fantasma", imagenes: true, doc: true, dossier: true });
G.continuarAltaPER();
igual(G.progreso_("alta"), null, "un PER borrado a medias no deja la continuación colgada");

// y va a trozos si sigue sin haber tiempo
G = E.nuevoMundo();
G.MARGEN_MS = 0;
E.crearPERDemo(G);
let vueltas = 0;
while (G.progreso_("alta") && vueltas < 10) { G.continuarAltaPER(); vueltas++; }
c(vueltas >= 1 && vueltas < 10, "el acabado avanza a trozos y acaba (" + vueltas + " pasadas)");

E.resumen("Alta de PER con acabado diferido");
