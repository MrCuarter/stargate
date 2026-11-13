'use strict';
/**
 * BATERÍA 158 · LA LUPA DE LA CLASE Y LA LECCIÓN QUE CRECE CON LA PANTALLA (13-nov-2026)
 *
 * Norberto: «estudiantes que decían que se veía muy pequeño y no se podía ampliar […] una lupita […] y que si hiciera clic en
 * ciertas partes donde hubiera texto, se pudiera ampliar». El laboratorio lo midió: proyectada a 1920×1080, el 93 % del texto de
 * la lección quedaba por debajo del 2,2 % del alto de la pantalla; ahora, el 13 %. Las piezas son de GamificaPro (sdk/lupa.js y
 * sdk/leccion.js → escalar); aquí se comprueba que la web las copia, las carga y las enciende como toca. Cómo se ve y se toca:
 * el laboratorio de la lupa (41/41: lector, lupa, Ctrl + rueda, arrastre, dos pantallas y móviles de 320 a 768).
 */
const fs = require("fs"), path = require("path");
const R = (f) => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
const S = R("assets/js/sesion.js"), H = R("sesion.html"), B = R("_build_site.py");
let ok = 0; const fallos = [];
const c = (cond, txt) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt); };

console.log("Batería 158 · La lupa de la clase");
c(/GB\.copiar_pieza\(HERE, "lupa\.js"/.test(B), "🔴 el build copia la pieza de GamificaPro (no se edita aquí)");
c(fs.existsSync(path.join(__dirname, "..", "assets/js/lupa.js")) && /GAMIFICAPRO · LA LUPA DE LA CLASE/.test(R("assets/js/lupa.js")), "   y está copiada");
c(/assets\/js\/lupa\.js(\?v=[0-9a-f]+)?" defer/.test(H) && H.indexOf("lupa.js") > H.indexOf("leccion.js") && H.indexOf("lupa.js") < H.indexOf("sesion.js"), "   sesion.html la carga detrás de la lección y antes que la sesión");
const LJ = R("assets/js/leccion.js");
c(/function escalar\(el, o\)/.test(LJ) && /escala: escala, escalar: escalar/.test(LJ), "   la lección copiada ya trae escala/escalar");
c(/function montar\(\)\{[\s\S]{0,400}escalarLeccion\(\);/.test(S), "🔴 cada diapositiva, al montarse, se escala (si es de la lección)");
c(/d\.classList\.contains\('leccion'\)\) L\.escalar\(d, \{ caja:l, base:\[1280,640\] \}\)/.test(S), "   solo la lección, con su lienzo como caja y la base de 1280×640 (lo que deja la diapositiva en 1280×720)");
c(/window\.addEventListener\('resize', escalarLeccion\)/.test(S) && /fullscreenchange', function\(\)\{ setTimeout\(escalarLeccion/.test(S), "   y otra vez al cambiar el tamaño o la pantalla completa");
c(/lupaIniciar\(\); publicarNotas\(\); presIniciar\(\);/.test(S), "🔴 la lupa se enciende al pintar, antes que el presentador");
c(/Z\.poner\('#mazo \.lienzo'/.test(S), "   sobre la diapositiva (#mazo .lienzo)");
c(/evitar: Z\.EVITAR\+',\[data-revelable\]:not\(\.on\),\.cara\[data-quien\]/.test(S), "   lo que se pulsa para otra cosa (destapar, la ficha de una cara, el visor) no abre el lector");
c(!/\.lc-caja,/.test((S.match(/bloques: [^\n]*/) || [""])[0]), "   el contenedor de las tarjetas no es un bloque (se abre la tarjeta pulsada, no todas)");
c(/alCambiar: function\(v\)\{ if\(PZ\.on&&PZ\.m\) PZ\.m\.acc\('lupa:'\+JSON\.stringify\(v\)\); \}/.test(S), "🔴 con dos pantallas, lo ampliado viaja a la presentación por el canal del presentador");
c(/alLector: function\(r\)\{ if\(PZ\.on&&PZ\.m\) PZ\.m\.acc\('lector:'/.test(S), "   y lo abierto con un clic, también");
c(!/lupa:[^\n]*(setDoc|updateDoc|emitir\()/.test(S), "   🔴 nada de eso pasa por el directo de Firestore (cada zoom sería una escritura)");
c(/alAcc:function\(a\)\{ if\(lupaDesde\(a\)\) return;/.test(S), "   la presentación lo aplica (vista y lector) antes que lo demás");
c(/LUPA\.vista\(JSON\.parse\(a\.slice\(5\)\)\)/.test(S) && /LUPA\.abrir\(JSON\.parse\(a\.slice\(7\)\)\)/.test(S), "   con try: un mensaje roto no la tumba");
c(/GP\.lupa\.botonHTML\(\{ icono:LUPA_ICO, clase:'ses-ic ses-lupa'/.test(S) && /LUPA_ICO='assets\/img\/iconos\/lupa\.png'/.test(S), "   el botón, con los demás mandos y el icono de la Nave");
c(fs.existsSync(path.join(__dirname, "..", "assets/img/iconos/lupa.png")) && fs.existsSync(path.join(__dirname, "..", "assets/img/iconos/p/lupa.png")), "   el icono, con aro y solo el pictograma");
c(/LUPA\.lupa\(document\.documentElement\.classList\.contains\('gpz-lupa-on'\)\)/.test(S), "   repintada la barra, el botón conserva si la lupa estaba encendida");

console.log("\n  Batería 158 · La lupa de la clase");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
if (fallos.length) process.exit(1);
