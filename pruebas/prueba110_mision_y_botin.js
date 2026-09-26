'use strict';
/**
 * BATERÍA 110 · MISIÓN CUMPLIDA EN GRANDE, MI BOTÍN POR PUERTAS, EL DIFERIDO CON SU ÍNDICE (25-sep)
 *
 * Norberto, en una tanda: «más celebración al completar un reto: una ventana en grande con todo lo que ha ganado…
 * sonidos, NEBULA felicitando… y un botón al Mercado, a El Archivo o a Mi botín según lo que gane»; «en la sesión sale
 * el avatar viejo (en el mensaje de la semana no)»; «en diferido, una primera página con las semanas»; «un botón grande
 * a la sesión de la semana en la orden»; «NEBULA más grande, que toque la base»; «la Bitácora al lado de los créditos»;
 * «Mi botín con tres botones grandes: Insignias, Cromos, Héroes»; «Ver mi álbum, más llamativo y a los cromos»; «los
 * hitos del viaje, en una fila»; «al pulsar su avatar, el vestuario».
 *
 * Se EJECUTA el buscador de la clave del comandante (SG.claveComandante) y se lee lo demás; la ventana, los sonidos y
 * el recorrido con clics, en el laboratorio.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + dato)); };
const STG = L("assets/js/stargate.js"), SES = L("assets/js/sesion.js"), NAVE = L("assets/js/recluta.js"), FI = L("assets/js/fiesta.js");
const SOB = L("assets/js/sobre.js"), CON = L("assets/js/consola.js"), CSS = L("assets/css/stargate.css");

// ── 1 · el comandante de su docente, lo encuentre como lo encuentre
const i0 = STG.indexOf("window.SG.claveComandante = function"), win = { SG: {} };
new Function("window", STG.slice(i0, STG.indexOf("\n};", i0) + 3))(win);
const K = win.SG.claveComandante;
c(typeof K === "function", "SG.claveComandante existe (un sitio para buscar el comandante de un docente)");
c(K({ avatares: { "Norberto Genially": "c17" } }, "Norberto Genially") === "c17", "   exacto");
c(K({ avatares: { "Norberto Genially": "c17", "Ana": "c3" } }, "norberto  genially ") === "c17", "   sin mayúsculas, espacios de más ni tildes");
c(K({ avatares: { "Nórberto": "c9", "Ana": "c3" } }, "Norberto") === "c9", "   (las tildes tampoco separan)");
c(K({ avatares: { "Norberto": "c17" } }, "") === "c17", "   🔴 sin nombre y un solo comandante elegido: ese (antes, el c1 por defecto)");
c(K({ avatares: { "Ana": "c3", "Luis": "c5" } }, "Pedro") === "", "   con varios y ninguno suyo, nada (el c1 lo pone quien pinta)");
c(!/\(\(st\.d&&st\.d\.avatares\)\|\|\{\}\)\[/.test(SES) && (SES.match(/claveComandante\(st\.d, /g) || []).length >= 4, "   la sesión lo busca siempre por ahí");
c(/avatar: window\.SG\.claveComandante\(st\.d, jefe\)/.test(NAVE), "   y la orden de la semana de la Nave también");
c(/var yo = miNombreEn\(p\) \|\| \(dd\.length === 1 \? dd\[0\]\.nombre : ""\)/.test(CON), "   la consola lo copia al grupo aunque la lista privada no traiga su correo (grupo de un docente)");

// ── 2 · en diferido, como recluta y con el índice de semanas
c(/\} else if\(SEGUIR \|\| DIFERIDO\)\{/.test(SES), "🔴 la sesión en diferido identifica al recluta (sin eso: sin su Comandante, sin su panel, sin tope de semana)");
c(/if\(DIFERIDO\) st\.slides=\[diaSemanas\(lista\)\]\.concat\(st\.slides\);/.test(SES), "🔴 en diferido, la primera diapositiva es el índice de semanas");
c(/function diaSemanas\(lista\)/.test(SES) && /k===hoy\?' hoy'/.test(SES) && /abierta=k<=hoy/.test(SES) && /dif-candado/.test(SES),
  "   la de esta semana brilla, las llegadas se abren y las que faltan llevan candado");
c(/b\.onclick=function\(\)\{ irASesion\(Number\(b\.getAttribute\('data-dif-sem'\)\), 1\); \};/.test(SES), "   y pulsar una lleva a su primera diapositiva (la 0 es el índice)");
c(/\.dif-s\.hoy\{/.test(CSS) && /\.dif-grid\{/.test(CSS), "   con su estilo");

// ── 3 · la orden de la semana, NEBULA y la Bitácora
c(/function urlSesion\(sem\)/.test(NAVE) && /class="oc-ses" href="' \+ esc\(urlSesion\(sm\.sem\)\)/.test(NAVE), "🔴 la orden de la semana lleva «Ver la sesión de la semana» (la misma dirección que El Archivo)");
c(/\.oc-pie\{justify-content:space-between/.test(CSS) && /\.oc-ses\{[^}]*margin:0 20px 18px auto/.test(CSS), "   abajo a la derecha, en la esquina contraria al rótulo");
c(/\.nf-nebula img\{width:auto;height:140px;align-self:flex-end/.test(CSS), "NEBULA, más grande y apoyada en la base de su tarjeta");
c(/<span class="nb-bit" id="nb-bit">'\+botonBitacora\(\)\+'<\/span><\/p>'/.test(NAVE), "🔴 la Bitácora, al lado de los créditos");
c(/if\(st\.bit==='' && !SIMULACRO\) return 'Aún no has enlazado tu <b>Bitácora<\/b>/.test(NAVE) && /nb\.innerHTML='<b>NEBULA:<\/b> '\+nebulaDice/.test(NAVE),
  "   sin ella, NEBULA insiste (y deja de hacerlo en cuanto la pone)");
c(/\.monedas \.nb-bitacora\.vacia\{[^}]*animation:bitLlama/.test(CSS), "   y el botón vacío late en ámbar");

// ── 4 · misión cumplida
c(/function mision\(o\)/.test(FI) && /mision: mision/.test(FI), "🔴 SG.FIESTA.mision: la ventana grande");
c(/mision: function \(\) \{/.test(FI) && /tic: function \(\) \{/.test(FI), "   con su fanfarria y el tictac del contador");
c(/if \(!sube\) \{ bar\.style\.width/.test(FI) && /sonar\("nivel"\);\s*niv\.textContent = "Nivel " \+ nB\.nivel/.test(FI), "   la barra de xp sube, y si cruzas de nivel se llena, suena y vuelve a empezar");
c(/contadores\(A, B\);   \/\/ al cerrar/.test(FI), "   al cerrar, las cifras de la ficha ruedan hasta lo nuevo");
c(/if \(quieto\) return;/.test(FI) && /\.mc-capa\.quieto,\.mc-capa\.quieto \*\{animation:none!important/.test(CSS), "   con reducción de movimiento, todo en su sitio y sin animar");
c(/catch \(err\) \{ if \(MC\) try \{ MC\.cerrar\(\); \} catch \(x\) \{\} reto\(/.test(FI), "   y si algo falla, la fiesta de siempre (nunca rompe lo guardado)");
c(/else if\(!celebrarMision\(antes, d\.yo\)\) SG\.FIESTA\.reto\(antes, d\.yo, donde\);/.test(NAVE), "🔴 la Nave la usa al registrar un reto");
c(/if\(fr\) botones\.push\(\{texto:'Ver el fragmento en El Archivo'/.test(NAVE) && /if\(cartas\.length\|\|skin\) botones\.push\(\{texto:'Abrir Mi botín'/.test(NAVE)
  && /if\(!botones\.length && dcr>0 && abierto\('mercado'\)\) botones\.push\(\{texto:'Gastarlo en el Mercado Estelar'/.test(NAVE),
  "   el botón según lo ganado: fragmento → El Archivo; cromos o personaje → Mi botín; solo dinero → Mercado Estelar");
c(/if\(!nuevos\.length\) return false;/.test(NAVE), "   solo con un reto nuevo (la racha de la llamada sigue con la fiesta pequeña)");

// ── 5 · Mi botín por puertas, los hitos en fila, el álbum encendido, el vestuario desde el avatar
c(/var BOTIN_SECS=\['insignias','cromos','heroes'\];/.test(NAVE) && /class="bt-puertas"/.test(NAVE), "🔴 Mi botín: tres puertas grandes (insignias, cromos, héroes)");
c(/if\(sub\[0\]==='botin'&&sub\[1\]\) st\.botinSec=sub\[1\];/.test(NAVE), "   irA('botin:cromos') llega con la puerta abierta");
c(/\.ins-temas\{align-items:stretch;container-type:inline-size\}/.test(CSS), "   las tarjetas de insignias, iguales en cada fila");
c(/@container \(min-width:1030px\)\{\s*\.ins-tema\.hitos\{grid-column:span 3\}/.test(CSS) && /'Llegan solos con lo que haces'[^\n]*'hitos'\)/.test(NAVE), "   y los hitos del viaje, a lo ancho: los siete en una fila");
c(/soloHeroes \? "Ver mis héroes" : "Ver mi álbum"/.test(SOB) && /opts\.alAlbum\(soloHeroes \? "heroes" : "cromos"\)/.test(SOB) && /sig\.insertAdjacentHTML\("beforebegin", botonAlbum\(\)\)/.test(SOB),
  "🔴 al abrir cartas, «Ver mi álbum» va el primero y encendido (también con una sola) y lleva a su puerta");
c(/\.sb-album,\.neb-al-botin\{[^}]*animation:albumLlama/.test(CSS), "   y late");
c(/function pulsarAvatar\(\)/.test(NAVE) && /if\(!vestuarioAbierto\(\)\) return lupaAvatar\(\);/.test(NAVE) && /bav\.onclick=pulsarAvatar/.test(NAVE),
  "🔴 pulsar tu avatar abre el vestuario desde que llegan los héroes (antes, la lupa)");
c(/function cablearVestir\(cont\)/.test(NAVE) && /cablearVestir\(ov\);/.test(NAVE), "   con el mismo vestirse que Mi botín");

// ── 6 · 26-sep · la entrega: la insignia en grande, la cuenta atrás en vivo y los retos relacionados
const r0 = STG.indexOf("window.SG.relojHtml = function"), w2 = { SG: {} };
new Function("window", STG.slice(r0, STG.indexOf("\n};", r0) + 3))(w2);
const RJ = w2.SG.relojHtml, ahora = Date.now();
c(typeof RJ === "function" && /días/.test(RJ(ahora + 2 * 86400e3 + 5000)) && !/seg/.test(RJ(ahora + 2 * 86400e3 + 5000)), "🔴 SG.relojHtml: días, horas y minutos (sin segundero) mientras falta más de un día");
c(/seg/.test(RJ(ahora + 2 * 3600e3)) && !/días/.test(RJ(ahora + 2 * 3600e3)), "   el último día, con segundos");
c(/Plazo cerrado/.test(RJ(ahora - 1000)), "   y pasado el plazo, «Plazo cerrado»");
const RH = L("recluta.html"), mA = RH.match(/window\.SG_ACTIVIDADES=(\[.*?\]);window\./);
const ACTN = mA ? JSON.parse(mA[1]) : [];
c(ACTN.length === 2 && ACTN.every(a => Array.isArray(a.retos) && a.retos.length === 3 && a.retos.every(r => r[0] && r[1] && !/\*/.test(r[1]))),
  "🔴 la Nave recibe los retos relacionados de cada actividad (los de la página de Actividades) con lo que aporta cada uno en corto");
