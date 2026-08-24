/**
 * STARGATE · Mando de PERs — Apps Script de la hoja maestra (cuenta mutecdgami@gmail.com)  v3 · 24-ago-2026
 * Menú STARGATE: crear PER (REGULAR o PUA) con 3 formularios por plantilla (Bitácora de mando, Ticket de
 * salida anónimo, Canje de recompensas), apertura/cierre programados, EVENTOS/DATOS/RESUMEN para investigación,
 * API de lectura (doGet) para la web del alumnado y API con PIN (doPost) para el panel del profesorado.
 * v3: La Nave del Recluta (recluta.html?per=id) · recompensas con semana de desbloqueo · canjes de avatar
 * automáticos («Cambio de avatar» y «Avatar personal») · el avatar inicial se congela al alistarse y solo
 * cambia mediante canje concedido · identificación del recluta por correo (doPost accion=quien, sin PIN,
 * devuelve solo SU ficha pública + bio) · BIO del personaje en la Bitácora de mando · panel de control
 * Genially por PER (estándar compartido en propiedades + override por PER desde el panel de profes).
 * v3.2: ciclo de vida del PER — archivar (oculta pestañas y lo saca de los listados del alumnado, conserva
 * los datos), borrar (formularios a la papelera + pestañas + registros) y resetear la hoja entera;
 * restaurar el catálogo oficial de recompensas.
 * v3.2.1: los formularios se resuelven SIEMPRE por su pestaña vinculada (getFormUrl da la URL de edición).
 * Antes el de canje se abría con su URL pública y openByUrl fallaba en silencio: no se cerraba, no se le
 * actualizaban las recompensas y al borrar el PER se quedaba huérfano en Drive. Se guarda además su URL de
 * edición (col 23) y hay un limpiador de formularios huérfanos.
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
// [nombre, coste xp, máx por alumno, descripción, disponible desde (semana REGULAR; en PUA se escala), tipo]
// tipo: "avatar" (automática: nuevo avatar de la galería) · "avatar_url" (automática: imagen propia por URL)
//       "nota" (la aplica el profesorado; efectiva al terminar las clases en directo)
var RECOMPENSAS_INICIALES = [
  ["Cambio de avatar",300,3,"Elige un avatar nuevo de la galería (indícalo en el propio formulario de canje). Se aplica solo.",5,"avatar"],
  ["Avatar personal (tu propia imagen)",800,1,"Pon tu propia imagen como avatar (pega la URL en el formulario de canje). Se aplica solo.",10,"avatar_url"],
  ["Subir 0,5 en un entregable",900,1,"Se aplica a la actividad que elijas",14,"nota"],
  ["Subir 1 punto en un entregable",1400,1,"Se aplica a la actividad que elijas",14,"nota"],
  ["Recalificar un trabajo entregado fuera de plazo",2000,1,"Indica la actividad",14,"nota"],
  ["Recalificar un suspenso",2800,1,"Indica la actividad",14,"nota"]
];
var H = { PERS:"PERs", REC:"RECOMPENSAS", EV:"EVENTOS", AJ:"AJUSTES", DATOS:"DATOS", RES:"RESUMEN" };

function retosDe_(tipo){ return tipo === "PUA" ? RETOS_PUA : RETOS_REGULAR; }
function opcAvatares_() {
  var opc = []; for (var pj = 1; pj <= 5; pj++) { var et = pj < 5 ? ["ella","él"] : ["modelo A","modelo B"];
    opc.push("Personaje " + pj + " · " + et[0] + " (evoluciona)"); opc.push("Personaje " + pj + " · " + et[1] + " (evoluciona)"); }
  for (var cl = 1; cl <= 16; cl++) opc.push("Clásico " + cl);
  return opc;
}

// ================= MENÚ Y HOJAS =================
function onOpen() {
  SpreadsheetApp.getUi().createMenu("STARGATE")
    .addItem("Crear nuevo PER...", "abrirDialogoNuevoPER")
    .addItem("Publicar y abrir formularios del PER seleccionado", "publicarFormulariosPER")
    .addItem("Documento de enlaces y embeds del PER seleccionado", "documentoPERSeleccionado")
    .addItem("Actualizar formularios (recompensas, avatar, bio)", "actualizarRecompensas")
    .addItem("Guardar panel de control estándar (Genially)", "guardarPanelEstandar")
    .addItem("Consolidar DATOS / RESUMEN", "consolidarDatos")
    .addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu("Ciclo de vida del PER (fila seleccionada)")
      .addItem("Archivar / desarchivar PER", "archivarPERSeleccionado")
      .addItem("Borrar PER (con sus formularios y datos)", "borrarPERSeleccionado"))
    .addSubMenu(SpreadsheetApp.getUi().createMenu("Mantenimiento")
      .addItem("Restaurar catálogo oficial de recompensas", "restaurarRecompensas")
      .addItem("Limpiar formularios huérfanos (de PER borrados)", "limpiarFormulariosHuerfanos")
      .addItem("Resetear la hoja (borra TODOS los PER)", "resetearHoja"))
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
  var rec = hoja_(H.REC, ["Recompensa","Coste (xp)","Máx. por alumno","Descripción","Disponible desde (semana)","Tipo"], "#f5b043");
  if (rec.getLastRow() < 2) rec.getRange(2,1,RECOMPENSAS_INICIALES.length,6).setValues(RECOMPENSAS_INICIALES);
  else migrarRecompensas_(rec);
  hoja_(H.EV, ["fecha","per","email","alias","reto_id","reto","tema","xp","origen"], "#aa66cc");
  hoja_(H.AJ, ["fecha","per","email","reto_id","accion","motivo","profe"], "#aa66cc");
  var pers = hoja_(H.PERS);
  if (String(pers.getRange(1,20).getValue()||"") !== "Panel Genially (ver)")
    pers.getRange(1,19,1,4).setValues([["Documento de enlaces","Panel Genially (ver)","Panel Genially (editar)","Archivado"]]);
  if (String(pers.getRange(1,22).getValue()||"") !== "Archivado") pers.getRange(1,22).setValue("Archivado");
  if (String(pers.getRange(1,23).getValue()||"") !== "Canje (editar)") pers.getRange(1,23).setValue("Canje (editar)");
}
// panel de control Genially estándar (compartido por todos los PER salvo override en su fila)
function panelStd_() { var pr = PropertiesService.getScriptProperties();
  return { ver: pr.getProperty("PANEL_STD_VER") || "", editar: pr.getProperty("PANEL_STD_EDIT") || "" }; }
function guardarPanelEstandar() {
  var ui = SpreadsheetApp.getUi(); var pr = PropertiesService.getScriptProperties();
  var r1 = ui.prompt("Panel de control estándar", "Enlace de VISUALIZACIÓN del Genially (view.genially.com/…):", ui.ButtonSet.OK_CANCEL);
  if (r1.getSelectedButton() !== ui.Button.OK) return; pr.setProperty("PANEL_STD_VER", r1.getResponseText().trim());
  var r2 = ui.prompt("Panel de control estándar", "Enlace de EDICIÓN del Genially (app.genially.com/editor/…):", ui.ButtonSet.OK_CANCEL);
  if (r2.getSelectedButton() === ui.Button.OK) pr.setProperty("PANEL_STD_EDIT", r2.getResponseText().trim());
  ui.alert("Guardado. Los PER sin enlaces propios usarán estos.");
}
// v3: añade las columnas «Disponible desde» y «Tipo» a una hoja RECOMPENSAS anterior y las recompensas de avatar
function migrarRecompensas_(rec) {
  if (String(rec.getRange(1,5).getValue()||"") !== "Disponible desde (semana)")
    rec.getRange(1,5,1,2).setValues([["Disponible desde (semana)","Tipo"]]);
  var d = rec.getDataRange().getValues();
  for (var i = 1; i < d.length; i++) { if (!d[i][0]) continue;
    if (!d[i][4]) rec.getRange(i+1,5).setValue(14);
    if (!d[i][5]) rec.getRange(i+1,6).setValue("nota"); }
  var nombres = d.slice(1).map(function(r){ return String(r[0]); });
  RECOMPENSAS_INICIALES.forEach(function(r){ if (String(r[5]).indexOf("avatar") === 0 && nombres.indexOf(r[0]) < 0) rec.appendRow(r); });
}
function recompensasCat_() {
  return hoja_(H.REC).getDataRange().getValues().slice(1).filter(function(r){ return r[0]; })
    .map(function(r){ return { nombre:String(r[0]), coste:Number(r[1])||0, max:Number(r[2])||1, desc:String(r[3]||""), desde:Number(r[4])||14, tipo:String(r[5]||"nota") }; });
}
function semanaDe_(o) { if (!o.inicio) return null; var ini = new Date(o.inicio + "T00:00:00"); var hoy = new Date(); hoy.setHours(0,0,0,0);
  return Math.floor((hoy - ini) / (7 * 864e5)) + 1; }
function desdeEfectiva_(desde, tipo) { desde = Number(desde) || 0; if (!desde) return 0;
  return tipo === "PUA" ? Math.max(1, Math.round(desde * 8 / 15)) : desde; }
// Carpeta donde viven los formularios de los PER
function carpetaPER_() {
  var ss = SpreadsheetApp.getActive(); var padres = DriveApp.getFileById(ss.getId()).getParents();
  var raiz = padres.hasNext() ? padres.next() : DriveApp.getRootFolder();
  var subs = raiz.getFoldersByName("Formularios PER");
  return subs.hasNext() ? subs.next() : raiz;
}
// Devuelve el Form EDITABLE de un PER ("B" Bitácora · "T" Ticket · "C" Canje).
// Prioridad: URL de edición guardada -> pestaña vinculada (getFormUrl siempre da la de edición).
// Nunca uses la URL publicada con openByUrl: lanza excepción.
function formDelPER_(o, cual) {
  var url = cual === "B" ? o.formBitacoraEdit : cual === "T" ? o.formTicketEdit : o.formCanjeEdit;
  if (url) { try { return FormApp.openByUrl(String(url)); } catch (e) {} }
  var tab = cual === "B" ? o.tabB : cual === "T" ? o.tabT : o.tabC;
  try { var sh = SpreadsheetApp.getActive().getSheetByName(tab);
        if (sh) { var fu = sh.getFormUrl(); if (fu) return FormApp.openByUrl(fu); } } catch (e) {}
  return null;
}
function formsDelPER_(o) {
  return ["B","T","C"].map(function(c){ return formDelPER_(o, c); }).filter(function(f){ return !!f; });
}
function perFila_(perId) {
  var d = hoja_(H.PERS).getDataRange().getValues();
  for (var i = 1; i < d.length; i++) if (d[i][0] === perId) return { fila: i + 1, v: d[i] };
  return null;
}
function perObj_(v) {
  return { id:v[0], nombre:v[1], tipo:v[2]||"REGULAR", profesorado:v[3], inicio:fechaIso_(v[4]), apertura:fechaIso_(v[5]), cierre:fechaIso_(v[6]),
           estado:v[7], formBitacora:v[8], formBitacoraEdit:v[9], formTicket:v[10], formCanje:v[11], tabB:v[12], tabT:v[13], tabC:v[14], referente:v[16]||"", formTicketEdit:v[17]||"",
           doc:String(v[18]||""), panelVer:String(v[19]||""), panelEdit:String(v[20]||""), archivado: v[21] ? fechaIso_(v[21]) : "",
           formCanjeEdit:String(v[22]||"") };
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
function publicar_(form) { try { if (form.setPublished) form.setPublished(true); } catch (e) { Logger.log("setPublished: " + e); } }
function publicarFormulariosPER() {
  var sh = hoja_(H.PERS); var fila = SpreadsheetApp.getActiveRange().getRow();
  if (SpreadsheetApp.getActiveSheet().getName() !== H.PERS || fila < 2) { SpreadsheetApp.getUi().alert("Selecciona una fila de la pestaña PERs."); return; }
  var o = perObj_(sh.getRange(fila, 1, 1, 23).getValues()[0]); var n = 0;
  formsDelPER_(o).forEach(function(f){ try { publicar_(f); f.setAcceptingResponses(true); n++; } catch (e) {} });
  sh.getRange(fila, 8).setValue("Abierto");
  SpreadsheetApp.getUi().alert("Publicados y abiertos " + n + " formularios de " + o.nombre + ".");
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
  // avatar: personaje que evoluciona (5) · galería clásica (16) · URL propia
  try { fb.addImageItem().setImage(UrlFetchApp.fetch(WEB + "assets/img/avatares/lamina_personajes.jpg").getBlob()).setTitle("Tu personaje evoluciona con tus xp").setHelpText("Recluta → Cadete → Oficial → Comandante. El tablero lo cambia solo según tus puntos.").setAlignment(FormApp.Alignment.CENTER).setWidth(640); } catch (e) {}
  try { fb.addImageItem().setImage(UrlFetchApp.fetch(WEB + "assets/img/avatares/lamina_avatares.jpg").getBlob()).setTitle("O un avatar clásico (no evoluciona)").setAlignment(FormApp.Alignment.CENTER).setWidth(520); } catch (e) {}
  var av = fb.addListItem().setTitle("Elige tu avatar").setHelpText("Personaje 1-5 en versión ella/él (evoluciona con tus xp: Recluta → Cadete → Oficial → Comandante), clásico 1-16, o tu propia imagen (pega la URL en la siguiente pregunta). Elige bien: cambiarlo después cuesta xp (recompensa «Cambio de avatar»).").setRequired(true);
  av.setChoiceValues(opcAvatares_().concat(["Prefiero mi propia imagen (pongo la URL abajo)"]));
  var avu = fb.addTextItem().setTitle("URL de tu propia imagen (opcional)").setHelpText(
    "Debe ser un ENLACE DIRECTO a una imagen (termina en .jpg, .png o .webp). La forma más fácil: entra en postimages.org, sube tu foto (sin registrarte), y copia el campo «Enlace directo». " +
    "Si la tienes en Google Drive: botón Compartir → «Cualquier persona con el enlace» → pega el enlace normal de Drive (lo convertimos nosotros). Un enlace a una página web o a Instagram NO funciona. Si la imagen no carga, verás tu avatar elegido.");
  avu.setValidation(FormApp.createTextValidation().requireTextIsUrl().build());
  var bit = fb.addTextItem().setTitle("Enlace a mi Bitácora (ePortfolio)").setHelpText("Un único enlace donde está toda tu evidencia. Puedes añadirlo más adelante.");
  bit.setValidation(FormApp.createTextValidation().requireTextIsUrl().build());
  fb.addParagraphTextItem().setTitle("Breve biografía de tu personaje").setHelpText("2-3 frases sobre tu recluta: quién es, de dónde viene, qué se le da bien. Aparecerá al pie de tu personaje en la Nave del Recluta.").setRequired(true);
  var porTema = {}; retos.forEach(function(r){ (porTema[r[4]] = porTema[r[4]] || []).push(r); });
  Object.keys(porTema).sort().forEach(function(t){
    t = Number(t);
    if (t >= 1 && t <= 8) { fb.addPageBreakItem().setTitle("Tema " + t + " · " + TEMAS[t][0]).setHelpText(TEMAS[t][1]); imagen_(fb, t, TEMAS[t][0]); }
    else { fb.addPageBreakItem().setTitle("La batalla final").setHelpText("Solo cuando hayas hecho el examen."); }
    var cb = fb.addCheckboxItem().setTitle(t >= 1 && t <= 8 ? "Tema " + t + " · Lo que he completado" : "Batalla final");
    cb.setChoiceValues(porTema[t].map(function(r){ return r[1]; }));
  });
  publicar_(fb);
  fb.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  var tabB = pestanaDe_(fb, "B · " + id, "#37e0ec");

  // ---- 2 · Ticket de salida «Contacta con NEBULA» (anónimo, ramificado) ----
  var ft = formDesdePlantilla_("PLANTILLA · Ticket de salida", "STARGATE · " + nombre + " · Contacta con NEBULA (ticket de salida)", carpeta);
  construirTicket_(ft, datos.referente || "", datos.profesores || "");
  publicar_(ft);
  ft.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  var tabT = pestanaDe_(ft, "T · " + id, "#9fb2c2");

  // ---- 3 · Canje de recompensas (Google login) ----
  var fc = formDesdePlantilla_("PLANTILLA · Canje de recompensas", "STARGATE · " + nombre + " · Canje de recompensas", carpeta);
  fc.setDescription("Cambia tus xp por ventajas. El sistema comprueba tus puntos al instante y te responde por correo.");
  fc.setCollectEmail(true).setLimitOneResponsePerUser(false).setShowLinkToRespondAgain(true).setConfirmationMessage("Solicitud recibida. Recibirás un correo con el resultado.");
  var lr = fc.addListItem().setTitle("Recompensa").setRequired(true); lr.setChoiceValues(etiquetasRecompensas_());
  var la = fc.addListItem().setTitle("Actividad a la que se aplica").setRequired(true);
  la.setChoiceValues(["Actividad 1 · imagen con IA","Actividad 2 · paisaje de aprendizaje","No aplica (canje de avatar)","Otra (la indico en el comentario)"]);
  anadirCamposAvatar_(fc);
  fc.addParagraphTextItem().setTitle("Comentario (opcional)");
  publicar_(fc);
  fc.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  var tabC = pestanaDe_(fc, "C · " + id, "#f5b043");

  asegurarTriggers_();
  var ahora = new Date(), estado = "Abierto";
  if (apertura && apertura > ahora) { [fb, ft, fc].forEach(function(f){ f.setAcceptingResponses(false); }); estado = "Programado"; programar_("abrirPorTrigger", apertura, id); }
  if (cierre) programar_("cerrarPorTrigger", cierre, id);

  hoja_(H.PERS).appendRow([id, nombre, tipo, datos.profesores || "", inicio || "", apertura || "", cierre || "", estado,
    fb.getPublishedUrl(), fb.getEditUrl(), ft.getPublishedUrl(), fc.getPublishedUrl(), tabB, tabT, tabC, new Date(), datos.referente || "", ft.getEditUrl(),
    "", String(datos.panelVer || "").trim(), String(datos.panelEdit || "").trim(), "", fc.getEditUrl()]);
  var docUrl = ""; try { docUrl = crearDocumentoPER_(id); } catch (e) { docUrl = ""; }
  return { id:id, nombre:nombre, tipo:tipo, estado:estado, referente:datos.referente||"", doc:docUrl, formBitacora:fb.getPublishedUrl(), formTicket:ft.getPublishedUrl(), formCanje:fc.getPublishedUrl(),
    hoja: ss.getUrl(), web: WEB + "registro.html?per=" + id, foro: WEB + "foro.html?per=" + id, nave: WEB + "recluta.html?per=" + id,
    embedAlumnos: '<iframe src="' + WEB + 'registro.html?per=' + id + '&embed=1" width="100%" height="760" style="border:0;border-radius:16px"></iframe>',
    embedForo: '<iframe src="' + WEB + 'foro.html?per=' + id + '&embed=1" width="100%" height="640" style="border:0;border-radius:16px"></iframe>',
    embedNave: '<iframe src="' + WEB + 'recluta.html?per=' + id + '&embed=1" width="100%" height="900" style="border:0;border-radius:16px"></iframe>',
    panelVer: String(datos.panelVer || "").trim() || panelStd_().ver, panelEdit: String(datos.panelEdit || "").trim() || panelStd_().editar };
}
function etiquetasRecompensas_() {
  var d = hoja_(H.REC).getDataRange().getValues().slice(1).filter(function(r){ return r[0]; });
  return d.map(function(r){ return r[0] + " — " + r[1] + " xp"; });
}
// Preguntas del canje de avatar (se usan al crear el PER y al actualizar PERs anteriores)
var TIT_NUEVO_AVATAR = "Nuevo avatar (solo para «Cambio de avatar»)";
var TIT_URL_AVATAR = "URL de tu nueva imagen (solo para «Avatar personal»)";
function anadirCamposAvatar_(fc) {
  var avl = fc.addListItem().setTitle(TIT_NUEVO_AVATAR).setHelpText("Si canjeas «Cambio de avatar», elige aquí el nuevo. Se aplica solo en el tablero al concederse el canje.");
  avl.setChoiceValues(opcAvatares_());
  var url = fc.addTextItem().setTitle(TIT_URL_AVATAR).setHelpText("Si canjeas «Avatar personal», pega el ENLACE DIRECTO a tu imagen (.jpg/.png; postimages.org → «Enlace directo») o un enlace de Drive compartido con «cualquier persona con el enlace».");
  url.setValidation(FormApp.createTextValidation().requireTextIsUrl().build());
}
function actualizarRecompensas() {
  var et = etiquetasRecompensas_(); var n = 0;
  hoja_(H.PERS).getDataRange().getValues().slice(1).forEach(function(v){
    try { var f = formDelPER_(perObj_(v), "C"); if (!f) throw new Error("sin canje");
          var titulos = f.getItems().map(function(i){ return i.getTitle(); });
          f.getItems(FormApp.ItemType.LIST).forEach(function(i){ if (i.getTitle() === "Recompensa") { i.asListItem().setChoiceValues(et); n++; } });
          if (titulos.indexOf(TIT_NUEVO_AVATAR) < 0) anadirCamposAvatar_(f); } catch (e) {}
    try { var fbx = formDelPER_(perObj_(v), "B"); if (!fbx) throw new Error("sin bitacora");
          var tit2 = fbx.getItems().map(function(i){ return i.getTitle(); });
          if (tit2.indexOf("Breve biografía de tu personaje") < 0) {
            var bioIt = fbx.addParagraphTextItem().setTitle("Breve biografía de tu personaje").setHelpText("2-3 frases sobre tu recluta: quién es, de dónde viene, qué se le da bien. Aparecerá al pie de tu personaje en la Nave del Recluta.");
            var items = fbx.getItems(); var pos = tit2.indexOf("Enlace a mi Bitácora (ePortfolio)");
            if (pos >= 0) fbx.moveItem(bioIt.getIndex(), pos + 1); } } catch (e) {}
  });
  SpreadsheetApp.getUi().alert("Formularios actualizados en " + n + " PER: recompensas al día, campos de avatar en el canje y biografía en la Bitácora (donde faltaban).");
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

// ================= DOCUMENTO DE ENLACES (Google Docs) =================
function documentoPERSeleccionado() {
  var sh = hoja_(H.PERS); var fila = SpreadsheetApp.getActiveRange().getRow();
  if (SpreadsheetApp.getActiveSheet().getName() !== H.PERS || fila < 2) { SpreadsheetApp.getUi().alert("Selecciona una fila de la pestaña PERs."); return; }
  var url = crearDocumentoPER_(sh.getRange(fila, 1).getValue());
  SpreadsheetApp.getUi().alert("Documento creado:\n" + url);
}
function crearDocumentoPER_(perId) {
  var p = perFila_(perId); if (!p) throw new Error("PER no encontrado"); var o = perObj_(p.v);
  var ss = SpreadsheetApp.getActive(); var master = DriveApp.getFileById(ss.getId()); var padres = master.getParents();
  var raiz = padres.hasNext() ? padres.next() : DriveApp.getRootFolder();
  var subs = raiz.getFoldersByName("Formularios PER"); var carpeta = subs.hasNext() ? subs.next() : raiz;
  var doc = DocumentApp.create("STARGATE · " + o.nombre + " · Enlaces y embeds"); DriveApp.getFileById(doc.getId()).moveTo(carpeta);
  var b = doc.getBody(); b.setMarginTop(40);
  function h(t, n) { b.appendParagraph(t).setHeading(n === 1 ? DocumentApp.ParagraphHeading.HEADING1 : DocumentApp.ParagraphHeading.HEADING2); }
  function par(t) { b.appendParagraph(t); }
  function link(label, url) { var pr = b.appendParagraph(label + ": "); pr.appendText(url).setLinkUrl(url); }
  function code(c) { var pr = b.appendParagraph(c); pr.editAsText().setFontFamily("Courier New").setFontSize(8).setBackgroundColor("#eef7f8"); }
  function qr(url, t) { try { b.appendParagraph(t).setItalic(true); b.appendImage(UrlFetchApp.fetch("https://quickchart.io/qr?size=220&margin=2&dark=0e5f6c&text=" + encodeURIComponent(url)).getBlob()); } catch (e) {} }
  function ifr(u, hgt) { return '<iframe src="' + u + '" width="100%" height="' + hgt + '" style="border:0;border-radius:16px" allowfullscreen loading="lazy"></iframe>'; }
  h("STARGATE · " + o.nombre, 1);
  par("Tipo: " + o.tipo + " · Referente: " + (o.referente || "—") + " · Profesorado: " + (o.profesorado || "—") + " · Semana 1: " + (o.inicio || "sin fecha") + " · Generado: " + Utilities.formatDate(new Date(), "Europe/Madrid", "dd/MM/yyyy HH:mm"));
  par("Cómo se incrusta en Genially: Insertar → Código embed, pegar el código y ajustar al lienzo. Para los formularios, mejor un botón con el enlace (o el QR para proyectar).");
  h("Panel de control (Genially de los planetas)", 2);
  var stdD = panelStd_();
  link("Visualización (para el alumnado)", o.panelVer || stdD.ver || "(sin definir: menú STARGATE → Guardar panel de control estándar)");
  link("Edición (para el profesorado)", o.panelEdit || stdD.editar || "(sin definir)");
  par(o.panelVer || o.panelEdit ? "Este PER usa un panel PROPIO." : "Este PER usa el panel ESTÁNDAR compartido. Si el profesorado quiere el suyo, se cambia desde el panel de profes (Ajustes del PER).");
  h("Para el Genially del alumnado", 2);
  link("La Nave del Recluta (el hub del alumnado: onboarding, semanas, su estado y recompensas)", WEB + "recluta.html?per=" + o.id);
  qr(WEB + "recluta.html?per=" + o.id, "QR de la Nave del Recluta");
  par("Embed de la Nave:"); code(ifr(WEB + "recluta.html?per=" + o.id + "&embed=1", 900));
  link("Bitácora de mando (registro de insignias; botón)", o.formBitacora); qr(o.formBitacora, "QR de la Bitácora de mando");
  link("Tablero de reclutas", WEB + "registro.html?per=" + o.id); par("Embed del tablero:"); code(ifr(WEB + "registro.html?per=" + o.id + "&embed=1", 760));
  link("Foro dinámico (la orden de la semana)", WEB + "foro.html?per=" + o.id); par("Embed del foro:"); code(ifr(WEB + "foro.html?per=" + o.id + "&embed=1", 640));
  link("Ticket de salida «Contacta con NEBULA» (anónimo; botón)", o.formTicket); qr(o.formTicket, "QR del ticket de salida");
  link("Canje de xp (botón)", o.formCanje); qr(o.formCanje, "QR del canje");
  h("Para el Genially del profesorado (con PIN)", 2);
  link("Panel del PER", WEB + "profes.html?per=" + o.id); code(ifr(WEB + "profes.html?per=" + o.id + "&embed=1", 900));
  link("Tickets de salida (visual)", WEB + "tickets.html?per=" + o.id); code(ifr(WEB + "tickets.html?per=" + o.id + "&embed=1", 900));
  par("Para filtrar los tickets por profesor/a añade &profe=NOMBRE a la URL del panel de tickets, o usa el generador de la web: " + WEB + "embed.html?per=" + o.id);
  h("Solo profesorado referente", 2);
  link("Hoja maestra", ss.getUrl()); link("Editar la Bitácora de mando", o.formBitacoraEdit); link("Editar el ticket", o.formTicketEdit || "");
  doc.saveAndClose();
  var url = doc.getUrl(); hoja_(H.PERS).getRange(p.fila, 19).setValue(url); hoja_(H.PERS).getRange(1, 19).setValue("Documento de enlaces");
  return url;
}

// ================= CICLO DE VIDA DEL PER (archivar · borrar · resetear) =================
function filaPERSeleccionada_() {
  var sh = hoja_(H.PERS); var fila = SpreadsheetApp.getActiveRange().getRow();
  if (SpreadsheetApp.getActiveSheet().getName() !== H.PERS || fila < 2) {
    SpreadsheetApp.getUi().alert("Selecciona primero una fila de la pestaña PERs."); return null; }
  var v = sh.getRange(fila, 1, 1, 23).getValues()[0];
  if (!v[0]) { SpreadsheetApp.getUi().alert("Esa fila no tiene ningún PER."); return null; }
  return { fila: fila, o: perObj_(v) };
}
// ARCHIVAR: conserva todo (datos, formularios y respuestas) pero cierra el PER, oculta sus pestañas
// y lo saca de los listados del alumnado. El enlace directo ?per=id sigue funcionando (histórico).
function archivarPERSeleccionado() {
  var sel = filaPERSeleccionada_(); if (!sel) return; var ui = SpreadsheetApp.getUi();
  var arch = !sel.o.archivado;
  var r = ui.alert(arch ? "Archivar PER" : "Desarchivar PER",
    arch ? "«" + sel.o.nombre + "» se cerrará, sus pestañas se ocultarán y dejará de aparecer en los listados del alumnado (Nave, foro, embeds).\n\nNO se borra nada: los datos y el tablero siguen accesibles por enlace directo. ¿Archivar?"
         : "«" + sel.o.nombre + "» volverá a aparecer en los listados y sus pestañas se mostrarán. Los formularios seguirán cerrados hasta que los abras. ¿Desarchivar?",
    ui.ButtonSet.YES_NO);
  if (r !== ui.Button.YES) return;
  setArchivado_(sel.o.id, arch);
  ui.alert(arch ? "PER archivado." : "PER desarchivado.");
}
function setArchivado_(perId, arch) {
  var p = perFila_(perId); if (!p) return; var o = perObj_(p.v); var ss = SpreadsheetApp.getActive();
  hoja_(H.PERS).getRange(p.fila, 22).setValue(arch ? new Date() : "");
  if (arch) { try { setAbierto_(perId, false); } catch (e) {} }
  [o.tabB, o.tabT, o.tabC].forEach(function(n){ try { var sh = ss.getSheetByName(n); if (sh) { if (arch) sh.hideSheet(); else sh.showSheet(); } } catch (e) {} });
}
function borrarPERSeleccionado() {
  var sel = filaPERSeleccionada_(); if (!sel) return; var ui = SpreadsheetApp.getUi();
  var r = ui.prompt("Borrar el PER «" + sel.o.nombre + "»",
    "IRREVERSIBLE. Manda a la papelera sus 3 formularios y su documento de enlaces, borra sus pestañas de respuestas y todos sus registros de EVENTOS y AJUSTES.\n\n" +
    "Si solo quieres quitarlo de en medio conservando los datos, cancela y usa «Archivar».\n\n" +
    "Escribe el id del PER para confirmar:  " + sel.o.id, ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK || r.getResponseText().trim() !== sel.o.id) { ui.alert("Cancelado: nada se ha borrado."); return; }
  borrarPER_(sel.o, sel.fila);
  try { consolidarDatos(); } catch (e) {}
  ui.alert("PER «" + sel.o.nombre + "» borrado. Los formularios están en la papelera de Drive por si acaso.");
}
function borrarPER_(o, fila) {
  formsDelPER_(o).forEach(function(f){ try { DriveApp.getFileById(f.getId()).setTrashed(true); } catch (e) {} });
  if (o.doc) { try { DriveApp.getFileById(o.doc.match(/[-\w]{25,}/)[0]).setTrashed(true); } catch (e) {} }
  var ss = SpreadsheetApp.getActive();
  [o.tabB, o.tabT, o.tabC].forEach(function(n){ try { var sh = ss.getSheetByName(n); if (sh) ss.deleteSheet(sh); } catch (e) {} });
  borrarFilasDe_(hoja_(H.EV), o.id); borrarFilasDe_(hoja_(H.AJ), o.id);
  var props = PropertiesService.getScriptProperties();
  ScriptApp.getProjectTriggers().forEach(function(t){ if (props.getProperty("trg_" + t.getUniqueId()) === o.id) {
    props.deleteProperty("trg_" + t.getUniqueId()); ScriptApp.deleteTrigger(t); } });
  hoja_(H.PERS).deleteRow(fila);
}
function borrarFilasDe_(sh, perId) { // la columna 2 es el per en EVENTOS y AJUSTES
  var v = sh.getDataRange().getValues();
  for (var i = v.length - 1; i >= 1; i--) if (v[i][1] === perId) sh.deleteRow(i + 1);
}
function restaurarRecompensas() {
  var ui = SpreadsheetApp.getUi();
  if (ui.alert("Restaurar el catálogo oficial de recompensas",
    "Sustituye la pestaña RECOMPENSAS por el catálogo oficial:\n" +
    "· Cambio de avatar — 300 xp (desde la semana 5, máx. 3)\n· Avatar personal — 800 xp (desde la semana 10)\n" +
    "· Subir 0,5 — 900 · Subir 1 — 1.400 · Recalificar fuera de plazo — 2.000 · Recalificar suspenso — 2.800 (desde la semana 14)\n\n" +
    "Se pierden los cambios manuales que hayas hecho en esa pestaña. ¿Continuar?", ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  restaurarRecompensas_();
  ui.alert("Catálogo restaurado. Ahora ejecuta «Actualizar formularios» para que los formularios de canje muestren los nuevos precios.");
}
function restaurarRecompensas_() {
  var rec = hoja_(H.REC); rec.clearContents();
  rec.getRange(1,1,1,6).setValues([["Recompensa","Coste (xp)","Máx. por alumno","Descripción","Disponible desde (semana)","Tipo"]]);
  rec.getRange(2,1,RECOMPENSAS_INICIALES.length,6).setValues(RECOMPENSAS_INICIALES);
  rec.setFrozenRows(1);
}
// Formularios de PER que ya no existen en la hoja (p. ej. borrados con la versión anterior, que dejaba
// huérfano el de canje). Los manda a la papelera tras confirmar.
function limpiarFormulariosHuerfanos() {
  var ui = SpreadsheetApp.getUi();
  var vivos = {}; hoja_(H.PERS).getDataRange().getValues().slice(1).forEach(function(v){ if (v[1]) vivos[String(v[1]).trim()] = true; });
  var it = carpetaPER_().getFilesByType(MimeType.GOOGLE_FORMS); var huerfanos = [];
  while (it.hasNext()) { var f = it.next(); var n = f.getName();
    if (n.indexOf("STARGATE · ") !== 0 || n.indexOf("PLANTILLA") >= 0) continue;
    var partes = n.split(" · "); if (partes.length < 3) continue;
    if (!vivos[partes[1].trim()]) huerfanos.push(f); }
  if (!huerfanos.length) { ui.alert("No hay formularios huérfanos: todos pertenecen a un PER de la hoja."); return; }
  var lista = huerfanos.map(function(f){ return "· " + f.getName(); }).join("\n");
  if (ui.alert("Limpiar formularios huérfanos",
      "Estos " + huerfanos.length + " formularios no pertenecen a ningún PER de la hoja y se mandarán a la papelera:\n\n" + lista +
      "\n\n¿Continuar?", ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  var n = 0; huerfanos.forEach(function(f){ try { f.setTrashed(true); n++; } catch (e) {} });
  ui.alert(n + " formularios enviados a la papelera de Drive.");
}
function resetearHoja() {
  var ui = SpreadsheetApp.getUi();
  var sh = hoja_(H.PERS); var d = sh.getDataRange().getValues();
  var total = d.slice(1).filter(function(v){ return v[0]; }).length;
  if (!total) { restaurarRecompensas_(); ui.alert("No había ningún PER. Catálogo de recompensas restaurado."); return; }
  var r = ui.prompt("Resetear la hoja",
    "Deja la hoja como recién instalada: borra los " + total + " PER (formularios y documentos a la papelera, pestañas de respuestas, EVENTOS, AJUSTES, DATOS y RESUMEN) y restaura el catálogo de recompensas.\n\n" +
    "SE CONSERVAN: el PIN del profesorado, la URL del web app, el panel de control estándar y las plantillas de formulario.\n\n" +
    "Escribe RESETEAR para confirmar:", ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK || r.getResponseText().trim().toUpperCase() !== "RESETEAR") { ui.alert("Cancelado: nada se ha borrado."); return; }
  var n = 0;
  for (var i = d.length - 1; i >= 1; i--) { if (!d[i][0]) continue; try { borrarPER_(perObj_(d[i]), i + 1); n++; } catch (e) { Logger.log(e); } }
  [H.EV, H.AJ].forEach(function(nom){ var x = hoja_(nom); if (x.getLastRow() > 1) x.getRange(2,1,x.getLastRow()-1,x.getLastColumn()).clearContent(); });
  restaurarRecompensas_();
  var sueltos = 0;
  try { var it2 = carpetaPER_().getFilesByType(MimeType.GOOGLE_FORMS);
    while (it2.hasNext()) { var f2 = it2.next(); var n2 = f2.getName();
      if (n2.indexOf("STARGATE · ") === 0 && n2.indexOf("PLANTILLA") < 0) { f2.setTrashed(true); sueltos++; } } } catch (e) {}
  try { consolidarDatos(); } catch (e) {}
  ui.alert("Hoja reseteada: " + n + " PER borrados" + (sueltos ? " y " + sueltos + " formularios sueltos a la papelera" : "") + ". Catálogo de recompensas restaurado.");
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
  formsDelPER_(o).forEach(function(fx){ try { if (abrir) publicar_(fx); fx.setAcceptingResponses(abrir); } catch (e) {} });
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
  congelarAvatarBase_(o, email, r);
  var alias = r["Alias de recluta (público)"] || ""; var retos = retosDe_(o.tipo); var porEt = {}; retos.forEach(function(x){ porEt[x[1]] = x; });
  var ev = hoja_(H.EV); var previos = {};
  ev.getDataRange().getValues().slice(1).forEach(function(v){ if (v[1] === o.id && String(v[2]).toLowerCase() === email) previos[v[4]] = true; });
  var nuevos = [];
  if (!previos["H1"]) nuevos.push([new Date(), o.id, email, alias, "H1", "Reclutamiento", 0, XP_RECLUTAMIENTO, "formulario"]);
  marcados_(r).forEach(function(et){ var x = porEt[et]; if (x && !previos[x[0]]) nuevos.push([new Date(), o.id, email, alias, x[0], x[1], x[4], x[3], "formulario"]); });
  if (nuevos.length) ev.getRange(ev.getLastRow()+1, 1, nuevos.length, 9).setValues(nuevos);
}
// v3: congela el avatar elegido en el PRIMER envío de la Bitácora. Después, editar el formulario
// no cambia el avatar del tablero: solo lo cambia un canje concedido («Cambio de avatar» / «Avatar personal»).
function congelarAvatarBase_(o, email, r) {
  try {
    var aj = hoja_(H.AJ);
    var hay = aj.getDataRange().getValues().slice(1).some(function(v){
      return v[1] === o.id && String(v[2]).toLowerCase() === email && v[3] === "AVATAR"; });
    if (hay) return;
    var txt = String(r["Elige tu avatar"] || ""); var url = String(r["URL de tu propia imagen (opcional)"] || "").trim();
    var valor = txt + (url ? " | " + url : "");
    if (valor.trim()) aj.appendRow([new Date(), o.id, email, "AVATAR", "avatar_base", valor, "sistema"]);
  } catch (e) { Logger.log("congelarAvatarBase_: " + e); }
}
function aplicarAvatar_(o, email, valor) { hoja_(H.AJ).appendRow([new Date(), o.id, email, "AVATAR", "avatar", valor, "canje"]); }
function resolverCanje_(o, sh, fila) {
  var r = leerFila_(sh, fila); var email = String(r["Dirección de correo electrónico"] || r["Email Address"] || "").toLowerCase().trim();
  var rec = String(r["Recompensa"] || ""); var coste = parseInt((rec.match(/(\d+) xp$/) || [0,0])[1], 10);
  var ficha = recompensasCat_().filter(function(x){ return rec.indexOf(x.nombre) === 0; })[0] || null;
  var t = tablero_(o.id, true); var al = (t.reclutas || []).filter(function(x){ return x.email === email; })[0];
  var disp = al ? al.xp_disponibles : 0;
  var cab = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String); var col = cab.indexOf("Estado") + 1;
  if (!col) { col = sh.getLastColumn() + 1; sh.getRange(1, col).setValue("Estado"); sh.getRange(1, col+1).setValue("Entregado"); }
  var estado = "", cuerpo = "";
  // 1) puerta temporal: la recompensa se desbloquea con el calendario del PER
  var sem = semanaDe_(o); var desde = ficha ? desdeEfectiva_(ficha.desde, o.tipo) : 0;
  if (desde && (sem === null || sem < desde)) {
    estado = "Denegado (bloqueada hasta la semana " + desde + (sem ? "; vais por la " + sem : "") + ")";
    cuerpo = "Esa recompensa aún está clasificada, recluta: se desbloquea en la semana " + desde + " de la misión. No se han gastado xp.";
  }
  // 2) saldo
  else if (!al || disp < coste || coste <= 0) {
    estado = "Denegado (" + disp + " xp disponibles, cuesta " + coste + ")";
    cuerpo = "No hay xp suficientes para «" + rec + "»: tienes " + disp + " xp disponibles.";
  }
  // 3) canjes de avatar: se aplican solos
  else if (ficha && ficha.tipo === "avatar") {
    var nuevo = String(r[TIT_NUEVO_AVATAR] || "").trim();
    if (!nuevo) { estado = "Denegado (falta elegir el nuevo avatar en el formulario)"; cuerpo = "Para «Cambio de avatar» tienes que elegir el nuevo avatar en el propio formulario. Vuelve a enviarlo con tu elección; no se han gastado xp."; }
    else { aplicarAvatar_(o, email, nuevo); estado = "Concedido"; cuerpo = "Concedido: " + rec + ". Tu nuevo avatar («" + nuevo + "») ya luce en el tablero. Te quedan " + (disp - coste) + " xp."; }
  }
  else if (ficha && ficha.tipo === "avatar_url") {
    var u = String(r[TIT_URL_AVATAR] || "").trim();
    if (!/^https?:\/\//i.test(u)) { estado = "Denegado (falta la URL de la imagen en el formulario)"; cuerpo = "Para «Avatar personal» tienes que pegar la URL directa de tu imagen en el propio formulario. Vuelve a enviarlo con el enlace; no se han gastado xp."; }
    else { aplicarAvatar_(o, email, u); estado = "Concedido"; cuerpo = "Concedido: " + rec + ". Tu imagen ya es tu avatar en el tablero (si no carga, revisa que el enlace sea directo). Te quedan " + (disp - coste) + " xp."; }
  }
  // 4) recompensas de nota: las aplica el profesorado al terminar las clases en directo
  else {
    estado = "Concedido";
    cuerpo = "Concedido: " + rec + ". Te quedan " + (disp - coste) + " xp. Importante: esta recompensa se hará efectiva al terminar las clases en directo; el profesorado la aplicará entonces.";
  }
  var ok = estado === "Concedido";
  sh.getRange(fila, col).setValue(estado);
  try { MailApp.sendEmail(email, "STARGATE · Canje " + (ok ? "concedido" : "denegado"),
    cuerpo + "\n\nTablero: " + WEB + "registro.html?per=" + o.id + "\nTu nave: " + WEB + "recluta.html?per=" + o.id); } catch (e) {}
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
    var cM = idx_(cab,"correo") >= 0 ? idx_(cab,"correo") : idx_(cab,"email"); var cA = idx_(cab,"alias"), cN = idx_(cab,"apellidos"), cB = idx_(cab,"bitácora"), cBio = idx_(cab,"biograf");
    var cAv = idx_(cab,"elige tu avatar"), cAvU = idx_(cab,"url de tu propia imagen");
    for (var i = 1; i < vals.length; i++) { var m = String(vals[i][cM]||"").toLowerCase().trim(); if (!m) continue;
      var avs = cAv >= 0 ? String(vals[i][cAv]||"") : ""; var avu = cAvU >= 0 ? String(vals[i][cAvU]||"").trim() : "";
      var mp = avs.match(/Personaje (\d) · (ella|él|modelo A|modelo B)/), mc = avs.match(/Cl[aá]sico (\d+)/), mn = avs.match(/^(\d+)$/);
      var avatar = mp ? { tipo:"evo", n:Number(mp[1]), v: (mp[2] === "él" || mp[2] === "modelo B") ? "m" : "f" } : mc ? { tipo:"clasico", n:Number(mc[1]) } : mn ? { tipo:"clasico", n:Number(mn[1]) } : { tipo:null, n:null };
      avatar.url = avu;
      por[m] = { email:m, alias:String(vals[i][cA]||""), nombre:String(vals[i][cN]||""), bitacora:String(vals[i][cB]||""), bio:cBio >= 0 ? String(vals[i][cBio]||"") : "", avatar:avatar, retos:{}, insignias:{}, xp:0, tema:0, eventos:[] }; }
  }
  // 2) eventos (con fecha) + ajustes del profesorado
  hoja_(H.EV).getDataRange().getValues().slice(1).forEach(function(v){ if (v[1] !== perId) return; var m = String(v[2]).toLowerCase();
    var a = por[m] || (por[m] = { email:m, alias:String(v[3]||""), nombre:"", bitacora:"", avatar:{tipo:null,n:null,url:""}, retos:{}, insignias:{}, xp:0, tema:0, eventos:[] });
    a.retos[v[4]] = { fecha:v[0], origen:v[8] }; a.eventos.push({ fecha:v[0], reto_id:v[4], reto:v[5], xp:v[7], origen:v[8] }); });
  hoja_(H.AJ).getDataRange().getValues().slice(1).forEach(function(v){ if (v[1] !== perId) return; var m = String(v[2]).toLowerCase(); var a = por[m]; if (!a) return;
    if (v[4] === "anular") delete a.retos[v[3]]; else if (v[4] === "otorgar") { a.retos[v[3]] = { fecha:v[0], origen:"profesorado" }; }
    else if (v[4] === "avatar") { a._avCanje = String(v[5] || ""); }               // canje concedido: el último gana
    else if (v[4] === "avatar_base" && !a._avBase) { a._avBase = String(v[5] || ""); } });  // primera elección congelada
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
    // avatar: canje concedido > elección congelada al alistarse > valor actual del formulario (respuestas antiguas)
    var avatar = a._avCanje ? parseAvatar_(a._avCanje) : a._avBase ? parseAvatar_(a._avBase) : (a.avatar || {tipo:null,n:null,url:""});
    var out = { alias:a.alias, avatar:avatar, xp:xp, xp_disponibles: xp - gast, planeta: tema ? TEMAS[tema][0] : "—", tema:tema, insignias:Object.keys(ins), n:Object.keys(ins).length };
    if (conPrivados) { out.email = m; out.nombre = a.nombre; out.bitacora = a.bitacora; out.bio = a.bio || ""; out.eventos = a.eventos; out.retos = a.retos; out.canjes = canjes[m] ? canjes[m].lista : []; }
    return out; });
  lista.sort(function(a,b){ return b.xp - a.xp || b.n - a.n || a.alias.localeCompare(b.alias); }); lista.forEach(function(x,i){ x.pos = i+1; });
  var std = panelStd_();
  var res = { per:perId, nombre:o.nombre, tipo:o.tipo, profesorado:o.profesorado, referente:o.referente, estado:o.estado, inicio:o.inicio,
           formBitacora:o.formBitacora, formTicket:o.formTicket, formCanje:o.formCanje, reclutas:lista,
           recompensas:recompensasCat_(), semana:semanaDe_(o), panel:o.panelVer || std.ver,
           actualizado:new Date() };
  if (conPrivados) { res.panelEdit = o.panelEdit || std.editar; res.panelPropio = !!(o.panelVer || o.panelEdit); res.archivado = o.archivado; }
  return res;
}
// «Personaje 3 · ella (evoluciona)» / «Clásico 7» / URL directa / «elección | url» -> objeto avatar del tablero
function parseAvatar_(s) {
  s = String(s || ""); var partes = s.split(" | "); var txt = partes[0] || ""; var url = (partes[1] || "").trim();
  if (/^https?:\/\//i.test(txt)) { url = txt.trim(); txt = ""; }
  var mp = txt.match(/Personaje (\d) · (ella|él|modelo A|modelo B)/), mc = txt.match(/Cl[aá]sico (\d+)/);
  var av = mp ? { tipo:"evo", n:Number(mp[1]), v:(mp[2] === "él" || mp[2] === "modelo B") ? "m" : "f" } : mc ? { tipo:"clasico", n:Number(mc[1]) } : { tipo:null, n:null };
  av.url = url; return av;
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
  if (per === "all") out = { pers: hoja_(H.PERS).getDataRange().getValues().slice(1).filter(function(v){ return v[0] && !v[21]; })
      .map(function(v){ var o = perObj_(v); return { id:o.id, nombre:o.nombre, tipo:o.tipo, estado:o.estado, inicio:o.inicio }; }) };
  else out = tablero_(per, false);
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
function doPost(e) {
  var out;
  try {
    var q = JSON.parse(e.postData.contents || "{}");
    // identificación del recluta (sin PIN): devuelve SOLO la ficha del correo indicado; nunca lista correos
    if (q.accion === "quien") {
      var tq = tablero_(q.per, true); if (tq.error) throw new Error(tq.error);
      var eq = String(q.email || "").toLowerCase().trim();
      var yo = (tq.reclutas || []).filter(function(x){ return x.email === eq; })[0] || null;
      return ContentService.createTextOutput(JSON.stringify({ yo: yo ? { alias:yo.alias, avatar:yo.avatar, xp:yo.xp,
        xp_disponibles:yo.xp_disponibles, planeta:yo.planeta, tema:yo.tema, insignias:yo.insignias, n:yo.n, pos:yo.pos,
        bio:yo.bio || "", bitacora:yo.bitacora || "" } : null })).setMimeType(ContentService.MimeType.JSON);
    }
    var pin = PropertiesService.getScriptProperties().getProperty("PIN_PROFES") || "";
    if (!pin || q.pin !== pin) throw new Error("PIN incorrecto");
    var a = q.accion, per = q.per;
    if (a === "pers") out = { pers: hoja_(H.PERS).getDataRange().getValues().slice(1).map(function(v){ return perObj_(v); }) };
    else if (a === "alumnos") out = tablero_(per, true);
    else if (a === "tickets") { var o = perObj_(perFila_(per).v); var sh = SpreadsheetApp.getActive().getSheetByName(o.tabT); var v = sh && sh.getLastRow() > 1 ? sh.getDataRange().getValues() : [[]];
      var cabT = (v[0]||[]).map(String);
      var cRes = cabT.indexOf("Resuelto");
      out = { tickets: v.slice(1).map(function(r, k){ var o2 = {}; cabT.forEach(function(c,i){ if (i > 0 && c !== "Resuelto" && r[i] !== "" && r[i] !== null) o2[c] = r[i]; }); return { fecha:r[0], fila:k+2, resuelto: cRes >= 0 ? String(r[cRes]||"") : "", r:o2 }; }) }; }
    else if (a === "ticket_resuelto") { var o5 = perObj_(perFila_(per).v); var sht = SpreadsheetApp.getActive().getSheetByName(o5.tabT); var cabR = sht.getRange(1,1,1,sht.getLastColumn()).getValues()[0].map(String);
      var colR = cabR.indexOf("Resuelto") + 1; if (!colR) { colR = sht.getLastColumn() + 1; sht.getRange(1, colR).setValue("Resuelto"); } sht.getRange(q.fila, colR).setValue(q.valor ? "Sí · " + (q.profe||"") + " · " + Utilities.formatDate(new Date(),"Europe/Madrid","dd/MM") : ""); out = { ok:true }; }
    else if (a === "ajuste") { hoja_(H.AJ).appendRow([new Date(), per, String(q.email).toLowerCase(), q.reto_id, q.tipo, q.motivo || "", q.profe || ""]); consolidarDatos(); out = { ok:true }; }
    else if (a === "profesorado") { var p = perFila_(per); var sh4 = hoja_(H.PERS); sh4.getRange(p.fila, 4).setValue(q.profesorado || ""); sh4.getRange(p.fila, 17).setValue(q.referente || "");
      try { var o4 = perObj_(perFila_(per).v); var ftx = FormApp.openByUrl(o4.formTicketEdit); ftx.getItems(FormApp.ItemType.LIST).forEach(function(i){ if (i.getTitle().indexOf("profesor o profesora") >= 0) i.asListItem().setChoiceValues(listaProfes_(q.referente, q.profesorado)); }); } catch (e2) {}
      out = { ok:true }; }
    else if (a === "archivar") { setArchivado_(per, !!q.valor); out = { ok:true }; }
    else if (a === "panel") { var pp = perFila_(per); hoja_(H.PERS).getRange(pp.fila, 20).setValue(String(q.ver||"").trim()); hoja_(H.PERS).getRange(pp.fila, 21).setValue(String(q.editar||"").trim()); out = { ok:true }; }
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
