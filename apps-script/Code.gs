/**
 * STARGATE · Mando de PERs — Apps Script de la hoja maestra (cuenta mutecdgami@gmail.com)  v2 · 23-ago-2026
 * Menú STARGATE: crear PER (REGULAR o PUA) con 3 formularios por plantilla (Bitácora de mando, Ticket de
 * salida anónimo, Canje de recompensas), apertura/cierre programados, EVENTOS/DATOS/RESUMEN para investigación,
 * API de lectura (doGet) para la web del alumnado y API con PIN (doPost) para el panel del profesorado.
 */

// ================= CATÁLOGO =================
// [id, etiqueta de la casilla, insignias, xp, tema]
var RETOS_REGULAR = [
  ["A1","Reto A «El boceto sin quemar» (recupera a Bran)",["P1_bran"],100,1],
  ["B1","Reto B «La chispa» (imagen con IA)",["R1_la-chispa"],250,1],
  ["X1","Actividad 1 entregada (imagen con IA)",["H2_primera-forja","E2_capitan"],500,1],
  ["A2","Reto A «Un mensaje para quien faltó» (recupera a Tomás)",["P2_tomas"],100,2],
  ["B2","Reto B «El eco que enseña» (videotutorial + videoquiz)",["R2_el-eco-que-ensena"],250,2],
  ["A3","Reto A «Dos senderos» (recupera a Sylla)",["P3_sylla"],100,3],
  ["B3","Reto B «La matriz» (matriz 8×6)",["R3_la-matriz"],250,3],
  ["X2","Actividad 2 entregada (paisaje de aprendizaje)",["H3_cartografo"],500,3],
  ["A4","Reto A «Abre el canal» (recupera a Amara)",["P4_amara"],100,4],
  ["B4","Reto B «El entorno de aula»",["R4_entorno-de-aula"],250,4],
  ["A5","Reto A «Mide con método» (recupera a Vera)",["P5_vera"],100,5],
  ["B5","Reto B «La Bitácora medida» (rúbrica + ePortfolio)",["R5_bitacora-medida"],250,5],
  ["A6","Reto A «Ensaya jugando» (recupera a Joran)",["P6_joran"],100,6],
  ["B6","Reto B «El juego» (juego digital)",["R6_el-juego"],250,6],
  ["A7","Reto A «Un porqué» (recupera a Mara)",["P7_mara"],100,7],
  ["B7","Reto B «La microgamificación»",["R7_microgamificacion"],250,7],
  ["A8","Reto A «La capa posible» (recupera a Noa)",["P8_noa"],100,8],
  ["B8","Reto B «El último umbral» (RA/RV + Bitácora publicada)",["R8_ultimo-umbral"],250,8],
  ["XF","Batalla final: examen realizado",["E3_vaeon"],500,9]
];
// PUA: una insignia por tema (el personaje), ganada con la pieza productiva del tema
var RETOS_PUA = [
  ["B1","La chispa: imagen con IA (recupera a Bran)",["P1_bran","R1_la-chispa"],300,1],
  ["X1","Actividad 1 entregada",["H2_primera-forja","E2_capitan"],500,1],
  ["B2","El eco que enseña: videotutorial (recupera a Tomás)",["P2_tomas","R2_el-eco-que-ensena"],300,2],
  ["B3","La matriz 8×6 (recupera a Sylla)",["P3_sylla","R3_la-matriz"],300,3],
  ["X2","Actividad 2 entregada",["H3_cartografo"],500,3],
  ["B4","El entorno de aula (recupera a Amara)",["P4_amara","R4_entorno-de-aula"],300,4],
  ["B5","La Bitácora medida (recupera a Vera)",["P5_vera","R5_bitacora-medida"],300,5],
  ["B6","El juego digital (recupera a Joran)",["P6_joran","R6_el-juego"],300,6],
  ["B7","La microgamificación (recupera a Mara)",["P7_mara","R7_microgamificacion"],300,7],
  ["B8","El último umbral: RA/RV + Bitácora publicada (recupera a Noa)",["P8_noa","R8_ultimo-umbral"],300,8]
];
var XP_RECLUTAMIENTO = 100;
var DERIVADAS = [
  ["H4_tripulacion-cero",300,["P1_bran","P2_tomas","P3_sylla","P4_amara","P5_vera","P6_joran","P7_mara","P8_noa"]],
  ["H5_la-liberacion",300,["R8_ultimo-umbral","H2_primera-forja","H3_cartografo"]]
];
var TEMAS = [null,
  ["Fôrge","Creación de contenido multimedia","p1_forge"],["Ecos","El vídeo como recurso","p2_ecos"],
  ["Sendara","Contenidos interactivos","p3_sendara"],["Reliae","M-learning","p4_reliae"],
  ["Umbral","Evaluación y ePortfolio","p5_umbral"],["Ludo","Aprendizaje Basado en el Juego","p6_ludo"],
  ["Vínculo","Gamificación","p7_vinculo"],["Liminar","Realidad Aumentada y Virtual","p8_liminar"]];
