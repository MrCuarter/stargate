'use strict';
/**
 * BATERÍA 86 · LA CONSOLA: LO DEL REFERENTE, LA FICHA Y LOS RANKINGS (16-sep-2026).
 *
 * Norberto, probando la consola: «el profe referente debe poder ver todos los grupos de todos los profesores para
 * revisar, solucionar problemas… Mejora la ficha del estudiante: querría ver las insignias (iluminadas las que tienen)
 * manteniendo la clasificación por temas. Lo que ha entregado tiene mucho aire. Añade la opción de cambiar de
 * comandante desde aquí. Si activo el modo docente no debo ver nada del referente: ahora mismo en modo docente puedo
 * ver la info de otros escuadrones. Falta una sección de rankings (visible para todos) con todos los rankings que
 * hemos ido hablando, de grupo completo o de escuadrón, y en el ranking total el icono de su escuadrón».
 */
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const RAIZ = path.resolve(__dirname, ".."), GP = "/Users/nor/Claude/vibewebs/gamificapro";
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
const K = leer("assets/js/consola.js"), T = leer("assets/js/tablero.js"), M = leer("assets/js/motor.js"),
      CSS = leer("assets/css/stargate.css"), HTML = leer("consola.html"), NAVE = leer("assets/js/recluta.js");

// 1 · el modo docente no ve lo de los demás
c(/if \(!soyRefAqui\(\)\) return tengoEsc \? mio : "";/.test(K),
  "🔴 en modo docente (o siendo docente raso), Mi gente enseña SOLO su escuadrón");
c(/var chips = ref && escs\.length > 1/.test(K), "   y los botones de «Todos» y de los demás escuadrones son solo del referente");
c(/ref && t\.sin_docente/.test(K), "   y el aviso de reclutas sin Comandante, también");
c(/function refDe\(p\) \{ return !!\(p && p\.soyReferente\) && !modoDoc\(\); \}/.test(K),
  "   (y ser referente se apaga con «Modo docente», como en el resto de la consola)");

// 2 · la ficha, por temas y con sus insignias
c(/function temasDeLaFicha\(r, retos\)/.test(K) && /temasDeLaFicha\(r, retos\)/.test(K.split("function verFicha")[1] || ""),
  "🔴 la ficha enseña retos e insignias POR TEMAS");
c(/class="fi-in' \+ \(on \? "" : " no"\)/.test(K) && /\.fi-in\.no\{filter:grayscale\(1\)/.test(CSS),
  "   con las insignias encendidas las ganadas y apagadas las que faltan");
