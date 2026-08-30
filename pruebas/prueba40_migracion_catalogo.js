'use strict';
// 40 · MIGRAR EL CATÁLOGO EN UN GRUPO QUE YA EXISTE  (el fallo del 30-ago, en vivo)
//
// El 30-ago se cambió el catálogo a v3.41 y se ejecutó `actualizarFormularios_()` sobre un PER que
// ya estaba montado. DOS pasadas seguidas murieron con «Exceeded maximum execution time» y dejaron
// el formulario EXACTAMENTE igual que estaba: no converge nunca. Y el banco daba verde, porque el
// simulador era más fácil que Google en las dos cosas que importaban:
//
//   a) DEJABA BORRAR una página a la que todavía apuntaba una opción de un desplegable. Google no:
//      responde «Invalid data updating form» y el borrado NO se hace. Por eso «La batalla final»
//      sobrevivía a la primera pasada —con el reto SECRETO dentro, a la vista de cualquiera.
//   b) ESCRIBIR ERA GRATIS. En Google cada `setHelpText` / `addItem` / `moveItem` cuesta, y un solo
//      PER se pasaba de los 6 minutos. El lote se trocea por PER, así que trocear no servía de nada:
//      la unidad que no cabe es UN PER.
//
// Ahora el simulador cobra las escrituras (`M.cronometro`) y valida la navegación al borrar, así
// que esta batería es la que habría cantado el fallo antes de tocar producción.
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
const M = E.M;
console.log("\n▶ 40 · Migrar el catálogo en un grupo que ya existe");

// ---------------------------------------------------------------- envejecer un formulario
// Deja la Bitácora como estaba ANTES de la v3.41: páginas «Tema N», la Batalla final con su casilla,
// su enlace y su hueco en el selector de planeta, sin el reto secreto y con las ayudas viejas.
// Es el punto de partida real de la migración del 30-ago.
function envejecer(G, fb, o) {
  const uno = t => fb.getItems().filter(i => i.getTitle() === t)[0];
  const temas = [1, 2, 3, 4, 5, 6, 7, 8];

  // las páginas se llamaban «Tema N · ...»
  fb.getItems("PAGE_BREAK").forEach(pb => {
    const t = G.temaDePagina_(pb.getTitle());
    if (t >= 1 && t <= 8) pb.setTitle(pb.getTitle().replace("Planeta ", "Tema "));
  });

  // el reto secreto S7 aún no existía
  const s7 = G.retosDe_(o.tipo).filter(r => r[0] === "S7")[0];
  [s7[1], G.tituloEvidenciaReto_(s7)].forEach(t => { const i = uno(t); if (i) fb.deleteItem(i); });

  // las ayudas de todo lo que la migración es dueña de reescribir, en su versión vieja.
  // (Las del alistamiento —«Quién soy», el alias, la biografía…— las escribe SOLO `identidadBitacora_`
  // al crear el PER, así que la migración no las toca y aquí no se tocan tampoco.)
  const suyas = {};
  [G.TIT_INTRO, G.TIT_HOY, G.TIT_PAG_ALTA, G.TIT_PAG_PLANETA, G.TIT_PLANETA, G.TIT_DOCENTE,
   "Elige tu avatar", "Correo"].forEach(x => { suyas[x] = true; });
  G.retosDe_(o.tipo).forEach(r => { suyas[r[1]] = true; suyas[G.tituloEvidenciaReto_(r)] = true; });
  fb.getItems().forEach(i => {
    if (!suyas[i.getTitle()] && G.temaDePagina_(i.getTitle()) === 0) return;
    try { i.setHelpText("(texto de la v3.40)"); } catch (e) {}
  });

  // y la Batalla final: página propia, casilla, enlace y la 9ª opción del selector
  const pbXF = fb.addPageBreakItem().setTitle("La batalla final").setHelpText("Solo cuando hayas hecho el examen.");
  fb.addCheckboxItem().setTitle("Batalla final: examen realizado").setChoiceValues([G.OPC_HECHO]);
  fb.addTextItem().setTitle("Enlace · Batalla final: examen realizado");
  const sel = uno(G.TIT_PLANETA);
  sel.setChoices(temas.map(t => sel.createChoice("Tema " + t + " · " + G.TEMAS[t][0], uno("Tema " + t + " · " + G.TEMAS[t][0])))
    .concat([sel.createChoice("La batalla final", pbXF)]));
  return fb;
}

function mundoViejo() {
  const G = E.nuevoMundo();
  const per = E.crearPERDemo(G).id;
  const o = G.perObj_(G.perFila_(per).v);
  envejecer(G, G.formDelPER_(o, "B"), o);
  return { G, per, o };
}

