'use strict';
/**
 * BATERÍA 122 · EL AVISO DE RESPUESTAS Y «¿TE HA RESUELTO LA DUDA?» (1-oct-2026).
 *
 * Norberto: «¿cómo saben ellos que les has respondido? Necesito algo llamativo: que cuando tengan mensajes, nada más entrar se
 * les abra una ventana… y junto con la respuesta un botón de ¿He resuelto la pregunta? ¿Necesitas algo más? Así analizamos la
 * utilidad del buzón». Vigila:
 *   · que assets/js/aviso-buzon.js va (con su sello) en las páginas del docente y NUNCA en lo que se proyecta ni en el ensayo;
 *   · que las dos frases de la valoración viven en un sitio (motor.js → BUZON_VALORA) y que los respaldos y la guardia casan;
 *   · que el hilo del buzón lleva «¿Te ha resuelto la duda?» y «Necesito algo más» sale con su frase delante;
 *   · que las reglas de GamificaPro dejan al docente añadir esa respuesta suya y marcarlo resuelto o nuevo (sin desplegar nada).
 * (El comportamiento —qué cuenta como sin leer, los botones, la × solo por esta pestaña— se probó en el navegador con un motor
 * de mentira el 1-oct: 3 avisos de 6, «Sí» → respuesta + visto, «Necesito algo más» → con la frase, se cierra al acabar.)
 */
const fs = require("fs"), path = require("path");
const RAIZ = path.resolve(__dirname, "..");
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
const existe = f => fs.existsSync(path.join(RAIZ, f));

// 1 · dónde sale
const TAG = /<script src="assets\/js\/aviso-buzon\.js\?v=[0-9a-f]{10}" defer><\/script>/;
for (const f of ["consola.html", "academia.html", "gestion.html", "profesores.html", "crear.html"])
  c(existe(f) && TAG.test(leer(f)), f + " lleva el aviso de respuestas, con su sello");
for (const f of ["sesion.html", "aula.html", "prestreno.html", "ensayo.html", "buzon.html", "recluta.html", "clase.html", "llamada.html", "embed.html", "batalla.html"])
  c(!existe(f) || !/aviso-buzon\.js/.test(leer(f)), f + " NO lleva el aviso (se proyecta, es el ensayo, el buzón o el alumnado)");
const sello = (/aviso-buzon\.js\?v=([0-9a-f]{10})/.exec(leer("consola.html")) || [])[1];
c(sello === require("crypto").createHash("md5").update(fs.readFileSync(path.join(RAIZ, "assets/js/aviso-buzon.js"))).digest("hex").slice(0, 10),
  "el sello de consola.html es el del fichero de hoy (si no, el CDN serviría el viejo)", sello);

// 2 · las dos frases, en un sitio
const MOT = leer("assets/js/motor.js");
const m = /const BUZON_VALORA = (\{[^\n]*\});/.exec(MOT);
let V = null; try { V = JSON.parse(m[1]); } catch (e) {}
c(V && typeof V.si === "string" && typeof V.mas === "string" && V.si && V.mas, "motor.js define BUZON_VALORA en una línea que se puede leer (la guardia la lee)");
c(/buzonVisto, BUZON_VALORA,/.test(MOT), "y el motor lo exporta");
const AV = leer("assets/js/aviso-buzon.js"), BZ = leer("assets/js/buzon.js");
if (V) {
  c(AV.includes('V.si || ' + JSON.stringify(V.si)) && AV.includes('V.mas || ' + JSON.stringify(V.mas)), "los respaldos del aviso son las mismas frases");
  c(BZ.includes('V.si || ' + JSON.stringify(V.si)) && BZ.includes('V.mas || ' + JSON.stringify(V.mas)), "y los del hilo del buzón también");
  c(!/[\u{1F300}-\u{1FAFF}]/u.test(V.si + V.mas), "sin emojis (el ✓ es un signo, no un emoji)");
}
const GUARDIA = fs.readFileSync(path.join(RAIZ, "..", "mando", "buzon.cjs"), "utf8");
c(/const BUZON_VALORA = \(\\\{\[\^\\n\]\*\\\}\);/.test(GUARDIA), "la guardia (mando/buzon.cjs) lee las frases de motor.js con la misma forma de línea");
c(/orden === "utilidad"/.test(GUARDIA) && /utilidad: utilidad\(L, desde\)/.test(GUARDIA), "y cuenta la utilidad (comando «utilidad» y en el resumen de la semana)");
c(/NECESITA ALGO MÁS/.test(GUARDIA), "lo que vuelve con «Necesito algo más» sale marcado en los pendientes");

