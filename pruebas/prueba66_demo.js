'use strict';
/**
 * BATERÍA 66 · LA DEMO DEL ESCAPARATE
 *
 * El botón DEMO de la portada enseña la Nave de un estudiante sin cuenta. Tres promesas que no se
 * pueden romper sin que nadie lo note hasta que sea tarde:
 *   1. NO CADUCA: dentro de un año sigue en la semana 10, no en un curso terminado.
 *   2. NO ESCRIBE: todo lo que guarda pasa por un embudo que la demo cierra.
 *   3. TIENE SALIDA: el visitante puede entrar de verdad o volver.
 * La 1 es la traicionera: un fallo ahí no se ve hoy —hoy ES la semana 10— sino en noviembre.
 */
const E = require("./entorno.js");
const { comprobar: c } = E;
const fs = require("fs"), path = require("path");
const raiz = f => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
console.log("\n▶ 66 · La demo del escaparate");

const T = require("../motor/tablero.js");
const cat = JSON.parse(raiz("motor/catalogo.json"));
const DIA = 864e5;
const hace = dias => new Date(Date.now() - dias * DIA).toISOString().slice(0, 10);
function datos(stargate) {
  return { proyecto: { id: "x", name: "STARGATE · DEMO", stargate: Object.assign({ version: 3, tipo: "REGULAR" }, stargate) },
           misiones: [], campanas: [], recompensas: [], perfiles: [], catalogo: cat };
}

// ---------------------------------------------------------------- 1 · no caduca
[["hoy", 9 * 7], ["dentro de dos meses", 9 * 7 + 60], ["dentro de un año", 9 * 7 + 365], ["dentro de cinco años", 9 * 7 + 5 * 365]]
  .forEach(([cuando, dias]) => {
    const t = T.tablero(datos({ inicio: hace(dias), demoSemana: 10 }), false);
    c(t.semana === 10, "🔴 la demo sigue en la semana 10 " + cuando + " (sale la " + t.semana + ")");
  });
{
  // y una clase de VERDAD no se congela: sin `demoSemana`, el calendario manda
  const t = T.tablero(datos({ inicio: hace(365) }), false);
  c(t.semana > 40, "🔴 una clase de verdad NO se congela: sin demoSemana, a un año va por la semana " + t.semana);
}
{
  // y si alguien pide un «ahora» concreto (el opening de otra fecha, una prueba), se respeta
  const ini = hace(9 * 7 + 365);
  const pedido = new Date(ini + "T12:00:00").getTime() + 2 * 7 * DIA;
  const t = T.tablero(datos({ inicio: ini, demoSemana: 10 }), false, pedido);
  c(t.semana === 3, "   un «ahora» pedido a mano gana a la congelación (sale la " + t.semana + ", tocaba la 3)");
}

// ---------------------------------------------------------------- 2 · no escribe
const N = raiz("assets/js/recluta.js");
c(/function enDemo\(\)/.test(N), "hay UNA pregunta «¿estamos en la demo?», no una en cada botón");
c(/function post\(cuerpo,cb,err\)\{[\s\S]{0,900}if\(enDemo\(\)\)/.test(N),
  "🔴 el embudo por el que salen TODAS las escrituras se cierra en la demo");
{
  // cada escritura de la Nave tiene su explicación: si no, el aviso diría «guardaría el cambio» a secas
  const acciones = (N.match(/post\(\{accion:'([a-z_]+)'/g) || []).map(x => x.replace(/.*'([a-z_]+)'.*/, "$1"));
  const bloque = (N.match(/var QUE_HARIA = \{([\s\S]*?)\};/) || [])[1] || "";
  const sin = acciones.filter(a => bloque.indexOf(a + ":") < 0);
  c(acciones.length >= 7 && sin.length === 0,
    "   y cada una de las " + acciones.length + " escrituras dice qué habría hecho" + (sin.length ? " (faltan: " + sin + ")" : ""));
}
c(/if\(enDemo\(\)\)\{ aviso\([^)]*Presente/.test(N),
  "🔴 fichar en la llamada, que NO pasa por post(), también se frena");
c(/setTimeout\(render, ?60\)/.test(N),
  "   y se repinta: el botón no se queda en «Registrando…» para siempre");

// ---------------------------------------------------------------- 3 · tiene salida
c(/demo-salidas[\s\S]{0,300}href="entrar\.html"/.test(N), "🔴 el cartel de la demo ofrece entrar de verdad");
c(/demo-salidas[\s\S]{0,500}href="index\.html"/.test(N), "   y volver a la presentación");

// ---------------------------------------------------------------- 4 · la portada la enlaza bien
const I = raiz("index.html");
c(/href="recluta\.html\?per=demo-stargate&(amp;)?demo=1"/.test(I), "🔴 la portada tiene el botón DEMO y apunta al grupo del escaparate");
c(!/href="recluta\.html\?per=prueba-humana&(amp;)?demo=1"/.test(I),
  "   y NO a la clase de prueba, que se toca al probar y cambiaría el escaparate");
c(/btn-demo/.test(I) && /btn-google/.test(I), "   y convive con el de Google sin quitarle el protagonismo");

// ---------------------------------------------------------------- 5 · el sembrador
const S = raiz("motor/sembrar_prueba.js");
c(/DEMO \? "STARGATE · DEMO"/.test(S), "🔴 el grupo de la demo lleva «DEMO» en el nombre: es la llave de demoPermitido()");
c(/demoSemana: 10/.test(S), "   y nace congelado en la semana 10");
c(/\.invalid/.test(S) && !/demo[\s\S]{0,400}gmail\.com/.test(S.split("] : [")[0] || ""),
  "   con profesorado de ficción: correos .invalid, que por norma no pueden existir");
c(!/["']清["']/.test(S), "   y sin caracteres colados en los nombres de mentira");

E.resumen("La demo del escaparate");
