'use strict';
// 41 · LAS IMÁGENES DE LOS TRES FORMULARIOS
// Petición de Norberto (30-ago): «que cada recompensa tenga su imagen y se vea qué te llevas antes
// de confirmar», y que el Capitán y NEBULA presenten las secciones.
//
// Lo que de verdad protege esta prueba son tres cosas que ya han fallado en este proyecto:
//   1. Que NINGUNA recompensa se quede muda. El emparejamiento es por NOMBRE, así que basta con que
//      alguien renombre una en el catálogo para que su imagen desaparezca sin avisar.
//   2. Que la inyección sea IDEMPOTENTE. La ejecutan crearPER, la continuación y Mantenimiento: si
//      duplicara, un formulario acabaría con la misma foto cuatro veces.
//   3. Que una imagen que no se puede bajar NO tumbe el canje. La web se cayó de verdad el 26-ago y
//      cada descarga tardaba 12 s en fallar.
const E = require("./entorno.js");
const { comprobar: c, igual } = E;
console.log("\n▶ 41 · Las imágenes de los tres formularios");

const G = E.nuevoMundo();
const per = E.crearPERDemo(G).id;
const o = G.perObj_(G.perFila_(per).v);
const canje = G.FormApp.openByUrl(o.formCanjeEdit);
const cat = G.recompensasCat_();

// ------------------------------------------------- a) el catálogo y el mapa de imágenes cuadran
c(cat.length > 0, "el catálogo trae recompensas (" + cat.length + ")");
const sinImagen = cat.filter(x => !G.IMG_RECOMPENSA[x.nombre]).map(x => x.nombre);
igual(sinImagen, [], "🔴 TODAS las recompensas tienen imagen: ninguna se queda muda");
const sobran = Object.keys(G.IMG_RECOMPENSA).filter(n => !cat.some(x => x.nombre === n));
igual(sobran, [], "y no hay imágenes apuntando a recompensas que ya no existen");
c(Object.values(G.IMG_RECOMPENSA).every(f => /\.jpg$/.test(f)),
  "todas son .jpg: las baja Apps Script una a una y en PNG pesaban 8 veces más");
igual(new Set(Object.values(G.IMG_RECOMPENSA)).size, Object.keys(G.IMG_RECOMPENSA).length,
  "🔴 y cada recompensa tiene la SUYA: ninguna comparte foto con otra");

// ------------------------------------------------- b) se ponen, y cada una detrás de SU página
// crearPER ya las deja puestas, así que aquí lo que se comprueba es que ESTÁN y que volver a
// pasar no añade nada: `puestos: 0` es la respuesta correcta sobre un formulario ya al día.
const r1 = G.imagenesCanje_(canje);
igual(r1.faltan, 0, "no falta ninguna por poner");
igual(r1.puestos, 0, "sobre un canje ya al día no vuelve a subir ninguna");

const imgs = () => canje.getItems(G.FormApp.ItemType.IMAGE);
const imgsRec = () => imgs().filter(i => cat.some(x => x.nombre === i.getTitle()));
igual(imgsRec().length, cat.length, "hay una imagen por recompensa");
const orden = canje.getItems().map(i => i.getTitle());
cat.forEach(x => {
  const iPag = orden.indexOf(G.etiquetaRecompensa_(x));
  igual(orden[iPag + 1], x.nombre,
    "🔴 la imagen de «" + x.nombre + "» va JUSTO detrás de su página, no suelta al final");
});

// ------------------------------------------------- c) idempotente: la llaman tres caminos
const antes = canje.getItems().length;
G.imagenesCanje_(canje); G.imagenesCanje_(canje);
igual(canje.getItems().length, antes, "🔴 repetirla no duplica nada (la ejecutan crearPER, la continuación y Mantenimiento)");
igual(imgsRec().length, cat.length, "sigue habiendo una imagen por recompensa");
igual(G.imagenesCanje_(canje).puestos, 0, "y ya no pone ninguna nueva");

// ------------------------------------------------- d) una recompensa sin imagen NO rompe el canje
const rec = G.hoja_(G.H.REC);
rec.appendRow(["Recompensa inventada por un profe", 10, 1, "La añadió alguien a mano", 1, "cromo"]);
G.reestructurarCanje_(canje);
let cayo = null;
try { G.imagenesCanje_(canje); } catch (e) { cayo = e.message; }
igual(cayo, null, "🔴 una recompensa que el profesorado añadió a mano no tumba la inyección");
const cat2 = G.recompensasCat_();
c(canje.getItems(G.FormApp.ItemType.PAGE_BREAK)
   .some(p => p.getTitle().indexOf("Recompensa inventada por un profe") === 0),
  "esa recompensa SÍ tiene su página (se puede canjear)...");
c(!imgs().some(i => i.getTitle() === "Recompensa inventada por un profe"),
  "...simplemente sin foto: el canje sigue funcionando");

// ------------------------------------------------- e) las escenas del Capitán y de NEBULA
const bit = G.FormApp.openByUrl(o.formEdit || o.formBitacoraEdit);
const puestas = G.imagenesFormularios_(bit, G.FormApp.openByUrl(o.formTicketEdit), canje);
c(puestas.puestos >= 0 && puestas.faltan === 0, "las escenas de sección se ponen sin fallos");
const tIt = G.FormApp.openByUrl(o.formTicketEdit).getItems(G.FormApp.ItemType.IMAGE).map(i => i.getTitle());
c(tIt.indexOf(G.TIT_ESCENA_TICKET) >= 0, "🔴 NEBULA presenta el ticket: es quien te escucha en el relato");
const cIt = imgs().map(i => i.getTitle());
c(cIt.indexOf(G.TIT_ESCENA_CANJE) >= 0, "y el Capitán presenta el canje");
const bIt = bit.getItems(G.FormApp.ItemType.IMAGE).map(i => i.getTitle());
c(bIt.indexOf(G.TIT_ESCENA_PORTADA) >= 0, "el Capitán da la bienvenida en la portada de la Bitácora");
c(bIt.indexOf(G.TIT_ESCENA_ALTA) >= 0, "y presenta el alistamiento");
c(bIt.indexOf(G.TIT_ESCENA_PLANETA) >= 0, "y NEBULA, la elección de planeta");
// 🔴 y ninguna escena se llama como la pregunta que ilustra: si no, buscar por título encuentra la
// foto en vez del texto y la ayuda del formulario se queda muda (pasó al escribir esto).
const titulosBit = bit.getItems().map(i => i.getTitle());
[G.TIT_INTRO, G.TIT_PAG_ALTA, G.TIT_PAG_PLANETA].forEach(t =>
  igual(titulosBit.filter(x => x === t).length, 1, "«" + t + "» aparece UNA sola vez en la Bitácora"));

// y tampoco duplican
const antesEsc = bit.getItems().length;
G.imagenesFormularios_(bit, G.FormApp.openByUrl(o.formTicketEdit), canje);
igual(bit.getItems().length, antesEsc, "🔴 las escenas tampoco se duplican al repetir");

E.resumen("Las imágenes de los tres formularios");