var WEB = "https://stargate.mistercuarter.es/";
var RECOMPENSAS_INICIALES = [
  ["Subir 0,5 en un entregable",900,1,"Se aplica a la actividad que elijas"],
  ["Subir 1 punto en un entregable",1400,1,"Se aplica a la actividad que elijas"],
  ["Recalificar un trabajo entregado fuera de plazo",2000,1,"Indica la actividad"],
  ["Recalificar un suspenso",2800,1,"Indica la actividad"]
];
var H = { PERS:"PERs", REC:"RECOMPENSAS", EV:"EVENTOS", AJ:"AJUSTES", DATOS:"DATOS", RES:"RESUMEN" };

function retosDe_(tipo){ return tipo === "PUA" ? RETOS_PUA : RETOS_REGULAR; }

// ================= MENÚ Y HOJAS =================
function onOpen() {
  SpreadsheetApp.getUi().createMenu("STARGATE")
    .addItem("Crear nuevo PER...", "abrirDialogoNuevoPER")
    .addItem("Actualizar recompensas en los formularios", "actualizarRecompensas")
    .addItem("Consolidar DATOS / RESUMEN", "consolidarDatos")
    .addSeparator()
    .addItem("Cambiar PIN del profesorado", "cambiarPin")
    .addItem("Guardar URL del web app", "pedirWebAppUrl")
    .addToUi();
  asegurarHojas_();
}
function hoja_(nombre, cab, color) {
  var ss = SpreadsheetApp.getActive(); var sh = ss.getSheetByName(nombre);
  if (!sh) { sh = ss.insertSheet(nombre); sh.appendRow(cab); sh.setFrozenRows(1); if (color) sh.setTabColor(color); }
  return sh;
}
function asegurarHojas_() {
  hoja_(H.PERS, ["id","PER","Tipo","Profesorado","Inicio (semana 1)","Apertura","Cierre","Estado",
                 "Bitácora (alumnado)","Bitácora (editar)","Ticket (alumnado)","Canje (alumnado)","Pestaña B","Pestaña T","Pestaña C","Creado","Referente","Ticket (editar)"], "#37e0ec");
  var rec = hoja_(H.REC, ["Recompensa","Coste (xp)","Máx. por alumno","Descripción"], "#f5b043");
  if (rec.getLastRow() < 2) rec.getRange(2,1,RECOMPENSAS_INICIALES.length,4).setValues(RECOMPENSAS_INICIALES);
  hoja_(H.EV, ["fecha","per","email","alias","reto_id","reto","tema","xp","origen"], "#aa66cc");
  hoja_(H.AJ, ["fecha","per","email","reto_id","accion","motivo","profe"], "#aa66cc");
}
function perFila_(perId) {
  var d = hoja_(H.PERS).getDataRange().getValues();
  for (var i = 1; i < d.length; i++) if (d[i][0] === perId) return { fila: i + 1, v: d[i] };
  return null;
}
function perObj_(v) {
  return { id:v[0], nombre:v[1], tipo:v[2]||"REGULAR", profesorado:v[3], inicio:fechaIso_(v[4]), apertura:fechaIso_(v[5]), cierre:fechaIso_(v[6]),
           estado:v[7], formBitacora:v[8], formBitacoraEdit:v[9], formTicket:v[10], formCanje:v[11], tabB:v[12], tabT:v[13], tabC:v[14], referente:v[16]||"", formTicketEdit:v[17]||"" };
}
function fechaIso_(d) { if (!d) return ""; if (d instanceof Date) return Utilities.formatDate(d, "Europe/Madrid", "yyyy-MM-dd"); return String(d); }

// ================= CREAR PER =================
function abrirDialogoNuevoPER() {
  var html = HtmlService.createHtmlOutputFromFile("Dialog").setWidth(540).setHeight(680);
  SpreadsheetApp.getUi().showModalDialog(html, "Crear nuevo PER");
}
function plantilla_(nombre) {
  var it = DriveApp.getFilesByName(nombre);
  while (it.hasNext()) { var f = it.next(); if (f.getMimeType() === MimeType.GOOGLE_FORMS) return f; }
  return null;
}
function formDesdePlantilla_(plantillaNombre, titulo, carpeta) {
  var pl = plantilla_(plantillaNombre); var form;
  if (pl) { var copia = pl.makeCopy(titulo, carpeta); form = FormApp.openById(copia.getId());
            form.getItems().forEach(function(i){ form.deleteItem(i); }); }
  else { form = FormApp.create(titulo); DriveApp.getFileById(form.getId()).moveTo(carpeta); }
  form.setTitle(titulo);
  return form;
}
function imagen_(form, tema, texto) {
  try { var blob = UrlFetchApp.fetch(WEB + "assets/img/planetas/" + TEMAS[tema][2] + ".png").getBlob();
        form.addImageItem().setImage(blob).setTitle(texto).setAlignment(FormApp.Alignment.CENTER).setWidth(160); } catch (e) {}
}
function pestanaDe_(form, nombreNuevo, color) {
  SpreadsheetApp.flush(); var tab = null;
  SpreadsheetApp.getActive().getSheets().forEach(function(h){ try { var u = h.getFormUrl(); if (u && u.indexOf(form.getId()) >= 0) tab = h; } catch (e) {} });
  if (tab) { tab.setName(nombreNuevo); tab.setTabColor(color); }
  return tab ? tab.getName() : "";
}

