'use strict';
// 38 · EL RECORRIDO DE LA BITÁCORA  (rediseño pedido por Norberto, 29-ago)
//
// El formulario tenía un problema de puerta de entrada: se entraba directo al alistamiento, y quien
// solo venía a marcar un reto tenía que bajar por alias, personaje, docente y biografía para
// encontrar, AL FINAL, el desplegable que le llevaba a su sección.
//
// El recorrido nuevo, tal cual lo describió:
//
//     PORTADA ─ explica cómo funciona · pide el correo · «¿QUÉ QUIERES HACER HOY?»
//        ├── ALISTARME ──────────→ [ALISTAMIENTO] ─ alias, personaje, docente, bio
//        │                              └── «¿registras algo ahora?» → ENVIAR │ elegir planeta
//        └── REGISTRAR RETOS ────→ [ELIGE EL PLANETA] ─ un desplegable de planetas
//                                        └────────────→ [PLANETA N] ─ un bloque por reto → ENVIAR
//
// 🔴 Lo que esta batería vigila de verdad es el GRAFO. Un formulario con las preguntas correctas
// pero un salto mal puesto manda a treinta personas a la página equivocada, y eso no se ve leyendo
// el código: se ve siguiendo los enlaces, que es lo que se hace aquí.
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
console.log("\n▶ 38 · La Bitácora por planetas: la portada, el alistamiento y los retos");

const G = E.nuevoMundo();
const PER = E.crearPERDemo(G).id;
const o = G.perObj_(G.perFila_(PER).v);
const fb = G.FormApp.openByUrl(o.formBitacoraEdit);

const items = () => fb.getItems();
const titulos = () => items().map(i => i.getTitle());
const item = t => items().filter(i => i.getTitle() === t)[0];
const pos = t => titulos().indexOf(t);
const RETOS = G.retosDe_(o.tipo);

// ================================================================ a) LA PORTADA
const intro = item(G.TIT_INTRO);
c(!!intro && intro.getType() === "SECTION_HEADER", "la primera pantalla es una sección que explica el formulario");
igual(pos(G.TIT_INTRO), 0, "y va la PRIMERA de todo: es lo que se lee antes que nada");
contiene(intro.getHelpText(), "ALISTAS", "explica que la primera vez te alistas");
contiene(intro.getHelpText(), "REGISTRAS", "y que después registras");
contiene(intro.getHelpText(), "MISMO enlace", "y que es el mismo enlace siempre, que es lo que más despista");

const hoy = item(G.TIT_HOY);
c(!!hoy && hoy.getType() === "LIST", "la portada pregunta con un desplegable");
c(hoy.isRequired(), "🔴 obligatorio: si se pudiera dejar en blanco, Google seguiría a la página siguiente sin más");
igual(hoy.getChoices().map(x => x.getValue()), [G.OPC_ALTA, G.OPC_RETOS],
  "y ofrece exactamente dos caminos: alistarme o registrar retos");

// en la portada NO puede haber nada más que la explicación, el correo y esa pregunta
const pbAlta = item(G.TIT_PAG_ALTA);
c(!!pbAlta && pbAlta.getType() === "PAGE_BREAK", "el alistamiento es una página aparte");
const enPortada = titulos().slice(0, pos(G.TIT_PAG_ALTA));
igual(enPortada.filter(t => t !== G.TIT_INTRO && t !== G.TIT_HOY && t !== "Correo"), [],
  "🔴 en la portada no hay NADA más: ni alias, ni personaje, ni retos");

// ================================================================ b) EL GRAFO DE SALTOS
// Se compara por TÍTULO de la página destino, no por identidad del objeto: el simulador entrega
// el formulario por su URL y no garantiza la misma instancia, y lo que importa es a DÓNDE va.
const destinoDe = (it, opcion) => {
  const ch = it.getChoices().filter(x => x.getValue() === opcion)[0];
  if (!ch) return null;
  const pb = ch.getGotoPage();
  return pb ? pb.getTitle() : ch.getPageNavigationType();
};
igual(destinoDe(hoy, G.OPC_ALTA), G.TIT_PAG_ALTA, "🔴 «ALISTARME» lleva a la página del alistamiento");
const pbPl = item(G.TIT_PAG_PLANETA);
c(!!pbPl && pbPl.getType() === "PAGE_BREAK", "«elige el planeta» también es una página");
igual(destinoDe(hoy, G.OPC_RETOS), G.TIT_PAG_PLANETA, "🔴 «REGISTRAR RETOS» salta DIRECTO a elegir planeta, sin pasar por el alistamiento");

const tras = item(G.TIT_TRAS_ALTA);
c(!!tras && tras.isRequired(), "el alistamiento termina preguntando si quiere registrar algo ya");
igual(destinoDe(tras, G.OPC_SOLO_ALTA), "SUBMIT", "«no, ya está» envía");
igual(destinoDe(tras, G.OPC_SIGO), G.TIT_PAG_PLANETA, "y «sí» le lleva a elegir planeta");
igual(pos(G.TIT_TRAS_ALTA) + 1, pos(G.TIT_PAG_PLANETA), "esa pregunta es lo último del alistamiento");

// el orden de las tres primeras páginas
c(pos(G.TIT_HOY) < pos(G.TIT_PAG_ALTA), "portada, alistamiento y elegir planeta van en ese orden");
c(pos(G.TIT_PAG_ALTA) < pos(G.TIT_PAG_PLANETA), "");

