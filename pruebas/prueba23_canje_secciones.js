'use strict';
// 23 · EL CANJE, POR SECCIONES
// Visto en vivo: en una sola página se podía pedir un «Héroe de la Rebelión» y de paso marcar un
// título y un planeta. Cosas incompatibles en el mismo envío, y el alumno creyendo que se lleva
// tres. Ahora la recompensa elegida MANDA a la sección que necesita —o directa a enviar— y cada
// sección termina enviando, así que nadie cae en la de al lado.
//
// v3.42 (30-ago) · Y AHORA CADA RECOMPENSA TIENE SU PROPIA PÁGINA, con su imagen y su explicación:
// antes seis de las diez saltaban directas a enviar y se canjeaba a ciegas. El recorrido pasó a ser
// lista -> página de la recompensa -> (si hace falta un dato) su sección -> enviar. Lo que sigue
// protegiendo esta prueba es lo mismo de siempre: que nadie acabe en la sección de otro.
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
console.log("\n▶ 23 · El canje, por secciones");

const G = E.nuevoMundo();
const per = E.crearPERDemo(G).id;
const canje = G.FormApp.openByUrl(G.perObj_(G.perFila_(per).v).formCanjeEdit);
const titulos = () => canje.getItems().map(i => i.getTitle());
const item = t => canje.getItems().filter(i => i.getTitle() === t)[0];
const SUBMIT = G.FormApp.PageNavigationType.SUBMIT;

// ---------------------------------------------------------------- a) las secciones existen
const cat0 = G.recompensasCat_();
const saltos = canje.getItems(G.FormApp.ItemType.PAGE_BREAK);
const titSaltos = saltos.map(p => p.getTitle());
igual(saltos.length, cat0.length + 3, "una página por recompensa (" + cat0.length + ") más las tres de dato");
c(cat0.every(x => titSaltos.indexOf(G.etiquetaRecompensa_(x)) >= 0),
  "🔴 TODAS las recompensas tienen su página: ninguna se canjea a ciegas");
igual(titSaltos.slice(cat0.length), G.SECCIONES_CANJE, "y las de dato van al final, en su orden");
c(cat0.every(x => G.etiquetaRecompensa_(x).indexOf(String(x.coste)) >= 0),
  "el precio va en el título de la página: se ve lo que cuesta antes de enviar");

// ---------------------------------------------------------------- b) cada recompensa va a la suya
const cat = G.recompensasCat_();
const opciones = item("Recompensa").getChoices();
igual(opciones.length, cat.length, "una opción por recompensa del catálogo");
const destinoDe = nombre => {
  const k = cat.map(x => x.nombre).indexOf(nombre);
  const o = opciones[k];
  return o.getGotoPage() ? o.getGotoPage().getTitle() : o.getPageNavigationType();
};
c(cat.every(x => destinoDe(x.nombre) === G.etiquetaRecompensa_(x)),
  "🔴 elegir una recompensa lleva a SU página, no a enviar a ciegas");

// y desde esa página se sale a donde toca
const salidaDe = nombre => {
  const x = cat.filter(y => y.nombre === nombre)[0];
  const pb = canje.getItems(G.FormApp.ItemType.PAGE_BREAK)
                  .filter(p => p.getTitle() === G.etiquetaRecompensa_(x))[0];
  return pb.getGoToPage() ? pb.getGoToPage().getTitle() : pb.getPageNavigationType();
};
igual(salidaDe("Héroe de la Rebelión"), SUBMIT, "🔴 el héroe no pregunta nada más: de su página, a enviar");
igual(salidaDe("Sobre de cromos"), SUBMIT, "el sobre de cromos, igual");
igual(salidaDe("Marco dorado del avatar"), SUBMIT, "y el marco dorado");
igual(salidaDe("Título de recluta"), G.SEC_TITULO, "🔴 el título SÍ pasa por su sección");
igual(salidaDe("Fondo de ficha: tu planeta"), G.SEC_FONDO, "y el planeta a la suya");
c(cat.filter(x => x.tipo === "nota").every(x => salidaDe(x.nombre) === G.SEC_NOTA),
  "TODAS las de nota preguntan la actividad, no solo la que miré");

