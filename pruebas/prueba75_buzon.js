'use strict';
/**
 * BATERÍA 75 · EL BUZÓN DEL MANDO — «📡 Frecuencia de mando» (15-sep-2026).
 *
 * Norberto: «una página sencilla donde los docentes pongan recomendaciones o problemas… y que
 * resuelvas casi todo sin que yo intervenga». Vigila:
 *   · que las averías conocidas están completas (claves, respuesta, enlaces a páginas que existen);
 *   · que el Capitán acierta al instante con lo más habitual… y no se inventa nada para lo demás;
 *   · que la página existe, carga el motor y lo que necesita, y dice que responde un asistente de IA;
 *   · que desde la consola, la sesión, el aula y la llamada se llega al buzón con el contexto;
 *   · que las reglas del buzón están en GamificaPro.
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const RAIZ = path.resolve(__dirname, "..");
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");

const H = leer("buzon.html");
const sacar = (re) => { const m = re.exec(H); return m ? JSON.parse(m[1]) : null; };
const AVERIAS = sacar(/window\.SG_AVERIAS=(\[[\s\S]*?\]);window\.SG_FAQ=/), FAQ = sacar(/window\.SG_FAQ=(\[[\s\S]*?\]);(?:window\.|<\/script>)/);

// 1 · la página
c(!!AVERIAS && AVERIAS.length >= 8, "buzon.html lleva las averías conocidas", AVERIAS && AVERIAS.length);
c(!!FAQ && FAQ.length >= 10, "y las preguntas frecuentes de la guía", FAQ && FAQ.length);
c(/assets\/js\/motor\.js/.test(H) && /assets\/js\/buzon\.js\?v=/.test(H), "carga el motor y buzon.js (con su sello de versión)");
c(/Frecuencia de mando/.test(H) && /asistente de IA/.test(H), "dice qué es y, con claridad, que responde un asistente de IA");
c(/id="bz-app"/.test(H), "tiene dónde pintarse");

// 2 · las averías, completas
const ids = {};
(AVERIAS || []).forEach(([id, t, claves, x]) => {
  c(!ids[id], "avería «" + id + "» con id único"); ids[id] = true;
  c(t && t.length > 10 && Array.isArray(claves) && claves.length >= 3, "avería «" + id + "»: título y al menos 3 claves", JSON.stringify(claves));
  c(claves.every(k => k === k.toLowerCase() && !/[áéíóúü]/.test(k)), "avería «" + id + "»: claves sin tildes y en minúsculas (se comparan así)");
  c(x && x.replace(/<[^>]+>/g, "").length > 80, "avería «" + id + "»: una respuesta de verdad");
  (x.match(/href='([^']+)'/g) || []).forEach(h => { const f = h.slice(6, -1).split("#")[0];
    c(fs.existsSync(path.join(RAIZ, f)), "avería «" + id + "»: el enlace «" + f + "» existe"); });
});

// 3 · el Capitán acierta (el buscador de verdad, cargado de buzon.js)
const caja = { window: { SG_AVERIAS: AVERIAS, SG_FAQ: FAQ }, document: { getElementById: () => null }, location: { search: "" }, URLSearchParams };
vm.createContext(caja); vm.runInContext(leer("assets/js/buzon.js"), caja);
const B = caja.window.SG_BUZON;
c(!!B && typeof B.buscar === "function", "buzon.js expone su buscador (para esta batería)");
const acierta = [["No puedo pasar lista, los alumnos no ven el botón de presente", "lista"],
                 ["He cambiado el Genially del panel y sigue saliendo el viejo", "genially"],
                 ["Un alumno no puede entrar en su nave", "entrar"],
                 ["A una alumna no le suman los créditos del reto B2", "retos"],
                 ["La sesión no se ve dentro del genially cuando la inserto", "embed"],
                 ["¿Cómo congelo a un tramposo?", "congelar"],
                 ["Tenemos una semana de vacaciones en Navidad", "calendario"]];
if (B) acierta.forEach(([frase, id]) => {
  const r = B.buscar(frase).map(e => e.id);
  c(r.indexOf(id) >= 0, "🔴 «" + frase + "» → el Capitán ofrece «" + id + "»", JSON.stringify(r));
});
// 15-sep · las dudas de siempre: el Capitán las contesta al momento, con los datos de tus grupos
const dudas = [["¿Cuál es el código o enlace de invitación para que los estudiantes se unan a clase?", "invitacion"],
               ["¿Cómo cambio los enlaces de Genially?", "mi-genially"],
               ["¿Cuál es la dirección de la carpeta de Genially?", "carpeta"],
               ["¿Dónde están los recursos?", "material"],
               ["¿Cuál es la carpeta con el material audiovisual?", "material"],
               ["¿Cómo pongo la sesión dentro de mi Genially?", "insertar"],
               ["¿En qué semana estamos?", "semana"],
               ["¿Dónde está el mensaje del foro de esta semana?", "foro"],
               ["¿Hay un temporizador para la clase?", "tiempo"]];
if (B) dudas.forEach(([frase, id]) => {
  const r = B.buscar(frase).map(e => e.id);
  c(r[0] === id, "🔴 «" + frase + "» → el Capitán contesta primero «" + id + "»", JSON.stringify(r));
});
if (B) (B.vivas || []).forEach(e => {
  let h = ""; try { h = e.x(); } catch (err) { h = "ERROR " + err.message; }
  c(typeof h === "string" && h.length > 60 && !/ERROR|undefined/.test(h), "la respuesta «" + e.id + "» se escribe aunque aún no haya grupos", h.slice(0, 80));
  (h.match(/href='([^']+)'|href="([^"]+)"/g) || []).forEach(x => { const f = x.replace(/^href=["']|["']$/g, "").split(/[?#]/)[0];
    if (!/^https?:/.test(f) && f) c(fs.existsSync(path.join(RAIZ, f)), "respuesta «" + e.id + "»: el enlace «" + f + "» existe"); });
});
c(/window\.SG_GENIALLY_CARPETA="https:\/\/app\.genially\.com\//.test(H), "buzon.html lleva la carpeta de Geniallys (para contestarla al momento)");
if (B) c(B.buscar("Quiero la interfaz rosa").length === 0, "«Quiero la interfaz rosa» → no se inventa ninguna solución (es una idea: va al coordinador)",
  JSON.stringify(B.buscar("Quiero la interfaz rosa").map(e => e.id)));

// 4 · las puertas: consola, sesión, aula y llamada
const CON = leer("assets/js/consola.js");
c(/function botonBuzon\(/.test(CON) && /buzon\.html\?desde=/.test(CON) && /contarBuzon\(\)/.test(CON), "la consola tiene «📡 ¿Algo falla?», con el contador de respuestas");
[["assets/js/sesion.js", "sesion"], ["assets/js/aula.js", "aula"], ["assets/js/llamada.js", "llamada"]].forEach(([f, d]) =>
  c(new RegExp("buzon\\.html\\?desde=" + d).test(leer(f)), "desde «" + d + "» se llega al buzón, diciendo de dónde viene"));
const S = leer("assets/js/sesion.js");
const iP = S.indexOf("function prep("), fP = S.indexOf("\n  function ", iP + 10), iB = S.indexOf("buzon.html", iP);
c(iP > 0 && iB > iP && iB < fP, "en la sesión, dentro de «Antes de empezar» (lo que no se proyecta)");

// 5 · el motor y las reglas
const M = leer("assets/js/motor.js");
["buzonEnviar", "buzonMios", "buzonTodos", "buzonResponder", "buzonVisto"].forEach(f => c(new RegExp("async function " + f + "\\(").test(M) && new RegExp("\\b" + f + ",").test(M), "motor.js: " + f));
const REGLAS = "/Users/nor/Claude/vibewebs/gamificapro/firestore.rules";
if (fs.existsSync(REGLAS)) {
  const R = fs.readFileSync(REGLAS, "utf8");
  c(/match \/stargate_buzon\/\{mensaje\}/.test(R) && /function esDelMando\(\)/.test(R) && /allow delete: if false;/.test(R.slice(R.indexOf("match /stargate_buzon"))),
    "GamificaPro: las reglas del buzón (cada cual lo suyo, el Mando todo, nadie borra)");
}

if (require.main === module) {
  console.log("\n  Batería 75 · el buzón del Mando");
  console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
  fallos.forEach(f => console.log("   ✗ " + f));
  process.exit(fallos.length ? 1 : 0);
}