function crearPER(datos) {
  var nombre = (datos.nombre || "").trim(); if (!nombre) throw new Error("Falta el nombre del PER");
  var tipo = datos.tipo === "PUA" ? "PUA" : "REGULAR";
  var id = slug_(nombre); if (perFila_(id)) throw new Error("Ya existe un PER con id «" + id + "»");
  var apertura = datos.apertura ? new Date(datos.apertura + "T00:00:00") : null;
  var cierre = datos.cierre ? new Date(datos.cierre + "T23:59:00") : null;
  var inicio = datos.inicio ? new Date(datos.inicio + "T00:00:00") : null;
  var ss = SpreadsheetApp.getActive();
  var master = DriveApp.getFileById(ss.getId()); var padres = master.getParents();
  var raiz = padres.hasNext() ? padres.next() : DriveApp.getRootFolder();
  var subs = raiz.getFoldersByName("Formularios PER"); var carpeta = subs.hasNext() ? subs.next() : raiz.createFolder("Formularios PER");
  var retos = retosDe_(tipo);

  // ---- 1 · Bitácora de mando (Google login, 1 respuesta editable) ----
  var fb = formDesdePlantilla_("PLANTILLA · Bitácora de mando", "STARGATE · " + nombre + " · Bitácora de mando", carpeta);
  fb.setDescription("Tu registro de la misión. Rellénalo una vez y vuelve a editarlo cada vez que ganes una insignia (marca la casilla nueva y envía). " +
    "Tu correo y tu nombre solo los ve el profesorado; en el tablero aparece tu alias. Profesorado: " + (datos.profesores || ""));
  fb.setCollectEmail(true).setLimitOneResponsePerUser(true).setAllowResponseEdits(true).setShowLinkToRespondAgain(false)
    .setConfirmationMessage("Registrado. Tu Bitácora crece. Mira el tablero en " + WEB + "registro.html?per=" + id);
  fb.addSectionHeaderItem().setTitle("Quién soy").setHelpText("Solo la primera vez.");
  fb.addTextItem().setTitle("Alias de recluta (público)").setHelpText("Lo que se verá en el tablero.").setRequired(true);
  fb.addTextItem().setTitle("Nombre y apellidos").setHelpText("Solo para el profesorado.").setRequired(true);
  var bit = fb.addTextItem().setTitle("Enlace a mi Bitácora (ePortfolio)").setHelpText("Un único enlace donde está toda tu evidencia. Puedes añadirlo más adelante.");
  bit.setValidation(FormApp.createTextValidation().requireTextIsUrl().build());
  var porTema = {}; retos.forEach(function(r){ (porTema[r[4]] = porTema[r[4]] || []).push(r); });
  Object.keys(porTema).sort().forEach(function(t){
    t = Number(t);
    if (t >= 1 && t <= 8) { fb.addPageBreakItem().setTitle("Tema " + t + " · " + TEMAS[t][0]).setHelpText(TEMAS[t][1]); imagen_(fb, t, TEMAS[t][0]); }
    else { fb.addPageBreakItem().setTitle("La batalla final").setHelpText("Solo cuando hayas hecho el examen."); }
    var cb = fb.addCheckboxItem().setTitle(t >= 1 && t <= 8 ? "Tema " + t + " · Lo que he completado" : "Batalla final");
    cb.setChoiceValues(porTema[t].map(function(r){ return r[1]; }));
  });
  fb.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  var tabB = pestanaDe_(fb, "B · " + id, "#37e0ec");

  // ---- 2 · Ticket de salida «Contacta con NEBULA» (anónimo, ramificado) ----
  var ft = formDesdePlantilla_("PLANTILLA · Ticket de salida", "STARGATE · " + nombre + " · Contacta con NEBULA (ticket de salida)", carpeta);
  construirTicket_(ft, datos.referente || "", datos.profesores || "");
  ft.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  var tabT = pestanaDe_(ft, "T · " + id, "#9fb2c2");

  // ---- 3 · Canje de recompensas (Google login) ----
  var fc = formDesdePlantilla_("PLANTILLA · Canje de recompensas", "STARGATE · " + nombre + " · Canje de recompensas", carpeta);
  fc.setDescription("Cambia tus xp por ventajas. El sistema comprueba tus puntos al instante y te responde por correo.");
  fc.setCollectEmail(true).setLimitOneResponsePerUser(false).setShowLinkToRespondAgain(true).setConfirmationMessage("Solicitud recibida. Recibirás un correo con el resultado.");
  var lr = fc.addListItem().setTitle("Recompensa").setRequired(true); lr.setChoiceValues(etiquetasRecompensas_());
  var la = fc.addListItem().setTitle("Actividad a la que se aplica").setRequired(true);
  la.setChoiceValues(["Actividad 1 · imagen con IA","Actividad 2 · paisaje de aprendizaje","Otra (la indico en el comentario)"]);
  fc.addParagraphTextItem().setTitle("Comentario (opcional)");
  fc.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  var tabC = pestanaDe_(fc, "C · " + id, "#f5b043");

  asegurarTriggers_();
  var ahora = new Date(), estado = "Abierto";
  if (apertura && apertura > ahora) { [fb, ft, fc].forEach(function(f){ f.setAcceptingResponses(false); }); estado = "Programado"; programar_("abrirPorTrigger", apertura, id); }
  if (cierre) programar_("cerrarPorTrigger", cierre, id);

  hoja_(H.PERS).appendRow([id, nombre, tipo, datos.profesores || "", inicio || "", apertura || "", cierre || "", estado,
    fb.getPublishedUrl(), fb.getEditUrl(), ft.getPublishedUrl(), fc.getPublishedUrl(), tabB, tabT, tabC, new Date(), datos.referente || "", ft.getEditUrl()]);
  return { id:id, nombre:nombre, tipo:tipo, estado:estado, referente:datos.referente||"", formBitacora:fb.getPublishedUrl(), formTicket:ft.getPublishedUrl(), formCanje:fc.getPublishedUrl(),
    hoja: ss.getUrl(), web: WEB + "registro.html?per=" + id, foro: WEB + "foro.html?per=" + id,
    embedAlumnos: '<iframe src="' + WEB + 'registro.html?per=' + id + '&embed=1" width="100%" height="760" style="border:0;border-radius:16px"></iframe>',
    embedForo: '<iframe src="' + WEB + 'foro.html?per=' + id + '&embed=1" width="100%" height="640" style="border:0;border-radius:16px"></iframe>' };
}
function etiquetasRecompensas_() {
  var d = hoja_(H.REC).getDataRange().getValues().slice(1).filter(function(r){ return r[0]; });
  return d.map(function(r){ return r[0] + " — " + r[1] + " xp"; });
}
function actualizarRecompensas() {
  var et = etiquetasRecompensas_(); var n = 0;
  hoja_(H.PERS).getDataRange().getValues().slice(1).forEach(function(v){
    try { var f = FormApp.openByUrl(perObj_(v).formCanje.replace("/viewform","/edit"));
          f.getItems(FormApp.ItemType.LIST).forEach(function(i){ if (i.getTitle() === "Recompensa") { i.asListItem().setChoiceValues(et); n++; } }); } catch (e) {}
  });
  SpreadsheetApp.getUi().alert("Recompensas actualizadas en " + n + " formularios.");
}

