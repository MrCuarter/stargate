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
  // La «G» oficial de Google vive en stargate.js (window.SG.LOGO_G) — una sola copia para las
  // cinco puertas. Estas páginas cargan stargate.js antes que este fichero (ambos `defer`, y
  // `defer` respeta el orden del documento), así que a esta altura ya está puesta.
  var LOGO_G = (window.SG && window.SG.LOGO_G) || "";

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
       * puerta sería pagar en cada visita por algo que se usa una vez. Así que se manda a `entrar.html`,
       * que sí lo carga, CON EL DESTINO PUESTO: allí se entra con la cuenta, queda la marca y la
       * puerta devuelve a la persona a donde iba.
       *
       * 🔴 12-sep · ANTES MANDABA A `clase.html`, Y AHÍ ESTABA EL FALLO QUE PILLÓ NORBERTO AL
       * PRIMER CLIC. La sala dibuja su botón de Google DENTRO de `#clase-app`, que va después del
       * hero: a 734 px de scroll en una página de 1.013. Pulsabas «Iniciar sesión con Google» en la
       * guía, aterrizabas en una pared de texto sin un solo botón a la vista y concluías —con toda
       * la razón— que «no hay manera de iniciar sesión». Un redirect no sirve de nada si deja a la
       * persona mirando la mitad equivocada de otra página.
       */
      if (!M || !M.sesion || !M.misPERs) {
        /**
         * 🔴 CON LA CONSULTA PUESTA. Antes solo viajaba el nombre del fichero, así que quien pulsaba
         * la puerta en `sesion.html?per=prueba-humana` volvía a `sesion.html` a secas y perdía el
         * grupo. Con uno da igual —se deduce de la cuenta—; con dos a la vez, que es lo que pasa
         * cada enero, la página abre el que ella decida y no el que tú habías abierto.
         */
        var destino = location.pathname.replace(/^\//, '') + (location.search || '');
        location.href = 'entrar.html?volver=' + encodeURIComponent(destino);
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
