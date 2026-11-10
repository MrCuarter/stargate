/* FURIA · núcleo común de las tres experiencias en directo (proyector + móviles).
   Sin librerías. En el borrador, proyector y móviles se hablan por BroadcastChannel (pestañas del mismo navegador),
   igual que borradores/directo. En la web sería el canal de GamificaPro (SG.MOTOR.directoCanal), con los mismos mensajes:
     proyector → { t:'estado', modo, ... }           (2 veces por segundo)
     móvil     → { t:'hola'|'latido'|'pulso'|'linea'|'mano'|'voz', id, alias, ... }
*/
(() => {
  const Q = new URLSearchParams(location.search);
  const F = window.F = {};
  F.Q = Q;
  F.SALA = (Q.get("sala") || "CERO").toUpperCase().slice(0, 8);
  F.reducido = matchMedia("(prefers-reduced-motion: reduce)").matches;
  F.$ = id => document.getElementById(id);
  F.VIVO = ["puente", "fragmento", "ashan"];
  /* EN LA WEB (dentro de la sesión o de la Nave, con ?per=): el canal en directo del motor de GamificaPro (SG.MOTOR.directoCanal),
     el mismo que usa el juego del final de la clase. Fuera (el borrador), BroadcastChannel entre pestañas. */
  F.PER = Q.get("per") || "";
  F.M = null;
  F.motor = () => { let w = window; for (let i = 0; i < 3 && w.parent && w.parent !== w; i++) { w = w.parent; try { const M = w.SG && w.SG.MOTOR; if (M && M.directoCanal) return M; } catch (e) { return null; } } return null; };
  F.arranque = async () => {
    if (!F.PER) return null;
    for (let t = 0; t < 8000; t += 150) { const M = F.motor(); if (M && M.auth && M.auth.currentUser) { F.M = M; return M; } await new Promise(r => setTimeout(r, 150)); }
    F.M = F.motor(); return F.M;
  };
  // una dirección de la misma carpeta de juegos que conserva el grupo y la sesión (per, sesion, tema, c…)
  F.url = (ruta, extra) => {
    const u = new URL(ruta, location.href);
    new URLSearchParams(location.search).forEach((v, k) => { if (k !== "v" && k !== "f" && k !== "t" && !u.searchParams.has(k)) u.searchParams.set(k, v); });
    for (const k in (extra || {})) u.searchParams.set(k, extra[k]);
    return u.href;
  };

  /* ───────── Datos: 8 planetas = 8 temas = 8 tripulantes de la Cero (NARRATIVA_V3 + GUION_FRAGMENTOS_CERO) ───────── */
  // sh: [escala del relieve, bandas de gigante gaseoso, grietas de lava, anillo]
  F.MUNDOS = [
    { n: "Fôrge", tema: "Crear contenido", quien: "Bran Okafor", rol: "El Forjador", a: [.10,.06,.05], b: [.42,.20,.10], c: [1,.45,.12], sh: [2.6,0,1,0],
      leccion: "lo imperfecto compartido vale más que lo perfecto guardado",
      voz: "Solo tengo un boceto. Está a medias… Da igual. Copiadlo. Copiadlo todos.",
      p: [["Lo primero que recuerdo de Bran Okafor es el olor a papel quemado. Dibujaba mejor que nadie. Y quemaba casi todo.", "Cada noche, la misma hoguera pequeña"],
          ["Hasta la tormenta de Fôrge. Cuarenta personas atrapadas en un refugio, y nadie sabía llegar al pozo seguro.", "Nadie sabía llegar al pozo seguro"],
          ["Aquel esquema imperfecto cruzó el campamento de mano en mano. Llegaron todos.", "Una imagen tiene que llegar a tiempo"]] },
    { n: "Ecos", tema: "Vídeo educativo", quien: "Tomás Reyer", rol: "El Cronista", a: [.03,.16,.24], b: [.10,.55,.66], c: [.55,.96,1], sh: [1.9,.25,0,0],
      leccion: "un buen vídeo es tu voz enseñando cuando tú ya no estás",
      voz: "Si ves esto, Lena, es que hoy no llegué a contártelo yo. Pero mira: se hace así.",
      p: [["Tomás Reyer lo grababa todo. Pero lo importante lo grababa dos veces: una para la misión y otra para Lena, su hija.", "Lo importante lo grababa dos veces"],
          ["Cada noche, un mensaje corto: cómo se enciende un fuego, por qué brillan dos soles, cómo se pide perdón.", "Cada noche, un mensaje corto para Lena"],
          ["Sabía que quizá no volvería. Y decidió que su voz sí volvería. Hoy sus grabaciones enseñan a gente que nunca lo conoció.", "Decidió que su voz sí volvería"]] },
    { n: "Sendara", tema: "Interactivos y paisajes de aprendizaje", quien: "Sylla Bren", rol: "La Rastreadora", a: [.04,.14,.10], b: [.16,.50,.24], c: [.42,1,.62], sh: [3.2,0,0,0],
      leccion: "no hay una sola ruta",
      voz: "Mi hermano no se perdió. Lo perdió el mapa. Son cosas muy distintas.",
      p: [["Sylla Bren tenía un hermano gemelo. Dos personas idénticas que aprendían como dos planetas distintos.", "Aprendían como dos planetas distintos"],
          ["A él lo llamaron torpe. Nadie dijo la verdad: que la única ruta que le ofrecían no era la suya.", "La única ruta ofrecida no era la suya"],
          ["En el valle de Sendara, Sylla no trazó un camino: trazó cuarenta y ocho. Todos llevaban a la cima.", "Nadie es mal caminante: hay mapas de un solo camino"]] },
    { n: "Reliae", tema: "Aprendizaje móvil", quien: "Amara Sol", rol: "La Operadora", a: [.22,.12,.04], b: [.72,.50,.16], c: [1,.83,.36], sh: [2.2,.45,0,0],
      leccion: "compartir a tiempo salva más que compartir perfecto",
      voz: "Llegué tarde por querer llegar perfecta. Nunca más.",
      p: [["Amara Sol guardó una vez un informe en el cajón. Tres días. «Para pulirlo.»", "Guardó un informe tres días para pulirlo"],
          ["Cuando por fin lo envió, al otro lado del canal ya no quedaba nadie que pudiera leerlo.", "Ya no quedaba nadie que pudiera leerlo"],
          ["Desde entonces su canal no volvió a cerrarse. Compartía a medias, con dudas, con la voz temblando. Pero a tiempo.", "Primero compartes, después pules"]] },
    { n: "Umbral", tema: "Evaluación y ePortfolio", quien: "Vera Khal", rol: "La Médica", a: [.14,.03,.06], b: [.55,.12,.18], c: [1,.30,.43], sh: [2.4,.15,.25,0],
      leccion: "evaluar es mirar con método a alguien que te importa",
      voz: "Medir no es juzgar. Medir es mirar con método a alguien que te importa.",
      p: [["Vera Khal medía cosas que nadie más se atrevía a mirar. Midió el avance del silencio, mundo a mundo.", "Midió el avance del silencio, mundo a mundo"],
          ["La llamaban fría. Era lo contrario: se aprendía cada nombre antes que cada cifra.", "Cada nombre antes que cada cifra"],
          ["Su historia clínica de los mundos fue la primera Bitácora de verdad: evidencia, contexto y una pregunta.", "¿Qué haremos mañana mejor que hoy?"]] },
    { n: "Ludo", tema: "Aprendizaje basado en juegos", quien: "Joran Pike", rol: "El Ingeniero-jugador", a: [.08,.05,.18], b: [.36,.24,.62], c: [.71,.55,1], sh: [2.0,.2,0,1],
      leccion: "el juego es el ensayo general del miedo",
      voz: "Tranquilos. Esta ya la hemos ganado cien veces. Ruta azul, como en el juego.",
      p: [["A Joran Pike lo acusaban de no tomarse nada en serio. Siempre jugando.", "Lo acusaban de no tomarse nada en serio"],
          ["Convirtió el simulacro de evacuación en un juego. Los niños lo jugaron cien veces entre risas.", "Los niños lo jugaron cien veces entre risas"],
          ["Y una noche las sirenas sonaron de verdad. Salieron todos. Habían ensayado el miedo tantas veces que ya no tenía nada nuevo que enseñarles.", "El juego es el ensayo general del miedo"]] },
    { n: "Vínculo", tema: "Gamificación", quien: "Mara Voss", rol: "El Mando", a: [.18,.04,.14], b: [.62,.16,.50], c: [1,.36,.85], sh: [1.3,1,0,0],
      leccion: "una orden mueve cuerpos y un porqué mueve personas",
      voz: "Una orden mueve cuerpos. Un porqué mueve personas. Y solo lo segundo te lleva a casa.",
      p: [["La capitana Mara Voss guardaba sus medallas en una caja que no abría nunca.", "Una caja que no abría nunca"],
          ["Eran de una guerra ganada que jamás quiso celebrar. «Premiaban obediencia», decía. «No sentido.»", "Premiaban obediencia, no sentido"],
          ["En la Cero las insignias eran otra cosa: memoria de actos con significado. Y fue Mara quien levantó la mano primero.", "Memoria de actos con significado"]] },
    { n: "Liminar", tema: "Realidad aumentada y virtual", quien: "Noa Lieth", rol: "La Arquitecta de capas", a: [.03,.07,.20], b: [.16,.34,.72], c: [.42,.66,1], sh: [3.6,.35,0,1],
      leccion: "se puede ensayar el futuro antes de vivirlo",
      voz: "Que conste que nadie nos obligó. Elegimos. Y elegimos esto.",
      p: [["Noa Lieth construía capas: sobre el mundo real dibujaba el mundo posible. Su oficio era enseñar futuros.", "Sobre el mundo real dibujaba el mundo posible"],
          ["La última noche, en Ashan, desplegó su última capa: el mundo silenciado tal y como podría volver a ser.", "Calles con voces y un archivo encendido"],
          ["Y la Cero votó. Ocho manos. Quedarse.", "La Cero votó: ocho manos, quedarse"]] }
  ];
  F.css = v => `rgb(${v.map(x => Math.round(x * 255)).join(",")})`;
  F.VAEON = ["Olvidar duele menos que recordar.", "Nadie leerá tu Bitácora. Descansa.", "Lo perfecto guardado no molesta a nadie.", "Si recordar duele, olvidar es misericordia.", "¿De verdad merece la pena dejarlo escrito?"];
  F.PREGUNTAS = ["¿De verdad merece la pena dejarlo escrito, sabiendo que cuesta?", "¿Qué quedará de lo que enseñaste cuando tú no estés?", "¿Qué compartiste a medias y aun así ayudó a alguien?"];
  F.NOMBRES = "Lucía,Mateo,Carmen,Hugo,Irene,Dani,Aitana,Pablo,Nerea,Íker,Sofía,Marcos,Elena,Raúl,Noelia,Sergio,Paula,Javi,Marta,Álex,Inés,Rubén,Clara,Adri,Sara,Óscar,Alba,Jorge,Vega,Bruno".split(",");
  F.VOCES_BOT = ["Porque alguien lo necesitará mañana.", "Lo escrito enseña cuando yo no estoy.", "Mis alumnos merecen que quede.", "Compartí unos apuntes a medias y sirvieron.", "Porque olvidar también cuesta.", "Para no empezar de cero cada curso.", "Un vídeo mío sigue ayudando en otro colegio.", "Porque así mido lo que avanzo.", "Lo que no se escribe, se pierde.", "Para que el siguiente llegue más lejos.", "Mi Bitácora es mi memoria de docente.", "Porque enseñar es dejar rastro.", "Aunque duela, quiero recordar.", "Una rúbrica imperfecta ya orientó a mi clase."];

  /* ───────── Utilidades ───────── */
  F.rng = seed => { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  F.escribir = (el, texto, ms, alFin) => {
    clearInterval(el._t);
    if (F.reducido) { el.textContent = texto; alFin && alFin(); return; }
    let i = 0; el.textContent = "";
    el._t = setInterval(() => { i += 1; el.textContent = texto.slice(0, i); if (i >= texto.length) { clearInterval(el._t); alFin && alFin(); } }, ms || 22);
  };
  const GLIFOS = "▒░▓#%&/\\<>+=~·:";
  F.ruidoTexto = (texto, claridad) => { let s = ""; for (const ch of texto) s += (ch === " " || Math.random() < claridad) ? ch : GLIFOS[(Math.random() * GLIFOS.length) | 0]; return s; };
  F.pantallaCompleta = () => { const d = document; d.fullscreenElement ? d.exitFullscreen() : d.documentElement.requestFullscreen && d.documentElement.requestFullscreen().catch(() => {}); };

  /* ───────── Canal ───────── */
  F.canal = alMensaje => {
    if (!("BroadcastChannel" in window)) return { enviar() {}, cerrar() {} };
    const bc = new BroadcastChannel("sg-furia-" + F.SALA);
    bc.onmessage = e => alMensaje(e.data);
    return { enviar: m => bc.postMessage(m), cerrar: () => bc.close() };
  };

  // al salir del marco se cierran las escuchas del motor (viven en la página que contiene el juego); si el navegador
  // guarda la página para volver, al volver se recarga: con las escuchas cerradas no vería nada (como juegos/directo/canal.js)
  F.alSalir = c => {
    addEventListener("pagehide", () => { try { c.cerrar && c.cerrar(); } catch (e) { /* nada */ } });
    addEventListener("pageshow", e => { if (e.persisted) location.reload(); });
  };

  /* ───────── Sala (lado proyector): quién está, simulación de clase y emisión del estado ───────── */
  F.sala = (modo, darEstado, alEvento) => {
    const gente = new Map(), web = !!F.M, SES = Math.random().toString(36).slice(2, 8), TS = Date.now();
    let ronda = 0, ultimo = "";
    const recibir = m => {
      if (!m || !m.id || m.t === "estado") return;
      let p = gente.get(m.id); const nuevo = !p;
      if (!p) { p = { id: m.id, alias: String(m.alias || "Recluta").slice(0, 16), bot: !!m.bot, fijo: !!m.fijo, visto: 0, fase: Math.random() * 6.283, d: {} }; gente.set(m.id, p); }
      if (m.alias) p.alias = String(m.alias).slice(0, 16);
      p.visto = performance.now();
      alEvento(m, p, nuevo);
    };
    /* En la web, cada móvil escribe SU documento de la sala (jugadores/{ficha}) con sus cifras: { furia, ses, ronda, pu, ln, ma, vo }.
       Aquí se compara con lo último visto y se convierte en los mismos sucesos del borrador (pulso, linea, mano, voz).
       Solo cuenta quien responde a ESTA pantalla (ses): los restos de otra partida no son «presentes». */
    const alias = new Map(), prev = new Map();
    const crudo = m => {
      if (!m || !m.id) return;
      if (m.t === "hola") { alias.set(m.id, m.alias); return; }
      if (m.t !== "pts") return;
      const s = m.stats || {}; if (!s.furia || s.ses !== SES) return;
      if (!gente.has(m.id)) recibir({ t: "hola", id: m.id, alias: alias.get(m.id), fijo: true });
      let a = prev.get(m.id); if (!a) { a = { pu: 0, ronda: -1, ln: -1, ma: 0, vo: 0 }; prev.set(m.id, a); }
      if (s.ronda !== a.ronda) { a.ronda = s.ronda; a.ln = -1; a.vo = 0; if (a.ma) { a.ma = 0; recibir({ t: "mano", id: m.id, on: false }); } }
      if ((Number(s.pu) || 0) > a.pu) { const k = Math.min(3, s.pu - a.pu); a.pu = s.pu; for (let i = 0; i < k; i++) recibir({ t: "pulso", id: m.id }); }
      if (s.ronda !== ronda) return;
      if (Number.isInteger(s.ln) && s.ln > a.ln) { a.ln = s.ln; recibir({ t: "linea", id: m.id, n: s.ln }); }
      if (!!s.ma !== !!a.ma) { a.ma = s.ma ? 1 : 0; recibir({ t: "mano", id: m.id, on: !!s.ma }); }
      const vo = Array.isArray(s.vo) ? s.vo.slice(0, 3) : [];
      for (let i = a.vo; i < vo.length; i++) recibir({ t: "voz", id: m.id, texto: vo[i] });
      a.vo = Math.max(a.vo, vo.length);
    };
    const c = web ? F.M.directoCanal(F.PER, true, null, crudo) : F.canal(recibir);
    F.alSalir(c);
    // en la web solo se escribe cuando algo cambia: cada escritura la leen todos los móviles (costes por clase)
    const emitir = () => {
      const e = Object.assign({ t: "estado", modo, ses: SES, ts: TS, ronda, n: gente.size }, darEstado());
      if (web) { const k = JSON.stringify(e); if (k === ultimo) return; ultimo = k; }
      c.enviar(e);
    };
    setInterval(() => {
      const ahora = performance.now();
      for (const [id, p] of gente) if (!p.bot && !p.fijo && ahora - p.visto > 9000) { gente.delete(id); alEvento({ t: "adios" }, p, false); }
      emitir();
    }, 500);
    let bots = [];
    const simular = n => {
      bots.forEach(b => gente.delete(b.id)); bots = [];
      F.NOMBRES.slice(0, n).forEach((alias, i) => setTimeout(() => {
        const b = { id: "bot-" + alias, alias, bot: true }; bots.push(b); recibir({ t: "hola", id: b.id, alias, bot: true });
      }, 200 + i * (120 + Math.random() * 260)));
    };
    // el mando, en la web: sin clase simulada ni móvil de prueba, y «Salir» vuelve a la pantalla del directo
    if (web) {
      ["b-sim", "a-movil"].forEach(id => { const el = F.$(id); if (el) el.hidden = true; });
      const sal = F.$("a-salir"); if (sal) sal.href = F.url("../directo/proyector.html?v=b7ccd456b2");
    }
    return { gente, recibir, emitir, simular, web, nuevaRonda: () => { ronda++; }, bots: () => bots.filter(b => gente.has(b.id)).map(b => gente.get(b.id)) };
  };

  /* ───────── WebGL: un cuadrado a pantalla completa y un shader de fragmentos ───────── */
  F.RUIDO = `
precision highp float;
uniform vec2 uR; uniform float uT;
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float h31(vec3 p){ p=fract(p*.1031); p+=dot(p,p.zyx+31.32); return fract((p.x+p.y)*p.z); }
float n2(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
float n3(vec3 p){ vec3 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fbm2(vec2 p){ float a=.5,s=0.; for(int i=0;i<5;i++){ s+=a*n2(p); p=p*2.03+vec2(17.1,9.2); a*=.5; } return s; }
float fbm3(vec3 p){ float a=.5,s=0.; for(int i=0;i<5;i++){ s+=a*n3(p); p=p*2.02+vec3(11.3,7.7,5.1); a*=.5; } return s; }
// la Estática: bloques grises, líneas de barrido y desgarro horizontal
vec3 estatica(vec3 col, vec2 px, float k){
  if(k<=.001) return col;
  float g=dot(col,vec3(.299,.587,.114));
  float bl=h21(floor(px/vec2(6.,3.))+floor(uT*24.));
  float lin=.75+.25*sin(px.y*1.6+uT*30.);
  vec3 gris=vec3(mix(g,bl,.55*k))*lin;
  return mix(col,gris,clamp(k*1.1,0.,1.));
}
`;
  F.gl = (cv, frag, escala) => {
    const gl = cv.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!gl) return null;
    const sh = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error("SHADER", gl.getShaderInfoLog(s)); return null; } return s; };
    const vs = sh(gl.VERTEX_SHADER, "attribute vec2 p; void main(){ gl_Position=vec4(p,0.,1.); }"), fs = sh(gl.FRAGMENT_SHADER, F.RUIDO + frag);
    if (!vs || !fs) return null;
    const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { console.error("ENLACE", gl.getProgramInfoLog(pr)); return null; }
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {}, u = n => U[n] || (U[n] = gl.getUniformLocation(pr, n)), t0 = performance.now();
    return {
      dibujar(un) {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * (escala || 1), w = Math.max(2, Math.round(cv.clientWidth * dpr)), h = Math.max(2, Math.round(cv.clientHeight * dpr));
        if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
        gl.viewport(0, 0, w, h); gl.uniform2f(u("uR"), w, h); gl.uniform1f(u("uT"), (performance.now() - t0) / 1000);
        for (const k in un) { const v = un[k]; if (typeof v === "number") gl.uniform1f(u(k), v); else if (v.length === 2) gl.uniform2f(u(k), v[0], v[1]); else if (v.length === 3) gl.uniform3f(u(k), v[0], v[1], v[2]); else gl.uniform4f(u(k), v[0], v[1], v[2], v[3]); }
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };
  };

  /* ───────── Sonido ambiente (opcional, lo enciende el docente) ───────── */
  F.sonido = {
    a: null,
    alternar(boton) {
      if (this.a) { this.a.ctx.close(); this.a = null; if (boton) { boton.setAttribute("aria-pressed", "false"); boton.textContent = "Sonido"; } return; }
      try {
        const AC = window.AudioContext || window.webkitAudioContext, ctx = new AC(), salida = ctx.createGain(); salida.gain.value = .9; salida.connect(ctx.destination);
        const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const rs = ctx.createBufferSource(); rs.buffer = buf; rs.loop = true; const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1800; bp.Q.value = .6;
        const rg = ctx.createGain(); rg.gain.value = 0; rs.connect(bp).connect(rg).connect(salida); rs.start();
        const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 500; const pg = ctx.createGain(); pg.gain.value = .0; lp.connect(pg).connect(salida);
        [55, 82.5, 110.4, 165].forEach((f, i) => { const o = ctx.createOscillator(); o.type = i % 2 ? "triangle" : "sawtooth"; o.frequency.value = f; const g = ctx.createGain(); g.gain.value = .22 / (i + 1); o.connect(g).connect(lp); o.start(); });
        this.a = { ctx, salida, rg, pg, lp };
        if (boton) { boton.setAttribute("aria-pressed", "true"); boton.textContent = "Sonido: sí"; }
      } catch (e) { if (boton) boton.textContent = "Sin sonido"; }
    },
    nivel(estatica, memoria) {
      const a = this.a; if (!a) return; const t = a.ctx.currentTime;
      a.rg.gain.setTargetAtTime(estatica * .09, t, .15); a.pg.gain.setTargetAtTime(.05 + memoria * .13, t, .3); a.lp.frequency.setTargetAtTime(300 + memoria * 1500, t, .4);
    },
    campana(f, dur) {
      const a = this.a; if (!a) return; const t = a.ctx.currentTime;
      [1, 1.5, 2.01].forEach((m, i) => { const o = a.ctx.createOscillator(), g = a.ctx.createGain(); o.type = "sine"; o.frequency.value = (f || 440) * m; g.gain.setValueAtTime(.12 / (i + 1), t); g.gain.exponentialRampToValueAtTime(.0005, t + (dur || 2.2)); o.connect(g).connect(a.salida); o.start(t); o.stop(t + (dur || 2.2)); });
    }
  };

  /* Barra de mando del docente: se esconde con la tecla H */
  addEventListener("keydown", e => { if (e.target.matches("input,textarea")) return; if (e.key === "h" || e.key === "H") document.body.classList.toggle("sin-mando"); if (e.key === "f" || e.key === "F") F.pantallaCompleta(); });
})();
