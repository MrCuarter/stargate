'use strict';
/**
 * BATERÍA 94 · LA PUERTA Y LOS CURSOS TERMINADOS (19-sep).
 *
 * Norberto, probando: «PRUEBA · SEMANA 16 no existe, está borrada, pero sigue apareciendo». No estaba borrada: es un
 * curso TERMINADO, y la consola lo guarda en un cajón plegado al final («yo, como profe referente, no lo veo»). Y el
 * botón de borrar pedía escribir su nombre exacto, con un «·» que no está en el teclado. Además: «resaltado y en grande
 * el nombre del grupo; debajo, Recluta y la fecha de inicio. El 99 % solo va a tener un grupo». Y: «me parece bien que
 * un estudiante pueda acceder a un grupo terminado».
 */
const fs = require("fs"), path = require("path");
const RAIZ = path.resolve(__dirname, "..");
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
const MOTOR = leer("assets/js/motor.js"), ENTRAR = leer("assets/js/entrar.js"), CONS = leer("assets/js/consola.js"), CSS = leer("assets/css/stargate.css");

// ── 1 · la puerta: el nombre del grupo manda
c(/estado: estadoDelPER\(p\.data\(\)\.stargate\)\.estado/.test(MOTOR) && /inicio: p\.data\(\)\.stargate\.inicio/.test(MOTOR),
  "🔴 motor · cada grupo del recluta trae su fecha de inicio y su estado (la misma cuenta que la consola)");
c(/"<b>" \+ esc\(g\.nombreGrupo \|\| nombreDe\(g\.per\)\) \+ "<\/b><em>Recluta" \+ inicioDe\(g\.inicio\)/.test(ENTRAR),
  "🔴 puerta · el nombre del grupo, grande; debajo, «Recluta» y la fecha de inicio");
c(!/<b>Como recluta<\/b>/.test(ENTRAR), "   ya no pone «Como recluta» como título");
c(/\.elegir-camino \.camino\.recluta b\{font-size:1\.2rem;font-weight:800/.test(CSS), "   y el nombre se ve grande y resaltado");
// la fecha, de verdad: se evalúa la función de la puerta
const src = ENTRAR.slice(ENTRAR.indexOf("var MESES"), ENTRAR.indexOf("function elegir("));
const inicioDe = new Function(src + "; return inicioDe;")();
c(inicioDe("2026-06-01") === " · empezó el 1 jun 2026", "🔴 «empezó el 1 jun 2026» para un curso ya empezado", inicioDe("2026-06-01"));
c(inicioDe("2099-02-09") === " · empieza el 9 feb 2099", "   «empieza el…» para uno que aún no ha empezado", inicioDe("2099-02-09"));
c(inicioDe("") === "" && inicioDe(null) === "", "   y nada si el grupo no tiene fecha");
c(/\(\(a\.estado === "pasado"\) - \(b\.estado === "pasado"\)\)/.test(ENTRAR) && /" · curso terminado"/.test(ENTRAR),
  "🔴 el curso terminado se puede abrir, pero va debajo y marcado «curso terminado»");

// ── 2 · borrar un grupo: el nombre, sin mayúsculas, acentos ni signos
const lin = CONS.split("\n").find(l => /var plano = function/.test(l)) || "";
let plano = null; try { plano = new Function(lin.trim() + "; return plano;")(); } catch (e) {}
c(!!plano && plano("PRUEBA · SEMANA 16 (fin del viaje)") === plano("prueba semana 16 fin del viaje"),
  "🔴 «prueba semana 16 fin del viaje» vale para «PRUEBA · SEMANA 16 (fin del viaje)» (el «·» no está en el teclado)");
c(!!plano && plano("Pruébá") === plano("prueba") && plano("Hola") !== plano("Hola 2"), "   acentos fuera; pero otro nombre no vale");
c(/inp\.oninput = function \(\) \{ b\.disabled = !coincide\(\); \};/.test(CONS) && /if \(!coincide\(\)\) return;/.test(CONS),
  "   el botón y el clic usan la misma comparación");
c(/sin preocuparte de mayúsculas, acentos ni signos/.test(CONS), "   y la tarjeta lo dice");

// ── 3 · los cursos terminados, a la vista del docente
c(/id="doc-viejos-b" role="button" tabindex="0"/.test(CONS) && /d\.open = true; d\.scrollIntoView/.test(CONS),
  "🔴 consola · «1 curso terminado ↓» abre el cajón de los cursos terminados y baja hasta él");

console.log("\n  Batería 94 · la puerta y los cursos terminados (19-sep)");
console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
fallos.forEach(f => console.log("   ✗ " + f));
process.exit(fallos.length ? 1 : 0);
