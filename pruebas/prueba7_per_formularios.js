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
igual(titulos.filter(t => t === G.TIT_HOY).length, 1, "y la portada nueva con su selector");
// v3.37 · la migración de un formulario viejo tiene que dejarlo EXACTAMENTE como uno nuevo
igual(titulos.filter(t => t === G.TIT_NAV).length, 0,
  "🔴 el desplegable viejo no se queda por ahí: se reconvierte en el del final del alistamiento");
igual(titulos.filter(t => t === G.TIT_TRAS_ALTA).length, 1, "que es ese");
igual(titulos.filter(t => /^Tema \d · Lo que he completado$/.test(t)).length, 0,
  "y las casillas viejas «una por planeta» desaparecen");
G.RETOS_REGULAR.forEach(r => {
  igual(titulos.filter(t => t === r[1]).length, 1, "cada reto tiene SU casilla: " + r[0]);
  igual(titulos.filter(t => t === G.tituloEvidenciaReto_(r)).length, 1, "y su enlace: " + r[0]);
});
igual(titulos.filter(t => t.indexOf("URL de tu propia imagen") === 0).length, 0, "y RETIRA la URL propia gratis");
const av = fb.getItems().filter(i => i.getTitle() === "Elige tu avatar")[0];
c(av.getChoices().every(x => /^Personaje [1-7] · /.test(x.getValue())), "el avatar ofrece los SIETE personajes: los 5-7 dejan de ser de pago");
igual(av.getChoices().length, 14, "los 7 personajes × ella/él");
const pbs = fb.getItems("PAGE_BREAK");
c(pbs.length > 0 && pbs.every(p => p.getPageNavigationType() === "SUBMIT"), "cada sección envía al terminar");
// v3.37 · la navegación va en TRES desplegables: la portada (alistarse / registrar), el del final
// del alistamiento y el de elegir planeta. El de la portada tiene DOS opciones, siempre.
const hoy = fb.getItems().filter(i => i.getTitle() === G.TIT_HOY)[0];
igual(hoy.getChoices().map(x => x.getValue()), [G.OPC_ALTA, G.OPC_RETOS],
  "la portada pregunta una sola cosa y ofrece dos caminos");
const selP = fb.getItems().filter(i => i.getTitle() === G.TIT_PLANETA)[0];
igual(selP.getChoices().length, pbs.length - 2, "el selector de planeta lleva uno por planeta (los otros dos saltos son alistamiento y elegir)");
c(selP.getChoices().every(x => /^(Planeta \d · |La batalla final)/.test(x.getValue())),
  "🔴 y se llaman PLANETAS, no «Tema N»: es el nombre que el alumnado ve en el juego");

// es idempotente
G.reestructurarBitacora_(fb, o);
G.reestructurarBitacora_(fb, o);
igual(fb.getItems().filter(t => t.getTitle() === "¿Quién imparte tu clase?").length, 1, "reestructurar dos veces no duplica nada");
igual(fb.getItems().filter(t => t.getTitle() === G.TIT_HOY).length, 1, "ni el selector de la portada");

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

// ---------------------------------------------------------------- el documento del grupo
// 28-ago. Norberto leyó el documento entero y preguntó: «aquí no aparece el enlace más importante,
// el formulario de registro de retos, ¿cómo registran retos los estudiantes?». SÍ estaba — pero se
// llamaba «registro de insignias» (el resultado, no la acción) y salía en TERCER lugar, detrás de
// la Nave, su QR y su embed. El enlace que se usa cada semana, enterrado y con otro nombre.
const G9 = E.nuevoMundo();
E.crearPERDemo(G9, { nombre: "GRUPO DOC" });
const urlDoc = G9.crearDocumentoPER_("grupo-doc");
const cuerpo = M.Documento.registro[urlDoc.match(/document\/d\/([^/]+)/)[1]].cuerpo;
const parrafos = cuerpo.parrafos.map(x => x.texto);
const texto = parrafos.join("\n");

const iAlum   = parrafos.findIndex(t => /^1 · LO QUE SE COMPARTE CON EL ALUMNADO/.test(t));
const iEmbeds = parrafos.findIndex(t => /^2 · Para MONTAR/.test(t));
const iProfe  = parrafos.findIndex(t => /^3 · SOLO PROFESORADO/.test(t));
const iBit  = parrafos.findIndex(t => /bit[áa]cora de mando/i.test(t) && /^✅|^\S*\s*·/.test(t) === false || /BITÁCORA DE MANDO —/.test(t));
const iNave = parrafos.findIndex(t => /LA NAVE DEL RECLUTA —/.test(t));
c(iAlum >= 0 && iEmbeds > iAlum && iProfe > iEmbeds, "el documento va en cuatro bloques, y el del alumnado el primero");
c(iBit > iAlum, "la Bitácora está en la sección del alumnado");
c(iBit < iNave, "🔴 y va la PRIMERA de esa sección: es el enlace que se usa cada semana");

