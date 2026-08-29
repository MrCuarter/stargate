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
contiene(item(G.tituloEvidenciaReto_(RETOS[0])).getHelpText(), "incógnito",
  "y avisa de lo que más falla: un enlace que pide permiso no lo puede abrir el profe");
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
