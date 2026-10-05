'use strict';
/**
 * BATERÍA 130 · LAS CIFRAS DE LA SESIÓN, EN GRÁFICAS QUE SE CONSTRUYEN (5-oct)
 *
 * Norberto, tras la rueda de la nota: «¿hay algo que merezca gráfica aparte de eso?» → «me gustan todas, así que adelante».
 * Cinco diapositivas con cifras pasan a dibujarse delante de la clase: la rúbrica («Para el 10») en una rueda de 10 puntos,
 * la llamada a filas en un anillo que se llena con cada fichaje, el ticket («Cómo os fue») con las barras dibujándose y un
 * medidor de la media, los escuadrones en carrera y la portada de cada semana con el curso entero en una línea.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };
const S = L("assets/js/sesion.js"), CSS = L("assets/css/stargate.css");

console.log("  Lo común");
c(/function contar\(el, meta, dec\)/.test(S) && /function contarTodo\(root\)/.test(S), "los números suben solos hasta su valor (un solo contador para todas)");
c(/function reduceMov\(\)/.test(S) && /if\(reduceMov\(\)\)\{ el\.textContent=f\(meta\); return; \}/.test(S), "   con «menos movimiento», salen ya puestos");

console.log("  1 · «Para el 10»: la rúbrica en rueda");
c(/function aroRubrica\(R\)/.test(S) && /'<div class="ac-rub-aro"><div class="nx-rueda">'\+aroRubrica\(R\)/.test(S), "la rueda de 10 puntos, un trozo por criterio, del tamaño de lo que vale");
c(/\/portfolio\/i\.test\(r\[2\]\)\?'#37e0ec':'#f5b043'/.test(S) && /\.ac-rub-x em\.ep\{color:#37e0ec\}/.test(CSS), "   lo del portfolio, en turquesa (también su etiqueta); lo del PDF, en ámbar");
c(/a\.classList\.toggle\('on', !!h\[a\.getAttribute\('data-rub-arc'\)\]\)/.test(S) && /contar\(el\.querySelector\('\.ac-rub-n'\), tot/.test(S), "   marcar un criterio llena su trozo y sube el número");
c(!/ac-rub-bar/.test(S), "   la barra de antes ya no está");

console.log("  2 · La llamada a filas: el anillo");
c(/function totalLlamada\(fichados\)/.test(S) && /Math\.max\(mios\|\|V\.length, fichados\|\|0\)/.test(S), "de cuántos: los de tu escuadrón (o todo el grupo), nunca menos de los que ya ficharon");
c(/class="ll-aro-f"/.test(S) && /aro\.style\.strokeDasharray=/.test(S) && /'¡todos a bordo!'/.test(S), "   se llena con cada fichaje y, completo, «¡todos a bordo!»");

console.log("  3 · El ticket: barras que se dibujan y el medidor");
c(/function medidorTicket\(N\)/.test(S) && /\+\(A\.notas\.length\?medidorTicket\(A\.notas\.slice\(0,6\)\):''\)/.test(S), "un medidor del 1 al 5 con la media de todas las preguntas");
c(/@keyframes tk-dibuja/.test(CSS) && /x\.style\.setProperty\('--i', i\)/.test(S), "   las barras se dibujan de izquierda a derecha, una detrás de otra");
c(/class="tk-n-m" data-cuenta=/.test(S) && /contarTodo\(caja\)/.test(S), "   y las medias suben solas");

console.log("  4 · Escuadrones: la carrera");
c(/k:'escuadrones', rot:'Escuadrones', montar:montarCarrera/.test(S) && /localeCompare\(String\(b\.nombre\),'es'\)/.test(S), "salen en orden alfabético, con la barra a cero");
c(/function montarCarrera\(el\)/.test(S) && /t2=setTimeout\(ordena, 2400\)/.test(S) && /\.esc-lista\.acabada \[data-lider\] \.esc-corona/.test(CSS), "   corren, se reordenan y el primero sale coronado");
c(/replace\(\/\^comandante\\s\+\/i,''\)\)\+' · '/.test(S), "   sin «Comandante Comandante»");

console.log("  5 · La portada: el curso en una línea");
c(/function rutaCurso\(sem, n\)/.test(S) && /\+rutaCurso\(Number\(s\.sem\)\|\|0, n\)/.test(S), "cada portada lleva el curso entero: semanas, planetas y la nave en esta semana");
c(/Semana <b>'\+sem\+'<\/b> de '\+n/.test(S) && /@keyframes rc-nave/.test(CSS), "   «semana X de N · quedan Y», y la nave avanza hasta su sitio");

console.log("  Que se vea igual de bien sin animación");
c(/@media \(prefers-reduced-motion:reduce\)\{\.tk-nota \.tk-n-b\{animation:none/.test(CSS) && /\.rc-hecho\{animation:none;width:var\(--hasta\)\}/.test(CSS), "con «menos movimiento», todo sale ya dibujado");

console.log("\n  Batería 130 · Las cifras de la sesión, en gráficas");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
