'use strict';
/**
 * Batería 97 · LA REGLA DEL AIRE (19-sep). Norberto: «no hago más que repetir que debemos reducir el aire… elabora
 * posibles soluciones y pregúntame la que más me gusta». Eligió, entre cuatro dibujadas, rejilla de tres en «Mi nave» y
 * filas plegadas en «Mis retos»; y la regla para toda la web, con una comprobación que mide los huecos.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const leer = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt); };

const N = leer("assets/js/recluta.js"), CSS = leer("assets/css/stargate.css"), AIRE = leer("pruebas/medir_aire.js"), FOTO = leer("pruebas/fotografo.cjs");

// la ficha de reto, en sus dos formas
c(/function tarjetaReto\(t, mios, modo\)/.test(N) && /modo = modo==='fila' \? 'fila' : 'ficha'/.test(N), "🔴 la ficha de reto tiene dos formas: «ficha» (Mi nave) y «fila» (Mis retos)");
c(/tarjetaReto\(t, mios\)/.test(N) && /tarjetaReto\(r, mios, 'fila'\)/.test(N), "   Mi nave usa la ficha y Mis retos la fila");
c(/summary class="rs-fila">'\+miniPremio\(t\[2\]\)/.test(N), "   la fila: insignia pequeña, estado, título y premio en una línea");
c(/<div class="rs-det-cols"><div class="rs-det-main">/.test(N) && /<\/div><div class="rs-der">'\+premioDeReto\(t\[2\]\)\+'<\/div><\/div>'/.test(N),
  "   abierta, la insignia en grande al lado de los pasos (donde hay texto que la acompañe)");
c(!/<div class="rs-der">'\+premioDeReto\(t\[2\]\)\+'<\/div><\/div><\/summary>'/.test(N), "🔴 la insignia grande YA NO va en la cabecera (marcaba la altura y empujaba los botones)");
c(/\.rs-mini\{width:64px;height:64px/.test(CSS) && /\.reto-sem\.fila \.rs-mini\{width:48px;height:48px\}/.test(CSS), "   insignias a 64 px en la ficha y 48 en la fila");
c(/\.rs-grid\.rs-filas\{grid-template-columns:minmax\(0,1fr\)/.test(CSS), "   Mis retos, una fila debajo de otra");

// el barrido: Mi botín y el Mercado
c(/\.ins-temas,\.ab-cubiertas\{align-items:start\}/.test(CSS), "🔴 Mi botín: cada tema de insignias mide lo suyo (tenía hasta 170 px en blanco)");
c(/\.grid\.nave-rec\{align-items:start\}/.test(CSS) && /\.nave-rec \.rec-card \.rec-pie\{margin-top:0\}/.test(CSS), "🔴 Mercado Estelar: el botón de canjear pegado a su ficha, no empujado al fondo");

// el medidor
c(/var UMBRAL = 40/.test(AIRE) && /abajo, tras/.test(AIRE) && /dentroDeCaja/.test(AIRE), "🔴 el medidor de aire: huecos de más de 40 px dentro de una caja, arriba, entre y abajo");
c(/cada elemento, con SUS hijos/.test(AIRE), "   mide cada columna por separado (una imagen al lado no tapa el hueco del texto)");
c(/medir_aire\.js/.test(FOTO) && /aire \(huecos de más de 40 px dentro de una caja\)/.test(FOTO), "   y el fotógrafo del laboratorio lo pasa en cada pantalla, en escritorio y en móvil");

console.log("\n  Batería 97 · la regla del aire (19-sep)");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
