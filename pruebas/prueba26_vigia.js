'use strict';
// 26 · EL VIGÍA DIARIO
// El parte de salud ya sabía detectar los triggers duplicados, la cuota de correo y los canjes sin
// resolver. Los duplicados los encontramos a mano, de casualidad, porque NADIE ABRIÓ EL PARTE.
// El vigía es la boca que le faltaba. Lo que esta batería vigila es el equilibrio: que hable cuando
// pasa algo, que NO se vuelva ruido de fondo (o dejarán de leerlo) y que el silencio de un script
// muerto no se confunda con el silencio de un sistema sano — que es justo el riesgo de una baja.
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
const M = E.M;
console.log("\n▶ 26 · El vigía diario");

const G = E.nuevoMundo();
E.crearPERDemo(G);
const props = G.PropertiesService.getScriptProperties();
props.setProperty("CORREO_AVISOS", "profe.guardia@unir.net");
const correos = () => M.Correo.enviados.filter(e => /STARGATE ·/.test(e.asunto));
const ultimo = () => correos()[correos().length - 1];
const envuelve = n => { const e = correos().length; return () => correos().length - e; };

// ---------------------------------------------------------------- a) con algo mal, habla
// El PIN de fábrica es «0000»: el parte lo marca en rojo porque es lo único que protege nombres y
// correos del alumnado. Sirve de problema real para la prueba.
props.setProperty("PIN_PROFES", "0000");
let r = G.vigiaDiario();
igual(r.enviado, true, "🔴 si hay algo mal, escribe");
contiene(ultimo().asunto, "que arreglar", "y el asunto lo dice desde la notificación del móvil");
contiene(ultimo().cuerpo, "PIN", "el cuerpo nombra el problema");
contiene(ultimo().cuerpo, "Que hacer", "y dice qué hacer, no solo que algo falla");
igual(ultimo().para, "profe.guardia@unir.net", "va a quien cubre, no al dueño de la hoja");

// ---------------------------------------------------------------- b) al día siguiente, calla
const antes = correos().length;
r = G.vigiaDiario();
igual(r.enviado, false, "🔴 el mismo problema al día siguiente NO se repite: el ruido diario se deja de leer");
igual(correos().length, antes, "no ha salido ningún correo");

// ---------------------------------------------------------------- c) pero insiste si se enquista
props.setProperty("VIGIA_ESTADO", JSON.stringify({
  huella: JSON.parse(props.getProperty("VIGIA_ESTADO")).huella,
  fecha: new Date(Date.now() - 8 * 864e5).toISOString() }));
r = G.vigiaDiario();
igual(r.enviado, true, "a los 8 días vuelve a avisar de lo que sigue roto");
contiene(ultimo().cuerpo, "sigue igual", "y lo dice: «ya te lo dije y sigue igual»");

// ---------------------------------------------------------------- d) cuando se arregla, lo dice
// A partir de aquí se sustituye el parte por uno limpio: lo que se prueba es la DECISIÓN del vigía
// (cuándo habla y cuándo calla), no lo que sabe mirar el parte, que tiene su propia batería.
const salud = G.salud_;
G.salud_ = function(){ return { ok: true, malos: 0, avisos: 0, puntos: [], pers: 1, fecha: new Date() }; };
r = G.vigiaDiario();
igual(r.enviado, true, "cuando se arregla, avisa UNA vez");
contiene(ultimo().asunto, "arreglado", "para que quien lo arregló sepa que ya está");
const trasArreglo = correos().length;
igual(G.vigiaDiario().enviado, false, "🔴 y a partir de ahí, silencio: no felicita todos los días");
igual(correos().length, trasArreglo, "ni uno más");

// ---------------------------------------------------------------- e) el silencio con señal de vida
// Si el script muriera, dejaría de escribir. Y «no recibo nada» es EXACTAMENTE lo mismo que se ve
// cuando todo va bien. Por eso, tras 30 días callado, da señal de vida.
props.setProperty("VIGIA_ESTADO", JSON.stringify({ huella: "", fecha: new Date(Date.now() - 31 * 864e5).toISOString() }));
r = G.vigiaDiario();
igual(r.enviado, true, "🔴 tras 30 días sin decir nada, da señal de vida");
contiene(ultimo().asunto, "sigo vigilando", "para que el silencio de un script muerto no parezca salud");
igual(G.vigiaDiario().enviado, false, "y vuelve a callarse otros 30 días");
G.salud_ = salud;

// ---------------------------------------------------------------- f) si el parte revienta, se entera
const bueno = G.salud_;
G.salud_ = function(){ throw new Error("la hoja no responde"); };
r = G.vigiaDiario();
G.salud_ = bueno;
igual(r.enviado, true, "🔴 que el parte NO se pueda ni ejecutar es la peor noticia: también se cuenta");
contiene(ultimo().cuerpo, "la hoja no responde", "con el error dentro");

// ---------------------------------------------------------------- g) cuelga de la foto nocturna
c(String(G.fotoNocturna).indexOf("vigiaDiario") >= 0,
  "🔴 va colgado de fotoNocturna: ni un trigger nuevo que instalar, mantener o duplicar");

// ---------------------------------------------------------------- h) siempre deja rastro en la hoja
// El registro de Cloud de este proyecto NO siempre está disponible — lo dice el propio código. Sin
// rastro en la hoja, un vigía averiado es indistinguible de un sistema sano: exactamente lo
// contrario de para lo que sirve. Pasó en vivo: el primer envío no salió y no había forma de saberlo.
const rastro = () => G.hoja_(G.H.AJ).getDataRange().getValues().filter(r => String(r[3]) === "VIGIA");
const antesR = rastro().length;
props.setProperty("VIGIA_ESTADO", "");
props.setProperty("PIN_PROFES", "0000");
G.vigiaDiario();
c(rastro().length > antesR, "🔴 al avisar, deja constancia en AJUSTES");
contiene(String(rastro()[rastro().length-1][5]), "aviso enviado", "diciendo que salió y a quién");

// y cuando calla, también: «no he dicho nada» tiene que poder distinguirse de «estoy muerto»
const antesR2 = rastro().length;
G.vigiaDiario();
c(rastro().length > antesR2, "🔴 y cuando calla, TAMBIÉN: callar no puede parecer estar muerto");
contiene(String(rastro()[rastro().length-1][4]), "nada que contar", "dejando dicho que miró y no había nada");

// si el correo REVIENTA al salir, el rastro lo dice. Es el caso que pasó en vivo: la excepción se
// la traga enviarCorreo_, el registro de Cloud no estaba disponible y no quedaba rastro en ninguna
// parte — el vigía parecía haber funcionado.
props.setProperty("VIGIA_ESTADO", "");
const enviar = G.MailApp.sendEmail;
G.MailApp.sendEmail = function(){ throw new Error("no tienes permiso para enviar correo"); };
const r2 = G.vigiaDiario();
G.MailApp.sendEmail = enviar;
igual(r2.enviado, false, "si el envío revienta, el vigía lo sabe");
contiene(String(rastro()[rastro().length-1][5]), "NO salio", "🔴 y queda escrito en la hoja que NO salió");
contiene(String(rastro()[rastro().length-1][5]), "permiso", "con el motivo exacto, no un «algo falló»");
contiene(r2.fallo, "permiso", "y lo devuelve, para quien lo llame desde el menú");

E.resumen("El vigía diario");
