'use strict';
/**
 * STARGATE · Banco de pruebas — lanzador
 *   node pruebas/run.js            → todas las baterías
 *   node pruebas/run.js 3 8        → solo las que empiezan por «prueba3» y «prueba8»
 *   node pruebas/run.js --recorrido → añade la 64, que abre Chrome y recorre la web de verdad
 * Cada batería corre en su propio proceso: así ninguna se contamina con el mundo de la anterior.
 */
const fs = require("fs"), path = require("path"), { spawnSync } = require("child_process");

const dir = __dirname;
const args = process.argv.slice(2);
// --ascii = probar la copia 100 % ASCII que se pega en Apps Script (regla de oro del traspaso:
// el portapapeles rompe los acentos, así que lo que se pega NO es lo mismo que lo que se escribe).
const ascii = args.indexOf("--ascii") >= 0;
/**
 * 🔴 LA 64 NO ENTRA POR DEFECTO, y es a propósito. Las demás son lógica pura y tardan dos segundos;
 * la 64 levanta Chrome y recorre la web con cuatro tipos de persona, así que tarda minutos. Meterla
 * siempre haría que se dejara de lanzar el banco entero, que es peor que no tenerla. Se pide a mano
 * —o la lanza quien vaya a publicar— con `--recorrido`. Por eso es `.cjs` y no `.js`: el filtro de
 * abajo no la ve.
 */
const recorrido = args.indexOf("--recorrido") >= 0;
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

if (recorrido) {
  console.log("\n▶ 64 · El recorrido humano (Chrome de verdad — esto tarda)");
  const r = spawnSync(process.execPath, [path.join(dir, "prueba64_recorrido.cjs")],
                      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const salida = (r.stdout || "") + (r.stderr || "");
  process.stdout.write(salida);
  const m = salida.match(/(\d+) comprobaciones correctas, (\d+) fallos/);
  if (m) { totalOk += Number(m[1]); totalMal += Number(m[2]); }
  if (r.status !== 0) rotas.push("prueba64_recorrido.cjs");
}

console.log("\n═══════════════════════════════════════════════════");
console.log((totalMal || rotas.length ? "✗ HAY FALLOS" : "✓ TODO EN VERDE") +
  " · " + (ficheros.length + (recorrido ? 1 : 0)) + " baterías · " + totalOk +
  " comprobaciones · " + totalMal + " fallos");
if (rotas.length) console.log("Baterías con fallos: " + rotas.join(", "));
process.exit(totalMal || rotas.length ? 1 : 0);
