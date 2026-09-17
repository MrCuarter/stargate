'use strict';
/**
 * BATERÍA 91 · LA TANDA DE FEEDBACK DEL 17-SEP (NOCHE), PRIMERA PARTE.
 *
 * Lo que Norberto pidió tras la prueba humana y ya está hecho en la web: el panel de Genially ya escrito, alias dobles,
 * el embed sin línea negra y con la sombra mínima, los retos en filas con la insignia grande, el menú de la Nave con
 * botones sólidos e iconos propios (y sin emojis), el código de inserción a un clic en la sesión, la transmisión con el
 * logo en vez del «crawl» y una sesión que crece con lo que se desbloquea.
 */
const fs = require("fs"), path = require("path");
const RAIZ = path.resolve(__dirname, "..");
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
const DATOS = leer("_site_data.py"), CREAR = leer("assets/js/crear.js"), CONSOLA = leer("assets/js/consola.js");
const ALIST = leer("assets/js/alistarse.js"), CSS = leer("assets/css/stargate.css"), NAVE = leer("assets/js/recluta.js"), SES = leer("assets/js/sesion.js");

// 1 · el panel de control de siempre, ya escrito
c(/PANEL_MAESTRO = "https:\/\/view\.genially\.com\/6a8bfc4f5068ad5903fc39e3"/.test(DATOS) &&
  /PANEL_MAESTRO_EDICION = "https:\/\/app\.genially\.com\/editor\/6a8bfc4f5068ad5903fc39e3"/.test(DATOS), "🔴 el panel de Genially de siempre (ver y editar), en un solo sitio");
c(/id="f-panel" value="' \+ esc\(window\.SG_PANEL_MAESTRO/.test(CREAR) && /id="f-paneled" value="' \+ esc\(window\.SG_PANEL_MAESTRO_EDICION/.test(CREAR),
  "   al crear un grupo, los dos ya van escritos");
c(/S\.panelVer \|\| window\.SG_PANEL_MAESTRO/.test(CONSOLA) && /P\.panelEdit \|\| window\.SG_PANEL_MAESTRO_EDICION/.test(CONSOLA), "   y en Ajustes, si el grupo no tiene otro");
c(/window\.SG_PANEL_MAESTRO_EDICION=/.test(leer("crear.html")) && /window\.SG_PANEL_MAESTRO_EDICION=/.test(leer("consola.html")), "   y las dos páginas lo reciben");

// 2 · alias dobles
c(/var doble = function \(\)/.test(ALIST) && /\(a \+ " " \+ b\)\.length > 24/.test(ALIST) && /n = doble\(\)/.test(ALIST), "🔴 el dado propone dos nombres combinados que caben en el campo");

