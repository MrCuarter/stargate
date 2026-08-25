'use strict';
// 3 · El circuito del canje: catálogo, calendario, tope por alumno, saldo, efectos automáticos
//     y el aviso al docente cuando hace falta una persona.
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
const M = E.M;
console.log("\n▶ 3 · Canjes, topes y avisos");

const G = E.nuevoMundo();
E.crearPERDemo(G);
const PER = "prueba-banco";
const RET = G.retosDe_("REGULAR");
const col = t => "Tema " + t + " · Lo que he completado";

// Un recluta con MUCHOS créditos: se lo lleva todo (590 ◈ el viaje completo)
const todo = {};
RET.forEach(r => { const k = col(r[4] > 8 ? 9 : r[4]); const kk = r[4] > 8 ? "Batalla final" : k;
  todo[kk] = (todo[kk] ? todo[kk] + ", " : "") + r[1]; });
E.enviarBitacora(G, PER, { email: "rico@alumno.es", alias: "Rico", nombre: "Rico R", profe: "Mr Cuarter" });
E.enviarBitacora(G, PER, { email: "rico@alumno.es", marcados: todo }, 2);
let rico = G.tablero_(PER, true).reclutas[0];
igual(rico.creditos_ganados, 590, "el viaje completo da 590 créditos");
igual(rico.xp, 5000, "y 5000 xp: nivel 10");
igual(rico.nivel, 10, "nivel 10");
igual(rico.rango_nombre, "Leyenda", "rango de arte 5 = Leyenda");

M.Correo.limpiar();

// --- puerta 0: recompensa que no está en el catálogo ------------------------------------------
let r = E.enviarCanje(G, PER, { email: "rico@alumno.es", recompensa: "Nave espacial propia — 10 créditos" });
contiene(r.estado, "Denegado", "una recompensa inexistente se DENIEGA");
contiene(r.estado, "catálogo", "y lo dice: ya no está en el catálogo");
igual(G.tablero_(PER, true).reclutas[0].creditos_gastados, 0, "no se cobra nada por una recompensa inexistente");
igual(M.Correo.paraQuien("mrcuarter@gmail.com").length, 0, "y NO se molesta al docente");

// --- puerta 1: calendario ---------------------------------------------------------------------
// El PER empezó hace 15 semanas: todo está abierto. Probamos con un PER recién empezado.
const G2 = E.nuevoMundo();
E.crearPERDemo(G2, { nombre: "NUEVO BANCO", inicio: E.iso(E.haceSemanas(0)) });
E.enviarBitacora(G2, "nuevo-banco", { email: "nov@alumno.es", alias: "Nov", nombre: "N N", profe: "Mr Cuarter" });
G2.hoja_("EVENTOS").appendRow([new Date(), "nuevo-banco", "nov@alumno.es", "Nov", "X1", "regalo", 1, 500, "formulario"]);
const rr = E.enviarCanje(G2, "nuevo-banco", { email: "nov@alumno.es", recompensa: E.etiqueta(G2, "Marco dorado del avatar") });
contiene(rr.estado, "bloqueada hasta la semana 6", "en la semana 1 el marco dorado está bloqueado");

// --- puerta 2: tope por alumno -----------------------------------------------------------------
r = E.enviarCanje(G, PER, { email: "rico@alumno.es", recompensa: E.etiqueta(G, "Marco dorado del avatar") });
igual(r.estado, "Concedido", "el marco dorado se concede la primera vez");
igual(G.tablero_(PER, true).reclutas[0].marco, "oro", "y se aplica solo");
r = E.enviarCanje(G, PER, { email: "rico@alumno.es", recompensa: E.etiqueta(G, "Marco dorado del avatar") });
contiene(r.estado, "máximo", "la segunda vez se DENIEGA por tope (máx. 1)");
igual(G.tablero_(PER, true).reclutas[0].creditos_gastados, 35, "y no se cobra dos veces");

