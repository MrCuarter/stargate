/**
 * STARGATE - BONUS - las mecanicas que reparten creditos fuera del camino de retos,
 * y la instrumentacion para investigar.
 *
 * Se separo de Code.gs el 27-ago-2026 por la MISMA razon que Datos.gs: Apps Script deja de guardar
 * un fichero por encima de ~220 KB, y lo hace EN SILENCIO -- el editor dice «Cambios sin guardar»
 * y no explica por que. Si vuelve a pasar, lo que toca es sacar otro bloque, no pelearse con el
 * boton de guardar.
 *
 * Aqui viven:
 *   - los seudonimos, el consentimiento y el sello del catalogo (para que los datos sirvan y se
 *     puedan compartir sin llevarse a nadie por delante)
 *   - el parte de la tripulacion (bonus de grupo por responder el ticket)
 *   - el pase de lista en directo (ventana + consigna de cuatro letras)
 *
 * No hay dependencias de orden de carga: todo se usa dentro de funciones, que corren cuando los
 * tres ficheros ya estan leidos.
 */

// ================= EL PASE DE LISTA EN DIRECTO =================
// El docente abre una ventana de unos minutos desde su sala y su pantalla muestra una CONSIGNA de
// cuatro letras. Quien esté en la clase la teclea en su Nave y se lleva unos créditos, una vez por
// sesión.
// 🔴 Honestidad sobre lo que mide: en un máster online esto es «estaba mirando cuando se abrió», no
// «asistió». La consigna se pasa por chat en dos segundos. Sube mucho el listón respecto a no tener
// nada, pero NO es una prueba de asistencia y no conviene venderla como tal.
// 🔬 Y de paso deja la mejor traza de implicación docente que hay: cuándo y cuántas veces abre cada
// docente la ventana, y en qué momento del curso deja de hacerlo.

var PROP_PASE = "BONUS_PASE";
// Sin I, O ni L: se leen en voz alta y se confunden con 1 y 0.
var LETRAS_CONSIGNA = "ABCDEFGHJKMNPQRSTUVWXYZ";

function cfgPase_() {
  var d = { creditos: BONUS_PASE.creditos, minutos: BONUS_PASE.minutos };
  try {
    var v = String(PropertiesService.getScriptProperties().getProperty(PROP_PASE) || "");
    if (v) {
      var p = v.split("|"), c = parseInt(p[0], 10), m = parseInt(p[1], 10);
      if (c >= 0 && !isNaN(c)) d.creditos = c;
      if (m > 0 && !isNaN(m)) d.minutos = m;
    }
  } catch (e) {}
  return d;
}

function consigna_() {
  var s = "";
  for (var i = 0; i < 4; i++) s += LETRAS_CONSIGNA.charAt(Math.floor(Math.random() * LETRAS_CONSIGNA.length));
  return s;
}

// La ventana vive en AJUSTES: así queda la traza de quién la abrió y cuándo, que es justo el dato
// que interesa — y no hace falta un sitio nuevo donde guardar estado.
// Fila: [fecha, per, "", "PASE", "pase", "<consigna>|<hasta ISO>|<id>", "<docente>"]
function abrirPase_(o, profe, minutos) {
  var cfg = cfgPase_(), mins = minutos > 0 ? minutos : cfg.minutos;
  var ahora = new Date(), hasta = new Date(ahora.getTime() + mins * 60000);
  var palabra = consigna_();
  // 🔴 El id lleva la HORA CON SEGUNDOS y la propia consigna. Con precisión de minuto, dos ventanas
  // abiertas seguidas compartían identificador y quien hubiera cobrado la primera se quedaba fuera
  // de la segunda. La consigna, que es aleatoria, remata lo que los segundos no distinguen.
  var id = Utilities.formatDate(ahora, "Europe/Madrid", "yyyyMMdd-HHmmss") + "-" + palabra;
  hoja_(H.AJ).appendRow([ahora, o.id, "", "PASE", "pase",
    palabra + "|" + hasta.toISOString() + "|" + id, String(profe || "")]);
  return { palabra: palabra, hasta: hasta, id: id, minutos: mins, creditos: cfg.creditos };
}

