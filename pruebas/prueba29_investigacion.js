'use strict';
// 29 · INVESTIGACIÓN: el sello del catálogo, el consentimiento y la puesta en escena
// Tres piezas que no cambian el juego ni una coma, y que existen para que los datos sirvan y puedan
// compartirse sin llevarse a nadie por delante (ver Project_CCD/INVESTIGACION_TESIS.md).
// Lo que vigila esta batería es justo lo que no se ve al usar el sistema: que el sello se ponga
// cuando cambian los precios y NO cuando no cambia nada, que quien no consiente desaparezca de las
// exportaciones sin desaparecer del juego, y que los ítems del ticket caigan donde tienen que caer.
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
console.log("\n▶ 29 · Investigación: sello del catálogo, consentimiento y puesta en escena");

const G = E.nuevoMundo();
const PER = E.crearPERDemo(G).id;

// ---------------------------------------------------------------- a) el sello del catálogo
const filasAJ = () => G.hoja_(G.H.AJ).getDataRange().getValues().slice(1);
const sellos = () => filasAJ().filter(v => String(v[4]) === "version");

const v1 = G.sellarCatalogo_();
igual(sellos().length, 1, "la primera vez deja UN sello en AJUSTES");
c(/^[0-9a-f]{8}$/.test(v1), "con una huella corta y legible (" + v1 + ")");

G.sellarCatalogo_(); G.sellarCatalogo_();
igual(sellos().length, 1, "🔴 y si el catálogo no ha cambiado NO vuelve a escribir: el sello no es ruido");

// cambiar un precio cambia la huella y deja un sello nuevo
const rec = G.hoja_(G.H.REC);
rec.getRange(2, 2).setValue(Number(rec.getRange(2, 2).getValue()) + 7);
const v2 = G.sellarCatalogo_();
c(v2 !== v1, "tocar un precio cambia la huella");
igual(sellos().length, 2, "y deja un sello nuevo, con su hora");
contiene(String(sellos()[1][6]), "=", "el sello guarda la lista de precios de ese momento");
igual(String(sellos()[1][1]), "", "sin PER: el catálogo es de toda la hoja, no de un grupo");
igual(String(sellos()[1][2]), "", "y sin correo: no es de nadie");

// la huella depende de lo que puede cambiar una decisión de compra
const cat = G.recompensasCat_();
const antes = G.versionCatalogo_(cat);
igual(G.versionCatalogo_(cat.map(x => ({ nombre:x.nombre, coste:x.coste, max:x.max, desde:x.desde, tipo:x.tipo }))),
      antes, "la huella no depende del orden en que se lea la ficha");
const otra = cat.map(x => ({ nombre:x.nombre, coste:x.coste, max:x.max, desde:x.desde + 1, tipo:x.tipo }));
c(G.versionCatalogo_(otra) !== antes, "🔴 mover la semana de desbloqueo TAMBIÉN cambia la huella");

// un canje sella por su cuenta: así toda compra queda atribuida a los precios que regían
rec.getRange(2, 2).setValue(Number(rec.getRange(2, 2).getValue()) + 3);
const nSellos = sellos().length;
E.enviarBitacora(G, PER, { email: "nova@alumno.es", alias: "Nova", nombre: "N N", profe: "Mr Cuarter" });
["A1", "B1", "X1", "A2", "B2"].forEach(id =>
  G.hoja_(G.H.AJ).appendRow([new Date(), PER, "nova@alumno.es", id, "otorgar", "", "banco"]));
E.enviarCanje(G, PER, { email: "nova@alumno.es", recompensa: E.etiqueta(G, "Sobre de cromos") });
igual(sellos().length, nSellos + 1, "🔴 al resolver un canje se sella el catálogo vigente sin que nadie lo pida");

// ---------------------------------------------------------------- b) el consentimiento
E.enviarBitacora(G, PER, { email: "orion@alumno.es", alias: "Orion", nombre: "O V", profe: "Mr Cuarter" });
G.consolidarDatos();
const RES = () => G._maestra.getSheetByName("RESUMEN");
const DAT = () => G._maestra.getSheetByName("DATOS");
igual(RES().getLastRow() - 1, 2, "sin lista de consentimiento salen los dos reclutas (nada cambia)");

