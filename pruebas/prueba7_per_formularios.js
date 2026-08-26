'use strict';
// 7 · Crear un PER (3 formularios, carpeta, documento, triggers) y MIGRAR un formulario antiguo
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
const M = E.M;
console.log("\n▶ 7 · Creación de PER y migración de formularios antiguos");

const G = E.nuevoMundo();
const r = E.crearPERDemo(G);

igual(r.id, "prueba-banco", "el id sale del nombre (slug)");
c(!!r.formBitacora && !!r.formTicket && !!r.formCanje, "se crean los 3 formularios");
c(!!r.doc, "y el documento de enlaces");
contiene(r.foro, "&inicio=", "el enlace del foro lleva &inicio= (carga instantánea)");
contiene(r.embedNave, "recluta.html", "y hay embed de la Nave");

// carpeta propia
const raizForms = G.carpetaPER_();
igual(raizForms.getName(), "Formularios PER", "existe la carpeta «Formularios PER»");
const propia = G.carpetaDelPER_("PRUEBA BANCO", false);
igual(propia.getName(), "PRUEBA BANCO", "y cada PER tiene la suya");
igual(propia.getFilesByType(M.Mimes.GOOGLE_FORMS) ? 3 : 0, 3, "con sus formularios dentro");

// pestañas y triggers
["B", "T", "C"].forEach(k => c(!!G._maestra.getSheetByName(k + " · prueba-banco"), "pestaña " + k + " creada"));
c(M.Guiones.getProjectTriggers().some(t => t.getHandlerFunction() === "alRecibirRespuesta"), "trigger onFormSubmit instalado");
c(M.Guiones.getProjectTriggers().some(t => t.getHandlerFunction() === "fotoNocturna"), "y la foto nocturna de las 4:00");

// equipo docente
const ds = G.docentesDe_("prueba-banco");
igual(ds.length, 3, "el equipo docente queda guardado");
igual(ds.filter(G.esReferente_).length, 1, "un referente");
igual(ds.filter(G.imparte_).length, 3, "y los 3 imparten (el referente, con las dos casillas)");
igual(G.listaProfes_("", "", "prueba-banco").length, 3, "el desplegable del alumnado ofrece a los 3");

// un docente que SOLO es referente no sale en el desplegable del alumnado
G.guardarDocentes_("prueba-banco", [
  { nombre: "Jefa", correo: "jefa@x.es", rol: "referente" },
  { nombre: "Profe", correo: "profe@x.es", rol: "imparte" }]);
igual(G.listaProfes_("", "", "prueba-banco"), ["Profe"], "quien solo es referente NO se le ofrece al alumnado");
igual(G.correosAviso_("prueba-banco", "Profe"), ["jefa@x.es", "profe@x.es"], "pero sí recibe los avisos");
G.guardarDocentes_("prueba-banco", E.DOCENTES_DEMO);

// no se puede crear dos veces el mismo
let err = "";
try { E.crearPERDemo(G); } catch (e) { err = e.message; }
contiene(err, "Ya existe un PER", "no deja crear dos PER con el mismo id");

// ---------------------------------------------------------------- migrar un formulario antiguo
// Simulamos una Bitácora v3.7: con galería clásica, con la URL propia gratis, sin «¿Quién imparte
// tu clase?», sin el selector de secciones y con las páginas sin «enviar al terminar».
const o = G.perObj_(G.perFila_("prueba-banco").v);
const fb = G.formDelPER_(o, "B");
fb.getItems().forEach(i => {
  if (i.getTitle() === "¿Quién imparte tu clase?") fb.deleteItem(i);
  if (i.getTitle() === "¿Qué vienes a registrar hoy?") fb.deleteItem(i);
  if (i.getTitle() === "Elige tu avatar") i.setChoiceValues(["Clásico 1", "Clásico 2", "Personaje 1 · ella (evoluciona)"]);
});
fb.addTextItem().setTitle("URL de tu propia imagen (opcional)");
fb.getItems(G.FormApp ? "PAGE_BREAK" : "PAGE_BREAK").forEach(pb => pb.setGoToPage(null));

