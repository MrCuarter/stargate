'use strict';
/**
 * 7-oct · LAS PIEZAS DEL SDK DE GAMIFICAPRO, PARA LAS BATERÍAS. Desde los pasos 4-11 de la fase 5, lo que motor.js hacía con sus
 * manos (la ficha a cero, la huella del código, el voto por castVote…) lo hace una pieza del paquete fijado en _build_site.py
 * (SDK_FIJADO, en assets/js/). Las baterías que vigilan esas garantías las miran ahí: `pieza("votacion")` es el texto de esa
 * pieza, tal cual va en el paquete ("" si no está).
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const FIJADO = (fs.readFileSync(path.join(R, "_build_site.py"), "utf8").match(/^SDK_FIJADO = "(mod-sdk\.v1\.[0-9a-f]{10}\.js)"$/m) || [])[1];
const PAQ = FIJADO && fs.existsSync(path.join(R, "assets/js", FIJADO)) ? fs.readFileSync(path.join(R, "assets/js", FIJADO), "utf8") : "";
function pieza(nombre) {
  const i = PAQ.indexOf("// ─── GP_SDK pieza «" + nombre + "»"), j = PAQ.indexOf("// ─── fin de la pieza «" + nombre + "» ───");
  return i >= 0 && j > i ? PAQ.slice(PAQ.indexOf("\n", i) + 1, j) : "";
}
module.exports = { pieza, FIJADO, PAQ };
