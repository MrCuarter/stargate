'use strict';
/**
 * BATERÍA 89 · LOS PREMIOS POR ENLACE, REHECHOS (17-sep-2026).
 *
 * Lo que pasó en la prueba humana de Norberto, y por qué esta batería existe:
 *   «He creado un premio, lo he reclamado, pero al volver a entrar ha desaparecido: no le di a Guardar».
 *   «Un usuario avispado puede cambiar el 1 por el 2 y ganar otra recompensa».
 *   «Parece que no funciona el temporizador: me ha dejado reclamarlo, y encima es una bolsa de créditos. Esto no puede
 *    volver a pasar. ¿Cuál es el problema?» → la pantalla enseñaba «⏳ Se abre hoy a las 11:20» con lo que había escrito,
 *    y NO estaba guardado: en el servidor seguía siendo la bolsa de 50 ◈ sin fecha.
 *   «¿Valen para cualquier grupo? Sería maravilloso poder reciclarlos… con opción TODOS».
 *   «No queremos menús grises en ningún sitio». «Una ventana para escoger héroes: debo ver las miniaturas».
 *   «Aunque detecte la cuenta del profesorado, que me deje verla y "reclamarla" como simulación».
 */
const fs = require("fs"), path = require("path");
const RAIZ = path.resolve(__dirname, ".."), GP = "/Users/nor/Claude/vibewebs/gamificapro";
let ok = 0; const fallos = [];
function c(cierto, nombre, detalle) { if (cierto) { ok++; return; } fallos.push(nombre + (detalle ? " — " + detalle : "")); }
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
const K = leer("assets/js/consola.js"), M = leer("assets/js/motor.js"), H = leer("assets/js/huevo.js"), SG = leer("assets/js/stargate.js"),
      CSS = leer("assets/css/stargate.css"), PAQ = leer("motor/paquete.js"), SEM = leer("motor/sembrar_prueba.js");

// 1 · se guarda solo, y lo que se ve es lo del servidor
c(!/id="hv-save"/.test(K) && !/function cablearHuevos/.test(K), "🔴 no hay un «Guardar» para toda la lista que se pueda olvidar");
c(/function guardarLuego\(it, ya\)/.test(K) && /MOTOR\.guardarPremioEnlace\(it, premiables\(\)\)/.test(K)   /* (19-sep · premiables: también los grupos del docente en mando manual) */ && /\}, ya \? 0 : 600\);/.test(K),
  "🔴 cada premio se guarda solo al tocarlo (al medio segundo; los botones, al momento)");
c(/"✓ Guardado"/.test(K) && /"No se ha guardado: "/.test(K), "   y lo dice: «✓ Guardado» o por qué no");
c(!/estadoLocal/.test(K) && /function estadoServidor\(it\)/.test(K) && /MOTOR\.estadoHuevo\(per, it\.id\)/.test(K),
  "🔴 el estado de la tarjeta («⏳ Se abre…») lo cuenta el SERVIDOR, nunca lo escrito en pantalla");
c(/"Comprobando…"/.test(K), "   mientras se guarda, no promete nada («Comprobando…»)");
c(/Este premio ya lo " \+ \(n === 1 \? "ha reclamado 1 persona"/.test(K) && /si: "Crear uno nuevo con este premio"/.test(K) && /if \(!q\) return;/.test(K),
  "🔴 cambiar el premio de uno ya reclamado avisa y crea uno nuevo (quien lo reclamó no podría el nuevo)");

