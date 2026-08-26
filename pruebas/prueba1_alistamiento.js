'use strict';
// 1 · Alistamiento: identidad, docente declarado, xp/créditos, niveles, evolución y escalado PUA
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
console.log("\n▶ 1 · Alistamiento, xp/créditos y niveles");

const G = E.nuevoMundo();
E.crearPERDemo(G);
const PER = "prueba-banco";

E.enviarBitacora(G, PER, { email: "Ana@Alumno.es", alias: "Ana", nombre: "Ana Ruiz",
  profe: "Mr Cuarter", avatar: "Personaje 2 · él (evoluciona)", bitacora: "https://ana.example/eport" });
E.enviarBitacora(G, PER, { email: "bea@alumno.es", alias: "Bea", nombre: "Bea Gil", profe: "Norberto Genially" });
E.enviarBitacora(G, PER, { email: "caro@alumno.es", alias: "Caro", nombre: "Caro Paz", profe: "" });

let t = G.tablero_(PER, true);
igual(t.reclutas.length, 3, "se alistan 3 reclutas");

const ana = t.reclutas.filter(x => x.email === "ana@alumno.es")[0];
c(!!ana, "el correo se normaliza a minúsculas");
igual(ana.xp, 100, "alistarse da 100 xp (reclutamiento)");
igual(ana.creditos, 20, "alistarse da 20 créditos");
igual(ana.nivel, 1, "con 100 xp sigue en nivel 1");
igual(ana.rango_nombre, "Recluta", "rango de arte 1 = Recluta");
igual(ana.profe, "Mr Cuarter", "el tablero devuelve el docente declarado");
igual([ana.avatar.tipo, ana.avatar.n, ana.avatar.v].join("/"), "evo/2/m", "el avatar elegido se lee bien");
igual(ana.bitacora, "https://ana.example/eport", "el ePortfolio viaja en la ficha privada");
igual(t.reclutas.filter(x => x.email === "caro@alumno.es")[0].profe, "", "quien no elige docente se queda sin él");

// insignias base
c(ana.insignias.indexOf("H1_reclutamiento") >= 0, "alistarse da la insignia de reclutamiento");
c(ana.insignias.indexOf("E1_nebula") >= 0, "alistarse da la carta de NEBULA");

// --- registrar retos: xp y créditos por tipo -------------------------------------------------
const RET = G.retosDe_("REGULAR");
const etA1 = RET.filter(r => r[0] === "A1")[0][1];
const etB1 = RET.filter(r => r[0] === "B1")[0][1];
const etX1 = RET.filter(r => r[0] === "X1")[0][1];
E.enviarBitacora(G, PER, { email: "ana@alumno.es", marcados: { "Tema 1 · Lo que he completado": [etA1, etB1, etX1].join(", ") } }, 2);

t = G.tablero_(PER, true);
const ana2 = t.reclutas.filter(x => x.email === "ana@alumno.es")[0];
// A1+B1+X1 son TODOS los retos del tema 1, así que además cae el bonus de planeta completo
igual(ana2.planetas_completos, [1], "con A1+B1+X1 el planeta 1 queda completo");
igual(ana2.xp, 100 + 100 + 250 + 500 + G.BONUS_PLANETA.xp, "xp = reclutamiento + A1 + B1 + X1 + planeta completo");
igual(ana2.creditos_ganados, 20 + 20 + 50 + 100 + G.BONUS_PLANETA.creditos,
  "créditos = 20 + retoA 20 + retoB 50 + actividad 100 + el bonus del planeta");
c(ana2.bonus.indexOf("planeta:1") >= 0, "🔴 y queda ESCRITO: los bonus no se recalculan, se conceden una vez");
igual(ana2.creditos_gastados, 0, "aún no ha gastado nada");
igual(ana2.nivel, 3, ana2.xp + " xp = nivel 3");
igual(ana2.rango, 2, "nivel 3 estrena el rango de arte 2 (Cadete)");
igual(ana2.planeta, "Fôrge", "el planeta es el del último tema alcanzado");
c(ana2.insignias.indexOf("P1_bran") >= 0 && ana2.insignias.indexOf("E2_capitan") >= 0, "las insignias del reto se conceden");

// los xp NO se gastan nunca: son el viaje
igual(ana2.xp_siguiente, 1150, "el siguiente umbral es 1150");
igual(ana2.xp_faltan, 1150 - ana2.xp, "lo que falta para el nivel 4 cuadra con el umbral");

// --- derivadas ------------------------------------------------------------------------------
const todosA = RET.filter(r => r[0].charAt(0) === "A");
const porTema = {};
todosA.forEach(r => { const k = "Tema " + r[4] + " · Lo que he completado"; porTema[k] = (porTema[k] ? porTema[k] + ", " : "") + r[1]; });
E.enviarBitacora(G, PER, { email: "bea@alumno.es", marcados: porTema }, 3);
t = G.tablero_(PER, true);
const bea = t.reclutas.filter(x => x.email === "bea@alumno.es")[0];
c(bea.insignias.indexOf("H4_tripulacion-cero") >= 0, "recuperar a los 8 da la insignia derivada «Tripulación Cero»");
igual(bea.xp, 100 + 8 * 100 + 300, "la derivada suma sus 300 xp");

// --- PUA: el camino se siente igual de largo -------------------------------------------------
const G2 = E.nuevoMundo();
E.crearPERDemo(G2, { nombre: "PUA BANCO", tipo: "PUA" });
E.enviarBitacora(G2, "pua-banco", { email: "pua@alumno.es", alias: "Pua", nombre: "P U", profe: "Mr Cuarter" });
const RP = G2.retosDe_("PUA");
E.enviarBitacora(G2, "pua-banco", { email: "pua@alumno.es",
  marcados: { "Tema 1 · Lo que he completado": [RP[0][1], RP[1][1]].join(", ") } }, 2);
const tp = G2.tablero_("pua-banco", true).reclutas[0];
igual(tp.xp, 100 + 300 + 500 + G2.BONUS_PLANETA.xp, "PUA: reclutamiento + B1 + X1 + planeta completo");
igual(tp.creditos_ganados, 20 + 55 + 100 + G2.BONUS_PLANETA.creditos, "PUA: el reto B vale 55 créditos, más el bonus");
igual(G2.nivelDe_(900, "PUA"), G.nivelDe_(900 * 5000 / 4100, "REGULAR"), "los umbrales de PUA están escalados por el total del viaje");
igual(G2.desdeEfectiva_(15, "PUA"), 8, "una recompensa de la semana 15 en REGULAR abre en la 8 en PUA");

E.resumen("Alistamiento, xp/créditos y niveles");
