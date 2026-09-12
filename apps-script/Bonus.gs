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
  registros_(H.AJ, perId).forEach(function(v){
    if (v[4] === "pase") ultima = v; });
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
  registros_(H.AJ, perId).forEach(function(v){
    if (String(v[2]).toLowerCase() === email && v[4] === "bonus" && String(v[5]) === clave) ya = true; });
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
  registros_(H.AJ, o.id).forEach(function(v){
    if (v[4] === "bonus" && String(v[5] || "").indexOf("tripulacion:") === 0)
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

// ── REVERTIR UN CANJE (v3.43) ────────────────────────────────────────────────────────────────
// Lo pidio Norberto el 9-sep: en la ficha del alumno, poder deshacer un canje y devolverle los
// creditos. Se equivocan de opcion, o algo se cobra dos veces, y hasta ahora habia que entrar en
// la pestaña C a mano.
//
// 🔴 NO se borra la fila NI se toca ningun contador. El dinero gastado se calcula sumando las
// filas cuyo Estado empieza por «Concedido», asi que basta con que deje de empezar por ahi: el
// saldo vuelve solo en el siguiente tablero_(). Append-only, como todo lo demas — la fila queda,
// con quien la revirtio y cuando, y por eso se puede auditar.
//
// La recompensa se retira igual de sola: `canjes[m].veces` cuenta esas mismas filas, o sea que
// un heroe revertido deja de estar en su coleccion y un titulo revertido deja de pintarse.
function revertirCanje_(o, fila, profe) {
  fila = Number(fila || 0);
  if (fila < 2) throw new Error("Esa fila no existe");
  var sh = SpreadsheetApp.getActive().getSheetByName(o.tabC);
  if (!sh) throw new Error("Ese grupo no tiene pestaña de canjes");
  if (fila > sh.getLastRow()) throw new Error("Esa fila ya no existe: recarga la ficha");
  var cab = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  var cEstado = cab.indexOf("Estado") + 1;
  if (!cEstado) throw new Error("La pestaña de canjes no tiene columna Estado");
  var antes = String(sh.getRange(fila, cEstado).getValue() || "");
  if (antes.indexOf("Concedido") !== 0)
    return { ok: true, yaEstaba: true, estado: antes };   // idempotente: revertir dos veces no paga dos veces

  var cR = cab.indexOf("Recompensa");
  var cM = idx_(cab, "correo") >= 0 ? idx_(cab, "correo") : idx_(cab, "email");
  var etiqueta = String(sh.getRange(fila, cR + 1).getValue() || "");
  var email = String(sh.getRange(fila, cM + 1).getValue() || "").toLowerCase().trim();
  var cuando = sh.getRange(fila, 1).getValue();

  // que recompensa era, para saber que efecto hay que deshacer
  var cat = recompensasCat_();
  var f = cat.filter(function(x){ return etiqueta === x.nombre + " — " + x.coste + " créditos"; })[0]
       || cat.filter(function(x){ return etiqueta.indexOf(x.nombre) === 0; })
              .sort(function(a, b){ return b.nombre.length - a.nombre.length; })[0] || null;
  var tipo = f ? String(f.tipo || "") : "";

  // 🔴 LOS SORTEOS NO SE REVIERTEN. Un sobre de cromos ya esta repartido: devolverlo dejaria
  // volver a sortear hasta que salga la carta buena, que es dinero infinito disfrazado de arreglo.
  if (tipo === "cromo" || tipo === "cromo_repes")
    throw new Error("Un sobre de cromos no se revierte: las cartas ya están repartidas y devolverlo "
      + "dejaría sortear otra vez hasta que salga la buena. Si se cobró de más, compénsalo por otra vía.");

  var sello = "Revertido · " + (profe || "profesorado") + " · " +
              Utilities.formatDate(new Date(), "Europe/Madrid", "dd/MM/yyyy HH:mm");
  sh.getRange(fila, cEstado).setValue(sello);

  // Y ahora el EFECTO. Si solo se devolviera el dinero, se quedaria con el premio Y con los
  // creditos: revertir seria un regalo. Los efectos viven en AJUSTES como filas «extra», asi que
  // se compensan con una fila «quitar_extra» — append-only, nada se borra.
  var quitado = "";
  if (tipo === "heroe") {
    // cual le toco: la fila «heroe» de ese correo escrita al resolver ESTE canje. Se busca por
    // cercania en el tiempo porque extra_() se ejecuta dentro del mismo disparo (segundos).
    var t0 = new Date(cuando).getTime();
    var mejor = null, dist = 10 * 60 * 1000;   // 10 minutos de margen
    registros_(H.AJ, o.id).forEach(function(v){
      if (String(v[4]) !== "heroe") return;
      if (String(v[2]).toLowerCase().trim() !== email) return;
      var d = Math.abs(new Date(v[0]).getTime() - t0);
      if (d <= dist) { dist = d; mejor = String(v[5] || ""); } });
    if (mejor) { extra_(o, email, "quitar_extra", "heroe:" + mejor); quitado = mejor; }
  } else if (tipo === "titulo" || tipo === "marco" || tipo === "fondo") {
    extra_(o, email, "quitar_extra", tipo); quitado = tipo;
  }
  // tipo «nota» no tiene efecto automatico que deshacer: la subida la aplica una persona a mano,
  // asi que aqui solo vuelve el dinero y el aviso se lo lleva quien la aplico.

  // la traza, donde se mira cuando algo no cuadra
  try {
    hoja_(H.AJ).appendRow([new Date(), o.id, email, "", "canje_revertido", etiqueta, profe || ""]);
  } catch (e) { Logger.log("revertirCanje_ (traza): " + e); }

  return { ok: true, estado: sello, tipo: tipo, quitado: quitado,
           nota: tipo === "nota" ? "Los créditos vuelven, pero la subida de nota la tienes que deshacer tú donde la aplicaste." : "" };
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// SEMBRAR CANJES DE PRUEBA · 9-sep-2026
// Norberto, preparando la demo para compartir pantalla con estudiantes: «haz que haya conseguido
// algunos cromos y 4 heroes de la rebelion. Debe ser funcional todo».
// 🔴 NO se falsean los datos. Se mete la fila en la pestaña de canjes y se llama a resolverCanje_,
// que es LA MISMA funcion que atiende un canje de verdad: cobra los creditos, sortea la carta o el
// heroe, escribe el estado y deja el historial. Asi lo que se enseña en clase es el sistema real
// funcionando, no un decorado — y si el canje tuviera un fallo, la demo lo enseñaria tambien.
// Puerta: igual que sembrarDemo_, solo grupos con DEMO o PRUEBA en el nombre.
// Idempotente: a quien ya tiene heroes no se le vuelve a comprar.
// Norberto, afinando la demo: «quiero que Runa tenga algunos cromos (3 o 4) y (2 o 3 avatares)
// para poder mostrar como se cambia o para que sirven». La gracia no es acumular: es que haya
// ELECCION que enseñar — con 3 heroes el vestuario tiene de donde elegir sin abrumar, y con 4
// cromos el album enseña huecos, que es lo que da ganas de seguir abriendo sobres.
var SIEMBRA_HEROES = 3;
var SIEMBRA_SOBRES = 4;

function sembrarCanjesDemo_(perId) {
  var p = perFila_(perId); if (!p) throw new Error("PER no encontrado: " + perId);
  var o = perObj_(p.v);
  var nom = String(o.nombre || "").toUpperCase();
  if (nom.indexOf("DEMO") < 0 && nom.indexOf("PRUEBA") < 0)
    throw new Error("Solo siembro canjes en grupos DEMO o PRUEBA: «" + o.nombre + "» no lo es.");
  var sh = SpreadsheetApp.getActive().getSheetByName(o.tabC);
  if (!sh) throw new Error("El PER no tiene pestaña de canjes (" + o.tabC + ")");
  var cab = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0].map(String);
  var cM = idx_(cab, "correo") >= 0 ? idx_(cab, "correo") : idx_(cab, "email");
  var cR = cab.indexOf("Recompensa");
  if (cM < 0 || cR < 0) throw new Error("La pestaña de canjes no tiene las columnas de correo y recompensa");

  var cat = recompensasCat_();
  var elegir = function(tipo){ return cat.filter(function(x){ return x.tipo === tipo && x.coste > 0; })[0]; };
  var HEROE = elegir("heroe"), SOBRE = elegir("cromo");
  if (!HEROE || !SOBRE) throw new Error("El catalogo no tiene heroe o sobre de cromos");
  var etiqueta = function(r){ return r.nombre + " — " + r.coste + " créditos"; };

  // el estado ANTES: quien ya tiene vestuario no se toca, y hay que saber de cuanto dispone cada uno
  var antes = {}; tablero_(perId, true).reclutas.forEach(function(x){ antes[String(x.email).toLowerCase()] = x; });

  // 🔴 9-sep · CON RELOJ. La primera version no lo llevaba y se comio los 6 minutos sembrando
  // CLASE DEMO (10 reclutas x 7 canjes, y cada canje pasa por resolverCanje_, que no es barato):
  // el docente se encontraba «Se ha superado el tiempo maximo de ejecucion» en vez de un resultado.
  // Ahora para a tiempo y dice cuantos quedan. Como es idempotente, se vuelve a pasar y sigue por
  // donde iba — que es mas simple y mas robusto que programar una continuacion para una utilidad
  // de pruebas que se usa dos veces en la vida.
  var _t = reloj_();
  var comprados = 0, saltados = 0, sinDinero = 0, pendientes = 0;
  Object.keys(antes).forEach(function(email){
    if (!_t.sobra(45000)) { pendientes++; return; }   // 45 s: lo que cuesta servir a uno entero
    if (email.indexOf("@reclutas.demo") < 0) return;          // solo el alumnado sembrado
    var yo = antes[email];
    if ((yo.n_heroes || 0) > 0) { saltados++; return; }        // ya tiene: no se le compra dos veces
    // 🔴 Se compra solo lo que PUEDE pagar: si no, resolverCanje_ deniega —correctamente— y la
    // pestaña se llena de rechazos que no pintan nada en una demo.
    var bolsa = yo.creditos || 0;
    var nH = Math.min(SIEMBRA_HEROES, Math.floor(bolsa * 0.55 / HEROE.coste));
    var nS = Math.min(SIEMBRA_SOBRES, Math.floor((bolsa - nH * HEROE.coste) * 0.4 / SOBRE.coste));
    if (nH <= 0 && nS <= 0) { sinDinero++; return; }
    var lote = [];
    for (var h = 0; h < nH; h++) lote.push(HEROE);
    for (var c = 0; c < nS; c++) lote.push(SOBRE);
    lote.forEach(function(rec){
      var fila = []; while (fila.length < cab.length) fila.push("");
      fila[0] = new Date(); fila[cM] = email; fila[cR] = etiqueta(rec);
      sh.appendRow(fila);
      resolverCanje_(o, sh, sh.getLastRow());     // la maquinaria de verdad: cobra y concede
      comprados++;
    });
  });
  return { comprados: comprados, saltados: saltados, sinDinero: sinDinero, pendientes: pendientes };
}

function sembrarCanjesDemo() {
  var sel = filaPERSeleccionada_(); if (!sel) return; var ui = SpreadsheetApp.getUi();
  if (ui.alert("Sembrar canjes de PRUEBA",
      "Compra " + SIEMBRA_HEROES + " héroes y " + SIEMBRA_SOBRES + " sobres de cromos para cada recluta " +
      "sembrado de «" + sel.o.nombre + "» que aún no tenga vestuario, pagándolos con sus créditos.\n\n" +
      "Usa el canje DE VERDAD, así que el historial y el dinero quedan como en un curso real.\n\n¿Sembrar?",
      ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  try {
    var r = sembrarCanjesDemo_(sel.o.id);
    ui.alert("Canjes sembrados", r.comprados + " canjes hechos · " + r.saltados + " reclutas ya tenían vestuario" +
      (r.sinDinero ? " · " + r.sinDinero + " sin créditos suficientes" : "") +
      (r.pendientes ? "\n\n⏳ Quedan " + r.pendientes + " reclutas por servir: se acabó el tiempo de esta pasada. " +
        "Vuelve a darle y sigue por donde iba (no compra dos veces a nadie)." : "") +
      "\n\nMíralo en la Nave con &demo=1 o en el tablero.", ui.ButtonSet.OK);
  } catch (e) { ui.alert("No se pudo sembrar", String(e.message || e), ui.ButtonSet.OK); }
}

// 🔴 11-sep · LLEGÓ AQUÍ DESDE Code.gs, que volvió a rozar el techo de guardado de Apps Script.
// Cuarta mudanza por la misma razón. El parte encaja: es autónomo, solo lee y solo informa.
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


// ═══════════════════════════════════════════════════════════════════════════════════════════
// LA COLA DE SOLICITUDES DE NOTA · 11-sep-2026
// Norberto: «el docente no puede subir manualmente la nota a 70 alumnos que quieren maquillar, es
// trabajar el doble y es tiempo no reflejado».
// El problema no era solo CUÁNTAS llegan —eso lo arreglan la semana 15 y los precios— sino CÓMO:
// concediéndose solas, una por una, con un correo cada vez. Trabajo a goteo y sin decidir nada.
// Ahora se acumulan aquí y se resuelven de una sentada, con derecho a veto.
//
// 🔴 LOS CRÉDITOS NO SE MUEVEN HASTA QUE SE APRUEBA. `gastado` solo suma las filas que empiezan por
// «Concedido», así que una solicitud pendiente no cuesta nada. Si se rechaza, no hay que devolver
// nada porque nunca se cobró — y nadie pierde dinero por preguntar.

// Las solicitudes que esperan, de un grupo. Devuelve lo justo para decidir: quién, qué, cuándo, a
// qué actividad y si le siguen dando los créditos.
function pendientesNota_(perId) {
  var o = perObj_(perFila_(perId).v);
  var sh = SpreadsheetApp.getActive().getSheetByName(o.tabC);
  if (!sh || sh.getLastRow() < 2) return { pendientes: [] };
  var v = sh.getDataRange().getValues(), cab = v[0].map(String);
  var cE = cab.indexOf("Estado"), cR = cab.indexOf("Recompensa");
  var cM = idx_(cab, "correo") >= 0 ? idx_(cab, "correo") : idx_(cab, "email");
  var cA = idx_(cab, "actividad");
  if (cE < 0 || cR < 0 || cM < 0) return { pendientes: [] };
  // el saldo de cada uno HOY: entre pedirlo y aprobarlo puede haberse gastado los créditos en otra
  // cosa, y aprobar a ciegas lo dejaría en negativo
  var saldo = {}, quien = {};
  tablero_(perId, true).reclutas.forEach(function(x){
    var m = String(x.email || "").toLowerCase();
    saldo[m] = x.creditos; quien[m] = { alias: x.alias, nombre: x.nombre || "" };
  });
  var out = [];
  for (var i = 1; i < v.length; i++) {
    if (String(v[i][cE] || "").indexOf(EST_PENDIENTE) !== 0) continue;
    var em = String(v[i][cM] || "").toLowerCase().trim();
    var et = String(v[i][cR] || "");
    var f = recompensasCat_().filter(function(x){ return et.indexOf(x.nombre) === 0; })
             .sort(function(a, b){ return b.nombre.length - a.nombre.length; })[0];
    var coste = f ? f.coste : 0;
    out.push({ fila: i + 1, fecha: v[i][0], email: em,
               alias: (quien[em] || {}).alias || "", nombre: (quien[em] || {}).nombre || "",
               recompensa: et, coste: coste,
               actividad: cA >= 0 ? String(v[i][cA] || "") : "",
               saldo: saldo[em] == null ? null : saldo[em],
               puede: saldo[em] != null && saldo[em] >= coste });
  }
  return { pendientes: out };
}

// Aprobar o rechazar. Idempotente: si ya está resuelta, lo dice y no toca nada.
function resolverPendiente_(perId, fila, profe, aprueba, motivo) {
  fila = Number(fila || 0);
  if (fila < 2) throw new Error("Esa fila no existe");
  var o = perObj_(perFila_(perId).v);
  var sh = SpreadsheetApp.getActive().getSheetByName(o.tabC);
  if (!sh) throw new Error("Ese grupo no tiene pestaña de canjes");
  if (fila > sh.getLastRow()) throw new Error("Esa fila ya no existe: recarga la lista");
  var cab = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  var cE = cab.indexOf("Estado") + 1;
  if (!cE) throw new Error("La pestaña de canjes no tiene columna Estado");
  var antes = String(sh.getRange(fila, cE).getValue() || "");
  if (antes.indexOf(EST_PENDIENTE) !== 0) return { ok: true, yaEstaba: true, estado: antes };

  var cM = idx_(cab, "correo") >= 0 ? idx_(cab, "correo") : idx_(cab, "email");
  var cR = cab.indexOf("Recompensa");
  var email = String(sh.getRange(fila, cM + 1).getValue() || "").toLowerCase().trim();
  var et = String(sh.getRange(fila, cR + 1).getValue() || "");
  var sello = " · " + (profe || "profesorado") + " · " +
              Utilities.formatDate(new Date(), "Europe/Madrid", "dd/MM/yyyy HH:mm");

  if (!aprueba) {
    sh.getRange(fila, cE).setValue("Rechazado" + sello + (motivo ? " · " + motivo : ""));
    try { enviarCorreo_(email, "STARGATE · Tu solicitud de nota",
      "Tu profesorado ha revisado la solicitud de «" + et + "» y no la ha aplicado" +
      (motivo ? ": " + motivo : ".") + "\n\n🔴 No se te han cobrado los créditos: los tienes enteros, " +
      "y puedes gastarlos en lo que quieras.\n\nTu nave: " + WEB + "recluta.html?per=" + o.id,
      o.id, email); } catch (e) { Logger.log("aviso de rechazo: " + e); }
    return { ok: true, aprobado: false, estado: "Rechazado" };
  }

  // 🔴 Comprobar el saldo AHORA, no el de cuando lo pidió: entre medias ha podido gastárselo en
  // sobres. Aprobar a ciegas lo dejaría en negativo, y el saldo negativo no se ve venir.
  var yo = tablero_(perId, true).reclutas.filter(function(x){
    return String(x.email || "").toLowerCase() === email; })[0];
  var f = recompensasCat_().filter(function(x){ return et.indexOf(x.nombre) === 0; })
           .sort(function(a, b){ return b.nombre.length - a.nombre.length; })[0];
  var coste = f ? f.coste : 0;
  if (!yo || yo.creditos < coste)
    return { ok: false, error: "Ya no le llegan los créditos: tiene " + (yo ? yo.creditos : 0) +
             " y cuesta " + coste + ". Se los habrá gastado después de pedirlo." };

  sh.getRange(fila, cE).setValue("Concedido" + sello);
  try { enviarCorreo_(email, "STARGATE · Solicitud de nota aprobada",
    "Tu profesorado ha aprobado «" + et + "». Se te han descontado " + coste + " créditos y la nota " +
    "se aplicará en la plataforma de la asignatura.\n\nTu nave: " + WEB + "recluta.html?per=" + o.id,
    o.id, email); } catch (e) { Logger.log("aviso de aprobacion: " + e); }
  return { ok: true, aprobado: true, estado: "Concedido", coste: coste };
}

// ═══ LA SIEMBRA DE ALUMNADO DE PRUEBA ═══════════════════════════════════════════════════════════
// 🔴 Vive AQUI y no en Code.gs por una razon tonta y muy real: Apps Script deja de guardar un
// fichero pasados ~298.000 bytes, sin decirlo. Es la sexta vez que Code.gs roza el techo. Cuando
// pasa, se saca un bloque entero —no se pelea con el boton de guardar— y se elige uno que no tenga
// nada que ver con el motor. Su hermana `sembrarCanjesDemo_` ya estaba aqui.

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
    pon("nombre", a[0]);            // formulario nuevo: el alias hace de nombre de pila
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

// ═══ CONSOLIDAR DATOS / RESUMEN (investigación) ═════════════════════════════════════════════════
// Mudado desde Code.gs el 11-sep (séptima vez que roza el techo de Apps Script). No tiene nada que
// ver con el motor del juego: vuelca EVENTOS y AJUSTES a las pestañas de investigación. Se elige
// siempre lo más periférico para mudar, nunca algo del camino caliente.
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

// ═════════════════════════════════════════════════════════════════════════════════════════════
// EL TICKET DE SALIDA, LO ÚNICO QUE SE QUEDA AQUÍ
// ═════════════════════════════════════════════════════════════════════════════════════════════
//
// 12-sep-2026. STARGATE se mudó al motor de GamificaPro: los grupos se crean desde la web, los
// retos se marcan desde la Nave y el canje va por Firestore. De esta hoja no depende ya nada de
// eso.
//
// 🔴 Menos el ticket de salida, y por un motivo que no tiene arreglo del otro lado: tiene que ser
// ANÓNIMO. El motor guarda quién responde cada formulario suyo — es lo correcto para casi todo y
// es exactamente lo que aquí no puede pasar. Un formulario de Google que no pide el correo es la
// única forma de prometer anonimato y cumplirlo.
//
// Así que la hoja se queda, pero solo para esto. Y el argumento que lo hace tranquilo: lo que
// reventaba Apps Script era recalcular el tablero en cada visita y doscientas personas registrando
// retos a la vez. El ticket es un goteo — una respuesta por estudiante y tema, ocho veces en todo
// el curso. Eso cabe de sobra.
//
// Y otra cosa que se ordena sola: el PIN deja de guardar nombres, correos y el poder de cambiar
// notas. Solo guarda valoraciones anónimas. Un PIN flojo pasa a ser proporcionado al riesgo.

/**
 * Crea el ticket de salida de un grupo que vive en el motor nuevo.
 *
 * Sustituye a «Crear PER» entero: aquella creaba tres formularios, una carpeta, un documento de
 * enlaces y un dossier. Esta hace UNA cosa, y devuelve el enlace para pegarlo en la consola.
 */
function crearTicketDeSalida() {
  var ui = SpreadsheetApp.getUi();
  var _yo = ejecutaComo_(), _dueno = duenoDeLaHoja_();
  if (_yo && _dueno && _yo !== _dueno) {
    ui.alert("Estás con la cuenta " + _yo + " y la hoja es de " + _dueno + ".\n\n" +
      "El formulario quedaría en propiedad de " + _yo + " y no de la universidad, y después no se " +
      "puede transferir sin que el destinatario lo acepte.\n\nEntra con " + _dueno + " y repítelo.");
    return;
  }

  var r1 = ui.prompt("Ticket de salida",
    "Identificador del grupo, tal y como aparece en la consola.\n" +
    "Por ejemplo: per-septiembre-2026", ui.ButtonSet.OK_CANCEL);
  if (r1.getSelectedButton() !== ui.Button.OK) return;
  var id = slug_(r1.getResponseText());
  if (!id) { ui.alert("Sin identificador no puedo hacer nada."); return; }
  if (perFila_(id)) {
    var o0 = perObj_(perFila_(id).v);
    ui.alert("Ese grupo ya tiene ticket:\n\n" + (o0.formTicket || "(sin enlace)"));
    return;
  }

  var r2 = ui.prompt("Ticket de salida",
    "Nombre del grupo, para el título del formulario.\n" +
    "Por ejemplo: PER Septiembre 2026", ui.ButtonSet.OK_CANCEL);
  if (r2.getSelectedButton() !== ui.Button.OK) return;
  var nombre = (r2.getResponseText() || id).trim();

  // El ticket pregunta «quién imparte tu clase» para que el profesorado pueda filtrar sus dudas.
  // Sin esa lista, el desplegable sale vacío y las respuestas no se pueden repartir.
  var r3 = ui.prompt("Ticket de salida",
    "Nombres del profesorado, separados por comas.\n" +
    "Los verá el alumnado al elegir de quién es la clase.", ui.ButtonSet.OK_CANCEL);
  if (r3.getSelectedButton() !== ui.Button.OK) return;
  var profesores = (r3.getResponseText() || "").trim();

  var ss = SpreadsheetApp.getActive();
  var master = DriveApp.getFileById(ss.getId()), padres = master.getParents();
  var raiz = padres.hasNext() ? padres.next() : DriveApp.getRootFolder();
  var subs = raiz.getFoldersByName("Formularios PER");
  var padre = subs.hasNext() ? subs.next() : raiz.createFolder("Formularios PER");
  var carpetas = padre.getFoldersByName(nombre);
  var carpeta = carpetas.hasNext() ? carpetas.next() : padre.createFolder(nombre);

  var ft;
  try {
    ft = formDesdePlantilla_("PLANTILLA · Ticket de salida",
      "STARGATE · " + nombre + " · Contacta con NEBULA (ticket de salida)", carpeta);
    construirTicket_(ft, "", profesores, id);
    publicar_(ft);
    vincular_(ft, ss.getId());
  } catch (e) {
    try { if (ft) DriveApp.getFileById(ft.getId()).setTrashed(true); } catch (e2) {}
    ui.alert("No he podido crearlo: " + e.message);
    return;
  }
  var tabT = pestanaDe_(ft, "T · " + id, "#9fb2c2");

  // 🔴 La fila en PERs es lo que hace que el panel de tickets encuentre las respuestas: busca por
  // identificador y lee la pestaña que diga la fila. Solo se rellenan las columnas del ticket; las
  // demás se quedan vacías a propósito, porque de ellas ya se encarga el motor nuevo y tenerlas
  // aquí a medias sería invitar a que alguien las creyera.
  hoja_(H.PERS).appendRow([id, nombre, "REGULAR", profesores, "", "", "", "abierto",
    "", "", ft.getPublishedUrl(), "", "", tabT, "", new Date(), "", ft.getEditUrl(),
    "", "", "", "", "", "", ""]);

  ui.alert("Ticket creado\n\n" +
    "Pega este enlace en la consola de STARGATE, en los ajustes del grupo:\n\n" +
    ft.getPublishedUrl() + "\n\n" +
    "Las respuestas caen en la pestaña «" + tabT + "» y se ven en el panel de tickets de la web.");
}
