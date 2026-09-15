'use strict';
/**
 * BATERÍA 76 · LOS PROFES REFERENTES, PROFESORES, EL MODO DOCENTE Y LA PRUEBA DEL EQUIPO (15-sep-2026).
 *
 * Norberto: «no sé con qué email iniciarán sesión: ¿podrías convertirlas automáticamente en referentes?»,
 * «una página de profesores… convertir (o quitar) de profe referente», «un botón arriba que simplifique su
 * panel a modo profe raso» y «una versión general de la prueba manual publicada en la web». Vigila:
 *   · que la invitación es de un solo uso y la ata el servidor (reglas), no el nombre;
 *   · que «Crear grupo» ya no deja pasar a cualquiera sin grupos (solo referentes);
 *   · que Profesores es solo del Mando y lo tiene todo (invitar, hacer/quitar, añadir a un grupo, conexiones);
 *   · que el modo docente esconde lo de referente en el menú y en la consola;
 *   · que la prueba del equipo no lleva correos de nadie ni cosas internas, y no se indexa.
 */
const fs = require("fs"), path = require("path");
const RAIZ = path.resolve(__dirname, "..");
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");

// 1 · el motor
const M = leer("assets/js/motor.js");
["referenteGlobal", "crearInvitacion", "leerInvitacion", "canjearInvitacion", "invitaciones", "referentes", "ponerReferente", "profes", "anotarConexion", "todosLosGrupos"]
  .forEach(f => c(new RegExp("async function " + f + "\\(").test(M) && new RegExp("\\b" + f + ",").test(M), "motor.js: " + f));
c(/crypto\.getRandomValues/.test(M) && /aleatorio\(24\)/.test(M), "🔴 la clave de la invitación es de 24 caracteres al azar del navegador (no se adivina)");
c(/writeBatch\(db\)[\s\S]{0,400}stargate_referentes[\s\S]{0,400}stargate_invitaciones/.test(M.slice(M.indexOf("async function canjearInvitacion"))),
  "🔴 canjear = el registro de referente y la invitación marcada, en UNA escritura (así lo exigen las reglas)");
c(/caduca: ahora \+ 14 \* 864e5/.test(M), "la invitación caduca a los 14 días");
c(/const refGlobal = mios\.some\(x => x\.soyReferente\) \|\| await referenteGlobal\(correo\)/.test(M), "el menú enciende «Crear grupo» también a quien está en el registro");
c(/sessionStorage/.test(M.slice(M.indexOf("async function anotarConexion"), M.indexOf("async function anotarConexion") + 600)), "la conexión se apunta una vez por sesión del navegador (no en cada página)");

