'use strict';
/**
 * EL LABORATORIO · fontanería de la batería 67.
 *
 * La batería 64 recorre la web con un DOBLE del motor: contesta lo que le digo, y por eso no podía
 * encontrar un fallo en una compra, un reto o una llamada a filas. Esta recorre la web contra los
 * EMULADORES de Firebase: las reglas de Firestore de verdad, las Cloud Functions de verdad, el mismo
 * motor.js que corre en producción. Nada sale de esta máquina y no existe ninguna cuenta real.
 *
 * Tres piezas:
 *   · los emuladores (Auth 9099, Firestore 8080, Functions 5001) bajo el proyecto `demo-stargate`,
 *     que Firebase garantiza que no habla con nada real;
 *   · la web servida desde 127.0.0.1, con `window.SG_EMU = true` inyectado antes de cargar
 *     (motor.js solo se conecta a los emuladores si se cumplen las dos cosas);
 *   · Chrome con UN CONTEXTO AISLADO POR PERSONA. 🔴 Esto no es un detalle: la sesión de Firebase
 *     vive en el almacenamiento del origen, así que dos pestañas normales comparten sesión y entrar
 *     como alumna en una sacaría a la referente de la otra. Cada contexto es un incógnito aparte.
 */
const fs = require("fs"), path = require("path"), os = require("os"), { spawn, spawnSync } = require("child_process");

const RAIZ = path.resolve(__dirname, "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const P_CDP = 9555, P_WEB = 8765, P_WEB2 = 8766;
const PROYECTO = "demo-stargate";
const EMU = { auth: 9099, firestore: 8080, functions: 5001 };
const PUBLICA = `http://127.0.0.1:${EMU.functions}/${PROYECTO}/us-central1/tableroStargate`;
const BASE = `http://127.0.0.1:${P_WEB}/`;
const dormir = ms => new Promise(r => setTimeout(r, ms));

// ------------------------------------------------------------------ emuladores
async function emuladoresVivos() {
  try {
    const [a, f, fn] = await Promise.all([
      fetch(`http://127.0.0.1:${EMU.auth}/`).then(r => r.ok || r.status < 500),
      fetch(`http://127.0.0.1:${EMU.firestore}/`).then(r => r.ok || r.status < 500),
      fetch(PUBLICA + "?per=nada").then(r => r.status < 600),
    ]);
    return a && f && fn;
  } catch (e) { return false; }
}

/** Borra TODO lo del emulador —datos y cuentas— y vuelve a sembrar. Cada pasada empieza igual. */
async function reiniciar() {
  await fetch(`http://127.0.0.1:${EMU.firestore}/emulator/v1/projects/${PROYECTO}/databases/(default)/documents`, { method: "DELETE" });
  await fetch(`http://127.0.0.1:${EMU.auth}/emulator/v1/projects/${PROYECTO}/accounts`, { method: "DELETE" });
  const r = spawnSync(process.execPath, [path.join(RAIZ, "motor", "sembrar_prueba.js"), "--lab"],
    { encoding: "utf8", env: Object.assign({}, process.env, { FIRESTORE_EMULATOR_HOST: `127.0.0.1:${EMU.firestore}` }) });
  const codigo = ((r.stdout || "").match(/código de acceso:\s*(\w+)/) || [])[1];
  if (!codigo) throw new Error("no se pudo sembrar el laboratorio: " + (r.stderr || r.stdout || "").slice(0, 300));
  return codigo;
}

/** Lee un documento del emulador saltándose las reglas (como haría la consola de Firebase). */
async function leerDoc(ruta) {
  const r = await fetch(`http://127.0.0.1:${EMU.firestore}/v1/projects/${PROYECTO}/databases/(default)/documents/${ruta}`,
                        { headers: { Authorization: "Bearer owner" } });
  if (!r.ok) return null;
  return desFirestore((await r.json()).fields || {});
}
async function consultar(coleccion, campo, valor) {
  const r = await fetch(`http://127.0.0.1:${EMU.firestore}/v1/projects/${PROYECTO}/databases/(default)/documents:runQuery`, {
    method: "POST", headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: coleccion }],
      where: { fieldFilter: { field: { fieldPath: campo }, op: "EQUAL", value: { stringValue: valor } } } } }) });
  const j = await r.json();
  return (j || []).filter(x => x.document).map(x => Object.assign({ _id: x.document.name.split("/").pop() }, desFirestore(x.document.fields || {})));
}
function desFirestore(f) {
  const v = x => x.stringValue !== undefined ? x.stringValue : x.integerValue !== undefined ? Number(x.integerValue)
    : x.doubleValue !== undefined ? x.doubleValue : x.booleanValue !== undefined ? x.booleanValue
    : x.nullValue !== undefined ? null : x.timestampValue !== undefined ? x.timestampValue
    : x.arrayValue ? (x.arrayValue.values || []).map(v) : x.mapValue ? desFirestore(x.mapValue.fields || {}) : undefined;
  const o = {}; Object.keys(f).forEach(k => { o[k] = v(f[k]); }); return o;
}

