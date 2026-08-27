'use strict';
// 23 · EL CANJE, POR SECCIONES
// Visto en vivo: en una sola página se podía pedir un «Héroe de la Rebelión» y de paso marcar un
// título y un planeta. Cosas incompatibles en el mismo envío, y el alumno creyendo que se lleva
// tres. Ahora la recompensa elegida MANDA a la sección que necesita —o directa a enviar— y cada
// sección termina enviando, así que nadie cae en la de al lado.
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
const saltos = canje.getItems(G.FormApp.ItemType.PAGE_BREAK);
igual(saltos.length, 3, "hay tres secciones: título, planeta y actividad");
igual(saltos.map(p => p.getTitle()), G.SECCIONES_CANJE, "y en ese orden");

// ---------------------------------------------------------------- b) cada recompensa va a la suya
const cat = G.recompensasCat_();
const opciones = item("Recompensa").getChoices();
igual(opciones.length, cat.length, "una opción por recompensa del catálogo");
const destinoDe = nombre => {
  const k = cat.map(x => x.nombre).indexOf(nombre);
  const o = opciones[k];
  return o.getGotoPage() ? o.getGotoPage().getTitle() : o.getPageNavigationType();
};
igual(destinoDe("Héroe de la Rebelión"), SUBMIT, "🔴 el héroe no pregunta nada más: va directo a enviar");
igual(destinoDe("Sobre de cromos"), SUBMIT, "el sobre de cromos, igual");
igual(destinoDe("Marco dorado del avatar"), SUBMIT, "y el marco dorado");
igual(destinoDe("Título de recluta"), G.SEC_TITULO, "🔴 el título SÍ manda a su sección");
igual(destinoDe("Fondo de ficha: tu planeta"), G.SEC_FONDO, "y el planeta a la suya");
igual(destinoDe("Recalificar un suspenso"), G.SEC_NOTA, "y los canjes de nota preguntan la actividad");
c(cat.filter(x => x.tipo === "nota").every(x => destinoDe(x.nombre) === G.SEC_NOTA),
  "TODAS las de nota van a la sección de actividad, no solo la que miré");

// ---------------------------------------------------------------- c) nadie cae en la sección de al lado
saltos.forEach(p => igual(p.getGoToPage(), SUBMIT,
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
igual(canje.getItems(G.FormApp.ItemType.PAGE_BREAK).length, 3, "ni saltos de página");

// si el catálogo no tiene recompensas de título, esa sección no se crea
const rec = G.hoja_(G.H.REC), datos = rec.getDataRange().getValues();
const filaTitulo = datos.findIndex(r => String(r[0]) === "Título de recluta");
rec.deleteRow(filaTitulo + 1);
G.reestructurarCanje_(canje);
const secs2 = canje.getItems(G.FormApp.ItemType.PAGE_BREAK).map(p => p.getTitle());
c(secs2.indexOf(G.SEC_TITULO) < 0, "🔴 si el catálogo se queda sin títulos, su sección desaparece");
igual(secs2.length, 2, "y quedan las otras dos");

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
