'use strict';
// 27 · QUÉ HAY QUE HACER, Y LA PRUEBA DE QUE LO HICISTE
// Dos cosas que salen del mismo sitio: el formulario. Un alumno que no sabe qué se le pide ESCRIBE
// UN CORREO, y ese correo lo paga el profesorado — que es justo lo que no puede pasar durante una
// baja. Así que la explicación de cada reto va DENTRO del formulario, y con ella el enlace a lo que
// ha hecho, guardado al lado de cada reto para que se vea sin ir a buscarlo.
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
console.log("\n▶ 27 · La ayuda por reto y el enlace de evidencia");

const G = E.nuevoMundo();
const per = E.crearPERDemo(G).id;
const bit = G.FormApp.openByUrl(G.perObj_(G.perFila_(per).v).formBitacoraEdit);
const item = t => bit.getItems().filter(i => i.getTitle() === t)[0];
const titulos = () => bit.getItems().map(i => i.getTitle());

// ---------------------------------------------------------------- a) UN BLOQUE POR RETO (v3.37)
// Reforma del 29-ago. Antes cada planeta era UNA casilla con todos sus retos dentro y su enunciado
// apelotonado en la ayuda: el alumno leía un muro de texto y no sabía a cuál correspondía qué.
// Ahora cada reto es su propia pregunta —título, enunciado, casilla y SU enlace—, que es lo que
// pidió Norberto leyéndolo en vivo.
const RETOS = G.RETOS_REGULAR;
RETOS.forEach(r => {
  const cb = item(r[1]);
  c(!!cb && cb.getType() === "CHECKBOX", "el reto «" + r[0] + "» tiene su propia casilla");
  if (!cb) return;
  igual(cb.getChoices().map(x => x.getValue()), [G.OPC_HECHO], "y una sola opción: lo he completado");
  if (G.AYUDA_RETOS[r[0]])
    contiene(cb.getHelpText(), G.AYUDA_RETOS[r[0]].slice(0, 24),
      "🔴 con SU enunciado al lado, no el de los tres retos del planeta juntos");
});
igual(titulos().filter(t => /^Tema \d · Lo que he completado$/.test(t)).length, 0,
  "y ya no queda ninguna casilla «una por planeta»");

// ---------------------------------------------------------------- b) un enlace POR RETO
const evs = titulos().filter(t => t.indexOf(G.EVIDENCIA_PREF) === 0);
igual(evs.length, RETOS.length, "un enlace de evidencia por RETO, no uno por planeta");
igual(new Set(evs).size, evs.length,
  "🔴 con nombre DISTINTO cada uno: si se llamaran igual, la hoja tendría columnas repetidas y leerFila_ solo vería la última");
// v3.38 · LA EVIDENCIA POR TIPO (petición de Norberto, 30-ago): cada reto dice la forma más fácil
// de compartir SU producto, no un consejo genérico.
const a1 = RETOS.filter(r => r[0] === "A1")[0];
contiene(item(G.tituloEvidenciaReto_(a1)).getHelpText(), "ENLACE DIRECTO",
  "🔴 A1 va del foro: pide el enlace directo al mensaje, no un genérico");
contiene(item(G.tituloEvidenciaReto_(a1)).getHelpText(), "postimages",
  "y da las alternativas (captura a Drive compartido o postimages, o vía Bitácora)");
const b6 = RETOS.filter(r => r[0] === "B6")[0];
contiene(item(G.tituloEvidenciaReto_(b6)).getHelpText(), "incógnito",
  "B6 es un juego con enlace propio: pide el enlace y la prueba del incógnito");
// 30-ago · Norberto: las Actividades ya se entregan en la plataforma de UNIR — aquí NO se pide enlace
["X1", "X2"].forEach(id => {
  const x = G.retosDe_("REGULAR").filter(r => r[0] === id)[0];
  contiene(item(G.tituloEvidenciaReto_(x)).getHelpText(), "No hace falta enlace",
    "🔴 la Actividad " + id + " dice claro que no hace falta enlace: ya está entregada en UNIR");
});
const xf = G.retosDe_("REGULAR").filter(r => r[0] === "XF")[0];
if (xf) contiene(item(G.tituloEvidenciaReto_(xf)).getHelpText(), "dejarlo vacío",
  "y la batalla final dice que no hace falta enlace");