// La ventana ABIERTA de un PER, si la hay. Se mira la última, no todas: abrir otra cierra la anterior.
function paseActivo_(perId) {
  var ultima = null;
  hoja_(H.AJ).getDataRange().getValues().slice(1).forEach(function(v){
    if (v[1] === perId && v[4] === "pase") ultima = v; });
  if (!ultima) return null;
  var p = String(ultima[5] || "").split("|");
  if (p.length < 3) return null;
  var hasta = new Date(p[1]);
  if (!(hasta > new Date())) return null;
  return { palabra: p[0], hasta: hasta, id: p[2], profe: String(ultima[6] || "") };
}

// El recluta teclea la consigna. Sin PIN, como vestirse: el alumnado no tiene clave, y lo único que
// se puede hacer aquí es cobrar UNA vez una ventana que un docente ha abierto hace minutos.
function reclamarPase_(perId, email, palabra) {
  var act = paseActivo_(perId);
  if (!act) return { ok: false, error: "Ahora mismo no hay ningún pase de lista abierto." };
  if (String(palabra || "").toUpperCase().replace(/\s/g, "") !== act.palabra)
    return { ok: false, error: "Esa no es la consigna. Míralas bien: son las cuatro letras que hay en la pantalla." };
  var clave = "pase:" + act.id;
  var ya = false;
  hoja_(H.AJ).getDataRange().getValues().slice(1).forEach(function(v){
    if (v[1] === perId && String(v[2]).toLowerCase() === email && v[4] === "bonus" && String(v[5]) === clave) ya = true; });
  if (ya) return { ok: true, yaEstaba: true, creditos: 0 };
  hoja_(H.AJ).appendRow([new Date(), perId, email, "EXTRA", "bonus", clave, "sistema"]);
  return { ok: true, creditos: cfgPase_().creditos };
}

