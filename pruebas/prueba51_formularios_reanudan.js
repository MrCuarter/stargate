'use strict';
// 51 · «ACTUALIZAR FORMULARIOS» TIENE QUE PODER MORIR Y SEGUIR
//
// Lo que pasó de verdad el 11-sep, mirando el registro de ejecuciones de producción: CINCO pasadas
// seguidas de `actualizarRecompensas`, todas de **360 s exactos**, todas «Tiempo de espera agotado»
// — y **ni una sola** ejecución de `continuarActualizarFormularios`. Cada pasada empezaba de cero y
// se moría en el mismo sitio. Volver a pulsar el menú no arreglaba nada: repetía el mismo suicidio.
//
// La causa no era el reloj —que estaba bien pensado, con fases y márgenes— sino DÓNDE se guardaba
// el resultado de haberlo mirado: el progreso se escribía al SALIR del bucle, y el disparador de
// continuación se creaba en esa misma línea. Cuando Apps Script mata la ejecución en seco dentro de
// una fase, ese código no llega a correr nunca. La red estaba después del salto.
//
// 🔴 La regla que queda: si una tarea puede morir sin avisar, la recuperación se arma ANTES de
// empezar y el progreso se escribe DESPUÉS DE CADA TRAMO. No al final.
const E = require("./entorno.js");
const { comprobar: c } = E;
const fs = require("fs"), path = require("path");
console.log("\n▶ 51 · Actualizar formularios tiene que poder morir y seguir");

const gs = fs.readFileSync(path.join(__dirname, "..", "apps-script", "Code.gs"), "utf8");
const ini = gs.indexOf("function actualizarFormularios_");
const fin = gs.indexOf("function continuarActualizarFormularios");
const fn = gs.slice(ini, fin);
c(ini > 0 && fin > ini, "encuentro actualizarFormularios_ entera");
// mirar el CÓDIGO, no los comentarios: esta batería habla justo de lo que NO está
const CODIGO = fn.replace(/^\s*\/\/.*$/gm, "");

// ---------------------------------------------------------------- a) la red, antes del salto
const cabeza = CODIGO.slice(0, CODIGO.indexOf("while (pr.i < pers.length"));
c(/programarContinuacion_\("continuarActualizarFormularios", 420000\)/.test(cabeza),
  "🔴 el disparador se arma ANTES del bucle Y con retardo LARGO (7 min > el corte duro de 6)");
// 🔴 El fallo que introduje y me comí en producción: armarlo antes con el retardo corto de siempre
// hacía que saltara al minuto MIENTRAS la pasada seguía viva. Esa arrancaba otra, y a los cinco
// minutos había CUATRO ejecuciones a la vez peleándose por el mismo progreso y quemando cuota.
c(!/programarContinuacion_\("continuarActualizarFormularios"\)\s*;/.test(cabeza),
  "   y NUNCA con el retardo por defecto: eso solaparía pasadas");
c(/var apuntar = function\(\)/.test(cabeza),
  "y hay una forma corta de apuntar el progreso, para poder llamarla en cada tramo");

// ---------------------------------------------------------------- b) se apunta en cada tramo
const cuerpo = CODIGO.slice(CODIGO.indexOf("while (pr.i < pers.length"), CODIGO.indexOf("var terminado"));
const apuntes = (cuerpo.match(/apuntar\(\)/g) || []).length;
c(apuntes >= 5,
  "🔴 el progreso se guarda después de CADA fase y de cada grupo · apuntes en el bucle: " + apuntes);
// las cuatro fases + el cierre de grupo tienen que estar cubiertas, una por una
[
  ["pr.fase = 1", "tras el canje"],
  ["pr.fase = 2", "tras la Bitácora"],
  ["pr.fase = 3", "tras el ticket"],
  ["pr.i++", "al cerrar el grupo"]
].forEach(function (par) {
  const k = cuerpo.indexOf(par[0]);
  c(k >= 0 && cuerpo.slice(k, k + 120).indexOf("apuntar()") >= 0,
    "se apunta " + par[1]);
});

// ---------------------------------------------------------------- c) al terminar se limpia
const cola = CODIGO.slice(CODIGO.indexOf("var terminado"));
c(/guardarProgreso_\("formularios", null\)/.test(cola), "al terminar se borra el progreso");
c(/cancelarContinuacion_\("continuarActualizarFormularios"\)/.test(cola),
  "🔴 y se quita el disparador: si no, quedaría uno dando vueltas para siempre");
// y el disparador NO se vuelve a programar al final: ya está puesto desde el principio
c(/programarContinuacion_\("continuarActualizarFormularios", 60000\)/.test(cola),
  "🔴 al acabar una pasada sin terminar se re-arma CORTO (1 min): ahí ya no hay nada corriendo");

// ---------------------------------------------------------------- c bis) y sabe rendirse
// 🔴 Tercera lección del mismo día: con el progreso ya bien guardado y sin solapes, la tanda se
// quedó dando vueltas TRES HORAS —una pasada cada 8 minutos, todas agotando los 6 minutos, sin
// avanzar— porque algo de un grupo no cabe en una pasada y no sabe partirse. Reintentar sin tope
// solo quema cuota, y la cuota se comparte con el disparador que procesa las respuestas de los
// formularios. Un sistema de mantenimiento cero no puede tener bucles sin salida.
c(/MAX_VUELTAS_FORM/.test(gs), "🔴 hay un tope de reintentos");
c(/pr\.vueltas = \(pr\.vueltas \|\| 0\) \+ 1/.test(CODIGO), "que se cuenta en el progreso, no en memoria");
const tope = CODIGO.slice(CODIGO.indexOf("pr.vueltas"), CODIGO.indexOf("while (pr.i < pers.length"));
c(/cancelarContinuacion_/.test(tope), "🔴 al rendirse se quita el disparador: si no, seguiría el bucle");
c(/guardarProgreso_\("formularios", null\)/.test(tope), "   y se borra el progreso, para poder reintentar limpio a mano");
c(/atascado: true/.test(tope), "y se devuelve que está atascado, no que sigue trabajando");
c(/Atascado en el grupo/.test(tope), "🔴 diciendo EN QUÉ GRUPO y EN QUÉ FASE: sin eso, rendirse no sirve de nada");
c(/Actualizaci\u00f3n DETENIDA|Actualización DETENIDA/.test(gs), "y el menú lo dice en voz alta");

// ---------------------------------------------------------------- d) el reloj sigue donde estaba
// Arreglar el guardado no puede haberse llevado por delante los frenos que ya existían.
c(/t\.puedo\(\)/.test(CODIGO), "el bucle sigue mirando el reloj entre fases");
c(/cabe\(\)/.test(CODIGO), "y sigue sin empezar una tarea atómica que no quepa");
c(/reestructurarBitacora_\(fbx, perObj_\(v\), t\)/.test(CODIGO),
  "🔴 la Bitácora sigue recibiendo el reloj: es la fase que no cabe en una pasada");

// ---------------------------------------------------------------- e) y la continuación existe
c(/function continuarActualizarFormularios\(\)/.test(gs),
  "la función que dispara el trigger existe (es la que nunca llegó a ejecutarse)");
c(/function programarContinuacion_\(fn, ms\)/.test(gs),
  "🔴 programarContinuacion_ acepta el retardo: sin eso no se puede distinguir «red de seguridad» de «sigue ya»");
c(/after\(ms \|\| 60000\)/.test(gs), "y por defecto sigue siendo un minuto, como siempre");

E.resumen("Actualizar formularios tiene que poder morir y seguir");
