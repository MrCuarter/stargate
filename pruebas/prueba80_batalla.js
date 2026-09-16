'use strict';
/**
 * BATERÍA 80 · EL SIMULADOR DE JORAN, la batalla del reto A6 (16-sep-2026).
 *
 * Norberto: «Reto A6: vamos a hacer algo más épico… se van a enfrentar a un juego de preguntas contra Joran…
 * GamificaPro tiene un motor de peleas, revísalo y lo usamos… si el usuario gana desbloquea algo nuevo en su nave: el
 * Simulador de Joran… habrá un ranking de cada tema y un modo con todas las preguntas… debe existir la posibilidad de
 * embeber el juego… escoger el nivel de dificultad… reconocimientos al más rápido, al más certero y al que más ha
 * respondido de forma correcta».
 *
 * Esto comprueba, sin emulador, lo que no puede fallar:
 *   · que la web NO lleve ni una respuesta (este repositorio es público: el banco vive en GamificaPro);
 *   · que los números que se le enseñan al alumnado sean los del servidor (vida, golpes, cadencia, niveles);
 *   · que el reto A6 ya no pida enlace ni reflexión, y que en su sitio esté la batalla;
 *   · que la página, su hoja de estilo, las imágenes y el capítulo estén donde dicen estar.
 * El laboratorio (sección 39) juega una batalla de verdad contra el motor, y GamificaPro tiene las suyas
 * (tests/functions/stargate-batalla.test.ts y tests/rules/stargate-batalla.test.ts).
 */
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process"), { pathToFileURL } = require("url");
const RAIZ = path.resolve(__dirname, ".."), GP = "/Users/nor/Claude/vibewebs/gamificapro/functions";
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
const hay = f => fs.existsSync(path.join(RAIZ, f));
const B = leer("assets/js/batalla.js"), N = leer("assets/js/recluta.js"), M = leer("assets/js/motor.js"),
      CSS = leer("assets/css/batalla.css"), PAG = leer("batalla.html"), TB = leer("motor/tablero.js"), FU = leer("assets/js/fuente.js");

