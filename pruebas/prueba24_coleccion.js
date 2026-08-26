'use strict';
// 24 · EL PORCENTAJE DE COLECCIÓN (el tercer ranking)
// Mide lo que TIENES, no lo que has trabajado: cartas del álbum, héroes de la Rebelión y versiones
// de tu personaje. Es un ranking, así que dos cosas importan de verdad: que los totales salgan de
// los catálogos (el día que los héroes pasen de 10 a 30, el 100 % se recalcula y a nadie le sube el
// porcentaje sin haber conseguido nada) y que el pct NO venga redondeado, porque con 35 piezas
// redondear antes de ordenar mete empates falsos y el ranking se decide al azar.
const E = require("./entorno.js");
const { comprobar: c, igual } = E;
console.log("\n▶ 24 · El porcentaje de colección");

const G = E.nuevoMundo();
const PER = E.crearPERDemo(G).id;
E.enviarBitacora(G, PER, { email: "nova@alumno.es", alias: "Nova", nombre: "N N", profe: "Mr Cuarter" });
const f = () => G.tablero_(PER, true).reclutas.filter(x => x.email === "nova@alumno.es")[0];
const aj = (tipo, valor) => G.hoja_(G.H.AJ).appendRow([new Date(), PER, "nova@alumno.es", "EXTRA", tipo, valor, "banco"]);

// ---------------------------------------------------------------- a) de dónde salen los totales
const col = () => f().coleccion;
igual(col().cromos.total, G.CROMOS.length, "el total de cartas sale del catálogo de cromos");
igual(col().heroes.total, G.HEROES.length, "el de héroes, del catálogo de héroes");
igual(col().skins.total, G.RANGOS.length, "y el de skins, de los rangos de arte");
igual(col().total, G.CROMOS.length + G.HEROES.length + G.RANGOS.length, "y el total es la suma de los tres");

// ---------------------------------------------------------------- b) el recién alistado
igual(col().cromos.tengo, 0, "recién alistada no tiene ninguna carta");
igual(col().heroes.tengo, 0, "ni ningún héroe");
igual(col().skins.tengo, 1, "pero sí la skin 1, que se tiene desde el minuto uno");
igual(col().tengo, 1, "así que lleva 1 pieza de " + col().total);

// ---------------------------------------------------------------- c) suma lo que va cayendo
aj("cromo", G.CROMOS[0][0]); aj("cromo", G.CROMOS[1][0]); aj("cromo", G.CROMOS[0][0]);   // una repetida
igual(col().cromos.tengo, 2, "🔴 las repetidas NO suman: cuenta cartas DISTINTAS");
aj("heroe", G.HEROES[0][0]);
igual(col().heroes.tengo, 1, "el héroe sí suma");
aj("heroe", "H99_no_existe");
igual(col().heroes.tengo, 1, "🔴 y un héroe que no está en el catálogo no infla el porcentaje");

// ---------------------------------------------------------------- d) las skins suben con el nivel
const antesSkins = col().skins.tengo;
["A1","B1","X1","A2","B2","A3","B3"].forEach(id =>
  G.hoja_(G.H.AJ).appendRow([new Date(), PER, "nova@alumno.es", id, "otorgar", "", "banco"]));
c(col().skins.tengo > antesSkins, "al subir de nivel se desbloquean skins y la colección crece");
igual(col().skins.tengo, f().skins.length, "y cuadra con las skins que dice el vestuario");

// ---------------------------------------------------------------- e) el pct, sin redondear
igual(col().tengo, col().cromos.tengo + col().heroes.tengo + col().skins.tengo, "las piezas suman");
const esperado = col().tengo * 100 / col().total;
igual(col().pct, esperado, "🔴 el pct viene SIN redondear: redondear antes de ordenar mete empates falsos");
c(col().pct > 0 && col().pct < 100, "y va entre 0 y 100 (" + col().pct.toFixed(1) + " %)");

// ---------------------------------------------------------------- f) el 100 % es alcanzable
G.CROMOS.forEach(cr => aj("cromo", cr[0]));
G.HEROES.forEach(h => aj("heroe", h[0]));
G.hoja_(G.H.AJ).appendRow([new Date(), PER, "nova@alumno.es", "EXTRA", "xp", "99999", "banco"]);
const t = f();
igual(t.coleccion.cromos.tengo, G.CROMOS.length, "con todas las cartas, el álbum está lleno");
igual(t.coleccion.heroes.tengo, G.HEROES.length, "y con todos los héroes, el vestuario también");
if (t.coleccion.skins.tengo === G.RANGOS.length) {
  igual(t.coleccion.pct, 100, "🔴 quien lo tiene TODO marca 100 %, ni 99 ni 101");
} else {
  c(t.coleccion.pct < 100, "aún le faltan skins por nivel, así que todavía no llega al 100 %");
}

// ---------------------------------------------------------------- g) dos reclutas distintos, orden estable
E.enviarBitacora(G, PER, { email: "orion@alumno.es", alias: "Orion", nombre: "O O", profe: "Mr Cuarter" });
const todos = G.tablero_(PER, true).reclutas;
c(todos.every(x => x.coleccion && typeof x.coleccion.pct === "number"), "todos los reclutas traen su colección");
const nova = todos.filter(x => x.alias === "Nova")[0], orion = todos.filter(x => x.alias === "Orion")[0];
c(nova.coleccion.pct > orion.coleccion.pct, "y el que ha coleccionado va por delante del que no");

E.resumen("El porcentaje de colección");