// ================================================================================================
// a) EL ORDEN DE OPERACIONES: primero se reescribe el selector, y DESPUÉS se borra la página
// ================================================================================================
// 🔴 Esto es el fallo 1 tal cual. Con el código de antes, el paso «fuera lo viejo» intentaba borrar
// «La batalla final» mientras el selector de planeta seguía teniendo una opción que llevaba allí:
// Google decía que no, el `catch` se lo tragaba y la página se quedaba. Para siempre, porque la
// segunda pasada (que sí habría podido) nunca llegaba.
{
  const { G, o } = mundoViejo();
  const fb = G.formDelPER_(o, "B");

  // el punto de partida es el de verdad: la página existe y el selector apunta a ella
  c(fb.getItems().some(i => i.getTitle() === "La batalla final"), "de partida, el formulario viejo tiene la página «La batalla final»");
  const selAntes = fb.getItems().filter(i => i.getTitle() === G.TIT_PLANETA)[0];
  igual(selAntes.getChoices().length, 9, "y el selector de planeta ofrece 9 destinos (los 8 planetas y la batalla)");

  // y el simulador se comporta como Google: borrar esa página AHORA es imposible
  let no = "";
  try { fb.deleteItem(fb.getItems().filter(i => i.getTitle() === "La batalla final")[0]); }
  catch (e) { no = e.message; }
  contiene(no, "Invalid data updating form",
    "🔴 borrar una página a la que todavía navega un desplegable falla, igual que en Google");

  G.reestructurarBitacora_(fb, o);

  const titulos = fb.getItems().map(i => i.getTitle());
  igual(titulos.filter(t => t === "La batalla final").length, 0,
    "🔴 UNA SOLA PASADA se lleva la página «La batalla final»: el selector se reescribe ANTES de borrar");
  igual(titulos.filter(t => t === "Batalla final: examen realizado").length, 0, "y su casilla");
  igual(titulos.filter(t => t === "Enlace · Batalla final: examen realizado").length, 0, "y su enlace");
  c(G._log.join("\n").indexOf("Invalid data updating form") < 0,
    "🔴 y no queda ni un «Invalid data updating form» en el registro: no se intenta borrar a destiempo");

  const sel = fb.getItems().filter(i => i.getTitle() === G.TIT_PLANETA)[0];
  igual(sel.getChoices().length, 8, "el selector queda con los 8 planetas, ni uno más");
  c(sel.getChoices().every(x => /^Planeta \d · /.test(x.getValue())), "y todos se llaman «Planeta N · ...»");
  const vivas = {}; fb.getItems("PAGE_BREAK").forEach(p => { vivas[p.getId()] = true; });
  c(sel.getChoices().every(x => x.getGotoPage() && vivas[x.getGotoPage().getId()]),
    "🔴 y cada opción lleva a una página que EXISTE: ninguna apunta a algo borrado");

  // lo peor del fallo: el reto secreto quedaba dentro de la página huérfana, visible en el desplegable
  const s7 = G.retosDe_(o.tipo).filter(r => r[0] === "S7")[0];
  const pos = t => fb.getItems().map(i => i.getTitle()).indexOf(t);
  c(pos(s7[1]) > pos(G.tituloPlaneta_(7)), "el reto secreto S7 vuelve a su planeta (el 7)...");
  const pag8 = pos(G.tituloPlaneta_(8));
  c(pos(s7[1]) < pag8, "...y no se queda colgando en ninguna página posterior");
  const ev = fb.getItems().filter(i => i.getTitle() === G.tituloEvidenciaReto_(s7))[0];
  c(!!ev && ev.validacion && String(ev.validacion.patron).indexOf(G.PALABRA_HUEVO) >= 0,
    "y su evidencia recupera la validación de la palabra secreta");
}

// ================================================================================================
// b) LOS SEIS MINUTOS: un solo PER no cabe en una ejecución, así que hay que trocear POR DENTRO
// ================================================================================================
// 🔴 Fallo 2. El lote va por PER (`while pr.i < pers.length && t.puedo()`), pero la unidad que no
// cabe ES un PER: ~300 s en crear y poner al día los bloques y muerte en el bucle de `moveItem`.
// Aquí el simulador cobra 2 s por escritura (lo medido en producción) y mata la ejecución a los
// 360 s, exactamente como Apps Script — y `cronometro.muerto` sobrevive a los `catch` de Code.gs,
// que es lo que hace la comprobación fiable.
{
  const { G, o } = mundoViejo();

  // Este mundo de prueba tiene 20 retos y la migración completa son ~90 escrituras; el PER de
  // producción del 30-ago tenía más y pasó de los 6 minutos. El coste por escritura NO pretende ser
  // la latencia real de Google: es el mando con el que se le da a esta migración el MISMO PESO que
  // tenía aquella, que es lo que hay que reproducir.
  M.cronometro.coste = 5000;      // 5 s por escritura de Forms
  M.cronometro.limite = 360000;   // el corte duro de Apps Script: a los 6 minutos, fuera

  let r, vueltas = 0, muertes = 0, peor = 0;
  do {
    M.cronometro.arrancar();
    try { r = G.actualizarFormularios_(); }
    catch (e) { r = { terminado: false }; }
    peor = Math.max(peor, M.cronometro.extra - M.cronometro.t0);
    if (M.cronometro.muerto) muertes++;
    vueltas++;
  } while (!r.terminado && vueltas < 30);

  igual(muertes, 0, "🔴 NINGUNA pasada se pasa de los 6 minutos: la migración se trocea por dentro");
  // y no de milagro: entre el trabajo efectivo (MARGEN_MS) y el corte duro tiene que quedar aire de
  // verdad. Sin el colchón de MARGEN_FASE_MS, empezar el canje del PER siguiente a los 4 min y medio
  // dejaba pasadas de 355 s — a cinco segundos de morir.
  c(peor <= 330000, "y con margen: la peor pasada se queda en " + Math.round(peor / 1000) + " s de los 360");
  igual(r.terminado, true, "y la migración TERMINA (antes se quedaba dando vueltas sin converger)");
  c(vueltas > 1, "hacen falta varias pasadas para un solo PER (" + vueltas + "), que es justo el problema");

  // y lo importante: al terminar, el formulario es el del catálogo nuevo
  const fb = G.formDelPER_(o, "B");
  const titulos = fb.getItems().map(i => i.getTitle());
  igual(titulos.filter(t => t === "La batalla final").length, 0, "sin la página de la Batalla final");
  G.retosDe_(o.tipo).forEach(rr => {
    igual(titulos.filter(t => t === rr[1]).length, 1, "cada reto tiene su casilla: " + rr[0]);
    igual(titulos.filter(t => t === G.tituloEvidenciaReto_(rr)).length, 1, "y su enlace: " + rr[0]);
  });
  const ayudasViejas = fb.getItems().filter(i => String(i.getHelpText() || "").indexOf("v3.40") >= 0);
  igual(ayudasViejas.length, 0, "y no queda ni una ayuda de la versión anterior");

  M.cronometro.cero();
}

