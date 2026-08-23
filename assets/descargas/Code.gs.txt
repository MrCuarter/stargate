/**
 * STARGATE · Mando de PERs — Apps Script de la hoja maestra (cuenta mutecdgami@gmail.com)
 * Menú «STARGATE» → Crear nuevo PER: formulario de autoregistro + hoja de respuestas + apertura/cierre
 * programados. doGet() sirve el tablero (alias, insignias, puntos) como JSON para la web.
 * v1 · 23-ago-2026
 */

// ---------- catálogo de retos autoregistrables (id, etiqueta del formulario, insignias que otorga, puntos, tema) ----------
var RETOS = [
  ["H1", "Reclutamiento — Me alisto en STARGATE (primera sesión)", ["H1_reclutamiento","E1_nebula"], 10, 0],
  ["A1", "Tema 1 · Reto A «El boceto sin quemar» (Bran)", ["P1_bran"], 10, 1],
  ["B1", "Tema 1 · Reto B «La chispa» (imagen con IA)", ["R1_la-chispa"], 25, 1],
  ["A2", "Tema 2 · Reto A «Un mensaje para quien faltó» (Tomás)", ["P2_tomas"], 10, 2],
  ["B2", "Tema 2 · Reto B «El eco que enseña» (videotutorial + videoquiz)", ["R2_el-eco-que-ensena"], 25, 2],
  ["A3", "Tema 3 · Reto A «Dos senderos» (Sylla)", ["P3_sylla"], 10, 3],
  ["B3", "Tema 3 · Reto B «La matriz» (matriz 8×6)", ["R3_la-matriz"], 25, 3],
  ["A4", "Tema 4 · Reto A «Abre el canal» (Amara)", ["P4_amara"], 10, 4],
  ["B4", "Tema 4 · Reto B «El entorno de aula»", ["R4_entorno-de-aula"], 25, 4],
  ["A5", "Tema 5 · Reto A «Mide con método» (Vera)", ["P5_vera"], 10, 5],
  ["B5", "Tema 5 · Reto B «La Bitácora medida» (rúbrica + ePortfolio)", ["R5_bitacora-medida"], 25, 5],
  ["A6", "Tema 6 · Reto A «Ensaya jugando» (Joran)", ["P6_joran"], 10, 6],
  ["B6", "Tema 6 · Reto B «El juego» (juego digital)", ["R6_el-juego"], 25, 6],
  ["A7", "Tema 7 · Reto A «Un porqué» (Mara)", ["P7_mara"], 10, 7],
  ["B7", "Tema 7 · Reto B «La microgamificación»", ["R7_microgamificacion"], 25, 7],
  ["A8", "Tema 8 · Reto A «La capa posible» (Noa)", ["P8_noa"], 10, 8],
  ["B8", "Tema 8 · Reto B «El último umbral» (RA/RV + Bitácora publicada)", ["R8_ultimo-umbral"], 25, 8],
  ["X1", "Actividad 1 entregada (imagen con IA)", ["H2_primera-forja","E2_capitan"], 50, 1],
  ["X2", "Actividad 2 entregada (paisaje de aprendizaje)", ["H3_cartografo"], 50, 3],
  ["XF", "Batalla final — examen realizado", ["E3_vaeon"], 50, 8]
];
// insignias derivadas (se calculan solas)
var DERIVADAS = [
  ["H4_tripulacion-cero", 30, ["P1_bran","P2_tomas","P3_sylla","P4_amara","P5_vera","P6_joran","P7_mara","P8_noa"]],
  ["H5_la-liberacion", 30, ["R8_ultimo-umbral","H2_primera-forja","H3_cartografo"]]
];
var PLANETAS = ["—","Fôrge","Ecos","Sendara","Reliae","Umbral","Ludo","Vínculo","Liminar"];
var HOJA_PERS = "PERs";

