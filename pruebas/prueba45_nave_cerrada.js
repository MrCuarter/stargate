'use strict';
// 45 · LA NAVE NACE CERRADA (y el logo lleva a casa)
// Norberto, 9-sep, viendo la Nave en vivo: «hasta no poner el mail no se debería ver ningún enlace
// ni form, no quiero trolls... al menos reducir el riesgo».
// Tenía razón y el riesgo era concreto: el formulario de DUDAS es anónimo —se le pueden mandar
// tickets sin sesión de Google, lo comprobé mandando 7— así que a la vista de cualquiera que diera
// con la URL era una invitación a ensuciar la clase. Los de Bitácora y Canje piden cuenta, pero
// tampoco pintan nada antes de identificarse.
// Esta batería vigila que la puerta siga cerrada, porque volver a abrirla es una línea de nada.
const E = require("./entorno.js");
const { comprobar: c, igual } = E;
const fs = require("fs"), path = require("path");
const RAIZ = path.join(__dirname, "..");
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
console.log("\n▶ 45 · La Nave nace cerrada");

const R = leer("assets/js/recluta.js");

// ---------------------------------------------------------------- a) sin identificar, solo la puerta
c(/root\.innerHTML = avisoDemo \+ \(dentro/.test(R),
  "🔴 la Nave solo se pinta entera si el recluta está identificado");
c(/var dentro\s*=\s*!!st\.yo/.test(R),
  "   y «dentro» es exactamente «tengo ficha», no una bandera aparte");
c(/verTablero\(dentro && st\.tab==='tablero'\)/.test(R),
  "🔴 el tablero tampoco se enseña sin identificarse");

// ---------------------------------------------------------------- b) ni un enlace a formulario antes del correo
c(/var alta = st\.d && st\.d\.formBitacora && st\.msgYo;/.test(R),
  "🔴 el botón de alistarse aparece SOLO tras buscar un correo y no encontrarlo");
// los tres formularios se pintan en accesos(), y accesos() solo entra en el rama «dentro»
const accesos = R.slice(R.indexOf("function accesos()"), R.indexOf("function accesos()") + 1400);
["formBitacora", "formCanje", "formTicket"].forEach(function(k){
  c(accesos.indexOf(k) >= 0, "«" + k + "» se pinta en accesos(), que vive detrás de la puerta");
});

// ---------------------------------------------------------------- c) el selector de PER, UNA sola vez
// Sin ?per= la Nave pregunta «¿de qué PER eres recluta?» y el tablero preguntaba lo mismo debajo.
const sinPer = R.slice(R.indexOf("if(!per){"), R.indexOf("// ---------- estado ----------"));
c(sinPer.indexOf("verTablero(false)") >= 0,
  "🔴 sin ?per= el tablero se apaga: el selector no sale duplicado");

// ---------------------------------------------------------------- d) el logo lleva a la portada
const nave = leer("recluta.html");
c(/<a class="brand" href="index\.html"/.test(nave),
  "🔴 el logo de la Nave lleva a la portada, no a sí mismo");
c(!/<a class="brand" href="recluta\.html"/.test(nave),
  "   y ya no apunta a recluta.html (pulsarlo no hacía nada)");

// ---------------------------------------------------------------- e) lo que NO puede cerrarse
// La Nave es del alumnado y el alumnado NO tiene PIN. Que quede claro para siempre.
c(nave.indexOf("assets/js/puerta.js") < 0,
  "🔴 la Nave NUNCA pide el PIN del profesorado: el alumnado no tiene");

// ---------------------------------------------------------------- f) el modo demo, con su puerta
// Sirve para enseñar la plataforma al público sin identificarse. La puerta es la MISMA regla que
// usa sembrarDemo() en el Apps Script: solo grupos con DEMO o PRUEBA en el nombre. Si esto se
// aflojara, cualquiera vería la ficha de un alumno REAL de una clase real con solo poner ?demo=1.
c(/n\.indexOf\('DEMO'\)>=0 \|\| n\.indexOf\('PRUEBA'\)>=0/.test(R),
  "🔴 el modo demo SOLO abre grupos con DEMO o PRUEBA en el nombre");
c(/function demoPermitido\(\)/.test(R) && /if\(st\.yo\|\|!demoPermitido\(\)\) return false;/.test(R),
  "   y nunca pisa a un recluta ya identificado");
c(/window\.SG_TABLERO_DATA/.test(R),
  "🔬 se viste con el tablero PÚBLICO (sin correos ni nombres): no pide nada privado");
c(/var r=\(st\.d&&st\.d\.reclutas\)\|\|\[\];/.test(R),
  "🔴 los reclutas salen de la propia respuesta de la Nave: sin carreras ni llamadas de más");
c(!/window\.__sgDemo/.test(R), "🔬 sin restos del diagnóstico que usé para encontrarlo");
c(/Modo demostración/.test(R),
  "   y avisa en pantalla de que es una demostración, para que nadie la confunda con su ficha");

// la misma regla, en el Apps Script: si una de las dos cambia, dejan de coincidir
const GS = fs.readFileSync(path.join(RAIZ, "apps-script", "Code.gs"), "utf8");
c(/nom\.indexOf\("DEMO"\) < 0 && nom\.indexOf\("PRUEBA"\) < 0/.test(GS),
  "🔴 sembrarDemo() usa esa MISMA regla: se puede enseñar justo lo que se puede sembrar");

// ---------------------------------------------------------------- g) el tutorial, en DOS actos
// Norberto, 11-sep: «debería tener dos momentos». Y era un fallo de fondo, no de gusto: NEBULA
// explicaba la ficha, los créditos y el personaje ANTES de que existiera nada de eso, porque la
// nave está cerrada hasta que escribes el correo. Explicar una habitación a oscuras y luego
// encender la luz es el orden equivocado.
c(/var PASOS_PUERTA=\[/.test(R), "🔴 hay un acto 1, para antes de identificarse");
c(/ACTOS=\{[\s\S]*?puerta:[\s\S]*?nave:/.test(R), "   y un solo motor sirve a los dos");
c(/if\(!st\.yo && !DEMO && !localStorage\.getItem\('sgNavePuerta_'\+per\)\) onboarding\(0,'puerta'\)/.test(R),
  "🔴 el acto 1 solo salta con la nave CERRADA (y nunca en demo)");
c(/if\(!localStorage\.getItem\('sgNaveOnboard_'\+per\)\) setTimeout/.test(R),
  "🔴 y el acto 2 arranca al validarse el correo, no antes");
c(/sgNavePuerta_/.test(R) && /sgNaveOnboard_/.test(R),
  "   cada acto recuerda por su cuenta si ya se vio");
// el acto 1 no puede hablar de lo que aún no existe
const puerta = R.slice(R.indexOf("var PASOS_PUERTA=["), R.indexOf("var PASOS=["));
["créditos", "insignias que llevas", "vestuario", "nivel 3"].forEach(function(t){
  c(puerta.indexOf(t) < 0, "🔬 el acto 1 no menciona «" + t + "»: todavía no hay nada de eso");
});
c(/correo/.test(puerta), "   y sí dice lo único que hace falta: el correo");
c(/Nos vemos al otro lado/.test(puerta), "   y se despide hasta después de identificarse");
igual((puerta.match(/\{t:/g) || []).length, 3, "🔬 el acto 1 son tres pasos");
const actoDos = R.slice(R.indexOf("var PASOS=["), R.indexOf("// Un solo motor"));
// 🔴 El acto 2 son CUATRO: los tres de contenido más la invitación a estrenar el Mercado. Norberto:
// «acaba invitando a ir al mercado estelar y comprar un héroe o un sobre». Un tutorial que termina
// diciendo «ahora ve y haz esto» se recuerda; uno que termina con «ya está» no.
igual((actoDos.match(/\{t:/g) || []).length, 4, "   y el acto 2, cuatro (el último invita a estrenarse)");
c(/Mercado Estelar/.test(actoDos) && /sobre de cromos/i.test(actoDos) && /Héroe de la Rebelión/.test(actoDos),
  "   invitando a un sobre o a un héroe, con su precio");
// cada paso señala algo de la pantalla: explicar «esto de aquí» sin que se vea el aquí no explica
igual((actoDos.match(/foco:/g) || []).length, 4, "🔴 los cuatro pasos resaltan la zona de la que hablan");
c(/classList\.add\('tour-foco'\)/.test(R) && /scrollIntoView/.test(R),
  "   y la nave se desplaza hasta ella");
c(/querySelectorAll\('\.tour-foco'\)/.test(R),
  "🔬 y el resalte se apaga al cambiar de paso: si no, se quedarían dos encendidos");

// ---- el Mercado Estelar (11-sep): «Canjear» no contaba nada; esto es un sitio al que ir
c(/Mercado Estelar/.test(R), "🔴 el canje se llama «Mercado Estelar»");
c(!/Canjear<\/b>/.test(R), "   y ya no «Canjear» a secas");
c(!/🪐 Mercado|🧱 Mercado|📓 Mercado/.test(R),
  "🔬 con un emoji propio, sin repetir el del Panel ni el del Padlet");

// ---------------------------------------------------------------- h) al cerrar el form, refrescar
// Norberto: «al abrir el form desde la web, al cerrarlo, debería actualizarse sola». Fallo real de
// recorrido: canjeabas un héroe, cerrabas y la Nave seguía con los créditos de antes — parecía que
// no había pasado nada, y el siguiente paso natural era volver a canjearlo.
c(/if\(envio\) refrescar\(\);/.test(R), "🔴 al cerrar la ventana se refresca la ficha");
c(/cargas\+\+; if\(cargas>1\) envio=true;/.test(R),
  "   pero SOLO si el formulario llegó a enviarse (se detecta por la segunda carga del iframe)");
c(/function refrescar\(\)/.test(R) && !/location\.reload/.test(R),
  "🔬 y se repinta pidiendo los datos, sin recargar la página: no se pierde la pestaña ni el scroll");

E.resumen("La Nave nace cerrada");
