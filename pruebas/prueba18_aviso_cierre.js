'use strict';
// 18 · EL AVISO ANTES DE QUE CIERRE EL CANJE (§12.8)
// La última semana ya no se gana nada: solo se gasta lo ganado. La fecha se ve en la Nave, pero
// nadie te da un toque — y quien llega con 200 ◈ sin gastar los pierde. Esto cierra el círculo.
//   · cuelga de fotoNocturna (nada de triggers nuevos)
//   · umbrales: 7 días y 1 día antes del cierre del canje
//   · SOLO a quien tenga créditos sin gastar
//   · una vez por umbral y grupo, pase lo que pase
const E = require("./entorno.js");
const { comprobar: c, igual, contiene } = E;
const M = E.M;
console.log("\n▶ 18 · El aviso de que se acaba el canje");

// Deja el cierre del canje a `dias` vista, escribiéndolo en la fila del PER (columna 24).
function cierreEnDias(G, per, dias) {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + dias);
  const f = G.perFila_(per);
  G.hoja_(G.H.PERS).getRange(f.fila, 24).setValue(E.iso(d));
}
function correosA(frag) { return M.Correo.enviados.filter(e => String(e.para).indexOf(frag) >= 0); }
function avisosCierre() { return M.Correo.enviados.filter(e => /se acaba|te quedan/i.test(e.asunto)); }

// ---------------------------------------------------------------- a) a 7 días, solo a quien tiene saldo
let G = E.nuevoMundo();
E.crearPERDemo(G);
E.reclutaRico(G, "prueba-banco", "conplata@alumno.es", { profe: "Mr Cuarter" });   // 590 ◈
E.enviarBitacora(G, "prueba-banco", { email: "pelado@alumno.es", alias: "Pelado", profe: "Mr Cuarter" });
// al pelado se le anula el reclutamiento (algo que un docente puede hacer): se queda a 0 ◈
G.hoja_(G.H.AJ).appendRow([new Date(), "prueba-banco", "pelado@alumno.es", "H1", "anular", "prueba", "Mr Cuarter"]);
igual(G.tablero_("prueba-banco", true).reclutas.filter(x => x.email === "pelado@alumno.es")[0].creditos, 0,
  "el segundo recluta se queda sin un solo crédito");

cierreEnDias(G, "prueba-banco", 7);
M.Correo.limpiar();
let r = G.avisoCierreCanje();
igual(r.enviados, 1, "🔴 a 7 días del cierre sale UN aviso: solo a quien le quedan créditos");
igual(correosA("conplata@alumno.es").length, 1, "le llega a quien tiene saldo");
igual(correosA("pelado@alumno.es").length, 0, "🔴 y NO se molesta a quien ya lo gastó todo");
const av = correosA("conplata@alumno.es")[0];
contiene(av.cuerpo, String(940 + G.BONUS_PLANETA.creditos * 8),   // 940 = base v3.41 (sin Batalla, con S7)
  "el correo dice cuántos créditos le quedan, con el bonus de los planetas dentro");
contiene(av.cuerpo, "7 días", "y cuántos días");
contiene(av.cuerpo, "recluta.html", "con enlace a la Nave");
contiene(av.cuerpo, "PRUEBA BANCO", "y dice de qué grupo habla");

// ---------------------------------------------------------------- b) una vez, y solo una
M.Correo.limpiar();
r = G.avisoCierreCanje();
igual(r.enviados, 0, "🔴 llamarlo otra vez el mismo día no manda nada");
igual(avisosCierre().length, 0, "ni un correo de más");
M.Correo.limpiar();
G.fotoNocturna();
igual(avisosCierre().length, 0, "tampoco por la foto nocturna");

// ---------------------------------------------------------------- c) el segundo aviso, a 1 día
cierreEnDias(G, "prueba-banco", 1);
M.Correo.limpiar();
r = G.avisoCierreCanje();
igual(r.enviados, 1, "🔴 el último día vuelve a avisar: es otro umbral, no una repetición");
contiene(correosA("conplata@alumno.es")[0].cuerpo, "1 día", "y ya habla de un solo día");
M.Correo.limpiar();
igual(G.avisoCierreCanje().enviados, 0, "y ese también es de una sola vez");

// ---------------------------------------------------------------- d) fuera de la ventana, silencio
// Lejos del cierre no se molesta a nadie; y una vez cerrado, avisar sería una broma de mal gusto.
G = E.nuevoMundo();
E.crearPERDemo(G);
E.reclutaRico(G, "prueba-banco", "lejos@alumno.es", { profe: "Mr Cuarter" });
[30, 12, 8, -1, -20].forEach(function(d){
  cierreEnDias(G, "prueba-banco", d);
  M.Correo.limpiar();
  igual(G.avisoCierreCanje().enviados, 0, "a " + d + " días del cierre no se avisa");
});
// pero DENTRO de la ventana sí, aunque no caiga en el día exacto (ver el bloque h)
cierreEnDias(G, "prueba-banco", 6);
M.Correo.limpiar();
igual(G.avisoCierreCanje().enviados, 1, "a 6 días, en cambio, sí: la ventana es «como muy tarde»");

