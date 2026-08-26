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

// ---------------------------------------------------------------- a) cada tema explica sus retos
const cas = bit.getItems(G.FormApp.ItemType.CHECKBOX).filter(i => /^Tema \d /.test(i.getTitle()));
c(cas.length >= 8, "hay una casilla por tema (" + cas.length + ")");
cas.forEach(cb => {
  const t = Number(cb.getTitle().match(/^Tema (\d) /)[1]);
  const ayuda = cb.getHelpText();
  const suyos = G.RETOS_REGULAR.filter(r => r[4] === t);
  suyos.forEach(r => {
    contiene(ayuda, r[1], "el tema " + t + " nombra «" + r[1].slice(0, 28) + "…»");
    if (G.AYUDA_RETOS[r[0]]) contiene(ayuda, G.AYUDA_RETOS[r[0]].slice(0, 24),
      "🔴 y dice QUÉ hay que hacer, no solo cómo se llama");
  });
  contiene(ayuda, "recluta.html?per=" + per, "y enlaza su Nave por si aun así hay dudas");
});

// ---------------------------------------------------------------- b) el enlace de evidencia
const evs = titulos().filter(t => t.indexOf(G.EVIDENCIA_PREF) === 0);
igual(evs.length, cas.length + 1, "un enlace de evidencia por sección, incluida la batalla final");
igual(new Set(evs).size, evs.length,
  "🔴 con nombre DISTINTO cada uno: si se llamaran igual, la hoja de respuestas tendría nueve columnas iguales y leerFila_ solo vería la última");
contiene(item(G.tituloEvidencia_(1)).getHelpText(), "incógnito",
  "y avisa de lo que más falla: un enlace que pide permiso no lo puede abrir el profe");

// ---------------------------------------------------------------- c) se guarda CON el reto
const delTema1 = G.RETOS_REGULAR.filter(r => r[4] === 1).slice(0, 2);
E.enviarBitacora(G, per, { email: "nova@alumno.es", alias: "Nova", nombre: "N N", profe: "Mr Cuarter",
  marcados: { "Tema 1 · Lo que he completado": delTema1.map(r => r[1]).join(", "),
              [G.tituloEvidencia_(1)]: "https://view.genially.com/bitacora-nova" } });
const yo = G.tablero_(per, true).reclutas.filter(x => x.email === "nova@alumno.es")[0];
const conPrueba = yo.eventos.filter(e => e.evidencia);
igual(conPrueba.length, 2, "🔴 el enlace queda pegado a CADA reto de ese envío, no en una columna suelta");
conPrueba.forEach(e => igual(e.evidencia, "https://view.genially.com/bitacora-nova", "y es el que puso"));
igual(yo.eventos.filter(e => e.reto_id === "H1")[0].evidencia, "", "el reclutamiento no lleva enlace: no se entrega nada");

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
