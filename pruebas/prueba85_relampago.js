'use strict';
/**
 * BATERÍA 85 · LA BITÁCORA EN LA SEMANA 1 Y LOS OCHO RELÁMPAGO (16-sep-2026).
 *
 * Norberto aprobó la reorganización entera: «¡Apruebo todos tus cambios!». Y antes: «creo que necesitamos un reto B que
 * sea poner a punto el portfolio y compartir el enlace tanto en la propia actividad como en la BIO… le queremos dar
 * mucho peso al portfolio, y esa actividad debería estar en las primeras semanas»; «necesitamos retos sencillos, de
 * 10/15 minutos, y otros más elaborados»; «me gusta mucho la idea de que los relámpago se animen a hacer en clase: así
 * los que vienen a clase se lo llevan hecho, hagamos hincapié en esto»; y «publicar en redes se queda» (A4 no se toca).
 *
 * Lo que se vigila: que B1 sea la Bitácora y «La chispa» no se haya perdido (es L1), que los ocho relámpago existan con
 * su semana y su precio, que sean VOLUNTARIOS (no cierran el planeta ni son obligatorios), que «Mano rápida» se gane
 * con cinco de ocho, que el simulacro tenga su sitio en la semana 15 y que las tres insignias nuevas estén dibujadas.
 */
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const RAIZ = path.resolve(__dirname, "..");
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");

// el catálogo de verdad, evaluado como lo hace Apps Script
const vm = require("vm");
const D = vm.createContext({});
vm.runInContext(leer("apps-script/Datos.gs"), D, { filename: "Datos.gs" });
const REG = D.RETOS_REGULAR, PUA = D.RETOS_PUA, por = {}; REG.forEach(r => (por[r[0]] = r));

// 1 · la Bitácora ocupa el sitio de la chispa, y la chispa sigue viva
c(por.B1 && /Bitácora en marcha/.test(por.B1[1]), "🔴 B1 es «La Bitácora en marcha»: el ePortfolio se abre en la semana 1", por.B1 && por.B1[1]);
c(por.B1 && por.B1[2][0] === "R0_bitacora-en-marcha" && por.B1[3] === 250, "   con su insignia nueva y sus 250 xp");
c(por.L1 && /chispa y la marca/.test(por.L1[1]) && por.L1[2][0] === "R1_la-chispa",
  "🔴 «La chispa» no se pierde: baja a relámpago (L1) y se queda con su insignia de siempre");
c(/ePortfolio/.test(D.AYUDA_RETOS.B1 || "") && /BIO/.test(D.AYUDA_RETOS.B1 || ""),
  "🔴 y el enunciado pide el enlace en el reto Y en la BIO de la Nave (lo que pidió Norberto)");
c(/plantilla oficial en Genially/.test(D.AYUDA_RETOS.B1 || ""), "   y recuerda que hay plantilla oficial");
c(/primera entrada/.test(D.AYUDA_RETOS.B1 || ""), "   y que basta con la primera entrada: la presentación");

// 2 · los ocho relámpago
const L = REG.filter(r => r[0].charAt(0) === "L");
c(L.length === 8, "son ocho relámpago, uno por tema", String(L.length));
c(L.every(r => r[3] === 60), "   60 xp cada uno: cuestan quince minutos, no dos horas");
c(D.CREDITOS.relampago === 10, "🔴 y 10 ◈: si pagaran como un reto B, el Arsenal de notas se desinflaría", String(D.CREDITOS.relampago));
c(JSON.stringify(L.map(r => r[5])) === JSON.stringify([2, 4, 6, 8, 9, 11, 12, 14]),
  "🔴 caen en la semana de continuación, la que NO lanza reto nuevo", L.map(r => r[5]).join(","));
c(L.every(r => !/,/.test(r[1])), "   y ningún título lleva coma: el lector del formato viejo parte por comas");
c(L.every(r => PUA.some(p => p[0] === r[0])), "   en PUA están los ocho también");

// 3 · son voluntarios: ni cierran el planeta ni son obligatorios
const hechos = {}; REG.filter(r => r[4] === 1 && r[0].charAt(0) !== "L" && r[0] !== "XS").forEach(r => (hechos[r[0]] = 1));
c(JSON.stringify(D.planetasCompletos_(hechos, "REGULAR")) === "[1]",
  "🔴 el planeta 1 se cierra SIN hacer el relámpago: faltar a una clase no puede cerrar la puerta");
const PAQ = leer("motor/paquete.js");
c(/isMandatory: r\.id\.charAt\(0\) !== "S" && r\.id\.charAt\(0\) !== "L"/.test(PAQ),
  "   y el motor nuevo tampoco los marca como obligatorios");
c(/if \(reto\.id\.charAt\(0\) === "L"\) return c\.relampago;/.test(PAQ), "   con sus mismos créditos en los dos motores");

// 4 · «Mano rápida»: cinco de ocho
const mano = (D.DERIVADAS || []).filter(d => d[0] === "H6_mano-rapida")[0];
c(!!mano && mano[3] === 5 && mano[2].length === 8,
  "🔴 «Mano rápida» se gana con CINCO de los ocho: quien trabaja a turnos va a faltar alguna noche");
