'use strict';
// 63 · PREMIAR LA ASISTENCIA Y LA CONSTANCIA
//
// Norberto: «quiero premiar la asistencia y la constancia. Cada vez que sea una racha seguida se
// suman 5 créditos con límite de 25 extra». Y puso él mismo el límite que lo hace sano: «modificar
// los créditos o experiencia no [por venir], porque podría enturbiar la puntuación».
//
// 🔴 Esa distinción es la que vigila esta batería, y no es cosmética: los XP ordenan el ranking y
// marcan el nivel. Pagar xp por asistir mezclaría lo aprendido con lo asistido, y el primero de la
// clase pasaría a ser el que más veces vino. Los créditos son dinero: se gastan y no ordenan a nadie.
const E = require("./entorno.js");
const { comprobar: c, igual } = E;
const fs = require("fs"), path = require("path");
const raiz = f => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
console.log("\n▶ 63 · Racha de asistencia y regalo");

const motor = raiz("assets/js/motor.js");

// ---------------------------------------------------------------- a) la cuenta de la racha
// 1ª seguida +0 · 2ª +5 · 3ª +10 … y a partir de la 6ª se queda en +25.
const bonus = r => Math.min(25, Math.max(0, (r - 1) * 5));
igual(bonus(1), 0,  "la primera vez no da extra: una racha de uno no es una racha");
igual(bonus(2), 5,  "la segunda seguida, +5");
igual(bonus(3), 10, "la tercera, +10 — el ejemplo exacto que puso Norberto");
igual(bonus(6), 25, "la sexta llega al tope");
igual(bonus(40), 25, "🔴 y de ahí no pasa: sin tope, quien no falta nunca acabaría comprándolo todo con asistencia");
// 🔴 12-sep · LA RACHA SE PAGA EN EL SERVIDOR (`stargateAsistencia`, en functions/stargate.js de
// GamificaPro). Antes la pagaba el navegador del alumno con el origen del docente, el servidor se
// lo negaba y un `catch` lo convertía en «+0»: la racha no llegó a pagarse NUNCA. Lo destapó el
// laboratorio. Estas comprobaciones miran ahora donde vive la cuenta de verdad.
const SERVIDOR = require("fs").readFileSync("/Users/nor/Claude/vibewebs/gamificapro/functions/stargate.js", "utf8");
c(/Math\.min\(25, Math\.max\(0, \(racha - 1\) \* 5\)\)/.test(SERVIDOR), "y es la cuenta que hay en el servidor");
c(/llamar\("stargateAsistencia"/.test(motor), "🔴 y el navegador la PIDE al servidor: ya no se la paga a sí mismo");
c(!/deltaCoins: extra,\s*source: "teacher_resource_adjustment"/.test(motor),
  "   y no queda ni rastro del pago desde el navegador, que el servidor rechazaba en silencio");

// ---------------------------------------------------------------- b) créditos, NUNCA xp
c(/cambios\.coins = Math\.max\(0, Number\(p\.coins \?\? 0\) \+ extra\)/.test(SERVIDOR) && !/totalPoints[^\n]*extra/.test(SERVIDOR),
  "🔴 la racha paga CRÉDITOS y NUNCA xp: los xp ordenan el ranking y esto no puede tocarlo");
c(/stargate_asistencia/.test(SERVIDOR) && /if \(ya\.exists\) return/.test(SERVIDOR),
  "🔴 una vez por sesión y persona, dentro de la transacción: dos pulsaciones NO pagan dos veces");

// ---------------------------------------------------------------- c) perder una clase rompe la racha
// Se cuenta hacia atrás desde la sesión de hoy y se para en la primera que falte. Sin ese `break`,
// «tres clases sueltas en todo el curso» valdría lo mismo que «tres seguidas» — y entonces no
// premiaría la constancia, que es justo lo que se pedía.
c(/i < orden\.length && mias\.has\(orden\[i\]\.id\)/.test(SERVIDOR),
  "🔴 la racha se corta en la primera clase que falta: eso es lo que la hace significar algo");
c(/sort\(\(a, b\) => b\.t - a\.t\)/.test(SERVIDOR), "y se cuenta desde la más reciente hacia atrás");

// ---------------------------------------------------------------- d) el regalo del docente
c(/stargateRegalo: String\(o\.regalo \|\| ""\)/.test(motor),
  "🔴 el regalo se guarda EN LA SESIÓN: todos reciben lo mismo, y quien llega tarde no se lleva otra cosa");
const llam = raiz("assets/js/llamada.js");
c(/id="ll-sobre"/.test(llam), "el docente puede marcarlo al tocar llamada");
c(!/regalar.*(xp|cr[ée]ditos)/i.test(llam.slice(llam.indexOf("ll-regalo"), llam.indexOf("ll-regalo") + 600)),
  "🔴 y SOLO un sobre de cromos: ni xp ni créditos, que enturbiarían la puntuación");

// ---------------------------------------------------------------- e) el azar respeta las rarezas
// 🔴 Regalar elegía con un `Math.random()` uniforme: la legendaria de Ander —una de cada cien en la
// tienda— caía igual de fácil que un tripulante común. La rareza es TODO el valor de una colección:
// un regalo que la ignora devalúa las cartas que alguien lleva semanas persiguiendo.
c(/function alAzarPorPeso/.test(motor), "🔴 los regalos respetan el peso de cada carta");
c(/alAzarPorPeso\(cromos\)/.test(motor), "   tanto al regalar una suelta…");
c(/regalarSobre/.test(motor), "   …como el sobre entero de la asistencia");
c(/await updateDoc\(doc\(db, "student_profiles", fichaId\), \{ inventory: inv \}\)/.test(motor),
  "🔴 y las tres cartas van en UNA escritura: tres updateDoc seguidos se pisan y se perderían dos");

// ---------------------------------------------------------------- f) el sobre, tres cartas
const paq = raiz("motor/paquete.js");
c(/stargateTipo === "cromo"\) \{ r\.isConsumable = true; r\.maxUses = 3;/.test(paq),
  "🔴 un sobre son TRES cartas: con una, NADIE completaba el álbum jamás");
E.resumen("Racha de asistencia y regalo");