c(/Hitos del viaje/.test(K) && /mi\.id !== "H1"/.test(K), "   las que no son de ningún tema, en «Hitos del viaje» (sin el botón del alistamiento)");
c(/data-reto="' \+ esc\(mi\.id\)/.test(K), "   y cada reto sigue siendo un botón para otorgar o anular");
c(/"\/" \+ NBADGES\(\)/.test(K) && !/\/24</.test(K), "   y el total de insignias sale del catálogo, no de un 24 escrito a mano");
c(/tt===1\?deIns\('R0_'\)/.test(NAVE), "   (y en la Nave la Bitácora en marcha cuenta en el tema 1)");

// 3 · lo entregado, sin aire
// (17-sep · y después, fuera: «esto ya se ve al pulsar el propio reto; bórralo, vamos a simplificar»)
c(!/<h4>Lo que ha entregado/.test(K) && !/function evidenciasDe/.test(K) && /data-rfquitar="' \+ esc\(id\)/.test(K),
  "🔴 sin «Lo que ha entregado»: el enlace, la reflexión y moderarla, pulsando el reto");

// 4 · cambiar de Comandante
c(/function cambioDeComandante\(r\)/.test(K) && /Solo el referente<\/h4>' \+ cambioDeComandante\(r\)/.test(K),
  "🔴 la ficha deja cambiar de Comandante (en el bloque del referente)");
c(/async function cambiarComandante\(perId, fichaId, aNombre\)/.test(M) &&
  /stargateProfe: aNombre, squadId: destino\.id, factionId: destino\.id/.test(M),
  "   y cambia Comandante y escuadrón de una vez, como el traspaso de un docente entero");
c(/ficha\.data\(\)\.projectId !== perId/.test(M), "   comprobando que la ficha es de ese grupo");
c(/cambiarComandante, avisarRecluta/.test(M), "   y el motor lo exporta");

// 5 · los rankings, para todos
c(/\["rankings", "Rankings"\]/.test(K) && !/\["rankings", "Rankings", 1\]/.test(K) && /\.pest\[data-tab="rankings"\]::before\{content:"";background-image:url\(\.\.\/img\/iconos\/p\/rankings\.png\)\}/.test(CSS),
  "🔴 la consola tiene pestaña de Rankings, y la ve también el docente (no es cosa del referente)");
c(/window\.SG_RANKING_MONTAR\(\$\("#c-rank"\), PER, \{ datos: t,/.test(K),
  "🔴 son LOS MISMOS rankings de la Nave (assets/js/tablero.js), montados con los datos que la consola ya tiene");
c(/window\.SG_RANKING_MONTAR = montar;/.test(T) && /if\(hueco\) montar\(hueco/.test(T), "   el módulo se monta solo en su página y a petición en la consola");
c(/tablero\.js/.test(HTML) && /window\.SG_BADGES=/.test(HTML) && /window\.SG_BATALLA=/.test(HTML), "   y la consola lo carga con sus datos");
c(/function chipsAmbito\(\)/.test(T) && /Todo el grupo/.test(T), "🔴 de todo el grupo o de un escuadrón");
c(/function embRow\(p\)/.test(T) && /class="rank-esc"/.test(T) && /embRow\(p\)\+SG\.avatarImg/.test(T),
  "🔴 y en el del grupo entero, cada fila lleva el emblema de su escuadrón");
const MODOS = (T.match(/\{k:'[a-z]+'/g) || []).map(x => x.slice(4, -1));
// 26-sep · seis (antes trece): ver la batería 58
["xp", "semana", "racha", "coleccion", "sabio", "escuadrones"]
  .forEach(k => c(MODOS.indexOf(k) >= 0, "   ranking «" + k + "»"));
c(/m\.asc\?valor\(a\)-valor\(b\)/.test(T), "   y en «el más rápido» gana el número más bajo");

// 6 · los mínimos del Simulador: un dato, un sitio (y el espejo de GamificaPro)
const MIN = JSON.parse(execFileSync("python3", ["-c", "import json,_site_data as D;print(json.dumps(D.BATALLA['medallas_min']))"], { cwd: RAIZ, encoding: "utf8" }));
const gp = fs.existsSync(path.join(GP, "functions/stargateBatalla.js")) ? fs.readFileSync(path.join(GP, "functions/stargateBatalla.js"), "utf8") : "";
const mg = gp.match(/MEDALLAS: \{ minAciertos: (\d+), minRespondidas: (\d+) \}/);
c(!!mg && Number(mg[1]) === MIN.aciertos && Number(mg[2]) === MIN.respondidas,
  "🔴 los mínimos de «rápido» y «certero» son los mismos que las medallas de la batalla", JSON.stringify(MIN));
c(!/\{k:'(certero|rapido)'/.test(T), "   (el más certero y el más rápido quedan como medallas de la batalla, no como rankings: 26-sep)");

// 7 · cada embed, en su ventana (16-sep · Norberto: «que puedan abrirse en una ventana emergente dedicada, que solo
//     aparezca ese contenido»). El laboratorio abrió las nueve y en todas la cabecera, el menú y el pie estaban ocultos.
c(/function abrirVentana\(ruta, clave\)/.test(K) && /u\.searchParams\.set\("embed", "1"\)/.test(K),
  "🔴 ⧉ abre la dirección del embed (con embed=1: sin cabecera, menú ni pie) en una ventana aparte");
c(/"popup=yes,width=/.test(K), "   una ventana emergente de verdad, sin las barras del navegador");
c(/"sg_" \+ String\(clave/.test(K), "   y siempre la misma para cada embed: pulsar dos veces no abre dos");
c(/bloqueado la ventana/.test(K), "   y si el navegador la bloquea, lo dice y explica cómo permitirla");
c(/hay && o\.ventana \? botonVentana\(o\.abrir, o\.ventana, o\.tit\)/.test(K), "   en cada fila de «Enlaces» (24-sep: una sola sección)");
// 20-sep · en el banner del grupo hay un solo paso: empezar la clase (la llamada y las herramientas están dentro)
c((K.match(/botonVentana\("sesion\.html\?per=" \+ PER/g) || []).length === 1, "   y en «Empezar la clase», el único paso del banner del grupo");
c(/"tablero_" \+ PER/.test(K) && /"sesion_" \+ PER/.test(K), "   y en Mis enlaces: el tablero para proyectar y la sesión");

// 8 · los enlaces del grupo y Mi gente (16-sep · Norberto: «necesito dos botones, copiar enlace o copiar </>; ahora
//     copia sesion.html?per=… y con eso no puedo meterlo al Genially. En Mi gente quiero ver el avatar»)
c(/function absoluta\(url\)/.test(K) && /data-copiar="' \+ esc\(absoluta\(o\.abrir\)\)/.test(K),
  "🔴 «🔗 Enlace» copia la dirección COMPLETA, no la relativa que no sirve fuera de la web");
c(/codigoGenially\(o\.codigo, "STARGATE · " \+ o\.tit\)/.test(K) && /&lt;\/&gt; Código/.test(K) && (K.slice(K.indexOf("function verMios"), K.indexOf("function mBloque")).match(/codigo: [^}]*\}/g) || []).every(x => /embed=1/.test(x)),
  "🔴 «</> Código» copia el código para insertar, siempre con embed=1 (sin cabecera ni menú)");
// 23-sep · el tablero ya no lleva código por grupo: su embed es el UNIVERSAL de «Para tus Geniallys» (Norberto: «el mismo
// enlace y embed para TODOS los grupos»). Aquí queda su enlace, para abrirlo, sin código.
// 24-sep · «Enlaces», una sola sección: cada fila abre ESTE grupo y su «</> Código» es el universal (sin ?per=)
c(/abrir: "sesion\.html\?per=" \+ P \+ "&tramo=apertura"/.test(K) && /codigo: "sesion\.html\?embed=1&tramo=apertura"/.test(K) &&
  /codigo: "sesion\.html\?embed=1&tramo=cierre"/.test(K) && /codigo: "sesion\.html\?embed=1" \}/.test(K),
  "🔴 la sesión, en sus tres apartados (inicio, cierre y completa): abrir en este grupo y el código universal");
c(/abrir: "registro\.html\?per=" \+ P \+ "&solo=1"/.test(K) && /embed: "tablero", codigo: "registro\.html\?solo=1&embed=1"/.test(K),
  "🔴 el tablero: abrir en este grupo y un solo código para todos los grupos (sin ?per=)");
c(/tit: "El padlet de la clase"[^\n]*edit: editPadlet/.test(K) && /MOTOR\.guardarAjustes\(PER, \{ "stargate\.padlet": v \}/.test(K),
  "🔴 el padlet de la clase se escribe aquí mismo (el referente)");
c(/"alistarse\.html\?per=" \+ P \+ "&codigo="/.test(K), "   y el alistamiento ya no sale «sin configurar»: se arma con el código del grupo");
c(/SG\.avatarImg\(r\.avatar, r\.alias, "gente-av"/.test(K) && /\.gente-tabla \.gente-quien \.av\.gente-av/.test(CSS),
  "🔴 Mi gente enseña el avatar que lleva puesto cada recluta");
c(!/td\.gente-quien\{display:flex/.test(CSS), "   sin romper la tabla (el flex va dentro de la celda, no en la celda)");

// 🔴 24-sep · LA PESTAÑA «RETOS». Norberto: «una pestaña de retos al lado de Reclutas… los no disponibles sombreados… al
// hacer clic, la info ampliada y los estudiantes que la han completado y sus enlaces». Y: «no pongas quién NO lo ha hecho,
// solo los que sí. Si son muchos, pon scroll. Me encanta la idea del enlace clicable».
const STG86 = leer("assets/js/stargate.js"), CONS86 = leer("consola.html");
c(/\["alumnado", "Reclutas"\], \["retos", "Retos"\]/.test(K) && /\["retos", "Retos", "assets\/img\/nave\/iconos\/retos\.png", \["retos"\]\]/.test(K) && /retos: verRetos/.test(K),
  "🔴 retos · la pestaña «Retos», al lado de Reclutas, en la barra del grupo");
c(/function verRetos\(t\)/.test(K) && /fichaReto\(r, tipo, w <= sem \? prog\(r\) : null, w > sem \? w : 0\)/.test(K),
  "   con las tarjetas de «Hoy toca»: las lanzadas con cuántos lo han hecho, las que vienen en sombra con su semana");
c(/data-rt="/.test(K) && /abrirReto\(r, t, gente, tipo, W\(r\), sem\)/.test(K) && /closest\("a"\)\) return;/.test(K),
  "   cada tarjeta se pulsa (y «Ver un ejemplo ↗» sigue yendo a lo suyo)");
c(/async function abrirReto\(/.test(K) && /window\.SG\.pasosReto\(\(window\.SG_AYUDA_RETOS \|\| \{\}\)\[id\]\)/.test(K) && /window\.SG_AYUDA_RETOS=/.test(CONS86),
  "🔴 retos · la ficha dice qué tienen que hacer, paso a paso: el mismo texto que lee el recluta");
c(/var hechos = gente\.filter\(function \(x\) \{ return \(x\.hechos \|\| \[\]\)\.indexOf\(id\) >= 0; \}\)/.test(K) && !/Aún no ·/.test(K),
  "🔴 retos · solo quien SÍ lo ha hecho (nada de lista de quién falta)");
c(/'<ul class="rt-lista">'/.test(K) && /\.rt-lista\{[^}]*max-height:[^}]*overflow-y:auto/.test(CSS),
  "   y si son muchos, la lista rueda por dentro");
c(/function enlacesDe\(entregado\)/.test(K) && /enlacesDe\(entregado\)/.test(K) && /target="_blank" rel="noopener noreferrer"/.test(K),
  "🔴 retos · cada enlace, pulsable (en otra pestaña)");
c(/EVFE\[e\.studentProfileId\]/.test(K) && /fe\(b\) - fe\(a\)/.test(K), "   el más reciente arriba (la fecha del registro)");
c(/\(o\.clase \? " " \+ o\.clase : ""\)/.test(STG86) && /clase: "sgp-ancha"/.test(K) && /\.sgp-caja\.sgp-ancha\{max-width:720px/.test(CSS),
  "   en la ventana de siempre, más ancha");
c(/var elige = soyRefAqui\(\) && mia\.length > 0 && mia\.length < todos\.length/.test(K), "   el referente con escuadrón elige: el suyo o todo el grupo");

// 🔴 25-sep · la tanda de Norberto con «Retos» en uso
c(/temas\.sort\(function \(a, b\) \{ return \(a \|\| 99\) - \(b \|\| 99\); \}\)/.test(K) && /\(k === temaHoy \? ' open' : ''\)/.test(K),
  "🔴 retos · en orden (Tema 1, Tema 2…), con el tema de ahora desplegado y los demás plegados");
c(!/esc\(x\.nombre\)/.test(K.slice(K.indexOf("async function abrirReto("), K.indexOf("function verSimulador("))),
  "🔴 retos · en la lista, sin el nombre real (se proyecta en clase)");
c(/data-rt-ficha="/.test(K) && /verFicha\(x, \{ texto: "Volver al reto " \+ id, fn: otraVez \}\)/.test(K) && /function verFicha\(r, volver\)/.test(K) && /data-fi-volver/.test(K),
  "   su cara y su alias llevan a su ficha, y la ficha lleva «‹ Volver al reto»");
c(/data-rt-anular="/.test(K) && /\(manual\(\) \? '<button type="button" class="btn min peligro rt-anular"/.test(K) && /rapidos: RAPIDOS_ANULAR/.test(K) && /await MOTOR\.anularReto\(PER, fid, id/.test(K),
  "🔴 retos · «Anular» en la lista (mando manual), con el aviso y los mensajes de siempre");
c(/function alDia\(\) \{ return Date\.now\(\) - LEIDO_EN < 30000; \}/.test(K) && /if \(alDia\(\)\) pintar\(\); else releerYPintar\(\);/.test(K) && /document\.addEventListener\("visibilitychange"/.test(K),
  "🔴 al día · la consola vuelve a leer el grupo al cambiar de sección o al volver a la pestaña (sin recargar la página)");
c(/localStorage\.getItem\("sgBzVistos"\)/.test(K) && /localStorage\.setItem\("sgBzVistos"/.test(leer("assets/js/buzon.js")),
  "   la burbuja de Contacto se apaga tras la primera visita (aunque el servidor no guarde el «visto»)");
c(/function atraconDe\(r\)/.test(K) && /Number\(window\.SG_AVISO_RETOS_DIA\) \|\| 6/.test(K) && /"Ojo: " \+ x\.r\.alias \+ " ha registrado "/.test(K) && /a: \["Ver su ficha", "ficha:" \+ x\.r\.ficha\]/.test(K)
  && /class="chip atracon"/.test(K) && /window\.SG_AVISO_RETOS_DIA=6/.test(HTML),
  "🔴 sin tope, con aviso: NEBULA avisa al docente si alguien registra 6 o más retos en un día (y su fila lo marca)");
c(/#nave-panel>\*\+\*\{margin-top:18px\}/.test(CSS) && /#c-cuerpo>\*\+\*\{margin-top:14px\}/.test(CSS), "   y todas las tarjetas, con su margen (Nave y consola)");

console.log("\n  Batería 86 · la consola: lo del referente, la ficha y los rankings");
console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
fallos.forEach(f => console.log("   ✗ " + f));
process.exit(fallos.length ? 1 : 0);
