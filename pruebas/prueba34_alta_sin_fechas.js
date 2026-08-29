'use strict';
// 34 · MENOS PREGUNTAS AL CREAR UN GRUPO, Y EL RANKING QUE FALTABA (v3.30)
// Norberto, probando el alta a mano: «las fechas de apertura y cierre sobran, ya las sabemos» y
// «el panel de Genially es siempre el mismo». Así que el alta pregunta tres cosas menos y el
// calendario sale entero de la fecha de la semana 1, que además viene puesta.
// De propina: al crear el PER faltaba el embed del ranking público, el único que se puede enseñar
// en clase sin que salga el dinero de nadie.
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
const M = E.M;
const fs = require("fs"), path = require("path");
console.log("\n▶ 34 · El alta pregunta menos y el ranking se puede incrustar");

const G = E.nuevoMundo();

// ---------------------------------------------------------------- a) la ventana de alta
const D = fs.readFileSync(path.join(__dirname, "..", "apps-script", "Dialog.html"), "utf8");
c(D.indexOf('id="apertura"') < 0, "🔴 ya no pregunta desde cuándo abren los formularios");
c(D.indexOf('id="cierre"') < 0, "🔴 ni cuándo cierra el registro de misiones");
c(D.indexOf('id="cierreCanje"') < 0, "🔴 ni cuándo cierra el canje");
c(!/apertura:v\(/.test(D), "🔴 y tampoco las manda al servidor a escondidas");
c(D.indexOf('id="inicio"') >= 0, "la fecha de la semana 1 sigue, que es la que manda");
c(D.indexOf('id="calNota"') >= 0, "y debajo se cuenta el calendario que va a salir");
c(/hoy\.getDay\(\)/.test(D), "la semana 1 viene puesta de fábrica: el lunes que viene");
contiene(D, "r.embedRanking", "el resultado del alta ofrece el embed del ranking público");

// ---------------------------------------------------------------- b) el calendario, sin tocar nada
// tal y como lo manda ahora la ventana: nombre, tipo, semana 1 y profesorado. Nada más.
const r = G.crearPER({ nombre: "GRUPO SIN FECHAS", tipo: "REGULAR", inicio: "2026-09-14",
                       referente: "Norberto Cuartero", profesores: "Mr Cuarter",
                       docentes: E.DOCENTES_DEMO });
igual(r.apertura, "2026-09-14", "los formularios abren el primer día de la semana 1");
igual(r.cierre, "2026-12-27", "el registro de misiones cierra al acabar la semana 15");
igual(r.cierreCanje, "2027-01-03", "y el canje aguanta una semana más");

// ---------------------------------------------------------------- c) el Genially de fábrica
const OFI_VER = "https://view.genially.com/6a8bfc4f5068ad5903fc39e3";
const OFI_EDIT = "https://app.genially.com/editor/6a8bfc4f5068ad5903fc39e3";
igual(G.panelStd_().ver, OFI_VER, "sin configurar nada, el panel estándar es el Genially oficial");
igual(G.panelStd_().editar, OFI_EDIT, "y su enlace de edición");
igual(r.panelVer, OFI_VER, "un grupo nuevo nace con ese panel");
igual(r.panelEdit, OFI_EDIT, "también para el profesorado");
M.Props.getScriptProperties().setProperty("PANEL_STD_VER", "https://view.genially.com/otro");
igual(G.panelStd_().ver, "https://view.genially.com/otro", "el referente puede poner otro");
M.Props.getScriptProperties().setProperty("PANEL_STD_VER", "");
igual(G.panelStd_().ver, OFI_VER, "🔴 y si lo borra, vuelve el oficial: nunca se queda sin panel");

// ---------------------------------------------------------------- d) el ranking público
contiene(r.embedRanking, "registro.html?per=grupo-sin-fechas&embed=1&solo=1",
         "el alta da el embed del ranking público");
contiene(r.embedRanking, "<iframe", "y es un código para pegar en Genially, no una URL suelta");
contiene(r.ranking, "solo=1", "y el enlace para abrirlo aparte");

const docs = Object.keys(M.Documento.registro).map(k => M.Documento.registro[k].getBody().getText());
// v3.36 · el ranking dejó de ser un ENLACE del documento y pasó a ser solo un EMBED: su enlace
// suelto es registro.html, que es la web del profesorado. Se sigue comprobando que está y que se
// llama por su nombre — pero en la sección de códigos para pegar en Genially, que es su sitio.
const enlaces = docs.filter(t => /Para MONTAR el Genially del alumnado/.test(t))[0] || "";
contiene(enlaces, "&embed=1&solo=1", "el documento de enlaces del grupo también lo lleva");
contiene(enlaces, "ranking público", "con su nombre, para encontrarlo");
c(/ni los créditos, ni el correo/.test(enlaces), "y avisa de lo que ese embed NO enseña");

// ---------------------------------------------------------------- e) la visita guiada mira dónde pisa
const T = fs.readFileSync(path.join(__dirname, "..", "assets", "js", "tour.js"), "utf8");
c(!/\.scrollIntoView\(/.test(T), "🔴 la visita ya no llama a scrollIntoView, que se perdía al cambiar de página");
c(/function enfocar\(/.test(T), "calcula la posición a mano");
c(/scrollRestoration/.test(T), "y le quita el volante al navegador mientras dura la visita");
c(T.indexOf("enfocar(tg,recien)") >= 0, "🔴 y enfoca DESPUÉS de pintar el panel, que es lo que tapa");
c(/scrollBehavior='auto'/.test(T), "🔴 y desactiva el scroll suave del CSS al reajustar: si no, se pasa de largo");
const CSS = fs.readFileSync(path.join(__dirname, "..", "assets", "css", "stargate.css"), "utf8");
c(/html\{scroll-behavior:smooth\}/.test(CSS), "(el CSS sigue teniendo el scroll suave, que es lo que obliga a lo anterior)");

E.resumen("El alta pregunta menos y el ranking se puede incrustar");