function listaProfes_(referente, profesores) {
  var l = []; (referente ? [referente] : []).concat(String(profesores||"").split(",")).forEach(function(x){ x = x.trim(); if (x && l.indexOf(x) < 0) l.push(x); });
  return l.length ? l : ["Profesorado"];
}
function escala_(f, titulo, a, b) { f.addScaleItem().setTitle(titulo).setBounds(1,5).setLabels(a,b); }
function construirTicket_(ft, referente, profesores) {
  ft.setDescription("En este cuestionario encontrarás un espacio donde formular todas las dudas que tengas sobre la clase. También puedes indicarnos tu grado de satisfacción sobre las herramientas, metodología y progreso. " +
    "Responde con sinceridad: es ANÓNIMO y nos sirve para ayudarte a mejorar.");
  ft.setCollectEmail(false).setLimitOneResponsePerUser(false).setShowLinkToRespondAgain(true).setConfirmationMessage("Recibido, recluta. NEBULA toma nota y lo resolvemos en la próxima clase.");
  var prof = ft.addListItem().setTitle("El profesor o profesora que imparte tu clase...").setRequired(true); prof.setChoiceValues(listaProfes_(referente, profesores));
  var sel = ft.addListItem().setTitle("Selecciona el tema o actividad que hemos trabajado y sobre el que quieres hacer una pregunta").setRequired(true);
  // páginas
  var pPres = ft.addPageBreakItem().setTitle("Sobre la presentación de la asignatura").setHelpText("Dudas, inquietudes u opiniones, de manera anónima. Todos los campos son opcionales.");
  escala_(ft, "¿Qué vibraciones te ha transmitido la presentación?", "¡Horrible!", "Buenísimas, ya tengo ganas de empezar");
  escala_(ft, "Valora la utilidad que percibes del temario de la asignatura", "Poco útil", "Muy útil");
  escala_(ft, "¿Cómo valorarías tus conocimientos iniciales sobre herramientas TIC?", "¿TIC? ¿Eso no es cuando parpadeas muy rápido?", "Yo inventé el concepto de TIC");
  ft.addParagraphTextItem().setTitle("¿Qué esperas de la asignatura? ¿Qué te gustaría aprender?");
  var pref = ft.addMultipleChoiceItem().setTitle("¿Cómo prefieres que transcurran las clases en directo?");
  pref.setChoiceValues(["Que el docente resuelva los casos prácticos","Que resolvamos los alumnos los casos prácticos en grupos","Que resolvamos los alumnos los casos prácticos individualmente","Cada clase de una forma"]).showOtherOption(true);
  pPres.setGoToPage(FormApp.PageNavigationType.SUBMIT);
  var pTema = ft.addPageBreakItem().setTitle("Sobre el tema escogido").setHelpText("Dudas, inquietudes u opiniones sobre el tema visto en clase, de manera anónima. Todos los campos son opcionales.");
  ft.addParagraphTextItem().setTitle("¿Alguna duda? ¿Te ha quedado alguna duda o quieres hacernos llegar algún comentario?");
  escala_(ft, "Valora la utilidad de las herramientas o estrategias vistas en clase", "Poco útiles", "Muy útiles");
  escala_(ft, "Valora la satisfacción general del desarrollo de la clase", "Muy insatisfecho/a", "Muy satisfecho/a");
  escala_(ft, "Valora la satisfacción con los contenidos teóricos vistos en clase sobre este tema", "Muy insatisfecho/a", "Muy satisfecho/a");
  escala_(ft, "Valora la satisfacción con las estrategias prácticas vistas en clase sobre este tema", "Muy insatisfecho/a", "Muy satisfecho/a");
  escala_(ft, "Valora tu grado de participación en clase", "No he participado en absoluto", "He participado en todo lo que he podido");
  pTema.setGoToPage(FormApp.PageNavigationType.SUBMIT);
  var pAct = ft.addPageBreakItem().setTitle("Sobre la actividad escogida").setHelpText("Dudas, inquietudes o incidencias sobre la actividad evaluable. Todos los campos son opcionales.");
  ft.addParagraphTextItem().setTitle("¿Te ha quedado alguna duda sobre la actividad o quieres hacernos llegar algún comentario?");
  escala_(ft, "Valora la utilidad de la actividad propuesta para tu aprendizaje", "Poco útil", "Muy útil");
  escala_(ft, "Valora la satisfacción sobre la calidad de la actividad que has entregado (si ya lo has hecho)", "Muy insatisfecho/a con la calidad", "Muy satisfecho/a con la calidad");
  escala_(ft, "Valora la satisfacción sobre la puntuación obtenida (si ya la tienes)", "Muy insatisfecho/a con la puntuación", "Muy satisfecho/a con la puntuación");
  pAct.setGoToPage(FormApp.PageNavigationType.SUBMIT);
  var pRep = ft.addPageBreakItem().setTitle("Resumen global de la asignatura").setHelpText("Tu balance al terminar. Anónimo.");
  escala_(ft, "Considero que la forma de seguir esta asignatura...", "no ha ayudado a mejorar mis competencias digitales", "ha ayudado a mejorar mis competencias digitales considerablemente");
  escala_(ft, "Grado de satisfacción con la asignatura", "Muy insatisfecho/a", "Muy satisfecho/a");
  escala_(ft, "Comparada con otras asignaturas que cursas ahora mismo, estas clases han sido", "Mucho peor", "Mucho mejor");
  escala_(ft, "Grado de satisfacción con tu profesor/a", "El peor / La peor hasta la fecha", "El mejor / La mejor hasta la fecha");
  ft.addParagraphTextItem().setTitle("¿Qué ha sido lo mejor de la asignatura?");
  ft.addParagraphTextItem().setTitle("¿Y lo peor?");
  ft.addParagraphTextItem().setTitle("Deja un comentario a tu profesor/a");
  // ramificación
  var ch = [sel.createChoice("Presentación de la asignatura", pPres)];
  for (var t = 1; t <= 8; t++) {
    ch.push(sel.createChoice("Tema " + t + ": " + TEMAS[t][1] + " (" + TEMAS[t][0] + ")", pTema));
    if (t === 1) ch.push(sel.createChoice("Actividad 1: actividad didáctica a partir de una imagen con IA", pAct));
    if (t === 3) ch.push(sel.createChoice("Actividad 2: planifica y crea un paisaje de aprendizaje", pAct));
  }
  ch.push(sel.createChoice("Repaso / balance final", pRep));
  sel.setChoices(ch);
}

