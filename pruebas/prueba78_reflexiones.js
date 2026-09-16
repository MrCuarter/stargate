'use strict';
/**
 * BATERÍA 78 · LOS RETOS QUE SE RESPONDEN EN EL PROPIO RETO (15-sep-2026, noche).
 *
 * Norberto: «en los retos en los que tienen que compartir una breve reflexión o escribir algo concreto, en vez de ponerlo
 * en el foro, que lo respondan directamente sobre el reto… una caja de texto más grande… y dos semanas después, en la
 * presentación de clase, podrían aparecer las respuestas, priorizando las del escuadrón del profesor activo». Y: «que
 * pudieran ver el del resto de sus compañeros así como el enlace (servirá de ejemplo) y responderse/comentar».
 * Esto comprueba el reparto (datos → Nave, validar, consola, sesión) sin emulador; el laboratorio (sección 37) lo pisa
 * de verdad, y las reglas las prueba GamificaPro (tests/rules/stargate-reflexiones.test.ts).
 */
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const RAIZ = path.resolve(__dirname, "..");
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
const N = leer("assets/js/recluta.js"), F = leer("assets/js/fuente.js"), M = leer("assets/js/motor.js"), K = leer("assets/js/consola.js"),
      S = leer("assets/js/sesion.js"), V = leer("assets/js/validar.js"), CSS = leer("assets/css/stargate.css");
const trozo = (s, desde, n) => { const i = s.indexOf(desde); return i < 0 ? "" : s.slice(i, i + (n || 4000)); };

// 1 · los datos: qué retos, con qué pregunta y cuánto mínimo (un dato, un sitio: _site_data.py)
const D = JSON.parse(execFileSync("python3", ["-c",
  "import json,_site_data as D;print(json.dumps({'R':D.REFLEXION_RETOS,'E':D.EVIDENCIA_RETOS}))"], { cwd: RAIZ, encoding: "utf8" }));
const ids = Object.keys(D.R).sort();
// 16-sep · entran los tres relámpago de escribir: L2 (antes y durante), L3 (cinco líneas) y L6 (las diez líneas).
c(JSON.stringify(ids) === JSON.stringify(["A1", "A7", "A8", "B2", "B4", "B6", "B7", "L2", "L3", "L6"]),
  "🔴 los retos con reflexión son los acordados: A1, A7, A8, B2, B4, B6, B7 y los tres relámpago de escribir", ids.join(","));
c(ids.every(id => D.R[id].pide && D.R[id].titulo && D.R[id].min >= 100 && /^(texto|ambos)$/.test(D.R[id].modo)),
  "   cada uno con su pregunta, su título para la sesión, su mínimo (≥ 100 letras) y su modo");
c(ids.every(id => D.R[id].modo === "texto" ? D.E[id] !== "obligatoria" : D.E[id] === "obligatoria"),
  "🔴 en los de «texto» el enlace es opcional; en los de «ambos» sigue siendo obligatorio",
  ids.map(id => id + ":" + D.R[id].modo + "/" + (D.E[id] || "opcional")).join(" "));
c(["A0", "A2", "A3", "A4", "A5", "B1", "B3", "B5", "B8", "X1", "X2"].every(id => D.E[id] === "obligatoria" && !D.R[id]),
  "   los demás siguen pidiendo su enlace, sin caja de reflexión");

// 2 · los enunciados dicen que se responde ahí mismo (y ya no «en el foro» ni «súbelo con una reflexión»)
const html = leer("recluta.html");
const AY = JSON.parse((html.match(/window\.SG_AYUDA_RETOS=(\{.*?\});window\.SG_GANCHO_RETOS/) || [, "{}"])[1]);
c(ids.every(id => /caja del reto/.test(AY[id] || "")), "🔴 el enunciado de cada uno dice «aquí mismo, en la caja del reto»",
  ids.filter(id => !/caja del reto/.test(AY[id] || "")).join(","));
c(!/foro/i.test(AY.A1 || "") && !/foro/i.test(AY.A8 || ""), "   A1 y A8 ya no mandan al foro");
c(/window\.SG_REFLEXION=/.test(html) && /window\.SG_REFLEXION=/.test(leer("sesion.html")) && /window\.SG_REFLEXION=/.test(leer("consola.html")) &&
  /window\.SG_REFLEXION=/.test(leer("validar.html")), "   la regla llega a la Nave, la sesión, la consola y la caja de validar");

