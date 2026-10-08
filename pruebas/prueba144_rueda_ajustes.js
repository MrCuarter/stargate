'use strict';
/**
 * BATERÍA 144 · LA RUEDA DENTADA DE LA NAVE (8-oct-2026). Norberto: «un estudiante debería poder cambiar su alias, frase,
 * escribir su bitácora, cambiar comandante, personaje… Debe ser un botón intuitivo, fácil. La rueda dentada es universal».
 *
 * Qué se demuestra:
 *   1. el SDK fijado es el que trae `equipo.cambiarComandante` (modComandante { projectId, comandante }), y llama así de verdad;
 *   2. motor.js: `cambiarMiComandante` pasa por el SDK (no escribe la ficha) y `guardarFrase` escribe stargateBio y su copia
 *      privada (las funciones de verdad, contra un mostrador); la del profesorado (`cambiarComandante`) sigue igual; y la
 *      consola de ensayo (motor_sim.js, generado) lleva las dos, para que nada reviente allí;
 *   3. recluta.js: el botón «Ajustes» (con su etiqueta accesible) en la ficha, la ventana con la pieza del motor de las
 *      tarjetas (velo, ×, Esc), los cinco apartados con lo que ya hacía cada cosa, la confirmación del Comandante y que en el
 *      ensayo y la demo no se guarda nada;
 *   4. la piel: cerrada no se ve; en el móvil, a pantalla entera; los apartados, del mismo alto.
 */
const fs = require("fs"), path = require("path");
const R = path.join(__dirname, "..");
const L = f => fs.readFileSync(path.join(R, f), "utf8");
let ok = 0; const fallos = [];
const c = (cond, txt, dato) => { if (cond) ok++; else fallos.push(txt); console.log("   " + (cond ? "✓" : "✗") + " " + txt + (cond || dato === undefined ? "" : "  →  " + JSON.stringify(dato).slice(0, 500))); };
const canon = v => JSON.stringify(v, (k, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.keys(x).sort().reduce((o, n) => (o[n] = x[n], o), {}) : x));

const MOTOR = L("assets/js/motor.js"), SIM = L("assets/js/motor_sim.js"), REC = L("assets/js/recluta.js"), CSS = L("assets/css/stargate.css");
const { pieza, FIJADO } = require("./sdk_pieza.js");

