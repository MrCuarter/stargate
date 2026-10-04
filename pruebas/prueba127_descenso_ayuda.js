'use strict';
/**
 * BATERÍA 127 · EL DESCENSO, CON AYUDA (4-oct)
 * Norberto: «el juego de Umbral es literalmente imposible, no he conseguido aterrizar ni una sola vez en 100 partidas… intenta
 * bajar el nivel, sobre todo al principio». Ayuda de 0 a 1 que se retira planeta a planeta; en la Academia, entera. Se EJECUTA
 * la física: un piloto torpe (solo propulsor, sin girar, 0,3 s de retraso) con la ayuda entera se posa siempre.
 */
const fs = require("fs"), path = require("path");
const D = fs.readFileSync(path.join(__dirname, "..", "juegos/joran/descenso.js"), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt); };

c(/const AYUDA_NIVEL = \[1, 1, 0\.95, 0\.9, 0\.85, 0\.8, 0\.75, 0\.7\];/.test(D), "🔴 la ayuda: entera en Fôrge y Ecos y retirándose poco a poco, sin desaparecer");
c(/const ayudaDe = \(nivel\) => AYUDA_NIVEL\[nivel\] \?\? 0;/.test(D) && !/AYUDA_ACADEMIA/.test(D),
  "🔴 la misma curva en todas partes, Academia y sala de Joran (4-oct: «recuerda el onboarding: si el primer nivel es muy difícil, frustración y abandono»)");
c(/S\.x \+= \(ancha\.cx - S\.x\) \* a; S\.vx \*= 1 - a;/.test(D), "   se sale encima de la plataforma ancha y sin deriva (con la ayuda entera)");
c(/if \(!giro && S\.ayuda\) S\.ang -= S\.ang \* Math\.min\(1, 3 \* S\.ayuda \* dt\);/.test(D), "   el módulo se endereza solo al soltar el giro");
c(/\* \(1 - \(S\.ayuda \|\| 0\)\), ay = -P\.g;/.test(D), "   el viento sopla menos");
c(/const a = S\.ayuda \|\| 0, SG = seguro\(a\), m = 2 \* a;/.test(D) && /const SG = seguro\(S\.ayuda \|\| 0\);   \/\/ \(lo verde/.test(D), "   las patas aguantan más, las plataformas perdonan 2 m y el panel lo pinta en verde");

// la física, ejecutada: Umbral (g 2,4, viento -0,35 ± 0,35), ayuda entera, piloto torpe
const seguro = new Function("SEGURO", "return " + D.match(/const seguro = (\(a\) => \(\{[^;]*\}\));/)[1])({ vy: 2.4, vx: 1.6, ang: 0.2 });
function vuelo(a) {
  const g = 2.4, w = 12; let x0 = (110 + Math.random() * 40) * (Math.random() < .5 ? 1 : -1), vx = -Math.sign(x0) * (2 + Math.random() * 1.5), y = 65;
  let x = x0 + (0 - x0) * a; vx *= 1 - a; y = Math.max(45, y - 20 * a);
  let vy = 0, ang = 0, comb = 100, t = 0; const cola = [], dt = 1 / 60, emp = Math.max(3.6, g * 2.3);
  while (t < 120) {
    t += dt; cola.push(vy); const v = cola.length > 18 ? cola[cola.length - 18] : cola[0];
    if (a) ang -= ang * Math.min(1, 3 * a * dt);
    const prop = v < -1.6 && comb > 0, vi = -0.35 + Math.sin(t * Math.PI * 2 / 6) * 0.35;
    let ax = vi * (y > 3 ? 1 : 0.3) * (1 - a), ay = -g;
    if (prop) { ax += -Math.sin(ang) * emp; ay += Math.cos(ang) * emp; comb = Math.max(0, comb - 2.4 * dt); }
    vx += ax * dt; vy += ay * dt; x += vx * dt; y += vy * dt;
    if (y <= 0.1) { const S = seguro(a); return Math.abs(x) + 1.9 <= w / 2 + 2 * a && Math.abs(vy) <= S.vy && Math.abs(vx) <= S.vx; }
  }
  return false;
}
let bien = 0, antes = 0; for (let i = 0; i < 300; i++) { if (vuelo(1)) bien++; if (vuelo(0)) antes++; }
c(bien === 300 && antes === 0, "🔴 con la ayuda entera (Fôrge y Ecos en la Academia), un piloto torpe se posa, aun con la gravedad y el viento de Umbral, " + bien + " de 300 veces (sin ayuda, " + antes + ")");

console.log("\n  Batería 127 · el Descenso, con ayuda");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
