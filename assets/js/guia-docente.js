/**
 * 🔴 28-sep · NEBULA GUÍA AL DOCENTE EN LA SESIÓN EN DIRECTO. Norberto: «STARGATE ha crecido tanto que no quiero que un
 * docente se sienta abrumado ni que en medio de una clase no sepa qué hacer. La primera vez que se lanza un juego, que
 * aparezca NEBULA en la propia sesión y vaya resaltando lo que debe pulsar. La siguiente vez, invítale a cambiar de
 * juego; la tercera, déjale explorar».
 *
 * Es solo el MOTOR (NEBULA en una esquina, un aro que late sobre lo que hay que pulsar y un bocadillo). Qué se enseña y
 * cuándo lo decide sesion.js (GUIAS). Lo que se señala puede vivir dentro de un marco de la misma web (el juego en
 * directo, las Herramientas, el Asedio): el aro se dibuja fuera, en la sesión, sumando la posición del marco.
 *
 * Cuántas veces ha usado cada cosa este docente: en su ficha de docente (stargate_profes/{uid}.guia), para que no le
 * vuelva a salir al cambiar de ordenador, y una copia en el navegador por si no hay red.
 */
(function(){
  var SG = window.SG = window.SG || {};
  var NEB = 'assets/img/personajes/nebula.png';
  var yo = null, cuenta = {}, capa = null, activa = null, reloj = null;

  // ── cuántas veces
  var claveLocal = function(){ return 'sgGuia:' + (yo ? yo.uid : 'anon'); };
  function leerLocal(){ try{ return JSON.parse(localStorage.getItem(claveLocal()) || '{}') || {}; }catch(e){ return {}; } }
  function guardarLocal(){ try{ localStorage.setItem(claveLocal(), JSON.stringify(cuenta)); }catch(e){} }
  function motor(){ return window.SG && window.SG.MOTOR; }
  async function cargar(u){
    yo = u || null; cuenta = leerLocal();
    var M = motor(); if(!yo || !M || !M.getDoc) return;
    try{
      var s = await M.getDoc(M.doc(M.db, 'stargate_profes', yo.uid)), g = s.exists() ? (s.data().guia || {}) : {};
      Object.keys(g).forEach(function(k){ cuenta[k] = Math.max(Number(cuenta[k]) || 0, Number(g[k]) || 0); });
      guardarLocal();
    }catch(e){ /* sin red: la copia del navegador */ }
  }
  function veces(k){ return Number(cuenta[k]) || 0; }
  function anotar(k){
    cuenta[k] = Math.min(9, veces(k) + 1); guardarLocal();
    var M = motor(); if(!yo || !M || !M.setDoc) return;
    var g = {}; g[k] = cuenta[k];
    M.setDoc(M.doc(M.db, 'stargate_profes', yo.uid), { uid: yo.uid, correo: yo.correo, guia: g }, { merge: true }).catch(function(){});
  }

  // ── encontrar lo que se señala (también dentro de un marco de la misma web)
  function buscar(p){
    var doc = document, dx = 0, dy = 0;
    if(p.marco){
      var f = document.querySelector(p.marco); if(!f) return null;
      try{ doc = f.contentDocument; }catch(e){ return null; } if(!doc) return null;
      var r0 = f.getBoundingClientRect(); dx = r0.left; dy = r0.top;
    }
    var el = null; try{ el = doc.querySelector(p.sel); }catch(e){}
    if(!el) return null;
    var r = el.getBoundingClientRect();
    if(!r.width && !r.height) return null;   // escondido
    return { el: el, x: r.left + dx, y: r.top + dy, w: r.width, h: r.height };
  }
  // pulsar lo señalado hace avanzar (y sirve para contar el uso: alPulsar)
  function alPulsar(p, fn, ms){
    var hecho = false, t0 = Date.now(), vistos = [];
    // (se engancha al momento y se sigue mirando: el botón puede aparecer más tarde o repintarse)
    var enganchar = function(){
      if(hecho || Date.now() - t0 > (ms || 20 * 60 * 1000)){ clearInterval(mirar); return; }
      var b = buscar(p); if(!b || vistos.indexOf(b.el) >= 0) return;
      vistos.push(b.el);
      b.el.addEventListener('click', function(){ if(hecho) return; hecho = true; clearInterval(mirar); fn(); }, true);
    };
    var mirar = setInterval(enganchar, 400); enganchar();
    return function(){ hecho = true; clearInterval(mirar); };
  }

  // ── la capa: dentro de lo que esté a pantalla completa (si no, no se vería al proyectar)
  function estilos(){
    if(document.getElementById('nb-guia-css')) return;
    var s = document.createElement('style'); s.id = 'nb-guia-css';
    s.textContent = '#nb-guia{position:fixed;inset:0;pointer-events:none;z-index:2147483000;font-family:"Exo 2",system-ui,sans-serif}'
      + '#nb-guia .nb-aro{position:fixed;border:3px solid #5ff4ff;border-radius:12px;box-shadow:0 0 0 4px rgba(95,244,255,.25),0 0 24px rgba(95,244,255,.6);animation:nbLate 1.2s ease-in-out infinite;transition:all .25s}'
      + '@keyframes nbLate{50%{box-shadow:0 0 0 10px rgba(95,244,255,.08),0 0 34px rgba(95,244,255,.9)}}'
      + '#nb-guia .nb-caja{position:fixed;display:flex;gap:10px;align-items:flex-end;max-width:min(380px,calc(100vw - 32px));pointer-events:auto;transition:all .25s}'
      + '#nb-guia .nb-caja img{width:64px;height:64px;object-fit:contain;flex:none;filter:drop-shadow(0 0 10px rgba(95,244,255,.6))}'
      + '#nb-guia .nb-bo{background:#0b1626;color:#e6f2fb;border:1px solid #5ff4ff;border-radius:14px;padding:10px 12px;font-size:15px;line-height:1.35;box-shadow:0 8px 30px rgba(0,0,0,.5)}'
      + '#nb-guia .nb-bo b{color:#5ff4ff}#nb-guia .nb-q{display:block;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#9db4c8;margin-bottom:4px}'
      + '#nb-guia .nb-acc{display:flex;gap:8px;justify-content:flex-end;margin-top:8px}'
      + '#nb-guia button{font:inherit;font-size:13px;border-radius:999px;padding:5px 12px;cursor:pointer;border:1px solid #5ff4ff;background:#5ff4ff;color:#04121c;font-weight:700}'
      + '#nb-guia button.nb-sec{background:transparent;color:#9db4c8;border-color:#2a4966;font-weight:400}'
      + '@media (prefers-reduced-motion:reduce){#nb-guia .nb-aro{animation:none}#nb-guia .nb-aro,#nb-guia .nb-caja{transition:none}}';
    document.head.appendChild(s);
  }
  function montarCapa(){
    estilos();
    if(!capa){ capa = document.createElement('div'); capa.id = 'nb-guia'; }
    var dentro = document.fullscreenElement || document.body;
    if(capa.parentNode !== dentro) dentro.appendChild(capa);
    return capa;
  }
  document.addEventListener('fullscreenchange', function(){ if(capa && capa.parentNode) montarCapa(); });

  function cerrar(){
    if(reloj){ clearInterval(reloj); reloj = null; }
    if(activa && activa.soltar) activa.soltar();
    activa = null; if(capa) capa.innerHTML = '';
  }
  function colocar(p){
    var b = buscar(p), aro = capa.querySelector('.nb-aro'), caja = capa.querySelector('.nb-caja');
    if(!caja) return;
    var W = window.innerWidth, H = window.innerHeight, cw = caja.offsetWidth, ch = caja.offsetHeight;
    if(!b){ aro.style.display = 'none'; caja.style.left = (W - cw - 16) + 'px'; caja.style.top = (H - ch - 16) + 'px'; return; }
    var m = 6;
    aro.style.display = ''; aro.style.left = (b.x - m) + 'px'; aro.style.top = (b.y - m) + 'px'; aro.style.width = (b.w + 2 * m) + 'px'; aro.style.height = (b.h + 2 * m) + 'px';
    // el bocadillo, debajo si cabe; si no, encima; y dentro de la pantalla
    var x = Math.max(16, Math.min(W - cw - 16, b.x + b.w / 2 - cw / 2)), y = b.y + b.h + 16;
    if(y + ch > H - 16) y = b.y - ch - 16;
    if(y < 16) y = Math.max(16, Math.min(H - ch - 16, b.y + b.h / 2 - ch / 2)), x = b.x + b.w + 16 + cw < W ? b.x + b.w + 16 : Math.max(16, b.x - cw - 16);
    caja.style.left = x + 'px'; caja.style.top = y + 'px';
  }
  /**
   * Un recorrido: pasos [{sel, marco?, t, espera?: pulsar lo señalado para seguir, ms?: cuánto esperar a que aparezca}].
   * op = { titulo, alAcabar, alSaltar }. Solo uno a la vez.
   */
  function recorrido(pasos, op){
    op = op || {}; cerrar(); montarCapa();
    var i = 0, yoMismo = activa = { soltar: null };
    function paso(){
      if(activa !== yoMismo) return;
      if(yoMismo.soltar){ yoMismo.soltar(); yoMismo.soltar = null; }
      var p = pasos[i]; if(!p){ cerrar(); if(op.alAcabar) op.alAcabar(); return; }
      var ultimo = i === pasos.length - 1;
      capa.innerHTML = '<div class="nb-aro" style="display:none"></div><div class="nb-caja"><img src="' + NEB + '" alt=""><div class="nb-bo">'
        + '<span class="nb-q">NEBULA' + (op.titulo ? ' · ' + op.titulo : '') + (pasos.length > 1 ? ' · ' + (i + 1) + '/' + pasos.length : '') + '</span>' + p.t
        + '<div class="nb-acc"><button type="button" class="nb-sec" data-nb="saltar">' + (pasos.length > 1 ? 'Ya lo sé' : 'Cerrar') + '</button>'
        + (p.espera ? '' : '<button type="button" data-nb="sig">' + (ultimo ? 'Entendido' : 'Siguiente') + '</button>') + '</div></div></div>';
      capa.querySelector('[data-nb="saltar"]').onclick = function(){ cerrar(); if(op.alSaltar) op.alSaltar(); };
      var sig = capa.querySelector('[data-nb="sig"]'); if(sig) sig.onclick = function(){ i++; paso(); };
      if(p.espera) yoMismo.soltar = alPulsar(p, function(){ setTimeout(function(){ i++; paso(); }, 250); }, p.ms);
      // si lo señalado no aparece (una sección apagada, un marco que no carga), se sigue sin él pasado un rato
      var t0 = Date.now();
      if(reloj) clearInterval(reloj);
      reloj = setInterval(function(){
        if(activa !== yoMismo){ clearInterval(reloj); return; }
        colocar(p);
        if(p.espera && !buscar(p) && Date.now() - t0 > (p.ms || 15000)){ i++; paso(); }
      }, 250);
      colocar(p);
    }
    paso();
  }
  SG.GUIA = { cargar: cargar, veces: veces, anotar: anotar, recorrido: recorrido, cerrar: cerrar, alPulsar: alPulsar,
              activa: function(){ return !!activa; }, img: NEB };
})();
