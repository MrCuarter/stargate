'use strict';
// 37 · EL ARCHIVO, LA FICHA DE ALUMNADO, EL RESETEO SIN RESIDUOS Y EL COLOR
//   (las cuatro peticiones de Norberto del 29-ago, saliendo de la prueba manual)
//
// El problema de fondo era el mismo en las cuatro: la hoja maestra acumulaba para siempre. EVENTOS y
// AJUSTES mezclaban cursos viejos con vivos, «Resetear» dejaba atrás pestañas enteras, no había
// ningún sitio donde ver a las personas con su nombre, y todo era del mismo color.
//
// 🔴 Lo que más fácil se rompe de todo esto: al MOVER los registros de un grupo archivado, su tablero
// histórico —el que abre el enlace directo, que la propia función de archivar promete que sigue
// funcionando— se quedaría vacío si alguien leyera EVENTOS sin pasar por registros_(). El apartado
// (a) lo comprueba comparando el tablero ANTES y DESPUÉS de archivar, xp a xp.
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
const M = E.M;
console.log("\n▶ 37 · El archivo, ALUMNADO, el reseteo sin residuos y el color");

const A = "grupo-a", B = "grupo-b";

function mundo() {
  const G = E.nuevoMundo();
  E.crearPERDemo(G, { nombre: "GRUPO A" });
  E.crearPERDemo(G, { nombre: "GRUPO B" });
  E.reclutaRico(G, A, "ana@alumno.es");                                   // viaje completo: da para canjear
  E.enviarBitacora(G, A, { email: "leo@alumno.es", alias: "Leo", nombre: "Leo Lomas", profe: "Mr Cuarter" });
  E.enviarBitacora(G, B, { email: "noa@alumno.es", alias: "Noa", nombre: "Noa Nieto", profe: "Mr Cuarter" });
  return G;
}
const filasDe = (G, hoja, per) => G.hoja_(hoja).getDataRange().getValues().slice(1).filter(v => v[1] === per).length;
// La foto del tablero que tiene que sobrevivir al archivado: quién está y con cuánto.
const foto = (G, per) => (G.tablero_(per, true).reclutas || [])
  .map(r => [r.email, r.xp, r.n, r.creditos].join("|")).sort();

// ================================================================ a) ARCHIVAR MUEVE, NO BORRA
let G = mundo();
const evAntes = filasDe(G, G.H.EV, A), ajAntes = filasDe(G, G.H.AJ, A);
const evOtro = filasDe(G, G.H.EV, B);
c(evAntes > 0 && ajAntes > 0, "el grupo A parte con registros en EVENTOS y en AJUSTES");
const fotoAntes = foto(G, A);

const movidas = G.setArchivado_(A, true);

igual(filasDe(G, G.H.EV, A), 0, "🔴 al archivar, EVENTOS se queda sin una sola fila del grupo");
igual(filasDe(G, G.H.AJ, A), 0, "y AJUSTES tampoco conserva ninguna");
igual(filasDe(G, G.H.EVA, A), evAntes, "están TODAS en EVENTOS ARCHIVADOS: se mudan, no se borran");
igual(filasDe(G, G.H.AJA, A), ajAntes, "y las de AJUSTES, en AJUSTES ARCHIVADOS");
igual(movidas, evAntes + ajAntes, "y se dice cuántas se movieron");
igual(filasDe(G, G.H.EV, B), evOtro, "🔴 al otro grupo no se le toca ni una fila");

igual(foto(G, A), fotoAntes,
  "🔴 el tablero del grupo archivado sigue ENTERO: mismos reclutas, mismos xp, mismas insignias, mismos créditos");
c(G.hoja_(G.H.EVA).getDataRange().getValues().slice(1)
   .every(v => v[G.CAB_EV.length] instanceof Date || String(v[G.CAB_EV.length]).length > 0),
  "cada fila archivada lleva la fecha en que se archivó");
igual(G.hoja_(G.H.EVA).getRange(1, G.CAB_EV.length + 1).getValue(), "archivado", "y la columna se llama así");

// desarchivar deshace el viaje entero
G.setArchivado_(A, false);
igual(filasDe(G, G.H.EV, A), evAntes, "al desarchivar, las filas vuelven a EVENTOS");
igual(filasDe(G, G.H.EVA, A), 0, "y el archivo se queda sin ellas");
igual(foto(G, A), fotoAntes, "y el tablero sigue diciendo exactamente lo mismo");
igual(G.hoja_(G.H.EV).getDataRange().getValues()[1].length, G.CAB_EV.length,
  "de vuelta, las filas recuperan su ancho: la columna «archivado» no se cuela en la pestaña viva");

// el ida y vuelta no duplica nada, que es el fallo clásico de mover filas
G.setArchivado_(A, true); G.setArchivado_(A, false); G.setArchivado_(A, true); G.setArchivado_(A, false);
igual(filasDe(G, G.H.EV, A), evAntes, "🔴 archivar y desarchivar tres veces no duplica ni pierde ninguna fila");

