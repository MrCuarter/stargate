'use strict';
/**
 * BATERÍA 111 · LA SESIÓN DE CADA ACTIVIDAD (26-sep)
 *
 * Norberto: «en la semana que toquen, quiero una sesión tanto para el estudiante como para el docente explicando la
 * actividad. Usa a NEBULA, el Capitán y el Comandante… Debe quedar muy claro… separarlas de los temas… que el estudiante la
 * pueda ver en diferido… una versión reducida e interactiva [de la rúbrica] para que sepan exactamente lo que necesitan para
 * tener un 10… imágenes que tengamos, ejemplos, relaciona con los retos, habla del portfolio, el enlace a la plantilla».
 *
 * Se leen los datos (con los pesos de las rúbricas oficiales, referencias/actividades_2026-27/) y el código; el recorrido
 * visual, en local y en el laboratorio.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };
const SES = L("assets/js/sesion.js"), NAVE = L("assets/js/recluta.js"), CON = L("assets/js/consola.js"), SH = L("sesion.html");
const global = (html, k) => { const i = html.indexOf("window." + k + "="); if (i < 0) return null;
  let j = i + k.length + 8, d = 0, s = false, q = ""; for (; j < html.length; j++) { const ch = html[j];
    if (s) { if (ch === "\\") { j++; continue; } if (ch === q) s = false; continue; }
    if (ch === '"' || ch === "'") { s = true; q = ch; continue; } if (ch === "{" || ch === "[") d++; if (ch === "}" || ch === "]") { d--; if (!d) break; } }
  return JSON.parse(html.slice(i + k.length + 8, j + 1)); };

// ── 1 · los datos, con las rúbricas oficiales
const SA = global(SH, "SG_SES_ACT") || {};
c(SA.a1 && SA.a2, "🔴 la sesión recibe el contenido de las dos actividades (SG_SES_ACT)");
const pesos = k => (SA[k].rubrica || []).map(r => r[1]);
c(JSON.stringify(pesos("a1")) === JSON.stringify([1.5, 2.5, 1.5, 1.5, 1, 1, 1]), "🔴 rúbrica de la 1: los siete criterios con los pesos de la oficial (suman 10)", pesos("a1"));
c(JSON.stringify(pesos("a2")) === JSON.stringify([1, 2, 3, 2, 1.5, 0.5]), "🔴 rúbrica de la 2: los seis criterios con los pesos de la oficial (suman 10)", pesos("a2"));
c(["a1", "a2"].every(k => SA[k].rubrica.every(r => r[3] && r[3].length > 30 && /^(PDF|ePortfolio)$/.test(r[2]))), "   cada criterio dice lo que pide el sobresaliente y si va en el PDF o en el ePortfolio");
c(["a1", "a2"].every(k => SA[k].pdf.length >= 4 && SA[k].portfolio.length >= 3 && SA[k].errores.length >= 5 && SA[k].mision[1].length > 80),
  "   la misión del Capitán, qué va en el PDF y en el ePortfolio, y lo que más se olvida");
const E1 = SA.a1.ejemplo, E2 = SA.a2.ejemplo;
c(E1.imagen === "L1.jpg" && E1.prompt.length === 5 && /iter|prompt/i.test(E1.iteracion) && E1.enunciado.length >= 3, "   la 1, con el ejemplo resuelto de Pilar: su imagen, el prompt por partes, la iteración y el enunciado");
c(SA.a1.tecnica.length === 6 && SA.a1.reflexiva.length === 5 && SA.a1.tareas.length >= 8, "   las seis filas de la tabla técnica, las cinco preguntas de la reflexiva y las ideas de tarea del enunciado");
const M = global(SH, "SG_MATRIZ") || {};
c((M.inteligencias || []).length === 8 && (M.bloom || []).length === 6 && /genially\.com/.test(M.plantilla || ""), "   la 2: la matriz de 8 inteligencias × 6 niveles de Bloom y su plantilla");
const cr = E2.cruces || [];
c(cr.length >= 6 && new Set(cr.map(x => x[1])).size === 6 && new Set(cr.map(x => x[2])).size >= 6 && cr.every(x => /^(obligatoria|optativa|voluntaria)$/.test(x[3])),
  "   con el huerto de Patricia: al menos seis cruces, los seis niveles de Bloom y su tipo (obligatoria, optativa, voluntaria)");
c(E2.imagen === "X2.jpg" && E2.ficha.length === 7 && E2.justificacion.length > 80, "   su paisaje, la ficha completa de una actividad y la justificación del ePortfolio");
const RP = global(SH, "SG_RETO_PREMIO") || {};
c(RP.X1 && RP.X1[0].length === 2 && RP.X1[1] === 500 && RP.X2 && RP.X2[0][0] === "H3_cartografo", "🔴 la sesión sabe qué insignias y xp da cada reto (antes la de la actividad no salía)");

// ── 2 · la sesión
c(/function construirActividad\(n\)/.test(SES) && /st\.slides=st\.act\?construirActividad\(st\.act\):/.test(SES) && /st\.act=Number\(q\.get\('act'\)\)\|\|0;/.test(SES),
  "🔴 es su propia sesión: sesion.html?act=1 / ?act=2");
const CAP = global(SH, "SG_CAPTURAS") || {};
c((CAP.atajos || []).map(x => x[0]).join() === "Mac,Windows,Chromebook" && CAP.atajos.every(x => x[1].length >= 2) && /única prueba/.test((CAP.por_que || []).join(" ")) && /restringido o privado/.test((CAP.por_que || []).join(" ")),
  "🔴 las capturas, obligatorias: la única prueba de haberlo hecho a tiempo y la salvación si un enlace sale privado; con los atajos de Mac, Windows y Chromebook");
c(/diaActPortfolio\(X\), diaActCapturas\(X\), diaActErrores\(X\)/.test(SES) && /<kbd>/.test(SES), "   su diapositiva, detrás del ePortfolio, con las teclas dibujadas");
const piezas = ["diaActPortada", "diaActMision", "diaActEntrega", "diaActPlan", "diaActImagen", "diaActTecnica", "diaActReflexiva", "diaActEnunciado",
  "diaActContexto", "diaActMatriz", "diaActFicha", "diaActPaisaje", "diaActIA", "diaActRetos", "diaActPortfolio", "diaActErrores", "diaActRubrica", "diaActCalendario", "diaActCierre"];
c(piezas.every(p => new RegExp("function " + p + "\\(X\\)").test(SES)), "   con todas sus diapositivas", piezas.filter(p => !new RegExp("function " + p + "\\(X\\)").test(SES)));
c(/capitan\('senala'\)/.test(SES) && /capitan\('tablet', 'ac-cap-d'\)/.test(SES) && /cmdCuerpo\('reto','ac-cmd'\)/.test(SES) && /nebulaDice\(/.test(SES) && /class="ac-neb-g" src="assets\/img\/personajes\/nebula\.png"/.test(SES),
  "🔴 el Capitán (la misión y las fechas), NEBULA (el ejemplo, el ePortfolio y lo que se olvida) y el Comandante (la rúbrica y el cierre)");
c(/function montarRubrica\(el\)/.test(SES) && /localStorage\.setItem\(clave, JSON\.stringify\(h\)\)/.test(SES) && /'¡todo listo para el 10!'/.test(SES),
  "🔴 la rúbrica, interactiva: se marca lo que se tiene y suma hasta el 10 (y se recuerda)");
c(/function montarMatriz\(el\)/.test(SES) && /function montarPestanas\(el\)/.test(SES), "   la matriz se pulsa cruce a cruce y la tabla técnica, fila a fila");
c(/Plantilla del ePortfolio ↗/.test(SES) && /La plantilla del ePortfolio ↗/.test(SES) && /Plantilla de la matriz ↗/.test(SES) && /¿Mi enlace abre lo mío\? ↗/.test(SES),
  "   la plantilla del ePortfolio (y la de la matriz), a mano, y «¿Mi enlace abre lo mío?»");
c(/function misHechos\(\)/.test(SES) && /Llevas <b>'\+n\+' de '/.test(SES), "   los retos relacionados, con los que ya tiene el recluta marcados");
c(/function premioDe\(id\)/.test(SES) && /t=\[a\.reto, '', premioDe\(a\.reto\)\[0\], premioDe\(a\.reto\)\[1\]\]/.test(SES), "   la insignia en grande, del catálogo");
c(/if\(st\.act&&st\.alumno\)\{ var aA=actN\(st\.act\); if\(!aA\|\|Number\(aA\.sem\)>Number\(st\.semHoy\)\) st\.act=0; \}/.test(SES),
  "🔴 el recluta la ve desde la semana en que se lanza, nunca antes");
c(/data-act="'\+a\.n\+'"/.test(SES) && /data-dif-act="'\+a\.n\+'"/.test(SES) && /data-ir-act="'\+a\.n\+'"/.test(SES),
  "   el docente, en la tira (A1, A2); el diferido, en su índice; y la semana que la lanza, con un botón a ella");
c(/act:st\.act\|\|0/.test(SES) && /\['act1','La Actividad 1'\],\['act2','La Actividad 2'\]/.test(SES), "   en directo se sigue, y tiene su código para el Genially");

// ── 3 · a mano, para el docente y el recluta
c(/tit: "La Actividad " \+ a\.n/.test(CON) && /codigo: "sesion\.html\?embed=1&act=" \+ a\.n/.test(CON), "🔴 el docente, en Enlaces (con su código)");
c(/function urlActividad\(n\)/.test(NAVE) && /function actividadAbierta\(a\)/.test(NAVE) && /class="card ar-pres ar-act"/.test(NAVE), "🔴 el recluta, en El Archivo y en el menú «···», desde su semana");
c(/La sesión de la actividad ↗<\/a>/.test(NAVE) && /esc\(urlActividad\(a\.n\)\)\+'" target="_blank" rel="noopener">La sesión de la actividad ↗/.test(NAVE),
  "   y desde la tarjeta de la entrega y la de la actividad en Mis retos");

console.log("\n  Batería 111 · la sesión de cada actividad");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
