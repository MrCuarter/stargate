'use strict';
// 48 · LA SESIÓN DE LA SEMANA (sesion.html)
// Norberto, 11-sep: «que desde el panel del profesor esté todo organizado en semanas de forma
// desplegada... que el docente en su panel viera todo lo de esa semana de forma que al compartir
// pantalla pudiera explicarlo a los estudiantes sin necesidad de crear un genially».
//
// Lo que vigila esta batería, y por qué cada cosa:
//   a) que la página existe y carga lo que necesita (si falta un window.SG_*, el mazo sale mudo y
//      NO se rompe: se queda sin planetas o sin enunciados y nadie se entera hasta estar en clase);
//   b) 🔴 que el consejo del Capitán NO viaja dentro del mazo. Es la nota del docente: si acabara
//      proyectada, estaría enseñándole a su clase cómo piensa darles la clase;
//   c) que el dato nuevo (consejo, clases) sale del CRONO y llega al navegador por las dos vías,
//      REGULAR y PUA — la vista PUA fusiona semanas y es justo donde se pierden los campos nuevos;
//   d) que «Mi clase» lleva hasta aquí, que si no la página existe y no la encuentra nadie.
const E = require("./entorno.js");
const { comprobar: c, igual } = E;
const fs = require("fs"), path = require("path");
const RAIZ = path.join(__dirname, "..");
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
console.log("\n▶ 48 · La sesión de la semana");

const S = leer("assets/js/sesion.js");
const HTML = leer("sesion.html");
const CAL = leer("assets/js/calendario.js");
const CLASE = leer("assets/js/clase.js");
// Para comprobar «esto NO está» hay que mirar el código sin comentarios: ya me la colaron dos veces
// (baterías 43 y 45) mis propios comentarios explicando lo que no hacía.
const CODIGO = S.replace(/^\s*\/\/.*$/gm, "");

// ------------------------------------------------------- a) la página trae sus datos
["SG_SEMANAS", "SG_PLANETAS", "SG_RETOS", "SG_AYUDA_RETOS", "SG_TABLERO_API"].forEach(function (k) {
  c(HTML.indexOf("window." + k + "=") >= 0, "sesion.html inyecta window." + k);
});
c(/assets\/js\/calendario\.js/.test(HTML), "sesion.html carga calendario.js (semana en curso y vista PUA)");
c(/assets\/js\/sesion\.js/.test(HTML), "sesion.html carga sesion.js");
c(/id="sesion-app"/.test(HTML), "sesion.html tiene el ancla #sesion-app donde se pinta el mazo");
// la puerta del PIN: la misma que «Mi clase», porque lleva el consejo y el mensaje del foro
c(/assets\/js\/puerta\.js/.test(HTML), "🔴 sesion.html va detrás del PIN del profesorado");
c(/classList\.add\("cerrado"\)/.test(HTML), "   y nace tapada hasta que el PIN se valida");

// los datos que pinta no pueden venir vacíos por un descuido del generador
const SEMJSON = JSON.parse(HTML.match(/window\.SG_SEMANAS=(\[.*?\]);window\.SG_PLANETAS/)[1]);
igual(SEMJSON.length, 15, "viajan las 15 semanas del curso REGULAR");
c(SEMJSON.every(s => typeof s.consejo === "string"), "todas las semanas traen el campo «consejo»");
c(SEMJSON.filter(s => s.consejo).length >= 10, "y al menos 10 lo traen escrito de verdad");
c(SEMJSON.every(s => typeof s.clases === "string"), "todas traen «clases» (las sesiones que ocupa)");
const PLANJSON = JSON.parse(HTML.match(/window\.SG_PLANETAS=(\[.*?\]);window\.SG_RETOS/)[1]);
igual(PLANJSON.length, 8, "viajan los 8 planetas");

// ------------------------------------------------------- b) el consejo NO se proyecta
// La separación es física: el consejo se pinta en prep() y la pantalla completa se pide sobre el
// mazo, no sobre la página. Si algún día se pidiera sobre document.body, el consejo saldría en el
// proyector sin que nadie tocara una línea de HTML.
const prep = S.slice(S.indexOf("function prep("), S.indexOf("function pintar("));
c(prep.indexOf("s.consejo") >= 0, "el consejo del Capitán se pinta en la tira de preparación");
c(prep.indexOf("s.foro") >= 0, "y el mensaje del foro, también fuera del mazo");
const construir = S.slice(S.indexOf("function construir("), S.indexOf("// ---------- pintado ----------"));
// 🔴 La regla es sobre `s.consejo` —el consejo del Capitán que viene del calendario, material
// PRIVADO del docente— no sobre la palabra. Desde el 12-sep el mazo lleva además una «invitación»
// semanal, que es lo contrario: algo que el alumnado puede hacer hoy. Buscar la palabra suelta
// confundía las dos y saltaba con un cambio legítimo.
c(construir.indexOf("s.consejo") < 0, "🔴 el consejo del Capitán NO entra en ninguna diapositiva del mazo");
c(construir.indexOf("invitacion(") >= 0, "   pero la invitación al alumnado sí: esa es para proyectarla");
c(construir.indexOf(".foro") < 0, "🔴 el mensaje del foro tampoco: eso lo copia el docente, no se proyecta");
c(/mazo&&mazo\.requestFullscreen/.test(CODIGO),
  "🔴 la pantalla completa se pide sobre el MAZO, no sobre la página (si no, el consejo se vería)");
c(!/document\.body\.requestFullscreen/.test(CODIGO),
  "   y nunca sobre document.body");
