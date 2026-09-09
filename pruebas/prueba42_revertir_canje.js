'use strict';
// 42 · REVERTIR UN CANJE
// Lo pidio Norberto el 9-sep probando en vivo: en la ficha del alumno, deshacer un canje y
// devolverle los creditos. Se equivocan de opcion, o algo se cobra dos veces.
// Lo que vigila esta bateria es que revertir NO sea un apaño: que el dinero vuelva de verdad, que
// la recompensa se retire (si no, se quedaria con el heroe y con el dinero), que revertir dos
// veces no le pague dos veces, y que quede traza de quien lo hizo.
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
console.log("\n▶ 42 · Revertir un canje");

const G = E.nuevoMundo();
E.crearPERDemo(G);
// el PIN del profesorado: revertir es accion de docente, asi que la puerta lo pide
const PIN = "0000";
G.PropertiesService.getScriptProperties().setProperty("PIN_PROFES", PIN);
const PER = "prueba-banco";
const RET = G.retosDe_("REGULAR");

E.enviarBitacora(G, PER, { email: "rico@alumno.es", alias: "Rico", nombre: "Rico R", profe: "Mr Cuarter" });
E.enviarBitacora(G, PER, { email: "rico@alumno.es", marcados: E.marcar(G, RET) }, 2);

const ficha = () => G.tablero_(PER, true).reclutas.filter(x => x.email === "rico@alumno.es")[0];
const api = b => JSON.parse(G.doPost({ postData: { contents: JSON.stringify(b) } }).getContent());
const o = G.perObj_(G.perFila_(PER).v);

const antesCred = ficha().creditos;
const antesHer  = ficha().n_heroes;

// ---------------------------------------------------------------- a) se canjea de verdad
const r0 = E.enviarCanje(G, PER, { email: "rico@alumno.es", recompensa: "Héroe de la Rebelión — 60 créditos" });
contiene(r0.estado, "Concedido", "el canje se concede");
const conCred = ficha().creditos;
c(conCred < antesCred, "y le ha costado dinero (" + antesCred + " → " + conCred + ")");
igual(ficha().n_heroes, antesHer + 1, "y se lleva su héroe");
const gastado = ficha().creditos_gastados;
c(gastado > 0, "queda apuntado como gastado (" + gastado + " ◈)");

// la fila del canje, que es lo que la ficha del docente manda para revertir
const shC = G._maestra.getSheetByName(o.tabC);
const filaCanje = shC.getLastRow();

// ---------------------------------------------------------------- b) revertir devuelve el dinero
const rv = api({ accion: "canje_revertir", per: PER, fila: filaCanje, profe: "Mr Cuarter",
                 pin: PIN });
igual(rv.ok, true, "revertir responde que sí");
contiene(rv.estado, "Revertido", "y el estado de la fila lo dice");
contiene(rv.estado, "Mr Cuarter", "🔬 con el nombre de quien lo revirtió");
igual(ficha().creditos, antesCred, "🔴 los créditos VUELVEN enteros: " + antesCred);
igual(ficha().creditos_gastados, gastado - 60, "y deja de contar como gastado");

// ---------------------------------------------------------------- c) y RETIRA la recompensa
// Si no, se quedaba con el heroe y con el dinero: revertir seria un regalo.
igual(ficha().n_heroes, antesHer, "🔴 el héroe se retira: no se queda con el premio Y con el dinero");

// ---------------------------------------------------------------- d) revertir dos veces no paga dos veces
const rv2 = api({ accion: "canje_revertir", per: PER, fila: filaCanje, profe: "Mr Cuarter",
                  pin: PIN });
igual(rv2.yaEstaba, true, "🔴 al repetir avisa de que ya estaba revertido");
igual(ficha().creditos, antesCred, "y los créditos NO suben otra vez");

// ---------------------------------------------------------------- e) la fila sigue ahí (append-only)
igual(shC.getLastRow(), filaCanje, "🔴 la fila NO se borra: queda para poder auditarla");