// 2 · el código secreto
c(/function azar\(n, abc\)/.test(M) && /crypto\.getRandomValues/.test(M) && /id: azar\(10\)/.test(M) && /codigo: azar\(18,/.test(M),
  "🔴 identificador y código al azar (no «p1, p2…»)");
c(/crypto\.subtle\.digest\("SHA-256"/.test(M) && /claimLinkHash: hash/.test(M), "🔴 en la recompensa (que lee cualquiera) solo va la HUELLA del código");
c(/"&c=" \+ encodeURIComponent\(item\.codigo/.test(M), "   y el código viaja en el enlace");
c(/llamar\("claimLinkedReward", \{ rewardId: rid, modo: "item", codigo: String\(codigo \|\| ""\) \}\)/.test(M) && /MOTOR\.reclamarHuevo\(PER, HUEVO, FICHA, CODIGO\)/.test(H),
  "   la página lo manda al reclamar");
const CL = fs.existsSync(path.join(GP, "functions/claimLinks.js")) ? fs.readFileSync(path.join(GP, "functions/claimLinks.js"), "utf8") : "";
c(/export function motivoPorCodigo\(premio, codigo\)/.test(CL) && /createHash\('sha256'\)\.update\(id \+ ':' \+ String\(codigo/.test(CL) && /const porCodigo = motivoPorCodigo\(premio, codigo\);/.test(CL),
  "🔴 el SERVIDOR comprueba la huella antes de dar nada (GamificaPro · claimLinks.js)");
c(/codigo: typeof codigo === 'string' \? codigo\.slice\(0, 100\) : ''/.test(CL), "   con el código que llega en la llamada");
const DEP = fs.existsSync(path.join(RAIZ, "..", "desplegar_stargate.sh")) ? fs.readFileSync(path.join(RAIZ, "..", "desplegar_stargate.sh"), "utf8") : "";
c(/claimLinkedReward/.test(DEP), "   y el script de despliegue la sube");

// 3 · varios grupos
c(/const PRIV = \(perId\) => doc\(db, "projects", perId, "privado", "stargate"\)/.test(M) && /premiosEnlace: \{ \[item\.id\]: item \}/.test(M),
  "🔴 el catálogo vive en la parte PRIVADA de cada grupo (ahí están los códigos; el alumnado no la lee)");
c(/function destinosDe\(item, gestionados\)/.test(M) && /item\.grupos === "todos" \? gestionados\.slice\(\)/.test(M), "🔴 «todos» son todos los grupos que lleva quien guarda; si no, los marcados");
c(/async function quitarDeGrupo\(per, id\)/.test(M) && /claimLinkEnabled: false, stargateBorrado: true/.test(M) && /deleteField\(\)/.test(M),
  "   y de los grupos que se desmarcan se quita (cerrado; quien lo reclamó lo conserva)");
c(/saltados\.push\(\{ per, motivo: "no tiene ese premio en su tienda" \}\)/.test(M), "   si un grupo no tiene esa cápsula en su tienda, se dice (no da en silencio un sobre normal)");
c(/¿Para qué grupos\?/.test(K) && /varios\.png alt> Todos tus grupos, también los que crees después/.test(K), "🔴 cada premio dice a qué grupos afecta, con «Todos»");
c(/function verComunes\(que\)/.test(K) && /consola\.html\?comun=premios/.test(K) && /🌐 Para todos tus grupos/.test(K), "🔴 «🌐 Para todos tus grupos» en la portada de la consola");
c(/\["huevos", "Premios por enlace", 1, "varios"\]/.test(K) && /\["premios", "Premios", "assets\/img\/nave\/iconos\/premios\.png", \["huevos", "sorteos", "ofertas"\]\]/.test(K) && /cn-comun/.test(K),
  "   y en el grupo, juntas en la sección «Premios», con la entrada a «Para todos tus grupos»");
c(/const huevos = \[\];/.test(SEM) && !/id: "p" \+ n/.test(SEM), "🔴 los grupos ya no nacen con «p1…p8» de muestra");

// 4 · la pantalla: visual, sin grises, con la imagen del premio
c(/function ventanaVisual\(titulo, cuerpo, montar\)/.test(K) && /function elegirTipo\(\)/.test(K) && /function elegirPremio\(it\)/.test(K), "🔴 elegir con una ventana visual (qué es, y qué premio)");
c(/function pasoHeroe\(/.test(K) && /assets\/img\/heroes\/' \+ esc\(h\.clave\) \+ '\.jpg/.test(K), "🔴 los héroes, con su miniatura");
c(/function imgPremio\(it, clase\)/.test(K) && /imgPremio\(it, "pe-img-i"\)/.test(K), "🔴 cada tarjeta lleva la imagen de su premio");
c(/data-pe-tipo="recompensa"/.test(K) && /data-pe-tipo="huevo"/.test(K), "   y si es recompensa o huevo de Pascua");
c(!/class="h-url"/.test(K), "   sin la dirección a la vista");
c(/NADA DE MENÚS GRISES/.test(SG) && /sel\.classList\.add\("sgsel-nativo"\)/.test(SG) && /new MutationObserver\(function \(ms\)/.test(SG),
  "🔴 ningún desplegable gris en la web: cada <select> se viste solo (también los que se pintan después)");
c(/sel\.dispatchEvent\(new Event\("change", \{ bubbles: true \}\)\)/.test(SG) && /e\.key === "ArrowDown"/.test(SG) && /e\.key === "Escape"/.test(SG),
  "   el de siempre manda (su «change»), y se maneja con el teclado");
c(/\.sgsel-lista\{position:fixed;z-index:9800/.test(CSS) && /\.sgsel-nativo\{/.test(CSS), "   con su estilo");

// 5 · la página del premio
c(/var DIRECTO = url\.get\("embed"\) !== "1";/.test(H) && /function escena\(dice\)/.test(H) && /capitan\/' \+ \(esRec\(\) \? "pulgar" : "senala"\)/.test(H),
  "🔴 el enlace directo es una página de STARGATE, con el Capitán (el embed sigue sin fondo)");
c(/body\.huevo-directo\{background:[^}]*fondo_universo\.jpg/.test(CSS), "   con el universo detrás");
c(/¡Enhorabuena! Has ganado una recompensa/.test(H) && /Pulsa para conseguirla/.test(H) && /stargateHuevo: \{ id: String\(h\.id\), tipo:/.test(PAQ),
  "🔴 recompensa («¡Enhorabuena! Has ganado una recompensa») o huevo de Pascua, dicho desde el primer momento");
c(/function simular\(\)/.test(H) && /function pintarSimulacion\(\)/.test(H) && /Cuenta de docente · simulación/.test(H) && /premio\(\{ premio: t, detalle: d, simulado: true \}\)/.test(H),
  "🔴 con cuenta de docente: se ve igual y se «reclama» de mentira, avisando (sin llamar al servidor)");
c(!/MOTOR\.reclamarHuevo/.test(H.split("function pintarSimulacion")[1].split("// ---------------------------------------------------------------- la puerta")[0]),
  "   (la simulación no reclama nada)");

console.log("\n  Batería 89 · los premios por enlace, rehechos");
console.log("  " + ok + " comprobaciones, " + fallos.length + " fallos");
fallos.forEach(f => console.log("   ✗ " + f));
process.exit(fallos.length ? 1 : 0);
