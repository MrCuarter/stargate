
// ==================== SOLO PARA LA PRUEBA EN VIVO — BORRAR DESPUÉS ====================
// El diálogo «Crear nuevo PER» es un iframe opaco: no se puede rellenar por automatización.
// Estas funciones hacen lo mismo desde el desplegable de «Ejecutar».
// OJO: sin guion bajo delante, porque Apps Script oculta del desplegable las que empiezan por «_».
function pruebaCrearPER() {
  var r = crearPER({
    nombre: "PRUEBA CLAUDE 4P", tipo: "REGULAR", inicio: "2026-05-12",
    referente: "Norberto Cuartero", profesores: "Norberto Genially, Mr Cuarter",
    docentes: [
      { nombre: "Norberto Cuartero", correo: "n.cuartero.10@gmail.com", rol: "referente+imparte" },
      { nombre: "Norberto Genially",  correo: "norberto@genially.com",   rol: "imparte" },
      { nombre: "Mr Cuarter",         correo: "mrcuarter@gmail.com",     rol: "imparte" }],
    apertura: "", cierre: "", panelVer: "", panelEdit: "" });
  Logger.log("PER CREADO: " + JSON.stringify(r));
  return r;
}
function pruebaEstado() {
  var pr = PropertiesService.getScriptProperties();
  var out = {
    version: "v3.13",
    pin_puesto: !!pr.getProperty("PIN_PROFES"),
    webapp: pr.getProperty("WEBAPP_URL") || "",
    consola: pr.getProperty("CONSOLA_ID") ? "https://docs.google.com/spreadsheets/d/" + pr.getProperty("CONSOLA_ID") + "/edit" : "",
    dossier: pr.getProperty("DOSSIER_ID") ? "https://docs.google.com/document/d/" + pr.getProperty("DOSSIER_ID") + "/edit" : "",
    correo_reserva: pr.getProperty("CORREO_AVISOS") || "(el de la cuenta)",
    tareas_a_medias: { reset: progreso_("reset"), formularios: progreso_("formularios") },
    triggers: ScriptApp.getProjectTriggers().map(function(t){ return t.getHandlerFunction(); }),
    pestanas: SpreadsheetApp.getActive().getSheets().map(function(h){ return h.getName(); }),
    pers: hoja_(H.PERS).getDataRange().getValues().slice(1).filter(function(v){ return v[0]; })
            .map(function(v){ var o = perObj_(v);
              return { id:o.id, nombre:o.nombre, tipo:o.tipo, estado:o.estado, inicio:o.inicio, semana:semanaDe_(o),
                       docentes:docentesDe_(o.id), formBitacora:o.formBitacora, formCanje:o.formCanje, formTicket:o.formTicket }; })
  };
  Logger.log(JSON.stringify(out, null, 1));
  return out;
}
function pruebaDossier() { var u = dossier_(); Logger.log("DOSSIER: " + u); return u; }
function pruebaConsola()  { var u = actualizarConsola(); Logger.log("CONSOLA: " + u); return u; }
function pruebaTablero()  { var t = tablero_("prueba-claude-4p", true);
  Logger.log(JSON.stringify({ reclutas: (t.reclutas||[]).map(function(x){
      return { alias:x.alias, email:x.email, profe:x.profe, xp:x.xp, nivel:x.nivel, creditos:x.creditos,
               n:x.n, titulo:x.titulo, marco:x.marco, fondo:x.fondo, cromos:x.cromos, corona:x.corona }; }),
    sin_docente: t.sin_docente, docentes_sin_correo: t.docentes_sin_correo, semana: t.semana }, null, 1));
  return t; }
function pruebaAvisos() {
  var f = hoja_(H.AJ).getDataRange().getValues().slice(1).filter(function(v){ return v[3] === "AVISO"; });
  Logger.log("AVISOS: " + JSON.stringify(f)); return f;
}
function pruebaBorrarPER() {
  var p = perFila_("prueba-claude-4p");
  if (!p) { Logger.log("no existe"); return "no existe"; }
  borrarPER_(perObj_(p.v), p.fila);
  try { consolidarDatos(); } catch (e) {}
  try { actualizarConsola(); } catch (e) {}
  try { dossier_(); } catch (e) {}
  Logger.log("PER de prueba borrado");
  return "borrado";
}
// Reprocesa a mano la última fila del canje: si algo revienta, el error sale EN PANTALLA con su
// traza (el registro de Cloud no está disponible en este proyecto).
function pruebaResolverCanje() {
  var o = perObj_(perFila_("prueba-claude-4p").v);
  var sh = SpreadsheetApp.getActive().getSheetByName(o.tabC);
  Logger.log("tabC guardado: «" + o.tabC + "» · hoja encontrada: " + (sh ? sh.getName() : "NO"));
  if (!sh) { Logger.log("PESTAÑA DEL CANJE NO ENCONTRADA: esa es la causa"); return; }
  var ult = sh.getLastRow();
  Logger.log("última fila: " + ult + " · cabeceras: " + JSON.stringify(sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0]));
  resolverCanje_(o, sh, ult);
  Logger.log("resuelto. Estado ahora: " + JSON.stringify(sh.getRange(ult,1,1,sh.getLastColumn()).getValues()[0]));
}
function pruebaTriggers() {
  var t = ScriptApp.getProjectTriggers().map(function(x){ return x.getHandlerFunction() + " [" + x.getEventType() + "]"; });
  Logger.log("ANTES: " + JSON.stringify(t));
  asegurarTriggers_();
  Logger.log("DESPUÉS: " + JSON.stringify(ScriptApp.getProjectTriggers().map(function(x){ return x.getHandlerFunction(); })));
}