// ---------------------------------------------------------------- f) la traza en AJUSTES
const traza = G.hoja_(G.H.AJ).getDataRange().getValues().slice(1)
  .filter(v => String(v[4]) === "canje_revertido");
igual(traza.length, 1, "🔬 la reversión deja UNA fila en AJUSTES");
igual(String(traza[0][2]), "rico@alumno.es", "con el correo de quien lo tenía");
contiene(String(traza[0][5]), "Héroe", "y qué se le quitó");
igual(String(traza[0][6]), "Mr Cuarter", "y quién lo hizo");

// ---------------------------------------------------------------- g) filas imposibles
let err = "";
try { api({ accion: "canje_revertir", per: PER, fila: 1, profe: "Mr Cuarter",
            pin: PIN }); }
catch (e) { err = String(e); }
const r1 = api({ accion: "canje_revertir", per: PER, fila: 1, profe: "Mr Cuarter",
                 pin: PIN });
c(!!(r1.error || err), "la cabecera (fila 1) no se puede revertir");
const r9 = api({ accion: "canje_revertir", per: PER, fila: 9999, profe: "Mr Cuarter",
                 pin: PIN });
c(!!r9.error, "ni una fila que no existe");
contiene(String(r9.error), "recarga", "y le dice al docente que recargue");

// ---------------------------------------------------------------- h) se puede volver a canjear
const r3 = E.enviarCanje(G, PER, { email: "rico@alumno.es", recompensa: "Héroe de la Rebelión — 60 créditos" });
contiene(r3.estado, "Concedido", "🔴 tras revertir, puede volver a canjearlo (no se queda bloqueado)");

// ---------------------------------------------------------------- i) LOS SORTEOS NO SE REVIERTEN
// Un sobre ya repartido: devolverlo dejaria sortear otra vez hasta que salga la carta buena.
// Eso es dinero infinito disfrazado de arreglo, asi que se rechaza a proposito.
const antesSobre = ficha().creditos;
E.enviarCanje(G, PER, { email: "rico@alumno.es", recompensa: "Sobre de cromos — 15 créditos" });
const filaSobre = shC.getLastRow();
const rs = api({ accion: "canje_revertir", per: PER, fila: filaSobre, profe: "Mr Cuarter", pin: PIN });
igual(rs.ok, undefined, "🔴 un sobre de cromos NO se puede revertir");
contiene(rs.error, "sortear otra vez", "y explica por qué: se podría repetir hasta que salga la buena");
contiene(rs.error, "compénsalo", "y qué hacer en su lugar");
c(ficha().creditos < antesSobre, "el sobre sigue cobrado: nada a medias");
igual(String(shC.getRange(filaSobre, 8).getValue()).indexOf("Concedido"), 0,
      "🔴 y la fila sigue CONCEDIDA: el rechazo no deja el canje en un estado raro");

// ---------------------------------------------------------------- j) una recompensa de NOTA
// No tiene efecto automatico que deshacer —la subida la aplica una persona— asi que solo vuelve
// el dinero, y la respuesta lo dice para que el docente no se olvide de deshacerla donde la puso.
const rico2 = "rico@alumno.es";
const antesNota = ficha().creditos;
E.enviarCanje(G, PER, { email: rico2, recompensa: "Subir 0,5 en un entregable — 320 créditos", actividad: "Actividad 1" });
const filaNota = shC.getLastRow();
c(ficha().creditos < antesNota, "la subida de nota se cobra");
const rn = api({ accion: "canje_revertir", per: PER, fila: filaNota, profe: "Mr Cuarter", pin: PIN });
igual(rn.ok, true, "y se puede revertir");
igual(ficha().creditos, antesNota, "🔴 el dinero vuelve entero");
contiene(rn.nota, "deshacer", "🔴 pero avisa de que la nota la tiene que deshacer una persona");

E.resumen("Revertir un canje");
