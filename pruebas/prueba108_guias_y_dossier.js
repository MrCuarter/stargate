'use strict';
/**
 * BATERÍA 108 · CADA GUÍA A SU GENTE, LA PORTADA ES UN DOSSIER Y EL MÓVIL (23-sep)
 *
 * Norberto: «la guía del profesorado está para todo el mundo en el pie de la página. Debería aparecer solo al iniciar
 * como docente. Del mismo modo, una guía del estudiante, que aparece al estudiante (y al docente para que la vea). En la
 * página principal, sin iniciar sesión, solo un dossier, sencillo, visual, sobre STARGATE, mencionando la UNIR, pero sin
 * datos del máster ni fechas concretas, quizá en modo presentación».
 *
 * Aquí se EJECUTA la puerta de la guía del recluta (con y sin marca) y se lee lo construido; las fotos a 390 px y el
 * recorrido con clics, en el laboratorio y en pruebas/medir_paginas.cjs --movil.
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };
const visible = h => h.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

// ── 1 · el pie, según quién mira
const INDEX = L("index.html"), REC = L("recluta.html"), GR = L("guia-recluta.html"), STG = L("assets/js/stargate.js");
const pie = h => (h.match(/<footer[\s\S]*?<\/footer>/) || [""])[0];
c(/<span class="solo-docente" hidden> · <a href="guia\.html">Guía del profesorado<\/a><\/span>/.test(pie(INDEX)),
  "🔴 la guía del profesorado nace ESCONDIDA en el pie (la enciende el ser docente)");
c(/<span class="solo-sesion" hidden> · <a href="guia-recluta\.html">Guía del recluta<\/a><\/span>/.test(pie(INDEX)), "   y la del recluta, escondida hasta que alguien entra");
c(!/guia\.html#faq|Guía para docentes/.test(pie(INDEX)), "   ya no hay «Guía para docentes» a la vista de cualquiera");
c(/href="guia-recluta\.html">Guía del recluta/.test(pie(REC)) && /class="solo-docente" hidden/.test(pie(REC)), "   en la Nave del recluta, su guía siempre (y la docente, solo al docente)");
c(!/Máster/.test(pie(INDEX)) && /UNIR/.test(pie(INDEX)), "   el pie dice UNIR y no el máster (sale también en la portada pública)");
c(/\.solo-docente'\),function\(a\)\{ a\.hidden = !doc; \}/.test(STG) && /\.solo-sesion'\),function\(a\)\{ a\.hidden = !\(doc \|\| rec\); \}/.test(STG),
  "   stargate.js los enciende con las marcas del navegador (docente / recluta)");

// ── 2 · la marca del recluta: quién la pone y quién la quita
const ENT = L("assets/js/entrar.js"), MOT = L("assets/js/motor.js"), RJS = L("assets/js/recluta.js");
c(/if \(gs\.length\) \{ try \{ localStorage\.setItem\("sgEsRecluta", "1"\)/.test(ENT), "🔴 la puerta de entrada pone la marca al ver su ficha");
c(ENT.indexOf("if (!ps.length && gs.length && /^guia-recluta\\.html/.test(vuelta)) return ir(vuelta);") >= 0,
  "   y le devuelve a su guía si venía de ella (la única vuelta del alumnado: sin bucle)");
c(/localStorage\.setItem\('sgEsRecluta','1'\)/.test(RJS) && /if\(!DEMO&&!SIMULACRO\)/.test(RJS), "   la Nave también la pone (no en la demo ni en el simulacro)");
c(/removeItem\("sgEsDocente"\); localStorage\.removeItem\("sgEsRecluta"\)/.test(MOT), "   y salir las quita las dos");
c(/href="guia-recluta\.html"><span>Guía del recluta/.test(RJS) && /\(!DEMO\?'<a role="menuitem" href="guia-recluta\.html"/.test(RJS), "   su guía está en el menú «···» de la Nave");

// ── 3 · la puerta de la guía del recluta, ejecutada
function puerta(marcas) {
  const clases = new Set(["cerrado"]), cuerpo = [];
  const raiz = { classList: { remove: k => clases.delete(k), add: k => clases.add(k) }, getAttribute: k => (k === "data-puerta" ? "sesion" : null) };
  const doc = { documentElement: raiz, readyState: "complete", body: { appendChild: n => cuerpo.push(n) }, addEventListener() {},
    getElementById: () => null, createElement: () => ({ set id(v) { this._id = v; }, innerHTML: "" }) };
  const ls = { getItem: k => marcas[k] || null };
  const ctx = { window: { SG: { LOGO_G: "<svg/>" } }, document: doc, localStorage: ls, location: { search: "", pathname: "/guia-recluta.html" }, URLSearchParams };
  vm.createContext(ctx); vm.runInContext(L("assets/js/puerta.js"), ctx);
  return { abierta: !clases.has("cerrado"), html: cuerpo.map(n => n.innerHTML).join("") };
}
const conRecluta = puerta({ sgEsRecluta: "1" }), conDocente = puerta({ sgEsDocente: "1" }), sinNada = puerta({});
c(conRecluta.abierta, "🔴 la guía del recluta se abre a quien tiene la marca de recluta");
c(conDocente.abierta, "   y al docente, para que la vea");
c(!sinNada.abierta && /entrar\.html\?volver=guia-recluta\.html/.test(sinNada.html) && /Iniciar sesión con Google/.test(sinNada.html),
  "   a quien no ha entrado le pide entrar, con la vuelta puesta", sinNada.html.slice(0, 120));
c(/data-puerta","sesion"/.test(GR) && /assets\/js\/puerta\.js/.test(GR), "   (la página la lleva de verdad)");

// ── 4 · la guía del recluta: su cabecera y sus datos, del sitio
const _sd = L("_site_data.py");
const niveles = (_sd.match(/^NIVELES = \[([\s\S]*?)\n\]/m) || ["", ""])[1].match(/\(\s*\d+,\s*\d+,\s*\d,\s*"/g) || [];
c(/<span class="modo recluta">Recluta<i> · alumnado<\/i><\/span>/.test(GR) && /<a class="lnk" href="entrar\.html">Mi nave<\/a>/.test(GR) && !/tour-start/.test(GR),
  "🔴 la guía del recluta lleva la cabecera del alumnado (sin menú ni visita guiada del profesorado)");
c((GR.match(/<tr><td class="num">\d+<\/td><td><b>[^<]+<\/b> <span class="muted">· /g) || []).length === niveles.length && niveles.length === 10,
  "   los niveles salen del sitio (" + niveles.length + ")");
const tope = (_sd.match(/^TOPE_RETOS_SEMANA = (\d+)/m) || [])[1];
c(tope && new RegExp("como mucho <b>" + tope + "</b>").test(GR), "   el tope de retos por semana también (" + tope + ")");
const imgs = [...new Set((GR + INDEX).match(/assets\/img\/capturas\/[a-z-]+\.webp/g) || [])];
c(imgs.length >= 12 && imgs.every(f => fs.existsSync(path.join(R, f))), "🔴 todas las capturas que piden la guía y el dossier existen (" + imgs.length + ")",
  imgs.filter(f => !fs.existsSync(path.join(R, f))).join(", "));
c(/capturas\/nave\.webp\?v=[0-9a-f]{8}/.test(GR), "   con su huella (?v=), que el CDN guarda las fotos siete días");
c(/href="guia-recluta\.html">La guía de tu alumnado/.test(L("guia.html")), "   y la guía del profesorado enlaza la del alumnado");
c(/const SALIDA = path\.join\(WEB, "assets", "img", "capturas"\)/.test(L("pruebas/capturas_recluta.cjs")) && /"--escuela"/.test(L("pruebas/capturas_recluta.cjs")),
  "   las capturas las rehace pruebas/capturas_recluta.cjs, en la Nave Escuela (sin nombre del máster)");

// ── 5 · la portada es un dossier
const vis = visible(INDEX);
const dz = INDEX.match(/<section class="dz[^"]*" id="[a-z]+"/g) || [];
c(dz.length === 11 && /<nav class="dz-puntos"/.test(INDEX) && /assets\/js\/dossier\.js/.test(INDEX), "🔴 la portada es un dossier de 11 diapositivas, con sus puntos y su script", dz.length);
c(/UNIR/.test(vis) && !/Máster|máster/.test(vis), "🔴 menciona la UNIR y no el máster");
c(!/\b(20\d\d)\b/.test(vis) && !/\bsemana \d+\b/i.test(vis) && !/\b\d{1,2} de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/i.test(vis),
  "   sin fechas concretas");
c(!/Genially|Magnific|OpenArt|ElevenLabs|\bClaude\b/.test(vis), "   ni herramientas (eso vive en «Cómo se hizo»)");
c(!/href="(consola|crear|gestion)\.html"/.test(INDEX), "   ni la zona del profesorado: se entra, y la puerta reparte");
c((INDEX.match(/href="entrar\.html" data-dz-entrar/g) || []).length === 2, "   con la puerta de entrada al principio y al final");
const DJ = L("assets/js/dossier.js");
c(/ArrowRight/.test(DJ) && /ArrowLeft/.test(DJ) && /requestFullscreen/.test(DJ) && /IntersectionObserver/.test(DJ), "   modo presentación: flechas, pantalla completa y puntos que siguen la diapositiva");
c(/sgEsDocente/.test(DJ) && /Ir a mi Nave/.test(DJ), "   y a quien ya entró, el botón le dice «Ir a mi Nave»");
const CSS = L("assets/css/stargate.css");
c(/html\.con-dossier\{scroll-snap-type:y proximity/.test(CSS) && /\.dossier \.dz\{scroll-margin-top:0\}/.test(CSS), "   se pasa deslizando (scroll-snap) y cada diapositiva cae en su sitio");
c(/html\.con-dossier:fullscreen \.nav,html\.con-dossier:fullscreen footer\{display:none\}/.test(CSS), "   a pantalla completa, sin barra ni pie");
c(/tarjetas\/P1_bran_carta\.webp/.test(INDEX) && fs.existsSync(path.join(R, "assets/img/tarjetas/P1_bran_carta.webp")), "   las cartas de la Tripulación, en WebP derivado");

// ── 6 · el móvil (390 px)
c(/\.podium\{grid-template-columns:minmax\(0,1fr\) minmax\(0,1\.15fr\) minmax\(0,1fr\)\}/.test(CSS), "🔴 móvil: el podio ya no se sale");
c(/@media\(max-width:720px\)\{\s*\.mazo \.nav\{top:8px;transform:none/.test(CSS) && /\.ses-directo \.sd-mas\{display:none\}/.test(CSS),
  "   las flechas de la sesión suben a la esquina y «Emitir» se acorta: ya no tapan el texto");
c(/\.cn-ficha-b\{min-width:0\}/.test(CSS), "   la ficha del docente ya no corta «Mando manual» ni el desplegable");
c(/\.nf-arriba \.nave-cifras\{grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/.test(CSS), "   las cifras del recluta, las cinco en una fila");
c(/\.guia-sub\{position:sticky;top:var\(--nav-h,54px\)/.test(CSS) && /--nav-h/.test(STG), "   el índice de las guías se pega DEBAJO de la barra (antes se escondía bajo ella)");
c(/#nave-app section\.nave-ficha\{padding:22px\}/.test(CSS), "   y la ficha del recluta recupera su margen (NEBULA y la carrera iban pegadas al borde)");

console.log("\n  Batería 108 · guías por rol, dossier y móvil");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