// 3 · el motor, en un solo sitio
c(/const REFLEX = "stargate_reflexiones", COMENT = "stargate_comentarios"/.test(M), "el motor guarda en stargate_reflexiones y stargate_comentarios");
c(/function idReflexion\(perId, reto, fichaId\) \{ return perId \+ "__" \+ reto \+ "__" \+ fichaId; \}/.test(M), "   una por recluta y reto (grupo__reto__ficha)");
c(/async function borrarReflexion[\s\S]{0,600}where\("reflexion", "==", id\)[\s\S]{0,300}deleteDoc\(doc\(db, REFLEX, id\)\)/.test(M),
  "   quitar una reflexión quita antes sus comentarios (si no, se quedarían colgando)");
c(["guardarReflexion", "reflexionesDe", "misReflexiones", "comentariosDe", "comentar", "borrarComentario", "borrarReflexion", "enlaceDeReflexion"]
  .every(f => new RegExp("\\b" + f + ",").test(trozo(M, "window.SG.MOTOR = {", 3000))), "   y todo se exporta en window.SG.MOTOR");

// 4 · la puerta de las escrituras (fuente.js): el mínimo, guardar tras el reto, cambiarla, comentar
c(/RF && textoRF\.length < \(RF\.min \|\| 1\)/.test(F), "🔴 registrar un reto con reflexión exige su mínimo también en la puerta (no solo en la pantalla)");
c(/M\.guardarReflexion\(cuerpo\.per, cuerpo\.reto, ficha\.id, textoRF, ev\)/.test(F) && /avisoReflexion: true/.test(F),
  "   se guarda tras registrarlo (con su enlace); si falla, el reto se queda y se avisa");
c(/cuerpo\.accion === "reflexion"/.test(F) && /cuerpo\.accion === "comentar"/.test(F) && /cuerpo\.accion === "borrarComentario"/.test(F),
  "   cambiar la reflexión, comentar y quitar un comentario tienen su acción");
c(/M\.borrarReflexion\(cuerpo\.per, cuerpo\.reto, ficha\.id\)/.test(trozo(F, 'cuerpo.accion === "cancelar"', 2500)), "   deshacer el reto se lleva su reflexión");
c(/M\.enlaceDeReflexion\(cuerpo\.per, cuerpo\.reto, ficha\.id, cuerpo\.evidencia\)/.test(F), "   cambiar el enlace pone al día la copia que ve la tripulación");
c(/yo_\.reflexiones = rf/.test(F) && /refl\[c\.reto\] = String\(c\.reflexion\)/.test(F), "   al entrar se leen las suyas (y en la Nave del Comandante, en memoria)");

// 5 · la Nave
c(/function campoReflexion\(id, clase\)/.test(N) && /rows="6" maxlength="2000"/.test(N), "🔴 la Nave tiene su caja GRANDE (6 filas, hasta 2000 letras)");
c(/puede salir en clase con tu alias, nunca con tu nombre/.test(N), "   y dice que la leerá su tripulación y puede salir en clase por su alias");
c(/campoReflexion\(t\[0\],'rs-rf'\)\+campoEvidencia\(t\[0\],'rs-ev'\)/.test(N) && /campoReflexion\(t\[0\],'mi-rf'\)/.test(N),
  "   en la tarjeta del reto y en la ficha de la insignia");
c(/if\(textoRF\.length<RF\.min\)/.test(N) && /Este reto se responde aquí mismo/.test(N), "   «Lo he hecho» no manda nada sin el mínimo, y lo dice");
c(/data-rfh="/.test(N) && /data-guardarf="/.test(N) && /accion:'reflexion'/.test(N), "   hecho el reto, su reflexión sale a la vista y se puede cambiar");
c(/function panelTripulacion\(id\)/.test(N) && /Lo que ha escrito tu tripulación/.test(N) && /M\.reflexionesDe\(per,id\)/.test(N),
  "🔴 «💬 Lo que ha escrito tu tripulación»: sus reflexiones, en el propio reto");
