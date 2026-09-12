'use strict';
// 56 · LA FIESTA: QUE SE NOTE, Y QUE NO MOLESTE
//
// Un sistema puede estar perfecto por dentro y sentirse muerto por fuera. Marcas un reto, la página
// se repinta y el número es otro: nadie celebra un número que cambia solo. Esta batería vigila que
// las señales de «aquí ha pasado algo» existan — y, sobre todo, las tres cosas que las convierten
// en un problema si se hacen mal.
const E = require("./entorno.js");
const { comprobar: c } = E;
const fs = require("fs"), path = require("path");
const js = f => fs.readFileSync(path.join(__dirname, "..", "assets", "js", f), "utf8");
const sinComentarios = t => t.replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
console.log("\n▶ 56 · La fiesta");

const F = js("fiesta.js"), FC = sinComentarios(F);
const R = js("recluta.js"), RC = sinComentarios(R);
const CSS = fs.readFileSync(path.join(__dirname, "..", "assets", "css", "stargate.css"), "utf8");

// ---------------------------------------------------------------- a) nadie se marea
// 🔴 Hay gente que con esto se marea de verdad. El sistema operativo ya lo dice; solo hay que
// hacerle caso. Y hacerle caso NO es quitar la información: es quitar el viaje.
c(/prefers-reduced-motion/.test(F), "🔴 se pregunta al sistema si quiere menos movimiento");
c(/var quieto = /.test(FC), "   y se guarda la respuesta");
c(/if \(quieto \|\| desde === hasta\) \{ el\.textContent = hasta; return; \}/.test(FC),
  "🔴 con movimiento reducido el contador SALTA al valor final: nadie se queda sin saber qué tiene");
c(/function salta[\s\S]{0,90}if \(quieto\) return;/.test(FC), "   las cifras que vuelan no aparecen");
c(/function chispas[\s\S]{0,120}if \(quieto\) return;/.test(FC), "   ni las partículas");
c(/prefers-reduced-motion/.test(CSS), "   y la hoja de estilos también lo respeta");

// ---------------------------------------------------------------- b) el sonido no se impone
// Esto se abre en clase, con el proyector puesto. Un sonido que empieza solo es una falta de
// educación, y además los navegadores no lo permiten sin un gesto previo.
c(/localStorage\.getItem\(KEY_SON\) !== "no"/.test(FC), "🔴 el sonido se puede apagar y se recuerda");
c(/function montarInterruptor/.test(F), "   hay un interruptor visible");
c(/id="sg-son"/.test(CSS) || /#sg-son/.test(CSS), "   con su sitio en la hoja de estilos");
c(/motorNuevo\(\) && window\.SG && SG\.FIESTA\) SG\.FIESTA\.montarInterruptor/.test(RC),
  "   y solo aparece donde de verdad suena algo: un botón de silenciar lo que no suena es una promesa incumplida");
c(!/autoplay|\.play\(\)/.test(FC), "🔴 nada se reproduce solo al cargar la página");
c(/a\.state === "suspended"/.test(FC), "   y se reanuda el audio tras el primer gesto, como exige el navegador");

// ---------------------------------------------------------------- c) no carga nada
// Cero ficheros de sonido: se sintetizan. Ni una petición más, y suena igual sin conexión — que en
// un aula pasa más de lo que parece.
c(/createOscillator/.test(F), "🔴 los sonidos se sintetizan en el navegador");
c(!/\.mp3|\.ogg|\.wav|new Audio\(/.test(FC), "   no se descarga ni un fichero de audio");

// ---------------------------------------------------------------- d) la fiesta nunca rompe nada
// Si algo falla celebrando, el reto YA está registrado. Celebrar es lo último que debe importar.
["function reto(", "function canje("].forEach(function (fn) {
  const a = FC.indexOf(fn);
  const cuerpo = FC.slice(a, FC.indexOf("\n  function ", a + 10));
  c(/try \{/.test(cuerpo) && /catch \(e\)/.test(cuerpo),
    "🔴 " + fn.replace("function ", "").replace("(", "") + " se traga sus errores: lo guardado está guardado");
});

// ---------------------------------------------------------------- e) la foto, antes del repintado
// 🔴 Entre el clic y la celebración la Nave se repinta entera. Si la foto de «cómo estaba» o de
// «dónde se pulsó» se toma después, la primera sale igual que la de ahora (no se celebra nada) y la
// segunda mide cero (la cifra sale del centro de la pantalla, lejos del botón).
c(/var antes=st\.yo\?JSON\.parse\(JSON\.stringify\(st\.yo\)\):\{\};/.test(RC),
  "🔴 se fotografía la ficha ANTES de escribir, y se copia: guardar la referencia no sirve de nada");
c(/var donde=puntoDe\(boton\);/.test(RC), "   y dónde se pulsó, también antes");
c(/function refrescarYCelebrar/.test(R), "hay un solo camino de «refrescar y celebrar»");
const rc = RC.slice(RC.indexOf("function refrescarYCelebrar"));
c(rc.indexOf("render();") < rc.indexOf("SG.FIESTA"),
  "🔴 primero se repinta y DESPUÉS se celebra: los contadores necesitan que los elementos existan");
c(/typeof el\.x === "number"/.test(FC),
  "   y la fiesta acepta coordenadas ya tomadas, no solo elementos vivos");

// ---------------------------------------------------------------- f) lo que se celebra
c(/SONIDOS = \{/.test(F), "hay un catálogo de sonidos");
["xp", "moneda", "gasto", "nivel", "insignia", "error"].forEach(function (k) {
  c(new RegExp("\\b" + k + ": function").test(F), "   suena «" + k + "»");
});
c(/function nivelNuevo/.test(F), "🔴 subir de nivel para la pantalla: si no se nota, no es subir de nivel");
c(/nueva[s]? = \(ahora\.insignias \|\| \[\]\)\.filter/.test(FC),
  "y las insignias NUEVAS se deducen comparando: el que llama no tiene que acordarse de nada");
c(/\(ahora\.nivel \|\| 0\) > \(antes\.nivel \|\| 0\)/.test(FC), "   igual que el cambio de nivel");
c(/gasto/.test(FC) && /dcr > 0 \? "moneda" : "gasto"/.test(FC),
  "🔴 ganar y gastar no suenan igual: uno sube y el otro baja");

E.resumen("La fiesta");
