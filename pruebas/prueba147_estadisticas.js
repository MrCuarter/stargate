/**
 * BATERÍA 147 · ESTADÍSTICAS, DENTRO DE LA WEB (13-oct)
 * ------------------------------------------------------------------------------------------------
 * Norberto: «desde mi cuenta debo tener un botón de Estadísticas y desde allí poder ver la info total de todo STARGATE, filtrar
 * por grupos, escuadrones, rango de fechas, retos…». La página es del motor (GamificaPro sdk/estadisticas.js, `GP.estadisticas`;
 * su prueba, tests/sdk/estadisticas.test.ts) y las cifras, de `modEstadisticas` (functions/modEstadisticas.js). Aquí: la copia, la
 * página con su puerta, la piel y el botón en «Gestionar grupos», que solo sale si el servidor dice que puedes.
 */
const fs = require("fs"), path = require("path");
const raiz = path.join(__dirname, "..");
const leer = f => fs.readFileSync(path.join(raiz, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + JSON.stringify(dato))); };

console.log("▶ 147 · Estadísticas, dentro de la web");
const BUILD = leer("_build_site.py"), PIEZA = leer("assets/js/estadisticas.js"), PAG = leer("assets/js/estadisticas-pagina.js");
const HTML = leer("estadisticas.html"), CONS = leer("assets/js/consola.js"), CSS = leer("assets/css/stargate.css");

// ── 1 · la pieza, copiada del motor
c(/GB\.copiar_pieza\(HERE, "estadisticas\.js"/.test(BUILD) && /raiz\.GP\.estadisticas = hecho/.test(PIEZA), "🔴 la pieza del motor (sdk/estadisticas.js), copiada por el build");
const GP_AL_LADO = path.join(raiz, "..", "..", "gamificapro", "sdk", "estadisticas.js");
if (fs.existsSync(GP_AL_LADO)) c(fs.readFileSync(GP_AL_LADO, "utf8") === PIEZA || !!process.env.GAMIFICAPRO_DIR, "   y es la misma que la de GamificaPro (no se edita aquí)");

// ── 2 · la página: tarjetas.js (sin defer, para la ventana del «Leer más…»), la pieza y su puerta, con huella; fuera de los buscadores
const v = (f, defer) => new RegExp('<script src="assets/js/' + f.replace(".", "\\.") + '\\?v=[0-9a-f]+"' + (defer ? " defer" : "") + '></script>').test(HTML);
c(v("tarjetas.js", false) && v("estadisticas.js", true) && v("estadisticas-pagina.js", true), "🔴 estadisticas.html carga tarjetas.js, la pieza y su puerta, con su huella");
c(/noindex,nofollow/.test(HTML) && /id="es-app"/.test(HTML), "   fuera de los buscadores, con su hueco");
c(/GP\.estadisticas\.puedo\(MOTOR\.llamar, "stargate"\)/.test(PAG) && /GP\.estadisticas\.crear\(\{ raiz: app, llamar: MOTOR\.llamar, mod: "stargate" \}\)/.test(PAG),
  "🔴 la puerta pregunta al servidor si puedes (no lleva correos) y abre la del mod «stargate»");
c(/Esta página es del Mando/.test(PAG) && /MOTOR\.entrar\(\)\.then\(arrancar\)/.test(PAG), "   sin sesión, a entrar con Google; sin permiso, a tu Nave");
c(!/@gmail|@/.test(PAG.replace(/\* .*\n/g, "")), "   sin un solo correo en la puerta");

// ── 3 · el botón, en «Gestionar grupos», escondido hasta que el servidor dice que sí
c(/<p id="gs-estad" hidden><\/p>/.test(CONS) && /botonEstadisticas\(\);/.test(CONS), "🔴 el hueco del botón, escondido, en la cabecera de «Gestionar grupos»");
c(/MOTOR\.llamar\("modEstadisticas", \{ accion: "puedo", mod: "stargate" \}\)/.test(CONS) && /if \(!esVitalicio\(\)\) return;/.test(CONS),
  "   se pregunta una vez y solo a los vitalicios (el resto no podría); si dice que no o falla, no sale nada");
c(/href="estadisticas\.html">' \+ ico\("rankings"\) \+ ' Estadísticas<\/a>/.test(CONS), "   con su icono (sin emojis) y a estadisticas.html");

// ── 4 · la piel: con los colores de la Nave, en las variables de la pieza
c(/13-oct · ESTADÍSTICAS/.test(CSS) && /\.gpe\{--gpe-p:var\(--panel\);--gpe-borde:var\(--line\)/.test(CSS) && /--gpe-titulo:'Unbounded'/.test(CSS), "🔴 la piel de STARGATE en --gpe-* (stargate.css)");

// ── 5 · la pieza, de verdad: los filtros que salen y lo que se pide
global.window = null;
const E = require(path.join(raiz, "assets/js/estadisticas.js"));
c(JSON.stringify(E.peticionDe({ grupo: "per-1", equipo: "esc_a", reto: "*", desde: "2026-10-06", hasta: "" }, "stargate")) === '{"mod":"stargate","grupos":["per-1"],"equipos":["esc_a"],"desde":"2026-10-06"}',
  "   lo que se pide al servidor: el grupo, el escuadrón, el reto y las fechas elegidas");
c(E.PESTANAS.map(x => x[1]).join(",") === "Resumen,Curso,Equipos,Retos,Horas,Horarios,Buzón,Origen", "   las siete pestañas, con «Horarios» (las clases de cada escuadrón), y «Origen», que solo sale con la pieza encendida (16-oct)");

console.log("\n  Batería 147 · " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
if (fallos.length) process.exit(1);
