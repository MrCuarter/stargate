// STARGATE — PRUEBA EN PARALELO del inicio de sesión con Google. pruebalogin.html
//
// 🔴 POR QUÉ ESTA PÁGINA EXISTE Y POR QUÉ NO ESTÁ ENLAZADA EN NINGÚN SITIO.
// Norberto, 11-sep: «¿no podemos hacer una prueba paralela para iniciar sesión con Google? Algo que
// no rompa nada». Esto no toca la Nave, ni los formularios, ni los despliegues, ni un solo permiso
// de lo que ya funciona. Si sale mal, se borra el fichero y nadie se entera.
//
// QUÉ SE PROBÓ ANTES Y POR QUÉ SE DESCARTÓ (esta mañana): un despliegue «ejecuta como quien accede».
// Devolvía el correo verificado, sí — pero obligaba a cada estudiante a autorizar TODOS los permisos
// del script: Drive entero, Hojas, Formularios, enviar correo. Google marca eso como sensible y, sin
// verificar la app, enseña una pantalla roja de aviso. Delante de 70 personas eso no se enseña.
//
// LA DIFERENCIA DE ESTE CAMINO, que es toda la gracia: aquí el estudiante NO le da permisos al
// script. Le da permiso a una aplicación distinta, y solo para «ver tu dirección de correo», que es
// un permiso NO sensible: pantalla normal de elegir cuenta, sin cartel rojo y sin proceso de
// verificación por parte de Google. El script se limita a preguntarle a Google si el token es bueno.
//
// LO QUE ESTA PÁGINA ENSEÑA, y es lo que hay que entender antes de fiarse: el navegador puede LEER
// el token (cualquiera puede), pero eso no prueba nada — un token se puede inventar. Lo que vale es
// lo que contesta el SERVIDOR después de preguntárselo a Google. Por eso se pintan las dos cosas
// una al lado de la otra.
(function () {
  var API = (window.SG_TABLERO_API || "").trim();
  var CID = (window.SG_GOOGLE_CLIENT_ID || "").trim();
  var root = document.getElementById('login-app');
  if (!root) return;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // Sin ID de cliente no se carga NADA de Google: la prueba nace apagada.
  if (!CID) {
    root.innerHTML = '<div class="card" style="border-color:var(--amber)">'
      + '<h3>La prueba está apagada</h3>'
      + '<p>Falta el <b>ID de cliente de OAuth</b>. Se crea en Google Cloud con la cuenta '
      + '<b>mutecdgami</b>, en un proyecto <b>aparte</b> — así no se toca el del script:</p>'
      + '<ol class="pasos-login">'
      + '<li><a href="https://console.cloud.google.com" target="_blank" rel="noopener">console.cloud.google.com</a> → <b>Nuevo proyecto</b> → «STARGATE Login»</li>'
      + '<li><b>APIs y servicios → Pantalla de consentimiento de OAuth</b> → tipo <b>Externo</b> → nombre «STARGATE», tu correo de asistencia y de contacto</li>'
      + '<li><b>Credenciales → Crear credenciales → ID de cliente de OAuth → Aplicación web</b></li>'
      + '<li>En <b>Orígenes autorizados de JavaScript</b>: <code>https://stargate.mistercuarter.es</code></li>'
      + '<li>Copia el <b>ID de cliente</b> y ponlo en <code>_site_data.py</code> → <code>GOOGLE_CLIENT_ID</code></li>'
      + '<li>Vuelve a la pantalla de consentimiento y pulsa <b>Publicar aplicación</b></li>'
      + '</ol>'
      + '<p class="small muted">🔴 Como solo pedimos el correo (permiso <b>no sensible</b>), Google '
      + '<b>no exige verificar la aplicación</b>: no hay que solicitar nada ni esperar a nadie.</p>'
      + '<p class="small muted">El ID de cliente <b>no es un secreto</b>: va escrito en el HTML de '
      + 'cualquier web que use este botón. Lo que cierra la puerta es que el servidor comprueba que '
      + 'el token se emitió <b>para este id</b>, no que el id sea privado.</p>'
      + '</div>';
    return;
  }

  root.innerHTML = '<div class="card"><h3>1 · Entra con tu cuenta de Google</h3>'
    + '<p class="small muted">Fíjate en lo que te pide la pantalla: debería decir solo <b>«Ver tu '
    + 'dirección de correo electrónico»</b>. Si menciona Drive, Hojas o Formularios, algo está mal '
    + 'montado y hay que parar.</p>'
    + '<div id="gbtn" style="margin:14px 0"></div>'
    + '<div id="resultado"></div></div>';

  function pinta(html) { document.getElementById('resultado').innerHTML = html; }

  // el «payload» de un JWT es base64url: se puede leer sin ninguna clave. Justo por eso NO prueba nada.
  function leerSinVerificar(jwt) {
    try {
      var p = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(atob(p).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')));
    } catch (e) { return {}; }
  }

  function alEntrar(resp) {
    var jwt = resp && resp.credential;
    if (!jwt) { pinta('<p class="small">Google no ha devuelto ningún token.</p>'); return; }
    var suelto = leerSinVerificar(jwt);
    pinta('<h3 style="margin-top:18px">2 · Lo que dice el navegador</h3>'
      + '<div class="card" style="background:rgba(255,255,255,.03)">'
      + '<p><b>' + esc(suelto.email || '—') + '</b>'
      + (suelto.name ? ' <span class="muted">· ' + esc(suelto.name) + '</span>' : '') + '</p>'
      + '<p class="small muted">🔴 Esto <b>no vale como prueba</b>: cualquiera puede leer un token, e '
      + 'inventarse uno. Sirve para verlo, no para fiarse.</p></div>'
      + '<h3 style="margin-top:18px">3 · Lo que dice el servidor</h3>'
      + '<div class="card" id="srv">' + '<p class="small muted">Preguntándole a Google…</p></div>');

    // ⚠ El token va en la URL porque el script lo lee en doGet, y eso vale para una PRUEBA pero
    // no para producción: una URL acaba en registros de servidor, en el historial y en cabeceras
    // Referer. Si esto se adopta, lo primero es moverlo a POST. Queda escrito para no olvidarlo.
    // (El token caduca en una hora y solo sirve para saber un correo, así que el riesgo aquí es
    // pequeño — pero «pequeño» no es «ninguno».)
    fetch(API + '?accion=verificar_token&token=' + encodeURIComponent(jwt), { redirect: 'follow' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var ok = d && d.ok;
        document.getElementById('srv').innerHTML = ok
          ? '<p style="font-size:1.3rem"><b>' + esc(d.correo) + '</b> ✅</p>'
            + '<p class="small">Google confirma que el token es auténtico, que se emitió <b>para esta '
            + 'aplicación</b> y que el correo está verificado. <b>Esto sí vale.</b></p>'
            + (suelto.email && String(suelto.email).toLowerCase() !== d.correo
               ? '<p class="small" style="color:var(--amber)">⚠ El servidor y el navegador no dicen lo '
                 + 'mismo. Manda el servidor.</p>' : '')
          : '<p style="color:var(--amber)"><b>No ha colado:</b> ' + esc((d && d.error) || 'sin respuesta') + '</p>'
            + '<p class="small muted">Si dice «El token no es de esta aplicación», el ID de cliente de '
            + 'la página y el guardado en el script no son el mismo.</p>';
      })
      .catch(function (e) {
        document.getElementById('srv').innerHTML = '<p style="color:var(--amber)">No he podido hablar con el script: ' + esc(e.message) + '</p>';
      });
  }

  var sc = document.createElement('script');
  sc.src = 'https://accounts.google.com/gsi/client';
  sc.async = true;
  sc.onload = function () {
    try {
      google.accounts.id.initialize({ client_id: CID, callback: alEntrar });
      google.accounts.id.renderButton(document.getElementById('gbtn'),
        { theme: 'filled_blue', size: 'large', text: 'signin_with', locale: 'es' });
    } catch (e) {
      pinta('<p style="color:var(--amber)">No he podido arrancar el botón de Google: ' + esc(e.message) + '</p>');
    }
  };
  sc.onerror = function () { pinta('<p style="color:var(--amber)">No se ha podido cargar el script de Google.</p>'); };
  document.head.appendChild(sc);
})();
