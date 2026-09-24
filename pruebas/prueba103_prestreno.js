'use strict';
/**
 * Batería 103 · LA PRESENTACIÓN PARA EL EQUIPO (20-sep)
 *
 * Norberto: «monta la presentación. Debe ser visual, usar los recursos de STARGATE, interactiva… como las sesiones
 * semanales. La diferencia clave: está orientada a docentes primerizos. Esta presentación está disponible si eres
 * profe referente».
 *
 * 🔴 LO QUE SE VIGILA AQUÍ es lo que no se ve mirando la pantalla una vez: que **no haya ni un dato escrito a mano**.
 * Los planetas, las semanas, los retos, los capítulos y la Tripulación Cero salen de `_site_data.py`; el día que se
 * mueva un tema o se renombre un reto, la presentación lo dirá bien sin que nadie se acuerde de ella.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };

const JS = L("assets/js/prestreno.js"), HTML = L("prestreno.html"), CSS = L("assets/css/stargate.css");
const CONS = L("assets/js/consola.js");

// 🔴 el valor de un `window.SG_*` del HTML servido. Nada de «hasta el </script>»: ya no hay un último fijo —cada
// tanda añade globales— y el que lo diera por supuesto se comía los de detrás (pasó el 21-sep con SG_ENLACES).
const dato = n => {
  const i = HTML.indexOf("window." + n + "=");
  if (i < 0) return null;
  const j = HTML.indexOf(";window.", i), k = HTML.indexOf(";</script>", i);
  return JSON.parse(HTML.slice(i + ("window." + n + "=").length, (j < 0 || (k >= 0 && k < j)) ? k : j));
};


// ── 1 · existe, está tras la puerta del profesorado y no se enlaza al alumnado
c(fs.existsSync(path.join(R, "prestreno.html")), "🔴 la presentación del equipo existe (prestreno.html)");
c(/assets\/js\/puerta\.js/.test(HTML), "   y va tras la puerta del profesorado");
// 24-sep · ya no es solo del referente: todo el profesorado la tiene en la Guía, arriba, como resumen
c(/Para el equipo docente/.test(HTML), "   dice a quién es: el equipo docente");
const GUIAH = L("guia.html");
c(/id="presentacion"/.test(GUIAH) && /<iframe src="prestreno\.html\?embed=1"/.test(GUIAH) && /href="#presentacion"/.test(GUIAH),
  "🔴 24-sep · y está embebida en la Guía, arriba, con su entrada en el índice (Norberto: «por si la quieren volver a revisar»)");
const enAlumnado = ["recluta.html", "alistarse.html", "index.html"].filter(f => /prestreno\.html/.test(L(f)));
c(!enAlumnado.length, "🔴 no se enlaza desde ninguna página del alumnado", enAlumnado.join(", "));

// ── 2 · dónde se abre: «Gestionar grupos», que es la página del referente
c(/gs-prestreno/.test(CONS) && /href="prestreno\.html"/.test(CONS),
  "🔴 se abre desde «Gestionar grupos» (la página que solo ve el referente)");
c(/gs-prestreno/.test(CSS), "   y tiene su tarjeta con estilo propio");

// ── 3 · 🔴 ni un dato a mano: todo sale de los globales del sitio
[["SG_SEMANAS", "las semanas"], ["SG_PLANETAS", "los planetas"], ["SG_RETOS", "los retos"],
 ["SG_CAPITULOS", "los capítulos"], ["SG_CROMOS", "la Tripulación Cero"], ["SG_TOPE_SEMANA", "el tope semanal"],
 ["SG_PER_ESCUELA", "la Nave Escuela"]].forEach(function (x) {
  c(JS.indexOf("window." + x[0]) >= 0 && HTML.indexOf("window." + x[0] + "=") >= 0, "🔴 " + x[1] + " salen del sitio, no escritos a mano");
});
// los ocho planetas y las semanas, de verdad, en el HTML servido
const plan = (HTML.match(/window\.SG_PLANETAS=(\[.*?\]\]);/) || [, "[]"])[1];
c((JSON.parse(plan) || []).length === 8, "   los ocho planetas viajan con la página", (JSON.parse(plan) || []).length);
c(/window\.SG_PER_ESCUELA="nave-escuela"/.test(HTML), "   y el grupo para trastear, por su identificador de verdad");

// ── 4 · se maneja como la sesión de clase (ese es el argumento: enseña el producto funcionando)
c(/class="mazo pr-mazo"/.test(JS) && /barra-pasos/.test(JS) && /class="nav ant"/.test(JS),
  "🔴 usa el mazo de la sesión: mismas flechas, misma barra de abajo");
c(/ArrowRight/.test(JS) && /ArrowLeft/.test(JS), "   y se pasa con las flechas del teclado");
c(/requestFullscreen/.test(JS), "   con pantalla completa, que es para proyectar");

// ── 5 · lo interactivo: el mapa de planetas y las preguntas
c(/data-pl=/.test(JS) && /function fichaPlaneta/.test(JS), "🔴 el mapa: pulsar un planeta abre su tema");
c(/Aquí se quedó/.test(JS) && /tarjetas\/' \+ esc\(T\.clave\)/.test(JS),
  "   con el tripulante que se quedó allí y su carta");
c(/pr-q/.test(JS) && /aria-expanded/.test(JS), "🔴 las preguntas se abren de una en una (da tiempo a contestar)");
c((JS.match(/\["¿/g) || []).length >= 5, "   y son las cinco que siempre salen", (JS.match(/\["¿/g) || []).length);
c(/data-video=/.test(JS), "   el vídeo de bienvenida se ve dentro, con el visor de la casa");

// ── 6 · 🔴 21-sep · LOS ENLACES DE INTERÉS (Norberto: «añade una diapo con enlaces de interés… ¿me dejo alguno?»)
const ENL = dato("SG_ENLACES") || [];
c(/function enlaces\(\)/.test(JS) && /enlaces\(\), cierre\(\)/.test(JS),
  "🔴 la presentación acaba con la diapositiva de enlaces, justo antes del cierre");
c(ENL.length >= 6 && ENL.every(e => e.length === 4 && e[1] && e[2] && e[3]),
  "   y son " + ENL.length + ", cada uno con su icono, su nombre, para qué sirve y su dirección", JSON.stringify(ENL.map(e => e[1])));
// los tres que pidió, más los que faltaban
[["Drive", /drive\.google\.com/], ["la carpeta de Geniallys", /app\.genially\.com\/teams/], ["la plataforma", /stargate\.mistercuarter\.es/],
 ["el panel que se proyecta", /view\.genially\.com/], ["los vídeos", /youtube\.com\/playlist/], ["la Nave Escuela", /per=nave-escuela/]]
  .forEach(x => c(ENL.some(e => x[1].test(e[3])), "   está " + x[0]));
// (el trozo SÍ lleva un /^https?:\/\//, pero es el que le quita el protocolo al texto; lo que no puede haber es una
//  dirección entrecomillada, que sería una copia de la que ya vive en _site_data.py)
c(!/["']https?:\/\/[a-z]/.test(JS.slice(JS.indexOf("function enlaces()"), JS.indexOf("function cierre()"))),
  "🔴 ni una dirección escrita a mano: salen de _site_data.py (ENLACES_EQUIPO)");
c(/^ENLACES_EQUIPO = \[/m.test(fs.readFileSync(path.join(R, "_site_data.py"), "utf8")), "   que es donde ya vivían todas");
c(/\.pr-enl\{/.test(CSS) && /\.pr-e\{/.test(CSS), "   con su rejilla de tarjetas");

// ── 6 bis · 🔴 21-sep · LA VENTANA LIMPIA (Norberto: «exclusivamente la presentación… evitar distractores»)
c(/embed.*===.*"1".*classList\.add\("embed"\)/.test(JS.replace(/\n\s*/g, " ")),
  "🔴 con ?embed=1 la página se queda solo con la presentación (sin menú, cabecera ni pie)");