c(!!mano && mano[2].every(k => k.charAt(0) === "#"), "   pidiendo retos por id, porque los relámpago no dan insignia");
c(/camp\.minMissionsToComplete = Math\.min\(d\.min, necesita\.length\)/.test(PAQ), "   y el motor nuevo lo traduce a su campaña");
c(/a\.retos\[k\.substring\(1\)\]/.test(leer("apps-script/Code.gs")), "   y el motor viejo también sabe leerlo");

// 5 · el simulacro
c(por.XS && por.XS[3] === 300 && por.XS[5] === 15 && por.XS[2][0] === "H7_listo-para-la-batalla",
  "🔴 el simulacro vive en la semana 15 (la clase 20 ya se llama así en el programa oficial)");
c(D.CREDITOS.simulacro === 60, "   y paga 60 ◈: son noventa minutos de verdad");
c(/90 minutos/.test(D.AYUDA_RETOS.XS || "") && /lista de comprobación/.test(D.AYUDA_RETOS.XS || ""),
  "   con su reloj y su lista de comprobación, sin nota");

// 6 · lo que se ve
["R0_bitacora-en-marcha", "H6_mano-rapida", "H7_listo-para-la-batalla"].forEach(k =>
  c(fs.existsSync(path.join(RAIZ, "assets/img/insignias", k + ".png")), "   la insignia " + k + " está dibujada"));
const N = leer("assets/js/recluta.js");
c(/t\[0\]\.charAt\(0\) === 'L'/.test(N) && /⚡ En clase · 10-15 min/.test(N),
  "🔴 en la Nave, el relámpago dice que se hace EN CLASE (es el hincapié que pidió Norberto)");
c(/\.reto-sem\.relampago/.test(leer("assets/css/stargate.css")), "   y se distingue de una entrega de dos horas");
c(/tramo=apertura/.test(leer("assets/js/consola.js")) && /tramo=cierre/.test(leer("assets/js/consola.js")),
  "   y la consola da los dos embeds de la sesión, para pegarlos antes y después de la teoría");

// 7 · A4 se queda como estaba (aquí me corrigió)
c(/redes/.test(D.AYUDA_RETOS.A4 || "") && !/padlet de la clase o en el foro/.test(D.AYUDA_RETOS.A4 || ""),
  "🔴 A4 sigue pidiendo publicar en redes: tienen otra asignatura que les obliga a crearse una");

// 8 · las cuentas del viaje cuadran con el catálogo
const XPV = JSON.parse(execFileSync("python3", ["-c", "import json,_site_data as D;print(json.dumps(D.XP_VIAJE))"], { cwd: RAIZ, encoding: "utf8" }));
const suma = a => a.reduce((x, r) => x + r[3], 0) + D.XP_RECLUTAMIENTO + D.DERIVADAS.reduce((x, d) => x + d[1], 0);
c(XPV.REGULAR === suma(REG), "🔴 el xp del viaje entero cuadra con el catálogo", XPV.REGULAR + " vs " + suma(REG));
c(XPV.PUA === suma(PUA), "   y el de PUA también", XPV.PUA + " vs " + suma(PUA));

// 9 · los sitios que contaban retos solo con A, B, X y S (16-sep, repaso antes del feedback de Norberto)
const GP = "/Users/nor/Claude/vibewebs/gamificapro";
const REGLAS = fs.existsSync(path.join(GP, "firestore.rules")) ? fs.readFileSync(path.join(GP, "firestore.rules"), "utf8") : "";
c(/reto\.matches\('\^\(\[AB\]\[1-8\]\|L\[1-8\]\)\$'\)/.test(REGLAS),
  "🔴 las reglas del servidor dejan guardar la reflexión de un relámpago (L2, L3 y L6 se responden en la caja)");
// (17-sep · «Lo que ha entregado» ya no existe: lo entregado se ve pulsando cada reto, relámpago y simulacro incluidos)
c(/\(\/\^L\\d\/\.test\(mi\.id\) \? " rel" : ""\)/.test(leer("assets/js/consola.js")),
  "🔴 en la ficha del docente, los relámpago salen entre sus retos (con su borde) y se pulsan como los demás");
c(/\/\^\(\?:\[ABXSL\]\\d\|XS\$\)\/\.test\(k\)/.test(N), "   y la cifra de retos de la Nave los cuenta");
c(/los relámpago \(L…\) tampoco cuentan, A PROPÓSITO/.test(N), "   (el tope de tres por semana no los cuenta, a propósito: se hacen en clase)");
const DIP = leer("assets/js/diploma.js");
c(/MISIONES\.filter\(function \(m\) \{ return m\.stargateId !== "H1"; \}\)/.test(DIP) && /CAMPANAS\.forEach/.test(DIP) && !/p\.earnedBadges \|\| \[\]\)\.length/.test(DIP),
  "🔴 el diploma cuenta retos e insignias como el tablero (de las misiones y campañas del grupo), no de earnedBadges");
c(/window\.SG_BADGES=/.test(leer("diploma.html")), "   con el catálogo de insignias en su página");
c(/SG_CATALOGO\|\|\{\}\)\.retos/.test(leer("assets/js/sesion.js")), "   y la sesión saca la insignia de cada misión del catálogo (el relámpago L1 y el simulacro tienen la suya)");

console.log("\n  Batería 85 · la Bitácora y los ocho relámpago");
console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
fallos.forEach(f => console.log("   ✗ " + f));
process.exit(fallos.length ? 1 : 0);