// 🔴 29-ago · LA REGLA DE ORO DEL DOCUMENTO. Norberto lo leyó en vivo: «los docentes deben tener MUY
// CLARO qué enlaces se comparten con los estudiantes y cuáles no». No era redacción: bajo el título
// «Para el Genially del alumnado» estaba registro.html llamado «Tablero de reclutas», y registro.html
// es la WEB DEL MÉTODO —guía de instalación incluida— con el acceso del profesorado. Quien repartiera
// ese enlace mandaba a su clase a la documentación interna.
//
// El alumnado toca CINCO cosas: el Genially, los tres formularios y la Nave. Esta comprobación no
// mira palabras: mira QUÉ URLs aparecen en esa sección.
const seccionAlumno = parrafos.slice(iAlum, iEmbeds).join("\n");
const seccionProfeTiene = x => parrafos.slice(iProfe).join("\n").indexOf(x) >= 0;
const SOLO_PROFES = ["registro.html", "profes.html", "clase.html", "tickets.html", "foro.html",
                     "embed.html", "grupos.html", "panel.html"];
igual(SOLO_PROFES.filter(x => seccionAlumno.indexOf(x) >= 0), [],
  "🔴 en la sección del alumnado NO se cuela ni una página del profesorado");
c(seccionAlumno.indexOf("recluta.html") >= 0, "sí está la Nave, que es la única página web que ve el alumnado");
const oDoc = G9.perObj_(G9.perFila_("grupo-doc").v);
igual([oDoc.formBitacora, oDoc.formTicket, oDoc.formCanje].filter(u => seccionAlumno.indexOf(u) < 0), [],
  "y los tres formularios, que es todo lo demás que tocan");
// la URL de EDICIÓN del Genially (no la palabra: la sección explica a propósito dónde está)
const urlEdicion = G9.panelStd_().editar;
c(!!urlEdicion && seccionAlumno.indexOf(urlEdicion) < 0 && seccionProfeTiene(urlEdicion),
  "🔴 el enlace de EDICIÓN del Genially está en la sección del profesorado, nunca en la del alumnado");
// y al revés: lo del profesorado está, pero en su sitio
const seccionProfe = parrafos.slice(iProfe).join("\n");

igual(["clase.html", "profes.html", "tickets.html", "registro.html", "embed.html"].filter(x => seccionProfe.indexOf(x) < 0), [],
  "la sección del profesorado sí las lleva todas");

// 🔴 y lo que veía el alumno al ENVIAR el formulario: iba a registro.html, o sea a la web del método
const conf = G9.confirmacionBitacora_("grupo-doc");
contiene(conf, "recluta.html?per=grupo-doc", "🔴 al enviar la Bitácora se le manda a SU Nave");
c(conf.indexOf("registro.html") < 0, "y NO a la web del profesorado, que es donde iba a parar hasta hoy");
contiene(texto, "registra sus retos",
  "🔴 se llama por lo que se HACE ahí (registrar retos), no solo por las insignias que salen");
contiene(texto, "se alista", "y dice que es también donde se alistan: es el MISMO formulario");
contiene(texto.toLowerCase(), "mismo enlace",
  "y que el enlace no cambia: la primera vez se rellena y después se edita");

// el dossier y el generador de embeds tienen que llamarlo IGUAL, o el profe cree que son dos cosas
const urlDos = G9.dossier_();
const dossier = M.Documento.registro[M.Props.getScriptProperties().getProperty("DOSSIER_ID")].cuerpo
  .parrafos.map(x => x.texto).join("\n");
contiene(dossier, "registra sus retos", "el dossier lo llama exactamente igual que el documento del grupo");
const embedJs = require("fs").readFileSync(
  require("path").join(__dirname, "..", "assets", "js", "embed.js"), "utf8");
c(/registra sus retos/.test(embedJs), "y el generador de embeds de la web, también");


// ---------------------------------------------------------------- la web dice lo mismo que el papel
// 29-ago · el documento ya separa alumnado y profesorado; la web tenía el mismo lío, y peor: en
// grupos.html, «Tablero del grupo» (registro.html) se describía como «el enlace que se comparte con
// el alumnado». Justo al revés.
const fsx = require("fs"), pathx = require("path");
const leer = f => fsx.readFileSync(pathx.join(__dirname, "..", "assets", "js", f), "utf8");
const grupos = leer("grupos.js"), clase = leer("clase.js");
c(!/registro\.html[^\]]*se comparte con el alumnado/.test(grupos),
  "🔴 grupos.html ya NO dice que el tablero sea el enlace del alumnado");
c(/'recluta\.html'[^\]]*'alu'/.test(grupos), "y marca la Nave como del alumnado");
c(/'registro\.html'[^\]]*'profe'/.test(grupos), "y el tablero como del profesorado");
const iAlu = clase.indexOf("acc-alu"), iPro = clase.indexOf("acc-profe");
c(iAlu > 0 && iPro > iAlu, "la sala del docente parte sus enlaces en dos bloques, el del alumnado primero");
c(clase.indexOf("'nave')") > iAlu && clase.indexOf("'nave')") < iPro, "la Nave está en el bloque del alumnado");
c(clase.indexOf("'tablero')") > iPro, "🔴 y el tablero, en el del profesorado");
c(clase.indexOf("'profes')") > iPro && clase.indexOf("'Enlaces, embeds y QR','embed')") > iPro,
  "igual que el panel del profesorado y el generador de embeds");

E.resumen("Creación de PER y migración de formularios antiguos");
