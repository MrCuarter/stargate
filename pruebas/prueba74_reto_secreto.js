'use strict';
/**
 * BATERÍA 74 · EL RETO SECRETO S7: EL FRAGMENTO PROHIBIDO (15-sep) → EL ESCAPE UNI (15-sep, tarde).
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
/**
 * 🔴 15-sep (tarde) · S7 ES EL ESCAPE UNI (Norberto) y se registra con la LLAVE del botón del final del escape. La llave
 * vive FUERA del repositorio (que es PÚBLICO, y assets/descargas/ publica Datos.gs): ~/.config/stargate-mando/llave_s7.txt.
 * Sin ese fichero (otra máquina) se comprueba lo que se puede sin conocerla.
 */
const LLF = path.join(require("os").homedir(), ".config", "stargate-mando", "llave_s7.txt");
const PAL = fs.existsSync(LLF) ? limpia(fs.readFileSync(LLF, "utf8")) : "";
const HUELLA = PAL ? crypto.createHash("sha256").update(PAL).digest("hex") : "";
c(!PAL || PAL.length >= 10, "la llave de S7 es larga (no se adivina)", PAL.length);

// 1 · la huella, en las dos páginas que registran S7, y es la de la llave privada
for (const pg of ["recluta.html", "validar.html"]) {
  const h = leer(pg), x = /window\.SG_SECRETOS=(\{[^;]*\});/.exec(h);
  c(!!x && /^[0-9a-f]{64}$/.test(JSON.parse(x[1]).S7) && (!HUELLA || JSON.parse(x[1]).S7 === HUELLA), pg + " lleva la huella de S7, y es la de la llave", x && x[1]);
  c(/assets\/js\/secreto\.js/.test(h), pg + " carga secreto.js");
}

// 2 · 🔴 la llave NO está en el repositorio (público): ni en Datos.gs (ni en su copia descargable), ni en ninguna página
if (PAL) {
  const { execSync } = require("child_process");
  let hay = "";
  try { hay = execSync("git grep -l -I " + PAL + " -- . || true", { cwd: RAIZ, encoding: "utf8" }).trim(); } catch (e) { hay = String(e.message); }
  c(!hay, "🔴 la llave no aparece en NINGÚN fichero del repositorio (es público)", hay);
  c(!new RegExp(PAL).test(leer("assets/descargas/Datos.gs.txt")), "   ni en la copia descargable de Datos.gs");
}
c(/_LLAVE_S7_F = os\.path\.expanduser\("~\/\.config\/stargate-mando\/llave_s7\.txt"\)/.test(leer("_build_site.py")), "la construcción la lee de fuera del repositorio");

// 3 · la puerta: el enlace escondido de Vínculo (fragmento.html) lleva al Escape UNI, sin nada cifrado
const FR = leer("fragmento.html"), ESC = (/ESCAPE_UNI = "([^"]+)"/.exec(leer("_site_data.py")) || [0, ""])[1];
c(/^https:\/\/view\.genially\.com\//.test(ESC), "el Escape UNI es un Genially", ESC);
c(FR.indexOf(ESC) >= 0 && /Entrar en el Escape UNI/.test(FR), "🔴 fragmento.html es ya la puerta del Escape UNI");
c(!/SG_FRAGMENTO|inscripcion/.test(FR), "   y no lleva ninguna inscripción (cifraría la llave)");
c(/<meta name="robots" content="noindex,nofollow">/.test(FR) && !/class="nav"/.test(FR), "   noindex y sin menú");

// 3b · validar.html acepta la llave del botón del final, y la quita de la barra de direcciones
const VAL = leer("assets/js/validar.js");
c(/get\("llave"\)/.test(VAL) && /sgSecreto:/.test(VAL) && /history\.replaceState/.test(VAL), "🔴 validar.html?reto=S7&llave=… registra S7 (y borra la llave de la barra)");
c(/Escape UNI/.test(VAL) && !/palabra que borró Vaeon/.test(VAL), "   y ya habla del Escape UNI, no del Fragmento");

// 4 · la comparación (secreto.js, con el crypto de verdad)
const ctx = { window: {}, crypto: crypto.webcrypto, TextEncoder, Promise, String, Array, localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
ctx.window.SG_SECRETOS = { S7: HUELLA }; ctx.window.crypto = crypto.webcrypto;
vm.createContext(ctx); vm.runInContext(leer("assets/js/secreto.js"), ctx);
const SX = ctx.window.SG_SECRETO;
const K = PAL || "LLAVEDEPRUEBAX";   // (sin la llave privada, la mecánica se prueba con una de mentira)
if (!PAL) ctx.window.SG_SECRETOS = { S7: crypto.createHash("sha256").update(K).digest("hex") };
const casos = [[K.toLowerCase(), true], [K.charAt(0) + "́" + K.slice(1).toLowerCase() + " Vaeon", true],
               ["la llave es " + K.toLowerCase(), true], ["Vaeon", false], ["ANDER", false], ["", false], [K + "S", false]];
Promise.all(casos.map(([t]) => SX.comprobar("S7", t))).then(rs => {
  casos.forEach(([t, esperado], i) => c(rs[i] === esperado, "comprobar(«" + t + "») → " + esperado, String(rs[i])));
  return SX.cual("S7", "la llave es " + K.toLowerCase());
}).then(p => {
  c(p === K, "cual() devuelve la llave buena aunque no sea la primera", p);
  return SX.comprobar("A1", "lo que sea");
}).then(r => {
  c(r === true, "un reto que no es secreto no pide nada");

  // 5 · la Nave: S7 es la puerta del Escape UNI (se registra solo al final); validar.html pide la llave si no la trae
  const NAVE = leer("assets/js/recluta.js");
  c(/t\[0\]==='S7'&&window\.SG_ESCAPE_UNI/.test(NAVE) && /Entrar en el Escape UNI/.test(NAVE), "🔴 en la Nave, S7 es la puerta del Escape UNI");
  c(/window\.SG_ESCAPE_UNI=/.test(leer("recluta.html")), "   con su dirección puesta por la construcción");
  c(/SG_SECRETO&&SG_SECRETO\.esSecreto\(id\)&&!marcarReto\._palabraOk/.test(NAVE), "   y si alguien lo marcase a mano, sigue pidiendo la llave");
  c(/esSecreto\(RETO\) && !g\.palabraOk\) return pedirPalabra/.test(VAL), "🔴 validar.html sin llave no regala S7");
  c(/SG_SECRETO\.olvidar\(RETO\)/.test(VAL), "   y la olvida al registrar (el ordenador puede ser compartido)");
  c(/fragmento\.html/.test(leer("assets/js/consola.js")) && /Escape UNI/.test(leer("assets/js/consola.js")), "la consola da la puerta escondida para Vínculo (y dice que S7 es el Escape UNI)");

  if (require.main === module) {
    console.log("\n  Batería 74 · el reto secreto S7");
    console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
    fallos.forEach(f => console.log("   ✗ " + f));
    process.exit(fallos.length ? 1 : 0);
  }
});
