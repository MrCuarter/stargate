'use strict';
/**
 * BATERÍA 79 · LOS LOGROS DE A BORDO Y EL CONTRAMAESTRE (15-sep-2026, noche).
 *
 * Norberto: «un tipo de insignia, reconocimiento o premio a medida que vayan usando la plataforma», «un avatar y una
 * carta personalizada, especial, legendaria, que se consigue solo al completar todos», «días consecutivos… y varias
 * recompensas por conjuntos de hitos» y «organiza lo que desbloqueamos cada semana para no saturar».
 * Esto comprueba el reparto sin emulador: que la web y el servidor (GamificaPro) digan LO MISMO —las claves, las
 * cubiertas, los premios, los héroes y la semana—, que las imágenes estén, que la Nave, la consola y el simulacro lo
 * enseñen y que el Contramaestre no se cuele ni en las cápsulas ni en el Zoco. El laboratorio (sección 38) lo pisa de
 * verdad y GamificaPro tiene sus pruebas (tests/functions/stargate-hitos.test.ts y tests/rules/stargate-hitos.test.ts).
 */
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process"), { pathToFileURL } = require("url");
const RAIZ = path.resolve(__dirname, ".."), GP = "/Users/nor/Claude/vibewebs/gamificapro/functions";
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
const N = leer("assets/js/recluta.js"), F = leer("assets/js/fuente.js"), M = leer("assets/js/motor.js"), K = leer("assets/js/consola.js"),
      CSS = leer("assets/css/stargate.css"), TB = leer("motor/tablero.js");

