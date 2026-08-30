'use strict';
// 8 · HALLAZGOS 1 y 2 · Las tareas que recorren TODOS los PER agotaban los 360 s de Apps Script
//     y dejaban la hoja a medias. Ahora van por lotes con continuación.
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
const M = E.M;
console.log("\n▶ 8 · Lotes con continuación (resetear y actualizar formularios)");

// dónde va el lote, en una cadena comparable
function clave(pr) { return pr ? pr.i + "/" + pr.fase : "fin"; }

function mundoConPERs(n) {
  const G = E.nuevoMundo();
  for (let i = 1; i <= n; i++) {
    E.crearPERDemo(G, { nombre: "GRUPO " + i });
    E.enviarBitacora(G, "grupo-" + i, { email: "a" + i + "@alumno.es", alias: "A" + i, nombre: "A A", profe: "Mr Cuarter" });
  }
  return G;
}

// ---------------------------------------------------------------- actualizar formularios
let G = mundoConPERs(5);
c(typeof G.actualizarFormularios_ === "function", "existe el núcleo sin interfaz actualizarFormularios_()");

G.MARGEN_MS = 0;                       // se acaba el tiempo enseguida: obliga a trocear
let r = G.actualizarFormularios_();
igual(r.terminado, false, "con poco tiempo NO termina de una pasada");
// v3.42 · la unidad de trabajo YA NO ES UN PER: cada uno va por fases (canje · Bitácora · ticket) y
// la Bitácora puede además quedarse a medias, porque ella sola se pasa de los 6 minutos en un grupo
// vivo. Así que lo que hay que exigir no es «un PER entero por pasada», sino que la pasada AVANCE:
// con el reloj a cero, se hace una unidad y se guarda por dónde iba.
const donde = G.progreso_("formularios");
c(!!donde && (donde.i > 0 || donde.fase > 0), "pero AVANZA: deja apuntado por dónde iba (fase " +
  (donde && donde.fase) + " del PER " + (donde && donde.i) + ")");
igual(r.total, 5, "y sabe cuántos hay en total");
c(!!G.progreso_("formularios"), "guarda por dónde iba");
c(M.Guiones.getProjectTriggers().some(t => t.getHandlerFunction() === "continuarActualizarFormularios"),
  "y programa la continuación automática");

// 🔴 y ADEMÁS no se atasca: cada pasada tiene que dejar el marcador más adelante que la anterior.
// Es la comprobación que faltaba el 30-ago, cuando dos pasadas seguidas dejaron el formulario igual.
let vueltas = 0, atascos = 0, antes = clave(G.progreso_("formularios"));
while (!r.terminado && vueltas < 200) {
  r = G.actualizarFormularios_(); vueltas++;
  const ahora = clave(G.progreso_("formularios"));
  if (r.terminado) break;
  if (ahora === antes) atascos++;
  antes = ahora;
}
igual(atascos, 0, "ninguna pasada se queda donde estaba: el lote siempre avanza");
igual(r.terminado, true, "en varias pasadas acaba (" + (vueltas + 1) + ")");
igual(r.hechos, 5, "y acaba con los 5 PER");
igual(G.progreso_("formularios"), null, "al terminar se borra el progreso");
c(!M.Guiones.getProjectTriggers().some(t => t.getHandlerFunction() === "continuarActualizarFormularios"),
  "y se cancela el trigger de continuación");

// con tiempo de sobra, una sola pasada
G = mundoConPERs(4);
r = G.actualizarFormularios_();
igual(r.terminado, true, "con tiempo normal termina de una vez");
igual(r.hechos, 4, "los 4 PER");
igual(M.Guiones.getProjectTriggers().filter(t => t.getHandlerFunction() === "continuarActualizarFormularios").length, 0,
  "y no deja triggers sueltos");

// el efecto es el de siempre: el canje con precios en créditos y la Bitácora reestructurada
const o = G.perObj_(G.perFila_("grupo-1").v);
const fc = G.formDelPER_(o, "C");
const rec = fc.getItems().filter(i => i.getTitle() === "Recompensa")[0];
c(rec.getChoices().every(x => /créditos$/.test(x.getValue())), "las recompensas del canje van en créditos");
const fb = G.formDelPER_(o, "B");
igual(fb.getItems().filter(i => i.getTitle() === G.TIT_HOY).length, 1, "y la Bitácora tiene su portada con el selector");

// ---------------------------------------------------------------- resetear la hoja
G = mundoConPERs(5);
c(typeof G.resetear_ === "function", "existe el núcleo sin interfaz resetear_()");
igual(G.hoja_("PERs").getLastRow() - 1, 5, "partimos de 5 PER");

G.MARGEN_MS = 0;
let s = G.resetear_();
igual(s.terminado, false, "el reseteo tampoco cabe en una pasada");
c(G.hoja_("PERs").getLastRow() - 1 < 5, "pero ya ha borrado alguno");
c(!!G.progreso_("reset"), "y guarda la fase por la que iba");
c(M.Guiones.getProjectTriggers().some(t => t.getHandlerFunction() === "continuarReset"), "con su continuación programada");

vueltas = 0;
while (!s.terminado && vueltas < 40) { s = G.resetear_(); vueltas++; }
igual(s.terminado, true, "en varias pasadas acaba");
igual(G.hoja_("PERs").getLastRow() - 1, 0, "no queda ningún PER");
igual(G.hoja_("EVENTOS").getLastRow(), 1, "EVENTOS queda solo con su cabecera");
igual(G.hoja_("AJUSTES").getLastRow(), 1, "AJUSTES también");
igual(G.hoja_("RECOMPENSAS").getLastRow() - 1, G.RECOMPENSAS_INICIALES.length, "y el catálogo queda restaurado");
igual(G._maestra.getSheets().filter(h => /^(?:restos · )?[BTC] · /.test(h.getName())).length, 0,
  "🔴 no quedan pestañas huérfanas de respuestas (el fallo del 25-ago)");
igual(G.progreso_("reset"), null, "se borra el progreso");
c(!M.Guiones.getProjectTriggers().some(t => t.getHandlerFunction() === "continuarReset"), "y el trigger de continuación");

// se conserva lo que debe conservarse
igual(M.Props.getScriptProperties().getProperty("PIN_PROFES"), null, "");   // (no había PIN puesto)
G = mundoConPERs(2);
M.Props.getScriptProperties().setProperty("PIN_PROFES", "sg2026");
M.Props.getScriptProperties().setProperty("PANEL_STD_VER", "https://view.genially.com/x");
s = G.resetear_(); vueltas = 0;
while (!s.terminado && vueltas < 40) { s = G.resetear_(); vueltas++; }
igual(M.Props.getScriptProperties().getProperty("PIN_PROFES"), "sg2026", "el PIN del profesorado se conserva");
igual(M.Props.getScriptProperties().getProperty("PANEL_STD_VER"), "https://view.genially.com/x", "y el panel estándar");

E.resumen("Lotes con continuación");