c(/relacionados\(a\)/.test(NAVE) && /class="re-reloj" data-fin="'\+x\.fin\+'"/.test(NAVE) && /re-ins'\+\(ins\.length>1\?' dos':''\)/.test(NAVE),
  "   la tarjeta de la entrega: insignia en grande, reloj en vivo y retos relacionados");
c(/var actR=actividadDeReto\(t\[0\]\), relR=actR\?relacionados\(actR, true\):'';/.test(NAVE) && /data-rid="'\+esc\(t\[0\]\)\+'"/.test(NAVE),
  "   en Mis retos, la Actividad 1 y la 2 llevan su línea de retos relacionados (y cada reto se puede buscar)");
c(/class="dia entrega en-v2 con-fondo"/.test(SES) && /class="en-neb"><img src="assets\/img\/personajes\/nebula\.png"/.test(SES) && /class="en-rel"/.test(SES) && /window\.SG\.relojHtml\(fin\)/.test(SES),
  "🔴 la diapositiva de la entrega: NEBULA, la insignia en grande, el reloj y los retos relacionados con sus insignias");
c(/pl=Number\(x\.tema_n\)\?planeta\(x\.tema_n\):\(x\.planeta\|\|null\)/.test(SES), "   el índice del diferido: la semana 15 con el planeta de la Estática");
c(/function ticketDelTema\(\)/.test(NAVE) && /\+ticketDelTema\(\)/.test(NAVE) && /SG_TICKET_URL=/.test(RH) && /SG_TICKET_TEMAS=/.test(RH),
  "🔴 el ticket de salida, también en la Nave, la semana que cierra cada tema (el mismo formulario, ya rellenado)");