c(/Ver lo que hizo/.test(trozo(N, "function pintarTripulacion", 4000)), "   con su enlace (sirve de ejemplo)");
c(/data-rfform=/.test(N) && /accion:'comentar'/.test(N) && /data-rfborrar=/.test(N), "   y se comentan (quitar el tuyo, también)");
c(/En la Nave de Comandante no se comenta/.test(N) && /comentar: 'dejaría tu comentario/.test(N), "   en el simulacro y en la demo no se escribe (y se dice)");
c(/e\.textos=\{\}/.test(N) && /e\.coms=\{\}/.test(N), "   lo escrito (reflexión o comentario) no se pierde al repintarse la Nave");

// 6 · la caja de validar (dentro de un Genially)
c(/var RF = \(window\.SG_REFLEXION \|\| \{\}\)\[RETO\]/.test(V) && /M\.guardarReflexion\(g\.id, RETO, g\.ficha\.id, reflexion/.test(V),
  "la caja de validar un reto también pide la reflexión y la guarda");

// 7 · la consola
c(/MOTOR\.reflexionesDe\(PER\)/.test(K) && /sin reflexión, y este reto la pide/.test(K), "🔴 la ficha enseña la reflexión (y avisa si falta)");
c(/sinRF\.length \? sinRF\.length \+ " sin reflexión"/.test(K), "   y Mi gente cuenta las que faltan junto a los enlaces");
c(/var REFLEXION_DESDE = Date\.parse\("2026-09-16T00:00:00"\)/.test(K) && /pideReflexion\(rc\.retos\[id\]\)/.test(K) && /pideReflexion\(\(r\.retos \|\| \{\}\)\[id\]\)/.test(K),
  "   pero solo lo registrado desde que existe la caja (lo de antes no es culpa de nadie)");
c(/data-rfquitarcom=/.test(K) && /data-rfquitar=/.test(K) && /MOTOR\.borrarReflexion\(PER, reto, r\.ficha\)/.test(K),
  "   el profesorado puede quitar un comentario o la reflexión entera (moderar)");

// 8 · la sesión: «Lo que dijisteis», dos semanas después, primero su escuadrón
c(/function diasReflexion\(s\)/.test(S) && /semanas\(\)\[s\.sem-3\]/.test(S), "🔴 la sesión enseña las reflexiones de los retos de hace DOS semanas");
c(/mios\[x\.fichaId\][\s\S]{0,120}!mios\[x\.fichaId\]/.test(S) && /\.slice\(0,4\)/.test(S), "   hasta cuatro, primero las de la gente de quien da la clase");
c(/data-rfocultar=/.test(S) && /sgRefOcultas_/.test(S), "   con «Ocultar» por si alguna no se proyecta");
c(/precargarReflexiones\(\)/.test(S) && /\.then\(llegan, llegan\)/.test(S), "   y se leen antes de pintar (con las votaciones): la diapositiva no se mueve de sitio");
// 16-sep · y si llegan tarde, se añaden solo mientras se está en la portada (así no se mueve lo que se ve)
c(/else if\(st\.i===0\) pintar\(\);/.test(S), "   si llegan tarde, se suman al mazo solo mientras el docente sigue en la portada");
c(/hashRF\(x\.id\+dia\)/.test(S), "   el orden cambia cada día pero no al pasar de diapositiva");

// 9 · el diseño
c(/\.rf-txt\{[^}]*min-height:130px/.test(CSS) && /\.rfx-lista\{/.test(CSS) && /\.evid-rf\{/.test(CSS), "la caja, el panel, la ficha y la diapositiva tienen su estilo");
const peques = (CSS.slice(CSS.indexOf("LAS REFLEXIONES DE LOS RETOS")).match(/font-size:\s*\.(\d+)rem/g) || []).map(x => Number("0." + x.match(/\.(\d+)/)[1]));
c(peques.every(v => v >= 0.75), "   nada por debajo de 12 px", peques.join(","));

if (require.main === module) {
  console.log("\n  Batería 78 · los retos que se responden en el propio reto");
  console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
  fallos.forEach(f => console.log("   ✗ " + f));
  process.exit(fallos.length ? 1 : 0);
}