// ---------------------------------------------------------------- e) cuelga de la foto nocturna
G = E.nuevoMundo();
E.crearPERDemo(G);
E.reclutaRico(G, "prueba-banco", "nocturno@alumno.es", { profe: "Mr Cuarter" });
cierreEnDias(G, "prueba-banco", 7);
M.Correo.limpiar();
G.fotoNocturna();
igual(correosA("nocturno@alumno.es").length, 1,
  "🔴 la foto nocturna lo dispara sola: ni un trigger nuevo que instalar");

// ---------------------------------------------------------------- f) sin cuota no se intenta, y se sabe
G = E.nuevoMundo();
E.crearPERDemo(G);
E.reclutaRico(G, "prueba-banco", "sincuota@alumno.es", { profe: "Mr Cuarter" });
cierreEnDias(G, "prueba-banco", 7);
M.Correo.limpiar();
M.Correo.cuota = 0;
r = G.avisoCierreCanje();
igual(r.enviados, 0, "sin cuota no se manda nada");
igual(M.Correo.enviados.length, 0, "ni se intenta");
const errores = G.hoja_(G.H.AJ).getDataRange().getValues().slice(1).filter(v => v[3] === "ERROR" && v[4] === "cuota");
c(errores.length >= 1, "🔴 pero queda traza en AJUSTES: el parte de salud lo verá");

// ---------------------------------------------------------------- g) un PER archivado no molesta a nadie
G = E.nuevoMundo();
E.crearPERDemo(G);
E.reclutaRico(G, "prueba-banco", "viejo@alumno.es", { profe: "Mr Cuarter" });
cierreEnDias(G, "prueba-banco", 7);
G.setArchivado_("prueba-banco", true);
M.Correo.limpiar();
igual(G.avisoCierreCanje().enviados, 0, "🔴 un grupo archivado no manda avisos");

// ---------------------------------------------------------------- h) un día perdido no pierde el aviso
// 🔴 REVISIÓN 26-ago: con umbrales EXACTOS (faltan === 7), si ese día la foto nocturna no corre
// —Google se salta ejecuciones, o la cuota está a cero— el aviso se pierde para siempre. Y como el
// canje solo dura una semana más, ese aviso es justo el que importa.
G = E.nuevoMundo();
E.crearPERDemo(G);
E.reclutaRico(G, "prueba-banco", "tarde@alumno.es", { profe: "Mr Cuarter" });
cierreEnDias(G, "prueba-banco", 5);              // el día 7 nadie ejecutó nada
M.Correo.limpiar();
igual(G.avisoCierreCanje().enviados, 1,
  "🔴 a 5 días, sin haber avisado del umbral de 7, RECUPERA el aviso perdido");
M.Correo.limpiar();
igual(G.avisoCierreCanje().enviados, 0, "y no lo repite al día siguiente");

// quien llega directo al último día no recibe dos correos de golpe
G = E.nuevoMundo();
E.crearPERDemo(G);
E.reclutaRico(G, "prueba-banco", "ultimo@alumno.es", { profe: "Mr Cuarter" });
cierreEnDias(G, "prueba-banco", 1);              // nunca se avisó del 7
M.Correo.limpiar();
igual(G.avisoCierreCanje().enviados, 1,
  "🔴 llegando directo al último día sale UN aviso, no uno por cada umbral saltado");
contiene(correosA("ultimo@alumno.es")[0].cuerpo, "1 día", "y habla del plazo de verdad, no del de hace una semana");
M.Correo.limpiar();
igual(G.avisoCierreCanje().enviados, 0, "y ahí se acaba");

// ---------------------------------------------------------------- i) sin cuota NO se da por avisado
// El otro medio fallo: se marcaba el umbral ANTES de enviar, así que un día sin cuota se comía el
// aviso para siempre.
G = E.nuevoMundo();
E.crearPERDemo(G);
E.reclutaRico(G, "prueba-banco", "recupera@alumno.es", { profe: "Mr Cuarter" });
cierreEnDias(G, "prueba-banco", 7);
M.Correo.limpiar();
M.Correo.cuota = 0;
igual(G.avisoCierreCanje().enviados, 0, "sin cuota no sale");
M.Correo.cuota = 1500;
G._cuota = null;          // en Apps Script cada trigger es una ejecución nueva: relee la cuota
M.Correo.limpiar();
igual(G.avisoCierreCanje().enviados, 1,
  "🔴 y en cuanto vuelve la cuota, el aviso se manda: no se dio por hecho lo que no se hizo");

E.resumen("El aviso de cierre del canje");