// ==================== v3.28 · LA PRUEBA GRANDE: un PER con diez reclutas ====================

// El PER de la prueba con los dos docentes que pidió Norberto. El panel Genially se deja vacío a
// propósito: crearPER cae solo en el ESTÁNDAR (panelStd_), que es lo que queremos comprobar.
function pruebaCrearPER2() {
  var r = crearPER({
    nombre: "PRUEBA 10 RECLUTAS", tipo: "REGULAR", inicio: "2026-05-04",
    referente: "Norberto Cuartero", profesores: "Norberto Cuartero, Norberto Genially",
    docentes: [
      { nombre: "Norberto Cuartero", correo: "n.cuartero.10@gmail.com", rol: "referente+imparte" },
      { nombre: "Norberto Genially",  correo: "norberto@genially.com",   rol: "imparte" }],
    apertura: "", cierre: "", panelVer: "", panelEdit: "" });
  Logger.log("PER CREADO: " + JSON.stringify(r));
  return r;
}

// Diez reclutas de mentira. Se escriben por el MISMO camino que usa el sistema: la identidad en la
// pestaña de la Bitácora y los retos en EVENTOS, con fechas repartidas hacia atrás. Así todo lo que
// depende del tiempo —rachas, xp de la semana, «vivo o no»— sale realista en vez de plano.
// A propósito hay de todo: dos sobrados, tres a medias, tres que empiezan y dos fantasmas que se
// alistaron y no volvieron. Es lo que se va a encontrar de verdad.
// [alias, nombre, docente, nº de retos, hace cuántos días el último, extras]
var RECLUTAS_PRUEBA = [
  ["Vega",    "Vega Alarcon",   "Norberto Cuartero", 14,  1, { cromos: 9, heroes: 3, titulo: 1, marco: 1 }],
  ["Kestrel", "Kestrel Ibanez", "Norberto Genially", 12,  2, { cromos: 7, heroes: 2, fondo: 1 }],
  ["Nyx",     "Nyx Ferrer",     "Norberto Cuartero",  9,  3, { cromos: 4, heroes: 1 }],
  ["Orbe",    "Orbe Salas",     "Norberto Genially",  8,  5, { cromos: 3 }],
  ["Duna",    "Duna Peralta",   "Norberto Cuartero",  7,  4, { cromos: 2, titulo: 1 }],
  ["Rasgo",   "Rasgo Molina",   "Norberto Genially",  4,  9, { cromos: 1 }],
  ["Cifra",   "Cifra Ondiz",    "Norberto Cuartero",  3, 12, {}],
  ["Lumen",   "Lumen Bravo",    "Norberto Genially",  2, 16, {}],
  ["Ceniza",  "Ceniza Roldan",  "Norberto Cuartero",  1, 40, {}],
  ["Hito",    "Hito Vera",      "Norberto Genially",  1, 52, {}]
];

