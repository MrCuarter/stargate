/**
 * BATERÍA 160 · ¿YA TE ALISTASTE Y NO VES TU CLASE? (16-nov)
 * ------------------------------------------------------------------------------------------------
 * Clase en directo de PER 16450: tres reclutas con ficha no podían fichar porque la web les pedía el código de clase; entraban con
 * otra cuenta de Google. Norberto: una línea fija («Hay un 99 % de probabilidades de que estés en otra cuenta») y una ayuda: PER y
 * alias, el avatar y, al pulsarlo, una parte del correo; y un botón para salir y entrar con esa cuenta.
 *
 *  · La pieza es del motor: GamificaPro sdk/otraCuenta.js (`GP.otraCuenta`; su prueba con un documento de verdad,
 *    tests/sdk/otra-cuenta.test.ts) y el servidor `modPistaCuenta` (tests/functions/mod-pista-cuenta.test.ts: máscara, tope, sin
 *    ficha, respuesta vaga). Aquí: que la copia es exacta, que se carga en las cuatro pantallas, que la línea fija está en cada una
 *    aunque la pieza falle, y la piel de STARGATE (assets/js/otra-cuenta-sg.js) ejecutada con un motor de mentira.
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const raiz = path.join(__dirname, "..");
const leer = f => fs.readFileSync(path.join(raiz, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + JSON.stringify(dato))); };

console.log("▶ 160 · ¿Ya te alistaste y no ves tu clase? La pista de la otra cuenta");
const LINEA = "Hay un 99 % de probabilidades de que estés en otra cuenta";

// ── 1 · la pieza del motor, copiada tal cual
console.log("\n  · 1 · la pieza del motor (GP.otraCuenta), copiada tal cual");
const PIEZA = leer("assets/js/otraCuenta.js");
const GPDIR = process.env.GAMIFICAPRO_DIR || path.join(raiz, "..", "..", "gamificapro");
const sdk = path.join(GPDIR, "sdk", "otraCuenta.js");
if (fs.existsSync(sdk)) c(fs.readFileSync(sdk, "utf8") === PIEZA, "🔴 la copia es exacta (GamificaPro sdk/otraCuenta.js): no se edita aquí");
c(/modPistaCuenta/.test(PIEZA) && /accion: "avatares"/.test(PIEZA) && /accion: "pista"/.test(PIEZA), "   pide al servidor los avatares y la pista (modPistaCuenta)");
c(/sinServidor/.test(PIEZA) && /data-gpo-otra/.test(PIEZA), "   sin servidor, lo dice y deja «Entrar con otra cuenta»");
c(/GB\.copiar_pieza\(HERE, "otraCuenta\.js"/.test(leer("_build_site.py")), "   el build la copia en cada pasada");

// ── 2 · dónde se carga
console.log("\n  · 2 · las cuatro pantallas cargan la pieza y su piel, con huella, antes de su propio script");
const PAGS = { "entrar.html": "entrar.js", "alistarse.html": "alistarse.js", "recluta.html": "recluta.js", "sesion.html": "sesion.js" };
for (const [pag, js] of Object.entries(PAGS)) {
  const H = leer(pag);
  const a = H.search(/<script src="assets\/js\/otraCuenta\.js\?v=[0-9a-f]{10}" defer><\/script>/);
  const b = H.search(/<script src="assets\/js\/otra-cuenta-sg\.js\?v=[0-9a-f]{10}" defer><\/script>/);
  const d = H.search(new RegExp('<script src="assets/js/' + js.replace(".", "\\.") + '\\?v=[0-9a-f]{10}" defer></script>'));
  c(a > 0 && b > a && d > b, "🔴 " + pag + ": otraCuenta.js → otra-cuenta-sg.js → " + js, { a, b, d });
}

// ── 3 · la línea fija, en cada pantalla, aunque la pieza no cargue
console.log("\n  · 3 · la línea fija, escrita en cada pantalla (si la pieza no carga, se queda)");
const ENTRAR = leer("assets/js/entrar.js"), ALIS = leer("assets/js/alistarse.js"), REC = leer("assets/js/recluta.js"), SES = leer("assets/js/sesion.js");
c(ENTRAR.indexOf(LINEA) > 0 && /id="e-otra-ayuda"/.test(ENTRAR), "🔴 la puerta (entrar.js), en el paso del código de clase");
c(/function pedirCodigo\(yo, aviso\)[\s\S]*e-otra-ayuda[\s\S]*SG\.ayudaOtraCuenta\(document\.getElementById\("e-otra-ayuda"\)/.test(ENTRAR),
  "   y allí se monta la ayuda, con su correo; elegida la otra cuenta, se vuelve a repartir");
c(/alEntrar: function \(\) \{ repartiendo = false; repartir\(\); \}/.test(ENTRAR), "   (repartir otra vez: si con esa ya estaba, va a su Nave)");
c(/No escribas el código/.test(ENTRAR) && /¿Eres docente\?/.test(ENTRAR), "   sigue diciendo que no escriba el código, y al docente con qué cuenta entrar");
c((ALIS.match(new RegExp(LINEA, "g")) || []).length === 2 && /otraCuentaAyuda\("a-otra-ayuda"\)/.test(ALIS),
  "🔴 alistarse (alistarse.js): en el código y en el formulario (el enlace trae el código: ahí se haría la ficha repetida)");
c(/if \(!fantasma\) otraCuentaAyuda/.test(ALIS) && /\(fantasma \? '' :/.test(ALIS), "   al docente que se alista como fantasma, no");
c(/function otraCuentaAyuda\(id\) \{\n\s*if \(DEMO \|\| !window\.SG/.test(ALIS) && /per: PER/.test(ALIS), "   con el grupo puesto (el de la URL); en la demo, nada");
c(REC.indexOf(LINEA) > 0 && /id="nave-otra-ayuda"/.test(REC) && /getElementById\('nave-otra-ayuda'\)/.test(REC),
  "🔴 la Nave sin ficha en ese grupo (recluta.js, junto a «Alistarme ahora»)");
c(SES.indexOf("Hay un 99 % de probabilidades de que estés en otra cuenta.") > 0 && /function sinGrupos\(yo\)\{[\s\S]{0,1400}ses-otra-ayuda[\s\S]{0,400}SG\.ayudaOtraCuenta/.test(SES),
  "🔴 la sesión (sesion.js, sinGrupos: «esas credenciales no coinciden»)");
const CSS = leer("assets/css/stargate.css");
c(/\.gpo-velo\{--gpo-capa:80;/.test(CSS) && /\.sg-otra-cuenta\{/.test(CSS), "   con su piel: la ventana como la de cambiar el correo y la línea en el aviso ámbar");

// ── 4 · la piel, ejecutada
console.log("\n  · 4 · la piel de STARGATE (otra-cuenta-sg.js), con un motor de mentira");
function mundo(o) {
  o = o || {};
  const creadas = [], montadas = [], llamadas = [], recargas = [];
  const W = { SG: {
    avatarSrc: (av, alias, xp) => ({ src: "assets/img/avatares/evo/p" + (av.n || 1) + "f_r" + (xp > 100 ? 2 : 1) + ".jpg" }),
    MOTOR: o.sinMotor ? null : { llamar: (n, d) => { llamadas.push([n, d]); return Promise.resolve({ ok: true }); },
      entrar: () => (o.cierra ? Promise.reject(new Error("popup-closed")) : Promise.resolve({ uid: "otra" })) },
  } };
  if (!o.sinPieza) W.GP = { otraCuenta: { crear: (op) => { creadas.push(op); return { montar: (h) => montadas.push(h) }; } } };
  const loc = { href: "", reload: () => recargas.push(1) };
  vm.runInContext(leer("assets/js/otra-cuenta-sg.js"), vm.createContext({ window: W, location: loc, Promise }));
  return { W, creadas, montadas, llamadas, recargas, loc };
}
(async () => {
  let M = mundo();
  const G = M.W.SG.otraCuentaGrupo;
  c(G("16450") === "per-16450" && G(" PER 16450 ") === "per-16450" && G("per-16450") === "per-16450" && G("per 16450") === "per-16450",
    "🔴 el PER como lo teclee («16450», «PER 16450», «per-16450») → el grupo per-16450");
  c(G("") === "" && G("hola") === "" && G("12") === "", "   lo que no es un PER, nada (la ventana dice «No encuentro ese PER»)");
  const hueco = { id: "h" };
  const A = M.W.SG.ayudaOtraCuenta(hueco, { per: "per-16450", nombreGrupo: "PER 16450", correo: "nueva@gmail.com" });
  const op = M.creadas[0] || {};
  c(!!A && M.montadas[0] === hueco, "   se monta en su hueco");
  c(op.grupo === "per-16450" && op.nombreGrupo === "PER 16450" && op.correo === "nueva@gmail.com", "   con el grupo y la cuenta de ahora", op);
  c(op.avatar({ alias: "Cometa", avatar: { n: 5 }, xp: 120 }) === "assets/img/avatares/evo/p5f_r2.jpg", "   el avatar, con el mismo dibujo que la Nave (SG.avatarSrc, con su rango)");
  c(op.avatar({ alias: "x", avatar: null }) === "assets/img/avatares/evo/p1f_r1.jpg", "   sin avatar guardado, el estable por alias (como en el tablero)");
  c(/Comandante/.test(op.textos.noPista) && /PER/.test(op.textos.grupo) && /Nave/.test(op.textos["ya-estas"]), "   con las palabras de STARGATE (PER, Comandante, Nave)");
  c(op.clases.boton === "btn primary" && op.clases.secundario === "btn", "   y sus botones");
  await op.llamar("modPistaCuenta", { accion: "avatares", projectId: "per-16450" });
  c(M.llamadas.length === 1 && M.llamadas[0][0] === "modPistaCuenta", "   llama al servidor por el motor (SG.MOTOR.llamar)");
  op.entrarConOtra(); await new Promise(r => setTimeout(r, 0));
  c(M.recargas.length === 1, "🔴 «Salir y entrar con esa cuenta»: el selector de Google y, elegida, recarga (de serie)");
  let vuelta = 0;
  M.W.SG.ayudaOtraCuenta(hueco, { alEntrar: () => vuelta++ });
  M.creadas[1].entrarConOtra(); await new Promise(r => setTimeout(r, 0));
  c(vuelta === 1 && M.recargas.length === 1, "   o lo que diga la página (la puerta vuelve a repartir)");
  c(M.creadas[1].grupo === "", "   sin grupo (la puerta), lo pregunta la ventana");
  M = mundo({ cierra: true }); M.W.SG.ayudaOtraCuenta(hueco, {}); M.creadas[0].entrarConOtra(); await new Promise(r => setTimeout(r, 0));
  c(M.recargas.length === 0, "   si cierra la ventana de Google, no pasa nada");
  M = mundo({ sinPieza: true });
  c(M.W.SG.ayudaOtraCuenta(hueco, {}) === null, "🔴 sin la pieza cargada, no pinta nada (se queda la línea escrita)");
  M = mundo({ sinMotor: true }); M.W.SG.ayudaOtraCuenta(hueco, {});
  let rechazo = false; await M.creadas[0].llamar("modPistaCuenta", {}).catch(() => { rechazo = true; });
  c(rechazo, "   sin motor, la llamada falla (y la ventana dice «Ahora mismo no puedo buscarla»)");
  M.creadas[0].entrarConOtra();
  c(M.loc.href === "entrar.html", "   y «entrar con otra cuenta» lleva a la puerta");

  console.log("\n  Batería 160 · " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
  if (fallos.length) { console.log("  FALLOS:\n   - " + fallos.join("\n   - ")); process.exit(1); }
})();