// ================================================================ b) LA PESTAÑA ALUMNADO
G = mundo();
E.enviarCanje(G, A, { email: "ana@alumno.es", recompensa: E.etiqueta(G, G.recompensasCat_()[0].nombre) });
let r = G.alumnado_();

const alu = G.hoja_(G.H.ALU).getDataRange().getValues();
igual(alu[0], G.CAB_ALUMNADO, "ALUMNADO tiene la cabecera que dice el código (un dato, un sitio)");
igual(alu.length - 1, 3, "una fila por persona de todos los grupos");
igual(r.reclutas, 3, "y lo cuenta al terminar");

const col = n => G.CAB_ALUMNADO.indexOf(n);
const ana = alu.slice(1).filter(v => v[col("Correo")] === "ana@alumno.es")[0] || [];
igual(ana[col("PER")], A, "cada fila dice de qué grupo es");
igual(ana[col("Nombre y apellidos")], "Recluta ana@alumno.es", "🔴 con el NOMBRE REAL: esta pestaña es la operativa, no la de investigar");
igual(ana[col("Alias")], "ana", "y con su alias");
igual(ana[col("Docente")], "Mr Cuarter", "y con quién le da clase");
c(Number(ana[col("xp")]) > 0, "los xp");
c(Number(ana[col("Ganados")]) > 0 && Number(ana[col("Gastados")]) > 0, "el dinero: lo ganado y lo gastado");
igual(Number(ana[col("Créditos")]), Number(ana[col("Ganados")]) - Number(ana[col("Gastados")]),
  "y el saldo cuadra con la resta, que es de donde sale");
igual(Number(ana[col("Canjes")]), 1, "los canjes, contados");
contiene(ana[col("Qué ha canjeado")], G.recompensasCat_()[0].nombre, "y dichos por su nombre");
c(Number(ana[col("Retos")]) > 0 && Number(ana[col("Insignias")]) > 0, "los retos completados y las insignias");

// es una FOTO: rehacerla no acumula
G.alumnado_(); r = G.alumnado_();
igual(G.hoja_(G.H.ALU).getLastRow() - 1, 3, "🔴 se rehace entera: pedirla tres veces no triplica las filas");

// un grupo archivado sigue saliendo, marcado
G.setArchivado_(B, true);
G.alumnado_();
const noa = G.hoja_(G.H.ALU).getDataRange().getValues().slice(1).filter(v => v[col("Correo")] === "noa@alumno.es")[0] || [];
c(!!noa.length, "el alumnado de un grupo archivado NO desaparece de la ficha");
c(String(noa[col("Grupo archivado")] || "").length > 0, "sale marcado con la fecha en que se archivó su grupo");

// ================================================================ c) RESETEAR NO DEJA RESIDUOS
// 🔴 EL GUARDARRAÍL. No se comprueban tres pestañas a mano: se recorre el libro ENTERO. El día que
// alguien añada una pestaña de datos y se olvide de vaciarla en el reseteo, esta batería lo canta.
G = mundo();
E.enviarCanje(G, A, { email: "ana@alumno.es", recompensa: E.etiqueta(G, G.recompensasCat_()[0].nombre) });
G.hoja_(G.H.CONS).appendRow(["ana@alumno.es", "SI", new Date(), "prueba"]);
G.alumnado_();
G.consolidarDatos();                                         // para que DATOS y RESUMEN tengan filas
G.setArchivado_(B, true);                                    // para que el archivo también tenga filas

// todas las pestañas de datos llevan algo dentro antes de resetear: si no, no se probaría nada
igual(G.hojasQueSobreviven_(), ["PERs", "RECOMPENSAS", "CONSENTIMIENTO"],
  "la lista de lo que sobrevive al reseteo está escrita en el código, no repartida por ahí");
const conDatos = G.hojasDeDatos_().filter(n => (G.hoja_(n).getLastRow() || 0) > 1);
igual(conDatos.length, G.hojasDeDatos_().length,
  "antes de resetear, TODAS las pestañas de datos tienen filas (" + conDatos.join(", ") + ")");

let s = G.resetear_(), vueltas = 0;
while (!s.terminado && vueltas < 60) { s = G.resetear_(); vueltas++; }
igual(s.terminado, true, "el reseteo termina");

// 🔬 CONSENTIMIENTO sobrevive a propósito: es el papel que respalda un paper, y los grupos van y
// vienen pero la autorización de una persona no. Decisión de Norberto, 29-ago.
const SE_CONSERVAN = { "PERs": 1, "RECOMPENSAS": 1, "CONSENTIMIENTO": 1, "Hoja 1": 1 };
const conRestos = G._maestra.getSheets()
  .filter(h => !SE_CONSERVAN[h.getName()] && h.getLastRow() > 1)
  .map(h => h.getName() + " (" + (h.getLastRow() - 1) + " filas)");
