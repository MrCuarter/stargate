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
c(/\.evid-lista li\{gap:8px;padding:5px 10px/.test(CSS) && /\.evid-lista a\{white-space:nowrap;overflow:hidden;text-overflow:ellipsis/.test(CSS),
  "🔴 «Lo que ha entregado» va en una línea por reto, con el enlace recortado");

// 4 · cambiar de Comandante
c(/function cambioDeComandante\(r\)/.test(K) && /Solo el referente<\/h4>' \+ cambioDeComandante\(r\)/.test(K),
  "🔴 la ficha deja cambiar de Comandante (en el bloque del referente)");
c(/async function cambiarComandante\(perId, fichaId, aNombre\)/.test(M) &&
  /stargateProfe: aNombre, squadId: destino\.id, factionId: destino\.id/.test(M),
  "   y cambia Comandante y escuadrón de una vez, como el traspaso de un docente entero");
c(/ficha\.data\(\)\.projectId !== perId/.test(M), "   comprobando que la ficha es de ese grupo");
c(/cambiarComandante, resolverVale/.test(M), "   y el motor lo exporta");

// 5 · los rankings, para todos
c(/\["rankings", "🏆 Rankings"\]/.test(K) && !/\["rankings", "🏆 Rankings", 1\]/.test(K),
  "🔴 la consola tiene pestaña de Rankings, y la ve también el docente (no es cosa del referente)");
c(/window\.SG_RANKING_MONTAR\(\$\("#c-rank"\), PER, \{ datos: t,/.test(K),
  "🔴 son LOS MISMOS rankings de la Nave (assets/js/tablero.js), montados con los datos que la consola ya tiene");
c(/window\.SG_RANKING_MONTAR = montar;/.test(T) && /if\(hueco\) montar\(hueco/.test(T), "   el módulo se monta solo en su página y a petición en la consola");
c(/tablero\.js/.test(HTML) && /window\.SG_BADGES=/.test(HTML) && /window\.SG_BATALLA=/.test(HTML), "   y la consola lo carga con sus datos");
c(/function chipsAmbito\(\)/.test(T) && /Todo el grupo/.test(T), "🔴 de todo el grupo o de un escuadrón");
c(/function embRow\(p\)/.test(T) && /class="rank-esc"/.test(T) && /embRow\(p\)\+SG\.avatarImg/.test(T),
  "🔴 y en el del grupo entero, cada fila lleva el emblema de su escuadrón");
const MODOS = (T.match(/\{k:'[a-z]+'/g) || []).map(x => x.slice(4, -1));
["xp", "semana", "coleccion", "escuadron", "racha", "insignias", "planetas", "relampago", "logros", "sabio", "certero", "rapido", "escuadrones"]
  .forEach(k => c(MODOS.indexOf(k) >= 0, "   ranking «" + k + "»"));
c(/m\.asc\?valor\(a\)-valor\(b\)/.test(T), "   y en «el más rápido» gana el número más bajo");

// 6 · los mínimos del Simulador: un dato, un sitio (y el espejo de GamificaPro)
const MIN = JSON.parse(execFileSync("python3", ["-c", "import json,_site_data as D;print(json.dumps(D.BATALLA['medallas_min']))"], { cwd: RAIZ, encoding: "utf8" }));
const gp = fs.existsSync(path.join(GP, "functions/stargateBatalla.js")) ? fs.readFileSync(path.join(GP, "functions/stargateBatalla.js"), "utf8") : "";
const mg = gp.match(/MEDALLAS: \{ minAciertos: (\d+), minRespondidas: (\d+) \}/);
c(!!mg && Number(mg[1]) === MIN.aciertos && Number(mg[2]) === MIN.respondidas,
  "🔴 los mínimos de «rápido» y «certero» son los mismos que las medallas de la batalla", JSON.stringify(MIN));
c(/MIN=BAT\.medallas_min/.test(T), "   y el ranking los lee de ahí, no de un número suelto");

// 7 · cada embed, en su ventana (16-sep · Norberto: «que puedan abrirse en una ventana emergente dedicada, que solo
//     aparezca ese contenido»). El laboratorio abrió las nueve y en todas la cabecera, el menú y el pie estaban ocultos.
c(/function abrirVentana\(ruta, clave\)/.test(K) && /u\.searchParams\.set\("embed", "1"\)/.test(K),
  "🔴 ⧉ abre la dirección del embed (con embed=1: sin cabecera, menú ni pie) en una ventana aparte");
c(/"popup=yes,width=/.test(K), "   una ventana emergente de verdad, sin las barras del navegador");
c(/"sg_" \+ String\(clave/.test(K), "   y siempre la misma para cada embed: pulsar dos veces no abre dos");
c(/bloqueado la ventana/.test(K), "   y si el navegador la bloquea, lo dice y explica cómo permitirla");
c(/botonVentana\(x\[2\], x\[0\]/.test(K), "   en los seis códigos de «Para tus Geniallys»");
c((K.match(/botonVentana\("(sesion|aula|llamada)\.html\?per=" \+ p\.id/g) || []).length === 3, "   en las tres acciones de clase de cada grupo (con su grupo)");
c(/"tablero_" \+ PER/.test(K) && /"sesion_" \+ PER/.test(K), "   y en Mis enlaces: el tablero para proyectar y la sesión");

console.log("\n  Batería 86 · la consola: lo del referente, la ficha y los rankings");
console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
fallos.forEach(f => console.log("   ✗ " + f));
process.exit(fallos.length ? 1 : 0);