function ajustarPase() {
  var ui = SpreadsheetApp.getUi(), cfg = cfgPase_();
  var r = ui.prompt("Pase de lista en directo",
    "El docente abre una ventana desde su sala y enseña una consigna de 4 letras; quien está en la " +
    "clase la teclea en su Nave.\n\nAhora mismo: " + cfg.creditos + " créditos, ventana de " + cfg.minutos + " minutos.\n\n" +
    "Escribe el nuevo valor así:  créditos, minutos\nPor ejemplo «5, 50».", ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var p = String(r.getResponseText() || "").split(","), c = parseInt(p[0], 10), m = parseInt(p[1], 10);
  if (isNaN(c) || c < 0 || isNaN(m) || m <= 0)
    return ui.alert("No he entendido «" + r.getResponseText() + "». Se escribe: créditos, minutos. Por ejemplo: 5, 50");
  PropertiesService.getScriptProperties().setProperty(PROP_PASE, c + "|" + m);
  ui.alert("Hecho: " + c + " créditos, ventana de " + m + " minutos.");
}

// ================= EL PARTE DE LA TRIPULACIÓN (bonus de grupo por el ticket) =================
// Si en un tema responde al ticket al menos una fracción del grupo, TODA la tripulación cobra. No se
// puede premiar a quien respondió porque el ticket es anónimo, y romper ese anonimato para poder
// pagar costaría mucho más de lo que vale el premio. Así que se cuentan cabezas.
// Se reparte de MADRUGADA, no al vuelo: el ticket no sabe quién lo envió, así que no hay «envío» al
// que colgar la comprobación. Y de paso el premio aparece al día siguiente con su cartel en la Nave.

var PROP_TRIPU = "BONUS_TRIPULACION";

// Los valores vigentes: los de Datos.gs, salvo que el profesorado los haya cambiado desde el menú.
// Para comparar nombres escritos por personas: sin acentos, sin mayúsculas y sin espacios de más.
function normalizar_(txt) {
  return String(txt || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/\s+/g, " ").trim();
}

function bonusTripulacion_() {
  var d = { fraccion: BONUS_TRIPULACION.fraccion, creditos: BONUS_TRIPULACION.creditos };
  try {
    var v = String(PropertiesService.getScriptProperties().getProperty(PROP_TRIPU) || "");
    if (v) {
      var p = v.split("|"), f = parseFloat(p[0]), c = parseInt(p[1], 10);
      if (f > 0 && f <= 1) d.fraccion = f;
      if (c >= 0 && !isNaN(c)) d.creditos = c;
    }
  } catch (e) {}
  return d;
}

// Una clave corta y ESTABLE por sección del ticket. El texto largo («Tema 3: Sendara (…)») cambia en
// cuanto se retoca el nombre de un tema, y entonces el mismo tema contaría como dos.
function claveSeccion_(txt) {
  txt = String(txt || "").trim();
  var m = txt.match(/^Tema\s+(\d)/i);          if (m) return "t" + m[1];
  m = txt.match(/^Actividad\s+(\d)/i);         if (m) return "a" + m[1];
  if (/^Presentaci/i.test(txt)) return "pres";
  if (/^Repaso/i.test(txt)) return "fin";
  return "";
}

// Cuántos partes ha recibido cada sección de un PER. Devuelve { t1: 7, t2: 3, ... }.
function partesPorSeccion_(o) {
  var sh = SpreadsheetApp.getActive().getSheetByName(o.tabT);
  if (!sh || sh.getLastRow() < 2) return {};
  var v = sh.getDataRange().getValues(), cab = v[0].map(String), col = -1;
  for (var i = 0; i < cab.length; i++) if (cab[i].indexOf("Selecciona el tema") === 0) { col = i; break; }
  if (col < 0) return {};
  var out = {};
  v.slice(1).forEach(function(f){ var k = claveSeccion_(f[col]); if (k) out[k] = (out[k] || 0) + 1; });
  return out;
}

// 🔴 EL DIVISOR SON LOS VIVOS, no todos los que pasaron por aquí alguna vez. Si contáramos a todos,
// el umbral se volvería imposible según avanza el curso: de 100 matriculados se alistan 70, de esos
// 20 solo aparecen el primer día — y esos 20 seguirían en el denominador en la semana 14, justo
// cuando la participación es más baja. Vivo = ha registrado algo por su cuenta últimamente.
// Cobran TODOS igual: es un premio de tripulación, y a quien vuelva le esperan sus créditos.
function reclutasActivos_(reclutas, semanas) {
  var dias = 7 * (semanas || BONUS_TRIPULACION.semanas_activo || 4);
  var corte = new Date(); corte.setDate(corte.getDate() - dias);
  var vivos = reclutas.filter(function(r){ return r.ultima && new Date(r.ultima) >= corte; }).length;
  return vivos || reclutas.length;   // si no hay nadie vivo, el umbral NO se abarata
}

// Reparte lo pendiente. Idempotente: cada recluta cobra una vez por sección, mirando lo que ya
// tiene en AJUSTES. Devuelve cuántas filas ha escrito.
function otorgarBonusTripulacion_(o) {
  var cfg = bonusTripulacion_();
  if (!cfg.creditos) return 0;
  var t = tablero_(o.id, true), reclutas = (t.reclutas || []);
  if (!reclutas.length) return 0;
  var partes = partesPorSeccion_(o), umbral = Math.max(1, Math.ceil(cfg.fraccion * reclutasActivos_(reclutas)));
  var yaTiene = {};
  hoja_(H.AJ).getDataRange().getValues().slice(1).forEach(function(v){
    if (v[1] === o.id && v[4] === "bonus" && String(v[5] || "").indexOf("tripulacion:") === 0)
      yaTiene[String(v[2]).toLowerCase() + "|" + String(v[5])] = true; });
  var filas = [];
  Object.keys(partes).forEach(function(k){
    if (partes[k] < umbral) return;
    var clave = "tripulacion:" + k;
    reclutas.forEach(function(r){
      if (yaTiene[String(r.email).toLowerCase() + "|" + clave]) return;
      filas.push([new Date(), o.id, r.email, "EXTRA", "bonus", clave, "sistema"]);
    });
  });
  if (filas.length) hoja_(H.AJ).getRange(hoja_(H.AJ).getLastRow() + 1, 1, filas.length, 7).setValues(filas);
  return filas.length;
}

function repartirBonusTripulacion_() {
  var n = 0;
  hoja_(H.PERS).getDataRange().getValues().slice(1).forEach(function(v){
    if (!v[0] || v[21]) return;   // los archivados no reparten nada
    try { n += otorgarBonusTripulacion_(perObj_(v)); } catch (e) { Logger.log("tripulacion/" + v[0] + ": " + e); }
  });
  return n;
}

function ajustarBonusTripulacion() {
  var ui = SpreadsheetApp.getUi(), cfg = bonusTripulacion_();
  var r = ui.prompt("Bonus de la tripulación",
    "Si en un tema responde al ticket una parte del grupo, TODA la tripulación cobra.\n\n" +
    "Ahora mismo: " + Math.round(cfg.fraccion * 100) + " % del grupo → " + cfg.creditos + " créditos para cada recluta.\n\n" +
    "Escribe el nuevo valor así:  porcentaje, créditos\n" +
    "Por ejemplo «25, 15» (uno de cada cuatro, 15 créditos).", ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var p = String(r.getResponseText() || "").split(","), f = parseFloat(p[0]), c = parseInt(p[1], 10);
  if (!(f > 0 && f <= 100) || isNaN(c) || c < 0)
    return ui.alert("No he entendido «" + r.getResponseText() + "». Se escribe: porcentaje, créditos. Por ejemplo: 25, 15");
  PropertiesService.getScriptProperties().setProperty(PROP_TRIPU, (f / 100) + "|" + c);
  ui.alert("Hecho: " + Math.round(f) + " % del grupo → " + c + " créditos.\n\n" +
           "Se aplica esta madrugada. Lo ya repartido no se toca: nadie pierde lo que cobró.");
}

// ================= INVESTIGACIÓN: seudónimos, consentimiento y sello del catálogo =================
// Nada de esto cambia el juego ni lo que ve el alumnado. Existe para que los datos SIRVAN y para que
// puedan compartirse sin llevarse a nadie por delante. Contexto: Project_CCD/INVESTIGACION_TESIS.md.

var PROP_SAL = "SAL_SEUDONIMO", PROP_CAT = "VERSION_CATALOGO";
var _SAL = null, _SEU = {};   // en memoria: una ejecución puede seudonimizar miles de filas

// Un seudónimo ESTABLE por correo. La sal se guarda en las propiedades del script y no sale de aquí:
// sin ella el seudónimo se rompería probando direcciones, porque un correo tiene poquísima entropía
// (un SHA-256 pelado de «nombre.apellido@…» no protege a nadie).
function seudonimo_(email) {
  email = String(email || "").toLowerCase().trim();
  if (!email) return "";
  if (_SEU[email]) return _SEU[email];
  if (!_SAL) {
    var pr = PropertiesService.getScriptProperties();
    _SAL = pr.getProperty(PROP_SAL);
    if (!_SAL) { _SAL = Utilities.getUuid(); pr.setProperty(PROP_SAL, _SAL); }
  }
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, _SAL + "·" + email, Utilities.Charset.UTF_8);
  var h = "";
  for (var i = 0; i < 6; i++) { var x = (b[i] + 256) % 256; h += (x < 16 ? "0" : "") + x.toString(16); }
  return (_SEU[email] = "R-" + h);
}

// Los correos que han autorizado el uso de sus datos. Devuelve null —que aquí significa «no filtres»—
// si la pestaña no existe o no tiene un solo SÍ: así el sistema se comporta como siempre mientras el
// consentimiento todavía no exista, en vez de vaciar las exportaciones y parecer un fallo.
function consienten_() {
  var sh = SpreadsheetApp.getActive().getSheetByName(H.CONS);
  if (!sh || sh.getLastRow() < 2) return null;
  var ok = {}, hay = false;
  sh.getDataRange().getValues().slice(1).forEach(function(v){
    var em = String(v[0] || "").toLowerCase().trim();
    if (em && /^s[ií]$/i.test(String(v[1] || "").trim())) { ok[em] = true; hay = true; }
  });
  return hay ? ok : null;
}

// La huella del catálogo VIGENTE: cambia si cambia un precio, un tope o una semana de desbloqueo.
function versionCatalogo_(cat) {
  var s = (cat || recompensasCat_()).map(function(x){
    return x.nombre + "|" + x.coste + "|" + x.max + "|" + x.desde + "|" + x.tipo; }).join("¶");
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, s, Utilities.Charset.UTF_8);
  var h = "";
  for (var i = 0; i < 4; i++) { var x = (b[i] + 256) % 256; h += (x < 16 ? "0" : "") + x.toString(16); }
  return h;
}

