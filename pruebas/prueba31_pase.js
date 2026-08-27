'use strict';
// 31 · EL PASE DE LISTA EN DIRECTO
// El docente abre una ventana de minutos desde su sala y su pantalla enseña una consigna de cuatro
// letras. Quien está en la clase la teclea en su Nave y cobra, una vez por sesión.
// Lo que vigila esta batería es lo que puede salir caro: que la consigna NO viaje hasta la Nave (si
// viajara, no haría falta estar en clase y todo esto no valdría nada), que la ventana caduque de
// verdad, y que nadie cobre dos veces la misma sesión.
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
console.log("\n▶ 31 · El pase de lista en directo");

const G = E.nuevoMundo();
const PER = E.crearPERDemo(G).id;
const o = G.perObj_(G.perFila_(PER).v);
E.enviarBitacora(G, PER, { email: "nova@alumno.es", alias: "Nova", nombre: "N N", profe: "Mr Cuarter" });
E.enviarBitacora(G, PER, { email: "orion@alumno.es", alias: "Orion", nombre: "O V", profe: "Mr Cuarter" });

const api = b => JSON.parse(G.doPost({ postData: { contents: JSON.stringify(b) } }).getContent());
const ficha = em => api({ accion: "quien", per: PER, email: em });
const creditos = em => G.tablero_(PER, true).reclutas.filter(x => x.email === em)[0].creditos;

// ---------------------------------------------------------------- a) sin ventana no se cobra
igual(ficha("nova@alumno.es").pase, null, "sin pase abierto, la Nave no enseña ningún botón");
let r = api({ accion: "pase", per: PER, email: "nova@alumno.es", palabra: "ABCD" });
igual(r.ok, false, "y no se puede cobrar a ciegas");
contiene(r.error, "no hay ningún pase", "diciéndolo claro");

// ---------------------------------------------------------------- b) el docente abre la ventana
const abierto = G.abrirPase_(o, "Mr Cuarter", 3);
c(/^[A-Z]{4}$/.test(abierto.palabra), "la consigna son cuatro letras mayúsculas (" + abierto.palabra + ")");
c(!/[IOL]/.test(abierto.palabra), "🔴 sin I, O ni L: se leen en voz alta y se confunden con 1 y 0");
c(abierto.hasta > new Date(), "y la ventana está abierta");

// ---------------------------------------------------------------- c) LA CONSIGNA NO VIAJA
const f = ficha("nova@alumno.es");
igual(f.pase.abierto, true, "la Nave sabe que hay un pase abierto");
igual(f.pase.cobrado, false, "y que aún no lo ha cobrado");
igual(JSON.stringify(f).indexOf(abierto.palabra) < 0, true,
      "🔴 LA CONSIGNA NO APARECE EN NINGÚN SITIO de lo que recibe el alumno: si viajara, sobraría ir a clase");

// ---------------------------------------------------------------- d) cobrar
const antes = creditos("nova@alumno.es");
r = api({ accion: "pase", per: PER, email: "nova@alumno.es", palabra: "ZZZZ" });
igual(r.ok, false, "una consigna equivocada no cobra");
contiene(r.error, "cuatro letras", "y explica dónde mirarla");
igual(creditos("nova@alumno.es"), antes, "sin tocarle los créditos");

r = api({ accion: "pase", per: PER, email: "nova@alumno.es", palabra: abierto.palabra.toLowerCase() });
igual(r.ok, true, "con la consigna buena, cobra");
igual(r.creditos, G.cfgPase_().creditos, "los créditos que dice la configuración");
igual(creditos("nova@alumno.es"), antes + G.cfgPase_().creditos, "y llegan a la ficha");
igual(ficha("nova@alumno.es").pase.cobrado, true, "la Nave ya sabe que lo cobró");

r = api({ accion: "pase", per: PER, email: "nova@alumno.es", palabra: abierto.palabra });
igual(r.yaEstaba, true, "🔴 repetir no vuelve a pagar");
igual(creditos("nova@alumno.es"), antes + G.cfgPase_().creditos, "los créditos siguen igual");

// quien no estaba no cobra por su cuenta (tiene lo del alistamiento, no lo del pase)
const orionAntes = creditos("orion@alumno.es");
api({ accion: "pase", per: PER, email: "nova@alumno.es", palabra: abierto.palabra });
igual(creditos("orion@alumno.es"), orionAntes, "quien no ha tecleado la consigna no cobra nada");

// ---------------------------------------------------------------- e) la ventana caduca
const aj = G.hoja_(G.H.AJ);
const filas = aj.getDataRange().getValues();
for (let i = filas.length; i >= 2; i--) {
  if (String(filas[i - 1][4]) === "pase") {
    const p = String(filas[i - 1][5]).split("|");
    aj.getRange(i, 6).setValue(p[0] + "|" + E.haceSemanas(1).toISOString() + "|" + p[2]);
    break;
  }
}
igual(G.paseActivo_(PER), null, "🔴 pasada la hora, la ventana deja de estar abierta");
igual(ficha("orion@alumno.es").pase, null, "y la Nave deja de enseñar el botón");
r = api({ accion: "pase", per: PER, email: "orion@alumno.es", palabra: abierto.palabra });
igual(r.ok, false, "y ya no se puede cobrar con la consigna de antes");

// ---------------------------------------------------------------- f) una sesión nueva se cobra aparte
const segundo = G.abrirPase_(o, "Mr Cuarter", 3);
c(segundo.id !== abierto.id, "cada apertura es una sesión distinta");
igual(ficha("nova@alumno.es").pase.cobrado, false, "🔴 lo cobrado ayer no cuenta para la sesión de hoy");
r = api({ accion: "pase", per: PER, email: "nova@alumno.es", palabra: segundo.palabra });
igual(r.ok, true, "y se puede volver a cobrar");
igual(creditos("nova@alumno.es"), antes + 2 * G.cfgPase_().creditos, "van dos sesiones");

// ---------------------------------------------------------------- g) la traza del docente
// 🔬 Esto es lo que convierte una mecánica de juego en un dato de investigación: cuándo y cuántas
// veces abrió la ventana cada docente, y en qué momento del curso dejó de hacerlo.
const aperturas = G.hoja_(G.H.AJ).getDataRange().getValues().slice(1).filter(v => String(v[4]) === "pase");
igual(aperturas.length, 2, "cada apertura deja su fila");
igual(String(aperturas[0][6]), "Mr Cuarter", "🔬 con el nombre de quien la abrió");
c(aperturas[0][0] instanceof Date, "y con su hora");
igual(String(aperturas[0][2]), "", "sin correo: la ventana es del grupo, no de nadie");

// ---------------------------------------------------------------- h) se ajusta sin tocar código
G.PropertiesService.getScriptProperties().setProperty("BONUS_PASE", "12|7");
igual(G.cfgPase_().creditos, 12, "los créditos se cambian desde el menú");
igual(G.cfgPase_().minutos, 7, "y los minutos");
igual(G.valorBonus_("pase:20260101-1000").creditos, 12, "🔴 y el valor nuevo manda sobre el de fábrica");
G.PropertiesService.getScriptProperties().deleteProperty("BONUS_PASE");
igual(G.cfgPase_().creditos, G.BONUS_PASE.creditos, "sin ajuste guardado, vuelve al de fábrica");

E.resumen("El pase de lista en directo");