// ================= TRIGGERS =================
function asegurarTriggers_() {
  var hay = ScriptApp.getProjectTriggers().some(function(t){ return t.getHandlerFunction() === "alRecibirRespuesta"; });
  if (!hay) ScriptApp.newTrigger("alRecibirRespuesta").forSpreadsheet(SpreadsheetApp.getActive()).onFormSubmit().create();
}
function programar_(fn, fecha, perId) {
  var t = ScriptApp.newTrigger(fn).timeBased().at(fecha).create();
  PropertiesService.getScriptProperties().setProperty("trg_" + t.getUniqueId(), perId);
}
function abrirPorTrigger(e) { porTrigger_(e, true); }
function cerrarPorTrigger(e) { porTrigger_(e, false); }
function porTrigger_(e, abrir) {
  var props = PropertiesService.getScriptProperties(); var perId = props.getProperty("trg_" + e.triggerUid); if (!perId) return;
  setAbierto_(perId, abrir); props.deleteProperty("trg_" + e.triggerUid);
  ScriptApp.getProjectTriggers().forEach(function(t){ if (t.getUniqueId() === e.triggerUid) ScriptApp.deleteTrigger(t); });
}
function setAbierto_(perId, abrir) {
  var p = perFila_(perId); if (!p) return; var o = perObj_(p.v);
  [o.formBitacoraEdit, o.formTicket, o.formCanje].forEach(function(u){ try { FormApp.openByUrl(u.replace("/viewform","/edit")).setAcceptingResponses(abrir); } catch (e) {} });
  hoja_(H.PERS).getRange(p.fila, 8).setValue(abrir ? "Abierto" : "Cerrado");
}

