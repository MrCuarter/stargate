'use strict';
/**
 * BATERÍA 128 · STARGATE EN CLARO (4-oct)
 *
 * Del resumen del buzón del 4-oct: 6 de 10 mensajes eran de la misma referente, y todo lo que preguntó estaba en la web, pero
 * repartido y con el vocabulario de la ficción («no hables en chino mandaloriano… dímelo de forma ordenada»). Borrador en el lienzo
 * (página 4-oct) y Norberto eligió: página propia + el buzón la enseña, DOS versiones, la barra «Tu grupo» con sus datos y
 * «En claro» en el menú. Esto vigila que siga así y, sobre todo, que ninguna cifra se escriba a mano (el «29 insignias»).
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };

const H = L("en-claro.html"), B = L("_build_site.py"), JS = L("assets/js/en-claro.js"), BZ = L("assets/js/buzon.js"), BZH = L("buzon.html"),
      CSS = L("assets/css/stargate.css"), GUIA = L("guia.html"), DATOS = L("_site_data.py"), GS = L("apps-script/Datos.gs");
const texto = h => h.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const art = id => { const m = H.match(new RegExp('<article[^>]*id="' + id + '"[\\s\\S]*?</article>')); return m ? texto(m[0]) : ""; };

console.log("  La página y dónde se encuentra");
c(/escrito: en-claro\.html/.test(B) || /open\(os\.path\.join\(HERE, "en-claro\.html"\)/.test(B), "la escribe _build_site.py (no se edita a mano)");
c(/\("en-claro\.html","En claro","claro"\)\]/.test(B) && /<a class="lnk[^"]*" href="en-claro\.html">En claro<\/a>/.test(L("consola.html")), "«En claro» en el menú del profesorado (también en la consola)");
c(/href="en-claro\.html">STARGATE en claro<\/a>/.test(GUIA), "las preguntas frecuentes de la guía enlazan a la página (no se duplican)");
c(/<title>STARGATE en claro<\/title>/.test(H) && /classList\.add\("cerrado"\)/.test(H), "con su título y tras la puerta del profesorado, como la guía");
c(/assets\/js\/motor\.js/.test(H) && /motor\/semanas\.js/.test(H) && /assets\/js\/en-claro\.js\?v=[0-9a-f]{10}/.test(H), "   lleva el motor (tu grupo), las semanas y su JS con huella");

console.log("  Las preguntas: en orden, cada una con su ancla y su botón");
const ids = (H.match(/<article class="ec-qa card" id="([a-z-]+)"/g) || []).map(x => x.match(/id="([a-z-]+)"/)[1]);
const ANCLAS = ["mi-papel", "enlace-foro", "cuando-cuenta", "antes-de-clase", "en-clase", "no-suma", "a-mano", "cola-nota", "puntos", "subir-nota",
                "mercado", "insignias", "nota", "escribir", "bloquea", "captura", "crear-grupo", "equipo", "calendario", "academia-equipo", "baja", "cerrar-curso"];
c(ANCLAS.every(a => ids.indexOf(a) >= 0), "🔴 están todas las anclas que citan el buzón y la biblia (no se renombran)", ANCLAS.filter(a => ids.indexOf(a) < 0).join(", "));
c(new Set(ids).size === ids.length, "   ninguna ancla repetida");
const secs = (H.match(/<section class="ec-sec" id="s-([a-z]+)"/g) || []).map(x => x.match(/s-([a-z]+)/)[1]);
c(secs.join(",") === "antes,semana,gana,falla,grupo", "las secciones, en el orden del curso: antes, cada semana, lo que gana, si algo falla (+ tu grupo)", secs.join(","));
const indice = (H.match(/<nav class="ec-indice"[\s\S]*?<\/nav>/) || [""])[0];
c(ids.every(a => indice.indexOf('href="#' + a + '"') >= 0), "el índice de arriba lleva a cada respuesta");
const sinBoton = ids.filter(a => { const m = H.match(new RegExp('<article[^>]*id="' + a + '"[\\s\\S]*?</article>'))[0]; return !/class="btn[^"]*ec-btn"/.test(m); });
c(sinBoton.every(a => a === "mi-papel" || a === "mercado"), "cada respuesta con su botón (salvo la del papel, que lo dice la barra, y el Mercado, que es del alumnado)", sinBoton.join(", "));
c(ids.every(a => new RegExp('<article[^>]*id="' + a + '"[\\s\\S]*?class="ec-donde">[^<]+</span>').test(H)), "   y dónde está, con los nombres de la pantalla");

console.log("  Dos versiones");
c(/data-vista="doc"[^>]*>Para docentes<\/button><button[^>]*data-vista="ref"[^>]*>Para referentes/.test(H), "el interruptor «Para docentes / Para referentes»");
c(/\.ec\[data-vista="doc"\] \[data-solo="ref"\]\{display:none!important\}/.test(CSS), "   la de docentes esconde lo que solo hace el referente");
const ref = (H.match(/<article[^>]*data-solo="ref"/g) || []).length;
c(ref >= 5 && /<section class="ec-sec" id="s-grupo" data-solo="ref"/.test(H), "   la de referentes suma «Tu grupo y tu equipo» (" + ref + " preguntas)");
c(/leer\("sgEsReferente"\) === "1" \? "ref" : "doc"/.test(JS) && /q\.get\("vista"\) === "ref"/.test(JS) && /guardar\("sgClaroVista", v\)/.test(JS),
  "   arranca en la tuya, se recuerda y se puede forzar con ?vista=");
c(/getAttribute\("data-solo"\) === "ref" && raiz\.getAttribute\("data-vista"\) !== "ref"\) \{ vista\("ref"\)/.test(JS), "   🔴 un enlace a una respuesta de referentes abre su versión (el buzón enlaza sin pensar en quién lee)");

console.log("  La barra «Tu grupo», con tus datos");
c(/MOTOR\.misPERs\(yo\.correo\)/.test(JS) && /G\.soyReferente \? "Eres referente" : "Eres docente"/.test(JS), "tu grupo y tu papel en él, del servidor");
c(/W\.finDeSemana\(S\.inicio, total, S\.pausas\)/.test(JS) && /Los retos cuentan desde el/.test(JS), "   desde cuándo (y hasta cuándo) cuentan los retos, con el calendario del grupo");
c(/MOTOR\.invitacion\(G\)/.test(JS) && /data-ec-inv/.test(H), "   «Copiar la invitación», el mismo enlace que la consola");
c(/u\.searchParams\.set\("per", G\.id\)/.test(JS) && /href="consola\.html\?tab=alumnado" data-ec-per/.test(H), "   los botones abren la pantalla de TU grupo");

console.log("  🔴 Un dato, un sitio: ninguna cifra a mano");
const xp = id => Number((GS.match(new RegExp('\\["' + id + '","[^"]*",\\[[^\\]]*\\],(\\d+)')) || [])[1]);
const cred = k => Number((DATOS.match(new RegExp('"' + k + '": (\\d+)')) || [])[1]);
const P = art("puntos");
c(new RegExp("relámpago\\) " + xp("L1") + " " + cred("relampago") + " ").test(P) && new RegExp("principal\\) " + xp("B1") + " " + cred("retoB") + " ").test(P)
  && new RegExp("UNIR " + xp("X1") + " " + cred("actividad") + " ").test(P), "lo que da cada reto = Datos.gs (XP) y CREDITOS", P.slice(0, 200));
const ars = [...DATOS.matchAll(/\("([^"]+)", (\d+), (\d+),\s*\n(?:\s*"[^\n]*\n)*?[^\n]*, (\d+), "nota"\)/g)];
const SA = art("subir-nota");
c(ars.length === 4 && ars.every(m => SA.indexOf(m[1] + " " + m[2] + " " + m[3]) >= 0), "el Arsenal: sus cuatro opciones con su precio y su máximo, de RECOMPENSAS", ars.map(m => m[1] + " " + m[2]).join(" · "));
const semA = Number(DATOS.match(/SEMANA_ARSENAL = (\d+)/)[1]), minP = Number(DATOS.match(/NOTA_MIN_PLANETAS = (\d+)/)[1]);
c(SA.indexOf("semana " + semA) >= 0 && SA.indexOf(minP + " temas completos") >= 0, "   la semana en que abre y los temas que pide, del motor");
c(/<b>' \+ str\(|<b>\{_EC_INSIGNIAS\}<\/b>/.test(B) && /_EC_INSIGNIAS = N_INSIGNIAS_MISION \+ len\(SERIES_ALBUM\)/.test(B) && /^ 32 : 27 de la misión/.test(art("insignias").replace(/^.*?# /, " ")),
  "las insignias: 32 = las 27 de la misión + las 5 del álbum (las mismas cuentas de la guía)", art("insignias").slice(0, 120));
c(/_EC_CAPTURAS = int\(_re\.search\(r"MAX_ADJ = \(\\d\+\)", _EC_BZ\)/.test(B) && art("captura").indexOf("hasta " + BZ.match(/MAX_ADJ = (\d+)/)[1]) >= 0, "las capturas del buzón: las que deja buzon.js (MAX_ADJ)");
const nf = DATOS.match(/NOTA_FINAL = \{"continua": (\d+), "examen": (\d+)\}/);
c(art("nota").indexOf(nf[1] + " % evaluación continua y " + nf[2] + " % examen") >= 0, "la nota: la de NOTA_FINAL");

console.log("  Sin ficción, sin emojis, sin aire");
const T = texto((H.match(/<main id="ec"[\s\S]*?<\/main>/) || [""])[0].replace(/<p class="ec-trad">[\s\S]*?<\/p>/, ""));   // la página (el menú es de toda la web)
c(!/Claude/.test(H), "nada visible dice «Claude»");
c(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}]/u.test(H.replace(/◈|✓/g, "")), "sin emojis: iconos propios");
c(/<p class="ec-trad"><b>Si lees algo raro<\/b>/.test(H) && /<i>Mi nave<\/i> = tu panel/.test(H) && /<i>Nave del recluta<\/i> = lo que ve tu alumnado/.test(H), "el traductor: «Mi nave» = tu panel; la Nave del recluta, lo que ve tu alumnado");
c(!/Comandante|Vaeon|la Estática|Tripulación Cero/.test(T), "   y fuera del traductor, ni Comandante ni Vaeon ni la Estática");
c(/\.ec-qas\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\);gap:12px;align-items:start\}/.test(CSS), "regla del aire: rejilla de dos y la altura la marca el texto (align-items:start)");
c(/@media \(max-width:760px\)\{\.ec-qas\{grid-template-columns:minmax\(0,1fr\)\}/.test(CSS), "   en el móvil, una por fila");

console.log("  El buzón la enseña antes de escribir");
c(/window\.SG_CLARO=\[\["mi-papel"/.test(BZH) && /\["equipo", "Añadir a alguien al equipo", "Tu grupo y tu equipo", 1\]/.test(BZH), "la lista sale de la misma fuente que la página (SG_CLARO)");
c(/function enClaro\(\)/.test(BZ) && /href="en-claro\.html#' \+ esc\(x\[0\]\) \+ '" target="_blank"/.test(BZ), "   cada pregunta abre su respuesta aparte (lo escrito no se pierde)");
c(/return !x\[3\] \|\| ref;/.test(BZ), "   las de referentes, solo a quien lo es");
c(/"crear\.html", "en-claro\.html"\)/.test(B), "la página avisa de las respuestas del buzón, como el resto del panel");

console.log("\n  Batería 128 · STARGATE en claro");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
