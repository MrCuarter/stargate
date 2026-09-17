'use strict';
/**
 * BATERÍA 83 · EL DIPLOMA DE LA TRIPULACIÓN (16-sep-2026).
 *
 * Norberto: «al finalizar la gamificación, un diploma con el alias del jugador, su nombre real, insignias completadas,
 * porcentajes, etc… Un mensaje final del comandante y NEBULA, agradeciendo los servicios. Puede ser el broche de oro».
 * Y eligió: **se descarga desde su Nave** (sin correos), con **nombre real** y **firma de su Capitán**.
 *
 * Lo que se vigila: que salga al acabar el viaje y no antes, que cada cual vea SOLO el suyo, que el nombre real venga de
 * donde tiene que venir (`privado/datos`), que lo que se ve sea lo que se descarga (un lienzo, no una captura), y que se
 * pueda imprimir en A4.
 */
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const RAIZ = path.resolve(__dirname, "..");
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
const D = leer("assets/js/diploma.js"), N = leer("assets/js/recluta.js"),
      CSS = leer("assets/css/diploma.css"), PAG = leer("diploma.html");

// 1 · la página
c(/id="dp-app"/.test(PAG) && /diploma\.js/.test(PAG) && /diploma\.css/.test(PAG), "la página del diploma carga su guion y su hoja");
c(/assets\/js\/motor\.js/.test(PAG), "   y el motor: se entra con Google, como en la batalla");
c(/@media print/.test(CSS) && /size: A4 landscape/.test(CSS), "🔴 se puede imprimir en A4 apaisado (sin menús ni botones)");

// 2 · de dónde salen los datos
c(/where\("projectId", "==", PER\)[\s\S]{0,80}where\("userId", "==", YO\.uid\)/.test(D),
  "🔴 cada cual ve SOLO su diploma: se busca su ficha por su cuenta");
c(/"privado", "datos"/.test(D) && /firstName/.test(D), "🔴 el nombre real viene de `privado/datos` (lo que solo ve esa persona y su equipo docente)");
c(/stargateHitos/.test(D) && /earnedBadges/.test(D) && /completedMissionIds/.test(D) && /stargateSimulador/.test(D),
  "   y el resto, de su ficha: retos, insignias, logros y el Simulador");
c(/SIN_PUA|SP\.hitos/.test(D), "   en PUA cuenta sus 12 logros, no 16");
c(/stargateProfe/.test(D) && /Capitán/.test(D), "🔴 lo firma su Capitán (lo que pidió Norberto)");
c(/codigo:/.test(D) && /slice\(0, 6\)/.test(D), "   y lleva un código corto que lo identifica");

// 3 · lo que se ve es lo que se baja
c(/createElement\("canvas"\)/.test(D) && /toDataURL\("image\/png"\)/.test(D),
  "🔴 el diploma se dibuja en un lienzo y ESE lienzo es el que se descarga (no una captura aparte)");
c(/canvas[\s\S]{0,200}c\.width = W; c\.height = H;/.test(D) && /W = 2000, H = 1414/.test(D), "   a tamaño de imprimir (2000×1414)");
c(/document\.fonts && document\.fonts\.ready/.test(D), "   esperando a las fuentes: si no, el diploma sale con otra letra");
c(/aria-label/.test(D) && /role", "img"/.test(D), "   y con texto alternativo para quien use lector de pantalla");

// 4 · en la Nave
c(/function diplomaCaja\(\)/.test(N) && (N.match(/diplomaCaja\(\)/g) || []).length >= 2, "la Nave lo ofrece al acabar el viaje");
c(/st\.estado!=='fin'/.test(N.replace(/\s/g, "").replace(/'/g, "'")) || /st\.estado!=='fin'/.test(N),
  "🔴 y solo entonces: antes de terminar, ni aparece");
c(/diploma\.html\?per=/.test(N), "   con su enlace");
c(/dip-caja/.test(leer("assets/css/stargate.css")), "   y su estilo");

// 17-sep · las insignias, en filas iguales (Norberto: «que en la fila 1 y en la fila 2 haya el mismo número, o ±1»)
const trozoFilas = D.slice(D.indexOf("  function colocarInsignias"), D.indexOf("  window.SG_DIPLOMA_FILAS"));
let colocar = null; try { colocar = new Function(trozoFilas + "; return colocarInsignias;")(); } catch (e) {}
c(!!colocar, "🔴 el reparto de las insignias es una función que se puede probar");
if (colocar) {
  const ALTO = (1170 - 34 - 14) - (940 + 24), filasDe = (n, r) => Array.from({ length: r.filas }, (_, i) => Math.max(0, Math.min(r.porFila, n - i * r.porFila))).filter(Boolean);
  [5, 12, 17, 22, 23, 27].forEach(n => {
    const r = colocar(n, 2000 - 220, ALTO), fl = filasDe(n, r);
    c(fl.reduce((a, b) => a + b, 0) === n && Math.max(...fl) - Math.min(...fl) <= 1, "   con " + n + " insignias, filas iguales o ±1", fl.join("+"));
    c(r.porFila * (r.lado + r.sep) - r.sep <= 1780 && fl.length * (r.lado + r.sep) - r.sep <= ALTO, "   y caben (en ancho y antes del mensaje del Capitán)", JSON.stringify(r));
  });
  const r22 = colocar(22, 1780, ALTO);
  c(filasDe(22, r22).join("+") === "11+11", "🔴 el caso de su captura (22): 11 y 11, no 20 y 2", filasDe(22, r22).join("+"));
}
c(/\(fila\.porFila - enFila\) \* \(fila\.lado \+ fila\.sep\)\) \/ 2/.test(D), "   la fila corta va centrada bajo la larga");

console.log("\n  Batería 83 · el diploma de la tripulación");
console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
fallos.forEach(f => console.log("   ✗ " + f));
process.exit(fallos.length ? 1 : 0);