// v3.38 · EL PADLET (30-ago). Con padlet configurado, B1/A6/A7 mandan allí y piden el enlace de TU
// publicación; sin padlet, caen a su plan B. Y foro/Actividades ni lo mencionan: decisión explícita.
const GP = E.nuevoMundo();
E.crearPERDemo(GP, { nombre: "GRUPO PADLET", padlet: "https://padlet.com/profe/muro-de-clase-abc123def" });
const bitP = GP.FormApp.openByUrl(GP.perObj_(GP.perFila_("grupo-padlet").v).formBitacoraEdit);
const itemP = t => bitP.getItems().filter(i => i.getTitle() === t)[0];
["A0", "B1", "A6", "A7"].forEach(id => {
  const r = GP.RETOS_REGULAR.filter(x => x[0] === id)[0];
  const ay = itemP(GP.tituloEvidenciaReto_(r)).getHelpText();
  contiene(ay, "PADLET", "🔴 " + id + " manda al padlet de la clase");
  contiene(ay, "muro-de-clase-abc123def", "con SU enlace, no uno genérico");
  contiene(ay, "TU publicación", "y pide el enlace de la publicación propia, que es la evidencia");
});
const a1P = GP.RETOS_REGULAR.filter(x => x[0] === "A1")[0];
c(itemP(GP.tituloEvidenciaReto_(a1P)).getHelpText().indexOf("padlet") < 0,
  "los retos de FORO no mencionan el padlet: el foro es el foro (decisión de Norberto)");
const x1P = GP.RETOS_REGULAR.filter(x => x[0] === "X1")[0];
c(itemP(GP.tituloEvidenciaReto_(x1P)).getHelpText().indexOf("padlet") < 0, "y las Actividades tampoco");
// sin padlet, B1 no se queda huérfano
contiene(G.ayudaEvidenciaReto_(RETOS.filter(r => r[0] === "B1")[0], ""), "Bitácora",
  "sin padlet configurado, B1 cae a la Bitácora/captura — nunca a un texto que nombra un muro que no existe");

// ---------------------------------------------------------------- f-bis) el huevo de Pascua (v3.41)
// S7 sustituye a la Batalla final: la palabra secreta ES la evidencia y la valida el propio
// formulario de Google — sin la palabra de Vaeon, el campo no acepta la respuesta.
const s7 = G.RETOS_REGULAR.filter(r => r[0] === "S7")[0];
c(!!s7, "el reto secreto S7 está en el catálogo REGULAR");
c(G.RETOS_PUA.some(r => r[0] === "S7"), "y en el PUA");
igual(s7[2], ["E3_vaeon"], "🔴 da la insignia de Vaeon, que ya no depende del examen");
const evS7 = item(G.tituloEvidenciaReto_(s7));
c(!!evS7 && !!evS7.validacion, "🔴 su campo de evidencia lleva validación de Google Forms");
if (evS7 && evS7.validacion) {
  igual(evS7.validacion.tipo, "contiene", "del tipo «contiene el patrón»");
  contiene(evS7.validacion.patron, G.PALABRA_HUEVO, "con la palabra secreta dentro (PALABRA_HUEVO, un solo sitio)");
  contiene(evS7.validacion.patron, "(?i)", "y sin distinguir mayúsculas: ander vale como ANDER");
  contiene(evS7.validacion.ayuda, "Vaeon", "el «no» del formulario habla en el idioma del juego");
}
contiene(item(G.tituloEvidenciaReto_(s7)).getHelpText(), "PALABRA SECRETA", "la ayuda pide la palabra, no un enlace");
// y al marcarlo, Vaeon cae
const GS = E.nuevoMundo(); E.crearPERDemo(GS);
E.enviarBitacora(GS, "prueba-banco", { email: "sec@alumno.es", alias: "Sec", nombre: "S S", profe: "Mr Cuarter" });
const marcaS7 = E.marcar(GS, [s7[1]]);
marcaS7[GS.tituloEvidenciaReto_(s7)] = "ANDER";
E.enviarBitacora(GS, "prueba-banco", { marcados: marcaS7, email: "sec@alumno.es" }, 2);
const sec = GS.tablero_("prueba-banco", true).reclutas.filter(x => x.email === "sec@alumno.es")[0];
c(sec.insignias.indexOf("E3_vaeon") >= 0, "🔴 resolver el huevo de Pascua entrega la insignia del General Vaeon");
igual(sec.eventos.filter(e => e.reto_id === "S7")[0].evidencia, "ANDER", "y la palabra queda como evidencia");
// XF ya no existe: nada del catálogo apunta al examen
c(G.RETOS_REGULAR.every(r => r[0] !== "XF") && G.RETOS_PUA.every(r => r[0] !== "XF"),
  "🔴 la Batalla final está FUERA de los dos catálogos (decisión de Norberto, 30-ago)");

