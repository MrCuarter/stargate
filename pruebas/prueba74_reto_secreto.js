'use strict';
/**
 * BATERÍA 74 · EL RETO SECRETO S7, «EL FRAGMENTO PROHIBIDO» (15-sep-2026).
 *
 * «En la presentación del planeta Vínculo hay un enlace que no debería estar ahí. Encuéntralo,
 * resuelve el enigma que esconde y trae la PALABRA que Vaeon borró.» En el motor nuevo nadie pedía
 * la palabra: S7 se regalaba con un clic. Esta batería vigila:
 *   · que la huella que viaja a la web es la de la palabra de Datos.gs (un dato, un sitio);
 *   · que el enigma es resoluble: la inscripción se descifra con el número del planeta Vínculo;
 *   · que la palabra no está escrita en claro en el enigma ni en la pieza que la comprueba;
 *   · que la comparación acepta la palabra entre otras y con tildes, y rechaza lo demás;
 *   · que la Nave y validar.html la piden, y que el enigma no sale en los buscadores.
 */
const fs = require("fs"), path = require("path"), vm = require("vm"), crypto = require("crypto");
const RAIZ = path.resolve(__dirname, "..");
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");

const limpia = p => p.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z]/g, "");
const m = /var PALABRA_HUEVO\s*=\s*"([^"]+)"/.exec(leer("apps-script/Datos.gs"));
c(!!m, "la palabra vive en Datos.gs (PALABRA_HUEVO)");
const PAL = m ? limpia(m[1]) : "";
const HUELLA = crypto.createHash("sha256").update(PAL).digest("hex");

// 1 · la huella, en las tres páginas que la usan, y es la de Datos.gs
for (const pg of ["recluta.html", "validar.html", "fragmento.html"]) {
  const h = leer(pg), x = /window\.SG_SECRETOS=(\{[^;]*\});/.exec(h);
  c(!!x && JSON.parse(x[1]).S7 === HUELLA, pg + " lleva la huella de S7, y es la de la palabra de Datos.gs", x && x[1]);
  c(/assets\/js\/secreto\.js/.test(h), pg + " carga secreto.js");
}

// 2 · el enigma es resoluble: la inscripción, desplazada hacia atrás tantas letras como el número de Vínculo
const F = JSON.parse((/window\.SG_FRAGMENTO=(\{[^;]*\});/.exec(leer("fragmento.html")) || [0, "{}"])[1]);
const planetas = /PLANETAS=\[([\s\S]*?)\]\n/.exec(leer("_build_site.py"));
const nVinculo = planetas ? planetas[1].match(/\("p\d_[a-z]+"/g).map(x => x.slice(2, -1)).indexOf("p7_vinculo") + 1 : 0;
c(F.paso === nVinculo && nVinculo === 7, "el paso del sello es el número del planeta Vínculo (7): la pista del telar", F.paso + " / " + nVinculo);
const descifra = (t, k) => t.split("").map(ch => String.fromCharCode((ch.charCodeAt(0) - 65 - k + 260) % 26 + 65)).join("");
c(!!F.inscripcion && descifra(F.inscripcion, F.paso) === PAL, "🔴 la inscripción del sello se descifra con ese paso y da la palabra", F.inscripcion);
c(F.inscripcion !== PAL, "y la inscripción no es la palabra en claro");
c(F.xp > 0 && /Vaeon/.test(F.insignia || ""), "la revelación dice lo que se gana (xp e insignia)", JSON.stringify(F));

// 3 · la palabra no está escrita en claro donde se juega y se comprueba
const re = new RegExp("\\b" + PAL + "\\b", "i");
for (const f of ["fragmento.html", "assets/js/fragmento.js", "assets/js/secreto.js", "assets/js/validar.js"]) {
  c(!re.test(leer(f)), "🔴 «" + f + "» no lleva la palabra escrita");
}

// 4 · la comparación (secreto.js, con el crypto de verdad)
const ctx = { window: {}, crypto: crypto.webcrypto, TextEncoder, Promise, String, Array, localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
ctx.window.SG_SECRETOS = { S7: HUELLA }; ctx.window.crypto = crypto.webcrypto;
vm.createContext(ctx); vm.runInContext(leer("assets/js/secreto.js"), ctx);
const SX = ctx.window.SG_SECRETO;
const casos = [[PAL.toLowerCase(), true], [PAL.charAt(0) + "́" + PAL.slice(1).toLowerCase() + " Vaeon", true],
               ["el nombre es " + PAL.toLowerCase(), true], ["Vaeon", false], ["", false], [PAL + "S", false]];
Promise.all(casos.map(([t]) => SX.comprobar("S7", t))).then(rs => {
  casos.forEach(([t, esperado], i) => c(rs[i] === esperado, "comprobar(«" + t + "») → " + esperado, String(rs[i])));
  return SX.cual("S7", "el nombre es " + PAL.toLowerCase());
}).then(p => {
  c(p === PAL, "cual() devuelve la palabra buena aunque no sea la primera", p);
  return SX.comprobar("A1", "lo que sea");
}).then(r => {
  c(r === true, "un reto que no es secreto no pide nada");

  // 5 · la Nave y validar.html la piden; el enigma, fuera de los buscadores y sin menú
  const NAVE = leer("assets/js/recluta.js"), VAL = leer("assets/js/validar.js"), FR = leer("fragmento.html");
  c(/SG_SECRETO&&SG_SECRETO\.esSecreto\(id\)&&!marcarReto\._palabraOk/.test(NAVE), "🔴 la Nave pide la palabra antes de registrar S7");
  c(/placeholder="La palabra que borró Vaeon"/.test(NAVE), "y su casilla dice qué pide (no un enlace)");
  c(/var evidencia=secreto\?'':/.test(NAVE), "y la palabra no se guarda como evidencia");
  c(/esSecreto\(RETO\) && !g\.palabraOk\) return pedirPalabra/.test(VAL), "🔴 validar.html también la pide (el enlace universal ya no regala S7)");
  c(/SG_SECRETO\.olvidar\(RETO\)/.test(VAL), "y la olvida al registrar (el ordenador puede ser compartido)");
  c(/<meta name="robots" content="noindex,nofollow">/.test(FR) && !/class="nav"/.test(FR), "fragmento.html: noindex y sin menú");
  c(/fragmento\.html/.test(leer("assets/js/consola.js")), "la consola da el enlace para esconderlo en Vínculo");

  if (require.main === module) {
    console.log("\n  Batería 74 · el reto secreto S7");
    console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
    fallos.forEach(f => console.log("   ✗ " + f));
    process.exit(fallos.length ? 1 : 0);
  }
});