(async () => {
  console.log("  El SDK fijado");
  c(FIJADO === "mod-sdk.v1.971e453a04.js", "🔴 el paquete fijado es el que trae cambiarComandante (971e453a04)", FIJADO);
  const EQ = pieza("equipo");
  c(/function cambiarComandante\(grupo, comandante\) \{\s*return llamar\("modComandante", \{ projectId: grupo, comandante: String\(comandante \|\| ""\) \}\);/.test(EQ)
    && /cambiarComandante: cambiarComandante/.test(EQ), "   equipo.cambiarComandante → modComandante { projectId, comandante }, y la pieza la devuelve");
  // de verdad: el paquete en Node, con un `llamar` de mentira
  const GP_SDK = require(path.join(R, "assets/js", FIJADO));
  const llamadas = [];
  const nada = () => { throw new Error("no debería tocar Firestore"); };
  const ctx = { fs: { db: {}, doc: nada, getDoc: nada, getDocs: nada, setDoc: nada, updateDoc: nada, collection: nada, writeBatch: nada }, llamar: async (fn, d) => { llamadas.push([fn, d]); return { ok: true, movidos: [{ fichaId: "f1" }] }; }, sesion: async () => ({ uid: "u1" }) };
  const EQUIPO = GP_SDK.equipo.crear(ctx, { referentes: "stargate_referentes", invitaciones: "stargate_invitaciones" });
  const r1 = await EQUIPO.cambiarComandante("g1", "Mr. Cuarter");
  c(r1 && r1.ok && canon(llamadas) === canon([["modComandante", { projectId: "g1", comandante: "Mr. Cuarter" }]]), "   y lo llama así, con el paquete de verdad (sin tocar Firestore)", llamadas);

  console.log("\n  motor.js (las funciones de verdad, contra un mostrador)");
  const una = n => { const i = MOTOR.indexOf("\nasync function " + n + "("); if (i < 0) return ""; const j = MOTOR.indexOf("\n}\n", i); return MOTOR.slice(i, j + 2); };
  const mio = una("cambiarMiComandante"), frase = una("guardarFrase");
  c(!!mio && !/updateDoc|setDoc|writeBatch/.test(mio), "🔴 cambiarMiComandante no escribe la ficha (lo hace el servidor del motor)");
  const pedidas = [];
  const M1 = new Function("EQUIPO", mio + "\nreturn { cambiarMiComandante };")({ cambiarComandante: async (g, cmd) => { pedidas.push([g, cmd]); return { ok: true }; } });
  await M1.cambiarMiComandante("g1", "  Ana López ");
  c(canon(pedidas) === canon([["g1", "Ana López"]]), "   pasa por GP_SDK.equipo.cambiarComandante(grupo, comandante), sin espacios de más", pedidas);
  const escritas = [];
  const M2 = new Function("updateDoc", "setDoc", "doc", "db", frase + "\nreturn { guardarFrase };")(
    async (ref, d) => { escritas.push(["update", ref, d]); }, async (ref, d, o) => { escritas.push(["set", ref, d, o]); },
    (db, ...ruta) => ruta.join("/"), {});
  const rf = await M2.guardarFrase("f9", "  Antes de embarcar, yo… " + "x".repeat(400));
  c(rf.bio.length === 280 && canon(escritas) === canon([["update", "student_profiles/f9", { stargateBio: rf.bio }], ["set", "student_profiles/f9/privado/datos", { bio: rf.bio }, { merge: true }]]),
    "🔴 guardarFrase: stargateBio en la ficha y bio en lo privado (los dos sitios del alistamiento), hasta 280 letras", escritas.map(e => e.slice(0, 2)));
  escritas.length = 0; await M2.guardarFrase("f9", "   ");
  c(escritas[0] && escritas[0][2].stargateBio === "" && escritas[1][2].bio === "", "   vacía, se quita");
  c(/async function cambiarComandante\(perId, fichaId, aNombre\)/.test(MOTOR), "   la del profesorado (consola) sigue igual: cambiarComandante(perId, fichaId, aNombre)");
  c(/aliasOcupado, cambiarAlias, cambiarMiComandante, guardarFrase,/.test(MOTOR), "   el motor las exporta (SG.MOTOR)");
  c(SIM.indexOf("async function cambiarMiComandante(") > 0 && SIM.indexOf("async function guardarFrase(") > 0 && /cambiarMiComandante, guardarFrase,/.test(SIM),
    "   y la consola de ensayo (motor_sim.js, generado) también: nada revienta allí");

  console.log("\n  recluta.js · el botón y la ventana");
  const fn = n => { const i = REC.indexOf("function " + n + "("); if (i < 0) return ""; const j = REC.indexOf("\n  }\n", i); return REC.slice(i, j + 4); };
  c(/\+botonAjustes\(\)\s*\+'<\/h3>'/.test(REC), "🔴 la rueda va en la ficha, al lado del nombre (personaje → botonAjustes)");
  const BA = fn("botonAjustes");
  c(/data-ajustes/.test(BA) && /aria-label="Ajustes de tu ficha"/.test(BA) && /iconos\/p\/ajustes\.png/.test(BA) && /<span>Ajustes<\/span>/.test(BA),
    "   con su etiqueta accesible «Ajustes de tu ficha», la rueda de la web (ajustes.png) y la palabra «Ajustes» a la vista");
  c(fs.existsSync(path.join(R, "assets/img/iconos/p/ajustes.png")), "   y el icono existe");
  c(/function puedeAjustes\(\)\{ return !!\(st\.yo && \(motorNuevo\(\)\|\|SIMULACRO\|\|enDemo\(\)\)\); \}/.test(REC), "   solo con el motor nuevo (y en el ensayo y la demo, para verla)");
  const V = fn("ventanaAjustes");
  c(/gpt-celda ajf-celda/.test(V) && /<details class="gpt-tarjeta ajf"/.test(V) && /class="gpt-cerrar ajf-cerrar" data-gpt-cerrar aria-label="Cerrar los ajustes"/.test(V)
    && /<div class="gpt-velo" data-gpt-cerrar aria-hidden="true"><\/div>/.test(V) && /document\.body\.appendChild\(cel\)/.test(V),
    "🔴 la ventana es la pieza del motor de las tarjetas (celda, <details>, × y velo: Esc y pulsar fuera los pone tarjetas.js), en <body>");
  c(/det\.addEventListener\('toggle'/.test(V) && /\[data-ajustes\]/.test(V), "   al cerrarse, el foco vuelve a la rueda");
  const AB = fn("abrirAjustes");
  c(/det\.open=true/.test(AB) && /\.ajf-cerrar/.test(AB) && /GP\.tarjetas\.cerrar\(\)/.test(AB), "   abrir: una ventana a la vez, y el foco dentro (para que Esc la cierre)");

  console.log("\n  recluta.js · los cinco apartados");
  const P = fn("pintarAjustes");
  c(/apAlias\(\)\+apFrase\(\)\+apBitacora\(\)\+apPersonaje\(\)/.test(P) && /apComandante\(\)/.test(P), "   alias, frase, Bitácora y personaje (dos y dos), y el Comandante debajo");
  const GA = fn("guardarAliasAjustes");
  c(/M\.aliasOcupado\(per,nuevo,\{ficha:r\.ficha\}\)/.test(GA) && /ya lo lleva otro recluta del grupo/.test(GA) && /M\.cambiarAlias\(per,r\.ficha,nuevo\)/.test(GA),
    "🔴 alias: comprueba que está libre y lo cambia con su reserva (el cambio de siempre, GP_SDK.alistarse)");
  c(/maxlength="24"/.test(fn("apAlias")) && /maxlength="280"/.test(fn("apFrase")), "   con los mismos topes que al alistarse (24 y 280)");
  c(/M\.guardarFrase\(r\.ficha,texto\)/.test(fn("guardarFraseAjustes")), "   frase: MOTOR.guardarFrase");
  const BI = fn("apBitacora");
  c(/'data-bit-ed':'data-ajf-no'/.test(BI), "   Bitácora: el editor de siempre ([data-bit-ed]); en el ensayo y la demo, el aviso");
  c(/pintarAjustes\('bit'\)/.test(fn("pintarBitacora")), "   y al guardarla, su apartado se pone al día");
  c(/\[data-ajf-pj\][\s\S]{0,40}det\.open=false; pulsarAvatar\(\)/.test(V), "   personaje: cierra la ventana y abre el vestuario (pulsarAvatar, como el avatar)");
  const AC = fn("apComandante"), EC = fn("elegirComandante");
  c(/st\.yo\.profe/.test(AC) && /aria-current="true"/.test(AC) && /El tuyo/.test(AC) && /data-esc=/.test(AC), "🔴 Comandante: los del grupo (st.d.escuadrones), marcado el suyo");
  c(/'Pasarás al escuadrón '\+escu\+', con tu Comandante '\+cmd\+'\. Tu XP va contigo\.'/.test(EC) && /M\.cambiarMiComandante\(per,cmd\)/.test(EC),
    "   al elegir otro: «Pasarás al escuadrón X, con tu Comandante Y. Tu XP va contigo.» y MOTOR.cambiarMiComandante");
  c(/sinDesplegar/.test(EC) && /no se ha tocado nada/.test(EC) && /recargarTrasAjuste\(\)/.test(EC), "   si falla (o aún no está desplegado), lo dice con calma; si sale, recarga el tablero y la ficha");
  // un Comandante por fila, en el orden del grupo
  const CG = new Function("st", fn("comandantesDelGrupo") + "\nreturn comandantesDelGrupo();");
  const lista = CG({ d: { escuadrones: [{ comandante: "Ana" }, { comandante: " Ana " }, { comandante: "" }, { comandante: "Bea" }] } });
  c(canon(lista.map(e => e.comandante.trim())) === canon(["Ana", "Bea"]), "   un Comandante por fila (el escuadrón va con él)", lista);
  const BL = fn("ajustesBloqueado");
  c(/No disponible en el ensayo/.test(BL) && /Esto es una demostración/.test(BL) && /congelada/.test(BL), "🔴 en el ensayo y en la demo no se guarda nada (y se dice); con la cuenta congelada, tampoco");
  c(/if\(ajustesBloqueado\(\)\) return;/.test(GA) && /if\(ajustesBloqueado\(\)\) return;/.test(fn("guardarFraseAjustes")) && /if\(ajustesBloqueado\(\)\) return;/.test(EC),
    "   los tres que escriben lo miran antes de escribir");

  console.log("\n  La piel");
  c(/\.ajf-celda>\.ajf:not\(\[open\]\)\{display:none\}/.test(CSS), "   cerrada, no se ve");
  c(/@media \(max-width:640px\)\{\s*\.ajf-celda>\.ajf\[open\]\{height:calc\(100vh - 16px\);height:calc\(100dvh - 16px\)\}/.test(CSS), "   en el móvil, a pantalla entera");
  c(/\.ajf-rejilla\{[^}]*grid-auto-rows:1fr/.test(CSS) && /\.ajf-cmds\{[^}]*grid-auto-rows:1fr/.test(CSS), "   los apartados y los Comandantes, del mismo alto (lo que va junto, igual)");
  c(/--gpt-capa:60/.test((CSS.match(/\.ajf-celda\{[^}]*\}/) || [""])[0]), "   por debajo de los avisos (la confirmación sale encima)");

  console.log("\n  Batería 144 · la rueda dentada de la Nave");
  console.log("  " + (ok + fallos.length) + " comprobaciones, " + fallos.length + " fallos");
  process.exit(fallos.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