(async () => {
  // 1 · los datos de la web (un dato, un sitio: _site_data.py)
  const D = JSON.parse(execFileSync("python3", ["-c",
    "import json,_site_data as D;print(json.dumps({'B':D.BATALLA,'caps':[{k:c[k] for k in ('n','clave','semana','semanas','abre','imagen')} for c in D.CAPITULOS]," +
    "'ev':D.EVIDENCIA_RETOS,'rf':list(D.REFLEXION_RETOS)}))"], { cwd: RAIZ, encoding: "utf8" }));
  const W = D.B, cap = D.caps.filter(x => x.clave === W.capitulo)[0];

  c(W.reto === "A6" && W.clave === "joran" && W.rival === "RUTA AZUL", "el reto A6 es la batalla contra RUTA AZUL", JSON.stringify([W.reto, W.clave, W.rival]));
  c(JSON.stringify(W.temas_reto) === JSON.stringify([1, 2, 3, 4, 5]) && W.tema_reto === 6,
    "   pregunta por lo ya recorrido (temas 1 al 5) y se abre con el planeta Ludo", JSON.stringify(W.temas_reto));
  c(!!cap && cap.semanas.REGULAR === 11 && cap.semanas.PUA === 7 && cap.abre.indexOf("simulador") >= 0,
    "🔴 el capítulo del simulador va la semana siguiente a la batalla (11; en PUA, la 7)", JSON.stringify(cap && cap.semanas));
  c(!!cap && hay(cap.imagen), "   con su imagen", cap && cap.imagen);
  c(W.niveles.length === 3 && W.niveles.map(x => x[0]).join(",") === "facil,media,dificil" && W.nivel_reto === "media",
    "   tres niveles de dificultad, y el reto siempre en media (la insignia cuesta lo mismo para todos)");
  c(W.medallas.length === 3 && W.medallas.map(x => x[0]).join(",") === "rapido,certero,sabio",
    "   y tres reconocimientos: el más rápido, el más certero y quien más sabe");

  // 2 · el A6 ya no se marca: se gana
  c(D.ev.A6 === "" && D.rf.indexOf("A6") < 0, "🔴 el A6 no pide enlace ni reflexión: se gana al simulador", D.ev.A6 + " / " + D.rf.join(","));
  c(/rs-batalla/.test(N) && /batalla\.html\?per=/.test(N), "   la tarjeta del reto lleva a la batalla, no a «Lo he hecho»");
  c(/function comprobarBatalla/.test(N) && /ganoAJoran/.test(N),
    "🔴 si ganó y el reto no llegó a registrarse (cerró la pestaña, tope del día), la Nave lo registra al entrar");
  c(/function simuladorCaja/.test(N) && /abierto\('simulador'\)/.test(N), "   la Nave enseña el simulador (bloqueado o abierto) en «Mi nave»");
  c(/window\.SG_BATALLA/.test(leer("recluta.html")) && /window\.SG_BATALLA/.test(PAG), "   y la configuración llega a la Nave y a la batalla");

  // 3 · la página, embebible y con lo suyo
  c(/id="bt-app"/.test(PAG) && /batalla\.js/.test(PAG) && /batalla\.css/.test(PAG), "la página de la batalla carga su guion y su hoja de estilo");
  c(/assets\/js\/motor\.js/.test(PAG) && !/nav-grupos/.test(PAG.split("<body>")[1] || ""), "   es pública (entra con Google) y no lleva el menú del profesorado");
  c(/embed'\) === '1'|embed"\) === "1"|embed'\) === '1'/.test(B) || /embed/.test(B), "   se puede embeber en un Genially (?embed=1)");
  c(/body\.embed .nav/.test(CSS), "   y embebida se quita la cabecera");
  ["assets/img/batalla/rival.jpg", "assets/img/batalla/rival_ataque.jpg", "assets/img/batalla/rival_danado.jpg",
   "assets/img/batalla/rival_derrotado.jpg", "assets/img/batalla/sala.jpg", "assets/img/batalla/joran.jpg",
   "assets/img/batalla/joran_celebra.jpg", "assets/img/batalla/emblema.webp"].forEach(f => c(hay(f), "   está " + f));
  c(/mix-blend-mode: screen/.test(CSS), "   el rival es un holograma: se funde con la sala (sin fondo negro)");

  // 4 · 🔴 en la web NO hay respuestas
  const sospechosos = ["correctas", "correccion", "BANCO", "banco de preguntas"];
  const sinRespuestas = sospechosos.every(k => !new RegExp("\\b" + k + "\\b\\s*[:=]\\s*[\\[{\"']").test(B));
  c(sinRespuestas, "🔴 la web (repositorio PÚBLICO) no lleva el banco ni las respuestas");
  c(/no hay ni una respuesta|NI UNA RESPUESTA/i.test(B), "   y el fichero lo dice, para que nadie las meta aquí");
  c(!fs.existsSync(path.join(RAIZ, "assets/js/banco.js")) && !fs.existsSync(path.join(RAIZ, "motor/banco.json")),
    "   no hay ningún fichero de preguntas en la web");

  // 5 · el servidor dice lo mismo (GamificaPro)
  let S = null;
  try { S = await import(pathToFileURL(path.join(GP, "stargateBatalla.js")).href); } catch (e) { S = null; }
  c(!!S, "🔴 existe el motor del servidor (gamificapro/functions/stargateBatalla.js)");
  if (S) {
    const E = S.BATALLA;
    c(E.RETO === W.reto && E.RIVAL === W.clave && E.TEMA_RETO === W.tema_reto && JSON.stringify(E.TEMAS_RETO) === JSON.stringify(W.temas_reto),
      "🔴 servidor y web: el mismo reto, el mismo rival y los mismos temas");
    c(E.VIDA === W.vida && E.GOLPE === W.golpe && E.GOLPE_RIVAL === W.golpe_rival && E.NIVELES.media.vidaRival === W.vida_rival,
      "🔴 y los mismos números (lo que se le enseña al alumnado es lo que va a pasar)",
      JSON.stringify([E.VIDA, E.GOLPE, E.GOLPE_RIVAL, E.NIVELES.media.vidaRival]));
    c(E.CADENCIA_MS === W.cadencia * 1000 && E.PREGUNTAS === W.preguntas && E.CURA === W.cura && E.LENTITUD_MS === W.lentitud * 1000,
      "   la cadencia, las preguntas por batalla y el kit");
    c(JSON.stringify(Object.keys(E.NIVELES)) === JSON.stringify(W.niveles.map(x => x[0])) && E.NIVEL_RETO === W.nivel_reto,
      "   y los tres niveles, con el reto en media");
    c(JSON.stringify(E.CAPITULO || { clave: W.capitulo }) !== "" && typeof S.retoSinBatalla === "function"
      && /Simulador de Joran/.test(S.retoSinBatalla({ stargate: {} }, { stargateId: E.RETO }, {}) || ""),
      "🔴 el reto A6 no se puede marcar sin haberle ganado (lo comprueba completeMission)");
    // el banco, del lado privado
    const banco = fs.existsSync(path.join(GP, "stargateBanco.js"));
    c(banco, "   el banco de preguntas vive en el repositorio privado");
    if (banco) {
      const BQ = (await import(pathToFileURL(path.join(GP, "stargateBanco.js")).href)).BANCO;
      c(BQ.length >= 100, "   con al menos 100 preguntas", String(BQ.length));
      const temas = new Set(BQ.map(q => q.tema));
      c([1, 2, 3, 4, 5, 6, 7, 8].every(t => temas.has(t)), "   de los ocho temas");
      // las imágenes de las preguntas, en la web
      const conImagen = BQ.filter(q => (q.visual || {}).tipo === "imagen");
      c(conImagen.length > 0 && conImagen.every(q => hay("assets/img/batalla/p/" + q.id + ".jpg")),
        "🔴 cada pregunta con ilustración tiene su imagen en la web", conImagen.map(q => q.id).join(","));
    }
  }
  // el índice de GamificaPro exporta la función y el despliegue la lleva
  const idx = fs.readFileSync(path.join(GP, "index.js"), "utf8");
  c(/export \{ stargateBatalla \}/.test(idx) && /retoSinBatalla/.test(idx), "   index.js la exporta y pone el cerrojo en completeMission");
  const desp = fs.readFileSync(path.resolve(RAIZ, "..", "desplegar_stargate.sh"), "utf8");
  c(/stargateBatalla/.test(desp), "🔴 el guion de despliegue sube stargateBatalla (si no, la batalla no existe en producción)");

  // 6 · el motor de la web
  c(/const batalla = \(accion, datos\)/.test(M) && /batalla,/.test(M), "el motor de la web llama a stargateBatalla");
  c(/simulador: p\.stargateSimulador/.test(TB), "   el tablero trae las marcas (para los rankings y la sesión)");
  c(/yo_\.simulador/.test(FU), "   y la Nave sabe si le ganó");
  c(/data-nivel/.test(B) && /sgBtNivel/.test(B), "   la batalla deja escoger el nivel y lo recuerda");
  c(/function medallas/.test(B) && /bt-med/.test(CSS), "   y enseña los tres reconocimientos del grupo");

  console.log("\n  Batería 80 · el Simulador de Joran (el reto A6)");
  console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
  fallos.forEach(f => console.log("   ✗ " + f));
  process.exit(fallos.length ? 1 : 0);
})();
