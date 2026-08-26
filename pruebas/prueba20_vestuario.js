'use strict';
// 20 · EL VESTUARIO: skins que se eligen y héroes que se coleccionan
// Las 5 versiones de arte del personaje dejan de imponerse al subir de nivel: se desbloquean por
// nivel y el recluta ELIGE cuál lleva. Encima están los héroes, que salen al azar y se acumulan.
// Lo que esta batería vigila es lo que puede salir caro: que nadie se ponga algo que no tiene,
// que al subir de nivel la skin nueva se ponga SOLA (si no, se pierde el momento) y que quitarle
// a alguien un nivel no le deje puesta una skin a la que ya no llega.
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
const M = E.M;
console.log("\n▶ 20 · Vestuario: skins por nivel y héroes coleccionables");

const G = E.nuevoMundo();
const PER = E.crearPERDemo(G).id;

// ---------------------------------------------------------------- a) skins: se desbloquean por nivel
E.enviarBitacora(G, PER, { email: "nova@alumno.es", alias: "Nova", nombre: "N N", profe: "Mr Cuarter" });
let f = () => G.tablero_(PER, true).reclutas.filter(x => x.email === "nova@alumno.es")[0];

igual(f().skins, [1], "recién alistada solo tiene la skin 1");
igual(f().avatar.skin, 1, "y la lleva puesta");
igual(f().viste, "", "sin haber elegido nada");

// hasta el nivel 5 (rango 3) otorgando retos
["A1", "B1", "X1", "A2", "B2", "A3", "B3"].forEach(id =>
  G.hoja_(G.H.AJ).appendRow([new Date(), PER, "nova@alumno.es", id, "otorgar", "", "banco"]));
c(f().nivel >= 5, "con retos otorgados sube de nivel (va por el " + f().nivel + ")");
igual(f().skins, [1, 2, 3], "y se le desbloquean las skins 1, 2 y 3");
igual(f().avatar.skin, 3, "🔴 la nueva se pone SOLA: no se pierde el «he subido y he cambiado»");

// ---------------------------------------------------------------- b) elegir una skin que sí tiene
let r = G.doPost({ postData: { contents: JSON.stringify({ accion: "vestir", per: PER, email: "nova@alumno.es", viste: "skin:1" }) } });
igual(JSON.parse(r.getContent()).ok, true, "puede volver a la skin 1 aunque tenga la 3");
igual(f().avatar.skin, 1, "y el tablero la refleja");
igual(f().viste, "skin:1", "quedando anotado que la eligió a mano");

// ---------------------------------------------------------------- c) y NO una que no tiene
r = G.doPost({ postData: { contents: JSON.stringify({ accion: "vestir", per: PER, email: "nova@alumno.es", viste: "skin:5" }) } });
contiene(JSON.parse(r.getContent()).error, "no lo tienes", "🔴 no puede ponerse la skin 5 sin haber llegado");
igual(f().avatar.skin, 1, "y se queda como estaba");

r = G.doPost({ postData: { contents: JSON.stringify({ accion: "vestir", per: PER, email: "nova@alumno.es", viste: "heroe:H01_custodio" }) } });
contiene(JSON.parse(r.getContent()).error, "no lo tienes", "🔴 ni un héroe que no ha sacado");

// ---------------------------------------------------------------- d) sin PIN, a propósito
c(JSON.stringify(G.doPost({ postData: { contents: JSON.stringify({ accion: "vestir", per: PER,
    email: "nova@alumno.es", viste: "skin:2" }) } }).getContent()).indexOf("PIN") < 0,
  "vestirse NO pide PIN: el alumnado no va a recordar otra clave");
igual(f().avatar.skin, 2, "y funciona");

// ---------------------------------------------------------------- e) héroes: al azar y sin repetir
G.hoja_(G.H.AJ).appendRow([new Date(), PER, "nova@alumno.es", "EXTRA", "heroe", "H03_xeno", "banco"]);
igual(f().heroes, ["H03_xeno"], "el héroe entra en el vestuario");
r = G.doPost({ postData: { contents: JSON.stringify({ accion: "vestir", per: PER, email: "nova@alumno.es", viste: "heroe:H03_xeno" }) } });
igual(JSON.parse(r.getContent()).ok, true, "y ya puede ponérselo");
igual(f().avatar.heroe, "H03_xeno", "el tablero dice qué héroe lleva");

const sacados = {};
for (let i = 0; i < 400; i++) {
  const h = G.sortearHeroe_([]);
  sacados[h[0]] = (sacados[h[0]] || 0) + 1;
}
igual(Object.keys(sacados).length, G.HEROES.length, "en 400 tiradas salen los " + G.HEROES.length + " héroes");
const leg = G.HEROES.filter(h => h[3] === "LEGENDARIA").map(h => h[0]);
c(leg.every(k => (sacados[k] || 0) < 40), "y los LEGENDARIOS salen mucho menos que el resto");
igual(G.sortearHeroe_(G.HEROES.map(h => h[0])), null, "con el vestuario completo ya no sortea nada");

// ---------------------------------------------------------------- f) si pierde el nivel, pierde la skin
G.doPost({ postData: { contents: JSON.stringify({ accion: "vestir", per: PER, email: "nova@alumno.es", viste: "skin:3" }) } });
igual(f().avatar.skin, 3, "lleva la skin 3");
["A3", "B3", "A2", "B2", "X1", "B1"].forEach(id =>
  G.hoja_(G.H.AJ).appendRow([new Date(), PER, "nova@alumno.es", id, "anular", "", "banco"]));
c(f().skins.indexOf(3) < 0, "al anularle retos deja de tener la skin 3 (nivel " + f().nivel + ")");
igual(f().avatar.skin, f().rango, "🔴 y no se queda con una skin a la que ya no llega");

// ---------------------------------------------------------------- g) el catálogo cuadra
igual(G.HEROES.reduce((a, h) => a + h[2], 0), 100, "los pesos de los héroes suman 100");
igual(new Set(G.HEROES.map(h => h[0])).size, G.HEROES.length, "sin claves repetidas");

E.resumen("Vestuario: skins por nivel y héroes coleccionables");
