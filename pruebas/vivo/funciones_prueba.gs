
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