// ---------------------------------------------------------------- g) la chincheta de bienvenida
// La clave del plan actual NO deja crear tableros (solo publicar): el padlet se crea a mano y, si
// hay clave, NEBULA deja la chincheta. Sin clave, NI UNA llamada a la API.
igual(GP.M ? 0 : 0, 0, "");
const llamadasSin = E.M.Fetch.peticiones.filter(x => x.url.indexOf("api.padlet.dev") >= 0).length;
igual(llamadasSin, 0, "🔴 sin clave API no se llama a Padlet (crear el PER no depende de fuera)");
const GK = E.nuevoMundo();
E.M.Props.getScriptProperties().setProperty("PADLET_KEY", "pdltp_prueba");
E.crearPERDemo(GK, { nombre: "GRUPO CHINCHETA", padlet: "https://padlet.com/profe/muro-xyz987abc" });
const alPadlet = E.M.Fetch.peticiones.filter(x => x.url.indexOf("api.padlet.dev/v1/boards/xyz987abc/posts") >= 0);
igual(alPadlet.length, 1, "🔴 con clave y padlet, NEBULA publica UNA chincheta de bienvenida");
if (alPadlet.length) {
  const op = alPadlet[0].opciones || {};
  igual((op.headers || {})["X-Api-Key"], "pdltp_prueba", "con la clave en la cabecera, no en la URL");
  contiene(String(op.payload || ""), "recluta.html?per=grupo-chincheta", "y la chincheta enlaza la Nave del grupo");
  c(op.muteHttpExceptions === true, "sin reventar el alta si Padlet falla: la chincheta es un extra, no un requisito");
}
igual(GK.padletBoardId_("https://padlet.com/mutecdUNIR/regulacion-de-dispositivos-moviles-en-la-escuela-yw8mpoacbudl"),
  "yw8mpoacbudl", "el id del tablero se saca del final del slug (probado con uno real)");

// 🔴 guardarraíl: ningún reto de NINGÚN catálogo sin tipo, y ningún tipo sin texto. El día que se
// añada un reto nuevo y nadie decida cómo se comparte, esto lo canta.
const sinTipo = [...new Set(G.RETOS_REGULAR.concat(G.RETOS_PUA).map(r => r[0]))]
  .filter(id => !G.EVIDENCIA_TIPO[id]);
igual(sinTipo, [], "🔴 todos los retos tienen tipo de evidencia asignado");
// el tipo "padlet" se compone en ayudaEvidenciaReto_ (URL del grupo o su plan B padlet_sin_url)
const sinTexto = [...new Set(Object.values(G.EVIDENCIA_TIPO))]
  .filter(t => !G.EVIDENCIA_TEXTOS[t] && !(t === "padlet" && G.EVIDENCIA_TEXTOS.padlet_sin_url));
igual(sinTexto, [], "y todos los tipos tienen su texto");
// el orden importa: el enlace va PEGADO a su casilla, no al final de la página
const orden = titulos();
RETOS.forEach(r => {
  igual(orden.indexOf(G.tituloEvidenciaReto_(r)), orden.indexOf(r[1]) + 1,
    "el enlace del reto " + r[0] + " va justo debajo de su casilla");
});