// 3 · el embed, sin la línea de abajo y con la sombra mínima
c(/body\.embed section\{border-bottom:0\}/.test(CSS), "🔴 el embed sin la línea negra de abajo (el borde de la sección)");
c(/body\.embed\.embed-caja \.hv-caja\{box-shadow:0 1px 3px/.test(CSS), "   y la sombra de la caja, al mínimo");

// 4 · los retos en filas, la insignia grande
c(/\.rs-grid,\.rs-grid\.par\{grid-template-columns:1fr\}/.test(CSS) && /\.rs-trofeo img\{max-width:156px\}/.test(CSS), "🔴 los retos en filas, con la insignia más grande");

// 5 · el menú de la Nave: botones sólidos, iconos propios, sin emojis
["nave", "retos", "botin", "mercado", "zoco", "rankings", "envivo", "mas"].forEach(k =>
  c(fs.existsSync(path.join(RAIZ, "assets/img/nave/iconos", k + ".png")), "   icono «" + k + "» (Magnific, de una sola lámina)"));
c(/function iconoTab\(k\)/.test(NAVE) && /\+iconoTab\(x\[1\]\)\+'<b>'/.test(NAVE) && /aria-label="Más opciones" title="Más opciones">'\+iconoTab\('mas'\)/.test(NAVE),
  "🔴 las pestañas de la Nave llevan su icono (y el «···» también)");
c(!/\['nave','🛰️'/.test(NAVE) && /\.nb-t\{height:44px/.test(CSS) && /\.nb-t::after\{display:none\}/.test(CSS), "   botones sólidos, sin subrayado ni emojis");
const menu = NAVE.slice(NAVE.indexOf("function menuMas()"), NAVE.indexOf("function contenido()"));
c(!/[\u{1F300}-\u{1FAFF}]/u.test(menu), "   el menú «···», sin emojis");
c(!/<h3>[\u{1F300}-\u{1FAFF}]/u.test(NAVE), "   ningún título de la Nave empieza por un emoji");

// 6 · la sesión: el código de inserción a un clic
c(/data-copiar-ses="'\+x\[0\]\+'"/.test(SES) && /\[\['apertura','1 · Apertura'\],\['cierre','3 · Cierre'\],\['','La sesión entera'\]\]/.test(SES) && /codigoGenially\(ruta,tit\)/.test(SES),
  "🔴 en la página de la sesión, «Copiar código» de la apertura, el cierre y la sesión entera");

// 7 · la transmisión con el logo, no el crawl
c(/foro-crawl fc-v2/.test(SES) && /fc-marca">◈ STARGATE/.test(SES) && !/Hace muy poco/.test(SES), "🔴 el mensaje de la semana entra con el logo de STARGATE (sin imitar a Star Wars)");
c(fs.existsSync(path.join(RAIZ, "assets/img/nave/portal_stargate.jpg")) && /portal_stargate\.jpg/.test(CSS), "   con el portal de fondo");

// 8 · la sesión crece con lo desbloqueado
c(/yaRank=capituloEn\('c2', sem-1\)/.test(SES) && /yaColec=capituloEn\('c3', sem-1\)/.test(SES) && /yaOferta=capituloEn\('c10', sem\)/.test(SES) &&
  /sem>=2\?diaMovido\(\):null, yaRank\?diaSemanal\(\):null, yaRank\?diaTop\(\):null, yaColec\?diaColeccion\(s\):null/.test(SES),
  "🔴 semanas 1 y 2 sin ranking ni coleccionistas: la sesión crece con lo que se va abriendo");

// 9 · (tanda 2) el aula: lo que no se ha abierto no se regala, y lo que se regala le salta en su Nave
const AULA = leer("assets/js/aula.js"), MOTOR = leer("assets/js/motor.js");
c(/function semanaDeRegalo\(k\)/.test(AULA) && /\(x\.mercado \|\| \[\]\)\.indexOf\(pieza\)/.test(AULA) && /capitulosAbiertos/.test(AULA.slice(AULA.indexOf("function semanaDeRegalo"))),
  "🔴 aula · cada regalo mira la semana en que su pieza se abre en el Mercado (SG_CAPITULOS), y lo adelantado por el referente");
c(/\(cerr \? " cerrado" : ""\)/.test(AULA) && /Se desbloquea en la semana " \+ cerr/.test(AULA) && /au-sem">' \+ \(cerr === 99 \? "No en PUA" : "Semana " \+ cerr\)/.test(AULA),
  "   lo cerrado sale en sombra, sin poder pulsarse y con «Semana N» (o «No en PUA»)");
c(/\.au-pr\.cerrado,\.au-pr\.cerrado:disabled\{opacity:\.42;filter:grayscale/.test(CSS), "   y se ve en sombra");
c(/accion: "regalo", de: nombreDocente\(\), regalo: regalo/.test(AULA) && /avisar\(x\.ficha, \{ tipo: "puntos"/.test(AULA) && /avisar\(x\.ficha, \{ tipo: "participacion"/.test(AULA),
  "🔴 aula · al dar algo (puntos, piezas o participaciones), le deja el aviso a cada uno");
c(/if \(regalo\) sg\.regalo = \{/.test(MOTOR), "   con lo ganado dentro (motor.avisarRecluta)");
c(/function abrirRegalos\(L\)/.test(NAVE) && /SG\.SOBRE\.revelar\(piezas/.test(NAVE) && /M\.mensajeLeido\(x\.id\)/.test(NAVE) && /abrirRegalos\(todos\.filter/.test(NAVE),
  "🔴 Nave · el regalo se abre solo (sobre o cartel), en directo o al entrar, y queda como visto");

console.log("\n  Batería 91 · el feedback del 17-sep (noche), primera tanda");
console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
fallos.forEach(f => console.log("   ✗ " + f));
process.exit(fallos.length ? 1 : 0);
