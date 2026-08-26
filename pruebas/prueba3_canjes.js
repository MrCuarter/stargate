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
// Los totales del viaje SALEN de los catálogos, no escritos a mano: así, el día que cambien los
// bonus o los créditos por reto, esta batería sigue diciendo la verdad en vez de romperse.
// Ojo: quien lo registra TODO de golpe tiene racha 1, así que le caen los 8 planetas pero ningún
// bonus de racha. Eso es correcto: la constancia exige semanas de verdad, no una sentada.
const bonoXP = G.BONUS_PLANETA.xp * 8;
const bonoCR = G.BONUS_PLANETA.creditos * 8;
igual(rico.creditos_ganados, 1000 + bonoCR, "el viaje completo da los 1.000 ◈ de base más los bonus");
igual(rico.xp, G.XP_VIAJE.REGULAR + bonoXP, "y los xp del viaje más el bonus de los 8 planetas");
igual(rico.nivel, 10, "🔴 y sigue siendo nivel 10: los bonus no se saltan el techo");
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
igual(G.tablero_(PER, true).reclutas[0].creditos_gastados, 60, "y no se cobra dos veces");

// --- puerta 3: saldo ---------------------------------------------------------------------------
const G3 = E.nuevoMundo();
E.crearPERDemo(G3, { nombre: "POBRE BANCO" });
E.enviarBitacora(G3, "pobre-banco", { email: "pobre@alumno.es", alias: "Pobre", nombre: "P P", profe: "Mr Cuarter" });
r = E.enviarCanje(G3, "pobre-banco", { email: "pobre@alumno.es", recompensa: E.etiqueta(G3, "Título de recluta"), titulo: "Voz de NEBULA" });
contiene(r.estado, "Denegado", "con 10 créditos no se compra un título de 25");
contiene(r.estado, "cuesta 40", "el mensaje dice cuánto cuesta");

// --- efectos automáticos ------------------------------------------------------------------------
r = E.enviarCanje(G, PER, { email: "rico@alumno.es", recompensa: E.etiqueta(G, "Título de recluta"), titulo: "Voz de NEBULA" });
igual(r.estado, "Concedido", "título concedido");
igual(G.tablero_(PER, true).reclutas[0].titulo, "Voz de NEBULA", "el título aparece en la ficha");

r = E.enviarCanje(G, PER, { email: "rico@alumno.es", recompensa: E.etiqueta(G, "Título de recluta") });
contiene(r.estado, "falta elegir el título", "sin elegir título se deniega con un mensaje claro");

r = E.enviarCanje(G, PER, { email: "rico@alumno.es", recompensa: E.etiqueta(G, "Fondo de ficha: tu planeta"), fondo: "Ludo" });
igual(G.tablero_(PER, true).reclutas[0].fondo, "Ludo", "el fondo de ficha se aplica");

// v3.16 · las tres recompensas de avatar («Cambio de avatar», «Personaje exclusivo» y «Avatar
// personal») se RETIRARON: los 7 personajes se eligen al alistarse y lo especial es el vestuario.
// Quien las canjeara con una etiqueta vieja tiene que encontrarse una negativa clara, no un cobro.
r = E.enviarCanje(G, PER, { email: "rico@alumno.es", recompensa: "Cambio de avatar — 35 créditos", avatar: "Personaje 3 · él (evoluciona)" });
contiene(r.estado, "cat\u00e1logo", "una recompensa retirada se DENIEGA, no se cobra");

// --- el vestuario: héroes al azar, acumulables, sin repetir ---------------------------------------
const antesH = G.tablero_(PER, true).reclutas[0].creditos;
r = E.enviarCanje(G, PER, { email: "rico@alumno.es", recompensa: E.etiqueta(G, "Héroe de la Rebelión") });
igual(r.estado, "Concedido", "el héroe se concede");
let fichaH = G.tablero_(PER, true).reclutas[0];
igual(fichaH.heroes.length, 1, "y entra en el vestuario");
igual(fichaH.creditos, antesH - 60, "cobrando sus 60 créditos");

// 🔴 Comprar los 30 héroes cuesta 1.800 ◈, más de lo que da el viaje entero: nadie completa el
// vestuario en un curso, y si esta prueba los comprara, el recluta se quedaría sin créditos y lo que
// fallaría después sería el canje de nota. Se le conceden por ajuste, que es gratis y es lo que se
// quiere comprobar: que con el vestuario lleno se DENIEGA en vez de cobrar.
// (Que el sorteo no repite ya lo prueba la batería 20 sobre sortearHeroe_.)
G.HEROES.forEach(h => G.hoja_(G.H.AJ).appendRow(
  [new Date(), PER, "rico@alumno.es", "EXTRA", "heroe", h[0], "prueba"]));
fichaH = G.tablero_(PER, true).reclutas[0];
igual(fichaH.heroes.length, G.HEROES.length, "con los " + G.HEROES.length + " héroes, el vestuario está lleno");
const creditosAntes = fichaH.creditos;
r = E.enviarCanje(G, PER, { email: "rico@alumno.es", recompensa: E.etiqueta(G, "Héroe de la Rebelión") });
contiene(r.estado, "vestuario entero", "con el vestuario completo se deniega en vez de cobrar");
igual(G.tablero_(PER, true).reclutas[0].creditos, creditosAntes, "🔴 y NO se le cobra: denegar nunca cuesta créditos");

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
// v3.20 · lo CONCEDIDO ya no manda correo: lo celebra la Nave con la carta en grande, y un correo
// por sobre es ruido que ademas gasta la cuota diaria.
igual(M.Correo.enviados.filter(x => String(x.para).indexOf("rico@") >= 0).length, 0,
  "🔴 un canje concedido NO manda correo al alumno: lo celebra su Nave");
// pero lo DENEGADO sí, porque no se ve en ningún otro sitio
E.enviarCanje(G, PER, { email: "rico@alumno.es", recompensa: E.etiqueta(G, "Marco dorado del avatar") });
M.Correo.limpiar();      // el marco es de una sola vez: el SIGUIENTE se deniega seguro
E.enviarCanje(G, PER, { email: "rico@alumno.es", recompensa: E.etiqueta(G, "Marco dorado del avatar") });
const denegado = M.Correo.enviados.filter(x => String(x.para).indexOf("rico@") >= 0);
igual(denegado.length, 1, "🔴 pero una DENEGACIÓN sí se cuenta: si no, el alumno escribe al profe");
contiene(denegado[0].asunto, "denegado", "y el asunto lo dice");
contiene(denegado[0].cuerpo, "No se te ha cobrado", "y deja claro que no ha perdido créditos");

E.resumen("Canjes, topes y avisos");