function pruebaSembrar() {
  var per = pruebaUltimoPER_(), o = perObj_(perFila_(per).v);
  var retos = retosDe_(o.tipo);
  var shB = SpreadsheetApp.getActive().getSheetByName(o.tabB);
  var cab = shB.getRange(1, 1, 1, shB.getLastColumn()).getValues()[0].map(String);
  var col = function(f) { for (var i = 0; i < cab.length; i++) if (cab[i].toLowerCase().indexOf(f.toLowerCase()) >= 0) return i; return -1; };
  var cMail = col("correo") >= 0 ? col("correo") : col("Email");
  var cAlias = col("Alias"), cNom = col("Nombre y apellidos"), cAv = col("Elige tu avatar"),
      cProf = col("imparte"), cBit = col("ePortfolio"), cBio = col("biograf");

  var ev = hoja_(H.EV), aj = hoja_(H.AJ), filasEv = [], filasAj = [], filasB = [];
  var hoy = new Date();
  RECLUTAS_PRUEBA.forEach(function(r, k) {
    var alias = r[0], nombre = r[1], profe = r[2], n = r[3], dias = r[4], ex = r[5];
    var email = alias.toLowerCase().replace(/[^a-z]/g, "") + "@reclutas.test";

    var fila = []; for (var z = 0; z < cab.length; z++) fila.push("");
    fila[0] = new Date(hoy.getTime() - dias * 86400000);
    if (cMail >= 0) fila[cMail] = email;
    if (cAlias >= 0) fila[cAlias] = alias;
    if (cNom >= 0) fila[cNom] = nombre;
    if (cAv >= 0) fila[cAv] = "Personaje " + (1 + (k % 7)) + " · " + (k % 2 ? "él" : "ella") + " (evoluciona)";
    if (cProf >= 0) fila[cProf] = profe;
    if (cBit >= 0 && n >= 4) fila[cBit] = "https://example.com/eportfolio/" + alias.toLowerCase();
    if (cBio >= 0) fila[cBio] = "Recluta de prueba. Vino a ver si esto funcionaba.";
    filasB.push(fila);

    filasEv.push([new Date(hoy.getTime() - dias * 86400000), o.id, email, alias, "H1",
                  "Reclutamiento", 0, XP_RECLUTAMIENTO, "formulario", ""]);
    for (var i = 0; i < n && i < retos.length; i++) {
      var x = retos[i];
      var cuando = new Date(hoy.getTime() - (dias + (n - 1 - i) * 3) * 86400000);
      filasEv.push([cuando, o.id, email, alias, x[0], x[1], x[4], x[3], "formulario",
                    i % 3 === 0 ? "https://example.com/evidencia/" + alias.toLowerCase() + "-" + x[0] : ""]);
    }
    for (var c = 0; c < (ex.cromos || 0); c++)
      filasAj.push([new Date(), o.id, email, "EXTRA", "cromo", CROMOS[(k * 3 + c) % CROMOS.length][0], "siembra"]);
    for (var h = 0; h < (ex.heroes || 0); h++)
      filasAj.push([new Date(), o.id, email, "EXTRA", "heroe", HEROES[(k * 2 + h) % HEROES.length][0], "siembra"]);
    if (ex.titulo) filasAj.push([new Date(), o.id, email, "EXTRA", "titulo", "Archivista estelar", "siembra"]);
    if (ex.marco)  filasAj.push([new Date(), o.id, email, "EXTRA", "marco", "1", "siembra"]);
    if (ex.fondo)  filasAj.push([new Date(), o.id, email, "EXTRA", "fondo", TEMAS[1][2], "siembra"]);
  });

  if (filasB.length)  shB.getRange(shB.getLastRow() + 1, 1, filasB.length, cab.length).setValues(filasB);
  if (filasEv.length) ev.getRange(ev.getLastRow() + 1, 1, filasEv.length, 10).setValues(filasEv);
  if (filasAj.length) aj.getRange(aj.getLastRow() + 1, 1, filasAj.length, 7).setValues(filasAj);

  var t = tablero_(o.id, true);
  var resumen = (t.reclutas || []).map(function(x){
    return x.alias + " [" + x.profe + "]: nivel " + x.nivel + " · " + x.xp + " xp · " +
           x.creditos + " ◈ · " + x.n + " insignias · col " + (x.coleccion ? x.coleccion.pct : "?") + "%"; });
  Logger.log("SEMBRADO en " + o.id + "\n" + resumen.join("\n"));
  return { per: o.id, reclutas: resumen };
}

function pruebaUltimoPER_() {
  var v = hoja_(H.PERS).getDataRange().getValues().slice(1).filter(function(x){ return x[0]; });
  return v[v.length - 1][0];
}

// Los enlaces que hacen falta para probar, en el registro.
function pruebaEnlaces() {
  var per = pruebaUltimoPER_(), o = perObj_(perFila_(per).v);
  var out = { per: o.id, nombre: o.nombre,
    nave: WEB + "recluta.html?per=" + o.id,
    tablero: WEB + "registro.html?per=" + o.id,
    sala_docente: WEB + "clase.html?per=" + o.id,
    panel_profes: WEB + "profes.html?per=" + o.id,
    panel_genially_del_per: o.panelVer || "(hereda el estandar: " + (panelStd_().ver || "NO HAY") + ")",
    bitacora: o.formBitacora, ticket: o.formTicket, canje: o.formCanje };
  Logger.log(JSON.stringify(out, null, 1));
  return out;
}

// ¿Hay panel estándar guardado? Es lo que heredará el PER nuevo si no se le da uno propio.
function pruebaPanelEstandar() {
  var s = panelStd_();
  Logger.log("PANEL ESTANDAR -> ver: " + (s.ver || "(NO HAY)") + " | editar: " + (s.editar || "(NO HAY)"));
  return s;
}