// 🔬 Deja constancia en AJUSTES CADA VEZ QUE EL CATÁLOGO CAMBIA — no en cada canje, que llenaría la
// hoja de ruido. Con el sello y su hora, cualquier canje es atribuible a la lista de precios que
// estaba en vigor, que es lo que hace comparables las decisiones de compra. Sin esto, «Restaurar
// catálogo» reescribe precios en silencio y lo de antes y lo de después deja de poder mirarse junto.
// Va envuelto en try porque esto JAMÁS puede tumbar un canje: si falla, se pierde el sello, no la compra.
function sellarCatalogo_(cat) {
  try {
    cat = cat || recompensasCat_();
    var v = versionCatalogo_(cat), pr = PropertiesService.getScriptProperties();
    if (pr.getProperty(PROP_CAT) === v) return v;
    pr.setProperty(PROP_CAT, v);
    // per y email vacíos: el catálogo es de toda la hoja, no de un grupo ni de una persona.
    hoja_(H.AJ).appendRow([new Date(), "", "", "CATALOGO", "version", v,
      cat.map(function(x){ return x.nombre + "=" + x.coste + "@" + x.desde; }).join(" · ")]);
    return v;
  } catch (e) { Logger.log("sellarCatalogo_: " + e); return ""; }
}


// ================= PARTE DE SALUD =================
// v3.30 · Vive aquí y no en Code.gs, que ya roza el tamaño en el que Apps Script deja de guardar.
// El parte tarda casi un minuto: abre los formularios de cada grupo uno a uno, repasa disparadores,
// cuota de correo y datos del ticket. Hasta ahora la hoja se quedaba muda todo ese rato y parecía
// que el menú no había hecho nada. Ahora la ventana se abre AL INSTANTE contando lo que está
// mirando, y el informe la sustituye cuando llega.
function parteDeSalud() {
  var espera = '<!doctype html><html><head><meta charset="utf-8"><base target="_top"><style>' +
    'body{font:14px/1.55 system-ui,-apple-system,Segoe UI,sans-serif;color:#182430;margin:0;padding:24px 22px}' +
    'h3{font-size:16px;margin:0 0 6px}.mut{color:#6d7b85;font-size:13px}' +
    '.barra{height:8px;border-radius:99px;background:#e7edf1;overflow:hidden;margin:20px 0 14px}' +
    '.barra i{display:block;height:100%;width:38%;border-radius:99px;background:#0e7f8c;animation:v 1.6s ease-in-out infinite}' +
    '@keyframes v{0%{margin-left:-38%}100%{margin-left:100%}}' +
    '.paso{font-weight:700;color:#0b5b66;min-height:22px}' +
    '</style></head><body><div id="todo">' +
    '<h3>Revisando el sistema…</h3>' +
    '<div class="mut">Tarda hasta un minuto: hay que abrir los formularios de cada grupo, uno a uno. ' +
    'No cambia nada, solo mira y cuenta.</div>' +
    '<div class="barra"><i></i></div>' +
    '<div class="paso" id="p">Abriendo el maletín de herramientas…</div>' +
    '<div class="mut" id="s">0 s</div></div><script>' +
    'var P=["Abriendo el maletín de herramientas…","Contando los grupos activos…",' +
    '"Mirando los formularios de cada grupo…","Repasando los disparadores…",' +
    '"Comprobando la cuota de correo…","Buscando dos cuentas de la misma persona…",' +
    '"Cuadrando los partes del ticket de salida…","Ya casi: ordenando el informe…"];' +
    'var i=0,t0=new Date().getTime();' +
    'setInterval(function(){var e=document.getElementById("s");' +
    'if(e)e.textContent=Math.round((new Date().getTime()-t0)/1000)+" s";},1000);' +
    'setInterval(function(){i++;var e=document.getElementById("p");' +
    'if(e)e.textContent=P[Math.min(i,P.length-1)];},7000);' +
    'google.script.run.withSuccessHandler(function(h){document.getElementById("todo").innerHTML=h;})' +
    '.withFailureHandler(function(e){document.getElementById("todo").innerHTML=' +
    '"<h3>El parte no ha podido terminar</h3><p>"+e.message+"</p>";}).saludHtml();' +
    '<' + '/script></body></html>';
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(espera).setWidth(560).setHeight(560), "STARGATE · Parte de salud");
}
// El informe en sí. Público (sin guion bajo) porque lo pide la ventana con google.script.run.
function saludHtml() {
  var s = salud_();
  var icono = { ok: "🟢", aviso: "🟡", mal: "🔴" };
  var h = '<div style="font:14px/1.55 system-ui,-apple-system,Segoe UI,sans-serif;padding:4px 2px">';
  h += '<p style="margin:0 0 12px"><b style="font-size:16px">' +
       (s.malos ? "🔴 Hay " + s.malos + " cosa" + (s.malos > 1 ? "s" : "") + " que arreglar"
                : s.avisos ? "🟡 Todo funciona, con " + s.avisos + " aviso" + (s.avisos > 1 ? "s" : "")
                           : "🟢 El sistema está sano") +
       '</b><br><span style="color:#667">' + s.pers + ' PER activos · ' +
       Utilities.formatDate(s.fecha, "Europe/Madrid", "d/MM/yyyy HH:mm") + '</span></p>';
  var orden = { mal: 0, aviso: 1, ok: 2 };
  s.puntos.slice().sort(function(a, b){ return orden[a.nivel] - orden[b.nivel]; }).forEach(function(p){
    h += '<div style="padding:7px 0;border-top:1px solid #e6e8ee">' +
         icono[p.nivel] + ' <b>' + p.titulo + '</b> — ' + escapar_(p.detalle) +
         (p.arreglo ? '<br><span style="color:#4a5568;font-size:13px">↳ ' + escapar_(p.arreglo) + '</span>' : '') +
         '</div>';
  });
  h += '<p style="margin:14px 0 0;color:#667;font-size:12px">Este parte no cambia nada: solo mira y cuenta.' +
       (s.incompleto ? ' <b style="color:#b8860b">No le dio tiempo a mirarlo todo: vuelve a abrirlo.</b>' : '') +
       '</p></div>';
  return h;
}
