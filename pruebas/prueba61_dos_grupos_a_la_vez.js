'use strict';
// 61 · UN DOCENTE, DOS GRUPOS A LA VEZ
//
// El escenario lo puso Norberto y no es hipotético: es enero. Un PER acaba mientras otro empieza, y
// el mismo docente lleva los dos. Todo lo que aquí se comprueba fallaba EN SILENCIO — sin error, sin
// aviso— que es la única forma en que un fallo llega vivo a una clase.
//
// 🔴 El peor de todos: la llamada a filas se proyecta delante de la clase. Abrirla en el grupo
// equivocado no da ningún error. Simplemente los que están delante no pueden fichar (no son de ese
// escuadrón) y los que no están sí pueden, desde casa.
const E = require("./entorno.js");
const { comprobar: c, contiene } = E;
const fs = require("fs"), path = require("path");
const raiz = f => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
console.log("\n▶ 61 · Un docente, dos grupos a la vez");

const motor = raiz("assets/js/motor.js");
const llamada = raiz("assets/js/llamada.js");
const aula = raiz("assets/js/aula.js");
const clase = raiz("assets/js/clase.js");

// ---------------------------------------------------------------- a) el estado, en UN solo sitio
// Antes cada pantalla decidía «cuál es su grupo» a su manera: la sala buscaba el que estuviera en
// marcha, el aula y la llamada cogían el primero que devolviera Firestore — que no promete orden.
c(/function estadoDelPER/.test(motor), "🔴 el estado de un grupo se calcula en un solo sitio (motor.js)");
c(/en marcha|por empezar/.test(motor) && /misPERs/.test(motor),
  "   y misPERs lo devuelve ya puesto, para que nadie lo recalcule a su manera");
c(/ORDEN\s*=\s*\{[^}]*"en marcha"\s*:\s*0/.test(motor),
  "🔴 y la lista llega ORDENADA: los vivos primero, los pasados al final");

// ---------------------------------------------------------------- b) la llamada a filas
c(/estado !== "pasado" && !x\.archivado/.test(llamada),
  "🔴 la llamada NO ofrece grupos terminados ni archivados: nadie de los presentes podría fichar");
c(/estado === "en marcha"/.test(llamada) && /enMarchaYa\[0\] \|\| GRUPOS\[0\]/.test(llamada),
  "🔴 y por defecto abre el que está EN MARCHA, no el primero de la lista");
c(/class="ll-grupo"/.test(llamada),
  "🔴 con la llamada abierta se ve DE QUÉ GRUPO es: decía «Para todo el grupo» sin nombrarlo");
c(/class="ll-ojo"/.test(llamada),
  "   y con más de uno abierto se avisa en ámbar, no en un desplegable que se pasa por alto");
// El caso que rompía: llamada abierta en A, entras a dar clase a B y te encontrabas la de A.
c(/Promise\.all\(GRUPOS\.map/.test(llamada),
  "🔴 se busca llamada abierta en TODOS sus grupos, no solo en el que tocaba por defecto");
c(/function soloPasados/.test(llamada),
  "y si todos sus grupos han terminado se dice, en vez de dejarle abrir una llamada inútil");

// ---------------------------------------------------------------- c) el aula
c(/estado !== "pasado" && !x\.archivado/.test(aula),
  "🔴 el aula puede MIRAR un grupo pasado, pero nunca ABRE en uno");
c(/PRESENTES = \[\]/.test(aula.slice(aula.indexOf("selG.onchange"))),
  "🔴 al cambiar de grupo se borra la lista de presentes: enseñaba los de la otra clase");
c(/function coletilla/.test(aula) && /function coletilla/.test(llamada),
  "los dos desplegables dicen en qué semana va cada grupo (dos grupos con nombre parecido)");
// Ante la duda, callarse: una coletilla falsa engaña más que ninguna.
[["llamada.js", llamada], ["aula.js", aula]].forEach(function (par) {
  c(/if \(g\.estado !== "pasado"\) return "";/.test(par[1]),
    "🔴 " + par[0] + ": sin estado no se dice «terminado» de un grupo que puede estar vivo");
});

// ---------------------------------------------------------------- d) la sala del docente
c(/vivos=mios\.filter/.test(clase) && /estadoPer\(suyo\)!=='en marcha'/.test(clase),
  "🔴 la sala no se queda pegada al grupo recordado si ya terminó y hay otro en marcha");

// ---------------------------------------------------------------- e) el escuadrón, por grupo
// Esto ya estaba bien y tiene que seguir estándolo: la restricción se resuelve leyendo EL grupo que
// se abre, no un dato guardado de antes.
c(/doc\(db, "projects", perId\)/.test(motor) && /restrictedFactionId/.test(motor),
  "🔴 el escuadrón al que se restringe se lee del grupo que se abre, no de uno recordado");

// ---------------------------------------------------------------- f) el Mercado dice la verdad
// 🔴 El traductor mandaba `descripcion`/`maximo` donde el Apps Script dice `desc`/`max`. Sin error:
// el Mercado salía sin una sola descripción y, como `x.max` llegaba undefined, `!x.max` era true y
// TODO parecía repetible — «Ya la tienes» no salía nunca en las seis recompensas que tienen tope.
// El servidor sí lo deniega (storePurchase.js comprueba maxPerUser), pero la pantalla mentía.
const traductor = raiz("motor/tablero.js");
c(/\bdesc: r\.description/.test(traductor), "🔴 el traductor manda `desc`, que es lo que lee la Nave");
c(/\bmax: r\.maxPerUser/.test(traductor), "🔴 y `max`, o el tope de compra no se vería nunca");
c(!/descripcion: r\.description|maximo: r\.maxPerUser/.test(traductor),
  "   y no quedan los nombres rebautizados que nadie leía");

// ---------------------------------------------------------------- g) nada de formularios fantasma
// Con el motor nuevo NO hay Bitácora de mando. Mandar a un recluta a buscar un formulario de Google
// que ya no existe es la peor primera pantalla posible.
const nave = raiz("assets/js/recluta.js");
const puerta = nave.slice(nave.indexOf("CID||motorNuevo()"), nave.indexOf("CID||motorNuevo()") + 400);
c(/motorNuevo\(\)\?'te alistaste'/.test(puerta),
  "🔴 la puerta de la Nave no nombra la Bitácora de mando cuando el motor es el nuevo");

// ---------------------------------------------------------------- h) la fecha de cada reto
// La Nave pinta «✓ Registrado · <fecha>» desde el principio, pero NINGÚN motor producía
// `retos_fecha`: la fecha no salía nunca y no dejaba hueco, así que nadie lo notó.
const fuente = raiz("assets/js/fuente.js");
c(/misFechas/.test(fuente) && /missionTimestamps/.test(fuente),
  "🔴 el motor nuevo sí da la fecha de cada reto (retos_fecha), que nadie producía");

E.resumen("Un docente, dos grupos a la vez");
