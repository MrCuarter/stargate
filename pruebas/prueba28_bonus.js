'use strict';
// 28 · LOS BONUS: planeta completo y racha
// Premian dos cosas distintas: terminar un planeta (has producido) y la constancia (has vuelto).
// 🔴 Lo que de verdad vigila esta batería es que se concedan UNA VEZ y queden ESCRITOS. La racha
// BAJA cuando se falla una semana: si el bonus se recalculara, quien llegó a 6 y luego falló
// perdería créditos que quizá ya se gastó, y el saldo se iría a negativo. Lo ganado, ganado.
const E = require("./entorno.js");
const { comprobar: c, igual } = E;
console.log("\n▶ 28 · Los bonus: planeta completo y racha");

const G = E.nuevoMundo();
const PER = E.crearPERDemo(G).id;
const RET = G.retosDe_("REGULAR");
const et = id => RET.filter(r => r[0] === id)[0][1];
const f = () => G.tablero_(PER, true).reclutas.filter(x => x.email === "nova@alumno.es")[0];
const bonusEscritos = () => G.hoja_(G.H.AJ).getDataRange().getValues().filter(r => r[4] === "bonus");

E.enviarBitacora(G, PER, { email: "nova@alumno.es", alias: "Nova", nombre: "N N", profe: "Mr Cuarter" });

// ---------------------------------------------------------------- a) medio planeta no cuenta
E.enviarBitacora(G, PER, { email: "nova@alumno.es", marcados: E.marcar(G, [et("A1")]) }, 2);
igual(f().planetas_completos, [], "con un solo reto del tema, el planeta no está completo");
igual(f().bonus, [], "y no hay bonus");

// ---------------------------------------------------------------- b) el planeta entero sí
const base = f().xp, baseCr = f().creditos_ganados;
E.enviarBitacora(G, PER, { email: "nova@alumno.es",
  marcados: E.marcar(G, [et("A0"), et("A1"), et("B1"), et("X1")]) }, 2);
const tras = f();
igual(tras.planetas_completos, [1], "con los CUATRO retos del tema 1 (A0 incluido), el planeta está completo");
c(tras.bonus.indexOf("planeta:1") >= 0, "🔴 y el bonus queda ESCRITO, no calculado al vuelo");
igual(tras.xp - base, 100 + 250 + 500 + G.BONUS_PLANETA.xp, "suma los xp de los retos MÁS los del planeta");
igual(tras.creditos_ganados - baseCr, 20 + 50 + 100 + G.BONUS_PLANETA.creditos, "y sus créditos");

// ---------------------------------------------------------------- c) una vez, y solo una
const escritos = bonusEscritos().length;
E.enviarBitacora(G, PER, { email: "nova@alumno.es",
  marcados: E.marcar(G, [et("A0"), et("A1"), et("B1"), et("X1")]) }, 2);
igual(bonusEscritos().length, escritos, "🔴 reenviar lo mismo NO vuelve a conceder el bonus");
igual(f().xp, tras.xp, "ni suma xp de más");

// ---------------------------------------------------------------- d) la racha, con semanas de verdad
const G2 = E.nuevoMundo();
const P2 = E.crearPERDemo(G2).id;
E.enviarBitacora(G2, P2, { email: "orion@alumno.es", alias: "Orion", nombre: "O O", profe: "Mr Cuarter" });
const g = () => G2.tablero_(P2, true).reclutas.filter(x => x.email === "orion@alumno.es")[0];
igual(g().bonus.filter(b => b.indexOf("racha:") === 0), [], "recién alistado no tiene bonus de racha");

// tres semanas seguidas registrando algo, escritas con sus fechas
const R2 = G2.retosDe_("REGULAR");
const hace = d => { const x = new Date(); x.setDate(x.getDate() - d); return x; };
[15, 8, 1].forEach((d, i) => G2.hoja_(G2.H.EV).appendRow(
  [hace(d), P2, "orion@alumno.es", "Orion", R2[i][0], R2[i][1], R2[i][4], R2[i][3], "formulario", ""]));
