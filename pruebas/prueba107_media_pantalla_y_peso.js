'use strict';
/**
 * BATERÍA 107 · LA NOTA DEL 22-SEP, TANDA 3: MEDIA PANTALLA Y LO QUE PESA CADA PÁGINA
 *
 * Norberto: «las páginas van más lentas cuantas más semanas llevamos» y «con la ventana a media pantalla se rompe».
 * Medido en la Nave Escuela (semana 15, 30 reclutas): la Nave del recluta pedía el grupo entero 4 veces al cargar y
 * bajaba 13 MB de imágenes, 11 de ellos las insignias en PNG (el tablero escondido las pinta todas en cada fila).
 * Aquí se EJECUTA el reparto del tablero de assets/js/fuente.js con un `fetch` de mentira que cuenta, y se vigila lo
 * demás en su sitio. Las medidas de verdad y las fotos a 800/900/1000 px, en el laboratorio.
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };

(async () => {
  // ── 1 · el tablero, una vez por visita
  const pedidas = [];
  let soltar = [];
  const ventana = {
    SG_MOTOR: "firestore", SG_API_PUBLICA: "https://x.test/tableroStargate", SG_CATALOGO: {},
    SG: { TABLERO: { tablero: (d) => ({ reclutas: [], de: d.n }) } },
    addEventListener() {}, document: { addEventListener() {} }
  };
  const ctx = {
    window: ventana, location: { search: "" }, URLSearchParams, setTimeout, Promise, console, Date,
    document: ventana.document,
    fetch: (url) => { pedidas.push(url); const n = pedidas.length;
      return new Promise(ok_ => soltar.push(() => ok_({ json: () => Promise.resolve({ n }) }))); }
  };
  vm.createContext(ctx);
  vm.runInContext(L("assets/js/fuente.js"), ctx);
  const F = ventana.SG.FUENTE;
  const suelta = async () => { const s = soltar; soltar = []; s.forEach(f => f()); for (let i = 0; i < 6; i++) await Promise.resolve(); await new Promise(r => setTimeout(r, 5)); };
  c(F && F.nombre === "firestore", "   (el motor nuevo, cargado de verdad)");

  // la Nave con sesión: fresco; «¿quién soy?» se lo pasa; el tablero de abajo y el calendario solo miran
  const nave = F.tablero("g1", true), abajo = F.tablero("g1"), cal = F.tablero("g1");
  await suelta();
  const [a, b, d] = await Promise.all([nave, abajo, cal]);
  c(pedidas.length === 1 && /&t=\d+/.test(pedidas[0]), "🔴 la Nave, el tablero de abajo y el calendario: UNA petición (fresca), no tres", JSON.stringify(pedidas));
  c(a !== b && b !== d && a.de === 1 && d.de === 1, "   y cada cual con su copia (nadie toca el objeto del vecino)");
  await F.tablero("g1");
  c(pedidas.length === 1, "🔴 lo que solo mira, dentro de los 30 s, se lleva lo que ya llegó", pedidas.length);
  const fr = F.tablero("g1", true); await suelta(); await fr;
  c(pedidas.length === 2, "🔴 pero lo FRESCO que llega después no se lleva nada viejo (la Nave escribe sola al entrar)", pedidas.length);
  const f1 = F.tablero("g1", true), f2 = F.tablero("g1", true); await suelta(); await Promise.all([f1, f2]);
  c(pedidas.length === 3, "   dos frescos a la vez comparten la misma petición", pedidas.length);
  const otro = F.tablero("g2"); await suelta(); await otro;
  c(pedidas.length === 4 && !/&t=/.test(pedidas[3]), "   otro grupo es otra petición, y lo que solo mira no salta la caché del servidor", pedidas[3]);
  // un Genially proyectado sin sesión (no fresco): 200 alumnos mirando siguen pegando a la caché del servidor
  c(!/&t=/.test(pedidas[3]), "   (el tablero de un Genially sigue saliendo de la caché del servidor)");

  // 19-oct · lo mío, al momento (GamificaPro, COSTES_POR_CLASE §9, P1): con motor y sesión, lo fresco lleva MI ficha (`yo`),
  // buscada una vez (no se olvida al escribir); sin ficha (el docente) o sin motor, sin `yo`
  let fichas = 0, quien = { uid: "u1" };
  ventana.SG.MOTOR = { sesion: () => Promise.resolve(quien), db: {}, collection: () => ({}), where: () => ({}), query: () => ({}),
    getDocs: () => { fichas++; return Promise.resolve(quien ? { empty: false, docs: [{ id: "ficha-u1", data: () => ({}) }] } : { empty: true, docs: [] }); } };
  const conYo = F.tablero("g3", true); await suelta(); await suelta(); await conYo;
  c(/[?&]per=g3&t=\d+&yo=ficha-u1$/.test(pedidas[4]), "🔴 lo fresco con sesión dice cuál es MI ficha (el servidor relee solo esa)", pedidas[4]);
  c((await conYo).conYo === "ficha-u1", "   y el tablero lo dice (conYo): «¿quién soy?» repite si lo fresco no trajo la suya", (await conYo).conYo);
  await F.accion({ accion: "nada", per: "g3" }).catch(() => {});
  const otraVez = F.tablero("g3", true); await suelta(); await otraVez;
  c(/&yo=ficha-u1$/.test(pedidas[5]) && fichas <= 2, "   y no se olvida al escribir (no se busca en cada petición)", pedidas[5] + " · " + fichas);
  const solo = F.tablero("g3"); await suelta(); await solo;
  c(pedidas.length === 6, "   lo que solo mira sigue sin pedir nada si lo fresco acaba de llegar", pedidas.length);
  quien = null;
  const sinFicha = F.tablero("g4", true); await suelta(); await suelta(); await sinFicha;
  c(/[?&]per=g4&t=\d+$/.test(pedidas[6]), "   sin sesión (el proyector, un Genially), fresco sin `yo`", pedidas[6]);
  quien = { uid: "u1" };
  const yaAlistado = F.tablero("g4", true); await suelta(); await suelta(); await yaAlistado;
  c(/&yo=ficha-u1$/.test(pedidas[7]), "🔴 «no tengo ficha» no se recuerda: quien se alista en la misma página manda la suya", pedidas[7]);
  delete ventana.SG.MOTOR;

  const FU = L("assets/js/fuente.js"), REC = L("assets/js/recluta.js");
  c(/quien: function \(per, quien_, yaFresco\)/.test(FU) && /yaFresco && yaFresco\.reclutas \? Promise\.resolve\(yaFresco\)/.test(FU),
    "🔴 «¿quién soy?» usa el tablero fresco que la Nave acaba de traer");
  c(/var fresco=motorNuevo\(\)&&!DEMO;\s*SG\.FUENTE\.tablero\(per, fresco\)/.test(REC) && /var ya=st\.dFresco; st\.dFresco=null;/.test(REC),
    "   la Nave lo pide fresco una vez y se lo pasa (solo la primera vez)");
  c(/accion: function \(cuerpo\) \{\s*MEMO = \{\};/.test(FU), "   escribir por la fuente olvida lo guardado");

  // ── 2 · las insignias, en WebP
  const INS = path.join(R, "assets/img/insignias"), pngs = fs.readdirSync(INS).filter(f => /\.png$/.test(f));
  const webps = pngs.map(f => f.replace(/\.png$/, ".webp")).filter(f => fs.existsSync(path.join(INS, f)));
  c(pngs.length > 20 && webps.length === pngs.length, "🔴 las " + pngs.length + " insignias tienen su WebP", webps.length + "/" + pngs.length);
  const pesoPng = pngs.reduce((s, f) => s + fs.statSync(path.join(INS, f)).size, 0), pesoWebp = webps.reduce((s, f) => s + fs.statSync(path.join(INS, f)).size, 0);
  c(pesoWebp < pesoPng / 3, "   y pesan menos de un tercio (" + Math.round(pesoPng / 1048576 * 10) / 10 + " MB → " + Math.round(pesoWebp / 1048576 * 10) / 10 + " MB)");
  const js = fs.readdirSync(path.join(R, "assets/js")).filter(f => /\.js$/.test(f)).map(f => [f, L("assets/js/" + f)]);
  const conPng = js.filter(([f, s]) => /insignias\/['"]\s*\+[^;\n]*?\+\s*['"]\.png/.test(s)).map(x => x[0]);
  c(!conPng.length, "🔴 ninguna página pide ya la insignia en PNG", conPng.join(", "));
  c(/def _derivar_webp\(/.test(L("_build_site.py")) && /_k \+ _ext/.test(L("_build_site.py")), "   el WebP lo deriva la construcción desde el PNG (un dato, un sitio) y comprueba que están");
  c(/class="dot'\+\(on\?'':' off'\)\+'" loading="lazy"/.test(L("assets/js/tablero.js")), "   y los puntitos del tablero esperan a verse (lazy): escondido, no baja nada");

  // los emblemas de escuadrón, NEBULA y Vaeon: su ruta vive en los datos de cada grupo, así que se recomprimen EN SU SITIO
  // (mismo nombre, mismo formato, paleta de 256): nada que migrar. Los originales, en KIT_STARGATE/_originales_web.
  const esc = fs.readdirSync(path.join(R, "assets/img/escuadrones")).filter(f => /\.png$/.test(f));
  const pesoEsc = esc.reduce((s, f) => s + fs.statSync(path.join(R, "assets/img/escuadrones", f)).size, 0);
  c(esc.length >= 10 && pesoEsc < 1.2 * 1048576, "🔴 los " + esc.length + " emblemas, recomprimidos en su sitio (" + Math.round(pesoEsc / 1024) + " KB; eran 3,4 MB)");
  c(["nebula", "vaeon"].every(k => fs.statSync(path.join(R, "assets/img/personajes", k + ".png")).size < 200 * 1024), "   y NEBULA y Vaeon (eran ~500 KB cada una)");

  // ── 3 · media pantalla
  const CSS = L("assets/css/stargate.css");
  c(/function ajustarPestanas\(\)/.test(REC) && /t\.scrollWidth>t\.clientWidth\+1/.test(REC) && /\.nb-tabs\.apretada \.nb-t:not\(\.on\) b\{display:none\}/.test(CSS),
    "🔴 Nave: si las pestañas no caben, se quedan en icono (medido) y ninguna queda escondida");
  c(/addEventListener\('resize',function\(\)\{ cancelAnimationFrame\(rsP\); rsP=requestAnimationFrame\(ajustarPestanas\); \}\)/.test(REC), "   y se vuelve a medir al cambiar la ventana");
  c(/\.nf-arriba \.nave-cifras\{flex:1 1 520px/.test(CSS), "🔴 las cifras de la ficha: las cinco en fila o en su propia fila (nunca 3+2 con hueco)");
  c(/@media\(max-width:1320px\)\{\.ses-tramos\{left:14px;transform:none\}\}/.test(CSS), "🔴 sesión: los tramos no se montan encima de «Emitir en directo» ni de «Herramientas»");

  console.log("\n  Batería 107 · media pantalla y peso");
  console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
  process.exit(fallos.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
