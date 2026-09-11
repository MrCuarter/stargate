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
c(/programarContinuacion_\("continuarActualizarFormularios"\)/.test(cabeza),
  "🔴 el disparador de continuación se arma ANTES del bucle, no después");
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
c((cola.match(/programarContinuacion_/g) || []).length === 0,
  "no se re-arma al final (ya estaba armado): un disparador, no dos");

// ---------------------------------------------------------------- d) el reloj sigue donde estaba
// Arreglar el guardado no puede haberse llevado por delante los frenos que ya existían.
c(/t\.puedo\(\)/.test(CODIGO), "el bucle sigue mirando el reloj entre fases");
c(/cabe\(\)/.test(CODIGO), "y sigue sin empezar una tarea atómica que no quepa");
c(/reestructurarBitacora_\(fbx, perObj_\(v\), t\)/.test(CODIGO),
  "🔴 la Bitácora sigue recibiendo el reloj: es la fase que no cabe en una pasada");

// ---------------------------------------------------------------- e) y la continuación existe
c(/function continuarActualizarFormularios\(\)/.test(gs),
  "la función que dispara el trigger existe (es la que nunca llegó a ejecutarse)");
c(/function programarContinuacion_/.test(gs) && /after\(60000\)/.test(gs),
  "y reintenta al minuto");

E.resumen("Actualizar formularios tiene que poder morir y seguir");