igual(fb.getItems().filter(i => i.getTitle() === "¿Quién imparte tu clase?").length, 0, "el formulario viejo no tiene la pregunta del docente");

G.reestructurarBitacora_(fb, o);

const titulos = fb.getItems().map(i => i.getTitle());
igual(titulos.filter(t => t === "¿Quién imparte tu clase?").length, 1, "la migración añade «¿Quién imparte tu clase?»");
igual(titulos.filter(t => t === "¿Qué vienes a registrar hoy?").length, 1, "y el selector de secciones");
igual(titulos.filter(t => t.indexOf("URL de tu propia imagen") === 0).length, 0, "y RETIRA la URL propia gratis");
const av = fb.getItems().filter(i => i.getTitle() === "Elige tu avatar")[0];
c(av.getChoices().every(x => /^Personaje [1-7] · /.test(x.getValue())), "el avatar ofrece los SIETE personajes: los 5-7 dejan de ser de pago");
igual(av.getChoices().length, 14, "los 7 personajes × ella/él");
const pbs = fb.getItems("PAGE_BREAK");
c(pbs.length > 0 && pbs.every(p => p.getGoToPage() === "SUBMIT"), "cada sección envía al terminar");
const nav = fb.getItems().filter(i => i.getTitle() === "¿Qué vienes a registrar hoy?")[0];
igual(nav.getChoices().length, pbs.length + 1, "el selector lleva una opción por sección más «nada más»");
igual(nav.getChoices()[0].getValue(), "Nada más: solo me alisto / actualizo mis datos", "empezando por «nada más»");

// es idempotente
G.reestructurarBitacora_(fb, o);
G.reestructurarBitacora_(fb, o);
igual(fb.getItems().filter(t => t.getTitle() === "¿Quién imparte tu clase?").length, 1, "reestructurar dos veces no duplica nada");
igual(fb.getItems().filter(t => t.getTitle() === "¿Qué vienes a registrar hoy?").length, 1, "ni el selector");

// y después de migrar, el alumno puede registrar con normalidad
E.enviarBitacora(G, "prueba-banco", { email: "mig@alumno.es", alias: "Mig", nombre: "M M", profe: "Mr Cuarter" });
igual(G.tablero_("prueba-banco", true).reclutas.length, 1, "tras migrar, el alistamiento sigue funcionando");

// ── Mantenimiento → «Actualizar las imágenes de los formularios» ────────────────────────────────
// 🔴 26-ago · refrescaba los ocho orbes de planeta y SE DEJABA LA LÁMINA DE PERSONAJES. Como la
// lámina se copia dentro de la Bitácora al crear el PER, se quedaba congelada para siempre: los
// grupos vivos seguían enseñando los umbrales de rango de antes de la v3.7 y no había forma de
// cambiarlos sin rehacer el grupo. Se vio en la web, no aquí, así que aquí queda la comprobación.
// el título va literal a propósito: si alguien renombra la constante, esto tiene que CANTARLO,
// no seguir comparando contra un undefined que no coincide con nada
const TIT_LAM = "Tu personaje evoluciona con tu nivel";
const fbImg = G.formDelPER_(G.perObj_(G.perFila_("prueba-banco").v), "B");
const lamina = () => fbImg.getItems("IMAGE").filter(i => i.getTitle() === TIT_LAM)[0] || null;
c(!!lamina(), "al crear el PER, la Bitácora lleva la lámina de personajes");
const blobViejo = lamina() && lamina().blob;

M.Fetch.llamadas.length = 0;
M.UI.responder("YES");
G.actualizarImagenesPlanetas();

c(M.Fetch.llamadas.some(u => u.indexOf("lamina_personajes.jpg") >= 0),
  "🔴 al actualizar las imágenes se vuelve a bajar la LÁMINA, no solo los orbes");
igual(M.Fetch.llamadas.filter(u => u.indexOf("/planetas/") >= 0).length, 8, "y los ocho orbes de planeta");
c(!!lamina() && lamina().blob !== blobViejo, "la lámina del formulario queda sustituida por la recién bajada");

E.resumen("Creación de PER y migración de formularios antiguos");
