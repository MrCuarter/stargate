'use strict';
// 30 · EL PARTE DE LA TRIPULACIÓN, y los dos ojos nuevos del parte de salud
// El bonus de grupo es la única forma de premiar el ticket sin romper su anonimato: como no se puede
// saber QUIÉN respondió, se cuentan cabezas y cobra todo el mundo. Eso trae dos deudas que esta
// batería vigila: que el reparto no se repita (cobrar dos veces por lo mismo es dinero regalado) y
// que inflar el recuento no pase desapercibido (nadie puede impedirlo, pero sí verse).
// Y de propina, el ojo que pidió Norberto: quien entra con dos cuentas de Google sale dos veces en
// el ranking, con la mitad de sus xp en cada una.
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
console.log("\n▶ 30 · El parte de la tripulación y los dos ojos nuevos");

const G = E.nuevoMundo();
const PER = E.crearPERDemo(G).id;
const o = () => G.perObj_(G.perFila_(PER).v);

const ALUMNOS = [["ana@alumno.es", "Ana", "Ana Ruiz"], ["ben@alumno.es", "Ben", "Ben Sol"],
                 ["cleo@alumno.es", "Cleo", "Cleo Mar"], ["dan@alumno.es", "Dan", "Dan Vega"]];
ALUMNOS.forEach(([email, alias, nombre]) =>
  E.enviarBitacora(G, PER, { email, alias, nombre, profe: "Mr Cuarter" }));

// un parte del ticket: lo único que importa para contar es la sección elegida
const TIT_SEL = "Selecciona el tema o actividad que hemos trabajado y sobre el que quieres hacer una pregunta";
function mandarParte(seccion) {
  const sh = G._maestra.getSheetByName("T · " + PER);
  if (sh.getLastRow() < 1) sh.appendRow(["Marca temporal", TIT_SEL]);
  const cab = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  const fila = cab.map(x => x === TIT_SEL ? seccion : (x === "Marca temporal" ? new Date() : ""));
  sh.appendRow(fila);
}
const bonusDe = clave => G.hoja_(G.H.AJ).getDataRange().getValues().slice(1)
  .filter(v => v[1] === PER && v[4] === "bonus" && String(v[5]) === clave);

// ---------------------------------------------------------------- a) la clave de cada sección
igual(G.claveSeccion_("Tema 3: Sendara (SENDARA)"), "t3", "«Tema 3: …» → t3");
igual(G.claveSeccion_("Tema 3: otro nombre del tema"), "t3",
      "🔴 y sigue siendo t3 si se retoca el nombre del tema: si no, el mismo tema contaría dos veces");
igual(G.claveSeccion_("Presentación de la asignatura"), "pres", "la presentación tiene la suya");
igual(G.claveSeccion_("Actividad 2: planifica y crea un paisaje"), "a2", "y las actividades también");
igual(G.claveSeccion_("cualquier otra cosa"), "", "lo que no reconoce no cuenta");

// ---------------------------------------------------------------- b) el umbral
igual(G.bonusTripulacion_().fraccion, 0.25, "de partida, uno de cada cuatro");
// 4 reclutas · 25 % → hace falta 1 parte
mandarParte("Tema 1: Fôrge (FORGE)");
igual(G.otorgarBonusTripulacion_(o()), 4, "con el umbral alcanzado cobran los CUATRO, no solo quien lo mandó");
igual(bonusDe("tripulacion:t1").length, 4, "una fila por recluta, con su clave");
igual(G.otorgarBonusTripulacion_(o()), 0, "🔴 y al repetir no se reparte nada: nadie cobra dos veces");

// un tema sin partes no paga
igual(bonusDe("tripulacion:t2").length, 0, "un tema del que no ha llegado ningún parte no paga");

// ---------------------------------------------------------------- c) el valor, y que llegue a la ficha
igual(G.valorBonus_("tripulacion:t1").creditos, G.bonusTripulacion_().creditos,
      "el bonus vale lo que dice la configuración");
const ficha = () => G.tablero_(PER, true).reclutas.filter(x => x.email === "ana@alumno.es")[0];
c(ficha().creditos >= G.bonusTripulacion_().creditos,
  "y los créditos llegan de verdad a la ficha (" + ficha().creditos + ")");

// ---------------------------------------------------------------- d) se ajusta sin tocar código
G.PropertiesService.getScriptProperties().setProperty("BONUS_TRIPULACION", "0.75|40");
igual(G.bonusTripulacion_().fraccion, 0.75, "el umbral se puede subir desde el menú");
igual(G.bonusTripulacion_().creditos, 40, "y el premio también");
igual(G.valorBonus_("tripulacion:t1").creditos, 40, "🔴 el valor nuevo manda sobre el de fábrica");
// 4 reclutas · 75 % → hacen falta 3 partes, y del tema 2 solo hay uno
mandarParte("Tema 2: Ludo (LUDO)");
igual(G.otorgarBonusTripulacion_(o()), 0, "con el umbral alto, un solo parte ya no basta");
mandarParte("Tema 2: Ludo (LUDO)"); mandarParte("Tema 2: Ludo (LUDO)");
igual(G.otorgarBonusTripulacion_(o()), 4, "con tres partes de cuatro reclutas, sí");
G.PropertiesService.getScriptProperties().deleteProperty("BONUS_TRIPULACION");
igual(G.bonusTripulacion_().fraccion, 0.25, "sin ajuste guardado, vuelve al valor de fábrica");

// ---------------------------------------------------------------- e) el ojo: dos cuentas, una persona
const punto = clave => G.salud_().puntos.filter(p => p.clave === clave)[0];
igual(punto("dobles").nivel, "ok", "de momento nadie aparece dos veces");
E.enviarBitacora(G, PER, { email: "ana.ruiz@gmail.com", alias: "Ana2", nombre: "Ana  RUIZ", profe: "Mr Cuarter" });
igual(punto("dobles").nivel, "aviso", "🔴 la misma persona con dos correos se canta en ámbar");
contiene(punto("dobles").detalle, "ana@alumno.es", "diciendo cuáles son los dos correos");
contiene(punto("dobles").detalle, "ana.ruiz@gmail.com", "los dos");
contiene(punto("dobles").arreglo, "otorgar", "y cómo se arregla: pasarle los retos desde AJUSTES");
igual(G.normalizar_("Ana  RUIZ"), G.normalizar_("ana ruiz"),
      "compara sin acentos, sin mayúsculas y sin espacios de más");
igual(G.normalizar_("Álvaro Núñez"), "alvaro nunez", "con acentos también");

// ---------------------------------------------------------------- f) el ojo: partes inflados
igual(punto("partes").nivel, "ok", "con menos partes que reclutas, todo normal");
for (let i = 0; i < 9; i++) mandarParte("Tema 4: Reliae (RELIAE)");
igual(punto("partes").nivel, "aviso", "🔴 más partes que reclutas en un tema se canta");
contiene(punto("partes").detalle, "t4", "diciendo en qué tema");
contiene(punto("partes").arreglo, "inflando", "y avisando de que puede ser alguien inflando el bonus");

E.resumen("El parte de la tripulación y los dos ojos nuevos");
