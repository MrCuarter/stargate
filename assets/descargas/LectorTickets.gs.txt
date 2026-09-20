/**
 * STARGATE · EL LECTOR DE TICKETS
 * ------------------------------------------------------------------------------------------------
 * Un Apps Script diminuto que vive DENTRO de la hoja «STARGATE · Tickets de salida» y no hace más
 * que una cosa: devolver sus respuestas en JSON para que el panel de tickets de la web las pinte.
 *
 * 🔴 POR QUÉ ESTO EXISTE, Y POR QUÉ NO ESTÁ EN NINGUNA OTRA PARTE.
 *
 * Todo STARGATE se ha mudado de Apps Script a Firestore. Todo menos el ticket de salida, y a
 * propósito: tiene que ser ANÓNIMO, y el motor guarda quién completa cada cosa suya. Un formulario
 * de Google es la única pieza del sistema que puede recoger una respuesta sin saber de quién es.
 *
 * Pero entonces las respuestas viven en una hoja de cálculo, y una hoja no se puede leer desde una
 * página web sin abrirla al mundo. Las tres salidas eran:
 *   · PUBLICARLA en la web como CSV — sencillo, pero deja las dudas del alumnado a un enlace de
 *     distancia de cualquiera que lo encuentre. Es una decisión de quien manda, no de quien programa.
 *   · Leerla desde el SERVIDOR de GamificaPro con una cuenta de servicio — limpio, pero obliga a
 *     compartir la hoja con un correo raro y a mantener otra credencial.
 *   · ESTO: que la hoja lleve su propio lector. Corre con la cuenta que la creó, no comparte nada
 *     con nadie, y se despliega una vez en la vida.
 *
 * No reintroduce la dependencia que se quitó: esto lo leen cuatro docentes de vez en cuando, no
 * doscientos estudiantes a la vez. El techo de 30 ejecuciones de Apps Script no se acerca ni de
 * lejos, que era el problema que obligó a mudarse.
 *
 * ------------------------------------------------------------------------------------------------
 * CÓMO SE PONE EN MARCHA (una vez, tres minutos)
 *
 *  1. Con la cuenta de la asignatura, entra en script.google.com → Nuevo proyecto.
 *  2. Pega este archivo entero encima de lo que haya y ponle nombre.
 *  3. Implementar → Nueva implementación → Aplicación web.
 *       Ejecutar como: Yo          (para que pueda leer la hoja)
 *       Acceso:        Cualquier usuario
 *  4. Copia la URL que acaba en /exec y ponla en `_site_data.py → TICKETS_API`.
 *
 * 🔴 20-sep · SI YA ESTABA DESPLEGADO, HAY QUE VOLVER A HACERLO: este fichero ahora pide identificarse (ver «la
 * puerta, con llave», más abajo). Se pega otra vez encima, y en Implementar → Gestionar implementaciones → ✏️ →
 * Versión: Nueva → Implementar. La dirección /exec no cambia, así que no hay que tocar nada más. Hasta que se
 * haga, el panel y la sesión seguirán leyendo como siempre; el agujero solo se cierra al redesplegar.
 *
 * 🔴 Es un proyecto INDEPENDIENTE, no uno pegado a la hoja, y abre la hoja por su identificador.
 * Dos razones. Una: un script pegado a la hoja se abre desde el menú de la hoja, y con varias
 * cuentas de Google en el mismo navegador ese menú te manda a la cuenta equivocada. Dos: si algún
 * día las respuestas cambian de hoja, aquí se cambia una línea y ya.
 *
 * 🔴 Lo que este lector NO devuelve, y no es un olvido: nada que identifique a nadie. Si algún día
 * el formulario recogiera correos, este script seguiría sin darlos.
 */

// La hoja «STARGATE · Tickets de salida». Si algún día las respuestas se mudan, se cambia AQUÍ y
// en ningún otro sitio.
var HOJA_TICKETS = "1x_5lztVydAttUvAdvuVM0AiC8zseUrXbMmBu4e9uOdM";

// La pestaña donde el formulario deja las respuestas. Se busca por ser la que está vinculada a un
// formulario, no por su nombre: Google la nombra en el idioma de quien la creó.
function hojaDeRespuestas_() {
  var ss = SpreadsheetApp.openById(HOJA_TICKETS);
  var hs = ss.getSheets();
  for (var i = 0; i < hs.length; i++) if (hs[i].getFormUrl && hs[i].getFormUrl()) return hs[i];
  return hs[0];
}

// La columna «Resuelto» la añade este mismo script la primera vez que alguien marca una duda como
// tratada. No la crea el formulario, así que puede no existir todavía.
var COL_RESUELTO = "Resuelto";

function columna_(sh, titulo) {
  var n = sh.getLastColumn();
  var cab = sh.getRange(1, 1, 1, n).getValues()[0].map(String);
  var i = cab.indexOf(titulo);
  if (i >= 0) return i + 1;
  sh.getRange(1, n + 1).setValue(titulo);
  return n + 1;
}

/**
 * Las respuestas de UN grupo, en la forma que el panel ya sabe pintar.
 *
 * 🔴 El filtro por grupo se hace AQUÍ y no en el navegador. Si se mandaran todas y filtrara la
 * página, cualquier docente vería las dudas de los grupos de sus compañeros con solo mirar lo que
 * llegó por la red. Anónimo no quiere decir de dominio público.
 */
