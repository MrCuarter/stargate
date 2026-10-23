'use strict';
/**
 * BATERÍA 152 · EL TICKET DE SALIDA SIN CUENTA (23-oct)
 * ------------------------------------------------------------------------------------------------
 * Caridad: «obtener el link de acceso al ticket de salida […] para poder compartir con el alumnado que no tenga acceso a
 * Stargate». Norberto: «habría que montar uno que selecciones el planeta (tema) y comandante».
 *
 * El servidor es de GamificaPro (`modTicket`, accion 'invitado'; sus pruebas, en tests/functions/modTicket.test.ts y
 * tests/emulador/mod-ticket.test.ts). Aquí, la piel:
 *   1. ticket.html?per=…&invitado=1 entra sin cuenta, deja elegir Comandante y planeta, y envía SIN premio;
 *   2. 🔴 la sesión sin cuenta no se queda en el resto de la web: el motor la cierra fuera del ticket de invitado, y el ticket la
 *      cierra al acabar;
 *   3. el docente tiene el enlace en su consola (Enlaces → Para tu alumnado), con su nombre ya marcado;
 *   4. el ticket de siempre no cambia (lo que envía, la cápsula, la investigación).
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = (f) => fs.readFileSync(path.join(R, f), "utf8");
const TK = L("assets/js/ticket.js"), TKH = L("ticket.html"), MOT = L("assets/js/motor.js"), CON = L("assets/js/consola.js"), BUILD = L("_build_site.py");
let ok = 0; const fallos = [];
const c = (cond, txt) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt); };

console.log("\n  · 1 · el formulario del invitado");
c(/var INVITADO = Q\.get\("invitado"\) === "1" && Q\.get\("demo"\) === null/.test(TK), "🔴 se enciende solo con ?invitado=1 (y nunca en la demostración)");
c(/if \(INVITADO\) return arrancarInvitado\(\);/.test(TK), "   y arranca por su camino, sin la puerta de Google");
c(/M\.entrarInvitado\(\)\.then\(function \(u\) \{ return \{ uid: u\.uid, sinCuenta: true \}; \}\)/.test(TK), "   entra sin cuenta solo si no hay sesión (con la sesión que acaba de abrir, no con «nadie»)");
c(/accion: "invitado", projectId: PER \}/.test(TK), "   pide al servidor los Comandantes y los temas del grupo");
c(/¿Quién es tu Comandante\?/.test(TK) && /¿De qué es tu ticket\?/.test(TK) && /data-com/.test(TK) && /data-tema/.test(TK), "🔴 elige Comandante y planeta en la misma pantalla");
c(/if \(C\.indexOf\(COMANDANTE\) < 0\) COMANDANTE = C\.length === 1 \? C\[0\] : "";/.test(TK), "   el Comandante del enlace (?c=) sale marcado; uno que no es del grupo, no");
c(/!COMANDANTE \? "Elige a tu Comandante\." : "Elige de qué es tu ticket\."/.test(TK), "   sin elegir los dos, no sigue (y dice qué falta)");
c(/accion: "invitado", paso: "enviar", projectId: PER, tema: TEMA, comandante: COMANDANTE, respuestas: envio/.test(TK), "🔴 envía con su Comandante, por la acción del invitado");
c(/if \(INVITADO\) \{ aviso\("<b>¡Ticket enviado!<\/b>[^\n]*return salirInvitado\(\); \}/.test(TK), "   sin cápsula: gracias, y fuera");
c(/Sin premio: la cápsula es de quien juega desde su Nave/.test(TK), "   y se le dice antes de empezar");
c(/sgTicketInv:/.test(TK) && /yaEnviadoAqui\(\)/.test(TK), "   que ya lo envió se recuerda en este navegador (aparte del de la Nave)");
c(/Ya tienes tu Nave/.test(TK) && /Abrir mi ticket/.test(TK), "   quien tiene Nave en el grupo va a su ticket, el que tiene premio");

console.log("\n  · 2 · la sesión sin cuenta no se queda");
c(/<script>window\.SG_INVITADO=\/\[\?&\]invitado=1\(&\|\$\)\/\.test\(location\.search\);<\/script>/.test(TKH), "🔴 ticket.html marca el modo invitado ANTES del motor");
c(/if \(u && u\.isAnonymous && !window\.SG_INVITADO\) \{ signOut\(auth\)\.catch\(\(\) => \{\}\); return; \}/.test(MOT), "🔴 en cualquier otra página, el motor la cierra y no es nadie");
c(/sinCuenta: !!u\.isAnonymous/.test(MOT) && /const entrarInvitado = \(\) => WEB\.entrarInvitado\(\);/.test(MOT) && /llamar, entrarInvitado,/.test(MOT), "   el motor sabe entrar sin cuenta (SDK) y lo dice en la sesión");
c(/signInAnonymously \}\s*\n\s*from "https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-auth\.js"/.test(MOT) && /connectFunctionsEmulator, signInAnonymously \}/.test(MOT), "   con la función de Firebase, dada al SDK");
c(/if \(YO && YO\.sinCuenta && M\.salir\) M\.salir\(\)/.test(TK), "   y el ticket la cierra al acabar (solo si era sin cuenta)");
c(/^export const signInAnonymously/m.test(L("assets/js/sim/firebase_sim.js")), "   la consola de ensayo también la tiene (motor_sim.js carga)");

console.log("\n  · 3 · el enlace del docente");
c(/tit: "El ticket de salida sin cuenta"/.test(CON) && /abrir: "ticket\.html\?per=" \+ P \+ "&invitado=1&c=" \+ encodeURIComponent\(yo\.nombre \|\| ""\)/.test(CON),
  "🔴 en Enlaces → Para tu alumnado, con su Comandante (él o ella) ya marcado");
c(/\.tk-elige\{display:grid;grid-template-columns:repeat\(auto-fill,minmax\(min\(100%,220px\),1fr\)\)/.test(BUILD) && /\.tk-elige \.btn\{[^}]*min-height:44px[^}]*min-width:0/.test(BUILD),
  "   botones en rejilla que caben en 320 px, de 44 px de alto");

console.log("\n  · 4 · el ticket de siempre, igual");
c(/MOTOR\(\)\.llamar\("modTicket", \{ accion: "enviar", projectId: PER, tema: TEMA, respuestas: envio \}\)/.test(TK), "   lo que envía la recluta, lo mismo");
c(/capsula\(r \|\| \{\}\);/.test(TK) && /M\.sesion\(\)\.then\(una\);/.test(TK), "   la cápsula y la puerta de Google, en su sitio");

console.log("\n  Batería 152 · " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
if (fallos.length) process.exit(1);
