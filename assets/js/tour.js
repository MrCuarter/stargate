// STARGATE — visita guiada con el Capitán (onboarding)
(function(){
  var STEPS=[
   {p:'index.html',sel:'#hero-cta',pose:'saluda',t:'Bienvenido al mando',x:'Recluta… perdón: <b>Capitán</b>. Soy tu homólogo en la historia. Esta web es tu puesto de mando: todo lo que necesitas para pilotar STARGATE en tu aula está aquí. Sígueme.'},
   {p:'index.html',sel:'#en60',pose:'tablet',t:'La misión en 60 segundos',x:'La galaxia se apaga por la Estática. Tu alumnado son reclutas: <b>8 planetas = 8 temas</b>, y una <b>Bitácora</b> (el ePortfolio) que lo reenciende todo. La batalla final es el examen.'},
   {p:'guia.html',sel:'#pers',pose:'brazos',t:'Las voces y la Tripulación Cero',x:'<b>NEBULA</b> narra, <b>yo</b> doy las órdenes (o sea, tú) y <b>Vaeon</b> silencia. Ocho tripulantes esperan a que tu alumnado los recupere, uno por tema. Pulsa cualquier insignia: verás su reto y su frase.'},
   {p:'guia.html',sel:'#retos',pose:'tablet',t:'Dos retos por tema',x:'El <b>Reto A</b> desbloquea al personaje: no cuenta para nota, aunque da 100 xp simbólicos del juego. El <b>Reto B</b> produce una evidencia real de la Bitácora. 24 insignias en total: entrégalas en público y con su frase.'},
   {p:'cronologia.html',sel:'#mapa',pose:'senala',t:'Tu carta de navegación',x:'El mapa de las <b>15 semanas</b>: qué vídeo proyectar, qué reto lanzar, qué insignia entregar y el hito de evaluación. Sin fechas: semanas, como tu aula.'},
   {p:'cronologia.html',sel:'#sem1',pose:'pensativo',t:'La orden del día',x:'Despliega una semana y tendrás la orden completa, con los vídeos reproducibles aquí mismo y el <b>mensaje del foro listo para copiar</b> (la firma es siempre «Capitán», a secas). Empieza por la semana 1.'},
   {p:'actividades.html',sel:'#act1',pose:'pensativo',t:'Misiones y evaluación',x:'Las dos misiones mayores, el ePortfolio y el examen con los <b>requisitos oficiales</b>, más los documentos para descargar.'},
   {p:'geniallys.html',sel:'#lista',pose:'senala',t:'Los Geniallys',x:'La carpeta de Genially está <b>compartida con todo el profesorado</b>: busca la carpeta de tu perfil y usa los <b>Geniallys estándar</b> tal cual. ¿Quieres personalizar uno? Haz una copia; el sistema enlaza siempre a los estándar.'},
   {p:'registro.html',sel:'#registro',pose:'tablet',t:'El registro es automático',x:'Tu alumnado registra sus insignias solo, en la <b>Bitácora de mando</b> de su PER, y el <b>tablero en vivo</b> se actualiza al momento: xp, rangos y avatares. Tu papel es la <b>ceremonia</b>: entrega cada insignia en público y con su frase.'},
   {p:'registro.html',sel:'#profe-herramientas',pose:'brazos',t:'Tus sensores de a bordo',x:'El <b>ticket de salida</b> te devuelve valoraciones y dudas anónimas de cada clase, y el <b>canje de xp</b> se valida solo: a ti solo te llegan los canjes pendientes de aplicar. Cada uno con su panel visual.'},
   {p:'index.html',sel:'#secciones',pose:'senala',t:'Tus herramientas de mando',x:'Desde aquí llegas al <b>panel del profesorado</b> (con PIN), a los <b>tickets</b>, al <b>foro dinámico</b> para el Genially del PER y al <b>generador de enlaces, embeds y QR</b>. Todo lo que se incrusta sale de ahí.'},
   {p:'index.html',sel:'#hero-cta',pose:'pulgar',t:'Listo para el salto',x:'Eso es todo, Capitán. La nave es tuya. Y recuerda: <b>una obra que no se documenta, no existe</b>. Corto y cierro.'}
  ];
  var KEY='sgTourStep';
  function page(){var p=location.pathname.split('/').pop(); return p||'index.html';}
  function qs(){var m=location.search.match(/[?&]tour=(\d+)/); return m?parseInt(m[1],10):null;}
  var ov=null;
  function clearTarget(){Array.prototype.forEach.call(document.querySelectorAll('.tour-target'),function(e){e.classList.remove('tour-target');});}
  function render(i){
    var s=STEPS[i]; if(!s) return end();
    if(s.p!==page()){localStorage.setItem(KEY,String(i)); location.href=s.p+'?tour='+i; return;}
    localStorage.setItem(KEY,String(i));
    clearTarget();
    var tg=document.querySelector(s.sel);
    if(tg){tg.classList.add('tour-target'); if(tg.tagName==='DETAILS') tg.open=true; tg.scrollIntoView({behavior:'smooth',block:'center'});}
    if(!ov){ov=document.createElement('div'); ov.className='tour'; document.body.appendChild(ov);}
    ov.innerHTML='<div class="tour-box"><img class="tour-cap" src="assets/img/capitan/'+s.pose+'.png" alt="El Capitán">'
      +'<div class="tour-panel"><div class="tour-step">Visita guiada · '+(i+1)+' / '+STEPS.length+'</div><h3>'+s.t+'</h3><p>'+s.x+'</p>'
      +'<div class="tour-btns"><button type="button" class="tour-prev"'+(i===0?' disabled':'')+'>← Anterior</button>'
      +'<button type="button" class="tour-next primary">'+(i===STEPS.length-1?'Terminar ✓':'Siguiente →')+'</button>'
      +'<button type="button" class="tour-exit">Salir</button></div></div></div>';
    ov.querySelector('.tour-prev').onclick=function(){render(i-1);};
    ov.querySelector('.tour-next').onclick=function(){ if(i===STEPS.length-1) end(); else render(i+1);};
    ov.querySelector('.tour-exit').onclick=end;
    ov.classList.add('open');
  }
  function end(){localStorage.removeItem(KEY); localStorage.setItem('sgTourDone','1'); clearTarget();
    if(ov){ov.classList.remove('open'); ov.innerHTML='';}
    if(qs()!==null) history.replaceState(null,'',location.pathname);}
  document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.tour-start'); if(b){e.preventDefault(); render(0);}});
  var q=qs(); if(q!==null) render(q);
  // primera visita a la portada: invitación discreta
  if(page()==='index.html' && q===null && !localStorage.getItem('sgTourDone') && !localStorage.getItem(KEY)){
    var inv=document.createElement('div'); inv.className='tour-invite';
    inv.innerHTML='<img src="assets/img/capitan/saluda.png" alt=""><div><b>¿Primera vez en el puesto de mando?</b><br>Te lo enseño en dos minutos.</div><button type="button" class="tour-start">Empezar</button><button type="button" class="x" aria-label="Cerrar">✕</button>';
    document.body.appendChild(inv);
    inv.querySelector('.x').onclick=function(){inv.remove(); localStorage.setItem('sgTourDone','1');};
    inv.querySelector('.tour-start').addEventListener('click',function(){inv.remove();});
  }
})();
