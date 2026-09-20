'use strict';
/**
 * Batería 101 · EL MATERIAL GRÁFICO DE LA NAVE (20-sep)
 *
 * Norberto: «crea el icono de la pestaña que consideres… aprovecha a revisar si hacen falta otros iconos o material
 * gráfico». Seis iconos traían el fondo negro PEGADO: sobre las cajas translúcidas de la Nave se veían como pegatinas.
 * Aquí se vigila que todos los iconos de la lámina tengan fondo transparente de verdad y el tamaño de la familia.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };

const DIR = path.join(R, "assets/img/nave/iconos");
const ICONOS = fs.readdirSync(DIR).filter(f => f.endsWith(".png")).sort();
c(ICONOS.length >= 15, "la lámina de la Nave tiene sus iconos", ICONOS.length);
c(ICONOS.indexOf("archivo.png") >= 0, "🔴 incluido el de «El Archivo»");

/** Lee el PNG con el propio Chrome del laboratorio sería lento: basta con la cabecera IHDR y el canal alfa del PNG. */
function opacidad(f) {
  // se mide con sips (viene con macOS) para no depender de librerías
  const { execSync } = require("child_process");
  const out = execSync(`python3 -c "
from PIL import Image
im=Image.open('${path.join(DIR, f)}').convert('RGBA')
a=im.split()[3]
print(im.width, im.height, sum(1 for p in a.getdata() if p>200)/float(im.width*im.height))
"`, { encoding: "utf8" }).trim().split(/\s+/);
  return { w: Number(out[0]), h: Number(out[1]), op: Number(out[2]) };
}
let malos = [], raros = [];
ICONOS.forEach(function (f) {
  const m = opacidad(f);
  if (m.op > 0.92) malos.push(f + " (" + Math.round(m.op * 100) + " % opaco)");
  if (m.w !== 96 || m.h !== 96) raros.push(f + " (" + m.w + "×" + m.h + ")");
});
c(!malos.length, "🔴 ninguno lleva el fondo pegado: todos recortados sobre transparente", malos.join(", "));
c(!raros.length, "   y todos miden 96×96, como la familia", raros.join(", "));

// los que usa la Nave del recluta y la del Comandante existen
const REC = fs.readFileSync(path.join(R, "assets/js/recluta.js"), "utf8");
const usados = (REC.match(/var TABS=\[([\s\S]*?)\];/) || [, ""])[1].match(/'[a-z]+','([a-z]+)'/g) || [];
c(usados.length >= 7, "las pestañas de la Nave declaran su icono", usados.length);
["nave", "retos", "botin", "archivo", "mercado", "zoco", "rankings", "envivo"].forEach(function (k) {
  c(fs.existsSync(path.join(DIR, k + ".png")), "   existe el icono de «" + k + "»");
});

console.log("\n  Batería 101 · el material gráfico de la Nave (20-sep)");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
