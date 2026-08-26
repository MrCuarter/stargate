'use strict';
// 16 · LA CUOTA DE CORREO (§12.3)
// Una cuenta gratuita manda 100 correos al día. Cuando se acaba, hasta ahora el correo
// simplemente NO SALÍA y no se enteraba nadie. Lo que NO puede pasar es que la falta de cuota
// se lleve por delante un canje: el correo es el acuse de recibo, no la transacción.
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
const M = E.M;
console.log("\n▶ 16 · La cuota de correo no se lleva por delante ningún canje");

// ---------------------------------------------------------------- a) sin cuota, el canje se concede igual
let G = E.nuevoMundo();
E.crearPERDemo(G);
E.reclutaRico(G, "prueba-banco", "sincuota@alumno.es", { profe: "Mr Cuarter" });
M.Correo.limpiar();
M.Correo.cuota = 0;

// el sobre se concede y se cobra sin depender del correo (v3.20: lo concedido ya no manda ninguno)
let r = E.enviarCanje(G, "prueba-banco", { email: "sincuota@alumno.es", recompensa: E.etiqueta(G, "Sobre de cromos") });
igual(r.estado, "Concedido", "🔴 sin cuota de correo el canje se concede IGUAL");
igual(M.Correo.enviados.length, 0, "y no sale ningún correo");
const al = G.tablero_("prueba-banco", true).reclutas[0];
igual(al.creditos_gastados, 15, "se cobra");
igual(Object.keys(al.cromos).length, 1, "y la carta llega al álbum");

// Ahora lo que SÍ manda correo desde v3.20: una denegación. Es el caso crítico, porque es el aviso
// que evita que el alumno escriba al profesorado — y sin cuota tiene que dejar rastro.
E.enviarCanje(G, "prueba-banco", { email: "sincuota@alumno.es", recompensa: E.etiqueta(G, "Marco dorado del avatar") });
r = E.enviarCanje(G, "prueba-banco", { email: "sincuota@alumno.es", recompensa: E.etiqueta(G, "Marco dorado del avatar") });
contiene(r.estado, "Denegado", "la segunda vez se deniega (es de una sola vez)");
igual(M.Correo.enviados.length, 0, "sin cuota no se intenta mandar nada (no hay con qué)");

// la traza queda en AJUSTES: es lo que convierte un fallo invisible en uno que se ve
const errores = G.hoja_(G.H.AJ).getDataRange().getValues().slice(1)
  .filter(v => v[3] === "ERROR" && v[4] === "cuota");
c(errores.length >= 1, "🔴 queda una fila ERROR/cuota en AJUSTES (" + errores.length + ")");
contiene(String(errores[0][5]), "sin cuota", "que dice lo que pasó");
igual(G.salud_().puntos.filter(x => x.clave === "cuota")[0].nivel, "mal", "y el parte de salud lo canta en rojo");
igual(G.salud_().puntos.filter(x => x.clave === "errores")[0].nivel, "mal", "junto con el error");

// ---------------------------------------------------------------- b) un canje de nota tampoco se pierde
G = E.nuevoMundo();
E.crearPERDemo(G);
E.reclutaRico(G, "prueba-banco", "nota@alumno.es", { profe: "Mr Cuarter" });
M.Correo.limpiar();
M.Correo.cuota = 0;
r = E.enviarCanje(G, "prueba-banco", { email: "nota@alumno.es",
  recompensa: E.etiqueta(G, "Subir 1 punto en un entregable"), actividad: "Actividad 2" });
igual(r.estado, "Concedido", "🔴 el canje de nota se concede aunque no haya cuota");
const avisos = G.hoja_(G.H.AJ).getDataRange().getValues().slice(1).filter(v => v[3] === "AVISO");
igual(avisos.length, 1, "y queda la traza del aviso al docente");
contiene(String(avisos[0][6]), "SIN CUOTA", "diciendo que fue por la cuota, no por falta de correos");

// ---------------------------------------------------------------- c) cuota baja: UN aviso al día
G = E.nuevoMundo();
E.crearPERDemo(G);
E.reclutaRico(G, "prueba-banco", "baja@alumno.es", { profe: "Mr Cuarter" });
// v3.20 · lo que gasta cuota son las DENEGACIONES (lo concedido ya no manda correo), así que el
// aviso de cuota baja se prueba con ellas. El marco es de una sola vez: el primero se concede y los
// tres siguientes se deniegan.
E.enviarCanje(G, "prueba-banco", { email: "baja@alumno.es", recompensa: E.etiqueta(G, "Marco dorado del avatar") });
M.Correo.limpiar();
M.Correo.cuota = 12;
[1, 2, 3].forEach(() =>
  E.enviarCanje(G, "prueba-banco", { email: "baja@alumno.es", recompensa: E.etiqueta(G, "Marco dorado del avatar") }));
const reserva = M.Correo.enviados.filter(e => /cuota de correo/.test(e.asunto));
igual(reserva.length, 1, "🔴 con la cuota baja sale UN solo aviso, no uno por canje");
contiene(reserva[0].para, "mutecdgami", "y va al correo de reserva (el dueño de la hoja)");
contiene(reserva[0].cuerpo, "se siguen resolviendo", "explicando que el juego no se para");
igual(M.Correo.enviados.filter(e => /Canje denegado/.test(e.asunto)).length, 3,
  "y las tres denegaciones llegan igual: son el aviso que evita el correo al profe");

// ---------------------------------------------------------------- d) con cuota de sobra, ni se menciona
G = E.nuevoMundo();
E.crearPERDemo(G);
E.reclutaRico(G, "prueba-banco", "normal@alumno.es", { profe: "Mr Cuarter" });
M.Correo.limpiar();
E.enviarCanje(G, "prueba-banco", { email: "normal@alumno.es", recompensa: E.etiqueta(G, "Sobre de cromos") });
igual(M.Correo.enviados.filter(e => /cuota/.test(e.asunto)).length, 0, "con 1500 correos disponibles no avisa de nada");
igual(M.Correo.enviados.length, 0, "🔴 ni manda nada: un sobre concedido se celebra en la Nave, no por correo");
igual(G.salud_().puntos.filter(x => x.clave === "cuota")[0].nivel, "ok", "el parte de salud lo ve en verde");

E.resumen("La cuota de correo");
