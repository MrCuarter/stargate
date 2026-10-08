'use strict';
/**
 * BATERÍA 140 · EN PUA, CADA RETO EN LA SEMANA DE SU TEMA (8-oct-2026). Norberto: «En PUA, bloqueamos retos también: cada
 * semana, todos los retos del tema correspondiente» y «¿Por qué se bloquea? ¿Qué más da que sea PUA de 8 semanas o normal de
 * 15? Salvo las fechas y las peculiaridades, el resto IGUAL».
 *
 * El fallo: `SG_SEM_RETO.PUA` salía del calendario de REGULAR (el `lanza` de sus 15 semanas), y la Nave de un PUA cerraba B5…B8
 * hasta la 9…14 de un curso de 8 semanas: no se abrían nunca. Ahora el build (`_semanas_pua`) aplica la MISMA regla al
 * calendario que ve un PUA (`semanasPua` de assets/js/calendario.js: una semana por tema). Aquí se vigila, ejecutando la web:
 *   · lo que publica el build es la regla de siempre sobre el calendario del PUA de calendario.js (Python y JS, lo mismo);
 *   · cada reto, en la semana de su tema (lo que pidió Norberto), y nada después de la 8;
 *   · REGULAR, exactamente como antes;
 *   · la Nave (`retoPorLanzar`) cierra y abre en un PUA con esos números; y la consola del docente dice lo mismo;
 *   · es el dato del servidor: GamificaPro `semanaDelReto.porTipo.PUA` (functions/mods/stargate.js), si está al lado.
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const R = path.join(__dirname, "..");
const L = (f) => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + JSON.stringify(dato))); };
const trozo = (src, desde, hasta) => { const i = src.indexOf(desde), j = src.indexOf(hasta, i + 1); if (i < 0 || j < 0) throw new Error("no encuentro " + desde); return src.slice(i, j); };
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const H = L("recluta.html"), REC = L("assets/js/recluta.js"), CONS = L("assets/js/consola.js"), BUILD = L("_build_site.py");
const SEM_RETO = JSON.parse((H.match(/window\.SG_SEM_RETO=(\{.*?\}\});/) || [])[1] || "{}");
const SEMANAS = JSON.parse((H.match(/window\.SG_SEMANAS=(\[.*?\]);window\./) || [])[1] || "[]");
const CAT = JSON.parse(L("motor/catalogo.json"));
const temaDe = {}; CAT.retos.PUA.forEach((r) => { temaDe[r.id] = r.tema; });

// el calendario del PUA, tal y como lo ve la Nave (calendario.js)
const ctxCal = { window: {} };
vm.createContext(ctxCal);
vm.runInContext(L("assets/js/calendario.js"), ctxCal);
const PUA = ctxCal.window.SGCAL.semanasPua(JSON.parse(JSON.stringify(SEMANAS)));

console.log("\n  · Lo que publica el build es la regla de siempre, sobre el calendario del PUA");
{
  // `_nucleo_reto` y `_sem_de_reto` de _build_site.py, en JS: el título entre «», en minúsculas y sin tildes
  const nucleo = (t) => { const m = String(t || "").match(/«([^»]+)»/); return m ? m[1].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim() : ""; };
  const regla = (retos, semanas) => {
    const idx = {}; retos.forEach((r) => { const k = nucleo(/«/.test(r.titulo) ? r.titulo : "«" + r.titulo + "»"); if (k && !(k in idx)) idx[k] = r.id; });
    const fuera = {}; semanas.forEach((s) => (s.lanza || []).forEach((t) => { const id = idx[nucleo(t)]; if (id && !(id in fuera)) fuera[id] = s.sem; }));
    return fuera;
  };
  const sinAlta = (l) => l.filter((r) => r.id !== "H1");
  c(PUA.length === 8 && PUA.every((s, i) => s.sem === i + 1 && s.tema_n === i + 1), "el calendario del PUA: 8 semanas, el tema N en la semana N", PUA.map((s) => [s.sem, s.tema_n]));
  c(igual(regla(sinAlta(CAT.retos.PUA), PUA), SEM_RETO.PUA), "🔴 SG_SEM_RETO.PUA = el `lanza` del calendario del PUA de calendario.js (el build de Python da lo mismo)",
    { web: SEM_RETO.PUA, regla: regla(sinAlta(CAT.retos.PUA), PUA) });
  c(igual(regla(sinAlta(CAT.retos.REGULAR), SEMANAS), SEM_RETO.REGULAR), "   y REGULAR, la misma regla sobre sus 15 semanas");
  c(/def _semanas_pua\(\)/.test(BUILD) && /_sem_de_reto\(RETOS_PUA, _semanas_pua\(\)\)/.test(BUILD), "   el build saca el de PUA de `_semanas_pua` (ya no del calendario de REGULAR)");
}

console.log("\n  · Cada reto, en la semana de su tema; REGULAR, como antes");
{
  const malos = Object.keys(SEM_RETO.PUA).filter((id) => SEM_RETO.PUA[id] !== (PUA.find((s) => s.tema_n === temaDe[id]) || {}).sem);
  c(Object.keys(SEM_RETO.PUA).length >= 19 && !malos.length, "🔴 PUA: cada reto se abre la semana en que empieza su tema («cada semana, todos los retos del tema»)", malos);
  c(Object.values(SEM_RETO.PUA).every((n) => n >= 1 && n <= 8), "   ninguno después de la 8 (antes, B5…B8 en la 9…14: no se abrían nunca)", SEM_RETO.PUA);
  c(igual(SEM_RETO.PUA, { A0: 1, L0: 1, L1: 1, B1: 1, B2: 2, L2: 2, L3: 3, B3: 3, L4: 4, B4: 4, L5: 5, B5: 5, L6: 6, B6: 6, L7: 7, B7: 7, L8: 8, B8: 8, XS: 8 }),
    "   los números: A0, L0, L1 y B1 la 1; …; L8, B8 y la batalla final (XS) la 8", SEM_RETO.PUA);
  c(!("X1" in SEM_RETO.PUA) && !("X2" in SEM_RETO.PUA) && !("S7" in SEM_RETO.PUA), "   las actividades (X1, X2) y el secreto (S7), sin candado, como en REGULAR");
  c(igual(SEM_RETO.REGULAR, { A0: 1, L0: 1, L1: 2, B1: 2, B2: 3, L2: 4, L3: 5, B3: 6, L4: 7, B4: 8, L5: 9, B5: 9, L6: 10, B6: 10, L7: 11, B7: 12, L8: 13, B8: 14, XS: 15 }),
    "🔴 REGULAR, exactamente igual que antes (los grupos vivos)", SEM_RETO.REGULAR);
}

console.log("\n  · La Nave cierra con esos números; la consola dice lo mismo");
{
  const ctx = { window: { SG_SEM_RETO: SEM_RETO }, st: { d: { tipo: "PUA" }, actual: 0 } };
  vm.createContext(ctx);
  vm.runInContext("function esPUA(){ return (st&&st.d&&st.d.tipo)==='PUA'; }\n" + trozo(REC, "function semanaDeLanzamiento(id){", "/**") +
    "; this.retoPorLanzar = retoPorLanzar;", ctx);
  const cerrado = (tipo, sem, id, ya) => { ctx.st.d.tipo = tipo; ctx.st.actual = sem; return ctx.retoPorLanzar(id, !!ya); };
  c(cerrado("PUA", 4, "B5") === 5 && cerrado("PUA", 5, "B5") === 0, "🔴 PUA: B5, cerrado en la semana 4 («la próxima semana») y abierto en la 5");
  c(cerrado("PUA", 7, "B8") === 8 && cerrado("PUA", 8, "B8") === 0 && cerrado("PUA", 8, "XS") === 0, "   B8, abierto en la 8 (antes, nunca)");
  c(cerrado("PUA", 1, "L1") === 0 && cerrado("PUA", 1, "B2") === 2, "   L1, con su tema, la 1; B2, la 2");
  c(cerrado("PUA", 0, "B8") === 0 && cerrado("PUA", 2, "B8", true) === 0 && cerrado("PUA", 3, "X2") === 0, "   antes de empezar, nada cerrado; lo registrado, tampoco; X2, sin candado");
  c(cerrado("REGULAR", 8, "B5") === 9 && cerrado("REGULAR", 1, "L1") === 2 && cerrado("REGULAR", 2, "L1") === 0, "   REGULAR, como siempre: B5 en la 9, L1 en la 2");
  // la consola del docente: `semanaDeReto` (en PUA, «cada tema es su semana») = lo que cierra la Nave
  const cx = { window: { SG_CATALOGO: CAT } };
  vm.createContext(cx);
  vm.runInContext(trozo(CONS, "function semanaDeReto(r, tipo, mapa) {", "/* ──") + "; this.semanaDeReto = semanaDeReto;", cx);
  const distintos = CAT.retos.PUA.filter((r) => r.id in SEM_RETO.PUA && cx.semanaDeReto(r, "PUA", SEM_RETO.PUA) !== SEM_RETO.PUA[r.id]).map((r) => r.id);
  c(!distintos.length, "   la consola (el «Hoy toca» del docente) pone cada reto de PUA en la misma semana que la Nave", distintos);
}

console.log("\n  · Es el dato del servidor (GamificaPro)");
{
  const GP = [path.join(R, "..", "..", "gamificapro", "functions", "mods", "stargate.js")].find((f) => fs.existsSync(f));
  if (!GP) console.log("   (sin GamificaPro al lado: lo compara su tests/functions/mod-semana-reto.test.ts)");
  else {
    const m = fs.readFileSync(GP, "utf8").match(/const SEMANA_DEL_RETO = \{[\s\S]*?PUA: (\{[\s\S]*?\}|null),/);
    let srv = null; try { srv = m && m[1] !== "null" ? Function("return " + m[1])() : null; } catch (e) {}
    c(igual(srv, SEM_RETO.PUA), "🔴 semanaDelReto.porTipo.PUA del servidor = SG_SEM_RETO.PUA de la Nave", { servidor: srv });
  }
}

console.log("\n  Batería 140 · en PUA, cada reto en la semana de su tema");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