// la identidad vive ENTERA dentro del alistamiento
["Alias de recluta (público)", "Nombre y apellidos", "Elige tu avatar",
 "¿Quién imparte tu clase?", "Enlace a mi Bitácora (ePortfolio)", "Breve biografía de tu personaje"]
  .forEach(t => {
    const p = pos(t);
    c(p > pos(G.TIT_PAG_ALTA) && p < pos(G.TIT_PAG_PLANETA), "«" + t + "» está dentro del alistamiento");
  });

// ================================================================ c) ELEGIR PLANETA
const sel = item(G.TIT_PLANETA);
c(!!sel && sel.isRequired(), "elegir planeta es obligatorio");
const temas = [...new Set(RETOS.map(r => r[4]))].sort((a, b) => a - b);
igual(sel.getChoices().length, temas.length, "hay una opción por planeta del viaje");
igual(sel.getChoices().map(x => x.getValue()), temas.map(t => G.tituloPlaneta_(t)),
  "🔴 y se llaman «Planeta N · Nombre», no «Tema N»: en el juego son planetas");
temas.forEach(t => {
  igual(destinoDe(sel, G.tituloPlaneta_(t)), G.tituloPlaneta_(t),
    "elegir «" + G.tituloPlaneta_(t) + "» lleva a SU página, no a la de al lado");
});

// ================================================================ d) DENTRO DE UN PLANETA
// El orden que se ve en pantalla: el orbe, y después cada reto con su casilla y su enlace pegado.
temas.forEach(t => {
  const pb = items().filter(i => i.getType() === "PAGE_BREAK" && G.temaDePagina_(i.getTitle()) === t)[0];
  c(!!pb, "existe la página del planeta " + t);
  if (!pb) return;
  igual(pb.getGoToPage(), "SUBMIT", "y al terminarla se envía: no se cae en la del planeta siguiente");
  const suyos = RETOS.filter(r => r[4] === t);
  const desde = items().indexOf(pb);
  // lo que hay entre este salto de página y el siguiente
  const sig = items().slice(desde + 1);
  const corte = sig.findIndex(i => i.getType() === "PAGE_BREAK");
  const dentro = (corte < 0 ? sig : sig.slice(0, corte)).map(i => i.getTitle());
  suyos.forEach(r => {
    c(dentro.indexOf(r[1]) >= 0, "el reto " + r[0] + " está en la página de su planeta");
    igual(dentro.indexOf(G.tituloEvidenciaReto_(r)), dentro.indexOf(r[1]) + 1,
      "y su enlace de evidencia, justo debajo");
  });
  // y NADA de otro planeta
  const ajenos = dentro.filter(x => {
    const r = RETOS.filter(y => y[1] === x || G.tituloEvidenciaReto_(y) === x)[0];
    return r && r[4] !== t;
  });
  igual(ajenos, [], "y no se cuela ningún reto de otro planeta");
});

// ================================================================ e) REGISTRAR DE VERDAD
// El grafo puede estar perfecto y la lectura rota: lo que cuenta es que al enviar se apunte.
E.enviarBitacora(G, PER, { email: "ana@alumno.es", alias: "Ana", nombre: "Ana A", profe: "Mr Cuarter" });
const dosDelUno = RETOS.filter(r => r[4] === 1).slice(0, 2);
const marcas = E.marcar(G, dosDelUno);
marcas[G.tituloEvidenciaReto_(dosDelUno[0])] = "https://evidencia.example/uno";
E.enviarBitacora(G, PER, { email: "ana@alumno.es", marcados: marcas }, 2);
let ana = G.tablero_(PER, true).reclutas.filter(x => x.email === "ana@alumno.es")[0];
igual(dosDelUno.filter(r => !ana.retos[r[0]]).map(r => r[0]), [], "lo marcado en el formato nuevo se registra");
igual(ana.eventos.filter(e => e.reto_id === dosDelUno[0][0])[0].evidencia, "https://evidencia.example/uno",
  "con el enlace de ESE reto");
igual(ana.eventos.filter(e => e.reto_id === dosDelUno[1][0])[0].evidencia, "",
  "🔴 y el que no puso enlace se queda sin él: no se le copia el del vecino");

// editar la respuesta desde OTRO planeta llega con las casillas del primero vacías (Google reescribe
// la fila entera). El sistema solo AÑADE, así que no puede perder lo de antes.
const delDos = G.retosDe_(o.tipo).filter(r => r[4] === 2);
E.enviarBitacora(G, PER, { email: "ana@alumno.es",
  marcados: Object.assign(E.desmarcar(G, dosDelUno), E.marcar(G, delDos)) }, 2);
ana = G.tablero_(PER, true).reclutas.filter(x => x.email === "ana@alumno.es")[0];
igual(dosDelUno.filter(r => !ana.retos[r[0]]).map(r => r[0]), [],
  "🔴 registrar en el planeta 2 no borra lo del planeta 1, aunque sus casillas lleguen vacías");
igual(delDos.filter(r => !ana.retos[r[0]]).map(r => r[0]), [], "y lo del 2 se suma");

// ================================================================ f) IDEMPOTENTE
// La estructura la aplican DOS caminos (crearPER y «Actualizar formularios»), y el segundo se pasa
// tantas veces como se pulse el menú.
const antes = titulos().length;
G.estructuraBitacora_(fb, o);
G.estructuraBitacora_(fb, o);
igual(titulos().length, antes, "🔴 pasar la estructura dos veces más no añade ni un campo");
igual(titulos().filter(t => t === G.TIT_HOY).length, 1, "ni duplica el desplegable de la portada");
igual(pos(G.TIT_INTRO), 0, "ni descoloca la portada");
igual(destinoDe(item(G.TIT_HOY), G.OPC_RETOS), G.TIT_PAG_PLANETA, "y los saltos siguen apuntando bien");

E.resumen("La Bitácora por planetas");