function alRecibirRespuesta(e) {
  try {
    var sh = e.range.getSheet(); var nombre = sh.getName(); var perId = nombre.substring(4);
    var p = perFila_(perId); if (!p) return; var o = perObj_(p.v);
    if (nombre.indexOf("B · ") === 0) registrarEventos_(o, sh, e.range.getRow());
    else if (nombre.indexOf("C · ") === 0) resolverCanje_(o, sh, e.range.getRow());
    consolidarDatos();
  } catch (err) { Logger.log(err); }
}
function leerFila_(sh, fila) {
  var cab = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String); var v = sh.getRange(fila,1,1,sh.getLastColumn()).getValues()[0];
  var o = {}; cab.forEach(function(c,i){ o[c] = v[i]; }); return o;
}
function marcados_(o) { // casillas marcadas en una fila de Bitácora -> [etiquetas]
  var out = []; Object.keys(o).forEach(function(c){ if (c.indexOf("Lo que he completado") >= 0 || c === "Batalla final") String(o[c]||"").split(", ").forEach(function(x){ if (x.trim()) out.push(x.trim()); }); });
  return out;
}
function registrarEventos_(o, sh, fila) {
  var r = leerFila_(sh, fila); var email = String(r["Dirección de correo electrónico"] || r["Email Address"] || "").toLowerCase().trim(); if (!email) return;
  var alias = r["Alias de recluta (público)"] || ""; var retos = retosDe_(o.tipo); var porEt = {}; retos.forEach(function(x){ porEt[x[1]] = x; });
  var ev = hoja_(H.EV); var previos = {};
  ev.getDataRange().getValues().slice(1).forEach(function(v){ if (v[1] === o.id && String(v[2]).toLowerCase() === email) previos[v[4]] = true; });
  var nuevos = [];
  if (!previos["H1"]) nuevos.push([new Date(), o.id, email, alias, "H1", "Reclutamiento", 0, XP_RECLUTAMIENTO, "formulario"]);
  marcados_(r).forEach(function(et){ var x = porEt[et]; if (x && !previos[x[0]]) nuevos.push([new Date(), o.id, email, alias, x[0], x[1], x[4], x[3], "formulario"]); });
  if (nuevos.length) ev.getRange(ev.getLastRow()+1, 1, nuevos.length, 9).setValues(nuevos);
}
function resolverCanje_(o, sh, fila) {
  var r = leerFila_(sh, fila); var email = String(r["Dirección de correo electrónico"] || r["Email Address"] || "").toLowerCase().trim();
  var rec = String(r["Recompensa"] || ""); var coste = parseInt((rec.match(/(\d+) xp$/) || [0,0])[1], 10);
  var t = tablero_(o.id, true); var al = (t.reclutas || []).filter(function(x){ return x.email === email; })[0];
  var disp = al ? al.xp_disponibles : 0;
  var cab = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String); var col = cab.indexOf("Estado") + 1;
  if (!col) { col = sh.getLastColumn() + 1; sh.getRange(1, col).setValue("Estado"); sh.getRange(1, col+1).setValue("Entregado"); }
  var ok = al && disp >= coste && coste > 0;
  sh.getRange(fila, col).setValue(ok ? "Concedido" : "Denegado (" + disp + " xp disponibles, cuesta " + coste + ")");
  try { MailApp.sendEmail(email, "STARGATE · Canje " + (ok ? "concedido" : "denegado"),
    (ok ? "Concedido: " + rec + ". Te quedan " + (disp - coste) + " xp. El profesorado lo aplicará."
        : "No hay xp suficientes para «" + rec + "»: tienes " + disp + " xp disponibles.") + "\n\nTablero: " + WEB + "registro.html?per=" + o.id); } catch (e) {}
}

