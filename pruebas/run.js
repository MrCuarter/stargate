'use strict';
/**
 * STARGATE · Banco de pruebas — lanzador
 *   node pruebas/run.js            → todas las baterías
 *   node pruebas/run.js 3 8        → solo las que empiezan por «prueba3» y «prueba8»
 * Cada batería corre en su propio proceso: así ninguna se contamina con el mundo de la anterior.
 */
const fs = require("fs"), path = require("path"), { spawnSync } = require("child_process");

const dir = __dirname;
const args = process.argv.slice(2);
// --ascii = probar la copia 100 % ASCII que se pega en Apps Script (regla de oro del traspaso:
// el portapapeles rompe los acentos, así que lo que se pega NO es lo mismo que lo que se escribe).
const ascii = args.indexOf("--ascii") >= 0;
const filtro = args.filter(a => a.charAt(0) !== "-");
const GS = ascii ? path.join(dir, "..", "assets", "descargas", "Code.gs.ascii.txt")
                 : path.join(dir, "..", "apps-script", "Code.gs");
if (ascii && !fs.existsSync(GS)) { console.error("No existe " + GS + " — ejecuta antes _build_site.py"); process.exit(1); }
const ficheros = fs.readdirSync(dir)
  .filter(f => /^prueba\d+.*\.js$/.test(f))
  .filter(f => !filtro.length || filtro.some(n => f.indexOf("prueba" + n) === 0))
  .sort((a, b) => (parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10)));

console.log("═══ STARGATE · banco de pruebas del Apps Script ═══");
console.log((ascii ? "Copia ASCII: " : "Code.gs: ") + path.relative(process.cwd(), GS));

let totalOk = 0, totalMal = 0, rotas = [];
ficheros.forEach(f => {
  const r = spawnSync(process.execPath, [path.join(dir, f)], { encoding: "utf8", env: Object.assign({}, process.env, { STARGATE_GS: GS }) });
  const salida = (r.stdout || "") + (r.stderr || "");
  process.stdout.write(salida);
  const m = salida.match(/(\d+) comprobaciones, (\d+) fallos/);
  if (m) { totalOk += Number(m[1]); totalMal += Number(m[2]); }
  if (r.status !== 0 && !m) { rotas.push(f); console.log("   ✗ " + f + " ha REVENTADO"); }
  else if (r.status !== 0) rotas.push(f);
});

console.log("\n═══════════════════════════════════════════════════");
console.log((totalMal || rotas.length ? "✗ HAY FALLOS" : "✓ TODO EN VERDE") +
  " · " + ficheros.length + " baterías · " + totalOk + " comprobaciones · " + totalMal + " fallos");
if (rotas.length) console.log("Baterías con fallos: " + rotas.join(", "));
process.exit(totalMal || rotas.length ? 1 : 0);