// ---------------------------------------------------------------- c) cada enlace, con SU reto
// Lo que esto de verdad arregla: antes había UN enlace por envío y se copiaba en TODOS los retos
// marcados, así que el profe veía la misma URL en tres retos distintos sin saber cuál era cuál.
const delTema1 = RETOS.filter(r => r[4] === 1).slice(0, 2);
const marcas = E.marcar(G, delTema1);
marcas[G.tituloEvidenciaReto_(delTema1[0])] = "https://view.genially.com/uno";
marcas[G.tituloEvidenciaReto_(delTema1[1])] = "https://view.genially.com/dos";
E.enviarBitacora(G, per, { email: "nova@alumno.es", alias: "Nova", nombre: "N N", profe: "Mr Cuarter",
  marcados: marcas });
const yo = G.tablero_(per, true).reclutas.filter(x => x.email === "nova@alumno.es")[0];
const ev1 = yo.eventos.filter(e => e.reto_id === delTema1[0][0])[0];
const ev2 = yo.eventos.filter(e => e.reto_id === delTema1[1][0])[0];
igual(ev1.evidencia, "https://view.genially.com/uno", "🔴 cada reto guarda EL SUYO…");
igual(ev2.evidencia, "https://view.genially.com/dos", "…y no el del de al lado");
igual(yo.eventos.filter(e => e.reto_id === "H1")[0].evidencia, "", "el reclutamiento no lleva enlace: no se entrega nada");

// ---------------------------------------------------------------- c bis) las respuestas VIEJAS
// 🔴 Las columnas del formato anterior NO desaparecen de la hoja al cambiar el formulario: Google
// las conserva con lo que cada alumno contestó. Si el lector dejara de entenderlas, todo lo
// registrado antes de la reforma se volvería invisible en el siguiente envío de esa persona.
const shV = G._maestra.getSheetByName("B · " + per);
const cabV = shV.getRange(1, 1, 1, shV.getLastColumn()).getValues()[0].map(String);
const nc = cabV.length;
shV.getRange(1, nc + 1, 1, 2).setValues([["Tema 2 · Lo que he completado", G.EVIDENCIA_PREF + "Tema 2"]]);
const delTema2 = RETOS.filter(r => r[4] === 2);
shV.getRange(2, nc + 1, 1, 2).setValues([[delTema2.map(r => r[1]).join(", "), "https://view.genially.com/viejo"]]);
G.alRecibirRespuesta({ range: { getSheet: () => shV, getRow: () => 2 } });
const yo2 = G.tablero_(per, true).reclutas.filter(x => x.email === "nova@alumno.es")[0];
delTema2.forEach(r => {
  const e = yo2.eventos.filter(x => x.reto_id === r[0])[0];
  c(!!e, "se sigue leyendo el formato viejo: " + r[0]);
  if (e) igual(e.evidencia, "https://view.genially.com/viejo", "con su enlace de entonces, el del planeta entero");
});

// ---------------------------------------------------------------- d) idempotente
const antes = titulos().length;
G.reestructurarBitacora_(bit, G.perObj_(G.perFila_(per).v));
G.reestructurarBitacora_(bit, G.perObj_(G.perFila_(per).v));
igual(titulos().length, antes, "🔴 pasarla dos veces no duplica campos (la ejecutan crearPER y Mantenimiento)");

// ---------------------------------------------------------------- e) NINGÚN reto sin explicar
// 🔴 Un reto sin texto es exactamente el que genera el correo al profesorado. El texto sale del
// documento maestro RETOS_INSIGNIAS_STARGATE.md y lo empareja el build por el nombre del reto: si
// alguien renombra uno, aquí se ve.
const ids = G.RETOS_REGULAR.concat(G.RETOS_PUA).map(r => r[0]);
[...new Set(ids)].forEach(id => {
  const t = G.AYUDA_RETOS[id] || "";
  c(!!t, "el reto «" + id + "» tiene texto de ayuda");
  c(t.indexOf("(falta)") < 0, "🔴 y no es un hueco por rellenar");
  c(t.length > 40, "y dice algo de verdad, no una línea suelta (" + t.length + " caracteres)");
});
// el foro es el de UNIR, dicho con todas las letras: si no, preguntan cuál
Object.keys(G.AYUDA_RETOS).forEach(id => {
  const t = G.AYUDA_RETOS[id];
  if (/\bforo\b/.test(t)) contiene(t, "foro de la plataforma de UNIR",
    "🔴 «" + id + "» dice QUÉ foro: el de la plataforma de UNIR");
});

E.resumen("La ayuda por reto y el enlace de evidencia");