const cons = G.hoja_(G.H.CONS);
cons.appendRow(["nova@alumno.es", "SÍ", new Date(), "piloto"]);
cons.appendRow(["orion@alumno.es", "NO", new Date(), "prefiere que no"]);
G.consolidarDatos();
igual(RES().getLastRow() - 1, 1, "🔴 con la lista puesta, solo sale quien ha dicho que sí");

const cabR = RES().getRange(1, 1, 1, RES().getLastColumn()).getValues()[0].map(String);
const seu = String(RES().getRange(2, cabR.indexOf("seudonimo") + 1).getValue());
igual(seu, G.seudonimo_("nova@alumno.es"), "y es la que consintió");

// quien no consiente sigue jugando: el consentimiento es para los DATOS, no para la nave
const t = G.tablero_(PER, true);
igual(t.reclutas.filter(x => x.email === "orion@alumno.es").length, 1,
      "🔴 quien no consiente SIGUE en el juego: solo desaparece de las exportaciones");

// las filas que no son de nadie (el sello del catálogo) no se pierden por el filtro
const colOr = DAT().getRange(1, 1, 1, DAT().getLastColumn()).getValues()[0].map(String).indexOf("reto_id");
const conSello = DAT().getRange(2, 1, DAT().getLastRow() - 1, DAT().getLastColumn()).getValues()
  .filter(f => String(f[colOr]) === "CATALOGO");
c(conSello.length > 0, "el sello del catálogo sobrevive al filtro: no es dato personal de nadie");

// ---------------------------------------------------------------- c) la puesta en escena en el ticket
const o = G.perObj_(G.perFila_(PER).v);
const ft = G.formDelPER_(o, "T");
const titulos = () => ft.getItems().map(i => i.getTitle());
G.PUESTA_EN_ESCENA.forEach(q =>
  c(titulos().indexOf(q[0]) >= 0, "el ticket nuevo ya trae «" + q[0].slice(0, 42) + "…»"));

// están DENTRO de la página del tema, que es la que se responde una y otra vez
const items = ft.getItems();
const iTema = items.findIndex(i => i.getType() === "PAGE_BREAK" && i.getTitle() === G.TIT_PAG_TEMA);
const iSig = items.findIndex((i, k) => k > iTema && i.getType() === "PAGE_BREAK");
c(iTema >= 0, "la página «" + G.TIT_PAG_TEMA + "» existe");
G.PUESTA_EN_ESCENA.forEach(q => {
  const k = titulos().indexOf(q[0]);
  c(k > iTema && (iSig < 0 || k < iSig),
    "🔴 «" + q[0].slice(10, 40) + "…» cae dentro de la página del tema, no en otra");
});

// y en un ticket ANTIGUO se añaden sin duplicarse
const viejo = G.FormApp.create("ticket viejo");
viejo.addListItem().setTitle("El profesor o profesora que imparte tu clase...");
viejo.addPageBreakItem().setTitle(G.TIT_PAG_TEMA);
viejo.addParagraphTextItem().setTitle("¿Alguna duda?");
viejo.addPageBreakItem().setTitle("Sobre la actividad escogida");
viejo.addParagraphTextItem().setTitle("Otra cosa");
igual(G.anadirPuestaEnEscena_(viejo), G.PUESTA_EN_ESCENA.length, "en un ticket antiguo se añaden los tres");
igual(G.anadirPuestaEnEscena_(viejo), 0, "🔴 y al repetir no se añade ninguno: es idempotente");
const tv = viejo.getItems().map(i => i.getTitle());
igual(tv.indexOf("Otra cosa") > tv.indexOf(G.PUESTA_EN_ESCENA[2][0]), true,
      "quedan ANTES de la página siguiente, no al final del formulario");
igual(new Set(tv).size, tv.length, "y no hay ni un título repetido");

// un formulario que no es el ticket no se toca
const ajeno = G.FormApp.create("otro form");
ajeno.addParagraphTextItem().setTitle("nada que ver");
igual(G.anadirPuestaEnEscena_(ajeno), 0, "🔴 un formulario sin la página del tema se deja en paz");
igual(ajeno.getItems().length, 1, "y sigue con su única pregunta");

E.resumen("Investigación: sello, consentimiento y puesta en escena");