// ================= TABLERO =================
function tablero_(perId, conPrivados) {
  var p = perFila_(perId); if (!p) return { error: "PER no encontrado: " + perId }; var o = perObj_(p.v);
  var retos = retosDe_(o.tipo); var porId = {}; retos.forEach(function(x){ porId[x[0]] = x; });
  var por = {};
  // 1) identidad desde la pestaña B (última fila por email)
  var shB = SpreadsheetApp.getActive().getSheetByName(o.tabB);
  if (shB && shB.getLastRow() > 1) {
    var vals = shB.getDataRange().getValues(); var cab = vals[0].map(String);
    var cM = idx_(cab,"correo") >= 0 ? idx_(cab,"correo") : idx_(cab,"email"); var cA = idx_(cab,"alias"), cN = idx_(cab,"apellidos"), cB = idx_(cab,"bitácora");
    for (var i = 1; i < vals.length; i++) { var m = String(vals[i][cM]||"").toLowerCase().trim(); if (!m) continue;
      por[m] = { email:m, alias:String(vals[i][cA]||""), nombre:String(vals[i][cN]||""), bitacora:String(vals[i][cB]||""), retos:{}, insignias:{}, xp:0, tema:0, eventos:[] }; }
  }
  // 2) eventos (con fecha) + ajustes del profesorado
  hoja_(H.EV).getDataRange().getValues().slice(1).forEach(function(v){ if (v[1] !== perId) return; var m = String(v[2]).toLowerCase();
    var a = por[m] || (por[m] = { email:m, alias:String(v[3]||""), nombre:"", bitacora:"", retos:{}, insignias:{}, xp:0, tema:0, eventos:[] });
    a.retos[v[4]] = { fecha:v[0], origen:v[8] }; a.eventos.push({ fecha:v[0], reto_id:v[4], reto:v[5], xp:v[7], origen:v[8] }); });
  hoja_(H.AJ).getDataRange().getValues().slice(1).forEach(function(v){ if (v[1] !== perId) return; var m = String(v[2]).toLowerCase(); var a = por[m]; if (!a) return;
    if (v[4] === "anular") delete a.retos[v[3]]; else if (v[4] === "otorgar") { a.retos[v[3]] = { fecha:v[0], origen:"profesorado" }; } });
  // 3) cálculo
  var canjes = {}; var shC = SpreadsheetApp.getActive().getSheetByName(o.tabC);
  if (shC && shC.getLastRow() > 1) { var vc = shC.getDataRange().getValues(); var cc = vc[0].map(String); var cE = cc.indexOf("Estado"), cMm = idx_(cc,"correo") >= 0 ? idx_(cc,"correo") : idx_(cc,"email"), cR = cc.indexOf("Recompensa"), cEnt = cc.indexOf("Entregado");
    for (var j = 1; j < vc.length; j++) { var m2 = String(vc[j][cMm]||"").toLowerCase(); if (cE >= 0 && String(vc[j][cE]).indexOf("Concedido") === 0) {
      var coste = parseInt((String(vc[j][cR]).match(/(\d+) xp$/)||[0,0])[1],10); (canjes[m2] = canjes[m2] || { gastado:0, lista:[] }); canjes[m2].gastado += coste;
      canjes[m2].lista.push({ fecha:vc[j][0], recompensa:vc[j][cR], actividad:vc[j][cc.indexOf("Actividad a la que se aplica")], entregado: cEnt >= 0 ? vc[j][cEnt] : "", fila:j+1 }); } } }
  var lista = Object.keys(por).map(function(m){ var a = por[m]; var xp = 0, tema = 0, ins = {};
    Object.keys(a.retos).forEach(function(id){ if (id === "H1") { xp += XP_RECLUTAMIENTO; ins["H1_reclutamiento"] = true; ins["E1_nebula"] = true; return; }
      var x = porId[id]; if (!x) return; xp += x[3]; if (x[4] > tema && x[4] <= 8) tema = x[4]; x[2].forEach(function(k){ ins[k] = true; }); });
    if (Object.keys(a.retos).length) { ins["H1_reclutamiento"] = true; ins["E1_nebula"] = true; }
    DERIVADAS.forEach(function(d){ if (d[2].every(function(k){ return ins[k]; })) { ins[d[0]] = true; xp += d[1]; } });
    var gast = canjes[m] ? canjes[m].gastado : 0;
    var out = { alias:a.alias, xp:xp, xp_disponibles: xp - gast, planeta: tema ? TEMAS[tema][0] : "—", tema:tema, insignias:Object.keys(ins), n:Object.keys(ins).length };
    if (conPrivados) { out.email = m; out.nombre = a.nombre; out.bitacora = a.bitacora; out.eventos = a.eventos; out.retos = a.retos; out.canjes = canjes[m] ? canjes[m].lista : []; }
    return out; });
  lista.sort(function(a,b){ return b.xp - a.xp || b.n - a.n || a.alias.localeCompare(b.alias); }); lista.forEach(function(x,i){ x.pos = i+1; });
  return { per:perId, nombre:o.nombre, tipo:o.tipo, profesorado:o.profesorado, referente:o.referente, estado:o.estado, inicio:o.inicio,
           formBitacora:o.formBitacora, formTicket:o.formTicket, formCanje:o.formCanje, reclutas:lista, actualizado:new Date() };
}
function idx_(cab, frag) { frag = frag.toLowerCase(); for (var i = 0; i < cab.length; i++) if (cab[i].toLowerCase().indexOf(frag) >= 0) return i; return -1; }

// ================= DATOS / RESUMEN (investigación) =================
function consolidarDatos() {
  var ss = SpreadsheetApp.getActive(); var pers = hoja_(H.PERS).getDataRange().getValues().slice(1);
  var filas = [["per","tipo","fecha","email","alias","reto_id","reto","tema","xp","origen"]];
  hoja_(H.EV).getDataRange().getValues().slice(1).forEach(function(v){ var p = pers.filter(function(x){ return x[0] === v[1]; })[0];
    filas.push([v[1], p ? p[2] : "", v[0], v[2], v[3], v[4], v[5], v[6], v[7], v[8]]); });
  hoja_(H.AJ).getDataRange().getValues().slice(1).forEach(function(v){ var p = pers.filter(function(x){ return x[0] === v[1]; })[0];
    filas.push([v[1], p ? p[2] : "", v[0], v[2], "", v[3], v[4] + (v[5] ? " · " + v[5] : ""), "", "", "ajuste:" + v[6]]); });
  var out = ss.getSheetByName(H.DATOS) || ss.insertSheet(H.DATOS); out.clearContents(); out.getRange(1,1,filas.length,filas[0].length).setValues(filas); out.setFrozenRows(1); out.setTabColor("#f5b043");
  var res = [["per","tipo","alias","email","nombre","xp","xp_disponibles","n_insignias","tema_max","insignias","bitacora"]];
  pers.forEach(function(p){ var t = tablero_(p[0], true); (t.reclutas||[]).forEach(function(x){ res.push([p[0], p[2], x.alias, x.email, x.nombre, x.xp, x.xp_disponibles, x.n, x.tema, x.insignias.join(" "), x.bitacora]); }); });
  var rs = ss.getSheetByName(H.RES) || ss.insertSheet(H.RES); rs.clearContents(); rs.getRange(1,1,res.length,res[0].length).setValues(res); rs.setFrozenRows(1);
}

