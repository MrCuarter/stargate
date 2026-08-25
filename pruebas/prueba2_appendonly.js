'use strict';
// 2 · El seguro de la Bitácora por secciones: registrarEventos_ solo AÑADE.
//     Aunque Google vacíe las casillas de una sección que no se visita, no se pierde una insignia.
const E = require("./entorno.js");
const { comprobar: c, igual } = E;
console.log("\n▶ 2 · Append-only y secciones rápidas");

const G = E.nuevoMundo();
E.crearPERDemo(G);
const PER = "prueba-banco";
const RET = G.retosDe_("REGULAR");
const et = id => RET.filter(r => r[0] === id)[0][1];
const col = t => "Tema " + t + " · Lo que he completado";

E.enviarBitacora(G, PER, { email: "dani@alumno.es", alias: "Dani", nombre: "Dani S", profe: "Mr Cuarter" });
// 1ª visita: marca el tema 1
E.enviarBitacora(G, PER, { email: "dani@alumno.es", nav: "Tema 1 · Fôrge", marcados: { [col(1)]: [et("A1"), et("B1")].join(", ") } }, 2);
let d = G.tablero_(PER, true).reclutas[0];
igual(d.xp, 100 + 100 + 250, "tras el tema 1: 450 xp");

// 2ª visita: el alumno salta DIRECTO al tema 6. Google reescribe la fila y el tema 1 llega VACÍO.
E.enviarBitacora(G, PER, { email: "dani@alumno.es", nav: "Tema 6 · Ludo",
  marcados: { [col(1)]: "", [col(6)]: [et("A6"), et("B6")].join(", ") } }, 2);
d = G.tablero_(PER, true).reclutas[0];
igual(d.xp, 100 + 100 + 250 + 100 + 250, "las insignias del tema 1 NO se pierden al saltar al 6");
c(d.insignias.indexOf("P1_bran") >= 0, "P1_bran sigue ahí aunque su casilla se vaciara");
c(d.insignias.indexOf("P6_joran") >= 0, "y se suma la del tema 6");

// 3ª visita: reenvía lo mismo -> nada se duplica
const evAntes = G.hoja_("EVENTOS").getLastRow();
E.enviarBitacora(G, PER, { email: "dani@alumno.es", marcados: { [col(6)]: [et("A6"), et("B6")].join(", ") } }, 2);
igual(G.hoja_("EVENTOS").getLastRow(), evAntes, "reenviar lo ya registrado no duplica eventos");
igual(G.tablero_(PER, true).reclutas[0].xp, 800, "ni suma xp de más");

// El avatar se CONGELA en el primer envío: editar el formulario no lo cambia
E.enviarBitacora(G, PER, { email: "dani@alumno.es", avatar: "Personaje 4 · ella (evoluciona)" }, 2);
d = G.tablero_(PER, true).reclutas[0];
igual(d.avatar.n, 1, "editar el formulario NO cambia el avatar (se congeló al alistarse)");

// ...pero un canje concedido SÍ
G.aplicarAvatar_(G.perObj_(G.perFila_(PER).v), "dani@alumno.es", "Personaje 3 · ella (evoluciona)");
igual(G.tablero_(PER, true).reclutas[0].avatar.n, 3, "un canje concedido sí cambia el avatar");

// Ajustes del profesorado: otorgar y anular
G.hoja_("AJUSTES").appendRow([new Date(), PER, "dani@alumno.es", "A2", "otorgar", "recuperada en clase", "Mr Cuarter"]);
igual(G.tablero_(PER, true).reclutas[0].xp, 900, "el profe puede otorgar un reto a mano (+100)");
G.hoja_("AJUSTES").appendRow([new Date(), PER, "dani@alumno.es", "A1", "anular", "error", "Mr Cuarter"]);
igual(G.tablero_(PER, true).reclutas[0].xp, 800, "y anularlo (-100)");

// La respuesta sin correo no rompe nada
const shB = G._maestra.getSheetByName("B · " + PER);
const fila = shB.getLastRow() + 1;
shB.getRange(fila, 1).setValue(new Date());
shB.getRange(fila, 3).setValue("Fantasma");
G.alRecibirRespuesta({ range: { getSheet: () => shB, getRow: () => fila } });
igual(G.tablero_(PER, true).reclutas.length, 1, "una respuesta sin correo se ignora sin reventar");

E.resumen("Append-only y secciones rápidas");