// 3 · el aviso
c(/window\.top !== window/.test(AV) && /SG_ENSAYO/.test(AV) && /embed\|demo/.test(AV), "el aviso no sale incrustado, en el ensayo ni en la demostración");
c(/m\.tipo === "recluta"/.test(AV) && /gamificapro/.test(AV), "ni por lo de un recluta ni por lo de GamificaPro");
c(/m\.visto !== false/.test(AV) && /sgBzVistos/.test(AV), "cuenta como la burbuja de la consola (visto === false, y lo abierto en el buzón no)");
c(/sgAcademia\.claudeVisto/.test(AV) && /SEMANA/.test(AV), "lo de la Academia, con la misma marca que su píldora y solo de los últimos 7 días");
c(/sessionStorage/.test(AV) && /CERRADO/.test(AV), "la × lo cierra solo en esta pestaña (vuelve en la próxima visita)");
c(/role="dialog" aria-modal="true"/.test(AV) && /Escape/.test(AV), "es un diálogo de verdad (y Escape lo cierra)");
c(/¿Te ha resuelto la duda\?/.test(AV) && /Necesito algo más/.test(AV) && /estado: "resuelto"/.test(AV), "pregunta si le ha resuelto la duda, con «Sí» y «Necesito algo más»");

// 4 · el hilo del buzón
c(/data-val-si/.test(BZ) && /data-val-mas/.test(BZ) && /¿Te ha resuelto la duda\?/.test(BZ), "el hilo del buzón lleva la valoración tras una respuesta del Mando");
c(/art\.getAttribute\("data-mas"\)\) t = \(V\.mas/.test(BZ), "y «Necesito algo más» sale con su frase delante");
c(/\.bz-valora\{/.test(leer("assets/css/stargate.css")), "con su estilo");

// 4b · 10-oct · lo resuelto se va de la ventana (Norberto: «que desapareciese esa consulta… y quedarán las respuestas sin resolver»)
c(/listo\("¡Gracias, Comandante! Nos ayuda a saber que el buzón sirve\."\); retirar\(art\);/.test(AV), "🔴 «Sí, resuelta»: tras el gracias, su tarjeta se retira de la ventana");
c(/function retirar\(art\)/.test(AV) && /\.sgav-m\.sgav-fuera\{opacity:0;max-height:0/.test(AV), "   desvaneciéndose (sgav-fuera), no a golpe");
c(/if \(!n\) return quitar\(\);/.test(AV) && /#sgav-t"\)\.textContent = n === 1 \? "Tienes una respuesta nueva" : "Tienes " \+ n \+ " respuestas nuevas"/.test(AV),
  "   el título cuenta las que quedan y, sin ninguna, la ventana se cierra");
c(/prefers-reduced-motion: reduce/.test(AV), "   y sin animación para quien la tiene quitada");
c((AV.match(/ retirar\(art\);/g) || []).length === 1, "   solo «Sí, resuelta» retira: «Entendido» y «Necesito algo más» se quedan con su aviso");

// 5 · las reglas ya lo dejan (nada que desplegar)
const REGLAS = path.join(RAIZ, "..", "..", "gamificapro", "firestore.rules");
if (fs.existsSync(REGLAS)) {
  const R = fs.readFileSync(REGLAS, "utf8");
  c(/affectedKeys\(\)\.hasOnly\(\['respuestas', 'estado', 'actualizado', 'visto'\]\)/.test(R)
  // 8-oct (tanda 2c, gamificapro 1216aab): la misma lista, ahora por buzonCambioValido (vieja y mod_buzon)
  // 9-oct (tanda 2d, el buzón de todos): la misma lista y, detrás, las marcas del espejo (espejoDe, espejoHora)
  || (/buzonCambioValido\(\['respuestas', 'estado', 'actualizado', 'visto'(, '[a-zA-Z]+')*\]\)/.test(R) && /affectedKeys\(\)\.hasOnly\(suyos\)/.test(R)), "el docente puede tocar respuestas, estado y visto de lo suyo");
  c(/request\.resource\.data\.estado in \['nuevo', 'resuelto'\]/.test(R), "y dejarlo «nuevo» o «resuelto»");
  c(/keys\(\)\.hasOnly\(\['de', 'texto', 'fecha', 'adjuntos'\]\)/.test(R) && /\.de == 'docente'/.test(R), "su respuesta lleva de, texto y fecha (lo que manda buzonResponder)");
} else c(true, "(sin GamificaPro al lado: las reglas no se miran)");

fallos.forEach(f => console.log("   ✗ " + f));
console.log("\n  Batería 122 · el aviso de respuestas y «¿Te ha resuelto la duda?»\n  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