c(/localStorage\.setItem\(f\.getAttribute\('data-tk'\),'1'\)/.test(SES) && /localStorage\.getItem\(clave\)==='1'/.test(NAVE), "   enviado en la sesión o en la Nave, no se pide dos veces");

// ── 7 · 26-sep · el diferido del recluta, sin paja; y los rankings de la consola, que no respondían
c(/var FUERA_DIFERIDO=\['ticket','ticket_dudas','movido','simulacro'\], RANKINGS_SESION=\['semanal','top','coleccion','escuadrones'\];/.test(SES)
  && /if\(DIFERIDO&&st\.alumno&&!st\.pres&&!st\.act\) st\.slides=paraDiferido\(st\.slides, s\);/.test(SES),
  "🔴 diferido del recluta: fuera «cómo os fue», «vuestras dudas», «han movido ficha», los rankings sueltos y «Enséñalo» (el docente, entera)");
c(/if\(x\.k==='retos-semana'\)\{ var r=diaRetosTema\(s\);/.test(SES) && /if\(x\.k==='reto' && x\.rot==='Relámpago'\) return;/.test(SES) && /id!=='S7'/.test(SES),
  "   «los retos», por todos los retos del tema (sin el secreto); y el relámpago, dentro de ella");
c(/function diaRankingDif\(\)/.test(SES) && /\['total','Total'/.test(SES) && /\['escuadron','Tu escuadrón'/.test(SES) && /\['coleccion','Coleccionistas'/.test(SES) && /rkd-sep/.test(SES),
  "🔴 un ranking con tres pestañas (total, tu escuadrón, coleccionistas): los tres primeros y, si no estás, quien va delante, tú y quien te sigue");
c(/rot:'Novedades'/.test(SES) && /que==='notas'\?'Todavía no hay valoraciones'/.test(SES), "   «Novedades» (no «Tu Nave, más grande») y, sin tickets, cada diapositiva con su título");
c(/closest\("\.modo-sel \[data-modo\]"\)/.test(CON) && /\(m === "piloto" \|\| m === "manual"\)/.test(CON),
  "🔴 las pestañas del ranking de la consola responden (el selector Piloto/Manual ya no las toma por suyas)");

console.log("\n  Batería 110 · misión cumplida, Mi botín por puertas y el diferido con su índice");
console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
process.exit(fallos.length ? 1 : 0);
