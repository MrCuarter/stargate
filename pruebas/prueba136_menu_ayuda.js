'use strict';
/**
 * BATERÍA 136 · «AYUDA ▾» Y LAS GUÍAS (7-oct)
 *
 * Norberto: «Las secciones de ayuda están creciendo mucho. En el menú superior del docente aparece Academia, En claro más el
 * botón de soporte. ¿No es lioso? ¿Y si ponemos en el menú "Ayuda" y al pulsar o pasar el ratón se despliegan todas las
 * opciones?». Y: «En claro y Guía… quizá pudieran compartir una página en la que hubiera dos botones con fotos de personajes».
 * Arriba quedan «Mi nave», «Gestionar grupos» (al referente) y «Ayuda ▾» (Academia · Guías · Escribir al Mando); el alumnado,
 * «Ayuda ▾» con lo suyo. El desplegable es del motor (GamificaPro sdk/menu.js): aquí se copia y se viste. Lo que se comprueba:
 * que NINGÚN sitio al que llevaba el menú viejo se pierde, que cada lado ve solo su ayuda, que la pieza es la del motor y
 * que se carga con su huella donde hace falta. Cómo se abre (ratón, dedo, teclado), en las pruebas de la pieza
 * (GamificaPro tests/sdk/menu.test.ts) y en el navegador.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + JSON.stringify(dato))); };

const B = L("_build_site.py"), CSS = L("assets/css/stargate.css"), TOUR = L("assets/js/tour.js"), REC = L("assets/js/recluta.js");
const MENU = L("assets/js/menu.js");
const paginas = fs.readdirSync(R).filter(f => f.endsWith(".html"));
const barra = h => (h.match(/<nav class="nav">([\s\S]*?)<\/nav>/) || ["", ""])[1];
const enlaces = h => (h.match(/href="[^"]+"/g) || []).map(x => x.slice(6, -1));
const opciones = h => { const m = h.match(/<div class="gpm-lista"[^>]*>([\s\S]*?)<\/div><\/div>/); return m ? m[1] : ""; };
const docentes = paginas.filter(f => /<span class="modo docente">/.test(barra(L(f))));
const reclutas = paginas.filter(f => /<span class="modo recluta">/.test(barra(L(f))));

console.log("  La pieza es del motor");
const GP = [process.env.GAMIFICAPRO_DIR, "/Users/nor/Claude/vibewebs/gamificapro"].filter(Boolean).map(d => path.join(d, "sdk", "menu.js")).find(f => fs.existsSync(f));
if (GP) c(fs.readFileSync(GP, "utf8") === MENU, "assets/js/menu.js es GamificaPro sdk/menu.js tal cual (no se edita aquí)", GP);
else console.log("   (sin GamificaPro al lado con sdk/menu.js: la copia no se compara)");
c(/GAMIFICAPRO · EL MENÚ DESPLEGABLE/.test(MENU) && /window\.GP\.menu = \{/.test(MENU) && !/stargate|recluta|comandante|nebula/i.test(MENU.replace(/\/\*\*[\s\S]*?\*\//, "")),
  "   y es la pieza sin piel (ni textos ni nombres de STARGATE en su código)");
c(/def _traer_menu\(\):/.test(B) && /os\.environ\.get\("GAMIFICAPRO_DIR"\)/.test(B) && B.indexOf("_traer_menu()") < B.indexOf("def head("),
  "el build la trae (de GAMIFICAPRO_DIR o de la carpeta de al lado) antes de escribir ninguna página");

console.log("  El profesorado: Mi nave · Gestionar grupos · Ayuda ▾ (Academia · Guías · Escribir al Mando)");
c(docentes.length >= 25, "las páginas del profesorado", docentes.length);
const malDoc = docentes.filter(f => {
  const n = barra(L(f)), o = opciones(n), arriba = n.replace(/<div class="gpm[\s\S]*<\/div><\/div>/, "");
  return !(/<a class="lnk[^"]*" href="consola\.html">Mi nave<\/a>/.test(arriba) && /<a class="lnk solo-referente[^"]*" href="gestion\.html" hidden>Gestionar grupos<\/a>/.test(arriba)
    && /<div class="gpm gpm-derecha( gpm-activo)?" data-gpm id="nav-ayuda"><button type="button" class="gpm-boton" aria-haspopup="true" aria-expanded="false" aria-controls="nav-ayuda-lista">Ayuda <span class="gpm-flecha" aria-hidden="true">▾<\/span><\/button><div class="gpm-lista" id="nav-ayuda-lista" role="menu" hidden>/.test(n)
    && JSON.stringify(enlaces(o)) === JSON.stringify(["academia.html", "guias.html", "buzon.html?desde=menu"])
    && !/href="(academia|guia|en-claro|guias|buzon)\.html/.test(arriba));
});
c(!malDoc.length, "🔴 en TODAS, arriba solo Mi nave y Gestionar grupos, y la ayuda dentro de «Ayuda ▾», en ese orden", malDoc);
c(/role="menuitem" tabindex="-1" href="guias\.html" data-gpm-paginas="guia\.html en-claro\.html">Guías<span class="gpm-sub">/.test(L("consola.html")),
  "   «Guías» cubre la Guía y En claro (encendida también allí)");
const encendida = { "academia.html": "academia.html", "guias.html": "guias.html", "guia.html": "guias.html", "en-claro.html": "guias.html", "buzon.html": "buzon.html?desde=menu" };
const malAct = Object.keys(encendida).filter(f => !(new RegExp('href="' + encendida[f].replace(/[.?]/g, "\\$&") + '"[^>]*aria-current="page"').test(L(f)) && /class="gpm gpm-derecha gpm-activo"/.test(L(f))));
c(!malAct.length, "   y en cada una de sus páginas, su opción y «Ayuda» salen encendidas", malAct);
c(!/class="gpm gpm-derecha gpm-activo"/.test(L("consola.html")) && !/aria-current/.test(opciones(barra(L("consola.html")))), "   en «Mi nave», no");

console.log("  Ningún sitio se pierde");
const antes = ["consola.html", "gestion.html", "academia.html", "guia.html", "en-claro.html", "buzon.html"];
const desdeMenu = new Set(enlaces(barra(L("consola.html"))).map(h => h.split("?")[0]));
enlaces(L("guias.html").replace(/<nav[\s\S]*?<\/nav>/, "").replace(/<footer[\s\S]*$/, "")).forEach(h => desdeMenu.add(h.split("?")[0]));
const perdidos = antes.filter(h => !desdeMenu.has(h));
c(!perdidos.length, "🔴 todo lo que tenía el menú viejo (y el buzón) sigue a uno o dos clics: directo o por las Guías", perdidos);
c(antes.every(f => fs.existsSync(path.join(R, f))), "   y las páginas siguen ahí (los enlaces viejos a guia.html y en-claro.html no se rompen)");

console.log("  Las Guías (guias.html): la rápida o la completa");
const G = L("guias.html");
const tarjetas = G.match(/<div class="gpt-celda"><a class="gpt-tarjeta card gs-tarjeta" href="[^"]+">[\s\S]*?<\/a><\/div>/g) || [];
c(tarjetas.length === 2 && /href="en-claro\.html"/.test(tarjetas[0]) && /href="guia\.html"/.test(tarjetas[1]), "dos tarjetas: la rápida (En claro) y la completa (la Guía)", tarjetas.length);
const fotos = tarjetas.map(t => (t.match(/<img src="([^"?]+)/) || [])[1]);
c(fotos.length === 2 && fotos.every(f => f && fs.existsSync(path.join(R, f))) && fotos[0] !== fotos[1], "   cada una con su personaje (imágenes que ya existen: el Capitán y NEBULA)", fotos);
c(tarjetas.every(t => /<span class="kicker">La guía (rápida|completa)<\/span><b class="gs-t">[^<]+<\/b><span class="gs-que">[^<]{40,}<\/span><span class="btn primary gs-btn gpt-pie">Abrir la guía (rápida|completa) →<\/span>/.test(t)),
  "   su título, una línea de qué hay dentro y su botón");
c(/class="gpt-rejilla gs-rejilla"/.test(G) && /assets\/js\/tarjetas\.js\?v=[0-9a-f]{10}/.test(G), "   tarjetas iguales (la norma: GamificaPro sdk/tarjetas.js, cargada)");
c(/<title>STARGATE · Las guías<\/title>/.test(G) && /classList\.add\("cerrado"\)/.test(G), "   tras la puerta del profesorado, como la Guía y En claro");
c(/\.gs-foto\{[^}]*height:250px/.test(CSS) && /@media \(max-width:620px\)\{[^\n]*\.gs-foto\{height:190px\}/.test(CSS), "   y en el móvil, más bajitas (una debajo de otra)");

console.log("  El alumnado: SU ayuda, nunca la del profesorado");
c(reclutas.indexOf("recluta.html") >= 0 && reclutas.indexOf("guia-recluta.html") >= 0 && reclutas.indexOf("ayuda.html") >= 0, "la Nave, la guía del recluta y «Cómo comparto mi evidencia»", reclutas);
const malRec = reclutas.filter(f => {
  const o = opciones(barra(L(f)));
  return !(JSON.stringify(enlaces(o)) === JSON.stringify(["guia-recluta.html", "ayuda.html"])
    && /<button type="button" role="menuitem" tabindex="-1" data-gpm-pulsa="#neb-ayuda-b" hidden>Pregunta a NEBULA<span class="gpm-sub">/.test(o)
    && !/(academia|guias|guia|en-claro|buzon|consola|gestion)\.html/.test(barra(L(f))));
});
c(!malRec.length, "🔴 «Ayuda ▾»: la Guía del recluta, Cómo comparto mi evidencia y Pregunta a NEBULA; ni una página del profesorado", malRec);
c(/b\.id='neb-ayuda-b'/.test(REC), "   «Pregunta a NEBULA» pulsa el botón flotante de la Nave (#neb-ayuda-b), que sigue llamándose así");
c(/data-gpm-pulsa/.test(MENU) && /o\.hidden = !seVe\(t\)/.test(MENU), "   y fuera de la Nave (o sin su chat) la opción no sale: lo decide la pieza al abrir");
c(/"ayuda", alumno=True\)/.test(B) && !/classList\.add\("cerrado"\)/.test(L("ayuda.html")),
  "«Cómo comparto mi evidencia» lleva ya la barra del alumnado, y sigue abierta sin cuenta");

console.log("  Se carga donde hace falta, con su huella");
const conMenu = paginas.filter(f => /data-gpm/.test(L(f)));
const sinJs = conMenu.filter(f => !/<script src="assets\/js\/menu\.js\?v=[0-9a-f]{10}" defer><\/script>/.test(L(f)));
c(conMenu.length >= 30 && !sinJs.length, "toda página con «Ayuda ▾» carga assets/js/menu.js con su ?v=", { con: conMenu.length, sinJs });
const publicas = ["index.html", "entrar.html", "privacidad.html", "comosehizo.html"];
c(publicas.every(f => !/data-gpm|assets\/js\/menu\.js/.test(L(f))), "la portada y las páginas públicas, sin menú de ayuda (ni su JS)");

console.log("  La visita guiada y la piel");
c(/sel:'#nav-ayuda \.gpm-boton'/.test(TOUR) && /Ayuda ▾ → Guías/.test(TOUR) && !/sel:'\.lnk\[href="(guia|academia|en-claro)\.html"\]'/.test(TOUR),
  "🔴 el Capitán señala «Ayuda ▾» para ir a la Guía (el enlace «Guía» de arriba ya no existe)");
c(/\.nav\{--gpm-fondo:/.test(CSS) && /\.nav \.gpm-boton\{color:var\(--mut\);font-size:\.82rem/.test(CSS) && /\.nav \.gpm\.gpm-activo \.gpm-boton\{color:var\(--teal\)/.test(CSS),
  "el botón se viste como un enlace más de la barra (y encendido, como el activo)");
c(/@media \(max-width:480px\)\{\.nav:has\(\.gpm\) \.brand \.modo\{display:none\}\}/.test(CSS) && /\.nav \.gpm~\.nb-id\{margin-left:0\}/.test(CSS),
  "en el móvil cabe sin deslizar (la marca «Comandante»/«Recluta» se esconde) y en la Nave va junto a tu identidad");
const chicas = (CSS.slice(CSS.indexOf("«AYUDA ▾»")).match(/font-size:\.(\d+)rem/g) || []).map(x => parseFloat("0." + x.match(/\.(\d+)/)[1])).filter(x => x * 16 < 12);
c(!chicas.length, "   nada por debajo de 12 px", chicas);

// 🔴 9-oct · LA ACADEMIA, SOLO A QUIEN NORBERTO HA AUTORIZADO (un estudiante la vio en «Ayuda ▾» y se registró como docente)
{
  const paginas = fs.readdirSync(R).filter(f => f.endsWith(".html"));
  const conAcademia = paginas.filter(f => /<a role="menuitem"[^>]*href="academia\.html"/.test(L(f)));
  const sinOcultar = conAcademia.filter(f => !/<a role="menuitem" tabindex="-1" href="academia\.html"[^>]*data-solo-academia hidden>/.test(L(f)));
  c(conAcademia.length > 0 && !sinOcultar.length, "🔴 9-oct · «Academia» nace OCULTA en el menú de todas las páginas (" + conAcademia.length + ")", sinOcultar);
  c(/<div class="card" data-solo-academia hidden><h3>[^<]*<img[^>]*> La Academia de la Cero/.test(L("guia.html")), "   y la tarjeta «Ir a la Academia» de la guía, también");
  const SGJ = L("assets/js/stargate.js"), MOTJ = L("assets/js/motor.js");
  c(/getItem\('sgEnAcademia'\)==='1'/.test(SGJ) && /querySelectorAll\('\[data-solo-academia\]'\),function\(a\)\{ a\.hidden = !aca; \}/.test(SGJ),
    "   se enciende solo con sgEnAcademia (stargate.js)");
  c(/addEventListener\('sg:sesion'/.test(SGJ) && /M\.academiaMia\(\)\.then\(function\(d\)\{ poner\(!!\(d && d\.bendicion\)\); \}/.test(SGJ) && /SG_ACADEMIA_ORGANIZA/.test(SGJ)
    && /if\(!yo \|\| !yo\.uid\) return poner\(false\)/.test(SGJ), "   y sgEnAcademia = su ficha de formación CON la bendición del Comandante, o quien organiza (sin sesión, no)");
}

console.log("\n  Batería 136 · «Ayuda ▾» y las guías");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
