'use strict';
/**
 * BATERÍA 87 · PREGUNTAR CON LA CARA DE STARGATE Y EL PORQUÉ DE UN RETO (17-sep-2026).
 *
 * Norberto, en su prueba humana, con la ficha de un recluta abierta y el `confirm()` del navegador encima («¿Anular el
 * reto A0 a Tritón?»): «Ese aviso no guarda la estética de STARGATE. Hay que mejorarlo. Como la ficha ya es una ventana,
 * quizá podría aparecer un desplegable debajo de la misión preguntando si se quiere validar/desvalidar, junto con la
 * posibilidad de enviar un mensaje al estudiante. Imagina que ha puesto un enlace incorrecto: se desmarca la misión y se
 * da una razón». Y sobre el «⚠️ 12 sin enlace» de Mi gente: «no sería necesario, hemos puesto obligatorio adjuntar un
 * enlace; esto no nos va a pasar».
 */
const fs = require("fs"), path = require("path");
const RAIZ = path.resolve(__dirname, ".."), GP = "/Users/nor/Claude/vibewebs/gamificapro";
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
const SG = leer("assets/js/stargate.js"), K = leer("assets/js/consola.js"), M = leer("assets/js/motor.js"),
      N = leer("assets/js/recluta.js"), CSS = leer("assets/css/stargate.css");
const sinComentarios = s => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'\\])\/\/.*$/gm, "$1");

// 1 · la pregunta de la casa
c(/window\.SG\.preguntar = function \(o\)/.test(SG) && /window\.SG\.avisar = function/.test(SG), "🔴 hay una pregunta de la casa (SG.preguntar) y un aviso (SG.avisar)");
c(/enLinea = !!\(o\.aqui && o\.aqui\.parentNode\)/.test(SG) && /insertBefore\(caja, o\.aqui\.nextSibling\)/.test(SG),
  "🔴 se despliega DEBAJO de lo pulsado cuando ya se está dentro de otra ventana (la ficha)");
c(/ev\.stopImmediatePropagation\(\); cerrar\(null\)/.test(SG) && /addEventListener\("keydown", tecla, true\)/.test(SG),
  "   Escape pliega solo la pregunta, no la ficha de debajo");
