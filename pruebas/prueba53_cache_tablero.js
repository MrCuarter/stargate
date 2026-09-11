'use strict';
// 53 · LA CACHÉ DEL TABLERO: QUE CACHEE, Y QUE NO ENVENENE EL MOTOR
//
// Por qué existe: calcular el tablero cuesta ~2 s con 12 reclutas y hasta 10 s en el peor caso
// medido en producción. Cada visita a la Nave lo recalcula ENTERO para devolver UNA ficha. Con 200
// alumnos por PER abriendo la Nave en la misma clase, son 200 peticiones contra el tope de 30
// ejecuciones simultáneas de Apps Script: el primero espera y el resto recibe error.
//
// 🔴 Y por qué esta batería existe: el primer intento pasó en verde sin cachear NADA. El mock no
// tenía `CacheService`, el try/catch se tragaba el «no está definido» y la caché era un no-op
// silencioso. Una caché que no cachea y no lo dice es peor que no tenerla, porque crees que has
// arreglado el problema.
//
// 🔴 Y la segunda lección, que costó 50 fallos en 20 baterías: al cachear `tablero_` para todo el
// mundo, el motor se envenenó. `resolverCanje_` y compañía llaman al tablero, escriben, y vuelven a
// llamarlo esperando ver su propia escritura. Una caché es segura para CONTESTAR a un navegador y
// venenosa en medio de una transacción.
const E = require("./entorno.js");
const { comprobar: c, igual } = E;
const fs = require("fs"), path = require("path");
console.log("\n▶ 53 · La caché del tablero");

const G = E.nuevoMundo();
E.crearPERDemo(G);
const PER = "prueba-banco", PIN = "0000";
G.PropertiesService.getScriptProperties().setProperty("PIN_PROFES", PIN);
const api = b => JSON.parse(G.doPost({ postData: { contents: JSON.stringify(b) } }).getContent());
E.enviarBitacora(G, PER, { email: "ana@alumno.es", alias: "Ana", profe: "Mr Cuarter" });

// espía: cuántas veces se hace el cálculo caro de verdad
const original = G.tableroCalcular_;
let calculos = 0;
G.tableroCalcular_ = function () { calculos++; return original.apply(null, arguments); };
const cuenta = f => { const a = calculos; f(); return calculos - a; };

// ---------------------------------------------------------------- a) la caché existe y cachea
E.M.Cache.vaciar();
igual(cuenta(() => api({ accion: "quien", per: PER, email: "ana@alumno.es" })), 1,
  "la primera visita calcula el tablero");
igual(cuenta(() => api({ accion: "quien", per: PER, email: "ana@alumno.es" })), 0,
  "🔴 la segunda NO lo calcula: sale de la caché");
igual(cuenta(() => api({ accion: "quien", per: PER, email: "otro@alumno.es" })), 0,
  "🔴 y otro alumno distinto TAMPOCO: es el mismo tablero (esto es lo que salva la clase de 200)");

// y devuelve lo mismo, no una versión recortada
const desdeCache = api({ accion: "quien", per: PER, email: "ana@alumno.es" });
igual(desdeCache.yo.alias, "Ana", "lo que sale de la caché es la ficha buena");

// ---------------------------------------------------------------- b) un apunte nuevo la tira
// La clave lleva el número de filas de las hojas que alimentan el tablero: cualquier escritura la
// cambia sola. Contar a mano los puntos de escritura es una carrera que se pierde — se perdió.
E.enviarBitacora(G, PER, { email: "luis@alumno.es", alias: "Luis", profe: "Mr Cuarter" });
igual(cuenta(() => api({ accion: "quien", per: PER, email: "ana@alumno.es" })), 1,
  "🔴 tras alistarse alguien nuevo, se vuelve a calcular");
igual(api({ accion: "quien", per: PER, email: "luis@alumno.es" }).yo.alias, "Luis",
  "   y el recién llegado se ve al momento, no en 45 segundos");

// registrar un reto también cuenta (editar la Bitácora añade fila: es una respuesta nueva)
E.enviarBitacora(G, PER, { email: "ana@alumno.es", alias: "Ana", profe: "Mr Cuarter",
  marcados: E.marcar(G, [G.RETOS_REGULAR.filter(r => r[0] === "A1")[0][1]]) });
igual(cuenta(() => api({ accion: "quien", per: PER, email: "ana@alumno.es" })), 1,
  "🔴 registrar un reto también tira la caché: el alumno ve sus xp al momento");

// ---------------------------------------------------------------- c) el motor NUNCA usa la caché
// Esto es lo que rompió 20 baterías al primer intento.
const gs = fs.readFileSync(path.join(__dirname, "..", "apps-script", "Code.gs"), "utf8");
const CODIGO = gs.replace(/^\s*\/\/.*$/gm, "");
c(/function tablero_\(perId, conPrivados\) \{ return tableroCalcular_\(perId, conPrivados\); \}/.test(CODIGO),
  "🔴 `tablero_` —el que usa el motor— calcula SIEMPRE, sin caché");
const usos = (CODIGO.match(/tableroCache_\(/g) || []).length;
igual(usos, 3, "y la versión con caché se usa en exactamente 3 sitios (su definición y las dos respuestas HTTP)");
["resolverCanje_", "revertirCanje_", "registrarEventos_"].forEach(function (fn) {
  const a = CODIGO.indexOf("function " + fn);
  if (a < 0) return;
  const cuerpo = CODIGO.slice(a, CODIGO.indexOf("\nfunction ", a + 10));
  c(cuerpo.indexOf("tableroCache_") < 0, "🔴 " + fn + " no toca la caché");
});

// un canje sigue viendo el dinero de verdad, no el de hace un rato
E.reclutaRico(G, PER, "eva@alumno.es");
const saldo = () => G.tablero_(PER, true).reclutas.filter(x => x.email === "eva@alumno.es")[0].creditos;
const antes = saldo();
E.enviarCanje(G, PER, { email: "eva@alumno.es", recompensa: "Sobre de cromos — 15 créditos" });
c(saldo() === antes - 15, "🔴 canjear descuenta de verdad: el motor no lee un saldo caducado");

// ---------------------------------------------------------------- d) si la caché falla, se sigue
// CacheService puede no estar disponible o reventar. Eso no puede tumbar la Nave.
const guardar = E.M.Cache.getScriptCache;
E.M.Cache.getScriptCache = function () { throw new Error("cache caída"); };
const conCacheRota = api({ accion: "quien", per: PER, email: "ana@alumno.es" });
igual(conCacheRota.yo.alias, "Ana", "🔴 con la caché rota, la Nave sigue funcionando (más lenta, pero viva)");
E.M.Cache.getScriptCache = guardar;

// ---------------------------------------------------------------- e) troceado, porque 200 no caben
// Un recluta ocupa ~1,5 KB: 200 son ~290 KB y CacheService admite 100 KB por hueco.
c(/CACHE_TROZO/.test(gs), "🔴 la caché se trocea: con 200 reclutas el tablero no cabe en un solo hueco");
c(/if \(n > 8\) return;/.test(CODIGO),
  "   y si ni troceado cabe, se renuncia a cachear en vez de guardar algo a medias");
c(/CACHE_TABLERO_S = 45/.test(gs),
  "caduca en 45 s: es el único freno para una fila EDITADA, que no cambia el número de filas");

E.resumen("La caché del tablero");
