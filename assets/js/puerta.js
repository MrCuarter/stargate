// STARGATE — la puerta del profesorado. UNA vez por navegador, no una por página.
//
// 🔴 9-sep · Antes toda la zona del método estaba abierta: la guía, la cronología con los mensajes
// del foro, las actividades con sus documentos, la carpeta de equipo de Genially y las
// instrucciones de instalación. Ninguna tiene datos personales —eso ya iba con PIN— pero es el
// material del profesorado y no tenía por qué encontrarlo cualquiera que pasara por ahí.
//
// 🔴 Y LO QUE ESTA PUERTA **NO** HACE, dicho aquí para que nadie se confíe: no protege los
// FICHEROS. Un .pdf o un .docx en assets/ se baja desde su URL sin pasar por ninguna página. Esto
// esconde el camino, no el contenido. Lo que de verdad reserva un documento es no tenerlo en el
// servidor público — o, para el material del equipo, los permisos de Genially y de Drive.
//
// El PIN es el MISMO del profesorado, y se guarda donde ya lo guardaban «Mi clase», los tickets y
// el panel: `sessionStorage.sgPin`. Así, quien entra en cualquiera de los tres no vuelve a verla, y
// quien pasa por aquí entra en los tres sin teclear nada.
(function(){
  var API = (window.SG_TABLERO_API || "").trim();
  var raiz = document.documentElement;
  function abrir(){ raiz.classList.remove('cerrado'); var p=document.getElementById('puerta'); if(p) p.remove(); }

  // 🔴 LA EXCEPCION QUE NO PUEDE FALTAR. `registro.html` es DOS cosas: la pagina del metodo (con la
  // guia de instalacion) y, con `&solo=1` o `&embed=1`, el RANKING PUBLICO — el que se proyecta en
  // clase y el que va incrustado en el Genially del alumnado. Si la puerta tapara esos modos, el
  // alumnado se encontraria con un PIN dentro de su propio Genially. Lo mismo con el panorama de
  // tickets, que se proyecta apaisado.
  var q = new URLSearchParams(location.search);
  if (q.get('embed') === '1' || q.get('solo') === '1' || q.get('panorama') === '1') { abrir(); return; }

  if (sessionStorage.getItem('sgPin')) { abrir(); return; }

  /**
   * 🔴 12-sep · LA CUENTA TAMBIÉN ES UNA LLAVE.
   *
   * Con el motor nuevo no hay PIN que repartir: el profesorado entra con su cuenta de Google y el
   * servidor decide. Esta puerta se quedó pidiendo un PIN que ya nadie tiene — y desde que la sala
   * del docente enlaza «Proyectar la semana», un docente pulsaba y se estrellaba contra ella.
   *
   * La marca la pone el motor cuando confirma que esa cuenta es docente de algún grupo (ver
   * `misPERs` en motor.js). No es una contraseña que se pueda teclear: o el servidor te ha
   * reconocido alguna vez en este navegador, o no está.
   *
   * Y no se abre por tener sesión a secas: un alumno también la tiene, y esto es material de
   * profesorado.
   */
  if (localStorage.getItem('sgEsDocente') === '1') { abrir(); return; }
  if (!API) { abrir(); return; }        // sin API no se puede validar: mejor abrir que dejar tapado

  function pintar(aviso){
    var d = document.createElement('div');
    d.id = 'puerta';
    d.innerHTML =
      '<div class="puerta-caja">'
      + '<div class="eyebrow amber">Zona del profesorado</div>'
      + '<h2>Material del profesorado</h2>'
      // 🔴 12-sep · LA CUENTA, PRIMERO. Con el motor nuevo NADIE reparte ya un PIN: un docente que
      // llegue a la guía antes que a su sala —que es lo normal, es lo primero que se lee— se
      // encontraba una caja pidiendo una clave que nunca le dieron, sin ninguna otra salida.
      // El PIN se queda debajo, para los grupos que siguen en el sistema anterior.
      + '<p class="small muted">Entra con la cuenta con la que llevas tus grupos. Se te reconoce '
      + 'una vez en este navegador y ya no se vuelve a pedir.</p>'
      + (aviso ? '<p class="puerta-mal">' + aviso + '</p>' : '')
      + '<p><button class="btn primary" id="puertaCuenta">Entrar con mi cuenta</button></p>'
      + '<details class="puerta-pin"><summary>Mi grupo va con PIN (sistema anterior)</summary>'
      + '<p class="small muted">El mismo que usas en «Mi clase» y en los tickets. Te lo da tu profe '
      + 'referente.</p>'
      + '<div class="embrow"><input id="puertaPin" type="password" placeholder="PIN" autocomplete="off">'
      + '<button class="btn" id="puertaOk">Entrar</button></div></details>'
      + '<p class="small muted" style="margin-top:14px">¿Eres estudiante? Tu sitio es '
      + '<a href="index.html">la puerta principal</a> — aquí no hay nada para ti.</p>'
      + '</div>';
    document.body.appendChild(d);
    var inp = document.getElementById('puertaPin'), btn = document.getElementById('puertaOk');
    function probar(){
      var v = inp.value.trim(); if (!v) return;
      btn.disabled = true; btn.textContent = 'Comprobando…';
      fetch(API, { method:'POST', redirect:'follow',
                   headers:{'Content-Type':'text/plain;charset=utf-8'},
                   body: JSON.stringify({ accion:'pers', pin:v }) })
        .then(function(r){ return r.json(); })
        .then(function(d2){
          if (d2 && d2.error && /PIN/.test(d2.error)) {
            d.remove(); pintar('Ese PIN no vale. Prueba otra vez.'); return;
          }
          sessionStorage.setItem('sgPin', v); abrir();
        })
        .catch(function(e){ d.remove(); pintar('No se ha podido comprobar: ' + e.message); });
    }
    btn.onclick = probar;
    inp.onkeydown = function(e){ if (e.key === 'Enter') probar(); };

    /**
     * Entrar con la cuenta. No se le pregunta nada al navegador: se le pregunta al motor si esa
     * cuenta es docente de algún grupo, que es lo mismo que decide la sala del docente. Si lo es,
     * queda la marca y esta puerta no vuelve a aparecer en este navegador.
     */
    var bc = document.getElementById('puertaCuenta');
    bc.onclick = function(){
      bc.disabled = true; bc.textContent = 'Comprobando…';
      var M = window.SG && window.SG.MOTOR;
      if (!M || !M.sesion || !M.misPERs) {
        // La puerta vive en páginas que no cargan el motor. Se manda a la sala, que sí lo carga:
        // allí se entra con la cuenta y al volver la marca ya está puesta.
        location.href = 'clase.html?volver=' + encodeURIComponent(location.pathname.replace(/^\//, ''));
        return;
      }
      M.sesion().then(function(yo){
        if (!yo) return M.entrar().then(function(){ return M.sesion(); });
        return yo;
      }).then(function(yo){
        if (!yo) throw new Error('No se ha podido entrar.');
        return M.misPERs(yo.correo);
      }).then(function(ps){
        if (ps && ps.length) { abrir(); return; }
        bc.disabled = false; bc.textContent = 'Entrar con mi cuenta';
        d.remove();
        pintar('Esa cuenta no lleva ningún grupo. Pídele a tu profe referente que te añada al equipo docente.');
      }).catch(function(e){
        bc.disabled = false; bc.textContent = 'Entrar con mi cuenta';
        d.remove(); pintar('No se ha podido comprobar: ' + e.message);
      });
    };
    if (inp) inp.onkeydown = function(e){ if (e.key === 'Enter') probar(); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ pintar(''); });
  else pintar('');
})();