c(/body\.embed section:has\(#prestreno-app\)/.test(CSS) && /body\.embed \.pr-mazo \.lienzo\{overflow:auto\}/.test(CSS),
  "   y el mazo ocupa la ventana entera, dejando rodar lo que no quepa");
c(/\.pr-mazo \.dia\{justify-content:safe center\}/.test(CSS),
  "   una diapositiva más alta que la ventana no se come su propio principio");

// ── 6 ter · 🔴 21-sep · lo que se dice del trabajo del docente tiene que ser VERDAD
// Norberto: «esto es mentira, no es necesario validar. Si el docente tiene dudas de la veracidad, puede consultar el
// enlace y anular su entrega». El reto lo registra el recluta y cuenta solo: no hay bandeja de correcciones.
c(!/se valida o se anula/.test(JS) && /No hay que validar nada/.test(JS),
  "🔴 «lo que NO hay que hacer» no promete una validación que no existe");
c(!/se mira y se valida o se anula/.test(fs.readFileSync(path.join(R, "..", "GUIA_PROFES_PDF.md"), "utf8")),
  "   y la guía del profesorado, igual");

// ── 6 quater · 🔴 21-sep · SE MONTAN LAS DIAPOSITIVAS DE VERDAD (tres cosas que Norberto vio proyectadas)
//   «Aparece semana UNDEFINED. Debe aparecer qué semana se desbloquea y qué es cada cosa (brevemente)».
//   «El tercer nombre no debería ser la Bitácora, será el Comandante, ¿no? El otro personaje».
//   «La Bitácora merece una diapositiva completa. Enlaza con la plantilla de Genially».
const trozo = (a, b) => JS.slice(JS.indexOf(a), JS.indexOf(b));
const pintar = new Function(`
  var CAPS = ${JSON.stringify(dato("SG_CAPITULOS") || [])};
  var window = { SG_PLANTILLA_EP: ${JSON.stringify(dato("SG_PLANTILLA_EP") || "")},
                 SG_ACTIVIDADES: ${JSON.stringify(dato("SG_ACTIVIDADES") || [])} };
  ${trozo("var esc = function", "var $ =")}
  ${trozo("var PRE = window", "function portada()")}
  ${trozo("function nombres()", "function mapa()")}
  ${trozo("function capitulos()", "function comoSeGana()")}
  return { capitulos: capitulos, nombres: nombres, bitacora: bitacora, CAPS: CAPS, A: window.SG_ACTIVIDADES, PL: window.SG_PLANTILLA_EP };
`)();

const caps = pintar.capitulos().html;
c(!/undefined/i.test(caps), "🔴 ni un «Semana undefined»: cada capítulo dice la semana en la que se abre");
c(pintar.CAPS.filter(x => x.listo !== false).every(x => caps.indexOf("Semana " + x.semanas.REGULAR) > 0),
  "   y es la suya, la del calendario (semanas.REGULAR)");
c(pintar.CAPS.filter(x => x.listo !== false).every(x => !x.cabecera || caps.indexOf(x.cabecera) > 0),
  "🔴 y qué es cada cosa, en una línea (su cabecera, la misma que le enseña NEBULA al alumnado)");
const semCaps = (caps.match(/Semana (\d+)/g) || []).map(x => Number(x.replace(/\D/g, "")));
c(semCaps.length > 1 && semCaps.every((x, i) => i === 0 || x >= semCaps[i - 1]),
  "   en orden de apertura, que es como se cuenta", JSON.stringify(semCaps));

const nom = pintar.nombres().html;
// 🔴 23-sep · Norberto: «Capitán de la Nave (es nuestro personaje), Comandante STARGATE (el docente de cada grupo)»
c(/<b>Capitán de la Nave<\/b>/.test(nom) && /img\/capitan\//.test(nom) && !/Capitán[^<]*eres tú/.test(nom),
  "🔴 el Capitán de la Nave es el personaje de la serie, no el docente");
c(/<b>Comandante STARGATE · (eres tú|sois vosotros)<\/b>/.test(nom) && /comandantes\/recorte_hd\//.test(nom) && /Nave del Comandante/.test(nom),
  "🔴 y la cuarta tarjeta es el Comandante STARGATE: el docente, con su avatar");
c((nom.match(/<figure class="pr-c/g) || []).length === 4 && !/La Bitácora Estelar<\/b>/.test(nom), "   cuatro tarjetas, y la Bitácora no es una de ellas");

const bit = pintar.bitacora().html;
c(/function bitacora2\(\)/.test(JS) && /bitacora2\(\)/.test(JS.slice(JS.indexOf("function mazo()"))), "🔴 la Bitácora tiene diapositiva propia (con su sala de fondo)");
c(/evidencia/.test(bit) && /contexto/.test(bit) && /reflexión/.test(bit) && /autoevaluación/.test(bit),
  "   con el patrón de cada página: evidencia, contexto, reflexión y autoevaluación");
c(pintar.A.every(a => bit.indexOf(a.titulo) > 0) && /Tres hazañas más/.test(bit),
  "   y lo que acaba dentro: las dos Actividades (del dato) y tres retos más");
c(!!pintar.PL && bit.indexOf(pintar.PL) > 0 && /Abrir la plantilla en Genially/.test(bit),
  "🔴 y enlaza con la plantilla de Genially", pintar.PL);
c(/\.pr-bit2\{/.test(CSS) && /\.pr-c figcaption > b\{/.test(CSS),
  "   con su estilo — y la negrita de dentro de una tarjeta ya no se convierte en titular");

// ── 6 quinquies · 🔴 24-sep · QUE ENAMORE. Norberto: «más visual… la portada empieza muy directa: dales la bienvenida,
// diles que son los nuevos comandantes… el Capitán como hilo y NEBULA para complementar… una diapositiva a un reto
// completo, con su ficha e insignia… el material, los héroes, los avatares de los docentes, los sobres… el sorteo…
// subir la nota… el simulador de Joran, es caviar… y un personaje diciendo: sé que son muchas cosas, no os preocupéis».
const MAZO = JS.slice(JS.indexOf("function mazo()"), JS.indexOf("// ───", JS.indexOf("function mazo()")));
[["portada", "la portada da la bienvenida"], ["encargo", "el encargo: predicar con el ejemplo sin tiempo extra"],
 ["comandantes", "los avatares del profesorado"], ["material", "el material ya hecho"], ["unReto", "un reto entero"],
 ["heroes", "los héroes de la Rebelión"], ["cromos", "los sobres y el Zoco"], ["simulador", "el Simulador de Joran"],
 ["sorteo", "el Gran Sorteo"], ["nota", "subir la nota, al final"], ["tranquilos", "«poco a poco»"]].forEach(function (x) {
  c(new RegExp("\\b" + x[0] + "\\(\\)").test(MAZO), "   en el mazo: " + x[1]);
});
c(/Bienvenidos a bordo, <em>Comandantes<\/em>/.test(JS), "🔴 la portada no empieza directa: bienvenida a los nuevos Comandantes");
c(/Sé que son muchas cosas/.test(JS), "🔴 el Capitán tranquiliza: la nave se enciende poco a poco");
c(/window\.SG_PRESENTA=\{/.test(HTML) && /SG_PRESENTA/.test(JS), "   las cifras, los precios y el reto de ejemplo salen del build (SG_PRESENTA), no escritos a mano");
// cada imagen de escena que nombra la presentación existe de verdad
const imgs = Array.from(new Set((JS.match(/assets\/img\/[a-z_\/]+\.(?:webp|png|jpg)|"[a-z_]+\.webp"/g) || [])
  .map(x => x.replace(/"/g, "")).map(x => x.indexOf("/") < 0 ? "assets/img/pres/" + x : x)));
const faltan = imgs.filter(x => !fs.existsSync(path.join(R, x)));
c(imgs.length > 15 && !faltan.length, "🔴 las " + imgs.length + " imágenes fijas de las escenas están en la web", faltan.join(", "));
c(/assets\/video\/' \+ esc\(p\[0\]\) \+ '_llegada\.mp4/.test(JS) && fs.existsSync(path.join(R, "assets/video/p1_forge_llegada.mp4")),
  "   y el mapa: al pulsar un planeta, la nave se posa en él (el clip de KIT_STARGATE)");

// ── 7 · y el guion está en la guía, no duplicado aquí
const GUIA = fs.readFileSync(path.join(R, "..", "GUIA_PROFES_PDF.md"), "utf8");
c(/# PARTE 0 · El guion de la reunión/.test(GUIA), "🔴 la guía del profesorado lleva su guion (Parte 0)");
c(/Presentar STARGATE al equipo/.test(GUIA), "   y dice dónde está la presentación montada");

console.log("\n  Batería 103 · la presentación para el equipo (20-sep)");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
