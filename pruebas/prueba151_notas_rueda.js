'use strict';
/**
 * BATERÍA 151 · LAS NOTAS, EDITABLES EN LA RUEDA (19-oct-2026). Norberto: «en la rueda de “Clases”, que cada miniatura lleve sus notas
 * y se puedan editar, con “Volver al texto original”». En STARGATE la rueda («Configurar las diapositivas») va por secciones; abierta
 * desde la clase, debajo, una tarjeta por diapositiva de ESA clase con sus notas (GamificaPro sdk/mazo.js, GP.mazo.notasRejilla).
 *
 * Qué se demuestra (leyendo el código; cómo se ve, en el banco del navegador):
 *   1. la pieza es la de GamificaPro, copiada igual, y la carga sesion.html (con su huella);
 *   2. sesion.js le pasa a la rueda las notas de cada docente (GP.notas: efectivo, guardarMia; «Volver al texto original» = sin líneas),
 *      con la clave de la clase (claveSes) y sin repetir diapositivas; y escucha el perfil una sola vez para las dos cosas;
 *   3. stargate.js solo la pinta si se la pasan (desde la consola, la rueda sigue igual) y la quita al cerrar;
 *   4. la piel: los colores de la Nave y el título visible dentro de la rueda.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + JSON.stringify(dato).slice(0, 300))); };

const GP = process.env.GAMIFICAPRO_DIR || "/Users/nor/Claude/vibewebs/gamificapro";
const MAZO = L("assets/js/mazo.js"), SES = L("assets/js/sesion.js"), SG = L("assets/js/stargate.js"), CSS = L("assets/css/stargate.css"), HTML = L("sesion.html");

console.log("  1 · la pieza");
c(/function notasRejilla\(caja, o\)/.test(MAZO) && /notasRejilla: notasRejilla/.test(MAZO), "mazo.js trae GP.mazo.notasRejilla");
const sdk = path.join(GP, "sdk", "mazo.js");
if (fs.existsSync(sdk) && /notasRejilla/.test(fs.readFileSync(sdk, "utf8"))) c(fs.readFileSync(sdk, "utf8") === MAZO, "es la de GamificaPro, byte a byte (no se edita aquí)");
c(/<script src="assets\/js\/mazo\.js\?v=[0-9a-f]+" defer><\/script>/.test(HTML), "sesion.html la carga, con su huella");
c(HTML.indexOf("assets/js/mazo.js") < HTML.indexOf("assets/js/sesion.js"), "antes que sesion.js");

console.log("  2 · sesion.js");
c(/verSesion:false, notas:notasRueda\(\)/.test(SES), "la rueda abierta desde la clase lleva las notas");
const NR = (SES.match(/function notasRueda\(\)\{[\s\S]*?\n  \}/) || [""])[0];
c(/st\.alumno/.test(NR) && /oirPerfil\(\)/.test(NR), "solo para el docente, y escuchando su perfil", NR.slice(0, 200));
c(/vistas\[sl\.k\]/.test(NR), "sin repetir diapositivas (una por clave)");
c(/guardarMia\(claveSes\(\), it\.k, lin, guionPorDefecto\(it\.sl\)\)/.test(NR), "«Guardar»: las suyas, con la clave de la clase y la huella del original");
c(/guardarMia\(claveSes\(\), it\.k, \[\], guionPorDefecto\(it\.sl\)\)/.test(NR), "«Volver al texto original»: sin líneas (quita las suyas)");
c(/guionDe\(it\.sl\)/.test(NR) && /propias:!!e\.propio/.test(NR), "lo que se ve es lo que proyecta (GP.notas.efectivo)");
c((SES.match(/escucharPerfil\(/g) || []).length === 1, "el perfil se escucha en un solo sitio (oirPerfil)");
c(/NOTAS\.rueda\.rejilla\.alDia\(\)/.test(SES), "y al cambiar, la rueda al día");

console.log("  3 · stargate.js");
c(/o\.notas && window\.GP && window\.GP\.mazo && window\.GP\.mazo\.notasRejilla \?/.test(SG), "solo si se la pasan (la de la consola, igual)");
c(/notasRejilla\(capa\.querySelector\("\.m-notas-r"\), \{ items: o\.notas\.items, notas: o\.notas \}\)/.test(SG), "con las diapositivas y las notas");
c(/var cerrar = function \(\) \{ if \(notas\) notas\.quitar\(\);/.test(SG), "y se quita al cerrar");

console.log("  4 · la piel");
c(/\.cfg-caja \.m-notas h3\{display:block/.test(CSS), "el título se ve (las demás tarjetas de la rueda lo esconden)");
c(/\.m-notas,\.gpm-nvelo\{--gpm-acento:var\(--teal\)/.test(CSS), "con los colores de la Nave, también en la ventana");

console.log("\n  " + ok + " comprobaciones bien" + (fallos.length ? ", " + fallos.length + " mal" : ""));
process.exit(fallos.length ? 1 : 0);
