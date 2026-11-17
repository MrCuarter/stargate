'use strict';
/**
 * BATERÍA 161 · CUÁNTAS REPETIDAS PIDE UN SOBRE, EN CADA GRUPO (17-nov-2026)
 * ------------------------------------------------------------------------------------------------
 * El 16-nov, en el PER 16450, 13 reclutas tenían el álbum de 26 completo en la semana 7 de 15: 3 repetidas daban un sobre de 3
 * cartas y el álbum salía siempre con 28. GamificaPro (d4a1cdd4) añade la novedad `cromosNivelados` en la versión 3: los grupos
 * que nacen ahora piden 5 repetidas por el mismo sobre (`CAMBIO_CROMOS = { repetidas: 3, nivelado: 5 }`). Los grupos en marcha
 * (per-16450, versión 1; per-16457, versión 2) siguen con 3, y 🔴 SU ALUMNADO TIENE QUE VER EXACTAMENTE LO MISMO QUE HOY.
 *
 *  · prueba161_hoy.json: lo que pintaba la Nave ANTES del cambio (sacado del código de entonces, HEAD de 9feb67e4): el aviso del
 *    álbum para 110 combinaciones de repetidas, el aviso de la tienda y su umbral. Aquí se pinta con el código de hoy y debe
 *    salir idéntico, letra a letra, en las versiones 1 y 2; y en la 3, con 5.
 *  · El número sale del motor (functions/mods/stargate.js → CAMBIO_CROMOS), por el build; el SDK fijado trae la novedad.
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const raiz = path.join(__dirname, "..");
const leer = (f) => fs.readFileSync(path.join(raiz, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + JSON.stringify(dato))); };
const trozo = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error("no encuentro " + a); return s.slice(i, j); };
const esc = (s) => String(s).replace(/[&<>"]/g, (x) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[x]));

console.log("▶ 161 · Cuántas repetidas pide un sobre, en cada grupo (3 en los de siempre, 5 en los nivelados)");
const HOY = JSON.parse(leer("pruebas/prueba161_hoy.json"));
// 🔴 La ÚNICA diferencia permitida con lo de hoy: un arreglo. La Nave escribía «Puedes cambiar 4 vezes» (17-nov: «veces»).
let ARREGLOS = 0;
Object.keys(HOY.album).forEach((k) => { if (/ vezes\./.test(HOY.album[k])) { HOY.album[k] = HOY.album[k].replace(/ vezes\./, " veces."); ARREGLOS++; } });
const BUILD = leer("_build_site.py"), REC = leer("assets/js/recluta.js"), RH = leer("recluta.html"), SH = leer("sesion.html");
const SGJS = leer("assets/js/stargate.js");

// ── 1 · el SDK fijado y el número del motor
console.log("\n  · 1 · el SDK fijado (con la novedad) y el número, del motor");
const FIJADO = (BUILD.match(/^SDK_FIJADO = "([^"]+)"/m) || [])[1];
c(FIJADO === "mod-sdk.v1.2d27a90ffe.js", "SDK_FIJADO = mod-sdk.v1.2d27a90ffe.js (el paquete con `cromosNivelados`)", FIJADO);
c(fs.existsSync(path.join(raiz, "assets/js", FIJADO)) && RH.indexOf('assets/js/' + FIJADO + '"') >= 0 && SH.indexOf('assets/js/' + FIJADO + '"') >= 0,
  "   copiado en assets/js y cargado en la Nave y en la sesión");
const ctx = { window: {}, console };
ctx.self = ctx.window; vm.createContext(ctx);
vm.runInContext(leer("assets/js/" + FIJADO), ctx);
const SDK = ctx.window.GP_SDK || ctx.GP_SDK;
c(!!(SDK && SDK.sitio && SDK.sitio.tiene), "   el paquete da GP_SDK.sitio.tiene");
const conf = (h) => JSON.parse((h.match(/window\.SG_CAMBIO_CROMOS=(\{[^}]*\});/) || [])[1] || "null");
const CC = conf(RH);
c(CC && CC.repetidas === 3 && CC.nivelado === 5, "🔴 la Nave lleva window.SG_CAMBIO_CROMOS = { repetidas: 3, nivelado: 5 }", CC);
c(JSON.stringify(conf(SH)) === JSON.stringify(CC), "   y la sesión, lo mismo");
c(/def _cambio_cromos\(\)/.test(BUILD) && /"functions", "mods", "stargate\.js"/.test(BUILD), "   el build lo lee del motor (functions/mods/stargate.js), no de un número escrito aquí");
const GPDIR = process.env.GAMIFICAPRO_DIR || path.join(raiz, "..", "..", "gamificapro");
const modJs = path.join(GPDIR, "functions", "mods", "stargate.js");
if (fs.existsSync(modJs)) {
  const m = fs.readFileSync(modJs, "utf8").match(/const CAMBIO_CROMOS\s*=\s*\{\s*repetidas:\s*(\d+),\s*nivelado:\s*(\d+)\s*\}/);
  c(m && +m[1] === CC.repetidas && +m[2] === CC.nivelado, "   es el del motor, el que cobra stargateCambiarRepes", m && m.slice(1));
}

// ── 2 · el ayudante, con el SDK de verdad
console.log("\n  · 2 · SG.repesPorSobre(proyecto): 3, 3 y 5; nunca lanza");
const bloque = trozo(SGJS, "(function () {\n  window.SG = window.SG || {};\n  var PALABRA", "\n  window.SG.conRepes = conRepes;\n})();") + "\n  window.SG.conRepes = conRepes;\n})();";
const nuevoSG = (cambio, gp) => { const w = { SG: {}, SG_CAMBIO_CROMOS: cambio, GP_SDK: gp }; const x = { window: w }; vm.createContext(x); vm.runInContext(bloque, x); return w.SG; };
const SG = nuevoSG(CC, SDK);
const P1 = { name: "PER 16450", stargate: { version: 1, inicio: "2026-10-05" } };                 // per-16450: sin modVersion → 1
const P2 = { name: "PER 16457", stargate: { version: 1, inicio: "2026-11-02" }, modVersion: 2 };  // per-16457
const P3 = { name: "PER nuevo", stargate: { version: 1, inicio: "2027-01-11" }, modVersion: 3 };  // los que nacen ahora
c(SDK.sitio.version(P1) === 1 && SDK.sitio.version(P2) === 2 && SDK.sitio.version(P3) === 3, "   el SDK los ve en las versiones 1, 2 y 3");
c(SG.repesPorSobre(P1) === 3, "🔴 per-16450 (versión 1): 3");
c(SG.repesPorSobre(P2) === 3, "🔴 per-16457 (versión 2): 3");
c(SG.repesPorSobre(P3) === 5, "🔴 un grupo nuevo (versión 3, `cromosNivelados`): 5");
c(SG.repesPorSobre(Object.assign({}, P3, { modVersion: 4 })) === 5, "   y los de versiones posteriores, también 5");
c([null, undefined, {}, "x", { modVersion: 3 }, { modVersion: 3, mod: "ceniza" }].every((p) => SG.repesPorSobre(p) === 3),
  "   sin grupo, o uno que no es de STARGATE: 3");
c(nuevoSG(CC, { sitio: { tiene: () => { throw new Error("roto"); } } }).repesPorSobre(P3) === 3, "   si el SDK lanza: 3 (try/catch), nunca rompe la Nave");
c(nuevoSG(CC, undefined).repesPorSobre(P3) === 3 && nuevoSG(undefined, SDK).repesPorSobre(P3) === 3,
  "   sin SDK o sin el dato del build: 3, lo de siempre");

// ── 3 · lo que ve el alumnado: idéntico en la 1 y la 2; con 5 en la 3
console.log("\n  · 3 · 🔴 el álbum, la tienda y los textos: en las versiones 1 y 2, EXACTAMENTE lo de hoy");
const albumExpr = trozo(REC, "+(repes?'<p class=\"repes'", "\n      +series+'</div>')");
const chipExpr = trozo(REC, "'<span class=\"chip wip\">Necesitas", "\n        :tope?");
const faltaExpr = trozo(REC, "x.tipo === 'cromo_repes' && (r ?", ";\n");
const fAlbum = new Function("repes", "libres", "d", "esc", "NR", "return ''" + albumExpr + ";");
const fChip = new Function("r", "NR", "return " + chipExpr + ";");
const fFalta = new Function("x", "r", "NR", "return " + faltaExpr + ";");
const pintar = (n) => {
  const a = {}, ch = {}, f = {};
  Object.keys(HOY.album).forEach((k) => { const [rp, lb, fc] = k.split("|").map(Number); a[k] = fAlbum(rp, lb, { formCanje: fc ? "https://forms.example/canje" : "" }, esc, n); });
  Object.keys(HOY.chip).forEach((k) => { ch[k] = fChip({ repes_disponibles: +k }, n); f[k] = fFalta({ tipo: "cromo_repes" }, { repes_disponibles: +k }, n); });
  return { album: a, chip: ch, falta: f };
};
c(ARREGLOS > 0 && !/vezes/.test(REC), "   el arreglo: «vezes» → «veces» (" + ARREGLOS + " casos de la referencia); nada más cambia");
const distintos = (x, y) => Object.keys(y).filter((k) => x[k] !== y[k]);
[["per-16450", P1], ["per-16457", P2]].forEach(([nom, p]) => {
  const v = pintar(nuevoSG(CC, SDK).repesPorSobre(p));
  c(Object.keys(HOY.album).length >= 100 && !distintos(v.album, HOY.album).length, "🔴 " + nom + ": el aviso del álbum, igual letra a letra en " + Object.keys(HOY.album).length + " casos", distintos(v.album, HOY.album).slice(0, 3));
  c(!distintos(v.chip, HOY.chip).length && !distintos(v.falta, HOY.falta).length, "   " + nom + ": la tienda («Necesitas 3 repetidas», y con 3 ya se puede), igual");
});
c(/var NR=repesSobre\(\);/.test(REC) && /libres>=NR\?'Tienes repetidas para cambiar'/.test(REC), "   la puerta de Cromos usa el mismo número («Tienes repetidas para cambiar»)");
const v3 = pintar(5);
c(/con 5 te llevas un sobre <b>gratis<\/b>\. Puedes cambiar 1 vez\./.test(v3.album["5|5|1"]) && /Cambiar 5 repetidos →/.test(v3.album["5|5|1"]),
  "🔴 versión 3: «con 5 te llevas un sobre» y «Cambiar 5 repetidos →» al llegar a 5", v3.album["5|5|1"]);
c(!/listo/.test(v3.album["4|4|1"]) && !/Cambiar/.test(v3.album["4|4|1"]) && /\(4 sin cambiar\): con 5 te llevas/.test(v3.album["4|4|1"]),
  "   con 4, aún no: sin botón y «(4 sin cambiar): con 5…»", v3.album["4|4|1"]);
c(/Puedes cambiar 2 veces/.test(v3.album["12|12|0"]), "   con 12, dos cambios (no cuatro)");
c(v3.chip[4] === '<span class="chip wip">Necesitas 5 repetidas · tienes 4</span>' && v3.falta[4] === true && v3.falta[5] === false,
  "   la tienda: «Necesitas 5 repetidas · tienes 4», y se puede con 5");

// los textos sueltos: con 3, el mismo texto (sin tocarlo); con 5, el número del grupo
const TEXTOS = {
  "el sobre (sobre.js)": ["Repetida: con tres repetidas, un sobre nuevo gratis.", "Repetida: con cinco repetidas, un sobre nuevo gratis."],
  "NEBULA (nebula-faq.js)": ["Tres repetidos se cambian por un <b>sobre nuevo gratis</b>, o los truecas en el Zoco con tu tripulación.",
    "Cinco repetidos se cambian por un <b>sobre nuevo gratis</b>, o los truecas en el Zoco con tu tripulación."],
  "la visita (recluta.js)": ["Las cartas van a tu <b>álbum</b>, en Mi botín. ¿Te sale una repetida? Con <b>tres repetidas</b> te llevas un sobre nuevo, gratis.",
    "Las cartas van a tu <b>álbum</b>, en Mi botín. ¿Te sale una repetida? Con <b>cinco repetidas</b> te llevas un sobre nuevo, gratis."],
  "las novedades del capítulo 2 (sesión)": ["Cambiar 3 cartas repetidas por un sobre nuevo, gratis", "Cambiar 5 cartas repetidas por un sobre nuevo, gratis"],
  "el nombre en la tienda": ["Cambiar 3 repetidos por un sobre", "Cambiar 5 repetidos por un sobre"],
  "la descripción en la tienda (_site_data.py)": ["¿Cartas repetidas? Cámbialas. Por cada 3 repetidas te llevas un sobre nuevo, gratis. No cuesta créditos y se comprueba solo: si no llegas a 3, se te avisa y no pierdes nada.",
    "¿Cartas repetidas? Cámbialas. Por cada 5 repetidas te llevas un sobre nuevo, gratis. No cuesta créditos y se comprueba solo: si no llegas a 5, se te avisa y no pierdes nada."],
};
const S3 = nuevoSG(CC, SDK), S5 = nuevoSG(CC, SDK); S5.fijarRepes(5);
Object.keys(TEXTOS).forEach((k) => {
  const [hoy, cinco] = TEXTOS[k];
  c(S3.conRepes(hoy) === hoy && S3.conRepes(hoy, 3) === hoy, "🔴 " + k + ": con 3, el texto de hoy, sin tocar");
  c(S5.conRepes(hoy) === cinco, "   " + k + ": con 5, «" + cinco.slice(0, 60) + "…»", S5.conRepes(hoy));
});
const HEROES = ["Repetido: con dos héroes repetidos, uno nuevo al azar (en tu vestuario).", "Cambiar 2 héroes repetidos por uno nuevo al azar",
  "¿Repetido? Con <b>2 repetidos</b>, uno nuevo al azar.", "Comprar sobres de cromos: tres cartas al azar por 15 ◈", "13 repetidos", "Llevas <b>3</b> repetidos"];
c(HEROES.every((t) => S5.conRepes(t) === t), "   los héroes (2), el precio del sobre y lo que no es la regla, intactos también con 5");
// y esos textos siguen en su sitio (si alguien los cambia, esta batería tiene que enterarse)
c(leer("assets/js/sobre.js").indexOf("conRepes('" + TEXTOS["el sobre (sobre.js)"][0] + "')") >= 0, "   sobre.js pasa su texto por SG.conRepes");
c(leer("assets/js/nebula-faq.js").indexOf(TEXTOS["NEBULA (nebula-faq.js)"][0]) >= 0 && /SG\.conRepes\(e\.r\)/.test(leer("assets/js/nebula-chat.js")), "   NEBULA responde con SG.conRepes");
c(REC.indexOf(TEXTOS["la visita (recluta.js)"][0]) >= 0 && /return pasosConRepes\(/.test(REC), "   la visita pasa sus pasos por el número del grupo");
c(RH.indexOf(TEXTOS["las novedades del capítulo 2 (sesión)"][0]) >= 0 && /SG\.conRepes\(x\)/.test(leer("assets/js/sesion.js")), "   la sesión pinta las novedades con SG.conRepes");
c(leer("_site_data.py").indexOf(TEXTOS["la descripción en la tienda (_site_data.py)"][0]) >= 0 && /nomV=x\.tipo==='cromo_repes'\?conRepes\(x\.nombre\)/.test(REC)
  && /data-nombre="'\+esc\(x\.nombre\)/.test(REC), "   la tienda lee nombre y descripción con el número; la clave (data-nombre, canjeados, imagen), intacta");

// ── 4 · de dónde sale el número en cada pantalla
console.log("\n  · 4 · el número de cada grupo: su tarjeta, y lo que contesta el servidor");
(async () => {
  const S = nuevoSG(CC, SDK);
  c((await S.repesDelGrupo("per-x")) === null && S.repesActual() === 3, "   sin motor todavía: null (se vuelve a mirar) y 3");
  const doc = (p) => ({ exists: () => !!p, data: () => p });
  S.SG = S; // (no hace falta: el bloque lee window.SG.MOTOR)
  const conMotor = (p) => { const w = { SG: { MOTOR: { leerGrupo: () => Promise.resolve(doc(p)) } }, SG_CAMBIO_CROMOS: CC, GP_SDK: SDK }; const x = { window: w }; vm.createContext(x); vm.runInContext(bloque, x); return w.SG; };
  const a1 = conMotor(P1), a2 = conMotor(P2), a3 = conMotor(P3);
  c((await a1.repesDelGrupo("per-16450")) === false && a1.repesActual() === 3, "🔴 per-16450 leído: 3, sin cambio (no se repinta nada)");
  c((await a2.repesDelGrupo("per-16457")) === false && a2.repesActual() === 3, "🔴 per-16457 leído: 3, sin cambio");
  c((await a3.repesDelGrupo("per-nuevo")) === true && a3.repesActual() === 5, "🔴 un grupo de la versión 3: 5, y avisa de que cambia (se repinta)");
  const roto = (() => { const w = { SG: { MOTOR: { leerGrupo: () => Promise.reject(new Error("permiso")) } }, SG_CAMBIO_CROMOS: CC, GP_SDK: SDK }; const x = { window: w }; vm.createContext(x); vm.runInContext(bloque, x); return w.SG; })();
  c((await roto.repesDelGrupo("per-x")) === false && roto.repesActual() === 3, "   si no se puede leer el grupo: 3");
  const s = nuevoSG(CC, SDK);
  c(s.fijarRepes(undefined) === false && s.fijarRepes("5") === false && s.repesActual() === 3 && s.fijarRepes(5) === true && s.repesActual() === 5,
    "   `repetidasPorSobre` del servidor: solo un número entero cambia el que se ve (sin él, el de antes)");
  c(/SG\.fijarRepes\(r\.repetidasPorSobre\)/.test(leer("assets/js/fuente.js")), "   fuente.js apunta el `repetidasPorSobre` que devuelve stargateCambiarRepes");
  c(/var nR = window\.SG && SG\.repesActual \? SG\.repesActual\(\) : 3;/.test(leer("assets/js/fuente.js")) && /"Necesitas " \+ nR \+ " cartas repetidas\."/.test(leer("assets/js/fuente.js")),
    "   el simulacro (consola de ensayo) pide las mismas que el grupo");
  c(/mirarSiDocente\(\); mirarRepes\(\);/.test(REC) && /function mirarRepes\(per, intentos\)/.test(leer("assets/js/sesion.js")), "   la Nave y la sesión leen el grupo al pintar");

  console.log("\n  " + (fallos.length ? "✗ " + fallos.length + " fallos" : "✓ todo en verde") + " · " + ok + " comprobaciones");
  console.log("RESULTADO: " + ok + " ok, " + fallos.length + " mal");
  process.exit(fallos.length ? 1 : 0);
})();
