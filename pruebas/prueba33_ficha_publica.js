'use strict';
// 33 · LO QUE SALE (Y LO QUE NO) AL TABLERO PÚBLICO
// El tablero se incrusta en un Genially que ve toda la clase, y ahora al pulsar una fila se abre la
// ficha del recluta. Cuanto más enseña esa ficha, más importa lo que NO enseña.
// Esta batería vigila la frontera: la bio y los logros sí; el correo y el nombre real, jamás.
const E = require("./entorno.js");
const { comprobar: c, igual } = E;
console.log("\n▶ 33 · Lo que sale al tablero público");

const G = E.nuevoMundo();
const PER = E.crearPERDemo(G).id;
E.enviarBitacora(G, PER, { email: "ana.secreta@correo-privado.es", alias: "Vega",
                           nombre: "Ana Apellido Real", profe: "Mr Cuarter",
                           bio: "Piloto de reconocimiento. Colecciona todo lo que brilla." });
["A1", "B1", "X1"].forEach(id =>
  G.hoja_(G.H.AJ).appendRow([new Date(), PER, "ana.secreta@correo-privado.es", id, "otorgar", "", "banco"]));

const publico = JSON.parse(G.doGet({ parameter: { per: PER } }).getContent());
const yo = publico.reclutas.filter(x => x.alias === "Vega")[0];
c(!!yo, "el recluta sale en el tablero público");

// ---------------------------------------------------------------- lo que SÍ
igual(yo.bio, "Piloto de reconocimiento. Colecciona todo lo que brilla.",
      "la bio viaja: es lo que da vida a la ficha");
c(yo.insignias.length > 0, "y sus insignias (" + yo.insignias.length + ")");
c(yo.coleccion && yo.coleccion.pct != null, "y su porcentaje de colección");
c(yo.alias === "Vega", "y su alias, que es su nombre público");

// ---------------------------------------------------------------- lo que NO, pase lo que pase
const crudo = JSON.stringify(publico);
c(crudo.indexOf("ana.secreta@correo-privado.es") < 0,
  "🔴 el CORREO no aparece en NINGÚN sitio de lo que se publica");
c(crudo.indexOf("@") < 0 || crudo.indexOf("correo-privado") < 0,
  "🔴 ni siquiera dentro de otro campo");
c(crudo.indexOf("Apellido Real") < 0,
  "🔴 el NOMBRE REAL tampoco: el tablero lo ve toda la clase");
igual(yo.email, undefined, "la ficha del recluta no trae campo email");
igual(yo.nombre, undefined, "ni campo nombre");
igual(yo.bitacora, undefined, "ni el enlace a su ePortfolio, que lleva su nombre dentro");

// ---------------------------------------------------------------- la API privada sí, con PIN
G.PropertiesService.getScriptProperties().setProperty("PIN_PROFES", "sg2026");
const priv = G.doPost({ postData: { contents: JSON.stringify(
  { accion: "alumnos", per: PER, pin: "sg2026" }) } });
const dp = JSON.parse(priv.getContent());
c(JSON.stringify(dp).indexOf("ana.secreta@correo-privado.es") >= 0,
  "el profesorado SÍ ve el correo desde su panel (con PIN): lo necesita para corregir fichas");

E.resumen("Lo que sale al tablero público");