igual(conRestos, [], "🔴 después de resetear NO queda una sola fila de datos en NINGUNA pestaña del libro");
igual(G.hoja_("PERs").getLastRow() - 1, 0, "ni un PER");
igual(G.hoja_(G.H.DOC).getLastRow(), 1, "🔴 DOCENTES vacía: era el residuo que nadie limpiaba");
igual(G.hoja_(G.H.CONS).getLastRow() - 1, 1,
  "🔬 CONSENTIMIENTO NO se vacía: sin esa autorización, un paper publicado luego se queda sin respaldo");
igual(G.hoja_(G.H.ALU).getLastRow(), 1, "ALUMNADO vacía");
igual(G.hoja_(G.H.EVA).getLastRow(), 1, "y el archivo, las dos pestañas, también");
igual(G.hoja_(G.H.AJA).getLastRow(), 1, "");
igual(G.hoja_("RECOMPENSAS").getLastRow() - 1, G.RECOMPENSAS_INICIALES.length,
  "lo único que sobrevive con contenido es el catálogo, y porque se restaura a propósito");

// y el guardarraíl del CÓDIGO, no del estado: toda pestaña del sistema o se vacía o está en la lista
// de excepciones a mano. Así, añadir H.LOQUESEA y olvidarse del reseteo salta aquí.
// PERs se borra fila a fila · RECOMPENSAS se restaura · CONSENTIMIENTO se conserva a propósito
const FUERA = Object.keys(G.H).filter(k => G.hojasQueSobreviven_().indexOf(G.H[k]) >= 0);
const olvidadas = Object.keys(G.H).filter(k => FUERA.indexOf(k) < 0 && G.hojasDeDatos_().indexOf(G.H[k]) < 0);
igual(olvidadas, [], "🔴 toda pestaña declarada en H entra en el reseteo (si falla, hay una nueva sin vaciar)");

// ================================================================ d) EL COLOR
G = mundo();
G.alumnado_();
const n = G.colorear_();
c(n > 0, "colorear_() pone reglas");

const reglasDe = nom => G._maestra.getSheetByName(nom).getConditionalFormatRules();
const PINTADAS = [G.H.PERS, G.H.EV, G.H.AJ, G.H.EVA, G.H.AJA, G.H.DOC, G.H.ALU];
igual(PINTADAS.filter(x => !reglasDe(x).length), [], "las siete pestañas del sistema llevan reglas");

// el color de un grupo es el MISMO en todas partes: si no, seguir una fila de pestaña en pestaña
// sería peor que no tener color
const colorEn = (hoja, per) => (reglasDe(hoja).filter(x => x.formula.indexOf('"' + per + '"') >= 0)[0] || {}).fondo;
igual(PINTADAS.map(h => colorEn(h, A)).filter((v, i, a) => a.indexOf(v) === i).length, 1,
  "🔴 el grupo A tiene el MISMO color en las siete pestañas");
c(!!colorEn(G.H.EV, A) && colorEn(G.H.EV, A) !== colorEn(G.H.EV, B),
  "🔴 y dos grupos distintos, colores distintos");

// la columna a la que apunta la fórmula cambia según la pestaña: en EVENTOS el per es la B y en
// ALUMNADO la A. Apuntar a la columna de al lado pintaría la hoja entera de un solo color.
contiene(reglasDe(G.H.EV).filter(x => x.formula.indexOf(A) >= 0)[0].formula, '$B2="' + A + '"',
  "en EVENTOS la regla mira la columna del per (B)");
contiene(reglasDe(G.H.ALU).filter(x => x.formula.indexOf(A) >= 0)[0].formula, '$A2="' + A + '"',
  "y en ALUMNADO, la A");

// los avisos van DELANTE del tinte del grupo: en Sheets manda la primera regla que casa, así que
// ponerlos detrás sería tenerlos apagados
const rAlu = reglasDe(G.H.ALU);
const primerGrupo = rAlu.map(x => x.formula).findIndex(f => f.indexOf('"' + A + '"') >= 0);
const avisos = rAlu.slice(0, primerGrupo).map(x => x.formula);
igual(avisos.length, 3, "ALUMNADO tiene sus tres avisos (archivado, sin docente, dos semanas parado)");
c(avisos.every(f => f.indexOf(A) < 0), "🔴 y van ANTES que el color del grupo, o no se verían nunca");
c(rAlu.every(x => x.rangos.length === 1 && x.rangos[0].getRow() === 2),
  "las reglas empiezan en la fila 2: la cabecera no se tiñe");

// y la regla del grupo archivado existe donde tiene que existir
c(reglasDe(G.H.PERS).some(x => x.formula.indexOf("$V2") >= 0), "en PERs, lo archivado se ve en gris");

E.resumen("El archivo, ALUMNADO, el reseteo y el color");
