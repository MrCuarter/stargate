'use strict';
/**
 * BATERÍA 121 · UN SOLO BOTÓN DE AYUDA (1-oct)
 *
 * Norberto, al ver que la guardia del buzón y la revisión de la Academia le decían cosas distintas a Anita: «¿es posible unificar
 * para que los canales sean lo mismo? Hacer un paso intermedio: ¿tu duda es para la academia, o para STARGATE con estudiantes, o un
 * curso concreto?… Para Anita y Caridad es la misma vía, no deben ser vías diferentes. El botón de ayuda debe ser el mismo siempre,
 * debe dar prioridad desde donde se activa, pero si hay discrepancias o puede haber dudas, se pregunta o se da una respuesta MUY
 * COMPLETA». Eligió la opción A del borrador: chips «¿Sobre qué es?» ya marcados según desde dónde se abre.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };

const BZ = L("assets/js/buzon.js"), AJS = L("assets/js/academia.js"), MOT = L("assets/js/motor.js"), CSS = L("assets/css/stargate.css");
const REGLAS = (() => { try { return fs.readFileSync(path.join(R, "..", "..", "gamificapro", "firestore.rules"), "utf8"); } catch (e) { return ""; } })();
const BUZON_CJS = L("../mando/buzon.cjs"), DIARIA = L("../academia/academia_diaria.cjs"), PROTO = L("../mando/PROTOCOLO_MANDO.md");

console.log("  El paso intermedio: ¿sobre qué es?");
c(/¿Sobre qué es\?/.test(BZ) && /data-ambito=/.test(BZ), "el buzón pregunta «¿Sobre qué es?» con una fila de opciones");
c(/La Academia \(tu formación\)/.test(BZ) && /Mi clase · /.test(BZ) && /No lo sé \/ de todo/.test(BZ), "   la Academia, cada una de sus clases y «No lo sé / de todo»");
c(/function ambitoInicial\(\)/.test(BZ) && /DESDE === "academia" && puedeAcademia\(\)/.test(BZ) && /PER0 && GRUPOS\.some/.test(BZ), "   viene marcada la del sitio desde el que se abre (la Academia, o el grupo de la consola)");
c(/ST\.ambito = "";\s+\/\/ hay varias/.test(BZ) && /if \(!ST\.ambito\) \{ aviso\("Dinos arriba sobre qué es/.test(BZ), "   🔴 si no se sabe desde dónde y hay varias, no se adivina: hay que elegir antes de enviar");
c(/g\.id !== PER_ACADEMIA/.test(BZ), "   el grupo de práctica de la Academia no sale como «una clase»");

console.log("  Un solo buzón");
c(/projectId: pid/.test(BZ) && /PER_ACADEMIA = "academia-cero"/.test(BZ), "lo de la Academia va al mismo buzón, con su grupo (academia-cero)");
c(/ambito: aca \? "academia" : ST\.ambito === "grupo" \? "clase" : "dudoso"/.test(BZ), "   y con su ámbito en el contexto (academia, clase o dudoso) para quien contesta");
c(/!GRUPOS\.length && !MANDO && !ACA/.test(BZ), "   quien solo hace la Academia (sin grupos) también entra");
c(/projectId == 'academia-cero'/.test(REGLAS) && /exists\(\/databases\/\$\(database\)\/documents\/stargate_formacion\/\$\(request\.auth\.uid\)\)/.test(REGLAS),
  "🔴 las reglas le dejan escribir solo si tiene su ficha de formación (y solo con ese grupo)");
const BZS = require("./sdk_pieza.js").pieza("buzon");   // (7-oct · el buzón es de GP_SDK.buzon, paso 10)
c((/d\.adjuntos = adj/.test(MOT) && /firebasestorage\\\.googleapis\\\.com/.test(MOT)) ||
  (/return BUZON_SDK\.enviar\(m, TEXTOS_BUZON\);/.test(MOT) && /if \(adj\.length\) d\.adjuntos = adj;/.test(BZS) && /firebasestorage\\\.googleapis\\\.com/.test(BZS)), "las capturas viajan con el mensaje (solo de nuestro almacén)");
c(/Añadir una captura/.test(BZ) && /function subirAdj\(\)/.test(BZ) && /function comprimir\(f\)/.test(BZ), "   el buzón tiene el «Añadir una captura» que tenía la Academia (pegar con Ctrl+V incluido)");

console.log("  La Academia abre el mismo buzón");
c(/buzon\.html\?desde=academia&embed=1/.test(AJS) && /acd-flota-if/.test(AJS), "la píldora «Pregunta a NEBULA» abre el buzón incrustado, con «La Academia» marcada");
c(/if \(!DEMO\) \{\s+\/\/ 1-oct · con cuenta, el panel es el buzón/.test(AJS), "   en la demostración (sin cuenta) se queda el hilo de este navegador");
c(/M\.buzonMios\(\)\.then\(function \(L\) \{ BZ_NUEVOS/.test(AJS), "   el número de respuestas nuevas cuenta también las del buzón");
c(/q\.get\("embed"\) === "1"\) document\.body\.classList\.add\("embed"\)/.test(BZ) && /body\.embed #buzon/.test(CSS), "   incrustado, sin cabecera ni pie");
c(/function hiloAcademia\(\)/.test(BZ) && /\(ACA\.claude \|\| \{\}\)\.mensajes/.test(BZ), "los comentarios de NEBULA en la Academia (y lo de antes) salen como un hilo más: todo en un sitio");
c(/m\.projectId === PER_ACADEMIA \? "<img class=ico src=assets\/img\/iconos\/p\/cohete\.png alt> NEBULA"/.test(BZ), "   lo de la Academia lo firma NEBULA; lo de las clases, el Mando");
c(/Sus dudas, en el buzón del Mando/.test(AJS), "quien la organiza tiene el enlace a sus dudas en el buzón");

console.log("  Quien contesta: uno solo, y pregunta si no está claro");
c(/UN SOLO BOTÓN DE AYUDA/.test(PROTO) && /academia-cero/.test(PROTO) && /dudoso/.test(PROTO) && /NEBULA/.test(PROTO), "el protocolo de la guardia cubre la Academia, el ámbito dudoso y la firma de NEBULA");
c(/academia-curso/.test(BUZON_CJS) && /orden === "academia"/.test(BUZON_CJS), "la guardia tiene la Academia a mano (su contenido y lo hablado con cada docente)");
c(/⇄ BUZÓN/.test(DIARIA), "la revisión diaria ve lo que la guardia ya le contestó a esa persona (y no lo repite)");

console.log("\n  Batería 121 · un solo botón de ayuda");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