// ================================================================================================
// c) SEGUNDA PASADA GRATIS: lo que ya está bien no se reescribe
// ================================================================================================
// Es lo que hace posible trocear: si cada pasada volviera a escribirlo TODO desde el principio, el
// trabajo hecho se pagaría otra vez y la migración no avanzaría nunca. Un formulario que ya está al
// día tiene que costar CERO escrituras.
{
  const { G, o } = mundoViejo();
  const fb = G.formDelPER_(o, "B");
  G.reestructurarBitacora_(fb, o);          // migración completa, con tiempo de sobra

  M.cronometro.escrituras = 0;
  G.reestructurarBitacora_(fb, o);          // y ahora, sobre un formulario ya al día
  igual(M.cronometro.escrituras, 0,
    "🔴 pasar la migración sobre un formulario YA al día no escribe NADA (" + M.cronometro.escrituras + " escrituras)");
  M.cronometro.cero();
}

// ================================================================================================
// d) LA IDENTIDAD DE UN ITEM ES SU getId(), NUNCA ===
// ================================================================================================
// Cada `getItems()` de Google devuelve envoltorios NUEVOS: `it === tras` es false SIEMPRE, aunque
// sean el mismo item. El filtro de «preguntas no reconocidas» comparaba así, o sea que el
// desplegable de planeta se colaba entre las sueltas y acababa DENTRO del alistamiento — con lo que
// quien venía solo a registrar un reto se encontraba el alistamiento entero por delante.
{
  const { G, o } = mundoViejo();
  const fb = G.formDelPER_(o, "B");

  // el simulador ya no miente: dos lecturas del mismo item no son el mismo objeto
  const a = fb.getItems()[0], b = fb.getItems()[0];
  c(a !== b, "🔴 dos getItems() devuelven envoltorios distintos, como Google");
  igual(a.getId(), b.getId(), "pero son el MISMO item: lo dice getId()");

  // una pregunta que el código no conoce: tiene que quedarse en el alistamiento
  fb.addTextItem().setTitle("Pregunta rara de un curso anterior");

  G.reestructurarBitacora_(fb, o);

  const titulos = fb.getItems().map(i => i.getTitle());
  const pos = t => titulos.indexOf(t);
  // v3.42 · entre la página y el selector va la escena de NEBULA («Elige el planeta»), que es un
  // banner. Lo que esta comprobación protege sigue intacto: que el selector esté EN su página y no
  // arrastrado al alistamiento, así que se exige que lo único que puede haber en medio sea la escena.
  const entre = titulos.slice(pos(G.TIT_PAG_PLANETA) + 1, pos(G.TIT_PLANETA));
  igual(entre, [G.TIT_ESCENA_PLANETA],
    "🔴 el selector de planeta va en SU página (solo la escena de NEBULA delante), no arrastrado al alistamiento");
  c(pos(G.TIT_PLANETA) > pos(G.TIT_PAG_PLANETA), "y nunca antes de su propia página");
  igual(pos(G.TIT_TRAS_ALTA) + 1, pos(G.TIT_PAG_PLANETA),
    "y «¿registras algo ahora?» sigue siendo lo último del alistamiento");
  c(pos("Pregunta rara de un curso anterior") > pos(G.TIT_PAG_ALTA) &&
    pos("Pregunta rara de un curso anterior") < pos(G.TIT_TRAS_ALTA),
    "la pregunta que no se reconoce se queda dentro del alistamiento, que es de donde venía");
  contiene(G._log.join("\n"), "preguntas no reconocidas", "y queda apuntada en el registro");
}

E.resumen("Migrar el catálogo en un grupo que ya existe");