// 2 · crear grupo: solo referentes
const CR = leer("assets/js/crear.js");
c(!/if \(!ps\.length \|\| ps\.some/.test(CR) && /MOTOR\.referenteGlobal\(YO\.correo\)/.test(CR),
  "🔴 «Crear grupo» ya no deja pasar a cualquiera sin grupos: referente de un grupo o del registro (los vitalicios, siempre)");

// 3 · las páginas nuevas
[["invitacion.html", "assets/js/invitacion.js", "inv-app"], ["profesores.html", "assets/js/profesores.js", "pr-app"]].forEach(([p, js, id]) => {
  const H = leer(p);
  c(new RegExp(js.replace(/[./]/g, "\\$&") + "\\?v=").test(H) && H.indexOf('id="' + id + '"') >= 0 && /assets\/js\/motor\.js/.test(H), p + ": carga el motor y su código (con su sello)");
  c(/<meta name="robots" content="noindex,nofollow">/.test(H), p + ": no se indexa");
});
const INV = leer("assets/js/invitacion.js");
c(/VITALICIOS/.test(INV) && /no la gasto/.test(INV), "🔴 un vitalicio que abre la invitación para probarla NO la gasta");
c(/ya se ha usado con otra cuenta/.test(INV) && /ha caducado/.test(INV), "la invitación usada o caducada lo dice, y cómo pedir otra");
const PR = leer("assets/js/profesores.js");
c(/VITALICIOS/.test(PR) && /Esta página es del Mando/.test(PR), "🔴 Profesores es solo del Mando (y las reglas lo sostienen)");
["crearInvitacion", "ponerReferente", "anadirDocente", "todosLosGrupos", "referentes()", "profes()", "invitaciones()"].forEach(f =>
  c(PR.indexOf(f) >= 0, "Profesores usa " + f));
c(/data-quitar/.test(PR) && /¿Seguro\? Pulsa otra vez/.test(PR), "quitar un referente pide confirmación (dos toques)");
c(/conexiones/.test(PR) && /alistados/.test(PR) && /última/.test(PR), "de cada profe: grupos, alistados, conexiones y la última");

// 4 · el modo docente
const T = leer("assets/js/stargate.js");
c(/window\.SG_MODO_DOCENTE = modoDocente/.test(T) && /sgModoDocente/.test(T) && /sg:modo/.test(T) && /👤 Modo docente/.test(T),
  "🔴 el menú tiene el botón «👤 Modo docente» (y avisa con sg:modo)");
c(/a\.hidden = !ref \|\| md/.test(T), "   y en modo docente se apaga «Crear grupo» del menú");
const CON = leer("assets/js/consola.js");
c(/function refDe\(p\) \{ return !!\(p && p\.soyReferente\) && !modoDoc\(\); \}/.test(CON), "la consola: lo de referente, solo fuera del modo docente");
c(/var ref = refDe\(/.test(CON) && /var esRef = refDe\(/.test(CON) && /&& !modoDoc\(\);/.test(CON), "   en las pestañas, la ficha y la franja de referente");
c(/document\.addEventListener\("sg:modo"/.test(CON), "   y se repinta al cambiar de modo");
c(/href="profesores\.html"/.test(CON) && /VITALICIOS_WEB\.indexOf/.test(CON.slice(CON.indexOf('href="profesores.html"') - 400, CON.indexOf('href="profesores.html"'))),
  "la consola enlaza Profesores, solo para los vitalicios");

// 5 · la prueba del equipo
const PE = leer("prueba-equipo.html");
c(/<meta name="robots" content="noindex,nofollow">/.test(PE), "prueba-equipo.html no se indexa");
const cuerpo = PE.slice(PE.indexOf("<header class=\"hero corto\">"), PE.indexOf("<footer"));
c(!/[\w.+-]+@[\w-]+\.[\w.]+/.test(cuerpo), "🔴 la prueba del equipo no lleva ningún correo", (cuerpo.match(/[\w.+-]+@[\w-]+\.[\w.]+/) || [""])[0]);
c(!/\/Users\/|desplegar_stargate|firebase|laboratorio|claude\.ai/i.test(cuerpo), "🔴 ni rutas, ni comandos, ni nada interno");
c((cuerpo.match(/class="pe-tick"/g) || []).length >= 20, "tiene sus pasos para marcar", (cuerpo.match(/class="pe-tick"/g) || []).length);
(cuerpo.match(/href='([^']+)'/g) || []).forEach(h => { const f = h.slice(6, -1).split(/[?#]/)[0]; c(fs.existsSync(path.join(RAIZ, f)), "prueba del equipo: el enlace «" + f + "» existe"); });

// 6 · las reglas (GamificaPro)
const REGLAS = "/Users/nor/Claude/vibewebs/gamificapro/firestore.rules";
if (fs.existsSync(REGLAS)) {
  const R = fs.readFileSync(REGLAS, "utf8");
  c(/match \/stargate_referentes\/\{correo\}/.test(R) && /match \/stargate_invitaciones\/\{inv\}/.test(R) && /match \/stargate_profes\/\{uid\}/.test(R),
    "GamificaPro: las reglas de referentes, invitaciones y conexiones");
  c(/function invitacionCanjeada\(inv\)[\s\S]{0,600}getAfter/.test(R), "   la invitación se ata con getAfter (en la misma escritura)");
}

if (require.main === module) {
  console.log("\n  Batería 76 · referentes, Profesores, modo docente y la prueba del equipo");
  console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
  fallos.forEach(f => console.log("   ✗ " + f));
  process.exit(fallos.length ? 1 : 0);
}
