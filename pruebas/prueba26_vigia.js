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

E.resumen("El vigía diario");