// ------------------------------------------------------------------ CDP
// 15-sep · un rechazo del protocolo que nadie recoge (una pestaña o un iframe que ya no existe) no
// debe tumbar las 31 secciones: se apunta, bien visible, y se sigue. Los fallos de verdad los cuentan
// las comprobaciones.
process.on("unhandledRejection", e => process.stderr.write("   ⚠️  [arnés] rechazo sin recoger: " + ((e && e.message) || e) + "\n"));
function conectar(url) {
  const ws = new WebSocket(url);
  let id = 0; const pend = new Map(); const oyentes = [];
  ws.addEventListener("message", ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { const { ok, mal } = pend.get(m.id); pend.delete(m.id);
      return m.error ? mal(new Error(m.error.message)) : ok(m.result); }
    oyentes.forEach(f => f(m));
  });
  const listo = new Promise((ok, mal) => { ws.addEventListener("open", () => ok()); ws.addEventListener("error", () => mal(new Error("ws"))); });
  return { listo, ws, al: f => oyentes.push(f),
    enviar(method, params, sessionId) {
      return new Promise((ok, mal) => { const n = ++id; pend.set(n, { ok, mal });
        const msg = { id: n, method, params: params || {} }; if (sessionId) msg.sessionId = sessionId;
        ws.send(JSON.stringify(msg)); }); } };
}
function conTope(p, ms, que) {
  let t; return Promise.race([p.finally(() => clearTimeout(t)),
    new Promise((_, mal) => { t = setTimeout(() => mal(new Error("tiempo agotado: " + que)), ms); })]);
}

