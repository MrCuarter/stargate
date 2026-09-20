'use strict';
/**
 * Batería 98 · LA NAVE DEL COMANDANTE Y «GESTIONAR GRUPOS» (19-sep). Norberto: «la página inicial del docente debería
 * ser visualmente similar a la nave del estudiante… tantas pestañas como grupos activos», «simplicidad máxima en la
 * página principal: nada que se use una o dos veces en todo el curso» y «para gestionar grupos enteros (solo el
 * referente) debería haber una página dedicada». Decidido con un borrador dibujado y sus preguntas.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const leer = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt); };
const K = leer("assets/js/consola.js"), M = leer("assets/js/motor.js"), S = leer("assets/js/sesion.js"), B = leer("_build_site.py"),
      D = leer("_site_data.py"), CSS = leer("assets/css/stargate.css"), G = fs.existsSync(path.join(R, "gestion.html")) ? leer("gestion.html") : "";
const GP = "/Users/nor/Claude/vibewebs/gamificapro/functions/stargateAlumno.js", SA = fs.existsSync(GP) ? fs.readFileSync(GP, "utf8") : "";

// 1 · la Nave: se entra directo en el grupo, con la ficha de la Nave del recluta
c(/if \(ultimo && V\.some\(function \(p\) \{ return p\.id === ultimo; \}\)\) return abrir\(ultimo\);/.test(K) && /localStorage\.setItem\(CLAVE_ULTIMO, perId\)/.test(K), "🔴 se entra directo en el grupo (el último que abriste, o el primero en marcha)");
// 20-sep · «la caja de la ficha del comandante quizá pueda ocupar todo el ancho (aumenta avatar, más info del docente…)»
c(/<div class="card cn-ficha ancha">/.test(K) && /class="cn-ficha-c"/.test(K) && /class="monedas"/.test(K) && /\.cn-ficha img\.av\{width:140px/.test(CSS),
  "🔴 la ficha del comandante ocupa todo el ancho, con el avatar grande y sus cifras");
c(/\(TAB === "portada" \? heroComandante\(\) : ""\)/.test(K), "   solo en el Puente (en las demás secciones, al grano)");
c(/var SECCIONES = \[\["puente"/.test(K) && ["nave", "gente", "rankings", "zoco", "premios"].every(k => new RegExp("assets/img/nave/iconos/" + k + "\\.png").test(K)), "🔴 las secciones del grupo, con los iconos del menú de la Nave");
c(!/\["equipo", "Equipo docente", 1\]/.test(K.slice(K.indexOf("var TABS ="), K.indexOf("var TABS =") + 600)), "   sin equipo, escuadrones ni ajustes (se fueron a «Gestionar grupos»)");
// 20-sep · «código de clase y copiar invitación muévelo a Mi gente»: ya no sale en el Puente ninguna semana
c(!/codigoClase\(PER, codigo\)/.test(K) && /¿Falta alguien\?/.test(K) && /codigoClase\(PER, cod\)/.test(K), "🔴 el código de clase vive solo en «Reclutas»");
c(!/function tarjetaGrupo/.test(K) && !/gp-mas/.test(K), "🔴 nada de lo que se usa una o dos veces en la portada: ni fichas de «Mis grupos», ni «⋯»");
// 2 · Gestionar grupos
c(/var GESTION = !!window\.SG_GESTION;/.test(K) && /window\.SG_GESTION=1/.test(G), "🔴 «Gestionar grupos» (gestion.html): la misma consola en su otro modo");
c(/\("gestion\.html","Gestionar grupos","gest","referente"\)/.test(B), "   en la barra de arriba, solo para el referente");
c(/var GTABS = \[\["alumnado"/.test(K) && ["equipo", "escuadrones", "ajustes", "calendario", "cerrar"].every(k => new RegExp('\\["' + k + '", "').test(K)), "   con alumnado, equipo, escuadrones, ajustes, calendario y «Cerrar el curso»");
c(/'<a class="btn primary" href="crear\.html">\+ Crear un grupo<\/a>/.test(K), "   y «+ Crear un grupo»");
c(/var edita = soyRefAqui\(\) && GESTION;/.test(K), "🔴 el calendario se edita solo allí");
c(/esRef && GESTION \? '<div class="ficha-ref">/.test(K), "🔴 congelar, cambiar de comandante, dar de baja y mover: en la ficha, solo desde «Gestionar grupos»");
c(/function verCerrar\(t\)/.test(K) && /"stargate\.archivado": arch \? false : Date\.now\(\)/.test(K), "   graduar y archivar (o reabrir) en «Cerrar el curso»");
// 3 · mover a un recluta de grupo
c(/async function moverRecluta\(perId, fichaId, destino\)/.test(M) && /alumno\(perId, fichaId, "mover", \{ destino \}\)/.test(M), "🔴 mover a un recluta: el motor se lo pide al servidor");
c(/ACCIONES_ALUMNO = \['congelar', 'descongelar', 'baja', 'mover'\]/.test(SA) && /export function planDeTraslado/.test(SA) && /async function moverDeGrupo/.test(SA), "🔴 y el servidor traduce su ficha al otro grupo (GamificaPro · stargateAlumno)");
c(/tienes que ser referente de los dos grupos/.test(SA) && /Tiene subidas de nota esperando en la Cola/.test(SA) && /Un grupo es regular y el otro PUA/.test(SA), "   con sus condiciones: referente de los dos, sin Cola pendiente, mismo tipo de grupo");
// 4 · la sesión de las semanas 1 y 2
c(/function diaUnete\(\)/.test(S) && /\(Number\(s\.sem\)\|\|1\)<=2\) d\.push\(diaUnete\(\)\)/.test(S) && /M\.invitacion\(\{id:st\.per, codigo:c\}\)/.test(S), "🔴 sesión · «Únete a la clase» en las semanas 1 y 2, con el código y «Copiar la invitación para el chat»");
c(/\("unete", "Únete a la clase"/.test(D), "   y se puede quitar desde la rueda, como las demás");
c(/\.dia\.unete \.un-cod\{/.test(CSS), "   con el código en grande (se proyecta)");

console.log("\n  Batería 98 · la Nave del Comandante y «Gestionar grupos» (19-sep)");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