function onOpen() {
  SpreadsheetApp.getUi().createMenu("STARGATE")
    .addItem("Crear nuevo PER...", "abrirDialogoNuevoPER")
    .addItem("Abrir formulario de un PER ahora", "abrirFormularioPER")
    .addItem("Cerrar formulario de un PER ahora", "cerrarFormularioPER")
    .addSeparator()
    .addItem("Ver tablero (JSON) del PER seleccionado", "verTableroSeleccionado")
    .addItem("Consolidar DATOS de todos los PER", "consolidarDatos")
    .addToUi();
  asegurarHojaPERs_();
}

function asegurarHojaPERs_() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(HOJA_PERS);
  if (!sh) {
    sh = ss.insertSheet(HOJA_PERS);
    sh.appendRow(["id","PER","Profesorado","Apertura","Cierre","Estado","Formulario (editar)","Formulario (alumnado)","Pestaña de respuestas","Tablero web","Creado"]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function abrirDialogoNuevoPER() {
  var html = HtmlService.createHtmlOutputFromFile("Dialog").setWidth(520).setHeight(620);
  SpreadsheetApp.getUi().showModalDialog(html, "Crear nuevo PER");
}

// ---------- crear PER (lo llama el diálogo) ----------
function crearPER(datos) {
  var nombre = (datos.nombre || "").trim();
  if (!nombre) throw new Error("Falta el nombre del PER");
  var id = slug_(nombre);
  var sh = asegurarHojaPERs_();
  var ids = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().map(function(r){return r[0];}) : [];
  if (ids.indexOf(id) >= 0) throw new Error("Ya existe un PER con id «" + id + "»");

  var apertura = datos.apertura ? new Date(datos.apertura + "T00:00:00") : null;
  var cierre = datos.cierre ? new Date(datos.cierre + "T23:59:00") : null;

  // carpeta junto a la hoja maestra
  var master = DriveApp.getFileById(SpreadsheetApp.getActive().getId());
  var padres = master.getParents();
  var carpeta = padres.hasNext() ? padres.next() : DriveApp.getRootFolder();
  var subs = carpeta.getFoldersByName("Formularios PER");
  var sub = subs.hasNext() ? subs.next() : carpeta.createFolder("Formularios PER");

  // formulario
  var form = FormApp.create("STARGATE · " + nombre + " · Registro de retos");
  DriveApp.getFileById(form.getId()).moveTo(sub);
  form.setDescription("Bitácora de mando de STARGATE. Registra aquí cada reto, actividad o hito que completes: tu insignia aparecerá en el tablero. " +
    "Profesorado: " + (datos.profesores || "") + ". Tu correo solo lo ve el profesorado; en el tablero sale tu nombre de recluta.");
  form.setCollectEmail(false).setLimitOneResponsePerUser(false).setShowLinkToRespondAgain(true)
      .setConfirmationMessage("Registrado. Tu Bitácora crece. Mira el tablero para ver tu insignia.");
  form.addTextItem().setTitle("Nombre de recluta (alias público)").setHelpText("Es lo que se verá en el tablero. Usa siempre el mismo.").setRequired(true);
  var email = form.addTextItem().setTitle("Correo electrónico").setHelpText("Solo para el profesorado; no se muestra. Usa siempre el mismo.").setRequired(true);
  email.setValidation(FormApp.createTextValidation().requireTextIsEmail().build());
  form.addTextItem().setTitle("Nombre y apellidos").setHelpText("Solo para el profesorado.").setRequired(true);
  var reto = form.addListItem().setTitle("¿Qué registras?").setRequired(true);
  reto.setChoiceValues(RETOS.map(function(r){ return r[1]; }));
  var ev = form.addTextItem().setTitle("Enlace a la evidencia").setHelpText("Tu post del foro, tu Bitácora, tu vídeo… Debe ser un enlace que el profesorado pueda abrir.").setRequired(true);
  ev.setValidation(FormApp.createTextValidation().requireTextIsUrl().build());
  form.addParagraphTextItem().setTitle("Comentario (opcional)").setHelpText("Qué te ha costado, qué aprendiste, a quién se lo dedicas…");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, SpreadsheetApp.getActive().getId());
  // la pestaña recién creada por el formulario se renombra a "R · <id>"
  SpreadsheetApp.flush();
  var ssm = SpreadsheetApp.getActive(); var tab = null;
  ssm.getSheets().forEach(function(h){ try { if (h.getFormUrl() && h.getFormUrl().indexOf(form.getId()) >= 0) tab = h; } catch (err) {} });
  if (tab) { tab.setName("R · " + id); tab.setTabColor("#37e0ec"); }
  var nombreTab = tab ? tab.getName() : "";
  asegurarTriggerConsolidar_();

  // apertura/cierre programados
  var ahora = new Date(), estado = "Abierto";
  if (apertura && apertura > ahora) { form.setAcceptingResponses(false); estado = "Programado"; programar_("abrirPorTrigger", apertura, form.getId()); }
  if (cierre) { programar_("cerrarPorTrigger", cierre, form.getId()); }

  var tablero = webUrl_() ? (webUrl_() + "?per=" + id) : "(despliega el web app y pon la URL en la web)";
  sh.appendRow([id, nombre, datos.profesores || "", apertura || "", cierre || "", estado,
                form.getEditUrl(), form.getPublishedUrl(), nombreTab, tablero, new Date()]);
  return { id: id, nombre: nombre, formAlumnado: form.getPublishedUrl(), formEditar: form.getEditUrl(),
           hoja: SpreadsheetApp.getActive().getUrl() + "#gid=" + (tab ? tab.getSheetId() : 0), tablero: tablero, estado: estado, web: "https://stargate.mistercuarter.es/registro.html?per=" + id,
           embed: '<iframe src="https://stargate.mistercuarter.es/registro.html?per=' + id + '&embed=1" width="100%" height="720" style="border:0;border-radius:16px"></iframe>' };
}

function programar_(fn, fecha, formId) {
  var t = ScriptApp.newTrigger(fn).timeBased().at(fecha).create();
  PropertiesService.getScriptProperties().setProperty("trg_" + t.getUniqueId(), formId);
}
function abrirPorTrigger(e) { porTrigger_(e, true); }
function cerrarPorTrigger(e) { porTrigger_(e, false); }
function porTrigger_(e, abrir) {
  var props = PropertiesService.getScriptProperties();
  var formId = props.getProperty("trg_" + e.triggerUid);
  if (!formId) return;
  FormApp.openById(formId).setAcceptingResponses(abrir);
  props.deleteProperty("trg_" + e.triggerUid);
  actualizarEstado_(formId, abrir ? "Abierto" : "Cerrado");
  ScriptApp.getProjectTriggers().forEach(function(t){ if (t.getUniqueId() === e.triggerUid) ScriptApp.deleteTrigger(t); });
}
function actualizarEstado_(formId, estado) {
  var sh = asegurarHojaPERs_(); var datos = sh.getDataRange().getValues();
  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][6]).indexOf(formId) >= 0) { sh.getRange(i + 1, 6).setValue(estado); }
  }
}
function perSeleccionado_() {
  var sh = asegurarHojaPERs_(); var fila = sh.getActiveRange().getRow();
  if (sh.getName() !== SpreadsheetApp.getActiveSheet().getName() || fila < 2) throw new Error("Selecciona una fila de la hoja PERs");
  return sh.getRange(fila, 1, 1, 11).getValues()[0];
}
function abrirFormularioPER() { var p = perSeleccionado_(); FormApp.openByUrl(p[6]).setAcceptingResponses(true); actualizarEstado_(idDeUrl_(p[6]), "Abierto"); SpreadsheetApp.getUi().alert("Formulario de " + p[1] + " ABIERTO."); }
function cerrarFormularioPER() { var p = perSeleccionado_(); FormApp.openByUrl(p[6]).setAcceptingResponses(false); actualizarEstado_(idDeUrl_(p[6]), "Cerrado"); SpreadsheetApp.getUi().alert("Formulario de " + p[1] + " CERRADO."); }
function verTableroSeleccionado() { var p = perSeleccionado_(); var j = JSON.stringify(tablero_(p[0]), null, 1); SpreadsheetApp.getUi().alert(j.substring(0, 3000)); }
function idDeUrl_(url) { var m = String(url).match(/\/d\/([a-zA-Z0-9_-]+)/); return m ? m[1] : ""; }
function slug_(s) { return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function webUrl_() { return PropertiesService.getScriptProperties().getProperty("WEBAPP_URL") || ""; }
function guardarWebAppUrl(url) { PropertiesService.getScriptProperties().setProperty("WEBAPP_URL", url); }

// ---------- tablero: calcula alias, insignias y puntos de un PER ----------
function tablero_(perId) {
  var sh = asegurarHojaPERs_(); var datos = sh.getDataRange().getValues(); var fila = null;
  for (var i = 1; i < datos.length; i++) if (datos[i][0] === perId) fila = datos[i];
  if (!fila) return { error: "PER no encontrado: " + perId };
  var hoja = SpreadsheetApp.getActive().getSheetByName(fila[8]);
  if (!hoja) return { error: "No existe la pestaña " + fila[8] };
  var vals = hoja.getDataRange().getValues();
  if (vals.length < 2) return { per: perId, nombre: fila[1], estado: fila[5], reclutas: [], actualizado: new Date() };
  var cab = vals[0].map(String);
  var cAlias = idx_(cab, "recluta"), cMail = idx_(cab, "correo"), cReto = idx_(cab, "registras"), cAnul = idx_(cab, "anulado");
  var etiquetaAId = {}; RETOS.forEach(function(r){ etiquetaAId[r[1]] = r; });
  var por = {};
  for (var i = 1; i < vals.length; i++) {
    var row = vals[i]; if (cAnul >= 0 && String(row[cAnul]).trim()) continue;
    var mail = String(row[cMail] || "").trim().toLowerCase(); if (!mail) continue;
    var r = etiquetaAId[String(row[cReto]).trim()]; if (!r) continue;
    var p = por[mail] || (por[mail] = { alias: "", retos: {}, insignias: {}, puntos: 0, tema: 0, fecha: null });
    p.alias = String(row[cAlias] || p.alias).trim();
    if (p.retos[r[0]]) continue; // duplicado: solo cuenta una vez
    p.retos[r[0]] = true; p.puntos += r[3]; if (r[4] > p.tema) p.tema = r[4];
    r[2].forEach(function(k){ p.insignias[k] = true; });
    // cualquier registro implica alistamiento
    p.insignias["H1_reclutamiento"] = true; p.insignias["E1_nebula"] = true;
    p.fecha = row[0];
  }
  var lista = Object.keys(por).map(function(m){
    var p = por[m];
    DERIVADAS.forEach(function(d){ if (d[2].every(function(k){ return p.insignias[k]; })) { if (!p.insignias[d[0]]) { p.insignias[d[0]] = true; p.puntos += d[1]; } } });
    return { alias: p.alias, puntos: p.puntos, planeta: PLANETAS[p.tema], tema: p.tema,
             insignias: Object.keys(p.insignias), n: Object.keys(p.insignias).length, ultimo: p.fecha };
  });
  lista.sort(function(a, b){ return b.puntos - a.puntos || b.n - a.n || a.alias.localeCompare(b.alias); });
  lista.forEach(function(p, i){ p.pos = i + 1; });
  return { per: perId, nombre: fila[1], profesorado: fila[2], estado: fila[5], reclutas: lista, actualizado: new Date() };
}
function idx_(cab, frag) { for (var i = 0; i < cab.length; i++) if (cab[i].toLowerCase().indexOf(frag) >= 0) return i; return -1; }

// ---------- API pública (web app): ?per=<id>  |  ?per=all ----------
function doGet(e) {
  var per = (e && e.parameter && e.parameter.per) || "all";
  var out;
  if (per === "all") {
    var sh = asegurarHojaPERs_(); var d = sh.getDataRange().getValues();
    out = { pers: d.slice(1).map(function(r){ return { id: r[0], nombre: r[1], estado: r[5] }; }) };
  } else {
    out = tablero_(per);
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}


// ---------- DATOS: consolidado de todos los PER en formato largo (para análisis/investigación) ----------
// Una fila por registro válido: per, nombre_per, fecha, alias, email, nombre, reto_id, reto, tema, puntos, evidencia, comentario, anulado
function consolidarDatos() {
  var ss = SpreadsheetApp.getActive(); var reg = asegurarHojaPERs_().getDataRange().getValues();
  var etiquetaAId = {}; RETOS.forEach(function(r){ etiquetaAId[r[1]] = r; });
  var filas = [["per","nombre_per","fecha","alias","email","nombre","reto_id","reto","tema","puntos","evidencia","comentario","anulado","duplicado"]];
  for (var i = 1; i < reg.length; i++) {
    var perId = reg[i][0], perNombre = reg[i][1], tabName = reg[i][8];
    var hoja = ss.getSheetByName(tabName); if (!hoja) continue;
    var vals = hoja.getDataRange().getValues(); if (vals.length < 2) continue;
    var cab = vals[0].map(String);
    var cAlias = idx_(cab,"recluta"), cMail = idx_(cab,"correo"), cNom = idx_(cab,"apellidos"), cReto = idx_(cab,"registras"),
        cEv = idx_(cab,"evidencia"), cCom = idx_(cab,"comentario"), cAnul = idx_(cab,"anulado");
    var vistos = {};
    for (var j = 1; j < vals.length; j++) {
      var row = vals[j]; var mail = String(row[cMail]||"").trim().toLowerCase(); if (!mail) continue;
      var r = etiquetaAId[String(row[cReto]).trim()]; var anul = cAnul >= 0 ? String(row[cAnul]).trim() : "";
      var clave = mail + "|" + (r ? r[0] : row[cReto]); var dup = vistos[clave] ? "sí" : ""; if (!anul) vistos[clave] = true;
      filas.push([perId, perNombre, row[0], row[cAlias], mail, cNom >= 0 ? row[cNom] : "", r ? r[0] : "", row[cReto], r ? r[4] : "", (r && !anul && !dup) ? r[3] : 0,
                  cEv >= 0 ? row[cEv] : "", cCom >= 0 ? row[cCom] : "", anul, dup]);
    }
  }
  var out = ss.getSheetByName("DATOS") || ss.insertSheet("DATOS");
  out.clearContents(); out.getRange(1, 1, filas.length, filas[0].length).setValues(filas); out.setFrozenRows(1); out.setTabColor("#f5b043");
  // RESUMEN por PER y recluta
  var res = [["per","alias","email","puntos","n_retos","tema_max","insignias"]];
  reg.slice(1).forEach(function(p){ var t = tablero_(p[0]); (t.reclutas||[]).forEach(function(x){ res.push([p[0], x.alias, "", x.puntos, x.n, x.tema, x.insignias.join(" ")]); }); });
  var rs = ss.getSheetByName("RESUMEN") || ss.insertSheet("RESUMEN");
  rs.clearContents(); rs.getRange(1, 1, res.length, res[0].length).setValues(res); rs.setFrozenRows(1);
  return filas.length - 1;
}
function asegurarTriggerConsolidar_() {
  var hay = ScriptApp.getProjectTriggers().some(function(t){ return t.getHandlerFunction() === "alRecibirRespuesta"; });
  if (!hay) ScriptApp.newTrigger("alRecibirRespuesta").forSpreadsheet(SpreadsheetApp.getActive()).onFormSubmit().create();
}
function alRecibirRespuesta(e) { try { consolidarDatos(); } catch (err) { Logger.log(err); } }
