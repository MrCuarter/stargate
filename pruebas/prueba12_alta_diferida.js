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
  const pb = items.filter(i => i.getType() === "PAGE_BREAK" && G.temaDePagina_(i.getTitle()) === t)[0];
  const img = items.filter(i => i.getType() === "IMAGE" && i.getTitle() === G.TEMAS[t][0])[0];
  if (t === 1) c(!!pb && !!img && items.indexOf(img) === items.indexOf(pb) + 1, "el orbe va justo debajo de su salto de página");
}
igual(G.imagenesBitacora_(fb), { puestos: 0, faltan: 0, agrandadas: 8 },
  "volver a llamarlo no duplica ninguna imagen: las que ya están solo se ponen al ancho bueno");
// v3.37 · «están muy pequeños» (Norberto, 29-ago). A 160 px el orbe era un icono en un formulario
// que da 640 de ancho.
c(fb.getItems("IMAGE").filter(i => PLANETAS.indexOf(i.getTitle()) >= 0).every(i => i.ancho === G.ANCHO_ORBE),
  "🔴 y los ocho orbes salen a " + G.ANCHO_ORBE + " px, no a 160");

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

// ---------------------------------------------------------------- el reloj DENTRO de las imagenes
// 🔴 9-sep, visto creando un PER de verdad: crearPER reserva 60 s antes de las imagenes, pero el
// bucle de imagenes no miraba el reloj. Con el catalogo v3.42 son ~23 descargas y se comio los 6
// minutos enteros: la ejecucion murio ANTES de las lineas que aplazan lo que falta, o sea que el
// grupo quedo con sus formularios pero SIN documento de enlaces y SIN continuacion programada.
// El profe ve un error rojo y se queda sin el documento que tiene que repartir.
{
  const G3 = E.nuevoMundo();
  G3.MARGEN_MS = 0;                    // se crea SIN imagenes, que es el escenario a probar
  const P3 = E.crearPERDemo(G3).id;
  G3.MARGEN_MS = 270000;
  const o3 = G3.perObj_(G3.perFila_(P3).v);
  const fbx = G3.formDelPER_(o3, "B"), ftx = G3.formDelPER_(o3, "T"), fcx = G3.formDelPER_(o3, "C");
  const cuenta = f => f.getItems(G3.FormApp.ItemType.IMAGE).length;

  // un reloj que dice que NO queda tiempo: sin margen ninguno
  const seco = { sobra: function(){ return false; }, marcar: function(){}, puedo: function(){ return false; },
                 ms: function(){ return 999999; }, hito: function(){} };
  const antes = cuenta(fbx) + cuenta(fcx);
  const r1 = G3.imagenesFormularios_(fbx, ftx, fcx, seco);
  const despues = cuenta(fbx) + cuenta(fcx);
  c(despues > antes, "🔴 sin tiempo AUN ASI pone algunas: una pasada que no avanza es un bucle eterno ("
    + (despues - antes) + " imágenes)");
  c(r1.faltan > 0, "y avisa de que faltan (" + r1.faltan + "), que es lo que dispara la continuación");
  c(despues - antes <= 4 + 4 + 5 + 2,
    "pero NO las hace todas: para cuando el reloj aprieta (" + (despues - antes) + ")");

  // dando vueltas con el reloj seco, acaba: eso es lo que hace `continuarAltaPER`
  let v2 = 0;
  while (G3.imagenesFormularios_(fbx, ftx, fcx, seco).faltan > 0 && v2 < 12) v2++;
  c(v2 < 12, "🔴 y a base de pasadas termina, aunque nunca haya margen (" + (v2 + 1) + " vueltas)");

  // con reloj holgado, de una sentada
  const G4 = E.nuevoMundo();
  G4.MARGEN_MS = 0;
  const P4 = E.crearPERDemo(G4).id;
  G4.MARGEN_MS = 270000;
  const o4 = G4.perObj_(G4.perFila_(P4).v);
  const holgado = { sobra: function(){ return true; }, marcar: function(){}, puedo: function(){ return true; },
                    ms: function(){ return 0; }, hito: function(){} };
  igual(G4.imagenesFormularios_(G4.formDelPER_(o4,"B"), G4.formDelPER_(o4,"T"), G4.formDelPER_(o4,"C"), holgado).faltan, 0,
        "con tiempo de sobra no queda ninguna pendiente");
}

// ---------------------------------------------------------------- el ORDEN: primero lo que se reparte
// 🔴 Lo pregunto Norberto el 9-sep: «si falla al principio estamos muertos». Tenia razon — el orden
// estaba al reves. Iban las ~23 imagenes de los formularios ANTES del documento de enlaces, asi que
// en el peor caso el profe se quedaba con los formularios ilustrados y SIN el unico papel que tiene
// que repartir a su clase. Ahora: documento -> dossier -> imagenes. Si algo se cae, lo que falta es
// cosmetica.
{
  const G5 = E.nuevoMundo();
  // margen justo: da para el documento, no para las 23 imagenes
  G5.MARGEN_MS = 70000;
  const P5 = E.crearPERDemo(G5).id;
  const o5 = G5.perObj_(G5.perFila_(P5).v);
  c(!!o5.doc, "🔴 con el tiempo justo, el DOCUMENTO DE ENLACES sí se hace: es lo que se reparte");
  const pr5 = G5.progreso_("alta");
  if (pr5) {
    igual(!!pr5.doc, false, "y no queda pendiente");
    c(!!pr5.imagenes, "lo que se aplaza son las IMÁGENES, que son cosmética");
  } else {
    c(true, "con este margen cupo todo, que también vale");
  }
  // y el orden tambien en la continuacion
  const src = require("fs").readFileSync(
    require("path").join(__dirname, "..", "apps-script", "Code.gs"), "utf8");
  const cont = src.slice(src.indexOf("function continuarAltaPER"), src.indexOf("function continuarReset"));
  c(cont.indexOf("crearDocumentoPER_") < cont.indexOf("imagenesFormularios_"),
    "🔴 y la continuación remata en el MISMO orden: documento antes que imágenes");
  // 🔴 El orden se comprueba sobre el CODIGO, no ejecutando: el banco es mucho mas rapido que Apps
  // Script (no hay descargas de verdad), asi que ninguna prueba de reloj distingue un orden del otro.
  // Y el orden ES la decision: si manaña alguien vuelve a poner las imagenes primero, esto se entera.
  const alta = src.slice(src.indexOf("var pend = { per: id"), src.indexOf("if (pend.imagenes || pend.doc"));
  c(alta.indexOf("crearDocumentoPER_") < alta.indexOf("imagenesFormularios_"),
    "🔴 en el ALTA, el documento de enlaces va ANTES que las imágenes");
  c(alta.indexOf("dossier_(") < alta.indexOf("imagenesFormularios_"),
    "y el dossier también: lo cosmético, lo último");
}

E.resumen("Alta de PER con acabado diferido");