c(g().racha >= 3, "lleva " + g().racha + " semanas seguidas");
// el bonus se concede al REGISTRAR, así que hace falta un envío que lo dispare
E.enviarBitacora(G2, P2, { email: "orion@alumno.es", marcados: E.marcar(G2, [et("A8")]) }, 2);
const conRacha = g();
c(conRacha.bonus.indexOf("racha:3") >= 0, "🔴 al llegar a 3 semanas se concede el bonus de racha");
igual(conRacha.bonus.filter(b => b === "racha:6").length, 0, "pero no el de 6, que aún no ha llegado");

// ---------------------------------------------------------------- e) el bonus vale por lo ESCRITO
// Un recluta con racha 1 al que se le concedió el bonus lo conserva. Es la propiedad que importa:
// el saldo sale de lo concedido, no de recalcular la racha de hoy. Si se recalculara, quien llegó a
// 6 semanas y luego falló perdería créditos que quizá ya se gastó, y el saldo se iría a negativo.
E.enviarBitacora(G2, P2, { email: "vega@alumno.es", alias: "Vega", nombre: "V V", profe: "Mr Cuarter" });
const v2 = () => G2.tablero_(P2, true).reclutas.filter(x => x.email === "vega@alumno.es")[0];
const credAntes = v2().creditos_ganados;
igual(v2().racha <= 1, true, "Vega acaba de llegar: racha de " + v2().racha);
G2.hoja_(G2.H.AJ).appendRow([new Date(), P2, "vega@alumno.es", "EXTRA", "bonus", "racha:6", "sistema"]);
const conBono = v2();
c(conBono.racha < 6, "🔴 su racha de HOY no llega a 6");
c(conBono.bonus.indexOf("racha:6") >= 0, "pero el bonus está escrito");
igual(conBono.creditos_ganados - credAntes, G2.BONUS_RACHA.filter(b => b[0] === 6)[0][1],
  "🔴 y se le cuentan sus créditos igualmente: vale lo concedido, no lo recalculado");
igual(conBono.xp, v2().xp, "sin tocar los xp");

// ---------------------------------------------------------------- f) las rachas no dan xp
G2.BONUS_RACHA.forEach(b => igual(G2.valorBonus_("racha:" + b[0]).xp, 0,
  "🔴 la racha de " + b[0] + " semanas NO da xp: la constancia no debe mover el nivel ni los rankings"));
c(G2.valorBonus_("planeta:3").xp > 0, "el planeta sí da xp: ahí has producido algo");

// ---------------------------------------------------------------- g) el Capitán paga el tutorial
// Se pide desde la Nave, sin PIN (el alumnado no tiene clave). Por eso lo importante es que se
// conceda UNA VEZ: si no, repetir el tutorial sería una máquina de créditos.
const pide = mail => JSON.parse(G.doPost({ postData: { contents: JSON.stringify(
  { accion: "tutorial", per: PER, email: mail }) } }).getContent());
const antesT = f().creditos_ganados;
let rt = pide("nova@alumno.es");
igual(rt.ok, true, "el Capitán paga al terminar el tutorial");
igual(rt.creditos, G.BONUS_TUTORIAL.creditos, "y dice cuánto: " + G.BONUS_TUTORIAL.creditos + " ◈");
igual(f().creditos_ganados - antesT, G.BONUS_TUTORIAL.creditos, "que llegan al saldo");
igual(f().xp, tras.xp, "🔴 sin xp: has escuchado, no has producido");

rt = pide("nova@alumno.es");
igual(rt.yaEstaba, true, "🔴 repetir el tutorial NO vuelve a pagar");
igual(f().creditos_ganados - antesT, G.BONUS_TUTORIAL.creditos, "el saldo no se mueve");

let err = "";
try { pide("nadie@alumno.es"); } catch (e) { err = String(e.message || e); }
c(err.indexOf("encuentro") >= 0 || JSON.stringify(pide("nadie@alumno.es")).indexOf("error") >= 0,
  "y a quien no está en el grupo no se le paga");

// 30 ◈ son DOS sobres exactos: se acaba el tutorial y se puede ir a abrir el álbum que acaba de explicar
const sobre = G.recompensasCat_().filter(x => x.tipo === "cromo")[0];
igual(G.BONUS_TUTORIAL.creditos, sobre.coste * 2, "🔴 el pago del tutorial son DOS sobres justos (" + sobre.coste + " ◈ cada uno)");

