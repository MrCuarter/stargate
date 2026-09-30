'use strict';
/**
 * BATERÍA 119 · LAS PREGUNTAS DE LA ACADEMIA, DENTRO DE LOS MINIJUEGOS (30-sep)
 *
 * Norberto: «¡USA LOS MINIJUEGOS PARA PREGUNTAR! Mete las preguntas en el minijuego, así los prueban. Las preguntas que fallen
 * se vuelven a lanzar; cuando acierten todas… que salte una ventana (Enhorabuena, has acertado todas, puedes seguir jugando o
 * pasar al siguiente módulo; botones para elegir)». El modo Academia (?banco=academia) de las cinco máquinas de Joran
 * (juegos/joran/desafio.js) y de la Ruta de la Estática (juegos/ruta/juego.js). La cola de preguntas se EJECUTA aquí; la
 * partida entera (fallar, volver a salir, la enhorabuena y el aviso a la Academia) se probó en el navegador el 30-sep.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };

const DES = L("juegos/joran/desafio.js"), RUTA = L("juegos/ruta/juego.js"), CSSJ = L("juegos/joran/comun.css");

// ── 1 · Las máquinas de Joran
c(/export const ACADEMIA = QS\.get\('banco'\) === 'academia';/.test(DES) && /export const MODO = QS\.get\('modo'\) === 'desafio' \|\| ACADEMIA \? 'desafio' : 'arcade';/.test(DES),
  "🔴 ?banco=academia: siempre en desafío");
c(/if \(ACADEMIA\) return '#sin-modo';/.test(DES) && /a\[href="#sin-modo"\]\{display:none!important\}/.test(DES), "   sin el botón para pasar a arcade (se saltarían las preguntas)");
c(/if \(ACADEMIA\) \{ try \{ return await fuenteAcademia\(\); \}/.test(DES), "   las preguntas, de la Academia (y no del servidor ni del banco del alumnado)");
c(/window\.parent\.SG_BANCO_JUEGO/.test(DES) && /sessionStorage\.getItem\('sgBancoJuego'\)/.test(DES), "   se las pasa la página que abre el juego (y, si se abre suelto, la pestaña)");

// la cola, EJECUTADA: la que se falla vuelve; al acertar todas, no queda ninguna
const a = DES.indexOf("function bancoAcademia()"), b = DES.indexOf("function avisarAcademia(");
const hacer = new Function("window", "sessionStorage", "barajar", DES.slice(a, b) + "; return fuenteAcademia;");
const banco = [{ p: "Uno", o: ["A", "B", "C"], ok: 0, porque: "p1" }, { p: "Dos", o: ["A", "B", "C"], ok: 0, porque: "p2" }, { p: "Tres", o: ["A", "B", "C"], ok: 0, porque: "p3" }];
const W = { parent: { SG_BANCO_JUEGO: banco } };
(async () => {
  const F = await hacer(W, { getItem: () => null }, (xs) => xs)();
  c(F.total === 3 && F.pendientes() === 3, "   tres preguntas, tres pendientes");
  let q = await F.siguiente(), r = await F.responder(q, (q.buena + 1) % 3);
  c(!r.ok && r.vuelve && F.pendientes() === 3 && r.correccion === "p1", "🔴 la que se falla no cuenta, trae su porqué y VUELVE", JSON.stringify(r));
  const vistas = [];
  for (let k = 0; k < 6 && F.pendientes(); k++) { q = await F.siguiente(); vistas.push(q.enunciado); await F.responder(q, q.buena); }
  c(F.pendientes() === 0 && vistas.indexOf("Uno") > 0, "🔴 vuelve a salir DETRÁS de las demás, y al acertar todas no queda ninguna", vistas.join(","));
  c(/if \(ACADEMIA && r\.ok && !todasDichas && fuente\.pendientes\(\) === 0\)/.test(DES) && /Enhorabuena, has acertado todas/.test(DES) && /Puedes seguir jugando o pasar al siguiente módulo\./.test(DES),
    "🔴 con todas acertadas, la ventana: «Enhorabuena, has acertado todas… seguir jugando o pasar al siguiente módulo»");
  c(/id="des-seguir">Seguir jugando/.test(DES) && /id="des-sig">Pasar al siguiente módulo/.test(DES) && /D\.disponible = false; D\.nivel = 100; hud\.classList\.add\('oculto'\); cerrar\(\);/.test(DES),
    "   «Seguir jugando»: sin más preguntas, hasta que te maten");
  c(/avisarAcademia\(\{ todas: true, aciertos: D\.aciertos, fallos: D\.fallos \}\)/.test(DES) && /avisarAcademia\(\{ siguiente: true \}\)/.test(DES) && /postMessage\(\{ sgAcademia: m \}, location\.origin\)/.test(DES),
    "🔴 y avisa a la Academia (al acertarlas todas y al pasar de módulo), solo a su mismo origen");
  c(/Esta pregunta volverá a salir\./.test(DES) && /\.des-enhora\{/.test(CSSJ), "   el aviso de «volverá a salir» y el estilo de la enhorabuena");
  c(/if \(D\.nivel >= 99 && !ACADEMIA\)/.test(DES), "   en la Academia se puede pedir pregunta cuando se quiera (Q), sin esperar al depósito vacío");

  // ── 2 · Las cinco máquinas lo heredan (todas crean su desafío con crearDesafio)
  ["conquista", "evacuacion", "laberinto", "ruta-azul", "descenso"].forEach((m) => {
    const src = L("juegos/joran/" + m + ".js");
    c(/crearDesafio\(/.test(src) && /from '\.\/desafio\.js\?v=[0-9a-f]{10}'/.test(src), "   " + m + ": pregunta con el desafío común (con su huella)");
  });

  // ── 3 · La Ruta de la Estática
  c(/const ACADEMIA = QS\.get\('banco'\) === 'academia';/.test(RUTA) && /window\.parent\.SG_BANCO_JUEGO/.test(RUTA), "🔴 la Ruta: el mismo modo Academia");
  c(/const r = ACADEMIA \? \{ partida: null, preguntas: barajar\(ACA\.qs\.filter\(\(q\) => ACA\.pendientes\.has\(q\.id\)\)\)\.map\(preguntaAcademia\) \}/.test(RUTA),
    "   cada vuelo trae solo las que faltan (las pendientes sobreviven a una caída)");
  c(/M\.preguntasCola\.push\(preguntaAcademia\(ACA\.qs\.find\(\(x\) => x\.id === P\.q\.id\)\)\);/.test(RUTA) && /M\.momentos\.push\(t\); M\.duracion = Math\.max\(M\.duracion, t \+ 14\);/.test(RUTA),
    "🔴 la que se falla vuelve a salir, con su hueco en el vuelo (y el vuelo se alarga)");
  c(/function enhorabuena\(\)/.test(RUTA) && /pausa = true;/.test(RUTA) && /Enhorabuena, has acertado todas/.test(RUTA) && /id="b-seguir">Seguir jugando/.test(RUTA) && /id="b-sig">Pasar al siguiente módulo/.test(RUTA),
    "   con todas acertadas, la misma ventana (y el vuelo se para mientras se elige)");
  c(/if \(ACADEMIA\) \{ \/\/ la Academia: ni servidor, ni medalla/.test(RUTA), "   sin servidor, sin medallas ni premios: lo que falta y otra vuelta");
  c(/x\.o\.slice\(0, 4\)/.test(RUTA), "   como mucho cuatro puertas por pregunta");

  console.log("\n  Batería 119 · las preguntas de la Academia, dentro de los minijuegos");
  console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
  process.exit(fallos.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
