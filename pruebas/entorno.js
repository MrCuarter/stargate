'use strict';
/**
 * STARGATE · Banco de pruebas — el mundo
 * Carga el Code.gs REAL dentro de un contexto con Google simulado y ofrece los atajos que usan
 * las baterías: crear un PER, enviar la Bitácora, canjear, y comprobar.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const M = require("./mocks.js");
const FormApp = require("./formapp.js");

// Por defecto se prueba el Code.gs de verdad. STARGATE_GS permite probar OTRA copia —en concreto la
// 100 % ASCII que se pega en Apps Script— y comprobar que se comporta EXACTAMENTE igual.
const RUTA_GS = process.env.STARGATE_GS
  ? path.resolve(process.env.STARGATE_GS)
  : path.join(__dirname, "..", "apps-script", "Code.gs");
const RUTA_DATOS = process.env.STARGATE_DATOS
  ? path.resolve(process.env.STARGATE_DATOS)
  : path.join(__dirname, "..", "apps-script", "Datos.gs");
const RUTA_BONUS = process.env.STARGATE_BONUS
  ? path.resolve(process.env.STARGATE_BONUS)
  : path.join(__dirname, "..", "apps-script", "Bonus.gs");

// ------------------------------------------------------------------ comprobaciones
let ok = 0, mal = 0;
const fallos = [];
function comprobar(cond, texto) {
  if (cond) { ok++; return true; }
  mal++; fallos.push(texto); console.log("   ✗ " + texto); return false;
}
function igual(a, b, texto) {
  const bien = JSON.stringify(a) === JSON.stringify(b);
  if (!bien) return comprobar(false, texto + "  →  esperaba " + JSON.stringify(b) + " y fue " + JSON.stringify(a));
  return comprobar(true, texto);
}
function contiene(txt, frag, texto) { return comprobar(String(txt).indexOf(frag) >= 0, texto + "  →  no aparece «" + frag + "» en: " + String(txt).slice(0, 160)); }
function resumen(titulo) {
  console.log("\n   " + (mal ? "✗" : "✓") + " " + titulo + ": " + ok + " comprobaciones, " + mal + " fallos");
  if (mal) { console.log("     " + fallos.join("\n     ")); process.exitCode = 1; }
  return { ok, mal };
}

// ------------------------------------------------------------------ el mundo
function nuevoMundo() {
  M.Drive._archivos = {}; M.Drive._carpetas = {}; M.Drive._n = 0;
  M.Libro.registro = {}; M.Libro.n = 0;
  M.Correo.limpiar(); M.UI.limpiar(); M.Guiones._triggers = [];
  Object.keys(M.Props._mapas).forEach(k => delete M.Props._mapas[k]);

  const raiz = new M.Carpeta("c_raiz", "Mi unidad", null);
  M.Drive.raiz = raiz;
  const carpetaCurso = raiz.createFolder("STARGATE");

  const maestra = new M.Libro("STARGATE · Mando de PERs", "SS_MAESTRA");
  maestra.insertSheet("Hoja 1");
  const archivoMaestra = new M.Archivo("SS_MAESTRA", maestra.getName(), M.Mimes.GOOGLE_SHEETS, carpetaCurso);
  carpetaCurso._meter(archivoMaestra);

  const SpreadsheetApp = {
    getActive: () => maestra,
    getActiveSpreadsheet: () => maestra,
    openById(id) { const l = M.Libro.registro[id]; if (!l) throw new Error("No existe la hoja " + id); return l; },
    create(nombre) {
      const l = new M.Libro(nombre);
      l.insertSheet("Hoja 1");
      new M.Archivo(l.getId(), nombre, M.Mimes.GOOGLE_SHEETS, null);
      return l;
    },
    flush() {},
    getUi: () => M.UI,
    getActiveRange: () => maestra.getActiveRange(),
    getActiveSheet: () => maestra.getActiveSheet(),
    newDataValidation() { const v = { requireValueInList: () => v, setAllowInvalid: () => v, build: () => ({}) }; return v; }
  };

  const registro = [];
  const Logger = { log(x) { registro.push(String(x)); }, getLog: () => registro.join("\n") };

  // aleatoriedad reproducible (los cromos)
  let semilla = 12345;
  const aleatorio = () => { semilla = (semilla * 1103515245 + 12345) % 2147483648; return semilla / 2147483648; };

  const contexto = {
    SpreadsheetApp, DriveApp: M.Drive, DocumentApp: M.Docs, FormApp,
    PropertiesService: M.Props, MailApp: M.Correo, GmailApp: M.Correo, LockService: M.Cerrojo,
    Utilities: M.Utils, ScriptApp: M.Guiones, ContentService: M.Contenido, HtmlService: M.Html,
    UrlFetchApp: M.Fetch, MimeType: M.Mimes, Session: M.Sesion, Logger,
    console, JSON, Math: Object.assign(Object.create(Math), { random: aleatorio }),
    Date, String, Number, Object, Array, RegExp, Error, parseInt, parseFloat, isNaN, encodeURIComponent, decodeURIComponent
  };
  vm.createContext(contexto);
  // Apps Script comparte el ambito global entre ficheros. Se carga Code.gs PRIMERO y Datos.gs
  // despues —el orden mas desfavorable— para que cualquier dependencia de arranque salte aqui y no
  // en produccion.
  vm.runInContext(fs.readFileSync(RUTA_GS, "utf8"), contexto, { filename: "Code.gs" });
  vm.runInContext(fs.readFileSync(RUTA_BONUS, "utf8"), contexto, { filename: "Bonus.gs" });
  vm.runInContext(fs.readFileSync(RUTA_DATOS, "utf8"), contexto, { filename: "Datos.gs" });

  contexto._maestra = maestra;
  contexto._raiz = raiz;
  contexto._carpetaCurso = carpetaCurso;
  contexto._log = registro;
  contexto._semilla = s => { semilla = s; };
  contexto.asegurarHojas_();
  return contexto;
}

// ------------------------------------------------------------------ atajos de escenario
function iso(d) { const p = n => String(n).padStart(2, "0"); return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }
function haceSemanas(n) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - n * 7); return d; }

// Escribe una respuesta en la pestaña de un formulario y dispara el trigger, como haría Google.
function _enviar(G, hoja, valores, editarFila) {
  const cab = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0].map(String);
  let fila = editarFila || 0;
  if (!fila) fila = Math.max(hoja.getLastRow(), 1) + 1;
  const actual = fila <= hoja.getLastRow() ? hoja.getRange(fila, 1, 1, cab.length).getValues()[0] : cab.map(() => "");
  const salida = cab.map((c, i) => {
    if (c === "Marca temporal") return new Date();
    if (Object.prototype.hasOwnProperty.call(valores, c)) return valores[c];
    return actual[i] === undefined ? "" : actual[i];
  });
  hoja.getRange(fila, 1, 1, salida.length).setValues([salida]);
  G.alRecibirRespuesta({ range: { getSheet: () => hoja, getRow: () => fila } });
  return fila;
}

// Alistamiento / registro de insignias. `marcados` es un objeto {clave de columna: "et1, et2"}.
function enviarBitacora(G, perId, datos, editarFila) {
  const hoja = G._maestra.getSheetByName("B · " + perId);
  // Solo se escriben los campos que se pasan: editar una respuesta en Google conserva el resto.
  const v = {};
  const poner = (col, val, siFalta) => {
    if (val !== undefined) v[col] = val;
    else if (siFalta !== undefined && !editarFila) v[col] = siFalta;
  };
  v["Dirección de correo electrónico"] = datos.email;
  poner("Alias de recluta (público)", datos.alias, "");
  poner("Nombre y apellidos", datos.nombre, "");
  poner("Elige tu avatar", datos.avatar, "Personaje 1 · ella (evoluciona)");
  poner("¿Quién imparte tu clase?", datos.profe, "");
  poner("Enlace a mi Bitácora (ePortfolio)", datos.bitacora, "");
  poner("Breve biografía de tu personaje", datos.bio, "Un recluta.");
  poner("¿Qué vienes a registrar hoy?", datos.nav, "Nada más: solo me alisto / actualizo mis datos");
  Object.keys(datos.marcados || {}).forEach(k => { v[k] = datos.marcados[k]; });
  return _enviar(G, hoja, v, editarFila);
}

function _valoresCanje(datos) {
  return {
    "Dirección de correo electrónico": datos.email,
    "Recompensa": datos.recompensa,
    "Actividad a la que se aplica": datos.actividad || "No aplica (canje de avatar)",
    "Nuevo avatar (solo para «Cambio de avatar»)": datos.avatar || "",
    "Personaje exclusivo (solo para «Personaje exclusivo»)": datos.exclusivo || "",
    "Tu título (solo para «Título de recluta»)": datos.titulo || "",
    "Tu planeta de fondo (solo para «Fondo de ficha»)": datos.fondo || "",
    "URL de tu nueva imagen (solo para «Avatar personal»)": datos.url || "",
    "Comentario (opcional)": datos.comentario || ""
  };
}
function enviarCanje(G, perId, datos) {
  const hoja = G._maestra.getSheetByName("C · " + perId);
  const fila = _enviar(G, hoja, _valoresCanje(datos));
  const cab = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0].map(String);
  const cE = cab.indexOf("Estado");
  return { fila, estado: cE >= 0 ? String(hoja.getRange(fila, cE + 1).getValue()) : "" };
}
// Un canje que llega a la hoja pero NO se procesa: es lo que pasa cuando el trigger muere a medias
// (visto en vivo el 25-ago). La fila queda con su Estado vacío y sin ningún efecto aplicado.
function canjeSinResolver(G, perId, datos) {
  const hoja = G._maestra.getSheetByName("C · " + perId);
  const cab = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0].map(String);
  const v = _valoresCanje(datos);
  const fila = Math.max(hoja.getLastRow(), 1) + 1;
  const salida = cab.map(col => col === "Marca temporal" ? new Date()
    : (Object.prototype.hasOwnProperty.call(v, col) ? v[col] : ""));
  hoja.getRange(fila, 1, 1, salida.length).setValues([salida]);
  return fila;
}

// Etiqueta exacta de una recompensa del catálogo («Sobre de cromos — 15 créditos»)
function etiqueta(G, nombre) {
  const r = G.recompensasCat_().filter(x => x.nombre === nombre)[0];
  if (!r) throw new Error("No existe la recompensa «" + nombre + "» en el catálogo");
  return r.nombre + " — " + r.coste + " créditos";
}

// Marca TODOS los retos del tipo indicado: deja al recluta con el viaje completo (590 ◈ · 5000 xp)
function todoMarcado(G, tipo) {
  const m = {};
  G.retosDe_(tipo || "REGULAR").forEach(r => {
    const k = r[4] > 8 ? "Batalla final" : "Tema " + r[4] + " · Lo que he completado";
    m[k] = (m[k] ? m[k] + ", " : "") + r[1];
  });
  return m;
}
// Alista a alguien y le da el viaje entero, para poder probar canjes caros
function reclutaRico(G, perId, email, extra) {
  E_enviar(G, perId, Object.assign({ email, alias: email.split("@")[0], nombre: "Recluta " + email, profe: "Mr Cuarter" }, extra || {}));
  const fila = _filaDe(G, perId, email);
  enviarBitacora(G, perId, { email, marcados: todoMarcado(G, G.perObj_(G.perFila_(perId).v).tipo) }, fila);
}
function E_enviar(G, perId, datos) { return enviarBitacora(G, perId, datos); }
function _filaDe(G, perId, email) {
  const sh = G._maestra.getSheetByName("B · " + perId);
  const v = sh.getDataRange().getValues(), cab = v[0].map(String);
  const cM = cab.indexOf("Dirección de correo electrónico");
  for (let i = 1; i < v.length; i++) if (String(v[i][cM] || "").toLowerCase() === email.toLowerCase()) return i + 1;
  return 0;
}

const DOCENTES_DEMO = [
  { nombre: "Norberto Cuartero", correo: "n.cuartero.10@gmail.com", rol: "referente+imparte" },
  { nombre: "Norberto Genially", correo: "norberto@genially.com", rol: "imparte" },
  { nombre: "Mr Cuarter", correo: "mrcuarter@gmail.com", rol: "imparte" }
];

function crearPERDemo(G, extra) {
  const datos = Object.assign({
    nombre: "PRUEBA BANCO", tipo: "REGULAR", inicio: iso(haceSemanas(15)),
    referente: "Norberto Cuartero", profesores: "Norberto Genially, Mr Cuarter",
    docentes: DOCENTES_DEMO, apertura: "", cierre: "", panelVer: "", panelEdit: ""
  }, extra || {});
  return G.crearPER(datos);
}

module.exports = { nuevoMundo, comprobar, igual, contiene, resumen, iso, haceSemanas,
                   enviarBitacora, enviarCanje, canjeSinResolver, etiqueta, crearPERDemo, todoMarcado, reclutaRico,
                   DOCENTES_DEMO, M, FormApp };
