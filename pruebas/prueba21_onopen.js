'use strict';
// 21 · onOpen sin ventana: autorizar el script NO puede dejar la hoja a medias
// La primera vez que una cuenta nueva usa el script hay que autorizarlo, y la forma habitual de
// hacerlo es ejecutar onOpen desde el editor. Ahí no hay hoja abierta delante: getUi() revienta con
// «Cannot call SpreadsheetApp.getUi() from this context». Lo que no puede pasar es que ese error se
// lleve por delante a asegurarHojas_(), porque entonces la cuenta queda autorizada pero sin hojas.
const E = require("./entorno.js");
const { comprobar: c, igual } = E;
console.log("\n▶ 21 · onOpen sin ventana (el momento de autorizar el script)");

const G = E.nuevoMundo();

// --- a) con ventana: el menú se monta y las hojas quedan aseguradas
G.onOpen();
c(Object.keys(G.H).length > 0, "hay hojas declaradas");
const conMenu = Object.keys(G.H).filter(k => G.hoja_(G.H[k]) != null).length;
c(conMenu > 0, "con ventana, onOpen deja las hojas creadas (" + conMenu + ")");

// --- b) sin ventana: getUi() revienta, como en el editor
const G2 = E.nuevoMundo();
G2.SpreadsheetApp.getUi = function () {
  throw new Error("Cannot call SpreadsheetApp.getUi() from this context.");
};
let reventado = null;
try { G2.onOpen(); } catch (e) { reventado = e.message; }
igual(reventado, null, "🔴 onOpen NO revienta cuando no hay ventana (autorizar desde el editor)");
const sinMenu = Object.keys(G2.H).filter(k => G2.hoja_(G2.H[k]) != null).length;
igual(sinMenu, conMenu, "🔴 y aun así deja EXACTAMENTE las mismas hojas: autorizar no deja nada a medias");

// --- c) el menú sigue siendo montable por su cuenta
c(typeof G.menuStargate_ === "function", "el menú vive en su propia función, aparte de onOpen");

E.resumen("onOpen sin ventana");