(async () => {
  // 1 · los datos (un dato, un sitio: _site_data.py)
  const D = JSON.parse(execFileSync("python3", ["-c",
    "import json,_site_data as D;print(json.dumps({'H':D.HITOS_A_BORDO,'C':D.CUBIERTAS_A_BORDO,'HB':D.HEROES_A_BORDO,'CA':D.CARTA_A_BORDO," +
    "'HE':[h[0] for h in D.HEROES],'caps':[{k:c[k] for k in ('n','clave','semana','semanas','abre','imagen')} for c in D.CAPITULOS]}))"], { cwd: RAIZ, encoding: "utf8" }));
  const claves = D.H.map(h => h[0]), cubs = D.C.map(x => x[0]);
  c(claves.length === 16 && new Set(claves).size === 16, "🔴 16 logros de a bordo, sin claves repetidas", claves.join(","));
  c(JSON.stringify(cubs) === JSON.stringify(["puente", "mercado", "camarote", "zoco", "constancia"]), "   en 5 cubiertas: el puente, el Mercado, el camarote, el Zoco y la constancia", cubs.join(","));
  c(D.H.every(h => cubs.indexOf(h[1]) >= 0 && h[2] && h[3] && /\.$/.test(h[4])), "   cada logro con su cubierta, su icono, su título y qué hay que hacer");
  c(D.C.every(x => /^(sobre|capsula|creditos)$/.test(x[3].tipo) && (x[3].tipo !== "creditos" || x[3].n > 0)), "   cada cubierta con su premio (un sobre, una cápsula o créditos)");
  c(D.HB.length === 2 && D.HB.every(h => h[2] === "LEGENDARIA" && h[3] === 0) && D.HB.every(h => D.HE.indexOf(h[0]) < 0),
    "🔴 el Contramaestre (él y ella) es legendario y NO está en HEROES (lo que sale en las cápsulas)");
  c(D.HB.every(h => ["", "_bloqueado"].every(s => fs.existsSync(path.join(RAIZ, "assets/img/heroes", h[0] + s + ".jpg")))),
    "   con su retrato y su sombra");
  c(fs.existsSync(path.join(RAIZ, "assets/img/tarjetas", D.CA[0] + "_carta.png")), "   y su carta legendaria (con el hueco del nombre para el alias)");

  // 2 · el servidor dice lo mismo (GamificaPro, functions/stargateABordo.js)
  let S = null;
  try { S = await import(pathToFileURL(path.join(GP, "stargateABordo.js")).href); } catch (e) { S = null; }
  c(!!S, "🔴 existe el catálogo del servidor (gamificapro/functions/stargateABordo.js)");
  if (S) {
    c(JSON.stringify(Object.keys(S.HITOS).sort()) === JSON.stringify(claves.slice().sort()) && D.H.every(h => S.HITOS[h[0]] === h[1]),
      "🔴 servidor y web: los MISMOS logros, cada uno en la misma cubierta", JSON.stringify(S.HITOS));
    c(D.C.every(x => S.CUBIERTAS[x[0]] && S.CUBIERTAS[x[0]].premio === x[3].tipo && (x[3].tipo !== "creditos" || S.CUBIERTAS[x[0]].creditos === x[3].n))
      && Object.keys(S.CUBIERTAS).length === D.C.length, "🔴 servidor y web: los MISMOS premios por cubierta", JSON.stringify(S.CUBIERTAS));
    c(JSON.stringify(S.HEROES_A_BORDO) === JSON.stringify(D.HB.map(h => h[0])), "   y los mismos héroes de a bordo");
    const c9 = D.caps.filter(x => x.clave === S.CAPITULO.clave)[0];
    c(!!c9 && c9.semanas.REGULAR === S.CAPITULO.semana.REGULAR && c9.semanas.PUA === S.CAPITULO.semana.PUA,
      "🔴 y la misma semana: el servidor no paga premios antes de que NEBULA los presente", JSON.stringify(c9 && c9.semanas) + " · " + JSON.stringify(S.CAPITULO));
  }
  const GPZ = fs.existsSync(path.join(GP, "stargateZoco.js")) ? fs.readFileSync(path.join(GP, "stargateZoco.js"), "utf8") : "";
  c(/tipoPieza\(id\) && !esDeABordo\(id\)/.test(GPZ) && /El Contramaestre no se cambia/.test(GPZ), "🔴 el Zoco del servidor rechaza al Contramaestre");
  const GPI = fs.existsSync(path.join(GP, "index.js")) ? fs.readFileSync(path.join(GP, "index.js"), "utf8") : "";
  c(/projectData\?\.stargate && !\(p\.stargateHitos \|\| \{\}\)\.compra\) updates\['stargateHitos\.compra'\] = ahora/.test(GPI) && /stargateHitos \} from '\.\/stargateHitos\.js'/.test(GPI),
    "   la tienda apunta «primera compra» (solo en STARGATE) y la función se exporta");

  // 3 · el calendario: sin saturar
  const caps = D.caps, c9w = caps.filter(x => x.clave === "c9")[0];
  c(!!c9w && c9w.semana === 7 && c9w.abre.indexOf("logros") >= 0 && /logros\.jpg$/.test(c9w.imagen) && fs.existsSync(path.join(RAIZ, c9w.imagen)),
    "🔴 «Los logros de a bordo» es el capítulo de la semana 7 (la libre entre el Sorteo y el Hangar), con su imagen");
  const porSemana = t => caps.reduce((a, x) => { a[x.semanas[t]] = (a[x.semanas[t]] || 0) + 1; return a; }, {});
  c(Object.values(porSemana("REGULAR")).every(n => n <= 1), "   en REGULAR, un capítulo por semana como mucho", JSON.stringify(porSemana("REGULAR")));
  c(c9w && porSemana("PUA")[c9w.semanas.PUA] === 1, "   y en PUA no se junta con el Sorteo y el Hangar (su semana es solo suya)", JSON.stringify(porSemana("PUA")));
  const zoco = caps.filter(x => x.abre.indexOf("zoco") >= 0)[0], sorteo = caps.filter(x => x.abre.indexOf("sorteo") >= 0)[0];
  c(zoco && sorteo && c9w && zoco.semana < c9w.semana && sorteo.semana < c9w.semana, "   y llega cuando ya está abierto TODO lo que piden (el Zoco y el Sorteo)");

  // 4 · el motor y la puerta de las escrituras
  c(/async function hitos\(perId\)/.test(M) && /llamar\("stargateHitos", \{ projectId: perId, tz \}\)/.test(M) && /borrarReflexion, idReflexion, hitos,/.test(M),
    "el motor pregunta al servidor con la zona horaria de quien pregunta");
  c(/cuerpo\.accion === "hitos"/.test(F) && /M\.llamar\("consumeItem"/.test(F.slice(F.indexOf('cuerpo.accion === "hitos"'), F.indexOf('cuerpo.accion === "hitos"') + 1500)),
    "   y si una cubierta trae un sobre o una cápsula, se abre ahí mismo");
  c(/yo_\.hitos = f\.stargateHitos/.test(F) && /hitos: p\.stargateHitos \|\| \{\}, cubiertas: p\.stargateCubiertas/.test(TB), "   la ficha trae sus logros (la Nave y la consola)");
  c(/var hitosSim = function/.test(F) && /P\._compra = true/.test(F) && /perfil\._trato = true/.test(F), "   y la Nave del Comandante los enciende en memoria (sin premios)");

  // 5 · la Nave
  c(/function aBordo\(\)/.test(N) && /\+aBordo\(\)\n\s*\+album/.test(N), "🔴 «Mi botín» tiene su cajón «🎖️ Logros de a bordo», detrás de las insignias");
  c(/!abierto\('logros'\)\) return '';/.test(N) && /abierto\('logros'\)&&d&&/.test(N) && /abierto\('logros'\) \|\| mios\[h\[0\]\]/.test(N),
    "🔴 antes de su capítulo no se ve nada (ni el cajón, ni los carteles, ni el Contramaestre en sombra): se apuntan en silencio");
  c(/id="nc-ab"/.test(N) && /'🌟 logros':'logros'/.test(N), "   la ficha lleva su cifra (y lleva al cajón)");
  c(/function cartaABordo\(alias, cls\)/.test(N) && /class="ab-nombre"/.test(N), "🔴 la carta del Contramaestre lleva el alias de quien la gana, escrito en el hueco del nombre");
  c(/function comprobarHitos\(\)/.test(N) && /setTimeout\(comprobarHitos, 1800\)/.test(N) && /if\(HITOS_TRAS\[cuerpo\.accion\]\) hitosLuego\(\)/.test(N) && /hitosLuego\(2500\)/.test(N),
    "   se pregunta al entrar y tras hacer algo que pueda ser un logro (también en el Zoco)");
  c(/function cuandoLibre\(fn, t0\)/.test(N) && /\.sb-capa/.test(N.slice(N.indexOf("function hayCapa"), N.indexOf("function hayCapa") + 200)),
    "🔴 un logro nunca pisa otra ventana (un sobre abierto, NEBULA, la lupa): espera");
  c(/logros de golpe/.test(N) && /CUBIERTA COMPLETA/.test(N) && /LEGENDARIO DE A BORDO/.test(N), "   los carteles: el logro, la cubierta con su premio y el Contramaestre (varios de golpe, en uno)");
  c(/var deABordo=\(AB\.heroes\|\|\[\]\)\.indexOf\(h\[0\]\)>=0/.test(N) && /tengo&&!deABordo&&abierto\('zoco'\)/.test(N) && /if\(\(AB\.heroes\|\|\[\]\)\.indexOf\(k\)<0\) out\.push/.test(N),
    "🔴 el Contramaestre no tiene botón de Zoco ni se ofrece para pagar");
  c(/c9:function\(\)/.test(N) && /ya llevas <b>'\+n\+'<\/b>/.test(N), "   el capítulo de NEBULA dice cuántos lleva ya");
  c(/hitos: 'apuntaría tus logros de a bordo'/.test(N), "   y en la demo se explica qué haría");
  c(/function sinAbrirHtml\(r\)/.test(N) && /data-abrirpend/.test(N) && /cuerpo\.accion === "abrir"/.test(F) && /yo_\.sinAbrir = /.test(F) && !/Ábrela desde tu álbum/.test(N),
    "🔴 lo que se quedó sin abrir (un premio, el regalo de la llamada) se abre desde «Mi botín» (antes no había dónde)");

  // 5b · la sesión de clase: los logros en «Coleccionistas» (desde su semana) y quién es ya Contramaestre
  const SE = leer("assets/js/sesion.js");
  c(/function logrosPresentados\(sem\)/.test(SE) && /conLogros\?col\('Logros de a bordo'/.test(SE) && /Contramaestres de la Nave/.test(SE) && /diaColeccion\(s\)/.test(SE),
    "🔴 la sesión reconoce en clase a quien va más avanzado en los logros, y a los Contramaestres (desde la semana 7)");
  // 5c · el buzón: el Capitán sabe contestar por qué no sale un logro
  const BS = leer("_build_site.py");
  c(/\("logros", "A un estudiante no le sale un logro de a bordo/.test(BS) && !/<b>todos los retos piden el enlace<\/b>/.test(BS),
    "   y el buzón sabe por qué no sale un logro (y ya no dice que todos los retos piden enlace)");

  // 6 · la consola
  c(/function lineaABordo\(r\)/.test(K) && /' logros de a bordo<\/b>'/.test(K) && /Contramaestre de la Nave/.test(K), "la ficha del recluta en la consola: sus logros, sus cubiertas y sus días");

  // 7 · el diseño
  const tramo = CSS.slice(CSS.indexOf("LOS LOGROS DE A BORDO (15-sep"));
  c(!!tramo && /\.ab-nombre\{/.test(tramo) && /container-type:inline-size/.test(tramo), "el cajón, la carta con su alias y la línea de la consola tienen su estilo");
  const peques = (tramo.match(/font-size:\s*\.(\d+)rem/g) || []).map(x => Number("0." + x.match(/\.(\d+)/)[1]));
  c(peques.every(v => v >= 0.75), "   nada por debajo de 12 px", peques.join(","));

  console.log("\n  Batería 79 · los logros de a bordo y el Contramaestre");
  console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
  fallos.forEach(f => console.log("   ✗ " + f));
  process.exit(fallos.length ? 1 : 0);
})();