c(/F\.igualA != null && v !== String\(F\.igualA\)/.test(SG) && /bSi\.disabled = !!m/.test(SG), "   el botón no se enciende hasta que lo escrito vale (el alias para dar de baja)");
c(/document\.fullscreenElement \|\| document\.body/.test(SG), "   y se ve también en pantalla completa (el bombo del sorteo)");
c(/var f = \(inp && !F\.soloLectura\) \? inp : \(bNo \|\| bSi\)/.test(SG), "   el primer foco, en lo que no hace nada: un Intro por inercia no borra a nadie");
c(/\.sgp-capa\{[^}]*z-index:9700/.test(CSS), "   por encima de cualquier capa de la web");
c(/\.fi-tema>\.sgp-caja\{grid-column:1\/-1/.test(CSS), "   y en la ficha ocupa el ancho de la fila del tema");
const nuevos = (CSS.split("LA PREGUNTA DEL PUESTO DE MANDO")[1] || "");
c(!/font-size:(?:[0-9]|1[01])px/.test(nuevos) && !/font-size:\.(?:[0-6]\d|7[0-4])rem/.test(nuevos), "   (nada por debajo de 12px)");

// 2 · adiós a confirm, prompt y alert en la web del profesorado
["consola", "aula", "crear"].forEach(f => {
  const s = sinComentarios(leer("assets/js/" + f + ".js"));
  c(!/(^|[^.\w])(confirm|prompt|alert)\(/.test(s), "🔴 " + f + ".js ya no usa confirm/prompt/alert del navegador", (s.match(/.{30}(confirm|prompt|alert)\(.{30}/) || [""])[0]);
});
c((K.match(/window\.SG\.preguntar\(/g) || []).length >= 17, "   la consola pregunta con la de la casa en todas partes", String((K.match(/window\.SG\.preguntar\(/g) || []).length));
["cmdB", "cong", "baja"].forEach(b => c(new RegExp("aqui: " + b + "\\.closest\\(\"p\"\\) \\|\\| " + b).test(K), "   en la ficha, «" + b + "» pregunta desplegado ahí mismo"));
c(/campo: \{ etiqueta: "Para confirmar, escribe su alias:", ayuda: r\.alias, igualA: r\.alias \}/.test(K), "   dar de baja: una sola pregunta que pide escribir su alias");

// 3 · el reto: validar o anular, con su porqué
const RETO = K.split("VALIDAR O ANULAR UN RETO, CON SU PORQUÉ")[1] || "";
c(!!RETO, "🔴 la ficha tiene el desplegable de validar o anular");
c(/aqui: b\.closest\("\.retos-ficha"\) \|\| b, marca: b/.test(RETO), "   debajo de la fila del tema, con el reto resaltado");
c(/"Mensaje para " \+ r\.alias/.test(RETO) && /lo verá en su Nave/.test(RETO), "   con un mensaje para el recluta");
c(/El enlace no abre/.test(RETO) && /No es público/.test(RETO) && /No es lo que pide/.test(RETO) && /Falta la reflexión/.test(RETO), "   y motivos rápidos para anular");
c(/Se le quitan /.test(RETO) && /Se le suman /.test(RETO) && /mi\.points/.test(RETO) && /mi\.coinsReward/.test(RETO), "   dice qué se le suma o se le quita, con las cifras del reto");
c(/EVID\[ficha\]/.test(RETO) && /target="_blank" rel="noopener noreferrer"/.test(RETO), "   y enseña su enlace, pulsable, para comprobarlo antes de decidir");
const iAccion = RETO.indexOf("MOTOR.anularReto"), iAviso = RETO.indexOf("MOTOR.avisarRecluta");
c(iAccion > 0 && iAviso > iAccion, "🔴 el mensaje se manda DESPUÉS de hacerlo (si fallara, no le llega un «te lo he anulado» falso)");
c(/resp\.texto \|\| "desde la consola"/.test(RETO), "   y el porqué también queda en el registro de anulaciones del servidor");
c(/le ha llegado tu mensaje a su Nave/.test(RETO) && /el mensaje no se ha podido enviar/.test(RETO), "   y la ficha dice si le ha llegado");

// 4 · el motor y la Nave
c(/async function avisarRecluta\(perId, userId/.test(M) && /collection\(db, "notifications"\)/.test(M) && /stargate: \{ reto:/.test(M),
  "🔴 el mensaje va a la bandeja de GamificaPro (notifications), marcado como de STARGATE");
c(/function vigilarMensajes\(perId, alCambiar\)/.test(M) && /\.filter\(x => x\.stargate && !x\.read\)/.test(M) && /onSnapshot/.test(M.split("function vigilarMensajes")[1] || ""),
  "   la Nave lo escucha en directo, solo los suyos sin leer");
c(/avisarRecluta, vigilarMensajes, mensajeLeido/.test(M), "   y el motor lo exporta");
c(/function avisoMensajes\(\)/.test(N) && /avisoCongelado\(\)\+avisoMensajes\(\)/.test(N), "🔴 la Nave lo enseña arriba, junto a los avisos importantes");
c(/Ha anulado tu reto /.test(N) && /Puedes registrarlo otra vez/.test(N), "   con qué reto y qué hacer");
c(/data-msg-leido/.test(N) && /M\.mensajeLeido\(id\)/.test(N), "   y «Entendido» lo marca como leído (no vuelve)");
c(/vigilarLlamada\(\); vigilarMensajes\(\);/.test(N) && /st\.paraMensajes\|\|SIMULACRO\|\|enDemo\(\)/.test(N), "   (una escucha por visita; ni en el simulacro ni en la demo)");
c(/\.msg-cmd\.anulado\{/.test(CSS) && /\.msg-cmd \.mc-txt\{/.test(CSS), "   con su estilo");
const REG = fs.existsSync(path.join(GP, "firestore.rules")) ? fs.readFileSync(path.join(GP, "firestore.rules"), "utf8") : "";
const nr = (REG.split("match /notifications/{notificationId}")[1] || "").split("}")[0];
c(/allow read: if isSignedIn\(\) && resource\.data\.userId == request\.auth\.uid/.test(nr) && /allow create: if isSignedIn\(\)/.test(nr),
  "🔴 las reglas de GamificaPro: lo lee solo su destinatario (y el docente puede crearlo)", nr.slice(0, 160));

// 5 · Mi gente sin el «⚠️ N sin enlace»
c(!/marcarSinEnlace/.test(K) && !/sin enlace" : ""/.test(K), "🔴 Mi gente ya no pone «⚠️ N sin enlace» al lado de nadie",
  "(ni queda una llamada suelta: la de Escuadrones reventaba con «marcarSinEnlace is not defined», lo cazó el laboratorio)");
c(!/⚠️ sin enlace, y este reto lo pide/.test(K), "   y en la ficha, un reto sin enlace se dice sin alarma (los otorgados a mano no lo traen)");

console.log("\n  Batería 87 · preguntar con la cara de STARGATE y el porqué de un reto");
console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
fallos.forEach(f => console.log("   ✗ " + f));
process.exit(fallos.length ? 1 : 0);