c(/no se proyecta/.test(prep), "la tira lo dice en voz alta: «solo para ti · no se proyecta»");

// ------------------------------------------------------- c) las dos vistas llevan el consejo
c(/consejo:l\.map/.test(CAL),
  "🔴 la vista PUA (que fusiona semanas por tema) arrastra el consejo: si no, los grupos PUA se quedaban sin él");
c(/clases:l\.map/.test(CAL), "   y también las clases");
c(/window\.SGCAL\.vista\(st\.tipo, SEM\)/.test(S),
  "sesion.js usa el MISMO motor de calendario que el foro y la Nave (un dato, un sitio)");
c(/semanaActual\(st\.inicio\)/.test(S), "la semana que abre es la que toca por la fecha de inicio del PER");

// ------------------------------------------------------- d) el mazo se construye entero
["portada", "plan", "video", "reto", "insignias", "hito", "cierre", "tuyo"].forEach(function (k) {
  c(construir.indexOf("k:'" + k + "'") >= 0, "el mazo tiene la diapositiva «" + k + "»");
});
c(/diapositiva en blanco/.test(S), "el mazo termina en el hueco del docente (sus propios ejemplos)");
// el enunciado de cada reto no se reescribe aquí: se cruza con el catálogo por texto
c(/function idDeReto/.test(S), "el «qué hay que hacer» sale del catálogo de retos, no de una copia");
c(/AYU\[id\]/.test(CODIGO), "   y se lee de AYUDA_RETOS, que ya alimenta la Nave");

// El cruce se hace por el TÍTULO ENTRECOMILLADO porque los dos textos no son iguales (el calendario
// añade coletillas). Aquí se repite la regla a mano, a propósito: así esta batería no valida que el
// código haga «lo que hace», sino que los DATOS siguen teniendo pareja. Si alguien renombra una
// misión en el CRONO y no en el catálogo, salta aquí y no en clase.
const RETJSON = JSON.parse(HTML.match(/window\.SG_RETOS=(\{.*?\});window\.SG_AYUDA_RETOS/)[1]);
const AYUJSON = JSON.parse(HTML.match(/window\.SG_AYUDA_RETOS=(\{.*?\});window\.SG_IMGV/)[1]);
c(/function nucleo/.test(S), "sesion.js cruza por el título entrecomillado, no por igualdad exacta");
const nucleo = txt => {
  const m = String(txt).match(/«([^»]+)»/);
  if (m) return m[1].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const a = String(txt).match(/actividad\s+(\d)/i);
  return a ? "actividad " + a[1] : "";
};
const porNucleo = {};
RETJSON.REGULAR.forEach(([id, txt]) => { const k = nucleo(txt); if (k && !porNucleo[k]) porNucleo[k] = id; });
let cruzados = 0, huerfanos = [], mudos = [];
SEMJSON.forEach(function (s) {
  (s.lanza || []).forEach(function (txt) {
    const id = porNucleo[nucleo(txt)];
    if (!id) huerfanos.push(txt);
    else if (!AYUJSON[id]) mudos.push(txt + " (" + id + ")");
    else cruzados++;
  });
});
c(huerfanos.length === 0,
  "🔴 toda misión del calendario tiene pareja en el catálogo de retos · sin pareja: " +
  (huerfanos.join(" | ") || "ninguna"));
c(mudos.length === 0,
  "🔴 y toda pareja tiene escrito su «qué hay que hacer» · mudas: " + (mudos.join(" | ") || "ninguna"));
c(cruzados >= 19, "cruzan " + cruzados + " misiones (19 o más)");

// Las insignias se proyectan con su NOMBRE y su historia, no con la clave del fichero. La primera
// versión enseñaba «P1_bran» en el proyector: la ficha rica vivía encerrada dentro del modal de
// stargate.js y badge() devolvía null sin quejarse. Ahora se expone y se comprueba que sigue ahí.
const STG = leer("assets/js/stargate.js");
c(/window\.SG\.BADGE = BADGE/.test(STG), "🔴 stargate.js expone la ficha de las insignias en window.SG.BADGE");
c(/window\.SG&&window\.SG\.BADGE/.test(S), "   y la sala de sesión la usa (si no, proyecta «P1_bran»)");
const BADGEJS = STG.match(/var BADGE=(\{.*?\}), CARDT=/)[1];
const BADGES = JSON.parse(BADGEJS);
const sinFicha = [];
SEMJSON.forEach(s => (s.insignias || []).forEach(k => { if (!BADGES[k]) sinFicha.push(k); }));
c(sinFicha.length === 0,
  "🔴 toda insignia del calendario tiene ficha con nombre · sin ficha: " + (sinFicha.join(" | ") || "ninguna"));

// ------------------------------------------------------- e) se llega desde «Mi clase»
c(/sesion\.html\?per=/.test(CLASE), "🔴 «Mi clase» enlaza la sesión de la semana (si no, nadie la encuentra)");
c(/Proyectar la sesión de la semana/.test(CLASE), "y el botón dice para qué sirve");
c(/&sem='\+sem/.test(CLASE), "abre directamente en la semana en la que va el grupo");

// ------------------------------------------------------- f) no se escapa nada sin escapar
// El mazo pinta texto que viene del CRONO y de la API (el nombre del PER). Todo por esc().
c(/function esc\(s\)/.test(S), "sesion.js tiene su esc()");
["s.tema", "s.sub||''", "s.hito", "st.nombre", "txt", "pide"].forEach(function (v) {
  c(S.indexOf("esc(" + v + ")") >= 0, "se escapa " + v);
});

E.resumen("La sesión de la semana");