let NAV = null, CHROME_PROC = null, WEB = null, WEB2 = null, PERFIL = null, PARANDO = false;
async function arrancar(ver) {
  /**
   * 🔴 14-sep · RESTOS DE OTRA PASADA. Dos laboratorios lanzados a la vez (o uno que se cortó) dejan
   * su Chrome escuchando en el puerto de depuración: el siguiente se conectaba a ESE navegador viejo
   * y se colgaba sin decir por qué. Antes de arrancar se limpian los Chrome del laboratorio (solo los
   * que usan un perfil `sglab-`, nunca el Chrome de nadie) y los servidores de sus dos puertos.
   */
  try {
    spawnSync("pkill", ["-f", "user-data-dir=.*sglab-"]);
    for (const puerto of [P_WEB, P_WEB2]) {
      const r = spawnSync("lsof", ["-tiTCP:" + puerto, "-sTCP:LISTEN"], { encoding: "utf8" });
      (r.stdout || "").split(/\s+/).filter(Boolean).forEach(pid => { try { process.kill(Number(pid)); } catch (e) {} });
    }
    // y sus perfiles (unos 120 MB cada uno): se iban quedando en la carpeta temporal, 166 el 14-sep
    fs.readdirSync(os.tmpdir()).filter(d => /^sglab-/.test(d))
      .forEach(d => { try { fs.rmSync(path.join(os.tmpdir(), d), { recursive: true, force: true }); } catch (e) {} });
  } catch (e) {}
  await dormir(600);
  WEB = spawn("python3", [path.join(__dirname, "servidor_lab.py"), String(P_WEB)], { cwd: RAIZ, stdio: "ignore" });   // cola de 256 (ver servidor_lab.py)
  PERFIL = fs.mkdtempSync(path.join(os.tmpdir(), "sglab-"));
  // 17-sep · sin frenos para las pestañas «de fondo»: cada persona es una pestaña y solo una está delante. Chrome
  // espacia los temporizadores de las demás (hasta uno por minuto) y Firestore tardaba casi un minuto en contestar
  const args = ["--disable-gpu", "--no-first-run", "--no-default-browser-check", `--remote-debugging-port=${P_CDP}`,
                "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows",
                "--disable-features=IntensiveWakeUpThrottling,CalculateNativeWinOcclusion",
                `--user-data-dir=${PERFIL}`, "about:blank"];
  if (!ver) args.unshift("--headless=new");
  CHROME_PROC = spawn(CHROME, args, { stdio: "ignore" });
  // 🔴 14-sep · si el Chrome del laboratorio se cierra a mitad, las llamadas se quedaban esperando
  // para siempre (se colgó en la sección 6 sin decir nada): ahora se dice y se para
  CHROME_PROC.on("exit", (codigo, senal) => {
    if (PARANDO) return;
    console.error("\n🔴 El Chrome del laboratorio se ha cerrado a mitad (" + (senal || "código " + codigo) + "). No es la web: vuelve a lanzarlo.");
    console.error("   (" + ok + " comprobaciones bien hasta ahí, " + fallos.length + " fallos)");
    process.exit(3);
  });
  let v = null;
  for (let i = 0; i < 80 && !v; i++) { try { v = await (await fetch(`http://127.0.0.1:${P_CDP}/json/version`)).json(); } catch (e) {} if (!v) await dormir(300); }
  if (!v) throw new Error("Chrome no arrancó");
  NAV = conectar(v.webSocketDebuggerUrl); await NAV.listo;
  // para el escondite «dentro de otra web»: un segundo origen que hace de Genially
  WEB2 = spawn("python3", [path.join(__dirname, "servidor_lab.py"), String(P_WEB2)], { cwd: path.join(RAIZ, "pruebas", "anfitrion"), stdio: "ignore" });
  await dormir(500);
}
async function parar() {
  PARANDO = true;
  try { CHROME_PROC && CHROME_PROC.kill(); } catch (e) {}
  try { WEB && WEB.kill(); } catch (e) {}
  try { WEB2 && WEB2.kill(); } catch (e) {}
  await dormir(400);
  try { PERFIL && fs.rmSync(PERFIL, { recursive: true, force: true }); } catch (e) {}
}

/**
 * Una persona = un contexto aislado + una pestaña. Devuelve un objeto con el que manejarla.
 */