function ticketsDe_(grupo) {
  var sh = hojaDeRespuestas_();
  if (!sh || sh.getLastRow() < 2) return [];
  var v = sh.getDataRange().getValues();
  var cab = v[0].map(String);
  var cGrupo = cab.indexOf("Grupo");
  var cRes = cab.indexOf(COL_RESUELTO);
  var g = String(grupo || "").trim().toLowerCase();
  var out = [];
  for (var i = 1; i < v.length; i++) {
    if (g && cGrupo >= 0 && String(v[i][cGrupo] || "").trim().toLowerCase() !== g) continue;
    var r = {};
    cab.forEach(function (c, k) {
      if (k === 0 || c === COL_RESUELTO || c === "Grupo") return;   // la marca de tiempo va aparte
      if (v[i][k] !== "" && v[i][k] !== null) r[c] = v[i][k];
    });
    out.push({ fecha: v[i][0], fila: i + 1,
               resuelto: cRes >= 0 ? String(v[i][cRes] || "") : "", r: r });
  }
  return out;
}

/** Los grupos que han contestado alguna vez: para el desplegable, sin tener que saberlos de memoria. */
function gruposConTickets_() {
  var sh = hojaDeRespuestas_();
  if (!sh || sh.getLastRow() < 2) return [];
  var v = sh.getDataRange().getValues();
  var c = v[0].map(String).indexOf("Grupo");
  if (c < 0) return [];
  var vistos = {}, out = [];
  for (var i = 1; i < v.length; i++) {
    var g = String(v[i][c] || "").trim();
    if (g && !vistos[g]) { vistos[g] = true; out.push({ id: g, nombre: g }); }
  }
  return out;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 🔴 20-sep · LA PUERTA, CON LLAVE. Una aplicación web de Apps Script con «acceso: cualquier usuario» es
 * pública de verdad: su dirección está en el código de la página, así que hasta hoy cualquiera que la
 * copiara podía leer las dudas de todas las clases —anónimas, sí, pero de nadie más— y hasta escribir en
 * la columna «Resuelto» de la hoja. Eso no es aceptable para lo que el alumnado escribe en confianza.
 *
 * Ahora hay que venir identificado: la página manda el `token` de la sesión de STARGATE (el de Firebase) y
 * aquí se comprueba con el propio Firebase antes de contestar nada. No hace falta guardar ninguna clave: se
 * valida contra el proyecto, que es quien emitió el token. Quien no haya iniciado sesión en STARGATE, no lee.
 *
 * (No se puede afinar más desde aquí —quién es docente de qué grupo vive en Firestore, no en esta hoja—,
 * pero el salto de «el mundo entero» a «quien está dentro de STARGATE» es el que importaba.)
 */
var FIREBASE_API_KEY = "AIzaSyAsbivRCpCD2d0UvuB2JQpdJVHLgpEvD4k";   // la clave pública del sitio (va en la web)

/** ¿Quién manda esto? El usuario de Firebase, o null si el token no vale. */
function usuarioDelToken_(token) {
  token = String(token || "");
  if (token.length < 40) return null;
  try {
    var r = UrlFetchApp.fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + FIREBASE_API_KEY, {
      method: "post", contentType: "application/json", muteHttpExceptions: true,
      payload: JSON.stringify({ idToken: token })
    });
    if (r.getResponseCode() !== 200) return null;
    var u = (JSON.parse(r.getContentText()).users || [])[0];
    return u && u.localId ? u : null;
  } catch (err) { return null; }
}

/**
 * 🔴 EJECUTA ESTO UNA VEZ DESPUÉS DE PEGAR EL FICHERO (▶ Ejecutar, con «autorizar» elegida arriba).
 *
 * Desde el 20-sep este lector pregunta a Firebase quién le escribe, y eso es una llamada a INTERNET: un permiso que
 * el proyecto no tenía. Google lo pide la primera vez que se ejecuta, no al implementar. Si no se autoriza aquí, la
 * aplicación web contestaría «no he podido comprobar quién eres» a todo el mundo.
 *
 * Sale «Se ha completado la ejecución» y, en el registro, «autorización: bien». Con eso, a implementar.
 */
function autorizar() {
  var r = UrlFetchApp.fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + FIREBASE_API_KEY, {
    method: "post", contentType: "application/json", muteHttpExceptions: true, payload: JSON.stringify({ idToken: "x" })
  });
  // 400 es lo que toca (el token es falso): lo que importa es que la llamada haya podido salir
  Logger.log("autorización: " + (r.getResponseCode() === 400 ? "bien" : "responde " + r.getResponseCode()));
}

/**
 * La puerta. Dos peticiones y se acabó.
 *
 * Se responde a GET y a POST porque el panel manda POST y un navegador curioso (o una prueba desde
 * la barra de direcciones) manda GET: que las dos funcionen ahorra un rato de desconcierto.
 */
function doGet(e) { return atender_((e && e.parameter) || {}); }
function doPost(e) {
  var q = {};
  try { q = JSON.parse((e.postData && e.postData.contents) || "{}"); } catch (err) { q = (e && e.parameter) || {}; }
  return atender_(q);
}

function atender_(q) {
  try {
    var a = String(q.accion || "tickets");
    var quien = usuarioDelToken_(q.token);
    if (!quien) return json_({ error: "Inicia sesión en STARGATE para ver los tickets." });
    if (a === "pers") return json_({ pers: gruposConTickets_() });
    if (a === "tickets") return json_({ tickets: ticketsDe_(q.per) });
    if (a === "ticket_resuelto") {
      var sh = hojaDeRespuestas_();
      var col = columna_(sh, COL_RESUELTO);
      sh.getRange(Number(q.fila), col).setValue(
        q.valor ? "Sí · " + (q.profe || "") + " · " +
                  Utilities.formatDate(new Date(), "Europe/Madrid", "dd/MM") : "");
      return json_({ ok: true });
    }
    return json_({ error: "No sé hacer eso: " + a });
  } catch (err) {
    return json_({ error: err.message });
  }
}
