// STARGATE — visita guiada con el Capitán (autogenerado por _build_site.py: editar TOUR_JS, no este fichero)
// Empieza en Mis grupos; si la cuenta es de referente (se ve su zona), suma los pasos de crear grupo.
(function(){
  var KEYR='sgTourRol';
  /**
   * 🔴 13-sep · LA VISITA, REHECHA CON LA WEB DE HOY. Empezaba en la portada pública («esta web es tu
   * puesto de mando»), pasaba por el «Registro» de la hoja de cálculo y acababa mandando al «panel
   * del profesorado con el PIN que te dará tu referente». Tres paradas en sitios que ya no existen.
   *
   * Ahora empieza donde aterriza el docente —Mis grupos— y señala los botones de verdad: el código de
   * clase, proyectar, la llamada, el aula y su gente. Luego el método (guía, cronología, actividades).
   * Lo del referente ya no se pregunta: se VE. Si en Mis grupos está la zona del referente, la visita
   * suma sus pasos; si no, no los enseña.
   *
   * Tres claves nuevas en cada paso: `espera` (la consola pinta los grupos cuando llega la sesión, así
   * que el paso aguarda a que su objetivo exista), `si` (si el objetivo no aparece, el paso se salta en
   * vez de señalar al vacío) y `rol` (el paso que mira si eres referente).
   */
  var BASE=[
   {p:'consola.html',sel:'.gp',listo:'.gp',espera:1,rol:1,pose:'saluda',t:'Bienvenido al mando',x:'Recluta… perdón: <b>Capitán</b>. Soy tu homólogo en la historia. Esto es <b>Mis grupos</b>, tu puesto de mando: cada tarjeta es un grupo tuyo, y todo lo de clase sale de ella. Te lo enseño en dos minutos.'},
   {p:'consola.html',sel:'.gp-invita',listo:'.gp',espera:1,si:1,pose:'senala',t:'Lo primero: tu clase',x:'El <b>código de clase</b>, en grande para escribirlo en la pizarra. <b>«Copiar invitación»</b> te da un mensaje listo para pegar en el foro de la plataforma de UNIR, con el enlace dentro. Tu alumnado entra con Google, escribe el código y se alista solo.'},
   {p:'consola.html',sel:'.gp-b.principal',listo:'.gp',espera:1,si:1,pose:'tablet',t:'Cada clase empieza aquí',x:'<b>Proyectar la clase</b>: la sesión de la semana ya montada —el planeta, los vídeos, los retos y las insignias—; pasas con las flechas. Arriba, solo para ti, el consejo del Capitán y el mensaje de la semana para el foro.'},
   {p:'consola.html',sel:'.gp-hacer',listo:'.gp',espera:1,si:1,pose:'brazos',t:'Durante la clase',x:'<b>Llamada a filas</b> es el pase de lista con premio: tu alumnado pulsa «Presente» en su Nave y se lleva créditos y un sobre de cromos. <b>El aula</b> te dice quién ha fichado, a quién felicitar y el ranking, y deja repartir premios a mano. Las dos se incrustan en tu Genially con <code>?embed=1</code>.'},
   {p:'consola.html',sel:'.gp-abrir',listo:'.gp',espera:1,si:1,pose:'tablet',t:'Tu gente',x:'<b>Ver mi gente y los ajustes</b>: la lista con sus xp, créditos, insignias y los <b>enlaces de sus evidencias</b>. Pulsa una fila para otorgar o anular un reto. Ahí está también la <b>Cola de nota</b>: ninguna subida de nota se aplica sin tu visto bueno.'},
   {p:'consola.html',sel:'.ref-zona',listo:'.gp',espera:1,si:1,soloRef:1,pose:'senala',t:'Como referente',x:'Lo tuyo como referente: <b>crear un grupo</b> en un minuto, los <b>tickets de salida</b> de todas tus clases y el montaje paso a paso. Dentro de cada grupo verás además <b>Equipo docente</b>, <b>Escuadrones</b>, <b>Premios por enlace</b> y <b>Ajustes</b>.'},
   {p:'guia.html',sel:'#pers',pose:'brazos',t:'Las voces y la Tripulación Cero',x:'<b>NEBULA</b> narra, <b>yo</b> doy las órdenes (o sea, tú) y <b>Vaeon</b> silencia. Ocho tripulantes esperan a que tu alumnado los recupere, uno por tema. Pulsa cualquier insignia: verás su reto y su frase.'},
   {p:'guia.html',sel:'#retos',pose:'tablet',t:'Dos retos por tema',x:'El <b>Reto A</b> da la <b>insignia</b> del personaje: no cuenta para nota, aunque da 100 xp y 20 ◈. El <b>Reto B</b> produce una evidencia real de la Bitácora (250 xp y 50 ◈) y <b>pide su enlace</b>. Los <b>xp</b> suben de nivel y nunca se gastan; los <b>créditos ◈</b> son lo que se canjea. Y nadie registra más de 3 retos al día.'},
   {p:'cronologia.html',sel:'#mapa',pose:'senala',t:'Tu carta de navegación',x:'El mapa de las <b>15 semanas</b>: qué vídeo proyectar, qué reto lanzar, qué insignia entregar y el hito de evaluación. Sin fechas: semanas, como tu aula.'},
   {p:'cronologia.html',sel:'#sem1',pose:'pensativo',t:'La orden del día',x:'Despliega una semana y tendrás la orden completa, con los vídeos reproducibles aquí mismo y el <b>mensaje para el foro de la plataforma de UNIR</b>, listo para copiar (la firma es siempre «Capitán», a secas). Tu alumnado ya lo ve solo en su Nave.'},
   {p:'actividades.html',sel:'#act1',pose:'pensativo',t:'Misiones y evaluación',x:'Las dos misiones mayores, el ePortfolio y el examen con los <b>requisitos oficiales</b>, más los documentos para descargar.'}
  ];
  var REF=[
   {p:'crear.html',sel:'',pose:'tablet',t:'Referente: crear un grupo',x:'Los grupos se crean <b>aquí</b>, con tu cuenta de Google: nombre, tipo REGULAR/PUA, primer día de la semana 1, los enlaces de la clase y el equipo docente. En un minuto queda sembrado entero —los retos, los 8 planetas, la tienda, los escuadrones y el álbum— y sale su <b>código de clase</b>.'},
   {p:'crear.html',sel:'',pose:'senala',t:'Referente: el equipo y la fecha',x:'No hay PIN que repartir. Pones a cada docente con <b>su correo</b> en el equipo y con eso entra en Mis grupos iniciando sesión con Google; si alguien se va, lo quitas del equipo y deja de entrar. Lo que sí tienes que poner bien es la <b>fecha de la semana 1</b>: marca el ritmo de todo, desde la orden de la semana hasta los desbloqueos de la Nave.'}
  ];
  var FINAL={p:'consola.html',sel:'.gp',listo:'.gp',espera:1,pose:'pulgar',t:'Listo para el salto',x:'Eso es todo, Capitán. Cuando quieras repasarlo, <b>▶ Visita guiada</b> en la barra de arriba; y las dudas de siempre, en las <a href="guia.html#faq">preguntas frecuentes</a>. Recuerda: <b>una obra que no se documenta, no existe</b>. Corto y cierro.'};
  // v3.35 · VISITAS DE UNA SOLA PÁGINA. La de arriba recorre toda la web; una página puede declarar
  // la suya con `window.SG_TOUR_LOCAL = {clave, pasos:[…]}` — es lo que hace la sala del docente para
  // explicar el ORDEN de lo que tiene que hacer el alumnado. No salta de página y lleva su propia
  // cuenta de «ya vista», para que una no borre a la otra.
  function local(){ return window.SG_TOUR_LOCAL || null; }
  var modo='global';
  function steps(){
    if(modo==='local'){ var L=local(); return (L&&L.pasos)||[]; }
    // lo del referente, solo a quien lo es: fuera de la lista (no «saltado»), para que el contador
    // «N / total» no se coma números por el camino
    var ref = localStorage.getItem(KEYR)==='ref';
    return (ref ? BASE.concat(REF) : BASE.filter(function(x){ return !x.soloRef; })).concat([FINAL]); }
  var KEY='sgTourStep';
  function clavePaso(){ return modo==='local' ? 'sgTour_'+(local().clave||'x')+'_paso' : KEY; }
  function claveHecha(){ return modo==='local' ? 'sgTour_'+(local().clave||'x')+'_hecha' : 'sgTourDone'; }
  // Un paso puede traer un objetivo de reserva: el enlace del que habla no siempre existe (un PER sin
  // formularios publicados todavía), y entonces se señala el bloque que lo contiene.
  function objetivo(s){ var t=document.querySelector(s.sel); return t || (s.sel2 ? document.querySelector(s.sel2) : null); }
  function page(){var p=location.pathname.split('/').pop(); return p||'index.html';}
  function qs(){var m=location.search.match(/[?&]tour=(\d+)/); return m?parseInt(m[1],10):null;}
  var ov=null, recien=true, vigia=null, manual=false;
  // mousedown incluido: arrastrar la barra de scroll no dispara «wheel», y ahi tambien manda el usuario
  ['wheel','touchstart','keydown','mousedown'].forEach(function(ev){
    window.addEventListener(ev,function(){manual=true;},{passive:true});});
  function clearTarget(){Array.prototype.forEach.call(document.querySelectorAll('.tour-target'),function(e){e.classList.remove('tour-target');});}
  // v3.30 - EL SCROLL DE LA VISITA. scrollIntoView({block:'center'}) fallaba por dos motivos: al
  // llegar desde otra pagina se dispara mientras el navegador todavia esta colocando su propio
  // scroll, que lo cancela -por eso la visita se quedaba arriba del todo-; y con un objetivo mas
  // alto que la ventana, «centrar» deja el titulo fuera de plano. Ahora la posicion se calcula a
  // mano (debajo de la barra pegajosa y sin que el panel del Capitan tape lo señalado) y se
  // reintenta mientras la pagina siga creciendo, que las miniaturas de YouTube entran tarde.
  function altoBarra(){var n=document.querySelector('.nav'); if(!n) return 0;
    var p=getComputedStyle(n).position; return (p==='sticky'||p==='fixed')?n.getBoundingClientRect().height:0;}
  function donde(tg){
    var arriba=window.pageYOffset||document.documentElement.scrollTop||0;
    var r=tg.getBoundingClientRect(), y=r.top+arriba;
    var vh=document.documentElement.clientHeight, barra=altoBarra(), reserva=0;
    var caja=ov&&ov.querySelector('.tour-box');
    if(caja){var c=caja.getBoundingClientRect(); if(c.right>r.left&&c.left<r.right) reserva=c.height+24;}
    var libre=Math.max(140, vh-barra-reserva);
    var margen=(r.height>libre-32)?20:Math.max(20,(libre-r.height)/2);
    var tope=Math.max(0, document.documentElement.scrollHeight-vh);
    return Math.max(0, Math.min(tope, Math.round(y-barra-margen)));
  }
  function enfocar(tg,instante){
    if(vigia){clearInterval(vigia); vigia=null;}
    if(!tg) return;
    manual=false;
    // El CSS de la web pone html{scroll-behavior:smooth}, asi que hasta el ajuste mas pequeño se
    // convertia en una animacion; y mientras dura, lo que mide el guion no cuadra con lo que se ve
    // en pantalla, asi que el ajuste siguiente salia disparado (se iba 500 px de largo). Los
    // reajustes cortan en seco —y devuelven el CSS a su sitio— y solo el salto de paso es suave.
    function ir(suave){var y=donde(tg), arriba=window.pageYOffset||document.documentElement.scrollTop||0;
      if(Math.abs(y-arriba)<6) return;
      var raiz=document.documentElement, antes=raiz.style.scrollBehavior;
      if(!suave) raiz.style.scrollBehavior='auto';
      try{window.scrollTo({top:y,behavior:suave?'smooth':'auto'});}catch(e){window.scrollTo(0,y);}
      if(!suave) raiz.style.scrollBehavior=antes;}
    ir(!instante);
    // En la web de verdad la pagina sigue moviendose MUCHO despues de que el guion arranque: las
    // fotos entran sin medidas puestas y lo empujan todo. Asi que no basta con reintentar un par de
    // segundos: se insiste hasta que el objetivo lleve tres vueltas quieto y la pagina este cargada
    // del todo (con tope de 9 segundos), y se suelta el volante en cuanto el usuario toca la rueda.
    var t0 = new Date().getTime(), antes = null, quietas = 0;
    if (document.readyState !== 'complete')
      window.addEventListener('load', function(){ if(!manual) ir(false); });
    setTimeout(function(){
      if (manual) return;
      vigia = setInterval(function(){
        if (manual) { clearInterval(vigia); vigia=null; return; }
        var pos = Math.round(tg.getBoundingClientRect().top + (window.pageYOffset||document.documentElement.scrollTop||0));
        if (pos === antes) quietas++; else { quietas = 0; antes = pos; }
        ir(false);
        if ((document.readyState === 'complete' && quietas >= 3) || new Date().getTime()-t0 > 9000) {
          clearInterval(vigia); vigia = null;
        }
      }, 220);
    }, instante ? 120 : 700);
  }
  var esperando=null, sentido=1;
  function render(i, intento){
    var S=steps(); var s=S[i]; if(!s) return end();
    if(s.p&&s.p!==page()){localStorage.setItem(KEY,String(i)); location.href=s.p+'?tour='+i; return;}
    localStorage.setItem(clavePaso(),String(i));
    clearTarget();
    var tg=s.sel?objetivo(s):null;
    // la página aún no ha pintado lo que se señala (Mis grupos espera a la sesión): se aguarda, pero
    // solo mientras la página no esté lista (`listo`: sus grupos ya pintados). Lista y sin objetivo,
    // el objetivo no va a llegar: no se hace esperar a nadie.
    var lista = !s.listo || !!document.querySelector(s.listo);
    if(!tg && s.sel && s.espera && !lista && (intento||0) < 30){
      clearTimeout(esperando); esperando=setTimeout(function(){ render(i,(intento||0)+1); }, 250); return; }
    // si el paso depende de algo que en esta cuenta no existe (la zona del referente), se salta
    if(!tg && s.si){ var k=i+sentido; if(k>=0 && k<S.length) return render(k); }
    // y lo del referente se decide ANTES de pintar el contador, para que «1 / N» no cambie de N al paso 2
    if(s.rol && tg){ try{ localStorage.setItem(KEYR, document.querySelector('.ref-zona') ? 'ref' : 'doc'); }catch(e){} S=steps(); }
    if(tg){tg.classList.add('tour-target'); if(tg.tagName==='DETAILS') tg.open=true;}
    if(!ov){ov=document.createElement('div'); ov.className='tour'; document.body.appendChild(ov);}
    var btns = s.ask
      ? '<button type="button" class="tour-rol primary" data-rol="ref">🛰️ Sí, soy referente</button>'
        +'<button type="button" class="tour-rol" data-rol="doc">🎓 Imparto clases</button>'
        +'<button type="button" class="tour-exit">Salir</button>'
      : '<button type="button" class="tour-prev"'+(i===0?' disabled':'')+'>← Anterior</button>'
        +'<button type="button" class="tour-next primary">'+(i===S.length-1?'Terminar ✓':'Siguiente →')+'</button>'
        +'<button type="button" class="tour-exit">Salir</button>';
    ov.innerHTML='<div class="tour-box"><img class="tour-cap" src="assets/img/capitan/'+s.pose+'.png" alt="El Capitán">'
      +'<div class="tour-panel"><div class="tour-step">Visita guiada · '+(i+1)+' / '+S.length+'</div><h3>'+s.t+'</h3><p>'+s.x+'</p>'
      +'<div class="tour-btns">'+btns+'</div></div></div>';
    if(s.ask){ Array.prototype.forEach.call(ov.querySelectorAll('.tour-rol'),function(b){ b.onclick=function(){ localStorage.setItem(KEYR,b.getAttribute('data-rol')); render(i+1); }; }); }
    else { ov.querySelector('.tour-prev').onclick=function(){sentido=-1; render(i-1);};
           ov.querySelector('.tour-next').onclick=function(){sentido=1; if(i===S.length-1) end(); else render(i+1);}; }
    ov.querySelector('.tour-exit').onclick=end;
    ov.classList.add('open');
    enfocar(tg,recien); recien=false;   // el panel ya esta puesto: ahora se sabe cuanto tapa
  }
  function end(){localStorage.removeItem(clavePaso()); localStorage.setItem(claveHecha(),'1'); clearTarget();
    if(ov){ov.classList.remove('open'); ov.innerHTML='';}
    if(qs()!==null) history.replaceState(null,'',location.pathname);}
  document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.tour-start'); if(b){e.preventDefault();
    // El botón de la barra enseña LA VISITA DE ESTA PÁGINA si la hay y ya está pintada. Si todavía
    // no lo está —en la sala del docente hay que pasar el PIN antes—, no habría nada que señalar,
    // así que hace lo de siempre: la visita general de la web.
    var L=local();
    modo=(L&&L.pasos&&L.pasos.length&&document.querySelector(L.pasos[0].sel))?'local':'global';
    recien=true; render(0);}});
  // La página avisa cuando ya tiene algo que enseñar (ver clase.js). Se ofrece una sola vez.
  var ofrecida=false;
  window.sgTour={
    empezarLocal:function(){ var L=local(); if(!L)return; modo='local'; recien=true; render(0); },
    ofrecerLocal:function(){
      var L=local(); if(!L||ofrecida||localStorage.getItem('sgTour_'+(L.clave||'x')+'_hecha')) return;
      if(!document.querySelector(L.pasos[0].sel)) return;
      ofrecida=true;
      // una invitación cada vez: la de la visita general pudo quedarse abierta en la pantalla anterior
      Array.prototype.forEach.call(document.querySelectorAll('.tour-invite'),function(x){x.remove();});
      var inv=document.createElement('div'); inv.className='tour-invite';
      inv.innerHTML='<img src="assets/img/capitan/saluda.png" alt=""><div><b>'+(L.invita||'¿Te enseño esta sala?')+'</b><br>'
        +(L.invita2||'Sobre todo, el orden en que tu alumnado tiene que hacer las cosas.')+'</div>'
        +'<button type="button" class="tour-aqui">Empezar</button><button type="button" class="x" aria-label="Cerrar">✕</button>';
      document.body.appendChild(inv);
      inv.querySelector('.x').onclick=function(){inv.remove(); localStorage.setItem('sgTour_'+(L.clave||'x')+'_hecha','1');};
      inv.querySelector('.tour-aqui').onclick=function(){inv.remove(); window.sgTour.empezarLocal();};
    }};
  // al saltar de pagina en pagina, el navegador restaura SU scroll y se lleva por delante el nuestro
  var q=qs(); if(q!==null){ try{ if('scrollRestoration' in history) history.scrollRestoration='manual'; }catch(e){} render(q); }
  // 🔴 9-sep · LA INVITACION SE MUDA A LA GUIA. Vivia en index.html cuando index.html ERA el puesto
  // de mando. Desde que la portada es la puerta publica del proyecto, el globo del Capitan le
  // preguntaba «¿primera vez en el puesto de mando?» a cualquiera que pasara por ahi — a un
  // estudiante, a alguien de fuera. Ahora saluda en guia.html, la primera parada de quien lee el
  // metodo. 🔴 12-sep · «Soy docente» ya NO lleva a la guia sino a consola.html: quien pulsa eso
  // quiere ENTRAR, no leer, y la guia es un documento.
  // 🔴 13-sep · Y SALUDA SOBRE TODO EN «MIS GRUPOS», que es donde aterriza el docente al entrar: la
  // guía era la primera parada de quien leía el método, pero hoy la primera parada es su puesto de
  // mando. Allí espera a que estén pintados sus grupos (sin sesión no hay nada que enseñar) y no sale
  // dentro de un grupo abierto, que tiene su propia visita.
  function invitar(){
    if(localStorage.getItem('sgTourDone') || localStorage.getItem(KEY) || document.querySelector('.tour-invite')) return;
    var inv=document.createElement('div'); inv.className='tour-invite';
    inv.innerHTML='<img src="assets/img/capitan/saluda.png" alt=""><div><b>¿Primera vez en el puesto de mando?</b><br>Te lo enseño en dos minutos.</div><button type="button" class="tour-start">Empezar</button><button type="button" class="x" aria-label="Cerrar">✕</button>';
    document.body.appendChild(inv);
    inv.querySelector('.x').onclick=function(){inv.remove(); localStorage.setItem('sgTourDone','1');};
    inv.querySelector('.tour-start').addEventListener('click',function(){inv.remove();});
  }
  if(q===null && page()==='guia.html') invitar();
  if(q===null && page()==='consola.html'){
    var vueltas=0, vigila=setInterval(function(){
      if(document.querySelector('.gp')){ clearInterval(vigila); invitar(); }
      else if(++vueltas>60) clearInterval(vigila);
    }, 300);
  }
})();