// ---------------------------------------------------------------- c) nadie cae en la sección de al lado
canje.getItems(G.FormApp.ItemType.PAGE_BREAK)
  .filter(p => G.SECCIONES_CANJE.indexOf(p.getTitle()) >= 0)
  .forEach(p => igual(p.getPageNavigationType(), SUBMIT,
    "🔴 «" + p.getTitle() + "» termina enviando: si no, quien pide un título acabaría eligiendo planeta"));

// ---------------------------------------------------------------- d) cada pregunta, detrás de SU sección
const orden = titulos();
G.SECCIONES_CANJE.forEach(sec => {
  igual(orden[orden.indexOf(sec) + 1], G.preguntaDeSeccion_(sec),
    "«" + G.preguntaDeSeccion_(sec) + "» va justo detrás de su sección");
});
c(orden.indexOf("Recompensa") < orden.indexOf(G.SECCIONES_CANJE[0]), "y la recompensa se pregunta antes que todo");

// ---------------------------------------------------------------- e) la actividad deja de molestar a todos
c(item(G.TIT_ACTIVIDAD).isRequired(), "la actividad sigue siendo obligatoria...");
c(orden.indexOf(G.TIT_ACTIVIDAD) > orden.indexOf(G.SEC_NOTA),
  "🔴 ...pero DENTRO de su sección: quien compra cromos ya no tiene que contestarla");
c(!item(G.TIT_ACTIVIDAD).getChoices().some(o => o.getValue().indexOf("No aplica") === 0),
  "y por eso ya no hace falta la opción «No aplica»");

// ---------------------------------------------------------------- f) idempotente y se adapta al catálogo
const antes = titulos().length;
G.reestructurarCanje_(canje); G.reestructurarCanje_(canje);
igual(titulos().length, antes, "🔴 pasarla dos veces no duplica secciones (la ejecutan crearPER y Mantenimiento)");
igual(canje.getItems(G.FormApp.ItemType.PAGE_BREAK).length, cat.length + 3, "ni saltos de página");

// si el catálogo no tiene recompensas de título, esa sección no se crea
const rec = G.hoja_(G.H.REC), datos = rec.getDataRange().getValues();
const filaTitulo = datos.findIndex(r => String(r[0]) === "Título de recluta");
rec.deleteRow(filaTitulo + 1);
G.reestructurarCanje_(canje);
const secs2 = canje.getItems(G.FormApp.ItemType.PAGE_BREAK).map(p => p.getTitle());
c(secs2.indexOf(G.SEC_TITULO) < 0, "🔴 si el catálogo se queda sin títulos, su sección desaparece");
c(secs2.indexOf("Título de recluta — 40 créditos") < 0, "y su página también");
igual(secs2.length, (cat.length - 1) + 2, "y quedan las páginas de las que siguen vivas");

// ---------------------------------------------------------------- desde una plantilla VACIA
// 🔴 Todas las pruebas de arriba parten de un canje que YA trae sus preguntas, y por eso ninguna
// recorría el camino de crearlas. En producción, la plantilla no las trae: el 27-ago crearPER se
// cayó con «act.asListItem is not a function» y el banco seguía verde.
// La diferencia es sutil y de Google: getItems() devuelve Items GENÉRICOS (con asListItem()) y
// addListItem() devuelve ya un ListItem, que NO lo tiene. Encadenar los dos revienta.
const virgen = G.FormApp.create("canje recien nacido");
G.reestructurarCanje_(virgen);   // si vuelve el fallo, esto sola lanza la excepción
const tits = virgen.getItems().map(i => i.getTitle());
c(tits.indexOf("Recompensa") >= 0, "en un canje vacío se crea la pregunta «Recompensa»");
c(tits.indexOf(G.TIT_ACTIVIDAD) >= 0, "y la de «" + G.TIT_ACTIVIDAD + "»");
const lista = virgen.getItems().filter(i => i.getTitle() === "Recompensa")[0];
c(lista.asListItem().getChoices().length > 0, "con sus opciones puestas, no vacía");
const secsV = virgen.getItems(G.FormApp.ItemType.PAGE_BREAK).map(p => p.getTitle());
c(secsV.length > 0, "y sus secciones (" + secsV.join(", ") + ")");
igual(G.reestructurarCanje_(virgen) === undefined || true, true, "y repetirlo no revienta");
igual(new Set(virgen.getItems().map(i => i.getTitle())).size,
      virgen.getItems().map(i => i.getTitle()).length, "🔴 sin preguntas duplicadas al repetir");

E.resumen("El canje, por secciones");