// --- puerta 3: saldo ---------------------------------------------------------------------------
const G3 = E.nuevoMundo();
E.crearPERDemo(G3, { nombre: "POBRE BANCO" });
E.enviarBitacora(G3, "pobre-banco", { email: "pobre@alumno.es", alias: "Pobre", nombre: "P P", profe: "Mr Cuarter" });
r = E.enviarCanje(G3, "pobre-banco", { email: "pobre@alumno.es", recompensa: E.etiqueta(G3, "Título de recluta"), titulo: "Voz de NEBULA" });
contiene(r.estado, "Denegado", "con 10 créditos no se compra un título de 25");
contiene(r.estado, "cuesta 25", "el mensaje dice cuánto cuesta");

// --- efectos automáticos ------------------------------------------------------------------------
r = E.enviarCanje(G, PER, { email: "rico@alumno.es", recompensa: E.etiqueta(G, "Título de recluta"), titulo: "Voz de NEBULA" });
igual(r.estado, "Concedido", "título concedido");
igual(G.tablero_(PER, true).reclutas[0].titulo, "Voz de NEBULA", "el título aparece en la ficha");

r = E.enviarCanje(G, PER, { email: "rico@alumno.es", recompensa: E.etiqueta(G, "Título de recluta") });
contiene(r.estado, "falta elegir el título", "sin elegir título se deniega con un mensaje claro");

r = E.enviarCanje(G, PER, { email: "rico@alumno.es", recompensa: E.etiqueta(G, "Fondo de ficha: tu planeta"), fondo: "Ludo" });
igual(G.tablero_(PER, true).reclutas[0].fondo, "Ludo", "el fondo de ficha se aplica");

r = E.enviarCanje(G, PER, { email: "rico@alumno.es", recompensa: E.etiqueta(G, "Cambio de avatar"), avatar: "Personaje 6 · ella (evoluciona)" });
contiene(r.estado, "exclusivo", "«Cambio de avatar» rechaza un personaje EXCLUSIVO");
r = E.enviarCanje(G, PER, { email: "rico@alumno.es", recompensa: E.etiqueta(G, "Cambio de avatar"), avatar: "Personaje 3 · él (evoluciona)" });
igual(G.tablero_(PER, true).reclutas[0].avatar.n, 3, "y sí acepta uno inicial");

r = E.enviarCanje(G, PER, { email: "rico@alumno.es", recompensa: E.etiqueta(G, "Personaje exclusivo"), exclusivo: "Personaje 6 · ella (evoluciona)" });
igual(G.tablero_(PER, true).reclutas[0].avatar.n, 6, "«Personaje exclusivo» sí desbloquea el 5-7");

r = E.enviarCanje(G, PER, { email: "rico@alumno.es", recompensa: E.etiqueta(G, "Avatar personal (tu propia imagen)"), url: "no-es-una-url" });
contiene(r.estado, "falta la URL", "una URL inválida se deniega");

// --- recompensa de nota: AQUÍ sí se avisa a una persona -------------------------------------------
M.Correo.limpiar();
r = E.enviarCanje(G, PER, { email: "rico@alumno.es", recompensa: E.etiqueta(G, "Subir 0,5 en un entregable"),
  actividad: "Actividad 1 · imagen con IA" });
igual(r.estado, "Concedido", "el canje de nota se concede");
const avisos = M.Correo.enviados.filter(x => x.asunto.indexOf("te toca a ti") >= 0);
igual(avisos.length, 1, "se manda UN aviso al profesorado");
contiene(avisos[0].para, "mrcuarter@gmail.com", "al docente que el alumno declaró");
contiene(avisos[0].para, "n.cuartero.10@gmail.com", "y siempre al referente");
c(avisos[0].para.indexOf("norberto@genially.com") < 0, "pero NO al docente que no es suyo");
contiene(avisos[0].cuerpo, "Actividad 1", "el aviso dice a qué actividad se aplica");
contiene(avisos[0].cuerpo, "clase.html", "y enlaza a su sala de clase");

// de los canjes automáticos NO se avisa al profe
M.Correo.limpiar();
E.enviarCanje(G, PER, { email: "rico@alumno.es", recompensa: E.etiqueta(G, "Sobre de cromos") });
igual(M.Correo.enviados.filter(x => x.asunto.indexOf("te toca a ti") >= 0).length, 0, "de un sobre de cromos no se molesta al docente");
igual(M.Correo.enviados.filter(x => String(x.para).indexOf("rico@") >= 0).length, 1, "pero el alumno sí recibe su correo");

E.resumen("Canjes, topes y avisos");