async function persona(nombre) {
  const { browserContextId } = await NAV.enviar("Target.createBrowserContext", { disposeOnDetach: true });
  const { targetId } = await NAV.enviar("Target.createTarget", { url: "about:blank", browserContextId });
  const { sessionId } = await NAV.enviar("Target.attachToTarget", { targetId, flatten: true });
  const errores = [], rotos = [];
  NAV.al(m => {
    if (m.sessionId !== sessionId) return;
    // 🔴 El 404 con su DIRECCIÓN: «Failed to load resource» a secas no dice qué falta.
    if (m.method === "Network.responseReceived" && m.params.response && m.params.response.status >= 400)
      rotos.push(m.params.response.status + " " + m.params.response.url);
    if (m.method === "Runtime.exceptionThrown") {
      const d = m.params.exceptionDetails || {};
      errores.push(String((d.exception && d.exception.description) || d.text || "error").split("\n")[0]);
    }
    if (m.method === "Log.entryAdded" && m.params.entry.level === "error")
      errores.push(String(m.params.entry.text || "") + (m.params.entry.url ? " ← " + m.params.entry.url : ""));
  });
  const env = (m, p) => NAV.enviar(m, p, sessionId);
  const INYECCION = `window.SG_EMU = true; window.SG_API_PUBLICA = ${JSON.stringify(PUBLICA)};` +
    `window.__dialogos = []; window.alert = function(m){ window.__dialogos.push(String(m)); };`;
  /**
   * 🔴 LOS IFRAMES DE OTRO SITIO SON OTRO PROCESO. Un escondite pegado en una presentación vive en
   * un iframe de OTRO sitio (genially.com → stargate.mistercuarter.es), y Chrome lo aísla en un
   * proceso aparte con su propio almacenamiento. Para entrar ahí hay que engancharse a ese proceso
   * (auto-attach), ponerle el interruptor del laboratorio ANTES de que cargue nada, y hablarle por
   * su propia sesión. Sin esto, «probar el embed» sería probar la página suelta, que no es lo mismo.
   */
  const hijos = [];
  NAV.al(async m => {
    if (m.method !== "Target.attachedToTarget" || m.sessionId !== sessionId) return;
    const sid = m.params.sessionId;
    hijos.push({ sid, tipo: m.params.targetInfo.type });
    NAV.al(x => {
      if (x.sessionId !== sid) return;
      if (x.method === "Runtime.exceptionThrown") {
        const d = x.params.exceptionDetails || {};
        errores.push("[iframe] " + String((d.exception && d.exception.description) || d.text || "error").split("\n")[0]);
      }
    });
    try {
      // (15-sep · con .catch: si el iframe desaparece antes de contestar —la Nave se repinta y el vídeo se
      // sustituye—, «Session with given id not found» sin recoger tumbaba el laboratorio entero)
      await NAV.enviar("Runtime.enable", {}, sid).catch(() => {});
      await NAV.enviar("Page.enable", {}, sid).catch(() => {});
      await NAV.enviar("Page.addScriptToEvaluateOnNewDocument", { source: INYECCION }, sid).catch(() => {});
    } finally { await NAV.enviar("Runtime.runIfWaitingForDebugger", {}, sid).catch(() => {}); }
  });
  await env("Page.enable"); await env("Runtime.enable"); await env("Log.enable"); await env("Network.enable");
  await env("Target.setAutoAttach", { autoAttach: true, waitForDebuggerOnStart: true, flatten: true });
  await env("Emulation.setDeviceMetricsOverride", { width: 1280, height: 860, deviceScaleFactor: 1, mobile: false });
  // 🔴 El interruptor del laboratorio, puesto ANTES de que cargue nada en cada documento nuevo.
  // el interruptor del laboratorio, antes de que cargue nada (y los alert se anotan en vez de congelar)
  await env("Page.addScriptToEvaluateOnNewDocument", { source: INYECCION });
  const p = {
    nombre, errores, rotos, env,
    // (se marca la página vieja: sin la marca, «readyState complete» lo daba la que se iba y la batería leía el DOM viejo)
    async ir(pagina) { try { await p.js("window.__sgVieja=1; 1", 3000); } catch (e) {}
                       await env("Page.navigate", { url: pagina.indexOf("http") === 0 ? pagina : BASE + pagina });
                       await p.hasta("!window.__sgVieja && document.readyState==='complete'", 15); await dormir(250); },
    async js(expr, ms) {
      const r = await conTope(env("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }), ms || 20000, expr.slice(0, 60));
      if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text || "").split("\n")[0] + " ← " + expr.slice(0, 70));
      return r.result.value;
    },
    async hasta(expr, seg) {
      for (let i = 0; i < (seg || 10) * 5; i++) { try { if (await p.js(expr, 4000)) return true; } catch (e) {} await dormir(200); }
      return false;
    },
    async entrarComo(correo, nombre) {
      // 17-sep · una vez, a mitad del laboratorio, la página tardó más de 35 s en cargar el motor: se espera y, si no, se recarga
      const listo = "!!(window.SG && window.SG.EMU && window.SG.MOTOR)";
      if (!(await p.hasta(listo, 30))) {
        console.log("      ⏱ (la página no cargaba el motor en 30 s: se recarga · " + nombre + ")");
        try { await p.js("location.reload(); 1", 3000); } catch (e) {}
        await dormir(1500); await p.hasta(listo, 60);
      }
      // 19-sep · los docentes del laboratorio llegan en MANDO MANUAL (lo que prueban las secciones es la consola entera);
      // el arranque en piloto automático lo prueba la §47 quitando esta marca
      await p.js("try{ localStorage.setItem('sgModoNivel','manual'); }catch(e){} 1");
      return p.js(`window.SG.EMU.entrarComo(${JSON.stringify(correo)}, ${JSON.stringify(nombre || correo)}).then(function(u){ return u.email; })`);
    },
    /**
     * Entrar como lo hace una persona: puerta → Google → «¿Eres tú?» → continuar. El laboratorio no
     * puede abrir la ventana de Google, así que la sesión se abre por detrás (`entrarComo`) y luego
     * se recarga la puerta, que es cuando aparece «¿Eres tú?»: justo el caso que falló el 12-sep.
     */
    async entrarPorLaPuerta(correo, nombre) {
      await p.ir("entrar.html");
      await p.entrarComo(correo, nombre);
      await p.ir("entrar.html");
      const ok = await p.hasta("!!document.getElementById('e-seguir')", 15);
      if (!ok) return false;
      await p.js("document.getElementById('e-seguir').click(); 1");
      return true;
    },
    /**
     * 17-sep · CONTESTAR A LA PREGUNTA DE LA CASA (`SG.preguntar`), que sustituye a confirm/prompt: espera a que salga, escribe
     * si hace falta y pulsa su botón de aceptar. Devuelve su título ("" si no salió) para comprobar que se preguntó lo debido.
     */
    async responder(texto, seg) {
      const sale = await p.hasta("!!document.querySelector('.sgp-caja [data-sgp-si]')", seg || 10);
      if (!sale) return "";
      return p.js(`(function(){
        var c = [].slice.call(document.querySelectorAll('.sgp-caja')).pop(), t = c.querySelector('h3').textContent;
        var i = c.querySelector('input, textarea');
        ${texto == null ? "" : `if (i) { i.value = ${JSON.stringify(String(texto))}; i.dispatchEvent(new Event('input')); }`}
        var si = c.querySelector('[data-sgp-si]'); if (si.disabled) return 'APAGADO: ' + t;
        si.click(); return t; })()`);
    },
    async pulsar(texto, dentro) {
      return p.js(`(function(){
        var raiz = ${dentro ? `document.querySelector(${JSON.stringify(dentro)})` : "document"}; if(!raiz) return "sin contenedor";
        var b = [].slice.call(raiz.querySelectorAll('button, a.btn, [role=button]')).filter(function(x){
          return x.offsetParent !== null && !x.disabled && ${texto instanceof RegExp ? texto.toString() : JSON.stringify(texto)}
            ${texto instanceof RegExp ? ".test(x.textContent)" : " === x.textContent.trim()"}; })[0];
        if(!b) return "no encontrado"; b.click(); return "ok";
      })()`);
    },
    texto() { return p.js("(document.body.innerText||'').replace(/\\s+/g,' ')"); },
    /** 19-sep · el tamaño de la pantalla (p. ej. un móvil: 390×844, móvil=true), para mirar cómo queda en el teléfono. */
    tamano(ancho, alto, movil) {
      return env("Emulation.setDeviceMetricsOverride", { width: ancho, height: alto, deviceScaleFactor: movil ? 2 : 1, mobile: !!movil });
    },
    async foto(fichero) {
      const r = await env("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(fichero, Buffer.from(r.data, "base64")); return fichero;
    },
    cerrar() { return NAV.enviar("Target.disposeBrowserContext", { browserContextId }).catch(() => {}); },
    /** El iframe (de otro sitio) cuya dirección contiene `trozo`, manejable como una página más. */
    async marco(trozo) {
      for (let i = 0; i < 40; i++) {
        for (const h of hijos) {
          const r = await NAV.enviar("Runtime.evaluate", { expression: "location.href", returnByValue: true }, h.sid).catch(() => null);
          if (r && r.result && String(r.result.value).indexOf(trozo) >= 0) {
            const js = async (expr, ms) => {
              const x = await conTope(NAV.enviar("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }, h.sid), ms || 20000, expr.slice(0, 50));
              if (x.exceptionDetails) throw new Error((x.exceptionDetails.exception && x.exceptionDetails.exception.description || x.exceptionDetails.text || "").split("\n")[0]);
              return x.result.value;
            };
            const hasta = async (expr, seg) => { for (let k = 0; k < (seg || 10) * 5; k++) { try { if (await js(expr, 4000)) return true; } catch (e) {} await dormir(200); } return false; };
            return { js, hasta, sid: h.sid,
              // Page.reload solo vale para la pestaña; un iframe se recarga desde dentro
              recargar: () => NAV.enviar("Runtime.evaluate", { expression: "setTimeout(function(){location.reload()},10); 1" }, h.sid).catch(() => {}),
              entrarComo: async (correo, nombre) => {
                // (17-sep · como en la pestaña: una carga lenta del motor tumbaba la batería entera; se espera más y se dice)
                if (!(await hasta("!!(window.SG && window.SG.EMU && window.SG.MOTOR)", 20))) {
                  console.log("      ⏱ (el iframe no cargaba el motor en 20 s · " + nombre + ")");
                  await hasta("!!(window.SG && window.SG.EMU && window.SG.MOTOR)", 60);
                }
                return js(`window.SG.EMU.entrarComo(${JSON.stringify(correo)}, ${JSON.stringify(nombre || correo)}).then(function(u){ return u.email; })`); },
              texto: () => js("(document.body.innerText||'').replace(/\\s+/g,' ')") };
          }
        }
        await dormir(300);
      }
      return null;
    },
  };
  return p;
}

// ------------------------------------------------------------------ administración del emulador
/**
 * firebase-admin contra el EMULADOR, para preparar escenas que en la vida real llevan días (una
 * llamada de ayer para probar la racha) y para mirar lo que ha quedado escrito sin pasar por las
 * reglas. La variable de entorno se pone ANTES de cargar la librería: si no, hablaría con producción.
 */
let _admin = null;
function admin() {
  if (_admin) return _admin;
  process.env.FIRESTORE_EMULATOR_HOST = `127.0.0.1:${EMU.firestore}`;
  process.env.FIREBASE_AUTH_EMULATOR_HOST = `127.0.0.1:${EMU.auth}`;
  const a = require("/Users/nor/Claude/vibewebs/gamificapro/node_modules/firebase-admin");
  if (!a.apps.length) a.initializeApp({ projectId: PROYECTO });
  _admin = a;
  return a;
}
async function fichaDe(correo, per) {
  const a = admin();
  const u = await a.auth().getUserByEmail(correo).catch(() => null);
  if (!u) return null;
  const r = await a.firestore().collection("student_profiles").where("projectId", "==", per).where("userId", "==", u.uid).get();
  return r.empty ? null : Object.assign({ _id: r.docs[0].id, _uid: u.uid }, r.docs[0].data());
}

// ------------------------------------------------------------------ marcador
let ok = 0; const fallos = [];
function comprobar(nombre, cierto, detalle) {
  if (cierto) { ok++; process.stderr.write("   ✓ " + nombre + "\n"); return true; }
  const t = nombre + (detalle ? " — " + detalle : "");
  fallos.push(t); process.stderr.write("   ✗ " + t + "\n"); return false;
}

module.exports = { emuladoresVivos, reiniciar, leerDoc, consultar, arrancar, parar, persona, comprobar, dormir, admin, fichaDe,
                   marcador: () => ({ ok, fallos }), BASE, P_WEB2, PUBLICA, RAIZ };
