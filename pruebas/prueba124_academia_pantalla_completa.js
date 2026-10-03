'use strict';
/**
 * BATERÍA 124 · LA ACADEMIA, A PANTALLA COMPLETA (3-oct)
 *
 * Norberto, haciendo la Academia: «¿podríamos permitir que el docente (en este caso hace de estudiante) ponga la presentación
 * en pantalla completa?». El botón de las cuatro esquinas (arriba a la derecha de la diapositiva) o la F. Se pone a pantalla
 * completa la PÁGINA y la diapositiva ocupa todo con una clase en el body: la Academia se repinta entera al avanzar, al
 * cumplir una misión o al llegar una respuesta, y una diapositiva puesta a pantalla completa por sí sola se saldría.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };

const A = L("assets/js/academia.js"), CSS = L("assets/css/stargate.css"), SES = L("assets/js/sesion.js");

c(/botonCompleta\(\) \+ barraPasos\(P\) \+ "<\/div>"/.test(A), "🔴 cada diapositiva lleva el botón de pantalla completa");
c(/var h = document\.documentElement, pide = h\.requestFullscreen \|\| h\.webkitRequestFullscreen/.test(A) && /document\.body\.classList\.add\("acd-completa"\)/.test(A),
  "🔴 se pone a pantalla completa la página (no la diapositiva, que se repinta) y la diapositiva lo ocupa todo");
c(/r\.catch\(function \(\) \{ \/\* la diapositiva ocupa la ventana \*\/ \}\)/.test(A), "   si el navegador no deja (iPhone), la diapositiva ocupa la ventana igualmente");
c(/if \(!pantallaDelNavegador\(\) && completa\(\)\) \{ document\.body\.classList\.remove\("acd-completa"\)/.test(A), "   salir con Esc del navegador quita también la clase (no se queda la página bloqueada)");
c(/ev\.key === "Escape" && completa\(\) && !pantallaDelNavegador\(\) && !\(fl && !fl\.hidden\)/.test(A), "   y sin pantalla del navegador, Esc sale (salvo con «Pregunta a NEBULA» abierta, que se cierra primero)");
c(/\(ev\.key === "f" \|\| ev\.key === "F"\) && !ev\.metaKey && !ev\.ctrlKey && !ev\.altKey\) \{ ev\.preventDefault\(\); pantallaCompleta\(\); \}/.test(A)
  && A.indexOf('ev.key === "f"') > A.indexOf('if (t === "INPUT" || t === "TEXTAREA"'), "   la F, como en la sesión de clase (no mientras se escribe ni se juega)");
c(/title="' \+ t \+ ' \(F\)" aria-label="' \+ t \+ '"/.test(A), "   el botón dice lo que hace (Pantalla completa / Salir de pantalla completa)");

c(/body\.acd-completa #acd-ses\{position:fixed;inset:0;z-index:800/.test(CSS) && /body\.acd-completa \.acd-dia\{flex:1 1 auto;aspect-ratio:auto/.test(CSS), "🔴 la diapositiva ocupa toda la pantalla");
c(/body\.acd-completa:has\(#acd-ses\)\{overflow:hidden\}/.test(CSS), "   la página de detrás no se desplaza (y si no hay diapositiva, nada se bloquea)");
c(/body\.acd-completa \.acd-dia-sub\{font-size:clamp\(\.95rem,1\.45vw,1\.75rem\)\}/.test(CSS) && /body\.acd-completa \.acd-dia-h1\{font-size:clamp\(2rem,4\.6vw,5\.6rem\)\}/.test(CSS),
  "   la letra crece con la pantalla (en un proyector o un monitor grande no se queda pequeña)");
const z = Number((CSS.match(/\.acd-flota-b\{position:fixed;[^}]*z-index:(\d+)/) || [])[1]);
c(z > 800 && /body\.acd-completa \.acd-dia-barra\{right:190px\}/.test(CSS), "   «Pregunta a NEBULA» sigue a mano, encima, y la barra de pasos le deja sitio");
c(/\.acd-dia\.acd-juego:has\(\.jugando\) \.acd-completa-b/.test(CSS) && /body\.acd-completa \.acd-juego-pie \[data-pantalla\]\{display:none\}/.test(CSS),
  "   jugando, el botón no tapa el juego (y el del juego sobra si ya está todo a pantalla completa)");
c(/\.acd-completa-b\{top:auto;bottom:6px;right:50px/.test(CSS) && /\.acd-dia-barra\{left:52px;right:96px;bottom:18px\}/.test(CSS), "   en el móvil, abajo entre la barra y la flecha (no pisa el texto)");

c(/id="ses-pantalla" title="'\+\(fs\?/.test(SES) && !/id="ses-pantalla" title=""/.test(SES), "   la sesión de clase: el título del botón de pantalla completa ya no sale roto (title=\"\"…)");

console.log("\n  Batería 124 · la Academia, a pantalla completa");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