// ---------------------------------------------------------------- h) la FICHA del alumno lo trae
// 🔴 Pasó en vivo: doGet (el tablero público) devolvía los bonus, pero «quien» —la ficha que pide la
// Nave— no. Resultado: la celebración no se enteraba de los planetas ni de las rachas, y nadie lo
// vio porque ninguna batería comparaba las dos salidas. Son dos caminos al MISMO dato: si uno crece,
// el otro tiene que crecer.
const ficha = JSON.parse(G.doPost({ postData: { contents: JSON.stringify(
  { accion: "quien", per: PER, email: "nova@alumno.es" }) } }).getContent()).yo;
const delTablero = f();
["bonus", "planetas_completos", "coleccion", "heroes", "skins", "cromos", "insignias", "nivel", "racha", "xp7"]
  .forEach(k => c(ficha[k] !== undefined, "«quien» devuelve «" + k + "», que la Nave necesita para pintar y celebrar"));
igual(ficha.bonus, delTablero.bonus, "🔴 y los bonus coinciden con los del tablero: es el mismo dato");
igual(ficha.planetas_completos, delTablero.planetas_completos, "y los planetas completos también");
igual(ficha.coleccion.pct, delTablero.coleccion.pct, "y el porcentaje de colección");

// ---------------------------------------------------------------- i) completar colecciones
// Mueve el motor: gastas créditos en sobres y parte vuelve. 🔴 Lo que se vigila aquí es que las
// series NO den xp: los xp son el viaje y mueven el nivel y el ranking principal, y pagarlos por
// comprar sobres dejaría escalar a quien tiene créditos en vez de a quien ha trabajado.
igual(G.valorBonus_("serie:" + G.SERIES_ALBUM[0][0]).xp, 0, "🔴 completar una serie NO da xp");
c(G.valorBonus_("serie:" + G.SERIES_ALBUM[0][0]).creditos > 0, "pero sí créditos: para seguir comprando sobres");
c(G.valorBonus_("album").xp > 0, "el álbum ENTERO sí da xp: eso ya es una gesta");
c(G.valorBonus_("album").creditos > 0, "y créditos");

// una serie entera, carta a carta
const G3 = E.nuevoMundo();
const P3 = E.crearPERDemo(G3).id;
E.enviarBitacora(G3, P3, { email: "coli@alumno.es", alias: "Coli", nombre: "C C", profe: "Mr Cuarter" });
const h = () => G3.tablero_(P3, true).reclutas.filter(x => x.email === "coli@alumno.es")[0];
const serie1 = G3.SERIES_ALBUM[0];
const suyas = G3.CROMOS.filter(cr => cr[4] === serie1[1]);
suyas.slice(0, suyas.length - 1).forEach(cr =>
  G3.hoja_(G3.H.AJ).appendRow([new Date(), P3, "coli@alumno.es", "EXTRA", "cromo", cr[0], "banco"]));
igual(h().bonus.filter(b => b.indexOf("serie:") === 0), [], "a falta de una carta, la serie no está completa");
const antesCr = h().creditos_ganados;
// la última cae por la vía real: un canje de sobre. Se fuerza el sorteo a esa carta.
const sortear = G3.sortearCromo_;
G3.sortearCromo_ = () => suyas[suyas.length - 1];
E.enviarCanje(G3, P3, { email: "coli@alumno.es", recompensa: E.etiqueta(G3, "Sobre de cromos") });
G3.sortearCromo_ = sortear;
const cerrada = h();
c(cerrada.bonus.indexOf("serie:" + serie1[0]) >= 0, "🔴 al caer la última carta se concede el bonus de la serie");
igual(cerrada.creditos_ganados - antesCr, G3.BONUS_SERIE.creditos, "y son los créditos del catálogo");
igual(cerrada.xp, h().xp, "sin tocar los xp");

// y no se concede dos veces
const bonosAntes = cerrada.bonus.length;
G3.otorgarBonusColeccion_(G3.perObj_(G3.perFila_(P3).v), "coli@alumno.es");
igual(h().bonus.length, bonosAntes, "🔴 mirar otra vez no vuelve a conceder nada");

E.resumen("Los bonus");
