'use strict';
/**
 * BATERÍA 126 · EN LA ACADEMIA NO SE MUERE (3-oct)
 *
 * Norberto, jugando a La Evacuación en la Academia: «estaría bien que los docentes de esta academia tuvieran más vidas; el juego
 * como tal ahora mismo nos da igual, solo queremos que lo vean, pero un docente "torpe" puede quedarse atascado y tirar la
 * toalla. Haz que no se pueda morir». Con ?banco=academia (SIN_MORIR, en desafio.js): los golpes se notan pero no quitan vidas,
 * la lava te devuelve arriba, el reloj no cierra la partida y en la Ruta el escudo se recarga. En la sala de Joran, como siempre.
 * (Probado en el navegador: La conquista con la lava encima sigue viva, con su aviso.)
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };

const DES = L("juegos/joran/desafio.js");
c(/export const SIN_MORIR = ACADEMIA;/.test(DES) && /export const ACADEMIA = QS\.get\('banco'\) === 'academia';/.test(DES), "🔴 SIN_MORIR solo con ?banco=academia (la sala de Joran del alumnado no cambia)");
const imp = (f) => new RegExp("import \\{ crearDesafio, MODO, urlModo, SIN_MORIR[^}]*\\} from './desafio\\.js").test(L(f));
c(["conquista", "evacuacion", "laberinto", "ruta-azul", "descenso"].every((j) => imp("juegos/joran/" + j + ".js")), "   las cinco máquinas de la Academia lo importan");

const CQ = L("juegos/joran/conquista.js");
c(/if \(!SIN_MORIR\) return morir\('lava'\);/.test(CQ) && /J\.vy = -SALTO \* 1\.35;[^\n]*P\.lava \+= 140;/.test(CQ), "🔴 Fôrge · la lava te devuelve a las rocas (y baja un poco)");
c(/if \(!SIN_MORIR\) P\.escudos--;/.test(CQ), "   Fôrge · los golpes de la Estática y los géiseres no quitan escudos");
const EV = L("juegos/joran/evacuacion.js");
c(/if \(fatal && !SIN_MORIR\) \{ atrapado\(/.test(EV) && /if \(fatal\) avisoSinMorir\(\);/.test(EV), "🔴 Ecos · el bloque o el segundo tropiezo es un tropiezo más");
const LB = L("juegos/joran/laberinto.js");
c(/if \(!SIN_MORIR\) P\.vidas--;/.test(LB) && /L\.t = L\.cfg\.tiempo; aviso\('EN LA ACADEMIA, EL RELOJ VUELVE A EMPEZAR'/.test(LB), "   el Laberinto · los drones no quitan vidas y el reloj vuelve a empezar");
const RA = L("juegos/joran/ruta-azul.js");
c(/if \(!SIN_MORIR\) S\.vidas--;/.test(RA) && /if \(S\.t > 210 && !SIN_MORIR\)/.test(RA), "   Ruta Azul · los derribos no quitan vidas y el tiempo no la cierra");
const DS = L("juegos/joran/descenso.js");
c(/if \(!SIN_MORIR\) S\.vidas--;/.test(DS) && /S\.estado === 'vuela' && !SIN_MORIR\)/.test(DS), "   el Descenso · estrellarse no gasta módulos y el simulador no se cierra por tiempo");
const RT = L("juegos/ruta/juego.js");
c(/if \(M\.escudo <= 0\) \{ if \(ACADEMIA\) \{ M\.escudo = 40;/.test(RT), "   la Ruta de la Estática (Ludo, Vínculo, Liminar) · con el escudo a cero, NEBULA lo recarga");
c(/const AVISO_SIN_MORIR = '¡AUCH! EN LA ACADEMIA NO SE PIERDE';/.test(DES) && /'¡AUCH! EN LA ACADEMIA NO SE PIERDE'/.test(RT), "   el golpe se nota: «¡AUCH! EN LA ACADEMIA NO SE PIERDE»");

// 3-oct (2.º mensaje) · «avisa de que en este modo no les dejamos perder, pero los estudiantes tendrán vidas limitadas»
const AVISO = "<b>Aquí no puedes perder:</b> en la Academia tienes vidas ilimitadas, para que nadie se quede atascado. Tu alumnado, en la sala de Joran, sí las tendrá limitadas.";
c(L("assets/js/academia.js").includes("(okJ ? \"\" : '<p class=\"acd-sin-morir\">" + AVISO + "</p>')"), "🔴 el aviso, en la diapositiva del juego de la Academia (antes de superarlo)");
c(DES.includes('<p class="des-intro">' + AVISO + "</p>") && RT.includes("<p>" + AVISO + "</p>"), "   y dentro del juego, en su portada (las cinco máquinas y la Ruta)");
c(/\.acd-juego-caja \.acd-sin-morir\{/.test(L("assets/css/stargate.css")), "   con su recuadro");

console.log("\n  Batería 126 · en la Academia no se muere");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
