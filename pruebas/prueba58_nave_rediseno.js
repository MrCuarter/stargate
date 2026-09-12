'use strict';
// 58 · LA NAVE REDISEÑADA · lo que no puede volver atrás
//
// El 12-sep la Nave pasó de seis pestañas a cinco, de dos barras fijas a una, y estrenó el bloque de
// retos de la semana, el botín, ocho rankings y la llamada a filas. Esta batería no comprueba que
// «se vea bien» —eso se mira con los ojos— sino las decisiones que costaron pensarse y que una
// refactorización distraída desharía sin que saltara nada.
const E = require("./entorno.js");
const { comprobar: c, igual } = E;
const fs = require("fs"), path = require("path");
const js = f => fs.readFileSync(path.join(__dirname, "..", "assets", "js", f), "utf8");
console.log("\n▶ 58 · La Nave rediseñada");

const NAVE = js("recluta.js"), TABLERO = js("tablero.js"), MOTOR = js("motor.js");
const AULA = js("aula.js"), LLAMADA = js("llamada.js"), CSS = fs.readFileSync(
  path.join(__dirname, "..", "assets", "css", "stargate.css"), "utf8");

// ---------------------------------------------------------------- a) cinco pestañas, y las viejas no rompen
igual((NAVE.match(/\['(nave|retos|botin|mercado|rankings)','/g) || []).length, 5,
  "🔴 cinco pestañas, ni una más: seis mezclaban hacer, tener y comprar");
c(/TABS_VIEJAS=\{ficha:'nave',semana:'nave',planetas:'retos',premios:'mercado',tablero:'rankings'\}/.test(NAVE),
  "🔴 y los identificadores VIEJOS siguen funcionando: un enlace guardado a #premios no puede dar error");
c(/if\(TABS_VIEJAS\[k\]\) k=TABS_VIEJAS\[k\];/.test(NAVE), "   la traducción ocurre antes de validar");

// ---------------------------------------------------------------- b) una sola barra, con los contadores dentro
c(/function pestanas\(\)[\s\S]{0,900}nave-barra-u/.test(NAVE), "hay una barra única");
c(/id="nb-xp"/.test(NAVE) && /id="nb-cr"/.test(NAVE),
  "🔴 los contadores viven en la barra: si no, marcar un reto desde otra pestaña celebra en una cifra que nadie mira");
const cssBarra = CSS.slice(CSS.indexOf(".nave-barra-u{"), CSS.indexOf(".nave-barra-u{") + 260);
c(/position:sticky;top:47px;z-index:15/.test(cssBarra),
  "🔴 la barra se pega DEBAJO del menú de la web (47 px) y por debajo en z: encima lo dejaba inalcanzable");
c(/body\.embed \.nave-barra-u\{top:0\}/.test(CSS),
  "   y arriba del todo cuando va incrustada, que ahí no hay menú");
c(NAVE.indexOf("function accesos()") < 0,
  "🔴 la parrilla de accesos ya no existe: era el puente a los formularios de Google");
c(/function menuMas\(\)/.test(NAVE), "   lo ocasional vive en el menú «···»");
c(/montarInterruptor\('nb-fiesta'\)/.test(NAVE), "   y el interruptor de sonido se mete ahí dentro");

// ---------------------------------------------------------------- c) los retos de la semana
c(/function retosDeLaSemana\(\)/.test(NAVE), "el bloque de retos de la semana existe");
c(/function pasosDeReto\(txt\)/.test(NAVE),
  "🔴 el paso a paso sale de PARTIR la explicación del catálogo, no de un texto escrito aparte");
c(/if\(out\.length && f\.length<42\)/.test(NAVE),
  "   y las frases cortas se pegan a la anterior: «Piénsalo para aula invertida.» no es un paso");
c(/rs-premio"><span class="p xp">\+'\+t\[3\]\+' xp/.test(NAVE), "cada reto enseña los xp que da");
c(/creditosDeReto\(t\[0\]\)/.test(NAVE), "   y los créditos");
c(/P\.creditosDe\(\{id:id\},tipo,cat\)/.test(NAVE),
  "🔴 los créditos los calcula la MISMA regla que siembra el grupo, no una copia que se desincronice");
c(/data-hecho="'\+esc\(t\[0\]\)/.test(NAVE), "y se marca desde ahí mismo");
c(/rs-atras[\s\S]{0,200}sin registrar de semanas anteriores/.test(NAVE),
  "🔴 y la línea de atrasados, que es el dato que más mueve y no estaba en ninguna parte");
const evid = NAVE.slice(NAVE.indexOf("function marcarReto"), NAVE.indexOf("function marcarReto") + 700);
c(/querySelectorAll\('\[data-ev="'\+id\+'"\]'\)/.test(evid),
  "🔴 la evidencia se busca en los DOS sitios donde puede estar (la tarjeta y la pestaña de retos)");

// ---------------------------------------------------------------- d) el botín, todo junto
c(/function botin\(\)/.test(NAVE), "«Mi botín» existe");
["🏅 Insignias", "🃏 Tu álbum", "🎭 Personajes"].forEach(function (t) {
  c(NAVE.indexOf(t) >= 0, "   y recoge «" + t + "»");
});
c(/function badgesCronologicos\(\)/.test(NAVE), "las insignias van en el orden en que se ganan");
c(/\(st\.semanas \|\| SEM \|\| \[\]\)\.forEach/.test(NAVE),
  "🔴 y ese orden sale del CALENDARIO, no de una lista aparte: mover un reto de semana reordena la colección sola");

// ---------------------------------------------------------------- e) ocho rankings, y el de equipos por media
const MODOS = (TABLERO.match(/\{k:'[a-z]+'/g) || []).length;
igual(MODOS, 8, "🔴 ocho rankings: no ocho veces el mismo dato, ocho datos distintos");
c(/porEquipos:true/.test(TABLERO), "uno compara escuadrones");
c(/Math\.round\(suma\/g\.length\)/.test(TABLERO),
  "🔴 por MEDIA por recluta: sumando ganaría siempre el más numeroso y la tabla mediría cuánta gente hay");
c(/soloSiSeQuienSoy:true/.test(TABLERO), "«Mi escuadrón» solo sale donde se sabe quién eres");
c(/window\.SG_YO_ALIAS/.test(TABLERO) && /window\.SG_YO_ALIAS/.test(NAVE),
  "   y la Nave se lo dice; en el tablero proyectado no hay nadie y por eso no aparece");
c(/window\.SG_RANKING_REPINTA/.test(TABLERO) && /SG_RANKING_REPINTA\(\)/.test(NAVE),
  "🔴 con un tirador para repintarlo: se pinta al cargar, antes de que la Nave sepa quién eres");
c(/escuadrones: \(\(P\.factions \|\| \[\]\)\)/.test(
    fs.readFileSync(path.join(__dirname, "..", "motor", "tablero.js"), "utf8")),
  "los escuadrones salen del tablero, con emblema y lema");

// ---------------------------------------------------------------- f) la llamada a filas
c(/attendance_sessions/.test(MOTOR) && /attendance_records/.test(MOTOR),
  "🔴 la llamada usa la asistencia que GamificaPro YA tenía: no se ha inventado un sistema paralelo");
c(/source: "attendance_session_auto_reward"/.test(MOTOR),
  "   y paga por la fuente que el servidor verifica");
c(/idempotencyKey: "xp_attendance_"/.test(MOTOR), "   con clave de idempotencia: fichar dos veces no cobra dos veces");
c(/restrictedFactionId/.test(MOTOR), "🔴 y se restringe al escuadrón de quien la toca, no a todo el grupo");
// La palabra solo aparece en el comentario que explica POR QUÉ no la hay. En el código, ni rastro.
const codigoMotor = MOTOR.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
c(codigoMotor.indexOf("palabra") < 0 && codigoMotor.indexOf("consigna") < 0,
  "🔴 sin palabra secreta: en Firestore, un sitio donde comprobarla es un sitio donde leerla antes");
c(/function vigilarLlamada/.test(MOTOR) && /onSnapshot/.test(MOTOR),
  "🔴 llega EN DIRECTO por escucha, no preguntando: con 200 alumnos serían 1.200 lecturas por minuto");
c(/function fichar\(\)/.test(NAVE) && /ficharLlamada\(per, st\.yo\.ficha\)/.test(NAVE),
  "la Nave ficha con su propia ficha");
c(/yo_\.ficha = f\.id/.test(js("fuente.js")),
  "🔴 y conoce su identificador porque se le da: el tablero público no lo trae, y así sigue");

// ---------------------------------------------------------------- g) los embeds, universales
[["llamada.js", LLAMADA], ["aula.js", AULA]].forEach(function (par) {
  c(/misPERs\(YO\.correo\)/.test(par[1]),
    "🔴 " + par[0] + " deduce el grupo de QUIÉN PULSA: el enlace no lo lleva dentro");
  c(/noEresComandante|noEresDocente/.test(par[1]),
    "   y explica al alumnado que eso no es suyo en vez de darle un error");
});
c(/noEresComandante/.test(LLAMADA),
  "🔴 el Genially se PROYECTA: a quien no es docente se le explica, no se le da un error");
["premiar", "regalarCromo"].forEach(function (f) {
  c(new RegExp("async function " + f).test(MOTOR), "el motor sabe «" + f + "»");
});
c(/perId \+ "__cromo_"/.test(MOTOR),
  "🔴 y la carta regalada se guarda con el identificador de DOCUMENTO, o el álbum no sabría leerla");

// ---------------------------------------------------------------- h) los rankings ordenan de verdad
// 🔴 `planetas_completos` es un ARRAY con los temas cerrados, no un contador. El ranking «Explorador»
// lo restaba como número: `[1,2] - [1]` es NaN, el `sort` no ordena nada y la tabla sale en el orden
// en que llegaron los datos — pareciendo un ranking. Sin error, claro.
c(/Array\.isArray\(v\)\?v\.length/.test(TABLERO),
  "🔴 el ranking de planetas cuenta la LONGITUD del array, no el array");
// Y de paso: ningún modo puede devolver algo que no sea un número.
const CAMPOS_VAL = TABLERO.match(/val:function\(p\)\{return [^}]+\}/g) || [];
c(CAMPOS_VAL.length >= 6, "hay un extractor de valor por ranking");
CAMPOS_VAL.forEach(function (f) {
  c(/\|\|\s*0|\?v\.length|p\.xp;|pctCol/.test(f),
    "   y todos se defienden de que falte el dato: " + f.slice(0, 46));
});

E.resumen("La Nave rediseñada");