// ================= API =================
function doGet(e) {
  var per = (e && e.parameter && e.parameter.per) || "all"; var out;
  if (per === "all") out = { pers: hoja_(H.PERS).getDataRange().getValues().slice(1).map(function(v){ var o = perObj_(v); return { id:o.id, nombre:o.nombre, tipo:o.tipo, estado:o.estado, inicio:o.inicio }; }) };
  else out = tablero_(per, false);
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
function doPost(e) {
  var out;
  try {
    var q = JSON.parse(e.postData.contents || "{}");
    var pin = PropertiesService.getScriptProperties().getProperty("PIN_PROFES") || "";
    if (!pin || q.pin !== pin) throw new Error("PIN incorrecto");
    var a = q.accion, per = q.per;
    if (a === "pers") out = { pers: hoja_(H.PERS).getDataRange().getValues().slice(1).map(function(v){ return perObj_(v); }) };
    else if (a === "alumnos") out = tablero_(per, true);
    else if (a === "tickets") { var o = perObj_(perFila_(per).v); var sh = SpreadsheetApp.getActive().getSheetByName(o.tabT); var v = sh && sh.getLastRow() > 1 ? sh.getDataRange().getValues() : [[]];
      var cabT = (v[0]||[]).map(String);
      out = { tickets: v.slice(1).map(function(r){ var o2 = {}; cabT.forEach(function(c,i){ if (i > 0 && r[i] !== "" && r[i] !== null) o2[c] = r[i]; }); return { fecha:r[0], r:o2 }; }) }; }
    else if (a === "ajuste") { hoja_(H.AJ).appendRow([new Date(), per, String(q.email).toLowerCase(), q.reto_id, q.tipo, q.motivo || "", q.profe || ""]); consolidarDatos(); out = { ok:true }; }
    else if (a === "profesorado") { var p = perFila_(per); var sh4 = hoja_(H.PERS); sh4.getRange(p.fila, 4).setValue(q.profesorado || ""); sh4.getRange(p.fila, 17).setValue(q.referente || "");
      try { var o4 = perObj_(perFila_(per).v); var ftx = FormApp.openByUrl(o4.formTicketEdit); ftx.getItems(FormApp.ItemType.LIST).forEach(function(i){ if (i.getTitle().indexOf("profesor o profesora") >= 0) i.asListItem().setChoiceValues(listaProfes_(q.referente, q.profesorado)); }); } catch (e2) {}
      out = { ok:true }; }
    else if (a === "inicio") { var p2 = perFila_(per); hoja_(H.PERS).getRange(p2.fila, 5).setValue(q.inicio ? new Date(q.inicio + "T00:00:00") : ""); out = { ok:true }; }
    else if (a === "abrir" || a === "cerrar") { setAbierto_(per, a === "abrir"); out = { ok:true }; }
    else if (a === "entregado") { var o2 = perObj_(perFila_(per).v); var shc = SpreadsheetApp.getActive().getSheetByName(o2.tabC); var cab = shc.getRange(1,1,1,shc.getLastColumn()).getValues()[0].map(String);
      var col = cab.indexOf("Entregado") + 1; if (!col) { col = shc.getLastColumn() + 1; shc.getRange(1, col).setValue("Entregado"); } shc.getRange(q.fila, col).setValue(q.valor ? "Sí · " + (q.profe||"") : ""); out = { ok:true }; }
    else throw new Error("Acción desconocida");
  } catch (err) { out = { error: err.message }; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

// ================= UTILIDADES =================
function slug_(s) { return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function cambiarPin() { var ui = SpreadsheetApp.getUi(); var r = ui.prompt("PIN del profesorado", "Nuevo PIN (4-12 caracteres). Lo usarán los profes en el panel web.", ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() === ui.Button.OK && r.getResponseText().trim().length >= 4) { PropertiesService.getScriptProperties().setProperty("PIN_PROFES", r.getResponseText().trim()); ui.alert("PIN guardado."); } }
function pedirWebAppUrl() { var ui = SpreadsheetApp.getUi(); var r = ui.prompt("URL del web app", "Pega la URL que termina en /exec", ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() === ui.Button.OK) { PropertiesService.getScriptProperties().setProperty("WEBAPP_URL", r.getResponseText().trim()); ui.alert("Guardada."); } }
