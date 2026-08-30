/**
 * STARGATE · Mando de PERs — Apps Script de la hoja maestra (cuenta mutecdgami@gmail.com)  v3.13 · 25-ago-2026
 * Menú STARGATE: crear PER (REGULAR o PUA) con 3 formularios por plantilla (Bitácora de mando, Ticket de
 * salida anónimo, Canje de recompensas), apertura/cierre programados, EVENTOS/DATOS/RESUMEN para investigación,
 * API de lectura (doGet) para la web del alumnado y API con PIN (doPost) para el panel del profesorado.
 * v3: La Nave del Recluta (recluta.html?per=id) · recompensas con semana de desbloqueo · canjes de avatar
 * automáticos («Cambio de avatar» y «Avatar personal») · el avatar inicial se congela al alistarse y solo
 * v3.13: (1) las tareas que recorren TODOS los PER —resetear la hoja y actualizar los
 * formularios— agotaban los 360 s de Apps Script y dejaban el trabajo A MEDIAS: ahora van POR
 * LOTES con continuación automática (guardan por dónde iban y siguen solas dentro de un minuto);
 * (2) un canje de nota concedido en un grupo cuyo equipo docente no tiene correos ya no se pierde:
 * va al CORREO DE RESERVA y deja traza en AJUSTES; (3) los reclutas SIN DOCENTE se cuentan en el
 * tablero privado y se destacan en la Consola (columna y bloque propio); (4) DOSSIER DEL
 * PROFESORADO: un único documento con todos los grupos, equipos docentes y enlaces, que se
 * reescribe solo (mismo enlace para siempre) y se manda por correo desde el menú.
 * v3.12: arreglos salidos del banco de pruebas — (1) una recompensa que ya no está en el catálogo
 * se DENIEGA en vez de cobrarse y avisar al docente como si fuera de nota; (2) la ficha de la
 * recompensa se busca por etiqueta EXACTA (antes «X premium» se resolvía como «X»: otro tope y
 * otro efecto); (3) hoja_() sin cabecera ya no revienta; (4) el diálogo de restaurar el catálogo
 * muestra los precios reales en créditos, generados de RECOMPENSAS_INICIALES.
 * v3.11.1: el rol del docente es COMBINABLE — «referente», «imparte» o «referente+imparte»: el
 * referente que además da clase se marca con las dos casillas, sin repetir su nombre. El desplegable
 * que ve el alumnado solo ofrece a quien IMPARTE. Equipo editable desde profes.html → Ajustes.
 * v3.11: EQUIPO DOCENTE con correo (pestaña DOCENTES), cada alumno declara su docente en la Bitácora,
 * aviso por correo SOLO cuando un canje requiere intervención humana (notas), y clase.html: la sala
 * del docente, bidireccional (acción «ficha» para corregir alias/nombre/docente/ePortfolio).
 * v3.10: CONSOLA — segunda hoja de cálculo «STARGATE · Consola del profesorado» (id en la propiedad
 * CONSOLA_ID) con portada de todos los PER y una pestaña por PER. Es una foto: menú o fotoNocturna
 * (4:00). Y consolidarDatos() sale del camino caliente: recorría TODOS los PER en cada envío.
 * v3.9: CERROJO en el trigger (LockService) para que dos envíos simultáneos no se pisen al cobrar,
 * y se respeta el «Máx. por alumno» del catálogo: si ya llegó al tope se DENIEGA sin cobrar y la
 * Nave lo marca como «Ya la tienes» para que ni lo intente.
 * v3.8: avatares SOLO evolutivos (fuera la galería clásica), la URL de imagen propia deja de ser
 * gratis (es la recompensa «Avatar personal») y la BITÁCORA DE MANDO va por SECCIONES: la página 1
 * es la identidad y termina con un selector que salta directo al tema; cada sección envía. Seguro
 * porque registrarEventos_ es append-only y las insignias viven en EVENTOS, no en la respuesta.
 * v3.7: DOS MONEDAS — los XP solo suben (nivel 1-10 y evolución del avatar) y los CRÉDITOS son lo único
 * que se gasta al canjear. NIVELES/CREDITOS/RECOMPENSAS los genera _build_site.py desde _site_data.py.
 * v3.4: 7 personajes evolutivos × 5 rangos (nuevo rango LEYENDA) — la web calcula el rango;
 * aquí solo cambian las opciones del formulario (opcAvatares_).
 * v3.6: ÁLBUM DE 20 CROMOS en 4 series (Tripulación Cero · Los Ecos · La Nave · La Sombra), con
 * rarezas común/rara/épica/LEGENDARIA. El bloque CROMOS lo GENERA web-stargate/_build_site.py
 * desde _site_data.py: no editarlo a mano aquí.
 * v3.5: ECONOMÍA DE RECOMPENSAS AUTOMÁTICAS — personajes 5-7 EXCLUSIVOS (solo por canje), galería
 * clásica retirada de los formularios nuevos (compatibilidad intacta), SOBRE DE CROMOS aleatorio con
 * rarezas (Vaeon legendario), título bajo el alias, marco dorado del avatar, fondo de ficha con tu
 * planeta, y CORONA SEMANAL automática al que más xp ganó en 7 días. Todo sin intervención docente.
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
 * v3.2.2: crear un PER ya no falla si quedaron restos de otro con el mismo nombre («Ya existe una hoja
 * B · id»): las pestañas huérfanas se apartan solas y el limpiador de mantenimiento las borra.
 * v3.2.3: CAUSA RAÍZ de las pestañas zombis — Sheets no deja borrar una hoja vinculada a un formulario.
 * borrarHoja_() desvincula primero (removeDestination) y luego borra; los errores ya no se tragan.
 * v3.3: cada PER tiene su PROPIA CARPETA dentro de «Formularios PER» (sus 3 formularios y su documento
 * de enlaces viven ahí); menú para reorganizar los PER antiguos; el documento de enlaces se expone en la
 * web (panel del profesorado y generador de embeds) y va destacado al crear el PER.
 */

// ================= MENÚ Y HOJAS =================
function onOpen() {
  // v3.17 · el menu solo existe si hay una hoja abierta delante. Al ejecutar onOpen desde el editor
  // (que es como se autoriza el script la primera vez) no hay ventana y getUi() revienta; sin este
  // try, el error se llevaba por delante a asegurarHojas_(), que si tiene que correr siempre.
  try { menuStargate_(); } catch (e) {}
  asegurarHojas_();
}
function menuStargate_() {
  SpreadsheetApp.getUi().createMenu("STARGATE")
    .addItem("Crear nuevo PER...", "abrirDialogoNuevoPER")
    .addItem("Publicar y abrir formularios del PER seleccionado", "publicarFormulariosPER")
    .addItem("Documento de enlaces y embeds del PER seleccionado", "documentoPERSeleccionado")
    .addItem("Dossier del profesorado (TODOS los grupos)", "crearDossierProfesorado")
    .addItem("Enviar el dossier por correo al profesorado", "enviarDossierPorCorreo")
    .addItem("Actualizar formularios (recompensas, avatar, bio)", "actualizarRecompensas")
    .addItem("Guardar panel de control estándar (Genially)", "guardarPanelEstandar")
    .addItem("Abrir la Consola del profesorado (y ponerla al día)", "abrirConsola")
    .addItem("Parte de salud del sistema", "parteDeSalud")
    .addItem("Pestaña ALUMNADO (quién es quién, al día)", "actualizarAlumnado")
    .addItem("Colorear la hoja (un color por grupo y los avisos)", "colorearHoja")
    .addItem("Consolidar DATOS / RESUMEN (investigación)", "consolidarDatos")
    .addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu("Ciclo de vida del PER (fila seleccionada)")
      .addItem("Archivar / desarchivar PER", "archivarPERSeleccionado")
      .addItem("Borrar PER (con sus formularios y datos)", "borrarPERSeleccionado"))
    .addSubMenu(SpreadsheetApp.getUi().createMenu("Mantenimiento")
      .addItem("Reprocesar canjes sin resolver", "reprocesarCanjesSinResolver")
      .addItem("Restaurar catálogo oficial de recompensas", "restaurarRecompensas")
      .addItem("Organizar los formularios en carpetas por PER", "organizarCarpetasPER")
      .addItem("Limpiar restos de PER borrados (formularios y pestañas)", "limpiarRestos")
      .addItem("Actualizar las imágenes de los formularios (planetas y personajes)", "actualizarImagenesPlanetas")
      .addItem("Bonus de la tripulación (umbral y créditos)", "ajustarBonusTripulacion")
      .addItem("Pase de lista en directo (créditos y minutos)", "ajustarPase")
      .addItem("Sembrar alumnado de PRUEBA (PER seleccionado)", "sembrarDemo")
      .addItem("Chincheta de bienvenida en el padlet (PER seleccionado)", "chinchetaPadlet")
      .addItem("Resetear la hoja (borra TODOS los PER)", "resetearHoja"))
    .addSeparator()
    .addItem("Cambiar PIN del profesorado", "cambiarPin")
    .addItem("PIN del profesor referente (acciones de grupo entero)", "cambiarPinReferente")
    .addItem("Guardar URL del web app", "pedirWebAppUrl")
    .addItem("Correo de avisos de reserva", "guardarCorreoAvisos")
    .addItem("Clave API de Padlet (chincheta de bienvenida)", "guardarClavePadlet")
    .addToUi();
}
function hoja_(nombre, cab, color) {
  var ss = SpreadsheetApp.getActive(); var sh = ss.getSheetByName(nombre);
  // v3.12 · si alguien pide una hoja sin darle cabecera y aún no existe, se crea vacía en vez de
  // reventar con appendRow(undefined) — pasaba si una llamada de la API llegaba antes de asegurarHojas_().
  if (!sh) { sh = ss.insertSheet(nombre); if (cab && cab.length) { sh.appendRow(cab); sh.setFrozenRows(1); } if (color) sh.setTabColor(color); }
  return sh;
}
// ================= EL ARCHIVO Y EL ACCESO A LOS REGISTROS =================
// Las cabeceras viven aquí y NO se repiten: las pestañas vivas, sus archivos y quien mueve filas de
// una a otra leen todas de estas dos listas. Un dato, un sitio.
var CAB_EV = ["fecha","per","email","alias","reto_id","reto","tema","xp","origen","evidencia"];
var CAB_AJ = ["fecha","per","email","reto_id","accion","motivo","profe"];
var CAB_ALUMNADO = ["PER","Grupo","Nombre y apellidos","Correo","Alias","Docente","Nivel","Rango","xp",
                    "Créditos","Ganados","Gastados","Insignias","Retos","Canjes","Qué ha canjeado",
                    "Cromos","Héroes","Planeta","Bitácora","Última actividad","Grupo archivado"];

function archivoDe_(nombre) { return nombre === H.AJ || nombre === H.AJA ? H.AJA : H.EVA; }
function vivaDe_(nombre)    { return nombre === H.AJ || nombre === H.AJA ? H.AJ  : H.EV; }
function anchoDe_(nombre) {
  if (nombre === H.EV) return CAB_EV.length;
  if (nombre === H.EVA) return CAB_EV.length + 1;
  if (nombre === H.AJ) return CAB_AJ.length;
  if (nombre === H.AJA) return CAB_AJ.length + 1;
  return 0;
}
// 🔴 LA ÚNICA PUERTA DE LECTURA de EVENTOS y AJUSTES. Mira la pestaña viva Y su archivo, porque un
// PER archivado tiene sus filas mudadas y su tablero histórico —el que abre el enlace directo— se
// quedaría vacío. Quien lea sin pasar por aquí verá medio sistema: lo comprueba la batería 37.
// Escribir, en cambio, va SIEMPRE a la pestaña viva: un grupo archivado tiene los formularios
// cerrados y no recibe nada nuevo.
function registros_(nombre, perId) {
  var out = [], ss = SpreadsheetApp.getActive();
  [vivaDe_(nombre), archivoDe_(nombre)].forEach(function(n){
    var sh = ss.getSheetByName(n); if (!sh || sh.getLastRow() < 2) return;
    sh.getDataRange().getValues().slice(1).forEach(function(v){
      if (!v[0] && !v[1] && !v[2]) return;                  // filas en blanco del final
      if (!perId || String(v[1]) === String(perId)) out.push(v);
    });
  });
  return out;
}
// Todas las pestañas del sistema que guardan datos de PER. «Resetear la hoja» las vacía TODAS, y la
// lista está aquí para que añadir una pestaña nueva y olvidarse de vaciarla no vuelva a pasar.
//
// 🔴 CONSENTIMIENTO NO ESTÁ, Y ES A PROPÓSITO (decisión de Norberto, 29-ago): es el registro de quién
// autorizó que sus datos se usen para investigar. Los grupos van y vienen; la autorización de una
// persona no. Si se borrara, un paper publicado el año que viene se quedaría sin el papel que lo
// respalda — y eso no se puede reconstruir preguntando otra vez. Se conserva, como el catálogo.
function hojasDeDatos_() { return [H.EV, H.AJ, H.EVA, H.AJA, H.DOC, H.ALU, H.DATOS, H.RES]; }
// Lo que el reseteo NO toca, con su motivo. Se usa para explicarlo en el aviso y lo comprueba el banco.
function hojasQueSobreviven_() { return [H.PERS, H.REC, H.CONS]; }
function vaciarHoja_(nombre) {
  var sh = SpreadsheetApp.getActive().getSheetByName(nombre); if (!sh) return 0;
  var filas = sh.getLastRow() - 1; if (filas < 1) return 0;
  sh.getRange(2, 1, filas, Math.max(sh.getLastColumn(), 1)).clearContent();
  return filas;
}
function asegurarHojas_() {
  hoja_(H.PERS, ["id","PER","Tipo","Profesorado","Inicio (semana 1)","Apertura","Cierre","Estado",
                 "Bitácora (alumnado)","Bitácora (editar)","Ticket (alumnado)","Canje (alumnado)","Pestaña B","Pestaña T","Pestaña C","Creado","Referente","Ticket (editar)"], "#37e0ec");
  var rec = hoja_(H.REC, ["Recompensa","Coste (créditos)","Máx. por alumno","Descripción","Disponible desde (semana)","Tipo"], "#f5b043");
  if (rec.getLastRow() < 2) rec.getRange(2,1,RECOMPENSAS_INICIALES.length,6).setValues(RECOMPENSAS_INICIALES);
  else migrarRecompensas_(rec);
  hoja_(H.EV, CAB_EV, "#aa66cc");
  hoja_(H.AJ, CAB_AJ, "#aa66cc");
  // v3.36 · EL ARCHIVO. Archivar un PER MUEVE sus registros aquí: EVENTOS y AJUSTES se quedan con
  // los grupos vivos —que es lo que se lee cien veces al día— y el histórico sigue entero. Las dos
  // llevan una columna de más, «archivado», con el día en que se mudó cada fila.
  hoja_(H.EVA, CAB_EV.concat(["archivado"]), "#6b4f8a");
  hoja_(H.AJA, CAB_AJ.concat(["archivado"]), "#6b4f8a");
  // v3.36 · ALUMNADO · la foto operativa de las personas, con nombre y correo. Se rehace entera al
  // pedirla (menú) y de madrugada: NO se escribe a mano, que se pierde al refrescar.
  hoja_(H.ALU, CAB_ALUMNADO, "#37e0ec");
  // v3.11 · equipo docente CON CORREO: es a quien se avisa cuando un canje pide su intervención,
  // y lo que permite filtrar cada grupo por docente. Se puede editar a mano en esta pestaña.
  // rol: "referente", "imparte" o "referente+imparte" (el referente puede dar clase también)
  // v3.28 · «panel»: el Genially propio de ese docente. Algunos retocan el panel para SUS alumnos,
  // asi que manda sobre el del PER. Vacio = usa el del PER (y ese, si esta vacio, el estandar).
  var doc = hoja_(H.DOC, ["per","nombre","correo","rol","panel"], "#0e7f8c");
  if (String(doc.getRange(1,5).getValue()||"") !== "panel") doc.getRange(1,5).setValue("panel");
  // 🔬 v3.23 · quién autoriza que sus datos se usen para investigar. NO se pregunta dentro del juego
  // y NO condiciona nada: quien no consiente juega igual, solo se queda fuera de las exportaciones.
  // Mientras esta pestaña esté VACÍA, DATOS y RESUMEN salen completos, como hasta ahora.
  hoja_(H.CONS, ["email","consiente (SI/NO)","fecha","nota"], "#8a97a0");
  var pers = hoja_(H.PERS);
  if (String(pers.getRange(1,20).getValue()||"") !== "Panel Genially (ver)")
    pers.getRange(1,19,1,4).setValues([["Documento de enlaces","Panel Genially (ver)","Panel Genially (editar)","Archivado"]]);
  if (String(pers.getRange(1,22).getValue()||"") !== "Archivado") pers.getRange(1,22).setValue("Archivado");
  if (String(pers.getRange(1,23).getValue()||"") !== "Canje (editar)") pers.getRange(1,23).setValue("Canje (editar)");
  // v3.14 · el canje cierra una semana después que el registro de misiones: necesita su propia fecha
  if (String(pers.getRange(1,24).getValue()||"") !== "Cierre del canje") pers.getRange(1,24).setValue("Cierre del canje");
  // v3.38 · el padlet de la clase: se pregunta al crear el PER y se puede editar aquí a mano
  if (String(pers.getRange(1,25).getValue()||"") !== "Padlet") pers.getRange(1,25).setValue("Padlet");
}
// panel de control Genially estándar (compartido por todos los PER salvo override en su fila)
// v3.30 · Viene de fábrica: el Genially oficial del máster. Antes había que acordarse de guardarlo a
// mano y, si nadie lo hacía, los PER nacían sin panel. El referente puede sustituirlo cuando quiera
// (menú STARGATE → Guardar panel de control estándar), y un PER concreto puede llevar el suyo.
var PANEL_OFICIAL_VER  = "https://view.genially.com/6a8bfc4f5068ad5903fc39e3";
var PANEL_OFICIAL_EDIT = "https://app.genially.com/editor/6a8bfc4f5068ad5903fc39e3";
function panelStd_() { var pr = PropertiesService.getScriptProperties();
  return { ver: pr.getProperty("PANEL_STD_VER") || PANEL_OFICIAL_VER,
           editar: pr.getProperty("PANEL_STD_EDIT") || PANEL_OFICIAL_EDIT }; }
function guardarPanelEstandar() {
  var ui = SpreadsheetApp.getUi(); var pr = PropertiesService.getScriptProperties();
  var r1 = ui.prompt("Panel de control estándar", "Enlace de VISUALIZACIÓN del Genially (view.genially.com/…).\n\nAhora mismo: " +
    panelStd_().ver + "\n\nDéjalo VACÍO para volver al panel oficial del máster.", ui.ButtonSet.OK_CANCEL);
  if (r1.getSelectedButton() !== ui.Button.OK) return; pr.setProperty("PANEL_STD_VER", r1.getResponseText().trim());
  var r2 = ui.prompt("Panel de control estándar", "Enlace de EDICIÓN del Genially (app.genially.com/editor/…).\n\nAhora mismo: " +
    panelStd_().editar + "\n\nDéjalo VACÍO para volver al panel oficial del máster.", ui.ButtonSet.OK_CANCEL);
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
// v3.15 · RACHA. Semanas CONSECUTIVAS del PER con al menos un evento, contando hacia atras desde
// la semana en curso. Se usa la semana del PER, no la ISO del calendario: la racha habla el idioma
// del curso. Y si esta semana todavia no ha registrado nada, se cuenta desde la anterior — a nadie
// se le rompe la racha un lunes por la manana.
function semanaDeFecha_(o, fecha) {
  if (!o.inicio) return null;
  var ini = new Date(o.inicio + "T00:00:00"); var d;
  try { d = new Date(fecha); } catch (e) { return null; }
  if (!d || isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - ini.getTime()) / 6048e5) + 1;
}
function racha_(o, eventos) {
  var sem = semanaDe_(o); if (sem === null || !eventos || !eventos.length) return 0;
  var con = {};
  eventos.forEach(function(ev){ var w = semanaDeFecha_(o, ev.fecha); if (w !== null && w >= 1) con[w] = true; });
  var w2 = con[sem] ? sem : sem - 1, n = 0;
  while (w2 >= 1 && con[w2]) { n++; w2--; }
  return n;
}
function semanasDe_(tipo) { return SEMANAS_PER[tipo === "PUA" ? "PUA" : "REGULAR"] || 15; }
function desdeEfectiva_(desde, tipo) { desde = Number(desde) || 0; if (!desde) return 0;
  return tipo === "PUA" ? Math.max(1, Math.round(desde * semanasDe_("PUA") / semanasDe_("REGULAR"))) : desde; }
// v3.14 · El calendario por defecto de un PER, calculado desde la fecha de la semana 1.
// v3.30 · Ya no se pregunta nada de esto al crear el PER: la fecha de la semana 1 lo decide todo.
// Los formularios abren EL PRIMER DÍA de la semana 1, el registro de misiones y el ticket cierran al
// ACABAR la última semana, y el CANJE aguanta UNA SEMANA MÁS: se reclama lo ganado cuando ya no se
// puede ganar nada. (DIAS_APERTURA_ANTES vive en Datos.gs y hoy vale 0.)
function fechasPER_(inicio, tipo) {
  if (!inicio) return null;
  var ini = new Date(String(inicio) + "T00:00:00");
  if (isNaN(ini.getTime())) return null;
  var n = semanasDe_(tipo);
  function mas(dias) { var d = new Date(ini.getTime()); d.setDate(d.getDate() + dias); return fechaIso_(d); }
  return { semanas: n,
           apertura: mas(-DIAS_APERTURA_ANTES),
           cierreMisiones: mas(n * 7 - 1),                              // último día de la semana n
           cierreCanje: mas((n + SEMANAS_CANJE_EXTRA) * 7 - 1) };       // una semana más para canjear
}
// Suma días a una fecha ISO (para cuando el cierre se pone a mano y el canje sigue yendo detrás)
function masDias_(iso, dias) {
  if (!iso) return "";
  var d = new Date(String(iso) + "T00:00:00"); if (isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + dias); return fechaIso_(d);
}
// Carpeta donde viven los formularios de los PER
function carpetaPER_() {
  var ss = SpreadsheetApp.getActive(); var padres = DriveApp.getFileById(ss.getId()).getParents();
  var raiz = padres.hasNext() ? padres.next() : DriveApp.getRootFolder();
  var subs = raiz.getFoldersByName("Formularios PER");
  return subs.hasNext() ? subs.next() : raiz;
}
// Carpeta propia de cada PER dentro de «Formularios PER»: ahí viven sus 3 formularios y su documento.
function carpetaDelPER_(nombre, crear) {
  var raiz = carpetaPER_(); var it = raiz.getFoldersByName(nombre);
  if (it.hasNext()) return it.next();
  return crear ? raiz.createFolder(nombre) : raiz;
}
// Devuelve el Form EDITABLE de un PER ("B"Bitácora · "T"Ticket · "C"Canje).
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
           formCanjeEdit:String(v[22]||""), cierreCanje: v[23] ? fechaIso_(v[23]) : "",
           padlet:String(v[24]||"").trim() };
}
function fechaIso_(d) { if (!d) return ""; if (d instanceof Date) return Utilities.formatDate(d, "Europe/Madrid", "yyyy-MM-dd"); return String(d); }

// ================= CREAR PER =================
function abrirDialogoNuevoPER() {
  var html = HtmlService.createHtmlOutputFromFile("Dialog").setWidth(540).setHeight(680);
  SpreadsheetApp.getUi().showModalDialog(html, "Crear nuevo PER");
}
// 🔴 26-ago · LAS PLANTILLAS SON DE mutecdgami Y ESTÁN COMPARTIDAS. getFilesByName recorre el Drive
// de QUIEN EJECUTA, y ahí no aparecen: el script no las encontraba, se iba al FormApp.create() de
// abajo y creaba los formularios EN BLANCO —sin color ni cabecera— sin decir una palabra. Por eso
// «los formularios no siguen la plantilla». Se buscan DENTRO de su carpeta, por id.
var PLANTILLAS_ID = "1lOdziIkLr70YQ2JyCmw3vteAOAF37aQH";
function carpetaPlantillas_() {
  var id = PropertiesService.getScriptProperties().getProperty("PLANTILLAS_ID") || PLANTILLAS_ID;
  try { return DriveApp.getFolderById(id); } catch (e) { Logger.log("carpetaPlantillas_: " + e); return null; }
}
function plantilla_(nombre) {
  var carpeta = carpetaPlantillas_();
  if (carpeta) {
    var ic = carpeta.getFilesByName(nombre);
    while (ic.hasNext()) { var fc = ic.next(); if (fc.getMimeType() === MimeType.GOOGLE_FORMS) return fc; }
  }
  var it = DriveApp.getFilesByName(nombre);   // por si algún día están en el Drive de quien ejecuta
  while (it.hasNext()) { var f = it.next(); if (f.getMimeType() === MimeType.GOOGLE_FORMS) return f; }
  return null;
}
var _SIN_PLANTILLA = [];
function formDesdePlantilla_(plantillaNombre, titulo, carpeta) {
  var pl = plantilla_(plantillaNombre); var form;
  if (pl) { var copia = pl.makeCopy(titulo, carpeta); form = FormApp.openById(copia.getId());
            form.getItems().forEach(function(i){ form.deleteItem(i); }); }
  else {
    // Degradar en silencio es lo que escondió el fallo durante semanas: el PER se creaba "bien" y
    // los formularios salían sin estética. Ahora queda anotado y crearPER lo devuelve.
    Logger.log("formDesdePlantilla_: NO encuentro la plantilla «" + plantillaNombre + "»");
    _SIN_PLANTILLA.push(plantillaNombre);
    form = FormApp.create(titulo); DriveApp.getFileById(form.getId()).moveTo(carpeta);
  }
  form.setTitle(titulo);
  return form;
}
function imagen_(form, tema, texto) {
  try { var blob = UrlFetchApp.fetch(sinCache_(WEB + "assets/img/planetas/" + TEMAS[tema][2] + ".png")).getBlob();
        form.addImageItem().setImage(blob).setTitle(texto).setAlignment(FormApp.Alignment.CENTER).setWidth(160); } catch (e) {}
}
// v3.13 · Pone el orbe de cada planeta justo debajo de su salto de página. Se llama DESPUÉS de
// crear el PER (o desde la continuación), nunca dentro del camino crítico. Idempotente: si la
// imagen ya está, no la repite.
// v3.14 · El orbe de cada planeta, guardado en Drive la primera vez. VISTO EN VIVO: la web devolvió
// 504 y cada descarga tardaba 12 s en fallar; ocho de esas se comen la ejecución entera. Con la copia
// en Drive, a partir del segundo PER no se toca internet. Si el arte cambia, actualizarImagenesPlanetas
// borra la copia y la vuelve a bajar.
// Baja una imagen de la web y deja la copia en la carpeta del PER. La copia NO es un lujo: visto en
// vivo, la web devolvió 504 y cada descarga tardaba 12 s en fallar; ocho de esas se comen la
// ejecución entera. Lo usan los orbes de los planetas, las recompensas del canje y las escenas de
// sección: una sola lógica de descarga y caché, no una por sitio.
function blobDeLaWeb_(rutaWeb, nombreCache) {
  var carpeta = null;
  try { carpeta = carpetaPER_(); } catch (e) {}
  if (carpeta) { var it = carpeta.getFilesByName(nombreCache); if (it.hasNext()) { try { return it.next().getBlob(); } catch (e2) {} } }
  var r = UrlFetchApp.fetch(sinCache_(WEB + rutaWeb), { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error("la web respondió " + r.getResponseCode());
  var blob = r.getBlob().setName(nombreCache);
  if (carpeta) { try { carpeta.createFile(blob); } catch (e3) {} }
  return blob;
}
function orbeBlob_(tema) {
  return blobDeLaWeb_("assets/img/planetas/" + TEMAS[tema][2] + ".png", "orbe_" + TEMAS[tema][2] + ".png");
}
function imgCanjeBlob_(archivo) { return blobDeLaWeb_("assets/img/canje/" + archivo, "canje_" + archivo); }
function imgSeccionBlob_(archivo) { return blobDeLaWeb_("assets/img/forms/" + archivo, archivo); }
function borrarOrbesCache_() {
  var n = 0;
  try { var carpeta = carpetaPER_();
    for (var t = 1; t <= 8; t++) { var it = carpeta.getFilesByName("orbe_" + TEMAS[t][2] + ".png");
      while (it.hasNext()) { try { it.next().setTrashed(true); n++; } catch (e) {} } } } catch (e2) {}
  return n;
}
// Coloca el orbe justo debajo de su salto de página. Idempotente. Devuelve cuántos faltan por poner:
// si la web no responde se para a las 2 seguidas (no tiene sentido esperar 8 veces 12 segundos) y deja
// el resto pendiente para la continuación.
// v3.37 · el orbe pasa de 160 a ANCHO_ORBE px. Norberto: «podrías poner la imagen de los planetas más
// grandes, están muy pequeños». A 160 px era un icono; el formulario da 640 de ancho.
var ANCHO_ORBE = 460;
function imagenesBitacora_(fb) {
  var puestas = {};
  fb.getItems(FormApp.ItemType.IMAGE).forEach(function(i){ puestas[i.getTitle()] = i; });
  var n = 0, faltan = 0, seguidos = 0, agrandadas = 0;
  for (var t = 1; t <= 8; t++) {
    // la que ya está solo necesita crecer: ni se descarga ni se vuelve a subir
    if (puestas[TEMAS[t][0]]) {
      try { puestas[TEMAS[t][0]].setWidth(ANCHO_ORBE).setAlignment(FormApp.Alignment.CENTER); agrandadas++; } catch (e) {}
      continue;
    }
    var pb = fb.getItems(FormApp.ItemType.PAGE_BREAK).filter(function(p){ return temaDePagina_(p.getTitle()) === t; })[0];
    if (!pb) continue;
    if (seguidos >= 2) { faltan++; continue; }        // la web está caída: no insistas ocho veces
    try {
      var it2 = fb.addImageItem().setImage(orbeBlob_(t)).setTitle(TEMAS[t][0]).setAlignment(FormApp.Alignment.CENTER).setWidth(ANCHO_ORBE);
      fb.moveItem(it2.getIndex(), pb.getIndex() + 1);
      n++; seguidos = 0;
    } catch (e) { Logger.log("imagenesBitacora_ tema " + t + ": " + e); faltan++; seguidos++; }
  }
  return { puestos: n, faltan: faltan, agrandadas: agrandadas };
}
// La imagen de cada recompensa, justo debajo de su pagina. Mismo patron que los orbes: idempotente,
// fuera del camino critico de crearPER y con freno si la web no responde (no tiene sentido esperar
// diez veces doce segundos). Devuelve cuantas faltan para que la continuacion las remate.
var ANCHO_CANJE = 560;
function imagenesCanje_(fc) {
  var puestas = {};
  fc.getItems(FormApp.ItemType.IMAGE).forEach(function(i){ puestas[i.getTitle()] = i; });
  var cat = recompensasCat_(), n = 0, faltan = 0, seguidos = 0;
  for (var k = 0; k < cat.length; k++) {
    var x = cat[k], archivo = IMG_RECOMPENSA[x.nombre];
    // Sin imagen catalogada —p. ej. el profesorado renombro la recompensa en la hoja— la seccion se
    // queda sin foto, pero el canje sigue funcionando. Nunca se rompe por una imagen.
    if (!archivo) continue;
    if (puestas[x.nombre]) {
      try { puestas[x.nombre].setWidth(ANCHO_CANJE).setAlignment(FormApp.Alignment.CENTER); } catch (e) {}
      continue;
    }
    var etiqueta = etiquetaRecompensa_(x);
    var pb = fc.getItems(FormApp.ItemType.PAGE_BREAK).filter(function(p){ return p.getTitle() === etiqueta; })[0];
    if (!pb) continue;
    if (seguidos >= 2) { faltan++; continue; }
    try {
      var it = fc.addImageItem().setImage(imgCanjeBlob_(archivo)).setTitle(x.nombre)
                 .setAlignment(FormApp.Alignment.CENTER).setWidth(ANCHO_CANJE);
      fc.moveItem(it.getIndex(), pb.getIndex() + 1);
      n++; seguidos = 0;
    } catch (e) { Logger.log("imagenesCanje_ «" + x.nombre + "»: " + e); faltan++; seguidos++; }
  }
  return { puestos: n, faltan: faltan };
}
// Las escenas de seccion: el Capitan y NEBULA presentan cada tramo. Son los MISMOS recortes que el
// alumnado ve en la web y en los videos, asi que el formulario deja de parecer un tramite suelto y
// pasa a ser parte del relato. Idempotente por titulo, igual que las demas.
function escenaSeccion_(form, archivo, titulo, tituloPagina, ancho) {
  var ya = form.getItems(FormApp.ItemType.IMAGE).filter(function(i){ return i.getTitle() === titulo; })[0];
  if (ya) { try { ya.setWidth(ancho || 640).setAlignment(FormApp.Alignment.CENTER); } catch (e) {} return 0; }
  try {
    var it = form.addImageItem().setImage(imgSeccionBlob_(archivo)).setTitle(titulo)
               .setAlignment(FormApp.Alignment.CENTER).setWidth(ancho || 640);
    if (tituloPagina) {
      var pb = form.getItems(FormApp.ItemType.PAGE_BREAK).filter(function(p){ return p.getTitle() === tituloPagina; })[0];
      if (pb) form.moveItem(it.getIndex(), pb.getIndex() + 1);
      else form.moveItem(it.getIndex(), 0);
    } else form.moveItem(it.getIndex(), 0);
    return 1;
  } catch (e) { Logger.log("escenaSeccion_ «" + titulo + "»: " + e); return -1; }
}
// TODAS las imagenes de los tres formularios en una sola puerta: los orbes de los planetas, las
// escenas del Capitan y NEBULA, y la foto de cada recompensa del canje. Se llama fuera del camino
// critico —al final de crearPER si sobra tiempo, y si no desde la continuacion—, porque son ~30
// descargas y son justo lo que hacia que la creacion se comiera los 6 minutos.
function imagenesFormularios_(fb, ft, fc) {
  var puestos = 0, faltan = 0;
  if (fb) {
    try { var b = imagenesBitacora_(fb); puestos += b.puestos; faltan += b.faltan; }
    catch (e) { Logger.log("imagenesFormularios_ orbes: " + e); faltan++; }
    // 🔴 El titulo de la ESCENA no puede ser el de la seccion que ilustra. Se probó y salió mal: la
    // imagen de la portada se llamaba igual que la cabecera «CÓMO FUNCIONA ESTA BITÁCORA», y a partir
    // de ahí cualquier busqueda por titulo encontraba la foto en vez del texto — la ayuda del
    // formulario se quedaba vacia sin que nadie lo viera. Titulo propio para cada escena.
    [[ "sec_portada.jpg", TIT_ESCENA_PORTADA, null ],
     [ "sec_alistamiento.jpg", TIT_ESCENA_ALTA, TIT_PAG_ALTA ],
     [ "sec_planeta.jpg", TIT_ESCENA_PLANETA, TIT_PAG_PLANETA ]].forEach(function(e){
      var r = escenaSeccion_(fb, e[0], e[1], e[2]); if (r > 0) puestos++; else if (r < 0) faltan++;
    });
  }
  if (ft) { var r1 = escenaSeccion_(ft, "sec_ticket.jpg", TIT_ESCENA_TICKET, null); if (r1 > 0) puestos++; else if (r1 < 0) faltan++; }
  if (fc) {
    var r2 = escenaSeccion_(fc, "sec_canje.jpg", TIT_ESCENA_CANJE, null); if (r2 > 0) puestos++; else if (r2 < 0) faltan++;
    try { var c = imagenesCanje_(fc); puestos += c.puestos; faltan += c.faltan; }
    catch (e) { Logger.log("imagenesFormularios_ canje: " + e); faltan++; }
  }
  return { puestos: puestos, faltan: faltan };
}
var TIT_ESCENA_PORTADA = "Bienvenido a bordo";
var TIT_ESCENA_ALTA = "Quién eres a bordo";
var TIT_ESCENA_PLANETA = "Elige el planeta";
var TIT_ESCENA_TICKET = "NEBULA te escucha";
var TIT_ESCENA_CANJE = "Cambia tus créditos por ventajas";
function publicar_(form) { try { if (form.setPublished) form.setPublished(true); } catch (e) { Logger.log("setPublished: " + e); } }
function publicarFormulariosPER() {
  var sh = hoja_(H.PERS); var fila = SpreadsheetApp.getActiveRange().getRow();
  if (SpreadsheetApp.getActiveSheet().getName() !== H.PERS || fila < 2) { SpreadsheetApp.getUi().alert("Selecciona una fila de la pestaña PERs."); return; }
  var o = perObj_(sh.getRange(fila, 1, 1, 25).getValues()[0]); var n = 0;
  formsDelPER_(o).forEach(function(f){ try { publicar_(f); f.setAcceptingResponses(true); n++; } catch (e) {} });
  sh.getRange(fila, 8).setValue("Abierto");
  SpreadsheetApp.getUi().alert("Publicados y abiertos " + n + " formularios de " + o.nombre + ".");
}
// Borra una pestaña de respuestas. Sheets NO permite eliminar una hoja vinculada a un formulario:
// hay que desvincularla antes (removeDestination). Devuelve "" si va bien o el motivo del fallo.
function borrarHoja_(ss, sh) {
  if (!sh) return "ya no existe";
  try {
    var url = ""; try { url = sh.getFormUrl() || ""; } catch (e) {}
    if (url) { try { FormApp.openByUrl(url).removeDestination(); SpreadsheetApp.flush(); }
               catch (e) { /* si el form ya no existe, la hoja suele quedar libre igual */ } }
    if (ss.getSheets().length < 2) return "es la única hoja del libro";
    ss.deleteSheet(sh); return "";
  } catch (e) { return e.message; }
}
function nombreLibre_(base) {
  var ss = SpreadsheetApp.getActive(); if (!ss.getSheetByName(base)) return base;
  for (var i = 2; i < 100; i++) if (!ss.getSheetByName(base + " (" + i + ")")) return base + " (" + i + ")";
  return base + " (" + new Date().getTime() + ")";
}
function pestanaDe_(form, nombreNuevo, color) {
  SpreadsheetApp.flush(); var tab = null;
  SpreadsheetApp.getActive().getSheets().forEach(function(h){ try { var u = h.getFormUrl(); if (u && u.indexOf(form.getId()) >= 0) tab = h; } catch (e) {} });
  if (tab) { try { tab.setName(nombreNuevo); } catch (e) { tab.setName(nombreLibre_(nombreNuevo)); } tab.setTabColor(color); }
  return tab ? tab.getName() : "";
}
// Aparta las pestañas que quedaron de un PER anterior con el mismo id (borrado a mano o con una versión
// antigua). No se borran: se renombran para no perder respuestas; el menú Mantenimiento las limpia.
function apartarRestosDe_(id) {
  var ss = SpreadsheetApp.getActive(); var n = 0;
  ["B", "T", "C"].forEach(function(p){ var sh = ss.getSheetByName(p + " · " + id);
    if (sh) { try { sh.setName(nombreLibre_("restos · " + p + " · " + id)); sh.setTabColor("#9fb2c2"); sh.showSheet(); n++; } catch (e) {} } });
  return n;
}

// v3.13 · VISTO EN PRODUCCIÓN (25-ago): al crear un PER, Google falló al vincular el SEGUNDO
// formulario a la hoja con «Failed to set response destination». No es un error de datos: la hoja
// está ocupada creando la pestaña del formulario anterior. Reintentando con una pausa entra.
// Es idempotente: si el formulario ya quedó vinculado, no vuelve a intentarlo (eso duplicaría pestañas).
function vincular_(form, ssId) {
  var ultimo = "";
  for (var i = 0; i < 4; i++) {
    try { if (form.getDestinationId() === ssId) return true; } catch (e0) {}
    try {
      form.setDestination(FormApp.DestinationType.SPREADSHEET, ssId);
      SpreadsheetApp.flush();
      return true;
    } catch (e) {
      ultimo = e.message || String(e);
      Logger.log("vincular_ intento " + (i + 1) + " de «" + form.getTitle() + "»: " + ultimo);
      Utilities.sleep(1000 * Math.pow(2, i));   // 1 s, 2 s, 4 s
    }
  }
  try { if (form.getDestinationId() === ssId) return true; } catch (e2) {}
  throw new Error("No se ha podido vincular «" + form.getTitle() + "» con la hoja tras 4 intentos. " +
    "Último error de Google: " + ultimo + ". Suele ser pasajero: vuelve a crear el PER en un minuto.");
}

// 🔴 26-ago · QUIÉN EJECUTA IMPORTA. El script está VINCULADO a la hoja pero corre como quien pulsa
// el menú, y todo lo que crea (los 3 formularios, la carpeta, el documento, la Consola, el dossier)
// queda a nombre de esa persona. Creando los PER desde una cuenta personal, la universidad se
// quedaba sin nada suyo — y entre cuentas de gmail la propiedad no se transfiere sin que el
// destinatario acepte. Se saca sin pedir permisos OAuth nuevos: el dueño de la raíz del Drive de
// quien ejecuta ES quien ejecuta (Session.getActiveUser pediría un permiso más y obligaría a todo
// el mundo a volver a autorizar).
function ejecutaComo_() {
  try { return String(DriveApp.getRootFolder().getOwner().getEmail() || "").toLowerCase(); } catch (e) { return ""; }
}
function duenoDeLaHoja_() {
  try { return String(SpreadsheetApp.getActive().getOwner().getEmail() || "").toLowerCase(); } catch (e) { return ""; }
}
function crearPER(datos) {
  var _t = reloj_();
  _SIN_PLANTILLA = [];
  var _yo = ejecutaComo_(), _dueno = duenoDeLaHoja_();
  if (_yo && _dueno && _yo !== _dueno) {
    throw new Error("Este PER lo estás creando con la cuenta " + _yo + ", y la hoja es de " + _dueno +
      ". Todo lo que se cree (los 3 formularios, la carpeta de Drive, el documento de enlaces y el " +
      "dossier) quedaría en propiedad de " + _yo + " y NO de la universidad, y después no se puede " +
      "transferir sin que el destinatario acepte uno a uno.\n\nEntra con " + _dueno + " y vuelve a crearlo.");
  }
  var nombre = (datos.nombre || "").trim(); if (!nombre) throw new Error("Falta el nombre del PER");
  var tipo = datos.tipo === "PUA" ? "PUA" : "REGULAR";
  var id = slug_(nombre); if (perFila_(id)) throw new Error("Ya existe un PER con id «" + id + "». Si es uno viejo, archívalo o bórralo antes (menú STARGATE), o usa otro nombre.");
  var restos = apartarRestosDe_(id);
  // v3.14 · calendario por defecto: si no se indican fechas se calculan solas desde la semana 1.
  var fx = fechasPER_(datos.inicio, tipo);
  var aperturaIso = String(datos.apertura || "").trim() || (fx ? fx.apertura : "");
  var cierreIso   = String(datos.cierre   || "").trim() || (fx ? fx.cierreMisiones : "");
  // el canje siempre va una semana por detrás del cierre de misiones, se ponga a mano o no
  var cierreCanjeIso = String(datos.cierreCanje || "").trim() ||
        (datos.cierre ? masDias_(datos.cierre, 7 * SEMANAS_CANJE_EXTRA) : (fx ? fx.cierreCanje : ""));
  var apertura = aperturaIso ? new Date(aperturaIso + "T00:00:00") : null;
  var cierre = cierreIso ? new Date(cierreIso + "T23:59:00") : null;
  var cierreCanje = cierreCanjeIso ? new Date(cierreCanjeIso + "T23:59:00") : null;
  var inicio = datos.inicio ? new Date(datos.inicio + "T00:00:00") : null;
  var ss = SpreadsheetApp.getActive();
  var master = DriveApp.getFileById(ss.getId()); var padres = master.getParents();
  var raiz = padres.hasNext() ? padres.next() : DriveApp.getRootFolder();
  var subs = raiz.getFoldersByName("Formularios PER"); var padre = subs.hasNext() ? subs.next() : raiz.createFolder("Formularios PER");
  var carpeta = padre.createFolder(nombre);   // v3.3: cada PER en su propia carpeta
  var retos = retosDe_(tipo);
  guardarDocentes_(id, datos.docentes);   // v3.11 · el equipo docente, con correo
  // v3.13 · si algo se cae a mitad (p. ej. Google no deja vincular un formulario), lo creado hasta
  // ese momento se deshace: formularios y carpeta a la papelera y pestañas de respuestas borradas.
  // Antes quedaba basura invisible —formularios sueltos y una «Respuestas de formulario N»— que
  // ni siquiera limpiarRestos veía, porque la pestaña aún no se había renombrado a «B · id».
  var _creados = [], _tabsAntes = {};
  SpreadsheetApp.getActive().getSheets().forEach(function(h){ _tabsAntes[h.getName()] = true; });
  function _deshacer(e) {
    _creados.forEach(function(f){ try { DriveApp.getFileById(f.getId()).setTrashed(true); } catch (e2) {} });
    var ssX = SpreadsheetApp.getActive();
    ssX.getSheets().forEach(function(h){ if (!_tabsAntes[h.getName()]) { try { borrarHoja_(ssX, h); } catch (e3) {} } });
    try { carpeta.setTrashed(true); } catch (e4) {}
    try { guardarDocentes_(id, []); } catch (e5) {}
    throw e;
  }

  // ---- 1 · Bitácora de mando (Google login, 1 respuesta editable) ----
  // El texto vive en textoBitacora_/confirmacionBitacora_ (más abajo): lo usan tanto esto como
  // reestructurarBitacora_, que es quien pone al día los grupos que ya existen.
  var fb = formDesdePlantilla_("PLANTILLA · Bitácora de mando", "STARGATE · " + nombre + " · Bitácora de mando", carpeta);
  fb.setDescription(textoBitacora_(datos.profesores));
  // 🔴 27-ago · UNA RESPUESTA POR PERSONA, EDITABLE. Se probó lo contrario y salió mal: al terminar,
  // Google ofrecía «Modificar tu respuesta» Y «Enviar otra respuesta», y el segundo botón hace
  // rellenar el formulario DESDE CERO. Con un grupo entero eso son alias distintos, avatares
  // distintos y reclutas duplicados — y el sistema se identifica por correo.
  //
  // El motivo por el que se había quitado el límite (26-ago) era que Google enseña «Solo puedes
  // rellenar este formulario una vez», que asusta en un formulario pensado para volver. Se asume:
  // editar SIGUE funcionando (setAllowResponseEdits) y la descripción y el mensaje final lo dicen
  // con todas las letras. Un mensaje confuso se explica en clase; treinta reclutas duplicados, no.
  //
  // Y no se pierde nada al guardar una sola respuesta: la marca temporal del formulario NO la usa
  // nadie. Cada evento se guarda en EVENTOS con su propia fecha (ver registrarEventos_).
  fb.setCollectEmail(true).setLimitOneResponsePerUser(true).setAllowResponseEdits(true).setShowLinkToRespondAgain(false)
    .setConfirmationMessage(confirmacionBitacora_(id));
  // ---- PÁGINA 1 · la portada: qué vienes a hacer hoy ----
  fb.addSectionHeaderItem().setTitle(TIT_INTRO).setHelpText(AYUDA_INTRO);
  var hoy = fb.addListItem().setTitle(TIT_HOY).setHelpText(AYUDA_HOY).setRequired(true);

  // ---- PÁGINA 2 · el alistamiento (lo que antes era la página 1) ----
  var pbAlta = fb.addPageBreakItem().setTitle(TIT_PAG_ALTA).setHelpText(AYUDA_PAG_ALTA);
  identidadBitacora_(fb, datos, id);
  var tras = fb.addListItem().setTitle(TIT_TRAS_ALTA).setRequired(true);

  // ---- PÁGINA 3 · elige el planeta ----
  var pbPl = fb.addPageBreakItem().setTitle(TIT_PAG_PLANETA).setHelpText(AYUDA_PAG_PLANETA);
  var sel = fb.addListItem().setTitle(TIT_PLANETA).setHelpText(AYUDA_PLANETA).setRequired(true);

  // ---- UNA PÁGINA POR PLANETA, y dentro UN BLOQUE POR RETO ----
  var destinos = [];
  var porTema = {}; retos.forEach(function(r){ (porTema[r[4]] = porTema[r[4]] || []).push(r); });
  Object.keys(porTema).sort(function(a,b){ return a-b; }).forEach(function(t){
    t = Number(t);
    // v3.13 · el orbe del planeta NO se pone aquí: son 8 descargas + 8 subidas y es lo que empujaba
    // crearPER contra los 6 minutos de Apps Script. Lo hace imagenesBitacora_() después.
    var pb = fb.addPageBreakItem().setTitle(tituloPlaneta_(t))
      .setHelpText(t >= 1 && t <= 8 ? TEMAS[t][1] : "Solo cuando hayas hecho el examen.");
    pb.setGoToPage(FormApp.PageNavigationType.SUBMIT);      // al terminar una sección, se envía
    destinos.push([t, pb]);
    retosDelPlaneta_(fb, porTema[t], datos.padlet);
  });

  // los tres desplegables se rellenan al final, cuando ya existen todas las páginas a las que llevan
  hoy.setChoices([hoy.createChoice(OPC_ALTA, pbAlta), hoy.createChoice(OPC_RETOS, pbPl)]);
  tras.setChoices([tras.createChoice(OPC_SOLO_ALTA, FormApp.PageNavigationType.SUBMIT),
                   tras.createChoice(OPC_SIGO, pbPl)]);
  sel.setChoices(destinos.map(function(d){ return sel.createChoice(tituloPlaneta_(d[0]), d[1]); }));
  // por si alguien llega al final de una de estas dos páginas sin contestar el desplegable
  pbAlta.setGoToPage(FormApp.PageNavigationType.SUBMIT);
  pbPl.setGoToPage(FormApp.PageNavigationType.SUBMIT);
  ayudaCorreo_(fb);
  publicar_(fb);
  _creados.push(fb);
  try { vincular_(fb, ss.getId()); } catch (e) { _deshacer(e); }
  var tabB = pestanaDe_(fb, "B · " + id, "#37e0ec");
  _t.hito("formulario de Bitacora");

  // ---- 2 · Ticket de salida «Contacta con NEBULA» (anónimo, ramificado) ----
  var ft = formDesdePlantilla_("PLANTILLA · Ticket de salida", "STARGATE · " + nombre + " · Contacta con NEBULA (ticket de salida)", carpeta);
  construirTicket_(ft, datos.referente || "", datos.profesores || "", id);
  publicar_(ft);
  _creados.push(ft);
  try { vincular_(ft, ss.getId()); } catch (e) { _deshacer(e); }
  var tabT = pestanaDe_(ft, "T · " + id, "#9fb2c2");
  _t.hito("formulario de Ticket");

  // ---- 3 · Canje de recompensas (Google login) ----
  var fc = formDesdePlantilla_("PLANTILLA · Canje de recompensas", "STARGATE · " + nombre + " · Canje de recompensas", carpeta);
  fc.setDescription(DESC_CANJE);
  fc.setCollectEmail(true).setLimitOneResponsePerUser(false).setShowLinkToRespondAgain(true).setConfirmationMessage("Solicitud recibida. Recibirás un correo con el resultado.");
  fc.addListItem().setTitle("Recompensa").setRequired(true);
  fc.addParagraphTextItem().setTitle("Comentario (opcional)");
  reestructurarCanje_(fc);   // pone las preguntas, las secciones y el enrutado, todo en un sitio
  publicar_(fc);
  _creados.push(fc);
  try { vincular_(fc, ss.getId()); } catch (e) { _deshacer(e); }
  var tabC = pestanaDe_(fc, "C · " + id, "#f5b043");
  _t.hito("formulario de Canje");

  asegurarTriggers_();
  var ahora = new Date(), estado = "Abierto";
  if (apertura && apertura > ahora) { [fb, ft, fc].forEach(function(f){ f.setAcceptingResponses(false); }); estado = "Programado"; programar_("abrirPorTrigger", apertura, id); }
  // dos cierres: primero se acaban las misiones, y una semana después se cierra también el canje
  if (cierre && cierre > ahora) programar_("cerrarMisionesPorTrigger", cierre, id);
  if (cierreCanje && cierreCanje > ahora) programar_("cerrarPorTrigger", cierreCanje, id);

  hoja_(H.PERS).appendRow([id, nombre, tipo, datos.profesores || "", inicio || "", apertura || "", cierre || "", estado,
    fb.getPublishedUrl(), fb.getEditUrl(), ft.getPublishedUrl(), fc.getPublishedUrl(), tabB, tabT, tabC, new Date(), datos.referente || "", ft.getEditUrl(),
    "", String(datos.panelVer || "").trim(), String(datos.panelEdit || "").trim(), "", fc.getEditUrl(), cierreCanje || "",
    String(datos.padlet || "").trim()]);
  _t.hito("fila del PER escrita");
  // v3.13 · A PARTIR DE AQUÍ EL PER YA EXISTE Y FUNCIONA. Lo que queda es acabado: los orbes de los
  // planetas, el documento de enlaces y el dossier del profesorado. Son ~15 descargas de imagen y
  // dos documentos: justo lo que hacía que crearPER se comiera los 6 minutos de Apps Script y muriera
  // dejando el PER a medias. Si no da tiempo, se aparta y lo termina la continuación dentro de un
  // minuto — sin que el profesorado tenga que hacer nada.
  var pend = { per: id, imagenes: true, doc: true, dossier: true };
  if (_t.sobra(60000)) { try { var _im = imagenesFormularios_(fb, ft, fc); pend.imagenes = _im.faltan > 0; _t.hito("imagenes de los formularios (" + _im.puestos + " puestas, " + _im.faltan + " pendientes)"); }
                         catch (e) { Logger.log("imagenesFormularios_: " + e); } }
  var docUrl = "";
  if (_t.sobra(45000)) { try { docUrl = crearDocumentoPER_(id); pend.doc = false; _t.hito("documento de enlaces"); }
                         catch (e) { Logger.log("crearDocumentoPER_: " + e); } }
  var dossierUrl = "";
  if (_t.sobra(30000)) { try { dossierUrl = dossier_(); pend.dossier = false; _t.hito("dossier del profesorado"); }
                         catch (e) { Logger.log("dossier_: " + e); } }
  if (pend.imagenes || pend.doc || pend.dossier) {
    guardarProgreso_("alta", pend); programarContinuacion_("continuarAltaPER");
    Logger.log("crearPER: acabado aplazado a continuarAltaPER -> " + JSON.stringify(pend));
  } else { guardarProgreso_("alta", null); }
  // v3.36 · el grupo nuevo estrena su color en el momento, no de madrugada: si no, durante el primer
  // día la hoja tiene un grupo más que colores y parece que el sistema se ha dejado uno.
  try { colorear_(); } catch (e) { Logger.log("colorear_ al crear el PER: " + e); }
  // v3.38 · si el grupo tiene padlet y hay clave API, NEBULA deja la chincheta de bienvenida
  if (datos.padlet) { try { if (chinchetaBienvenida_(perObj_(perFila_(id).v))) _t.hito("chincheta de bienvenida en el padlet"); } catch (e) {} }
  return { id:id, nombre:nombre, tipo:tipo, estado:estado, referente:datos.referente||"", doc:docUrl, dossier:dossierUrl, formBitacora:fb.getPublishedUrl(), formTicket:ft.getPublishedUrl(), formCanje:fc.getPublishedUrl(),
    hoja: ss.getUrl(), web: WEB + "registro.html?per=" + id,
    foro: WEB + "foro.html?per=" + id + (inicio ? "&inicio=" + fechaIso_(inicio) + "&tipo=" + tipo : ""), nave: WEB + "recluta.html?per=" + id,
    embedAlumnos: '<iframe src="' + WEB + 'registro.html?per=' + id + '&embed=1" width="100%" height="760" style="border:0;border-radius:16px"></iframe>',
    ranking: WEB + "registro.html?per=" + id + "&solo=1",
    embedRanking: '<iframe src="' + WEB + 'registro.html?per=' + id + '&embed=1&solo=1" width="100%" height="720" style="border:0;border-radius:16px"></iframe>',
    embedForo: '<iframe src="' + WEB + 'foro.html?per=' + id + (inicio ? '&inicio=' + fechaIso_(inicio) + '&tipo=' + tipo : '') + '&embed=1" width="100%" height="640" style="border:0;border-radius:16px"></iframe>',
    embedNave: '<iframe src="' + WEB + 'recluta.html?per=' + id + '&embed=1" width="100%" height="900" style="border:0;border-radius:16px"></iframe>',
    panelVer: String(datos.panelVer || "").trim() || panelStd_().ver, panelEdit: String(datos.panelEdit || "").trim() || panelStd_().editar,
    padlet: String(datos.padlet || "").trim(),
    inicio: fechaIso_(inicio), apertura: aperturaIso, cierre: cierreIso, cierreCanje: cierreCanjeIso,
    semanas: fx ? fx.semanas : semanasDe_(tipo),
    restos: restos, sinPlantilla: _SIN_PLANTILLA.slice(),
    pendiente: (pend.imagenes || pend.doc || pend.dossier) ? pend : null, ms: _t.ms() };
}
// v3.17 · Las etiquetas SALEN del catalogo, no de una segunda lectura de la hoja: el enrutado por
// secciones empareja etiqueta[k] con catalogo[k], y si las dos listas se leyeran por separado un dia
// dejarian de cuadrar y cada recompensa mandaria a la seccion de otra.
function etiquetaRecompensa_(x) { return x.nombre + " — " + x.coste + " créditos"; }
function etiquetasRecompensas_() { return recompensasCat_().map(etiquetaRecompensa_); }
// Preguntas del canje de avatar (se usan al crear el PER y al actualizar PERs anteriores)
var TIT_DOCENTE = "¿Quién imparte tu clase?";
var AYUDA_DOCENTE = "Para que tu profe pueda seguir a su grupo y le avise el sistema cuando canjees algo " +
  "que tenga que aplicar él o ella (subir nota, recalificar). Si cambias de clase, edita esta respuesta.";
// v3.17 · El canje se paga en CREDITOS, no en xp (son dos monedas y confundirlas es lo peor que
// puede pasar). Estos dos textos los ponia SOLO crearPER, asi que un PER ya creado se quedaba con
// la version vieja para siempre; ahora los refresca tambien Mantenimiento.
var DESC_CANJE = "Cambia tus CRÉDITOS ◈ por ventajas. Ojo: los créditos son lo único que se gasta; " +
  "tus xp miden el viaje y nunca bajan, así que comprar no te baja de nivel. El sistema comprueba tu saldo " +
  "al instante y te responde por correo.";
var TIT_ACTIVIDAD = "Actividad a la que se aplica";
var OPC_ACTIVIDAD = ["Actividad 1 · imagen con IA", "Actividad 2 · paisaje de aprendizaje",
                     "Otra (la indico en el comentario)"];
// v3.17 · EL CANJE, POR SECCIONES. Antes todo estaba en una sola pagina y se podia pedir un heroe y
// de paso marcar un titulo y un planeta: cosas incompatibles en el mismo envio, y el alumno creyendo
// que se lleva tres. Ahora la eleccion de recompensa MANDA a la seccion que necesita —o directa a
// enviar si no necesita nada— y cada seccion termina enviando, asi que no se puede caer en la
// siguiente. De paso, «Actividad a la que se aplica» deja de ser obligatoria para todo el mundo:
// solo se pregunta a quien canjea nota.
var SEC_TITULO = "Un dato más: tu título";
var SEC_FONDO  = "Un dato más: tu planeta";
var SEC_NOTA   = "Un dato más: la actividad";
var SECCIONES_CANJE = [SEC_TITULO, SEC_FONDO, SEC_NOTA];
// 🔴 FUNCION, no objeto: TIT_TITULO y TIT_FONDO se declaran MAS ABAJO en el fichero, asi que un
// mapa construido aqui arriba guardaria «undefined» y ordenarItems_ no encontraria nada. Que el
// orden saliera bien de todos modos era casualidad (el orden en que se anaden las preguntas), y una
// casualidad no es una garantia. Lo caza la bateria 23.
function preguntaDeSeccion_(sec) {
  return sec === SEC_TITULO ? TIT_TITULO : sec === SEC_FONDO ? TIT_FONDO : sec === SEC_NOTA ? TIT_ACTIVIDAD : "";
}
var AYUDA_SECCION = {};
AYUDA_SECCION[SEC_TITULO] = "Ya casi. Solo falta elegir el título que lucirás bajo tu alias.";
AYUDA_SECCION[SEC_FONDO]  = "Ya casi. Solo falta elegir el planeta que quieres de fondo en tu ficha.";
AYUDA_SECCION[SEC_NOTA]   = "Ya casi. Dime en qué entregable quieres que se aplique.";
function seccionDe_(tipo) {
  return tipo === "titulo" ? SEC_TITULO : tipo === "fondo" ? SEC_FONDO : tipo === "nota" ? SEC_NOTA : "";
}
// Deja los items en el orden pedido. Los que no esten en la lista se quedan detras, en su orden.
function ordenarItems_(form, titulos) {
  titulos.forEach(function(t, destino){
    var it = form.getItems().filter(function(i){ return i.getTitle() === t; })[0];
    if (it && it.getIndex() !== destino) { try { form.moveItem(it.getIndex(), destino); } catch (e) {} }
  });
}
function reestructurarCanje_(fc) {
  var buscar = function(t){ return fc.getItems().filter(function(i){ return i.getTitle() === t; })[0] || null; };
  // 1) las preguntas que tienen que existir (anadirCamposAvatar_ pone titulo y fondo, y quita las retiradas)
  anadirCamposAvatar_(fc);
  // 🔴 `buscar()` devuelve un Item GENERICO —que hay que convertir con asListItem()— pero
  // addListItem() devuelve YA un ListItem, que no tiene ese metodo. Encadenarlos revienta con
  // «act.asListItem is not a function», y solo cuando la pregunta NO existia: o sea, al crear un PER
  // desde una plantilla que no la trae. Visto en produccion el 27-ago creando el PER de 10 reclutas.
  var act = comoLista_(buscar(TIT_ACTIVIDAD) || fc.addListItem().setTitle(TIT_ACTIVIDAD));
  cambioObligatorio_(act, true);
  cambioAyuda_(act, AYUDA_SECCION[SEC_NOTA]);
  ponerOpciones_(act, OPC_ACTIVIDAD, TIT_ACTIVIDAD);
  var rec = comoLista_(buscar("Recompensa") || fc.addListItem().setTitle("Recompensa"));

  var cat = recompensasCat_();
  // 2) LO QUE TIENE QUE HABER: una pagina por recompensa —con su imagen y su explicacion, para no
  // canjear a ciegas— y ademas una pagina por DATO que haga falta pedir. Las cuatro recompensas de
  // nota comparten «Actividad», porque en Forms una pregunta no puede estar en dos sitios.
  var quiero = [];
  cat.forEach(function(x){ quiero.push({ titulo: etiquetaRecompensa_(x), ayuda: ayudaRecompensa_(x) }); });
  SECCIONES_CANJE.forEach(function(sec){
    if (cat.some(function(x){ return seccionDe_(x.tipo) === sec; })) quiero.push({ titulo: sec, ayuda: AYUDA_SECCION[sec] });
  });

  // 🔴 3) SE RECONCILIA, NO SE RECONSTRUYE. Borrar todas las paginas y volver a crearlas costaba una
  // escritura por pagina EN CADA PASADA, y con eso la migracion de un grupo vivo no cabe en los 6
  // minutos de Apps Script (medido: 490 s). Pasar por aqui con el formulario ya al dia tiene que
  // costar CERO escrituras — es lo que permite trocear el lote. Misma regla que estructuraBitacora_.
  var hay = {};
  fc.getItems(FormApp.ItemType.PAGE_BREAK).forEach(function(pb){ hay[pb.getTitle()] = comoPagina_(pb); });
  var quiereTitulo = {}; quiero.forEach(function(q){ quiereTitulo[q.titulo] = true; });

  // 3a) primero se suelta la navegacion de lo que vaya a desaparecer. Al reves Forms contesta
  // «Invalid data updating form» y el borrado falla EN SILENCIO: una opcion que apunta a una pagina
  // impide borrarla. Pasó de verdad el 30-ago en la Bitacora y dejo el formulario a medias.
  var sobran = Object.keys(hay).filter(function(t){ return !quiereTitulo[t]; });
  if (sobran.length) {
    cambioSaltos_(rec, cat.map(function(x){ return [etiquetaRecompensa_(x), FormApp.PageNavigationType.SUBMIT]; }));
    Object.keys(hay).forEach(function(t){ if (!quiereTitulo[t]) cambioDestino_(hay[t], FormApp.PageNavigationType.SUBMIT); });
    sobran.forEach(function(t){
      try { fc.deleteItem(hay[t]); delete hay[t]; }
      catch (e) { Logger.log("reestructurarCanje_ borrando «" + t + "»: " + e); }
    });
  }
  // 3b) y se crea o se pone al dia lo que toca
  quiero.forEach(function(q){
    if (hay[q.titulo]) cambioAyuda_(hay[q.titulo], q.ayuda);
    else hay[q.titulo] = fc.addPageBreakItem().setTitle(q.titulo).setHelpText(q.ayuda);
  });

  // 4) el orden: portada, cada recompensa con su imagen detras, y al final las preguntas de dato
  var orden = ["Recompensa", "Comentario (opcional)"];
  cat.forEach(function(x){ orden.push(etiquetaRecompensa_(x), x.nombre); });
  SECCIONES_CANJE.forEach(function(sec){ if (hay[sec]) orden.push(sec, preguntaDeSeccion_(sec)); });
  ordenarItems_(fc, orden);

  // 5) de la pagina de la recompensa se sale a su pregunta de dato, o directo a enviar
  cat.forEach(function(x){
    var sec = seccionDe_(x.tipo);
    cambioDestino_(hay[etiquetaRecompensa_(x)], sec && hay[sec] ? hay[sec] : FormApp.PageNavigationType.SUBMIT);
  });
  // 🔴 y cada pagina de DATO termina enviando: si no, quien pide un titulo caeria ademas en la de planeta
  SECCIONES_CANJE.forEach(function(sec){ if (hay[sec]) cambioDestino_(hay[sec], FormApp.PageNavigationType.SUBMIT); });

  // 6) y la lista lleva a la pagina de lo que has elegido
  cambioSaltos_(rec, cat.map(function(x){ return [etiquetaRecompensa_(x), hay[etiquetaRecompensa_(x)]]; }));
  cambioObligatorio_(rec, true);
}
// El texto de la pagina de cada recompensa: lo que te llevas y, al final, la pregunta con su precio.
// La pagina ES la confirmacion — se avanza al enviar—, asi que no hay un «¿si o no?» que ademas
// habria que denegar por detras y dejaria filas basura en la hoja.
function ayudaRecompensa_(x) {
  var cierre = x.coste > 0
    ? "\n\n¿Cambias " + x.coste + " créditos por esto? Envía para confirmarlo."
    : "\n\nNo cuesta créditos. Envía para confirmarlo.";
  return String(x.desc || "") + cierre;
}
// v3.37 · LA PORTADA DEL FORMULARIO (petición de Norberto, 29-ago). Antes se entraba directamente al
// alistamiento y la navegación estaba AL FINAL de esa página: quien solo venía a marcar un reto tenía
// que bajar por todos sus datos para encontrar el desplegable. Ahora la primera pantalla explica el
// funcionamiento en cuatro líneas, pide el correo y pregunta UNA cosa.
var TIT_INTRO = "CÓMO FUNCIONA ESTA BITÁCORA";
var AYUDA_INTRO = "Este formulario es UNO SOLO y sirve para dos cosas, siempre con el MISMO enlace:\n\n" +
  "1) La PRIMERA vez te ALISTAS: eliges alias, personaje y quién te da clase. Solo se hace una vez.\n" +
  "2) De ahí en adelante REGISTRAS los retos que vas completando: eliges el planeta, marcas lo que has " +
  "terminado y pegas el enlace de tu evidencia.\n\n" +
  "No hace falta rellenarlo entero cada vez ni empezar de cero: lo que ya registraste se conserva SIEMPRE. " +
  "Elige abajo qué vienes a hacer hoy y te llevo directo.";
var TIT_HOY = "¿QUÉ QUIERES HACER HOY?";
var AYUDA_HOY = "Elige y te llevo directo. Si te equivocas, no pasa nada: vuelves a entrar y ya está.";
var OPC_ALTA  = "🪪 ALISTARME — es mi primera vez aquí";
var OPC_RETOS = "🚀 REGISTRAR RETOS que ya he completado";
var TIT_PAG_ALTA = "🪪 Alistamiento · esto solo se hace una vez";
var AYUDA_PAG_ALTA = "Quién eres a bordo. Si ya te alistaste otro día, estos datos ya los tengo: " +
  "puedes cambiarlos si quieres, o bajar directo al final de la página.";
var TIT_TRAS_ALTA = "Ya está. ¿Quieres registrar algún reto ahora?";
var OPC_SOLO_ALTA = "No, ya está: ENVIAR";
var OPC_SIGO = "Sí, llévame a elegir planeta";
var TIT_PAG_PLANETA = "🪐 ¡Perfecto! Elige el planeta";
var AYUDA_PAG_PLANETA = "Cada planeta es un tema del curso. Elige el del reto que has completado y te " +
  "llevo a su sección. Si has terminado retos de varios planetas, envía este y vuelve a entrar: " +
  "lo de antes se conserva.";
var TIT_PLANETA = "¿De qué planeta es lo que has completado?";
var AYUDA_PLANETA = "Solo aparecen los planetas del viaje. No hace falta ir en orden.";
// Se conservan para RECONOCER los formularios antiguos y reconvertirlos (ver estructuraBitacora_).
var TIT_NAV = "¿Qué vienes a registrar hoy?";
var OPC_NADA = "Nada más: solo me alisto / actualizo mis datos";
var AYUDA_NAV = "Elige y te llevo DIRECTO a esa sección; al marcar tus casillas, envías y listo. " +
  "Lo que registraste otras veces se conserva aunque no pases por su página: el sistema solo añade, nunca borra.";
// v3.17 · Este texto decia que los personajes 5-7 eran exclusivos, que podias poner tu propia imagen
// y que cambiar de avatar costaba creditos. Las tres cosas estan retiradas: los 7 estan abiertos
// desde el principio, el personaje NO se cambia (es tuyo para todo el viaje) y lo que se desbloquea
// por nivel son sus 5 versiones de arte -las SKINS-, que se eligen gratis desde la Nave.
// 🔴 FUNCION, no constante: lee AVATARES_INICIALES, que vive en Datos.gs. Los ficheros de Apps
// Script comparten el ambito global pero NO hay garantia de orden de carga, asi que cualquier cosa
// que se calcule al arrancar leyendo el catalogo puede encontrarselo vacio. Lo caza la bateria.
function ayudaAvatar_() {
  return "Los " + AVATARES_INICIALES + " personajes en versión ella/él, todos disponibles desde ya. " +
    "Elige con calma, porque este personaje te acompaña TODO el viaje y no se cambia. Lo que sí cambia es su " +
    "aspecto: al subir de nivel se te desbloquean sus 5 versiones (Recluta → Cadete → Oficial → Comandante → " +
    "Leyenda) y eliges cuál llevas desde tu Nave, gratis y cuando quieras.";
}
// La lamina de personajes que va dentro de la Bitacora. En una constante porque la escriben
// DOS sitios: quien la pone al crear el PER y quien la refresca desde Mantenimiento.
var TIT_LAMINA = "Tu personaje evoluciona con tu nivel";
// v3.39 · la guía visual del truco de Genially («Compartir desde esta página»): la ponen los dos
// caminos del formulario junto al campo del ePortfolio. Idea y captura de Norberto, 30-ago.
var TIT_TRUCO = "Truco: comparte tu Bitácora abierta por la página exacta";
var TIT_NUEVO_AVATAR = "Nuevo avatar (solo para «Cambio de avatar»)";
var TIT_URL_AVATAR = "URL de tu nueva imagen (solo para «Avatar personal»)";
var TIT_EXCLUSIVO = "Personaje exclusivo (solo para «Personaje exclusivo»)";
var TIT_TITULO = "Tu título (solo para «Título de recluta»)";
var TIT_FONDO = "Tu planeta de fondo (solo para «Fondo de ficha»)";
// v3.17 · Las TRES preguntas de avatar (cambio de avatar, personaje exclusivo y URL propia) estan
// RETIRADAS: el personaje ya no se compra, se desbloquea por nivel y se elige en la Nave. Se siguen
// LEYENDO mas abajo para no perder las respuestas viejas, pero no se vuelven a crear, y si un
// formulario antiguo las tiene, se le quitan.
var CAMPOS_AVATAR_RETIRADOS = [TIT_NUEVO_AVATAR, TIT_EXCLUSIVO, TIT_URL_AVATAR];
// Google revienta con «La matriz está vacía: values» si le das una lista vacia, y ese mensaje no
// dice nada de donde esta el problema. Aqui se cuenta.
function ponerOpciones_(item, valores, queEs) {
  var v = (valores || []).map(function(x){ return String(x == null ? "" : x).trim(); })
                         .filter(function(x){ return x; });
  if (!v.length) throw new Error("La pregunta «" + queEs + "» se quedaria sin opciones: revisa el catalogo antes de crear o actualizar los formularios.");
  item.setChoiceValues(v);
  return item;
}
function quitarCamposRetirados_(fc) {
  var n = 0;
  fc.getItems().slice().forEach(function(it){
    if (CAMPOS_AVATAR_RETIRADOS.indexOf(it.getTitle()) >= 0) { try { fc.deleteItem(it); n++; } catch (e) {} }
  });
  return n;
}
// Idempotente a proposito: la llaman al crear el PER y al actualizar los formularios, y en los dos
// casos tiene que dejar el formulario igual (poner lo que falte, quitar lo retirado).
function anadirCamposAvatar_(fc) {
  var hay = fc.getItems().map(function(i){ return i.getTitle(); });
  if (hay.indexOf(TIT_TITULO) < 0) {
    ponerOpciones_(fc.addListItem().setTitle(TIT_TITULO)
      .setHelpText("Si canjeas «Título de recluta», elige el que lucirás bajo tu alias."), TITULOS, TIT_TITULO);
  }
  if (hay.indexOf(TIT_FONDO) < 0) {
    ponerOpciones_(fc.addListItem().setTitle(TIT_FONDO)
      .setHelpText("Si canjeas «Fondo de ficha», elige tu planeta."),
      [TEMAS[1][0],TEMAS[2][0],TEMAS[3][0],TEMAS[4][0],TEMAS[5][0],TEMAS[6][0],TEMAS[7][0],TEMAS[8][0]], TIT_FONDO);
  }
  quitarCamposRetirados_(fc);
}
// v3.19 · Completar una SERIE devuelve creditos; el ALBUM ENTERO, creditos y xp. Se conceden una
// vez y quedan escritos, como todos los bonus. Se mira al caer cada carta, que es cuando puede
// cerrarse una serie.
function otorgarBonusColeccion_(o, email) {
  var t = tablero_(o.id, true);
  var yo = (t.reclutas || []).filter(function(x){ return x.email === String(email).toLowerCase(); })[0];
  if (!yo) return [];
  var ya = {}; (yo.bonus || []).forEach(function(k){ ya[k] = true; });
  var nuevos = [];
  (yo.insignias_album || []).forEach(function(k){ if (!ya["serie:" + k]) nuevos.push("serie:" + k); });
  if (yo.coleccion && yo.coleccion.cromos.tengo === yo.coleccion.cromos.total && !ya["album"]) nuevos.push("album");
  nuevos.forEach(function(k){ hoja_(H.AJ).appendRow([new Date(), o.id, String(email).toLowerCase(), "EXTRA", "bonus", k, "sistema"]); });
  return nuevos;
}
function extra_(o, email, accion, valor) { hoja_(H.AJ).appendRow([new Date(), o.id, email, "EXTRA", accion, valor, "canje"]); }
function actualizarRecompensas() {
  var ui = SpreadsheetApp.getUi();
  var pendiente = progreso_("formularios");
  if (pendiente && ui.alert("Actualizar formularios",
      "Hay una actualización a medias (" + pendiente.n + " de " + (pendiente.total || "?") + " grupos hechos).\n\n" +
      "SÍ = seguir donde se quedó · NO = empezar de cero.", ui.ButtonSet.YES_NO) !== ui.Button.YES) {
    guardarProgreso_("formularios", null);
  }
  var r = actualizarFormularios_();
  ui.alert(r.terminado ? "Formularios actualizados" : "Actualización en marcha (va por lotes)",
    (r.terminado
      // v3.17 · «Listo: 1 de 1» aunque hubiera fallos hacia creer que estaba todo hecho. Se cuentan.
      ? (r.fallos.length ? "Revisados " + r.hechos + " grupos de " + r.total + ", pero hay " + r.fallos.length +
                           " cosas que NO se pudieron hacer (abajo)."
                         : "Listo: " + r.hechos + " grupos de " + r.total + ", sin un solo fallo.")
      : "Hechos " + r.hechos + " de " + r.total + " grupos. Como Apps Script corta a los 6 minutos, el resto " +
        "sigue SOLO dentro de un minuto (y las veces que hagan falta). También puedes volver a pulsar esta opción.") +
    "\n\n· Canje: precios en CRÉDITOS, «Héroe de la Rebelión» en la lista y FUERA las tres preguntas de avatar " +
    "(cambio de avatar, personaje exclusivo y URL propia): esas recompensas ya no existen.\n" +
    "· Bitácora: el personaje ya no se compra ni se cambia — se elige al alistarse y son sus 5 versiones las que " +
    "se desbloquean por nivel, gratis, desde la Nave. Y SECCIONES RÁPIDAS: la primera página pregunta a qué tema " +
    "vas y salta directo; cada sección envía al terminar." +
    (r.fallos.length ? "\n\nNo se pudo con:\n" + r.fallos.slice(0, 12).join("\n") : ""), ui.ButtonSet.OK);
}
// El trabajo de verdad, sin interfaz: lo llama el menú y también el trigger de continuación.
// 🔬 v3.23 · mete los ítems de puesta en escena en un ticket YA CREADO, dentro de la página del
// tema —la que se responde una y otra vez, sesión tras sesión—. Idempotente: si ya están, no toca nada.
// Se puede añadir sin miedo a un formulario con respuestas: las columnas nuevas se añaden a la
// derecha y todo lo que lee tickets se lee POR CABECERA, no por posición (ver doPost «tickets»).
// 🔴 Aun así hay que ponerlos ANTES del primer tema del curso: añadidos a mitad, la serie empieza
// tarde y los temas de antes no tienen con qué compararse.
// 🔴 v3.23 · Los ajustes de respuesta del ticket se aplicaban SOLO al crearlo, así que cualquier
// toque a mano en la pantalla de Configuración se quedaba para siempre y en silencio. Y dos de ellos
// no son cosmética:
//   · «Limitar a 1 respuesta» = una respuesta por persona EN TODO EL CURSO. El ticket se contesta
//     una vez por tema, así que encenderlo lo deja inservible a partir del primer envío.
//   · «Recopilar correo» = adiós anonimato, que es lo único que hace que digan la verdad sobre su
//     clase y sobre su docente (y de eso vive el dato de puesta en escena).
// Ahora los repone cada «Actualizar formularios»: el ajuste correcto vive en el código, no en la
// memoria de quién tocó qué interruptor.
// 🔴 v3.24 · LA BIFURCACIÓN. Hasta ahora la página del tema daba por hecho que estuviste en clase:
// cinco escalas que empiezan por «valora la satisfacción con el desarrollo de la clase» las
// respondía también quien la vio en diferido o no la vio. Y los tres ítems de puesta en escena
// —¿se enseñó el ranking?— no los puede contestar quien no estaba: responden a bulto y ensucian
// justo la medida que queremos.
// Ahora la página del tema termina preguntando CÓMO la siguió, y solo quien dice «en directo» pasa
// a la página con esos tres ítems. Los que ven la grabación siguen valorando el contenido, que sí
// pueden juzgar. Idempotente: si ya está bifurcado, no toca nada.
function bifurcarTicket_(ft) {
  var items = ft.getItems();
  if (items.filter(function(i){ return i.getTitle() === TIT_COMO_SEGUIDA; }).length) return 0;
  var iEsc = -1;
  for (var k = 0; k < items.length; k++)
    if (PUESTA_EN_ESCENA.filter(function(q){ return q[0] === items[k].getTitle(); }).length) { iEsc = k; break; }
  if (iEsc < 0) return 0;   // sin los ítems no hay nada que separar (ticket viejo o ajeno)

  // La página nueva nace donde empiezan los ítems, así que se los lleva con ella; y la pregunta que
  // bifurca queda justo antes, cerrando la página del tema.
  var pDir = ft.addPageBreakItem().setTitle(TIT_PAG_DIRECTO)
    .setHelpText("Solo para quien estuvo en la clase en directo. Anónimo, como todo lo demás.");
  ft.moveItem(pDir.getIndex(), iEsc);
  var como = ft.addMultipleChoiceItem().setTitle(TIT_COMO_SEGUIDA).setRequired(true);
  ft.moveItem(como.getIndex(), iEsc);
  pDir.setGoToPage(FormApp.PageNavigationType.SUBMIT);
  como.setChoices([como.createChoice(OPC_DIRECTO, pDir),
                   como.createChoice(OPC_DIFERIDO, FormApp.PageNavigationType.SUBMIT)]);
  return 1;
}

function ajustesTicket_(ft) {
  try { ft.setCollectEmail(false).setLimitOneResponsePerUser(false).setShowLinkToRespondAgain(true); }
  catch (e) { Logger.log("ajustesTicket_: " + e); }
  return ft;
}

function anadirPuestaEnEscena_(ft) {
  var titulos = ft.getItems().map(function(i){ return i.getTitle(); });
  var faltan = PUESTA_EN_ESCENA.filter(function(q){ return titulos.indexOf(q[0]) < 0; });
  if (!faltan.length) return 0;
  var items = ft.getItems(), iTema = -1, iSig = -1;
  for (var k = 0; k < items.length; k++) {
    if (items[k].getType() !== FormApp.ItemType.PAGE_BREAK) continue;
    if (items[k].getTitle() === TIT_PAG_TEMA) iTema = k;
    else if (iTema >= 0 && iSig < 0) iSig = k;
  }
  if (iTema < 0) return 0;   // un ticket que no tiene esa página: no es este formulario, no se toca
  var destino = iSig < 0 ? items.length : iSig;
  faltan.forEach(function(q){
    var it = ft.addScaleItem().setTitle(q[0]).setBounds(1,5).setLabels(q[1], q[2]);
    ft.moveItem(it.getIndex(), destino);   // nace al final; se muda al final de la página del tema
    destino++;
  });
  return faltan.length;
}

function actualizarFormularios_() {
  var t = reloj_();
  var pers = hoja_(H.PERS).getDataRange().getValues().slice(1).filter(function(v){ return v[0]; });
  var pr = progreso_("formularios") || { i: 0, n: 0, canjes: 0, fallos: [] };
  if (typeof pr.fase !== "number") pr.fase = 0;
  pr.total = pers.length;
  // 🔴 30-ago · EL LOTE IBA POR PER, Y LA UNIDAD QUE NO CABE EN LOS 6 MINUTOS ES UN PER. La Bitácora
  // de un grupo vivo se pasa ella sola del tiempo (medido: ~300 s solo en poner al día los bloques,
  // y muerte en el bucle de mover items), así que trocear por PER no servía de nada: las dos pasadas
  // del 30-ago murieron en el mismo punto y dejaron el formulario intacto.
  // Ahora cada PER va por FASES —canje, Bitácora, ticket— y la de la Bitácora puede quedarse a
  // medias: `reestructurarBitacora_` devuelve false, se guarda la fase y la pasada siguiente
  // CONTINÚA por donde iba sin repetir las otras dos.
  //
  // ¿cabe otra tarea atómica? La regla de oro manda: si esta pasada aún no ha hecho NADA, se hace
  // igual —sin esto, con el reloj justo el lote se quedaría parado para siempre.
  var hecho = false;
  var cabe = function(){ return !hecho || t.sobra(MARGEN_FASE_MS); };
  while (pr.i < pers.length && t.puedo()) {
    var v = pers[pr.i];
    if (pr.fase === 0) {
      if (!cabe()) break;
      try { var f = formDelPER_(perObj_(v), "C"); if (!f) throw new Error("sin formulario de canje");
            f.setDescription(DESC_CANJE);
            reestructurarCanje_(f); pr.canjes++; }
      catch (e) { pr.fallos.push(String(v[1]) + " (canje): " + e.message); }
      pr.fase = 1; hecho = true; t.marcar();
      if (!t.puedo()) break;
    }
    if (pr.fase === 1) {
      // si algo revienta se da por acabada: un PER roto no puede dejar el lote dando vueltas
      var acabada = true;
      try { var fbx = formDelPER_(perObj_(v), "B"); if (!fbx) throw new Error("sin Bitácora");
            var tit2 = fbx.getItems().map(function(i){ return i.getTitle(); });
            if (tit2.indexOf("Breve biografía de tu personaje") < 0) {
              var bioIt = fbx.addParagraphTextItem().setTitle("Breve biografía de tu personaje").setHelpText("2-3 frases sobre tu recluta: quién es, de dónde viene, qué se le da bien. Aparecerá al pie de tu personaje en la Nave del Recluta.");
              var pos = tit2.indexOf("Enlace a mi Bitácora (ePortfolio)");
              if (pos >= 0) fbx.moveItem(bioIt.getIndex(), pos + 1); }
            acabada = reestructurarBitacora_(fbx, perObj_(v), t) !== false; }
      catch (e) { pr.fallos.push(String(v[1]) + " (bitácora): " + e.message); }
      hecho = true; t.marcar();
      if (!acabada) break;    // sigue con ESTE MISMO PER, y en esta MISMA fase, en la pasada siguiente
      pr.fase = 2;
      if (!t.puedo()) break;
    }
    if (!cabe()) break;
    try { var ftx = formDelPER_(perObj_(v), "T"); if (ftx) { ajustesTicket_(ftx); anadirPuestaEnEscena_(ftx); bifurcarTicket_(ftx); } }
    catch (e) { pr.fallos.push(String(v[1]) + " (ticket): " + e.message); }
    pr.i++; pr.n++; pr.fase = 0; hecho = true; t.marcar();
  }
  var terminado = pr.i >= pers.length;
  if (terminado) { guardarProgreso_("formularios", null); cancelarContinuacion_("continuarActualizarFormularios"); }
  else { guardarProgreso_("formularios", pr); programarContinuacion_("continuarActualizarFormularios"); }
  return { terminado: terminado, hechos: pr.n, total: pers.length, canjes: pr.canjes, fallos: pr.fallos };
}
// Lo dispara el trigger de un minuto: sin interfaz, porque un trigger no tiene ventanas.
function continuarActualizarFormularios() {
  var r = actualizarFormularios_();
  Logger.log("continuarActualizarFormularios: " + r.hechos + "/" + r.total + (r.terminado ? " · TERMINADO" : " · sigue"));
}

// v3.8 · pone al día una Bitácora ya creada: quita la galería clásica y la URL gratis, y le añade
// el selector que salta directo a la sección del tema (cada sección envía al terminar).
// Es idempotente: si ya está reestructurada, no toca nada.
// 🔴 UN DATO, UN SITIO. El texto de la Bitácora estaba escrito DOS veces —al crear el PER y al
// poner al día los que ya existen— y se desincronizó a la primera: el 28-ago se mejoró en un sitio
// y el otro se quedó con el viejo, así que la mejora no habría llegado a ningún grupo en marcha.
// Ahora los dos caminos leen de aquí, y el banco comprueba que acaban con el MISMO texto.
//
// Lo que más despista de todo el sistema: este formulario hace DOS cosas con UN solo enlace. Quien
// lo abre por primera vez tiene que ver que aquí se alista; quien vuelve, que aquí registra.
// v3.36 · El aviso del correo, en UN SOLO SITIO. Lo pide la pregunta «Correo» del formulario y lo
// repite la descripción de arriba: es el fallo más caro de todo el sistema (quien se alista con una
// cuenta y vuelve con otra no se encuentra en la Nave, y para entonces ya ha registrado media misión).
// La pregunta «Correo» viene de la PLANTILLA, así que existe tanto en un PER recién creado como en
// uno antiguo. Su ayuda se pone AQUÍ y la llaman los dos caminos: crearPER y reestructurarBitacora_.
// 🔴 Antes solo la ponía el segundo, o sea que un grupo nuevo estrenaba el formulario sin el aviso
// —y es justo el grupo cuyo alumnado se está alistando por primera vez, que es cuando importa.
function ayudaCorreo_(fb) {
  try {
    fb.getItems(FormApp.ItemType.TEXT).forEach(function(it){
      if (String(it.getTitle() || "").toLowerCase().trim() !== "correo") return;
      cambioAyuda_(it.asTextItem(), AYUDA_CORREO);
    });
  } catch (e) { Logger.log("ayudaCorreo_: " + e); }
}
var AYUDA_CORREO = "¡Ojo! Usa el MISMO correo con el que has iniciado sesión — lo ves ahí arriba. " +
  "Tu progreso se guarda SIEMPRE en la cuenta con la que envías, no en el correo que escribas aquí: " +
  "esta pregunta solo sirve para comprobar que no te has alistado con otra cuenta sin darte cuenta. " +
  "Si los dos no coinciden, te avisamos a las dos direcciones para que lo arregles a tiempo.";
function textoBitacora_(profesores) {
  return "Aquí haces las dos cosas, y siempre con el MISMO enlace: la primera vez TE ALISTAS " +
    "(alias, personaje y quién te da clase) y de ahí en adelante REGISTRAS lo que vas completando. " +
    "Se rellena UNA vez y a partir de ahí se EDITA: cada vez que ganes una insignia vuelve a este mismo enlace, " +
    "edítala, marca la casilla nueva y envía; lo de antes se conserva. " +
    "⚠️ Si Google te dice «solo puedes rellenar este formulario una vez», ES NORMAL y NO es un error: " +
    "entra igual y te saldrá tu respuesta con el botón «Modificar tu respuesta». " +
    "¡OJO CON LA CUENTA! Entra siempre con la MISMA cuenta de Google: tu progreso se guarda en ella, " +
    "no en el correo que escribas. Si un día entras con otra, la Nave no te encontrará. " +
    "Tu correo y tu nombre solo los ve el profesorado; en el tablero aparece tu alias. Profesorado: " + (profesores || "");
}
function confirmacionBitacora_(perId) {
  // v3.39 · SIMPLIFICADO (30-ago). El aviso de Google «solo puedes rellenarlo una vez» YA NO aparece
  // con la respuesta editable (lo comprobó Norberto en vivo), así que el párrafo que lo desactivaba
  // sobraba. Queda lo esencial: la Nave, el «se conserva» y las flechas al botón — que siguen siendo
  // LO ÚLTIMO a propósito: el enlace «Modificar tu respuesta» de Google va justo debajo.
  return "\u2705 \u00a1REGISTRADO! Tu Bit\u00e1cora crece. \ud83c\udf89\n\n" +
    "\ud83d\ude80 Mira c\u00f3mo va tu recluta en tu Nave:\n" +
    WEB + "recluta.html?per=" + perId + "\n\n" +
    "Para registrar m\u00e1s retos, vuelve a ESTE MISMO ENLACE y pulsa \u00abModificar tu respuesta\u00bb: " +
    "marcas lo nuevo, env\u00edas, y lo de antes SE CONSERVA.\n\n" +
    "\ud83d\udc47\ud83d\udc47\ud83d\udc47 EL BOT\u00d3N M\u00c1GICO \ud83d\udc47\ud83d\udc47\ud83d\udc47\n" +
    "      \u2b07\ufe0f  \u00abMODIFICAR TU RESPUESTA\u00bb  \u2b07\ufe0f\n" +
    "\ud83d\udc47\ud83d\udc47\ud83d\udc47\ud83d\udc47\ud83d\udc47\ud83d\udc47\ud83d\udc47\ud83d\udc47\ud83d\udc47";
}


// v3.42 · Recibe el reloj del lote y DEVUELVE si ha terminado (ver estructuraBitacora_).
function reestructurarBitacora_(fb, o, t) {
  // 🔴 27-ago · Lo primero: una respuesta por persona, editable, y sin el enlace de «enviar otra
  // respuesta». Los grupos ya creados no se rehacen, así que si esto no estuviera aquí el arreglo
  // solo valdría para los PER nuevos — y los que están en marcha seguirían duplicando reclutas.
  try {
    fb.setLimitOneResponsePerUser(true).setAllowResponseEdits(true).setShowLinkToRespondAgain(false);
    // 🔴 Y la descripción, que es la que desactiva el susto: al limitar a una respuesta Google
    // enseña «Solo puedes rellenar este formulario una vez» —mensaje suyo, no se puede quitar— y
    // en un formulario al que hay que volver cada semana eso descoloca. Si la descripción no lo
    // explica, el arreglo crea un problema distinto.
    // 🔴 28-ago · Se compara con el texto BUENO, no con un fragmento. Antes preguntaba «¿contiene
    // "se EDITA"?», así que a un grupo ya arreglado no le llegaba ninguna mejora posterior: el
    // texto se quedaba anclado en la primera versión que le tocó.
    var descBuena = textoBitacora_(o.profesorado);
    if (String(fb.getDescription ? fb.getDescription() : "") !== descBuena) fb.setDescription(descBuena);
    var confBuena = confirmacionBitacora_(o.id);
    if (String(fb.getConfirmationMessage ? fb.getConfirmationMessage() : "") !== confBuena) fb.setConfirmationMessage(confBuena);
  } catch (e) { Logger.log("reestructurarBitacora_ (una respuesta): " + e); }
  // La pregunta «Correo» viene de la plantilla y es un doble check a proposito (en clase se les dice
  // que escriban el mismo). Que al menos explique para que sirve y que pasa si no coincide.
  ayudaCorreo_(fb);
  var items = fb.getItems();
  // 0) v3.11 · «¿Quién imparte tu clase?»: es lo que ata cada alumno a su docente
  var itProf = items.filter(function(i){ return i.getTitle() === TIT_DOCENTE; })[0];
  var opciones = listaProfes_(o.referente || "", o.profesorado || "", o.id);
  if (itProf) { try { var li = itProf.asListItem(); cambioValores_(li, opciones); cambioAyuda_(li, AYUDA_DOCENTE); } catch (e) {} }
  else {
    var nuevo = fb.addListItem().setTitle(TIT_DOCENTE).setHelpText(AYUDA_DOCENTE).setRequired(true).setChoiceValues(opciones);
    var pos = items.map(function(i){ return i.getTitle(); }).indexOf("Enlace a mi Bitácora (ePortfolio)");
    if (pos >= 0) { try { fb.moveItem(nuevo.getIndex(), pos); } catch (e) {} }
    items = fb.getItems();
  }
  // 1) avatar: solo personajes que evolucionan
  items.forEach(function(it){
    if (it.getType() === FormApp.ItemType.LIST && it.getTitle() === "Elige tu avatar") {
      var av = it.asListItem();
      cambioValores_(av, opcIniciales_()); cambioAyuda_(av, ayudaAvatar_());
    }
  });
  // 2) fuera la pregunta de la URL propia (ahora es una recompensa que se canjea)
  items.forEach(function(it){
    if (it.getTitle().indexOf("URL de tu propia imagen") === 0) { try { fb.deleteItem(it); } catch (e) {} }
  });
  // v3.37 · toda la estructura (portada, alistamiento, elegir planeta y un bloque por reto)
  return estructuraBitacora_(fb, o, t);
}

// ================= ESCRIBIR SOLO LO QUE CAMBIA =================
// 🔴 30-ago · La migración de un grupo VIVO no cabía en los 6 minutos de Apps Script y las dos
// pasadas que se probaron murieron con «Exceeded maximum execution time» dejando el formulario
// igual que estaba. Lo caro no es LEER (un `getItems()` de 72 preguntas cuesta 66 ms, medido), es
// ESCRIBIR. Y se reescribía TODO en cada pasada, así que el trabajo ya hecho se pagaba otra vez y
// la migración no avanzaba nunca.
//
// A partir de aquí se escribe SOLO lo que de verdad cambia. Cada función devuelve `true` si ha
// escrito, que es como se cuenta el trabajo para saber cuándo parar. Efecto: pasar la migración
// sobre un formulario que ya está al día cuesta CERO escrituras, y por eso se puede trocear.
function cambioAyuda_(it, txt) {
  try { if (String(it.getHelpText() || "") === String(txt || "")) return false;
        it.setHelpText(txt || ""); return true; } catch (e) { return false; }
}
function cambioTitulo_(it, txt) {
  try { if (String(it.getTitle() || "") === String(txt)) return false;
        it.setTitle(txt); return true; } catch (e) { return false; }
}
function cambioObligatorio_(it, b) {
  try { if (it.isRequired() === !!b) return false; it.setRequired(!!b); return true; } catch (e) { return false; }
}
function cambioValores_(it, vals) {
  try {
    var hay = it.getChoices().map(function(c){ return c.getValue(); });
    if (hay.length === vals.length && hay.every(function(v, i){ return v === vals[i]; })) return false;
    it.setChoiceValues(vals); return true;
  } catch (e) { return false; }
}
// Un desplegable de NAVEGACIÓN: pares [texto, destino], y el destino es un salto de página o una
// constante de PageNavigationType.
function cambioSaltos_(it, pares) {
  try {
    var hay = it.getChoices();
    var mismo = hay.length === pares.length && pares.every(function(par, i) {
      var c = hay[i];
      if (c.getValue() !== par[0]) return false;
      var pb = c.getGotoPage();
      if (pb) return !!(par[1] && par[1].getId) && pb.getId() === par[1].getId();
      return c.getPageNavigationType() === par[1];
    });
    if (mismo) return false;
    it.setChoices(pares.map(function(par){ return it.createChoice(par[0], par[1]); }));
    return true;
  } catch (e) { return false; }
}
// A dónde va una página al terminarla. 🔴 `getGoToPage()` devuelve la PÁGINA destino o null; el
// «enviar» / «continuar» se lee con `getPageNavigationType()`, que es otra llamada distinta.
function cambioDestino_(pb, destino) {
  try {
    var haciaPagina = !!(destino && destino.getId);
    var pagina = pb.getGoToPage();
    if (haciaPagina) { if (pagina && pagina.getId() === destino.getId()) return false; }
    else if (!pagina && pb.getPageNavigationType() === destino) return false;
    pb.setGoToPage(destino); return true;
  } catch (e) { return false; }
}
// Google devuelve cosas DISTINTAS: `getItems()` da items GENÉRICOS (con asListItem() y compañía) y
// `addListItem()` da ya un ListItem, que NO tiene as*Item. 🔴 Encadenarlos revienta —y reventaba
// justo al migrar un formulario viejo al que le faltara alguna de estas piezas, que es el único
// caso en el que se crean aquí.
function comoLista_(it) { return it && it.asListItem ? it.asListItem() : it; }
function comoPagina_(it) { return it && it.asPageBreakItem ? it.asPageBreakItem() : it; }

// ================= LA ESTRUCTURA DE LA BITÁCORA, EN UN GRUPO QUE YA EXISTE =================
// Reforma del 29-ago aplicada a un formulario vivo. Es la función más delicada del fichero, así que
// dos decisiones que la hacen segura:
//
//  1) NO se reconstruye el formulario: se le añade lo que falta, se le quita lo que sobra y se
//     REORDENA todo de una vez con una lista calculada. Mover item a item «hacia donde toca» es
//     donde esto se rompe; calcular el orden final y aplicarlo es idempotente — pasarla dos veces
//     seguidas deja el mismo resultado.
//  2) Los items que no reconoce NO se borran ni se dejan al final (acabarían dentro de la página del
//     último planeta): se colocan en el alistamiento, que es donde estaban, y se apuntan en el log.
//
// ⚠️ Lo que sí se pierde: las casillas viejas «Tema N · Lo que he completado» desaparecen del
// formulario, así que el alumnado deja de ver ahí lo que marcó. No se pierde NADA de lo registrado:
// eso vive en EVENTOS y se sigue viendo en la Nave, y las columnas viejas siguen en la hoja.
// v3.42 · Recibe el reloj del lote (`t`, opcional). Devuelve TRUE si ha dejado el formulario
// terminado y FALSE si se ha quedado a medias porque se acababa el tiempo: quien la llama guarda el
// progreso y vuelve a entrar en la pasada siguiente. Como todo se escribe solo si cambia, volver a
// entrar cuesta prácticamente nada y la migración avanza hasta acabar.
function estructuraBitacora_(fb, o, t) {
  var buscar = function(tit){ return fb.getItems().filter(function(i){ return i.getTitle() === tit; })[0] || null; };
  var retos = retosDe_(o.tipo);
  var porTema = {}; retos.forEach(function(r){ (porTema[r[4]] = porTema[r[4]] || []).push(r); });
  var temas = Object.keys(porTema).map(Number).sort(function(a,b){ return a-b; });

  // REGLA DE ORO, también aquí dentro: mientras no se haya escrito NADA en esta pasada se sigue,
  // pase lo que pase con el reloj; en cuanto hay una escritura, manda el reloj. Así una pasada
  // nunca se queda sin hacer nada y nunca se pasa de los 6 minutos.
  var escrito = false;
  var apunta = function(hubo){ if (hubo) { escrito = true; if (t) t.marcar(); } return hubo; };
  var sigo = function(){ return !t || !escrito || t.puedo(); };

  // --- 1) lo que falta, se crea (y lo que ya está, se pone al día) ---
  var intro = buscar(TIT_INTRO) || fb.addSectionHeaderItem().setTitle(TIT_INTRO);
  apunta(cambioAyuda_(intro, AYUDA_INTRO));
  var hoy = comoLista_(buscar(TIT_HOY) || fb.addListItem().setTitle(TIT_HOY));
  apunta(cambioAyuda_(hoy, AYUDA_HOY)); apunta(cambioObligatorio_(hoy, true));
  var pbAlta = comoPagina_(buscar(TIT_PAG_ALTA) || fb.addPageBreakItem().setTitle(TIT_PAG_ALTA));
  apunta(cambioAyuda_(pbAlta, AYUDA_PAG_ALTA));
  // el desplegable viejo del final del alistamiento se RECONVIERTE: es el mismo sitio y el mismo papel
  var tras = buscar(TIT_TRAS_ALTA) || buscar(TIT_NAV) || fb.addListItem().setTitle(TIT_TRAS_ALTA);
  tras = comoLista_(tras);
  apunta(cambioTitulo_(tras, TIT_TRAS_ALTA));
  apunta(cambioAyuda_(tras, "")); apunta(cambioObligatorio_(tras, true));
  var pbPl = comoPagina_(buscar(TIT_PAG_PLANETA) || fb.addPageBreakItem().setTitle(TIT_PAG_PLANETA));
  apunta(cambioAyuda_(pbPl, AYUDA_PAG_PLANETA));
  var sel = comoLista_(buscar(TIT_PLANETA) || fb.addListItem().setTitle(TIT_PLANETA));
  apunta(cambioAyuda_(sel, AYUDA_PLANETA)); apunta(cambioObligatorio_(sel, true));
  if (!sigo()) return false;

  // --- 2) las páginas de planeta: renombrar «Tema N» -> «Planeta N» ---
  var pagina = {};
  fb.getItems(FormApp.ItemType.PAGE_BREAK).forEach(function(it){
    var n = temaDePagina_(it.getTitle());
    if (n) { apunta(cambioTitulo_(it, tituloPlaneta_(n))); pagina[n] = comoPagina_(it); }
  });
  for (var p = 0; p < temas.length; p++) {
    if (!sigo()) return false;
    var tt = temas[p];
    if (!pagina[tt]) { pagina[tt] = fb.addPageBreakItem().setTitle(tituloPlaneta_(tt)); apunta(true); }
    // 🔴 la descripción del planeta también se pone al día en los grupos que ya existen: sale del
    // catálogo (TEMAS), y antes solo se escribía al CREAR la página — o sea que un grupo en marcha
    // se quedaba con la del curso anterior para siempre.
    apunta(cambioAyuda_(pagina[tt], tt >= 1 && tt <= 8 ? TEMAS[tt][1] : "Solo cuando hayas hecho el examen."));
    apunta(cambioDestino_(pagina[tt], FormApp.PageNavigationType.SUBMIT));
  }

  // --- 3) LOS DESPLEGABLES, ANTES DE BORRAR NADA ---
  // 🔴 30-ago, EL FALLO EN VIVO. Esto estaba AL FINAL, después del borrado, y por eso la migración
  // no podía converger: Google NO deja borrar una página a la que todavía navega una opción de un
  // desplegable —responde «Invalid data updating form»— y el selector de planeta seguía teniendo su
  // opción «La batalla final». El borrado fallaba SIEMPRE en la primera pasada, y la segunda (que
  // ya habría podido) no llegaba nunca porque se acababa el tiempo. Se reescriben primero: las
  // páginas a las que llevan ya existen todas (paso 2) y las que sobran dejan de tener quien las
  // apunte, así que el paso 4 puede borrarlas.
  var desplegables = function() {
    for (var q = 0; q < temas.length; q++) if (!pagina[temas[q]]) {
      // No debería pasar (el paso 2 las crea todas), pero si pasara sería gravísimo escribir el
      // selector a medias: se deja para la pasada siguiente, que vuelve a intentar crearlas.
      Logger.log("estructuraBitacora_: falta la página del planeta " + temas[q]); return false;
    }
    apunta(cambioSaltos_(hoy, [[OPC_ALTA, pbAlta], [OPC_RETOS, pbPl]]));
    apunta(cambioSaltos_(tras, [[OPC_SOLO_ALTA, FormApp.PageNavigationType.SUBMIT], [OPC_SIGO, pbPl]]));
    apunta(cambioSaltos_(sel, temas.map(function(n){ return [tituloPlaneta_(n), pagina[n]]; })));
    apunta(cambioDestino_(pbAlta, FormApp.PageNavigationType.SUBMIT));
    apunta(cambioDestino_(pbPl, FormApp.PageNavigationType.SUBMIT));
    return true;
  };
  if (!desplegables()) return false;
  if (!sigo()) return false;

  // --- 4) fuera las casillas y los enlaces de la etapa anterior (una por planeta) ---
  var viejos = fb.getItems().filter(function(it){
    var tit = String(it.getTitle() || "");
    return /^Tema \d · Lo que he completado$/.test(tit) || tit === "Batalla final"
        || /^Enlace · (Tema \d|Batalla final)$/.test(tit)
        // v3.41 · la Batalla final salió del catálogo: fuera su casilla, su enlace y su página
        || tit === "Batalla final: examen realizado" || tit === "Enlace · Batalla final: examen realizado"
        || (it.getType() === FormApp.ItemType.PAGE_BREAK && tit === "La batalla final" && temas.indexOf(9) < 0);
  });
  for (var d = 0; d < viejos.length; d++) {
    if (!sigo()) return false;
    try { fb.deleteItem(viejos[d]); apunta(true); }
    catch (e) { Logger.log("estructuraBitacora_ borrando «" + viejos[d].getTitle() + "»: " + e); }
  }

  // --- 5) un bloque por reto en cada planeta (los que ya estén, se ponen al día) ---
  for (var ti = 0; ti < temas.length; ti++) {
    var lista = porTema[temas[ti]];
    for (var ri = 0; ri < lista.length; ri++) {
      if (!sigo()) return false;
      var r = lista[ri];
      var cb = buscar(r[1]);
      if (!cb) { cb = fb.addCheckboxItem().setTitle(r[1]); ponerOpciones_(cb, [OPC_HECHO], r[1]); apunta(true); }
      apunta(cambioAyuda_(cb, ayudaReto_(r)));
      var ev = buscar(tituloEvidenciaReto_(r)), nuevoEv = false;
      if (!ev) { ev = fb.addTextItem().setTitle(tituloEvidenciaReto_(r)); nuevoEv = true; apunta(true); }
      var cambio = cambioAyuda_(ev, ayudaEvidenciaReto_(r, o.padlet));
      apunta(cambio);
      // 🔴 La validación NO tiene getter en Apps Script, así que no se puede comparar: se pone
      // cuando el campo es NUEVO o cuando su ayuda ha cambiado, que es justo cuando el tipo de
      // evidencia se ha movido en el catálogo (`ayudaEvidenciaReto_` sale de EVIDENCIA_TIPO). Si se
      // pusiera siempre, cada pasada escribiría de más y una migración troceada no acabaría nunca.
      if (nuevoEv || cambio) apunta(validarSecreto_(ev.asTextItem ? ev.asTextItem() : ev, r, true));
    }
  }

  // --- 6) EL ORDEN, de una vez ---
  var orden = [], dentro = {};
  var mete = function(it){ if (it && !dentro[it.getId()]) { dentro[it.getId()] = true; orden.push(it); } };
  // 🔴 Las escenas del Capitán y de NEBULA se declaran AQUÍ, en su sitio. Si no, esta función no las
  // reconoce, se las lleva al montón de «preguntas sueltas» y las recoloca en cada migración: medido,
  // 13 escrituras de más en la primera pasada de un grupo. Ponerlas donde van cuesta cero.
  mete(buscar(TIT_ESCENA_PORTADA));
  mete(intro);
  mete(buscar("Correo"));
  mete(hoy);
  mete(pbAlta);
  mete(buscar(TIT_ESCENA_ALTA));
  trucoGenially_(fb);
  ["Quién soy", "Alias de recluta (público)", "Nombre y apellidos", TIT_LAMINA, "Elige tu avatar",
   TIT_DOCENTE, "Enlace a mi Bitácora (ePortfolio)", TIT_TRUCO, "Breve biografía de tu personaje"]
    .forEach(function(tit){ mete(buscar(tit)); });
  // lo que no reconocemos se queda en el alistamiento: es de donde viene, y ahí no estorba
  // 🔴 La identidad de un item es su getId(), NUNCA `===`: cada getItems() de Google devuelve
  // envoltorios NUEVOS, así que `it === tras` era false SIEMPRE y el desplegable de planeta se
  // colaba entre las «sueltas» — es decir, acababa DENTRO del alistamiento.
  var sueltos = fb.getItems().filter(function(it){
    if (dentro[it.getId()]) return false;
    if (it.getType() === FormApp.ItemType.PAGE_BREAK) return false;
    if (it.getId() === tras.getId() || it.getId() === sel.getId()) return false;
    if (temaDePagina_(it.getTitle())) return false;
    if (esEscena_(it.getTitle())) return false;
    return !esDeReto_(it.getTitle(), retos) && !esOrbe_(it.getTitle());
  });
  if (sueltos.length) Logger.log("estructuraBitacora_: preguntas no reconocidas, van al alistamiento -> " +
    sueltos.map(function(x){ return x.getTitle(); }).join(" | "));
  sueltos.forEach(mete);
  mete(tras);
  mete(pbPl);
  mete(buscar(TIT_ESCENA_PLANETA));
  mete(sel);
  temas.forEach(function(n){
    mete(pagina[n]);
    mete(buscar(TEMAS[n] ? TEMAS[n][0] : ""));      // el orbe del planeta, si ya está puesto
    porTema[n].forEach(function(r){ mete(buscar(r[1])); mete(buscar(tituloEvidenciaReto_(r))); });
  });
  for (var k = 0; k < orden.length; k++) {
    if (!sigo()) return false;
    var ahora = orden[k].getIndex();
    if (ahora === k) continue;
    try { fb.moveItem(ahora, k); apunta(true); }
    catch (e) { Logger.log("moveItem «" + orden[k].getTitle() + "»: " + e); }
  }

  // --- 7) y de cierre, los desplegables otra vez: baratos y siempre coherentes con el orden final ---
  desplegables();
  return true;
}
// «Tema 3 · Sendara» o «Planeta 3 · Sendara» -> 3 · «La batalla final» -> 9 · cualquier otra cosa -> 0
function temaDePagina_(titulo) {
  var m = String(titulo || "").match(/^(?:Tema|Planeta) (\d)/);
  if (m) return Number(m[1]);
  return String(titulo || "") === "La batalla final" ? 9 : 0;
}
function esDeReto_(titulo, retos) {
  return (retos || []).some(function(r){ return titulo === r[1] || titulo === tituloEvidenciaReto_(r); });
}
// Las escenas de sección son imágenes con nombre propio; sin esto se cuelan entre las «sueltas».
function esEscena_(titulo) {
  return titulo === TIT_ESCENA_PORTADA || titulo === TIT_ESCENA_ALTA || titulo === TIT_ESCENA_PLANETA;
}
function esOrbe_(titulo) {
  for (var t = 1; t <= 8; t++) if (TEMAS[t] && TEMAS[t][0] === titulo) return true;
  return titulo === TIT_LAMINA || titulo === TIT_TRUCO;
}

// Equipo docente de un PER. Si la pestaña DOCENTES tiene filas, manda; si no, se reconstruye desde
// los nombres sueltos de la fila del PER (PERs antiguos, sin correo).
function esReferente_(d) { return String(d.rol || "").indexOf("referente") >= 0; }
function imparte_(d) { return String(d.rol || "").indexOf("imparte") >= 0; }
function docentesDe_(perId) {
  var out = [];
  try {
    hoja_(H.DOC).getDataRange().getValues().slice(1).forEach(function(v){
      if (String(v[0]) !== perId || !String(v[1] || "").trim()) return;
      out.push({ nombre:String(v[1]).trim(), correo:String(v[2] || "").trim().toLowerCase(),
                 rol:String(v[3] || "imparte"), panel:String(v[4] || "").trim() });
    });
  } catch (e) {}
  if (out.length) return out;
  var p = perFila_(perId); if (!p) return out;
  var o = perObj_(p.v);
  if (o.referente) out.push({ nombre:o.referente, correo:"", rol:"referente" });
  String(o.profesorado || "").split(",").forEach(function(x){ x = x.trim();
    if (x && !out.some(function(d){ return d.nombre === x; })) out.push({ nombre:x, correo:"", rol:"imparte" }); });
  return out;
}
function guardarDocentes_(perId, docentes) {
  var sh = hoja_(H.DOC), v = sh.getDataRange().getValues();
  // 🔴 El panel propio de cada docente NO viaja en el formulario del equipo, asi que si no se
  // rescatara antes de reescribir las filas, editar el equipo se lo llevaria por delante en silencio.
  var panelDe = {};
  v.slice(1).forEach(function(f){ if (String(f[0]) === perId && f[4]) panelDe[String(f[1]).trim()] = String(f[4]).trim(); });
  for (var i = v.length; i >= 2; i--) if (String(v[i-1][0]) === perId) sh.deleteRow(i);
  var filas = (docentes || []).filter(function(d){ return d && String(d.nombre || "").trim(); })
    .map(function(d){ var nom = String(d.nombre).trim();
      return [perId, nom, String(d.correo || "").trim().toLowerCase(), d.rol || "imparte",
              d.panel !== undefined ? String(d.panel || "").trim() : (panelDe[nom] || "")]; });
  if (filas.length) sh.getRange(sh.getLastRow() + 1, 1, filas.length, 5).setValues(filas);
}

// v3.28 · El Genially que le toca a un alumno concreto: el de SU docente si lo tiene, si no el del
// PER, si no el estandar. Tres escalones, del mas concreto al mas general.
function panelDe_(o, nombreDocente) {
  if (nombreDocente) {
    var d = docentesDe_(o.id).filter(function(x){ return x.nombre === nombreDocente; })[0];
    if (d && d.panel) return d.panel;
  }
  return o.panelVer || panelStd_().ver || "";
}

// Un docente cambia SU panel sin tocar el de nadie mas.
function guardarPanelDocente_(perId, nombre, url) {
  var sh = hoja_(H.DOC), v = sh.getDataRange().getValues();
  for (var i = 1; i < v.length; i++)
    if (String(v[i][0]) === perId && String(v[i][1]).trim() === String(nombre).trim()) {
      sh.getRange(i + 1, 5).setValue(String(url || "").trim());
      return true;
    }
  return false;
}
// Correos a los que avisar de algo de este PER: el docente indicado + siempre el referente.
function correosAviso_(perId, nombreDocente) {
  var ds = docentesDe_(perId), out = [];
  ds.forEach(function(d){
    if (!d.correo) return;
    if (esReferente_(d) || (nombreDocente && d.nombre === nombreDocente)) {
      if (out.indexOf(d.correo) < 0) out.push(d.correo);
    }
  });
  return out;
}
function listaProfes_(referente, profesores, perId) {
  var l = [];
  if (perId) {
    var ds = docentesDe_(perId);
    var dan = ds.filter(imparte_);
    (dan.length ? dan : ds).forEach(function(d){ if (l.indexOf(d.nombre) < 0) l.push(d.nombre); });
    if (l.length) return l;      // el equipo docente manda sobre los nombres sueltos del PER
  }
  (referente ? [referente] : []).concat(String(profesores||"").split(",")).forEach(function(x){ x = x.trim(); if (x && l.indexOf(x) < 0) l.push(x); });
  return l.length ? l : ["Profesorado"];
}
function escala_(f, titulo, a, b) { f.addScaleItem().setTitle(titulo).setBounds(1,5).setLabels(a,b); }
function construirTicket_(ft, referente, profesores, perId) {
  ft.setDescription("En este cuestionario encontrarás un espacio donde formular todas las dudas que tengas sobre la clase. También puedes indicarnos tu grado de satisfacción sobre las herramientas, metodología y progreso. " +
    "Responde con sinceridad: es ANÓNIMO y nos sirve para ayudarte a mejorar.");
  ft.setCollectEmail(false).setLimitOneResponsePerUser(false).setShowLinkToRespondAgain(true).setConfirmationMessage("Recibido, recluta. NEBULA toma nota y lo resolvemos en la próxima clase.");
  var prof = ft.addListItem().setTitle("El profesor o profesora que imparte tu clase...").setRequired(true); prof.setChoiceValues(listaProfes_(referente, profesores, perId));
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
  var comoT = ft.addMultipleChoiceItem().setTitle(TIT_COMO_SEGUIDA).setRequired(true);
  pTema.setGoToPage(FormApp.PageNavigationType.SUBMIT);
  var pDir = ft.addPageBreakItem().setTitle(TIT_PAG_DIRECTO)
    .setHelpText("Solo para quien estuvo en la clase en directo. Anónimo, como todo lo demás.");
  PUESTA_EN_ESCENA.forEach(function(q){ escala_(ft, q[0], q[1], q[2]); });   // 🔬 mismos ítems que en los PER ya creados
  pDir.setGoToPage(FormApp.PageNavigationType.SUBMIT);
  comoT.setChoices([comoT.createChoice(OPC_DIRECTO, pDir),
                    comoT.createChoice(OPC_DIFERIDO, FormApp.PageNavigationType.SUBMIT)]);
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
// v3.36 · Un enlace dentro de un ui.alert() NO se puede pulsar: Apps Script lo pinta como texto y
// hay que seleccionarlo a mano. Cada vez que el menú crea o pone al día un documento se enseña con
// este diálogo, que sí es pulsable y además deja el enlace listo para copiar. Lo usan los tres
// sitios que devuelven un documento, para que ninguno vuelva a desviarse.
function dialogoEnlace_(titulo, frase, url, etiqueta, pie) {
  var u = String(url || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  var html = HtmlService.createHtmlOutput(
      '<div style="font:14px/1.6 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;color:#202124">'
    + '<p style="margin:0 0 16px">' + frase + '</p>'
    + '<p style="margin:0 0 18px"><a href="' + u + '" target="_blank" rel="noopener" '
    +   'style="display:inline-block;background:#1a73e8;color:#fff;text-decoration:none;'
    +   'padding:10px 18px;border-radius:6px;font-weight:600">' + etiqueta + ' &#8599;</a></p>'
    + '<p style="margin:0 0 6px;color:#5f6368;font-size:12px">O copia el enlace:</p>'
    + '<input value="' + u + '" readonly onclick="this.select()" '
    +   'style="width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid #dadce0;'
    +   'border-radius:5px;font:12px ui-monospace,SFMono-Regular,Menlo,monospace;color:#3c4043">'
    + (pie ? '<p style="margin:16px 0 0;color:#5f6368;font-size:12.5px">' + pie + '</p>' : '')
    + '</div>').setWidth(470).setHeight(pie ? 275 : 220);
  SpreadsheetApp.getUi().showModalDialog(html, titulo);
}
function documentoPERSeleccionado() {
  var sh = hoja_(H.PERS); var fila = SpreadsheetApp.getActiveRange().getRow();
  if (SpreadsheetApp.getActiveSheet().getName() !== H.PERS || fila < 2) { SpreadsheetApp.getUi().alert("Selecciona una fila de la pestaña PERs."); return; }
  var perId = sh.getRange(fila, 1).getValue();
  var nom = String(sh.getRange(fila, 2).getValue() || perId);
  var url = crearDocumentoPER_(perId);
  dialogoEnlace_("STARGATE \u00b7 Documento del grupo",
    "Enlaces, embeds y QR de <b>" + nom.replace(/</g, "&lt;") + "</b>, al d\u00eda.",
    url, "Abrir el documento",
    "El enlace es <b>siempre el mismo</b>: si ya se lo pasaste a tu equipo, no hace falta repartirlo otra vez \u2014 se reescribe encima.");
}
// ================= LOS DOS BLOQUES DEL FORMULARIO =================
// Están aquí fuera porque los usan DOS caminos: crearPER (grupo nuevo) y estructuraBitacora_ (grupo
// que ya existe). Es la lección de siempre en este proyecto: el texto que se escribe en dos sitios
// se desincroniza a la primera.
function identidadBitacora_(fb, datos, id) {
  fb.addSectionHeaderItem().setTitle("Quién soy")
    .setHelpText("Esto es el ALISTAMIENTO y solo se hace una vez. Si ya te alistaste, no hace falta que lo repitas.");
  fb.addTextItem().setTitle("Alias de recluta (público)").setHelpText("Lo que se verá en el tablero. Solo la primera vez: si ya te alistaste, déjalo en blanco.").setRequired(false);
  fb.addTextItem().setTitle("Nombre y apellidos").setHelpText("Solo para el profesorado. Solo la primera vez.").setRequired(false);
  try { fb.addImageItem().setImage(UrlFetchApp.fetch(sinCache_(WEB + "assets/img/avatares/lamina_personajes.jpg")).getBlob()).setTitle(TIT_LAMINA).setHelpText("Los siete están disponibles desde el primer día: elige con calma, porque el personaje te acompaña TODO el viaje. Lo que cambia es su aspecto — Recluta → Cadete → Oficial → Comandante → Leyenda—, que se desbloquea al subir de nivel.").setAlignment(FormApp.Alignment.CENTER).setWidth(640); } catch (e) {}
  fb.addListItem().setTitle("Elige tu avatar").setHelpText(ayudaAvatar_())
    .setChoiceValues(opcIniciales_()).setRequired(false);
  fb.addListItem().setTitle(TIT_DOCENTE).setHelpText(AYUDA_DOCENTE).setRequired(true)
    .setChoiceValues(listaProfes_(datos.referente || "", datos.profesores || "", id));
  var bit = fb.addTextItem().setTitle("Enlace a mi Bitácora (ePortfolio)").setHelpText("Un único enlace donde está toda tu evidencia. Puedes añadirlo más adelante.");
  bit.setValidation(FormApp.createTextValidation().requireTextIsUrl().build());
  trucoGenially_(fb);
  fb.addParagraphTextItem().setTitle("Breve biografía de tu personaje").setHelpText("2-3 frases sobre tu recluta: quién es, de dónde viene, qué se le da bien. Aparecerá al pie de tu personaje en la Nave del Recluta.").setRequired(true);
}
// v3.37 · UN BLOQUE POR RETO: enunciado + casilla + su enlace. Antes era UNA casilla por planeta con
// todos los retos dentro y UN solo enlace: no se leía el enunciado de cada reto y no se sabía de cuál
// era la evidencia. 🔴 Los títulos son las COLUMNAS de la hoja: los fija tituloEvidenciaReto_ y el
// propio nombre del reto, y de ahí los lee marcados_(). No se cambian sin cambiar el lector.
// La imagen-guía del truco de Genially. La usan crearPER y estructuraBitacora_; si la web no
// responde, el formulario sigue sin la imagen (es ayuda, no requisito).
function trucoGenially_(fb) {
  try {
    if (fb.getItems(FormApp.ItemType.IMAGE).some(function(i){ return i.getTitle() === TIT_TRUCO; })) return;
    fb.addImageItem().setImage(UrlFetchApp.fetch(sinCache_(WEB + "assets/img/ayuda/genially_pagina.png")).getBlob())
      .setTitle(TIT_TRUCO)
      .setHelpText("En Genially, al pulsar Compartir, marca «Compartir desde esta página»: el enlace abrirá tu " +
        "Bitácora JUSTO por la página que quieras enseñar. Úsalo cuando un reto te pida el enlace de una sección concreta.")
      .setAlignment(FormApp.Alignment.CENTER).setWidth(480);
  } catch (e) { Logger.log("trucoGenially_: " + e); }
}
function retosDelPlaneta_(fb, retos, padletUrl) {
  (retos || []).forEach(function(r){
    var cb = fb.addCheckboxItem().setTitle(r[1]).setHelpText(ayudaReto_(r)).setRequired(false);
    ponerOpciones_(cb, [OPC_HECHO], r[1]);
    var ev = fb.addTextItem().setTitle(tituloEvidenciaReto_(r)).setHelpText(ayudaEvidenciaReto_(r, padletUrl)).setRequired(false);
    validarSecreto_(ev, r, true);
  });
}
// v3.41 · el huevo de Pascua se valida SOLO con Google Forms: la evidencia de S7 tiene que contener
// la palabra secreta (da igual mayúsculas). Sin servidor, sin trampas fáciles: el formulario dice
// «esa no es» hasta que la traen del enigma. La palabra vive en PALABRA_HUEVO (Datos.gs).
// `poner` es siempre true: se pide EXPLÍCITAMENTE porque la validación no se puede leer (Apps Script
// no tiene getValidation) y ponerla en cada pasada de la migración sería una escritura de más por
// formulario. Devuelve si ha escrito.
function validarSecreto_(ev, r, poner) {
  if ((EVIDENCIA_TIPO[r[0]] || "") !== "secreto") return false;
  if (poner === false) return false;
  try {
    ev.setValidation(FormApp.createTextValidation()
      .setHelpText("Esa no es la palabra que borró Vaeon. Sigue el enlace oculto y resuelve el enigma.")
      .requireTextContainsPattern("(?i)" + PALABRA_HUEVO).build());
    return true;
  } catch (e) { Logger.log("validarSecreto_: " + e); return false; }
}
// ================= v3.38 · PADLET (API) =================
// La clave (pdltp_...) del plan actual DEJA publicar chinchetas y leer tableros, pero NO crear ni
// borrar tableros (Padlet lo reserva a Zapier; comprobado el 30-ago). Por eso el padlet del grupo se
// crea a mano y aquí solo se guarda su URL — y, si hay clave, NEBULA publica una chincheta de
// bienvenida con las instrucciones. La clave vive en ScriptProperties, NUNCA en el código.
function guardarClavePadlet() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.prompt("Clave API de Padlet",
    "Pega la clave (empieza por pdltp_). Se usa solo para publicar la chincheta de bienvenida al " +
    "crear un PER con padlet. En blanco = quitarla.", ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var v = r.getResponseText().trim();
  var pr = PropertiesService.getScriptProperties();
  if (!v) { pr.deleteProperty("PADLET_KEY"); ui.alert("Clave quitada."); return; }
  if (v.indexOf("pdltp_") !== 0) { ui.alert("Eso no parece una clave de Padlet (empiezan por pdltp_). No se ha guardado."); return; }
  pr.setProperty("PADLET_KEY", v);
  ui.alert("Clave guardada. Al crear un PER con padlet, NEBULA publicará la chincheta de bienvenida.");
}
// «https://padlet.com/usuario/lo-que-sea-abc123» -> «abc123» (el id va siempre al final del slug)
function padletBoardId_(url) {
  var m = String(url || "").match(/padlet\.com\/[^\/]+\/(?:.*-)?([a-z0-9]{8,20})(?:[\/?#]|$)/i);
  return m ? m[1] : "";
}
// v3.40 · la chincheta también desde el menú: para el PER que ya existía cuando se configuró el
// padlet (CLASE DEMO), o si al crear falló la red. No duplica a ciegas: avisa y deja elegir.
function chinchetaPadlet() {
  var sel = filaPERSeleccionada_(); if (!sel) return; var ui = SpreadsheetUi_();
  if (!sel.o.padlet) { ui.alert("Este PER no tiene padlet en la columna 25. Pon primero su enlace."); return; }
  if (!PropertiesService.getScriptProperties().getProperty("PADLET_KEY")) {
    ui.alert("Falta la clave API (menú STARGATE → Clave API de Padlet)."); return; }
  if (ui.alert("Chincheta de bienvenida",
      "NEBULA publicará la chincheta con las normas del muro en el padlet de «" + sel.o.nombre + "». " +
      "Si ya la publicó otra vez, quedará repetida (bórrala a mano en Padlet). ¿Publicar?",
      ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  ui.alert(chinchetaBienvenida_(sel.o) ? "Publicada. Mírala en el padlet." :
    "No se ha podido publicar: revisa la clave y el enlace (detalle en el registro de ejecuciones).");
}
function SpreadsheetUi_() { return SpreadsheetApp.getUi(); }
function chinchetaBienvenida_(o) {
  var key = PropertiesService.getScriptProperties().getProperty("PADLET_KEY");
  var id = padletBoardId_(o.padlet);
  if (!key || !id) return false;
  var cuerpo = { data: { type: "post", attributes: { content: {
    subject: "\ud83d\udef0\ufe0f NEBULA \u00b7 Bienvenida, tripulaci\u00f3n de " + o.nombre,
    body: "Este muro es vuestro escaparate. Cuatro secciones, cuatro retos: \ud83d\udcf9 Pres\u00e9ntate \u00b7 " +
      "\ud83c\udfa8 La chispa \u00b7 \ud83c\udfb2 Ensaya jugando \u00b7 \ud83d\udee1\ufe0f Mi insignia. " +
      "Publica en la secci\u00f3n de tu reto con este formato: T\u00cdTULO = tu alias, y en la primera l\u00ednea " +
      "\u00abCapit\u00e1n: (tu profe)\u00bb. Despu\u00e9s copia el enlace de TU chincheta y p\u00e9galo en la " +
      "Bit\u00e1cora de mando como evidencia. Tu Nave: " + WEB + "recluta.html?per=" + o.id } } } };
  try {
    var resp = UrlFetchApp.fetch("https://api.padlet.dev/v1/boards/" + id + "/posts", {
      method: "post", contentType: "application/json", headers: { "X-Api-Key": key },
      payload: JSON.stringify(cuerpo), muteHttpExceptions: true });
    var cod = resp.getResponseCode ? resp.getResponseCode() : 200;
    if (cod >= 300) { Logger.log("chinchetaBienvenida_: HTTP " + cod + " " + resp.getContentText().slice(0, 200)); return false; }
    return true;
  } catch (e) { Logger.log("chinchetaBienvenida_: " + e); return false; }
}
function crearDocumentoPER_(perId) {
  var p = perFila_(perId); if (!p) throw new Error("PER no encontrado"); var o = perObj_(p.v);
  var ss = SpreadsheetApp.getActive();
  var carpeta = carpetaDelPER_(o.nombre, true);
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
  // v3.36 · EL DOCUMENTO, PARTIDO EN DOS MUNDOS. Petición de Norberto, 29-ago, leyéndolo en vivo:
  // «los docentes deben tener MUY CLARO qué enlaces se comparten con los estudiantes y cuáles son
  // solo para el profesorado». Tenía razón y era un fallo de verdad, no de redacción: bajo el título
  // «Para el Genially del alumnado» estaba el enlace de registro.html —que es la WEB DEL MÉTODO, con
  // la guía de instalación y el acceso con PIN— llamado «Tablero de reclutas». Quien lo repartiera
  // mandaba a su clase a la documentación del profesorado.
  //
  // La regla, escrita una vez y respetada abajo: el alumnado toca CINCO cosas —el Genially, los tres
  // formularios y la Nave—. Todo lo demás vive en la sección del profesorado, y las páginas que sí se
  // enseñan en clase se enseñan EMBEBIDAS dentro del Genially, nunca por su enlace suelto.
  var LINK_ALUMNO = "✅ SE COMPARTE CON EL ALUMNADO", LINK_PROFE = "🔒 SOLO PROFESORADO";
  h("1 · LO QUE SE COMPARTE CON EL ALUMNADO (y nada más)", 2);
  par("Son CINCO enlaces, y no hay un sexto. Todo lo que viene después de esta sección es del " +
      "profesorado: repartirlo manda al alumnado a la web del método o a una pantalla que le pide un PIN.");
  par("El orden en que lo usa el alumnado: 1) se alista en la Bitácora · 2) se ve en la Nave · " +
      "3) vuelve a la Bitácora a marcar lo que va completando. Todo lo demás cuelga de ahí.");
  var stdD = panelStd_();
  link(LINK_ALUMNO + " · 🪐 PANEL DE CONTROL (el Genially de los ocho planetas)",
       o.panelVer || stdD.ver || "(sin definir: menú STARGATE → Guardar panel de control estándar)");
  par(o.panelVer || o.panelEdit ? "Este grupo usa un panel PROPIO." :
      "Este grupo usa el panel ESTÁNDAR compartido. Si el profesorado quiere el suyo, se cambia desde " +
      "la sala de clase (Ajustes del PER). El enlace de EDICIÓN está más abajo, en la sección del profesorado: " +
      "no es el mismo y no se reparte.");
  link(LINK_ALUMNO + " · 📓 BITÁCORA DE MANDO — donde el alumnado se alista y registra sus retos (botón o QR)", o.formBitacora);
  par("Es el enlace que más se usa: el MISMO para alistarse y para registrar. Se rellena UNA vez " +
      "(alias, personaje, docente) y a partir de ahí se EDITA: cada semana entran, marcan los retos " +
      "que han completado y envían. Entran con su cuenta de Google, así que cada uno solo ve su " +
      "respuesta. El mismo enlace vale todo el curso.");
  par("⚠ Insísteles en que entren SIEMPRE con la misma cuenta de Google: el progreso se guarda en la " +
      "cuenta con la que envían, no en el correo que escriban. Quien se alista con una y vuelve con " +
      "otra no se encuentra en la Nave, y para entonces ya lleva media misión registrada.");
  qr(o.formBitacora, "QR de la Bitácora de mando");
  link(LINK_ALUMNO + " · 🚀 LA NAVE DEL RECLUTA — el hub del alumnado (su estado, las semanas, sus recompensas)",
       WEB + "recluta.html?per=" + o.id);
  par("Es la ÚNICA página web del sistema que se le da al alumnado. Aquí ve su personaje, sus xp, sus " +
      "créditos, lo que tiene desbloqueado y la orden de la semana; y desde aquí vuelve a la Bitácora. " +
      "Es también a donde va a parar al terminar el formulario.");
  qr(WEB + "recluta.html?per=" + o.id, "QR de la Nave del Recluta");
  if (o.padlet) {
    link(LINK_ALUMNO + " · 🧱 PADLET DE LA CLASE — el muro donde se comparten los retos", o.padlet);
    par("Formato «Muro con secciones», con cuatro: 📹 Preséntate (A0) · 🎨 La chispa (B1) · 🎲 Ensaya " +
        "jugando (A6) · 🛡️ Mi insignia (A7). Convención para saber quién es quién sin listas de clase: " +
        "el TÍTULO de cada chincheta es el alias del recluta y la primera línea dice «Capitán: (su profe)». " +
        "El formulario se lo recuerda reto a reto.");
  }
  link(LINK_ALUMNO + " · 🎫 TICKET DE SALIDA «Contacta con NEBULA» (anónimo; botón o QR)", o.formTicket);
  qr(o.formTicket, "QR del ticket de salida");
  link(LINK_ALUMNO + " · 🛒 CANJE DE CRÉDITOS (botón o QR)", o.formCanje);
  qr(o.formCanje, "QR del canje");

  h("2 · Para MONTAR el Genially del alumnado (códigos embed, no enlaces)", 2);
  par("Esto NO se reparte: se PEGA. En Genially, Insertar → Código embed, y ajustar al lienzo. " +
      "🔴 No repartas los enlaces sueltos de estas páginas: el tablero y el foro viven en la web del " +
      "profesorado, y desde ahí se llega a la guía de instalación y al acceso con PIN. Embebidos " +
      "dentro del Genially el alumnado ve solo lo suyo.");
  par("Embed de la Nave del Recluta:"); code(ifr(WEB + "recluta.html?per=" + o.id + "&embed=1", 900));
  par("Embed del ranking público — los tres rankings en vivo (xp, semana y colección) sin cabecera ni " +
      "botones. Al pulsar a un recluta se abre su ficha —personaje, biografía, nivel, xp, insignias y " +
      "cartas— y NO enseña ni los personajes ganados, ni los créditos, ni el correo: eso solo se ve en " +
      "la sala del docente, con PIN.");
  code(ifr(WEB + "registro.html?per=" + o.id + "&embed=1&solo=1", 720));
  par("Embed del tablero completo de reclutas:"); code(ifr(WEB + "registro.html?per=" + o.id + "&embed=1", 760));
  par("Embed del foro dinámico (la orden de la semana):"); code(ifr(WEB + "foro.html?per=" + o.id + "&embed=1", 640));

  h("3 · SOLO PROFESORADO — todo esto pide el PIN", 2);
  par("Ni uno de estos enlaces se comparte con el alumnado. Van en el Genially del equipo docente, o " +
      "en un marcador del navegador.");
  link(LINK_PROFE + " · Sala de clase (lo que requiere tu intervención, tu gente, el pase de lista)", WEB + "clase.html?per=" + o.id);
  link(LINK_PROFE + " · Panel del PER (alumnado, insignias, canjes y ajustes)", WEB + "profes.html?per=" + o.id);
  code(ifr(WEB + "profes.html?per=" + o.id + "&embed=1", 900));
  link(LINK_PROFE + " · Tickets de salida (visual)", WEB + "tickets.html?per=" + o.id);
  code(ifr(WEB + "tickets.html?per=" + o.id + "&embed=1", 900));
  par("Para filtrar los tickets por profesor/a, añade &profe=NOMBRE a la URL, o usa el generador de embeds.");
  link(LINK_PROFE + " · Generador de embeds del grupo", WEB + "embed.html?per=" + o.id);
  link(LINK_PROFE + " · Tablero y método (la web que explica el sistema, con la guía de instalación)", WEB + "registro.html?per=" + o.id);
  link(LINK_PROFE + " · Foro dinámico, como página suelta", WEB + "foro.html?per=" + o.id);
  link(LINK_PROFE + " · Panel de control, enlace de EDICIÓN del Genially",
       o.panelEdit || stdD.editar || "(sin definir)");

  h("4 · Solo el profesor referente", 2);
  par("Con esto se mueve el calendario de todo el grupo y se reescriben los formularios. No circula por el equipo.");
  link(LINK_PROFE + " · Hoja maestra", ss.getUrl());
  link(LINK_PROFE + " · Editar la Bitácora de mando", o.formBitacoraEdit);
  link(LINK_PROFE + " · Editar el ticket", o.formTicketEdit || "");
  doc.saveAndClose();
  var url = doc.getUrl(); hoja_(H.PERS).getRange(p.fila, 19).setValue(url); hoja_(H.PERS).getRange(1, 19).setValue("Documento de enlaces");
  return url;
}

// ================= DOSSIER DEL PROFESORADO (un documento con TODOS los grupos) =================
// v3.13 · Encargo del usuario: «cuando se cree un PER, un documento para el profesor referente con
// toda la información de todos los grupos de profesores, con enlaces, para enviarlo por mail y
// guardarlo». crearDocumentoPER_ es el documento DE UN GRUPO; esto es el mapa completo.
// Es SIEMPRE el mismo archivo (su id vive en las propiedades): así el enlace que ya tienen los
// profes no se rompe nunca. Se rehace al crear un PER, desde el menú y en la foto nocturna.
var PROP_DOSSIER = "DOSSIER_ID";

function dossierDoc_() {
  var pr = PropertiesService.getScriptProperties(), id = pr.getProperty(PROP_DOSSIER), doc = null;
  if (id) { try { doc = DocumentApp.openById(id); DriveApp.getFileById(id); } catch (e) { doc = null; } }
  if (!doc) {
    doc = DocumentApp.create("STARGATE · Dossier del profesorado");
    pr.setProperty(PROP_DOSSIER, doc.getId());
    try { var padres = DriveApp.getFileById(SpreadsheetApp.getActive().getId()).getParents();
          if (padres.hasNext()) DriveApp.getFileById(doc.getId()).moveTo(padres.next()); } catch (e) {}
  }
  return doc;
}
function dossier_() {
  var doc = dossierDoc_(), b = doc.getBody(), ss = SpreadsheetApp.getActive();
  b.clear();
  function h(t, n) { b.appendParagraph(t).setHeading(n === 1 ? DocumentApp.ParagraphHeading.HEADING1 : DocumentApp.ParagraphHeading.HEADING2); }
  function par(t) { b.appendParagraph(t); }
  function link(label, url) { var pr = b.appendParagraph(label + ": "); if (url) pr.appendText(url).setLinkUrl(url); else pr.appendText("(sin definir)"); }
  function qr(url, t) { if (!url) return; try { b.appendParagraph(t).setItalic(true);
      b.appendImage(UrlFetchApp.fetch("https://quickchart.io/qr?size=200&margin=2&dark=0e5f6c&text=" + encodeURIComponent(url)).getBlob()); } catch (e) {} }

  var pers = hoja_(H.PERS).getDataRange().getValues().slice(1).filter(function(v){ return v[0]; });
  var sello = Utilities.formatDate(new Date(), "Europe/Madrid", "dd/MM/yyyy HH:mm");

  b.appendParagraph("STARGATE · Dossier del profesorado").setHeading(DocumentApp.ParagraphHeading.HEADING1);
  par("Todos los grupos, sus equipos docentes y todos los enlaces, en una página. Generado el " + sello +
      " · " + pers.length + " grupo(s). Este documento se REESCRIBE solo (al crear un grupo y cada madrugada): " +
      "su enlace no cambia nunca, así que se puede guardar en marcadores y compartir sin miedo.");
  par("Si eres profesor/a y solo quieres una cosa: abre TU SALA DE CLASE (más abajo, en tu grupo). " +
      "Ahí tienes lo que requiere tu intervención, las dudas del ticket y tu grupo, sin abrir hojas ni Drive.");

  h("Lo común a todos los grupos", 2);
  link("Web de la misión", WEB);
  link("Guía del profesorado", WEB + "guia.html");
  link("Grupos (índice para el profesorado)", WEB + "grupos.html");
  link("Hoja maestra (materia prima; solo referente)", ss.getUrl());
  var idc = PropertiesService.getScriptProperties().getProperty(PROP_CONSOLA);
  link("Consola del profesorado (foto legible de todo)", idc ? "https://docs.google.com/spreadsheets/d/" + idc + "/edit" : "");
  par("El PIN del profesorado no se escribe aquí a propósito: lo reparte el referente. Se cambia en la hoja " +
      "maestra → menú STARGATE → Cambiar PIN del profesorado.");

  pers.forEach(function(v){
    var o = perObj_(v), sem = semanaDe_(o);
    var t = null; try { t = tablero_(o.id, true); } catch (e) { t = null; }
    var rec = t && t.reclutas ? t.reclutas : [];
    var sinDoc = rec.filter(function(x){ return !String(x.profe || "").trim(); }).length;

    h(o.nombre, 1);
    par("Tipo: " + o.tipo + " · Estado: " + (o.archivado ? "ARCHIVADO" : o.estado) +
        " · Semana 1: " + (o.inicio || "sin fecha") +
        (sem === null ? "" : (sem < 1 ? " · aún no ha empezado" : " · van por la semana " + sem)) +
        " · Reclutas: " + rec.length);
    if (sinDoc) par("⚠ " + sinDoc + " recluta(s) sin docente asignado: no le llegarán los avisos de sus canjes a nadie " +
                    "concreto. Se corrige en su ficha, desde la sala de clase (o pidiéndoles que editen su Bitácora).");

    h("Equipo docente", 2);
    var ds = docentesDe_(o.id);
    if (!ds.length) par("— sin equipo docente dado de alta —");
    ds.forEach(function(d){
      var rol = (esReferente_(d) && imparte_(d)) ? "referente · imparte" : (esReferente_(d) ? "referente (no imparte)" : "imparte");
      var alumnos = rec.filter(function(x){ return String(x.profe || "").trim() === d.nombre; }).length;
      par("· " + d.nombre + " — " + rol + " — " + (d.correo || "⚠ SIN CORREO (no recibirá ningún aviso)") +
          " — " + alumnos + " recluta(s)");
    });
    par("El equipo se edita en la pestaña DOCENTES de la hoja maestra o en el panel del profesorado → Ajustes del PER. " +
        "El rol es combinable: quien es referente y además da clase se marca con las dos casillas (nunca dos filas).");

    // v3.36 · las dos listas SEPARADAS y etiquetadas, igual que en el documento del grupo. El dossier
    // circula por todo el equipo docente: es justo el papel del que alguien copia un enlace y lo pega
    // en el Genially del alumnado. «Tablero de reclutas (alumnado)» apuntando a registro.html —que es
    // la web del método, con la instalación y el acceso con PIN— era una trampa esperando a que
    // alguien cayera.
    h("Lo que SE COMPARTE con el alumnado (y nada más)", 2);
    par("Cinco cosas: el Genially, los tres formularios y la Nave. Ni un enlace más.");
    link("✅ Panel de control · el Genially de los planetas (visualización)", o.panelVer || panelStd_().ver || "(sin definir)");
    link("✅ Bitácora de mando — donde el alumnado se alista y registra sus retos", o.formBitacora);
    link("✅ La Nave del Recluta — la única página web que ve el alumnado", WEB + "recluta.html?per=" + o.id);
    link("✅ Contacta con NEBULA · ticket de salida (anónimo)", o.formTicket);
    link("✅ Canje de recompensas", o.formCanje);
    if (o.padlet) link("✅ Padlet de la clase (el muro de los retos)", o.padlet);
    qr(o.formBitacora, "QR de la Bitácora de mando (para proyectar en clase)");

    h("Solo profesorado (pide PIN)", 2);
    par("El tablero y el foro se enseñan en clase EMBEBIDOS dentro del Genially, con el código que hay " +
        "en el documento del grupo. Sus enlaces sueltos llevan a la web del profesorado: no se reparten.");
    link("🔒 Sala de clase (para cada docente)", WEB + "clase.html?per=" + o.id);
    link("🔒 Panel del profesorado", WEB + "profes.html?per=" + o.id);
    link("🔒 Tickets de salida (visual)", WEB + "tickets.html?per=" + o.id);
    link("🔒 Tablero y método (la web que explica el sistema)", WEB + "registro.html?per=" + o.id);
    link("🔒 Foro dinámico, como página suelta", WEB + "foro.html?per=" + o.id + (o.inicio ? "&inicio=" + o.inicio + "&tipo=" + o.tipo : ""));
    link("🔒 Generador de embeds", WEB + "embed.html?per=" + o.id);
    link("🔒 Documento de enlaces y embeds del grupo", o.doc || "");

    h("Panel de control de Genially", 2);
    var std = panelStd_();
    link("Visualización (alumnado)", o.panelVer || std.ver);
    link("Edición (profesorado)", o.panelEdit || std.editar);
    par(o.panelVer || o.panelEdit ? "Este grupo usa un panel PROPIO." : "Este grupo usa el panel ESTÁNDAR compartido.");
  });

  h("Cómo se usa esto, en tres líneas", 2);
  par("1 · Cada docente entra en SU sala de clase con el PIN, elige su nombre una vez y ya no necesita nada más: " +
      "ahí ve lo que requiere su intervención, las dudas del ticket y su grupo, y corrige la ficha de un alumno.");
  par("2 · El referente usa la Consola del profesorado para la foto de todos los grupos, y la hoja maestra solo " +
      "cuando quiere la materia prima (o para el estudio).");
  par("3 · El sistema solo escribe correo cuando hace falta una PERSONA (canjes de nota). De insignias, cromos y " +
      "tickets no molesta a nadie: se miran cuando se quiere.");

  doc.saveAndClose();
  return dossierDoc_().getUrl();
}
function crearDossierProfesorado() {
  var ui = SpreadsheetApp.getUi();
  var url = dossier_();
  dialogoEnlace_("STARGATE · Dossier del profesorado",
    "El dossier con <b>todos los grupos</b>, sus equipos y sus enlaces, al día.",
    url, "Abrir el dossier",
    "El enlace es <b>siempre el mismo</b>: guárdalo y compártelo sin miedo.");
}
// Manda el enlace del dossier a todo el profesorado con correo, en UN solo mensaje.
function enviarDossier_() {
  var url = dossier_(), vistos = {}, enviados = [], sinCorreo = [], grupos = [];
  hoja_(H.PERS).getDataRange().getValues().slice(1).forEach(function(v){
    if (!v[0]) return;
    grupos.push(String(v[1]));
    docentesDe_(v[0]).forEach(function(d){
      if (d.correo) { if (!vistos[d.correo]) { vistos[d.correo] = true; enviados.push(d.correo); } }
      else if (sinCorreo.indexOf(d.nombre) < 0) sinCorreo.push(d.nombre);
    });
  });
  if (enviados.length) {
    try {
      MailApp.sendEmail(enviados.join(","), "STARGATE · Dossier del profesorado (todos los grupos)",
        "Aquí tienes el mapa completo de STARGATE: todos los grupos, sus equipos docentes y todos los enlaces.\n\n" +
        url + "\n\n" +
        "Grupos incluidos: " + grupos.join(" · ") + "\n\n" +
        "El enlace es SIEMPRE el mismo: el documento se reescribe solo cuando se crea un grupo y cada madrugada, " +
        "así que puedes guardarlo en marcadores.\n\n" +
        "Si solo quieres una cosa: abre TU sala de clase (está en tu grupo, dentro del dossier). Con el PIN, eliges " +
        "tu nombre una vez y ahí tienes lo que requiere tu intervención, las dudas del ticket y tu grupo.\n" +
        (sinCorreo.length ? "\n⚠ Sin correo en la pestaña DOCENTES (no reciben avisos): " + sinCorreo.join(", ") + "\n" : ""));
    } catch (e) { Logger.log("enviarDossier_: " + e); }
  }
  return { url: url, enviados: enviados, sinCorreo: sinCorreo };
}
function enviarDossierPorCorreo() {
  var ui = SpreadsheetApp.getUi();
  var previa = { enviados: [], sinCorreo: [] };
  hoja_(H.PERS).getDataRange().getValues().slice(1).forEach(function(v){
    if (!v[0]) return;
    docentesDe_(v[0]).forEach(function(d){
      if (d.correo) { if (previa.enviados.indexOf(d.correo) < 0) previa.enviados.push(d.correo); }
      else if (previa.sinCorreo.indexOf(d.nombre) < 0) previa.sinCorreo.push(d.nombre);
    });
  });
  if (!previa.enviados.length) {
    ui.alert("Nadie a quien mandarlo", "Ningún docente tiene correo en la pestaña DOCENTES. Ponlos ahí (o en " +
      "profes.html → Ajustes del PER) y vuelve a intentarlo.", ui.ButtonSet.OK); return;
  }
  if (ui.alert("Enviar el dossier por correo",
      "Se pondrá el dossier al día y se mandará el enlace a:\n\n" + previa.enviados.join("\n") +
      (previa.sinCorreo.length ? "\n\nSe quedan fuera (sin correo): " + previa.sinCorreo.join(", ") : "") +
      "\n\n¿Enviar?", ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  var r = enviarDossier_();
  ui.alert("Dossier enviado", "Enviado a " + r.enviados.length + " docente(s)." +
    (r.sinCorreo.length ? "\n\nSin correo (no lo han recibido): " + r.sinCorreo.join(", ") : "") +
    "\n\n" + r.url, ui.ButtonSet.OK);
}

// ================= CICLO DE VIDA DEL PER (archivar · borrar · resetear) =================
function filaPERSeleccionada_() {
  var sh = hoja_(H.PERS); var fila = SpreadsheetApp.getActiveRange().getRow();
  if (SpreadsheetApp.getActiveSheet().getName() !== H.PERS || fila < 2) {
    SpreadsheetApp.getUi().alert("Selecciona primero una fila de la pestaña PERs."); return null; }
  var v = sh.getRange(fila, 1, 1, 25).getValues()[0];
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
  // v3.36 · y sus registros se MUDAN. Es lo que de verdad quita el grupo de en medio: hasta hoy
  // EVENTOS y AJUSTES seguían mezclando los cursos viejos con los vivos para siempre.
  var movidas = 0;
  try { movidas = moverRegistros_(perId, arch); } catch (e) { Logger.log("moverRegistros_: " + e); }
  try { colorear_(); } catch (e) {}
  return movidas;
}
// Mueve las filas de UN PER entre EVENTOS/AJUSTES y su archivo (y al revés al desarchivar). De una
// tacada: leer, partir y reescribir. Nada de borrar fila a fila — con un curso entero eso son miles
// de llamadas y Apps Script se queda por el camino.
function moverRegistros_(perId, aArchivo) {
  var total = 0, sello = new Date();
  [[H.EV, H.EVA], [H.AJ, H.AJA]].forEach(function(par){
    var nomO = aArchivo ? par[0] : par[1], nomD = aArchivo ? par[1] : par[0];
    var aO = anchoDe_(nomO), aD = anchoDe_(nomD);
    var shO = hoja_(nomO); if (shO.getLastRow() < 2) return;
    var v = shO.getDataRange().getValues();
    var quedan = [], van = [];
    for (var i = 1; i < v.length; i++) {
      if (!v[i][0] && !v[i][1] && !v[i][2]) continue;                       // filas en blanco
      if (String(v[i][1]) === String(perId)) van.push(encajar_(v[i], aD, aArchivo ? sello : null));
      else quedan.push(encajar_(v[i], aO, null));
    }
    if (!van.length) return;
    var alto = shO.getLastRow() - 1;
    shO.getRange(2, 1, alto, Math.max(shO.getLastColumn(), aO)).clearContent();
    if (quedan.length) shO.getRange(2, 1, quedan.length, aO).setValues(quedan);
    var shD = hoja_(nomD);
    shD.getRange(shD.getLastRow() + 1, 1, van.length, aD).setValues(van);
    total += van.length;
  });
  return total;
}
// Una fila con el ancho EXACTO de la pestaña a la que va. Al archivar sobra un hueco al final y ahí
// se escribe la fecha; al desarchivar, ese hueco se cae solo con el recorte.
function encajar_(fila, ancho, sello) {
  var r = fila.slice(0, ancho);
  while (r.length < ancho) r.push("");
  if (sello) r[ancho - 1] = sello;
  return r;
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
  try { actualizarConsola(); } catch (e) {}   // que la consola no enseñe un PER que ya no existe
  ui.alert("PER «" + sel.o.nombre + "» borrado. Los formularios están en la papelera de Drive por si acaso.");
}
function borrarPER_(o, fila) {
  var ssB = SpreadsheetApp.getActive();
  var forms = formsDelPER_(o);
  // 1) primero las pestañas (desvinculando su formulario), porque una hoja vinculada no se puede borrar
  [o.tabB, o.tabT, o.tabC].forEach(function(n){ borrarHoja_(ssB, ssB.getSheetByName(n)); });
  // 2) después los formularios a la papelera
  forms.forEach(function(f){ try { DriveApp.getFileById(f.getId()).setTrashed(true); } catch (e) {} });
  if (o.doc) { try { DriveApp.getFileById(o.doc.match(/[-\w]{25,}/)[0]).setTrashed(true); } catch (e) {} }
  // la carpeta propia del PER (con lo que quede dentro) a la papelera
  try { var raizP = carpetaPER_(); var itP = raizP.getFoldersByName(o.nombre);
        if (itP.hasNext()) itP.next().setTrashed(true); } catch (e) {}
  // v3.36 · TODO lo del PER, incluido el archivo y —lo que faltaba— su equipo docente y su fila de
  // ALUMNADO. DOCENTES no se limpiaba desde ningún sitio: borrar un grupo dejaba ahí a su
  // profesorado para siempre, y de ahí salían los «residuos» de la hoja.
  [H.EV, H.AJ, H.EVA, H.AJA].forEach(function(n){ borrarFilasDe_(hoja_(n), o.id); });
  borrarFilasDe_(hoja_(H.DOC), o.id, 0);
  borrarFilasDe_(hoja_(H.ALU), o.id, 0);
  var props = PropertiesService.getScriptProperties();
  ScriptApp.getProjectTriggers().forEach(function(t){ if (props.getProperty("trg_" + t.getUniqueId()) === o.id) {
    props.deleteProperty("trg_" + t.getUniqueId()); ScriptApp.deleteTrigger(t); } });
  hoja_(H.PERS).deleteRow(fila);
}
// Quita de una pestaña TODAS las filas de un PER. `col` es dónde está el per: 1 (la segunda columna)
// en EVENTOS, AJUSTES y sus archivos; 0 en DOCENTES y ALUMNADO.
// v3.36 · se reescribe la pestaña de una vez en lugar de borrar fila a fila: con un curso entero,
// deleteRow en bucle son miles de llamadas y el borrado se quedaba a medias por tiempo.
function borrarFilasDe_(sh, perId, col) {
  col = col === undefined ? 1 : col;
  if (!sh || sh.getLastRow() < 2) return 0;
  var v = sh.getDataRange().getValues(), ancho = Math.max(sh.getLastColumn(), 1);
  var quedan = [], fuera = 0;
  for (var i = 1; i < v.length; i++) {
    if (String(v[i][col]) === String(perId)) { fuera++; continue; }
    if (!v[i].some(function(x){ return x !== "" && x !== null && x !== undefined; })) continue;
    quedan.push(encajar_(v[i], ancho, null));
  }
  if (!fuera) return 0;
  sh.getRange(2, 1, v.length - 1, ancho).clearContent();
  if (quedan.length) sh.getRange(2, 1, quedan.length, ancho).setValues(quedan);
  return fuera;
}
function restaurarRecompensas() {
  var ui = SpreadsheetApp.getUi();
  if (ui.alert("Restaurar el catálogo oficial de recompensas",
    "Sustituye la pestaña RECOMPENSAS por el catálogo oficial (precios en CRÉDITOS, no en xp):\n\n" +
    RECOMPENSAS_INICIALES.map(function(r){ return "· " + r[0] + " — " + r[1] + " ◈ (desde la semana " + r[4] + ")"; }).join("\n") + "\n\n" +
    "Se pierden los cambios manuales que hayas hecho en esa pestaña. ¿Continuar?", ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  restaurarRecompensas_();
  sellarCatalogo_();   // 🔬 deja en AJUSTES la hora y la versión del catálogo nuevo
  ui.alert("Catálogo restaurado. Ahora ejecuta «Actualizar formularios» para que los formularios de canje muestren los nuevos precios.");
}
function restaurarRecompensas_() {
  var rec = hoja_(H.REC); rec.clearContents();
  rec.getRange(1,1,1,6).setValues([["Recompensa","Coste (créditos)","Máx. por alumno","Descripción","Disponible desde (semana)","Tipo"]]);
  rec.getRange(2,1,RECOMPENSAS_INICIALES.length,6).setValues(RECOMPENSAS_INICIALES);
  rec.setFrozenRows(1);
}
// Formularios de PER que ya no existen en la hoja (p. ej. borrados con la versión anterior, que dejaba
// huérfano el de canje). Los manda a la papelera tras confirmar.
// Las imágenes de planeta se copian dentro del formulario al crear el PER, así que si cambia el arte
// (p. ej. el orbe de Sendara) hay que refrescarlas en los PER que ya existen.
function actualizarImagenesPlanetas() {
  var ui = SpreadsheetApp.getUi();
  if (ui.alert("Actualizar las imágenes de los formularios",
      "Vuelve a descargar de la web los ocho orbes de planeta Y la lámina de personajes, y los sustituye en la Bitácora de mando de todos los PER. Úsalo cuando cambie el arte.\n\n¿Continuar?",
      ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  var blobs = {}, cambiadas = 0, pers = 0, fallos = [];
  borrarOrbesCache_();   // v3.14 · si el arte ha cambiado, la copia de Drive ya no vale
  for (var t = 1; t <= 8; t++) {
    try { blobs[TEMAS[t][0]] = orbeBlob_(t); }
    catch (e) { fallos.push("Descargando " + TEMAS[t][0] + ": " + e.message); }
  }
  // 🔴 26-ago · la LÁMINA DE PERSONAJES no se refrescaba nunca. Se quedaba dentro de cada Bitácora
  // con el arte del día en que se creó el PER, y no había forma de cambiarla salvo rehacer el grupo.
  // Se vio con los umbrales de rango: la lámina llevaba incrustados los de antes de la v3.7
  // (Cadete 1.000 · Oficial 2.500…) cuando hoy son 700 · 1.650 · 3.450 · 5.000.
  try { blobs[TIT_LAMINA] = UrlFetchApp.fetch(sinCache_(WEB + "assets/img/avatares/lamina_personajes.jpg")).getBlob(); }
  catch (e) { fallos.push("Descargando la lámina de personajes: " + e.message); }
  hoja_(H.PERS).getDataRange().getValues().slice(1).forEach(function(v){
    if (!v[0]) return;
    var f = formDelPER_(perObj_(v), "B"); if (!f) { fallos.push(String(v[1]) + ": sin Bitácora accesible"); return; }
    pers++;
    f.getItems(FormApp.ItemType.IMAGE).forEach(function(it){
      var b = blobs[it.getTitle()];
      if (b) { try { it.asImageItem().setImage(b); cambiadas++; } catch (e) { fallos.push(String(v[1]) + " / " + it.getTitle() + ": " + e.message); } }
    });
  });
  ui.alert("Imágenes actualizadas",
    cambiadas + " imágenes sustituidas en " + pers + " PER." + (fallos.length ? "\n\nNo se pudo con:\n" + fallos.join("\n") : ""), ui.ButtonSet.OK);
}
// Los PER creados antes de la v3.3 tienen sus formularios sueltos en «Formularios PER»: esto los mete
// en una carpeta con el nombre de su PER.
function organizarCarpetasPER() {
  var ui = SpreadsheetApp.getUi();
  if (ui.alert("Organizar en carpetas por PER",
      "Cada PER pasará a tener su propia carpeta dentro de «Formularios PER», con sus 3 formularios y su documento de enlaces dentro.\n\n¿Continuar?",
      ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  var movidos = 0, pers = 0, fallos = [];
  hoja_(H.PERS).getDataRange().getValues().slice(1).forEach(function(v){
    if (!v[0]) return; var o = perObj_(v); pers++;
    var destino;
    try { destino = carpetaDelPER_(o.nombre, true); } catch (e) { fallos.push(o.nombre + ": " + e.message); return; }
    formsDelPER_(o).forEach(function(f){
      try { var file = DriveApp.getFileById(f.getId());
            if (file.getParents().next().getId() !== destino.getId()) { file.moveTo(destino); movidos++; } }
      catch (e) { fallos.push(o.nombre + " (formulario): " + e.message); } });
    if (o.doc) { try { var d = DriveApp.getFileById(o.doc.match(/[-\w]{25,}/)[0]);
                       if (d.getParents().next().getId() !== destino.getId()) { d.moveTo(destino); movidos++; } }
                 catch (e) { fallos.push(o.nombre + " (documento): " + e.message); } }
  });
  ui.alert("Carpetas organizadas",
    pers + " PER revisados, " + movidos + " archivos movidos a su carpeta." + (fallos.length ? "\n\nNo se pudo con:\n" + fallos.join("\n") : ""), ui.ButtonSet.OK);
}
function limpiarRestos() {
  var ui = SpreadsheetApp.getUi(); var ss = SpreadsheetApp.getActive();
  var filas = hoja_(H.PERS).getDataRange().getValues().slice(1);
  var vivosNombre = {}, vivosId = {};
  filas.forEach(function(v){ if (v[1]) vivosNombre[String(v[1]).trim()] = true; if (v[0]) vivosId[String(v[0]).trim()] = true; });
  // 1) formularios de PER que ya no existen -> guardamos ID y nombre (no el objeto: caduca durante el diálogo)
  var forms = [];
  function revisar_(carpeta) {
    var it = carpeta.getFilesByType(MimeType.GOOGLE_FORMS);
    while (it.hasNext()) { var f = it.next(); var nf = f.getName();
      if (nf.indexOf("STARGATE · ") !== 0 || nf.indexOf("PLANTILLA") >= 0) continue;
      var partes = nf.split(" · "); if (partes.length < 3) continue;
      if (!vivosNombre[partes[1].trim()]) forms.push({ id: f.getId(), nombre: nf }); }
  }
  var raizL = carpetaPER_(); revisar_(raizL);
  var subL = raizL.getFolders(); while (subL.hasNext()) { var cs = subL.next(); revisar_(cs); }
  // 2) pestañas de respuestas sin PER (incluidas las apartadas como «restos · …») y, v3.13, las
  // «Respuestas de formulario N» que dejó un crearPER caído a medias: nunca llegaron a renombrarse
  // a «B · id», así que la regla de arriba no las veía y se quedaban ahí para siempre.
  var tabs = [];
  ss.getSheets().forEach(function(sh){ var n = sh.getName();
    var m = n.match(/^(?:restos · )?([BTC]) · (.+?)(?: \(\d+\))?$/);
    if (m && !vivosId[m[2].trim()]) { tabs.push({ nombre: n, filas: Math.max(0, sh.getLastRow() - 1) }); return; }
    if (/^Respuestas de formulario\b/.test(n)) {
      var viva = false;
      try { var u = sh.getFormUrl(); if (u) { FormApp.openByUrl(u); viva = true; } } catch (e) {}
      if (!viva) tabs.push({ nombre: n, filas: Math.max(0, sh.getLastRow() - 1) });
    } });
  if (!forms.length && !tabs.length) { ui.alert("No hay restos: todos los formularios y pestañas pertenecen a un PER de la hoja."); return; }
  var lista = forms.map(function(x){ return "· [formulario] " + x.nombre; })
        .concat(tabs.map(function(x){ return "· [pestaña] " + x.nombre + " (" + x.filas + " respuestas)"; })).join("\n");
  if (ui.alert("Limpiar restos de PER borrados",
      "Esto no pertenece a ningún PER de la hoja:\n\n" + lista +
      "\n\nLos formularios irán a la papelera de Drive y las pestañas se BORRARÁN (con sus respuestas). ¿Continuar?",
      ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  // Se resuelve TODO de nuevo por id/nombre y los errores se muestran (nada de fallar en silencio)
  var okF = 0, okT = 0, errores = [];
  forms.forEach(function(x){
    try { DriveApp.getFileById(x.id).setTrashed(true); okF++; }
    catch (e) { errores.push("Formulario «" + x.nombre + "»: " + e.message); } });
  tabs.forEach(function(x){
    var err = borrarHoja_(ss, ss.getSheetByName(x.nombre));
    if (err) errores.push("Pestaña «" + x.nombre + "»: " + err); else okT++; });
  SpreadsheetApp.flush();
  ui.alert("Limpieza de restos",
    "Formularios a la papelera: " + okF + " de " + forms.length + "\nPestañas borradas: " + okT + " de " + tabs.length +
    (errores.length ? "\n\nNo se pudo con:\n" + errores.join("\n") : ""), ui.ButtonSet.OK);
}
// ================= v3.37 · ALUMNADO DE PRUEBA =================
// Reemplaza al pruebaSembrar del difunto Pruebas.gs, pero hecho para quedarse: vive en el repo, lo
// cubre la batería 39 y tiene la puerta que a aquel le faltaba (solo siembra en grupos DEMO/PRUEBA).
//
// No pasa por los formularios —la Bitácora admite una respuesta por cuenta de Google y las cuentas
// no existen—: escribe la identidad en la pestaña B y los retos en EVENTOS, que es exactamente lo
// que habría dejado el formulario. Las fechas se reparten con SEMANA_DEL_TEMA para que el ranking
// semanal, la racha y la «última actividad» cuenten una historia creíble, no un big bang de hoy.
var SIEMBRA_ALIAS = [["Vega","f"],["Orion","m"],["Lyra","f"],["Nix","m"],["Talia","f"],
                     ["Bruma","f"],["Cosmo","m"],["Runa","f"],["Halcon","m"],["Pixel","f"]];
function sembrarDemo() {
  var sel = filaPERSeleccionada_(); if (!sel) return; var ui = SpreadsheetApp.getUi();
  var nom = String(sel.o.nombre || "").toUpperCase();
  if (nom.indexOf("DEMO") < 0 && nom.indexOf("PRUEBA") < 0) {
    ui.alert("Este PER no parece de prueba",
      "Solo siembro en grupos cuyo nombre lleve DEMO o PRUEBA: «" + sel.o.nombre + "» no lo lleva.\n\n" +
      "Es la puerta que le faltaba al viejo Pruebas.gs, que creó un PER entero sin querer.", ui.ButtonSet.OK);
    return;
  }
  if (ui.alert("Sembrar alumnado de PRUEBA",
      "Añade " + SIEMBRA_ALIAS.length + " reclutas de mentira a «" + sel.o.nombre + "» (correos @reclutas.demo), " +
      "con progreso repartido desde la semana 1 hasta la actual. Los que ya estén sembrados no se duplican.\n\n¿Sembrar?",
      ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  var r = sembrarDemo_(sel.o.id);
  try { alumnado_(); } catch (e) {}
  ui.alert("Siembra hecha", r.nuevos + " reclutas nuevos (" + r.yaEstaban + " ya estaban) · " +
    r.eventos + " registros en EVENTOS.\n\nMíralos en el tablero o en la pestaña ALUMNADO.", ui.ButtonSet.OK);
}
function sembrarDemo_(perId) {
  var p = perFila_(perId); if (!p) throw new Error("PER no encontrado: " + perId);
  var o = perObj_(p.v);
  var sh = SpreadsheetApp.getActive().getSheetByName(o.tabB);
  if (!sh) throw new Error("El PER no tiene pestaña de Bitácora (" + o.tabB + ")");
  var cab = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0].map(String);
  var col = function(frag){ return idx_(cab, frag); };
  var cCorreo = col("dirección de correo") >= 0 ? col("dirección de correo") : col("email address");
  if (cCorreo < 0) throw new Error("La pestaña B no tiene la columna del correo de Google");
  var vivos = {};
  if (sh.getLastRow() > 1) sh.getDataRange().getValues().slice(1).forEach(function(v){
    var m = String(v[cCorreo] || "").toLowerCase().trim(); if (m) vivos[m] = true; });
  // el docente de cada recluta: se reparten entre quienes IMPARTEN, como hizo Norberto a mano el 28-ago
  var profes = docentesDe_(perId).filter(imparte_).map(function(d){ return d.nombre; });
  if (!profes.length) profes = [""];
  var semAhora = Math.max(1, Math.min(semanaDe_(o) || 1, semanasDe_(o.tipo)));
  var retos = retosDe_(o.tipo);
  var ini = new Date(o.inicio + "T12:00:00");
  var fecha = function(sem, dia){ var d = new Date(ini.getTime()); d.setDate(d.getDate() + (sem - 1) * 7 + (dia % 6)); 
    return d > new Date() ? new Date() : d; };
  var ev = hoja_(H.EV), filasEv = [], nuevos = 0, yaEstaban = 0;
  SIEMBRA_ALIAS.forEach(function(a, i){
    var email = "demo" + (i < 9 ? "0" : "") + (i + 1) + "@reclutas.demo";
    if (vivos[email]) { yaEstaban++; return; }
    nuevos++;
    // identidad en la pestaña B, por NOMBRE de columna (aguanta reordenaciones del formulario)
    var fila = []; while (fila.length < cab.length) fila.push("");
    var pon = function(frag, valor){ var c = col(frag); if (c >= 0) fila[c] = valor; };
    fila[cCorreo] = email;
    pon("marca temporal", fecha(1, i));
    pon("alias", a[0]);
    pon("apellidos", "Recluta de prueba " + (i + 1));
    pon("elige tu avatar", "Personaje " + ((i % 7) + 1) + " · " + (a[1] === "m" ? "él" : "ella") + " (evoluciona)");
    pon("quién imparte", profes[i % profes.length]);
    pon("biograf", "Recluta de siembra: existo para que el tablero tenga vida en las pruebas.");
    sh.appendRow(fila);
    // el viaje: el recluta i llega «hasta donde llega». 0 = solo alistado; el último lo lleva todo
    // lo abierto. El reparto da niveles distintos y un ranking con escalones, que es lo que se quiere ver.
    var hasta = Math.round(semAhora * i / (SIEMBRA_ALIAS.length - 1));       // en SEMANAS del calendario
    filasEv.push([fecha(1, i), o.id, email, a[0], "H1", "Reclutamiento", 0, XP_RECLUTAMIENTO, "siembra", ""]);
    retos.forEach(function(r){
      var t = r[4]; if (t > 8) return;                                       // la batalla final no se siembra
      var abre = SEMANA_DEL_TEMA[String(t)] || SEMANA_DEL_TEMA[t] || 99;
      if (abre > hasta) return;
      // dentro del tema, no todos lo hacen todo: al recluta le falta el último reto de su tema más alto
      if (abre === hasta && r[0].charAt(0) === "X" && i % 2) return;
      filasEv.push([fecha(abre, i + t), o.id, email, a[0], r[0], r[1], t, r[3], "siembra",
                    "https://view.genially.com/demo-" + a[0].toLowerCase() + "-" + r[0].toLowerCase()]);
    });
  });
  if (filasEv.length) ev.getRange(ev.getLastRow() + 1, 1, filasEv.length, 10).setValues(filasEv);
  return { nuevos: nuevos, yaEstaban: yaEstaban, eventos: filasEv.length };
}
function resetearHoja() {
  var ui = SpreadsheetApp.getUi();
  var pendiente = progreso_("reset");
  if (pendiente) {
    if (ui.alert("Reseteo a medias",
        "Hay un reseteo empezado (fase «" + pendiente.fase + "», " + pendiente.n + " PER borrados).\n\n" +
        "SÍ = terminarlo ahora · NO = olvidarlo y dejar la hoja como está.", ui.ButtonSet.YES_NO) !== ui.Button.YES) {
      guardarProgreso_("reset", null); cancelarContinuacion_("continuarReset");
      ui.alert("Reseteo abandonado. Lo que ya se borró no vuelve; el resto se queda."); return;
    }
  } else {
    var total = hoja_(H.PERS).getDataRange().getValues().slice(1).filter(function(v){ return v[0]; }).length;
    if (!total) { restaurarRecompensas_(); ui.alert("No había ningún PER. Catálogo de recompensas restaurado."); return; }
    var r = ui.prompt("Resetear la hoja",
      "Deja la hoja como recién instalada: borra los " + total + " PER (sus formularios y documentos a la papelera y " +
      "sus pestañas de respuestas) y VACÍA todas las pestañas de datos, sin dejar residuos:\n" +
      hojasDeDatos_().join(" · ") + ".\n\nTambién restaura el catálogo de recompensas.\n\n" +
      "⚠ Eso incluye el EQUIPO DOCENTE (pestaña DOCENTES): es gente que pertenece a esos grupos, y " +
      "dejarla ahí era justo el residuo que había que quitar.\n\n" +
      "🔬 SE CONSERVA CONSENTIMIENTO: quién autorizó que sus datos se usen para investigar. Los grupos " +
      "van y vienen; esa autorización, no — y sin ella un paper se queda sin respaldo. Si algún día " +
      "quieres vaciarla, se hace a mano.\n\n" +
      "SE CONSERVAN ADEMÁS: los dos PIN, la URL del web app, el panel de control estándar y las plantillas.\n\n" +
      "Si hay muchos grupos tardará más de lo que Apps Script permite de una vez: no pasa nada, sigue solo por lotes.\n\n" +
      "Escribe RESETEAR para confirmar:", ui.ButtonSet.OK_CANCEL);
    if (r.getSelectedButton() !== ui.Button.OK || r.getResponseText().trim().toUpperCase() !== "RESETEAR") { ui.alert("Cancelado: nada se ha borrado."); return; }
  }
  var x = resetear_();
  ui.alert(x.terminado ? "Hoja reseteada" : "Reseteo en marcha (va por lotes)",
    (x.terminado ? "Listo. " : "Va por la fase «" + x.fase + "» y sigue SOLO dentro de un minuto. ") +
    x.n + " PER borrados" + (x.sueltos ? ", " + x.sueltos + " formularios a la papelera" : "") +
    (x.tabs ? ", " + x.tabs + " pestañas sueltas borradas" : "") +
    (x.terminado ? ". Catálogo de recompensas restaurado." : ".") +
    (x.fallos.length ? "\n\nNo se pudo con:\n" + x.fallos.slice(0, 12).join("\n") : ""), ui.ButtonSet.OK);
}
// v3.13 · El reseteo, por fases y sin interfaz. Cada pasada hace AL MENOS una unidad de trabajo
// (si no, con muchos PER nunca avanzaría) y deja escrito por dónde iba.
function resetear_() {
  var t = reloj_();
  var pr = progreso_("reset") || { fase: "per", n: 0, sueltos: 0, tabs: 0, fallos: [] };
  var sh = hoja_(H.PERS), ss = SpreadsheetApp.getActive();

  // fase 1 · los PER, de uno en uno (borrarPER_ borra su fila: siempre vamos a por el primero)
  while (pr.fase === "per") {
    var d = sh.getDataRange().getValues(), fila = 0;
    for (var i = 1; i < d.length; i++) if (d[i][0]) { fila = i + 1; break; }
    if (!fila) { pr.fase = "colas"; break; }
    try { borrarPER_(perObj_(sh.getRange(fila, 1, 1, 25).getValues()[0]), fila); pr.n++; }
    catch (e) { pr.fallos.push("PER fila " + fila + ": " + e.message); Logger.log(e);
                try { sh.deleteRow(fila); } catch (e2) {} }   // pase lo que pase, la fila SE VA: si no, bucle infinito
    t.marcar();
    if (!t.puedo()) break;
  }
  // fase 2 · registros y catálogo
  if (pr.fase === "colas" && t.puedo()) {
    // v3.36 · TODAS las pestañas de datos, de la lista de hojasDeDatos_(). Antes solo se vaciaban
    // EVENTOS y AJUSTES, así que un reseteo dejaba atrás el equipo docente, los consentimientos y
    // —cuando existían— las fichas de alumnado: residuos de gente y grupos que ya no existen.
    hojasDeDatos_().forEach(function(nom){ try { vaciarHoja_(nom); } catch (e) { pr.fallos.push(nom + ": " + e.message); } });
    restaurarRecompensas_();
    pr.fase = "sueltos"; t.marcar();
  }
  // fase 3 · formularios sueltos en Drive
  if (pr.fase === "sueltos" && t.puedo()) {
    if (!pr.ids) {
      pr.ids = [];
      try { var it = carpetaPER_().getFilesByType(MimeType.GOOGLE_FORMS);
            while (it.hasNext()) { var f = it.next(); var nf = f.getName();
              if (nf.indexOf("STARGATE · ") === 0 && nf.indexOf("PLANTILLA") < 0) pr.ids.push({ id: f.getId(), nombre: nf }); } }
      catch (e) { pr.fallos.push("Listando formularios: " + e.message); }
    }
    while (pr.ids.length) {
      var y = pr.ids.shift();
      try { DriveApp.getFileById(y.id).setTrashed(true); pr.sueltos++; } catch (e) { pr.fallos.push(y.nombre + ": " + e.message); }
      t.marcar(); if (!t.puedo()) break;
    }
    if (!pr.ids.length) { pr.fase = "tabs"; delete pr.ids; }
  }
  // fase 4 · pestañas de respuestas huérfanas (el resto del fallo del 25-ago)
  if (pr.fase === "tabs" && t.puedo()) {
    var nombres = ss.getSheets().map(function(h){ return h.getName(); })
                    .filter(function(n){ return /^(?:restos · )?[BTC] · /.test(n) || /^Respuestas de formulario/.test(n); });
    while (nombres.length) {
      var n2 = nombres.shift();
      var err = borrarHoja_(ss, ss.getSheetByName(n2));
      if (err) pr.fallos.push(n2 + ": " + err); else pr.tabs++;
      t.marcar(); if (!t.puedo()) break;
    }
    if (!nombres.length) pr.fase = "foto";
  }
  // fase 5 · dejar la foto del profesorado coherente con lo que queda (nada)
  if (pr.fase === "foto" && t.puedo()) {
    SpreadsheetApp.flush();
    try { consolidarDatos(); } catch (e) { pr.fallos.push("DATOS: " + e.message); }
    try { actualizarConsola(); } catch (e) { pr.fallos.push("Consola: " + e.message); }
    try { dossier_(); } catch (e) { pr.fallos.push("Dossier: " + e.message); }
    try { colorear_(); } catch (e) { pr.fallos.push("Colores: " + e.message); }
    pr.fase = "fin"; t.marcar();
  }
  var terminado = pr.fase === "fin";
  if (terminado) { guardarProgreso_("reset", null); cancelarContinuacion_("continuarReset"); }
  else { guardarProgreso_("reset", pr); programarContinuacion_("continuarReset"); }
  return { terminado: terminado, fase: pr.fase, n: pr.n, sueltos: pr.sueltos, tabs: pr.tabs, fallos: pr.fallos };
}
// v3.13 · Termina el acabado de un PER recién creado cuando crearPER se quedó sin tiempo.
// Sin interfaz: lo dispara un trigger, y un trigger no tiene ventanas.
function continuarAltaPER() {
  var pr = progreso_("alta");
  if (!pr) { cancelarContinuacion_("continuarAltaPER"); return; }
  var p = perFila_(pr.per);
  if (!p) { guardarProgreso_("alta", null); cancelarContinuacion_("continuarAltaPER"); return; }  // lo borraron
  var o = perObj_(p.v), t = reloj_();
  if (pr.imagenes) {
    try { var im = imagenesFormularios_(formDelPER_(o, "B"), formDelPER_(o, "T"), formDelPER_(o, "C"));
          pr.imagenes = im.faltan > 0; }
    catch (e) { Logger.log("continuarAltaPER imagenes: " + e); }
    t.marcar();
  }
  if (pr.doc && t.puedo()) { try { crearDocumentoPER_(pr.per); pr.doc = false; } catch (e) { Logger.log("continuarAltaPER doc: " + e); } t.marcar(); }
  if (pr.dossier && t.puedo()) { try { dossier_(); pr.dossier = false; } catch (e) { Logger.log("continuarAltaPER dossier: " + e); } t.marcar(); }
  if (pr.imagenes || pr.doc || pr.dossier) { guardarProgreso_("alta", pr); programarContinuacion_("continuarAltaPER"); }
  else { guardarProgreso_("alta", null); cancelarContinuacion_("continuarAltaPER"); Logger.log("continuarAltaPER: acabado del PER " + pr.per + " completo"); }
}
function continuarReset() {
  var r = resetear_();
  Logger.log("continuarReset: fase " + r.fase + " · " + r.n + " PER" + (r.terminado ? " · TERMINADO" : " · sigue"));
}

// ================= TAREAS LARGAS: LOTES CON CONTINUACIÓN =================
// v3.13 · Apps Script corta a los 6 minutos. Las tareas que recorren TODOS los PER (resetear la
// hoja y actualizar los formularios) lo agotaban y dejaban el trabajo A MEDIAS —de ahí la pestaña
// huérfana «Respuestas de formulario 4» y los 0 PER del 25-ago—. Ahora se trocean: cada pasada hace
// lo que le cabe, guarda por dónde iba en las propiedades del script y programa su continuación.
// Regla de oro: SIEMPRE se hace al menos una unidad de trabajo por pasada, para que nunca se atasque.
var MARGEN_MS = 270000;          // 4,5 min de trabajo efectivo; el resto es margen para cerrar
// 🔴 30-ago · Y un colchón para las tareas ATÓMICAS: las que, una vez empezadas, no saben pararse a
// medias (rehacer el formulario de canje, poner al día el del ticket). Empezar una a los 4 minutos y
// medio se comía el margen de cierre entero y rozaba el corte duro de los 6 minutos. Con esto solo
// se empiezan si quedan al menos 90 s de trabajo efectivo por delante.
var MARGEN_FASE_MS = 90000;
var PROP_TAREA = "TAREA_";

function reloj_() { var t0 = new Date().getTime(), algo = false, ultimo = t0;
  return { marcar: function(){ algo = true; },
           puedo: function(){ return !algo || (new Date().getTime() - t0 < MARGEN_MS); },
           // ¿queda al menos `ms` de margen para meterse en una tarea que dura eso?
           sobra: function(ms){ return (new Date().getTime() - t0) < (MARGEN_MS - (ms || 0)); },
           ms: function(){ return new Date().getTime() - t0; },
           // deja en el registro cuánto costó cada tramo: es la única forma de saber por qué
           // una ejecución se acerca a los 6 minutos sin ponerse a adivinar
           hito: function(txt){ var n = new Date().getTime();
             Logger.log("· " + txt + ": " + (n - ultimo) + " ms (total " + (n - t0) + " ms)"); ultimo = n; } }; }
function progreso_(clave) {
  var s = PropertiesService.getScriptProperties().getProperty(PROP_TAREA + clave);
  if (!s) return null; try { return JSON.parse(s); } catch (e) { return null; }
}
function guardarProgreso_(clave, o) {
  var pr = PropertiesService.getScriptProperties();
  if (o) pr.setProperty(PROP_TAREA + clave, JSON.stringify(o)); else pr.deleteProperty(PROP_TAREA + clave);
}
function cancelarContinuacion_(fn) {
  ScriptApp.getProjectTriggers().forEach(function(t){ if (t.getHandlerFunction() === fn) { try { ScriptApp.deleteTrigger(t); } catch (e) {} } });
}
function programarContinuacion_(fn) {
  cancelarContinuacion_(fn);   // nunca más de uno: los triggers son un recurso limitado
  try { ScriptApp.newTrigger(fn).timeBased().after(60000).create(); }
  catch (e) { Logger.log("programarContinuacion_ " + fn + ": " + e); }
}
// Correo al que avisar cuando no hay nadie más a quien avisar (ver avisarDocente_).
// 🔴 A PROPÓSITO no se usa el servicio Session para saber quién ejecuta: pide un permiso OAuth
// NUEVO (userinfo.email) y eso obliga a TODO el mundo a volver a autorizar el script al abrir la
// hoja. El dueño de la hoja se saca con el permiso de Drive, que ya está concedido.
function correoDeReserva_() {
  var pr = PropertiesService.getScriptProperties().getProperty("CORREO_AVISOS");
  if (pr) return String(pr).trim();
  try { var o = SpreadsheetApp.getActive().getOwner(); if (o && o.getEmail()) return o.getEmail(); } catch (e) {}
  // último recurso: el correo de un profesorado referente cualquiera que sí lo tenga
  try {
    var todos = hoja_(H.DOC).getDataRange().getValues().slice(1)
      .filter(function(v){ return String(v[2] || "").trim() && String(v[3] || "").indexOf("referente") >= 0; });
    if (todos.length) return String(todos[0][2]).trim();
  } catch (e2) {}
  return "";
}
// v3.15 · CUOTA DE CORREO. Una cuenta gratuita manda 100 correos al dia: con varios grupos y la
// ultima semana de canjes eso se toca, y hasta ahora el correo simplemente NO SALIA sin avisar a
// nadie. Se consulta UNA vez por ejecucion (getRemainingDailyQuota tambien cuesta tiempo) y se va
// descontando lo que se manda.
var _cuota = null;
function cuotaCorreo_() {
  if (_cuota === null) { try { _cuota = Number(MailApp.getRemainingDailyQuota()); } catch (e) { _cuota = 1; } }
  return _cuota;
}
function gastarCuota_(n) { if (_cuota !== null) _cuota = Math.max(0, _cuota - (n || 1)); }
// Manda un correo respetando la cuota. Devuelve true si salio. Si no hay cuota deja traza en
// AJUSTES: el parte de salud la ve, y asi el fallo deja de ser invisible.
// v3.18 · el ULTIMO motivo por el que un correo no salio. Lo mira el vigia: sin esto, un envio que
// revienta se traga la excepcion y no queda rastro en ningun sitio.
var _falloCorreo = "";
function enviarCorreo_(para, asunto, cuerpo, perId, email) {
  if (!para) { _falloCorreo = "no hay a quien escribir (falta el correo de avisos de reserva)"; return false; }
  if (cuotaCorreo_() <= 0) {
    try { hoja_(H.AJ).appendRow([new Date(), perId || "", email || "", "ERROR", "cuota",
      "sin cuota de correo: no se envio «" + asunto + "» a " + para, "sistema"]); } catch (e) {}
    _falloCorreo = "sin cuota de correo";
    return false;
  }
  try { MailApp.sendEmail(para, asunto, cuerpo); gastarCuota_(1); avisarCuotaBaja_(); _falloCorreo = ""; return true; }
  catch (e) { _falloCorreo = String(e && e.message ? e.message : e);
              Logger.log("enviarCorreo_ (" + asunto + "): " + e); return false; }
}
// Cuando queda poco, un aviso AL DIA al correo de reserva. Sin la guarda, una tanda de canjes
// mandaria el aviso una vez por canje y se comeria justo la cuota que queda.
function avisarCuotaBaja_() {
  var q = cuotaCorreo_();
  if (q >= 20 || q <= 0) return;
  var pr = PropertiesService.getScriptProperties();
  var clave = "CUOTA_AVISADA_" + Utilities.formatDate(new Date(), "Europe/Madrid", "yyyy-MM-dd");
  if (pr.getProperty(clave)) return;
  pr.setProperty(clave, "1");
  var r = correoDeReserva_(); if (!r) return;
  try {
    MailApp.sendEmail(r, "STARGATE · se acaba la cuota de correo (" + q + ")",
      "Al script le quedan " + q + " correos hoy. Cuando llegue a cero:\n\n" +
      "· los canjes se siguen resolviendo y cobrando con normalidad (el correo es un extra),\n" +
      "· pero ni el alumnado ni el profesorado reciben aviso, y quedara traza en la pestana AJUSTES.\n\n" +
      "La cuota se repone sola manana. Puedes ver el estado en: menu STARGATE -> Parte de salud del sistema.");
    gastarCuota_(1);
  } catch (e) { Logger.log("avisarCuotaBaja_: " + e); }
}
function guardarCorreoAvisos() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.prompt("Correo de avisos de reserva",
    "A este correo llegan los avisos que no tienen destinatario (p. ej. un canje de nota concedido en un grupo cuyo equipo docente no tiene correos).\n\nDéjalo vacío para usar el de la cuenta que ejecuta el script.",
    ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var v = r.getResponseText().trim();
  if (v) PropertiesService.getScriptProperties().setProperty("CORREO_AVISOS", v);
  else PropertiesService.getScriptProperties().deleteProperty("CORREO_AVISOS");
  ui.alert("Guardado. Los avisos sin destinatario irán a: " + (v || correoDeReserva_() || "(nadie: revisa los permisos)"));
}

// ================= TRIGGERS =================
function asegurarTriggers_() {
  // v3.14 · VISTO EN VIVO: había DOS triggers alRecibirRespuesta y cada envío se procesaba dos veces
  // (dos ejecuciones, dos correos posibles, el doble de trabajo). Comprobar «existe al menos uno» no
  // basta: hay que dejar EXACTAMENTE uno de cada.
  var vistos = {};
  ScriptApp.getProjectTriggers().forEach(function(t){
    var fn = t.getHandlerFunction();
    if (fn !== "alRecibirRespuesta" && fn !== "fotoNocturna") return;
    if (vistos[fn]) { try { ScriptApp.deleteTrigger(t); Logger.log("trigger duplicado eliminado: " + fn); } catch (e) {} }
    else vistos[fn] = true;
  });
  var fns = Object.keys(vistos);
  if (fns.indexOf("alRecibirRespuesta") < 0)
    ScriptApp.newTrigger("alRecibirRespuesta").forSpreadsheet(SpreadsheetApp.getActive()).onFormSubmit().create();
  // La foto (DATOS/RESUMEN y la Consola) se rehace de madrugada, no en cada envío: recorrer todos los
  // PER es caro y nada del juego depende de ella. También se puede forzar desde el menú.
  if (fns.indexOf("fotoNocturna") < 0)
    ScriptApp.newTrigger("fotoNocturna").timeBased().atHour(4).everyDays(1).create();
}
function fotoNocturna() {
  try { consolidarDatos(); } catch (e) { Logger.log("consolidarDatos: " + e); }
  // v3.36 · ALUMNADO se rehace aquí (y pinta la hoja al terminar): así por la mañana está al día sin
  // que nadie toque el menú, igual que la Consola y el dossier.
  try { alumnado_(); } catch (e) { Logger.log("alumnado_: " + e); }
  try { actualizarConsola(); } catch (e) { Logger.log("actualizarConsola: " + e); }
  try { dossier_(); } catch (e) { Logger.log("dossier_: " + e); }
  try { repartirBonusTripulacion_(); } catch (e) { Logger.log("bonus tripulacion: " + e); }
  try { avisoCierreCanje(); } catch (e) { Logger.log("avisoCierreCanje: " + e); }
  // el ultimo, y a proposito: si algo de lo de arriba deja el sistema tocado, el vigia lo ve HOY
  try { vigiaDiario(); } catch (e) { Logger.log("vigiaDiario: " + e); }
}
// v3.15 · SE ACABA EL CANJE (§12.8). La última semana ya no se gana nada: solo se gasta lo ganado, y
// quien llega con 200 ◈ sin tocar los pierde. La fecha se ve en la Nave, pero nadie te da un toque.
// Cuelga de fotoNocturna a propósito: ni un trigger nuevo que instalar, mantener o duplicar.
// Ventana de aviso, en días antes del cierre. Es «como muy tarde», no «ese día exacto».
var AVISO_CIERRE_DIAS = [7, 1];
function avisoCierreCanje() {
  var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  var pr = PropertiesService.getScriptProperties();
  var enviados = 0, grupos = 0;
  hoja_(H.PERS).getDataRange().getValues().slice(1).forEach(function(v){
    if (!v[0] || v[21]) return;                       // ni filas vacías ni grupos archivados
    var o = perObj_(v);
    var cierre = o.cierreCanje || o.cierre; if (!cierre) return;
    var fin = new Date(String(cierre) + "T00:00:00"); if (isNaN(fin.getTime())) return;
    var faltan = Math.round((fin.getTime() - hoy.getTime()) / 864e5);
    if (faltan < 0) return;                              // ya cerró: avisar ahora sería una broma
    // 🔴 REVISIÓN 26-ago · VENTANA, no día exacto. Con un umbral exacto (faltan === 7), el día que
    // Google se salta la ejecución nocturna —o que no queda cuota— el aviso se pierde PARA SIEMPRE.
    // Con «faltan <= umbral» se recupera al día siguiente, y la marca en propiedades impide repetir.
    // Se coge el umbral MÁS PEQUEÑO que aplique: si alguien llega directo al último día, recibe un
    // solo correo con el plazo de verdad, no uno por cada umbral que se saltó.
    var umbral = null;
    AVISO_CIERRE_DIAS.slice().sort(function(a, b){ return a - b; }).forEach(function(u){
      if (umbral === null && faltan <= u && !pr.getProperty("AVISO_CANJE_" + o.id + "_" + u)) umbral = u;
    });
    if (umbral === null) return;
    var t = tablero_(o.id, true); if (!t || !t.reclutas) return;
    var mandados = 0, conSaldo = 0;
    t.reclutas.forEach(function(al){
      if (!al.email || !(al.creditos > 0)) return;       // a quien ya lo gastó todo no se le molesta
      conSaldo++;
      var dias = faltan === 1 ? "1 día" : faltan === 0 ? "hoy mismo" : faltan + " días";
      var cuerpo = "Te quedan " + al.creditos + " ◈ y " + dias + " para canjearlos. Después ya no se pueden gastar.\n\n" +
        "Grupo: " + o.nombre + "\n" +
        "El canje cierra el " + cierre + ". Los xp y tu nivel no se tocan: lo que caduca es el bolsillo.\n\n" +
        "Mira lo que puedes llevarte y cuánto cuesta, en tu Nave:\n" + WEB + "recluta.html?per=" + o.id + "\n" +
        (o.formCanje ? "Y canjea aquí:\n" + o.formCanje + "\n" : "");
      if (enviarCorreo_(al.email, "STARGATE · te quedan " + al.creditos + " ◈ y " + dias +
          " para gastarlos", cuerpo, o.id, al.email)) { enviados++; mandados++; }
    });
    // 🔴 Se marca DESPUÉS, y solo si de verdad salió algo (o si no había a quién avisar). Marcarlo
    // antes hacía que un día sin cuota se comiera el aviso para siempre.
    if (mandados || !conSaldo) {
      grupos++;
      // ya no tiene sentido avisar de «quedan 7 días» cuando quedaba 1: se cierran también los mayores
      AVISO_CIERRE_DIAS.forEach(function(u){
        if (u >= umbral) pr.setProperty("AVISO_CANJE_" + o.id + "_" + u, fechaIso_(hoy));
      });
    }
  });
  if (enviados) Logger.log("avisoCierreCanje: " + enviados + " avisos en " + grupos + " grupos");
  return { enviados: enviados, grupos: grupos };
}
function programar_(fn, fecha, perId) {
  var t = ScriptApp.newTrigger(fn).timeBased().at(fecha).create();
  PropertiesService.getScriptProperties().setProperty("trg_" + t.getUniqueId(), perId);
}
function abrirPorTrigger(e) { porTrigger_(e, true); }
function cerrarPorTrigger(e) { porTrigger_(e, false); }                       // cierra TODO (fin del canje)
function cerrarMisionesPorTrigger(e) { porTrigger_(e, false, ["B", "T"]); }   // v3.14 · el canje sigue abierto
function porTrigger_(e, abrir, cuales) {
  var props = PropertiesService.getScriptProperties(); var perId = props.getProperty("trg_" + e.triggerUid); if (!perId) return;
  setAbierto_(perId, abrir, cuales); props.deleteProperty("trg_" + e.triggerUid);
  ScriptApp.getProjectTriggers().forEach(function(t){ if (t.getUniqueId() === e.triggerUid) ScriptApp.deleteTrigger(t); });
}
// v3.14 · `cuales` = qué formularios se tocan ("B" Bitácora · "T" ticket · "C" canje). Sin él, los tres.
// El estado de la fila refleja lo que hay de verdad, no lo que se pidió: con las misiones cerradas y
// el canje abierto pone «Solo canje», que es exactamente la última semana del viaje.
function setAbierto_(perId, abrir, cuales) {
  var p = perFila_(perId); if (!p) return; var o = perObj_(p.v);
  cuales = cuales && cuales.length ? cuales : ["B", "T", "C"];
  var estado = {};
  ["B", "T", "C"].forEach(function(c){
    var f = null; try { f = formDelPER_(o, c); } catch (e) {}
    if (!f) { estado[c] = null; return; }
    if (cuales.indexOf(c) >= 0) { try { if (abrir) publicar_(f); f.setAcceptingResponses(abrir); } catch (e) {} }
    try { estado[c] = f.isAcceptingResponses(); } catch (e) { estado[c] = null; }
  });
  var abiertos = ["B", "T", "C"].filter(function(c){ return estado[c] === true; });
  hoja_(H.PERS).getRange(p.fila, 8).setValue(
    abiertos.length === 3 ? "Abierto" :
    abiertos.length === 0 ? "Cerrado" :
    (abiertos.length === 1 && abiertos[0] === "C") ? "Solo canje" : "Parcial");
}
// v3.14 · Rehace los avisos programados de un PER (al cambiar la fecha de la semana 1, por ejemplo).
function reprogramarPER_(perId) {
  var p = perFila_(perId); if (!p) return null; var o = perObj_(p.v);
  var props = PropertiesService.getScriptProperties();
  ScriptApp.getProjectTriggers().forEach(function(t){
    var fn = t.getHandlerFunction();
    if (["abrirPorTrigger", "cerrarPorTrigger", "cerrarMisionesPorTrigger"].indexOf(fn) < 0) return;
    if (props.getProperty("trg_" + t.getUniqueId()) !== perId) return;
    props.deleteProperty("trg_" + t.getUniqueId());
    try { ScriptApp.deleteTrigger(t); } catch (e) {}
  });
  var fx = fechasPER_(o.inicio, o.tipo); if (!fx) return null;
  var sh = hoja_(H.PERS), ahora = new Date();
  sh.getRange(p.fila, 6).setValue(new Date(fx.apertura + "T00:00:00"));
  sh.getRange(p.fila, 7).setValue(new Date(fx.cierreMisiones + "T23:59:00"));
  sh.getRange(p.fila, 24).setValue(new Date(fx.cierreCanje + "T23:59:00"));
  if (new Date(fx.apertura + "T00:00:00") > ahora) programar_("abrirPorTrigger", new Date(fx.apertura + "T00:00:00"), perId);
  if (new Date(fx.cierreMisiones + "T23:59:00") > ahora) programar_("cerrarMisionesPorTrigger", new Date(fx.cierreMisiones + "T23:59:00"), perId);
  if (new Date(fx.cierreCanje + "T23:59:00") > ahora) programar_("cerrarPorTrigger", new Date(fx.cierreCanje + "T23:59:00"), perId);
  return fx;
}

function alRecibirRespuesta(e) {
  // v3.9 · CERROJO: el saldo se calcula leyendo la hoja y se cobra escribiendo en ella, así que dos
  // envíos procesados a la vez podrían pasar los dos la puerta del saldo (doble gasto) o duplicar
  // eventos. El lock del documento los pone en fila. Si tras 30 s no se consigue (situación
  // extraordinaria), se procesa igual: perder un canje en silencio sería peor que el riesgo teórico.
  var lock = LockService.getDocumentLock(), conLock = false;
  try { lock.waitLock(30000); conLock = true; } catch (err) { Logger.log("alRecibirRespuesta sin lock: " + err); }
  try {
    var sh = e.range.getSheet(); var nombre = sh.getName(); var perId = nombre.substring(4);
    var p = perFila_(perId); if (!p) return; var o = perObj_(p.v);
    if (nombre.indexOf("B · ") === 0) registrarEventos_(o, sh, e.range.getRow());
    else if (nombre.indexOf("C · ") === 0) resolverCanje_(o, sh, e.range.getRow());
    // OJO: aquí NO se llama a consolidarDatos(). Recorre todos los PER y recalcula sus tableros;
    // con varios grupos eso multiplicaba el trabajo en cada clic de cada alumno. DATOS/RESUMEN y la
    // Consola son una foto para el profesorado: se rehacen de madrugada (fotoNocturna) o desde el menú.
  } catch (err) {
    Logger.log(err);
    // v3.14 · el registro de Cloud no siempre está disponible (proyecto GCP «Predeterminado»), y un
    // fallo aquí es INVISIBLE: la ejecución sale «Completada» y el alumno se queda sin respuesta.
    // La traza va también a AJUSTES, que sí se puede mirar desde la hoja y desde la Consola.
    try {
      var shE = e && e.range ? e.range.getSheet().getName() : "(sin rango)";
      var fiE = e && e.range ? e.range.getRow() : 0;
      hoja_(H.AJ).appendRow([new Date(), shE.length > 4 ? shE.substring(4) : "", "", "ERROR",
        shE.indexOf("C · ") === 0 ? "canje" : "bitacora",
        "fila " + fiE + ": " + (err && err.message ? err.message : String(err)), "sistema"]);
    } catch (e3) {}
  }
  finally { if (conLock) { try { lock.releaseLock(); } catch (e2) {} } }
}
// Cuántas veces se le ha CONCEDIDO ya a este correo esta misma recompensa (sin contar la fila que
// se está resolviendo ahora). Sirve para respetar el «Máx. por alumno» del catálogo.
// «Sobre de cromos — 15 créditos» -> «Sobre de cromos»
function nombreDe_(etiqueta) { return String(etiqueta || "").replace(/\s*—\s*\d+\s*(?:cr[ée]ditos|xp)\s*$/, "").trim(); }
function concedidasDe_(sh, fila, email, nombreRec) {
  var v = sh.getDataRange().getValues(); if (v.length < 2) return 0;
  var cab = v[0].map(String);
  var cE = cab.indexOf("Estado"), cR = cab.indexOf("Recompensa");
  var cM = idx_(cab, "correo") >= 0 ? idx_(cab, "correo") : idx_(cab, "email");
  if (cE < 0 || cR < 0 || cM < 0) return 0;
  var n = 0;
  for (var i = 1; i < v.length; i++) {
    if (i + 1 === fila) continue;
    if (String(v[i][cM] || "").toLowerCase().trim() !== email) continue;
    if (nombreDe_(v[i][cR]) !== nombreRec) continue;   // exacto: «X premium» no cuenta como «X»
    if (String(v[i][cE] || "").indexOf("Concedido") === 0) n++;
  }
  return n;
}
function leerFila_(sh, fila) {
  var cab = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String); var v = sh.getRange(fila,1,1,sh.getLastColumn()).getValues()[0];
  var o = {}; cab.forEach(function(c,i){ o[c] = v[i]; }); return o;
}
// Las casillas marcadas en una fila de la Bitácora -> [etiquetas de reto].
//
// 🔴 LEE LOS DOS FORMATOS, Y TIENE QUE SEGUIR HACIÉNDOLO:
//   · v3.37 (nuevo): una pregunta por reto. La columna se llama como el reto y basta con que traiga
//     algo para contarla por marcada.
//   · anterior: una casilla por planeta con las etiquetas separadas por coma.
// Las columnas viejas NO desaparecen de la hoja al cambiar el formulario —Google las conserva para
// siempre con lo que ya contestó cada alumno—, así que quitar la segunda mitad de esta función
// dejaría de leer todo lo registrado antes de la reforma.
function marcados_(o, tipo) {
  var vistos = {}, out = [];
  var mete = function(x){ x = String(x || "").trim(); if (x && !vistos[x]) { vistos[x] = true; out.push(x); } };
  if (tipo) {
    try { retosDe_(tipo).forEach(function(r){ if (String(o[r[1]] || "").trim()) mete(r[1]); }); }
    catch (e) { Logger.log("marcados_ (formato nuevo): " + e); }
  }
  Object.keys(o).forEach(function(c){
    if (c.indexOf("Lo que he completado") >= 0 || c === "Batalla final")
      String(o[c]||"").split(", ").forEach(mete);
  });
  return out;
}
// v3.32 · EL DOBLE CHECK DEL CORREO, QUE AHORA COMPRUEBA ALGO
//
// El formulario pide el correo a mano AUNQUE Google ya identifique la cuenta: es a propósito, en
// clase se les dice que escriban el mismo. Pero hasta hoy nadie comparaba los dos, así que el
// "doble check" no comprobaba nada: si el alumno escribía otro correo, el sistema usaba el de
// Google (el fiable) y el alumno se quedaba convencido de haber puesto el suyo.
//
// Ahora, si no coinciden: se le avisa a ÉL —que es quien puede arreglarlo— y queda traza en
// AJUSTES para el parte de salud. El sistema sigue usando el de la cuenta: ese no se puede falsear.
function comprobarCorreoDoble_(o, r, cuenta) {
  var escrito = "";
  Object.keys(r).forEach(function(col){
    // la pregunta se llama «Correo» a secas; la de Google es «Dirección de correo electrónico»
    if (col.toLowerCase().trim() === "correo" && String(r[col] || "").trim()) escrito = String(r[col]).toLowerCase().trim();
  });
  if (!escrito || escrito === cuenta) return false;
  try {
    hoja_(H.AJ).appendRow([new Date(), o.id, cuenta, "AVISO", "correo",
      "escribio " + escrito + " y su cuenta es " + cuenta, "sistema"]);
  } catch (e) {}
  // 🔴 Se avisa a LAS DOS direcciones, y esto es lo importante del arreglo. El caso que de verdad
  // duele no es el despiste al teclear: es entrar con la cuenta del trabajo (o la de otro Google
  // abierto en el navegador) sin darse cuenta. Entonces el progreso se guarda en esa cuenta, y su
  // correo de siempre no encuentra nada en la Nave. Mandandolo tambien a la direccion ESCRITA, el
  // aviso le llega alli donde el cree estar.
  var cuerpo =
    "Al registrarte en STARGATE has escrito este correo:\n\n    " + escrito + "\n\n" +
    "...pero has entrado con esta cuenta de Google:\n\n    " + cuenta + "\n\n" +
    "TU PROGRESO SE HA GUARDADO EN «" + cuenta + "», que es la cuenta con la que entraste. No has " +
    "perdido nada, pero conviene que lo mires ahora y no en diciembre:\n\n" +
    "· Si «" + cuenta + "» es tu cuenta de siempre: entra en tu Nave con ESE correo y listo. De paso, " +
    "edita tu respuesta y corrige el correo escrito para que los dos digan lo mismo.\n" +
    "· Si te has registrado sin querer con otra cuenta (la del trabajo, o la que tenias abierta): " +
    "cierra sesion en Google, vuelve a entrar con la tuya y rellena la Bitacora otra vez. Avisa a tu " +
    "profesor/a para que borre el registro que ha quedado en la cuenta equivocada.\n\n" +
    "Tu nave: " + WEB + "recluta.html?per=" + o.id + "\n";
  var asunto = "STARGATE · dos correos distintos: revisa con que cuenta te has registrado";
  enviarCorreo_(cuenta, asunto, cuerpo, o.id, cuenta);
  enviarCorreo_(escrito, asunto, cuerpo, o.id, cuenta);
  return true;
}
function registrarEventos_(o, sh, fila) {
  var r = leerFila_(sh, fila); var email = String(r["Dirección de correo electrónico"] || r["Email Address"] || "").toLowerCase().trim(); if (!email) return;
  comprobarCorreoDoble_(o, r, email);
  congelarAvatarBase_(o, email, r);
  var alias = r["Alias de recluta (público)"] || ""; var retos = retosDe_(o.tipo); var porEt = {}; retos.forEach(function(x){ porEt[x[1]] = x; });
  var ev = hoja_(H.EV); var previos = {}, mios = [];
  registros_(H.EV, o.id).forEach(function(v){
    if (String(v[2]).toLowerCase() === email) { previos[v[4]] = true; mios.push({ fecha:v[0], reto_id:v[4] }); } });
  var nuevos = [], prueba = evidenciaDe_(r);
  if (!previos["H1"]) nuevos.push([new Date(), o.id, email, alias, "H1", "Reclutamiento", 0, XP_RECLUTAMIENTO, "formulario", ""]);
  // v3.37 · CADA RETO CON SU PROPIA EVIDENCIA. Ahora el formulario pide un enlace por reto, así que
  // se coge el suyo; si no lo hay (respuestas anteriores a la reforma, que tenían UN enlace por
  // planeta) se cae al genérico de ese envío, que es lo que había hasta ahora.
  marcados_(r, o.tipo).forEach(function(et){ var x = porEt[et]; if (!x || previos[x[0]]) return;
    var suya = String(r[tituloEvidenciaReto_(x)] || "").trim();
    nuevos.push([new Date(), o.id, email, alias, x[0], x[1], x[4], x[3], "formulario", suya || prueba]); });
  if (nuevos.length) ev.getRange(ev.getLastRow()+1, 1, nuevos.length, 10).setValues(nuevos);
  if (nuevos.length) otorgarBonus_(o, email, previos, mios.concat(nuevos.map(function(v){ return { fecha:v[0], reto_id:v[4] }; })));
}
// v3.19 · BONUS. Se conceden aqui, al registrar, y quedan ESCRITOS en AJUSTES. No se recalculan
// nunca: la racha baja al fallar una semana y devolver creditos ya gastados dejaria el saldo en
// negativo. Solo se mira si le toca algo que todavia no tenga.
function otorgarBonus_(o, email, previos, eventos) {
  var retos = {}; Object.keys(previos).forEach(function(k){ retos[k] = true; });
  eventos.forEach(function(e){ retos[e.reto_id] = true; });
  var yaTiene = {};
  registros_(H.AJ, o.id).forEach(function(v){
    if (String(v[2]).toLowerCase() === email && v[4] === "bonus") yaTiene[String(v[5] || "")] = true; });
  var pend = bonusPendientes_(retos, o.tipo, racha_(o, eventos), yaTiene);
  pend.forEach(function(k){ hoja_(H.AJ).appendRow([new Date(), o.id, email, "EXTRA", "bonus", k, "sistema"]); });
  return pend;
}
// v3: congela el avatar elegido en el PRIMER envío de la Bitácora. Después, editar el formulario
// no cambia el avatar del tablero: solo lo cambia un canje concedido («Cambio de avatar» / «Avatar personal»).
function congelarAvatarBase_(o, email, r) {
  try {
    var aj = hoja_(H.AJ);
    var hay = registros_(H.AJ, o.id).some(function(v){
      return String(v[2]).toLowerCase() === email && v[3] === "AVATAR"; });
    if (hay) return;
    var txt = String(r["Elige tu avatar"] || ""); var url = String(r["URL de tu propia imagen (opcional)"] || "").trim();
    var valor = txt + (url ? " | " + url : "");
    if (valor.trim()) aj.appendRow([new Date(), o.id, email, "AVATAR", "avatar_base", valor, "sistema"]);
  } catch (e) { Logger.log("congelarAvatarBase_: " + e); }
}
function aplicarAvatar_(o, email, valor) { hoja_(H.AJ).appendRow([new Date(), o.id, email, "AVATAR", "avatar", valor, "canje"]); }
// v3.11 · aviso al docente cuando un canje requiere SU intervención (subir nota, recalificar...).
// Va al docente que el alumno declaró en su Bitácora y, siempre, al referente del PER. Es el único
// correo que recibe el profesorado: del resto (insignias, cromos, tickets) no se le molesta.
function avisarDocente_(o, al, rec, actividad) {
  var para = correosAviso_(o.id, al ? al.profe : ""), reserva = "";
  // v3.13 · HALLAZGO 3: si el equipo docente no tiene correos, el canje se concedía y NADIE se
  // enteraba (solo quedaba en la web). Ahora el aviso va al correo de reserva —el de quien puede
  // arreglarlo— y SIEMPRE queda traza en AJUSTES, que es lo que lee la Consola.
  if (!para.length) { reserva = correoDeReserva_(); if (reserva) para = [reserva]; }
  var quien = al ? (al.alias + (al.nombre ? " (" + al.nombre + ")" : "") + " · " + al.email) : "un recluta";
  var cuerpo = "Un recluta de tu grupo ha canjeado una recompensa que TIENE QUE APLICAR EL PROFESORADO.\n\n" +
    "Grupo: " + o.nombre + " (" + o.tipo + ")\n" +
    "Recluta: " + quien + "\n" +
    (al && al.profe ? "Docente que indicó: " + al.profe + "\n" : "Docente que indicó: — ninguno —\n") +
    "Recompensa: " + rec + "\n" +
    (actividad ? "Se aplica a: " + actividad + "\n" : "") +
    (reserva ? "\n⚠ Este aviso te llega A TI porque no había a quién mandarlo.\n" +
               "Motivo: el equipo docente de este grupo está sin correo. Se arregla en la pestaña " +
               "DOCENTES de la hoja maestra (o en profes.html → Ajustes del PER), poniendo el correo " +
               "de cada docente. Sin correo no hay avisos.\n" : "") +
    "\nYa se le han descontado los créditos y él/ella lo sabe: solo falta que lo apliques cuando " +
    "terminen las clases en directo.\n\n" +
    "Márcalo como aplicado aquí (pestaña Canjes):\n" + WEB + "profes.html?per=" + o.id + "\n" +
    "La sala de clase, con todo lo que hace falta antes de entrar:\n" + WEB + "clase.html?per=" + o.id +
    (al && al.profe ? "&profe=" + encodeURIComponent(al.profe) : "") + "\n";
  // v3.15 · pasa por enviarCorreo_: si no queda cuota no se intenta, y queda una fila ERROR en
  // AJUSTES para que el parte de salud lo cante (antes el correo no salia y no se enteraba nadie).
  var enviado = para.length ? enviarCorreo_(para.join(","),
    "STARGATE · " + o.nombre + (reserva ? " · aviso sin destinatario: " : " · te toca a ti: ") + rec,
    cuerpo, o.id, al ? al.email : "") : false;
  // La traza vive en AJUSTES, no en el correo: así la Consola y el panel pueden enseñarlo aunque
  // el correo se pierda. (v[4] = "nota" no colisiona con otorgar/anular/avatar/titulo/marco/fondo/cromo.)
  try {
    hoja_(H.AJ).appendRow([new Date(), o.id, al ? al.email : "", "AVISO", "nota", rec,
      enviado ? (reserva ? "SIN CORREO → " + reserva : para.join(","))
              : (para.length && cuotaCorreo_() <= 0 ? "SIN CORREO · SIN CUOTA" : "SIN CORREO · NO ENVIADO")]);
  } catch (e) { Logger.log("traza del aviso: " + e); }
  return { enviado: enviado, para: para, reserva: !!reserva };
}
// Una carta al azar respetando los pesos del catalogo (suman 100). En un solo sitio: lo usan el
// sobre de pago y el cambio de repetidos, y dos sorteos distintos serian dos loterias distintas.
function sortearCromo_() {
  var bolsa = [];
  for (var i = 0; i < CROMOS.length; i++) for (var w = 0; w < CROMOS[i][2]; w++) bolsa.push(i);
  return CROMOS[bolsa[Math.floor(Math.random() * bolsa.length)]];
}
function resolverCanje_(o, sh, fila) {
  var r = leerFila_(sh, fila); var email = String(r["Dirección de correo electrónico"] || r["Email Address"] || "").toLowerCase().trim();
  var rec = String(r["Recompensa"] || ""); var coste = parseInt((rec.match(/(\d+)\s*(?:cr[ée]ditos|xp)$/) || [0,0])[1], 10);
  // v3.12 · la ficha se busca por etiqueta EXACTA. Antes bastaba el prefijo y el primero del catálogo
  // ganaba: «Sobre de cromos premium» se resolvía como «Sobre de cromos» (otro tope y otro efecto).
  var cat = recompensasCat_();
  sellarCatalogo_(cat);   // 🔬 si alguien ha tocado precios, queda la hora y la versión
  var ficha = cat.filter(function(x){ return rec === x.nombre + " — " + x.coste + " créditos"; })[0] || null;
  if (!ficha) {   // etiquetas viejas (en xp) o precio cambiado: gana el nombre MÁS LARGO que encaje
    ficha = cat.filter(function(x){ return rec.indexOf(x.nombre) === 0; })
               .sort(function(a, b){ return b.nombre.length - a.nombre.length; })[0] || null;
  }
  var t = tablero_(o.id, true); var al = (t.reclutas || []).filter(function(x){ return x.email === email; })[0];
  var disp = al ? al.creditos : 0;   // se paga con créditos; los xp del recluta no se tocan nunca
  var cab = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String); var col = cab.indexOf("Estado") + 1;
  if (!col) { col = sh.getLastColumn() + 1; sh.getRange(1, col).setValue("Estado"); sh.getRange(1, col+1).setValue("Entregado"); }
  // 🔴 v3.14 · UNA FILA SE RESUELVE UNA SOLA VEZ. Si ya tiene estado, no se toca.
  // VISTO EN VIVO (25-ago): con dos triggers instalados, un solo «Sobre de cromos» se procesó DOS
  // veces y el recluta se llevó dos cartas por el precio de una (el cobro sí era único, porque el
  // estado se sobrescribe, pero extra_() añade una fila cada vez). El cerrojo pone los envíos en
  // fila; no impide que el mismo se procese dos veces. Esta guarda sí, y cubre además los
  // reintentos de Google y cualquier reproceso a mano.
  var yaResuelto = String(sh.getRange(fila, col).getValue() || "").trim();
  if (yaResuelto) { Logger.log("resolverCanje_: la fila " + fila + " ya estaba resuelta («" + yaResuelto + "»): no se toca"); return; }
  var estado = "", cuerpo = "";
  // 0) puerta nueva (v3.12): la etiqueta elegida tiene que existir HOY en el catálogo. Si no —porque
  // la renombraron, la retiraron o la respuesta es de antes de actualizar el formulario— se DENIEGA:
  // antes caía en la rama final y se trataba como recompensa de nota (cobraba y avisaba al docente).
  var sem = semanaDe_(o); var desde = ficha ? desdeEfectiva_(ficha.desde, o.tipo) : 0;
  if (!ficha) {
    estado = "Denegado (esa recompensa ya no está en el catálogo)";
    cuerpo = "«" + rec + "» ya no está en el catálogo de recompensas de tu grupo: puede que la hayan " +
      "renombrado o retirado. No se han gastado créditos. Vuelve a abrir el formulario de canje (que ya " +
      "tendrá la lista al día) o díselo a tu profesor/a.";
  }
  // 1) puerta temporal: la recompensa se desbloquea con el calendario del PER
  else if (desde && (sem === null || sem < desde)) {
    estado = "Denegado (bloqueada hasta la semana " + desde + (sem ? "; vais por la " + sem : "") + ")";
    cuerpo = "Esa recompensa aún está clasificada, recluta: se desbloquea en la semana " + desde + " de la misión. No se han gastado créditos.";
  }
  // 2) tope por alumno: el catálogo dice cuántas veces puede concederse a la misma persona
  else if (ficha && ficha.max && concedidasDe_(sh, fila, email, ficha.nombre) >= ficha.max) {
    estado = "Denegado (ya alcanzó el máximo de " + ficha.max + ")";
    cuerpo = ficha.max === 1
      ? "«" + ficha.nombre + "» ya la tienes: es de una sola vez. No se han gastado créditos."
      : "Ya has canjeado «" + ficha.nombre + "» el máximo de " + ficha.max + " veces. No se han gastado créditos.";
  }
  // 2 bis) v3.19 · SUBIR NOTA EXIGE HABER TRABAJADO. No se trata de que alguien se ponga la última
  // semana a entregar chapuzas y compre puntos: se pide en PLANETAS COMPLETOS porque el sistema no
  // sabe cuándo hiciste el trabajo, solo cuándo lo registraste — y porque una gripe de una semana no
  // puede dejarte fuera, como pasaría si se pidiera racha.
  else if (ficha && ficha.tipo === "nota" && NOTA_MIN_PLANETAS > 0 &&
           (!al || (al.planetas_completos || []).length < NOTA_MIN_PLANETAS)) {
    var tiene = al ? (al.planetas_completos || []).length : 0;
    estado = "Denegado (planetas completos: " + tiene + " de " + NOTA_MIN_PLANETAS + ")";
    cuerpo = "Para tocar la nota hay que haber hecho el trabajo, recluta. Necesitas " + NOTA_MIN_PLANETAS +
      " planetas COMPLETOS (todos los retos de ese tema) y llevas " + tiene + ". No se han gastado créditos: " +
      "termina los que tengas a medias y vuelve.";
  }
  // 3) saldo. 🔴 v3.15 · el canje de repetidos cuesta 0 ◈ a proposito: se paga con cartas, no con
  // creditos, asi que tiene que saltarse esta puerta (que deniega todo lo que cueste 0).
  else if (!al || ((!ficha || ficha.tipo !== "cromo_repes") && (disp < coste || coste <= 0))) {
    estado = "Denegado (" + disp + " créditos, cuesta " + coste + ")";
    // v3.40 · Norberto: el caso que confunde no es no tener créditos — es TENERLOS en otra cuenta.
    // Quien se alistó con un correo y canjea con otro ve «0 créditos» y cree que el sistema falla.
    cuerpo = "No tienes créditos suficientes para «" + rec + "»: a este correo le quedan " + disp + " créditos. " +
      "(Tus xp no se gastan: son tu nivel.)\n\n" +
      "\u26a0\ufe0f Si crees que S\u00cd tienes cr\u00e9ditos suficientes, casi seguro que est\u00e1s usando otra cuenta de Google: " +
      "tu progreso vive en el correo con el que te alistaste en la Bit\u00e1cora de mando. Sal de todas las cuentas, " +
      "entra solo con esa, y vuelve a enviar el canje. Comprueba tu saldo real en tu Nave: " + WEB + "recluta.html?per=" + o.id;
  }
  // 4) canjes automáticos: se aplican solos
  else if (ficha && ficha.tipo === "avatar") {
    var nuevo = String(r[TIT_NUEVO_AVATAR] || "").trim();
    if (!nuevo) { estado = "Denegado (falta elegir el nuevo avatar en el formulario)"; cuerpo = "Para «Cambio de avatar» tienes que elegir el nuevo avatar en el propio formulario. Vuelve a enviarlo con tu elección; no se han gastado créditos."; }
    else if (opcIniciales_().indexOf(nuevo) < 0) { estado = "Denegado (ese personaje es exclusivo)"; cuerpo = "«" + nuevo + "» es un personaje EXCLUSIVO: se consigue con la recompensa «Personaje exclusivo», no con «Cambio de avatar». No se han gastado créditos."; }
    else { aplicarAvatar_(o, email, nuevo); estado = "Concedido"; cuerpo = "Concedido: " + rec + ". Tu nuevo avatar («" + nuevo + "») ya luce en el tablero. Te quedan " + (disp - coste) + " créditos."; }
  }
  else if (ficha && ficha.tipo === "avatar_exclusivo") {
    var excl = String(r[TIT_EXCLUSIVO] || "").trim();
    if (!excl) { estado = "Denegado (falta elegir el personaje exclusivo en el formulario)"; cuerpo = "Para «Personaje exclusivo» tienes que elegir cuál en el propio formulario. Vuelve a enviarlo; no se han gastado créditos."; }
    else { aplicarAvatar_(o, email, excl); estado = "Concedido"; cuerpo = "Concedido: " + rec + ". Has desbloqueado «" + excl + "» y ya luce en el tablero. Te quedan " + (disp - coste) + " créditos."; }
  }
  // 4-bis) v3.15 · 3 repetidos = 1 sobre gratis. Es la mecanica que todo el mundo espera de un
  // album, y hasta ahora los repetidos no servian para nada.
  else if (ficha && ficha.tipo === "cromo_repes") {
    var libres = al ? (al.repes_disponibles || 0) : 0;
    if (libres < 3) {
      estado = "Denegado (necesitas 3 cartas repetidas y tienes " + libres + ")";
      cuerpo = "Para cambiar repetidas necesitas 3 y tienes " + libres + ". No se ha gastado nada: " +
        "sigue abriendo sobres y vuelve cuando te sobren tres cartas.";
    } else {
      extra_(o, email, "repes", "3");
      var cr = sortearCromo_();
      extra_(o, email, "cromo", cr[0]);
      estado = "Concedido";
      cuerpo = "Cambias 3 repetidas y abres un sobre nuevo... ¡" + cr[1] + "! (" + cr[3] + " · " + cr[4] +
        "). Ya esta en tu album de la Nave, y no te ha costado ni un credito." +
        (cr[3] === "LEGENDARIA" ? " ✦ ¡El cromo mas dificil de toda la galaxia!" : "");
    }
  }
  // v3.16 · HÉROE DE LA REBELIÓN: uno al azar del vestuario, de los que aún no tiene.
  else if (ficha && ficha.tipo === "heroe") {
    var h = sortearHeroe_(al ? (al.heroes || []) : []);
    if (!h) {
      estado = "Denegado (ya tienes el vestuario entero)";
      cuerpo = "Los tienes TODOS, recluta: no queda un solo héroe de la Rebelión por descubrir. " +
        "No se han gastado créditos.";
    } else {
      extra_(o, email, "heroe", h[0]);
      estado = "Concedido";
      cuerpo = "De la sombra sale... ¡" + h[1] + "! (" + h[3] + "). Ya está en tu vestuario: " +
        "póntelo cuando quieras desde tu Nave, y cámbialo las veces que te apetezca. Te quedan " +
        (disp - coste) + " créditos." +
        (h[3] === "LEGENDARIA" ? " ✦ ¡Un LEGENDARIO! Casi nadie llega a verle la cara." : "");
    }
  }
  else if (ficha && ficha.tipo === "cromo") {
    var c2 = sortearCromo_();
    extra_(o, email, "cromo", c2[0]);
    otorgarBonusColeccion_(o, email);   // ¿esa carta acaba de cerrar una serie? ¿o el álbum entero?
    estado = "Concedido";
    cuerpo = "Abres el sobre... ¡" + c2[1] + "! (" + c2[3] + " · " + c2[4] + "). Ya está en tu álbum de la Nave. Te quedan " + (disp - coste) + " créditos." +
      (c2[3] === "LEGENDARIA" ? " ✦ ¡El cromo más difícil de toda la galaxia!" : "");
  }
  else if (ficha && ficha.tipo === "titulo") {
    var tt = String(r[TIT_TITULO] || "").trim();
    if (!tt) { estado = "Denegado (falta elegir el título en el formulario)"; cuerpo = "Para «Título de recluta» tienes que elegir el título en el propio formulario. Vuelve a enviarlo; no se han gastado créditos."; }
    else { extra_(o, email, "titulo", tt); estado = "Concedido"; cuerpo = "Concedido: desde ahora eres «" + tt + "». Se lee bajo tu alias en el tablero y la Nave. Te quedan " + (disp - coste) + " créditos."; }
  }
  else if (ficha && ficha.tipo === "marco") {
    extra_(o, email, "marco", "oro"); estado = "Concedido";
    cuerpo = "Concedido: tu avatar luce ya su marco dorado en el ranking y la Nave. Te quedan " + (disp - coste) + " créditos.";
  }
  else if (ficha && ficha.tipo === "fondo") {
    var fd = String(r[TIT_FONDO] || "").trim();
    if (!fd) { estado = "Denegado (falta elegir el planeta en el formulario)"; cuerpo = "Para «Fondo de ficha» tienes que elegir tu planeta en el propio formulario. Vuelve a enviarlo; no se han gastado créditos."; }
    else { extra_(o, email, "fondo", fd); estado = "Concedido"; cuerpo = "Concedido: tu ficha de la Nave viaja ahora sobre " + fd + ". Te quedan " + (disp - coste) + " créditos."; }
  }
  else if (ficha && ficha.tipo === "avatar_url") {
    var u = String(r[TIT_URL_AVATAR] || "").trim();
    if (!/^https?:\/\//i.test(u)) { estado = "Denegado (falta la URL de la imagen en el formulario)"; cuerpo = "Para «Avatar personal» tienes que pegar la URL directa de tu imagen en el propio formulario. Vuelve a enviarlo con el enlace; no se han gastado créditos."; }
    else { aplicarAvatar_(o, email, u); estado = "Concedido"; cuerpo = "Concedido: " + rec + ". Tu imagen ya es tu avatar en el tablero (si no carga, revisa que el enlace sea directo). Te quedan " + (disp - coste) + " créditos."; }
  }
  // 5) recompensas de nota: las aplica el profesorado al terminar las clases en directo.
  // Aquí SÍ hace falta una persona, así que se le avisa por correo (v3.11).
  else {
    estado = "Concedido";
    cuerpo = "Concedido: " + rec + ". Te quedan " + (disp - coste) + " créditos. Importante: esta recompensa se hará efectiva al terminar las clases en directo; el profesorado la aplicará entonces.";
  }
  var ok = estado === "Concedido";
  // 🔴 v3.14 · EL ESTADO SE ESCRIBE LO PRIMERO. Es lo que cobra los créditos y lo que lee el tablero:
  // si se escribiera después de los correos, cualquier fallo mandando un aviso dejaría el canje SIN
  // resolver —ni concedido ni denegado— y el alumno sin respuesta. Pasó en la prueba en vivo del
  // 25-ago: el trigger terminó «completada» y la columna Estado se quedó sin escribir.
  sh.getRange(fila, col).setValue(estado);
  SpreadsheetApp.flush();
  // Y solo entonces los efectos secundarios, cada uno con su red.
  if (ok && ficha && ficha.tipo === "nota") {
    try { avisarDocente_(o, al, rec, String(r["Actividad a la que se aplica"] || "")); }
    catch (e) { Logger.log("avisarDocente_: " + e); }
  }
  // v3.20 · CORREO SOLO CUANDO SE DENIEGA. Lo concedido lo celebra la Nave con la carta en grande, y
  // un correo mas por cada sobre es ruido que ademas gasta la cuota diaria (100 en una cuenta
  // gratuita). Pero la DENEGACION no se ve en ningun otro sitio: sin creditos, bloqueado hasta la
  // semana 14, le faltan planetas... si eso no se cuenta, el alumno escribe al profesorado. Y ese
  // correo es justo el que no queremos.
  if (!ok) {
    enviarCorreo_(email, "STARGATE · Canje denegado",
      cuerpo + "\n\nNo se te ha cobrado nada." +
      "\n\nTablero: " + WEB + "registro.html?per=" + o.id + "\nTu nave: " + WEB + "recluta.html?per=" + o.id,
      o.id, email);
  }
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
    var cAv = idx_(cab,"elige tu avatar"), cAvU = idx_(cab,"url de tu propia imagen"), cProf = idx_(cab,"quién imparte");
    for (var i = 1; i < vals.length; i++) { var m = String(vals[i][cM]||"").toLowerCase().trim(); if (!m) continue;
      var avs = cAv >= 0 ? String(vals[i][cAv]||"") : ""; var avu = cAvU >= 0 ? String(vals[i][cAvU]||"").trim() : "";
      var mp = avs.match(/Personaje (\d) · (ella|él|modelo A|modelo B)/);   // v3.8: la galería clásica ya no existe
      var avatar = mp ? { tipo:"evo", n:Number(mp[1]), v: (mp[2] === "él" || mp[2] === "modelo B") ? "m" : "f" } : { tipo:null, n:null };
      avatar.url = avu;
      // v3.16 · el ÚLTIMO VALOR NO VACÍO de cada campo, no la última fila entera. Al quitar el
      // límite de una respuesta, el alumnado envía muchas veces y solo rellena su identidad la
      // primera: si nos quedáramos con la última fila, un envío de «solo marco un reto» borraría
      // su alias, su avatar y su docente.
      var y = por[m] || { email:m, alias:"", nombre:"", bitacora:"", bio:"", profe:"",
                          avatar:{tipo:null,n:null,url:""}, retos:{}, insignias:{}, xp:0, tema:0, eventos:[] };
      function pon(campo, valor) { valor = String(valor == null ? "" : valor).trim(); if (valor) y[campo] = valor; }
      pon("alias", vals[i][cA]); pon("nombre", vals[i][cN]); pon("bitacora", vals[i][cB]);
      if (cBio >= 0) pon("bio", vals[i][cBio]);
      if (cProf >= 0) pon("profe", vals[i][cProf]);
      if (avatar.tipo || avatar.url) y.avatar = avatar;
      por[m] = y; }
  }
  // 2) eventos (con fecha) + ajustes del profesorado
  registros_(H.EV, perId).forEach(function(v){ var m = String(v[2]).toLowerCase();
    var a = por[m] || (por[m] = { email:m, alias:String(v[3]||""), nombre:"", bitacora:"", profe:"", avatar:{tipo:null,n:null,url:""}, retos:{}, insignias:{}, xp:0, tema:0, eventos:[] });
    a.retos[v[4]] = { fecha:v[0], origen:v[8], evidencia:String(v[9] || "") };
    a.eventos.push({ fecha:v[0], reto_id:v[4], reto:v[5], xp:v[7], origen:v[8], evidencia:String(v[9] || "") }); });
  registros_(H.AJ, perId).forEach(function(v){ var m = String(v[2]).toLowerCase(); var a = por[m]; if (!a) return;
    if (v[4] === "anular") delete a.retos[v[3]]; else if (v[4] === "otorgar") { a.retos[v[3]] = { fecha:v[0], origen:"profesorado" }; }
    else if (v[4] === "avatar") { a._avCanje = String(v[5] || ""); }               // canje concedido: el último gana
    else if (v[4] === "avatar_base" && !a._avBase) { a._avBase = String(v[5] || ""); }      // primera elección congelada
    else if (v[4] === "titulo") { a._titulo = String(v[5] || ""); }
    else if (v[4] === "marco") { a._marco = String(v[5] || ""); }
    else if (v[4] === "fondo") { a._fondo = String(v[5] || ""); }
    else if (v[4] === "cromo") { a._cromos = a._cromos || {}; var ck = String(v[5] || ""); a._cromos[ck] = (a._cromos[ck] || 0) + 1; }
    else if (v[4] === "repes") { a._repes = (a._repes || 0) + (Number(v[5]) || 0); }   // v3.15 · repetidos gastados
    // v3.16 · el vestuario: los héroes que ha ido sacando y lo que lleva puesto ahora mismo
    // v3.17 · solo entran heroes que EXISTEN en el catalogo: una errata escribiendo el ajuste a mano
    // (H07_lumen por H07_tejedor) contaba como heroe conseguido y pintaba una figura fantasma en la
    // Nave, y el recluta se quedaba con un vestuario que no cuadraba con lo que veia.
    else if (v[4] === "heroe") { a._heroes = a._heroes || []; var hk = String(v[5] || "");
      if (hk && esHeroe_(hk) && a._heroes.indexOf(hk) < 0) a._heroes.push(hk); }
    else if (v[4] === "viste") { a._viste = String(v[5] || ""); }
    else if (v[4] === "bonus") { a._bonus = a._bonus || {}; a._bonus[String(v[5] || "")] = v[0]; } });
  // 3) cálculo
  var canjes = {}; var shC = SpreadsheetApp.getActive().getSheetByName(o.tabC);
  if (shC && shC.getLastRow() > 1) { var vc = shC.getDataRange().getValues(); var cc = vc[0].map(String); var cE = cc.indexOf("Estado"), cMm = idx_(cc,"correo") >= 0 ? idx_(cc,"correo") : idx_(cc,"email"), cR = cc.indexOf("Recompensa"), cEnt = cc.indexOf("Entregado");
    for (var j = 1; j < vc.length; j++) { var m2 = String(vc[j][cMm]||"").toLowerCase(); if (cE >= 0 && String(vc[j][cE]).indexOf("Concedido") === 0) {
      var coste = parseInt((String(vc[j][cR]).match(/(\d+)\s*(?:cr[ée]ditos|xp)$/)||[0,0])[1],10); (canjes[m2] = canjes[m2] || { gastado:0, lista:[], veces:{} }); canjes[m2].gastado += coste;
      var nom = nombreDe_(vc[j][cR]);
      if (nom) canjes[m2].veces[nom] = (canjes[m2].veces[nom] || 0) + 1;
      canjes[m2].lista.push({ fecha:vc[j][0], recompensa:vc[j][cR], actividad:vc[j][cc.indexOf("Actividad a la que se aplica")], entregado: cEnt >= 0 ? vc[j][cEnt] : "", fila:j+1 }); } } }
  // v3.18 · El xp de la SEMANA sale de los MISMOS retos que producen el xp total, cada uno con su
  // fecha. Antes se sumaban los eventos, y los retos que otorga el profesorado a mano viven en
  // AJUSTES, no en EVENTOS: quien tenia todo validado por su profe salia con 0 esta semana y la
  // corona semanal se la llevaba otro. Un dato, un sitio.
  var hace7 = new Date().getTime() - 7 * 864e5;
  var ts_ = function(f){ try { var t = new Date(f).getTime(); return isNaN(t) ? 0 : t; } catch (e) { return 0; } };
  var lista = Object.keys(por).map(function(m){ var a = por[m]; var xp = 0, cred = 0, tema = 0, ins = {}, xp7 = 0, cuando = {};
    Object.keys(a.retos).forEach(function(id){ var t7 = ts_(a.retos[id].fecha), nuevo = t7 >= hace7;
      // v3.39 · E1 (NEBULA) ya NO se regala aquí: se gana con el reto A0 «Preséntate a tu
      // tripulación», que la trae en su lista de insignias como cualquier otro reto.
      if (id === "H1") { xp += XP_RECLUTAMIENTO; if (nuevo) xp7 += XP_RECLUTAMIENTO; cred += creditosDe_("H1", o.tipo); ins["H1_reclutamiento"] = true; return; }
      var x = porId[id]; if (!x) return; xp += x[3]; if (nuevo) xp7 += x[3];
      cred += creditosDe_(id, o.tipo); if (x[4] > tema && x[4] <= 8) tema = x[4];
      x[2].forEach(function(k){ ins[k] = true; if (t7 > (cuando[k] || 0)) cuando[k] = t7; }); });
    // los bonus ya concedidos: se SUMAN de lo escrito, no se vuelven a calcular
    var bonus = a._bonus || {};
    Object.keys(bonus).forEach(function(k){
      var val = valorBonus_(k); xp += val.xp; cred += val.creditos;
      if (ts_(bonus[k]) >= hace7) xp7 += val.xp;
    });
    if (Object.keys(a.retos).length) { ins["H1_reclutamiento"] = true; }
    // una insignia derivada se gana cuando cae la ULTIMA de las suyas: esa es su fecha
    DERIVADAS.forEach(function(d){ if (d[2].every(function(k){ return ins[k]; })) { ins[d[0]] = true; xp += d[1]; cred += CREDITOS.derivada || 0;
      var ult = 0; d[2].forEach(function(k){ if ((cuando[k] || 0) > ult) ult = cuando[k] || 0; });
      if (ult >= hace7) xp7 += d[1]; } });
    var gast = canjes[m] ? canjes[m].gastado : 0;   // gastado SIEMPRE en créditos: los xp no se tocan
    // avatar: canje concedido > elección congelada al alistarse > valor actual del formulario (respuestas antiguas)
    var avatar = a._avCanje ? parseAvatar_(a._avCanje) : a._avBase ? parseAvatar_(a._avBase) : (a.avatar || {tipo:null,n:null,url:""});
    var niv = nivelInfo_(xp, o.tipo);
    // v3.15 · ÁLBUM: repetidos (los que sobran de cada carta, menos los ya cambiados) y sellos por
    // serie completa. Los sellos van en un campo APARTE: «insignias» son las 24 de la misión y se
    // pinta como n+"/24" en cuatro sitios, así que meterlos ahí volvería mentira ese contador.
    var mis = a._cromos || {}, repes = 0;
    Object.keys(mis).forEach(function(k){ if (mis[k] > 1) repes += mis[k] - 1; });
    var gastados = a._repes || 0;
    var album = SERIES_ALBUM.filter(function(sr){
      return CROMOS.filter(function(cr){ return cr[4] === sr[1]; }).every(function(cr){ return mis[cr[0]]; });
    }).map(function(sr){ return sr[0]; });
    // v3.16 · VESTUARIO. Las 5 versiones de arte del personaje dejan de imponerse: se desbloquean
    // por nivel y el recluta ELIGE cuál lleva. Y encima están los héroes que haya ido sacando.
    // Si no ha elegido nada, va la skin más alta que tenga: así al subir de nivel se pone sola y
    // no se pierde el momento de «he subido y mi personaje ha cambiado».
    var heroes = a._heroes || [], skins = skinsDe_(xp, o.tipo), viste = String(a._viste || "");
    var mH = viste.match(/^heroe:(.+)$/), mS = viste.match(/^skin:([1-5])$/);
    var puesto = (mH && heroes.indexOf(mH[1]) >= 0) ? viste
               : (mS && skins.indexOf(Number(mS[1])) >= 0) ? viste : "";
    avatar.skin = puesto.indexOf("skin:") === 0 ? Number(puesto.slice(5)) : niv.rango;
    avatar.heroe = puesto.indexOf("heroe:") === 0 ? puesto.slice(6) : "";
    // v3.18 · COLECCION. El tercer ranking mide lo que TIENES, no lo que has trabajado: las cartas
    // distintas del album, los heroes que has sacado y las versiones de tu personaje desbloqueadas.
    // Los totales salen de los catalogos, asi que el dia que los heroes pasen de 10 a 30 el 100 %
    // se recalcula solo y a nadie le sube el porcentaje sin haber conseguido nada.
    var coleccion = {
      cromos:   { tengo: Object.keys(mis).length, total: CROMOS.length },
      heroes:   { tengo: heroes.length,           total: HEROES.length },
      skins:    { tengo: skins.length,            total: RANGOS.length }
    };
    coleccion.tengo = coleccion.cromos.tengo + coleccion.heroes.tengo + coleccion.skins.tengo;
    coleccion.total = coleccion.cromos.total + coleccion.heroes.total + coleccion.skins.total;
    // el porcentaje NO se redondea aqui: con 35 piezas dos reclutas distintos caerian en el mismo
    // entero y el ranking los ordenaria al azar. Redondea quien lo pinta; ordena quien lo cuenta.
    coleccion.pct = coleccion.total ? (coleccion.tengo * 100 / coleccion.total) : 0;
    var out = { alias:a.alias, avatar:avatar, xp:xp, nivel:niv.nivel, rango:niv.rango, rango_nombre:niv.rangoNombre,
                coleccion: coleccion, bonus: Object.keys(bonus), planetas_completos: planetasCompletos_(a.retos, o.tipo),
                heroes: heroes, n_heroes: heroes.length, skins: skins, viste: puesto,
                repes: repes, repes_gastados: gastados, repes_disponibles: Math.max(0, repes - gastados),
                insignias_album: album, n_album: album.length, racha: racha_(o, a.eventos),
                nivel_titulo:niv.titulo, xp_siguiente:niv.siguiente, xp_faltan:niv.faltan,
                creditos: cred - gast, creditos_ganados: cred, creditos_gastados: gast,
                canjeados: canjes[m] ? canjes[m].veces : {},
                profe:a.profe || "", planeta: tema ? TEMAS[tema][0] : "—", tema:tema, insignias:Object.keys(ins), n:Object.keys(ins).length,
                titulo:a._titulo || "", marco:a._marco || "", fondo:a._fondo || "", cromos:a._cromos || {}, xp7:xp7,
                // v3.29 · la BIO viaja al tablero: la escribe el propio recluta para su personaje y
                // es lo que da vida a su ficha cuando alguien pulsa su nombre en el ranking.
                // 🔴 El correo y el nombre real NO viajan, y así se queda: se comprueba en la batería.
                bio:a.bio || "",
                // v3.26 · la última vez que registró algo POR SU CUENTA (los retos que le otorga el
                // profesorado no cuentan: la señal es si sigue jugando, no si alguien juega por él)
                ultima: a.eventos.length ? new Date(Math.max.apply(null, a.eventos.map(function(e){ return new Date(e.fecha).getTime(); }))) : "" };
    if (conPrivados) { out.email = m; out.nombre = a.nombre; out.bitacora = a.bitacora; out.bio = a.bio || ""; out.eventos = a.eventos; out.retos = a.retos; out.canjes = canjes[m] ? canjes[m].lista : []; }
    return out; });
  lista.sort(function(a,b){ return b.xp - a.xp || b.n - a.n || a.alias.localeCompare(b.alias); }); lista.forEach(function(x,i){ x.pos = i+1; });
  // corona semanal: el/los que más xp ganaron en los últimos 7 días
  var maxSem = 0; lista.forEach(function(x){ if (x.xp7 > maxSem) maxSem = x.xp7; });
  lista.forEach(function(x){ x.corona = maxSem > 0 && x.xp7 === maxSem; });
  var std = panelStd_();
  var res = { per:perId, nombre:o.nombre, tipo:o.tipo, profesorado:o.profesorado, referente:o.referente, estado:o.estado, inicio:o.inicio,
           formBitacora:o.formBitacora, formTicket:o.formTicket, formCanje:o.formCanje, reclutas:lista,
           recompensas:recompensasCat_(), semana:semanaDe_(o), semanas:semanasDe_(o.tipo), panel:o.panelVer || std.ver,
           // v3.28 · el Genially propio de cada docente, para quien lo tenga. La Nave elige el del
           // docente del alumno y, si ese docente no tiene el suyo, se queda con «panel».
           paneles:(function(){ var m = {}; docentesDe_(o.id).forEach(function(d){ if (d.panel) m[d.nombre] = d.panel; }); return m; })(),
           // v3.14 · para que el alumnado y el profesorado sepan HASTA CUÁNDO, sin preguntar
           apertura:o.apertura, cierre_misiones:o.cierre, cierre_canje:o.cierreCanje || o.cierre,
           // v3.38 · el padlet de la clase es del alumnado: la Nave le pone acceso directo
           padlet:o.padlet || "",
           docentes:docentesDe_(perId).map(function(d){ return { nombre:d.nombre, rol:d.rol, imparte:imparte_(d), referente:esReferente_(d) }; }),
           actualizado:new Date() };
  if (conPrivados) { res.docentes_full = docentesDe_(perId);   // con correo: solo tras el PIN
    // v3.13 · HALLAZGO 4: los reclutas sin docente asignado no salían por ningún lado. Ahora el
    // profesorado los ve contados en su panel, en la sala de clase y en la Consola.
    res.sin_docente = lista.filter(function(x){ return !String(x.profe || "").trim(); }).length;
    res.docentes_sin_correo = docentesDe_(perId).filter(function(d){ return !d.correo; }).map(function(d){ return d.nombre; });
    res.panelEdit = o.panelEdit || std.editar; res.panelPropio = !!(o.panelVer || o.panelEdit); res.archivado = o.archivado;
    res.doc = o.doc; res.hoja = SpreadsheetApp.getActive().getUrl(); res.formBitacoraEdit = o.formBitacoraEdit; }
  return res;
}
// «Personaje 3 · ella (evoluciona)» / URL directa / «elección | url» -> objeto avatar del tablero
function parseAvatar_(s) {
  s = String(s || ""); var partes = s.split(" | "); var txt = partes[0] || ""; var url = (partes[1] || "").trim();
  if (/^https?:\/\//i.test(txt)) { url = txt.trim(); txt = ""; }
  var mp = txt.match(/Personaje (\d) · (ella|él|modelo A|modelo B)/);   // v3.8: solo personajes que evolucionan
  var av = mp ? { tipo:"evo", n:Number(mp[1]), v:(mp[2] === "él" || mp[2] === "modelo B") ? "m" : "f" } : { tipo:null, n:null };
  av.url = url; return av;
}
function idx_(cab, frag) { frag = frag.toLowerCase(); for (var i = 0; i < cab.length; i++) if (cab[i].toLowerCase().indexOf(frag) >= 0) return i; return -1; }

// ================= ALUMNADO (la vista operativa de las personas) =================
// 🔴 NO confundir con DATOS/RESUMEN. Aquellas dos son PARA INVESTIGAR y salen seudonimizadas a
// propósito; esta lleva nombre y correo porque es la que se usa para dar clase: quién es quién, de
// quién es alumno, cuánto lleva y qué se ha gastado. Vive detrás del PIN igual que la hoja entera.
//
// Es una FOTO, como la Consola: se rehace entera al pedirla y de madrugada. Lo que se escriba a mano
// aquí se pierde en el siguiente refresco — el dato de verdad está en EVENTOS, AJUSTES y los
// formularios, y esta pestaña solo los junta.
function actualizarAlumnado() {
  var ui = SpreadsheetApp.getUi();
  var r = alumnado_();
  try { SpreadsheetApp.getActive().setActiveSheet(hoja_(H.ALU)); } catch (e) {}
  ui.alert("Pestaña ALUMNADO al día",
    r.reclutas + " personas de " + r.grupos + " grupo(s)" +
    (r.archivados ? " (" + r.archivados + " de grupos archivados, en gris)" : "") + ".\n\n" +
    "Es una foto: se rehace sola de madrugada y cada vez que la pidas desde el menú. No escribas en " +
    "ella, que se pierde al refrescar.", ui.ButtonSet.OK);
}
function alumnado_() {
  var pers = hoja_(H.PERS).getDataRange().getValues().slice(1).filter(function(v){ return v[0]; });
  var filas = [], grupos = 0, archivados = 0;
  pers.forEach(function(v){
    var o = perObj_(v), t;
    try { t = tablero_(o.id, true); } catch (e) { Logger.log("alumnado_/" + o.id + ": " + e); return; }
    if (!t || !t.reclutas) return;
    grupos++;
    t.reclutas.forEach(function(x){
      var canjes = x.canjes || [], veces = {};
      canjes.forEach(function(c){ var n = nombreDe_(c.recompensa); if (n) veces[n] = (veces[n] || 0) + 1; });
      if (o.archivado) archivados++;
      filas.push([o.id, o.nombre, x.nombre || "", x.email || "", x.alias || "", x.profe || "",
                  x.nivel, x.rango_nombre || "", x.xp,
                  x.creditos, x.creditos_ganados, x.creditos_gastados,
                  x.n, Object.keys(x.retos || {}).length, canjes.length,
                  Object.keys(veces).map(function(k){ return veces[k] > 1 ? k + " x" + veces[k] : k; }).join(", "),
                  x.coleccion && x.coleccion.cromos ? x.coleccion.cromos.tengo : 0,
                  x.n_heroes || 0, x.planeta || "", x.bitacora ? "SÍ" : "", x.ultima || "", o.archivado || ""]);
    });
  });
  var sh = hoja_(H.ALU, CAB_ALUMNADO, "#37e0ec");
  sh.clearContents();
  sh.getRange(1, 1, 1, CAB_ALUMNADO.length).setValues([CAB_ALUMNADO]);
  if (filas.length) sh.getRange(2, 1, filas.length, CAB_ALUMNADO.length).setValues(filas);
  sh.setFrozenRows(1);
  try { colorear_(); } catch (e) { Logger.log("colorear_ desde alumnado_: " + e); }
  return { reclutas: filas.length, grupos: grupos, archivados: archivados };
}

// ================= COLOR (cada grupo el suyo, y los avisos encima) =================
// Reglas de formato condicional DE VERDAD, no celdas pintadas a mano: se aplican solas a las filas
// que van llegando por formulario, y sobreviven a ordenar, filtrar e insertar.
//
// El orden IMPORTA: en Sheets manda la PRIMERA regla que casa. Por eso los avisos van delante del
// color del grupo — si no, el tinte del grupo taparía siempre al aviso y no se vería nada.
var COLORES_PER = ["#d7f0f7","#ffe8cf","#e6dff7","#daf2e2","#ffe1e8",
                   "#fff6c8","#dde9ff","#f2e5d3","#dff5ef","#f7ddf1"];
var COLOR_ARCHIVADO = "#e8eaed";   // gris: lo archivado se lee, no se trabaja
var COLOR_AVISO     = "#ffd9d9";   // rojo claro: falta algo que impide que el sistema funcione
var COLOR_OJO       = "#fff3c4";   // ámbar: no está roto, pero míralo

// El color de cada PER sale de su ORDEN en la pestaña PERs, no de un hash: así los diez primeros
// grupos tienen diez colores distintos garantizados y no dos parecidos por casualidad.
function coloresPER_() {
  var m = {}, i = 0;
  hoja_(H.PERS).getDataRange().getValues().slice(1).forEach(function(v){
    if (!v[0]) return; m[String(v[0])] = COLORES_PER[i % COLORES_PER.length]; i++;
  });
  return m;
}
function colorear_() {
  var ss = SpreadsheetApp.getActive(), col = coloresPER_();
  var n = 0;
  // PERs · la columna A es el id. En gris lo archivado (columna V = «Archivado»).
  n += reglas_(ss.getSheetByName(H.PERS), "$A", col,
    [{ f: '=$V2<>""', c: COLOR_ARCHIVADO }]);
  // EVENTOS, AJUSTES y sus archivos · la columna B es el per
  [H.EV, H.AJ, H.EVA, H.AJA].forEach(function(nom){
    n += reglas_(ss.getSheetByName(nom), "$B", col, []);
  });
  // ALUMNADO · la columna A es el per. Delante van los tres avisos que se leen de un vistazo.
  n += reglas_(ss.getSheetByName(H.ALU), "$A", col, [
    { f: '=$V2<>""', c: COLOR_ARCHIVADO },                        // el grupo está archivado
    { f: '=AND($D2<>"",$F2="")', c: COLOR_AVISO },                // alistado pero sin docente
    { f: '=AND($U2<>"",$U2<TODAY()-14)', c: COLOR_OJO }           // dos semanas sin registrar nada
  ]);
  // DOCENTES · la columna A es el per
  n += reglas_(ss.getSheetByName(H.DOC), "$A", col,
    [{ f: '=AND($B2<>"",$C2="")', c: COLOR_AVISO }]);             // docente sin correo: no recibe avisos
  return n;
}
function reglas_(sh, ref, colores, extras) {
  if (!sh) return 0;
  var rango = sh.getRange(2, 1, Math.max(sh.getMaxRows() - 1, 1), Math.max(sh.getMaxColumns(), 1));
  var lista = [];
  (extras || []).forEach(function(e){
    lista.push(SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(e.f).setBackground(e.c).setRanges([rango]).build());
  });
  Object.keys(colores).forEach(function(id){
    // el id de un PER es un slug (letras, números y guiones), pero se limpian las comillas por si
    // alguien lo edita a mano: una comilla suelta rompería la fórmula entera y con ella todo el color
    lista.push(SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=' + ref + '2="' + String(id).replace(/"/g, "") + '"')
      .setBackground(colores[id]).setRanges([rango]).build());
  });
  try { sh.setConditionalFormatRules(lista); } catch (e) { Logger.log("reglas_/" + sh.getName() + ": " + e); return 0; }
  return lista.length;
}
function colorearHoja() {
  var ui = SpreadsheetApp.getUi(), n = 0;
  try { n = colorear_(); } catch (e) { ui.alert("No se ha podido colorear: " + e.message); return; }
  ui.alert("Hoja coloreada",
    n + " reglas puestas.\n\nCada grupo tiene su color en PERs, EVENTOS, AJUSTES, sus archivos, " +
    "DOCENTES y ALUMNADO. Encima van los avisos: gris = grupo archivado · rojo = falta el docente " +
    "(o su correo) · ámbar = dos semanas sin registrar nada.\n\n" +
    "Son reglas automáticas: las filas nuevas que lleguen por formulario salen ya con su color.",
    ui.ButtonSet.OK);
}

// ================= DATOS / RESUMEN (investigación) =================
function consolidarDatos() {
  var ss = SpreadsheetApp.getActive(); var pers = hoja_(H.PERS).getDataRange().getValues().slice(1);
  // 🔬 v3.23 · el DOCENTE era la variable que faltaba. El sistema sabe desde v3.11 quién imparte a
  // cada alumno (la ficha lleva `profe` y clase.html filtra por él), pero no salía en NINGUNA de las
  // dos exportaciones — justo la que hace falta para estudiar si lo que hace el docente en clase
  // cambia algo. Los tableros se calculan UNA vez y se reparten entre las dos pestañas.
  var tabs = {}, deQuien = {};
  pers.forEach(function(p){
    if (!p[0]) return;
    try {
      var t = tablero_(p[0], true); tabs[p[0]] = t;
      (t.reclutas || []).forEach(function(x){ deQuien[p[0] + "·" + x.email] = x.profe || ""; });
    } catch (e) { Logger.log("consolidarDatos/" + p[0] + ": " + e); }
  });
  var soloEstos = consienten_();
  // Las filas SIN correo (p. ej. el sello del catálogo) no son de nadie: pasan siempre.
  var pasa = function(em) { return !em || !soloEstos || !!soloEstos[em]; };
  var quien = function(per, em) { return deQuien[per + "·" + em] || ""; };
  // 🔴 Los campos libres arrastran correos sin que se note: el aviso de un canje de nota guarda en
  // AJUSTES A QUIÉN se le avisó, o sea las direcciones del PROFESORADO, y de ahí salían enteras por
  // la columna «origen». Seudonimizar solo la columna del correo no basta si el correo también viaja
  // dentro de un texto. Lo cazó la batería 5 comprobando que no queda ni una «@» en las dos pestañas.
  var limpio = function(t) { return String(t == null ? "" : t).replace(/[^\s,;·]+@[^\s,;·]+/g, "(correo)"); };
  var tipoDe = function(id) { var p = pers.filter(function(x){ return x[0] === id; })[0]; return p ? p[2] : ""; };

  // 🔴 Ni correo, ni alias, ni nombre: estas dos pestañas son PARA INVESTIGAR y salen seudonimizadas.
  // Quien necesite ver nombres tiene la Consola del profesorado, que es la vista operativa.
  var filas = [["per","tipo","fecha","seudonimo","docente","reto_id","reto","tema","xp","origen"]];
  registros_(H.EV).forEach(function(v){
    var em = String(v[2] || "").toLowerCase().trim(); if (!pasa(em)) return;
    filas.push([v[1], tipoDe(v[1]), v[0], seudonimo_(em), quien(v[1], em), v[4], limpio(v[5]), v[6], v[7], limpio(v[8])]);
  });
  registros_(H.AJ).forEach(function(v){
    var em = String(v[2] || "").toLowerCase().trim(); if (!pasa(em)) return;
    filas.push([v[1], tipoDe(v[1]), v[0], seudonimo_(em), quien(v[1], em), v[3],
                limpio(v[4] + (v[5] ? " · " + v[5] : "")), "", "", "ajuste:" + limpio(v[6])]);
  });
  var out = ss.getSheetByName(H.DATOS) || ss.insertSheet(H.DATOS); out.clearContents(); out.getRange(1,1,filas.length,filas[0].length).setValues(filas); out.setFrozenRows(1); out.setTabColor("#f5b043");

  // `bitacora` deja de ser la URL del ePortfolio y pasa a ser SÍ/NO: la URL lleva al portfolio de una
  // persona con su nombre, y eso rompía la seudonimización de todo lo demás. Lo analizable —si lo
  // publicó o no— se conserva.
  var res = [["per","tipo","seudonimo","docente","xp","nivel","creditos","creditos_ganados","n_insignias","tema_max","insignias","tiene_bitacora"]];
  pers.forEach(function(p){
    if (!p[0] || !tabs[p[0]]) return;
    (tabs[p[0]].reclutas || []).forEach(function(x){
      if (!pasa(String(x.email || "").toLowerCase().trim())) return;
      res.push([p[0], p[2], seudonimo_(x.email), x.profe || "", x.xp, x.nivel, x.creditos,
                x.creditos_ganados, x.n, x.tema, x.insignias.join(" "), x.bitacora ? "SÍ" : ""]);
    });
  });
  var rs = ss.getSheetByName(H.RES) || ss.insertSheet(H.RES); rs.clearContents(); rs.getRange(1,1,res.length,res[0].length).setValues(res); rs.setFrozenRows(1);
}

// ================= CONSOLA (segunda hoja de cálculo, limpia) =================
// La hoja maestra es la materia prima: sus 3 pestañas de respuestas por PER la vuelven ilegible en
// cuanto hay varios grupos. Esta función mantiene un SEGUNDO archivo de Google Sheets, «STARGATE ·
// Consola del profesorado», con una portada de todos los PER y una pestaña por PER con lo que de
// verdad se consulta. Es una FOTO: se rehace desde el menú y sola una vez al día. No se escribe nada
// en ella a mano (se borra al refrescar) y no interviene en el juego: si se borra, no pasa nada.
var PROP_CONSOLA = "CONSOLA_ID";

function consolaSS_() {
  var pr = PropertiesService.getScriptProperties(), id = pr.getProperty(PROP_CONSOLA), ss = null;
  if (id) { try { ss = SpreadsheetApp.openById(id); DriveApp.getFileById(id); } catch (e) { ss = null; } }
  if (!ss) {
    ss = SpreadsheetApp.create("STARGATE · Consola del profesorado");
    pr.setProperty(PROP_CONSOLA, ss.getId());
    try {   // al lado de la hoja maestra
      var padres = DriveApp.getFileById(SpreadsheetApp.getActive().getId()).getParents();
      if (padres.hasNext()) DriveApp.getFileById(ss.getId()).moveTo(padres.next());
    } catch (e) {}
  }
  return ss;
}
function hojaLimpia_(ss, nombre, color) {
  var sh = ss.getSheetByName(nombre) || ss.insertSheet(nombre);
  sh.clear(); try { sh.setTabColor(color || "#37e0ec"); } catch (e) {}
  return sh;
}
function bloque_(sh, fila, titulo, cabeceras, filas, anchoMin) {
  sh.getRange(fila, 1).setValue(titulo).setFontWeight("bold").setFontSize(12);
  sh.getRange(fila + 1, 1, 1, cabeceras.length).setValues([cabeceras])
    .setFontWeight("bold").setBackground("#eef3f7");
  if (filas.length) sh.getRange(fila + 2, 1, filas.length, cabeceras.length).setValues(filas);
  else sh.getRange(fila + 2, 1).setValue("— nada todavía —").setFontColor("#8899aa");
  return fila + 2 + Math.max(filas.length, 1) + 2;   // siguiente fila libre
}
function canjesDe_(o) {   // lee la pestaña de respuestas del canje de un PER
  var sh = SpreadsheetApp.getActive().getSheetByName(o.tabC);
  if (!sh || sh.getLastRow() < 2) return [];
  var v = sh.getDataRange().getValues(), cab = v[0].map(String);
  var cM = idx_(cab, "correo") >= 0 ? idx_(cab, "correo") : idx_(cab, "email");
  var cR = cab.indexOf("Recompensa"), cE = cab.indexOf("Estado"), cEnt = cab.indexOf("Entregado");
  var cAct = idx_(cab, "actividad");
  return v.slice(1).map(function(r){
    var rec = String(r[cR] || "");
    return { fecha:r[0], email:cM >= 0 ? String(r[cM] || "") : "", recompensa:rec,
             coste:Number((rec.match(/(\d+)\s*(?:cr[ée]ditos|xp)\s*$/) || [0,0])[1]) || 0,
             estado:cE >= 0 ? String(r[cE] || "") : "", entregado:cEnt >= 0 ? String(r[cEnt] || "") : "",
             actividad:cAct >= 0 ? String(r[cAct] || "") : "" };
  }).filter(function(x){ return x.email; });
}
function ticketsDe_(o) {
  var sh = SpreadsheetApp.getActive().getSheetByName(o.tabT);
  if (!sh || sh.getLastRow() < 2) return { total:0, sinResolver:0 };
  var v = sh.getDataRange().getValues(), cR = v[0].map(String).indexOf("Resuelto");
  var sin = 0;
  v.slice(1).forEach(function(r){ if (cR < 0 || !String(r[cR] || "").trim()) sin++; });
  return { total:v.length - 1, sinResolver:sin };
}

// v3.13 · etiqueta única para el grupo de alumnos que no ha declarado docente: se usa igual al
// agrupar y al contar los pendientes, así que tiene que estar en un solo sitio.
var SIN_DOCENTE = "⚠ SIN DOCENTE ASIGNADO";

function actualizarConsola() {
  var ss = consolaSS_(), maestra = SpreadsheetApp.getActive();
  var pers = hoja_(H.PERS).getDataRange().getValues().slice(1).filter(function(v){ return v[0]; });
  var sello = Utilities.formatDate(new Date(), "Europe/Madrid", "dd/MM/yyyy HH:mm");
  var vivos = {}, portada = [];

  pers.forEach(function(v){
    var o = perObj_(v); vivos["PER · " + o.id] = true;
    var t = tablero_(o.id, true); var rec = (t.reclutas || []);
    var canjes = canjesDe_(o), tk = ticketsDe_(o), sem = semanaDe_(o);
    var concedidos = canjes.filter(function(c){ return c.estado.indexOf("Concedido") === 0; });
    var pendientes = concedidos.filter(function(c){ return !c.entregado; });
    var xpMedia = rec.length ? Math.round(rec.reduce(function(a,x){ return a + x.xp; }, 0) / rec.length) : 0;
    var credCirc = rec.reduce(function(a,x){ return a + (x.creditos || 0); }, 0);

    var sinDoc = rec.filter(function(x){ return !String(x.profe || "").trim(); }).length;
    portada.push([o.id, o.nombre, o.tipo, o.archivado ? "Archivado" : o.estado,
      o.inicio || "", sem === null ? "" : (sem < 1 ? "no ha empezado" : "semana " + sem),
      rec.length, sinDoc, xpMedia, rec.length ? Math.round(rec.reduce(function(a,x){ return a + x.nivel; }, 0) / rec.length) : 0,
      credCirc, concedidos.length, pendientes.length, tk.total, tk.sinResolver,
      docentesDe_(o.id).map(function(d){ return d.nombre + (d.correo ? " <" + d.correo + ">" : " ⚠ SIN CORREO")
        + (esReferente_(d) ? " ★" : "") + (imparte_(d) ? "" : " (no imparte)"); }).join("\n"),
      WEB + "registro.html?per=" + o.id, WEB + "clase.html?per=" + o.id, WEB + "recluta.html?per=" + o.id,
      o.formBitacora || "", o.formCanje || "", o.formTicket || "", o.doc || ""]);

    // ---- pestaña del PER ----
    var sh = hojaLimpia_(ss, "PER · " + o.id, o.archivado ? "#9fb2c2" : "#37e0ec");
    sh.getRange(1,1).setValue("STARGATE · " + o.nombre).setFontWeight("bold").setFontSize(16);
    sh.getRange(2,1).setValue(o.tipo + " · " + (o.archivado ? "ARCHIVADO" : o.estado)
      + (o.inicio ? " · empezó el " + o.inicio : "")
      + (sem === null ? "" : (sem < 1 ? " · aún no ha empezado" : " · van por la semana " + sem))
      + " · " + rec.length + " reclutas").setFontColor("#55606a");
    sh.getRange(3,1).setValue("Foto tomada el " + sello + " · se rehace desde el menú STARGATE de la hoja maestra")
      .setFontColor("#8899aa").setFontStyle("italic");

    var f = 5;
    // por docente: cuántos alumnos, cómo van y qué tiene pendiente de aplicar cada uno
    var docs = docentesDe_(o.id);
    var porProf = {};
    rec.forEach(function(x){ var k = String(x.profe || "").trim() || SIN_DOCENTE; (porProf[k] = porProf[k] || []).push(x); });
    docs.forEach(function(d){ if (!porProf[d.nombre]) porProf[d.nombre] = []; });
    // el grupo sin docente va PRIMERO: es lo que hay que arreglar, no una fila más del montón
    var claves = Object.keys(porProf).sort();
    claves = claves.filter(function(k){ return k === SIN_DOCENTE; }).concat(claves.filter(function(k){ return k !== SIN_DOCENTE; }));
    f = bloque_(sh, f, "Por docente" + (porProf[SIN_DOCENTE] ? "  ·  ⚠ hay " + porProf[SIN_DOCENTE].length + " recluta(s) SIN DOCENTE: corrígelo en su ficha, desde la sala de clase" : ""),
      ["Docente","Correo","Rol","Alumnos","xp medio","◈ medios","Insignias medias","Pendientes de aplicar"],
      claves.map(function(k){
        var g = porProf[k], d = docs.filter(function(x){ return x.nombre === k; })[0];
        var pend = concedidos.filter(function(c){
          var al = rec.filter(function(x){ return x.email === String(c.email).toLowerCase(); })[0];
          return !c.entregado && al && (String(al.profe || "").trim() || SIN_DOCENTE) === k; }).length;
        var med = function(f2){ return g.length ? Math.round(g.reduce(function(a2,x){ return a2 + f2(x); }, 0) / g.length) : 0; };
        var rolTxt = !d ? "" : (esReferente_(d) && imparte_(d)) ? "referente · imparte" : (esReferente_(d) ? "referente" : "imparte");
        var correo = k === SIN_DOCENTE ? "—" : (d ? (d.correo || "⚠ SIN CORREO: no recibirá avisos") : "");
        return [k, correo, rolTxt, g.length, med(function(x){ return x.xp; }),
                med(function(x){ return x.creditos; }), med(function(x){ return x.n; }), pend];
      }));

    f = bloque_(sh, f, "Reclutas (por xp)",
      ["Alias","Nombre","Correo","Docente","Nivel","Rango","xp","◈ créditos","Insignias","Planeta","Corona","Bitácora (ePortfolio)"],
      rec.map(function(x){ return [x.alias, x.nombre, x.email, x.profe || "", x.nivel, x.rango_nombre, x.xp, x.creditos,
        x.n + "/24", x.planeta, x.corona ? "♛" : "", x.bitacora || ""]; }));

    f = bloque_(sh, f, "Canjes",
      ["Fecha","Correo","Recompensa","Coste ◈","Estado","Aplicado por el profe","Actividad"],
      canjes.sort(function(a,b){ return new Date(b.fecha) - new Date(a.fecha); })
            .map(function(c){ return [c.fecha, c.email, c.recompensa, c.coste, c.estado, c.entregado, c.actividad]; }));

    f = bloque_(sh, f, "Últimos registros de la Bitácora",
      ["Fecha","Alias","Correo","Logro","xp"],
      (function(){
        var ev = [];
        registros_(H.EV, o.id).forEach(function(r){ ev.push(r); });
        ev.sort(function(a,b){ return new Date(b[0]) - new Date(a[0]); });
        return ev.slice(0, 60).map(function(r){ return [r[0], r[3], r[2], r[5], r[7]]; });
      })());

    sh.getRange(f, 1).setValue("Tickets de salida: " + tk.total + " recibidos, " + tk.sinResolver
      + " sin resolver → " + WEB + "tickets.html?per=" + o.id).setFontColor("#55606a");
    sh.setFrozenRows(3);
    for (var c = 1; c <= 11; c++) try { sh.autoResizeColumn(c); } catch (e) {}
  });

  // ---- portada ----
  var pt = hojaLimpia_(ss, "PORTADA", "#f5b043");
  pt.getRange(1,1).setValue("STARGATE · Consola del profesorado").setFontWeight("bold").setFontSize(18);
  pt.getRange(2,1).setValue("Una fila por grupo. Cada pestaña de abajo es un PER. Foto del " + sello
    + " — para rehacerla: hoja maestra → menú STARGATE → «Actualizar la consola».").setFontColor("#8899aa");
  pt.getRange(3,1).setValue("Hoja maestra (materia prima): " + maestra.getUrl()).setFontColor("#55606a");
  var cab = ["id","Grupo","Tipo","Estado","Inicio","Semana","Reclutas","Sin docente","xp medio","Nivel medio",
             "◈ en circulación","Canjes concedidos","Pendientes de aplicar","Tickets","Sin resolver",
             "Equipo docente","Tablero","Sala de clase","Nave","Form · Bitácora","Form · Canje","Form · Ticket","Documento"];
  pt.getRange(5,1,1,cab.length).setValues([cab]).setFontWeight("bold").setBackground("#eef3f7");
  if (portada.length) pt.getRange(6,1,portada.length,cab.length).setValues(portada);
  pt.setFrozenRows(5); pt.setFrozenColumns(2);
  for (var c2 = 1; c2 <= 14; c2++) try { pt.autoResizeColumn(c2); } catch (e) {}

  // ---- limpieza: pestañas de PER que ya no existen ----
  ss.getSheets().forEach(function(sh){
    var n = sh.getName();
    if (n.indexOf("PER · ") === 0 && !vivos[n]) { try { ss.deleteSheet(sh); } catch (e) {} }
    if (n === "Hoja 1" || n === "Sheet1") { try { ss.deleteSheet(sh); } catch (e) {} }
  });
  try { ss.setActiveSheet(pt); ss.moveActiveSheet(1); } catch (e) {}
  return ss.getUrl();
}
function abrirConsola() {
  try { asegurarTriggers_(); } catch (e) {}   // de paso deja instalada la foto nocturna
  var url = actualizarConsola();
  dialogoEnlace_("STARGATE · Consola del profesorado",
    "La Consola está al día: reclutas, canjes por aplicar y últimos registros, grupo por grupo.",
    url, "Abrir la Consola",
    "Es una <b>foto</b>: se rehace desde este mismo menú y sola cada madrugada.");
}

// ================= PARTE DE SALUD (v3.15) =================
// Los dos peores fallos de la prueba en vivo (la hoja sin triggers, un canje sin resolver) eran
// INVISIBLES: había que ir a mirarlos a seis sitios distintos. Esto los junta en una pantalla.
// 🔴 No repara NADA: solo informa y dice qué opción del menú lo arregla. Reparar por sorpresa lo
// que no se ha entendido todavía es justo como se rompen las cosas en producción.
function salud_() {
  var puntos = [], t = reloj_(), incompleto = false;
  function punto(clave, nivel, titulo, detalle, arreglo, n) {
    puntos.push({ clave: clave, nivel: nivel, titulo: titulo, detalle: detalle || "",
                  arreglo: nivel === "ok" ? "" : (arreglo || ""), n: n || 0 });
  }
  function seguro(clave, titulo, fn) {
    try { fn(); }
    catch (e) { punto(clave, "mal", titulo, "no se ha podido comprobar: " + (e && e.message ? e.message : e),
                      "Vuelve a abrir la hoja y prueba otra vez; si sigue, mira el registro de ejecuciones."); }
  }
  var pers = [], todos = [];
  try {
    todos = hoja_(H.PERS).getDataRange().getValues().slice(1).filter(function(v){ return v[0]; });
    pers = todos.filter(function(v){ return !v[21]; });   // activos: lo que se mira grupo a grupo
  } catch (e) {}

  // 1) TRIGGERS · sin alRecibirRespuesta no se procesa ni un formulario; duplicados = todo dos veces
  seguro("triggers", "Triggers", function(){
    var cuenta = {};
    ScriptApp.getProjectTriggers().forEach(function(t){ var f = t.getHandlerFunction(); cuenta[f] = (cuenta[f] || 0) + 1; });
    var faltan = [], dobles = [];
    ["alRecibirRespuesta", "fotoNocturna"].forEach(function(f){
      if (!cuenta[f]) faltan.push(f); else if (cuenta[f] > 1) dobles.push(f + " ×" + cuenta[f]);
    });
    if (!faltan.length && !dobles.length) return punto("triggers", "ok", "Triggers", "los dos instalados, uno de cada");
    punto("triggers", "mal", "Triggers",
      (faltan.length ? "FALTA: " + faltan.join(", ") + ". " : "") +
      (dobles.length ? "DUPLICADO: " + dobles.join(", ") + " (cada envío se procesa dos veces)." : ""),
      "Menú → «Abrir la Consola del profesorado»: repone los que falten y borra los duplicados.",
      faltan.length + dobles.length);
  });

  // 2) TAREAS A MEDIAS · normal durante unos minutos; preocupante si se quedó ahí
  seguro("tareas", "Tareas a medias", function(){
    var medias = [];
    ["reset", "formularios", "alta", "canjes"].forEach(function(k){
      var p = progreso_(k); if (p) medias.push(k + " (" + (p.n || p.i || 0) + " de " + (p.total || "?") + ")");
    });
    if (!medias.length) return punto("tareas", "ok", "Tareas a medias", "ninguna pendiente");
    punto("tareas", "aviso", "Tareas a medias", medias.join(" · "),
      "Se reanudan solas dentro de un minuto. Si llevan ahí mucho rato, vuelve a lanzar esa misma opción del menú.",
      medias.length);
  });

  // 3) CANJES SIN RESOLVER · el fallo que se escondió: el alumno no cobra, no recibe y nadie se entera
  // 🔴 REVISIÓN 26-ago · aquí se miran TODOS los grupos, archivados incluidos: un canje sin resolver
  // es dinero cobrado sin entregar nada, y archivar el grupo no lo arregla — lo esconde para siempre.
  // (Es además lo que ya hacía reprocesarCanjes_: tenían dos criterios distintos.)
  seguro("canjes", "Canjes sin resolver", function(){
    var n = 0, donde = [];
    todos.forEach(function(v){
      var o = perObj_(v), arch = v[21] ? " · archivado" : "";
      var sh = SpreadsheetApp.getActive().getSheetByName(o.tabC);
      if (!sh || sh.getLastRow() < 2) return;
      var vals = sh.getDataRange().getValues(), col = vals[0].map(String).indexOf("Estado");
      if (col < 0) { n += vals.length - 1; donde.push(o.nombre + ": " + (vals.length - 1) + " (sin columna Estado)" + arch); return; }
      var k = 0;
      for (var i = 1; i < vals.length; i++) if (!String(vals[i][col] || "").trim()) k++;
      if (k) { n += k; donde.push(o.nombre + ": " + k + arch); }
    });
    if (!n) return punto("canjes", "ok", "Canjes sin resolver", "ninguno");
    punto("canjes", "mal", "Canjes sin resolver", n + " sin resolver · " + donde.join(" · "),
      "Menú → Mantenimiento → «Reprocesar canjes sin resolver».", n);
  });

  // 4) y 5) AJUSTES · errores del trigger y avisos que no llegaron a nadie (últimos 7 días)
  var errores = 0, avisosPerdidos = 0, ultimoError = "";
  seguro("errores", "Errores del trigger", function(){
    var desde = new Date().getTime() - 7 * 864e5;
    hoja_(H.AJ).getDataRange().getValues().slice(1).forEach(function(v){
      var t = 0; try { t = new Date(v[0]).getTime(); } catch (e) { t = desde; }
      if (t < desde) return;
      if (v[3] === "ERROR") { errores++; ultimoError = String(v[5] || ""); }
      else if (v[3] === "AVISO" && String(v[6] || "").indexOf("SIN CORREO") >= 0) avisosPerdidos++;
    });
    if (!errores) punto("errores", "ok", "Errores del trigger", "ninguno en 7 días");
    else punto("errores", "mal", "Errores del trigger", errores + " en los últimos 7 días · último: " + ultimoError,
      "Míralos en la pestaña AJUSTES (filas ERROR). Si son de canjes, «Reprocesar canjes sin resolver» los recupera.", errores);
    if (!avisosPerdidos) punto("avisos", "ok", "Avisos entregados", "todos llegaron a alguien");
    else punto("avisos", "mal", "Avisos sin destinatario", avisosPerdidos + " avisos no llegaron a nadie en 7 días",
      "Pon el correo de cada docente en la pestaña DOCENTES, y un correo de reserva en menú → «Correo de avisos de reserva».", avisosPerdidos);
  });

  // 6) DOCENTES SIN CORREO · sin correo no hay avisos de canje
  seguro("docentes", "Docentes sin correo", function(){
    var sin = [];
    pers.forEach(function(v){
      docentesDe_(v[0]).forEach(function(d){ if (!String(d.correo || "").trim()) sin.push(d.nombre + " (" + v[1] + ")"); });
    });
    if (!sin.length) return punto("docentes", "ok", "Docentes sin correo", "todo el profesorado tiene correo");
    punto("docentes", "aviso", "Docentes sin correo", sin.slice(0, 8).join(" · ") + (sin.length > 8 ? " …" : ""),
      "Pestaña DOCENTES de la hoja, o profes.html → «Ajustes del PER».", sin.length);
  });

  // 7) RECLUTAS SIN DOCENTE · no salen en la sala de nadie
  seguro("reclutas", "Reclutas sin docente", function(){
    var n = 0, donde = [], sinMirar = 0;
    pers.forEach(function(v){
      // calcular un tablero por grupo es lo único caro de este parte: con muchos PER se puede ir de
      // los 6 minutos. Antes de quedarse sin tiempo, se para y lo dice.
      if (!t.sobra(20000)) { sinMirar++; return; }
      var tb = tablero_(v[0], true);
      if (tb && tb.sin_docente) { n += tb.sin_docente; donde.push(v[1] + ": " + tb.sin_docente); }
    });
    if (sinMirar) incompleto = true;
    var cola = sinMirar ? " (no dio tiempo a mirar " + sinMirar + " grupo(s))" : "";
    if (!n) return punto("reclutas", sinMirar ? "aviso" : "ok", "Reclutas sin docente",
      (sinMirar ? "sin terminar" : "todos tienen docente") + cola,
      sinMirar ? "Vuelve a abrir el parte: sigue por donde no llegó." : "", sinMirar);
    punto("reclutas", "aviso", "Reclutas sin docente", n + " sin docente · " + donde.join(" · ") + cola,
      "Se arregla uno a uno en clase.html → «Corregir la ficha», o en profes.html.", n);
  });

  // 8) PER SIN DOCUMENTO · el documento de enlaces es lo que se reparte al profesorado
  seguro("documentos", "PER sin documento", function(){
    var sin = pers.filter(function(v){ return !perObj_(v).doc; }).map(function(v){ return v[1]; });
    if (!sin.length) return punto("documentos", "ok", "Documento de enlaces", pers.length + " PER, todos con documento");
    punto("documentos", "aviso", "PER sin documento", sin.join(" · "),
      "Selecciona su fila y usa menú → «Documento de enlaces y embeds del PER seleccionado».", sin.length);
  });

  // 9) CUOTA DE CORREO · 100 al día en cuentas gratuitas, y cuando se acaba el correo no sale
  seguro("cuota", "Cuota de correo", function(){
    var q = cuotaCorreo_();
    if (q >= 20) return punto("cuota", "ok", "Cuota de correo", q + " correos disponibles hoy");
    punto("cuota", q > 0 ? "aviso" : "mal", "Cuota de correo",
      q > 0 ? "quedan solo " + q + " correos hoy" : "AGOTADA: hoy ya no sale ningún correo",
      "Se repone sola mañana. Los canjes se resuelven igual (el correo es un extra), pero nadie recibe aviso.", q);
  });

  // 10) LOS DOS PIN · el del profesorado protege nombres y correos del alumnado; el de referente,
  // las acciones que afectan a un grupo entero (calendario, archivar, formularios, equipo docente)
  seguro("pin", "PIN del profesorado", function(){
    var pr = PropertiesService.getScriptProperties();
    var pin = pr.getProperty("PIN_PROFES") || "", ref = pr.getProperty("PIN_REFERENTE") || "";
    if (pin && ref && pin === ref)
      return punto("pin", "mal", "PIN del profesorado",
        "los dos PIN son IGUALES: así no separan nada y todo el equipo puede mover la semana 1 o archivar un grupo",
        "Menú → «PIN del profesor referente»: pon uno distinto, y más largo que el del día a día.", 1);
    if (pin.length < 6)
      return punto("pin", "mal", "PIN del profesorado",
        pin ? "el del profesorado es demasiado corto (" + pin.length + " caracteres): es lo único que protege nombres y correos del alumnado"
            : "NO HAY PIN: cualquiera con el enlace ve nombres y correos",
        "Menú → «Cambiar PIN del profesorado». Seis caracteres o más.", 1);
    if (ref && ref.length < 8)
      return punto("pin", "mal", "PIN del profesorado",
        "el de referente es demasiado corto (" + ref.length + " caracteres) y abre lo que afecta a un grupo entero",
        "Menú → «PIN del profesor referente». Ocho o más: ese no se teclea con prisa antes de clase.", 1);
    if (!ref)
      return punto("pin", "aviso", "PIN del profesorado",
        "el del profesorado está puesto (" + pin.length + " caracteres), pero NO hay PIN de referente: " +
        "cualquiera del equipo puede mover la semana 1 de cualquier grupo, archivarlo o cerrar sus formularios",
        "Menú → «PIN del profesor referente». Hasta que lo pongas, todo sigue funcionando como hasta ahora.");
    punto("pin", "ok", "PIN del profesorado",
      "los dos puestos y distintos: profesorado de " + pin.length + " caracteres, referente de " + ref.length);
  });

  // 11) CONSOLA Y DOSSIER
  seguro("consola", "Consola y dossier", function(){
    var pr = PropertiesService.getScriptProperties();
    var falta = [];
    if (!pr.getProperty(PROP_CONSOLA)) falta.push("Consola");
    if (!pr.getProperty(PROP_DOSSIER)) falta.push("dossier");
    if (!falta.length) return punto("consola", "ok", "Consola y dossier", "las dos creadas");
    punto("consola", "aviso", "Consola y dossier", "falta: " + falta.join(" y "),
      "Menú → «Abrir la Consola del profesorado» y «Dossier del profesorado». También se rehacen de madrugada.", falta.length);
  });

  // 12) DOS CUENTAS, UNA PERSONA · el recluta se identifica por el correo que trae su cuenta de
  // Google, así que no hay erratas al teclearlo — pero quien entra un día con la cuenta del máster y
  // otro con la personal sale DOS VECES en el ranking, cada una con sus xp y ninguna completa.
  // No se puede impedir; sí se puede ver antes de que el alumno escriba preguntando qué le pasa.
  seguro("dobles", "Dos cuentas, una persona", function(){
    var sospechas = [];
    pers.forEach(function(v){
      var o = perObj_(v), vistos = {};
      (tablero_(o.id, true).reclutas || []).forEach(function(r){
        var k = normalizar_(r.nombre); if (!k) return;
        if (vistos[k] && vistos[k] !== r.email) sospechas.push(o.nombre + ": «" + r.nombre + "» con " + vistos[k] + " y " + r.email);
        else vistos[k] = r.email;
      });
    });
    if (!sospechas.length) return punto("dobles", "ok", "Dos cuentas, una persona", "nadie aparece dos veces");
    punto("dobles", "aviso", "Dos cuentas, una persona", sospechas.slice(0, 5).join(" · ") +
      (sospechas.length > 5 ? " (y " + (sospechas.length - 5) + " más)" : ""),
      "Pregúntale con cuál quiere quedarse y pásale los retos de la otra desde AJUSTES (acción «otorgar»). " +
      "Y recuérdale a la clase que entre SIEMPRE con la misma cuenta.", sospechas.length);
  });

  // 13) PARTES INFLADOS · el ticket es anónimo y no se puede deduplicar, así que alguien podría
  // enviarlo muchas veces para disparar el bonus de la tripulación. No se puede impedir; lo que sí
  // se puede es que no pase desapercibido: más partes que reclutas en un tema es raro de por sí.
  seguro("partes", "Partes del ticket", function(){
    var raros = [];
    pers.forEach(function(v){
      var o = perObj_(v), n = (tablero_(o.id, true).reclutas || []).length;
      if (!n) return;
      var partes = partesPorSeccion_(o);
      Object.keys(partes).forEach(function(k){
        if (partes[k] > n) raros.push(o.nombre + " · " + k + ": " + partes[k] + " partes para " + n + " reclutas");
      });
    });
    if (!raros.length) return punto("partes", "ok", "Partes del ticket", "ningún tema recibe más partes que reclutas hay");
    punto("partes", "aviso", "Partes del ticket", raros.slice(0, 5).join(" · "),
      "Puede ser normal (alguien lo mandó dos veces sin querer) o alguien inflando el bonus de la " +
      "tripulación. Mira las respuestas de ese tema antes de darlo por bueno.", raros.length);
  });

  var malos = puntos.filter(function(p){ return p.nivel === "mal"; }).length;
  var avisos = puntos.filter(function(p){ return p.nivel === "aviso"; }).length;
  return { ok: malos === 0, malos: malos, avisos: avisos, puntos: puntos, pers: pers.length,
           incompleto: incompleto, fecha: new Date() };
}
// ================= EL VIGIA =================
// v3.18 · El parte de salud ya sabia detectar los triggers duplicados, la cuota de correo, los
// canjes sin resolver y los errores del trigger. Los duplicados los descubrimos a mano, de
// casualidad, mirando el registro de ejecuciones — porque NADIE ABRIO EL PARTE. A este sistema no
// le faltaba inteligencia: le faltaba boca.
//
// Cuelga de fotoNocturna (4:00) a proposito: ni un trigger nuevo que instalar, mantener o duplicar.
//
// Cuando habla y cuando calla:
//   · hay algo mal o en aviso  -> escribe si el problema es NUEVO, y si sigue igual insiste cada 7 dias
//   · se ha arreglado todo     -> lo dice UNA vez, y calla
//   · todo bien desde hace 30 dias -> una senal de vida, porque si no el silencio de un script muerto
//     es identico al silencio de un sistema sano, y eso es justo lo que no queremos durante una baja
// El vigia deja constancia en AJUSTES de lo que decidio y de si el correo salio. El registro de
// Cloud no siempre esta disponible en este proyecto (lo dice el propio codigo mas arriba), asi que
// sin este rastro un vigia averiado es indistinguible de un sistema sano. Que es exactamente lo
// contrario de para lo que sirve.
function rastroVigia_(motivo, ok, detalle) {
  try { hoja_(H.AJ).appendRow([new Date(), "", "", "VIGIA", motivo || "callado",
    (ok ? "aviso enviado" : "NO salio el aviso") + (detalle ? " · " + detalle : ""), "sistema"]); } catch (e) {}
}
var VIGIA_INSISTE_DIAS = 7;
var VIGIA_LATIDO_DIAS = 30;
function vigiaDiario() {
  var pr = PropertiesService.getScriptProperties();
  var s;
  try { s = salud_(); }
  catch (e) {
    // que el parte reviente ES la peor noticia posible, asi que se cuenta igual
    var ok0 = enviarCorreo_(correoDeReserva_(), "STARGATE · el parte de salud no se puede ni ejecutar",
      "Al mirar el sistema ha saltado un error:\n\n" + (e && e.message ? e.message : e) +
      "\n\nHoja: " + SpreadsheetApp.getActive().getUrl());
    rastroVigia_("el parte revento", ok0, ok0 ? "" : _falloCorreo);
    return { enviado: ok0, motivo: "el parte revento" };
  }
  var pegas = s.puntos.filter(function(p){ return p.nivel !== "ok"; });
  var huella = pegas.map(function(p){ return p.nivel + ":" + p.clave; }).sort().join("|");
  var ant = {}; try { ant = JSON.parse(pr.getProperty("VIGIA_ESTADO") || "{}"); } catch (e2) {}
  var dias = ant.fecha ? Math.floor((new Date().getTime() - new Date(ant.fecha).getTime()) / 864e5) : 999;

  var motivo = "";
  if (huella) {
    if (huella !== ant.huella) motivo = "algo nuevo";
    else if (dias >= VIGIA_INSISTE_DIAS) motivo = "sigue sin arreglarse";
  } else if (ant.huella) motivo = "ya esta arreglado";
  else if (dias >= VIGIA_LATIDO_DIAS) motivo = "senal de vida";

  if (!motivo) { rastroVigia_("nada que contar", true, huella ? "sigue: " + huella : "todo en orden");
                 return { enviado: false, huella: huella }; }

  // ojo con el nombre: «icono» es el semaforo de parteDeSalud (los emojis del §19). Este es otro.
  var marca = { mal: "[!]", aviso: "[-]" };
  var titulo = huella
    ? (s.malos ? "\uD83D\uDD34 STARGATE · " + s.malos + " cosa" + (s.malos > 1 ? "s" : "") + " que arreglar"
               : "\uD83D\uDFE1 STARGATE · " + s.avisos + " aviso" + (s.avisos > 1 ? "s" : ""))
    : (ant.huella ? "\uD83D\uDFE2 STARGATE · arreglado, todo en orden"
                  : "\uD83D\uDFE2 STARGATE · sigo vigilando, todo en orden");
  var cuerpo = huella
    ? "Esto es lo que he visto esta manana en STARGATE:\n\n" +
      pegas.map(function(p){ return (marca[p.nivel] || "") + " " + p.titulo + " — " + p.detalle +
        (p.arreglo ? "\n    Que hacer: " + p.arreglo : ""); }).join("\n\n") +
      (motivo === "sigue sin arreglarse" ? "\n\n(Esto ya te lo dije hace " + dias + " dias y sigue igual.)" : "")
    : (ant.huella ? "Lo que estaba mal ya no lo esta. No hay nada pendiente."
                  : "Llevo " + dias + " dias mirando y no ha hecho falta molestarte. Sigo aqui.");
  cuerpo += "\n\n" + s.pers + " PER activos · " +
            Utilities.formatDate(s.fecha, "Europe/Madrid", "d/MM/yyyy HH:mm") +
            "\nHoja: " + SpreadsheetApp.getActive().getUrl() +
            "\n\nEste aviso sale solo cuando hay algo que contar. Si no recibes nada, es que va bien.";

  var destino = correoDeReserva_();
  var ok = enviarCorreo_(destino, titulo, cuerpo);
  rastroVigia_(motivo, ok, ok ? "a " + destino : _falloCorreo + " (a «" + destino + "»)");
  pr.setProperty("VIGIA_ESTADO", JSON.stringify({ huella: huella, fecha: new Date().toISOString() }));
  return { enviado: ok, motivo: motivo, huella: huella, titulo: titulo, fallo: ok ? "" : _falloCorreo };
}
// El parte de salud (parteDeSalud / saludHtml) vive en Bonus.gs: Code.gs no tiene sitio.
function escapar_(s) { return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

// ================= REPROCESAR CANJES SIN RESOLVER (v3.15) =================
// Ya pasó una vez: el trigger murió a media faena y un canje se quedó sin estado, sin cobrar y sin
// respuesta. resolverCanje_ es idempotente (sale si la fila ya tiene estado), así que reprocesar es
// seguro. Va por lotes como todo lo que recorre PERs: recorrerlos todos no cabe en 6 minutos.
function reprocesarCanjes_() {
  var t = reloj_();
  var pers = hoja_(H.PERS).getDataRange().getValues().slice(1).filter(function(v){ return v[0]; });
  var pr = progreso_("canjes") || { i: 0, n: 0, resueltos: 0, fallos: [] };
  pr.total = pers.length;
  while (pr.i < pers.length && t.puedo()) {
    var v = pers[pr.i];
    try {
      var o = perObj_(v);
      var sh = SpreadsheetApp.getActive().getSheetByName(o.tabC);
      if (sh && sh.getLastRow() > 1) {
        var vals = sh.getDataRange().getValues(), col = vals[0].map(String).indexOf("Estado");
        for (var i = 1; i < vals.length; i++) {
          if (col >= 0 && String(vals[i][col] || "").trim()) continue;
          if (!String(vals[i][0] || "") && !vals[i].some(function(x){ return String(x || "").trim(); })) continue;  // fila vacía
          try { resolverCanje_(o, sh, i + 1); pr.resueltos++; }
          catch (e2) { pr.fallos.push(String(v[1]) + " fila " + (i + 1) + ": " + e2.message); }
        }
      }
    } catch (e) { pr.fallos.push(String(v[1]) + ": " + e.message); }
    pr.i++; pr.n++; t.marcar();
  }
  var terminado = pr.i >= pers.length;
  if (terminado) { guardarProgreso_("canjes", null); cancelarContinuacion_("continuarReprocesarCanjes"); }
  else { guardarProgreso_("canjes", pr); programarContinuacion_("continuarReprocesarCanjes"); }
  return { terminado: terminado, hechos: pr.n, total: pers.length, resueltos: pr.resueltos, fallos: pr.fallos };
}
function reprocesarCanjesSinResolver() {
  var ui = SpreadsheetApp.getUi();
  var pendiente = progreso_("canjes");
  if (pendiente && ui.alert("Reprocesar canjes",
      "Hay un reproceso a medias (" + pendiente.n + " de " + (pendiente.total || "?") + " grupos).\n\n" +
      "SÍ = seguir donde se quedó · NO = empezar de cero.", ui.ButtonSet.YES_NO) !== ui.Button.YES) {
    guardarProgreso_("canjes", null);
  }
  var r = reprocesarCanjes_();
  ui.alert(r.terminado ? "Canjes reprocesados" : "Reproceso en marcha (va por lotes)",
    (r.terminado
      ? "Listo: " + r.resueltos + " canje(s) resueltos en " + r.hechos + " grupos."
      : "Hechos " + r.hechos + " de " + r.total + " grupos (" + r.resueltos + " canjes resueltos). El resto sigue " +
        "SOLO dentro de un minuto.") +
    "\n\nSe resuelven únicamente las filas SIN estado: las ya concedidas o denegadas no se tocan, así que " +
    "nadie paga ni recibe dos veces." +
    (r.fallos.length ? "\n\nNo se pudo con:\n" + r.fallos.slice(0, 12).join("\n") : ""), ui.ButtonSet.OK);
}
function continuarReprocesarCanjes() {
  var r = reprocesarCanjes_();
  Logger.log("continuarReprocesarCanjes: " + r.hechos + "/" + r.total + " · " + r.resueltos + " resueltos" + (r.terminado ? " · TERMINADO" : " · sigue"));
}

// ================= API =================
// v3.35 · DOS PIN, UN SOLO NIVEL. Hasta hoy el rol de referente no protegía nada: solo ordenaba la
// vista. Cualquiera con el PIN del profesorado podía mover la semana 1 de cualquier grupo —que
// reprograma el calendario entero—, archivar el PER, cerrar los formularios o reescribir el equipo
// docente. Son acciones que afectan a TODO el alumnado de un grupo.
// La pantalla del PIN sigue siendo la misma: nadie tiene que saber por dónde entrar. El servidor
// mira qué PIN han tecleado y decide qué abre.
var ACCIONES_REFERENTE = ["profesorado", "inicio", "abrir", "cerrar", "archivar", "panel", "documento"];
function nivelDePin_(pin) {
  var pr = PropertiesService.getScriptProperties();
  var docente = pr.getProperty("PIN_PROFES") || "", referente = pr.getProperty("PIN_REFERENTE") || "";
  var p = String(pin == null ? "" : pin);
  if (!docente) return "";                                  // sin PIN de profesorado no entra nadie
  // Se mira el de referente PRIMERO. Si alguien los dejó iguales manda el nivel alto: nadie se queda
  // fuera y el sistema se comporta como antes del cambio. El parte de salud lo canta en rojo.
  if (referente && p === referente) return "referente";
  if (p !== docente) return "";
  // 🔴 COMPATIBILIDAD: mientras nadie configure el PIN de referente, el de siempre lo abre TODO,
  // exactamente como hasta hoy. Esto es lo que permite desplegar esto a mitad de curso sin avisar a
  // nadie: el nivel nuevo se activa el día que el referente pone el suyo.
  return referente ? "docente" : "referente";
}
// Quién movió el calendario o archivó un grupo deja de ser opcional cuando hay dos niveles.
// Sin correos: la exportación de investigación sale seudonimizada y un correo dentro de un texto
// libre se cuela por ahí (lo caza la batería 5).
function trazaReferente_(a, per, q) {
  try {
    var d = "";
    if (a === "inicio") d = q.inicio ? "semana 1: " + q.inicio : "sin fecha";
    else if (a === "archivar") d = q.valor ? "archivado" : "desarchivado";
    else if (a === "panel") d = "paneles del grupo";
    else if (a === "profesorado") d = "referente: " + String(q.referente || "");
    hoja_(H.AJ).appendRow([new Date(), per || "", "", "REFERENTE", a, d, String(q.profe || "").trim()]);
  } catch (e) { Logger.log("trazaReferente_: " + e); }
}
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
        nivel:yo.nivel, rango:yo.rango, rango_nombre:yo.rango_nombre, nivel_titulo:yo.nivel_titulo,
        xp_siguiente:yo.xp_siguiente, xp_faltan:yo.xp_faltan,
        creditos:yo.creditos, creditos_ganados:yo.creditos_ganados, creditos_gastados:yo.creditos_gastados,
        canjeados:yo.canjeados || {},
        profe:yo.profe || "", planeta:yo.planeta, tema:yo.tema, insignias:yo.insignias, n:yo.n, pos:yo.pos,
        bio:yo.bio || "", bitacora:yo.bitacora || "",
        titulo:yo.titulo || "", marco:yo.marco || "", fondo:yo.fondo || "", cromos:yo.cromos || {}, corona:!!yo.corona,
        heroes:yo.heroes || [], skins:yo.skins || [], viste:yo.viste || "",
        // v3.19 · la ficha del alumno tiene que traer TODO lo que la Nave celebra y pinta. Faltaban
        // estos tres y por eso la celebracion no veia los bonus ni los planetas completos.
        bonus:yo.bonus || [], planetas_completos:yo.planetas_completos || [], coleccion:yo.coleccion || null,
        // v3.37 · los retos que YA tiene, por id. La Nave los necesita para su sección de retos:
        // deducirlos de las insignias casi funciona, pero las derivadas y las de reclutamiento
        // enturbian la cuenta, y aquí «casi» significa decirle a alguien que le falta algo que hizo.
        retos: Object.keys(yo.retos || {}),
        xp7:yo.xp7 || 0,
        repes:yo.repes || 0, repes_disponibles:yo.repes_disponibles || 0, racha:yo.racha || 0 } : null,
        // 🔴 se dice que la ventana está abierta y hasta cuándo, pero NUNCA la consigna: si viajara
        // hasta aquí, no haría falta estar en clase para verla y todo esto no valdría nada.
        pase: (function(){ var pa = paseActivo_(q.per); if (!pa) return null;
          var cobrado = yo && (yo.bonus || []).indexOf("pase:" + pa.id) >= 0;
          return { abierto: true, hasta: pa.hasta, cobrado: cobrado, creditos: cfgPase_().creditos }; })()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    // v3.16 · VESTIRSE, sin PIN a propósito. El alumnado no va a recordar otra clave y pedírsela
    // sería peor que el problema: lo único que se puede hacer aquí es ponerse algo QUE YA SE TIENE
    // desbloqueado. Es cosmético, se deshace en un clic y no toca ni xp ni créditos.
    // v3.19 · EL CAPITAN PAGA EL TUTORIAL. Sin PIN, como vestirse: el alumnado no tiene clave. Se
    // concede UNA VEZ y queda escrito, asi que repetir el tutorial no vuelve a pagar.
    if (q.accion === "tutorial") {
      var tt2 = tablero_(q.per, true); if (tt2.error) throw new Error(tt2.error);
      var et2 = String(q.email || "").toLowerCase().trim();
      var yo2 = (tt2.reclutas || []).filter(function(x){ return x.email === et2; })[0];
      if (!yo2) throw new Error("No te encuentro en este grupo");
      if (yo2.bonus.indexOf("tutorial") >= 0)
        return ContentService.createTextOutput(JSON.stringify({ ok: true, yaEstaba: true, creditos: 0 }))
          .setMimeType(ContentService.MimeType.JSON);
      hoja_(H.AJ).appendRow([new Date(), q.per, et2, "EXTRA", "bonus", "tutorial", "sistema"]);
      return ContentService.createTextOutput(JSON.stringify({ ok: true, creditos: BONUS_TUTORIAL.creditos || 0 }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    // el pase de lista: sin PIN, como vestirse y como el tutorial
    if (q.accion === "pase") {
      var tp = tablero_(q.per, true); if (tp.error) throw new Error(tp.error);
      var ep = String(q.email || "").toLowerCase().trim();
      if (!(tp.reclutas || []).filter(function(x){ return x.email === ep; }).length)
        throw new Error("No te encuentro en este grupo");
      return ContentService.createTextOutput(JSON.stringify(reclamarPase_(q.per, ep, q.palabra)))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (q.accion === "vestir") {
      var tv = tablero_(q.per, true); if (tv.error) throw new Error(tv.error);
      var ev = String(q.email || "").toLowerCase().trim();
      var yov = (tv.reclutas || []).filter(function(x){ return x.email === ev; })[0];
      if (!yov) throw new Error("No encuentro a ese recluta en el grupo");
      var val = String(q.viste || "");
      var mh = val.match(/^heroe:(.+)$/), ms = val.match(/^skin:([1-5])$/);
      var vale = mh ? (yov.heroes || []).indexOf(mh[1]) >= 0
               : ms ? (yov.skins || []).indexOf(Number(ms[1])) >= 0 : false;
      if (!vale) throw new Error("Eso todavía no lo tienes desbloqueado");
      extra_(perObj_(perFila_(q.per).v), ev, "viste", val);
      return ContentService.createTextOutput(JSON.stringify({ ok:true, viste:val }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    // 🔴 Lo comprueba el SERVIDOR, que es la única puerta. Esconder la pestaña de Ajustes en el
    // navegador es cortesía, no seguridad: con la consola abierta la llamada se hace igual.
    var a = q.accion, per = q.per;
    var nivel = nivelDePin_(q.pin);
    if (!nivel) throw new Error("PIN incorrecto");
    if (nivel !== "referente" && ACCIONES_REFERENTE.indexOf(a) >= 0)
      throw new Error("Esto lo hace el profesor referente del grupo, con su PIN.");
    // La pantalla de «¿Quién eres?» pinta un desplegable de NOMBRES: los correos de todo el
    // profesorado no pintan nada ahí (el doGet público ya los filtraba; esto no).
    if (a === "pers") out = { pers: hoja_(H.PERS).getDataRange().getValues().slice(1).filter(function(v){ return v[0]; })
      .map(function(v){ var ob = perObj_(v);
        ob.docentes = docentesDe_(ob.id).map(function(d){ return { nombre:d.nombre, rol:d.rol, panel:d.panel }; });
        ob.semana = semanaDe_(ob); return ob; }) };
    else if (a === "alumnos") out = tablero_(per, true);
    else if (a === "mi_panel") { var okp = guardarPanelDocente_(per, q.profe, q.url);
      out = { ok: okp, panel: String(q.url || "").trim(),
              error: okp ? "" : "No encuentro a «" + q.profe + "» en el equipo docente de este grupo." }; }
    else if (a === "pase_abrir") out = abrirPase_(perObj_(perFila_(per).v), q.profe, q.minutos);
    else if (a === "pase_estado") { var pact = paseActivo_(per); out = { pase: pact }; }
    else if (a === "tickets") { var o = perObj_(perFila_(per).v); var sh = SpreadsheetApp.getActive().getSheetByName(o.tabT); var v = sh && sh.getLastRow() > 1 ? sh.getDataRange().getValues() : [[]];
      var cabT = (v[0]||[]).map(String);
      var cRes = cabT.indexOf("Resuelto");
      out = { tickets: v.slice(1).map(function(r, k){ var o2 = {}; cabT.forEach(function(c,i){ if (i > 0 && c !== "Resuelto" && r[i] !== "" && r[i] !== null) o2[c] = r[i]; }); return { fecha:r[0], fila:k+2, resuelto: cRes >= 0 ? String(r[cRes]||"") : "", r:o2 }; }) }; }
    else if (a === "ticket_resuelto") { var o5 = perObj_(perFila_(per).v); var sht = SpreadsheetApp.getActive().getSheetByName(o5.tabT); var cabR = sht.getRange(1,1,1,sht.getLastColumn()).getValues()[0].map(String);
      var colR = cabR.indexOf("Resuelto") + 1; if (!colR) { colR = sht.getLastColumn() + 1; sht.getRange(1, colR).setValue("Resuelto"); } sht.getRange(q.fila, colR).setValue(q.valor ? "Sí · " + (q.profe||"") + " · " + Utilities.formatDate(new Date(),"Europe/Madrid","dd/MM") : ""); out = { ok:true }; }
    else if (a === "ajuste") { hoja_(H.AJ).appendRow([new Date(), per, String(q.email).toLowerCase(), q.reto_id, q.tipo, q.motivo || "", q.profe || ""]); out = { ok:true }; }
    else if (a === "profesorado") { var p = perFila_(per); var sh4 = hoja_(H.PERS); sh4.getRange(p.fila, 4).setValue(q.profesorado || ""); sh4.getRange(p.fila, 17).setValue(q.referente || "");
      if (q.docentes) guardarDocentes_(per, q.docentes);
      try { var o4 = perObj_(perFila_(per).v); var ftx = FormApp.openByUrl(o4.formTicketEdit); ftx.getItems(FormApp.ItemType.LIST).forEach(function(i){ if (i.getTitle().indexOf("profesor o profesora") >= 0) i.asListItem().setChoiceValues(listaProfes_(q.referente, q.profesorado, per)); }); } catch (e2) {}
      out = { ok:true }; }
    else if (a === "ficha") {
      var of = perObj_(perFila_(per).v); var shf = SpreadsheetApp.getActive().getSheetByName(of.tabB);
      if (!shf || shf.getLastRow() < 2) throw new Error("Ese grupo aún no tiene respuestas de la Bitácora");
      var vf = shf.getDataRange().getValues(), cf = vf[0].map(String);
      var cMf = idx_(cf,"correo") >= 0 ? idx_(cf,"correo") : idx_(cf,"email");
      var mail = String(q.email || "").toLowerCase().trim(); var filaF = 0;
      for (var i3 = 1; i3 < vf.length; i3++) if (String(vf[i3][cMf] || "").toLowerCase().trim() === mail) filaF = i3 + 1;
      if (!filaF) throw new Error("No encuentro a ese recluta en la Bitácora del grupo");
      var campos = [["alias", idx_(cf,"alias")], ["nombre", idx_(cf,"apellidos")],
                    ["profe", idx_(cf,"quién imparte")], ["bitacora", idx_(cf,"bitácora")]];
      var tocados = [];
      campos.forEach(function(c){
        if (q[c[0]] === undefined || c[1] < 0) return;
        shf.getRange(filaF, c[1] + 1).setValue(q[c[0]]); tocados.push(c[0]);
      });
      hoja_(H.AJ).appendRow([new Date(), per, mail, "FICHA", "editar", tocados.join(","), q.profe_edita || ""]);
      out = { ok:true, tocados:tocados };
    }
    else if (a === "archivar") { setArchivado_(per, !!q.valor); out = { ok:true }; }
    else if (a === "documento") { out = { url: crearDocumentoPER_(per) }; }
    else if (a === "panel") { var pp = perFila_(per); hoja_(H.PERS).getRange(pp.fila, 20).setValue(String(q.ver||"").trim()); hoja_(H.PERS).getRange(pp.fila, 21).setValue(String(q.editar||"").trim()); out = { ok:true }; }
    else if (a === "inicio") { var p2 = perFila_(per); hoja_(H.PERS).getRange(p2.fila, 5).setValue(q.inicio ? new Date(q.inicio + "T00:00:00") : "");
      // v3.14 · mover la semana 1 mueve TODO el calendario: apertura, cierre de misiones y cierre del canje
      var fx2 = q.inicio ? reprogramarPER_(per) : null;
      out = { ok:true, calendario: fx2 }; }
    else if (a === "abrir" || a === "cerrar") { setAbierto_(per, a === "abrir"); out = { ok:true }; }
    else if (a === "entregado") { var o2 = perObj_(perFila_(per).v); var shc = SpreadsheetApp.getActive().getSheetByName(o2.tabC); var cab = shc.getRange(1,1,1,shc.getLastColumn()).getValues()[0].map(String);
      var col = cab.indexOf("Entregado") + 1; if (!col) { col = shc.getLastColumn() + 1; shc.getRange(1, col).setValue("Entregado"); } shc.getRange(q.fila, col).setValue(q.valor ? "Sí · " + (q.profe||"") : ""); out = { ok:true }; }
    else throw new Error("Acción desconocida");
    if (out && typeof out === "object") out.nivel = nivel;   // para que la web se adapte sola
    // Se apunta DESPUÉS de que la acción haya salido bien: el registro cuenta lo que pasó, no lo
    // que se intentó.
    if (ACCIONES_REFERENTE.indexOf(a) >= 0) trazaReferente_(a, per, q);
  } catch (err) { out = { error: err.message }; }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

// ================= UTILIDADES =================
function slug_(s) { return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function cambiarPin() { var ui = SpreadsheetApp.getUi(); var pr = PropertiesService.getScriptProperties();
  var r = ui.prompt("PIN del profesorado", "Nuevo PIN (6 caracteres o más). Lo usarán los profes en el panel web, para su día a día.", ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var v = r.getResponseText().trim();
  if (v.length < 4) return;
  // Si los dos PIN coinciden no separan nada, y la sensación de seguridad sería falsa.
  if (v === (pr.getProperty("PIN_REFERENTE") || "")) {
    ui.alert("Ese es el mismo PIN que el del profesor referente. Si son iguales no separan nada. No se ha guardado."); return; }
  pr.setProperty("PIN_PROFES", v); ui.alert("PIN guardado."); }
// v3.35 · El segundo nivel. Abre lo que afecta a TODO un grupo; el del día a día no lo toca.
function cambiarPinReferente() {
  var ui = SpreadsheetApp.getUi(), pr = PropertiesService.getScriptProperties();
  var r = ui.prompt("PIN del profesor referente",
    "Abre lo que afecta a UN GRUPO ENTERO: mover la semana 1 (que reprograma todo el calendario), " +
    "archivar, abrir y cerrar los formularios, el equipo docente y los paneles.\n\n" +
    "Ocho caracteres o más, y distinto del PIN del día a día. No lo metas en el dossier ni en el " +
    "documento de enlaces: esos papeles circulan por todo el equipo.\n\n" +
    "Déjalo vacío para quitarlo: entonces el PIN del profesorado vuelve a abrirlo todo, como antes.",
    ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var v = r.getResponseText().trim();
  if (!v) { pr.deleteProperty("PIN_REFERENTE"); ui.alert("Quitado. El PIN del profesorado vuelve a abrirlo todo."); return; }
  if (v.length < 8) { ui.alert("Demasiado corto: ocho caracteres o más. No se ha guardado."); return; }
  if (v === (pr.getProperty("PIN_PROFES") || "")) {
    ui.alert("Ese es el mismo PIN que el del profesorado. Si son iguales no separan nada y la seguridad sería falsa. No se ha guardado."); return; }
  pr.setProperty("PIN_REFERENTE", v);
  ui.alert("PIN de referente guardado. Desde ahora, mover la semana 1, archivar, abrir y cerrar formularios, " +
           "el equipo docente y los paneles piden ESTE PIN."); }
function pedirWebAppUrl() { var ui = SpreadsheetApp.getUi(); var r = ui.prompt("URL del web app", "Pega la URL que termina en /exec", ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() === ui.Button.OK) { PropertiesService.getScriptProperties().setProperty("WEBAPP_URL", r.getResponseText().trim()); ui.alert("Guardada."); } }
