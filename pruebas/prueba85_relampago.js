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
 *
 * 23-sep · los 20 retos: «dos retos por tema y alguno extra». Cada tema tiene su relámpago EN CLASE (L0–L8, práctico:
 * crear, diseñar, encontrar) y su reto principal en casa (B). Los A desaparecen; los relámpago pasan a 100 xp y 20 ◈
 * (son el reto práctico del tema, no un extra de quince minutos) y se lanzan en la clase de su tema.
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
c(por.L1 && /Del boceto a la forja/.test(por.L1[1]) && por.L1[2].indexOf("R1_la-chispa") >= 0 && por.L1[2].indexOf("P1_bran") >= 0,
  "🔴 «La chispa» no se pierde: su insignia la da L1 («Del boceto a la forja»), con la de Bran", por.L1 && por.L1[2].join(","));
c(/ePortfolio/.test(D.AYUDA_RETOS.B1 || "") && /BIO/.test(D.AYUDA_RETOS.B1 || ""),
  "🔴 y el enunciado pide el enlace en el reto Y en la BIO de la Nave (lo que pidió Norberto)");
c(/plantilla oficial en Genially/.test(D.AYUDA_RETOS.B1 || ""), "   y recuerda que hay plantilla oficial");
c(/primera experiencia/.test(D.AYUDA_RETOS.B1 || "") && /relámpago/.test(D.AYUDA_RETOS.B1 || ""),
  "   y que basta con la primera experiencia: lo creado con IA en el relámpago y uno más");

// 2 · los relámpago: uno por tema, y el de la hoja de ruta en la primera clase
const L = REG.filter(r => r[0].charAt(0) === "L");
c(L.map(r => r[0]).join(",") === "L0,L1,L2,L3,L4,L5,L6,L7,L8", "son nueve relámpago: L0 (la hoja de ruta) y uno por tema", L.map(r => r[0]).join(","));
c(L.every(r => r[3] === (r[0] === "L0" ? 60 : 100)), "   100 xp cada uno (L0, 60): es el reto práctico del tema, hecho en clase");
c(D.CREDITOS.relampago === 20, "🔴 y 20 ◈: menos que un reto principal (50), que es el que se hace en casa", String(D.CREDITOS.relampago));
c(JSON.stringify(L.map(r => r[5])) === JSON.stringify([1, 2, 3, 5, 7, 9, 10, 11, 13]),
  "🔴 se lanzan en la clase de su tema (el tema 1, en sus dos semanas)", L.map(r => r[5]).join(","));
c(L.every(r => r[4] === (r[0] === "L0" ? 1 : Number(r[0].slice(1)))), "   y cada uno es de su tema");
c(REG.filter(r => /^A[1-8]$/.test(r[0])).length === 0, "🔴 no queda ningún reto A (A1–A8): dos retos por tema, no tres");
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
c(/t\[0\]\.charAt\(0\) === 'L'/.test(N) && /<img class=ico [^>]*rayo\.png alt> En clase · 10-15 min/.test(N),
  "🔴 en la Nave, el relámpago dice que se hace EN CLASE (es el hincapié que pidió Norberto)");
c(/\.reto-sem\.relampago/.test(leer("assets/css/stargate.css")), "   y se distingue de una entrega de dos horas");
c(/tramo=apertura/.test(leer("assets/js/consola.js")) && /tramo=cierre/.test(leer("assets/js/consola.js")),
  "   y la consola da los dos embeds de la sesión, para pegarlos antes y después de la teoría");

// 7 · publicar en redes se queda (aquí me corrigió): desde el 23-sep es el relámpago del tema 4
c(/redes/.test(D.AYUDA_RETOS.L4 || "") && !/padlet de la clase o en el foro/.test(D.AYUDA_RETOS.L4 || ""),
  "🔴 L4 sigue pidiendo publicar en redes: tienen otra asignatura que les obliga a crearse una");

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

console.log("\n  Batería 85 · la Bitácora y los relámpago");
console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
fallos.forEach(f => console.log("   ✗ " + f));
process.exit(fallos.length ? 1 : 0);
