// STARGATE — visita guiada con el Capitán (onboarding del profesorado)
// Pregunta el rol al empezar: profe referente -> pasos extra (hoja maestra, PIN, panel de control).
(function(){
  var KEYR='sgTourRol';
  var BASE=[
   {p:'index.html',sel:'#hero-cta',pose:'saluda',t:'Bienvenido al mando',x:'Recluta… perdón: <b>Capitán</b>. Soy tu homólogo en la historia. Esta web es tu puesto de mando: todo lo que necesitas para pilotar STARGATE en tu aula está aquí. Sígueme.'},
   {p:'index.html',sel:'#hero-cta',pose:'pensativo',ask:true,t:'Una pregunta de mando',x:'¿Eres el <b>profesor o profesora referente</b> de tu PER (quien lo crea y lo gestiona), o <b>impartes las clases</b>? Si eres referente te enseñaré también la sala de máquinas.'},
   {p:'index.html',sel:'#en60',pose:'tablet',t:'La misión en 60 segundos',x:'La galaxia se apaga por la Estática. Tu alumnado son reclutas: <b>8 planetas = 8 temas</b>, y una <b>Bitácora</b> (el ePortfolio) que lo reenciende todo. La batalla final es el examen.'},
   {p:'guia.html',sel:'#pers',pose:'brazos',t:'Las voces y la Tripulación Cero',x:'<b>NEBULA</b> narra, <b>yo</b> doy las órdenes (o sea, tú) y <b>Vaeon</b> silencia. Ocho tripulantes esperan a que tu alumnado los recupere, uno por tema. Pulsa cualquier insignia: verás su reto y su frase.'},
   {p:'guia.html',sel:'#retos',pose:'tablet',t:'Dos retos por tema',x:'El <b>Reto A</b> da la <b>insignia</b> del personaje: no cuenta para nota, aunque da 100 xp y 10 ◈. El <b>Reto B</b> produce una evidencia real de la Bitácora (250 xp y 30 ◈). Recuerda la regla: los <b>xp</b> suben de nivel y nunca se gastan; los <b>créditos ◈</b> son lo que se canjea.'},
   {p:'cronologia.html',sel:'#mapa',pose:'senala',t:'Tu carta de navegación',x:'El mapa de las <b>15 semanas</b>: qué vídeo proyectar, qué reto lanzar, qué insignia entregar y el hito de evaluación. Sin fechas: semanas, como tu aula.'},
   {p:'cronologia.html',sel:'#sem1',pose:'pensativo',t:'La orden del día',x:'Despliega una semana y tendrás la orden completa, con los vídeos reproducibles aquí mismo y el <b>mensaje del foro listo para copiar</b> (la firma es siempre «Capitán», a secas). Empieza por la semana 1.'},
   {p:'actividades.html',sel:'#act1',pose:'pensativo',t:'Misiones y evaluación',x:'Las dos misiones mayores, el ePortfolio y el examen con los <b>requisitos oficiales</b>, más los documentos para descargar.'},
   {p:'geniallys.html',sel:'#lista',pose:'senala',t:'Los Geniallys',x:'La carpeta de Genially está <b>compartida con todo el profesorado</b>: busca la carpeta de tu perfil y usa los <b>Geniallys estándar</b> tal cual. ¿Quieres personalizar uno? Haz una copia; el sistema enlaza siempre a los estándar.'},
   {p:'registro.html',sel:'#registro',pose:'tablet',t:'El registro es automático',x:'Tu alumnado registra sus insignias solo, en la <b>Bitácora de mando</b> de su PER, y el <b>tablero en vivo</b> se actualiza al momento: xp, rangos y avatares. Tu papel es la <b>ceremonia</b>: entrega cada insignia en público y con su frase.'},
   {p:'registro.html',sel:'#profe-herramientas',pose:'brazos',t:'Tus sensores de a bordo',x:'El <b>ticket de salida</b> te devuelve valoraciones y dudas anónimas de cada clase, y el <b>canje de xp</b> se valida solo: a ti solo te llegan los canjes pendientes de aplicar. Cada uno con su panel visual.'},
   {p:'index.html',sel:'#secciones',pose:'senala',t:'Tus herramientas de mando',x:'Desde aquí llegas al <b>panel del profesorado</b> (con el PIN que te dará tu referente), a los <b>tickets</b>, a la <b>Nave del Recluta</b> y al <b>foro dinámico</b> para el Genially del PER, y al <b>generador de enlaces, embeds y QR</b>.'}
  ];
  var REF=[
   {p:'registro.html',sel:'#instalacion',pose:'tablet',t:'Referente: la hoja maestra',x:'Los PER se crean desde la <b>hoja maestra</b> (cuenta mutecdgami): menú <b>STARGATE → Crear nuevo PER…</b> — nombre, tipo REGULAR/PUA, fecha de la semana 1 y profesorado. En un minuto: los 3 formularios, el tablero, el foro dinámico, la <b>Nave del Recluta</b> y un <b>Doc con todos los enlaces, embeds y QR</b> para repartir.'},
   {p:'registro.html',sel:'#instalacion',pose:'senala',t:'Referente: el PIN y las fechas',x:'Define el <b>PIN compartido</b> (menú STARGATE → Cambiar PIN) y repárteselo a tu profesorado: abre el panel del PER y los tickets. La <b>fecha de la semana 1</b> que pones al crear el PER marca el ritmo de todo: foro dinámico, desbloqueos de la Nave y recompensas.'},
   {p:'geniallys.html',sel:'#lista',pose:'brazos',t:'Referente: el panel de control Genially',x:'El <b>panel de control</b> es el Genially con los planetas que enlaza a las presentaciones. Todos los PER heredan el <b>estándar</b> (menú STARGATE → Guardar panel de control estándar). ¿Un profe quiere el suyo? Que duplique el Genially y pegue sus enlaces en <b>Panel de profes → Ajustes del PER</b>.'}
  ];
  var FINAL={p:'index.html',sel:'#hero-cta',pose:'pulgar',t:'Listo para el salto',x:'Eso es todo, Capitán. La nave es tuya. Y recuerda: <b>una obra que no se documenta, no existe</b>. Corto y cierro.'};
  function steps(){ return (localStorage.getItem(KEYR)==='ref' ? BASE.concat(REF) : BASE).concat([FINAL]); }
  var KEY='sgTourStep';
  function page(){var p=location.pathname.split('/').pop(); return p||'index.html';}
  function qs(){var m=location.search.match(/[?&]tour=(\d+)/); return m?parseInt(m[1],10):null;}
  var ov=null, recien=true, vigia=null, manual=false;
  ['wheel','touchstart','keydown'].forEach(function(ev){
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
    function ir(suave){var y=donde(tg), arriba=window.pageYOffset||document.documentElement.scrollTop||0;
      if(Math.abs(y-arriba)<6) return;
      try{window.scrollTo({top:y,behavior:suave?'smooth':'auto'});}catch(e){window.scrollTo(0,y);}}
    ir(!instante);
    // se reajusta un par de segundos por si la pagina crece por debajo, y se aparta en cuanto el
    // usuario toca la rueda: manda quien lee.
    var t=0;
    setTimeout(function(){ vigia=setInterval(function(){ t+=250;
      if(manual||t>2600){clearInterval(vigia); vigia=null; return;}
      ir(false); },250); }, instante?200:700);
  }
  function render(i){
    var S=steps(); var s=S[i]; if(!s) return end();
    if(s.p!==page()){localStorage.setItem(KEY,String(i)); location.href=s.p+'?tour='+i; return;}
    localStorage.setItem(KEY,String(i));
    clearTarget();
    var tg=document.querySelector(s.sel);
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
    else { ov.querySelector('.tour-prev').onclick=function(){render(i-1);};
           ov.querySelector('.tour-next').onclick=function(){ if(i===S.length-1) end(); else render(i+1);}; }
    ov.querySelector('.tour-exit').onclick=end;
    ov.classList.add('open');
    enfocar(tg,recien); recien=false;   // el panel ya esta puesto: ahora se sabe cuanto tapa
  }
  function end(){localStorage.removeItem(KEY); localStorage.setItem('sgTourDone','1'); clearTarget();
    if(ov){ov.classList.remove('open'); ov.innerHTML='';}
    if(qs()!==null) history.replaceState(null,'',location.pathname);}
  document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.tour-start'); if(b){e.preventDefault(); render(0);}});
  // al saltar de pagina en pagina, el navegador restaura SU scroll y se lleva por delante el nuestro
  var q=qs(); if(q!==null){ try{ if('scrollRestoration' in history) history.scrollRestoration='manual'; }catch(e){} render(q); }
  // primera visita a la portada: invitación discreta
  if(page()==='index.html' && q===null && !localStorage.getItem('sgTourDone') && !localStorage.getItem(KEY)){
    var inv=document.createElement('div'); inv.className='tour-invite';
    inv.innerHTML='<img src="assets/img/capitan/saluda.png" alt=""><div><b>¿Primera vez en el puesto de mando?</b><br>Te lo enseño en dos minutos.</div><button type="button" class="tour-start">Empezar</button><button type="button" class="x" aria-label="Cerrar">✕</button>';
    document.body.appendChild(inv);
    inv.querySelector('.x').onclick=function(){inv.remove(); localStorage.setItem('sgTourDone','1');};
    inv.querySelector('.tour-start').addEventListener('click',function(){inv.remove();});
  }
})();
