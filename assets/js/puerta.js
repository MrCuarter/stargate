// STARGATE — la puerta del profesorado. UNA vez por navegador, no una por página.
//
// 🔴 9-sep · Antes toda la zona del método estaba abierta: la guía, la cronología con los mensajes
// del foro, las actividades con sus documentos, la carpeta de equipo de Genially y las
// instrucciones de instalación. Ninguna tiene datos personales, pero es el material del
// profesorado y no tenía por qué encontrarlo cualquiera que pasara por ahí.
//
// 🔴 12-sep · SE ACABÓ EL PIN. Lo zanjó Norberto: «el docente entra con su correo de Google, el que
// el profe referente ha escrito. Entonces el sistema ya reconoce al docente y su grupo, ¿para qué
// PIN?». Tenía razón, y además el PIN era peor que inútil: nadie lo repartía ya en el sistema
// nuevo, así que un docente que llegara a la guía antes que a su sala se encontraba una caja
// pidiéndole una clave que nunca le habían dado, sin ninguna otra salida.
//
// Ahora la llave es la cuenta, que es la MISMA que decide qué grupos ves en tu sala. No hay nada
// que memorizar, nada que repartir por WhatsApp y nada que caduque.
//
// 🔴 Y LO QUE ESTA PUERTA **NO** HACE, dicho aquí para que nadie se confíe: no protege los
// FICHEROS. Un .pdf o un .docx en assets/ se baja desde su URL sin pasar por ninguna página. Esto
// esconde el camino, no el contenido. Lo que de verdad reserva un documento es no tenerlo en el
// servidor público — o, para el material del equipo, los permisos de Genially y de Drive.
(function(){
  // La «G» oficial de Google, en sus cuatro colores. Tal cual la publica su guía de marca.
  var LOGO_G = '<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true" focusable="false">'
    + '<path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11.8c-.5 2.7-2 5-4.3 6.6v5.5h7c4.1-3.8 6.6-9.4 6.6-16.3z"/>'
    + '<path fill="#34A853" d="M24 46c5.8 0 10.7-1.9 14.3-5.2l-7-5.5c-1.9 1.3-4.4 2.1-7.3 2.1-5.6 0-10.4-3.8-12.1-8.9H4.7v5.6C8.3 41.4 15.6 46 24 46z"/>'
    + '<path fill="#FBBC05" d="M11.9 28.5c-.4-1.3-.7-2.7-.7-4.5s.3-3.2.7-4.5v-5.6H4.7C3.2 17 2.4 20.4 2.4 24s.8 7 2.3 10.1l7.2-5.6z"/>'
    + '<path fill="#EA4335" d="M24 9.5c3.2 0 6 1.1 8.2 3.2l6.2-6.2C34.7 3 29.8 1 24 1 15.6 1 8.3 5.6 4.7 13.9l7.2 5.6C13.6 14.4 18.4 9.5 24 9.5z"/>'
    + '</svg>';

  var raiz = document.documentElement;
  function abrir(){ raiz.classList.remove('cerrado'); var p=document.getElementById('puerta'); if(p) p.remove(); }

  // 🔴 LA EXCEPCION QUE NO PUEDE FALTAR. `registro.html` es DOS cosas: la pagina del metodo (con la
  // guia de instalacion) y, con `&solo=1` o `&embed=1`, el RANKING PUBLICO — el que se proyecta en
  // clase y el que va incrustado en el Genially del alumnado. Si la puerta tapara esos modos, el
  // alumnado se encontraria con una puerta dentro de su propio Genially. Lo mismo con el panorama
  // de tickets, que se proyecta apaisado.
  var q = new URLSearchParams(location.search);
  if (q.get('embed') === '1' || q.get('solo') === '1' || q.get('panorama') === '1') { abrir(); return; }

  /**
   * LA MARCA. La pone el motor cuando el servidor confirma que esa cuenta lleva algún grupo (ver
   * `misPERs` en motor.js). No es una contraseña —no se puede teclear— y desaparece al salir.
   *
   * Y no se abre por tener sesión a secas: un alumno también la tiene, y esto es material de
   * profesorado.
   */
  if (localStorage.getItem('sgEsDocente') === '1') { abrir(); return; }

  function pintar(aviso){
    var d = document.createElement('div');
    d.id = 'puerta';
    d.innerHTML =
      '<div class="puerta-caja">'
      + '<div class="eyebrow amber">Zona del profesorado</div>'
      + '<h2>Material del profesorado</h2>'
      + '<p class="small muted">Entra con la <b>cuenta de Google</b> con la que tu profe referente '
      + 'te apuntó al equipo docente. No hay ningún PIN: se te reconoce una vez en este navegador y '
      + 'no se vuelve a pedir.</p>'
      + (aviso ? '<p class="puerta-mal">' + aviso + '</p>' : '')
      /**
       * 🔴 EL LOGO DE GOOGLE, Y NO ES DECORACIÓN. Norberto lo vio al primer vistazo: «aquí no
       * aparece el inicio de Google, debe quedar claro». Un botón que solo dice «entrar con mi
       * cuenta» no promete nada — quien lo pulsa no sabe si le va a pedir una contraseña nueva,
       * inventarse un usuario o qué. La marca de Google dice, sin leer una palabra, que la
       * contraseña se teclea en Google y no aquí. Es la diferencia entre pulsar y desconfiar.
       *
       * Va en SVG dentro de la página a propósito: si se cargara de un servidor de Google, el día
       * que ese enlace cambie el botón se queda mudo justo en la pantalla que pide confianza.
       */
      + '<p><button class="btn primary btn-google" id="puertaCuenta">' + LOGO_G
      + '<span>Iniciar sesión con Google</span></button></p>'
      + '<p class="small muted puerta-tranquilo">Te llevará a la pantalla de Google. '
      + 'Tu contraseña se escribe allí, nunca aquí.</p>'
      + '<p class="small muted" style="margin-top:14px">¿Eres estudiante? Tu sitio es '
      + '<a href="index.html">la puerta principal</a> — aquí no hay nada para ti.</p>'
      + '</div>';
    document.body.appendChild(d);

    var bc = document.getElementById('puertaCuenta');
    bc.onclick = function(){
      bc.disabled = true; bc.textContent = 'Comprobando…';
      var M = window.SG && window.SG.MOTOR;
      /**
       * 🔴 La mayoría de estas páginas NO cargan el motor: la guía, la cronología, los recursos y
       * las actividades son documentos, y meterles medio megabyte de Firebase para vigilar una
       * puerta sería pagar en cada visita por algo que se usa una vez. Así que se manda a la sala,
       * que sí lo carga, CON EL DESTINO PUESTO: allí se entra con la cuenta, queda la marca y la
       * sala devuelve a la persona a donde iba. Sin el `volver` se quedaría en la sala mirando otra
       * cosa, preguntándose qué ha pasado con el enlace que pulsó.
       */
      if (!M || !M.sesion || !M.misPERs) {
        location.href = 'clase.html?volver=' + encodeURIComponent(location.pathname.replace(/^\//, ''));
        return;
      }
      M.sesion().then(function(yo){
        if (yo) return yo;
        return M.entrar().then(function(){ return M.sesion(); });
      }).then(function(yo){
        if (!yo) throw new Error('No se ha podido entrar.');
        return M.misPERs(yo.correo);
      }).then(function(ps){
        if (ps && ps.length) { abrir(); return; }
        d.remove();
        pintar('Esa cuenta no lleva ningún grupo. Pídele a tu profe referente que te añada al equipo docente con <b>ese mismo correo</b>.');
      }).catch(function(e){
        d.remove(); pintar('No se ha podido comprobar: ' + e.message);
      });
    };
    bc.focus();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ pintar(''); });
  else pintar('');
})();
