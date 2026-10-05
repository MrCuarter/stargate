'use strict';
/**
 * BATERÍA 128 · STARGATE EN CLARO (4-oct)
 *
 * Del resumen del buzón del 4-oct: 6 de 10 mensajes eran de la misma referente, y todo lo que preguntó estaba en la web, pero
 * repartido y con el vocabulario de la ficción («no hables en chino mandaloriano… dímelo de forma ordenada»). 2.ª vuelta, Norberto:
 * «simplifica mucho más la parte de docentes; no hagas referencia a referentes; si un docente no es referente, que ni vea la
 * opción… un punto de partida, más visual, tarjetas de igual tamaño, que se pueda ampliar» y «usa las palabras oficiales del
 * máster (temas, sesiones, retos, portfolio…); el idioma STARGATE, entre paréntesis». Y ninguna cifra a mano (el «29 insignias»).
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };

const H = L("en-claro.html"), B = L("_build_site.py"), JS = L("assets/js/en-claro.js"), BZ = L("assets/js/buzon.js"), BZH = L("buzon.html"),
      CSS = L("assets/css/stargate.css"), GUIA = L("guia.html"), DATOS = L("_site_data.py"), GS = L("apps-script/Datos.gs");
const texto = h => h.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const MAIN = (H.match(/<main id="ec"[\s\S]*?<\/main>/) || [""])[0];
const duda = id => { const m = H.match(new RegExp('<details class="ec-duda" id="' + id + '"[\\s\\S]*?</details>')); return m ? texto(m[0]) : ""; };

console.log("  La página y dónde se encuentra");
c(/open\(os\.path\.join\(HERE, "en-claro\.html"\)/.test(B), "la escribe _build_site.py (no se edita a mano)");
c(/\("en-claro\.html","En claro","claro"\)\]/.test(B) && /<a class="lnk[^"]*" href="en-claro\.html">En claro<\/a>/.test(L("consola.html")), "«En claro» en el menú del profesorado (también en la consola)");
c(/href="en-claro\.html">STARGATE en claro<\/a>/.test(GUIA), "las preguntas frecuentes de la guía enlazan a la página");
c(/<title>STARGATE en claro<\/title>/.test(H) && /classList\.add\("cerrado"\)/.test(H), "con su título y tras la puerta del profesorado, como la guía");
c(/assets\/js\/motor\.js/.test(H) && /motor\/semanas\.js/.test(H) && /assets\/js\/en-claro\.js\?v=[0-9a-f]{10}/.test(H), "   lleva el motor (su grupo), las semanas y su JS con huella");

console.log("  🔴 Para un docente, ni rastro de los referentes");
const DOC = texto(MAIN.replace(/<section class="ec-sec" id="s-grupo" data-solo="ref">[\s\S]*?<\/section>/, "").replace(/<div class="ec-vista"[\s\S]*?<\/div>/, ""));
c(!/referente/i.test(DOC), "la parte de docentes no nombra a los referentes", (DOC.match(/.{50}referente.{20}/i) || [""])[0]);
c(/<div class="ec-vista" role="group"[^>]*hidden>/.test(H), "el interruptor «Docentes / Referentes» nace oculto");
c(/function soyReferente\(\) \{\s*REF = true; if \(botones\) botones\.hidden = false;/.test(JS) && /if \(!REF\) v = "doc";/.test(JS), "   solo se enciende si la cuenta es referente; sin serlo, siempre la de docentes (también con ?vista=ref)");
c(/if \(el\.getAttribute\("data-solo"\) === "ref"\) \{ if \(!REF\) return;/.test(JS), "   un enlace a una duda de referentes no le abre nada a un docente");
c(/else if \(!ref && REF\) \{ REF = false; if \(botones\) botones\.hidden = true; vista\("doc"\); \}/.test(JS), "   si la marca del navegador era de otra cuenta, se apaga al saber quién eres");
c(/\.ec\[data-vista="doc"\] \[data-solo="ref"\]\{display:none!important\}/.test(CSS) && /<section class="ec-sec" id="s-grupo" data-solo="ref">/.test(H), "lo de referentes, en su sección y escondido en la vista de docentes");
c(/assert not any\(_re\.search\(r"referente"/.test(B), "   y el build no deja escribir «referente» en una duda de docentes");

console.log("  Un punto de partida visual: tres pasos, el temario, lo que ganan");
const pasos = H.match(/<article class="ec-paso card"><img class="ec-paso-img" src="assets\/img\/sesion\/[a-z]+\.jpg"/g) || [];
c(pasos.length === 3, "«Tu semana, en tres pasos», cada uno con una captura real de la sesión", pasos.length);
c(/data-ec-inv/.test(H) && /href="sesion\.html" data-ec-per/.test(H) && /href="consola\.html\?tab=alumnado" data-ec-per/.test(H), "   con su botón: copiar la invitación, empezar la clase, ver a tus estudiantes");
const temas = H.match(/<article class="ec-tema"><img src="assets\/img\/fondos\/p\d_[a-z]+\.webp"/g) || [];
c(temas.length === 8, "el temario: 8 tarjetas, una por tema, con la imagen de su planeta", temas.length);
const TEMARIO = [...DATOS.matchAll(/^\s+(\d): \("([^"]+)",/gm)].map(m => m[2]);
c(TEMARIO.length === 8 && TEMARIO.every(t => H.indexOf("<h3>" + t + "</h3>") >= 0), "   cada tema con su título oficial (TEMARIO)");
const nombreReto = id => (GS.match(new RegExp('\\["' + id + '","[^"«]*«([^»]+)»')) || [])[1];
c([1, 2, 3, 4, 5, 6, 7, 8].every(n => H.indexOf("<b>En clase</b> " + nombreReto("L" + n) + "<") >= 0 && H.indexOf("<b>En casa</b> " + nombreReto("B" + n) + "<") >= 0),
  "   y sus dos retos, en clase y en casa, con su nombre de Datos.gs");
c(/<span class="ec-tema-n">Tema 4 · semana 7<\/span>/.test(H), "   la semana en que empieza cada tema, del CRONO (tema 4, semana 7)");
c((H.match(/<a class="ec-gana card" href="#[a-z-]+">/g) || []).length === 4, "cuatro fichas de lo que ganan, y cada una abre su duda");

console.log("  Palabras del máster; las de STARGATE, entre paréntesis");
c(/\(planeta Fôrge\)/.test(H) && /Estudiantes \(Reclutas\)/.test(H) && /Tu panel \(Mi nave\)/.test(H) && /En clase \(relámpago\)/.test(H), "tema (planeta), estudiantes (Reclutas), tu panel (Mi nave), reto en clase (relámpago)");
c(/<b>Bitácora<\/b><span>el portfolio<\/span>/.test(H) && /<b>Arsenal<\/b><span>las subidas de nota<\/span>/.test(H), "«Lo que verás en pantalla»: las palabras de la historia, en llano");
c(!/Comandante|Vaeon|la Estática|Tripulación Cero/.test(texto(MAIN.replace(/<section class="ec-sec" id="s-palabras">[\s\S]*?<\/section>/, ""))),
  "   fuera de eso, ni Comandante ni Vaeon ni la Estática");

console.log("  Simétrico y sin aire");
c(/\.ec-pasos\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/.test(CSS) && /\.ec-temas\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/.test(CSS)
  && /\.ec-ganas\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/.test(CSS), "rejillas de columnas iguales: 3 pasos, 4×2 temas, 4 fichas");
c(/\.ec-sec\{[^}]*padding:0;/.test(CSS), "   sin el relleno de 54 px de las secciones de la web (los pasos caben en 1280×551)");
const lp = ((B.match(/EC_PASOS = \[[\s\S]*?\n\]/) || [""])[0].match(/^ \("[^"]+", "[^"]+"/gm) || []).map(x => x.split('", "')[1].length);
c(lp.length === 3 && Math.max(...lp) - Math.min(...lp) < 25, "   los textos de los tres pasos, de largo parecido (las tarjetas miden lo mismo)", lp.join(","));
c(/\.ec-duda>summary/.test(CSS) && (H.match(/<details class="ec-duda"/g) || []).length >= 15, "las dudas, plegadas: se abren si quieren más");
c(/el\.open = true; el\.classList\.add\("foco"\)/.test(JS), "   un #ancla (del buzón o la biblia) abre la suya");

console.log("  Las dudas: cada una con su ancla y su botón");
const ids = (H.match(/<details class="ec-duda" id="([a-z-]+)"/g) || []).map(x => x.match(/id="([a-z-]+)"/)[1]);
const ANCLAS = ["mi-papel", "enlace-foro", "cuando-cuenta", "antes-de-clase", "en-clase", "no-suma", "a-mano", "cola-nota", "puntos", "subir-nota",
                "mercado", "insignias", "nota", "escribir", "bloquea", "captura", "crear-grupo", "equipo", "calendario", "academia-equipo", "baja", "cerrar-curso"];
c(ANCLAS.every(a => ids.indexOf(a) >= 0), "🔴 están todas las anclas que citan el buzón y la biblia (no se renombran)", ANCLAS.filter(a => ids.indexOf(a) < 0).join(", "));
c(new Set(ids).size === ids.length, "   ninguna repetida");
c(ids.every(a => a === "mercado" || /class="btn[^"]*ec-btn"/.test((H.match(new RegExp('<details class="ec-duda" id="' + a + '"[\\s\\S]*?</details>')) || [""])[0])), "   cada una con su botón (salvo la tienda, que es de sus estudiantes)");

console.log("  🔴 Un dato, un sitio: ninguna cifra a mano");
const xp = id => Number((GS.match(new RegExp('\\["' + id + '","[^"]*",\\[[^\\]]*\\],(\\d+)')) || [])[1]);
const cred = k => Number((DATOS.match(new RegExp('"' + k + '": (\\d+)')) || [])[1]);
const P = duda("puntos");
c(new RegExp("relámpago\\) " + xp("L1") + " " + cred("relampago") + " ").test(P) && new RegExp("principal\\) " + xp("B1") + " " + cred("retoB") + " ").test(P)
  && new RegExp("entregada " + xp("X1") + " " + cred("actividad") + " ").test(P), "lo que da cada reto = Datos.gs (XP) y CREDITOS", P.slice(0, 200));
const ars = [...DATOS.matchAll(/\("([^"]+)", (\d+), (\d+),\s*\n(?:\s*"[^\n]*\n)*?[^\n]*, (\d+), "nota"\)/g)];
const SA = duda("subir-nota");
c(ars.length === 4 && ars.every(m => SA.indexOf(m[1] + " " + m[2] + " " + m[3]) >= 0), "las subidas de nota: sus cuatro opciones con su precio y su máximo (RECOMPENSAS)");
const semA = Number(DATOS.match(/SEMANA_ARSENAL = (\d+)/)[1]), minP = Number(DATOS.match(/NOTA_MIN_PLANETAS = (\d+)/)[1]);
c(SA.indexOf("semana " + semA) >= 0 && SA.indexOf(minP + " temas completos") >= 0, "   la semana en que abren y los temas que piden, del motor");
c(/_EC_INSIGNIAS = N_INSIGNIAS_MISION \+ len\(SERIES_ALBUM\)/.test(B) && / 32 : 27 del curso/.test(duda("insignias")) && /<b class="ec-gana-g">32<\/b>/.test(H),
  "las insignias: 32 = las 27 del curso + las 5 de las colecciones (las cuentas de la guía)", duda("insignias").slice(0, 120));
c(/_EC_CAPTURAS = int\(_re\.search\(r"MAX_ADJ = \(\\d\+\)", _EC_BZ\)/.test(B) && duda("captura").indexOf("hasta " + BZ.match(/MAX_ADJ = (\d+)/)[1]) >= 0, "las capturas del buzón: las que deja buzon.js (MAX_ADJ)");
const nf = DATOS.match(/NOTA_FINAL = \{"continua": (\d+), "examen": (\d+)\}/);
c(duda("nota").indexOf(nf[1] + " % evaluación continua y " + nf[2] + " % examen") >= 0 && H.indexOf('<b class="ec-gana-g">' + nf[1] + ' %</b>') >= 0, "la nota: la de NOTA_FINAL");

console.log("  ¿El portfolio es obligatorio? (5-oct, Adriana)");
const pts = [...DATOS.matchAll(/puntos="(\d+,\d+)"/g)].map(m => Number(m[1].replace(",", "."))).slice(0, 2);
const ep = pts.map(x => x * 0.2), cont = ep[0] + ep[1], fin = cont * Number(nf[1]) / 100, es = x => x.toFixed(2).replace(".", ",");
const PF = duda("portfolio"), NF = L("assets/js/nebula-faq.js");
c(/ePortfolio \(20%\)/.test(DATOS) && PF.indexOf("hasta " + es(cont) + " puntos") >= 0 && PF.indexOf(es(fin) + " de la nota final") >= 0,
  "la respuesta al docente: 20 % de cada actividad → " + es(cont) + " de la continua, " + es(fin) + " de la final (de las rúbricas)", PF.slice(0, 160));
c(/id: "bitacora_obligatoria"/.test(NF) && NF.indexOf(es(ep[0]) + " puntos en cada una") >= 0 && NF.indexOf(es(cont) + " de 10") >= 0 && NF.indexOf(es(fin) + " de la nota final") >= 0,
  "   y NEBULA le dice lo mismo al estudiante (mismas cifras)");

console.log("  Sin emojis, sin «Claude»");
c(!/Claude/.test(H), "nada visible dice «Claude»");
c(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}]/u.test(H.replace(/◈|✓/g, "")), "sin emojis: iconos propios");

console.log("  El buzón la enseña antes de escribir");
c(/window\.SG_CLARO=\[\["enlace-foro"/.test(BZH) && /\["mi-papel", "¿Referente o docente\?", "Solo para referentes", 1\]/.test(BZH), "la lista sale de la misma fuente que la página (SG_CLARO)");
c(/function enClaro\(\)/.test(BZ) && /href="en-claro\.html#' \+ esc\(x\[0\]\) \+ '" target="_blank"/.test(BZ), "   cada pregunta abre su respuesta aparte (lo escrito no se pierde)");
c(/return !x\[3\] \|\| ref;/.test(BZ), "   las de referentes, solo a quien lo es");
c(/"crear\.html", "en-claro\.html"\)/.test(B), "la página avisa de las respuestas del buzón, como el resto del panel");

console.log("\n  Batería 128 · STARGATE en claro");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
