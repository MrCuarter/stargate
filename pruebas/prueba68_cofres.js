'use strict';
/**
 * BATERÍA 68 · LOS COFRES NO SE AGOTAN
 *
 * 🔴 12-sep · El fallo más caro de la noche. `maxStock: 0` quería decir «sin tope», pero GamificaPro
 * lo normaliza a 1 y cuenta las cartas repartidas en el sobre DEL GRUPO: cada carta salía una vez
 * por clase y, a los nueve sobres, todos salían vacíos. Esta batería repite la cuenta EXACTA de
 * GamificaPro (`normalizaLootItems` + `hayStock`, copiadas abajo tal cual) sobre el cofre que siembra
 * STARGATE, y simula una clase entera abriendo sobres.
 */
const E = require("./entorno.js");
const { comprobar: c } = E;
const fs = require("fs"), path = require("path");
console.log("\n▶ 68 · Los cofres no se agotan");

// ── la cuenta de GamificaPro, copiada de functions/lootPicker.js (y vigilada abajo) ──
const positivo = v => Math.max(0, Number(v) || 0);
const normalizaLootItems = items => (Array.isArray(items) ? items : []).filter(i => i && i.rewardId)
  .map(i => ({ rewardId: i.rewardId, probability: Math.min(100, positivo(i.probability)), maxStock: Math.max(1, Number(i.maxStock) || 1) }));
const hayStock = (item, dados) => !((dados[item.rewardId] || 0) >= item.maxStock);
const LP = fs.readFileSync("/Users/nor/Claude/vibewebs/gamificapro/functions/lootPicker.js", "utf8");
c(/maxStock: Math\.max\(1, Number\(i\.maxStock\) \|\| 1\)/.test(LP),
  "🔴 GamificaPro sigue convirtiendo maxStock 0 en 1 (si cambia, esta batería se entera)");

const { paquete } = require("../motor/paquete.js");
const { catalogo } = require("../motor/catalogo.js");
const paq = paquete({ id: "x", nombre: "X", tipo: "REGULAR", inicio: "2026-07-11",
  docentes: [{ nombre: "A", correo: "a@b.c", rol: "referente", imparte: true }], referente: "a@b.c" }, catalogo());
const sobre = paq.recompensas.find(r => r.stargateTipo === "cromo" && r.consumeEffects && r.consumeEffects.lootBox);
const heroe = paq.recompensas.find(r => r.stargateTipo === "heroe" && r.consumeEffects && r.consumeEffects.lootBox);
c(!!sobre && !!heroe, "el paquete siembra un sobre y un cofre de héroe");

[["sobre", sobre, 30 * 20 * 3], ["héroe", heroe, 30 * 6]].forEach(([nombre, r, tiradas]) => {
  const items = normalizaLootItems(r.consumeEffects.lootBox.items);
  c(items.every(i => i.maxStock >= 100000), "🔴 el cofre del " + nombre + " no tiene tope real (maxStock ≥ 100.000)",
    "mínimo: " + Math.min.apply(null, items.map(i => i.maxStock)));
  // una clase de 30 que abre 20 sobres cada uno (3 cartas por sobre): ninguna tirada puede salir vacía
  const dados = {}; let vacias = 0;
  for (let k = 0; k < tiradas; k++) {
    const disp = items.filter(i => hayStock(i, dados));
    if (!disp.length) { vacias++; continue; }
    const tot = disp.reduce((a, i) => a + i.probability, 0); let t = Math.random() * tot, e = disp[0];
    for (const i of disp) { t -= i.probability; if (t <= 0) { e = i; break; } }
    dados[e.rewardId] = (dados[e.rewardId] || 0) + 1;
  }
  c(vacias === 0, "🔴 " + tiradas + " tiradas de " + nombre + " en un mismo grupo: ninguna sale vacía", vacias + " vacías");
});

// los grupos que siembra el script de pruebas usan el mismo cofre (sale de paquete.js)
const S = fs.readFileSync(path.join(__dirname, "..", "motor", "sembrar_prueba.js"), "utf8");
c(/paquete\(/.test(S) && !/maxStock:\s*0/.test(S), "el sembrador no reintroduce maxStock 0 por su cuenta");
c(fs.existsSync(path.join(__dirname, "..", "motor", "migrar_cofres.js")), "y existe la migración para los grupos ya creados");

E.resumen("Los cofres no se agotan");
